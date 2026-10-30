<script setup lang="ts">
import { computed, h, ref } from 'vue'
import { NButton, NPopconfirm } from 'naive-ui'
import ModelModal from './components/ModelModal.vue'
import { fromNativeField, toNativeFieldFromEditor } from './native-field-mapping'
import type { FieldKind, ModelDraft, ModelField } from '@/service/api/thingmodel-native-transport'

type FormRecord = Record<string, any>
type FieldTab = { kind: FieldKind; label: string }

const props = withDefaults(defineProps<{ model: ModelDraft; saving?: boolean }>(), { saving: false })
const emit = defineEmits<{ save: [model: ModelDraft, onSuccess: () => void] }>()

const tabs: FieldTab[] = [
  { kind: 'TELEMETRY', label: '遥测' },
  { kind: 'ATTRIBUTE', label: '属性' },
  { kind: 'EVENT', label: '事件' },
  { kind: 'COMMAND', label: '命令' }
]
const activeKind = ref<FieldKind>('TELEMETRY')
const activeKindLabel = computed(() => tabs.find(tab => tab.kind === activeKind.value)?.label || '字段')
const editing = ref(false)
const form = ref<FormRecord>({})
const formError = ref('')
const selectedKey = ref<string | null>(null)
const params = ref<FormRecord[]>([])
const booleanEnumOptions: any = [
  { label: 'False', value: false },
  { label: 'True', value: true }
]

const currentFields = computed(() => props.model.fields.filter(field => field.kind === activeKind.value))
const displayName = (field: ModelField) => field.nameI18n.default
const displayParams = (field: ModelField) =>
  'parameters' in field && field.parameters ? field.parameters.items.map(item => item.nameI18n.default).join(', ') : ''
function displaySummary(field: ModelField): string {
  if ('parameters' in field && field.parameters) return displayParams(field)
  return 'valueType' in field && field.valueType ? field.valueType.kind : ''
}
const fieldKey = (field: ModelField) => field.fieldID || `${field.kind}:${field.identifier}`

function openNew() {
  selectedKey.value = null
  formError.value = ''
  form.value = {
    kind: activeKind.value,
    type: activeKind.value,
    data_name: '',
    data_identifier: '',
    description: '',
    description_i18n: undefined,
    enum_base: 'String',
    additional_info: []
  }
  if (activeKind.value === 'EVENT' || activeKind.value === 'COMMAND') params.value = []
  else form.value = { ...form.value, data_type: 'String', read_write_flag: 'R' }
  editing.value = true
}

function openEdit(field: ModelField) {
  try {
    const mapped = fromNativeField(field)
    selectedKey.value = fieldKey(field)
    form.value = { ...mapped }
    form.value.enum_base = Array.isArray(mapped.additional_info)
      ? (mapped.additional_info[0]?.value_type ?? 'String')
      : 'String'
    params.value = Array.isArray(mapped.params) ? mapped.params : JSON.parse((mapped.params as string) || '[]')
    params.value = params.value.map(parameter => ({
      ...parameter,
      enum_config: Array.isArray(parameter.enum_config)
        ? parameter.enum_config.map(row => ({
            value_type: parameter.data_type || 'String',
            value: row.value,
            description: row.desc,
            label: row.label
          }))
        : []
    }))
    formError.value = ''
    editing.value = true
  } catch (error) {
    console.error('读取物模型字段失败:', error)
    window.$message?.error('字段定义无法读取，请刷新后重试。')
  }
}

function addParameter() {
  params.value.push({
    data_name: '',
    data_identifier: '',
    param_type: 'String',
    read_write_flag: 'String',
    data_type: 'String',
    description: '',
    enum_config: []
  })
}

function removeParameter(index: number) {
  params.value.splice(index, 1)
}

function updateParameterKind(parameter: FormRecord, value: string) {
  if (activeKind.value === 'COMMAND') parameter.param_type = value
  else parameter.read_write_flag = value
}

function addEnumRow(rows: FormRecord[], baseKind: string) {
  rows.push({
    value_type: baseKind,
    value: baseKind === 'Boolean' ? false : baseKind === 'Number' ? null : '',
    description: ''
  })
}

function finishEdit() {
  editing.value = false
  formError.value = ''
  selectedKey.value = null
  params.value = []
  form.value = {}
}

function saveField() {
  try {
    if (activeKind.value === 'TELEMETRY' && selectedKey.value !== null && form.value.read_write_flag === 'RW') {
      formError.value = '此遥测字段已有可写权限，为避免改变现有语义，请改用命令定义控制操作；本次未保存。'
      return
    }
    const outgoing = { ...form.value }
    if (activeKind.value === 'TELEMETRY' && selectedKey.value === null) outgoing.read_write_flag = 'R'
    if ((activeKind.value === 'TELEMETRY' || activeKind.value === 'ATTRIBUTE') && outgoing.data_type === 'Enum') {
      outgoing.additional_info = (outgoing.additional_info as FormRecord[]).map(row => ({
        ...row,
        value_type: outgoing.enum_base
      }))
    }
    if (activeKind.value === 'EVENT' || activeKind.value === 'COMMAND') {
      outgoing.params = JSON.stringify(
        params.value.map(parameter => ({
          ...parameter,
          enum_config:
            parameter.param_type === 'Enum' || parameter.read_write_flag === 'Enum'
              ? parameter.enum_config.map(row => ({ value: row.value, desc: row.description, label: row.label }))
              : []
        }))
      )
      outgoing.paramsOrigin = outgoing.params
    }
    const nextField = toNativeFieldFromEditor(activeKind.value, outgoing)
    const nextFields = [...props.model.fields]
    const oldIndex =
      selectedKey.value === null ? -1 : nextFields.findIndex(field => fieldKey(field) === selectedKey.value)
    if (oldIndex < 0) nextFields.push(nextField)
    else nextFields[oldIndex] = nextField
    emit('save', { ...props.model, fields: nextFields }, finishEdit)
  } catch (error) {
    formError.value = error instanceof Error ? error.message : '字段内容无效，未保存'
  }
}

function removeField(field: ModelField) {
  emit(
    'save',
    { ...props.model, fields: props.model.fields.filter(item => fieldKey(item) !== fieldKey(field)) },
    () => {}
  )
}
</script>

<template>
  <div class="native-model-definition">
    <n-tabs v-model:value="activeKind" type="line">
      <n-tab-pane v-for="tab in tabs" :key="tab.kind" :name="tab.kind" :tab="tab.label">
        <div class="toolbar">
          <n-button type="primary" :disabled="saving" @click="openNew">新增{{ tab.label }}</n-button>
        </div>
        <n-data-table
          :columns="[
            { title: '名称', key: 'nameI18n', render: (row: ModelField) => displayName(row) },
            { title: '标识符', key: 'identifier' },
            {
              title: tab.kind === 'EVENT' || tab.kind === 'COMMAND' ? '参数' : '数据类型',
              key: 'summary',
              render: displaySummary
            },
            { title: '单位', key: 'unit', render: (row: ModelField) => ('unit' in row ? (row.unit ?? '') : '') },
            { title: '说明', key: 'descriptionI18n', render: (row: ModelField) => row.descriptionI18n?.default ?? '' },
            {
              title: '操作',
              key: 'actions',
              render: (row: ModelField) =>
                h('div', { class: 'actions' }, [
                  h(
                    NButton,
                    { quaternary: true, type: 'primary', disabled: saving, onClick: () => openEdit(row) },
                    { default: () => '编辑' }
                  ),
                  h(
                    NPopconfirm,
                    { onPositiveClick: () => removeField(row) },
                    {
                      default: () => '确认删除此字段？',
                      trigger: () =>
                        h(NButton, { quaternary: true, type: 'error', disabled: saving }, { default: () => '删除' })
                    }
                  )
                ])
            }
          ]"
          :data="currentFields"
          :row-key="fieldKey"
          :scroll-x="760"
        />
      </n-tab-pane>
    </n-tabs>

    <ModelModal
      v-model:show="editing"
      :title="`${selectedKey ? '编辑' : '新增'}${activeKindLabel}`"
      :width="760"
      :busy="saving"
      class="field-modal"
    >
      <n-alert v-if="formError" type="error" :show-icon="false" class="error">{{ formError }}</n-alert>
      <n-form :model="form" label-placement="top" :disabled="saving" class="field-grid" @submit.prevent>
        <n-form-item label="名称" required>
          <n-input v-model:value="form.data_name" placeholder="请输入名称" :input-props="{ 'aria-label': '名称' }" />
        </n-form-item>
        <n-form-item label="标识符" required>
          <n-input
            v-model:value="form.data_identifier"
            placeholder="请输入唯一标识符"
            :input-props="{ 'aria-label': '标识符' }"
          />
        </n-form-item>
        <template v-if="activeKind === 'TELEMETRY' || activeKind === 'ATTRIBUTE'">
          <n-form-item label="数据类型">
            <n-select
              v-model:value="form.data_type"
              :options="['Number', 'String', 'Boolean', 'Enum'].map(value => ({ label: value, value }))"
            />
          </n-form-item>
          <n-form-item v-if="activeKind === 'ATTRIBUTE'" label="读写权限">
            <n-select
              v-model:value="form.read_write_flag"
              :options="[
                { label: '只读', value: 'R' },
                { label: '读写', value: 'RW' }
              ]"
            />
          </n-form-item>
          <n-form-item v-if="activeKind === 'TELEMETRY'" label="读写权限">
            <n-input value="只读（遥测数据由设备上报）" disabled :input-props="{ 'aria-label': '遥测只读' }" />
          </n-form-item>
          <n-alert
            v-if="activeKind === 'TELEMETRY' && form.read_write_flag === 'RW'"
            type="warning"
            :show-icon="false"
            class="field-wide error"
          >
            此遥测字段当前允许写入；保存后会按遥测上报语义改为只读。
          </n-alert>
          <template v-if="form.data_type === 'Enum'">
            <n-form-item label="枚举值类型" class="field-wide">
              <n-select
                v-model:value="form.enum_base"
                :disabled="saving || form.additional_info.length > 0"
                :options="['String', 'Number', 'Boolean'].map(value => ({ label: value, value }))"
              />
            </n-form-item>
            <div class="enum-list field-wide">
              <div class="section-heading">
                <strong>枚举值</strong>
                <n-button size="small" :disabled="saving" @click="addEnumRow(form.additional_info, form.enum_base)">
                  添加枚举
                </n-button>
              </div>
              <div v-for="(row, index) in form.additional_info" :key="index" class="enum-row">
                <n-input v-if="form.enum_base === 'String'" v-model:value="row.value" placeholder="枚举值" />
                <n-input-number
                  v-else-if="form.enum_base === 'Number'"
                  v-model:value="row.value"
                  placeholder="枚举值"
                />
                <n-select v-else v-model:value="row.value" :options="booleanEnumOptions" />
                <n-input v-model:value="row.description" placeholder="枚举说明" />
                <n-button quaternary type="error" :disabled="saving" @click="form.additional_info.splice(index, 1)">
                  删除
                </n-button>
              </div>
            </div>
          </template>
          <n-form-item label="单位" class="field-wide">
            <n-input
              v-model:value="form.unit"
              placeholder="例如 °C、%（选填）"
              :input-props="{ 'aria-label': '单位' }"
            />
          </n-form-item>
        </template>
        <template v-else>
          <div class="section-heading field-wide">
            <strong>{{ activeKind === 'COMMAND' ? '命令参数' : '事件参数' }}</strong>
            <n-button size="small" :disabled="saving" @click="addParameter">添加参数</n-button>
          </div>
          <div v-for="(parameter, index) in params" :key="parameter.id ?? index" class="parameter-card field-wide">
            <div class="section-heading">
              <strong>参数 {{ index + 1 }}</strong>
              <n-button quaternary type="error" size="small" :disabled="saving" @click="removeParameter(index)">
                移除
              </n-button>
            </div>
            <div class="parameter-row">
              <n-form-item label="参数名称" :show-feedback="false">
                <n-input
                  v-model:value="parameter.data_name"
                  placeholder="请输入参数名称"
                  :input-props="{ 'aria-label': '参数名称' }"
                  :disabled="saving"
                />
              </n-form-item>
              <n-form-item label="参数标识符" :show-feedback="false">
                <n-input
                  v-model:value="parameter.data_identifier"
                  placeholder="请输入参数标识符"
                  :input-props="{ 'aria-label': '参数标识符' }"
                  :disabled="saving"
                />
              </n-form-item>
              <n-form-item label="数据类型" :show-feedback="false">
                <n-select
                  :value="activeKind === 'COMMAND' ? parameter.param_type : parameter.read_write_flag"
                  :disabled="saving"
                  :options="['String', 'Number', 'Boolean', 'Enum'].map(value => ({ label: value, value }))"
                  @update:value="updateParameterKind(parameter, $event as string)"
                />
              </n-form-item>
              <n-form-item label="说明" :show-feedback="false">
                <n-input
                  v-model:value="parameter.description"
                  placeholder="请输入参数说明（选填）"
                  :input-props="{ 'aria-label': '参数说明' }"
                  :disabled="saving"
                />
              </n-form-item>
            </div>
            <template v-if="(activeKind === 'COMMAND' ? parameter.param_type : parameter.read_write_flag) === 'Enum'">
              <n-form-item label="枚举值类型" class="parameter-enum-type" :show-feedback="false">
                <n-select
                  v-model:value="parameter.data_type"
                  :disabled="saving || parameter.enum_config.length > 0"
                  :options="['String', 'Number', 'Boolean'].map(value => ({ label: value, value }))"
                  placeholder="枚举值类型"
                />
              </n-form-item>
              <div class="enum-list">
                <div class="section-heading">
                  <strong>枚举值</strong>
                  <n-button
                    size="small"
                    :disabled="saving"
                    @click="addEnumRow(parameter.enum_config, parameter.data_type)"
                  >
                    添加枚举
                  </n-button>
                </div>
                <div v-for="(enumRow, enumIndex) in parameter.enum_config" :key="enumIndex" class="enum-row">
                  <n-input v-if="parameter.data_type === 'String'" v-model:value="enumRow.value" placeholder="枚举值" />
                  <n-input-number
                    v-else-if="parameter.data_type === 'Number'"
                    v-model:value="enumRow.value"
                    placeholder="枚举值"
                  />
                  <n-select v-else v-model:value="enumRow.value" :options="booleanEnumOptions" />
                  <n-input v-model:value="enumRow.description" placeholder="枚举说明" />
                  <n-button
                    quaternary
                    type="error"
                    :disabled="saving"
                    @click="parameter.enum_config.splice(enumIndex, 1)"
                  >
                    删除
                  </n-button>
                </div>
              </div>
            </template>
          </div>
        </template>
        <n-form-item label="说明" class="field-wide">
          <n-input
            v-model:value="form.description"
            type="textarea"
            placeholder="请输入字段说明（选填）"
            :autosize="{ minRows: 3, maxRows: 6 }"
            :input-props="{ 'aria-label': '说明' }"
            :disabled="saving"
          />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-button :disabled="saving" @click="editing = false">取消</n-button>
        <n-button type="primary" :loading="saving" :disabled="saving" @click="saveField">保存字段</n-button>
      </template>
    </ModelModal>
  </div>
</template>

<style scoped lang="scss">
.toolbar {
  display: flex;
  justify-content: flex-start;
  margin: 12px 0;
}
.field-grid,
.parameter-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  column-gap: 20px;
}
.field-grid :deep(.n-form-item) {
  min-width: 0;
}
.field-wide {
  grid-column: 1 / -1;
}
.section-heading {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}
.section-heading strong {
  font-size: 14px;
  font-weight: 600;
}
.parameter-card {
  min-width: 0;
  padding: 16px;
  margin-bottom: 16px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--body-color);
}
.parameter-row {
  gap: 12px;
}
.parameter-enum-type {
  margin-top: 16px;
}
.enum-list {
  display: grid;
  gap: 8px;
  min-width: 0;
  width: 100%;
  margin-bottom: 16px;
}
.enum-list .section-heading {
  margin: 0;
}
.parameter-card .enum-list {
  margin-top: 16px;
  margin-bottom: 0;
}
.enum-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr)) auto;
  gap: 8px;
  align-items: start;
}
.error {
  margin-bottom: 16px;
}
.actions {
  display: flex;
  justify-content: center;
  gap: 8px;
}
@media (max-width: 600px) {
  .field-grid,
  .parameter-row {
    grid-template-columns: minmax(0, 1fr);
  }
  .parameter-card {
    padding: 12px;
  }
  .enum-row {
    grid-template-columns: minmax(0, 1fr) auto;
  }
  .enum-row > :nth-child(2) {
    grid-column: 1;
    grid-row: 2;
  }
  .enum-row > :last-child {
    grid-column: 2;
    grid-row: 1 / span 2;
  }
}
</style>
