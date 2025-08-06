<template>
  <div class="history-config">
    <n-form-item label="时间范围" required>
      <n-select
        v-model:value="selectedTimeRange"
        :options="timeRangeOptions"
        placeholder="选择时间范围"
        @update:value="onTimeRangeChange"
      />
    </n-form-item>

    <n-form-item label="聚合方式" required>
      <n-select
        v-model:value="selectedAggregateFunction"
        :options="aggregateFunctionOptions"
        placeholder="选择聚合方式"
        @update:value="onAggregateFunctionChange"
      />
    </n-form-item>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { NFormItem, NSelect } from 'naive-ui'

interface Props {
  timeRange?: string
  aggregateFunction?: string
}

interface Emits {
  'update:timeRange': [value: string]
  'update:aggregateFunction': [value: string]
  'config-change': []
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const selectedTimeRange = ref(props.timeRange || 'last_1h')
const selectedAggregateFunction = ref(props.aggregateFunction || 'avg')

// 时间范围选项（复用现有的选项）
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

// 聚合函数选项（复用现有的选项）
const aggregateFunctionOptions = [
  { label: '平均值', value: 'avg' },
  { label: '最大值', value: 'max' },
  { label: '最小值', value: 'min' },
  { label: '求和', value: 'sum' },
  { label: '差值', value: 'diff' }
]

// 时间范围变化处理
const onTimeRangeChange = (timeRange: string) => {
  console.log('🔧 HistoryConfig - 时间范围变化:', timeRange)
  emit('update:timeRange', timeRange)
  emit('config-change')
}

// 聚合函数变化处理
const onAggregateFunctionChange = (aggregateFunction: string) => {
  console.log('🔧 HistoryConfig - 聚合函数变化:', aggregateFunction)
  emit('update:aggregateFunction', aggregateFunction)
  emit('config-change')
}

// 监听外部props变化
watch(
  () => props.timeRange,
  newValue => {
    if (newValue && newValue !== selectedTimeRange.value) {
      selectedTimeRange.value = newValue
    }
  },
  { immediate: true }
)

watch(
  () => props.aggregateFunction,
  newValue => {
    if (newValue && newValue !== selectedAggregateFunction.value) {
      selectedAggregateFunction.value = newValue
    }
  },
  { immediate: true }
)
</script>

<style scoped>
.history-config {
  background: #fafafa;
  padding: 16px;
  border-radius: 6px;
  border: 1px solid #e0e0e0;
}
</style>
