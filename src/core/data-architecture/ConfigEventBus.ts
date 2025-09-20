/**
 * 配置事件总线
 * 用于解耦配置变更与执行器调用，实现松散耦合的事件驱动架构
 *
 * 核心功能：
 * 1. 配置变更事件的统一分发
 * 2. 条件性事件过滤和处理
 * 3. 事件优先级和执行顺序控制
 * 4. 执行器调用的解耦和可控性
 *
 * Created for Task 1.2: 解耦配置事件与执行器调用
 */

export interface ConfigChangeEvent {
  /** 组件ID */
  componentId: string
  /** 组件类型 */
  componentType: string
  /** 变更的配置层级 */
  section: 'base' | 'component' | 'dataSource' | 'interaction'
  /** 变更前的配置 */
  oldConfig: any
  /** 变更后的配置 */
  newConfig: any
  /** 变更时间戳 */
  timestamp: number
  /** 变更来源 */
  source: 'user' | 'system' | 'api' | 'import'
  /** 额外的上下文信息 */
  context?: {
    /** 触发变更的UI组件 */
    triggerComponent?: string
    /** 是否需要触发数据执行 */
    shouldTriggerExecution?: boolean
    /** 变更的具体字段路径 */
    changedFields?: string[]
  }
}

export type ConfigEventType =
  | 'config-changed' // 任意配置变更
  | 'data-source-changed' // 数据源配置变更
  | 'component-props-changed' // 组件属性变更
  | 'base-config-changed' // 基础配置变更
  | 'interaction-changed' // 交互配置变更
  | 'before-config-change' // 配置变更前（可用于验证）
  | 'after-config-change' // 配置变更后（用于清理工作）

export type ConfigEventHandler = (event: ConfigChangeEvent) => void | Promise<void>

export interface ConfigEventFilter {
  /** 过滤器名称 */
  name: string
  /** 过滤条件函数 */
  condition: (event: ConfigChangeEvent) => boolean
  /** 过滤器优先级（数字越大优先级越高） */
  priority?: number
}

/**
 * 配置事件总线类
 * 实现配置变更的事件驱动处理，解耦配置管理与业务逻辑
 */
export class ConfigEventBus {
  /** 事件处理器映射 */
  private eventHandlers = new Map<ConfigEventType, Set<ConfigEventHandler>>()

  /** 全局事件过滤器列表 */
  private globalFilters: ConfigEventFilter[] = []

  /** 事件处理统计（用于调试和性能分析） */
  private statistics = {
    eventsEmitted: 0,
    eventsFiltered: 0,
    handlersExecuted: 0,
    errors: 0
  }

  /**
   * 注册配置变更事件处理器
   * @param eventType 事件类型
   * @param handler 事件处理函数
   * @returns 取消注册的函数
   */
  onConfigChange(eventType: ConfigEventType, handler: ConfigEventHandler): () => void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, new Set())
    }

    const handlers = this.eventHandlers.get(eventType)!
    handlers.add(handler)
    // 返回取消注册的函数
    return () => {
      handlers.delete(handler)
      if (handlers.size === 0) {
        this.eventHandlers.delete(eventType)
      }
    }
  }

  /**
   * 发出配置变更事件
   * @param event 配置变更事件
   */
  async emitConfigChange(event: ConfigChangeEvent): Promise<void> {
    this.statistics.eventsEmitted++

    // 应用全局过滤器
    if (!this.passesGlobalFilters(event)) {
      this.statistics.eventsFiltered++
      return
    }

    // 确定要触发的事件类型
    const eventTypesToTrigger = this.determineEventTypes(event)

    // 并行执行所有相关事件类型的处理器
    const handlerPromises: Promise<void>[] = []

    for (const eventType of eventTypesToTrigger) {
      const handlers = this.eventHandlers.get(eventType)
      if (handlers) {
        for (const handler of handlers) {
          handlerPromises.push(this.executeHandler(handler, event, eventType))
        }
      }
    }

    // 等待所有处理器执行完成
    if (handlerPromises.length > 0) {
      try {
        await Promise.allSettled(handlerPromises)
      } catch (error) {}
    }
  }

  /**
   * 添加全局事件过滤器
   * @param filter 事件过滤器
   */
  addEventFilter(filter: ConfigEventFilter): void {
    // 按优先级插入（优先级高的在前）
    const insertIndex = this.globalFilters.findIndex(f => (f.priority || 0) < (filter.priority || 0))
    if (insertIndex === -1) {
      this.globalFilters.push(filter)
    } else {
      this.globalFilters.splice(insertIndex, 0, filter)
    }
  }

  /**
   * 移除全局事件过滤器
   * @param filterName 过滤器名称
   */
  removeEventFilter(filterName: string): void {
    const index = this.globalFilters.findIndex(f => f.name === filterName)
    if (index !== -1) {
      this.globalFilters.splice(index, 1)
    }
  }

  /**
   * 获取事件总线统计信息
   */
  getStatistics() {
    return { ...this.statistics }
  }

  /**
   * 清除所有事件处理器和过滤器（用于测试和清理）
   */
  clear(): void {
    this.eventHandlers.clear()
    this.globalFilters.length = 0
    this.statistics = {
      eventsEmitted: 0,
      eventsFiltered: 0,
      handlersExecuted: 0,
      errors: 0
    }
  }

  // ===== 私有方法 =====

  /**
   * 检查事件是否通过全局过滤器
   */
  private passesGlobalFilters(event: ConfigChangeEvent): boolean {
    for (const filter of this.globalFilters) {
      try {
        if (!filter.condition(event)) {
          return false
        }
      } catch (error) {
        // 过滤器执行失败时，默认让事件通过
      }
    }
    return true
  }

  /**
   * 根据事件内容确定要触发的事件类型
   */
  private determineEventTypes(event: ConfigChangeEvent): ConfigEventType[] {
    const eventTypes: ConfigEventType[] = ['config-changed'] // 总是触发通用事件

    // 根据配置层级添加特定事件类型
    switch (event.section) {
      case 'dataSource':
        eventTypes.push('data-source-changed')
        break
      case 'component':
        eventTypes.push('component-props-changed')
        break
      case 'base':
        eventTypes.push('base-config-changed')
        break
      case 'interaction':
        eventTypes.push('interaction-changed')
        break
    }

    return eventTypes
  }

  /**
   * 安全地执行事件处理器
   */
  private async executeHandler(
    handler: ConfigEventHandler,
    event: ConfigChangeEvent,
    eventType: ConfigEventType
  ): Promise<void> {
    try {
      this.statistics.handlersExecuted++

      const result = handler(event)

      // 如果处理器返回Promise，等待执行完成
      if (result instanceof Promise) {
        await result
      }
    } catch (error) {
      this.statistics.errors++

      // 不重新抛出错误，避免影响其他处理器的执行
    }
  }
}

// 创建全局配置事件总线实例
export const configEventBus = new ConfigEventBus()

// 🔥 新增：事件去重缓存，防止短时间内的重复事件
const eventDeduplicationCache = new Map<string, {
  lastEventTime: number
  lastEventHash: string
}>()

// 事件去重的时间窗口（毫秒）
const EVENT_DEDUPLICATION_WINDOW = 200

/**
 * 🔥 新增：计算事件的哈希值，用于去重
 */
function calculateEventHash(event: ConfigChangeEvent): string {
  // 创建用于哈希计算的关键字段
  const keyFields = {
    componentId: event.componentId,
    section: event.section,
    // 只包含配置的关键部分，避免时间戳等干扰
    configHash: JSON.stringify(event.newConfig)
  }

  const hashString = JSON.stringify(keyFields)

  // 简单哈希函数
  let hash = 0
  for (let i = 0; i < hashString.length; i++) {
    const char = hashString.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // 转换为32位整数
  }

  return Math.abs(hash).toString(36)
}

// 添加一些默认的过滤器
configEventBus.addEventFilter({
  name: 'ignore-system-updates',
  condition: event => {
    // 忽略某些系统级别的配置更新，避免无限循环
    return event.source !== 'system' || event.context?.shouldTriggerExecution !== false
  },
  priority: 100
})

// 🔥 新增：事件去重过滤器，防止短时间内的重复事件
configEventBus.addEventFilter({
  name: 'event-deduplication',
  condition: event => {
    const cacheKey = `${event.componentId}.${event.section}`
    const eventHash = calculateEventHash(event)
    const now = Date.now()

    const cached = eventDeduplicationCache.get(cacheKey)

    if (cached) {
      const timeDiff = now - cached.lastEventTime
      const isSameEvent = cached.lastEventHash === eventHash

      if (isSameEvent && timeDiff < EVENT_DEDUPLICATION_WINDOW) {
        console.log(`🔄 [ConfigEventBus] 过滤重复事件:`, {
          组件ID: event.componentId,
          配置节: event.section,
          时间间隔: timeDiff,
          事件哈希: eventHash,
          来源: event.source
        })
        return false // 过滤掉重复事件
      }
    }

    // 更新缓存
    eventDeduplicationCache.set(cacheKey, {
      lastEventTime: now,
      lastEventHash: eventHash
    })

    return true // 允许事件通过
  },
  priority: 150 // 高优先级，在其他过滤器之前执行
})

// 🔥 增强：智能的基础配置变更事件处理
configEventBus.addEventFilter({
  name: 'enhance-base-config-events',
  condition: event => {
    // 特别关注基础配置中的关键字段变更
    if (event.section === 'base') {
      if (!event.context) {
        event.context = {}
      }

      // 检查是否包含关键的动态参数字段
      const criticalFields = ['deviceId', 'metricsList']
      const configKeys = Object.keys(event.newConfig || {})
      const hasCriticalFields = criticalFields.some(field => configKeys.includes(field))

      if (hasCriticalFields) {
        // 只有当配置中包含关键字段时才标记为需要触发执行
        event.context.shouldTriggerExecution = true
        event.context.changedFields = configKeys.filter(key => criticalFields.includes(key))

        console.log(`🎯 [ConfigEventBus] 检测到关键基础配置变更:`, {
          组件ID: event.componentId,
          关键字段: event.context.changedFields,
          将触发数据执行: true
        })
      } else {
        // 非关键字段变更，不触发数据执行
        event.context.shouldTriggerExecution = false

        console.log(`📝 [ConfigEventBus] 检测到非关键基础配置变更:`, {
          组件ID: event.componentId,
          变更字段: configKeys,
          将触发数据执行: false
        })
      }
    }

    return true // 不过滤，只是增强事件信息
  },
  priority: 200 // 高优先级，在其他过滤器之前执行
})

// 🔥 新增：监听基础配置变更事件，自动触发数据源重新执行
let dataExecutionTriggerCallback: ((event: ConfigChangeEvent) => void) | null = null

/**
 * 🔥 注册数据执行触发器
 * 允许外部系统注册一个回调函数，在配置变更时触发数据重新执行
 */
export function registerDataExecutionTrigger(callback: (event: ConfigChangeEvent) => void): () => void {
  dataExecutionTriggerCallback = callback

  if (process.env.NODE_ENV === 'development') {
  }

  return () => {
    dataExecutionTriggerCallback = null
  }
}

// 🔥 监听所有配置变更事件，特别关注基础配置和数据源配置变更
configEventBus.onConfigChange('config-changed', async event => {
  // 对于需要触发数据执行的事件，调用注册的触发器
  if (event.context?.shouldTriggerExecution && dataExecutionTriggerCallback) {
    try {
      if (process.env.NODE_ENV === 'development') {
      }

      if (process.env.NODE_ENV === 'development') {
      }
      const result = dataExecutionTriggerCallback(event)

      if (result instanceof Promise) {
        await result
        if (process.env.NODE_ENV === 'development') {
        }
      }
    } catch (error) {
      console.error(`❌ [ConfigEventBus] 数据执行触发失败`, {
        componentId: event.componentId,
        error: error instanceof Error ? error.message : error
      })
    }
  }
})

// 🔥 专门监听基础配置变更事件
configEventBus.onConfigChange('base-config-changed', async event => {
  if (process.env.NODE_ENV === 'development') {
  }

  // 基础配置变更通常都需要触发数据重新执行
  if (!event.context) {
    event.context = {}
  }
  event.context.shouldTriggerExecution = true

  // 调用数据执行触发器
  if (dataExecutionTriggerCallback) {
    try {
      dataExecutionTriggerCallback(event)
    } catch (error) {
      console.error(`❌ [ConfigEventBus] 基础配置数据执行触发失败`, {
        componentId: event.componentId,
        error: error instanceof Error ? error.message : error
      })
    }
  }
})

// 🔥 专门监听数据源配置变更事件
configEventBus.onConfigChange('data-source-changed', async event => {
  if (process.env.NODE_ENV === 'development') {
  }

  // 数据源配置变更通常都需要触发数据重新执行
  if (!event.context) {
    event.context = {}
  }
  event.context.shouldTriggerExecution = true

  // 调用数据执行触发器
  if (dataExecutionTriggerCallback) {
    try {
      dataExecutionTriggerCallback(event)
    } catch (error) {
      console.error(`❌ [ConfigEventBus] 数据源配置数据执行触发失败`, {
        componentId: event.componentId,
        error: error instanceof Error ? error.message : error
      })
    }
  }
})

// 🔧 调试支持：将事件总线暴露到全局作用域，便于控制台调试
if (typeof window !== 'undefined') {
  ;(window as any).configEventBus = configEventBus
  ;(window as any).registerDataExecutionTrigger = registerDataExecutionTrigger
}
