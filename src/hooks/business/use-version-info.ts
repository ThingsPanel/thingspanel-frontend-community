import { computed, onMounted, ref } from 'vue'
import axios from 'axios'

import { getSysVersion } from '@/service/api/system-data'

interface VersionInfoSnapshot {
  currentVersion: string
  latestVersion: string
}

const DEFAULT_VERSION = '--'
const LATEST_VERSION_CACHE_KEY = 'thingspanel_latest_version_cache_v1'
const LEGACY_CACHE_KEYS = ['thingspanel_version_info_cache', 'thingspanel_latest_version_cache']
const LATEST_VERSION_CACHE_TTL = 12 * 60 * 60 * 1000

let versionInfoCache: VersionInfoSnapshot | null = null
let versionInfoPending: Promise<VersionInfoSnapshot> | null = null

interface LatestVersionCache {
  version: string
  expiresAt: number
}

function normalizeVersion(version: unknown): string {
  if (typeof version !== 'string') return DEFAULT_VERSION
  const normalized = version.trim().replace(/^v/i, '')
  return normalized || DEFAULT_VERSION
}

function getCachedLatestVersion(): string {
  if (typeof window === 'undefined') return DEFAULT_VERSION

  LEGACY_CACHE_KEYS.forEach(key => localStorage.removeItem(key))

  try {
    const raw = localStorage.getItem(LATEST_VERSION_CACHE_KEY)
    if (!raw) return DEFAULT_VERSION

    const cache = JSON.parse(raw) as LatestVersionCache
    if (!cache?.version || !cache?.expiresAt || Date.now() > cache.expiresAt) {
      localStorage.removeItem(LATEST_VERSION_CACHE_KEY)
      return DEFAULT_VERSION
    }

    return normalizeVersion(cache.version)
  } catch {
    localStorage.removeItem(LATEST_VERSION_CACHE_KEY)
    return DEFAULT_VERSION
  }
}

function setCachedLatestVersion(version: string) {
  if (typeof window === 'undefined' || version === DEFAULT_VERSION) return

  const cache: LatestVersionCache = {
    version,
    expiresAt: Date.now() + LATEST_VERSION_CACHE_TTL
  }

  localStorage.setItem(LATEST_VERSION_CACHE_KEY, JSON.stringify(cache))
}

async function fetchVersionInfo(): Promise<VersionInfoSnapshot> {
  if (versionInfoCache) return versionInfoCache
  if (versionInfoPending) return versionInfoPending

  const cachedLatestVersion = getCachedLatestVersion()

  versionInfoPending = Promise.allSettled([
    getSysVersion(),
    cachedLatestVersion === DEFAULT_VERSION
      ? axios.get('https://api.github.com/repos/ThingsPanel/thingspanel-frontend-community/tags')
      : Promise.resolve({ data: [{ name: cachedLatestVersion }] })
  ])
    .then(([currentResult, latestResult]) => {
      const currentVersion =
        currentResult.status === 'fulfilled'
          ? normalizeVersion(currentResult.value?.data?.version)
          : DEFAULT_VERSION

      const latestVersion =
        latestResult.status === 'fulfilled'
          ? normalizeVersion(latestResult.value?.data?.[0]?.name)
          : cachedLatestVersion

      setCachedLatestVersion(latestVersion)

      versionInfoCache = {
        currentVersion,
        latestVersion
      }

      return versionInfoCache
    })
    .finally(() => {
      versionInfoPending = null
    })

  return versionInfoPending
}

export default function useVersionInfo() {
  const currentVersion = ref(DEFAULT_VERSION)
  const latestVersion = ref(DEFAULT_VERSION)
  const isLatestVersion = computed(() => {
    return (
      currentVersion.value !== DEFAULT_VERSION &&
      latestVersion.value !== DEFAULT_VERSION &&
      currentVersion.value === latestVersion.value
    )
  })

  async function loadVersionInfo() {
    const snapshot = await fetchVersionInfo()
    currentVersion.value = snapshot.currentVersion
    latestVersion.value = snapshot.latestVersion
  }

  onMounted(() => {
    void loadVersionInfo()
  })

  return {
    currentVersion,
    latestVersion,
    isLatestVersion,
    loadVersionInfo
  }
}
