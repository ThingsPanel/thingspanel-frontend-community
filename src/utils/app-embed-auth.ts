import { fetchGetUserInfo } from '@/service/api/auth'
import { setLocale } from '@/locales'
import { localStg } from '@/utils/storage'
import { clearThingsVisToken } from '@/utils/thingsvis'

function normalizeQueryValue(value: unknown): string | null {
  if (typeof value === 'string' && value.trim()) {
    return value.trim()
  }

  if (Array.isArray(value)) {
    const first = value.find(item => typeof item === 'string' && item.trim())
    return first ? first.trim() : null
  }

  return null
}

function stripTokenFromCurrentUrl(): void {
  const searchParams = new URLSearchParams(window.location.search)
  if (searchParams.has('token')) {
    searchParams.delete('token')
    const nextQuery = searchParams.toString()
    const nextUrl = `${window.location.pathname}${nextQuery ? `?${nextQuery}` : ''}${window.location.hash}`
    window.history.replaceState({}, '', nextUrl)
    return
  }

  const hash = window.location.hash
  if (!hash.includes('token=')) return

  const [path, queryStr] = hash.split('?')
  if (!queryStr) return

  const params = new URLSearchParams(queryStr)
  if (!params.has('token')) return

  params.delete('token')
  const newQuery = params.toString()
  const newHash = path + (newQuery ? `?${newQuery}` : '')
  const newUrl = window.location.href.replace(hash, newHash)
  window.history.replaceState({}, '', newUrl)
}

/**
 * App WebView 嵌入页鉴权：写入 token 并补齐 userInfo，供 ThingsVis SSO 使用。
 */
export async function bootstrapAppEmbedSession(options?: {
  token?: unknown
  lang?: unknown
  removeTokenFromUrl?: boolean
}): Promise<boolean> {
  const token = normalizeQueryValue(options?.token)
  const lang = normalizeQueryValue(options?.lang)

  if (token) {
    localStg.set('token', token)
    clearThingsVisToken()
  }

  if (lang) {
    setLocale(lang as App.I18n.LangType)
  }

  const hasToken = Boolean(localStg.get('token'))
  if (!hasToken) {
    return false
  }

  const cachedUserInfo = localStg.get('userInfo')
  if (!cachedUserInfo || token) {
    const { data: info, error } = await fetchGetUserInfo()
    if (error || !info) {
      return false
    }

    info.roles = [info.authority]
    localStg.set('userInfo', info)
    clearThingsVisToken()
  }

  if (options?.removeTokenFromUrl !== false && token) {
    stripTokenFromCurrentUrl()
  }

  return true
}
