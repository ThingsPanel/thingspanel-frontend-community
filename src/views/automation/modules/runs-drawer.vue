<script setup lang="ts">
/**
 * Execution records for one rule.
 *
 * The old page had a log popup with a time range and a success/failure filter;
 * this keeps both, and adds the part the old one could not do: clicking a row
 * shows what each step did. The list is paged on the server — a busy rule can
 * have thousands of runs, and loading them to filter in the browser is how the
 * page stops opening.
 */
import { computed, ref, watch } from 'vue'
import { NButton, NCard, NDatePicker, NEmpty, NFlex, NModal, NPagination, NSelect, NSpin, NTable, NTag } from 'naive-ui'
import { AutomationApiError, listRuns, type Run } from '@/service/api/automation-rules'
import { describeRunStatus } from '@/utils/automation/summary'
import { formatDateTime } from '@/utils/common/datetime'
import RunTimeline from './run-timeline.vue'

const props = defineProps<{ visible: boolean; ruleId: string; ruleName: string }>()
const emit = defineEmits<{ (event: 'update:visible', value: boolean): void }>()

const runs = ref<Run[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(10)
const status = ref<string>('')
const range = ref<[number, number] | null>(null)
const loading = ref(false)
const failure = ref('')
const expanded = ref<string | null>(null)

const statusOptions = [
  { label: '全部结果', value: '' },
  { label: '成功', value: 'succeeded' },
  { label: '部分成功', value: 'partial' },
  { label: '失败', value: 'failed' },
  { label: '执行中', value: 'running' },
  { label: '等待中', value: 'waiting' }
]

const show = computed({
  get: () => props.visible,
  set: value => emit('update:visible', value)
})

async function load() {
  if (!props.ruleId) return
  loading.value = true
  failure.value = ''
  try {
    const result = await listRuns(props.ruleId, {
      limit: pageSize.value,
      offset: (page.value - 1) * pageSize.value,
      status: status.value || undefined,
      after: range.value ? new Date(range.value[0]).toISOString() : undefined,
      before: range.value ? new Date(range.value[1]).toISOString() : undefined
    })
    runs.value = result.runs ?? []
    total.value = result.total ?? 0
  } catch (error) {
    const apiError = error as AutomationApiError
    failure.value = apiError.message || '执行记录加载失败'
    runs.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

function reload() {
  page.value = 1
  load()
}

watch(
  () => props.visible,
  visible => {
    if (visible) reload()
  }
)

function toneOf(statusText: string) {
  const tone = describeRunStatus(statusText).tone
  if (tone === 'ok') return 'success'
  if (tone === 'bad') return 'error'
  if (tone === 'warn') return 'warning'
  return 'info'
}

function toggle(run: Run) {
  expanded.value = expanded.value === run.id ? null : run.id
}
</script>

<template>
  <NModal
    v-model:show="show"
    preset="card"
    :style="{ width: '900px' }"
    :bordered="false"
    :title="`执行记录 · ${ruleName}`"
  >
    <NFlex class="mb-4" align="center" :wrap="true">
      <NDatePicker v-model:value="range" type="datetimerange" clearable @update:value="reload" />
      <NSelect
        v-model:value="status"
        :options="statusOptions"
        class="w-140px"
        placeholder="全部结果"
        @update:value="reload"
      />
      <NButton type="primary" @click="reload">查询</NButton>
      <span class="hint">每次触发都留一条记录，可看每一步做了什么、卡在哪一步。</span>
    </NFlex>

    <div v-if="failure" class="failure">{{ failure }}</div>

    <NSpin :show="loading">
      <NEmpty v-if="!loading && runs.length === 0" description="这段时间内没有执行记录" class="py-10" />
      <NTable v-else size="small" :bordered="false" :single-line="false">
        <thead>
          <tr>
            <th class="w-180px">开始时间</th>
            <th>结果</th>
            <th class="w-120px">设备</th>
            <th class="w-80px">明细</th>
          </tr>
        </thead>
        <tbody>
          <template v-for="run in runs" :key="run.id">
            <tr>
              <td>{{ formatDateTime(run.started_at) }}</td>
              <td>
                <NTag size="small" :type="toneOf(run.status)" :bordered="false">
                  {{ describeRunStatus(run.status, run.reason_code).label }}
                </NTag>
                <span v-if="describeRunStatus(run.status, run.reason_code).hint" class="hint ml-2">
                  {{ describeRunStatus(run.status, run.reason_code).hint }}
                </span>
              </td>
              <td>{{ run.device_id || '—' }}</td>
              <td>
                <NButton text type="primary" size="small" @click="toggle(run)">
                  {{ expanded === run.id ? '收起' : '展开' }}
                </NButton>
              </td>
            </tr>
            <tr v-if="expanded === run.id">
              <td colspan="4">
                <NCard size="small" :bordered="false" embedded>
                  <RunTimeline :run="run" />
                </NCard>
              </td>
            </tr>
          </template>
        </tbody>
      </NTable>
    </NSpin>

    <NFlex justify="end" class="mt-4">
      <NPagination v-model:page="page" :page-size="pageSize" :item-count="total" :page-slot="6" @update:page="load" />
    </NFlex>
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
</style>
