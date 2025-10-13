/**
 * 卡片框架接口定义
 * 定义卡片清单的结构和契约
 */

import type { Component } from 'vue'
import type { DataSourceRequirement } from '../noyau/types'

/**
 * 卡片清单（Card Manifest）
 * 描述一个卡片的所有元数据和能力
 */
export interface ICardManifest {
  /** 卡片类型（唯一标识） */
  type: string

  /** 卡片名称 */
  name: string

  /** 卡片描述 */
  description?: string

  /** 卡片图标（SVG 字符串或图标类名） */
  icon?: string

  /** 卡片版本 */
  version?: string

  /** 卡片作者 */
  author?: string

  /** 卡片分类 */
  category?: string

  /** 卡片标签 */
  tags?: string[]

  /** 数据源需求 */
  dataSources?: DataSourceRequirement[]

  /** 静态参数（不需要数据源绑定的配置项） */
  staticParams?: Record<string, StaticParamDefinition>

  /** 交互能力 */
  interactionCapabilities?: {
    /** 支持的事件类型 */
    supportedEvents?: string[]
    /** 可触发的动作类型 */
    availableActions?: string[]
    /** 可监听的属性 */
    watchableProperties?: Record<string, PropertyDefinition>
  }

  /** 渲染实现（支持多渲染器） */
  component: {
    /** Vue 渲染实现 */
    vue: Component
    /** Canvas 渲染实现（可选） */
    canvas?: CanvasRenderFunction
    /** WebGL 渲染实现（可选） */
    webgl?: WebGLRenderFunction
  }

  /** 配置组件（用于编辑器中配置卡片） */
  configComponent?: Component

  /** 默认配置 */
  defaultConfig?: Record<string, any>

  /** 默认布局 */
  defaultLayout?: {
    width: number
    height: number
    minWidth?: number
    minHeight?: number
    maxWidth?: number
    maxHeight?: number
  }

  /** 权限要求 */
  permission?: string

  /** 特性标志 */
  features?: {
    /** 是否支持实时数据 */
    realtime?: boolean
    /** 是否支持数据绑定 */
    dataBinding?: boolean
    /** 是否可配置 */
    configurable?: boolean
    /** 是否可调整大小 */
    resizable?: boolean
  }
}

/**
 * 静态参数定义
 */
export interface StaticParamDefinition {
  /** 参数名称 */
  name: string

  /** 参数描述 */
  description?: string

  /** 参数类型 */
  type: 'string' | 'number' | 'boolean' | 'color' | 'select' | 'object' | 'array'

  /** 默认值 */
  defaultValue?: any

  /** 是否必填 */
  required?: boolean

  /** 选项列表（用于 select 类型） */
  options?: Array<{ label: string; value: any }>
}

/**
 * 属性定义
 */
export interface PropertyDefinition {
  /** 属性类型 */
  type: 'string' | 'number' | 'boolean' | 'object' | 'array'

  /** 属性描述 */
  description?: string

  /** 默认值 */
  defaultValue?: any

  /** 是否只读 */
  readonly?: boolean
}

/**
 * Canvas 渲染函数签名
 */
export type CanvasRenderFunction = (
  ctx: CanvasRenderingContext2D,
  props: Record<string, any>,
  bounds: { x: number; y: number; width: number; height: number }
) => void

/**
 * WebGL 渲染函数签名
 */
export type WebGLRenderFunction = (
  gl: WebGLRenderingContext,
  props: Record<string, any>,
  bounds: { x: number; y: number; width: number; height: number }
) => void

/**
 * 卡片实例
 * 运行时卡片的实例化对象
 */
export interface ICardInstance {
  /** 实例 ID */
  id: string

  /** 卡片类型 */
  type: string

  /** 卡片清单 */
  manifest: ICardManifest

  /** 当前配置 */
  config: Record<string, any>

  /** 当前数据 */
  data: Record<string, any>

  /** 更新配置 */
  updateConfig(config: Record<string, any>): void

  /** 更新数据 */
  updateData(dataKey: string, value: any): void

  /** 销毁实例 */
  destroy(): void
}
