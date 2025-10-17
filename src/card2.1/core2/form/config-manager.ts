/**
 * 配置管理器
 * 简化的配置模式检测和管理功能
 */

import type { Component } from 'vue'
import type { TSConfig, ConfigMode, FormField, FormGroup } from '../types'

/**
 * 配置管理器类
 */
export class ConfigManager {
  /**
   * 检测配置模式
   */
  static detectConfigMode(vueConfig?: Component, tsConfig?: TSConfig): ConfigMode {
    const hasVueConfig = !!vueConfig
    const hasTSConfig = !!(tsConfig?.fields && tsConfig.fields.length > 0)

    if (hasVueConfig && hasTSConfig) {
      return 'hybrid'
    } else if (hasVueConfig) {
      return 'vue-component'
    } else if (hasTSConfig) {
      return 'standard'
    } else {
      return 'standard' // 默认模式
    }
  }

  /**
   * 验证 TS 配置
   */
  static validateTSConfig(tsConfig?: TSConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!tsConfig) {
      return { valid: true, errors: [] } // 可选配置
    }

    if (!tsConfig.fields) {
      errors.push('TSConfig 必须包含 fields 属性')
    } else if (!Array.isArray(tsConfig.fields)) {
      errors.push('TSConfig.fields 必须是数组')
    } else {
      // 验证字段配置
      tsConfig.fields.forEach((field, index) => {
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
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * 验证 Vue 配置
   */
  static validateVueConfig(vueConfig?: Component): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!vueConfig) {
      return { valid: true, errors: [] } // 可选配置
    }

    if (typeof vueConfig !== 'object' && typeof vueConfig !== 'function') {
      errors.push('VueConfig 必须是有效的 Vue 组件')
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * 合并配置验证结果
   */
  static validateConfigs(tsConfig?: TSConfig, vueConfig?: Component): { valid: boolean; errors: string[] } {
    const tsValidation = this.validateTSConfig(tsConfig)
    const vueValidation = this.validateVueConfig(vueConfig)

    return {
      valid: tsValidation.valid && vueValidation.valid,
      errors: [...tsValidation.errors, ...vueValidation.errors]
    }
  }

  /**
   * 获取配置模式描述
   */
  static getModeDescription(mode: ConfigMode): string {
    switch (mode) {
      case 'standard':
        return '标准配置模式：使用 TypeScript 配置定义表单'
      case 'vue-component':
        return 'Vue 组件模式：使用自定义 Vue 组件渲染配置界面'
      case 'hybrid':
        return '混合模式：同时使用 TypeScript 配置和 Vue 组件'
      default:
        return '未知配置模式'
    }
  }

  /**
   * 检查配置是否为空
   */
  static isEmptyConfig(tsConfig?: TSConfig, vueConfig?: Component): boolean {
    const hasFields = tsConfig?.fields && tsConfig.fields.length > 0
    const hasVueComponent = !!vueConfig

    return !hasFields && !hasVueComponent
  }

  /**
   * 生成默认的 TS 配置
   */
  static generateDefaultTSConfig(componentType: string): TSConfig {
    return {
      title: `${componentType} 配置`,
      description: `${componentType} 组件的基础配置项`,
      fields: [
        {
          type: 'input',
          label: '组件名称',
          field: 'name',
          group: '基础设置',
          placeholder: '请输入组件名称',
          defaultValue: componentType,
          required: true
        },
        {
          type: 'textarea',
          label: '组件描述',
          field: 'description',
          group: '基础设置',
          placeholder: '请输入组件描述'
        }
      ],
      groups: [
        {
          name: 'basic',
          label: '基础设置',
          description: '组件的基本配置项',
          fields: ['name', 'description'],
          collapsible: false,
          defaultExpanded: true
        }
      ]
    }
  }

  /**
   * 标准化表单字段
   */
  static normalizeFormField(field: Partial<FormField>): FormField {
    return {
      type: field.type || 'input',
      label: field.label || '未命名字段',
      field: field.field || '',
      group: field.group || '基础设置',
      placeholder: field.placeholder || '',
      defaultValue: field.defaultValue,
      required: field.required || false,
      options: field.options || [],
      description: field.description || '',
      hidden: field.hidden || false,
      disabled: field.disabled || false
    }
  }

  /**
   * 标准化表单分组
   */
  static normalizeFormGroup(group: Partial<FormGroup>): FormGroup {
    return {
      name: group.name || 'default',
      label: group.label || '默认分组',
      description: group.description || '',
      fields: group.fields || [],
      collapsible: group.collapsible !== undefined ? group.collapsible : true,
      defaultExpanded: group.defaultExpanded !== undefined ? group.defaultExpanded : true
    }
  }
}

/**
 * 默认导出
 */
export default ConfigManager