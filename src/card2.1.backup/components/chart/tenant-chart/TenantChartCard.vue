<template>
  <div class="tenant-chart-card">
    <h3 class="title">{{ title }}</h3>
    <div class="content">
      <div class="stats-panel">
        <n-statistic :label="$t('card.tenantChart.totalUsers')">
          <span class="stat-value text-blue-500"><NNumberAnimation :from="0" :to="stats.user_total" /></span>
        </n-statistic>
        <n-statistic :label="$t('card.tenantChart.addedMonth')">
          <span class="stat-value text-green-500"><NNumberAnimation :from="0" :to="stats.user_added_month" /></span>
        </n-statistic>
        <n-statistic :label="$t('card.tenantChart.addedYesterday')">
          <span class="stat-value text-amber-500"><NNumberAnimation :from="0" :to="stats.user_added_yesterday" /></span>
        </n-statistic>
      </div>
      <div class="chart-container">
        <n-spin v-if="loading" size="large" />
        <div v-if="!loading && errorMsg" class="message-overlay">{{ errorMsg }}</div>
        <div v-if="!loading && !errorMsg && isEmpty" class="message-overlay"><NEmpty :description="$t('card.noData')" /></div>
        <v-chart v-show="!loading && !errorMsg && !isEmpty" ref="chartRef" class="chart" :option="chartOption" autoresize />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { NSpin, NEmpty, NNumberAnimation, NStatistic } from 'naive-ui'
import { useThemeStore } from '@/store/modules/theme'
import { $t } from '@/locales'
import VChart from 'vue-echarts'
import { useData } from './useData'

defineProps<{ title: string }>()

const { loading, errorMsg, stats, chartData } = useData()
const themeStore = useThemeStore()
const chartOption = ref({})
const isEmpty = computed(() => chartData.value.monthLabels.length === 0)

watch(chartData, (newData) => {
  if (!newData || newData.monthLabels.length === 0) return

  const { monthLabels, userCounts } = newData
  const seriesName = $t('card.tenantChart.seriesName', 'New Users')

  chartOption.value = {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: '3%', right: '4%', top: '10%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      data: monthLabels,
      axisTick: { show: false },
      axisLine: { show: false },
      axisLabel: { color: themeStore.isDark ? '#aaa' : '#888' }
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: themeStore.isDark ? '#aaa' : '#888' },
      splitLine: { lineStyle: { color: themeStore.isDark ? '#333' : '#eee', type: 'dashed' } },
    },
    series: [{
      name: seriesName,
      type: 'bar',
      barWidth: '40%',
      data: userCounts,
      itemStyle: {
        color: themeStore.isDark ? '#36a2eb' : '#4bc0c0',
        borderRadius: [4, 4, 0, 0]
      }
    }]
  }
}, { deep: true })
</script>

<style scoped>
.tenant-chart-card { height: 100%; display: flex; flex-direction: column; padding: 16px; box-sizing: border-box; }
.title { font-size: 16px; font-weight: 600; margin-bottom: 12px; }
.content { flex-grow: 1; display: flex; gap: 16px; min-height: 200px; }
.stats-panel { width: 33.33%; display: flex; flex-direction: column; justify-content: space-around; border-right: 1px solid var(--n-border-color); padding-right: 16px; }
:deep(.n-statistic .n-statistic-value__content) { font-size: 1.5rem; font-weight: 600; }
.chart-container { flex-grow: 1; position: relative; display: flex; align-items: center; justify-content: center; }
.chart { width: 100%; height: 100%; }
.message-overlay { position: absolute; top: 0; left: 0; right: 0; bottom: 0; display: flex; align-items: center; justify-content: center; }
</style>
