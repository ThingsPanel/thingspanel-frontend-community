/**
 * GridPro 调整大小管理 Composable
 * 基于现代 Pointer Events API 和 ResizeObserver 实现高性能调整大小功能
 */

import { ref, computed, watch, readonly } from 'vue'
import { useResizeObserver } from '@vueuse/core'
import type { GridProItem, GridProConfig, ResizeState, ResizeHandle, Rectangle } from '../types/gridpro'
import { GridCalculator } from '../utils/gridAlgorithms'
import { createThrottledUpdater } from '../utils/performanceHelpers'
import { MathUtils } from '../utils/mathUtils'

export interface UseGridProResizeOptions {
  config: GridProConfig
  calculator: GridCalculator
  items: GridProItem[]
  onResizeStart?: (itemId: string, handle: ResizeHandle) => void
  onResizeMove?: (itemId: string, bounds: Rectangle) => void
  onResizeEnd?: (itemId: string, bounds: Rectangle) => void
  onError?: (error: Error) => void
}

export function useGridProResize(options: UseGridProResizeOptions) {
  // 调整大小状态
  const resizeState = ref<ResizeState>({
    isResizing: false,
    resizedItemId: null,
    handle: null,
    startBounds: { x: 0, y: 0, width: 0, height: 0 },
    currentBounds: { x: 0, y: 0, width: 0, height: 0 }
  })

  // 调整大小指示器
  const resizeIndicators = ref<{
    show: boolean
    bounds: Rectangle
    handle: ResizeHandle | null
  }>({
    show: false,
    bounds: { x: 0, y: 0, width: 0, height: 0 },
    handle: null
  })

  // 性能优化的更新函数
  const throttledResizeMove = createThrottledUpdater((bounds: Rectangle) => {
    updateResizeBounds(bounds)
  }, 16) // 60fps

  /**
   * 获取调整大小手柄列表
   */
  const getResizeHandles = (itemId: string): ResizeHandle[] => {
    const item = options.items.find(item => item.id === itemId)
    if (!item || !options.config.enableResize || item.static) {
      return []
    }

    // 使用项目自定义的手柄，或默认手柄
    return item.resizeHandles || ['se', 'sw', 'ne', 'nw', 'n', 's', 'e', 'w']
  }

  /**
   * 开始调整大小
   */
  const startResize = (
    itemId: string,
    handle: ResizeHandle,
    startEvent: PointerEvent,
    element: HTMLElement
  ): void => {
    try {
      const item = options.items.find(item => item.id === itemId)
      if (!item || !options.config.enableResize) return

      // 捕获指针
      element.setPointerCapture(startEvent.pointerId)

      const bounds = options.calculator.getItemBounds(item)
      
      // 更新调整大小状态
      resizeState.value = {
        isResizing: true,
        resizedItemId: itemId,
        handle,
        startBounds: bounds,
        currentBounds: bounds
      }

      // 显示调整大小指示器
      resizeIndicators.value = {
        show: true,
        bounds,
        handle
      }

      // 添加调整大小样式
      element.classList.add('gridpro-resizing')
      document.body.classList.add('gridpro-resize-active')

      // 添加全局事件监听器
      document.addEventListener('pointermove', handleGlobalPointerMove, { passive: false })
      document.addEventListener('pointerup', handleGlobalPointerUp, { passive: false })
      document.addEventListener('pointercancel', handleGlobalPointerCancel, { passive: false })

      options.onResizeStart?.(itemId, handle)
    } catch (error) {
      options.onError?.(error as Error)
    }
  }

  /**
   * 处理全局指针移动
   */
  const handleGlobalPointerMove = (event: PointerEvent): void => {
    if (!resizeState.value.isResizing) return

    event.preventDefault()
    
    const currentPosition = { x: event.clientX, y: event.clientY }
    const newBounds = calculateNewBounds(currentPosition)

    // 节流处理调整大小移动
    throttledResizeMove(newBounds)
  }

  /**
   * 处理全局指针释放
   */
  const handleGlobalPointerUp = (event: PointerEvent): void => {
    if (!resizeState.value.isResizing) return

    const finalPosition = { x: event.clientX, y: event.clientY }
    const finalBounds = calculateNewBounds(finalPosition)

    endResize(finalBounds)
  }

  /**
   * 处理全局指针取消
   */
  const handleGlobalPointerCancel = (): void => {
    if (resizeState.value.isResizing) {
      cancelResize()
    }
  }

  /**
   * 计算新的边界
   */
  const calculateNewBounds = (pointerPosition: { x: number; y: number }): Rectangle => {
    if (!resizeState.value.isResizing || !resizeState.value.handle) {
      return resizeState.value.currentBounds
    }

    const startBounds = resizeState.value.startBounds
    const handle = resizeState.value.handle
    const item = getCurrentResizedItem()

    if (!item) return startBounds

    // 将指针位置转换为网格坐标
    const gridPosition = options.calculator.pixelToGrid(pointerPosition.x, pointerPosition.y)
    const gridInfo = options.calculator.calculateGrid()

    let newBounds = { ...startBounds }

    // 根据手柄类型计算新边界
    switch (handle) {
      case 'se': // 右下角
        newBounds.width = Math.max(
          (gridPosition.x - item.x) * gridInfo.cellWidth,
          (item.minW || 1) * gridInfo.cellWidth
        )
        newBounds.height = Math.max(
          (gridPosition.y - item.y) * gridInfo.cellHeight,
          (item.minH || 1) * gridInfo.cellHeight
        )
        break

      case 'sw': // 左下角
        const newX = Math.min(gridPosition.x, item.x + item.w - (item.minW || 1))
        newBounds.x = newX * gridInfo.cellWidth + options.config.margin[0]
        newBounds.width = (item.x + item.w - newX) * gridInfo.cellWidth
        newBounds.height = Math.max(
          (gridPosition.y - item.y) * gridInfo.cellHeight,
          (item.minH || 1) * gridInfo.cellHeight
        )
        break

      case 'ne': // 右上角
        const newY = Math.min(gridPosition.y, item.y + item.h - (item.minH || 1))
        newBounds.y = newY * gridInfo.cellHeight + options.config.margin[1]
        newBounds.width = Math.max(
          (gridPosition.x - item.x) * gridInfo.cellWidth,
          (item.minW || 1) * gridInfo.cellWidth
        )
        newBounds.height = (item.y + item.h - newY) * gridInfo.cellHeight
        break

      case 'nw': // 左上角
        const newNwX = Math.min(gridPosition.x, item.x + item.w - (item.minW || 1))
        const newNwY = Math.min(gridPosition.y, item.y + item.h - (item.minH || 1))
        newBounds.x = newNwX * gridInfo.cellWidth + options.config.margin[0]
        newBounds.y = newNwY * gridInfo.cellHeight + options.config.margin[1]
        newBounds.width = (item.x + item.w - newNwX) * gridInfo.cellWidth
        newBounds.height = (item.y + item.h - newNwY) * gridInfo.cellHeight
        break

      case 'n': // 上边
        const newNY = Math.min(gridPosition.y, item.y + item.h - (item.minH || 1))
        newBounds.y = newNY * gridInfo.cellHeight + options.config.margin[1]
        newBounds.height = (item.y + item.h - newNY) * gridInfo.cellHeight
        break

      case 's': // 下边
        newBounds.height = Math.max(
          (gridPosition.y - item.y) * gridInfo.cellHeight,
          (item.minH || 1) * gridInfo.cellHeight
        )
        break

      case 'e': // 右边
        newBounds.width = Math.max(
          (gridPosition.x - item.x) * gridInfo.cellWidth,
          (item.minW || 1) * gridInfo.cellWidth
        )
        break

      case 'w': // 左边
        const newWX = Math.min(gridPosition.x, item.x + item.w - (item.minW || 1))
        newBounds.x = newWX * gridInfo.cellWidth + options.config.margin[0]
        newBounds.width = (item.x + item.w - newWX) * gridInfo.cellWidth
        break
    }

    // 应用最大尺寸限制
    if (item.maxW) {
      newBounds.width = Math.min(newBounds.width, item.maxW * gridInfo.cellWidth)
    }
    if (item.maxH) {
      newBounds.height = Math.min(newBounds.height, item.maxH * gridInfo.cellHeight)
    }

    // 确保不超出容器边界
    const containerBounds = {
      x: options.config.margin[0],
      y: options.config.margin[1],
      width: gridInfo.containerWidth - options.config.margin[0] * 2,
      height: gridInfo.containerHeight - options.config.margin[1] * 2
    }

    newBounds.x = Math.max(containerBounds.x, newBounds.x)
    newBounds.y = Math.max(containerBounds.y, newBounds.y)
    newBounds.width = Math.min(newBounds.width, containerBounds.width - (newBounds.x - containerBounds.x))
    newBounds.height = Math.min(newBounds.height, containerBounds.height - (newBounds.y - containerBounds.y))

    return newBounds
  }

  /**
   * 更新调整大小边界
   */
  const updateResizeBounds = (bounds: Rectangle): void => {
    if (!resizeState.value.isResizing || !resizeState.value.resizedItemId) return

    resizeState.value.currentBounds = bounds

    // 更新指示器
    resizeIndicators.value.bounds = bounds

    // 检查碰撞
    if (options.config.preventCollision) {
      const gridBounds = convertPixelBoundsToGrid(bounds)
      const testItem: GridProItem = {
        id: 'resize-test',
        x: gridBounds.x,
        y: gridBounds.y,
        w: gridBounds.w,
        h: gridBounds.h
      }

      const collisions = options.calculator.getCollisions(testItem,
        options.items.filter(item => item.id !== resizeState.value.resizedItemId)
      )

      if (collisions.length === 0) {
        // 位置有效，触发调整大小事件
        options.onResizeMove?.(resizeState.value.resizedItemId, bounds)
      }
    } else {
      // 不检查碰撞，直接调整大小
      options.onResizeMove?.(resizeState.value.resizedItemId, bounds)
    }
  }

  /**
   * 结束调整大小
   */
  const endResize = (finalBounds: Rectangle): void => {
    if (!resizeState.value.isResizing || !resizeState.value.resizedItemId) return

    try {
      const itemId = resizeState.value.resizedItemId

      // 清理调整大小状态
      cleanupResizeState()

      // 触发调整大小结束事件
      options.onResizeEnd?.(itemId, finalBounds)
    } catch (error) {
      options.onError?.(error as Error)
      cleanupResizeState()
    }
  }

  /**
   * 取消调整大小
   */
  const cancelResize = (): void => {
    cleanupResizeState()
  }

  /**
   * 清理调整大小状态
   */
  const cleanupResizeState = (): void => {
    // 移除全局事件监听器
    document.removeEventListener('pointermove', handleGlobalPointerMove)
    document.removeEventListener('pointerup', handleGlobalPointerUp)
    document.removeEventListener('pointercancel', handleGlobalPointerCancel)

    // 移除调整大小样式
    document.querySelectorAll('.gridpro-resizing').forEach(el => {
      el.classList.remove('gridpro-resizing')
    })
    document.body.classList.remove('gridpro-resize-active')

    // 隐藏指示器
    resizeIndicators.value.show = false

    // 重置状态
    resizeState.value = {
      isResizing: false,
      resizedItemId: null,
      handle: null,
      startBounds: { x: 0, y: 0, width: 0, height: 0 },
      currentBounds: { x: 0, y: 0, width: 0, height: 0 }
    }
  }

  /**
   * 将像素边界转换为网格边界
   */
  const convertPixelBoundsToGrid = (bounds: Rectangle): { x: number; y: number; w: number; h: number } => {
    const topLeft = options.calculator.pixelToGrid(bounds.x, bounds.y)
    const bottomRight = options.calculator.pixelToGrid(bounds.x + bounds.width, bounds.y + bounds.height)

    return {
      x: topLeft.x,
      y: topLeft.y,
      w: bottomRight.x - topLeft.x,
      h: bottomRight.y - topLeft.y
    }
  }

  /**
   * 获取当前调整大小的项目
   */
  const getCurrentResizedItem = (): GridProItem | undefined => {
    if (!resizeState.value.resizedItemId) return undefined
    return options.items.find(item => item.id === resizeState.value.resizedItemId)
  }

  /**
   * 检查元素是否可调整大小
   */
  const isResizable = (itemId: string): boolean => {
    const item = options.items.find(item => item.id === itemId)
    return !!(
      item &&
      options.config.enableResize &&
      (item.isResizable !== false) &&
      !item.static
    )
  }

  /**
   * 获取手柄的光标样式
   */
  const getHandleCursor = (handle: ResizeHandle): string => {
    const cursors: Record<ResizeHandle, string> = {
      'se': 'se-resize',
      'sw': 'sw-resize',
      'ne': 'ne-resize',
      'nw': 'nw-resize',
      'n': 'n-resize',
      's': 's-resize',
      'e': 'e-resize',
      'w': 'w-resize'
    }
    return cursors[handle] || 'default'
  }

  /**
   * 创建调整大小手柄
   */
  const createResizeHandle = (
    element: HTMLElement,
    itemId: string,
    handle: ResizeHandle
  ) => {
    const handleElement = document.createElement('div')
    handleElement.className = `gridpro-resize-handle gridpro-resize-handle-${handle}`
    handleElement.style.cursor = getHandleCursor(handle)

    const handlePointerDown = (event: PointerEvent) => {
      if (!isResizable(itemId)) return
      
      event.preventDefault()
      event.stopPropagation()
      
      startResize(itemId, handle, event, element)
    }

    handleElement.addEventListener('pointerdown', handlePointerDown, { passive: false })
    element.appendChild(handleElement)

    return {
      element: handleElement,
      destroy: () => {
        handleElement.removeEventListener('pointerdown', handlePointerDown)
        if (handleElement.parentNode) {
          handleElement.parentNode.removeChild(handleElement)
        }
      }
    }
  }

  /**
   * 为元素创建所有调整大小手柄
   */
  const createAllResizeHandles = (element: HTMLElement, itemId: string) => {
    const handles = getResizeHandles(itemId)
    const handleInstances = handles.map(handle => createResizeHandle(element, itemId, handle))

    return {
      handles: handleInstances,
      destroy: () => {
        handleInstances.forEach(handle => handle.destroy())
      }
    }
  }

  // 计算属性
  const isResizing = computed(() => resizeState.value.isResizing)
  const resizedItemId = computed(() => resizeState.value.resizedItemId)
  const currentHandle = computed(() => resizeState.value.handle)

  return {
    // 状态
    resizeState: readonly(resizeState),
    resizeIndicators: readonly(resizeIndicators),
    
    // 计算属性
    isResizing,
    resizedItemId,
    currentHandle,
    
    // 方法
    startResize,
    endResize,
    cancelResize,
    isResizable,
    getResizeHandles,
    getHandleCursor,
    createResizeHandle,
    createAllResizeHandles,
    getCurrentResizedItem
  }
}