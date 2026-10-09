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
  NotificationSessionChangedError,
  notificationV2,
  registerNotificationSessionCleanup,
  resolveNotificationPluginOrigin,
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
const targetTenantId = ref('')
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
      errorText.value = error instanceof Error ? error.message : 'Request failed.'
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
    return tx(
      '授权版本已变化。已刷新列表，请核对当前版本后再操作。',
      'The grant version changed. The list was refreshed; review the current version before changing it.'
    )
  if (status === 503) {
    return context === 'save'
      ? tx(
          '授权结果暂时无法确认。请使用“重试同一请求”；系统会复用原请求键和内容。',
          'The grant result cannot be confirmed yet. Retry the same request; the original key and body will be reused.'
        )
      : tx(
          '当前无法确认授权列表，可能是租户目录或通知服务不可用。请稍后刷新。',
          'The grant list cannot be confirmed. The tenant directory or notification service may be unavailable; refresh later.'
        )
  }
  return context === 'save'
    ? tx(
        '授权请求结果未确认。请使用“重试同一请求”；系统会复用原请求键和内容。',
        'The grant request result is unconfirmed. Retry the same request; the original key and body will be reused.'
      )
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
  grantSaving.value = true
  try {
    await notificationV2.setPluginGrant(pending.body, pending.key)
    pendingGrant.value = null
    targetTenantId.value = ''
    grantSuccess.value = tx('授权状态已更新。', 'The grant state was updated.')
    await loadGrantPage()
  } catch (error) {
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
          : tx(
              '授权版本已变化。列表已刷新，请核对当前版本后再操作。',
              'The grant version changed. The list was refreshed; review the current version before changing it.'
            )
      } else {
        grantError.value = grantErrorMessage(error, 'save')
      }
    }
  } finally {
    grantSaving.value = false
  }
}

function authorizeTenant() {
  if (!grantPlugin.value || pendingGrant.value) return
  const tenantId = targetTenantId.value
  const existing = grantRows.value.find(row => row.tenantId === tenantId)
  if (existing) {
    grantError.value = existing.enabled
      ? tx('此租户已获授权。', 'This tenant is already authorized.')
      : tx(
          '此租户已有已撤销授权，请在列表中按当前版本重新启用。',
          'This tenant has a revoked grant. Re-enable it from the list using its current version.'
        )
    return
  }
  try {
    void saveGrant(buildGrantUpdate(tenantId, true, 0))
  } catch (error) {
    grantError.value =
      error instanceof Error ? error.message : tx('目标租户 ID 无效。', 'The target tenant ID is invalid.')
  }
}

function changeGrantPage(page: number) {
  grantPage.value = page
  void loadGrantPage()
}

const grantColumns: DataTableColumns<NotificationV2.PluginGrantView> = [
  { title: tx('目标租户 ID', 'Target tenant ID'), key: 'tenantId', minWidth: 180, ellipsis: { tooltip: true } },
  {
    title: tx('已授权', 'Enabled'),
    key: 'enabled',
    width: 90,
    render: row => (row.enabled ? tx('是', 'Yes') : tx('否', 'No'))
  },
  { title: tx('版本', 'Version'), key: 'version', width: 80 },
  { title: tx('更新时间', 'Updated'), key: 'updatedAt', minWidth: 190 },
  {
    title: tx('操作', 'Actions'),
    key: 'actions',
    width: 120,
    render: row => (
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
    <NAlert type="info" class="mb-12px">
      {{
        tx(
          '全局登记不会自动授权租户。请在插件行打开“租户授权”，明确输入目标租户 ID。平台登录凭据只访问平台 API，不会发送到插件服务。',
          'Global registration does not grant any tenant access. Open “Tenant grants” on a plugin row and enter the target tenant ID explicitly. The platform session token is used only with the platform API and is never sent to the plugin service.'
        )
      }}
    </NAlert>
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
    width="720"
    :mask-closable="!pendingGrant"
    :close-on-esc="!pendingGrant"
  >
    <NDrawerContent
      :title="
        grantPlugin
          ? `${grantPlugin.manifest.name} · ${tx('租户授权', 'Tenant grants')}`
          : tx('租户授权', 'Tenant grants')
      "
      :closable="!pendingGrant"
    >
      <NAlert type="info" class="mb-12px">
        {{
          tx(
            '仅 SYS_ADMIN 可在这里为指定租户授权。租户 ID 是显式目标，不会切换或冒充该租户账号。新授权使用版本 0 创建；撤销和重新授权使用列表中的当前版本。',
            'Only SYS_ADMIN can grant access to an explicitly selected tenant here. The tenant ID is a target value; this does not switch to or impersonate that tenant. New grants use expected version 0; revocation and re-enabling use the current listed version.'
          )
        }}
      </NAlert>
      <NAlert v-if="grantError" type="error" class="mb-12px">{{ grantError }}</NAlert>
      <NAlert v-if="grantSuccess" type="success" class="mb-12px">{{ grantSuccess }}</NAlert>
      <div class="mb-16px flex items-end gap-12px">
        <NFormItem class="min-w-0 flex-1" :label="tx('目标租户 ID', 'Target tenant ID')">
          <NInput
            v-model:value="targetTenantId"
            :disabled="Boolean(pendingGrant) || grantSaving"
            maxlength="128"
            autocomplete="off"
            :placeholder="tx('输入租户 ID', 'Enter tenant ID')"
          />
        </NFormItem>
        <NButton
          type="primary"
          class="mb-24px"
          :disabled="Boolean(pendingGrant) || grantSaving || !capabilities.canManagePlugins"
          :loading="grantSaving"
          @click="authorizeTenant"
        >
          {{ tx('显式授权', 'Grant access') }}
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
          :disabled="Boolean(pendingGrant) || grantSaving"
          @update:page="changeGrantPage"
        />
      </div>
      <div v-if="pendingGrant" class="mt-16px flex justify-end">
        <NButton type="warning" :loading="grantSaving" @click="saveGrant()">
          {{ tx('重试同一请求', 'Retry same request') }}
        </NButton>
      </div>
    </NDrawerContent>
  </NDrawer>
</template>
