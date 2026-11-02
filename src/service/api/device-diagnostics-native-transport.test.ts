import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  counterView,
  createDeviceDiagnosticsNativeClient,
  DeviceDiagnosticsNativeError
} from './device-diagnostics-native-transport'

const deviceId = '7c1bdb51-842a-4baa-8f58-4cb27f7132fd'
const incomplete = { success: null, total: null, successRate: null, complete: false }

function diagnostic(overrides: Record<string, unknown> = {}) {
  return {
    deviceId,
    observedAt: '2026-10-29T12:00:00.000Z',
    checks: [{ stage: 'metadata', state: 'pass', code: 'DEVICE_FOUND', message: 'ok' }],
    windowFrom: '2026-10-28T12:00:00.000Z',
    windowTo: '2026-10-29T12:00:00.000Z',
    stats: { uplink: incomplete, downlink: incomplete, storage: incomplete },
    recentFailures: [],
    recentFailuresTruncated: false,
    ...overrides
  }
}

function makeClient(respond: () => Response) {
  const seen: string[] = []
  const client = createDeviceDiagnosticsNativeClient({
    fetch: async input => {
      seen.push(String(input))
      return respond()
    },
    getToken: () => 'diag-token',
    getLanguage: () => 'zh-CN'
  })
  return { client, seen }
}

test('diagnostics reads the native path with its window query and validates the response', async () => {
  const { client, seen } = makeClient(
    () => new Response(JSON.stringify({ data: diagnostic(), meta: { requestId: 'd1' } }))
  )
  const result = await client.get(deviceId, { recentFailureLimit: 5 })
  assert.equal(seen[0], `/api/v2/devices/${deviceId}/diagnostics?recentFailureLimit=5`)
  assert.equal(result.checks[0].code, 'DEVICE_FOUND')
})

test('diagnostics rejects an incomplete counter that still carries numbers', async () => {
  const lying = { success: 3, total: 3, successRate: 1, complete: false }
  const { client } = makeClient(
    () =>
      new Response(
        JSON.stringify({
          data: diagnostic({ stats: { uplink: lying, downlink: incomplete, storage: incomplete } }),
          meta: { requestId: 'd2' }
        })
      )
  )
  await assert.rejects(client.get(deviceId), /invalid response/)
})

test('diagnostics surfaces a 403 as a typed error', async () => {
  const { client } = makeClient(
    () => new Response(JSON.stringify({ code: 'permission_denied', message: 'no' }), { status: 403 })
  )
  await assert.rejects(
    client.get(deviceId),
    (error: unknown) => error instanceof DeviceDiagnosticsNativeError && error.status === 403
  )
})

test('counter view never shows 0 or 100 percent for missing or empty data', () => {
  assert.deepEqual(counterView(incomplete), { rate: null, detail: '运行时未提供完整统计' })
  assert.deepEqual(counterView({ success: 0, total: 0, successRate: null, complete: true }), {
    rate: null,
    detail: '窗口内没有记录'
  })
  assert.deepEqual(counterView({ success: 9, total: 10, successRate: 0.9, complete: true }), {
    rate: '90.0',
    detail: '9/10条'
  })
})
