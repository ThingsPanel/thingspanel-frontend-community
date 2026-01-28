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
import { deviceDetail, deviceTemplateDetail } from '@/service/api/device'
import type { PlatformField } from '@/utils/thingsvis/types'

const props = defineProps<{
  id: string
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
      platformFields.value = extractPlatformFields(res.data)

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
 * 获取设备详情
 */
const getDeviceDetail = async () => {
  chartLoading.value = true
  try {
    const { data, error } = await deviceDetail(props.id)

    if (!error && data) {
      if (data.device_config?.device_template_id) {
        await initTemplateData(data.device_config.device_template_id)
      } else {
        hasTemplate.value = false
        chartLoading.value = false
      }
    } else {
      hasTemplate.value = false
      chartLoading.value = false
    }
  } catch (error) {
    console.error('获取设备详情失败:', error)
    hasTemplate.value = false
    chartLoading.value = false
  }
}

/**
 * 推送设备实时数据到编辑器
 * TODO: 这里需要根据实际的设备数据推送机制来实现
 * 可以是 WebSocket、轮询或者其他方式
 */
const pushDeviceData = async () => {
  if (!editorRef.value || !hasTemplate.value) return

  try {
    // 获取设备最新数据
    const { data, error } = await deviceDetail(props.id)

    if (!error && data) {
      // 构造数据对象，根据平台字段推送
      const dataMap: Record<string, any> = {}

      // 示例：从设备数据中提取字段值
      // 这里需要根据实际的数据结构调整
      platformFields.value.forEach((field) => {
        if (data[field.id] !== undefined) {
          dataMap[field.id] = data[field.id]
        }
      })

      // 批量推送数据
      if (Object.keys(dataMap).length > 0) {
        editorRef.value.pushPlatformDataBatch(dataMap)
      }
    }
  } catch (error) {
    console.error('推送设备数据失败:', error)
  }
}

/**
 * 启动数据更新定时器
 */
const startDataUpdate = () => {
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

// 监听设备ID变化
watch(() => props.id, () => {
  stopDataUpdate()
  getDeviceDetail()
}, { immediate: false })

onMounted(() => {
  getDeviceDetail()
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
      />
    </template>
  </n-card>
</template>
