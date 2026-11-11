<script setup lang="ts">
import { computed, h, onBeforeUnmount, ref, watch } from 'vue'
import { onBeforeRouteLeave, onBeforeRouteUpdate } from 'vue-router'
import type { DataTableColumns } from 'naive-ui'
import {
  NAlert,
  NButton,
  NDataTable,
  NDescriptions,
  NDescriptionsItem,
  NEmpty,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NModal,
  NPopconfirm,
  NSelect,
  NSpace,
  NSpin,
  NSwitch,
  NTag,
  useMessage
} from 'naive-ui'
import { $t } from '@/locales'
import { templateNative, type DeviceAccessTemplate } from '@/service/api/template-native'
import {
  buildTopicMappingsConfiguration,
  clearTemplateTopicAttempt,
  createTemplateTopicAttempt,
  getTemplateTopicAttempt,
  getTemplateTopicSessionGeneration,
  isCurrentTemplateTopicSession,
  markTemplateTopicUnknown,
  removeTopicMapping,
  setTopicMappingEnabled,
  shouldRetainTemplateTopicAttempt,
  syncTemplateTopicSession,
  topicMappingErrorStatus,
  upsertTopicMapping,
  validateTopicMapping,
  type TopicDataKind,
  type TopicDirection,
  type TopicMapping,
  type TopicMappingSaveAttempt
} from '@/service/api/template-topic-mappings-state'
import { canManageDeviceGroups } from '@/service/api/device-group-editor-state'
import { nativeCredentialIdentityParts } from '@/views/device/details/modules/native-device-credentials-flow'
import { useAuthStore } from '@/store/modules/auth'

interface Props {
  id: string
}

interface MappingForm {
  id: string
  name: string
  direction: TopicDirection
  sourceTopic: string
  targetTopic: string
  dataKind: TopicDataKind | null
  dataIdentifier: string
  priority: number
  enabled: boolean
  description: string
}

const props = defineProps<Props>()
const emit = defineEmits<{ change: [] }>()
const authStore = useAuthStore()
const message = useMessage()

const template = ref<DeviceAccessTemplate | null>(null)
const rawText = ref('')
const etag = ref('')
const loading = ref(false)
const loadError = ref('')
const saving = ref(false)
const editorVisible = ref(false)
const editingId = ref<string | null>(null)
const form = ref<MappingForm>(emptyForm())
const formError = ref('')
const pendingAttempt = ref<TopicMappingSaveAttempt | null>(null)
let localSequence = 0
let activeTemplateId = props.id
let disposed = false

const canWrite = computed(() => canManageDeviceGroups(authStore.userInfo.roles))
const configuration = computed(() => template.value?.configuration ?? null)
const access = computed(() => configuration.value?.access ?? null)
const mappings = computed<TopicMapping[]>(() => configuration.value?.topicMappings ?? [])
const hasModel = computed(() => Boolean(configuration.value?.model))
const busy = computed(() => saving.value || Boolean(pendingAttempt.value))

const directionOptions = [
  { label: '上行（设备 → 平台）', value: 'up' },
  { label: '下行（平台 → 设备）', value: 'down' }
]

const dataKindOptions = [
  { label: '不绑定物模型字段', value: '' },
  { label: '遥测 TELEMETRY', value: 'TELEMETRY' },
  { label: '属性 ATTRIBUTE', value: 'ATTRIBUTE' },
  { label: '事件 EVENT', value: 'EVENT' },
  { label: '命令 COMMAND', value: 'COMMAND' }
]

function emptyForm(): MappingForm {
  return {
    id: '',
    name: '',
    direction: 'up',
    sourceTopic: '',
    targetTopic: '',
    dataKind: null,
    dataIdentifier: '',
    priority: 100,
    enabled: true,
    description: ''
  }
}

function toForm(mapping: TopicMapping): MappingForm {
  return {
    id: mapping.id,
    name: mapping.name,
    direction: mapping.direction,
    sourceTopic: mapping.sourceTopic,
    targetTopic: mapping.targetTopic,
    dataKind: mapping.dataKind,
    dataIdentifier: mapping.dataIdentifier ?? '',
    priority: mapping.priority,
    enabled: mapping.enabled,
    description: mapping.description ?? ''
  }
}

function fromForm(value: MappingForm): TopicMapping {
  const description = value.description.trim()
  return {
    id: value.id,
    name: value.name.trim(),
    description: description === '' ? null : description,
    direction: value.direction,
    sourceTopic: value.sourceTopic.trim(),
    targetTopic: value.targetTopic.trim(),
    dataKind: value.dataKind,
    dataIdentifier: value.dataKind ? value.dataIdentifier.trim() : null,
    priority: value.priority,
    enabled: value.enabled
  }
}

function currentSessionIs(generation: number, templateId: string, sequence?: number) {
  return (
    isCurrentTemplateTopicSession(generation) &&
    !disposed &&
    props.id === templateId &&
    activeTemplateId === templateId &&
    (sequence === undefined || sequence === localSequence)
  )
}

async function loadTemplate(templateId = props.id) {
  const sequence = ++localSequence
  const generation = getTemplateTopicSessionGeneration()
  loading.value = true
  loadError.value = ''
  try {
    const result = await templateNative.getRaw(templateId)
    if (!currentSessionIs(generation, templateId, sequence)) return
    template.value = result.template
    rawText.value = result.rawText
    etag.value = result.etag
    if (pendingAttempt.value?.templateId === templateId) {
      pendingAttempt.value = getTemplateTopicAttempt(templateId) || null
    }
  } catch (error) {
    if (currentSessionIs(generation, templateId, sequence)) {
      loadError.value = error instanceof Error ? error.message : '协议配置加载失败。'
    }
  } finally {
    if (currentSessionIs(generation, templateId, sequence)) loading.value = false
  }
}

function openCreate() {
  form.value = { ...emptyForm(), id: globalThis.crypto.randomUUID() }
  editingId.value = null
  formError.value = ''
  editorVisible.value = true
}

function openEdit(mapping: TopicMapping) {
  form.value = toForm(mapping)
  editingId.value = mapping.id
  formError.value = ''
  editorVisible.value = true
}

function closeEditor() {
  if (pendingAttempt.value) return
  editorVisible.value = false
  editingId.value = null
  formError.value = ''
}

function selectDataKind(value: string | null) {
  form.value.dataKind = value ? (value as TopicDataKind) : null
  if (!value) form.value.dataIdentifier = ''
}

async function submitEditor() {
  if (busy.value) return
  formError.value = ''
  const candidate = fromForm(form.value)
  const validation = validateTopicMapping(candidate, { hasModel: hasModel.value, existing: mappings.value })
  if (validation) {
    formError.value = validation
    return
  }
  await beginSave(upsertTopicMapping(mappings.value, candidate))
}

async function toggleEnabled(mapping: TopicMapping, enabled: boolean) {
  if (busy.value) return
  await beginSave(setTopicMappingEnabled(mappings.value, mapping.id, enabled))
}

async function deleteMapping(mapping: TopicMapping) {
  if (busy.value) return
  await beginSave(removeTopicMapping(mappings.value, mapping.id))
}

async function beginSave(next: TopicMapping[]) {
  if (!etag.value || !rawText.value || !props.id) {
    message.error('模板尚未读取，暂时不能保存。')
    return
  }
  let configurationJson: string
  try {
    configurationJson = buildTopicMappingsConfiguration(rawText.value, next)
  } catch (error) {
    message.error(error instanceof Error ? error.message : '无法生成配置内容。')
    return
  }
  const generation = getTemplateTopicSessionGeneration()
  const attempt = createTemplateTopicAttempt(
    props.id,
    configurationJson,
    etag.value,
    globalThis.crypto.randomUUID(),
    generation
  )
  pendingAttempt.value = attempt
  await sendAttempt(attempt)
}

async function retryUnknown() {
  const attempt = pendingAttempt.value || getTemplateTopicAttempt(props.id)
  if (!attempt || saving.value || !attempt.previouslyUnknown) return
  pendingAttempt.value = attempt
  await sendAttempt(attempt)
}

async function sendAttempt(attempt: TopicMappingSaveAttempt) {
  if (saving.value) return
  const generation = attempt.generation
  const templateId = attempt.templateId
  saving.value = true
  formError.value = ''
  try {
    const result = await templateNative.replaceConfiguration(
      templateId,
      attempt.configurationJson,
      attempt.etag,
      attempt.key
    )
    if (!currentSessionIs(generation, templateId)) return
    clearTemplateTopicAttempt(templateId, generation)
    pendingAttempt.value = null
    template.value = result.template
    etag.value = result.etag
    editorVisible.value = false
    editingId.value = null
    message.success('Topic 映射已保存。')
    emit('change')
    await loadTemplate(templateId)
  } catch (error) {
    if (!currentSessionIs(generation, templateId)) return
    const status = topicMappingErrorStatus(error)
    if (!shouldRetainTemplateTopicAttempt(status, attempt.previouslyUnknown)) {
      clearTemplateTopicAttempt(templateId, generation)
      pendingAttempt.value = null
      if (status === 412) {
        message.warning('模板已被修改，输入内容已保留；已重新读取最新配置，请确认后再次提交。')
        await loadTemplate(templateId)
      } else if (status === 409) {
        const conflict = '模板当前状态不允许此更改，请刷新后重试。'
        if (editorVisible.value) formError.value = conflict
        message.error(conflict)
      } else {
        const rejection = error instanceof Error ? error.message : 'Topic 映射未被接受，请检查输入。'
        if (editorVisible.value) formError.value = rejection
        else message.error(rejection)
      }
      return
    }
    const retained = markTemplateTopicUnknown(templateId, generation)
    pendingAttempt.value = retained || attempt
    message.error('保存结果尚未确认。请重试同一请求；请求内容和并发标识保持不变。')
  } finally {
    if (currentSessionIs(generation, templateId)) saving.value = false
  }
}

function formatDataReference(mapping: TopicMapping): string {
  if (!mapping.dataKind || !mapping.dataIdentifier) return '—'
  return `${mapping.dataKind}:${mapping.dataIdentifier}`
}

const columns: DataTableColumns<TopicMapping> = [
  { title: $t('page.manage.menu.form.name'), key: 'name', minWidth: 140 },
  {
    title: '方向',
    key: 'direction',
    minWidth: 110,
    render: row =>
      h(
        NTag,
        { size: 'small', type: row.direction === 'up' ? 'success' : 'info' },
        { default: () => (row.direction === 'up' ? '上行' : '下行') }
      )
  },
  { title: '源主题', key: 'sourceTopic', minWidth: 200 },
  { title: '目标主题', key: 'targetTopic', minWidth: 160 },
  { title: '数据引用', key: 'dataKind', minWidth: 180, render: row => formatDataReference(row) },
  { title: '优先级', key: 'priority', minWidth: 90 },
  {
    title: $t('custom.groupPage.description'),
    key: 'description',
    minWidth: 140,
    render: row => row.description ?? '—'
  },
  {
    title: $t('page.manage.common.status.enable'),
    key: 'enabled',
    minWidth: 100,
    render: row =>
      h(NSwitch, {
        value: row.enabled,
        disabled: !canWrite.value || busy.value,
        onUpdateValue: value => toggleEnabled(row, value)
      })
  },
  {
    title: $t('common.actions'),
    key: 'actions',
    minWidth: 170,
    render: row =>
      h(NSpace, null, {
        default: () => [
          h(
            NButton,
            { size: 'small', disabled: !canWrite.value || busy.value, onClick: () => openEdit(row) },
            { default: () => $t('common.edit') }
          ),
          h(
            NPopconfirm,
            { onPositiveClick: () => deleteMapping(row) },
            {
              default: () => $t('common.confirmDelete'),
              trigger: () =>
                h(
                  NButton,
                  { size: 'small', type: 'error', disabled: !canWrite.value || busy.value },
                  { default: () => $t('common.delete') }
                )
            }
          )
        ]
      })
  }
]

function guardPendingNavigation(): boolean {
  const attempt = getTemplateTopicAttempt(props.id) || pendingAttempt.value
  if (!attempt) return true
  message.warning('此 Topic 映射保存结果尚未确认；请先在当前标签重试同一请求。')
  return false
}

onBeforeRouteLeave(() => guardPendingNavigation())
onBeforeRouteUpdate((to, from) => {
  if (String(to.query.id || '') !== String(from.query.id || '') && !guardPendingNavigation()) return false
})

const identity = computed(() => nativeCredentialIdentityParts(authStore.userInfo))
watch(
  [() => Boolean(authStore.token), () => identity.value.subjectId, () => identity.value.tenantId],
  ([loggedIn, subjectId, tenantId]) => {
    const changed = syncTemplateTopicSession(Boolean(loggedIn), subjectId, tenantId)
    if (changed) {
      localSequence += 1
      pendingAttempt.value = null
      saving.value = false
      loading.value = false
      template.value = null
      rawText.value = ''
      etag.value = ''
      editorVisible.value = false
      void loadTemplate()
    } else {
      pendingAttempt.value = getTemplateTopicAttempt(props.id) || null
      if (!template.value) void loadTemplate()
    }
  },
  { immediate: true, flush: 'sync' }
)

watch(
  () => props.id,
  id => {
    if (id === activeTemplateId) return
    activeTemplateId = id
    localSequence += 1
    pendingAttempt.value = null
    saving.value = false
    loading.value = false
    template.value = null
    rawText.value = ''
    etag.value = ''
    editorVisible.value = false
    pendingAttempt.value = getTemplateTopicAttempt(id) || null
    void loadTemplate(id)
  },
  { flush: 'sync' }
)

onBeforeUnmount(() => {
  disposed = true
  localSequence += 1
})
</script>

<template>
  <div>
    <NAlert v-if="pendingAttempt" type="warning" :show-icon="false" class="mb-3">
      模板 {{ pendingAttempt.templateId }} 的 Topic 映射保存结果尚未确认。
      <NButton v-if="!saving" size="small" type="warning" :disabled="saving" class="ml-2" @click="retryUnknown">
        重试同一请求
      </NButton>
    </NAlert>
    <NAlert v-if="loadError" type="error" :show-icon="false" class="mb-3">{{ loadError }}</NAlert>

    <NSpin :show="loading">
      <NSpace vertical>
        <NAlert v-if="!canWrite" type="info" :show-icon="false">当前账号没有设备模板写权限，本页仅可查看。</NAlert>

        <NDescriptions v-if="access" bordered :column="2" size="small" title="接入信息">
          <NDescriptionsItem label="接入方式">{{ access.mode }}</NDescriptionsItem>
          <NDescriptionsItem label="协议">{{ access.protocol }}</NDescriptionsItem>
          <NDescriptionsItem label="Provider ID">{{ access.providerId || '—' }}</NDescriptionsItem>
          <NDescriptionsItem label="Service Instance ID">{{ access.serviceInstanceId || '—' }}</NDescriptionsItem>
          <NDescriptionsItem label="连接方向">
            {{ access.connectionDirection === 'platform_to_device' ? '平台 → 设备' : '设备 → 平台' }}
          </NDescriptionsItem>
          <NDescriptionsItem label="凭据类型">{{ access.credentialPolicy.kind }}</NDescriptionsItem>
          <NDescriptionsItem label="自动注册">
            {{ access.credentialPolicy.autoRegister ? '是' : '否' }}
          </NDescriptionsItem>
          <NDescriptionsItem label="在线判定">
            {{ access.onlinePolicy.mode }} / {{ access.onlinePolicy.timeoutSeconds }} 秒
          </NDescriptionsItem>
        </NDescriptions>

        <NSpace justify="space-between" align="center">
          <span class="text-gray-500">
            Topic 映射与模板当前配置一起保存；协议插件参数由连接器能力提供，不在本页编辑。
          </span>
          <NButton type="primary" :disabled="!canWrite || loading || !template || busy" @click="openCreate">
            新增 Topic 映射
          </NButton>
        </NSpace>

        <NDataTable :columns="columns" :data="mappings" :row-key="row => row.id" :pagination="false">
          <template #empty><NEmpty size="small" description="此模板当前没有 Topic 映射。" /></template>
        </NDataTable>
      </NSpace>
    </NSpin>

    <NModal
      v-model:show="editorVisible"
      preset="card"
      :mask-closable="false"
      :closable="!pendingAttempt"
      :title="editingId ? '编辑 Topic 映射' : '新增 Topic 映射'"
      style="width: min(760px, 94vw)"
      @after-leave="
        () => {
          if (!pendingAttempt) {
            editingId = null
            formError = ''
          }
        }
      "
    >
      <NForm label-placement="left" label-width="120px">
        <NAlert v-if="pendingAttempt" type="warning" :show-icon="false" class="mb-3">
          请求结果尚未确认，表单已锁定并保留原始内容。
          <NButton v-if="!saving" size="small" type="warning" :disabled="saving" class="ml-2" @click="retryUnknown">
            重试同一请求
          </NButton>
        </NAlert>
        <NAlert v-if="formError" type="error" :show-icon="false" class="mb-3">{{ formError }}</NAlert>
        <NFormItem :label="$t('page.manage.menu.form.name')" required>
          <NInput v-model:value="form.name" :disabled="Boolean(pendingAttempt)" placeholder="例如 上行遥测" />
        </NFormItem>
        <NFormItem label="方向" required>
          <NSelect v-model:value="form.direction" :options="directionOptions" :disabled="Boolean(pendingAttempt)" />
        </NFormItem>
        <NFormItem label="源主题" required>
          <NInput v-model:value="form.sourceTopic" :disabled="Boolean(pendingAttempt)" placeholder="devices/+/up" />
        </NFormItem>
        <NFormItem label="目标主题" required>
          <NInput v-model:value="form.targetTopic" :disabled="Boolean(pendingAttempt)" placeholder="telemetry" />
        </NFormItem>
        <NFormItem label="数据引用">
          <NSpace vertical class="w-full">
            <NSelect
              :value="form.dataKind ?? ''"
              :options="dataKindOptions"
              :disabled="Boolean(pendingAttempt) || !hasModel"
              @update:value="selectDataKind"
            />
            <NInput
              v-if="form.dataKind"
              v-model:value="form.dataIdentifier"
              :disabled="Boolean(pendingAttempt)"
              placeholder="物模型字段标识，例如 temperature"
            />
            <span v-if="!hasModel" class="text-gray-500">模板未选择物模型版本，不能绑定数据字段。</span>
          </NSpace>
        </NFormItem>
        <NFormItem label="优先级">
          <NInputNumber v-model:value="form.priority" :min="0" :max="10000" :disabled="Boolean(pendingAttempt)" />
        </NFormItem>
        <NFormItem :label="$t('custom.groupPage.description')">
          <NInput
            v-model:value="form.description"
            type="textarea"
            :disabled="Boolean(pendingAttempt)"
            placeholder="留空表示 null"
          />
        </NFormItem>
        <NFormItem :label="$t('page.manage.common.status.enable')">
          <NSwitch v-model:value="form.enabled" :disabled="Boolean(pendingAttempt)" />
        </NFormItem>
        <NSpace justify="end">
          <NButton :disabled="saving || Boolean(pendingAttempt)" @click="closeEditor">
            {{ $t('generate.cancel') }}
          </NButton>
          <NButton type="primary" :loading="saving" :disabled="Boolean(pendingAttempt)" @click="submitEditor">
            {{ $t('page.login.common.confirm') }}
          </NButton>
        </NSpace>
      </NForm>
    </NModal>
  </div>
</template>
