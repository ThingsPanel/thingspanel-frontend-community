<script setup lang="ts">
/**
 * The THEN part, including one level of if/else.
 *
 * Only the step kinds the engine can actually execute are offered. A menu item
 * for something the runtime would refuse halfway through a run is worse than a
 * missing feature: it publishes successfully and then fails on a device.
 *
 * Branch depth is bounded by the form, matching the server's own limit, so a
 * rule cannot be built that validation will reject for depth alone.
 */
import { computed } from 'vue'
import { NButton, NCard, NInput, NSelect, NSwitch, NTag } from 'naive-ui'
import type { FormStep } from '@/utils/automation/form'
import { MAX_BRANCH_DEPTH, emptyStep } from '@/utils/automation/form'
import ConditionEditor from './condition-editor.vue'

const steps = defineModel<FormStep[]>({ required: true })
const props = defineProps<{
  fieldErrors: Record<string, string>
  pathPrefix: string
  depth?: number
  allowScene?: boolean
  alarmPolicyOptions?: { label: string; value: string }[]
}>()

const depth = computed(() => props.depth ?? 0)

const kindOptions = computed(() => {
  const options = [
    { label: '操作设备', value: 'action' },
    { label: '等待', value: 'wait' },
    { label: '触发告警', value: 'alarm' },
    { label: '发送通知', value: 'notify' }
  ]
  if (depth.value < MAX_BRANCH_DEPTH) options.push({ label: '条件分支', value: 'branch' })
  if (props.allowScene) options.push({ label: '激活场景', value: 'activate_scene' })
  return options
})

const actionOptions = [
  { label: '写遥测', value: 'telemetry' },
  { label: '写属性', value: 'attribute' },
  { label: '下发命令', value: 'command' }
]

const deviceRefOptions = [
  { label: '本次目标设备', value: 'target' },
  { label: '触发设备本身', value: 'self' }
]

function update(index: number, patch: Partial<FormStep>) {
  steps.value = steps.value.map((step, position) => (position === index ? { ...step, ...patch } : step))
}

function changeKind(index: number, kind: string) {
  const fresh = emptyStep(kind as FormStep['kind'])
  steps.value = steps.value.map((step, position) =>
    position === index ? { ...fresh, continue_on_failure: step.continue_on_failure } : step
  )
}

function addStep() {
  steps.value = [...steps.value, emptyStep('action')]
}

function removeStep(index: number) {
  steps.value = steps.value.filter((_, position) => position !== index)
}

function errorAt(index: number, field: string) {
  return props.fieldErrors[`${props.pathPrefix}[${index}].${field}`]
}
</script>

<template>
  <div class="steps">
    <NCard v-for="(step, index) in steps" :key="index" size="small" :bordered="false" embedded class="steps__card">
      <div class="steps__head">
        <NTag size="small" :bordered="false">{{ index + 1 }}</NTag>
        <NSelect
          :value="step.kind"
          :options="kindOptions"
          class="w-140px"
          @update:value="(value: string) => changeKind(index, value)"
        />
        <NButton text type="error" size="tiny" @click="removeStep(index)">移除这一步</NButton>
      </div>

      <template v-if="step.kind === 'action'">
        <div class="steps__row">
          <NSelect
            :value="step.device_ref"
            :options="deviceRefOptions"
            class="w-150px"
            @update:value="(value: string) => update(index, { device_ref: value })"
          />
          <NSelect
            :value="step.action"
            :options="actionOptions"
            class="w-130px"
            @update:value="(value: string) => update(index, { action: value as FormStep['action'] })"
          />
          <NInput
            :value="step.identifier"
            placeholder="指标 / 命令名"
            class="w-160px"
            @update:value="(value: string) => update(index, { identifier: value })"
          />
          <NInput
            :value="step.value"
            placeholder="值"
            class="w-140px"
            @update:value="(value: string) => update(index, { value })"
          />
        </div>
        <div v-if="errorAt(index, 'identifier')" class="field-error">{{ errorAt(index, 'identifier') }}</div>
      </template>

      <template v-else-if="step.kind === 'wait'">
        <div class="steps__row">
          <NInput
            :value="step.wait"
            placeholder="等待多久，例如 30s、5m"
            class="w-220px"
            @update:value="(value: string) => update(index, { wait: value })"
          />
          <span class="hint">到时间会自动继续，不需要人工点。</span>
        </div>
        <div v-if="errorAt(index, 'wait')" class="field-error">{{ errorAt(index, 'wait') }}</div>
      </template>

      <template v-else-if="step.kind === 'alarm'">
        <div class="steps__row">
          <NSelect
            v-if="alarmPolicyOptions?.length"
            :value="step.alarm_policy_id"
            :options="alarmPolicyOptions"
            placeholder="选择告警策略"
            filterable
            class="w-260px"
            @update:value="(value: string) => update(index, { alarm_policy_id: value })"
          />
          <NInput
            v-else
            :value="step.alarm_policy_id"
            placeholder="告警策略 ID"
            class="w-260px"
            @update:value="(value: string) => update(index, { alarm_policy_id: value })"
          />
        </div>
      </template>

      <template v-else-if="step.kind === 'notify'">
        <div class="steps__row">
          <NInput
            :value="step.notification_policy_id"
            placeholder="通知策略 ID"
            class="w-260px"
            @update:value="(value: string) => update(index, { notification_policy_id: value })"
          />
        </div>
      </template>

      <template v-else-if="step.kind === 'activate_scene'">
        <div class="steps__row">
          <NInput
            :value="step.device_ref"
            placeholder="要激活的场景 ID"
            class="w-260px"
            @update:value="(value: string) => update(index, { device_ref: value })"
          />
        </div>
      </template>

      <template v-else-if="step.kind === 'branch'">
        <div class="steps__branch">
          <div class="steps__branch-title">如果</div>
          <ConditionEditor
            :model-value="step.condition.conditions"
            :field-errors="fieldErrors"
            :path-prefix="`${pathPrefix}[${index}].condition.conditions`"
            device-locked
            @update:model-value="value => update(index, { condition: { conditions: value } })"
          />
          <div class="steps__branch-title">就执行</div>
          <StepEditor
            :model-value="step.then"
            :field-errors="fieldErrors"
            :path-prefix="`${pathPrefix}[${index}].then`"
            :depth="depth + 1"
            :allow-scene="allowScene"
            :alarm-policy-options="alarmPolicyOptions"
            @update:model-value="value => update(index, { then: value })"
          />
          <div class="steps__branch-title">
            否则执行
            <span class="hint">（条件不成立时；条件判断不了时不会走这里）</span>
          </div>
          <StepEditor
            :model-value="step.else"
            :field-errors="fieldErrors"
            :path-prefix="`${pathPrefix}[${index}].else`"
            :depth="depth + 1"
            :allow-scene="allowScene"
            :alarm-policy-options="alarmPolicyOptions"
            @update:model-value="value => update(index, { else: value })"
          />
        </div>
        <div v-if="errorAt(index, 'condition') || errorAt(index, 'then')" class="field-error">
          {{ errorAt(index, 'condition') || errorAt(index, 'then') }}
        </div>
      </template>

      <div class="steps__foot">
        <span class="hint">这一步失败时继续执行后面的步骤</span>
        <NSwitch
          :value="step.continue_on_failure"
          size="small"
          @update:value="(value: boolean) => update(index, { continue_on_failure: value })"
        />
      </div>
    </NCard>

    <NButton dashed size="small" @click="addStep">加一步动作</NButton>
    <div v-if="fieldErrors[pathPrefix]" class="field-error">{{ fieldErrors[pathPrefix] }}</div>
  </div>
</template>

<style scoped>
.steps__card {
  margin-bottom: 8px;
}

.steps__head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.steps__row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}

.steps__branch {
  padding: 8px 10px;
  border-left: 2px solid var(--border-color);
  margin-bottom: 8px;
}

.steps__branch-title {
  margin: 6px 0;
  color: var(--text-color-2);
  font-size: 13px;
  font-weight: 600;
}

.steps__foot {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
}

.hint {
  color: var(--text-color-3);
  font-size: 12px;
}

.field-error {
  margin-top: 4px;
  color: rgb(220 38 38);
  font-size: 12px;
}
</style>
