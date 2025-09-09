/**
 * 组件数据需求声明系统
 * 定义组件如何声明其数据需求
 */

export interface ComponentDataField {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array'
  required: boolean
  description: string
  defaultValue?: any
  validation?: {
    min?: number
    max?: number
    pattern?: string
    enum?: any[]
  }
  examples?: any[]
}

export interface ComponentDataSchema {
  [fieldName: string]: ComponentDataField
}

export interface ComponentDataRequirement {
  componentId: string
  schema: ComponentDataSchema
  // 组件自己声明的数据需求
  getDataRequirements(): ComponentDataSchema
  // 验证数据是否满足需求
  validateData(data: any): ComponentDataValidationResult
}

export interface ComponentDataValidationResult {
  isValid: boolean
  errors: Array<{
    field: string
    message: string
    type: 'missing' | 'type-mismatch' | 'validation-failed'
  }>
  warnings: Array<{
    field: string
    message: string
  }>
}

/**
 * 组件数据需求管理器
 */
export class ComponentSchemaManager {
  private schemas = new Map<string, ComponentDataSchema>()

  /**
   * 注册组件数据需求
   */
  registerSchema(componentId: string, schema: ComponentDataSchema) {
    this.schemas.set(componentId, schema)
  }

  /**
   * 获取组件数据需求
   */
  getSchema(componentId: string): ComponentDataSchema | undefined {
    return this.schemas.get(componentId)
  }

  /**
   * 验证数据是否满足组件需求
   */
  validateComponentData(componentId: string, data: any): ComponentDataValidationResult {
    const schema = this.schemas.get(componentId)
    if (!schema) {
      return {
        isValid: false,
        errors: [{ field: 'schema', message: `组件 ${componentId} 没有注册数据需求`, type: 'missing' }],
        warnings: []
      }
    }

    return this.validateDataAgainstSchema(data, schema)
  }

  /**
   * 根据schema验证数据
   */
  private validateDataAgainstSchema(data: any, schema: ComponentDataSchema): ComponentDataValidationResult {
    const errors: ComponentDataValidationResult['errors'] = []
    const warnings: ComponentDataValidationResult['warnings'] = []

    for (const [fieldName, fieldDef] of Object.entries(schema)) {
      const fieldValue = data?.[fieldName]

      // 检查必填字段
      if (fieldDef.required && (fieldValue === undefined || fieldValue === null)) {
        errors.push({
          field: fieldName,
          message: `必填字段 ${fieldName} 缺失`,
          type: 'missing'
        })
        continue
      }

      // 如果字段存在，检查类型
      if (fieldValue !== undefined && fieldValue !== null) {
        const actualType = Array.isArray(fieldValue) ? 'array' : typeof fieldValue
        if (actualType !== fieldDef.type) {
          errors.push({
            field: fieldName,
            message: `字段 ${fieldName} 类型错误，期望 ${fieldDef.type}，实际 ${actualType}`,
            type: 'type-mismatch'
          })
        }

        // 验证规则
        if (fieldDef.validation) {
          const validationError = this.validateFieldValue(fieldName, fieldValue, fieldDef.validation)
          if (validationError) {
            errors.push({
              field: fieldName,
              message: validationError,
              type: 'validation-failed'
            })
          }
        }
      } else if (!fieldDef.required && fieldDef.defaultValue !== undefined) {
        // 非必填字段有默认值的情况
        warnings.push({
          field: fieldName,
          message: `字段 ${fieldName} 使用默认值: ${JSON.stringify(fieldDef.defaultValue)}`
        })
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * 验证字段值
   */
  private validateFieldValue(
    fieldName: string,
    value: any,
    validation: ComponentDataField['validation']
  ): string | null {
    if (!validation) return null

    // 数值范围验证
    if (typeof value === 'number') {
      if (validation.min !== undefined && value < validation.min) {
        return `字段 ${fieldName} 值 ${value} 小于最小值 ${validation.min}`
      }
      if (validation.max !== undefined && value > validation.max) {
        return `字段 ${fieldName} 值 ${value} 大于最大值 ${validation.max}`
      }
    }

    // 字符串模式验证
    if (typeof value === 'string' && validation.pattern) {
      const regex = new RegExp(validation.pattern)
      if (!regex.test(value)) {
        return `字段 ${fieldName} 值 "${value}" 不符合模式 ${validation.pattern}`
      }
    }

    // 枚举值验证
    if (validation.enum && !validation.enum.includes(value)) {
      return `字段 ${fieldName} 值 "${value}" 不在允许的枚举值中: ${validation.enum.join(', ')}`
    }

    return null
  }

  /**
   * 为组件数据填充默认值
   */
  fillDefaultValues(componentId: string, data: any = {}): any {
    const schema = this.schemas.get(componentId)
    if (!schema) return data

    const result = { ...data }

    for (const [fieldName, fieldDef] of Object.entries(schema)) {
      if (result[fieldName] === undefined && fieldDef.defaultValue !== undefined) {
        result[fieldName] = fieldDef.defaultValue
      }
    }

    return result
  }

  /**
   * 获取组件数据需求的可读描述
   */
  getSchemaDescription(componentId: string): Array<{
    field: string
    type: string
    required: boolean
    description: string
    defaultValue?: any
  }> {
    const schema = this.schemas.get(componentId)
    if (!schema) return []

    return Object.entries(schema).map(([fieldName, fieldDef]) => ({
      field: fieldName,
      type: fieldDef.type,
      required: fieldDef.required,
      description: fieldDef.description,
      defaultValue: fieldDef.defaultValue
    }))
  }

  /**
   * 获取所有已注册的组件列表
   */
  getRegisteredComponents(): string[] {
    return Array.from(this.schemas.keys())
  }
}

// 导出单例
export const componentSchemaManager = new ComponentSchemaManager()
export default componentSchemaManager
