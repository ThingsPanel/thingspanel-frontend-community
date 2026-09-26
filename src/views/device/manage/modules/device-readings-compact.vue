<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { NButton, NDrawer, NDrawerContent, NEmpty, NIcon, NSpin, NSwitch, NTag } from 'naive-ui'
import { RefreshOutline, TimeOutline } from '@vicons/ionicons5'
import { commandDataPub, deviceConfigInfo, deviceList, telemetryDataCurrent } from '@/service/api/device'
import { commandsApi as getTemplateCommands, telemetryApi as getTemplateTelemetry } from '@/service/api/system-data'
import HistoryData from '@/views/device/details/modules/telemetry/modules/history-data.vue'
import TimeSeriesData from '@/views/device/details/modules/telemetry/modules/time-series-data.vue'
import { $t } from '@/locales'
import {
  getCompactReadingDisplayValue,
  getReadingDisplayValue,
  isDisplayableReading,
  isNumericReading,
  resolveStandardBooleanCommand
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
const commandsByDevice = ref<Record<string, unknown[]>>({})
const booleanTelemetryKeysByDevice = ref<Record<string, string[]>>({})
const pendingSwitches = ref<Record<string, boolean>>({})
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

function parseBooleanTelemetryKeys(value: unknown) {
  let model: unknown = value
  if (typeof value === 'string') {
    try {
      model = JSON.parse(value)
    } catch {
      return []
    }
  }
  if (!Array.isArray(model)) return []
  return model.flatMap((field: any) => {
    const identifier = field?.data_identifier || field?.identifier || field?.key
    return identifier &&
      String(field?.data_type || '')
        .trim()
        .toLowerCase() === 'boolean'
      ? [String(identifier)]
      : []
  })
}

function parseModelList(response: any) {
  if (Array.isArray(response?.data?.list)) return response.data.list
  if (Array.isArray(response?.data)) return response.data
  return []
}

async function fetchDeviceCommands(deviceRows: DeviceRow[], sequence: number) {
  const templateDetails = new Map<string, Promise<{ commands: unknown[]; telemetry: unknown[] }>>()
  const configTemplates = new Map<string, Promise<string>>()
  const results: Record<string, unknown[]> = {}
  const booleanKeys: Record<string, string[]> = {}
  await Promise.all(
    deviceRows.map(async device => {
      try {
        let templateId = typeof device.device_template_id === 'string' ? device.device_template_id : ''
        if (!templateId && typeof device.device_config_id === 'string' && device.device_config_id) {
          const configId = device.device_config_id
          let configRequest = configTemplates.get(configId)
          if (!configRequest) {
            configRequest = deviceConfigInfo({ id: configId }).then(response =>
              String(response?.data?.device_template_id || '')
            )
            configTemplates.set(configId, configRequest)
          }
          templateId = await configRequest
        }
        if (!templateId) return

        let request = templateDetails.get(templateId)
        if (!request) {
          request = Promise.all([
            getTemplateCommands({ page: 1, page_size: 1000, device_template_id: templateId }),
            getTemplateTelemetry({ page: 1, page_size: 1000, device_template_id: templateId })
          ]).then(([commandsResponse, telemetryResponse]) => ({
            commands: parseModelList(commandsResponse),
            telemetry: parseModelList(telemetryResponse)
          }))
          templateDetails.set(templateId, request)
        }
        const template = await request
        results[device.id] = template.commands
        booleanKeys[device.id] = parseBooleanTelemetryKeys(template.telemetry)
      } catch {
        results[device.id] = []
        booleanKeys[device.id] = []
      }
    })
  )
  if (sequence === requestSequence) {
    commandsByDevice.value = results
    booleanTelemetryKeysByDevice.value = booleanKeys
  }
}

async function loadReadings() {
  const sequence = ++requestSequence
  listLoading.value = true
  readingsLoading.value = false
  loadError.value = ''
  devices.value = []
  readingsByDevice.value = {}
  commandsByDevice.value = {}
  booleanTelemetryKeysByDevice.value = {}

  try {
    const nextDevices = await fetchAllDevices(sequence)
    if (sequence !== requestSequence) return
    devices.value = nextDevices
    listLoading.value = false
    readingsLoading.value = nextDevices.length > 0
    await Promise.all([fetchDeviceReadings(nextDevices, sequence), fetchDeviceCommands(nextDevices, sequence)])
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

function isDeclaredBooleanReading(device: DeviceRow, reading: Reading) {
  return booleanTelemetryKeysByDevice.value[device.id]?.includes(reading.key) || false
}

function getStandardBooleanReading(device: DeviceRow, reading: Reading) {
  if (!isDeclaredBooleanReading(device, reading) || typeof reading.value !== 'boolean') return null
  return { ...reading, data_type: 'boolean' }
}

function getSwitchCommandBinding(device: DeviceRow, reading: Reading) {
  const standardReading = getStandardBooleanReading(device, reading)
  return resolveStandardBooleanCommand(standardReading || reading, commandsByDevice.value[device.id] || [])
}

function isSwitchReading(device: DeviceRow, reading: Reading) {
  return (
    isDeclaredBooleanReading(device, reading) ||
    reading.value === 'on' ||
    reading.value === 'off' ||
    Boolean(getSwitchCommandBinding(device, reading))
  )
}

function getSwitchState(device: DeviceRow, reading: Reading): boolean | null {
  const standardReading = getStandardBooleanReading(device, reading)
  if (standardReading) return standardReading.value as boolean
  if (reading.value === 'on') return true
  if (reading.value === 'off') return false
  return null
}

function switchPendingKey(device: DeviceRow, reading: Reading) {
  return `${device.id}:${reading.key}`
}

async function changeBooleanReading(device: DeviceRow, reading: Reading, value: boolean) {
  const binding = getSwitchCommandBinding(device, reading)
  const pendingKey = switchPendingKey(device, reading)
  if (!binding || pendingSwitches.value[pendingKey]) return
  pendingSwitches.value[pendingKey] = true
  try {
    const response = await commandDataPub({
      device_id: device.id,
      identify: binding.identify,
      value:
        binding.payloadMode === 'mapped-command'
          ? JSON.stringify({ [binding.parameterIdentifier!]: value ? binding.onValue : binding.offValue })
          : JSON.stringify({ [binding.parameterIdentifier!]: value })
    })
    if (response?.error || response?.success === false) {
      window.$message?.error(response?.error?.message || response?.error || '命令发送失败')
      return
    }
    // Command acceptance is not proof that the physical device changed state.
    // Keep the switch controlled by the authoritative telemetry sample.
    const latest = await telemetryDataCurrent(device.id)
    readingsByDevice.value[device.id] = Array.isArray(latest?.data) ? latest.data.filter(isDisplayableReading) : []
  } catch (error) {
    window.$message?.error(error instanceof Error ? error.message : '命令发送失败')
  } finally {
    delete pendingSwitches.value[pendingKey]
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
            <div
              v-for="reading in readingsByDevice[device.id]"
              :key="`${device.id}:${reading.key}`"
              class="device-reading"
              :class="{ 'device-reading--boolean': isSwitchReading(device, reading) }"
            >
              <button
                type="button"
                class="device-reading__history-trigger"
                :title="$t('custom.devicePage.openTelemetryHistory', { name: reading.label || reading.key })"
                @click="openReadingHistory(device, reading)"
              >
                <span class="device-reading__label">{{ reading.label || reading.key }}</span>
                <span v-if="!isSwitchReading(device, reading)" class="device-reading__value">
                  {{ getCompactReadingDisplayValue(reading) }}
                  <small v-if="reading.unit">{{ reading.unit }}</small>
                </span>
                <NIcon v-if="!isSwitchReading(device, reading)" class="device-reading__history" size="14">
                  <TimeOutline />
                </NIcon>
                <span
                  v-else-if="getSwitchState(device, reading) === null"
                  class="device-reading__raw-boolean"
                  :title="'模板声明为 Boolean，但遥测值不是 JSON true/false'"
                >
                  {{ getReadingDisplayValue(reading) }}
                </span>
              </button>
              <NSwitch
                v-if="isSwitchReading(device, reading)"
                :value="getSwitchState(device, reading)"
                :loading="Boolean(pendingSwitches[switchPendingKey(device, reading)])"
                :disabled="
                  device.is_online !== 1 ||
                  getSwitchState(device, reading) === null ||
                  !getSwitchCommandBinding(device, reading)
                "
                :title="
                  device.is_online !== 1
                    ? '设备离线'
                    : getSwitchState(device, reading) === null
                      ? '遥测值必须是 JSON true/false，或模板明确配置 on/off 双态枚举'
                      : !getSwitchCommandBinding(device, reading)
                        ? '请在设备模板中配置同标识且只有一个 Boolean 参数的命令'
                        : ''
                "
                size="small"
                :aria-label="String(reading.label || reading.key)"
                @update:value="value => changeBooleanReading(device, reading, value)"
              />
            </div>
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
  transition:
    border-color 160ms ease,
    background-color 160ms ease;

  &:hover {
    border-color: var(--primary-color);
    background: var(--primary-color-suppl);
  }
}

.device-reading__history-trigger {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  min-width: 0;
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  cursor: pointer;

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

.device-reading--boolean {
  flex: 1 1 250px;
  justify-content: space-between;
  min-width: 250px;
  max-width: 360px;

  .device-reading__history-trigger {
    flex: 1;
    justify-content: flex-start;
  }
}

.device-reading__raw-boolean {
  color: var(--warning-color, #d48806);
  font-size: 11px;
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
