<script setup lang="tsx">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { DataTableColumns } from 'naive-ui'
import { NButton, NSpace } from 'naive-ui'
import { useAuthStore } from '@/store/modules/auth'
import {
  getNotificationUiCapabilities,
  invalidateNotificationSession,
  NotificationClientError,
  NotificationServiceUnavailableError,
  NotificationSessionChangedError,
  notificationV2,
  parseNotificationIdentityFields,
  registerNotificationSessionCleanup,
  resolveNotificationPluginOrigin,
  type NotificationPlugin
} from '@/service/api/notification-v2'
import type * as NotificationV2 from '@/service/api/notification-v2.types'
import dayjs from 'dayjs'
import { useNotificationTenants } from '@/views/management/notification/tenant-directory'

const emit = defineEmits<{ configureTenant: [tenantId: string] }>()
const tenantDirectory = useNotificationTenants()
const { tenants: tenantOptions, byId: tenantsById, loading: tenantsLoading, failed: tenantsFailed } = tenantDirectory
const auth = useAuthStore()
const { locale } = useI18n()
const tx = (zh: string, en: string) => (locale.value.toLowerCase().startsWith('zh') ? zh : en)
function notificationErrorMessage(error: unknown, zhFallback: string, enFallback: string) {
  if (error instanceof NotificationServiceUnavailableError)
    return tx('通知服务暂不可用，请稍后重试。', 'The notification service is temporarily unavailable. Try again later.')
  return error instanceof Error ? error.message : tx(zhFallback, enFallback)
}
const capabilities = computed(() => getNotificationUiCapabilities())
const rows = ref<NotificationPlugin[]>([])
const loading = ref(false)
const modal = ref(false)
const reading = ref(false)
const saving = ref(false)
const errorText = ref('')
const successText = ref('')
const pageSuccessText = ref('')
const manifest = ref<NotificationPlugin['manifest'] | null>(null)
const manifestDigest = ref('')
const registrationKey = ref('')
const registrationBody = ref<NotificationV2.PluginRegistration | null>(null)
const form = reactive({ origin: '', authSecret: '' })
const viewGeneration = ref(0)
const grantDrawer = ref(false)
const grantPlugin = ref<NotificationPlugin | null>(null)
const grantRows = ref<NotificationV2.PluginGrantView[]>([])
const grantPage = ref(1)
const grantTotal = ref(0)
const grantLoading = ref(false)
const grantSaving = ref(false)
const grantError = ref('')
const grantSuccess = ref('')
const targetTenantId = ref<string | null>(null)
const grantLookupLoading = ref(false)
let grantLookupVersion = 0
const pendingGrant = ref<{ key: string; body: NotificationV2.PluginGrantUpdate } | null>(null)
const grantGeneration = ref(0)
const grantController = ref<AbortController | null>(null)
const grantPageSize = 20

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

function clearGrantState() {
  grantController.value?.abort()
  grantController.value = null
  grantRows.value = []
  grantTotal.value = 0
  grantPage.value = 1
  grantDrawer.value = false
  grantPlugin.value = null
  targetTenantId.value = ''
  pendingGrant.value = null
  grantError.value = ''
  grantSuccess.value = ''
  grantSaving.value = false
  grantLookupLoading.value = false
  grantLookupVersion++
  grantGeneration.value += 1
}

const unregisterCleanup = registerNotificationSessionCleanup(() => {
  rows.value = []
  clearDraft()
  clearGrantState()
  pageSuccessText.value = ''
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
onBeforeUnmount(() => grantController.value?.abort())

async function load() {
  const generation = ++viewGeneration.value
  loading.value = true
  try {
    const response = await notificationV2.listPlugins()
    if (generation === viewGeneration.value) rows.value = response.data.items
  } catch (error) {
    if (generation === viewGeneration.value)
      errorText.value = notificationErrorMessage(error, '无法读取通知插件。', 'Could not load notification plugins.')
  } finally {
    if (generation === viewGeneration.value) loading.value = false
  }
}

function grantErrorMessage(error: unknown, context: 'load' | 'save') {
  if (error instanceof NotificationSessionChangedError) return ''
  const status = error instanceof NotificationClientError ? error.httpStatus : null
  if (status === 401) return tx('登录状态已失效，请重新登录。', 'Your session has expired. Sign in again.')
  if (status === 403)
    return tx(
      '只有平台系统管理员可以管理跨租户插件授权。',
      'Only a platform SYS_ADMIN can manage tenant plugin grants.'
    )
  if (status === 404) {
    return context === 'save'
      ? tx(
          '未找到目标租户或插件登记；本次授权没有确认成功。',
          'The target tenant or plugin registration was not found; this grant was not confirmed.'
        )
      : tx(
          '未找到插件登记；无法读取其租户授权。',
          'The plugin registration was not found; its grants could not be loaded.'
        )
  }
  if (status === 409)
    return tx('授权状态已更新，请确认后重试。', 'Access changed. Review the updated state and try again.')
  if (status === 503) {
    return context === 'save'
      ? tx('授权结果暂未确认，请点击重试。', 'The access change is not confirmed yet. Please retry.')
      : tx(
          '当前无法确认授权列表，可能是租户目录或通知服务不可用。请稍后刷新。',
          'The grant list cannot be confirmed. The tenant directory or notification service may be unavailable; refresh later.'
        )
  }
  return context === 'save'
    ? tx('授权结果暂未确认，请点击重试。', 'The access change is not confirmed yet. Please retry.')
    : tx('无法确认当前授权状态，请稍后刷新。', 'The current grant state could not be confirmed. Refresh later.')
}

async function loadGrantPage() {
  const plugin = grantPlugin.value
  if (!plugin) return
  const generation = ++grantGeneration.value
  grantController.value?.abort()
  const controller = new AbortController()
  grantController.value = controller
  grantLoading.value = true
  grantError.value = ''
  try {
    const response = await notificationV2.listPluginGrants(
      { pluginRegistrationId: plugin.id, page: grantPage.value, pageSize: grantPageSize },
      controller.signal
    )
    if (generation !== grantGeneration.value) return
    grantRows.value = response.data.items
    grantTotal.value = response.data.total
  } catch (error) {
    if (generation !== grantGeneration.value || controller.signal.aborted) return
    grantError.value = grantErrorMessage(error, 'load')
  } finally {
    if (generation === grantGeneration.value) grantLoading.value = false
  }
}

function openGrantDrawer(plugin: NotificationPlugin) {
  grantPlugin.value = plugin
  grantPage.value = 1
  grantRows.value = []
  grantTotal.value = 0
  targetTenantId.value = ''
  pendingGrant.value = null
  grantSuccess.value = ''
  grantDrawer.value = true
  void tenantDirectory.load()
  void loadGrantPage()
}

function buildGrantUpdate(
  tenantId: string,
  enabled: boolean,
  expectedVersion: number
): NotificationV2.PluginGrantUpdate {
  const plugin = grantPlugin.value
  if (!plugin) throw new Error(tx('请先选择插件。', 'Select a plugin first.'))
  if (!tenantId.trim() || tenantId.length > 128) {
    throw new Error(tx('请输入 1 到 128 个字符的目标租户 ID。', 'Enter a target tenant ID from 1 to 128 characters.'))
  }
  return {
    pluginRegistrationId: plugin.id,
    tenantId,
    enabled,
    expectedVersion
  }
}

async function saveGrant(body?: NotificationV2.PluginGrantUpdate) {
  if (!capabilities.value.canManagePlugins || grantSaving.value) return
  grantError.value = ''
  grantSuccess.value = ''
  if (!pendingGrant.value && body) {
    pendingGrant.value = { key: notificationV2.createIdempotencyKey(), body: structuredClone(body) }
  }
  const pending = pendingGrant.value
  if (!pending) return
  const pluginId = grantPlugin.value?.id
  const sessionGeneration = viewGeneration.value
  grantSaving.value = true
  try {
    await notificationV2.setPluginGrant(pending.body, pending.key)
    if (sessionGeneration !== viewGeneration.value || pluginId !== grantPlugin.value?.id) return
    pendingGrant.value = null
    targetTenantId.value = ''
    grantSuccess.value = tx('授权状态已更新。', 'The grant state was updated.')
    await loadGrantPage()
  } catch (error) {
    if (sessionGeneration !== viewGeneration.value || pluginId !== grantPlugin.value?.id) return
    if (error instanceof NotificationSessionChangedError) return
    if (error instanceof NotificationClientError && error.outcomeUncertain) {
      grantError.value = grantErrorMessage(error, 'save')
    } else {
      pendingGrant.value = null
      if (error instanceof NotificationClientError && error.httpStatus === 409) {
        await loadGrantPage()
        grantError.value = grantError.value
          ? tx(
              '授权版本冲突，且刷新列表失败；当前状态无法确认。请稍后重新打开。',
              'The grant version conflicted and the list could not be refreshed; the current state is unconfirmed. Reopen later.'
            )
          : tx('授权状态已更新，请确认后重试。', 'Access changed. Review the updated state and try again.')
      } else {
        grantError.value = grantErrorMessage(error, 'save')
      }
    }
  } finally {
    if (sessionGeneration === viewGeneration.value && pluginId === grantPlugin.value?.id) grantSaving.value = false
  }
}

async function authorizeTenant() {
  if (!grantPlugin.value || pendingGrant.value || grantLookupLoading.value || grantSaving.value) return
  const tenantId = targetTenantId.value
  if (!tenantId || !tenantsById.value.has(tenantId) || tenantsById.value.get(tenantId)?.disabled) return
  const pluginId = grantPlugin.value.id
  const generation = grantGeneration.value
  const lookupVersion = ++grantLookupVersion
  grantLookupLoading.value = true
  grantError.value = ''
  try {
    // Grants are paginated. Resolve the selected tenant across all pages before
    // creating/re-enabling; never assume it is new based on the visible page.
    let existing: NotificationV2.PluginGrantView | undefined
    for (let page = 1; ; page++) {
      const { data } = await notificationV2.listPluginGrants({ pluginRegistrationId: pluginId, page, pageSize: 100 })
      if (generation !== grantGeneration.value || targetTenantId.value !== tenantId) return
      existing = data.items.find(row => row.tenantId === tenantId)
      if (existing || page * data.pageSize >= data.total) break
      if (!data.items.length) throw new Error('Incomplete grant list')
    }
    if (existing?.enabled) {
      grantSuccess.value = tx(
        '此租户已获授权，可以继续配置渠道。',
        'This tenant already has access. Continue with channel setup.'
      )
      return
    }
    await saveGrant(buildGrantUpdate(tenantId, true, existing?.version ?? 0))
  } catch (error) {
    if (generation === grantGeneration.value) grantError.value = grantErrorMessage(error, 'load')
  } finally {
    if (lookupVersion === grantLookupVersion) grantLookupLoading.value = false
  }
}

function configureTenant(tenantId: string) {
  if (pendingGrant.value || grantSaving.value) return
  grantDrawer.value = false
  emit('configureTenant', tenantId)
}

function changeGrantPage(page: number) {
  grantPage.value = page
  void loadGrantPage()
}

const grantColumns: DataTableColumns<NotificationV2.PluginGrantView> = [
  {
    title: tx('租户', 'Tenant'),
    key: 'tenantId',
    minWidth: 220,
    render: row => tenantsById.value.get(row.tenantId)?.label || row.tenantId
  },
  {
    title: tx('使用权限', 'Access'),
    key: 'enabled',
    width: 90,
    render: row => (row.enabled ? tx('已开通', 'Granted') : tx('已撤销', 'Revoked'))
  },
  {
    title: tx('更新时间', 'Updated'),
    key: 'updatedAt',
    width: 170,
    render: row => (dayjs(row.updatedAt).isValid() ? dayjs(row.updatedAt).format('YYYY-MM-DD HH:mm') : '—')
  },
  {
    title: tx('操作', 'Actions'),
    key: 'actions',
    width: 200,
    render: row => (
      <NSpace>
        {row.enabled && (
          <NButton
            size="small"
            disabled={Boolean(pendingGrant.value) || grantSaving.value}
            onClick={() => configureTenant(row.tenantId)}
          >
            {tx('配置渠道', 'Configure channels')}
          </NButton>
        )}
        <NButton
          size="small"
          disabled={Boolean(pendingGrant.value) || grantSaving.value || !capabilities.value.canManagePlugins}
          onClick={() => {
            try {
              void saveGrant(buildGrantUpdate(row.tenantId, !row.enabled, row.version))
            } catch (error) {
              grantError.value =
                error instanceof Error ? error.message : tx('授权请求无效。', 'The grant request is invalid.')
            }
          }}
        >
          {row.enabled ? tx('撤销授权', 'Revoke') : tx('重新授权', 'Re-enable')}
        </NButton>
      </NSpace>
    )
  }
]

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
  const identityFields = parseNotificationIdentityFields(value.identity_fields)
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
    ...(identityFields === undefined ? {} : { identityFields }),
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
  let origin: string
  try {
    origin = resolveNotificationPluginOrigin(form.origin)
  } catch (error) {
    errorText.value =
      error instanceof Error
        ? tx('插件 origin 无效。生产必须使用 HTTPS；仅显式开启的 Vite 开发环境允许 loopback HTTP。', error.message)
        : tx('插件 origin 无效。', 'The plugin origin is invalid.')
    return
  }
  if (!form.authSecret.trim()) {
    errorText.value = tx('请输入插件服务身份凭据。', 'Enter the plugin service credential.')
    return
  }
  reading.value = true
  form.origin = origin
  try {
    const response = await fetch(`${origin}/v1/manifest`, {
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
    pageSuccessText.value = tx(
      '插件已登记到全局目录；登记不会自动授权任何租户。',
      'The plugin is registered globally; registration does not grant access to any tenant.'
    )
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
      errorText.value = notificationErrorMessage(error, '登记失败。', 'Registration failed.')
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
    errorText.value = notificationErrorMessage(error, '更新失败。', 'Update failed.')
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
    width: 240,
    render: row => (
      <NSpace>
        <NButton size="small" disabled={!capabilities.value.canManagePlugins} onClick={() => toggle(row)}>
          {row.enabled ? tx('停用', 'Disable') : tx('启用', 'Enable')}
        </NButton>
        <NButton size="small" disabled={!capabilities.value.canManagePlugins} onClick={() => openGrantDrawer(row)}>
          {tx('租户授权', 'Tenant grants')}
        </NButton>
      </NSpace>
    )
  }
]

onMounted(load)
</script>

<template>
  <NCard :bordered="false">
    <div class="mb-12px flex items-center justify-between gap-12px">
      <div>
        {{ tx('通知插件', 'Notification plugins') }}
      </div>
      <NButton v-if="capabilities.canManagePlugins" type="primary" @click="modal = true">
        {{ tx('登记通知插件', 'Register notification plugin') }}
      </NButton>
    </div>
    <NAlert v-if="pageSuccessText" type="success" class="mb-12px">{{ pageSuccessText }}</NAlert>
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
      <NAlert type="info" class="mb-12px">
        {{
          tx(
            '此凭据只会发送到上方插件 Origin 的清单端点（生产必须 HTTPS；仅显式开发 loopback 例外）；平台登录凭据不会发送到插件。',
            'This credential is sent only to the manifest endpoint at the plugin origin above (HTTPS in production, with only the explicit development loopback exception). Your platform session token is never sent to the plugin.'
          )
        }}
      </NAlert>
      <NAlert v-if="errorText" type="error" class="mb-12px">{{ errorText }}</NAlert>
      <NAlert v-if="successText" type="success" class="mb-12px">{{ successText }}</NAlert>
      <div v-if="manifest" class="mb-16px rounded border p-12px">
        <div class="font-600">{{ manifest.name }} · {{ manifest.pluginVersion }}</div>
        <div>pluginId: {{ manifest.pluginId }}</div>
        <div>{{ tx('渠道', 'Channels') }}: {{ manifest.channels.join(', ') }}</div>
        <div>{{ tx('内容模式', 'Content modes') }}: {{ manifest.contentModes.join(', ') }}</div>
        <div v-if="manifest.identityFields?.length">
          {{ tx('身份字段', 'Identity fields') }}: {{ manifest.identityFields.join(', ') }}
        </div>
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

  <NDrawer
    v-model:show="grantDrawer"
    placement="right"
    width="min(900px, 100vw)"
    :mask-closable="!pendingGrant && !grantLookupLoading"
    :close-on-esc="!pendingGrant && !grantLookupLoading"
    @after-leave="clearGrantState"
  >
    <NDrawerContent
      :title="
        grantPlugin
          ? `${grantPlugin.manifest.name} · ${tx('租户授权', 'Tenant grants')}`
          : tx('租户授权', 'Tenant grants')
      "
      :closable="!pendingGrant && !grantLookupLoading"
    >
      <p class="mb-20px text-secondary">
        {{ tx('为租户开通插件后，继续配置通知渠道。', 'Grant plugin access, then configure the tenant’s channels.') }}
      </p>
      <NAlert v-if="tenantsFailed" type="error" class="mb-12px">
        {{ tx('租户列表加载失败。', 'Could not load tenants.') }}
        <NButton text @click="tenantDirectory.load()">{{ tx('重试', 'Retry') }}</NButton>
      </NAlert>
      <NAlert v-if="grantError" type="error" class="mb-12px">{{ grantError }}</NAlert>
      <NAlert v-if="grantSuccess" type="success" class="mb-12px">{{ grantSuccess }}</NAlert>
      <div class="mb-16px flex flex-wrap items-end gap-12px">
        <NFormItem class="min-w-220px flex-1" :label="tx('选择租户', 'Select tenant')">
          <NSelect
            v-model:value="targetTenantId"
            filterable
            clearable
            :loading="tenantsLoading"
            :options="tenantOptions"
            :disabled="Boolean(pendingGrant) || grantSaving || grantLookupLoading"
            :input-props="{ 'aria-label': tx('选择租户', 'Select tenant') }"
            :placeholder="tx('搜索租户名称或账号', 'Search tenant name or account')"
          />
        </NFormItem>
        <NButton
          type="primary"
          class="mb-24px"
          :disabled="
            !targetTenantId ||
            tenantsLoading ||
            tenantsFailed ||
            Boolean(pendingGrant) ||
            grantSaving ||
            grantLookupLoading ||
            !capabilities.canManagePlugins
          "
          :loading="grantSaving || grantLookupLoading"
          @click="authorizeTenant"
        >
          {{ tx('授权使用', 'Grant access') }}
        </NButton>
      </div>
      <NDataTable
        :columns="grantColumns"
        :data="grantRows"
        :loading="grantLoading"
        :row-key="row => `${row.tenantId}:${row.version}`"
        :scroll-x="680"
      />
      <div v-if="grantTotal > grantPageSize" class="mt-12px flex justify-end">
        <NPagination
          :page="grantPage"
          :page-size="grantPageSize"
          :item-count="grantTotal"
          :disabled="Boolean(pendingGrant) || grantSaving || grantLookupLoading"
          @update:page="changeGrantPage"
        />
      </div>
      <div v-if="pendingGrant" class="mt-16px flex justify-end">
        <NButton type="warning" :loading="grantSaving" @click="saveGrant()">
          {{ tx('重试', 'Retry') }}
        </NButton>
      </div>
    </NDrawerContent>
  </NDrawer>
</template>
