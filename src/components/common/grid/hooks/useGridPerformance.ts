/**
 * Grid 性能监控和优化 Hook
 * 提供性能指标监控和优化功能
 */

import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import type { GridLayoutPlusItem, PerformanceConfig } from '../gridLayoutPlusTypes'
import { debounce, throttle } from '../gridLayoutPlusUtils'

export interface UseGridPerformanceOptions {
  /** 性能配置 */
  performanceConfig?: Partial<PerformanceConfig>
  /** 是否启用性能监控 */
  enableMonitoring?: boolean
  /** 性能数据收集间隔(ms) */
  monitoringInterval?: number
  /** 是否自动优化 */
  autoOptimize?: boolean
}

export interface PerformanceMetrics {
  /** 渲染时间(ms) */
  renderTime: number
  /** 布局计算时间(ms) */
  layoutTime: number
  /** 项目数量 */
  itemCount: number
  /** 内存使用量估算(KB) */
  memoryUsage: number
  /** FPS值 */
  fps: number
  /** 最后更新时间 */
  lastUpdated: number
}

/**
 * 网格性能管理Hook
 * 提供性能监控、优化建议和自动优化功能
 */
export function useGridPerformance(options: UseGridPerformanceOptions = {}) {
  const { performanceConfig = {}, enableMonitoring = true, monitoringInterval = 1000, autoOptimize = false } = options

  // 性能配置
  const config = ref<PerformanceConfig>({
    enableVirtualization: false,
    virtualizationThreshold: 100,
    debounceDelay: 100,
    throttleDelay: 16,
    enableLazyLoading: false,
    lazyLoadingBuffer: 5,
    ...performanceConfig
  })

  // 性能指标
  const metrics = ref<PerformanceMetrics>({
    renderTime: 0,
    layoutTime: 0,
    itemCount: 0,
    memoryUsage: 0,
    fps: 60,
    lastUpdated: Date.now()
  })

  // 性能监控状态
  const isMonitoring = ref(false)
  const performanceHistory = ref<PerformanceMetrics[]>([])
  const maxHistoryLength = 100

  // FPS监控相关
  let fpsFrameCount = 0
  let fpsStartTime = 0
  let animationFrameId = 0
  let monitoringTimer: NodeJS.Timeout | null = null

  // 计算属性
  const needsVirtualization = computed(() => {
    return metrics.value.itemCount >= config.value.virtualizationThreshold
  })

  const performanceScore = computed(() => {
    const { renderTime, layoutTime, fps, itemCount } = metrics.value

    // 基于多个指标计算性能得分 (0-100)
    let score = 100

    // 渲染时间惩罚
    if (renderTime > 16) score -= Math.min(30, (renderTime - 16) / 2)

    // 布局计算时间惩罚
    if (layoutTime > 10) score -= Math.min(20, (layoutTime - 10) / 2)

    // FPS惩罚
    if (fps < 60) score -= Math.min(25, (60 - fps) / 2)

    // 项目数量惩罚
    if (itemCount > 50) score -= Math.min(25, (itemCount - 50) / 10)

    return Math.max(0, Math.floor(score))
  })

  const optimizationSuggestions = computed(() => {
    const suggestions: string[] = []
    const { renderTime, layoutTime, itemCount } = metrics.value

    if (itemCount >= config.value.virtualizationThreshold && !config.value.enableVirtualization) {
      suggestions.push('建议启用虚拟化以提高大数据集性能')
    }

    if (renderTime > 16) {
      suggestions.push('渲染时间过长，考虑减少DOM操作或启用防抖')
    }

    if (layoutTime > 10) {
      suggestions.push('布局计算耗时较长，考虑优化布局算法')
    }

    if (metrics.value.fps < 45) {
      suggestions.push('帧率较低，建议减少动画效果或优化渲染')
    }

    if (!config.value.enableLazyLoading && itemCount > 30) {
      suggestions.push('考虑启用懒加载以改善初始加载性能')
    }

    return suggestions
  })

  // 性能测量工具
  const measureRenderTime = async (renderFn: () => Promise<void> | void) => {
    const startTime = performance.now()

    try {
      await renderFn()
      await nextTick() // 等待DOM更新完成
    } catch (error) {
      console.error('[GridPerformance] Render function error:', error)
    }

    const endTime = performance.now()
    const renderTime = endTime - startTime

    metrics.value.renderTime = renderTime
    metrics.value.lastUpdated = Date.now()

    return renderTime
  }

  const measureLayoutTime = (layoutFn: () => void) => {
    const startTime = performance.now()

    try {
      layoutFn()
    } catch (error) {
      console.error('[GridPerformance] Layout function error:', error)
    }

    const endTime = performance.now()
    const layoutTime = endTime - startTime

    metrics.value.layoutTime = layoutTime
    metrics.value.lastUpdated = Date.now()

    return layoutTime
  }

  // 内存使用估算
  const estimateMemoryUsage = (layout: GridLayoutPlusItem[]) => {
    try {
      // 简化的内存使用估算
      const itemSize = 200 // 每个网格项大约200字节
      const layoutSize = JSON.stringify(layout).length * 2 // 字符串大小的2倍
      const totalSize = (layout.length * itemSize + layoutSize) / 1024 // 转换为KB

      metrics.value.memoryUsage = totalSize
      return totalSize
    } catch (error) {
      console.error('[GridPerformance] Failed to estimate memory usage:', error)
      return 0
    }
  }

  // FPS监控
  const measureFPS = () => {
    const now = performance.now()

    if (fpsStartTime === 0) {
      fpsStartTime = now
      fpsFrameCount = 0
    }

    fpsFrameCount++

    if (now - fpsStartTime >= 1000) {
      metrics.value.fps = Math.round((fpsFrameCount * 1000) / (now - fpsStartTime))
      fpsStartTime = now
      fpsFrameCount = 0
    }

    if (isMonitoring.value) {
      animationFrameId = requestAnimationFrame(measureFPS)
    }
  }

  // 性能监控控制
  const startMonitoring = () => {
    if (isMonitoring.value || !enableMonitoring) return

    isMonitoring.value = true
    fpsStartTime = 0
    fpsFrameCount = 0

    // 开始FPS监控
    measureFPS()

    // 定期收集性能数据
    monitoringTimer = setInterval(() => {
      const currentMetrics = { ...metrics.value }
      performanceHistory.value.push(currentMetrics)

      // 限制历史记录长度
      if (performanceHistory.value.length > maxHistoryLength) {
        performanceHistory.value.shift()
      }

      // 自动优化
      if (autoOptimize && performanceScore.value < 60) {
        applyAutoOptimizations()
      }
    }, monitoringInterval)

    console.debug('[GridPerformance] Monitoring started')
  }

  const stopMonitoring = () => {
    if (!isMonitoring.value) return

    isMonitoring.value = false

    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId)
      animationFrameId = 0
    }

    if (monitoringTimer) {
      clearInterval(monitoringTimer)
      monitoringTimer = null
    }

    console.debug('[GridPerformance] Monitoring stopped')
  }

  // 自动优化
  const applyAutoOptimizations = () => {
    const { itemCount } = metrics.value
    let optimized = false

    // 自动启用虚拟化
    if (itemCount >= config.value.virtualizationThreshold && !config.value.enableVirtualization) {
      config.value.enableVirtualization = true
      optimized = true
      console.debug('[GridPerformance] Auto-enabled virtualization')
    }

    // 自动调整防抖延迟
    if (metrics.value.renderTime > 20 && config.value.debounceDelay < 200) {
      config.value.debounceDelay = Math.min(200, config.value.debounceDelay + 50)
      optimized = true
      console.debug(`[GridPerformance] Increased debounce delay to ${config.value.debounceDelay}ms`)
    }

    // 自动启用懒加载
    if (itemCount > 30 && !config.value.enableLazyLoading) {
      config.value.enableLazyLoading = true
      optimized = true
      console.debug('[GridPerformance] Auto-enabled lazy loading')
    }

    return optimized
  }

  // 创建防抖和节流函数
  const createDebouncedFunction = <T extends (...args: any[]) => any>(fn: T, customDelay?: number) => {
    return debounce(fn, customDelay || config.value.debounceDelay)
  }

  const createThrottledFunction = <T extends (...args: any[]) => any>(fn: T, customDelay?: number) => {
    return throttle(fn, customDelay || config.value.throttleDelay)
  }

  // 性能报告
  const getPerformanceReport = () => {
    const avgMetrics = performanceHistory.value.reduce(
      (acc, metric) => ({
        renderTime: acc.renderTime + metric.renderTime,
        layoutTime: acc.layoutTime + metric.layoutTime,
        fps: acc.fps + metric.fps,
        memoryUsage: acc.memoryUsage + metric.memoryUsage
      }),
      { renderTime: 0, layoutTime: 0, fps: 0, memoryUsage: 0 }
    )

    const count = performanceHistory.value.length
    if (count === 0) return null

    return {
      current: metrics.value,
      average: {
        renderTime: avgMetrics.renderTime / count,
        layoutTime: avgMetrics.layoutTime / count,
        fps: avgMetrics.fps / count,
        memoryUsage: avgMetrics.memoryUsage / count
      },
      score: performanceScore.value,
      suggestions: optimizationSuggestions.value,
      historyLength: count
    }
  }

  // 生命周期管理
  onMounted(() => {
    if (enableMonitoring) {
      startMonitoring()
    }
  })

  onUnmounted(() => {
    stopMonitoring()
  })

  return {
    // 配置
    config,

    // 指标
    metrics,
    performanceScore,
    needsVirtualization,
    optimizationSuggestions,

    // 监控控制
    isMonitoring,
    startMonitoring,
    stopMonitoring,

    // 测量工具
    measureRenderTime,
    measureLayoutTime,
    estimateMemoryUsage,

    // 优化工具
    createDebouncedFunction,
    createThrottledFunction,
    applyAutoOptimizations,

    // 报告
    getPerformanceReport,
    performanceHistory
  }
}
