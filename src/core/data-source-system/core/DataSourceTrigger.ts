/**
 * 数据源触发器系统
 * 负责定时器、事件、配置变更等触发机制
 *
 * 核心功能:
 * 1. 定时器触发 - 按间隔时间自动执行
 * 2. 事件触发 - 监听特定事件并触发执行
 * 3. 配置变更触发 - 配置改变时自动执行
 * 4. 手动触发 - 手动触发执行
 */

import { ref, reactive, watch, type Ref } from 'vue'
import type {
  TriggerConfig,
  TriggerState,
  TriggerType,
  TimerTriggerConfig,
  EventTriggerConfig,
  ConfigChangeTriggerConfig,
  IDataSourceTrigger,
  ExecutionEvent,
  TriggerEvent,
  ConfigChangeEvent
} from '../types/execution'

/**
 * 事件总线 - 简单的发布订阅实现
 */
class EventBus {
  private listeners: Map<string, Function[]> = new Map()

  on(event: string, handler: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event)!.push(handler)
  }

  off(event: string, handler: Function) {
    const handlers = this.listeners.get(event)
    if (handlers) {
      const index = handlers.indexOf(handler)
      if (index > -1) {
        handlers.splice(index, 1)
      }
    }
  }

  emit(event: string, data?: any) {
    const handlers = this.listeners.get(event)
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data)
        } catch (error) {
          console.error(`触发器事件处理器错误 [${event}]:`, error)
        }
      })
    }
  }

  clear() {
    this.listeners.clear()
  }
}

/**
 * 数据源触发器类
 */
export class DataSourceTrigger implements IDataSourceTrigger {
  private triggers: Ref<TriggerConfig[]> = ref([])
  private states: Ref<TriggerState[]> = ref([])
  private eventBus = new EventBus()

  // 定时器存储
  private timers: Map<string, NodeJS.Timeout> = new Map()

  // 事件监听器存储
  private eventListeners: Map<string, Function> = new Map()

  // 配置监听器存储
  private configWatchers: Map<string, () => void> = new Map()

  constructor() {
    console.log('🚀 [Trigger] 触发器系统初始化')
  }

  /**
   * 添加触发器
   */
  addTrigger(config: TriggerConfig): string {
    console.log(`📝 [Trigger] 添加触发器: ${config.name} (${config.type})`)

    // 添加到配置列表
    this.triggers.value.push({ ...config })

    // 初始化状态
    const state: TriggerState = {
      id: config.id,
      type: config.type,
      isActive: false,
      lastTriggerTime: null,
      triggerCount: 0,
      errorCount: 0
    }
    this.states.value.push(state)

    // 如果启用，则启动触发器
    if (config.enabled) {
      this.enableTrigger(config.id)
    }

    // 发送添加事件
    this.emitTriggerEvent({
      type: 'trigger-added',
      timestamp: new Date().toISOString(),
      triggerId: config.id,
      triggerType: config.type
    })

    return config.id
  }

  /**
   * 移除触发器
   */
  removeTrigger(triggerId: string): boolean {
    console.log(`🗑️ [Trigger] 移除触发器: ${triggerId}`)

    // 先禁用触发器
    this.disableTrigger(triggerId)

    // 从配置列表中移除
    const triggerIndex = this.triggers.value.findIndex(t => t.id === triggerId)
    if (triggerIndex === -1) {
      return false
    }

    const trigger = this.triggers.value[triggerIndex]
    this.triggers.value.splice(triggerIndex, 1)

    // 从状态列表中移除
    const stateIndex = this.states.value.findIndex(s => s.id === triggerId)
    if (stateIndex >= 0) {
      this.states.value.splice(stateIndex, 1)
    }

    // 发送移除事件
    this.emitTriggerEvent({
      type: 'trigger-removed',
      timestamp: new Date().toISOString(),
      triggerId,
      triggerType: trigger.type
    })

    return true
  }

  /**
   * 更新触发器配置
   */
  updateTrigger(triggerId: string, updates: Partial<TriggerConfig>): boolean {
    const triggerIndex = this.triggers.value.findIndex(t => t.id === triggerId)
    if (triggerIndex === -1) {
      return false
    }

    const oldTrigger = this.triggers.value[triggerIndex]
    const wasEnabled = oldTrigger.enabled

    // 更新配置
    Object.assign(this.triggers.value[triggerIndex], updates)

    // 如果启用状态发生变化，重新设置触发器
    const newTrigger = this.triggers.value[triggerIndex]
    if (wasEnabled !== newTrigger.enabled) {
      if (newTrigger.enabled) {
        this.enableTrigger(triggerId)
      } else {
        this.disableTrigger(triggerId)
      }
    } else if (newTrigger.enabled) {
      // 如果触发器启用且配置发生变化，重新启动
      this.disableTrigger(triggerId)
      this.enableTrigger(triggerId)
    }

    console.log(`📝 [Trigger] 更新触发器配置: ${triggerId}`)
    return true
  }

  /**
   * 启用触发器
   */
  enableTrigger(triggerId: string): boolean {
    const trigger = this.triggers.value.find(t => t.id === triggerId)
    const state = this.states.value.find(s => s.id === triggerId)

    if (!trigger || !state) {
      return false
    }

    if (state.isActive) {
      return true
    }

    console.log(`▶️ [Trigger] 启用触发器: ${triggerId} (${trigger.type})`)

    try {
      switch (trigger.type) {
        case 'timer':
          this.setupTimerTrigger(trigger)
          break
        case 'event':
          this.setupEventTrigger(trigger)
          break
        case 'config-change':
          this.setupConfigChangeTrigger(trigger)
          break
        case 'manual':
          // 手动触发器无需设置
          break
        default:
          console.warn(`未知的触发器类型: ${trigger.type}`)
          return false
      }

      state.isActive = true
      trigger.enabled = true

      // 发送启用事件
      this.emitTriggerEvent({
        type: 'trigger-enabled',
        timestamp: new Date().toISOString(),
        triggerId,
        triggerType: trigger.type
      })

      return true
    } catch (error) {
      console.error(`启用触发器失败 [${triggerId}]:`, error)
      state.errorCount++
      return false
    }
  }

  /**
   * 禁用触发器
   */
  disableTrigger(triggerId: string): boolean {
    const trigger = this.triggers.value.find(t => t.id === triggerId)
    const state = this.states.value.find(s => s.id === triggerId)

    if (!trigger || !state || !state.isActive) {
      return false
    }

    console.log(`⏸️ [Trigger] 禁用触发器: ${triggerId}`)

    // 清理定时器
    if (this.timers.has(triggerId)) {
      clearInterval(this.timers.get(triggerId)!)
      this.timers.delete(triggerId)
    }

    // 清理事件监听器
    if (this.eventListeners.has(triggerId)) {
      // 这里需要根据具体的事件系统来移除监听器
      this.eventListeners.delete(triggerId)
    }

    // 清理配置监听器
    if (this.configWatchers.has(triggerId)) {
      const unwatch = this.configWatchers.get(triggerId)!
      unwatch()
      this.configWatchers.delete(triggerId)
    }

    state.isActive = false
    trigger.enabled = false

    // 发送禁用事件
    this.emitTriggerEvent({
      type: 'trigger-disabled',
      timestamp: new Date().toISOString(),
      triggerId,
      triggerType: trigger.type
    })

    return true
  }

  /**
   * 启用所有触发器
   */
  enableAllTriggers() {
    console.log('▶️ [Trigger] 启用所有触发器')
    this.triggers.value.forEach(trigger => {
      if (!trigger.enabled) {
        this.enableTrigger(trigger.id)
      }
    })
  }

  /**
   * 禁用所有触发器
   */
  disableAllTriggers() {
    console.log('⏸️ [Trigger] 禁用所有触发器')
    this.triggers.value.forEach(trigger => {
      if (trigger.enabled) {
        this.disableTrigger(trigger.id)
      }
    })
  }

  /**
   * 手动触发
   */
  async trigger(triggerId?: string): Promise<void> {
    if (triggerId) {
      // 触发特定触发器
      const trigger = this.triggers.value.find(t => t.id === triggerId)
      if (trigger) {
        await this.executeTrigger(trigger)
      }
    } else {
      // 触发所有启用的触发器
      const enabledTriggers = this.triggers.value.filter(t => t.enabled)
      for (const trigger of enabledTriggers) {
        await this.executeTrigger(trigger)
      }
    }
  }

  /**
   * 设置定时器触发器
   */
  private setupTimerTrigger(trigger: TriggerConfig) {
    if (!trigger.timerConfig) {
      throw new Error('定时器触发器需要 timerConfig')
    }

    const config = trigger.timerConfig
    console.log(`⏰ [Trigger] 设置定时器: ${trigger.id}, 间隔 ${config.interval}ms`)

    // 立即执行一次（如果配置要求）
    if (config.immediate) {
      this.executeTrigger(trigger)
    }

    // 设置定时器
    const timer = setInterval(() => {
      this.executeTrigger(trigger)
    }, config.interval)

    this.timers.set(trigger.id, timer)
  }

  /**
   * 设置事件触发器
   */
  private setupEventTrigger(trigger: TriggerConfig) {
    if (!trigger.eventConfig) {
      throw new Error('事件触发器需要 eventConfig')
    }

    const config = trigger.eventConfig
    console.log(`📡 [Trigger] 设置事件监听: ${trigger.id}, 事件 ${config.eventName}`)

    // 防抖处理
    let debounceTimer: NodeJS.Timeout | null = null

    const handler = (eventData: any) => {
      if (debounceTimer) {
        clearTimeout(debounceTimer)
      }

      debounceTimer = setTimeout(() => {
        this.executeTrigger(trigger, eventData)
      }, config.debounceTime || 100)
    }

    // 监听事件
    this.eventBus.on(config.eventName, handler)
    this.eventListeners.set(trigger.id, handler)
  }

  /**
   * 设置配置变更触发器
   */
  private setupConfigChangeTrigger(trigger: TriggerConfig) {
    if (!trigger.configChangeConfig) {
      throw new Error('配置变更触发器需要 configChangeConfig')
    }

    const config = trigger.configChangeConfig
    console.log(`⚙️ [Trigger] 设置配置监听: ${trigger.id}`)

    // 这里应该监听配置对象的变化
    // 由于我们没有具体的配置对象，这里只是示例实现
    const watchHandler = () => {
      // 防抖处理
      let debounceTimer: NodeJS.Timeout | null = null

      return () => {
        if (debounceTimer) {
          clearTimeout(debounceTimer)
        }

        debounceTimer = setTimeout(() => {
          this.executeTrigger(trigger)
        }, config.debounceTime)
      }
    }

    const unwatch = watchHandler()
    this.configWatchers.set(trigger.id, unwatch)
  }

  /**
   * 执行触发器
   */
  private async executeTrigger(trigger: TriggerConfig, eventData?: any) {
    const state = this.states.value.find(s => s.id === trigger.id)
    if (!state) {
      return
    }

    console.log(`🔥 [Trigger] 触发执行: ${trigger.name}`)

    try {
      // 更新状态
      state.lastTriggerTime = new Date().toISOString()
      state.triggerCount++

      // 发送触发事件
      this.emitTriggerEvent({
        type: 'trigger-fired',
        timestamp: new Date().toISOString(),
        triggerId: trigger.id,
        triggerType: trigger.type,
        data: eventData
      })

      // 这里应该调用数据源执行器
      // 由于触发器和执行器是解耦的，需要通过事件或回调来通信
      this.eventBus.emit('execute-data-source', {
        triggerId: trigger.id,
        triggerType: trigger.type,
        eventData
      })
    } catch (error) {
      console.error(`触发器执行失败 [${trigger.id}]:`, error)
      state.errorCount++
      state.lastError = error instanceof Error ? error.message : String(error)
    }
  }

  /**
   * 发送触发器事件
   */
  private emitTriggerEvent(event: TriggerEvent) {
    this.eventBus.emit('trigger-event', event)
  }

  /**
   * 获取触发器状态列表
   */
  getTriggerStates(): TriggerState[] {
    return [...this.states.value]
  }

  /**
   * 获取特定触发器状态
   */
  getTriggerState(triggerId: string): TriggerState | null {
    return this.states.value.find(s => s.id === triggerId) || null
  }

  /**
   * 事件系统方法
   */
  on(event: string, handler: Function): void {
    this.eventBus.on(event, handler)
  }

  off(event: string, handler: Function): void {
    this.eventBus.off(event, handler)
  }

  /**
   * 销毁触发器系统
   */
  destroy() {
    console.log('🧹 [Trigger] 销毁触发器系统')

    // 禁用所有触发器
    this.disableAllTriggers()

    // 清理所有资源
    this.timers.clear()
    this.eventListeners.clear()
    this.configWatchers.clear()
    this.eventBus.clear()

    // 清空状态
    this.triggers.value = []
    this.states.value = []
  }
}

/**
 * 创建触发器实例
 */
export function createDataSourceTrigger(): DataSourceTrigger {
  return new DataSourceTrigger()
}

/**
 * 默认触发器实例
 */
export const defaultTrigger = createDataSourceTrigger()
