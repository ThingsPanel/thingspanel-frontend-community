import type { ThingsVisHomeDashboard } from '@/service/api/thingsvis'
import { getCurrentUserInfo, resolveThingsVisSpaceId } from './space'

const THINGSVIS_HOME_CACHE_PREFIX = 'thingsvis-home-cache'
const THINGSVIS_HOME_CACHE_TTL_MS = 60_000

export type ThingsVisHomeCacheState = 'thingsvis' | 'classic' | 'sysadmin-setup'

interface ThingsVisHomeCacheEntry {
  state: ThingsVisHomeCacheState
  dashboard?: ThingsVisHomeDashboard | null
  expiresAt: number
}

function getCacheKey(): string | null {
  const userInfo = getCurrentUserInfo()
  if (!userInfo) return null

  return `${THINGSVIS_HOME_CACHE_PREFIX}:${resolveThingsVisSpaceId(userInfo)}`
}

export function readThingsVisHomeCache(): ThingsVisHomeCacheEntry | null {
  const key = getCacheKey()
  if (!key) return null

  try {
    const raw = sessionStorage.getItem(key)
    if (!raw) return null

    const parsed = JSON.parse(raw) as ThingsVisHomeCacheEntry
    if (!parsed?.expiresAt || parsed.expiresAt <= Date.now()) {
      sessionStorage.removeItem(key)
      return null
    }

    return parsed
  } catch {
    return null
  }
}

export function writeThingsVisHomeCache(
  state: ThingsVisHomeCacheState,
  dashboard?: ThingsVisHomeDashboard | null
): void {
  const key = getCacheKey()
  if (!key) return

  sessionStorage.setItem(
    key,
    JSON.stringify({
      state,
      dashboard: dashboard || null,
      expiresAt: Date.now() + THINGSVIS_HOME_CACHE_TTL_MS
    } satisfies ThingsVisHomeCacheEntry)
  )
}

export function clearThingsVisHomeCache(): void {
  const key = getCacheKey()
  if (!key) return

  sessionStorage.removeItem(key)
}
