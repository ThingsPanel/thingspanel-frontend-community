import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  createTemplateNativeClient,
  TemplateNativeError,
  type CreateDeviceAccessTemplate,
  type DeviceAccessTemplate,
  type DeviceAccessTemplatePage,
  type UpdateDeviceAccessTemplate
} from './template-native-transport'
import type { MetadataNativeHttpOptions } from './metadata-native-http'

const template: DeviceAccessTemplate = {
  id: 'template-1',
  tenantId: 'tenant-1',
  createdAt: '2026-10-26T00:00:00Z',
  updatedAt: '2026-10-26T00:00:00Z',
  createdBy: 'subject-1',
  updatedBy: 'subject-1',
  resourceVersion: 1,
  name: 'Gateway access',
  description: null,
  brand: null,
  productName: null,
  modelNumber: null,
  tags: [],
  configuration: {
    deviceKind: 'gateway',
    model: null,
    access: {
      mode: 'direct',
      protocol: 'mqtt',
      providerId: null,
      providerVersion: null,
      schemaDigest: '0'.repeat(64),
      parameters: {},
      credentialPolicy: { kind: 'none', autoRegister: false },
      onlinePolicy: { mode: 'transport', timeoutSeconds: 30 },
      connectionDirection: 'device_to_platform',
      serviceInstanceId: null
    },
    topicMappings: [],
    processingScripts: [],
    customFieldDefinitions: []
  },
  administrativeState: 'enabled',
  imageAssetId: null,
  deviceCount: 0
}
const page = { items: [template], page: 2, pageSize: 10, total: 11 } as DeviceAccessTemplatePage
const envelope = { data: template, meta: { requestId: 'template-request-1' } }
const createBody: CreateDeviceAccessTemplate = {
  name: template.name,
  configuration: template.configuration,
  imageAssetId: template.imageAssetId
}

function makeClient(fetcher: MetadataNativeHttpOptions['fetch']) {
  const seen: Array<{ path: string; init?: RequestInit }> = []
  const client = createTemplateNativeClient({
    fetch: async (input, init) => {
      seen.push({ path: String(input), init })
      return fetcher(input, init)
    },
    getToken: () => 'template-test-token',
    getLanguage: () => 'zh-CN'
  })
  return { client, seen }
}

test('template list serializes generated OAS filters and returns the data page', async () => {
  const { client, seen } = makeClient(
    async () => new Response(JSON.stringify({ data: page, meta: { requestId: 'r1' } }))
  )
  assert.deepEqual(
    await client.list({
      page: 2,
      pageSize: 10,
      search: 'pump & valve',
      deviceKind: 'gateway',
      protocol: 'mqtt',
      brand: 'Acme',
      tag: 'edge',
      modelId: 'model/1',
      administrativeState: 'enabled',
      sort: '-createdAt'
    }),
    page
  )
  assert.equal(seen.length, 1)
  const url = new URL(seen[0].path, 'http://local.test')
  assert.equal(url.pathname, '/api/v2/device-access-templates')
  assert.deepEqual(Object.fromEntries(url.searchParams), {
    page: '2',
    pageSize: '10',
    search: 'pump & valve',
    deviceKind: 'gateway',
    protocol: 'mqtt',
    brand: 'Acme',
    tag: 'edge',
    modelId: 'model/1',
    administrativeState: 'enabled',
    sort: '-createdAt'
  })
  const headers = new Headers(seen[0].init?.headers)
  assert.equal(seen[0].init?.method, 'GET')
  assert.equal(headers.get('Authorization'), 'Bearer template-test-token')
  assert.equal(headers.get('Accept-Language'), 'zh-CN')
  assert.equal(headers.get('Accept'), 'application/json, application/problem+json')
})

test('template get encodes the path and returns the strong ETag', async () => {
  const { client, seen } = makeClient(
    async () => new Response(JSON.stringify(envelope), { headers: { ETag: '"template-v3"' } })
  )
  assert.deepEqual(await client.get('template/with space'), { template, etag: '"template-v3"' })
  assert.equal(seen.length, 1)
  assert.equal(seen[0].path, '/api/v2/device-access-templates/template%2Fwith%20space')
  assert.equal(seen[0].init?.method, 'GET')
})

test('template errors preserve typed 401, 404, and 503 payloads and redact the token without retry', async () => {
  for (const [status, body] of [
    [401, { code: 'UNAUTHENTICATED', message: 'invalid template-test-token', details: null }],
    [
      404,
      {
        type: 'about:blank',
        title: 'Not Found',
        status: 404,
        detail: 'template missing',
        instance: '/t',
        code: 'NOT_FOUND',
        requestId: 'r404'
      }
    ],
    [
      503,
      {
        type: 'about:blank',
        title: 'Unavailable',
        status: 503,
        detail: 'retry later',
        instance: '/t',
        code: 'UNAVAILABLE',
        requestId: 'r503'
      }
    ]
  ] as const) {
    const { client, seen } = makeClient(
      async () =>
        new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/problem+json' } })
    )
    await assert.rejects(client.get('template-1'), error => {
      assert.ok(error instanceof TemplateNativeError)
      assert.equal(error.status, status)
      if ('message' in body) {
        assert.equal(error.body && 'message' in error.body ? error.body.message : undefined, 'invalid [redacted]')
      } else {
        assert.equal(error.code, body.code)
      }
      return true
    })
    assert.equal(seen.length, 1)
  }
})

test('template reads reject missing or weak ETags, malformed envelopes, and unexpected 2xx statuses', async () => {
  const missing = makeClient(async () => new Response(JSON.stringify(envelope)))
  await assert.rejects(missing.client.get('template-1'), /missing a strong ETag/)

  const weak = makeClient(async () => new Response(JSON.stringify(envelope), { headers: { ETag: 'W/"weak"' } }))
  await assert.rejects(weak.client.get('template-1'), /missing a strong ETag/)

  for (const invalidEtag of ['unquoted', '"open-quote', 'close-quote"']) {
    const invalid = makeClient(async () => new Response(JSON.stringify(envelope), { headers: { ETag: invalidEtag } }))
    await assert.rejects(invalid.client.get('template-1'), /missing a strong ETag/)
  }

  for (const status of [201, 202]) {
    const { client, seen } = makeClient(
      async () => new Response(JSON.stringify({ data: page, meta: { requestId: 'r2' } }), { status })
    )
    await assert.rejects(client.list(), error => {
      assert.ok(error instanceof TemplateNativeError)
      assert.equal(error.status, status)
      return true
    })
    assert.equal(seen.length, 1)
  }

  const malformed = makeClient(async () => new Response(JSON.stringify({ data: page, meta: {} })))
  await assert.rejects(malformed.client.list(), /invalid data\/meta response/)
})

test('template create sends generated body and idempotency key, validates matching Location, and does not redirect', async () => {
  const { client, seen } = makeClient(
    async () =>
      new Response(JSON.stringify(envelope), {
        status: 201,
        headers: { Location: '/api/v2/device-access-templates/template-1', ETag: '"template-v1"' }
      })
  )
  assert.deepEqual(await client.create(createBody, 'create-template-key-1'), {
    template,
    etag: '"template-v1"',
    location: '/api/v2/device-access-templates/template-1'
  })
  assert.equal(seen.length, 1)
  assert.equal(seen[0].path, '/api/v2/device-access-templates')
  assert.equal(seen[0].init?.method, 'POST')
  assert.equal(seen[0].init?.redirect, 'manual')
  assert.deepEqual(JSON.parse(String(seen[0].init?.body)), createBody)
  const headers = new Headers(seen[0].init?.headers)
  assert.equal(headers.get('Idempotency-Key'), 'create-template-key-1')
  assert.equal(headers.get('Content-Type'), 'application/json')
  assert.equal(headers.get('Authorization'), 'Bearer template-test-token')
  assert.equal(headers.get('Accept-Language'), 'zh-CN')

  const mismatch = makeClient(
    async () =>
      new Response(JSON.stringify(envelope), {
        status: 201,
        headers: { Location: '/api/v2/device-access-templates/other-template' }
      })
  )
  await assert.rejects(mismatch.client.create(createBody, 'create-template-key-2'), /Location does not match/)
  assert.equal(mismatch.seen.length, 1)
})

test('template update sends generated partial body with strong If-Match and preserves 412 without retry', async () => {
  const body: UpdateDeviceAccessTemplate = { name: 'Gateway access v2', configuration: template.configuration }
  const problem = {
    type: 'about:blank',
    title: 'Precondition Failed',
    status: 412,
    detail: 'template changed',
    instance: '/api/v2/device-access-templates/template-1',
    code: 'FAILED_PRECONDITION',
    requestId: 'template-request-412'
  }
  const { client, seen } = makeClient(
    async () =>
      new Response(JSON.stringify(problem), {
        status: 412,
        headers: { 'Content-Type': 'application/problem+json' }
      })
  )
  await assert.rejects(client.update('template-1', body, '"template-v1"', 'update-template-key-1'), error => {
    assert.ok(error instanceof TemplateNativeError)
    assert.equal(error.status, 412)
    assert.equal(error.code, 'FAILED_PRECONDITION')
    assert.equal(error.body && 'detail' in error.body ? error.body.detail : undefined, 'template changed')
    return true
  })
  assert.equal(seen.length, 1)
  assert.equal(seen[0].path, '/api/v2/device-access-templates/template-1')
  assert.equal(seen[0].init?.method, 'PATCH')
  assert.equal(seen[0].init?.redirect, 'manual')
  assert.deepEqual(JSON.parse(String(seen[0].init?.body)), body)
  const headers = new Headers(seen[0].init?.headers)
  assert.equal(headers.get('If-Match'), '"template-v1"')
  assert.equal(headers.get('Idempotency-Key'), 'update-template-key-1')
})
