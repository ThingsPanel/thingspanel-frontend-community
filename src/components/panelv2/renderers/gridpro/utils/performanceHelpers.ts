/**
 * GridPro 性能优化工具
 * 包含批量更新、防抖节流、内存管理等性能优化功能
 */

import type { PerformanceMetrics } from '../types/gridpro'

/**
 * 批量DOM更新管理器
 */
export class BatchUpdateManager {
  private updateQueue: Array<() => void> = []
  private rafId: number | null = null
  private isProcessing = false

  /**
   * 添加更新到队列
   */
  schedule(callback: () => void): void {
    this.updateQueue.push(callback)
    
    if (!this.rafId && !this.isProcessing) {
      this.rafId = requestAnimationFrame(() => this.processQueue())
    }
  }

  /**
   * 处理更新队列
   */
  private processQueue(): void {
    this.isProcessing = true
    const callbacks = this.updateQueue.splice(0)
    
    callbacks.forEach(callback => {
      try {
        callback()
      } catch (error) {
        console.error('BatchUpdate error:', error)
      }
    })
    
    this.rafId = null
    this.isProcessing = false
    
    // 如果在处理过程中又有新的更新，继续处理
    if (this.updateQueue.length > 0) {
      this.rafId = requestAnimationFrame(() => this.processQueue())
    }
  }

  /**
   * 立即执行所有待处理的更新
   */
  flush(): void {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
    this.processQueue()
  }

  /**
   * 清空队列
   */
  clear(): void {
    this.updateQueue = []
    if (this.rafId) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
  }
}

/**
 * 防抖工具
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate = false
): T {
  let timeout: NodeJS.Timeout | null = null
  
  return ((...args: Parameters<T>) => {
    const later = () => {
      timeout = null
      if (!immediate) func.apply(null, args)
    }
    
    const callNow = immediate && !timeout
    
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(later, wait)
    
    if (callNow) func.apply(null, args)
  }) as T
}

/**
 * 节流工具
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): T {
  let lastCall = 0
  
  return ((...args: Parameters<T>) => {
    const now = Date.now()
    if (now - lastCall >= limit) {
      lastCall = now
      return func.apply(null, args)
    }
  }) as T
}

/**
 * 性能监控器
 */
export class PerformanceMonitor {
  private metrics: PerformanceMetrics = {
    renderTime: 0,
    updateTime: 0,
    memoryUsage: 0,
    frameRate: 0,
    itemCount: 0,
    visibleItems: 0
  }

  private frameCount = 0
  private lastFrameTime = 0
  private frameRateHistory: number[] = []
  private isMonitoring = false

  /**
   * 开始监控
   */
  startMonitoring(): void {
    this.isMonitoring = true
    this.monitorFrameRate()
  }

  /**
   * 停止监控
   */
  stopMonitoring(): void {
    this.isMonitoring = false
  }

  /**
   * 监控帧率
   */
  private monitorFrameRate(): void {
    if (!this.isMonitoring) return

    const now = performance.now()
    
    if (this.lastFrameTime > 0) {
      const delta = now - this.lastFrameTime
      const fps = 1000 / delta
      
      this.frameRateHistory.push(fps)
      if (this.frameRateHistory.length > 60) {
        this.frameRateHistory.shift()
      }
      
      this.metrics.frameRate = this.frameRateHistory.reduce((a, b) => a + b, 0) / this.frameRateHistory.length
    }
    
    this.lastFrameTime = now
    requestAnimationFrame(() => this.monitorFrameRate())
  }

  /**
   * 测量渲染时间
   */
  measureRender<T>(renderFunction: () => T): T {
    const startTime = performance.now()
    const result = renderFunction()
    this.metrics.renderTime = performance.now() - startTime
    return result
  }

  /**
   * 测量更新时间
   */
  measureUpdate<T>(updateFunction: () => T): T {
    const startTime = performance.now()
    const result = updateFunction()
    this.metrics.updateTime = performance.now() - startTime
    return result
  }

  /**
   * 更新内存使用情况
   */
  updateMemoryUsage(): void {
    if ('memory' in performance) {
      // @ts-ignore - performance.memory 不是标准API但在Chrome中可用
      this.metrics.memoryUsage = performance.memory.usedJSHeapSize / 1024 / 1024 // MB
    }
  }

  /**
   * 更新项目计数
   */
  updateItemCount(total: number, visible: number): void {
    this.metrics.itemCount = total
    this.metrics.visibleItems = visible
  }

  /**
   * 获取当前指标
   */
  getMetrics(): PerformanceMetrics {
    this.updateMemoryUsage()
    return { ...this.metrics }
  }

  /**
   * 检查性能警告
   */
  checkPerformanceWarnings(): string[] {
    const warnings: string[] = []
    const metrics = this.getMetrics()

    if (metrics.frameRate < 30) {
      warnings.push(`帧率过低: ${metrics.frameRate.toFixed(1)}fps`)
    }

    if (metrics.renderTime > 16) {
      warnings.push(`渲染时间过长: ${metrics.renderTime.toFixed(2)}ms`)
    }

    if (metrics.memoryUsage > 100) {
      warnings.push(`内存使用过高: ${metrics.memoryUsage.toFixed(2)}MB`)
    }

    if (metrics.itemCount > 1000 && metrics.visibleItems === metrics.itemCount) {
      warnings.push('建议启用虚拟化以提升性能')
    }

    return warnings
  }
}

/**
 * 对象池管理器
 */
export class ObjectPool<T> {
  private pool: T[] = []
  private createFn: () => T
  private resetFn?: (obj: T) => void
  private maxSize: number

  constructor(createFn: () => T, maxSize = 100, resetFn?: (obj: T) => void) {
    this.createFn = createFn
    this.resetFn = resetFn
    this.maxSize = maxSize
  }

  /**
   * 获取对象
   */
  acquire(): T {
    if (this.pool.length > 0) {
      return this.pool.pop()!
    }
    return this.createFn()
  }

  /**
   * 释放对象
   */
  release(obj: T): void {
    if (this.resetFn) {
      this.resetFn(obj)
    }
    
    if (this.pool.length < this.maxSize) {
      this.pool.push(obj)
    }
  }

  /**
   * 清空池
   */
  clear(): void {
    this.pool = []
  }

  /**
   * 获取池大小
   */
  size(): number {
    return this.pool.length
  }
}

/**
 * 内存优化工具
 */
export class MemoryOptimizer {
  private static readonly LARGE_OBJECT_THRESHOLD = 1000
  private static weakMapCache = new WeakMap()

  /**
   * 创建弱引用缓存
   */
  static createWeakCache<K extends object, V>(): WeakMap<K, V> {
    return new WeakMap<K, V>()
  }

  /**
   * 优化大型数组
   */
  static optimizeLargeArray<T>(array: T[]): T[] {
    if (array.length > this.LARGE_OBJECT_THRESHOLD) {
      // 对大型数组进行分片处理
      return array.slice()
    }
    return array
  }

  /**
   * 清理未使用的引用
   */
  static cleanup(obj: any): void {
    if (obj && typeof obj === 'object') {
      Object.keys(obj).forEach(key => {
        if (obj[key] && typeof obj[key] === 'object') {
          obj[key] = null
        }
      })
    }
  }

  /**
   * 获取对象内存占用估算
   */
  static estimateMemoryUsage(obj: any): number {
    const seen = new WeakSet()
    
    function sizeOf(obj: any): number {
      if (obj === null || obj === undefined) return 0
      if (typeof obj === 'boolean') return 4
      if (typeof obj === 'number') return 8
      if (typeof obj === 'string') return obj.length * 2
      if (typeof obj === 'symbol') return 8
      
      if (seen.has(obj)) return 0
      seen.add(obj)
      
      let size = 0
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          size += sizeOf(key) + sizeOf(obj[key])
        }
      }
      
      return size
    }
    
    return sizeOf(obj)
  }
}

/**
 * 虚拟化助手
 */
export class VirtualizationHelper {
  /**
   * 计算可视区域内的项目
   */
  static calculateVisibleItems<T extends { y: number; h: number }>(
    items: T[],
    scrollTop: number,
    viewportHeight: number,
    itemHeight: number,
    buffer = 5
  ): { visibleItems: T[]; startIndex: number; endIndex: number } {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - buffer)
    const endIndex = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + viewportHeight) / itemHeight) + buffer
    )

    const visibleItems = items.slice(startIndex, endIndex + 1)

    return { visibleItems, startIndex, endIndex }
  }

  /**
   * 计算滚动容器高度
   */
  static calculateTotalHeight(itemCount: number, itemHeight: number): number {
    return itemCount * itemHeight
  }

  /**
   * 计算项目偏移量
   */
  static calculateItemOffset(index: number, itemHeight: number): number {
    return index * itemHeight
  }
}

/**
 * 创建性能优化的批量更新hook
 */
export function createBatchUpdater() {
  const batchManager = new BatchUpdateManager()
  
  return {
    schedule: (callback: () => void) => batchManager.schedule(callback),
    flush: () => batchManager.flush(),
    clear: () => batchManager.clear()
  }
}

/**
 * 创建防抖更新hook
 */
export function createDebouncedUpdater<T extends (...args: any[]) => any>(
  func: T,
  delay = 16
): T {
  return debounce(func, delay)
}

/**
 * 创建节流更新hook
 */
export function createThrottledUpdater<T extends (...args: any[]) => any>(
  func: T,
  limit = 16
): T {
  return throttle(func, limit)
}