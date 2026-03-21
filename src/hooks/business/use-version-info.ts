import { computed, onMounted, ref } from 'vue'
import axios from 'axios'

import { getSysVersion } from '@/service/api/system-data'

interface VersionInfoSnapshot {
  currentVersion: string
  latestVersion: string
}

const DEFAULT_VERSION = '--'

let versionInfoCache: VersionInfoSnapshot | null = null
let versionInfoPending: Promise<VersionInfoSnapshot> | null = null

function normalizeVersion(version: unknown): string {
  if (typeof version !== 'string') return DEFAULT_VERSION
  const normalized = version.trim().replace(/^v/i, '')
  return normalized || DEFAULT_VERSION
}

async function fetchVersionInfo(): Promise<VersionInfoSnapshot> {
  if (versionInfoCache) return versionInfoCache
  if (versionInfoPending) return versionInfoPending

  versionInfoPending = Promise.allSettled([
    getSysVersion(),
    axios.get('https://api.github.com/repos/ThingsPanel/thingspanel-frontend-community/tags')
  ])
    .then(([currentResult, latestResult]) => {
      const currentVersion =
        currentResult.status === 'fulfilled'
          ? normalizeVersion(currentResult.value?.data?.version)
          : DEFAULT_VERSION

      const latestVersion =
        latestResult.status === 'fulfilled'
          ? normalizeVersion(latestResult.value?.data?.[0]?.name)
          : DEFAULT_VERSION

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
