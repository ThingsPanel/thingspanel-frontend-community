<script setup lang="tsx">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { DataTableColumns } from 'naive-ui'
import { NButton } from 'naive-ui'
import { useAuthStore } from '@/store/modules/auth'
import {
  getNotificationUiCapabilities,
  invalidateNotificationSession,
  NotificationClientError,
  notificationV2,
  registerNotificationSessionCleanup,
  type NotificationPlugin
} from '@/service/api/notification-v2'
import type * as NotificationV2 from '@/service/api/notification-v2.types'

const auth = useAuthStore()
const { locale } = useI18n()
const tx = (zh: string, en: string) => (locale.value.toLowerCase().startsWith('zh') ? zh : en)
const capabilities = computed(() => getNotificationUiCapabilities())
const rows = ref<NotificationPlugin[]>([])
const loading = ref(false)
const modal = ref(false)
const reading = ref(false)
const saving = ref(false)
const errorText = ref('')
const successText = ref('')
const manifest = ref<NotificationPlugin['manifest'] | null>(null)
const manifestDigest = ref('')
const registrationKey = ref('')
const registrationBody = ref<NotificationV2.PluginRegistration | null>(null)
const form = reactive({ origin: '', authSecret: '' })
const viewGeneration = ref(0)

function clearDraft() {
  form.origin = ''
  form.authSecret = ''
  manifest.value = null
  manifestDigest.value = ''
  registrationKey.value = ''
  registrationBody.value = null
  errorText.value = ''
  successText.value = ''
  modal.value = false
}

const unregisterCleanup = registerNotificationSessionCleanup(() => {
  rows.value = []
  clearDraft()
  viewGeneration.value += 1
})

watch(
  () => [auth.token, auth.userInfo.tenant_id, auth.userInfo.id, auth.userInfo.userId],
  () => invalidateNotificationSession()
)
watch(
  () => [form.origin, form.authSecret],
  (next, previous) => {
    if (manifest.value && !registrationKey.value && (next[0] !== previous[0] || next[1] !== previous[1])) {
      manifest.value = null
      manifestDigest.value = ''
      successText.value = ''
    }
  }
)
onBeforeUnmount(unregisterCleanup)

async function load() {
  const generation = ++viewGeneration.value
  loading.value = true
  try {
    const response = await notificationV2.listPlugins()
    if (generation === viewGeneration.value) rows.value = response.data.items
  } catch (error) {
    if (generation === viewGeneration.value)
      errorText.value = error instanceof Error ? error.message : 'Request failed.'
  } finally {
    if (generation === viewGeneration.value) loading.value = false
  }
}

function parseManifest(raw: unknown): NotificationPlugin['manifest'] {
  if (!raw || typeof raw !== 'object') throw new Error(tx('清单格式无效。', 'The manifest format is invalid.'))
  const value = raw as Record<string, any>
  if (value.api_version !== '1.0')
    throw new Error(tx('插件协议版本不兼容。', 'The plugin protocol version is incompatible.'))
  const required = [
    'plugin_id',
    'name',
    'plugin_version',
    'channels',
    'content_modes',
    'config_schema',
    'recipient_schema',
    'secret_fields',
    'capabilities'
  ]
  if (required.some(key => !(key in value)))
    throw new Error(tx('清单缺少必需字段。', 'The manifest is missing required fields.'))
  if (!Array.isArray(value.channels) || !Array.isArray(value.content_modes) || !Array.isArray(value.secret_fields)) {
    throw new Error(tx('清单能力字段格式无效。', 'The manifest capability fields are invalid.'))
  }
  if (
    !value.config_schema ||
    value.config_schema.type !== 'object' ||
    !value.recipient_schema ||
    value.recipient_schema.type !== 'object'
  ) {
    throw new Error(tx('插件只支持 object 根配置 schema。', 'The plugin must provide object root schemas.'))
  }
  const properties = value.config_schema.properties || {}
  if (value.secret_fields.some((field: string) => !(field in properties))) {
    throw new Error(
      tx('秘密字段必须对应配置 schema 的顶层字段。', 'Secret fields must name top-level config properties.')
    )
  }
  return {
    pluginId: value.plugin_id,
    name: value.name,
    pluginVersion: value.plugin_version,
    channels: value.channels,
    contentModes: value.content_modes,
    configSchema: value.config_schema,
    recipientSchema: value.recipient_schema,
    secretFields: value.secret_fields,
    capabilities: { deliveryReceipts: Boolean(value.capabilities?.delivery_receipts) }
  }
}

async function readManifest() {
  errorText.value = ''
  successText.value = ''
  manifest.value = null
  manifestDigest.value = ''
  let parsed: URL
  try {
    parsed = new URL(form.origin)
  } catch {
    errorText.value = tx('请输入有效的插件 origin。', 'Enter a valid plugin origin.')
    return
  }
  if (
    parsed.protocol !== 'https:' ||
    parsed.username ||
    parsed.password ||
    !['', '/'].includes(parsed.pathname) ||
    parsed.search ||
    parsed.hash
  ) {
    errorText.value = tx(
      '插件 origin 必须是无路径的 HTTPS 地址。',
      'The plugin origin must be an HTTPS origin without a path.'
    )
    return
  }
  if (!form.authSecret.trim()) {
    errorText.value = tx('请输入插件服务身份凭据。', 'Enter the plugin service credential.')
    return
  }
  reading.value = true
  form.origin = parsed.origin
  try {
    const response = await fetch(`${parsed.origin}/v1/manifest`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${form.authSecret}` },
      credentials: 'omit',
      redirect: 'error',
      signal: AbortSignal.timeout(10000)
    })
    if (!response.ok) throw Object.assign(new Error('Plugin manifest request failed.'), { status: response.status })
    const manifestBytes = new Uint8Array(await response.arrayBuffer())
    const digestBytes = await crypto.subtle.digest('SHA-256', manifestBytes)
    const rawText = new TextDecoder('utf-8', { fatal: true }).decode(manifestBytes)
    const value = JSON.parse(rawText)
    const mapped = parseManifest(value)
    manifestDigest.value = `sha256:${Array.from(new Uint8Array(digestBytes), byte => byte.toString(16).padStart(2, '0')).join('')}`
    manifest.value = mapped
    successText.value = tx(
      '已读取清单，请核对名称和能力后登记。',
      'Manifest loaded. Review its identity and capabilities before registering.'
    )
  } catch (error) {
    const status = (error as { status?: number })?.status
    if (status === 401) errorText.value = tx('插件身份验证失败。', 'Plugin authentication failed.')
    else if (status === 404) errorText.value = tx('未找到插件清单端点。', 'The plugin manifest endpoint was not found.')
    else if (status) errorText.value = tx(`插件服务返回 HTTP ${status}。`, `Plugin service returned HTTP ${status}.`)
    else
      errorText.value = tx(
        '无法读取插件清单。请检查插件网络和 CORS，确保它允许当前管理站点来源；凭据只发送到填写的 HTTPS 插件 Origin。',
        'Could not read the plugin manifest. Check plugin connectivity and CORS so it allows this admin origin. The credential is sent only to the entered HTTPS plugin origin.'
      )
  } finally {
    reading.value = false
  }
}

async function register() {
  if (!manifest.value || !manifestDigest.value || !form.authSecret) return
  saving.value = true
  errorText.value = ''
  if (!registrationKey.value) {
    registrationKey.value = notificationV2.createIdempotencyKey()
    registrationBody.value = {
      pluginId: manifest.value.pluginId,
      pluginVersion: manifest.value.pluginVersion,
      origin: form.origin,
      authSecret: form.authSecret,
      manifestDigest: manifestDigest.value
    }
  }
  const pendingBody = registrationBody.value
  if (!pendingBody) {
    saving.value = false
    return
  }
  let preserveCredentialForRetry = false
  try {
    await notificationV2.registerPlugin(pendingBody, registrationKey.value)
    clearDraft()
    await load()
  } catch (error) {
    if (error instanceof NotificationClientError && error.outcomeUncertain) {
      preserveCredentialForRetry = true
      errorText.value = tx(
        '登记结果未确认。请用同一请求重试；不会另建一条登记。',
        'Registration result is unknown. Retry the same request using the same idempotency key.'
      )
    } else {
      registrationKey.value = ''
      registrationBody.value = null
      errorText.value = error instanceof Error ? error.message : tx('登记失败。', 'Registration failed.')
    }
  } finally {
    if (!preserveCredentialForRetry) form.authSecret = ''
    saving.value = false
  }
}

async function toggle(row: NotificationPlugin) {
  errorText.value = ''
  try {
    const response = await notificationV2.updatePlugin(row.id, { expectedVersion: row.version, enabled: !row.enabled })
    const index = rows.value.findIndex(item => item.id === row.id)
    if (index >= 0) rows.value[index] = response.data
  } catch (error) {
    errorText.value = error instanceof Error ? error.message : tx('更新失败。', 'Update failed.')
  }
}

const columns: DataTableColumns<NotificationPlugin> = [
  { title: tx('名称', 'Name'), key: 'name', minWidth: 150, render: row => row.manifest.name },
  { title: 'pluginId', key: 'pluginId', minWidth: 180, ellipsis: { tooltip: true } },
  { title: tx('版本', 'Version'), key: 'pluginVersion', width: 110 },
  { title: tx('渠道', 'Channels'), key: 'channels', minWidth: 160, render: row => row.manifest.channels.join(', ') },
  {
    title: tx('回执', 'Receipts'),
    key: 'receipt',
    width: 100,
    render: row => (row.manifest.capabilities.deliveryReceipts ? tx('支持', 'Supported') : tx('不支持', 'Unsupported'))
  },
  { title: tx('健康状态', 'Health'), key: 'health', width: 110, render: row => row.health },
  {
    title: tx('启用', 'Enabled'),
    key: 'enabled',
    width: 90,
    render: row => (row.enabled ? tx('是', 'Yes') : tx('否', 'No'))
  },
  {
    title: tx('操作', 'Actions'),
    key: 'actions',
    width: 110,
    render: row => (
      <NButton size="small" disabled={!capabilities.value.canManagePlugins} onClick={() => toggle(row)}>
        {row.enabled ? tx('停用', 'Disable') : tx('启用', 'Enable')}
      </NButton>
    )
  }
]

onMounted(load)
</script>

<template>
  <NCard :bordered="false">
    <div class="mb-12px flex items-center justify-between gap-12px">
      <div>
        {{
          tx(
            '通知插件登记由平台安装管理员管理。健康状态不代表服务商账号有效。',
            'Notification plugin registration is managed by platform installers. Health does not confirm provider account validity.'
          )
        }}
      </div>
      <NButton v-if="capabilities.canManagePlugins" type="primary" @click="modal = true">
        {{ tx('登记通知插件', 'Register notification plugin') }}
      </NButton>
    </div>
    <NAlert v-if="errorText" type="error" class="mb-12px">{{ errorText }}</NAlert>
    <NDataTable :columns="columns" :data="rows" :loading="loading" :row-key="row => row.id" :scroll-x="1050" />
  </NCard>

  <NModal
    v-model:show="modal"
    preset="card"
    class="w-640px max-w-95vw"
    :title="tx('登记通知插件', 'Register notification plugin')"
    @after-leave="clearDraft"
  >
    <NForm label-placement="top">
      <NFormItem :label="tx('插件 Origin（HTTPS）', 'Plugin origin (HTTPS)')">
        <NInput
          v-model:value="form.origin"
          :disabled="Boolean(registrationKey)"
          placeholder="https://plugin.example.com"
        />
      </NFormItem>
      <NFormItem :label="tx('服务身份凭据', 'Service credential')">
        <NInput
          v-model:value="form.authSecret"
          :disabled="Boolean(registrationKey)"
          type="password"
          show-password-on="click"
          autocomplete="new-password"
        />
      </NFormItem>
      <NAlert v-if="errorText" type="error" class="mb-12px">{{ errorText }}</NAlert>
      <NAlert v-if="successText" type="success" class="mb-12px">{{ successText }}</NAlert>
      <div v-if="manifest" class="mb-16px rounded border p-12px">
        <div class="font-600">{{ manifest.name }} · {{ manifest.pluginVersion }}</div>
        <div>pluginId: {{ manifest.pluginId }}</div>
        <div>{{ tx('渠道', 'Channels') }}: {{ manifest.channels.join(', ') }}</div>
        <div>{{ tx('内容模式', 'Content modes') }}: {{ manifest.contentModes.join(', ') }}</div>
        <div>
          {{ tx('送达回执', 'Delivery receipts') }}:
          {{ manifest.capabilities.deliveryReceipts ? tx('支持', 'Supported') : tx('不支持', 'Unsupported') }}
        </div>
      </div>
      <NSpace justify="end">
        <NButton :disabled="Boolean(registrationKey)" :loading="reading" @click="readManifest">
          {{ tx('读取并核对清单', 'Read and review manifest') }}
        </NButton>
        <NButton
          type="primary"
          :disabled="!manifest || !capabilities.canManagePlugins"
          :loading="saving"
          @click="register"
        >
          {{
            registrationKey ? tx('使用同一请求重试', 'Retry same registration') : tx('确认登记', 'Confirm registration')
          }}
        </NButton>
      </NSpace>
    </NForm>
  </NModal>
</template>
