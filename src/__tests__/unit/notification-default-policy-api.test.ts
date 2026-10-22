import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getNotificationDefaultPolicy, putNotificationDefaultPolicy } from '@/service/api/notification'

const { get, put } = vi.hoisted(() => ({ get: vi.fn(), put: vi.fn() }))
vi.mock('@/service/request/request', () => ({ request: { get, put } }))

describe('community default policy API client', () => {
  beforeEach(() => {
    get.mockReset()
    put.mockReset()
  })

  it('uses the ordinary community request client and frozen endpoint/body', async () => {
    const controller = new AbortController()
    await getNotificationDefaultPolicy(controller.signal)
    await putNotificationDefaultPolicy({ nativeGroupId: '', expectedVersion: 7 }, controller.signal)
    expect(get).toHaveBeenCalledWith('/notification-default-policy', { signal: controller.signal, silentError: true })
    expect(put).toHaveBeenCalledWith(
      '/notification-default-policy',
      { nativeGroupId: '', expectedVersion: 7 },
      {
        signal: controller.signal,
        silentError: true
      }
    )
  })
})
