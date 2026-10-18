import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  createThingModelNativeClient,
  createOperationKey,
  ThingModelNativeError,
  type NativeClientOptions,
  type ModelDraft,
} from './thingmodel-native-transport'

const result = { status: 'SAVED', lifecycle: 'DRAFT', modelID: 'm1', draftRevision: 1, consumerState: 'NOT_REQUESTED', replayed: false }
const draft: ModelDraft = {
  name: 'Demo',
  fields: [
    { kind: 'TELEMETRY' as const, identifier: 'temperature', nameI18n: { default: 'Temperature' }, access: { read: true, write: false, observe: true }, valueType: { kind: 'FLOAT' as const, constraint: { min: -40, max: 100, precision: 1 } } },
    { kind: 'COMMAND' as const, identifier: 'setMode', nameI18n: { default: 'Set mode' }, access: { read: false, write: true, observe: false }, parameters: { schemaVersion: 1 as const, items: [{ identifier: 'mode', nameI18n: { default: 'Mode' }, valueType: { kind: 'ENUM' as const, baseKind: 'STRING' as const, enumValues: [{ code: 'auto', label: { default: 'Automatic' } }, { code: 2, label: { default: 'Manual' } }] } }] } },
  ],
}
const request: NativeClientOptions['fetch'] = async () => new Response(JSON.stringify(result), { status: 200, headers: { 'content-type': 'application/json' } })

function makeClient(fetcher: NativeClientOptions['fetch'] = request) {
  const seen: Array<{ path: string; init: RequestInit }> = []
  const options: NativeClientOptions = {
    fetch: async (input, init = {}) => {
      seen.push({ path: String(input), init })
      return fetcher(input, init)
    },
    getToken: () => 'secret-token-value',
    getLanguage: () => 'zh-CN',
  }
  return { client: createThingModelNativeClient(options), seen }
}

test('writes use canonical path, method, body, auth, language, and caller idempotency key', async () => {
  const { client, seen } = makeClient()
  const resources = { profile: { author: 'Ada', tags: ['sensor'], cover: './cover.png', version: '2.0', brand: 'TP', modelNumber: 'X1' }, webChartConfig: null, appChartConfig: null }
  await client.create({ model: draft, resources }, 'create-op-1')
  await client.update({ modelID: 'm1', expectedDraftRevision: 2, model: draft }, 'update-op-1')
  await client.publish({ modelID: 'm1', expectedDraftRevision: 3, expectedResourcesRevision: 4, changelog: 'release' }, 'publish-op-1')
  await client.getResources('m/1')
  await client.updateResources({ modelID: 'm1', expectedRevision: 4, resources }, 'resources-op-1')

  assert.deepEqual(seen.map(({ path }) => path), [
    '/api/v2/thing-model-commands/create',
    '/api/v2/thing-model-commands/update',
    '/api/v2/thing-model-commands/publish',
    '/api/v2/thing-models/m%2F1/resources',
    '/api/v2/thing-model-commands/update-resources',
  ])
  const expectedBodies = [
    { model: draft, resources },
    { modelID: 'm1', expectedDraftRevision: 2, model: draft },
    { modelID: 'm1', expectedDraftRevision: 3, expectedResourcesRevision: 4, changelog: 'release' },
    undefined,
    { modelID: 'm1', expectedRevision: 4, resources },
  ]
  for (const [index, item] of seen.entries()) {
    if (index === 3) {
      assert.equal(item.init.method, undefined)
      continue
    }
    assert.equal(item.init.method, 'POST')
    assert.deepEqual(JSON.parse(String(item.init.body)), expectedBodies[index])
    const headers = new Headers(item.init.headers)
    assert.equal(headers.get('Idempotency-Key'), ['create-op-1', 'update-op-1', 'publish-op-1', '', 'resources-op-1'][index])
    assert.equal(headers.get('Authorization'), 'Bearer secret-token-value')
    assert.equal(headers.get('Accept-Language'), 'zh-CN')
    assert.equal(headers.has('tenantID'), false)
  }
})

test('GET routes encode path segments and query values', async () => {
  const { client, seen } = makeClient()
  await client.list({ page: 2, pageSize: 40, query: 'a & b', kind: 'COMMAND', lifecycle: 'DRAFT' })
  await client.get('model/id with space')
  await client.versions('m/1', { page: 3, pageSize: 10 })
  await client.version('m/1', 9)
  assert.equal(seen[0].path, '/api/v2/thing-models?page=2&pageSize=40&query=a+%26+b&kind=COMMAND&lifecycle=DRAFT')
  assert.equal(seen[1].path, '/api/v2/thing-models/model%2Fid%20with%20space')
  assert.equal(seen[2].path, '/api/v2/thing-models/m%2F1/versions?page=3&pageSize=10')
  assert.equal(seen[3].path, '/api/v2/thing-models/m%2F1/versions/9')
  assert.ok(seen.every(({ init }) => init.method === undefined))
})

test('HTTP 401 and 409 remain typed errors; bearer token is redacted from errors', async () => {
  for (const status of [401, 409]) {
    const { client } = makeClient(async () => new Response(JSON.stringify({ code: 'ERR', message: `failure secret-token-value ${status}`, requestID: 'r1' }), { status }))
    await assert.rejects(client.create({ model: draft, resources: { profile: { author: '', tags: [], cover: '', version: '', brand: '', modelNumber: '' }, webChartConfig: null, appChartConfig: null } }, `operation-${status}`), (error: unknown) => {
      assert.ok(error instanceof ThingModelNativeError)
      assert.equal(error.status, status)
      assert.match(error.message, /failure \[redacted\]/)
      assert.doesNotMatch(error.message, /secret-token-value/)
      return true
    })
  }
})

test('network errors are surfaced safely, not retried, and key length is enforced before fetch', async () => {
  const { client, seen } = makeClient(async () => { throw new Error('secret-token-value socket failure') })
  await assert.rejects(client.publish({ modelID: 'm1', expectedDraftRevision: 1, expectedResourcesRevision: 1 }, 'operation-1'), /service is unreachable/)
  const resources = { profile: { author: '', tags: [], cover: '', version: '', brand: '', modelNumber: '' }, webChartConfig: null, appChartConfig: null }
  await assert.rejects(client.create({ model: draft, resources }, 'short'), /Idempotency-Key must be 8 to 128 characters/)
  await assert.rejects(client.create({ model: draft, resources }, 'x'.repeat(129)), /Idempotency-Key must be 8 to 128 characters/)
  assert.equal(seen.length, 1)
})

test('operation keys are UUIDs and malformed successful JSON is reported clearly', async () => {
  assert.match(createOperationKey(), /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
  const { client } = makeClient(async () => new Response('{broken', { status: 200 }))
  await assert.rejects(client.list(), /invalid JSON response/)
})
