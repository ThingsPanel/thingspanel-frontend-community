/**
 * GridPro 动画系统 Composable
 * 集成 @vueuse/motion 提供丝滑的动画体验
 */

import { ref, computed, watch, nextTick, readonly } from 'vue'
import { useMotion } from '@vueuse/motion'
import type { GridProItem, GridProConfig, AnimationConfig } from '../types/gridpro'
import { GridCalculator } from '../utils/gridAlgorithms'
import { EasingUtils, InterpolationUtils } from '../utils/mathUtils'
import { createBatchUpdater } from '../utils/performanceHelpers'

export interface UseGridProAnimationOptions {
  config: GridProConfig
  calculator: GridCalculator
  onAnimationStart?: (itemId: string, type: string) => void
  onAnimationComplete?: (itemId: string, type: string) => void
  onError?: (error: Error) => void
}

export interface AnimationItem {
  id: string
  element: HTMLElement
  motion: ReturnType<typeof useMotion>
  isAnimating: boolean
  animationType: string
}

export function useGridProAnimation(options: UseGridProAnimationOptions) {
  // 动画项目管理
  const animatedItems = ref<Map<string, AnimationItem>>(new Map())
  const isGlobalAnimating = ref(false)
  const animationQueue = ref<Array<() => Promise<void>>>([])
  
  // 性能优化
  const batchUpdater = createBatchUpdater()
  
  // 动画配置映射
  const animationDurations = {
    slow: 800,
    normal: 400,
    fast: 200
  }
  
  const easingFunctions = {
    'ease': 'cubic-bezier(0.25, 0.1, 0.25, 1)',
    'ease-in': 'cubic-bezier(0.42, 0, 1, 1)',
    'ease-out': 'cubic-bezier(0, 0, 0.58, 1)',
    'ease-in-out': 'cubic-bezier(0.42, 0, 0.58, 1)',
    'spring': 'cubic-bezier(0.175, 0.885, 0.32, 1.275)'
  }

  /**
   * 注册动画元素
   */
  const registerElement = (itemId: string, element: HTMLElement): void => {
    if (animatedItems.value.has(itemId)) return

    const motion = useMotion(element, {
      initial: {
        opacity: 1,
        scale: 1,
        x: 0,
        y: 0,
        rotate: 0
      },
      enter: {
        opacity: 1,
        scale: 1,
        x: 0,
        y: 0,
        rotate: 0,
        transition: {
          duration: getDuration(),
          ease: getEasing()
        }
      },
      leave: {
        opacity: 0,
        scale: 0.8,
        transition: {
          duration: getDuration(),
          ease: getEasing()
        }
      }
    })

    const animationItem: AnimationItem = {
      id: itemId,
      element,
      motion,
      isAnimating: false,
      animationType: 'none'
    }

    animatedItems.value.set(itemId, animationItem)
  }

  /**
   * 注销动画元素
   */
  const unregisterElement = (itemId: string): void => {
    const item = animatedItems.value.get(itemId)
    if (item) {
      // 如果正在动画中，先停止动画
      if (item.isAnimating) {
        stopAnimation(itemId)
      }
      animatedItems.value.delete(itemId)
    }
  }

  /**
   * 获取动画持续时间
   */
  const getDuration = (): number => {
    return animationDurations[options.config.animationSpeed] || animationDurations.normal
  }

  /**
   * 获取缓动函数
   */
  const getEasing = (): string => {
    return easingFunctions[options.config.easing] || easingFunctions['ease-out']
  }

  /**
   * 动画到指定位置
   */
  const animateToPosition = async (
    itemId: string,
    gridPosition: { x: number; y: number },
    immediate = false
  ): Promise<void> => {
    if (!options.config.enableTransitions && !immediate) return

    const item = animatedItems.value.get(itemId)
    if (!item) return

    try {
      const pixelPosition = options.calculator.gridToPixel(gridPosition.x, gridPosition.y)
      
      item.isAnimating = true
      item.animationType = 'position'
      options.onAnimationStart?.(itemId, 'position')

      if (immediate || !options.config.enableTransitions) {
        // 立即设置位置
        await item.motion.apply({
          x: pixelPosition.x,
          y: pixelPosition.y,
          transition: { duration: 0 }
        })
      } else {
        // 动画到新位置
        await item.motion.apply({
          x: pixelPosition.x,
          y: pixelPosition.y,
          transition: {
            duration: getDuration(),
            ease: getEasing()
          }
        })
      }

      item.isAnimating = false
      options.onAnimationComplete?.(itemId, 'position')
    } catch (error) {
      item.isAnimating = false
      options.onError?.(error as Error)
    }
  }

  /**
   * 动画到指定大小
   */
  const animateToSize = async (
    itemId: string,
    size: { width: number; height: number },
    immediate = false
  ): Promise<void> => {
    if (!options.config.enableTransitions && !immediate) return

    const item = animatedItems.value.get(itemId)
    if (!item) return

    try {
      item.isAnimating = true
      item.animationType = 'size'
      options.onAnimationStart?.(itemId, 'size')

      if (immediate || !options.config.enableTransitions) {
        // 立即设置大小
        item.element.style.width = `${size.width}px`
        item.element.style.height = `${size.height}px`
      } else {
        // 使用 CSS 动画
        const duration = getDuration()
        const easing = getEasing()
        
        item.element.style.transition = `width ${duration}ms ${easing}, height ${duration}ms ${easing}`
        item.element.style.width = `${size.width}px`
        item.element.style.height = `${size.height}px`

        // 等待动画完成
        await new Promise(resolve => setTimeout(resolve, duration))
        
        // 清除过渡样式
        item.element.style.transition = ''
      }

      item.isAnimating = false
      options.onAnimationComplete?.(itemId, 'size')
    } catch (error) {
      item.isAnimating = false
      options.onError?.(error as Error)
    }
  }

  /**
   * 进入动画
   */
  const animateEnter = async (itemId: string): Promise<void> => {
    const item = animatedItems.value.get(itemId)
    if (!item || !options.config.enableTransitions) return

    try {
      item.isAnimating = true
      item.animationType = 'enter'
      options.onAnimationStart?.(itemId, 'enter')

      // 初始状态
      await item.motion.apply({
        opacity: 0,
        scale: 0.8,
        y: -20,
        transition: { duration: 0 }
      })

      await nextTick()

      // 进入动画
      await item.motion.apply('enter')

      item.isAnimating = false
      options.onAnimationComplete?.(itemId, 'enter')
    } catch (error) {
      item.isAnimating = false
      options.onError?.(error as Error)
    }
  }

  /**
   * 离开动画
   */
  const animateLeave = async (itemId: string): Promise<void> => {
    const item = animatedItems.value.get(itemId)
    if (!item || !options.config.enableTransitions) return

    try {
      item.isAnimating = true
      item.animationType = 'leave'
      options.onAnimationStart?.(itemId, 'leave')

      await item.motion.apply('leave')

      item.isAnimating = false
      options.onAnimationComplete?.(itemId, 'leave')
    } catch (error) {
      item.isAnimating = false
      options.onError?.(error as Error)
    }
  }

  /**
   * 拖拽开始动画
   */
  const animateDragStart = async (itemId: string): Promise<void> => {
    const item = animatedItems.value.get(itemId)
    if (!item || !options.config.enableTransitions) return

    try {
      item.isAnimating = true
      item.animationType = 'drag-start'
      options.onAnimationStart?.(itemId, 'drag-start')

      await item.motion.apply({
        scale: 1.05,
        rotate: 2,
        zIndex: 1000,
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        transition: {
          duration: 150,
          ease: 'cubic-bezier(0.34, 1.56, 0.64, 1)'
        }
      })

      item.isAnimating = false
      options.onAnimationComplete?.(itemId, 'drag-start')
    } catch (error) {
      item.isAnimating = false
      options.onError?.(error as Error)
    }
  }

  /**
   * 拖拽结束动画
   */
  const animateDragEnd = async (itemId: string): Promise<void> => {
    const item = animatedItems.value.get(itemId)
    if (!item || !options.config.enableTransitions) return

    try {
      item.isAnimating = true
      item.animationType = 'drag-end'
      options.onAnimationStart?.(itemId, 'drag-end')

      await item.motion.apply({
        scale: 1,
        rotate: 0,
        zIndex: 1,
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        transition: {
          duration: 200,
          ease: getEasing()
        }
      })

      item.isAnimating = false
      options.onAnimationComplete?.(itemId, 'drag-end')
    } catch (error) {
      item.isAnimating = false
      options.onError?.(error as Error)
    }
  }

  /**
   * 调整大小开始动画
   */
  const animateResizeStart = async (itemId: string): Promise<void> => {
    const item = animatedItems.value.get(itemId)
    if (!item || !options.config.enableTransitions) return

    try {
      item.isAnimating = true
      item.animationType = 'resize-start'
      options.onAnimationStart?.(itemId, 'resize-start')

      await item.motion.apply({
        boxShadow: '0 0 0 2px #52c41a, 0 4px 16px rgba(82, 196, 26, 0.3)',
        transition: {
          duration: 150,
          ease: getEasing()
        }
      })

      item.isAnimating = false
      options.onAnimationComplete?.(itemId, 'resize-start')
    } catch (error) {
      item.isAnimating = false
      options.onError?.(error as Error)
    }
  }

  /**
   * 调整大小结束动画
   */
  const animateResizeEnd = async (itemId: string): Promise<void> => {
    const item = animatedItems.value.get(itemId)
    if (!item || !options.config.enableTransitions) return

    try {
      item.isAnimating = true
      item.animationType = 'resize-end'
      options.onAnimationStart?.(itemId, 'resize-end')

      await item.motion.apply({
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        transition: {
          duration: 200,
          ease: getEasing()
        }
      })

      item.isAnimating = false
      options.onAnimationComplete?.(itemId, 'resize-end')
    } catch (error) {
      item.isAnimating = false
      options.onError?.(error as Error)
    }
  }

  /**
   * 选中动画
   */
  const animateSelect = async (itemId: string): Promise<void> => {
    const item = animatedItems.value.get(itemId)
    if (!item || !options.config.enableTransitions) return

    try {
      item.isAnimating = true
      item.animationType = 'select'
      options.onAnimationStart?.(itemId, 'select')

      await item.motion.apply({
        boxShadow: '0 0 0 2px #1890ff, 0 4px 16px rgba(24, 144, 255, 0.3)',
        transition: {
          duration: 200,
          ease: getEasing()
        }
      })

      item.isAnimating = false
      options.onAnimationComplete?.(itemId, 'select')
    } catch (error) {
      item.isAnimating = false
      options.onError?.(error as Error)
    }
  }

  /**
   * 取消选中动画
   */
  const animateDeselect = async (itemId: string): Promise<void> => {
    const item = animatedItems.value.get(itemId)
    if (!item || !options.config.enableTransitions) return

    try {
      item.isAnimating = true
      item.animationType = 'deselect'
      options.onAnimationStart?.(itemId, 'deselect')

      await item.motion.apply({
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        transition: {
          duration: 200,
          ease: getEasing()
        }
      })

      item.isAnimating = false
      options.onAnimationComplete?.(itemId, 'deselect')
    } catch (error) {
      item.isAnimating = false
      options.onError?.(error as Error)
    }
  }

  /**
   * 批量布局动画
   */
  const animateLayoutChange = async (
    items: GridProItem[],
    immediate = false
  ): Promise<void> => {
    if (!options.config.enableTransitions && !immediate) return

    try {
      isGlobalAnimating.value = true

      const animationPromises = items.map(async (item) => {
        if (animatedItems.value.has(item.id)) {
          await animateToPosition(item.id, { x: item.x, y: item.y }, immediate)
        }
      })

      if (options.config.batchUpdates) {
        // 批量执行动画
        await Promise.all(animationPromises)
      } else {
        // 顺序执行动画（更流畅但慢一些）
        for (const promise of animationPromises) {
          await promise
        }
      }

      isGlobalAnimating.value = false
    } catch (error) {
      isGlobalAnimating.value = false
      options.onError?.(error as Error)
    }
  }

  /**
   * 停止动画
   */
  const stopAnimation = (itemId: string): void => {
    const item = animatedItems.value.get(itemId)
    if (item && item.isAnimating) {
      item.motion.stop()
      item.isAnimating = false
    }
  }

  /**
   * 停止所有动画
   */
  const stopAllAnimations = (): void => {
    animatedItems.value.forEach((item) => {
      if (item.isAnimating) {
        item.motion.stop()
        item.isAnimating = false
      }
    })
    isGlobalAnimating.value = false
  }

  /**
   * 创建自定义动画
   */
  const createCustomAnimation = (
    itemId: string,
    properties: Record<string, any>,
    config?: AnimationConfig
  ): Promise<void> => {
    const item = animatedItems.value.get(itemId)
    if (!item) return Promise.resolve()

    return new Promise((resolve, reject) => {
      try {
        item.isAnimating = true
        item.animationType = 'custom'
        options.onAnimationStart?.(itemId, 'custom')

        const animationConfig = {
          duration: config?.duration || getDuration(),
          ease: config?.easing || getEasing(),
          delay: config?.delay || 0,
          ...config
        }

        item.motion.apply({
          ...properties,
          transition: animationConfig
        }).then(() => {
          item.isAnimating = false
          options.onAnimationComplete?.(itemId, 'custom')
          resolve()
        }).catch(reject)
      } catch (error) {
        item.isAnimating = false
        reject(error)
      }
    })
  }

  /**
   * 预设动画效果
   */
  const animationPresets = {
    // 弹跳效果
    bounce: (itemId: string) => createCustomAnimation(itemId, {
      scale: [1, 1.1, 0.95, 1.02, 1],
      transition: {
        duration: 600,
        ease: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
      }
    }),

    // 摇摆效果
    shake: (itemId: string) => createCustomAnimation(itemId, {
      x: [0, -10, 10, -10, 10, 0],
      transition: {
        duration: 400,
        ease: 'ease-in-out'
      }
    }),

    // 脉冲效果
    pulse: (itemId: string) => createCustomAnimation(itemId, {
      scale: [1, 1.05, 1],
      opacity: [1, 0.8, 1],
      transition: {
        duration: 800,
        ease: 'ease-in-out'
      }
    }),

    // 闪烁效果
    flash: (itemId: string) => createCustomAnimation(itemId, {
      opacity: [1, 0.3, 1, 0.3, 1],
      transition: {
        duration: 500,
        ease: 'linear'
      }
    })
  }

  // 计算属性
  const hasActiveAnimations = computed(() => {
    return Array.from(animatedItems.value.values()).some(item => item.isAnimating) || isGlobalAnimating.value
  })

  const animatingItemIds = computed(() => {
    return Array.from(animatedItems.value.values())
      .filter(item => item.isAnimating)
      .map(item => item.id)
  })

  // 监听配置变化
  watch(() => options.config.enableTransitions, (enabled) => {
    if (!enabled) {
      stopAllAnimations()
    }
  })

  return {
    // 状态
    animatedItems: readonly(animatedItems),
    isGlobalAnimating: readonly(isGlobalAnimating),
    
    // 计算属性
    hasActiveAnimations,
    animatingItemIds,
    
    // 基础方法
    registerElement,
    unregisterElement,
    stopAnimation,
    stopAllAnimations,
    
    // 动画方法
    animateToPosition,
    animateToSize,
    animateEnter,
    animateLeave,
    animateDragStart,
    animateDragEnd,
    animateResizeStart,
    animateResizeEnd,
    animateSelect,
    animateDeselect,
    animateLayoutChange,
    createCustomAnimation,
    
    // 预设动画
    animationPresets,
    
    // 配置方法
    getDuration,
    getEasing
  }
}