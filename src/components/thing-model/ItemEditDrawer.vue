<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import {
  NDrawer,
  NDrawerContent,
  NForm,
  NFormItem,
  NInput,
  NSelect,
  NInputNumber,
  NCheckbox,
  NButton,
  NSpace,
  NDivider,
  NAlert
} from 'naive-ui'
import type { FormInst } from 'naive-ui'
import { thingModelItemApi } from '@/service/thingmodel/thing-model-item'
import { validateApi } from '@/service/thingmodel/validate'
import type { ThingModelItem } from '@/service/thingmodel/types'
import { $t } from '@/locales'

const props = defineProps<{
  show: boolean
  thingModelId: string
  item: ThingModelItem | null
}>()

const emit = defineEmits(['close', 'saved'])

const formRef = ref<FormInst | null>(null)
const saving = ref(false)
const validationErrors = ref<string[]>([])

interface EnumEntry {
  code: string | number
  label: string
}

// Form data
const form = reactive({
  type: 'PROPERTY' as 'PROPERTY' | 'EVENT' | 'COMMAND',
  identifier: '',
  nameDefault: '',
  nameEn: '',
  descDefault: '',
  valueKind: 'INT' as 'INT' | 'FLOAT' | 'BOOL' | 'STRING' | 'ENUM',
  storePolicy: 'history' as 'history' | 'latest_only',
  // Numeric constraints
  min: null as number | null,
  max: null as number | null,
  step: null as number | null,
  unit: '',
  decimals: null as number | null,
  // String constraint
  maxLength: null as number | null,
  // Enum values
  enumValues: [] as EnumEntry[],
  // Access
  accessRead: true,
  accessWrite: false,
  accessObserve: true,
})

const isEdit = computed(() => !!props.item)
const title = computed(() => (isEdit.value ? $t('thingModel.editField') : $t('thingModel.addFieldTitle')))

const typeOptions = [
  { label: $t('thingModel.itemType.PROPERTY'), value: 'PROPERTY' },
  { label: $t('thingModel.itemType.EVENT'), value: 'EVENT' },
  { label: $t('thingModel.itemType.COMMAND'), value: 'COMMAND' }
]

const valueKindOptions = [
  { label: $t('thingModel.valueKind.INT'), value: 'INT' },
  { label: $t('thingModel.valueKind.FLOAT'), value: 'FLOAT' },
  { label: $t('thingModel.valueKind.BOOL'), value: 'BOOL' },
  { label: $t('thingModel.valueKind.STRING'), value: 'STRING' },
  { label: $t('thingModel.valueKind.ENUM'), value: 'ENUM' }
]
const storePolicyOptions = [
  { label: $t('thingModel.storePolicy.history'), value: 'history' },
  { label: $t('thingModel.storePolicy.latest_only'), value: 'latest_only' }
]

// Access logic based on type
const accessReadDisabled = computed(() => form.type === 'COMMAND')
const accessWriteDisabled = computed(() => form.type === 'EVENT')
const accessObserveDisabled = computed(() => form.type === 'COMMAND')

watch(
  () => form.type,
  type => {
    if (type === 'COMMAND') {
      form.accessWrite = true
      form.accessRead = false
      form.accessObserve = false
    } else if (type === 'EVENT') {
      form.accessObserve = true
      form.accessWrite = false
    } else {
      // PROPERTY: restore defaults if needed
    }
  }
)

// Identifier pattern
const identifierPattern = /^[a-z][a-z0-9_]*$/

function buildValueType(): Record<string, any> {
  const base: Record<string, any> = { kind: form.valueKind }
  const constraint: Record<string, any> = {}
  switch (form.valueKind) {
    case 'INT':
      if (form.min !== null) constraint.min = form.min
      if (form.max !== null) constraint.max = form.max
      if (form.step !== null) constraint.step = form.step
      if (form.unit) constraint.unit = form.unit
      break
    case 'FLOAT':
      if (form.min !== null) constraint.min = form.min
      if (form.max !== null) constraint.max = form.max
      if (form.step !== null) constraint.step = form.step
      if (form.unit) constraint.unit = form.unit
      if (form.decimals !== null) constraint.precision = form.decimals
      break
    case 'STRING':
      if (form.maxLength !== null) constraint.max_length = form.maxLength
      break
    case 'ENUM':
      base.enum_values = form.enumValues.map(e => ({
        code: String(e.code),
        label: { default: e.label || String(e.code) }
      }))
      break
    case 'BOOL':
    default:
      break
  }
  if (Object.keys(constraint).length > 0) {
    base.constraint = constraint
  }
  return base
}

function parseValueType(vt: Record<string, any>) {
  form.valueKind = (vt.kind || vt.type || 'INT') as any
  const constraint = vt.constraint || {}
  form.min = constraint.min ?? vt.min ?? null
  form.max = constraint.max ?? vt.max ?? null
  form.step = constraint.step ?? vt.step ?? null
  form.unit = constraint.unit || vt.unit || ''
  form.decimals = constraint.precision ?? vt.decimals ?? null
  form.maxLength = constraint.max_length ?? vt.max_length ?? null
  const enumValues = Array.isArray(vt.enum_values) ? vt.enum_values : vt.values
  if (form.valueKind === 'ENUM' && Array.isArray(enumValues)) {
    form.enumValues = enumValues.map((v: any) => ({
      code: v.code,
      label: v.label?.default || v.label || ''
    }))
  } else {
    form.enumValues = []
  }
}

function parseStorePolicy(metaItems: any[] | undefined) {
  const list = Array.isArray(metaItems) ? metaItems : []
  const storePolicy = list.find(meta => meta?.key === 'store_policy')
  if (typeof storePolicy?.value === 'string' && storePolicy.value.trim()) {
    return storePolicy.value === 'latest_only' ? 'latest_only' : 'history'
  }
  return 'history'
}

function loadItem(item: ThingModelItem) {
  form.type = item.type
  form.identifier = item.identifier
  form.nameDefault = item.name_i18n?.default || ''
  form.nameEn = item.name_i18n?.locales?.['en-US'] || ''
  form.descDefault = item.description_i18n?.default || ''
  if (item.value_type) parseValueType(item.value_type)
  form.accessRead = item.access?.read ?? true
  form.accessWrite = item.access?.write ?? false
  form.accessObserve = item.access?.observe ?? true
  form.storePolicy = parseStorePolicy(item.meta_items as any[] | undefined)
}

watch(
  () => props.item,
  item => {
    if (item) {
      loadItem(item)
    } else {
      // Reset
      form.type = 'PROPERTY'
      form.identifier = ''
      form.nameDefault = ''
      form.nameEn = ''
      form.descDefault = ''
      form.valueKind = 'INT'
      form.storePolicy = 'history'
      form.min = null
      form.max = null
      form.step = null
      form.unit = ''
      form.decimals = null
      form.maxLength = null
      form.enumValues = []
      form.accessRead = true
      form.accessWrite = false
      form.accessObserve = true
    }
  },
  { immediate: true }
)

function addEnumValue() {
  form.enumValues.push({ code: '', label: '' })
}

function removeEnumValue(index: number) {
  form.enumValues.splice(index, 1)
}

function buildPayload(): ThingModelItem {
  const payload: ThingModelItem = {
    type: form.type,
    identifier: form.identifier,
    name_i18n: {
      default: form.nameDefault,
      locales: form.nameEn ? { 'en-US': form.nameEn } : undefined
    },
    description_i18n: form.descDefault ? { default: form.descDefault } : undefined,
    value_type: buildValueType(),
    access: {
      read: form.accessRead,
      write: form.accessWrite,
      observe: form.accessObserve
    },
    meta_items: form.type === 'PROPERTY' ? [{ key: 'store_policy', value: form.storePolicy, scope: 'STORAGE' }] : []
  }

  // Keep existing persisted order when editing. New items rely on backend auto ordering.
  if (props.item?.sort_order !== undefined) {
    payload.sort_order = props.item.sort_order
  }

  return payload
}

async function handleSave() {
  validationErrors.value = []

  // Basic client validation
  if (!form.identifier) {
    window.$message?.error($t('thingModel.identifier') + ' ' + $t('common.error'))
    return
  }
  if (!identifierPattern.test(form.identifier)) {
    window.$message?.error($t('thingModel.identifierHint'))
    return
  }
  if (!form.nameDefault) {
    window.$message?.error($t('thingModel.displayName') + ' ' + $t('common.error'))
    return
  }

  const payload = buildPayload()

  // Server-side validation
  try {
    const vRes = await validateApi.validateThingModelItem({
      ...payload,
      thing_model_id: props.thingModelId,
      item_id: isEdit.value && props.item?.id ? props.item.id : undefined
    })
    if (vRes.data && !vRes.data.valid) {
      validationErrors.value = vRes.data.errors || []
      return
    }
  } catch {
    // validation service unavailable, proceed anyway
  }

  saving.value = true
  try {
    if (isEdit.value && props.item?.id) {
      await thingModelItemApi.update(props.thingModelId, props.item.id, payload)
    } else {
      await thingModelItemApi.create(props.thingModelId, payload)
    }
    window.$message?.success($t('common.editSuccess'))
    emit('saved')
  } catch {
    window.$message?.error($t('common.error'))
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <NDrawer :show="show" :width="560" placement="right" @update:show="v => !v && emit('close')">
    <NDrawerContent :title="title" closable>
      <NAlert v-if="validationErrors.length" type="error" class="mb-4">
        <ul class="list-disc pl-4">
          <li v-for="(e, i) in validationErrors" :key="i">{{ e }}</li>
        </ul>
      </NAlert>

      <NForm
        ref="formRef"
        :model="form"
        label-placement="left"
        label-width="90px"
        require-mark-placement="right-hanging"
      >
        <!-- Type -->
        <NFormItem :label="$t('thingModel.itemType')" required>
          <NSelect v-model:value="form.type" :options="typeOptions" />
        </NFormItem>

        <!-- Identifier -->
        <NFormItem :label="$t('thingModel.identifier')" required>
          <NInput
            v-model:value="form.identifier"
            :placeholder="$t('thingModel.identifierHint')"
            :status="form.identifier && !identifierPattern.test(form.identifier) ? 'error' : undefined"
          />
        </NFormItem>

        <!-- Name -->
        <NFormItem :label="$t('thingModel.nameZh')" required>
          <NInput v-model:value="form.nameDefault" :placeholder="$t('thingModel.displayName')" />
        </NFormItem>
        <NFormItem :label="$t('thingModel.nameEn')">
          <NInput v-model:value="form.nameEn" placeholder="English name" />
        </NFormItem>

        <!-- Description -->
        <NFormItem :label="$t('thingModel.description')">
          <NInput v-model:value="form.descDefault" type="textarea" :rows="2" />
        </NFormItem>

        <NDivider />

        <!-- Data Type -->
        <NFormItem :label="$t('thingModel.valueKind')" required>
          <NSelect v-model:value="form.valueKind" :options="valueKindOptions" />
        </NFormItem>
        <NFormItem v-if="form.type === 'PROPERTY'" :label="$t('thingModel.storePolicy')">
          <NSelect v-model:value="form.storePolicy" :options="storePolicyOptions" />
        </NFormItem>

        <!-- INT constraints -->
        <template v-if="form.valueKind === 'INT'">
          <NFormItem :label="$t('thingModel.min')">
            <NInputNumber v-model:value="form.min" class="w-full" :precision="0" />
          </NFormItem>
          <NFormItem :label="$t('thingModel.max')">
            <NInputNumber v-model:value="form.max" class="w-full" :precision="0" />
          </NFormItem>
          <NFormItem :label="$t('thingModel.step')">
            <NInputNumber v-model:value="form.step" class="w-full" :precision="0" :min="1" />
          </NFormItem>
          <NFormItem :label="$t('thingModel.unit')">
            <NInput v-model:value="form.unit" />
          </NFormItem>
        </template>

        <!-- FLOAT constraints -->
        <template v-else-if="form.valueKind === 'FLOAT'">
          <NFormItem :label="$t('thingModel.min')">
            <NInputNumber v-model:value="form.min" class="w-full" />
          </NFormItem>
          <NFormItem :label="$t('thingModel.max')">
            <NInputNumber v-model:value="form.max" class="w-full" />
          </NFormItem>
          <NFormItem :label="$t('thingModel.step')">
            <NInputNumber v-model:value="form.step" class="w-full" :min="0" />
          </NFormItem>
          <NFormItem :label="$t('thingModel.decimals')">
            <NInputNumber v-model:value="form.decimals" class="w-full" :min="0" :max="10" :precision="0" />
          </NFormItem>
          <NFormItem :label="$t('thingModel.unit')">
            <NInput v-model:value="form.unit" />
          </NFormItem>
        </template>

        <!-- STRING constraints -->
        <template v-else-if="form.valueKind === 'STRING'">
          <NFormItem label="Max Length">
            <NInputNumber v-model:value="form.maxLength" class="w-full" :min="1" :precision="0" />
          </NFormItem>
        </template>

        <!-- ENUM values -->
        <template v-else-if="form.valueKind === 'ENUM'">
          <NFormItem :label="$t('thingModel.enumValues')">
            <div class="w-full">
              <div v-for="(entry, idx) in form.enumValues" :key="idx" class="flex gap-2 mb-2 items-center">
                <NInput
                  v-model:value="entry.code as string"
                  :placeholder="$t('thingModel.enumCode')"
                  style="width: 100px"
                />
                <NInput v-model:value="entry.label" :placeholder="$t('thingModel.enumLabel')" class="flex-1" />
                <NButton size="small" type="error" @click="removeEnumValue(idx)">✕</NButton>
              </div>
              <NButton dashed size="small" @click="addEnumValue">+ {{ $t('common._add') }}</NButton>
            </div>
          </NFormItem>
        </template>

        <NDivider />

        <!-- Access permissions -->
        <NFormItem :label="$t('thingModel.access.read')">
          <NCheckbox v-model:checked="form.accessRead" :disabled="accessReadDisabled" />
        </NFormItem>
        <NFormItem :label="$t('thingModel.access.write')">
          <NCheckbox v-model:checked="form.accessWrite" :disabled="accessWriteDisabled" />
        </NFormItem>
        <NFormItem :label="$t('thingModel.access.observe')">
          <NCheckbox v-model:checked="form.accessObserve" :disabled="accessObserveDisabled" />
        </NFormItem>

      </NForm>

      <template #footer>
        <NSpace justify="end">
          <NButton @click="emit('close')">{{ $t('common._cancel') }}</NButton>
          <NButton type="primary" :loading="saving" @click="handleSave">{{ $t('common._confirm') }}</NButton>
        </NSpace>
      </template>
    </NDrawerContent>
  </NDrawer>
</template>
