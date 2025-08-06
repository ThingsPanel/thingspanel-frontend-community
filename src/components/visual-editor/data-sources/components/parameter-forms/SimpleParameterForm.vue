<template>
  <div class="simple-parameter-form">
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
        v-model:value="metricsValue"
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { NFormItem, NSelect } from 'naive-ui'
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

// 指标选项（根据API类型过滤）
const metricsOptions = computed(() => {
  if (!metricsData.value.length) return []

  let filteredMetrics: any[] = []

  // 根据API类型决定显示哪些指标
  if (props.apiType === 'telemetryDataCurrentKeys') {
    // 遥测当前值：只显示遥测指标
    const telemetryGroup = metricsData.value.find(group => group.data_source_type === 'telemetry')
    filteredMetrics = telemetryGroup?.options || []
  } else if (props.apiType === 'getAttributeDatasKey') {
    // 指定属性值：只显示属性指标
    const attributesGroup = metricsData.value.find(group => group.data_source_type === 'attributes')
    filteredMetrics = attributesGroup?.options || []
  }

  return filteredMetrics.map((metric: any) => ({
    label: metric.label || metric.key,
    value: metric.key,
    dataType: metric.data_type || 'string'
  }))
})

// 指标值（根据API类型使用不同的参数名）
const metricsValue = computed({
  get: () => {
    if (props.apiType === 'telemetryDataCurrentKeys') {
      return parameters.value.keys
    } else {
      return parameters.value.key
    }
  },
  set: value => {
    if (props.apiType === 'telemetryDataCurrentKeys') {
      parameters.value.keys = value
    } else {
      parameters.value.key = value
    }
    emitChange()
  }
})

// 获取指标标签
const getMetricsLabel = () => {
  if (props.apiType === 'telemetryDataCurrentKeys') {
    return '遥测指标'
  } else if (props.apiType === 'getAttributeDatasKey') {
    return '属性指标'
  }
  return '指标'
}

// 获取设备列表
const getDeviceList = async () => {
  try {
    deviceLoading.value = true
    const response = await deviceListForPanel({ page: 1, page_size: 1000 })
    if (response && response.data) {
      deviceList.value = response.data.list || response.data || []
      console.log('🔧 SimpleParameterForm - 设备列表获取成功:', deviceList.value.length)
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
  console.log('🔧 SimpleParameterForm - loadMetrics 被调用:', {
    device_id: parameters.value.device_id,
    hasMetricsData: metricsData.value.length > 0
  })

  if (!parameters.value.device_id) {
    console.log('🔧 SimpleParameterForm - 没有设备ID，跳过指标加载')
    return
  }

  // 移除重复加载检查，允许设备变化时重新加载
  // if (metricsData.value.length > 0) {
  //   console.log('🔧 SimpleParameterForm - 已有指标数据，跳过重复加载')
  //   return
  // }

  try {
    metricsLoading.value = true
    console.log('🔧 SimpleParameterForm - 开始获取设备指标:', parameters.value.device_id)

    const response = await deviceMetricsList(parameters.value.device_id)
    console.log('🔧 SimpleParameterForm - API响应:', response)

    if (response && response.data) {
      metricsData.value = response.data
      console.log('🔧 SimpleParameterForm - 指标数据获取成功:', metricsData.value)
    } else {
      console.warn('🔧 SimpleParameterForm - API响应无数据:', response)
    }
  } catch (error) {
    console.error('🔧 SimpleParameterForm - 设备指标获取失败:', error)
    metricsData.value = []
  } finally {
    metricsLoading.value = false
  }
}

// 设备变化处理
const onDeviceChange = async (deviceId: string) => {
  console.log('🔧 SimpleParameterForm - 设备变化:', deviceId)
  // 重置指标数据和选择
  metricsData.value = []
  metricsValue.value = ''
  console.log('🔧 SimpleParameterForm - 已重置指标数据，开始自动加载新设备的指标')

  // 立即加载新设备的指标
  if (deviceId) {
    await loadMetrics()
  }

  emitChange()
}

// 指标变化处理
const onMetricsChange = (metricsId: string) => {
  console.log('🔧 SimpleParameterForm - 指标变化:', metricsId)
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
.simple-parameter-form {
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
</style>
