<template>
  <div class="thingsvis-widget-container" ref="container"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { ThingsVisClient } from '@/utils/thingsvis/sdk/client'
import { telemetryDataPub } from '@/service/api/device'

const props = defineProps<{
  /** Initial configuration (JSON page schema) */
  config: any
  /** Optional: real-time data pushed by the host */
  data?: Record<string, any>
  /** Optional: platform field schema forwarded to the ThingsVis editor */
  platformFields?: any[]
  /** Optional: device entries forwarded to the ThingsVis editor (enables Device Fields in Field Picker) */
  platformDevices?: any[]
  /** Optional: iframe height */
  height?: string
  /** Render mode: 'viewer' (read-only preview) | 'editor' (visual editor) */
  mode?: 'viewer' | 'editor'
  /** Optional: current device ID — used to route tv:platform-write back to the platform API */
  deviceId?: string
  /**
   * Optional: ring buffer capacity for the __platform__ data source.
   * 0 = keep only the latest value (default, suitable for gauge / status widgets).
   * > 0 = keep the last N values and expose `{fieldId}__history` for line / area chart widgets.
   */
  bufferSize?: number
}>()

const emit = defineEmits<{
  (e: 'save', config: any): void
  (e: 'change', config: any): void
  (e: 'ready'): void
}>()

const container = ref<HTMLElement | null>(null)
let client: ThingsVisClient | null = null

const getPreviewDeviceId = () => {
  if (typeof props.deviceId === 'string' && props.deviceId.trim()) return props.deviceId

  if (props.platformDevices?.length === 1) {
    const deviceId = props.platformDevices[0]?.deviceId
    if (typeof deviceId === 'string' && deviceId.trim()) return deviceId
  }

  return undefined
}

const isPlatformFieldDataSource = (dataSource: any) => {
  const type = typeof dataSource?.type === 'string' ? dataSource.type.toUpperCase() : ''
  return type === 'PLATFORM_FIELD' || type === 'PLATFORM'
}

const normalizeViewerPlatformDataSources = (config: any) => {
  if (!config || props.mode !== 'viewer' || !Array.isArray(config.dataSources)) return config

  const previewDeviceId = getPreviewDeviceId()
  if (!previewDeviceId) return config

  return {
    ...config,
    dataSources: config.dataSources.map((dataSource: any) => {
      if (!isPlatformFieldDataSource(dataSource)) return dataSource
      if (dataSource?.config?.deviceId) return dataSource

      return {
        ...dataSource,
        config: {
          ...(dataSource.config || {}),
          deviceId: previewDeviceId
        }
      }
    })
  }
}

const buildRequestedFieldData = (fieldIds: string[]) => {
  const currentData = props.data
  if (!fieldIds.length || !currentData) return {}

  return fieldIds.reduce<Record<string, unknown>>((acc, fieldId) => {
    if (Object.prototype.hasOwnProperty.call(currentData, fieldId)) {
      acc[fieldId] = currentData[fieldId]
    }
    return acc
  }, {})
}

function normalizeViewerConfig(config: any) {
  if (!config || props.mode !== 'viewer') return config

  const platformNormalizedConfig = normalizeViewerPlatformDataSources(config)

  const canvas = platformNormalizedConfig.canvas || platformNormalizedConfig.canvasConfig
  if (!canvas || canvas.mode !== 'infinite') return platformNormalizedConfig

  const nodes = Array.isArray(platformNormalizedConfig.nodes) ? platformNormalizedConfig.nodes : []
  const positionedNodes = nodes.filter((node: any) => {
    return [node?.x, node?.y, node?.width, node?.height].every((value) => typeof value === 'number')
  })

  if (positionedNodes.length === 0) {
    return {
      ...platformNormalizedConfig,
      canvas: {
        ...canvas,
        scaleMode: canvas.scaleMode || 'fit-min'
      }
    }
  }

  const padding = 48
  const minX = Math.min(...positionedNodes.map((node: any) => node.x))
  const minY = Math.min(...positionedNodes.map((node: any) => node.y))
  const maxX = Math.max(...positionedNodes.map((node: any) => node.x + node.width))
  const maxY = Math.max(...positionedNodes.map((node: any) => node.y + node.height))

  const offsetX = padding - minX
  const offsetY = padding - minY

  return {
    ...platformNormalizedConfig,
    canvas: {
      ...canvas,
      width: Math.max(canvas.width || 0, Math.ceil(maxX - minX + padding * 2)),
      height: Math.max(canvas.height || 0, Math.ceil(maxY - minY + padding * 2)),
      scaleMode: canvas.scaleMode || 'fit-min'
    },
    nodes: nodes.map((node: any) => {
      if ([node?.x, node?.y].every((value) => typeof value === 'number')) {
        return {
          ...node,
          x: node.x + offsetX,
          y: node.y + offsetY
        }
      }
      return node
    })
  }
}

const getLoadOptions = () => ({
  platformBufferSize: props.bufferSize ?? 0,
  platformDevices: clone(props.platformDevices || [])
})

const pushPlatformFieldDataCompat = (fields: Record<string, unknown>, deviceId?: string) => {
  if (!client) return
  const payload = clone(fields) || {}
  client.pushPlatformFieldData(payload, deviceId)
  // Backward compatibility: some saved templates still bind to the global __platform__
  // datasource, which only accepts messages without deviceId.
  if (deviceId) {
    client.pushPlatformFieldData(payload)
  }
}

const pushFieldHistoryCompat = (
  fieldId: string,
  history: Array<{ value: unknown; ts: number }>,
  deviceId?: string
) => {
  if (!client) return
  const payload = clone(history) || []
  client.pushFieldHistory(fieldId, payload, deviceId)
  if (deviceId) {
    client.pushFieldHistory(fieldId, payload)
  }
}

/**
 * Handle tv:platform-write messages posted by the embedded ThingsVis iframe.
 * Routes the write payload to the ThingsPanel telemetry publish API.
 */
const handlePlatformWrite = async (event: MessageEvent) => {
  if (event.data?.type !== 'tv:platform-write') return
  const writePayload = event.data?.payload as { dataSourceId?: string; data?: unknown } | undefined
  const { dataSourceId, data } = writePayload ?? {}
  if (!dataSourceId || data === undefined) return
  if (!props.deviceId) {
    console.warn('[ThingsVisWidget] tv:platform-write received but deviceId prop is not set')
    return
  }
  try {
    // API expects `value` as a JSON string, not a raw object under `datas`.
    const valueStr = typeof data === 'string' ? data : JSON.stringify(data)
    await telemetryDataPub({ device_id: props.deviceId, value: valueStr })
  } catch (e) {
    console.error('[ThingsVisWidget] telemetryDataPub failed for tv:platform-write:', e)
  }
}

const handleFieldDataRequest = (event: MessageEvent) => {
  if (event.data?.type !== 'thingsvis:requestFieldData') return

  const payload = event.data?.payload as { deviceId?: string; fieldIds?: string[] } | undefined
  const fieldIds = Array.isArray(payload?.fieldIds) ? payload.fieldIds.filter((fieldId): fieldId is string => typeof fieldId === 'string') : []
  if (fieldIds.length === 0) return

  const previewDeviceId = getPreviewDeviceId()
  if (payload?.deviceId && previewDeviceId && payload.deviceId !== previewDeviceId) return

  const fields = buildRequestedFieldData(fieldIds)
  if (Object.keys(fields).length === 0) return

  pushPlatformFieldDataCompat(fields, payload?.deviceId || previewDeviceId)
}

// 辅助函数: 深拷贝以去除 Vue Proxy，防止 DataCloneError
const clone = (obj: any) => {
  if (!obj) return null
  try {
    return JSON.parse(JSON.stringify(obj))
  } catch (e) {
    console.error('JSON clone failed:', e)
    return {}
  }
}

import { getThingsVisToken } from '@/utils/thingsvis'

// 初始化客户端
onMounted(async () => {
  if (!container.value) return

  // Register platform-write listener for the lifetime of this component instance.
  window.addEventListener('message', handlePlatformWrite)
  window.addEventListener('message', handleFieldDataRequest)

  // 从环境变量读取 ThingsVis Studio URL
  let baseUrl = import.meta.env.VITE_THINGSVIS_STUDIO_URL || 'http://localhost:3000/main'
  // 移除可能的 hash 部分
  const hashIdx = baseUrl.indexOf('#')
  if (hashIdx !== -1) baseUrl = baseUrl.substring(0, hashIdx)

  // 获取 Token 以便 URL 优先鉴权
  let token = ''
  try {
    token = (await getThingsVisToken()) || ''
  } catch (error) {
    console.error('[ThingsVisWidget] getThingsVisToken failed, continuing without URL token:', error)
  }
  const tokenParams = token ? `&token=${token}` : ''

  // 追加 saveTarget=host，告知 Editor 进入宿主托管模式
  const targetUrl =
    props.mode === 'editor'
      ? `${baseUrl}#/editor?mode=embedded&saveTarget=host${tokenParams}`
      : `${baseUrl}#/embed?mode=embedded&saveTarget=host${tokenParams}`

  client = new ThingsVisClient({
    container: container.value,
    mode: 'widget', // 始终是 widget 模式 (数据透传)
    url: targetUrl,
    style: {
      height: props.height || '100%',
      minHeight: '400px'
    }
  })

  // Client Ready 时，发送初始数据
  // NOTE: loadWidgetConfig (tv:init) MUST be called before emit('ready') so that
  // when the parent's onVisReady fires and pushes platform-data, the PlatformFieldAdapter
  // is already being set up in the iframe (tv:init triggers datasource registration).
  client.on('ready', () => {
    if (props.config) client?.loadWidgetConfig(
      normalizeViewerConfig(clone(props.config)),
      clone(props.platformFields || []),
      getLoadOptions()
    )
    if (props.platformFields) client?.updateSchema(clone(props.platformFields))
    if (props.data) pushPlatformFieldDataCompat(props.data, props.deviceId)
    emit('ready')
  })

  // 监听保存 (Guest -> Host)
  client.on('tv:save-config', (payload: any) => {
    // 兼容两种 payload 格式:
    // 1. triggerSave 路径: payload = { canvas, nodes, dataBindings, thumbnail, meta }
    // 2. request-save 路径: payload = { config: { meta, canvas, nodes, dataSources } }
    const config = payload?.config || payload
    emit('save', config)
    emit('change', config)
  })
})

// 响应式监听配置变化
watch(
  () => props.config,
  newVal => {
    if (client?.ready && newVal) {
      client.loadWidgetConfig(
        normalizeViewerConfig(clone(newVal)),
        clone(props.platformFields || []),
        getLoadOptions()
      )
    }
  },
  { deep: true }
)

// 响应式监听数据变化
watch(
  () => props.data,
  newVal => {
    if (client?.ready && newVal) {
      pushPlatformFieldDataCompat(newVal, props.deviceId)
    }
  },
  { deep: true }
)

// 响应式监听 Schema 变化
watch(
  () => props.platformFields,
  newVal => {
    if (client?.ready && newVal) {
      client.updateSchema(clone(newVal))
    }
  },
  { deep: true }
)

// 主动触发保存 (Host -> Guest -> Host:save)
const triggerSave = () => {
  client?.requestSave()
}

/**
 * Bulk-fill the ring buffer for one platform field with historical records.
 * Delegates to ThingsVisClient.pushFieldHistory(); no-op when client is not ready.
 */
const pushHistory = (fieldId: string, history: Array<{ value: unknown; ts: number }>, deviceId?: string) => {
  pushFieldHistoryCompat(fieldId, history, deviceId)
}

/**
 * Forward a real-time field value batch to the embedded ThingsVis widget.
 * Uses closure reference to `client` so it always reflects the live instance,
 * unlike the exposed `client` property which is snapshotted as null at setup time.
 */
const pushPlatformData = (fields: Record<string, unknown>, deviceId?: string) => {
  pushPlatformFieldDataCompat(fields, deviceId)
}

onBeforeUnmount(() => {
  window.removeEventListener('message', handlePlatformWrite)
  window.removeEventListener('message', handleFieldDataRequest)
  if (client) {
    client.destroy()
    client = null
  }
})

defineExpose({
  triggerSave,
  client,
  pushHistory,
  pushPlatformData,
})
</script>

<style scoped>
.thingsvis-widget-container {
  width: 100%;
  min-height: 100%;
  position: relative;
  /* 不设 overflow:hidden，避免截断内容 */
  overflow: auto;
  /* 确保有最小高度，否则iframe可能塌陷 */
  min-height: 400px;
}
</style>
