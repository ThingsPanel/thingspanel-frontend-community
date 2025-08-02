/**
 * 组件接口定义
 * 实现逻辑与视图分离的组件架构
 */

import type { RendererType, IDataNode, IComponentMeta } from './index'
import type { IRenderContext } from './renderer'

// 组件逻辑Hook接口
export interface IComponentLogic<TProps = any, TData = any> {
  /** Hook函数 */
  (props: TProps): {
    /** 处理后的数据 */
    data: TData
    /** 加载状态 */
    loading: boolean
    /** 错误信息 */
    error: Error | null
    /** 刷新数据 */
    refresh: () => void
    /** 更新配置 */
    updateConfig: (config: Partial<TProps>) => void
    /** 其他业务逻辑方法 */
    [key: string]: any
  }
}

// 组件视图接口
export interface IComponentView<TProps = any> {
  /** 渲染器类型 */
  rendererType: RendererType
  /** 渲染函数 */
  render(props: TProps, context: IRenderContext): void | Promise<void>
  /** 更新函数 */
  update?(props: TProps, context: IRenderContext): void | Promise<void>
  /** 销毁函数 */
  destroy?(context: IRenderContext): void | Promise<void>
  /** 事件处理 */
  handleEvent?(event: Event, context: IRenderContext): void
}

// 组件定义接口
export interface IComponentDefinition {
  /** 组件元数据 */
  meta: IComponentMeta
  /** 逻辑Hook */
  logic: IComponentLogic
  /** 视图映射 */
  views: {
    [K in RendererType]?: () => Promise<IComponentView>
  }
  /** 配置表单组件 */
  configForm?: () => Promise<any>
  /** 默认数据节点 */
  defaultDataNode?: Partial<IDataNode>
}

// 组件工厂接口
export interface IComponentFactory {
  /** 创建组件实例 */
  create(definition: IComponentDefinition, dataNode: IDataNode): Promise<IComponentInstance>
  /** 克隆组件实例 */
  clone(instance: IComponentInstance): Promise<IComponentInstance>
  /** 销毁组件实例 */
  destroy(instance: IComponentInstance): Promise<void>
}

// 组件实例接口 (扩展基础接口)
export interface IComponentInstance {
  /** 实例ID */
  id: string
  /** 组件定义 */
  definition: IComponentDefinition
  /** 数据节点 */
  dataNode: IDataNode
  /** 当前渲染器类型 */
  currentRenderer?: RendererType
  /** 逻辑Hook实例 */
  logicInstance?: any
  /** 视图实例 */
  viewInstance?: IComponentView
  /** 是否已挂载 */
  mounted: boolean
  /** 是否可见 */
  visible: boolean

  /** 初始化组件 */
  init(rendererType: RendererType, context: IRenderContext): Promise<void>
  /** 渲染组件 */
  render(context: IRenderContext): Promise<void>
  /** 更新组件 */
  update(dataNode?: Partial<IDataNode>): Promise<void>
  /** 切换渲染器 */
  switchRenderer(rendererType: RendererType, context: IRenderContext): Promise<void>
  /** 显示/隐藏组件 */
  setVisible(visible: boolean): void
  /** 获取组件数据 */
  getData(): any
  /** 设置组件数据 */
  setData(data: any): void
  /** 获取组件属性 */
  getProps(): any
  /** 设置组件属性 */
  setProps(props: any): void
  /** 销毁组件 */
  destroy(): Promise<void>
  /** 导出组件状态 */
  exportState(): any
  /** 导入组件状态 */
  importState(state: any): void
}

// 组件注册表接口
export interface IComponentRegistry {
  /** 注册组件 */
  register(definition: IComponentDefinition): void
  /** 注销组件 */
  unregister(componentId: string): void
  /** 获取组件定义 */
  getDefinition(componentId: string): IComponentDefinition | null
  /** 获取所有组件定义 */
  getAllDefinitions(): IComponentDefinition[]
  /** 按类型获取组件 */
  getByType(type: string): IComponentDefinition[]
  /** 按渲染器获取组件 */
  getByRenderer(rendererType: RendererType): IComponentDefinition[]
  /** 检查组件是否存在 */
  has(componentId: string): boolean
  /** 清空注册表 */
  clear(): void
}

// 组件加载器接口
export interface IComponentLoader {
  /** 动态加载组件 */
  load(componentId: string): Promise<IComponentDefinition>
  /** 预加载组件 */
  preload(componentIds: string[]): Promise<void>
  /** 卸载组件 */
  unload(componentId: string): void
  /** 获取加载状态 */
  getLoadingState(componentId: string): 'loading' | 'loaded' | 'error' | 'not-found'
  /** 清理缓存 */
  clearCache(): void
}

// 组件配置接口
export interface IComponentConfig {
  /** 组件ID */
  componentId: string
  /** 配置数据 */
  config: Record<string, any>
  /** 配置版本 */
  version: string
  /** 配置描述 */
  description?: string
  /** 创建时间 */
  createdAt: number
  /** 更新时间 */
  updatedAt: number
}

// 组件配置管理器接口
export interface IComponentConfigManager {
  /** 保存配置 */
  save(config: IComponentConfig): Promise<void>
  /** 加载配置 */
  load(componentId: string, version?: string): Promise<IComponentConfig | null>
  /** 删除配置 */
  delete(componentId: string, version?: string): Promise<void>
  /** 获取配置历史 */
  getHistory(componentId: string): Promise<IComponentConfig[]>
  /** 恢复配置 */
  restore(componentId: string, version: string): Promise<void>
}
