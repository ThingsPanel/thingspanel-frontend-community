/**
 * Renderer Manager Implementation
 * 渲染器管理器实现，负责渲染器的生命周期管理和切换
 */

import type { 
  RendererManager as IRendererManager,
  BaseRenderer,
  RendererInfo,
  RendererConfig,
  RendererEvents
} from '../types/renderer'
import type { BaseCanvasItem } from '../types/core'
import type { EventBus } from '../types/events'
import { RendererFactory } from './RendererFactory'

export class RendererManager implements IRendererManager {
  private currentRenderer: BaseRenderer | null = null
  private factory: RendererFactory
  private eventBus: EventBus
  private container: HTMLElement | null = null
  private isInitialized = false

  constructor(eventBus: EventBus, factory?: RendererFactory) {
    this.eventBus = eventBus
    this.factory = factory || new RendererFactory()
    this.setupEventListeners()
  }

  /**
   * 获取当前渲染器
   */
  getCurrentRenderer(): BaseRenderer | null {
    return this.currentRenderer
  }

  /**
   * 设置当前渲染器
   */
  setCurrentRenderer(renderer: BaseRenderer): void {
    if (this.currentRenderer === renderer) {
      console.warn('Trying to set the same renderer as current')
      return
    }

    this.currentRenderer = renderer
    this.setupRendererEventForwarding(renderer)
    
    // 发射渲染器切换事件
    this.eventBus.emit('renderer:ready', { rendererId: renderer.id })
  }

  /**
   * 切换渲染器
   */
  async switchRenderer(id: string, config?: RendererConfig): Promise<void> {
    try {
      console.log(`Switching to renderer: ${id}`)
      
      // 保存当前数据
      const currentData = this.currentRenderer?.getData() || []
      const fromId = this.currentRenderer?.id || 'none'
      
      // 销毁当前渲染器
      if (this.currentRenderer) {
        await this.destroyCurrentRenderer()
      }
      
      // 创建新渲染器
      const newRenderer = this.factory.create(id, config)
      
      // 初始化新渲染器
      if (this.container) {
        await newRenderer.initialize(this.container, config || {})
      }
      
      // 设置为当前渲染器
      this.setCurrentRenderer(newRenderer)
      
      // 恢复数据到新渲染器
      if (currentData.length > 0) {
        newRenderer.setData(currentData)
      }
      
      // 渲染
      newRenderer.render()
      
      // 发射切换完成事件
      this.eventBus.emit('renderer:switch', {
        fromId,
        toId: id,
        config
      })
      
      console.log(`Successfully switched to renderer: ${id}`)
      
    } catch (error) {
      const errorMsg = `Failed to switch to renderer ${id}: ${error}`
      console.error(errorMsg)
      
      // 发射错误事件
      this.eventBus.emit('renderer:error', {
        rendererId: id,
        error: error as Error
      })
      
      throw new Error(errorMsg)
    }
  }

  /**
   * 获取渲染器工厂
   */
  getFactory(): RendererFactory {
    return this.factory
  }

  /**
   * 获取可用渲染器列表
   */
  getAvailableRenderers(): RendererInfo[] {
    return this.factory.getAvailable()
  }

  /**
   * 事件监听代理
   */
  on<K extends keyof RendererEvents>(event: K, handler: RendererEvents[K]): void {
    if (this.currentRenderer) {
      this.currentRenderer.on(event, handler)
    } else {
      console.warn(`No active renderer to attach event listener for: ${String(event)}`)
    }
  }

  /**
   * 取消事件监听代理
   */
  off<K extends keyof RendererEvents>(event: K, handler: RendererEvents[K]): void {
    if (this.currentRenderer) {
      this.currentRenderer.off(event, handler)
    }
  }

  /**
   * 初始化管理器
   */
  async initialize(container: HTMLElement): Promise<void> {
    if (this.isInitialized) {
      console.warn('RendererManager is already initialized')
      return
    }

    this.container = container
    this.isInitialized = true
    
    console.log('RendererManager initialized successfully')
  }

  /**
   * 销毁管理器
   */
  async destroy(): Promise<void> {
    if (!this.isInitialized) {
      return
    }

    // 销毁当前渲染器
    if (this.currentRenderer) {
      await this.destroyCurrentRenderer()
    }
    
    // 清理资源
    this.container = null
    this.isInitialized = false
    
    console.log('RendererManager destroyed successfully')
  }

  /**
   * 获取当前渲染器数据
   */
  getCurrentData(): BaseCanvasItem[] {
    return this.currentRenderer?.getData() || []
  }

  /**
   * 设置当前渲染器数据
   */
  setCurrentData(items: BaseCanvasItem[]): void {
    if (this.currentRenderer) {
      this.currentRenderer.setData(items)
    } else {
      console.warn('No active renderer to set data')
    }
  }

  /**
   * 渲染当前内容
   */
  render(): void {
    if (this.currentRenderer) {
      this.currentRenderer.render()
    } else {
      console.warn('No active renderer to render')
    }
  }

  /**
   * 调整当前渲染器大小
   */
  resize(width: number, height: number): void {
    if (this.currentRenderer) {
      this.currentRenderer.resize(width, height)
    }
  }

  /**
   * 启用/禁用编辑模式
   */
  setEditMode(enabled: boolean): void {
    if (this.currentRenderer) {
      if (enabled) {
        this.currentRenderer.enableEdit()
      } else {
        this.currentRenderer.disableEdit()
      }
    }
  }

  /**
   * 获取当前渲染器状态
   */
  getCurrentRendererState() {
    if (!this.currentRenderer) {
      return null
    }

    return {
      id: this.currentRenderer.id,
      name: this.currentRenderer.name,
      version: this.currentRenderer.version,
      capabilities: this.currentRenderer.capabilities,
      state: this.currentRenderer.state,
      config: this.currentRenderer.config
    }
  }

  /**
   * 更新当前渲染器配置
   */
  updateCurrentConfig(config: Partial<RendererConfig>): void {
    if (this.currentRenderer) {
      this.currentRenderer.updateConfig(config)
      
      // 发射配置更新事件
      this.eventBus.emit('renderer:config-update', {
        rendererId: this.currentRenderer.id,
        config
      })
    } else {
      console.warn('No active renderer to update config')
    }
  }

  /**
   * 检查渲染器是否支持某个功能
   */
  supportsCapability(capability: keyof typeof this.currentRenderer.capabilities): boolean {
    if (!this.currentRenderer) {
      return false
    }
    
    return this.currentRenderer.capabilities[capability] || false
  }

  /**
   * 销毁当前渲染器
   */
  private async destroyCurrentRenderer(): Promise<void> {
    if (!this.currentRenderer) {
      return
    }

    try {
      // 清理事件监听器
      this.cleanupRendererEventForwarding(this.currentRenderer)
      
      // 销毁渲染器
      await this.currentRenderer.destroy()
      
      console.log(`Renderer ${this.currentRenderer.id} destroyed successfully`)
      
    } catch (error) {
      console.error(`Error destroying renderer ${this.currentRenderer.id}:`, error)
    } finally {
      this.currentRenderer = null
    }
  }

  /**
   * 设置渲染器事件转发
   */
  private setupRendererEventForwarding(renderer: BaseRenderer): void {
    // 转发渲染器事件到全局事件总线
    const eventMappings: Array<{
      rendererEvent: keyof RendererEvents,
      globalEvent: string
    }> = [
      { rendererEvent: 'item:add', globalEvent: 'canvas:item-add' },
      { rendererEvent: 'item:remove', globalEvent: 'canvas:item-remove' },
      { rendererEvent: 'item:update', globalEvent: 'canvas:item-update' },
      { rendererEvent: 'item:select', globalEvent: 'canvas:item-select' },
      { rendererEvent: 'layout:change', globalEvent: 'canvas:layout-change' },
      { rendererEvent: 'viewport:change', globalEvent: 'viewport:change' },
      { rendererEvent: 'selection:change', globalEvent: 'canvas:selection-change' },
      { rendererEvent: 'error', globalEvent: 'error:occurred' }
    ]

    eventMappings.forEach(({ rendererEvent, globalEvent }) => {
      renderer.on(rendererEvent, (data: any) => {
        this.eventBus.emit(globalEvent as any, data)
      })
    })
  }

  /**
   * 清理渲染器事件转发
   */
  private cleanupRendererEventForwarding(renderer: BaseRenderer): void {
    // 这里可以实现更精确的事件清理
    // 由于渲染器即将被销毁，其事件监听器也会被清理
    console.log(`Cleaning up event forwarding for renderer: ${renderer.id}`)
  }

  /**
   * 设置全局事件监听器
   */
  private setupEventListeners(): void {
    // 监听面板模式变化
    this.eventBus.on('panel:mode-change', ({ mode }) => {
      this.setEditMode(mode === 'edit')
    })

    // 监听配置更新
    this.eventBus.on('panel:config-update', ({ config }) => {
      if (config && this.currentRenderer) {
        // 过滤出渲染器相关的配置
        const rendererConfig: Partial<RendererConfig> = {}
        
        if ('showGrid' in config) rendererConfig.showGrid = config.showGrid
        if ('gridSize' in config) rendererConfig.gridSize = config.gridSize
        if ('snapToGrid' in config) rendererConfig.snapToGrid = config.snapToGrid
        if ('backgroundColor' in config) rendererConfig.backgroundColor = config.backgroundColor
        
        this.updateCurrentConfig(rendererConfig)
      }
    })

    // 监听渲染器切换请求
    this.eventBus.on('toolbar:renderer-switch', ({ rendererId }) => {
      this.switchRenderer(rendererId).catch(error => {
        console.error('Failed to switch renderer from toolbar:', error)
      })
    })
  }
}

export default RendererManager