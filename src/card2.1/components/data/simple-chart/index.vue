<template>
  <n-card 
    class="simple-chart" 
    :style="cardStyle"
    embedded
  >
    <div v-if="config.showTitle" class="chart-header">
      <div class="chart-title">
        {{ displayData.title || config.title }}
      </div>
    </div>
    
    <div class="chart-container">
      <v-chart
        ref="chartRef" 
        :option="chartOption"
        :style="{ height: config.chartHeight + 'px' }"
        autoresize
      />
    </div>
    
    <div v-if="config.showLegend" class="chart-footer">
      <div class="data-summary">
        共 {{ chartData.length }} 个数据点
      </div>
    </div>
  </n-card>
</template>

<script setup lang="ts">
/**
 * 简单数据图表组件
 * 支持线图、柱图等基本图表类型
 */

import { computed, ref, watch } from 'vue'
import { NCard } from 'naive-ui'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { LineChart, BarChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { useCard2Props } from '@/card2.1/hooks'
import type { SimpleChartConfig } from './settingConfig'

// 注册 ECharts 组件
use([LineChart, BarChart, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer])

// 组件属性接口
interface Props {
  config: SimpleChartConfig
  data?: Record<string, unknown>
}

const props = withDefaults(defineProps<Props>(), {
  data: () => ({})
})

// 使用 Card 2.1 数据绑定
const { config, displayData } = useCard2Props(props)

// 图表引用
const chartRef = ref()

// 图表数据处理
const chartData = computed(() => {
  const rawData = displayData.value.series || []
  if (Array.isArray(rawData)) {
    return rawData
  }
  return []
})

// 图表配置
const chartOption = computed(() => {
  const data = chartData.value
  
  return {
    grid: {
      left: '10%',
      right: '10%',
      top: '20%',
      bottom: '20%'
    },
    tooltip: {
      trigger: 'axis',
      formatter: '{b}: {c}'
    },
    xAxis: {
      type: 'category',
      data: data.map((_, index) => `点${index + 1}`),
      axisLabel: {
        fontSize: config.value.fontSize
      }
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        fontSize: config.value.fontSize
      }
    },
    series: [
      {
        name: config.value.seriesName || '数据系列',
        type: config.value.chartType || 'line',
        data: data,
        itemStyle: {
          color: config.value.chartColor || '#1890ff'
        },
        smooth: config.value.chartType === 'line' ? config.value.smoothLine : false
      }
    ]
  }
})

// 计算卡片样式
const cardStyle = computed(() => ({
  backgroundColor: config.value.backgroundColor,
  border: `1px solid ${config.value.borderColor}`,
  borderRadius: `${config.value.borderRadius}px`,
  minHeight: `${config.value.chartHeight + 80}px`
}))
</script>

<style scoped>
.simple-chart {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.chart-header {
  padding: 12px 16px;
  border-bottom: 1px solid var(--divider-color);
}

.chart-title {
  font-size: 16px;
  font-weight: 500;
  color: var(--text-color-1);
}

.chart-container {
  flex: 1;
  padding: 8px;
}

.chart-footer {
  padding: 8px 16px;
  border-top: 1px solid var(--divider-color);
  background-color: var(--card-color-embedded);
}

.data-summary {
  font-size: 12px;
  color: var(--text-color-3);
  text-align: center;
}
</style>