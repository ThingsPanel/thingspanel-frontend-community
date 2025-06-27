<script setup lang="ts">
import dayjs from 'dayjs'
import DistributionAndTable from '@/views/device/details/modules/public/distribution-and-table.vue'
import { getEventDataSet } from '@/service/api'
import { $t } from '@/locales'
defineProps<{
  id: string
}>()

const columns = [
  { title: "事件标识符", minWidth: '140px', key: 'identify' },
  { title: "事件名称", minWidth: '140px', key: 'data_name' },
  {
    title: "事件上报时间",
    minWidth: '140px',
    key: 'ts',
    render: row => dayjs(row.ts).format('YYYY-MM-DD HH:mm:ss')
  },
  { title: "事件内容", minWidth: '140px', key: 'data' },
  { title: "错误信息", minWidth: '140px', key: 'error_message' }
]
</script>

<template>
  <div>
    <DistributionAndTable :id="id as string" :table-columns="columns" :fetch-data-api="getEventDataSet" />
  </div>
</template>

<style scoped></style>
