<script setup lang="ts">
import { computed } from 'vue'
import { NButton, NSelect, NInput, NFlex } from 'naive-ui'
import type { Condition, Trigger } from '@/service/api/automation-rules'
import type { ModelField } from '@/service/api/thingmodel-native-transport'
import { newAlarmCondition } from '@/utils/automation/device-alarm'
const props = defineProps<{
  trigger: Trigger
  fields: ModelField[]
  title: string
  deviceNames: Record<string, string>
}>()
const expanded = defineModel<boolean>('expanded', { default: false })
const kinds = { TELEMETRY: '遥测', ATTRIBUTE: '属性', EVENT: '事件', COMMAND: '命令' }
const options = computed(() => [
  ...props.fields
    .filter(f => f.kind !== 'COMMAND')
    .map(f => ({
      label: f.nameI18n.default + ' · ' + kinds[f.kind],
      value: f.kind.toLowerCase() + '/' + f.identifier,
      field: f
    })),
  { label: '在线状态', value: 'status/online', field: undefined }
])
const operators: Record<string, string> = {
  '>': '高于',
  '<': '低于',
  '>=': '不低于',
  '<=': '不高于',
  '=': '等于',
  '!=': '不等于',
  exists: '存在',
  between: '介于',
  in: '属于'
}
const metric = (c: Condition) => (c.key ? c.signal + '/' + c.key : null)
function field(c: Condition) {
  return options.value.find(o => o.value === metric(c))?.field
}
function valueOptions(c: Condition) {
  if (c.operator === 'exists')
    return [
      { label: '是', value: 'true' },
      { label: '否', value: 'false' }
    ]
  if (c.signal === 'status')
    return [
      { label: '在线', value: 'true' },
      { label: '离线', value: 'false' }
    ]
  const t = field(c)?.valueType
  if (t?.kind === 'BOOL')
    return [
      { label: '开启', value: 'true' },
      { label: '关闭', value: 'false' }
    ]
  if (t?.kind === 'ENUM') return t.enumValues.map(e => ({ label: e.label.default, value: String(e.code) }))
  return []
}
function choose(c: Condition, value: string) {
  const picked = options.value.find(o => o.value === value)
  if (!picked) return
  const f = picked.field
  c.signal = f ? (f.kind.toLowerCase() as Condition['signal']) : 'status'
  c.key = f?.identifier ?? 'online'
  c.unit = f?.unit || undefined
  delete c.event_match
  c.operator =
    c.signal === 'event' ? 'exists' : f?.valueType && ['INT', 'FLOAT', 'NUMBER'].includes(f.valueType.kind) ? '>' : '='
  c.value = c.signal === 'event' || c.signal === 'status' ? 'true' : ''
}
function changeOperator(c: Condition, next: Condition['operator']) {
  if (next === c.operator) return
  if (next === 'exists') c.value = 'true'
  else if (c.operator === 'exists' || ['between', 'in'].includes(next) || ['between', 'in'].includes(c.operator))
    c.value = ''
  c.operator = next
}
function opOptions(c: Condition) {
  const type = field(c)?.valueType?.kind
  const keys =
    c.signal === 'event'
      ? ['exists']
      : c.signal === 'status' || (type && ['STRING', 'BOOL', 'ENUM'].includes(type))
        ? ['=', '!=']
        : Object.keys(operators)
  return [...new Set([...keys, c.operator])].map(value => ({ value, label: operators[value] || value }))
}
const durations = [
  { label: '立即', value: '0s' },
  { label: '持续 30 秒', value: '30s' },
  { label: '持续 1 分钟', value: '1m' },
  { label: '持续 5 分钟', value: '5m' }
]
</script>
<template>
  <div class="block">
    <div v-for="(group, g) in trigger.groups" :key="g" class="group">
      <small v-if="trigger.groups.length > 1">{{ g ? '或 · ' : '' }}条件组 {{ g + 1 }}</small>
      <div v-for="(c, i) in group.conditions" :key="i" class="condition">
        <span class="caption">{{ i ? '并且' : title }}</span>
        <div>
          <small v-if="c.source === 'device'">{{ deviceNames[c.device_id || ''] || '指定设备' }}</small>
          <NSelect
            :value="metric(c)"
            :options="options"
            :fallback-option="() => ({ label: '原指标 · ' + c.key, value: metric(c) || c.key })"
            placeholder="选择指标或事件"
            filterable
            @update:value="v => choose(c, v)"
          />
        </div>
        <NSelect :value="c.operator" :options="opOptions(c)" @update:value="op => changeOperator(c, op)" />
        <NSelect
          v-if="valueOptions(c).length"
          :value="c.value || null"
          :options="valueOptions(c)"
          placeholder="选择状态"
          @update:value="value => (c.value = value)"
        />
        <NInput
          v-else
          v-model:value="c.value"
          :placeholder="
            c.operator === 'between' ? '范围，如 20-35' : c.operator === 'in' ? '多个值用英文逗号分隔' : '比较值'
          "
        >
          <template v-if="c.unit || field(c)?.unit" #suffix>{{ c.unit || field(c)?.unit }}</template>
        </NInput>
        <NButton
          v-if="group.conditions.length > 1 || trigger.groups.length > 1"
          text
          @click="group.conditions.length > 1 ? group.conditions.splice(i, 1) : trigger.groups.splice(g, 1)"
        >
          移除
        </NButton>
      </div>
      <NButton
        v-if="expanded || trigger.groups.length > 1 || group.conditions.length > 1"
        size="small"
        text
        @click="group.conditions.push(newAlarmCondition())"
      >
        ＋ 并且满足
      </NButton>
    </div>
    <NFlex align="center" :size="14" class="controls">
      <span>持续时间</span>
      <NSelect v-model:value="trigger.for" filterable tag :options="durations" style="width: 145px" />
      <NButton v-if="!expanded" text type="primary" @click="expanded = true">更多条件</NButton>
      <NButton v-else text type="primary" @click="trigger.groups.push({ conditions: [newAlarmCondition()] })">
        ＋ 或者满足
      </NButton>
    </NFlex>
  </div>
</template>
<style scoped>
.block {
  padding: 8px 0;
}
.condition {
  display: grid;
  grid-template-columns: 48px minmax(140px, 2fr) minmax(100px, 1fr) minmax(120px, 1fr) auto;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}
.caption {
  font-weight: 600;
}
.controls,
small {
  font-size: 13px;
  color: var(--text-color-2);
}
.controls {
  padding-left: 58px;
}
.group + .group {
  margin-top: 12px;
}
@media (max-width: 750px) {
  .condition {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .caption,
  .caption + div {
    grid-column: 1 / -1;
  }
  .controls {
    padding: 0;
  }
}
</style>
