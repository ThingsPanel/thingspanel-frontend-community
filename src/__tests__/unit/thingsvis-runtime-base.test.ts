import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  getPlatformApiBase,
  getThingsVisApiBase,
  PLATFORM_API_BASE_PATH,
  PLATFORM_API_PROXY_PATH,
  THINGSVIS_API_PROXY_PATH,
  resolvePlatformApiBasePath
} from '@/utils/thingsvis/constants'

describe('thingsvis runtime base helpers', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('resolves both API bases from the current host origin', () => {
    vi.stubEnv('VITE_HTTP_PROXY', 'N')
    expect(getThingsVisApiBase()).toBe(`${window.location.origin}${THINGSVIS_API_PROXY_PATH}`)
    expect(getPlatformApiBase()).toBe(`${window.location.origin}${PLATFORM_API_BASE_PATH}`)
  })

  it('uses the Vite default proxy path when HTTP proxying is enabled', () => {
    expect(resolvePlatformApiBasePath(true)).toBe(PLATFORM_API_PROXY_PATH)
    expect(resolvePlatformApiBasePath(false)).toBe(PLATFORM_API_BASE_PATH)
  })
})
