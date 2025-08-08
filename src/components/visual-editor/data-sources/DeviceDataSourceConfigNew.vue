<template>
  <div class="device-data-source-config-new">
    <n-form :model="config" label-placement="top" size="small">
      <!-- 组件API配置信息显示 -->
      <template v-if="componentApiConfig">
        <n-alert type="info" show-icon>
          <template #icon>
            <span>🔧</span>
          </template>
          <strong>{{ componentApiConfig.description }}</strong>
          <div class="config-details">
            <span>API类型: {{ config.apiType }}</span>
            <span v-if="componentApiConfig.requiresPolling">• 支持轮询</span>
            <span v-if="componentApiConfig.isControlComponent">• 控制组件</span>
          </div>
        </n-alert>
      </template>

      <!-- 手动API选择（仅在没有组件类型时显示） -->
      <template v-if="!props.componentType">
        <ApiTypeSelector v-model="config.apiType" @api-change="onApiTypeChange" />
      </template>

      <!-- 第二步：根据API类型动态生成参数表单 -->
      <template v-if="config.apiType">
        <DynamicParameterForm
          v-model="config.parameters"
          :api-type="config.apiType"
          @parameters-change="onParametersChange"
        />

        <!-- 第三步：API测试 -->
        <template v-if="canTestApi">
          <ApiTester
            :api-type="config.apiType"
            :parameters="config.parameters"
            @test-success="onTestSuccess"
            @test-error="onTestError"
          />
        </template>

        <!-- 第四步：数据映射配置 -->
        <template v-if="fetchedData">
          <n-divider title-placement="left">数据映射配置</n-divider>
          <DataMappingConfig :data="fetchedData" :mappings="config.dataPaths" @update:mappings="onDataPathsUpdate" />
        </template>

        <!-- 第五步：轮询配置 -->
        <template v-if="config.parameters && Object.keys(config.parameters).length > 0">
          <PollingConfig v-model="config.polling" @polling-change="onPollingChange" />
        </template>
      </template>

      <!-- 数据预览 -->
      <template v-if="fetchedData">
        <n-divider title-placement="left">数据预览</n-divider>
        <n-card size="small" title="API返回数据">
          <template #header-extra>
            <n-button size="tiny" text @click="copyData">复制数据</n-button>
          </template>
          <div class="data-preview">
            <pre>{{ JSON.stringify(fetchedData, null, 2) }}</pre>
          </div>
        </n-card>
      </template>
    </n-form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { NForm, NDivider, NCard, NButton, NAlert } from 'naive-ui'
// 导入子组件
import ApiTypeSelector from './components/ApiTypeSelector.vue'
import DynamicParameterForm from './components/DynamicParameterForm.vue'
import ApiTester from './components/ApiTester.vue'
import DataMappingConfig from './DataMappingConfig.vue'
import PollingConfig from './components/PollingConfig.vue'
import type { DeviceDataSource, DeviceDataSourceNew } from '../../types/data-source'
// 导入组件API配置系统
import { getComponentApiConfig, selectApiForComponent } from '@/components/visual-editor/core/component-api-config'

interface Props {
  modelValue?: DeviceDataSource | DeviceDataSourceNew
  /** 组件类型，用于自动选择合适的API配置 */
  componentType?: string
}

interface Emits {
  'update:modelValue': [value: DeviceDataSource]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// API配置数据
const config = ref<DeviceDataSourceNew>({
  type: 'device',
  enabled: true,
  name: '设备数据源',
  apiType: '',
  parameters: {},
  polling: {
    enabled: false,
    interval: 5000,
    status: 'stopped'
  },
  dataPaths: []
})

// 获取的数据
const fetchedData = ref<any>(null)

// 计算组件API配置
const componentApiConfig = computed(() => {
  return props.componentType ? getComponentApiConfig(props.componentType) : null
})

// 初始化组件类型配置
const initializeComponentConfig = (componentType: string) => {
  const apiConfig = getComponentApiConfig(componentType)
  if (apiConfig) {
    console.log('🔧 DeviceDataSourceConfigNew - 根据组件类型自动配置API:', {
      componentType,
      apiType: apiConfig.apiType,
      description: apiConfig.description
    })

    // 自动设置API类型
    config.value.apiType = apiConfig.apiType

    // 设置默认参数
    if (apiConfig.defaultParameters) {
      config.value.parameters = { ...apiConfig.defaultParameters }
    }

    // 设置轮询配置
    if (apiConfig.requiresPolling) {
      config.value.polling.enabled = true
    }

    emitUpdate()
  }
}

// 计算是否可以测试API
const canTestApi = computed(() => {
  if (!config.value.apiType || !config.value.parameters) return false

  const params = config.value.parameters
  // 根据不同API类型检查必需参数
  switch (config.value.apiType) {
    case 'telemetryDataCurrentKeys':
      return params.device_id && params.keys
    case 'telemetryDataHistoryList':
      return params.device_id && params.key && params.time_range && params.aggregate_function && params.aggregate_window
    case 'getAttributeDataSet':
      return params.device_id
    case 'getAttributeDatasKey':
      return params.device_id && params.key
    case 'commandDataPub':
    case 'attributeDataPub':
    case 'telemetryDataPub':
      return params.device_id && params.key && params.value !== undefined
    default:
      return false
  }
})

// 事件处理函数
const onApiTypeChange = (apiType: string) => {
  console.log('🔧 DeviceDataSourceConfigNew - API类型变化:', apiType)
  // 重置参数和数据
  config.value.parameters = {}
  fetchedData.value = null
  emitUpdate()
}

const onParametersChange = (parameters: Record<string, any>) => {
  console.log('🔧 DeviceDataSourceConfigNew - 参数变化:', parameters)
  config.value.parameters = parameters
  emitUpdate()
}

const onTestSuccess = (data: any) => {
  console.log('🔧 DeviceDataSourceConfigNew - API测试成功:', data)
  fetchedData.value = data
  emitUpdate()
}

const onTestError = (error: any) => {
  console.error('🔧 DeviceDataSourceConfigNew - API测试失败:', error)
  fetchedData.value = null
}

const onDataPathsUpdate = (dataPaths: any[]) => {
  console.log('🔧 DeviceDataSourceConfigNew - 数据路径映射更新:', dataPaths)
  config.value.dataPaths = dataPaths
  emitUpdate()
}

const onPollingChange = () => {
  console.log('🔧 DeviceDataSourceConfigNew - 轮询配置变化')
  emitUpdate()
}

const copyData = () => {
  if (fetchedData.value) {
    navigator.clipboard.writeText(JSON.stringify(fetchedData.value, null, 2))
    window.$message?.success('数据已复制到剪贴板')
  }
}

// 发出更新事件
const emitUpdate = () => {
  // 转换为兼容的DeviceDataSource格式
  const deviceDataSource: DeviceDataSource = {
    type: 'device',
    enabled: config.value.enabled,
    name: config.value.name,
    // 保存API类型和参数用于回显
    apiType: config.value.apiType,
    parameters: config.value.parameters,
    polling: config.value.polling,
    dataPaths: config.value.dataPaths || [],
    // 为了兼容旧系统，从parameters中提取关键信息
    deviceId: config.value.parameters?.device_id || '',
    metricsId: config.value.parameters?.key || config.value.parameters?.keys || '',
    metricsType: getMetricsTypeFromApiType(config.value.apiType),
    dataMode: getDataModeFromApiType(config.value.apiType),
    timeRange: config.value.parameters?.time_range || '1h',
    aggregateFunction: config.value.parameters?.aggregate_function || 'avg',
    pollingType: config.value.polling.enabled ? 'timer' : 'manual',
    refreshInterval: config.value.polling.interval
  }

  emit('update:modelValue', deviceDataSource)
}

// 工具函数：从API类型获取指标类型
const getMetricsTypeFromApiType = (apiType: string): string => {
  if (apiType.includes('telemetry')) return 'telemetry'
  if (apiType.includes('attribute') || apiType.includes('Attribute')) return 'attributes'
  if (apiType.includes('command')) return 'command'
  if (apiType.includes('event')) return 'event'
  return 'telemetry'
}

// 工具函数：从API类型获取数据模式
const getDataModeFromApiType = (apiType: string): string => {
  if (apiType.includes('History') || apiType.includes('history')) return 'history'
  return 'latest'
}

// 从旧配置构建参数
const buildParametersFromOldConfig = (oldConfig: DeviceDataSource, apiType: string): Record<string, any> => {
  const params: Record<string, any> = {}

  if (oldConfig.deviceId) params.device_id = oldConfig.deviceId
  if (oldConfig.metricsId) {
    if (apiType === 'telemetryDataCurrentKeys') {
      params.keys = oldConfig.metricsId
    } else {
      params.key = oldConfig.metricsId
    }
  }

  if (apiType === 'telemetryDataHistoryList') {
    params.time_range = oldConfig.timeRange || 'last_1h'
    params.aggregate_function = oldConfig.aggregateFunction || 'avg'
    params.aggregate_window = '1m' // 默认聚合窗口
  }

  return params
}

// 监听组件类型变化，自动配置API
watch(
  () => props.componentType,
  newComponentType => {
    if (newComponentType) {
      initializeComponentConfig(newComponentType)
    }
  },
  { immediate: true }
)

// 监听外部配置变化，实现回显
watch(
  () => props.modelValue,
  newValue => {
    if (newValue && newValue !== config.value) {
      console.log('🔧 DeviceDataSourceConfigNew - 外部配置变化，开始回显:', newValue)

      // 检查是否是新格式的配置
      if ('apiType' in newValue && newValue.apiType) {
        // 新格式直接赋值
        const newConfig = newValue as DeviceDataSourceNew
        config.value = {
          ...config.value,
          ...newConfig
        }
      } else {
        // 旧格式转换为新格式 - 根据数据推断API类型
        const oldConfig = newValue as DeviceDataSource
        let apiType = 'telemetryDataCurrentKeys' // 默认

        if (oldConfig.metricsType === 'telemetry' && oldConfig.dataMode === 'history') {
          apiType = 'telemetryDataHistoryList'
        } else if (oldConfig.metricsType === 'attributes') {
          apiType = oldConfig.metricsId ? 'getAttributeDatasKey' : 'getAttributeDataSet'
        }

        config.value = {
          ...config.value,
          apiType,
          parameters: buildParametersFromOldConfig(oldConfig, apiType),
          polling: oldConfig.polling || {
            enabled: oldConfig.pollingType === 'timer',
            interval: oldConfig.refreshInterval || 5000,
            status: 'stopped'
          },
          dataPaths: oldConfig.dataPaths || []
        }
      }

      console.log('🔧 DeviceDataSourceConfigNew - 回显配置完成:', config.value)
    }
  },
  { deep: true, immediate: true }
)
</script>

<style scoped>
.device-data-source-config-new {
  width: 100%;
}

.data-preview {
  max-height: 300px;
  overflow-y: auto;
  background: #f5f5f5;
  padding: 12px;
  border-radius: 4px;
  font-size: 12px;
  font-family: 'Courier New', monospace;
}

.config-details {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 8px;
  font-size: 12px;
  color: #666;
}

.config-details span {
  background: #f0f2f5;
  padding: 2px 6px;
  border-radius: 3px;
  font-family: 'Courier New', monospace;
}
</style>
