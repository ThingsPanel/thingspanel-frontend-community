<script setup lang="ts">
import { computed, h, onBeforeUnmount, ref, watch } from 'vue'
import { onBeforeRouteLeave, onBeforeRouteUpdate } from 'vue-router'
import type { DataTableColumns } from 'naive-ui'
import {
  NAlert,
  NButton,
  NDataTable,
  NEmpty,
  NForm,
  NFormItem,
  NInput,
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
  clearTemplateConfigurationAttempt,
  configurationErrorStatus,
  createTemplateConfigurationAttempt,
  getTemplateConfigurationAttempt,
  getTemplateConfigurationSessionGeneration,
  isCurrentTemplateConfigurationSession,
  markTemplateConfigurationUnknown,
  shouldRetainConfigurationAttempt,
  syncTemplateConfigurationSession,
  type TemplateConfigurationAttempt
} from '@/service/api/template-configuration-attempt'
import {
  PROCESSING_PHASES,
  PROCESSING_ENTRYPOINT,
  PROCESSING_LANGUAGE,
  buildProcessingScriptsConfiguration,
  makeProcessingScript,
  processingPhaseLabel,
  removeProcessingScript,
  setProcessingScriptEnabled,
  upsertProcessingScript,
  validateProcessingScript,
  type ProcessingPhase,
  type ProcessingScript
} from '@/service/api/template-processing-scripts-state'
import { canManageDeviceGroups } from '@/service/api/device-group-editor-state'
import { nativeCredentialIdentityParts } from '@/views/device/details/modules/native-device-credentials-flow'
import { useAuthStore } from '@/store/modules/auth'

interface Props {
  id: string
}

interface ScriptForm {
  id: string
  name: string
  phase: ProcessingPhase
  content: string
  lastSampleInput: string
  enabled: boolean
  description: string
}

async function runDebug() {
  const f = form.value
  debugging.value = true
  debugResult.value = null
  try {
    const result = await templateNative.testProcessingScript({
      script: {
        id: f.id || 'debug',
        name: f.name || 'debug',
        description: null,
        phase: f.phase,
        language: 'lua',
        entrypoint: 'encodeInp',
        content: f.content,
        enabled: f.enabled,
        lastSampleInput: null
      },
      input: f.lastSampleInput,
      topic: debugTopic.value,
      templateId: template.value?.id ?? null
    })
    debugResult.value = result.succeeded
      ? { ok: true, text: `${result.output ?? ''}\n（${result.durationMs} ms，${result.engineVersion}）` }
      : { ok: false, text: `${result.errorCode}：${result.message}（${result.durationMs} ms）` }
  } catch (error) {
    debugResult.value = { ok: false, text: error instanceof Error ? error.message : String(error) }
  } finally {
    debugging.value = false
  }
}

const props = defineProps<Props>()
const emit = defineEmits<{ change: [] }>()
const authStore = useAuthStore()
const message = useMessage()

const MEMBER = 'processingScripts' as const

const template = ref<DeviceAccessTemplate | null>(null)
const rawText = ref('')
const etag = ref('')
const loading = ref(false)
const loadError = ref('')
const saving = ref(false)
const editorVisible = ref(false)
const editingId = ref<string | null>(null)
const debugTopic = ref('')
const debugging = ref(false)
const debugResult = ref<{ ok: boolean; text: string } | null>(null)
const form = ref<ScriptForm>(emptyForm())
const formError = ref('')
const pendingAttempt = ref<TemplateConfigurationAttempt | null>(null)
let localSequence = 0
let activeTemplateId = props.id
let disposed = false

const canWrite = computed(() => canManageDeviceGroups(authStore.userInfo.roles))
const scripts = computed<ProcessingScript[]>(() => template.value?.configuration?.processingScripts ?? [])
const busy = computed(() => saving.value || Boolean(pendingAttempt.value))

const phaseOptions = PROCESSING_PHASES.map(option => ({
  label: `${option.legacyCode} · ${option.label}`,
  value: option.value
}))

function emptyForm(): ScriptForm {
  const script = makeProcessingScript('')
  return {
    id: '',
    name: '',
    phase: script.phase,
    content: '',
    lastSampleInput: '',
    enabled: false,
    description: ''
  }
}

function toForm(script: ProcessingScript): ScriptForm {
  return {
    id: script.id,
    name: script.name,
    phase: script.phase,
    content: script.content,
    lastSampleInput: script.lastSampleInput ?? '',
    enabled: script.enabled,
    description: script.description ?? ''
  }
}

function fromForm(value: ScriptForm): ProcessingScript {
  const description = value.description.trim()
  const sample = value.lastSampleInput.trim()
  return {
    id: value.id,
    name: value.name.trim(),
    description: description === '' ? null : description,
    phase: value.phase,
    language: PROCESSING_LANGUAGE,
    entrypoint: PROCESSING_ENTRYPOINT,
    content: value.content,
    enabled: value.enabled,
    lastSampleInput: sample === '' ? null : value.lastSampleInput
  }
}

function currentSessionIs(generation: number, templateId: string, sequence?: number) {
  return (
    isCurrentTemplateConfigurationSession(generation) &&
    !disposed &&
    props.id === templateId &&
    activeTemplateId === templateId &&
    (sequence === undefined || sequence === localSequence)
  )
}

async function loadTemplate(templateId = props.id) {
  const sequence = ++localSequence
  const generation = getTemplateConfigurationSessionGeneration()
  loading.value = true
  loadError.value = ''
  try {
    const result = await templateNative.getRaw(templateId)
    if (!currentSessionIs(generation, templateId, sequence)) return
    template.value = result.template
    rawText.value = result.rawText
    etag.value = result.etag
    pendingAttempt.value = getTemplateConfigurationAttempt(templateId, MEMBER) ?? null
  } catch (error) {
    if (currentSessionIs(generation, templateId, sequence)) {
      loadError.value = error instanceof Error ? error.message : '数据处理配置加载失败。'
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

function openEdit(script: ProcessingScript) {
  form.value = toForm(script)
  editingId.value = script.id
  formError.value = ''
  editorVisible.value = true
}

function closeEditor() {
  if (pendingAttempt.value) return
  editorVisible.value = false
  editingId.value = null
  formError.value = ''
}

async function submitEditor() {
  if (busy.value) return
  formError.value = ''
  const candidate = fromForm(form.value)
  const validation = validateProcessingScript(candidate, { existing: scripts.value })
  if (validation) {
    formError.value = validation
    return
  }
  await beginSave(upsertProcessingScript(scripts.value, candidate))
}

async function toggleEnabled(script: ProcessingScript, enabled: boolean) {
  if (busy.value) return
  if (enabled) {
    const conflict = scripts.value.find(item => item.id !== script.id && item.phase === script.phase && item.enabled)
    if (conflict) {
      message.error(`同一处理阶段只能有一条启用的脚本；请先停用「${conflict.name || conflict.id}」。`)
      return
    }
  }
  await beginSave(setProcessingScriptEnabled(scripts.value, script.id, enabled))
}

async function deleteScript(script: ProcessingScript) {
  if (busy.value) return
  await beginSave(removeProcessingScript(scripts.value, script.id))
}

async function beginSave(next: ProcessingScript[]) {
  if (!etag.value || !rawText.value || !props.id) {
    message.error('模板尚未读取，暂时不能保存。')
    return
  }
  let configurationJson: string
  try {
    configurationJson = buildProcessingScriptsConfiguration(rawText.value, next)
  } catch (error) {
    message.error(error instanceof Error ? error.message : '无法生成配置内容。')
    return
  }
  const generation = getTemplateConfigurationSessionGeneration()
  const attempt = createTemplateConfigurationAttempt(
    props.id,
    MEMBER,
    configurationJson,
    etag.value,
    globalThis.crypto.randomUUID(),
    generation
  )
  pendingAttempt.value = attempt
  await sendAttempt(attempt)
}

async function retryUnknown() {
  const attempt = pendingAttempt.value || getTemplateConfigurationAttempt(props.id, MEMBER)
  if (!attempt || saving.value || !attempt.previouslyUnknown) return
  pendingAttempt.value = attempt
  await sendAttempt(attempt)
}

async function sendAttempt(attempt: TemplateConfigurationAttempt) {
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
    clearTemplateConfigurationAttempt(templateId, MEMBER, generation)
    pendingAttempt.value = null
    template.value = result.template
    etag.value = result.etag
    editorVisible.value = false
    editingId.value = null
    message.success('数据处理脚本已保存。')
    emit('change')
    await loadTemplate(templateId)
  } catch (error) {
    if (!currentSessionIs(generation, templateId)) return
    const status = configurationErrorStatus(error)
    if (!shouldRetainConfigurationAttempt(status, attempt.previouslyUnknown)) {
      clearTemplateConfigurationAttempt(templateId, MEMBER, generation)
      pendingAttempt.value = null
      if (status === 412) {
        message.warning('模板已被修改，输入内容已保留；已重新读取最新配置，请确认后再次提交。')
        await loadTemplate(templateId)
      } else if (status === 409) {
        const conflict = '模板当前状态不允许此更改，请刷新后重试。'
        if (editorVisible.value) formError.value = conflict
        message.error(conflict)
      } else {
        const rejection = error instanceof Error ? error.message : '数据处理脚本未被接受，请检查输入。'
        if (editorVisible.value) formError.value = rejection
        else message.error(rejection)
      }
      return
    }
    const retained = markTemplateConfigurationUnknown(templateId, MEMBER, generation)
    pendingAttempt.value = retained || attempt
    message.error('保存结果尚未确认。请重试同一请求；请求内容和并发标识保持不变。')
  } finally {
    if (currentSessionIs(generation, templateId)) saving.value = false
  }
}

function contentSummary(script: ProcessingScript): string {
  const firstLine = script.content.split('\n').find(line => line.trim() !== '') ?? ''
  const trimmed = firstLine.trim()
  return trimmed.length > 60 ? `${trimmed.slice(0, 60)}…` : trimmed || '—'
}

const columns: DataTableColumns<ProcessingScript> = [
  { title: $t('page.manage.menu.form.name'), key: 'name', minWidth: 140 },
  {
    title: '处理阶段',
    key: 'phase',
    minWidth: 170,
    render: row =>
      h(
        NTag,
        { size: 'small', type: 'info' },
        {
          default: () => {
            const option = PROCESSING_PHASES.find(item => item.value === row.phase)
            return option ? `${option.legacyCode} · ${option.label}` : processingPhaseLabel(row.phase)
          }
        }
      )
  },
  { title: '脚本内容', key: 'content', minWidth: 240, render: row => contentSummary(row) },
  {
    title: '执行契约',
    key: 'entrypoint',
    minWidth: 150,
    render: row => `${row.language} · ${row.entrypoint}`
  },
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
            { onPositiveClick: () => deleteScript(row) },
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
  const attempt = getTemplateConfigurationAttempt(props.id, MEMBER) || pendingAttempt.value
  if (!attempt) return true
  message.warning('此数据处理脚本保存结果尚未确认；请先在当前标签重试同一请求。')
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
    const changed = syncTemplateConfigurationSession(Boolean(loggedIn), subjectId, tenantId)
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
      pendingAttempt.value = getTemplateConfigurationAttempt(props.id, MEMBER) ?? null
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
    pendingAttempt.value = getTemplateConfigurationAttempt(id, MEMBER) ?? null
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
      模板 {{ pendingAttempt.templateId }} 的数据处理脚本保存结果尚未确认。
      <NButton v-if="!saving" size="small" type="warning" :disabled="saving" class="ml-2" @click="retryUnknown">
        重试同一请求
      </NButton>
    </NAlert>
    <NAlert v-if="loadError" type="error" :show-icon="false" class="mb-3">{{ loadError }}</NAlert>

    <NSpin :show="loading">
      <NSpace vertical>
        <NAlert v-if="!canWrite" type="info" :show-icon="false">当前账号没有设备模板写权限，本页仅可查看。</NAlert>
        <NAlert type="info" :show-icon="false">
          六个处理阶段各允许一条启用脚本；脚本语言为 lua，入口函数固定为 encodeInp。脚本与模板当前配置一起保存。
        </NAlert>

        <NSpace justify="space-between" align="center">
          <span class="text-gray-500">
            调试运行在隔离沙箱中执行：1 秒、约 32 MiB、输出 256 KiB 上限，只能使用 json 模块，不会向设备下发。
          </span>
          <NButton type="primary" :disabled="!canWrite || loading || !template || busy" @click="openCreate">
            新增处理脚本
          </NButton>
        </NSpace>

        <NDataTable :columns="columns" :data="scripts" :row-key="row => row.id" :pagination="false">
          <template #empty><NEmpty size="small" description="此模板当前没有数据处理脚本。" /></template>
        </NDataTable>
      </NSpace>
    </NSpin>

    <NModal
      v-model:show="editorVisible"
      preset="card"
      :mask-closable="false"
      :closable="!pendingAttempt"
      :title="editingId ? '编辑处理脚本' : '新增处理脚本'"
      style="width: min(860px, 94vw)"
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
          <NInput v-model:value="form.name" :disabled="Boolean(pendingAttempt)" placeholder="例如 上行遥测解码" />
        </NFormItem>
        <NFormItem label="处理阶段" required>
          <NSelect v-model:value="form.phase" :options="phaseOptions" :disabled="Boolean(pendingAttempt)" />
        </NFormItem>
        <NFormItem label="脚本内容" required>
          <NInput
            v-model:value="form.content"
            type="textarea"
            :rows="14"
            :disabled="Boolean(pendingAttempt)"
            placeholder="function encodeInp(msg, topic) ... end"
            style="font-family: Consolas, 'Courier New', monospace"
          />
        </NFormItem>
        <NFormItem label="示例输入">
          <NInput
            v-model:value="form.lastSampleInput"
            type="textarea"
            :rows="3"
            :disabled="Boolean(pendingAttempt)"
            placeholder="留空表示 null；用于记录上次调试输入"
          />
        </NFormItem>
        <NFormItem label="调试运行">
          <NSpace vertical style="width: 100%">
            <NInput v-model:value="debugTopic" placeholder="调试用主题 topic，可留空" />
            <NButton :loading="debugging" :disabled="!form.content.trim()" @click="runDebug">用示例输入运行</NButton>
            <NAlert v-if="debugResult" :type="debugResult.ok ? 'success' : 'error'" :show-icon="false">
              <pre style="margin: 0; white-space: pre-wrap; overflow-wrap: anywhere">{{ debugResult.text }}</pre>
            </NAlert>
          </NSpace>
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
          <NSpace vertical>
            <NSwitch v-model:value="form.enabled" :disabled="Boolean(pendingAttempt)" />
            <span class="text-gray-500">同一处理阶段只能有一条启用的脚本。</span>
          </NSpace>
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
