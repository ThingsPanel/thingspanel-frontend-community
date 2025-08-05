<template>
  <div class="complex-parameter-form">
    <n-alert type="info" show-icon>
      <template #icon>
        <n-icon><InfoCircleOutlined /></n-icon>
      </template>
      这是最复杂的表单，需要配置5个参数：设备、指标、时间范围、聚合函数、聚合窗口
    </n-alert>

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

    <!-- 指标选择（仅遥测类型） -->
    <n-form-item label="遥测指标" required>
      <n-select
        v-model:value="parameters.key"
        :options="telemetryMetricsOptions"
        placeholder="请选择遥测指标"
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
      <template #feedback>
        <div class="field-tip">只显示遥测类型的指标，用于获取历史数据</div>
      </template>
    </n-form-item>

    <!-- 时间范围选择 -->
    <n-form-item label="时间范围" required>
      <n-select
        v-model:value="parameters.time_range"
        :options="timeRangeOptions"
        placeholder="选择时间范围"
        @update:value="onTimeRangeChange"
      />
    </n-form-item>

    <!-- 聚合函数选择 -->
    <n-form-item label="聚合函数" required>
      <n-select
        v-model:value="parameters.aggregate_function"
        :options="aggregateFunctionOptions"
        placeholder="选择聚合函数"
        @update:value="onAggregateFunctionChange"
      />
    </n-form-item>

    <!-- 聚合窗口选择（智能禁用规则）-->
    <n-form-item label="聚合窗口" required>
      <n-select
        v-model:value="parameters.aggregate_window"
        :options="enabledAggregateWindowOptions"
        placeholder="选择聚合窗口"
        @update:value="onAggregateWindowChange"
      />
      <template #feedback>
        <div class="field-tip">基于时间范围自动禁用不合适的聚合窗口选项</div>
      </template>
    </n-form-item>

    <!-- 参数预览 -->
    <n-card title="参数预览" size="small" class="param-preview">
      <div class="param-display">
        <div class="param-line">
          <span class="param-key">device_id:</span>
          <span class="param-value">{{ parameters.device_id || '未选择' }}</span>
        </div>
        <div class="param-line">
          <span class="param-key">key:</span>
          <span class="param-value">{{ parameters.key || '未选择' }}</span>
        </div>
        <div class="param-line">
          <span class="param-key">time_range:</span>
          <span class="param-value">{{ parameters.time_range || '未选择' }}</span>
        </div>
        <div class="param-line">
          <span class="param-key">aggregate_function:</span>
          <span class="param-value">{{ parameters.aggregate_function || '未选择' }}</span>
        </div>
        <div class="param-line">
          <span class="param-key">aggregate_window:</span>
          <span class="param-value">{{ parameters.aggregate_window || '未选择' }}</span>
        </div>
      </div>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { NFormItem, NSelect, NAlert, NIcon, NCard } from 'naive-ui'
import { InfoCircleOutlined } from '@vicons/antd'
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

const parameters = ref<Record<string, any>>(props.modelValue || {})
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

// 遥测指标选项（只显示遥测类型）
const telemetryMetricsOptions = computed(() => {
  if (!metricsData.value.length) return []

  const telemetryGroup = metricsData.value.find(group => group.data_source_type === 'telemetry')
  if (!telemetryGroup || !telemetryGroup.options) return []

  return telemetryGroup.options.map((metric: any) => ({
    label: metric.label || metric.key,
    value: metric.key,
    dataType: metric.data_type || 'string'
  }))
})

// 时间范围选项（复用chart-card中的选项）
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
  { label: '最近7天', value: 'last_7d' },
  { label: '最近15天', value: 'last_15d' },
  { label: '最近30天', value: 'last_30d' },
  { label: '最近60天', value: 'last_60d' },
  { label: '最近90天', value: 'last_90d' }
]

// 聚合函数选项
const aggregateFunctionOptions = [
  { label: '平均值', value: 'avg' },
  { label: '最大值', value: 'max' },
  { label: '最小值', value: 'min' },
  { label: '求和', value: 'sum' },
  { label: '差值', value: 'diff' }
]

// 聚合窗口选项（全部选项）
const allAggregateWindowOptions = [
  { label: '不聚合', value: 'no_aggregate' },
  { label: '30秒', value: '30s' },
  { label: '1分钟', value: '1m' },
  { label: '2分钟', value: '2m' },
  { label: '5分钟', value: '5m' },
  { label: '10分钟', value: '10m' },
  { label: '30分钟', value: '30m' },
  { label: '1小时', value: '1h' },
  { label: '3小时', value: '3h' },
  { label: '6小时', value: '6h' },
  { label: '1天', value: '1d' },
  { label: '7天', value: '7d' },
  { label: '1月', value: '1mo' }
]

// 智能禁用规则：根据时间范围禁用不合适的聚合窗口选项
const enabledAggregateWindowOptions = computed(() => {
  const timeRange = parameters.value.time_range
  if (!timeRange) return allAggregateWindowOptions

  // 禁用规则映射（基于chart-card中的实际规则）
  const disableRules: Record<string, number> = {
    last_3h: 1, // 最近3小时：禁用30秒选项
    last_6h: 2, // 最近6小时：禁用30秒、1分钟
    last_12h: 3, // 最近12小时：禁用前3项
    last_24h: 4, // 最近24小时：禁用前4项
    last_3d: 5, // 最近3天：禁用前5项
    last_7d: 6, // 最近7天：禁用前6项
    last_15d: 7, // 最近15天：禁用前7项
    last_30d: 7, // 最近30天：禁用前7项
    last_60d: 8, // 最近60天：禁用前8项
    last_90d: 9 // 最近90天：禁用前9项
  }

  const disableBeforeIndex = disableRules[timeRange] || 0

  return allAggregateWindowOptions.map((option, index) => ({
    ...option,
    disabled: index < disableBeforeIndex
  }))
})

// 获取设备列表
const getDeviceList = async () => {
  try {
    deviceLoading.value = true
    const response = await deviceListForPanel({ page: 1, page_size: 1000 })
    if (response && response.data) {
      deviceList.value = response.data.list || response.data || []
      console.log('🔧 ComplexParameterForm - 设备列表获取成功:', deviceList.value.length)
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
  console.log('🔧 ComplexParameterForm - loadMetrics 被调用:', {
    device_id: parameters.value.device_id,
    hasMetricsData: metricsData.value.length > 0
  })

  if (!parameters.value.device_id) {
    console.log('🔧 ComplexParameterForm - 没有设备ID，跳过指标加载')
    return
  }

  // 移除重复加载检查，允许设备变化时重新加载
  // if (metricsData.value.length > 0) {
  //   console.log('🔧 ComplexParameterForm - 已有指标数据，跳过重复加载')
  //   return
  // }

  try {
    metricsLoading.value = true
    console.log('🔧 ComplexParameterForm - 开始获取设备指标:', parameters.value.device_id)

    const response = await deviceMetricsList(parameters.value.device_id)
    console.log('🔧 ComplexParameterForm - API响应:', response)

    if (response && response.data) {
      metricsData.value = response.data
      console.log('🔧 ComplexParameterForm - 指标数据获取成功:', metricsData.value)
    } else {
      console.warn('🔧 ComplexParameterForm - API响应无数据:', response)
    }
  } catch (error) {
    console.error('🔧 ComplexParameterForm - 设备指标获取失败:', error)
    metricsData.value = []
  } finally {
    metricsLoading.value = false
  }
}

// 事件处理函数
const onDeviceChange = async (deviceId: string) => {
  console.log('🔧 ComplexParameterForm - 设备变化:', deviceId)
  // 重置指标数据和指标选择
  metricsData.value = []
  parameters.value.key = ''
  console.log('🔧 ComplexParameterForm - 已重置指标数据，开始自动加载新设备的指标')

  // 立即加载新设备的指标
  if (deviceId) {
    await loadMetrics()
  }

  emitChange()
}

const onMetricsChange = (metricsId: string) => {
  console.log('🔧 ComplexParameterForm - 指标变化:', metricsId)
  emitChange()
}

const onTimeRangeChange = (timeRange: string) => {
  console.log('🔧 ComplexParameterForm - 时间范围变化:', timeRange)
  // 时间范围变化时，检查当前聚合窗口是否被禁用
  const currentWindow = parameters.value.aggregate_window
  if (currentWindow) {
    const enabledOptions = enabledAggregateWindowOptions.value
    const currentOption = enabledOptions.find(opt => opt.value === currentWindow)
    if (currentOption?.disabled) {
      // 如果当前选择的聚合窗口被禁用，重置为第一个可用选项
      const firstEnabled = enabledOptions.find(opt => !opt.disabled)
      if (firstEnabled) {
        parameters.value.aggregate_window = firstEnabled.value
      }
    }
  }
  emitChange()
}

const onAggregateFunctionChange = (aggregateFunction: string) => {
  console.log('🔧 ComplexParameterForm - 聚合函数变化:', aggregateFunction)
  emitChange()
}

const onAggregateWindowChange = (aggregateWindow: string) => {
  console.log('🔧 ComplexParameterForm - 聚合窗口变化:', aggregateWindow)
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
.complex-parameter-form {
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

.param-preview {
  margin-top: 16px;
}

.param-display {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.param-line {
  display: flex;
  align-items: center;
  gap: 8px;
}

.param-key {
  font-family: 'Courier New', monospace;
  font-weight: 500;
  color: #0369a1;
  min-width: 140px;
}

.param-value {
  font-family: 'Courier New', monospace;
  color: #666;
  background: #f8fafc;
  padding: 2px 6px;
  border-radius: 3px;
}
</style>
