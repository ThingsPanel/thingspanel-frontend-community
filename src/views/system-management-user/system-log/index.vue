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
const tableThemeOverrides = {
  borderColor: 'var(--border-color)',
  fontSizeMedium: '14px',
  lineHeight: '1.5',
  thColor: 'var(--body-color)',
  thColorHover: 'var(--body-color)',
  thFontWeight: '400',
  thTextColor: 'var(--text-color)',
  tdColorHover: 'var(--primary-color-suppl)',
  tdTextColor: 'var(--text-color)',
  thPaddingMedium: '12px',
  tdPaddingMedium: '13px 12px'
}

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
    key: 'actions',
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
    if (process.env.NODE_ENV === 'development') {
    }

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
      if (process.env.NODE_ENV === 'development') {
      }
    } else {
      adjustedEndDateMoment = endDateMoment // 用户选择了具体时间，保持不变
      if (process.env.NODE_ENV === 'development') {
      }
    }

    queryParams.start_time = startDate.format('YYYY-MM-DDTHH:mm:ssZ')
    queryParams.end_time = adjustedEndDateMoment.format('YYYY-MM-DDTHH:mm:ssZ')
    if (process.env.NODE_ENV === 'development') {
    }

    // 尝试更新 range ref 本身以改变输入框显示
    // 注意：这可能会触发组件更新，需要测试
    // @ts-ignore // 忽略类型检查，因为我们在可变元组中修改元素
    range.value[1] = adjustedEndDateMoment.valueOf()
  } else {
    queryParams.start_time = ''
    queryParams.end_time = ''
    if (process.env.NODE_ENV === 'development') {
    }
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
      <NDataTable
        size="medium"
        :theme-overrides="tableThemeOverrides"
        :bordered="true"
        :bottom-bordered="true"
        :single-column="false"
        :single-line="true"
        :striped="false"
        :scroll-x="980"
        :row-key="row => row.id || `${row.created_at}-${row.username}-${row.path}`"
        flex-height
        :columns="columns"
        :data="tableData"
        :loading="loading"
        class="standard-table flex-1-hidden"
      >
        <template #empty>
          <NEmpty size="small" :description="$t('common.nodata')" />
        </template>
      </NDataTable>
      <div class="pagination-box">
        <NPagination v-model:page="pagination.page" :item-count="total" @update:page="getTableData" />
      </div>
    </NCard>
    <DetailModal ref="detailModalRef"></DetailModal>
  </div>
</template>

<style scoped lang="scss">
.standard-table {
  min-width: 100%;
  overflow: hidden;
  border: 1px solid var(--border-color);
  border-radius: 10px;
  background: var(--card-color);

  :deep(.n-data-table-th),
  :deep(.n-data-table-td) {
    padding-left: 12px;
    padding-right: 12px;
  }

  :deep(.n-data-table-th) {
    height: 44px;
    font-size: 14px;
    font-weight: 400;
    line-height: 1.5;
    border-bottom: 1px solid rgb(226 232 240 / 85%) !important;
  }

  :deep(.n-data-table-td) {
    font-size: 14px;
    font-weight: 400;
    line-height: 1.5;
    border-bottom: 1px solid rgb(226 232 240 / 85%) !important;
    transition: background-color 180ms ease, box-shadow 180ms ease;
  }

  :deep(.n-data-table-tr:not(.n-data-table-tr--summary):hover > .n-data-table-td) {
    background: rgb(239 246 255) !important;
    box-shadow: inset 0 1px 0 rgb(191 219 254 / 60%), inset 0 -1px 0 rgb(191 219 254 / 60%) !important;
  }

  :deep(.n-data-table-td--last-col),
  :deep(.n-data-table-th--last-col) {
    padding-right: 20px;
  }
}

.pagination-box {
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
}

.align-end {
  align-items: flex-end;
}
</style>
