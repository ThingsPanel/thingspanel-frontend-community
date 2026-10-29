<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { onBeforeRouteLeave, onBeforeRouteUpdate } from 'vue-router'
import { useMessage } from 'naive-ui'
import { useAuthStore } from '@/store/modules/auth'
import { deviceNative } from '@/service/api/device-native'
import { deviceRuntimeNative } from '@/service/api/device-runtime-native'
import type { ConnectionInfo } from '@/service/api/device-runtime-native-transport'
import { newIdempotencyKey } from '@/service/api/device-write-attempt'
import { DeviceCredentialNativeError, deviceCredentialsNative } from '@/service/api/device-credentials-native'
import type {
  CreateDeviceCredential,
  DeviceCredentialSecret,
  DeviceCredentialSummary
} from '@/service/api/device-credentials-native'
import {
  createNativeCredentialAndRefresh,
  createNativeCredentialAttempt,
  nativeCredentialIdentityParts,
  shouldRetainNativeCredentialAttempt
} from './native-device-credentials-flow'

const props = defineProps<{ id: string }>()
const message = useMessage()
const authStore = useAuthStore()
const pageSize = 20
const summaries = ref<DeviceCredentialSummary[]>([])
const total = ref(0)
const page = ref(1)
const listLoading = ref(false)
const listError = ref('')
const createError = ref('')
const creating = ref(false)
const createAttempt = ref<ReturnType<typeof createNativeCredentialAttempt> | null>(null)
const createdResult = ref<{ credential: DeviceCredentialSecret; location: string; requestId: string } | null>(null)
const showCreatedResult = ref(false)
const credentialKind = ref<CreateDeviceCredential['kind']>('token')
const credentialSource = ref<'generate' | 'import'>('generate')
const publicIdentifier = ref('')
const importedSecret = ref('')
const certificatePem = ref('')
let listRequestGeneration = 0
let credentialSessionGeneration = 0

const hasPendingWrite = computed(() => Boolean(createAttempt.value))
const pageCount = computed(() => Math.max(1, Math.ceil(total.value / pageSize)))
const createButtonLabel = computed(() => (createAttempt.value ? '重试同一请求' : '创建凭据'))

function blockPendingNavigation() {
  if (createAttempt.value) {
    message.warning('当前凭据创建结果尚未确认，请先用原请求重试后再离开。')
    return true
  }
  if (createdResult.value?.credential.secret) {
    message.warning('请先查看或清除这次仅显示一次的凭据内容，再离开页面。')
    return true
  }
  return false
}

onBeforeRouteLeave(() => !blockPendingNavigation())
onBeforeRouteUpdate((to, from) => {
  const nextDeviceId = String(to.query.d_id ?? '')
  const currentDeviceId = String(from.query.d_id ?? '')
  if (nextDeviceId !== currentDeviceId) return !blockPendingNavigation()
  return true
})

async function loadCredentialPage(deviceId: string, requestedPage = page.value): Promise<void> {
  const requestGeneration = ++listRequestGeneration
  listLoading.value = true
  listError.value = ''
  try {
    const result = await deviceCredentialsNative.list(deviceId, { page: requestedPage, pageSize })
    if (requestGeneration !== listRequestGeneration || deviceId !== props.id) return
    summaries.value = result.items
    total.value = result.total
    page.value = result.page
  } catch {
    if (requestGeneration !== listRequestGeneration || deviceId !== props.id) return
    listError.value = '凭据摘要暂时无法读取。创建结果仍会单独显示。'
    throw new Error('credential summary read failed')
  } finally {
    if (requestGeneration === listRequestGeneration) listLoading.value = false
  }
}

watch(
  () => props.id,
  deviceId => {
    credentialSessionGeneration += 1
    listRequestGeneration += 1
    resetCreateForm()
    createdResult.value = null
    showCreatedResult.value = false
    createError.value = ''
    listError.value = ''
    if (createAttempt.value && createAttempt.value.deviceId !== deviceId) {
      listError.value = `设备切换前仍有未确认的凭据请求，所属设备 ID：${createAttempt.value.deviceId}。请先重试原请求。`
      return
    }
    summaries.value = []
    total.value = 0
    page.value = 1
    void loadCredentialPage(deviceId, 1).catch(() => undefined)
  },
  { immediate: true }
)

watch(credentialKind, kind => {
  credentialSource.value = kind === 'x509' ? 'import' : 'generate'
  importedSecret.value = ''
  certificatePem.value = ''
})

// Logout and account changes must clear one-time material before navigation
// guards run. Late requests from the previous identity cannot repopulate it.
watch(
  [
    () => Boolean(authStore.token),
    () => nativeCredentialIdentityParts(authStore.userInfo).subjectId,
    () => nativeCredentialIdentityParts(authStore.userInfo).tenantId
  ],
  () => {
    credentialSessionGeneration += 1
    listRequestGeneration += 1
    createdResult.value = null
    showCreatedResult.value = false
    createAttempt.value = null
    creating.value = false
    listLoading.value = false
    summaries.value = []
    total.value = 0
    page.value = 1
    listError.value = ''
    resetCreateForm()
    if (authStore.token && props.id) void loadCredentialPage(props.id, 1).catch(() => undefined)
  },
  { flush: 'sync' }
)

function buildPayload(): CreateDeviceCredential | null {
  const identifier = publicIdentifier.value.trim()
  if (credentialKind.value === 'x509') {
    const certificate = certificatePem.value
    if (!certificate.includes('-----BEGIN CERTIFICATE-----') || !certificate.includes('-----END CERTIFICATE-----')) {
      createError.value = '请粘贴完整的公开 X.509 证书 PEM。'
      return null
    }
    if (certificate.toUpperCase().includes('PRIVATE KEY')) {
      createError.value = '不能提交私钥，只能提交公开证书。'
      return null
    }
    return {
      kind: 'x509',
      ...(identifier ? { publicIdentifier: identifier } : {}),
      certificatePem: certificate
    }
  }

  if (credentialSource.value === 'import' && !importedSecret.value) {
    createError.value = '请输入要导入的凭据。'
    return null
  }
  return {
    kind: credentialKind.value,
    ...(identifier ? { publicIdentifier: identifier } : {}),
    ...(credentialSource.value === 'import' ? { secret: importedSecret.value } : {})
  }
}

function resetCreateForm() {
  credentialKind.value = 'token'
  credentialSource.value = 'generate'
  publicIdentifier.value = ''
  importedSecret.value = ''
  certificatePem.value = ''
  createError.value = ''
}

async function submitCreate() {
  if (creating.value || !props.id) return
  createError.value = ''
  if (!createAttempt.value) {
    const payload = buildPayload()
    if (!payload) return
    if (!globalThis.crypto?.randomUUID) {
      createError.value = '当前环境无法安全提交凭据创建请求。'
      return
    }
    createAttempt.value = createNativeCredentialAttempt(props.id, payload, globalThis.crypto.randomUUID())
  }
  const attempt = createAttempt.value
  if (!attempt) return
  if (attempt.deviceId !== props.id) {
    createError.value = `该请求属于设备 ${attempt.deviceId}，请先重试原请求。`
    return
  }

  creating.value = true
  const sessionGeneration = credentialSessionGeneration
  const isCurrentSession = () => sessionGeneration === credentialSessionGeneration && attempt.deviceId === props.id
  try {
    const completion = await createNativeCredentialAndRefresh(
      attempt,
      (deviceId, payload, key) => deviceCredentialsNative.create(deviceId, payload, key),
      result => {
        createdResult.value = result
        showCreatedResult.value = true
        createAttempt.value = null
        resetCreateForm()
      },
      async deviceId => {
        await loadCredentialPage(deviceId, page.value)
      },
      isCurrentSession
    )
    if (completion.stale) return
    if (completion.refreshFailed) {
      listError.value = '凭据已创建，摘要列表刷新失败；不会重复提交创建请求。'
    }
  } catch (error) {
    if (!isCurrentSession()) return
    const status = error instanceof DeviceCredentialNativeError ? error.status : undefined
    const unknown = error instanceof DeviceCredentialNativeError && error.outcomeUnknown
    const retain = shouldRetainNativeCredentialAttempt(status, unknown, attempt.previouslyUnknown)
    if (retain) {
      attempt.previouslyUnknown = attempt.previouslyUnknown || unknown
      createAttempt.value = attempt
      createError.value = attempt.previouslyUnknown
        ? '创建结果尚未确认。请保持当前内容并用同一请求重试。'
        : status
          ? `凭据请求未完成（HTTP ${status}）。原请求已保留，请稍后用同一请求重试。`
          : '凭据请求未完成。原请求已保留，请稍后用同一请求重试。'
    } else {
      createAttempt.value = null
      createError.value = '字段校验未通过，请修改内容后重试。'
    }
  } finally {
    if (isCurrentSession()) creating.value = false
  }
}

async function changePage(nextPage: number) {
  if (nextPage < 1 || nextPage > pageCount.value || nextPage === page.value || listLoading.value) return
  await loadCredentialPage(props.id, nextPage).catch(() => undefined)
}

// 轮换/撤销：结果未知（无 HTTP 状态）后重试同一动作，沿用同一幂等键；有明确答复后换新键。
const changingCredentialId = ref('')
let changeAttempt: { fingerprint: string; key: string } | null = null

async function changeCredential(
  credential: DeviceCredentialSummary,
  action: 'rotate' | 'revoke',
  replacement?: DeviceCredentialSummary
) {
  if (changingCredentialId.value) return
  changingCredentialId.value = credential.id
  const deviceId = props.id
  try {
    // 版本取自操作发起前一刻的设备读取；设备已变化时服务端返回 412/409，不覆盖。
    const { device } = await deviceNative.get(deviceId)
    const version = Number(device.resourceVersion)
    const reason = '用户在设备详情页撤销'
    const fingerprint = JSON.stringify([deviceId, credential.id, action, replacement?.id ?? null, version])
    const key = changeAttempt?.fingerprint === fingerprint ? changeAttempt.key : newIdempotencyKey()
    changeAttempt = { fingerprint, key }
    const accepted =
      action === 'revoke'
        ? await deviceCredentialsNative.revoke(deviceId, credential.id, { expectedDeviceVersion: version, reason }, key)
        : await deviceCredentialsNative.rotate(
            deviceId,
            credential.id,
            { replacementCredentialId: replacement!.id, overlapSeconds: 0, expectedDeviceVersion: version },
            key
          )
    changeAttempt = null
    message.success(
      `${action === 'revoke' ? '撤销' : '轮换'}已提交（操作 ${accepted.operationId}，状态 ${accepted.state}）。设备侧是否已应用以操作状态为准。`
    )
  } catch (error) {
    if (typeof (error as { status?: unknown }).status === 'number' && (error as { status: number }).status > 0)
      changeAttempt = null
    message.error(error instanceof Error ? error.message : '凭据变更失败')
  } finally {
    changingCredentialId.value = ''
  }
  if (deviceId === props.id) await loadCredentialPage(deviceId, page.value).catch(() => undefined)
}

const connectionInfo = ref<ConnectionInfo | null>(null)
const connectionInfoError = ref('')
async function loadConnectionInfo(deviceId: string) {
  connectionInfo.value = null
  connectionInfoError.value = ''
  try {
    const info = await deviceRuntimeNative.readConnectionInfo(deviceId)
    if (deviceId === props.id) connectionInfo.value = info
  } catch (error) {
    if (deviceId === props.id) {
      const message = error instanceof Error ? error.message : ''
      // 未绑定模板的设备没有接入配置，后端返回英文原文；这是预期状态，不是读取失败。
      connectionInfoError.value =
        message === 'device access is not configured'
          ? '该设备尚未配置接入信息（需先绑定设备模板）'
          : message || '接入信息读取失败'
    }
  }
}
watch(
  () => props.id,
  id => void loadConnectionInfo(id),
  { immediate: true }
)

const pendingReplacement = computed(() => summaries.value.find(item => item.status === 'pending'))

function clearCreatedResult() {
  createdResult.value = null
  showCreatedResult.value = false
}

onBeforeUnmount(() => {
  // Secret response is intentionally held only by this component's memory.
  credentialSessionGeneration += 1
  listRequestGeneration += 1
  createdResult.value = null
  showCreatedResult.value = false
  createAttempt.value = null
  importedSecret.value = ''
  certificatePem.value = ''
})
</script>

<template>
  <div class="native-device-credentials">
    <n-alert type="warning" :show-icon="false" class="mb-4">
      此面板仅管理凭据。连接信息、插件配置和设备激活仍未接入；创建凭据不会激活设备。
    </n-alert>

    <n-alert v-if="createAttempt" type="warning" :show-icon="false" class="mb-4">
      设备 {{ createAttempt.deviceId }} 的凭据创建结果尚未确认。输入已冻结，将使用同一请求编号重试。
    </n-alert>
    <n-alert v-if="listError" type="error" :show-icon="false" class="mb-4">
      {{ listError }}
      <n-button
        text
        size="small"
        :disabled="listLoading"
        @click="loadCredentialPage(props.id, page).catch(() => undefined)"
      >
        重试读取
      </n-button>
    </n-alert>
    <n-alert v-if="createError" type="error" :show-icon="false" class="mb-4">{{ createError }}</n-alert>

    <n-card title="创建凭据" :bordered="false" class="mb-4">
      <n-form>
        <n-form-item label="凭据类型">
          <n-select
            v-model:value="credentialKind"
            :disabled="hasPendingWrite || creating"
            :options="[
              { label: '访问令牌', value: 'token' },
              { label: '用户名和密码', value: 'username_password' },
              { label: 'X.509 公开证书', value: 'x509' }
            ]"
          />
        </n-form-item>
        <n-form-item :label="credentialKind === 'username_password' ? '用户名（可选）' : '公开标识（可选）'">
          <n-input v-model:value="publicIdentifier" :disabled="hasPendingWrite || creating" />
        </n-form-item>
        <n-form-item v-if="credentialKind !== 'x509'" label="凭据来源">
          <n-radio-group v-model:value="credentialSource" :disabled="hasPendingWrite || creating">
            <n-radio value="generate">由系统生成（默认）</n-radio>
            <n-radio value="import">导入已有凭据</n-radio>
          </n-radio-group>
        </n-form-item>
        <n-form-item v-if="credentialKind !== 'x509' && credentialSource === 'import'" label="凭据内容">
          <n-input
            v-model:value="importedSecret"
            type="password"
            show-password-on="click"
            :disabled="hasPendingWrite || creating"
          />
        </n-form-item>
        <n-form-item v-if="credentialKind === 'x509'" label="公开证书 PEM">
          <n-input
            v-model:value="certificatePem"
            type="textarea"
            :autosize="{ minRows: 4, maxRows: 10 }"
            placeholder="-----BEGIN CERTIFICATE-----"
            :disabled="hasPendingWrite || creating"
          />
        </n-form-item>
        <p v-if="credentialKind === 'x509'" class="native-device-credentials__hint">
          只提交公开证书，不能粘贴或上传私钥。
        </p>
        <div class="flex justify-end">
          <n-button type="primary" :loading="creating" :disabled="creating" @click="submitCreate">
            {{ createButtonLabel }}
          </n-button>
        </div>
      </n-form>
    </n-card>

    <n-card title="接入信息" :bordered="false">
      <n-alert v-if="connectionInfoError" type="warning" :show-icon="false">{{ connectionInfoError }}</n-alert>
      <n-descriptions v-else-if="connectionInfo" bordered :column="1" size="small">
        <n-descriptions-item label="协议">{{ connectionInfo.protocol }}</n-descriptions-item>
        <n-descriptions-item label="接入地址">
          {{ connectionInfo.endpoint || '未配置（由部署方提供）' }}
        </n-descriptions-item>
        <n-descriptions-item label="客户端标识">{{ connectionInfo.clientIdentifier || '--' }}</n-descriptions-item>
        <n-descriptions-item label="所属网关">{{ connectionInfo.gatewayId || '--' }}</n-descriptions-item>
      </n-descriptions>
      <n-empty v-else description="暂无接入信息" />
    </n-card>

    <n-card title="凭据摘要" :bordered="false">
      <n-spin :show="listLoading">
        <n-list v-if="summaries.length" bordered>
          <n-list-item v-for="credential in summaries" :key="credential.id">
            <div class="native-device-credentials__row">
              <div>
                <strong>{{ credential.publicIdentifier || credential.kind }}</strong>
                <div class="native-device-credentials__hint">{{ credential.kind }} · {{ credential.createdAt }}</div>
                <div v-if="credential.secret" class="native-device-credentials__secret">{{ credential.secret }}</div>
              </div>
              <n-tag
                :type="
                  credential.status === 'active' ? 'success' : credential.status === 'revoked' ? 'default' : 'warning'
                "
              >
                {{ credential.status === 'active' ? '已生效' : credential.status === 'revoked' ? '已撤销' : '待生效' }}
              </n-tag>
              <n-space v-if="credential.status !== 'revoked'" :size="8">
                <n-popconfirm
                  v-if="credential.status === 'active'"
                  @positive-click="pendingReplacement && changeCredential(credential, 'rotate', pendingReplacement)"
                >
                  <template #trigger>
                    <n-button size="small" :disabled="Boolean(changingCredentialId) || hasPendingWrite">轮换</n-button>
                  </template>
                  {{
                    pendingReplacement
                      ? `用待生效凭据 ${pendingReplacement.publicIdentifier || pendingReplacement.id} 替换此凭据？`
                      : '请先在上方创建一个新凭据（待生效），再来轮换。'
                  }}
                </n-popconfirm>
                <n-popconfirm @positive-click="changeCredential(credential, 'revoke')">
                  <template #trigger>
                    <n-button size="small" type="error" :disabled="Boolean(changingCredentialId) || hasPendingWrite">
                      撤销
                    </n-button>
                  </template>
                  撤销后不可恢复，设备将无法再用此凭据接入。确认撤销？
                </n-popconfirm>
              </n-space>
            </div>
          </n-list-item>
        </n-list>
        <n-empty v-else-if="!listError" description="暂无凭据摘要" />
      </n-spin>
      <div v-if="pageCount > 1" class="mt-4 flex items-center justify-end gap-2">
        <n-button size="small" :disabled="page <= 1 || listLoading" @click="changePage(page - 1)">上一页</n-button>
        <span>{{ page }} / {{ pageCount }}</span>
        <n-button size="small" :disabled="page >= pageCount || listLoading" @click="changePage(page + 1)">
          下一页
        </n-button>
      </div>
    </n-card>

    <n-modal v-model:show="showCreatedResult" :mask-closable="false" :closable="false" :close-on-esc="false">
      <n-card title="凭据创建结果" class="max-w-640px">
        <n-alert type="warning" :show-icon="false" class="mb-3">
          新凭据需完成接入配置才能生效；创建操作不会激活设备，也不代表设备已接入。
        </n-alert>
        <n-descriptions bordered :column="1" size="small">
          <n-descriptions-item label="凭据 ID">{{ createdResult?.credential.credential.id }}</n-descriptions-item>
          <n-descriptions-item label="类型">{{ createdResult?.credential.credential.kind }}</n-descriptions-item>
          <n-descriptions-item label="状态">{{ createdResult?.credential.credential.status }}</n-descriptions-item>
          <n-descriptions-item label="本次领取窗口截止">{{ createdResult?.credential.expiresAt }}</n-descriptions-item>
        </n-descriptions>
        <div v-if="createdResult?.credential.secret" class="native-device-credentials__secret">
          {{ createdResult.credential.secret }}
        </div>
        <p v-else class="native-device-credentials__hint mt-3">此凭据类型不返回秘密内容；公开证书不会包含私钥。</p>
        <p v-if="createdResult?.credential.secret" class="native-device-credentials__hint mt-3">
          请保存本次凭据内容。领取窗口截止时间不是凭据的到期时间。
        </p>
        <div class="mt-4 flex justify-end">
          <n-button type="primary" @click="clearCreatedResult">清除并关闭</n-button>
        </div>
      </n-card>
    </n-modal>
  </div>
</template>

<style scoped>
.native-device-credentials__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.native-device-credentials__hint {
  color: #666;
  font-size: 12px;
}

.native-device-credentials__secret {
  margin-top: 12px;
  padding: 12px;
  border-radius: 6px;
  background: #f5f7fa;
  overflow-wrap: anywhere;
  user-select: all;
}
</style>
