export interface MarketTemplateVersion {
  version: string
  contract?: string
  installable?: boolean
}

/** Check the exact version selected by the user, without switching to latest. */
export function marketTemplateCompatibility(
  detail: { versions?: MarketTemplateVersion[] } | null | undefined,
  version: string
): 'native' | 'legacy' | 'unavailable' {
  const selected = detail?.versions?.find(item => item.version === version)
  if (selected?.contract === 'legacy-device-template') return 'legacy'
  if (selected?.contract === 'native-thing-model-v1' && selected.installable === true) return 'native'
  return 'unavailable'
}
