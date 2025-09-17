/**
 * Fabric.js Canvas编辑器引擎
 *
 * 功能概述：
 * 1. 基于Fabric.js实现高性能Canvas编辑器
 * 2. 支持节点的创建、选择、移动、缩放、旋转
 * 3. 提供网格、对齐、吸附等编辑辅助功能
 * 4. 集成撤销/重做、复制/粘贴等编辑操作
 * 5. 与Config Engine深度集成，实现配置驱动
 *
 * 设计原则：
 * - 高性能Canvas渲染，支持大量节点
 * - 完整的编辑器交互体验
 * - 与Vue 3响应式系统无缝集成
 * - 可扩展的节点类型系统
 * - 企业级的稳定性和容错性
 *
 * @author Claude
 * @version 1.0.0
 * @date 2024-12-17
 */

import { fabric } from 'fabric'
import { EventEmitter } from 'events'
import type {
  EditorNodeConfiguration,
  EditorCanvasConfiguration
} from '../config-engine/visual-editor-integration-bridge'
import type { WidgetConfiguration } from '../config-engine/types'

/**
 * Canvas节点类型定义
 */
export interface CanvasNode extends fabric.Group {
  nodeId: string                          // 节点唯一ID
  nodeType: string                        // 节点类型
  nodeConfig: EditorNodeConfiguration     // 节点配置
  isCanvasNode: boolean                   // 标识为Canvas节点
}

/**
 * Canvas引擎配置接口
 */
export interface FabricCanvasConfig {
  width: number                           // 画布宽度
  height: number                          // 画布高度
  backgroundColor: string                 // 背景色

  // 网格设置
  grid: {
    enabled: boolean                      // 是否显示网格
    size: number                          // 网格大小
    color: string                         // 网格颜色
    snap: boolean                         // 是否吸附网格
  }

  // 缩放设置
  zoom: {
    enabled: boolean                      // 是否允许缩放
    min: number                           // 最小缩放
    max: number                           // 最大缩放
    step: number                          // 缩放步长
  }

  // 选择设置
  selection: {
    enabled: boolean                      // 是否允许选择
    multiSelect: boolean                  // 是否允许多选
    borderColor: string                   // 选择边框颜色
    cornerColor: string                   // 控制点颜色
    cornerSize: number                    // 控制点大小
  }

  // 性能设置
  performance: {
    renderOnAddRemove: boolean            // 添加/删除时是否渲染
    imageSmoothingEnabled: boolean        // 图像平滑
    enableRetinaScaling: boolean          // 支持高分辨率
  }
}

/**
 * Canvas事件类型定义
 */
export interface CanvasEvents {
  'node:created': { nodeId: string; node: CanvasNode }
  'node:selected': { nodeId: string; node: CanvasNode }
  'node:deselected': { nodeId: string; node: CanvasNode }
  'node:modified': { nodeId: string; node: CanvasNode; changes: any }
  'node:deleted': { nodeId: string }
  'canvas:cleared': void
  'canvas:zoom': { zoom: number; point: fabric.Point }
  'canvas:pan': { x: number; y: number }
  'history:changed': { canUndo: boolean; canRedo: boolean }
}

/**
 * Fabric.js Canvas编辑器引擎
 *
 * 核心功能：
 * 1. 管理Canvas实例和节点对象
 * 2. 提供高级的编辑器交互功能
 * 3. 集成网格、对齐、历史记录等辅助功能
 * 4. 与Config Engine进行数据同步
 */
export class FabricCanvasEngine extends EventEmitter {
  private canvas: fabric.Canvas | null = null
  private config: FabricCanvasConfig
  private nodes: Map<string, CanvasNode> = new Map()
  private history: any[] = []
  private historyStep: number = 0
  private maxHistorySteps: number = 50
  private isRecordingHistory: boolean = true

  // 网格相关
  private gridGroup: fabric.Group | null = null
  private snapThreshold: number = 5

  // 缩放和平移
  private lastPanPoint: fabric.Point | null = null
  private isPanning: boolean = false

  constructor(container: HTMLCanvasElement, config: Partial<FabricCanvasConfig> = {}) {
    super()

    // 合并默认配置
    this.config = {
      width: 1920,
      height: 1080,
      backgroundColor: '#f5f5f5',
      grid: {
        enabled: true,
        size: 20,
        color: 'rgba(0, 0, 0, 0.1)',
        snap: true
      },
      zoom: {
        enabled: true,
        min: 0.1,
        max: 5,
        step: 0.1
      },
      selection: {
        enabled: true,
        multiSelect: true,
        borderColor: '#1890ff',
        cornerColor: '#1890ff',
        cornerSize: 8
      },
      performance: {
        renderOnAddRemove: false,
        imageSmoothingEnabled: true,
        enableRetinaScaling: true
      },
      ...config
    }

    this.initializeCanvas(container)
    this.setupEventListeners()
    this.setupGrid()
    this.setupHistory()
  }

  /**
   * 初始化Canvas实例
   */
  private initializeCanvas(container: HTMLCanvasElement): void {
    this.canvas = new fabric.Canvas(container, {
      width: this.config.width,
      height: this.config.height,
      backgroundColor: this.config.backgroundColor,

      // 选择设置
      selection: this.config.selection.enabled,
      selectionBorderColor: this.config.selection.borderColor,
      selectionLineWidth: 2,

      // 性能设置
      renderOnAddRemove: this.config.performance.renderOnAddRemove,
      imageSmoothingEnabled: this.config.performance.imageSmoothingEnabled,
      enableRetinaScaling: this.config.performance.enableRetinaScaling,

      // 交互设置
      preserveObjectStacking: true,
      stopContextMenu: true,
      fireRightClick: true,
      fireMiddleClick: true
    })

    // 设置控制点样式
    fabric.Object.prototype.set({
      cornerColor: this.config.selection.cornerColor,
      cornerSize: this.config.selection.cornerSize,
      transparentCorners: false,
      cornerStyle: 'circle'
    })
  }

  /**
   * 设置事件监听器
   */
  private setupEventListeners(): void {
    if (!this.canvas) return

    // 对象选择事件
    this.canvas.on('selection:created', (e) => {
      const selectedObjects = e.selected || []
      selectedObjects.forEach(obj => {
        if (this.isCanvasNode(obj)) {
          this.emit('node:selected', { nodeId: obj.nodeId, node: obj })
        }
      })
    })

    this.canvas.on('selection:updated', (e) => {
      const selectedObjects = e.selected || []
      const deselectedObjects = e.deselected || []

      deselectedObjects.forEach(obj => {
        if (this.isCanvasNode(obj)) {
          this.emit('node:deselected', { nodeId: obj.nodeId, node: obj })
        }
      })

      selectedObjects.forEach(obj => {
        if (this.isCanvasNode(obj)) {
          this.emit('node:selected', { nodeId: obj.nodeId, node: obj })
        }
      })
    })

    this.canvas.on('selection:cleared', (e) => {
      const deselectedObjects = e.deselected || []
      deselectedObjects.forEach(obj => {
        if (this.isCanvasNode(obj)) {
          this.emit('node:deselected', { nodeId: obj.nodeId, node: obj })
        }
      })
    })

    // 对象修改事件
    this.canvas.on('object:modified', (e) => {
      const obj = e.target
      if (this.isCanvasNode(obj)) {
        this.recordHistory()
        this.emit('node:modified', {
          nodeId: obj.nodeId,
          node: obj,
          changes: this.extractNodeChanges(obj)
        })
      }
    })

    // 对象移动事件（实时网格吸附）
    this.canvas.on('object:moving', (e) => {
      if (this.config.grid.snap) {
        this.snapToGrid(e.target)
      }
    })

    // 鼠标滚轮缩放
    this.canvas.on('mouse:wheel', (opt) => {
      if (!this.config.zoom.enabled) return

      const delta = opt.e.deltaY
      let zoom = this.canvas!.getZoom()
      zoom *= 0.999 ** delta

      zoom = Math.max(this.config.zoom.min, Math.min(this.config.zoom.max, zoom))

      const point = new fabric.Point(opt.e.offsetX, opt.e.offsetY)
      this.canvas!.zoomToPoint(point, zoom)

      this.emit('canvas:zoom', { zoom, point })
      opt.e.preventDefault()
      opt.e.stopPropagation()
    })

    // 中键拖拽平移
    this.canvas.on('mouse:down', (opt) => {
      const evt = opt.e
      if (evt.button === 1) { // 中键
        this.isPanning = true
        this.canvas!.selection = false
        this.lastPanPoint = new fabric.Point(evt.clientX, evt.clientY)
      }
    })

    this.canvas.on('mouse:move', (opt) => {
      if (this.isPanning && this.lastPanPoint) {
        const evt = opt.e
        const vpt = this.canvas!.viewportTransform!
        vpt[4] += evt.clientX - this.lastPanPoint.x
        vpt[5] += evt.clientY - this.lastPanPoint.y

        this.canvas!.requestRenderAll()
        this.lastPanPoint = new fabric.Point(evt.clientX, evt.clientY)

        this.emit('canvas:pan', { x: vpt[4], y: vpt[5] })
      }
    })

    this.canvas.on('mouse:up', () => {
      if (this.isPanning) {
        this.canvas!.selection = this.config.selection.enabled
        this.isPanning = false
        this.lastPanPoint = null
      }
    })

    // 键盘快捷键
    document.addEventListener('keydown', this.handleKeyDown.bind(this))
  }

  /**
   * 设置网格
   */
  private setupGrid(): void {
    if (!this.config.grid.enabled || !this.canvas) return

    const gridSize = this.config.grid.size
    const gridColor = this.config.grid.color
    const canvasWidth = this.config.width
    const canvasHeight = this.config.height

    const gridLines: fabric.Line[] = []

    // 垂直线
    for (let i = 0; i <= canvasWidth; i += gridSize) {
      const line = new fabric.Line([i, 0, i, canvasHeight], {
        stroke: gridColor,
        strokeWidth: 1,
        selectable: false,
        evented: false
      })
      gridLines.push(line)
    }

    // 水平线
    for (let i = 0; i <= canvasHeight; i += gridSize) {
      const line = new fabric.Line([0, i, canvasWidth, i], {
        stroke: gridColor,
        strokeWidth: 1,
        selectable: false,
        evented: false
      })
      gridLines.push(line)
    }

    this.gridGroup = new fabric.Group(gridLines, {
      selectable: false,
      evented: false
    })

    this.canvas.add(this.gridGroup)
    this.canvas.sendToBack(this.gridGroup)
  }

  /**
   * 设置历史记录
   */
  private setupHistory(): void {
    this.recordHistory() // 记录初始状态
  }

  /**
   * 网格吸附
   */
  private snapToGrid(obj: fabric.Object): void {
    if (!this.config.grid.snap) return

    const gridSize = this.config.grid.size
    const threshold = this.snapThreshold

    // 计算吸附位置
    const snapX = Math.round((obj.left! + threshold) / gridSize) * gridSize
    const snapY = Math.round((obj.top! + threshold) / gridSize) * gridSize

    // 检查是否在吸附阈值内
    if (Math.abs(obj.left! - snapX) < threshold) {
      obj.set('left', snapX)
    }
    if (Math.abs(obj.top! - snapY) < threshold) {
      obj.set('top', snapY)
    }
  }

  /**
   * 键盘事件处理
   */
  private handleKeyDown(e: KeyboardEvent): void {
    if (!this.canvas) return

    const activeObject = this.canvas.getActiveObject()

    // Ctrl/Cmd + Z: 撤销
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
      e.preventDefault()
      this.undo()
    }

    // Ctrl/Cmd + Shift + Z: 重做
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) {
      e.preventDefault()
      this.redo()
    }

    // Delete: 删除选中对象
    if (e.key === 'Delete' && activeObject) {
      e.preventDefault()
      this.deleteSelectedNodes()
    }

    // Ctrl/Cmd + A: 全选
    if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
      e.preventDefault()
      this.selectAll()
    }

    // Ctrl/Cmd + C: 复制
    if ((e.ctrlKey || e.metaKey) && e.key === 'c' && activeObject) {
      e.preventDefault()
      this.copy()
    }

    // Ctrl/Cmd + V: 粘贴
    if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
      e.preventDefault()
      this.paste()
    }

    // Escape: 取消选择
    if (e.key === 'Escape') {
      this.canvas.discardActiveObject()
      this.canvas.requestRenderAll()
    }
  }

  /**
   * 创建Canvas节点
   */
  async createNode(nodeConfig: EditorNodeConfiguration): Promise<CanvasNode> {
    if (!this.canvas) {
      throw new Error('Canvas未初始化')
    }

    // 创建节点的视觉表示
    const nodeElement = await this.createNodeElement(nodeConfig)

    // 设置节点属性
    nodeElement.set({
      left: nodeConfig.position.x,
      top: nodeConfig.position.y,
      width: nodeConfig.size.width,
      height: nodeConfig.size.height,
      nodeId: nodeConfig.id,
      nodeType: nodeConfig.type,
      nodeConfig: nodeConfig,
      isCanvasNode: true
    })

    this.canvas.add(nodeElement)
    this.nodes.set(nodeConfig.id, nodeElement)

    this.recordHistory()
    this.emit('node:created', { nodeId: nodeConfig.id, node: nodeElement })

    return nodeElement
  }

  /**
   * 创建节点视觉元素
   */
  private async createNodeElement(nodeConfig: EditorNodeConfiguration): Promise<CanvasNode> {
    const { size, metadata } = nodeConfig

    // 创建节点容器
    const background = new fabric.Rect({
      width: size.width,
      height: size.height,
      fill: '#ffffff',
      stroke: '#e1e5e9',
      strokeWidth: 1,
      rx: 4,
      ry: 4
    })

    // 创建标题文本
    const title = new fabric.Text(metadata.title, {
      left: 10,
      top: 10,
      fontSize: 14,
      fontFamily: 'Arial',
      fill: '#333333',
      width: size.width - 20
    })

    // 创建类型标签
    const typeLabel = new fabric.Text(nodeConfig.type, {
      left: 10,
      top: size.height - 25,
      fontSize: 10,
      fontFamily: 'Arial',
      fill: '#999999'
    })

    // 创建节点组
    const nodeGroup = new fabric.Group([background, title, typeLabel], {
      width: size.width,
      height: size.height,
      subTargetCheck: true
    }) as CanvasNode

    // 设置节点特有属性
    nodeGroup.nodeId = nodeConfig.id
    nodeGroup.nodeType = nodeConfig.type
    nodeGroup.nodeConfig = nodeConfig
    nodeGroup.isCanvasNode = true

    return nodeGroup
  }

  /**
   * 删除节点
   */
  deleteNode(nodeId: string): boolean {
    const node = this.nodes.get(nodeId)
    if (!node || !this.canvas) return false

    this.canvas.remove(node)
    this.nodes.delete(nodeId)

    this.recordHistory()
    this.emit('node:deleted', { nodeId })

    return true
  }

  /**
   * 删除选中的节点
   */
  deleteSelectedNodes(): void {
    if (!this.canvas) return

    const activeObjects = this.canvas.getActiveObjects()
    activeObjects.forEach(obj => {
      if (this.isCanvasNode(obj)) {
        this.deleteNode(obj.nodeId)
      }
    })

    this.canvas.discardActiveObject()
    this.canvas.requestRenderAll()
  }

  /**
   * 更新节点
   */
  updateNode(nodeId: string, updates: Partial<EditorNodeConfiguration>): boolean {
    const node = this.nodes.get(nodeId)
    if (!node) return false

    // 更新位置
    if (updates.position) {
      node.set({
        left: updates.position.x,
        top: updates.position.y
      })
    }

    // 更新尺寸
    if (updates.size) {
      node.set({
        width: updates.size.width,
        height: updates.size.height
      })
    }

    // 更新配置
    if (updates.configuration) {
      node.nodeConfig = { ...node.nodeConfig, ...updates }
    }

    this.canvas?.requestRenderAll()
    this.recordHistory()

    return true
  }

  /**
   * 选择节点
   */
  selectNode(nodeId: string): void {
    const node = this.nodes.get(nodeId)
    if (!node || !this.canvas) return

    this.canvas.setActiveObject(node)
    this.canvas.requestRenderAll()
  }

  /**
   * 选择多个节点
   */
  selectNodes(nodeIds: string[]): void {
    if (!this.canvas) return

    const nodes = nodeIds
      .map(id => this.nodes.get(id))
      .filter(Boolean) as CanvasNode[]

    if (nodes.length === 0) {
      this.canvas.discardActiveObject()
    } else if (nodes.length === 1) {
      this.canvas.setActiveObject(nodes[0])
    } else {
      const selection = new fabric.ActiveSelection(nodes, {
        canvas: this.canvas
      })
      this.canvas.setActiveObject(selection)
    }

    this.canvas.requestRenderAll()
  }

  /**
   * 全选
   */
  selectAll(): void {
    if (!this.canvas) return

    const allNodes = Array.from(this.nodes.values())
    if (allNodes.length === 0) return

    if (allNodes.length === 1) {
      this.canvas.setActiveObject(allNodes[0])
    } else {
      const selection = new fabric.ActiveSelection(allNodes, {
        canvas: this.canvas
      })
      this.canvas.setActiveObject(selection)
    }

    this.canvas.requestRenderAll()
  }

  /**
   * 获取选中的节点
   */
  getSelectedNodes(): CanvasNode[] {
    if (!this.canvas) return []

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
   * 复制选中对象
   */
  copy(): void {
    if (!this.canvas) return

    const activeObject = this.canvas.getActiveObject()
    if (!activeObject) return

    activeObject.clone((cloned: fabric.Object) => {
      this.clipboard = cloned
    })
  }

  /**
   * 粘贴对象
   */
  paste(): void {
    if (!this.canvas || !this.clipboard) return

    this.clipboard.clone((clonedObj: fabric.Object) => {
      this.canvas!.discardActiveObject()

      clonedObj.set({
        left: clonedObj.left! + 10,
        top: clonedObj.top! + 10,
        evented: true
      })

      if (clonedObj.type === 'activeSelection') {
        // 处理多选对象的粘贴
        const activeSelection = clonedObj as fabric.ActiveSelection
        activeSelection.canvas = this.canvas
        activeSelection.forEachObject((obj: fabric.Object) => {
          this.canvas!.add(obj)
        })
        activeSelection.setCoords()
      } else {
        this.canvas!.add(clonedObj)
      }

      this.clipboard!.top! += 10
      this.clipboard!.left! += 10

      this.canvas!.setActiveObject(clonedObj)
      this.canvas!.requestRenderAll()
    })
  }

  private clipboard: fabric.Object | null = null

  /**
   * 记录历史状态
   */
  private recordHistory(): void {
    if (!this.canvas || !this.isRecordingHistory) return

    const state = JSON.stringify(this.canvas.toJSON(['nodeId', 'nodeType', 'nodeConfig', 'isCanvasNode']))

    // 删除当前位置之后的历史
    this.history = this.history.slice(0, this.historyStep + 1)

    // 添加新状态
    this.history.push(state)

    // 限制历史记录数量
    if (this.history.length > this.maxHistorySteps) {
      this.history.shift()
    } else {
      this.historyStep++
    }

    this.emit('history:changed', {
      canUndo: this.canUndo(),
      canRedo: this.canRedo()
    })
  }

  /**
   * 撤销
   */
  undo(): boolean {
    if (!this.canUndo() || !this.canvas) return false

    this.historyStep--
    this.loadHistoryState(this.history[this.historyStep])

    this.emit('history:changed', {
      canUndo: this.canUndo(),
      canRedo: this.canRedo()
    })

    return true
  }

  /**
   * 重做
   */
  redo(): boolean {
    if (!this.canRedo() || !this.canvas) return false

    this.historyStep++
    this.loadHistoryState(this.history[this.historyStep])

    this.emit('history:changed', {
      canUndo: this.canUndo(),
      canRedo: this.canRedo()
    })

    return true
  }

  /**
   * 是否可以撤销
   */
  canUndo(): boolean {
    return this.historyStep > 0
  }

  /**
   * 是否可以重做
   */
  canRedo(): boolean {
    return this.historyStep < this.history.length - 1
  }

  /**
   * 加载历史状态
   */
  private loadHistoryState(state: string): void {
    if (!this.canvas) return

    this.isRecordingHistory = false

    this.canvas.loadFromJSON(state, () => {
      this.canvas!.requestRenderAll()
      this.rebuildNodesMap()
      this.isRecordingHistory = true
    })
  }

  /**
   * 重建节点映射
   */
  private rebuildNodesMap(): void {
    this.nodes.clear()

    this.canvas?.getObjects().forEach(obj => {
      if (this.isCanvasNode(obj)) {
        this.nodes.set(obj.nodeId, obj)
      }
    })
  }

  /**
   * 设置缩放级别
   */
  setZoom(zoom: number, point?: fabric.Point): void {
    if (!this.canvas) return

    zoom = Math.max(this.config.zoom.min, Math.min(this.config.zoom.max, zoom))

    if (point) {
      this.canvas.zoomToPoint(point, zoom)
    } else {
      const center = this.canvas.getCenter()
      this.canvas.zoomToPoint(new fabric.Point(center.left, center.top), zoom)
    }

    this.emit('canvas:zoom', { zoom, point: point || new fabric.Point(0, 0) })
  }

  /**
   * 获取当前缩放级别
   */
  getZoom(): number {
    return this.canvas?.getZoom() || 1
  }

  /**
   * 适应画布大小
   */
  fitToCanvas(): void {
    if (!this.canvas) return

    const objects = this.canvas.getObjects().filter(obj => obj !== this.gridGroup)
    if (objects.length === 0) return

    const group = new fabric.Group(objects)
    const groupWidth = group.width || 0
    const groupHeight = group.height || 0

    const canvasWidth = this.canvas.getWidth()
    const canvasHeight = this.canvas.getHeight()

    const scaleX = (canvasWidth - 100) / groupWidth
    const scaleY = (canvasHeight - 100) / groupHeight
    const scale = Math.min(scaleX, scaleY, this.config.zoom.max)

    this.setZoom(scale)

    // 居中显示
    const vpt = this.canvas.viewportTransform!
    vpt[4] = (canvasWidth - groupWidth * scale) / 2
    vpt[5] = (canvasHeight - groupHeight * scale) / 2

    this.canvas.requestRenderAll()
  }

  /**
   * 清空画布
   */
  clear(): void {
    if (!this.canvas) return

    this.canvas.clear()
    this.nodes.clear()
    this.setupGrid() // 重新添加网格

    this.recordHistory()
    this.emit('canvas:cleared')
  }

  /**
   * 获取画布配置
   */
  getConfig(): FabricCanvasConfig {
    return { ...this.config }
  }

  /**
   * 更新画布配置
   */
  updateConfig(newConfig: Partial<FabricCanvasConfig>): void {
    this.config = { ...this.config, ...newConfig }

    if (!this.canvas) return

    // 更新画布尺寸
    if (newConfig.width || newConfig.height) {
      this.canvas.setDimensions({
        width: this.config.width,
        height: this.config.height
      })
    }

    // 更新背景色
    if (newConfig.backgroundColor) {
      this.canvas.setBackgroundColor(this.config.backgroundColor, () => {
        this.canvas!.requestRenderAll()
      })
    }

    // 重新设置网格
    if (newConfig.grid) {
      if (this.gridGroup) {
        this.canvas.remove(this.gridGroup)
      }
      this.setupGrid()
    }
  }

  /**
   * 销毁Canvas引擎
   */
  destroy(): void {
    document.removeEventListener('keydown', this.handleKeyDown.bind(this))

    if (this.canvas) {
      this.canvas.dispose()
      this.canvas = null
    }

    this.nodes.clear()
    this.history = []
    this.removeAllListeners()
  }

  /**
   * 获取Canvas实例
   */
  getCanvas(): fabric.Canvas | null {
    return this.canvas
  }

  /**
   * 获取所有节点
   */
  getNodes(): Map<string, CanvasNode> {
    return new Map(this.nodes)
  }

  /**
   * 获取节点
   */
  getNode(nodeId: string): CanvasNode | undefined {
    return this.nodes.get(nodeId)
  }

  // ==================== 私有辅助方法 ====================

  /**
   * 检查对象是否为Canvas节点
   */
  private isCanvasNode(obj: any): obj is CanvasNode {
    return obj && obj.isCanvasNode === true && obj.nodeId
  }

  /**
   * 提取节点变更信息
   */
  private extractNodeChanges(node: CanvasNode): any {
    return {
      position: { x: node.left, y: node.top },
      size: { width: node.width, height: node.height },
      angle: node.angle,
      scaleX: node.scaleX,
      scaleY: node.scaleY
    }
  }
}

// 导出类型和类
export type { CanvasNode, FabricCanvasConfig, CanvasEvents }
export { FabricCanvasEngine }