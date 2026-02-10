
<script setup lang="tsx">
/**
 * 设备详情 - 图表Tab
 * 使用 ThingsVis 嵌入式编辑器预览模式展示图表
 * 通过 data prop 推送实时设备数据
 */

import { onMounted, onBeforeUnmount, ref, watch } from 'vue'
import { NEmpty, NCard, NSkeleton } from 'naive-ui'
import ThingsVisWidget from '@/components/thingsvis/ThingsVisWidget.vue'
import { extractPlatformFields } from '@/utils/thingsvis/platform-fields'
import { deviceTemplateDetail, telemetryDataCurrent, getAttributeDataSet } from '@/service/api/device'
import { telemetryApi, attributesApi } from '@/service/api'
import type { PlatformField } from '@/utils/thingsvis/types'

const props = defineProps<{
  /** 设备ID */
  id: string
  /** 模板ID */
  deviceTemplateId?: string
  /** 设备详情数据 (可选) */
  deviceData?: Record<string, any>
}>()

// 状态
const chartLoading = ref(true)
const hasTemplate = ref(false)
const initialConfig = ref<any>(null)
const platformFields = ref<PlatformField[]>([])
const currentData = ref<Record<string, any>>({}) // 实时数据

// WebSocket 或轮询
let dataUpdateInterval: NodeJS.Timeout | null = null

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
      // 提取平台字段
      const [telemetryRes, attributesRes] = await Promise.all([
        telemetryApi({ page: 1, page_size: 1000, device_template_id: deviceTemplateId }),
        attributesApi({ page: 1, page_size: 1000, device_template_id: deviceTemplateId })
      ])

      const telemetryList = Array.isArray(telemetryRes?.data?.list) ? telemetryRes.data.list : []
      const attributesList = Array.isArray(attributesRes?.data?.list) ? attributesRes.data.list : []

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
 * 获取当前值并更新响应式数据
 */
const fetchAndUpdateData = async () => {
  if (!props.id || !hasTemplate.value) return

  try {
    const [telemetryRes, attributeRes] = await Promise.all([
      telemetryDataCurrent(props.id),
      getAttributeDataSet({ device_id: props.id })
    ])

    // 如果接口返回结构不一致，需要做兼容处理
    // (此处沿用原有逻辑解析list)
    const telemetryList = telemetryRes?.data || telemetryRes?.data?.value || []
    const attributeList = attributeRes?.data || attributeRes?.data?.list || attributeRes?.data?.value || []

    const dataMap: Record<string, any> = {}

    // 构建映射字典
    const kvMap: Record<string, any> = {}

    // 辅助函数: 扁平化数据到 kvMap
    const processItem = (item: any) => {
       if (item?.key !== undefined) kvMap[item.key] = item.value
       if (item?.label) kvMap[item.label] = item.value
    }

    if (Array.isArray(telemetryList)) telemetryList.forEach(processItem)
    if (Array.isArray(attributeList)) attributeList.forEach(processItem)

    // 根据 platformFields 筛选所需数据
    platformFields.value.forEach((field) => {
      const val = kvMap[field.id] ?? kvMap[field.name]
      if (val !== undefined) {
        dataMap[field.id] = val
      }
    })

    if (Object.keys(dataMap).length > 0) {
      currentData.value = dataMap
    }
  } catch (err) {
    console.error('获取设备实时数据失败:', err)
  }
}

const startPolling = () => {
  stopPolling()
  fetchAndUpdateData() // 立即执行一次
  dataUpdateInterval = setInterval(fetchAndUpdateData, 5000)
}

const stopPolling = () => {
  if (dataUpdateInterval) {
    clearInterval(dataUpdateInterval)
    dataUpdateInterval = null
  }
}

// 监听 ID 变化重新加载
watch(() => props.deviceTemplateId, async (newVal) => {
  stopPolling()
  if (newVal) {
    await initTemplateData(newVal)
    if (hasTemplate.value) startPolling()
  }
}, { immediate: true })

onBeforeUnmount(() => {
  stopPolling()
})
</script>

<template>
  <NCard class="w-full">
    <template v-if="chartLoading">
      <NSkeleton text :repeat="3" />
      <NSkeleton height="180px" class="mt-12px" />
    </template>

    <template v-else-if="!hasTemplate">
      <NEmpty description="未配置图表数据或设备未绑定模板" />
    </template>

    <template v-else>
      <ThingsVisWidget
        mode="viewer"
        :config="initialConfig"
        :platform-fields="platformFields"
        :data="currentData"
        height="600px"
      />
    </template>
  </NCard>
</template>
