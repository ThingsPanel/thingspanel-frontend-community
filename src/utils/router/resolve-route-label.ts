import { $t } from '@/locales'

export function resolveRouteLabel(i18nKey?: string | null, fallbackLabel?: string | null) {
  const normalizedKey = i18nKey?.trim()
  const normalizedFallback = fallbackLabel?.trim()

  if (!normalizedKey) {
    return normalizedFallback || ''
  }

  const translated = $t(normalizedKey)

  if (translated && translated !== normalizedKey) {
    return translated
  }

  return normalizedFallback || normalizedKey
}
