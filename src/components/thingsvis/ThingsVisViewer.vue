<script setup lang="ts">
/**
 * ThingsVis Viewer Component
 * 绾瑙堢粍浠讹紝鐩存帴宓屽叆 ThingsVis 鐨?/embed 璺敱
 * 涓嶅惈浠讳綍缂栬緫鍣?UI锛屽彧娓叉煋浠〃鏉?
 */

import { ref, onMounted, onBeforeUnmount, watch, computed } from 'vue'
import { NSpin } from 'naive-ui'
import { getThingsVisToken } from '@/utils/thingsvis'
import {
  telemetryDataCurrent,
  getAttributeDataSet
} from '@/service/api/device'
import { localStg } from '@/utils/storage'
import { getWebsocketServerUrl } from '@/utils/common/tool'

interface Props {
  /** 浠〃鏉块厤缃暟鎹?*/
  config: any
  /** iframe楂樺害 */
  height?: string
}

const props = withDefaults(defineProps<Props>(), {
  height: '100%'
})

const emit = defineEmits<{
  (e: 'ready'): void
  (e: 'error', error: string): void
}>()

const PING_INTERVAL_MS = 8_000
const WS_RECONNECT_DELAY_MS = 3_000

interface DeviceWsEntry {
  ws: WebSocket | null
  pingTimer: ReturnType<typeof setInterval> | null
  reconnectTimer: ReturnType<typeof setTimeout> | null
  destroyed: boolean
  deviceId: string
}

interface DeviceStatusWsEntry {
  ws: WebSocket | null
  pingTimer: ReturnType<typeof setInterval> | null
  reconnectTimer: ReturnType<typeof setTimeout> | null
  destroyed: boolean
  deviceId: string
}

type PlatformSourceDescriptor = {
  id: string
  deviceId?: string
  requestedFields: string[]
}

/** 缁勪欢 timeRangePreset 鈫?API time_range + aggregate_window 鏄犲皠 */
const FIELD_BINDING_EXPR_RE = /^\{\{\s*ds\.([^.\s]+)\.data(?:\.(.+?))?\s*\}\}$/

// iframe 寮曠敤
const iframeRef = ref<HTMLIFrameElement>()
const loading = ref(true)
const ready = ref(false)
const error = ref<string | null>(null)
const token = ref<string | null>(null)
const deviceWsMap = new Map<string, DeviceWsEntry>()
const deviceStatusWsMap = new Map<string, DeviceStatusWsEntry>()

function extractWsFields(payload: unknown): Record<string, unknown> {
  if (!payload || typeof payload !== 'object') return {}
  const obj = payload as Record<string, unknown>

  if (obj.fields && typeof obj.fields === 'object' && !Array.isArray(obj.fields)) {
    return extractWsFields(obj.fields)
  }
  if (obj.data !== undefined) return extractWsFields(obj.data)
  if (obj.payload !== undefined) return extractWsFields(obj.payload)

  if (Array.isArray(payload)) {
    const fields: Record<string, unknown> = {}
    ;(payload as Array<{ key?: string; label?: string; value?: unknown }>).forEach(item => {
      if (!item) return
      const key = item.key ?? item.label
      if (!key || key === 'systime') return
      if (item.value !== undefined) fields[key] = item.value
    })
    return fields
  }

  const fields: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(obj)) {
    if (key !== 'systime') fields[key] = value
  }
  return fields
}

function connectDeviceWs(deviceId: string) {
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
    deviceId
  }
  deviceWsMap.set(deviceId, entry)

  function openWs() {
    if (entry.destroyed) return

    const accessToken = localStg.get('token') as string | undefined
    if (!accessToken) {
      entry.reconnectTimer = setTimeout(openWs, WS_RECONNECT_DELAY_MS)
      return
    }

    try {
      entry.ws = new WebSocket(`${getWebsocketServerUrl()}/telemetry/datas/current/ws`)
    } catch (err) {
      console.warn('[ThingsVisViewer] WS init failed for device', deviceId, err)
      entry.reconnectTimer = setTimeout(openWs, WS_RECONNECT_DELAY_MS)
      return
    }

    entry.ws.onopen = () => {
      if (!entry.ws) return
      entry.ws.send(JSON.stringify({ device_id: deviceId, token: accessToken }))
      entry.pingTimer = setInterval(() => {
        if (entry.ws?.readyState === WebSocket.OPEN) entry.ws.send('ping')
      }, PING_INTERVAL_MS)
    }

    entry.ws.onmessage = evt => {
      if (typeof evt.data !== 'string' || evt.data === 'pong') return
      try {
        const rawFields = extractWsFields(JSON.parse(evt.data))
        if (Object.keys(rawFields).length === 0) return
        const win = iframeRef.value?.contentWindow
        if (!win) return
        win.postMessage({ type: 'tv:platform-data', payload: { deviceId, fields: rawFields } }, '*')
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

    const accessToken = localStg.get('token') as string | undefined
    if (!accessToken) {
      entry.reconnectTimer = setTimeout(openWs, WS_RECONNECT_DELAY_MS)
      return
    }

    try {
      entry.ws = new WebSocket(`${getWebsocketServerUrl()}/device/online/status/ws`)
    } catch (err) {
      console.warn('[ThingsVisViewer] Status WS init failed for device', deviceId, err)
      entry.reconnectTimer = setTimeout(openWs, WS_RECONNECT_DELAY_MS)
      return
    }

    entry.ws.onopen = () => {
      if (!entry.ws) return
      entry.ws.send(JSON.stringify({ device_id: deviceId, token: accessToken }))
      entry.pingTimer = setInterval(() => {
        if (entry.ws?.readyState === WebSocket.OPEN) entry.ws.send('ping')
      }, PING_INTERVAL_MS)
    }

    entry.ws.onmessage = evt => {
      if (typeof evt.data !== 'string' || evt.data === 'pong') return
      try {
        const msg = JSON.parse(evt.data) as Record<string, unknown>
        if (typeof msg.is_online !== 'number') return
        const win = iframeRef.value?.contentWindow
        if (!win) return
        win.postMessage(
          {
            type: 'tv:platform-data',
            payload: {
              deviceId,
              fields: {
                is_online: msg.is_online,
                online_text: msg.is_online === 1 ? '在线' : '离线',
                online_status_updated_at: Date.now()
              }
            }
          },
          '*'
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
  const existing = deviceWsMap.get(deviceId)
  if (existing && !existing.destroyed) return
  connectDeviceWs(deviceId)
}

function ensureDeviceStatusWs(deviceId?: string) {
  if (!deviceId) return
  const existing = deviceStatusWsMap.get(deviceId)
  if (existing && !existing.destroyed) return
  connectDeviceStatusWs(deviceId)
}

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

function collectRequestedFieldsFromValue(
  value: unknown,
  requests: Map<string, Set<string>>
) {
  if (typeof value === 'string') {
    const match = value.match(FIELD_BINDING_EXPR_RE)
    const dataSourceId = match?.[1]
    const fieldPath = match?.[2]
    if (dataSourceId && fieldPath) {
      const fields = requests.get(dataSourceId) ?? new Set<string>()
      fields.add(fieldPath)
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
          ? dataSource.config.requestedFields.filter((fieldId: unknown): fieldId is string => typeof fieldId === 'string')
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

/**
 * 浠庝华琛ㄦ澘鑺傜偣涓彁鍙栨渶瀹界殑 timeRangePreset锛岀敤浜庡喅瀹氬巻鍙叉煡璇㈣寖鍥淬€?
 * 浼樺厛绾? 30d > 7d > 24h > 6h > 1h > all(榛樿 1h)
 */
async function fetchAllCurrentFieldsForDevice(deviceId: string): Promise<Record<string, unknown>> {
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

  return kvMap
}

async function hydrateConfiguredPlatformSources() {
  const win = iframeRef.value?.contentWindow
  if (!win || !props.config) return

  const descriptors = collectPlatformSourceDescriptors(props.config)
  if (descriptors.length === 0) return

  const handledDeviceIds = new Set<string>()

  for (const descriptor of descriptors) {
    const requestedFields = descriptor.requestedFields
    if (!descriptor.deviceId) continue

    if (handledDeviceIds.has(descriptor.deviceId)) continue
    handledDeviceIds.add(descriptor.deviceId)

    ensureDeviceWs(descriptor.deviceId)
    ensureDeviceStatusWs(descriptor.deviceId)

    const fields = requestedFields.length > 0
      ? await buildRequestedFieldData(requestedFields, descriptor.deviceId)
      : await fetchAllCurrentFieldsForDevice(descriptor.deviceId)
    if (Object.keys(fields).length === 0) continue

    win.postMessage(
      { type: 'tv:platform-data', payload: { deviceId: descriptor.deviceId, fields } },
      '*'
    )
  }
}

async function buildRequestedFieldData(fieldIds: unknown[], deviceId?: string): Promise<Record<string, unknown>> {
  const requestedFields = Array.isArray(fieldIds)
    ? fieldIds.filter((fieldId): fieldId is string => typeof fieldId === 'string')
    : []

  if (!deviceId || requestedFields.length === 0) return {}

  const currentFieldIds = requestedFields.filter((fieldId) => !fieldId.endsWith('__history'))
  if (currentFieldIds.length === 0) return {}

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

  const result: Record<string, unknown> = {}
  currentFieldIds.forEach((fieldId) => {
    if (kvMap[fieldId] !== undefined) result[fieldId] = kvMap[fieldId]
  })
  return result
}
const embedUrl = computed(() => {
  // 鍩虹 URL - 鐩存帴鎸囧悜 /embed 璺敱
  const baseUrl = import.meta.env.VITE_THINGSVIS_STUDIO_URL || 'http://localhost:3000/main.html'

  // 绉婚櫎鍙兘瀛樺湪鐨?hash 閮ㄥ垎
  const cleanBase = baseUrl.split('#')[0]

  // 纭繚浠?.html 缁撳熬
  const htmlBase = cleanBase.endsWith('.html')
    ? cleanBase
    : cleanBase.endsWith('/main')
      ? cleanBase + '.html'
      : cleanBase

  const thingsvisApiBaseUrl = encodeURIComponent(window.location.origin + '/thingsvis-api')
  const platformApiBaseUrl = encodeURIComponent(window.location.origin)
  return `${htmlBase}#/embed?mode=embedded&provider=thingspanel&context=dashboard&thingsvisApiBaseUrl=${thingsvisApiBaseUrl}&platformApiBaseUrl=${platformApiBaseUrl}`
})

/**
 * 澶勭悊鏉ヨ嚜 iframe 鐨勬秷鎭?
 */
const handleMessage = (event: MessageEvent) => {
  const { data } = event

  if (!data || typeof data !== 'object') return

  if (data.type === 'thingsvis:requestFieldData') {
    if (!iframeRef.value?.contentWindow) return

    const payload = data.payload || {}
    ensureDeviceWs(payload.deviceId)
    ensureDeviceStatusWs(payload.deviceId)

    void buildRequestedFieldData(payload.fieldIds, payload.deviceId)
      .then((fields) => {
        const win = iframeRef.value?.contentWindow
        if (!win || Object.keys(fields).length === 0) return

        win.postMessage(
          {
            type: 'tv:platform-data',
            payload: {
              deviceId: payload.deviceId,
              fields
            }
          },
          '*'
        )
      })
      .catch(() => {
        // Best effort only.
      })
    return
  }

  // EmbedPage 灏辩华
  if (data.type === 'READY') {
    console.log('[ThingsVisViewer] EmbedPage ready')
    ready.value = true
    loading.value = false

    // 2. 鍙戦€佷华琛ㄦ澘鏁版嵁
    sendConfig()
    emit('ready')
  }

  // 鍔犺浇瀹屾垚
  if (data.type === 'LOADED') {
    console.log('[ThingsVisViewer] 浠〃鏉垮姞杞藉畬鎴?', data.payload)
    void hydrateConfiguredPlatformSources()
  }

  // 鍔犺浇閿欒
  if (data.type === 'ERROR') {
    console.error('[ThingsVisViewer] 鍔犺浇閿欒:', data.payload)
    error.value = data.payload
    emit('error', data.payload)
  }
}

/**
 * 鍙戦€侀厤缃埌 EmbedPage
 */
const sendConfig = () => {
  if (!iframeRef.value?.contentWindow || !props.config) {
    console.warn('[ThingsVisViewer] Cannot send config: iframe or config unavailable')
    return
  }

  try {
    // 娣辨嫹璐濋伩鍏嶅搷搴斿紡鏁版嵁闂
    const pureConfig = JSON.parse(JSON.stringify(props.config))
    const thingsvisApiBaseUrl = window.location.origin + '/thingsvis-api'
    const platformApiBaseUrl = window.location.origin

    iframeRef.value.contentWindow.postMessage({
      type: 'tv:init',
      data: {
        meta: { id: pureConfig.id, name: pureConfig.name },
        canvas: pureConfig.canvas || pureConfig.canvasConfig,
        nodes: pureConfig.nodes,
        dataSources: pureConfig.dataSources
      },
      config: {
        token: token.value,
        thingsvisApiBaseUrl,
        platformApiBaseUrl,
        mode: 'viewer',
        saveTarget: 'host'
      }
    }, '*')
  } catch (e) {
    console.error('[ThingsVisViewer] 閰嶇疆搴忓垪鍖栧け璐?', e)
    error.value = '閰嶇疆鏁版嵁鏃犳晥'
    emit('error', '閰嶇疆鏁版嵁鏃犳晥')
  }
}

/**
 * iframe 鍔犺浇瀹屾垚
 */
const handleIframeLoad = () => {
  console.log('[ThingsVisViewer] iframe onload')
  // 绛夊緟 READY 娑堟伅
}

// 鐩戝惉閰嶇疆鍙樺寲锛岄噸鏂板彂閫?
watch(
  () => props.config,
  (newConfig) => {
    if (newConfig && ready.value) {
      sendConfig()
    }
  },
  { deep: true }
)

onMounted(async () => {
  window.addEventListener('message', handleMessage)

  // 鑾峰彇 Token
  try {
    token.value = await getThingsVisToken()
  } catch (e) {
    console.warn('[ThingsVisViewer] Token 鑾峰彇澶辫触', e)
  }

  // 澧炲姞杩炴帴瓒呮椂妫€娴?
  setTimeout(() => {
    if (loading.value && !ready.value) {
      console.warn('[ThingsVisViewer] Editor connection timeout')
      error.value = 'Editor connection timeout'
      loading.value = false
    }
  }, 15000)
})

onBeforeUnmount(() => {
  window.removeEventListener('message', handleMessage)
  disconnectAllDeviceWs()
})
</script>

<template>
  <div class="thingsvis-viewer-wrapper">
    <NSpin :show="loading">
      <!-- Error state -->
      <div v-if="error" class="error-state">
        <p class="error-message">鈿狅笍 {{ error }}</p>
      </div>

      <!-- Viewer iframe -->
      <iframe
        v-else
        ref="iframeRef"
        :src="embedUrl"
        class="thingsvis-iframe"
        :class="{ visible: ready }"
        :style="{ height }"
        frameborder="0"
        @load="handleIframeLoad"
      />
    </NSpin>
  </div>
</template>

<style scoped lang="scss">
.thingsvis-viewer-wrapper {
  width: 100%;
  height: 100%;
  position: relative;
}

:deep(.n-spin-container) {
  height: 100%;
}

:deep(.n-spin-content) {
  height: 100%;
}

.thingsvis-iframe {
  width: 100%;
  height: 100%;
  border: none;
  background: #f5f5f5;
  display: block;
  opacity: 0;
  transition: opacity 0.3s ease-in;

  &.visible {
    opacity: 1;
  }
}

.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 20px;
  background: #f5f5f5;

  .error-message {
    color: #d32f2f;
    font-size: 14px;
    text-align: center;
  }
}
</style>
