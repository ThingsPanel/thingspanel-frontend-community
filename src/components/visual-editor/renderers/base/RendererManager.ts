/**
 * 渲染器管理器
 * 统一管理所有渲染器的注册、创建和切换
 */

import type { BaseRenderer, RendererFactory, RendererContext, RendererConfig } from '@/components/visual-editor/renderers/base/BaseRenderer'

// 渲染器注册信息
interface RendererRegistration {
  factory: RendererFactory
  type: string
  name: string
  description?: string
  icon?: string
  supported: boolean
}

// 渲染器管理器类
export class RendererManager {
  private static instance: RendererManager
  private registrations = new Map<string, RendererRegistration>()
  private activeRenderers = new Map<string, BaseRenderer>()

  private constructor() {}

  // 单例模式
  static getInstance(): RendererManager {
    if (!RendererManager.instance) {
      RendererManager.instance = new RendererManager()
    }
    return RendererManager.instance
  }

  // 注册渲染器
  register(
    type: string,
    factory: RendererFactory,
    options: {
      name: string
      description?: string
      icon?: string
    }
  ): void {
    if (this.registrations.has(type)) {
    }

    const registration: RendererRegistration = {
      factory,
      type,
      name: options.name,
      description: options.description,
      icon: options.icon,
      supported: factory.isSupported()
    }

    this.registrations.set(type, registration)
  }

  // 取消注册渲染器
  unregister(type: string): boolean {
    const removed = this.registrations.delete(type)
    return removed
  }

  // 获取已注册的渲染器列表
  getRegistrations(): RendererRegistration[] {
    return Array.from(this.registrations.values())
  }

  // 获取支持的渲染器列表
  getSupportedRenderers(): RendererRegistration[] {
    return this.getRegistrations().filter(reg => reg.supported)
  }

  // 检查渲染器是否已注册
  isRegistered(type: string): boolean {
    return this.registrations.has(type)
  }

  // 检查渲染器是否支持
  isSupported(type: string): boolean {
    const registration = this.registrations.get(type)
    return registration ? registration.supported : false
  }

  // 创建渲染器实例
  async createRenderer(type: string, context: RendererContext, config: RendererConfig = {}): Promise<BaseRenderer> {
    const registration = this.registrations.get(type)
    if (!registration) {
      throw new Error(`Renderer type '${type}' is not registered`)
    }

    if (!registration.supported) {
      throw new Error(`Renderer type '${type}' is not supported in current environment`)
    }

    try {
      const renderer = registration.factory.create(context, config)
      await renderer.init()

      // 缓存活跃的渲染器
      const instanceKey = `${type}_${Date.now()}`
      this.activeRenderers.set(instanceKey, renderer)

      // 监听渲染器销毁事件，清理缓存
      renderer.on('state-change', state => {
        if (state === 'destroyed') {
          this.activeRenderers.delete(instanceKey)
        }
      })

      if (process.env.NODE_ENV === 'development') {
      }
      return renderer
    } catch (error) {
      console.error(`[RendererManager] Failed to create renderer '${type}':`, error)
      throw error
    }
  }

  // 获取活跃的渲染器数量
  getActiveRendererCount(): number {
    return this.activeRenderers.size
  }

  // 获取特定类型的活跃渲染器
  getActiveRenderers(type?: string): BaseRenderer[] {
    if (!type) {
      return Array.from(this.activeRenderers.values())
    }

    return Array.from(this.activeRenderers.values()).filter(renderer => {
      const registration = Array.from(this.registrations.values()).find(reg => reg.factory === renderer.constructor)
      return registration?.type === type
    })
  }

  // 销毁所有活跃的渲染器
  async destroyAllRenderers(): Promise<void> {
    const renderers = Array.from(this.activeRenderers.values())
    const destroyPromises = renderers.map(renderer => renderer.destroy())

    try {
      await Promise.all(destroyPromises)
      this.activeRenderers.clear()
      if (process.env.NODE_ENV === 'development') {
      }
    } catch (error) {
      console.error('[RendererManager] Error destroying renderers:', error)
      throw error
    }
  }

  // 获取渲染器选项（用于 UI 选择器）
  getRendererOptions(): Array<{
    value: string
    label: string
    description?: string
    icon?: string
    supported: boolean
  }> {
    return this.getRegistrations().map(reg => ({
      value: reg.type,
      label: reg.name,
      description: reg.description,
      icon: reg.icon,
      supported: reg.supported
    }))
  }

  // 获取支持的渲染器选项
  getSupportedRendererOptions(): Array<{
    value: string
    label: string
    description?: string
    icon?: string
  }> {
    return this.getSupportedRenderers().map(reg => ({
      value: reg.type,
      label: reg.name,
      description: reg.description,
      icon: reg.icon
    }))
  }

  // 验证渲染器切换
  canSwitchTo(fromType: string, toType: string): boolean {
    // 检查目标渲染器是否支持
    if (!this.isSupported(toType)) {
      return false
    }

    // 这里可以添加更复杂的切换规则
    // 例如：某些渲染器之间不能直接切换

    return true
  }

  // 预加载渲染器（用于性能优化）
  async preloadRenderer(type: string): Promise<void> {
    const registration = this.registrations.get(type)
    if (!registration || !registration.supported) {
      console.error(`[RendererManager] Cannot preload unsupported renderer: ${type}`)
      return
    }

    try {
      // 这里可以实现预加载逻辑
      // 例如：预加载渲染器的依赖资源
      if (process.env.NODE_ENV === 'development') {
      }
    } catch (error) {
      console.error(`[RendererManager] Failed to preload renderer '${type}':`, error)
    }
  }

  // 获取渲染器性能统计
  getPerformanceStats(): {
    totalRegistered: number
    totalSupported: number
    totalActive: number
    registrations: Array<{
      type: string
      name: string
      supported: boolean
      activeInstances: number
    }>
  } {
    const registrations = this.getRegistrations()

    return {
      totalRegistered: registrations.length,
      totalSupported: registrations.filter(reg => reg.supported).length,
      totalActive: this.activeRenderers.size,
      registrations: registrations.map(reg => ({
        type: reg.type,
        name: reg.name,
        supported: reg.supported,
        activeInstances: this.getActiveRenderers(reg.type).length
      }))
    }
  }

  // 清理资源
  dispose(): void {
    this.destroyAllRenderers().catch(console.error)
    this.registrations.clear()
    if (process.env.NODE_ENV === 'development') {
    }
  }
}

// 导出单例实例
export const rendererManager = RendererManager.getInstance()

// 导出便捷方法
export const registerRenderer = (
  type: string,
  factory: RendererFactory,
  options: { name: string; description?: string; icon?: string }
) => {
  rendererManager.register(type, factory, options)
}

export const createRenderer = (type: string, context: RendererContext, config?: RendererConfig) => {
  return rendererManager.createRenderer(type, context, config)
}

export const getRendererOptions = () => {
  return rendererManager.getSupportedRendererOptions()
}
