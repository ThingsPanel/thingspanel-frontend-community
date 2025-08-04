/**
 * Card2.1 核心类型定义
 * 简洁明了的类型系统
 */

import type { Component } from 'vue'

export interface IComponentDefinition {
  id: string
  component: Component
  meta: {
    name: string
    title: string
    description: string
    category: string
    icon?: string
    version: string
    poster?: string
  }
  properties?: Record<string, any>
  configComponent?: Component
  defaultSize: {
    width: number
    height: number
  }
  minSize?: {
    width: number
    height: number
  }
}

export interface IComponentRegistry {
  register(id: string, definition: IComponentDefinition): void
  get(id: string): IComponentDefinition | undefined
  getAll(): IComponentDefinition[]
  has(id: string): boolean
}

export type IConfigComponent = Component
