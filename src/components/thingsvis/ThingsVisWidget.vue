<template>
  <div class="thingsvis-widget-container" ref="container"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { ThingsVisClient } from '@/utils/thingsvis/sdk/client'
import { attributeDataPub, commandDataPub, telemetryDataPub } from '@/service/api/device'

const FIELD_BINDING_EXPR_RE = /^\{\{\s*ds\.([^.\s]+)\.data(?:\.(.+?))?\s*\}\}$/

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
  /** Optional: ring buffer capacity for current device platform data. */
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

const getFieldTypeMap = () => {
  return (props.platformFields || []).reduce<Record<string, string>>((acc, field) => {
    const fieldId = typeof field?.id === 'string' ? field.id : ''
    if (fieldId) {
      acc[fieldId] = typeof field?.dataType === 'string' ? field.dataType : ''
    }
    return acc
  }, {})
}

const parseFieldBindingExpression = (expression: unknown) => {
  if (typeof expression !== 'string') return null
  const match = FIELD_BINDING_EXPR_RE.exec(expression.trim())
  if (!match?.[1] || !match?.[2]) return null

  return {
    dataSourceId: match[1],
    fieldPath: match[2]
  }
}

const collectConfiguredWriteFields = () => {
  const fieldIdsByDataSourceId = new Map<string, Set<string>>()
  const nodes = Array.isArray(props.config?.nodes) ? props.config.nodes : []

  nodes.forEach((node: any) => {
    if (node?.type !== 'interaction/basic-switch') return

    const bindings = Array.isArray(node?.data) ? node.data : []
    const valueBinding = bindings.find((binding: any) => binding?.targetProp === 'value')
    const parsed =
      parseFieldBindingExpression(valueBinding?.expression) ||
      parseFieldBindingExpression(node?.props?.value)

    if (!parsed) return

    const fieldSet = fieldIdsByDataSourceId.get(parsed.dataSourceId) || new Set<string>()
    fieldSet.add(parsed.fieldPath)
    fieldIdsByDataSourceId.set(parsed.dataSourceId, fieldSet)
  })

  const dataSources = Array.isArray(props.config?.dataSources) ? props.config.dataSources : []
  dataSources.forEach((dataSource: any) => {
    const dataSourceId = typeof dataSource?.id === 'string' ? dataSource.id : ''
    if (!dataSourceId) return

    const configuredFields = Array.isArray(dataSource?.config?.requestedFields)
      ? dataSource.config.requestedFields.filter((fieldId: unknown): fieldId is string => typeof fieldId === 'string' && !!fieldId)
      : []

    if (configuredFields.length !== 1) return

    const fieldSet = fieldIdsByDataSourceId.get(dataSourceId) || new Set<string>()
    fieldSet.add(configuredFields[0]!)
    fieldIdsByDataSourceId.set(dataSourceId, fieldSet)
  })

  return fieldIdsByDataSourceId
}

const normalizeWriteData = (dataSourceId: string, data: unknown) => {
  if (data !== null && typeof data === 'object') {
    return data as Record<string, unknown>
  }

  const configuredFields = collectConfiguredWriteFields().get(dataSourceId)
  if (!configuredFields || configuredFields.size !== 1) return data

  const fieldId = Array.from(configuredFields)[0]
  if (!fieldId) return data

  return {
    [fieldId]: data
  }
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
  platformDevices: clone(props.platformDevices || []),
  deviceId: props.deviceId || getPreviewDeviceId(),
  thingsvisApiBaseUrl: `${window.location.origin}/thingsvis-api`,
  platformApiBaseUrl: window.location.origin
})

const pushPlatformFieldData = (fields: Record<string, unknown>, deviceId?: string) => {
  if (!client) return
  if (!deviceId) return
  const payload = clone(fields) || {}
  client.pushPlatformFieldData(payload, deviceId)
}

const postPlatformWriteResult = (
  requestId: string | undefined,
  source: MessageEventSource | null,
  payload: Record<string, unknown>
) => {
  if (!requestId || !source || !('postMessage' in source)) return
  ;(source as Window).postMessage(
    {
      type: 'tv:platform-write-result',
      requestId,
      ...payload
    },
    '*'
  )
}

/**
 * Handle tv:platform-write messages posted by the embedded ThingsVis iframe.
 * Routes the write payload to the ThingsPanel telemetry publish API.
 */
const handlePlatformWrite = async (event: MessageEvent) => {
  if (event.data?.type !== 'tv:platform-write') return
  const requestId = typeof event.data?.requestId === 'string' ? event.data.requestId : undefined
  const writePayload = event.data?.payload as { dataSourceId?: string; data?: unknown; deviceId?: string } | undefined
  const { dataSourceId, data, deviceId } = writePayload ?? {}
  if (!dataSourceId || data === undefined) {
    postPlatformWriteResult(requestId, event.source, {
      success: false,
      error: 'Missing dataSourceId or data'
    })
    return
  }
  const targetDeviceId = deviceId || props.deviceId
  if (!targetDeviceId) {
    console.warn('[ThingsVisWidget] tv:platform-write received but deviceId prop is not set')
    postPlatformWriteResult(requestId, event.source, {
      success: false,
      error: 'Missing deviceId'
    })
    return
  }
  try {
    const normalizedData = normalizeWriteData(dataSourceId, data)
    const dataObject = normalizedData !== null && typeof normalizedData === 'object'
      ? normalizedData as Record<string, unknown>
      : null
    const fieldEntries = dataObject ? Object.entries(dataObject) : []
    const fieldId = fieldEntries.length === 1 ? fieldEntries[0]?.[0] : undefined
    const fieldTypeMap = getFieldTypeMap()
    const fieldType = fieldId ? fieldTypeMap[fieldId] : undefined
    const valueStr = typeof normalizedData === 'string' ? normalizedData : JSON.stringify(normalizedData)

    if (fieldType === 'attribute') {
      const result = await attributeDataPub({ device_id: targetDeviceId, value: valueStr })
      postPlatformWriteResult(requestId, event.source, {
        success: true,
        echo: result?.data ?? normalizedData
      })
      return
    }

    if (fieldType === 'command') {
      const result = await commandDataPub({ device_id: targetDeviceId, value: valueStr })
      postPlatformWriteResult(requestId, event.source, {
        success: true,
        echo: result?.data ?? normalizedData
      })
      return
    }

    const result = await telemetryDataPub({ device_id: targetDeviceId, value: valueStr })
    postPlatformWriteResult(requestId, event.source, {
      success: true,
      echo: result?.data ?? normalizedData
    })
  } catch (e) {
    console.error('[ThingsVisWidget] telemetryDataPub failed for tv:platform-write:', e)
    const message = e instanceof Error ? e.message : String(e || 'Platform write failed')
    postPlatformWriteResult(requestId, event.source, {
      success: false,
      error: message
    })
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

  pushPlatformFieldData(fields, payload?.deviceId || previewDeviceId)
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
  const thingsvisApiBaseUrl = encodeURIComponent(`${window.location.origin}/thingsvis-api`)
  const platformApiBaseUrl = encodeURIComponent(window.location.origin)
  const runtimeParams = `&thingsvisApiBaseUrl=${thingsvisApiBaseUrl}&platformApiBaseUrl=${platformApiBaseUrl}`

  // 追加 saveTarget=host，告知 Editor 进入宿主托管模式
  const targetUrl =
    props.mode === 'editor'
      ? `${baseUrl}#/editor?mode=embedded&provider=thingspanel&saveTarget=host${tokenParams}${runtimeParams}`
      : `${baseUrl}#/embed?mode=embedded&provider=thingspanel&saveTarget=host${tokenParams}${runtimeParams}`

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
    if (props.data) pushPlatformFieldData(props.data, props.deviceId || getPreviewDeviceId())
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
      pushPlatformFieldData(newVal, props.deviceId || getPreviewDeviceId())
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
 * Forward a real-time field value batch to the embedded ThingsVis widget.
 * Uses closure reference to `client` so it always reflects the live instance,
 * unlike the exposed `client` property which is snapshotted as null at setup time.
 */
const pushPlatformData = (fields: Record<string, unknown>, deviceId?: string) => {
  pushPlatformFieldData(fields, deviceId)
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
