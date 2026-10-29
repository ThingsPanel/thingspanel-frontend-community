import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  createDeviceCredentialNativeClient,
  DeviceCredentialNativeError,
  type CreateDeviceCredential,
  type DeviceCredentialNativeClient,
  type DeviceCredentialSummaryPage
} from './device-credentials-native-transport'

const deviceId = '7c1bdb51-842a-4baa-8f58-4cb27f7132fd'
const credentialId = '78fa90b0-bb2a-4628-a956-aa92e920bd11'
const path = `/api/v2/devices/${deviceId}/credentials`

function makeClient(fetcher: typeof globalThis.fetch) {
  const seen: Array<{ input: RequestInfo | URL; init?: RequestInit }> = []
  const client = createDeviceCredentialNativeClient({
    fetch: async (input, init) => {
      seen.push({ input, init })
      return fetcher(input, init)
    },
    getToken: () => 'credential-native-token',
    getLanguage: () => 'zh-CN'
  })
  return { client, seen }
}

function summary(overrides: Record<string, unknown> = {}) {
  return {
    id: credentialId,
    deviceId,
    kind: 'token',
    status: 'pending',
    publicIdentifier: null,
    fingerprint: 'a'.repeat(64),
    createdAt: '2026-10-27T01:00:00Z',
    revokedAt: null,
    ...overrides
  }
}

function secretEnvelope(overrides: Record<string, unknown> = {}) {
  return {
    data: {
      credential: summary(),
      secret: 'sensitive-credential-fixture-never-log',
      expiresAt: '2026-10-27T01:10:00Z',
      ...overrides
    },
    meta: { requestId: 'credential-request-1' }
  }
}

function createdResponse(
  envelope: unknown = secretEnvelope(),
  location: string | null = `${path}/${credentialId}`,
  cacheControl = 'private, no-store',
  status = 201
): Response {
  const headers = new Headers({ 'Cache-Control': cacheControl })
  if (location !== null) headers.set('Location', location)
  return new Response(JSON.stringify(envelope), {
    status,
    headers
  })
}

test('credential list uses generated page schema, query, auth, and rejects redirects', async () => {
  const page: DeviceCredentialSummaryPage = { items: [summary() as never], page: 2, pageSize: 5, total: 8 }
  const { client, seen } = makeClient(
    async () => new Response(JSON.stringify({ data: page, meta: { requestId: 'list-1' } }))
  )

  const result = await client.list(deviceId.toUpperCase(), { page: 2, pageSize: 5 })
  assert.deepEqual(result, page)
  assert.equal(seen.length, 1)
  assert.equal(String(seen[0].input), `${path}?page=2&pageSize=5`)
  assert.equal(seen[0].init?.method, 'GET')
  assert.equal(seen[0].init?.redirect, 'error')
  const headers = new Headers(seen[0].init?.headers)
  assert.equal(headers.get('Authorization'), 'Bearer credential-native-token')
  assert.equal(headers.get('Accept-Language'), 'zh-CN')
})

test('credential create uses one request, same key, no-store, and verifies owner and Location', async () => {
  const secret = 'sensitive-credential-fixture-never-log'
  const body: CreateDeviceCredential = { kind: 'token', secret }
  const { client, seen } = makeClient(async () => createdResponse())
  const originalLog = console.log
  const logged: unknown[][] = []
  console.log = (...args: unknown[]) => logged.push(args)
  let first: Awaited<ReturnType<DeviceCredentialNativeClient['create']>>
  let second: Awaited<ReturnType<DeviceCredentialNativeClient['create']>>
  try {
    first = await client.create(deviceId, body, 'credential-key-001')
    second = await client.create(deviceId, body, 'credential-key-001')
  } finally {
    console.log = originalLog
  }
  assert.ok(first.credential.secret === secret)
  assert.ok(second.credential.secret === secret)
  assert.equal(first.location, `${path}/${credentialId}`)
  assert.equal(first.requestId, 'credential-request-1')
  assert.equal(seen.length, 2)
  for (const call of seen) {
    assert.equal(String(call.input), path)
    assert.equal(call.init?.method, 'POST')
    assert.equal(call.init?.redirect, 'error')
    assert.equal(call.init?.cache, 'no-store')
    const headers = new Headers(call.init?.headers)
    assert.equal(headers.get('Idempotency-Key'), 'credential-key-001')
    assert.equal(headers.get('Cache-Control'), 'no-store')
    assert.equal(headers.get('Authorization'), 'Bearer credential-native-token')
    const posted = JSON.parse(String(call.init?.body)) as CreateDeviceCredential
    assert.ok(posted.secret === secret)
  }
  assert.equal(logged.length, 0)
})

test('credential create validates 201 payload, owner, Location, cache policy and marks malformed success unknown', async () => {
  const malformed = makeClient(async () => createdResponse({ data: {}, meta: { requestId: 'r' } }))
  await assert.rejects(malformed.client.create(deviceId, { kind: 'token' }, 'credential-key-malformed'), error => {
    assert.ok(error instanceof DeviceCredentialNativeError)
    assert.equal(error.outcomeUnknown, true)
    return true
  })

  const missingLocation = makeClient(async () => createdResponse(secretEnvelope(), null))
  await assert.rejects(missingLocation.client.create(deviceId, { kind: 'token' }, 'credential-key-location'), error => {
    assert.ok(error instanceof DeviceCredentialNativeError)
    assert.equal(error.outcomeUnknown, true)
    return true
  })

  const wrongOwner = makeClient(async () =>
    createdResponse(secretEnvelope({ credential: summary({ deviceId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' }) }))
  )
  await assert.rejects(wrongOwner.client.create(deviceId, { kind: 'token' }, 'credential-key-owner'), error => {
    assert.ok(error instanceof DeviceCredentialNativeError)
    assert.equal(error.outcomeUnknown, true)
    return true
  })

  const noStore = makeClient(async () =>
    createdResponse(secretEnvelope(), `${path}/${credentialId}`, 'private, max-age=60')
  )
  await assert.rejects(noStore.client.create(deviceId, { kind: 'token' }, 'credential-key-cache'), error => {
    assert.ok(error instanceof DeviceCredentialNativeError)
    assert.equal(error.outcomeUnknown, true)
    return true
  })
  assert.equal(malformed.seen.length + missingLocation.seen.length + wrongOwner.seen.length + noStore.seen.length, 4)
})

test('credential create classifies Problem 422 separately and network/redirect outcomes as unknown', async () => {
  const secret = 'problem-detail-secret-must-not-survive'
  const problem = {
    type: 'about:blank',
    title: 'Unprocessable Entity',
    status: 422,
    detail: secret,
    instance: path,
    code: 'invalid_credential_field',
    requestId: 'credential-invalid-1'
  }
  const rejected = makeClient(
    async () =>
      new Response(JSON.stringify(problem), { status: 422, headers: { 'Content-Type': 'application/problem+json' } })
  )
  await assert.rejects(rejected.client.create(deviceId, { kind: 'token', secret }, 'credential-key-problem'), error => {
    assert.ok(error instanceof DeviceCredentialNativeError)
    assert.equal(error.status, 422)
    assert.equal(error.code, 'invalid_credential_field')
    assert.equal(error.outcomeUnknown, false)
    assert.ok(!error.message.includes(secret))
    assert.ok(!JSON.stringify(error.body).includes(secret))
    return true
  })

  const redirected = makeClient(
    async () => new Response(null, { status: 307, headers: { Location: 'https://elsewhere.invalid/credentials' } })
  )
  await assert.rejects(redirected.client.create(deviceId, { kind: 'token' }, 'credential-key-redirect'), error => {
    assert.ok(error instanceof DeviceCredentialNativeError)
    assert.equal(error.outcomeUnknown, true)
    return true
  })
  const network = makeClient(async () => {
    throw new Error('synthetic fetch failure')
  })
  await assert.rejects(network.client.create(deviceId, { kind: 'token' }, 'credential-key-network'), error => {
    assert.ok(error instanceof DeviceCredentialNativeError)
    assert.equal(error.outcomeUnknown, true)
    assert.ok(!error.message.includes('sensitive-credential-fixture-never-log'))
    return true
  })
  assert.equal(redirected.seen[0].init?.redirect, 'error')
  assert.equal(network.seen.length, 1)
})

test('credential create validates key before sending and does not automatically retry', async () => {
  const { client, seen } = makeClient(async () => createdResponse())
  await assert.rejects(client.create(deviceId, { kind: 'token' }, 'bad key'), /Idempotency-Key/)
  assert.equal(seen.length, 0)
})

function operationAccepted(): Response {
  const body = { data: { id: '9b1b3c0e-5f5d-4d0f-9d0e-0c1b6f3a1e11', state: 'pending' }, meta: { requestId: 'op-1' } }
  return new Response(JSON.stringify(body), { status: 202 })
}

test('credential revoke and rotate post to their action paths with an Idempotency-Key and return the pending operation', async () => {
  const { client, seen } = makeClient(async () => operationAccepted())
  const revoked = await client.revoke(
    deviceId,
    credentialId,
    { expectedDeviceVersion: 4, reason: 'leaked' },
    'revoke-key-0001'
  )
  assert.deepEqual(revoked, { operationId: '9b1b3c0e-5f5d-4d0f-9d0e-0c1b6f3a1e11', state: 'pending' })
  const replacementId = 'c0a8012e-2f7b-4a54-8a43-6b6f5f1d2c33'
  await client.rotate(
    deviceId,
    credentialId,
    { replacementCredentialId: replacementId, overlapSeconds: 0, expectedDeviceVersion: 4 },
    'rotate-key-0001'
  )
  assert.equal(String(seen[0].input), `${path}/${credentialId}/revocations`)
  assert.equal(String(seen[1].input), `${path}/${credentialId}/rotations`)
  for (const call of seen) {
    assert.equal(call.init?.method, 'POST')
    assert.match(new Headers(call.init?.headers).get('Idempotency-Key') ?? '', /-key-0001$/)
  }
  assert.deepEqual(JSON.parse(String(seen[0].init?.body)), { expectedDeviceVersion: 4, reason: 'leaked' })
})

test('credential change treats a network failure as an unknown outcome and a 409 as a definite refusal', async () => {
  const lost = makeClient(async () => {
    throw new TypeError('network down')
  })
  await assert.rejects(
    lost.client.revoke(deviceId, credentialId, { expectedDeviceVersion: 1, reason: 'x' }, 'revoke-key-0002'),
    (error: unknown) => error instanceof DeviceCredentialNativeError
  )
  const refused = makeClient(
    async () => new Response(JSON.stringify({ code: 'failed_precondition', message: 'stale' }), { status: 409 })
  )
  await assert.rejects(
    refused.client.revoke(deviceId, credentialId, { expectedDeviceVersion: 1, reason: 'x' }, 'revoke-key-0003'),
    (error: unknown) => error instanceof DeviceCredentialNativeError && error.status === 409 && !error.outcomeUnknown
  )
})
