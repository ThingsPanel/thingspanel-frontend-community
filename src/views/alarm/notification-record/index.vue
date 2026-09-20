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
  notification_type: '',
  selected_time: null,
  send_target: '',
  send_time_start: '',
  send_time_end: ''
})
const total = ref(0)

const tableData = ref<Api.Alarm.NotificationHistoryList[]>([])
const rowKey = (row: any) =>
  `${row.send_time ?? ''}-${row.send_target ?? ''}-${row.notification_type ?? ''}-${row.send_content ?? ''}`

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
    notification_type: queryParams.notification_type,
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

const columns: Ref<DataTableColumns<DataService.Data>> = ref([
  {
    key: 'send_time',
    title: $t('custom.device_details.sendTime'),
    align: 'left',
    minWidth: '180px',
    render: (row: any) => {
      return formatDateTime(row.send_time)
    }
  },
  {
    key: 'send_content',
    minWidth: '180px',
    title: $t('custom.device_details.titleOrContent'),
    align: 'left'
  },
  {
    key: 'send_target',
    minWidth: '100px',
    title: $t('generate.recipient'),
    align: 'left',
    width: '200'
  },
  {
    key: 'send_result',
    title: $t('custom.device_details.sendResults'),
    minWidth: '140px',
    align: 'left'
  },
  {
    key: 'notification_type',
    title: $t('generate.notification-type'),
    minWidth: '140px',
    align: 'left'
  }
]) as Ref<DataTableColumns<DataService.Data>>

function handleQuery() {
  pickerChange()
  pagination.page = 1
  getTableData()
}

const handleReset = () => {
  range.value = [moment().subtract(1, 'months').valueOf(), moment().valueOf()]
  queryParams.notification_type = ''
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
          <h3 class="search-context">{{ $t('generate.notification-record') }}</h3>
          <div class="search-fields">
            <div class="search-field">
              <n-select
                v-model:value="queryParams.notification_type"
                :options="notificationOptions"
                :placeholder="$t('generate.notification-type')"
                class="input-style"
                clearable
              />
            </div>
            <div class="search-field search-field--date">
              <NDatePicker
                v-model:value="range"
                type="datetimerange"
                class="input-style"
                clearable
                separator="-"
                @update:value="pickerChange"
              />
            </div>
            <div class="search-field">
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
          :scroll-x="980"
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
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
  justify-content: space-between;
}

.search-context {
  flex: 0 0 auto;
  margin: 0;
  color: var(--text-color);
  font-size: 16px;
  font-weight: 600;
  line-height: 36px;
}

.search-fields {
  display: grid;
  grid-template-columns: minmax(160px, 200px) minmax(260px, 320px) minmax(160px, 260px) auto;
  gap: 10px;
  align-items: center;
  justify-content: end;
}

.search-field {
  min-width: 0;
}

.search-field--date {
  min-width: 260px;
}

.search-fields :deep(.n-input),
.search-fields :deep(.n-base-selection),
.search-fields :deep(.n-date-picker) {
  width: 100%;
  min-height: 36px;
  border-radius: 8px;
}

.search-actions {
  display: flex;
  gap: 8px;
}

.search-actions :deep(.n-button) {
  height: 36px;
  border-radius: 8px;
}

@media (max-width: 900px) {
  .search-fields {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .search-field--date {
    min-width: 0;
  }

  .search-actions {
    grid-column: 1 / -1;
  }
}

@media (max-width: 768px) {
  .search-toolbar {
    align-items: stretch;
    flex-direction: column;
  }

  .search-context,
  .search-fields {
    width: 100%;
  }

  .search-fields {
    grid-template-columns: 1fr;
  }

  .search-actions {
    grid-column: auto;
  }

  .search-actions :deep(.n-button) {
    flex: 1;
  }
}
</style>
