<script setup lang="ts">
import { computed, defineProps, reactive, ref, watch } from 'vue'
import { NDataTable, NDatePicker, NEmpty, NSelect, NSpace } from 'naive-ui'
import { useFullscreen } from '@vueuse/core'
import dayjs from 'dayjs'
import { useThemeStore } from '@/store/modules/theme'
import { CalendarOutline, TrendingUpOutline, BarChartOutline } from '@vicons/ionicons5'
import { ChartScatter } from '@vicons/carbon'
import { telemetryStatisticData } from '@/service/api/device'
import { $t } from '@/locales'
import { message } from '@/utils/common/discrete'
import ChartComponent from './ChartComponent.vue'
import { useLoading } from '~/packages/hooks'
import { demoTimeSeries, isDeviceDetailDemo } from '@/utils/device-detail-demo-data'

const theme = useThemeStore()
const queryFailed = ref(false)
const tableData = ref<any[]>([])

const tableThemeOverrides = {
  borderColor: 'var(--border-color)',
  borderRadius: '10px',
  fontSizeMedium: '14px',
  lineHeight: '1.5',
  thColor: 'var(--body-color)',
  thColorHover: 'var(--body-color)',
  thFontWeight: '600',
  thTextColor: 'var(--text-color)',
  tdColor: 'var(--card-color)',
  tdColorHover: 'var(--primary-color-suppl)',
  tdColorSorting: 'var(--primary-color-suppl)',
  tdTextColor: 'var(--text-color)',
  thPaddingMedium: '12px',
  tdPaddingMedium: '9px 12px'
}

const timeSeriesRowKey = (row: any) => `${row.x}-${row.y}`
const chartRef = ref()
const { isFullscreen, toggle } = useFullscreen(chartRef)
const datePickerValue = ref<[number, number] | null>(null)
const avgValue = ref<number | undefined>(undefined)
const maxValue = ref<number | undefined>(undefined)
const minValue = ref<number | undefined>(undefined)

interface Created {
  deviceId: string
  theKey: string
  headerExport?: boolean
  theName: string
  theUnit: string
}

const props = defineProps<Created>()
interface HistorySelection {
  device_id: string
  key: string
  aggregate_window: string
  time_range: string
  start_time?: number
  end_time?: number
  aggregate_function?: string
}
const selectedOption = ref<HistorySelection>({
  device_id: props.deviceId,
  key: props.theKey,
  aggregate_window: 'no_aggregate',
  time_range: 'last_1h',
  start_time: undefined,
  end_time: undefined,
  aggregate_function: undefined
})
const { loading, startLoading, endLoading } = useLoading()
function displayReading(value: number | undefined) {
  if (value === undefined) return '—'
  return selectedOption.value.aggregate_window === 'no_aggregate'
    ? String(value)
    : String(Number(value.toPrecision(10)))
}
const columns = [
  {
    title: $t('card.reportTime'),
    key: 'x',
    render: row => dayjs(row.x).format('YYYY-MM-DD HH:mm:ss.SSS')
  },
  {
    title: (props.theName ? props.theName : props.theKey) + (props.theUnit ? `(${props.theUnit})` : ''),
    key: 'y',
    render: row => displayReading(row.y)
  }
]
const pagination = reactive({
  page: 1,
  pageSize: 10,
  pageSlot: 5,
  onChange: (page: number) => {
    pagination.page = page
  }
})
const initialOptions = ref({
  baseOption: undefined,
  title: {
    text: [props.theName || props.theKey, props.theUnit && '(' + props.theUnit + ')'].filter(Boolean).join(' '),
    textStyle: { fontSize: 15 }
  },
  options: [],
  tooltip: {
    trigger: 'axis',
    formatter(params) {
      let result = `${dayjs(params[0].value[0]).format('YYYY-MM-DD HH:mm:ss.SSS')}<br/>`
      params.forEach(param => {
        result += `${param.marker} ${props.theName ? props.theName : props.theKey}: ${param.value[1]}${
          props.theUnit ? props.theUnit : ''
        }<br/>`
      })
      return result
    }
  },
  legend: {
    data: ['test_key']
  },
  dataZoom: [
    {
      type: 'slider', // 添加一个滑动条型的 dataZoom
      show: true,
      dataBackground: { lineStyle: { color: theme.themeColor } },
      fillerColor: theme.themeColor + '20',
      xAxisIndex: [0],
      start: 0,
      end: 100
    },
    {
      type: 'inside', // 添加一个内置型的 dataZoom，支持鼠标滚轮或触摸板缩放
      xAxisIndex: [0],
      start: 0,
      end: 100
    }
  ],
  grid: {
    left: '3%',
    right: '4%',
    bottom: 64,
    containLabel: true
  },
  xAxis: {
    boundaryGap: false,
    type: 'time' as 'category'
  },
  yAxis: {
    type: 'value',
    // min: 0, // 设置 y 轴的最小值
    // max: 0, // 设置 y 轴的最大值
    scale: true
  },
  series: [
    {
      data: [] as any[],
      type: 'line',
      smooth: false,
      color: theme.themeColor
    }
  ]
})

watch(
  () => theme.themeColor,
  color => {
    initialOptions.value.series[0].color = color
    const slider = initialOptions.value.dataZoom[0]
    if (slider.dataBackground) slider.dataBackground.lineStyle.color = color
    slider.fillerColor = color + '20'
  }
)

const chartModes = [
  { type: 'line', icon: TrendingUpOutline, label: 'common.switchLineChart' },
  { type: 'bar', icon: BarChartOutline, label: 'common.switchBarChart' },
  { type: 'scatter', icon: ChartScatter, label: 'common.switchScatterPlots' }
] as const

const timeOptions = [
  { label: $t('common.custom'), value: 'custom' },
  { label: $t('common.last_5m'), value: 'last_5m' },
  { label: $t('common.last_15m'), value: 'last_15m' },
  { label: $t('common.last_30m'), value: 'last_30m' },
  { label: $t('common.lastHours1'), value: 'last_1h' },
  { label: $t('common.lastHours3'), value: 'last_3h' },
  { label: $t('common.lastHours6'), value: 'last_6h' },
  { label: $t('common.lastHours12'), value: 'last_12h' },
  { label: $t('common.lastHours24'), value: 'last_24h' },
  { label: $t('common.lastDays3'), value: 'last_3d' },
  { label: $t('common.lastDays7'), value: 'last_7d' },
  { label: $t('common.lastDays15'), value: 'last_15d' },
  { label: $t('common.lastDays30'), value: 'last_30d' },
  { label: $t('common.lastDays60'), value: 'last_60d' },
  { label: $t('common.lastDays90'), value: 'last_90d' },
  { label: $t('common.halfYear'), value: 'last_6m' },
  { label: $t('common.lastYears1'), value: 'last_1y' }
]
const timeWeighting = {
  custom: 0,
  last_5m: 0,
  last_15m: 0,
  last_30m: 0,
  last_1h: 0,
  last_3h: 1,
  last_6h: 2,
  last_12h: 3,
  last_24h: 4,
  last_3d: 5,
  last_7d: 6,
  last_15d: 7,
  last_30d: 8,
  last_60d: 9,
  last_90d: 10,
  last_6m: 11,
  last_1y: 12
}

const aggregationIntervalOptions = [
  { label: $t('common.notAggre'), value: 'no_aggregate', disabled: false },
  { label: $t('common.seconds30'), value: '30s', disabled: false },
  { label: $t('common.minute1'), value: '1m', disabled: false },
  { label: $t('common.minute2'), value: '2m', disabled: false },
  { label: $t('common.minutes5'), value: '5m', disabled: false },
  { label: $t('common.minutes10'), value: '10m', disabled: false },
  { label: $t('common.minutes30'), value: '30m', disabled: false },
  { label: $t('common.hours1'), value: '1h', disabled: false },
  { label: $t('common.hours3'), value: '3h', disabled: false },
  { label: $t('common.hours6'), value: '6h', disabled: false },
  { label: $t('common.days1'), value: '1d', disabled: false },
  { label: $t('common.days7'), value: '7d', disabled: false },
  { label: $t('common.months1'), value: '1mo', disabled: false }
]

const statisticsOptions = [
  { label: $t('common.average'), value: 'avg' },
  { label: $t('generate.max-value'), value: 'max' },
  { label: $t('generate.min-value'), value: 'min' },
  { label: $t('generate.sum'), value: 'sum' },
  { label: $t('generate.diff'), value: 'diff' }
]

const minWindowIndex = ref(0)
const availableWindows = computed(() =>
  aggregationIntervalOptions.map((item, index) => ({ ...item, disabled: index < minWindowIndex.value }))
)
function constrainWindow(weight: number) {
  minWindowIndex.value = Math.min(weight, aggregationIntervalOptions.length - 1)
  const currentIndex = aggregationIntervalOptions.findIndex(
    item => item.value === selectedOption.value.aggregate_window
  )
  if (currentIndex < minWindowIndex.value) onAggregationChange(aggregationIntervalOptions[minWindowIndex.value].value)
}

const anchorTime = ref(Date.now())
const dateOpen = ref(false)
const visibleRange = computed<[number, number]>(() => {
  if (selectedOption.value.time_range === 'custom' && datePickerValue.value) return datePickerValue.value
  const preset = selectedOption.value.time_range
  const n = Number(preset.match(/\d+/)?.[0] || 1)
  const duration =
    preset === 'last_6m'
      ? 180 * 86400000
      : n * ({ m: 60000, h: 3600000, d: 86400000, y: 365 * 86400000 }[preset.slice(-1)] || 3600000)
  return [anchorTime.value - duration, anchorTime.value]
})
const navigateTime = (amount: number, unit: 'hour' | 'day' | 'month') => {
  const anchor = datePickerValue.value?.[0] ?? Date.now()
  const period = dayjs(anchor).add(amount, unit)
  onCustomDateChange([period.startOf(unit).valueOf(), period.endOf(unit).valueOf()])
}

watch(
  [selectedOption, visibleRange] as const,
  async ([v], _, onCleanup) => {
    let current = true
    onCleanup(() => {
      current = false
    })
    // 这里是当 selectedOption 变化时需要执行的逻辑

    if (v.time_range === 'custom' && (!v.start_time || !v.end_time)) {
      endLoading()
      message.info($t('common.rangeMustSelected'))
      return
    }
    startLoading()
    const { data, error } = await telemetryStatisticData({
      ...v,
      time_range: 'custom',
      start_time: visibleRange.value[0],
      end_time: visibleRange.value[1]
    })
    if (!current) return
    pagination.page = 1
    queryFailed.value = Boolean(error) || (data != null && !Array.isArray(data))
    if (!Array.isArray(data) || error) {
      tableData.value = []
      initialOptions.value.series[0].data = []
      minValue.value = maxValue.value = avgValue.value = undefined
      endLoading()
      return
    }
    {
      // 对数据进行排序，确保最新的数据在前面
      const sourceData = data.length > 0 || !isDeviceDetailDemo(props.deviceId) ? data : demoTimeSeries(props.theKey)
      const sortedData = [...sourceData].sort((a, b) => {
        return b.x - a.x
      })
      tableData.value = sortedData
      if (sourceData.length > 0) {
        let sumValue = 0
        let currentMin = Infinity
        let currentMax = -Infinity
        let count = 0
        for (const { y } of sourceData) {
          if (typeof y !== 'number' || !Number.isFinite(y)) continue
          sumValue += y
          count++
          currentMin = Math.min(currentMin, y)
          currentMax = Math.max(currentMax, y)
        }
        minValue.value = count ? currentMin : undefined
        maxValue.value = count ? currentMax : undefined
        avgValue.value = count ? sumValue / count : undefined
        // 这里是当 通过接口改变 initialOptions的数据

        initialOptions.value.series.forEach(series => {
          series.data = [...sortedData].reverse().map(item => {
            return [item.x, item.y]
          })
        })
      } else {
        initialOptions.value.series.forEach(series => {
          series.data = []
        })
        maxValue.value = undefined
        minValue.value = undefined
        avgValue.value = undefined
      }
    }
    endLoading()
  },
  { deep: true, immediate: true }
)

const onTimeRangeChange = (value: string) => {
  if (value === 'custom') {
    dateOpen.value = true
    return
  }
  anchorTime.value = Date.now()
  selectedOption.value.time_range = value
  selectedOption.value.start_time = undefined
  selectedOption.value.end_time = undefined
  datePickerValue.value = null
  dateOpen.value = false
  constrainWindow(timeWeighting[value])
}

/**
 * 根据开始时间和结束时间计算一个权重，权重越大，表示时间范围越大 1小时内，权重为0 3小时内，权重为1 6小时内，权重为2 12小时内，权重为3 24小时内，权重为4 3天内，权重为5 7天内，权重为6 15天内，权重为7
 * 30天内，权重为8
 */
const calculateTimeWeight = (start: number, end: number) => {
  const startDate = dayjs(start)
  const endDate = dayjs(end)
  const diffInHours = endDate.diff(startDate, 'hour', true)
  if (diffInHours <= 1) {
    return 0
  }
  if (diffInHours <= 3) {
    return 1
  }
  if (diffInHours <= 6) {
    return 2
  }
  if (diffInHours <= 12) {
    return 3
  }
  if (diffInHours <= 24) {
    return 4
  }
  if (diffInHours <= 3 * 24) {
    return 5
  }
  if (diffInHours <= 7 * 24) {
    return 6
  }
  if (diffInHours <= 15 * 24) {
    return 7
  }
  if (diffInHours <= 30 * 24) {
    return 8
  }
  if (diffInHours <= 60 * 24) {
    return 9
  }
  if (diffInHours <= 90 * 24) {
    return 10
  }
  if (diffInHours <= 6 * 30 * 24) {
    return 11
  }
  if (diffInHours <= 365 * 24) {
    return 12
  }
  return 13
}

const onCustomDateChange = value => {
  if (value) {
    selectedOption.value.start_time = value[0]
    selectedOption.value.end_time = value[1]
    selectedOption.value.time_range = 'custom'
    datePickerValue.value = value
    dateOpen.value = false
    const weight = calculateTimeWeight(value[0], value[1])
    constrainWindow(weight)
  }
}

const onAggregationChange = value => {
  selectedOption.value.aggregate_window = value
  if (value !== 'no_aggregate' && !selectedOption.value.aggregate_function) {
    selectedOption.value.aggregate_function = 'avg'
  }
  if (value === 'no_aggregate') {
    selectedOption.value.aggregate_function = undefined
  }
}

const onStatisticsChange = value => {
  selectedOption.value.aggregate_function = value
}

const exportData = () => {
  const excelData = [
    [
      $t('card.reportTime'),
      (props.theName ? props.theName : props.theKey) + (props.theUnit ? `(${props.theUnit})` : '')
    ], // 表头
    ...tableData.value.map(item => [dayjs(item.x).format('YYYY-MM-DD HH:mm:ss.SSS'), item.y])
  ]
  // save as csv
  const csvContent = excelData
    .map(row => row.map(value => '"' + String(value ?? '').replaceAll('"', '""') + '"').join(','))
    .join('\r\n')
  const excelBlob = new Blob(['\uFEFF', csvContent], { type: 'text/csv;charset=utf-8;' })

  const excelUrl = URL.createObjectURL(excelBlob)
  const a = document.createElement('a')
  a.href = excelUrl
  a.download = 'telemetry_data.csv'
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()
  // Let the browser consume the Blob URL before releasing it. Revoking it in
  // the same task as click() can cancel the download in Chromium and Safari.
  window.setTimeout(() => {
    URL.revokeObjectURL(excelUrl)
    a.remove()
  }, 1000)
}

defineExpose({ exportData, canExport: computed(() => !loading.value && tableData.value.length > 0) })
const jumpGroups = [
  { unit: 'hour', prev: 'card.lastOneHour', next: 'card.nextOneHour' },
  { unit: 'day', prev: 'card.yesterday', next: 'card.tomorrow' },
  { unit: 'month', prev: 'card.lastOneMonth', next: 'card.nextOneMonth' }
] as const
const jumpOptions = computed(() =>
  jumpGroups.flatMap(({ unit, prev, next }) => [
    { key: unit + '-prev', label: $t(prev) },
    { key: unit + '-next', label: $t(next) }
  ])
)
function selectJump(key: string) {
  for (const { unit } of jumpGroups) {
    if (key === unit + '-prev' || key === unit + '-next') navigateTime(key.endsWith('-prev') ? -1 : 1, unit)
  }
}
const dateLabel = computed(
  () => datePickerValue.value?.map(t => dayjs(t).format('YYYY-MM-DD HH:mm')).join(' – ') || $t('card.customDates')
)
</script>

<template>
  <NSpace vertical>
    <div class="query-tools">
      <div class="time-controls">
        <div class="time-selector">
          <span>{{ $t('common.timeFrame') }}</span>
          <NSelect
            :aria-label="$t('common.timeFrame')"
            :value="selectedOption.time_range"
            :options="timeOptions"
            @update:value="onTimeRangeChange"
          />
        </div>
        <n-popover
          v-model:show="dateOpen"
          trigger="click"
          placement="bottom-start"
          :show-arrow="false"
          style="max-width: 94vw; overflow: auto; padding: 0"
        >
          <template #trigger>
            <n-button class="custom-date" :title="dateLabel" :aria-expanded="dateOpen">
              <template #icon>
                <n-icon><CalendarOutline /></n-icon>
              </template>
              <span>{{ dateLabel }}</span>
            </n-button>
          </template>
          <NDatePicker panel :value="datePickerValue" type="datetimerange" @update:value="onCustomDateChange" />
        </n-popover>
        <div class="time-jumps">
          <n-button-group v-for="group in jumpGroups" :key="group.unit">
            <n-button @click="navigateTime(-1, group.unit)">{{ $t(group.prev) }}</n-button>
            <n-button @click="navigateTime(1, group.unit)">{{ $t(group.next) }}</n-button>
          </n-button-group>
        </div>
        <div class="compact-jumps">
          <n-dropdown trigger="click" :options="jumpOptions" @select="selectJump">
            <n-button>{{ $t('card.switchPeriod') }} ▾</n-button>
          </n-dropdown>
        </div>
      </div>
      <div class="aggregate-controls">
        <div>
          <span>{{ $t('card.aggregationScope') }}</span>
          <NSelect
            :aria-label="$t('card.aggregationScope')"
            :value="selectedOption.aggregate_window"
            :options="availableWindows"
            @update:value="onAggregationChange"
          />
        </div>
        <div v-if="selectedOption.aggregate_window !== 'no_aggregate'">
          <span>{{ $t('card.aggregationMethod') }}</span>
          <NSelect
            :aria-label="$t('card.aggregationMethod')"
            :value="selectedOption.aggregate_function"
            :options="statisticsOptions"
            @update:value="onStatisticsChange"
          />
        </div>
      </div>
      <n-button v-if="!headerExport" :disabled="loading || !tableData.length" @click="exportData">
        {{ $t('card.exportData') }}
      </n-button>
    </div>
    <n-alert v-if="queryFailed" type="error">{{ $t('page.dataForward.requestFailed') }}</n-alert>
    <div class="container-table-chart">
      <NDataTable
        class="telemetry-table device-detail-table"
        :loading="loading"
        :columns="columns"
        :data="tableData"
        size="medium"
        :theme-overrides="tableThemeOverrides"
        :bordered="true"
        :bottom-bordered="true"
        :single-column="false"
        :single-line="true"
        :row-key="timeSeriesRowKey"
        :pagination="pagination"
      >
        <template #empty>
          <NEmpty size="small" :description="$t('common.noData')" />
        </template>
      </NDataTable>
      <div ref="chartRef" class="telemetry-chart relative m-0 p-0">
        <div :class="`${isFullscreen ? 'h-full' : 'chart-height'} p-2`">
          <ChartComponent :initial-options="initialOptions" />
        </div>
        <div class="chart-tools">
          <n-button
            v-for="mode in chartModes"
            :key="mode.type"
            size="small"
            :type="initialOptions.series[0].type === mode.type ? 'primary' : 'default'"
            secondary
            :title="$t(mode.label)"
            :aria-label="$t(mode.label)"
            :aria-pressed="initialOptions.series[0].type === mode.type"
            @click="initialOptions.series[0].type = mode.type"
          >
            <n-icon><component :is="mode.icon" /></n-icon>
          </n-button>
          <n-button
            quaternary
            size="small"
            :title="$t(isFullscreen ? 'icon.fullscreenExit' : 'icon.fullscreen')"
            :aria-label="$t(isFullscreen ? 'icon.fullscreenExit' : 'icon.fullscreen')"
            @click="toggle()"
          >
            <IconGridiconsFullscreenExit v-if="isFullscreen" />
            <IconGridiconsFullscreen v-else />
          </n-button>
        </div>
        <div class="summary-strip">
          <span>{{ $t('card.average') }}：{{ avgValue !== undefined ? avgValue.toFixed(2) : '-' }}</span>
          <span>{{ $t('card.maxValue') }}：{{ displayReading(maxValue) }}</span>
          <span>{{ $t('card.minValue') }}：{{ displayReading(minValue) }}</span>
        </div>
      </div>
    </div>
  </NSpace>
</template>

<style scoped>
.query-tools {
  container-type: inline-size;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  padding: 16px 0;
  border-block: 1px solid var(--border-color, #ddd);
}
.time-controls,
.time-selector,
.aggregate-controls,
.aggregate-controls > div,
.time-jumps,
.chart-tools {
  display: flex;
  align-items: center;
  gap: 8px;
}
.time-controls,
.aggregate-controls {
  flex-wrap: wrap;
}
.time-selector span,
.aggregate-controls span {
  white-space: nowrap;
}
.time-selector .n-select {
  width: 110px;
}
.custom-date {
  max-width: 190px;
}
.custom-date :deep(.n-button__content) {
  min-width: 0;
}
.custom-date span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.time-jumps .n-button {
  padding-inline: 9px;
}
.compact-jumps {
  display: none;
}
.aggregate-controls {
  padding-left: 14px;
  border-left: 1px solid var(--border-color, #ddd);
}
.aggregate-controls .n-select {
  width: 105px;
}
@container (max-width: 1200px) {
  .time-jumps {
    display: none;
  }
  .compact-jumps {
    display: block;
  }
}
.chart-tools {
  position: absolute;
  top: 8px;
  right: 8px;
  gap: 4px;
}
@container (max-width:940px) {
  .aggregate-controls {
    padding-left: 0;
    border-left: 0;
  }
}
.container-table-chart {
  display: grid;
  grid-template-columns: minmax(250px, 32fr) minmax(0, 68fr);
  gap: 12px;
}
.telemetry-chart,
.telemetry-table {
  min-width: 0;
}
.telemetry-chart {
  background: var(--card-color, #fff);
  border: 1px solid var(--border-color, #ddd);
  border-radius: 5px;
  padding: 8px;
}
.chart-height {
  height: clamp(360px, 50vh, 585px);
}
.summary-strip {
  display: flex;
  justify-content: space-around;
  border-top: 1px solid var(--border-color, #ddd);
  padding: 12px 0 0;
  font-variant-numeric: tabular-nums;
}
@media (max-width: 850px) {
  .container-table-chart {
    grid-template-columns: 1fr;
  }
  .telemetry-chart {
    grid-row: 1;
  }
  .shift-tools {
    margin-left: 0;
  }
  .chart-height {
    height: 320px;
  }
}
</style>
