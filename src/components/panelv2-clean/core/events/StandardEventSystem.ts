/**
 * @file 标准化事件系统 - Phase 2 核心组件
 * @description 建立统一的事件类型系统、事件协议标准化、事件总线增强
 * 
 * 🎯 核心职责：
 * 1. 事件类型标准化 - 定义统一的事件分类和命名规范
 * 2. 事件协议规范 - 建立事件数据结构和传输协议
 * 3. 事件路由系统 - 支持条件订阅、事件过滤、优先级处理
 * 4. 事件持久化 - 支持事件回放、审计日志、调试追踪
 * 5. 性能优化 - 事件防抖、批量处理、内存管理
 * 
 * 💡 给技术门外汉的解释：
 * 这就像建立一个"智能通讯网络"，让系统的各个部分能够：
 * - 用统一的"语言"交流（标准化协议）
 * - 按重要程度排队说话（优先级系统）
 * - 只听感兴趣的消息（事件过滤）
 * - 记录所有对话历史（事件持久化）
 * - 避免同时说话造成混乱（防抖处理）
 */

import { reactive, ref, computed } from 'vue'
import { nanoid } from 'nanoid'

// ==================== 📋 事件类型标准化 ====================

/**
 * 标准事件类别枚举
 * 💡 简单理解：这是"消息分类标签"，把不同类型的消息分门别类
 */
export enum EventCategory {
  /** 系统级事件 - 系统启动、关闭、错误等 */
  SYSTEM = 'system',
  /** 用户交互事件 - 点击、拖拽、输入等 */
  USER = 'user',
  /** 数据变更事件 - 数据增删改查 */
  DATA = 'data',
  /** UI更新事件 - 界面渲染、布局变化等 */
  UI = 'ui',
  /** 网络事件 - 请求、响应、连接状态等 */
  NETWORK = 'network',
  /** 业务逻辑事件 - 工作流、业务规则等 */
  BUSINESS = 'business',
  /** 性能监控事件 - 性能指标、资源使用等 */
  PERFORMANCE = 'performance',
  /** 安全事件 - 认证、授权、审计等 */
  SECURITY = 'security'
}

/**
 * 事件优先级枚举
 * 💡 简单理解：这是"消息紧急程度"，紧急的消息优先处理
 */
export enum EventPriority {
  /** 低优先级 - 统计、日志等 */
  LOW = 0,
  /** 普通优先级 - 常规业务事件 */
  NORMAL = 1,
  /** 高优先级 - 用户交互、重要业务 */
  HIGH = 2,
  /** 紧急优先级 - 错误、安全事件 */
  URGENT = 3,
  /** 关键优先级 - 系统核心事件 */
  CRITICAL = 4
}

/**
 * 事件状态枚举
 * 💡 简单理解：这是"消息处理状态"，追踪消息处理进度
 */
export enum EventStatus {
  /** 待处理 */
  PENDING = 'pending',
  /** 处理中 */
  PROCESSING = 'processing',
  /** 已完成 */
  COMPLETED = 'completed',
  /** 已失败 */
  FAILED = 'failed',
  /** 已取消 */
  CANCELLED = 'cancelled',
  /** 已超时 */
  TIMEOUT = 'timeout'
}

// ==================== 📦 标准事件数据结构 ====================

/**
 * 标准事件接口
 * 💡 简单理解：这是"标准消息格式"，所有消息都按这个格式发送
 */
export interface StandardEvent<T = any> {
  /** 事件唯一标识 */
  id: string
  
  /** 事件类型（格式：category.action.target） */
  type: string
  
  /** 事件类别 */
  category: EventCategory
  
  /** 事件优先级 */
  priority: EventPriority
  
  /** 事件状态 */
  status: EventStatus
  
  /** 事件数据载荷 */
  payload: T
  
  /** 事件元数据 */
  metadata: EventMetadata
  
  /** 创建时间戳 */
  timestamp: number
  
  /** 过期时间（可选） */
  expiresAt?: number
  
  /** 重试配置（可选） */
  retryConfig?: EventRetryConfig
}

/**
 * 事件元数据
 * 💡 简单理解：这是"消息附加信息"，记录消息的来源、去向等
 */
export interface EventMetadata {
  /** 事件来源 */
  source: string
  
  /** 事件目标（可选） */
  target?: string
  
  /** 用户ID（可选） */
  userId?: string
  
  /** 会话ID（可选） */
  sessionId?: string
  
  /** 请求ID（可选，用于链路追踪） */
  requestId?: string
  
  /** 父事件ID（可选，用于事件链） */
  parentEventId?: string
  
  /** 事件标签 */
  tags?: string[]
  
  /** 自定义属性 */
  custom?: Record<string, any>
}

/**
 * 事件重试配置
 * 💡 简单理解：这是"消息重发规则"，失败时怎么重试
 */
export interface EventRetryConfig {
  /** 最大重试次数 */
  maxRetries: number
  
  /** 重试间隔（毫秒） */
  retryDelay: number
  
  /** 是否使用指数退避 */
  exponentialBackoff: boolean
  
  /** 退避倍数 */
  backoffMultiplier?: number
  
  /** 最大重试间隔 */
  maxRetryDelay?: number
}

// ==================== 🎯 事件订阅和过滤 ====================

/**
 * 事件订阅配置
 * 💡 简单理解：这是"消息订阅设置"，告诉系统我要听哪些消息
 */
export interface EventSubscription {
  /** 订阅ID */
  id: string
  
  /** 订阅者名称 */
  subscriberName: string
  
  /** 事件类型模式（支持通配符） */
  eventPattern: string
  
  /** 事件过滤器 */
  filters?: EventFilter[]
  
  /** 优先级过滤 */
  minPriority?: EventPriority
  
  /** 是否启用 */
  enabled: boolean
  
  /** 事件处理器 */
  handler: EventHandler<any>
  
  /** 创建时间 */
  createdAt: number
  
  /** 最后活跃时间 */
  lastActiveAt: number
  
  /** 处理统计 */
  stats: SubscriptionStats
}

/**
 * 事件过滤器
 * 💡 简单理解：这是"消息筛选器"，只让符合条件的消息通过
 */
export interface EventFilter {
  /** 过滤器名称 */
  name: string
  
  /** 过滤字段路径 */
  field: string
  
  /** 过滤操作符 */
  operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'regex' | 'gt' | 'lt' | 'in'
  
  /** 过滤值 */
  value: any
  
  /** 是否取反 */
  negate?: boolean
}

/**
 * 事件处理器
 * 💡 简单理解：这是"消息处理函数"，定义收到消息后怎么办
 */
export type EventHandler<T = any> = (event: StandardEvent<T>) => Promise<void> | void

/**
 * 订阅统计信息
 * 💡 简单理解：这是"消息处理记录"，统计处理了多少消息
 */
export interface SubscriptionStats {
  /** 总接收数 */
  totalReceived: number
  
  /** 成功处理数 */
  successCount: number
  
  /** 失败处理数 */
  errorCount: number
  
  /** 平均处理时间 */
  avgProcessingTime: number
  
  /** 最后处理时间 */
  lastProcessedAt: number
}

// ==================== 📊 事件存储和查询 ====================

/**
 * 事件存储查询条件
 * 💡 简单理解：这是"消息查找条件"，用来搜索历史消息
 */
export interface EventQuery {
  /** 事件类型模式 */
  typePattern?: string
  
  /** 事件类别 */
  category?: EventCategory
  
  /** 优先级范围 */
  priorityRange?: [EventPriority, EventPriority]
  
  /** 时间范围 */
  timeRange?: [number, number]
  
  /** 来源过滤 */
  source?: string
  
  /** 状态过滤 */
  status?: EventStatus[]
  
  /** 标签过滤 */
  tags?: string[]
  
  /** 分页参数 */
  pagination?: {
    offset: number
    limit: number
  }
  
  /** 排序参数 */
  sort?: {
    field: keyof StandardEvent
    order: 'asc' | 'desc'
  }
}

/**
 * 事件存储结果
 */
export interface EventQueryResult {
  /** 事件列表 */
  events: StandardEvent[]
  
  /** 总数量 */
  total: number
  
  /** 查询耗时 */
  queryTime: number
  
  /** 分页信息 */
  pagination: {
    offset: number
    limit: number
    hasMore: boolean
  }
}

// ==================== 🚀 标准化事件总线实现 ====================

/**
 * 标准化事件总线
 * 
 * 🎯 设计目标：
 * - 高性能：支持大量事件和订阅者
 * - 高可靠：事件持久化和错误恢复
 * - 高扩展：插件化架构和自定义处理器
 * - 高可观测：详细的监控和调试信息
 */
export class StandardEventBus {
  // ==================== 📦 存储系统 ====================
  
  /** 事件订阅注册表 */
  private subscriptions = new Map<string, EventSubscription>()
  
  /** 事件存储（内存中的环形缓冲区） */
  private eventStorage: StandardEvent[] = []
  
  /** 事件存储配置 */
  private storageConfig = reactive({
    maxEvents: 10000,
    persistEvents: true,
    autoCleanup: true,
    cleanupInterval: 300000 // 5分钟
  })
  
  // ==================== ⚡ 处理队列系统 ====================
  
  /** 事件处理队列（按优先级分组） */
  private eventQueues = new Map<EventPriority, StandardEvent[]>()
  
  /** 处理器状态 */
  private processingState = reactive({
    isProcessing: false,
    queueSizes: {} as Record<EventPriority, number>,
    processedCount: 0,
    errorCount: 0
  })
  
  /** 批量处理配置 */
  private batchConfig = reactive({
    enabled: true,
    batchSize: 50,
    flushInterval: 100, // 100ms
    maxWaitTime: 1000   // 1秒
  })
  
  // ==================== 🎛️ 防抖和限流 ====================
  
  /** 防抖配置 */
  private debounceConfig = reactive({
    enabled: true,
    defaultDelay: 100,
    perEventTypeDelay: new Map<string, number>()
  })
  
  /** 防抖定时器 */
  private debounceTimers = new Map<string, any>()
  
  /** 限流配置 */
  private throttleConfig = reactive({
    enabled: true,
    maxEventsPerSecond: 1000,
    windowSize: 1000 // 1秒窗口
  })
  
  /** 限流计数器 */
  private throttleCounters = new Map<string, { count: number; windowStart: number }>()
  
  // ==================== 📊 监控和统计 ====================
  
  /** 总线统计信息 */
  private busStats = reactive({
    totalEvents: 0,
    eventsPerSecond: 0,
    totalSubscriptions: 0,
    activeSubscriptions: 0,
    avgProcessingTime: 0,
    errorRate: 0,
    memoryUsage: 0,
    uptime: Date.now()
  })
  
  /** 性能指标历史 */
  private performanceHistory: Array<{
    timestamp: number
    eventsPerSecond: number
    avgLatency: number
    errorRate: number
  }> = []
  
  // ==================== ⏱️ 定时器管理 ====================
  
  private metricsTimer: any = null
  private cleanupTimer: any = null
  private processingTimer: any = null
  
  constructor() {
    console.log('🚀 StandardEventBus: 启动标准化事件总线')
    
    // 初始化优先级队列
    this.initializeQueues()
    
    // 启动处理器
    this.startEventProcessor()
    
    // 启动监控
    this.startMetricsCollection()
    
    // 启动清理器
    this.startStorageCleanup()
    
    console.log('✅ StandardEventBus: 初始化完成')
  }

  // ==================== 📡 事件发布接口 ====================

  /**
   * 发布标准事件
   * 💡 简单理解：这是"发送消息"，把消息投递到通讯网络
   */
  emit<T = any>(eventType: string, payload: T, options?: Partial<StandardEvent<T>>): string {
    try {
      // 解析事件类型
      const category = this.parseEventCategory(eventType)
      
      // 创建标准事件
      const event: StandardEvent<T> = {
        id: nanoid(),
        type: eventType,
        category,
        priority: options?.priority || EventPriority.NORMAL,
        status: EventStatus.PENDING,
        payload,
        metadata: {
          source: options?.metadata?.source || 'unknown',
          timestamp: Date.now(),
          ...options?.metadata
        },
        timestamp: Date.now(),
        ...options
      }
      
      // 应用限流
      if (this.shouldThrottle(eventType)) {
        console.warn(`⚠️ 事件 ${eventType} 被限流`)
        return event.id
      }
      
      // 应用防抖
      if (this.shouldDebounce(eventType)) {
        this.debounceEvent(event)
        return event.id
      }
      
      // 直接处理事件
      this.processEvent(event)
      
      console.log(`📡 事件已发布: ${eventType} [${event.id}]`)
      
      return event.id
      
    } catch (error) {
      console.error(`❌ 发布事件 ${eventType} 失败:`, error)
      this.busStats.errorRate++
      throw error
    }
  }

  /**
   * 发布系统事件（便捷方法）
   */
  emitSystem(action: string, payload: any): string {
    return this.emit(`system.${action}`, payload, {
      category: EventCategory.SYSTEM,
      priority: EventPriority.HIGH
    })
  }

  /**
   * 发布用户事件（便捷方法）
   */
  emitUser(action: string, payload: any, userId?: string): string {
    return this.emit(`user.${action}`, payload, {
      category: EventCategory.USER,
      priority: EventPriority.NORMAL,
      metadata: {
        source: 'user-interface',
        userId
      }
    })
  }

  /**
   * 发布数据事件（便捷方法）
   */
  emitData(action: string, payload: any): string {
    return this.emit(`data.${action}`, payload, {
      category: EventCategory.DATA,
      priority: EventPriority.HIGH
    })
  }

  /**
   * 批量发布事件
   * 💡 简单理解：这是"批量发送消息"，一次发送多条消息，更高效
   */
  emitBatch(events: Array<{ type: string; payload: any; options?: any }>): string[] {
    const eventIds: string[] = []
    
    try {
      console.log(`📦 批量发布 ${events.length} 个事件`)
      
      for (const { type, payload, options } of events) {
        const eventId = this.emit(type, payload, options)
        eventIds.push(eventId)
      }
      
      console.log(`✅ 批量发布完成，事件ID: ${eventIds.join(', ')}`)
      
      return eventIds
      
    } catch (error) {
      console.error('❌ 批量发布事件失败:', error)
      throw error
    }
  }

  // ==================== 👂 事件订阅接口 ====================

  /**
   * 订阅事件
   * 💡 简单理解：这是"订阅消息"，告诉系统我要接收某类消息
   */
  on<T = any>(
    eventPattern: string, 
    handler: EventHandler<T>, 
    options?: {
      subscriberName?: string
      filters?: EventFilter[]
      minPriority?: EventPriority
    }
  ): string {
    const subscriptionId = nanoid()
    
    try {
      const subscription: EventSubscription = {
        id: subscriptionId,
        subscriberName: options?.subscriberName || `subscriber-${subscriptionId.slice(0, 8)}`,
        eventPattern,
        filters: options?.filters,
        minPriority: options?.minPriority,
        enabled: true,
        handler,
        createdAt: Date.now(),
        lastActiveAt: Date.now(),
        stats: {
          totalReceived: 0,
          successCount: 0,
          errorCount: 0,
          avgProcessingTime: 0,
          lastProcessedAt: 0
        }
      }
      
      this.subscriptions.set(subscriptionId, subscription)
      this.busStats.totalSubscriptions++
      this.busStats.activeSubscriptions++
      
      console.log(`👂 事件订阅成功: ${eventPattern} [${subscriptionId}]`)
      
      return subscriptionId
      
    } catch (error) {
      console.error(`❌ 订阅事件 ${eventPattern} 失败:`, error)
      throw error
    }
  }

  /**
   * 一次性事件订阅
   * 💡 简单理解：这是"临时订阅"，只接收一次消息就自动取消
   */
  once<T = any>(eventPattern: string, handler: EventHandler<T>): string {
    const originalHandler = handler
    
    const onceHandler: EventHandler<T> = async (event) => {
      try {
        await originalHandler(event)
      } finally {
        // 处理完成后自动取消订阅
        this.off(subscriptionId)
      }
    }
    
    const subscriptionId = this.on(eventPattern, onceHandler, {
      subscriberName: `once-${eventPattern}`
    })
    
    return subscriptionId
  }

  /**
   * 取消事件订阅
   * 💡 简单理解：这是"取消订阅"，不再接收某类消息
   */
  off(subscriptionId: string): boolean {
    try {
      const subscription = this.subscriptions.get(subscriptionId)
      if (!subscription) {
        console.warn(`⚠️ 订阅 ${subscriptionId} 不存在`)
        return false
      }
      
      this.subscriptions.delete(subscriptionId)
      this.busStats.totalSubscriptions--
      if (subscription.enabled) {
        this.busStats.activeSubscriptions--
      }
      
      console.log(`🗑️ 已取消订阅: ${subscription.eventPattern} [${subscriptionId}]`)
      
      return true
      
    } catch (error) {
      console.error(`❌ 取消订阅 ${subscriptionId} 失败:`, error)
      return false
    }
  }

  /**
   * 暂停/恢复订阅
   */
  toggleSubscription(subscriptionId: string, enabled: boolean): boolean {
    const subscription = this.subscriptions.get(subscriptionId)
    if (!subscription) {
      return false
    }
    
    const wasEnabled = subscription.enabled
    subscription.enabled = enabled
    
    if (wasEnabled !== enabled) {
      this.busStats.activeSubscriptions += enabled ? 1 : -1
    }
    
    console.log(`🔄 订阅 ${subscriptionId} ${enabled ? '已启用' : '已禁用'}`)
    
    return true
  }

  // ==================== 🔍 事件查询接口 ====================

  /**
   * 查询事件历史
   * 💡 简单理解：这是"搜索历史消息"，找到符合条件的历史消息
   */
  query(conditions: EventQuery): EventQueryResult {
    const startTime = Date.now()
    
    try {
      console.log('🔍 查询事件历史:', conditions)
      
      let events = [...this.eventStorage]
      
      // 应用过滤条件
      if (conditions.typePattern) {
        const pattern = this.createRegexFromPattern(conditions.typePattern)
        events = events.filter(event => pattern.test(event.type))
      }
      
      if (conditions.category) {
        events = events.filter(event => event.category === conditions.category)
      }
      
      if (conditions.priorityRange) {
        const [minPri, maxPri] = conditions.priorityRange
        events = events.filter(event => event.priority >= minPri && event.priority <= maxPri)
      }
      
      if (conditions.timeRange) {
        const [startTime, endTime] = conditions.timeRange
        events = events.filter(event => event.timestamp >= startTime && event.timestamp <= endTime)
      }
      
      if (conditions.source) {
        events = events.filter(event => event.metadata.source === conditions.source)
      }
      
      if (conditions.status) {
        events = events.filter(event => conditions.status!.includes(event.status))
      }
      
      if (conditions.tags && conditions.tags.length > 0) {
        events = events.filter(event => 
          event.metadata.tags && 
          conditions.tags!.some(tag => event.metadata.tags!.includes(tag))
        )
      }
      
      // 排序
      if (conditions.sort) {
        const { field, order } = conditions.sort
        events.sort((a, b) => {
          const aVal = a[field]
          const bVal = b[field]
          const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0
          return order === 'desc' ? -comparison : comparison
        })
      } else {
        // 默认按时间戳降序
        events.sort((a, b) => b.timestamp - a.timestamp)
      }
      
      // 分页
      const total = events.length
      if (conditions.pagination) {
        const { offset, limit } = conditions.pagination
        events = events.slice(offset, offset + limit)
      }
      
      const queryTime = Date.now() - startTime
      
      console.log(`✅ 查询完成，找到 ${events.length}/${total} 个事件，耗时 ${queryTime}ms`)
      
      return {
        events,
        total,
        queryTime,
        pagination: {
          offset: conditions.pagination?.offset || 0,
          limit: conditions.pagination?.limit || total,
          hasMore: conditions.pagination ? 
            (conditions.pagination.offset + conditions.pagination.limit) < total : false
        }
      }
      
    } catch (error) {
      console.error('❌ 查询事件历史失败:', error)
      throw error
    }
  }

  /**
   * 获取事件详情
   */
  getEvent(eventId: string): StandardEvent | null {
    return this.eventStorage.find(event => event.id === eventId) || null
  }

  /**
   * 获取最近事件
   */
  getRecentEvents(count = 100): StandardEvent[] {
    return this.eventStorage
      .slice(-count)
      .sort((a, b) => b.timestamp - a.timestamp)
  }

  // ==================== 📊 监控和统计接口 ====================

  /**
   * 获取总线统计信息
   * 💡 简单理解：这是"查看通讯网络状态"，了解系统运行情况
   */
  getStats() {
    return {
      ...this.busStats,
      queueSizes: { ...this.processingState.queueSizes },
      storageUsage: {
        eventCount: this.eventStorage.length,
        maxEvents: this.storageConfig.maxEvents,
        memoryUsageKB: Math.round(JSON.stringify(this.eventStorage).length / 1024)
      },
      subscriptionDetails: Array.from(this.subscriptions.values()).map(sub => ({
        id: sub.id,
        name: sub.subscriberName,
        pattern: sub.eventPattern,
        enabled: sub.enabled,
        stats: sub.stats
      }))
    }
  }

  /**
   * 获取性能历史
   */
  getPerformanceHistory(): typeof this.performanceHistory {
    return [...this.performanceHistory]
  }

  /**
   * 重置统计信息
   */
  resetStats(): void {
    this.busStats.totalEvents = 0
    this.busStats.eventsPerSecond = 0
    this.busStats.avgProcessingTime = 0
    this.busStats.errorRate = 0
    
    this.processingState.processedCount = 0
    this.processingState.errorCount = 0
    
    this.performanceHistory.length = 0
    
    // 重置订阅统计
    for (const subscription of this.subscriptions.values()) {
      subscription.stats = {
        totalReceived: 0,
        successCount: 0,
        errorCount: 0,
        avgProcessingTime: 0,
        lastProcessedAt: 0
      }
    }
    
    console.log('📊 统计信息已重置')
  }

  // ==================== ⚙️ 配置管理接口 ====================

  /**
   * 更新存储配置
   */
  updateStorageConfig(config: Partial<typeof this.storageConfig>): void {
    Object.assign(this.storageConfig, config)
    console.log('⚙️ 存储配置已更新:', config)
  }

  /**
   * 更新批处理配置
   */
  updateBatchConfig(config: Partial<typeof this.batchConfig>): void {
    Object.assign(this.batchConfig, config)
    console.log('⚙️ 批处理配置已更新:', config)
  }

  /**
   * 更新防抖配置
   */
  updateDebounceConfig(config: Partial<typeof this.debounceConfig>): void {
    Object.assign(this.debounceConfig, config)
    console.log('⚙️ 防抖配置已更新:', config)
  }

  /**
   * 设置特定事件类型的防抖延迟
   */
  setEventDebounceDelay(eventType: string, delay: number): void {
    this.debounceConfig.perEventTypeDelay.set(eventType, delay)
    console.log(`⚙️ 事件 ${eventType} 防抖延迟设置为 ${delay}ms`)
  }

  // ==================== 🛠️ 私有工具方法 ====================

  /**
   * 初始化优先级队列
   */
  private initializeQueues(): void {
    for (const priority of Object.values(EventPriority)) {
      if (typeof priority === 'number') {
        this.eventQueues.set(priority, [])
        this.processingState.queueSizes[priority] = 0
      }
    }
  }

  /**
   * 解析事件类别
   */
  private parseEventCategory(eventType: string): EventCategory {
    const category = eventType.split('.')[0].toLowerCase()
    
    switch (category) {
      case 'system': return EventCategory.SYSTEM
      case 'user': return EventCategory.USER
      case 'data': return EventCategory.DATA
      case 'ui': return EventCategory.UI
      case 'network': return EventCategory.NETWORK
      case 'business': return EventCategory.BUSINESS
      case 'performance': return EventCategory.PERFORMANCE
      case 'security': return EventCategory.SECURITY
      default: return EventCategory.SYSTEM
    }
  }

  /**
   * 处理事件
   */
  private processEvent(event: StandardEvent): void {
    // 存储事件
    this.storeEvent(event)
    
    // 添加到处理队列
    this.enqueueEvent(event)
    
    // 更新统计
    this.busStats.totalEvents++
  }

  /**
   * 存储事件
   */
  private storeEvent(event: StandardEvent): void {
    if (!this.storageConfig.persistEvents) {
      return
    }
    
    this.eventStorage.push(event)
    
    // 检查存储限制
    if (this.eventStorage.length > this.storageConfig.maxEvents) {
      const removeCount = Math.floor(this.storageConfig.maxEvents * 0.1) // 移除10%
      this.eventStorage.splice(0, removeCount)
    }
  }

  /**
   * 将事件加入队列
   */
  private enqueueEvent(event: StandardEvent): void {
    const queue = this.eventQueues.get(event.priority)
    if (queue) {
      queue.push(event)
      this.processingState.queueSizes[event.priority]++
    }
  }

  /**
   * 启动事件处理器
   */
  private startEventProcessor(): void {
    this.processingTimer = setInterval(() => {
      this.processEventQueues()
    }, this.batchConfig.flushInterval)
  }

  /**
   * 处理事件队列
   */
  private async processEventQueues(): Promise<void> {
    if (this.processingState.isProcessing) {
      return
    }
    
    this.processingState.isProcessing = true
    
    try {
      // 按优先级顺序处理（从高到低）
      const priorities = [
        EventPriority.CRITICAL,
        EventPriority.URGENT,
        EventPriority.HIGH,
        EventPriority.NORMAL,
        EventPriority.LOW
      ]
      
      for (const priority of priorities) {
        await this.processQueueByPriority(priority)
      }
      
    } finally {
      this.processingState.isProcessing = false
    }
  }

  /**
   * 按优先级处理队列
   */
  private async processQueueByPriority(priority: EventPriority): Promise<void> {
    const queue = this.eventQueues.get(priority)
    if (!queue || queue.length === 0) {
      return
    }
    
    // 批量处理
    const batchSize = this.batchConfig.enabled ? this.batchConfig.batchSize : 1
    const batch = queue.splice(0, Math.min(batchSize, queue.length))
    this.processingState.queueSizes[priority] = queue.length
    
    // 并行处理批次中的事件
    await Promise.all(batch.map(event => this.handleEvent(event)))
  }

  /**
   * 处理单个事件
   */
  private async handleEvent(event: StandardEvent): Promise<void> {
    const startTime = Date.now()
    
    try {
      event.status = EventStatus.PROCESSING
      
      // 查找匹配的订阅
      const matchingSubscriptions = this.findMatchingSubscriptions(event)
      
      // 并行调用所有匹配的处理器
      await Promise.all(
        matchingSubscriptions.map(subscription => 
          this.invokeHandler(subscription, event)
        )
      )
      
      event.status = EventStatus.COMPLETED
      this.processingState.processedCount++
      
    } catch (error) {
      console.error(`❌ 处理事件 ${event.type} [${event.id}] 失败:`, error)
      event.status = EventStatus.FAILED
      this.processingState.errorCount++
    } finally {
      const processingTime = Date.now() - startTime
      this.updateProcessingMetrics(processingTime)
    }
  }

  /**
   * 查找匹配的订阅
   */
  private findMatchingSubscriptions(event: StandardEvent): EventSubscription[] {
    const matching: EventSubscription[] = []
    
    for (const subscription of this.subscriptions.values()) {
      if (!subscription.enabled) {
        continue
      }
      
      // 检查优先级过滤
      if (subscription.minPriority && event.priority < subscription.minPriority) {
        continue
      }
      
      // 检查事件类型模式
      if (!this.matchesPattern(event.type, subscription.eventPattern)) {
        continue
      }
      
      // 检查自定义过滤器
      if (subscription.filters && !this.passesFilters(event, subscription.filters)) {
        continue
      }
      
      matching.push(subscription)
    }
    
    return matching
  }

  /**
   * 调用事件处理器
   */
  private async invokeHandler(subscription: EventSubscription, event: StandardEvent): Promise<void> {
    const startTime = Date.now()
    
    try {
      subscription.stats.totalReceived++
      subscription.lastActiveAt = Date.now()
      
      await subscription.handler(event)
      
      subscription.stats.successCount++
      
    } catch (error) {
      console.error(`❌ 订阅 ${subscription.id} 处理事件失败:`, error)
      subscription.stats.errorCount++
      throw error
      
    } finally {
      const processingTime = Date.now() - startTime
      subscription.stats.avgProcessingTime = 
        (subscription.stats.avgProcessingTime * (subscription.stats.totalReceived - 1) + processingTime) / 
        subscription.stats.totalReceived
      subscription.stats.lastProcessedAt = Date.now()
    }
  }

  /**
   * 检查事件类型是否匹配模式
   */
  private matchesPattern(eventType: string, pattern: string): boolean {
    const regex = this.createRegexFromPattern(pattern)
    return regex.test(eventType)
  }

  /**
   * 从通配符模式创建正则表达式
   */
  private createRegexFromPattern(pattern: string): RegExp {
    // 转义特殊字符，但保留 * 和 ?
    const escaped = pattern
      .replace(/[.+^${}()|[\]\\]/g, '\\$&')
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.')
    
    return new RegExp(`^${escaped}$`, 'i')
  }

  /**
   * 检查事件是否通过过滤器
   */
  private passesFilters(event: StandardEvent, filters: EventFilter[]): boolean {
    for (const filter of filters) {
      if (!this.passesFilter(event, filter)) {
        return false
      }
    }
    return true
  }

  /**
   * 检查单个过滤器
   */
  private passesFilter(event: StandardEvent, filter: EventFilter): boolean {
    const value = this.getEventFieldValue(event, filter.field)
    let result = false
    
    switch (filter.operator) {
      case 'equals':
        result = value === filter.value
        break
      case 'contains':
        result = String(value).includes(String(filter.value))
        break
      case 'startsWith':
        result = String(value).startsWith(String(filter.value))
        break
      case 'endsWith':
        result = String(value).endsWith(String(filter.value))
        break
      case 'regex':
        result = new RegExp(filter.value).test(String(value))
        break
      case 'gt':
        result = Number(value) > Number(filter.value)
        break
      case 'lt':
        result = Number(value) < Number(filter.value)
        break
      case 'in':
        result = Array.isArray(filter.value) ? filter.value.includes(value) : false
        break
    }
    
    return filter.negate ? !result : result
  }

  /**
   * 获取事件字段值
   */
  private getEventFieldValue(event: StandardEvent, fieldPath: string): any {
    const path = fieldPath.split('.')
    let value: any = event
    
    for (const key of path) {
      value = value?.[key]
      if (value === undefined) {
        break
      }
    }
    
    return value
  }

  /**
   * 限流检查
   */
  private shouldThrottle(eventType: string): boolean {
    if (!this.throttleConfig.enabled) {
      return false
    }
    
    const now = Date.now()
    const counter = this.throttleCounters.get(eventType)
    
    if (!counter || now - counter.windowStart > this.throttleConfig.windowSize) {
      // 新窗口或第一次
      this.throttleCounters.set(eventType, { count: 1, windowStart: now })
      return false
    }
    
    if (counter.count >= this.throttleConfig.maxEventsPerSecond) {
      return true // 触发限流
    }
    
    counter.count++
    return false
  }

  /**
   * 防抖检查
   */
  private shouldDebounce(eventType: string): boolean {
    if (!this.debounceConfig.enabled) {
      return false
    }
    
    const delay = this.debounceConfig.perEventTypeDelay.get(eventType) || 
                  this.debounceConfig.defaultDelay
    
    return delay > 0
  }

  /**
   * 防抖事件处理
   */
  private debounceEvent(event: StandardEvent): void {
    const delay = this.debounceConfig.perEventTypeDelay.get(event.type) || 
                  this.debounceConfig.defaultDelay
    
    // 清除之前的定时器
    const existingTimer = this.debounceTimers.get(event.type)
    if (existingTimer) {
      clearTimeout(existingTimer)
    }
    
    // 设置新的定时器
    const timer = setTimeout(() => {
      this.processEvent(event)
      this.debounceTimers.delete(event.type)
    }, delay)
    
    this.debounceTimers.set(event.type, timer)
  }

  /**
   * 更新处理指标
   */
  private updateProcessingMetrics(processingTime: number): void {
    const currentAvg = this.busStats.avgProcessingTime
    const totalProcessed = this.processingState.processedCount
    
    this.busStats.avgProcessingTime = 
      (currentAvg * (totalProcessed - 1) + processingTime) / totalProcessed
  }

  /**
   * 启动指标收集
   */
  private startMetricsCollection(): void {
    this.metricsTimer = setInterval(() => {
      this.updateMetrics()
    }, 5000) // 每5秒更新
  }

  /**
   * 更新指标
   */
  private updateMetrics(): void {
    const now = Date.now()
    
    // 计算每秒事件数（基于最近5秒）
    const recentEvents = this.eventStorage.filter(event => 
      now - event.timestamp < 5000
    ).length
    this.busStats.eventsPerSecond = recentEvents / 5
    
    // 计算错误率
    const totalProcessed = this.processingState.processedCount
    const totalErrors = this.processingState.errorCount
    this.busStats.errorRate = totalProcessed > 0 ? 
      (totalErrors / totalProcessed) * 100 : 0
    
    // 记录性能历史
    this.performanceHistory.push({
      timestamp: now,
      eventsPerSecond: this.busStats.eventsPerSecond,
      avgLatency: this.busStats.avgProcessingTime,
      errorRate: this.busStats.errorRate
    })
    
    // 限制历史记录大小
    if (this.performanceHistory.length > 1000) {
      this.performanceHistory.splice(0, 500)
    }
  }

  /**
   * 启动存储清理
   */
  private startStorageCleanup(): void {
    if (!this.storageConfig.autoCleanup) {
      return
    }
    
    this.cleanupTimer = setInterval(() => {
      this.cleanupExpiredEvents()
    }, this.storageConfig.cleanupInterval)
  }

  /**
   * 清理过期事件
   */
  private cleanupExpiredEvents(): void {
    const now = Date.now()
    const beforeCount = this.eventStorage.length
    
    this.eventStorage = this.eventStorage.filter(event => {
      // 移除过期事件
      if (event.expiresAt && now > event.expiresAt) {
        return false
      }
      
      // 移除太旧的事件（超过1小时）
      if (now - event.timestamp > 3600000) {
        return false
      }
      
      return true
    })
    
    const removedCount = beforeCount - this.eventStorage.length
    if (removedCount > 0) {
      console.log(`🧹 清理过期事件: ${removedCount} 个`)
    }
  }

  /**
   * 销毁事件总线
   */
  destroy(): void {
    console.log('🗑️ StandardEventBus: 开始销毁事件总线')
    
    // 清理定时器
    if (this.metricsTimer) clearInterval(this.metricsTimer)
    if (this.cleanupTimer) clearInterval(this.cleanupTimer)
    if (this.processingTimer) clearInterval(this.processingTimer)
    
    // 清理防抖定时器
    for (const timer of this.debounceTimers.values()) {
      clearTimeout(timer)
    }
    this.debounceTimers.clear()
    
    // 清理数据
    this.subscriptions.clear()
    this.eventStorage.length = 0
    this.eventQueues.clear()
    this.throttleCounters.clear()
    this.performanceHistory.length = 0
    
    console.log('✅ StandardEventBus: 事件总线已销毁')
  }
}

// ==================== 🌐 导出接口 ====================

/**
 * 创建标准化事件总线实例
 */
export const createStandardEventBus = (): StandardEventBus => {
  return new StandardEventBus()
}

/**
 * 全局标准化事件总线实例
 */
let _globalStandardEventBus: StandardEventBus | null = null

export const globalStandardEventBus = new Proxy({} as StandardEventBus, {
  get(target, prop) {
    if (!_globalStandardEventBus) {
      console.log('🚀 globalStandardEventBus Proxy: 延迟初始化')
      _globalStandardEventBus = createStandardEventBus()
    }
    return _globalStandardEventBus[prop as keyof StandardEventBus]
  }
})

// ==================== 📚 便捷工具函数 ====================

/**
 * 创建事件类型构建器
 * 💡 简单理解：这是"消息类型生成器"，帮助创建标准格式的消息类型
 */
export class EventTypeBuilder {
  private category: string = ''
  private action: string = ''
  private target: string = ''
  
  static create(): EventTypeBuilder {
    return new EventTypeBuilder()
  }
  
  setCategory(category: EventCategory | string): this {
    this.category = category.toString()
    return this
  }
  
  setAction(action: string): this {
    this.action = action
    return this
  }
  
  setTarget(target: string): this {
    this.target = target
    return this
  }
  
  build(): string {
    const parts = [this.category, this.action, this.target].filter(Boolean)
    return parts.join('.')
  }
}

/**
 * 快捷事件发布函数
 */
export const emitStandardEvent = <T = any>(
  type: string, 
  payload: T, 
  options?: Partial<StandardEvent<T>>
): string => {
  return globalStandardEventBus.emit(type, payload, options)
}

/**
 * 快捷事件订阅函数
 */
export const onStandardEvent = <T = any>(
  pattern: string, 
  handler: EventHandler<T>
): string => {
  return globalStandardEventBus.on(pattern, handler)
}

/**
 * 快捷事件取消订阅函数
 */
export const offStandardEvent = (subscriptionId: string): boolean => {
  return globalStandardEventBus.off(subscriptionId)
}