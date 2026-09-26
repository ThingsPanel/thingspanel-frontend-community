<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { NButton, NDrawer, NDrawerContent, NEmpty, NIcon, NSpin, NTag } from 'naive-ui'
import { RefreshOutline, TimeOutline } from '@vicons/ionicons5'
import { deviceList, telemetryDataCurrent } from '@/service/api/device'
import HistoryData from '@/views/device/details/modules/telemetry/modules/history-data.vue'
import TimeSeriesData from '@/views/device/details/modules/telemetry/modules/time-series-data.vue'
import { $t } from '@/locales'
import {
  getCompactReadingDisplayValue,
  getReadingDisplayValue,
  isBooleanReading,
  isDisplayableReading,
  isNumericReading
} from '@/utils/device-readings'

type DeviceRow = {
  id: string
  name?: string
  device_number?: string
  is_online?: number
  [key: string]: unknown
}

type Reading = DeviceManagement.telemetryData

const props = defineProps<{
  filters: Record<string, unknown>
  groupId: string
  groupScope: 'all' | 'ungrouped' | 'group'
  groupName: string
}>()

const emit = defineEmits<{
  'open-device': [device: DeviceRow]
}>()

const devices = ref<DeviceRow[]>([])
const readingsByDevice = ref<Record<string, Reading[]>>({})
const listLoading = ref(false)
const readingsLoading = ref(false)
const loadError = ref('')
const historyVisible = ref(false)
const selectedDevice = ref<DeviceRow | null>(null)
const selectedReading = ref<Reading | null>(null)
let requestSequence = 0

const filterKey = computed(() => JSON.stringify(props.filters || {}))
const visibleDeviceCount = computed(() => devices.value.length)
const historyTitle = computed(() => {
  const reading = selectedReading.value
  if (!reading) return $t('custom.devicePage.telemetryHistory')
  return `${reading.label || reading.key}${reading.unit ? ` (${reading.unit})` : ''}`
})
const historyUsesCurve = computed(() => Boolean(selectedReading.value && isNumericReading(selectedReading.value)))

function buildFilterParams() {
  const params: Record<string, unknown> = {}
  Object.entries(props.filters || {}).forEach(([key, value]) => {
    if (['page', 'page_size', 'group_id', 'group_scope'].includes(key)) return
    if (value === undefined || value === null || value === '') return
    if (Array.isArray(value) && value.length === 0) return
    params[key] = value
  })

  if (props.groupScope === 'group' && props.groupId) params.group_id = props.groupId
  if (props.groupScope === 'ungrouped') params.group_scope = 'ungrouped'
  return params
}

async function fetchAllDevices(sequence: number) {
  const pageSize = 100
  const allDevices: DeviceRow[] = []
  let total = Number.POSITIVE_INFINITY
  let page = 1

  while (allDevices.length < total) {
    const response = await deviceList({ ...buildFilterParams(), page, page_size: pageSize })
    if (sequence !== requestSequence) return []
    if (response?.error) throw new Error(response.error.message || $t('custom.devicePage.readingsLoadFailed'))

    const pageDevices = Array.isArray(response?.data?.list) ? response.data.list : []
    total = Number.isFinite(Number(response?.data?.total)) ? Number(response.data.total) : pageDevices.length
    allDevices.push(...pageDevices)
    if (pageDevices.length === 0 || allDevices.length >= total) break
    page += 1
  }

  return allDevices
}

async function fetchDeviceReadings(deviceRows: DeviceRow[], sequence: number) {
  const results: Record<string, Reading[]> = {}
  let nextIndex = 0
  const workerCount = Math.min(5, deviceRows.length)

  const workers = Array.from({ length: workerCount }, async () => {
    while (nextIndex < deviceRows.length && sequence === requestSequence) {
      const device = deviceRows[nextIndex]
      nextIndex += 1
      try {
        const response = await telemetryDataCurrent(device.id)
        const rows = Array.isArray(response?.data) ? response.data.filter(isDisplayableReading) : []
        results[device.id] = rows
      } catch {
        results[device.id] = []
      }
    }
  })

  await Promise.all(workers)
  if (sequence === requestSequence) readingsByDevice.value = results
}

async function loadReadings() {
  const sequence = ++requestSequence
  listLoading.value = true
  readingsLoading.value = false
  loadError.value = ''
  devices.value = []
  readingsByDevice.value = {}

  try {
    const nextDevices = await fetchAllDevices(sequence)
    if (sequence !== requestSequence) return
    devices.value = nextDevices
    listLoading.value = false
    readingsLoading.value = nextDevices.length > 0
    await fetchDeviceReadings(nextDevices, sequence)
  } catch (error) {
    if (sequence !== requestSequence) return
    loadError.value = error instanceof Error ? error.message : $t('custom.devicePage.readingsLoadFailed')
  } finally {
    if (sequence === requestSequence) {
      listLoading.value = false
      readingsLoading.value = false
    }
  }
}

function openReadingHistory(device: DeviceRow, reading: Reading) {
  selectedDevice.value = device
  selectedReading.value = reading
  historyVisible.value = true
}

watch([filterKey, () => props.groupId, () => props.groupScope], () => void loadReadings(), { immediate: true })
</script>

<template>
  <section class="device-readings-compact">
    <div class="device-readings-compact__header">
      <div class="device-readings-compact__heading">
        <h3>{{ groupName }}</h3>
        <span>{{ visibleDeviceCount }} {{ $t('custom.devicePage.resultCount') }}</span>
      </div>
      <NButton quaternary size="small" :loading="listLoading || readingsLoading" @click="loadReadings">
        <template #icon>
          <NIcon><RefreshOutline /></NIcon>
        </template>
        {{ $t('custom.devicePage.refreshReadings') }}
      </NButton>
    </div>

    <NSpin :show="listLoading">
      <NEmpty v-if="loadError" class="device-readings-compact__empty" :description="loadError">
        <template #extra>
          <NButton size="small" @click="loadReadings">{{ $t('custom.devicePage.retryReadings') }}</NButton>
        </template>
      </NEmpty>
      <NEmpty
        v-else-if="!listLoading && devices.length === 0"
        class="device-readings-compact__empty"
        :description="$t('custom.devicePage.noDevicesInGroup')"
      />
      <div v-else class="device-readings-compact__rows" :aria-busy="readingsLoading">
        <article v-for="device in devices" :key="device.id" class="device-readings-row">
          <div class="device-readings-row__device">
            <button type="button" class="device-readings-row__name" @click="emit('open-device', device)">
              {{ device.name || device.device_number || device.id }}
            </button>
            <NTag size="small" :type="device.is_online === 1 ? 'success' : 'default'">
              {{ device.is_online === 1 ? $t('custom.devicePage.online') : $t('custom.devicePage.offline') }}
            </NTag>
          </div>

          <div v-if="readingsLoading && !readingsByDevice[device.id]" class="device-readings-row__placeholder">
            {{ $t('custom.devicePage.loadingReadings') }}
          </div>
          <div v-else-if="readingsByDevice[device.id]?.length" class="device-readings-row__values">
            <button
              v-for="reading in readingsByDevice[device.id]"
              :key="`${device.id}:${reading.key}`"
              type="button"
              class="device-reading"
              :title="$t('custom.devicePage.openTelemetryHistory', { name: reading.label || reading.key })"
              @click="openReadingHistory(device, reading)"
            >
              <span class="device-reading__label">{{ reading.label || reading.key }}</span>
              <span v-if="isBooleanReading(reading)" class="device-reading__value">
                {{ getCompactReadingDisplayValue(reading) }}
              </span>
              <span v-else class="device-reading__value">
                {{ getReadingDisplayValue(reading) }}
                <small v-if="reading.unit">{{ reading.unit }}</small>
              </span>
              <NIcon class="device-reading__history" size="14"><TimeOutline /></NIcon>
            </button>
          </div>
          <div v-else class="device-readings-row__placeholder">
            {{ $t('custom.devicePage.noTelemetryReadings') }}
          </div>
        </article>
      </div>
    </NSpin>

    <NDrawer v-model:show="historyVisible" placement="right" :width="920">
      <NDrawerContent :title="historyTitle" closable>
        <TimeSeriesData
          v-if="historyUsesCurve && selectedReading && selectedDevice"
          :device-id="selectedDevice.id"
          :the-key="selectedReading.key"
          :the-name="selectedReading.label || selectedReading.key"
          :the-unit="selectedReading.unit || ''"
        />
        <HistoryData
          v-else-if="selectedReading && selectedDevice"
          :device-id="selectedDevice.id"
          :the-key="selectedReading.key"
        />
      </NDrawerContent>
    </NDrawer>
  </section>
</template>

<style scoped lang="scss">
.device-readings-compact {
  min-height: 240px;
  height: 100%;
  overflow: auto;
  color: var(--text-color);
}

.device-readings-compact__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 0 4px 10px;
  border-bottom: 1px solid var(--border-color);
}

.device-readings-compact__heading {
  display: flex;
  align-items: baseline;
  gap: 10px;
  min-width: 0;

  h3 {
    margin: 0;
    overflow: hidden;
    font-size: 16px;
    font-weight: 600;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  > span {
    color: var(--text-color-3);
    font-size: 12px;
    white-space: nowrap;
  }
}

.device-readings-compact__empty {
  padding: 64px 16px;
}

.device-readings-row {
  display: grid;
  grid-template-columns: minmax(150px, 220px) minmax(0, 1fr);
  gap: 16px;
  align-items: center;
  padding: 12px 6px;
  border-bottom: 1px solid var(--border-color);
}

.device-readings-row__device {
  display: flex;
  align-items: center;
  gap: 9px;
  min-width: 0;
}

.device-readings-row__name {
  min-width: 0;
  overflow: hidden;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--text-color);
  font: inherit;
  font-weight: 600;
  text-align: left;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;

  &:hover {
    color: var(--primary-color);
  }

  &:focus-visible {
    outline: 2px solid var(--primary-color);
    outline-offset: 2px;
  }
}

.device-readings-row__values {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 8px;
  min-width: 0;
}

.device-reading {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  min-height: 32px;
  max-width: 100%;
  padding: 4px 9px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: var(--card-color);
  color: var(--text-color);
  font: inherit;
  font-size: 13px;
  cursor: pointer;
  transition:
    border-color 160ms ease,
    background-color 160ms ease;

  &:hover {
    border-color: var(--primary-color);
    background: var(--primary-color-suppl);
  }

  &:focus-visible {
    outline: 2px solid var(--primary-color);
    outline-offset: 2px;
  }
}

.device-reading__label {
  max-width: 220px;
  overflow: hidden;
  color: var(--text-color-3);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.device-reading__value {
  font-variant-numeric: tabular-nums;
  font-weight: 600;
  white-space: nowrap;

  small {
    color: var(--text-color-3);
    font-size: 11px;
    font-weight: 400;
  }
}

.device-reading__history {
  flex: 0 0 auto;
  color: var(--primary-color);
}

.device-readings-row__placeholder {
  color: var(--text-color-3);
  font-size: 12px;
}

@media (max-width: 768px) {
  .device-readings-row {
    grid-template-columns: minmax(0, 1fr);
    gap: 8px;
    padding: 12px 4px;
  }

  .device-readings-row__values {
    padding-left: 2px;
  }

  .device-reading__label {
    max-width: 42vw;
  }
}
</style>
