<template>
  <div class="bar-chart-chart-widget">
    <component :is="BarChartComponent" :card="cardData" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import BarChartComponent from '@/card/chart-card/bar/component.vue'
import type { ICardData } from '@/components/panel/card'

interface Props {
  title?: string
  deviceIds?: string[]
  metricsIds?: string[]
  colors?: string[]
  showLegend?: boolean
  showGrid?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  title: '柱状图',
  deviceIds: () => [],
  metricsIds: () => [],
  colors: () => ['#18a058', '#2080f0', '#f0a020', '#d03050'],
  showLegend: true,
  showGrid: true
})

// 将props适配为ICardData格式
const cardData = computed<ICardData>(() => ({
  id: 'widget-' + Date.now().toString(),
  basicSettings: {
    title: props.title,
    showTitle: true,
    titleColor: '#333',
    showBorder: false,
    borderColor: '#e0e0e0',
    borderWidth: 1,
    borderRadius: 4,
    backgroundColor: '#ffffff',
    backgroundImage: '',
    opacity: 1
  },
  dataSource:
    props.deviceIds.length > 0 && props.metricsIds.length > 0
      ? {
          deviceSource: props.deviceIds.map((deviceId, index) => ({
            deviceId,
            metricsId: props.metricsIds[index] || props.metricsIds[0],
            metricsType: 'telemetry' as const,
            aggregateWindow: '1h',
            name: `数据${index + 1}`
          }))
        }
      : {
          // 默认演示数据
          deviceSource: [
            {
              deviceId: 'demo-device',
              metricsId: 'demo-metric',
              metricsType: 'telemetry' as const,
              aggregateWindow: '1h',
              name: '演示数据'
            }
          ]
        },
  config: {
    colorGroups: {
      colorGroup: props.colors
    },
    chartType: 'bar',
    showLegend: props.showLegend,
    showGrid: props.showGrid,
    animation: true,
    smooth: false,
    showValues: false,
    yAxisName: '',
    xAxisName: '',
    legendPosition: 'bottom'
  },
  w: 8,
  h: 6,
  x: 0,
  y: 0,
  i: 'widget-' + Date.now().toString(),
  component: 'bar'
}))
</script>

<style scoped>
.bar-chart-chart-widget {
  width: 100%;
  height: 100%;
  padding: 4px;
  box-sizing: border-box;
}
</style>
