/**
 * @file 全局事件总线实现
 * @description 第一层编辑器底座的事件通信系统
 * 提供组件间松耦合的事件通信机制
 */

/**
 * 事件处理器函数类型
 */
export type EventHandler = (payload?: any) => void

/**
 * 事件监听器注册信息
 */
interface EventListener {
  /** 监听器ID */
  id: string
  /** 处理器函数 */
  handler: EventHandler
  /** 是否只执行一次 */
  once: boolean
  /** 注册时间 */
  registeredAt: number
  /** 注册者信息 */
  registrar?: string
}

/**
 * 事件总线统计信息
 */
interface EventBusStats {
  /** 总事件类型数 */
  totalEventTypes: number
  /** 总监听器数量 */
  totalListeners: number
  /** 已发射事件次数 */
  totalEmissions: number
  /** 各事件类型的监听器数量 */
  listenerCounts: Record<string, number>
  /** 各事件类型的发射次数 */
  emissionCounts: Record<string, number>
}

/**
 * 全局事件总线类
 * @description 提供跨组件的事件通信能力
 */
export class EventBus {
  /** 事件监听器映射表 */
  private listeners = new Map<string, EventListener[]>()

  /** 监听器ID计数器 */
  private listenerIdCounter = 0

  /** 统计信息 */
  private stats: EventBusStats = {
    totalEventTypes: 0,
    totalListeners: 0,
    totalEmissions: 0,
    listenerCounts: {},
    emissionCounts: {}
  }

  /** 是否启用调试模式 */
  private debugMode = false

  /** 最大监听器数量（防止内存泄漏） */
  private maxListeners = 50

  /**
   * 监听事件
   * @param event 事件名称
   * @param handler 事件处理器
   * @param options 监听选项
   * @returns 监听器ID，用于取消监听
   */
  on(
    event: string,
    handler: EventHandler,
    options: {
      once?: boolean
      registrar?: string
    } = {}
  ): string {
    const listener: EventListener = {
      id: `listener_${++this.listenerIdCounter}`,
      handler,
      once: options.once || false,
      registeredAt: Date.now(),
      registrar: options.registrar
    }

    // 初始化事件监听器数组
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
      this.stats.totalEventTypes++
      this.stats.listenerCounts[event] = 0
      this.stats.emissionCounts[event] = 0
    }

    const eventListeners = this.listeners.get(event)!

    // 检查监听器数量限制
    if (eventListeners.length >= this.maxListeners) {
      console.warn(`EventBus: 事件 "${event}" 的监听器数量已达到上限 (${this.maxListeners})`)
      return listener.id
    }

    eventListeners.push(listener)
    this.stats.totalListeners++
    this.stats.listenerCounts[event]++

    if (this.debugMode) {
      console.log(`EventBus: 注册监听器`, {
        event,
        listenerId: listener.id,
        registrar: listener.registrar,
        totalListeners: eventListeners.length
      })
    }

    return listener.id
  }

  /**
   * 监听一次性事件
   * @param event 事件名称
   * @param handler 事件处理器
   * @param registrar 注册者标识
   * @returns 监听器ID
   */
  once(event: string, handler: EventHandler, registrar?: string): string {
    return this.on(event, handler, { once: true, registrar })
  }

  /**
   * 取消事件监听
   * @param event 事件名称
   * @param handlerOrId 事件处理器函数或监听器ID
   */
  off(event: string, handlerOrId: EventHandler | string): void {
    const eventListeners = this.listeners.get(event)
    if (!eventListeners) return

    let removedCount = 0

    if (typeof handlerOrId === 'string') {
      // 通过监听器ID移除
      const index = eventListeners.findIndex(listener => listener.id === handlerOrId)
      if (index !== -1) {
        eventListeners.splice(index, 1)
        removedCount = 1
      }
    } else {
      // 通过处理器函数移除
      const initialLength = eventListeners.length
      for (let i = eventListeners.length - 1; i >= 0; i--) {
        if (eventListeners[i].handler === handlerOrId) {
          eventListeners.splice(i, 1)
        }
      }
      removedCount = initialLength - eventListeners.length
    }

    // 更新统计信息
    this.stats.totalListeners -= removedCount
    this.stats.listenerCounts[event] -= removedCount

    // 如果没有监听器了，清理事件
    if (eventListeners.length === 0) {
      this.listeners.delete(event)
      this.stats.totalEventTypes--
      delete this.stats.listenerCounts[event]
      delete this.stats.emissionCounts[event]
    }

    if (this.debugMode && removedCount > 0) {
      console.log(`EventBus: 移除监听器`, {
        event,
        removedCount,
        remainingListeners: eventListeners.length
      })
    }
  }

  /**
   * 发射事件
   * @param event 事件名称
   * @param payload 事件数据
   */
  emit(event: string, payload?: any): void {
    const eventListeners = this.listeners.get(event)
    if (!eventListeners || eventListeners.length === 0) {
      if (this.debugMode) {
        console.log(`EventBus: 发射事件但无监听器`, { event, payload })
      }
      return
    }

    // 更新统计信息
    this.stats.totalEmissions++
    this.stats.emissionCounts[event]++

    if (this.debugMode) {
      console.log(`EventBus: 发射事件`, {
        event,
        payload,
        listenerCount: eventListeners.length
      })
    }

    // 复制监听器数组，避免在执行过程中修改原数组
    const listenersToExecute = [...eventListeners]
    const onceListeners: string[] = []

    // 执行所有监听器
    for (const listener of listenersToExecute) {
      try {
        listener.handler(payload)

        // 记录一次性监听器
        if (listener.once) {
          onceListeners.push(listener.id)
        }
      } catch (error) {
        console.error(`EventBus: 监听器执行错误`, {
          event,
          listenerId: listener.id,
          error
        })
      }
    }

    // 移除一次性监听器
    for (const listenerId of onceListeners) {
      this.off(event, listenerId)
    }
  }

  /**
   * 移除某个注册者的所有监听器
   * @param registrar 注册者标识
   */
  offAll(registrar: string): void {
    let removedCount = 0

    for (const [event, listeners] of this.listeners.entries()) {
      const initialLength = listeners.length

      // 移除匹配的监听器
      for (let i = listeners.length - 1; i >= 0; i--) {
        if (listeners[i].registrar === registrar) {
          listeners.splice(i, 1)
        }
      }

      const removed = initialLength - listeners.length
      removedCount += removed
      this.stats.listenerCounts[event] -= removed

      // 如果没有监听器了，清理事件
      if (listeners.length === 0) {
        this.listeners.delete(event)
        this.stats.totalEventTypes--
        delete this.stats.listenerCounts[event]
        delete this.stats.emissionCounts[event]
      }
    }

    this.stats.totalListeners -= removedCount

    if (this.debugMode) {
      console.log(`EventBus: 移除注册者所有监听器`, {
        registrar,
        removedCount
      })
    }
  }

  /**
   * 获取事件的监听器数量
   * @param event 事件名称
   * @returns 监听器数量
   */
  listenerCount(event: string): number {
    const listeners = this.listeners.get(event)
    return listeners ? listeners.length : 0
  }

  /**
   * 获取所有事件名称
   * @returns 事件名称数组
   */
  eventNames(): string[] {
    return Array.from(this.listeners.keys())
  }

  /**
   * 检查是否有监听器
   * @param event 事件名称（可选）
   * @returns 是否有监听器
   */
  hasListeners(event?: string): boolean {
    if (event) {
      return this.listenerCount(event) > 0
    }
    return this.stats.totalListeners > 0
  }

  /**
   * 清空所有监听器
   */
  clear(): void {
    this.listeners.clear()
    this.stats = {
      totalEventTypes: 0,
      totalListeners: 0,
      totalEmissions: 0,
      listenerCounts: {},
      emissionCounts: {}
    }

    if (this.debugMode) {
      console.log('EventBus: 清空所有监听器')
    }
  }

  /**
   * 获取统计信息
   * @returns 统计信息
   */
  getStats(): EventBusStats {
    return { ...this.stats }
  }

  /**
   * 设置调试模式
   * @param enabled 是否启用调试
   */
  setDebugMode(enabled: boolean): void {
    this.debugMode = enabled
  }

  /**
   * 设置最大监听器数量
   * @param max 最大数量
   */
  setMaxListeners(max: number): void {
    this.maxListeners = Math.max(1, max)
  }

  /**
   * 获取监听器详细信息（调试用）
   * @param event 事件名称
   * @returns 监听器信息数组
   */
  getListenerDetails(event: string): Array<{
    id: string
    once: boolean
    registeredAt: number
    registrar?: string
  }> {
    const listeners = this.listeners.get(event)
    if (!listeners) return []

    return listeners.map(listener => ({
      id: listener.id,
      once: listener.once,
      registeredAt: listener.registeredAt,
      registrar: listener.registrar
    }))
  }
}

/**
 * 创建全局事件总线实例
 */
export const createEventBus = (
  options: {
    debugMode?: boolean
    maxListeners?: number
  } = {}
): EventBus => {
  const eventBus = new EventBus()

  if (options.debugMode) {
    eventBus.setDebugMode(true)
  }

  if (options.maxListeners) {
    eventBus.setMaxListeners(options.maxListeners)
  }

  return eventBus
}

/**
 * 默认全局事件总线实例
 */
export const globalEventBus = createEventBus({
  debugMode: process.env.NODE_ENV === 'development',
  maxListeners: 100
})

/**
 * 事件总线工具函数
 */
export const eventBusUtils = {
  /**
   * 创建命名空间事件名
   * @param namespace 命名空间
   * @param event 事件名
   * @returns 完整事件名
   */
  namespaced: (namespace: string, event: string): string => {
    return `${namespace}:${event}`
  },

  /**
   * 解析命名空间事件名
   * @param namespacedEvent 命名空间事件名
   * @returns 解析结果
   */
  parseNamespaced: (namespacedEvent: string): { namespace: string; event: string } => {
    const [namespace, ...eventParts] = namespacedEvent.split(':')
    return {
      namespace,
      event: eventParts.join(':')
    }
  },

  /**
   * 批量监听事件
   * @param eventBus 事件总线实例
   * @param events 事件映射表
   * @param registrar 注册者标识
   * @returns 监听器ID数组
   */
  onMultiple: (eventBus: EventBus, events: Record<string, EventHandler>, registrar?: string): string[] => {
    const listenerIds: string[] = []

    for (const [event, handler] of Object.entries(events)) {
      const id = eventBus.on(event, handler, { registrar })
      listenerIds.push(id)
    }

    return listenerIds
  }
}
