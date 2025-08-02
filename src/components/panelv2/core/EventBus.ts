/**
 * Event Bus Implementation
 * 事件总线实现，提供组件间标准化通信
 */

import type {
  EventBus,
  AdvancedEventBus,
  EventMap,
  EventHandler,
  EventHandlerMap,
  EventMiddleware,
  EventLog,
  EventStats
} from '../types/events'

export class PanelEventBus implements AdvancedEventBus {
  private handlers: EventHandlerMap = {}
  private anyHandlers: Array<(event: keyof EventMap, data: any) => void> = []
  private middlewares: EventMiddleware[] = []
  private namespaces: Map<string, EventBus> = new Map()
  private logs: EventLog[] = []
  private stats: EventStats = {
    totalEvents: 0,
    eventCounts: {} as Record<keyof EventMap, number>,
    averageHandleTime: {} as Record<keyof EventMap, number>,
    errors: 0
  }
  private loggingEnabled = false
  private maxLogs = 1000

  /**
   * 订阅事件
   */
  on<K extends keyof EventMap>(event: K, handler: EventHandler<K>): void {
    if (!this.handlers[event]) {
      this.handlers[event] = []
    }
    this.handlers[event]!.push(handler)
  }

  /**
   * 一次性事件订阅
   */
  once<K extends keyof EventMap>(event: K, handler: EventHandler<K>): void {
    const onceHandler: EventHandler<K> = data => {
      handler(data)
      this.off(event, onceHandler)
    }
    this.on(event, onceHandler)
  }

  /**
   * 取消订阅
   */
  off<K extends keyof EventMap>(event: K, handler: EventHandler<K>): void {
    const handlers = this.handlers[event]
    if (handlers) {
      const index = handlers.indexOf(handler)
      if (index > -1) {
        handlers.splice(index, 1)
      }
    }
  }

  /**
   * 发射事件
   */
  emit<K extends keyof EventMap>(event: K, data: EventMap[K]): void {
    const startTime = performance.now()

    try {
      // 执行前置中间件
      this.executeBeforeMiddlewares(event, data)

      // 记录日志
      if (this.loggingEnabled) {
        this.addLog(event, data)
      }

      // 执行事件处理器
      const handlers = this.handlers[event] || []
      handlers.forEach(handler => {
        try {
          handler(data)
        } catch (error) {
          this.handleError(error as Error, event, data)
        }
      })

      // 执行通配符处理器
      this.anyHandlers.forEach(handler => {
        try {
          handler(event, data)
        } catch (error) {
          this.handleError(error as Error, event, data)
        }
      })

      // 执行后置中间件
      this.executeAfterMiddlewares(event, data)

      // 更新统计信息
      this.updateStats(event, performance.now() - startTime)
    } catch (error) {
      this.handleError(error as Error, event, data)
    }
  }

  /**
   * 清除所有监听器
   */
  clear(): void {
    this.handlers = {}
    this.anyHandlers = []
  }

  /**
   * 获取监听器数量
   */
  listenerCount<K extends keyof EventMap>(event: K): number {
    return (this.handlers[event] || []).length
  }

  /**
   * 获取所有事件名
   */
  eventNames(): (keyof EventMap)[] {
    return Object.keys(this.handlers) as (keyof EventMap)[]
  }

  /**
   * 添加中间件
   */
  use(middleware: EventMiddleware): void {
    this.middlewares.push(middleware)
  }

  /**
   * 移除中间件
   */
  removeMiddleware(middleware: EventMiddleware): void {
    const index = this.middlewares.indexOf(middleware)
    if (index > -1) {
      this.middlewares.splice(index, 1)
    }
  }

  /**
   * 创建命名空间
   */
  namespace(name: string): EventBus {
    if (!this.namespaces.has(name)) {
      const namespacedBus = new NamespacedEventBus(this, name)
      this.namespaces.set(name, namespacedBus)
    }
    return this.namespaces.get(name)!
  }

  /**
   * 监听所有事件
   */
  onAny(handler: (event: keyof EventMap, data: any) => void): void {
    this.anyHandlers.push(handler)
  }

  /**
   * 取消监听所有事件
   */
  offAny(handler: (event: keyof EventMap, data: any) => void): void {
    const index = this.anyHandlers.indexOf(handler)
    if (index > -1) {
      this.anyHandlers.splice(index, 1)
    }
  }

  /**
   * 启用日志记录
   */
  enableLogging(): void {
    this.loggingEnabled = true
  }

  /**
   * 禁用日志记录
   */
  disableLogging(): void {
    this.loggingEnabled = false
  }

  /**
   * 获取日志
   */
  getLogs(): EventLog[] {
    return [...this.logs]
  }

  /**
   * 清空日志
   */
  clearLogs(): void {
    this.logs = []
  }

  /**
   * 获取统计信息
   */
  getStats(): EventStats {
    return { ...this.stats }
  }

  /**
   * 重置统计信息
   */
  resetStats(): void {
    this.stats = {
      totalEvents: 0,
      eventCounts: {} as Record<keyof EventMap, number>,
      averageHandleTime: {} as Record<keyof EventMap, number>,
      errors: 0
    }
  }

  /**
   * 批量发射事件
   */
  emitBatch<K extends keyof EventMap>(events: Array<{ event: K; data: EventMap[K] }>): void {
    events.forEach(({ event, data }) => {
      this.emit(event, data)
    })
  }

  /**
   * 延迟发射事件
   */
  emitDelay<K extends keyof EventMap>(event: K, data: EventMap[K], delay: number): void {
    setTimeout(() => {
      this.emit(event, data)
    }, delay)
  }

  /**
   * 防抖发射事件
   */
  private debounceTimers: Map<string, NodeJS.Timeout> = new Map()

  emitDebounce<K extends keyof EventMap>(event: K, data: EventMap[K], delay: number): void {
    const key = `${String(event)}_debounce`

    if (this.debounceTimers.has(key)) {
      clearTimeout(this.debounceTimers.get(key)!)
    }

    const timer = setTimeout(() => {
      this.emit(event, data)
      this.debounceTimers.delete(key)
    }, delay)

    this.debounceTimers.set(key, timer)
  }

  /**
   * 节流发射事件
   */
  private throttleTimers: Map<string, { timer: NodeJS.Timeout; pending: boolean }> = new Map()

  emitThrottle<K extends keyof EventMap>(event: K, data: EventMap[K], interval: number): void {
    const key = `${String(event)}_throttle`
    const throttleData = this.throttleTimers.get(key)

    if (!throttleData) {
      // 首次调用，立即执行
      this.emit(event, data)
      const timer = setTimeout(() => {
        this.throttleTimers.delete(key)
      }, interval)
      this.throttleTimers.set(key, { timer, pending: false })
    } else if (!throttleData.pending) {
      // 在间隔期内，标记为待执行
      throttleData.pending = true
      setTimeout(() => {
        if (throttleData.pending) {
          this.emit(event, data)
          throttleData.pending = false
        }
      }, interval)
    }
  }

  /**
   * 执行前置中间件
   */
  private executeBeforeMiddlewares<K extends keyof EventMap>(event: K, data: EventMap[K]): void {
    this.middlewares.forEach(middleware => {
      if (middleware.before) {
        try {
          middleware.before(event, data, () => {})
        } catch (error) {
          this.handleMiddlewareError(error as Error, middleware)
        }
      }
    })
  }

  /**
   * 执行后置中间件
   */
  private executeAfterMiddlewares<K extends keyof EventMap>(event: K, data: EventMap[K]): void {
    this.middlewares.forEach(middleware => {
      if (middleware.after) {
        try {
          middleware.after(event, data)
        } catch (error) {
          this.handleMiddlewareError(error as Error, middleware)
        }
      }
    })
  }

  /**
   * 处理错误
   */
  private handleError(error: Error, event: keyof EventMap, data: any): void {
    this.stats.errors++

    // 执行错误中间件
    this.middlewares.forEach(middleware => {
      if (middleware.error) {
        try {
          middleware.error(error, event, data)
        } catch (middlewareError) {
          console.error('Error in error middleware:', middlewareError)
        }
      }
    })

    // 发射错误事件
    if (event !== 'error:occurred') {
      this.emit('error:occurred', { error, context: String(event) })
    } else {
      console.error('EventBus error:', error)
    }
  }

  /**
   * 处理中间件错误
   */
  private handleMiddlewareError(error: Error, middleware: EventMiddleware): void {
    console.error('Middleware error:', error, middleware)
  }

  /**
   * 添加日志
   */
  private addLog<K extends keyof EventMap>(event: K, data: EventMap[K]): void {
    const log: EventLog = {
      timestamp: Date.now(),
      event,
      data,
      source: 'EventBus'
    }

    this.logs.push(log)

    // 限制日志数量
    if (this.logs.length > this.maxLogs) {
      this.logs.shift()
    }
  }

  /**
   * 更新统计信息
   */
  private updateStats<K extends keyof EventMap>(event: K, handleTime: number): void {
    this.stats.totalEvents++

    if (!this.stats.eventCounts[event]) {
      this.stats.eventCounts[event] = 0
    }
    this.stats.eventCounts[event]++

    // 计算平均处理时间
    const currentAvg = this.stats.averageHandleTime[event] || 0
    const count = this.stats.eventCounts[event]
    this.stats.averageHandleTime[event] = (currentAvg * (count - 1) + handleTime) / count
  }
}

/**
 * 命名空间事件总线
 */
class NamespacedEventBus implements EventBus {
  constructor(
    private parent: PanelEventBus,
    private namespace: string
  ) {}

  on<K extends keyof EventMap>(event: K, handler: EventHandler<K>): void {
    const namespacedEvent = `${this.namespace}:${String(event)}` as K
    this.parent.on(namespacedEvent, handler)
  }

  once<K extends keyof EventMap>(event: K, handler: EventHandler<K>): void {
    const namespacedEvent = `${this.namespace}:${String(event)}` as K
    this.parent.once(namespacedEvent, handler)
  }

  off<K extends keyof EventMap>(event: K, handler: EventHandler<K>): void {
    const namespacedEvent = `${this.namespace}:${String(event)}` as K
    this.parent.off(namespacedEvent, handler)
  }

  emit<K extends keyof EventMap>(event: K, data: EventMap[K]): void {
    const namespacedEvent = `${this.namespace}:${String(event)}` as K
    this.parent.emit(namespacedEvent, data)
  }

  clear(): void {
    // 清除此命名空间的所有处理器
    const eventsToClear = this.parent.eventNames().filter(event => String(event).startsWith(`${this.namespace}:`))
    eventsToClear.forEach(event => {
      delete this.parent.handlers[event]
    })
  }

  listenerCount<K extends keyof EventMap>(event: K): number {
    const namespacedEvent = `${this.namespace}:${String(event)}` as K
    return this.parent.listenerCount(namespacedEvent)
  }

  eventNames(): (keyof EventMap)[] {
    return this.parent
      .eventNames()
      .filter(event => String(event).startsWith(`${this.namespace}:`))
      .map(event => String(event).replace(`${this.namespace}:`, '') as keyof EventMap)
  }
}

// 单例事件总线实例
export const eventBus = new PanelEventBus()

// 默认导出
export default eventBus
