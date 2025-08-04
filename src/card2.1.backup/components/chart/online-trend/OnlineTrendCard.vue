<template>
  <div class="online-trend-card">
    <div class="header">
      <div class="title">
        <img :src="wifiIcon" alt="Online Trend" class="icon" />
        <span>{{ title }}</span>
      </div>
      <div class="online-rate">
        <img :src="onlineRateIcon" alt="Online Rate" class="icon" />
        <n-spin v-if="loading" size="small" />
        <span v-else class="rate-text">{{ onlineRateText }}</span>
      </div>
    </div>
    <div class="chart-container">
      <VChart class="chart" :option="chartOption" autoresize />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import VChart from 'vue-echarts'
import * as echarts from 'echarts'
import { NSpin } from 'naive-ui'
import { useData } from './useData'
import { $t } from '@/locales'
import wifiIcon from './wifi.png'
import onlineRateIcon from './online-rate.png'

const props = defineProps<{
  title: string
}>()

const { loading, onlineData, offlineData, onlineRateText } = useData()

const chartOption = ref({
  tooltip: {
    trigger: 'axis',
    formatter(params: any) {
      const date = new Date(params[0].value[0])
      const dateStr = date.toLocaleString()
      let result = `${dateStr}<br/>`
      params.forEach((param: any) => {
        const marker = `<span style="display:inline-block;margin-right:4px;border-radius:10px;width:10px;height:10px;background-color:${param.color};"></span>`
        result += `${marker}${param.seriesName}: ${param.value[1]}<br/>`
      })
      return result
    }
  },
  legend: {
    data: [$t('card.onlineDev'), $t('card.offlineDev')],
    left: 'center',
    top: 0
  },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '3%',
    top: '50px',
    containLabel: true
  },
  xAxis: {
    type: 'time',
    boundaryGap: false,
    axisLabel: {
      formatter(value: number) {
        const date = new Date(value)
        return `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`
      }
    }
  },
  yAxis: {
    type: 'value',
    splitLine: { lineStyle: { type: 'dashed' } }
  },
  series: [
    {
      name: $t('card.onlineDev'),
      type: 'line',
      smooth: true,
      symbol: 'none',
      data: [],
      itemStyle: { color: '#67C23A' },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(103, 194, 58, 0.4)' },
          { offset: 1, color: 'rgba(103, 194, 58, 0.1)' }
        ])
      }
    },
    {
      name: $t('card.offlineDev'),
      type: 'line',
      smooth: true,
      symbol: 'none',
      data: [],
      itemStyle: { color: '#F56C6C' }
    }
  ]
})

watch([onlineData, offlineData], ([newOnline, newOffline]) => {
  chartOption.value.series[0].data = newOnline as any
  chartOption.value.series[1].data = newOffline as any
})
</script>

<style scoped>
.online-trend-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 16px;
  box-sizing: border-box;
}
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.title,
.online-rate {
  display: flex;
  align-items: center;
  font-size: 16px;
  font-weight: bold;
}
.rate-text {
  font-size: 14px;
}
.icon {
  width: 24px;
  height: 24px;
  margin-right: 8px;
}
.chart-container {
  flex: 1;
  min-height: 200px;
}
.chart {
  width: 100%;
  height: 100%;
}
</style>
