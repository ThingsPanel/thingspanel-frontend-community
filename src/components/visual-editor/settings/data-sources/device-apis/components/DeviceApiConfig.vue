<template>
  <div class="device-api-config">
    <n-card title="设备API配置" size="large">
      <!-- 第一步：选择API接口类型 -->
      <n-form-item label="API接口类型" required>
        <n-select
          v-model:value="selectedApiType"
          :options="apiTypeOptions"
          placeholder="请选择API接口类型"
          @update:value="onApiTypeChange"
        />
      </n-form-item>

      <!-- 第二步：设备选择 -->
      <DeviceSelector v-model="config.deviceId" @device-change="onDeviceChange" />

      <!-- 第三步：根据API类型显示不同的表单 -->
      <template v-if="selectedApiType && config.deviceId">
        <!-- 遥测数据表单 -->
        <template v-if="isTelemetryApi">
          <n-divider title-placement="left">遥测数据配置</n-divider>
          <TelemetryApiForm v-model="config.parameters" :api-type="selectedApiType" @data-fetched="onDataFetched" />
        </template>

        <!-- 属性数据表单 -->
        <template v-if="isAttributesApi">
          <n-divider title-placement="left">属性数据配置</n-divider>
          <AttributesApiForm v-model="config.parameters" :api-type="selectedApiType" @data-fetched="onDataFetched" />
        </template>

        <!-- 事件数据表单 -->
        <template v-if="isEventApi">
          <n-divider title-placement="left">事件数据配置</n-divider>
          <EventApiForm v-model="config.parameters" :api-type="selectedApiType" @data-fetched="onDataFetched" />
        </template>

        <!-- 命令数据表单 -->
        <template v-if="isCommandApi">
          <n-divider title-placement="left">命令数据配置</n-divider>
          <CommandApiForm v-model="config.parameters" :api-type="selectedApiType" @data-fetched="onDataFetched" />
        </template>

        <!-- 设备信息表单 -->
        <template v-if="isDeviceInfoApi">
          <n-divider title-placement="left">设备信息配置</n-divider>
          <DeviceInfoApiForm v-model="config.parameters" :api-type="selectedApiType" @data-fetched="onDataFetched" />
        </template>

        <!-- 模拟数据表单 -->
        <template v-if="isSimulationApi">
          <n-divider title-placement="left">模拟数据配置</n-divider>
          <SimulationApiForm v-model="config.parameters" :api-type="selectedApiType" @data-fetched="onDataFetched" />
        </template>
      </template>

      <!-- 第四步：轮询配置 -->
      <template v-if="selectedApiType && config.deviceId && supportsPolling">
        <n-divider title-placement="left">轮询配置</n-divider>
        <PollingConfig
          v-model="config.polling"
          :can-control="canStartPolling"
          @polling-toggle="onPollingToggle"
          @force-update="onForceUpdate"
        />
      </template>

      <!-- 第五步：数据映射配置 -->
      <template v-if="fetchedData">
        <n-divider title-placement="left">数据映射配置</n-divider>
        <DataMappingConfig :data="fetchedData" :mappings="config.dataPaths" @update:mappings="onDataPathsUpdate" />
      </template>

      <!-- 第六步：数据预览 -->
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

      <!-- 操作按钮 -->
      <div class="action-buttons">
        <n-space>
          <n-button type="primary" :disabled="!canSave" @click="saveConfig">保存配置</n-button>
          <n-button :disabled="!canTest" @click="testConfig">测试配置</n-button>
          <n-button @click="resetConfig">重置</n-button>
        </n-space>
      </div>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { NCard, NFormItem, NSelect, NDivider, NSpace, NButton } from 'naive-ui'
import DeviceSelector from './DeviceSelector.vue'
import TelemetryApiForm from './TelemetryApiForm.vue'
import AttributesApiForm from './AttributesApiForm.vue'
import EventApiForm from './EventApiForm.vue'
import CommandApiForm from './CommandApiForm.vue'
import DeviceInfoApiForm from './DeviceInfoApiForm.vue'
import SimulationApiForm from './SimulationApiForm.vue'
import PollingConfig from './PollingConfig.vue'
import DataMappingConfig from '../../DataMappingConfig.vue'
import { API_TYPE_OPTIONS } from '../index'
import { formatApiResponse } from '../utils/api-helpers'
import { ApiType } from '../types/api-types'

interface Props {
  modelValue?: any
}

interface Emits {
  'update:modelValue': [value: any]
  'config-saved': [config: any]
  'config-tested': [result: any]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 响应式数据
const selectedApiType = ref<ApiType>('telemetry_current')
const fetchedData = ref<any>(null)
const config = ref({
  deviceId: '',
  apiType: selectedApiType.value,
  parameters: {},
  polling: {
    enabled: false,
    interval: 5000,
    status: 'stopped'
  },
  dataPaths: []
})

// 计算属性
const isTelemetryApi = computed(() => {
  return selectedApiType.value.startsWith('telemetry_')
})

const isAttributesApi = computed(() => {
  return selectedApiType.value.startsWith('attributes_')
})

const isEventApi = computed(() => {
  return selectedApiType.value.startsWith('event_')
})

const isCommandApi = computed(() => {
  return selectedApiType.value.startsWith('command_')
})

const isDeviceInfoApi = computed(() => {
  return selectedApiType.value.startsWith('device_')
})

const isSimulationApi = computed(() => {
  return selectedApiType.value.startsWith('simulation_')
})

const supportsPolling = computed(() => {
  // 只有获取数据的API支持轮询，发布类API不支持
  return !selectedApiType.value.includes('_pub') && !selectedApiType.value.includes('_send')
})

const canStartPolling = computed(() => {
  return selectedApiType.value && config.value.deviceId && supportsPolling.value
})

const canSave = computed(() => {
  return selectedApiType.value && config.value.deviceId && fetchedData.value
})

const canTest = computed(() => {
  return selectedApiType.value && config.value.deviceId
})

// API类型选项
const apiTypeOptions = API_TYPE_OPTIONS

// 事件处理
const onApiTypeChange = (apiType: ApiType) => {
  selectedApiType.value = apiType
  config.value.apiType = apiType
  config.value.parameters = {}
  fetchedData.value = null
  updateConfig()
}

const onDeviceChange = (device: any) => {
  config.value.deviceId = device?.id || ''
  fetchedData.value = null
  updateConfig()
}

const onDataFetched = (data: any) => {
  fetchedData.value = data
  console.log('数据获取成功:', data)
}

const onPollingToggle = (enabled: boolean) => {
  config.value.polling.enabled = enabled
  updateConfig()
}

const onForceUpdate = () => {
  // 触发数据重新获取
  console.log('强制更新数据')
}

const onDataPathsUpdate = (mappings: any[]) => {
  config.value.dataPaths = mappings
  updateConfig()
}

const saveConfig = () => {
  const finalConfig = {
    ...config.value,
    fetchedData: fetchedData.value
  }
  emit('config-saved', finalConfig)
  console.log('配置已保存:', finalConfig)
}

const testConfig = () => {
  // 测试当前配置
  console.log('测试配置:', config.value)
  emit('config-tested', { success: true, data: fetchedData.value })
}

const resetConfig = () => {
  selectedApiType.value = 'telemetry_current'
  config.value = {
    deviceId: '',
    apiType: 'telemetry_current',
    parameters: {},
    polling: {
      enabled: false,
      interval: 5000,
      status: 'stopped'
    },
    dataPaths: []
  }
  fetchedData.value = null
  updateConfig()
}

const copyData = async () => {
  if (fetchedData.value) {
    try {
      await navigator.clipboard.writeText(JSON.stringify(fetchedData.value, null, 2))
      console.log('数据已复制到剪贴板')
    } catch (error) {
      console.error('复制失败:', error)
    }
  }
}

const updateConfig = () => {
  emit('update:modelValue', { ...config.value })
}

// 监听外部配置变化
watch(
  () => props.modelValue,
  newValue => {
    if (newValue) {
      config.value = { ...config.value, ...newValue }
      selectedApiType.value = newValue.apiType || 'telemetry_current'
    }
  },
  { deep: true }
)
</script>

<style scoped>
.device-api-config {
  width: 100%;
}

.action-buttons {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #f0f0f0;
  text-align: center;
}

.data-preview {
  max-height: 300px;
  overflow-y: auto;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 4px;
  padding: 12px;
}

.data-preview pre {
  margin: 0;
  font-size: 12px;
  line-height: 1.4;
  color: #333;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
}
</style>
