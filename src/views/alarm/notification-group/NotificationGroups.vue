<script setup lang="tsx">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { NButton } from 'naive-ui'
import type { DataTableColumns, SelectOption } from 'naive-ui'
import { getUserList } from '@/service/api/notification'
import { useAuthStore } from '@/store/modules/auth'
import {
  getNotificationUiCapabilities,
  invalidateNotificationSession,
  notificationV2,
  NotificationClientError,
  NotificationSessionChangedError,
  registerNotificationSessionCleanup,
  type NotificationInstance,
  type NotificationPlugin
} from '@/service/api/notification-v2'
import type * as NotificationV2 from '@/service/api/notification-v2.types'
import {
  canEnableNotificationGroup,
  isNotificationGroupEditable,
  isNotificationMemberContactSupported,
  supportsNotificationMemberTarget
} from './workflow'

const auth = useAuthStore()
const notificationApiConfigured = Boolean(import.meta.env.VITE_NOTIFICATION_API_BASE_URL)
const { locale } = useI18n()
const tx = (zh: string, en: string) => (locale.value.toLowerCase().startsWith('zh') ? zh : en)
const capabilities = computed(() => getNotificationUiCapabilities())
const rows = ref<NotificationV2.GroupView[]>([])
const instances = ref<NotificationInstance[]>([])
const plugins = ref<NotificationPlugin[]>([])
const total = ref(0)
const loading = ref(false)
const saving = ref(false)
const errorText = ref('')
const successText = ref('')
const modal = ref(false)
const editorMode = ref<'create' | 'edit' | 'view'>('create')
const selectedGroup = ref<NotificationV2.GroupView | null>(null)
const currentPage = ref(1)
const pageSize = ref(10)
const viewGeneration = ref(0)
const listController = ref<AbortController | null>(null)
const detailController = ref<AbortController | null>(null)
const draftName = ref('')
const draftEnabled = ref(false)
const bindings = ref<NotificationV2.GroupBinding[]>([])
const memberOptions = ref<SelectOption[]>([])
const memberLoading = ref(false)
const bindingErrors = ref<Record<string, string>>({})
const pendingSave = ref<{
  key: string
  body: NotificationV2.GroupCreate | NotificationV2.GroupUpdate
  groupId?: string
} | null>(null)
const versionConflict = ref(false)
const templateMappings = reactive<Record<string, string>>({})
const formReadOnly = computed(() => editorMode.value === 'view' || Boolean(pendingSave.value))

function resetDraft() {
  draftName.value = ''
  draftEnabled.value = false
  bindings.value = []
  bindingErrors.value = {}
  Object.keys(templateMappings).forEach(key => delete templateMappings[key])
  selectedGroup.value = null
}

function clearSession() {
  listController.value?.abort()
  detailController.value?.abort()
  rows.value = []
  instances.value = []
  plugins.value = []
  total.value = 0
  modal.value = false
  pendingSave.value = null
  errorText.value = ''
  successText.value = ''
  resetDraft()
  viewGeneration.value += 1
}

const unregisterCleanup = registerNotificationSessionCleanup(clearSession)
watch(
  () => [auth.token, auth.userInfo.tenant_id, auth.userInfo.id, auth.userInfo.userId],
  () => invalidateNotificationSession()
)
onBeforeUnmount(() => {
  unregisterCleanup()
  listController.value?.abort()
  detailController.value?.abort()
})

const migrationLabel = (state: NotificationV2.GroupView['migrationState']) => {
  const labels = {
    native: tx('Encore 原生', 'Encore native'),
    legacy_unmigrated: tx('旧系统保留', 'Legacy system retained'),
    projection_pending: tx('旧系统投影未完成', 'Legacy projection pending')
  }
  return labels[state]
}

async function loadPage() {
  const generation = ++viewGeneration.value
  listController.value?.abort()
  const controller = new AbortController()
  listController.value = controller
  loading.value = true
  errorText.value = ''
  try {
    const [groupResponse, instanceResponse, pluginResponse] = await Promise.all([
      notificationV2.listGroups({ page: currentPage.value, pageSize: pageSize.value }, controller.signal),
      notificationV2.listInstances({ page: 1, pageSize: 100 }),
      notificationV2.listPlugins()
    ])
    if (generation !== viewGeneration.value) return
    rows.value = groupResponse.data.items
    total.value = groupResponse.data.total
    instances.value = instanceResponse.data.items
    plugins.value = pluginResponse.data.items
  } catch (error) {
    if (
      generation !== viewGeneration.value ||
      controller.signal.aborted ||
      error instanceof NotificationSessionChangedError
    )
      return
    errorText.value = error instanceof Error ? error.message : tx('加载失败。', 'Could not load notification groups.')
  } finally {
    if (generation === viewGeneration.value) loading.value = false
  }
}

function newBinding(): NotificationV2.GroupBinding {
  return {
    bindingId: notificationV2.createIdempotencyKey(),
    instanceId: '',
    recipientSource: { kind: 'literal', recipient: { kind: 'phone', address: '' } },
    contentBinding: { kind: 'text', title: '', text: '' }
  }
}

function addBinding() {
  bindings.value.push(newBinding())
}

function removeBinding(bindingId: string) {
  bindings.value = bindings.value.filter(binding => binding.bindingId !== bindingId)
  delete bindingErrors.value[bindingId]
  delete templateMappings[bindingId]
}

function updateRecipientKind(binding: NotificationV2.GroupBinding, kind: 'literal' | 'member') {
  binding.recipientSource =
    kind === 'literal'
      ? { kind, recipient: { kind: 'phone', address: '' } }
      : { kind, userId: '', contactField: 'phone' }
}

function updateContentKind(binding: NotificationV2.GroupBinding, kind: 'text' | 'template') {
  binding.contentBinding =
    kind === 'text' ? { kind, title: '', text: '' } : { kind, templateId: '', locale: 'zh-CN', paramsMapping: {} }
  if (kind === 'template') templateMappings[binding.bindingId] = '{}'
  else delete templateMappings[binding.bindingId]
}

function isUnsupportedMemberTarget(binding: NotificationV2.GroupBinding) {
  if (binding.recipientSource.kind !== 'member') return false
  const instance = instances.value.find(item => item.id === binding.instanceId)
  return instance?.channel === 'im' || binding.recipientSource.contactField === 'applicationUserId'
}

function recipientSourceOptions(binding: NotificationV2.GroupBinding): SelectOption[] {
  const instance = instances.value.find(item => item.id === binding.instanceId)
  return [
    { label: tx('直接目标', 'Literal recipient'), value: 'literal' },
    {
      label: tx('应用成员（仅邮件/短信/语音）', 'Application member (email/SMS/voice only)'),
      value: 'member',
      disabled: Boolean(instance && !supportsNotificationMemberTarget(instance.channel))
    }
  ]
}

async function searchMembers(query = '') {
  memberLoading.value = true
  try {
    const response = await getUserList({ page: 1, page_size: 50, name: query })
    const users = response?.data?.list || []
    memberOptions.value = users.map(user => ({ label: `${user.name} · ${user.user_id}`, value: user.user_id }))
  } catch {
    memberOptions.value = []
  } finally {
    memberLoading.value = false
  }
}

function validateBindings() {
  const errors: Record<string, string> = {}
  if (!draftName.value.trim()) errors.name = tx('组名称不能为空。', 'Group name is required.')
  if (bindings.value.length === 0) errors.bindings = tx('至少添加一条绑定。', 'Add at least one binding.')
  bindings.value.forEach(binding => {
    const recipient = binding.recipientSource
    if (!binding.instanceId) errors[binding.bindingId] = tx('请选择通知实例。', 'Choose a notification instance.')
    const instance = instances.value.find(item => item.id === binding.instanceId)
    if (recipient.kind === 'literal') {
      if (!recipient.recipient.address.trim())
        errors[binding.bindingId] = tx('请填写直接接收目标。', 'Enter a literal recipient.')
      const compatibleRecipient: Record<NotificationV2.Channel, string[]> = {
        email: ['email'],
        sms: ['phone'],
        voice: ['phone'],
        im: ['chat_id', 'user_id'],
        webhook: ['webhook']
      }
      if (instance && !compatibleRecipient[instance.channel].includes(recipient.recipient.kind))
        errors[binding.bindingId] = tx(
          '接收地址类型与实例通道不匹配。',
          'Recipient kind does not match the instance channel.'
        )
    }
    if (recipient.kind === 'member' && !recipient.userId)
      errors[binding.bindingId] = tx('请选择成员。', 'Choose a member.')
    if (recipient.kind === 'member') {
      if (instance?.channel === 'im' || recipient.contactField === 'applicationUserId') {
        errors[binding.bindingId] = tx(
          '通知 v2 暂不支持 IM/APP 成员目标。旧 APP 组请继续使用旧告警流程；应用 userId 不会转换为服务商 user_id/chat_id。',
          'Notification v2 does not support IM/APP member targets yet. Keep legacy APP groups in the legacy alert flow; application user IDs are never converted to provider user_id/chat_id.'
        )
      } else if (instance && !isNotificationMemberContactSupported(instance.channel, recipient.contactField)) {
        errors[binding.bindingId] = tx(
          '成员联系字段与实例通道不匹配。',
          'Member contact field does not match the instance channel.'
        )
      }
    }
    const content = binding.contentBinding
    if (content.kind === 'text' && !content.text.trim())
      errors[binding.bindingId] = tx('请填写文本内容。', 'Enter text content.')
    if (content.kind === 'template') {
      if (!content.templateId.trim() || !content.locale.trim())
        errors[binding.bindingId] = tx('模板 ID 与语言不能为空。', 'Template ID and locale are required.')
      try {
        const parsed = JSON.parse(templateMappings[binding.bindingId] || '{}')
        if (
          !parsed ||
          typeof parsed !== 'object' ||
          Array.isArray(parsed) ||
          Object.values(parsed).some(value => typeof value !== 'string')
        )
          throw new Error()
        content.paramsMapping = parsed
      } catch {
        errors[binding.bindingId] = tx(
          '参数映射必须是字符串值 JSON 对象。',
          'Parameter mapping must be a JSON object with string values.'
        )
      }
    }
  })
  bindingErrors.value = errors
  return Object.keys(errors).length === 0
}

function openCreate() {
  resetDraft()
  editorMode.value = 'create'
  pendingSave.value = null
  selectedGroup.value = null
  addBinding()
  modal.value = true
}

async function openEdit(row: NotificationV2.GroupView) {
  errorText.value = ''
  versionConflict.value = false
  detailController.value?.abort()
  const controller = new AbortController()
  detailController.value = controller
  const generation = ++viewGeneration.value
  try {
    const response = await notificationV2.getGroup(row.id, controller.signal)
    if (generation !== viewGeneration.value) return
    const group = response.data
    resetDraft()
    selectedGroup.value = group
    editorMode.value = isNotificationGroupEditable(group.migrationState) ? 'edit' : 'view'
    pendingSave.value = null
    draftName.value = group.name
    draftEnabled.value = group.enabled
    bindings.value = structuredClone(group.bindings)
    bindings.value.forEach(binding => {
      if (binding.contentBinding.kind === 'template') {
        templateMappings[binding.bindingId] = JSON.stringify(binding.contentBinding.paramsMapping, null, 2)
      }
    })
    modal.value = true
  } catch (error) {
    if (!controller.signal.aborted && !(error instanceof NotificationSessionChangedError))
      errorText.value = error instanceof Error ? error.message : tx('读取通知组失败。', 'Could not load the group.')
  }
}

function buildGroupBody(): NotificationV2.GroupCreate | NotificationV2.GroupUpdate {
  if (!validateBindings()) throw new Error(tx('请修正组配置中的错误。', 'Fix the group configuration errors.'))
  const normalizedBindings = structuredClone(bindings.value)
  normalizedBindings.forEach(binding => {
    binding.instanceId = binding.instanceId.trim()
    if (binding.recipientSource.kind === 'literal')
      binding.recipientSource.recipient.address = binding.recipientSource.recipient.address.trim()
    if (binding.contentBinding.kind === 'text') {
      binding.contentBinding.title = binding.contentBinding.title.trim()
      binding.contentBinding.text = binding.contentBinding.text.trim()
    } else {
      binding.contentBinding.templateId = binding.contentBinding.templateId.trim()
      binding.contentBinding.locale = binding.contentBinding.locale.trim()
    }
  })
  const base = { name: draftName.value.trim(), enabled: draftEnabled.value, bindings: normalizedBindings }
  return editorMode.value === 'edit' ? { ...base, expectedVersion: selectedGroup.value!.version } : base
}

async function saveGroup() {
  if (!capabilities.value.canManage || saving.value || editorMode.value === 'view') return
  errorText.value = ''
  successText.value = ''
  versionConflict.value = false
  if (!pendingSave.value) {
    try {
      const body = buildGroupBody()
      if (
        body.enabled &&
        editorMode.value === 'edit' &&
        !canEnableNotificationGroup(selectedGroup.value!.migrationState)
      ) {
        throw new Error(
          tx('迁移投影未完成，不能启用此组。', 'The group cannot be enabled until migration projection is complete.')
        )
      }
      pendingSave.value = {
        key: notificationV2.createIdempotencyKey(),
        body,
        groupId: editorMode.value === 'edit' ? selectedGroup.value!.id : undefined
      }
    } catch (error) {
      errorText.value =
        error instanceof Error ? error.message : tx('组配置无效。', 'The group configuration is invalid.')
      return
    }
  }
  saving.value = true
  const pending = pendingSave.value
  try {
    if (pending.groupId) {
      await notificationV2.updateGroup(pending.groupId, pending.body as NotificationV2.GroupUpdate, pending.key)
    } else {
      await notificationV2.createGroup(pending.body as NotificationV2.GroupCreate, pending.key)
    }
    pendingSave.value = null
    modal.value = false
    successText.value = tx('通知组已保存。', 'Notification group saved.')
    await loadPage()
  } catch (error) {
    if (error instanceof NotificationClientError && error.outcomeUncertain) {
      errorText.value = tx(
        '保存结果未确认。请使用同一请求重试；系统不会创建第二个版本。',
        'Save result is unknown. Retry the same request; this will not create a second version.'
      )
    } else if (error instanceof NotificationClientError && error.httpStatus === 409) {
      pendingSave.value = null
      versionConflict.value = true
      errorText.value = tx(
        '组版本已被其他管理员修改，请刷新并重新确认。',
        'Another administrator changed this group. Refresh and review before saving again.'
      )
    } else {
      pendingSave.value = null
      errorText.value =
        error instanceof Error ? error.message : tx('保存通知组失败。', 'Could not save notification group.')
      if (error instanceof NotificationClientError) {
        const fields =
          (error.details as { fields?: Array<{ field: string; reason: string }> } | undefined)?.fields || []
        fields.forEach(field => {
          const binding = bindings.value.find(item => field.field.includes(item.bindingId))
          if (binding) bindingErrors.value[binding.bindingId] = field.reason
        })
      }
    }
  } finally {
    saving.value = false
  }
}

async function reloadConflictedGroup() {
  if (!selectedGroup.value) return
  const row = selectedGroup.value
  pendingSave.value = null
  versionConflict.value = false
  await openEdit(row)
}

function closeEditor() {
  if (pendingSave.value) return
  modal.value = false
  resetDraft()
}

const columns: DataTableColumns<NotificationV2.GroupView> = [
  { title: tx('组名称', 'Group'), key: 'name', minWidth: 160 },
  {
    title: tx('状态', 'State'),
    key: 'migrationState',
    minWidth: 180,
    render: row => migrationLabel(row.migrationState)
  },
  { title: 'Revision', key: 'revision', width: 100 },
  { title: 'Version', key: 'version', width: 100 },
  { title: tx('绑定数', 'Bindings'), key: 'bindings', width: 100, render: row => row.bindings.length },
  {
    title: tx('已启用', 'Enabled'),
    key: 'enabled',
    width: 100,
    render: row => (row.enabled ? tx('是', 'Yes') : tx('否', 'No'))
  },
  {
    title: tx('操作', 'Actions'),
    key: 'actions',
    width: 130,
    render: row => (
      <NButton size="small" type="primary" disabled={!capabilities.value.canRead} onClick={() => openEdit(row)}>
        {isNotificationGroupEditable(row.migrationState) && capabilities.value.canManage
          ? tx('编辑', 'Edit')
          : tx('只读查看', 'View only')}
      </NButton>
    )
  }
]

const instanceOptions = computed(() =>
  instances.value
    .filter(instance => instance.enabled)
    .map(instance => {
      const plugin = plugins.value.find(item => item.id === instance.pluginRegistrationId)
      return { label: `${instance.name} · ${plugin?.manifest.name || instance.channel}`, value: instance.id }
    })
)
const previewText = computed(() =>
  bindings.value
    .map((binding, index) => {
      const instance = instances.value.find(item => item.id === binding.instanceId)
      const recipient =
        binding.recipientSource.kind === 'member'
          ? `member:${binding.recipientSource.userId || '—'} (${binding.recipientSource.contactField})`
          : `${binding.recipientSource.recipient.kind}:${binding.recipientSource.recipient.address || '—'}`
      const content =
        binding.contentBinding.kind === 'text'
          ? binding.contentBinding.text || '—'
          : `${binding.contentBinding.templateId || '—'} · ${binding.contentBinding.locale || '—'}`
      return `${index + 1}. ${instance?.name || binding.instanceId || '—'} → ${recipient} → ${content}`
    })
    .join('\n')
)

onMounted(loadPage)
</script>

<template>
  <NCard>
    <div class="flex flex-wrap items-center justify-between gap-12px mb-12px">
      <div>
        <div class="text-lg font-600">{{ tx('Encore 通知组', 'Encore notification groups') }}</div>
        <div class="text-sm opacity-70">
          {{
            tx(
              '新组由通知 v2 管理；旧 APP 组继续由旧告警流程和旧通知配置管理。',
              'New groups use notification v2; legacy APP groups remain managed by the legacy alert flow and notification config.'
            )
          }}
        </div>
      </div>
      <NButton type="primary" :disabled="!capabilities.canManage" @click="openCreate">
        {{ tx('新建通知组', 'Create group') }}
      </NButton>
    </div>
    <NAlert v-if="errorText" type="error" class="mb-12px">{{ errorText }}</NAlert>
    <NAlert v-if="successText" type="success" class="mb-12px">{{ successText }}</NAlert>
    <NAlert v-if="!notificationApiConfigured" type="info" class="mb-12px">
      {{
        tx(
          '通知服务未启用；旧组入口仍可使用。',
          'Notification service is not enabled; the legacy group entry remains available.'
        )
      }}
    </NAlert>
    <NDataTable :columns="columns" :data="rows" :loading="loading" :row-key="row => row.id" :scroll-x="880" />
    <div class="mt-12px flex justify-end">
      <NPagination v-model:page="currentPage" :page-size="pageSize" :item-count="total" @update:page="loadPage" />
    </div>

    <NModal
      v-model:show="modal"
      preset="card"
      :title="
        editorMode === 'create'
          ? tx('新建通知组', 'Create notification group')
          : editorMode === 'view'
            ? tx('通知组只读详情', 'Read-only group details')
            : tx('编辑通知组', 'Edit notification group')
      "
      :style="{ width: 'min(920px, calc(100vw - 24px))' }"
      :mask-closable="!pendingSave"
      :close-on-esc="!pendingSave"
      :closable="!pendingSave"
      @after-leave="closeEditor"
    >
      <NForm label-placement="top">
        <NFormItem
          :label="tx('组名称', 'Group name')"
          :validation-status="bindingErrors.name ? 'error' : undefined"
          :feedback="bindingErrors.name"
        >
          <NInput v-model:value="draftName" :disabled="formReadOnly" />
        </NFormItem>
        <NFormItem :label="tx('启用', 'Enabled')">
          <NSwitch
            v-model:value="draftEnabled"
            :disabled="
              formReadOnly || (selectedGroup ? !canEnableNotificationGroup(selectedGroup.migrationState) : false)
            "
          />
        </NFormItem>
        <NAlert v-if="selectedGroup" type="info" class="mb-12px">
          {{
            tx(
              `revision ${selectedGroup.revision} · version ${selectedGroup.version} · ${migrationLabel(selectedGroup.migrationState)}`,
              `revision ${selectedGroup.revision} · version ${selectedGroup.version} · ${migrationLabel(selectedGroup.migrationState)}`
            )
          }}
        </NAlert>
        <NAlert
          v-if="selectedGroup && selectedGroup.migrationState === 'projection_pending'"
          type="warning"
          class="mb-12px"
        >
          {{
            tx(
              '旧告警组投影尚未完成；此组保持只读且不能启用。',
              'Legacy group projection is pending; this group is read-only and cannot be enabled.'
            )
          }}
        </NAlert>
        <NAlert v-if="selectedGroup?.migrationState === 'legacy_unmigrated'" type="info" class="mb-12px">
          {{
            tx(
              '未迁移旧组保持只读；请关闭详情并切换到“旧通知组”入口编辑。',
              'Unmigrated legacy groups are read-only here. Close this view and use the Legacy groups tab to edit.'
            )
          }}
        </NAlert>
        <NCard v-if="selectedGroup?.sourceProjections?.length" size="small" class="mb-12px">
          <div class="font-600 mb-8px">{{ tx('只读投影记录', 'Read-only source projections') }}</div>
          <div
            v-for="projection in selectedGroup.sourceProjections"
            :key="`${projection.sourceDeploymentId}:${projection.legacyGroupId}:${projection.groupRevision}`"
            class="text-xs break-all mb-4px"
          >
            {{ projection.sourceDeploymentId }} · {{ projection.tenantId }} · {{ projection.legacyGroupId }} → revision
            {{ projection.groupRevision }}
          </div>
        </NCard>
        <NDivider>{{ tx('绑定', 'Bindings') }}</NDivider>
        <NAlert v-if="bindingErrors.bindings" type="error" class="mb-12px">{{ bindingErrors.bindings }}</NAlert>
        <NCard v-for="(binding, index) in bindings" :key="binding.bindingId" size="small" class="mb-12px">
          <div class="flex flex-wrap items-center justify-between gap-8px mb-8px">
            <div class="font-600">
              {{ tx(`绑定 ${index + 1}`, `Binding ${index + 1}`) }} ·
              <code>{{ binding.bindingId }}</code>
            </div>
            <NButton size="tiny" type="error" :disabled="formReadOnly" @click="removeBinding(binding.bindingId)">
              {{ tx('移除', 'Remove') }}
            </NButton>
          </div>
          <NFormItem :label="tx('通知实例', 'Notification instance')">
            <NSelect
              v-model:value="binding.instanceId"
              :options="instanceOptions"
              :disabled="formReadOnly"
              filterable
            />
          </NFormItem>
          <NFormItem :label="tx('目标类型', 'Recipient source')">
            <NSelect
              :value="binding.recipientSource.kind"
              :options="recipientSourceOptions(binding)"
              :disabled="formReadOnly"
              @update:value="value => updateRecipientKind(binding, value as 'literal' | 'member')"
            />
          </NFormItem>
          <template v-if="binding.recipientSource.kind === 'literal'">
            <NFormItem :label="tx('接收地址类型', 'Recipient kind')">
              <NSelect
                v-model:value="binding.recipientSource.recipient.kind"
                :options="[
                  { label: 'Email', value: 'email' },
                  { label: tx('手机号', 'Phone'), value: 'phone' },
                  { label: 'chat_id', value: 'chat_id' },
                  { label: 'user_id', value: 'user_id' },
                  { label: 'Webhook', value: 'webhook' }
                ]"
                :disabled="formReadOnly"
              />
            </NFormItem>
            <NFormItem :label="tx('接收地址', 'Recipient address')">
              <NInput v-model:value="binding.recipientSource.recipient.address" :disabled="formReadOnly" />
            </NFormItem>
          </template>
          <template v-else>
            <NAlert v-if="isUnsupportedMemberTarget(binding)" type="warning" class="mb-12px">
              {{
                tx(
                  '通知 v2 暂不支持 IM/APP 成员目标。旧 APP 组继续在“旧通知组”入口由旧告警流程管理；不会把应用 userId 转换成服务商 user_id/chat_id。',
                  'Notification v2 does not support IM/APP member targets yet. Legacy APP groups remain in the Legacy groups entry; application user IDs are never converted to provider user_id/chat_id.'
                )
              }}
            </NAlert>
            <NFormItem :label="tx('成员', 'Member')">
              <NSelect
                v-model:value="binding.recipientSource.userId"
                :options="memberOptions"
                :loading="memberLoading"
                :disabled="formReadOnly"
                filterable
                remote
                clearable
                @search="searchMembers"
                @focus="searchMembers()"
              />
            </NFormItem>
            <NFormItem :label="tx('联系字段', 'Contact field')">
              <NSelect
                v-model:value="binding.recipientSource.contactField"
                :options="[
                  { label: 'Email', value: 'email' },
                  { label: tx('手机号', 'Phone'), value: 'phone' }
                ]"
                :disabled="formReadOnly"
              />
            </NFormItem>
          </template>
          <NFormItem :label="tx('内容模式', 'Content mode')">
            <NSelect
              :value="binding.contentBinding.kind"
              :options="[
                { label: tx('文本', 'Text'), value: 'text' },
                { label: tx('供应商模板', 'Provider template'), value: 'template' }
              ]"
              :disabled="formReadOnly"
              @update:value="value => updateContentKind(binding, value as 'text' | 'template')"
            />
          </NFormItem>
          <template v-if="binding.contentBinding.kind === 'text'">
            <NFormItem :label="tx('标题', 'Title')">
              <NInput v-model:value="binding.contentBinding.title" :disabled="formReadOnly" />
            </NFormItem>
            <NFormItem :label="tx('文本', 'Text')">
              <NInput
                v-model:value="binding.contentBinding.text"
                type="textarea"
                :autosize="{ minRows: 3, maxRows: 8 }"
                :disabled="formReadOnly"
              />
            </NFormItem>
          </template>
          <template v-else>
            <NFormItem :label="tx('模板 ID', 'Template ID')">
              <NInput v-model:value="binding.contentBinding.templateId" :disabled="formReadOnly" />
            </NFormItem>
            <NFormItem :label="tx('语言', 'Locale')">
              <NInput v-model:value="binding.contentBinding.locale" :disabled="formReadOnly" />
            </NFormItem>
            <NFormItem :label="tx('参数映射 JSON', 'Parameter mapping JSON')">
              <NInput
                v-model:value="templateMappings[binding.bindingId]"
                type="textarea"
                :autosize="{ minRows: 2, maxRows: 6 }"
                :disabled="formReadOnly"
              />
            </NFormItem>
          </template>
          <NAlert v-if="bindingErrors[binding.bindingId]" type="error">{{ bindingErrors[binding.bindingId] }}</NAlert>
        </NCard>
        <NButton dashed :disabled="formReadOnly" @click="addBinding">
          {{ tx('添加绑定', 'Add binding') }}
        </NButton>
        <NDivider>{{ tx('内容预览（不会发送）', 'Preview (does not send)') }}</NDivider>
        <pre class="whitespace-pre-wrap break-all text-xs">{{ previewText || '—' }}</pre>
        <NAlert v-if="errorText" type="error" class="mt-12px">{{ errorText }}</NAlert>
        <NButton v-if="versionConflict" class="mt-12px" @click="reloadConflictedGroup">
          {{ tx('刷新此组后重新确认', 'Refresh this group and review again') }}
        </NButton>
        <div class="flex justify-end gap-8px mt-16px">
          <NButton :disabled="Boolean(pendingSave)" @click="closeEditor">
            {{ editorMode === 'view' ? tx('关闭', 'Close') : tx('取消', 'Cancel') }}
          </NButton>
          <NButton
            v-if="editorMode !== 'view'"
            type="primary"
            :disabled="!capabilities.canManage"
            :loading="saving"
            @click="saveGroup"
          >
            {{ pendingSave ? tx('使用同一请求重试', 'Retry same request') : tx('保存通知组', 'Save group') }}
          </NButton>
        </div>
      </NForm>
    </NModal>
  </NCard>
</template>
