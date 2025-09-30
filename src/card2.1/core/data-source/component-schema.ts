/**
 * 组件数据模式管理器
 * 管理组件的数据字段定义、验证规则和默认值
 * 用于数据绑定系统中的数据校验和转换
 */

import type { ComponentDefinition, DataFieldType, DataValidationRule } from '@/card2.1/core/types'
import { ComponentRegistry } from '@/card2.1/core/component-registry'

/**
 * 组件字段定义接口
 */
export interface ComponentFieldSchema {
  /** 字段名称 */
  name: string
  /** 字段类型 */
  type: DataFieldType
  /** 字段描述 */
  description?: string
  /** 是否必需 */
  required?: boolean
  /** 默认值 */
  defaultValue?: any
  /** 验证规则 */
  validation?: DataValidationRule
  /** 字段别名（用于数据绑定时的映射） */
  alias?: string[]
}

/**
 * 组件数据模式接口
 */
export interface ComponentSchema {
  /** 组件类型 */
  componentType: string
  /** 字段定义映射 */
  fields: Record<string, ComponentFieldSchema>
  /** 模式版本 */
  version?: string
  /** 创建时间 */
  createdAt?: Date
  /** 更新时间 */
  updatedAt?: Date
}

/**
 * 数据验证结果接口
 */
export interface ValidationResult {
  /** 是否有效 */
  valid: boolean
  /** 验证错误信息 */
  errors: Array<{
    field: string
    message: string
    value?: any
  }>
  /** 处理后的数据 */
  processedData?: Record<string, any>
}

/**
 * 组件数据模式管理器类
 */
export class ComponentSchemaManager {
  /** 组件模式缓存 */
  private schemas = new Map<string, ComponentSchema>()

  /** 默认字段定义（基础通用字段） */
  private readonly defaultFields: Record<string, ComponentFieldSchema> = {
    // 数字指示器常用字段
    value: {
      name: 'value',
      type: 'string',
      description: '主要数值',
      required: false,
      defaultValue: '0',
      alias: ['val', 'number', 'data']
    },
    unit: {
      name: 'unit',
      type: 'string',
      description: '数值单位',
      required: false,
      defaultValue: '',
      alias: ['units', 'measure']
    },
    metricsName: {
      name: 'metricsName',
      type: 'string',
      description: '指标名称',
      required: false,
      defaultValue: '指标',
      alias: ['metricName', 'name', 'title']
    },
    // 通用组件字段
    title: {
      name: 'title',
      type: 'string',
      description: '标题',
      required: false,
      defaultValue: '',
      alias: ['name', 'label']
    },
    description: {
      name: 'description',
      type: 'string',
      description: '描述',
      required: false,
      defaultValue: '',
      alias: ['desc', 'detail']
    },
    amount: {
      name: 'amount',
      type: 'string',
      description: '数量或金额',
      required: false,
      defaultValue: '0',
      alias: ['count', 'quantity']
    },
    // 状态和控制字段
    status: {
      name: 'status',
      type: 'string',
      description: '状态',
      required: false,
      defaultValue: 'normal',
      alias: ['state', 'condition']
    },
    color: {
      name: 'color',
      type: 'string',
      description: '颜色',
      required: false,
      defaultValue: '#1890ff',
      alias: ['backgroundColor', 'bgColor']
    },
    iconName: {
      name: 'iconName',
      type: 'string',
      description: '图标名称',
      required: false,
      defaultValue: 'default',
      alias: ['icon', 'iconType']
    }
  }

  /**
   * 注册或更新组件数据模式
   * @param componentType 组件类型
   * @param schema 组件模式定义
   */
  registerSchema(componentType: string, schema: ComponentSchema): void {

    // 合并默认字段和自定义字段
    const mergedFields = {
      ...this.defaultFields,
      ...schema.fields
    }

    const finalSchema: ComponentSchema = {
      ...schema,
      componentType,
      fields: mergedFields,
      updatedAt: new Date()
    }

    this.schemas.set(componentType, finalSchema)

  }

  /**
   * 从组件定义自动生成数据模式
   * @param definition 组件定义
   */
  generateSchemaFromDefinition(definition: ComponentDefinition): ComponentSchema {
    const fields: Record<string, ComponentFieldSchema> = { ...this.defaultFields }

    // 如果组件定义中有数据源需求，添加对应的字段
    if (definition.dataSources && Array.isArray(definition.dataSources)) {
      definition.dataSources.forEach(dataSource => {
        if (dataSource.example) {
          // 从示例数据中推断字段类型
          Object.keys(dataSource.example).forEach(key => {
            if (!fields[key]) {
              const value = dataSource.example![key]
              const type = this.inferFieldType(value)

              fields[key] = {
                name: key,
                type,
                description: `来自数据源 ${dataSource.name} 的字段`,
                required: false,
                defaultValue: this.getDefaultValueForType(type)
              }
            }
          })
        }
      })
    }

    const schema: ComponentSchema = {
      componentType: definition.type,
      fields,
      version: definition.version || '1.0.0',
      createdAt: new Date(),
      updatedAt: new Date()
    }

    // 自动注册生成的模式
    this.registerSchema(definition.type, schema)

    return schema
  }

  /**
   * 获取组件数据模式
   * @param componentType 组件类型
   * @returns 组件模式或 undefined
   */
  getSchema(componentType: string): ComponentSchema | undefined {
    let schema = this.schemas.get(componentType)

    // 如果没有找到模式，尝试从组件注册表生成
    if (!schema) {
      const definition = ComponentRegistry.get(componentType)
      if (definition) {
        schema = this.generateSchemaFromDefinition(definition)
      } else {
        console.warn(`⚠️ [ComponentSchemaManager] 未找到组件定义: ${componentType}`)
        // 返回基础默认模式
        schema = {
          componentType,
          fields: { ...this.defaultFields },
          version: '1.0.0',
          createdAt: new Date(),
          updatedAt: new Date()
        }
        this.registerSchema(componentType, schema)
      }
    }

    return schema
  }

  /**
   * 验证组件数据
   * @param componentType 组件类型
   * @param data 要验证的数据
   * @returns 验证结果
   */
  validateComponentData(componentType: string, data: Record<string, any>): ValidationResult {
    const schema = this.getSchema(componentType)
    if (!schema) {
      return {
        valid: false,
        errors: [{ field: 'schema', message: `未找到组件 ${componentType} 的数据模式` }]
      }
    }

    const errors: Array<{ field: string; message: string; value?: any }> = []
    const processedData: Record<string, any> = {}

    // 验证每个字段
    for (const [fieldName, fieldSchema] of Object.entries(schema.fields)) {
      const value = data[fieldName]

      // 检查必需字段
      if (fieldSchema.required && (value === undefined || value === null)) {
        errors.push({
          field: fieldName,
          message: `字段 ${fieldName} 是必需的`,
          value
        })
        continue
      }

      // 使用默认值或提供的值
      let finalValue = value !== undefined ? value : fieldSchema.defaultValue

      // 类型转换和验证
      if (finalValue !== undefined) {
        try {
          finalValue = this.convertValueToType(finalValue, fieldSchema.type)

          // 应用验证规则
          if (fieldSchema.validation) {
            const validationError = this.validateField(fieldName, finalValue, fieldSchema.validation)
            if (validationError) {
              errors.push(validationError)
              continue
            }
          }

          processedData[fieldName] = finalValue
        } catch (error) {
          errors.push({
            field: fieldName,
            message: `字段 ${fieldName} 类型转换失败: ${error}`,
            value: finalValue
          })
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      processedData: errors.length === 0 ? processedData : undefined
    }
  }

  /**
   * 获取所有已注册的组件模式
   * @returns 组件模式数组
   */
  getAllSchemas(): ComponentSchema[] {
    return Array.from(this.schemas.values())
  }

  /**
   * 清除指定组件的模式
   * @param componentType 组件类型
   */
  clearSchema(componentType: string): void {
    this.schemas.delete(componentType)
  }

  /**
   * 清除所有组件模式
   */
  clearAllSchemas(): void {
    const count = this.schemas.size
    this.schemas.clear()
  }

  // ==================== 私有方法 ====================

  /**
   * 推断字段类型
   * @param value 字段值
   * @returns 推断的字段类型
   */
  private inferFieldType(value: any): DataFieldType {
    if (typeof value === 'string') return 'string'
    if (typeof value === 'number') return 'number'
    if (typeof value === 'boolean') return 'boolean'
    if (Array.isArray(value)) return 'array'
    if (value instanceof Date) return 'date'
    if (typeof value === 'object' && value !== null) return 'object'
    return 'value' // 默认类型
  }

  /**
   * 获取类型的默认值
   * @param type 字段类型
   * @returns 默认值
   */
  private getDefaultValueForType(type: DataFieldType): any {
    switch (type) {
      case 'string': return ''
      case 'number': return 0
      case 'boolean': return false
      case 'array': return []
      case 'object': return {}
      case 'date': return new Date()
      case 'value':
      default: return null
    }
  }

  /**
   * 将值转换为指定类型
   * @param value 原始值
   * @param type 目标类型
   * @returns 转换后的值
   */
  private convertValueToType(value: any, type: DataFieldType): any {
    if (value === null || value === undefined) {
      return this.getDefaultValueForType(type)
    }

    switch (type) {
      case 'string':
        return String(value)
      case 'number':
        const num = Number(value)
        if (isNaN(num)) throw new Error(`无法转换为数字: ${value}`)
        return num
      case 'boolean':
        if (typeof value === 'boolean') return value
        if (typeof value === 'string') {
          const lower = value.toLowerCase()
          if (lower === 'true' || lower === '1') return true
          if (lower === 'false' || lower === '0') return false
        }
        return Boolean(value)
      case 'array':
        if (Array.isArray(value)) return value
        try {
          return JSON.parse(String(value))
        } catch {
          return [value]
        }
      case 'object':
        if (typeof value === 'object' && value !== null) return value
        try {
          return JSON.parse(String(value))
        } catch {
          return { value }
        }
      case 'date':
        if (value instanceof Date) return value
        const date = new Date(value)
        if (isNaN(date.getTime())) throw new Error(`无法转换为日期: ${value}`)
        return date
      case 'value':
      default:
        return value
    }
  }

  /**
   * 验证字段值
   * @param fieldName 字段名称
   * @param value 字段值
   * @param validation 验证规则
   * @returns 验证错误或 null
   */
  private validateField(
    fieldName: string,
    value: any,
    validation: DataValidationRule
  ): { field: string; message: string; value?: any } | null {
    // 最小值/长度检查
    if (validation.min !== undefined) {
      const length = typeof value === 'string' || Array.isArray(value) ? value.length : value
      if (length < validation.min) {
        return {
          field: fieldName,
          message: `字段 ${fieldName} 的值小于最小要求 ${validation.min}`,
          value
        }
      }
    }

    // 最大值/长度检查
    if (validation.max !== undefined) {
      const length = typeof value === 'string' || Array.isArray(value) ? value.length : value
      if (length > validation.max) {
        return {
          field: fieldName,
          message: `字段 ${fieldName} 的值超过最大限制 ${validation.max}`,
          value
        }
      }
    }

    // 正则表达式检查
    if (validation.pattern && typeof value === 'string') {
      const regex = new RegExp(validation.pattern)
      if (!regex.test(value)) {
        return {
          field: fieldName,
          message: `字段 ${fieldName} 的值不符合格式要求`,
          value
        }
      }
    }

    // 枚举值检查
    if (validation.enum && !validation.enum.includes(value)) {
      return {
        field: fieldName,
        message: `字段 ${fieldName} 的值不在允许的选项中: ${validation.enum.join(', ')}`,
        value
      }
    }

    return null
  }
}

/**
 * 默认组件数据模式管理器实例
 */
export const componentSchemaManager = new ComponentSchemaManager()

/**
 * 创建自定义组件数据模式管理器
 * @returns 新的组件数据模式管理器实例
 */
export function createComponentSchemaManager(): ComponentSchemaManager {
  return new ComponentSchemaManager()
}

// 默认导出
export default componentSchemaManager