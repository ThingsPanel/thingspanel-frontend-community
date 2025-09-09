/**
 * 组件数据需求声明系统
 * 为 Card2.1 组件提供数据需求声明和注册功能
 *
 * 这是对 data-binding 系统的扩展，专注于组件数据需求的声明式定义
 */

import type { ComponentDataRequirement, DataFieldRequirement } from './data-binding/types'
import { ComponentRequirementManager } from './data-binding/component-requirement-manager'

// 创建全局实例
export const componentDataRequirementsRegistry = new ComponentRequirementManager()

/**
 * 数据字段类型定义
 */
export type DataFieldType = 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object'

/**
 * 数据字段枚举选项
 */
export interface DataFieldEnumOption {
  label: string
  value: any
  description?: string
}

/**
 * 数据字段验证规则
 */
export interface DataFieldValidation {
  required?: boolean
  min?: number
  max?: number
  minLength?: number
  maxLength?: number
  pattern?: string
  enum?: any[]
  custom?: (value: any) => boolean | string
}

/**
 * 数据字段配置选项
 */
export interface DataFieldOptions {
  description?: string
  required?: boolean
  defaultValue?: any
  example?: any
  validation?: DataFieldValidation
  enum?: DataFieldEnumOption[]
  itemSchema?: any // 用于数组类型的项目模式
  tags?: string[]
  group?: string
  [key: string]: any
}

/**
 * 数据更新配置
 */
export interface DataUpdateConfig {
  supportedTriggers: ('timer' | 'websocket' | 'manual' | 'event' | 'mqtt')[]
  recommendedInterval?: number
  minInterval?: number
  maxInterval?: number
  validation?: {
    requiredFields?: string[]
    stringFields?: string[]
    numericFields?: string[]
    booleanFields?: string[]
    enumFields?: Array<{ field: string; values: any[] }>
  }
}

/**
 * 使用场景定义
 */
export interface UseCase {
  name: string
  description: string
  exampleData: Record<string, any>
  tags?: string[]
}

/**
 * 主要数据需求定义
 */
export interface PrimaryDataRequirement {
  name: string
  label: string
  description: string
  type: DataFieldType
  required: boolean
  defaultValue?: any
  validation?: DataFieldValidation
  example?: any
  tags?: string[]
}

/**
 * 组件数据需求配置
 */
export interface ComponentDataRequirementConfig {
  description: string
  category?: string
  version?: string
  primaryData: PrimaryDataRequirement
  dataFields: DataFieldRequirement[]
  updateConfig?: DataUpdateConfig
  useCases?: UseCase[]
  tags?: string[]
  metadata?: Record<string, any>
}

/**
 * 创建数据字段定义
 */
export function createDataField(
  name: string,
  label: string,
  type: DataFieldType,
  options: DataFieldOptions = {}
): DataFieldRequirement {
  return {
    name,
    label,
    type,
    description: options.description || '',
    required: options.required || false,
    defaultValue: options.defaultValue,
    validation: options.validation || {},
    example: options.example,
    enum: options.enum,
    itemSchema: options.itemSchema,
    tags: options.tags || [],
    group: options.group,
    metadata: {
      ...options
    }
  }
}

/**
 * 创建组件数据需求声明
 */
export function createDataRequirement(
  componentType: string,
  displayName: string,
  config: ComponentDataRequirementConfig
): ComponentDataRequirement {
  return {
    componentType,
    displayName,
    description: config.description,
    category: config.category || 'default',
    version: config.version || '1.0.0',

    // 主要数据字段
    primaryData: {
      name: config.primaryData.name,
      label: config.primaryData.label,
      description: config.primaryData.description,
      type: config.primaryData.type,
      required: config.primaryData.required,
      defaultValue: config.primaryData.defaultValue,
      validation: config.primaryData.validation || {},
      example: config.primaryData.example,
      tags: config.primaryData.tags || []
    },

    // 数据字段列表
    dataFields: config.dataFields,

    // 数据关系（暂时为空，后续可扩展）
    relationships: [],

    // 更新配置
    updateConfig: config.updateConfig || {
      supportedTriggers: ['timer', 'manual'],
      recommendedInterval: 5000,
      minInterval: 1000
    },

    // 使用场景
    useCases: config.useCases || [],

    // 标签和元数据
    tags: config.tags || [],
    metadata: {
      ...config.metadata,
      createdAt: new Date().toISOString(),
      dataFieldsCount: config.dataFields.length,
      hasValidation: config.dataFields.some(field => field.validation && Object.keys(field.validation).length > 0),
      supportedTriggers: config.updateConfig?.supportedTriggers || ['timer', 'manual']
    }
  }
}

/**
 * 常用数据字段预设
 */
export const CommonDataFields = {
  /**
   * 标题字段
   */
  title: (options: Partial<DataFieldOptions> = {}) =>
    createDataField('title', '标题', 'string', {
      description: '组件的标题文字',
      required: false,
      defaultValue: '',
      maxLength: 100,
      tags: ['title', 'display'],
      ...options
    }),

  /**
   * 内容字段
   */
  content: (options: Partial<DataFieldOptions> = {}) =>
    createDataField('content', '内容', 'string', {
      description: '组件的主要内容',
      required: false,
      defaultValue: '',
      maxLength: 500,
      tags: ['content', 'text'],
      ...options
    }),

  /**
   * 数值字段
   */
  value: (options: Partial<DataFieldOptions> = {}) =>
    createDataField('value', '数值', 'number', {
      description: '组件显示的数值',
      required: false,
      defaultValue: 0,
      tags: ['value', 'number'],
      ...options
    }),

  /**
   * 状态字段
   */
  status: (options: Partial<DataFieldOptions> = {}) =>
    createDataField('status', '状态', 'string', {
      description: '组件的状态',
      required: false,
      defaultValue: 'normal',
      enum: [
        { label: '正常', value: 'normal' },
        { label: '警告', value: 'warning' },
        { label: '错误', value: 'error' }
      ],
      tags: ['status', 'state'],
      ...options
    }),

  /**
   * 时间戳字段
   */
  timestamp: (options: Partial<DataFieldOptions> = {}) =>
    createDataField('timestamp', '时间戳', 'date', {
      description: '数据的时间戳',
      required: false,
      defaultValue: new Date(),
      tags: ['timestamp', 'time'],
      ...options
    }),

  /**
   * 配置对象字段
   */
  config: (options: Partial<DataFieldOptions> = {}) =>
    createDataField('config', '配置', 'object', {
      description: '组件的配置对象',
      required: false,
      defaultValue: {},
      tags: ['config', 'settings'],
      ...options
    }),

  /**
   * 数据列表字段
   */
  dataList: (options: Partial<DataFieldOptions> = {}) =>
    createDataField('dataList', '数据列表', 'array', {
      description: '组件的数据列表',
      required: false,
      defaultValue: [],
      itemSchema: {
        type: 'object',
        properties: {
          label: { type: 'string' },
          value: { type: 'number' }
        }
      },
      tags: ['list', 'data'],
      ...options
    })
}

/**
 * 数据需求验证器
 */
export class DataRequirementValidator {
  /**
   * 验证数据字段定义
   */
  static validateDataField(field: DataFieldRequirement): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!field.name || typeof field.name !== 'string') {
      errors.push('数据字段名称不能为空')
    }

    if (!field.label || typeof field.label !== 'string') {
      errors.push('数据字段标签不能为空')
    }

    if (!field.type) {
      errors.push('数据字段类型不能为空')
    }

    const validTypes: DataFieldType[] = ['string', 'number', 'boolean', 'date', 'array', 'object']
    if (field.type && !validTypes.includes(field.type)) {
      errors.push(`无效的数据字段类型: ${field.type}`)
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * 验证组件数据需求
   */
  static validateDataRequirement(requirement: ComponentDataRequirement): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!requirement.componentType) {
      errors.push('组件类型不能为空')
    }

    if (!requirement.displayName) {
      errors.push('组件显示名称不能为空')
    }

    if (!requirement.primaryData) {
      errors.push('主要数据字段不能为空')
    } else {
      const primaryValidation = this.validateDataField(requirement.primaryData as DataFieldRequirement)
      if (!primaryValidation.valid) {
        errors.push(`主要数据字段验证失败: ${primaryValidation.errors.join(', ')}`)
      }
    }

    if (requirement.dataFields) {
      requirement.dataFields.forEach((field, index) => {
        const fieldValidation = this.validateDataField(field)
        if (!fieldValidation.valid) {
          errors.push(`数据字段 ${index + 1} 验证失败: ${fieldValidation.errors.join(', ')}`)
        }
      })
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }
}

/**
 * 工具函数：获取组件的数据需求统计
 */
export function getDataRequirementStats(requirement: ComponentDataRequirement) {
  return {
    totalFields: requirement.dataFields.length + 1, // +1 for primaryData
    requiredFields:
      requirement.dataFields.filter(field => field.required).length + (requirement.primaryData.required ? 1 : 0),
    fieldTypes: {
      string: requirement.dataFields.filter(field => field.type === 'string').length,
      number: requirement.dataFields.filter(field => field.type === 'number').length,
      boolean: requirement.dataFields.filter(field => field.type === 'boolean').length,
      date: requirement.dataFields.filter(field => field.type === 'date').length,
      array: requirement.dataFields.filter(field => field.type === 'array').length,
      object: requirement.dataFields.filter(field => field.type === 'object').length
    },
    hasValidation: requirement.dataFields.some(field => field.validation && Object.keys(field.validation).length > 0),
    supportedTriggers: requirement.updateConfig?.supportedTriggers || [],
    useCasesCount: requirement.useCases?.length || 0
  }
}

/**
 * 工具函数：生成数据需求的示例数据
 */
export function generateExampleData(requirement: ComponentDataRequirement): Record<string, any> {
  const exampleData: Record<string, any> = {}

  // 添加主要数据字段的示例
  if (requirement.primaryData && requirement.primaryData.example !== undefined) {
    exampleData[requirement.primaryData.name] = requirement.primaryData.example
  }

  // 添加其他数据字段的示例
  requirement.dataFields.forEach(field => {
    if (field.example !== undefined) {
      exampleData[field.name] = field.example
    } else if (field.defaultValue !== undefined) {
      exampleData[field.name] = field.defaultValue
    }
  })

  return exampleData
}

// 导出便捷函数
export { componentDataRequirementsRegistry as registry }

// 默认导出
export default {
  componentDataRequirementsRegistry,
  createDataRequirement,
  createDataField,
  CommonDataFields,
  DataRequirementValidator,
  getDataRequirementStats,
  generateExampleData
}
