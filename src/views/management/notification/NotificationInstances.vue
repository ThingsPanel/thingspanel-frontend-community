<script setup lang="tsx">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { DataTableColumns } from 'naive-ui'
import { NButton, NSpace } from 'naive-ui'
import { useAuthStore } from '@/store/modules/auth'
import {
  getNotificationUiCapabilities,
  invalidateNotificationSession,
  notificationV2,
  NotificationClientError,
  NotificationSessionChangedError,
  registerNotificationSessionCleanup,
  stripSecretConfig,
  unsupportedNotificationSchemaPaths,
  validateNotificationConfigValue,
  type NotificationInstance,
  type NotificationPlugin
} from '@/service/api/notification-v2'
import type * as NotificationV2 from '@/service/api/notification-v2.types'
import {
  editableNotificationSecretFields,
  isNotificationConfigFieldReadOnly,
  omitReadOnlyNotificationIdentityFields
} from './identity-fields'

type SchemaField = {
  type?: string
  title?: string
  description?: string
  enum?: unknown[]
  items?: Record<string, unknown>
  [key: string]: unknown
}
type ContentMode = 'text' | 'template'

const auth = useAuthStore()
const { locale } = useI18n()
const tx = (zh: string, en: string) => (locale.value.toLowerCase().startsWith('zh') ? zh : en)
const capabilities = computed(() => getNotificationUiCapabilities())
const plugins = ref<NotificationPlugin[]>([])
const instances = ref<NotificationInstance[]>([])
const loading = ref(false)
const saving = ref(false)
const errorText = ref('')
const successText = ref('')
const modal = ref(false)
const testModal = ref(false)
const editorMode = ref<'create' | 'edit'>('create')
const selectedPluginId = ref('')
const selectedInstance = ref<NotificationInstance | null>(null)
const selectedPlugin = computed(() => plugins.value.find(item => item.id === selectedPluginId.value) || null)
const identityFields = computed(() => selectedPlugin.value?.manifest.identityFields)
const legacyIdentityConfigFrozen = computed(
  () => editorMode.value === 'edit' && selectedPlugin.value !== null && identityFields.value === undefined
)
const editableSecretFields = computed(() =>
  editableNotificationSecretFields(secretFields.value, identityFields.value, editorMode.value === 'edit')
)
function isIdentityFieldReadOnly(name: string) {
  return isNotificationConfigFieldReadOnly(name, identityFields.value, editorMode.value === 'edit')
}
const schemaFields = computed(() => {
  const properties = selectedPlugin.value?.manifest.configSchema?.properties
  if (!properties || typeof properties !== 'object' || Array.isArray(properties)) return []
  return Object.entries(properties as Record<string, SchemaField>).filter(([, schema]) => {
    return (
      ['string', 'integer', 'number', 'boolean', 'object', 'array'].includes(String(schema.type)) && !('$ref' in schema)
    )
  })
})
const unsupportedSchemaFields = computed(() => {
  const schema = selectedPlugin.value?.manifest.configSchema
  return schema ? unsupportedNotificationSchemaPaths(schema) : []
})
const requiredFields = computed(() => {
  const required = selectedPlugin.value?.manifest.configSchema?.required
  return Array.isArray(required) ? required.map(String) : []
})
const secretFields = computed(() => selectedPlugin.value?.manifest.secretFields || [])
const configValues = ref<Record<string, unknown>>({})
const originalConfig = ref<Record<string, unknown>>({})
const jsonDrafts = reactive<Record<string, string>>({})
const providerIdentityText = ref('{}')
const localFieldErrors = ref<Record<string, string>>({})
const validationErrors = ref<Array<{ field: string; reason: string }>>([])
const secretMode = ref<'keep' | 'set' | 'clear'>('keep')
const secretDraft = reactive<Record<string, string>>({})
const clearSecretFields = ref<string[]>([])
const enabledValue = ref(true)
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)
const viewGeneration = ref(0)
const testRecipient = ref('')
const testContentMode = ref<ContentMode>('text')
const testTitle = ref('')
const testText = ref('')
const testTemplateId = ref('')
const testLocale = ref('')
const testParamsText = ref('{}')
const pendingTest = ref<{ instanceId: string; key: string; body: NotificationV2.TestSendRequest } | null>(null)
const acceptedNotificationId = ref('')
const testStateText = ref('')

function clearSecretsAndEditor() {
  secretMode.value = 'keep'
  clearSecretFields.value = []
  Object.keys(secretDraft).forEach(key => delete secretDraft[key])
  Object.keys(jsonDrafts).forEach(key => delete jsonDrafts[key])
  configValues.value = {}
  originalConfig.value = {}
  localFieldErrors.value = {}
  validationErrors.value = []
  providerIdentityText.value = '{}'
  selectedInstance.value = null
}

function clearSessionState() {
  plugins.value = []
  instances.value = []
  total.value = 0
  errorText.value = ''
  successText.value = ''
  pendingTest.value = null
  acceptedNotificationId.value = ''
  testStateText.value = ''
  testModal.value = false
  modal.value = false
  clearSecretsAndEditor()
  viewGeneration.value += 1
}

const unregisterCleanup = registerNotificationSessionCleanup(clearSessionState)
watch(
  () => [auth.token, auth.userInfo.tenant_id, auth.userInfo.id, auth.userInfo.userId],
  () => invalidateNotificationSession()
)
onBeforeUnmount(unregisterCleanup)

async function loadInstances() {
  const generation = ++viewGeneration.value
  loading.value = true
  errorText.value = ''
  try {
    const [pluginResponse, instanceResponse] = await Promise.all([
      notificationV2.listPlugins(),
      notificationV2.listInstances({ page: currentPage.value, pageSize: pageSize.value })
    ])
    if (generation !== viewGeneration.value) return
    plugins.value = pluginResponse.data.items
    instances.value = instanceResponse.data.items
    total.value = instanceResponse.data.total
  } catch (error) {
    if (generation !== viewGeneration.value || error instanceof NotificationSessionChangedError) return
    errorText.value = error instanceof Error ? error.message : 'Request failed.'
  } finally {
    if (generation === viewGeneration.value) loading.value = false
  }
}

function defaultValue(schema: SchemaField): unknown {
  if ('default' in schema) return schema.default
  if (schema.type === 'boolean') return false
  if (schema.type === 'integer') return 0
  if (schema.type === 'array') return []
  if (schema.type === 'object') return {}
  return ''
}

function setSchemaDefaults(config: Record<string, unknown>) {
  schemaFields.value.forEach(([name, schema]) => {
    if (secretFields.value.includes(name)) return
    if (!(name in config)) config[name] = defaultValue(schema)
    if (schema.type === 'object' || schema.type === 'array') jsonDrafts[name] = JSON.stringify(config[name], null, 2)
  })
}

function openCreate() {
  clearSecretsAndEditor()
  editorMode.value = 'create'
  selectedPluginId.value = ''
  selectedInstance.value = null
  formName.value = ''
  selectedChannel.value = null
  enabledValue.value = true
  modal.value = true
}

async function openEdit(row: NotificationInstance) {
  errorText.value = ''
  try {
    const [instanceResponse, pluginResponse] = await Promise.all([
      notificationV2.getInstance(row.id),
      notificationV2.listPlugins()
    ])
    selectedInstance.value = instanceResponse.data
    plugins.value = pluginResponse.data.items
    selectedPluginId.value = instanceResponse.data.pluginRegistrationId
    editorMode.value = 'edit'
    formName.value = instanceResponse.data.name
    selectedChannel.value = instanceResponse.data.channel
    const secretNames =
      plugins.value.find(plugin => plugin.id === instanceResponse.data.pluginRegistrationId)?.manifest.secretFields ||
      []
    const safeConfig = stripSecretConfig(instanceResponse.data.config || {}, secretNames)
    originalConfig.value = structuredClone(safeConfig)
    configValues.value = structuredClone(safeConfig)
    setSchemaDefaults(configValues.value)
    providerIdentityText.value = JSON.stringify(instanceResponse.data.providerIdentity || {}, null, 2)
    enabledValue.value = instanceResponse.data.enabled
    secretFields.value.forEach(name => {
      secretDraft[name] = ''
    })
    modal.value = true
  } catch (error) {
    errorText.value = error instanceof Error ? error.message : tx('读取实例失败。', 'Could not load the instance.')
  }
}

watch(selectedPluginId, (next, previous) => {
  if (next === previous || editorMode.value !== 'create') return
  clearSecretsAndEditor()
  secretFields.value.forEach(name => {
    secretDraft[name] = ''
  })
  if (selectedPlugin.value) setSchemaDefaults(configValues.value)
})

function updateJsonField(name: string, value: string) {
  jsonDrafts[name] = value
  try {
    configValues.value[name] = JSON.parse(value)
    delete localFieldErrors.value[name]
  } catch {
    localFieldErrors.value[name] = tx('请输入有效 JSON。', 'Enter valid JSON.')
  }
}

function mergeConfig(includeSecrets: boolean) {
  const result = { ...configValues.value }
  if (includeSecrets) {
    secretFields.value.forEach(name => {
      if (secretDraft[name]) result[name] = secretDraft[name]
    })
  }
  return result
}

function changedConfigPatch() {
  const patch: Record<string, unknown> = {}
  Object.entries(configValues.value).forEach(([name, value]) => {
    if (secretFields.value.includes(name)) return
    if (JSON.stringify(value) !== JSON.stringify(originalConfig.value[name])) patch[name] = value
  })
  return omitReadOnlyNotificationIdentityFields(patch, identityFields.value, editorMode.value === 'edit')
}

function secretOperation(): NotificationV2.SecretPatch | undefined {
  if (editorMode.value !== 'edit' || secretMode.value === 'keep') return undefined
  if (secretMode.value === 'set') {
    const set = Object.fromEntries(
      editableSecretFields.value.filter(name => secretDraft[name]).map(name => [name, secretDraft[name]])
    )
    return Object.keys(set).length ? { set } : undefined
  }
  const clear = clearSecretFields.value.filter(name => editableSecretFields.value.includes(name))
  return clear.length ? { clear } : undefined
}

function parseProviderIdentity() {
  try {
    const value = JSON.parse(providerIdentityText.value)
    if (
      !value ||
      typeof value !== 'object' ||
      Array.isArray(value) ||
      Object.values(value).some(item => typeof item !== 'string')
    ) {
      throw new Error(tx('账号身份必须是字符串键值对象。', 'Provider identity must be a string map.'))
    }
    return value as Record<string, string>
  } catch (error) {
    throw error instanceof Error ? error : new Error(tx('账号身份 JSON 无效。', 'Provider identity JSON is invalid.'))
  }
}

function localValidation() {
  const errors: Record<string, string> = { ...localFieldErrors.value }
  if (!selectedPlugin.value) errors.pluginRegistrationId = tx('请选择已授权的插件。', 'Choose an authorized plugin.')
  if (unsupportedSchemaFields.value.length && !legacyIdentityConfigFrozen.value)
    errors.schema = tx(
      `插件清单包含暂不支持的配置字段：${unsupportedSchemaFields.value.join(', ')}`,
      `The plugin has unsupported config fields: ${unsupportedSchemaFields.value.join(', ')}`
    )
  if (!formName.value.trim()) errors.name = tx('实例名称不能为空。', 'Instance name is required.')
  requiredFields.value.forEach(name => {
    if (isIdentityFieldReadOnly(name)) return
    if (secretFields.value.includes(name)) {
      if (editorMode.value === 'create' && !secretDraft[name])
        errors[name] = tx('此秘密字段必填。', 'This secret field is required.')
      return
    }
    const value = configValues.value[name]
    if (value === undefined || value === null || value === '')
      errors[name] = tx('此字段必填。', 'This field is required.')
  })
  schemaFields.value.forEach(([name, schema]) => {
    if (secretFields.value.includes(name) || isIdentityFieldReadOnly(name) || localFieldErrors.value[name]) return
    const value = configValues.value[name]
    if (value === undefined) return
    const validationError = validateNotificationConfigValue(value, schema, name)
    if (validationError) errors[name] = validationError
  })
  localFieldErrors.value = errors
  const valid = Object.keys(errors).length === 0
  errorText.value = valid ? '' : tx('请修正表单中的错误后继续。', 'Fix the form errors before continuing.')
  return valid
}

const formName = ref('')
const selectedChannel = ref<NotificationV2.Channel | null>(null)
watch(selectedPluginId, () => {
  if (editorMode.value === 'create') {
    selectedChannel.value = selectedPlugin.value?.manifest.channels[0] || null
  }
})

async function validateConfig() {
  validationErrors.value = []
  errorText.value = ''
  if (!localValidation()) return
  try {
    const config = mergeConfig(true)
    const body: NotificationV2.InstanceValidate =
      editorMode.value === 'create'
        ? { draft: { pluginRegistrationId: selectedPluginId.value, channel: selectedChannel.value!, config } }
        : {
            instanceId: selectedInstance.value!.id,
            expectedVersion: selectedInstance.value!.version,
            configPatch: config
          }
    const result = await notificationV2.validateInstance(body)
    validationErrors.value = result.data.errors
    successText.value = result.data.valid
      ? tx('配置校验通过；未发送通知。', 'Configuration is valid; no notification was sent.')
      : ''
  } catch (error) {
    errorText.value = error instanceof Error ? error.message : tx('校验失败。', 'Validation failed.')
  }
}

async function saveInstance() {
  if (!capabilities.value.canManage || !localValidation()) return
  saving.value = true
  errorText.value = ''
  successText.value = ''
  try {
    if (editorMode.value === 'create') {
      await notificationV2.createInstance({
        pluginRegistrationId: selectedPluginId.value,
        name: formName.value.trim(),
        channel: selectedChannel.value!,
        config: mergeConfig(true),
        providerIdentity: parseProviderIdentity()
      })
    } else {
      const patch: NotificationV2.InstanceUpdate = { expectedVersion: selectedInstance.value!.version }
      if (formName.value.trim() !== selectedInstance.value!.name) patch.name = formName.value.trim()
      if (Object.keys(changedConfigPatch()).length) patch.configPatch = changedConfigPatch()
      if (enabledValue.value !== selectedInstance.value!.enabled) patch.enabled = enabledValue.value
      const secrets = secretOperation()
      if (secrets) patch.secrets = secrets
      if (!patch.name && !patch.configPatch && patch.enabled === undefined && !patch.secrets) {
        successText.value = tx('没有修改。', 'There are no changes to save.')
        saving.value = false
        return
      }
      await notificationV2.updateInstance(selectedInstance.value!.id, patch)
    }
    clearSecretsAndEditor()
    modal.value = false
    successText.value = tx('实例已保存；不会自动发送测试通知。', 'Instance saved. No test notification was sent.')
    await loadInstances()
  } catch (error) {
    errorText.value =
      error instanceof Error && error.message === 'identity_change_requires_new_instance'
        ? tx(
            '现有实例的身份字段不可更改，请创建新实例。',
            'Provider identity cannot change on an existing instance. Create a new instance.'
          )
        : error instanceof Error
          ? error.message
          : tx('保存失败。', 'Save failed.')
  } finally {
    saving.value = false
  }
}

function closeEditor() {
  clearSecretsAndEditor()
  modal.value = false
  errorText.value = ''
}

function defaultRecipientKind(channel: NotificationV2.Channel): NotificationV2.Recipient['kind'] {
  const mapping: Record<NotificationV2.Channel, NotificationV2.Recipient['kind']> = {
    email: 'email',
    sms: 'phone',
    voice: 'phone',
    im: 'chat_id',
    webhook: 'webhook'
  }
  return mapping[channel]
}

function enumOptions(schema: SchemaField) {
  return (schema.enum || []).map(value => ({ label: String(value), value: String(value) }))
}

function enumSelection(name: string) {
  const value = configValues.value[name]
  return value === undefined || value === null ? null : String(value)
}

function updateEnum(name: string, schema: SchemaField, selected: string | null) {
  configValues.value[name] = schema.enum?.find(value => String(value) === selected)
}

function openTest(row: NotificationInstance) {
  if (pendingTest.value) {
    testStateText.value = tx(
      '上一次试发结果未知，请使用同一请求重试或查询状态。',
      'The previous test result is unknown. Retry the same request or query its status.'
    )
    testModal.value = true
    return
  }
  selectedInstance.value = row
  testRecipient.value = ''
  testContentMode.value = 'text'
  testTitle.value = ''
  testText.value = ''
  testTemplateId.value = ''
  testLocale.value = ''
  testParamsText.value = '{}'
  testStateText.value = ''
  acceptedNotificationId.value = ''
  testModal.value = true
}

function makeTestBody(): NotificationV2.TestSendRequest {
  const instance = selectedInstance.value
  if (!instance || !testRecipient.value.trim()) throw new Error(tx('请填写接收目标。', 'Enter a recipient.'))
  const recipient: NotificationV2.Recipient = {
    kind: defaultRecipientKind(instance.channel),
    address: testRecipient.value.trim()
  }
  let content: NotificationV2.Content
  if (testContentMode.value === 'text') {
    if (!testText.value.trim()) throw new Error(tx('请填写测试文本。', 'Enter the test text.'))
    content = { kind: 'text', title: testTitle.value || undefined, text: testText.value }
  } else {
    if (!testTemplateId.value.trim()) throw new Error(tx('请填写模板 ID。', 'Enter a template ID.'))
    let params: Record<string, unknown>
    try {
      params = JSON.parse(testParamsText.value)
      if (!params || typeof params !== 'object' || Array.isArray(params)) throw new Error()
    } catch {
      throw new Error(tx('模板参数必须是 JSON 对象。', 'Template parameters must be a JSON object.'))
    }
    content = {
      kind: 'template',
      title: testTitle.value || undefined,
      template: { id: testTemplateId.value.trim(), locale: testLocale.value || undefined, params }
    }
  }
  return { recipient, content, expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString() }
}

async function submitTest() {
  if (!capabilities.value.canSendTest) return
  errorText.value = ''
  try {
    if (!pendingTest.value) {
      const body = makeTestBody()
      pendingTest.value = { instanceId: selectedInstance.value!.id, key: notificationV2.createIdempotencyKey(), body }
    }
    const pending = pendingTest.value
    const response = await notificationV2.testInstance(pending.instanceId, pending.body, pending.key)
    acceptedNotificationId.value = response.data.notificationId
    pendingTest.value = null
    testStateText.value = tx(
      '已接收，正在处理。服务受理不代表已送达。',
      'Accepted by the notification service and processing. Acceptance does not mean delivered.'
    )
    await refreshTestStatus()
  } catch (error) {
    if (error instanceof NotificationClientError && error.outcomeUncertain) {
      testStateText.value = tx(
        '结果未确认。不会自动重发；使用同一请求重试以安全查询受理结果。',
        'Result not confirmed. No automatic retry was made. Retry the same request to recover the accepted result.'
      )
      return
    }
    if (error instanceof NotificationSessionChangedError) return
    pendingTest.value = null
    errorText.value = error instanceof Error ? error.message : tx('试发失败。', 'Test send failed.')
  }
}

async function refreshTestStatus() {
  if (!acceptedNotificationId.value) return
  try {
    const response = await notificationV2.getNotification(acceptedNotificationId.value)
    const delivery = response.data.deliveries[0]
    if (!delivery) {
      testStateText.value = tx('已接收，正在处理。', 'Accepted and processing.')
      return
    }
    if (delivery.dispatchStatus === 'accepted' && delivery.deliveryStatus === 'delivered') {
      testStateText.value = tx(
        '服务商报告已送达；这不代表已读。',
        'The provider reports delivered; this does not mean read.'
      )
    } else if (delivery.dispatchStatus === 'accepted' && delivery.deliveryStatus === 'unsupported') {
      testStateText.value = tx(
        '服务商已受理；此通道不提供送达回执。',
        'The provider accepted the message; this channel has no delivery receipt.'
      )
    } else if (delivery.dispatchStatus === 'accepted' && delivery.deliveryStatus === 'pending') {
      testStateText.value = tx(
        '服务商已受理；等待送达回执。',
        'The provider accepted the message; awaiting a delivery receipt.'
      )
    } else if (delivery.dispatchStatus === 'unknown' || delivery.deliveryStatus === 'unknown') {
      testStateText.value = tx(
        '是否受理未知；系统不会自动重发。',
        'Acceptance is unknown; the system will not retry automatically.'
      )
    } else if (delivery.dispatchStatus === 'failed' || delivery.deliveryStatus === 'failed') {
      testStateText.value = tx('服务商报告投递失败。', 'The provider reports delivery failure.')
    } else {
      testStateText.value = tx('已接收，正在处理。', 'Accepted and processing.')
    }
  } catch (error) {
    if (!(error instanceof NotificationSessionChangedError))
      errorText.value = error instanceof Error ? error.message : 'Status query failed.'
  }
}

const columns: DataTableColumns<NotificationInstance> = [
  { title: tx('实例名称', 'Instance'), key: 'name', minWidth: 150 },
  {
    title: tx('插件', 'Plugin'),
    key: 'plugin',
    minWidth: 180,
    render: row =>
      plugins.value.find(item => item.id === row.pluginRegistrationId)?.manifest.name || row.pluginRegistrationId
  },
  { title: tx('渠道', 'Channel'), key: 'channel', width: 100 },
  {
    title: tx('发送状态', 'Enabled'),
    key: 'enabled',
    width: 100,
    render: row => (row.enabled ? tx('已启用', 'Enabled') : tx('已停用', 'Disabled'))
  },
  {
    title: tx('回执能力', 'Delivery receipts'),
    key: 'receipt',
    width: 130,
    render: row =>
      plugins.value.find(item => item.id === row.pluginRegistrationId)?.manifest.capabilities.deliveryReceipts
        ? tx('支持', 'Supported')
        : tx('不支持', 'Unsupported')
  },
  { title: tx('配置版本', 'Config version'), key: 'configVersion', width: 110 },
  {
    title: tx('操作', 'Actions'),
    key: 'actions',
    minWidth: 240,
    render: row => (
      <NSpace>
        <NButton size="small" disabled={!capabilities.value.canManage} onClick={() => openEdit(row)}>
          {tx('配置', 'Configure')}
        </NButton>
        <NButton
          size="small"
          disabled={!capabilities.value.canSendTest || Boolean(pendingTest.value)}
          onClick={() => openTest(row)}
        >
          {tx('发送测试', 'Send test')}
        </NButton>
      </NSpace>
    )
  }
]

onMounted(loadInstances)
</script>

<template>
  <NCard :bordered="false">
    <div class="mb-12px flex flex-wrap items-center justify-between gap-12px">
      <div>
        {{
          tx(
            '账号实例属于当前登录租户；租户 ID 仅用于页面提示，由服务端从会话确定权限。',
            'Instances belong to the signed-in tenant. Tenant identity is only a UI hint; the server derives authorization from the session.'
          )
        }}
      </div>
      <NSpace>
        <NButton @click="loadInstances">{{ tx('刷新', 'Refresh') }}</NButton>
        <NButton v-if="capabilities.canManage" type="primary" @click="openCreate">
          {{ tx('创建实例', 'Create instance') }}
        </NButton>
      </NSpace>
    </div>
    <NAlert v-if="errorText" type="error" class="mb-12px">{{ errorText }}</NAlert>
    <NAlert v-if="successText" type="success" class="mb-12px">{{ successText }}</NAlert>
    <NDataTable
      :columns="columns"
      :data="instances"
      :loading="loading"
      :row-key="row => row.id"
      :scroll-x="1000"
      :pagination="{ page: currentPage, pageSize, itemCount: total, showSizePicker: true, pageSizes: [10, 20, 50] }"
      @update:page="
        page => {
          currentPage = page
          loadInstances()
        }
      "
      @update:page-size="
        size => {
          pageSize = size
          currentPage = 1
          loadInstances()
        }
      "
    />
  </NCard>

  <NModal
    v-model:show="modal"
    preset="card"
    class="w-760px max-w-95vw"
    :title="
      editorMode === 'create'
        ? tx('创建通知实例', 'Create notification instance')
        : tx('编辑通知实例', 'Edit notification instance')
    "
    @after-leave="closeEditor"
  >
    <NForm label-placement="top">
      <NFormItem :label="tx('实例名称', 'Instance name')"><NInput v-model:value="formName" /></NFormItem>
      <NFormItem v-if="editorMode === 'create'" :label="tx('通知插件', 'Notification plugin')">
        <NSelect
          v-model:value="selectedPluginId"
          :options="
            plugins
              .filter(plugin => plugin.enabled)
              .map(plugin => ({ label: `${plugin.manifest.name} · ${plugin.pluginVersion}`, value: plugin.id }))
          "
          :placeholder="tx('选择已授权插件', 'Choose an authorized plugin')"
        />
      </NFormItem>
      <NFormItem v-if="editorMode === 'create' && selectedPlugin" :label="tx('渠道', 'Channel')">
        <NSelect
          v-model:value="selectedChannel"
          :options="selectedPlugin.manifest.channels.map(channel => ({ label: channel, value: channel }))"
        />
      </NFormItem>
      <template v-if="selectedPlugin">
        <NDivider>{{ tx('插件配置', 'Plugin configuration') }}</NDivider>
        <NAlert v-if="legacyIdentityConfigFrozen" type="warning" class="mb-12px">
          {{
            tx(
              '此旧插件清单未声明 identity_fields。为避免账号身份被意外更换，现有实例的全部配置和秘密字段只能保持原值；如需更改，请创建新实例。实例名称和发送启用状态仍可修改。',
              'This legacy plugin manifest has no identity_fields declaration. To avoid changing provider identity accidentally, keep all config and secret values unchanged on an existing instance; create a new instance to change them. The instance name and enabled state remain editable.'
            )
          }}
        </NAlert>
        <NAlert v-else-if="editorMode === 'edit' && identityFields?.length" type="warning" class="mb-12px">
          {{
            tx(
              `以下身份字段不可在现有实例中修改：${identityFields.join(', ')}。如需更换账号、区域或身份 URL，请创建新实例；非身份配置和秘密字段仍可按需更新。`,
              `These identity fields cannot change on an existing instance: ${identityFields.join(', ')}. Create a new instance to change the account, region, or identity URL; non-identity config and secrets remain editable.`
            )
          }}
        </NAlert>
        <NAlert v-if="unsupportedSchemaFields.length" type="warning" class="mb-12px">
          {{
            tx(
              `无法安全编辑这些配置字段：${unsupportedSchemaFields.join(', ')}。请使用支持的插件 schema。`,
              `These config fields cannot be edited safely: ${unsupportedSchemaFields.join(', ')}. Use a plugin with a supported schema.`
            )
          }}
        </NAlert>
        <NFormItem v-for="[name, schema] in schemaFields" :key="name" :label="schema.title || name" :path="name">
          <NInput
            v-if="secretFields.includes(name)"
            v-model:value="secretDraft[name]"
            :disabled="isIdentityFieldReadOnly(name)"
            type="password"
            show-password-on="click"
            autocomplete="new-password"
            :placeholder="
              editorMode === 'edit' && selectedInstance?.secretState[name]
                ? tx('已配置；留空保持原值', 'Configured; leave blank to keep')
                : tx('请输入秘密值', 'Enter secret value')
            "
            @update:value="secretMode = 'set'"
          />
          <NSelect
            v-else-if="Array.isArray(schema.enum)"
            :value="enumSelection(name)"
            :disabled="isIdentityFieldReadOnly(name)"
            :options="enumOptions(schema)"
            @update:value="value => updateEnum(name, schema, value)"
          />
          <NSwitch
            v-else-if="schema.type === 'boolean'"
            :value="Boolean(configValues[name])"
            :disabled="isIdentityFieldReadOnly(name)"
            @update:value="
              value => {
                configValues[name] = value
              }
            "
          />
          <NInputNumber
            v-else-if="schema.type === 'integer' || schema.type === 'number'"
            :value="Number(configValues[name] ?? 0)"
            :disabled="isIdentityFieldReadOnly(name)"
            :precision="schema.type === 'integer' ? 0 : undefined"
            @update:value="
              value => {
                configValues[name] = value ?? 0
              }
            "
          />
          <NInput
            v-else-if="schema.type === 'object' || schema.type === 'array'"
            type="textarea"
            :value="jsonDrafts[name] || ''"
            :disabled="isIdentityFieldReadOnly(name)"
            :autosize="{ minRows: 3, maxRows: 8 }"
            @update:value="value => updateJsonField(name, value)"
          />
          <NInput
            v-else
            :value="String(configValues[name] ?? '')"
            :disabled="isIdentityFieldReadOnly(name)"
            @update:value="
              value => {
                configValues[name] = value
              }
            "
          />
          <div v-if="requiredFields.includes(name)" class="mt-4px text-xs opacity-65">{{ tx('必填', 'Required') }}</div>
          <div v-if="localFieldErrors[name]" class="mt-4px text-xs text-red-600">{{ localFieldErrors[name] }}</div>
        </NFormItem>
        <NFormItem
          v-if="editableSecretFields.length && editorMode === 'edit'"
          :label="tx('秘密字段处理', 'Secret handling')"
        >
          <NRadioGroup v-model:value="secretMode">
            <NSpace>
              <NRadio value="keep">{{ tx('保持已配置值', 'Keep configured values') }}</NRadio>
              <NRadio value="set">{{ tx('替换', 'Replace') }}</NRadio>
              <NRadio value="clear">{{ tx('清除', 'Clear') }}</NRadio>
            </NSpace>
          </NRadioGroup>
          <NCheckboxGroup v-if="secretMode === 'clear'" v-model:value="clearSecretFields" class="mt-8px">
            <NSpace vertical>
              <NCheckbox
                v-for="name in editableSecretFields"
                :key="name"
                :value="name"
                :disabled="!selectedInstance?.secretState[name]"
              >
                {{ name }}{{ selectedInstance?.secretState[name] ? '' : tx('（未配置）', ' (not configured)') }}
              </NCheckbox>
            </NSpace>
          </NCheckboxGroup>
        </NFormItem>
        <NFormItem
          v-if="editorMode === 'create'"
          :label="tx('供应商账号身份（JSON 字符串映射）', 'Provider identity (JSON string map)')"
        >
          <NInput v-model:value="providerIdentityText" type="textarea" :autosize="{ minRows: 2, maxRows: 5 }" />
        </NFormItem>
        <NFormItem v-if="editorMode === 'edit'" :label="tx('发送启用', 'Sending enabled')">
          <NSwitch v-model:value="enabledValue" />
        </NFormItem>
      </template>
      <NAlert v-if="errorText" type="error" class="mb-12px">{{ errorText }}</NAlert>
      <NAlert v-if="successText" type="success" class="mb-12px">{{ successText }}</NAlert>
      <NAlert v-for="error in validationErrors" :key="`${error.field}:${error.reason}`" type="warning" class="mb-8px">
        {{ error.field }}: {{ error.reason }}
      </NAlert>
      <NSpace justify="end">
        <NButton @click="closeEditor">{{ tx('取消', 'Cancel') }}</NButton>
        <NButton :disabled="!selectedPlugin" @click="validateConfig">
          {{ tx('校验配置', 'Validate configuration') }}
        </NButton>
        <NButton
          v-if="capabilities.canManage"
          type="primary"
          :disabled="!selectedPlugin"
          :loading="saving"
          @click="saveInstance"
        >
          {{ tx('保存', 'Save') }}
        </NButton>
      </NSpace>
    </NForm>
  </NModal>

  <NModal
    v-model:show="testModal"
    preset="card"
    class="w-640px max-w-95vw"
    :title="tx('发送测试通知', 'Send test notification')"
  >
    <NAlert type="warning" class="mb-12px">
      {{
        tx(
          '本操作会联系所填目标，可能产生供应商费用。只有点击确认后才会提交。',
          'This sends to the specified recipient and may incur provider charges. It is submitted only after confirmation.'
        )
      }}
    </NAlert>
    <div v-if="selectedInstance" class="mb-12px">{{ selectedInstance.name }} · {{ selectedInstance.channel }}</div>
    <NForm label-placement="top">
      <NFormItem :label="tx('接收目标', 'Recipient')"><NInput v-model:value="testRecipient" /></NFormItem>
      <NFormItem :label="tx('内容模式', 'Content mode')">
        <NSelect
          v-model:value="testContentMode"
          :options="(selectedPlugin?.manifest.contentModes || ['text']).map(mode => ({ label: mode, value: mode }))"
        />
      </NFormItem>
      <NFormItem :label="tx('标题（可选）', 'Title (optional)')"><NInput v-model:value="testTitle" /></NFormItem>
      <NFormItem v-if="testContentMode === 'text'" :label="tx('测试文本', 'Test text')">
        <NInput v-model:value="testText" type="textarea" />
      </NFormItem>
      <template v-else>
        <NFormItem :label="tx('模板 ID', 'Template ID')"><NInput v-model:value="testTemplateId" /></NFormItem>
        <NFormItem :label="tx('语言', 'Locale')"><NInput v-model:value="testLocale" /></NFormItem>
        <NFormItem :label="tx('模板参数 JSON', 'Template params JSON')">
          <NInput v-model:value="testParamsText" type="textarea" />
        </NFormItem>
      </template>
    </NForm>
    <NAlert v-if="testStateText" type="info" class="mb-12px">{{ testStateText }}</NAlert>
    <NAlert v-if="errorText" type="error" class="mb-12px">{{ errorText }}</NAlert>
    <div v-if="acceptedNotificationId" class="mb-12px">notificationId: {{ acceptedNotificationId }}</div>
    <NSpace justify="end">
      <NButton v-if="acceptedNotificationId" @click="refreshTestStatus">{{ tx('查询状态', 'Refresh status') }}</NButton>
      <NButton :disabled="Boolean(acceptedNotificationId)" type="primary" @click="submitTest">
        {{
          pendingTest ? tx('使用同一请求重试', 'Retry same request') : tx('确认并提交一次', 'Confirm and submit once')
        }}
      </NButton>
    </NSpace>
  </NModal>
</template>
