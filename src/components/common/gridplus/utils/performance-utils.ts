/**
 * 性能优化工具函数集合
 * 提供高性能渲染和操作的工具函数
 */

import type { PerformanceMetrics, PerformanceWarning, PerformanceWarningType } from '../types/gridplus-types'

/**
 * 性能监控器类
 */
export class PerformanceMonitor {
  private metrics: PerformanceMetrics = {
    fps: 60,
    memoryUsage: 0,
    renderTime: 0,
    layoutTime: 0,
    domNodeCount: 0,
    visibleItemCount: 0,
    totalItemCount: 0,
    timestamp: Date.now()
  }

  private frameCount = 0
  private lastFrameTime = performance.now()
  private frameStartTime = performance.now()
  private renderStartTime = 0
  private layoutStartTime = 0

  private fpsHistory: number[] = []
  private renderTimeHistory: number[] = []
  private memoryHistory: number[] = []

  private callbacks: Map<string, Function> = new Map()
  private isMonitoring = false
  private animationFrame: number | null = null

  /**
   * 启动性能监控
   */
  startMonitoring(): void {
    if (this.isMonitoring) return

    this.isMonitoring = true
    this.frameCount = 0
    this.lastFrameTime = performance.now()
    this.frameStartTime = performance.now()

    this.monitoringLoop()
  }

  /**
   * 停止性能监控
   */
  stopMonitoring(): void {
    this.isMonitoring = false
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame)
      this.animationFrame = null
    }
  }

  /**
   * 监控循环
   */
  private monitoringLoop(): void {
    if (!this.isMonitoring) return

    const now = performance.now()
    this.frameCount++

    // 计算FPS
    if (now - this.frameStartTime >= 1000) {
      const fps = (this.frameCount * 1000) / (now - this.frameStartTime)
      this.updateFPS(fps)

      this.frameCount = 0
      this.frameStartTime = now

      // 更新内存使用情况
      this.updateMemoryUsage()

      // 更新DOM节点数量
      this.updateDOMNodeCount()

      // 触发更新回调
      this.triggerUpdate()
    }

    this.lastFrameTime = now
    this.animationFrame = requestAnimationFrame(() => this.monitoringLoop())
  }

  /**
   * 开始渲染时间测量
   */
  startRenderMeasure(): void {
    this.renderStartTime = performance.now()
  }

  /**
   * 结束渲染时间测量
   */
  endRenderMeasure(): void {
    if (this.renderStartTime > 0) {
      const renderTime = performance.now() - this.renderStartTime
      this.updateRenderTime(renderTime)
      this.renderStartTime = 0
    }
  }

  /**
   * 开始布局时间测量
   */
  startLayoutMeasure(): void {
    this.layoutStartTime = performance.now()
  }

  /**
   * 结束布局时间测量
   */
  endLayoutMeasure(): void {
    if (this.layoutStartTime > 0) {
      const layoutTime = performance.now() - this.layoutStartTime
      this.updateLayoutTime(layoutTime)
      this.layoutStartTime = 0
    }
  }

  /**
   * 更新FPS
   */
  private updateFPS(fps: number): void {
    this.metrics.fps = Math.round(fps)
    this.fpsHistory.push(fps)

    // 保持历史记录不超过60个
    if (this.fpsHistory.length > 60) {
      this.fpsHistory.shift()
    }

    // 检查FPS警告
    if (fps < 30) {
      this.emitWarning({
        type: PerformanceWarningType.LOW_FPS,
        message: '帧率过低，可能影响用户体验',
        suggestion: '减少同时渲染的项目数量或降低动画复杂度',
        currentValue: fps,
        threshold: 30
      })
    }
  }

  /**
   * 更新渲染时间
   */
  private updateRenderTime(renderTime: number): void {
    this.metrics.renderTime = Math.round(renderTime * 100) / 100
    this.renderTimeHistory.push(renderTime)

    if (this.renderTimeHistory.length > 60) {
      this.renderTimeHistory.shift()
    }

    // 检查渲染时间警告
    if (renderTime > 16) {
      this.emitWarning({
        type: PerformanceWarningType.SLOW_RENDER,
        message: '渲染时间过长，可能造成卡顿',
        suggestion: '启用虚拟滚动或减少DOM操作',
        currentValue: renderTime,
        threshold: 16
      })
    }
  }

  /**
   * 更新布局时间
   */
  private updateLayoutTime(layoutTime: number): void {
    this.metrics.layoutTime = Math.round(layoutTime * 100) / 100
  }

  /**
   * 更新内存使用情况
   */
  private updateMemoryUsage(): void {
    if ('memory' in performance) {
      const memory = (performance as any).memory
      const memoryMB = memory.usedJSHeapSize / 1024 / 1024
      this.metrics.memoryUsage = Math.round(memoryMB * 100) / 100
      this.memoryHistory.push(memoryMB)

      if (this.memoryHistory.length > 60) {
        this.memoryHistory.shift()
      }

      // 检查内存使用警告
      if (memoryMB > 100) {
        this.emitWarning({
          type: PerformanceWarningType.HIGH_MEMORY,
          message: '内存使用过高',
          suggestion: '启用内存优化或清理不用的资源',
          currentValue: memoryMB,
          threshold: 100
        })
      }
    }
  }

  /**
   * 更新DOM节点数量
   */
  private updateDOMNodeCount(): void {
    this.metrics.domNodeCount = document.getElementsByTagName('*').length

    // 检查DOM节点数量警告
    if (this.metrics.domNodeCount > 5000) {
      this.emitWarning({
        type: PerformanceWarningType.TOO_MANY_NODES,
        message: 'DOM节点过多',
        suggestion: '启用虚拟滚动减少DOM节点数量',
        currentValue: this.metrics.domNodeCount,
        threshold: 5000
      })
    }
  }

  /**
   * 更新项目计数
   */
  updateItemCounts(visibleCount: number, totalCount: number): void {
    this.metrics.visibleItemCount = visibleCount
    this.metrics.totalItemCount = totalCount
  }

  /**
   * 触发更新回调
   */
  private triggerUpdate(): void {
    this.metrics.timestamp = Date.now()
    this.callbacks.forEach(callback => {
      try {
        callback(this.metrics)
      } catch (error) {
        console.error('Performance monitor callback error:', error)
      }
    })
  }

  /**
   * 发送性能警告
   */
  private emitWarning(warning: PerformanceWarning): void {
    const warningCallback = this.callbacks.get('warning')
    if (warningCallback) {
      warningCallback(warning)
    }
  }

  /**
   * 注册回调函数
   */
  on(event: 'update' | 'warning', callback: Function): void {
    this.callbacks.set(event, callback)
  }

  /**
   * 注销回调函数
   */
  off(event: 'update' | 'warning'): void {
    this.callbacks.delete(event)
  }

  /**
   * 获取当前指标
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics }
  }

  /**
   * 获取历史数据
   */
  getHistory(): {
    fps: number[]
    renderTime: number[]
    memory: number[]
  } {
    return {
      fps: [...this.fpsHistory],
      renderTime: [...this.renderTimeHistory],
      memory: [...this.memoryHistory]
    }
  }

  /**
   * 重置指标
   */
  reset(): void {
    this.metrics = {
      fps: 60,
      memoryUsage: 0,
      renderTime: 0,
      layoutTime: 0,
      domNodeCount: 0,
      visibleItemCount: 0,
      totalItemCount: 0,
      timestamp: Date.now()
    }

    this.fpsHistory = []
    this.renderTimeHistory = []
    this.memoryHistory = []
  }
}

/**
 * 防抖函数
 */
export function debounce<T extends (...args: any[]) => any>(func: T, delay: number): T {
  let timeoutId: NodeJS.Timeout | null = null

  return ((...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    timeoutId = setTimeout(() => {
      func.apply(null, args)
      timeoutId = null
    }, delay)
  }) as T
}

/**
 * 节流函数
 */
export function throttle<T extends (...args: any[]) => any>(func: T, delay: number): T {
  let lastCall = 0

  return ((...args: Parameters<T>) => {
    const now = Date.now()

    if (now - lastCall >= delay) {
      lastCall = now
      return func.apply(null, args)
    }
  }) as T
}

/**
 * RAF 节流函数
 */
export function rafThrottle<T extends (...args: any[]) => any>(func: T): T {
  let rafId: number | null = null
  let lastArgs: Parameters<T> | null = null

  return ((...args: Parameters<T>) => {
    lastArgs = args

    if (rafId === null) {
      rafId = requestAnimationFrame(() => {
        if (lastArgs) {
          func.apply(null, lastArgs)
        }
        rafId = null
        lastArgs = null
      })
    }
  }) as T
}

/**
 * 批量执行函数
 */
export class BatchProcessor<T> {
  private queue: T[] = []
  private processor: (items: T[]) => void
  private batchSize: number
  private delay: number
  private timeoutId: NodeJS.Timeout | null = null

  constructor(processor: (items: T[]) => void, batchSize: number = 10, delay: number = 0) {
    this.processor = processor
    this.batchSize = batchSize
    this.delay = delay
  }

  /**
   * 添加项目到队列
   */
  add(item: T): void {
    this.queue.push(item)

    if (this.queue.length >= this.batchSize) {
      this.flush()
    } else if (this.delay > 0 && !this.timeoutId) {
      this.timeoutId = setTimeout(() => {
        this.flush()
      }, this.delay)
    }
  }

  /**
   * 立即执行所有待处理项目
   */
  flush(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId)
      this.timeoutId = null
    }

    if (this.queue.length > 0) {
      const items = [...this.queue]
      this.queue = []
      this.processor(items)
    }
  }

  /**
   * 清空队列
   */
  clear(): void {
    this.queue = []
    if (this.timeoutId) {
      clearTimeout(this.timeoutId)
      this.timeoutId = null
    }
  }

  /**
   * 获取队列长度
   */
  getQueueLength(): number {
    return this.queue.length
  }
}

/**
 * 内存使用监控
 */
export class MemoryMonitor {
  private samples: number[] = []
  private maxSamples: number
  private warningThreshold: number
  private criticalThreshold: number
  private callbacks: Map<string, Function> = new Map()

  constructor(maxSamples: number = 100, warningThreshold: number = 50, criticalThreshold: number = 100) {
    this.maxSamples = maxSamples
    this.warningThreshold = warningThreshold
    this.criticalThreshold = criticalThreshold
  }

  /**
   * 采样内存使用情况
   */
  sample(): number {
    if (!('memory' in performance)) {
      return 0
    }

    const memory = (performance as any).memory
    const usageMB = memory.usedJSHeapSize / 1024 / 1024

    this.samples.push(usageMB)

    // 保持样本数量限制
    if (this.samples.length > this.maxSamples) {
      this.samples.shift()
    }

    // 检查阈值
    this.checkThresholds(usageMB)

    return usageMB
  }

  /**
   * 检查内存使用阈值
   */
  private checkThresholds(usage: number): void {
    if (usage > this.criticalThreshold) {
      this.emit('critical', usage)
    } else if (usage > this.warningThreshold) {
      this.emit('warning', usage)
    }
  }

  /**
   * 获取内存统计信息
   */
  getStats(): {
    current: number
    average: number
    max: number
    min: number
    trend: 'stable' | 'increasing' | 'decreasing'
  } {
    if (this.samples.length === 0) {
      return {
        current: 0,
        average: 0,
        max: 0,
        min: 0,
        trend: 'stable'
      }
    }

    const current = this.samples[this.samples.length - 1]
    const average = this.samples.reduce((a, b) => a + b) / this.samples.length
    const max = Math.max(...this.samples)
    const min = Math.min(...this.samples)

    // 计算趋势
    let trend: 'stable' | 'increasing' | 'decreasing' = 'stable'
    if (this.samples.length >= 10) {
      const recent = this.samples.slice(-10)
      const older = this.samples.slice(-20, -10)

      if (older.length > 0) {
        const recentAvg = recent.reduce((a, b) => a + b) / recent.length
        const olderAvg = older.reduce((a, b) => a + b) / older.length

        const diff = recentAvg - olderAvg
        if (diff > 1) trend = 'increasing'
        else if (diff < -1) trend = 'decreasing'
      }
    }

    return {
      current: Math.round(current * 100) / 100,
      average: Math.round(average * 100) / 100,
      max: Math.round(max * 100) / 100,
      min: Math.round(min * 100) / 100,
      trend
    }
  }

  /**
   * 触发垃圾回收（如果支持）
   */
  triggerGC(): boolean {
    if ('gc' in window && typeof (window as any).gc === 'function') {
      try {
        ;(window as any).gc()
        return true
      } catch (error) {
        console.warn('Failed to trigger garbage collection:', error)
      }
    }
    return false
  }

  /**
   * 注册事件回调
   */
  on(event: 'warning' | 'critical', callback: (usage: number) => void): void {
    this.callbacks.set(event, callback)
  }

  /**
   * 触发事件
   */
  private emit(event: string, usage: number): void {
    const callback = this.callbacks.get(event)
    if (callback) {
      callback(usage)
    }
  }
}

/**
 * 创建性能监控器实例
 */
export function createPerformanceMonitor(): PerformanceMonitor {
  return new PerformanceMonitor()
}

/**
 * 创建内存监控器实例
 */
export function createMemoryMonitor(
  maxSamples?: number,
  warningThreshold?: number,
  criticalThreshold?: number
): MemoryMonitor {
  return new MemoryMonitor(maxSamples, warningThreshold, criticalThreshold)
}
