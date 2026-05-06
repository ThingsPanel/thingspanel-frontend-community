<script setup lang="tsx">
import { computed, getCurrentInstance, reactive, ref } from 'vue'
import type { Ref } from 'vue'
import { NButton } from 'naive-ui'
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
        <NDataTable :columns="columns" :data="tableData" :loading="loading" :pagination="pagination" :remote="true" class="flex-1-hidden mt-4" />
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
</style>
