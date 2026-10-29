<script setup lang="ts">
import { computed, ref } from 'vue'
import { NAlert } from 'naive-ui'
import dayjs from 'dayjs'
import { $t } from '@/locales'
import DistributionAndTable from '@/views/device/details/modules/public/distribution-and-table.vue'
import { deviceRuntimeNative } from '@/service/api/device-runtime-native'
import { latestRowsFromReadings } from '@/service/api/device-runtime-rows'
import type { DeviceConfigNativeBinding } from '@/service/api/native-template-binding'
import { resolveDeviceNativeModel } from '@/views/device/native-model-consumption'
import { formatNativeAttributeValue } from '@/views/device/native-device-model-contract'
import { useNativeDeviceMetadata } from '@/views/device/use-native-device-metadata'
const props = defineProps<{
  id: string
  deviceData?: { device_config?: DeviceConfigNativeBinding | null }
}>()
const { nativeMetadataFailed, decorateRows } = useNativeDeviceMetadata(
  computed(() => props.deviceData?.device_config),
  'attribute',
  resolveDeviceNativeModel
)

const loadError = ref('')
const truncated = ref(false)

/** Latest attribute values from the native readings API, adapted to the table's { data, error } contract. */
async function fetchNativeAttributes(params: { device_id: string }): Promise<any> {
  try {
    const page = await deviceRuntimeNative.listReadings(params.device_id, {
      kind: 'attribute',
      latestOnly: true,
      page: 1,
      pageSize: 100
    })
    loadError.value = ''
    const rows = latestRowsFromReadings(page, 'attribute')
    truncated.value = rows.truncated
    return { data: { list: rows.list, count: rows.count }, error: null }
  } catch (error) {
    loadError.value = error instanceof Error ? error.message : '属性读取失败'
    return { data: null, error }
  }
}

const columns = [
  { title: $t('device_template.table_header.attributeIdentifier'), minWidth: '140px', key: 'key' },
  { title: $t('device_template.table_header.attributeName'), minWidth: '140px', key: 'data_name' },
  {
    title: $t('device_template.table_header.attributeValue'),
    minWidth: '140px',
    key: 'value',
    render: (row: any) =>
      row.nativeMetadataSource === 'native' ? formatNativeAttributeValue(row) : `${row.value ?? ''}`
  },
  {
    title: $t('device_template.table_header.updateTime'),
    minWidth: '140px',
    key: 'ts',
    render: (row: any) => dayjs(row.ts).format('YYYY-MM-DD HH:mm:ss')
  }
]
</script>

<template>
  <div>
    <NAlert v-if="nativeMetadataFailed" type="warning" :show-icon="true" class="mb-12px">
      {{ $t('custom.devicePage.nativeMetadataLoadFailed') }}
    </NAlert>
    <NAlert v-if="loadError" type="warning" :show-icon="true" class="mb-12px">{{ loadError }}</NAlert>
    <NAlert v-if="truncated" type="info" :show-icon="true" class="mb-12px">仅显示前 100 个属性的最新值。</NAlert>
    <NAlert type="info" :show-icon="false" class="mb-12px">
      属性下发和下发记录暂未提供原生入口，本页只读显示设备当前上报的属性值。
    </NAlert>
    <DistributionAndTable
      :id="id as string"
      :no-refresh="true"
      :table-columns="columns"
      :fetch-data-api="fetchNativeAttributes"
      :decorate-rows="decorateRows"
    />
  </div>
</template>

<style scoped></style>
