import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  createDeviceNativeClient,
  DeviceNativeError,
  type CreateDevice,
  type DeviceNativeOptions,
  type UpdateDevice
} from './device-native-transport'

function makeClient(fetcher: DeviceNativeOptions['fetch']) {
  const seen: Array<{ path: string; init?: RequestInit }> = []
  const client = createDeviceNativeClient({
    fetch: async (input, init) => {
      seen.push({ path: String(input), init })
      return fetcher(input, init)
    },
    getToken: () => 'native-token',
    getLanguage: () => 'zh-CN'
  })
  return { client, seen }
}

test('device list serializes generated OAS query and attaches existing auth context', async () => {
  const page = { items: [], page: 2, pageSize: 20, total: 0 }
  const { client, seen } = makeClient(
    async () => new Response(JSON.stringify({ data: page, meta: { requestId: 'r1' } }))
  )
  assert.deepEqual(
    await client.list({
      page: 2,
      pageSize: 20,
      groupId: 'group/1',
      includeDescendants: true,
      search: 'pump & valve'
    }),
    page
  )
  const requestUrl = new URL(seen[0].path, 'http://local.test')
  assert.equal(requestUrl.pathname, '/api/v2/devices')
  assert.deepEqual(Object.fromEntries(requestUrl.searchParams), {
    page: '2',
    pageSize: '20',
    groupId: 'group/1',
    includeDescendants: 'true',
    search: 'pump & valve'
  })
  const headers = new Headers(seen[0].init?.headers)
  assert.equal(headers.get('Authorization'), 'Bearer native-token')
  assert.equal(headers.get('Accept-Language'), 'zh-CN')
})

test('device list 503 stays typed and sends no legacy fallback request', async () => {
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
  await assert.rejects(client.list({ page: 1, pageSize: 10 }), error => {
    assert.ok(error instanceof DeviceNativeError)
    assert.equal(error.status, 503)
    return true
  })
  assert.equal(seen.length, 1)
  assert.equal(seen[0].path, '/api/v2/devices?page=1&pageSize=10')
})

test('subdevice list calls the scoped native endpoint and preserves pagination', async () => {
  const page = { items: [], page: 2, pageSize: 20, total: 22 }
  const { client, seen } = makeClient(
    async () => new Response(JSON.stringify({ data: page, meta: { requestId: 'r1' } }))
  )
  assert.deepEqual(await client.listSubdevices('gateway-1', { page: 2, pageSize: 20, search: 'a & b' }), page)
  const url = new URL(seen[0].path, 'http://local.test')
  assert.equal(url.pathname, '/api/v2/devices/gateway-1/subdevices')
  assert.deepEqual(Object.fromEntries(url.searchParams), { page: '2', pageSize: '20', search: 'a & b' })
  assert.equal(new Headers(seen[0].init?.headers).get('Authorization'), 'Bearer native-token')
})

test('device statistics preserves unobserved runtime and alarm counts as unknown', async () => {
  const statistics = {
    total: 6,
    enabled: 5,
    disabled: 1,
    active: 2,
    inactive: 4,
    ungrouped: 3,
    runtime: { online: null, offline: null, unknown: 6, observedAt: null },
    alarms: { affectedDevices: null, activeAlarms: null, observedAt: null }
  }
  const { client, seen } = makeClient(
    async () => new Response(JSON.stringify({ data: statistics, meta: { requestId: 'stats-1' } }))
  )
  assert.deepEqual(await client.statistics({ groupId: 'root-1', includeDescendants: true }), statistics)
  assert.equal(seen.length, 1)
  assert.equal(seen[0].path, '/api/v2/device-statistics?groupId=root-1&includeDescendants=true')
})

const device = {
  id: '7c1bdb51-842a-4baa-8f58-4cb27f7132fd',
  tenantId: 'c1a9ba9a-32f5-4878-a2d6-580b0f07d174',
  createdAt: '2026-10-26T00:00:00Z',
  updatedAt: '2026-10-26T00:00:00Z',
  createdBy: 'subject-1',
  updatedBy: 'subject-1',
  resourceVersion: 1,
  name: 'Pump',
  deviceNumber: 'pump-1',
  deviceKind: 'standalone',
  productId: null,
  description: null,
  labels: {},
  location: null,
  templateId: null,
  modelBinding: null,
  administrativeState: 'enabled',
  activationState: 'inactive',
  activatedAt: null,
  gatewayId: null,
  runtimeRef: null,
  tags: [],
  customFields: {},
  batchNumber: null
}
const envelope = { data: device, meta: { requestId: 'device-request-1' } }

test('device get encodes the id and returns the server strong ETag', async () => {
  const { client, seen } = makeClient(
    async () => new Response(JSON.stringify(envelope), { headers: { ETag: '"sha256-device-v1"' } })
  )
  const result = await client.get('device/with space')
  assert.deepEqual(result, { device, etag: '"sha256-device-v1"' })
  assert.equal(seen.length, 1)
  assert.equal(seen[0].path, '/api/v2/devices/device%2Fwith%20space')
  assert.equal(seen[0].init?.method, 'GET')
  const headers = new Headers(seen[0].init?.headers)
  assert.equal(headers.get('Authorization'), 'Bearer native-token')
  assert.equal(headers.get('Accept-Language'), 'zh-CN')
})

test('device template binding read uses the generated route and returns its strong ETag', async () => {
  const binding = {
    deviceId: 'device-1',
    templateId: 'template-1',
    modelBinding: null,
    configurationGeneration: 2,
    resourceVersion: 4,
    directAccess: null,
    deviceParameters: { sampleRate: 5 }
  }
  const { client, seen } = makeClient(
    async () =>
      new Response(JSON.stringify({ data: binding, meta: { requestId: 'binding-request-1' } }), {
        headers: { ETag: '"sha256-binding-v4"' }
      })
  )

  assert.deepEqual(await client.readTemplateBinding('device/with space'), {
    binding,
    etag: '"sha256-binding-v4"'
  })
  assert.equal(seen.length, 1)
  assert.equal(seen[0].path, '/api/v2/devices/device%2Fwith%20space/template-binding')
  assert.equal(seen[0].init?.method, 'GET')
  assert.equal(seen[0].init?.redirect, 'manual')
  const headers = new Headers(seen[0].init?.headers)
  assert.equal(headers.get('Authorization'), 'Bearer native-token')
  assert.equal(headers.get('Accept-Language'), 'zh-CN')
})

test('device template binding read preserves 403/404 errors and does not retry or redirect', async () => {
  for (const status of [403, 404]) {
    const problem = {
      type: 'about:blank',
      title: status === 403 ? 'Forbidden' : 'Not Found',
      status,
      detail: 'binding unavailable',
      instance: '/api/v2/devices/device-1/template-binding',
      code: status === 403 ? 'FORBIDDEN' : 'NOT_FOUND',
      requestId: `binding-request-${status}`
    }
    const { client, seen } = makeClient(
      async () =>
        new Response(JSON.stringify(problem), {
          status,
          headers: { 'Content-Type': 'application/problem+json' }
        })
    )

    await assert.rejects(client.readTemplateBinding('device-1'), error => {
      assert.ok(error instanceof DeviceNativeError)
      assert.equal(error.status, status)
      assert.equal(error.code, problem.code)
      return true
    })
    assert.equal(seen.length, 1)
    assert.equal(seen[0].init?.redirect, 'manual')
  }

  const redirected = makeClient(
    async () =>
      new Response(null, {
        status: 302,
        headers: { Location: 'https://elsewhere.invalid/template-binding' }
      })
  )
  await assert.rejects(redirected.client.readTemplateBinding('device-1'), error => {
    assert.ok(error instanceof DeviceNativeError)
    assert.equal(error.status, 302)
    return true
  })
  assert.equal(redirected.seen.length, 1)
  assert.equal(redirected.seen[0].init?.redirect, 'manual')
})

test('device template binding read rejects missing and weak ETags', async () => {
  const body = { data: { deviceId: 'device-1' }, meta: { requestId: 'binding-request-1' } }
  const missing = makeClient(async () => new Response(JSON.stringify(body)))
  await assert.rejects(missing.client.readTemplateBinding('device-1'), /missing a strong ETag/)

  const weak = makeClient(async () => new Response(JSON.stringify(body), { headers: { ETag: 'W/"weak"' } }))
  await assert.rejects(weak.client.readTemplateBinding('device-1'), /missing a strong ETag/)
})

test('device create sends generated body and explicit idempotency key without retry', async () => {
  const body: CreateDevice = {
    name: 'Pump',
    deviceNumber: 'pump-1',
    deviceKind: 'standalone',
    initialAdministrativeState: 'enabled'
  }
  const { client, seen } = makeClient(
    async () =>
      new Response(JSON.stringify(envelope), {
        status: 201,
        headers: { Location: `/api/v2/devices/${device.id}` }
      })
  )
  const result = await client.create(body, 'create-device-key-1')
  assert.deepEqual(result, { device, location: `/api/v2/devices/${device.id}` })
  assert.equal(seen.length, 1)
  assert.equal(seen[0].path, '/api/v2/devices')
  assert.equal(seen[0].init?.method, 'POST')
  assert.deepEqual(JSON.parse(String(seen[0].init?.body)), body)
  const headers = new Headers(seen[0].init?.headers)
  assert.equal(headers.get('Idempotency-Key'), 'create-device-key-1')
  assert.equal(headers.get('Content-Type'), 'application/json')
  assert.equal(headers.get('Authorization'), 'Bearer native-token')
  assert.equal(headers.get('Accept-Language'), 'zh-CN')
})

test('device create rejects malformed created-device data and a mismatched Location without retry', async () => {
  const malformedDevice = { ...device, activationState: 'pending' }
  const malformed = makeClient(
    async () =>
      new Response(JSON.stringify({ data: malformedDevice, meta: { requestId: 'create-malformed-1' } }), {
        status: 201,
        headers: { Location: `/api/v2/devices/${device.id}` }
      })
  )
  await assert.rejects(
    malformed.client.create(
      { name: 'Pump', deviceKind: 'standalone', initialAdministrativeState: 'enabled' },
      'create-device-malformed-1'
    ),
    /invalid created device/
  )
  assert.equal(malformed.seen.length, 1)

  const mismatchedLocation = makeClient(
    async () =>
      new Response(JSON.stringify(envelope), {
        status: 201,
        headers: { Location: '/api/v2/devices/11111111-1111-4111-8111-111111111111' }
      })
  )
  await assert.rejects(
    mismatchedLocation.client.create(
      { name: 'Pump', deviceKind: 'standalone', initialAdministrativeState: 'enabled' },
      'create-device-location-1'
    ),
    /Location does not match/
  )
  assert.equal(mismatchedLocation.seen.length, 1)
})

test('device update sends encoded path, body, key and strong If-Match; 412 remains typed', async () => {
  const body: UpdateDevice = { description: null, labels: { area: 'north' } }
  const problem = {
    type: 'about:blank',
    title: 'Precondition Failed',
    status: 412,
    detail: 'device has changed',
    instance: '/api/v2/devices/device%2F1',
    code: 'FAILED_PRECONDITION',
    requestId: 'device-request-412'
  }
  const { client, seen } = makeClient(
    async () =>
      new Response(JSON.stringify(problem), { status: 412, headers: { 'Content-Type': 'application/problem+json' } })
  )
  await assert.rejects(client.update('device/1', body, '"etag-v1"', 'update-device-key-1'), error => {
    assert.ok(error instanceof DeviceNativeError)
    assert.equal(error.status, 412)
    assert.equal(error.code, 'FAILED_PRECONDITION')
    assert.equal(error.body && 'detail' in error.body ? error.body.detail : undefined, 'device has changed')
    return true
  })
  assert.equal(seen.length, 1)
  assert.equal(seen[0].path, '/api/v2/devices/device%2F1')
  assert.equal(seen[0].init?.method, 'PATCH')
  assert.deepEqual(JSON.parse(String(seen[0].init?.body)), body)
  const headers = new Headers(seen[0].init?.headers)
  assert.equal(headers.get('If-Match'), '"etag-v1"')
  assert.equal(headers.get('Idempotency-Key'), 'update-device-key-1')
})

test('device update returns the response device and rotated strong ETag', async () => {
  const body: UpdateDevice = { name: 'Pump 2' }
  const updated = { ...device, name: 'Pump 2', resourceVersion: 2 }
  const { client, seen } = makeClient(
    async () =>
      new Response(JSON.stringify({ data: updated, meta: { requestId: 'device-request-2' } }), {
        headers: { ETag: '"sha256-device-v2"' }
      })
  )
  const result = await client.update('device-1', body, '"sha256-device-v1"', 'update-device-key-3')
  assert.deepEqual(result, { device: updated, etag: '"sha256-device-v2"' })
  assert.equal(seen.length, 1)
  assert.equal(seen[0].init?.method, 'PATCH')
})

test('device create and update expose typed 422 field errors', async () => {
  const problem = {
    type: 'about:blank',
    title: 'Unprocessable Entity',
    status: 422,
    detail: 'one or more device fields are invalid',
    instance: '/api/v2/devices',
    code: 'invalid_device_field',
    requestId: 'device-request-422',
    errors: [{ pointer: '/name', code: 'invalid_value', message: 'is invalid' }]
  }
  const { client } = makeClient(
    async () =>
      new Response(JSON.stringify(problem), { status: 422, headers: { 'Content-Type': 'application/problem+json' } })
  )
  await assert.rejects(
    client.create(
      { name: '', deviceNumber: 'pump-1', deviceKind: 'standalone', initialAdministrativeState: 'enabled' },
      'create-device-key-2'
    ),
    error => {
      assert.ok(error instanceof DeviceNativeError)
      assert.equal(error.status, 422)
      assert.equal(error.code, 'invalid_device_field')
      assert.deepEqual(error.body && 'errors' in error.body ? error.body.errors : undefined, problem.errors)
      return true
    }
  )
})

test('device mutation methods reject contract-wrong 2xx statuses without retry', async () => {
  const createBody: CreateDevice = {
    name: 'Pump',
    deviceNumber: 'pump-1',
    deviceKind: 'standalone',
    initialAdministrativeState: 'enabled'
  }
  for (const status of [200, 202]) {
    const { client, seen } = makeClient(
      async () => new Response(JSON.stringify(envelope), { status, headers: { Location: '/api/v2/devices/device-1' } })
    )
    await assert.rejects(client.create(createBody, `create-device-status-${status}`), error => {
      assert.ok(error instanceof DeviceNativeError)
      assert.equal(error.status, status)
      return true
    })
    assert.equal(seen.length, 1)
  }

  const { client, seen } = makeClient(
    async () => new Response(JSON.stringify(envelope), { status: 202, headers: { ETag: '"etag-v2"' } })
  )
  await assert.rejects(
    client.update('device-1', { name: 'Pump 2' }, '"etag-v1"', 'update-device-status-202'),
    error => {
      assert.ok(error instanceof DeviceNativeError)
      assert.equal(error.status, 202)
      return true
    }
  )
  assert.equal(seen.length, 1)
})

test('device reads reject missing or weak ETags and writes reject missing Location or unsafe preconditions', async () => {
  const body: UpdateDevice = { name: 'Pump 2' }
  const noEtag = makeClient(async () => new Response(JSON.stringify(envelope)))
  await assert.rejects(noEtag.client.get('device-1'), /missing a strong ETag/)

  const weakEtag = makeClient(async () => new Response(JSON.stringify(envelope), { headers: { ETag: 'W/"weak"' } }))
  await assert.rejects(weakEtag.client.get('device-1'), /missing a strong ETag/)

  const noLocation = makeClient(async () => new Response(JSON.stringify(envelope), { status: 201 }))
  await assert.rejects(
    noLocation.client.create(
      { name: 'Pump', deviceNumber: 'pump-1', deviceKind: 'standalone', initialAdministrativeState: 'enabled' },
      'create-device-key-3'
    ),
    /missing Location/
  )

  const noFetch = makeClient(async () => new Response(JSON.stringify(envelope), { headers: { ETag: '"etag"' } }))
  await assert.rejects(
    noFetch.client.update('device-1', body, 'W/"weak"', 'update-device-key-2'),
    /missing a strong ETag/
  )
  await assert.rejects(
    noFetch.client.update('device-1', body, '"bad,etag"', 'update-device-key-3'),
    /missing a strong ETag/
  )
  await assert.rejects(
    noFetch.client.update('device-1', body, 'unquoted', 'update-device-key-unquoted'),
    /missing a strong ETag/
  )
  await assert.rejects(
    noFetch.client.update('device-1', body, '"one-sided', 'update-device-key-open-quote'),
    /missing a strong ETag/
  )
  await assert.rejects(
    noFetch.client.update('device-1', body, 'one-sided"', 'update-device-key-close-quote'),
    /missing a strong ETag/
  )
  await assert.rejects(
    noFetch.client.update('device-1', body, '"bad\netag"', 'update-device-key-4'),
    /missing a strong ETag/
  )
  await assert.rejects(
    noFetch.client.create(
      { name: 'Pump', deviceNumber: 'pump-2', deviceKind: 'standalone', initialAdministrativeState: 'enabled' },
      'short'
    ),
    /Idempotency-Key/
  )
  assert.equal(noFetch.seen.length, 0)
})

test('device number check posts the number to the native endpoint and returns availability', async () => {
  const { client, seen } = makeClient(
    async () =>
      new Response(JSON.stringify({ data: { deviceNumber: 'SN-1', available: false }, meta: { requestId: 'r2' } }))
  )
  assert.deepEqual(await client.checkNumber('SN-1', '11111111-1111-4111-8111-111111111111'), {
    deviceNumber: 'SN-1',
    available: false
  })
  assert.equal(new URL(seen[0].path, 'http://local.test').pathname, '/api/v2/device-number-validations')
  assert.equal(seen[0].init?.method, 'POST')
  assert.deepEqual(JSON.parse(String(seen[0].init?.body)), {
    deviceNumber: 'SN-1',
    excludeDeviceId: '11111111-1111-4111-8111-111111111111'
  })
})
