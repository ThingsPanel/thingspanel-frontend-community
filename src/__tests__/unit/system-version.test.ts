import { describe, expect, it } from 'vitest'
import { compareVersions, parseVersion, pickLatestVersion } from '@/utils/system-version'
import { hasSystemErrorText } from '@/utils/system-error'
import zh from '@/locales/langs/zh-cn/system-manage.json'
import en from '@/locales/langs/en-us/system-manage.json'

describe('system version helpers', () => {
  it('parses v-prefixed beta versions', () => {
    expect(parseVersion('v1.4.0-beta.2')).toEqual({ core: [1, 4, 0], pre: ['beta', '2'] })
    expect(parseVersion('1.2.11')?.pre).toEqual([])
    expect(parseVersion('latest')).toBeNull()
  })

  it('orders beta.1 < beta.2 < beta.10 < final', () => {
    const order = ['v1.4.0-beta.1', 'v1.4.0-beta.2', 'v1.4.0-beta.10', 'v1.4.0', 'v1.4.1-beta.1', 'v1.5.0']
    for (let i = 0; i < order.length - 1; i += 1) {
      expect(compareVersions(order[i], order[i + 1])).toBeLessThan(0)
      expect(compareVersions(order[i + 1], order[i])).toBeGreaterThan(0)
    }
    expect(compareVersions('v1.4.0', '1.4.0')).toBe(0)
    expect(compareVersions('x', '1.0.0')).toBeNull()
  })

  it('picks the latest tag regardless of API order; betas only when running a beta', () => {
    const tags = ['v1.4.0-beta.2', 'v1.3.9', 'v1.4.0-beta.10', 'v1.3.10', 'junk']
    expect(pickLatestVersion(tags, false)).toBe('v1.3.10')
    expect(pickLatestVersion(tags, true)).toBe('v1.4.0-beta.10')
    expect(pickLatestVersion([], false)).toBeUndefined()
  })
})

describe('system error texts', () => {
  it('has bilingual text for upgrade_helper_image_unavailable and a clear updates_not_configured', () => {
    expect(hasSystemErrorText('upgrade_helper_image_unavailable')).toBe(true)
    expect(hasSystemErrorText('system_busy')).toBe(false)
    for (const t of [zh, en]) {
      expect(t.errors.upgrade_helper_image_unavailable).toContain('docker pull docker:27-cli')
      expect(t.errors.upgrade_helper_image_unavailable).toContain('UPGRADE-HELPER-IMAGE')
      expect(t.updates.error.updates_not_configured.length).toBeGreaterThan(20)
    }
    expect(zh.updates.error.updates_not_configured).toContain('发布源')
    expect(en.updates.error.updates_not_configured).toContain('release source')
  })
})
