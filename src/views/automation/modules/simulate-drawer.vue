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
import { simulateRule, type SimSampleInput, type SimulateResponse } from '@/service/api/automation-rules'

const props = defineProps<{ visible: boolean; ruleId: string; ruleName: string }>()
const emit = defineEmits<{ (event: 'update:visible', value: boolean): void }>()

const sampleJSON = ref('')
const result = ref<SimulateResponse | null>(null)
const loading = ref(false)
const failure = ref('')

const show = computed({
  get: () => props.visible,
  set: value => emit('update:visible', value)
})

function parseSamples(): SimSampleInput[] {
  const text = sampleJSON.value.trim()
  if (!text) throw new Error('请先提供至少一个样本，再开始试运行。')
  let value: unknown
  try {
    value = JSON.parse(text)
  } catch {
    throw new Error('样本必须是有效的 JSON 数组。')
  }
  if (!Array.isArray(value) || value.length === 0) throw new Error('请提供非空的 JSON 样本数组。')
  return value.map((sample, index) => {
    if (!sample || typeof sample !== 'object' || Array.isArray(sample)) {
      throw new Error(`第 ${index + 1} 个样本必须是对象。`)
    }
    const item = sample as Record<string, unknown>
    if (['at', 'signal', 'key', 'value'].some(key => typeof item[key] !== 'string')) {
      throw new Error(`第 ${index + 1} 个样本需要 at、signal、key、value 字符串字段。`)
    }
    for (const key of ['device_id', 'unit', 'quality']) {
      if (item[key] !== undefined && typeof item[key] !== 'string') {
        throw new Error(`第 ${index + 1} 个样本的 ${key} 必须是字符串。`)
      }
    }
    return item as unknown as SimSampleInput
  })
}

async function run() {
  if (!props.ruleId) return
  loading.value = true
  failure.value = ''
  result.value = null
  try {
    result.value = await simulateRule(props.ruleId, { samples: parseSamples() })
  } catch (error) {
    failure.value = (error as Error).message || '试运行失败'
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
      请粘贴符合接口格式的样本 JSON 数组。试运行用同一套判断逻辑走一遍条件和步骤，但
      <strong>不会</strong>
      开关设备、写属性、发通知或触发告警。
    </NAlert>

    <NInput
      v-model:value="sampleJSON"
      type="textarea"
      :autosize="{ minRows: 5, maxRows: 12 }"
      placeholder='[{"at":"0s","signal":"telemetry","key":"temperature","value":"80"}]'
      class="mb-3"
    />
    <NButton type="primary" :loading="loading" @click="run">开始试运行</NButton>

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
                <th class="w-140px">时间</th>
                <th class="w-140px">类型</th>
                <th class="w-140px">结论</th>
                <th>说明</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(step, index) in result.steps" :key="`${step.at}-${index}`">
                <td>{{ step.at }}</td>
                <td>{{ step.kind }}</td>
                <td>
                  <NTag v-if="step.verdict" size="small" :type="decisionTone(step.verdict)" :bordered="false">
                    {{ step.verdict }}
                  </NTag>
                  <span v-else>—</span>
                </td>
                <td class="detail">
                  {{ step.detail || '—' }}
                  <div v-for="(reason, reasonIndex) in step.reasons" :key="reasonIndex">{{ reason.message }}</div>
                  <div v-for="(action, actionIndex) in step.actions" :key="`action-${actionIndex}`">{{ action }}</div>
                </td>
              </tr>
            </tbody>
          </NTable>
        </NCard>

        <NCard
          v-if="result.actions?.length"
          size="small"
          title="模拟动作（没有实际执行）"
          :bordered="false"
          class="mb-4"
        >
          <NTable size="small" :bordered="false" :single-line="false">
            <thead>
              <tr>
                <th class="w-180px">路径</th>
                <th class="w-140px">类型</th>
                <th>说明</th>
                <th class="w-160px">结果</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(action, index) in result.actions" :key="`${action.path}-${index}`">
                <td>{{ action.path }}</td>
                <td>{{ action.kind }}</td>
                <td class="detail">{{ action.detail }}</td>
                <td>{{ action.outcome }}</td>
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
          v-if="!result.steps.length && !result.actions.length && !result.notes.length"
          description="接口没有返回判断记录"
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
