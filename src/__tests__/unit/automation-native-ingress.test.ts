import { afterEach, describe, expect, it, vi } from 'vitest'
import { automationNative } from '@/service/api/automation-native-client'

vi.mock('@/utils/storage', () => ({ localStg: { get: (key: string) => (key === 'token' ? 'test-token' : 'zh-CN') } }))

afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

describe('device alarm ingress', () => {
  it.each([
    ['', '/automation-core/v1/alarms?subject_id=device-1&limit=50&offset=0'],
    [' /configured-engine/ ', '/configured-engine/v1/alarms?subject_id=device-1&limit=50&offset=0']
  ])('uses the deployed owner prefix (%s)', async (configured, expected) => {
    vi.stubEnv('VITE_AUTOMATION_API_BASE_URL', configured)
    const fetch = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify({ alarms: [], total: 0, limit: 50, offset: 0 })))
    vi.stubGlobal('fetch', fetch)
    await automationNative.alarms('device-1')
    expect(fetch).toHaveBeenCalledOnce()
    expect(fetch.mock.calls[0][0]).toBe(expected)
    expect(new Headers(fetch.mock.calls[0][1].headers).get('x-token')).toBe('test-token')
  })
})
