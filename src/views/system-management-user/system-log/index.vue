<script setup lang="tsx">
import { onMounted, reactive, ref } from 'vue'
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
  thFontWeight: '600',
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
const requestId = ref(0)

const tableData = ref<Api.SystemManage.SystemLogList[]>([])

function setTableData(data: Api.SystemManage.SystemLogList[] | []) {
  tableData.value = data || []
}

const pagination: PaginationProps = reactive({
  page: 1,
  pageSize: 10,
  showSizePicker: true,
  pageSizes: [10, 15, 20, 25, 30]
})

const getTableData = async () => {
  const currentRequestId = ++requestId.value
  startLoading()
  const params = {
    page: pagination.page || 1,
    page_size: pagination.pageSize || 10,
    ...queryParams
  }

  try {
    const res = await getSystemLogList(params)
    // 翻页连续点击时，旧请求不能覆盖最后一次请求的结果。
    if (currentRequestId !== requestId.value) return

    const data = res?.data
    setTableData(Array.isArray(data?.list) ? data.list : [])
    total.value = Number(data?.total) || 0
  } finally {
    if (currentRequestId === requestId.value) endLoading()
  }
}

function handlePageChange(page: number) {
  pagination.page = page
  void getTableData()
}

function handlePageSizeChange(pageSize: number) {
  pagination.pageSize = pageSize
  pagination.page = 1
  void getTableData()
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
  pagination.page = 1
  void getTableData()
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
    } else {
      adjustedEndDateMoment = endDateMoment // 用户选择了具体时间，保持不变
    }

    queryParams.start_time = startDate.format('YYYY-MM-DDTHH:mm:ssZ')
    queryParams.end_time = adjustedEndDateMoment.format('YYYY-MM-DDTHH:mm:ssZ')
    // 尝试更新 range ref 本身以改变输入框显示
    // 注意：这可能会触发组件更新，需要测试
    // @ts-ignore // 忽略类型检查，因为我们在可变元组中修改元素
    range.value[1] = adjustedEndDateMoment.valueOf()
  } else {
    queryParams.start_time = ''
    queryParams.end_time = ''
  }
}
onMounted(() => {
  void getTableData()
})
</script>

<template>
  <div>
    <NCard>
      <div class="system-log-header">
        <h2 class="system-log-heading">{{ $t('generate.system-log') }}</h2>
        <div class="system-log-toolbar">
          <NForm label-placement="left" :model="queryParams">
            <NGrid responsive="screen" item-responsive x-gap="12" y-gap="12" class="search-form-grid">
              <NFormItemGi span="24 s:12 m:6" :label="$t('generate.username')" path="name">
                <NInput v-model:value="queryParams.username" />
              </NFormItemGi>
              <NFormItemGi span="24 s:12 m:6" path="selected_time">
                <NDatePicker
                  v-model:value="range"
                  type="datetimerange"
                  clearable
                  separator="-"
                  @update:value="pickerChange"
                />
              </NFormItemGi>
              <NFormItemGi span="24 s:12 m:6" :label="$t('generate.requestMethod')" path="method">
                <NSelect v-model:value="queryParams.method" :options="requestMethodOptions"></NSelect>
              </NFormItemGi>
              <NFormItemGi span="24 s:12 m:6" :label="$t('generate.ipAddress')" path="ip">
                <NInput v-model:value="queryParams.ip" />
              </NFormItemGi>

              <NFormItemGi span="24 s:12 m:6" class="search-form-actions">
                <NSpace class="w-full" justify="end">
                  <NButton class="search-form-button" type="primary" @click="handleQuery">
                    {{ $t('generate.search') }}
                  </NButton>
                  <NButton class="search-form-button" @click="handleReset">{{ $t('generate.reset') }}</NButton>
                </NSpace>
              </NFormItemGi>
            </NGrid>
          </NForm>
        </div>
      </div>
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
        <NPagination
          v-model:page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :item-count="total"
          :page-sizes="pagination.pageSizes"
          :show-size-picker="pagination.showSizePicker"
          @update:page="handlePageChange"
          @update:page-size="handlePageSizeChange"
        />
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
  box-shadow: 0 1px 2px rgb(15 23 42 / 4%);

  :deep(.n-data-table-th),
  :deep(.n-data-table-td) {
    padding-left: 12px;
    padding-right: 12px;
  }

  :deep(.n-data-table-th) {
    height: 44px;
    font-size: 14px;
    font-weight: 600;
    line-height: 1.5;
    border-bottom: 1px solid rgb(226 232 240 / 85%) !important;
  }

  :deep(.n-data-table-td) {
    font-size: 14px;
    font-weight: 400;
    line-height: 1.5;
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

.pagination-box {
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
}

.system-log-header {
  display: block;
  margin-bottom: 20px;
}

.system-log-heading {
  margin: 0;
  color: var(--text-color);
  font-size: 18px;
  font-weight: 600;
  line-height: 28px;
}

.system-log-toolbar {
  width: 100%;
  margin-top: 12px;
}

.search-form-grid {
  display: flex !important;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 12px;

  :deep(.n-form-item-gi) {
    flex: 0 0 auto;
    width: auto !important;
    min-width: 220px;
    max-width: 360px;
  }

  :deep(.n-input),
  :deep(.n-base-selection),
  :deep(.n-date-picker) {
    width: 100%;
    max-width: 320px;
    min-height: 36px;
    border-radius: 8px;
  }

  :deep(.n-button) {
    height: 36px;
    border-radius: 8px;
  }
}

.search-form-actions {
  min-width: max-content !important;
  max-width: none !important;

  :deep(.n-space) {
    justify-content: flex-end;
  }
}

@media (max-width: 768px) {
  .system-log-header {
    display: block;
  }

  .search-form-actions {
    :deep(.n-space) {
      justify-content: stretch;
    }

    :deep(.n-button) {
      flex: 1;
    }
  }
}
</style>
