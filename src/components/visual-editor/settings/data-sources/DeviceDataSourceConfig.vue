<template>
  <div class="device-data-source-config">
    <n-form :model="config" label-placement="left" label-width="80px" size="small">
      <n-form-item label="名称">
        <n-input 
          v-model:value="config.name" 
          placeholder="设备数据源"
          @update:value="updateConfig"
        />
      </n-form-item>
      
      <n-form-item label="描述">
        <n-input 
          v-model:value="config.description" 
          placeholder="描述"
          @update:value="updateConfig"
        />
      </n-form-item>
      
      <n-form-item label="设备">
        <n-select
          v-model:value="config.deviceId"
          :options="deviceOptions"
          placeholder="选择设备"
          filterable
          :loading="isLoadingDevices"
          @update:value="onDeviceChange"
        />
      </n-form-item>
      
      <n-form-item label="数据类型">
        <n-select
          v-model:value="config.metricsType"
          :options="metricsTypeOptions"
          placeholder="选择类型"
          @update:value="updateConfig"
        />
      </n-form-item>
      
      <n-form-item label="指标">
        <n-select
          v-model:value="config.metricsId"
          :options="metricsOptions"
          placeholder="选择指标"
          filterable
          :loading="isLoadingMetrics"
          :show="config.metricsShow"
          :render-option="metricsOptionRender"
          @update:show="onMetricsDropdownShow"
          @update:value="onMetricsChange"
        />
      </n-form-item>
      
      <n-form-item label="指标名称">
        <n-input 
          v-model:value="config.metricsName" 
          placeholder="显示名称"
          @update:value="updateConfig"
        />
      </n-form-item>
      
      <n-form-item label="聚合函数">
        <n-select
          v-model:value="config.aggregateFunction"
          :options="aggregateOptions"
          placeholder="选择函数"
          @update:value="updateConfig"
        />
      </n-form-item>
      
      <n-form-item label="时间范围">
        <n-select
          v-model:value="config.timeRange"
          :options="timeRangeOptions"
          placeholder="选择范围"
          @update:value="updateConfig"
        />
      </n-form-item>

      <n-form-item label="刷新间隔">
        <n-input-number
          v-model:value="config.refreshInterval"
          :min="0"
          :max="3600"
          placeholder="0=不刷新"
          @update:value="updateConfig"
        />
      </n-form-item>

      <n-form-item>
        <n-button
          type="primary"
          size="small"
          :loading="isTesting"
          :disabled="!config.deviceId || !config.metricsId"
          @click="testDataSource"
        >
          测试
        </n-button>
      </n-form-item>
    </n-form>

    <div v-if="testResult" class="test-result">
      <n-alert
        :type="testResult.success ? 'success' : 'error'"
        :title="testResult.message"
        size="small"
      />
      <div v-if="testResult.data" class="response-data">
        <pre>{{ JSON.stringify(testResult.data, null, 2) }}</pre>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, reactive, h } from 'vue'
import { NForm, NFormItem, NInput, NSelect, NInputNumber, NButton, NAlert, NCard, NSpace } from 'naive-ui'
import type { DeviceDataSource } from '../../types/data-source'
import { deviceListForPanel, deviceMetricsList } from '@/service/api'

interface Props {
  modelValue: DeviceDataSource
}

interface Emits {
  'update:modelValue': [value: DeviceDataSource]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const config = ref<DeviceDataSource>({ ...props.modelValue })

// 加载状态
const isLoadingDevices = ref(false)
const isLoadingMetrics = ref(false)
const isTesting = ref(false)

// 测试结果
const testResult = ref<{
  success: boolean
  message: string
  data?: any
} | null>(null)

// 设备选项
const deviceOptions = ref<Array<{ label: string; value: string; name?: string }>>([])

// 指标选项
const metricsOptions = ref<any[]>([])

// 选项配置
const metricsTypeOptions = [
  { label: '遥测数据', value: 'telemetry' },
  { label: '属性数据', value: 'attributes' },
  { label: '事件数据', value: 'event' },
  { label: '命令数据', value: 'command' }
]

const aggregateOptions = [
  { label: '平均值', value: 'avg' },
  { label: '最大值', value: 'max' },
  { label: '最小值', value: 'min' },
  { label: '求和', value: 'sum' },
  { label: '计数', value: 'count' }
]

const timeRangeOptions = [
  { label: '最近5分钟', value: 'last_5m' },
  { label: '最近15分钟', value: 'last_15m' },
  { label: '最近30分钟', value: 'last_30m' },
  { label: '最近1小时', value: 'last_1h' },
  { label: '最近3小时', value: 'last_3h' },
  { label: '最近6小时', value: 'last_6h' },
  { label: '最近12小时', value: 'last_12h' },
  { label: '最近24小时', value: 'last_24h' },
  { label: '最近3天', value: 'last_3d' },
  { label: '最近7天', value: 'last_7d' }
]

// 获取设备列表
const getDeviceList = async () => {
  isLoadingDevices.value = true
  try {
    const res = await deviceListForPanel({})
    deviceOptions.value = (res.data || []).map((device: any) => ({
      label: device.name,
      value: device.id,
      name: device.name
    }))
    console.log('🔧 DeviceDataSourceConfig - 设备列表加载成功:', deviceOptions.value)
  } catch (error) {
    console.error('🔧 DeviceDataSourceConfig - 设备列表加载失败:', error)
  } finally {
    isLoadingDevices.value = false
  }
}

// 获取指标列表
const getMetricsList = async (deviceId: string) => {
  if (!deviceId) return
  
  isLoadingMetrics.value = true
  try {
    const res = await deviceMetricsList(deviceId)
    metricsOptions.value = res?.data || []
    console.log('🔧 DeviceDataSourceConfig - 指标列表加载成功:', metricsOptions.value)
  } catch (error) {
    console.error('🔧 DeviceDataSourceConfig - 指标列表加载失败:', error)
    metricsOptions.value = []
  } finally {
    isLoadingMetrics.value = false
  }
}

// 设备选择变化
const onDeviceChange = async (deviceId: string) => {
  config.value.deviceId = deviceId
  config.value.metricsId = ''
  config.value.metricsName = ''
  config.value.metricsOptions = []
  config.value.metricsOptionsFetched = false
  
  if (deviceId) {
    await getMetricsList(deviceId)
  }
  
  updateConfig()
}

// 指标下拉框显示/隐藏
const onMetricsDropdownShow = async (show: boolean) => {
  config.value.metricsShow = show
  
  if (show && config.value.deviceId && !config.value.metricsOptionsFetched) {
    await getMetricsList(config.value.deviceId)
    config.value.metricsOptionsFetched = true
  }
}

// 指标选择变化
const onMetricsChange = (metricsId: string) => {
  config.value.metricsId = metricsId
  
  // 根据选择的指标更新指标名称
  const selectedMetric = metricsOptions.value.find((option: any) => 
    option.options?.some((opt: any) => opt.key === metricsId)
  )
  
  if (selectedMetric) {
    const metric = selectedMetric.options.find((opt: any) => opt.key === metricsId)
    if (metric) {
      config.value.metricsName = metric.label || metric.key
      config.value.metricsType = selectedMetric.data_source_type
      config.value.metricsDataType = metric.data_type
    }
  }
  
  updateConfig()
}

// 指标选项渲染
const metricsOptionRender = (info: any) => {
  // 使用 h 函数创建虚拟节点
  return h('div', { class: 'border-b border-#d9d9d9 p-x-10px p-y-15px' }, [
    h('div', { class: 'm-b-5px' }, [
      h('span', { style: 'font-size: 16px;color:#999' }, info?.option?.data_source_type)
    ]),
    ...(info?.option?.options?.map((it: any) => {
      if (!it.label) return null
      
      return h('div', {
        class: 'm-b-2px',
        onClick: () => {
          config.value.metricsId = it.key
          config.value.metricsName = it.label || ''
          config.value.metricsType = info?.option?.data_source_type
          config.value.metricsDataType = it.data_type
          config.value.metricsShow = false
          updateConfig()
        }
      }, [
        it.label ? h('div', { class: 'flex items-center gap-5px' }, [
          h('div', { class: 'flex flex-1 items-center gap-5px' }, [
            h('span', it.label),
            h('span', { class: 'color-#cccc' }, `(${it.key})`)
          ]),
          h('span', { class: 'text-#999' }, it.data_type)
        ]) : h('div', { class: 'flex items-center gap-5px' }, [
          h('span', { class: 'flex-1' }, it.key),
          h('span', { class: 'text-#999' }, it.data_type)
        ])
      ])
    }) || [])
  ])
}

// 测试数据源
const testDataSource = async () => {
  if (!config.value.deviceId || !config.value.metricsId) {
    testResult.value = {
      success: false,
      message: '请先选择设备和指标'
    }
    return
  }

  isTesting.value = true
  testResult.value = null

  try {
    // 这里应该调用实际的设备数据API
    // 暂时返回模拟数据
    const mockData = {
      value: Math.random() * 100,
      timestamp: Date.now(),
      unit: '%',
      deviceId: config.value.deviceId,
      metricsId: config.value.metricsId,
      metricsName: config.value.metricsName
    }
    
    testResult.value = {
      success: true,
      message: '设备数据源测试成功',
      data: mockData
    }

    console.log('🔧 DeviceDataSourceConfig - 测试成功:', mockData)

  } catch (error) {
    testResult.value = {
      success: false,
      message: error instanceof Error ? error.message : '测试失败'
    }
    
    console.error('🔧 DeviceDataSourceConfig - 测试失败:', error)
  } finally {
    isTesting.value = false
  }
}

// 更新配置
const updateConfig = () => {
  emit('update:modelValue', { ...config.value })
}

// 监听外部变化
watch(() => props.modelValue, (newValue) => {
  config.value = { ...newValue }
}, { deep: true })

// 初始化时加载设备列表
getDeviceList()
</script>

<style scoped>
.device-data-source-config {
  padding: 8px;
}

.test-result {
  margin-top: 8px;
}

.response-data {
  margin-top: 8px;
}

.response-data pre {
  background-color: #f5f5f5;
  padding: 8px;
  border-radius: 4px;
  font-family: monospace;
  font-size: 11px;
  max-height: 120px;
  overflow: auto;
  white-space: pre-wrap;
}
</style> 