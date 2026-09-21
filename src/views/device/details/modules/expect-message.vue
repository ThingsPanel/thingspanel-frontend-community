<script setup lang="tsx">
import { h, reactive, ref } from 'vue'
import type { Ref } from 'vue'
import type { PaginationProps } from 'naive-ui'
import { NButton, NDataTable, NEmpty, NPopconfirm, NTag } from 'naive-ui'
import moment from 'moment'
import { expectMessageDelete, expectMessageList } from '@/service/api'
import { $t } from '@/locales'
import { demoExpectedMessages, isDeviceDetailDemo } from '@/utils/device-detail-demo-data'
const props = defineProps<{
  id: string
}>()

const tableData = ref([])

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
const statusOptions = ref([
  { label: $t('page.expect.pending'), value: 'pending' },
  { label: $t('page.expect.send'), value: 'sent' },
  { label: $t('page.expect.expired'), value: 'expired' }
])
const typeOptions = ref([
  { label: $t('custom.device_details.telemetry'), value: 'telemetry' },
  { label: $t('custom.device_details.attributes'), value: 'attribute' },
  { label: $t('page.expect.command'), value: 'command' }
])

const query = reactive({
  status: 'pending',
  type: null,
  label: null,
  page: 1,
  page_size: 10
})
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
    query.page_size = pageSize
    getTableData()
  }
})
async function getTableData() {
  const { data, error } = await expectMessageList({
    device_id: props.id,
    send_type: query.type,
    ...query
  })
  if (!error) {
    const list: any = data?.list || []
    tableData.value = list.length > 0 || !isDeviceDetailDemo(props.id) ? list : demoExpectedMessages()
    pagination.itemCount = data?.total || tableData.value.length
  }
}

const handleDeleteTable = async id => {
  if (isDeviceDetailDemo(props.id)) return
  const { error } = await expectMessageDelete(id)
  if (!error) {
    window.$message?.success($t('common.deleteSuccess'))
    getTableData()
  }
}
const columns: Ref<any> = ref([
  {
    key: 'created_at',
    minWidth: '200px',
    title: () => $t('page.expect.createTime'),
    render: row => {
      return row.created_at ? moment(row.created_at).format('YYYY-MM-DD hh:mm:ss') : ''
    }
  },
  {
    key: 'send_type',
    minWidth: '100px',
    title: () => $t('page.expect.commandType'),
    render: row => {
      return typeOptions.value.find(v => v.value === row.send_type)?.label
    }
  },
  {
    key: 'label',
    minWidth: '100px',
    title: () => $t('page.expect.label')
  },
  {
    key: 'payload',
    minWidth: '200px',
    title: () => $t('page.expect.commandContent')
  },
  {
    key: 'expiry_time',
    minWidth: '200px',
    title: () => $t('page.expect.expireTime'),
    render: row => {
      return row.expiry_time ? moment(row.expiry_time).format('YYYY-MM-DD hh:mm:ss') : ''
    }
  },
  {
    key: 'status',
    minWidth: '100px',
    title: () => $t('page.expect.status'),
    render: row => {
      const label = statusOptions.value.find(v => v.value === row.status)?.label
      return h(
        NTag,
        { type: row.status === 'sent' ? 'success' : row.status === 'expired' ? 'error' : 'warning', size: 'small' },
        { default: () => label }
      )
    }
  },
  {
    key: 'message',
    minWidth: '140px',
    title: () => $t('page.expect.statusInfo')
  },
  {
    key: 'send_time',
    minWidth: '200px',
    title: () => $t('page.expect.dealTime'),
    render: row => {
      return row.send_time ? moment(row.send_time).format('YYYY-MM-DD hh:mm:ss') : ''
    }
  },
  {
    title: $t('common.actions'),
    key: 'created_at',
    minWidth: '100px',
    render: row => {
      return (
        <NPopconfirm
          negative-text={$t('common.cancel')}
          positive-text={$t('common.confirm')}
          onPositiveClick={() => handleDeleteTable(row.id)}
        >
          {{
            default: () => $t('common.confirm'),
            trigger: () => (
              <NButton type="error" size={'small'} disabled={isDeviceDetailDemo(props.id)}>
                {$t('common.delete')}
              </NButton>
            )
          }}
        </NPopconfirm>
      )
    }
  }
]) as Ref<any>

const handleSearch = () => {
  pagination.page = 1
  getTableData()
}
handleSearch()
const handleReset = () => {
  query.status = 'pending'
  query.type = null
  query.label = null
  query.page = 1
  query.page_size = 10
  handleSearch()
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
          <NSelect
            v-model:value="query.type"
            :options="typeOptions"
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
