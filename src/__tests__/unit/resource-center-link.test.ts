import { describe, expect, it } from 'vitest'
import { buildHomeAssistantMarketUrl } from '../../views/resource-hub/dashboard/external-market'

describe('buildHomeAssistantMarketUrl', () => {
  it('links the current platform base path to the HA page without copying query or hash data', () => {
    const result = buildHomeAssistantMarketUrl(
      'https://r.example.test/portal/',
      'https://iot.example.test',
      '/customer-a/'
    )

    expect(result).toBe(
      'https://r.example.test/portal/marketplace/plugins/homeassistant?platform_origin=https%3A%2F%2Fiot.example.test%2Fcustomer-a'
    )
  })

  it('defaults the market portal and drops any source query, hash, or credentials', () => {
    const result = buildHomeAssistantMarketUrl(
      undefined,
      'https://iot.example.test/customer-a/app?token=secret#session',
      '/customer-a/'
    )

    expect(result).toBe(
      'https://r.thingspanel.cn/marketplace/plugins/homeassistant?platform_origin=https%3A%2F%2Fiot.example.test%2Fcustomer-a'
    )
    expect(result).not.toContain('secret')
  })

  it('rejects invalid or credential-bearing platform and market URLs', () => {
    expect(buildHomeAssistantMarketUrl('https://r.example.test', 'javascript:alert(1)', '/')).toBeNull()
    expect(buildHomeAssistantMarketUrl('https://user:pass@r.example.test', 'https://iot.example.test', '/')).toBeNull()
    expect(buildHomeAssistantMarketUrl('https://r.example.test', 'https://user:pass@iot.example.test', '/')).toBeNull()
    expect(buildHomeAssistantMarketUrl('https://r.example.test', 'https://iot.example.test', '//evil.example')).toBeNull()
  })
})
