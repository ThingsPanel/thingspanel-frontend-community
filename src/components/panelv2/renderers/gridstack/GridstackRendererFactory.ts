/**
 * Gridstack Renderer Factory
 * 网格布局渲染器工厂，创建和配置GridstackRenderer实例
 * 基于 gridstack.js 实现的响应式网格布局系统
 */

import type { BaseRenderer, RendererConfig } from '../../types/renderer'
import type { BaseCanvasItem } from '../../types/core'
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
  private eventHandlers: Map<string, ((...args: any[]) => void)[]> = new Map()
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
        readonly: this.config.readonly || false
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

  resize(width: number, height: number): void {
    if (this.container) {
      this.container.style.width = `${width}px`
      this.container.style.height = `${height}px`
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
    this.emit('item:remove', [id])
  }

  updateItem(id: string, updates: Partial<BaseCanvasItem>): void {
    const index = this.items.findIndex(item => item.id === id)
    if (index !== -1) {
      this.items[index] = { ...this.items[index], ...updates }
      this.emit('item:update', id, updates)
    }
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

  setViewport(_viewport: any): void {
    console.warn('Gridstack renderer does not support viewport operations')
  }

  getViewport() {
    return { zoom: 1, offsetX: 0, offsetY: 0 }
  }

  fitToContent(): void {
    // Auto-handled by gridstack layout
  }

  centerView(): void {
    // Not applicable for gridstack layout
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
    this.eventHandlers.get(event as string)!.push(handler as (...args: any[]) => void)
  }

  off<K extends keyof import('../types/renderer').RendererEvents>(
    event: K,
    handler: import('../types/renderer').RendererEvents[K]
  ): void {
    const handlers = this.eventHandlers.get(event as string)
    if (handlers) {
      const index = handlers.indexOf(handler as (...args: any[]) => void)
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

  hitTest(_position: { x: number; y: number }): string | null {
    // 简单的碰撞检测实现
    // 实际实现需要与Vue组件交互
    return null
  }

  getBounds(_id: string): { position: { x: number; y: number }; size: { width: number; height: number } } | null {
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
export function getGridstackRendererComponent() {
  return GridstackRendererComponent
}

export default GridstackRenderer
