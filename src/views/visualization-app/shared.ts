import { localStg } from '@/utils/storage'

export function getThumbnailUrl(thumbnail: string | null | undefined): string | null {
  if (!thumbnail) return null
  if (thumbnail.startsWith('data:')) return thumbnail
  if (thumbnail.startsWith('http')) return thumbnail
  return `data:image/png;base64,${thumbnail}`
}

export function buildVisualizationAppUrl(
  path: string,
  params: Record<string, string | undefined> = {}
): string {
  const base = typeof window !== 'undefined' ? window.location.origin : ''
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  const token = localStg.get('token') || ''
  const currentQuery =
    typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams()
  const lang = currentQuery.get('lang') || ''
  const statusBarHeight = currentQuery.get('statusBarHeight') || ''

  const query = new URLSearchParams()
  Object.entries({ ...params, token, lang, statusBarHeight }).forEach(([key, value]) => {
    if (value) query.set(key, value)
  })

  const queryString = query.toString()
  return `${base}${normalizedPath}${queryString ? `?${queryString}` : ''}`
}
