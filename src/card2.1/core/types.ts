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

export interface ComponentDefinition {
  type: string
  name: string
  description: string
  category: string
  subCategory?: string // 子分类，用于更细粒度的分组
  mainCategory?: string // 主分类：系统、曲线
  icon: string // 改为string类型，直接使用SVG字符串
  component: Component
  configComponent?: Component
  config?: Record<string, any> // 组件配置
  tags?: string[] // 组件标签
  version?: string // 组件版本
  author?: string // 组件作者
  permission?: ComponentPermission // 权限字段：不限、TENANT_ADMIN、TENANT_USER、SYS_ADMIN
  isRegistered?: boolean // 是否注册字段：true-注册，false-不注册，默认true
  supportedDataSources?: string[] // 支持的数据源类型
  examples?: Array<{
    name: string
    description: string
    config: Record<string, any>
  }> // 示例配置
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
  /** 字段映射规则 */
  fieldMappings: Record<
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
    }
  >
  /** 是否必填 */
  required?: boolean
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
