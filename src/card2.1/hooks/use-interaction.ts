/**
 * Card2.1 组件交互系统组合式函数
 * 让组件能够轻松使用交互系统
 */

import { ref, computed, onMounted, onUnmounted } from 'vue'
import { interactionManager } from '@/card2.1/core/interaction-manager'
import type { InteractionConfig, ComponentInteractionState, InteractionEventType } from '@/card2.1/core/interaction-types'

export interface UseInteractionOptions {
  /** 组件ID，用于标识组件 */
  componentId: string
  /** 交互配置 */
  configs?: InteractionConfig[]
  /** 是否自动注册组件 */
  autoRegister?: boolean
  /** 是否自动监听状态变化 */
  autoWatch?: boolean
}

export function useInteraction(options: UseInteractionOptions) {
  const { componentId, configs = [], autoRegister = true, autoWatch = true } = options

  // 组件的交互状态
  const interactionState = ref<ComponentInteractionState>({})

  // 是否已注册
  const isRegistered = ref(false)

  // 计算样式对象
  const interactionStyles = computed(() => {
    const state = interactionState.value
    const styles: Record<string, any> = {}

    if (state.backgroundColor) {
      styles.backgroundColor = state.backgroundColor
    }

    if (state.textColor) {
      styles.color = state.textColor
    }

    if (state.borderColor) {
      styles.borderColor = state.borderColor
    }

    if (state.width !== undefined) {
      styles.width = typeof state.width === 'number' ? `${state.width}px` : state.width
    }

    if (state.height !== undefined) {
      styles.height = typeof state.height === 'number' ? `${state.height}px` : state.height
    }

    if (state.opacity !== undefined) {
      styles.opacity = state.opacity
    }

    if (state.transform) {
      styles.transform = state.transform
    }

    if (state.visibility) {
      styles.visibility = state.visibility
    }

    // 添加动画支持
    if (state.isAnimating) {
      styles.transition = 'all 0.3s ease-in-out'
    }

    return styles
  })

  // 注册组件
  const register = (configsToRegister: InteractionConfig[] = configs) => {
    if (isRegistered.value) {
      interactionManager.updateComponentConfigs(componentId, configsToRegister)
    } else {
      interactionManager.registerComponent(componentId, configsToRegister)
      isRegistered.value = true
    }
  }

  // 注销组件
  const unregister = () => {
    if (isRegistered.value) {
      interactionManager.unregisterComponent(componentId, [])
      isRegistered.value = false
    }
  }

  // 更新配置
  const updateConfigs = (newConfigs: InteractionConfig[]) => {
    if (isRegistered.value) {
      interactionManager.updateComponentConfigs(componentId, newConfigs)
    }
  }

  // 触发事件
  const triggerEvent = (event: InteractionEventType, data?: any) => {
    return interactionManager.triggerEvent(componentId, event, data)
  }

  // 重置状态
  const resetState = () => {
    interactionManager.resetComponentState(componentId)
  }

  // 获取当前状态
  const getState = () => {
    return interactionManager.getComponentState(componentId)
  }

  // 状态变化监听器
  const stateChangeListener = (data: any) => {
    if (data.componentId === componentId) {
      const newState = interactionManager.getComponentState(componentId)
      if (newState) {
        interactionState.value = { ...newState }
      }
    }
  }

  // 监听状态变化
  const watchState = () => {
    interactionManager.addEventListener(componentId, stateChangeListener)
  }

  // 停止监听状态变化
  const unwatchState = () => {
    interactionManager.removeEventListener(componentId, stateChangeListener)
  }

  // 预设的交互配置
  const createPresetConfig = {
    // 点击改变背景颜色
    clickChangeBackground: (color: string, priority = 1): InteractionConfig => ({
      event: 'click',
      responses: [{ action: 'changeBackgroundColor', value: color }],
      priority
    }),

    // 点击改变文字颜色
    clickChangeTextColor: (color: string, priority = 1): InteractionConfig => ({
      event: 'click',
      responses: [{ action: 'changeTextColor', value: color }],
      priority
    }),

    // 点击改变大小
    clickChangeSize: (width: number, height: number, priority = 1): InteractionConfig => ({
      event: 'click',
      responses: [{ action: 'changeSize', value: { width, height } }],
      priority
    }),

    // 悬停改变透明度
    hoverChangeOpacity: (opacity: number, priority = 1): InteractionConfig => ({
      event: 'hover',
      responses: [{ action: 'changeOpacity', value: opacity }],
      priority
    }),

    // 点击触发动画
    clickTriggerAnimation: (duration = 1000, priority = 1): InteractionConfig => ({
      event: 'click',
      responses: [{ action: 'triggerAnimation', value: true, duration }],
      priority
    }),

    // 自定义交互
    custom: (event: InteractionEventType, action: string, value: any, priority = 1): InteractionConfig => ({
      event,
      responses: [{ action: 'custom' as any, value }],
      priority
    })
  }

  // 生命周期钩子
  onMounted(() => {
    if (autoRegister) {
      register()
    }

    if (autoWatch) {
      watchState()
    }
  })

  onUnmounted(() => {
    if (autoWatch) {
      unwatchState()
    }

    if (autoRegister) {
      unregister()
    }
  })

  // 返回公共API
  return {
    // 状态
    interactionState,
    interactionStyles,
    isRegistered,

    // 方法
    register,
    unregister,
    updateConfigs,
    triggerEvent,
    resetState,
    getState,
    watchState,
    unwatchState,

    // 预设配置
    createPresetConfig
  }
}
