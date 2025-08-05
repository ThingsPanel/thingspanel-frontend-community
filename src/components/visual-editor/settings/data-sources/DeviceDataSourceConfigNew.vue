<template>
  <div class="device-data-source-config-new">
    <!-- 使用新的设备API配置系统 -->
    <DeviceApiConfig v-model="apiConfig" @config-saved="onConfigSaved" @config-tested="onConfigTested" />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import DeviceApiConfig from './device-apis/components/DeviceApiConfig.vue'
import type { DeviceDataSource } from '../../types/data-source'

interface Props {
  modelValue?: DeviceDataSource
}

interface Emits {
  'update:modelValue': [value: DeviceDataSource]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 新的API配置
const apiConfig = ref({
  deviceId: '',
  apiType: 'telemetry_current',
  parameters: {},
  polling: {
    enabled: false,
    interval: 5000,
    status: 'stopped'
  },
  dataPaths: []
})

// 配置保存处理
const onConfigSaved = (config: any) => {
  // 将新的API配置转换为旧的DeviceDataSource格式
  const deviceDataSource: DeviceDataSource = {
    type: 'device',
    deviceId: config.deviceId,
    metricsType: getMetricsTypeFromApiType(config.apiType),
    dataMode: getDataModeFromApiType(config.apiType),
    metricsId: config.parameters.key || config.parameters.keys || '',
    timeRange: config.parameters.time_range || '1h',
    aggregateFunction: config.parameters.aggregate_function || 'avg',
    pollingType: config.polling.enabled ? 'timer' : 'manual',
    refreshInterval: config.polling.interval || 5000,
    dataPaths: config.dataPaths || []
  }

  emit('update:modelValue', deviceDataSource)
  console.log('配置已保存并转换为DeviceDataSource格式:', deviceDataSource)
}

// 配置测试处理
const onConfigTested = (result: any) => {
  console.log('配置测试结果:', result)
}

// 工具函数：从API类型获取指标类型
const getMetricsTypeFromApiType = (apiType: string): string => {
  if (apiType.startsWith('telemetry_')) return 'telemetry'
  if (apiType.startsWith('attributes_')) return 'attributes'
  if (apiType.startsWith('event_')) return 'event'
  if (apiType.startsWith('command_')) return 'command'
  if (apiType.startsWith('device_')) return 'device_info'
  if (apiType.startsWith('simulation_')) return 'simulation'
  return 'telemetry'
}

// 工具函数：从API类型获取数据模式
const getDataModeFromApiType = (apiType: string): string => {
  if (apiType.includes('history') || apiType.includes('logs')) return 'history'
  return 'latest'
}

// 监听外部配置变化，转换为新的API配置格式
watch(
  () => props.modelValue,
  newValue => {
    if (newValue) {
      // 将旧的DeviceDataSource格式转换为新的API配置格式
      apiConfig.value = {
        deviceId: newValue.deviceId || '',
        apiType: getApiTypeFromMetricsType(newValue.metricsType, newValue.dataMode),
        parameters: {
          key: newValue.metricsId,
          keys: newValue.metricsId,
          time_range: newValue.timeRange,
          aggregate_function: newValue.aggregateFunction
        },
        polling: {
          enabled: newValue.pollingType === 'timer',
          interval: newValue.refreshInterval || 5000,
          status: 'stopped'
        },
        dataPaths: newValue.dataPaths || []
      }
    }
  },
  { deep: true, immediate: true }
)

// 工具函数：从指标类型和数据模式获取API类型
const getApiTypeFromMetricsType = (metricsType: string, dataMode: string): string => {
  switch (metricsType) {
    case 'telemetry':
      return dataMode === 'history' ? 'telemetry_history' : 'telemetry_current'
    case 'attributes':
      return dataMode === 'history' ? 'attributes_logs' : 'attributes_dataset'
    case 'event':
      return 'event_dataset'
    case 'command':
      return 'command_logs'
    case 'device_info':
      return 'device_detail'
    case 'simulation':
      return 'simulation_get'
    default:
      return 'telemetry_current'
  }
}
</script>

<style scoped>
.device-data-source-config-new {
  width: 100%;
}
</style>
