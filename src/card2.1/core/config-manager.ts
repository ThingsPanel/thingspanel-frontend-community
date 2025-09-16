/**
 * FlexibleConfigManager - 灵活配置管理器
 * 负责检测和管理组件配置模式，支持 TS 配置、Vue 配置和混合配置
 */

import type { Component } from 'vue'
import type { TSConfig, ConfigMode } from '@/card2.1/types/setting-config'

/**
 * 灵活配置管理器
 * 提供配置模式检测和管理功能
 */
export class FlexibleConfigManager {
  /**
   * 检测配置模式
   * @param vueConfig Vue 组件配置
   * @param tsConfig TypeScript 配置
   * @returns 配置模式
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
   * @param tsConfig TypeScript 配置
   * @returns 验证结果
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
   * @param vueConfig Vue 组件配置
   * @returns 验证结果
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
   * @param tsConfig TypeScript 配置
   * @param vueConfig Vue 组件配置
   * @returns 合并的验证结果
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
   * @param mode 配置模式
   * @returns 模式描述
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
   * @param tsConfig TypeScript 配置
   * @param vueConfig Vue 组件配置
   * @returns 是否为空配置
   */
  static isEmptyConfig(tsConfig?: TSConfig, vueConfig?: Component): boolean {
    const hasFields = tsConfig?.fields && tsConfig.fields.length > 0
    const hasVueComponent = !!vueConfig

    return !hasFields && !hasVueComponent
  }

  /**
   * 生成默认的 TS 配置
   * @param componentType 组件类型
   * @returns 默认配置
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
}

/**
 * 配置管理器的工厂方法
 */
export const createConfigManager = () => {
  return FlexibleConfigManager
}

/**
 * 默认导出
 */
export default FlexibleConfigManager