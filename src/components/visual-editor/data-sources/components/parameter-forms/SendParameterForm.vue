<template>
  <div class="send-parameter-form">
    <n-alert type="warning" show-icon>这是发送类表单，需要3个参数：设备ID、指标、数值（用于向设备发送数据）</n-alert>

    <!-- 设备选择 -->
    <n-form-item label="设备" required>
      <n-select
        v-model:value="parameters.device_id"
        :options="deviceOptions"
        placeholder="请选择设备"
        filterable
        :loading="deviceLoading"
        @update:value="onDeviceChange"
      />
    </n-form-item>

    <!-- 指标选择 -->
    <n-form-item :label="getMetricsLabel()" required>
      <n-select
        v-model:value="parameters.key"
        :options="metricsOptions"
        placeholder="请选择指标"
        filterable
        :loading="metricsLoading"
        :disabled="!parameters.device_id"
        @update:value="onMetricsChange"
        @focus="loadMetrics"
      >
        <template #option="{ option }">
          <div class="metrics-option">
            <div class="metrics-info">
              <span class="metrics-name">{{ option.label }}</span>
              <span class="metrics-key">({{ option.value }})</span>
            </div>
            <span class="metrics-type">{{ option.dataType }}</span>
          </div>
        </template>
      </n-select>
    </n-form-item>

    <!-- 数值输入 -->
    <n-form-item label="发送数值" required>
      <n-input v-model:value="parameters.value" placeholder="请输入要发送的数值" @update:value="onValueChange" />
      <template #feedback>
        <div class="field-tip">
          {{ getValueTip() }}
        </div>
      </template>
    </n-form-item>

    <!-- 操作预览 -->
    <n-card title="操作预览" size="small" class="operation-preview">
      <div class="operation-display">
        <div class="operation-line">
          <span class="operation-label">操作类型：</span>
          <span class="operation-value">{{ getOperationLabel() }}</span>
        </div>
        <div class="operation-line">
          <span class="operation-label">目标设备：</span>
          <span class="operation-value">{{ getDeviceName() || '未选择' }}</span>
        </div>
        <div class="operation-line">
          <span class="operation-label">目标指标：</span>
          <span class="operation-value">{{ parameters.key || '未选择' }}</span>
        </div>
        <div class="operation-line">
          <span class="operation-label">发送数值：</span>
          <span class="operation-value">{{ parameters.value || '未输入' }}</span>
        </div>
      </div>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { NFormItem, NSelect, NInput, NAlert, NCard } from 'naive-ui'
import { deviceListForPanel, deviceMetricsList } from '@/service/api/panel'

interface Props {
  apiType?: string
  modelValue?: Record<string, any>
}

interface Emits {
  'update:modelValue': [value: Record<string, any>]
  'parameters-change': [parameters: Record<string, any>]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const parameters = ref<Record<string, any>>(props.modelValue || { value: '' })
const deviceLoading = ref(false)
const metricsLoading = ref(false)
const deviceList = ref<any[]>([])
const metricsData = ref<any[]>([])

// 设备选项
const deviceOptions = computed(() => {
  return deviceList.value.map(device => ({
    label: device.name,
    value: device.id
  }))
})

// 指标选项（根据API类型过滤）
const metricsOptions = computed(() => {
  if (!metricsData.value.length) return []

  let filteredMetrics: any[] = []

  // 根据API类型决定显示哪些指标
  if (props.apiType === 'telemetryDataPub') {
    // 遥测发送：只显示遥测指标
    const telemetryGroup = metricsData.value.find(group => group.data_source_type === 'telemetry')
    filteredMetrics = telemetryGroup?.options || []
  } else if (props.apiType === 'attributeDataPub') {
    // 属性发送：只显示属性指标
    const attributesGroup = metricsData.value.find(group => group.data_source_type === 'attributes')
    filteredMetrics = attributesGroup?.options || []
  } else if (props.apiType === 'commandDataPub') {
    // 命令发送：只显示命令指标
    const commandGroup = metricsData.value.find(group => group.data_source_type === 'command')
    filteredMetrics = commandGroup?.options || []
  }

  return filteredMetrics.map((metric: any) => ({
    label: metric.label || metric.key,
    value: metric.key,
    dataType: metric.data_type || 'string'
  }))
})

// 获取指标标签
const getMetricsLabel = () => {
  switch (props.apiType) {
    case 'telemetryDataPub':
      return '遥测指标'
    case 'attributeDataPub':
      return '属性指标'
    case 'commandDataPub':
      return '命令指标'
    default:
      return '指标'
  }
}

// 获取操作标签
const getOperationLabel = () => {
  switch (props.apiType) {
    case 'telemetryDataPub':
      return '发送遥测数据'
    case 'attributeDataPub':
      return '发送属性数据'
    case 'commandDataPub':
      return '发送命令数据'
    default:
      return '发送数据'
  }
}

// 获取数值提示
const getValueTip = () => {
  switch (props.apiType) {
    case 'telemetryDataPub':
      return '输入要发送的遥测数值（如：温度、湿度等传感器数据）'
    case 'attributeDataPub':
      return '输入要设置的属性值（如：设备配置参数）'
    case 'commandDataPub':
      return '输入要发送的命令值（如：开关状态、控制指令）'
    default:
      return '输入要发送的数值'
  }
}

// 获取设备名称
const getDeviceName = () => {
  if (!parameters.value.device_id) return ''
  const device = deviceList.value.find(d => d.id === parameters.value.device_id)
  return device?.name || ''
}

// 获取设备列表
const getDeviceList = async () => {
  try {
    deviceLoading.value = true
    const response = await deviceListForPanel({ page: 1, page_size: 1000 })
    if (response && response.data) {
      deviceList.value = response.data.list || response.data || []
      console.log('🔧 SendParameterForm - 设备列表获取成功:', deviceList.value.length)
    }
  } catch (error) {
    console.error('设备列表获取失败:', error)
    deviceList.value = []
  } finally {
    deviceLoading.value = false
  }
}

// 加载设备指标
const loadMetrics = async () => {
  console.log('🔧 SendParameterForm - loadMetrics 被调用:', {
    device_id: parameters.value.device_id,
    hasMetricsData: metricsData.value.length > 0
  })

  if (!parameters.value.device_id) {
    console.log('🔧 SendParameterForm - 没有设备ID，跳过指标加载')
    return
  }

  // 移除重复加载检查，允许设备变化时重新加载
  // if (metricsData.value.length > 0) {
  //   console.log('🔧 SendParameterForm - 已有指标数据，跳过重复加载')
  //   return
  // }

  try {
    metricsLoading.value = true
    console.log('🔧 SendParameterForm - 开始获取设备指标:', parameters.value.device_id)

    const response = await deviceMetricsList(parameters.value.device_id)
    console.log('🔧 SendParameterForm - API响应:', response)

    if (response && response.data) {
      metricsData.value = response.data
      console.log('🔧 SendParameterForm - 指标数据获取成功:', metricsData.value)
    } else {
      console.warn('🔧 SendParameterForm - API响应无数据:', response)
    }
  } catch (error) {
    console.error('🔧 SendParameterForm - 设备指标获取失败:', error)
    metricsData.value = []
  } finally {
    metricsLoading.value = false
  }
}

// 事件处理函数
const onDeviceChange = async (deviceId: string) => {
  console.log('🔧 SendParameterForm - 设备变化:', deviceId)
  // 重置指标数据
  metricsData.value = []
  parameters.value.key = ''
  console.log('🔧 SendParameterForm - 已重置指标数据，开始自动加载新设备的指标')

  // 立即加载新设备的指标
  if (deviceId) {
    await loadMetrics()
  }

  emitChange()
}

const onMetricsChange = (metricsId: string) => {
  console.log('🔧 SendParameterForm - 指标变化:', metricsId)
  emitChange()
}

const onValueChange = (value: string) => {
  console.log('🔧 SendParameterForm - 数值变化:', value)
  emitChange()
}

// 发出变化事件
const emitChange = () => {
  emit('update:modelValue', { ...parameters.value })
  emit('parameters-change', { ...parameters.value })
}

// 监听外部modelValue变化
watch(
  () => props.modelValue,
  newValue => {
    if (newValue) {
      parameters.value = { ...newValue }
      // 确保value字段存在
      if (parameters.value.value === undefined) {
        parameters.value.value = ''
      }
    }
  },
  { deep: true, immediate: true }
)

// 组件挂载时获取设备列表
onMounted(() => {
  getDeviceList()
})
</script>

<style scoped>
.send-parameter-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.metrics-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.metrics-info {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
}

.metrics-name {
  font-weight: 500;
}

.metrics-key {
  color: #999;
  font-size: 12px;
}

.metrics-type {
  color: #666;
  font-size: 12px;
  background: #f0f0f0;
  padding: 2px 6px;
  border-radius: 3px;
}

.field-tip {
  font-size: 12px;
  color: #666;
  margin-top: 4px;
}

.operation-preview {
  margin-top: 16px;
  border: 1px solid #fbbf24;
  background: #fffbeb;
}

.operation-display {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.operation-line {
  display: flex;
  align-items: center;
  gap: 8px;
}

.operation-label {
  font-weight: 500;
  color: #92400e;
  min-width: 80px;
}

.operation-value {
  color: #451a03;
  background: #fef3c7;
  padding: 2px 6px;
  border-radius: 3px;
  font-family: 'Courier New', monospace;
}
</style>
