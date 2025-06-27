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
    '1': "发送成功",
    '2': "发送失败",
    '3': "返回成功",
    '4': "返回失败"
  }

  return statusjson[status] || ''
}

const columns = [
  {
    title: "命令标识符",
    minWidth: '140px',
    key: 'identify'
  },
  {
    title: "命令名称",
    minWidth: '140px',
    key: 'identify_name',
    render: row => row.identify_name || '--'
  },

  {
    title: "命令下发时间",
    minWidth: '140px',
    key: 'created_at',
    render: row => dayjs(row.created_at).format('YYYY-MM-DD HH:mm:ss')
  },
  {
    title: "状态",
    minWidth: '140px',
    key: 'status',
    render: row => formatStatus(row.status)
  },
  { title: "命令内容", minWidth: '140px', key: 'data' },
  {
    title: "错误信息",
    minWidth: '140px',
    render: row => row.error_message || '--'
  }
]
</script>

<template>
  <div>
    <DistributionAndTable
      :id="id as string"
      :button-name="下发命令"
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
