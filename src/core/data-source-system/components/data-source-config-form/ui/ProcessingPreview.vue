<template>
  <div class="processing-preview">
    <!-- 预览控制面板 -->
    <n-card :title="$t('dataSource.processing.previewTitle')" size="small" :bordered="true" class="mb-4">
      <n-space align="center" justify="space-between">
        <!-- 左侧控制 -->
        <n-space align="center">
          <!-- 自动刷新开关 -->
          <n-switch
            v-model:value="autoRefresh"
            :checked-value="true"
            :unchecked-value="false"
            @update:value="handleAutoRefreshToggle"
          />
          <n-text class="ml-1">{{ $t('dataSource.processing.autoRefresh') }}</n-text>

          <!-- 刷新间隔 -->
          <n-input-number
            v-if="autoRefresh"
            v-model:value="refreshInterval"
            :min="1000"
            :max="60000"
            :step="1000"
            size="small"
            style="width: 120px"
            @update:value="handleRefreshIntervalChange"
          >
            <template #suffix>ms</template>
          </n-input-number>
        </n-space>

        <!-- 右侧操作 -->
        <n-space>
          <n-button size="small" :loading="refreshing" @click="refreshPreview">
            {{ $t('dataSource.processing.refreshNow') }}
          </n-button>
          <n-button size="small" type="primary" :disabled="!hasPreviewData" @click="exportPreviewData">
            {{ $t('dataSource.processing.export') }}
          </n-button>
          <n-button size="small" type="warning" @click="clearPreview">
            {{ $t('dataSource.processing.clear') }}
          </n-button>
        </n-space>
      </n-space>
    </n-card>

    <!-- 预览内容区 -->
    <n-tabs v-model:value="activeTab" type="line" animated size="small">
      <!-- 原始数据预览 -->
      <n-tab-pane name="raw" :tab="$t('dataSource.processing.rawData')">
        <div class="preview-content">
          <n-space vertical :size="12">
            <!-- 数据统计 -->
            <n-card size="small" :bordered="true">
              <n-space>
                <n-statistic :label="$t('dataSource.processing.dataCount')" :value="rawDataStats.count" />
                <n-statistic :label="$t('dataSource.processing.lastUpdate')" :value="rawDataStats.lastUpdate" />
                <n-statistic :label="$t('dataSource.processing.dataSize')" :value="formatDataSize(rawDataStats.size)" />
              </n-space>
            </n-card>

            <!-- 原始数据显示 -->
            <n-card title="原始数据内容" size="small" :bordered="true">
              <div class="data-display">
                <JsonDataInput
                  v-model="rawDataDisplay"
                  :show-label="false"
                  :readonly="true"
                  :rows="12"
                  :placeholder="$t('dataSource.processing.noRawData')"
                />
              </div>
            </n-card>
          </n-space>
        </div>
      </n-tab-pane>

      <!-- 处理后数据预览 -->
      <n-tab-pane name="processed" :tab="$t('dataSource.processing.processedData')">
        <div class="preview-content">
          <n-space vertical :size="12">
            <!-- 处理统计 -->
            <n-card size="small" :bordered="true">
              <n-space>
                <n-statistic :label="$t('dataSource.processing.processedCount')" :value="processedDataStats.count" />
                <n-statistic
                  :label="$t('dataSource.processing.processingTime')"
                  :value="`${processedDataStats.processingTime}ms`"
                />
                <n-statistic
                  :label="$t('dataSource.processing.successRate')"
                  :value="`${processedDataStats.successRate}%`"
                />
              </n-space>
            </n-card>

            <!-- 处理结果显示 -->
            <n-card title="处理后数据" size="small" :bordered="true">
              <div class="data-display">
                <JsonDataInput
                  v-model="processedDataDisplay"
                  :show-label="false"
                  :readonly="true"
                  :rows="12"
                  :placeholder="$t('dataSource.processing.noProcessedData')"
                />
              </div>
            </n-card>
          </n-space>
        </div>
      </n-tab-pane>

      <!-- 错误日志 -->
      <n-tab-pane name="errors" :tab="$t('dataSource.processing.errors')" :disabled="errorLogs.length === 0">
        <div class="preview-content">
          <n-card title="处理错误日志" size="small" :bordered="true">
            <div class="error-log">
              <div v-for="(error, index) in errorLogs" :key="index" class="error-entry">
                <div class="error-header">
                  <n-tag type="error" size="small">{{ error.timestamp }}</n-tag>
                  <n-text strong class="ml-2">{{ error.type }}</n-text>
                </div>
                <div class="error-content">
                  <n-text depth="2">{{ error.message }}</n-text>
                  <n-code
                    v-if="error.stack"
                    :code="error.stack"
                    language="text"
                    style="font-size: 11px; margin-top: 8px"
                  />
                </div>
              </div>
            </div>

            <n-empty v-if="errorLogs.length === 0" :description="$t('dataSource.processing.noErrors')" size="small" />
          </n-card>
        </div>
      </n-tab-pane>

      <!-- 性能监控 -->
      <n-tab-pane name="performance" :tab="$t('dataSource.processing.performance')">
        <div class="preview-content">
          <n-space vertical :size="12">
            <!-- 性能指标 -->
            <n-card title="性能指标" size="small" :bordered="true">
              <n-grid cols="2 s:1" :x-gap="16" :y-gap="12">
                <n-grid-item>
                  <n-statistic
                    :label="$t('dataSource.processing.avgProcessingTime')"
                    :value="`${performanceStats.avgProcessingTime}ms`"
                  />
                </n-grid-item>
                <n-grid-item>
                  <n-statistic
                    :label="$t('dataSource.processing.maxProcessingTime')"
                    :value="`${performanceStats.maxProcessingTime}ms`"
                  />
                </n-grid-item>
                <n-grid-item>
                  <n-statistic
                    :label="$t('dataSource.processing.throughput')"
                    :value="`${performanceStats.throughput}/s`"
                  />
                </n-grid-item>
                <n-grid-item>
                  <n-statistic
                    :label="$t('dataSource.processing.errorRate')"
                    :value="`${performanceStats.errorRate}%`"
                  />
                </n-grid-item>
              </n-grid>
            </n-card>

            <!-- 性能趋势图 -->
            <n-card title="处理时间趋势" size="small" :bordered="true">
              <div class="performance-chart">
                <div class="chart-placeholder">
                  <n-empty :description="$t('dataSource.processing.chartPlaceholder')" size="small" />
                </div>
              </div>
            </n-card>
          </n-space>
        </div>
      </n-tab-pane>
    </n-tabs>

    <!-- 处理状态指示器 -->
    <div v-if="processingStatus.active" class="processing-indicator">
      <n-card size="small" :bordered="true">
        <n-space align="center">
          <n-spin size="small" />
          <n-text>{{ $t('dataSource.processing.processing') }}...</n-text>
          <n-text depth="3" class="text-sm">
            {{ $t('dataSource.processing.step') }}: {{ processingStatus.currentStep }}/{{ processingStatus.totalSteps }}
          </n-text>
          <n-progress :percentage="processingProgress" :show-indicator="false" status="info" style="width: 200px" />
        </n-space>
      </n-card>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 数据处理预览组件
 * 提供实时数据预览、处理结果展示、错误日志和性能监控功能
 */

import { ref, reactive, computed, watch, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useThemeStore } from '@/store/modules/theme'
import type { ProcessingPreviewData, ProcessingError, ProcessingStats } from '../types'
import JsonDataInput from './JsonDataInput.vue'

// 组件接口定义
interface Props {
  /** 预览配置数据 */
  modelValue: ProcessingPreviewData
  /** 是否自动刷新 */
  autoRefreshDefault?: boolean
  /** 默认刷新间隔 */
  refreshIntervalDefault?: number
  /** 最大数据条数 */
  maxDataItems?: number
}

interface Emits {
  /** 配置数据更新 */
  'update:modelValue': [value: ProcessingPreviewData]
  /** 预览数据变化 */
  'preview-change': [data: any]
  /** 错误发生 */
  error: [error: ProcessingError]
  /** 性能数据更新 */
  'performance-update': [stats: ProcessingStats]
}

// Props和Emits
const props = withDefaults(defineProps<Props>(), {
  autoRefreshDefault: false,
  refreshIntervalDefault: 5000,
  maxDataItems: 100
})

const emit = defineEmits<Emits>()

// 基础设置
const { t } = useI18n()
const themeStore = useThemeStore()

// UI状态
const activeTab = ref('raw')
const refreshing = ref(false)
const autoRefresh = ref(props.autoRefreshDefault)
const refreshInterval = ref(props.refreshIntervalDefault)

// 预览数据状态
const previewData = reactive<{
  raw: any[]
  processed: any[]
  lastRawData?: any
  lastProcessedData?: any
}>({
  raw: [],
  processed: []
})

// 数据统计
const rawDataStats = reactive<{
  count: number
  lastUpdate: string
  size: number
}>({
  count: 0,
  lastUpdate: '-',
  size: 0
})

const processedDataStats = reactive<{
  count: number
  processingTime: number
  successRate: number
}>({
  count: 0,
  processingTime: 0,
  successRate: 100
})

// 错误日志
const errorLogs = ref<
  Array<{
    timestamp: string
    type: string
    message: string
    stack?: string
  }>
>([])

// 性能统计
const performanceStats = reactive<{
  avgProcessingTime: number
  maxProcessingTime: number
  throughput: number
  errorRate: number
}>({
  avgProcessingTime: 0,
  maxProcessingTime: 0,
  throughput: 0,
  errorRate: 0
})

// 处理状态
const processingStatus = reactive<{
  active: boolean
  currentStep: number
  totalSteps: number
  stepName: string
}>({
  active: false,
  currentStep: 0,
  totalSteps: 0,
  stepName: ''
})

// 定时器引用
let refreshTimer: number | null = null

// 计算属性
const hasPreviewData = computed(() => {
  return previewData.raw.length > 0 || previewData.processed.length > 0
})

const rawDataDisplay = computed({
  get: () => {
    if (previewData.raw.length === 0) return ''
    return JSON.stringify(
      {
        totalItems: previewData.raw.length,
        latestItems: previewData.raw.slice(0, 5),
        sample: previewData.lastRawData
      },
      null,
      2
    )
  },
  set: () => {} // 只读
})

const processedDataDisplay = computed({
  get: () => {
    if (previewData.processed.length === 0) return ''
    return JSON.stringify(
      {
        totalItems: previewData.processed.length,
        latestItems: previewData.processed.slice(0, 5),
        sample: previewData.lastProcessedData
      },
      null,
      2
    )
  },
  set: () => {} // 只读
})

const processingProgress = computed(() => {
  if (processingStatus.totalSteps === 0) return 0
  return Math.round((processingStatus.currentStep / processingStatus.totalSteps) * 100)
})

/**
 * 格式化数据大小
 */
const formatDataSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

/**
 * 计算字符串字节大小
 */
const calculateSize = (data: any): number => {
  return new Blob([JSON.stringify(data)]).size
}

/**
 * 开始自动刷新
 */
const startAutoRefresh = () => {
  stopAutoRefresh()

  if (autoRefresh.value) {
    refreshTimer = window.setInterval(() => {
      refreshPreview()
    }, refreshInterval.value)
  }
}

/**
 * 停止自动刷新
 */
const stopAutoRefresh = () => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }
}

/**
 * 处理自动刷新开关变化
 */
const handleAutoRefreshToggle = (enabled: boolean) => {
  if (enabled) {
    startAutoRefresh()
  } else {
    stopAutoRefresh()
  }
}

/**
 * 处理刷新间隔变化
 */
const handleRefreshIntervalChange = () => {
  if (autoRefresh.value) {
    startAutoRefresh() // 重新开始定时器
  }
}

/**
 * 刷新预览数据
 */
const refreshPreview = async () => {
  if (refreshing.value) return

  refreshing.value = true
  processingStatus.active = true
  processingStatus.currentStep = 0
  processingStatus.totalSteps = 3

  try {
    // 步骤1: 获取原始数据
    processingStatus.currentStep = 1
    processingStatus.stepName = '获取原始数据'
    await new Promise(resolve => setTimeout(resolve, 300))

    const rawData = await generateMockRawData()
    previewData.raw.unshift(rawData)
    previewData.lastRawData = rawData

    // 限制数据数量
    if (previewData.raw.length > props.maxDataItems) {
      previewData.raw = previewData.raw.slice(0, props.maxDataItems)
    }

    // 更新原始数据统计
    rawDataStats.count = previewData.raw.length
    rawDataStats.lastUpdate = new Date().toLocaleString()
    rawDataStats.size = calculateSize(previewData.raw)

    // 步骤2: 数据处理
    processingStatus.currentStep = 2
    processingStatus.stepName = '数据处理'
    await new Promise(resolve => setTimeout(resolve, 200))

    const startTime = Date.now()
    const processedData = await processRawData(rawData)
    const processingTime = Date.now() - startTime

    previewData.processed.unshift(processedData)
    previewData.lastProcessedData = processedData

    // 限制数据数量
    if (previewData.processed.length > props.maxDataItems) {
      previewData.processed = previewData.processed.slice(0, props.maxDataItems)
    }

    // 步骤3: 更新统计
    processingStatus.currentStep = 3
    processingStatus.stepName = '更新统计'
    await new Promise(resolve => setTimeout(resolve, 100))

    // 更新处理数据统计
    processedDataStats.count = previewData.processed.length
    processedDataStats.processingTime = processingTime
    processedDataStats.successRate = Math.round((previewData.processed.length / previewData.raw.length) * 100)

    // 更新性能统计
    updatePerformanceStats(processingTime)

    // 发送事件
    emit('preview-change', {
      raw: rawData,
      processed: processedData
    })
  } catch (error: any) {
    addError('processing', error.message, error.stack)
    emit('error', {
      type: 'processing',
      message: error.message,
      timestamp: Date.now(),
      stack: error.stack
    })
  } finally {
    refreshing.value = false
    processingStatus.active = false
  }
}

/**
 * 生成模拟原始数据
 */
const generateMockRawData = async (): Promise<any> => {
  // 模拟不同类型的原始数据
  const dataTypes = ['sensor', 'device-status', 'user-action', 'system-event']
  const selectedType = dataTypes[Math.floor(Math.random() * dataTypes.length)]

  const baseData = {
    id: `data_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
    type: selectedType,
    source: 'mock-generator'
  }

  switch (selectedType) {
    case 'sensor':
      return {
        ...baseData,
        deviceId: `sensor_${Math.floor(Math.random() * 100) + 1}`,
        temperature: +(Math.random() * 40 + 10).toFixed(1),
        humidity: +(Math.random() * 100).toFixed(1),
        pressure: +(Math.random() * 200 + 800).toFixed(1),
        location: {
          latitude: +(Math.random() * 180 - 90).toFixed(6),
          longitude: +(Math.random() * 360 - 180).toFixed(6)
        }
      }

    case 'device-status':
      return {
        ...baseData,
        deviceId: `device_${Math.floor(Math.random() * 50) + 1}`,
        status: Math.random() > 0.8 ? 'offline' : 'online',
        battery: Math.floor(Math.random() * 100),
        signal: Math.floor(Math.random() * 100),
        version: `v${Math.floor(Math.random() * 3) + 1}.${Math.floor(Math.random() * 10)}.${Math.floor(Math.random() * 10)}`
      }

    case 'user-action':
      return {
        ...baseData,
        userId: `user_${Math.floor(Math.random() * 1000) + 1}`,
        action: ['login', 'logout', 'view-dashboard', 'configure-device'][Math.floor(Math.random() * 4)],
        ip: `192.168.1.${Math.floor(Math.random() * 255) + 1}`,
        userAgent: 'Mozilla/5.0 (ThingsPanel Client)'
      }

    default:
      return {
        ...baseData,
        level: ['info', 'warning', 'error'][Math.floor(Math.random() * 3)],
        message: `系统事件消息 ${Math.floor(Math.random() * 1000)}`,
        module: ['auth', 'device-manager', 'data-processor'][Math.floor(Math.random() * 3)]
      }
  }
}

/**
 * 处理原始数据
 */
const processRawData = async (rawData: any): Promise<any> => {
  // 模拟数据处理延迟
  await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50))

  // 随机模拟处理失败
  if (Math.random() < 0.05) {
    throw new Error('数据处理失败: 格式不匹配')
  }

  // 数据处理和转换
  const processed = {
    ...rawData,
    processed: true,
    processedAt: new Date().toISOString(),
    processingVersion: '1.0.0'
  }

  // 根据数据类型进行特定处理
  switch (rawData.type) {
    case 'sensor':
      processed.metrics = {
        temperature: {
          value: rawData.temperature,
          unit: '°C',
          status: rawData.temperature > 35 ? 'high' : 'normal'
        },
        humidity: {
          value: rawData.humidity,
          unit: '%',
          status: rawData.humidity > 80 ? 'high' : 'normal'
        }
      }
      break

    case 'device-status':
      processed.healthScore = rawData.battery * 0.4 + rawData.signal * 0.6
      processed.alert = rawData.status === 'offline' || rawData.battery < 20
      break

    case 'user-action':
      processed.sessionId = `session_${Date.now()}`
      processed.risk = rawData.action === 'login' ? 'low' : 'none'
      break
  }

  return processed
}

/**
 * 更新性能统计
 */
const updatePerformanceStats = (processingTime: number) => {
  // 更新最大处理时间
  performanceStats.maxProcessingTime = Math.max(performanceStats.maxProcessingTime, processingTime)

  // 计算平均处理时间（简化算法）
  const totalTime = performanceStats.avgProcessingTime * (processedDataStats.count - 1) + processingTime
  performanceStats.avgProcessingTime = Math.round(totalTime / processedDataStats.count)

  // 计算吞吐量（每秒处理的数据条数）
  if (refreshInterval.value > 0) {
    performanceStats.throughput = Math.round((1000 / refreshInterval.value) * 10) / 10
  }

  // 计算错误率
  const totalErrors = errorLogs.value.length
  const totalProcessed = processedDataStats.count + totalErrors
  performanceStats.errorRate = totalProcessed > 0 ? Math.round((totalErrors / totalProcessed) * 100) : 0

  // 发送性能更新事件
  emit('performance-update', {
    avgProcessingTime: performanceStats.avgProcessingTime,
    maxProcessingTime: performanceStats.maxProcessingTime,
    throughput: performanceStats.throughput,
    errorRate: performanceStats.errorRate,
    totalProcessed: processedDataStats.count,
    totalErrors: errorLogs.value.length
  })
}

/**
 * 添加错误日志
 */
const addError = (type: string, message: string, stack?: string) => {
  errorLogs.value.unshift({
    timestamp: new Date().toLocaleString(),
    type,
    message,
    stack
  })

  // 限制错误日志数量
  if (errorLogs.value.length > 50) {
    errorLogs.value = errorLogs.value.slice(0, 50)
  }
}

/**
 * 清空预览数据
 */
const clearPreview = () => {
  previewData.raw = []
  previewData.processed = []
  previewData.lastRawData = undefined
  previewData.lastProcessedData = undefined

  // 重置统计
  rawDataStats.count = 0
  rawDataStats.lastUpdate = '-'
  rawDataStats.size = 0

  processedDataStats.count = 0
  processedDataStats.processingTime = 0
  processedDataStats.successRate = 100

  // 重置性能统计
  performanceStats.avgProcessingTime = 0
  performanceStats.maxProcessingTime = 0
  performanceStats.throughput = 0
  performanceStats.errorRate = 0

  // 清空错误日志
  errorLogs.value = []

  window.$message?.info(t('dataSource.processing.previewCleared'))
}

/**
 * 导出预览数据
 */
const exportPreviewData = () => {
  const exportData = {
    metadata: {
      exportTime: new Date().toISOString(),
      dataSource: 'ProcessingPreview',
      version: '1.0.0'
    },
    statistics: {
      raw: rawDataStats,
      processed: processedDataStats,
      performance: performanceStats
    },
    data: {
      raw: previewData.raw,
      processed: previewData.processed
    },
    errors: errorLogs.value
  }

  const dataStr = JSON.stringify(exportData, null, 2)
  const blob = new Blob([dataStr], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `processing-preview-${new Date().toISOString().split('T')[0]}.json`
  link.click()

  URL.revokeObjectURL(url)
  window.$message?.success(t('dataSource.processing.exportSuccess'))
}

/**
 * 模拟数据处理（用于演示）
 */
const simulateDataProcessing = () => {
  // 如果没有启用自动刷新，手动触发一次
  if (!autoRefresh.value) {
    refreshPreview()
  }
}

/**
 * 组件验证
 */
const validate = (): boolean => {
  return true // ProcessingPreview组件通常不需要严格验证
}

/**
 * 重置组件
 */
const reset = () => {
  stopAutoRefresh()
  clearPreview()
  autoRefresh.value = props.autoRefreshDefault
  refreshInterval.value = props.refreshIntervalDefault
  activeTab.value = 'raw'
}

/**
 * 获取当前状态
 */
const getState = () => {
  return {
    previewData: { ...previewData },
    statistics: {
      raw: { ...rawDataStats },
      processed: { ...processedDataStats },
      performance: { ...performanceStats }
    },
    errors: [...errorLogs.value],
    settings: {
      autoRefresh: autoRefresh.value,
      refreshInterval: refreshInterval.value
    }
  }
}

// 监听配置变化
watch(
  () => props.modelValue,
  newValue => {
    if (newValue) {
      // 同步外部配置到内部状态
      // 这里可以根据需要添加具体的同步逻辑
    }
  },
  { deep: true, immediate: true }
)

// 组件卸载时清理
onUnmounted(() => {
  stopAutoRefresh()
})

// 导出方法供父组件调用
defineExpose({
  validate,
  reset,
  getState,
  refreshPreview,
  clearPreview,
  simulateDataProcessing
})

// 初始化时触发一次预览
simulateDataProcessing()
</script>

<style scoped>
/**
 * 数据处理预览组件样式
 */

.processing-preview {
  width: 100%;
}

/* 预览内容样式 */
.preview-content {
  padding: 16px 0;
  min-height: 300px;
}

/* 数据显示样式 */
.data-display {
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  overflow: hidden;
}

/* 错误日志样式 */
.error-log {
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  padding: 12px;
}

.error-entry {
  margin-bottom: 16px;
  padding: 12px;
  background: var(--card-color);
  border: 1px solid var(--error-color);
  border-radius: 6px;
}

.error-entry:last-child {
  margin-bottom: 0;
}

.error-header {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.error-content {
  margin-left: 8px;
}

/* 性能图表样式 */
.performance-chart {
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  background: var(--body-color);
}

.chart-placeholder {
  text-align: center;
}

/* 处理状态指示器样式 */
.processing-indicator {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000;
  max-width: 400px;
}

/* 工具类 */
.mb-4 {
  margin-bottom: 1rem;
}

.ml-1 {
  margin-left: 0.25rem;
}

.ml-2 {
  margin-left: 0.5rem;
}

.text-sm {
  font-size: 0.875rem;
}

/* 暗主题适配 */
[data-theme='dark'] .error-entry {
  background: rgba(255, 255, 255, 0.02);
  border-color: var(--error-color);
}

[data-theme='dark'] .performance-chart {
  background: rgba(255, 255, 255, 0.02);
  border-color: rgba(255, 255, 255, 0.1);
}

[data-theme='dark'] .processing-indicator {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .preview-content {
    padding: 12px 0;
  }

  .processing-indicator {
    position: static;
    margin-top: 16px;
  }

  .error-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
}
</style>
