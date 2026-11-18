<script setup lang="ts">
import { h, onMounted, onUnmounted, nextTick, ref } from 'vue'
import dayjs from 'dayjs'
import { useI18n } from 'vue-i18n'

import { $t } from '@/locales'
import { Refresh, HelpCircleOutline } from '@vicons/ionicons5'
import { NDataTable, NEmpty, NTag } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import { deviceDiagnosticsNative } from '@/service/api/device-diagnostics-native'
import type { DiagnosticCheck, DiagnosticCounter } from '@/service/api/device-diagnostics-native'
import { deviceDebugNative, parseStoredDebugSession } from '@/service/api/device-debug-native'
import { newIdempotencyKey } from '@/service/api/device-write-attempt'
import { readCumulativeDeviceStatistics } from '@/service/api/device-runtime-cumulative-statistics'
import type { CumulativeDeviceStatistics } from '@/service/api/device-runtime-cumulative-statistics'

const { locale } = useI18n()
const checkLabels: Record<string, [string, string]> = {
  DEVICE_FOUND: ['设备资料可读取', 'Device metadata available'],
  CONFIGURATION_INCOMPLETE: ['尚未配置接入方式', 'Access configuration missing'],
  CONFIGURATION_PENDING: ['接入配置待生效', 'Access configuration pending'],
  CONFIGURATION_SET: ['接入配置已设置', 'Access configuration set'],
  RUNTIME_UNAVAILABLE: ['连接状态暂不可读取', 'Connectivity unavailable'],
  DEVICE_ONLINE: ['设备在线', 'Device online'],
  DEVICE_OFFLINE: ['设备离线', 'Device offline'],
  NO_INGESTION_STATS: ['暂无完整上报统计', 'Complete ingestion statistics unavailable'],
  MODEL_BOUND: ['物模型版本已绑定', 'Thing model version bound'],
  MODEL_NOT_BOUND: ['尚未绑定物模型版本', 'No thing model version bound'],
  NO_RECENT_COMMAND: ['当前时段无下发命令', 'No command in this period'],
  LAST_COMMAND_ACKNOWLEDGED: [
    '最近命令已回执（不代表物理动作已完成）',
    'Last command acknowledged (physical effect unverified)'
  ],
  CREDENTIAL_ACTIVE: ['接入凭据可用', 'Access credential available'],
  CREDENTIAL_PENDING: ['接入凭据待激活', 'Access credential activation pending'],
  NO_CREDENTIAL: ['尚未创建接入凭据', 'No access credential created'],
  CREDENTIAL_REVOKED: ['接入凭据已全部撤销', 'All access credentials revoked'],
  CREDENTIAL_EXPIRED: ['接入凭据已全部过期', 'All access credentials expired'],
  CREDENTIAL_UNAVAILABLE: ['暂无可用接入凭据', 'No usable access credential']
}
function checkLabel(check: DiagnosticCheck) {
  const label = checkLabels[check.code]
  return label ? label[locale.value.toLowerCase().startsWith('zh') ? 0 : 1] : check.message || check.code
}

// 失败记录类型
interface FailureRecord {
  timestamp: string
  direction: 'uplink' | 'downlink'
  stage: string
  error: string
}

// 属性定义 props
const props = defineProps<{
  id: string
}>()

const counters = ref<CumulativeDeviceStatistics | null>(null)

function displayRate(counter: DiagnosticCounter | undefined) {
  return counter?.successRate == null ? '--' : (counter.successRate * 100).toFixed(1) + '%'
}

function displayCount(counter: DiagnosticCounter | undefined) {
  if (!counter?.complete || counter.total == null || counter.success == null) {
    return $t('custom.device_details.cumulativeStatisticsUnavailable')
  }
  if (counter.total === 0) return $t('custom.device_details.cumulativeStatisticsEmpty')
  return counter.success + ' / ' + counter.total
}

// 失败记录表格数据
const failureRecords = ref<FailureRecord[]>([])
const diagnosticChecks = ref<DiagnosticCheck[]>([])
const diagnosticError = ref('')
let diagnosticsRequest = 0
const failuresTruncated = ref(false)

const tableThemeOverrides = {
  borderColor: 'var(--border-color)',
  borderRadius: '10px',
  fontSizeMedium: '14px',
  lineHeight: '1.5',
  thColor: 'var(--body-color)',
  thColorHover: 'var(--body-color)',
  thFontWeight: '400',
  thTextColor: 'var(--text-color)',
  tdColor: 'var(--card-color)',
  tdColorHover: 'var(--primary-color-suppl)',
  tdColorSorting: 'var(--primary-color-suppl)',
  tdTextColor: 'var(--text-color)',
  thPaddingMedium: '12px',
  tdPaddingMedium: '13px 12px'
}

const failureRecordRowKey = (row: FailureRecord) => `${row.timestamp}-${row.direction}-${row.stage}-${row.error}`

// 表格列定义
const columns: DataTableColumns<FailureRecord> = [
  {
    title: $t('custom.device_details.time'),
    key: 'timestamp',
    width: 200,
    render: (row: FailureRecord) => {
      if (row.timestamp) {
        return dayjs(row.timestamp).format('YYYY-MM-DD HH:mm:ss')
      }
      return '--'
    }
  },
  {
    title: $t('custom.device_details.direction'),
    key: 'direction',
    width: 150,
    render: (row: FailureRecord) => {
      const direction =
        row.direction === 'uplink' ? $t('custom.device_details.uplink') : $t('custom.device_details.downlink')
      return h(
        NTag,
        { type: row.direction === 'uplink' ? 'info' : 'warning', size: 'small' },
        { default: () => direction }
      )
    }
  },
  {
    title: $t('custom.device_details.phase'),
    key: 'stage',
    width: 200
  },
  {
    title: $t('custom.device_details.errorDescription'),
    key: 'error',
    ellipsis: {
      tooltip: true
    }
  }
]

// 获取诊断数据：统计缺口以“--”显示，不补 0 或 100%
const fetchDiagnostics = async () => {
  const deviceId = props.id
  const request = ++diagnosticsRequest
  const current = () => request === diagnosticsRequest && deviceId === props.id
  void readCumulativeDeviceStatistics(deviceId).then(stats => {
    if (current()) counters.value = stats
  })
  try {
    const data = await deviceDiagnosticsNative.get(deviceId, { recentFailureLimit: 20 })
    if (!current()) return
    diagnosticError.value = ''
    diagnosticChecks.value = data.checks.filter(check => check.code !== 'NO_INGESTION_STATS')
    failuresTruncated.value = data.recentFailuresTruncated
    failureRecords.value = data.recentFailures.map(failure => ({
      timestamp: failure.timestamp,
      direction: failure.direction === 'downlink' ? 'downlink' : 'uplink',
      stage: failure.stage,
      error: failure.message
    }))
  } catch (error) {
    if (!current()) return
    diagnosticError.value = error instanceof Error ? error.message : '诊断读取失败'
  }
}

// 刷新数据
const refresh = () => {
  fetchDiagnostics()
  getLogStatus()
  void fetchLogs()
}

// 日志相关
const logEnabled = ref(false)
const debugLogs = ref<string[]>([])
const debugLogError = ref(false)
const debugLogLoading = ref(false)
const debugModeChanging = ref(false)
let logTimer: NodeJS.Timeout | null = null
const logContainerRef = ref<HTMLElement | null>(null)

// 调试会话：契约没有“读取当前会话”，开关状态只记住本浏览器开启的会话。
const sessionStorageKey = () => `device-debug-session:${props.id}`
let activeSession: { id: string; expiresAt: string } | null = null
let pendingKey: { action: 'start' | 'stop'; key: string } | null = null

function readStoredSession() {
  try {
    return parseStoredDebugSession(window.localStorage.getItem(sessionStorageKey()), Date.now())
  } catch {
    return null
  }
}

function writeStoredSession(value: { id: string; expiresAt: string } | null) {
  try {
    if (value) window.localStorage.setItem(sessionStorageKey(), JSON.stringify(value))
    else window.localStorage.removeItem(sessionStorageKey())
  } catch {
    /* storage is only a per-browser convenience */
  }
}

const getLogStatus = () => {
  activeSession = readStoredSession()
  logEnabled.value = activeSession !== null
  if (logEnabled.value) startLogPolling()
  else stopLogPolling()
}

// 切换调试会话
const handleLogSwitch = async (value: boolean) => {
  if (debugModeChanging.value) return
  debugModeChanging.value = true
  const action = value ? 'start' : 'stop'
  // 结果未知（没有 HTTP 状态）后再次点击，沿用同一个幂等键重试，避免重复开启。
  const key = pendingKey?.action === action ? pendingKey.key : newIdempotencyKey()
  pendingKey = { action, key }
  try {
    if (value) {
      const session = await deviceDebugNative.createSession(props.id, 1800, key)
      activeSession = { id: session.id, expiresAt: session.expiresAt }
      writeStoredSession(activeSession)
      logEnabled.value = true
    } else if (activeSession) {
      try {
        await deviceDebugNative.stopSession(props.id, activeSession.id, key)
      } catch (e) {
        // 404：会话已被替换或已不存在，本地记录作废。
        if ((e as { status?: number }).status !== 404) throw e
      }
      activeSession = null
      writeStoredSession(null)
      logEnabled.value = false
    }
    pendingKey = null
    getLogStatus()
    void fetchLogs()
  } catch (e) {
    if (typeof (e as { status?: unknown }).status === 'number') pendingKey = null
    window.$message?.error(e instanceof Error ? e.message : '调试会话切换失败')
    logEnabled.value = !value
  } finally {
    debugModeChanging.value = false
  }
}

// 获取日志
const fetchLogs = async () => {
  if (debugLogLoading.value) return
  debugLogLoading.value = true
  try {
    const page = await deviceDebugNative.listLogs(props.id, { page: 1, pageSize: 100 })
    debugLogError.value = false
    if (page.items.length) {
      // 倒序排列，最新的在下面，符合控制台习惯
      debugLogs.value = [...page.items].reverse().map(item => {
        const time = dayjs(item.timestamp).format('YYYY-MM-DD HH:mm:ss.SSS')
        return `[${time}] ${item.level} ${item.direction} ${item.message}`
      })
    } else {
      debugLogs.value = []
    }

    nextTick(() => {
      if (logContainerRef.value) {
        logContainerRef.value.scrollTop = logContainerRef.value.scrollHeight
      }
    })
  } catch {
    debugLogError.value = true
  } finally {
    debugLogLoading.value = false
  }
}

// 开始轮询日志
const startLogPolling = () => {
  if (logTimer) return
  logTimer = setInterval(() => {
    getLogStatus()
    if (logEnabled.value) void fetchLogs()
  }, 3000)
}

// 停止轮询日志
const stopLogPolling = () => {
  if (logTimer) {
    clearInterval(logTimer)
    logTimer = null
  }
}

onMounted(() => {
  fetchDiagnostics()
  getLogStatus()
  void fetchLogs()
})

onUnmounted(() => {
  diagnosticsRequest++
  stopLogPolling()
})
</script>

<template>
  <div>
    <!-- 统计概览部分 -->
    <div class="mb-4">
      <div class="flex items-center justify-between">
        <div class="text-18px">{{ $t('custom.device_details.cumulativeStatistics') }}</div>
        <NButton :bordered="false" @click="refresh">
          <NIcon size="18">
            <Refresh />
          </NIcon>
          {{ $t('common.refresh') }}
        </NButton>
      </div>
      <NAlert v-if="diagnosticError" type="warning" :show-icon="false" class="mt-4">{{ diagnosticError }}</NAlert>
      <NFlex v-if="diagnosticChecks.length" :gap="8" class="mt-4" wrap>
        <NTag
          v-for="check in diagnosticChecks"
          :key="check.stage"
          :type="check.state === 'pass' ? 'success' : check.state === 'fail' ? 'error' : 'default'"
          :title="`${check.code}: ${checkLabel(check)}`"
        >
          {{ checkLabel(check) }}
        </NTag>
      </NFlex>
      <NFlex :gap="16" class="mt-4">
        <NCard class="flex-1" :title="$t('custom.device_details.uplinkSuccessRate')">
          <NFlex vertical :gap="8">
            <NText type="info" class="text-28px font-bold">
              {{ displayRate(counters?.uplink) }}
            </NText>
            <NText :depth="2" class="text-14px">{{ displayCount(counters?.uplink) }}</NText>
          </NFlex>
        </NCard>

        <!-- 下行成功率卡片 -->
        <NCard class="flex-1" :title="$t('custom.device_details.downlinkSuccessRate')">
          <NFlex vertical :gap="8">
            <NText type="success" class="text-28px font-bold">
              {{ displayRate(counters?.downlink) }}
            </NText>
            <NText :depth="2" class="text-14px">
              {{ displayCount(counters?.downlink) }}
            </NText>
          </NFlex>
        </NCard>

        <!-- 存储成功率卡片 -->
        <NCard class="flex-1" :title="$t('custom.device_details.storageSuccessRate')">
          <NFlex vertical :gap="8">
            <NText type="warning" class="text-28px font-bold">
              {{ displayRate(counters?.storage) }}
            </NText>
            <NText :depth="2" class="text-14px">
              {{ displayCount(counters?.storage) }}
            </NText>
          </NFlex>
        </NCard>
      </NFlex>
    </div>

    <!-- 最近失败记录部分 -->
    <div>
      <div class="flex items-center justify-between mb-4">
        <div class="text-18px">
          {{ $t('custom.device_details.recentFailureRecords') }}
        </div>
      </div>

      <NAlert v-if="failuresTruncated" type="info" :show-icon="false" class="mb-4">仅显示最近 20 条失败记录。</NAlert>
      <NDataTable
        class="device-detail-table"
        :columns="columns"
        :data="failureRecords"
        size="medium"
        :theme-overrides="tableThemeOverrides"
        :bordered="true"
        :bottom-bordered="true"
        :single-column="false"
        :single-line="true"
        :scroll-x="720"
        :row-key="failureRecordRowKey"
        :max-height="350"
        remote
      >
        <template #empty>
          <NEmpty size="small" :description="$t('common.noData')" />
        </template>
      </NDataTable>
    </div>

    <!-- 设备调试日志部分 -->
    <div class="mt-4">
      <div class="flex items-center justify-between mb-4">
        <div class="text-18px">{{ $t('custom.device_details.debugLogTitle') }}</div>
        <div class="flex items-center gap-2">
          <NTooltip trigger="hover">
            <template #trigger>
              <div class="flex items-center gap-1 cursor-help">
                <span>{{ $t('custom.device_details.debugMode') }}</span>
                <NIcon size="14" class="text-gray-400">
                  <HelpCircleOutline />
                </NIcon>
              </div>
            </template>
            {{ $t('custom.device_details.debugModeHelp') }}
          </NTooltip>
          <NSwitch :value="logEnabled" :loading="debugModeChanging" @update:value="handleLogSwitch" />
        </div>
      </div>

      <div
        ref="logContainerRef"
        class="bg-[#1e1e1e] text-[#d4d4d4] font-mono p-4 rounded h-[400px] overflow-auto whitespace-pre-wrap break-all text-xs"
      >
        <div v-if="debugLogError" class="mb-2 text-amber-400">{{ $t('custom.device_details.debugLogReadError') }}</div>
        <div v-else-if="!debugLogLoading && debugLogs.length === 0" class="text-center text-gray-500 py-10">
          {{ $t(logEnabled ? 'custom.device_details.debugLogWaiting' : 'custom.device_details.debugLogEmpty') }}
        </div>
        <div
          v-for="(log, index) in debugLogs"
          :key="index"
          class="mb-1 border-b border-gray-700/50 pb-1 last:border-0 hover:bg-[#2a2d2e]"
        >
          {{ log }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
:deep(.n-card-header) {
  font-size: 16px;
}
</style>
