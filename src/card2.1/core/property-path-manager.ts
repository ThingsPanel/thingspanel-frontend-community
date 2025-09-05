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
  /** 属性路径（支持嵌套，如 customize.title 或 data.value） */
  propertyPath: string
  /** 属性名（最后一级） */
  propertyName: string
  /** 是否为嵌套属性 */
  isNested: boolean
  /** 属性层级数组（如 ['customize', 'title'] 或 ['data', 'metrics', 0, 'value']） */
  propertyHierarchy: (string | number)[]
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
   * @returns 标准化的绑定路径
   */
  static createBindingPath(componentInstanceId: string, propertyPath: string): string {
    if (!componentInstanceId || !propertyPath) {
      throw new Error('组件实例ID和属性路径都是必需的')
    }

    // 确保组件ID有效
    this.validateComponentInstanceId(componentInstanceId)

    // 清理和标准化属性路径
    const cleanPath = this.normalizePropertyPath(propertyPath)

    return `${componentInstanceId}${this.PATH_SEPARATOR}${cleanPath}`
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
    if (!bindingPath.includes(this.PATH_SEPARATOR)) {
      return {
        isValid: false,
        error: '绑定路径格式无效，应为 componentInstanceId.propertyPath'
      }
    }

    const parts = bindingPath.split(this.PATH_SEPARATOR)
    
    if (parts.length < 2) {
      return {
        isValid: false,
        error: '绑定路径至少应包含组件ID和属性名'
      }
    }

    const componentInstanceId = parts[0]
    const propertyPath = parts.slice(1).join(this.PATH_SEPARATOR)

    // 验证组件ID
    try {
      this.validateComponentInstanceId(componentInstanceId)
    } catch (error) {
      return {
        isValid: false,
        error: `无效的组件实例ID: ${(error as Error).message}`
      }
    }

    // 解析属性层级
    const propertyHierarchy = this.parsePropertyHierarchy(propertyPath)
    const propertyName = this.getPropertyName(propertyHierarchy)

    const pathInfo: PropertyPathInfo = {
      fullPath: bindingPath,
      componentInstanceId,
      propertyPath,
      propertyName,
      isNested: propertyHierarchy.length > 1,
      propertyHierarchy
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
    let normalized = propertyPath.replace(this.ARRAY_INDEX_REGEX, '.$1')

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

    const normalized = this.normalizePropertyPath(propertyPath)
    const parts = normalized.split(this.PATH_SEPARATOR)

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

    if (componentInstanceId.includes(this.PATH_SEPARATOR)) {
      throw new Error(`组件实例ID不能包含路径分隔符 "${this.PATH_SEPARATOR}"`)
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
    const result1 = this.parseBindingPath(path1)
    const result2 = this.parseBindingPath(path2)

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
    const result = this.parseBindingPath(bindingPath)
    
    if (!result.isValid) {
      return bindingPath
    }

    const { componentInstanceId, propertyHierarchy } = result.pathInfo!

    // 生成友好的组件名（取ID的前8位）
    const shortComponentId = componentInstanceId.length > 8 
      ? `${componentInstanceId.substring(0, 8)}...` 
      : componentInstanceId

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
    const result = this.parseBindingPath(bindingPath)
    
    if (!result.isValid) return false

    return result.pathInfo!.propertyHierarchy.some(part => typeof part === 'number')
  }

  /**
   * 🎯 获取父级属性路径
   * @param bindingPath 绑定路径
   * @returns 父级路径，如果没有则返回null
   */
  static getParentPath(bindingPath: string): string | null {
    const result = this.parseBindingPath(bindingPath)
    
    if (!result.isValid || result.pathInfo!.propertyHierarchy.length <= 1) {
      return null
    }

    const { componentInstanceId, propertyHierarchy } = result.pathInfo!
    const parentHierarchy = propertyHierarchy.slice(0, -1)
    const parentPath = parentHierarchy.join(this.PATH_SEPARATOR)

    return this.createBindingPath(componentInstanceId, parentPath)
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
    const parseResult = this.parseBindingPath(bindingPath)
    
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
    return paths
      .map(path => {
        try {
          const result = this.parseBindingPath(path)
          return result.isValid ? result.pathInfo!.fullPath : path
        } catch {
          return path
        }
      })
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
  }
}

console.log('🎯 [PropertyPathManager] 统一属性路径格式管理器已初始化')