/**
 * 渲染器管理器
 * 实现多渲染器的统一管理和调度
 */

import type {
  IRenderer,
  IRendererManager,
  IRendererConfig,
  IRenderContext,
  IResourcePool,
  RendererType
} from '../types/renderer'
import type { IComponentInstance } from '../types/component'

/**
 * 渲染器管理器实现类
 */
export class RendererManager implements IRendererManager {
  /** 注册的渲染器 */
  private renderers = new Map<RendererType, IRenderer>()
  /** 渲染器配置 */
  private configs = new Map<RendererType, IRendererConfig>()
  /** 活跃的渲染上下文 */
  private contexts = new Map<string, IRenderContext>()
  /** 资源池 */
  private resourcePool: IResourcePool
  /** 默认渲染器类型 */
  private defaultRendererType: RendererType = 'vue'

  constructor() {
    this.resourcePool = new ResourcePool()
    this.initializeDefaultRenderers()
  }

  /**
   * 注册渲染器
   * @param type 渲染器类型
   * @param renderer 渲染器实例
   * @param config 渲染器配置
   */
  register(type: RendererType, renderer: IRenderer, config?: IRendererConfig): void {
    this.renderers.set(type, renderer)

    if (config) {
      this.configs.set(type, config)
    }

    console.log(`[RendererManager] 注册渲染器: ${type}`)
  }

  /**
   * 注销渲染器
   * @param type 渲染器类型
   */
  unregister(type: RendererType): void {
    const renderer = this.renderers.get(type)
    if (renderer) {
      // 销毁相关的渲染上下文
      this.destroyContextsByRenderer(type)

      // 调用渲染器的销毁方法
      if (renderer.destroy) {
        renderer.destroy()
      }

      this.renderers.delete(type)
      this.configs.delete(type)

      console.log(`[RendererManager] 注销渲染器: ${type}`)
    }
  }

  /**
   * 获取渲染器
   * @param type 渲染器类型
   * @returns 渲染器实例
   */
  getRenderer(type?: RendererType): IRenderer {
    const rendererType = type || this.defaultRendererType
    const renderer = this.renderers.get(rendererType)

    if (!renderer) {
      throw new Error(`渲染器 ${rendererType} 未注册`)
    }

    return renderer
  }

  /**
   * 创建渲染上下文
   * @param contextId 上下文ID
   * @param rendererType 渲染器类型
   * @param container 容器元素
   * @returns 渲染上下文
   */
  createContext(contextId: string, rendererType: RendererType, container: HTMLElement): IRenderContext {
    const renderer = this.getRenderer(rendererType)
    const config = this.configs.get(rendererType)

    const context: IRenderContext = {
      id: contextId,
      rendererType,
      container,
      renderer,
      config,
      instances: new Map(),
      state: 'idle',
      createdAt: Date.now(),
      lastUsedAt: Date.now()
    }

    this.contexts.set(contextId, context)

    console.log(`[RendererManager] 创建渲染上下文: ${contextId} (${rendererType})`)
    return context
  }

  /**
   * 获取渲染上下文
   * @param contextId 上下文ID
   * @returns 渲染上下文
   */
  getContext(contextId: string): IRenderContext | undefined {
    const context = this.contexts.get(contextId)
    if (context) {
      context.lastUsedAt = Date.now()
    }
    return context
  }

  /**
   * 销毁渲染上下文
   * @param contextId 上下文ID
   */
  destroyContext(contextId: string): void {
    const context = this.contexts.get(contextId)
    if (!context) return

    // 销毁上下文中的所有组件实例
    context.instances.forEach((instance, instanceId) => {
      this.destroyInstance(contextId, instanceId)
    })

    // 清理容器
    if (context.container) {
      context.container.innerHTML = ''
    }

    this.contexts.delete(contextId)
    console.log(`[RendererManager] 销毁渲染上下文: ${contextId}`)
  }

  /**
   * 渲染组件实例
   * @param contextId 上下文ID
   * @param instance 组件实例
   * @returns 渲染结果Promise
   */
  async renderInstance(contextId: string, instance: IComponentInstance): Promise<void> {
    const context = this.getContext(contextId)
    if (!context) {
      throw new Error(`渲染上下文 ${contextId} 不存在`)
    }

    try {
      context.state = 'rendering'

      // 调用渲染器的渲染方法
      await context.renderer.render(instance, context)

      // 将实例添加到上下文
      context.instances.set(instance.id, instance)

      context.state = 'idle'
      context.lastUsedAt = Date.now()

      console.log(`[RendererManager] 渲染组件实例: ${instance.id} 在上下文 ${contextId}`)
    } catch (error) {
      context.state = 'error'
      console.error(`[RendererManager] 渲染失败:`, error)
      throw error
    }
  }

  /**
   * 更新组件实例
   * @param contextId 上下文ID
   * @param instanceId 实例ID
   * @param data 更新数据
   */
  async updateInstance(contextId: string, instanceId: string, data: any): Promise<void> {
    const context = this.getContext(contextId)
    if (!context) {
      throw new Error(`渲染上下文 ${contextId} 不存在`)
    }

    const instance = context.instances.get(instanceId)
    if (!instance) {
      throw new Error(`组件实例 ${instanceId} 不存在`)
    }

    try {
      // 调用渲染器的更新方法
      await context.renderer.update(instance, data, context)

      context.lastUsedAt = Date.now()

      console.log(`[RendererManager] 更新组件实例: ${instanceId}`)
    } catch (error) {
      console.error(`[RendererManager] 更新失败:`, error)
      throw error
    }
  }

  /**
   * 销毁组件实例
   * @param contextId 上下文ID
   * @param instanceId 实例ID
   */
  async destroyInstance(contextId: string, instanceId: string): Promise<void> {
    const context = this.getContext(contextId)
    if (!context) return

    const instance = context.instances.get(instanceId)
    if (!instance) return

    try {
      // 调用渲染器的销毁方法
      await context.renderer.destroy(instance, context)

      // 从上下文中移除实例
      context.instances.delete(instanceId)

      console.log(`[RendererManager] 销毁组件实例: ${instanceId}`)
    } catch (error) {
      console.error(`[RendererManager] 销毁实例失败:`, error)
    }
  }

  /**
   * 获取支持的渲染器类型列表
   * @returns 渲染器类型数组
   */
  getSupportedRenderers(): RendererType[] {
    return Array.from(this.renderers.keys())
  }

  /**
   * 设置默认渲染器
   * @param type 渲染器类型
   */
  setDefaultRenderer(type: RendererType): void {
    if (!this.renderers.has(type)) {
      throw new Error(`渲染器 ${type} 未注册`)
    }
    this.defaultRendererType = type
    console.log(`[RendererManager] 设置默认渲染器: ${type}`)
  }

  /**
   * 获取渲染器统计信息
   * @returns 统计信息
   */
  getStats() {
    const contextStats = Array.from(this.contexts.values()).reduce(
      (stats, context) => {
        stats.totalInstances += context.instances.size
        stats.contextsByRenderer[context.rendererType] = (stats.contextsByRenderer[context.rendererType] || 0) + 1
        return stats
      },
      {
        totalInstances: 0,
        contextsByRenderer: {} as Record<RendererType, number>
      }
    )

    return {
      registeredRenderers: this.renderers.size,
      activeContexts: this.contexts.size,
      defaultRenderer: this.defaultRendererType,
      ...contextStats,
      resourcePool: this.resourcePool.getStats()
    }
  }

  /**
   * 清理未使用的上下文
   * @param maxIdleTime 最大空闲时间（毫秒）
   */
  cleanupIdleContexts(maxIdleTime: number = 5 * 60 * 1000): void {
    const now = Date.now()
    const contextsToDestroy: string[] = []

    this.contexts.forEach((context, contextId) => {
      if (now - context.lastUsedAt > maxIdleTime && context.instances.size === 0) {
        contextsToDestroy.push(contextId)
      }
    })

    contextsToDestroy.forEach(contextId => {
      this.destroyContext(contextId)
    })

    if (contextsToDestroy.length > 0) {
      console.log(`[RendererManager] 清理了 ${contextsToDestroy.length} 个空闲上下文`)
    }
  }

  /**
   * 销毁指定渲染器的所有上下文
   * @param rendererType 渲染器类型
   */
  private destroyContextsByRenderer(rendererType: RendererType): void {
    const contextsToDestroy: string[] = []

    this.contexts.forEach((context, contextId) => {
      if (context.rendererType === rendererType) {
        contextsToDestroy.push(contextId)
      }
    })

    contextsToDestroy.forEach(contextId => {
      this.destroyContext(contextId)
    })
  }

  /**
   * 初始化默认渲染器
   */
  private initializeDefaultRenderers(): void {
    // 这里可以注册默认的渲染器
    // 实际的渲染器实现将在具体的渲染器文件中定义
    console.log('[RendererManager] 渲染器管理器已初始化')
  }
}

/**
 * 资源池实现类
 */
class ResourcePool implements IResourcePool {
  /** 资源缓存 */
  private resources = new Map<string, any>()
  /** 资源使用计数 */
  private usageCounts = new Map<string, number>()
  /** 资源创建时间 */
  private createdTimes = new Map<string, number>()

  /**
   * 获取资源
   * @param key 资源键
   * @param factory 资源工厂函数
   * @returns 资源
   */
  get<T>(key: string, factory?: () => T): T | undefined {
    let resource = this.resources.get(key)

    if (!resource && factory) {
      resource = factory()
      this.resources.set(key, resource)
      this.createdTimes.set(key, Date.now())
      console.log(`[ResourcePool] 创建资源: ${key}`)
    }

    if (resource) {
      this.usageCounts.set(key, (this.usageCounts.get(key) || 0) + 1)
    }

    return resource
  }

  /**
   * 设置资源
   * @param key 资源键
   * @param resource 资源
   */
  set(key: string, resource: any): void {
    this.resources.set(key, resource)
    this.createdTimes.set(key, Date.now())
    console.log(`[ResourcePool] 设置资源: ${key}`)
  }

  /**
   * 删除资源
   * @param key 资源键
   */
  delete(key: string): void {
    this.resources.delete(key)
    this.usageCounts.delete(key)
    this.createdTimes.delete(key)
    console.log(`[ResourcePool] 删除资源: ${key}`)
  }

  /**
   * 清理资源池
   */
  clear(): void {
    this.resources.clear()
    this.usageCounts.clear()
    this.createdTimes.clear()
    console.log('[ResourcePool] 资源池已清理')
  }

  /**
   * 获取统计信息
   * @returns 统计信息
   */
  getStats() {
    return {
      totalResources: this.resources.size,
      totalUsage: Array.from(this.usageCounts.values()).reduce((sum, count) => sum + count, 0),
      averageUsage:
        this.resources.size > 0
          ? Array.from(this.usageCounts.values()).reduce((sum, count) => sum + count, 0) / this.resources.size
          : 0
    }
  }
}

// 创建全局渲染器管理器实例
export const rendererManager = new RendererManager()

// 导出类型
export type { IRendererManager, IResourcePool }
