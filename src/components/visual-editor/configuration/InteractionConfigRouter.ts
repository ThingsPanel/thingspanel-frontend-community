/**
 * 🔥 交互配置路由器 - 统一交互配置分发系统
 *
 * 核心职责：
 * 1. 根据componentId路由交互配置到对应组件
 * 2. 支持一个组件多个交互配置并发管理
 * 3. 管理交互监听器的生命周期
 * 4. 提供跨组件属性修改机制
 *
 * 解决的问题：
 * - 刷新后交互失效 → 统一配置加载和注册时机
 * - 一个组件多交互配置支持 → 并发交互管理
 * - 跨组件属性修改 → 配置级别的属性修改响应
 */

export interface InteractionConfig {
  id: string
  event: 'click' | 'hover' | 'dataChange'
  condition?: {
    type: 'comparison' | 'range' | 'expression'
    operator?: 'equals' | 'notEquals' | 'greaterThan' | 'lessThan' | 'contains'
    value?: any
  }
  responses: Array<{
    action: 'jump' | 'modify'
    target?: string
    value?: any
    targetComponentId?: string
    targetProperty?: string
  }>
  watchedProperty?: string
}

export interface InteractionListener {
  id: string
  componentId: string
  config: InteractionConfig
  unwatch?: () => void
  cleanup?: () => void
}

/**
 * 交互配置路由器 - 单例模式
 */
export class InteractionConfigRouter {
  private static instance: InteractionConfigRouter

  // 配置存储：componentId -> InteractionConfig[]
  private configMap = new Map<string, InteractionConfig[]>()

  // 监听器存储：componentId -> InteractionListener[]
  private listenerMap = new Map<string, InteractionListener[]>()

  // 组件实例缓存：componentId -> ComponentExpose
  private componentCache = new Map<string, any>()

  // 配置变更监听器
  private configChangeListeners = new Map<string, ((configs: InteractionConfig[]) => void)[]>()

  private constructor() {
    console.log('🔥 [InteractionConfigRouter] 路由器初始化')
  }

  static getInstance(): InteractionConfigRouter {
    if (!InteractionConfigRouter.instance) {
      InteractionConfigRouter.instance = new InteractionConfigRouter()
    }
    return InteractionConfigRouter.instance
  }

  /**
   * 🔥 核心方法：注册组件的交互配置
   */
  registerComponentConfigs(componentId: string, configs: InteractionConfig[]): void {
    console.log(`🔥 [InteractionConfigRouter] 注册组件交互配置: ${componentId}`, {
      配置数量: configs.length,
      配置详情: configs
    })

    // 清理旧配置和监听器
    this.clearComponentListeners(componentId)

    // 保存新配置
    this.configMap.set(componentId, configs)

    // 立即尝试注册监听器（如果组件已缓存）
    this.tryRegisterListeners(componentId)

    // 通知配置变更监听器
    this.notifyConfigChange(componentId, configs)
  }

  /**
   * 🔥 核心方法：注册组件实例，使其能够被监听
   */
  registerComponentInstance(componentId: string, componentExpose: any): void {
    console.log(`🔥 [InteractionConfigRouter] 注册组件实例: ${componentId}`, {
      有watchProperty方法: !!componentExpose.watchProperty,
      暴露的方法: Object.keys(componentExpose || {})
    })

    this.componentCache.set(componentId, componentExpose)

    // 立即尝试注册监听器（如果配置已存在）
    this.tryRegisterListeners(componentId)
  }

  /**
   * 🔥 核心方法：尝试注册监听器（配置和组件实例都齐全时）
   */
  private tryRegisterListeners(componentId: string): void {
    const configs = this.configMap.get(componentId)
    const componentExpose = this.componentCache.get(componentId)

    if (!configs || !componentExpose) {
      console.log(`🔥 [InteractionConfigRouter] 等待注册条件: ${componentId}`, {
        有配置: !!configs,
        有组件实例: !!componentExpose
      })
      return
    }

    console.log(`🔥 [InteractionConfigRouter] 开始注册监听器: ${componentId}`)

    const listeners: InteractionListener[] = []

    configs.forEach((config, index) => {
      const listener: InteractionListener = {
        id: `${componentId}_${config.id}_${index}`,
        componentId,
        config
      }

      // 根据事件类型注册不同的监听器
      switch (config.event) {
        case 'click':
          this.registerClickListener(listener, componentExpose)
          break
        case 'hover':
          this.registerHoverListener(listener, componentExpose)
          break
        case 'dataChange':
          this.registerDataChangeListener(listener, componentExpose)
          break
      }

      listeners.push(listener)
    })

    // 保存监听器引用
    this.listenerMap.set(componentId, listeners)

    console.log(`✅ [InteractionConfigRouter] 监听器注册完成: ${componentId}, 总数: ${listeners.length}`)
  }

  /**
   * 注册点击事件监听器
   */
  private registerClickListener(listener: InteractionListener, componentExpose: any): void {
    console.log(`🔥 [InteractionConfigRouter] 注册点击监听器: ${listener.id}`)

    // 通过DOM事件委托注册点击监听器
    const handleClick = async (event: Event) => {
      console.log(`🚀 [InteractionConfigRouter] 点击事件触发: ${listener.componentId}`)

      // 检查条件（如果有）
      if (listener.config.condition && !this.checkCondition(listener.config.condition, null)) {
        console.log(`🔥 [InteractionConfigRouter] 点击条件不满足`)
        return
      }

      // 执行响应
      await this.executeResponses(listener.config.responses, listener.componentId)
    }

    // 查找组件元素并添加监听器
    const componentElement = document.querySelector(`[data-component-id="${listener.componentId}"]`)
    if (componentElement) {
      componentElement.addEventListener('click', handleClick)

      // 保存清理函数
      listener.cleanup = () => {
        componentElement.removeEventListener('click', handleClick)
      }

      console.log(`✅ [InteractionConfigRouter] 点击监听器注册成功: ${listener.id}`)
    } else {
      console.warn(`❌ [InteractionConfigRouter] 未找到组件元素: ${listener.componentId}`)
    }
  }

  /**
   * 注册悬停事件监听器
   */
  private registerHoverListener(listener: InteractionListener, componentExpose: any): void {
    console.log(`🔥 [InteractionConfigRouter] 注册悬停监听器: ${listener.id}`)

    const handleMouseEnter = async (event: Event) => {
      console.log(`🚀 [InteractionConfigRouter] 悬停进入事件触发: ${listener.componentId}`)
      await this.executeResponses(listener.config.responses, listener.componentId)
    }

    const handleMouseLeave = async (event: Event) => {
      console.log(`🚀 [InteractionConfigRouter] 悬停离开事件触发: ${listener.componentId}`)
      // TODO: 支持悬停离开的配置
    }

    // 查找组件元素并添加监听器
    const componentElement = document.querySelector(`[data-component-id="${listener.componentId}"]`)
    if (componentElement) {
      componentElement.addEventListener('mouseenter', handleMouseEnter)
      componentElement.addEventListener('mouseleave', handleMouseLeave)

      // 保存清理函数
      listener.cleanup = () => {
        componentElement.removeEventListener('mouseenter', handleMouseEnter)
        componentElement.removeEventListener('mouseleave', handleMouseLeave)
      }

      console.log(`✅ [InteractionConfigRouter] 悬停监听器注册成功: ${listener.id}`)
    } else {
      console.warn(`❌ [InteractionConfigRouter] 未找到组件元素: ${listener.componentId}`)
    }
  }

  /**
   * 注册属性变化监听器
   */
  private registerDataChangeListener(listener: InteractionListener, componentExpose: any): void {
    if (!listener.config.watchedProperty) {
      console.warn(`❌ [InteractionConfigRouter] dataChange配置缺少watchedProperty: ${listener.id}`)
      return
    }

    if (!componentExpose.watchProperty) {
      console.warn(`❌ [InteractionConfigRouter] 组件不支持watchProperty: ${listener.componentId}`)
      return
    }

    console.log(`🔥 [InteractionConfigRouter] 注册属性变化监听器: ${listener.id}, 属性: ${listener.config.watchedProperty}`)

    try {
      const unwatch = componentExpose.watchProperty(
        listener.config.watchedProperty,
        async (newValue: any, oldValue: any) => {
          console.log(`🚀🚀🚀 [InteractionConfigRouter] 属性变化触发: ${listener.componentId}.${listener.config.watchedProperty}`, {
            newValue,
            oldValue,
            condition: listener.config.condition
          })

          // 检查条件
          let conditionMet = true
          if (listener.config.condition) {
            conditionMet = this.checkCondition(listener.config.condition, newValue)
            console.log(`🔥 [InteractionConfigRouter] 条件检查结果:`, {
              condition: listener.config.condition,
              value: newValue,
              conditionMet
            })
          }

          if (conditionMet) {
            console.log(`🚀 [InteractionConfigRouter] 条件满足，执行交互响应`)
            await this.executeResponses(listener.config.responses, listener.componentId)
          } else {
            console.log(`🔥 [InteractionConfigRouter] 条件不满足，跳过交互`)
          }
        }
      )

      // 保存unwatch函数
      listener.unwatch = unwatch

      console.log(`✅ [InteractionConfigRouter] 属性变化监听器注册成功: ${listener.id}`)
    } catch (error) {
      console.error(`❌ [InteractionConfigRouter] 注册属性监听器失败:`, error)
    }
  }

  /**
   * 🔥 核心方法：执行交互响应
   */
  private async executeResponses(responses: InteractionConfig['responses'], sourceComponentId: string): Promise<void> {
    console.log(`🔥 [InteractionConfigRouter] 执行交互响应:`, {
      responses,
      sourceComponentId
    })

    for (const response of responses) {
      switch (response.action) {
        case 'jump':
          this.executeJumpResponse(response)
          break
        case 'modify':
          await this.executeModifyResponse(response, sourceComponentId)
          break
        default:
          console.warn(`🔥 [InteractionConfigRouter] 未知的响应类型:`, response.action)
      }
    }
  }

  /**
   * 执行跳转响应
   */
  private executeJumpResponse(response: InteractionConfig['responses'][0]): void {
    console.log(`🔥 [InteractionConfigRouter] 执行跳转:`, response.value)

    if (response.value) {
      if (response.target === '_blank') {
        window.open(response.value, '_blank')
      } else {
        window.location.href = response.value
      }
    }
  }

  /**
   * 🔥 关键方法：执行跨组件属性修改响应
   */
  private async executeModifyResponse(response: InteractionConfig['responses'][0], sourceComponentId: string): Promise<void> {
    if (!response.targetComponentId || !response.targetProperty) {
      console.warn(`❌ [InteractionConfigRouter] 属性修改响应缺少目标信息:`, response)
      return
    }

    // 🔥 直接使用组件ID，无需 "self" 概念
    const actualTargetComponentId = response.targetComponentId

    console.log(`🔥 [InteractionConfigRouter] 执行组件属性修改:`, {
      源组件: sourceComponentId,
      目标组件: actualTargetComponentId,
      目标属性: response.targetProperty,
      新值: response.value,
      是否修改自己: actualTargetComponentId === sourceComponentId
    })

    try {
      // 🔥 关键：通过ConfigurationIntegrationBridge更新目标组件配置
      // 这确保修改的是配置，而不是临时状态，从而触发连锁反应
      const { configurationIntegrationBridge } = await import('./ConfigurationIntegrationBridge')

      const success = configurationIntegrationBridge.updateConfigurationForInteraction(
        actualTargetComponentId,
        'component',
        { [response.targetProperty!]: response.value }
      )

      if (success) {
        console.log(`✅ [InteractionConfigRouter] 跨组件属性修改成功`)

        // 🔥 发送属性变更事件，触发数据源动态参数更新
        window.dispatchEvent(new CustomEvent('property-change', {
          detail: {
            componentId: actualTargetComponentId,
            propertyName: response.targetProperty,
            newValue: response.value,
            source: 'interaction'
          }
        }))

        console.log(`🔥 [InteractionConfigRouter] 属性变更事件已发送`)
      } else {
        console.warn(`❌ [InteractionConfigRouter] 跨组件属性修改失败`)
      }
    } catch (error) {
      console.error(`❌ [InteractionConfigRouter] 执行属性修改时出错:`, error)
    }
  }

  /**
   * 条件检查
   */
  private checkCondition(condition: InteractionConfig['condition'], value: any): boolean {
    if (!condition) return true

    switch (condition.type) {
      case 'comparison':
        switch (condition.operator) {
          case 'equals':
            return value === condition.value
          case 'notEquals':
            return value !== condition.value
          case 'greaterThan':
            return Number(value) > Number(condition.value)
          case 'lessThan':
            return Number(value) < Number(condition.value)
          case 'contains':
            return String(value).includes(String(condition.value))
          default:
            return true
        }
      case 'range':
        // TODO: 实现范围检查
        return true
      case 'expression':
        // TODO: 实现表达式检查
        return true
      default:
        return true
    }
  }

  /**
   * 清理组件的所有监听器
   */
  private clearComponentListeners(componentId: string): void {
    const listeners = this.listenerMap.get(componentId)
    if (listeners) {
      console.log(`🔥 [InteractionConfigRouter] 清理组件监听器: ${componentId}, 数量: ${listeners.length}`)

      listeners.forEach(listener => {
        if (listener.unwatch) {
          listener.unwatch()
        }
        if (listener.cleanup) {
          listener.cleanup()
        }
      })

      this.listenerMap.delete(componentId)
    }
  }

  /**
   * 移除组件的所有配置和监听器
   */
  unregisterComponent(componentId: string): void {
    console.log(`🔥 [InteractionConfigRouter] 注销组件: ${componentId}`)

    this.clearComponentListeners(componentId)
    this.configMap.delete(componentId)
    this.componentCache.delete(componentId)
    this.configChangeListeners.delete(componentId)
  }

  /**
   * 监听配置变更
   */
  onConfigChange(componentId: string, callback: (configs: InteractionConfig[]) => void): () => void {
    if (!this.configChangeListeners.has(componentId)) {
      this.configChangeListeners.set(componentId, [])
    }

    this.configChangeListeners.get(componentId)!.push(callback)

    // 返回取消监听的函数
    return () => {
      const listeners = this.configChangeListeners.get(componentId)
      if (listeners) {
        const index = listeners.indexOf(callback)
        if (index > -1) {
          listeners.splice(index, 1)
        }
      }
    }
  }

  /**
   * 通知配置变更
   */
  private notifyConfigChange(componentId: string, configs: InteractionConfig[]): void {
    const listeners = this.configChangeListeners.get(componentId)
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(configs)
        } catch (error) {
          console.error(`❌ [InteractionConfigRouter] 配置变更通知失败:`, error)
        }
      })
    }
  }

  /**
   * 获取组件的交互配置
   */
  getComponentConfigs(componentId: string): InteractionConfig[] {
    return this.configMap.get(componentId) || []
  }

  /**
   * 获取全局统计信息
   */
  getStats(): {
    totalComponents: number
    totalConfigs: number
    totalListeners: number
  } {
    let totalConfigs = 0
    let totalListeners = 0

    this.configMap.forEach(configs => {
      totalConfigs += configs.length
    })

    this.listenerMap.forEach(listeners => {
      totalListeners += listeners.length
    })

    return {
      totalComponents: this.configMap.size,
      totalConfigs,
      totalListeners
    }
  }
}

// 导出单例实例
export const interactionConfigRouter = InteractionConfigRouter.getInstance()

export default interactionConfigRouter