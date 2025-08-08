/**
 * Card2.1 核心类型定义
 * 简洁明了的类型系统
 */

import type { Component } from 'vue'
import type { ComponentDataSourceDefinition } from '../../components/visual-editor/types/data-source'

// 权限类型定义
export type ComponentPermission = '不限' | 'TENANT_ADMIN' | 'TENANT_USER' | 'SYS_ADMIN'

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
  dataSourceDefinitions?: ComponentDataSourceDefinition[]
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
}

export interface IComponentRegistry {
  register(id: string, definition: ComponentDefinition): void
  get(id: string): ComponentDefinition | undefined
  getAll(): ComponentDefinition[]
  has(id: string): boolean
}

export type IConfigComponent = Component

// 保持向后兼容
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
