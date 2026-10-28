<script setup lang="ts">
/**
 * One group of conditions: all of them must hold.
 *
 * A single group is the unit because that is what a branch condition and a
 * guard also are. The OR between groups belongs to the caller, which is why this
 * component has no "add group" button — the trigger editor and the step editor
 * are the two places that decide what a group means.
 */
import { NButton, NInput, NSelect } from 'naive-ui'
import type { FormCondition } from '@/utils/automation/form'
import { emptyCondition } from '@/utils/automation/form'

const conditions = defineModel<FormCondition[]>({ required: true })
const props = defineProps<{
  fieldErrors: Record<string, string>
  /** Path of the array itself, e.g. `definition.trigger.groups[0].conditions`. */
  pathPrefix: string
  /** A device-scoped rule cannot point at another device. */
  deviceLocked?: boolean
}>()

const signalOptions = [
  { label: '遥测', value: 'telemetry' },
  { label: '属性', value: 'attribute' },
  { label: '事件', value: 'event' },
  { label: '在线状态', value: 'status' }
]

const operatorOptions = [
  { label: '高于 >', value: '>' },
  { label: '不低于 ≥', value: '>=' },
  { label: '低于 <', value: '<' },
  { label: '不高于 ≤', value: '<=' },
  { label: '等于 =', value: '=' },
  { label: '不等于 ≠', value: '!=' },
  { label: '介于 between', value: 'between' },
  { label: '属于 in', value: 'in' },
  { label: '存在 exists', value: 'exists' }
]

const sourceOptions = [
  { label: '本设备', value: 'self' },
  { label: '指定设备', value: 'device' }
]

function update(index: number, patch: Partial<FormCondition>) {
  conditions.value = conditions.value.map((condition, position) =>
    position === index ? { ...condition, ...patch } : condition
  )
}

function add() {
  conditions.value = [...conditions.value, emptyCondition()]
}

function remove(index: number) {
  const next = conditions.value.filter((_, position) => position !== index)
  conditions.value = next.length ? next : [emptyCondition()]
}

function errorAt(index: number, field: string) {
  return props.fieldErrors[`${props.pathPrefix}[${index}].${field}`]
}
</script>

<template>
  <div class="condition-group">
    <div v-for="(condition, index) in conditions" :key="index" class="condition-group__row">
      <NSelect
        :value="condition.source"
        :options="sourceOptions"
        class="w-110px"
        :disabled="deviceLocked"
        @update:value="(value: 'self' | 'device') => update(index, { source: value })"
      />
      <NInput
        v-if="condition.source === 'device'"
        :value="condition.device_id"
        placeholder="设备 ID"
        class="w-150px"
        @update:value="(value: string) => update(index, { device_id: value })"
      />
      <NSelect
        :value="condition.signal"
        :options="signalOptions"
        class="w-110px"
        @update:value="(value: string) => update(index, { signal: value as FormCondition['signal'] })"
      />
      <NInput
        :value="condition.key"
        placeholder="指标 / 事件名"
        class="w-140px"
        @update:value="(value: string) => update(index, { key: value })"
      />
      <NSelect
        :value="condition.operator"
        :options="operatorOptions"
        class="w-140px"
        @update:value="(value: string) => update(index, { operator: value })"
      />
      <NInput
        :value="condition.value"
        :placeholder="condition.operator === 'exists' ? 'true / false' : '比较值'"
        class="w-120px"
        @update:value="(value: string) => update(index, { value })"
      />
      <NInput
        :value="condition.unit"
        placeholder="单位"
        class="w-70px"
        @update:value="(value: string) => update(index, { unit: value })"
      />
      <NButton v-if="conditions.length > 1" text type="error" size="tiny" @click="remove(index)">移除</NButton>
      <div v-if="errorAt(index, 'value') || errorAt(index, 'device_id')" class="field-error">
        {{ errorAt(index, 'value') || errorAt(index, 'device_id') }}
      </div>
    </div>
    <NButton dashed size="small" class="mt-1" @click="add">加一个条件（并且）</NButton>
    <div v-if="fieldErrors[pathPrefix]" class="field-error">{{ fieldErrors[pathPrefix] }}</div>
  </div>
</template>

<style scoped>
.condition-group__row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
}

.field-error {
  width: 100%;
  color: rgb(220 38 38);
  font-size: 12px;
}
</style>
