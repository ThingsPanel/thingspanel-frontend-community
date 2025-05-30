<script setup lang="ts">
import dayjs from 'dayjs'
import DistributionAndTable from '@/views/device/details/modules/public/distribution-and-table.vue'
import { commandDataPub, expectMessageAdd, getCommandDataSetLogs } from '@/service/api'
import { $t } from '@/locales'
defineProps<{
  id: string
}>()

// 状态
const formatStatus = (status: string) => {
  const statusjson = {
    '1': $t('generate.sendingSuccess'),
    '2': $t('generate.sendingFail'),
    '3': $t('generate.returnSuccess'),
    '4': $t('generate.returnFail')
  }

  return statusjson[status] || ''
}

const columns = [
  {
    title: $t('device_template.table_header.commandIdentifier'),
    minWidth: '140px',
    key: 'identify'
  },
  {
    title: $t('device_template.table_header.commandName'),
    minWidth: '140px',
    key: 'identify_name',
    render: row => row.identify_name || '--'
  },

  {
    title: $t('generate.commandIssuanceTime'),
    minWidth: '140px',
    key: 'created_at',
    render: row => dayjs(row.created_at).format('YYYY-MM-DD HH:mm:ss')
  },
  {
    title: $t('generate.status'),
    minWidth: '140px',
    key: 'status',
    render: row => formatStatus(row.status)
  },
  { title: $t('generate.commandConetnt'), minWidth: '140px', key: 'data' },
  {
    title: $t('generate.errorMessage'),
    minWidth: '140px',
    render: row => row.error_message || '--'
  }
]
</script>

<template>
  <div>
    <DistributionAndTable
      :id="id as string"
      :button-name="$t('generate.issueCommand')"
      :is-command="true"
      :table-columns="columns"
      :fetch-data-api="getCommandDataSetLogs"
      :submit-api="commandDataPub"
      :expect="true"
      :expect-api="expectMessageAdd"
    />
  </div>
</template>

<style scoped></style>
