/**
 * 组件接口定义
 * 定义Card 2.0组件的统一规范，实现逻辑与视图分离
 */

import type { IDataNode, IComponentMeta, IDataSource, ILayoutConfig, IConfigSchema, RendererType } from './index'

/**
 * 组件逻辑Hook接口
 * 定义组件的业务逻辑处理
 */
export interface IComponentLogic {
  /**
   * 处理数据
   * @param rawData 原始数据
   * @param config 组件配置
   * @returns 处理后的数据
   */
  processData?(rawData: IDataNode | IDataNode[], config: any): Promise<any> | any

  /**
   * 组件挂载时的处理
   * @param context 组件上下文
   */
  onMounted?(context: IComponentContext): Promise<void> | void

  /**
   * 组件卸载时的处理
   * @param context 组件上下文
   */
  onUnmounted?(context: IComponentContext): Promise<void> | void

  /**
   * 配置变更处理
   * @param newConfig 新配置
   * @param oldConfig 旧配置
   * @param context 组件上下文
   */
  onConfigChanged?(newConfig: any, oldConfig: any, context: IComponentContext): Promise<void> | void

  /**
   * 数据变更处理
   * @param newData 新数据
   * @param oldData 旧数据
   * @param context 组件上下文
   */
  onDataChanged?(newData: any, oldData: any, context: IComponentContext): Promise<void> | void

  /**
   * 错误处理
   * @param error 错误对象
   * @param context 组件上下文
   */
  onError?(error: Error, context: IComponentContext): Promise<void> | void

  /**
   * 自定义方法
   */
  [key: string]: any
}

/**
 * 组件视图接口
 * 定义不同渲染器的视图实现
 */
export interface IComponentView {
  /** Vue组件 */
  vue?: any
  /** React组件 */
  react?: any
  /** Angular组件 */
  angular?: any
  /** Svelte组件 */
  svelte?: any
  /** Canvas渲染函数 */
  canvas?: (context: CanvasRenderingContext2D, data: any, config: any) => void
  /** WebGL渲染函数 */
  webgl?: (gl: WebGLRenderingContext, data: any, config: any) => void
  /** 自定义渲染器 */
  [key: string]: any
}

/**
 * 组件定义接口
 * 完整的组件定义，包含元数据、逻辑、视图等
 */
export interface IComponentDefinition {
  /** 组件元数据 */
  meta: IComponentMeta

  /** 组件逻辑 */
  logic: IComponentLogic

  /** 组件视图 */
  views: IComponentView

  /** 组件配置 */
  config: {
    /** 配置模式 */
    schema: IConfigSchema
    /** 默认配置 */
    defaultConfig: any
    /** 配置验证器 */
    validator?(config: any): boolean | string
  }

  /** 数据源配置 */
  dataSource: IDataSource

  /** 布局配置 */
  layout: ILayoutConfig

  /** 依赖项 */
  dependencies?: string[]

  /** 样式文件 */
  styles?: string[]

  /** 脚本文件 */
  scripts?: string[]

  /** 资源文件 */
  assets?: string[]
}

/**
 * 组件工厂接口
 */
export interface IComponentFactory {
  /**
   * 创建组件实例
   * @param definition 组件定义
   * @param config 组件配置
   * @param data 初始数据
   * @returns 组件实例
   */
  createInstance(definition: IComponentDefinition, config: any, data?: any): IComponentInstance

  /**
   * 验证组件定义
   * @param definition 组件定义
   * @returns 验证结果
   */
  validateDefinition(definition: IComponentDefinition): boolean | string

  /**
   * 克隆组件实例
   * @param instance 原实例
   * @returns 新实例
   */
  cloneInstance(instance: IComponentInstance): IComponentInstance
}

/**
 * 组件实例接口
 */
export interface IComponentInstance {
  /** 实例唯一标识 */
  id: string

  /** 组件定义 */
  definition: IComponentDefinition

  /** 组件配置 */
  config: any

  /** 组件数据 */
  data: any

  /** 生命周期状态 */
  state: 'created' | 'mounted' | 'updated' | 'unmounted' | 'error'

  /** 创建时间 */
  createdAt: number

  /** 最后更新时间 */
  lastUpdatedAt: number

  /** 渲染器类型 */
  rendererType?: RendererType

  /** 父实例ID */
  parentId?: string

  /** 子实例ID列表 */
  childrenIds?: string[]

  /** 实例元数据 */
  metadata?: Record<string, any>

  /**
   * 更新配置
   * @param newConfig 新配置
   */
  updateConfig(newConfig: any): void

  /**
   * 更新数据
   * @param newData 新数据
   */
  updateData(newData: any): void

  /**
   * 销毁实例
   */
  destroy(): void

  /**
   * 获取状态
   */
  getState(): any

  /**
   * 设置状态
   * @param state 新状态
   */
  setState(state: any): void
}

/**
 * 组件注册表接口
 */
export interface IComponentRegistry {
  /**
   * 注册组件
   * @param definition 组件定义
   */
  register(definition: IComponentDefinition): void

  /**
   * 注销组件
   * @param componentId 组件ID
   */
  unregister(componentId: string): void

  /**
   * 获取组件定义
   * @param componentId 组件ID
   */
  getDefinition(componentId: string): IComponentDefinition | undefined

  /**
   * 获取所有组件定义
   */
  getAllDefinitions(): IComponentDefinition[]

  /**
   * 按类型获取组件
   * @param category 组件类型
   */
  getByCategory(category: string): IComponentDefinition[]

  /**
   * 按渲染器获取组件
   * @param rendererType 渲染器类型
   */
  getByRenderer(rendererType: RendererType): IComponentDefinition[]

  /**
   * 搜索组件
   * @param query 搜索条件
   */
  search(query: string): IComponentDefinition[]

  /**
   * 创建组件实例
   * @param componentId 组件ID
   * @param config 组件配置
   * @param data 初始数据
   */
  createInstance(componentId: string, config: any, data?: any): IComponentInstance

  /**
   * 验证组件定义
   * @param definition 组件定义
   */
  validateDefinition(definition: IComponentDefinition): boolean | string

  /**
   * 获取统计信息
   */
  getStats(): {
    total: number
    byCategory: Record<string, number>
    byRenderer: Record<RendererType, number>
  }
}

/**
 * 组件加载器接口
 */
export interface IComponentLoader {
  /**
   * 动态加载组件
   * @param componentId 组件ID
   */
  load(componentId: string): Promise<IComponentDefinition>

  /**
   * 预加载组件
   * @param componentIds 组件ID数组
   */
  preload(componentIds: string[]): Promise<void>

  /**
   * 卸载组件
   * @param componentId 组件ID
   */
  unload(componentId: string): void

  /**
   * 获取加载状态
   * @param componentId 组件ID
   */
  getLoadingState(componentId: string): 'loading' | 'loaded' | 'error' | 'not-found'

  /**
   * 清理缓存
   */
  clearCache(): void
}

/**
 * 组件配置接口
 */
export interface IComponentConfig {
  /** 配置ID */
  id: string

  /** 组件ID */
  componentId: string

  /** 配置数据 */
  data: any

  /** 配置版本 */
  version: string

  /** 创建时间 */
  createdAt: number

  /** 更新时间 */
  updatedAt: number

  /** 配置描述 */
  description?: string

  /** 配置标签 */
  tags?: string[]
}

/**
 * 组件配置管理器接口
 */
export interface IComponentConfigManager {
  /**
   * 保存配置
   * @param config 配置对象
   */
  save(config: IComponentConfig): Promise<void>

  /**
   * 加载配置
   * @param configId 配置ID
   */
  load(configId: string): Promise<IComponentConfig | undefined>

  /**
   * 删除配置
   * @param configId 配置ID
   */
  delete(configId: string): Promise<void>

  /**
   * 获取组件的所有配置
   * @param componentId 组件ID
   */
  getByComponent(componentId: string): Promise<IComponentConfig[]>

  /**
   * 搜索配置
   * @param query 搜索条件
   */
  search(query: string): Promise<IComponentConfig[]>

  /**
   * 验证配置
   * @param componentId 组件ID
   * @param config 配置数据
   */
  validate(componentId: string, config: any): boolean | string
}

/**
 * 组件上下文接口
 */
export interface IComponentContext {
  /** 组件实例 */
  instance: IComponentInstance

  /** 当前数据 */
  data: any

  /** 当前配置 */
  config: any

  /** 更新数据方法 */
  updateData: (newData: any) => void

  /** 更新配置方法 */
  updateConfig: (newConfig: any) => void

  /** 触发事件方法 */
  emit: (eventType: string, data?: any) => void

  /** 监听事件方法 */
  on: (eventType: string, handler: (data: any) => void) => void

  /** 取消监听方法 */
  off: (eventType: string, handler: (data: any) => void) => void

  /** 获取其他组件实例 */
  getInstance: (instanceId: string) => IComponentInstance | undefined

  /** 获取父组件实例 */
  getParent: () => IComponentInstance | undefined

  /** 获取子组件实例 */
  getChildren: () => IComponentInstance[]

  /** 自定义数据 */
  userData?: Record<string, any>
}
