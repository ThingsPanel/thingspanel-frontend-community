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
  CrossComponentResponse,
  JumpConfig,
  ModifyConfig
} from './interaction-types'

// 导入配置管理相关模块（避免使用 require）
import { configEventBus } from '@/core/data-architecture/ConfigEventBus'
import { configurationIntegrationBridge } from '@/components/visual-editor/configuration/ConfigurationIntegrationBridge'
import { InteractionAdapter } from '@/card2.1/core/interaction-adapter'
import { VisualEditorBridge } from '@/core/data-architecture/VisualEditorBridge'
import { propertyBindingLogger } from '@/utils/logger'
// 🔥 简化：移除过度复杂的路径管理器，使用简单的字符串操作

class InteractionManager {
  private componentConfigs = new Map<string, InteractionConfig[]>()
  private componentStates = new Map<string, ComponentInteractionState>()
  private eventListeners = new Map<string, Set<(data: any) => void>>()
  private visualEditorBridge = new VisualEditorBridge()

  // 🔥 新增：存储需要响应属性变化的HTTP数据源映射
  private httpDataSourceMappings = new Map<string, string>()

  // 🔥 新增：配置变化监听器清理函数映射
  private configChangeListeners = new Map<string, () => void>()

  // 🔥 新增：已初始化的标记
  private isInitialized = false

  // 🔥 新增：ConfigEventBus数据执行触发器清理函数
  private dataExecutionTriggerCleanup: (() => void) | null = null

  /**
   * 🔥 初始化InteractionManager
   * 设置全局配置变化监听器
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return
    }

    try {
      // 设置全局配置变化监听
      await this.setupGlobalConfigurationListener()

      // 🔥 关键修复：注册ConfigEventBus数据执行触发器

      const { registerDataExecutionTrigger } = await import('@/core/data-architecture/ConfigEventBus')

      this.dataExecutionTriggerCleanup = registerDataExecutionTrigger(this.handleDataExecutionTrigger.bind(this))

      this.isInitialized = true
    } catch (error) {
      console.error(`❌ [InteractionManager] 初始化失败`, error)
    }
  }

  /**
   * 注册组件的交互配置
   */
  registerComponent(componentId: string, configs: InteractionConfig[]): void {
    this.componentConfigs.set(componentId, configs)
    // 初始化组件状态
    this.componentStates.set(componentId, {})

    // 🔥 为这个组件设置配置变化监听
    this.setupComponentConfigurationListener(componentId).catch(error => {
      console.error(`❌ [InteractionManager] 设置组件配置监听器失败`, { componentId, error })
    })

    // 🔥 检查组件配置中是否有HTTP数据源，并存储映射
    // 临时注释：修复方法调用错误
    try {
      this.checkAndStoreHttpDataSourceMapping(componentId, configs)
    } catch (error) {
      console.error(`[InteractionManager] HTTP数据源映射检查失败，忽略:`, error)
    }
  }

  /**
   * 移除组件的交互配置
   */
  unregisterComponent(componentId: string, configs: InteractionConfig[]): void {
    this.componentConfigs.delete(componentId)
    this.componentStates.delete(componentId)
    this.eventListeners.delete(componentId)

    // 🔥 清理配置变化监听器
    this.cleanupComponentConfigurationListener(componentId)
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
      // 🔥 修复：对于 dataChange 事件，需要检查条件
      if (event === 'dataChange' && config.condition) {
        // 检查属性变化条件
        const shouldExecute = this.checkDataChangeCondition(config, data)

        if (!shouldExecute) {
          continue
        }
      }

      // 🔥 重点：检查是否有响应动作
      if (!config.responses || config.responses.length === 0) {
        continue
      }

      // 执行响应动作
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

    // 🔥 使用适配器统一处理新旧格式
    const normalizedResponse = InteractionAdapter.normalizeToNewFormat(response as any)
    const actionType = InteractionAdapter.getUnifiedActionType(response as any)

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

      // 🔥 新版本动作类型 - jump (URL跳转)
      case 'jump':
        oldValue = undefined
        if (response.jumpConfig) {
          // 使用新的 jumpConfig 结构
          newValue = response.jumpConfig
          this.handleJumpAction(response.jumpConfig)
        } else {
          // 向后兼容：从旧字段提取数据
          const legacyUrl = response.value as string
          const legacyTarget = response.target || '_self'
          newValue = { jumpType: 'external', url: legacyUrl, target: legacyTarget }
          this.handleNavigateToUrl(response)
        }
        break

      // 🔥 新版本动作类型 - modify (修改组件属性)
      case 'modify':
        oldValue = currentState
        if (response.modifyConfig) {
          // 使用新的 modifyConfig 结构
          newValue = response.modifyConfig
          this.handleModifyAction(componentId, response.modifyConfig)
        } else {
          // 向后兼容：从旧字段提取数据
          newValue = response.value
          if (response.targetComponentId) {
            this.updateTargetComponentData(response.targetComponentId, response)
          } else {
            this.updateComponentState(componentId, response.value)
          }
        }
        break

      // 🔥 保留旧版本动作类型以支持向后兼容
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

    // 🔥 关键修复：同步状态到配置管理器
    this.syncToConfigurationManager(componentId, updates)

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

    // 🔥 跨组件交互调试日志

    if (targetElement) {
      const customEvent = new CustomEvent('componentStateUpdate', {
        detail: {
          componentId,
          updates,
          fullState
        },
        bubbles: true
      })

      targetElement.dispatchEvent(customEvent)
    }
  }

  /**
   * 🔥 关键修复：防循环的组件属性更新通知机制
   * 用于跨组件属性绑定，将一个组件的属性变更传递给另一个组件
   */
  private notificationInProgress = new Set<string>()
  private notificationDebounce = new Map<string, NodeJS.Timeout>()

  notifyPropertyUpdate(componentId: string, propertyPath: string, newValue: any, oldValue?: any): void {
    // 🔥 关键修复1：防止递归通知
    const notificationKey = `${componentId}:${propertyPath}:${JSON.stringify(newValue)}`
    if (this.notificationInProgress.has(notificationKey)) {
      return
    }

    // 🔥 关键修复2：防抖处理，避免同一属性的频繁更新
    const debounceKey = `${componentId}:${propertyPath}`
    if (this.notificationDebounce.has(debounceKey)) {
      clearTimeout(this.notificationDebounce.get(debounceKey)!)
    }

    this.notificationDebounce.set(debounceKey, setTimeout(() => {
      this.notificationInProgress.add(notificationKey)

      try {
        // 🔥 性能优化：只在开发模式下输出详细日志
        // 🚀 架构修复：通过更新数据源配置来触发执行器，而不是直接刷新
        this.triggerDataSourceConfigUpdateForPropertyChange(componentId, propertyPath, newValue, oldValue)

        // 通过 DOM 事件通知组件属性更新（异步处理，避免阻塞）
        setTimeout(() => {
          const targetElement = document.querySelector(`[data-component-id="${componentId}"]`)

          if (targetElement) {
            const propertyUpdateEvent = new CustomEvent('componentPropertyUpdate', {
              detail: {
                componentId,
                propertyPath,
                value: newValue,
                oldValue,
                timestamp: Date.now(),
                source: 'interaction-manager'
              },
              bubbles: true
            })

            targetElement.dispatchEvent(propertyUpdateEvent)
          }
        }, 50)

        // 异步触发交互系统的 dataChange 事件
        setTimeout(() => {
          this.triggerEvent(componentId, 'dataChange', {
            property: propertyPath,
            newValue,
            oldValue,
            timestamp: Date.now()
          })
        }, 100)
      } finally {
        // 清理状态
        setTimeout(() => {
          this.notificationInProgress.delete(notificationKey)
        }, 1000) // 1秒后清理，避免短期内的重复通知

        this.notificationDebounce.delete(debounceKey)
      }
    }, 100)) // 100ms防抖延迟
  }

  /**
   * 🔥 关键修复：防循环的批量属性更新
   * 一次性更新组件的多个属性，避免多次循环调用
   */
  batchPropertyUpdate(
    componentId: string,
    propertyUpdates: Array<{
      propertyPath: string
      newValue: any
      oldValue?: any
    }>
  ): void {
    if (propertyUpdates.length === 0) return

    // 🔥 关键修复：批量处理，避免单个属性的递归调用
    const batchKey = `batch-${componentId}-${Date.now()}`


    // 批量处理数据源配置更新
    propertyUpdates.forEach(update => {
      this.triggerDataSourceConfigUpdateForPropertyChange(
        componentId,
        update.propertyPath,
        update.newValue,
        update.oldValue
      )
    })

    // 异步发送批量更新事件，避免阻塞
    setTimeout(() => {
      const targetElement = document.querySelector(`[data-component-id="${componentId}"]`)

      if (targetElement) {
        // 发送批量更新事件
        const batchUpdateEvent = new CustomEvent('componentBatchPropertyUpdate', {
          detail: {
            componentId,
            updates: propertyUpdates,
            timestamp: Date.now(),
            batchKey
          },
          bubbles: true
        })

        targetElement.dispatchEvent(batchUpdateEvent)

        // 🔥 关键修复：不再调用单个notifyPropertyUpdate，避免递归
        // 直接发送单个事件，但不触发额外处理
        propertyUpdates.forEach(update => {
          const individualEvent = new CustomEvent('componentPropertyUpdate', {
            detail: {
              componentId,
              propertyPath: update.propertyPath,
              value: update.newValue,
              oldValue: update.oldValue,
              timestamp: Date.now(),
              source: 'batch-update',
              batchKey
            },
            bubbles: true
          })
          targetElement.dispatchEvent(individualEvent)
        })
      }
    }, 50)
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
  }

  /**
   * 批量更新组件的交互配置
   */
  updateComponentConfigs(componentId: string, configs: InteractionConfig[]): void {
    this.componentConfigs.set(componentId, configs)
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
        } catch (error) {}
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

  // ===== 新版本动作处理方法 =====

  /**
   * 处理跳转动作 (新版本)
   */
  private handleJumpAction(jumpConfig: JumpConfig): void {
    if (jumpConfig.jumpType === 'external') {
      // 外部URL跳转
      if (!jumpConfig.url) {
        return
      }
      this.navigateToUrl(jumpConfig.url, jumpConfig.target || '_self', jumpConfig.windowFeatures)
    } else if (jumpConfig.jumpType === 'internal') {
      // 内部菜单跳转
      if (!jumpConfig.internalPath) {
        return
      }
      this.navigateToUrl(jumpConfig.internalPath, jumpConfig.target || '_self')
    }
  }

  /**
   * 处理修改动作 (新版本)
   */
  private handleModifyAction(sourceComponentId: string, modifyConfig: ModifyConfig): void {
    const { targetComponentId, targetProperty, updateValue, updateMode = 'replace' } = modifyConfig

    if (!this.hasComponent(targetComponentId)) {
      return
    }

    const currentState = this.getComponentState(targetComponentId) || {}
    let finalValue = updateValue

    // 根据更新模式处理值
    const currentValue = currentState[targetProperty]
    switch (updateMode) {
      case 'append':
        if (currentValue !== undefined) {
          finalValue = String(currentValue) + String(updateValue)
        }
        break
      case 'prepend':
        if (currentValue !== undefined) {
          finalValue = String(updateValue) + String(currentValue)
        }
        break
      case 'replace':
      default:
        // 直接使用新值
        break
    }

    // 更新目标组件状态
    const updateData: Partial<ComponentInteractionState> = {
      [targetProperty]: finalValue
    }

    this.updateComponentState(targetComponentId, updateData)
  }

  /**
   * 通用URL导航方法
   */
  private navigateToUrl(url: string, target: string = '_self', windowFeatures?: string): void {
    try {
      if (target === '_self') {
        // 当前窗口跳转
        window.location.href = url
      } else if (target === '_blank') {
        // 新窗口打开，支持窗口特性配置
        if (windowFeatures) {
          window.open(url, target, windowFeatures)
        } else {
          window.open(url, target)
        }
      } else {
        // 其他目标(_parent, _top等)
        window.open(url, target)
      }
    } catch (error) {
      // 如果跳转失败，尝试简单的window.open
      try {
        window.open(url, '_blank')
      } catch (fallbackError) {}
    }
  }

  // ===== 旧版本动作处理方法 (保留兼容性) =====

  /**
   * 处理URL跳转 (旧版本)
   */
  private handleNavigateToUrl(response: InteractionResponse): void {
    const url = response.value as string
    const target = (response.target as string) || '_self'
    const windowFeatures = (response.windowFeatures as string) || ''

    if (!url) {
      return
    }

    try {
      if (target === '_self') {
        // 当前窗口跳转
        window.location.href = url
      } else if (target === '_blank') {
        // 新窗口打开，支持窗口特性配置
        if (windowFeatures) {
          window.open(url, target, windowFeatures)
        } else {
          window.open(url, target)
        }
      } else {
        // 其他目标(_parent, _top等)
        window.open(url, target)
      }
    } catch (error) {
      // 如果跳转失败，尝试简单的window.open
      try {
        window.open(url, '_blank')
      } catch (fallbackError) {}
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
  }

  /**
   * 更新目标组件数据
   */
  private updateTargetComponentData(targetComponentId: string, response: InteractionResponse): void {
    if (!this.hasComponent(targetComponentId)) {
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
      }

      // 更新目标组件状态
      this.updateComponentState(targetComponentId, updateData)
    } else {
      // 如果没有指定targetProperty，直接更新整个状态
      this.updateComponentState(targetComponentId, response.value)
    }
  }

  /**
   * 应用条件样式
   */
  private applyConditionalStyle(componentId: string, styleConfig: any): void {
    if (typeof styleConfig === 'object') {
      this.updateComponentState(componentId, styleConfig)
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
    } catch (error) {}
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
      case 'equals': {
        const result = String(valueToCheck) === String(condition.value)
        return result
      }

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
          } catch (error) {}
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
      } catch (error) {}
    }
  }

  // ===== 🔥 新增：属性绑定和参数解析支持 =====

  /**
   * 🚀 解析属性绑定表达式（使用统一路径格式）
   * 支持格式：componentInstanceId.propertyPath (如 comp-123.customize.title)
   * 🔥 增强：支持从基础配置中读取设备字段
   */
  resolvePropertyBinding(bindingExpression: string): any {
    if (!bindingExpression || typeof bindingExpression !== 'string') {
      return undefined
    }

    // 🔥 简化：使用简单的字符串解析替代复杂路径管理器
    const parts = bindingExpression.split('.')
    if (parts.length < 2) {
      console.error(`[InteractionManager] 无效的属性绑定表达式: ${bindingExpression}`)
      return undefined
    }

    const componentInstanceId = parts[0]
    const propertyPath = parts.slice(1).join('.')

    // 🔥 增强：首先尝试从基础配置中获取属性值
    const baseConfigValue = this.getPropertyFromBaseConfiguration(componentInstanceId, propertyPath)
    if (baseConfigValue !== undefined) {
      return baseConfigValue
    }

    // 🔥 然后尝试从交互状态中获取属性值
    const componentState = this.getComponentState(componentInstanceId)
    if (componentState) {
      const stateValue = this.getNestedProperty(componentState, propertyPath)

    }

    console.error(`[InteractionManager] 属性解析失败: ${bindingExpression}`, {
      componentInstanceId,
      propertyPath,
      hasComponentState: !!componentState,
      stateKeys: componentState ? Object.keys(componentState) : []
    })

    return undefined
  }

  /**
   * 批量解析属性绑定
   * 用于 HTTP 参数中包含多个绑定表达式的情况
   */
  resolveMultipleBindings(bindingMap: Record<string, string>): Record<string, any> {
    const resolvedValues: Record<string, any> = {}

    for (const [key, bindingExpression] of Object.entries(bindingMap)) {
      resolvedValues[key] = this.resolvePropertyBinding(bindingExpression)
    }
    return resolvedValues
  }

  /**
   * 处理动态参数解析
   * 用于 HttpConfigForm 中的参数绑定
   */
  resolveDynamicParameter(parameterConfig: any): any {
    if (!parameterConfig) return undefined

    // 如果是简单的字符串绑定表达式
    if (typeof parameterConfig === 'string') {
      return this.resolvePropertyBinding(parameterConfig)
    }

    // 如果是复杂的参数配置对象
    if (
      parameterConfig.type === 'component-property-binding' &&
      parameterConfig.componentId &&
      parameterConfig.propertyPath
    ) {
      const bindingExpression = `${parameterConfig.componentId}.${parameterConfig.propertyPath}`
      return this.resolvePropertyBinding(bindingExpression)
    }

    // 如果是静态值
    if (parameterConfig.type === 'static' || parameterConfig.value !== undefined) {
      return parameterConfig.value
    }
    return undefined
  }

  /**
   * 🔥 新增：设置组件属性值
   * 用于从外部（如 HTTP 响应）更新组件属性
   * 🔥 增强：支持更新基础配置中的设备字段
   */
  setComponentProperty(componentId: string, propertyPath: string, newValue: any): boolean {
    // 🔥 首先尝试更新基础配置中的属性
    const wasUpdatedInBaseConfig = this.setPropertyInBaseConfiguration(componentId, propertyPath, newValue)

    if (wasUpdatedInBaseConfig) {
      // 如果成功更新了基础配置，获取旧值用于通知
      const oldValue = this.getPropertyFromBaseConfiguration(componentId, propertyPath)

      // 通知组件属性更新
      this.notifyPropertyUpdate(componentId, propertyPath, newValue, oldValue)


      return true
    }

    // 🔥 如果不是基础配置字段，则更新交互状态
    const currentState = this.getComponentState(componentId) || {}
    const oldValue = this.getNestedProperty(currentState, propertyPath)

    // 更新组件状态
    const updatedState = this.setNestedProperty(currentState, propertyPath, newValue)
    this.componentStates.set(componentId, updatedState)

    // 通知组件属性更新
    this.notifyPropertyUpdate(componentId, propertyPath, newValue, oldValue)



    return true
  }

  /**
   * 🔥 从基础配置中获取属性值
   * 支持读取 BaseConfiguration 中的设备字段和其他基础配置项
   */
  private getPropertyFromBaseConfiguration(componentInstanceId: string, propertyPath: string): any {
    try {
      // 🔥 使用顶部导入的配置管理器

      // 获取组件的完整配置
      const fullConfig = configurationIntegrationBridge.getConfiguration(componentInstanceId)
      if (!fullConfig || !fullConfig.base) {
        return undefined
      }

      const baseConfig = fullConfig.base

      // 🔥 特殊处理已知的基础配置字段
      const baseConfigFields = [
        'deviceId',
        'metricsList',
        'showTitle',
        'title',
        'visible',
        'opacity',
        'backgroundColor',
        'borderWidth',
        'borderColor',
        'borderRadius',
        'padding',
        'margin'
      ]

      // 如果请求的是基础配置字段，直接从 base 配置中获取
      if (baseConfigFields.includes(propertyPath)) {
        const value = baseConfig[propertyPath]
        return value
      }

      // 🔥 处理嵌套路径（如 padding.top）
      const value = this.getNestedProperty(baseConfig, propertyPath)
      return value
    } catch (error) {
      console.error(`[InteractionManager] 获取基础配置属性失败`, {
        componentInstanceId,
        propertyPath,
        error: error instanceof Error ? error.message : error
      })
      return undefined
    }
  }

  /**
   * 🔥 设置基础配置中的属性值
   * 支持更新 BaseConfiguration 中的设备字段和其他基础配置项
   */
  private setPropertyInBaseConfiguration(componentInstanceId: string, propertyPath: string, newValue: any): boolean {
    try {
      // 🔥 导入配置管理器（延迟导入避免循环依赖）
      // 🔥 使用顶部导入的配置管理器

      // 获取组件的完整配置
      const fullConfig = configurationIntegrationBridge.getConfiguration(componentInstanceId)
      if (!fullConfig) {
        console.error(`[InteractionManager] 组件配置不存在: ${componentInstanceId}`)
        return false
      }

      // 🔥 特殊处理已知的基础配置字段
      const baseConfigFields = [
        'deviceId',
        'metricsList',
        'showTitle',
        'title',
        'visible',
        'opacity',
        'backgroundColor',
        'borderWidth',
        'borderColor',
        'borderRadius',
        'padding',
        'margin'
      ]

      // 只有基础配置字段才能通过此方法更新
      if (!baseConfigFields.includes(propertyPath) && !propertyPath.includes('.')) {
        return false
      }

      // 获取当前基础配置
      const currentBaseConfig = fullConfig.base || {}

      // 创建更新后的基础配置
      let updatedBaseConfig: any

      if (propertyPath.includes('.')) {
        // 🔥 处理嵌套路径（如 padding.top）
        updatedBaseConfig = { ...currentBaseConfig }
        updatedBaseConfig = this.setNestedProperty(updatedBaseConfig, propertyPath, newValue)
      } else {
        // 🔥 处理顶级字段（如 deviceId）
        updatedBaseConfig = {
          ...currentBaseConfig,
          [propertyPath]: newValue
        }
      }

      // 🔥 通过配置管理器更新基础配置
      configurationIntegrationBridge.updateConfiguration(componentInstanceId, 'base', updatedBaseConfig)



      return true
    } catch (error) {
      console.error(`[InteractionManager] 设置基础配置属性失败`, {
        componentInstanceId,
        propertyPath,
        newValue,
        error: error instanceof Error ? error.message : error
      })
      return false
    }
  }

  /**
   * 获取嵌套对象属性
   */
  private getNestedProperty(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      return current && typeof current === 'object' ? current[key] : undefined
    }, obj)
  }

  /**
   * 设置嵌套对象属性
   */
  private setNestedProperty(obj: any, path: string, value: any): any {
    const result = { ...obj }
    const keys = path.split('.')
    let current = result

    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i]
      if (!(key in current) || typeof current[key] !== 'object' || current[key] === null) {
        current[key] = {}
      } else {
        current[key] = { ...current[key] }
      }
      current = current[key]
    }

    current[keys[keys.length - 1]] = value
    return result
  }

  /**
   * 🔥 新增：获取所有组件的当前属性状态
   * 用于调试和监控
   */
  getAllComponentProperties(): Record<string, ComponentInteractionState> {
    const allProperties: Record<string, ComponentInteractionState> = {}

    for (const [componentId, state] of this.componentStates.entries()) {
      allProperties[componentId] = { ...state }
    }

    return allProperties
  }

  /**
   * 🔥 新增：注册HTTP数据源映射
   * 用于追踪哪些组件有HTTP数据源需要响应属性变化
   */
  registerHttpDataSource(componentId: string, componentType: string, config: any): void {
    const mappingKey = `http-${componentId}`

    // 🔥 修复：统一存储格式，使用字符串存储
    try {
      const configToStore = {
        componentId,
        componentType,
        config,
        // 标识这是通过registerHttpDataSource方法存储的
        _registrationMethod: 'registerHttpDataSource',
        _timestamp: Date.now()
      }

      const configStr = JSON.stringify(configToStore)
      this.httpDataSourceMappings.set(mappingKey, configStr)

    } catch (error) {
      console.error(`❌ [InteractionManager] registerHttpDataSource JSON序列化失败`, {
        componentId,
        error: error instanceof Error ? error.message : error
      })
    }
  }

  /**
   * 🔥 新增：移除HTTP数据源映射
   */
  unregisterHttpDataSource(componentId: string): void {
    const mappingKey = `http-${componentId}`
    this.httpDataSourceMappings.delete(mappingKey)
  }

  /**
   * 🔥 重构：正确的数据源触发机制
   * 属性变化 → 找到绑定该属性的数据源配置 → 更新数据源配置 → 配置变化触发执行器
   *
   * 这是架构修复的核心：不再直接触发数据源刷新，而是通过更新配置来触发
   */
  private async triggerDataSourceConfigUpdateForPropertyChange(
    componentId: string,
    propertyPath: string,
    newValue: any,
    oldValue?: any
  ): Promise<void> {
    try {

      // 🔥 关键修复：如果映射表为空，立即尝试建立映射
      if (this.httpDataSourceMappings.size === 0) {
        await this.ensureComponentMapping(componentId)
      }

      // 🔥 新增：确保当前组件一定有映射
      const currentComponentMappingKey = `http-${componentId}`
      if (!this.httpDataSourceMappings.has(currentComponentMappingKey)) {
        await this.ensureComponentMapping(componentId)
      }

      // 🚀 核心修复：找到所有绑定此属性的数据源配置，并更新它们
      const updatedConfigurations: string[] = []

      // 遍历所有已注册的数据源映射，查找绑定关系
      for (const [mappingKey, mappingStr] of this.httpDataSourceMappings.entries()) {

        // 🔥 修复：正确解析映射数据
        let mapping: any
        try {
          if (typeof mappingStr === 'string') {
            mapping = JSON.parse(mappingStr)
          } else {
            mapping = mappingStr
          }
        } catch (error) {
          console.error(`❌ [InteractionManager] 映射数据解析失败:`, { mappingKey, error })
          continue
        }

        const bindingExpression = this.buildPropertyBindingPath(componentId, propertyPath)

        // 检查配置中是否包含对此属性的绑定
        const hasBinding = this.configContainsPropertyBinding(mapping.config || mapping, componentId, propertyPath)


        if (hasBinding) {
          // 🚀 关键：更新数据源配置而不是直接刷新
          const targetComponentId = mapping.componentId || mapping._componentId || componentId
          await this.updateDataSourceConfigurationWithPropertyValue(
            targetComponentId,
            mapping.config || mapping,
            bindingExpression,
            newValue
          )

          updatedConfigurations.push(targetComponentId)
        }
      }

      // 🔥 特殊处理基础配置字段：这些字段可能直接影响当前组件的数据源
      const isBaseConfigProperty = this.isBaseConfigurationProperty(propertyPath)
      if (isBaseConfigProperty && !updatedConfigurations.includes(componentId)) {
        await this.updateCurrentComponentDataSourceForBaseConfig(componentId, propertyPath, newValue)
        updatedConfigurations.push(componentId)
      }

      // 🚀 关键修复：移除无条件后备逻辑，避免所有属性变化都触发数据源执行
      // 只有真正找到绑定关系的属性才应该触发数据源更新
      if (updatedConfigurations.length === 0) {
      }


    } catch (error) {
      console.error(`[InteractionManager] 数据源配置更新失败`, {
        componentId,
        propertyPath,
        error: error instanceof Error ? error.message : error
      })
    }
  }

  /**
   * 🔥 简化：构建属性绑定路径格式
   * 现在useCard2Props已经发送正确格式，这里只需要简单处理
   */
  private buildPropertyBindingPath(componentId: string, propertyPath: string): string {
    // 🔥 修复：现在useCard2Props发送的就是正确格式，直接返回
    // 格式应该是：componentId.whitelist.propertyName 或 componentId.base.propertyName
    return propertyPath
  }

  /**
   * 🚀 修复：精确检查配置是否包含特定的属性绑定
   * 专门检查所有可能格式的HTTP参数配置中的组件属性绑定
   */
  private configContainsPropertyBinding(config: any, componentId: string, propertyPath: string): boolean {
    if (!config) {
      return false
    }


    // 🚀 关键修复：检查所有可能的HTTP配置格式
    let foundHttpConfig = null

    // 1. 检查新格式：dataSources数组中的HTTP配置
    if (config.dataSources && Array.isArray(config.dataSources)) {
      for (const ds of config.dataSources) {
        if (ds.dataItems && Array.isArray(ds.dataItems)) {
          for (const item of ds.dataItems) {
            if (item.item?.type === 'http' && item.item?.config?.params) {
              foundHttpConfig = item.item.config
              break
            }
          }
        }
        if (foundHttpConfig) break
      }
    }

    // 2. 检查旧格式：直接的HTTP配置
    if (!foundHttpConfig && config.type === 'http' && config.config?.params) {
      foundHttpConfig = config.config
    }

    // 3. 检查rawDataList格式
    if (!foundHttpConfig && config.rawDataList && Array.isArray(config.rawDataList)) {
      for (const item of config.rawDataList) {
        if (item.type === 'http' && item.config?.params) {
          foundHttpConfig = item.config
          break
        }
      }
    }

    // 🚀 关键修复：检查HTTP配置中的各种参数类型（pathParams、queryParams、bodyParams等）
    const allParameterTypes = ['params', 'pathParams', 'queryParams', 'bodyParams', 'headers']

    for (const paramType of allParameterTypes) {
      if (foundHttpConfig && foundHttpConfig[paramType] && Array.isArray(foundHttpConfig[paramType])) {

        // 遍历当前类型的所有参数
        for (const param of foundHttpConfig[paramType]) {

          // 检查参数值是否匹配属性路径
          if (param.enabled !== false && param.value === propertyPath) {
            return true
          }
        }
      }
    }

    // 🚀 备用检查：通用字符串搜索（用于其他格式的数据源配置）
    const configStr = JSON.stringify(config)
    const escapedPropertyPath = propertyPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const directMatch = configStr.includes(`"${propertyPath}"`) || configStr.includes(`'${propertyPath}'`)


    return directMatch
  }

  /**
   * 🔥 修复：精确判断是否为基础配置属性
   * 只有 componentId.base.propertyName 格式才是基础配置属性
   */
  private isBaseConfigurationProperty(propertyPath: string): boolean {
    const result = propertyPath.includes('.base.')
    return result
  }

  /**
   * 🔥 修复：正确的数据源配置更新机制
   * 不替换绑定表达式，而是通过配置事件总线触发数据重新执行
   */
  private async updateDataSourceConfigurationWithPropertyValue(
    targetComponentId: string,
    currentConfig: any,
    bindingExpression: string,
    propertyValue: any
  ): Promise<void> {
    try {

      // 🔥 修复：不再替换绑定表达式，而是直接触发数据重新执行
      // 获取当前组件的完整配置
      const fullConfig = configurationIntegrationBridge.getConfiguration(targetComponentId)
      if (!fullConfig || !fullConfig.dataSource) {
        console.error(`[InteractionManager] 目标组件数据源配置不存在: ${targetComponentId}`)
        return
      }

      // 🔥 重要：不修改配置，保持绑定表达式不变
      // 通过配置事件总线发送虚拟配置变更事件，触发数据重新执行
      const { configEventBus } = await import('@/core/data-architecture/ConfigEventBus')

      await configEventBus.emitConfigChange({
        componentId: targetComponentId,
        componentType: 'unknown',
        section: 'dataSource',
        oldConfig: fullConfig.dataSource,
        newConfig: fullConfig.dataSource, // 配置不变，只是触发重新执行
        timestamp: Date.now(),
        source: 'system',
        context: {
          shouldTriggerExecution: true,
          changedFields: ['bindingValue'],
          triggerComponent: 'InteractionManager'
        }
      })


    } catch (error) {
      console.error(`[InteractionManager] 数据重新执行触发失败`, {
        targetComponentId,
        bindingExpression,
        error: error instanceof Error ? error.message : error
      })
    }
  }

  /**
   * 🚀 关键修复：为任何属性变化更新当前组件的数据源配置
   * 当映射表中没有找到绑定时，直接从配置管理器检查
   */
  private async updateCurrentComponentDataSourceForAnyProperty(
    componentId: string,
    propertyPath: string,
    newValue: any
  ): Promise<void> {
    try {

      // 获取组件的完整配置
      const fullConfig = configurationIntegrationBridge.getConfiguration(componentId)
      if (!fullConfig || !fullConfig.dataSource) {
        return // 没有数据源配置，无需更新
      }


      // 检查数据源配置是否引用了此属性
      const hasDirectBinding = this.configContainsPropertyBinding(fullConfig.dataSource, componentId, propertyPath)


      if (hasDirectBinding) {

        // 更新数据源配置中的绑定值
        await this.updateDataSourceConfigurationWithPropertyValue(
          componentId,
          fullConfig.dataSource,
          propertyPath, // 直接使用propertyPath，因为它已经是正确格式
          newValue
        )

      } else {
      }
    } catch (error) {
      console.error(`[InteractionManager] 任意属性数据源更新失败`, {
        componentId,
        propertyPath,
        error: error instanceof Error ? error.message : error
      })
    }
  }

  /**
   * 🔥 新增：为当前组件的基础配置变化更新其数据源配置
   */
  private async updateCurrentComponentDataSourceForBaseConfig(
    componentId: string,
    propertyPath: string,
    newValue: any
  ): Promise<void> {
    try {
      // 🔥 导入配置管理器（延迟导入避免循环依赖）
      // 🔥 使用顶部导入的配置管理器

      // 获取组件的完整配置
      const fullConfig = configurationIntegrationBridge.getConfiguration(componentId)
      if (!fullConfig || !fullConfig.dataSource) {
        return // 没有数据源配置，无需更新
      }

      const bindingExpression = this.buildPropertyBindingPath(componentId, propertyPath)

      // 检查数据源配置是否引用了此基础配置属性
      const hasDirectBinding = this.configContainsPropertyBinding(fullConfig.dataSource, componentId, propertyPath)


      if (hasDirectBinding) {


        // 更新数据源配置中的绑定值
        await this.updateDataSourceConfigurationWithPropertyValue(
          componentId,
          fullConfig.dataSource,
          bindingExpression,
          newValue
        )
      }
    } catch (error) {
      console.error(`[InteractionManager] 基础配置数据源更新失败`, {
        componentId,
        propertyPath,
        error: error instanceof Error ? error.message : error
      })
    }
  }

  /**
   * 🔥 修复：不应该替换HTTP配置中的绑定表达式！
   * 这个函数的设计理念是错误的 - HTTP参数绑定应该保持绑定状态，而不是被替换为值
   */
  private replaceBindingExpressionWithValue(config: any, bindingExpression: string, value: any): any {
    console.error(`🚨 [InteractionManager] replaceBindingExpressionWithValue 被调用，但这是错误的行为！`, {
      bindingExpression,
      value,
      错误说明: 'HTTP配置中的绑定表达式不应该被替换为具体值',
      正确做法: '绑定表达式应该保持不变，让DataItemFetcher在执行时动态解析',
      调用栈: new Error().stack
    })

    // 🔥 直接返回原配置，不做任何替换
    // 绑定路径应该保持不变，让数据执行层在运行时动态解析
    return config

    // 以下代码被禁用，因为它是问题的根源
    /*
    if (!config || typeof config !== 'object') {
      return config
    }

    // 深度克隆配置以避免修改原对象
    const newConfig = JSON.parse(JSON.stringify(config))

    // 🚨 这个调用会破坏绑定路径
    this.recursiveReplaceBinding(newConfig, bindingExpression, value)

    return newConfig
    */
  }

  /**
   * 🔥 修复：绝不替换HTTP参数的绑定路径！
   * 这个函数的原始设计是错误的 - 它试图替换绑定表达式，但绑定表达式应该保持不变
   */
  private recursiveReplaceBinding(obj: any, bindingExpression: string, value: any): void {
    console.error(`🚨 [InteractionManager] recursiveReplaceBinding 被调用，但这是错误的行为！`, {
      bindingExpression,
      value,
      错误说明: 'HTTP参数的绑定路径不应该被替换，应该保持绑定状态',
      调用栈: new Error().stack
    })

    // 🔥 完全禁用这个函数，防止绑定路径被破坏
    // 绑定路径应该始终保持为路径格式，而不是被替换为值
    return

    // 以下代码被注释掉，因为它是导致绑定路径被破坏的根源
    /*
    if (!obj || typeof obj !== 'object') {
      return
    }

    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const val = obj[key]

        if (typeof val === 'string') {
          // 🚨 这些替换逻辑是错误的，会破坏绑定路径
          if (key === 'value' && val === bindingExpression) {
            obj[key] = String(value) // 这是问题的根源！
          }
        } else if (typeof val === 'object') {
          this.recursiveReplaceBinding(val, bindingExpression, value)
        }
      }
    }
    */
  }

  /**
   * 🔥 为基础配置变化刷新相关数据源
   * 当基础配置字段（特别是设备字段）发生变化时，刷新依赖这些字段的数据源
   *
   * ⚠️ 注意：这个方法将被逐步废弃，新的架构使用updateCurrentComponentDataSourceForBaseConfig
   */
  private async refreshDataSourcesForBaseConfigChange(
    componentId: string,
    propertyPath: string,
    newValue: any,
    oldValue?: any
  ): Promise<void> {
    try {
      // 🔥 特别处理设备字段变化
      if (propertyPath === 'deviceId' || propertyPath === 'metricsList') {

        // 1. 刷新当前组件的数据源
        await this.refreshComponentDataSource(componentId)

        // 2. 查找其他可能依赖此设备信息的组件数据源
        await this.refreshRelatedDeviceDataSources(componentId, propertyPath, newValue)
      }

      // 🔥 处理其他基础配置字段变化
      else {


        // 刷新当前组件的数据源（如果数据源中使用了该字段）
        await this.refreshComponentDataSource(componentId)
      }
    } catch (error) {
      console.error(`[InteractionManager] 基础配置数据源刷新失败`, {
        componentId,
        propertyPath,
        error: error instanceof Error ? error.message : error
      })
    }
  }

  /**
   * 🔥 刷新与设备相关的数据源
   * 当设备字段变化时，查找并刷新其他可能依赖此设备的数据源
   */
  private async refreshRelatedDeviceDataSources(
    sourceComponentId: string,
    propertyPath: string,
    newValue: any
  ): Promise<void> {
    // 遍历所有已注册的数据源映射
    for (const [mappingKey, mapping] of this.httpDataSourceMappings.entries()) {
      // 跳过源组件自身
      if (mapping.componentId === sourceComponentId) {
        continue
      }

      // 检查该数据源是否可能依赖设备信息
      if (this.dataSourceMightDependOnDevice(mapping.config)) {


        await this.refreshComponentDataSource(mapping.componentId)
      }
    }
  }

  /**
   * 🔥 判断数据源是否可能依赖设备信息
   * 检查数据源配置中是否包含设备相关的字段或绑定
   */
  private dataSourceMightDependOnDevice(config: any): boolean {
    if (!config || typeof config !== 'object') {
      return false
    }

    const configStr = JSON.stringify(config).toLowerCase()

    // 检查是否包含设备相关的关键词
    const deviceKeywords = ['device', 'deviceid', 'metrics', 'sensor', 'iot']

    for (const keyword of deviceKeywords) {
      if (configStr.includes(keyword)) {
        return true
      }
    }

    return false
  }

  /**
   * 🔥 判断是否应该为特定属性刷新数据源
   * 智能判断数据源与属性的关联性
   */
  private shouldRefreshDataSourceForProperty(
    mapping: { componentId: string; componentType: string; config: any },
    componentId: string,
    propertyPath: string
  ): boolean {
    // 1. 如果是同一个组件，优先刷新
    if (mapping.componentId === componentId) {
      return true
    }

    // 2. 检查配置中是否包含属性路径
    if (this.configContainsPropertyBinding(mapping.config, componentId, propertyPath)) {
      return true
    }

    // 3. 检查是否为设备相关属性
    if (propertyPath === 'deviceId' || propertyPath === 'metricsList') {
      return this.dataSourceMightDependOnDevice(mapping.config)
    }

    return false
  }

  /**
   * 🔥 刷新指定组件的数据源
   * 统一的数据源刷新入口点
   */
  private async refreshComponentDataSource(componentId: string): Promise<void> {
    try {
      // 1. 从HTTP数据源映射中查找
      const httpMapping = this.httpDataSourceMappings.get(`http-${componentId}`)
      if (httpMapping) {


        const result = await this.visualEditorBridge.updateComponentExecutor(
          httpMapping.componentId,
          httpMapping.componentType,
          httpMapping.config
        )
        return
      }

      // 2. 通过配置管理器获取数据源配置并刷新
      await this.refreshComponentDataSourceFromConfig(componentId)
    } catch (error) {
      console.error(`[InteractionManager] 组件数据源刷新失败`, {
        componentId,
        error: error instanceof Error ? error.message : error
      })
    }
  }

  /**
   * 🔥 从配置管理器获取数据源配置并刷新
   * 当HTTP映射不存在时的后备方案
   */
  private async refreshComponentDataSourceFromConfig(componentId: string): Promise<void> {
    try {
      // 🔥 导入配置管理器（延迟导入避免循环依赖）
      // 🔥 使用顶部导入的配置管理器

      // 获取组件的完整配置
      const fullConfig = configurationIntegrationBridge.getConfiguration(componentId)
      if (!fullConfig || !fullConfig.dataSource) {
        return
      }


      // 使用配置中的数据源信息刷新
      const result = await this.visualEditorBridge.updateComponentExecutor(
        componentId,
        fullConfig.metadata?.componentType || 'unknown',
        fullConfig.dataSource
      )

    } catch (error) {
      console.error(`[InteractionManager] 从配置刷新数据源失败`, {
        componentId,
        error: error instanceof Error ? error.message : error
      })
    }
  }

  /**
   * 🔥 简化：同步交互状态到配置管理器
   * 简化版本，移除过度复杂的配置同步桥梁
   */
  private syncToConfigurationManager(componentId: string, updates: Partial<ComponentInteractionState>): void {
    try {
      // 🔥 简化：直接使用 configurationIntegrationBridge 进行状态同步
      configurationIntegrationBridge.updateConfiguration(
        componentId,
        'interaction',
        updates
      )
    } catch (error) {
      console.error(`❌ [InteractionManager] 配置同步失败`, {
        componentId,
        updates,
        error: error instanceof Error ? error.message : error
      })
    }
  }

  /**
   * 🔥 简化：从配置管理器加载初始状态
   * 简化版本，直接从配置管理器获取状态
   */
  loadStateFromConfiguration(componentId: string): void {
    try {
      const fullConfig = configurationIntegrationBridge.getConfiguration(componentId)
      const configState = fullConfig?.interaction || {}
      
      if (configState && Object.keys(configState).length > 0) {
        // 合并到当前状态，不覆盖现有状态
        const currentState = this.componentStates.get(componentId) || {}
        const mergedState = { ...configState, ...currentState }

        this.componentStates.set(componentId, mergedState)
      }
    } catch (error) {
      console.error(`❌ [InteractionManager] 加载配置状态失败`, {
        componentId,
        error: error instanceof Error ? error.message : error
      })
    }
  }

  /**
   * 🔥 简化：获取组件的最新状态（包含配置中的状态）
   * 优先级：当前内存状态 > 配置管理器状态
   */
  getLatestComponentState(componentId: string): ComponentInteractionState {
    const memoryState = this.componentStates.get(componentId) || {}
    const fullConfig = configurationIntegrationBridge.getConfiguration(componentId)
    const configState = fullConfig?.interaction || {}

    // 合并状态，内存状态优先
    return { ...configState, ...memoryState }
  }

  /**
   * 🔥 新增：监听组件属性变化
   * 用于实现属性绑定的响应式更新
   */
  watchComponentProperty(
    componentId: string,
    propertyPath: string,
    callback: (newValue: any, oldValue: any) => void
  ): () => void {
    const watchKey = `${componentId}.${propertyPath}`

    // 创建属性变化监听器
    const propertyWatcher = (data: any) => {
      if (data.event === 'dataChange' && data.data?.property === propertyPath) {
        callback(data.data.newValue, data.data.oldValue)
      }
    }

    this.addEventListener(componentId, propertyWatcher)

    // 返回取消监听的函数
    return () => {
      this.removeEventListener(componentId, propertyWatcher)
    }
  }

  // ===== 🔥 配置变化事件处理方法 =====

  /**
   * 🔥 设置全局配置变化监听器
   * 监听所有组件的基础配置变化
   */
  private async setupGlobalConfigurationListener(): Promise<void> {
    try {
      // 🔥 使用顶部导入的配置事件总线

      // 监听全局配置变化事件
      configEventBus.onConfigChange((event: any) => {
        this.handleGlobalConfigurationChange(event)
      })

    } catch (error) {
      console.error(`❌ [InteractionManager] 设置全局配置监听器失败`, error)
    }
  }

  /**
   * 🔥 为特定组件设置配置变化监听器
   * 监听组件的基础配置变化并处理相应的属性更新
   */
  private async setupComponentConfigurationListener(componentId: string): Promise<void> {
    try {
      // 🔥 使用顶部导入的配置管理器

      // 监听组件配置变化
      const removeListener = configurationIntegrationBridge.onConfigurationChange(componentId, (config: any) => {
        this.handleComponentConfigurationChange(componentId, config)
      })

      // 保存清理函数
      this.configChangeListeners.set(componentId, removeListener)

    } catch (error) {
      console.error(`❌ [InteractionManager] 设置组件配置监听器失败`, {
        componentId,
        error: error instanceof Error ? error.message : error
      })
    }
  }

  /**
   * 🔥 清理组件配置变化监听器
   */
  private cleanupComponentConfigurationListener(componentId: string): void {
    const removeListener = this.configChangeListeners.get(componentId)
    if (removeListener) {
      try {
        removeListener()
        this.configChangeListeners.delete(componentId)

      } catch (error) {
        console.error(`⚠️ [InteractionManager] 清理组件配置监听器失败`, {
          componentId,
          error: error instanceof Error ? error.message : error
        })
      }
    }
  }

  /**
   * 🔥 关键新增：处理数据执行触发器事件
   * 当配置变更时，自动触发相关组件的数据源重新执行
   * 🚀 关键修复：添加绑定检查，只有真正绑定的配置变更才触发数据源
   */
  private async handleDataExecutionTrigger(event: ConfigChangeEvent): Promise<void> {

    // 🚀 关键修复：添加绑定关系检查
    // 只有以下情况才应该触发数据源：
    // 1. dataSource 层配置变更（数据源本身改变）
    // 2. base 层配置变更且确实有绑定关系
    // 3. component 层配置变更且确实有绑定关系

    if (event.section === 'dataSource') {
    } else if (event.section === 'base') {

      // 检查base层配置变更是否真的有绑定
      const hasBaseBindings = await this.checkBaseConfigurationBindings(event.componentId, event.newConfig)
      if (!hasBaseBindings) {
        return
      }
    } else if (event.section === 'component') {

      // component层配置变更通过useCard2Props已经做了绑定检查，这里不应该执行
      return
    } else {
      return
    }

    try {


      // 🔥 关键修复：在处理配置变更前，先清理SimpleDataBridge缓存
      // 这确保了属性变化后会重新执行HTTP请求而不是使用旧缓存数据


      try {
        // 导入 SimpleDataBridge 并清理缓存
        const { simpleDataBridge } = await import('@/core/data-architecture/SimpleDataBridge')
        simpleDataBridge.clearComponentCache(event.componentId)

      } catch (error) {
        console.error(`⚠️ [InteractionManager] SimpleDataBridge缓存清理失败`, {
          componentId: event.componentId,
          error: error instanceof Error ? error.message : error
        })
      }

      // 🔥 关键修复2：同步配置更改到 EditorStore，确保 DataItemFetcher 获取最新属性值
      try {
        await this.syncConfigChangeToEditorStore(event)
      } catch (error) {
        console.error(`⚠️ [InteractionManager] EditorStore同步失败`, {
          componentId: event.componentId,
          error: error instanceof Error ? error.message : error
        })
      }

      // 🔥 修复：使用正确的映射键
      const mappingKey = `http-${event.componentId}`
      const dataSourceConfigStr = this.httpDataSourceMappings.get(mappingKey)


      if (dataSourceConfigStr) {
        // 🔥 调试：检查存储的内容类型

        try {
          // 🔥 安全的JSON解析
          let dataSourceConfig: any
          if (typeof dataSourceConfigStr === 'string') {
            dataSourceConfig = JSON.parse(dataSourceConfigStr)
          } else {
            // 🔥 处理旧格式的对象存储 - 转换为新格式

            const oldFormatConfig = dataSourceConfigStr as any

            if (oldFormatConfig.componentId && oldFormatConfig.config) {
              // 这是 registerHttpDataSource 存储的格式
              dataSourceConfig = {
                ...oldFormatConfig.config,
                _registrationMethod: 'legacy',
                _componentId: oldFormatConfig.componentId,
                _componentType: oldFormatConfig.componentType
              }
            } else {
              // 未知格式，直接使用
              dataSourceConfig = dataSourceConfigStr
            }


          }



          // 🔥 关键修复：正确构造数据源配置
          // 检查存储的配置格式，确保数据源结构正确

          let configForExecution: any

          // 如果配置包含 dataSources 数组，直接使用
          if (dataSourceConfig.dataSources && Array.isArray(dataSourceConfig.dataSources)) {
            configForExecution = {
              base: dataSourceConfig._baseConfig || {},
              dataSource: dataSourceConfig,
              dataSources: dataSourceConfig.dataSources // 确保数据源数组传递
            }
          }
          // 如果配置包含 rawDataList，转换为 dataSources 格式
          else if (dataSourceConfig.rawDataList && Array.isArray(dataSourceConfig.rawDataList)) {
            const convertedDataSources = dataSourceConfig.rawDataList.map((item: any, index: number) => ({
              sourceId: `dataSource${index + 1}`,
              dataItems: [{
                item: {
                  type: item.type,
                  config: item.config
                },
                processing: {
                  filterPath: '$',
                  defaultValue: {}
                }
              }],
              mergeStrategy: { type: 'object' }
            }))

            configForExecution = {
              base: dataSourceConfig._baseConfig || {},
              dataSource: {
                ...dataSourceConfig,
                dataSources: convertedDataSources
              },
              dataSources: convertedDataSources
            }
          }
          // 兼容旧格式：单个HTTP配置直接转换
          else {
            // 🔥 关键修复：创建标准的 dataSources 结构而不是 rawDataList
            const convertedDataSources = [{
              sourceId: 'dataSource1',
              dataItems: [{
                item: {
                  type: 'http',
                  config: dataSourceConfig.config || dataSourceConfig
                },
                processing: {
                  filterPath: '$',
                  defaultValue: {}
                }
              }],
              mergeStrategy: { type: 'object' }
            }]

            configForExecution = {
              base: dataSourceConfig._baseConfig || {},
              dataSource: {
                ...dataSourceConfig,
                dataSources: convertedDataSources
              },
              dataSources: convertedDataSources
            }
          }



          // 🔥 添加详细的配置内容调试


          const result = await this.visualEditorBridge.updateComponentExecutor(
            event.componentId,
            'widget', // 组件类型
            configForExecution
          )

        } catch (error) {
          console.error(`❌ [InteractionManager] HTTP数据源重新执行失败`, {
            componentId: event.componentId,
            error: error instanceof Error ? error.message : error
          })
        }
      }

      // 检查是否有其他组件需要基于该组件的配置变更进行数据更新
      if (event.section === 'base' && event.context?.changedFields) {
        const criticalFields = ['deviceId', 'metricsList']
        const hasCriticalChange = event.context.changedFields.some(field => criticalFields.includes(field))

        if (hasCriticalChange) {


          // 检查所有组件的HTTP数据源，看是否需要重新执行
          for (const [mappingComponentId, mapping] of this.httpDataSourceMappings) {
            if (mappingComponentId !== event.componentId) {
              // 检查该组件是否依赖于变更的基础配置
              const dependsOnChangedComponent = this.checkComponentDependency(mappingComponentId, event.componentId)

              if (dependsOnChangedComponent) {


                await this.visualEditorBridge.updateComponentExecutor(
                  mappingComponentId,
                  mapping.componentType,
                  mapping.config
                )
              }
            }
          }
        }
      }
    } catch (error) {
      console.error(`❌ [InteractionManager] 数据执行触发器处理失败`, {
        event,
        error: error instanceof Error ? error.message : error
      })
    }
  }

  /**
   * 🔥 检查组件依赖关系
   * 检查一个组件是否依赖于另一个组件的配置
   */
  private checkComponentDependency(dependentComponentId: string, sourceComponentId: string): boolean {
    // 这里可以实现复杂的依赖检查逻辑
    // 目前简化为false，实际中可能需要检查配置中的交叉引用
    return false
  }

  /**
   * 🔥 销毁InteractionManager
   * 清理所有监听器和资源
   */
  destroy(): void {
    // 清理数据执行触发器
    if (this.dataExecutionTriggerCleanup) {
      this.dataExecutionTriggerCleanup()
      this.dataExecutionTriggerCleanup = null
    }

    // 清理所有组件的配置监听器
    for (const componentId of this.configChangeListeners.keys()) {
      this.cleanupComponentConfigurationListener(componentId)
    }

    // 清理所有数据
    this.componentConfigs.clear()
    this.componentStates.clear()
    this.eventListeners.clear()
    this.httpDataSourceMappings.clear()

    this.isInitialized = false

  }

  /**
   * 🔥 处理全局配置变化事件
   * 当任何组件的配置发生变化时调用
   */
  private handleGlobalConfigurationChange(event: any): void {
    try {
      const { componentId, section, oldConfig, newConfig } = event

      // 只处理基础配置变化
      if (section === 'base') {


        this.processBaseConfigurationChange(componentId, oldConfig, newConfig)
      }
    } catch (error) {
      console.error(`❌ [InteractionManager] 处理全局配置变化失败`, {
        event,
        error: error instanceof Error ? error.message : error
      })
    }
  }

  /**
   * 🔥 处理组件配置变化
   * 当特定组件的配置发生变化时调用
   */
  private handleComponentConfigurationChange(componentId: string, newConfig: any): void {
    try {
      if (!newConfig || !newConfig.base) {
        return
      }



      // 检查基础配置中的设备字段变化
      this.checkBaseConfigurationFieldChanges(componentId, newConfig.base)
    } catch (error) {
      console.error(`❌ [InteractionManager] 处理组件配置变化失败`, {
        componentId,
        error: error instanceof Error ? error.message : error
      })
    }
  }

  /**
   * 🔥 处理基础配置变化
   * 比较新旧配置，识别具体的变化字段
   */
  private processBaseConfigurationChange(componentId: string, oldConfig: any, newConfig: any): void {
    try {
      // 获取基础配置字段列表
      const baseConfigFields = [
        'deviceId',
        'metricsList',
        'showTitle',
        'title',
        'visible',
        'opacity',
        'backgroundColor',
        'borderWidth',
        'borderColor',
        'borderRadius',
        'padding',
        'margin'
      ]

      const changedFields: Array<{ field: string; oldValue: any; newValue: any }> = []

      // 检查每个基础配置字段的变化
      for (const field of baseConfigFields) {
        const oldValue = oldConfig ? oldConfig[field] : undefined
        const newValue = newConfig ? newConfig[field] : undefined

        // 简单的值比较（对于复杂对象可能需要深度比较）
        if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
          changedFields.push({ field, oldValue, newValue })
        }
      }

      // 处理每个变化的字段
      for (const { field, oldValue, newValue } of changedFields) {
        this.processBaseConfigurationFieldChange(componentId, field, newValue, oldValue)
      }
    } catch (error) {
      console.error(`❌ [InteractionManager] 处理基础配置变化失败`, {
        componentId,
        error: error instanceof Error ? error.message : error
      })
    }
  }

  /**
   * 🔥 检查基础配置字段变化（用于组件配置监听）
   * 这个方法用于处理来自组件配置监听器的变化
   */
  private checkBaseConfigurationFieldChanges(componentId: string, newBaseConfig: any): void {
    try {
      // 获取之前的基础配置（如果存在）
      const previousBaseConfig = this.getPreviousBaseConfiguration(componentId)

      // 比较并处理变化
      this.processBaseConfigurationChange(componentId, previousBaseConfig, newBaseConfig)

      // 保存当前配置作为下次比较的基准
      this.savePreviousBaseConfiguration(componentId, newBaseConfig)
    } catch (error) {
      console.error(`❌ [InteractionManager] 检查基础配置字段变化失败`, {
        componentId,
        error: error instanceof Error ? error.message : error
      })
    }
  }

  /**
   * 🔥 处理单个基础配置字段的变化
   * 这是配置变化处理的核心逻辑
   */
  private processBaseConfigurationFieldChange(componentId: string, field: string, newValue: any, oldValue: any): void {
    try {

      // 🔥 关键修复：base层配置变化也要检查绑定，不能无条件触发
      // 构造base层属性路径
      const basePropertyPath = `${componentId}.base.${field}`

      // 🔥 异步检查是否有绑定，只有真正绑定的base属性才触发数据源
      this.checkBasePropertyBindingAndNotify(componentId, field, basePropertyPath, newValue, oldValue)
        .catch(error => {
          console.error(`❌ [InteractionManager] checkBasePropertyBindingAndNotify执行失败`, {
            componentId,
            field,
            error
          })
        })

      // 🔥 特殊处理设备字段变化（仅用于其他业务逻辑，不触发数据源）
      if (field === 'deviceId' || field === 'metricsList') {

        // 触发设备相关的特殊处理逻辑（异步执行）
        this.handleDeviceFieldChange(componentId, field, newValue, oldValue).catch(error => {
          console.error(`❌ [InteractionManager] handleDeviceFieldChange异步执行失败`, {
            componentId,
            field,
            error
          })
        })
      }
    } catch (error) {
      console.error(`❌ [InteractionManager] 处理基础配置字段变化失败`, {
        componentId,
        field,
        error: error instanceof Error ? error.message : error
      })
    }
  }

  /**
   * 🔥 新增：检查base层配置是否有绑定关系
   * 用于handleDataExecutionTrigger判断是否应该执行数据源
   */
  private async checkBaseConfigurationBindings(componentId: string, baseConfig: any): Promise<boolean> {
    try {

      // 获取组件的数据源配置
      const fullConfig = configurationIntegrationBridge.getConfiguration(componentId)
      if (!fullConfig?.dataSource) {
        return false
      }

      // 检查base层配置中的各个字段是否有绑定
      const baseFields = Object.keys(baseConfig || {})
      let hasAnyBinding = false

      for (const field of baseFields) {
        const basePropertyPath = `${componentId}.base.${field}`
        const hasBinding = this.configContainsPropertyBinding(fullConfig.dataSource, componentId, basePropertyPath)


        if (hasBinding) {
          hasAnyBinding = true
        }
      }


      return hasAnyBinding
    } catch (error) {
      console.error(`❌ [InteractionManager] base配置绑定检查失败:`, {
        componentId,
        error: error instanceof Error ? error.message : error
      })
      return false
    }
  }

  /**
   * 🔥 新增：检查base层属性绑定并通知
   * 确保只有真正绑定到数据源的base属性才触发数据源更新
   */
  private async checkBasePropertyBindingAndNotify(
    componentId: string,
    field: string,
    basePropertyPath: string,
    newValue: any,
    oldValue: any
  ): Promise<void> {
    try {

      // 获取组件的数据源配置
      const fullConfig = configurationIntegrationBridge.getConfiguration(componentId)
      if (!fullConfig?.dataSource) {
        return
      }

      // 检查base属性是否真的绑定到数据源参数中
      const hasBinding = this.configContainsPropertyBinding(fullConfig.dataSource, componentId, basePropertyPath)


      if (hasBinding) {

        // 只有真正绑定的base属性才通知更新
        this.notifyPropertyUpdate(componentId, basePropertyPath, newValue, oldValue)
      } else {
      }
    } catch (error) {
      console.error(`❌ [InteractionManager] base属性绑定检查失败:`, {
        componentId,
        field,
        error: error instanceof Error ? error.message : error
      })
    }
  }

  /**
   * 🔥 处理设备字段变化的特殊逻辑
   * 设备字段变化时需要额外的处理
   */
  private async handleDeviceFieldChange(
    componentId: string,
    field: string,
    newValue: any,
    oldValue: any
  ): Promise<void> {
    // 这里可以添加设备字段变化的特殊处理逻辑
    // 例如：更新设备模板、刷新设备状态等


    // 🔥 关键修复：设备字段变更时，直接触发ConfigEventBus事件
    try {
      const configChangeEvent = {
        componentId,
        componentType: 'widget',
        section: 'base' as const,
        oldConfig: { [field]: oldValue },
        newConfig: { [field]: newValue },
        timestamp: Date.now(),
        source: 'user' as const,
        context: {
          changedFields: [field],
          shouldTriggerExecution: true,
          triggerComponent: 'InteractionManager'
        }
      }



      // 导入并使用ConfigEventBus
      const { configEventBus } = await import('@/core/data-architecture/ConfigEventBus')
      await configEventBus.emitConfigChange(configChangeEvent)
    } catch (error) {
      console.error(`❌ [InteractionManager] 触发ConfigEventBus失败`, {
        componentId,
        field,
        error: error instanceof Error ? error.message : error
      })
    }
  }

  // 🔥 临时存储，用于配置变化比较
  private previousBaseConfigurations = new Map<string, any>()

  /**
   * 获取之前保存的基础配置
   */
  private getPreviousBaseConfiguration(componentId: string): any {
    return this.previousBaseConfigurations.get(componentId)
  }

  /**
   * 保存基础配置用于下次比较
   */
  private savePreviousBaseConfiguration(componentId: string, baseConfig: any): void {
    this.previousBaseConfigurations.set(componentId, baseConfig ? { ...baseConfig } : null)
  }

  /**
   * 🔥 新增：确保组件映射存在
   * 如果组件没有注册映射，立即建立映射
   */
  private async ensureComponentMapping(componentId: string): Promise<void> {
    try {

      // 检查组件是否已经有映射
      const mappingKey = `http-${componentId}`
      if (this.httpDataSourceMappings.has(mappingKey)) {
        return
      }

      // 立即建立映射
      this.checkAndStoreHttpDataSourceMapping(componentId, [])

    } catch (error) {
      console.error(`❌ [InteractionManager] ensureComponentMapping失败:`, {
        componentId,
        error: error instanceof Error ? error.message : error
      })
    }
  }

  /**
   * 🔥 关键新增：检查并存储HTTP数据源映射
   * 检查组件配置中是否包含HTTP数据源，并为后续的数据重新执行做准备
   */
  private checkAndStoreHttpDataSourceMapping(componentId: string, configs: InteractionConfig[]): void {
    // 获取组件的完整配置
    const fullConfig = configurationIntegrationBridge.getConfiguration(componentId)
    if (!fullConfig) {

      return
    }

    // 🔥 添加详细配置日志

    // 检查是否有数据源配置
    if (fullConfig.dataSource) {
      // 检查数据源配置中是否包含HTTP类型
      const hasHttpDataSource = this.hasHttpDataSourceInConfig(fullConfig.dataSource)

      if (hasHttpDataSource) {
        // 获取组件类型（可以从配置中推断或从其他地方获取）
        const componentType = this.inferComponentTypeFromConfig(fullConfig)

        // 🔥 存储完整配置信息，包括基础配置
        const mappingKey = `http-${componentId}`

        // 🔥 修复：安全地处理JSON序列化，避免循环引用
        let fullConfigStr: string
        try {
          const configToStore = {
            ...fullConfig.dataSource,
            // 🔥 关键：将基础配置也包含进来
            _baseConfig: fullConfig.base,
            // 只存储必要的配置信息，避免循环引用
            _fullConfigMetadata: {
              componentId: fullConfig.componentId || componentId,
              base: fullConfig.base,
              dataSource: fullConfig.dataSource,
              // 不存储完整的fullConfig，避免循环引用
            }
          }

          fullConfigStr = JSON.stringify(configToStore, null, 2)


        } catch (jsonError) {
          console.error(`❌ [InteractionManager] JSON序列化失败，使用简化配置`, {
            componentId,
            error: jsonError instanceof Error ? jsonError.message : jsonError
          })

          // 降级处理：只存储数据源配置
          fullConfigStr = JSON.stringify({
            ...fullConfig.dataSource,
            _baseConfig: fullConfig.base
          })
        }

        // 存储HTTP数据源映射
        this.httpDataSourceMappings.set(mappingKey, fullConfigStr)



        // 🔥 验证存储的确实是字符串
        if (typeof fullConfigStr !== 'string') {
          console.error(`❌ [InteractionManager] 存储的不是字符串!`, {
            componentId,
            actualType: typeof fullConfigStr,
            content: fullConfigStr
          })
          // 强制转换为字符串
          fullConfigStr = JSON.stringify(fullConfigStr)
        }

        // 🔥 检查组件绑定参数
        if (fullConfig.dataSource.config && fullConfig.dataSource.config.params) {
          const componentParams = fullConfig.dataSource.config.params.filter(p => p.valueMode === 'component')

        }
      }
    }
  }

  /**
   * 🔧 检查配置中是否包含HTTP数据源
   */
  private hasHttpDataSourceInConfig(dataSourceConfig: any): boolean {
    if (!dataSourceConfig || typeof dataSourceConfig !== 'object') {
      return false
    }

    // 检查各种可能的HTTP数据源配置格式

    // 1. 检查 dataSources 数组中的HTTP配置
    if (dataSourceConfig.dataSources && Array.isArray(dataSourceConfig.dataSources)) {
      return dataSourceConfig.dataSources.some(
        (ds: any) =>
          ds.dataItems && Array.isArray(ds.dataItems) && ds.dataItems.some((item: any) => item.item?.type === 'http')
      )
    }

    // 2. 检查直接的 type 字段
    if (dataSourceConfig.type === 'http') {
      return true
    }

    // 3. 检查 rawDataList 中的HTTP配置
    if (dataSourceConfig.rawDataList && Array.isArray(dataSourceConfig.rawDataList)) {
      return dataSourceConfig.rawDataList.some((item: any) => item.type === 'http')
    }

    // 4. 检查 dataSourceX 格式的配置
    for (const [key, value] of Object.entries(dataSourceConfig)) {
      if (key.startsWith('dataSource') && value && typeof value === 'object') {
        const dsConfig = value as any
        if (dsConfig.type === 'http') {
          return true
        }
      }
    }

    return false
  }

  /**
   * 🔧 从配置推断组件类型
   */
  private inferComponentTypeFromConfig(config: any): string {
    // 这里可以实现更复杂的类型推断逻辑
    // 目前简化为使用默认类型
    if (config.metadata?.componentType) {
      return config.metadata.componentType
    }

    // 可以根据配置特征来推断类型
    if (config.component?.properties?.customize?.title) {
      return 'simple-display' // 简单显示组件
    }

    return 'unknown-component'
  }

  /**
   * 🔥 关键修复方法：将配置变更同步到 EditorStore
   * 确保 DataItemFetcher 获取到最新的属性值而不是过期缓存
   */
  private async syncConfigChangeToEditorStore(event: ConfigChangeEvent): Promise<void> {


    try {
      // 导入 Visual Editor Store
      const { useEditorStore } = await import('@/components/visual-editor/store/editor')
      const editorStore = useEditorStore()

      // 查找目标节点
      const targetNode = editorStore.nodes?.find(node => node.id === event.componentId)
      if (!targetNode) {

        return
      }


      // 🔥 修复：直接从事件中获取配置信息，而不依赖configurationManager
      const currentConfiguration = {
        base: event.newConfig || {},
        component: {},
        dataSource: {},
        interaction: {}
      }



      // 🔥 关键：从配置系统中提取最新的属性值，更新到 EditorStore 节点
      let needUpdate = false
      const updatedProperties = { ...targetNode.properties }

      // 如果是基础配置变更，更新对应的属性值
      if (event.section === 'base' && currentConfiguration.base) {
        const baseConfig = currentConfiguration.base


        // 遍历基础配置，同步到节点属性中
        for (const [key, value] of Object.entries(baseConfig)) {
          // 将基础配置的键值同步到节点属性中
          if (!updatedProperties.base) {
            updatedProperties.base = {}
          }

          if (updatedProperties.base[key] !== value) {

            updatedProperties.base[key] = value
            needUpdate = true
          }
        }

        // 特别处理 deviceId，因为参数绑定经常使用这个字段
        if ('deviceId' in baseConfig) {
          if (!updatedProperties.customize) {
            updatedProperties.customize = {}
          }
          if (updatedProperties.customize.deviceId !== baseConfig.deviceId) {

            updatedProperties.customize.deviceId = baseConfig.deviceId
            needUpdate = true
          }
        }
      }

      // 如果是组件配置变更，直接同步
      if (event.section === 'component' && currentConfiguration.component) {

        // 合并组件配置到属性中
        Object.assign(updatedProperties, currentConfiguration.component)
        needUpdate = true
      }

      // 如果需要更新，更新 EditorStore 中的节点
      if (needUpdate) {


        // 更新节点属性
        editorStore.updateNode(event.componentId, {
          properties: updatedProperties
        })


      }

    } catch (error) {
      console.error(`❌ [InteractionManager] syncConfigChangeToEditorStore失败`, {
        componentId: event.componentId,
        error: error instanceof Error ? error.message : error
      })
      throw error
    }
  }
}

// 创建单例实例
export const interactionManager = new InteractionManager()

// 🔥 立即初始化InteractionManager，确保ConfigEventBus触发器注册
interactionManager.initialize().catch(error => {
  console.error(`❌ [InteractionManager] 自动初始化失败`, error)
})

// 导出类型
export type { InteractionManager }
