import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  createDeviceGroupNativeClient,
  createDeviceGroupOperationKey,
  DeviceGroupNativeError,
  type DeviceGroup,
  type DeviceGroupNativeOptions
} from './device-group-native-transport'

const group: DeviceGroup = {
  id: 'group-1',
  tenantId: 'tenant-1',
  createdAt: '2026-10-26T00:00:00Z',
  updatedAt: '2026-10-26T00:00:00Z',
  createdBy: 'user-1',
  updatedBy: 'user-1',
  resourceVersion: 2,
  name: 'Root',
  description: null,
  parentId: null,
  sortOrder: 0,
  directDeviceCount: 0,
  descendantDeviceCount: 0,
  subtreeDeviceCount: 0,
  path: [],
  pathComplete: true,
  activeAlarmCount: null,
  alarmsObservedAt: null
}

function makeClient(fetcher: DeviceGroupNativeOptions['fetch'] = async () => new Response('{}')) {
  const seen: Array<{ path: string; init: RequestInit }> = []
  const client = createDeviceGroupNativeClient({
    fetch: async (input, init = {}) => {
      seen.push({ path: String(input), init })
      return fetcher(input, init)
    },
    getToken: () => 'secret-token',
    getLanguage: () => 'zh-CN'
  })
  return { client, seen }
}

test('list uses native camelCase pagination and rootOnly semantics', async () => {
  const page = { items: [group], page: 2, pageSize: 10, total: 11 }
  const { client, seen } = makeClient(
    async () => new Response(JSON.stringify({ data: page, meta: { requestId: 'r1' } }))
  )
  assert.deepEqual(await client.list({ page: 2, pageSize: 10, rootOnly: true, search: 'a & b' }), page)
  assert.equal(seen[0].path, '/api/v2/device-groups?page=2&pageSize=10&rootOnly=true&search=a+%26+b')
  const headers = new Headers(seen[0].init.headers)
  assert.equal(headers.get('Authorization'), 'Bearer secret-token')
  assert.equal(headers.get('Accept-Language'), 'zh-CN')
})

test('list supports direct-child filtering for group detail pages', async () => {
  const page = { items: [group], page: 3, pageSize: 15, total: 1 }
  const { client, seen } = makeClient(
    async () => new Response(JSON.stringify({ data: page, meta: { requestId: 'r1' } }))
  )
  assert.deepEqual(await client.list({ parentId: 'group-1', page: 3, pageSize: 15 }), page)
  assert.equal(seen[0].path, '/api/v2/device-groups?parentId=group-1&page=3&pageSize=15')
})

test('member queries preserve OAS filters and membership writes preserve expected version and idempotency key', async () => {
  const page = { items: [], page: 2, pageSize: 25, total: 0 }
  const calls: Response[] = [
    new Response(JSON.stringify({ data: page, meta: { requestId: 'r1' } })),
    new Response(JSON.stringify({ data: group, meta: { requestId: 'r2' } })),
    new Response(JSON.stringify({ data: group, meta: { requestId: 'r3' } })),
    new Response(JSON.stringify({ data: group, meta: { requestId: 'r4' } }))
  ]
  const { client, seen } = makeClient(async () => calls.shift()!)
  const body = { deviceIds: ['device-1', 'device-2'], expectedGroupVersion: 7 }
  const key = 'member-operation-1'

  assert.deepEqual(
    await client.members('group/1', { page: 2, pageSize: 25, includeDescendants: false, search: 'pump' }),
    page
  )
  await client.addMembers('group/1', body, key)
  await client.addMembers('group/1', body, key)
  await client.removeMembers('group/1', body, key)

  assert.equal(
    seen[0].path,
    '/api/v2/device-groups/group%2F1/members?page=2&pageSize=25&includeDescendants=false&search=pump'
  )
  assert.equal(seen[1].path, '/api/v2/device-groups/group%2F1/member-additions')
  assert.equal(seen[2].path, seen[1].path)
  assert.equal(seen[3].path, '/api/v2/device-groups/group%2F1/member-removals')
  for (const call of seen.slice(1)) {
    assert.equal(new Headers(call.init.headers).get('Idempotency-Key'), key)
    assert.deepEqual(JSON.parse(String(call.init.body)), body)
  }
})

test('member write 503 remains a typed failure with no legacy fallback request', async () => {
  const { client, seen } = makeClient(
    async () =>
      new Response(
        JSON.stringify({
          type: 'about:blank',
          title: 'Unavailable',
          status: 503,
          detail: 'try later',
          instance: '/i',
          code: 'UNAVAILABLE',
          requestId: 'r1'
        }),
        { status: 503, headers: { 'Content-Type': 'application/problem+json' } }
      )
  )

  await assert.rejects(
    client.addMembers('group-1', { deviceIds: ['device-1'], expectedGroupVersion: 8 }, 'member-operation-2'),
    error => {
      assert.ok(error instanceof DeviceGroupNativeError)
      assert.equal(error.status, 503)
      return true
    }
  )
  assert.equal(seen.length, 1)
  assert.equal(seen[0].path, '/api/v2/device-groups/group-1/member-additions')
})

test('create, PATCH, move, and DELETE use formal routes, stable keys, and current ETags', async () => {
  const calls: Response[] = [
    new Response(JSON.stringify({ data: group, meta: { requestId: 'r1' } }), { status: 201 }),
    new Response(JSON.stringify({ data: group, meta: { requestId: 'r2' } }), {
      status: 200,
      headers: { ETag: '"v2"' }
    }),
    new Response(JSON.stringify({ data: group, meta: { requestId: 'r3' } }), {
      status: 200,
      headers: { ETag: '"v3"' }
    }),
    new Response(JSON.stringify({ data: group, meta: { requestId: 'r4' } }), {
      status: 200,
      headers: { ETag: '"v2"' }
    }),
    new Response(JSON.stringify({ data: group, meta: { requestId: 'r5' } }), { status: 200 })
  ]
  const { client, seen } = makeClient(async () => calls.shift()!)
  const key = 'user-operation-1'
  await client.create({ name: 'Root', description: null, parentId: null, sortOrder: 0 }, key)
  const current = await client.get('group/1')
  const updated = await client.update(current.group.id, { name: 'Renamed' }, current.etag, key)
  await client.move(current.group.id, { parentId: null, expectedResourceVersion: 2 }, key)
  await client.delete(current.group.id, updated.etag, key)

  assert.deepEqual(
    seen.map(call => call.path),
    [
      '/api/v2/device-groups',
      '/api/v2/device-groups/group%2F1',
      '/api/v2/device-groups/group-1',
      '/api/v2/device-groups/group-1/moves',
      '/api/v2/device-groups/group-1'
    ]
  )
  assert.deepEqual(
    seen.map(({ init }) => init.method),
    ['POST', undefined, 'PATCH', 'POST', 'DELETE']
  )
  for (const call of [seen[0], seen[2], seen[3], seen[4]]) {
    assert.equal(new Headers(call.init.headers).get('Idempotency-Key'), key)
  }
  assert.equal(new Headers(seen[2].init.headers).get('If-Match'), '"v2"')
  assert.equal(new Headers(seen[4].init.headers).get('If-Match'), '"v3"')
  assert.deepEqual(JSON.parse(String(seen[0].init.body)), {
    name: 'Root',
    description: null,
    parentId: null,
    sortOrder: 0
  })
  assert.deepEqual(JSON.parse(String(seen[3].init.body)), { parentId: null, expectedResourceVersion: 2 })
})

test('tree unwraps data and validates strong ETags for resource reads', async () => {
  const tree = { nodes: [], truncated: false }
  const { client, seen } = makeClient(
    async () => new Response(JSON.stringify({ data: tree, meta: { requestId: 'r1' } }))
  )
  assert.deepEqual(await client.tree(32), tree)
  assert.equal(seen[0].path, '/api/v2/device-group-tree?maxDepth=32')
  await assert.rejects(client.get('group-1'), /missing a strong ETag/)
})

test('rejects success envelopes that omit contract metadata', async () => {
  const { client } = makeClient(
    async () => new Response(JSON.stringify({ data: { items: [], page: 1, pageSize: 10, total: 0 } }))
  )
  await assert.rejects(client.list({ page: 1, pageSize: 10, rootOnly: true }), /invalid data\/meta response/)
})

test('RFC 9457 and Encore auth failures remain typed and redact bearer tokens', async () => {
  const problem = {
    type: 'about:blank',
    title: 'Conflict',
    status: 409,
    detail: 'token secret-token denied',
    instance: '/i',
    code: 'VERSION_CONFLICT',
    requestId: 'r1'
  }
  const { client } = makeClient(
    async () =>
      new Response(JSON.stringify(problem), { status: 409, headers: { 'Content-Type': 'application/problem+json' } })
  )
  await assert.rejects(client.list({ page: 1, pageSize: 10, rootOnly: true }), error => {
    assert.ok(error instanceof DeviceGroupNativeError)
    assert.equal(error.status, 409)
    assert.equal(error.code, 'VERSION_CONFLICT')
    assert.equal(error.message, 'token [redacted] denied')
    return true
  })

  const auth = { code: 'unauthorized', message: 'secret-token expired', details: {} }
  const authClient = makeClient(async () => new Response(JSON.stringify(auth), { status: 401 }))
  await assert.rejects(authClient.client.list({ page: 1, pageSize: 10, rootOnly: true }), error => {
    assert.ok(error instanceof DeviceGroupNativeError)
    assert.equal(error.code, 'unauthorized')
    assert.equal(error.message, '[redacted] expired')
    return true
  })
})

test('operation key uses secure random UUID v4', () => {
  assert.match(
    createDeviceGroupOperationKey(),
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  )
})
