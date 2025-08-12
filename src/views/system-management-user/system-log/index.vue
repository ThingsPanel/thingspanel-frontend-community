<script setup lang="tsx">
import { computed, getCurrentInstance, reactive, ref } from 'vue'
import type { Ref } from 'vue'
import { NButton, NSelect } from 'naive-ui'
import type { DataTableColumns, PaginationProps } from 'naive-ui'
import moment from 'moment'
import { getSystemLogList } from '@/service/api/system-management-user'
import { $t } from '@/locales'
import { formatDateTime } from '@/utils/common/datetime'
import DetailModal from './components/detail-modal.vue'
import { useLoading } from '~/packages/hooks'

const { loading, startLoading, endLoading } = useLoading(false)

const range = ref<[number, number]>([moment().subtract(1, 'months').valueOf(), moment().valueOf()])
// POST PUT DELETE
const requestMethodOptions = reactive([
  {
    label: $t('custom.management.all'),
    value: ''
  },
  {
    label: 'POST',
    value: 'POST'
  },
  {
    label: 'PUT',
    value: 'PUT'
  },
  {
    label: 'DELETE',
    value: 'DELETE'
  }
])
const queryParams = reactive({
  username: '',
  selected_time: null,
  start_time: '',
  end_time: '',
  method: '',
  ip: ''
})
const total = ref(0)

const tableData = ref<Api.SystemManage.SystemLogList[]>([])

function setTableData(data: Api.SystemManage.SystemLogList[] | []) {
  tableData.value = data || []
}

const pagination: PaginationProps = reactive({
  page: 1,
  pageSize: 10,
  showSizePicker: true,
  pageSizes: [10, 15, 20, 25, 30],
  onChange: (page: number) => {
    pagination.page = page
  },
  onUpdatePageSize: (pageSize: number) => {
    pagination.pageSize = pageSize
    pagination.page = 1
  }
})

const getTableData = async () => {
  startLoading()
  const prams = {
    page: pagination.page || 1,
    page_size: pagination.pageSize || 10,
    ...queryParams
  }
  const res = await getSystemLogList(prams)
  if (res?.data) {
    setTableData(res?.data.list || [])
    total.value = res.data.total || 0
  }
  endLoading()
}
const detailModalRef = ref<any>(null)
const handleDetail = item => {
  detailModalRef.value && detailModalRef.value.show && detailModalRef.value.show(item)
}
const columns: Ref<DataTableColumns<DataService.Data>> = ref([
  {
    key: 'created_at',
    title: $t('common.time'),
    minWidth: '140px',
    align: 'left',
    render: (row: any) => {
      return formatDateTime(row.created_at)
    }
  },
  {
    key: 'ip',
    minWidth: '140px',
    title: 'IP',
    align: 'left'
  },
  {
    key: 'path',
    title: $t('common.requestPath'),
    minWidth: '140px',
    align: 'left'
  },
  {
    key: 'name',
    minWidth: '140px',
    title: $t('common.requestMethod'),
    align: 'left'
  },
  {
    key: 'latency',
    title: $t('common.requestTime'),
    minWidth: '140px',
    align: 'left',
    render: row => `${row.latency}ms`
  },
  {
    key: 'username',
    title: $t('generate.username'),
    minWidth: '140px',
    align: 'left'
  },
  {
    key: '',
    title: '操作',
    minWidth: '140px',
    align: 'left',
    render: row => {
      return (
        <NButton type="primary" size={'small'} onClick={() => handleDetail(row)}>
          {$t('generate.details')}
        </NButton>
      )
    }
  }
]) as Ref<DataTableColumns<DataService.Data>>

function handleQuery() {
  getTableData()
}
function handleReset() {
  queryParams.start_time = ''
  queryParams.end_time = ''
  queryParams.ip = ''
  queryParams.method = ''
  queryParams.username = ''
  queryParams.selected_time = null
  range.value = [moment().subtract(1, 'months').valueOf(), moment().valueOf()]
  pagination.page = 1
  handleQuery()
}
function pickerChange(value: [number, number] | null) {
  if (value && value.length === 2) {
    const startDate = moment(value[0])
    const endDateMoment = moment(value[1])
    // console.log('Original end timestamp:', value[1], 'Moment object:', endDateMoment.toISOString());

    // 检查用户是否可能只选了日期（时间部分为 00:00:00）
    // 如果是，则将结束时间调整到 23:59:59.999
    // 如果用户明确选择了时间，则尊重用户的选择
    let adjustedEndDateMoment
    if (
      endDateMoment.hour() === 0 &&
      endDateMoment.minute() === 0 &&
      endDateMoment.second() === 0 &&
      endDateMoment.millisecond() === 0
    ) {
      adjustedEndDateMoment = endDateMoment.endOf('day')
      // console.log('Adjusted end moment object (end of day):', adjustedEndDateMoment.toISOString());
    } else {
      adjustedEndDateMoment = endDateMoment // 用户选择了具体时间，保持不变
      // console.log('End moment object (user selected time):', adjustedEndDateMoment.toISOString());
    }

    queryParams.start_time = startDate.format('YYYY-MM-DDTHH:mm:ssZ')
    queryParams.end_time = adjustedEndDateMoment.format('YYYY-MM-DDTHH:mm:ssZ')
    // console.log('Assigned queryParams.end_time:', queryParams.end_time);

    // 尝试更新 range ref 本身以改变输入框显示
    // 注意：这可能会触发组件更新，需要测试
    // @ts-ignore // 忽略类型检查，因为我们在可变元组中修改元素
    range.value[1] = adjustedEndDateMoment.valueOf()
  } else {
    queryParams.start_time = ''
    queryParams.end_time = ''
    // console.log('Date range cleared');
  }
}
const getPlatform = computed(() => {
  const { proxy }: any = getCurrentInstance()
  return proxy.getPlatform()
})
getTableData()
</script>

<template>
  <div>
    <NCard :title="$t('generate.system-log')">
      <NForm class="mb-20px align-end" :inline="!getPlatform" label-placement="left" :model="queryParams">
        <view class="flex flex-wrap">
          <NFormItem class="w-200px" :label="$t('generate.username')" path="name">
            <NInput v-model:value="queryParams.username" />
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
          <NFormItem :label="$t('generate.requestMethod')" path="method">
            <NSelect v-model:value="queryParams.method" class="w-200px" :options="requestMethodOptions"></NSelect>
          </NFormItem>
          <NFormItem :label="$t('generate.ipAddress')" path="ip">
            <NInput v-model:value="queryParams.ip" />
          </NFormItem>

          <NButton class="w-72px" type="primary" @click="handleQuery">{{ $t('generate.search') }}</NButton>
          <NButton class="ml-15px w-72px" type="primary" @click="handleReset">{{ $t('generate.reset') }}</NButton>
        </view>
      </NForm>
      <NDataTable :columns="columns" :data="tableData" :loading="loading" class="flex-1-hidden" />
      <div class="pagination-box">
        <NPagination v-model:page="pagination.page" :item-count="total" @update:page="getTableData" />
      </div>
    </NCard>
    <DetailModal ref="detailModalRef"></DetailModal>
  </div>
</template>

<style scoped>
.pagination-box {
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
}

.align-end {
  align-items: flex-end;
}
</style>
