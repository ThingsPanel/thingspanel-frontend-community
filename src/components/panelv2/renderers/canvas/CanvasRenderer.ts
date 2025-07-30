import { BaseRenderer } from '../base/BaseRenderer'
import type { BaseItem, RendererMode } from '../base/interfaces'
import type { CanvasItem, CanvasConfig } from './types'

/**
 * Canvas渲染器类
 * 继承自BaseRenderer，实现Canvas特定的功能
 */
export class CanvasRenderer extends BaseRenderer<CanvasItem> {
  private canvasElement: HTMLCanvasElement | null = null
  private ctx: CanvasRenderingContext2D | null = null
  private config: CanvasConfig
  private viewport = {
    x: 0,
    y: 0,
    zoom: 1
  }
  private isDragging = false
  private dragStart = { x: 0, y: 0 }
  private selectedItems = new Set<string>()

  public readonly version = '1.0.0'

  constructor(container: HTMLElement, config: Partial<CanvasConfig> = {}) {
    super()

    // 默认配置
    const defaultConfig: CanvasConfig = {
      width: 1200,
      height: 800,
      zoom: 1,
      minZoom: 0.1,
      maxZoom: 5,
      backgroundColor: '#ffffff',
      grid: {
        enabled: true,
        size: 20,
        snap: true,
        color: '#e5e7eb',
        opacity: 0.5,
        visible: true
      },
      selectionBox: true,
      multiSelect: true,
      drag: {
        enabled: true,
        threshold: 5,
        containment: true
      },
      resize: {
        enabled: true,
        handleSize: 8,
        aspectRatio: false
      }
    }

    this.config = { ...defaultConfig, ...config }
    this.viewport.zoom = this.config.zoom

    this.createCanvas(container)
  }

  /**
   * 创建Canvas元素
   */
  private createCanvas(container: HTMLElement): void {
    this.canvasElement = document.createElement('canvas')
    this.canvasElement.width = this.config.width
    this.canvasElement.height = this.config.height
    this.canvasElement.style.width = '100%'
    this.canvasElement.style.height = '100%'
    this.canvasElement.style.border = '1px solid #e5e7eb'
    this.canvasElement.style.backgroundColor = this.config.backgroundColor

    this.ctx = this.canvasElement.getContext('2d')

    container.appendChild(this.canvasElement)

    this.setupEventListeners()
  }

  /**
   * 设置事件监听器
   */
  private setupEventListeners(): void {
    if (!this.canvasElement) return

    // 鼠标事件
    this.canvasElement.addEventListener('mousedown', this.handleMouseDown.bind(this))
    this.canvasElement.addEventListener('mousemove', this.handleMouseMove.bind(this))
    this.canvasElement.addEventListener('mouseup', this.handleMouseUp.bind(this))
    this.canvasElement.addEventListener('click', this.handleClick.bind(this))
    this.canvasElement.addEventListener('dblclick', this.handleDoubleClick.bind(this))
    this.canvasElement.addEventListener('contextmenu', this.handleContextMenu.bind(this))

    // 滚轮事件（缩放）
    this.canvasElement.addEventListener('wheel', this.handleWheel.bind(this))
  }

  /**
   * 初始化渲染器
   */
  async init(): Promise<void> {
    console.log('CanvasRenderer: 初始化')
    this.drawCanvas()
    this.isInitialized = true
    this.emit('renderer-ready')
  }

  /**
   * 销毁渲染器
   */
  destroy(): void {
    console.log('CanvasRenderer: 销毁')

    if (this.canvasElement) {
      this.canvasElement.remove()
      this.canvasElement = null
      this.ctx = null
    }

    this.isInitialized = false
    this.items.clear()
    this.selectedItems.clear()
  }

  /**
   * 刷新渲染器
   */
  refresh(): void {
    console.log('CanvasRenderer: 刷新')
    this.drawCanvas()
  }

  /**
   * 渲染单个项目
   */
  renderItem(item: CanvasItem): void {
    if (!this.ctx) return

    const { x, y } = this.worldToScreen(item.position.x, item.position.y)
    const width = item.size.width * this.viewport.zoom
    const height = item.size.height * this.viewport.zoom

    // 保存上下文状态
    this.ctx.save()

    // 应用变换
    this.ctx.translate(x + width / 2, y + height / 2)
    if (item.position.rotation) {
      this.ctx.rotate((item.position.rotation * Math.PI) / 180)
    }
    this.ctx.translate(-width / 2, -height / 2)

    // 绘制项目背景
    this.ctx.fillStyle = item.style?.backgroundColor || '#ffffff'
    this.ctx.fillRect(0, 0, width, height)

    // 绘制边框
    this.ctx.strokeStyle = this.selectedItems.has(item.id) ? '#3b82f6' : item.style?.borderColor || '#e5e7eb'
    this.ctx.lineWidth = this.selectedItems.has(item.id) ? 2 : 1
    this.ctx.strokeRect(0, 0, width, height)

    // 绘制内容
    this.ctx.fillStyle = item.style?.color || '#000000'
    this.ctx.font = `${12 * this.viewport.zoom}px Arial`
    this.ctx.textAlign = 'center'
    this.ctx.textBaseline = 'middle'
    this.ctx.fillText(item.title || item.type, width / 2, height / 2)

    // 恢复上下文状态
    this.ctx.restore()
  }

  /**
   * 从DOM中移除项目
   */
  removeItemFromDOM(itemId: string): void {
    // Canvas渲染器中，移除项目只需要重新绘制
    this.drawCanvas()
  }

  /**
   * 绘制整个Canvas
   */
  private drawCanvas(): void {
    if (!this.ctx || !this.canvasElement) return

    // 清空画布
    this.ctx.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height)

    // 绘制背景
    this.ctx.fillStyle = this.config.backgroundColor
    this.ctx.fillRect(0, 0, this.canvasElement.width, this.canvasElement.height)

    // 绘制网格
    if (this.config.grid.enabled && this.config.grid.visible) {
      this.drawGrid()
    }

    // 绘制所有项目
    for (const item of this.items.values()) {
      if (item.visible !== false) {
        this.renderItem(item)
      }
    }
  }

  /**
   * 绘制网格
   */
  private drawGrid(): void {
    if (!this.ctx || !this.canvasElement) return

    const gridSize = this.config.grid.size * this.viewport.zoom
    const offsetX = this.viewport.x % gridSize
    const offsetY = this.viewport.y % gridSize

    this.ctx.strokeStyle = this.config.grid.color
    this.ctx.globalAlpha = this.config.grid.opacity
    this.ctx.lineWidth = 1

    // 绘制垂直线
    for (let x = offsetX; x < this.canvasElement.width; x += gridSize) {
      this.ctx.beginPath()
      this.ctx.moveTo(x, 0)
      this.ctx.lineTo(x, this.canvasElement.height)
      this.ctx.stroke()
    }

    // 绘制水平线
    for (let y = offsetY; y < this.canvasElement.height; y += gridSize) {
      this.ctx.beginPath()
      this.ctx.moveTo(0, y)
      this.ctx.lineTo(this.canvasElement.width, y)
      this.ctx.stroke()
    }

    this.ctx.globalAlpha = 1
  }

  /**
   * 世界坐标转屏幕坐标
   */
  private worldToScreen(worldX: number, worldY: number): { x: number; y: number } {
    return {
      x: (worldX + this.viewport.x) * this.viewport.zoom,
      y: (worldY + this.viewport.y) * this.viewport.zoom
    }
  }

  /**
   * 屏幕坐标转世界坐标
   */
  private screenToWorld(screenX: number, screenY: number): { x: number; y: number } {
    return {
      x: screenX / this.viewport.zoom - this.viewport.x,
      y: screenY / this.viewport.zoom - this.viewport.y
    }
  }

  /**
   * 获取鼠标位置下的项目
   */
  private getItemAtPosition(x: number, y: number): CanvasItem | null {
    const worldPos = this.screenToWorld(x, y)

    // 从后往前遍历（z-index高的在前）
    const sortedItems = Array.from(this.items.values()).sort((a, b) => (b.zIndex || 0) - (a.zIndex || 0))

    for (const item of sortedItems) {
      if (item.visible === false) continue

      const { x: itemX, y: itemY } = item.position
      const { width, height } = item.size

      if (worldPos.x >= itemX && worldPos.x <= itemX + width && worldPos.y >= itemY && worldPos.y <= itemY + height) {
        return item
      }
    }

    return null
  }

  // 事件处理方法
  private handleMouseDown(event: MouseEvent): void {
    const rect = this.canvasElement!.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    this.isDragging = true
    this.dragStart = { x, y }

    const item = this.getItemAtPosition(x, y)
    if (item) {
      this.selectItems([item.id])
      this.emit('item-select', item)
    } else {
      this.clearSelection()
    }
  }

  private handleMouseMove(event: MouseEvent): void {
    if (!this.isDragging) return

    const rect = this.canvasElement!.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    const deltaX = (x - this.dragStart.x) / this.viewport.zoom
    const deltaY = (y - this.dragStart.y) / this.viewport.zoom

    // 移动选中的项目
    for (const itemId of this.selectedItems) {
      const item = this.items.get(itemId)
      if (item && !item.locked) {
        item.position.x += deltaX
        item.position.y += deltaY

        // 网格吸附
        if (this.config.grid.snap) {
          item.position.x = Math.round(item.position.x / this.config.grid.size) * this.config.grid.size
          item.position.y = Math.round(item.position.y / this.config.grid.size) * this.config.grid.size
        }

        this.emit('item-change', item)
      }
    }

    this.dragStart = { x, y }
    this.drawCanvas()
  }

  private handleMouseUp(): void {
    this.isDragging = false
  }

  private handleClick(event: MouseEvent): void {
    const rect = this.canvasElement!.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    const item = this.getItemAtPosition(x, y)
    if (item) {
      this.emit('item-click', item)
    }
  }

  private handleDoubleClick(event: MouseEvent): void {
    const rect = this.canvasElement!.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    const item = this.getItemAtPosition(x, y)
    if (item) {
      this.emit('item-dblclick', item)
    }
  }

  private handleContextMenu(event: MouseEvent): void {
    event.preventDefault()

    const rect = this.canvasElement!.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    const item = this.getItemAtPosition(x, y)
    if (item) {
      this.emit('item-contextmenu', item, { x: event.clientX, y: event.clientY })
    }
  }

  private handleWheel(event: WheelEvent): void {
    event.preventDefault()

    const delta = event.deltaY > 0 ? -0.1 : 0.1
    const newZoom = Math.max(this.config.minZoom, Math.min(this.config.maxZoom, this.viewport.zoom + delta))

    this.viewport.zoom = newZoom
    this.drawCanvas()

    this.emit('zoom-change', newZoom)
  }

  /**
   * 选择项目
   */
  selectItems(itemIds: string[]): void {
    if (!this.config.multiSelect) {
      this.selectedItems.clear()
    }

    for (const id of itemIds) {
      this.selectedItems.add(id)
    }

    this.drawCanvas()
  }

  /**
   * 清除选择
   */
  clearSelection(): void {
    this.selectedItems.clear()
    this.drawCanvas()
  }

  /**
   * 获取选中的项目
   */
  getSelectedItems(): CanvasItem[] {
    return Array.from(this.selectedItems)
      .map(id => this.items.get(id))
      .filter(Boolean) as CanvasItem[]
  }

  /**
   * 获取选中项目数量
   */
  getSelectedCount(): number {
    return this.selectedItems.size
  }

  /**
   * 设置缩放级别
   */
  setZoom(zoom: number): void {
    this.viewport.zoom = Math.max(this.config.minZoom, Math.min(this.config.maxZoom, zoom))
    this.drawCanvas()
  }

  /**
   * 获取当前缩放级别
   */
  getZoom(): number {
    return this.viewport.zoom
  }

  /**
   * 更新配置
   */
  updateConfig(newConfig: Partial<CanvasConfig>): void {
    this.config = { ...this.config, ...newConfig }

    if (this.canvasElement) {
      this.canvasElement.style.backgroundColor = this.config.backgroundColor
    }

    this.drawCanvas()
  }

  /**
   * 获取配置
   */
  getConfig(): CanvasConfig {
    return { ...this.config }
  }

  /**
   * 获取状态信息
   */
  getState() {
    return {
      initialized: this.isInitialized,
      viewport: { ...this.viewport },
      selectedCount: this.selectedItems.size,
      totalItems: this.items.size
    }
  }
}
