<template>
  <n-form-item label="指标选择" required>
    <n-select
      v-model:value="selectedMetricsId"
      :options="metricsOptions"
      placeholder="请选择指标"
      filterable
      :loading="loading"
      :disabled="!deviceId || !dataType"
      @update:value="onMetricsSelect"
      @dropdown-show="loadMetrics"
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
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { NFormItem, NSelect } from 'naive-ui'
import { deviceMetricsList } from '@/service/api/panel'

interface Props {
  deviceId?: string
  dataType?: string
  metricsId?: string
  metricsName?: string
  metricsDataType?: string
}

interface Emits {
  'update:metricsId': [value: string]
  'update:metricsName': [value: string]
  'update:metricsDataType': [value: string]
  'metrics-change': [metricsInfo: { id: string; name: string; dataType: string }]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const loading = ref(false)
const metricsData = ref<any[]>([])
const selectedMetricsId = ref(props.metricsId || '')

// 根据数据类型过滤指标选项
const metricsOptions = computed(() => {
  if (!props.dataType) return []

  // 找到对应数据类型的指标组
  const targetGroup = metricsData.value.find(group => group.data_source_type === props.dataType)

  if (!targetGroup || !targetGroup.options) return []

  return targetGroup.options.map((metric: any) => ({
    label: metric.label || metric.key,
    value: metric.key,
    dataType: metric.data_type || 'string',
    // 用于组件内部使用的完整信息
    _metric: metric
  }))
})

// 加载设备指标
const loadMetrics = async () => {
  if (!props.deviceId || metricsData.value.length > 0) return

  try {
    loading.value = true
    console.log('🔧 MetricsSelector - 开始获取设备指标:', props.deviceId)

    const response = await deviceMetricsList(props.deviceId)
    if (response && response.data) {
      metricsData.value = response.data
      console.log('🔧 MetricsSelector - 指标数据获取成功:', metricsData.value)
    }
  } catch (error) {
    console.error('设备指标获取失败:', error)
    metricsData.value = []
  } finally {
    loading.value = false
  }
}

// 指标选择处理
const onMetricsSelect = (metricsId: string, option: any) => {
  console.log('🔧 MetricsSelector - 指标选择:', metricsId, option)

  const metricsName = option?.label || metricsId
  const metricsDataType = option?.dataType || 'string'

  emit('update:metricsId', metricsId)
  emit('update:metricsName', metricsName)
  emit('update:metricsDataType', metricsDataType)
  emit('metrics-change', {
    id: metricsId,
    name: metricsName,
    dataType: metricsDataType
  })
}

// 监听设备ID变化，重新加载指标
watch([() => props.deviceId, () => props.dataType], ([newDeviceId, newDataType], [oldDeviceId, oldDataType]) => {
  if (newDeviceId !== oldDeviceId || newDataType !== oldDataType) {
    // 重置数据
    metricsData.value = []
    selectedMetricsId.value = ''

    // 清空选中的指标
    emit('update:metricsId', '')
    emit('update:metricsName', '')
    emit('update:metricsDataType', '')
  }
})

// 监听外部metricsId变化
watch(
  () => props.metricsId,
  newValue => {
    if (newValue !== selectedMetricsId.value) {
      selectedMetricsId.value = newValue || ''
    }
  },
  { immediate: true }
)
</script>

<style scoped>
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
