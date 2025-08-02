/**
 * Card 2.0 核心类型定义
 * 定义统一数据节点协议和基础接口
 */

/**
 * 统一数据节点协议
 * 所有数据都会转换为这个标准格式
 */
export interface IDataNode {
  /** 数据节点唯一标识 */
  id: string
  /** 数据类型 */
  type: string
  /** 数据值 */
  value: any
  /** 时间戳 */
  timestamp: number
  /** 元数据 */
  metadata: {
    /** 数据源 */
    source?: string
    /** 数据类型 */
    dataType?: string
    /** 设备ID */
    deviceId?: string
    /** 设备名称 */
    deviceName?: string
    /** 单位 */
    unit?: string
    /** 质量标识 */
    quality?: string
    /** 分类 */
    category?: string
    /** 标签 */
    tags?: Record<string, any>
    /** 原始数据 */
    raw?: any
    /** 错误信息 */
    error?: {
      message: string
      name: string
      stack?: string
    }
    [key: string]: any
  }
}

/**
 * 数据转换接口
 */
export interface IDataTransform {
  /**
   * 转换数据为统一格式
   * @param rawData 原始数据
   * @param sourceType 数据源类型
   * @returns 统一数据节点
   */
  transform(rawData: any, sourceType: string): IDataNode

  /**
   * 批量转换数据
   * @param dataList 原始数据列表
   * @param sourceType 数据源类型
   * @returns 统一数据节点数组
   */
  transformBatch(dataList: any[], sourceType: string): IDataNode[]

  /**
   * 验证数据节点
   * @param node 数据节点
   * @returns 是否有效
   */
  validate(node: IDataNode): boolean
}

/**
 * 渲染器类型
 */
export type RendererType = 'vue' | 'react' | 'angular' | 'svelte' | 'canvas' | 'webgl'

/**
 * 组件生命周期状态
 */
export type ComponentLifecycleState = 'created' | 'mounted' | 'updated' | 'unmounted' | 'error'

/**
 * 数据源配置
 */
export interface IDataSource {
  /** 支持的数据源类型 */
  supportedTypes: string[]
  /** 必需字段 */
  requiredFields: string[]
  /** 可选字段 */
  optionalFields?: string[]
  /** 是否支持聚合 */
  aggregationSupport?: boolean
  /** 是否支持实时数据 */
  realTimeSupport?: boolean
  /** 数据刷新间隔（毫秒） */
  refreshInterval?: number
}

/**
 * 组件元数据
 */
export interface IComponentMeta {
  /** 组件唯一标识 */
  id: string
  /** 组件名称 */
  name: string
  /** 组件描述 */
  description: string
  /** 版本号 */
  version: string
  /** 作者 */
  author: string
  /** 标签 */
  tags: string[]
  /** 分类 */
  category: string
  /** 图标 */
  icon?: string
  /** 缩略图 */
  thumbnail?: string
  /** 创建时间 */
  createdAt?: number
  /** 更新时间 */
  updatedAt?: number
}

/**
 * 组件实例接口
 */
export interface IComponentInstance {
  /** 实例唯一标识 */
  id: string
  /** 组件定义 */
  definition: any // 这里会在component.ts中定义具体类型
  /** 组件配置 */
  config: any
  /** 组件数据 */
  data: IDataNode | IDataNode[]
  /** 生命周期状态 */
  state: ComponentLifecycleState
  /** 创建时间 */
  createdAt: number
  /** 最后更新时间 */
  lastUpdatedAt: number
}

/**
 * 事件类型
 */
export interface IComponentEvent {
  /** 事件类型 */
  type: string
  /** 事件源实例ID */
  instanceId: string
  /** 事件数据 */
  data?: any
  /** 时间戳 */
  timestamp: number
}

/**
 * 组件通信接口
 */
export interface IComponentCommunication {
  /**
   * 发送事件
   * @param event 事件对象
   */
  emit(event: IComponentEvent): void

  /**
   * 监听事件
   * @param eventType 事件类型
   * @param handler 事件处理器
   */
  on(eventType: string, handler: (event: IComponentEvent) => void): void

  /**
   * 取消监听
   * @param eventType 事件类型
   * @param handler 事件处理器
   */
  off(eventType: string, handler: (event: IComponentEvent) => void): void

  /**
   * 一次性监听
   * @param eventType 事件类型
   * @param handler 事件处理器
   */
  once(eventType: string, handler: (event: IComponentEvent) => void): void
}

/**
 * 布局配置
 */
export interface ILayoutConfig {
  /** 默认尺寸 */
  defaultSize: {
    width: number
    height: number
  }
  /** 最小尺寸 */
  minSize: {
    width: number
    height: number
  }
  /** 最大尺寸 */
  maxSize?: {
    width: number
    height: number
  }
  /** 是否可调整大小 */
  resizable?: boolean
  /** 是否可拖拽 */
  draggable?: boolean
  /** 网格对齐 */
  gridAlign?: boolean
}

/**
 * 配置模式定义
 */
export interface IConfigSchema {
  /** JSON Schema类型 */
  type: string
  /** 属性定义 */
  properties?: Record<string, any>
  /** 必需属性 */
  required?: string[]
  /** 默认值 */
  default?: any
  /** 标题 */
  title?: string
  /** 描述 */
  description?: string
  /** 枚举值 */
  enum?: any[]
  /** 最小值 */
  minimum?: number
  /** 最大值 */
  maximum?: number
  /** 数组项定义 */
  items?: IConfigSchema
}
