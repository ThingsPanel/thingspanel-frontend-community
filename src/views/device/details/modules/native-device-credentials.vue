<script setup lang="ts">
import { connectionTopicRows, connectionTopicReason } from './connection-topics'
import { v4 as uuidv4 } from 'uuid'
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { onBeforeRouteLeave, onBeforeRouteUpdate } from 'vue-router'
import { useMessage } from 'naive-ui'
import MqttLoginFields from '@/views/device/shared/mqtt-login-fields.vue'
import { useAuthStore } from '@/store/modules/auth'
import { $t } from '@/locales'
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
const emit = defineEmits<{ credentialActivated: [deviceId: string] }>()
const message = useMessage()
const authStore = useAuthStore()
const pageSize = 20
const summaries = ref<DeviceCredentialSummary[]>([])
const importedAccess = ref(false)
const connectionLoading = ref(true)
const connectionInfo = ref<ConnectionInfo | null>(null)
const total = ref(0)
const page = ref(1)
const listLoading = ref(false)
const activationPolling = ref(false)
const listError = ref('')
const createError = ref('')
const showCredentialForm = ref(false)
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
const currentLogin = computed(() => summaries.value.find(item => item.status === 'active'))
const hasCurrentLogin = computed(() => Boolean(currentLogin.value))
const awaitingFirstActivation = computed(
  () =>
    page.value === 1 &&
    !hasCurrentLogin.value &&
    summaries.value.some(item => item.status === 'pending' && item.kind !== 'x509') &&
    connectionInfo.value?.protocol.toLowerCase() === 'mqtt' &&
    !importedAccess.value
)
const createButtonLabel = computed(() => {
  if (createAttempt.value) return '重试保存'
  const isCustom = credentialKind.value === 'x509' || credentialSource.value === 'import'
  if (hasCurrentLogin.value) return isCustom ? '保存新登录信息' : '生成新登录信息'
  return isCustom ? '保存登录信息' : '生成登录信息'
})
const loginMethodLabels = {
  token: '仅用户名',
  username_password: '用户名和密码',
  x509: 'X.509 证书'
} satisfies Record<CreateDeviceCredential['kind'], string>

function blockPendingNavigation() {
  if (createAttempt.value) {
    message.warning('当前凭据创建结果尚未确认，请先用原请求重试后再离开。')
    return true
  }
  if (createdResult.value?.credential.secret) {
    message.warning('请先关闭登录信息的提示，再离开页面。')
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

async function loadCredentialPage(deviceId: string, requestedPage = page.value, background = false): Promise<void> {
  if (importedAccess.value) return
  const wasAwaitingActivation =
    awaitingFirstActivation.value ||
    (!hasCurrentLogin.value &&
      createdResult.value?.credential.credential.status === 'pending' &&
      createdResult.value.credential.credential.kind !== 'x509')
  const requestGeneration = ++listRequestGeneration
  if (!background) {
    listLoading.value = true
    listError.value = ''
  }
  try {
    const result = await deviceCredentialsNative.list(deviceId, { page: requestedPage, pageSize })
    if (requestGeneration !== listRequestGeneration || deviceId !== props.id) return
    summaries.value = result.items
    total.value = result.total
    page.value = result.page
    listError.value = ''
    if (
      requestedPage === 1 &&
      wasAwaitingActivation &&
      result.items.some(item => item.status === 'active' && item.kind !== 'x509')
    ) {
      void loadConnectionInfo(deviceId, true)
      emit('credentialActivated', deviceId)
    }
  } catch {
    if (requestGeneration !== listRequestGeneration || deviceId !== props.id) return
    if (background) return
    listError.value = '凭据摘要暂时无法读取。创建结果仍会单独显示。'
    throw new Error('credential summary read failed')
  } finally {
    if (!background && requestGeneration === listRequestGeneration) listLoading.value = false
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
    importedAccess.value = false
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

  if (credentialKind.value === 'username_password' && credentialSource.value === 'import' && !identifier) {
    createError.value = '请输入现有的 MQTT 用户名。'
    return null
  }
  if (credentialSource.value === 'import' && !importedSecret.value) {
    createError.value = credentialKind.value === 'token' ? '请输入 MQTT 用户名。' : '请输入 MQTT 密码。'
    return null
  }
  return {
    kind: credentialKind.value,
    ...(credentialKind.value === 'username_password' && identifier ? { publicIdentifier: identifier } : {}),
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
    if (!globalThis.crypto?.getRandomValues) {
      createError.value = '当前环境无法安全提交凭据创建请求。'
      return
    }
    createAttempt.value = createNativeCredentialAttempt(
      props.id,
      payload,
      uuidv4({ random: globalThis.crypto.getRandomValues(new Uint8Array(16)) })
    )
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
        showCredentialForm.value = false
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
    if (action === 'revoke') {
      await deviceCredentialsNative.revoke(deviceId, credential.id, { expectedDeviceVersion: version, reason }, key)
    } else {
      await deviceCredentialsNative.rotate(
        deviceId,
        credential.id,
        { replacementCredentialId: replacement!.id, overlapSeconds: 0, expectedDeviceVersion: version },
        key
      )
    }
    changeAttempt = null
    message.success(action === 'revoke' ? '已提交撤销，等待设备平台确认。' : '已提交更换，等待设备平台确认。')
  } catch (error) {
    if (typeof (error as { status?: unknown }).status === 'number' && (error as { status: number }).status > 0)
      changeAttempt = null
    message.error(error instanceof Error ? error.message : '凭据变更失败')
  } finally {
    changingCredentialId.value = ''
  }
  if (deviceId === props.id) await loadCredentialPage(deviceId, page.value).catch(() => undefined)
}

const connectionInfoError = ref('')
const topicRows = computed(() => connectionTopicRows(connectionInfo.value))
let connectionRequestGeneration = 0
async function loadConnectionInfo(deviceId: string, background = false) {
  const requestGeneration = ++connectionRequestGeneration
  const sessionGeneration = credentialSessionGeneration
  const isCurrent = () =>
    requestGeneration === connectionRequestGeneration &&
    sessionGeneration === credentialSessionGeneration &&
    deviceId === props.id
  if (!background) {
    connectionLoading.value = true
    connectionInfo.value = null
    connectionInfoError.value = ''
  }
  try {
    const info = await deviceRuntimeNative.readConnectionInfo(deviceId)
    if (isCurrent()) {
      connectionInfo.value = info
      importedAccess.value = Boolean(info.importedAccess)
      connectionInfoError.value = ''
    }
  } catch (error) {
    if (isCurrent() && !background) {
      const message = error instanceof Error ? error.message : ''
      // 未绑定模板的设备没有接入配置，后端返回英文原文；这是预期状态，不是读取失败。
      connectionInfoError.value =
        message === 'device access is not configured'
          ? '尚未设置接入方式。可以在「设置」中绑定模板以查看连接参数。'
          : message || '接入信息读取失败'
    }
  } finally {
    if (isCurrent()) connectionLoading.value = false
  }
}
watch(
  () => props.id,
  id =>
    void loadConnectionInfo(id).then(() => {
      if (id === props.id && !importedAccess.value) return loadCredentialPage(id, 1).catch(() => undefined)
    }),
  { immediate: true }
)

watch(
  [() => props.id, awaitingFirstActivation, () => Boolean(authStore.token)],
  ([deviceId, pending, authenticated], _, onCleanup) => {
    if (!pending || !authenticated) return
    const deadline = Date.now() + 75_000
    const sessionGeneration = credentialSessionGeneration
    let timer: ReturnType<typeof setTimeout>
    let stopped = false
    activationPolling.value = true
    onCleanup(() => {
      stopped = true
      clearTimeout(timer)
      activationPolling.value = false
    })
    async function poll() {
      if (stopped || sessionGeneration !== credentialSessionGeneration || !awaitingFirstActivation.value) return
      if (!listLoading.value && !creating.value) await loadCredentialPage(deviceId, 1, true)
      if (stopped || !awaitingFirstActivation.value) return
      if (Date.now() < deadline) timer = setTimeout(poll, 1500)
      else activationPolling.value = false
    }
    timer = setTimeout(poll, 1500)
  }
)

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
    <n-alert v-if="importedAccess" type="info" :show-icon="false" class="mb-4">
      该设备沿用源系统的接入配置和登录信息。请在源系统中管理。
    </n-alert>

    <n-alert v-if="createAttempt" type="warning" :show-icon="false" class="mb-4">
      登录信息保存结果还未确认，请在这里重试。
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

    <n-card title="连接参数" :bordered="false">
      <n-alert v-if="connectionInfoError" type="warning" :show-icon="false">{{ connectionInfoError }}</n-alert>
      <n-descriptions v-else-if="connectionInfo" bordered :column="1" size="small">
        <n-descriptions-item label="协议">{{ connectionInfo.protocol }}</n-descriptions-item>
        <n-descriptions-item label="服务器地址">
          {{ connectionInfo.endpoint || (importedAccess ? '由源系统管理，暂未提供地址' : '未配置（由部署方提供）') }}
        </n-descriptions-item>
        <n-descriptions-item v-if="connectionInfo.clientIdentifier" label="客户端 ID">
          {{ connectionInfo.clientIdentifier }}
        </n-descriptions-item>
        <n-descriptions-item v-if="connectionInfo.gatewayId" label="所属网关">
          {{ connectionInfo.gatewayId }}
        </n-descriptions-item>
        <n-descriptions-item :label="$t('custom.connectionTopics.title')">
          <div v-if="topicRows.length" class="connection-topics">
            <div v-for="item in topicRows" :key="item.direction + item.topic" class="connection-topics__item">
              <span>
                {{ $t('custom.connectionTopics.' + item.direction) }} ·
                {{ $t('custom.connectionTopics.' + item.purpose) }}
              </span>
              <code>{{ item.topic }}</code>
            </div>
            <p v-if="topicRows.some(item => item.topic.includes('{message_id}'))">
              {{ $t('custom.connectionTopics.messageId') }}
            </p>
          </div>
          <span v-else>{{ $t(connectionTopicReason(connectionInfo)) }}</span>
        </n-descriptions-item>
      </n-descriptions>
      <n-empty v-else description="暂无接入信息" />
    </n-card>

    <n-card v-if="!importedAccess && !connectionLoading" title="设备登录信息" :bordered="false">
      <template #header-extra>
        <n-button
          text
          size="small"
          class="mr-3"
          :loading="listLoading"
          @click="loadCredentialPage(props.id, page).catch(() => undefined)"
        >
          刷新状态
        </n-button>
        <n-button v-if="!showCredentialForm" size="small" @click="showCredentialForm = true">
          {{ hasCurrentLogin ? '更换登录信息' : '设置登录信息' }}
        </n-button>
        <n-button v-else size="small" :disabled="creating || hasPendingWrite" @click="showCredentialForm = false">
          收起表单
        </n-button>
      </template>
      <n-alert v-if="activationPolling" type="info" class="mb-3">
        正在激活设备凭据，确认后会自动更新状态和连接参数。
      </n-alert>
      <n-spin :show="listLoading">
        <n-list v-if="summaries.length" bordered>
          <n-list-item v-for="credential in summaries" :key="credential.id">
            <div class="native-device-credentials__row">
              <div>
                <strong>{{ loginMethodLabels[credential.kind] }}</strong>
                <MqttLoginFields
                  v-if="credential.status !== 'revoked'"
                  :kind="credential.kind"
                  :public-identifier="credential.publicIdentifier"
                  :secret="credential.secret"
                />
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
                  v-if="credential.status === 'pending' && currentLogin && credential.kind !== 'x509'"
                  @positive-click="currentLogin && changeCredential(currentLogin, 'rotate', credential)"
                >
                  <template #trigger>
                    <n-button size="small" :disabled="Boolean(changingCredentialId) || hasPendingWrite">
                      启用新登录信息
                    </n-button>
                  </template>
                  新登录信息生效后，当前用户名和密码将立即失效。确认更换？
                </n-popconfirm>
                <n-popconfirm @positive-click="changeCredential(credential, 'revoke')">
                  <template #trigger>
                    <n-button size="small" type="error" :disabled="Boolean(changingCredentialId) || hasPendingWrite">
                      撤销
                    </n-button>
                  </template>
                  撤销后，设备将无法再用这组登录信息连接。确认撤销？
                </n-popconfirm>
              </n-space>
            </div>
          </n-list-item>
        </n-list>
        <n-empty v-else-if="!listError" description="还没有设置设备登录信息" />
      </n-spin>
      <div v-if="pageCount > 1" class="mt-4 flex items-center justify-end gap-2">
        <n-button size="small" :disabled="page <= 1 || listLoading" @click="changePage(page - 1)">上一页</n-button>
        <span>{{ page }} / {{ pageCount }}</span>
        <n-button size="small" :disabled="page >= pageCount || listLoading" @click="changePage(page + 1)">
          下一页
        </n-button>
      </div>
    </n-card>

    <n-card
      v-if="!importedAccess && !connectionLoading && (showCredentialForm || createAttempt)"
      :bordered="false"
      class="mb-4"
    >
      <p v-if="hasCurrentLogin" class="mb-3">先准备新的登录信息，再点「启用新登录信息」完成更换。</p>
      <n-form>
        <n-form-item label="登录方式">
          <n-select
            v-model:value="credentialKind"
            :disabled="hasPendingWrite || creating"
            :options="[
              { label: '仅用户名（密码留空）', value: 'token' },
              { label: '用户名和密码', value: 'username_password' },
              { label: 'X.509 证书', value: 'x509' }
            ]"
          />
        </n-form-item>
        <n-form-item v-if="credentialKind !== 'x509'" label="填写方式">
          <n-radio-group v-model:value="credentialSource" :disabled="hasPendingWrite || creating">
            <n-radio value="generate">自动生成</n-radio>
            <n-radio value="import">使用已有登录信息</n-radio>
          </n-radio-group>
        </n-form-item>
        <n-form-item
          v-if="credentialKind === 'username_password'"
          :label="credentialSource === 'generate' ? '用户名（留空则自动生成）' : '用户名'"
        >
          <n-input v-model:value="publicIdentifier" autocomplete="off" :disabled="hasPendingWrite || creating" />
        </n-form-item>
        <n-form-item
          v-if="credentialKind !== 'x509' && credentialSource === 'import'"
          :label="credentialKind === 'token' ? '用户名' : '密码'"
        >
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

    <n-modal v-model:show="showCreatedResult" :mask-closable="false" :closable="false" :close-on-esc="false">
      <n-card v-if="createdResult" title="登录信息已保存" class="max-w-640px">
        <n-alert v-if="createdResult.credential.credential.kind === 'x509'" type="info" class="mb-3">
          公开证书已保存。设备连接时请使用设备上的证书和私钥。
        </n-alert>
        <template v-else>
          <n-alert type="info" class="mb-3">
            {{
              currentLogin && currentLogin.id !== createdResult.credential.credential.id
                ? '请回到列表点「启用新登录信息」，完成更换。'
                : '设备平台确认下发后，这组登录信息才可用于连接。'
            }}
          </n-alert>
          <MqttLoginFields
            :kind="createdResult.credential.credential.kind"
            :public-identifier="createdResult.credential.credential.publicIdentifier"
            :secret="createdResult.credential.secret"
          />
        </template>
        <div class="mt-4 flex justify-end">
          <n-button type="primary" @click="clearCreatedResult">完成</n-button>
        </div>
      </n-card>
    </n-modal>
  </div>
</template>

<style scoped>
.connection-topics__item {
  display: grid;
  gap: 4px;
  margin-bottom: 12px;
}
.connection-topics code {
  overflow-wrap: anywhere;
  white-space: pre-wrap;
  user-select: all;
}
.connection-topics p {
  margin: 0;
  font-size: 12px;
  color: #666;
}

.native-device-credentials__row {
  display: flex;
  align-items: flex-start;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 12px;
}

.native-device-credentials__hint {
  color: #666;
  font-size: 12px;
}
</style>
