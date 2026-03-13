<template>
  <div class="thingsvis-frame-container">
    <iframe
      v-if="url && token"
      ref="iframeRef"
      :src="url"
      class="thingsvis-frame"
      frameborder="0"
      allowfullscreen
    ></iframe>
    <div v-else class="loading-placeholder">正在连接可视化引擎...</div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { getThingsVisToken } from '@/utils/thingsvis'
import {
  deviceList,
  getDeviceConfigList,
  telemetryDataCurrent,
  getAttributeDataSet,
  telemetryDataHistoryList
} from '@/service/api/device'
import {
  attributesApi,
  getAlarmCount,
  getOnlineDeviceTrend,
  getSystemMetricsCurrent,
  getSystemMetricsHistory,
  telemetryApi,
  tenant
} from '@/service/api'
import { extractPlatformFields } from '@/utils/thingsvis/platform-fields'
import {
  getGlobalPlatformFields,
  resolveGlobalPlatformFieldScope
} from '@/utils/thingsvis/global-platform-fields'
import { localStg } from '@/utils/storage'
import { getWebsocketServerUrl } from '@/utils/common/tool'

const EDITOR_TEMPLATE_FIELD_PAGE_SIZE = 1000

const props = defineProps<{
  id: string
  mode?: string
}>()

const router = useRouter()

// ─── Device WebSocket management ─────────────────────────────────────────────

const PING_INTERVAL_MS = 8_000
const WS_RECONNECT_DELAY_MS = 3_000

interface DeviceWsEntry {
  ws: WebSocket | null
  pingTimer: ReturnType<typeof setInterval> | null
  reconnectTimer: ReturnType<typeof setTimeout> | null
  destroyed: boolean
  device: { deviceId: string; fields: Array<{ id?: string; name?: string }> }
}

type PlatformDeviceEntry = {
  deviceId: string
  deviceName: string
  groupName: string
  templateId?: string
  fields: Array<{ id?: string; name?: string }>
  presets: any[]
}

type TemplateEntry = {
  fields: Array<{ id?: string; name?: string }>
}

const deviceWsMap = new Map<string, DeviceWsEntry>()
const activePlatformDevices = new Map<string, { deviceId: string; fields: Array<{ id?: string; name?: string }> }>()
const templateEntryCache = new Map<string, TemplateEntry>()
let platformDevicesCache: PlatformDeviceEntry[] | null = null
let platformDevicesCachePromise: Promise<PlatformDeviceEntry[]> | null = null

/** Extract flat key→value map from various WS response shapes. */
function extractWsFields(payload: unknown): Record<string, unknown> {
  if (!payload || typeof payload !== 'object') return {}
  const obj = payload as Record<string, unknown>

  // Unwrap envelope formats
  if (obj.fields && typeof obj.fields === 'object' && !Array.isArray(obj.fields)) {
    return extractWsFields(obj.fields)
  }
  if (obj.data !== undefined) return extractWsFields(obj.data)
  if (obj.payload !== undefined) return extractWsFields(obj.payload)

  // Array of { key, value } items
  if (Array.isArray(payload)) {
    const fields: Record<string, unknown> = {}
    ;(payload as Array<{ key?: string; label?: string; value?: unknown }>).forEach(item => {
      if (!item) return
      const k = item.key ?? item.label
      if (!k || k === 'systime') return
      if (item.value !== undefined) fields[k] = item.value
    })
    return fields
  }

  // Flat object
  const fields: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(obj)) {
    if (k !== 'systime') fields[k] = v
  }
  return fields
}

/**
 * Map raw WS field keys to canonical platform field IDs.
 * Tries field.id first, then field.name as fallback.
 * Falls back to the raw payload when nothing maps.
 */
function mapFieldIds(
  rawFields: Record<string, unknown>,
  deviceFields: Array<{ id?: string; name?: string }>
): Record<string, unknown> {
  if (deviceFields.length === 0) return rawFields
  const mapped: Record<string, unknown> = {}
  for (const field of deviceFields) {
    if (!field.id) continue
    const byId = rawFields[field.id]
    const byName = field.name !== undefined ? rawFields[field.name] : undefined
    if (byId !== undefined) mapped[field.id] = byId
    else if (byName !== undefined) mapped[field.id] = byName
  }
  return Object.keys(mapped).length > 0 ? mapped : rawFields
}

/** Open (or re-open) a telemetry WebSocket for one device. */
function connectDeviceWs(device: { deviceId: string; fields: Array<{ id?: string; name?: string }> }) {
  const { deviceId } = device

  // Tear down any existing connection for this device
  const prev = deviceWsMap.get(deviceId)
  if (prev) {
    prev.destroyed = true
    if (prev.pingTimer) clearInterval(prev.pingTimer)
    if (prev.reconnectTimer) clearTimeout(prev.reconnectTimer)
    prev.ws?.close()
  }

  const entry: DeviceWsEntry = {
    ws: null,
    pingTimer: null,
    reconnectTimer: null,
    destroyed: false,
    device
  }
  deviceWsMap.set(deviceId, entry)

  function openWs() {
    if (entry.destroyed) return

    const token = localStg.get('token') as string | undefined
    if (!token) {
      entry.reconnectTimer = setTimeout(openWs, WS_RECONNECT_DELAY_MS)
      return
    }

    try {
      const wsUrl = `${getWebsocketServerUrl()}/telemetry/datas/current/ws`
      entry.ws = new WebSocket(wsUrl)
    } catch (err) {
      console.warn('[AppFrame] WS init failed for device', deviceId, err)
      entry.reconnectTimer = setTimeout(openWs, WS_RECONNECT_DELAY_MS)
      return
    }

    entry.ws.onopen = () => {
      if (!entry.ws) return
      entry.ws.send(JSON.stringify({ device_id: deviceId, token }))
      entry.pingTimer = setInterval(() => {
        if (entry.ws?.readyState === WebSocket.OPEN) entry.ws.send('ping')
      }, PING_INTERVAL_MS)
    }

    entry.ws.onmessage = evt => {
      if (typeof evt.data !== 'string' || evt.data === 'pong') return
      try {
        const msg = JSON.parse(evt.data)
        const rawFields = extractWsFields(msg)
        if (Object.keys(rawFields).length === 0) return
        const fields = mapFieldIds(rawFields, device.fields)
        const win = iframeRef.value?.contentWindow
        if (!win) return
        // Fan-out to both channels:
        // 1. Device-scoped  → __platform_deviceId__  (bindings configured with a specific device)
        // 2. Global channel → __platform__            (bindings configured with "当前设备模板")
        win.postMessage({ type: 'tv:platform-data', payload: { deviceId, fields } }, '*')
        win.postMessage({ type: 'tv:platform-data', payload: { fields } }, '*')
      } catch {
        // ignore non-JSON frames
      }
    }

    entry.ws.onerror = () => {
      /* reconnect handled by onclose */
    }

    entry.ws.onclose = () => {
      if (entry.destroyed) return
      if (entry.pingTimer) {
        clearInterval(entry.pingTimer)
        entry.pingTimer = null
      }
      console.warn('[AppFrame] WS closed for device', deviceId, '— scheduling reconnect')
      entry.reconnectTimer = setTimeout(openWs, WS_RECONNECT_DELAY_MS)
    }
  }

  openWs()
}

function ensureDeviceWs(deviceId?: string) {
  if (!deviceId) return
  const device = activePlatformDevices.get(deviceId)
  if (!device) return
  const existing = deviceWsMap.get(deviceId)
  if (existing && !existing.destroyed) return
  connectDeviceWs(device)
}

/** Disconnect and clean up all device WebSocket connections. */
function disconnectAllDeviceWs() {
  for (const entry of deviceWsMap.values()) {
    entry.destroyed = true
    if (entry.pingTimer) clearInterval(entry.pingTimer)
    if (entry.reconnectTimer) clearTimeout(entry.reconnectTimer)
    entry.ws?.close()
  }
  deviceWsMap.clear()
}

// ─── End WS management ───────────────────────────────────────────────────────

/**
 * Guard against concurrent tv:ready re-inits.
 * Studio sends tv:ready twice (once on load, once after bootstrap completes).
 * Both trigger buildPlatformDevices() which takes ~1s. Without a guard,
 * the second call tears down WS while the first is still completing.
 */
let initInProgress = false
let pendingInitDebounceTimer: ReturnType<typeof setTimeout> | null = null

type HistoryPoint = { value: unknown; ts: number }
type RequestedFieldResult = {
  fields: Record<string, unknown>
  histories: Array<{ fieldId: string; history: HistoryPoint[]; deviceId?: string }>
}

const token = ref('')
const url = ref('')
const iframeRef = ref<HTMLIFrameElement>()

const currentUserInfo = localStg.get('userInfo') as Api.Auth.UserInfo | null
const globalPlatformFieldScope = resolveGlobalPlatformFieldScope(currentUserInfo)
const globalPlatformFields = getGlobalPlatformFields(globalPlatformFieldScope)

/** Strip any hash fragment and return the bare Studio HTML base URL. */
function getStudioBase(): string {
  const raw = (import.meta.env.VITE_THINGSVIS_STUDIO_URL as string) || 'http://localhost:3000/main'
  const hashIdx = raw.indexOf('#')
  return hashIdx !== -1 ? raw.substring(0, hashIdx) : raw
}

function buildThingsVisFrameUrl(thingsVisToken: string): string {
  const apiBaseUrl = encodeURIComponent(window.location.origin + '/thingsvis-api')

  if (props.mode === 'viewer') {
    return `${getStudioBase()}#/embed?id=${encodeURIComponent(props.id)}&token=${thingsVisToken}&mode=embedded&apiBaseUrl=${apiBaseUrl}`
  }

  return `${getStudioBase()}#/editor/${encodeURIComponent(props.id)}?mode=embedded&token=${thingsVisToken}&apiBaseUrl=${apiBaseUrl}`
}

function normalizeHistory(records: any[], valueKey: string): HistoryPoint[] {
  return records
    .map((item: any) => ({
      value: item?.[valueKey] ?? item?.value ?? item?.avg ?? item?.y ?? 0,
      ts: new Date(item?.timestamp || item?.time || item?.x || item?.ts || Date.now()).getTime()
    }))
    .filter(point => !Number.isNaN(point.ts))
}

function normalizeMetricValue(value: unknown): number {
  const num = Number(value)
  return Number.isFinite(num) ? num : 0
}

function normalizeTenantGrowthHistory(records: any[]): HistoryPoint[] {
  const currentYear = new Date().getFullYear()

  return records
    .map((item: any) => {
      const month = Number(item?.mon)
      if (!Number.isFinite(month) || month < 1 || month > 12) return null

      return {
        value: normalizeMetricValue(item?.num),
        ts: new Date(currentYear, month - 1, 1).getTime()
      }
    })
    .filter((point): point is HistoryPoint => Boolean(point) && !Number.isNaN(point.ts))
}

function normalizeSystemMetricHistory(records: any[], metricKey: 'cpu' | 'memory' | 'disk'): HistoryPoint[] {
  return records
    .map((item: any) => ({
      value: normalizeMetricValue(item?.[`${metricKey}_usage`] ?? item?.[metricKey]),
      ts: new Date(item?.timestamp || item?.time || item?.x || item?.ts || Date.now()).getTime()
    }))
    .filter((point) => !Number.isNaN(point.ts))
}

function unwrapList(payload: any): any[] {
  if (Array.isArray(payload?.list)) return payload.list
  if (Array.isArray(payload)) return payload
  return []
}

async function loadTemplateEntry(templateId: string | number) {
  const cacheKey = String(templateId)
  const cached = templateEntryCache.get(cacheKey)
  if (cached) return cached

  const [telemetryResult, attributesResult] = await Promise.allSettled([
    telemetryApi({ page: 1, page_size: EDITOR_TEMPLATE_FIELD_PAGE_SIZE, device_template_id: templateId }),
    attributesApi({ page: 1, page_size: EDITOR_TEMPLATE_FIELD_PAGE_SIZE, device_template_id: templateId })
  ])

  const telemetryRes = telemetryResult.status === 'fulfilled' ? telemetryResult.value : null
  const attributesRes = attributesResult.status === 'fulfilled' ? attributesResult.value : null

  const platformSource = {
    telemetry: unwrapList(telemetryRes?.data),
    attributes: unwrapList(attributesRes?.data)
  }
  const extractedFields = extractPlatformFields(platformSource)

  const entry: TemplateEntry = {
    fields: extractedFields
  }

  templateEntryCache.set(cacheKey, entry)
  return entry
}

async function buildRequestedFieldData(fieldIds: unknown[], deviceId?: string): Promise<RequestedFieldResult> {
  const requestedFields = Array.isArray(fieldIds)
    ? fieldIds.filter((fieldId): fieldId is string => typeof fieldId === 'string')
    : []

  if (requestedFields.length === 0) {
    return { fields: {}, histories: [] }
  }

  const currentFieldIds = requestedFields.filter(fieldId => !fieldId.endsWith('__history'))
  const historyFieldIds = requestedFields
    .filter(fieldId => fieldId.endsWith('__history'))
    .map(fieldId => fieldId.replace(/__history$/, ''))

  if (deviceId) {
    const result: RequestedFieldResult = { fields: {}, histories: [] }

    if (currentFieldIds.length > 0) {
      const [telemetryResult, attributeResult] = await Promise.allSettled([
        telemetryDataCurrent(deviceId),
        getAttributeDataSet({ device_id: deviceId })
      ])

      const telemetryRes = telemetryResult.status === 'fulfilled' ? telemetryResult.value : null
      const attributeRes = attributeResult.status === 'fulfilled' ? attributeResult.value : null

      const kvMap: Record<string, unknown> = {}
      const collect = (item: any) => {
        if (item?.key !== undefined) kvMap[item.key] = item.value
        if (item?.label) kvMap[item.label] = item.value
      }

      if (Array.isArray(telemetryRes?.data)) telemetryRes.data.forEach(collect)
      if (Array.isArray(attributeRes?.data)) attributeRes.data.forEach(collect)

      currentFieldIds.forEach(fieldId => {
        if (kvMap[fieldId] !== undefined) result.fields[fieldId] = kvMap[fieldId]
      })
    }

    if (historyFieldIds.length > 0) {
      const historyResults = await Promise.allSettled(
        historyFieldIds.map(async fieldId => {
          const historyRes = await telemetryDataHistoryList({
            device_id: deviceId,
            key: fieldId,
            time_range: 'custom',
            start_time: Date.now() - 3600 * 1000,
            end_time: Date.now(),
            aggregate_window: '1m',
            aggregate_function: 'avg'
          })
          const list = Array.isArray(historyRes?.data?.list) ? historyRes.data.list : []
          const history = normalizeHistory(list, 'value')
          if (history.length > 0) {
            result.histories.push({ fieldId, history, deviceId })
          }
        })
      )

      historyResults.forEach(item => {
        if (item.status === 'rejected') {
          console.warn('[AppFrame] Device history fetch failed:', item.reason)
        }
      })
    }

    return result
  }

  const result: RequestedFieldResult = { fields: {}, histories: [] }
  const requestedCurrentFieldSet = new Set(currentFieldIds)
  const requestedHistoryFieldSet = new Set(historyFieldIds)

  const requiresDeviceSummary = ['device_total', 'device_online', 'device_offline', 'device_activity'].some(fieldId =>
    requestedCurrentFieldSet.has(fieldId)
  )
  const requiresAlarmSummary = requestedCurrentFieldSet.has('alarm_device_total')
  const requiresTenantSummary =
    globalPlatformFieldScope === 'super-admin' &&
    ['tenant_added_yesterday', 'tenant_added_month', 'tenant_total'].some(fieldId =>
      requestedCurrentFieldSet.has(fieldId)
    )
  const requiresTenantHistory =
    globalPlatformFieldScope === 'super-admin' && requestedHistoryFieldSet.has('tenant_growth')
  const requiresMetricSummary =
    globalPlatformFieldScope === 'super-admin' &&
    ['cpu_usage', 'memory_usage', 'disk_usage'].some(fieldId => requestedCurrentFieldSet.has(fieldId))
  const requiresMetricHistory =
    globalPlatformFieldScope === 'super-admin' &&
    ['cpu_usage', 'memory_usage', 'disk_usage'].some(fieldId => requestedHistoryFieldSet.has(fieldId))
  const requiresDeviceTrend =
    requestedHistoryFieldSet.has('device_online') || requestedHistoryFieldSet.has('device_offline')

  const [
    deviceListResult,
    alarmCountResult,
    tenantResult,
    systemMetricsCurrentResult,
    systemMetricsHistoryResult,
    deviceTrendResult
  ] = await Promise.allSettled([
    requiresDeviceSummary ? deviceList({ page: 1, page_size: 1000 }) : Promise.resolve(null),
    requiresAlarmSummary ? getAlarmCount() : Promise.resolve(null),
    requiresTenantSummary || requiresTenantHistory ? tenant() : Promise.resolve(null),
    requiresMetricSummary ? getSystemMetricsCurrent() : Promise.resolve(null),
    requiresMetricHistory ? getSystemMetricsHistory({}) : Promise.resolve(null),
    requiresDeviceTrend ? getOnlineDeviceTrend() : Promise.resolve(null)
  ])

  const devices =
    deviceListResult.status === 'fulfilled'
      ? deviceListResult.value?.data?.list || deviceListResult.value?.data || []
      : []
  const deviceTotal = Array.isArray(devices) ? devices.length : 0
  const deviceOnline = Array.isArray(devices)
    ? devices.filter((device: any) => Number(device?.is_online || 0) !== 0).length
    : 0
  const aggregateValues: Record<string, unknown> = {
    device_total: deviceTotal,
    device_online: deviceOnline,
    device_offline: Math.max(0, deviceTotal - deviceOnline),
    device_activity: deviceOnline
  }

  if (alarmCountResult.status === 'fulfilled') {
    aggregateValues.alarm_device_total = normalizeMetricValue(
      alarmCountResult.value?.data?.alarm_device_total
    )
  }

  if (tenantResult.status === 'fulfilled') {
    aggregateValues.tenant_total = normalizeMetricValue(tenantResult.value?.data?.user_total)
    aggregateValues.tenant_added_yesterday = normalizeMetricValue(
      tenantResult.value?.data?.user_added_yesterday
    )
    aggregateValues.tenant_added_month = normalizeMetricValue(
      tenantResult.value?.data?.user_added_month
    )
  }

  if (systemMetricsCurrentResult.status === 'fulfilled') {
    aggregateValues.cpu_usage = normalizeMetricValue(systemMetricsCurrentResult.value?.data?.cpu_usage)
    aggregateValues.memory_usage = normalizeMetricValue(
      systemMetricsCurrentResult.value?.data?.memory_usage
    )
    aggregateValues.disk_usage = normalizeMetricValue(systemMetricsCurrentResult.value?.data?.disk_usage)
  }

  currentFieldIds.forEach((fieldId) => {
    if (aggregateValues[fieldId] !== undefined) result.fields[fieldId] = aggregateValues[fieldId]
  })

  if (requiresDeviceTrend) {
    const points =
      deviceTrendResult.status === 'fulfilled' && Array.isArray(deviceTrendResult.value?.data?.points)
        ? deviceTrendResult.value.data.points
        : []

    if (historyFieldIds.includes('device_online')) {
      const history = normalizeHistory(points, 'device_online')
      if (history.length > 0) result.histories.push({ fieldId: 'device_online', history })
    }

    if (historyFieldIds.includes('device_offline')) {
      const history = normalizeHistory(points, 'device_offline')
      if (history.length > 0) result.histories.push({ fieldId: 'device_offline', history })
    }
  }

  if (requiresTenantHistory && tenantResult.status === 'fulfilled') {
    const growthHistory = normalizeTenantGrowthHistory(tenantResult.value?.data?.user_list_month || [])
    if (growthHistory.length > 0) {
      result.histories.push({ fieldId: 'tenant_growth', history: growthHistory })
    }
  }

  if (requiresMetricHistory && systemMetricsHistoryResult.status === 'fulfilled') {
    const records = Array.isArray(systemMetricsHistoryResult.value?.data)
      ? systemMetricsHistoryResult.value.data
      : []

    const metricFieldMap: Array<{ fieldId: 'cpu_usage' | 'memory_usage' | 'disk_usage'; source: 'cpu' | 'memory' | 'disk' }> = [
      { fieldId: 'cpu_usage', source: 'cpu' },
      { fieldId: 'memory_usage', source: 'memory' },
      { fieldId: 'disk_usage', source: 'disk' }
    ]

    metricFieldMap.forEach(({ fieldId, source }) => {
      if (!historyFieldIds.includes(fieldId)) return
      const history = normalizeSystemMetricHistory(records, source)
      if (history.length > 0) {
        result.histories.push({ fieldId, history })
      }
    })
  }

  return result
}

async function buildPlatformDevices(): Promise<{
  devices: PlatformDeviceEntry[]
  debug: Record<string, unknown>
}> {
  if (platformDevicesCache) {
    return { devices: platformDevicesCache, debug: { cached: true, assembledCount: platformDevicesCache.length } }
  }

  if (platformDevicesCachePromise) {
    const devices = await platformDevicesCachePromise
    return { devices, debug: { cached: true, assembledCount: devices.length } }
  }

  platformDevicesCachePromise = (async () => {
    try {
      const [devRes, confRes] = await Promise.all([
        deviceList({ page: 1, page_size: 1000 }),
        getDeviceConfigList({ page: 1, page_size: 1000 })
      ])

      const devices = unwrapList(devRes?.data)
      const configs = unwrapList(confRes?.data)

      // Build config → template map (only configs that actually have a template)
      const configTemplateMap = new Map<string, string>()
      for (const config of configs) {
        if (config.id && config.device_template_id) {
          configTemplateMap.set(String(config.id), String(config.device_template_id))
        }
      }
      // Collect template IDs from configs directly (more reliable than going through
      // devices, which may not have device_config_id populated in every list response)
      const templateIdSet = new Set<string>()
      for (const config of configs) {
        if (config.device_template_id) templateIdSet.add(String(config.device_template_id))
      }
      // Also pick up any template IDs embedded directly on device objects (some API versions
      // return the full device_config object inside the list item)
      for (const device of devices) {
        const tid = device?.device_config?.device_template_id
        if (tid) templateIdSet.add(String(tid))
      }

      const templateIds = Array.from(templateIdSet)

      if (templateIds.length === 0) {
        platformDevicesCache = []
        return []
      }

      const platformDevices = devices
        .map((device: any): PlatformDeviceEntry | null => {
          // Prefer embedded device_config (device-detail style response), otherwise look up via configTemplateMap
          const templateId =
            (device?.device_config?.device_template_id ? String(device.device_config.device_template_id) : null) ||
            (device?.device_config_id ? configTemplateMap.get(String(device.device_config_id)) : null)

          if (!templateId || !device?.id) return null

          const groupName = String(device?.device_config?.name || device?.device_config_name || '').trim() || '设备字段'

          return {
            deviceId: String(device.id),
            deviceName: String(device.name || device.device_number || device.id),
            groupName,
            templateId,
            fields: [],
            presets: []
          }
        })
        .filter((item): item is PlatformDeviceEntry => Boolean(item))

      platformDevicesCache = platformDevices
      return platformDevices
    } catch (err) {
      console.error('[AppFrame] Failed to assemble platformDevices', err)
      platformDevicesCache = []
      return []
    } finally {
      platformDevicesCachePromise = null
    }
  })()

  const devices = await platformDevicesCachePromise
  return { devices, debug: { assembledCount: devices.length } }
}

/** Full init sequence triggered once per tv:ready (debounced). */
async function doInit() {
  if (!iframeRef.value?.contentWindow || !token.value) return

  const apiBaseUrl = window.location.origin + '/thingsvis-api'

  const { devices: platformDevices } = await buildPlatformDevices()

  activePlatformDevices.clear()
  for (const device of platformDevices) {
    if (device?.deviceId) {
      activePlatformDevices.set(device.deviceId, {
        deviceId: device.deviceId,
        fields: Array.isArray(device.fields) ? device.fields : []
      })
    }
  }

  iframeRef.value.contentWindow.postMessage(
    {
      type: 'tv:init',
      platformFields: globalPlatformFields,
      platformFieldScope: globalPlatformFieldScope,
      platformDevices,
      data: { meta: { id: props.id } },
      config: {
        mode: 'app',
        saveTarget: 'self',
        token: token.value,
        apiBaseUrl
      }
    },
    '*'
  )

  // Do not eagerly connect/prefetch every device in editor mode.
  // A large device fleet can make the editor unstable and generate many failing
  // requests for devices that are never actually selected or bound.
  disconnectAllDeviceWs()
}

const handleMessage = async (event: MessageEvent) => {
  if (!event.data || typeof event.data !== 'object') return

  const { type, projectId } = event.data

  if (type === 'thingsvis:requestFieldData') {
    const payload = event.data?.payload || {}
    if (!iframeRef.value?.contentWindow) return

    try {
      ensureDeviceWs(payload.deviceId)
      const result = await buildRequestedFieldData(payload.fieldIds, payload.deviceId)
      if (Object.keys(result.fields).length > 0) {
        iframeRef.value.contentWindow.postMessage(
          {
            type: 'tv:platform-data',
            payload: {
              deviceId: payload.deviceId,
              fields: result.fields
            }
          },
          '*'
        )
        if (payload.deviceId) {
          iframeRef.value.contentWindow.postMessage(
            {
              type: 'tv:platform-data',
              payload: {
                fields: result.fields
              }
            },
            '*'
          )
        }
      }

      result.histories.forEach(item => {
        iframeRef.value?.contentWindow?.postMessage(
          {
            type: 'tv:platform-history',
            payload: {
              deviceId: item.deviceId,
              fieldId: item.fieldId,
              history: item.history
            }
          },
          '*'
        )
      })
    } catch {
      // Best effort only: ignore transient field-request failures to avoid console noise.
    }
    return
  }

  if (type === 'thingsvis:requestDeviceFields') {
    const payload = event.data?.payload || {}
    const deviceId = typeof payload.deviceId === 'string' ? payload.deviceId : undefined
    const templateId = typeof payload.templateId === 'string' ? payload.templateId : undefined
    if (!iframeRef.value?.contentWindow || !deviceId || !templateId) return

    try {
      const entry = await loadTemplateEntry(templateId)
      iframeRef.value.contentWindow.postMessage(
        {
          type: 'tv:device-fields',
          payload: {
            deviceId,
            templateId,
            fields: Array.isArray(entry.fields) ? entry.fields : []
          }
        },
        '*'
      )
    } catch (error) {
      console.warn('[AppFrame] Failed to load requested device fields:', deviceId, templateId, error)
    }
    return
  }

  if (type === 'tv:ready' || type === 'READY') {
    if (props.mode === 'viewer') {
      return
    }

    if (iframeRef.value?.contentWindow && token.value) {
      // Debounce: studio sends tv:ready both on initial load and after bootstrap.
      // Coalesce rapid signals into a single init run.
      if (pendingInitDebounceTimer) {
        clearTimeout(pendingInitDebounceTimer)
      }
      pendingInitDebounceTimer = setTimeout(async () => {
        pendingInitDebounceTimer = null
        if (initInProgress) return
        initInProgress = true
        try {
          await doInit()
        } finally {
          initInProgress = false
        }
      }, 300)
    }
  }

  if (type === 'tv:preview') {
    const target = router.resolve({
      path: '/visualization/thingsvis-preview',
      query: { id: projectId || props.id }
    })
    window.open(target.href, '_blank')
  }

  if (type === 'tv:publish') {
    try {
      const { publishThingsVisDashboard } = await import('@/service/api/thingsvis')
      const res = await publishThingsVisDashboard(projectId || props.id)

      if (res.data) {
        if ((window as any).$message) {
          ;(window as any).$message.success('发布成功')
        } else {
          alert('发布成功')
        }
      } else {
        console.error('[AppFrame] Publish failed:', res.error)
        if ((window as any).$message) {
          ;(window as any).$message.error(`发布失败: ${res.error?.message || '未知错误'}`)
        }
      }
    } catch (e) {
      console.error('[AppFrame] Publish exception:', e)
    }
  }
}

onMounted(async () => {
  window.addEventListener('message', handleMessage)

  try {
    const tokenStr = await getThingsVisToken()
    if (tokenStr) {
      token.value = tokenStr
      url.value = buildThingsVisFrameUrl(tokenStr)
    } else {
      console.warn('[AppFrame] Token acquisition returned null')
    }
  } catch (error) {
    console.error('[AppFrame] Failed to acquire ThingsVis token:', error)
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('message', handleMessage)
  if (pendingInitDebounceTimer) clearTimeout(pendingInitDebounceTimer)
  activePlatformDevices.clear()
  platformDevicesCache = null
  platformDevicesCachePromise = null
  templateEntryCache.clear()
  disconnectAllDeviceWs()
})
</script>

<style scoped>
.thingsvis-frame-container {
  width: 100%;
  height: 100%;
  position: relative;
}

.thingsvis-frame {
  width: 100%;
  height: 100%;
  display: block;
}

.loading-placeholder {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  color: #888;
}
</style>
