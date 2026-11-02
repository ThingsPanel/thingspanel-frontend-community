<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { NButton, NDrawer, NDrawerContent, NEmpty, NIcon, NSpin, NSwitch, NTag } from 'naive-ui'
import { RefreshOutline, TimeOutline } from '@vicons/ionicons5'
import { deviceRuntimeNative } from '@/service/api/device-runtime-native'
import { deviceCommandNative } from '@/service/api/device-command-native'
import { localStg } from '@/utils/storage'
import { deviceNative } from '@/service/api/device-native'
import type { DeviceConfigNativeBinding } from '@/service/api/native-template-binding'
import {
  hasNativeDeviceBinding,
  nativeCommandOptions,
  resolveDeviceNativeModel
} from '@/views/device/native-model-consumption'
import { decorateNativeTelemetryRows } from '@/views/device/native-device-model-contract'
import HistoryData from '@/views/device/details/modules/telemetry/modules/history-data.vue'
import TimeSeriesData from '@/views/device/details/modules/telemetry/modules/time-series-data.vue'
import { $t } from '@/locales'
import {
  buildSwitchCommandValue,
  getCanonicalOnOffReadingState,
  matchesSwitchTelemetryTarget,
  resolveStandardBooleanCommand,
  getCompactReadingDisplayValue,
  isDisplayableReading,
  isNumericReading
} from '@/utils/device-readings'

type DeviceRow = {
  id: string
  name?: string
  device_number?: string
  is_online?: number
  device_config_id?: string
  device_template_id?: string | null
  native_thing_model_id?: string | null
  native_thing_model_snapshot_id?: string | null
  native_thing_model_revision?: number | null
  native_binding_revision?: number
  resourceVersion?: number
  modelBinding?: { modelId: string; snapshotId: string; publishedRevision: number } | null
  templateId?: string | null
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
const nativeMetadataErrorsByDevice = ref<Record<string, string>>({})
const listLoading = ref(false)
const readingsLoading = ref(false)
const loadError = ref('')
const historyVisible = ref(false)
const selectedDevice = ref<DeviceRow | null>(null)
const selectedReading = ref<Reading | null>(null)
const commandModels = ref<
  Record<string, { snapshotId: string; commands: unknown[]; fields: Parameters<typeof decorateNativeTelemetryRows>[1] }>
>({})
const pendingSwitches = ref<Record<string, boolean>>({})
const switchMessages = ref<Record<string, string>>({})
let modelSession = localStg.get('token')
let requestSequence = 0
let disposed = false
onBeforeUnmount(() => {
  disposed = true
  requestSequence += 1
})

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
    if (['page', 'page_size', 'pageSize', 'group_id', 'group_scope', 'groupId', 'groupScope'].includes(key)) return
    if (value === undefined || value === null || value === '') return
    if (Array.isArray(value) && value.length === 0) return
    params[key] = value
  })

  if (props.groupScope === 'group' && props.groupId) {
    params.groupId = props.groupId
    params.includeDescendants = true
  }
  if (props.groupScope === 'ungrouped') params.groupScope = 'ungrouped'
  return params
}

async function fetchAllDevices(sequence: number) {
  const session = modelSession
  const current = () => !disposed && sequence === requestSequence && localStg.get('token') === session
  const pageSize = 100
  const allDevices: DeviceRow[] = []
  let total = Number.POSITIVE_INFINITY
  let page = 1

  while (current() && allDevices.length < total) {
    const query = { ...buildFilterParams(), page, pageSize }
    const response = await deviceNative.list(query as Parameters<typeof deviceNative.list>[0])
    if (!current()) return []
    const pageDevices: DeviceRow[] = response.items.map(device => ({
      ...device,
      device_number: device.deviceNumber,
      device_config_id: device.templateId ?? '',
      resourceVersion: device.resourceVersion,
      ...(device.modelBinding
        ? {
            native_thing_model_id: device.modelBinding.modelId,
            native_thing_model_snapshot_id: device.modelBinding.snapshotId,
            native_thing_model_revision: device.modelBinding.publishedRevision,
            native_binding_revision: device.resourceVersion
          }
        : {})
    }))
    total = Number.isFinite(Number(response.total)) ? Number(response.total) : pageDevices.length
    allDevices.push(...pageDevices)
    if (pageDevices.length === 0 || allDevices.length >= total) break
    page += 1
  }

  return allDevices
}

/** Native runtime owner resolves Community identities; the browser never derives legacy IDs. */
async function fetchLatestReadings(deviceId: string, current: () => boolean): Promise<Reading[]> {
  const rows: Reading[] = []
  let page = 1
  while (current()) {
    const response = await deviceRuntimeNative.listReadings(deviceId, {
      kind: 'telemetry',
      latestOnly: true,
      page,
      pageSize: 100
    })
    if (!current()) return []
    if (!Number.isSafeInteger(response.total) || response.total < 0 || response.page !== page)
      throw new Error('遥测分页结果无效')
    for (const item of response.items) {
      if (
        item.deviceId !== deviceId ||
        item.kind !== 'telemetry' ||
        typeof item.identifier !== 'string' ||
        typeof item.observedAt !== 'string'
      )
        throw new Error('遥测结果与设备不匹配')
      rows.push({
        key: item.identifier,
        ts: item.observedAt,
        value: item.value,
        unit: '',
        device_id: deviceId
      } as Reading)
    }
    if (rows.length >= response.total) return rows
    if (response.items.length === 0) throw new Error('遥测分页未完整返回，请刷新后重试')
    page += 1
  }
  return []
}

async function fetchDeviceReadings(deviceRows: DeviceRow[], sequence: number) {
  const session = modelSession
  const current = () => !disposed && sequence === requestSequence && localStg.get('token') === session
  const results: Record<string, Reading[]> = {}
  let nextIndex = 0
  const workerCount = Math.min(5, deviceRows.length)

  const workers = Array.from({ length: workerCount }, async () => {
    while (nextIndex < deviceRows.length && current()) {
      const device = deviceRows[nextIndex]
      nextIndex += 1
      let rows: Reading[] = []
      try {
        rows = await fetchLatestReadings(device.id, current)
      } catch (error) {
        if (!current()) return
        nativeMetadataErrorsByDevice.value[device.id] =
          error instanceof Error ? error.message : '设备遥测读取失败，请刷新后重试'
        results[device.id] = []
        continue
      }
      if (!current()) return

      try {
        let binding: DeviceConfigNativeBinding = device
        if (device.modelBinding) {
          binding = {
            id: device.id,
            native_thing_model_id: device.modelBinding.modelId,
            native_thing_model_snapshot_id: device.modelBinding.snapshotId,
            native_thing_model_revision: device.modelBinding.publishedRevision,
            native_binding_revision: device.resourceVersion
          }
        }

        if (hasNativeDeviceBinding(binding)) {
          const resolved = await resolveDeviceNativeModel(binding)
          if (!current()) return
          if (!resolved) throw new Error('设备物模型配置不完整，请联系管理员检查')
          rows = decorateNativeTelemetryRows(rows, resolved.platformFields)
          commandModels.value[device.id] = {
            snapshotId: resolved.snapshot.snapshotID,
            commands: nativeCommandOptions(resolved.snapshot.model),
            fields: resolved.platformFields
          }
        } else if (device.templateId || device.device_template_id) {
          throw new Error('设备模板尚未绑定原生物模型发布版本')
        } else {
          delete nativeMetadataErrorsByDevice.value[device.id]
        }
        results[device.id] = rows.filter(isDisplayableReading)
      } catch {
        if (!current()) return
        nativeMetadataErrorsByDevice.value[device.id] = '物模型字段读取失败，请刷新后重试'
        results[device.id] = []
      }
    }
  })

  await Promise.all(workers)
  if (current()) readingsByDevice.value = results
}

async function loadReadings() {
  modelSession = localStg.get('token')
  const sequence = ++requestSequence
  const session = modelSession
  const current = () => !disposed && sequence === requestSequence && localStg.get('token') === session
  listLoading.value = true
  readingsLoading.value = false
  loadError.value = ''
  devices.value = []
  readingsByDevice.value = {}
  nativeMetadataErrorsByDevice.value = {}
  commandModels.value = {}
  pendingSwitches.value = {}
  switchMessages.value = {}

  try {
    const nextDevices = await fetchAllDevices(sequence)
    if (!current()) return
    devices.value = nextDevices
    listLoading.value = false
    readingsLoading.value = nextDevices.length > 0
    await fetchDeviceReadings(nextDevices, sequence)
  } catch (error) {
    if (!current()) return
    loadError.value = error instanceof Error ? error.message : $t('custom.devicePage.readingsLoadFailed')
  } finally {
    if (current()) {
      listLoading.value = false
      readingsLoading.value = false
    }
  }
}

function switchKey(device: DeviceRow, reading: Reading) {
  return `${device.id}:${reading.key}`
}
function switchState(reading: Reading) {
  return typeof reading.value === 'boolean' ? reading.value : getCanonicalOnOffReadingState(reading)
}
function switchBinding(device: DeviceRow, reading: Reading) {
  const model = commandModels.value[device.id]
  const field = model?.fields.find(field => field.dataType === 'telemetry' && field.id === reading.key)
  if (!model || !field) return null
  const declaredReading =
    field.type === 'boolean' && typeof reading.value === 'boolean' ? { ...reading, data_type: 'Boolean' } : reading
  return resolveStandardBooleanCommand(declaredReading, model.commands)
}
function telemetryTime(value: unknown) {
  const numeric = typeof value === 'number' || typeof value === 'string' ? Number(value) : NaN
  if (Number.isFinite(numeric)) return numeric < 1e12 ? numeric * 1000 : numeric
  return typeof value === 'string' ? Date.parse(value) : NaN
}
async function changeSwitch(device: DeviceRow, reading: Reading, target: boolean) {
  const key = switchKey(device, reading)
  const model = commandModels.value[device.id]
  const binding = switchBinding(device, reading)
  if (
    !model ||
    !binding ||
    pendingSwitches.value[key] ||
    device.is_online === 0 ||
    modelSession !== localStg.get('token')
  )
    return
  const sequence = requestSequence
  const token = localStg.get('token')
  const current = () => !disposed && sequence === requestSequence && localStg.get('token') === token
  const startedAt = Date.now()
  pendingSwitches.value[key] = true
  switchMessages.value[key] = '正在提交命令；状态以遥测为准'
  try {
    const receipt = await deviceCommandNative.submit(
      device.id,
      {
        identifier: binding.identify,
        snapshotId: model.snapshotId,
        parameters: JSON.parse(buildSwitchCommandValue(binding, target)),
        timeoutSeconds: 8
      },
      crypto.randomUUID()
    )
    if (!current()) return
    if (receipt.deviceId !== device.id || receipt.identifier !== binding.identify)
      throw new Error('命令回执与设备不匹配')
    if (['failed', 'timed_out', 'expired', 'cancelled'].includes(receipt.state)) {
      switchMessages.value[key] = '命令执行失败或超时；当前值以遥测为准'
      return
    }
    switchMessages.value[key] = '命令已接收，等待设备回执和目标遥测'
    let acknowledged = receipt.state === 'acknowledged'
    const deadline = startedAt + 8000
    while (current() && Date.now() < deadline) {
      const [telemetry, status] = await Promise.allSettled([
        fetchLatestReadings(device.id, current),
        deviceCommandNative.get(device.id, receipt.id)
      ])
      if (!current()) return
      let matched = false
      if (telemetry.status === 'fulfilled') {
        const rows = decorateNativeTelemetryRows(telemetry.value, model.fields).filter(isDisplayableReading)
        readingsByDevice.value[device.id] = rows
        matched = rows.some(
          row =>
            row.key === reading.key && telemetryTime(row.ts) >= startedAt && matchesSwitchTelemetryTarget(row, target)
        )
      }
      if (status.status === 'fulfilled') {
        if (
          status.value.deviceId !== device.id ||
          status.value.id !== receipt.id ||
          status.value.identifier !== binding.identify
        )
          throw new Error('命令回执与设备不匹配')
        acknowledged ||= status.value.state === 'acknowledged'
        if (['failed', 'timed_out', 'expired', 'cancelled'].includes(status.value.state)) {
          switchMessages.value[key] = '命令执行失败或超时；当前值以遥测为准'
          return
        }
      }
      if (matched) {
        switchMessages.value[key] = '新遥测已确认目标状态'
        return
      }
      await new Promise(resolve => window.setTimeout(resolve, 400))
    }
    if (current())
      switchMessages.value[key] = acknowledged
        ? '设备已回执，遥测尚未确认目标状态'
        : '命令已接收，尚未确认执行或目标遥测'
  } catch (error) {
    if (current())
      switchMessages.value[key] = error instanceof Error ? error.message : '命令结果未确认，请刷新遥测后检查'
  } finally {
    if (current()) delete pendingSwitches.value[key]
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
            <NTag v-if="device.is_online === 1" size="small" type="success">
              {{ $t('custom.devicePage.online') }}
            </NTag>
            <NTag v-else-if="device.is_online === 0" size="small" type="default">
              {{ $t('custom.devicePage.offline') }}
            </NTag>
            <span v-else>-</span>
          </div>
          <p v-if="nativeMetadataErrorsByDevice[device.id]" class="device-readings-row__metadata-error">
            {{ nativeMetadataErrorsByDevice[device.id] }}
          </p>

          <div v-if="readingsLoading && !readingsByDevice[device.id]" class="device-readings-row__placeholder">
            {{ $t('custom.devicePage.loadingReadings') }}
          </div>
          <div v-else-if="readingsByDevice[device.id]?.length" class="device-readings-row__values">
            <div
              v-for="reading in readingsByDevice[device.id]"
              :key="`${device.id}:${reading.key}`"
              class="device-reading"
            >
              <button
                type="button"
                class="device-reading__history-trigger"
                :title="$t('custom.devicePage.openTelemetryHistory', { name: reading.label || reading.key })"
                @click="openReadingHistory(device, reading)"
              >
                <span class="device-reading__label">{{ reading.label || reading.key }}</span>
                <span class="device-reading__value">
                  {{ getCompactReadingDisplayValue(reading) }}
                  <small v-if="reading.unit">{{ reading.unit }}</small>
                </span>
                <NIcon class="device-reading__history" size="14">
                  <TimeOutline />
                </NIcon>
              </button>
              <NSwitch
                v-if="switchBinding(device, reading)"
                :value="switchState(reading) ?? false"
                :loading="Boolean(pendingSwitches[switchKey(device, reading)])"
                :disabled="
                  Boolean(pendingSwitches[switchKey(device, reading)]) ||
                  device.is_online === 0 ||
                  switchState(reading) === null
                "
                :aria-label="`${reading.label || reading.key} 开关`"
                @update:value="value => changeSwitch(device, reading, value)"
              />
              <span v-if="switchMessages[switchKey(device, reading)]" role="status">
                {{ switchMessages[switchKey(device, reading)] }}
              </span>
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

.device-readings-row__metadata-error {
  margin: 4px 0 0;
  color: var(--error-color);
  font-size: 12px;
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
