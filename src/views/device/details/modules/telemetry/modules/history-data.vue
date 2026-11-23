<script setup lang="ts">
import { defineProps, onMounted, reactive, ref } from 'vue'
import { NDataTable, NEmpty, useMessage } from 'naive-ui'
import dayjs from 'dayjs'
import { newIdempotencyKey } from '@/service/api/device-write-attempt'
import { deviceRuntimeNative } from '@/service/api/device-runtime-native'
import { waitForReadingExport } from '@/service/api/device-runtime-export-wait'
import { earliestStartWithin, exceedsInclusiveSpan } from '@/utils/history-range'
import { $t } from '@/locales'
import { useLoading } from '~/packages/hooks'
import { demoHistory, isDeviceDetailDemo } from '@/utils/device-detail-demo-data'

interface Created {
  deviceId: string
  theName?: string
  theUnit?: string
  theKey: string
}

const props = defineProps<Created>()
interface Params {
  device_id: string
  end_time: number
  start_time: number
  key: string
  page: number
  page_size: number
}

interface HistoryData {
  key: string
  ts: string
  value: unknown
}
const { loading, startLoading, endLoading } = useLoading()

// 原生原始历史单次最多 24 小时，默认查询最近 24 小时；导出可选更长的区间（最多 31 天，后台分段生成）
const MAX_RANGE_MS = 24 * 60 * 60 * 1000
const MAX_EXPORT_RANGE_MS = 31 * MAX_RANGE_MS
const exportRange = ref<[number, number] | null>(null)
const end_time = dayjs().valueOf()
const start_time = earliestStartWithin(end_time, 3600000)
const params = reactive<Params>({
  device_id: props.deviceId,
  end_time,
  start_time,
  key: props.theKey,
  page: 1,
  page_size: 10
})

const tableData = ref<HistoryData[]>([])

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

const historyRowKey = (row: HistoryData) => `${row.ts}-${row.key}`

const pagination = reactive({
  page: 1,
  pageSize: 10,
  showSizePicker: true,
  pageSizes: [5, 10, 15, 20],
  itemCount: 0,
  onChange: (page: number) => {
    pagination.page = page
    params.page = page
    getTelemetryHistoryData()
  },
  onUpdatePageSize: (pageSize: number) => {
    pagination.pageSize = pageSize
    pagination.page = 1
    params.page_size = pageSize
    params.page = 1
    getTelemetryHistoryData()
  }
})

function saveFile(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = name
  anchor.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

async function exportVisibleRange(from: string, to: string) {
  const rows = [['identifier', 'observedAt', 'value']]
  let total = 0
  for (let page = 1; ; page++) {
    const result = await deviceRuntimeNative.listReadings(props.deviceId, {
      kind: 'telemetry',
      identifier: props.theKey,
      from,
      to,
      page,
      pageSize: 100
    })
    if (page === 1) total = result.total
    if (result.total !== total || (rows.length - 1 < total && !result.items.length))
      throw new Error($t('page.dataForward.requestFailed'))
    for (const item of result.items) rows.push([item.identifier, item.observedAt, JSON.stringify(item.value)])
    if (rows.length - 1 >= total) break
  }
  const csv = rows.map(row => row.map(v => '"' + String(v ?? '').replaceAll('"', '""') + '"').join(',')).join('\r\n')
  saveFile(new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8' }), props.theKey + '.csv')
}

const exporting = ref(false)
const exportHistory = async () => {
  if (exporting.value) return
  exporting.value = true
  const [start, end] = exportRange.value ?? [params.start_time, params.end_time]
  const from = new Date(start).toISOString()
  const to = new Date(end + 1).toISOString()
  try {
    try {
      const submitted = await deviceRuntimeNative.exportReadings(
        props.deviceId,
        { identifiers: [props.theKey], from, to, format: 'csv' },
        newIdempotencyKey()
      )
      const job = await waitForReadingExport(deviceRuntimeNative, submitted)
      const file = await deviceRuntimeNative.downloadArtifact(job.downloadId)
      saveFile(file.blob, file.fileName)
    } catch (error) {
      if ((error as { status?: number })?.status !== 503 || exceedsInclusiveSpan(start, end, MAX_RANGE_MS)) throw error
      await exportVisibleRange(from, to)
    }
  } catch (error) {
    message.error(error instanceof Error ? error.message : String(error))
  } finally {
    exporting.value = false
  }
}
let latestRequest = 0
const getTelemetryHistoryData = async () => {
  const request = ++latestRequest
  startLoading()
  try {
    // 区间为 [from, to)，包含用户选择的结束时刻需加 1 毫秒
    const page = await deviceRuntimeNative.listReadings(props.deviceId, {
      kind: 'telemetry',
      identifier: props.theKey,
      from: new Date(params.start_time).toISOString(),
      to: new Date(params.end_time + 1).toISOString(),
      page: params.page,
      pageSize: params.page_size
    })
    if (request !== latestRequest) return
    const list = page.items.map(item => ({ key: item.identifier, ts: item.observedAt, value: item.value }))
    tableData.value = list.length > 0 || !isDeviceDetailDemo(props.deviceId) ? list : demoHistory(props.theKey)
    pagination.itemCount = page.total || tableData.value.length
  } catch (error) {
    if (request !== latestRequest) return
    tableData.value = []
    pagination.itemCount = 0
    message.error(error instanceof Error ? error.message : String(error))
  } finally {
    if (request === latestRequest) endLoading()
  }
}

const message = useMessage()

// 然后定义变量
const dateRange = ref<[number, number] | null>([params.start_time, params.end_time])

// 修复类型实例化过深的问题
const columns = [
  {
    title: $t('card.reportTime'),
    key: 'time',
    render: (row: HistoryData) => dayjs(row.ts).format('YYYY-MM-DD HH:mm:ss.SSS')
  },
  {
    title: [props.theName || props.theKey, props.theUnit && '(' + props.theUnit + ')'].filter(Boolean).join(' '),
    align: 'right' as const,
    key: 'value',
    render: (row: HistoryData) => (typeof row.value === 'object' ? JSON.stringify(row.value) : String(row.value))
  }
]

const rangeOpen = ref(false)
const presetHours = ref<number | null>(1)
const historyPresets = [
  { label: $t('common.lastHours1'), value: 1 },
  { label: $t('common.lastHours6'), value: 6 },
  { label: $t('common.lastHours24'), value: 24 }
]

function applyHistoryRange(start: number, end: number) {
  dateRange.value = [start, end]
  params.start_time = start
  params.end_time = end
  params.page = pagination.page = 1
  rangeOpen.value = false
  getTelemetryHistoryData()
}

function selectHistoryPreset(hours: number) {
  presetHours.value = hours
  const end = Date.now()
  applyHistoryRange(earliestStartWithin(end, hours * 3600000), end)
}

const checkDateRange = value => {
  if (!value) return
  const [start, end] = value

  if (start && end && exceedsInclusiveSpan(start, end, MAX_RANGE_MS)) {
    dateRange.value = [params.start_time, params.end_time]
    message.error('原始历史单次最多查询 24 小时')
  } else {
    presetHours.value = null
    applyHistoryRange(start, end)
  }
}

const checkExportRange = (value: [number, number] | null) => {
  if (value && exceedsInclusiveSpan(value[0], value[1], MAX_EXPORT_RANGE_MS)) {
    message.error('导出区间最多 31 天')
  }
}

const refresh = () => {
  if (presetHours.value) return selectHistoryPreset(presetHours.value)
  params.page = 1
  pagination.page = 1
  getTelemetryHistoryData()
}
onMounted(getTelemetryHistoryData)
</script>

<template>
  <section>
    <n-flex justify="space-between" align="center">
      <n-flex justify="space-between" align="center">
        <n-popover v-model:show="rangeOpen" trigger="click" placement="bottom-start">
          <template #trigger>
            <n-button>
              {{ historyPresets.find(p => p.value === presetHours)?.label || $t('common.custom') }} ·
              {{ dayjs(params.start_time).format('MM/DD HH:mm') }} –
              {{
                dayjs(params.end_time).format(
                  dayjs(params.start_time).isSame(params.end_time, 'day') ? 'HH:mm' : 'MM/DD HH:mm'
                )
              }}
              ﹀
            </n-button>
          </template>
          <n-flex vertical>
            <n-button-group>
              <n-button
                v-for="preset in historyPresets"
                :key="preset.value"
                size="small"
                :type="presetHours === preset.value ? 'primary' : 'default'"
                @click="selectHistoryPreset(preset.value)"
              >
                {{ preset.label }}
              </n-button>
            </n-button-group>
            <n-date-picker
              v-model:value="dateRange"
              type="datetimerange"
              format="yyyy-MM-dd HH:mm:ss"
              :default-time="['00:00:00', '23:59:59']"
              :time-picker-props="[{ defaultValue: 0 }, { defaultValue: 86399 }]"
              @update:value="checkDateRange"
            />
          </n-flex>
        </n-popover>
        <n-button class="ml-2" @click="refresh">{{ $t('generate.refresh') }}</n-button>
      </n-flex>

      <n-popover trigger="click" placement="bottom-end">
        <template #trigger>
          <n-button>{{ $t('generate.export') }}</n-button>
        </template>
        <n-flex vertical>
          <n-date-picker v-model:value="exportRange" type="datetimerange" clearable @update:value="checkExportRange" />
          <n-button
            type="primary"
            :loading="exporting"
            :disabled="
              Boolean(exportRange && exceedsInclusiveSpan(exportRange[0], exportRange[1], MAX_EXPORT_RANGE_MS))
            "
            @click="exportHistory"
          >
            {{ $t('generate.export') }} CSV
          </n-button>
        </n-flex>
      </n-popover>
    </n-flex>
    <div class="mt-4">
      <n-text v-if="!dateRange" depth="3">{{ $t('generate.hour-24') }}</n-text>
      <NDataTable
        class="device-detail-table"
        :loading="loading"
        :columns="columns"
        :data="tableData"
        size="medium"
        :theme-overrides="tableThemeOverrides"
        :bordered="true"
        :bottom-bordered="true"
        :single-column="false"
        :single-line="true"
        :row-key="historyRowKey"
      >
        <template #empty>
          <NEmpty size="small" :description="$t('common.noData')" />
        </template>
      </NDataTable>
      <div class="mt-4 flex justify-end">
        <n-pagination
          :page="pagination.page"
          :page-size="pagination.pageSize"
          :page-slot="5"
          :item-count="pagination.itemCount"
          :page-sizes="pagination.pageSizes"
          :show-size-picker="pagination.showSizePicker"
          @update:page="pagination.onChange"
          @update:page-size="pagination.onUpdatePageSize"
        />
      </div>
    </div>
  </section>
</template>

<style scoped>
.n-card {
  width: 100%;
}
</style>
