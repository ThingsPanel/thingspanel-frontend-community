/**
 * Card2.1 属性暴露管理器
 * 简化的属性白名单管理机制
 */

import type { ComponentPropertyWhitelist, PropertyExposureConfig, IPropertyExposureManager } from '../types'

/**
 * 属性暴露管理器类
 */
export class PropertyExposureManager implements IPropertyExposureManager {
  private propertyWhitelists = new Map<string, ComponentPropertyWhitelist>()

  /**
   * 注册组件属性白名单
   */
  registerPropertyWhitelist(componentType: string, whitelist: ComponentPropertyWhitelist | any): void {
    if (!componentType) {
      console.warn('❌ [PropertyExposureManager] 组件类型不能为空')
      return
    }

    // 兼容旧系统的嵌套结构 { properties: {...}, enabled: true, ... }
    let normalizedWhitelist: ComponentPropertyWhitelist
    if (whitelist && typeof whitelist === 'object' && 'properties' in whitelist) {
      // 旧系统格式：提取 properties 字段
      normalizedWhitelist = whitelist.properties as ComponentPropertyWhitelist
    } else {
      // 新系统格式：直接使用
      normalizedWhitelist = whitelist as ComponentPropertyWhitelist
    }

    // 添加全局基础属性
    const enhancedWhitelist = this.addGlobalBaseProperties(normalizedWhitelist)

    this.propertyWhitelists.set(componentType, enhancedWhitelist)
  }

  /**
   * 获取组件属性白名单
   */
  getPropertyWhitelist(componentType: string): ComponentPropertyWhitelist | undefined {
    return this.propertyWhitelists.get(componentType)
  }

  /**
   * 获取所有属性白名单
   */
  getAllPropertyWhitelists(): Record<string, ComponentPropertyWhitelist> {
    const result: Record<string, ComponentPropertyWhitelist> = {}
    this.propertyWhitelists.forEach((whitelist, componentType) => {
      result[componentType] = whitelist
    })
    return result
  }

  /**
   * 添加全局基础属性
   * 注意：不再自动添加 deviceId 和 metricsList
   * 这两个属性由 ComponentPropertySelector 作为强制必需属性处理
   */
  addGlobalBaseProperties(whitelist: ComponentPropertyWhitelist): ComponentPropertyWhitelist {
    // 规范化组件特定属性（兼容旧系统的额外字段）
    const normalizedWhitelist: ComponentPropertyWhitelist = {}
    for (const [propName, config] of Object.entries(whitelist)) {
      // 提取核心字段，忽略旧系统的额外字段（如 level, visibleInInteraction 等）
      normalizedWhitelist[propName] = {
        type: config.type || 'string',
        label: config.label || propName,
        description: config.description,
        required: config.required,
        defaultValue: config.defaultValue,
        options: config.options,
        group: config.group,
        order: config.order,
        hidden: config.hidden,
        disabled: config.disabled
      }
    }

    // 只返回规范化后的属性，不添加全局基础属性
    return normalizedWhitelist
  }

  /**
   * 验证属性配置
   */
  validatePropertyConfig(config: PropertyExposureConfig): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!config.type || !['string', 'number', 'boolean', 'array', 'object'].includes(config.type)) {
      errors.push('属性类型必须是有效的类型')
    }

    if (!config.label || typeof config.label !== 'string') {
      errors.push('属性标签必须是非空字符串')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * 获取属性统计信息
   */
  getStats() {
    const whitelists = this.getAllPropertyWhitelists()
    const totalComponents = Object.keys(whitelists).length
    const totalProperties = Object.values(whitelists).reduce(
      (sum, whitelist) => sum + Object.keys(whitelist).length,
      0
    )

    return {
      totalComponents,
      totalProperties,
      componentTypes: Object.keys(whitelists)
    }
  }

  /**
   * 清空所有白名单
   */
  clear(): void {
    this.propertyWhitelists.clear()
  }

  /**
   * 获取组件的白名单属性（向后兼容旧系统）
   * 兼容旧系统的 getWhitelistedProperties 方法
   */
  getWhitelistedProperties(
    componentType: string,
    accessLevel?: string,
    context?: any
  ): Record<string, any> {
    const whitelist = this.propertyWhitelists.get(componentType)

    if (!whitelist) {
      return {}
    }

    // 将新格式转换为旧格式（添加 level 等字段以兼容旧系统）
    const result: Record<string, any> = {}
    for (const [propName, config] of Object.entries(whitelist)) {
      result[propName] = {
        ...config,
        level: 'public', // 新系统简化了访问级别，统一设为 public
        readonly: false,
        visibleInInteraction: true,
        visibleInDebug: true
      }
    }

    return result
  }

  /**
   * 安全地获取暴露的属性（向后兼容旧系统）
   * 兼容旧系统的 getExposedProperty 方法
   */
  getExposedProperty<T = any>(
    componentType: string,
    componentId: string,
    propertyName: string,
    currentValue: T,
    context?: any
  ): { allowed: boolean; value?: T; config?: any } {
    const whitelist = this.propertyWhitelists.get(componentType)

    if (!whitelist) {
      return {
        allowed: false,
        value: undefined
      }
    }

    const propertyConfig = whitelist[propertyName]
    if (!propertyConfig) {
      return {
        allowed: false,
        value: undefined
      }
    }

    // 属性存在于白名单中，允许访问
    return {
      allowed: true,
      value: currentValue,
      config: {
        ...propertyConfig,
        level: 'public',
        readonly: false,
        visibleInInteraction: true,
        visibleInDebug: true
      }
    }
  }
}

/**
 * 全局属性暴露管理器实例
 */
export const propertyExposureManager = new PropertyExposureManager()

/**
 * 默认导出
 */
export default propertyExposureManager