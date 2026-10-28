<script setup lang="ts">
/**
 * Try a rule against samples without touching anything.
 *
 * The banner is not decoration. "试运行" and "立即执行" sit next to each other in
 * the list, and the one thing a user must never be unsure about is whether the
 * thing they just pressed opened a valve. The service reports `side_effects`,
 * and this panel shows it rather than assuming zero.
 */
import { computed, ref, watch } from 'vue'
import { NAlert, NButton, NCard, NEmpty, NFlex, NInput, NModal, NSpin, NTable, NTag } from 'naive-ui'
import { AutomationApiError, simulateRule, type SimulateResponse } from '@/service/api/automation-rules'

const props = defineProps<{ visible: boolean; ruleId: string; ruleName: string }>()
const emit = defineEmits<{ (event: 'update:visible', value: boolean): void }>()

const deviceId = ref('')
const result = ref<SimulateResponse | null>(null)
const loading = ref(false)
const failure = ref('')

const show = computed({
  get: () => props.visible,
  set: value => emit('update:visible', value)
})

async function run() {
  if (!props.ruleId) return
  loading.value = true
  failure.value = ''
  result.value = null
  try {
    result.value = await simulateRule(props.ruleId, deviceId.value ? { device_id: deviceId.value } : {})
  } catch (error) {
    failure.value = (error as AutomationApiError).message || '试运行失败'
  } finally {
    loading.value = false
  }
}

watch(
  () => props.visible,
  visible => {
    if (visible) {
      result.value = null
      failure.value = ''
      run()
    }
  }
)

const decisionTone = (decision: string) => {
  if (decision === 'run' || decision === 'true') return 'success'
  if (decision === 'unknown' || decision === 'error') return 'warning'
  return 'info'
}
</script>

<template>
  <NModal
    v-model:show="show"
    preset="card"
    :style="{ width: '860px' }"
    :bordered="false"
    :title="`试运行 · ${ruleName}`"
  >
    <NAlert type="info" :bordered="false" class="mb-4">
      这是试运行：用同一套判断逻辑走一遍条件和步骤，但
      <strong>不会</strong>
      开关设备、写属性、发通知或触发告警。
    </NAlert>

    <NFlex class="mb-4" align="center">
      <NInput v-model:value="deviceId" placeholder="按哪台设备试（留空用规则自己的目标）" clearable class="max-w-80" />
      <NButton type="primary" :loading="loading" @click="run">重新试运行</NButton>
    </NFlex>

    <div v-if="failure" class="failure">{{ failure }}</div>

    <NSpin :show="loading">
      <template v-if="result">
        <NFlex class="mb-4" :size="16" align="center">
          <NTag :type="result.side_effects === 0 ? 'success' : 'error'" :bordered="false">
            真实副作用 {{ result.side_effects }} 次
          </NTag>
          <NTag :bordered="false">会执行 {{ result.would_run }} 次</NTag>
          <NTag v-if="result.ends_at" :bordered="false">预计结束 {{ result.ends_at }}</NTag>
        </NFlex>

        <NAlert v-if="result.side_effects > 0" type="error" :bordered="false" class="mb-4">
          试运行报告了 {{ result.side_effects }} 次真实副作用。这不应该发生，请先不要保存，把这条规则的编号
          {{ result.rule_id }} 报给支持人员。
        </NAlert>

        <NCard v-if="result.steps?.length" size="small" title="判断过程" :bordered="false" class="mb-4">
          <NTable size="small" :bordered="false" :single-line="false">
            <thead>
              <tr>
                <th class="w-60px">步</th>
                <th class="w-140px">类型</th>
                <th class="w-140px">结论</th>
                <th>说明</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="step in result.steps" :key="step.idx">
                <td>{{ step.idx + 1 }}</td>
                <td>{{ step.kind }}</td>
                <td>
                  <NTag size="small" :type="decisionTone(step.decision)" :bordered="false">{{ step.decision }}</NTag>
                </td>
                <td class="detail">{{ step.detail || '—' }}</td>
              </tr>
            </tbody>
          </NTable>
        </NCard>

        <NCard
          v-if="result.actions?.length"
          size="small"
          title="会做这些动作（都没有真的执行）"
          :bordered="false"
          class="mb-4"
        >
          <NTable size="small" :bordered="false" :single-line="false">
            <thead>
              <tr>
                <th class="w-60px">步</th>
                <th class="w-180px">设备</th>
                <th class="w-140px">动作</th>
                <th class="w-180px">指标</th>
                <th>值</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(action, index) in result.actions" :key="`${action.step_idx}-${index}`">
                <td>{{ action.step_idx + 1 }}</td>
                <td>{{ action.device_id }}</td>
                <td>{{ action.action }}</td>
                <td>{{ action.identifier }}</td>
                <td class="detail">{{ action.value }}</td>
              </tr>
            </tbody>
          </NTable>
        </NCard>

        <NCard v-if="result.notes?.length" size="small" title="还需要注意" :bordered="false">
          <ul class="notes">
            <li v-for="(note, index) in result.notes" :key="index">{{ note }}</li>
          </ul>
        </NCard>

        <NEmpty
          v-if="!result.steps?.length && !result.actions?.length && !result.notes?.length"
          description="这次试运行没有产生判断记录"
        />
      </template>
    </NSpin>
  </NModal>
</template>

<style scoped>
.hint {
  color: var(--text-color-3);
  font-size: 12px;
}

.detail {
  color: var(--text-color-2);
  font-size: 12px;
  word-break: break-all;
}

.failure {
  margin-bottom: 12px;
  padding: 8px 12px;
  border-radius: 8px;
  background: rgb(254 226 226);
  color: rgb(153 27 27);
  font-size: 13px;
}

.notes {
  margin: 0;
  padding-left: 18px;
  color: var(--text-color-2);
  font-size: 13px;
  line-height: 1.8;
}
</style>
