<template>
  <div class="bar-chart-container" :style="{ height: '100%', width: '100%' }">
    <BarChart
      ref="chartRef"
      :card="card"
      :color-group="colorGroup"
      @error="handleError"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import type { CardInstance } from '../../../core/types'
import BarChart from './modules/bar-chart.vue'

// Props
interface Props {
  card: CardInstance
  config?: Record<string, any>
  data?: any[]
  theme?: 'light' | 'dark'
}

const props = withDefaults(defineProps<Props>(), {
  config: () => ({}),
  data: () => [],
  theme: 'light'
})

// Emits
const emit = defineEmits<{
  error: [error: Error]
  dataChange: [data: any[]]
  configChange: [config: Record<string, any>]
}>()

// Refs
const chartRef = ref<InstanceType<typeof BarChart>>()

// Computed
const colorGroup = computed(() => {
  const themeConfig = props.config?.theme || {}
  const colorScheme = themeConfig.colorScheme || 'colorGroups'
  const customColors = themeConfig.customColors || []
  
  if (customColors.length > 0) {
    return customColors.map((color: string) => ({
      top: color,
      bottom: color
    }))
  }
  
  // 返回默认颜色组
  return [
    { top: '#409EFF', bottom: '#79bbff' },
    { top: '#67C23A', bottom: '#95d475' },
    { top: '#E6A23C', bottom: '#eebe77' },
    { top: '#F56C6C', bottom: '#f89898' },
    { top: '#909399', bottom: '#b1b3b8' }
  ]
})

// Methods
const updateData = (newData?: any[]) => {
  if (chartRef.value && chartRef.value.updateData) {
    chartRef.value.updateData(newData)
  }
}

const handleError = (error: Error) => {
  console.error('Bar chart error:', error)
  emit('error', error)
}

const refreshChart = () => {
  if (chartRef.value && chartRef.value.refreshChart) {
    chartRef.value.refreshChart()
  }
}

// Watchers
watch(
  () => props.data,
  (newData) => {
    updateData(newData)
    emit('dataChange', newData)
  },
  { deep: true }
)

watch(
  () => props.config,
  (newConfig) => {
    emit('configChange', newConfig)
    // 配置变化时刷新图表
    refreshChart()
  },
  { deep: true }
)

// Lifecycle
onMounted(() => {
  // 组件挂载后初始化
  if (props.data && props.data.length > 0) {
    updateData(props.data)
  }
})

onUnmounted(() => {
  // 清理工作
})

// Expose methods
defineExpose({
  updateData,
  refreshChart,
  chartRef
})
</script>

<style scoped>
.bar-chart-container {
  position: relative;
  overflow: hidden;
}
</style>