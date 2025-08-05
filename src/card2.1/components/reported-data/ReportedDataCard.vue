<template>
  <n-card
    :title="title"
    :bordered="false"
    size="small"
    class="reported-data-card shadow-sm transition duration-700 ease-in-out"
    :loading="loading"
  >
    <!-- Card Header Extra: Refresh Button -->
    <template #header-extra>
      <n-button
        text
        size="small"
        :type="isRefreshing ? 'primary' : 'default'"
        :loading="isFetchingUpdate && !isRefreshing"
        @click="toggleRefresh"
      >
        <template #icon>
          <n-icon>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M12 4V2A10 10 0 0 0 2 12h2a8 8 0 0 1 8-8zm0 18v-2a8 8 0 0 1-8-8H2a10 10 0 0 0 10 10zm8-10h2a10 10 0 0 0-10-10v2a8 8 0 0 1 8 8z"
              ></path>
            </svg>
          </n-icon>
        </template>
        {{ isRefreshing ? $t('card.reportedData.refreshing') : $t('card.reportedData.startRefresh') }}
      </n-button>
    </template>

    <!-- Card Title Icon -->
    <template #header>
      <div class="flex items-center">
        <n-icon size="20" class="mr-2 text-blue-500">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path fill="currentColor" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
          </svg>
        </n-icon>
        {{ title }}
      </div>
    </template>

    <!-- Error Display -->
    <n-alert v-if="error && !loading" type="error" :title="$t('common.error')">
      {{ error.message || $t('card.fetchError') }}
    </n-alert>

    <!-- Content Area: Use NSpin only for refresh updates -->
    <n-spin :show="isFetchingUpdate && !loading">
      <!-- No Data State -->
      <n-empty
        v-if="!loading && !error && (!displayedDevices || displayedDevices.length === 0)"
        :description="$t('card.noData')"
        class="py-8"
      />

      <!-- Device List -->
      <div v-else-if="!loading && displayedDevices && displayedDevices.length > 0" class="space-y-3 mt-2">
        <n-thing
          v-for="(device, index) in displayedDevices"
          :key="device.device_id"
          class="device-item p-3 rounded-md border"
          :class="{
            'border-l-4': index === 0,
            'bg-blue-50 dark:bg-slate-800': index === 0,
            'bg-gray-50 dark:bg-gray-800': index !== 0
          }"
          :style="{
            borderColor: 'var(--n-border-color)',
            borderLeftColor: index === 0 ? '#646cff' : 'var(--n-border-color)'
          }"
        >
          <!-- Device Header -->
          <template #header>
            <div class="flex items-center justify-between w-full">
              <div class="flex items-center flex-grow min-w-0">
                <n-icon size="16" class="mr-1.5" :style="{ color: 'var(--n-text-color-disabled)' }">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </n-icon>
                <span
                  class="text-sm font-medium truncate mr-1.5"
                  :title="device.device_name"
                  :style="{ color: 'var(--n-text-color)' }"
                >
                  {{ device.device_name }}
                </span>
                <n-tag
                  v-if="showOnlineStatus"
                  :type="device.is_online === 1 ? 'success' : 'default'"
                  size="tiny"
                  round
                  class="flex-shrink-0"
                >
                  {{ device.is_online === 1 ? $t('custom.devicePage.online') : $t('custom.devicePage.offline') }}
                </n-tag>
              </div>
              <!-- Last Push Time -->
              <div
                v-if="showLastPushTime"
                class="text-xs flex items-center flex-shrink-0 pl-2"
                :style="{ color: 'var(--n-text-color-disabled)' }"
              >
                <n-icon size="12" class="mr-0.5">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </n-icon>
                {{ formatRelativeTime(device.last_push_time) }}
              </div>
            </div>
          </template>

          <!-- Device Telemetry Data -->
          <div class="telemetry-scroller-container mt-1">
            <BottomUpInfiniteScroller
              v-if="device.telemetry_data && device.telemetry_data.length > 0"
              :list="getPairedTelemetry(device.telemetry_data)"
              height="76px"
            >
              <template #default="{ item: pair }">
                <n-grid
                  x-gap="12"
                  :cols="2"
                  class="text-xs py-1.5 border-b last:border-b-0"
                  style="border-color: var(--n-border-color)"
                >
                  <!-- Left Column -->
                  <n-gi>
                    <template v-if="pair.left">
                      <div
                        class="truncate"
                        :title="pair.left.label || pair.left.key"
                        style="color: var(--n-text-color-disabled)"
                      >
                        {{ pair.left.label || pair.left.key }}
                      </div>
                      <div
                        class="font-medium truncate mt-0.5"
                        :title="String(pair.left.value)"
                        style="color: var(--n-text-color)"
                      >
                        {{ formatValue(pair.left) }}
                      </div>
                    </template>
                    <template v-else><div class="h-8"></div></template>
                  </n-gi>
                  <!-- Right Column -->
                  <n-gi class="border-l pl-3" style="border-color: var(--n-border-color)">
                    <template v-if="pair.right">
                      <div
                        class="truncate"
                        :title="pair.right.label || pair.right.key"
                        style="color: var(--n-text-color-disabled)"
                      >
                        {{ pair.right.label || pair.right.key }}
                      </div>
                      <div
                        class="font-medium truncate mt-0.5"
                        :title="String(pair.right.value)"
                        style="color: var(--n-text-color)"
                      >
                        {{ formatValue(pair.right) }}
                      </div>
                    </template>
                    <template v-else><div class="h-8"></div></template>
                  </n-gi>
                </n-grid>
              </template>
            </BottomUpInfiniteScroller>
            <!-- Show message if no telemetry data -->
            <div v-else class="text-xs text-center py-2" style="color: var(--n-text-color-disabled)">
              {{ $t('card.reportedData.noTelemetry') }}
            </div>
          </div>
        </n-thing>
      </div>
    </n-spin>

    <!-- Footer Link -->
    <template #footer>
      <div class="text-center">
        <router-link to="/device/manage" class="text-blue-500 text-xs hover:underline">
          {{ $t('card.viewAll') }} >
        </router-link>
      </div>
    </template>
  </n-card>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { $t } from '@/locales'
import { getLatestTelemetryData } from '@/service/api'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'
import BottomUpInfiniteScroller from '@/components/BottomUpInfiniteScroller.vue'
import { NCard, NButton, NIcon, NSpin, NEmpty, NThing, NTag, NGrid, NGi, NAlert } from 'naive-ui'
import { useRouter } from 'vue-router'

dayjs.extend(relativeTime)

defineOptions({
  name: 'ReportedDataCard'
})

interface Props {
  title?: string
  refreshInterval?: number
  maxDevices?: number
  showOnlineStatus?: boolean
  showLastPushTime?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  title: '上报数据',
  refreshInterval: 6000,
  maxDevices: 5,
  showOnlineStatus: true,
  showLastPushTime: true
})

// --- Interfaces ---
interface TelemetryItem {
  key: string
  label: string | null
  unit: string | null
  value: any
}

interface DeviceData {
  device_id: string
  device_name: string
  is_online: number
  last_push_time: string
  telemetry_data: TelemetryItem[]
}

interface ApiLatestTelemetryResponse {
  data: DeviceData[] | null
  error: any
}

interface PairedTelemetryItem {
  left: TelemetryItem | null
  right: TelemetryItem | null
}

// --- Reactive State ---
const devices = ref<DeviceData[]>([])
const loading = ref(true)
const error = ref<Error | null>(null)
const isRefreshing = ref(true)
const refreshIntervalId = ref<ReturnType<typeof setInterval> | null>(null)
const isFetchingUpdate = ref(false)
const router = useRouter()

// 计算显示的设备，限制最大数量
const displayedDevices = computed(() => {
  return devices.value.slice(0, props.maxDevices)
})

// --- Computed Locale for Dayjs ---
const currentLocale = computed(() => dayjs.locale())

// --- Pairing Logic ---
const getPairedTelemetry = (telemetry: TelemetryItem[]): PairedTelemetryItem[] => {
  if (!Array.isArray(telemetry)) return []
  const paired: PairedTelemetryItem[] = []
  for (let i = 0; i < telemetry.length; i += 2) {
    paired.push({
      left: telemetry[i] || null,
      right: telemetry[i + 1] || null
    })
  }
  return paired
}

// --- Data Fetching ---
const fetchData = async (initialLoad = false) => {
  if (initialLoad) {
    loading.value = true
  } else {
    isFetchingUpdate.value = true
  }
  error.value = null
  console.log(`[ReportedData] Fetching data... Initial: ${initialLoad}`)

  try {
    const response: ApiLatestTelemetryResponse = await getLatestTelemetryData()
    if (response.error) {
      let errorMessage = $t('card.fetchError')
      if (typeof response.error === 'string') errorMessage = response.error
      else if (typeof response.error === 'object' && response.error !== null && (response.error as any).message)
        errorMessage = (response.error as any).message
      error.value = new Error(errorMessage)
      devices.value = []
    } else {
      devices.value = Array.isArray(response.data) ? response.data : []
    }
  } catch (err) {
    const catchErrorMessage = err instanceof Error ? err.message : $t('card.unknownError')
    error.value = new Error(catchErrorMessage)
    devices.value = []
  } finally {
    if (initialLoad) {
      loading.value = false
    }
    isFetchingUpdate.value = false
  }
}

// --- Polling Control ---
const startPolling = () => {
  stopPolling()
  if (!isRefreshing.value) return

  console.log(`[ReportedData] Starting polling every ${props.refreshInterval}ms`)
  refreshIntervalId.value = setInterval(() => {
    console.log('[ReportedData] Polling tick: fetching data...')
    fetchData(false)
  }, props.refreshInterval)
}

const stopPolling = () => {
  if (refreshIntervalId.value) {
    console.log('[ReportedData] Stopping polling')
    clearInterval(refreshIntervalId.value)
    refreshIntervalId.value = null
  }
}

// --- Toggle Refresh ---
const toggleRefresh = () => {
  isRefreshing.value = !isRefreshing.value
  if (isRefreshing.value) {
    console.log('[ReportedData] Manually starting refresh')
    fetchData(false)
    startPolling()
  } else {
    console.log('[ReportedData] Manually stopping refresh')
    stopPolling()
  }
}

// --- Lifecycle Hooks ---
onMounted(() => {
  fetchData(true)
  if (isRefreshing.value) {
    startPolling()
  }
})

onUnmounted(() => {
  stopPolling()
})

// 监听属性变化
watch(
  () => props.refreshInterval,
  () => {
    if (isRefreshing.value) {
      stopPolling()
      startPolling()
    }
  }
)

// --- Formatting Helpers ---
const formatRelativeTime = (timeStr: string | null | undefined): string => {
  if (!timeStr) return '-'
  const time = dayjs(timeStr).locale(currentLocale.value)
  if (!time.isValid()) return '-'
  const now = dayjs().locale(currentLocale.value)
  if (now.diff(time, 'minute') < 1) return $t('time.justNow')
  return time.fromNow()
}

const formatValue = (item: TelemetryItem | any): string => {
  if (item !== null && typeof item !== 'object') {
    if (typeof item === 'string') return item
    if (typeof item === 'number') return String(item)
    if (typeof item === 'boolean') return item ? $t('card.yes') : $t('card.no')
    return String(item)
  }

  if (!item || item.value === null || item.value === undefined) return '-'
  const value = item.value
  const key = item.key
  const unit = item.unit
  let displayValue = ''

  if (typeof value === 'boolean') {
    displayValue = value ? $t('card.yes') : $t('card.no')
    if (key?.includes('switch')) {
      displayValue = value ? $t('card.on') : $t('card.off')
    }
  } else if (typeof value === 'number') {
    if (
      (key === 'temperature' ||
        key === 'humidity' ||
        (typeof key === 'string' && (key.toLowerCase().includes('temp') || key.toLowerCase().includes('hum')))) &&
      value != null
    ) {
      displayValue = Number.isInteger(value) ? String(value) : value.toFixed(1)
    } else {
      displayValue = String(value)
    }
  } else {
    displayValue = String(value)
  }

  if (unit) {
    if (['%', '°C', '°F'].includes(unit)) {
      displayValue += unit
    } else if (unit.trim()) {
      displayValue += ` ${unit.trim()}`
    }
  }

  return displayValue
}
</script>

<style scoped>
.truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
