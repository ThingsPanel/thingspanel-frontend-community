/**
 * Card2.1 核心类型定义
 * 提供完整、一致、类型安全的组件系统类型
 */

import type { Component } from 'vue'
import type { ComponentInteractionDefinition } from './interaction-types'

// ============ 基础类型 ============

/**
 * 组件权限类型
 */
export type ComponentPermission = '不限' | 'TENANT_ADMIN' | 'TENANT_USER' | 'SYS_ADMIN'

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

// ============ 布局系统类型 ============

/**
 * 网格布局项
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
  /** 是否可拖拽 */
  isDraggable?: boolean
  /** 是否可调整大小 */
  isResizable?: boolean
}

/**
 * Canvas 自由布局项
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
 * 渲染器类型
 */
export type RendererType = 'canvas' | 'gridstack' | 'gridlayout-plus' | 'custom'

// ============ 数据源系统类型 ============

// ============ 简化的数据字段类型（从data-binding/types.ts精简整合） ============

/**
 * 数据字段类型定义
 * 简化的类型系统，支持常见的数据类型
 */
export type DataFieldType = 'value' | 'object' | 'array' | 'string' | 'number' | 'boolean' | 'date'

/**
 * 数据验证规则
 * 简化的验证系统
 */
export interface DataValidationRule {
  /** 最小值/最小长度 */
  min?: number
  /** 最大值/最大长度 */
  max?: number
  /** 正则表达式验证 */
  pattern?: string
  /** 枚举值限制 */
  enum?: any[]
  /** 自定义验证函数名（字符串形式，用于序列化） */
  customValidator?: string
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
  supportedTypes: Array<'static' | 'api' | 'websocket' | 'mqtt' | 'database' | 'script'>
  
  /** 🔥 统一标准：示例数据（用于调试和配置界面显示） */
  example?: Record<string, any>
  
  /** 字段映射规则 */
  fieldMappings?: Record<string, {
    /** 目标字段名 */
    targetField: string
    /** 字段类型 */
    type: DataFieldType
    /** 是否必填 */
    required: boolean
    /** 默认值 */
    defaultValue?: any
    /** 数据转换函数 */
    transform?: string
    /** 验证规则 */
    validation?: DataValidationRule
  }>
  
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
}

/**
 * 静态参数需求定义
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

// ============ 组件定义系统 ============

/**
 * 组件定义核心接口
 * 支持泛型配置，确保类型安全
 */
export interface ComponentDefinition<TConfig = Record<string, any>> {
  // 基础信息
  /** 组件类型标识 */
  type: string
  /** 组件显示名称 */
  name: string
  /** 组件描述 */
  description: string
  /** 组件分类（可选，由自动注册系统根据文件夹路径设置） */
  category?: string
  /** 子分类 */
  subCategory?: string
  /** 主分类 */
  mainCategory?: string
  /** 图标（SVG字符串） */
  icon: string
  /** 组件版本 */
  version?: string
  /** 组件作者 */
  author?: string
  /** 标签 */
  tags?: string[]

  // 组件实现
  /** Vue 组件 */
  component: Component
  /** 配置组件 */
  configComponent?: Component

  // 配置系统
  /** 默认配置对象 */
  defaultConfig?: TConfig
  /** 设置配置 - 用于属性暴露和配置面板 */
  settingConfig?: any[]

  // 布局系统
  /** 默认布局配置 */
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
  
  /** 布局选项 */
  layout?: {
    defaultSize?: Size
    minSize?: Size
    maxSize?: Size
    resizable?: boolean
  }

  // 数据系统
  /** 数据源需求 */
  dataSources?: DataSourceRequirement[]
  /** 静态参数需求 */
  staticParams?: StaticParamRequirement[]

  // 功能特性
  /** 特性标记 */
  features?: {
    realtime?: boolean      // 支持实时数据
    dataBinding?: boolean   // 支持数据绑定
    themeable?: boolean     // 支持主题定制
    responsive?: boolean    // 支持响应式
    configurable?: boolean  // 支持配置定制
  }

  /** 性能配置 */
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

  // 权限和注册
  /** 权限配置 */
  permission?: ComponentPermission
  /** 是否注册到系统 */
  isRegistered?: boolean

  // 交互系统
  /** 交互能力定义 */
  interaction?: ComponentInteractionDefinition

  // 通用属性（兼容现有系统）
  /** 设备ID - 用于设备关联和模板配置 */
  deviceId?: string
  /** 指标列表 - 存储从模板配置的指标信息 */
  metricsList?: MetricItem[]

  // 遗留字段（保持向后兼容）
  config?: Record<string, any>
  supportedDataSources?: string[]
  documentation?: Record<string, any>
  properties?: Record<string, {
    type: string
    default: any
    description: string
    label?: string
    placeholder?: string
    min?: number
    max?: number
    step?: number
    options?: Array<{ label: string; value: any }>
  }>
}

// ============ 组件实例和配置 ============

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
 * 组件配置结构
 */
export interface WidgetConfiguration {
  /** 静态参数配置 */
  staticParams: Record<string, any>
  /** 数据源绑定配置 */
  dataSourceBindings: Record<string, {
    /** 绑定的数据源ID */
    dataSourceId: string
    /** 字段映射配置 */
    fieldMappings: Record<string, string>
  }>
  /** 配置元数据 */
  metadata?: {
    version: string
    createdAt: Date
    updatedAt: Date
  }
}

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

// ============ 数据系统类型 ============

/**
 * 数据源信息接口
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

// ============ 注册系统类型 ============

/**
 * 组件注册接口
 */
export interface IComponentRegistry {
  register(id: string, definition: ComponentDefinition): void
  get(id: string): ComponentDefinition | undefined
  getAll(): ComponentDefinition[]
  has(id: string): boolean
}

/**
 * 配置组件类型
 */
export type IConfigComponent = Component

/**
 * 扩展的组件定义接口（用于编辑器集成）
 */
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
  defaultSize: Size
  minSize?: Size
}