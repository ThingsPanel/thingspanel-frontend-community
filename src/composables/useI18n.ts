import type { I18nString } from '@/service/thingmodel/types'

export function resolveI18nString(value: I18nString | null | undefined, locale = 'zh-CN') {
  if (!value) return ''
  const exact = value.locales?.[locale]
  if (exact) return exact
  const language = locale.split('-')[0]
  const fallback = Object.entries(value.locales ?? {}).find(([key]) => key.split('-')[0] === language)?.[1]
  return fallback ?? value.default ?? ''
}
