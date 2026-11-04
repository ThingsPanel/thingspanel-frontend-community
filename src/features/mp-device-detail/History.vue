<script setup>
import { computed, inject, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import dayjs from 'dayjs'
import Sheet from './Sheet.vue'
import { miniProgramSdk, navigateMini } from './bridge.js'
import { rowsOf, normalizeHistoryRows } from './schema.js'
import { historyWindowOptions, resolveHistoryWindow } from './history-filters.js'
const props = defineProps({ deviceId: String, field: Object, mode: String })
defineEmits(['close'])
const { api } = inject('mp-device')
const range = ref(props.mode === 'trend' ? '1' : '24'),
  windowSize = ref('no_aggregate'),
  aggregate = ref('avg'),
  chartType = ref('line'),
  rows = ref([]),
  error = ref(''),
  loading = ref(false),
  chartError = ref(''),
  total = ref(0),
  canvas = ref(null)
const start = ref(dayjs().subtract(1, 'day').format('YYYY-MM-DDTHH:mm')),
  end = ref(dayjs().format('YYYY-MM-DDTHH:mm'))
const rangeOptions = computed(() => [
  { value: '0', label: '自定义时间' },
  { value: '1', label: '最近1小时' },
  { value: '24', label: '最近24小时' },
  { value: '168', label: '最近7天' },
  { value: '720', label: '最近30天' },
  ...(props.mode === 'trend'
    ? [
        { value: '1440', label: '最近60天' },
        { value: '2160', label: '最近90天' },
        { value: '4320', label: '最近半年' },
        { value: '8760', label: '最近1年' }
      ]
    : [])
])
const duration = computed(() =>
  Number(range.value) ? Number(range.value) * 3600000 : dayjs(end.value).valueOf() - dayjs(start.value).valueOf()
)
const windows = computed(() => historyWindowOptions(duration.value))
const effectiveWindow = computed(() => resolveHistoryWindow(duration.value, windowSize.value))
const aggregates = [
  { value: 'avg', label: '平均值' },
  { value: 'max', label: '最大值' },
  { value: 'min', label: '最小值' },
  { value: 'sum', label: '总和' },
  { value: 'diff', label: '差值' }
]
const chartTypes = [
  { value: 'line', label: '折线图' },
  { value: 'bar', label: '柱状图' },
  { value: 'scatter', label: '散点图' }
]
const choosing = ref(null),
  draft = ref('')
const exporting = ref(false),
  exportError = ref('')
const choiceOptions = computed(
  () =>
    ({ range: rangeOptions.value, windowSize: windows.value, aggregate: aggregates, chartType: chartTypes })[
      choosing.value
    ] || []
)
const values = { range, windowSize, aggregate, chartType }
let page = 0,
  version = 0,
  chart,
  resize,
  destroyed = false,
  query
function choose(key) {
  draft.value = key === 'windowSize' ? effectiveWindow.value : values[key].value
  choosing.value = key
}
function confirmChoice() {
  values[choosing.value].value = draft.value
  choosing.value = null
}
const points = computed(() =>
  normalizeHistoryRows(rows.value)
    .sort((a, b) => a.ts - b.ts)
    .map(item => [item.ts, item.value])
)
const stats = computed(() => {
  const values = points.value.map(row => row[1])
  return values.length
    ? {
        min: Math.min(...values),
        max: Math.max(...values),
        avg: Number((values.reduce((a, b) => a + b, 0) / values.length).toFixed(3))
      }
    : null
})
function filters() {
  const hours = Number(range.value),
    endTime = hours ? Date.now() : dayjs(end.value).valueOf(),
    startTime = hours ? endTime - hours * 3600000 : dayjs(start.value).valueOf()
  if (!Number.isFinite(startTime) || !Number.isFinite(endTime) || startTime >= endTime)
    throw new Error('请选择有效的开始和结束时间')
  if (props.mode === 'trend') {
    if (dayjs(startTime).add(1, 'year').valueOf() < endTime) throw new Error('时间范围不能超过一年')
  } else if (dayjs(startTime).add(1, 'month').valueOf() < endTime) throw new Error('时间范围不能超过一个月')
  return { device_id: props.deviceId, key: props.field.key, start_time: startTime, end_time: endTime }
}
async function draw() {
  if (props.mode !== 'trend' || !canvas.value || !points.value.length || destroyed) return
  try {
    const echarts = await import('echarts')
    if (destroyed || !canvas.value) return
    chart ||= echarts.init(canvas.value)
    chart.setOption(
      {
        animation: false,
        grid: { left: 42, right: 18, top: 24, bottom: 58 },
        tooltip: { trigger: 'axis', confine: true },
        xAxis: { type: 'time', axisLabel: { hideOverlap: true } },
        yAxis: { type: 'value', scale: true },
        series: [
          {
            type: chartType.value,
            data: points.value,
            showSymbol: points.value.length < 80,
            itemStyle: { color: '#1677ff' }
          }
        ]
      },
      true
    )
    if (!resize) {
      resize = new ResizeObserver(() => chart?.resize())
      resize.observe(canvas.value)
    }
  } catch {
    chartError.value = '图表绘制失败，请重试'
  }
}
async function load(reset = true) {
  const current = ++version
  loading.value = true
  error.value = ''
  chartError.value = ''
  try {
    if (reset) {
      query = filters()
      rows.value = []
      page = 0
    }
    const trend = props.mode === 'trend'
    const result = await api(trend ? 'telemetry/datas/statistic' : 'telemetry/datas/history/pagination', {
      ...query,
      ...(trend
        ? {
            time_range: 'custom',
            aggregate_window: effectiveWindow.value,
            ...(effectiveWindow.value !== 'no_aggregate' ? { aggregate_function: aggregate.value } : {})
          }
        : { page: page + 1, page_size: 20, export_excel: false })
    })
    if (current !== version || destroyed) return
    rows.value = reset ? rowsOf(result) : [...rows.value, ...rowsOf(result)]
    total.value = Number(result?.total || rows.value.length)
    page++
  } catch (cause) {
    if (current === version && !destroyed) error.value = cause.message
  } finally {
    if (current === version && !destroyed) {
      loading.value = false
      await nextTick()
      draw()
    }
  }
}
function display(value) {
  return value != null && typeof value === 'object' ? JSON.stringify(value) : (value ?? '--')
}
async function exportData() {
  if (exporting.value) return
  exporting.value = true
  exportError.value = ''
  try {
    const query = filters()
    const sdk = await miniProgramSdk()
    const env = await new Promise(resolve => sdk.getEnv(resolve))
    if (env?.miniprogram) {
      await navigateMini('/pages/devices/mp-export?' + new URLSearchParams(query).toString())
    } else {
      const result = await api('telemetry/datas/history/pagination', {
        ...query,
        page: 1,
        page_size: 20,
        export_excel: true
      })
      if (!result?.filePath) throw new Error('未返回导出文件')
      const url = new URL(result.filePath, location.origin)
      if (url.origin !== location.origin) throw new Error('导出文件地址与当前服务不一致')
      const link = document.createElement('a')
      link.href = url.href
      link.download = ''
      link.rel = 'noreferrer'
      link.click()
    }
  } catch (cause) {
    exportError.value = cause.message
  } finally {
    exporting.value = false
  }
}
function time(raw) {
  const n = Number(raw)
  const value = raw && Number.isFinite(n) ? (n < 1e11 ? n * 1000 : n) : raw
  return value && dayjs(value).isValid() ? dayjs(value).format('MM-DD HH:mm:ss') : '--'
}
watch([range, effectiveWindow, aggregate, start, end], () => load())
watch(chartType, draw)
onMounted(() => load())
onBeforeUnmount(() => {
  destroyed = true
  version++
  resize?.disconnect()
  chart?.dispose()
})
</script>
<template>
  <Sheet :title="`${field.name} · ${mode === 'trend' ? '趋势' : '历史列表'}`" @close="$emit('close')">
    <button v-if="mode === 'history'" :disabled="exporting" @click="exportData">
      {{ exporting ? '导出中' : '导出' }}
    </button>
    <p v-if="exportError" class="mp-error" role="alert">{{ exportError }}</p>
    <div class="mp-history-filters">
      <button @click="choose('range')">{{ rangeOptions.find(item => item.value === range)?.label }} ▾</button>
      <template v-if="mode === 'trend'">
        <button @click="choose('windowSize')">
          {{ windows.find(item => item.value === effectiveWindow)?.label }} ▾
        </button>
        <button v-if="effectiveWindow !== 'no_aggregate'" @click="choose('aggregate')">
          {{ aggregates.find(item => item.value === aggregate)?.label }} ▾
        </button>
        <button @click="choose('chartType')">{{ chartTypes.find(item => item.value === chartType)?.label }} ▾</button>
      </template>
    </div>
    <div v-if="range === '0'">
      <label class="mp-field">
        开始时间
        <input v-model="start" type="datetime-local" />
      </label>
      <label class="mp-field">
        结束时间
        <input v-model="end" type="datetime-local" />
      </label>
    </div>
    <div v-if="loading" class="mp-state">查询中…</div>
    <div v-if="error" class="mp-state mp-error" role="alert">
      {{ error }}
      <button @click="load()">重试</button>
    </div>
    <div v-if="!loading && !error && !rows.length" class="mp-state">所选时间范围内暂无数据</div>
    <div
      v-show="mode === 'trend' && !error && rows.length"
      ref="canvas"
      class="mp-history-chart"
      aria-label="遥测趋势图"
      role="img"
    />
    <p v-if="chartError" class="mp-error">
      {{ chartError }}
      <button @click="draw">重试</button>
    </p>
    <p v-if="mode === 'trend' && stats && !error" class="mp-history-stats">
      最小 {{ stats.min }}&emsp;最大 {{ stats.max }}&emsp;平均 {{ stats.avg }}
    </p>
    <table v-if="rows.length && !error" class="mp-history-table">
      <thead>
        <tr>
          <th>时间</th>
          <th>值{{ field.unit ? ` (${field.unit})` : '' }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(row, index) in rows" :key="index">
          <td>{{ time(row.ts ?? row.x ?? row.time ?? row.timestamp) }}</td>
          <td>{{ display(row.value ?? row.y) }}</td>
        </tr>
      </tbody>
    </table>
    <button v-if="mode === 'history' && rows.length < total" :disabled="loading" @click="load(false)">
      加载更多（{{ rows.length }}/{{ total }}）
    </button>
    <Sheet v-if="choosing" title="请选择" choice @close="choosing = null">
      <template #heading>
        <header class="mp-choice-heading">
          <button @click="choosing = null">取消</button>
          <strong>请选择</strong>
          <button @click="confirmChoice">确定</button>
        </header>
      </template>
      <button
        v-for="option in choiceOptions"
        :key="option.value"
        :class="{ selected: draft === option.value }"
        :aria-pressed="draft === option.value"
        :disabled="option.disabled"
        @click="draft = option.value"
      >
        <span>{{ option.label }}</span>
        <span v-if="draft === option.value" aria-hidden="true">✓</span>
      </button>
    </Sheet>
  </Sheet>
</template>
