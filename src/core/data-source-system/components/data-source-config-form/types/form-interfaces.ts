/**
 * 表单接口定义
 * 基于DataSourceConfigForm copy.vue中的表单功能分析
 */

import type { RawDataItemType } from './raw-data'
import type { FinalProcessingType } from './final-processing'
import type { ValidationResult } from './validator-types'

// 表单字段基础类型
export interface FormField {
  /** 字段名称 */
  name: string
  /** 字段标签 */
  label: string
  /** 字段类型 */
  type: 'text' | 'number' | 'select' | 'textarea' | 'checkbox' | 'radio' | 'switch' | 'date'
  /** 是否必填 */
  required: boolean
  /** 默认值 */
  defaultValue?: any
  /** 占位符 */
  placeholder?: string
  /** 帮助文本 */
  helpText?: string
  /** 验证规则 */
  validation?: any[]
  /** 字段配置 */
  config?: Record<string, any>
}

// 基础信息表单
export interface BasicInfoForm {
  /** 数据项名称 */
  name: string
  /** 数据项描述 */
  description?: string
  /** 数据类型 */
  type: RawDataItemType
  /** 是否激活 */
  isActive: boolean
}

// JSON数据表单
export interface JsonDataForm {
  /** JSON内容 */
  content: string
  /** 格式化选项 */
  formatting: {
    indent: number
    compact: boolean
  }
}

// HTTP配置表单
export interface HttpConfigForm {
  /** 基本配置 */
  basic: {
    url: string
    method: string
  }
  /** 请求头 */
  headers: Array<{ key: string; value: string }>
  /** URL参数 */
  params: Array<{ key: string; value: string }>
  /** 请求体配置 */
  body: {
    type: 'none' | 'json' | 'form' | 'raw'
    content?: string
    formData?: Array<{ key: string; value: string }>
  }
  /** 脚本配置 */
  scripts: {
    preRequest?: string
    postResponse?: string
  }
  /** 高级配置 */
  advanced: {
    timeout: number
    retryCount: number
    followRedirects: boolean
  }
}

// WebSocket配置表单
export interface WebSocketConfigForm {
  /** WebSocket URL */
  url: string
  /** 协议列表 */
  protocols: string[]
  /** 连接超时 */
  timeout: number
  /** 自动重连 */
  autoReconnect: boolean
  /** 心跳配置 */
  heartbeat: {
    enabled: boolean
    interval: number
    message: string
  }
}

// 数据处理表单
export interface DataProcessingForm {
  /** 过滤配置 */
  filter: {
    enabled: boolean
    path: string
  }
  /** 处理脚本 */
  script: {
    enabled: boolean
    content: string
  }
}

// 最终处理表单
export interface FinalProcessingForm {
  /** 处理类型 */
  type: FinalProcessingType
  /** 自定义脚本内容 */
  script?: string
  /** 特定数据项选择 */
  selectedItemIndex?: number
}

// 表单验证状态
export interface FormValidationState {
  /** 整体验证状态 */
  valid: boolean
  /** 字段验证结果 */
  fields: Record<string, ValidationResult>
  /** 整体错误数量 */
  errorCount: number
  /** 警告数量 */
  warningCount: number
  /** 验证消息列表 */
  messages: Array<{
    field: string
    level: ValidationLevel
    message: string
  }>
}

// 表单提交状态
export interface FormSubmissionState {
  /** 是否正在提交 */
  submitting: boolean
  /** 提交进度 */
  progress: number
  /** 提交结果 */
  result?: {
    success: boolean
    message: string
    data?: any
    error?: string
  }
}

// 表单状态管理器
export interface FormStateManager {
  /** 验证状态 */
  validation: FormValidationState
  /** 提交状态 */
  submission: FormSubmissionState
  /** 是否修改过 */
  isDirty: boolean
  /** 是否正在加载 */
  loading: boolean

  /** 验证整个表单 */
  validate: () => Promise<ValidationResult>
  /** 验证指定字段 */
  validateField: (fieldName: string) => Promise<ValidationResult>
  /** 重置表单 */
  reset: () => void
  /** 提交表单 */
  submit: () => Promise<any>
  /** 设置字段值 */
  setFieldValue: (fieldName: string, value: any) => void
  /** 获取字段值 */
  getFieldValue: (fieldName: string) => any
}
