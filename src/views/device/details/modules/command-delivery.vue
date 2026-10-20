<script setup lang="ts">
import dayjs from 'dayjs'
import DistributionAndTable from '@/views/device/details/modules/public/distribution-and-table.vue'
import { commandDataPub, expectMessageAdd, getCommandDataSetLogs } from '@/service/api'
import { $t } from '@/locales'
import { ref, watch } from 'vue'
import { deviceBindingRequiresNativeModel, hasNativeDeviceBinding, nativeCommandOptions, resolveDeviceNativeModel } from '@/views/device/native-model-consumption'
const props = defineProps<{
  id: string
  deviceData?: Record<string, any>
}>()

const nativeCommandsResolved = ref(false)
const nativeCommands = ref<any[]>([])
const nativeCommandError = ref('')
let nativeCommandsRequestId = 0
async function loadNativeCommands() {
  const requestId = ++nativeCommandsRequestId
  const binding = props.deviceData?.device_config
  nativeCommands.value = []
  nativeCommandError.value = ''
  if (!hasNativeDeviceBinding(binding)) {
    nativeCommandsResolved.value = deviceBindingRequiresNativeModel(binding)
    if (nativeCommandsResolved.value) nativeCommandError.value = '此设备模板尚未绑定固定版本的原生物模型命令。'
    return
  }
  nativeCommandsResolved.value = true
  try {
    const resolved = await resolveDeviceNativeModel(binding)
    if (requestId !== nativeCommandsRequestId) return
    nativeCommands.value = resolved ? nativeCommandOptions(resolved.snapshot.model) : []
  } catch (error) {
    if (requestId !== nativeCommandsRequestId) return
    nativeCommands.value = []
    nativeCommandError.value = error instanceof Error ? error.message : '读取绑定命令失败'
    console.error('[CommandDelivery] 加载绑定命令快照失败:', error)
    window.$message?.error(nativeCommandError.value)
  }
}
watch([() => props.id, () => props.deviceData?.device_config], () => void loadNativeCommands(), { immediate: true, deep: true })

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
    <n-alert v-if="nativeCommandError" type="error" :show-icon="false" class="mb-4">
      {{ nativeCommandError }}
    </n-alert>
    <DistributionAndTable
      :id="props.id"
      :native-command-options="nativeCommands"
      :native-commands-resolved="nativeCommandsResolved"
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
