/**
 * 物联网可视化平台 - 事件引擎
 * 
 * 基于现有 ConfigEventBus 扩展，提供统一的事件通信机制
 * 确保与现有系统 100% 向后兼容
 * 
 * 核心原则：
 * 1. 不破坏现有 ConfigEventBus 功能
 * 2. 扩展而非替代现有事件机制
 * 3. 提供统一的事件管理接口
 * 4. 支持未来的事件类型扩展
 */

import { configEventBus, registerDataExecutionTrigger } from '@/core/data-architecture/ConfigEventBus'
import type { 
  ConfigChangeEvent, 
  ConfigEventType, 
  ConfigEventHandler 
} from '@/core/data-architecture/ConfigEventBus'

// 扩展事件类型 - 在原有基础上增加新的事件类型
export type ExtendedEventType = 
  | ConfigEventType // 保持所有原有事件类型
  | 'component-lifecycle' // 组件生命周期事件
  | 'data-update' // 数据更新事件
  | 'ui-interaction' // UI交互事件
  | 'system-ready' // 系统就绪事件
  | 'error-occurred' // 错误发生事件

// 扩展事件数据接口
export interface ExtendedEventData {
  type: ExtendedEventType
  payload: any
  timestamp: number
  source: string
  componentId?: string
}

// 事件处理器类型
export type ExtendedEventHandler = (event: ExtendedEventData) => void | Promise<void>

/**
 * 事件引擎类 - 统一的事件管理接口
 * 基于现有 ConfigEventBus，扩展更多事件类型支持
 */
export class EventEngine {
  /** 扩展事件处理器存储 */
  private extendedHandlers = new Map<ExtendedEventType, Set<ExtendedEventHandler>>()
  
  /** 事件统计 */
  private stats = {
    totalEvents: 0,
    extendedEvents: 0,
    configEvents: 0
  }

  /**
   * 向后兼容：直接暴露 ConfigEventBus 的配置事件方法
   */
  onConfigChange = configEventBus.onConfigChange.bind(configEventBus)
  emitConfigChange = configEventBus.emitConfigChange.bind(configEventBus)
  addEventFilter = configEventBus.addEventFilter.bind(configEventBus)
  removeEventFilter = configEventBus.removeEventFilter.bind(configEventBus)
  
  /**
   * 向后兼容：暴露数据执行触发器注册
   */
  registerDataExecutionTrigger = registerDataExecutionTrigger

  /**
   * 注册扩展事件处理器
   */
  on(eventType: ExtendedEventType, handler: ExtendedEventHandler): () => void {
    // 如果是配置事件类型，直接转发到原有的 ConfigEventBus，避免重复处理
    if (this.isConfigEventType(eventType)) {
      console.warn(`[EventEngine] 配置事件类型 ${eventType} 应使用 onConfigChange 方法`)
      
      // 转发到 ConfigEventBus，但需要适配处理器格式
      return configEventBus.onConfigChange(eventType as ConfigEventType, (configEvent: ConfigChangeEvent) => {
        // 将 ConfigChangeEvent 转换为 ExtendedEventData 格式
        const extendedEvent: ExtendedEventData = {
          type: eventType,
          payload: configEvent,
          timestamp: configEvent.timestamp,
          source: configEvent.source,
          componentId: configEvent.componentId
        }
        
        // 安全执行处理器
        this.safeExecuteHandler(handler, extendedEvent).catch(error => {
          console.error(`[EventEngine] 配置事件处理器执行失败`, { eventType, error })
        })
      })
    }

    // 处理扩展事件类型
    if (!this.extendedHandlers.has(eventType)) {
      this.extendedHandlers.set(eventType, new Set())
    }

    const handlers = this.extendedHandlers.get(eventType)!
    handlers.add(handler)

    // 返回取消注册函数
    return () => {
      handlers.delete(handler)
      if (handlers.size === 0) {
        this.extendedHandlers.delete(eventType)
      }
    }
  }

  /**
   * 发出扩展事件
   */
  async emit(eventType: ExtendedEventType, payload: any, source = 'unknown'): Promise<void> {
    // 如果是配置事件类型，检查payload是否是正确的ConfigChangeEvent格式
    if (this.isConfigEventType(eventType)) {
      console.warn(`[EventEngine] 配置事件类型 ${eventType} 应使用 emitConfigChange 方法`)
      
      // 如果payload是ConfigChangeEvent格式，则转发
      if (this.isValidConfigChangeEvent(payload)) {
        await configEventBus.emitConfigChange(payload)
        return
      } else {
        console.error(`[EventEngine] 配置事件类型 ${eventType} 的payload格式不正确`, { payload })
        return
      }
    }

    this.stats.totalEvents++
    this.stats.extendedEvents++

    const event: ExtendedEventData = {
      type: eventType,
      payload,
      timestamp: Date.now(),
      source,
      componentId: payload?.componentId
    }

    const handlers = this.extendedHandlers.get(eventType)
    if (!handlers || handlers.size === 0) {
      return
    }

    // 并行执行所有处理器
    const promises = Array.from(handlers).map(handler => 
      this.safeExecuteHandler(handler, event)
    )

    await Promise.allSettled(promises)
  }

  /**
   * 统一的配置变更事件发出方法（向后兼容）
   */
  async emitConfigChangeCompat(event: ConfigChangeEvent): Promise<void> {
    this.stats.totalEvents++
    this.stats.configEvents++
    
    // 直接使用原有的 ConfigEventBus
    await configEventBus.emitConfigChange(event)
  }

  /**
   * 获取事件统计信息
   */
  getStatistics() {
    const configStats = configEventBus.getStatistics()
    
    return {
      ...this.stats,
      configEventBus: configStats,
      activeExtendedHandlers: this.extendedHandlers.size,
      totalHandlers: Array.from(this.extendedHandlers.values())
        .reduce((sum, handlers) => sum + handlers.size, 0)
    }
  }

  /**
   * 清理所有事件处理器（测试和调试用）
   */
  clear(): void {
    this.extendedHandlers.clear()
    this.stats = {
      totalEvents: 0,
      extendedEvents: 0,
      configEvents: 0
    }
    // 注意：不清理 configEventBus，保持原有系统正常运行
  }

  /**
   * 检查是否是配置事件类型
   */
  private isConfigEventType(eventType: ExtendedEventType): boolean {
    const configEventTypes: ConfigEventType[] = [
      'config-changed',
      'data-source-changed', 
      'component-props-changed',
      'base-config-changed',
      'interaction-changed',
      'before-config-change',
      'after-config-change'
    ]
    
    return configEventTypes.includes(eventType as ConfigEventType)
  }

  /**
   * 验证是否是有效的配置变更事件格式
   */
  private isValidConfigChangeEvent(payload: any): payload is ConfigChangeEvent {
    return payload && 
           typeof payload === 'object' &&
           typeof payload.componentId === 'string' &&
           typeof payload.componentType === 'string' &&
           typeof payload.section === 'string' &&
           typeof payload.timestamp === 'number' &&
           typeof payload.source === 'string' &&
           payload.oldConfig !== undefined &&
           payload.newConfig !== undefined
  }

  /**
   * 安全执行事件处理器
   */
  private async safeExecuteHandler(
    handler: ExtendedEventHandler, 
    event: ExtendedEventData
  ): Promise<void> {
    try {
      const result = handler(event)
      if (result instanceof Promise) {
        await result
      }
    } catch (error) {
      console.error(`[EventEngine] 事件处理器执行失败`, {
        eventType: event.type,
        source: event.source,
        error: error instanceof Error ? error.message : error
      })
    }
  }
}

// 创建全局事件引擎实例
export const eventEngine = new EventEngine()

// 兼容性导出 - 确保现有代码可以继续使用
export { 
  configEventBus,
  registerDataExecutionTrigger,
  type ConfigChangeEvent,
  type ConfigEventType,
  type ConfigEventHandler
}

// 调试支持：暴露到全局作用域
if (typeof window !== 'undefined') {
  ;(window as any).eventEngine = eventEngine
  ;(window as any).iotPlatformEventEngine = eventEngine
}

console.log(`🚀 [EventEngine] 事件引擎初始化完成，基于现有 ConfigEventBus 扩展`)

