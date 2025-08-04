/**
 * Card 2.0 核心类型定义
 * 基于可视化编辑器架构设计的统一数据节点协议
 */

// 统一数据节点协议 (Unified Data Node Protocol)
export interface IDataNode {
  /** 节点唯一标识 */
  id: string
  /** 组件类型 */
  type: string
  /** 适配的渲染器列表 */
  renderer: RendererType[]
  /** 布局信息 */
  layout: {
    x: number
    y: number
    width: number
    height: number
    minWidth?: number
    minHeight?: number
  }
  /** 数据绑定配置 */
  dataBinding: {
    /** 数据源ID */
    sourceId: string
    /** 数据转换管道 */
    transform?: IDataTransform[]
  }
  /** 组件属性配置 */
  properties: Record<string, any>
  /** 基础设置 */
  basicSettings?: {
    showTitle?: boolean
    title?: string
  }
}

// 数据转换接口
export interface IDataTransform {
  /** 转换类型 */
  type: 'filter' | 'aggregate' | 'map' | 'sort' | 'limit'
  /** 转换参数 */
  params: Record<string, any>
}

// 渲染器类型
export type RendererType = 'dom' | 'canvas' | 'webgl' | 'svg'

// 组件生命周期状态
export type ComponentLifecycleState = 'init' | 'mounted' | 'updated' | 'destroyed'

// 数据源配置
export interface IDataSource {
  /** 数据源ID */
  id: string
  /** 数据源类型 */
  type: 'api' | 'websocket' | 'mock' | 'static'
  /** 数据源配置 */
  config: Record<string, any>
  /** 缓存配置 */
  cache?: {
    enabled: boolean
    ttl?: number // 缓存时间(秒)
  }
}

// 组件元数据
export interface IComponentMeta {
  /** 组件ID */
  id: string
  /** 组件名称 */
  name: string
  /** 组件类型 */
  type: string
  /** 组件版本 */
  version: string
  /** 支持的渲染器 */
  supportedRenderers: RendererType[]
  /** 组件描述 */
  description?: string
  /** 组件图标 */
  icon?: string
  /** 组件预览图 */
  poster?: string
  /** 默认属性 */
  defaultProps?: Record<string, any>
  /** 属性配置表单 */
  configSchema?: any
}

// 组件实例接口
export interface IComponentInstance {
  /** 组件ID */
  id: string
  /** 组件元数据 */
  meta: IComponentMeta
  /** 数据节点 */
  dataNode: IDataNode
  /** 生命周期状态 */
  state: ComponentLifecycleState
  /** 初始化 */
  init(): Promise<void>
  /** 更新数据 */
  updateData(data: any): void
  /** 更新属性 */
  updateProps(props: Record<string, any>): void
  /** 销毁 */
  destroy(): void
}

// 事件类型
export interface IComponentEvent {
  /** 事件类型 */
  type: string
  /** 事件数据 */
  data?: any
  /** 事件源组件ID */
  sourceId: string
  /** 时间戳 */
  timestamp: number
}

// 组件通信接口
export interface IComponentCommunication {
  /** 发送事件 */
  emit(event: IComponentEvent): void
  /** 监听事件 */
  on(eventType: string, handler: (event: IComponentEvent) => void): void
  /** 取消监听 */
  off(eventType: string, handler?: (event: IComponentEvent) => void): void
}
