/**
 * GridPro 拖拽管理 Composable
 * 基于现代 Pointer Events API 实现高性能拖拽功能
 */

import { ref, computed, nextTick, readonly } from 'vue'
import { useDrag } from '@vueuse/gesture'
import type { GridProItem, GridProConfig, DragState, Position, Rectangle } from '../types/gridpro'
import { GridCalculator } from '../utils/gridAlgorithms'
import { createThrottledUpdater, createDebouncedUpdater } from '../utils/performanceHelpers'
import { MathUtils, VectorUtils } from '../utils/mathUtils'

export interface UseGridProDragOptions {
  config: GridProConfig
  calculator: GridCalculator
  items: GridProItem[]
  onDragStart?: (itemId: string, position: Position) => void
  onDragMove?: (itemId: string, position: Position) => void
  onDragEnd?: (itemId: string, position: Position) => void
  onDragCancel?: (itemId: string) => void
  onError?: (error: Error) => void
}

export function useGridProDrag(options: UseGridProDragOptions) {
  // 拖拽状态
  const dragState = ref<DragState>({
    isDragging: false,
    draggedItemId: null,
    startPosition: { x: 0, y: 0 },
    currentPosition: { x: 0, y: 0 },
    offset: { x: 0, y: 0 },
    preview: false
  })

  // 拖拽预览元素
  const dragPreviewRef = ref<HTMLElement>()
  const dragPreviewStyle = ref<Record<string, string>>({})

  // 吸附辅助线
  const snapLines = ref<{
    vertical: number[]
    horizontal: number[]
    show: boolean
  }>({
    vertical: [],
    horizontal: [],
    show: false
  })

  // 性能优化的更新函数
  const throttledDragMove = createThrottledUpdater((position: Position) => {
    updateDragPosition(position)
  }, 16) // 60fps

  const debouncedSnapUpdate = createDebouncedUpdater(() => {
    updateSnapLines()
  }, 100)

  /**
   * 初始化拖拽系统
   */
  const initializeDrag = (): void => {
    // 这里可以初始化一些全局拖拽设置
    if (typeof document !== 'undefined') {
      document.addEventListener('pointermove', handleGlobalPointerMove, { passive: false })
      document.addEventListener('pointerup', handleGlobalPointerUp, { passive: false })
      document.addEventListener('pointercancel', handleGlobalPointerCancel, { passive: false })
    }
  }

  /**
   * 销毁拖拽系统
   */
  const destroyDrag = (): void => {
    if (typeof document !== 'undefined') {
      document.removeEventListener('pointermove', handleGlobalPointerMove)
      document.removeEventListener('pointerup', handleGlobalPointerUp)
      document.removeEventListener('pointercancel', handleGlobalPointerCancel)
    }
    
    if (dragState.value.isDragging) {
      cancelDrag()
    }
  }

  /**
   * 开始拖拽
   */
  const startDrag = (
    itemId: string,
    startEvent: PointerEvent,
    element: HTMLElement
  ): void => {
    try {
      const item = options.items.find(item => item.id === itemId)
      if (!item || !options.config.enableDrag) return

      // 捕获指针
      element.setPointerCapture(startEvent.pointerId)

      const rect = element.getBoundingClientRect()
      const startPosition = {
        x: startEvent.clientX,
        y: startEvent.clientY
      }

      const offset = {
        x: startEvent.clientX - rect.left,
        y: startEvent.clientY - rect.top
      }

      // 更新拖拽状态
      dragState.value = {
        isDragging: true,
        draggedItemId: itemId,
        startPosition,
        currentPosition: startPosition,
        offset,
        preview: options.config.enableTransitions
      }

      // 创建拖拽预览
      if (options.config.enableTransitions) {
        createDragPreview(element, startPosition, offset)
      }

      // 显示吸附辅助线
      if (options.config.enableSnap) {
        updateSnapLines()
        snapLines.value.show = true
      }

      // 添加拖拽样式
      element.classList.add('gridpro-dragging')
      document.body.classList.add('gridpro-drag-active')

      options.onDragStart?.(itemId, startPosition)
    } catch (error) {
      options.onError?.(error as Error)
    }
  }

  /**
   * 处理全局指针移动
   */
  const handleGlobalPointerMove = (event: PointerEvent): void => {
    if (!dragState.value.isDragging) return

    event.preventDefault()
    
    const currentPosition = {
      x: event.clientX,
      y: event.clientY
    }

    dragState.value.currentPosition = currentPosition

    // 节流处理拖拽移动
    throttledDragMove(currentPosition)
  }

  /**
   * 处理全局指针释放
   */
  const handleGlobalPointerUp = (event: PointerEvent): void => {
    if (!dragState.value.isDragging) return

    const finalPosition = {
      x: event.clientX,
      y: event.clientY
    }

    endDrag(finalPosition)
  }

  /**
   * 处理全局指针取消
   */
  const handleGlobalPointerCancel = (): void => {
    if (dragState.value.isDragging) {
      cancelDrag()
    }
  }

  /**
   * 更新拖拽位置
   */
  const updateDragPosition = (position: Position): void => {
    if (!dragState.value.isDragging || !dragState.value.draggedItemId) return

    // 计算网格位置
    const gridPosition = options.calculator.pixelToGrid(
      position.x - dragState.value.offset.x,
      position.y - dragState.value.offset.y
    )

    // 应用吸附
    const snappedPosition = options.config.enableSnap
      ? applySnapping(gridPosition)
      : gridPosition

    // 更新预览位置
    if (dragPreviewRef.value) {
      updateDragPreview(position)
    }

    // 检查碰撞
    if (options.config.preventCollision) {
      const testItem: GridProItem = {
        id: 'drag-test',
        x: snappedPosition.x,
        y: snappedPosition.y,
        w: getCurrentDraggedItem()?.w || 1,
        h: getCurrentDraggedItem()?.h || 1
      }

      const collisions = options.calculator.getCollisions(testItem, 
        options.items.filter(item => item.id !== dragState.value.draggedItemId)
      )

      if (collisions.length === 0) {
        // 位置有效，触发移动事件
        options.onDragMove?.(dragState.value.draggedItemId, snappedPosition)
      }
    } else {
      // 不检查碰撞，直接移动
      options.onDragMove?.(dragState.value.draggedItemId, snappedPosition)
    }

    // 更新吸附辅助线
    if (options.config.enableSnap) {
      debouncedSnapUpdate()
    }
  }

  /**
   * 结束拖拽
   */
  const endDrag = (finalPosition: Position): void => {
    if (!dragState.value.isDragging || !dragState.value.draggedItemId) return

    try {
      const itemId = dragState.value.draggedItemId

      // 计算最终网格位置
      const gridPosition = options.calculator.pixelToGrid(
        finalPosition.x - dragState.value.offset.x,
        finalPosition.y - dragState.value.offset.y
      )

      const snappedPosition = options.config.enableSnap
        ? applySnapping(gridPosition)
        : gridPosition

      // 清理拖拽状态
      cleanupDragState()

      // 触发拖拽结束事件
      options.onDragEnd?.(itemId, snappedPosition)
    } catch (error) {
      options.onError?.(error as Error)
      cleanupDragState()
    }
  }

  /**
   * 取消拖拽
   */
  const cancelDrag = (): void => {
    if (!dragState.value.isDragging || !dragState.value.draggedItemId) return

    const itemId = dragState.value.draggedItemId
    cleanupDragState()
    options.onDragCancel?.(itemId)
  }

  /**
   * 清理拖拽状态
   */
  const cleanupDragState = (): void => {
    // 移除拖拽样式
    document.querySelectorAll('.gridpro-dragging').forEach(el => {
      el.classList.remove('gridpro-dragging')
    })
    document.body.classList.remove('gridpro-drag-active')

    // 隐藏吸附辅助线
    snapLines.value.show = false

    // 移除拖拽预览
    removeDragPreview()

    // 重置状态
    dragState.value = {
      isDragging: false,
      draggedItemId: null,
      startPosition: { x: 0, y: 0 },
      currentPosition: { x: 0, y: 0 },
      offset: { x: 0, y: 0 },
      preview: false
    }
  }

  /**
   * 创建拖拽预览
   */
  const createDragPreview = (
    element: HTMLElement,
    position: Position,
    offset: Position
  ): void => {
    if (!options.config.enableTransitions) return

    const preview = element.cloneNode(true) as HTMLElement
    preview.id = 'gridpro-drag-preview'
    preview.classList.add('gridpro-drag-preview')
    
    // 设置预览样式
    const previewStyles = {
      position: 'fixed',
      top: `${position.y - offset.y}px`,
      left: `${position.x - offset.x}px`,
      width: `${element.offsetWidth}px`,
      height: `${element.offsetHeight}px`,
      zIndex: '9999',
      pointerEvents: 'none',
      opacity: '0.8',
      transform: 'rotate(3deg) scale(1.05)',
      transition: 'transform 0.1s ease-out',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
    }

    Object.assign(preview.style, previewStyles)
    dragPreviewStyle.value = previewStyles

    document.body.appendChild(preview)
    dragPreviewRef.value = preview
  }

  /**
   * 更新拖拽预览位置
   */
  const updateDragPreview = (position: Position): void => {
    if (!dragPreviewRef.value) return

    dragPreviewRef.value.style.left = `${position.x - dragState.value.offset.x}px`
    dragPreviewRef.value.style.top = `${position.y - dragState.value.offset.y}px`
  }

  /**
   * 移除拖拽预览
   */
  const removeDragPreview = (): void => {
    if (dragPreviewRef.value) {
      document.body.removeChild(dragPreviewRef.value)
      dragPreviewRef.value = undefined
    }
  }

  /**
   * 应用吸附
   */
  const applySnapping = (position: Position): Position => {
    if (!options.config.enableSnap) return position

    const tolerance = options.config.snapTolerance || 10
    const gridInfo = options.calculator.calculateGrid()

    let snappedX = position.x
    let snappedY = position.y

    // 网格对齐
    const nearestGridX = Math.round(position.x)
    const nearestGridY = Math.round(position.y)

    if (Math.abs(position.x - nearestGridX) <= tolerance / gridInfo.cellWidth) {
      snappedX = nearestGridX
    }

    if (Math.abs(position.y - nearestGridY) <= tolerance / gridInfo.cellHeight) {
      snappedY = nearestGridY
    }

    // 与其他项目对齐
    const currentItem = getCurrentDraggedItem()
    if (currentItem) {
      options.items.forEach(item => {
        if (item.id === dragState.value.draggedItemId) return

        // 左对齐
        if (Math.abs(position.x - item.x) <= tolerance / gridInfo.cellWidth) {
          snappedX = item.x
        }

        // 右对齐
        if (Math.abs(position.x - (item.x + item.w)) <= tolerance / gridInfo.cellWidth) {
          snappedX = item.x + item.w
        }

        // 顶对齐
        if (Math.abs(position.y - item.y) <= tolerance / gridInfo.cellHeight) {
          snappedY = item.y
        }

        // 底对齐
        if (Math.abs(position.y - (item.y + item.h)) <= tolerance / gridInfo.cellHeight) {
          snappedY = item.y + item.h
        }
      })
    }

    return { x: snappedX, y: snappedY }
  }

  /**
   * 更新吸附辅助线
   */
  const updateSnapLines = (): void => {
    if (!options.config.enableSnap || !dragState.value.isDragging) return

    const vertical: number[] = []
    const horizontal: number[] = []

    // 添加网格线
    const gridInfo = options.calculator.calculateGrid()
    for (let i = 0; i <= options.config.columns; i++) {
      vertical.push(i * gridInfo.cellWidth)
    }

    // 添加项目边界线
    options.items.forEach(item => {
      if (item.id === dragState.value.draggedItemId) return

      const bounds = options.calculator.getItemBounds(item)
      vertical.push(bounds.x, bounds.x + bounds.width)
      horizontal.push(bounds.y, bounds.y + bounds.height)
    })

    snapLines.value.vertical = [...new Set(vertical)].sort((a, b) => a - b)
    snapLines.value.horizontal = [...new Set(horizontal)].sort((a, b) => a - b)
  }

  /**
   * 获取当前拖拽的项目
   */
  const getCurrentDraggedItem = (): GridProItem | undefined => {
    if (!dragState.value.draggedItemId) return undefined
    return options.items.find(item => item.id === dragState.value.draggedItemId)
  }

  /**
   * 检查元素是否可拖拽
   */
  const isDraggable = (itemId: string): boolean => {
    const item = options.items.find(item => item.id === itemId)
    return !!(
      item &&
      options.config.enableDrag &&
      (item.isDraggable !== false) &&
      !item.static
    )
  }

  /**
   * 创建拖拽手柄
   */
  const createDragHandle = (element: HTMLElement, itemId: string) => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!isDraggable(itemId)) return
      
      event.preventDefault()
      event.stopPropagation()
      
      startDrag(itemId, event, element)
    }

    element.addEventListener('pointerdown', handlePointerDown, { passive: false })

    return {
      destroy: () => {
        element.removeEventListener('pointerdown', handlePointerDown)
      }
    }
  }

  // 计算属性
  const isDragging = computed(() => dragState.value.isDragging)
  const draggedItemId = computed(() => dragState.value.draggedItemId)
  const dragOffset = computed(() => dragState.value.offset)

  return {
    // 状态
    dragState: readonly(dragState),
    dragPreviewRef,
    dragPreviewStyle: readonly(dragPreviewStyle),
    snapLines: readonly(snapLines),
    
    // 计算属性
    isDragging,
    draggedItemId,
    dragOffset,
    
    // 方法
    initializeDrag,
    destroyDrag,
    startDrag,
    endDrag,
    cancelDrag,
    isDraggable,
    createDragHandle,
    getCurrentDraggedItem
  }
}