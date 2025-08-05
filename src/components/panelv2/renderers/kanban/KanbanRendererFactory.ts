/**
 * Kanban Renderer Factory
 * 看板渲染器工厂，创建和配置KanbanRenderer实例
 */

import { defineAsyncComponent, type Component } from 'vue'
import type { BaseRenderer, RendererConfig } from '../../types/renderer'
import type { BaseCanvasItem } from '../../types/core'

// KanbanRenderer组件的异步加载
const KanbanRendererComponent = defineAsyncComponent(() => import('./KanbanRenderer.vue'))

/**
 * 看板渲染器包装类
 * 将Vue组件包装为BaseRenderer接口
 */
export class KanbanRenderer implements BaseRenderer {
  readonly id = 'kanban'
  readonly name = 'Kanban Renderer'
  readonly version = '1.0.0'
  readonly capabilities = {
    supportsDrag: true,
    supportsResize: true,
    supportsRotate: false,
    supportsGrouping: false,
    supportsLayers: false,
    supportsSnapping: true,
    supportsPrecisePositioning: false,
    supportsCustomCoordinates: false,
    supportsZoom: false,
    supportsMultiSelect: true,
    supportsKeyboardShortcuts: true,
    supportsContextMenu: true,
    supportsUndo: true,
    supportsClipboard: true
  }

  private component: Component | null = null
  private container: HTMLElement | null = null
  config: RendererConfig = {}
  private items: BaseCanvasItem[] = []
  private eventHandlers: Map<string, ((...args: any[]) => any)[]> = new Map()
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
    this.container = container
    this.config = { ...config }

    // 创建Vue应用实例来渲染KanbanRenderer组件
    const { createApp } = await import('vue')

    const app = createApp(KanbanRendererComponent, {
      config: this.config,
      items: this.items,
      readonly: this.config.readonly || false,
      onReady: () => {
        this.isInitialized = true
        this.emit('ready', undefined)
      },
      onError: (error: Error) => {
        this.emit('error', error)
      },
      onItemAdd: (item: BaseCanvasItem) => {
        this.emit('item:add', item)
      },
      onItemRemove: (ids: string[]) => {
        this.emit('item:remove', ids)
      },
      onItemUpdate: (id: string, updates: Partial<BaseCanvasItem>) => {
        this.emit('item:update', id, updates)
      },
      onLayoutChange: (items: BaseCanvasItem[]) => {
        this.items = items
        this.emit('layout:change', items)
      },
      onItemSelect: (ids: string[]) => {
        this.emit('item:select', ids)
      },
      onViewportChange: (viewport: any) => {
        this.emit('viewport:change', viewport)
      }
    })

    // 挂载到容器
    app.mount(container)
    this.component = app
  }

  async destroy(): Promise<void> {
    if (this.component && this.container) {
      // 卸载Vue应用
      if ('unmount' in this.component) {
        ;(this.component as any).unmount()
      }
      this.component = null
      this.container = null
    }

    this.isInitialized = false
    this.eventHandlers.clear()
  }

  resize(width: number, height: number): void {
    // Kanban layout handles resizing automatically
    if (this.container) {
      this.container.style.width = `${width}px`
      this.container.style.height = `${height}px`
    }
  }

  setData(items: BaseCanvasItem[]): void {
    this.items = [...items]
    // 如果组件已初始化，更新数据
    // 这里需要通过Vue的响应式系统更新，实际实现中可能需要使用props或provide/inject
  }

  getData(): BaseCanvasItem[] {
    return [...this.items]
  }

  addItem(item: BaseCanvasItem): void {
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
    // Vue handles rendering reactively
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
    this.eventHandlers.get(event as string)!.push(handler as (...args: any[]) => any)
  }

  off<K extends keyof import('../types/renderer').RendererEvents>(
    event: K,
    handler: import('../types/renderer').RendererEvents[K]
  ): void {
    const handlers = this.eventHandlers.get(event as string)
    if (handlers) {
      const index = handlers.indexOf(handler as (...args: any[]) => any)
      if (index > -1) {
        handlers.splice(index, 1)
      }
    }
  }

  emit<K extends keyof import('../types/renderer').RendererEvents>(
    event: K,
    ..._args: Parameters<import('../types/renderer').RendererEvents[K]>
  ): void {
    const handlers = this.eventHandlers.get(event as string)
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(..._args)
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
 * 看板渲染器工厂函数
 */
export function createKanbanRenderer(): KanbanRenderer {
  return new KanbanRenderer()
}

/**
 * 获取看板渲染器组件
 */
export function getKanbanRendererComponent(): Component {
  return KanbanRendererComponent
}

export default KanbanRenderer
