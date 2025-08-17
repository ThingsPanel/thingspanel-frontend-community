/**
 * Card2.1 灵活配置系统类型定义
 */
import type { Component } from 'vue'

// 支持的字段类型
export type ConfigFieldType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'color'
  | 'select'
  | 'slider'
  | 'textarea'
  | 'vue-component' // 使用Vue组件渲染

// TS配置字段定义
export interface TSConfigField {
  key: string
  label: string
  type: ConfigFieldType
  defaultValue?: any
  description?: string

  // 验证规则
  required?: boolean
  min?: number
  max?: number
  step?: number

  // 选择选项（select类型）
  options?: Array<{ label: string; value: any }>

  // Vue组件相关（vue-component类型）
  component?: Component | string
  props?: Record<string, any>

  // 分组
  group?: string
}

// TS配置定义
export interface TSConfig {
  title?: string
  description?: string
  fields: TSConfigField[]
  groups?: Array<{
    name: string
    label: string
    fields: string[]
  }>
}

// 配置模式
export type ConfigMode = 'vue-only' | 'ts-only' | 'hybrid'

// 组件配置定义（扩展原有的ComponentDefinition）
export interface FlexibleConfigDefinition {
  // 纯Vue配置
  vueConfig?: Component

  // 纯TS配置
  tsConfig?: TSConfig

  // 配置模式（自动检测）
  mode?: ConfigMode
}

// 配置值类型
export interface ConfigValues {
  [key: string]: any
}
