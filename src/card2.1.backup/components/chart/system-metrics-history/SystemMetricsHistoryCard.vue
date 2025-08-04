<template>
  <div class="metrics-history-card">
    <h3 class="title">{{ title }}</h3>
    <div class="chart-container">
      <n-spin v-if="loading" size="large" />
      <div v-if="!loading && errorMsg" class="message-overlay">{{ errorMsg }}</div>
      <div v-if="!loading && !errorMsg && isEmpty" class="message-overlay">
        <n-empty :description="$t('card.noData')" />
      </div>
      <v-chart
        v-show="!loading && !errorMsg && !isEmpty"
        ref="chartRef"
        class="chart"
        :option="chartOption"
        autoresize
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { NSpin, NEmpty } from 'naive-ui'
import { useThemeStore } from '@/store/modules/theme'
import { $t } from '@/locales'
import VChart from 'vue-echarts'
import { useData } from './useData'
import dayjs from 'dayjs'

defineProps<{ title: string }>()

const { loading, errorMsg, chartData } = useData()
const themeStore = useThemeStore()
const chartOption = ref({})
const isEmpty = computed(() => chartData.value.timeAxis.length === 0)

watch(
  chartData,
  newData => {
    if (!newData || newData.timeAxis.length === 0) return

    const { timeAxis, timestamps, cpuData, memData, diskData } = newData
    const labels = {
      cpu: $t('card.cpuUsage'),
      mem: $t('card.memoryUsage'),
      disk: $t('card.diskUsage')
    }

    chartOption.value = {
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          if (!params || params.length === 0) return ''
          const timeStr = dayjs(timestamps[params[0].dataIndex]).format('YYYY-MM-DD HH:mm:ss')
          let tooltip = `${timeStr}<br/>`
          params.forEach((p: any) => {
            tooltip += `${p.marker} ${p.seriesName} : <b>${p.value?.toFixed(1)}%</b><br/>`
          })
          return tooltip
        }
      },
      legend: {
        data: [labels.cpu, labels.mem, labels.disk],
        top: 5,
        textStyle: { color: themeStore.isDark ? '#ccc' : '#666' }
      },
      grid: { left: '3%', right: '4%', top: 45, bottom: '3%', containLabel: true },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: timeAxis,
        axisLine: { lineStyle: { color: themeStore.isDark ? '#555' : '#ddd' } },
        axisLabel: { color: themeStore.isDark ? '#aaa' : '#888' }
      },
      yAxis: {
        type: 'value',
        max: 100,
        axisLabel: { formatter: '{value}%', color: themeStore.isDark ? '#aaa' : '#888' },
        splitLine: { lineStyle: { color: themeStore.isDark ? '#333' : '#eee', type: 'dashed' } }
      },
      series: [
        { name: labels.cpu, type: 'line', smooth: true, symbol: 'none', data: cpuData, areaStyle: {} },
        { name: labels.mem, type: 'line', smooth: true, symbol: 'none', data: memData, areaStyle: {} },
        { name: labels.disk, type: 'line', smooth: true, symbol: 'none', data: diskData, areaStyle: {} }
      ]
    }
  },
  { deep: true }
)
</script>

<style scoped>
.metrics-history-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 16px;
  box-sizing: border-box;
}
.title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 12px;
}
.chart-container {
  flex-grow: 1;
  position: relative;
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.chart {
  width: 100%;
  height: 100%;
}
.message-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
