<script setup lang="ts">
import { computed, h, ref } from 'vue'
import { NButton, NPopconfirm } from 'naive-ui'
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
const editing = ref(false)
const form = ref<FormRecord>({})
const formError = ref('')
const selectedKey = ref<string | null>(null)
const params = ref<FormRecord[]>([])
const booleanEnumOptions: any = [{ label: 'False', value: false }, { label: 'True', value: true }]

const currentFields = computed(() => props.model.fields.filter(field => field.kind === activeKind.value))
const displayName = (field: ModelField) => field.nameI18n.default
const displayParams = (field: ModelField) => 'parameters' in field && field.parameters ? field.parameters.items.map(item => item.nameI18n.default).join(', ') : ''
function displaySummary(field: ModelField): string {
  if ('parameters' in field && field.parameters) return displayParams(field)
  return 'valueType' in field && field.valueType ? field.valueType.kind : ''
}
const fieldKey = (field: ModelField) => field.fieldID || `${field.kind}:${field.identifier}`

function openNew() {
  selectedKey.value = null
  formError.value = ''
  form.value = { kind: activeKind.value, type: activeKind.value, data_name: '', data_identifier: '', description: '', description_i18n: undefined, enum_base: 'String', additional_info: [] }
  if (activeKind.value === 'EVENT' || activeKind.value === 'COMMAND') params.value = []
  else form.value = { ...form.value, data_type: 'String', read_write_flag: 'R' }
  editing.value = true
}

function openEdit(field: ModelField) {
  try {
    const mapped = fromNativeField(field)
    selectedKey.value = fieldKey(field)
    form.value = { ...mapped }
    form.value.enum_base = Array.isArray(mapped.additional_info) ? mapped.additional_info[0]?.value_type ?? 'String' : 'String'
    params.value = Array.isArray(mapped.params) ? mapped.params : JSON.parse(mapped.params as string || '[]')
    params.value = params.value.map(parameter => ({
      ...parameter,
      enum_config: Array.isArray(parameter.enum_config) ? parameter.enum_config.map(row => ({
        value_type: parameter.data_type || 'String', value: row.value, description: row.desc, label: row.label
      })) : []
    }))
    formError.value = ''
    editing.value = true
  } catch (error) {
    console.error('读取物模型字段失败:', error)
    window.$message?.error('字段定义无法读取，请刷新后重试。')
  }
}

function addParameter() {
  params.value.push({ data_name: '', data_identifier: '', param_type: 'String', read_write_flag: 'String', data_type: 'String', description: '', enum_config: [] })
}

function removeParameter(index: number) {
  params.value.splice(index, 1)
}

function updateParameterKind(parameter: FormRecord, value: string) {
  if (activeKind.value === 'COMMAND') parameter.param_type = value
  else parameter.read_write_flag = value
}

function addEnumRow(rows: FormRecord[], baseKind: string) {
  rows.push({ value_type: baseKind, value: baseKind === 'Boolean' ? false : baseKind === 'Number' ? null : '', description: '' })
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
      outgoing.additional_info = (outgoing.additional_info as FormRecord[]).map(row => ({ ...row, value_type: outgoing.enum_base }))
    }
    if (activeKind.value === 'EVENT' || activeKind.value === 'COMMAND') {
      outgoing.params = JSON.stringify(params.value.map(parameter => ({ ...parameter,
        enum_config: parameter.param_type === 'Enum' || parameter.read_write_flag === 'Enum'
          ? parameter.enum_config.map(row => ({ value: row.value, desc: row.description, label: row.label }))
          : []
      })))
      outgoing.paramsOrigin = outgoing.params
    }
    const nextField = toNativeFieldFromEditor(activeKind.value, outgoing)
    const nextFields = [...props.model.fields]
    const oldIndex = selectedKey.value === null ? -1 : nextFields.findIndex(field => fieldKey(field) === selectedKey.value)
    if (oldIndex < 0) nextFields.push(nextField)
    else nextFields[oldIndex] = nextField
    emit('save', { ...props.model, fields: nextFields }, finishEdit)
  } catch (error) {
    formError.value = error instanceof Error ? error.message : '字段内容无效，未保存'
  }
}

function removeField(field: ModelField) {
  emit('save', { ...props.model, fields: props.model.fields.filter(item => fieldKey(item) !== fieldKey(field)) }, () => {})
}
</script>

<template>
  <div class="native-model-definition">
    <n-tabs v-model:value="activeKind" type="line">
      <n-tab-pane v-for="tab in tabs" :key="tab.kind" :name="tab.kind" :tab="tab.label">
        <div class="toolbar"><n-button type="primary" :disabled="saving" @click="openNew">新增{{ tab.label }}</n-button></div>
        <n-data-table
          :columns="[
            { title: '名称', key: 'nameI18n', render: (row: ModelField) => displayName(row) },
            { title: '标识符', key: 'identifier' },
            { title: tab.kind === 'EVENT' || tab.kind === 'COMMAND' ? '参数' : '数据类型', key: 'summary', render: displaySummary },
            { title: '单位', key: 'unit', render: (row: ModelField) => 'unit' in row ? row.unit ?? '' : '' },
            { title: '说明', key: 'descriptionI18n', render: (row: ModelField) => row.descriptionI18n?.default ?? '' },
            { title: '操作', key: 'actions', render: (row: ModelField) => h('div', { class: 'actions' }, [h(NButton, { quaternary: true, type: 'primary', disabled: saving, onClick: () => openEdit(row) }, { default: () => '编辑' }), h(NPopconfirm, { onPositiveClick: () => removeField(row) }, { default: () => '确认删除此字段？', trigger: () => h(NButton, { quaternary: true, type: 'error', disabled: saving }, { default: () => '删除' }) })]) }
          ]"
          :data="currentFields"
          :row-key="fieldKey"
        />
      </n-tab-pane>
    </n-tabs>

    <n-modal v-model:show="editing" preset="card" :title="selectedKey ? '编辑字段' : '新增字段'" class="field-modal" :mask-closable="!saving" :close-on-esc="!saving" :closable="!saving">
      <n-alert v-if="formError" type="error" :show-icon="false" class="error">{{ formError }}</n-alert>
      <n-form :model="form" label-placement="left" label-width="100" :disabled="saving">
        <n-form-item label="名称"><n-input v-model:value="form.data_name" :input-props="{ 'aria-label': '名称' }" /></n-form-item>
        <n-form-item label="标识符"><n-input v-model:value="form.data_identifier" :input-props="{ 'aria-label': '标识符' }" /></n-form-item>
        <template v-if="activeKind === 'TELEMETRY' || activeKind === 'ATTRIBUTE'">
          <n-form-item label="数据类型"><n-select v-model:value="form.data_type" :options="['Number', 'String', 'Boolean', 'Enum'].map(value => ({ label: value, value }))" /></n-form-item>
          <n-form-item v-if="activeKind === 'ATTRIBUTE'" label="读写权限"><n-select v-model:value="form.read_write_flag" :options="[{label:'只读',value:'R'},{label:'读写',value:'RW'}]" /></n-form-item>
          <n-form-item v-if="activeKind === 'TELEMETRY'" label="读写权限"><n-input value="只读（遥测数据由设备上报）" disabled :input-props="{ 'aria-label': '遥测只读' }" /></n-form-item>
          <n-alert v-if="activeKind === 'TELEMETRY' && form.read_write_flag === 'RW'" type="warning" :show-icon="false">此遥测字段当前允许写入；保存后会按遥测上报语义改为只读。</n-alert>
          <template v-if="form.data_type === 'Enum'">
            <n-form-item label="枚举值类型"><n-select v-model:value="form.enum_base" :disabled="form.additional_info.length > 0" :options="['String','Number','Boolean'].map(value => ({label:value,value}))" /></n-form-item>
            <div class="enum-list">
              <div v-for="(row, index) in form.additional_info" :key="index" class="enum-row">
                <n-input v-if="form.enum_base === 'String'" v-model:value="row.value" placeholder="枚举值" />
                <n-input-number v-else-if="form.enum_base === 'Number'" v-model:value="row.value" placeholder="枚举值" />
                <n-select v-else v-model:value="row.value" :options="booleanEnumOptions" />
                <n-input v-model:value="row.description" placeholder="枚举说明" />
                <n-button quaternary type="error" :disabled="saving" @click="form.additional_info.splice(index, 1)">删除</n-button>
              </div>
              <n-button size="small" :disabled="saving" @click="addEnumRow(form.additional_info, form.enum_base)">添加枚举</n-button>
            </div>
          </template>
          <n-form-item label="单位"><n-input v-model:value="form.unit" :input-props="{ 'aria-label': '单位' }" /></n-form-item>
        </template>
        <template v-else>
          <div class="params-heading"><strong>{{ activeKind === 'COMMAND' ? '命令参数' : '事件参数' }}</strong><n-button size="small" :disabled="saving" @click="addParameter">添加参数</n-button></div>
          <div v-for="(parameter, index) in params" :key="parameter.id ?? index" class="parameter-row">
            <n-input v-model:value="parameter.data_name" placeholder="参数名称" :input-props="{ 'aria-label': '参数名称' }" :disabled="saving" />
            <n-input v-model:value="parameter.data_identifier" placeholder="参数标识符" :input-props="{ 'aria-label': '参数标识符' }" :disabled="saving" />
            <n-select :value="activeKind === 'COMMAND' ? parameter.param_type : parameter.read_write_flag" :disabled="saving" @update:value="updateParameterKind(parameter, $event as string)" :options="['String', 'Number', 'Boolean', 'Enum'].map(value => ({label:value,value}))" />
            <n-input v-model:value="parameter.description" placeholder="说明" :input-props="{ 'aria-label': '参数说明' }" :disabled="saving" />
            <n-button quaternary type="error" :disabled="saving" @click="removeParameter(index)">移除</n-button>
            <template v-if="(activeKind === 'COMMAND' ? parameter.param_type : parameter.read_write_flag) === 'Enum'">
              <n-select v-model:value="parameter.data_type" :disabled="saving || parameter.enum_config.length > 0" :options="['String','Number','Boolean'].map(value => ({label:value,value}))" placeholder="枚举值类型" />
              <div class="enum-list">
                <div v-for="(enumRow, enumIndex) in parameter.enum_config" :key="enumIndex" class="enum-row">
                  <n-input v-if="parameter.data_type === 'String'" v-model:value="enumRow.value" placeholder="枚举值" />
                  <n-input-number v-else-if="parameter.data_type === 'Number'" v-model:value="enumRow.value" placeholder="枚举值" />
                  <n-select v-else v-model:value="enumRow.value" :options="booleanEnumOptions" />
                  <n-input v-model:value="enumRow.description" placeholder="枚举说明" />
                  <n-button quaternary type="error" :disabled="saving" @click="parameter.enum_config.splice(enumIndex, 1)">删除</n-button>
                </div>
                <n-button size="small" :disabled="saving" @click="addEnumRow(parameter.enum_config, parameter.data_type)">添加枚举</n-button>
              </div>
            </template>
          </div>
        </template>
        <n-form-item label="说明"><n-input v-model:value="form.description" type="textarea" :input-props="{ 'aria-label': '说明' }" :disabled="saving" /></n-form-item>
      </n-form>
      <div class="modal-actions"><n-button :disabled="saving" @click="editing = false">取消</n-button><n-button type="primary" :loading="saving" :disabled="saving" @click="saveField">保存字段</n-button></div>
    </n-modal>
  </div>
</template>

<style scoped>
.toolbar,.params-heading,.modal-actions { display:flex; justify-content:flex-end; gap:8px; margin:12px 0; }
.field-modal { width:min(760px, 92vw); }
.parameter-row { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:8px; margin:10px 0; }
.parameter-row > :last-child { justify-self:start; }
.enum-list { display:grid; gap:8px; width:100%; margin:0 0 12px 100px; }
.enum-row { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)) auto; gap:8px; }
.error { margin-bottom:12px; }
.actions { display:flex; justify-content:center; gap:8px; }
</style>
