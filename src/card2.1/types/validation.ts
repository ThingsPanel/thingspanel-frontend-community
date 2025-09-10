/**
 * Card2.1 类型验证系统
 * 提供运行时类型验证功能，确保类型定义的正确性
 */

import type {
  ComponentDefinition,
  DataSourceRequirement,
  StaticParamRequirement,
  Setting,
  CustomConfig,
  DataFieldType,
  DataValidationRule
} from './index'

// ============ 验证结果类型 ============

/**
 * 验证结果接口
 */
export interface ValidationResult {
  /** 验证是否通过 */
  valid: boolean
  /** 错误信息列表 */
  errors: string[]
  /** 警告信息列表 */
  warnings: string[]
  /** 验证的对象类型 */
  objectType: string
}

// ============ 基础类型验证 ============

/**
 * 验证数据字段类型
 * @param type 待验证的类型
 * @returns 是否为有效的数据字段类型
 */
export function isValidDataFieldType(type: any): type is DataFieldType {
  const validTypes: DataFieldType[] = ['value', 'object', 'array', 'string', 'number', 'boolean', 'date']
  return typeof type === 'string' && validTypes.includes(type as DataFieldType)
}

/**
 * 验证数据验证规则
 * @param rule 待验证的规则
 * @returns 验证结果
 */
export function validateDataValidationRule(rule: any): ValidationResult {
  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
    objectType: 'DataValidationRule'
  }

  if (rule && typeof rule === 'object') {
    // 检查必要的字段
    const { min, max, pattern, enum: enumValues, customValidator } = rule

    // 验证min/max
    if (min !== undefined && typeof min !== 'number') {
      result.errors.push('min 字段必须是数字类型')
    }
    if (max !== undefined && typeof max !== 'number') {
      result.errors.push('max 字段必须是数字类型')
    }
    if (min !== undefined && max !== undefined && min > max) {
      result.errors.push('min 值不能大于 max 值')
    }

    // 验证pattern
    if (pattern !== undefined) {
      if (typeof pattern !== 'string') {
        result.errors.push('pattern 字段必须是字符串类型')
      } else {
        try {
          new RegExp(pattern)
        } catch (e) {
          result.errors.push('pattern 必须是有效的正则表达式')
        }
      }
    }

    // 验证enum
    if (enumValues !== undefined && !Array.isArray(enumValues)) {
      result.errors.push('enum 字段必须是数组类型')
    }

    // 验证customValidator
    if (customValidator !== undefined && typeof customValidator !== 'string') {
      result.errors.push('customValidator 字段必须是字符串类型')
    }
  } else if (rule !== undefined) {
    result.errors.push('验证规则必须是对象类型')
  }

  result.valid = result.errors.length === 0
  return result
}

// ============ 组件类型验证 ============

/**
 * 验证数据源需求
 * @param requirement 数据源需求对象
 * @returns 验证结果
 */
export function validateDataSourceRequirement(requirement: any): ValidationResult {
  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
    objectType: 'DataSourceRequirement'
  }

  if (!requirement || typeof requirement !== 'object') {
    result.errors.push('数据源需求必须是对象类型')
    result.valid = false
    return result
  }

  const { key, name, description, supportedTypes, fieldMappings, example } = requirement

  // 验证必填字段
  if (!key || typeof key !== 'string') {
    result.errors.push('key 字段是必填的且必须是字符串类型')
  }
  if (!name || typeof name !== 'string') {
    result.errors.push('name 字段是必填的且必须是字符串类型')
  }
  if (!description || typeof description !== 'string') {
    result.errors.push('description 字段是必填的且必须是字符串类型')
  }

  // 验证supportedTypes
  if (!Array.isArray(supportedTypes)) {
    result.errors.push('supportedTypes 必须是数组类型')
  } else {
    const validTypes = ['static', 'api', 'websocket', 'mqtt', 'database', 'script']
    const invalidTypes = supportedTypes.filter(type => !validTypes.includes(type))
    if (invalidTypes.length > 0) {
      result.errors.push(`无效的数据源类型: ${invalidTypes.join(', ')}`)
    }
  }

  // 验证fieldMappings
  if (fieldMappings !== undefined) {
    if (typeof fieldMappings !== 'object' || Array.isArray(fieldMappings)) {
      result.errors.push('fieldMappings 必须是对象类型')
    } else {
      Object.entries(fieldMappings).forEach(([key, mapping]: [string, any]) => {
        if (!mapping || typeof mapping !== 'object') {
          result.errors.push(`fieldMapping[${key}] 必须是对象类型`)
          return
        }

        const { targetField, type, required, defaultValue, validation } = mapping

        if (!targetField || typeof targetField !== 'string') {
          result.errors.push(`fieldMapping[${key}].targetField 是必填的且必须是字符串`)
        }

        if (!isValidDataFieldType(type)) {
          result.errors.push(`fieldMapping[${key}].type 必须是有效的数据字段类型`)
        }

        if (typeof required !== 'boolean') {
          result.errors.push(`fieldMapping[${key}].required 必须是布尔类型`)
        }

        if (validation !== undefined) {
          const validationResult = validateDataValidationRule(validation)
          if (!validationResult.valid) {
            result.errors.push(...validationResult.errors.map(err => `fieldMapping[${key}].validation: ${err}`))
          }
        }
      })
    }
  }

  // 验证example
  if (example !== undefined && (typeof example !== 'object' || Array.isArray(example))) {
    result.warnings.push('example 字段应该是对象类型，用于提供示例数据')
  }

  result.valid = result.errors.length === 0
  return result
}

/**
 * 验证静态参数需求
 * @param requirement 静态参数需求对象
 * @returns 验证结果
 */
export function validateStaticParamRequirement(requirement: any): ValidationResult {
  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
    objectType: 'StaticParamRequirement'
  }

  if (!requirement || typeof requirement !== 'object') {
    result.errors.push('静态参数需求必须是对象类型')
    result.valid = false
    return result
  }

  const { key, name, type, description } = requirement

  // 验证必填字段
  if (!key || typeof key !== 'string') {
    result.errors.push('key 字段是必填的且必须是字符串类型')
  }
  if (!name || typeof name !== 'string') {
    result.errors.push('name 字段是必填的且必须是字符串类型')
  }
  if (!type || !['string', 'number', 'boolean', 'object', 'array'].includes(type)) {
    result.errors.push('type 字段必须是有效的参数类型')
  }
  if (!description || typeof description !== 'string') {
    result.errors.push('description 字段是必填的且必须是字符串类型')
  }

  result.valid = result.errors.length === 0
  return result
}

/**
 * 验证设置项配置
 * @param setting 设置项对象
 * @returns 验证结果
 */
export function validateSetting(setting: any): ValidationResult {
  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
    objectType: 'Setting'
  }

  if (!setting || typeof setting !== 'object') {
    result.errors.push('设置项必须是对象类型')
    result.valid = false
    return result
  }

  const { type, label, field } = setting

  // 验证必填字段
  if (!type || typeof type !== 'string') {
    result.errors.push('type 字段是必填的且必须是字符串类型')
  }
  if (!label || typeof label !== 'string') {
    result.errors.push('label 字段是必填的且必须是字符串类型')
  }
  if (!field || typeof field !== 'string') {
    result.errors.push('field 字段是必填的且必须是字符串类型')
  }

  // 验证选项字段
  if (setting.options !== undefined) {
    if (!Array.isArray(setting.options)) {
      result.errors.push('options 字段必须是数组类型')
    } else {
      setting.options.forEach((option: any, index: number) => {
        if (!option || typeof option !== 'object') {
          result.errors.push(`options[${index}] 必须是对象类型`)
        } else if (!option.label || !option.hasOwnProperty('value')) {
          result.errors.push(`options[${index}] 必须包含 label 和 value 字段`)
        }
      })
    }
  }

  result.valid = result.errors.length === 0
  return result
}

/**
 * 验证组件定义
 * @param definition 组件定义对象
 * @returns 验证结果
 */
export function validateComponentDefinition(definition: any): ValidationResult {
  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
    objectType: 'ComponentDefinition'
  }

  if (!definition || typeof definition !== 'object') {
    result.errors.push('组件定义必须是对象类型')
    result.valid = false
    return result
  }

  const { type, name, description, component, dataSources, staticParams } = definition

  // 验证必填字段
  if (!type || typeof type !== 'string') {
    result.errors.push('type 字段是必填的且必须是字符串类型')
  } else if (!/^[a-z0-9-]+$/.test(type)) {
    result.warnings.push('type 字段建议使用 kebab-case 命名规范')
  }

  if (!name || typeof name !== 'string') {
    result.errors.push('name 字段是必填的且必须是字符串类型')
  }

  if (!description || typeof description !== 'string') {
    result.errors.push('description 字段是必填的且必须是字符串类型')
  }

  if (!component) {
    result.errors.push('component 字段是必填的，必须是Vue组件')
  }

  // 验证数据源需求
  if (dataSources !== undefined) {
    if (!Array.isArray(dataSources)) {
      result.errors.push('dataSources 字段必须是数组类型')
    } else {
      dataSources.forEach((dataSource: any, index: number) => {
        const validationResult = validateDataSourceRequirement(dataSource)
        if (!validationResult.valid) {
          result.errors.push(...validationResult.errors.map(err => `dataSources[${index}]: ${err}`))
        }
        if (validationResult.warnings.length > 0) {
          result.warnings.push(...validationResult.warnings.map(warn => `dataSources[${index}]: ${warn}`))
        }
      })
    }
  }

  // 验证静态参数需求
  if (staticParams !== undefined) {
    if (!Array.isArray(staticParams)) {
      result.errors.push('staticParams 字段必须是数组类型')
    } else {
      staticParams.forEach((staticParam: any, index: number) => {
        const validationResult = validateStaticParamRequirement(staticParam)
        if (!validationResult.valid) {
          result.errors.push(...validationResult.errors.map(err => `staticParams[${index}]: ${err}`))
        }
        if (validationResult.warnings.length > 0) {
          result.warnings.push(...validationResult.warnings.map(warn => `staticParams[${index}]: ${warn}`))
        }
      })
    }
  }

  result.valid = result.errors.length === 0
  return result
}

// ============ 批量验证函数 ============

/**
 * 批量验证组件定义列表
 * @param definitions 组件定义列表
 * @returns 汇总的验证结果
 */
export function validateComponentDefinitions(definitions: any[]): ValidationResult {
  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
    objectType: 'ComponentDefinition[]'
  }

  if (!Array.isArray(definitions)) {
    result.errors.push('组件定义列表必须是数组类型')
    result.valid = false
    return result
  }

  const typeSet = new Set<string>()
  definitions.forEach((definition, index) => {
    const validationResult = validateComponentDefinition(definition)
    
    // 收集错误和警告
    if (!validationResult.valid) {
      result.errors.push(`定义[${index}]: ${validationResult.errors.join(', ')}`)
    }
    if (validationResult.warnings.length > 0) {
      result.warnings.push(`定义[${index}]: ${validationResult.warnings.join(', ')}`)
    }

    // 检查类型重复
    if (definition && definition.type) {
      if (typeSet.has(definition.type)) {
        result.errors.push(`重复的组件类型: ${definition.type}`)
      } else {
        typeSet.add(definition.type)
      }
    }
  })

  result.valid = result.errors.length === 0
  return result
}

// ============ 类型安全工具 ============

/**
 * 类型断言：检查对象是否为有效的组件定义
 * @param obj 待检查的对象
 * @returns 类型守护
 */
export function isValidComponentDefinition(obj: any): obj is ComponentDefinition {
  const result = validateComponentDefinition(obj)
  return result.valid
}

/**
 * 类型断言：检查对象是否为有效的数据源需求
 * @param obj 待检查的对象
 * @returns 类型守护
 */
export function isValidDataSourceRequirement(obj: any): obj is DataSourceRequirement {
  const result = validateDataSourceRequirement(obj)
  return result.valid
}

/**
 * 类型断言：检查对象是否为有效的设置项
 * @param obj 待检查的对象
 * @returns 类型守护
 */
export function isValidSetting(obj: any): obj is Setting {
  const result = validateSetting(obj)
  return result.valid
}

/**
 * 开发模式下的验证警告
 * 在开发环境中输出验证警告信息
 */
export function devModeValidationWarning(result: ValidationResult, objectName: string = '对象'): void {
  if (!import.meta.env.DEV) return

  if (!result.valid) {
    console.error(`❌ [类型验证] ${objectName} 验证失败:`, result.errors)
  }

  if (result.warnings.length > 0) {
    console.warn(`⚠️ [类型验证] ${objectName} 验证警告:`, result.warnings)
  }
}