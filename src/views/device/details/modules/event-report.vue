<script setup lang="ts">
import dayjs from 'dayjs'
import { computed, ref, watch } from 'vue'
import { NAlert } from 'naive-ui'
import DistributionAndTable from '@/views/device/details/modules/public/distribution-and-table.vue'
import { getEventDataSet } from '@/service/api'
import { $t } from '@/locales'
import type { DeviceConfigNativeBinding } from '@/service/api/native-template-binding'
import { hasNativeDeviceBinding, resolveDeviceNativeModel } from '@/views/device/native-model-consumption'
import { decorateNativeEventRows } from '@/views/device/native-device-model-contract'
import type { PlatformField } from '@/utils/thingsvis/types'
const props = defineProps<{
  id: string
  deviceData?: { device_config?: DeviceConfigNativeBinding | null }
}>()

const nativeFields = ref<PlatformField[]>([])
const nativeMetadataFailed = ref(false)
let nativeModelRequestId = 0
const isNativeBound = computed(() => hasNativeDeviceBinding(props.deviceData?.device_config))
const decorateRows = computed(() =>
  isNativeBound.value ? (rows: Record<string, any>[]) => decorateNativeEventRows(rows, nativeFields.value) : undefined
)

watch(
  () => props.deviceData?.device_config,
  async binding => {
    const requestId = ++nativeModelRequestId
    nativeFields.value = []
    nativeMetadataFailed.value = false
    if (!hasNativeDeviceBinding(binding)) return
    try {
      const resolved = await resolveDeviceNativeModel(binding)
      if (requestId !== nativeModelRequestId) return
      nativeFields.value = (resolved?.platformFields || []).filter(field => field.dataType === 'event')
    } catch (error) {
      if (requestId !== nativeModelRequestId) return
      nativeMetadataFailed.value = true
      console.warn('[DeviceEventReport] Failed to read pinned native model metadata', error)
    }
  },
  { immediate: true }
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
