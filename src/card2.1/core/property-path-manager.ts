/**
 * 🚀 优化2：统一属性路径格式标准化
 * 提供组件属性路径的统一格式化、解析和验证服务
 * 🚀 集成性能优化和缓存系统
 */

import { performanceOptimizer } from './performance-optimizer'

export interface PropertyPathInfo {
  /** 完整的绑定路径 */
  fullPath: string
  /** 组件实例ID */
  componentInstanceId: string
  /** 🚀 新增：配置段（base、component、dataSource、interaction） */
  configSection?: string
  /** 属性路径（支持嵌套，如 customize.title 或 data.value） */
  propertyPath: string
  /** 属性名（最后一级） */
  propertyName: string
  /** 是否为嵌套属性 */
  isNested: boolean
  /** 属性层级数组（如 ['customize', 'title'] 或 ['data', 'metrics', 0, 'value']） */
  propertyHierarchy: (string | number)[]
  /** 🚀 新增：是否使用完整的配置段格式 */
  hasConfigSection: boolean
}

export interface PropertyPathValidationResult {
  /** 是否有效 */
  isValid: boolean
  /** 错误信息 */
  error?: string
  /** 解析后的路径信息 */
  pathInfo?: PropertyPathInfo
}

/**
 * 属性路径管理器
 * 统一管理组件属性的路径格式标准
 */
export class PropertyPathManager {
  // 路径格式常量
  static readonly PATH_SEPARATOR = '.'
  static readonly ARRAY_INDEX_REGEX = /\[(\d+)\]/g
  static readonly VALID_PROPERTY_NAME_REGEX = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/

  /**
   * 🎯 创建标准化的属性绑定路径
   * @param componentInstanceId 组件实例ID
   * @param propertyPath 属性路径（支持嵌套，如 'title' 或 'customize.title'）
   * @param configSection 配置段（可选，如 'base'、'component'、'dataSource'、'interaction'）
   * @returns 标准化的绑定路径
   */
  static createBindingPath(componentInstanceId: string, propertyPath: string, configSection?: string): string {
    if (!componentInstanceId || !propertyPath) {
      throw new Error('组件实例ID和属性路径都是必需的')
    }

    // 确保组件ID有效
    PropertyPathManager.validateComponentInstanceId(componentInstanceId)

    // 清理和标准化属性路径
    const cleanPath = PropertyPathManager.normalizePropertyPath(propertyPath)

    // 🚀 关键修复：支持配置层级的完整路径格式
    if (configSection) {
      // 完整格式：componentId.configSection.propertyPath
      return `${componentInstanceId}${PropertyPathManager.PATH_SEPARATOR}${configSection}${PropertyPathManager.PATH_SEPARATOR}${cleanPath}`
    } else {
      // 兼容旧格式：componentId.propertyPath
      return `${componentInstanceId}${PropertyPathManager.PATH_SEPARATOR}${cleanPath}`
    }
  }

  /**
   * 🚀 新增：创建基础配置属性绑定路径
   * 专门用于基础配置属性，确保路径格式正确
   */
  static createBaseConfigBindingPath(componentInstanceId: string, propertyPath: string): string {
    return PropertyPathManager.createBindingPath(componentInstanceId, propertyPath, 'base')
  }

  /**
   * 🚀 新增：创建组件配置属性绑定路径
   * 专门用于组件配置属性
   */
  static createComponentConfigBindingPath(componentInstanceId: string, propertyPath: string): string {
    return PropertyPathManager.createBindingPath(componentInstanceId, propertyPath, 'component')
  }

  /**
   * 🎯 解析属性绑定路径
   * 🚀 集成缓存优化
   * @param bindingPath 绑定路径
   * @returns 解析后的路径信息
   */
  static parseBindingPath(bindingPath: string): PropertyPathValidationResult {
    if (!bindingPath || typeof bindingPath !== 'string') {
      return {
        isValid: false,
        error: '绑定路径不能为空'
      }
    }

    // 🚀 尝试从缓存获取解析结果
    const cachedResult = performanceOptimizer.getCachedPathParseResult(bindingPath)
    if (cachedResult) {
      performanceOptimizer.incrementCounter('pathParses')
      return cachedResult
    }

    const startTime = performance.now()

    // 检查路径格式
    if (!bindingPath.includes(PropertyPathManager.PATH_SEPARATOR)) {
      return {
        isValid: false,
        error:
          '绑定路径格式无效，应为 componentInstanceId.propertyPath 或 componentInstanceId.configSection.propertyPath'
      }
    }

    const parts = bindingPath.split(PropertyPathManager.PATH_SEPARATOR)

    if (parts.length < 2) {
      return {
        isValid: false,
        error: '绑定路径至少应包含组件ID和属性名'
      }
    }

    const componentInstanceId = parts[0]

    // 🚀 关键修复：支持配置段的路径解析
    let configSection: string | undefined
    let propertyPath: string
    let hasConfigSection = false

    // 检查是否为完整格式（包含配置段）
    const validConfigSections = ['base', 'component', 'dataSource', 'interaction']
    if (parts.length >= 3 && validConfigSections.includes(parts[1])) {
      // 完整格式：componentId.configSection.propertyPath
      configSection = parts[1]
      propertyPath = parts.slice(2).join(PropertyPathManager.PATH_SEPARATOR)
      hasConfigSection = true
    } else {
      // 兼容旧格式：componentId.propertyPath
      propertyPath = parts.slice(1).join(PropertyPathManager.PATH_SEPARATOR)
      hasConfigSection = false
    }

    // 验证组件ID
    try {
      PropertyPathManager.validateComponentInstanceId(componentInstanceId)
    } catch (error) {
      return {
        isValid: false,
        error: `无效的组件实例ID: ${(error as Error).message}`
      }
    }

    // 解析属性层级
    const propertyHierarchy = PropertyPathManager.parsePropertyHierarchy(propertyPath)
    const propertyName = PropertyPathManager.getPropertyName(propertyHierarchy)

    const pathInfo: PropertyPathInfo = {
      fullPath: bindingPath,
      componentInstanceId,
      configSection,
      propertyPath,
      propertyName,
      isNested: propertyHierarchy.length > 1,
      propertyHierarchy,
      hasConfigSection
    }

    const result: PropertyPathValidationResult = {
      isValid: true,
      pathInfo
    }

    // 🚀 缓存解析结果和记录性能
    const endTime = performance.now()
    const parseTime = endTime - startTime

    performanceOptimizer.cachePathParseResult(bindingPath, result)
    performanceOptimizer.recordMetric('propertyParsingTime', parseTime)
    performanceOptimizer.incrementCounter('pathParses')

    return result
  }

  /**
   * 🎯 规范化属性路径
   * @param propertyPath 原始属性路径
   * @returns 规范化后的属性路径
   */
  static normalizePropertyPath(propertyPath: string): string {
    if (!propertyPath) return ''

    // 处理数组索引 [0] -> .0
    let normalized = propertyPath.replace(PropertyPathManager.ARRAY_INDEX_REGEX, '.$1')

    // 移除开头的点
    normalized = normalized.replace(/^\./, '')

    // 移除多余的点
    normalized = normalized.replace(/\.+/g, '.')

    // 移除结尾的点
    normalized = normalized.replace(/\.$/, '')

    return normalized
  }

  /**
   * 🎯 解析属性层级
   * @param propertyPath 属性路径
   * @returns 属性层级数组
   */
  static parsePropertyHierarchy(propertyPath: string): (string | number)[] {
    if (!propertyPath) return []

    const normalized = PropertyPathManager.normalizePropertyPath(propertyPath)
    const parts = normalized.split(PropertyPathManager.PATH_SEPARATOR)

    return parts.map(part => {
      // 尝试将字符串转换为数字（处理数组索引）
      const num = parseInt(part, 10)
      return isNaN(num) ? part : num
    })
  }

  /**
   * 🎯 获取属性名（最后一级）
   * @param propertyHierarchy 属性层级数组
   * @returns 属性名
   */
  static getPropertyName(propertyHierarchy: (string | number)[]): string {
    if (propertyHierarchy.length === 0) return ''

    const lastLevel = propertyHierarchy[propertyHierarchy.length - 1]
    return String(lastLevel)
  }

  /**
   * 🎯 验证组件实例ID
   * @param componentInstanceId 组件实例ID
   */
  static validateComponentInstanceId(componentInstanceId: string): void {
    if (!componentInstanceId || typeof componentInstanceId !== 'string') {
      throw new Error('组件实例ID必须是非空字符串')
    }

    if (componentInstanceId.includes(PropertyPathManager.PATH_SEPARATOR)) {
      throw new Error(`组件实例ID不能包含路径分隔符 "${PropertyPathManager.PATH_SEPARATOR}"`)
    }

    if (componentInstanceId.trim() !== componentInstanceId) {
      throw new Error('组件实例ID不能包含前导或尾随空格')
    }
  }

  /**
   * 🎯 检查两个绑定路径是否引用相同的属性
   * @param path1 路径1
   * @param path2 路径2
   * @returns 是否相同
   */
  static isSamePath(path1: string, path2: string): boolean {
    const result1 = PropertyPathManager.parseBindingPath(path1)
    const result2 = PropertyPathManager.parseBindingPath(path2)

    if (!result1.isValid || !result2.isValid) {
      return false
    }

    return result1.pathInfo!.fullPath === result2.pathInfo!.fullPath
  }

  /**
   * 🎯 生成属性路径的显示标签
   * @param bindingPath 绑定路径
   * @returns 友好的显示标签
   */
  static generateDisplayLabel(bindingPath: string): string {
    const result = PropertyPathManager.parseBindingPath(bindingPath)

    if (!result.isValid) {
      return bindingPath
    }

    const { componentInstanceId, propertyHierarchy } = result.pathInfo!

    // 生成友好的组件名（取ID的前8位）
    const shortComponentId =
      componentInstanceId.length > 8 ? `${componentInstanceId.substring(0, 8)}...` : componentInstanceId

    // 生成友好的属性路径
    const friendlyPath = propertyHierarchy
      .map((part, index) => {
        if (typeof part === 'number') {
          return `[${part}]`
        }
        return index === 0 ? part : `.${part}`
      })
      .join('')

    return `${shortComponentId} → ${friendlyPath}`
  }

  /**
   * 🎯 检查路径是否指向数组元素
   * @param bindingPath 绑定路径
   * @returns 是否为数组元素路径
   */
  static isArrayElementPath(bindingPath: string): boolean {
    const result = PropertyPathManager.parseBindingPath(bindingPath)

    if (!result.isValid) return false

    return result.pathInfo!.propertyHierarchy.some(part => typeof part === 'number')
  }

  /**
   * 🎯 获取父级属性路径
   * @param bindingPath 绑定路径
   * @returns 父级路径，如果没有则返回null
   */
  static getParentPath(bindingPath: string): string | null {
    const result = PropertyPathManager.parseBindingPath(bindingPath)

    if (!result.isValid || result.pathInfo!.propertyHierarchy.length <= 1) {
      return null
    }

    const { componentInstanceId, propertyHierarchy } = result.pathInfo!
    const parentHierarchy = propertyHierarchy.slice(0, -1)
    const parentPath = parentHierarchy.join(PropertyPathManager.PATH_SEPARATOR)

    return PropertyPathManager.createBindingPath(componentInstanceId, parentPath)
  }

  /**
   * 🎯 检查路径是否有效并可访问
   * @param bindingPath 绑定路径
   * @param componentRegistry 组件注册表（可选，用于验证组件存在性）
   * @returns 验证结果
   */
  static validatePath(
    bindingPath: string,
    componentRegistry?: { has: (id: string) => boolean }
  ): PropertyPathValidationResult {
    const parseResult = PropertyPathManager.parseBindingPath(bindingPath)

    if (!parseResult.isValid) {
      return parseResult
    }

    // 如果提供了组件注册表，检查组件是否存在
    if (componentRegistry) {
      const { componentInstanceId } = parseResult.pathInfo!

      if (!componentRegistry.has(componentInstanceId)) {
        return {
          isValid: false,
          error: `组件实例 "${componentInstanceId}" 不存在`
        }
      }
    }

    return parseResult
  }

  /**
   * 🎯 批量规范化路径
   * @param paths 路径数组
   * @returns 规范化后的路径数组
   */
  static normalizePaths(paths: string[]): string[] {
    return paths.map(path => {
      try {
        const result = PropertyPathManager.parseBindingPath(path)
        return result.isValid ? result.pathInfo!.fullPath : path
      } catch {
        return path
      }
    })
  }

  /**
   * 🔥 关键新增：解析属性路径的值
   * 从配置对象中获取指定路径的值，支持基础配置路径
   * @param config 配置对象（支持分层格式）
   * @param propertyPath 属性路径（如 'base.deviceId' 或 'component.customize.title'）
   * @returns 解析后的值
   */
  static resolvePropertyValue(config: any, propertyPath: string): any {
    if (!config || !propertyPath) {
      return undefined
    }

    console.log(`🔍 [PropertyPathManager] 解析属性路径值`, {
      propertyPath,
      configKeys: Object.keys(config || {})
    })

    // 检查是否为基础配置路径格式 (base.xxx)
    if (propertyPath.startsWith('base.')) {
      const basePropertyPath = propertyPath.substring(5) // 移除 'base.' 前缀

      // 优先从 base 配置段获取
      if (config.base) {
        const value = PropertyPathManager.getNestedValue(config.base, basePropertyPath)
        if (value !== undefined) {
          console.log(`✅ [PropertyPathManager] 从base配置段获取值`, {
            路径: propertyPath,
            值: value
          })
          return value
        }
      }

      // 兼容：从根配置获取（向后兼容）
      const rootValue = PropertyPathManager.getNestedValue(config, basePropertyPath)
      if (rootValue !== undefined) {
        console.log(`✅ [PropertyPathManager] 从根配置获取值（兼容模式）`, {
          路径: propertyPath,
          值: rootValue
        })
        return rootValue
      }
    }
    // 检查是否为组件配置路径格式 (component.xxx)
    else if (propertyPath.startsWith('component.')) {
      const componentPropertyPath = propertyPath.substring(10) // 移除 'component.' 前缀

      // 从 component 配置段获取
      if (config.component && config.component.properties) {
        const value = PropertyPathManager.getNestedValue(config.component.properties, componentPropertyPath)
        if (value !== undefined) {
          console.log(`✅ [PropertyPathManager] 从component配置段获取值`, {
            路径: propertyPath,
            值: value
          })
          return value
        }
      }
    }
    // 检查是否为数据源配置路径格式 (dataSource.xxx)
    else if (propertyPath.startsWith('dataSource.')) {
      const dataSourcePropertyPath = propertyPath.substring(11) // 移除 'dataSource.' 前缀

      // 从 dataSource 配置段获取
      if (config.dataSource) {
        const value = PropertyPathManager.getNestedValue(config.dataSource, dataSourcePropertyPath)
        if (value !== undefined) {
          console.log(`✅ [PropertyPathManager] 从dataSource配置段获取值`, {
            路径: propertyPath,
            值: value
          })
          return value
        }
      }
    }
    // 默认：直接从根配置获取
    else {
      const value = PropertyPathManager.getNestedValue(config, propertyPath)
      if (value !== undefined) {
        console.log(`✅ [PropertyPathManager] 从根配置获取值`, {
          路径: propertyPath,
          值: value
        })
        return value
      }
    }

    console.log(`⚠️ [PropertyPathManager] 未找到属性路径值`, {
      路径: propertyPath,
      配置结构: {
        hasBase: !!config.base,
        hasComponent: !!config.component,
        hasDataSource: !!config.dataSource,
        rootKeys: Object.keys(config || {})
      }
    })

    return undefined
  }

  /**
   * 🔧 辅助方法：获取嵌套对象的值
   * 支持点分隔的路径（如 'customize.title' 或 'data.metrics.0.value'）
   */
  static getNestedValue(obj: any, path: string): any {
    if (!obj || !path) {
      return undefined
    }

    const hierarchy = PropertyPathManager.parsePropertyHierarchy(path)
    let current = obj

    for (const key of hierarchy) {
      if (current == null) {
        return undefined
      }

      if (typeof current === 'object') {
        current = current[key]
      } else {
        return undefined
      }
    }

    return current
  }

  /**
   * 🔥 关键新增：设置属性路径的值
   * 在配置对象中设置指定路径的值，支持创建嵌套结构
   * @param config 配置对象
   * @param propertyPath 属性路径
   * @param value 要设置的值
   */
  static setPropertyValue(config: any, propertyPath: string, value: any): void {
    if (!config || !propertyPath) {
      return
    }

    console.log(`🔧 [PropertyPathManager] 设置属性路径值`, {
      propertyPath,
      value
    })

    // 检查是否为基础配置路径格式 (base.xxx)
    if (propertyPath.startsWith('base.')) {
      const basePropertyPath = propertyPath.substring(5) // 移除 'base.' 前缀

      // 确保 base 配置段存在
      if (!config.base) {
        config.base = {}
      }

      PropertyPathManager.setNestedValue(config.base, basePropertyPath, value)
      console.log(`✅ [PropertyPathManager] 已设置base配置值`, {
        路径: propertyPath,
        值: value
      })
    }
    // 检查是否为组件配置路径格式 (component.xxx)
    else if (propertyPath.startsWith('component.')) {
      const componentPropertyPath = propertyPath.substring(10) // 移除 'component.' 前缀

      // 确保 component 配置段存在
      if (!config.component) {
        config.component = { properties: {}, styles: {}, behavior: {} }
      }
      if (!config.component.properties) {
        config.component.properties = {}
      }

      PropertyPathManager.setNestedValue(config.component.properties, componentPropertyPath, value)
      console.log(`✅ [PropertyPathManager] 已设置component配置值`, {
        路径: propertyPath,
        值: value
      })
    }
    // 检查是否为数据源配置路径格式 (dataSource.xxx)
    else if (propertyPath.startsWith('dataSource.')) {
      const dataSourcePropertyPath = propertyPath.substring(11) // 移除 'dataSource.' 前缀

      // 确保 dataSource 配置段存在
      if (!config.dataSource) {
        config.dataSource = {}
      }

      PropertyPathManager.setNestedValue(config.dataSource, dataSourcePropertyPath, value)
      console.log(`✅ [PropertyPathManager] 已设置dataSource配置值`, {
        路径: propertyPath,
        值: value
      })
    }
    // 默认：直接在根配置设置
    else {
      PropertyPathManager.setNestedValue(config, propertyPath, value)
      console.log(`✅ [PropertyPathManager] 已设置根配置值`, {
        路径: propertyPath,
        值: value
      })
    }
  }

  /**
   * 🔧 辅助方法：设置嵌套对象的值
   * 支持创建中间路径（如果不存在的话）
   */
  static setNestedValue(obj: any, path: string, value: any): void {
    if (!obj || !path) {
      return
    }

    const hierarchy = PropertyPathManager.parsePropertyHierarchy(path)
    let current = obj

    // 遍历到最后一级之前的所有层级
    for (let i = 0; i < hierarchy.length - 1; i++) {
      const key = hierarchy[i]

      // 如果当前层级不存在或不是对象，创建新对象
      if (!current[key] || typeof current[key] !== 'object') {
        // 如果下一级是数字，创建数组；否则创建对象
        const nextKey = hierarchy[i + 1]
        current[key] = typeof nextKey === 'number' ? [] : {}
      }

      current = current[key]
    }

    // 设置最后一级的值
    const finalKey = hierarchy[hierarchy.length - 1]
    current[finalKey] = value
  }
}

/**
 * 🎯 属性路径工具函数（简化接口）
 */
export const PropertyPath = {
  /**
   * 创建绑定路径
   */
  create: PropertyPathManager.createBindingPath,

  /**
   * 解析绑定路径
   */
  parse: PropertyPathManager.parseBindingPath,

  /**
   * 验证路径
   */
  validate: PropertyPathManager.validatePath,

  /**
   * 生成显示标签
   */
  label: PropertyPathManager.generateDisplayLabel,

  /**
   * 检查是否为相同路径
   */
  isSame: PropertyPathManager.isSamePath,

  /**
   * 规范化路径
   */
  normalize: (path: string): string => {
    const result = PropertyPathManager.parseBindingPath(path)
    return result.isValid ? result.pathInfo!.fullPath : path
  },

  /**
   * 🔥 解析属性值
   */
  resolve: PropertyPathManager.resolvePropertyValue,

  /**
   * 🔥 设置属性值
   */
  set: PropertyPathManager.setPropertyValue
}

console.log('🎯 [PropertyPathManager] 统一属性路径格式管理器已初始化')
