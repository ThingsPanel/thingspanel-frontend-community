<script setup lang="ts">
import { defineProps, onMounted, reactive, ref, watch } from 'vue'
import { NDatePicker, NSelect, NSpace } from 'naive-ui'
import { useFullscreen } from '@vueuse/core'
import dayjs from 'dayjs'
import { telemetryDataHistoryList } from '@/service/api/device'
import { $t } from '@/locales'
import { message } from '@/utils/common/discrete'
import ChartComponent from './ChartComponent.vue'
import { useLoading } from '~/packages/hooks'

const tableData = ref<any[]>([])
const chartRef = ref()
const { isFullscreen, toggle } = useFullscreen(chartRef)
const datePickerValue = ref<[number, number] | null>(null)
const avgValue = ref<number | undefined>(undefined)
const maxValue = ref<number | undefined>(undefined)
const minValue = ref<number | undefined>(undefined)

interface Created {
  deviceId: string
  theKey: string
  theName: string
  theUnit: string
}

const props = defineProps<Created>()
const selectedOption = ref({
  device_id: props.deviceId,
  key: props.theKey,
  aggregate_window: 'no_aggregate',
  time_range: 'last_1h',
  start_time: undefined,
  end_time: undefined,
  aggregate_function: undefined
})
const { loading, startLoading, endLoading } = useLoading()
const columns = [
  {
    title: $t('common.time'),
    key: 'x',
    render: row => dayjs(row.x).format('YYYY-MM-DD HH:mm:ss')
  },
  {
    title: (props.theName ? props.theName : props.theKey) + (props.theUnit ? `(${props.theUnit})` : ''),
    key: 'y'
  }
]
const pagination = reactive({
  page: 1,
  pageSize: 10,
  pageCount: 1,
  onChange: (page: number) => {
    pagination.page = page
  }
})
const initialOptions = ref({
  baseOption: undefined,
  title: {
    text: props.theName ? props.theName : props.theKey
  },
  options: [],
  tooltip: {
    trigger: 'axis',
    formatter(params) {
      let result = `${dayjs(params[0].value[0]).format('YYYY-MM-DD HH:mm:ss')}<br/>`
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
    bottom: '3%',
    containLabel: true
  },
  toolbox: {
    right: 44,
    feature: {
      myTool1: {
        show: true,
        title: $t('common.switchLineChart'),
        icon: 'path://M-7.5 -1.036L-5.428 -1.036L-2.714 -7.4562L-0.5545 3.6333L2.2763 -2.1158L3.1518 1.6196L7.5 1.6196M-7.5 7.4562L7.5 7.4562',
        onclick: () => {
          if (initialOptions.value.series) {
            if (initialOptions.value.series[0].type === 'line') {
              message.destroyAll()
              message.info($t('common.alreadyCurveChart'))
              return
            }
            initialOptions.value.series[0].type = 'line'
          }
        }
      },
      myTool2: {
        show: true,
        title: $t('common.switchBarChart'),
        icon: 'path://M-6.2277 -1.9018L-3.5491 -1.9018L-3.5491 4.8214L-6.2277 4.8214L-6.2277 -1.9018ZM-1.3527 -4.5536L1.3259 -4.5536L1.3259 4.8214L-1.3527 4.8214L-1.3527 -4.5536ZM3.5491 -7.5L6.2277 -7.5L6.2277 4.8214L3.5491 4.8214L3.5491 -7.5ZM-7.192 7.5L7.192 7.5\n',
        onclick: () => {
          if (initialOptions.value.series) {
            if (initialOptions.value.series[0].type === 'bar') {
              window.NMessage.destroyAll()
              message.info($t('common.alreadyToChart'))
              return
            }
            initialOptions.value.series[0].type = 'bar'
          }
        }
      },
      myTool3: {
        show: true,
        title: $t('common.alreadyToChart'),
        icon: 'path://M6 6V42H42 M20 24C22.2091 24 24 22.2091 24 20C24 17.7909 22.2091 16 20 16C17.7909 16 16 17.7909 16 20C16 22.2091 17.7909 24 20 24Z M37 16C39.7614 16 42 13.7614 42 11C42 8.23858 39.7614 6 37 6C34.2386 6 32 8.23858 32 11C32 13.7614 34.2386 16 37 16Z M15 36C16.6569 36 18 34.6569 18 33C18 31.3431 16.6569 30 15 30C13.3431 30 12 31.3431 12 33C12 34.6569 13.3431 36 15 36Z M33 32C34.6569 32 36 30.6569 36 29C36 27.3431 34.6569 26 33 26C31.3431 26 30 27.3431 30 29C30 30.6569 31.3431 32 33 32Z\n',
        onclick: () => {
          if (initialOptions.value.series) {
            if (initialOptions.value.series[0].type === 'scatter') {
              window.NMessage.destroyAll()
              message.info($t('common.alreadyScatterPlot'))
              return
            }
            initialOptions.value.series[0].type = 'scatter'
          }
        }
      }
    }
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
      smooth: true
    }
  ]
})

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

const aggregationTtemToFalse = (weight: number) => {
  aggregationIntervalOptions.forEach((item, index) => {
    if (index < weight) {
      item.disabled = true
    } else {
      item.disabled = false
    }
    if (index < weight + 1) {
      selectedOption.value.aggregate_window = item.value
      if (selectedOption.value.aggregate_window !== 'no_aggregate' && !selectedOption.value.aggregate_function) {
        selectedOption.value.aggregate_function = 'avg'
      }
      if (selectedOption.value.aggregate_window === 'no_aggregate') {
        selectedOption.value.aggregate_function = undefined
      }
    }
  })
}

const navigateTime = (direction: string) => {
  let start: number | undefined = selectedOption.value.start_time
  let end: number | undefined

  if (!start) {
    // 如果没有设置开始时间，使用当前时间
    start = dayjs().startOf('hour').valueOf()
  }

  let startDate = dayjs(start)

  switch (direction) {
    case 'prevMonth':
      startDate = startDate.subtract(1, 'month').startOf('month')
      end = startDate.endOf('month').valueOf()
      break
    case 'prevDay':
      startDate = startDate.subtract(1, 'day').startOf('day')
      end = startDate.endOf('day').valueOf()
      break
    case 'prevHour':
      startDate = startDate.subtract(1, 'hour').startOf('hour')
      end = startDate.endOf('hour').valueOf()
      break
    case 'nextHour':
      startDate = startDate.add(1, 'hour').startOf('hour')
      end = startDate.endOf('hour').valueOf()
      break
    case 'nextDay':
      startDate = startDate.add(1, 'day').startOf('day')
      end = startDate.endOf('day').valueOf()
      break
    case 'nextMonth':
      startDate = startDate.add(1, 'month').startOf('month')
      end = startDate.endOf('month').valueOf()
      break
    default:
      // 如果没有匹配的方向，保持当前开始时间不变，结束时间设置为开始时间的结束
      end = startDate.endOf('hour').valueOf()
      break
  }

  start = startDate.valueOf()

  selectedOption.value.start_time = start
  selectedOption.value.end_time = end
  selectedOption.value.time_range = 'custom'

  // 更新日期选择器的值
  datePickerValue.value = [start, end]
}

watch(
  selectedOption,
  async v => {
    // 这里是当 selectedOption 变化时需要执行的逻辑

    if (v.time_range === 'custom' && (!v.start_time || !v.end_time)) {
      window.NMessage.destroyAll()
      message.info($t('common.rangeMustSelected'))
      return
    }
    startLoading()
    const { data, error } = await telemetryDataHistoryList({
      ...v
    })
    if (!error && data && initialOptions.value.series) {
      // 对数据进行排序，确保最新的数据在前面
      const sortedData = data.sort((a, b) => {
        return b.x - a.x
      })
      tableData.value = sortedData
      if (data.length > 0) {
        let sumValue = 0
        minValue.value = data[0].y || Number.NEGATIVE_INFINITY
        maxValue.value = data[0].y || Number.POSITIVE_INFINITY
        data.forEach(item => {
          if (item.y) {
            sumValue += item.y
            if (item.y < minValue.value) {
              minValue.value = item.y
            }
            if (item.y > maxValue.value) {
              maxValue.value = item.y
            }
          }
        })
        avgValue.value = sumValue / data.length
        // 这里是当 通过接口改变 initialOptions的数据

        initialOptions.value.series.forEach(series => {
          series.data = data.map(item => {
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
  { deep: true }
)

const onTimeRangeChange = value => {
  selectedOption.value.time_range = value
  if (value !== 'custom') {
    selectedOption.value.start_time = undefined
    selectedOption.value.end_time = undefined
    datePickerValue.value = null
  }
  aggregationTtemToFalse(timeWeighting[value])
}

/**
 * 根据开始时间和结束时间计算一个权重，权重越大，表示时间范围越大 1小时内，权重为0 3小时内，权重为1 6小时内，权重为2 12小时内，权重为3 24小时内，权重为4 3天内，权重为5 7天内，权重为6 15天内，权重为7
 * 30天内，权重为8
 */
const calculateTimeWeight = (start: number, end: number) => {
  const startDate = dayjs(start)
  const endDate = dayjs(end)
  const diffInHours = endDate.diff(startDate, 'hour')
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
  if (diffInHours <= 365) {
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
    const weight = calculateTimeWeight(value[0], value[1])
    aggregationTtemToFalse(weight)
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

const initData = () => {
  selectedOption.value = { ...selectedOption.value, time_range: 'last_1h' }
}

const exportData = () => {
  const excelData = [
    ['时间', (props.theName ? props.theName : props.theKey) + (props.theUnit ? `(${props.theUnit})` : '')], // 表头
    ...tableData.value.map(item => [dayjs(item.x).format('YYYY-MM-DD HH:mm:ss'), item.y])
  ]
  // save as csv
  const csvContent = excelData.map(row => row.join(',')).join('\n')
  const excelBlob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })

  const excelUrl = URL.createObjectURL(excelBlob)
  const a = document.createElement('a')
  a.href = excelUrl
  a.download = 'telemetry_data.csv'
  a.click()
  URL.revokeObjectURL(excelUrl)
  a.remove()
}

onMounted(() => {
  initData()
})
</script>

<template>
  <NSpace vertical>
    <div class="w-full flex flex-row flex-wrap">
      <div class="time-range flex flex-col items-center">
        <div class="w-full flex flex-row items-center">
          <span>{{ $t('common.timeFrame') }}：</span>
          <NSelect
            v-model:value="selectedOption.time_range"
            :options="timeOptions"
            :consistent-menu-width="false"
            class="select-item mr-2"
            @update:value="onTimeRangeChange"
          />
          <NDatePicker
            v-model:value="datePickerValue"
            type="datetimerange"
            value-format="timestamp"
            class="flex-1"
            format="yyyy-MM-dd HH:mm"
            :time-picker-props="{
              format: 'HH',
              isHourDisabled: () => false,
              isMinuteDisabled: () => true,
              isSecondDisabled: () => true
            }"
            @update:value="onCustomDateChange"
          />
        </div>
        <div class="mt-2 w-full flex flex-row flex-wrap justify-between pl-72px">
          <NButton @click="navigateTime('prevMonth')">{{ $t('card.lastOneMonth') }}</NButton>
          <NButton @click="navigateTime('prevDay')">{{ $t('card.yesterday') }}</NButton>
          <NButton @click="navigateTime('prevHour')">{{ $t('card.lastOneHour') }}</NButton>
          <NButton @click="navigateTime('nextHour')">{{ $t('card.nextOneHour') }}</NButton>
          <NButton @click="navigateTime('nextDay')">{{ $t('card.tomorrow') }}</NButton>
          <NButton @click="navigateTime('nextMonth')">{{ $t('card.nextOneMonth') }}</NButton>
        </div>
      </div>
      <div class="aggregation-range flex flex-row pl-2">
        <span class="pt-1">{{ $t('card.aggregationScope') }}：</span>
        <NSelect
          v-model:value="selectedOption.aggregate_window"
          :options="aggregationIntervalOptions"
          :consistent-menu-width="false"
          class="select-item mr-2"
          @update:value="onAggregationChange"
        />
        <span v-if="selectedOption.aggregate_window !== 'no_aggregate'" class="pt-1">
          {{ $t('card.aggregationMethod') }}：
        </span>
        <NSelect
          v-if="selectedOption.aggregate_window !== 'no_aggregate'"
          v-model:value="selectedOption.aggregate_function"
          :options="statisticsOptions"
          :consistent-menu-width="false"
          class="select-item"
          @update:value="onStatisticsChange"
        />
        <NButton class="ml-auto" @click="exportData()">{{ $t('card.exportData') }}</NButton>
      </div>
    </div>
    <div class="container-table-chart">
      <n-data-table
        class="telemetry-table"
        :loading="loading"
        :columns="columns"
        :data="tableData"
        :pagination="pagination"
      />
      <div ref="chartRef" class="telemetry-chart relative m-0 p-0">
        <div :class="`${isFullscreen ? 'h-full' : 'chart-height'} p-2`">
          <ChartComponent :initial-options="initialOptions" />
        </div>
        <div class="absolute right-0px top-5px">
          <FullScreen v-if="!isFullscreen" :full="isFullscreen" @click="toggle" />
        </div>
        <div class="flex flex-row justify-between pl-4 pr-4 font-bold">
          <span>{{ $t('card.average') }}：{{ avgValue !== undefined ? avgValue.toFixed(2) : '-' }}</span>
          <span>{{ $t('card.maxValue') }}：{{ maxValue !== undefined ? maxValue : '-' }}</span>
          <span>{{ $t('card.minValue') }}：{{ minValue !== undefined ? minValue : '-' }}</span>
        </div>
      </div>
    </div>
  </NSpace>
</template>

<style scoped>
.container-table-chart {
  display: flex;
  flex-direction: row;
}
.telemetry-chart {
  width: 60%;
}
.telemetry-table {
  width: 40%;
  min-height: 200px;
}
.chart-height {
  height: calc(100% - 24px);
  min-height: 200px;
}
.time-range {
  width: 60%;
  flex-wrap: wrap;
}
.aggregation-range {
  width: 40%;
  flex-wrap: wrap;
}
@media (max-width: 768px) {
  .container-table-chart {
    flex-direction: column;
  }
  .telemetry-chart {
    width: 100%;
  }
  .telemetry-table {
    width: 100%;
  }
  .chart-height {
    height: 400px;
  }
  .time-range {
    width: 100%;
  }
  .aggregation-range {
    width: 100%;
  }
}
.select-item {
  flex: 0;
}
</style>
