/**
 * 数据处理 Composable
 * 负责数据转换、脚本执行、处理结果管理和性能监控
 */

import { ref, reactive, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type {
  RawDataItem,
  FinalDataProcessingConfig,
  ProcessingError,
  ProcessingStats,
  ValidationResult
} from '../types'

// 数据处理选项接口
export interface UseDataProcessingOptions {
  /** 是否启用实时处理 */
  enableRealTimeProcessing?: boolean
  /** 处理延迟（毫秒） */
  processingDelay?: number
  /** 最大处理队列长度 */
  maxQueueLength?: number
  /** 是否启用性能监控 */
  enablePerformanceMonitoring?: boolean
  /** 是否启用错误日志 */
  enableErrorLogging?: boolean
  /** 最大错误日志数量 */
  maxErrorLogs?: number
}

// 处理队列项接口
export interface ProcessingQueueItem {
  /** 队列项ID */
  id: string
  /** 原始数据 */
  rawData: RawDataItem[]
  /** 处理配置 */
  config: FinalDataProcessingConfig
  /** 优先级 */
  priority: 'low' | 'normal' | 'high' | 'urgent'
  /** 创建时间 */
  createdAt: number
  /** 状态 */
  status: 'pending' | 'processing' | 'completed' | 'error' | 'cancelled'
  /** 处理结果 */
  result?: any
  /** 错误信息 */
  error?: string
  /** 处理时间 */
  processingTime?: number
}

// 处理器状态接口
export interface ProcessorState {
  /** 是否正在处理 */
  isProcessing: boolean
  /** 当前处理的队列项 */
  currentItem?: ProcessingQueueItem
  /** 处理进度 */
  progress: {
    current: number
    total: number
    percentage: number
    currentStep: string
  }
  /** 最后处理时间 */
  lastProcessedAt?: number
  /** 处理器统计 */
  stats: ProcessingStats
}

// 脚本执行环境接口
export interface ScriptExecutionContext {
  /** 原始数据 */
  rawData: RawDataItem[]
  /** 处理配置 */
  config: FinalDataProcessingConfig
  /** 工具函数 */
  utils: {
    /** 日期格式化 */
    formatDate: (date: Date | string | number, format?: string) => string
    /** 数据验证 */
    validateData: (data: any, schema?: any) => boolean
    /** 深度合并 */
    deepMerge: (...objects: any[]) => any
    /** 数组去重 */
    uniqueArray: (array: any[], key?: string) => any[]
    /** 数据映射 */
    mapData: (data: any[], mapper: (item: any) => any) => any[]
    /** 数据过滤 */
    filterData: (data: any[], predicate: (item: any) => boolean) => any[]
  }
  /** 日志函数 */
  log: (message: string, level?: 'info' | 'warn' | 'error') => void
}

/**
 * 数据处理 Composable
 */
export function useDataProcessing(options: UseDataProcessingOptions = {}) {
  const { t } = useI18n()

  // 默认选项
  const {
    enableRealTimeProcessing = false,
    processingDelay = 100,
    maxQueueLength = 50,
    enablePerformanceMonitoring = true,
    enableErrorLogging = true,
    maxErrorLogs = 100
  } = options

  // 处理队列
  const processingQueue = ref<ProcessingQueueItem[]>([])

  // 处理器状态
  const processorState = reactive<ProcessorState>({
    isProcessing: false,
    progress: {
      current: 0,
      total: 0,
      percentage: 0,
      currentStep: ''
    },
    stats: {
      avgProcessingTime: 0,
      maxProcessingTime: 0,
      throughput: 0,
      errorRate: 0,
      totalProcessed: 0,
      totalErrors: 0
    }
  })

  // 错误日志
  const errorLogs = ref<ProcessingError[]>([])

  // 处理历史记录
  const processingHistory = ref<
    Array<{
      id: string
      timestamp: number
      config: FinalDataProcessingConfig
      inputCount: number
      outputCount: number
      processingTime: number
      success: boolean
      error?: string
    }>
  >([])

  // 性能监控数据
  const performanceData = ref<
    Array<{
      timestamp: number
      processingTime: number
      dataSize: number
      success: boolean
    }>
  >([])

  // 定时器引用
  let processingTimer: number | null = null

  // 计算属性
  const queueLength = computed(() => processingQueue.value.length)

  const pendingItems = computed(() => processingQueue.value.filter(item => item.status === 'pending'))

  const completedItems = computed(() => processingQueue.value.filter(item => item.status === 'completed'))

  const errorItems = computed(() => processingQueue.value.filter(item => item.status === 'error'))

  const averageProcessingTime = computed(() => {
    const completedTimes = completedItems.value.map(item => item.processingTime || 0).filter(time => time > 0)

    if (completedTimes.length === 0) return 0
    return Math.round(completedTimes.reduce((sum, time) => sum + time, 0) / completedTimes.length)
  })

  /**
   * 添加处理任务到队列
   */
  const addToQueue = (
    rawData: RawDataItem[],
    config: FinalDataProcessingConfig,
    priority: ProcessingQueueItem['priority'] = 'normal'
  ): string => {
    // 检查队列长度限制
    if (processingQueue.value.length >= maxQueueLength) {
      // 移除最旧的已完成项
      const oldestCompleted = processingQueue.value
        .filter(item => item.status === 'completed')
        .sort((a, b) => a.createdAt - b.createdAt)[0]

      if (oldestCompleted) {
        removeFromQueue(oldestCompleted.id)
      } else {
        throw new Error(t('dataSource.processing.queueFull'))
      }
    }

    const queueItem: ProcessingQueueItem = {
      id: `proc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      rawData: [...rawData],
      config: JSON.parse(JSON.stringify(config)),
      priority,
      createdAt: Date.now(),
      status: 'pending'
    }

    // 按优先级插入队列
    const priorityOrder = { urgent: 0, high: 1, normal: 2, low: 3 }
    const insertIndex = processingQueue.value.findIndex(item => priorityOrder[item.priority] > priorityOrder[priority])

    if (insertIndex >= 0) {
      processingQueue.value.splice(insertIndex, 0, queueItem)
    } else {
      processingQueue.value.push(queueItem)
    }

    // 如果启用实时处理，立即开始处理
    if (enableRealTimeProcessing && !processorState.isProcessing) {
      processQueue()
    }

    return queueItem.id
  }

  /**
   * 从队列移除任务
   */
  const removeFromQueue = (id: string): boolean => {
    const index = processingQueue.value.findIndex(item => item.id === id)
    if (index >= 0) {
      const item = processingQueue.value[index]

      // 如果正在处理，标记为取消
      if (item.status === 'processing') {
        item.status = 'cancelled'
      } else {
        processingQueue.value.splice(index, 1)
      }
      return true
    }
    return false
  }

  /**
   * 处理队列
   */
  const processQueue = async (): Promise<void> => {
    if (processorState.isProcessing || pendingItems.value.length === 0) return

    processorState.isProcessing = true
    processorState.progress.total = pendingItems.value.length
    processorState.progress.current = 0

    try {
      while (pendingItems.value.length > 0) {
        const nextItem = pendingItems.value[0]
        await processQueueItem(nextItem)

        processorState.progress.current++
        processorState.progress.percentage = Math.round(
          (processorState.progress.current / processorState.progress.total) * 100
        )

        // 处理延迟
        if (processingDelay > 0) {
          await new Promise(resolve => setTimeout(resolve, processingDelay))
        }
      }
    } finally {
      processorState.isProcessing = false
      processorState.currentItem = undefined
      processorState.progress.currentStep = ''
    }
  }

  /**
   * 处理单个队列项
   */
  const processQueueItem = async (item: ProcessingQueueItem): Promise<void> => {
    item.status = 'processing'
    processorState.currentItem = item
    processorState.progress.currentStep = t('dataSource.processing.processItem', { id: item.id })

    const startTime = Date.now()

    try {
      const result = await executeProcessing(item.rawData, item.config)

      const processingTime = Date.now() - startTime
      item.processingTime = processingTime
      item.result = result
      item.status = 'completed'

      // 更新统计
      updateProcessingStats(processingTime, true)

      // 添加到历史记录
      addToHistory(item, true)
    } catch (error: any) {
      const processingTime = Date.now() - startTime
      item.processingTime = processingTime
      item.error = error.message
      item.status = 'error'

      // 记录错误
      addError('processing', error.message, { item, error })

      // 更新统计
      updateProcessingStats(processingTime, false)

      // 添加到历史记录
      addToHistory(item, false)
    }
  }

  /**
   * 执行数据处理
   */
  const executeProcessing = async (rawData: RawDataItem[], config: FinalDataProcessingConfig): Promise<any> => {
    switch (config.type) {
      case 'merge-object':
        return executeMergeObject(rawData, config)
      case 'concat-array':
        return executeConcatArray(rawData, config)
      case 'custom-script':
        return executeCustomScript(rawData, config)
      case 'select-specific':
        return executeSelectSpecific(rawData, config)
      default:
        throw new Error(t('dataSource.processing.unknownType', { type: config.type }))
    }
  }

  /**
   * 执行对象合并处理
   */
  const executeMergeObject = async (rawData: RawDataItem[], config: FinalDataProcessingConfig): Promise<any> => {
    const objects = rawData.map(item => {
      try {
        return typeof item.data === 'string' ? JSON.parse(item.data) : item.data
      } catch {
        return { [item.name]: item.data }
      }
    })

    // 根据合并策略执行合并
    const mergeConfig = config.config?.mergeObject
    if (!mergeConfig) {
      throw new Error(t('dataSource.processing.mergeConfigMissing'))
    }

    switch (mergeConfig.strategy) {
      case 'shallow':
        return Object.assign({}, ...objects)
      case 'deep':
        return deepMerge(...objects)
      case 'custom':
        if (mergeConfig.customMerger) {
          return executeCustomFunction(mergeConfig.customMerger, objects)
        }
        throw new Error(t('dataSource.processing.customMergerMissing'))
      default:
        throw new Error(t('dataSource.processing.unknownMergeStrategy'))
    }
  }

  /**
   * 执行数组连接处理
   */
  const executeConcatArray = async (rawData: RawDataItem[], config: FinalDataProcessingConfig): Promise<any[]> => {
    const arrays = rawData.map(item => {
      const data = typeof item.data === 'string' ? JSON.parse(item.data) : item.data
      return Array.isArray(data) ? data : [data]
    })

    let result = [].concat(...arrays)

    const concatConfig = config.config?.concatArray
    if (concatConfig) {
      // 去重处理
      if (concatConfig.deduplicate) {
        if (concatConfig.deduplicateBy?.length) {
          // 根据指定字段去重
          const seen = new Set()
          result = result.filter(item => {
            const key = concatConfig.deduplicateBy!.map(field => item[field]).join('|')
            if (seen.has(key)) return false
            seen.add(key)
            return true
          })
        } else {
          // 简单去重
          result = [...new Set(result.map(item => JSON.stringify(item)))].map(str => JSON.parse(str))
        }
      }

      // 排序处理
      if (concatConfig.sorting?.enabled) {
        if (concatConfig.sorting.customComparator) {
          const comparator = new Function('a', 'b', concatConfig.sorting.customComparator)
          result.sort(comparator)
        } else if (concatConfig.sorting.field) {
          const field = concatConfig.sorting.field
          const order = concatConfig.sorting.order === 'desc' ? -1 : 1
          result.sort((a, b) => {
            const aVal = a[field]
            const bVal = b[field]
            if (aVal < bVal) return -1 * order
            if (aVal > bVal) return 1 * order
            return 0
          })
        }
      }

      // 长度限制
      if (concatConfig.maxLength && result.length > concatConfig.maxLength) {
        result = result.slice(0, concatConfig.maxLength)
      }

      // 扁平化处理
      if (concatConfig.flatten) {
        result = flattenArray(result)
      }
    }

    return result
  }

  /**
   * 执行自定义脚本处理
   */
  const executeCustomScript = async (rawData: RawDataItem[], config: FinalDataProcessingConfig): Promise<any> => {
    const scriptConfig = config.config?.customScript
    if (!scriptConfig?.script) {
      throw new Error(t('dataSource.processing.scriptMissing'))
    }

    // 创建脚本执行环境
    const context: ScriptExecutionContext = {
      rawData,
      config,
      utils: createUtilityFunctions(),
      log: (message: string, level: 'info' | 'warn' | 'error' = 'info') => {
        console[level](`[DataProcessing] ${message}`)
      }
    }

    // 执行脚本
    return executeCustomFunction(scriptConfig.script, context)
  }

  /**
   * 执行选择特定数据处理
   */
  const executeSelectSpecific = async (rawData: RawDataItem[], config: FinalDataProcessingConfig): Promise<any> => {
    const selectConfig = config.config?.selectSpecific
    if (!selectConfig) {
      throw new Error(t('dataSource.processing.selectConfigMissing'))
    }

    // 根据选择策略返回数据
    switch (selectConfig.strategy) {
      case 'first':
        return rawData[0]?.data
      case 'last':
        return rawData[rawData.length - 1]?.data
      case 'largest':
        return rawData.reduce((largest, current) => {
          const currentSize = JSON.stringify(current.data).length
          const largestSize = JSON.stringify(largest.data).length
          return currentSize > largestSize ? current : largest
        })?.data
      case 'by-name':
        const target = rawData.find(item => item.name === selectConfig.targetName)
        return target?.data
      default:
        throw new Error(t('dataSource.processing.unknownSelectStrategy'))
    }
  }

  /**
   * 执行自定义函数
   */
  const executeCustomFunction = (code: string, ...args: any[]): any => {
    try {
      const func = new Function(
        'context',
        `
        const { rawData, config, utils, log } = context;
        ${code}
      `
      )
      return func(...args)
    } catch (error: any) {
      throw new Error(t('dataSource.processing.scriptExecutionError', { error: error.message }))
    }
  }

  /**
   * 创建工具函数
   */
  const createUtilityFunctions = () => {
    return {
      formatDate: (date: Date | string | number, format: string = 'YYYY-MM-DD HH:mm:ss') => {
        const d = new Date(date)
        return d.toLocaleString()
      },

      validateData: (data: any, schema?: any) => {
        if (!schema) return data !== null && data !== undefined
        // 简化的schema验证
        return typeof data === typeof schema
      },

      deepMerge: (...objects: any[]) => {
        return objects.reduce((merged, obj) => {
          for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
              if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
                merged[key] = deepMerge(merged[key] || {}, obj[key])
              } else {
                merged[key] = obj[key]
              }
            }
          }
          return merged
        }, {})
      },

      uniqueArray: (array: any[], key?: string) => {
        if (!key) {
          return [...new Set(array)]
        }
        const seen = new Set()
        return array.filter(item => {
          const keyValue = item[key]
          if (seen.has(keyValue)) return false
          seen.add(keyValue)
          return true
        })
      },

      mapData: (data: any[], mapper: (item: any) => any) => {
        return data.map(mapper)
      },

      filterData: (data: any[], predicate: (item: any) => boolean) => {
        return data.filter(predicate)
      }
    }
  }

  /**
   * 深度合并函数
   */
  const deepMerge = (...objects: any[]): any => {
    return objects.reduce((merged, obj) => {
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
            merged[key] = deepMerge(merged[key] || {}, obj[key])
          } else {
            merged[key] = obj[key]
          }
        }
      }
      return merged
    }, {})
  }

  /**
   * 数组扁平化函数
   */
  const flattenArray = (arr: any[], depth: number = Infinity): any[] => {
    return depth > 0
      ? arr.reduce((acc, val) => acc.concat(Array.isArray(val) ? flattenArray(val, depth - 1) : val), [])
      : arr.slice()
  }

  /**
   * 立即处理数据
   */
  const processImmediately = async (rawData: RawDataItem[], config: FinalDataProcessingConfig): Promise<any> => {
    const startTime = Date.now()

    try {
      processorState.progress.currentStep = t('dataSource.processing.executing')
      const result = await executeProcessing(rawData, config)

      const processingTime = Date.now() - startTime

      // 更新统计
      updateProcessingStats(processingTime, true)

      // 记录性能数据
      if (enablePerformanceMonitoring) {
        recordPerformanceData(processingTime, rawData.length, true)
      }

      return result
    } catch (error: any) {
      const processingTime = Date.now() - startTime

      // 记录错误
      addError('immediate-processing', error.message, { rawData, config, error })

      // 更新统计
      updateProcessingStats(processingTime, false)

      // 记录性能数据
      if (enablePerformanceMonitoring) {
        recordPerformanceData(processingTime, rawData.length, false)
      }

      throw error
    } finally {
      processorState.progress.currentStep = ''
    }
  }

  /**
   * 更新处理统计
   */
  const updateProcessingStats = (processingTime: number, success: boolean) => {
    if (success) {
      processorState.stats.totalProcessed++
    } else {
      processorState.stats.totalErrors++
    }

    // 更新最大处理时间
    if (processingTime > processorState.stats.maxProcessingTime) {
      processorState.stats.maxProcessingTime = processingTime
    }

    // 计算平均处理时间
    const totalItems = processorState.stats.totalProcessed + processorState.stats.totalErrors
    const totalTime = processorState.stats.avgProcessingTime * (totalItems - 1) + processingTime
    processorState.stats.avgProcessingTime = Math.round(totalTime / totalItems)

    // 计算错误率
    processorState.stats.errorRate = Math.round((processorState.stats.totalErrors / totalItems) * 100)

    // 计算吞吐量（简化计算）
    if (processingTime > 0) {
      processorState.stats.throughput = Math.round((1000 / processingTime) * 10) / 10
    }
  }

  /**
   * 记录性能数据
   */
  const recordPerformanceData = (processingTime: number, dataSize: number, success: boolean) => {
    performanceData.value.push({
      timestamp: Date.now(),
      processingTime,
      dataSize,
      success
    })

    // 限制性能数据数量
    if (performanceData.value.length > 1000) {
      performanceData.value = performanceData.value.slice(-500)
    }
  }

  /**
   * 添加错误日志
   */
  const addError = (type: string, message: string, data?: any) => {
    if (!enableErrorLogging) return

    const error: ProcessingError = {
      type,
      message,
      timestamp: Date.now(),
      data
    }

    errorLogs.value.unshift(error)

    // 限制错误日志数量
    if (errorLogs.value.length > maxErrorLogs) {
      errorLogs.value = errorLogs.value.slice(0, maxErrorLogs)
    }
  }

  /**
   * 添加到处理历史
   */
  const addToHistory = (item: ProcessingQueueItem, success: boolean) => {
    processingHistory.value.unshift({
      id: item.id,
      timestamp: item.createdAt,
      config: item.config,
      inputCount: item.rawData.length,
      outputCount: success ? (Array.isArray(item.result) ? item.result.length : 1) : 0,
      processingTime: item.processingTime || 0,
      success,
      error: item.error
    })

    // 限制历史记录数量
    if (processingHistory.value.length > 200) {
      processingHistory.value = processingHistory.value.slice(0, 100)
    }
  }

  /**
   * 清空队列
   */
  const clearQueue = () => {
    processingQueue.value = []
    processorState.progress.current = 0
    processorState.progress.total = 0
    processorState.progress.percentage = 0
  }

  /**
   * 清空错误日志
   */
  const clearErrors = () => {
    errorLogs.value = []
  }

  /**
   * 清空处理历史
   */
  const clearHistory = () => {
    processingHistory.value = []
  }

  /**
   * 重置处理器
   */
  const reset = () => {
    // 停止处理
    if (processingTimer) {
      clearTimeout(processingTimer)
      processingTimer = null
    }

    // 清空队列和状态
    clearQueue()
    clearErrors()
    clearHistory()

    // 重置统计
    processorState.stats = {
      avgProcessingTime: 0,
      maxProcessingTime: 0,
      throughput: 0,
      errorRate: 0,
      totalProcessed: 0,
      totalErrors: 0
    }

    processorState.isProcessing = false
    processorState.currentItem = undefined
    processorState.lastProcessedAt = undefined
    processorState.progress.currentStep = ''

    performanceData.value = []
  }

  /**
   * 获取处理统计
   */
  const getProcessingStats = () => {
    return {
      ...processorState.stats,
      queueLength: queueLength.value,
      pendingCount: pendingItems.value.length,
      completedCount: completedItems.value.length,
      errorCount: errorItems.value.length,
      averageTime: averageProcessingTime.value
    }
  }

  /**
   * 获取性能报告
   */
  const getPerformanceReport = () => {
    const recent = performanceData.value.slice(-100)

    return {
      totalSamples: recent.length,
      averageTime: recent.reduce((sum, item) => sum + item.processingTime, 0) / recent.length || 0,
      maxTime: Math.max(...recent.map(item => item.processingTime), 0),
      minTime: Math.min(...recent.map(item => item.processingTime), 0),
      successRate: (recent.filter(item => item.success).length / recent.length) * 100 || 0,
      recentTrend: recent.slice(-10).map(item => ({
        time: item.processingTime,
        success: item.success,
        timestamp: item.timestamp
      }))
    }
  }

  // 返回composable接口
  return {
    // 状态
    processingQueue,
    processorState,
    errorLogs,
    processingHistory,
    performanceData,

    // 计算属性
    queueLength,
    pendingItems,
    completedItems,
    errorItems,
    averageProcessingTime,

    // 队列管理
    addToQueue,
    removeFromQueue,
    processQueue,
    clearQueue,

    // 处理执行
    processImmediately,
    executeProcessing,

    // 错误管理
    addError,
    clearErrors,

    // 历史管理
    clearHistory,

    // 重置和清理
    reset,

    // 统计和报告
    getProcessingStats,
    getPerformanceReport,
    updateProcessingStats,

    // 工具方法
    deepMerge,
    flattenArray,
    createUtilityFunctions
  }
}
