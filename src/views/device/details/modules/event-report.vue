<script setup lang="ts">
import dayjs from 'dayjs'
import { computed } from 'vue'
import { NAlert } from 'naive-ui'
import DistributionAndTable from '@/views/device/details/modules/public/distribution-and-table.vue'
import { getEventDataSet } from '@/service/api'
import { $t } from '@/locales'
import type { DeviceConfigNativeBinding } from '@/service/api/native-template-binding'
import { resolveDeviceNativeModel } from '@/views/device/native-model-consumption'
import { useNativeDeviceMetadata } from '@/views/device/use-native-device-metadata'
const props = defineProps<{
  id: string
  deviceData?: { device_config?: DeviceConfigNativeBinding | null }
}>()
const { nativeMetadataFailed, decorateRows } = useNativeDeviceMetadata(
  computed(() => props.deviceData?.device_config),
  'event',
  resolveDeviceNativeModel
)

const columns = [
  { title: $t('device_template.table_header.eventIdentifier'), minWidth: '140px', key: 'identify' },
  { title: $t('device_template.table_header.eventName'), minWidth: '140px', key: 'data_name' },
  {
    title: $t('device_template.table_header.eventReportingTime'),
    minWidth: '140px',
    key: 'ts',
    render: row => dayjs(row.ts).format('YYYY-MM-DD HH:mm:ss')
  },
  {
    title: $t('device_template.table_header.eventContent'),
    minWidth: '140px',
    key: 'data',
    render: row => (row.nativeMetadataSource === 'native' ? row.data_display : row.data)
  },
  { title: $t('generate.errorMessage'), minWidth: '140px', key: 'error_message' }
]
</script>

<template>
  <div>
    <NAlert v-if="nativeMetadataFailed" type="warning" :show-icon="true" class="mb-12px">
      {{ $t('custom.devicePage.nativeMetadataLoadFailed') }}
    </NAlert>
    <DistributionAndTable
      :id="id as string"
      :table-columns="columns"
      :fetch-data-api="getEventDataSet"
      :decorate-rows="decorateRows"
    />
  </div>
</template>

<style scoped></style>
