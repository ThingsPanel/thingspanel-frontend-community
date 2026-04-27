<template>
  <div class="thingsvis-widget-container" ref="container"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { ThingsVisClient } from '@/utils/thingsvis/sdk/client'
import {
  attributeDataPub,
  commandDataPub,
  deviceAlarmStatus,
  telemetryDataHistoryList,
  telemetryDataPub
} from '@/service/api/device'
import { getPlatformApiBase, getThingsVisApiBase } from '@/utils/thingsvis/constants'
import { localStg } from '@/utils/storage'

const FIELD_BINDING_EXPR_RE = /^\{\{\s*ds\.([^.\s]+)\.data(?:\.(.+?))?\s*\}\}$/
const FIELD_BINDING_EXPR_GLOBAL_RE = /\{\{\s*ds\.([^.\s]+)\.data(?:\.(.+?))?\s*\}\}/g
const HISTORY_FIELD_SUFFIX = '__history'
const TEMPLATE_DEVICE_ID = '__template__'
const RUNTIME_STATUS_FIELD_IDS = new Set(['is_online', 'online_text', 'online_status_updated_at'])
const DEVICE_ALARM_STATUS_FIELD_IDS = new Set([
  'device_alarm_active',
  'device_alarm_count',
  'device_alarm_highest_level',
  'latest_device_alarm_title',
  'latest_device_alarm_level',
  'latest_device_alarm_time'
])
const HISTORY_TIME_RANGE_BY_PRESET: Record<string, string> = {
  '1h': 'last_1h',
  '6h': 'last_6h',
  '24h': 'last_24h',
  '7d': 'last_7d',
  '30d': 'last_30d',
  all: 'last_30d'
}
const HISTORY_TIME_RANGE_WEIGHT: Record<string, number> = {
  last_1h: 1,
  last_6h: 2,
  last_24h: 3,
  last_7d: 4,
  last_30d: 5
}
const DEFAULT_WRITE_EVENT_BY_COMPONENT: Record<string, string> = {
  'interaction/basic-switch': 'change',
  'interaction/basic-slider': 'change',
  'interaction/basic-select': 'change',
  'interaction/basic-input': 'submit'
}
const AUTO_WRITE_MARKER = 'field-binding'

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

const getEmbeddedContext = () => (props.deviceId === TEMPLATE_DEVICE_ID ? 'device-template' : 'dashboard')

const getPlatformDevices = () => {
  if (Array.isArray(props.platformDevices) && props.platformDevices.length > 0) return clone(props.platformDevices)
  if (getEmbeddedContext() !== 'device-template') return []
  return [
    {
      deviceId: TEMPLATE_DEVICE_ID,
      deviceName: '物模型字段',
      groupId: TEMPLATE_DEVICE_ID,
      groupName: '物模型字段',
      fields: clone(props.platformFields || [])
    }
  ]
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

const getFieldValueTypeMap = () => {
  return (props.platformFields || []).reduce<Record<string, string>>((acc, field) => {
    const fieldId = typeof field?.id === 'string' ? field.id : ''
    if (fieldId) {
      acc[fieldId] = typeof field?.type === 'string' ? field.type : ''
    }
    return acc
  }, {})
}

const getFieldDataTypeMap = () => {
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
    const bindings = Array.isArray(node?.data) ? node.data : []
    const valueBinding = bindings.find((binding: any) => binding?.targetProp === 'value')
    const parsed =
      parseFieldBindingExpression(valueBinding?.expression) || parseFieldBindingExpression(node?.props?.value)

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
      ? dataSource.config.requestedFields.filter(
          (fieldId: unknown): fieldId is string => typeof fieldId === 'string' && !!fieldId
        )
      : []

    if (configuredFields.length !== 1) return

    const fieldSet = fieldIdsByDataSourceId.get(dataSourceId) || new Set<string>()
    fieldSet.add(configuredFields[0]!)
    fieldIdsByDataSourceId.set(dataSourceId, fieldSet)
  })

  return fieldIdsByDataSourceId
}

const normalizeBooleanValue = (value: unknown) => {
  if (typeof value === 'boolean') return value
  if (value === 'true' || value === '1' || value === 1) return true
  if (value === 'false' || value === '0' || value === 0) return false
  return value
}

const normalizeNumberValue = (value: unknown) => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : value
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return value
}

const normalizeFieldWriteValue = (fieldId: string, value: unknown) => {
  const fieldValueType = getFieldValueTypeMap()[fieldId]
  if (!fieldValueType) return value

  if (fieldValueType === 'boolean') return normalizeBooleanValue(value)
  if (fieldValueType === 'number') return normalizeNumberValue(value)
  return value
}

const normalizeWriteData = (dataSourceId: string, data: unknown) => {
  if (data !== null && typeof data === 'object') {
    return Object.entries(data as Record<string, unknown>).reduce<Record<string, unknown>>((acc, [fieldId, value]) => {
      acc[fieldId] = normalizeFieldWriteValue(fieldId, value)
      return acc
    }, {})
  }

  const configuredFields = collectConfiguredWriteFields().get(dataSourceId)
  if (!configuredFields || configuredFields.size !== 1) return data

  const fieldId = Array.from(configuredFields)[0]
  if (!fieldId) return data

  return {
    [fieldId]: normalizeFieldWriteValue(fieldId, data)
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

const normalizeTelemetryHistoryRows = (payload: any) => {
  const source = payload?.data !== undefined ? payload.data : payload
  const rows = Array.isArray(source)
    ? source
    : Array.isArray(source?.list)
      ? source.list
      : Array.isArray(source?.data)
        ? source.data
        : []

  return rows
    .map((item: any) => {
      const timestamp = item?.timestamp ?? item?.time ?? item?.ts ?? item?.x
      const value = item?.value ?? item?.y ?? item?.avg
      const ts =
        typeof timestamp === 'number'
          ? timestamp
          : typeof timestamp === 'string'
            ? Date.parse(timestamp)
            : Number(timestamp)
      return { timestamp, ts, value: Number(value) }
    })
    .filter((item: any) => Number.isFinite(item.ts) && Number.isFinite(item.value))
}

const ensureInteractiveWriteEvents = (config: any) => {
  if (!config || !Array.isArray(config.nodes)) return config

  return {
    ...config,
    nodes: config.nodes.map((node: any) => {
      const eventName = DEFAULT_WRITE_EVENT_BY_COMPONENT[node?.type]
      if (!eventName) return node

      const bindings = Array.isArray(node?.data) ? node.data : []
      const valueBinding = bindings.find((binding: any) => binding?.targetProp === 'value')
      const parsed =
        parseFieldBindingExpression(valueBinding?.expression) || parseFieldBindingExpression(node?.props?.value)
      if (!parsed?.dataSourceId || !parsed.fieldPath) return node

      const fieldId = getFieldRoot(parsed.fieldPath)
      if (!fieldId) return node

      const events = Array.isArray(node?.events) ? node.events : []
      const autoAction = {
        type: 'callWrite',
        dataSourceId: parsed.dataSourceId,
        payload: `({ ${JSON.stringify(fieldId)}: payload })`,
        __thingsvisAutoWrite: AUTO_WRITE_MARKER
      }

      let found = false
      const nextEvents = events.map((handler: any) => {
        if (handler?.event !== eventName) return handler
        found = true

        const actions = Array.isArray(handler?.actions) ? handler.actions : []
        const manualActions = actions.filter((action: any) => action?.__thingsvisAutoWrite !== AUTO_WRITE_MARKER)
        return {
          ...handler,
          actions: [...manualActions, autoAction]
        }
      })

      if (!found) {
        nextEvents.push({
          event: eventName,
          actions: [autoAction]
        })
      }

      return {
        ...node,
        events: nextEvents
      }
    })
  }
}

const normalizeHistoryTimeRange = (value: unknown) => {
  if (typeof value !== 'string') return 'last_30d'
  if (value.startsWith('last_')) return value
  return HISTORY_TIME_RANGE_BY_PRESET[value] || 'last_30d'
}

const mergeHistoryTimeRange = (current: string | undefined, next: string) => {
  if (!current) return next
  const currentWeight = HISTORY_TIME_RANGE_WEIGHT[current] ?? 0
  const nextWeight = HISTORY_TIME_RANGE_WEIGHT[next] ?? 0
  return nextWeight > currentWeight ? next : current
}

const registerHistoryTimeRange = (requests: Map<string, string | undefined>, fieldId: string, timeRange?: string) => {
  const current = requests.get(fieldId)
  if (!timeRange) {
    if (!requests.has(fieldId)) requests.set(fieldId, current)
    return
  }

  requests.set(fieldId, mergeHistoryTimeRange(current, timeRange))
}

type HistoryRequestConfig = {
  timeRange?: string
  aggFunction?: string
  aggWindow?: string
}

const normalizeHistoryConfig = (config?: HistoryRequestConfig): Required<HistoryRequestConfig> => ({
  timeRange: normalizeHistoryTimeRange(config?.timeRange),
  aggFunction: config?.aggFunction || 'NONE_RAW',
  aggWindow: config?.aggWindow || 'no_aggregate'
})

const resolveNodeHistoryTimeRange = (node: any) => {
  return normalizeHistoryTimeRange(node?.props?.timeRangePreset)
}

const fetchTelemetryHistoryField = async (deviceId: string, fieldId: string, config?: HistoryRequestConfig) => {
  if (!deviceId || deviceId === TEMPLATE_DEVICE_ID || !fieldId) return []
  if (RUNTIME_STATUS_FIELD_IDS.has(fieldId)) return []

  const fieldDataTypeMap = getFieldDataTypeMap()
  if (fieldDataTypeMap[fieldId] && fieldDataTypeMap[fieldId] !== 'telemetry') return []

  try {
    const historyConfig = normalizeHistoryConfig(config)
    const response = await telemetryDataHistoryList(
      {
        device_id: deviceId,
        key: fieldId,
        time_range: historyConfig.timeRange,
        aggregate_window: historyConfig.aggWindow,
        aggregate_function: historyConfig.aggFunction
      },
      { silentError: true } as any
    )
    if (response?.error) return []
    return normalizeTelemetryHistoryRows(response)
  } catch (error) {
    console.warn('[ThingsVisWidget] telemetry history request failed:', fieldId, error)
    return []
  }
}

const getFieldRoot = (fieldPath?: string) => {
  if (!fieldPath) return ''
  return fieldPath.split(/[.[\]]/).filter(Boolean)[0] || ''
}

const visitStringLeaves = (value: unknown, visitor: (input: string) => void) => {
  if (typeof value === 'string') {
    visitor(value)
    return
  }

  if (Array.isArray(value)) {
    value.forEach((item) => visitStringLeaves(item, visitor))
    return
  }

  if (value && typeof value === 'object') {
    Object.values(value).forEach((item) => visitStringLeaves(item, visitor))
  }
}

const collectConfiguredHistoryFields = (dataSourceId?: string) => {
  const requests = new Map<string, string>()
  const nodes = Array.isArray(props.config?.nodes) ? props.config.nodes : []

  nodes.forEach((node: any) => {
    const historyTimeRange = resolveNodeHistoryTimeRange(node)
    const bindings = Array.isArray(node?.data) ? node.data : []
    bindings.forEach((binding: any) => {
      const parsed = parseFieldBindingExpression(binding?.expression)
      if (!parsed || (dataSourceId && parsed.dataSourceId !== dataSourceId)) return

      const fieldRoot = getFieldRoot(parsed.fieldPath)
      if (!fieldRoot.endsWith(HISTORY_FIELD_SUFFIX)) return

      const sourceFieldId = fieldRoot.slice(0, -HISTORY_FIELD_SUFFIX.length)
      if (!sourceFieldId) return

      const bindingTimeRange = normalizeHistoryTimeRange(binding?.historyConfig?.timeRange)
      requests.set(sourceFieldId, mergeHistoryTimeRange(requests.get(sourceFieldId), bindingTimeRange))
    })

    visitStringLeaves(node, (input) => {
      FIELD_BINDING_EXPR_GLOBAL_RE.lastIndex = 0

      let match: RegExpExecArray | null
      while ((match = FIELD_BINDING_EXPR_GLOBAL_RE.exec(input)) !== null) {
        const matchedDataSourceId = match[1]
        if (!matchedDataSourceId || (dataSourceId && matchedDataSourceId !== dataSourceId)) continue

        const fieldRoot = getFieldRoot(match[2])
        if (!fieldRoot.endsWith(HISTORY_FIELD_SUFFIX)) continue

        const sourceFieldId = fieldRoot.slice(0, -HISTORY_FIELD_SUFFIX.length)
        if (!sourceFieldId) continue

        requests.set(sourceFieldId, mergeHistoryTimeRange(requests.get(sourceFieldId), historyTimeRange))
      }
    })
  })

  return requests
}

const getConfiguredPlatformDataSource = (dataSourceId?: string) => {
  if (!dataSourceId) return null
  const dataSources = Array.isArray(props.config?.dataSources) ? props.config.dataSources : []
  return dataSources.find((dataSource: any) => dataSource?.id === dataSourceId) || null
}

const shouldPrefillHistoryForDataSource = (dataSourceId?: string) => {
  const dataSource = getConfiguredPlatformDataSource(dataSourceId)
  const bufferSize = dataSource?.config?.bufferSize
  return typeof bufferSize === 'number' && Number.isFinite(bufferSize) && bufferSize > 0
}

const buildRequestedFieldData = async (fieldIds: string[], deviceId?: string) => {
  const currentData = props.data
  if (!fieldIds.length) return {}

  const result: Record<string, unknown> = {}

  fieldIds.forEach((fieldId) => {
    if (fieldId.endsWith(HISTORY_FIELD_SUFFIX)) return
    if (currentData && Object.prototype.hasOwnProperty.call(currentData, fieldId)) {
      result[fieldId] = currentData[fieldId]
    }
  })

  return result
}

const normalizeAlarmLevel = (raw: unknown) => {
  const value = String(raw ?? '')
    .toLowerCase()
    .trim()
  if (value === '1' || value === 'critical' || value === 'high' || value === 'serious') return 'critical'
  if (value === '2' || value === 'warning' || value === 'medium' || value === 'warn') return 'warning'
  if (value === '3' || value === 'info' || value === 'low') return 'info'
  return value || ''
}

const normalizeAlarmTime = (row: any) =>
  row?.last_trigger_time ?? row?.create_time ?? row?.created_at ?? row?.time ?? ''

const isActiveAlarm = (row: any) => {
  const raw = String(row?.alarm_status ?? row?.status ?? row?.is_active ?? '').toLowerCase()
  return row?.is_active === true || raw === '1' || raw === 'active' || raw === 'triggered' || raw === 'a'
}

const buildRequestedAlarmStatusData = async (fieldIds: string[], deviceId?: string) => {
  const requestedAlarmFields = fieldIds.filter((fieldId) => DEVICE_ALARM_STATUS_FIELD_IDS.has(fieldId))
  if (!deviceId || deviceId === TEMPLATE_DEVICE_ID || requestedAlarmFields.length === 0) return {}

  try {
    const response = await deviceAlarmStatus({ device_id: deviceId, page: 1, page_size: 20 })
    const payload = response?.data ?? response
    const rows = Array.isArray(payload?.list)
      ? payload.list
      : Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload)
          ? payload
          : []
    const activeRows = rows.filter(isActiveAlarm)
    const latest = rows[0] ?? null
    const highest = activeRows[0] ?? latest
    const allFields: Record<string, unknown> = {
      device_alarm_active: activeRows.length > 0 ? 1 : 0,
      device_alarm_count: Number(payload?.total ?? activeRows.length ?? 0),
      device_alarm_highest_level: normalizeAlarmLevel(highest?.alarm_level ?? highest?.level),
      latest_device_alarm_title: String(latest?.alarm_name ?? latest?.name ?? latest?.title ?? ''),
      latest_device_alarm_level: normalizeAlarmLevel(latest?.alarm_level ?? latest?.level),
      latest_device_alarm_time: latest ? normalizeAlarmTime(latest) : ''
    }

    return requestedAlarmFields.reduce<Record<string, unknown>>((acc, fieldId) => {
      acc[fieldId] = allFields[fieldId]
      return acc
    }, {})
  } catch (error) {
    console.warn('[ThingsVisWidget] device alarm status request failed:', deviceId, error)
    return {}
  }
}

function normalizeViewerConfig(config: any) {
  if (!config || props.mode !== 'viewer') return config

  const platformNormalizedConfig = normalizeViewerPlatformDataSources(ensureInteractiveWriteEvents(config))

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
  platformDevices: getPlatformDevices(),
  deviceId: props.deviceId || getPreviewDeviceId(),
  thingsvisApiBaseUrl: getThingsVisApiBase(),
  platformApiBaseUrl: getPlatformApiBase(),
  platformToken: localStg.get('token') as string | undefined
})

const pushPlatformFieldData = (fields: Record<string, unknown>, deviceId?: string) => {
  if (!client) return
  if (!deviceId) return
  const payload = clone(fields) || {}
  client.pushPlatformFieldData(payload, deviceId)
}

function normalizeLoadConfig(config: any) {
  const writeNormalizedConfig = ensureInteractiveWriteEvents(config)
  return normalizeViewerConfig(writeNormalizedConfig)
}

const pushPlatformFieldHistory = (
  fieldId: string,
  history: Array<{ value: unknown; ts: number }>,
  deviceId?: string
) => {
  if (!client) return
  if (!deviceId) return
  client.pushPlatformFieldHistory(fieldId, clone(history) || [], deviceId)
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
    const dataObject =
      normalizedData !== null && typeof normalizedData === 'object' ? (normalizedData as Record<string, unknown>) : null
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

const handleFieldDataRequest = async (event: MessageEvent) => {
  if (event.data?.type !== 'thingsvis:requestFieldData') return

  const payload = event.data?.payload as
    | {
        dataSourceId?: string
        deviceId?: string
        fieldIds?: string[]
        historyConfig?: HistoryRequestConfig
      }
    | undefined
  const fieldIds = Array.isArray(payload?.fieldIds)
    ? payload.fieldIds.filter((fieldId): fieldId is string => typeof fieldId === 'string')
    : []
  if (fieldIds.length === 0) return

  const previewDeviceId = getPreviewDeviceId()
  if (payload?.deviceId && previewDeviceId && payload.deviceId !== previewDeviceId) return
  const targetDeviceId = payload?.deviceId || previewDeviceId

  const currentFieldIds: string[] = []
  const explicitHistoryFieldIds: string[] = []
  const explicitHistorySourceFieldIds = new Set<string>()
  const historyRequests = new Map<string, string | undefined>()

  fieldIds.forEach((fieldId) => {
    if (fieldId.endsWith(HISTORY_FIELD_SUFFIX)) {
      explicitHistoryFieldIds.push(fieldId)
      const sourceFieldId = fieldId.slice(0, -HISTORY_FIELD_SUFFIX.length)
      if (sourceFieldId) {
        explicitHistorySourceFieldIds.add(sourceFieldId)
        registerHistoryTimeRange(historyRequests, sourceFieldId)
      }
      return
    }

    currentFieldIds.push(fieldId)
  })

  const configuredHistoryFields = collectConfiguredHistoryFields(payload?.dataSourceId)

  if (shouldPrefillHistoryForDataSource(payload?.dataSourceId)) {
    const historyBoundFieldIds = new Set<string>([
      ...explicitHistorySourceFieldIds,
      ...Array.from(configuredHistoryFields.keys())
    ])

    const prefillFieldIds =
      historyBoundFieldIds.size > 0
        ? currentFieldIds.filter((fieldId) => historyBoundFieldIds.has(fieldId))
        : currentFieldIds
    prefillFieldIds.forEach((fieldId) => {
      registerHistoryTimeRange(historyRequests, fieldId)
    })
  }

  configuredHistoryFields.forEach((timeRange, fieldId) => {
    registerHistoryTimeRange(historyRequests, fieldId, timeRange)
  })

  const fields = {
    ...(await buildRequestedFieldData(currentFieldIds, targetDeviceId)),
    ...(await buildRequestedAlarmStatusData(currentFieldIds, targetDeviceId))
  }

  if (historyRequests.size > 0 && targetDeviceId) {
    const historyEntries = await Promise.all(
      Array.from(historyRequests.entries()).map(async ([fieldId, timeRange]) => {
        const rows = await fetchTelemetryHistoryField(targetDeviceId, fieldId, {
          ...(payload?.historyConfig || {}),
          timeRange: payload?.historyConfig?.timeRange || timeRange || 'last_30d'
        })
        return [fieldId, rows] as const
      })
    )

    historyEntries.forEach(([fieldId, rows]) => {
      if (rows.length > 0) {
        pushPlatformFieldHistory(fieldId, rows, targetDeviceId)
      }
      if (explicitHistoryFieldIds.includes(`${fieldId}${HISTORY_FIELD_SUFFIX}`)) {
        fields[`${fieldId}${HISTORY_FIELD_SUFFIX}`] = rows
      }
    })
  }

  if (Object.keys(fields).length === 0) return

  pushPlatformFieldData(fields, targetDeviceId)
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
  const thingsvisApiBaseUrl = encodeURIComponent(getThingsVisApiBase())
  const platformApiBaseUrl = encodeURIComponent(getPlatformApiBase())
  const embeddedContext = getEmbeddedContext()
  const runtimeParams = `&context=${embeddedContext}&thingsvisApiBaseUrl=${thingsvisApiBaseUrl}&platformApiBaseUrl=${platformApiBaseUrl}`

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
    if (props.config)
      client?.loadWidgetConfig(
        normalizeLoadConfig(clone(props.config)),
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
  (newVal) => {
    if (client?.ready && newVal) {
      client.loadWidgetConfig(normalizeLoadConfig(clone(newVal)), clone(props.platformFields || []), getLoadOptions())
    }
  },
  { deep: true }
)

// 响应式监听数据变化
watch(
  () => props.data,
  (newVal) => {
    if (client?.ready && newVal) {
      pushPlatformFieldData(newVal, props.deviceId || getPreviewDeviceId())
    }
  },
  { deep: true }
)

// 响应式监听 Schema 变化
watch(
  () => props.platformFields,
  (newVal) => {
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
  pushPlatformData
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
