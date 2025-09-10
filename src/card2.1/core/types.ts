/**
 * Card2.1 核心类型定义
 * 简洁明了的类型系统
 */

import type { Component } from 'vue'
import type { ComponentInteractionDefinition } from './interaction-types'

// 权限类型定义
export type ComponentPermission = '不限' | 'TENANT_ADMIN' | 'TENANT_USER' | 'SYS_ADMIN'

/**
 * 指标项类型定义
 * 用于存储从设备模板配置的指标信息
 */
export interface MetricItem {
  /** 指标唯一ID */
  id: string
  /** 指标名称 */
  name: string
  /** 指标字段键 */
  key: string
  /** 指标单位 */
  unit?: string
  /** 指标描述 */
  description?: string
  /** 数据类型 */
  dataType?: 'number' | 'string' | 'boolean' | 'object'
}

export interface ComponentDefinition<TConfig = Record<string, any>> {
  type: string
  name: string
  description: string
  category?: string // 可选，由自动注册系统根据文件夹路径设置
  subCategory?: string // 子分类，用于更细粒度的分组
  mainCategory?: string // 主分类：系统、曲线
  icon: string // 改为string类型，直接使用SVG字符串
  component: Component
  configComponent?: Component
  
  // 🔥 新增：默认配置对象（标准化配置系统）
  defaultConfig?: TConfig
  
  // 🔥 新增：默认布局配置
  defaultLayout?: {
    canvas?: {
      width: number
      height: number
      x: number
      y: number
    }
    gridstack?: {
      w: number
      h: number
      x: number
      y: number
      minW?: number
      minH?: number
      maxW?: number
      maxH?: number
    }
  }
  
  // 🔥 新增：布局配置
  layout?: {
    defaultSize?: {
      width: number
      height: number
    }
    minSize?: {
      width: number
      height: number
    }
    maxSize?: {
      width: number
      height: number
    }
    resizable?: boolean
  }
  
  // 🔥 新增：特性标记
  features?: {
    realtime?: boolean      // 支持实时数据
    dataBinding?: boolean   // 支持数据绑定
    themeable?: boolean     // 支持主题定制
    responsive?: boolean    // 支持响应式
    configurable?: boolean  // 支持配置定制
  }
  
  // 🔥 新增：性能优化配置
  performance?: {
    renderOptimization?: {
      useVirtualRendering?: boolean
      debounceUpdate?: number
      throttleResize?: number
    }
    dataUpdateOptimization?: {
      enableDeltaUpdate?: boolean
      batchSize?: number
      updateThreshold?: number
    }
    animationOptimization?: {
      useRequestAnimationFrame?: boolean
      maxFPS?: number
      enableHardwareAcceleration?: boolean
    }
  }
  
  config?: Record<string, any> // 组件配置（遗留字段，保持兼容）
  tags?: string[] // 组件标签
  version?: string // 组件版本
  author?: string // 组件作者
  permission?: ComponentPermission // 权限字段：不限、TENANT_ADMIN、TENANT_USER、SYS_ADMIN
  isRegistered?: boolean // 是否注册字段：true-注册，false-不注册，默认true
  supportedDataSources?: string[] // 支持的数据源类型（遗留字段）
  
  // 🔥 废弃：移除 examples 字段，统一使用 dataSources.example
  // examples?: Array<{
  //   name: string
  //   description: string
  //   config: Record<string, any>
  // }> // 示例配置
  
  documentation?: Record<string, any> // 文档信息
  properties?: Record<
    string,
    {
      type: string
      default: any
      description: string
      label?: string
      placeholder?: string
      min?: number
      max?: number
      step?: number
      options?: Array<{ label: string; value: any }>
    }
  >

  // ============ 通用属性 - 所有新组件必须包含 ============

  /** 设备ID - 用于设备关联和模板配置 (新组件必填，现有组件兼容) */
  deviceId?: string

  /** 指标列表 - 存储从模板配置的指标信息 (新组件必填，现有组件兼容) */
  metricsList?: MetricItem[]

  // ============ 配置驱动的动态数据源重构新增字段 ============

  /** 静态参数需求声明 */
  staticParams?: StaticParamRequirement[]

  /** 数据源需求声明 */
  dataSources?: DataSourceRequirement[]

  // ============ 交互系统配置 ============

  /** 交互能力定义 */
  interaction?: ComponentInteractionDefinition

  /** 设置配置 - 用于属性暴露和配置面板 */
  settingConfig?: any[]
}

export interface IComponentRegistry {
  register(id: string, definition: ComponentDefinition): void
  get(id: string): ComponentDefinition | undefined
  getAll(): ComponentDefinition[]
  has(id: string): boolean
}

export type IConfigComponent = Component

// 保持向后兼容
// ============ 配置驱动的动态数据源重构新增类型 ============

/**
 * 静态参数需求定义
 * 用于声明组件需要的静态配置参数
 */
export interface StaticParamRequirement {
  /** 参数唯一标识 */
  key: string
  /** 参数名称 */
  name: string
  /** 参数类型 */
  type: 'string' | 'number' | 'boolean' | 'object' | 'array'
  /** 参数描述 */
  description: string
  /** 默认值 */
  defaultValue?: any
  /** 是否必填 */
  required?: boolean
  /** 参数验证规则 */
  validation?: {
    min?: number
    max?: number
    pattern?: string
    options?: Array<{ label: string; value: any }>
  }
  /** UI 渲染提示 */
  ui?: {
    component?: 'input' | 'select' | 'number' | 'switch' | 'textarea' | 'color' | 'slider'
    placeholder?: string
    label?: string
    group?: string
  }
}

/**
 * 数据源需求定义
 * 用于声明组件需要的动态数据源
 */
export interface DataSourceRequirement {
  /** 数据源唯一标识 */
  key: string
  /** 数据源名称 */
  name: string
  /** 数据源描述 */
  description: string
  /** 支持的数据源类型 */
  supportedTypes: Array<'static' | 'api' | 'websocket' | 'mqtt' | 'database'>
  
  // 🔥 统一标准：只使用 example 字段作为示例数据
  /** 示例数据（用于调试和配置界面显示） */
  example?: Record<string, any>
  
  /** 字段映射规则 */
  fieldMappings?: Record<
    string,
    {
      /** 目标字段名 */
      targetField: string
      /** 字段类型 */
      type: 'value' | 'object' | 'array'
      /** 是否必填 */
      required: boolean
      /** 默认值 */
      defaultValue?: any
      /** 数据转换函数 */
      transform?: string // 函数字符串，用于序列化
      /** 验证规则 */
      validator?: {
        type: string
        range?: { min: number | string; max: number | string }
        maxLength?: number
      }
    }
  >
  
  /** 是否必填 */
  required?: boolean
  
  /** 更新间隔（毫秒） */
  updateInterval?: number
  
  /** 错误处理配置 */
  errorHandling?: {
    onError: 'showLastValue' | 'showDefault' | 'showError'
    retryCount?: number
    retryInterval?: number
  }
  
  /** 🔥 新增：配置示例（用于快速配置向导） */
  config?: {
    exampleData?: Record<string, any> // 保留此字段以兼容已有代码
  }
  
  /** 🔥 新增：多种数据源示例（用于文档和配置面板） */
  examples?: {
    static?: {
      name: string
      data: Record<string, any>
    }
    api?: {
      name: string
      url: string
      method: string
      responseExample: Record<string, any>
      pathMapping?: Record<string, string>
    }
    websocket?: {
      name: string
      endpoint: string
      messageExample: Record<string, any>
    }
  }
}

/**
 * 数据源信息接口
 * 数据源中心的标准契约
 */
export interface DataSourceInfo {
  /** 数据源唯一ID */
  id: string
  /** 数据源名称 */
  name: string
  /** 数据源类型 */
  type: 'static' | 'api' | 'websocket' | 'mqtt' | 'database'
  /** 数据源描述 */
  description?: string
  /** 数据源状态 */
  status: 'active' | 'inactive' | 'error'
  /** 数据结构示例 */
  schema?: Record<string, any>
  /** 配置信息 */
  config?: Record<string, any>
  /** 最后更新时间 */
  lastUpdated?: Date
}

/**
 * 组件配置结构
 * 用于存储组件的完整配置信息
 */
export interface WidgetConfiguration {
  /** 静态参数配置 */
  staticParams: Record<string, any>
  /** 数据源绑定配置 */
  dataSourceBindings: Record<
    string,
    {
      /** 绑定的数据源ID */
      dataSourceId: string
      /** 字段映射配置 */
      fieldMappings: Record<string, string>
    }
  >
  /** 配置元数据 */
  metadata?: {
    version: string
    createdAt: Date
    updatedAt: Date
  }
}

export interface IComponentDefinition extends ComponentDefinition {
  id: string
  meta: {
    name: string
    title: string
    description: string
    category: string
    icon?: string
    version: string
    poster?: string
  }
  defaultSize: {
    width: number
    height: number
  }
  minSize?: {
    width: number
    height: number
  }
}

// ============ 布局和渲染系统相关类型 ============

/**
 * 位置坐标
 */
export interface Position {
  x: number
  y: number
}

/**
 * 尺寸
 */
export interface Size {
  width: number
  height: number
}

/**
 * 布局项接口
 */
export interface LayoutItem {
  /** 布局项ID */
  i: string
  /** 水平网格位置 */
  x: number
  /** 垂直网格位置 */
  y: number
  /** 宽度（网格单位） */
  w: number
  /** 高度（网格单位） */
  h: number
  /** 最小宽度 */
  minW?: number
  /** 最小高度 */
  minH?: number
  /** 最大宽度 */
  maxW?: number
  /** 最大高度 */
  maxH?: number
  /** 是否可移动 */
  moved?: boolean
  /** 是否静态（不可拖拽和调整大小） */
  static?: boolean
  /** 是否可调整大小 */
  resizeHandles?: string[]
  /** 是否可拖拽 */
  isDraggable?: boolean
  /** 是否可调整大小 */
  isResizable?: boolean
}

/**
 * Canvas布局项
 */
export interface CanvasItem {
  /** 项目ID */
  id: string
  /** 绝对位置 */
  position: Position
  /** 尺寸 */
  size: Size
  /** 旋转角度 */
  rotation?: number
  /** 缩放比例 */
  scale?: number
  /** 层级 */
  zIndex?: number
  /** 是否锁定位置 */
  locked?: boolean
  /** 是否可见 */
  visible?: boolean
}

/**
 * 组件实例接口
 */
export interface ComponentInstance<TConfig = Record<string, any>> {
  /** 实例唯一ID */
  id: string
  /** 组件类型 */
  type: string
  /** 组件名称 */
  name: string
  /** 组件配置 */
  config: TConfig
  /** 布局信息 */
  layout: LayoutItem | CanvasItem
  /** 创建时间 */
  createdAt?: Date
  /** 更新时间 */
  updatedAt?: Date
  /** 是否选中 */
  selected?: boolean
  /** 是否锁定 */
  locked?: boolean
  /** 是否可见 */
  visible?: boolean
  /** 自定义属性 */
  props?: Record<string, any>
}

/**
 * 渲染器类型
 */
export type RendererType = 'canvas' | 'gridstack' | 'gridlayout-plus' | 'custom'

/**
 * 渲染器配置
 */
export interface RendererConfig {
  /** 渲染器类型 */
  type: RendererType
  /** 渲染器特定配置 */
  options: Record<string, any>
  /** 是否启用 */
  enabled?: boolean
}

/**
 * Panel配置接口
 */
export interface PanelConfig {
  /** Panel唯一ID */
  id: string
  /** Panel名称 */
  name: string
  /** Panel描述 */
  description?: string
  /** 使用的渲染器 */
  renderer: RendererConfig
  /** 组件实例列表 */
  components: ComponentInstance[]
  /** Panel设置 */
  settings?: Record<string, any>
  /** 创建时间 */
  createdAt?: Date
  /** 更新时间 */
  updatedAt?: Date
}

// ============ 数据绑定和更新相关类型 ============

/**
 * 数据更新事件
 */
export interface DataUpdateEvent {
  /** 组件ID */
  componentId: string
  /** 数据源Key */
  dataSourceKey: string
  /** 新数据 */
  newData: any
  /** 旧数据 */
  oldData?: any
  /** 更新时间戳 */
  timestamp: number
  /** 更新来源 */
  source: 'timer' | 'websocket' | 'manual' | 'event'
}

/**
 * 组件生命周期钩子
 */
export interface ComponentLifecycleHooks {
  /** 组件创建前 */
  beforeCreate?: () => void
  /** 组件创建后 */
  created?: () => void
  /** 组件挂载前 */
  beforeMount?: () => void
  /** 组件挂载后 */
  mounted?: () => void
  /** 组件更新前 */
  beforeUpdate?: (newData: any, oldData: any) => void
  /** 组件更新后 */
  updated?: (newData: any, oldData: any) => void
  /** 组件销毁前 */
  beforeUnmount?: () => void
  /** 组件销毁后 */
  unmounted?: () => void
}

// ============ 导出所有类型 ============

/**
 * Card2.1 核心类型导出
 */
export type {
  // 基础类型
  ComponentPermission,
  MetricItem,
  
  // 组件相关
  ComponentDefinition,
  IComponentRegistry,
  IConfigComponent,
  IComponentDefinition,
  
  // 静态参数
  StaticParamRequirement,
  
  // 数据源
  DataSourceRequirement,
  DataSourceInfo,
  
  // 配置相关
  WidgetConfiguration,
  
  // 布局和渲染
  Position,
  Size,
  LayoutItem,
  CanvasItem,
  ComponentInstance,
  RendererType,
  RendererConfig,
  PanelConfig,
  
  // 数据更新
  DataUpdateEvent,
  ComponentLifecycleHooks
}
