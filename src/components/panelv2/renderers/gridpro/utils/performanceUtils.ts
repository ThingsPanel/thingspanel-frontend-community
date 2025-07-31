/**
 * GridPro 性能工具函数
 * 提供性能测量、优化和监控的实用工具
 */

import type { GridProConfig } from '../types/gridpro'
import type { BaseCanvasItem } from '../../../types/core'

/**
 * 性能计时器类
 */
export class PerformanceTimer {
  private startTime: number = 0
  private endTime: number = 0
  private marks: Map<string, number> = new Map()

  /**
   * 开始计时
   */
  start(): void {
    this.startTime = performance.now()
  }

  /**
   * 结束计时
   */
  end(): number {
    this.endTime = performance.now()
    return this.getDuration()
  }

  /**
   * 设置标记点
   */
  mark(name: string): void {
    this.marks.set(name, performance.now())
  }

  /**
   * 获取标记点之间的时间差
   */
  getMeasure(startMark: string, endMark: string): number {
    const start = this.marks.get(startMark) || this.startTime
    const end = this.marks.get(endMark) || performance.now()
    return end - start
  }

  /**
   * 获取总耗时
   */
  getDuration(): number {
    return this.endTime - this.startTime
  }

  /**
   * 重置计时器
   */
  reset(): void {
    this.startTime = 0
    this.endTime = 0
    this.marks.clear()
  }
}

/**
 * 内存监控器
 */
export class MemoryMonitor {
  private snapshots: Array<{
    timestamp: number
    heapUsed: number
    heapTotal: number
    external: number
  }> = []

  /**
   * 获取当前内存使用情况
   */
  getCurrentMemory(): { used: number; total: number; percentage: number } {
    if ('memory' in performance) {
      const memory = (performance as any).memory
      return {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        percentage: (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100
      }
    }

    return { used: 0, total: 0, percentage: 0 }
  }

  /**
   * 拍摄内存快照
   */
  takeSnapshot(): void {
    const memory = this.getCurrentMemory()
    this.snapshots.push({
      timestamp: Date.now(),
      heapUsed: memory.used,
      heapTotal: memory.total,
      external: 0 // 外部内存暂无法获取
    })

    // 限制快照数量
    if (this.snapshots.length > 100) {
      this.snapshots.shift()
    }
  }

  /**
   * 计算内存增长率
   */
  getGrowthRate(): number {
    if (this.snapshots.length < 2) return 0

    const recent = this.snapshots.slice(-10) // 最近10次快照
    if (recent.length < 2) return 0

    const first = recent[0]
    const last = recent[recent.length - 1]
    const timeDiff = last.timestamp - first.timestamp
    const memoryDiff = last.heapUsed - first.heapUsed

    return timeDiff > 0 ? (memoryDiff / timeDiff) * 1000 : 0 // MB/s
  }

  /**
   * 检测内存泄漏
   */
  detectMemoryLeak(): {
    hasLeak: boolean
    growthRate: number
    recommendation: string
  } {
    const growthRate = this.getGrowthRate()
    const hasLeak = growthRate > 1024 * 1024 // 1MB/s 被认为是内存泄漏

    let recommendation = ''
    if (hasLeak) {
      recommendation = '检测到可能的内存泄漏，建议启用对象池和优化事件监听器'
    } else if (growthRate > 512 * 1024) { // 512KB/s
      recommendation = '内存增长较快，建议启用虚拟化和批量更新'
    } else {
      recommendation = '内存使用正常'
    }

    return {
      hasLeak,
      growthRate,
      recommendation
    }
  }

  /**
   * 清理快照历史
   */
  clearSnapshots(): void {
    this.snapshots = []
  }
}

/**
 * FPS 监控器
 */
export class FPSMonitor {
  private frameCount: number = 0
  private lastTime: number = 0
  private fps: number = 60
  private isRunning: boolean = false
  private animationId: number = 0

  /**
   * 开始监控
   */
  start(): void {
    if (this.isRunning) return

    this.isRunning = true
    this.frameCount = 0
    this.lastTime = performance.now()
    this.tick()
  }

  /**
   * 停止监控
   */
  stop(): void {
    this.isRunning = false
    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
    }
  }

  /**
   * 获取当前FPS
   */
  getFPS(): number {
    return this.fps
  }

  /**
   * 帧计数
   */
  private tick(): void {
    if (!this.isRunning) return

    this.frameCount++
    const currentTime = performance.now()

    if (currentTime - this.lastTime >= 1000) {
      this.fps = Math.round((this.frameCount * 1000) / (currentTime - this.lastTime))
      this.frameCount = 0
      this.lastTime = currentTime
    }

    this.animationId = requestAnimationFrame(() => this.tick())
  }
}

/**
 * 渲染性能分析器
 */
export class RenderProfiler {
  private renderTimes: number[] = []
  private layoutTimes: number[] = []
  private paintTimes: number[] = []

  /**
   * 测量渲染时间
   */
  measureRender<T>(fn: () => T): { result: T; time: number } {
    const timer = new PerformanceTimer()
    timer.start()
    
    const result = fn()
    
    // 等待下一帧确保渲染完成
    return new Promise<{ result: T; time: number }>((resolve) => {
      requestAnimationFrame(() => {
        const time = timer.end()
        this.renderTimes.push(time)
        
        // 限制记录数量
        if (this.renderTimes.length > 100) {
          this.renderTimes.shift()
        }
        
        resolve({ result, time })
      })
    }) as any // 简化处理，实际使用时应该正确处理异步
  }

  /**
   * 获取平均渲染时间
   */
  getAverageRenderTime(): number {
    if (this.renderTimes.length === 0) return 0
    return this.renderTimes.reduce((sum, time) => sum + time, 0) / this.renderTimes.length
  }

  /**
   * 获取最大渲染时间
   */
  getMaxRenderTime(): number {
    return Math.max(...this.renderTimes, 0)
  }

  /**
   * 获取渲染时间百分位数
   */
  getRenderTimePercentile(percentile: number): number {
    if (this.renderTimes.length === 0) return 0
    
    const sorted = [...this.renderTimes].sort((a, b) => a - b)
    const index = Math.ceil((percentile / 100) * sorted.length) - 1
    return sorted[Math.max(0, index)]
  }

  /**
   * 分析性能瓶颈
   */
  analyzeBottlenecks(): {
    category: 'excellent' | 'good' | 'fair' | 'poor'
    issues: string[]
    recommendations: string[]
  } {
    const avgTime = this.getAverageRenderTime()
    const maxTime = this.getMaxRenderTime()
    const p95Time = this.getRenderTimePercentile(95)

    const issues: string[] = []
    const recommendations: string[] = []

    let category: 'excellent' | 'good' | 'fair' | 'poor' = 'excellent'

    if (avgTime > 16) {
      category = 'poor'
      issues.push(`平均渲染时间过长: ${avgTime.toFixed(1)}ms`)
      recommendations.push('启用虚拟化渲染')
      recommendations.push('减少DOM操作频率')
    } else if (avgTime > 10) {
      category = 'fair'
      issues.push(`平均渲染时间较长: ${avgTime.toFixed(1)}ms`)
      recommendations.push('优化渲染批处理')
    } else if (avgTime > 5) {
      category = 'good'
    }

    if (maxTime > 100) {
      issues.push(`存在严重的渲染卡顿: ${maxTime.toFixed(1)}ms`)
      recommendations.push('检查是否有同步阻塞操作')
    }

    if (p95Time > 50) {
      issues.push(`95%渲染时间过长: ${p95Time.toFixed(1)}ms`)
      recommendations.push('启用性能监控和自动优化')
    }

    return { category, issues, recommendations }
  }

  /**
   * 清理记录
   */
  clear(): void {
    this.renderTimes = []
    this.layoutTimes = []
    this.paintTimes = []
  }
}

/**
 * 网格性能优化器
 */
export class GridPerformanceOptimizer {
  private itemCount: number = 0
  private viewportSize: { width: number; height: number } = { width: 0, height: 0 }
  private deviceCapabilities: {
    memory: number
    cores: number
    hasWebGL: boolean
    isMobile: boolean
  }

  constructor() {
    this.deviceCapabilities = this.detectDeviceCapabilities()
  }

  /**
   * 检测设备能力
   */
  private detectDeviceCapabilities() {
    const memory = (navigator as any).deviceMemory || 4
    const cores = navigator.hardwareConcurrency || 4
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    
    // 检测WebGL支持
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
    const hasWebGL = !!gl

    return { memory, cores, hasWebGL, isMobile }
  }

  /**
   * 根据当前状态推荐配置
   */
  recommendConfig(
    itemCount: number,
    viewportSize: { width: number; height: number },
    currentConfig: GridProConfig
  ): Partial<GridProConfig> {
    this.itemCount = itemCount
    this.viewportSize = viewportSize

    const recommendations: Partial<GridProConfig> = {}

    // 虚拟化推荐
    if (this.shouldEnableVirtualization()) {
      recommendations.virtualization = {
        enabled: true,
        bufferSize: this.getOptimalBufferSize(),
        preloadCount: this.getOptimalPreloadCount()
      }
    }

    // 批处理推荐
    if (this.shouldEnableBatching()) {
      recommendations.performance = {
        ...currentConfig.performance,
        batchUpdates: true,
        batchSize: this.getOptimalBatchSize(),
        batchInterval: this.getOptimalBatchInterval()
      }
    }

    // 动画推荐
    if (this.shouldOptimizeAnimations()) {
      recommendations.animation = {
        ...currentConfig.animation,
        enabled: !this.deviceCapabilities.isMobile,
        duration: this.getOptimalAnimationDuration(),
        quality: this.getOptimalAnimationQuality()
      }
    }

    // 对象池推荐
    if (this.shouldEnableObjectPool()) {
      recommendations.performance = {
        ...recommendations.performance,
        ...currentConfig.performance,
        enableObjectPool: true,
        poolSize: this.getOptimalPoolSize()
      }
    }

    return recommendations
  }

  /**
   * 是否应该启用虚拟化
   */
  private shouldEnableVirtualization(): boolean {
    return this.itemCount > 100 || this.deviceCapabilities.memory < 4
  }

  /**
   * 是否应该启用批处理
   */
  private shouldEnableBatching(): boolean {
    return this.itemCount > 50 || this.deviceCapabilities.cores < 4
  }

  /**
   * 是否应该优化动画
   */
  private shouldOptimizeAnimations(): boolean {
    return this.deviceCapabilities.isMobile || this.deviceCapabilities.memory < 4
  }

  /**
   * 是否应该启用对象池
   */
  private shouldEnableObjectPool(): boolean {
    return this.itemCount > 200 || this.deviceCapabilities.memory < 8
  }

  /**
   * 获取最优缓冲区大小
   */
  private getOptimalBufferSize(): number {
    if (this.deviceCapabilities.memory >= 8) return 100
    if (this.deviceCapabilities.memory >= 4) return 50
    return 20
  }

  /**
   * 获取最优预加载数量
   */
  private getOptimalPreloadCount(): number {
    if (this.deviceCapabilities.memory >= 8) return 20
    if (this.deviceCapabilities.memory >= 4) return 10
    return 5
  }

  /**
   * 获取最优批处理大小
   */
  private getOptimalBatchSize(): number {
    if (this.deviceCapabilities.cores >= 8) return 50
    if (this.deviceCapabilities.cores >= 4) return 30
    return 20
  }

  /**
   * 获取最优批处理间隔
   */
  private getOptimalBatchInterval(): number {
    if (this.deviceCapabilities.isMobile) return 32
    if (this.deviceCapabilities.cores >= 4) return 8
    return 16
  }

  /**
   * 获取最优动画持续时间
   */
  private getOptimalAnimationDuration(): number {
    if (this.deviceCapabilities.isMobile) return 150
    if (this.deviceCapabilities.memory < 4) return 200
    return 250
  }

  /**
   * 获取最优动画质量
   */
  private getOptimalAnimationQuality(): 'low' | 'medium' | 'high' {
    if (this.deviceCapabilities.isMobile) return 'low'
    if (this.deviceCapabilities.memory < 4) return 'medium'
    return 'high'
  }

  /**
   * 获取最优对象池大小
   */
  private getOptimalPoolSize(): number {
    if (this.deviceCapabilities.memory >= 8) return 200
    if (this.deviceCapabilities.memory >= 4) return 100
    return 50
  }
}

/**
 * 创建性能监控套件
 */
export function createPerformanceMonitoringSuite() {
  return {
    timer: new PerformanceTimer(),
    memory: new MemoryMonitor(),
    fps: new FPSMonitor(),
    profiler: new RenderProfiler(),
    optimizer: new GridPerformanceOptimizer()
  }
}

/**
 * 性能度量工具函数
 */
export const performanceUtils = {
  /**
   * 测量函数执行时间
   */
  measure<T>(fn: () => T, label?: string): { result: T; time: number } {
    const start = performance.now()
    const result = fn()
    const time = performance.now() - start
    
    if (label && time > 1) {
      console.debug(`[Performance] ${label}: ${time.toFixed(2)}ms`)
    }
    
    return { result, time }
  },

  /**
   * 延迟执行函数
   */
  defer<T>(fn: () => T): Promise<T> {
    return new Promise(resolve => {
      requestAnimationFrame(() => {
        resolve(fn())
      })
    })
  },

  /**
   * 批量处理数组项目
   */
  async processBatch<T, R>(
    items: T[],
    processor: (item: T) => R,
    batchSize: number = 20,
    delay: number = 0
  ): Promise<R[]> {
    const results: R[] = []
    
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize)
      const batchResults = batch.map(processor)
      results.push(...batchResults)
      
      if (delay > 0 && i + batchSize < items.length) {
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
    
    return results
  },

  /**
   * 节流函数
   */
  throttle<T extends (...args: any[]) => any>(
    fn: T,
    delay: number
  ): (...args: Parameters<T>) => void {
    let lastCall = 0
    return (...args: Parameters<T>) => {
      const now = Date.now()
      if (now - lastCall >= delay) {
        lastCall = now
        fn(...args)
      }
    }
  },

  /**
   * 防抖函数
   */
  debounce<T extends (...args: any[]) => any>(
    fn: T,
    delay: number
  ): (...args: Parameters<T>) => void {
    let timeoutId: number
    return (...args: Parameters<T>) => {
      clearTimeout(timeoutId)
      timeoutId = window.setTimeout(() => fn(...args), delay)
    }
  },

  /**
   * 检查是否支持某个特性
   */
  supports: {
    webGL(): boolean {
      const canvas = document.createElement('canvas')
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
      return !!gl
    },

    intersectionObserver(): boolean {
      return 'IntersectionObserver' in window
    },

    resizeObserver(): boolean {
      return 'ResizeObserver' in window
    },

    pointerEvents(): boolean {
      return 'PointerEvent' in window
    },

    memory(): boolean {
      return 'memory' in performance
    }
  }
}