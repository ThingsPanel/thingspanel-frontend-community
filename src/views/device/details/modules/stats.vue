<script setup lang="tsx">
import { ref } from 'vue';
import { NButton, NPopconfirm } from 'naive-ui';
import dayjs from 'dayjs';
import { $t } from '@/locales';
import DistributionAndTable from '@/views/device/details/modules/public/distribution-and-table.vue';
import { attributeDataPub, deleteAttributeDataSet, getAttributeDataSet, getAttributeDataSetLogs } from '@/service/api';
defineProps<{
  id: string;
}>();
const attributeRef = ref();
const columns0 = [
  { title: $t('device_template.table_header.attributeIdentifier'), minWidth: '140px', key: 'key' },
  { title: $t('device_template.table_header.attributeName'), minWidth: '140px', key: 'data_name' },
  {
    title: $t('device_template.table_header.attributeValue'),
    minWidth: '140px',
    key: 'value',
    render: row => `${row.value}${row.unit !== null ? row.unit : ''}`
  },
  {
    title: $t('device_template.table_header.updateTime'),
    minWidth: '140px',
    key: 'created_at',
    render: row => dayjs(row.created_at).format('YYYY-MM-DD HH:mm:ss')
  },
  {
    title: $t('common.action'),
    key: 'created_at',
    minWidth: '140px',
    render: row => (
      <NPopconfirm
        onPositiveClick={async () => {
          await deleteAttributeDataSet(row.device_id);
          attributeRef.value.refresh();
        }}
      >
        {{
          trigger: () => (
            <NButton text size="small">
              {$t('common.delete')}
            </NButton>
          ),
          default: () => $t('common.confirmDelete')
        }}
      </NPopconfirm>
    )
  }
];

// 操作类型
const formatOperationType = status => {
  switch (status) {
    case '1':
      return $t('custom.device_details.manualOperation');
    case '2':
      return $t('custom.device_details.automaticTriggering');
    default:
      return '';
  }
};

// 状态
const formatStatus = status => {
  switch (status) {
    case '1':
      return $t('generate.sendingSuccess');
    case '2':
      return $t('generate.sendingFail');
    case '3':
      return $t('generate.returnSuccess');
    case '4':
      return $t('generate.returnFail');
    default:
      return '';
  }
};
const columns = [
  {
    title: $t('custom.device_details.attributeDistributionTime'),
    minWidth: '140px',
    key: 'created_at',
    render: row => dayjs(row.created_at).format('YYYY-MM-DD HH:mm:ss')
  },
  { title: $t('custom.device_details.messageId'), minWidth: '140px', key: 'message_id' },
  { title: $t('custom.device_details.sendContent'), minWidth: '140px', key: 'data' },
  {
    title: $t('custom.device_details.operationType'),
    minWidth: '140px',
    key: 'operation_type',
    render: row => formatOperationType(row.status)
  },
  { title: $t('generate.status'), minWidth: '140px', key: 'status', render: row => formatStatus(row.status) },
  { title: $t('generate.errorMessage'), minWidth: '140px', key: 'error_message' }
];
</script>

<template>
  <div>
    <DistributionAndTable
      :id="id as string"
      ref="attributeRef"
      :no-refresh="true"
      :table-columns="columns0"
      :fetch-data-api="getAttributeDataSet"
    />
  </div>

  <div>
    <DistributionAndTable
      :id="id as string"
      :button-name="$t('generate.issue-attribute')"
      :table-columns="columns"
      :fetch-data-api="getAttributeDataSetLogs"
      :submit-api="attributeDataPub"
    />
  </div>
</template>

<style scoped></style>
