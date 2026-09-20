<script setup lang="tsx">
import { computed, getCurrentInstance, reactive, ref } from 'vue'
import type { Ref } from 'vue'
import { NButton, NEmpty } from 'naive-ui'
import type { DataTableColumns, PaginationProps } from 'naive-ui'
import moment from 'moment'
import { getNotificationHistoryList } from '@/service/api/notification'
import { notificationOptions } from '@/constants/business'
import { $t } from '@/locales'
import { formatDateTime } from '@/utils/common/datetime'
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

const getPlatform = computed(() => {
  const { proxy }: any = getCurrentInstance()
  return proxy.getPlatform()
})
getTableData()
</script>

<template>
  <div>
    <NCard :title="$t('generate.notification-record')">
      <div class="h-full flex-col">
        <NForm label-placement="left" :inline="!getPlatform" :model="queryParams">
          <NFormItem path="name" :label="$t('generate.notification-type')">
            <n-select
              v-model:value="queryParams.notification_type"
              :options="notificationOptions"
              :placeholder="$t('generate.notification-type')"
              class="input-style min-w-160px"
              clearable
            />
          </NFormItem>
          <NFormItem path="selected_time">
            <NDatePicker
              v-model:value="range"
              type="datetimerange"
              clearable
              separator="-"
              @update:value="pickerChange"
            />
          </NFormItem>
          <NFormItem path="send_target">
            <NInput v-model:value="queryParams.send_target" clearable :placeholder="$t('generate.recipient')" />
          </NFormItem>
          <NFormItem>
            <NButton type="primary" @click="handleQuery">{{ $t('common.search') }}</NButton>
            <NButton class="ml-12px" @click="handleReset">{{ $t('common.reset') }}</NButton>
          </NFormItem>
        </NForm>
        <NDataTable
          class="table-standard flex-1-hidden mt-4"
          size="medium"
          :bordered="true"
          :bottom-bordered="true"
          :single-column="false"
          :single-line="true"
          :striped="false"
          :scroll-x="980"
          :row-key="rowKey"
          :flex-height="true"
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

.table-standard {
  overflow: hidden;
  border: 1px solid var(--border-color);
  border-radius: 10px;
  background: var(--card-color);
  box-shadow: 0 1px 2px rgb(15 23 42 / 4%);

  :deep(.n-data-table-th),
  :deep(.n-data-table-td) {
    padding-left: 12px;
    padding-right: 12px;
    font-size: 14px;
    font-weight: 400;
    line-height: 1.5;
  }

  :deep(.n-data-table-th) {
    height: 44px;
    color: var(--text-color);
    background: var(--body-color) !important;
    border-bottom: 1px solid rgb(226 232 240 / 85%) !important;
  }

  :deep(.n-data-table-td) {
    color: var(--text-color);
    background: var(--card-color) !important;
    border-bottom: 1px solid rgb(226 232 240 / 85%) !important;
    transition:
      background-color 180ms ease,
      box-shadow 180ms ease;
  }

  :deep(.n-data-table-tr:not(.n-data-table-tr--summary):hover > .n-data-table-td) {
    background: rgb(239 246 255) !important;
    box-shadow:
      inset 0 1px 0 rgb(191 219 254 / 60%),
      inset 0 -1px 0 rgb(191 219 254 / 60%) !important;
  }

  :deep(.n-data-table-td--last-col),
  :deep(.n-data-table-th--last-col) {
    padding-right: 20px;
  }
}
</style>
