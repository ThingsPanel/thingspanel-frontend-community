const HOME_ASSISTANT_PATH = '/marketplace/plugins/homeassistant'

/** Build a public Horizon HA page URL with only this platform's canonical base URL. */
export function buildHomeAssistantMarketUrl(
  marketAddress: string | undefined,
  platformOrigin: string,
  platformBasePath: string
): string | null {
  try {
    const platform = new URL(platformOrigin)
    if (!['http:', 'https:'].includes(platform.protocol) || platform.username || platform.password) return null

    const platformBase = new URL(platformBasePath || '/', platform.origin)
    if (platformBase.origin !== platform.origin || platformBase.username || platformBase.password) return null
    platform.pathname = platformBase.pathname.replace(/\/+$/, '')
    platform.search = ''
    platform.hash = ''

    const market = new URL(marketAddress || 'https://r.thingspanel.cn')
    if (!['http:', 'https:'].includes(market.protocol) || market.username || market.password) return null
    const marketBasePath = market.pathname.replace(/\/+$/, '')
    market.pathname = `${marketBasePath}${HOME_ASSISTANT_PATH}`
    market.search = new URLSearchParams({ platform_origin: platform.toString() }).toString()
    market.hash = ''
    return market.toString()
  } catch {
    return null
  }
}
