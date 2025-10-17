/**
 * 交互管理器
 * 简化的交互管理系统，专注于核心交互功能
 * 大幅简化原有的2700+行复杂实现
 */

import type {
  InteractionConfig,
  InteractionEvent,
  InteractionAction,
  InteractionHandler,
  InteractionContext,
  InteractionHandlerRegistration,
  InteractionManagerConfig,
  InteractionState,
  InteractionStats
} from './types'

/**
 * 交互管理器类
 */
export class InteractionManager {
  private static instance: InteractionManager
  private config: InteractionManagerConfig
  private handlers: Map<string, InteractionHandlerRegistration>
  private componentConfigs: Map<string, InteractionConfig>
  private state: InteractionState

  /**
   * 私有构造函数
   */
  private constructor(config: InteractionManagerConfig = {}) {
    this.config = {
      enableLogging: false,
      enableDebugMode: false,
      defaultPreventDefault: true,
      defaultStopPropagation: true,
      ...config
    }

    this.handlers = new Map()
    this.componentConfigs = new Map()
    this.state = {
      isEnabled: true,
      activeEvents: new Set(),
      eventHistory: []
    }

    // 注册默认处理器
    this.registerDefaultHandlers()
  }

  /**
   * 获取单例实例
   */
  static getInstance(config?: InteractionManagerConfig): InteractionManager {
    if (!InteractionManager.instance) {
      InteractionManager.instance = new InteractionManager(config)
    }
    return InteractionManager.instance
  }

  /**
   * 注册默认处理器
   */
  private registerDefaultHandlers(): void {
    this.registerHandler({
      type: 'navigate',
      handler: this.handleNavigate.bind(this),
      priority: 10
    })

    this.registerHandler({
      type: 'showMessage',
      handler: this.handleShowMessage.bind(this),
      priority: 5
    })

    this.registerHandler({
      type: 'updateData',
      handler: this.handleUpdateData.bind(this),
      priority: 8
    })

    this.registerHandler({
      type: 'toggleVisibility',
      handler: this.handleToggleVisibility.bind(this),
      priority: 7
    })
  }

  /**
   * 注册交互处理器
   */
  registerHandler(registration: InteractionHandlerRegistration): void {
    const key = `${registration.type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    this.handlers.set(key, registration)

    if (this.config.enableLogging) {
      console.log(`[InteractionManager] 注册处理器: ${registration.type} (${key})`)
    }
  }

  /**
   * 注册组件交互配置
   */
  registerComponentConfig(componentId: string, config: InteractionConfig): void {
    this.componentConfigs.set(componentId, config)

    if (this.config.enableLogging) {
      console.log(`[InteractionManager] 注册组件交互配置: ${componentId}`, {
        eventCount: Object.keys(config.events || {}).length
      })
    }
  }

  /**
   * 移除组件交互配置
   */
  removeComponentConfig(componentId: string): void {
    this.componentConfigs.delete(componentId)

    if (this.config.enableLogging) {
      console.log(`[InteractionManager] 移除组件交互配置: ${componentId}`)
    }
  }

  /**
   * 处理交互事件
   */
  async handleEvent(
    event: Event,
    componentId: string,
    eventType: string,
    context: InteractionContext
  ): Promise<boolean> {
    if (!this.state.isEnabled) {
      return false
    }

    const config = this.componentConfigs.get(componentId)
    if (!config || !config.events[eventType]) {
      return false
    }

    const interactionEvent = config.events[eventType]

    // 记录事件历史
    this.state.eventHistory.push({
      event: eventType as any,
      target: componentId,
      timestamp: Date.now()
    })

    // 限制历史记录数量
    if (this.state.eventHistory.length > 100) {
      this.state.eventHistory = this.state.eventHistory.slice(-100)
    }

    // 执行事件处理
    if (interactionEvent.preventDefault !== false && this.config.defaultPreventDefault) {
      event.preventDefault()
    }

    if (interactionEvent.stopPropagation !== false && this.config.defaultStopPropagation) {
      event.stopPropagation()
    }

    // 执行所有动作
    for (const action of interactionEvent.actions) {
      await this.executeAction(event, context, action)
    }

    return true
  }

  /**
   * 执行交互动作
   */
  private async executeAction(
    event: Event,
    context: InteractionContext,
    action: InteractionAction
  ): Promise<void> {
    try {
      // 查找处理器
      const handlers = Array.from(this.handlers.values())
        .filter(registration => registration.type === action.type)
        .sort((a, b) => (b.priority || 0) - (a.priority || 0))

      if (handlers.length === 0) {
        console.warn(`[InteractionManager] 未找到 ${action.type} 类型的处理器`)
        return
      }

      // 执行处理器
      for (const registration of handlers) {
        await registration.handler(event, context, action)
      }

      if (this.config.enableLogging) {
        console.log(`[InteractionManager] 执行动作: ${action.type}`, {
          componentId: context.componentId,
          componentType: context.componentType
        })
      }
    } catch (error) {
      console.error(`[InteractionManager] 执行动作失败: ${action.type}`, error)
    }
  }

  /**
   * 导航处理器
   */
  private async handleNavigate(
    event: Event,
    context: InteractionContext,
    action: InteractionAction
  ): Promise<void> {
    if (!action.target) {
      console.warn('[InteractionManager] 导航动作缺少目标路径')
      return
    }

    // 在实际项目中，这里应该使用路由系统
    console.log(`[InteractionManager] 导航到: ${action.target}`, {
      componentId: context.componentId
    })

    // 模拟路由跳转
    if (typeof window !== 'undefined') {
      window.location.hash = action.target
    }
  }

  /**
   * 显示消息处理器
   */
  private async handleShowMessage(
    event: Event,
    context: InteractionContext,
    action: InteractionAction
  ): Promise<void> {
    const message = action.message || '交互消息'

    // 在实际项目中，这里应该使用消息提示组件
    console.log(`[InteractionManager] 显示消息: ${message}`, {
      componentId: context.componentId
    })

    // 模拟消息提示
    if (typeof window !== 'undefined' && window.alert) {
      window.alert(message)
    }
  }

  /**
   * 更新数据处理器
   */
  private async handleUpdateData(
    event: Event,
    context: InteractionContext,
    action: InteractionAction
  ): Promise<void> {
    if (!action.data) {
      console.warn('[InteractionManager] 更新数据动作缺少数据')
      return
    }

    console.log(`[InteractionManager] 更新数据:`, {
      componentId: context.componentId,
      data: action.data
    })

    // 在实际项目中，这里应该更新组件数据或全局状态
    // 例如：context.componentData = { ...context.componentData, ...action.data }
  }

  /**
   * 切换可见性处理器
   */
  private async handleToggleVisibility(
    event: Event,
    context: InteractionContext,
    action: InteractionAction
  ): Promise<void> {
    const visible = action.visible !== undefined ? action.visible : true

    console.log(`[InteractionManager] 切换可见性: ${visible}`, {
      componentId: context.componentId,
      target: action.target
    })

    // 在实际项目中，这里应该更新组件的可见性状态
    // 例如：通过修改组件属性或全局状态来隐藏/显示组件
  }

  /**
   * 启用/禁用交互管理器
   */
  setEnabled(enabled: boolean): void {
    this.state.isEnabled = enabled

    if (this.config.enableLogging) {
      console.log(`[InteractionManager] ${enabled ? '启用' : '禁用'}交互管理器`)
    }
  }

  /**
   * 获取交互状态
   */
  getState(): InteractionState {
    return { ...this.state }
  }

  /**
   * 获取统计信息
   */
  getStats(): InteractionStats {
    const eventDistribution: Record<string, number> = {}
    this.state.eventHistory.forEach(record => {
      eventDistribution[record.event] = (eventDistribution[record.event] || 0) + 1
    })

    return {
      totalEvents: this.state.eventHistory.length,
      activeComponents: this.componentConfigs.size,
      registeredHandlers: this.handlers.size,
      eventDistribution
    }
  }

  /**
   * 清空事件历史
   */
  clearHistory(): void {
    this.state.eventHistory = []

    if (this.config.enableLogging) {
      console.log('[InteractionManager] 清空事件历史')
    }
  }

  /**
   * 销毁管理器
   */
  destroy(): void {
    this.handlers.clear()
    this.componentConfigs.clear()
    this.state.activeEvents.clear()
    this.state.eventHistory = []
    this.state.isEnabled = false

    if (this.config.enableLogging) {
      console.log('[InteractionManager] 销毁管理器')
    }
  }
}

/**
 * 全局交互管理器实例
 */
export const interactionManager = InteractionManager.getInstance()

/**
 * 默认导出
 */
export default InteractionManager