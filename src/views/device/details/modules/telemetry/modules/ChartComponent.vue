<script setup lang="ts">
import { watch } from 'vue'
import { use } from 'echarts/core'
import type { EChartsCoreOption } from 'echarts/core'
import {
  DataZoomComponent,
  GridComponent,
  LegendComponent,
  ToolboxComponent,
  TooltipComponent
} from 'echarts/components'
import { useTpECharts } from '@/hooks/tp-chart/use-tp-echarts'

// Props
const props = defineProps<{
  initialOptions: EChartsCoreOption
}>()
use([DataZoomComponent, GridComponent, LegendComponent, ToolboxComponent, TooltipComponent])
const { domRef, updateOptions } = useTpECharts(() => props.initialOptions)
watch(
  () => props.initialOptions,
  newOptions => {
    if (newOptions) {
      updateOptions(currentOptions => {
        // 这里进行深拷贝以确保图表配置完全更新
        return { ...currentOptions, ...newOptions }
      })
    }
  },
  { deep: true, immediate: true }
)
</script>

<template>
  <div ref="domRef" class="chart-container"></div>
</template>

<style scoped>
.chart-container {
  width: 100%;
  height: 100%; /* 根据需求调整 */
}
</style>
