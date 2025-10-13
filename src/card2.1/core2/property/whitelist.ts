/**
 * 白名单管理工具
 * 提供属性白名单的验证、过滤和转换功能
 */

import type { ComponentPropertyWhitelist, PropertyExposureConfig } from '../types'

/**
 * 白名单管理器类
 */
export class WhitelistManager {
  /**
   * 过滤无效的属性配置
   */
  static filterInvalidProperties(whitelist: ComponentPropertyWhitelist): ComponentPropertyWhitelist {
    const filtered: ComponentPropertyWhitelist = {}

    Object.entries(whitelist).forEach(([propName, config]) => {
      if (this.isValidPropertyConfig(config)) {
        filtered[propName] = config
      } else {
        console.warn(`⚠️ [WhitelistManager] 过滤无效属性配置: ${propName}`)
      }
    })

    return filtered
  }

  /**
   * 验证属性配置是否有效
   */
  static isValidPropertyConfig(config: PropertyExposureConfig): boolean {
    if (!config) return false
    if (!config.type || !['string', 'number', 'boolean', 'array', 'object'].includes(config.type)) return false
    if (!config.label || typeof config.label !== 'string') return false
    return true
  }

  /**
   * 标准化属性配置
   */
  static normalizePropertyConfig(config: Partial<PropertyExposureConfig>): PropertyExposureConfig {
    return {
      type: config.type || 'string',
      label: config.label || '未命名属性',
      description: config.description || '',
      required: config.required || false,
      defaultValue: config.defaultValue,
      options: config.options || [],
      group: config.group || '基础配置',
      order: config.order || 0,
      hidden: config.hidden || false,
      disabled: config.disabled || false
    }
  }

  /**
   * 按分组组织属性
   */
  static groupProperties(whitelist: ComponentPropertyWhitelist): Record<string, ComponentPropertyWhitelist> {
    const groups: Record<string, ComponentPropertyWhitelist> = {}

    Object.entries(whitelist).forEach(([propName, config]) => {
      const group = config.group || '基础配置'
      if (!groups[group]) {
        groups[group] = {}
      }
      groups[group][propName] = config
    })

    return groups
  }

  /**
   * 按排序顺序获取属性列表
   */
  static getSortedProperties(whitelist: ComponentPropertyWhitelist): Array<{ name: string; config: PropertyExposureConfig }> {
    return Object.entries(whitelist)
      .map(([name, config]) => ({ name, config }))
      .sort((a, b) => (a.config.order || 0) - (b.config.order || 0))
  }

  /**
   * 获取可见属性（过滤隐藏属性）
   */
  static getVisibleProperties(whitelist: ComponentPropertyWhitelist): ComponentPropertyWhitelist {
    const visible: ComponentPropertyWhitelist = {}

    Object.entries(whitelist).forEach(([propName, config]) => {
      if (!config.hidden) {
        visible[propName] = config
      }
    })

    return visible
  }

  /**
   * 获取必填属性
   */
  static getRequiredProperties(whitelist: ComponentPropertyWhitelist): ComponentPropertyWhitelist {
    const required: ComponentPropertyWhitelist = {}

    Object.entries(whitelist).forEach(([propName, config]) => {
      if (config.required) {
        required[propName] = config
      }
    })

    return required
  }

  /**
   * 验证属性值是否符合配置
   */
  static validatePropertyValue(config: PropertyExposureConfig, value: any): { isValid: boolean; error?: string } {
    if (config.required && (value === null || value === undefined || value === '')) {
      return { isValid: false, error: `${config.label} 是必填项` }
    }

    // 类型验证
    if (value !== null && value !== undefined) {
      switch (config.type) {
        case 'string':
          if (typeof value !== 'string') {
            return { isValid: false, error: `${config.label} 必须是字符串类型` }
          }
          break
        case 'number':
          if (typeof value !== 'number') {
            return { isValid: false, error: `${config.label} 必须是数字类型` }
          }
          break
        case 'boolean':
          if (typeof value !== 'boolean') {
            return { isValid: false, error: `${config.label} 必须是布尔类型` }
          }
          break
        case 'array':
          if (!Array.isArray(value)) {
            return { isValid: false, error: `${config.label} 必须是数组类型` }
          }
          break
        case 'object':
          if (typeof value !== 'object' || Array.isArray(value)) {
            return { isValid: false, error: `${config.label} 必须是对象类型` }
          }
          break
      }
    }

    // 选项验证
    if (config.options && config.options.length > 0 && value !== null && value !== undefined) {
      const validValues = config.options.map(option => option.value)
      if (!validValues.includes(value)) {
        return { isValid: false, error: `${config.label} 必须是有效选项` }
      }
    }

    return { isValid: true }
  }

  /**
   * 转换属性值为合适类型
   */
  static convertPropertyValue(config: PropertyExposureConfig, value: any): any {
    if (value === null || value === undefined) {
      return config.defaultValue
    }

    try {
      switch (config.type) {
        case 'string':
          return String(value)
        case 'number':
          return Number(value)
        case 'boolean':
          return Boolean(value)
        case 'array':
          return Array.isArray(value) ? value : [value]
        case 'object':
          return typeof value === 'object' ? value : { value }
        default:
          return value
      }
    } catch (error) {
      console.warn(`⚠️ [WhitelistManager] 属性值转换失败:`, { propName: config.label, value, error })
      return config.defaultValue
    }
  }
}

/**
 * 默认导出
 */
export default WhitelistManager