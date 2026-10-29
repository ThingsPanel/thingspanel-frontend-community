<script setup lang="ts">
import { computed, h, onBeforeUnmount, ref, watch } from 'vue'
import { onBeforeRouteLeave, onBeforeRouteUpdate } from 'vue-router'
import type { DataTableColumns } from 'naive-ui'
import {
  NAlert,
  NButton,
  NCheckbox,
  NDataTable,
  NDynamicInput,
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
  useMessage
} from 'naive-ui'
import { $t } from '@/locales'
import {
  templateNative,
  type DeviceAccessTemplate,
  type UpdateDeviceAccessTemplate
} from '@/service/api/template-native'
import {
  buildCustomFieldUpsert,
  clearTemplateCustomFieldAttempt,
  createTemplateCustomFieldAttempt,
  getTemplateCustomFieldAttempt,
  getTemplateCustomFieldSessionGeneration,
  isCurrentTemplateCustomFieldSession,
  makeCustomFieldChanges,
  makeNewCustomFieldDefinition,
  markTemplateCustomFieldUnknown,
  parseCustomFieldDefault,
  shouldRetainTemplateCustomFieldAttempt,
  syncTemplateCustomFieldSession,
  templateCustomFieldErrorStatus,
  validateNewCustomField,
  type CustomFieldDefinition,
  type CustomFieldEnumValue,
  type CustomFieldSaveAttempt,
  type CustomFieldType
} from '@/service/api/template-custom-fields-state'
import { nativeCredentialIdentityParts } from '@/views/device/details/modules/native-device-credentials-flow'
import { useAuthStore } from '@/store/modules/auth'

interface Props {
  id: string
}

interface FieldForm {
  key: string
  name: string
  type: CustomFieldType
  defaultText: string
  defaultIsNull: boolean
  booleanDefault: boolean | null
  description: string
  descriptionIsNull: boolean
  enabled: boolean
  enumValues: CustomFieldEnumValue[]
}

const props = defineProps<Props>()
const emit = defineEmits<{ change: [] }>()
const authStore = useAuthStore()
const message = useMessage()
const template = ref<DeviceAccessTemplate | null>(null)
const etag = ref('')
const loading = ref(false)
const loadError = ref('')
const saving = ref(false)
const editorVisible = ref(false)
const editingKey = ref<string | null>(null)
const editBaseline = ref<CustomFieldDefinition | null>(null)
const dirtyFields = new Set<keyof CustomFieldDefinition>()
const form = ref<FieldForm>(defaultForm())
const formError = ref('')
const pendingAttempt = ref<CustomFieldSaveAttempt | null>(null)
let localSequence = 0
let activeTemplateId = props.id
let disposed = false

function defaultForm(): FieldForm {
  return {
    key: '',
    name: '',
    type: 'string',
    defaultText: '',
    defaultIsNull: false,
    booleanDefault: false,
    description: '',
    descriptionIsNull: true,
    enabled: false,
    enumValues: []
  }
}

function cloneDefinition(definition: CustomFieldDefinition): CustomFieldDefinition {
  return { ...definition, enumValues: definition.enumValues.map(value => ({ ...value })) }
}

const definitions = computed(() => template.value?.configuration.customFieldDefinitions || [])
const typeOptions = [
  { label: 'String', value: 'string' },
  { label: 'Number', value: 'number' },
  { label: 'Boolean', value: 'boolean' },
  { label: 'Enum', value: 'enum' }
]

function loadForm(definition?: CustomFieldDefinition) {
  dirtyFields.clear()
  formError.value = ''
  if (!definition) {
    editingKey.value = null
    editBaseline.value = null
    form.value = defaultForm()
    return
  }
  editingKey.value = definition.key
  editBaseline.value = cloneDefinition(definition)
  form.value = {
    key: definition.key,
    name: definition.name,
    type: definition.type,
    defaultText: definition.defaultValue === null ? '' : String(definition.defaultValue),
    defaultIsNull: definition.defaultValue === null,
    booleanDefault: typeof definition.defaultValue === 'boolean' ? definition.defaultValue : null,
    description: definition.description ?? '',
    descriptionIsNull: definition.description === null,
    enabled: definition.enabled,
    enumValues: definition.enumValues.map(value => ({ ...value }))
  }
}

function currentSessionIs(generation: number, templateId: string, sequence?: number) {
  return (
    isCurrentTemplateCustomFieldSession(generation) &&
    !disposed &&
    props.id === templateId &&
    activeTemplateId === templateId &&
    (sequence === undefined || sequence === localSequence)
  )
}

async function loadTemplate(templateId = props.id, preserveEditor = false) {
  const sequence = ++localSequence
  const sessionGeneration = getTemplateCustomFieldSessionGeneration()
  loading.value = true
  loadError.value = ''
  try {
    const result = await templateNative.get(templateId)
    if (!currentSessionIs(sessionGeneration, templateId, sequence)) return
    template.value = result.template
    etag.value = result.etag
    if (pendingAttempt.value?.templateId === templateId) {
      pendingAttempt.value = getTemplateCustomFieldAttempt(templateId) || null
    }
    if (preserveEditor && editingKey.value) {
      const latest = result.template.configuration.customFieldDefinitions.find(item => item.key === editingKey.value)
      if (latest) editBaseline.value = cloneDefinition(latest)
    }
  } catch (error) {
    if (currentSessionIs(sessionGeneration, templateId, sequence)) {
      loadError.value = error instanceof Error ? error.message : '扩展信息加载失败。'
    }
  } finally {
    if (currentSessionIs(sessionGeneration, templateId, sequence)) loading.value = false
  }
}

function openCreate() {
  loadForm()
  editorVisible.value = true
}

function openEdit(row: CustomFieldDefinition) {
  loadForm(row)
  editorVisible.value = true
}

function markDirty(field: keyof CustomFieldDefinition) {
  dirtyFields.add(field)
}

function changeType(type: CustomFieldType) {
  if (form.value.type === type) return
  form.value.type = type
  dirtyFields.add('type')
  dirtyFields.add('defaultValue')
  dirtyFields.add('enumValues')
  if (type === 'string') {
    form.value.defaultText = ''
    form.value.defaultIsNull = false
    form.value.booleanDefault = null
    form.value.enumValues = []
  } else if (type === 'number') {
    form.value.defaultText = '0'
    form.value.defaultIsNull = false
    form.value.booleanDefault = null
    form.value.enumValues = []
  } else if (type === 'boolean') {
    form.value.defaultText = ''
    form.value.defaultIsNull = false
    form.value.booleanDefault = false
    form.value.enumValues = []
  } else {
    form.value.enumValues = [{ value: 'option-1', label: 'Option 1' }]
    form.value.defaultText = 'option-1'
    form.value.defaultIsNull = false
    form.value.booleanDefault = null
  }
}

function parsedDefault(): string | number | boolean | null {
  return parseCustomFieldDefault(form.value.type, {
    text: form.value.defaultText,
    isNull: form.value.defaultIsNull,
    booleanValue: form.value.booleanDefault
  })
}

function fullNewDefinition(): CustomFieldDefinition {
  const key = form.value.key
  const enumValues =
    form.value.type === 'enum' ? form.value.enumValues.map(value => ({ value: value.value, label: value.label })) : []
  const defaultValue = parsedDefault()
  return makeNewCustomFieldDefinition({
    key,
    name: form.value.name,
    type: form.value.type,
    defaultValue,
    description: form.value.descriptionIsNull ? null : form.value.description,
    enumValues
  })
}

function editedDefinitionChanges(): ReturnType<typeof buildCustomFieldUpsert> {
  const baseline = editBaseline.value
  if (!baseline) throw new Error('编辑的字段已失效，请重新打开。')
  const proposed: Partial<CustomFieldDefinition> = {}
  for (const key of dirtyFields) {
    if (key === 'name') proposed.name = form.value.name
    else if (key === 'type') proposed.type = form.value.type
    else if (key === 'defaultValue') proposed.defaultValue = parsedDefault()
    else if (key === 'description') proposed.description = form.value.descriptionIsNull ? null : form.value.description
    else if (key === 'enabled') proposed.enabled = form.value.enabled
    else if (key === 'enumValues')
      proposed.enumValues = form.value.type === 'enum' ? form.value.enumValues.map(value => ({ ...value })) : []
  }
  return buildCustomFieldUpsert(baseline, proposed)
}

async function submitEditor() {
  if (saving.value || pendingAttempt.value) return
  formError.value = ''
  try {
    let changes: ReturnType<typeof makeCustomFieldChanges>
    if (editingKey.value) {
      if (
        form.value.type === 'enum' &&
        (dirtyFields.has('enumValues') || dirtyFields.has('type') || dirtyFields.has('defaultValue'))
      ) {
        const values = form.value.enumValues.map(value => value.value)
        if (
          values.length === 0 ||
          form.value.enumValues.some(value => !value.value.trim() || !value.label.trim()) ||
          new Set(values).size !== values.length
        ) {
          formError.value = '枚举选项的值和名称必须非空，且值需唯一。'
          return
        }
        if (!form.value.defaultIsNull && !values.includes(form.value.defaultText)) {
          formError.value = '请先选择一个属于当前枚举选项的默认值。'
          return
        }
      }
      const upsert = editedDefinitionChanges()
      if (Object.keys(upsert).length === 1) {
        message.info('没有需要保存的更改。')
        editorVisible.value = false
        return
      }
      changes = makeCustomFieldChanges([upsert])
    } else {
      const created = fullNewDefinition()
      const validation = validateNewCustomField(created, definitions.value)
      if (validation) {
        formError.value = validation
        return
      }
      changes = makeCustomFieldChanges([created])
    }
    await beginSave(changes)
  } catch (error) {
    formError.value = error instanceof Error ? error.message : '扩展信息输入无效。'
  }
}

function closeEditor() {
  if (pendingAttempt.value) return
  editorVisible.value = false
  loadForm()
}

async function toggleEnabled(row: CustomFieldDefinition, enabled: boolean) {
  if (saving.value || pendingAttempt.value) return
  const change = buildCustomFieldUpsert(row, { enabled })
  if (Object.keys(change).length === 1) return
  await beginSave(makeCustomFieldChanges([change]))
}

async function deleteDefinition(row: CustomFieldDefinition) {
  if (saving.value || pendingAttempt.value) return
  await beginSave(makeCustomFieldChanges([], [row.key]))
}

async function beginSave(payload: ReturnType<typeof makeCustomFieldChanges>) {
  if (!etag.value || !props.id) {
    message.error('模板尚未读取，暂时不能保存。')
    return
  }
  const generation = getTemplateCustomFieldSessionGeneration()
  const attempt = createTemplateCustomFieldAttempt(
    props.id,
    payload,
    etag.value,
    globalThis.crypto.randomUUID(),
    generation
  )
  pendingAttempt.value = attempt
  await sendAttempt(attempt)
}

async function retryUnknown() {
  const attempt = pendingAttempt.value || getTemplateCustomFieldAttempt(props.id)
  if (!attempt || saving.value || !attempt.previouslyUnknown) return
  pendingAttempt.value = attempt
  await sendAttempt(attempt)
}

async function sendAttempt(attempt: CustomFieldSaveAttempt) {
  if (saving.value) return
  const generation = attempt.generation
  const templateId = attempt.templateId
  saving.value = true
  formError.value = ''
  try {
    const result = await templateNative.update(
      templateId,
      { customFieldChanges: attempt.payload } as UpdateDeviceAccessTemplate,
      attempt.etag,
      attempt.key
    )
    if (!currentSessionIs(generation, templateId)) return
    clearTemplateCustomFieldAttempt(templateId, generation)
    pendingAttempt.value = null
    etag.value = result.etag
    template.value = result.template
    editorVisible.value = false
    loadForm()
    message.success('扩展信息已保存。')
    emit('change')
    await loadTemplate(templateId)
  } catch (error) {
    if (!currentSessionIs(generation, templateId)) return
    const status = templateCustomFieldErrorStatus(error)
    if (!shouldRetainTemplateCustomFieldAttempt(status, attempt.previouslyUnknown)) {
      clearTemplateCustomFieldAttempt(templateId, generation)
      pendingAttempt.value = null
      if (status === 412) {
        message.warning('模板已变化，输入内容已保留；已刷新最新字段，请检查后重新提交。')
        await loadTemplate(templateId, true)
      } else if (status === 409) {
        const conflictMessage = '设备已有字段值，无法删除或应用此更改。可先停用字段，或清理设备上的对应字段值。'
        if (editorVisible.value) formError.value = conflictMessage
        message.error(conflictMessage)
      } else {
        const rejection = error instanceof Error ? error.message : '字段更改未被接受，请检查输入。'
        if (editorVisible.value) formError.value = rejection
        else message.error(rejection)
      }
      return
    }
    const retained = markTemplateCustomFieldUnknown(templateId, generation)
    pendingAttempt.value = retained || attempt
    message.error('保存结果尚未确认。请重试同一请求；请求内容和并发标识保持不变。')
  } finally {
    if (currentSessionIs(generation, templateId)) saving.value = false
  }
}

function formatDefault(row: CustomFieldDefinition): string {
  if (row.defaultValue === null) return 'null'
  if (row.type === 'enum')
    return row.enumValues.find(value => value.value === row.defaultValue)?.label || String(row.defaultValue)
  return String(row.defaultValue)
}

const columns: DataTableColumns<CustomFieldDefinition> = [
  { title: $t('page.manage.menu.form.name'), key: 'name', minWidth: 140 },
  { title: 'Key', key: 'key', minWidth: 140 },
  {
    title: $t('page.manage.menu.form.type'),
    key: 'type',
    minWidth: 100,
    render: row => typeOptions.find(item => item.value === row.type)?.label || row.type
  },
  { title: $t('generate.default-value'), key: 'defaultValue', minWidth: 140, render: row => formatDefault(row) },
  {
    title: $t('custom.groupPage.description'),
    key: 'description',
    minWidth: 160,
    render: row => row.description ?? '—'
  },
  {
    title: '枚举选项',
    key: 'enumValues',
    minWidth: 180,
    render: row => (row.type === 'enum' ? row.enumValues.map(item => `${item.label} (${item.value})`).join('、') : '—')
  },
  {
    title: $t('page.manage.common.status.enable'),
    key: 'enabled',
    minWidth: 100,
    render: row =>
      h(NSwitch, {
        value: row.enabled,
        disabled: saving.value || Boolean(pendingAttempt.value),
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
            { size: 'small', disabled: saving.value || Boolean(pendingAttempt.value), onClick: () => openEdit(row) },
            { default: () => $t('common.edit') }
          ),
          h(
            NPopconfirm,
            { onPositiveClick: () => deleteDefinition(row) },
            {
              default: () => $t('common.confirmDelete'),
              trigger: () =>
                h(
                  NButton,
                  { size: 'small', type: 'error', disabled: saving.value || Boolean(pendingAttempt.value) },
                  { default: () => $t('common.delete') }
                )
            }
          )
        ]
      })
  }
]

const enumDefaultOptions = computed(() => [
  { label: '无默认值', value: '' },
  ...form.value.enumValues.map(value => ({ label: `${value.label} (${value.value})`, value: value.value }))
])
const booleanDefaultOptions = [
  { label: 'false', value: 'false' },
  { label: 'true', value: 'true' },
  { label: 'null', value: 'null' }
]
const booleanDefaultSelection = computed(() =>
  form.value.booleanDefault === null ? 'null' : form.value.booleanDefault ? 'true' : 'false'
)

function selectBooleanDefault(value: string | null) {
  form.value.booleanDefault = value === 'null' ? null : value === 'true'
  markDirty('defaultValue')
}

function selectEnumDefault(value: string | null) {
  form.value.defaultText = value ?? ''
  form.value.defaultIsNull = value === '' || value === null
  markDirty('defaultValue')
}

function updateDefaultText(value: string) {
  form.value.defaultText = value
  form.value.defaultIsNull = false
  markDirty('defaultValue')
}

function makeEnumValue(): CustomFieldEnumValue {
  const next = form.value.enumValues.length + 1
  return { value: `option-${next}`, label: `Option ${next}` }
}

function guardPendingNavigation(): boolean {
  const attempt = getTemplateCustomFieldAttempt(props.id) || pendingAttempt.value
  if (!attempt) return true
  message.warning('此字段更改结果尚未确认；请先在当前标签重试同一请求。')
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
    const changed = syncTemplateCustomFieldSession(Boolean(loggedIn), subjectId, tenantId)
    if (changed) {
      localSequence += 1
      pendingAttempt.value = null
      saving.value = false
      loading.value = false
      template.value = null
      etag.value = ''
      editorVisible.value = false
      loadForm()
      void loadTemplate()
    } else {
      pendingAttempt.value = getTemplateCustomFieldAttempt(props.id) || null
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
    etag.value = ''
    editorVisible.value = false
    loadForm()
    pendingAttempt.value = getTemplateCustomFieldAttempt(id) || null
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
      模板 {{ pendingAttempt.templateId }} 的扩展信息保存结果尚未确认。
      <NButton v-if="!saving" size="small" type="warning" :disabled="saving" class="ml-2" @click="retryUnknown">
        重试同一请求
      </NButton>
    </NAlert>
    <NAlert v-if="loadError" type="error" :show-icon="false" class="mb-3">{{ loadError }}</NAlert>
    <NSpin :show="loading">
      <NSpace vertical>
        <NSpace justify="end">
          <NButton type="primary" :disabled="loading || !template || Boolean(pendingAttempt)" @click="openCreate">
            {{ $t('generate.add-extension-info') }}
          </NButton>
        </NSpace>
        <NDataTable :columns="columns" :data="definitions" :row-key="row => row.key" :pagination="false">
          <template #empty><NEmpty size="small" :description="$t('common.noData')" /></template>
        </NDataTable>
      </NSpace>
    </NSpin>

    <NModal
      v-model:show="editorVisible"
      preset="card"
      :mask-closable="false"
      :closable="!pendingAttempt"
      :title="editingKey ? $t('common.editExtendedInfo') : $t('common.addExtendedInfo')"
      style="width: min(760px, 94vw)"
      @after-leave="
        () => {
          if (!pendingAttempt) loadForm()
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
        <NFormItem label="Key" required>
          <NInput
            v-model:value="form.key"
            :disabled="Boolean(editingKey) || Boolean(pendingAttempt)"
            placeholder="例如 sensor_range"
          />
        </NFormItem>
        <NFormItem :label="$t('page.manage.menu.form.name')" required>
          <NInput v-model:value="form.name" :disabled="Boolean(pendingAttempt)" @update:value="markDirty('name')" />
        </NFormItem>
        <NFormItem :label="$t('generate.type')" required>
          <NSelect
            :value="form.type"
            :options="typeOptions"
            :disabled="Boolean(pendingAttempt)"
            @update:value="changeType"
          />
        </NFormItem>
        <NFormItem :label="$t('generate.default-value')">
          <NSelect
            v-if="form.type === 'boolean'"
            :value="booleanDefaultSelection"
            :options="booleanDefaultOptions"
            :disabled="Boolean(pendingAttempt)"
            @update:value="selectBooleanDefault"
          />
          <NSelect
            v-else-if="form.type === 'enum'"
            :value="form.defaultText"
            :options="enumDefaultOptions"
            :disabled="Boolean(pendingAttempt)"
            @update:value="selectEnumDefault"
          />
          <NInput
            v-else
            :value="form.defaultText"
            :input-props="form.type === 'number' ? { inputmode: 'decimal' } : undefined"
            :disabled="Boolean(pendingAttempt)"
            @update:value="updateDefaultText"
          />
          <NCheckbox
            v-if="form.type === 'string'"
            v-model:checked="form.defaultIsNull"
            class="ml-3"
            :disabled="Boolean(pendingAttempt)"
            @update:checked="markDirty('defaultValue')"
          >
            无默认值
          </NCheckbox>
        </NFormItem>
        <NFormItem v-if="form.type === 'enum'" label="枚举选项" required>
          <NDynamicInput
            v-model:value="form.enumValues"
            :on-create="makeEnumValue"
            :disabled="Boolean(pendingAttempt)"
            @update:value="markDirty('enumValues')"
          >
            <template #default="{ value }">
              <NSpace class="w-full">
                <NInput
                  v-model:value="value.value"
                  :disabled="Boolean(pendingAttempt)"
                  placeholder="选项值"
                  @update:value="markDirty('enumValues')"
                />
                <NInput
                  v-model:value="value.label"
                  :disabled="Boolean(pendingAttempt)"
                  placeholder="显示名称"
                  @update:value="markDirty('enumValues')"
                />
              </NSpace>
            </template>
          </NDynamicInput>
        </NFormItem>
        <NFormItem :label="$t('custom.groupPage.description')">
          <NSpace vertical class="w-full">
            <NInput
              v-model:value="form.description"
              type="textarea"
              :disabled="Boolean(pendingAttempt)"
              @update:value="
                () => {
                  form.descriptionIsNull = false
                  markDirty('description')
                }
              "
            />
            <NCheckbox
              v-model:checked="form.descriptionIsNull"
              :disabled="Boolean(pendingAttempt)"
              @update:checked="markDirty('description')"
            >
              保存为 null
            </NCheckbox>
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
