/**
 * Renderer Registry
 * 渲染器注册中心，管理所有可用的渲染器
 */

import type { BaseRenderer, RendererInfo } from '../../types/renderer'

export interface RegisteredRenderer {
  id: string
  name: string
  factory: () => BaseRenderer
  info: RendererInfo
  enabled: boolean
  category: 'layout' | 'visualization' | 'custom'
}

/**
 * 渲染器注册中心类
 */
export class RendererRegistry {
  private renderers = new Map<string, RegisteredRenderer>()

  /**
   * 注册渲染器
   */
  register(renderer: RegisteredRenderer): void {
    if (this.renderers.has(renderer.id)) {
      console.warn(`Renderer with id "${renderer.id}" already exists. Overriding.`)
    }
    this.renderers.set(renderer.id, renderer)
  }

  /**
   * 注销渲染器
   */
  unregister(id: string): boolean {
    return this.renderers.delete(id)
  }

  /**
   * 获取渲染器
   */
  get(id: string): RegisteredRenderer | undefined {
    return this.renderers.get(id)
  }

  /**
   * 获取所有渲染器
   */
  getAll(): RegisteredRenderer[] {
    return Array.from(this.renderers.values())
  }

  /**
   * 获取启用的渲染器
   */
  getEnabled(): RegisteredRenderer[] {
    return this.getAll().filter(r => r.enabled)
  }

  /**
   * 按分类获取渲染器
   */
  getByCategory(category: RegisteredRenderer['category']): RegisteredRenderer[] {
    return this.getAll().filter(r => r.category === category)
  }

  /**
   * 检查渲染器是否存在
   */
  has(id: string): boolean {
    return this.renderers.has(id)
  }

  /**
   * 启用/禁用渲染器
   */
  setEnabled(id: string, enabled: boolean): boolean {
    const renderer = this.renderers.get(id)
    if (renderer) {
      renderer.enabled = enabled
      return true
    }
    return false
  }

  /**
   * 创建渲染器实例
   */
  createRenderer(id: string): BaseRenderer | null {
    const renderer = this.renderers.get(id)
    if (renderer && renderer.enabled) {
      try {
        return renderer.factory()
      } catch (error) {
        console.error(`Failed to create renderer "${id}":`, error)
        return null
      }
    }
    return null
  }

  /**
   * 清空所有渲染器
   */
  clear(): void {
    this.renderers.clear()
  }
}

// 默认实例
export const rendererRegistry = new RendererRegistry()

export default rendererRegistry
