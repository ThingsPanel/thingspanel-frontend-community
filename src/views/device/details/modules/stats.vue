<script setup lang="tsx">
import { computed, ref } from 'vue'
import { NAlert, NButton, NPopconfirm } from 'naive-ui'
import dayjs from 'dayjs'
import { $t } from '@/locales'
import DistributionAndTable from '@/views/device/details/modules/public/distribution-and-table.vue'
import {
  attributeDataPub,
  deleteAttributeDataSet,
  expectMessageAdd,
  getAttributeDataSet,
  getAttributeDataSetLogs
} from '@/service/api'
import type { DeviceConfigNativeBinding } from '@/service/api/native-template-binding'
import { isDeviceDetailDemo } from '@/utils/device-detail-demo-data'
import { resolveDeviceNativeModel } from '@/views/device/native-model-consumption'
import { formatNativeAttributeValue } from '@/views/device/native-device-model-contract'
import { useNativeDeviceMetadata } from '@/views/device/use-native-device-metadata'
const props = defineProps<{
  id: string
  deviceData?: { device_config?: DeviceConfigNativeBinding | null }
}>()
const attributeRef = ref()
const { isNativeBound, nativeMetadataFailed, decorateRows } = useNativeDeviceMetadata(
  computed(() => props.deviceData?.device_config),
  'attribute',
  resolveDeviceNativeModel
)
const columns0 = [
  {
    title: $t('device_template.table_header.attributeIdentifier'),
    minWidth: '140px',
    key: 'key'
  },
  {
    title: $t('device_template.table_header.attributeName'),
    minWidth: '140px',
    key: 'data_name'
  },
  {
    title: $t('device_template.table_header.attributeValue'),
    minWidth: '140px',
    key: 'value',
    render: row =>
      row.nativeMetadataSource === 'native'
        ? formatNativeAttributeValue(row)
        : `${row.value}${row.unit !== null ? row.unit : ''}`
  },
  {
    title: $t('device_template.table_header.updateTime'),
    minWidth: '140px',
    key: 'ts',
    render: row => dayjs(row.ts).format('YYYY-MM-DD HH:mm:ss')
  },
  {
    title: $t('common.actions'),
    key: 'created_at',
    minWidth: '140px',
    render: row => {
      if (isNativeBound.value) return null
      return (
        <NPopconfirm
          onPositiveClick={async () => {
            await deleteAttributeDataSet(row.id)
            attributeRef.value.refresh()
          }}
        >
          {{
            trigger: () => (
              <NButton text size="small" disabled={isDeviceDetailDemo(props.id)}>
                {$t('common.delete')}
              </NButton>
            ),
            default: () => $t('common.confirmDelete')
          }}
        </NPopconfirm>
      )
    }
  }
]

// 操作类型
const formatOperationType = status => {
  switch (status) {
    case '1':
      return $t('custom.device_details.manualOperation')
    case '2':
      return $t('custom.device_details.automaticTriggering')
    default:
      return ''
  }
}

// 状态
const formatStatus = status => {
  switch (status) {
    case '1':
      return $t('generate.sendingSuccess')
    case '2':
      return $t('generate.sendingFail')
    case '3':
      return $t('generate.returnSuccess')
    case '4':
      return $t('generate.returnFail')
    default:
      return ''
  }
}
const columns = [
  {
    title: $t('custom.device_details.attributeDistributionTime'),
    minWidth: '140px',
    key: 'created_at',
    render: row => dayjs(row.created_at).format('YYYY-MM-DD HH:mm:ss')
  },
  {
    title: $t('custom.device_details.messageId'),
    minWidth: '140px',
    key: 'message_id'
  },
  {
    title: $t('custom.device_details.sendContent'),
    minWidth: '140px',
    key: 'data'
  },
  {
    title: $t('custom.device_details.operationType'),
    minWidth: '140px',
    key: 'operation_type',
    render: row => formatOperationType(row.status)
  },
  {
    title: $t('generate.status'),
    minWidth: '140px',
    key: 'status',
    render: row => formatStatus(row.status)
  },
  {
    title: $t('generate.errorMessage'),
    minWidth: '140px',
    key: 'error_message'
  }
]
</script>

<template>
  <div>
    <NAlert v-if="nativeMetadataFailed" type="warning" :show-icon="true" class="mb-12px">
      {{ $t('custom.devicePage.nativeMetadataLoadFailed') }}
    </NAlert>
    <DistributionAndTable
      :id="id as string"
      ref="attributeRef"
      :no-refresh="true"
      :table-columns="columns0"
      :fetch-data-api="getAttributeDataSet"
      :decorate-rows="decorateRows"
    />
  </div>

  <div v-if="!isNativeBound">
    <DistributionAndTable
      :id="id as string"
      :button-name="$t('generate.issue-attribute')"
      :table-columns="columns"
      :fetch-data-api="getAttributeDataSetLogs"
      :submit-api="attributeDataPub"
      :expect="true"
      :expect-api="expectMessageAdd"
    />
  </div>
</template>

<style scoped></style>
