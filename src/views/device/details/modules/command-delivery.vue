<script setup lang="ts">
import dayjs from 'dayjs'
import DistributionAndTable from '@/views/device/details/modules/public/distribution-and-table.vue'
import { deviceCommandNative } from '@/service/api/device-command-native'
import { commandDataPub, getCommandDataSetLogs } from '@/service/api/device'
import {
  commandRowsFromReceipts,
  createCommandSubmitter,
  parseTableExpected,
  parseTableSubmit
} from '@/service/api/device-command-rows'
import { newIdempotencyKey } from '@/service/api/device-write-attempt'
import { $t } from '@/locales'
import { computed, h, ref, watch } from 'vue'
import { NButton, NPopconfirm } from 'naive-ui'
import {
  hasNativeDeviceBinding,
  nativeCommandOptions,
  resolveDeviceNativeModel
} from '@/views/device/native-model-consumption'
import { controlLogStatus } from './public/control-log-status'
const props = defineProps<{
  id: string
  deviceData?: Record<string, any>
}>()

const hasModel = computed(() => hasNativeDeviceBinding(props.deviceData?.device_config))
const nativeCommands = ref<any[]>([])
const nativeCommandError = ref('')
let nativeCommandsRequestId = 0
async function loadNativeCommands() {
  const requestId = ++nativeCommandsRequestId
  const binding = props.deviceData?.device_config
  nativeCommands.value = []
  nativeCommandError.value = ''
  if (!hasModel.value) return
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
watch([() => props.id, () => props.deviceData?.device_config], () => void loadNativeCommands(), {
  immediate: true,
  deep: true
})

const listError = ref('')
const tableRef = ref<{ refresh?: () => void } | null>(null)
let cancelKey: { id: string; key: string } | null = null

async function cancelQueued(row: { id: string }) {
  // 结果未知后再次取消同一条命令，沿用同一个幂等键。
  const key = cancelKey?.id === row.id ? cancelKey.key : newIdempotencyKey()
  cancelKey = { id: row.id, key }
  try {
    await deviceCommandNative.cancel(props.id, row.id, '用户在设备详情页取消', key)
    cancelKey = null
    window.$message?.success('已取消')
  } catch (error) {
    if (typeof (error as { status?: unknown }).status === 'number') cancelKey = null
    window.$message?.error(error instanceof Error ? error.message : '取消失败')
  }
  tableRef.value?.refresh?.()
}
const snapshotId = computed(() => props.deviceData?.device_config?.native_thing_model_snapshot_id?.trim() || '')

// 命令记录来自原生接口；状态只按运行时回报显示，不把“已受理”说成“已执行”。
async function fetchNativeCommands(params: { page?: number; page_size?: number; device_id: string }) {
  try {
    const page = await deviceCommandNative.list(params.device_id, {
      page: params.page ?? 1,
      pageSize: params.page_size ?? 4
    })
    listError.value = ''
    return { data: { list: commandRowsFromReceipts(page.items), count: page.total }, error: null }
  } catch (error) {
    listError.value = error instanceof Error ? error.message : '读取命令记录失败'
    return { data: null, error: error as never }
  }
}

const submitter = createCommandSubmitter({
  send: (deviceId, body, key) => deviceCommandNative.submit(deviceId, body, key),
  newKey: () => newIdempotencyKey()
})

async function submitNativeExpected(params: {
  device_id: string
  identify?: unknown
  payload?: unknown
  expiry?: unknown
}) {
  try {
    if (!snapshotId.value) throw new Error('此设备尚未绑定固定版本的物模型，无法下发命令。')
    await submitter.submit(params.device_id, snapshotId.value, parseTableExpected(params))
    window.$message?.success('命令已加入上线后发送队列，实际状态以下方记录为准')
    return { data: null, error: null }
  } catch (error) {
    window.$message?.error(error instanceof Error ? error.message : '命令提交失败')
    throw error
  }
}

async function submitNativeCommand(params: { device_id: string; identify?: unknown; value?: unknown }) {
  try {
    if (!snapshotId.value) throw new Error('此设备尚未绑定固定版本的物模型，无法下发命令。')
    const receipt = await submitter.submit(params.device_id, snapshotId.value, parseTableSubmit(params))
    window.$message?.success(
      receipt.state === 'failed' ? '命令未被运行时接受，见下方记录' : '命令已提交，实际状态以下方记录为准'
    )
    return { data: receipt, error: null }
  } catch (error) {
    window.$message?.error(error instanceof Error ? error.message : '命令提交失败')
    throw error
  }
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
    render: row => (hasModel.value ? row.status_label || '--' : controlLogStatus(row.status))
  },
  { title: $t('generate.commandConetnt'), minWidth: '140px', key: 'data' },
  {
    title: $t('common.actions'),
    minWidth: '100px',
    key: 'actions',
    render: (row: any) =>
      row.cancellable
        ? h(
            NPopconfirm,
            { onPositiveClick: () => cancelQueued(row) },
            {
              trigger: () => h(NButton, { text: true, size: 'small' }, { default: () => '取消' }),
              default: () => '取消这条等待上线发送的命令？'
            }
          )
        : null
  },
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
    <n-alert v-if="listError" type="warning" :show-icon="false" class="mb-4">
      {{ listError }}
    </n-alert>
    <DistributionAndTable
      :id="props.id"
      :key="`${props.id}:${hasModel}`"
      ref="tableRef"
      :native-command-options="nativeCommands"
      :native-commands-resolved="hasModel"
      :button-name="$t('generate.issueCommand')"
      :is-command="true"
      :table-columns="columns"
      :fetch-data-api="hasModel ? fetchNativeCommands : getCommandDataSetLogs"
      :submit-api="hasModel ? submitNativeCommand : commandDataPub"
      :expect="hasModel"
      :expect-api="submitNativeExpected"
      :native-only="true"
      :manual-command="!hasModel"
      live-only
    />
  </div>
</template>

<style scoped></style>
