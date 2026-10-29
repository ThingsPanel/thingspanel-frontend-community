<script setup lang="tsx">
/**
 * 设备详情 - 图表Tab
 * 使用 ThingsVis 嵌入式编辑器预览模式展示图表
 *
 * 数据推送策略：
 *  - tp-03: WebSocket 实时推送（首选），断线自动回退轮询
 *  - tp-02: ThingsVis ready 后历史数据回填
 *  - tp-04: 告警/事件字段 30s 轮询推送
 */

import { onMounted, onBeforeUnmount, ref, watch, computed } from 'vue'
import { NEmpty, NCard, NSkeleton } from 'naive-ui'
import ThingsVisWidget from '@/components/thingsvis/ThingsVisWidget.vue'
import { deviceRuntimeNative } from '@/service/api/device-runtime-native'
import type { PlatformField } from '@/utils/thingsvis/types'
import { useRealtimePush } from '@/hooks/thingsvis/useRealtimePush'
import { useAlarmPush } from '@/hooks/thingsvis/useAlarmPush'
import { resolveDeviceNativeModel } from '@/views/device/native-model-consumption'
import type { DeviceConfigNativeBinding } from '@/service/api/native-template-binding'

const TEMPLATE_PLATFORM_SOURCE_ID = '__platform___template____'
const RUNTIME_PLATFORM_FIELD_IDS = new Set(['is_online', 'online_text', 'online_status_updated_at'])

/** 通过 Encore 原生读数接口取全部最新值（逐页读取，单页最多 100 条）。 */
async function fetchLatestReadings(deviceId: string, kind: 'telemetry' | 'attribute') {
  const rows: { key: string; value: unknown }[] = []
  for (let page = 1; page <= 50; page += 1) {
    const result = await deviceRuntimeNative.listReadings(deviceId, { kind, latestOnly: true, page, pageSize: 100 })
    rows.push(...result.items.map(item => ({ key: item.identifier, value: item.value })))
    if (rows.length >= result.total || result.items.length === 0) break
  }
  return rows
}

function getRuntimePlatformSourceId(deviceId: string) {
  return `__platform_${deviceId}__`
}

function isValidRequestedFieldId(fieldId: string, availableFieldIds: Set<string>) {
  if (!fieldId) return false
  if (availableFieldIds.has(fieldId) || RUNTIME_PLATFORM_FIELD_IDS.has(fieldId)) return true
  if (fieldId.endsWith('__history')) {
    const root = fieldId.slice(0, -'__history'.length)
    return availableFieldIds.has(root)
  }
  return false
}

function rewriteTemplateBindingExpression(expression: unknown, runtimeDataSourceId: string): unknown {
  if (typeof expression !== 'string') return expression

  const directFieldMatch = expression.match(/^\{\{\s*ds\.__platform___template____\.data\.([A-Za-z0-9_-]+)\s*\}\}$/)
  if (directFieldMatch?.[1]) {
    return `{{ ds.${runtimeDataSourceId}.data.${directFieldMatch[1]} }}`
  }

  const booleanSelectMatch = expression.match(
    /^\{\{\s*ds\.__platform___template____\.data\.([A-Za-z0-9_-]+)\s*\?\s*'1'\s*:\s*'0'\s*\}\}$/
  )
  if (booleanSelectMatch?.[1]) {
    return `{{ ds.${runtimeDataSourceId}.data.${booleanSelectMatch[1]} }}`
  }

  return expression.split(TEMPLATE_PLATFORM_SOURCE_ID).join(runtimeDataSourceId)
}

function normalizeTemplateChartConfig(rawConfig: any, deviceId: string, availableFieldIds: Set<string>) {
  if (!rawConfig || typeof rawConfig !== 'object') return rawConfig

  const runtimeDataSourceId = getRuntimePlatformSourceId(deviceId)
  const config = JSON.parse(JSON.stringify(rawConfig))

  if (Array.isArray(config.dataSources)) {
    config.dataSources = config.dataSources.map((dataSource: any) => {
      const isPlatformField = dataSource?.type === 'PLATFORM_FIELD'
      if (!isPlatformField) return dataSource

      const nextId = dataSource?.id === TEMPLATE_PLATFORM_SOURCE_ID ? runtimeDataSourceId : dataSource?.id
      const requestedFields = Array.isArray(dataSource?.config?.requestedFields)
        ? dataSource.config.requestedFields.filter(
            (fieldId: unknown): fieldId is string =>
              typeof fieldId === 'string' && isValidRequestedFieldId(fieldId, availableFieldIds)
          )
        : []

      return {
        ...dataSource,
        id: nextId,
        config: {
          ...(dataSource?.config || {}),
          deviceId,
          requestedFields
        }
      }
    })
  }

  if (Array.isArray(config.nodes)) {
    config.nodes = config.nodes.map((node: any) => {
      const nextNode = { ...node }

      if (nextNode.type === 'chart/realtime-history-curve') {
        nextNode.props = {
          ...(nextNode.props || {}),
          config: {
            ...(nextNode.props?.config || {}),
            data: { ...(nextNode.props?.config?.data || {}), deviceId }
          }
        }
      }

      if (Array.isArray(nextNode.data)) {
        nextNode.data = nextNode.data.map((binding: any) => {
          const nextBinding = { ...binding }
          const rewrittenExpression = rewriteTemplateBindingExpression(nextBinding?.expression, runtimeDataSourceId)
          nextBinding.expression = rewrittenExpression

          const booleanSelectMatch =
            typeof binding?.expression === 'string'
              ? binding.expression.match(
                  /^\{\{\s*ds\.__platform___template____\.data\.([A-Za-z0-9_-]+)\s*\?\s*'1'\s*:\s*'0'\s*\}\}$/
                )
              : null
          if (booleanSelectMatch?.[1]) {
            nextBinding.transform = `value ? '1' : '0'`
          }

          return nextBinding
        })
      }

      if (nextNode.props && typeof nextNode.props === 'object') {
        Object.entries(nextNode.props).forEach(([key, value]) => {
          nextNode.props[key] = rewriteTemplateBindingExpression(value, runtimeDataSourceId)
        })
      }

      if (Array.isArray(nextNode.events)) {
        nextNode.events = nextNode.events.map((handler: any) => ({
          ...handler,
          actions: Array.isArray(handler?.actions)
            ? handler.actions.map((action: any) => {
                const nextAction = { ...action }
                if (nextAction?.dataSourceId === TEMPLATE_PLATFORM_SOURCE_ID) {
                  nextAction.dataSourceId = runtimeDataSourceId
                }
                if (typeof nextAction?.payload === 'string') {
                  nextAction.payload = nextAction.payload.replace(/"([A-Za-z0-9_-]+)\s*\?\s*'1'\s*:\s*'0'"/g, '"$1"')
                }
                return nextAction
              })
            : handler?.actions
        }))
      }

      return nextNode
    })
  }

  return config
}

const props = defineProps<{
  /** 设备ID */
  id: string
  /** 设备详情数据 (可选) */
  deviceData?: Record<string, any>
}>()

// 动态计算图表容器高度：基于元素在视口中的位置自适应
const chartCardRef = ref<InstanceType<typeof NCard> | null>(null)
const availableHeight = ref(0)
let resizeObserver: ResizeObserver | null = null

function updateAvailableHeight() {
  const el = chartCardRef.value?.$el as HTMLElement | undefined
  if (!el) return
  const rect = el.getBoundingClientRect()
  const cardPaddingTop = 24
  availableHeight.value = Math.max(window.innerHeight - rect.top - cardPaddingTop - 24, 200)
}

const chartHeight = computed(() => {
  if (availableHeight.value > 0) {
    return `${availableHeight.value}px`
  }
  return 'calc(100vh - 200px)'
})

// 状态
const chartLoading = ref(true)
const hasTemplate = ref(false)
const initialConfig = ref<any>(null)
const platformFields = ref<PlatformField[]>([])
const visWidgetRef = ref<InstanceType<typeof ThingsVisWidget> | null>(null)

// 当前数据（轮询回退使用）
const currentData = ref<Record<string, any>>({})
const currentDataDeviceId = ref('')
const viewerPlatformDevices = computed(() => {
  if (!props.id || platformFields.value.length === 0) return []
  return [
    {
      deviceId: props.id,
      deviceName: props.deviceData?.name || 'Device',
      fields: platformFields.value
    }
  ]
})

const deviceIdRef = computed(() => props.id)
const templateContextResolved = computed(() => {
  return Boolean(props.deviceData)
})
const hasLoadedInitialSnapshot = computed(() => {
  return currentDataDeviceId.value === props.id && Object.keys(currentData.value).length > 0
})

// ─── tp-03: 实时 WebSocket 推送 ──────────────────────────────────────────────

const fetchAndUpdateData = async (expectedSequence = initSequence, deviceId = props.id) => {
  const fields = platformFields.value
  if (!deviceId || fields.length === 0) return

  try {
    const hasAttributes = fields.some(f => f.dataType === 'attribute')

    const [telemetryList, attributeList] = await Promise.all([
      fetchLatestReadings(deviceId, 'telemetry'),
      hasAttributes ? fetchLatestReadings(deviceId, 'attribute') : Promise.resolve([])
    ])
    if (expectedSequence !== initSequence || deviceId !== props.id || fields !== platformFields.value) return

    const kvMap: Record<string, any> = {}

    const processItem = (item: { key: string; value: unknown }) => {
      kvMap[item.key] = item.value
    }

    if (Array.isArray(telemetryList)) telemetryList.forEach(processItem)
    if (Array.isArray(attributeList)) attributeList.forEach(processItem)

    const dataMap: Record<string, any> = {}
    fields.forEach(field => {
      const val = kvMap[field.id] ?? kvMap[field.name]
      if (val !== undefined) {
        dataMap[field.id] = val
      }
    })

    if (Object.keys(dataMap).length > 0) {
      currentData.value = {
        ...currentData.value,
        ...dataMap
      }
      currentDataDeviceId.value = deviceId
      pushDataToVis(dataMap, deviceId, expectedSequence)
    }
  } catch (err) {
    console.error('[TelemetryChart] 获取设备实时数据失败:', err)
  }
}

// WebSocket 推送数据到 ThingsVis
const pushDataToVis = (fields: Record<string, unknown>, deviceId = props.id, expectedSequence = initSequence) => {
  if (expectedSequence !== initSequence || deviceId !== props.id) return
  if (Object.keys(fields).length === 0) return
  currentData.value = {
    ...currentData.value,
    ...fields
  }
  visWidgetRef.value?.pushPlatformData(fields, deviceId)
}

// 历史推送方法
const realtimePush = ref<ReturnType<typeof useRealtimePush> | null>(null)
const alarmPush = ref<ReturnType<typeof useAlarmPush> | null>(null)
let initSequence = 0

// ─── 加载模板和配置 ───────────────────────────────────────────────────────────

const initTemplateData = async (
  deviceConfig: Record<string, any> | undefined,
  expectedSequence: number,
  deviceId: string
) => {
  if (!deviceConfig) {
    if (expectedSequence === initSequence) {
      hasTemplate.value = false
      chartLoading.value = false
    }
    return
  }

  try {
    const resolved = await resolveDeviceNativeModel(deviceConfig as DeviceConfigNativeBinding)
    if (expectedSequence !== initSequence || deviceId !== props.id) return
    if (!resolved) {
      hasTemplate.value = false
      return
    }
    platformFields.value = resolved.platformFields
    const availableFieldIds = new Set(platformFields.value.map(field => field.id).filter(Boolean))
    const webChartConfig = resolved.snapshot.resources.webChartConfig
    if (!webChartConfig) {
      hasTemplate.value = false
      return
    }
    const configJson = normalizeTemplateChartConfig(webChartConfig, deviceId, availableFieldIds)
    initialConfig.value = configJson
    hasTemplate.value = true
    await fetchAndUpdateData(expectedSequence, deviceId)
  } catch (error) {
    if (expectedSequence !== initSequence || deviceId !== props.id) return
    console.error('[TelemetryChart] 加载绑定物模型快照失败:', error)
    hasTemplate.value = false
  } finally {
    if (expectedSequence === initSequence && deviceId === props.id) chartLoading.value = false
  }
}

// ─── ThingsVis ready 回调 ─────────────────────────────────────────────────────

const onVisReady = async () => {
  // tp-02: 历史数据回填
  // tp-04: 告警历史回填
  // Push current snapshot so widgets show real values immediately after ready
  if (!hasLoadedInitialSnapshot.value) {
    await fetchAndUpdateData()
  }
}

// ─── 监听模板ID变化重新加载 ───────────────────────────────────────────────────

watch(
  [() => props.deviceData?.device_config, templateContextResolved, () => props.id],
  async ([newVal]) => {
    const currentSequence = ++initSequence

    // 先停止旧的推送
    realtimePush.value?.stop()
    alarmPush.value?.stop()
    realtimePush.value = null
    alarmPush.value = null
    currentData.value = {}
    currentDataDeviceId.value = ''
    platformFields.value = []
    initialConfig.value = null
    hasTemplate.value = false

    if (!templateContextResolved.value) {
      chartLoading.value = true
      return
    }

    if (!newVal) {
      chartLoading.value = false
      return
    }

    chartLoading.value = true

    const deviceId = props.id
    await initTemplateData(newVal, currentSequence, deviceId)

    if (currentSequence !== initSequence || !hasTemplate.value) {
      return
    }

    // 初始化 composables
    const pushForCurrentDevice = (fields: Record<string, unknown>) => pushDataToVis(fields, deviceId, currentSequence)
    realtimePush.value = useRealtimePush(deviceIdRef, platformFields, pushForCurrentDevice, async () => {
      if (!hasLoadedInitialSnapshot.value) {
        await fetchAndUpdateData(currentSequence, deviceId)
      }
    })

    alarmPush.value = useAlarmPush(deviceIdRef, platformFields, pushForCurrentDevice)

    // 启动实时推送
    realtimePush.value?.start()
    // 启动告警轮询
    alarmPush.value?.start()
  },
  { immediate: true }
)

onMounted(() => {
  const el = chartCardRef.value?.$el as HTMLElement | undefined
  if (el) {
    resizeObserver = new ResizeObserver(() => updateAvailableHeight())
    resizeObserver.observe(el.parentElement || el)
  }
  window.addEventListener('resize', updateAvailableHeight)
  updateAvailableHeight()
})

onBeforeUnmount(() => {
  realtimePush.value?.stop()
  alarmPush.value?.stop()
  resizeObserver?.disconnect()
  window.removeEventListener('resize', updateAvailableHeight)
})
</script>

<template>
  <NCard ref="chartCardRef" class="device-chart-panel w-full h-full" :bordered="false" content-style="padding: 0;">
    <template v-if="chartLoading">
      <div class="device-chart-panel__state">
        <NSkeleton text :repeat="3" />
        <NSkeleton height="180px" class="mt-12px" />
      </div>
    </template>

    <template v-else-if="!hasTemplate">
      <div class="device-chart-panel__state">
        <NEmpty description="未配置图表数据或设备未绑定模板" />
      </div>
    </template>

    <template v-else>
      <ThingsVisWidget
        ref="visWidgetRef"
        mode="viewer"
        :config="initialConfig"
        :data="currentData"
        :platform-fields="platformFields"
        :platform-devices="viewerPlatformDevices"
        :height="chartHeight"
        :buffer-size="100"
        :device-id="props.id"
        @ready="onVisReady"
      />
    </template>
  </NCard>
</template>

<style scoped>
.device-chart-panel {
  overflow: hidden;
  border-radius: 12px;
  background: #fff;
}

.device-chart-panel__state {
  padding: 18px 20px;
}
</style>
