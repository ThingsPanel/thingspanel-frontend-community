/**
 * Card2.1 灵活配置管理器
 * 负责检测配置模式和生成表单
 */
import type { Component } from 'vue'
import type { TSConfig, ConfigMode, ConfigValues } from '@/card2.1/types/setting-config'

export class FlexibleConfigManager {
  /**
   * 检测配置模式
   */
  static detectConfigMode(vueConfig?: Component, tsConfig?: TSConfig): ConfigMode {
    if (vueConfig && tsConfig) {
      return 'hybrid'
    } else if (tsConfig) {
      return 'standard'
    } else if (vueConfig) {
      return 'vue-component'
    }

    throw new Error('至少需要提供一种配置方式')
  }

  /**
   * 获取默认配置值
   */
  static getDefaultValues(tsConfig?: TSConfig): ConfigValues {
    if (!tsConfig) return {}

    const defaults: ConfigValues = {}

    tsConfig.fields.forEach(field => {
      if (field.defaultValue !== undefined) {
        defaults[field.key] = field.defaultValue
      }
    })

    return defaults
  }

  /**
   * 验证配置值
   */
  static validateValues(
    values: ConfigValues,
    tsConfig?: TSConfig
  ): {
    valid: boolean
    errors: string[]
  } {
    const errors: string[] = []

    if (!tsConfig) {
      return { valid: true, errors: [] }
    }

    tsConfig.fields.forEach(field => {
      const value = values[field.key]

      // 必填检查
      if (field.required && (value === undefined || value === null || value === '')) {
        errors.push(`${field.label} 是必填字段`)
        return
      }

      // 类型检查
      if (value !== undefined) {
        switch (field.type) {
          case 'number':
            if (typeof value !== 'number' || isNaN(value)) {
              errors.push(`${field.label} 必须是数字`)
            } else {
              if (field.min !== undefined && value < field.min) {
                errors.push(`${field.label} 不能小于 ${field.min}`)
              }
              if (field.max !== undefined && value > field.max) {
                errors.push(`${field.label} 不能大于 ${field.max}`)
              }
            }
            break

          case 'string':
          case 'textarea':
            if (typeof value !== 'string') {
              errors.push(`${field.label} 必须是文本`)
            }
            break

          case 'boolean':
            if (typeof value !== 'boolean') {
              errors.push(`${field.label} 必须是布尔值`)
            }
            break

          case 'select':
            if (field.options && !field.options.some(opt => opt.value === value)) {
              errors.push(`${field.label} 的值不在可选范围内`)
            }
            break
        }
      }
    })

    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * 合并配置值（用于混合模式）
   */
  static mergeValues(tsValues: ConfigValues, vueValues: ConfigValues): ConfigValues {
    return {
      ...tsValues,
      ...vueValues
    }
  }

  /**
   * 获取分组后的字段
   */
  static getGroupedFields(tsConfig: TSConfig): Array<{
    name: string
    label: string
    fields: TSConfig['fields']
  }> {
    if (!tsConfig.groups || tsConfig.groups.length === 0) {
      return [
        {
          name: 'default',
          label: '基本配置',
          fields: tsConfig.fields
        }
      ]
    }

    return tsConfig.groups.map(group => ({
      name: group.name,
      label: group.label,
      fields: tsConfig.fields.filter(field => group.fields.includes(field.key) || field.group === group.name)
    }))
  }
}

// 导出单例
export const configManager = new FlexibleConfigManager()
