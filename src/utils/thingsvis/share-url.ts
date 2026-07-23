import { getPlatformApiBase, getThingsVisApiBase } from './constants'

export function resolveHostPreviewUrl(resolvedHref: string, currentLocationHref: string): string {
  return new URL(resolvedHref, currentLocationHref).toString()
}

export function buildThingsVisSharedFrameUrl(options: {
  studioBase: string
  dashboardId: string
  shareToken: string
}): string {
  const hashIndex = options.studioBase.indexOf('#')
  const studioBase = hashIndex === -1 ? options.studioBase : options.studioBase.substring(0, hashIndex)
  const params = new URLSearchParams({
    id: options.dashboardId,
    shareToken: options.shareToken,
    thingsvisApiBaseUrl: getThingsVisApiBase(),
    platformApiBaseUrl: getPlatformApiBase()
  })

  return `${studioBase}#/embed?${params.toString()}`
}
