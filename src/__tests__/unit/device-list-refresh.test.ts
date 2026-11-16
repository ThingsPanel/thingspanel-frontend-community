import { afterEach, expect, it, vi } from 'vitest'
import { acceptsLegacyDeviceStatus } from '@/service/api/device-list-rows'
import { createObservedAttributePoller } from '@/utils/thingsvis/observed-attribute-poller'

afterEach(() => vi.useRealTimers())
it('rejects legacy frames for both available and unavailable native summaries', () => {
  expect(acceptsLegacyDeviceStatus({ runtime_available: true })).toBe(false)
  expect(acceptsLegacyDeviceStatus({ runtime_available: false })).toBe(false)
  expect(acceptsLegacyDeviceStatus({})).toBe(true)
})
it('refreshes the current page every 15 seconds, pauses hidden views and stops on teardown', async () => {
  vi.useFakeTimers()
  let visible = true
  const query = { page: 3, connectivity: 'online' }
  const calls: (typeof query)[] = []
  let finish!: () => void
  const poller = createObservedAttributePoller({
    intervalMs: 15000,
    isVisible: () => visible,
    read: async () => {
      calls.push({ ...query })
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
  expect(calls).toEqual([{ page: 3, connectivity: 'online' }])
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
