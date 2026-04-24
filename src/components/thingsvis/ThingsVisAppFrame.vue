<template>
  <div class="thingsvis-frame-container">
    <iframe
      v-if="url"
      ref="iframeRef"
      :src="url"
      class="thingsvis-frame"
      frameborder="0"
      allowfullscreen
      @load="handleIframeLoad"
    ></iframe>
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
  telemetryDataPub,
  attributeDataPub,
  commandDataPub
} from '@/service/api/device'
import { attributesApi, telemetryApi, commandsApi } from '@/service/api'
import { getTemplat } from '@/service/api/system-data'
import { getThingsVisDashboard, updateThingsVisDashboard, type UpdateDashboardData } from '@/service/api/thingsvis'
import { extractPlatformFields } from '@/utils/thingsvis/platform-fields'
import type { PlatformField } from '@/utils/thingsvis/types'
import { localStg } from '@/utils/storage'
import { getDemoServerUrl, getWebsocketServerUrl } from '@/utils/common/tool'

const EDITOR_TEMPLATE_FIELD_PAGE_SIZE = 1000
const EDITOR_DEVICE_CONFIG_PAGE_SIZE = 1000
const EDITOR_GROUP_DEVICE_PAGE_SIZE = 1000
const DEFAULT_PLATFORM_BUFFER_SIZE = 100
const GENERATED_HOST_DATA_SOURCE_ID_RE = /^(?:__platform_.+__|thingspanel_.+)$/
const DATA_SOURCE_EXPRESSION_RE = /ds\.([^\s.}]+)\./g

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

// Device WebSocket management

const PING_INTERVAL_MS = 8_000
const WS_RECONNECT_DELAY_MS = 3_000

interface DeviceWsEntry {
  ws: WebSocket | null
  pingTimer: ReturnType<typeof setInterval> | null
  reconnectTimer: ReturnType<typeof setTimeout> | null
  destroyed: boolean
  device: { deviceId: string; fields: PlatformDeviceField[] }
}

interface DeviceStatusWsEntry {
  ws: WebSocket | null
  pingTimer: ReturnType<typeof setInterval> | null
  reconnectTimer: ReturnType<typeof setTimeout> | null
  destroyed: boolean
  deviceId: string
}

type PlatformDeviceField = Pick<PlatformField, 'id' | 'name' | 'dataType'>

type PlatformDeviceEntry = {
  deviceId: string
  deviceName: string
  groupId: string
  groupName: string
  deviceConfigId?: string
  templateId?: string
  fields: PlatformDeviceField[]
  presets: any[]
}

type PlatformDeviceGroupEntry = {
  groupId: string
  groupName: string
  deviceCount?: number
  parentId?: string | null
}

type TemplateEntry = {
  fields: PlatformDeviceField[]
}

const deviceWsMap = new Map<string, DeviceWsEntry>()
const deviceStatusWsMap = new Map<string, DeviceStatusWsEntry>()
const activePlatformDevices = new Map<string, { deviceId: string; fields: PlatformDeviceField[] }>()
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

/** Extract flat key-value map from various WS response shapes. */
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
function mapFieldIds(rawFields: Record<string, unknown>, deviceFields: PlatformDeviceField[]): Record<string, unknown> {
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
function connectDeviceWs(device: { deviceId: string; fields: PlatformDeviceField[] }) {
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
      console.warn('[AppFrame] WS closed for device', deviceId, '- scheduling reconnect')
      entry.reconnectTimer = setTimeout(openWs, WS_RECONNECT_DELAY_MS)
    }
  }

  openWs()
}

function connectDeviceStatusWs(deviceId: string) {
  const prev = deviceStatusWsMap.get(deviceId)
  if (prev) {
    prev.destroyed = true
    if (prev.pingTimer) clearInterval(prev.pingTimer)
    if (prev.reconnectTimer) clearTimeout(prev.reconnectTimer)
    prev.ws?.close()
  }

  const entry: DeviceStatusWsEntry = {
    ws: null,
    pingTimer: null,
    reconnectTimer: null,
    destroyed: false,
    deviceId
  }
  deviceStatusWsMap.set(deviceId, entry)

  function openWs() {
    if (entry.destroyed) return

    const token = localStg.get('token') as string | undefined
    if (!token) {
      entry.reconnectTimer = setTimeout(openWs, WS_RECONNECT_DELAY_MS)
      return
    }

    try {
      entry.ws = new WebSocket(`${getWebsocketServerUrl()}/device/online/status/ws`)
    } catch (err) {
      console.warn('[AppFrame] Status WS init failed for device', deviceId, err)
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
        const msg = JSON.parse(evt.data) as Record<string, unknown>
        if (typeof msg.is_online !== 'number') return
        postPlatformData(
          {
            is_online: msg.is_online,
            online_text: msg.is_online === 1 ? '在线' : '离线',
            online_status_updated_at: Date.now()
          },
          deviceId
        )
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

function ensureDeviceStatusWs(deviceId?: string) {
  if (!deviceId) return
  const existing = deviceStatusWsMap.get(deviceId)
  if (existing && !existing.destroyed) return
  connectDeviceStatusWs(deviceId)
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

  for (const entry of deviceStatusWsMap.values()) {
    entry.destroyed = true
    if (entry.pingTimer) clearInterval(entry.pingTimer)
    if (entry.reconnectTimer) clearTimeout(entry.reconnectTimer)
    entry.ws?.close()
  }
  deviceStatusWsMap.clear()
}

// End WebSocket management

/**
 * Guard against concurrent tv:ready re-inits.
 * Studio sends tv:ready twice (once on load, once after bootstrap completes).
 * Both trigger editor/viewer bootstrap work. Without a guard,
 * the second call tears down WS while the first is still completing.
 */
let initInProgress = false
let pendingInitDebounceTimer: ReturnType<typeof setTimeout> | null = null
let pendingInitRetryTimer: ReturnType<typeof setTimeout> | null = null
let lastInitCompletedSignature = ''
let initRetryAttempt = 0

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

function cloneDashboardConfig<T>(config: T): T {
  if (!config || typeof config !== 'object') return config
  return JSON.parse(JSON.stringify(config))
}

function normalizeDashboardConfig<T>(config: T): T {
  return cloneDashboardConfig(config)
}

function hasCompleteDashboardSchema(
  schema?: {
    canvasConfig?: Record<string, unknown>
    nodes?: unknown[]
    dataSources?: unknown[]
  } | null
): boolean {
  if (!schema || !schema.canvasConfig || typeof schema.canvasConfig !== 'object') return false
  if (!Array.isArray(schema.nodes)) return false
  if (!Array.isArray(schema.dataSources)) return false
  return true
}

function normalizeEditorGroupId(groupId?: unknown, fallbackName?: unknown): string {
  const normalized = String(groupId || fallbackName || '__ungrouped__').trim()
  return normalized || '__ungrouped__'
}

function normalizeEditorGroupName(groupName?: unknown, fallbackId?: unknown): string {
  const normalized = String(groupName || fallbackId || 'Ungrouped').trim()
  return normalized || 'Ungrouped'
}

function firstString(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (value === undefined || value === null) continue
    const normalized = String(value).trim()
    if (normalized) return normalized
  }
  return undefined
}

function firstNumber(...values: unknown[]): number | undefined {
  for (const value of values) {
    if (typeof value === 'number' && Number.isFinite(value)) return value
    if (typeof value === 'string' && value.trim()) {
      const parsed = Number(value)
      if (Number.isFinite(parsed)) return parsed
    }
  }
  return undefined
}

function asRecord(value: unknown): Record<string, any> {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, any>) : {}
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

function updateActivePlatformDeviceFields(deviceId: string, fields: PlatformDeviceField[]) {
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
    const treeNode = asRecord(node)
    const rawGroup = asRecord(treeNode.group || treeNode.data || treeNode)
    const groupId = normalizeEditorGroupId(
      firstString(rawGroup.id, rawGroup.group_id, rawGroup.groupId, rawGroup.value, treeNode.id, treeNode.group_id),
      firstString(rawGroup.name, rawGroup.group_name, rawGroup.groupName, rawGroup.label, treeNode.name, treeNode.label)
    )
    const groupName = normalizeEditorGroupName(
      firstString(
        rawGroup.name,
        rawGroup.group_name,
        rawGroup.groupName,
        rawGroup.label,
        treeNode.name,
        treeNode.label
      ),
      groupId
    )
    const parentId = firstString(rawGroup.parent_id, rawGroup.parentId, treeNode.parent_id, treeNode.parentId)
    const deviceCount = firstNumber(
      treeNode.deviceCount,
      treeNode.device_count,
      rawGroup.deviceCount,
      rawGroup.device_count
    )
    groups.set(groupId, {
      groupId,
      groupName,
      ...(deviceCount !== undefined ? { deviceCount } : {}),
      ...(parentId !== undefined ? { parentId } : {})
    })

    const children = Array.isArray(treeNode.children)
      ? treeNode.children
      : Array.isArray(treeNode.child)
        ? treeNode.child
        : Array.isArray(treeNode.list)
          ? treeNode.list
          : []

    if (children.length > 0) {
      flattenDeviceGroupTree(children, groups)
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

const FIELD_BINDING_EXPR_RE = /\{\{\s*ds\.([^.\s}]+)\.([^}]+?)\s*\}\}/g

function collectRequestedFieldsFromValue(value: unknown, requests: Map<string, Set<string>>) {
  if (typeof value === 'string') {
    let match: RegExpExecArray | null = null
    FIELD_BINDING_EXPR_RE.lastIndex = 0
    while ((match = FIELD_BINDING_EXPR_RE.exec(value)) !== null) {
      const dataSourceId = match[1]
      const fieldPath = match[2]?.trim()
      if (!dataSourceId || !fieldPath) continue
      const normalizedPath = fieldPath.replace(/^data(?:\.|\[)/, '')
      const fieldId = normalizedPath.split(/[.[\]]/).filter(Boolean)[0]
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
  const descriptors = dataSources
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

      const normalizedRequestedFields = Array.from(requestedFields)
      const configuredDeviceId =
        typeof dataSource?.config?.deviceId === 'string' ? dataSource.config.deviceId : undefined

      return {
        id: String(dataSource.id),
        deviceId: configuredDeviceId,
        requestedFields: normalizedRequestedFields
      }
    })

  return descriptors
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
  const thingsvisApiBaseUrl = encodeURIComponent(window.location.origin + '/thingsvis-api')
  const platformApiBaseUrl = encodeURIComponent(getDemoServerUrl())
  const saveTarget = 'host'

  if (props.mode === 'viewer') {
    return `${getStudioBase()}#/embed?mode=embedded&provider=thingspanel&context=dashboard&saveTarget=${saveTarget}&token=${thingsVisToken}&thingsvisApiBaseUrl=${thingsvisApiBaseUrl}&platformApiBaseUrl=${platformApiBaseUrl}`
  }

  return `${getStudioBase()}#/editor?mode=embedded&provider=thingspanel&context=dashboard&saveTarget=${saveTarget}&token=${thingsVisToken}&thingsvisApiBaseUrl=${thingsvisApiBaseUrl}&platformApiBaseUrl=${platformApiBaseUrl}`
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

  const [telemetryResult, attributesResult, commandsResult] = await Promise.allSettled([
    telemetryApi({ page: 1, page_size: EDITOR_TEMPLATE_FIELD_PAGE_SIZE, device_template_id: templateId }),
    attributesApi({ page: 1, page_size: EDITOR_TEMPLATE_FIELD_PAGE_SIZE, device_template_id: templateId }),
    commandsApi({ page: 1, page_size: EDITOR_TEMPLATE_FIELD_PAGE_SIZE, device_template_id: templateId })
  ])

  const telemetryRes = telemetryResult.status === 'fulfilled' ? telemetryResult.value : null
  const attributesRes = attributesResult.status === 'fulfilled' ? attributesResult.value : null
  const commandsRes = commandsResult.status === 'fulfilled' ? commandsResult.value : null

  const platformSource = {
    telemetry: unwrapList(telemetryRes?.data),
    attributes: unwrapList(attributesRes?.data),
    commands: unwrapList(commandsRes?.data)
  }
  const extractedFields = extractPlatformFields(platformSource)

  const entry: TemplateEntry = {
    fields: extractedFields
  }

  templateEntryCache.set(cacheKey, entry)
  return entry
}

async function buildRequestedFieldData(fieldIds: unknown[], deviceId?: string): Promise<Record<string, unknown>> {
  const requestedFields = Array.isArray(fieldIds)
    ? fieldIds.filter((fieldId): fieldId is string => typeof fieldId === 'string')
    : []

  if (!deviceId || requestedFields.length === 0) return {}

  const currentFieldIds = requestedFields.filter(fieldId => !fieldId.endsWith('__history'))
  if (currentFieldIds.length === 0) return {}

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

  const result: Record<string, unknown> = {}
  currentFieldIds.forEach(fieldId => {
    if (kvMap[fieldId] !== undefined) result[fieldId] = kvMap[fieldId]
  })
  return result
}

async function hydrateConfiguredPlatformSources(): Promise<boolean> {
  const config = await loadViewerDashboardConfig()
  if (!config) return false

  const descriptors = collectPlatformSourceDescriptors(config)
  if (descriptors.length === 0) return true

  const handledDeviceIds = new Set<string>()

  for (const descriptor of descriptors) {
    const requestedFields = descriptor.requestedFields
    if (!descriptor.deviceId) continue

    if (handledDeviceIds.has(descriptor.deviceId)) continue
    handledDeviceIds.add(descriptor.deviceId)

    if (requestedFields.length === 0) continue

    ensureDeviceWs(descriptor.deviceId)
    ensureDeviceStatusWs(descriptor.deviceId)

    const fields = await buildRequestedFieldData(requestedFields, descriptor.deviceId)
    postPlatformData(fields, descriptor.deviceId)
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

function resolveWriteFieldId(data: unknown): string | undefined {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return undefined
  const keys = Object.keys(data as Record<string, unknown>)
  return keys.length === 1 ? keys[0] : undefined
}

function resolveWriteFieldType(deviceId: string, fieldId?: string): PlatformField['dataType'] | undefined {
  if (!fieldId) return undefined
  const device = activePlatformDevices.get(deviceId)
  const field = device?.fields.find(item => item.id === fieldId || item.name === fieldId)
  return field?.dataType
}

function postPlatformWriteResult(requestId: string | undefined, payload: Record<string, unknown>) {
  if (!requestId) return
  const win = iframeRef.value?.contentWindow
  if (!win) return
  win.postMessage(
    {
      type: 'tv:platform-write-result',
      requestId,
      ...payload
    },
    getThingsVisTargetOrigin()
  )
}

function collectReferencedDataSourceIds(value: unknown, referencedIds = new Set<string>()): Set<string> {
  if (typeof value === 'string') {
    DATA_SOURCE_EXPRESSION_RE.lastIndex = 0
    let match: RegExpExecArray | null
    while ((match = DATA_SOURCE_EXPRESSION_RE.exec(value))) {
      if (match[1]) referencedIds.add(match[1])
    }
    return referencedIds
  }

  if (Array.isArray(value)) {
    value.forEach(item => collectReferencedDataSourceIds(item, referencedIds))
    return referencedIds
  }

  if (value && typeof value === 'object') {
    Object.entries(value as Record<string, unknown>).forEach(([key, item]) => {
      if (key === 'dataSourceId' && typeof item === 'string') {
        referencedIds.add(item)
      }
      collectReferencedDataSourceIds(item, referencedIds)
    })
  }

  return referencedIds
}

function sanitizeDataSourcesForHostSave(nodes: unknown, dataSources: unknown): unknown[] {
  if (!Array.isArray(dataSources)) return []

  const referencedIds = collectReferencedDataSourceIds(nodes)
  return dataSources.filter((dataSource: any) => {
    const id = typeof dataSource?.id === 'string' ? dataSource.id : ''
    if (props.mode === 'editor' && /^thingspanel_.+$/.test(id)) return true
    if (!GENERATED_HOST_DATA_SOURCE_ID_RE.test(id)) return true
    return referencedIds.has(id)
  }).map((dataSource: any) => {
    if (!dataSource?.__editorAutoManual) return dataSource
    const { __editorAutoManual: _editorAutoManual, mode: _mode, ...rest } = dataSource
    return rest
  })
}

async function handlePlatformWrite(payload: Record<string, unknown>, requestId?: string) {
  const deviceId = resolveWriteDeviceId(payload)
  const data = payload.data
  if (!deviceId || data === undefined) {
    postPlatformWriteResult(requestId, {
      success: false,
      error: 'Missing deviceId or data'
    })
    return
  }

  try {
    const value = typeof data === 'string' ? data : JSON.stringify(data)
    const fieldId = resolveWriteFieldId(data)
    const fieldType = resolveWriteFieldType(deviceId, fieldId)
    let result: any

    if (fieldType === 'attribute') {
      result = await attributeDataPub({ device_id: deviceId, value })
    } else if (fieldType === 'command') {
      result = await commandDataPub({ device_id: deviceId, value })
    } else if (fieldType === 'telemetry' || fieldType === undefined) {
      if (fieldType === undefined && fieldId) {
        postPlatformWriteResult(requestId, {
          success: false,
          error: `Unable to resolve write field type for '${fieldId}'`
        })
        return
      }
      result = await telemetryDataPub({ device_id: deviceId, value })
    } else {
      postPlatformWriteResult(requestId, {
        success: false,
        error: `Unsupported write field type '${fieldType}'`
      })
      return
    }

    postPlatformWriteResult(requestId, {
      success: true,
      echo: result?.data ?? data
    })
  } catch (error) {
    console.error('[AppFrame] Failed to publish platform write:', error)
    const message = error instanceof Error ? error.message : String(error || 'Platform write failed')
    postPlatformWriteResult(requestId, {
      success: false,
      error: message
    })
  }
}

async function handleHostSave(payload: Record<string, unknown>) {
  const rawConfig = payload.config && typeof payload.config === 'object' ? payload.config : payload
  const config = normalizeDashboardConfig(rawConfig) as Record<string, unknown>
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
    updatePayload.dataSources = sanitizeDataSourcesForHostSave(config.nodes, config.dataSources)
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
        const configId = firstString(config?.id, config?.device_config_id, config?.deviceConfigId)
        const templateId = firstString(
          config?.device_template_id,
          config?.deviceTemplateId,
          config?.template_id,
          config?.templateId
        )
        if (configId && templateId) {
          configTemplateMap.set(configId, templateId)
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

function unwrapDeviceRow(row: any): Record<string, any> {
  return asRecord(row?.device || row?.device_info || row?.deviceInfo || row?.device_data || row?.deviceData || row)
}

function resolveDeviceId(row: any): string | undefined {
  const nestedDevice = row?.device || row?.device_info || row?.deviceInfo || row?.device_data || row?.deviceData
  if (nestedDevice && typeof nestedDevice === 'object') {
    const device = asRecord(nestedDevice)
    return firstString(device.id, device.device_id, device.deviceId)
  }

  return firstString(row?.device_id, row?.deviceId, row?.id)
}

function resolveDeviceName(row: any, deviceId: string): string {
  const device = unwrapDeviceRow(row)
  return firstString(
    device.name,
    device.device_name,
    device.deviceName,
    device.device_number,
    device.deviceNumber,
    row?.device_name,
    row?.deviceName,
    row?.device_number,
    row?.deviceNumber,
    deviceId
  ) as string
}

function resolveDeviceConfigId(row: any): string | undefined {
  const device = unwrapDeviceRow(row)
  return firstString(
    device.device_config_id,
    device.deviceConfigId,
    row?.device_config_id,
    row?.deviceConfigId,
    device.device_config?.id,
    row?.device_config?.id
  )
}

function resolveDeviceTemplateId(row: any, configTemplateMap: Map<string, string> = new Map()): string | undefined {
  const device = unwrapDeviceRow(row)
  const configId = resolveDeviceConfigId(row)
  return firstString(
    device.device_config?.device_template_id,
    device.device_config?.deviceTemplateId,
    row?.device_config?.device_template_id,
    row?.device_config?.deviceTemplateId,
    device.device_template_id,
    device.deviceTemplateId,
    row?.device_template_id,
    row?.deviceTemplateId,
    configId ? configTemplateMap.get(configId) : undefined
  )
}

async function mapPlatformDevicesForGroup(
  rawDevices: any[],
  normalizedGroupId: string,
  groupName: string
): Promise<PlatformDeviceEntry[]> {
  return rawDevices
    .map((row: any): PlatformDeviceEntry | null => {
      const deviceId = resolveDeviceId(row)
      if (!deviceId) return null
      const deviceConfigId = resolveDeviceConfigId(row)
      const templateId = resolveDeviceTemplateId(row)

      return {
        deviceId,
        deviceName: resolveDeviceName(row, deviceId),
        groupId: normalizedGroupId,
        groupName,
        ...(deviceConfigId ? { deviceConfigId } : {}),
        ...(templateId ? { templateId } : {}),
        fields: [],
        presets: []
      }
    })
    .filter((item): item is PlatformDeviceEntry => Boolean(item))
}

async function buildFallbackPlatformDevicesForDefaultGroup(
  normalizedGroupId: string,
  groupName: string,
  groups: PlatformDeviceGroupEntry[]
): Promise<PlatformDeviceEntry[]> {
  const rootGroups = groups.filter(group => !group.parentId || String(group.parentId) === '0')
  if (rootGroups.length !== 1 || rootGroups[0]?.groupId !== normalizedGroupId) {
    return []
  }

  const deviceRes = await deviceList({ page: 1, page_size: EDITOR_GROUP_DEVICE_PAGE_SIZE })
  const rawDevices = unwrapList(deviceRes?.data)

  return mapPlatformDevicesForGroup(rawDevices, normalizedGroupId, groupName)
}

async function buildUngroupedPlatformDevices(): Promise<PlatformDeviceEntry[]> {
  const deviceRes = await deviceList({ page: 1, page_size: EDITOR_GROUP_DEVICE_PAGE_SIZE })
  const rawDevices = unwrapList(deviceRes?.data)

  return mapPlatformDevicesForGroup(rawDevices, '__ungrouped__', '未分组设备')
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
      const [deviceRes, groups] = await Promise.all([
        deviceListByGroup({ group_id: normalizedGroupId, page: 1, page_size: EDITOR_GROUP_DEVICE_PAGE_SIZE }),
        buildPlatformDeviceGroups()
      ])

      const groupName =
        groups.find(group => group.groupId === normalizedGroupId)?.groupName ||
        normalizeEditorGroupName(undefined, normalizedGroupId)

      const relationDevices = unwrapList(deviceRes?.data)
      const devices =
        relationDevices.length > 0
          ? await mapPlatformDevicesForGroup(relationDevices, normalizedGroupId, groupName)
          : await buildFallbackPlatformDevicesForDefaultGroup(normalizedGroupId, groupName, groups)

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
async function doInit(): Promise<boolean> {
  if (!iframeRef.value?.contentWindow || !token.value || !props.id) return false

  const initSignature = JSON.stringify({
    id: props.id,
    mode: props.mode,
    token: token.value,
    url: url.value
  })

  const thingsvisApiBaseUrl = window.location.origin + '/thingsvis-api'
  const platformApiBaseUrl = getDemoServerUrl()
  const platformToken = localStg.get('token') as string | undefined

  let dashboardPayload: Record<string, unknown> = { meta: { id: props.id } }

  try {
    const dashboardData = hasCompleteDashboardSchema(props.schema)
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
      const nodes = Array.isArray(data.nodes) ? data.nodes : []
      dashboardPayload = normalizeDashboardConfig({
        meta: {
          id: data.id,
          name: data.name,
          thumbnail: data.thumbnail
        },
        canvas: data.canvasConfig,
        nodes,
        dataSources: sanitizeDataSourcesForHostSave(nodes, data.dataSources)
      })
    } else if (!dashboardData) {
      console.warn('[AppFrame] Dashboard preload unavailable, deferring init:', props.id, error)
      return false
    }
  } catch (error) {
    console.warn('[AppFrame] Failed to preload dashboard schema for embed init:', props.id, error)
    return false
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
  const runtimeDeviceId = activePlatformDevices.size === 1 ? Array.from(activePlatformDevices.keys())[0] : undefined

  iframeRef.value.contentWindow.postMessage(
    {
      type: 'tv:init',
      payload: {
        platformBufferSize,
        data: dashboardPayload,
        config: {
          mode: 'app',
          saveTarget: 'host',
          token: token.value,
          ...(platformToken ? { platformToken } : {}),
          thingsvisApiBaseUrl,
          platformApiBaseUrl,
          ...(runtimeDeviceId ? { deviceId: runtimeDeviceId } : {})
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

  lastInitCompletedSignature = initSignature
  initRetryAttempt = 0
  if (pendingInitRetryTimer) {
    clearTimeout(pendingInitRetryTimer)
    pendingInitRetryTimer = null
  }
  return true
}

function scheduleInit(delay = 150) {
  if (!iframeRef.value?.contentWindow || !token.value || !props.id) return

  const nextSignature = JSON.stringify({
    id: props.id,
    mode: props.mode,
    token: token.value,
    url: url.value
  })

  if (!initInProgress && nextSignature === lastInitCompletedSignature) {
    return
  }

  if (pendingInitDebounceTimer) clearTimeout(pendingInitDebounceTimer)

  const runInit = async () => {
    if (initInProgress) return
    if (nextSignature === lastInitCompletedSignature) return
    initInProgress = true
    try {
      const initialized = await doInit()
      if (!initialized && iframeRef.value?.contentWindow && token.value && props.id) {
        const retryDelay = Math.min(4000, 400 * 2 ** initRetryAttempt)
        initRetryAttempt += 1
        if (pendingInitRetryTimer) clearTimeout(pendingInitRetryTimer)
        pendingInitRetryTimer = setTimeout(() => {
          pendingInitRetryTimer = null
          scheduleInit(retryDelay)
        }, retryDelay)
      }
    } finally {
      initInProgress = false
    }
  }

  pendingInitDebounceTimer = setTimeout(() => {
    pendingInitDebounceTimer = null
    void runInit()
  }, delay)
}

function handleIframeLoad() {
  initInProgress = false
  lastInitCompletedSignature = ''
  initRetryAttempt = 0
}

const handleMessage = async (event: MessageEvent) => {
  if (!event.data || typeof event.data !== 'object') return
  if (event.origin !== getThingsVisTargetOrigin()) return

  const { type, projectId } = event.data
  const requestId = typeof event.data.requestId === 'string' ? event.data.requestId : undefined
  const payload = event.data?.payload && typeof event.data.payload === 'object' ? event.data.payload : {}

  if (type === 'tv:save') {
    await handleHostSave(payload)
    return
  }

  if (type === 'tv:platform-write') {
    await handlePlatformWrite(payload, requestId)
    return
  }

  if (type === 'thingsvis:requestFieldData') {
    if (!iframeRef.value?.contentWindow) return

    try {
      const fieldIds = Array.isArray((payload as any).fieldIds) ? (payload as any).fieldIds : []
      const requestedDeviceId = typeof (payload as any).deviceId === 'string' ? (payload as any).deviceId : undefined
      const deviceId = requestedDeviceId

      if (deviceId && !activePlatformDevices.has(deviceId)) {
        activePlatformDevices.set(deviceId, { deviceId, fields: [] })
      }
      ensureDeviceWs(deviceId)
      ensureDeviceStatusWs(deviceId)
      const fields = await buildRequestedFieldData(fieldIds, deviceId)
      postPlatformData(fields, deviceId)
    } catch {
      // Best effort only: ignore transient field-request failures to avoid console noise.
    }
    return
  }

  if (type === 'thingsvis:requestDeviceGroups') {
    try {
      const groups = await buildPlatformDeviceGroups()
      postToThingsVis('tv:device-groups', { groups })
    } catch (error) {
      console.warn('[AppFrame] Failed to load requested device groups:', error)
      postToThingsVis('tv:device-groups', { groups: [] })
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
    const directTemplateId = typeof (payload as any).templateId === 'string' ? (payload as any).templateId : undefined
    const deviceConfigId = typeof (payload as any).deviceConfigId === 'string' ? (payload as any).deviceConfigId : undefined
    if (!iframeRef.value?.contentWindow || !deviceId) return

    try {
      let templateId = directTemplateId
      if (!templateId && deviceConfigId) {
        templateId = (await loadDeviceConfigTemplateMap()).get(deviceConfigId)
      }
      if (!templateId) {
        postToThingsVis('tv:device-fields', {
          deviceId,
          templateId: '',
          fields: []
        })
        return
      }

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
  if (pendingInitRetryTimer) clearTimeout(pendingInitRetryTimer)
  resetViewerHydrationState()
  lastInitCompletedSignature = ''
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

</style>
