/**
 * 属性暴露管理器
 * 基于白名单的安全属性暴露机制
 *
 * 核心功能：
 * 1. 基于白名单验证属性访问权限
 * 2. 提供安全的属性暴露和访问API
 * 3. 记录属性访问审计日志
 * 4. 支持属性别名和类型转换
 */

import type {
  ComponentPropertyWhitelist,
  PropertyExposureConfig,
  PropertyAccessLevel,
  PropertyDataType,
  ComponentDefinition
} from './types'

/**
 * 属性访问上下文
 */
export interface PropertyAccessContext {
  /** 访问者组件ID */
  accessorId?: string
  /** 访问类型 */
  accessType: 'read' | 'write' | 'watch'
  /** 访问时间戳 */
  timestamp: number
  /** 访问来源 */
  source: 'interaction' | 'debug' | 'system' | 'external'
}

/**
 * 属性访问结果
 */
export interface PropertyAccessResult<T = any> {
  /** 是否允许访问 */
  allowed: boolean
  /** 属性值（如果允许访问） */
  value?: T
  /** 拒绝原因 */
  reason?: string
  /** 属性配置信息 */
  config?: PropertyExposureConfig
}

/**
 * 属性暴露管理器类
 */
export class PropertyExposureManager {
  private static instance: PropertyExposureManager | null = null

  /** 组件白名单缓存 */
  private whitelistCache = new Map<string, ComponentPropertyWhitelist>()

  /** 属性访问日志 */
  private accessLogs: Array<{
    componentId: string
    propertyName: string
    context: PropertyAccessContext
    result: PropertyAccessResult
  }> = []

  private constructor() {}

  public static getInstance(): PropertyExposureManager {
    if (!this.instance) {
      this.instance = new PropertyExposureManager()
    }
    return this.instance
  }

  /**
   * 注册组件的属性白名单
   */
  registerComponentWhitelist(componentType: string, whitelist: ComponentPropertyWhitelist): void {
    // 🔥 自动添加全局基础属性 deviceId 和 metricsList
    const enhancedWhitelist = this.addGlobalBaseProperties(whitelist)
    this.whitelistCache.set(componentType, enhancedWhitelist)

    if (process.env.NODE_ENV === 'development') {
      console.log(`🔒 [PropertyExposureManager] 注册组件属性白名单: ${componentType}`, {
        propertiesCount: Object.keys(enhancedWhitelist.properties).length,
        properties: Object.keys(enhancedWhitelist.properties),
        defaultLevel: enhancedWhitelist.defaultLevel,
        包含全局基础属性: ['deviceId', 'metricsList'].every(prop => prop in enhancedWhitelist.properties)
      })
    }
  }

  /**
   * 🔥 添加全局基础属性到组件白名单
   * 确保 deviceId 和 metricsList 在所有组件中都可用
   */
  private addGlobalBaseProperties(whitelist: ComponentPropertyWhitelist): ComponentPropertyWhitelist {
    const globalBaseProperties: Record<string, PropertyExposureConfig> = {
      deviceId: {
        level: 'public',
        description: '设备ID - 全局基础属性，所有组件都需要',
        type: 'string',
        readonly: false,
        visibleInInteraction: true,
        visibleInDebug: true,
        defaultValue: ''
      },
      metricsList: {
        level: 'public',
        description: '指标列表 - 全局基础属性，所有组件都需要',
        type: 'array',
        readonly: false,
        visibleInInteraction: true,
        visibleInDebug: true,
        defaultValue: []
      }
    }

    // 合并全局基础属性与组件特定属性
    const enhancedProperties = {
      ...globalBaseProperties,
      ...whitelist.properties // 组件特定属性可以覆盖全局属性（如果需要自定义配置）
    }

    console.log(`🌐 [PropertyExposureManager] 为组件添加全局基础属性`, {
      添加的全局属性: Object.keys(globalBaseProperties),
      原有属性数量: Object.keys(whitelist.properties).length,
      增强后属性数量: Object.keys(enhancedProperties).length
    })

    return {
      ...whitelist,
      properties: enhancedProperties
    }
  }

  /**
   * 从组件定义中自动注册白名单
   */
  registerFromComponentDefinition(definition: ComponentDefinition): void {
    if (definition.propertyWhitelist) {
      this.registerComponentWhitelist(definition.type, definition.propertyWhitelist)
    }
  }

  /**
   * 检查属性是否在白名单中
   */
  isPropertyWhitelisted(
    componentType: string,
    propertyName: string,
    requiredLevel: PropertyAccessLevel = 'public'
  ): boolean {
    const whitelist = this.whitelistCache.get(componentType)
    if (!whitelist || !whitelist.enabled) {
      return false
    }

    const propertyConfig = whitelist.properties[propertyName]
    if (!propertyConfig) {
      return false
    }

    // 检查访问级别权限
    return this.checkAccessLevel(propertyConfig.level, requiredLevel)
  }

  /**
   * 安全地暴露属性
   */
  exposeProperty<T = any>(
    componentType: string,
    componentId: string,
    propertyName: string,
    value: T,
    context: PropertyAccessContext
  ): PropertyAccessResult<T> {
    const result: PropertyAccessResult<T> = {
      allowed: false
    }

    // 获取白名单配置
    const whitelist = this.whitelistCache.get(componentType)
    if (!whitelist || !whitelist.enabled) {
      result.reason = 'Component whitelist not found or disabled'
      this.logAccess(componentId, propertyName, context, result)
      return result
    }

    const propertyConfig = whitelist.properties[propertyName]
    if (!propertyConfig) {
      result.reason = 'Property not in whitelist'
      this.logAccess(componentId, propertyName, context, result)
      return result
    }

    // 检查上下文权限
    if (!this.checkContextPermission(propertyConfig, context)) {
      result.reason = 'Insufficient context permission'
      this.logAccess(componentId, propertyName, context, result)
      return result
    }

    // 类型验证和转换
    const validatedValue = this.validateAndTransformValue(value, propertyConfig)
    if (validatedValue === undefined) {
      result.reason = 'Value type validation failed'
      this.logAccess(componentId, propertyName, context, result)
      return result
    }

    // 暴露成功
    result.allowed = true
    result.value = validatedValue
    result.config = propertyConfig

    this.logAccess(componentId, propertyName, context, result)
    return result
  }

  /**
   * 安全地获取暴露的属性
   */
  getExposedProperty<T = any>(
    componentType: string,
    componentId: string,
    propertyName: string,
    currentValue: T,
    context: PropertyAccessContext
  ): PropertyAccessResult<T> {
    const exposeResult = this.exposeProperty(componentType, componentId, propertyName, currentValue, context)

    // 如果暴露成功，返回带别名的结果
    if (exposeResult.allowed && exposeResult.config?.alias) {
      return {
        ...exposeResult,
        value: exposeResult.value
      }
    }

    return exposeResult
  }

  /**
   * 获取组件所有白名单属性
   */
  getWhitelistedProperties(
    componentType: string,
    accessLevel: PropertyAccessLevel = 'public',
    context: Partial<PropertyAccessContext> = {}
  ): Record<string, PropertyExposureConfig> {
    const whitelist = this.whitelistCache.get(componentType)
    if (!whitelist || !whitelist.enabled) {
      return {}
    }

    const result: Record<string, PropertyExposureConfig> = {}

    for (const [propertyName, config] of Object.entries(whitelist.properties)) {
      if (this.checkAccessLevel(config.level, accessLevel)) {
        // 根据上下文过滤属性
        if (context.source === 'interaction' && config.visibleInInteraction === false) {
          continue
        }
        if (context.source === 'debug' && config.visibleInDebug === false) {
          continue
        }

        result[config.alias || propertyName] = config
      }
    }

    return result
  }

  /**
   * 创建默认白名单配置
   */
  static createDefaultWhitelist(properties: Record<string, Partial<PropertyExposureConfig>>): ComponentPropertyWhitelist {
    const processedProperties: Record<string, PropertyExposureConfig> = {}

    for (const [name, config] of Object.entries(properties)) {
      processedProperties[name] = {
        level: config.level || 'public',
        description: config.description || `${name} property`,
        type: config.type || 'any',
        readonly: config.readonly || false,
        visibleInInteraction: config.visibleInInteraction !== false,
        visibleInDebug: config.visibleInDebug !== false,
        ...config
      }
    }

    return {
      properties: processedProperties,
      enabled: true,
      defaultLevel: 'public',
      audit: {
        logAccess: process.env.NODE_ENV === 'development',
        logModification: process.env.NODE_ENV === 'development'
      }
    }
  }

  /**
   * 获取访问日志（用于调试和审计）
   */
  getAccessLogs(componentId?: string): typeof this.accessLogs {
    if (componentId) {
      return this.accessLogs.filter(log => log.componentId === componentId)
    }
    return [...this.accessLogs]
  }

  /**
   * 清理访问日志
   */
  clearAccessLogs(): void {
    this.accessLogs.length = 0
  }

  /**
   * 🔥 强制更新所有组件的白名单，确保包含全局基础属性
   * 用于修复现有组件缺失全局基础属性的问题
   */
  refreshAllComponentWhitelists(): void {
    console.log(`🔄 [PropertyExposureManager] 开始刷新所有组件白名单，确保包含全局基础属性`)

    const updatedComponents: string[] = []

    for (const [componentType, whitelist] of this.whitelistCache.entries()) {
      const hasDeviceId = 'deviceId' in whitelist.properties
      const hasMetricsList = 'metricsList' in whitelist.properties

      if (!hasDeviceId || !hasMetricsList) {
        // 重新应用全局基础属性
        const enhancedWhitelist = this.addGlobalBaseProperties(whitelist)
        this.whitelistCache.set(componentType, enhancedWhitelist)
        updatedComponents.push(componentType)

        console.log(`📝 [PropertyExposureManager] 更新组件白名单: ${componentType}`, {
          缺失deviceId: !hasDeviceId,
          缺失metricsList: !hasMetricsList,
          更新后属性数量: Object.keys(enhancedWhitelist.properties).length
        })
      }
    }

    console.log(`✅ [PropertyExposureManager] 白名单刷新完成`, {
      总组件数: this.whitelistCache.size,
      更新的组件数: updatedComponents.length,
      更新的组件: updatedComponents
    })
  }

  /**
   * 🔥 检查组件是否包含全局基础属性
   */
  validateGlobalBaseProperties(componentType: string): {
    hasDeviceId: boolean
    hasMetricsList: boolean
    missingProperties: string[]
  } {
    const whitelist = this.whitelistCache.get(componentType)

    if (!whitelist) {
      return {
        hasDeviceId: false,
        hasMetricsList: false,
        missingProperties: ['deviceId', 'metricsList', 'whitelist not found']
      }
    }

    const hasDeviceId = 'deviceId' in whitelist.properties
    const hasMetricsList = 'metricsList' in whitelist.properties
    const missingProperties: string[] = []

    if (!hasDeviceId) missingProperties.push('deviceId')
    if (!hasMetricsList) missingProperties.push('metricsList')

    return {
      hasDeviceId,
      hasMetricsList,
      missingProperties
    }
  }

  // ===== 私有方法 =====

  /**
   * 检查访问级别权限
   */
  private checkAccessLevel(
    propertyLevel: PropertyAccessLevel,
    requiredLevel: PropertyAccessLevel
  ): boolean {
    const levels: Record<PropertyAccessLevel, number> = {
      'public': 0,
      'protected': 1,
      'private': 2
    }

    return levels[propertyLevel] <= levels[requiredLevel]
  }

  /**
   * 检查上下文权限
   */
  private checkContextPermission(
    config: PropertyExposureConfig,
    context: PropertyAccessContext
  ): boolean {
    // 根据访问来源检查权限
    switch (context.source) {
      case 'interaction':
        return config.visibleInInteraction !== false
      case 'debug':
        return config.visibleInDebug !== false && process.env.NODE_ENV === 'development'
      case 'system':
        return true
      case 'external':
        return config.level === 'public'
      default:
        return config.level === 'public'
    }
  }

  /**
   * 验证和转换属性值
   */
  private validateAndTransformValue<T>(value: T, config: PropertyExposureConfig): T | undefined {
    if (value === null || value === undefined) {
      return config.defaultValue as T
    }

    // 基础类型验证
    switch (config.type) {
      case 'string':
        return String(value) as T
      case 'number':
        const num = Number(value)
        return isNaN(num) ? config.defaultValue as T : num as T
      case 'boolean':
        return Boolean(value) as T
      case 'object':
        return typeof value === 'object' ? value : config.defaultValue as T
      case 'array':
        return Array.isArray(value) ? value : config.defaultValue as T
      case 'any':
      default:
        return value
    }
  }

  /**
   * 记录属性访问日志
   */
  private logAccess(
    componentId: string,
    propertyName: string,
    context: PropertyAccessContext,
    result: PropertyAccessResult
  ): void {
    const logEntry = {
      componentId,
      propertyName,
      context,
      result: {
        allowed: result.allowed,
        reason: result.reason
      }
    }

    this.accessLogs.push(logEntry)

    // 保持日志大小在合理范围内
    if (this.accessLogs.length > 1000) {
      this.accessLogs.splice(0, 100)
    }

    // 开发环境打印访问日志
    if (process.env.NODE_ENV === 'development') {
      if (result.allowed) {
        console.log(`🔓 [PropertyExposure] 属性访问成功: ${componentId}.${propertyName}`, context)
      } else {
        console.warn(`🔒 [PropertyExposure] 属性访问被拒绝: ${componentId}.${propertyName}`, {
          reason: result.reason,
          context
        })
      }
    }
  }
}

/**
 * 全局属性暴露管理器实例
 */
export const propertyExposureManager = PropertyExposureManager.getInstance()

/**
 * 便捷的属性白名单创建函数
 */
export function createPropertyWhitelist(
  properties: Record<string, Partial<PropertyExposureConfig>>,
  options: Partial<ComponentPropertyWhitelist> = {}
): ComponentPropertyWhitelist {
  return {
    ...PropertyExposureManager.createDefaultWhitelist(properties),
    ...options
  }
}

// 🔒 开发环境测试支持
if (process.env.NODE_ENV === 'development') {
  Promise.all([
    import('./test-property-whitelist').then(({ setupBrowserTest }) => {
      setupBrowserTest()
    }),
    import('./verify-no-full-exposure').then(() => {
      console.log('🔒 属性暴露安全验证工具已加载')
    })
  ]).catch(error => {
    console.log('🔒 开发工具加载失败 (非关键):', error.message)
  })

  // 🔥 开发环境下，延迟执行白名单刷新，确保所有组件都包含全局基础属性
  setTimeout(() => {
    propertyExposureManager.refreshAllComponentWhitelists()

    // 将刷新方法暴露到全局作用域，便于控制台调试
    if (typeof window !== 'undefined') {
      ;(window as any).refreshComponentWhitelists = () => propertyExposureManager.refreshAllComponentWhitelists()
      ;(window as any).validateGlobalBaseProperties = (componentType: string) =>
        propertyExposureManager.validateGlobalBaseProperties(componentType)
    }
  }, 3000) // 3秒后执行，确保组件注册完成
}