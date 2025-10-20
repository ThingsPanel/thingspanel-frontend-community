/**
 * 验证工具函数
 */

/**
 * 验证组件定义
 */
export function validateComponentDefinition(definition: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!definition) {
    errors.push('组件定义不能为空')
    return { isValid: false, errors }
  }

  if (typeof definition.type !== 'string' || !definition.type.trim()) {
    errors.push('组件类型 (type) 必须是非空字符串')
  }

  if (typeof definition.name !== 'string' || !definition.name.trim()) {
    errors.push('组件名称 (name) 必须是非空字符串')
  }

  if (!definition.component) {
    errors.push('组件实例 (component) 不能为空')
  } else if (typeof definition.component !== 'object' && typeof definition.component !== 'function') {
    errors.push('组件实例 (component) 必须是有效的 Vue 组件')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * 验证数据源需求
 */
export function validateDataSourceRequirements(dataSources: any[]): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!Array.isArray(dataSources)) {
    errors.push('数据源需求必须是数组')
    return { isValid: false, errors }
  }

  dataSources.forEach((ds, index) => {
    if (!ds.key || typeof ds.key !== 'string') {
      errors.push(`数据源 ${index} 缺少有效的 key 字段`)
    }
    if (!ds.type || !['static', 'dynamic', 'websocket'].includes(ds.type)) {
      errors.push(`数据源 ${index} 的 type 必须是 static、dynamic 或 websocket`)
    }
  })

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * 验证属性白名单
 */
export function validatePropertyWhitelist(whitelist: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!whitelist || typeof whitelist !== 'object') {
    errors.push('属性白名单必须是对象')
    return { isValid: false, errors }
  }

  Object.entries(whitelist).forEach(([propName, config]) => {
    if (!config || typeof config !== 'object') {
      errors.push(`属性 ${propName} 的配置必须是对象`)
      return
    }

    if (!config.type || !['string', 'number', 'boolean', 'array', 'object'].includes(config.type)) {
      errors.push(`属性 ${propName} 的 type 必须是有效的类型`)
    }

    if (!config.label || typeof config.label !== 'string') {
      errors.push(`属性 ${propName} 的 label 必须是非空字符串`)
    }
  })

  return {
    isValid: errors.length === 0,
    errors
  }
}