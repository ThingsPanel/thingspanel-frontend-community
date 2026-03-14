
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
import { extractPlatformFields } from '@/utils/thingsvis/platform-fields'
import { normalizeThingsVisHistoryBindings } from '@/utils/thingsvis/normalize-history-bindings'
import { deviceTemplateDetail, telemetryDataCurrent, getAttributeDataSet } from '@/service/api/device'
import { telemetryApi, attributesApi, eventsApi, commandsApi } from '@/service/api'
import type { PlatformField } from '@/utils/thingsvis/types'
import { useHistoryBackfill } from '@/hooks/thingsvis/useHistoryBackfill'
import { useRealtimePush } from '@/hooks/thingsvis/useRealtimePush'
import { useAlarmPush } from '@/hooks/thingsvis/useAlarmPush'

const props = defineProps<{
  /** 设备ID */
  id: string
  /** 模板ID */
  deviceTemplateId?: string
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

// ─── tp-03: 实时 WebSocket 推送 ──────────────────────────────────────────────

const fetchAndUpdateData = async () => {
  if (!props.id || !hasTemplate.value) return

  try {
    const hasAttributes = platformFields.value.some(f => f.dataType === 'attribute')

    const [telemetryRes, attributeRes] = await Promise.all([
      telemetryDataCurrent(props.id),
      hasAttributes ? getAttributeDataSet({ device_id: props.id }) : Promise.resolve({ data: [] })
    ])

    const telemetryList = telemetryRes?.data || []
    const attributeList = attributeRes?.data || []
    const kvMap: Record<string, any> = {}

    const processItem = (item: any) => {
      if (item?.key !== undefined) kvMap[item.key] = item.value
      if (item?.label) kvMap[item.label] = item.value
    }

    if (Array.isArray(telemetryList)) telemetryList.forEach(processItem)
    if (Array.isArray(attributeList)) attributeList.forEach(processItem)

    const dataMap: Record<string, any> = {}
    platformFields.value.forEach(field => {
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
      pushDataToVis(dataMap)
    }
  } catch (err) {
    console.error('[TelemetryChart] 获取设备实时数据失败:', err)
  }
}

// WebSocket 推送数据到 ThingsVis
const pushDataToVis = (fields: Record<string, unknown>) => {
  if (Object.keys(fields).length === 0) return
  currentData.value = {
    ...currentData.value,
    ...fields
  }
  visWidgetRef.value?.pushPlatformData(fields, props.id)
}

// 历史推送方法
const pushHistoryToVis = (fieldId: string, history: Array<{ value: unknown; ts: number }>) => {
  visWidgetRef.value?.pushHistory(fieldId, history, props.id)
}

const realtimePush = ref<ReturnType<typeof useRealtimePush> | null>(null)
const alarmPush = ref<ReturnType<typeof useAlarmPush> | null>(null)
const historyBackfill = ref<ReturnType<typeof useHistoryBackfill> | null>(null)

// ─── 加载模板和配置 ───────────────────────────────────────────────────────────

const initTemplateData = async (deviceTemplateId: string) => {
  if (!deviceTemplateId) {
    hasTemplate.value = false
    chartLoading.value = false
    return
  }

  try {
    const res = await deviceTemplateDetail({ id: deviceTemplateId })

    if (res.data) {
      const [telemetryRes, attributesRes, eventsRes, commandsRes] = await Promise.all([
        telemetryApi({ page: 1, page_size: 1000, device_template_id: deviceTemplateId }),
        attributesApi({ page: 1, page_size: 1000, device_template_id: deviceTemplateId }),
        eventsApi({ page: 1, page_size: 1000, device_template_id: deviceTemplateId }),
        commandsApi({ page: 1, page_size: 1000, device_template_id: deviceTemplateId })
      ])

      const telemetryList = Array.isArray(telemetryRes?.data?.list)
        ? telemetryRes.data.list
        : Array.isArray(telemetryRes?.data) ? telemetryRes.data : []
      const attributesList = Array.isArray(attributesRes?.data?.list)
        ? attributesRes.data.list
        : Array.isArray(attributesRes?.data) ? attributesRes.data : []
      const eventsList = Array.isArray(eventsRes?.data?.list)
        ? eventsRes.data.list
        : Array.isArray(eventsRes?.data) ? eventsRes.data : []
      const commandsList = Array.isArray(commandsRes?.data?.list)
        ? commandsRes.data.list
        : Array.isArray(commandsRes?.data) ? commandsRes.data : []

      const platformSource = {
        telemetry: telemetryList,
        attributes: attributesList,
        events: eventsList,
        commands: commandsList
      }

      const extractedFields = extractPlatformFields(platformSource)
      platformFields.value = extractedFields.length > 0 ? extractedFields : extractPlatformFields(res.data)

      if (res.data.web_chart_config) {
        try {
          const configJson = normalizeThingsVisHistoryBindings(JSON.parse(res.data.web_chart_config))
          if (Array.isArray(configJson?.dataSources)) {
            configJson.dataSources.forEach((ds: any) => {
              if (ds?.type === 'PLATFORM_FIELD') {
                ds.config = ds.config || {}
                ds.config.deviceId = props.id
              }
            })
          }
          initialConfig.value = configJson
          hasTemplate.value = true
        } catch (e) {
          console.warn('[TelemetryChart] 解析 web_chart_config 失败', e)
          hasTemplate.value = false
        }
      } else {
        hasTemplate.value = false
      }
    }
  } catch (error) {
    console.error('[TelemetryChart] 加载模板数据失败:', error)
    hasTemplate.value = false
  } finally {
    chartLoading.value = false
  }
}

// ─── ThingsVis ready 回调 ─────────────────────────────────────────────────────

const onVisReady = async () => {
  // tp-02: 历史数据回填
  if (historyBackfill.value) {
    await historyBackfill.value.backfill()
  }
  // tp-04: 告警历史回填
  if (alarmPush.value) {
    await alarmPush.value.backfillAlarmHistory()
  }
  // Push current snapshot so widgets show real values immediately after ready
  await fetchAndUpdateData()
}

// ─── 监听模板ID变化重新加载 ───────────────────────────────────────────────────

watch(() => props.deviceTemplateId, async (newVal) => {
  // 先停止旧的推送
  realtimePush.value?.stop()
  alarmPush.value?.stop()

  if (newVal) {
    await initTemplateData(newVal)

    if (hasTemplate.value) {
      // 初始化 composables
      historyBackfill.value = useHistoryBackfill(
        deviceIdRef,
        platformFields,
        pushHistoryToVis
      )

      realtimePush.value = useRealtimePush(
        deviceIdRef,
        platformFields,
        pushDataToVis,
        fetchAndUpdateData
      )

      alarmPush.value = useAlarmPush(
        deviceIdRef,
        platformFields,
        pushDataToVis,
        pushHistoryToVis
      )

      // 启动实时推送
      realtimePush.value?.start()
      // 启动告警轮询
      alarmPush.value?.start()
    }
  }
}, { immediate: true })

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
  <NCard
    ref="chartCardRef"
    class="device-chart-panel w-full h-full"
    :bordered="false"
    content-style="padding: 0;"
  >
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
  border: 1px solid #e5e7eb;
  background: #fff;
}

.device-chart-panel__state {
  padding: 18px 20px;
}
</style>
