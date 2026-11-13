import { describe, expect, it } from 'vitest'
import { catalogDescription, healthLabel } from '@/views/apply/plugin/install-presentation'
describe('plugin catalog presentation', () => {
  it('localizes known built-in copy without replacing custom descriptions', () => {
    const text =
      'Home Assistant device connector: HA state_changed events become ThingsPanel telemetry, platform commands call HA services.'
    expect(catalogDescription(text, 'zh-CN')).toContain('接入 Home Assistant')
    expect(catalogDescription(text, 'en-US')).toBe(text)
    expect(catalogDescription('Custom connector instructions', 'zh-CN')).toBe('Custom connector instructions')
  })
  it('localizes health and preserves unknown future states', () => {
    expect(healthLabel('ok', 'zh-CN')).toBe('正常')
    expect(healthLabel('ok', 'en-US')).toBe('Healthy')
    expect(healthLabel('future', 'zh-CN')).toBe('future')
  })
})
