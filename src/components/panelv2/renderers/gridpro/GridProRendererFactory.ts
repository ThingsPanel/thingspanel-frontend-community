/**
 * GridPro 渲染器工厂
 * 负责创建和配置 GridPro 渲染器实例
 */

import type { App } from 'vue'
import type { BaseRenderer, RendererFactory, RendererConfig } from '../../types/core'
import type { GridProConfig } from './types/gridpro'
import { createDefaultGridProConfig } from './types/gridpro'
import GridProRenderer from './GridProRenderer.vue'

export interface GridProRendererConfig extends RendererConfig {
  type: 'gridpro'
  gridpro?: Partial<GridProConfig>
}

/**
 * GridPro 渲染器实现
 */
export class GridProRendererImpl implements BaseRenderer {
  // 基础属性
  readonly id = 'gridpro'
  readonly name = 'GridPro 渲染器'
  readonly version = '1.0.0'
  readonly capabilities = {
    supportsDrag: true,
    supportsResize: true,
    supportsRotate: false,
    supportsGrouping: false,
    supportsLayers: false,
    supportsSnapping: true,
    supportsPrecisePositioning: true,
    supportsCustomCoordinates: false,
    supportsZoom: false,
    supportsMultiSelect: true,
    supportsKeyboardShortcuts: true,
    supportsContextMenu: true,
    supportsUndo: false,
    supportsClipboard: false
  }

  // 状态属性
  readonly state = {
    isInitialized: false,
    isReady: false,
    isDestroyed: false,
    hasError: false,
    errorMessage: null,
    itemCount: 0,
    selectedCount: 0
  }

  readonly config: any = {}

  // 私有属性
  private gridProConfig: GridProConfig
  private container: HTMLElement | null = null
  private items: BaseCanvasItem[] = []
  private selectedItems: string[] = []
  private eventHandlers = new Map()

  constructor(config: Partial<GridProConfig> = {}) {
    this.gridProConfig = {
      ...createDefaultGridProConfig(),
      ...config
    }
  }

  // 生命周期方法
  async initialize(container: HTMLElement, config: any): Promise<void> {
    this.container = container
    ;(this.state as any).isInitialized = true
    ;(this.state as any).isReady = true
  }

  async destroy(): Promise<void> {
    this.container = null
    this.items = []
    this.selectedItems = []
    this.eventHandlers.clear()
    ;(this.state as any).isDestroyed = true
  }

  resize(width: number, height: number): void {
    // GridPro 渲染器会自动适应容器大小
  }

  // 数据管理
  setData(items: BaseCanvasItem[]): void {
    this.items = [...items]
    ;(this.state as any).itemCount = items.length
  }

  getData(): BaseCanvasItem[] {
    return [...this.items]
  }

  addItem(item: BaseCanvasItem): void {
    this.items.push(item)
    ;(this.state as any).itemCount = this.items.length
  }

  removeItem(id: string): void {
    this.items = this.items.filter(item => item.id !== id)
    this.selectedItems = this.selectedItems.filter(itemId => itemId !== id)
    ;(this.state as any).itemCount = this.items.length
    ;(this.state as any).selectedCount = this.selectedItems.length
  }

  updateItem(id: string, updates: Partial<BaseCanvasItem>): void {
    const index = this.items.findIndex(item => item.id === id)
    if (index !== -1) {
      this.items[index] = { ...this.items[index], ...updates }
    }
  }

  // 渲染控制
  render(): void {
    // 由 Vue 组件处理渲染
  }

  refresh(): void {
    this.render()
  }

  clear(): void {
    this.items = []
    this.selectedItems = []
    ;(this.state as any).itemCount = 0
    ;(this.state as any).selectedCount = 0
  }

  // 视图操作
  setViewport(viewport: any): void {
    // GridPro 使用固定视口
  }

  getViewport(): any {
    return {
      x: 0,
      y: 0,
      width: this.container?.clientWidth || 800,
      height: this.container?.clientHeight || 600,
      zoom: 1
    }
  }

  fitToContent(): void {
    // 自动适应内容
  }

  centerView(): void {
    // 居中视图
  }

  // 交互控制
  enableEdit(): void {
    // 启用编辑模式
  }

  disableEdit(): void {
    // 禁用编辑模式
  }

  setReadonly(readonly: boolean): void {
    // 设置只读模式
  }

  // 选择操作
  selectItems(ids: string[]): void {
    this.selectedItems = [...ids]
    ;(this.state as any).selectedCount = ids.length
  }

  clearSelection(): void {
    this.selectedItems = []
    ;(this.state as any).selectedCount = 0
  }

  getSelection(): string[] {
    return [...this.selectedItems]
  }

  // 事件系统
  on(event: string, handler: Function): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, [])
    }
    this.eventHandlers.get(event).push(handler)
  }

  off(event: string, handler: Function): void {
    const handlers = this.eventHandlers.get(event)
    if (handlers) {
      const index = handlers.indexOf(handler)
      if (index !== -1) {
        handlers.splice(index, 1)
      }
    }
  }

  emit(event: string, ...args: any[]): void {
    const handlers = this.eventHandlers.get(event)
    if (handlers) {
      handlers.forEach((handler: Function) => handler(...args))
    }
  }

  /**
   * 获取渲染器配置
   */
  getGridProConfig(): GridProConfig {
    return { ...this.gridProConfig }
  }

  /**
   * 更新渲染器配置
   */
  updateGridProConfig(config: Partial<GridProConfig>): void {
    this.gridProConfig = {
      ...this.gridProConfig,
      ...config
    }
  }

  /**
   * 验证配置
   */
  validateConfig(config: Partial<GridProConfig>): boolean {
    try {
      // 验证必要字段
      if (config.columns !== undefined && (config.columns < 1 || config.columns > 24)) {
        console.warn('GridPro: columns should be between 1 and 24')
        return false
      }

      if (config.rowHeight !== undefined && config.rowHeight < 10) {
        console.warn('GridPro: rowHeight should be at least 10px')
        return false
      }

      if (config.gap !== undefined && config.gap < 0) {
        console.warn('GridPro: gap should be non-negative')
        return false
      }

      if (config.margin !== undefined) {
        if (!Array.isArray(config.margin) || config.margin.length !== 2) {
          console.warn('GridPro: margin should be [x, y] array')
          return false
        }
        if (config.margin.some(m => m < 0)) {
          console.warn('GridPro: margin values should be non-negative')
          return false
        }
      }

      if (config.maxRows !== undefined && config.maxRows < 1) {
        console.warn('GridPro: maxRows should be at least 1')
        return false
      }

      return true
    } catch (error) {
      console.error('GridPro: Config validation error:', error)
      return false
    }
  }

  /**
   * 获取默认配置
   */
  getDefaultConfig(): GridProConfig {
    return createDefaultGridProConfig()
  }

  /**
   * 获取配置模式预设
   */
  getConfigPresets(): Record<string, Partial<GridProConfig>> {
    return {
      compact: {
        layoutMode: 'compact',
        gap: 4,
        margin: [8, 8],
        enableTransitions: true,
        animationSpeed: 'fast'
      },
      relaxed: {
        layoutMode: 'relaxed',
        gap: 16,
        margin: [16, 16],
        enableTransitions: true,
        animationSpeed: 'normal'
      },
      performance: {
        layoutMode: 'free',
        virtualization: true,
        enableTransitions: false,
        batchUpdates: true,
        gap: 8,
        margin: [12, 12]
      },
      mobile: {
        columns: 2,
        rowHeight: 120,
        gap: 8,
        margin: [8, 8],
        layoutMode: 'compact',
        enableTransitions: true,
        virtualization: true
      },
      desktop: {
        columns: 12,
        rowHeight: 60,
        gap: 12,
        margin: [16, 16],
        layoutMode: 'relaxed',
        enableTransitions: true,
        virtualization: false
      }
    }
  }

  /**
   * 获取性能建议
   */
  getPerformanceRecommendations(itemCount: number): Partial<GridProConfig> {
    const recommendations: Partial<GridProConfig> = {}

    // 基于项目数量的性能优化建议
    if (itemCount > 100) {
      recommendations.virtualization = true
      recommendations.batchUpdates = true
      recommendations.enableTransitions = false
    } else if (itemCount > 50) {
      recommendations.virtualization = true
      recommendations.animationSpeed = 'fast'
    }

    // 基于设备性能的建议
    if (typeof navigator !== 'undefined') {
      // @ts-ignore
      const hardwareConcurrency = navigator.hardwareConcurrency || 4
      // @ts-ignore
      const deviceMemory = navigator.deviceMemory || 4

      if (hardwareConcurrency <= 2 || deviceMemory <= 2) {
        recommendations.virtualization = true
        recommendations.enableTransitions = false
        recommendations.batchUpdates = true
      }
    }

    return recommendations
  }

  /**
   * 获取渲染器元数据
   */
  getMetadata() {
    return {
      type: this.type,
      name: this.name,
      description: this.description,
      version: this.version,
      features: [
        'drag-drop',
        'resize',
        'virtualization',
        'animation',
        'gesture-support',
        'multi-select',
        'keyboard-shortcuts',
        'responsive',
        'performance-monitoring'
      ],
      supportedFormats: [
        'BaseCanvasItem'
      ],
      configSchema: {
        type: 'object',
        properties: {
          columns: { type: 'number', minimum: 1, maximum: 24, default: 12 },
          rowHeight: { type: 'number', minimum: 10, default: 60 },
          gap: { type: 'number', minimum: 0, default: 12 },
          margin: { 
            type: 'array', 
            items: { type: 'number', minimum: 0 },
            minItems: 2,
            maxItems: 2,
            default: [16, 16]
          },
          maxRows: { type: 'number', minimum: 1, default: 100 },
          layoutMode: { 
            type: 'string', 
            enum: ['compact', 'relaxed', 'free'],
            default: 'relaxed'
          },
          enableDrag: { type: 'boolean', default: true },
          enableResize: { type: 'boolean', default: true },
          enableTransitions: { type: 'boolean', default: true },
          animationSpeed: {
            type: 'string',
            enum: ['slow', 'normal', 'fast'],
            default: 'normal'
          },
          virtualization: { type: 'boolean', default: false },
          preventCollision: { type: 'boolean', default: true },
          showGrid: { type: 'boolean', default: false },
          debug: { type: 'boolean', default: false }
        }
      }
    }
  }

  /**
   * 初始化渲染器
   */
  initialize(): Promise<void> {
    return Promise.resolve()
  }

  /**
   * 销毁渲染器
   */
  destroy(): void {
    // 清理资源
  }
}

/**
 * GridPro 渲染器工厂
 */
export class GridProRendererFactory implements RendererFactory {
  readonly type = 'gridpro'
  readonly name = 'GridPro 渲染器工厂'
  readonly version = '1.0.0'

  /**
   * 创建渲染器实例
   */
  create(config?: GridProRendererConfig): GridProRendererImpl {
    const gridProConfig = config?.gridpro || {}
    return new GridProRendererImpl(gridProConfig)
  }

  /**
   * 验证配置
   */
  validateConfig(config: GridProRendererConfig): boolean {
    if (config.type !== 'gridpro') {
      console.warn('GridProFactory: Invalid renderer type')
      return false
    }

    if (config.gridpro) {
      const renderer = new GridProRendererImpl()
      return renderer.validateConfig(config.gridpro)
    }

    return true
  }

  /**
   * 获取默认配置
   */
  getDefaultConfig(): GridProRendererConfig {
    return {
      type: 'gridpro',
      gridpro: createDefaultGridProConfig()
    }
  }

  /**
   * 获取工厂元数据
   */
  getMetadata() {
    return {
      type: this.type,
      name: this.name,
      version: this.version,
      rendererType: 'gridpro',
      description: '创建 GridPro 渲染器实例的工厂类',
      capabilities: [
        'responsive-layout',
        'high-performance',
        'virtualization',
        'touch-support',
        'accessibility'
      ]
    }
  }

  /**
   * 注册到 Vue 应用
   */
  install(app: App): void {
    // 注册全局组件
    app.component('GridProRenderer', GridProRenderer)
    
    // 提供工厂实例
    app.provide('gridpro-factory', this)
  }

  /**
   * 检查浏览器兼容性
   */
  checkCompatibility(): { compatible: boolean; issues: string[] } {
    const issues: string[] = []

    // 检查必要的 Web API
    if (typeof PointerEvent === 'undefined') {
      issues.push('Pointer Events API not supported')
    }

    if (typeof ResizeObserver === 'undefined') {
      issues.push('ResizeObserver API not supported')
    }

    if (typeof IntersectionObserver === 'undefined') {
      issues.push('IntersectionObserver API not supported')
    }

    if (typeof requestAnimationFrame === 'undefined') {
      issues.push('RequestAnimationFrame not supported')
    }

    // 检查 CSS 特性
    if (typeof CSS === 'undefined' || !CSS.supports('transform', 'translateZ(0)')) {
      issues.push('CSS transforms not fully supported')
    }

    if (typeof CSS !== 'undefined' && !CSS.supports('display', 'grid')) {
      issues.push('CSS Grid not supported')
    }

    return {
      compatible: issues.length === 0,
      issues
    }
  }

  /**
   * 获取性能基准
   */
  getPerformanceBenchmarks() {
    return {
      maxRecommendedItems: {
        mobile: 50,
        tablet: 100,
        desktop: 200
      },
      virtualizationThreshold: 100,
      animationThreshold: 50,
      memoryUsageTarget: '< 50MB',
      renderTimeTarget: '< 16ms (60fps)'
    }
  }
}

// 创建工厂实例
export const gridProRendererFactory = new GridProRendererFactory()

// 默认导出
export default GridProRendererFactory