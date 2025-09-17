/**
 * Canvas交互控制器
 *
 * 功能概述：
 * 1. 管理Canvas的缩放、平移、选择等交互功能
 * 2. 提供键盘快捷键和鼠标手势支持
 * 3. 实现多选、框选、拖拽等高级交互
 * 4. 集成网格吸附、对齐辅助线等编辑辅助功能
 * 5. 支持触摸设备的手势操作
 *
 * 设计原则：
 * - 流畅的用户交互体验
 * - 完整的键盘快捷键支持
 * - 智能的操作反馈和辅助
 * - 可配置的交互行为
 * - 高性能的事件处理
 *
 * @author Claude
 * @version 1.0.0
 * @date 2024-12-17
 */

import { fabric } from 'fabric'
import { EventEmitter } from 'events'
import type { FabricCanvasEngine, CanvasNode } from './fabric-canvas-engine'

/**
 * 交互模式枚举
 */
export enum InteractionMode {
  SELECT = 'select',           // 选择模式
  PAN = 'pan',                // 平移模式
  ZOOM = 'zoom',              // 缩放模式
  DRAW = 'draw'               // 绘制模式
}

/**
 * 手势类型枚举
 */
export enum GestureType {
  SINGLE_TAP = 'singleTap',
  DOUBLE_TAP = 'doubleTap',
  LONG_PRESS = 'longPress',
  PINCH = 'pinch',
  PAN = 'pan',
  SWIPE = 'swipe'
}

/**
 * 对齐类型枚举
 */
export enum AlignmentType {
  LEFT = 'left',
  CENTER_HORIZONTAL = 'centerHorizontal',
  RIGHT = 'right',
  TOP = 'top',
  CENTER_VERTICAL = 'centerVertical',
  BOTTOM = 'bottom'
}

/**
 * 交互配置接口
 */
export interface InteractionConfig {
  // 缩放配置
  zoom: {
    enabled: boolean
    wheelSensitivity: number
    minZoom: number
    maxZoom: number
    smoothAnimation: boolean
  }

  // 平移配置
  pan: {
    enabled: boolean
    button: number                // 鼠标按钮 (0=左键, 1=中键, 2=右键)
    modifierKey?: 'ctrl' | 'alt' | 'shift'
    smoothAnimation: boolean
  }

  // 选择配置
  selection: {
    enabled: boolean
    multiSelect: boolean
    boxSelect: boolean
    selectOnDrag: boolean
  }

  // 网格配置
  grid: {
    enabled: boolean
    size: number
    snap: boolean
    snapThreshold: number
  }

  // 对齐配置
  alignment: {
    enabled: boolean
    showGuides: boolean
    snapToObjects: boolean
    snapThreshold: number
  }

  // 键盘快捷键
  shortcuts: {
    enabled: boolean
    customShortcuts?: Record<string, () => void>
  }

  // 触摸支持
  touch: {
    enabled: boolean
    multiTouch: boolean
    gestureRecognition: boolean
  }
}

/**
 * 对齐辅助线接口
 */
export interface AlignmentGuide {
  type: 'horizontal' | 'vertical'
  position: number
  objects: CanvasNode[]
}

/**
 * Canvas交互控制器
 */
export class CanvasInteractionController extends EventEmitter {
  private engine: FabricCanvasEngine
  private canvas: fabric.Canvas
  private config: InteractionConfig

  // 交互状态
  private currentMode: InteractionMode = InteractionMode.SELECT
  private isInteracting: boolean = false
  private lastPointerPosition: fabric.Point | null = null

  // 选择相关
  private selectionBox: fabric.Rect | null = null
  private isBoxSelecting: boolean = false
  private boxSelectStart: fabric.Point | null = null

  // 缩放和平移
  private zoomLevel: number = 1
  private panOffset: fabric.Point = new fabric.Point(0, 0)
  private isSpacePressed: boolean = false

  // 对齐辅助线
  private alignmentGuides: fabric.Line[] = []
  private isShowingGuides: boolean = false

  // 键盘状态
  private pressedKeys: Set<string> = new Set()

  // 触摸手势
  private touchStartTime: number = 0
  private touchStartPosition: fabric.Point | null = null
  private touchCount: number = 0

  // 历史记录
  private undoStack: string[] = []
  private redoStack: string[] = []
  private maxHistorySize: number = 50

  constructor(engine: FabricCanvasEngine, config: Partial<InteractionConfig> = {}) {
    super()

    this.engine = engine
    const canvas = engine.getCanvas()
    if (!canvas) {
      throw new Error('Canvas引擎未初始化')
    }
    this.canvas = canvas

    // 合并配置
    this.config = {
      zoom: {
        enabled: true,
        wheelSensitivity: 0.001,
        minZoom: 0.1,
        maxZoom: 5,
        smoothAnimation: true
      },
      pan: {
        enabled: true,
        button: 1, // 中键
        smoothAnimation: true
      },
      selection: {
        enabled: true,
        multiSelect: true,
        boxSelect: true,
        selectOnDrag: false
      },
      grid: {
        enabled: true,
        size: 20,
        snap: true,
        snapThreshold: 5
      },
      alignment: {
        enabled: true,
        showGuides: true,
        snapToObjects: true,
        snapThreshold: 5
      },
      shortcuts: {
        enabled: true
      },
      touch: {
        enabled: true,
        multiTouch: true,
        gestureRecognition: true
      },
      ...config
    }

    this.setupEventListeners()
    this.saveState() // 保存初始状态
  }

  /**
   * 设置事件监听器
   */
  private setupEventListeners(): void {
    // 鼠标事件
    this.canvas.on('mouse:wheel', this.handleMouseWheel.bind(this))
    this.canvas.on('mouse:down', this.handleMouseDown.bind(this))
    this.canvas.on('mouse:move', this.handleMouseMove.bind(this))
    this.canvas.on('mouse:up', this.handleMouseUp.bind(this))
    this.canvas.on('mouse:dblclick', this.handleDoubleClick.bind(this))

    // 选择事件
    this.canvas.on('selection:created', this.handleSelectionCreated.bind(this))
    this.canvas.on('selection:updated', this.handleSelectionUpdated.bind(this))
    this.canvas.on('selection:cleared', this.handleSelectionCleared.bind(this))

    // 对象事件
    this.canvas.on('object:moving', this.handleObjectMoving.bind(this))
    this.canvas.on('object:moved', this.handleObjectMoved.bind(this))
    this.canvas.on('object:scaling', this.handleObjectScaling.bind(this))
    this.canvas.on('object:scaled', this.handleObjectScaled.bind(this))
    this.canvas.on('object:rotating', this.handleObjectRotating.bind(this))
    this.canvas.on('object:rotated', this.handleObjectRotated.bind(this))

    // 键盘事件
    document.addEventListener('keydown', this.handleKeyDown.bind(this))
    document.addEventListener('keyup', this.handleKeyUp.bind(this))

    // 触摸事件
    if (this.config.touch.enabled) {
      this.canvas.on('touch:start', this.handleTouchStart.bind(this))
      this.canvas.on('touch:move', this.handleTouchMove.bind(this))
      this.canvas.on('touch:end', this.handleTouchEnd.bind(this))
    }

    // 阻止浏览器默认行为
    this.canvas.wrapperEl.addEventListener('contextmenu', (e) => e.preventDefault())
  }

  /**
   * 鼠标滚轮事件处理
   */
  private handleMouseWheel(opt: fabric.IEvent<WheelEvent>): void {
    if (!this.config.zoom.enabled) return

    const e = opt.e
    const delta = e.deltaY
    let zoom = this.canvas.getZoom()

    // 计算新的缩放级别
    zoom *= 0.999 ** delta
    zoom = Math.max(this.config.zoom.minZoom, Math.min(this.config.zoom.maxZoom, zoom))

    // 以鼠标位置为中心缩放
    const point = new fabric.Point(e.offsetX, e.offsetY)

    if (this.config.zoom.smoothAnimation) {
      this.animateZoom(zoom, point)
    } else {
      this.canvas.zoomToPoint(point, zoom)
    }

    this.zoomLevel = zoom
    this.emit('zoom:changed', { zoom, point })

    e.preventDefault()
    e.stopPropagation()
  }

  /**
   * 鼠标按下事件处理
   */
  private handleMouseDown(opt: fabric.IEvent<MouseEvent>): void {
    const e = opt.e
    this.isInteracting = true
    this.lastPointerPosition = new fabric.Point(e.clientX, e.clientY)

    // 空格键 + 左键 = 平移模式
    if (this.isSpacePressed && e.button === 0) {
      this.startPan(opt)
      return
    }

    // 中键平移
    if (this.config.pan.enabled && e.button === this.config.pan.button) {
      this.startPan(opt)
      return
    }

    // 右键框选
    if (this.config.selection.boxSelect && e.button === 2) {
      this.startBoxSelection(opt)
      return
    }

    // 修饰键检查
    if (this.config.pan.modifierKey) {
      const modifierPressed = this.checkModifierKey(this.config.pan.modifierKey, e)
      if (modifierPressed && e.button === 0) {
        this.startPan(opt)
        return
      }
    }
  }

  /**
   * 鼠标移动事件处理
   */
  private handleMouseMove(opt: fabric.IEvent<MouseEvent>): void {
    if (!this.isInteracting || !this.lastPointerPosition) return

    const e = opt.e
    const currentPosition = new fabric.Point(e.clientX, e.clientY)
    const delta = currentPosition.subtract(this.lastPointerPosition)

    if (this.currentMode === InteractionMode.PAN) {
      this.updatePan(delta)
    } else if (this.isBoxSelecting) {
      this.updateBoxSelection(opt)
    }

    this.lastPointerPosition = currentPosition
  }

  /**
   * 鼠标抬起事件处理
   */
  private handleMouseUp(opt: fabric.IEvent<MouseEvent>): void {
    this.isInteracting = false
    this.lastPointerPosition = null

    if (this.currentMode === InteractionMode.PAN) {
      this.endPan()
    } else if (this.isBoxSelecting) {
      this.endBoxSelection()
    }

    this.currentMode = InteractionMode.SELECT
  }

  /**
   * 双击事件处理
   */
  private handleDoubleClick(opt: fabric.IEvent<MouseEvent>): void {
    if (opt.target && this.isCanvasNode(opt.target)) {
      // 双击节点进入编辑模式
      this.emit('node:edit', { node: opt.target })
    } else {
      // 双击空白区域适应画布
      this.fitToCanvas()
    }
  }

  /**
   * 开始平移
   */
  private startPan(opt: fabric.IEvent<MouseEvent>): void {
    this.currentMode = InteractionMode.PAN
    this.canvas.selection = false
    this.canvas.hoverCursor = 'grab'
    this.canvas.moveCursor = 'grabbing'

    opt.e.preventDefault()
    opt.e.stopPropagation()
  }

  /**
   * 更新平移
   */
  private updatePan(delta: fabric.Point): void {
    const vpt = this.canvas.viewportTransform
    if (vpt) {
      vpt[4] += delta.x
      vpt[5] += delta.y
      this.canvas.requestRenderAll()

      this.panOffset = new fabric.Point(vpt[4], vpt[5])
      this.emit('pan:changed', this.panOffset)
    }
  }

  /**
   * 结束平移
   */
  private endPan(): void {
    this.canvas.selection = this.config.selection.enabled
    this.canvas.hoverCursor = 'move'
    this.canvas.moveCursor = 'move'
  }

  /**
   * 开始框选
   */
  private startBoxSelection(opt: fabric.IEvent<MouseEvent>): void {
    if (!this.config.selection.boxSelect) return

    this.isBoxSelecting = true
    this.boxSelectStart = this.canvas.getPointer(opt.e)

    this.selectionBox = new fabric.Rect({
      left: this.boxSelectStart.x,
      top: this.boxSelectStart.y,
      width: 0,
      height: 0,
      fill: 'rgba(24, 144, 255, 0.1)',
      stroke: '#1890ff',
      strokeWidth: 1,
      strokeDashArray: [5, 5],
      selectable: false,
      evented: false
    })

    this.canvas.add(this.selectionBox)
    opt.e.preventDefault()
  }

  /**
   * 更新框选
   */
  private updateBoxSelection(opt: fabric.IEvent<MouseEvent>): void {
    if (!this.isBoxSelecting || !this.boxSelectStart || !this.selectionBox) return

    const pointer = this.canvas.getPointer(opt.e)
    const width = Math.abs(pointer.x - this.boxSelectStart.x)
    const height = Math.abs(pointer.y - this.boxSelectStart.y)

    this.selectionBox.set({
      left: Math.min(this.boxSelectStart.x, pointer.x),
      top: Math.min(this.boxSelectStart.y, pointer.y),
      width,
      height
    })

    this.canvas.requestRenderAll()
  }

  /**
   * 结束框选
   */
  private endBoxSelection(): void {
    if (!this.isBoxSelecting || !this.selectionBox || !this.boxSelectStart) return

    const selectionBounds = this.selectionBox.getBoundingRect()
    const selectedObjects: CanvasNode[] = []

    // 查找被框选的对象
    this.canvas.getObjects().forEach(obj => {
      if (this.isCanvasNode(obj)) {
        const objBounds = obj.getBoundingRect()
        if (this.isRectIntersecting(selectionBounds, objBounds)) {
          selectedObjects.push(obj)
        }
      }
    })

    // 选择对象
    if (selectedObjects.length > 0) {
      if (selectedObjects.length === 1) {
        this.canvas.setActiveObject(selectedObjects[0])
      } else {
        const selection = new fabric.ActiveSelection(selectedObjects, {
          canvas: this.canvas
        })
        this.canvas.setActiveObject(selection)
      }
    } else {
      this.canvas.discardActiveObject()
    }

    // 清理框选框
    this.canvas.remove(this.selectionBox)
    this.selectionBox = null
    this.isBoxSelecting = false
    this.boxSelectStart = null

    this.canvas.requestRenderAll()
  }

  /**
   * 选择创建事件处理
   */
  private handleSelectionCreated(e: fabric.IEvent): void {
    this.emit('selection:created', e.selected)
    this.saveState()
  }

  /**
   * 选择更新事件处理
   */
  private handleSelectionUpdated(e: fabric.IEvent): void {
    this.emit('selection:updated', { selected: e.selected, deselected: e.deselected })
  }

  /**
   * 选择清除事件处理
   */
  private handleSelectionCleared(e: fabric.IEvent): void {
    this.emit('selection:cleared', e.deselected)
    this.hideAlignmentGuides()
  }

  /**
   * 对象移动中事件处理
   */
  private handleObjectMoving(e: fabric.IEvent): void {
    const obj = e.target
    if (!this.isCanvasNode(obj)) return

    // 网格吸附
    if (this.config.grid.snap) {
      this.snapToGrid(obj)
    }

    // 对象对齐
    if (this.config.alignment.enabled && this.config.alignment.snapToObjects) {
      this.snapToObjects(obj)
    }

    // 显示对齐辅助线
    if (this.config.alignment.showGuides) {
      this.showAlignmentGuides(obj)
    }
  }

  /**
   * 对象移动完成事件处理
   */
  private handleObjectMoved(e: fabric.IEvent): void {
    this.hideAlignmentGuides()
    this.saveState()
    this.emit('object:moved', e.target)
  }

  /**
   * 对象缩放中事件处理
   */
  private handleObjectScaling(e: fabric.IEvent): void {
    // 可以在这里添加缩放约束逻辑
  }

  /**
   * 对象缩放完成事件处理
   */
  private handleObjectScaled(e: fabric.IEvent): void {
    this.saveState()
    this.emit('object:scaled', e.target)
  }

  /**
   * 对象旋转中事件处理
   */
  private handleObjectRotating(e: fabric.IEvent): void {
    // 可以在这里添加旋转约束逻辑
  }

  /**
   * 对象旋转完成事件处理
   */
  private handleObjectRotated(e: fabric.IEvent): void {
    this.saveState()
    this.emit('object:rotated', e.target)
  }

  /**
   * 键盘按下事件处理
   */
  private handleKeyDown(e: KeyboardEvent): void {
    if (!this.config.shortcuts.enabled) return

    this.pressedKeys.add(e.key.toLowerCase())

    // 空格键处理
    if (e.key === ' ') {
      this.isSpacePressed = true
      this.canvas.hoverCursor = 'grab'
      e.preventDefault()
    }

    // 快捷键处理
    this.handleShortcuts(e)
  }

  /**
   * 键盘抬起事件处理
   */
  private handleKeyUp(e: KeyboardEvent): void {
    this.pressedKeys.delete(e.key.toLowerCase())

    if (e.key === ' ') {
      this.isSpacePressed = false
      this.canvas.hoverCursor = 'move'
    }
  }

  /**
   * 快捷键处理
   */
  private handleShortcuts(e: KeyboardEvent): void {
    const ctrl = e.ctrlKey || e.metaKey
    const shift = e.shiftKey
    const alt = e.altKey

    // Ctrl/Cmd + Z: 撤销
    if (ctrl && e.key === 'z' && !shift) {
      e.preventDefault()
      this.undo()
      return
    }

    // Ctrl/Cmd + Shift + Z: 重做
    if (ctrl && e.key === 'z' && shift) {
      e.preventDefault()
      this.redo()
      return
    }

    // Ctrl/Cmd + A: 全选
    if (ctrl && e.key === 'a') {
      e.preventDefault()
      this.selectAll()
      return
    }

    // Delete: 删除选中对象
    if (e.key === 'Delete') {
      e.preventDefault()
      this.deleteSelected()
      return
    }

    // Ctrl/Cmd + C: 复制
    if (ctrl && e.key === 'c') {
      e.preventDefault()
      this.copy()
      return
    }

    // Ctrl/Cmd + V: 粘贴
    if (ctrl && e.key === 'v') {
      e.preventDefault()
      this.paste()
      return
    }

    // Escape: 取消选择
    if (e.key === 'Escape') {
      this.canvas.discardActiveObject()
      this.canvas.requestRenderAll()
      return
    }

    // F: 适应画布
    if (e.key === 'f') {
      this.fitToCanvas()
      return
    }

    // 1: 重置缩放
    if (e.key === '1') {
      this.resetZoom()
      return
    }

    // 对齐快捷键
    if (ctrl) {
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault()
          this.alignObjects(AlignmentType.LEFT)
          break
        case 'ArrowRight':
          e.preventDefault()
          this.alignObjects(AlignmentType.RIGHT)
          break
        case 'ArrowUp':
          e.preventDefault()
          this.alignObjects(AlignmentType.TOP)
          break
        case 'ArrowDown':
          e.preventDefault()
          this.alignObjects(AlignmentType.BOTTOM)
          break
      }
    }

    // 自定义快捷键
    if (this.config.shortcuts.customShortcuts) {
      const shortcutKey = this.getShortcutKey(e)
      const customHandler = this.config.shortcuts.customShortcuts[shortcutKey]
      if (customHandler) {
        e.preventDefault()
        customHandler()
      }
    }
  }

  /**
   * 触摸开始事件处理
   */
  private handleTouchStart(e: fabric.IEvent): void {
    this.touchStartTime = Date.now()
    this.touchCount = (e as any).touches?.length || 1

    if (this.touchCount === 1) {
      this.touchStartPosition = this.canvas.getPointer(e.e)
    }
  }

  /**
   * 触摸移动事件处理
   */
  private handleTouchMove(e: fabric.IEvent): void {
    // 双指缩放
    if (this.touchCount === 2 && this.config.touch.multiTouch) {
      // 这里可以实现双指缩放逻辑
      this.handlePinchGesture(e)
    }
  }

  /**
   * 触摸结束事件处理
   */
  private handleTouchEnd(e: fabric.IEvent): void {
    const touchDuration = Date.now() - this.touchStartTime

    // 长按检测
    if (touchDuration > 500 && this.touchStartPosition) {
      this.emit('gesture:longPress', { position: this.touchStartPosition })
    }

    this.touchCount = 0
    this.touchStartPosition = null
  }

  /**
   * 捏合手势处理
   */
  private handlePinchGesture(e: fabric.IEvent): void {
    // 实现双指缩放逻辑
    // 这里需要根据触摸点计算缩放比例和中心点
  }

  /**
   * 网格吸附
   */
  private snapToGrid(obj: fabric.Object): void {
    if (!this.config.grid.snap) return

    const gridSize = this.config.grid.size
    const threshold = this.config.grid.snapThreshold

    const snapX = Math.round((obj.left! + threshold) / gridSize) * gridSize
    const snapY = Math.round((obj.top! + threshold) / gridSize) * gridSize

    if (Math.abs(obj.left! - snapX) < threshold) {
      obj.set('left', snapX)
    }
    if (Math.abs(obj.top! - snapY) < threshold) {
      obj.set('top', snapY)
    }
  }

  /**
   * 对象吸附
   */
  private snapToObjects(targetObj: fabric.Object): void {
    const threshold = this.config.alignment.snapThreshold
    const targetBounds = targetObj.getBoundingRect()

    this.canvas.getObjects().forEach(obj => {
      if (obj === targetObj || !this.isCanvasNode(obj)) return

      const objBounds = obj.getBoundingRect()

      // 水平对齐
      const leftAlign = Math.abs(targetBounds.left - objBounds.left)
      const centerAlign = Math.abs(
        (targetBounds.left + targetBounds.width / 2) -
        (objBounds.left + objBounds.width / 2)
      )
      const rightAlign = Math.abs(
        (targetBounds.left + targetBounds.width) -
        (objBounds.left + objBounds.width)
      )

      if (leftAlign < threshold) {
        targetObj.set('left', objBounds.left)
      } else if (centerAlign < threshold) {
        const centerX = objBounds.left + objBounds.width / 2 - targetBounds.width / 2
        targetObj.set('left', centerX)
      } else if (rightAlign < threshold) {
        targetObj.set('left', objBounds.left + objBounds.width - targetBounds.width)
      }

      // 垂直对齐
      const topAlign = Math.abs(targetBounds.top - objBounds.top)
      const middleAlign = Math.abs(
        (targetBounds.top + targetBounds.height / 2) -
        (objBounds.top + objBounds.height / 2)
      )
      const bottomAlign = Math.abs(
        (targetBounds.top + targetBounds.height) -
        (objBounds.top + objBounds.height)
      )

      if (topAlign < threshold) {
        targetObj.set('top', objBounds.top)
      } else if (middleAlign < threshold) {
        const centerY = objBounds.top + objBounds.height / 2 - targetBounds.height / 2
        targetObj.set('top', centerY)
      } else if (bottomAlign < threshold) {
        targetObj.set('top', objBounds.top + objBounds.height - targetBounds.height)
      }
    })
  }

  /**
   * 显示对齐辅助线
   */
  private showAlignmentGuides(targetObj: fabric.Object): void {
    this.hideAlignmentGuides()

    const guides: AlignmentGuide[] = []
    const targetBounds = targetObj.getBoundingRect()

    this.canvas.getObjects().forEach(obj => {
      if (obj === targetObj || !this.isCanvasNode(obj)) return

      const objBounds = obj.getBoundingRect()

      // 检查水平对齐
      if (Math.abs(targetBounds.left - objBounds.left) < this.config.alignment.snapThreshold) {
        guides.push({
          type: 'vertical',
          position: objBounds.left,
          objects: [obj as CanvasNode]
        })
      }

      // 检查垂直对齐
      if (Math.abs(targetBounds.top - objBounds.top) < this.config.alignment.snapThreshold) {
        guides.push({
          type: 'horizontal',
          position: objBounds.top,
          objects: [obj as CanvasNode]
        })
      }
    })

    // 创建辅助线
    guides.forEach(guide => {
      const line = this.createGuideLine(guide)
      this.alignmentGuides.push(line)
      this.canvas.add(line)
    })

    this.isShowingGuides = true
    this.canvas.requestRenderAll()
  }

  /**
   * 隐藏对齐辅助线
   */
  private hideAlignmentGuides(): void {
    if (!this.isShowingGuides) return

    this.alignmentGuides.forEach(line => {
      this.canvas.remove(line)
    })
    this.alignmentGuides = []
    this.isShowingGuides = false
  }

  /**
   * 创建辅助线
   */
  private createGuideLine(guide: AlignmentGuide): fabric.Line {
    const canvasWidth = this.canvas.getWidth()
    const canvasHeight = this.canvas.getHeight()

    let coords: number[]
    if (guide.type === 'vertical') {
      coords = [guide.position, 0, guide.position, canvasHeight]
    } else {
      coords = [0, guide.position, canvasWidth, guide.position]
    }

    return new fabric.Line(coords, {
      stroke: '#ff4d4f',
      strokeWidth: 1,
      strokeDashArray: [5, 5],
      selectable: false,
      evented: false,
      excludeFromExport: true
    })
  }

  /**
   * 对齐对象
   */
  public alignObjects(type: AlignmentType): void {
    const activeObjects = this.getSelectedNodes()
    if (activeObjects.length < 2) return

    const bounds = activeObjects.map(obj => obj.getBoundingRect())

    switch (type) {
      case AlignmentType.LEFT: {
        const minLeft = Math.min(...bounds.map(b => b.left))
        activeObjects.forEach(obj => obj.set('left', minLeft))
        break
      }
      case AlignmentType.RIGHT: {
        const maxRight = Math.max(...bounds.map(b => b.left + b.width))
        activeObjects.forEach((obj, i) => {
          obj.set('left', maxRight - bounds[i].width)
        })
        break
      }
      case AlignmentType.TOP: {
        const minTop = Math.min(...bounds.map(b => b.top))
        activeObjects.forEach(obj => obj.set('top', minTop))
        break
      }
      case AlignmentType.BOTTOM: {
        const maxBottom = Math.max(...bounds.map(b => b.top + b.height))
        activeObjects.forEach((obj, i) => {
          obj.set('top', maxBottom - bounds[i].height)
        })
        break
      }
      case AlignmentType.CENTER_HORIZONTAL: {
        const avgCenterX = bounds.reduce((sum, b) => sum + b.left + b.width / 2, 0) / bounds.length
        activeObjects.forEach((obj, i) => {
          obj.set('left', avgCenterX - bounds[i].width / 2)
        })
        break
      }
      case AlignmentType.CENTER_VERTICAL: {
        const avgCenterY = bounds.reduce((sum, b) => sum + b.top + b.height / 2, 0) / bounds.length
        activeObjects.forEach((obj, i) => {
          obj.set('top', avgCenterY - bounds[i].height / 2)
        })
        break
      }
    }

    this.canvas.requestRenderAll()
    this.saveState()
  }

  /**
   * 动画缩放
   */
  private animateZoom(targetZoom: number, point: fabric.Point): void {
    const currentZoom = this.canvas.getZoom()
    const duration = 200

    fabric.util.animate({
      startValue: currentZoom,
      endValue: targetZoom,
      duration,
      onChange: (value) => {
        this.canvas.zoomToPoint(point, value)
      }
    })
  }

  /**
   * 适应画布
   */
  public fitToCanvas(): void {
    const objects = this.canvas.getObjects().filter(obj => this.isCanvasNode(obj))
    if (objects.length === 0) return

    const group = new fabric.Group(objects)
    const groupBounds = group.getBoundingRect()

    const canvasWidth = this.canvas.getWidth()
    const canvasHeight = this.canvas.getHeight()

    const scaleX = (canvasWidth - 100) / groupBounds.width
    const scaleY = (canvasHeight - 100) / groupBounds.height
    const scale = Math.min(scaleX, scaleY, this.config.zoom.maxZoom)

    const center = new fabric.Point(canvasWidth / 2, canvasHeight / 2)
    this.canvas.zoomToPoint(center, scale)

    // 居中显示
    const vpt = this.canvas.viewportTransform!
    vpt[4] = (canvasWidth - groupBounds.width * scale) / 2 - groupBounds.left * scale
    vpt[5] = (canvasHeight - groupBounds.height * scale) / 2 - groupBounds.top * scale

    this.canvas.requestRenderAll()
  }

  /**
   * 重置缩放
   */
  public resetZoom(): void {
    const center = new fabric.Point(this.canvas.getWidth() / 2, this.canvas.getHeight() / 2)
    this.canvas.zoomToPoint(center, 1)
    this.canvas.viewportTransform = [1, 0, 0, 1, 0, 0]
    this.canvas.requestRenderAll()
  }

  /**
   * 全选
   */
  public selectAll(): void {
    const objects = this.canvas.getObjects().filter(obj => this.isCanvasNode(obj))
    if (objects.length === 0) return

    if (objects.length === 1) {
      this.canvas.setActiveObject(objects[0])
    } else {
      const selection = new fabric.ActiveSelection(objects, {
        canvas: this.canvas
      })
      this.canvas.setActiveObject(selection)
    }

    this.canvas.requestRenderAll()
  }

  /**
   * 删除选中对象
   */
  public deleteSelected(): void {
    const activeObjects = this.getSelectedNodes()
    activeObjects.forEach(obj => {
      this.canvas.remove(obj)
    })

    this.canvas.discardActiveObject()
    this.canvas.requestRenderAll()
    this.saveState()
  }

  /**
   * 复制选中对象
   */
  public copy(): void {
    // 实现复制逻辑
    const activeObject = this.canvas.getActiveObject()
    if (activeObject) {
      activeObject.clone((cloned: fabric.Object) => {
        this.clipboard = cloned
      })
    }
  }

  private clipboard: fabric.Object | null = null

  /**
   * 粘贴对象
   */
  public paste(): void {
    if (!this.clipboard) return

    this.clipboard.clone((clonedObj: fabric.Object) => {
      this.canvas.discardActiveObject()

      clonedObj.set({
        left: clonedObj.left! + 10,
        top: clonedObj.top! + 10,
        evented: true
      })

      if (clonedObj.type === 'activeSelection') {
        const activeSelection = clonedObj as fabric.ActiveSelection
        activeSelection.canvas = this.canvas
        activeSelection.forEachObject((obj: fabric.Object) => {
          this.canvas.add(obj)
        })
        activeSelection.setCoords()
      } else {
        this.canvas.add(clonedObj)
      }

      this.canvas.setActiveObject(clonedObj)
      this.canvas.requestRenderAll()
      this.saveState()
    })
  }

  /**
   * 撤销
   */
  public undo(): void {
    if (this.undoStack.length === 0) return

    const currentState = this.canvas.toJSON(['nodeId', 'nodeType', 'nodeConfig', 'isCanvasNode'])
    this.redoStack.push(JSON.stringify(currentState))

    if (this.redoStack.length > this.maxHistorySize) {
      this.redoStack.shift()
    }

    const previousState = this.undoStack.pop()!
    this.loadState(previousState)

    this.emit('history:changed', {
      canUndo: this.canUndo(),
      canRedo: this.canRedo()
    })
  }

  /**
   * 重做
   */
  public redo(): void {
    if (this.redoStack.length === 0) return

    const currentState = this.canvas.toJSON(['nodeId', 'nodeType', 'nodeConfig', 'isCanvasNode'])
    this.undoStack.push(JSON.stringify(currentState))

    if (this.undoStack.length > this.maxHistorySize) {
      this.undoStack.shift()
    }

    const nextState = this.redoStack.pop()!
    this.loadState(nextState)

    this.emit('history:changed', {
      canUndo: this.canUndo(),
      canRedo: this.canRedo()
    })
  }

  /**
   * 保存状态
   */
  private saveState(): void {
    const state = this.canvas.toJSON(['nodeId', 'nodeType', 'nodeConfig', 'isCanvasNode'])
    this.undoStack.push(JSON.stringify(state))

    if (this.undoStack.length > this.maxHistorySize) {
      this.undoStack.shift()
    }

    this.redoStack = [] // 清空重做栈

    this.emit('history:changed', {
      canUndo: this.canUndo(),
      canRedo: this.canRedo()
    })
  }

  /**
   * 加载状态
   */
  private loadState(state: string): void {
    this.canvas.loadFromJSON(state, () => {
      this.canvas.requestRenderAll()
    })
  }

  /**
   * 是否可以撤销
   */
  public canUndo(): boolean {
    return this.undoStack.length > 0
  }

  /**
   * 是否可以重做
   */
  public canRedo(): boolean {
    return this.redoStack.length > 0
  }

  /**
   * 获取选中的Canvas节点
   */
  private getSelectedNodes(): CanvasNode[] {
    const activeObject = this.canvas.getActiveObject()
    if (!activeObject) return []

    if (this.isCanvasNode(activeObject)) {
      return [activeObject]
    }

    if (activeObject.type === 'activeSelection') {
      const selection = activeObject as fabric.ActiveSelection
      return selection.getObjects().filter(this.isCanvasNode) as CanvasNode[]
    }

    return []
  }

  /**
   * 检查对象是否为Canvas节点
   */
  private isCanvasNode(obj: any): obj is CanvasNode {
    return obj && obj.isCanvasNode === true && obj.nodeId
  }

  /**
   * 检查修饰键
   */
  private checkModifierKey(key: 'ctrl' | 'alt' | 'shift', e: MouseEvent): boolean {
    switch (key) {
      case 'ctrl':
        return e.ctrlKey || e.metaKey
      case 'alt':
        return e.altKey
      case 'shift':
        return e.shiftKey
      default:
        return false
    }
  }

  /**
   * 获取快捷键字符串
   */
  private getShortcutKey(e: KeyboardEvent): string {
    const parts: string[] = []
    if (e.ctrlKey || e.metaKey) parts.push('Ctrl')
    if (e.altKey) parts.push('Alt')
    if (e.shiftKey) parts.push('Shift')
    parts.push(e.key.toUpperCase())
    return parts.join('+')
  }

  /**
   * 检查矩形相交
   */
  private isRectIntersecting(rect1: fabric.Rect, rect2: fabric.Rect): boolean {
    return !(
      rect1.left! + rect1.width! < rect2.left! ||
      rect2.left! + rect2.width! < rect1.left! ||
      rect1.top! + rect1.height! < rect2.top! ||
      rect2.top! + rect2.height! < rect1.top!
    )
  }

  /**
   * 销毁控制器
   */
  public destroy(): void {
    document.removeEventListener('keydown', this.handleKeyDown.bind(this))
    document.removeEventListener('keyup', this.handleKeyUp.bind(this))
    this.hideAlignmentGuides()
    this.removeAllListeners()
  }

  /**
   * 获取配置
   */
  public getConfig(): InteractionConfig {
    return { ...this.config }
  }

  /**
   * 更新配置
   */
  public updateConfig(newConfig: Partial<InteractionConfig>): void {
    this.config = { ...this.config, ...newConfig }
  }
}

export default CanvasInteractionController