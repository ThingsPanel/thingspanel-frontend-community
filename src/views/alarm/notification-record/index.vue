<script setup lang="tsx">
import { reactive, ref } from 'vue'
import type { Ref } from 'vue'
import { NButton, NEmpty } from 'naive-ui'
import type { DataTableColumns, PaginationProps } from 'naive-ui'
import moment from 'moment'
import { getNotificationHistoryList } from '@/service/api/notification'
import { notificationOptions } from '@/constants/business'
import { $t } from '@/locales'
import { formatDateTime } from '@/utils/common/datetime'
import { tableThemeOverrides } from '@/utils/table-theme'
import { useLoading } from '~/packages/hooks'

const { loading, startLoading, endLoading } = useLoading(false)

const range = ref<[number, number]>([moment().subtract(1, 'months').valueOf(), moment().valueOf()])

const queryParams = reactive({
  notification_type: null as string | null,
  selected_time: null,
  send_target: '',
  send_time_start: '',
  send_time_end: ''
})
const tableData = ref<Api.Alarm.NotificationHistoryList[]>([])
const rowKey = (row: any) =>
  `${row.send_time ?? ''}-${row.send_target ?? ''}-${row.notification_type ?? ''}-${row.send_content ?? ''}`

const detailVisible = ref(false)
const selectedRecord = ref<Api.Alarm.NotificationHistoryList | null>(null)

type NotificationContent = {
  content?: unknown
  subject?: unknown
}

function parseNotificationContent(value: unknown) {
  const raw = String(value ?? '').trim()

  if (!raw) return null

  try {
    return JSON.parse(raw) as NotificationContent
  } catch {
    try {
      return JSON.parse(raw.replace(/\r?\n/g, '\\n')) as NotificationContent
    } catch {
      return null
    }
  }
}

function extractContentField(value: unknown, field: 'content' | 'subject') {
  const raw = String(value ?? '')
  const match = raw.match(new RegExp(`"${field}"\\s*:\\s*"((?:\\\\.|[^"\\\\])*)"`))

  if (!match) return undefined

  try {
    return JSON.parse(`"${match[1]}"`) as string
  } catch {
    return match[1].replace(/\\n/g, '\n')
  }
}

function normalizePreview(value: unknown) {
  return String(value ?? '')
    .replace(/\\n|\r?\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function getNotificationSubject(value: unknown) {
  const parsed = parseNotificationContent(value)
  const subject = parsed?.subject || extractContentField(value, 'subject')

  if (typeof subject === 'string' && subject.trim()) return subject.trim()

  return normalizePreview(value).slice(0, 96) || '—'
}

function getNotificationPreview(value: unknown) {
  const parsed = parseNotificationContent(value)
  const content = parsed?.content || extractContentField(value, 'content')
  const subject = parsed?.subject || extractContentField(value, 'subject')

  if (content || subject) {
    const preview = [content || subject]
      .filter(item => typeof item === 'string' && item.trim())
      .map(item => normalizePreview(item))
      .join(' · ')

    if (preview) return preview
  }

  return normalizePreview(value) || '—'
}

function formatNotificationContent(value: unknown) {
  const raw = String(value ?? '').trim()
  const parsed = parseNotificationContent(raw)

  if (parsed) return JSON.stringify(parsed, null, 2)

  return raw.replace(/\\n/g, '\n') || '—'
}

function openDetail(row: Api.Alarm.NotificationHistoryList) {
  selectedRecord.value = row
  detailVisible.value = true
}

function setTableData(data: Api.Alarm.NotificationHistoryList[] | []) {
  tableData.value = data || []
}
function pickerChange() {
  if (range.value && range.value.length > 0) {
    queryParams.send_time_start = moment(range.value[0]).format('YYYY-MM-DDTHH:mm:ssZ')
    queryParams.send_time_end = moment(range.value[1]).format('YYYY-MM-DDTHH:mm:ssZ')
  } else {
    queryParams.send_time_start = ''
    queryParams.send_time_end = ''
  }
}

const pagination: PaginationProps = reactive({
  page: 1,
  pageSize: 10,
  showSizePicker: true,
  pageSizes: [10, 15, 20, 25, 30],
  itemCount: 0,
  onChange: (page: number) => {
    pagination.page = page
    getTableData()
  },
  onUpdatePageSize: (pageSize: number) => {
    pagination.pageSize = pageSize
    pagination.page = 1
    getTableData()
  }
})

const getTableData = async () => {
  startLoading()
  const prams = {
    page: pagination.page || 1,
    page_size: pagination.pageSize || 10,
    notification_type: queryParams.notification_type || '',
    send_target: queryParams.send_target,
    send_time_start: queryParams.send_time_start,
    send_time_stop: queryParams.send_time_end
  }
  const res = await getNotificationHistoryList(prams)
  if (res?.data) {
    setTableData(res?.data.list || [])
    pagination.itemCount = res.data.total || 0
  }
  endLoading()
}

const columns: Ref<DataTableColumns<Api.Alarm.NotificationHistoryList>> = ref([
  {
    key: 'send_time',
    title: $t('custom.device_details.sendTime'),
    align: 'left',
    width: 180,
    minWidth: 180,
    render: (row: any) => {
      return formatDateTime(row.send_time)
    }
  },
  {
    key: 'send_content',
    width: 560,
    minWidth: 420,
    title: $t('custom.device_details.titleOrContent'),
    align: 'left',
    render: row => {
      return (
        <div class="notification-content-cell">
          <div class="notification-content-title">{getNotificationSubject(row.send_content)}</div>
          <div class="notification-content-preview">{getNotificationPreview(row.send_content)}</div>
          <NButton text type="primary" size="small" onClick={() => openDetail(row)}>
            {$t('generate.details')}
          </NButton>
        </div>
      )
    }
  },
  {
    key: 'send_target',
    width: 200,
    minWidth: 180,
    title: $t('generate.recipient'),
    align: 'left'
  },
  {
    key: 'send_result',
    title: $t('custom.device_details.sendResults'),
    minWidth: 140,
    width: 140,
    align: 'left'
  },
  {
    key: 'notification_type',
    title: $t('generate.notification-type'),
    minWidth: 140,
    width: 140,
    align: 'left'
  }
]) as Ref<DataTableColumns<Api.Alarm.NotificationHistoryList>>

function handleQuery() {
  pickerChange()
  pagination.page = 1
  getTableData()
}

const handleReset = () => {
  range.value = [moment().subtract(1, 'months').valueOf(), moment().valueOf()]
  queryParams.notification_type = null
  queryParams.send_target = ''
  pickerChange()
  pagination.page = 1
  getTableData()
}

getTableData()
</script>

<template>
  <div>
    <NCard>
      <div class="h-full flex-col">
        <div class="search-toolbar">
          <div class="search-context">{{ $t('generate.notification-record') }}</div>
          <div class="search-fields">
            <div class="search-field search-field--type">
              <div class="search-field-label">{{ $t('generate.notification-type') }}</div>
              <n-select
                v-model:value="queryParams.notification_type"
                :options="notificationOptions"
                :placeholder="$t('generate.select-notification-type')"
                class="input-style"
                clearable
              />
            </div>
            <div class="search-field search-field--date">
              <div class="search-field-label">{{ $t('custom.device_details.sendTime') }}</div>
              <NDatePicker
                v-model:value="range"
                type="datetimerange"
                class="input-style"
                clearable
                separator="-"
                @update:value="pickerChange"
              />
            </div>
            <div class="search-field search-field--target">
              <div class="search-field-label">{{ $t('generate.recipient') }}</div>
              <NInput v-model:value="queryParams.send_target" clearable :placeholder="$t('generate.recipient')" />
            </div>
            <div class="search-actions">
              <NButton type="primary" @click="handleQuery">{{ $t('common.search') }}</NButton>
              <NButton @click="handleReset">{{ $t('common.reset') }}</NButton>
            </div>
          </div>
        </div>
        <NDataTable
          class="thingspanel-data-table mt-4"
          size="medium"
          :theme-overrides="tableThemeOverrides"
          :bordered="true"
          :bottom-bordered="true"
          :single-column="false"
          :single-line="true"
          :striped="false"
          :scroll-x="1220"
          :row-key="rowKey"
          :columns="columns"
          :data="tableData"
          :loading="loading"
          :pagination="pagination"
          :remote="true"
        >
          <template #empty>
            <NEmpty size="small" :description="$t('common.noData')" />
          </template>
        </NDataTable>

        <NModal
          v-model:show="detailVisible"
          preset="card"
          :title="$t('generate.details')"
          :style="{ width: 'min(900px, calc(100vw - 32px))' }"
          class="notification-detail-modal"
        >
          <div v-if="selectedRecord" class="notification-detail-meta">
            <span>{{ formatDateTime(selectedRecord.send_time) }}</span>
            <span>{{ selectedRecord.send_target || '—' }}</span>
            <span>{{ selectedRecord.notification_type || '—' }}</span>
          </div>
          <pre v-if="selectedRecord" class="notification-detail-text">{{
            formatNotificationContent(selectedRecord.send_content)
          }}</pre>
        </NModal>
      </div>
    </NCard>
  </div>
</template>

<style scoped>
.pagination-box {
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
}

.search-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
}

.search-context {
  flex: none;
  margin: 0;
  color: var(--text-color);
  font-size: 20px;
  font-weight: 700;
  line-height: 28px;
}

.search-fields {
  display: grid;
  grid-template-columns: minmax(260px, 1fr) minmax(420px, 1.5fr) minmax(250px, 1fr) auto;
  flex: 1;
  width: 100%;
  max-width: 1300px;
  gap: 12px;
  align-items: center;
  justify-content: end;
  min-width: 0;
  margin-top: 0;
}

.search-field {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  min-width: 0;
}

.search-field-label {
  flex: none;
  color: var(--text-color-2);
  font-size: 13px;
  line-height: 18px;
  white-space: nowrap;
}

.search-field--date {
  min-width: 0;
}

.search-field--type,
.search-field--target {
  min-width: 0;
}

.search-fields :deep(.n-input),
.search-fields :deep(.n-base-selection),
.search-fields :deep(.n-date-picker) {
  width: 100%;
  min-height: 36px;
  border-radius: 8px;
}

.search-field > :deep(.input-style),
.search-field > :deep(.n-input) {
  flex: 1 1 0%;
  width: 0;
  min-width: 0;
}

.search-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.search-actions :deep(.n-button) {
  height: 36px;
  border-radius: 8px;
}

:deep(.notification-content-cell) {
  display: grid;
  min-width: 0;
  gap: 2px;
  line-height: 1.45;
}

:deep(.notification-content-title) {
  overflow: hidden;
  color: var(--text-color);
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

:deep(.notification-content-preview) {
  display: -webkit-box;
  overflow: hidden;
  color: var(--text-color-2);
  line-height: 1.45;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow-wrap: anywhere;
}

:deep(.notification-content-cell .n-button) {
  justify-self: start;
  height: auto;
  padding: 0;
  font-size: 13px;
}

.notification-detail-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 20px;
  padding-bottom: 14px;
  color: var(--text-color-2);
  font-size: 13px;
}

.notification-detail-text {
  max-height: min(60vh, 560px);
  margin: 0;
  overflow: auto;
  padding: 16px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--body-color);
  color: var(--text-color);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.65;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

:deep(.n-data-table-table) {
  table-layout: fixed !important;
}

:deep(.n-data-table-td) {
  vertical-align: middle;
}

:deep(.n-data-table-td:nth-child(2)) {
  white-space: normal;
}

@media (max-width: 1600px) {
  .search-toolbar {
    align-items: stretch;
    flex-direction: column;
    gap: 12px;
  }

  .search-fields {
    max-width: none;
  }
}

@media (max-width: 1320px) {
  .search-fields {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .search-actions {
    grid-column: 2;
  }
}

@media (max-width: 768px) {
  .search-toolbar {
    display: block;
  }

  .search-context,
  .search-fields {
    width: 100%;
  }

  .search-fields {
    grid-template-columns: minmax(0, 1fr);
    align-items: stretch;
    justify-content: stretch;
  }

  .search-actions {
    grid-column: auto;
  }

  .search-actions :deep(.n-button) {
    flex: 1;
  }
}
</style>
