<script setup lang="tsx">
import { h, reactive, ref } from 'vue'
import type { Ref } from 'vue'
import type { PaginationProps } from 'naive-ui'
import { NButton, NDataTable, NEmpty, NPopconfirm, NTag } from 'naive-ui'
import dayjs from 'dayjs'
import { deviceCommandNative } from '@/service/api/device-command-native'
import type { CommandReceipt } from '@/service/api/device-command-native'
import { commandStateLabel } from '@/service/api/device-command-rows'
import { newIdempotencyKey } from '@/service/api/device-write-attempt'
import { $t } from '@/locales'
const props = defineProps<{
  id: string
}>()

const tableData = ref<any[]>([])

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

const expectedMessageRowKey = (row: any) => row.id
// “期望消息”= 设备上线后才发送的命令队列；原生接口只承载命令，不再有遥测/属性期望。
const statusOptions = ref([
  { label: '等待上线发送', value: 'accepted' },
  { label: '已下发到设备通道', value: 'delivered' },
  { label: '设备已应答', value: 'acknowledged' },
  { label: '已过期', value: 'expired' },
  { label: '已取消', value: 'cancelled' },
  { label: '失败', value: 'failed' }
])

const query = reactive({
  status: 'accepted' as CommandReceipt['state'] | null,
  identifier: null as string | null,
  label: null as string | null,
  page: 1,
  page_size: 10
})
const listError = ref('')
const pagination: PaginationProps = reactive({
  page: 1,
  pageSize: 10,
  showSizePicker: true,
  pageSizes: [10, 15, 20, 25, 30],
  itemCount: 0,
  onChange: (page: number) => {
    pagination.page = page
    query.page = page
    getTableData()
  },
  onUpdatePageSize: (pageSize: number) => {
    pagination.pageSize = pageSize
    pagination.page = 1
    query.page = 1
    query.page_size = pageSize
    getTableData()
  }
})

// 过期时间保持服务端给出的 RFC 3339 原文，只在展示时格式化。
const fmt = (value?: string | null) => (value ? dayjs(value).format('YYYY-MM-DD HH:mm:ss') : '')

let requestSeq = 0
async function getTableData() {
  const seq = ++requestSeq
  try {
    const page = await deviceCommandNative.list(props.id, {
      page: query.page,
      pageSize: query.page_size,
      deliveryMode: 'when_online',
      ...(query.status ? { state: query.status } : {}),
      ...(query.identifier?.trim() ? { identifier: query.identifier.trim() } : {}),
      ...(query.label?.trim() ? { labelContains: query.label.trim() } : {})
    })
    if (seq !== requestSeq) return
    listError.value = ''
    tableData.value = page.items as any
    pagination.itemCount = page.total
  } catch (error) {
    if (seq !== requestSeq) return
    listError.value = error instanceof Error ? error.message : '读取期望消息失败'
  }
}

// 结果未知后重试取消同一条命令，沿用同一个幂等键；拿到 HTTP 答复后换新键。
let cancelKey: { id: string; key: string } | null = null
const handleCancel = async (id: string) => {
  const key = cancelKey?.id === id ? cancelKey.key : newIdempotencyKey()
  cancelKey = { id, key }
  try {
    await deviceCommandNative.cancel(props.id, id, '用户在设备详情页取消', key)
    cancelKey = null
    window.$message?.success('已取消')
  } catch (error) {
    if (typeof (error as { status?: unknown }).status === 'number') cancelKey = null
    window.$message?.error(error instanceof Error ? error.message : '取消失败')
  }
  getTableData()
}

const columns: Ref<any> = ref([
  {
    key: 'acceptedAt',
    minWidth: '200px',
    title: () => $t('page.expect.createTime'),
    render: (row: CommandReceipt) => fmt(row.acceptedAt)
  },
  { key: 'identifier', minWidth: '140px', title: () => $t('page.expect.commandType') },
  {
    key: 'label',
    minWidth: '100px',
    title: () => $t('page.expect.label'),
    render: (row: CommandReceipt) => row.label || '--'
  },
  {
    key: 'parameters',
    minWidth: '200px',
    title: () => $t('page.expect.commandContent'),
    render: (row: CommandReceipt) => JSON.stringify(row.parameters ?? {})
  },
  {
    key: 'expiresAt',
    minWidth: '200px',
    title: () => $t('page.expect.expireTime'),
    render: (row: CommandReceipt) => fmt(row.expiresAt) || '--'
  },
  {
    key: 'state',
    minWidth: '140px',
    title: () => $t('page.expect.status'),
    render: (row: CommandReceipt) =>
      h(
        NTag,
        {
          type:
            row.state === 'acknowledged'
              ? 'success'
              : ['expired', 'failed', 'timed_out'].includes(row.state)
                ? 'error'
                : 'warning',
          size: 'small'
        },
        { default: () => commandStateLabel(row.state) }
      )
  },
  {
    key: 'reason',
    minWidth: '140px',
    title: () => $t('page.expect.statusInfo'),
    render: (row: CommandReceipt) => row.reason || '--'
  },
  {
    key: 'deliveryAt',
    minWidth: '200px',
    title: () => $t('page.expect.dealTime'),
    render: (row: CommandReceipt) => fmt(row.deliveryAt)
  },
  {
    title: $t('common.actions'),
    key: 'actions',
    minWidth: '100px',
    render: (row: CommandReceipt) =>
      row.state === 'accepted'
        ? h(
            NPopconfirm,
            { onPositiveClick: () => handleCancel(row.id) },
            {
              trigger: () => h(NButton, { type: 'error', size: 'small' }, { default: () => '取消' }),
              default: () => '取消这条等待上线发送的命令？'
            }
          )
        : null
  }
]) as Ref<any>

const handleSearch = () => {
  pagination.page = 1
  query.page = 1
  getTableData()
}
handleSearch()
const handleReset = () => {
  query.status = 'accepted'
  query.identifier = null
  query.label = null
  query.page = 1
  pagination.page = 1
  getTableData()
}
</script>

<template>
  <div class="flex flex-col gap-15px rounded-lg">
    <div class="row flex items-end justify-between gap-4">
      <NForm class="flex-wrap" inline label-placement="left" label-align="right" label-width="120">
        <NFormItem>
          <NSelect
            v-model:value="query.status"
            :options="statusOptions"
            :placeholder="$t('page.expect.send')"
            class="input-style w-200px"
            clearable
          />
        </NFormItem>
        <NFormItem>
          <NInput
            v-model:value="query.identifier"
            :placeholder="$t('page.expect.selectCommandTypePlease')"
            class="input-style w-200px"
            clearable
          />
        </NFormItem>
        <NFormItem>
          <NInput
            v-model:value="query.label"
            :placeholder="$t('page.expect.inputLabelPlease')"
            class="input-style w-200px"
          />
        </NFormItem>
        <NFormItem>
          <NButton type="primary" @click="handleSearch">{{ $t('common.search') }}</NButton>
          <NButton class="ml-12px" @click="handleReset">{{ $t('common.reset') }}</NButton>
        </NFormItem>
      </NForm>
    </div>
  </div>
  <n-alert v-if="listError" type="warning" :show-icon="false" class="mb-4">{{ listError }}</n-alert>
  <NDataTable
    class="device-detail-table"
    :columns="columns"
    :data="tableData"
    size="medium"
    :theme-overrides="tableThemeOverrides"
    :bordered="true"
    :bottom-bordered="true"
    :single-column="false"
    :single-line="true"
    :scroll-x="1180"
    :row-key="expectedMessageRowKey"
    :pagination="pagination"
    :remote="true"
  >
    <template #empty>
      <NEmpty size="small" :description="$t('common.noData')" />
    </template>
  </NDataTable>
</template>
