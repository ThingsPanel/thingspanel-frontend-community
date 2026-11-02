import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createDeviceLifecycleNativeClient, DeviceLifecycleNativeError } from './device-lifecycle-native-transport'

const deviceId = '7c1bdb51-842a-4baa-8f58-4cb27f7132fd'

function makeClient(respond: () => Response) {
  const seen: Array<{ input: RequestInfo | URL; init?: RequestInit }> = []
  const client = createDeviceLifecycleNativeClient({
    fetch: async (input, init) => {
      seen.push({ input, init })
      return respond()
    },
    getToken: () => 'number-token',
    getLanguage: () => 'zh-CN'
  })
  return { client, seen }
}

test('number change posts the version-guarded body with an Idempotency-Key and no If-Match', async () => {
  const operation = { id: '9b1b3c0e-5f5d-4d0f-9d0e-0c1b6f3a1e11', kind: 'device_renumber', state: 'pending' }
  const { client, seen } = makeClient(
    () =>
      new Response(JSON.stringify({ data: operation, meta: { requestId: 'n1' } }), {
        status: 202,
        headers: { Location: '/api/v2/metadata-operations/x' }
      })
  )
  const body = { deviceNumber: 'SN-002', expectedDeviceVersion: 4, reason: 'relabel' }
  const accepted = await client.changeNumber(deviceId, body, 'number-key-0001')
  assert.equal(String(seen[0].input), `/api/v2/devices/${deviceId}/number-changes`)
  assert.equal(seen[0].init?.method, 'POST')
  const headers = new Headers(seen[0].init?.headers)
  assert.equal(headers.get('Idempotency-Key'), 'number-key-0001')
  assert.equal(headers.has('If-Match'), false)
  assert.deepEqual(JSON.parse(String(seen[0].init?.body)), body)
  assert.equal(accepted.operation.state, 'pending')
})

test('number change reports a taken number as a typed 409', async () => {
  const { client } = makeClient(
    () => new Response(JSON.stringify({ code: 'already_exists', message: 'taken' }), { status: 409 })
  )
  await assert.rejects(
    client.changeNumber(deviceId, { deviceNumber: 'SN-001', expectedDeviceVersion: 1, reason: 'x' }, 'number-key-0002'),
    (error: unknown) => error instanceof DeviceLifecycleNativeError && error.status === 409
  )
})
