import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockGet = vi.fn()

vi.mock('@/utils/storage', () => ({
  localStg: {
    get: mockGet
  }
}))

describe('thingsvis-auth', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    mockGet.mockImplementation((key: string) => {
      if (key === 'token') return 'tp-token'
      if (key === 'userInfo') {
        return {
          userId: 'user-1',
          userName: 'tester',
          email: 'tester@example.com',
          tenantId: 'tenant-1'
        }
      }
      return null
    })
  })

  it('enters cooldown after a network failure and skips the next fetch attempt', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'))
    vi.stubGlobal('fetch', fetchMock)

    const { getThingsVisToken } = await import('@/utils/thingsvis/thingsvis-auth')

    await expect(getThingsVisToken()).rejects.toThrow(/ThingsVis SSO backend unavailable/)
    await expect(getThingsVisToken()).rejects.toThrow(/retry in/i)

    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})
