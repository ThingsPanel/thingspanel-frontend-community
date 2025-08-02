<template>
  <div class="bar-chart-widget">
    <div ref="chartRef" class="chart-container"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue'
import * as echarts from 'echarts'
import { createEChartsInstance } from '@/utils/echarts/echarts-manager'

interface Props {
  title?: string
  data?: Array<{ name: string; value: number }>
  color?: string
}

const props = withDefaults(defineProps<Props>(), {
  title: '柱状图',
  data: () => [
    { name: '数据1', value: 120 },
    { name: '数据2', value: 200 },
    { name: '数据3', value: 150 },
    { name: '数据4', value: 80 }
  ],
  color: '#18a058'
})

const chartRef = ref<HTMLElement>()
let chartInstance: echarts.ECharts | null = null

const initChart = () => {
  if (!chartRef.value) return
  
      chartInstance = createEChartsInstance(chartRef.value)
  updateChart()
}

const updateChart = () => {
  if (!chartInstance) return
  
  const option = {
    title: {
      text: props.title,
      textStyle: {
        fontSize: 12,
        color: '#333'
      }
    },
    grid: {
      left: '10%',
      right: '10%',
      top: '20%',
      bottom: '10%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: props.data.map(item => item.name),
      axisLabel: {
        fontSize: 10
      }
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        fontSize: 10
      }
    },
    series: [{
      type: 'bar',
      data: props.data.map(item => item.value),
      itemStyle: {
        color: props.color
      }
    }]
  }
  
  chartInstance.setOption(option)
}

const resizeChart = () => {
  if (chartInstance) {
    chartInstance.resize()
  }
}

watch(() => [props.title, props.data, props.color], () => {
  updateChart()
}, { deep: true })

onMounted(() => {
  nextTick(() => {
    initChart()
    
    // 监听窗口大小变化
    window.addEventListener('resize', resizeChart)
    
    // 使用 ResizeObserver 监听容器大小变化
    if (chartRef.value) {
      const resizeObserver = new ResizeObserver(() => {
        resizeChart()
      })
      resizeObserver.observe(chartRef.value)
    }
  })
})
</script>

<style scoped>
.bar-chart-widget {
  width: 100%;
  height: 100%;
  padding: 4px;
  box-sizing: border-box;
}

.chart-container {
  width: 100%;
  height: 100%;
  min-height: 100px;
}
</style>