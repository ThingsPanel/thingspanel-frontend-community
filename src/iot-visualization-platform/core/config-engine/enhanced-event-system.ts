/**
 * 增强的配置事件系统
 *
 * 企业级事件驱动架构，支持复杂的事件处理和通信机制
 *
 * 主要特性：
 * 1. 多层级事件类型 - 系统级、应用级、组件级事件
 * 2. 事件路由和分发 - 智能的事件路由机制
 * 3. 事件管道和中间件 - 可插拔的事件处理管道
 * 4. 事件持久化 - 事件历史记录和回放
 * 5. 事件聚合和批处理 - 高性能的事件处理
 * 6. 条件事件触发 - 基于条件的智能触发
 * 7. 事件优先级和调度 - 优先级队列和延迟执行
 * 8. 跨组件通信 - 组件间的解耦通信
 *
 * 创建时间：2025年1月
 * 作者：ThingsPanel Team
 */

import { EventEmitter } from 'events'

// ========== 🎯 事件系统类型定义 ==========

/**
 * 事件类型层级枚举
 */
export enum EventLevel {
  SYSTEM = 'system',           // 系统级事件：启动、关闭、错误等
  APPLICATION = 'application', // 应用级事件：路由变化、主题切换等
  COMPONENT = 'component',     // 组件级事件：创建、更新、删除等
  INTERACTION = 'interaction', // 交互事件：点击、拖拽、输入等
  DATA = 'data',              // 数据事件：加载、更新、同步等
  VALIDATION = 'validation',   // 验证事件：验证开始、成功、失败等
  LIFECYCLE = 'lifecycle'      // 生命周期事件：挂载、卸载、更新等
}

/**
 * 事件优先级
 */
export enum EventPriority {
  CRITICAL = 1,    // 关键事件：错误、安全等
  HIGH = 2,        // 高优先级：用户交互、数据更新等
  NORMAL = 3,      // 普通事件：日志、统计等
  LOW = 4,         // 低优先级：清理、优化等
  BACKGROUND = 5   // 后台事件：缓存、预加载等
}

/**
 * 事件状态
 */
export enum EventStatus {
  PENDING = 'pending',       // 等待处理
  PROCESSING = 'processing', // 正在处理
  COMPLETED = 'completed',   // 处理完成
  FAILED = 'failed',         // 处理失败
  CANCELLED = 'cancelled',   // 已取消
  TIMEOUT = 'timeout'        // 超时
}

/**
 * 增强的事件定义
 */
export interface EnhancedEvent {
  // 基础信息
  id: string
  type: string
  level: EventLevel
  priority: EventPriority
  status: EventStatus

  // 事件内容
  data: any
  metadata: {
    source: string           // 事件源
    target?: string         // 事件目标
    correlationId?: string  // 关联ID，用于事件链追踪
    parentEventId?: string  // 父事件ID
    version: string         // 事件版本
    schema?: string         // 数据schema
  }

  // 时间信息
  timestamp: number
  scheduledAt?: number      // 计划执行时间
  processedAt?: number      // 实际处理时间
  completedAt?: number      // 完成时间
  expiresAt?: number        // 过期时间

  // 处理信息
  retryCount: number
  maxRetries: number
  timeout?: number          // 超时时间(ms)
  delay?: number           // 延迟执行时间(ms)

  // 路由信息
  routing: {
    channels: string[]      // 事件通道
    tags: string[]         // 事件标签
    filters?: Record<string, any> // 路由过滤器
  }

  // 执行结果
  result?: {
    success: boolean
    data?: any
    error?: string
    duration?: number
    handlerCount?: number
  }
}

/**
 * 事件处理器接口
 */
export interface EventHandler {
  id: string
  name: string
  description?: string
  priority: EventPriority
  eventTypes: string[]     // 支持的事件类型
  conditions?: EventCondition[]  // 执行条件
  middleware?: EventMiddleware[] // 中间件
  handler: (event: EnhancedEvent, context: EventContext) => Promise<any> | any
  options?: {
    async?: boolean        // 是否异步执行
    debounce?: number     // 防抖延迟
    throttle?: number     // 节流延迟
    once?: boolean        // 是否只执行一次
    timeout?: number      // 处理超时时间
  }
}

/**
 * 事件条件
 */
export interface EventCondition {
  field: string            // 检查的字段路径
  operator: 'eq' | 'ne' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'contains' | 'matches'
  value: any              // 比较值
  logic?: 'and' | 'or'    // 与其他条件的逻辑关系
}

/**
 * 事件中间件
 */
export interface EventMiddleware {
  name: string
  execute: (event: EnhancedEvent, context: EventContext, next: () => Promise<any>) => Promise<any>
  priority?: number
}

/**
 * 事件执行上下文
 */
export interface EventContext {
  eventSystem: EnhancedEventSystem
  correlationId: string
  parentEvent?: EnhancedEvent
  executionChain: string[]  // 执行链
  metadata: Record<string, any>
  startTime: number
  timeout?: number
  signal?: AbortSignal     // 取消信号
}

/**
 * 事件订阅选项
 */
export interface SubscriptionOptions {
  priority?: EventPriority
  conditions?: EventCondition[]
  channels?: string[]
  tags?: string[]
  once?: boolean
  debounce?: number
  throttle?: number
  timeout?: number
}

/**
 * 事件发布选项
 */
export interface PublishOptions {
  priority?: EventPriority
  delay?: number           // 延迟发布
  channels?: string[]      // 指定通道
  tags?: string[]          // 事件标签
  timeout?: number         // 处理超时
  maxRetries?: number      // 最大重试次数
  correlationId?: string   // 关联ID
  parentEventId?: string   // 父事件ID
  metadata?: Record<string, any>
}

/**
 * 事件统计信息
 */
export interface EventStatistics {
  totalEvents: number
  eventsByLevel: Record<EventLevel, number>
  eventsByPriority: Record<EventPriority, number>
  eventsByStatus: Record<EventStatus, number>
  averageProcessingTime: number
  errorRate: number
  throughput: number       // 每秒处理事件数
  queueSize: number
  handlerCount: number
  activeSubscriptions: number
}

/**
 * 事件历史记录
 */
export interface EventHistory {
  event: EnhancedEvent
  handlers: Array<{
    handlerId: string
    startTime: number
    endTime?: number
    result?: any
    error?: string
  }>
  totalDuration: number
  success: boolean
}

// ========== 🚀 增强的事件系统主类 ==========

/**
 * 增强的事件系统
 */
export class EnhancedEventSystem extends EventEmitter {
  // ========== 存储 ==========
  private handlers = new Map<string, EventHandler>()
  private subscriptions = new Map<string, Set<string>>() // eventType -> handlerIds
  private eventQueue = new Map<EventPriority, EnhancedEvent[]>()
  private processingQueue = new Set<string>() // 正在处理的事件ID
  private eventHistory = new Map<string, EventHistory>()
  private scheduledEvents = new Map<string, NodeJS.Timeout>()

  // ========== 配置 ==========
  private readonly MAX_QUEUE_SIZE = 10000
  private readonly MAX_HISTORY_SIZE = 1000
  private readonly DEFAULT_TIMEOUT = 30000 // 30秒
  private readonly CLEANUP_INTERVAL = 60000 // 1分钟清理一次
  private readonly MAX_RETRY_COUNT = 3

  // ========== 状态 ==========
  private isProcessing = false
  private statistics: EventStatistics = {
    totalEvents: 0,
    eventsByLevel: {} as Record<EventLevel, number>,
    eventsByPriority: {} as Record<EventPriority, number>,
    eventsByStatus: {} as Record<EventStatus, number>,
    averageProcessingTime: 0,
    errorRate: 0,
    throughput: 0,
    queueSize: 0,
    handlerCount: 0,
    activeSubscriptions: 0
  }

  // ========== 定时器 ==========
  private processingTimer?: NodeJS.Timeout
  private cleanupTimer?: NodeJS.Timeout
  private throughputTimer?: NodeJS.Timeout

  constructor() {
    super()
    this.initializeEventSystem()
  }

  // ========== 🎯 核心事件方法 ==========

  /**
   * 发布事件
   */
  async publish(
    eventType: string,
    data: any,
    options: PublishOptions = {}
  ): Promise<string> {
    const {
      priority = EventPriority.NORMAL,
      delay = 0,
      channels = ['default'],
      tags = [],
      timeout = this.DEFAULT_TIMEOUT,
      maxRetries = this.MAX_RETRY_COUNT,
      correlationId = this.generateCorrelationId(),
      parentEventId,
      metadata = {}
    } = options

    // 创建事件
    const event: EnhancedEvent = {
      id: this.generateEventId(),
      type: eventType,
      level: this.determineEventLevel(eventType),
      priority,
      status: EventStatus.PENDING,
      data,
      metadata: {
        source: 'EnhancedEventSystem',
        correlationId,
        parentEventId,
        version: '1.0.0',
        ...metadata
      },
      timestamp: Date.now(),
      scheduledAt: delay > 0 ? Date.now() + delay : undefined,
      retryCount: 0,
      maxRetries,
      timeout,
      delay,
      routing: {
        channels,
        tags
      }
    }

    // 更新统计
    this.updateStatistics('publish', event)

    if (delay > 0) {
      // 延迟发布
      this.scheduleEvent(event)
    } else {
      // 立即发布
      await this.enqueueEvent(event)
    }

    this.emit('eventPublished', event)
    return event.id
  }

  /**
   * 订阅事件
   */
  subscribe(
    eventTypes: string | string[],
    handler: (event: EnhancedEvent, context: EventContext) => Promise<any> | any,
    options: SubscriptionOptions = {}
  ): string {
    const {
      priority = EventPriority.NORMAL,
      conditions = [],
      channels = ['default'],
      tags = [],
      once = false,
      debounce,
      throttle,
      timeout
    } = options

    const handlerId = this.generateHandlerId()
    const eventTypesArray = Array.isArray(eventTypes) ? eventTypes : [eventTypes]

    const eventHandler: EventHandler = {
      id: handlerId,
      name: `Handler_${handlerId}`,
      priority,
      eventTypes: eventTypesArray,
      conditions,
      handler,
      options: {
        async: true,
        debounce,
        throttle,
        once,
        timeout
      }
    }

    // 注册处理器
    this.handlers.set(handlerId, eventHandler)

    // 建立订阅关系
    for (const eventType of eventTypesArray) {
      if (!this.subscriptions.has(eventType)) {
        this.subscriptions.set(eventType, new Set())
      }
      this.subscriptions.get(eventType)!.add(handlerId)
    }

    this.updateStatistics('subscribe')
    this.emit('handlerRegistered', eventHandler)


    // 返回取消订阅函数
    return handlerId
  }

  /**
   * 取消订阅
   */
  unsubscribe(handlerId: string): boolean {
    const handler = this.handlers.get(handlerId)
    if (!handler) {
      return false
    }

    // 移除订阅关系
    for (const eventType of handler.eventTypes) {
      const handlers = this.subscriptions.get(eventType)
      if (handlers) {
        handlers.delete(handlerId)
        if (handlers.size === 0) {
          this.subscriptions.delete(eventType)
        }
      }
    }

    // 移除处理器
    this.handlers.delete(handlerId)

    this.updateStatistics('unsubscribe')
    this.emit('handlerUnregistered', handler)

    return true
  }

  // ========== 📊 查询和管理方法 ==========

  /**
   * 获取事件统计
   */
  getStatistics(): EventStatistics {
    // 更新实时统计
    this.statistics.queueSize = this.getTotalQueueSize()
    this.statistics.handlerCount = this.handlers.size
    this.statistics.activeSubscriptions = this.subscriptions.size

    return { ...this.statistics }
  }

  /**
   * 获取事件历史
   */
  getEventHistory(limit = 100): EventHistory[] {
    return Array.from(this.eventHistory.values())
      .sort((a, b) => b.event.timestamp - a.event.timestamp)
      .slice(0, limit)
  }

  /**
   * 根据条件查询事件历史
   */
  queryEventHistory(query: {
    eventType?: string
    level?: EventLevel
    priority?: EventPriority
    status?: EventStatus
    timeRange?: { start: number; end: number }
    correlationId?: string
  }): EventHistory[] {
    return Array.from(this.eventHistory.values()).filter(history => {
      const event = history.event

      if (query.eventType && event.type !== query.eventType) return false
      if (query.level && event.level !== query.level) return false
      if (query.priority && event.priority !== query.priority) return false
      if (query.status && event.status !== query.status) return false
      if (query.correlationId && event.metadata.correlationId !== query.correlationId) return false

      if (query.timeRange) {
        if (event.timestamp < query.timeRange.start || event.timestamp > query.timeRange.end) {
          return false
        }
      }

      return true
    }).sort((a, b) => b.event.timestamp - a.event.timestamp)
  }

  /**
   * 获取队列状态
   */
  getQueueStatus(): Record<EventPriority, number> {
    const status: Record<EventPriority, number> = {} as any

    for (const priority of Object.values(EventPriority)) {
      if (typeof priority === 'number') {
        status[priority] = this.eventQueue.get(priority)?.length || 0
      }
    }

    return status
  }

  /**
   * 获取处理器列表
   */
  getHandlers(): EventHandler[] {
    return Array.from(this.handlers.values())
  }

  /**
   * 获取订阅关系
   */
  getSubscriptions(): Record<string, string[]> {
    const result: Record<string, string[]> = {}

    for (const [eventType, handlerIds] of this.subscriptions) {
      result[eventType] = Array.from(handlerIds)
    }

    return result
  }

  // ========== 🔧 高级功能方法 ==========

  /**
   * 批量发布事件
   */
  async publishBatch(events: Array<{
    eventType: string
    data: any
    options?: PublishOptions
  }>): Promise<string[]> {
    const eventIds: string[] = []

    for (const eventInfo of events) {
      const eventId = await this.publish(
        eventInfo.eventType,
        eventInfo.data,
        eventInfo.options
      )
      eventIds.push(eventId)
    }

    return eventIds
  }

  /**
   * 等待事件处理完成
   */
  async waitForEvent(eventId: string, timeout = 30000): Promise<EventHistory | null> {
    return new Promise((resolve) => {
      const checkResult = () => {
        const history = this.eventHistory.get(eventId)
        if (history && history.event.status !== EventStatus.PENDING && history.event.status !== EventStatus.PROCESSING) {
          resolve(history)
          return
        }

        setTimeout(checkResult, 100)
      }

      setTimeout(() => resolve(null), timeout)
      checkResult()
    })
  }

  /**
   * 重播事件
   */
  async replayEvent(eventId: string): Promise<boolean> {
    const history = this.eventHistory.get(eventId)
    if (!history) {
      console.error(`事件历史不存在: ${eventId}`)
      return false
    }

    const originalEvent = history.event
    const replayEvent: EnhancedEvent = {
      ...originalEvent,
      id: this.generateEventId(),
      status: EventStatus.PENDING,
      timestamp: Date.now(),
      retryCount: 0,
      result: undefined,
      metadata: {
        ...originalEvent.metadata,
        parentEventId: originalEvent.id
      }
    }

    await this.enqueueEvent(replayEvent)
    return true
  }

  /**
   * 暂停事件处理
   */
  pause(): void {
    this.isProcessing = false
    if (this.processingTimer) {
      clearInterval(this.processingTimer)
      this.processingTimer = undefined
    }
    this.emit('systemPaused')
  }

  /**
   * 恢复事件处理
   */
  resume(): void {
    this.isProcessing = true
    this.startProcessing()
    this.emit('systemResumed')
  }

  /**
   * 清理过期事件和历史
   */
  cleanup(): void {
    const now = Date.now()
    let cleanedEvents = 0
    let cleanedHistory = 0

    // 清理过期的调度事件
    for (const [eventId, timer] of this.scheduledEvents) {
      const event = this.eventHistory.get(eventId)?.event
      if (event && event.expiresAt && event.expiresAt < now) {
        clearTimeout(timer)
        this.scheduledEvents.delete(eventId)
        cleanedEvents++
      }
    }

    // 清理过期的事件历史
    if (this.eventHistory.size > this.MAX_HISTORY_SIZE) {
      const histories = Array.from(this.eventHistory.entries())
        .sort(([, a], [, b]) => b.event.timestamp - a.event.timestamp)

      const toDelete = histories.slice(this.MAX_HISTORY_SIZE)
      for (const [eventId] of toDelete) {
        this.eventHistory.delete(eventId)
        cleanedHistory++
      }
    }

    if (cleanedEvents > 0 || cleanedHistory > 0) {
    }
  }

  /**
   * 销毁事件系统
   */
  destroy(): void {
    this.pause()

    // 清理定时器
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
    }
    if (this.throughputTimer) {
      clearInterval(this.throughputTimer)
    }

    // 清理调度事件
    for (const timer of this.scheduledEvents.values()) {
      clearTimeout(timer)
    }

    // 清理所有数据
    this.handlers.clear()
    this.subscriptions.clear()
    this.eventQueue.clear()
    this.processingQueue.clear()
    this.eventHistory.clear()
    this.scheduledEvents.clear()

    this.emit('systemDestroyed')
  }

  // ========== 🔧 私有方法 ==========

  /**
   * 初始化事件系统
   */
  private initializeEventSystem(): void {
    // 初始化队列
    for (const priority of Object.values(EventPriority)) {
      if (typeof priority === 'number') {
        this.eventQueue.set(priority, [])
      }
    }

    // 初始化统计
    for (const level of Object.values(EventLevel)) {
      this.statistics.eventsByLevel[level] = 0
    }

    for (const priority of Object.values(EventPriority)) {
      if (typeof priority === 'number') {
        this.statistics.eventsByPriority[priority] = 0
      }
    }

    for (const status of Object.values(EventStatus)) {
      this.statistics.eventsByStatus[status] = 0
    }

    // 启动处理循环
    this.startProcessing()

    // 启动清理任务
    this.cleanupTimer = setInterval(() => {
      this.cleanup()
    }, this.CLEANUP_INTERVAL)

    // 启动吞吐量统计
    this.throughputTimer = setInterval(() => {
      this.calculateThroughput()
    }, 1000)
  }

  /**
   * 启动事件处理
   */
  private startProcessing(): void {
    if (this.processingTimer) {
      return
    }

    this.isProcessing = true
    this.processingTimer = setInterval(async () => {
      if (this.isProcessing) {
        await this.processEvents()
      }
    }, 10) // 10ms 间隔处理事件
  }

  /**
   * 处理事件队列
   */
  private async processEvents(): Promise<void> {
    if (!this.isProcessing) {
      return
    }

    // 按优先级处理事件
    for (const priority of [
      EventPriority.CRITICAL,
      EventPriority.HIGH,
      EventPriority.NORMAL,
      EventPriority.LOW,
      EventPriority.BACKGROUND
    ]) {
      const queue = this.eventQueue.get(priority)
      if (queue && queue.length > 0) {
        const event = queue.shift()!
        await this.processEvent(event)
        break // 一次只处理一个事件，保证响应性
      }
    }
  }

  /**
   * 处理单个事件
   */
  private async processEvent(event: EnhancedEvent): Promise<void> {
    if (this.processingQueue.has(event.id)) {
      return // 避免重复处理
    }

    this.processingQueue.add(event.id)
    event.status = EventStatus.PROCESSING
    event.processedAt = Date.now()

    const startTime = Date.now()
    const context: EventContext = {
      eventSystem: this,
      correlationId: event.metadata.correlationId || this.generateCorrelationId(),
      executionChain: [],
      metadata: {},
      startTime
    }

    const history: EventHistory = {
      event,
      handlers: [],
      totalDuration: 0,
      success: true
    }

    try {
      // 获取匹配的处理器
      const matchedHandlers = this.getMatchedHandlers(event)

      if (matchedHandlers.length === 0) {
        console.warn(`没有找到匹配的事件处理器: ${event.type}`)
        event.status = EventStatus.COMPLETED
        history.success = false
        return
      }

      // 按优先级排序处理器
      matchedHandlers.sort((a, b) => a.priority - b.priority)

      // 执行处理器
      for (const handler of matchedHandlers) {
        const handlerStartTime = Date.now()
        const handlerRecord = {
          handlerId: handler.id,
          startTime: handlerStartTime,
          endTime: undefined as number | undefined,
          result: undefined as any,
          error: undefined as string | undefined
        }

        try {
          // 检查执行条件
          if (!this.checkConditions(event, handler.conditions || [])) {
            continue
          }

          context.executionChain.push(handler.id)

          // 应用中间件
          let result = await this.applyMiddleware(event, context, handler, async () => {
            return await handler.handler(event, context)
          })

          handlerRecord.result = result
          handlerRecord.endTime = Date.now()

          // 处理一次性订阅
          if (handler.options?.once) {
            this.unsubscribe(handler.id)
          }

        } catch (error) {
          handlerRecord.error = error instanceof Error ? error.message : String(error)
          handlerRecord.endTime = Date.now()
          history.success = false

          console.error(`事件处理器执行失败 [${handler.id}]:`, error)

          // 错误处理策略
          if (event.retryCount < event.maxRetries) {
            event.retryCount++
            event.status = EventStatus.PENDING
            await this.enqueueEvent(event) // 重新入队
            return
          }
        }

        history.handlers.push(handlerRecord)
      }

      event.status = history.success ? EventStatus.COMPLETED : EventStatus.FAILED

    } catch (error) {
      event.status = EventStatus.FAILED
      history.success = false
      console.error(`事件处理失败 [${event.id}]:`, error)

    } finally {
      const endTime = Date.now()
      event.completedAt = endTime
      history.totalDuration = endTime - startTime

      // 更新事件结果
      event.result = {
        success: history.success,
        duration: history.totalDuration,
        handlerCount: history.handlers.length
      }

      // 保存历史记录
      this.eventHistory.set(event.id, history)

      // 清理处理队列
      this.processingQueue.delete(event.id)

      // 更新统计
      this.updateStatistics('process', event)

      // 发送事件完成通知
      this.emit('eventProcessed', event, history)
    }
  }

  /**
   * 获取匹配的处理器
   */
  private getMatchedHandlers(event: EnhancedEvent): EventHandler[] {
    const handlers: EventHandler[] = []
    const handlerIds = this.subscriptions.get(event.type)

    if (handlerIds) {
      for (const handlerId of handlerIds) {
        const handler = this.handlers.get(handlerId)
        if (handler) {
          handlers.push(handler)
        }
      }
    }

    return handlers
  }

  /**
   * 检查执行条件
   */
  private checkConditions(event: EnhancedEvent, conditions: EventCondition[]): boolean {
    if (conditions.length === 0) {
      return true
    }

    for (const condition of conditions) {
      const value = this.getValueByPath(event, condition.field)
      const result = this.evaluateCondition(value, condition.operator, condition.value)

      // 简单的逻辑处理，实际项目中应该支持更复杂的逻辑表达式
      if (!result) {
        return false
      }
    }

    return true
  }

  /**
   * 评估条件
   */
  private evaluateCondition(actual: any, operator: string, expected: any): boolean {
    switch (operator) {
      case 'eq': return actual === expected
      case 'ne': return actual !== expected
      case 'gt': return actual > expected
      case 'lt': return actual < expected
      case 'gte': return actual >= expected
      case 'lte': return actual <= expected
      case 'in': return Array.isArray(expected) && expected.includes(actual)
      case 'contains': return typeof actual === 'string' && actual.includes(expected)
      case 'matches': return new RegExp(expected).test(String(actual))
      default: return false
    }
  }

  /**
   * 根据路径获取值
   */
  private getValueByPath(obj: any, path: string): any {
    const parts = path.split('.')
    let current = obj

    for (const part of parts) {
      if (current === null || current === undefined) {
        return undefined
      }
      current = current[part]
    }

    return current
  }

  /**
   * 应用中间件
   */
  private async applyMiddleware(
    event: EnhancedEvent,
    context: EventContext,
    handler: EventHandler,
    next: () => Promise<any>
  ): Promise<any> {
    const middleware = handler.middleware || []

    if (middleware.length === 0) {
      return await next()
    }

    // 按优先级排序中间件
    middleware.sort((a, b) => (b.priority || 0) - (a.priority || 0))

    let index = 0

    const executeNext = async (): Promise<any> => {
      if (index >= middleware.length) {
        return await next()
      }

      const currentMiddleware = middleware[index++]
      return await currentMiddleware.execute(event, context, executeNext)
    }

    return await executeNext()
  }

  /**
   * 入队事件
   */
  private async enqueueEvent(event: EnhancedEvent): Promise<void> {
    const queue = this.eventQueue.get(event.priority)
    if (!queue) {
      throw new Error(`无效的事件优先级: ${event.priority}`)
    }

    // 检查队列大小
    if (this.getTotalQueueSize() >= this.MAX_QUEUE_SIZE) {
      console.warn('事件队列已满，丢弃最旧的低优先级事件')
      this.dropOldestLowPriorityEvent()
    }

    queue.push(event)
    this.emit('eventEnqueued', event)
  }

  /**
   * 调度事件
   */
  private scheduleEvent(event: EnhancedEvent): void {
    if (!event.scheduledAt || !event.delay) {
      return
    }

    const timer = setTimeout(async () => {
      this.scheduledEvents.delete(event.id)
      await this.enqueueEvent(event)
    }, event.delay)

    this.scheduledEvents.set(event.id, timer)
    this.emit('eventScheduled', event)
  }

  /**
   * 获取总队列大小
   */
  private getTotalQueueSize(): number {
    return Array.from(this.eventQueue.values()).reduce((total, queue) => total + queue.length, 0)
  }

  /**
   * 丢弃最旧的低优先级事件
   */
  private dropOldestLowPriorityEvent(): void {
    // 从低优先级队列开始查找
    for (const priority of [EventPriority.BACKGROUND, EventPriority.LOW, EventPriority.NORMAL]) {
      const queue = this.eventQueue.get(priority)
      if (queue && queue.length > 0) {
        const droppedEvent = queue.shift()!
        droppedEvent.status = EventStatus.CANCELLED
        this.emit('eventDropped', droppedEvent)
        return
      }
    }
  }

  /**
   * 确定事件级别
   */
  private determineEventLevel(eventType: string): EventLevel {
    if (eventType.startsWith('system.')) return EventLevel.SYSTEM
    if (eventType.startsWith('app.')) return EventLevel.APPLICATION
    if (eventType.startsWith('component.')) return EventLevel.COMPONENT
    if (eventType.startsWith('interaction.')) return EventLevel.INTERACTION
    if (eventType.startsWith('data.')) return EventLevel.DATA
    if (eventType.startsWith('validation.')) return EventLevel.VALIDATION
    if (eventType.startsWith('lifecycle.')) return EventLevel.LIFECYCLE

    return EventLevel.APPLICATION // 默认级别
  }

  /**
   * 更新统计信息
   */
  private updateStatistics(operation: string, event?: EnhancedEvent): void {
    switch (operation) {
      case 'publish':
        if (event) {
          this.statistics.totalEvents++
          this.statistics.eventsByLevel[event.level] = (this.statistics.eventsByLevel[event.level] || 0) + 1
          this.statistics.eventsByPriority[event.priority] = (this.statistics.eventsByPriority[event.priority] || 0) + 1
          this.statistics.eventsByStatus[event.status] = (this.statistics.eventsByStatus[event.status] || 0) + 1
        }
        break
      case 'process':
        if (event && event.result) {
          const duration = event.result.duration || 0
          this.statistics.averageProcessingTime = (this.statistics.averageProcessingTime + duration) / 2

          if (!event.result.success) {
            this.statistics.errorRate = (this.statistics.errorRate + 1) / this.statistics.totalEvents
          }

          // 更新状态统计
          this.statistics.eventsByStatus[event.status] = (this.statistics.eventsByStatus[event.status] || 0) + 1
        }
        break
      case 'subscribe':
        this.statistics.handlerCount = this.handlers.size
        this.statistics.activeSubscriptions = this.subscriptions.size
        break
      case 'unsubscribe':
        this.statistics.handlerCount = this.handlers.size
        this.statistics.activeSubscriptions = this.subscriptions.size
        break
    }
  }

  /**
   * 计算吞吐量
   */
  private calculateThroughput(): void {
    // 简单的吞吐量计算，实际项目中应该使用更精确的算法
    const recentEvents = Array.from(this.eventHistory.values())
      .filter(history => Date.now() - history.event.timestamp < 1000)

    this.statistics.throughput = recentEvents.length
  }

  /**
   * 生成事件ID
   */
  private generateEventId(): string {
    return `event_${Date.now()}_${Math.random().toString(36).slice(2)}`
  }

  /**
   * 生成处理器ID
   */
  private generateHandlerId(): string {
    return `handler_${Date.now()}_${Math.random().toString(36).slice(2)}`
  }

  /**
   * 生成关联ID
   */
  private generateCorrelationId(): string {
    return `corr_${Date.now()}_${Math.random().toString(36).slice(2)}`
  }
}

// ========== 🚀 全局实例和工具函数 ==========

/**
 * 创建标准事件类型常量
 */
export const StandardEvents = {
  // 系统事件
  SYSTEM_START: 'system.start',
  SYSTEM_STOP: 'system.stop',
  SYSTEM_ERROR: 'system.error',

  // 配置事件
  CONFIG_CREATED: 'config.created',
  CONFIG_UPDATED: 'config.updated',
  CONFIG_DELETED: 'config.deleted',
  CONFIG_VALIDATED: 'config.validated',

  // 组件事件
  COMPONENT_MOUNTED: 'component.mounted',
  COMPONENT_UNMOUNTED: 'component.unmounted',
  COMPONENT_UPDATED: 'component.updated',

  // 数据事件
  DATA_LOADED: 'data.loaded',
  DATA_UPDATED: 'data.updated',
  DATA_ERROR: 'data.error',

  // 交互事件
  USER_CLICK: 'interaction.click',
  USER_DRAG: 'interaction.drag',
  USER_INPUT: 'interaction.input'
} as const

/**
 * 创建便捷的事件发布函数
 */
export function createEventPublisher(eventSystem: EnhancedEventSystem) {
  return {
    publishConfigEvent: (type: string, componentId: string, data: any, options?: PublishOptions) => {
      return eventSystem.publish(`config.${type}`, { componentId, ...data }, options)
    },

    publishSystemEvent: (type: string, data: any, options?: PublishOptions) => {
      return eventSystem.publish(`system.${type}`, data, { ...options, priority: EventPriority.CRITICAL })
    },

    publishInteractionEvent: (type: string, target: string, data: any, options?: PublishOptions) => {
      return eventSystem.publish(`interaction.${type}`, { target, ...data }, options)
    }
  }
}

// 全局实例
export const enhancedEventSystem = new EnhancedEventSystem()

