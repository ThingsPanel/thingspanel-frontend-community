import { describe, expect, it } from 'vitest'
import {
  getPlatformApiBase,
  getThingsVisApiBase,
  PLATFORM_API_BASE_PATH,
  THINGSVIS_API_PROXY_PATH
} from '@/utils/thingsvis/constants'

describe('thingsvis runtime base helpers', () => {
  it('resolves both API bases from the current host origin', () => {
    expect(getThingsVisApiBase()).toBe(`${window.location.origin}${THINGSVIS_API_PROXY_PATH}`)
    expect(getPlatformApiBase()).toBe(`${window.location.origin}${PLATFORM_API_BASE_PATH}`)
  })
})
