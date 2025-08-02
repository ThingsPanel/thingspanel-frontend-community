/**
 * 渲染器接口定义
 * 定义渲染器的统一规范和生命周期管理
 */

import type { RendererType, IComponentInstance } from './index'

/**
 * 渲染器接口
 */
export interface IRenderer {
  /** 渲染器类型 */
  readonly type: RendererType

  /**
   * 渲染组件实例
   * @param instance 组件实例
   * @param context 渲染上下文
   */
  render(instance: IComponentInstance, context: IRenderContext): Promise<void>

  /**
   * 更新组件实例
   * @param instance 组件实例
   * @param data 更新数据
   * @param context 渲染上下文
   */
  update(instance: IComponentInstance, data: any, context: IRenderContext): Promise<void>

  /**
   * 销毁组件实例
   * @param instance 组件实例
   * @param context 渲染上下文
   */
  destroy(instance: IComponentInstance, context: IRenderContext): Promise<void>

  /**
   * 添加事件监听器
   * @param eventType 事件类型
   * @param listener 监听器函数
   */
  addEventListener(eventType: string, listener: (event: IRendererEvent) => void): void

  /**
   * 移除事件监听器
   * @param eventType 事件类型
   * @param listener 监听器函数
   */
  removeEventListener(eventType: string, listener: (event: IRendererEvent) => void): void

  /**
   * 设置钩子函数
   * @param hooks 钩子函数对象
   */
  setHooks(hooks: Partial<IRendererHooks>): void

  /**
   * 获取渲染器配置
   */
  getConfig(): IRendererConfig

  /**
   * 更新渲染器配置
   * @param config 新配置
   */
  updateConfig(config: Partial<IRendererConfig>): void

  /**
   * 销毁渲染器
   */
  destroy?(): void
}

/**
 * 渲染器配置
 */
export interface IRendererConfig {
  /** 是否启用热更新 */
  enableHMR?: boolean
  /** 是否启用开发工具 */
  enableDevtools?: boolean
  /** 是否启用错误边界 */
  enableErrorBoundary?: boolean
  /** 性能监控 */
  enablePerformanceMonitoring?: boolean
  /** 自定义配置 */
  [key: string]: any
}

/**
 * 渲染上下文
 */
export interface IRenderContext {
  /** 上下文唯一标识 */
  id: string
  /** 渲染器类型 */
  rendererType: RendererType
  /** 容器元素 */
  container: HTMLElement
  /** 渲染器实例 */
  renderer: IRenderer
  /** 渲染器配置 */
  config?: IRendererConfig
  /** 组件实例映射 */
  instances: Map<string, IComponentInstance>
  /** 上下文状态 */
  state: 'idle' | 'rendering' | 'error'
  /** 创建时间 */
  createdAt: number
  /** 最后使用时间 */
  lastUsedAt: number
  /** 自定义数据 */
  userData?: any
}

/**
 * 渲染器事件
 */
export interface IRendererEvent {
  /** 事件类型 */
  type: 'rendered' | 'updated' | 'destroyed' | 'error' | string
  /** 实例ID */
  instanceId: string
  /** 上下文ID */
  contextId: string
  /** 事件数据 */
  data?: any
  /** 错误信息 */
  error?: Error
  /** 时间戳 */
  timestamp: number
}

/**
 * 渲染器管理器接口
 */
export interface IRendererManager {
  /**
   * 注册渲染器
   * @param type 渲染器类型
   * @param renderer 渲染器实例
   * @param config 渲染器配置
   */
  register(type: RendererType, renderer: IRenderer, config?: IRendererConfig): void

  /**
   * 注销渲染器
   * @param type 渲染器类型
   */
  unregister(type: RendererType): void

  /**
   * 获取渲染器
   * @param type 渲染器类型
   */
  getRenderer(type?: RendererType): IRenderer

  /**
   * 创建渲染上下文
   * @param contextId 上下文ID
   * @param rendererType 渲染器类型
   * @param container 容器元素
   */
  createContext(contextId: string, rendererType: RendererType, container: HTMLElement): IRenderContext

  /**
   * 获取渲染上下文
   * @param contextId 上下文ID
   */
  getContext(contextId: string): IRenderContext | undefined

  /**
   * 销毁渲染上下文
   * @param contextId 上下文ID
   */
  destroyContext(contextId: string): void

  /**
   * 渲染组件实例
   * @param contextId 上下文ID
   * @param instance 组件实例
   */
  renderInstance(contextId: string, instance: IComponentInstance): Promise<void>

  /**
   * 更新组件实例
   * @param contextId 上下文ID
   * @param instanceId 实例ID
   * @param data 更新数据
   */
  updateInstance(contextId: string, instanceId: string, data: any): Promise<void>

  /**
   * 销毁组件实例
   * @param contextId 上下文ID
   * @param instanceId 实例ID
   */
  destroyInstance(contextId: string, instanceId: string): Promise<void>

  /**
   * 获取支持的渲染器类型列表
   */
  getSupportedRenderers(): RendererType[]

  /**
   * 设置默认渲染器
   * @param type 渲染器类型
   */
  setDefaultRenderer(type: RendererType): void

  /**
   * 获取统计信息
   */
  getStats(): any

  /**
   * 清理未使用的上下文
   * @param maxIdleTime 最大空闲时间
   */
  cleanupIdleContexts(maxIdleTime?: number): void
}

/**
 * 资源池接口
 */
export interface IResourcePool {
  /**
   * 获取资源
   * @param key 资源键
   * @param factory 资源工厂函数
   */
  get<T>(key: string, factory?: () => T): T | undefined

  /**
   * 设置资源
   * @param key 资源键
   * @param resource 资源
   */
  set(key: string, resource: any): void

  /**
   * 删除资源
   * @param key 资源键
   */
  delete(key: string): void

  /**
   * 清理资源池
   */
  clear(): void

  /**
   * 获取统计信息
   */
  getStats(): any
}

/**
 * 渲染器钩子函数
 */
export interface IRendererHooks {
  /**
   * 渲染前钩子
   * @param instance 组件实例
   * @param context 渲染上下文
   */
  beforeRender?(instance: IComponentInstance, context: IRenderContext): Promise<void> | void

  /**
   * 渲染后钩子
   * @param instance 组件实例
   * @param context 渲染上下文
   */
  afterRender?(instance: IComponentInstance, context: IRenderContext): Promise<void> | void

  /**
   * 更新前钩子
   * @param instance 组件实例
   * @param data 更新数据
   * @param context 渲染上下文
   */
  beforeUpdate?(instance: IComponentInstance, data: any, context: IRenderContext): Promise<void> | void

  /**
   * 更新后钩子
   * @param instance 组件实例
   * @param data 更新数据
   * @param context 渲染上下文
   */
  afterUpdate?(instance: IComponentInstance, data: any, context: IRenderContext): Promise<void> | void

  /**
   * 销毁前钩子
   * @param instance 组件实例
   * @param context 渲染上下文
   */
  beforeDestroy?(instance: IComponentInstance, context: IRenderContext): Promise<void> | void

  /**
   * 销毁后钩子
   * @param instance 组件实例
   * @param context 渲染上下文
   */
  afterDestroy?(instance: IComponentInstance, context: IRenderContext): Promise<void> | void

  /**
   * 错误处理钩子
   * @param error 错误对象
   * @param instance 组件实例
   * @param context 渲染上下文
   */
  onError?(error: Error, instance: IComponentInstance, context: IRenderContext): Promise<void> | void
}
