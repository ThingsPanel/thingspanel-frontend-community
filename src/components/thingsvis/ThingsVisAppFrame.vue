<template>
  <div class="thingsvis-frame-container">
    <iframe
      v-if="url && token"
      ref="iframeRef"
      :src="url"
      class="thingsvis-frame"
      frameborder="0"
      allowfullscreen
      @load="handleIframeLoad"
    ></iframe>
    <div v-else class="loading-placeholder">正在连接可视化引擎...</div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { clearThingsVisToken, getThingsVisToken } from '@/utils/thingsvis'
import {
  deviceList,
  getDeviceConfigList,
  telemetryDataCurrent,
  getAttributeDataSet,
  telemetryDataHistoryList,
  telemetryDataPub
} from '@/service/api/device'
import {
  attributesApi,
  getAlarmCount,
  getLatestTelemetryData,
  getOnlineDeviceTrend,
  getSystemMetricsCurrent,
  getSystemMetricsHistory,
  telemetryApi,
  tenant
} from '@/service/api'
import { alarmHistory } from '@/service/api/alarm'
import { getThingsVisDashboard, updateThingsVisDashboard, type UpdateDashboardData } from '@/service/api/thingsvis'
import { extractPlatformFields } from '@/utils/thingsvis/platform-fields'
import { getGlobalPlatformFields, resolveGlobalPlatformFieldScope } from '@/utils/thingsvis/global-platform-fields'
import { localStg } from '@/utils/storage'
import { getWebsocketServerUrl } from '@/utils/common/tool'

const EDITOR_TEMPLATE_FIELD_PAGE_SIZE = 1000
const DEFAULT_PLATFORM_BUFFER_SIZE = 100

const props = defineProps<{
  id: string
  mode?: string
  schema?: {
    id?: string
    name?: string
    thumbnail?: string | null
    canvasConfig?: Record<string, unknown>
    nodes?: unknown[]
    dataSources?: unknown[]
  } | null
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
const SILENT_REQUEST_CONFIG = { silentError: true } as const

function isIgnorablePlatformRequestError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const err = error as {
    message?: unknown
    response?: { status?: unknown; data?: { message?: unknown } }
  }
  const message = String(err.response?.data?.message || err.message || '').toLowerCase()
  const status = Number(err.response?.status ?? NaN)
  return status === 404 || message.includes('record not found')
}

function resolvePlatformBufferSize(dataSources: unknown): number {
  if (!Array.isArray(dataSources)) return 0
  return Math.max(
    0,
    ...dataSources.map((dataSource: any) => {
      const normalizedType = typeof dataSource?.type === 'string' ? dataSource.type.toUpperCase() : ''
      if (normalizedType !== 'PLATFORM_FIELD' && normalizedType !== 'PLATFORM') return 0
      const bufferSize = dataSource?.config?.bufferSize
      return typeof bufferSize === 'number' && Number.isFinite(bufferSize) ? Math.max(0, Math.trunc(bufferSize)) : 0
    })
  )
}

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
        postPlatformData(fields, deviceId)
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
let initSucceeded = false
let pendingInitDebounceTimer: ReturnType<typeof setTimeout> | null = null

type HistoryPoint = { value: unknown; ts: number }
type RequestedFieldResult = {
  fields: Record<string, unknown>
  histories: Array<{ fieldId: string; history: HistoryPoint[]; deviceId?: string }>
}
type PlatformSourceDescriptor = {
  id: string
  deviceId?: string
  requestedFields: string[]
}

const token = ref('')
const url = ref('')
const iframeRef = ref<HTMLIFrameElement>()
let viewerHydrationTimers: Array<ReturnType<typeof setTimeout>> = []
let viewerHydrationInFlight = false
let viewerHydrationCompleted = false
let initRetryTimers: Array<ReturnType<typeof setTimeout>> = []

let viewerDashboardConfigCache: Record<string, unknown> | null = null
let viewerDashboardConfigPromise: Promise<Record<string, unknown> | null> | null = null
let viewerDashboardConfigCacheId: string | null = null

function getCurrentUserInfo() {
  return localStg.get('userInfo') as Api.Auth.UserInfo | null
}

function getCurrentPlatformFieldScope() {
  return resolveGlobalPlatformFieldScope(getCurrentUserInfo())
}

function getCurrentGlobalPlatformFields() {
  return getGlobalPlatformFields(getCurrentPlatformFieldScope())
}

function normalizeCanvasBackground(background: unknown): Record<string, unknown> {
  if (background && typeof background === 'object' && !Array.isArray(background)) {
    return background as Record<string, unknown>
  }

  const color =
    typeof background === 'string' && background.trim().length > 0
      ? background
      : 'transparent'

  return { color }
}

function clearViewerHydrationTimers() {
  viewerHydrationTimers.forEach(timer => clearTimeout(timer))
  viewerHydrationTimers = []
}

function clearInitRetryTimers() {
  initRetryTimers.forEach(timer => clearTimeout(timer))
  initRetryTimers = []
}

function getThingsVisTargetOrigin(): string {
  try {
    return new URL(getStudioBase()).origin
  } catch {
    return window.location.origin
  }
}

function postToThingsVis(type: string, payload: Record<string, unknown>) {
  const win = iframeRef.value?.contentWindow
  if (!win) return
  win.postMessage({ type, payload }, getThingsVisTargetOrigin())
}

function postPlatformData(fields: Record<string, unknown>, deviceId?: string) {
  if (Object.keys(fields).length === 0) return

  postToThingsVis('tv:platform-data', {
    deviceId,
    fields
  })

  if (deviceId) {
    postToThingsVis('tv:platform-data', { fields })
  }
}

function postPlatformHistory(fieldId: string, history: HistoryPoint[], deviceId?: string) {
  if (history.length === 0) return

  postToThingsVis('tv:platform-history', {
    deviceId,
    fieldId,
    history
  })
}

const FIELD_BINDING_EXPR_RE = /\{\{\s*ds\.([^.\s}]+)\.(?:data\.)?([^}]+?)\s*\}\}/g

function getRequestedFieldRoot(fieldPath?: string): string | null {
  if (!fieldPath) return null
  const [root] = fieldPath.split(/[.[\]]/).filter(Boolean)
  return root?.trim() ? root.trim() : null
}

function collectRequestedFieldsFromValue(value: unknown, requests: Map<string, Set<string>>) {
  if (typeof value === 'string') {
    let match: RegExpExecArray | null = null
    FIELD_BINDING_EXPR_RE.lastIndex = 0
    while ((match = FIELD_BINDING_EXPR_RE.exec(value)) !== null) {
      const dataSourceId = match[1]
      const fieldPath = match[2]?.trim()
      if (!dataSourceId || !fieldPath) continue
      const fieldId = getRequestedFieldRoot(fieldPath)
      if (!fieldId) continue
      const fields = requests.get(dataSourceId) ?? new Set<string>()
      fields.add(fieldId)
      requests.set(dataSourceId, fields)
    }
    return
  }

  if (Array.isArray(value)) {
    value.forEach(item => collectRequestedFieldsFromValue(item, requests))
    return
  }

  if (!value || typeof value !== 'object') return

  Object.values(value as Record<string, unknown>).forEach(item => {
    collectRequestedFieldsFromValue(item, requests)
  })
}

function collectPlatformSourceDescriptors(config: any): PlatformSourceDescriptor[] {
  const requests = new Map<string, Set<string>>()
  collectRequestedFieldsFromValue(config?.nodes, requests)

  const dataSources = Array.isArray(config?.dataSources) ? config.dataSources : []

  return dataSources
    .filter((dataSource: any) => {
      const typeStr = typeof dataSource?.type === 'string' ? dataSource.type.toUpperCase() : ''
      return typeStr === 'PLATFORM_FIELD' || typeStr === 'PLATFORM'
    })
    .map((dataSource: any) => {
      const requestedFields = new Set<string>(
        Array.isArray(dataSource?.config?.requestedFields)
          ? dataSource.config.requestedFields.filter(
              (fieldId: unknown): fieldId is string => typeof fieldId === 'string'
            )
          : []
      )
      const bindingFields = requests.get(String(dataSource.id))
      if (bindingFields) {
        bindingFields.forEach(fieldId => requestedFields.add(fieldId))
      }

      return {
        id: String(dataSource.id),
        deviceId: typeof dataSource?.config?.deviceId === 'string' ? dataSource.config.deviceId : undefined,
        requestedFields: Array.from(requestedFields)
      }
    })
}

async function loadViewerDashboardConfig(): Promise<Record<string, unknown> | null> {
  if (props.mode !== 'viewer') return null
  if (props.schema) {
    return {
      id: props.schema.id || props.id,
      name: props.schema.name,
      canvas: props.schema.canvasConfig,
      nodes: Array.isArray(props.schema.nodes) ? props.schema.nodes : [],
      dataSources: Array.isArray(props.schema.dataSources) ? props.schema.dataSources : []
    }
  }
  if (viewerDashboardConfigCache && viewerDashboardConfigCacheId === props.id) return viewerDashboardConfigCache
  if (viewerDashboardConfigPromise) return viewerDashboardConfigPromise

  viewerDashboardConfigPromise = (async () => {
    try {
      const { data, error } = await getThingsVisDashboard(props.id)
      if (error || !data) return null

      viewerDashboardConfigCacheId = props.id
      viewerDashboardConfigCache = {
        id: data.id,
        name: data.name,
        canvas: data.canvasConfig,
        nodes: Array.isArray(data.nodes) ? data.nodes : [],
        dataSources: Array.isArray(data.dataSources) ? data.dataSources : []
      }
      return viewerDashboardConfigCache
    } catch (error) {
      console.warn('[AppFrame] Failed to load viewer dashboard config for hydration:', props.id, error)
      return null
    } finally {
      viewerDashboardConfigPromise = null
    }
  })()

  return viewerDashboardConfigPromise
}

/** Strip any hash fragment and return the bare Studio HTML base URL. */
function getStudioBase(): string {
  const raw = (import.meta.env.VITE_THINGSVIS_STUDIO_URL as string) || 'http://localhost:3000/main'
  const hashIdx = raw.indexOf('#')
  return hashIdx !== -1 ? raw.substring(0, hashIdx) : raw
}

function buildThingsVisFrameUrl(thingsVisToken: string): string {
  const apiBaseUrl = encodeURIComponent(window.location.origin + '/thingsvis-api')
  const platformFieldScope = encodeURIComponent(getCurrentPlatformFieldScope())
  const platformFields = encodeURIComponent(JSON.stringify(getCurrentGlobalPlatformFields()))
  const saveTarget = 'host'
  const dashboardId = encodeURIComponent(props.id)

  if (props.mode === 'viewer') {
    return `${getStudioBase()}#/embed?mode=embedded&saveTarget=${saveTarget}&id=${dashboardId}&token=${thingsVisToken}&apiBaseUrl=${apiBaseUrl}&platformFieldScope=${platformFieldScope}&platformFields=${platformFields}`
  }

  return `${getStudioBase()}#/editor?mode=embedded&saveTarget=${saveTarget}&token=${thingsVisToken}&apiBaseUrl=${apiBaseUrl}&platformFieldScope=${platformFieldScope}&platformFields=${platformFields}`
}

function normalizeHistory(records: any[], valueKey: string): HistoryPoint[] {
  return records
    .map((item: any) => ({
      value: item?.[valueKey] ?? item?.value ?? item?.avg ?? item?.y ?? 0,
      ts: new Date(item?.timestamp || item?.time || item?.x || item?.ts || Date.now()).getTime()
    }))
    .filter(point => !Number.isNaN(point.ts))
}

function normalizeDerivedHistory(records: any[], resolver: (item: any) => unknown): HistoryPoint[] {
  return records
    .map((item: any) => ({
      value: normalizeMetricValue(resolver(item)),
      ts: new Date(item?.timestamp || item?.time || item?.x || item?.ts || Date.now()).getTime()
    }))
    .filter(point => !Number.isNaN(point.ts))
}

function buildFlatHistory(value: unknown, timestamps: number[]): HistoryPoint[] {
  const normalizedValue = normalizeMetricValue(value)
  const uniqueTimestamps = Array.from(new Set(timestamps.filter(ts => Number.isFinite(ts))))
  if (uniqueTimestamps.length > 0) {
    return uniqueTimestamps.map(ts => ({ value: normalizedValue, ts }))
  }

  const now = Date.now()
  return [
    { value: normalizedValue, ts: now - 60 * 60 * 1000 },
    { value: normalizedValue, ts: now }
  ]
}

function normalizeMetricValue(value: unknown): number {
  const num = Number(value)
  return Number.isFinite(num) ? num : 0
}

function normalizeTenantGrowthHistory(records: any[]): HistoryPoint[] {
  const currentYear = new Date().getFullYear()

  const points: HistoryPoint[] = []

  records.forEach((item: any) => {
    const month = Number(item?.mon)
    if (!Number.isFinite(month) || month < 1 || month > 12) return

    const ts = new Date(currentYear, month - 1, 1).getTime()
    if (Number.isNaN(ts)) return

    points.push({
      value: normalizeMetricValue(item?.num),
      ts
    })
  })
  return points
}
function normalizeSystemMetricHistory(records: any[], metricKey: 'cpu' | 'memory' | 'disk'): HistoryPoint[] {
  return records
    .map((item: any) => ({
      value: normalizeMetricValue(item?.[`${metricKey}_usage`] ?? item?.[metricKey]),
      ts: new Date(item?.timestamp || item?.time || item?.x || item?.ts || Date.now()).getTime()
    }))
    .filter(point => !Number.isNaN(point.ts))
}

function normalizeHomeAlarmItems(payload: any): Array<Record<string, unknown>> {
  const list = Array.isArray(payload?.list) ? payload.list : Array.isArray(payload?.data?.list) ? payload.data.list : []

  return list.slice(0, 10).map((item: any) => ({
    level:
      item?.alarm_status === 'H'
        ? 'critical'
        : item?.alarm_status === 'M'
          ? 'warning'
          : item?.alarm_status === 'L'
            ? 'info'
            : 'success',
    title: item?.name ?? '-',
    detail: item?.content ?? '-',
    source: item?.device_name ?? item?.group_name ?? '',
    time: item?.create_at ?? item?.created_at ?? item?.time ?? ''
  }))
}

function normalizeLatestReportRows(payload: any): Array<Record<string, unknown>> {
  const devices = Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : []
  const rows: Array<Record<string, unknown>> = []

  devices.slice(0, 6).forEach((device: any) => {
    const telemetry = Array.isArray(device?.telemetry_data) ? device.telemetry_data : []
    telemetry.slice(0, 3).forEach((item: any) => {
      const rawValue = item?.value
      const valueText =
        rawValue === null || rawValue === undefined
          ? '-'
          : item?.unit
            ? `${rawValue}${item.unit}`
            : String(rawValue)

      rows.push({
        device: device?.device_name ?? '-',
        metric: item?.label || item?.key || '-',
        value: valueText,
        time: device?.last_push_time ?? device?.update_time ?? ''
      })
    })
  })

  return rows
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
        telemetryDataCurrent(deviceId, SILENT_REQUEST_CONFIG),
        getAttributeDataSet({ device_id: deviceId }, SILENT_REQUEST_CONFIG)
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
          const historyRes = await telemetryDataHistoryList(
            {
              device_id: deviceId,
              key: fieldId,
              time_range: 'custom',
              start_time: Date.now() - 3600 * 1000,
              end_time: Date.now(),
              aggregate_window: '1m',
              aggregate_function: 'avg'
            },
            SILENT_REQUEST_CONFIG
          )
          const list = Array.isArray(historyRes?.data?.list) ? historyRes.data.list : []
          const history = normalizeHistory(list, 'value')
          if (history.length > 0) {
            result.histories.push({ fieldId, history, deviceId })
          }
        })
      )

      historyResults.forEach(item => {
        if (item.status === 'rejected' && !isIgnorablePlatformRequestError(item.reason)) {
          console.warn('[AppFrame] Device history fetch failed:', item.reason)
        }
      })
    }

    return result
  }

  const result: RequestedFieldResult = { fields: {}, histories: [] }
  const requestedCurrentFieldSet = new Set(currentFieldIds)
  const requestedHistoryFieldSet = new Set(historyFieldIds)

  const requiresDeviceSummary = ['device_total', 'device_online', 'device_offline', 'device_activity'].some(
    fieldId => requestedCurrentFieldSet.has(fieldId) || requestedHistoryFieldSet.has(fieldId)
  )
  const requiresAlarmSummary =
    requestedCurrentFieldSet.has('alarm_device_total') || requestedHistoryFieldSet.has('alarm_device_total')
  const requiresTenantSummary =
    getCurrentPlatformFieldScope() === 'super-admin' &&
    ['tenant_added_yesterday', 'tenant_added_month', 'tenant_total'].some(fieldId =>
      requestedCurrentFieldSet.has(fieldId)
    )
  const requiresTenantHistory =
    getCurrentPlatformFieldScope() === 'super-admin' && requestedHistoryFieldSet.has('tenant_growth')
  const requiresMetricSummary =
    getCurrentPlatformFieldScope() === 'super-admin' &&
    ['cpu_usage', 'memory_usage', 'disk_usage'].some(fieldId => requestedCurrentFieldSet.has(fieldId))
  const requiresMetricHistory =
    getCurrentPlatformFieldScope() === 'super-admin' &&
    ['cpu_usage', 'memory_usage', 'disk_usage'].some(fieldId => requestedHistoryFieldSet.has(fieldId))
  const requiresDeviceTrend = ['device_total', 'device_online', 'device_offline', 'device_activity'].some(
    fieldId => requestedHistoryFieldSet.has(fieldId)
  )
  const requiresHomeAlarmItems = requestedCurrentFieldSet.has('home_alarm_items')
  const requiresLatestReportRows = requestedCurrentFieldSet.has('home_latest_report_rows')

  const [
    deviceListResult,
    alarmCountResult,
    alarmHistoryResult,
    latestReportResult,
    tenantResult,
    systemMetricsCurrentResult,
    systemMetricsHistoryResult,
    deviceTrendResult
  ] = await Promise.allSettled([
    requiresDeviceSummary ? deviceList({ page: 1, page_size: 1000 }) : Promise.resolve(null),
    requiresAlarmSummary ? getAlarmCount() : Promise.resolve(null),
    requiresHomeAlarmItems
      ? alarmHistory({
          page: 1,
          page_size: 10,
          alarm_status: '',
          start_time: '',
          end_time: ''
        })
      : Promise.resolve(null),
    requiresLatestReportRows ? getLatestTelemetryData() : Promise.resolve(null),
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
    aggregateValues.alarm_device_total = normalizeMetricValue(alarmCountResult.value?.data?.alarm_device_total)
  }

  if (requiresHomeAlarmItems && alarmHistoryResult.status === 'fulfilled') {
    aggregateValues.home_alarm_items = normalizeHomeAlarmItems(alarmHistoryResult.value?.data)
  }

  if (requiresLatestReportRows && latestReportResult.status === 'fulfilled') {
    aggregateValues.home_latest_report_rows = normalizeLatestReportRows(latestReportResult.value?.data)
  }

  if (tenantResult.status === 'fulfilled') {
    aggregateValues.tenant_total = normalizeMetricValue(tenantResult.value?.data?.user_total)
    aggregateValues.tenant_added_yesterday = normalizeMetricValue(tenantResult.value?.data?.user_added_yesterday)
    aggregateValues.tenant_added_month = normalizeMetricValue(tenantResult.value?.data?.user_added_month)
  }

  if (systemMetricsCurrentResult.status === 'fulfilled') {
    aggregateValues.cpu_usage = normalizeMetricValue(systemMetricsCurrentResult.value?.data?.cpu_usage)
    aggregateValues.memory_usage = normalizeMetricValue(systemMetricsCurrentResult.value?.data?.memory_usage)
    aggregateValues.disk_usage = normalizeMetricValue(systemMetricsCurrentResult.value?.data?.disk_usage)
  }

  currentFieldIds.forEach(fieldId => {
    if (aggregateValues[fieldId] !== undefined) result.fields[fieldId] = aggregateValues[fieldId]
  })

  if (requiresDeviceTrend) {
    const points =
      deviceTrendResult.status === 'fulfilled' && Array.isArray(deviceTrendResult.value?.data?.points)
        ? deviceTrendResult.value.data.points
        : []
    const trendTimestamps = points
      .map((item: any) => new Date(item?.timestamp || item?.time || item?.x || item?.ts || Date.now()).getTime())
      .filter((ts: number) => !Number.isNaN(ts))

    if (historyFieldIds.includes('device_online')) {
      const history = normalizeHistory(points, 'device_online')
      if (history.length > 0) result.histories.push({ fieldId: 'device_online', history })
    }

    if (historyFieldIds.includes('device_offline')) {
      const history = normalizeHistory(points, 'device_offline')
      if (history.length > 0) result.histories.push({ fieldId: 'device_offline', history })
    }

    if (historyFieldIds.includes('device_total')) {
      const history = normalizeDerivedHistory(
        points,
        (item: any) => normalizeMetricValue(item?.device_online) + normalizeMetricValue(item?.device_offline)
      )
      if (history.length > 0) result.histories.push({ fieldId: 'device_total', history })
    }

    if (historyFieldIds.includes('device_activity')) {
      const history = normalizeDerivedHistory(points, (item: any) => item?.device_online)
      if (history.length > 0) result.histories.push({ fieldId: 'device_activity', history })
    }

    if (historyFieldIds.includes('alarm_device_total')) {
      const history = buildFlatHistory(aggregateValues.alarm_device_total, trendTimestamps)
      if (history.length > 0) result.histories.push({ fieldId: 'alarm_device_total', history })
    }
  }

  if (
    !requiresDeviceTrend &&
    historyFieldIds.includes('alarm_device_total') &&
    aggregateValues.alarm_device_total !== undefined
  ) {
    const history = buildFlatHistory(aggregateValues.alarm_device_total, [])
    if (history.length > 0) result.histories.push({ fieldId: 'alarm_device_total', history })
  }

  if (requiresTenantHistory && tenantResult.status === 'fulfilled') {
    const growthHistory = normalizeTenantGrowthHistory(tenantResult.value?.data?.user_list_month || [])
    if (growthHistory.length > 0) {
      result.histories.push({ fieldId: 'tenant_growth', history: growthHistory })
    }
  }

  if (requiresMetricHistory && systemMetricsHistoryResult.status === 'fulfilled') {
    const records = Array.isArray(systemMetricsHistoryResult.value?.data) ? systemMetricsHistoryResult.value.data : []

    const metricFieldMap: Array<{
      fieldId: 'cpu_usage' | 'memory_usage' | 'disk_usage'
      source: 'cpu' | 'memory' | 'disk'
    }> = [
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

async function hydrateConfiguredPlatformSources() {
  const config = await loadViewerDashboardConfig()
  if (!config) return

  const descriptors = collectPlatformSourceDescriptors(config)
  if (descriptors.length === 0) return

  const handledDeviceIds = new Set<string>()
  let globalHydrated = false

  for (const descriptor of descriptors) {
    const requestedFields = descriptor.requestedFields

    if (descriptor.deviceId) {
      if (requestedFields.length === 0) continue
      if (handledDeviceIds.has(descriptor.deviceId)) continue
      handledDeviceIds.add(descriptor.deviceId)

      ensureDeviceWs(descriptor.deviceId)

      const result = await buildRequestedFieldData(requestedFields, descriptor.deviceId)
      postPlatformData(result.fields, descriptor.deviceId)
      result.histories.forEach(item => {
        postPlatformHistory(item.fieldId, item.history, item.deviceId)
      })
      continue
    }

    if (globalHydrated) continue
    globalHydrated = true

    const fallbackGlobalFields =
      requestedFields.length > 0
        ? requestedFields
        : getCurrentGlobalPlatformFields()
            .map(field => field.id)
            .filter((fieldId): fieldId is string => typeof fieldId === 'string' && fieldId.length > 0)
    const result = await buildRequestedFieldData(fallbackGlobalFields)
    postPlatformData(result.fields)
    result.histories.forEach(item => {
      postPlatformHistory(item.fieldId, item.history)
    })
  }
}

function scheduleViewerHydration() {
  if (props.mode !== 'viewer') return

  clearViewerHydrationTimers()
  if (viewerHydrationCompleted || viewerHydrationInFlight) return

  const timer = setTimeout(async () => {
    if (viewerHydrationCompleted || viewerHydrationInFlight) return
    viewerHydrationInFlight = true
    try {
      await hydrateConfiguredPlatformSources()
      viewerHydrationCompleted = true
    } finally {
      viewerHydrationInFlight = false
    }
  }, 0)
  viewerHydrationTimers.push(timer)
}

function resolveWriteDeviceId(payload: Record<string, unknown>): string | undefined {
  if (typeof payload.deviceId === 'string' && payload.deviceId) {
    return payload.deviceId
  }

  const dataSourceId = typeof payload.dataSourceId === 'string' ? payload.dataSourceId : ''
  const match = dataSourceId.match(/^__platform_(.+)__$/)
  if (match?.[1]) {
    return match[1]
  }

  return undefined
}

async function handlePlatformWrite(payload: Record<string, unknown>) {
  const deviceId = resolveWriteDeviceId(payload)
  const data = payload.data
  if (!deviceId || data === undefined) return

  try {
    const value = typeof data === 'string' ? data : JSON.stringify(data)
    await telemetryDataPub({ device_id: deviceId, value })
  } catch (error) {
    console.error('[AppFrame] Failed to publish platform write:', error)
  }
}

async function handleHostSave(payload: Record<string, unknown>) {
  const config = payload.config && typeof payload.config === 'object' ? payload.config : payload
  const meta = (config.meta as Record<string, unknown> | undefined) || {}
  const canvas = config.canvas
  const updatePayload: UpdateDashboardData = {}

  if (typeof meta.name === 'string') {
    updatePayload.name = meta.name
  }
  if (canvas && typeof canvas === 'object') {
    const normalizedCanvas = { ...(canvas as Record<string, unknown>) }
    normalizedCanvas.background = normalizeCanvasBackground(normalizedCanvas.background)
    updatePayload.canvasConfig = normalizedCanvas
  }
  if (Array.isArray(config.nodes)) {
    updatePayload.nodes = config.nodes
  }
  if (Array.isArray(config.dataSources)) {
    updatePayload.dataSources = config.dataSources
  }
  if (config.variables !== undefined) {
    updatePayload.variables = config.variables as unknown[]
  }

  const thumbnail =
    typeof meta.thumbnail === 'string'
      ? meta.thumbnail
      : typeof payload.thumbnail === 'string'
        ? payload.thumbnail
        : undefined

  if (thumbnail !== undefined) {
    updatePayload.thumbnail = thumbnail
  }

  let result = await updateThingsVisDashboard(props.id, updatePayload)

  if (result.error?.status === 401 || result.error?.status === 404) {
    clearThingsVisToken()
    result = await updateThingsVisDashboard(props.id, updatePayload)
  }

  if (result.error) {
    console.error('[AppFrame] Failed to save dashboard via host bridge:', result.error)
    if ((window as any).$message) {
      ;(window as any).$message.error('保存失败')
    }
    return
  }

  if ((window as any).$message) {
    ;(window as any).$message.success('保存成功')
  }
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

  let dashboardPayload: Record<string, unknown> = { meta: { id: props.id } }

  try {
    const dashboardData = props.schema
      ? {
          id: props.schema.id || props.id,
          name: props.schema.name,
          thumbnail: props.schema.thumbnail ?? null,
          canvasConfig: props.schema.canvasConfig,
          nodes: props.schema.nodes,
          dataSources: props.schema.dataSources
        }
      : null
    const fetched = dashboardData ? { data: dashboardData, error: null } : await getThingsVisDashboard(props.id)
    const { data, error } = fetched
    if (!error && data) {
      dashboardPayload = {
        meta: {
          id: data.id,
          name: data.name,
          thumbnail: data.thumbnail
        },
        canvas: data.canvasConfig,
        nodes: Array.isArray(data.nodes) ? data.nodes : [],
        dataSources: Array.isArray(data.dataSources) ? data.dataSources : []
      }
    }
  } catch (error) {
    console.warn('[AppFrame] Failed to preload dashboard schema for embed init:', props.id, error)
  }

  const viewerDeviceDescriptors =
    props.mode === 'viewer'
      ? collectPlatformSourceDescriptors(dashboardPayload).filter(
          descriptor => descriptor.deviceId && descriptor.requestedFields.length > 0
        )
      : []
  const requiredViewerDeviceIds = new Set(
    viewerDeviceDescriptors
      .map(descriptor => descriptor.deviceId)
      .filter((deviceId): deviceId is string => typeof deviceId === 'string' && deviceId.length > 0)
  )
  const shouldBuildPlatformDevices =
    props.mode !== 'viewer' || requiredViewerDeviceIds.size > 0
  const { devices: loadedPlatformDevices } = shouldBuildPlatformDevices
    ? await buildPlatformDevices()
    : { devices: [] }
  const platformDevices = loadedPlatformDevices
  const platformBufferSize = Math.max(
    DEFAULT_PLATFORM_BUFFER_SIZE,
    resolvePlatformBufferSize(dashboardPayload.dataSources)
  )

  if (props.mode === 'viewer') {
    viewerHydrationCompleted = false
    viewerHydrationInFlight = false
    clearViewerHydrationTimers()
    disconnectAllDeviceWs()
  }

  activePlatformDevices.clear()
  for (const device of platformDevices) {
    if (device?.deviceId) {
      activePlatformDevices.set(device.deviceId, {
        deviceId: device.deviceId,
        fields: Array.isArray(device.fields) ? device.fields : []
      })
    }
  }

  // JSON round-trip strips Vue reactive Proxy wrappers (from schema prop) so
  // postMessage's structured-clone algorithm can serialize the payload.
  const initMessage = JSON.parse(
    JSON.stringify({
      type: 'tv:init',
      payload: {
        platformFields: getCurrentGlobalPlatformFields(),
        platformBufferSize,
        platformFieldScope: getCurrentPlatformFieldScope(),
        platformDevices,
        data: dashboardPayload,
        config: {
          mode: 'app',
          saveTarget: 'host',
          token: token.value,
          apiBaseUrl
        }
      }
    })
  )
  iframeRef.value.contentWindow.postMessage(initMessage, getThingsVisTargetOrigin())

  // Mark init as succeeded and cancel remaining retry timers (FIX-H1)
  initSucceeded = true
  clearInitRetryTimers()
  if (pendingInitDebounceTimer) {
    clearTimeout(pendingInitDebounceTimer)
    pendingInitDebounceTimer = null
  }

  if (props.mode !== 'viewer') {
    disconnectAllDeviceWs()
  }
}

function scheduleInit() {
  if (!iframeRef.value?.contentWindow || !token.value) return

  // Reset success flag so retry timers can fire for this new schedule cycle
  initSucceeded = false

  if (pendingInitDebounceTimer) clearTimeout(pendingInitDebounceTimer)
  clearInitRetryTimers()

  const runInit = async () => {
    if (initInProgress || initSucceeded) return
    initInProgress = true
    try {
      await doInit()
    } finally {
      initInProgress = false
    }
  }

  pendingInitDebounceTimer = setTimeout(() => {
    pendingInitDebounceTimer = null
    void runInit()
  }, 150)
  ;[600, 1500, 3000].forEach(delay => {
    const timer = setTimeout(() => {
      void runInit()
    }, delay)
    initRetryTimers.push(timer)
  })
}

function handleIframeLoad() {
  scheduleInit()
}

const handleMessage = async (event: MessageEvent) => {
  if (!event.data || typeof event.data !== 'object') return
  if (event.origin !== getThingsVisTargetOrigin()) return

  const { type, projectId } = event.data
  const payload = event.data?.payload && typeof event.data.payload === 'object' ? event.data.payload : {}

  if (type === 'tv:save') {
    await handleHostSave(payload)
    return
  }

  if (type === 'tv:platform-write') {
    await handlePlatformWrite(payload)
    return
  }

  if (type === 'thingsvis:requestFieldData') {
    if (!iframeRef.value?.contentWindow) return

    try {
      ensureDeviceWs((payload as any).deviceId)
      const result = await buildRequestedFieldData((payload as any).fieldIds, (payload as any).deviceId)
      postPlatformData(result.fields, (payload as any).deviceId)
      result.histories.forEach(item => {
        postPlatformHistory(item.fieldId, item.history, item.deviceId)
      })
    } catch {
      // Best effort only: ignore transient field-request failures to avoid console noise.
    }
    return
  }

  if (type === 'LOADED') {
    if (props.mode === 'viewer') {
      scheduleViewerHydration()
    }
    return
  }

  if (type === 'thingsvis:requestDeviceFields') {
    const deviceId = typeof (payload as any).deviceId === 'string' ? (payload as any).deviceId : undefined
    const templateId = typeof (payload as any).templateId === 'string' ? (payload as any).templateId : undefined
    if (!iframeRef.value?.contentWindow || !deviceId || !templateId) return

    try {
      const entry = await loadTemplateEntry(templateId)
      postToThingsVis('tv:device-fields', {
        deviceId,
        templateId,
        fields: Array.isArray(entry.fields) ? entry.fields : []
      })
    } catch (error) {
      console.warn('[AppFrame] Failed to load requested device fields:', deviceId, templateId, error)
    }
    return
  }

  if (type === 'tv:ready' || type === 'READY') {
    if (!initSucceeded) {
      scheduleInit()
    }
    return
  }

  if (type === 'tv:preview') {
    const target = router.resolve({
      path: '/visualization/thingsvis-preview',
      query: { id: projectId || props.id }
    })
    window.open(target.href, '_blank')
    return
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
    clearThingsVisToken()
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
  clearInitRetryTimers()
  clearViewerHydrationTimers()
  viewerHydrationCompleted = false
  viewerHydrationInFlight = false
  initSucceeded = false
  activePlatformDevices.clear()
  platformDevicesCache = null
  platformDevicesCachePromise = null
  viewerDashboardConfigCache = null
  viewerDashboardConfigCacheId = null
  viewerDashboardConfigPromise = null
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
