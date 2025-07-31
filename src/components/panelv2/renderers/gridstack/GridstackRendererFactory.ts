/**
 * Gridstack Renderer Factory
 * 网格布局渲染器工厂，创建和配置GridstackRenderer实例
 * 基于 gridstack.js 实现的响应式网格布局系统
 */

import type { BaseRenderer, RendererConfig } from '../../types/renderer'
import type { BaseCanvasItem } from '../../types/core'
import { GridStack } from 'gridstack'
import 'gridstack/dist/gridstack.min.css'
import { createApp, type App } from 'vue'

// GridstackRenderer组件的异步加载
const GridstackRendererComponent = () => import('./GridstackRenderer.vue')

/**
 * 网格布局渲染器包装类
 * 将Vue组件包装为BaseRenderer接口，使用gridstack.js实现网格布局
 */
export class GridstackRenderer implements BaseRenderer {
  readonly id = 'gridstack'
  readonly name = 'Gridstack Renderer'
  readonly version = '1.0.0'
  readonly capabilities = {
    supportsDrag: true,
    supportsResize: true,
    supportsRotate: false,
    supportsGrouping: false,
    supportsLayers: false,
    supportsSnapping: true,
    supportsPrecisePositioning: true,
    supportsCustomCoordinates: true,
    supportsZoom: false,
    supportsMultiSelect: true,
    supportsKeyboardShortcuts: true,
    supportsContextMenu: true,
    supportsUndo: true,
    supportsClipboard: true
  }

  private vueApp: App | null = null
  private container: HTMLElement | null = null
  config: RendererConfig = {}
  private items: BaseCanvasItem[] = []
  private eventHandlers: Map<string, Function[]> = new Map()
  private isInitialized = false

  get state() {
    return {
      initialized: this.isInitialized,
      readonly: this.config.readonly || false,
      selectedIds: [],
      viewport: { zoom: 1, offsetX: 0, offsetY: 0 },
      draggedIds: [],
      loading: false,
      error: null
    }
  }

  async initialize(container: HTMLElement, config: RendererConfig): Promise<void> {
    try {
      console.log('[GridstackRenderer] Initializing with config:', config)
      this.container = container
      this.config = config
      
      // 清空容器
      if (this.container) {
        this.container.innerHTML = ''
        this.container.style.position = 'relative'
        this.container.style.width = '100%'
        this.container.style.height = '100%'
        this.container.style.overflow = 'auto'
      }
      
      // 如果没有初始数据，添加一些示例数据
      if (this.items.length === 0) {
        this.items = [
          {
            id: 'demo-1',
            type: 'widget',
            position: { x: 0, y: 0 },
            size: { width: 3, height: 2 },
            data: {
              title: '示例组件 1',
              content: '这是一个示例组件，您可以拖拽和调整大小。'
            }
          },
          {
            id: 'demo-2',
            type: 'chart',
            position: { x: 3, y: 0 },
            size: { width: 4, height: 3 },
            data: {
              title: '图表组件',
              content: '这里可以显示图表数据。'
            }
          },
          {
            id: 'demo-3',
            type: 'text',
            position: { x: 0, y: 2 },
            size: { width: 2, height: 2 },
            data: {
              title: '文本组件',
              content: '这是一个文本组件示例。'
            }
          }
        ]
      }
      
      // 动态加载Vue组件
      const componentModule = await GridstackRendererComponent()
      const component = componentModule.default
      
      // 创建Vue应用实例
      this.vueApp = createApp(component, {
        config: this.config,
        items: this.items,
        readonly: this.config.readonly || false,
        showToolbar: true
      })
      
      // 挂载Vue应用到容器
      this.vueApp.mount(this.container)
      
      // 标记初始化完成
      this.isInitialized = true
      
      console.log('[GridstackRenderer] Initialized successfully')
      
      // 触发初始化完成事件
      this.emit('initialized', {
        renderer: this,
        container: this.container,
        config: this.config
      })
      
    } catch (error) {
      console.error('[GridstackRenderer] Initialization failed:', error)
      this.emit('error', {
        type: 'initialization',
        error,
        renderer: this
      })
      throw error
    }
  }

  async destroy(): Promise<void> {
    try {
      console.log('[GridstackRenderer] Destroying renderer')
      
      this.isInitialized = false
      
      // 卸载 Vue 应用
      if (this.vueApp) {
        this.vueApp.unmount()
        this.vueApp = null
      }
      
      // 清理事件监听器
      this.eventHandlers.clear()
      
      // 清理容器
      if (this.container) {
        this.container.innerHTML = ''
        this.container = null
      }
      
      // 清理数据
      this.items = []
      
      console.log('[GridstackRenderer] Destroyed successfully')
      
    } catch (error) {
      console.error('[GridstackRenderer] Destruction failed:', error)
      throw error
    }
  }

  /**
   * 设置 GridStack 事件监听
   */
  private setupGridstackEvents(): void {
    if (!this.gridstack) return
    
    // 监听拖拽事件
    this.gridstack.on('dragstart', (event, element) => {
      const id = element.getAttribute('gs-id') || element.id
      this.emit('item:dragstart', { id, element })
    })
    
    this.gridstack.on('dragstop', (event, element) => {
      const id = element.getAttribute('gs-id') || element.id
      const node = this.gridstack?.getGridItems().find(item => 
        (item.getAttribute('gs-id') || item.id) === id
      )
      if (node) {
        this.emit('item:dragstop', { id, element, position: this.getNodePosition(node) })
      }
    })
    
    // 监听调整大小事件
    this.gridstack.on('resizestart', (event, element) => {
      const id = element.getAttribute('gs-id') || element.id
      this.emit('item:resizestart', { id, element })
    })
    
    this.gridstack.on('resizestop', (event, element) => {
      const id = element.getAttribute('gs-id') || element.id
      const node = this.gridstack?.getGridItems().find(item => 
        (item.getAttribute('gs-id') || item.id) === id
      )
      if (node) {
        this.emit('item:resizestop', { id, element, size: this.getNodeSize(node) })
      }
    })
    
    // 监听布局变化
    this.gridstack.on('change', (event, items) => {
      this.emit('layout:change', items)
    })
  }
  
  /**
   * 获取节点位置信息
   */
  private getNodePosition(element: Element): { x: number, y: number } {
    const rect = element.getBoundingClientRect()
    const containerRect = this.gridContainer?.getBoundingClientRect()
    return {
      x: rect.left - (containerRect?.left || 0),
      y: rect.top - (containerRect?.top || 0)
    }
  }
  
  /**
   * 获取节点尺寸信息
   */
  private getNodeSize(element: Element): { width: number, height: number } {
    const rect = element.getBoundingClientRect()
    return {
      width: rect.width,
      height: rect.height
    }
  }

  resize(width: number, height: number): void {
    if (this.container) {
      this.container.style.width = `${width}px`
      this.container.style.height = `${height}px`
    }
    
    // 通知 GridStack 重新计算布局
    if (this.gridstack) {
      this.gridstack.resize()
    }
  }

  setData(items: BaseCanvasItem[]): void {
    console.log('[GridstackRenderer] Setting data, items count:', items.length)
    this.items = [...items]
    this.emit('data:change', { items })
  }

  getData(): BaseCanvasItem[] {
    return [...this.items]
  }

  addItem(item: BaseCanvasItem): void {
    console.log('[GridstackRenderer] Adding item:', item)
    this.items.push(item)
    this.emit('item:add', item)
  }

  removeItem(id: string): void {
    this.items = this.items.filter(item => item.id !== id)
    
    // 从 GridStack 中移除
    if (this.gridstack) {
      const element = this.gridContainer?.querySelector(`[gs-id="${id}"]`)
      if (element) {
        this.gridstack.removeWidget(element as HTMLElement, false)
      }
    }
    
    this.emit('item:remove', [id])
  }

  updateItem(id: string, updates: Partial<BaseCanvasItem>): void {
    const index = this.items.findIndex(item => item.id === id)
    if (index !== -1) {
      this.items[index] = { ...this.items[index], ...updates }
      
      // 更新 GridStack 中的项
      if (this.gridstack) {
        const element = this.gridContainer?.querySelector(`[gs-id="${id}"]`) as HTMLElement
        if (element && updates.position) {
          this.gridstack.update(element, {
            x: updates.position.x,
            y: updates.position.y,
            w: updates.size?.width,
            h: updates.size?.height
          })
        }
      }
      
      this.emit('item:update', id, updates)
    }
  }
  
  /**
   * 添加网格项到 GridStack
   */
  private addGridItem(item: BaseCanvasItem): void {
    if (!this.gridstack) return
    
    // 创建网格项元素
    const widget = document.createElement('div')
    widget.className = 'grid-stack-item'
    widget.setAttribute('gs-id', item.id)
    
    // 设置网格项属性
    const gridOptions = {
      x: item.position?.x || 0,
      y: item.position?.y || 0,
      w: item.size?.width || 2,
      h: item.size?.height || 2,
      id: item.id
    }
    
    // 创建内容容器
    const content = document.createElement('div')
    content.className = 'grid-stack-item-content'
    content.style.background = '#f8f9fa'
    content.style.border = '1px solid #dee2e6'
    content.style.borderRadius = '4px'
    content.style.padding = '10px'
    content.style.overflow = 'hidden'
    
    // 添加标题
    const title = document.createElement('div')
    title.textContent = item.data?.title || item.type || 'Grid Item'
    title.style.fontWeight = 'bold'
    title.style.marginBottom = '8px'
    content.appendChild(title)
    
    // 添加内容
    const body = document.createElement('div')
    body.textContent = item.data?.content || `Item ${item.id}`
    body.style.fontSize = '14px'
    body.style.color = '#6c757d'
    content.appendChild(body)
    
    widget.appendChild(content)
    
    // 添加到 GridStack - 使用makeWidget方法兼容GridStack v11
    const gridWidget = this.gridstack.makeWidget(widget)
    this.gridstack.addWidget(gridWidget, gridOptions)
  }

  render(): void {
    // Vue组件会自动处理渲染
    console.log('[GridstackRenderer] Render called, items count:', this.items.length)
  }

  refresh(): void {
    // Trigger re-render if needed
    this.render()
  }

  clear(): void {
    this.items = []
    this.emit('layout:change', [])
  }

  setViewport(viewport: any): void {
    console.warn('Kanban renderer does not support viewport operations')
  }

  getViewport() {
    return { zoom: 1, offsetX: 0, offsetY: 0 }
  }

  fitToContent(): void {
    // Auto-handled by kanban layout
  }

  centerView(): void {
    // Not applicable for kanban layout
  }

  enableEdit(): void {
    this.updateConfig({ readonly: false })
  }

  disableEdit(): void {
    this.updateConfig({ readonly: true })
  }

  setReadonly(readonly: boolean): void {
    this.updateConfig({ readonly })
  }

  selectItems(ids: string[]): void {
    this.emit('item:select', ids)
  }

  clearSelection(): void {
    this.emit('selection:clear', undefined)
  }

  getSelection(): string[] {
    // This would need to be tracked in the component state
    return []
  }

  on<K extends keyof import('../types/renderer').RendererEvents>(
    event: K, 
    handler: import('../types/renderer').RendererEvents[K]
  ): void {
    if (!this.eventHandlers.has(event as string)) {
      this.eventHandlers.set(event as string, [])
    }
    this.eventHandlers.get(event as string)!.push(handler as Function)
  }

  off<K extends keyof import('../types/renderer').RendererEvents>(
    event: K, 
    handler: import('../types/renderer').RendererEvents[K]
  ): void {
    const handlers = this.eventHandlers.get(event as string)
    if (handlers) {
      const index = handlers.indexOf(handler as Function)
      if (index > -1) {
        handlers.splice(index, 1)
      }
    }
  }

  emit<K extends keyof import('../types/renderer').RendererEvents>(
    event: K, 
    ...args: Parameters<import('../types/renderer').RendererEvents[K]>
  ): void {
    const handlers = this.eventHandlers.get(event as string)
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(...args)
        } catch (error) {
          console.error(`Error in event handler for ${String(event)}:`, error)
        }
      })
    }
  }

  updateConfig(config: Partial<RendererConfig>): void {
    this.config = { ...this.config, ...config }
  }

  getConfig(): RendererConfig {
    return { ...this.config }
  }

  hitTest(position: { x: number, y: number }): string | null {
    // 简单的碰撞检测实现
    // 实际实现需要与Vue组件交互
    return null
  }

  getBounds(id: string): { position: { x: number, y: number }, size: { width: number, height: number } } | null {
    // 需要从Vue组件获取实际边界
    return null
  }

  isVisible(id: string): boolean {
    return this.items.some(item => item.id === id)
  }
}

/**
 * 创建GridstackRenderer实例的工厂函数
 */
export function createGridstackRenderer(): GridstackRenderer {
  return new GridstackRenderer()
}

/**
 * 获取GridstackRenderer组件
 */
export function getGridstackRendererComponent(): Component {
  return GridstackRendererComponent
}

export default GridstackRenderer