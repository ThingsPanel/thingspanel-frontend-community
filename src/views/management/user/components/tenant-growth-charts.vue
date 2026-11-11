<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import dayjs from 'dayjs'
import { $t } from '@/locales'
import { useAppStore } from '@/store/modules/app'
import { useEcharts } from '@/hooks/chart/use-echarts'

defineOptions({ name: 'TenantGrowthCharts' })

const props = defineProps<{
  trend: Api.UserManagement.TenantDailyGrowth[]
  loading: boolean
}>()

const appStore = useAppStore()
const barRange = ref<7 | 30>(7)

const barTrend = computed(() => props.trend.slice(-barRange.value))

function dateLabels(data: Api.UserManagement.TenantDailyGrowth[]) {
  return data.map(item => dayjs(item.date).format('MM-DD'))
}

function lineOptions() {
  return {
    tooltip: {
      trigger: 'axis' as const,
      formatter: (params: any) => {
        const index = params?.[0]?.dataIndex ?? 0
        const item = barTrend.value[index]
        if (!item) return ''
        return [
          item.date,
          `${$t('page.manage.user.statistics.cumulative')}: ${item.cumulative_total}`,
          `${$t('page.manage.user.statistics.dailyNew')}: ${item.new_total}`
        ].join('<br/>')
      }
    },
    grid: { left: 16, right: 16, top: 12, bottom: 8, containLabel: true },
    xAxis: {
      type: 'category' as const,
      boundaryGap: false,
      data: dateLabels(barTrend.value),
      axisLabel: { hideOverlap: true }
    },
    yAxis: { type: 'value' as const, minInterval: 1, min: 0 },
    series: [
      {
        name: $t('page.manage.user.statistics.cumulative'),
        type: 'line' as const,
        smooth: false,
        symbol: 'circle',
        symbolSize: 4,
        color: '#646cff',
        areaStyle: { color: 'rgba(100, 108, 255, 0.12)' },
        data: barTrend.value.map(item => item.cumulative_total)
      }
    ]
  }
}

function barOptions() {
  const data = barTrend.value
  return {
    tooltip: {
      trigger: 'axis' as const,
      axisPointer: { type: 'shadow' as const },
      formatter: (params: any) => {
        const index = params?.[0]?.dataIndex ?? 0
        const item = data[index]
        if (!item) return ''
        return `${item.date}<br/>${$t('page.manage.user.statistics.dailyNew')}: ${item.new_total}`
      }
    },
    grid: { left: 16, right: 16, top: 12, bottom: 8, containLabel: true },
    xAxis: {
      type: 'category' as const,
      data: dateLabels(data),
      axisLabel: { hideOverlap: true }
    },
    yAxis: { type: 'value' as const, minInterval: 1, min: 0 },
    series: [
      {
        name: $t('page.manage.user.statistics.dailyNew'),
        type: 'bar' as const,
        barMaxWidth: 28,
        data: data.map((item, index) => ({
          value: item.new_total,
          itemStyle: {
            color: index === data.length - 1 ? '#646cff' : 'rgba(100, 108, 255, 0.55)',
            borderRadius: [4, 4, 0, 0]
          }
        }))
      }
    ]
  }
}

const { domRef: lineRef, updateOptions: updateLineOptions } = useEcharts(lineOptions, {
  onRender: chart => {
    // Data can arrive while the chart container is still hidden or sizing.
    chart.setOption(lineOptions())
    chart.hideLoading()
  }
})
const { domRef: barRef, updateOptions: updateBarOptions } = useEcharts(barOptions, {
  onRender: chart => {
    chart.setOption(barOptions())
    chart.hideLoading()
  }
})

watch(
  [() => props.trend, () => appStore.locale, barRange],
  async () => {
    await Promise.all([updateLineOptions(() => lineOptions()), updateBarOptions(() => barOptions())])
  },
  { deep: true }
)
</script>

<template>
  <section class="growth-section">
    <div class="growth-toolbar">
      <span class="growth-heading">{{ $t('page.manage.user.statistics.growthTitle') }}</span>
      <NRadioGroup v-model:value="barRange" size="small" :disabled="loading">
        <NRadioButton :value="7">{{ $t('page.manage.user.statistics.last7Days') }}</NRadioButton>
        <NRadioButton :value="30">{{ $t('page.manage.user.statistics.last30Days') }}</NRadioButton>
      </NRadioGroup>
    </div>
    <div class="growth-grid">
      <div class="growth-panel">
        <h3>{{ $t('page.manage.user.statistics.cumulativeTitle') }}</h3>
        <NSpin :show="loading">
          <div v-show="trend.length" ref="lineRef" class="growth-chart"></div>
          <NEmpty v-if="!trend.length" class="growth-empty" :description="$t('common.nodata')" />
        </NSpin>
      </div>
      <div class="growth-panel">
        <h3>{{ $t('page.manage.user.statistics.dailyNewTitle') }}</h3>
        <NSpin :show="loading">
          <div v-show="trend.length" ref="barRef" class="growth-chart"></div>
          <NEmpty v-if="!trend.length" class="growth-empty" :description="$t('common.nodata')" />
        </NSpin>
      </div>
    </div>
  </section>
</template>

<style scoped>
.growth-section {
  margin-top: 14px;
  flex-shrink: 0;
}
.growth-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}
.growth-heading {
  font-size: 14px;
  font-weight: 600;
}
.growth-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}
.growth-panel {
  min-width: 0;
  padding: 12px 14px 6px;
  border: 1px solid var(--n-border-color);
  border-radius: 8px;
}
.growth-panel h3 {
  margin: 0 0 4px;
  font-size: 13px;
  font-weight: 500;
  color: var(--n-text-color-2);
}
.growth-chart {
  height: 160px;
  width: 100%;
}
.growth-empty {
  height: 160px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
@media (max-width: 768px) {
  .growth-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
