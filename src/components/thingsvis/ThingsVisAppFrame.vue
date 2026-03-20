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
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRouter } from 'vue-router'
import { clearThingsVisToken, getThingsVisToken } from '@/utils/thingsvis'
import {
  deviceGroupTree,
  deviceList,
  deviceListByGroup,
  getDeviceConfigList,
  telemetryDataCurrent,
  getAttributeDataSet,
  telemetryDataHistoryList,
  telemetryDataPub
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
import { getTemplat } from '@/service/api/system-data'
import { getThingsVisDashboard, updateThingsVisDashboard, type UpdateDashboardData } from '@/service/api/thingsvis'
import { extractPlatformFields } from '@/utils/thingsvis/platform-fields'
import { getGlobalPlatformFields, resolveGlobalPlatformFieldScope } from '@/utils/thingsvis/global-platform-fields'
import { normalizeThingsVisHistoryBindings } from '@/utils/thingsvis/normalize-history-bindings'
import { localStg } from '@/utils/storage'
import { getWebsocketServerUrl } from '@/utils/common/tool'

const EDITOR_TEMPLATE_FIELD_PAGE_SIZE = 1000
const EDITOR_DEVICE_CONFIG_PAGE_SIZE = 1000
const EDITOR_GROUP_DEVICE_PAGE_SIZE = 1000
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
const emit = defineEmits<{
  hostSaveSuccess: [payload: { id: string; name?: string }]
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
  groupId: string
  groupName: string
  templateId?: string
  fields: Array<{ id?: string; name?: string }>
  presets: any[]
}

type PlatformDeviceGroupEntry = {
  groupId: string
  groupName: string
  deviceCount?: number
  parentId?: string | null
}

type TemplateEntry = {
  fields: Array<{ id?: string; name?: string }>
}

const deviceWsMap = new Map<string, DeviceWsEntry>()
const activePlatformDevices = new Map<string, { deviceId: string; fields: Array<{ id?: string; name?: string }> }>()
const templateEntryCache = new Map<string, TemplateEntry>()
const templatePresetCache = new Map<string, any[]>()
const templatePresetPromise = new Map<string, Promise<any[]>>()
let platformDeviceGroupsCache: PlatformDeviceGroupEntry[] | null = null
let platformDeviceGroupsCachePromise: Promise<PlatformDeviceGroupEntry[]> | null = null
let deviceConfigTemplateMapCache: Map<string, string> | null = null
let deviceConfigTemplateMapPromise: Promise<Map<string, string>> | null = null
const platformDevicesByGroupCache = new Map<string, PlatformDeviceEntry[]>()
const platformDevicesByGroupPromise = new Map<string, Promise<PlatformDeviceEntry[]>>()
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
 * Both trigger editor/viewer bootstrap work. Without a guard,
 * the second call tears down WS while the first is still completing.
 */
let initInProgress = false
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
let initRetryTimers: Array<ReturnType<typeof setTimeout>> = []
let viewerHydrationInFlight = false
let viewerHydrationDone = false

let viewerDashboardConfigCache: Record<string, unknown> | null = null
let viewerDashboardConfigPromise: Promise<Record<string, unknown> | null> | null = null
let viewerDashboardConfigCacheId: string | null = null

async function fetchDashboardWithRetry(id: string) {
  let result = await getThingsVisDashboard(id)

  if (result.error?.status === 401) {
    clearThingsVisToken()
    result = await getThingsVisDashboard(id)
  }

  return result
}

function getCurrentUserInfo() {
  return localStg.get('userInfo') as Api.Auth.UserInfo | null
}

function getCurrentPlatformFieldScope() {
  return resolveGlobalPlatformFieldScope(getCurrentUserInfo())
}

function getCurrentGlobalPlatformFields() {
  return getGlobalPlatformFields(getCurrentPlatformFieldScope())
}

function cloneDashboardConfig<T>(config: T): T {
  if (!config || typeof config !== 'object') return config
  return JSON.parse(JSON.stringify(config))
}

function normalizeDashboardConfig<T>(config: T): T {
  const cloned = cloneDashboardConfig(config)
  return normalizeThingsVisHistoryBindings(cloned)
}

function normalizeEditorGroupId(groupId?: unknown, fallbackName?: unknown): string {
  const normalized = String(groupId || fallbackName || '__ungrouped__').trim()
  return normalized || '__ungrouped__'
}

function normalizeEditorGroupName(groupName?: unknown, fallbackId?: unknown): string {
  const normalized = String(groupName || fallbackId || 'Ungrouped').trim()
  return normalized || 'Ungrouped'
}

function normalizeCanvasBackground(background: unknown): Record<string, unknown> {
  if (background && typeof background === 'object' && !Array.isArray(background)) {
    return background as Record<string, unknown>
  }

  const color = typeof background === 'string' && background.trim().length > 0 ? background : 'transparent'

  return { color }
}

function registerActivePlatformDevices(devices: PlatformDeviceEntry[]) {
  devices.forEach(device => {
    if (!device?.deviceId) return
    const existing = activePlatformDevices.get(device.deviceId)
    activePlatformDevices.set(device.deviceId, {
      deviceId: device.deviceId,
      fields: Array.isArray(existing?.fields) && existing.fields.length > 0 ? existing.fields : device.fields || []
    })
  })
}

function updateActivePlatformDeviceFields(deviceId: string, fields: Array<{ id?: string; name?: string }>) {
  const normalizedFields = Array.isArray(fields) ? fields : []
  activePlatformDevices.set(deviceId, { deviceId, fields: normalizedFields })

  const wsEntry = deviceWsMap.get(deviceId)
  if (wsEntry) {
    wsEntry.device.fields = normalizedFields
  }
}

function flattenDeviceGroupTree(
  nodes: unknown[],
  groups = new Map<string, PlatformDeviceGroupEntry>()
): PlatformDeviceGroupEntry[] {
  nodes.forEach(node => {
    if (!node || typeof node !== 'object') return
    const treeNode = node as {
      group?: { id?: unknown; name?: unknown; parent_id?: unknown; parentId?: unknown }
      children?: unknown[]
      device_count?: unknown
      deviceCount?: unknown
    }
    const groupId = normalizeEditorGroupId(treeNode.group?.id, treeNode.group?.name)
    groups.set(groupId, {
      groupId,
      groupName: normalizeEditorGroupName(treeNode.group?.name, groupId),
      ...(typeof treeNode.deviceCount === 'number' ? { deviceCount: treeNode.deviceCount } : {}),
      ...(typeof treeNode.device_count === 'number' ? { deviceCount: treeNode.device_count } : {}),
      ...(treeNode.group?.parent_id !== undefined ? { parentId: String(treeNode.group.parent_id) } : {}),
      ...(treeNode.group?.parentId !== undefined ? { parentId: String(treeNode.group.parentId) } : {})
    })

    if (Array.isArray(treeNode.children) && treeNode.children.length > 0) {
      flattenDeviceGroupTree(treeNode.children, groups)
    }
  })

  return Array.from(groups.values()).sort((a, b) => a.groupName.localeCompare(b.groupName))
}

function clearViewerHydrationTimers() {
  viewerHydrationTimers.forEach(timer => clearTimeout(timer))
  viewerHydrationTimers = []
}

function resetViewerHydrationState() {
  clearViewerHydrationTimers()
  viewerHydrationInFlight = false
  viewerHydrationDone = false
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

const FIELD_BINDING_EXPR_RE = /\{\{\s*ds\.([^.\s}]+)\.([^}]+?)\s*\}\}/g

function collectRequestedFieldsFromValue(value: unknown, requests: Map<string, Set<string>>) {
  if (typeof value === 'string') {
    let match: RegExpExecArray | null = null
    FIELD_BINDING_EXPR_RE.lastIndex = 0
    while ((match = FIELD_BINDING_EXPR_RE.exec(value)) !== null) {
      const dataSourceId = match[1]
      const fieldPath = match[2]?.trim()
      if (!dataSourceId || !fieldPath) continue
      const fieldId = fieldPath.split(/[.[\]]/).filter(Boolean)[0]
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

function syncActivePlatformDevicesFromConfig(config: any) {
  activePlatformDevices.clear()

  collectPlatformSourceDescriptors(config).forEach(descriptor => {
    if (!descriptor.deviceId || activePlatformDevices.has(descriptor.deviceId)) return

    activePlatformDevices.set(descriptor.deviceId, {
      deviceId: descriptor.deviceId,
      fields: []
    })
  })
}

async function fetchAllCurrentFieldsForDevice(deviceId: string): Promise<Record<string, unknown>> {
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

  return kvMap
}

async function loadViewerDashboardConfig(): Promise<Record<string, unknown> | null> {
  if (props.mode !== 'viewer') return null
  if (props.schema) {
    return normalizeDashboardConfig({
      id: props.schema.id || props.id,
      name: props.schema.name,
      canvas: props.schema.canvasConfig,
      nodes: Array.isArray(props.schema.nodes) ? props.schema.nodes : [],
      dataSources: Array.isArray(props.schema.dataSources) ? props.schema.dataSources : []
    })
  }
  if (viewerDashboardConfigCache && viewerDashboardConfigCacheId === props.id) return viewerDashboardConfigCache
  if (viewerDashboardConfigPromise) return viewerDashboardConfigPromise

  viewerDashboardConfigPromise = (async () => {
    try {
      const { data, error } = await fetchDashboardWithRetry(props.id)
      if (error || !data) return null

      viewerDashboardConfigCacheId = props.id
      viewerDashboardConfigCache = normalizeDashboardConfig({
        id: data.id,
        name: data.name,
        canvas: data.canvasConfig,
        nodes: Array.isArray(data.nodes) ? data.nodes : [],
        dataSources: Array.isArray(data.dataSources) ? data.dataSources : []
      })
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

function normalizeDeviceTotalHistory(records: any[]): HistoryPoint[] {
  return records
    .map((item: any) => ({
      value: normalizeMetricValue(item?.device_online) + normalizeMetricValue(item?.device_offline),
      ts: new Date(item?.timestamp || item?.time || item?.x || item?.ts || Date.now()).getTime()
    }))
    .filter(point => !Number.isNaN(point.ts))
}

function normalizeSystemMetricHistory(records: any[], metricKey: 'cpu' | 'memory' | 'disk'): HistoryPoint[] {
  return records
    .map((item: any) => ({
      value: normalizeMetricValue(item?.[`${metricKey}_usage`] ?? item?.[metricKey]),
      ts: new Date(item?.timestamp || item?.time || item?.x || item?.ts || Date.now()).getTime()
    }))
    .filter(point => !Number.isNaN(point.ts))
}

function unwrapList(payload: any): any[] {
  if (Array.isArray(payload?.list)) return payload.list
  if (Array.isArray(payload)) return payload
  return []
}

function parseTemplateChartConfig(rawConfig: unknown): Record<string, unknown> | null {
  if (typeof rawConfig === 'string') {
    if (!rawConfig.trim()) return null
    try {
      const parsed = JSON.parse(rawConfig)
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? (parsed as Record<string, unknown>) : null
    } catch (error) {
      console.warn('[AppFrame] Failed to parse template chart config', error)
      return null
    }
  }

  if (rawConfig && typeof rawConfig === 'object' && !Array.isArray(rawConfig)) {
    return rawConfig as Record<string, unknown>
  }

  return null
}

function extractPresetSchema(config: Record<string, unknown> | null) {
  if (!config) return null

  const nodes = Array.isArray(config.nodes)
    ? config.nodes.filter(
        (node): node is Record<string, unknown> => Boolean(node) && typeof node === 'object' && !Array.isArray(node)
      )
    : []

  if (nodes.length === 0) return null

  return {
    ...(config.canvas && typeof config.canvas === 'object' && !Array.isArray(config.canvas)
      ? { canvas: config.canvas as Record<string, unknown> }
      : {}),
    nodes,
    ...(Array.isArray(config.dataSources) ? { dataSources: config.dataSources } : {})
  }
}

function extractFirstPresetWidget(config: Record<string, unknown> | null): Record<string, unknown> | null {
  if (!config) return null

  if (Array.isArray(config.nodes)) {
    const firstNode = config.nodes.find(
      (node): node is Record<string, unknown> => Boolean(node) && typeof node === 'object' && !Array.isArray(node)
    )
    if (firstNode) return firstNode
  }

  if (config.nodesById && typeof config.nodesById === 'object' && !Array.isArray(config.nodesById)) {
    const firstNode = Object.values(config.nodesById).find(
      (node): node is Record<string, unknown> => Boolean(node) && typeof node === 'object' && !Array.isArray(node)
    )
    if (firstNode) return firstNode
  }

  return null
}

function buildDeviceChartPreset(templateId: string, presetId: 'web' | 'app', label: string, rawConfig: unknown) {
  const config = parseTemplateChartConfig(rawConfig)
  const schema = extractPresetSchema(config)
  const widget = extractFirstPresetWidget(config)
  if (!widget && !schema) return null

  return {
    id: `${templateId}-${presetId}-chart`,
    name: label,
    ...(widget ? { widget } : {}),
    ...(schema ? { schema } : {})
  }
}

async function loadTemplatePresets(templateId: string | number): Promise<any[]> {
  const cacheKey = String(templateId)
  const cached = templatePresetCache.get(cacheKey)
  if (cached) return cached

  const pending = templatePresetPromise.get(cacheKey)
  if (pending) return pending

  const promise = (async () => {
    try {
      const res = await getTemplat(templateId)
      const template = res?.data || {}
      const presets = [
        buildDeviceChartPreset(cacheKey, 'web', 'Web图表', template?.web_chart_config),
        buildDeviceChartPreset(cacheKey, 'app', 'App图表', template?.app_chart_config)
      ].filter(Boolean)

      templatePresetCache.set(cacheKey, presets)
      return presets
    } catch (error) {
      console.error('[AppFrame] Failed to load template presets', templateId, error)
      templatePresetCache.set(cacheKey, [])
      return []
    } finally {
      templatePresetPromise.delete(cacheKey)
    }
  })()

  templatePresetPromise.set(cacheKey, promise)
  return promise
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

  const requiresDeviceSummary = ['device_total', 'device_online', 'device_offline', 'device_activity'].some(fieldId =>
    requestedCurrentFieldSet.has(fieldId)
  )
  const requiresAlarmSummary = requestedCurrentFieldSet.has('alarm_device_total')
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
  const requiresDeviceTrend =
    requestedHistoryFieldSet.has('device_online') ||
    requestedHistoryFieldSet.has('device_offline') ||
    requestedHistoryFieldSet.has('device_total') ||
    requestedHistoryFieldSet.has('device_activity')

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
    aggregateValues.alarm_device_total = normalizeMetricValue(alarmCountResult.value?.data?.alarm_device_total)
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

    if (historyFieldIds.includes('device_online')) {
      const history = normalizeHistory(points, 'device_online')
      if (history.length > 0) result.histories.push({ fieldId: 'device_online', history })
    }

    if (historyFieldIds.includes('device_offline')) {
      const history = normalizeHistory(points, 'device_offline')
      if (history.length > 0) result.histories.push({ fieldId: 'device_offline', history })
    }

    if (historyFieldIds.includes('device_total')) {
      const history = normalizeDeviceTotalHistory(points)
      if (history.length > 0) result.histories.push({ fieldId: 'device_total', history })
    }

    if (historyFieldIds.includes('device_activity')) {
      const history = normalizeHistory(points, 'device_online')
      if (history.length > 0) result.histories.push({ fieldId: 'device_activity', history })
    }
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

async function hydrateConfiguredPlatformSources(): Promise<boolean> {
  const config = await loadViewerDashboardConfig()
  if (!config) return false

  const descriptors = collectPlatformSourceDescriptors(config)
  if (descriptors.length === 0) return true

  const handledDeviceIds = new Set<string>()
  let globalHydrated = false

  for (const descriptor of descriptors) {
    const requestedFields = descriptor.requestedFields

    if (descriptor.deviceId) {
      if (handledDeviceIds.has(descriptor.deviceId)) continue
      handledDeviceIds.add(descriptor.deviceId)

      if (requestedFields.length === 0) continue

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

    if (requestedFields.length === 0) continue

    const result = await buildRequestedFieldData(requestedFields)
    postPlatformData(result.fields)
    result.histories.forEach(item => {
      postPlatformHistory(item.fieldId, item.history)
    })
  }

  return true
}

function scheduleViewerHydration() {
  if (props.mode !== 'viewer') return
  if (viewerHydrationDone || viewerHydrationInFlight) return

  clearViewerHydrationTimers()

  const timer = setTimeout(async () => {
    if (viewerHydrationDone || viewerHydrationInFlight) return

    viewerHydrationInFlight = true
    try {
      const hasConfig = await hydrateConfiguredPlatformSources()
      if (hasConfig) {
        viewerHydrationDone = true
      }
    } finally {
      viewerHydrationInFlight = false
    }
  }, 200)

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
  const rawConfig = payload.config && typeof payload.config === 'object' ? payload.config : payload
  const config = normalizeDashboardConfig(rawConfig)
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

  if (result.error?.status === 401) {
    clearThingsVisToken()
    result = await updateThingsVisDashboard(props.id, updatePayload)
  }

  // if (result.error) {
  //   console.error('[AppFrame] Failed to save dashboard via host bridge:', result.error)
  //   if ((window as any).$message) {
  //     ;(window as any).$message.error(`保存失败: ${result.error.status} ${result.error.message || '未知错误'}`)
  //   }
  //   return
  // }

  // if ((window as any).$message) {
  //   ;(window as any).$message.success('保存成功')
  // }

  emit('hostSaveSuccess', {
    id: props.id,
    name: typeof updatePayload.name === 'string' ? updatePayload.name : undefined
  })
}

async function loadDeviceConfigTemplateMap(): Promise<Map<string, string>> {
  if (deviceConfigTemplateMapCache) {
    return deviceConfigTemplateMapCache
  }

  if (deviceConfigTemplateMapPromise) {
    return deviceConfigTemplateMapPromise
  }

  deviceConfigTemplateMapPromise = (async () => {
    try {
      const confRes = await getDeviceConfigList({ page: 1, page_size: EDITOR_DEVICE_CONFIG_PAGE_SIZE })
      const configs = unwrapList(confRes?.data)
      const configTemplateMap = new Map<string, string>()

      configs.forEach((config: any) => {
        if (config?.id && config?.device_template_id) {
          configTemplateMap.set(String(config.id), String(config.device_template_id))
        }
      })

      deviceConfigTemplateMapCache = configTemplateMap
      return configTemplateMap
    } catch (err) {
      console.error('[AppFrame] Failed to load device config template map', err)
      deviceConfigTemplateMapCache = new Map()
      return deviceConfigTemplateMapCache
    } finally {
      deviceConfigTemplateMapPromise = null
    }
  })()

  return deviceConfigTemplateMapPromise
}

async function buildPlatformDeviceGroups(): Promise<PlatformDeviceGroupEntry[]> {
  if (platformDeviceGroupsCache) {
    return platformDeviceGroupsCache
  }

  if (platformDeviceGroupsCachePromise) {
    return platformDeviceGroupsCachePromise
  }

  platformDeviceGroupsCachePromise = (async () => {
    try {
      const res = await deviceGroupTree({})
      const groups = flattenDeviceGroupTree(Array.isArray(res?.data) ? res.data : [])
      platformDeviceGroupsCache = groups
      return groups
    } catch (err) {
      console.error('[AppFrame] Failed to load platform device groups', err)
      platformDeviceGroupsCache = []
      return []
    } finally {
      platformDeviceGroupsCachePromise = null
    }
  })()

  return platformDeviceGroupsCachePromise
}

async function buildPlatformDevicesByGroup(groupId: string): Promise<PlatformDeviceEntry[]> {
  const normalizedGroupId = normalizeEditorGroupId(groupId)

  const cached = platformDevicesByGroupCache.get(normalizedGroupId)
  if (cached) {
    return cached
  }

  const pending = platformDevicesByGroupPromise.get(normalizedGroupId)
  if (pending) {
    return pending
  }

  const promise = (async () => {
    try {
      const [deviceRes, configTemplateMap, groups] = await Promise.all([
        deviceListByGroup({ group_id: normalizedGroupId, page: 1, page_size: EDITOR_GROUP_DEVICE_PAGE_SIZE }),
        loadDeviceConfigTemplateMap(),
        buildPlatformDeviceGroups()
      ])

      const groupName =
        groups.find(group => group.groupId === normalizedGroupId)?.groupName ||
        normalizeEditorGroupName(undefined, normalizedGroupId)

      const rawDevices = unwrapList(deviceRes?.data)
      const templateIds = Array.from(
        new Set(
          rawDevices
            .map(
              (device: any) =>
                (device?.device_config?.device_template_id ? String(device.device_config.device_template_id) : null) ||
                (device?.device_config_id ? configTemplateMap.get(String(device.device_config_id)) : null)
            )
            .filter((templateId): templateId is string => Boolean(templateId))
        )
      )
      const presetEntries = await Promise.all(
        templateIds.map(async templateId => [templateId, await loadTemplatePresets(templateId)] as const)
      )
      const presetsByTemplateId = new Map<string, any[]>(presetEntries)

      const devices = rawDevices
        .map((device: any): PlatformDeviceEntry | null => {
          const templateId =
            (device?.device_config?.device_template_id ? String(device.device_config.device_template_id) : null) ||
            (device?.device_config_id ? configTemplateMap.get(String(device.device_config_id)) : null)

          if (!templateId || !device?.id) return null

          return {
            deviceId: String(device.id),
            deviceName: String(device.name || device.device_number || device.id),
            groupId: normalizedGroupId,
            groupName,
            templateId,
            fields: [],
            presets: presetsByTemplateId.get(templateId) || []
          }
        })
        .filter((item): item is PlatformDeviceEntry => Boolean(item))

      platformDevicesByGroupCache.set(normalizedGroupId, devices)
      return devices
    } catch (err) {
      console.error('[AppFrame] Failed to assemble platformDevices for group', normalizedGroupId, err)
      platformDevicesByGroupCache.set(normalizedGroupId, [])
      return []
    } finally {
      platformDevicesByGroupPromise.delete(normalizedGroupId)
    }
  })()

  platformDevicesByGroupPromise.set(normalizedGroupId, promise)
  return promise
}

/** Full init sequence triggered once per tv:ready (debounced). */
async function doInit() {
  if (!iframeRef.value?.contentWindow || !token.value || !props.id) return

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
    const fetched = dashboardData ? { data: dashboardData, error: null } : await fetchDashboardWithRetry(props.id)
    const { data, error } = fetched
    if (!error && data) {
      dashboardPayload = normalizeDashboardConfig({
        meta: {
          id: data.id,
          name: data.name,
          thumbnail: data.thumbnail
        },
        canvas: data.canvasConfig,
        nodes: Array.isArray(data.nodes) ? data.nodes : [],
        dataSources: Array.isArray(data.dataSources) ? data.dataSources : []
      })
    } else if (!dashboardData) {
      console.warn('[AppFrame] Dashboard preload unavailable, deferring init:', props.id, error)
      return
    }
  } catch (error) {
    console.warn('[AppFrame] Failed to preload dashboard schema for embed init:', props.id, error)
    return
  }

  let platformDeviceGroups: PlatformDeviceGroupEntry[] = []

  if (props.mode === 'editor') {
    platformDeviceGroups = await buildPlatformDeviceGroups()
  }

  const platformBufferSize = Math.max(
    DEFAULT_PLATFORM_BUFFER_SIZE,
    resolvePlatformBufferSize(dashboardPayload.dataSources)
  )

  if (props.mode === 'viewer') {
    syncActivePlatformDevicesFromConfig(dashboardPayload)
  } else {
    activePlatformDevices.clear()
  }

  iframeRef.value.contentWindow.postMessage(
    {
      type: 'tv:init',
      payload: {
        platformFields: getCurrentGlobalPlatformFields(),
        platformBufferSize,
        platformFieldScope: getCurrentPlatformFieldScope(),
        platformDeviceGroups,
        platformDevices: [],
        data: dashboardPayload,
        config: {
          mode: 'app',
          saveTarget: 'host',
          token: token.value,
          apiBaseUrl
        }
      }
    },
    getThingsVisTargetOrigin()
  )

  if (props.mode === 'viewer') {
    scheduleViewerHydration()
  } else {
    disconnectAllDeviceWs()
  }
}

function scheduleInit() {
  if (!iframeRef.value?.contentWindow || !token.value || !props.id) return

  if (pendingInitDebounceTimer) clearTimeout(pendingInitDebounceTimer)
  clearInitRetryTimers()

  const runInit = async () => {
    if (initInProgress) return
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
      const deviceId = typeof (payload as any).deviceId === 'string' ? (payload as any).deviceId : undefined
      if (deviceId && !activePlatformDevices.has(deviceId)) {
        activePlatformDevices.set(deviceId, { deviceId, fields: [] })
      }
      ensureDeviceWs(deviceId)
      const result = await buildRequestedFieldData((payload as any).fieldIds, deviceId)
      postPlatformData(result.fields, deviceId)
      result.histories.forEach(item => {
        postPlatformHistory(item.fieldId, item.history, item.deviceId)
      })
    } catch {
      // Best effort only: ignore transient field-request failures to avoid console noise.
    }
    return
  }

  if (type === 'thingsvis:requestDevicesByGroup') {
    const groupId = typeof (payload as any).groupId === 'string' ? (payload as any).groupId : undefined
    if (!groupId) return

    try {
      const devices = await buildPlatformDevicesByGroup(groupId)
      registerActivePlatformDevices(devices)
      postToThingsVis('tv:devices-by-group', { groupId, devices })
    } catch (error) {
      console.warn('[AppFrame] Failed to load requested device group:', groupId, error)
      postToThingsVis('tv:devices-by-group', { groupId, devices: [] })
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
      updateActivePlatformDeviceFields(deviceId, Array.isArray(entry.fields) ? entry.fields : [])
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
    scheduleInit()
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

watch(
  () => props.id,
  nextId => {
    resetViewerHydrationState()
    if (!nextId || !token.value) return
    scheduleInit()
  }
)

onBeforeUnmount(() => {
  window.removeEventListener('message', handleMessage)
  if (pendingInitDebounceTimer) clearTimeout(pendingInitDebounceTimer)
  clearInitRetryTimers()
  resetViewerHydrationState()
  activePlatformDevices.clear()
  platformDeviceGroupsCache = null
  platformDeviceGroupsCachePromise = null
  deviceConfigTemplateMapCache = null
  deviceConfigTemplateMapPromise = null
  platformDevicesByGroupCache.clear()
  platformDevicesByGroupPromise.clear()
  viewerDashboardConfigCache = null
  viewerDashboardConfigCacheId = null
  viewerDashboardConfigPromise = null
  templateEntryCache.clear()
  templatePresetCache.clear()
  templatePresetPromise.clear()
  disconnectAllDeviceWs()
})
</script>

<style scoped>
.thingsvis-frame-container {
  width: 100%;
  height: 100%;
  min-height: clamp(320px, 48vh, 560px);
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
  min-height: inherit;
  padding: 24px 0;
  color: #888;
}
</style>
