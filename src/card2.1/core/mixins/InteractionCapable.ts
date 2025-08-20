/**
 * Card2.1 组件交互能力混入
 * 为所有Card2组件提供统一的交互接口和能力
 */

import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { interactionManager } from '../interaction-manager'
import type {
  InteractionConfig,
  InteractionEventType,
  InteractionResponseResult,
  ComponentInteractionState
} from '../interaction-types'
import type {
  InteractionProps,
  InteractionEmits,
  InteractionPermissionCheck,
  InteractionContext,
  InteractionCapabilityConfig
} from '../../types/interaction-component'

/**
 * 默认交互能力配置
 */
const DEFAULT_CONFIG: InteractionCapabilityConfig = {
  enabled: true,
  defaultPermissions: {
    allowExternalControl: true,
    supportedEvents: ['click', 'hover', 'dataChange', 'conditional']
  },
  enableDebug: false,
  performance: {
    debounceTime: 50,
    maxConcurrentInteractions: 5
  }
}

/**
 * 创建交互能力混入
 * @param config 交互能力配置
 */
export function useInteractionCapable(
  props: InteractionProps,
  emit: (event: any, ...args: any[]) => void,
  config: Partial<InteractionCapabilityConfig> = {}
) {
  // 合并配置
  const finalConfig = { ...DEFAULT_CONFIG, ...config }

  // 响应式状态
  const isInteractionEnabled = ref(finalConfig.enabled)
  const currentInteractionState = ref<ComponentInteractionState>({})
  const activeInteractions = ref(new Set<string>())
  const interactionHistory = ref<InteractionContext[]>([])

  // 计算属性
  const componentId = computed(() => props.componentId || `component-${Date.now()}`)

  const allowExternalControl = computed(() => {
    return props.allowExternalControl ?? finalConfig.defaultPermissions.allowExternalControl
  })

  const supportedEvents = computed(() => {
    const defaultEvents = finalConfig.defaultPermissions.supportedEvents
    const permissionEvents = props.interactionPermissions?.allowedEvents

    // 🔥 修复：如果有权限配置，合并默认事件和权限事件，确保包含核心事件
    if (permissionEvents) {
      const coreEvents = ['click', 'hover', 'dataChange', 'conditional']
      return [...new Set([...defaultEvents, ...permissionEvents, ...coreEvents])]
    }

    return defaultEvents
  })

  const interactionConfigs = computed(() => props.interactionConfigs || [])

  const hasActiveInteractions = computed(() => activeInteractions.value.size > 0)

  const interactionStatusText = computed(() => {
    if (!isInteractionEnabled.value) return '交互已禁用'
    if (!allowExternalControl.value) return '拒绝外部控制'
    if (hasActiveInteractions.value) return `执行中 (${activeInteractions.value.size})`
    return interactionConfigs.value.length > 0 ? '就绪' : '无交互配置'
  })

  /**
   * 检查交互权限
   */
  const checkInteractionPermission = (
    sourceComponentId: string | undefined,
    eventType: InteractionEventType
  ): InteractionPermissionCheck => {
    // 检查是否启用交互
    if (!isInteractionEnabled.value) {
      return {
        allowed: false,
        reason: '组件交互功能已禁用',
        code: 'EXTERNAL_CONTROL_DISABLED'
      }
    }

    // 检查是否允许外部控制
    if (!allowExternalControl.value && sourceComponentId) {
      return {
        allowed: false,
        reason: '组件不允许外部控制',
        code: 'EXTERNAL_CONTROL_DISABLED'
      }
    }

    // 检查事件类型支持
    if (!supportedEvents.value.includes(eventType)) {
      console.warn(`[INTERACTION-DEBUG] 事件不支持: ${eventType}, 支持的事件:`, supportedEvents.value)
      return {
        allowed: false,
        reason: `组件不支持 ${eventType} 事件`,
        code: 'EVENT_NOT_SUPPORTED'
      }
    }

    // 检查黑名单
    if (sourceComponentId && props.interactionPermissions?.blacklist?.includes(sourceComponentId)) {
      return {
        allowed: false,
        reason: `组件 ${sourceComponentId} 在黑名单中`,
        code: 'COMPONENT_BLACKLISTED'
      }
    }

    // 检查白名单（如果设置了白名单）
    if (sourceComponentId && props.interactionPermissions?.whitelist) {
      if (!props.interactionPermissions.whitelist.includes(sourceComponentId)) {
        return {
          allowed: false,
          reason: `组件 ${sourceComponentId} 不在白名单中`,
          code: 'COMPONENT_NOT_WHITELISTED'
        }
      }
    }

    return { allowed: true }
  }

  /**
   * 记录交互历史
   */
  const recordInteraction = (context: InteractionContext) => {
    interactionHistory.value.unshift(context)

    // 限制历史记录数量
    if (interactionHistory.value.length > 100) {
      interactionHistory.value = interactionHistory.value.slice(0, 100)
    }

    if (finalConfig.enableDebug) {
      console.log(`[InteractionCapable] ${componentId.value}:`, context)
    }
  }

  /**
   * 触发交互事件
   */
  const triggerInteractionEvent = (
    eventType: InteractionEventType,
    eventData?: any,
    sourceComponentId?: string
  ): InteractionResponseResult[] => {
    const context: InteractionContext = {
      sourceComponentId,
      targetComponentId: componentId.value,
      eventType,
      eventData,
      timestamp: Date.now(),
      isUserAction: !sourceComponentId
    }

    // 权限检查
    const permissionCheck = checkInteractionPermission(sourceComponentId, eventType)
    console.log(`[INTERACTION-DEBUG] 权限检查: ${permissionCheck.allowed ? '通过' : '失败'}`)

    if (!permissionCheck.allowed) {
      const rejectionInfo = {
        sourceComponentId,
        eventType,
        reason: permissionCheck.code as any,
        message: permissionCheck.reason || '权限检查失败'
      }

      console.error(`[INTERACTION-DEBUG] 权限失败:`, rejectionInfo.message)
      recordInteraction({ ...context, eventData: { ...eventData, rejected: true, reason: rejectionInfo } })
      emit('interaction-rejected', rejectionInfo)

      return [
        {
          success: false,
          componentId: componentId.value,
          action: 'custom' as any,
          error: permissionCheck.reason
        }
      ]
    }

    // 记录交互
    recordInteraction(context)

    // 发出交互事件
    emit('interaction-event', eventType, eventData)

    // 执行交互
    console.log(`[INTERACTION-DEBUG] 调用InteractionManager.triggerEvent(${eventType})`)
    const results = interactionManager.triggerEvent(componentId.value, eventType, eventData)
    console.log(`[INTERACTION-DEBUG] InteractionManager返回结果数量: ${results.length}`)

    // 发出交互结果
    results.forEach(result => {
      emit('interaction-result', result)
    })

    return results
  }

  /**
   * 处理交互状态变化
   */
  const handleInteractionStateChange = (newState: Partial<ComponentInteractionState>) => {
    currentInteractionState.value = { ...currentInteractionState.value, ...newState }
    emit('interaction-state-change', currentInteractionState.value)
  }

  /**
   * 应用交互结果到组件状态
   */
  const applyInteractionResult = (result: InteractionResponseResult) => {
    if (!result.success) return

    const stateUpdate: Partial<ComponentInteractionState> = {}

    // 根据动作类型更新状态
    switch (result.action) {
      case 'changeBackgroundColor':
        stateUpdate.backgroundColor = result.newValue
        break
      case 'changeTextColor':
        stateUpdate.textColor = result.newValue
        break
      case 'changeBorderColor':
        stateUpdate.borderColor = result.newValue
        break
      case 'changeSize':
        if (typeof result.newValue === 'object') {
          stateUpdate.width = result.newValue.width
          stateUpdate.height = result.newValue.height
        }
        break
      case 'changeOpacity':
        stateUpdate.opacity = result.newValue
        break
      case 'changeTransform':
        stateUpdate.transform = result.newValue
        break
      case 'changeVisibility':
        stateUpdate.visibility = result.newValue
        break
      case 'changeContent':
        stateUpdate.content = result.newValue
        break
      case 'triggerAnimation':
        stateUpdate.isAnimating = true
        // 动画结束后重置
        setTimeout(() => {
          handleInteractionStateChange({ isAnimating: false })
        }, 1000)
        break
    }

    if (Object.keys(stateUpdate).length > 0) {
      handleInteractionStateChange(stateUpdate)
    }
  }

  /**
   * 注册组件到交互管理器
   */
  const registerToInteractionManager = () => {
    if (componentId.value) {
      // 🔥 修复：始终注册组件，即使没有交互配置
      // 这样后续添加配置时可以正常工作
      const configs = interactionConfigs.value || []
      interactionManager.registerComponent(componentId.value, configs)

      if (finalConfig.enableDebug) {
        console.log(`[InteractionCapable] 注册组件到交互管理器: ${componentId.value}, 配置数量: ${configs.length}`)
      }
    }
  }

  /**
   * 从交互管理器注销组件
   */
  const unregisterFromInteractionManager = () => {
    if (componentId.value) {
      interactionManager.unregisterComponent(componentId.value, [])

      if (finalConfig.enableDebug) {
        console.log(`[InteractionCapable] 从交互管理器注销组件:`, componentId.value)
      }
    }
  }

  /**
   * 更新交互配置
   */
  const updateInteractionConfigs = () => {
    if (componentId.value) {
      // 🔥 修复：始终更新配置，即使配置数组为空
      const configs = interactionConfigs.value || []
      interactionManager.updateComponentConfigs(componentId.value, configs)

      if (finalConfig.enableDebug) {
        console.log(`[InteractionCapable] 更新交互配置: ${componentId.value}, 配置数量: ${configs.length}`)
      }
    }
  }

  /**
   * 防抖处理的事件触发器
   */
  let debounceTimers: Record<string, number> = {}

  const debouncedTriggerEvent = (eventType: InteractionEventType, eventData?: any) => {
    if (finalConfig.performance.debounceTime <= 0) {
      return triggerInteractionEvent(eventType, eventData)
    }

    const key = `${eventType}-${JSON.stringify(eventData)}`

    if (debounceTimers[key]) {
      clearTimeout(debounceTimers[key])
    }

    debounceTimers[key] = window.setTimeout(() => {
      triggerInteractionEvent(eventType, eventData)
      delete debounceTimers[key]
    }, finalConfig.performance.debounceTime)

    return []
  }

  /**
   * 通用事件处理器
   */
  const createEventHandler = (eventType: InteractionEventType) => {
    return (event?: Event) => {
      if (!props.previewMode) {
        // 编辑模式下不触发交互
        return
      }

      // 检查并发限制
      if (activeInteractions.value.size >= finalConfig.performance.maxConcurrentInteractions) {
        if (finalConfig.enableDebug) {
          console.warn(`[InteractionCapable] 达到最大并发交互限制:`, finalConfig.performance.maxConcurrentInteractions)
        }
        return
      }

      const interactionId = `${eventType}-${Date.now()}`
      activeInteractions.value.add(interactionId)

      const results = debouncedTriggerEvent(eventType, event)

      // 异步清理活跃交互标记
      nextTick(() => {
        setTimeout(() => {
          activeInteractions.value.delete(interactionId)
        }, 100)
      })

      return results
    }
  }

  // 监听交互配置变化
  watch(
    () => interactionConfigs.value,
    () => {
      updateInteractionConfigs()
    },
    { deep: true }
  )

  // 监听组件ID变化
  watch(
    () => componentId.value,
    (newId, oldId) => {
      if (oldId) {
        unregisterFromInteractionManager()
      }
      if (newId) {
        registerToInteractionManager()
      }
    }
  )

  // 生命周期钩子
  onMounted(() => {
    registerToInteractionManager()

    // 监听交互管理器的状态变化
    interactionManager.addEventListener(componentId.value, data => {
      if (data.event && data.data) {
        applyInteractionResult(data.data)
      }
    })
  })

  onUnmounted(() => {
    unregisterFromInteractionManager()

    // 清理防抖计时器
    Object.values(debounceTimers).forEach(timer => clearTimeout(timer))
    debounceTimers = {}

    // 清理状态
    activeInteractions.value.clear()
    interactionHistory.value = []
  })

  // 返回组合式函数接口
  return {
    // 响应式状态
    isInteractionEnabled,
    currentInteractionState,
    activeInteractions,
    interactionHistory,

    // 计算属性
    componentId,
    allowExternalControl,
    supportedEvents,
    interactionConfigs,
    hasActiveInteractions,
    interactionStatusText,

    // 方法
    triggerInteractionEvent,
    handleInteractionStateChange,
    applyInteractionResult,
    checkInteractionPermission,
    createEventHandler,
    registerToInteractionManager,
    unregisterFromInteractionManager,
    updateInteractionConfigs,

    // 工具方法
    setInteractionEnabled: (enabled: boolean) => {
      isInteractionEnabled.value = enabled
    },

    clearInteractionHistory: () => {
      interactionHistory.value = []
    },

    getInteractionStats: () => ({
      totalInteractions: interactionHistory.value.length,
      activeCount: activeInteractions.value.size,
      lastInteraction: interactionHistory.value[0],
      supportedEvents: supportedEvents.value,
      configCount: interactionConfigs.value.length
    })
  }
}
