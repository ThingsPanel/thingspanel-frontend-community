/**
 * 响应式数据绑定系统
 * 实现数据的响应式更新，支持多种触发机制
 */

import type {
  UpdateTrigger,
  UpdateTriggerType,
  ReactiveDataBinding,
  DataTransformPipeline,
  DataBindingManager,
  DataBindingConfig
} from './types'

// ========== 更新触发器实现 ==========

/**
 * 定时器触发器
 */
export class TimerTrigger implements UpdateTrigger {
  type: UpdateTriggerType = 'timer'
  config: {
    interval: number // 毫秒
    immediate?: boolean // 是否立即执行一次
  }

  private timer: NodeJS.Timeout | null = null
  private callback: (() => void) | null = null

  constructor(interval: number, immediate = false) {
    this.config = { interval, immediate }
  }

  start(callback: () => void): void {
    // 🔥 性能优化：仅在开发环境输出定时器日志

    this.callback = callback

    // 🔥 性能优化：立即执行一次（如果配置了），避免不必要的setTimeout
    if (this.config.immediate) {
      callback()
    }

    // 启动定时器
    this.timer = setInterval(callback, this.config.interval)
  }

  stop(): void {
    // 🔥 性能优化：仅在开发环境输出定时器日志

    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
    this.callback = null
  }

  isActive(): boolean {
    return this.timer !== null
  }
}

/**
 * WebSocket触发器
 */
export class WebSocketTrigger implements UpdateTrigger {
  type: UpdateTriggerType = 'websocket'
  config: {
    url: string
    protocols?: string[]
    reconnectInterval?: number
  }

  private ws: WebSocket | null = null
  private callback: (() => void) | null = null
  private reconnectTimer: NodeJS.Timeout | null = null

  constructor(url: string, protocols?: string[], reconnectInterval = 5000) {
    this.config = { url, protocols, reconnectInterval }
  }

  start(callback: () => void): void {
    this.callback = callback
    this.connect()
  }

  private connect(): void {
    try {
      this.ws = new WebSocket(this.config.url, this.config.protocols)

      this.ws.onmessage = () => {
        if (this.callback) {
          this.callback()
        }
      }

      this.ws.onclose = () => {
        this.scheduleReconnect()
      }

      this.ws.onerror = error => {}
    } catch (error) {
      this.scheduleReconnect()
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null
      this.connect()
    }, this.config.reconnectInterval)
  }

  stop(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }

    if (this.ws) {
      this.ws.close()
      this.ws = null
    }

    this.callback = null
  }

  isActive(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN
  }
}

/**
 * 事件触发器
 */
export class EventTrigger implements UpdateTrigger {
  type: UpdateTriggerType = 'event'
  config: {
    eventName: string
    target?: EventTarget
  }

  private callback: (() => void) | null = null
  private eventHandler: ((event: Event) => void) | null = null

  constructor(eventName: string, target: EventTarget = window) {
    this.config = { eventName, target }
  }

  start(callback: () => void): void {
    this.callback = callback
    this.eventHandler = () => {
      callback()
    }

    this.config.target?.addEventListener(this.config.eventName, this.eventHandler)
  }

  stop(): void {
    if (this.eventHandler) {
      this.config.target?.removeEventListener(this.config.eventName, this.eventHandler)
      this.eventHandler = null
    }

    this.callback = null
  }

  isActive(): boolean {
    return this.eventHandler !== null
  }
}

/**
 * 手动触发器
 */
export class ManualTrigger implements UpdateTrigger {
  type: UpdateTriggerType = 'manual'
  config: any = {}

  private callback: (() => void) | null = null
  private active = false

  start(callback: () => void): void {
    // 🔥 性能优化：仅在开发环境输出手动触发器日志
    this.callback = callback
    this.active = true
  }

  stop(): void {
    // 🔥 性能优化：仅在开发环境输出手动触发器日志
    this.callback = null
    this.active = false
  }

  isActive(): boolean {
    return this.active
  }

  /**
   * 手动触发更新
   */
  trigger(): void {
    if (this.callback && this.active) {
      // 🔥 性能优化：仅在开发环境输出手动触发日志
      this.callback()
    }
  }
}

// ========== 响应式数据绑定实现 ==========

export class ReactiveDataBindingImpl implements ReactiveDataBinding {
  id: string
  componentId: string
  pipeline: DataTransformPipeline
  triggers: UpdateTrigger[]
  onDataChange: (newData: any, oldData?: any) => void
  onError?: (error: Error) => void

  private currentData: any = null
  private active = false
  private updateCount = 0
  private lastUpdateTime: Date | null = null

  constructor(
    id: string,
    componentId: string,
    pipeline: DataTransformPipeline,
    triggers: UpdateTrigger[],
    onDataChange: (newData: any, oldData?: any) => void,
    onError?: (error: Error) => void
  ) {
    this.id = id
    this.componentId = componentId
    this.pipeline = pipeline
    this.triggers = triggers
    this.onDataChange = onDataChange
    this.onError = onError
  }

  start(): void {
    if (this.active) {
      return
    }
    this.active = true

    // 启动所有触发器
    this.triggers.forEach((trigger, index) => {
      trigger.start(() => this.handleTrigger(trigger))
    })
  }

  stop(): void {
    if (!this.active) {
      return
    }

    this.active = false

    // 停止所有触发器
    this.triggers.forEach((trigger, index) => {
      trigger.stop()
    })
  }

  async refresh(): Promise<void> {
    if (!this.active) {
      return
    }
    await this.updateData('manual')
  }

  getCurrentData(): any {
    return this.currentData
  }

  isActive(): boolean {
    return this.active
  }

  /**
   * 处理触发器事件
   */
  private async handleTrigger(trigger: UpdateTrigger): Promise<void> {
    if (!this.active) return
    await this.updateData(trigger.type)
  }

  /**
   * 更新数据
   */
  private async updateData(triggerType: string): Promise<void> {
    try {
      const oldData = this.currentData
      const newData = await this.pipeline.execute()

      this.updateCount++
      this.lastUpdateTime = new Date()

      // 检查数据是否发生变化
      const dataChanged = JSON.stringify(oldData) !== JSON.stringify(newData)

      if (dataChanged) {
        this.currentData = newData
        this.onDataChange(newData, oldData)
      }
    } catch (error) {
      if (this.onError) {
        this.onError(error as Error)
      }
    }
  }

  /**
   * 获取绑定统计信息
   */
  getStats(): {
    id: string
    componentId: string
    active: boolean
    updateCount: number
    lastUpdateTime: Date | null
    triggerCount: number
    activeTriggers: number
  } {
    return {
      id: this.id,
      componentId: this.componentId,
      active: this.active,
      updateCount: this.updateCount,
      lastUpdateTime: this.lastUpdateTime,
      triggerCount: this.triggers.length,
      activeTriggers: this.triggers.filter(t => t.isActive()).length
    }
  }
}

// ========== 数据绑定管理器实现 ==========

export class DataBindingManagerImpl implements DataBindingManager {
  private bindings = new Map<string, ReactiveDataBinding>()
  private componentBindings = new Map<string, Set<string>>()

  createBinding(config: DataBindingConfig): ReactiveDataBinding {
    // 这里需要根据配置创建完整的管道和触发器
    // 在实际实现中，这会是一个复杂的工厂方法
    // 为了简化，我们先返回一个基础的绑定

    throw new Error('createBinding需要在具体使用时实现，需要完整的管道配置')
  }

  getBinding(id: string): ReactiveDataBinding | null {
    return this.bindings.get(id) || null
  }

  removeBinding(id: string): void {
    const binding = this.bindings.get(id)
    if (binding) {
      // 停止绑定
      if (binding.isActive()) {
        binding.stop()
      }

      // 从映射中移除
      this.bindings.delete(id)

      // 从组件绑定映射中移除
      const componentBindingSet = this.componentBindings.get(binding.componentId)
      if (componentBindingSet) {
        componentBindingSet.delete(id)
        if (componentBindingSet.size === 0) {
          this.componentBindings.delete(binding.componentId)
        }
      }
    }
  }

  getComponentBindings(componentId: string): ReactiveDataBinding[] {
    const bindingIds = this.componentBindings.get(componentId)
    if (!bindingIds) return []

    const bindings: ReactiveDataBinding[] = []
    bindingIds.forEach(bindingId => {
      const binding = this.bindings.get(bindingId)
      if (binding) {
        bindings.push(binding)
      }
    })

    return bindings
  }

  getActiveBindings(): ReactiveDataBinding[] {
    const activeBindings: ReactiveDataBinding[] = []
    this.bindings.forEach(binding => {
      if (binding.isActive()) {
        activeBindings.push(binding)
      }
    })
    return activeBindings
  }

  cleanup(): void {
    // 停止所有活跃的绑定
    this.bindings.forEach(binding => {
      if (binding.isActive()) {
        binding.stop()
      }
    })

    // 清空所有映射
    this.bindings.clear()
    this.componentBindings.clear()
  }

  /**
   * 注册数据绑定（用于手动创建的绑定）
   */
  registerBinding(binding: ReactiveDataBinding): void {
    this.bindings.set(binding.id, binding)

    // 更新组件绑定映射
    if (!this.componentBindings.has(binding.componentId)) {
      this.componentBindings.set(binding.componentId, new Set())
    }
    this.componentBindings.get(binding.componentId)!.add(binding.id)
  }

  /**
   * 获取管理器统计信息
   */
  getStats(): {
    totalBindings: number
    activeBindings: number
    componentCount: number
    bindingsByComponent: Record<string, number>
  } {
    const stats = {
      totalBindings: this.bindings.size,
      activeBindings: this.getActiveBindings().length,
      componentCount: this.componentBindings.size,
      bindingsByComponent: {} as Record<string, number>
    }

    this.componentBindings.forEach((bindingIds, componentId) => {
      stats.bindingsByComponent[componentId] = bindingIds.size
    })

    return stats
  }
}

// ========== 触发器工厂 ==========

export class UpdateTriggerFactory {
  /**
   * 创建定时器触发器
   */
  static createTimerTrigger(interval: number, immediate = false): TimerTrigger {
    return new TimerTrigger(interval, immediate)
  }

  /**
   * 创建WebSocket触发器
   */
  static createWebSocketTrigger(url: string, protocols?: string[]): WebSocketTrigger {
    return new WebSocketTrigger(url, protocols)
  }

  /**
   * 创建事件触发器
   */
  static createEventTrigger(eventName: string, target?: EventTarget): EventTrigger {
    return new EventTrigger(eventName, target)
  }

  /**
   * 创建手动触发器
   */
  static createManualTrigger(): ManualTrigger {
    return new ManualTrigger()
  }

  /**
   * 根据配置创建触发器
   */
  static createFromConfig(config: any): UpdateTrigger {
    switch (config.type) {
      case 'timer':
        return new TimerTrigger(config.interval, config.immediate)

      case 'websocket':
        return new WebSocketTrigger(config.url, config.protocols)

      case 'event':
        return new EventTrigger(config.eventName, config.target)

      case 'manual':
        return new ManualTrigger()

      default:
        throw new Error(`不支持的触发器类型: ${config.type}`)
    }
  }
}

// 🔧 修复：端口隔离的状态管理
const getPortId = (): string => {
  try {
    return `${window.location.protocol}//${window.location.host}`
  } catch {
    // 在SSR或测试环境中的fallback
    return 'default'
  }
}

// 存储每个端口的管理器实例
const bindingManagerInstances = new Map<string, DataBindingManagerImpl>()

/**
 * 获取当前端口隔离的数据绑定管理器实例
 */
export function getDataBindingManager(): DataBindingManagerImpl {
  const portId = getPortId()

  if (!bindingManagerInstances.has(portId)) {
    const manager = new DataBindingManagerImpl()
    bindingManagerInstances.set(portId, manager)
    console.log(`🔧 [DataBindingManager] 为端口 ${portId} 创建新实例`)
  }

  return bindingManagerInstances.get(portId)!
}

// 兼容性：保持原有的导出，但现在返回端口隔离的实例
export const dataBindingManager = getDataBindingManager()

export default {
  ReactiveDataBindingImpl,
  DataBindingManagerImpl,
  UpdateTriggerFactory,
  TimerTrigger,
  WebSocketTrigger,
  EventTrigger,
  ManualTrigger,
  dataBindingManager
}
