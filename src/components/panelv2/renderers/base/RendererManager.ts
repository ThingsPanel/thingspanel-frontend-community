// 渲染器管理器 - 多渲染器统一管理
// Renderer Manager - Unified management for multiple renderers

import type { BaseRenderer, RendererFactory, RendererRegistry } from './interfaces'
import type { BaseItem, RenderMode, RendererEvents } from './types'

/** 渲染器管理器配置 */
export interface RendererManagerConfig {
  /** 默认渲染器类型 */
  defaultRenderer: string
  /** 是否启用渲染器切换 */
  enableSwitching: boolean
  /** 容器元素 */
  container: HTMLElement
  /** 初始化配置 */
  initialConfig?: Record<string, any>
}

/** 渲染器切换选项 */
export interface SwitchRendererOptions {
  /** 是否保留当前数据 */
  preserveData?: boolean
  /** 是否保留选择状态 */
  preserveSelection?: boolean
  /** 自定义配置 */
  config?: Record<string, any>
}

/** 渲染器管理器 - 负责多渲染器的注册、切换和统一管理 */
export class RendererManager implements RendererRegistry {
  private factories: Map<string, RendererFactory> = new Map()
  private currentRenderer: BaseRenderer | null = null
  private currentType: string | null = null
  private container: HTMLElement
  private config: RendererManagerConfig
  private eventCallbacks: Partial<RendererEvents> = {}

  constructor(config: RendererManagerConfig) {
    this.config = config
    this.container = config.container
  }

  // 渲染器注册表接口实现
  register(type: string, factory: RendererFactory): void {
    if (this.factories.has(type)) {
      console.warn(`Renderer type "${type}" is already registered`)
      return
    }

    this.factories.set(type, factory)
    console.log(`Registered renderer type: ${type}`)

    // 如果这是默认渲染器且当前没有激活的渲染器，则自动初始化
    if (type === this.config.defaultRenderer && !this.currentRenderer) {
      this.switchToRenderer(type)
    }
  }

  getFactory(type: string): RendererFactory | undefined {
    return this.factories.get(type)
  }

  createRenderer(type: string, config: any = {}): BaseRenderer | undefined {
    const factory = this.getFactory(type)
    if (!factory) {
      console.error(`Renderer factory not found for type: ${type}`)
      return undefined
    }

    try {
      return factory.create(config)
    } catch (error) {
      console.error(`Failed to create renderer of type ${type}:`, error)
      return undefined
    }
  }

  getTypes(): string[] {
    return Array.from(this.factories.keys())
  }

  // 渲染器管理方法
  getCurrentRenderer(): BaseRenderer | null {
    return this.currentRenderer
  }

  getCurrentType(): string | null {
    return this.currentType
  }

  getAvailableTypes(): { type: string; name: string; description: string }[] {
    return Array.from(this.factories.entries()).map(([type, factory]) => {
      const defaultConfig = factory.getDefaultConfig()
      return {
        type,
        name: defaultConfig?.name || type,
        description: defaultConfig?.description || `${type} renderer`
      }
    })
  }

  isRendererActive(type: string): boolean {
    return this.currentType === type
  }

  canSwitchTo(type: string): boolean {
    return this.factories.has(type) && this.currentType !== type
  }

  // 渲染器切换
  async switchToRenderer(type: string, options: SwitchRendererOptions = {}): Promise<boolean> {
    if (!this.canSwitchTo(type)) {
      console.warn(`Cannot switch to renderer type: ${type}`)
      return false
    }

    try {
      // 保存当前状态
      const currentData = options.preserveData && this.currentRenderer ? this.currentRenderer.exportData() : null

      const currentSelection =
        options.preserveSelection && this.currentRenderer ? this.currentRenderer.getSelectedItems?.() || [] : []

      // 销毁当前渲染器
      if (this.currentRenderer) {
        this.currentRenderer.destroy()
        this.currentRenderer = null
        this.currentType = null
      }

      // 创建新渲染器
      const factory = this.getFactory(type)!
      const rendererConfig = {
        ...factory.getDefaultConfig(),
        ...this.config.initialConfig,
        ...options.config,
        container: this.container
      }

      const newRenderer = factory.create(rendererConfig)
      if (!newRenderer) {
        throw new Error(`Failed to create renderer of type: ${type}`)
      }

      // 设置事件监听
      this.setupRendererEvents(newRenderer)

      // 初始化新渲染器
      newRenderer.init()

      // 恢复数据
      if (currentData && options.preserveData) {
        try {
          newRenderer.importData?.(currentData)
        } catch (error) {
          console.warn('Failed to restore data on renderer switch:', error)
        }
      }

      // 恢复选择状态
      if (currentSelection.length > 0 && options.preserveSelection) {
        try {
          const itemIds = currentSelection.map(item => item.id)
          newRenderer.selectItems?.(itemIds)
        } catch (error) {
          console.warn('Failed to restore selection on renderer switch:', error)
        }
      }

      // 更新状态
      this.currentRenderer = newRenderer
      this.currentType = type

      console.log(`Switched to renderer: ${type}`)
      return true
    } catch (error) {
      console.error(`Failed to switch to renderer ${type}:`, error)
      return false
    }
  }

  // 代理方法 - 将调用转发给当前渲染器
  addItem(item: BaseItem): void {
    this.requireActiveRenderer().addItem(item)
  }

  updateItem(id: string, updates: any): void {
    this.requireActiveRenderer().updateItem(id, updates)
  }

  removeItem(id: string): void {
    this.requireActiveRenderer().removeItem(id)
  }

  getItem(id: string): BaseItem | undefined {
    return this.requireActiveRenderer().getItem(id)
  }

  getAllItems(): BaseItem[] {
    return this.requireActiveRenderer().getAllItems?.() || []
  }

  selectItems(ids: string[]): void {
    this.requireActiveRenderer().selectItems(ids)
  }

  clearSelection(): void {
    this.requireActiveRenderer().clearSelection()
  }

  setMode(mode: RenderMode): void {
    this.requireActiveRenderer().setMode(mode)
  }

  getMode(): RenderMode {
    return this.requireActiveRenderer().getMode?.() || 'edit'
  }

  refresh(): void {
    this.requireActiveRenderer().refresh()
  }

  // 历史操作代理
  undo(): boolean {
    return this.requireActiveRenderer().undo?.() || false
  }

  redo(): boolean {
    return this.requireActiveRenderer().redo?.() || false
  }

  canUndo(): boolean {
    return this.requireActiveRenderer().canUndo?.() || false
  }

  canRedo(): boolean {
    return this.requireActiveRenderer().canRedo?.() || false
  }

  // 导入导出代理
  exportData(): any {
    return this.requireActiveRenderer().exportData?.()
  }

  importData(data: any): void {
    this.requireActiveRenderer().importData?.(data)
  }

  clearAll(): void {
    this.requireActiveRenderer().clearAll?.()
  }

  // 配置管理
  getConfig(): any {
    return this.requireActiveRenderer().getConfig?.()
  }

  updateConfig(config: any): void {
    this.requireActiveRenderer().updateConfig?.(config)
  }

  getConfigForm(): any {
    return this.requireActiveRenderer().getConfigForm?.()
  }

  // 工具管理
  getTools(): any[] {
    return this.requireActiveRenderer().getTools?.() || []
  }

  executeAction(actionId: string, ...args: any[]): any {
    return this.requireActiveRenderer().executeAction?.(actionId, ...args)
  }

  // 事件管理
  on<K extends keyof RendererEvents>(event: K, callback: RendererEvents[K]): void {
    this.eventCallbacks[event] = callback

    // 如果当前有激活的渲染器，立即设置监听
    if (this.currentRenderer) {
      this.currentRenderer.on?.(event, callback)
    }
  }

  private setupRendererEvents(renderer: BaseRenderer): void {
    // 为新渲染器设置所有已注册的事件监听
    Object.entries(this.eventCallbacks).forEach(([event, callback]) => {
      if (callback) {
        renderer.on?.(event as keyof RendererEvents, callback)
      }
    })
  }

  private requireActiveRenderer(): BaseRenderer {
    if (!this.currentRenderer) {
      throw new Error('No active renderer. Please switch to a renderer first.')
    }
    return this.currentRenderer
  }

  // 状态查询
  isInitialized(): boolean {
    return this.currentRenderer?.isInitialized?.() || false
  }

  getItemCount(): number {
    return this.currentRenderer?.getItemCount?.() || 0
  }

  getSelectedCount(): number {
    return this.currentRenderer?.getSelectedCount?.() || 0
  }

  getHistorySize(): number {
    return this.currentRenderer?.getHistorySize?.() || 0
  }

  // 清理
  destroy(): void {
    if (this.currentRenderer) {
      this.currentRenderer.destroy()
      this.currentRenderer = null
      this.currentType = null
    }

    this.factories.clear()
    this.eventCallbacks = {}
    console.log('RendererManager destroyed')
  }
}
