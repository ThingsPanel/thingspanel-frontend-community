<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { deviceLifecycleNative, type DeviceOperation } from '@/service/api/device-lifecycle-native'
import { classifyWriteFailure, newIdempotencyKey } from '@/service/api/device-write-attempt'
import { canManageDeviceGroups } from '@/service/api/device-group-editor-state'
import { useAuthStore } from '@/store/modules/auth'

const props = defineProps<{ id: string; readonly?: boolean; unavailableReason?: string }>()
const emit = defineEmits<{ change: [] }>()
const auth = useAuthStore()
const canWrite = computed(() => canManageDeviceGroups(auth.userInfo.roles) && !props.readonly)
const desired = ref('')
const etag = ref('')
const error = ref('')
const result = ref('')
const loading = ref(false)
const operation = ref<DeviceOperation | null>(null)
const attempt = ref<{ state: 'enabled' | 'disabled'; etag: string; key: string } | null>(null)
const pending = computed(() => operation.value?.state === 'pending' || operation.value?.state === 'running')
let sequence = 0
let timer: ReturnType<typeof setTimeout> | undefined
const storageKey = () => `device-state-operation:${auth.userInfo.id || auth.userInfo.userId}:${props.id}`

async function readState() {
  const seq = sequence
  const data = await deviceLifecycleNative.readAdministrativeState(props.id)
  if (seq !== sequence) return
  desired.value = data.state.state
  etag.value = data.etag
}
async function refreshOperation(id: string) {
  const seq = sequence
  try {
    const next = await deviceLifecycleNative.getOperation(id)
    if (seq !== sequence) return
    operation.value = next
    error.value = ''
    if (next.state === 'pending' || next.state === 'running') {
      timer = setTimeout(() => void refreshOperation(id), 2000)
      return
    }
    sessionStorage.removeItem(storageKey())
    if (next.state === 'succeeded') {
      result.value = '设备管理状态已生效'
      await readState()
      emit('change')
    } else {
      error.value = '状态应用失败，请刷新后重试。'
    }
  } catch (e) {
    if (seq !== sequence) return
    error.value = e instanceof Error ? e.message : '状态确认失败'
  }
}
async function submit(state: 'enabled' | 'disabled') {
  if (!canWrite.value || loading.value || pending.value || !etag.value) return
  const seq = sequence
  loading.value = true
  result.value = ''
  error.value = ''
  attempt.value ??= { state, etag: etag.value, key: newIdempotencyKey() }
  const frozen = attempt.value
  try {
    const accepted = await deviceLifecycleNative.setAdministrativeState(
      props.id,
      { state: frozen.state },
      frozen.etag,
      frozen.key
    )
    if (seq !== sequence) return
    attempt.value = null
    operation.value = accepted.operation
    sessionStorage.setItem(storageKey(), accepted.operation.id)
    await readState()
    await refreshOperation(accepted.operation.id)
  } catch (e) {
    if (seq !== sequence) return
    const kind = classifyWriteFailure(e)
    if (kind !== 'unknown') attempt.value = null
    error.value = kind === 'unknown' ? '请求结果未知，请重试原请求。' : e instanceof Error ? e.message : '状态提交失败'
    if (kind !== 'unknown') await readState().catch(() => {})
  } finally {
    if (seq === sequence) loading.value = false
  }
}
watch(
  () => [props.id, auth.userInfo.id || auth.userInfo.userId],
  async () => {
    sequence++
    if (timer) clearTimeout(timer)
    operation.value = null
    attempt.value = null
    desired.value = ''
    etag.value = ''
    error.value = ''
    result.value = ''
    loading.value = true
    const seq = sequence
    try {
      await readState()
      if (seq !== sequence) return
      const id = sessionStorage.getItem(storageKey())
      if (id) await refreshOperation(id)
    } catch (e) {
      if (seq === sequence) error.value = e instanceof Error ? e.message : '状态读取失败'
    } finally {
      if (seq === sequence) loading.value = false
    }
  },
  { immediate: true }
)
onBeforeUnmount(() => {
  sequence++
  if (timer) clearTimeout(timer)
})
</script>

<template>
  <NCard title="设备启停" size="small">
    <div class="flex flex-wrap items-center gap-3">
      <span>管理设置：{{ desired === 'disabled' ? '停用' : desired === 'enabled' ? '启用' : '--' }}</span>
      <NTag v-if="pending" type="warning">正在应用</NTag>
      <template v-if="canWrite">
        <NButton v-if="attempt" :loading="loading" @click="submit(attempt.state)">重试原请求</NButton>
        <template v-else>
          <NPopconfirm @positive-click="submit('disabled')">
            <template #trigger>
              <NButton :disabled="loading || pending || !etag" type="warning">停用设备</NButton>
            </template>
            停用后设备将无法接入或接受控制，历史数据保留。
          </NPopconfirm>
          <NButton :disabled="loading || pending || !etag" @click="submit('enabled')">启用设备</NButton>
        </template>
      </template>
      <NButton v-if="operation && error" @click="refreshOperation(operation.id)">刷新结果</NButton>
    </div>
    <div v-if="unavailableReason" class="mt-2 text-12px opacity-70">{{ unavailableReason }}</div>
    <NAlert v-if="result" type="success" class="mt-3">{{ result }}</NAlert>
    <NAlert v-if="error" type="error" class="mt-3">{{ error }}</NAlert>
  </NCard>
</template>
