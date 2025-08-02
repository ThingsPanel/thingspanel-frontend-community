/**
 * 渲染器管理器实现
 * 统一管理和调度多个渲染器
 */

import type { IRenderer, IRendererManager, IRenderContext, IResourcePool, RendererType } from '../types/renderer'
import type { IComponentInstance } from '../types/component'

/**
 * 资源池实现
 */
export class ResourcePool implements IResourcePool {
  private resources = new Map<string, any>()
  private usage = new Map<string, number>()
  private maxSize: number

  constructor(maxSize: number = 1000) {
    this.maxSize = maxSize
  }

  get(key: string): any {
    const resource = this.resources.get(key)
    if (resource) {
      this.usage.set(key, (this.usage.get(key) || 0) + 1)
    }
    return resource
  }

  set(key: string, value: any): void {
    // 检查容量限制
    if (this.resources.size >= this.maxSize && !this.resources.has(key)) {
      this.evictLeastUsed()
    }

    this.resources.set(key, value)
    this.usage.set(key, 0)
  }

  has(key: string): boolean {
    return this.resources.has(key)
  }

  delete(key: string): boolean {
    this.usage.delete(key)
    return this.resources.delete(key)
  }

  clear(): void {
    this.resources.clear()
    this.usage.clear()
  }

  size(): number {
    return this.resources.size
  }

  private evictLeastUsed(): void {
    let leastUsedKey = ''
    let leastUsedCount = Infinity

    for (const [key, count] of this.usage) {
      if (count < leastUsedCount) {
        leastUsedCount = count
        leastUsedKey = key
      }
    }

    if (leastUsedKey) {
      this.delete(leastUsedKey)
    }
  }

  getStats() {
    return {
      size: this.resources.size,
      maxSize: this.maxSize,
      usage: Object.fromEntries(this.usage)
    }
  }
}

/**
 * 渲染上下文实现
 */
export class RenderContext implements IRenderContext {
  id: string
  rendererType: RendererType
  container: HTMLElement
  instance: IComponentInstance
  data: any
  config: any
  metadata: Record<string, any>

  constructor(id: string, rendererType: RendererType, container: HTMLElement, instance: IComponentInstance) {
    this.id = id
    this.rendererType = rendererType
    this.container = container
    this.instance = instance
    this.data = instance.data
    this.config = instance.config
    this.metadata = {}
  }

  updateData(newData: any): void {
    this.data = newData
    this.instance.updateData(newData)
  }

  updateConfig(newConfig: any): void {
    this.config = newConfig
    this.instance.updateConfig(newConfig)
  }

  destroy(): void {
    // 清理容器
    if (this.container && this.container.parentNode) {
      this.container.innerHTML = ''
    }

    // 清理元数据
    this.metadata = {}
  }

  getMetadata(key: string): any {
    return this.metadata[key]
  }

  setMetadata(key: string, value: any): void {
    this.metadata[key] = value
  }
}

/**
 * 渲染器管理器实现
 */
export class RendererManager implements IRendererManager {
  private renderers = new Map<RendererType, IRenderer>()
  private contexts = new Map<string, IRenderContext>()
  private resourcePool = new ResourcePool()
  private contextCounter = 0

  registerRenderer(type: RendererType, renderer: IRenderer): void {
    if (this.renderers.has(type)) {
      console.warn(`渲染器 ${type} 已存在，将被覆盖`)
    }

    this.renderers.set(type, renderer)
    console.log(`渲染器 ${type} 注册成功`)
  }

  unregisterRenderer(type: RendererType): void {
    if (this.renderers.has(type)) {
      const renderer = this.renderers.get(type)!

      // 销毁所有使用该渲染器的上下文
      const contextsToDestroy = Array.from(this.contexts.values()).filter(ctx => ctx.rendererType === type)

      for (const context of contextsToDestroy) {
        this.destroyContext(context.id)
      }

      // 销毁渲染器
      if (renderer.destroy) {
        renderer.destroy()
      }

      this.renderers.delete(type)
      console.log(`渲染器 ${type} 注销成功`)
    } else {
      console.warn(`渲染器 ${type} 不存在，无法注销`)
    }
  }

  getRenderer(type: RendererType): IRenderer | undefined {
    return this.renderers.get(type)
  }

  createContext(rendererType: RendererType, container: HTMLElement, instance: IComponentInstance): IRenderContext {
    const contextId = `ctx_${rendererType}_${++this.contextCounter}_${Date.now()}`

    const context = new RenderContext(contextId, rendererType, container, instance)

    this.contexts.set(contextId, context)

    console.log(`渲染上下文 ${contextId} 创建成功`)
    return context
  }

  getContext(contextId: string): IRenderContext | undefined {
    return this.contexts.get(contextId)
  }

  destroyContext(contextId: string): void {
    const context = this.contexts.get(contextId)
    if (context) {
      context.destroy()
      this.contexts.delete(contextId)
      console.log(`渲染上下文 ${contextId} 销毁成功`)
    } else {
      console.warn(`渲染上下文 ${contextId} 不存在，无法销毁`)
    }
  }

  async render(
    rendererType: RendererType,
    container: HTMLElement,
    instance: IComponentInstance
  ): Promise<IRenderContext> {
    const renderer = this.getRenderer(rendererType)
    if (!renderer) {
      throw new Error(`渲染器 ${rendererType} 未注册`)
    }

    // 创建渲染上下文
    const context = this.createContext(rendererType, container, instance)

    try {
      // 执行渲染
      await renderer.render(context)

      // 更新实例状态
      instance.state = 'mounted'
      instance.rendererType = rendererType

      return context
    } catch (error) {
      // 渲染失败，清理上下文
      this.destroyContext(context.id)
      instance.state = 'error'

      console.error(`渲染失败:`, error)
      throw error
    }
  }

  async update(contextId: string, data?: any, config?: any): Promise<void> {
    const context = this.getContext(contextId)
    if (!context) {
      throw new Error(`渲染上下文 ${contextId} 不存在`)
    }

    const renderer = this.getRenderer(context.rendererType)
    if (!renderer) {
      throw new Error(`渲染器 ${context.rendererType} 未注册`)
    }

    try {
      // 更新上下文数据
      if (data !== undefined) {
        context.updateData(data)
      }
      if (config !== undefined) {
        context.updateConfig(config)
      }

      // 执行更新
      if (renderer.update) {
        await renderer.update(context)
      } else {
        // 如果渲染器不支持更新，重新渲染
        await renderer.render(context)
      }

      // 更新实例状态
      context.instance.state = 'updated'
    } catch (error) {
      context.instance.state = 'error'
      console.error(`更新失败:`, error)
      throw error
    }
  }

  async destroy(contextId: string): Promise<void> {
    const context = this.getContext(contextId)
    if (!context) {
      console.warn(`渲染上下文 ${contextId} 不存在，无法销毁`)
      return
    }

    const renderer = this.getRenderer(context.rendererType)
    if (renderer && renderer.destroy) {
      try {
        await renderer.destroy(context)
      } catch (error) {
        console.error(`渲染器销毁失败:`, error)
      }
    }

    // 销毁上下文
    this.destroyContext(contextId)

    // 更新实例状态
    context.instance.state = 'unmounted'
  }

  getResourcePool(): IResourcePool {
    return this.resourcePool
  }

  /**
   * 获取所有注册的渲染器类型
   */
  getRegisteredRenderers(): RendererType[] {
    return Array.from(this.renderers.keys())
  }

  /**
   * 获取所有活跃的上下文
   */
  getActiveContexts(): IRenderContext[] {
    return Array.from(this.contexts.values())
  }

  /**
   * 按渲染器类型获取上下文
   */
  getContextsByRenderer(rendererType: RendererType): IRenderContext[] {
    return Array.from(this.contexts.values()).filter(ctx => ctx.rendererType === rendererType)
  }

  /**
   * 获取统计信息
   */
  getStats() {
    const contextsByRenderer: Record<string, number> = {}

    for (const context of this.contexts.values()) {
      const type = context.rendererType
      contextsByRenderer[type] = (contextsByRenderer[type] || 0) + 1
    }

    return {
      renderers: this.renderers.size,
      contexts: this.contexts.size,
      contextsByRenderer,
      resourcePool: this.resourcePool.getStats()
    }
  }

  /**
   * 清理所有资源
   */
  cleanup(): void {
    // 销毁所有上下文
    const contextIds = Array.from(this.contexts.keys())
    for (const contextId of contextIds) {
      this.destroy(contextId).catch(error => {
        console.error(`清理上下文 ${contextId} 失败:`, error)
      })
    }

    // 清理资源池
    this.resourcePool.clear()

    console.log('渲染器管理器清理完成')
  }
}

// 导出单例实例
export const rendererManager = new RendererManager()
