/**
 * 简化Canvas控制器
 *
 * 不依赖Fabric.js的基础Canvas交互实现
 * 提供基础的缩放、平移、绘制功能用于测试
 *
 * @author Claude
 * @version 1.0.0
 */

import { BrowserEventEmitter } from './browser-event-emitter'

/**
 * 简化交互模式
 */
export enum SimpleInteractionMode {
  SELECT = 'select',
  PAN = 'pan',
  DRAW = 'draw'
}

/**
 * 简化节点接口
 */
export interface SimpleCanvasNode {
  id: string
  type: string
  x: number
  y: number
  width: number
  height: number
  title: string
  color: string
  selected: boolean
}

/**
 * 简化Canvas控制器
 */
export class SimpleCanvasController extends BrowserEventEmitter {
  private canvas: HTMLCanvasElement | null = null
  private ctx: CanvasRenderingContext2D | null = null
  private nodes: Map<string, SimpleCanvasNode> = new Map()
  private selectedNodes: Set<string> = new Set()

  private scale = 1
  private offsetX = 0
  private offsetY = 0
  private isDragging = false
  private dragStartX = 0
  private dragStartY = 0
  private mode: SimpleInteractionMode = SimpleInteractionMode.SELECT

  constructor(containerId: string) {
    super()
    this.initializeCanvas(containerId)
  }

  /**
   * 初始化Canvas
   */
  private initializeCanvas(containerId: string): void {
    const container = document.getElementById(containerId)
    if (!container) {
      throw new Error(`容器 ${containerId} 未找到`)
    }

    // 确保容器有正确的样式
    container.style.position = 'relative'
    container.style.width = '100%'
    container.style.height = '100%'
    container.style.overflow = 'hidden'

    // 创建Canvas元素
    this.canvas = document.createElement('canvas')
    this.canvas.width = 1000
    this.canvas.height = 600
    this.canvas.style.border = '1px solid #ccc'
    this.canvas.style.cursor = 'default'
    this.canvas.style.display = 'block'
    this.canvas.style.margin = '0 auto'

    // 清空容器并添加Canvas
    container.innerHTML = ''
    container.appendChild(this.canvas)

    this.ctx = this.canvas.getContext('2d')
    if (!this.ctx) {
      throw new Error('无法获取Canvas 2D上下文')
    }

    this.setupEventListeners()
    this.render()
  }

  /**
   * 设置事件监听器
   */
  private setupEventListeners(): void {
    if (!this.canvas) return

    this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this))
    this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this))
    this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this))
    this.canvas.addEventListener('wheel', this.handleWheel.bind(this))
    this.canvas.addEventListener('click', this.handleClick.bind(this))
  }

  /**
   * 鼠标按下事件
   */
  private handleMouseDown(e: MouseEvent): void {
    this.isDragging = true
    this.dragStartX = e.clientX
    this.dragStartY = e.clientY

    if (this.canvas) {
      this.canvas.style.cursor = 'grabbing'
    }
  }

  /**
   * 鼠标移动事件
   */
  private handleMouseMove(e: MouseEvent): void {
    if (!this.isDragging) return

    const deltaX = e.clientX - this.dragStartX
    const deltaY = e.clientY - this.dragStartY

    if (this.mode === SimpleInteractionMode.PAN) {
      this.offsetX += deltaX
      this.offsetY += deltaY
      this.render()
    }

    this.dragStartX = e.clientX
    this.dragStartY = e.clientY
  }

  /**
   * 鼠标释放事件
   */
  private handleMouseUp(): void {
    this.isDragging = false
    if (this.canvas) {
      this.canvas.style.cursor = 'default'
    }
  }

  /**
   * 滚轮事件（缩放）
   */
  private handleWheel(e: WheelEvent): void {
    e.preventDefault()

    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1
    const newScale = this.scale * zoomFactor

    if (newScale >= 0.1 && newScale <= 5) {
      this.scale = newScale
      this.render()
      this.emit('zoom:changed', { zoom: this.scale })
    }
  }

  /**
   * 点击事件
   */
  private handleClick(e: MouseEvent): void {
    const rect = this.canvas!.getBoundingClientRect()
    const x = (e.clientX - rect.left - this.offsetX) / this.scale
    const y = (e.clientY - rect.top - this.offsetY) / this.scale

    // 检查是否点击了节点
    const clickedNode = this.getNodeAt(x, y)

    if (clickedNode) {
      this.selectNode(clickedNode.id)
    } else {
      this.clearSelection()
    }
  }

  /**
   * 获取指定坐标的节点
   */
  private getNodeAt(x: number, y: number): SimpleCanvasNode | null {
    for (const node of this.nodes.values()) {
      if (x >= node.x && x <= node.x + node.width &&
          y >= node.y && y <= node.y + node.height) {
        return node
      }
    }
    return null
  }

  /**
   * 渲染Canvas
   */
  private render(): void {
    if (!this.ctx || !this.canvas) return

    // 清空Canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)

    // 保存当前变换
    this.ctx.save()

    // 应用变换
    this.ctx.translate(this.offsetX, this.offsetY)
    this.ctx.scale(this.scale, this.scale)

    // 绘制网格
    this.drawGrid()

    // 绘制所有节点
    for (const node of this.nodes.values()) {
      this.drawNode(node)
    }

    // 恢复变换
    this.ctx.restore()

    // 绘制UI信息
    this.drawUI()
  }

  /**
   * 绘制网格
   */
  private drawGrid(): void {
    if (!this.ctx) return

    const gridSize = 20
    const width = this.canvas!.width / this.scale
    const height = this.canvas!.height / this.scale

    this.ctx.strokeStyle = '#f0f0f0'
    this.ctx.lineWidth = 0.5

    // 垂直线
    for (let x = 0; x < width; x += gridSize) {
      this.ctx.beginPath()
      this.ctx.moveTo(x, 0)
      this.ctx.lineTo(x, height)
      this.ctx.stroke()
    }

    // 水平线
    for (let y = 0; y < height; y += gridSize) {
      this.ctx.beginPath()
      this.ctx.moveTo(0, y)
      this.ctx.lineTo(width, y)
      this.ctx.stroke()
    }
  }

  /**
   * 绘制节点
   */
  private drawNode(node: SimpleCanvasNode): void {
    if (!this.ctx) return

    // 绘制节点矩形
    this.ctx.fillStyle = node.selected ? '#e3f2fd' : node.color
    this.ctx.strokeStyle = node.selected ? '#2196f3' : '#ccc'
    this.ctx.lineWidth = node.selected ? 2 : 1

    this.ctx.fillRect(node.x, node.y, node.width, node.height)
    this.ctx.strokeRect(node.x, node.y, node.width, node.height)

    // 绘制节点文本
    this.ctx.fillStyle = '#333'
    this.ctx.font = '14px Arial'
    this.ctx.textAlign = 'center'
    this.ctx.textBaseline = 'middle'
    this.ctx.fillText(
      node.title,
      node.x + node.width / 2,
      node.y + node.height / 2
    )

    // 绘制节点ID（小字）
    this.ctx.font = '10px Arial'
    this.ctx.fillStyle = '#666'
    this.ctx.fillText(
      node.id,
      node.x + node.width / 2,
      node.y + node.height / 2 + 15
    )
  }

  /**
   * 绘制UI信息
   */
  private drawUI(): void {
    if (!this.ctx) return

    this.ctx.save()

    // 绘制缩放信息
    this.ctx.fillStyle = '#333'
    this.ctx.font = '12px Arial'
    this.ctx.textAlign = 'left'
    this.ctx.fillText(`缩放: ${(this.scale * 100).toFixed(0)}%`, 10, 20)
    this.ctx.fillText(`偏移: (${this.offsetX.toFixed(0)}, ${this.offsetY.toFixed(0)})`, 10, 35)
    this.ctx.fillText(`节点数: ${this.nodes.size}`, 10, 50)
    this.ctx.fillText(`选中: ${this.selectedNodes.size}`, 10, 65)
    this.ctx.fillText(`模式: ${this.mode}`, 10, 80)

    this.ctx.restore()
  }

  /**
   * 创建节点
   */
  public createNode(config: {
    id: string
    type: string
    x: number
    y: number
    width: number
    height: number
    title: string
    color?: string
  }): SimpleCanvasNode {
    const node: SimpleCanvasNode = {
      id: config.id,
      type: config.type,
      x: config.x,
      y: config.y,
      width: config.width,
      height: config.height,
      title: config.title,
      color: config.color || '#ffffff',
      selected: false
    }

    this.nodes.set(node.id, node)
    this.render()
    this.emit('node:added', { node })

    return node
  }

  /**
   * 删除节点
   */
  public removeNode(nodeId: string): boolean {
    const removed = this.nodes.delete(nodeId)
    if (removed) {
      this.selectedNodes.delete(nodeId)
      this.render()
      this.emit('node:removed', { nodeId })
    }
    return removed
  }

  /**
   * 选择节点
   */
  public selectNode(nodeId: string): void {
    // 取消所有选择
    for (const node of this.nodes.values()) {
      node.selected = false
    }
    this.selectedNodes.clear()

    // 选择指定节点
    const node = this.nodes.get(nodeId)
    if (node) {
      node.selected = true
      this.selectedNodes.add(nodeId)
      this.render()
      this.emit('selection:changed', { selectedNodeIds: [nodeId] })
    }
  }

  /**
   * 清空选择
   */
  public clearSelection(): void {
    for (const node of this.nodes.values()) {
      node.selected = false
    }
    this.selectedNodes.clear()
    this.render()
    this.emit('selection:changed', { selectedNodeIds: [] })
  }

  /**
   * 设置缩放
   */
  public setZoom(zoom: number): void {
    if (zoom >= 0.1 && zoom <= 5) {
      this.scale = zoom
      this.render()
      this.emit('zoom:changed', { zoom: this.scale })
    }
  }

  /**
   * 设置平移
   */
  public setPan(x: number, y: number): void {
    this.offsetX = x
    this.offsetY = y
    this.render()
    this.emit('pan:changed', { pan: { x, y } })
  }

  /**
   * 适应内容
   */
  public fitToContent(): void {
    if (this.nodes.size === 0) return

    let minX = Infinity, minY = Infinity
    let maxX = -Infinity, maxY = -Infinity

    // 计算所有节点的边界
    for (const node of this.nodes.values()) {
      minX = Math.min(minX, node.x)
      minY = Math.min(minY, node.y)
      maxX = Math.max(maxX, node.x + node.width)
      maxY = Math.max(maxY, node.y + node.height)
    }

    const contentWidth = maxX - minX
    const contentHeight = maxY - minY
    const padding = 50

    // 计算适应的缩放比例
    const scaleX = (this.canvas!.width - padding * 2) / contentWidth
    const scaleY = (this.canvas!.height - padding * 2) / contentHeight
    const newScale = Math.min(scaleX, scaleY, 1) // 不超过1倍

    // 计算居中的偏移
    const centerX = (minX + maxX) / 2
    const centerY = (minY + maxY) / 2
    const newOffsetX = this.canvas!.width / 2 - centerX * newScale
    const newOffsetY = this.canvas!.height / 2 - centerY * newScale

    this.scale = newScale
    this.offsetX = newOffsetX
    this.offsetY = newOffsetY

    this.render()
    this.emit('fit:completed')
  }

  /**
   * 设置交互模式
   */
  public setMode(mode: SimpleInteractionMode): void {
    this.mode = mode
    if (this.canvas) {
      switch (mode) {
        case SimpleInteractionMode.PAN:
          this.canvas.style.cursor = 'grab'
          break
        case SimpleInteractionMode.DRAW:
          this.canvas.style.cursor = 'crosshair'
          break
        default:
          this.canvas.style.cursor = 'default'
      }
    }
    this.emit('mode:changed', { mode })
  }

  /**
   * 清空所有节点
   */
  public clear(): void {
    this.nodes.clear()
    this.selectedNodes.clear()
    this.render()
    this.emit('canvas:cleared')
  }

  /**
   * 获取所有节点
   */
  public getNodes(): SimpleCanvasNode[] {
    return Array.from(this.nodes.values())
  }

  /**
   * 获取选中的节点
   */
  public getSelectedNodes(): SimpleCanvasNode[] {
    return Array.from(this.selectedNodes).map(id => this.nodes.get(id)!).filter(Boolean)
  }

  /**
   * 获取状态
   */
  public getState() {
    return {
      isInitialized: true,
      canvasId: 'simple-canvas',
      nodeCount: this.nodes.size,
      selectedNodeIds: Array.from(this.selectedNodes),
      currentMode: this.mode,
      zoom: this.scale,
      pan: { x: this.offsetX, y: this.offsetY },
      performanceMetrics: {
        renderTime: 0,
        eventProcessingTime: 0,
        syncTime: 0,
        nodeCount: this.nodes.size,
        eventQueueSize: 0
      },
      collaborationUsers: [],
      pendingConflicts: []
    }
  }

  /**
   * 销毁控制器
   */
  public destroy(): void {
    if (this.canvas) {
      this.canvas.removeEventListener('mousedown', this.handleMouseDown.bind(this))
      this.canvas.removeEventListener('mousemove', this.handleMouseMove.bind(this))
      this.canvas.removeEventListener('mouseup', this.handleMouseUp.bind(this))
      this.canvas.removeEventListener('wheel', this.handleWheel.bind(this))
      this.canvas.removeEventListener('click', this.handleClick.bind(this))
    }

    this.nodes.clear()
    this.selectedNodes.clear()
    this.removeAllListeners()
  }
}

export default SimpleCanvasController