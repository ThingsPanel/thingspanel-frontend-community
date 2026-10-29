<script setup lang="ts">
import { computed, h, nextTick, reactive, ref, watch } from 'vue'
import { useLoading } from '@sa/hooks'
import { deviceRuntimeNative } from '@/service/api/device-runtime-native'
import { $t } from '@/locales'
import dayjs from 'dayjs'
import { NDataTable, NEmpty, NTag } from 'naive-ui'
import type { DataTableColumns, PaginationProps } from 'naive-ui'

/**
 * 设备状态历史记录类型定义
 * @interface StatusHistoryItem
 * @property {number} status - 状态 0: 离线 1: 在线
 * @property {string | number} change_time - 状态改变时间
 */
interface StatusHistoryItem {
  status: 0 | 1 | null
  change_time?: string | number
}

const props = defineProps<{
  deviceId: string
  visible: boolean
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
}>()

const { loading, startLoading, endLoading } = useLoading()
const tableData = ref<StatusHistoryItem[]>([])
const total = ref(0)
const loadError = ref('')

const tableThemeOverrides = {
  borderColor: 'var(--border-color)',
  borderRadius: '10px',
  fontSizeMedium: '14px',
  lineHeight: '1.5',
  thColor: 'var(--body-color)',
  thColorHover: 'var(--body-color)',
  thFontWeight: '400',
  thTextColor: 'var(--text-color)',
  tdColor: 'var(--card-color)',
  tdColorHover: 'var(--primary-color-suppl)',
  tdColorSorting: 'var(--primary-color-suppl)',
  tdTextColor: 'var(--text-color)',
  thPaddingMedium: '12px',
  tdPaddingMedium: '13px 12px'
}

const statusRowKey = (row: StatusHistoryItem) => `${row.change_time ?? ''}-${row.status}`

const queryParams = reactive({
  device_id: '',
  page: 1,
  page_size: 20,
  start_time: undefined as number | undefined,
  end_time: undefined as number | undefined,
  status: null as number | null | undefined
})

const dateRangeValue = ref<number | null>(null)

const statusOptions = [
  { label: $t('custom.device_details.online'), value: 1 },
  { label: $t('custom.device_details.offline'), value: 0 }
]

const pagination = reactive<PaginationProps>({
  page: 1,
  pageSize: 20,
  showSizePicker: true,
  pageSizes: [10, 20, 30, 50, 100],
  itemCount: 0,
  onChange: (page: number) => {
    queryParams.page = page
    pagination.page = page
    fetchData()
  },
  onUpdatePageSize: (pageSize: number) => {
    queryParams.page_size = pageSize
    queryParams.page = 1
    pagination.pageSize = pageSize
    pagination.page = 1
    fetchData()
  }
})

const columns: DataTableColumns<StatusHistoryItem> = [
  {
    title: $t('common.index'),
    key: 'index',
    width: 100,
    render: (_row: StatusHistoryItem, index: number) => {
      return index + 1
    }
  },
  {
    title: $t('common.status'),
    key: 'status',
    width: 120,
    render: (row: StatusHistoryItem) => {
      if (row.status === null) return h(NTag, { type: 'warning', size: 'small' }, { default: () => '未知' })
      const isOnline = row.status === 1
      const text = isOnline ? $t('custom.device_details.online') : $t('custom.device_details.offline')
      return h(NTag, { type: isOnline ? 'success' : 'default', size: 'small' }, { default: () => text })
    }
  },
  {
    title: $t('common.time'),
    key: 'change_time',
    width: 200,
    render: (row: StatusHistoryItem) => {
      if (row.change_time) {
        return dayjs(row.change_time).format('YYYY-MM-DD HH:mm:ss')
      }
      return '--'
    }
  }
]

const fetchData = async () => {
  startLoading()
  try {
    const fromSeconds = queryParams.start_time
    const connectivity = queryParams.status === 1 ? 'online' : queryParams.status === 0 ? 'offline' : undefined
    const page = await deviceRuntimeNative.listStatusHistory(props.deviceId, {
      page: queryParams.page,
      pageSize: queryParams.page_size,
      ...(fromSeconds ? { from: new Date(fromSeconds * 1000).toISOString().replace(/\.\d{3}Z$/, 'Z') } : {}),
      ...(connectivity ? { connectivity } : {})
    })
    loadError.value = ''
    tableData.value = page.items.map(item => ({
      status: item.connectivity === 'online' ? 1 : item.connectivity === 'offline' ? 0 : null,
      change_time: item.observedAt
    }))
    total.value = page.total
    pagination.itemCount = page.total
  } catch (error) {
    loadError.value = error instanceof Error ? error.message : '状态历史读取失败'
    tableData.value = []
  } finally {
    endLoading()
  }
}

const handleSearch = () => {
  queryParams.page = 1
  pagination.page = 1
  fetchData()
}

const handleReset = () => {
  dateRangeValue.value = null
  queryParams.start_time = undefined
  queryParams.end_time = undefined
  queryParams.status = null
  queryParams.page = 1
  pagination.page = 1
  nextTick(() => {
    fetchData()
  })
}

const handleDateRangeChange = (value: number | null) => {
  dateRangeValue.value = value
  queryParams.start_time = value ? Math.floor(value / 1000) : undefined
  queryParams.end_time = undefined
}

const showModal = computed({
  get: () => props.visible,
  set: value => emit('update:visible', value)
})

watch(
  () => props.visible,
  newVal => {
    if (newVal && props.deviceId) {
      queryParams.device_id = props.deviceId
      queryParams.page = 1
      pagination.page = 1
      fetchData()
    }
  },
  { immediate: true }
)

watch(
  () => props.deviceId,
  newVal => {
    if (newVal && props.visible) {
      queryParams.device_id = newVal
      queryParams.page = 1
      pagination.page = 1
      fetchData()
    }
  }
)
</script>

<template>
  <NModal
    v-model:show="showModal"
    preset="dialog"
    :showIcon="false"
    :title="$t('common.deviceActiveTime')"
    :style="{ minWidth: '600px', maxHeight: '90vh' }"
  >
    <NCard>
      <NForm :model="queryParams" :show-feedback="false" label-placement="left" label-width="100px" label-align="left">
        <NFlex :vertical="false" :gap="8" class="mb-4">
          <NFormItem label="起始时间">
            <NDatePicker
              v-model:value="dateRangeValue"
              type="datetime"
              clearable
              :placeholder="$t('common.selectPlaceholder')"
              @update:value="handleDateRangeChange"
            />
          </NFormItem>
          <NFormItem :label="$t('common.status')">
            <NSelect
              v-model:value="queryParams.status"
              :options="statusOptions"
              clearable
              :placeholder="$t('generate.selectStatus')"
              style="width: 200px"
            />
          </NFormItem>
          <NFlex :vertical="false" :gap="8">
            <NButton type="primary" @click="handleSearch">{{ $t('common.search') }}</NButton>
            <NButton @click="handleReset">{{ $t('common.reset') }}</NButton>
          </NFlex>
        </NFlex>
      </NForm>

      <NAlert v-if="loadError" type="warning" :show-icon="false" class="mb-4">{{ loadError }}</NAlert>
      <div class="table-container">
        <NDataTable
          class="device-detail-table"
          :columns="columns"
          :data="tableData"
          :loading="loading"
          :pagination="pagination"
          size="medium"
          :theme-overrides="tableThemeOverrides"
          :bordered="true"
          :bottom-bordered="true"
          :single-column="false"
          :single-line="true"
          :scroll-x="560"
          :row-key="statusRowKey"
          :max-height="350"
          remote
        >
          <template #empty>
            <NEmpty size="small" :description="$t('common.noData')" />
          </template>
        </NDataTable>
      </div>
    </NCard>
  </NModal>
</template>

<style scoped lang="scss">
.table-container {
  margin-top: 16px;
  width: 100%;
  overflow: hidden;
}
</style>
