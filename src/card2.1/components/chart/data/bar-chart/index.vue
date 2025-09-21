<template>
  <div class="bar-chart-card h-full flex flex-col">
    <div v-if="title" class="header">
      <h3>{{ title }}</h3>
    </div>
    <div ref="chartContainer" class="flex-1 min-h-0">
      <VChart
        v-if="chartReady"
        ref="chartRef"
        class="echarts w-full h-full"
        :option="option"
        autoresize
      />
      <div v-else class="empty-state">{{ $t('card.noData') }}</div>
    </div>

    <div v-if="showDebug" class="debug-info">
      <n-collapse size="small">
        <n-collapse-item title="调试信息" name="debug">
          <n-code :code="debugInfo" language="json" />
        </n-collapse-item>
      </n-collapse>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, provide } from 'vue'
import { NCollapse, NCollapseItem, NCode } from 'naive-ui'
import { use } from 'echarts/core'
import { BarChart } from 'echarts/charts'
import { CanvasRenderer } from 'echarts/renderers'
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  DataZoomComponent
} from 'echarts/components'
import VChart, { THEME_KEY } from 'vue-echarts'
import { useThemeStore } from '@/store/modules/theme'

use([CanvasRenderer, BarChart, GridComponent, TooltipComponent, LegendComponent, DataZoomComponent])

interface Props {
  rawDataSources?: any
  title?: string
  showDebug?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  rawDataSources: null,
  title: '',
  showDebug: false
})

const themeStore = useThemeStore()
provide(THEME_KEY, computed(() => themeStore.naiveThemeName))

// 解析系列数据（从标准数据绑定入口）
const parsedSeriesList = computed(() => {
  const binding = props.rawDataSources?.dataSourceBindings?.seriesList
  if (!binding?.rawData) return null
  try {
    const raw = JSON.parse(binding.rawData)
    // 兼容两种结构：{ series: [...] } 或直接数组 [...]
    const series = Array.isArray(raw) ? raw : raw?.series
    if (!Array.isArray(series)) return null
    return series as Array<{ name?: string; data: any[]; unit?: string }>
  } catch {
    return null
  }
})

// 是否就绪（有数据可画）
const chartReady = computed(() => !!(parsedSeriesList.value && parsedSeriesList.value.length))

// 将数据转换为 ECharts 可识别格式
function normalizePoints(points: any[]): number[] | Array<[number, number]> {
  if (!Array.isArray(points)) return []
  // 判断是否为纯数值序列（类目轴）或时间序列
  // - 若点为 [x,y] 或 {x,y} → 时间/数值轴
  // - 若点为 number → 类目轴（按索引）
  if (typeof points[0] === 'number') return points as number[]

  return points.map((p: any) => {
    if (Array.isArray(p) && p.length >= 2) return [Number(p[0]), Number(p[1])] as [number, number]
    if (p && typeof p === 'object' && 'x' in p && 'y' in p) return [Number(p.x), Number(p.y)] as [number, number]
    return null
  }).filter(Boolean) as Array<[number, number]>
}

// 推断 x 轴类型
const isTimeAxis = computed(() => {
  const s = parsedSeriesList.value
  if (!s || !s.length) return false
  const first = s[0]?.data?.[0]
  if (!first) return false
  // 有 [x,y] 或 {x,y} 则认为是时间/数值轴
  return Array.isArray(first) || (typeof first === 'object' && 'x' in first)
})

// 构造图表配置
const option = computed(() => {
  const seriesList = parsedSeriesList.value || []
  const isDark = themeStore.isDark
  const textColor = isDark ? '#ddd' : '#333'
  const gridColor = isDark ? '#333' : '#eee'

  const echartsSeries = seriesList.map((s, idx) => ({
    name: s?.name || `系列${idx + 1}`,
    type: 'bar',
    data: normalizePoints(s?.data || []),
    barMaxWidth: 32,
    emphasis: { focus: 'series' }
  }))

  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' }
    },
    legend: {
      show: echartsSeries.length > 1,
      textStyle: { color: textColor }
    },
    grid: { left: '5%', right: '5%', top: props.title ? '15%' : '8%', bottom: '10%', containLabel: true },
    xAxis: isTimeAxis.value
      ? {
          type: 'time',
          axisLine: { lineStyle: { color: gridColor } },
          axisLabel: { color: textColor }
        }
      : {
          type: 'category',
          axisLine: { lineStyle: { color: gridColor } },
          axisLabel: { color: textColor }
        },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: gridColor, type: 'dashed' } },
      axisLabel: { color: textColor }
    },
    dataZoom: [
      { type: 'inside', start: 0, end: 100 },
      { type: 'slider', start: 0, end: 100 }
    ],
    series: echartsSeries
  }
})

const chartRef = ref<any>(null)
const chartContainer = ref<HTMLElement | null>(null)

// 调试信息
const debugInfo = computed(() => {
  return JSON.stringify(
    {
      hasData: chartReady.value,
      seriesCount: parsedSeriesList.value?.length || 0,
      sample: parsedSeriesList.value?.[0]?.data?.slice?.(0, 3) || [],
      rawDataSources: props.rawDataSources
    },
    null,
    2
  )
})

watch(
  () => props.rawDataSources,
  () => {
    // 依赖 option 的计算属性会自动更新
  },
  { deep: true }
)
</script>

<style scoped>
.bar-chart-card {
  background: var(--card-color);
  border-radius: 8px;
  border: 1px solid var(--border-color);
}
.header {
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-color);
}
.header h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-color);
}
.empty-state {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-color-3);
}
.debug-info {
  padding: 8px 12px;
  border-top: 1px solid var(--border-color);
}
</style>

