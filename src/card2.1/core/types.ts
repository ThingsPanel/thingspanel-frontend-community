/**
 * Card2.1 核心类型定义
 * 简洁明了的类型系统
 */

import type { Component } from 'vue'
import type { ComponentDataSourceDefinition } from '@/components/visual-editor/types/data-source'

export interface ComponentDefinition {
  type: string
  name: string
  description: string
  category: string
  icon: string
  component: Component
  configComponent?: Component
  dataSourceDefinitions?: ComponentDataSourceDefinition[]
  properties?: Record<
    string,
    {
      type: string
      default: any
      description: string
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
