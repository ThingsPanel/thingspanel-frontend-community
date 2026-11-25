import { afterEach, expect, it, vi } from 'vitest'
import { acceptsLegacyDeviceStatus } from '@/service/api/device-list-rows'
import { createDeviceNativeClient } from '@/service/api/device-native-transport'
import { createObservedAttributePoller } from '@/utils/thingsvis/observed-attribute-poller'

afterEach(() => vi.useRealTimers())
it('rejects legacy frames for both available and unavailable native summaries', () => {
  expect(acceptsLegacyDeviceStatus({ runtime_available: true })).toBe(false)
  expect(acceptsLegacyDeviceStatus({ runtime_available: false })).toBe(false)
  expect(acceptsLegacyDeviceStatus({})).toBe(true)
})
it('refreshes summaries every 15 seconds, pauses hidden views and stops on teardown', async () => {
  vi.useFakeTimers()
  let visible = true
  const ids = ['device-a', 'device-b']
  const calls: string[][] = []
  let finish!: () => void
  const poller = createObservedAttributePoller({
    intervalMs: 15000,
    isVisible: () => visible,
    read: async () => {
      calls.push(ids)
      await new Promise<void>(resolve => {
        finish = resolve
      })
      return {}
    },
    push: () => {},
    onError: () => {}
  })
  poller.start()
  await vi.advanceTimersByTimeAsync(45000)
  expect(calls).toEqual([ids])
  visible = false
  finish()
  await vi.advanceTimersByTimeAsync(45000)
  expect(calls).toHaveLength(1)
  visible = true
  await vi.advanceTimersByTimeAsync(15000)
  expect(calls).toHaveLength(2)
  poller.stop()
  finish()
  await vi.advanceTimersByTimeAsync(30000)
  expect(calls).toHaveLength(2)
})

it('requests metadata first and reads summaries by the displayed device IDs', async () => {
  const ids = ['device-a', 'device-b']
  const calls: { path: string; init?: RequestInit }[] = []
  const client = createDeviceNativeClient({
    fetch: async (path, init) => {
      calls.push({ path: String(path), init })
      const data = init?.method === 'POST' ? ids.map(id => ({ id })) : { items: [], total: 0 }
      return new Response(JSON.stringify({ data, meta: { requestId: 'test' } }))
    },
    getToken: () => 'session-token',
    getLanguage: () => 'zh-CN'
  })

  await client.list({ page: 1, pageSize: 10, includeSummaries: false })
  const controller = new AbortController()
  expect(await client.summaries(ids, controller.signal)).toEqual(ids.map(id => ({ id })))
  expect(calls.map(call => call.path)).toEqual([
    '/api/v2/devices?page=1&pageSize=10&includeSummaries=false',
    '/api/v2/device-status-summaries'
  ])
  expect(calls[1].init?.body).toBe(JSON.stringify({ deviceIds: ids }))
  expect(calls[1].init?.signal).toBe(controller.signal)
  expect(new Headers(calls[1].init?.headers).get('Authorization')).toBe('Bearer session-token')
})
