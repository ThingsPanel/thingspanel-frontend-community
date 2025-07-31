/**
 * GridPro 手势识别 Composable
 * 基于 @vueuse/gesture 实现高级手势识别功能
 */

import { ref, computed, onMounted, onUnmounted, readonly } from 'vue'
import { useDrag, useGesture } from '@vueuse/gesture'
import type { GridProConfig, GestureData, KeyboardShortcuts } from '../types/gridpro'
import { VectorUtils, MathUtils } from '../utils/mathUtils'

export interface UseGridProGestureOptions {
  config: GridProConfig
  onTap?: (position: { x: number; y: number }, event: PointerEvent) => void
  onLongPress?: (position: { x: number; y: number }, event: PointerEvent) => void
  onSwipe?: (direction: 'up' | 'down' | 'left' | 'right', velocity: { x: number; y: number }) => void
  onPinch?: (scale: number, center: { x: number; y: number }) => void
  onRotate?: (angle: number, center: { x: number; y: number }) => void
  onKeyboardShortcut?: (action: string, event: KeyboardEvent) => void
  onError?: (error: Error) => void
}

export function useGridProGesture(options: UseGridProGestureOptions) {
  // 手势状态
  const gestureState = ref<{
    isActive: boolean
    type: string | null
    startTime: number
    startPosition: { x: number; y: number }
    currentPosition: { x: number; y: number }
    velocity: { x: number; y: number }
    scale: number
    rotation: number
  }>({
    isActive: false,
    type: null,
    startTime: 0,
    startPosition: { x: 0, y: 0 },
    currentPosition: { x: 0, y: 0 },
    velocity: { x: 0, y: 0 },
    scale: 1,
    rotation: 0
  })

  // 手势识别参数
  const gestureConfig = {
    longPressDelay: 500,
    tapTimeout: 200,
    swipeThreshold: 50,
    swipeVelocityThreshold: 0.5,
    pinchThreshold: 0.1,
    rotateThreshold: 5
  }

  // 键盘快捷键配置
  const defaultKeyboardShortcuts: KeyboardShortcuts = {
    delete: ['Delete', 'Backspace'],
    selectAll: ['Control+a', 'Meta+a'],
    copy: ['Control+c', 'Meta+c'],
    paste: ['Control+v', 'Meta+v'],
    undo: ['Control+z', 'Meta+z'],
    redo: ['Control+y', 'Meta+y', 'Control+Shift+z', 'Meta+Shift+z'],
    duplicate: ['Control+d', 'Meta+d']
  }

  // 长按定时器
  let longPressTimer: NodeJS.Timeout | null = null
  let tapTimer: NodeJS.Timeout | null = null

  /**
   * 初始化手势识别
   */
  const initializeGesture = (containerElement: HTMLElement): void => {
    try {
      // 基础手势识别
      setupBasicGestures(containerElement)
      
      // 键盘事件
      setupKeyboardEvents()
      
      // 阻止默认的触摸行为
      containerElement.style.touchAction = 'none'
    } catch (error) {
      options.onError?.(error as Error)
    }
  }

  /**
   * 设置基础手势
   */
  const setupBasicGestures = (element: HTMLElement): void => {
    // 使用 @vueuse/gesture 的 useGesture
    const { drag, pinch } = useGesture({
      onDrag: ({ movement, velocity, first, last, event }) => {
        if (first) {
          handleGestureStart('drag', { x: event.clientX, y: event.clientY })
        }

        gestureState.value.currentPosition = {
          x: gestureState.value.startPosition.x + movement[0],
          y: gestureState.value.startPosition.y + movement[1]
        }
        gestureState.value.velocity = { x: velocity[0], y: velocity[1] }

        if (last) {
          handleGestureEnd('drag')
          checkSwipeGesture()
        }
      },

      onPinch: ({ offset, origin, first, last }) => {
        if (first) {
          handleGestureStart('pinch', { x: origin[0], y: origin[1] })
        }

        const scale = 1 + offset[0] / 100
        gestureState.value.scale = scale

        if (Math.abs(scale - 1) > gestureConfig.pinchThreshold) {
          options.onPinch?.(scale, { x: origin[0], y: origin[1] })
        }

        if (last) {
          handleGestureEnd('pinch')
        }
      }
    }, {
      target: element,
      drag: {
        threshold: 10
      },
      pinch: {
        threshold: 0.1
      }
    })

    // 手动处理指针事件以支持更多手势
    element.addEventListener('pointerdown', handlePointerDown, { passive: false })
    element.addEventListener('pointermove', handlePointerMove, { passive: false })
    element.addEventListener('pointerup', handlePointerUp, { passive: false })
    element.addEventListener('pointercancel', handlePointerCancel, { passive: false })
  }

  /**
   * 处理指针按下
   */
  const handlePointerDown = (event: PointerEvent): void => {
    const position = { x: event.clientX, y: event.clientY }
    
    // 开始长按检测
    longPressTimer = setTimeout(() => {
      if (gestureState.value.isActive && gestureState.value.type === 'tap') {
        handleLongPress(position, event)
      }
    }, gestureConfig.longPressDelay)

    // 开始点击检测
    handleGestureStart('tap', position)
  }

  /**
   * 处理指针移动
   */
  const handlePointerMove = (event: PointerEvent): void => {
    if (!gestureState.value.isActive) return

    const position = { x: event.clientX, y: event.clientY }
    const distance = VectorUtils.magnitude(
      VectorUtils.subtract(position, gestureState.value.startPosition)
    )

    // 如果移动距离超过阈值，取消点击和长按
    if (distance > 10) {
      clearTimeout(longPressTimer!)
      clearTimeout(tapTimer!)
      
      if (gestureState.value.type === 'tap') {
        gestureState.value.type = 'drag'
      }
    }

    gestureState.value.currentPosition = position
  }

  /**
   * 处理指针释放
   */
  const handlePointerUp = (event: PointerEvent): void => {
    if (!gestureState.value.isActive) return

    const position = { x: event.clientX, y: event.clientY }
    const duration = Date.now() - gestureState.value.startTime
    const distance = VectorUtils.magnitude(
      VectorUtils.subtract(position, gestureState.value.startPosition)
    )

    // 清除定时器
    clearTimeout(longPressTimer!)
    clearTimeout(tapTimer!)

    // 判断手势类型
    if (gestureState.value.type === 'tap' && distance < 10 && duration < gestureConfig.tapTimeout) {
      handleTap(position, event)
    } else if (distance > gestureConfig.swipeThreshold) {
      checkSwipeGesture()
    }

    handleGestureEnd(gestureState.value.type || 'unknown')
  }

  /**
   * 处理指针取消
   */
  const handlePointerCancel = (): void => {
    clearTimeout(longPressTimer!)
    clearTimeout(tapTimer!)
    handleGestureEnd('cancel')
  }

  /**
   * 手势开始
   */
  const handleGestureStart = (type: string, position: { x: number; y: number }): void => {
    gestureState.value = {
      isActive: true,
      type,
      startTime: Date.now(),
      startPosition: position,
      currentPosition: position,
      velocity: { x: 0, y: 0 },
      scale: 1,
      rotation: 0
    }
  }

  /**
   * 手势结束
   */
  const handleGestureEnd = (type: string): void => {
    gestureState.value.isActive = false
    gestureState.value.type = null
  }

  /**
   * 处理点击
   */
  const handleTap = (position: { x: number; y: number }, event: PointerEvent): void => {
    options.onTap?.(position, event)
  }

  /**
   * 处理长按
   */
  const handleLongPress = (position: { x: number; y: number }, event: PointerEvent): void => {
    // 添加触觉反馈（如果支持）
    if ('vibrate' in navigator) {
      navigator.vibrate(50)
    }
    
    options.onLongPress?.(position, event)
  }

  /**
   * 检查滑动手势
   */
  const checkSwipeGesture = (): void => {
    const deltaX = gestureState.value.currentPosition.x - gestureState.value.startPosition.x
    const deltaY = gestureState.value.currentPosition.y - gestureState.value.startPosition.y
    const velocityX = gestureState.value.velocity.x
    const velocityY = gestureState.value.velocity.y

    // 检查是否满足滑动条件
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
    const velocity = Math.sqrt(velocityX * velocityX + velocityY * velocityY)

    if (distance < gestureConfig.swipeThreshold || velocity < gestureConfig.swipeVelocityThreshold) {
      return
    }

    // 确定滑动方向
    let direction: 'up' | 'down' | 'left' | 'right'
    
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      direction = deltaX > 0 ? 'right' : 'left'
    } else {
      direction = deltaY > 0 ? 'down' : 'up'
    }

    options.onSwipe?.(direction, { x: velocityX, y: velocityY })
  }

  /**
   * 设置键盘事件
   */
  const setupKeyboardEvents = (): void => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      const key = getKeyCombo(event)
      const action = getActionForKey(key)
      
      if (action) {
        event.preventDefault()
        options.onKeyboardShortcut?.(action, event)
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    // 返回清理函数
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }

  /**
   * 获取按键组合
   */
  const getKeyCombo = (event: KeyboardEvent): string => {
    const parts: string[] = []
    
    if (event.ctrlKey) parts.push('Control')
    if (event.metaKey) parts.push('Meta')
    if (event.shiftKey) parts.push('Shift')
    if (event.altKey) parts.push('Alt')
    
    parts.push(event.key)
    
    return parts.join('+')
  }

  /**
   * 根据按键组合获取动作
   */
  const getActionForKey = (keyCombo: string): string | null => {
    for (const [action, keys] of Object.entries(defaultKeyboardShortcuts)) {
      if (keys.includes(keyCombo)) {
        return action
      }
    }
    return null
  }

  /**
   * 添加自定义快捷键
   */
  const addKeyboardShortcut = (action: string, keys: string[]): void => {
    defaultKeyboardShortcuts[action as keyof KeyboardShortcuts] = keys
  }

  /**
   * 移除快捷键
   */
  const removeKeyboardShortcut = (action: string): void => {
    delete defaultKeyboardShortcuts[action as keyof KeyboardShortcuts]
  }

  /**
   * 启用/禁用手势
   */
  const setGestureEnabled = (enabled: boolean): void => {
    // 这里可以动态启用/禁用手势识别
    // 实现取决于具体需求
  }

  /**
   * 获取手势识别状态
   */
  const getGestureState = (): typeof gestureState.value => {
    return { ...gestureState.value }
  }

  /**
   * 销毁手势识别
   */
  const destroyGesture = (): void => {
    clearTimeout(longPressTimer!)
    clearTimeout(tapTimer!)
    gestureState.value.isActive = false
  }

  // 计算属性
  const isGestureActive = computed(() => gestureState.value.isActive)
  const currentGestureType = computed(() => gestureState.value.type)
  const gestureVelocity = computed(() => gestureState.value.velocity)

  // 高级手势识别
  const advancedGestures = {
    /**
     * 双击检测
     */
    doubleTap: (callback: (position: { x: number; y: number }) => void) => {
      let firstTap: { time: number; position: { x: number; y: number } } | null = null
      
      return (position: { x: number; y: number }) => {
        const now = Date.now()
        
        if (!firstTap) {
          firstTap = { time: now, position }
          setTimeout(() => {
            firstTap = null
          }, 300)
        } else {
          const timeDiff = now - firstTap.time
          const distance = VectorUtils.magnitude(
            VectorUtils.subtract(position, firstTap.position)
          )
          
          if (timeDiff < 300 && distance < 20) {
            callback(position)
            firstTap = null
          }
        }
      }
    },

    /**
     * 三指手势检测
     */
    threeFingerGesture: (callback: (type: 'swipe' | 'tap') => void) => {
      // 实现三指手势识别逻辑
      // 这需要更复杂的多点触控处理
    }
  }

  onUnmounted(() => {
    destroyGesture()
  })

  return {
    // 状态
    gestureState: readonly(gestureState),
    
    // 计算属性
    isGestureActive,
    currentGestureType,
    gestureVelocity,
    
    // 方法
    initializeGesture,
    destroyGesture,
    setGestureEnabled,
    getGestureState,
    addKeyboardShortcut,
    removeKeyboardShortcut,
    
    // 高级手势
    advancedGestures
  }
}