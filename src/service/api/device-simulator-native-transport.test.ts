import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  createDeviceSimulatorNativeClient,
  DeviceSimulatorNativeError,
  FIRST_PROFILE_ETAG
} from './device-simulator-native-transport'

const ID = '11111111-1111-4111-8111-111111111111'

function makeClient(fetcher: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>) {
  const seen: Array<{ path: string; init?: RequestInit }> = []
  const client = createDeviceSimulatorNativeClient({
    fetch: async (input, init) => {
      seen.push({ path: String(input), init })
      return fetcher(input, init)
    },
    getToken: () => 'native-token',
    getLanguage: () => 'zh-CN'
  })
  return { client, seen }
}

const profile = {
  deviceId: ID,
  resourceVersion: 1,
  kind: 'telemetry',
  payload: { temp: 1 },
  topicPurpose: 'telemetry',
  intervalSeconds: 5,
  messageLimit: 10
}

test('getProfile returns the profile with its ETag and null when nothing is saved', async () => {
  const found = makeClient(
    async () =>
      new Response(JSON.stringify({ data: profile, meta: { requestId: 'r' } }), {
        headers: { ETag: '"sim-profile-1"' }
      })
  )
  const got = await found.client.getProfile(ID)
  assert.equal(got?.etag, '"sim-profile-1"')
  assert.equal(new URL(found.seen[0].path, 'http://local.test').pathname, `/api/v2/devices/${ID}/simulator-profile`)

  const missing = makeClient(
    async () =>
      new Response(
        JSON.stringify({
          type: 'about:blank',
          title: 'x',
          status: 404,
          detail: 'none',
          instance: '/',
          code: 'NOT_FOUND',
          requestId: 'r'
        }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }
      )
  )
  assert.equal(await missing.client.getProfile(ID), null)
})

test('saveProfile sends If-Match and an idempotency key, and the first save uses the version-0 ETag', async () => {
  const { client, seen } = makeClient(
    async () =>
      new Response(JSON.stringify({ data: profile, meta: { requestId: 'r' } }), {
        headers: { ETag: '"sim-profile-1"' }
      })
  )
  const saved = await client.saveProfile(
    ID,
    { kind: 'telemetry', payload: { temp: 1 }, topicPurpose: 'telemetry', intervalSeconds: 5, messageLimit: 10 },
    FIRST_PROFILE_ETAG,
    'idem-key-12345'
  )
  assert.equal(saved.etag, '"sim-profile-1"')
  const headers = new Headers(seen[0].init?.headers)
  assert.equal(headers.get('If-Match'), '"sim-profile-0"')
  assert.equal(headers.get('Idempotency-Key'), 'idem-key-12345')
  assert.equal(seen[0].init?.method, 'PUT')
  await assert.rejects(() => client.saveProfile(ID, JSON.parse('{}'), FIRST_PROFILE_ETAG, 'short'), /Idempotency-Key/)
})

test('session and run use the expected paths and bodies', async () => {
  const session = { id: ID, deviceId: ID, expiresAt: '2026-10-29T00:00:00.000Z', state: 'ready' }
  const run = {
    id: ID,
    deviceId: ID,
    state: 'succeeded',
    sent: 2,
    failed: 0,
    createdAt: '2026-10-29T00:00:00.000Z',
    error: null
  }
  const { client, seen } = makeClient(async input => {
    const body = String(input).includes('simulation-runs') ? run : session
    return new Response(JSON.stringify({ data: body, meta: { requestId: 'r' } }), {
      status: String(input).includes('simulator-sessions') && seen.at(-1)?.init?.method === 'DELETE' ? 200 : 201
    })
  })
  assert.equal((await client.createSession(ID, 3, 'idem-key-aaaa')).state, 'ready')
  assert.deepEqual(JSON.parse(String(seen[0].init?.body)), { profileVersion: 3 })
  assert.equal((await client.run(ID, ID, 2, 'idem-key-bbbb')).sent, 2)
  assert.deepEqual(JSON.parse(String(seen[1].init?.body)), { sessionId: ID, messageCount: 2 })
  await client.closeSession(ID, ID)
  assert.equal(seen[2].init?.method, 'DELETE')
})

test('server problems surface as typed errors', async () => {
  const { client } = makeClient(
    async () =>
      new Response(
        JSON.stringify({
          type: 'about:blank',
          title: 't',
          status: 412,
          detail: 'stale',
          instance: '/',
          code: 'FAILED_PRECONDITION',
          requestId: 'r'
        }),
        {
          status: 412,
          headers: { 'Content-Type': 'application/json' }
        }
      )
  )
  await assert.rejects(
    () => client.createSession(ID, 1, 'idem-key-cccc'),
    (e: unknown) => e instanceof DeviceSimulatorNativeError && e.status === 412
  )
})
