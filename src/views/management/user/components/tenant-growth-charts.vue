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
      formatter: (params: any[]) => {
        const index = params?.[0]?.dataIndex ?? 0
        const item = props.trend[index]
        if (!item) return ''
        return [
          item.date,
          `${$t('page.manage.user.statistics.cumulative')}: ${item.cumulative_total}`,
          `${$t('page.manage.user.statistics.dailyNew')}: ${item.new_total}`
        ].join('<br/>')
      }
    },
    grid: { left: 16, right: 16, top: 24, bottom: 12, containLabel: true },
    xAxis: {
      type: 'category' as const,
      boundaryGap: false,
      data: dateLabels(props.trend),
      axisLabel: { hideOverlap: true }
    },
    yAxis: { type: 'value' as const, minInterval: 1, min: 0 },
    series: [
      {
        name: $t('page.manage.user.statistics.cumulative'),
        type: 'line' as const,
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        color: '#646cff',
        areaStyle: { color: 'rgba(100, 108, 255, 0.12)' },
        data: props.trend.map(item => item.cumulative_total)
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
      formatter: (params: any[]) => {
        const index = params?.[0]?.dataIndex ?? 0
        const item = data[index]
        if (!item) return ''
        return `${item.date}<br/>${$t('page.manage.user.statistics.dailyNew')}: ${item.new_total}`
      }
    },
    grid: { left: 16, right: 16, top: 24, bottom: 12, containLabel: true },
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

const { domRef: lineRef, updateOptions: updateLineOptions } = useEcharts(lineOptions)
const { domRef: barRef, updateOptions: updateBarOptions } = useEcharts(barOptions)

watch(
  [() => props.trend, () => appStore.locale, barRange],
  async () => {
    await Promise.all([updateLineOptions(() => lineOptions()), updateBarOptions(() => barOptions())])
  },
  { deep: true }
)
</script>

<template>
  <NGrid class="mt-12px" cols="1 l:2" :x-gap="12" :y-gap="12" responsive="screen">
    <NGridItem>
      <NCard size="small" :bordered="true">
        <template #header>
          <span class="text-14px font-600">{{ $t('page.manage.user.statistics.cumulativeTitle') }}</span>
        </template>
        <NSpin :show="loading">
          <div ref="lineRef" class="h-300px w-full"></div>
        </NSpin>
      </NCard>
    </NGridItem>

    <NGridItem>
      <NCard size="small" :bordered="true">
        <template #header>
          <span class="text-14px font-600">{{ $t('page.manage.user.statistics.dailyNewTitle') }}</span>
        </template>
        <template #header-extra>
          <NRadioGroup v-model:value="barRange" size="small">
            <NRadioButton :value="7">{{ $t('page.manage.user.statistics.last7Days') }}</NRadioButton>
            <NRadioButton :value="30">{{ $t('page.manage.user.statistics.last30Days') }}</NRadioButton>
          </NRadioGroup>
        </template>
        <NSpin :show="loading">
          <div ref="barRef" class="h-300px w-full"></div>
        </NSpin>
      </NCard>
    </NGridItem>
  </NGrid>
</template>

<style scoped></style>
