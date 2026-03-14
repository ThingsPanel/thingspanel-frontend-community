<script setup lang="ts">
/**
 * ThingsVis Viewer Component
 * 纯预览组件，直接嵌入 ThingsVis 的 /embed 路由
 * 不含任何编辑器 UI，只渲染仪表板
 */

import { ref, onMounted, onBeforeUnmount, watch, computed } from 'vue'
import { NSpin } from 'naive-ui'
import { getThingsVisToken } from '@/utils/thingsvis'
import {
  deviceList,
  telemetryDataCurrent,
  getAttributeDataSet,
  telemetryDataHistoryList
} from '@/service/api/device'
import { getOnlineDeviceTrend } from '@/service/api'
import { localStg } from '@/utils/storage'
import { getWebsocketServerUrl } from '@/utils/common/tool'

interface Props {
  /** 仪表板配置数据 */
  config: any
  /** iframe高度 */
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

type HistoryPoint = { value: unknown; ts: number }
type RequestedFieldResult = {
  fields: Record<string, unknown>
  histories: Array<{ fieldId: string; history: HistoryPoint[]; deviceId?: string }>
}

interface DeviceWsEntry {
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

const FIELD_BINDING_EXPR_RE = /^\{\{\s*ds\.([^.\s]+)\.data(?:\.(.+?))?\s*\}\}$/

// iframe 引用
const iframeRef = ref<HTMLIFrameElement>()
const loading = ref(true)
const ready = ref(false)
const error = ref<string | null>(null)
const token = ref<string | null>(null)
const deviceWsMap = new Map<string, DeviceWsEntry>()

function normalizeHistory(records: any[], valueKey: string): HistoryPoint[] {
  return records
    .map((item: any) => ({
      value: item?.[valueKey] ?? item?.value ?? item?.avg ?? item?.y ?? 0,
      ts: new Date(item?.timestamp || item?.time || item?.x || item?.ts || Date.now()).getTime()
    }))
    .filter((point) => !Number.isNaN(point.ts))
}

function normalizeDeviceTotalHistory(records: any[]): HistoryPoint[] {
  return records
    .map((item: any) => ({
      value: Number(item?.device_online ?? 0) + Number(item?.device_offline ?? 0),
      ts: new Date(item?.timestamp || item?.time || item?.x || item?.ts || Date.now()).getTime()
    }))
    .filter((point) => !Number.isNaN(point.ts))
}

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
        win.postMessage({ type: 'tv:platform-data', payload: { fields: rawFields } }, '*')
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

function disconnectAllDeviceWs() {
  for (const entry of deviceWsMap.values()) {
    entry.destroyed = true
    if (entry.pingTimer) clearInterval(entry.pingTimer)
    if (entry.reconnectTimer) clearTimeout(entry.reconnectTimer)
    entry.ws?.close()
  }
  deviceWsMap.clear()
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
  let globalHydrated = false

  for (const descriptor of descriptors) {
    const requestedFields = descriptor.requestedFields

    if (descriptor.deviceId) {
      if (handledDeviceIds.has(descriptor.deviceId)) continue
      handledDeviceIds.add(descriptor.deviceId)

      ensureDeviceWs(descriptor.deviceId)

      let result: RequestedFieldResult
      if (requestedFields.length > 0) {
        result = await buildRequestedFieldData(requestedFields, descriptor.deviceId)
      } else {
        result = {
          fields: await fetchAllCurrentFieldsForDevice(descriptor.deviceId),
          histories: []
        }
      }

      if (Object.keys(result.fields).length > 0) {
        win.postMessage(
          { type: 'tv:platform-data', payload: { deviceId: descriptor.deviceId, fields: result.fields } },
          '*'
        )
        win.postMessage(
          { type: 'tv:platform-data', payload: { fields: result.fields } },
          '*'
        )
      }

      result.histories.forEach((item) => {
        win.postMessage(
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
      continue
    }

    if (globalHydrated) continue
    globalHydrated = true

    const fallbackGlobalFields = requestedFields.length > 0
      ? requestedFields
      : ['device_total', 'device_online', 'device_offline', 'device_activity']
    const result = await buildRequestedFieldData(fallbackGlobalFields)
    if (Object.keys(result.fields).length > 0) {
      win.postMessage(
        { type: 'tv:platform-data', payload: { fields: result.fields } },
        '*'
      )
    }

    result.histories.forEach((item) => {
      win.postMessage(
        {
          type: 'tv:platform-history',
          payload: {
            fieldId: item.fieldId,
            history: item.history
          }
        },
        '*'
      )
    })
  }
}

async function buildRequestedFieldData(fieldIds: unknown[], deviceId?: string): Promise<RequestedFieldResult> {
  const requestedFields = Array.isArray(fieldIds)
    ? fieldIds.filter((fieldId): fieldId is string => typeof fieldId === 'string')
    : []

  if (requestedFields.length === 0) {
    return { fields: {}, histories: [] }
  }

  const currentFieldIds = requestedFields.filter((fieldId) => !fieldId.endsWith('__history'))
  const historyFieldIds = requestedFields
    .filter((fieldId) => fieldId.endsWith('__history'))
    .map((fieldId) => fieldId.replace(/__history$/, ''))

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

      currentFieldIds.forEach((fieldId) => {
        if (kvMap[fieldId] !== undefined) result.fields[fieldId] = kvMap[fieldId]
      })
    }

    if (historyFieldIds.length > 0) {
      const historyResults = await Promise.allSettled(
        historyFieldIds.map(async (fieldId) => {
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

      historyResults.forEach((item) => {
        if (item.status === 'rejected') {
          console.warn('[ThingsVisViewer] Device history fetch failed:', item.reason)
        }
      })
    }

    return result
  }

  const result: RequestedFieldResult = { fields: {}, histories: [] }
  const devRes = await deviceList({ page: 1, page_size: 1000 })
  const devices = devRes?.data?.list || devRes?.data || []
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

  currentFieldIds.forEach((fieldId) => {
    if (aggregateValues[fieldId] !== undefined) result.fields[fieldId] = aggregateValues[fieldId]
  })

  if (historyFieldIds.some((fieldId) => ['device_online', 'device_offline', 'device_total'].includes(fieldId))) {
    const trendRes = await getOnlineDeviceTrend()
    const trendData = trendRes?.data as { points?: unknown[] } | undefined
    const points = Array.isArray(trendData?.points) ? trendData.points : []

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
  }

  return result
}

/**
 * 获取 ThingsVis Embed URL
 */
const embedUrl = computed(() => {
  // 基础 URL - 直接指向 /embed 路由
  const baseUrl = import.meta.env.VITE_THINGSVIS_STUDIO_URL || 'http://localhost:3000/main.html'

  // 移除可能存在的 hash 部分
  const cleanBase = baseUrl.split('#')[0]

  // 确保以 .html 结尾
  const htmlBase = cleanBase.endsWith('.html')
    ? cleanBase
    : cleanBase.endsWith('/main')
      ? cleanBase + '.html'
      : cleanBase

  // 构建 embed URL
  // apiBaseUrl 必须写入 URL，以便 Studio 在 postMessage 到达前就能路由 API 请求
  const apiBase = encodeURIComponent(window.location.origin + '/thingsvis-api')
  return `${htmlBase}#/embed?apiBaseUrl=${apiBase}`
})

/**
 * 处理来自 iframe 的消息
 */
const handleMessage = (event: MessageEvent) => {
  const { data } = event

  if (!data || typeof data !== 'object') return

  if (data.type === 'thingsvis:requestFieldData') {
    if (!iframeRef.value?.contentWindow) return

    const payload = data.payload || {}
    ensureDeviceWs(payload.deviceId)

    void buildRequestedFieldData(payload.fieldIds, payload.deviceId)
      .then((result) => {
        const win = iframeRef.value?.contentWindow
        if (!win) return

        if (Object.keys(result.fields).length > 0) {
          win.postMessage(
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
            win.postMessage(
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

        result.histories.forEach((item) => {
          win.postMessage(
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
      })
      .catch(() => {
        // Best effort only.
      })
    return
  }

  // EmbedPage 就绪
  if (data.type === 'READY') {
    console.log('[ThingsVisViewer] EmbedPage 已就绪')
    ready.value = true
    loading.value = false

    // 2. 发送仪表板数据
    sendConfig()
    emit('ready')
  }

  // 加载完成
  if (data.type === 'LOADED') {
    console.log('[ThingsVisViewer] 仪表板加载完成:', data.payload)
    void hydrateConfiguredPlatformSources()
  }

  // 加载错误
  if (data.type === 'ERROR') {
    console.error('[ThingsVisViewer] 加载错误:', data.payload)
    error.value = data.payload
    emit('error', data.payload)
  }
}

/**
 * 发送配置到 EmbedPage
 */
const sendConfig = () => {
  if (!iframeRef.value?.contentWindow || !props.config) {
    console.warn('[ThingsVisViewer] 无法发送配置: iframe 或 config 不可用')
    return
  }

  try {
    // 深拷贝避免响应式数据问题
    const pureConfig = JSON.parse(JSON.stringify(props.config))
    const apiBaseUrl = window.location.origin + '/thingsvis-api'

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
        apiBaseUrl: apiBaseUrl,
        mode: 'viewer',
        saveTarget: 'host'
      }
    }, '*')
  } catch (e) {
    console.error('[ThingsVisViewer] 配置序列化失败:', e)
    error.value = '配置数据无效'
    emit('error', '配置数据无效')
  }
}

/**
 * iframe 加载完成
 */
const handleIframeLoad = () => {
  console.log('[ThingsVisViewer] iframe onload')
  // 等待 READY 消息
}

// 监听配置变化，重新发送
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

  // 获取 Token
  try {
    token.value = await getThingsVisToken()
  } catch (e) {
    console.warn('[ThingsVisViewer] Token 获取失败', e)
  }

  // 增加连接超时检测
  setTimeout(() => {
    if (loading.value && !ready.value) {
      console.warn('[ThingsVisViewer] Editor connection timeout')
      error.value = '连接编辑器超时，请检查服务是否启动'
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
        <p class="error-message">⚠️ {{ error }}</p>
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
