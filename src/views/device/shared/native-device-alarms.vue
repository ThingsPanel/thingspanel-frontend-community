<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { NAlert, NButton, NCard, NEmpty, NFlex, NPopconfirm, NSelect, NTag, NTabs, NTabPane } from 'naive-ui'
import { useAuthStore } from '@/store/modules/auth'
import {
  AutomationNativeError,
  automationNative,
  createAutomationRequestId,
  mergeAutomationAlarmPages,
  type AutomationAlarm
} from '@/service/api/automation-native-client'
import NativeAutomationPanel from './native-automation-panel.vue'

const props = defineProps<{ deviceId: string }>()
const authStore = useAuthStore()
const canAcknowledge = computed(() => authStore.userInfo.roles?.includes('TENANT_ADMIN') ?? false)
const selectedTab = ref<'history' | 'policies'>('history')
const selectedState = ref<'all' | 'active' | 'cleared'>('all')
const stateOptions = [
  { label: '全部（活动与已恢复）', value: 'all' },
  { label: '活动', value: 'active' },
  { label: '已恢复', value: 'cleared' }
]
const alarms = ref<AutomationAlarm[]>([])
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

const levelLabel = (level?: string) => ({ H: '高 H', M: '中 M', L: '低 L' })[level || ''] || '等级未提供'
const stateLabel = (state: string) => (state === 'active' ? '活动' : state === 'cleared' ? '已恢复' : state)
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
    <NTabPane name="history" tab="告警历史">
      <NFlex justify="space-between" align="center" class="mb-4">
        <span class="text-secondary">仅查询活动与已恢复告警；已读取 {{ alarms.length }} / {{ totalAlarms }} 条。</span>
        <NFlex>
          <NSelect v-model:value="selectedState" :options="stateOptions" class="w-220px" />
          <NButton :loading="loading" @click="loadAlarms">刷新</NButton>
        </NFlex>
      </NFlex>
      <NAlert v-if="pageError" class="mb-4" type="error" :show-icon="false">{{ pageError }}</NAlert>
      <div v-if="loading && !alarms.length" class="py-8 text-center text-secondary">读取告警中…</div>
      <NEmpty v-else-if="!alarms.length && !pageError" description="当前没有活动或已恢复告警。" />
      <NCard v-for="alarm in alarms" :key="alarm.id" size="small" class="mb-3">
        <NFlex justify="space-between" align="center">
          <div>
            <strong>{{ alarm.policy_key }}</strong>
            <NTag class="ml-2" :type="alarm.state === 'active' ? 'warning' : 'default'">
              {{ stateLabel(alarm.state) }}
            </NTag>
            <NTag class="ml-2" type="info">{{ levelLabel(alarm.level) }}</NTag>
          </div>
          <NPopconfirm
            v-if="canAcknowledge && alarm.state === 'active' && !alarm.acked_at"
            :positive-text="pendingRequestIds[alarm.id] ? '重试确认' : '确认告警'"
            negative-text="取消"
            @positive-click="acknowledge(alarm)"
          >
            <template #trigger>
              <NButton
                size="small"
                type="warning"
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
        <div class="alarm-meta mt-2">
          <span>策略：{{ alarm.policy_id }}</span>
          <span>对象：{{ alarm.subject_id }}</span>
          <span>开始：{{ alarm.opened_at }}</span>
          <span v-if="alarm.acked_at">确认：{{ alarm.acked_at }}（{{ alarm.acked_by || '操作者未提供' }}）</span>
          <span v-if="alarm.cleared_at">恢复：{{ alarm.cleared_at }}</span>
          <span v-if="alarm.last_evidence">最近证据：{{ alarm.last_evidence }}</span>
        </div>
        <NAlert v-if="ackWarnings[alarm.id]" class="mt-3" type="warning" :show-icon="false">
          <NFlex justify="space-between" align="center">
            <span>{{ ackWarnings[alarm.id] }}</span>
            <NButton size="small" :loading="isReadingBack(alarm.id)" @click="readBackAlarm(alarm.id)">重新读回</NButton>
          </NFlex>
        </NAlert>
      </NCard>
      <NFlex v-if="hasMoreAlarms" justify="center" class="mt-4">
        <NButton :loading="loading" @click="loadMoreAlarms">加载更多告警</NButton>
      </NFlex>
    </NTabPane>
    <NTabPane name="policies" tab="告警策略">
      <NativeAutomationPanel scope="device" :target-id="deviceId" kind="alarm_policy" />
    </NTabPane>
  </NTabs>
</template>

<style scoped>
.alarm-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 20px;
  color: var(--text-color-3);
  font-size: 13px;
}
.text-secondary {
  color: var(--text-color-3);
  font-size: 13px;
}
</style>
