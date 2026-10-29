<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { deviceNative } from '@/service/api/device-native'
import { deviceLifecycleNative, type DeviceOperation } from '@/service/api/device-lifecycle-native'
import { templateNative, type DeviceAccessTemplate } from '@/service/api/template-native'
import {
  classifyWriteFailure,
  describeAccepted,
  freezeAttempt,
  newIdempotencyKey,
  type FrozenWriteAttempt
} from '@/service/api/device-write-attempt'

const props = defineProps<{ id: string }>()
const emit = defineEmits<{ (e: 'change'): void }>()

type Action = 'state' | 'binding' | 'delete' | 'number'
const loading = ref(false)
const loadError = ref('')
const adminState = ref<'enabled' | 'disabled'>('enabled')
const adminEtag = ref('')
const bindingEtag = ref('')
const currentTemplateId = ref<string | null>(null)
const deviceEtag = ref('')
const deviceVersion = ref(0)
const currentNumber = ref('')
const newNumber = ref('')
const numberReason = ref('')
const templates = ref<DeviceAccessTemplate[]>([])
const selectedTemplateId = ref<string | null>(null)
const busy = ref<Action | null>(null)
const message = ref<Record<Action, string>>({ state: '', binding: '', delete: '', number: '' })
const failure = ref<Record<Action, string>>({ state: '', binding: '', delete: '', number: '' })
const operations = ref<Partial<Record<Action, DeviceOperation>>>({})
const frozen = ref<Partial<Record<Action, FrozenWriteAttempt<string>>>>({})
const deletePending = computed(
  () => operations.value.delete?.state === 'pending' || operations.value.delete?.state === 'running'
)
let generation = 0

async function load() {
  const current = ++generation
  loading.value = true
  loadError.value = ''
  try {
    const [state, binding, device, templatePage] = await Promise.all([
      deviceLifecycleNative.readAdministrativeState(props.id),
      deviceNative.readTemplateBinding(props.id),
      deviceNative.get(props.id),
      templateNative.list({ page: 1, pageSize: 100 })
    ])
    if (current !== generation) return
    adminState.value = state.state.state
    adminEtag.value = state.etag
    bindingEtag.value = binding.etag
    currentTemplateId.value = binding.binding.templateId
    selectedTemplateId.value = binding.binding.templateId
    deviceEtag.value = device.etag
    deviceVersion.value = Number(device.device.resourceVersion)
    currentNumber.value = device.device.deviceNumber
    templates.value = templatePage.items
  } catch (e) {
    if (current !== generation) return
    loadError.value = e instanceof Error ? e.message : '设备设置读取失败'
  } finally {
    if (current === generation) loading.value = false
  }
}

async function run(action: Action, build: () => FrozenWriteAttempt<string>) {
  if (busy.value) return
  message.value[action] = ''
  failure.value[action] = ''
  // A previous unknown outcome must be replayed as-is; a fresh click builds a new attempt.
  const attempt = frozen.value[action] ?? build()
  frozen.value[action] = attempt
  busy.value = action
  try {
    const call =
      action === 'state'
        ? deviceLifecycleNative.setAdministrativeState(props.id, JSON.parse(attempt.body), attempt.etag, attempt.key)
        : action === 'binding'
          ? deviceLifecycleNative.setTemplateBinding(props.id, attempt.body, attempt.etag, attempt.key)
          : action === 'number'
            ? deviceLifecycleNative.changeNumber(props.id, JSON.parse(attempt.body), attempt.key)
            : deviceLifecycleNative.requestDeletion(props.id, attempt.etag, attempt.key)
    const accepted = await call
    delete frozen.value[action]
    operations.value[action] = accepted.operation
    message.value[action] = describeAccepted(accepted.operation.state)
    emit('change')
    await load()
  } catch (e) {
    const kind = classifyWriteFailure(e)
    if (kind === 'unknown') {
      failure.value[action] = '请求结果未知（网络中断）。再次点击将重发原请求，不会提交不同内容。'
    } else {
      delete frozen.value[action]
      failure.value[action] =
        kind === 'stale'
          ? '数据已被他人修改，已刷新，请确认后重新操作。'
          : kind === 'conflict'
            ? `冲突：${e instanceof Error ? e.message : ''}`
            : e instanceof Error
              ? e.message
              : '操作失败'
      await load()
    }
  } finally {
    busy.value = null
  }
}

function toggleState() {
  const next = adminState.value === 'enabled' ? 'disabled' : 'enabled'
  void run('state', () =>
    freezeAttempt(props.id, JSON.stringify({ state: next }), adminEtag.value, newIdempotencyKey())
  )
}
function saveBinding() {
  const templateId = selectedTemplateId.value
  if (templateId === currentTemplateId.value) {
    failure.value.binding = '模板没有变化'
    return
  }
  void run('binding', () =>
    freezeAttempt(props.id, JSON.stringify({ templateId }), bindingEtag.value, newIdempotencyKey())
  )
}
function saveNumber() {
  const deviceNumber = newNumber.value.trim()
  const reason = numberReason.value.trim()
  if (!deviceNumber || deviceNumber === currentNumber.value) {
    failure.value.number = '请输入与当前不同的新编号'
    return
  }
  if (!reason) {
    failure.value.number = '请填写变更原因'
    return
  }
  void run('number', () =>
    freezeAttempt(
      props.id,
      JSON.stringify({ deviceNumber, expectedDeviceVersion: deviceVersion.value, reason }),
      deviceEtag.value,
      newIdempotencyKey()
    )
  )
}
function requestDelete() {
  void run('delete', () => freezeAttempt(props.id, '', deviceEtag.value, newIdempotencyKey()))
}

watch(
  () => props.id,
  () => {
    frozen.value = {}
    operations.value = {}
    newNumber.value = ''
    numberReason.value = ''
    void load()
  },
  { immediate: true }
)
onBeforeUnmount(() => {
  generation++
})
</script>

<template>
  <NSpin :show="loading">
    <div class="flex flex-col gap-6">
      <NAlert type="info" :show-icon="false">
        以下修改提交后为"已受理"，需运行时应用后才真正生效；运行时应用回执尚未接入，状态可能长期停留在待应用。
      </NAlert>
      <NAlert v-if="loadError" type="error">{{ loadError }}</NAlert>

      <NCard title="管理状态" size="small">
        <div class="flex items-center gap-3">
          <span>当前：{{ adminState === 'enabled' ? '已启用' : '已停用' }}（管理期望，与在线状态无关）</span>
          <NButton :loading="busy === 'state'" :disabled="!!busy || loading" @click="toggleState">
            {{ adminState === 'enabled' ? '停用设备' : '启用设备' }}
          </NButton>
        </div>
        <NAlert v-if="message.state" type="success" class="mt-2">{{ message.state }}</NAlert>
        <NAlert v-if="failure.state" type="error" class="mt-2">{{ failure.state }}</NAlert>
      </NCard>

      <NCard title="设备模板" size="small">
        <div class="flex items-center gap-3">
          <NSelect
            v-model:value="selectedTemplateId"
            clearable
            filterable
            placeholder="未绑定模板"
            style="width: 320px"
            :options="templates.map(t => ({ label: t.name, value: t.id }))"
          />
          <NButton type="primary" :loading="busy === 'binding'" :disabled="!!busy || loading" @click="saveBinding">
            保存绑定
          </NButton>
        </div>
        <div class="mt-1 text-12px opacity-70">
          清空选择并保存即解绑；若已填写与模板不兼容的自定义字段，服务端会返回冲突。
        </div>
        <NAlert v-if="message.binding" type="success" class="mt-2">{{ message.binding }}</NAlert>
        <NAlert v-if="failure.binding" type="error" class="mt-2">{{ failure.binding }}</NAlert>
      </NCard>

      <NCard title="设备编号" size="small">
        <div class="mb-2">当前编号：{{ currentNumber || '--' }}</div>
        <div class="flex flex-wrap items-center gap-3">
          <NInput v-model:value="newNumber" placeholder="新编号" style="width: 240px" :disabled="!!busy" />
          <NInput v-model:value="numberReason" placeholder="变更原因" style="width: 240px" :disabled="!!busy" />
          <NButton type="primary" :loading="busy === 'number'" :disabled="!!busy || loading" @click="saveNumber">
            变更编号
          </NButton>
        </div>
        <div class="mt-1 text-12px opacity-70">
          设备 ID 和历史数据保持不变；新编号在租户内必须唯一，占用时会被拒绝。
        </div>
        <NAlert v-if="message.number" type="success" class="mt-2">{{ message.number }}</NAlert>
        <NAlert v-if="failure.number" type="error" class="mt-2">{{ failure.number }}</NAlert>
      </NCard>

      <NCard title="删除设备" size="small">
        <NPopconfirm @positive-click="requestDelete">
          <template #trigger>
            <NButton type="error" :loading="busy === 'delete'" :disabled="!!busy || loading || deletePending">
              申请删除设备
            </NButton>
          </template>
          将提交删除申请并撤销凭据；仍有子设备时会被拒绝。设备在运行时完成清理前不会真正消失。
        </NPopconfirm>
        <NAlert v-if="message.delete" type="warning" class="mt-2">{{ message.delete }}</NAlert>
        <NAlert v-if="failure.delete" type="error" class="mt-2">{{ failure.delete }}</NAlert>
      </NCard>
    </div>
  </NSpin>
</template>
