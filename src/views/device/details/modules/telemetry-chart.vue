<!-- eslint-disable prettier/prettier -->
<script setup lang="tsx">
/**
 * 设备详情 - 图表Tab
 * 使用 ThingsVis 嵌入式编辑器预览模式展示图表
 * 通过 PostMessage 推送实时设备数据
 */

import { onMounted, onBeforeUnmount, ref, watch } from 'vue'
import { NEmpty } from 'naive-ui'
import ThingsVisEditor from '@/components/thingsvis/ThingsVisEditor.vue'
import { extractPlatformFields } from '@/utils/thingsvis/platform-fields'
import { deviceDetail, deviceTemplateDetail, telemetryDataCurrent, getAttributeDataSet } from '@/service/api/device'
import { telemetryApi, attributesApi } from '@/service/api'
import type { PlatformField } from '@/utils/thingsvis/types'

const props = defineProps<{
  id: string
  deviceTemplateId?: string
  deviceData?: Record<string, any>
}>()

// 编辑器引用
const editorRef = ref<InstanceType<typeof ThingsVisEditor>>()

// 状态
const chartLoading = ref(true)
const hasTemplate = ref(false)
const initialConfig = ref<any>(null)
const platformFields = ref<PlatformField[]>([])

// WebSocket 或轮询的定时器
let dataUpdateInterval: NodeJS.Timeout | null = null
let lastPushAt = 0
const minPushIntervalMs = 5000

/**
 * 加载模板和配置
 */
const initTemplateData = async (deviceTemplateId: string) => {
  if (!deviceTemplateId) {
    hasTemplate.value = false
    chartLoading.value = false
    return
  }

  try {
    const res = await deviceTemplateDetail({ id: deviceTemplateId })

    if (res.data) {
      // 提取平台字段（优先从物模型接口获取）
      const [telemetryRes, attributesRes] = await Promise.all([
        telemetryApi({ page: 1, page_size: 1000, device_template_id: deviceTemplateId }),
        attributesApi({ page: 1, page_size: 1000, device_template_id: deviceTemplateId })
      ])

      const telemetryList = Array.isArray(telemetryRes?.data?.list)
        ? telemetryRes.data.list
        : Array.isArray(telemetryRes?.data)
          ? telemetryRes.data
          : []

      const attributesList = Array.isArray(attributesRes?.data?.list)
        ? attributesRes.data.list
        : Array.isArray(attributesRes?.data)
          ? attributesRes.data
          : []

      const platformSource = {
        telemetry: telemetryList,
        attributes: attributesList
      }

      const extractedFields = extractPlatformFields(platformSource)
      platformFields.value = extractedFields.length > 0 ? extractedFields : extractPlatformFields(res.data)

      // 加载 web_chart_config
      if (res.data.web_chart_config) {
        try {
          initialConfig.value = JSON.parse(res.data.web_chart_config)
          hasTemplate.value = true
        } catch (e) {
          console.warn('解析 web_chart_config 失败', e)
          hasTemplate.value = false
        }
      } else {
        hasTemplate.value = false
      }
    }
  } catch (error) {
    console.error('加载模板数据失败:', error)
    hasTemplate.value = false
  } finally {
    chartLoading.value = false
  }
}

/**
 * 根据模板ID初始化图表配置
 */
const initByTemplateId = async () => {
  chartLoading.value = true

  if (!props.deviceTemplateId) {
    hasTemplate.value = false
    chartLoading.value = false
    return
  }

  await initTemplateData(props.deviceTemplateId)
}

/**
 * 获取遥测/属性当前值（设备详情页实际值来源）
 */
const fetchCurrentDataMaps = async () => {
  if (!props.id) return { telemetryMap: {}, attributeMap: {} }

  const [telemetryRes, attributeRes] = await Promise.all([
    telemetryDataCurrent(props.id),
    getAttributeDataSet({ device_id: props.id })
  ])

  const telemetryList = Array.isArray(telemetryRes?.data)
    ? telemetryRes.data
    : Array.isArray(telemetryRes?.data?.value)
      ? telemetryRes.data.value
      : []

  const attributeList = Array.isArray(attributeRes?.data)
    ? attributeRes.data
    : Array.isArray(attributeRes?.data?.list)
      ? attributeRes.data.list
      : Array.isArray(attributeRes?.data?.value)
        ? attributeRes.data.value
        : []

  const telemetryMap: Record<string, any> = {}
  const telemetryLabelMap: Record<string, any> = {}
  telemetryList.forEach((item: any) => {
    if (item?.key !== undefined) telemetryMap[item.key] = item.value
    if (item?.label) telemetryLabelMap[item.label] = item.value
  })

  const attributeMap: Record<string, any> = {}
  const attributeLabelMap: Record<string, any> = {}
  attributeList.forEach((item: any) => {
    if (item?.key !== undefined) attributeMap[item.key] = item.value
    if (item?.label) attributeLabelMap[item.label] = item.value
  })

  return { telemetryMap, telemetryLabelMap, attributeMap, attributeLabelMap }
}

/**
 * 推送设备实时数据到编辑器
 * 从设备详情API中提取遥测和属性数据，并推送到ThingsVis编辑器
 */
const pushDeviceData = async () => {
  if (!editorRef.value || !hasTemplate.value) return

  const now = Date.now()
  if (now - lastPushAt < minPushIntervalMs) return
  lastPushAt = now

  try {
    const { telemetryMap, telemetryLabelMap, attributeMap, attributeLabelMap } = await fetchCurrentDataMaps()

    const dataMap: Record<string, any> = {}
    platformFields.value.forEach((field) => {
      if (field.dataType === 'telemetry') {
        const telemetryValue =
          telemetryMap[field.id] ??
          telemetryMap[field.name] ??
          telemetryLabelMap[field.id] ??
          telemetryLabelMap[field.name]
        if (telemetryValue !== undefined) dataMap[field.id] = telemetryValue
      }
      if (field.dataType === 'attribute') {
        const attributeValue =
          attributeMap[field.id] ??
          attributeMap[field.name] ??
          attributeLabelMap[field.id] ??
          attributeLabelMap[field.name]
        if (attributeValue !== undefined) dataMap[field.id] = attributeValue
      }
    })

    // 调试日志 - 方便排查数据映射问题
    if (Object.keys(dataMap).length > 0) {
      console.log('[ThingsVis] 推送设备数据:', dataMap)
      editorRef.value.pushPlatformDataBatch(dataMap)
    } else {
      console.warn('[ThingsVis] 未找到匹配的平台字段数据', {
        platformFields: platformFields.value.map(f => f.id)
      })
    }
  } catch (error) {
    console.error('[ThingsVis] 推送设备数据失败:', error)
  }
}

/**
 * 启动数据更新定时器
 */
const startDataUpdate = () => {
  if (dataUpdateInterval) {
    clearInterval(dataUpdateInterval)
    dataUpdateInterval = null
  }
  // 首次立即推送
  pushDeviceData()

  // 每5秒更新一次数据
  dataUpdateInterval = setInterval(() => {
    pushDeviceData()
  }, 5000)
}

/**
 * 停止数据更新
 */
const stopDataUpdate = () => {
  if (dataUpdateInterval) {
    clearInterval(dataUpdateInterval)
    dataUpdateInterval = null
  }
}

/**
 * 编辑器就绪后开始推送数据
 */
const handleEditorReady = () => {
  // 编辑器加载完成后开始推送数据
  startDataUpdate()
}

// 监听模板ID变化
watch(() => props.deviceTemplateId, () => {
  stopDataUpdate()
  initByTemplateId()
}, { immediate: false })

// 监听外部设备数据变化（来自详情页Tab）
watch(
  () => props.deviceData,
  () => {
    if (editorRef.value?.editorReady?.value) {
      pushDeviceData()
    }
  },
  { deep: true }
)

onMounted(() => {
  initByTemplateId()
})

onBeforeUnmount(() => {
  stopDataUpdate()
})
</script>

<template>
  <n-card class="w-full">
    <template v-if="chartLoading">
      <n-skeleton text :repeat="3" />
      <n-skeleton height="180px" class="mt-12px" />
    </template>

    <template v-else-if="!hasTemplate">
      <NEmpty description="未配置图表数据或设备未绑定模板" />
    </template>

    <template v-else>
      <ThingsVisEditor
        ref="editorRef"
        mode="viewer"
        :initial-config="initialConfig"
        :platform-fields="platformFields"
        height="600px"
        @ready="handleEditorReady"
        @request-field-data="pushDeviceData"
      />
    </template>
  </n-card>
</template>
