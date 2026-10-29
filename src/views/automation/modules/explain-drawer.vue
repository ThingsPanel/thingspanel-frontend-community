<script setup lang="ts">
/**
 * "Why didn't it fire?"
 *
 * This is the question support actually gets, and a list of successful runs
 * cannot answer it. The service returns a verdict plus the evaluator's own
 * reasons; when the evidence is incomplete it says so instead of picking the
 * most likely-sounding reason — a confident wrong answer here costs more than an
 * honest "we cannot tell".
 */
import { computed, ref, watch } from 'vue'
import { NAlert, NButton, NCard, NDatePicker, NEmpty, NFlex, NInput, NModal, NSpin, NTag } from 'naive-ui'
import { AutomationApiError, explainRule, type ExplainResponse } from '@/service/api/automation-rules'
import { describeVerdict } from '@/utils/automation/summary'

const props = defineProps<{ visible: boolean; ruleId: string; ruleName: string }>()
const emit = defineEmits<{ (event: 'update:visible', value: boolean): void }>()

const deviceId = ref('')
const range = ref<[number, number]>([Date.now() - 24 * 3600 * 1000, Date.now()])
const result = ref<ExplainResponse | null>(null)
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
    result.value = await explainRule(props.ruleId, {
      device_id: deviceId.value || undefined,
      from: new Date(range.value[0]).toISOString(),
      to: new Date(range.value[1]).toISOString()
    })
  } catch (error) {
    failure.value = (error as AutomationApiError).message || '查询失败'
  } finally {
    loading.value = false
  }
}

watch(
  () => props.visible,
  visible => {
    if (visible) run()
  }
)

function toneOf(verdict: string) {
  const tone = describeVerdict(verdict).tone
  if (tone === 'ok') return 'success'
  if (tone === 'bad') return 'error'
  if (tone === 'warn') return 'warning'
  return 'info'
}
</script>

<template>
  <NModal
    v-model:show="show"
    preset="card"
    :style="{ width: '820px' }"
    :bordered="false"
    :title="`为什么不触发 · ${ruleName}`"
  >
    <NFlex class="mb-4" align="center" :wrap="true">
      <NInput v-model:value="deviceId" placeholder="哪台设备（留空按规则自身）" clearable class="w-220px" />
      <NDatePicker v-model:value="range" type="datetimerange" />
      <NButton type="primary" :loading="loading" @click="run">查询</NButton>
    </NFlex>

    <div v-if="failure" class="failure">{{ failure }}</div>

    <NSpin :show="loading">
      <template v-if="result">
        <NFlex align="center" :size="10" class="mb-3">
          <NTag :type="toneOf(result.verdict)" :bordered="false">{{ describeVerdict(result.verdict).label }}</NTag>
          <span class="hint">{{ describeVerdict(result.verdict).hint }}</span>
        </NFlex>

        <NAlert v-if="!result.evidence?.complete" type="warning" :bordered="false" class="mb-3">
          这段时间的记录不完整，下面的原因可能不是全部。{{ (result.evidence?.notes ?? []).join('；') }}
        </NAlert>

        <NCard v-if="result.reasons?.length" size="small" title="判断依据" :bordered="false" class="mb-3">
          <ul class="reasons">
            <li v-for="(reason, index) in result.reasons" :key="index">
              <span class="reason-code">{{ reason.code }}</span>
              <span>{{ reason.message }}</span>
            </li>
          </ul>
        </NCard>

        <NCard size="small" :title="`这段时间执行了 ${result.runs?.length ?? 0} 次`" :bordered="false">
          <NEmpty v-if="!result.runs?.length" size="small" description="这段时间没有执行记录，符合“没有触发”的结论" />
          <ul v-else class="runs">
            <li v-for="item in result.runs" :key="item.id">
              {{ item.started_at }} · {{ item.status }}
              <span v-if="item.reason_code" class="hint">（{{ item.reason_code }}）</span>
            </li>
          </ul>
        </NCard>

        <div class="hint mt-3">
          下一步：如果结论是“没有数据”，先看设备是否在线、上报间隔是否大于数据新鲜度；如果是“条件不成立”，核对阈值与单位。
        </div>
      </template>
      <NEmpty v-else-if="!loading && !failure" description="选择时间范围后点查询" />
    </NSpin>
  </NModal>
</template>

<style scoped>
.hint {
  color: var(--text-color-3);
  font-size: 12px;
}

.failure {
  margin-bottom: 12px;
  padding: 8px 12px;
  border-radius: 8px;
  background: rgb(254 226 226);
  color: rgb(153 27 27);
  font-size: 13px;
}

.reasons,
.runs {
  margin: 0;
  padding-left: 18px;
  color: var(--text-color-2);
  font-size: 13px;
  line-height: 1.8;
}

.reason-code {
  margin-right: 8px;
  padding: 0 6px;
  border-radius: 4px;
  background: var(--body-color);
  color: var(--text-color-3);
  font-size: 11px;
}
</style>
