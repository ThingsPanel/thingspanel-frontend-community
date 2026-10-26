<script setup lang="tsx">
/**
 * The rule list.
 *
 * It answers three questions per row without opening anything: what does this
 * rule do (one sentence), is it on, and when was it last changed. The action
 * column separates "立即执行" from "试运行" by wording and by confirmation,
 * because one of them moves equipment.
 *
 * The enable switch writes first and updates the row afterwards. The old page
 * flipped the switch and then called the service, so a refused write left the
 * screen claiming the rule was on.
 */
import { computed, onMounted, ref } from 'vue'
import {
  NButton,
  NCard,
  NEmpty,
  NFlex,
  NInput,
  NModal,
  NPagination,
  NPopconfirm,
  NSelect,
  NSpace,
  NSwitch,
  NTag,
  useDialog,
  useMessage
} from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import { IosSearch } from '@vicons/ionicons4'
import { useRouterPush } from '@/hooks/common/router'
import {
  AutomationApiError,
  deleteRule,
  listRules,
  runRule,
  setRuleEnabled,
  type Rule,
  type Run
} from '@/service/api/automation-rules'
import { describeRunStatus, summarizeDefinition } from '@/utils/automation/summary'
import { formatDateTime } from '@/utils/common/datetime'
import { tableThemeOverrides } from '@/utils/table-theme'
import RunTimeline from '../modules/run-timeline.vue'
import RunsDrawer from '../modules/runs-drawer.vue'
import SimulateDrawer from '../modules/simulate-drawer.vue'
import ExplainDrawer from '../modules/explain-drawer.vue'

const dialog = useDialog()
const message = useMessage()
const { routerPushByKey } = useRouterPush()

const rows = ref<Rule[]>([])
const total = ref(0)
const loading = ref(false)
const failure = ref('')
const query = ref({ name: '', kind: '', enabled: '', page: 1, pageSize: 10 })
const busy = ref<Record<string, boolean>>({})

const runsVisible = ref(false)
const simulateVisible = ref(false)
const explainVisible = ref(false)
const activeRule = ref<Rule | null>(null)

const runResult = ref<Run | null>(null)
const runVisible = ref(false)

const kindOptions = [
  { label: '全部类型', value: '' },
  { label: '自动化', value: 'automation' },
  { label: '场景', value: 'scene' },
  { label: '告警策略', value: 'alarm_policy' }
]

const enabledOptions = [
  { label: '全部状态', value: '' },
  { label: '已启用', value: 'true' },
  { label: '已停用', value: 'false' }
]

const kindLabel = (kind: string) => {
  if (kind === 'scene') return '场景'
  if (kind === 'alarm_policy') return '告警策略'
  if (kind === 'schedule') return '定时'
  return '自动化'
}

async function load() {
  loading.value = true
  failure.value = ''
  try {
    const result = await listRules({
      name: query.value.name || undefined,
      kind: query.value.kind || undefined,
      enabled: query.value.enabled || undefined,
      limit: query.value.pageSize,
      offset: (query.value.page - 1) * query.value.pageSize
    })
    rows.value = result.rules ?? []
    total.value = result.total ?? 0
  } catch (error) {
    const apiError = error as AutomationApiError
    failure.value = apiError.message || '规则列表加载失败'
    rows.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

function search() {
  query.value.page = 1
  load()
}

function reset() {
  query.value = { name: '', kind: '', enabled: '', page: 1, pageSize: 10 }
  load()
}

function createRule() {
  routerPushByKey('automation_rule-edit')
}

function editRule(rule: Rule) {
  routerPushByKey('automation_rule-edit', { query: { id: rule.id } })
}

async function toggleEnabled(rule: Rule, next: boolean) {
  busy.value = { ...busy.value, [rule.id]: true }
  try {
    const updated = await setRuleEnabled(rule.id, next, rule.version)
    const index = rows.value.findIndex(item => item.id === rule.id)
    if (index >= 0) rows.value[index] = updated
    message.success(next ? '已启用' : '已停用')
  } catch (error) {
    const apiError = error as AutomationApiError
    if (apiError.code === 'version_conflict' || apiError.httpStatus === 409) {
      message.error('这条规则刚被别处改过，请刷新后再切换')
    } else if (apiError.outcomeUnknown) {
      message.warning('网络中断，启停结果未知；刷新列表确认后再操作')
    } else {
      message.error(apiError.message || '启停失败')
    }
    // The switch is bound to the row's value, so nothing was flipped locally.
  } finally {
    const next = { ...busy.value }
    delete next[rule.id]
    busy.value = next
  }
}

function openRuns(rule: Rule) {
  activeRule.value = rule
  runsVisible.value = true
}

function openSimulate(rule: Rule) {
  activeRule.value = rule
  simulateVisible.value = true
}

function openExplain(rule: Rule) {
  activeRule.value = rule
  explainVisible.value = true
}

function runNow(rule: Rule) {
  dialog.warning({
    title: '立即执行',
    content: `这会真的执行「${rule.name}」里的动作，可能开关设备或发送通知。要现在执行吗？`,
    positiveText: '现在执行',
    negativeText: '取消',
    onPositiveClick: async () => {
      busy.value = { ...busy.value, [rule.id]: true }
      try {
        const run = await runRule(rule.id, {})
        runResult.value = run
        runVisible.value = true
      } catch (error) {
        const apiError = error as AutomationApiError
        if (apiError.outcomeUnknown) {
          message.warning('网络中断，执行结果未知；先看执行记录再决定是否重试，避免重复下发')
          openRuns(rule)
        } else {
          message.error(apiError.message || '执行失败')
        }
      } finally {
        const next = { ...busy.value }
        delete next[rule.id]
        busy.value = next
      }
      return true
    }
  })
}

function removeRule(rule: Rule) {
  dialog.warning({
    title: '删除规则',
    content: `删除「${rule.name}」后不会再执行。要删除吗？`,
    positiveText: '删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await deleteRule(rule.id, { version: rule.version })
        message.success('已删除')
        await load()
      } catch (error) {
        const apiError = error as AutomationApiError
        const referencers = apiError.detail.referencing_rule_ids ?? []
        if (referencers.length) {
          message.error(`还有规则在引用它：${referencers.join('、')}；先解除引用再删除`)
        } else if (apiError.outcomeUnknown) {
          message.warning('网络中断，删除结果未知；刷新列表确认')
        } else {
          message.error(apiError.message || '删除失败')
        }
      }
      return true
    }
  })
}

const columns = computed<DataTableColumns<Rule>>(() => [
  {
    key: 'name',
    title: '规则',
    minWidth: '320px',
    render: row => (
      <div class="rule-name">
        <div class="rule-name__title">{row.name}</div>
        <div class="rule-name__summary">{summarizeDefinition(row.definition)}</div>
      </div>
    )
  },
  {
    key: 'kind',
    title: '类型',
    width: '100px',
    render: row => (
      <NTag size="small" bordered={false}>
        {kindLabel(row.kind)}
      </NTag>
    )
  },
  {
    key: 'enabled',
    title: '启用',
    width: '90px',
    render: row => (
      <NSwitch
        value={row.enabled}
        loading={busy.value[row.id]}
        onUpdateValue={(value: boolean) => toggleEnabled(row, value)}
      />
    )
  },
  {
    key: 'revision',
    title: '修订',
    width: '80px',
    render: row => <span class="muted">v{row.revision}</span>
  },
  {
    key: 'updated_at',
    title: '最近修改',
    width: '160px',
    render: row => <span class="muted">{formatDateTime(row.updated_at)}</span>
  },
  {
    key: 'actions',
    title: '操作',
    width: '470px',
    render: row => (
      <NSpace justify="start" size={6}>
        <NButton size="small" type="primary" onClick={() => editRule(row)}>
          编辑
        </NButton>
        <NButton size="small" onClick={() => runNow(row)}>
          立即执行
        </NButton>
        <NButton size="small" type="tertiary" onClick={() => openSimulate(row)}>
          试运行
        </NButton>
        <NButton size="small" type="tertiary" onClick={() => openRuns(row)}>
          执行记录
        </NButton>
        <NButton size="small" type="tertiary" onClick={() => openExplain(row)}>
          为什么不触发
        </NButton>
        <NPopconfirm onPositiveClick={() => removeRule(row)}>
          {{
            default: () => '确认删除？',
            trigger: () => (
              <NButton size="small" type="error">
                删除
              </NButton>
            )
          }}
        </NPopconfirm>
      </NSpace>
    )
  }
])

onMounted(load)
</script>

<template>
  <div class="h-full w-full">
    <NCard>
      <div class="content-header">
        <div class="content-header__title">
          <h2>自动化规则</h2>
          <span>{{ total }} 条</span>
        </div>
        <div class="content-header__toolbar">
          <NButton type="primary" @click="createRule">新建规则</NButton>
          <div class="content-header__actions">
            <NInput v-model:value="query.name" placeholder="按名称搜索" class="search-field" clearable>
              <template #prefix>
                <NIcon><IosSearch /></NIcon>
              </template>
            </NInput>
            <NSelect v-model:value="query.kind" :options="kindOptions" class="w-140px" />
            <NSelect v-model:value="query.enabled" :options="enabledOptions" class="w-130px" />
            <NButton type="primary" @click="search">查询</NButton>
            <NButton @click="reset">重置</NButton>
          </div>
        </div>
      </div>

      <div v-if="failure" class="failure">
        {{ failure }}
        <NButton text type="primary" size="small" class="ml-2" @click="load">重试</NButton>
      </div>

      <n-data-table
        class="thingspanel-data-table mt-4"
        size="medium"
        :theme-overrides="tableThemeOverrides"
        :bordered="true"
        :bottom-bordered="true"
        :single-line="true"
        :scroll-x="1120"
        :row-key="(row: Rule) => row.id"
        :columns="columns"
        :data="rows"
        :loading="loading"
      >
        <template #empty>
          <NEmpty size="small" description="还没有规则，点右上角新建一条" />
        </template>
      </n-data-table>

      <NFlex justify="flex-end" class="mt-4">
        <NPagination v-model:page="query.page" :page-size="query.pageSize" :item-count="total" @update:page="load" />
      </NFlex>
    </NCard>

    <RunsDrawer v-if="activeRule" v-model:visible="runsVisible" :rule-id="activeRule.id" :rule-name="activeRule.name" />
    <SimulateDrawer
      v-if="activeRule"
      v-model:visible="simulateVisible"
      :rule-id="activeRule.id"
      :rule-name="activeRule.name"
    />
    <ExplainDrawer
      v-if="activeRule"
      v-model:visible="explainVisible"
      :rule-id="activeRule.id"
      :rule-name="activeRule.name"
    />

    <NModal v-model:show="runVisible" preset="card" :style="{ width: '720px' }" :bordered="false" title="本次执行">
      <template v-if="runResult">
        <NTag
          :type="describeRunStatus(runResult.status, runResult.reason_code).tone === 'ok' ? 'success' : 'warning'"
          :bordered="false"
          class="mb-3"
        >
          {{ describeRunStatus(runResult.status, runResult.reason_code).label }}
        </NTag>
        <RunTimeline :run="runResult" />
      </template>
    </NModal>
  </div>
</template>

<style scoped>
.rule-name__title {
  color: var(--text-color);
  font-weight: 600;
}

.rule-name__summary {
  margin-top: 2px;
  color: var(--text-color-3);
  font-size: 12px;
  line-height: 1.5;
}

.muted {
  color: var(--text-color-3);
  font-size: 12px;
}

.failure {
  margin-top: 12px;
  padding: 8px 12px;
  border-radius: 8px;
  background: rgb(254 226 226);
  color: rgb(153 27 27);
  font-size: 13px;
}

.content-header__title {
  display: flex;
  align-items: baseline;
  gap: 10px;

  h2 {
    margin: 0;
    font-size: 20px;
    font-weight: 700;
  }

  span {
    color: var(--text-color-3);
    font-size: 13px;
  }
}

.content-header__toolbar {
  display: flex;
  width: 100%;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-top: 12px;
}

.content-header__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}
</style>
