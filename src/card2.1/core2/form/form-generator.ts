/**
 * 表单生成器
 * 根据组件定义自动生成配置表单
 */

import type { ComponentDefinition, TSConfig, FormField, FormGroup } from '../types'
import { ConfigManager } from './config-manager'

/**
 * 表单生成器类
 */
export class FormGenerator {
  /**
   * 根据组件定义生成表单配置
   */
  static generateFormConfig(definition: ComponentDefinition): TSConfig {
    // 如果组件已经有配置，直接返回
    if (definition.defaultConfig?.staticParams) {
      return this.generateFromStaticParams(definition)
    }

    // 如果组件有属性白名单，基于白名单生成
    if (definition.propertyWhitelist) {
      return this.generateFromPropertyWhitelist(definition)
    }

    // 生成默认配置
    return this.generateDefaultConfig(definition)
  }

  /**
   * 基于静态参数生成表单配置
   */
  private static generateFromStaticParams(definition: ComponentDefinition): TSConfig {
    const staticParams = definition.defaultConfig?.staticParams || {}
    const fields: FormField[] = []

    Object.entries(staticParams).forEach(([key, value]) => {
      const field = this.inferFieldFromValue(key, value)
      if (field) {
        fields.push(field)
      }
    })

    return {
      title: `${definition.name} 配置`,
      description: definition.description,
      fields,
      groups: this.generateDefaultGroups(fields)
    }
  }

  /**
   * 基于属性白名单生成表单配置
   */
  private static generateFromPropertyWhitelist(definition: ComponentDefinition): TSConfig {
    const whitelist = definition.propertyWhitelist || {}
    const fields: FormField[] = []

    Object.entries(whitelist).forEach(([propName, config]) => {
      const field: FormField = {
        type: this.mapPropertyTypeToFieldType(config.type),
        label: config.label,
        field: propName,
        group: config.group || '基础配置',
        placeholder: config.description || '',
        defaultValue: config.defaultValue,
        required: config.required || false,
        options: config.options || [],
        description: config.description || '',
        hidden: config.hidden || false,
        disabled: config.disabled || false
      }
      fields.push(field)
    })

    return {
      title: `${definition.name} 配置`,
      description: definition.description,
      fields,
      groups: this.generateDefaultGroups(fields)
    }
  }

  /**
   * 生成默认配置
   */
  private static generateDefaultConfig(definition: ComponentDefinition): TSConfig {
    return ConfigManager.generateDefaultTSConfig(definition.type)
  }

  /**
   * 根据值推断字段类型
   */
  private static inferFieldFromValue(key: string, value: any): FormField | null {
    const field: FormField = {
      type: 'input',
      label: this.formatLabel(key),
      field: key,
      group: '基础配置',
      defaultValue: value
    }

    // 根据值类型推断字段类型
    if (typeof value === 'boolean') {
      field.type = 'switch'
    } else if (typeof value === 'number') {
      field.type = 'number'
    } else if (Array.isArray(value)) {
      field.type = 'select'
      field.options = value.map((item, index) => ({
        label: `选项 ${index + 1}`,
        value: item
      }))
    } else if (typeof value === 'object' && value !== null) {
      field.type = 'json'
    }

    return field
  }

  /**
   * 格式化标签
   */
  private static formatLabel(key: string): string {
    // 将 camelCase 转换为中文标签
    const labelMap: Record<string, string> = {
      deviceId: '设备ID',
      metricsList: '指标列表',
      name: '名称',
      description: '描述',
      title: '标题',
      size: '尺寸',
      color: '颜色',
      enabled: '启用状态'
    }

    return labelMap[key] || key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
  }

  /**
   * 映射属性类型到字段类型
   */
  private static mapPropertyTypeToFieldType(propertyType: string): string {
    const typeMap: Record<string, string> = {
      string: 'input',
      number: 'number',
      boolean: 'switch',
      array: 'select',
      object: 'json'
    }

    return typeMap[propertyType] || 'input'
  }

  /**
   * 生成默认分组
   */
  private static generateDefaultGroups(fields: FormField[]): FormGroup[] {
    const groups: Record<string, FormGroup> = {}

    fields.forEach(field => {
      const groupName = field.group || '基础配置'
      if (!groups[groupName]) {
        groups[groupName] = {
          name: groupName.toLowerCase().replace(/\s+/g, '-'),
          label: groupName,
          description: `${groupName}相关配置项`,
          fields: [],
          collapsible: true,
          defaultExpanded: true
        }
      }
      groups[groupName].fields.push(field.field)
    })

    return Object.values(groups)
  }

  /**
   * 验证表单配置
   */
  static validateFormConfig(config: TSConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!config.fields || !Array.isArray(config.fields)) {
      errors.push('表单配置必须包含 fields 数组')
      return { valid: false, errors }
    }

    config.fields.forEach((field, index) => {
      if (!field.type) {
        errors.push(`字段 ${index} 缺少 type 属性`)
      }
      if (!field.label) {
        errors.push(`字段 ${index} 缺少 label 属性`)
      }
      if (!field.field) {
        errors.push(`字段 ${index} 缺少 field 属性`)
      }
    })

    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * 获取表单统计信息
   */
  static getFormStats(config: TSConfig): {
    fieldCount: number
    groupCount: number
    requiredFieldCount: number
    fieldTypes: Record<string, number>
  } {
    const fieldCount = config.fields?.length || 0
    const groupCount = config.groups?.length || 0
    const requiredFieldCount = config.fields?.filter(field => field.required).length || 0

    const fieldTypes: Record<string, number> = {}
    config.fields?.forEach(field => {
      fieldTypes[field.type] = (fieldTypes[field.type] || 0) + 1
    })

    return {
      fieldCount,
      groupCount,
      requiredFieldCount,
      fieldTypes
    }
  }
}

/**
 * 全局表单生成器实例
 */
export const formGenerator = FormGenerator

/**
 * 默认导出
 */
export default FormGenerator