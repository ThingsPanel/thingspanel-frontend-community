/**
 * Renderer Factory Implementation
 * 渲染器工厂实现，负责渲染器的注册、创建和管理
 */

import type {
  RendererFactory as IRendererFactory,
  BaseRenderer,
  RendererInfo,
  RendererConfig,
  RendererConstructor,
  RendererRegistry
} from '../types/renderer'

export class RendererFactory implements IRendererFactory {
  private registry: RendererRegistry = new Map()

  /**
   * 注册渲染器
   */
  register(id: string, RendererClass: RendererConstructor): void {
    if (this.registry.has(id)) {
      console.warn(`Renderer ${id} is already registered, overriding...`)
    }

    this.registry.set(id, RendererClass)
    console.log(`Renderer ${id} registered successfully`)
  }

  /**
   * 注销渲染器
   */
  unregister(id: string): void {
    if (this.registry.has(id)) {
      this.registry.delete(id)
      console.log(`Renderer ${id} unregistered successfully`)
    } else {
      console.warn(`Renderer ${id} is not registered`)
    }
  }

  /**
   * 创建渲染器实例
   */
  create(id: string, config?: RendererConfig): BaseRenderer {
    const RendererClass = this.registry.get(id)

    if (!RendererClass) {
      throw new Error(`Renderer ${id} is not registered`)
    }

    try {
      const renderer = new RendererClass()

      // 验证渲染器实例
      this.validateRenderer(renderer, id)

      return renderer
    } catch (error) {
      throw new Error(`Failed to create renderer ${id}: ${error}`)
    }
  }

  /**
   * 获取可用渲染器列表
   */
  getAvailable(): RendererInfo[] {
    console.log(`[RendererFactory] getAvailable called, registry size: ${this.registry.size}`)
    console.log(`[RendererFactory] registered renderer IDs:`, Array.from(this.registry.keys()))

    const availableRenderers: RendererInfo[] = []

    // 直接从注册表生成渲染器信息，避免循环依赖
    this.registry.forEach((RendererClass, id) => {
      try {
        // 尝试从渲染器类的静态属性获取信息
        const info: RendererInfo = {
          id,
          name: this.getRendererName(id),
          version: '1.0.0',
          description: this.getRendererDescription(id),
          icon: this.getRendererIcon(id),
          author: this.getRendererAuthor(id),
          capabilities: {
            supportsDragDrop: true,
            supportsResize: true,
            supportsEdit: true,
            supportsExport: false
          }
        }
        availableRenderers.push(info)
      } catch (error) {
        console.warn(`[RendererFactory] Failed to generate info for renderer ${id}:`, error)
      }
    })

    console.log(`[RendererFactory] generated available renderers:`, availableRenderers)

    return availableRenderers
  }

  /**
   * 检查渲染器是否存在
   */
  hasRenderer(id: string): boolean {
    return this.registry.has(id)
  }

  /**
   * 检查渲染器是否已注册（别名方法）
   */
  isRegistered(id: string): boolean {
    return this.registry.has(id)
  }

  /**
   * 获取注册的渲染器数量
   */
  getCount(): number {
    return this.registry.size
  }

  /**
   * 获取所有注册的渲染器ID
   */
  getRegisteredIds(): string[] {
    return Array.from(this.registry.keys())
  }

  /**
   * 批量注册渲染器
   */
  registerBatch(renderers: Array<{ id: string; RendererClass: RendererConstructor }>): void {
    renderers.forEach(({ id, RendererClass }) => {
      this.register(id, RendererClass)
    })
  }

  /**
   * 清空所有注册的渲染器
   */
  clear(): void {
    this.registry.clear()
    console.log('All renderers have been unregistered')
  }

  /**
   * 验证渲染器实例
   */
  private validateRenderer(renderer: any, id: string): void {
    const requiredProperties = ['id', 'name', 'version', 'capabilities']
    const requiredMethods = ['initialize', 'destroy', 'resize', 'setData', 'getData', 'render', 'on', 'off', 'emit']

    // 验证必需属性
    requiredProperties.forEach(prop => {
      if (!(prop in renderer)) {
        throw new Error(`Renderer ${id} is missing required property: ${prop}`)
      }
    })

    // 验证必需方法
    requiredMethods.forEach(method => {
      if (typeof renderer[method] !== 'function') {
        throw new Error(`Renderer ${id} is missing required method: ${method}`)
      }
    })

    // 验证ID匹配
    if (renderer.id !== id) {
      console.warn(`Renderer ID mismatch: registered as ${id}, but renderer.id is ${renderer.id}`)
    }

    // 验证能力声明
    if (!renderer.capabilities || typeof renderer.capabilities !== 'object') {
      throw new Error(`Renderer ${id} has invalid capabilities declaration`)
    }
  }

  /**
   * 获取渲染器名称
   */
  private getRendererName(id: string): string {
    const names: Record<string, string> = {
      kanban: '看板',
      visualization: '可视化',
      gridstack: '网格布局'
    }
    return names[id] || id
  }

  /**
   * 获取渲染器描述
   */
  private getRendererDescription(id: string): string {
    const descriptions: Record<string, string> = {
      grid: '基于网格布局的渲染器，支持拖拽和自动排列',
      canvas: '自由画布渲染器，支持精确定位和高级交互',
      flex: '弹性布局渲染器，支持响应式布局',
      absolute: '绝对定位渲染器，支持像素级精确控制'
    }

    return descriptions[id] || `${id} renderer`
  }

  /**
   * 获取渲染器图标
   */
  private getRendererIcon(id: string): string {
    const icons: Record<string, string> = {
      grid: 'i-carbon-grid',
      canvas: 'i-carbon-canvas',
      flex: 'i-carbon-align-horizontal-left',
      absolute: 'i-carbon-move'
    }

    return icons[id] || 'i-carbon-application'
  }

  /**
   * 获取渲染器作者
   */
  private getRendererAuthor(id: string): string {
    const authors: Record<string, string> = {
      grid: 'PanelV2 Team',
      canvas: 'PanelV2 Team',
      flex: 'PanelV2 Team',
      absolute: 'PanelV2 Team'
    }

    return authors[id] || 'Unknown'
  }
}

// 默认工厂实例
export const rendererFactory = new RendererFactory()

export default rendererFactory
