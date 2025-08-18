/**
 * Card2.1 组件交互管理器
 * 负责管理所有组件的交互配置和状态
 */

import type {
  InteractionConfig,
  InteractionResponse,
  ComponentInteractionState,
  InteractionEventType,
  InteractionResponseResult
} from './interaction-types'

class InteractionManager {
  private componentConfigs = new Map<string, InteractionConfig[]>()
  private componentStates = new Map<string, ComponentInteractionState>()
  private eventListeners = new Map<string, Set<(data: any) => void>>()

  /**
   * 注册组件的交互配置
   */
  registerComponent(componentId: string, configs: InteractionConfig[]): void {
    this.componentConfigs.set(componentId, configs)
    // 初始化组件状态
    this.componentStates.set(componentId, {})
    console.log(`[InteractionManager] 注册组件 ${componentId}，配置数量: ${configs.length}`)
  }

  /**
   * 移除组件的交互配置
   */
  unregisterComponent(componentId: string, configs: InteractionConfig[]): void {
    this.componentConfigs.delete(componentId)
    this.componentStates.delete(componentId)
    this.eventListeners.delete(componentId)
    console.log(`[InteractionManager] 移除组件 ${componentId}`)
  }

  /**
   * 触发交互事件
   */
  triggerEvent(componentId: string, event: InteractionEventType, data?: any): InteractionResponseResult[] {
    const configs = this.componentConfigs.get(componentId)
    if (!configs) {
      return [
        {
          success: false,
          componentId,
          action: 'custom' as any,
          error: `组件 ${componentId} 未注册`
        }
      ]
    }

    const results: InteractionResponseResult[] = []
    const eventConfigs = configs.filter(config => config.event === event && config.enabled !== false)

    // 按优先级排序
    eventConfigs.sort((a, b) => (b.priority || 0) - (a.priority || 0))

    for (const config of eventConfigs) {
      for (const response of config.responses) {
        try {
          const result = this.executeResponse(componentId, response)
          results.push(result)
        } catch (error) {
          results.push({
            success: false,
            componentId,
            action: response.action,
            error: error instanceof Error ? error.message : String(error)
          })
        }
      }
    }

    // 触发事件监听器
    this.triggerEventListeners(componentId, event, data)

    return results
  }

  /**
   * 执行交互响应
   */
  private executeResponse(componentId: string, response: InteractionResponse): InteractionResponseResult {
    const currentState = this.componentStates.get(componentId) || {}
    let oldValue: any
    let newValue: any

    switch (response.action) {
      case 'changeBackgroundColor':
        oldValue = currentState.backgroundColor
        newValue = response.value
        this.updateComponentState(componentId, { backgroundColor: newValue })
        break

      case 'changeTextColor':
        oldValue = currentState.textColor
        newValue = response.value
        this.updateComponentState(componentId, { textColor: newValue })
        break

      case 'changeBorderColor':
        oldValue = currentState.borderColor
        newValue = response.value
        this.updateComponentState(componentId, { borderColor: newValue })
        break

      case 'changeSize':
        oldValue = { width: currentState.width, height: currentState.height }
        newValue = response.value
        this.updateComponentState(componentId, {
          width: newValue.width || currentState.width,
          height: newValue.height || currentState.height
        })
        break

      case 'changeOpacity':
        oldValue = currentState.opacity
        newValue = response.value
        this.updateComponentState(componentId, { opacity: newValue })
        break

      case 'changeTransform':
        oldValue = currentState.transform
        newValue = response.value
        this.updateComponentState(componentId, { transform: newValue })
        break

      case 'changeVisibility':
        oldValue = currentState.visibility
        newValue = response.value
        this.updateComponentState(componentId, { visibility: newValue })
        break

      case 'changeContent':
        oldValue = currentState.content
        newValue = response.value
        this.updateComponentState(componentId, { content: newValue })
        break

      case 'triggerAnimation':
        oldValue = currentState.isAnimating
        newValue = true
        this.updateComponentState(componentId, { isAnimating: true })
        // 动画结束后重置状态
        setTimeout(() => {
          this.updateComponentState(componentId, { isAnimating: false })
        }, response.duration || 1000)
        break

      case 'custom':
        oldValue = currentState
        newValue = response.value
        // 自定义动作，直接更新状态
        if (typeof response.value === 'object') {
          this.updateComponentState(componentId, response.value)
        }
        break

      default:
        throw new Error(`不支持的交互动作: ${response.action}`)
    }

    return {
      success: true,
      componentId,
      action: response.action,
      oldValue,
      newValue
    }
  }

  /**
   * 更新组件状态
   */
  private updateComponentState(componentId: string, updates: Partial<ComponentInteractionState>): void {
    const currentState = this.componentStates.get(componentId) || {}
    const newState = { ...currentState, ...updates }
    this.componentStates.set(componentId, newState)
  }

  /**
   * 获取组件的交互状态
   */
  getComponentState(componentId: string): ComponentInteractionState | undefined {
    return this.componentStates.get(componentId)
  }

  /**
   * 重置组件的交互状态
   */
  resetComponentState(componentId: string): void {
    this.componentStates.set(componentId, {})
    console.log(`[InteractionManager] 重置组件 ${componentId} 的交互状态`)
  }

  /**
   * 批量更新组件的交互配置
   */
  updateComponentConfigs(componentId: string, configs: InteractionConfig[]): void {
    this.componentConfigs.set(componentId, configs)
    console.log(`[InteractionManager] 更新组件 ${componentId} 的交互配置，数量: ${configs.length}`)
  }

  /**
   * 添加事件监听器
   */
  addEventListener(componentId: string, callback: (data: any) => void): void {
    if (!this.eventListeners.has(componentId)) {
      this.eventListeners.set(componentId, new Set())
    }
    this.eventListeners.get(componentId)!.add(callback)
  }

  /**
   * 移除事件监听器
   */
  removeEventListener(componentId: string, callback: (data: any) => void): void {
    const listeners = this.eventListeners.get(componentId)
    if (listeners) {
      listeners.delete(callback)
    }
  }

  /**
   * 触发事件监听器
   */
  private triggerEventListeners(componentId: string, event: InteractionEventType, data?: any): void {
    const listeners = this.eventListeners.get(componentId)
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback({ event, data, componentId })
        } catch (error) {
          console.error(`[InteractionManager] 事件监听器执行失败:`, error)
        }
      })
    }
  }

  /**
   * 获取所有已注册的组件ID
   */
  getRegisteredComponents(): string[] {
    return Array.from(this.componentConfigs.keys())
  }

  /**
   * 获取组件的交互配置
   */
  getComponentConfigs(componentId: string): InteractionConfig[] | undefined {
    return this.componentConfigs.get(componentId)
  }

  /**
   * 检查组件是否已注册
   */
  hasComponent(componentId: string): boolean {
    return this.componentConfigs.has(componentId)
  }
}

// 创建单例实例
export const interactionManager = new InteractionManager()

// 导出类型
export type { InteractionManager }
