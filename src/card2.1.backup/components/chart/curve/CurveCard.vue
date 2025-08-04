<template>
  <div class="curve-chart-container">
    <VChart ref="chartRef" :option="option" :theme="theme" autoresize class="chart" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, defineExpose } from 'vue'
import { use } from 'echarts/core'
import { LineChart } from 'echarts/charts'
import {
  GridComponent,
  LegendComponent,
  ToolboxComponent,
  TooltipComponent,
  DataZoomComponent
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import VChart from 'vue-echarts'
import { useCurveData } from './useData'
import { colorGroups } from './components/theme'

// 注册 ECharts 组件
use([TooltipComponent, LegendComponent, ToolboxComponent, GridComponent, DataZoomComponent, LineChart, CanvasRenderer])

interface Props {
  properties?: Record<string, any>
  metadata?: {
    card2Data?: any
  }
}

const props = withDefaults(defineProps<Props>(), {
  properties: () => ({}),
  metadata: () => ({ card2Data: {} })
})

const chartRef = ref()

// 主题
const theme = computed(() => 'light')

// 颜色组
const currentColorGroup = computed(() => {
  return props.properties?.colorGroups?.colorGroup || colorGroups
})

// 使用数据钩子
const { option, updateData, setSeries, initializeData } = useCurveData(props, currentColorGroup.value)

// 暴露方法
defineExpose({
  updateData,
  setSeries,
  initializeData
})
</script>

<style scoped>
.curve-chart-container {
  width: 100%;
  height: 100%;
  min-height: 200px;
}

.chart {
  width: 100%;
  height: 100%;
}

:deep(.n-card__content) {
  width: 100%;
  height: 100%;
  padding: 0;
}
</style>
