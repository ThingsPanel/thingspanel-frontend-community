<script setup lang="ts">
import { administrativeStateLabel } from '@/utils/administrative-state'
import { onBeforeUnmount, ref, watch } from 'vue'
import { deviceNative, type Device } from '@/service/api/device-native'
import { deviceLifecycleNative, type DeviceOperation } from '@/service/api/device-lifecycle-native'
import {
  classifyWriteFailure,
  describeAccepted,
  freezeAttempt,
  newIdempotencyKey,
  type FrozenWriteAttempt
} from '@/service/api/device-write-attempt'

const props = defineProps<{ id: string }>()
const items = ref<Device[]>([])
const page = ref(1)
const pageSize = 20
const total = ref(0)
const search = ref('')
const loading = ref(false)
const error = ref('')
let generation = 0

async function load() {
  const current = ++generation
  loading.value = true
  error.value = ''
  try {
    const result = await deviceNative.listSubdevices(props.id, { page: page.value, pageSize, search: search.value })
    if (current !== generation) return
    items.value = result.items
    total.value = result.total
  } catch (e) {
    if (current !== generation) return
    items.value = []
    total.value = 0
    error.value = e instanceof Error ? e.message : '子设备读取失败'
  } finally {
    if (current === generation) loading.value = false
  }
}

function searchDevices() {
  page.value = 1
  void load()
}
function changePage(value: number) {
  page.value = value
  void load()
}

/* ---- bind / unbind (gateway-membership) ---- */
type Body = { gatewayId: string | null; subdeviceAddress: string | null }
const showBind = ref(false)
const candidateSearch = ref('')
const candidates = ref<Device[]>([])
const candidateLoading = ref(false)
const selectedId = ref('')
const address = ref('')
const writing = ref(false)
const writeMessage = ref('')
const writeError = ref('')
/** Frozen request kept only while its outcome is unknown. */
const pending = ref<{ deviceId: string; attempt: FrozenWriteAttempt<Body> } | null>(null)
const lastOperation = ref<DeviceOperation | null>(null)

async function loadCandidates() {
  candidateLoading.value = true
  try {
    const result = await deviceNative.list({
      page: 1,
      pageSize: 20,
      search: candidateSearch.value || undefined,
      gatewayScope: 'unbound'
    })
    candidates.value = result.items.filter(d => d.id !== props.id && d.deviceKind !== 'standalone' && !d.gatewayId)
  } catch (e) {
    candidates.value = []
    writeError.value = e instanceof Error ? e.message : '候选设备读取失败'
  } finally {
    candidateLoading.value = false
  }
}
function openBind() {
  showBind.value = true
  writeError.value = ''
  selectedId.value = ''
  address.value = ''
  void loadCandidates()
}

async function send(deviceId: string, attempt: FrozenWriteAttempt<Body>) {
  writing.value = true
  writeError.value = ''
  try {
    const accepted = await deviceLifecycleNative.setGatewayMembership(deviceId, attempt.body, attempt.etag, attempt.key)
    pending.value = null
    lastOperation.value = accepted.operation
    writeMessage.value = describeAccepted(accepted.operation.state)
    showBind.value = false
    await load()
  } catch (e) {
    const kind = classifyWriteFailure(e)
    if (kind === 'unknown') {
      // Outcome unknown: keep the frozen request; only it may be re-sent.
      pending.value = { deviceId, attempt }
      writeError.value = '请求结果未知（网络中断）。请点击"重试原请求"，不会重复提交不同内容。'
    } else {
      pending.value = null
      writeError.value =
        kind === 'stale' ? '设备关系已被他人修改，已刷新，请重新操作。' : e instanceof Error ? e.message : '操作失败'
      await load()
    }
  } finally {
    writing.value = false
  }
}

async function start(deviceId: string, body: Body) {
  if (writing.value) return
  writeMessage.value = ''
  writeError.value = ''
  try {
    const { etag } = await deviceLifecycleNative.readGatewayMembership(deviceId)
    await send(deviceId, freezeAttempt(deviceId, body, etag, newIdempotencyKey()))
  } catch (e) {
    writeError.value = e instanceof Error ? e.message : '读取设备关系失败'
  }
}

function submitBind() {
  const addr = address.value.trim()
  if (!selectedId.value) {
    writeError.value = '请选择要绑定的设备'
    return
  }
  if (!addr) {
    writeError.value = '请填写子设备地址'
    return
  }
  void start(selectedId.value, { gatewayId: props.id, subdeviceAddress: addr })
}
function unbind(item: Device) {
  void start(item.id, { gatewayId: null, subdeviceAddress: null })
}
function retryOriginal() {
  if (pending.value) void send(pending.value.deviceId, pending.value.attempt)
}

watch(
  () => props.id,
  () => {
    page.value = 1
    pending.value = null
    void load()
  },
  { immediate: true }
)
onBeforeUnmount(() => {
  generation++
})
</script>

<template>
  <div class="flex flex-col gap-4">
    <NAlert type="info" :show-icon="false">
      绑定/解绑提交后为"已受理"，需运行时应用后才真正生效；运行时应用回执尚未接入，状态可能长期停留在待应用。
    </NAlert>
    <div class="flex gap-2">
      <NInput v-model:value="search" placeholder="搜索名称或设备编号" @keyup.enter="searchDevices" />
      <NButton :loading="loading" @click="searchDevices">搜索</NButton>
      <NButton type="primary" @click="openBind">添加子设备</NButton>
    </div>
    <NAlert v-if="writeMessage" type="success">
      {{ writeMessage }}
      <span v-if="lastOperation">（操作 {{ lastOperation.id }}）</span>
    </NAlert>
    <NAlert v-if="writeError" type="error">
      {{ writeError }}
      <NButton v-if="pending" size="small" :loading="writing" class="ml-2" @click="retryOriginal">重试原请求</NButton>
    </NAlert>
    <NAlert v-if="error" type="error">{{ error }}</NAlert>
    <NSpin :show="loading">
      <NTable :bordered="false" :single-line="false">
        <thead>
          <tr>
            <th>设备名称</th>
            <th>设备编号</th>
            <th>设备类型</th>
            <th>管理状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in items" :key="item.id">
            <td>{{ item.name }}</td>
            <td>{{ item.deviceNumber }}</td>
            <td>{{ item.deviceKind }}</td>
            <td>{{ administrativeStateLabel(item.administrativeState) }}</td>
            <td>
              <NPopconfirm @positive-click="unbind(item)">
                <template #trigger>
                  <NButton size="small" :disabled="writing">解绑</NButton>
                </template>
                解绑后该设备成为独立设备，不会被删除。
              </NPopconfirm>
            </td>
          </tr>
          <tr v-if="!items.length && !error && !loading"><td colspan="5">暂无子设备</td></tr>
        </tbody>
      </NTable>
    </NSpin>
    <NPagination :page="page" :page-size="pageSize" :item-count="total" @update:page="changePage" />

    <NModal v-model:show="showBind" preset="card" title="添加子设备" style="width: 560px">
      <div class="flex flex-col gap-3">
        <div class="flex gap-2">
          <NInput v-model:value="candidateSearch" placeholder="搜索未绑定网关的设备" @keyup.enter="loadCandidates" />
          <NButton :loading="candidateLoading" @click="loadCandidates">搜索</NButton>
        </div>
        <NRadioGroup v-model:value="selectedId">
          <div class="flex max-h-60 flex-col gap-1 overflow-auto">
            <NRadio v-for="d in candidates" :key="d.id" :value="d.id">{{ d.name }}（{{ d.deviceNumber }}）</NRadio>
            <span v-if="!candidates.length && !candidateLoading">没有可绑定的设备</span>
          </div>
        </NRadioGroup>
        <NInput v-model:value="address" placeholder="子设备地址（同一网关内唯一）" />
        <NAlert v-if="writeError" type="error">{{ writeError }}</NAlert>
      </div>
      <template #footer>
        <NButton type="primary" :loading="writing" @click="submitBind">绑定</NButton>
      </template>
    </NModal>
  </div>
</template>
