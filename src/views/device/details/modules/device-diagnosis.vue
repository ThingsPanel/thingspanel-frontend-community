<script setup lang="ts">
import { h, onMounted, onUnmounted, nextTick, ref } from 'vue'
import dayjs from 'dayjs'

import { $t } from '@/locales'
import { Refresh, HelpCircleOutline } from '@vicons/ionicons5'
import type { DataTableColumns } from 'naive-ui'
import { deviceDiagnostics, getDeviceDebugStatus, setDeviceDebugStatus, getDeviceDebugLogs } from '@/service/api'

// 类型定义
interface StatisticsItem {
  success: number
  total: number
  rate: number
}

// 统计数据类型
interface Statistics {
  uplink: StatisticsItem
  downlink: StatisticsItem
  storage: StatisticsItem
}

// 失败记录类型
interface FailureRecord {
  timestamp: string
  direction: 'uplink' | 'downlink'
  stage: string
  error: string
}

// 诊断统计数据类型
interface DiagnosticsStatsItem {
  success?: number
  total?: number
  success_rate?: number
}

// 诊断统计数据类型
interface DiagnosticsStats {
  uplink?: DiagnosticsStatsItem
  downlink?: DiagnosticsStatsItem
  storage?: DiagnosticsStatsItem
}

// 诊断数据类型
interface DiagnosticsData {
  stats?: DiagnosticsStats
  recent_failures?: Array<{
    timestamp?: string | number
    direction?: 'uplink' | 'downlink'
    stage?: string
    error?: string
  }>
}

// 诊断响应类型
interface DiagnosticsResponse {
  data?: DiagnosticsData
}

// 属性定义 props
const props = defineProps<{
  id: string
}>()

// 统计数据
const statistics = ref<Statistics>({
  uplink: {
    success: 0,
    total: 0,
    rate: 0
  },
  downlink: {
    success: 0,
    total: 0,
    rate: 0
  },
  storage: {
    success: 0,
    total: 0,
    rate: 0
  }
})

// 失败记录表格数据
const failureRecords = ref<FailureRecord[]>([])

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
      return h('span', {}, { default: () => direction })
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

// 获取诊断数据
const fetchDiagnostics = async () => {
  try {
    const response = await deviceDiagnostics(props.id) as DiagnosticsResponse
    const data = response?.data || (response as unknown as DiagnosticsData)

    if (data && data.stats) {
      // 更新统计数据
      statistics.value = {
        uplink: {
          success: data.stats.uplink?.success ?? 0,
          total: data.stats.uplink?.total ?? 0,
          rate: data.stats.uplink?.success_rate ?? 0
        },
        downlink: {
          success: data.stats.downlink?.success ?? 0,
          total: data.stats.downlink?.total ?? 0,
          rate: data.stats.downlink?.success_rate ?? 0
        },
        storage: {
          success: data.stats.storage?.success ?? 0,
          total: data.stats.storage?.total ?? 0,
          rate: data.stats.storage?.success_rate ?? 0
        }
      }

      // 更新失败记录
      if (Array.isArray(data.recent_failures)) {
        failureRecords.value = data.recent_failures.map((failure) => ({
          timestamp: String(failure.timestamp ?? ''),
          direction: (failure.direction ?? 'uplink') as 'uplink' | 'downlink',
          stage: failure.stage ?? '',
          error: failure.error ?? ''
        }))
      } else {
        failureRecords.value = []
      }
    }
  } catch (error) {
  }
}

// 刷新数据
const refresh = () => {
  fetchDiagnostics()
  getLogStatus()
}

// 日志相关
const logEnabled = ref(false)
const debugLogs = ref<string[]>([])
let logTimer: NodeJS.Timeout | null = null
const logContainerRef = ref<HTMLElement | null>(null)

// 获取日志开关状态
const getLogStatus = async () => {
  try {
    const res = await getDeviceDebugStatus(props.id)
    if (res.data) {
      logEnabled.value = res.data.enabled
    }
  } catch (e) {
    console.error(e)
  }
}

// 切换日志开关
const handleLogSwitch = async (value: boolean) => {
  try {
    await setDeviceDebugStatus(props.id, { enabled: value })
    logEnabled.value = value
  } catch (e) {
    console.error(e)
    // 恢复开关状态
    logEnabled.value = !value
  }
}

// 获取日志
const fetchLogs = async () => {
  try {
    const res = await getDeviceDebugLogs(props.id, { limit: 100 })
    if (res.data && res.data.list) {
      // 格式化日志展示
      // 倒序排列，最新的在下面，符合控制台习惯
      const list = res.data.list.reverse()
      debugLogs.value = list.map((item: any) => {
         const time = item.ts ? dayjs(item.ts).format('YYYY-MM-DD HH:mm:ss.SSS') : '' // eslint-disable-line
         return `[${time}] ${JSON.stringify(item)}`
      })
      
      // 自动滚动到底部
      nextTick(() => {
        if (logContainerRef.value) {
            // 如果用户没有向上滚动太多，才自动滚动
            // 这里简单处理，总是滚动到底部
          logContainerRef.value.scrollTop = logContainerRef.value.scrollHeight
        }
      })
    }
  } catch (e) {
    console.error(e)
  }
}

// 开始轮询日志
const startLogPolling = () => {
  if (logTimer) return
  fetchLogs() // 立即执行一次
  logTimer = setInterval(fetchLogs, 3000) // 每3秒查询一次
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
  startLogPolling()
})

onUnmounted(() => {
  stopLogPolling()
})
</script>

<template>
  <div>
    <!-- 统计概览部分 -->
    <div class="mb-4">
      <div class="flex items-center justify-between">
        <div class="text-18px">{{ $t('custom.device_details.statisticsOverview') }}</div>
        <NButton :bordered="false" @click="refresh">
          <NIcon size="18">
            <Refresh />
          </NIcon>
          {{ $t('common.refresh') }}
        </NButton>
      </div>
      <!-- <div class="text-14px text-gray-500">
        {{ $t('custom.device_details.statisticsRange') }}
      </div> -->
      <NFlex :gap="16" class="mt-4">
        <!-- 上行成功率卡片 -->
        <NCard class="flex-1" :title="$t('custom.device_details.uplinkSuccessRate')">
          <NFlex vertical :gap="8">
            <NText type="info" class="text-28px font-bold">
              <NNumberAnimation :from="0" :to="statistics.uplink.rate" :precision="1" />
              <span>%</span>
            </NText>
            <NText :depth="2" class="text-14px">{{ statistics.uplink.success }}/{{ statistics.uplink.total }}条</NText>
          </NFlex>
        </NCard>

        <!-- 下行成功率卡片 -->
        <NCard class="flex-1" :title="$t('custom.device_details.downlinkSuccessRate')">
          <NFlex vertical :gap="8">
            <NText type="success" class="text-28px font-bold">
              <NNumberAnimation :from="0" :to="statistics.downlink.rate" :precision="1" />
              <span>%</span>
            </NText>
            <NText :depth="2" class="text-14px">
              {{ statistics.downlink.success }}/{{ statistics.downlink.total }}条
            </NText>
          </NFlex>
        </NCard>

        <!-- 存储成功率卡片 -->
        <NCard class="flex-1" :title="$t('custom.device_details.storageSuccessRate')">
          <NFlex vertical :gap="8">
            <NText type="warning" class="text-28px font-bold">
              <NNumberAnimation :from="0" :to="statistics.storage.rate" :precision="1" />
              <span>%</span>
            </NText>
            <NText :depth="2" class="text-14px">
              {{ statistics.storage.success }}/{{ statistics.storage.total }}条
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

      <NDataTable :columns="columns" :data="failureRecords" :max-height="350" remote />
    </div>

    <!-- 设备调试日志部分 -->
    <div class="mt-4">
      <div class="flex items-center justify-between mb-4">
        <div class="text-18px">设备调试日志</div>
        <div class="flex items-center gap-2">
          <NTooltip trigger="hover">
            <template #trigger>
              <div class="flex items-center gap-1 cursor-help">
                <span>调试模式</span>
                <NIcon size="14" class="text-gray-400">
                  <HelpCircleOutline />
                </NIcon>
              </div>
            </template>
            开启后，系统将记录该设备的通信报文以供排查问题。
          </NTooltip>
          <NSwitch :value="logEnabled" @update:value="handleLogSwitch" />
        </div>
      </div>

      <div
        ref="logContainerRef"
        class="bg-[#1e1e1e] text-[#d4d4d4] font-mono p-4 rounded h-[400px] overflow-auto whitespace-pre-wrap break-all text-xs"
      >
        <div v-if="debugLogs.length === 0" class="text-center text-gray-500 py-10">
          暂无日志...
        </div>
        <div v-for="(log, index) in debugLogs" :key="index" class="mb-1 border-b border-gray-700/50 pb-1 last:border-0 hover:bg-[#2a2d2e]">
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

