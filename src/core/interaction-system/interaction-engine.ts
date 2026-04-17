/**
 * 🔥 交互执行引擎
 * 负责执行交互动作，实现组件间的双向绑定
 */

import { useEditorStore } from '@/store/modules/editor'
import { useMessage } from 'naive-ui'

export interface InteractionAction {
  action: string
  targetComponentId?: string
  targetProperty?: string
  updateValue?: any
  jumpConfig?: {
    jumpType: 'external' | 'internal'
    url?: string
    internalPath?: string
    target?: string
  }
  modifyConfig?: {
    targetComponentId: string
    targetProperty: string
    updateValue: any
    updateMode?: 'replace' | 'merge' | 'append'
  }
}

export interface InteractionEvent {
  event: string
  watchedProperty?: string
  condition?: {
    type: 'comparison' | 'range' | 'expression'
    operator?: string
    value?: any
  }
  responses: InteractionAction[]
  enabled: boolean
}

/**
 * 🔥 创建交互执行引擎
 */
export function createInteractionEngine() {
  const editorStore = useEditorStore()
  const message = useMessage()

  /**
   * 🔥 执行跳转动作
   */
  const executeJumpAction = (action: InteractionAction) => {
    try {
      if (action.jumpConfig) {
        const { jumpType, url, internalPath, target = '_self' } = action.jumpConfig

        if (jumpType === 'external' && url) {
          window.open(url, target)
        } else if (jumpType === 'internal' && internalPath) {
          if (target === '_blank') {
            window.open(`${window.location.origin}${internalPath}`, '_blank')
          } else {
            window.location.href = internalPath
          }
        }
      } else {
        // 兼容旧格式
        const url = action.updateValue || ''
        const target = action.targetProperty || '_blank'
        window.open(url, target)
      }
    } catch (error) {
      console.error('🔥 [InteractionEngine] 跳转执行失败:', error)
      message.error(`跳转失败: ${error.message}`)
    }
  }

  /**
   * 🔥 执行属性修改动作
   */
  const executeModifyAction = (action: InteractionAction) => {
    try {
      const { targetComponentId, targetProperty, updateValue } = action.modifyConfig || action

      if (!targetComponentId || !targetProperty) {
        throw new Error('缺少目标组件ID或属性名')
      }

      // 找到目标组件节点
      const targetNode = editorStore.nodes.find(node => node.id === targetComponentId)
      if (!targetNode) {
        throw new Error(`目标组件未找到: ${targetComponentId}`)
      }

      // 🔥 更新目标组件的属性
      // 首先尝试更新unifiedConfig中的component配置
      const currentMetadata = targetNode.metadata || {}
      const currentUnifiedConfig = currentMetadata.unifiedConfig || {}
      const currentComponent = currentUnifiedConfig.component || {}

      // 更新组件配置
      const updatedComponent = {
        ...currentComponent,
        [targetProperty]: updateValue
      }

      // 更新节点
      editorStore.updateNode(targetComponentId, {
        properties: {
          ...targetNode.properties,
          [targetProperty]: updateValue
        },
        metadata: {
          ...currentMetadata,
          unifiedConfig: {
            ...currentUnifiedConfig,
            component: updatedComponent
          },
          lastInteractionUpdate: Date.now()
        }
      })

      // 🔥 额外处理：如果目标组件有useCard2Props，直接调用其属性暴露方法
      try {
        const targetElement = document.querySelector(`[data-component-id="${targetComponentId}"]`)
        if (targetElement && (targetElement as any)?.__vueParentComponent?.exposed?.updateConfig) {
          ;(targetElement as any).__vueParentComponent.exposed.updateConfig('component', updatedComponent)
        }
      } catch (error) {
        console.warn(`🔥 [InteractionEngine] 直接更新组件配置失败:`, error)
      }

      message.success(`属性已更新: ${targetProperty} = ${updateValue}`)
    } catch (error) {
      console.error('🔥 [InteractionEngine] 属性修改失败:', error)
      message.error(`属性修改失败: ${error.message}`)
    }
  }

  /**
   * 🔥 执行单个交互动作
   */
  const executeAction = (action: InteractionAction) => {
    switch (action.action) {
      case 'jump':
      case 'navigateToUrl':
        executeJumpAction(action)
        break

      case 'modify':
      case 'updateComponentData':
        executeModifyAction(action)
        break

      default:
        console.warn(`🔥 [InteractionEngine] 未知的交互动作类型: ${action.action}`)
        message.warning(`未知的交互动作: ${action.action}`)
    }
  }

  /**
   * 🔥 执行交互事件
   */
  const executeInteraction = (interaction: InteractionEvent, triggerData?: any) => {
    if (!interaction.enabled) {
      return
    }

    // 检查条件是否满足（用于dataChange事件）
    if (interaction.event === 'dataChange' && interaction.condition && triggerData !== undefined) {
      if (!checkCondition(interaction.condition, triggerData)) {
        return
      }
    }

    // 执行所有响应动作
    interaction.responses.forEach(action => {
      executeAction(action)
    })
  }

  /**
   * 🔥 检查条件是否满足
   */
  const checkCondition = (condition: InteractionEvent['condition'], value: any): boolean => {
    if (!condition) return true

    try {
      switch (condition.type) {
        case 'comparison':
          return checkComparisonCondition(condition.operator, value, condition.value)

        case 'range':
          return checkRangeCondition(value, condition.value)

        case 'expression':
          return checkExpressionCondition(value, condition.value)

        default:
          console.warn(`🔥 [InteractionEngine] 未知的条件类型: ${condition.type}`)
          return true
      }
    } catch (error) {
      console.error(`🔥 [InteractionEngine] 条件检查失败:`, error)
      return false
    }
  }

  /**
   * 🔥 检查比较条件
   */
  const checkComparisonCondition = (operator: string, actualValue: any, expectedValue: any): boolean => {
    switch (operator) {
      case 'equals':
        return actualValue == expectedValue
      case 'notEquals':
        return actualValue != expectedValue
      case 'greaterThan':
        return Number(actualValue) > Number(expectedValue)
      case 'greaterThanOrEqual':
        return Number(actualValue) >= Number(expectedValue)
      case 'lessThan':
        return Number(actualValue) < Number(expectedValue)
      case 'lessThanOrEqual':
        return Number(actualValue) <= Number(expectedValue)
      case 'contains':
        return String(actualValue).includes(String(expectedValue))
      case 'startsWith':
        return String(actualValue).startsWith(String(expectedValue))
      case 'endsWith':
        return String(actualValue).endsWith(String(expectedValue))
      default:
        console.warn(`🔥 [InteractionEngine] 未知的比较操作符: ${operator}`)
        return false
    }
  }

  /**
   * 🔥 检查范围条件
   */
  const checkRangeCondition = (value: any, rangeValue: string): boolean => {
    try {
      // 简单的范围格式：min-max 或 >min 或 <max
      const numValue = Number(value)

      if (rangeValue.includes('-')) {
        const [min, max] = rangeValue.split('-').map(Number)
        return numValue >= min && numValue <= max
      } else if (rangeValue.startsWith('>')) {
        const min = Number(rangeValue.substring(1))
        return numValue > min
      } else if (rangeValue.startsWith('<')) {
        const max = Number(rangeValue.substring(1))
        return numValue < max
      }

      return false
    } catch (error) {
      console.error(`🔥 [InteractionEngine] 范围条件解析失败:`, error)
      return false
    }
  }

  /**
   * 🔥 检查表达式条件
   */
  const checkExpressionCondition = (value: any, expression: string): boolean => {
    try {
      // 简单的表达式求值（仅支持基本运算，安全考虑）
      // 这里可以扩展为更复杂的表达式引擎
      const safeExpression = expression.replace(/value/g, String(value))

      // 基本的数学表达式评估
      if (/^[\d\s+\-*/.()><=!&|]+$/.test(safeExpression)) {
        return Function(`"use strict"; return (${safeExpression})`)()
      }

      return false
    } catch (error) {
      console.error(`🔥 [InteractionEngine] 表达式条件评估失败:`, error)
      return false
    }
  }

  /**
   * 🔥 注册组件属性监听器
   */
  const registerPropertyWatcher = (componentId: string, propertyName: string, interactions: InteractionEvent[]) => {
    // 找到目标组件
    const targetNode = editorStore.nodes.find(node => node.id === componentId)
    if (!targetNode) {
      console.warn(`🔥 [InteractionEngine] 注册属性监听失败，组件未找到: ${componentId}`)
      return
    }

    // 🔥 通过Card2Props的watchProperty方法注册监听器
    try {
      const targetElement = document.querySelector(`[data-component-id="${componentId}"]`)
      if (targetElement && (targetElement as any)?.__vueParentComponent?.exposed?.watchProperty) {
        const unwatch = (targetElement as any).__vueParentComponent.exposed.watchProperty(
          propertyName,
          (newValue: any, oldValue: any) => {
            // 执行相关的交互
            interactions.forEach(interaction => {
              if (interaction.event === 'dataChange' && interaction.watchedProperty === propertyName) {
                executeInteraction(interaction, newValue)
              }
            })
          }
        )

        return unwatch
      }
    } catch (error) {
      console.error(`🔥 [InteractionEngine] 属性监听器注册失败:`, error)
    }

    return null
  }

  return {
    executeAction,
    executeInteraction,
    registerPropertyWatcher,
    checkCondition
  }
}

/**
 * 🔥 全局交互引擎实例
 */
export const interactionEngine = createInteractionEngine()
