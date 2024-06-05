<script setup lang="ts">
import dayjs from 'dayjs';
import DistributionAndTable from '@/views/device/details/modules/public/distribution-and-table.vue';
import { getEventDataSet } from '@/service/api';
import { $t } from '@/locales';
defineProps<{
  id: string;
}>();

const columns = [
  { title: $t('device_template.table_header.eventIdentifier'), minWidth: '140px', key: 'identify' },
  { title: $t('device_template.table_header.eventName'), minWidth: '140px', key: '' },
  {
    title: $t('device_template.table_header.eventName'),
    minWidth: '140px',
    key: 'ts',
    render: row => dayjs(row.ts).format('YYYY-MM-DD HH:mm:ss')
  },
  { title: $t('device_template.table_header.eventContent'), minWidth: '140px', key: 'data' },
  { title: $t('generate.errorMessage'), minWidth: '140px', key: 'error_message' }
];
</script>

<template>
  <div>
    <DistributionAndTable :id="id as string" :table-columns="columns" :fetch-data-api="getEventDataSet" />
  </div>
</template>

<style scoped></style>
