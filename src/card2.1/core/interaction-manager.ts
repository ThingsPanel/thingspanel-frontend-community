/**
 * Card2.1 组件交互管理器
 * 负责管理所有组件的交互配置和状态
 */

import type {
  InteractionConfig,
  InteractionResponse,
  ComponentInteractionState,
  InteractionEventType,
  InteractionResponseResult,
  ConditionConfig,
  ComparisonOperator,
  NavigationConfig,
  DataUpdateConfig,
  FlashConfig,
  CrossComponentResponse
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
      console.warn(`[InteractionManager] 组件 ${componentId} 未注册`)
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

    console.log(`[INTERACTION-DEBUG] ${event}事件 -> 找到${eventConfigs.length}个配置`)

    // 按优先级排序
    eventConfigs.sort((a, b) => (b.priority || 0) - (a.priority || 0))

    for (const config of eventConfigs) {
      console.log(`[INTERACTION-DEBUG] 配置详情: responses=${config.responses?.length || 0}, 条件:`, config.condition)

      // 🔥 修复：对于 dataChange 事件，需要检查条件
      if (event === 'dataChange' && config.condition) {
        // 检查属性变化条件
        const shouldExecute = this.checkDataChangeCondition(config, data)
        console.log(`[INTERACTION-DEBUG] 条件检查结果: ${shouldExecute}`)

        if (!shouldExecute) {
          console.log(`[INTERACTION-DEBUG] 条件不满足，跳过执行`)
          continue
        }
      }

      // 🔥 重点：检查是否有响应动作
      if (!config.responses || config.responses.length === 0) {
        console.error(`[INTERACTION-DEBUG] ❌ 配置中没有响应动作！`)
        continue
      }

      // 执行响应动作
      console.log(`[INTERACTION-DEBUG] 开始执行${config.responses.length}个响应动作`)
      for (const response of config.responses) {
        try {
          console.log(`[INTERACTION-DEBUG] 执行动作: ${response.action}, 参数:`, response)
          const result = this.executeResponse(componentId, response)
          results.push(result)
          console.log(`[INTERACTION-DEBUG] ✅ 动作执行成功`)
        } catch (error) {
          console.error(`[INTERACTION-DEBUG] ❌ 动作执行失败:`, error)
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

    console.log(`[InteractionManager] 事件处理完成，结果数量: ${results.length}`)
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

      // 🔥 移除动画功能

      case 'navigateToUrl':
        this.handleNavigateToUrl(response)
        oldValue = undefined
        newValue = response.value
        break

      case 'updateComponentData':
        oldValue = currentState
        newValue = response.value
        // 对于跨组件数据更新，需要找到目标组件
        if (response.targetComponentId) {
          this.updateTargetComponentData(response.targetComponentId, response)
        } else {
          this.updateComponentState(componentId, response.value)
        }
        break

      case 'flashColor':
        this.handleFlashColor(componentId, response.value)
        oldValue = currentState.backgroundColor
        newValue = response.value
        break

      case 'conditionalStyle':
        oldValue = currentState
        newValue = response.value
        this.applyConditionalStyle(componentId, response.value)
        break

      case 'callFunction':
        this.handleCallFunction(componentId, response.value)
        oldValue = undefined
        newValue = response.value
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

    console.log(`[INTERACTION-DEBUG] 更新组件状态:`, {
      componentId,
      updates,
      newState
    })

    // 🔥 通知目标组件状态变化
    this.notifyComponentStateChange(componentId, updates, newState)
  }

  /**
   * 通知组件状态变化
   */
  private notifyComponentStateChange(
    componentId: string,
    updates: Partial<ComponentInteractionState>,
    fullState: ComponentInteractionState
  ): void {
    // 尝试通过DOM事件通知组件
    const targetElement = document.querySelector(`[data-component-id="${componentId}"]`)

    if (targetElement) {
      const customEvent = new CustomEvent('componentStateUpdate', {
        detail: {
          componentId,
          updates,
          fullState
        },
        bubbles: true
      })

      console.log(`[INTERACTION-DEBUG] 向组件发送状态更新事件:`, {
        componentId,
        updates
      })

      targetElement.dispatchEvent(customEvent)
    } else {
      console.warn(`[INTERACTION-DEBUG] 未找到目标组件DOM元素: ${componentId}`)
    }
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

  // ===== 新增的动作处理方法 =====

  /**
   * 处理URL跳转
   */
  private handleNavigateToUrl(response: InteractionResponse): void {
    const url = response.value as string
    const target = (response.target as string) || '_self'
    const windowFeatures = (response.windowFeatures as string) || ''

    if (!url) {
      console.error('[InteractionManager] URL跳转失败: 未提供URL')
      return
    }

    try {
      console.log(`[InteractionManager] 准备跳转到: ${url}, 打开方式: ${target}`)

      if (target === '_self') {
        // 当前窗口跳转
        window.location.href = url
      } else if (target === '_blank') {
        // 新窗口打开，支持窗口特性配置
        if (windowFeatures) {
          window.open(url, target, windowFeatures)
          console.log(`[InteractionManager] 新窗口打开: ${url}, 窗口特性: ${windowFeatures}`)
        } else {
          window.open(url, target)
          console.log(`[InteractionManager] 新窗口打开: ${url}`)
        }
      } else {
        // 其他目标(_parent, _top等)
        window.open(url, target)
        console.log(`[InteractionManager] 跳转到: ${url}, 目标: ${target}`)
      }
    } catch (error) {
      console.error('[InteractionManager] URL跳转失败:', error)
      // 如果跳转失败，尝试简单的window.open
      try {
        window.open(url, '_blank')
        console.log(`[InteractionManager] 降级跳转成功: ${url}`)
      } catch (fallbackError) {
        console.error('[InteractionManager] 降级跳转也失败:', fallbackError)
      }
    }
  }

  /**
   * 处理闪烁颜色效果
   */
  private handleFlashColor(componentId: string, config: FlashConfig | string): void {
    let flashConfig: FlashConfig

    if (typeof config === 'string') {
      flashConfig = {
        color: config,
        duration: 1000,
        times: 3
      }
    } else {
      flashConfig = config
    }

    const currentState = this.getComponentState(componentId)
    const originalColor = currentState?.backgroundColor

    let currentFlash = 0
    const interval = setInterval(
      () => {
        // 切换颜色
        const isFlashOn = currentFlash % 2 === 0
        this.updateComponentState(componentId, {
          backgroundColor: isFlashOn ? flashConfig.color : originalColor
        })

        currentFlash++
        if (currentFlash >= flashConfig.times * 2) {
          clearInterval(interval)
          // 恢复原始颜色
          this.updateComponentState(componentId, {
            backgroundColor: originalColor
          })
        }
      },
      flashConfig.duration / (flashConfig.times * 2)
    )

    console.log(`[InteractionManager] 执行闪烁效果: ${componentId}`)
  }

  /**
   * 更新目标组件数据
   */
  private updateTargetComponentData(targetComponentId: string, response: InteractionResponse): void {
    if (!this.hasComponent(targetComponentId)) {
      console.warn(`[InteractionManager] 目标组件 ${targetComponentId} 未注册`)
      return
    }

    // 使用新的InteractionResponse格式
    if (response.targetProperty && response.updateValue !== undefined) {
      const currentState = this.getComponentState(targetComponentId) || {}
      let newValue = response.updateValue

      // 根据更新模式处理值
      const updateMode = response.updateMode || 'replace'
      const targetProperty = response.targetProperty
      const currentValue = currentState[targetProperty]

      switch (updateMode) {
        case 'append':
          if (currentValue !== undefined) {
            newValue = String(currentValue) + String(newValue)
          }
          break
        case 'prepend':
          if (currentValue !== undefined) {
            newValue = String(newValue) + String(currentValue)
          }
          break
        case 'replace':
        default:
          // 直接使用新值
          break
      }

      // 🔥 增强：特殊处理visibility属性确保正确应用
      const updateData: Partial<ComponentInteractionState> = {
        [targetProperty]: newValue
      }

      // 如果是可见性属性，确保直接应用到CSS样式
      if (targetProperty === 'visibility') {
        updateData.visibility = newValue as string
        console.log(`[INTERACTION-DEBUG] 特殊处理可见性属性: ${targetProperty} = ${newValue}`)
      }

      // 更新目标组件状态
      this.updateComponentState(targetComponentId, updateData)

      console.log(
        `[InteractionManager] 更新目标组件数据: ${targetComponentId}.${targetProperty} = ${newValue} (模式: ${updateMode})`
      )
    } else {
      // 如果没有指定targetProperty，直接更新整个状态
      this.updateComponentState(targetComponentId, response.value)
      console.log(`[InteractionManager] 直接更新目标组件状态: ${targetComponentId}`)
    }
  }

  /**
   * 应用条件样式
   */
  private applyConditionalStyle(componentId: string, styleConfig: any): void {
    if (typeof styleConfig === 'object') {
      this.updateComponentState(componentId, styleConfig)
      console.log(`[InteractionManager] 应用条件样式: ${componentId}`)
    }
  }

  /**
   * 调用函数
   */
  private handleCallFunction(componentId: string, functionConfig: any): void {
    try {
      if (typeof functionConfig === 'string') {
        // 如果是字符串，尝试作为函数名调用
        if (window[functionConfig] && typeof window[functionConfig] === 'function') {
          window[functionConfig](componentId)
        }
      } else if (typeof functionConfig === 'function') {
        // 直接调用函数
        functionConfig(componentId)
      } else if (functionConfig && typeof functionConfig.name === 'string') {
        // 配置对象，包含函数名和参数
        const funcName = functionConfig.name
        const args = functionConfig.args || []
        if (window[funcName] && typeof window[funcName] === 'function') {
          window[funcName](componentId, ...args)
        }
      }
      console.log(`[InteractionManager] 调用函数: ${componentId}`)
    } catch (error) {
      console.error('[InteractionManager] 函数调用失败:', error)
    }
  }

  // ===== 条件判断方法 =====

  /**
   * 🔥 检查 dataChange 事件的条件
   * 专门处理属性变化事件的条件判断
   */
  private checkDataChangeCondition(config: InteractionConfig, eventData: any): boolean {
    const condition = config.condition
    if (!condition) return true // 没有条件则直接执行

    // 检查是否为指定属性的变化
    if (condition.property && eventData?.property !== condition.property) {
      return false
    }

    // 使用新值进行条件判断
    const valueToCheck = eventData?.newValue

    // 根据条件类型进行判断
    switch (condition.operator) {
      case 'equals':
        const result = String(valueToCheck) === String(condition.value)
        console.log(`[INTERACTION-DEBUG] 条件判断: "${valueToCheck}" === "${condition.value}" => ${result}`)
        return result

      case 'notEquals':
        return String(valueToCheck) !== String(condition.value)

      case 'greaterThan':
        return Number(valueToCheck) > Number(condition.value)

      case 'greaterThanOrEqual':
        return Number(valueToCheck) >= Number(condition.value)

      case 'lessThan':
        return Number(valueToCheck) < Number(condition.value)

      case 'lessThanOrEqual':
        return Number(valueToCheck) <= Number(condition.value)

      case 'contains':
        return String(valueToCheck).includes(String(condition.value))

      case 'startsWith':
        return String(valueToCheck).startsWith(String(condition.value))

      case 'endsWith':
        return String(valueToCheck).endsWith(String(condition.value))

      default:
        console.warn(`[INTERACTION-DEBUG] 不支持操作符: ${condition.operator}`)
        return false
    }
  }

  /**
   * 评估条件是否满足
   */
  evaluateCondition(condition: ConditionConfig, data: any): boolean {
    if (!condition || !data) return false

    switch (condition.type) {
      case 'comparison':
        return this.evaluateComparison(condition, data)
      case 'range':
        return this.evaluateRange(condition, data)
      case 'expression':
        return this.evaluateExpression(condition, data)
      default:
        return false
    }
  }

  /**
   * 评估比较条件
   */
  private evaluateComparison(condition: ConditionConfig, data: any): boolean {
    const value = condition.field ? data[condition.field] : data
    const compareValue = condition.value

    switch (condition.operator) {
      case 'equals':
        return value == compareValue
      case 'notEquals':
        return value != compareValue
      case 'greaterThan':
        return Number(value) > Number(compareValue)
      case 'greaterThanOrEqual':
        return Number(value) >= Number(compareValue)
      case 'lessThan':
        return Number(value) < Number(compareValue)
      case 'lessThanOrEqual':
        return Number(value) <= Number(compareValue)
      case 'contains':
        return String(value).includes(String(compareValue))
      case 'startsWith':
        return String(value).startsWith(String(compareValue))
      case 'endsWith':
        return String(value).endsWith(String(compareValue))
      default:
        return false
    }
  }

  /**
   * 评估范围条件
   */
  private evaluateRange(condition: ConditionConfig, data: any): boolean {
    const value = condition.field ? data[condition.field] : data
    const numValue = Number(value)
    const min = Number(condition.minValue)
    const max = Number(condition.maxValue)

    return numValue >= min && numValue <= max
  }

  /**
   * 评估表达式条件
   */
  private evaluateExpression(condition: ConditionConfig, data: any): boolean {
    if (!condition.expression) return false

    try {
      // 创建一个安全的评估环境
      const expression = condition.expression.replace(/\bvalue\b/g, 'data')
      // 简单的表达式评估，实际项目中可能需要更安全的方式
      return new Function('data', `return ${expression}`)(data)
    } catch (error) {
      console.error('[InteractionManager] 表达式评估失败:', error)
      return false
    }
  }

  /**
   * 触发条件检查和执行
   */
  checkAndTriggerConditional(componentId: string, data: any): void {
    const configs = this.componentConfigs.get(componentId)
    if (!configs) return

    // 过滤条件触发和数据变化事件的配置
    const conditionalConfigs = configs.filter(
      config =>
        (config.event === 'conditional' || config.event === 'dataChange') &&
        config.enabled !== false &&
        config.condition
    )

    for (const config of conditionalConfigs) {
      if (config.condition && this.evaluateCondition(config.condition, data)) {
        // 条件满足，执行响应动作
        for (const response of config.responses) {
          try {
            this.executeResponse(componentId, response)
          } catch (error) {
            console.error('[InteractionManager] 条件触发执行失败:', error)
          }
        }
      }
    }
  }

  /**
   * 监听数据变化并触发条件检查
   */
  onDataChange(componentId: string, dataPath: string, newValue: any): void {
    // 检查是否有数据变化监听配置
    const configs = this.componentConfigs.get(componentId)
    if (!configs) return

    const dataChangeConfigs = configs.filter(
      config => config.event === 'dataChange' && config.dataPath === dataPath && config.enabled !== false
    )

    for (const config of dataChangeConfigs) {
      if (config.condition) {
        // 有条件的数据变化
        if (this.evaluateCondition(config.condition, newValue)) {
          this.executeConfigResponses(componentId, config)
        }
      } else {
        // 无条件的数据变化
        this.executeConfigResponses(componentId, config)
      }
    }
  }

  /**
   * 执行配置的所有响应动作
   */
  private executeConfigResponses(componentId: string, config: InteractionConfig): void {
    for (const response of config.responses) {
      try {
        this.executeResponse(componentId, response)
      } catch (error) {
        console.error('[InteractionManager] 响应执行失败:', error)
      }
    }
  }
}

// 创建单例实例
export const interactionManager = new InteractionManager()

// 导出类型
export type { InteractionManager }
