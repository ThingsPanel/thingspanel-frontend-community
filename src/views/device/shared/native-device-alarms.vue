<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { NAlert, NButton, NEmpty, NFlex, NPopconfirm, NSelect, NTag, NTabs, NTabPane } from 'naive-ui'
import { RouterLink, useRoute } from 'vue-router'
import { useAuthStore } from '@/store/modules/auth'
import {
  AutomationNativeError,
  automationNative,
  createAutomationRequestId,
  mergeAutomationAlarmPages,
  type AutomationAlarm
} from '@/service/api/automation-native-client'
import { alarmLifecycleLabel, formatAlarmEvidence } from '@/utils/alarm-presentation'
import { formatDateTime } from '@/utils/common/datetime'
import NativeAutomationPanel from './native-automation-panel.vue'

const props = defineProps<{ deviceId: string }>()
const authStore = useAuthStore()
const canAcknowledge = computed(() => authStore.userInfo.roles?.includes('TENANT_ADMIN') ?? false)
const route = useRoute()
const selectedTab = ref<'history' | 'policies'>(route.query.alarmTab === 'policies' ? 'policies' : 'history')
const selectedState = ref<'all' | 'active' | 'cleared'>('all')
const stateOptions = [
  { label: '全部状态', value: 'all' },
  { label: '未恢复', value: 'active' },
  { label: '已恢复', value: 'cleared' }
]
const alarms = ref<AutomationAlarm[]>([])
const expandedId = ref<string | null>(null)
const loading = ref(false)
const totalAlarms = ref(0)
const nextOffset = ref(0)
const pageLimit = 50
const hasMoreAlarms = computed(() => alarms.value.length < totalAlarms.value)
const readingBack = ref<string[]>([])
const pendingAckIds = ref<string[]>([])
const pendingRequestIds = ref<Record<string, string>>({})
const ackWarnings = ref<Record<string, string>>({})
const pageError = ref('')
let requestGeneration = 0

function setListItem(value: AutomationAlarm) {
  const index = alarms.value.findIndex(item => item.id === value.id)
  if (index >= 0) alarms.value.splice(index, 1, value)
  else alarms.value.unshift(value)
  alarms.value.sort((a, b) => Date.parse(b.opened_at) - Date.parse(a.opened_at) || b.id.localeCompare(a.id))
}

function isCurrentView(targetId: string, generation: number, state: 'all' | 'active' | 'cleared') {
  return props.deviceId === targetId && requestGeneration === generation && selectedState.value === state
}

function syncVisibleAlarm(value: AutomationAlarm, state: 'all' | 'active' | 'cleared') {
  if (state === 'all' || value.state === state) {
    setListItem(value)
    return
  }
  alarms.value = alarms.value.filter(item => item.id !== value.id)
}

async function loadAlarms() {
  expandedId.value = null
  const generation = ++requestGeneration
  if (!props.deviceId) {
    alarms.value = []
    totalAlarms.value = 0
    nextOffset.value = 0
    pageError.value = ''
    loading.value = false
    return
  }
  loading.value = true
  pageError.value = ''
  alarms.value = []
  totalAlarms.value = 0
  nextOffset.value = 0
  try {
    const result = await automationNative.alarms(
      props.deviceId,
      selectedState.value === 'all' ? undefined : selectedState.value,
      pageLimit,
      0
    )
    if (generation !== requestGeneration) return
    alarms.value = result.alarms
    totalAlarms.value = result.total
    nextOffset.value = result.offset + result.limit
  } catch (error) {
    if (generation === requestGeneration) {
      pageError.value = error instanceof Error ? error.message : '告警列表读取失败。'
      alarms.value = []
    }
  } finally {
    if (generation === requestGeneration) loading.value = false
  }
}

async function loadMoreAlarms() {
  if (loading.value || !hasMoreAlarms.value || !props.deviceId) return
  const generation = requestGeneration
  const targetId = props.deviceId
  const state = selectedState.value === 'all' ? undefined : selectedState.value
  loading.value = true
  pageError.value = ''
  try {
    const result = await automationNative.alarms(targetId, state, pageLimit, nextOffset.value)
    if (generation !== requestGeneration || props.deviceId !== targetId || selectedState.value !== (state ?? 'all'))
      return
    alarms.value = mergeAutomationAlarmPages(alarms.value, result.alarms)
    totalAlarms.value = result.total
    nextOffset.value = result.offset + result.limit
  } catch (error) {
    if (generation === requestGeneration)
      pageError.value = error instanceof Error ? error.message : '告警列表读取失败。'
  } finally {
    if (generation === requestGeneration) loading.value = false
  }
}

async function readBackAlarm(alarmId: string, targetId = props.deviceId) {
  if (!targetId || props.deviceId !== targetId) return
  const generation = requestGeneration
  const state = selectedState.value
  readingBack.value = [...readingBack.value, alarmId]
  try {
    const current = await automationNative.alarm(alarmId)
    if (!isCurrentView(targetId, generation, state)) return
    syncVisibleAlarm(current, state)
    if (current.acked_at) {
      delete pendingRequestIds.value[alarmId]
      delete ackWarnings.value[alarmId]
    } else if (pendingRequestIds.value[alarmId]) {
      ackWarnings.value[alarmId] = '读回后仍未见确认记录。重试确认会沿用本次提交；确认不会恢复告警。'
    }
  } catch (error) {
    if (isCurrentView(targetId, generation, state)) {
      ackWarnings.value[alarmId] = error instanceof Error ? error.message : '状态读取失败。'
    }
  } finally {
    readingBack.value = readingBack.value.filter(id => id !== alarmId)
  }
}

function requestIdFor(alarmId: string) {
  return pendingRequestIds.value[alarmId] || createAutomationRequestId()
}

async function acknowledge(alarm: AutomationAlarm) {
  if (!canAcknowledge.value || alarm.state !== 'active' || alarm.acked_at || pendingAckIds.value.includes(alarm.id))
    return
  const targetId = props.deviceId
  const generation = requestGeneration
  const state = selectedState.value
  const currentView = () => isCurrentView(targetId, generation, state)
  const requestId = requestIdFor(alarm.id)
  pendingRequestIds.value[alarm.id] = requestId
  pendingAckIds.value = [...pendingAckIds.value, alarm.id]
  ackWarnings.value[alarm.id] = ''
  let unknown = false
  try {
    await automationNative.ack(alarm.id, requestId)
  } catch (error) {
    if (error instanceof AutomationNativeError && error.outcomeUnknown) {
      unknown = true
      if (currentView()) ackWarnings.value[alarm.id] = '确认结果暂不确定，正在读回状态。'
    } else {
      const fields = error instanceof AutomationNativeError ? error.fieldIssues : []
      if (currentView()) {
        ackWarnings.value[alarm.id] =
          fields.map(issue => `${issue.field}：${issue.message}`).join('；') ||
          (error instanceof Error ? error.message : '告警确认失败。')
      }
      return
    }
  } finally {
    pendingAckIds.value = pendingAckIds.value.filter(id => id !== alarm.id)
  }

  readingBack.value = [...readingBack.value, alarm.id]
  try {
    const current = await automationNative.alarm(alarm.id)
    if (currentView()) syncVisibleAlarm(current, state)
    if (current.acked_at) {
      delete pendingRequestIds.value[alarm.id]
      if (currentView()) delete ackWarnings.value[alarm.id]
      return
    }
    if (currentView()) {
      ackWarnings.value[alarm.id] = unknown
        ? '读回后仍未见确认记录。重试确认会沿用本次提交；确认不会恢复告警。'
        : '服务未报告确认状态，已读回当前告警。确认不会恢复告警。'
    }
  } catch (error) {
    if (currentView()) {
      ackWarnings.value[alarm.id] = `无法读回确认结果。${error instanceof Error ? error.message : ''}`
    }
  } finally {
    readingBack.value = readingBack.value.filter(id => id !== alarm.id)
  }
}

const ruleNames = ref<Record<string, string>>({})
watch(
  () => props.deviceId,
  async (deviceId, _, onCleanup) => {
    let current = true
    onCleanup(() => {
      current = false
    })
    ruleNames.value = {}
    if (!deviceId) return
    try {
      const result = await automationNative.deviceAutomation(deviceId)
      if (current) ruleNames.value = Object.fromEntries(result.rules.map(rule => [rule.rule_id, rule.rule_name]))
    } catch {
      // Alarm history remains available if the rule directory is unavailable.
    }
  },
  { immediate: true }
)

const levelLabel = (level?: string) => ({ H: '高级', M: '中级', L: '低级' })[level || '']
const isReadingBack = (id: string) => readingBack.value.includes(id)
const isAckPending = (id: string) => pendingAckIds.value.includes(id)

watch(
  () => [props.deviceId, selectedState.value],
  () => void loadAlarms(),
  { immediate: true }
)
</script>

<template>
  <NTabs v-model:value="selectedTab" type="line" animated>
    <template #suffix>
      <NFlex v-if="selectedTab === 'history'" align="center" :size="8">
        <NSelect
          v-model:value="selectedState"
          aria-label="告警状态"
          :options="stateOptions"
          size="small"
          class="alarm-filter"
        />
        <NButton size="small" :loading="loading" @click="loadAlarms">刷新</NButton>
      </NFlex>
    </template>
    <NTabPane name="history">
      <template #tab>
        告警历史
        <span v-if="!loading && !pageError" class="alarm-count">（{{ totalAlarms }}）</span>
      </template>
      <NAlert v-if="pageError" class="mb-4" type="error" :show-icon="false">{{ pageError }}</NAlert>
      <div v-if="loading && !alarms.length" class="py-8 text-center text-secondary">读取告警中…</div>
      <NEmpty v-else-if="!alarms.length && !pageError" description="暂无告警记录" />
      <div v-if="alarms.length" class="alarm-list">
        <table aria-label="告警历史">
          <thead>
            <tr>
              <th>发生时间</th>
              <th>告警名称</th>
              <th>级别</th>
              <th>状态</th>
              <th>最近检测</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="alarm in alarms" :key="alarm.id">
              <tr class="alarm-row">
                <td data-label="发生时间">
                  <time :datetime="alarm.opened_at">{{ formatDateTime(alarm.opened_at) }}</time>
                </td>
                <td data-label="告警名称">
                  <RouterLink
                    v-if="canAcknowledge && ruleNames[alarm.policy_id]"
                    class="rule-link"
                    :to="{
                      path: '/automation/rule-edit',
                      query: { id: alarm.policy_id, device_id: deviceId, backType: 'device', alarmTab: 'history' }
                    }"
                  >
                    {{ ruleNames[alarm.policy_id] }}
                  </RouterLink>
                  <span v-else>{{ ruleNames[alarm.policy_id] || '历史告警（名称不可用）' }}</span>
                </td>
                <td data-label="级别">{{ levelLabel(alarm.level) || '—' }}</td>
                <td data-label="状态">
                  <NTag size="small" :bordered="false" :type="alarm.state === 'active' ? 'warning' : 'default'">
                    {{ alarmLifecycleLabel(alarm) || '状态未知' }}
                  </NTag>
                </td>
                <td data-label="最近检测">{{ formatAlarmEvidence(alarm.last_evidence) || '—' }}</td>
                <td data-label="操作">
                  <NFlex align="center" :size="12">
                    <NButton
                      text
                      size="small"
                      type="primary"
                      :aria-expanded="expandedId === alarm.id"
                      @click="expandedId = expandedId === alarm.id ? null : alarm.id"
                    >
                      {{ expandedId === alarm.id ? '收起' : '详情' }}
                    </NButton>
                    <NPopconfirm
                      v-if="canAcknowledge && alarm.state === 'active' && !alarm.acked_at"
                      :positive-text="pendingRequestIds[alarm.id] ? '重试确认' : '确认告警'"
                      negative-text="取消"
                      @positive-click="acknowledge(alarm)"
                    >
                      <template #trigger>
                        <NButton
                          size="small"
                          text
                          type="primary"
                          :disabled="isAckPending(alarm.id) || isReadingBack(alarm.id)"
                          :loading="isAckPending(alarm.id) || isReadingBack(alarm.id)"
                        >
                          {{ pendingRequestIds[alarm.id] ? '重试确认' : '确认告警' }}
                        </NButton>
                      </template>
                      确认只记录已知悉，不会恢复或清除告警。
                    </NPopconfirm>
                    <NButton
                      v-else-if="ackWarnings[alarm.id]"
                      size="small"
                      :loading="isReadingBack(alarm.id)"
                      @click="loadAlarms"
                    >
                      刷新状态
                    </NButton>
                  </NFlex>
                </td>
              </tr>
              <tr v-if="expandedId === alarm.id" class="detail-row">
                <td colspan="6">
                  <div class="timeline">
                    <span>发生 {{ formatDateTime(alarm.opened_at) }}</span>
                    <span v-if="alarm.acked_at">确认 {{ formatDateTime(alarm.acked_at) }}</span>
                    <span v-if="alarm.cleared_at">恢复 {{ formatDateTime(alarm.cleared_at) }}</span>
                  </div>
                  <details class="alarm-details">
                    <summary>技术详情</summary>
                    <dl>
                      <dt>规则标识</dt>
                      <dd>{{ alarm.policy_key }}</dd>
                      <dt>规则 ID</dt>
                      <dd>{{ alarm.policy_id }}</dd>
                      <dt>设备 ID</dt>
                      <dd>{{ alarm.subject_id }}</dd>
                      <template v-if="alarm.acked_by">
                        <dt>确认人 ID</dt>
                        <dd>{{ alarm.acked_by }}</dd>
                      </template>
                      <template v-if="alarm.last_evidence">
                        <dt>原始证据</dt>
                        <dd>{{ alarm.last_evidence }}</dd>
                      </template>
                    </dl>
                  </details>
                </td>
              </tr>
              <tr v-if="ackWarnings[alarm.id]">
                <td colspan="6">
                  <NAlert v-if="ackWarnings[alarm.id]" class="mt-3" type="warning" :show-icon="false">
                    <NFlex justify="space-between" align="center">
                      <span>{{ ackWarnings[alarm.id] }}</span>
                      <NButton size="small" :loading="isReadingBack(alarm.id)" @click="readBackAlarm(alarm.id)">
                        重新读回
                      </NButton>
                    </NFlex>
                  </NAlert>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
      <NFlex v-if="hasMoreAlarms" justify="center" class="mt-4">
        <NButton :loading="loading" @click="loadMoreAlarms">加载更多告警</NButton>
      </NFlex>
    </NTabPane>
    <NTabPane name="policies" tab="告警规则">
      <NativeAutomationPanel scope="device" :target-id="deviceId" kind="alarm_policy" />
    </NTabPane>
  </NTabs>
</template>

<style scoped>
.alarm-filter {
  width: clamp(88px, 12vw, 128px);
}
.alarm-count {
  font-size: 0.88em;
  font-variant-numeric: tabular-nums;
}
.alarm-list {
  container-type: inline-size;
}
.alarm-list table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 14px;
}
.alarm-list th,
.alarm-list td {
  padding: 12px 14px;
  border-bottom: 1px solid var(--n-tab-border-color, var(--border-color, #e5e7eb));
  overflow-wrap: anywhere;
}
.alarm-list th {
  font-weight: 600;
}
.alarm-list time {
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}
.rule-link {
  color: var(--primary-color, #555bd8);
  text-decoration: none;
}
.rule-link:hover,
.rule-link:focus-visible {
  text-decoration: underline;
}
.timeline {
  display: flex;
  gap: 8px 24px;
  flex-wrap: wrap;
}
.text-secondary,
.timeline {
  font-size: 13px;
  color: var(--text-color-2);
}
@container (max-width: 820px) {
  .alarm-list thead {
    position: absolute;
    width: 1px;
    height: 1px;
    clip-path: inset(50%);
    overflow: hidden;
  }
  .alarm-list table,
  .alarm-list tbody,
  .alarm-list tr {
    display: block;
  }
  .alarm-list .alarm-row {
    padding: 10px 0;
    border-bottom: 1px solid var(--border-color, #e5e7eb);
  }
  .alarm-list .alarm-row td {
    display: grid;
    grid-template-columns: 68px minmax(0, 1fr);
    gap: 8px;
    align-items: baseline;
    padding: 4px 8px;
    border: 0;
    justify-items: start;
  }
  .alarm-row td::before {
    content: attr(data-label);
    color: var(--text-color-2);
  }
  .alarm-list .detail-row td {
    display: block;
  }
}
.alarm-details {
  margin-top: 10px;
  font-size: 13px;
}
.alarm-details summary {
  width: fit-content;
  cursor: pointer;
  color: var(--text-color-2);
}
.alarm-details dl {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 4px 16px;
  margin: 8px 0 0;
}
.alarm-details dd {
  margin: 0;
  overflow-wrap: anywhere;
}
</style>
