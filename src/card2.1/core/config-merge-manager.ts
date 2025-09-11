/**
 * 🚀 优化3：配置合并策略系统
 * 统一管理组件配置的合并逻辑和优先级策略
 * 🚀 集成性能优化和缓存系统
 */

import { performanceOptimizer } from '@/card2.1/core/performance-optimizer'

export type ConfigSource = 'default' | 'user' | 'interaction' | 'dataSource' | 'runtime'

export interface ConfigMergeStrategy {
  /** 优先级顺序（数字越大优先级越高） */
  priority: number
  /** 策略名称 */
  name: string
  /** 是否允许深度合并 */
  allowDeepMerge: boolean
  /** 是否可被覆盖 */
  canOverride: boolean
}

export interface ConfigMergeOptions {
  /** 优先级策略（按优先级从低到高排序） */
  priorityOrder?: ConfigSource[]
  /** 是否启用深度合并 */
  enableDeepMerge?: boolean
  /** 是否保留源信息 */
  preserveSource?: boolean
  /** 自定义合并函数 */
  customMerger?: (target: any, source: any, key: string) => any
  /** 是否启用变更跟踪 */
  enableChangeTracking?: boolean
}

export interface ConfigMergeResult<T = any> {
  /** 合并后的配置 */
  merged: T
  /** 变更信息 */
  changes?: ConfigChangeInfo[]
  /** 源信息映射 */
  sourceMap?: Record<string, ConfigSource>
  /** 合并统计 */
  stats?: ConfigMergeStats
}

export interface ConfigChangeInfo {
  /** 变更的属性路径 */
  path: string
  /** 旧值 */
  oldValue: any
  /** 新值 */
  newValue: any
  /** 变更来源 */
  source: ConfigSource
  /** 变更时间 */
  timestamp: number
}

export interface ConfigMergeStats {
  /** 总字段数 */
  totalFields: number
  /** 变更字段数 */
  changedFields: number
  /** 各源贡献的字段数 */
  sourceContributions: Record<ConfigSource, number>
  /** 合并耗时（毫秒） */
  mergeTime: number
}

/**
 * 配置合并管理器
 * 提供统一的组件配置合并策略
 */
export class ConfigMergeManager {
  // 默认优先级策略
  static readonly DEFAULT_PRIORITY_ORDER: ConfigSource[] = [
    'default', // 默认配置（优先级最低）
    'user', // 用户配置
    'dataSource', // 数据源绑定
    'interaction', // 交互覆盖
    'runtime' // 运行时动态配置（优先级最高）
  ]

  // 策略配置
  static readonly MERGE_STRATEGIES: Record<ConfigSource, ConfigMergeStrategy> = {
    default: {
      priority: 1,
      name: '默认配置',
      allowDeepMerge: true,
      canOverride: true
    },
    user: {
      priority: 2,
      name: '用户配置',
      allowDeepMerge: true,
      canOverride: true
    },
    dataSource: {
      priority: 3,
      name: '数据源绑定',
      allowDeepMerge: false, // 数据绑定通常是完整替换
      canOverride: true
    },
    interaction: {
      priority: 4,
      name: '交互覆盖',
      allowDeepMerge: false, // 交互结果通常是直接覆盖
      canOverride: true
    },
    runtime: {
      priority: 5,
      name: '运行时配置',
      allowDeepMerge: false, // 运行时配置优先级最高
      canOverride: false
    }
  }

  /**
   * 🎯 合并多个配置源
   * 🚀 集成性能监控和缓存优化
   * @param configs 配置源映射
   * @param options 合并选项
   * @returns 合并结果
   */
  static mergeConfigs<T = any>(
    configs: Partial<Record<ConfigSource, T>>,
    options: ConfigMergeOptions = {}
  ): ConfigMergeResult<T> {
    const startTime = performance.now()

    // 🔥 暂时禁用缓存以修复交互配置更新问题
    // TODO: 修复缓存键生成逻辑后重新启用
    // const cacheKey = ConfigMergeManager.generateCacheKey(configs, options)
    // const cachedResult = performanceOptimizer.getCachedConfigMergeResult(cacheKey)
    // if (cachedResult) {
    //   performanceOptimizer.incrementCounter('configMerges')
    //   return cachedResult
    // }

    // 应用默认选项
    const mergeOptions: Required<ConfigMergeOptions> = {
      priorityOrder: ConfigMergeManager.DEFAULT_PRIORITY_ORDER,
      enableDeepMerge: true,
      preserveSource: true,
      customMerger: undefined,
      enableChangeTracking: true,
      ...options
    }

    if (process.env.NODE_ENV === 'development') {
      console.log(`🔄 [ConfigMergeManager] 开始配置合并`, {
      配置源: Object.keys(configs),
      各源内容: configs,
      合并选项: mergeOptions
    })
    }

    let merged: T = {} as T
    const changes: ConfigChangeInfo[] = []
    const sourceMap: Record<string, ConfigSource> = {}
    const sourceContributions: Record<ConfigSource, number> = {}
    let totalFields = 0
    let changedFields = 0

    // 按优先级顺序合并配置
    for (const source of mergeOptions.priorityOrder) {
      const config = configs[source]
      if (!config || typeof config !== 'object') continue

      const strategy = ConfigMergeManager.MERGE_STRATEGIES[source]

      // 统计字段贡献
      sourceContributions[source] = 0

      if (strategy.allowDeepMerge && mergeOptions.enableDeepMerge) {
        // 深度合并
        const result = ConfigMergeManager.deepMergeWithTracking(
          merged,
          config,
          source,
          mergeOptions.enableChangeTracking ? changes : undefined,
          mergeOptions.preserveSource ? sourceMap : undefined,
          mergeOptions.customMerger
        )

        merged = result.merged
        sourceContributions[source] = result.changedCount
        totalFields = Math.max(totalFields, result.totalCount)
      } else {
        // 浅合并（直接覆盖）
        const result = ConfigMergeManager.shallowMergeWithTracking(
          merged,
          config,
          source,
          mergeOptions.enableChangeTracking ? changes : undefined,
          mergeOptions.preserveSource ? sourceMap : undefined
        )

        merged = result.merged
        sourceContributions[source] = result.changedCount
        totalFields = Math.max(totalFields, result.totalCount)
      }
    }

    changedFields = Object.keys(sourceMap).length

    const endTime = performance.now()
    const mergeTime = endTime - startTime

    const stats: ConfigMergeStats = {
      totalFields,
      changedFields,
      sourceContributions,
      mergeTime
    }

    const result: ConfigMergeResult<T> = {
      merged,
      changes: mergeOptions.enableChangeTracking ? changes : undefined,
      sourceMap: mergeOptions.preserveSource ? sourceMap : undefined,
      stats
    }

    // 🔥 暂时禁用结果缓存
    // performanceOptimizer.cacheConfigMergeResult(cacheKey, result)
    performanceOptimizer.recordMetric('configMergeTime', mergeTime)
    performanceOptimizer.incrementCounter('configMerges')

    return result
  }

  /**
   * 🎯 深度合并配置（带变更跟踪）
   */
  private static deepMergeWithTracking<T>(
    target: T,
    source: any,
    sourceType: ConfigSource,
    changes?: ConfigChangeInfo[],
    sourceMap?: Record<string, ConfigSource>,
    customMerger?: (target: any, source: any, key: string) => any,
    path = ''
  ): { merged: T; changedCount: number; totalCount: number } {
    if (!source || typeof source !== 'object') {
      return { merged: target, changedCount: 0, totalCount: 0 }
    }

    const result = ConfigMergeManager.clone(target) as T
    let changedCount = 0
    let totalCount = Object.keys(source).length

    for (const [key, value] of Object.entries(source)) {
      const currentPath = path ? `${path}.${key}` : key
      const oldValue = (result as any)[key]

      let newValue = value

      // 使用自定义合并函数（如果提供）
      if (customMerger) {
        newValue = customMerger(oldValue, value, key)
      }
      // 递归深度合并对象
      else if (ConfigMergeManager.isPlainObject(value) && ConfigMergeManager.isPlainObject(oldValue)) {
        const childResult = ConfigMergeManager.deepMergeWithTracking(
          oldValue,
          value,
          sourceType,
          changes,
          sourceMap,
          customMerger,
          currentPath
        )
        newValue = childResult.merged
        changedCount += childResult.changedCount
        totalCount += childResult.totalCount
      }

      // 检查是否有变更
      if (!ConfigMergeManager.isEqual(oldValue, newValue)) {
        ;(result as any)[key] = newValue
        changedCount++

        // 记录变更
        if (changes) {
          changes.push({
            path: currentPath,
            oldValue,
            newValue,
            source: sourceType,
            timestamp: Date.now()
          })
        }

        // 记录源信息
        if (sourceMap) {
          sourceMap[currentPath] = sourceType
        }
      }
    }

    return { merged: result, changedCount, totalCount }
  }

  /**
   * 🎯 浅合并配置（带变更跟踪）
   */
  private static shallowMergeWithTracking<T>(
    target: T,
    source: any,
    sourceType: ConfigSource,
    changes?: ConfigChangeInfo[],
    sourceMap?: Record<string, ConfigSource>
  ): { merged: T; changedCount: number; totalCount: number } {
    if (!source || typeof source !== 'object') {
      return { merged: target, changedCount: 0, totalCount: 0 }
    }

    const result = { ...target } as T
    let changedCount = 0
    const totalCount = Object.keys(source).length

    for (const [key, value] of Object.entries(source)) {
      const oldValue = (result as any)[key]

      if (!ConfigMergeManager.isEqual(oldValue, value)) {
        ;(result as any)[key] = value
        changedCount++

        // 记录变更
        if (changes) {
          changes.push({
            path: key,
            oldValue,
            newValue: value,
            source: sourceType,
            timestamp: Date.now()
          })
        }

        // 记录源信息
        if (sourceMap) {
          sourceMap[key] = sourceType
        }
      }
    }

    return { merged: result, changedCount, totalCount }
  }

  /**
   * 🎯 智能配置更新（处理配置优先级冲突）
   * @param currentConfig 当前配置
   * @param newConfig 新配置
   * @param source 新配置来源
   * @param currentSourceMap 当前源映射
   * @returns 更新结果
   */
  static smartUpdate<T>(
    currentConfig: T,
    newConfig: Partial<T>,
    source: ConfigSource,
    currentSourceMap?: Record<string, ConfigSource>
  ): ConfigMergeResult<T> {
    const strategy = ConfigMergeManager.MERGE_STRATEGIES[source]
    const changes: ConfigChangeInfo[] = []
    let result = ConfigMergeManager.clone(currentConfig)
    const newSourceMap = { ...currentSourceMap } || {}

    for (const [key, value] of Object.entries(newConfig)) {
      const currentSource = currentSourceMap?.[key]
      const currentStrategy = currentSource ? ConfigMergeManager.MERGE_STRATEGIES[currentSource] : null

      // 检查优先级冲突
      if (currentStrategy && currentStrategy.priority > strategy.priority) {
        console.warn(`🔄 [ConfigMergeManager] 配置更新被拒绝`, {
          key,
          currentSource,
          newSource: source,
          reason: '新配置优先级低于现有配置'
        })
        continue
      }

      // 检查是否允许覆盖
      if (currentStrategy && !currentStrategy.canOverride) {
        console.warn(`🔄 [ConfigMergeManager] 配置更新被拒绝`, {
          key,
          currentSource,
          newSource: source,
          reason: '现有配置不允许被覆盖'
        })
        continue
      }

      const oldValue = (result as any)[key]
      if (!ConfigMergeManager.isEqual(oldValue, value)) {
        ;(result as any)[key] = value
        newSourceMap[key] = source

        changes.push({
          path: key,
          oldValue,
          newValue: value,
          source,
          timestamp: Date.now()
        })

        if (process.env.NODE_ENV === 'development') {
          console.log(`🔄 [ConfigMergeManager] 配置更新成功`, {
          key,
          oldValue,
          newValue: value,
          source,
          priority: strategy.priority
        })
        }
      }
    }

    return {
      merged: result,
      changes,
      sourceMap: newSourceMap,
      stats: {
        totalFields: Object.keys(newConfig).length,
        changedFields: changes.length,
        sourceContributions: { [source]: changes.length },
        mergeTime: 0
      }
    }
  }

  /**
   * 🎯 清除指定源的配置
   * @param config 当前配置
   * @param sourceMap 源映射
   * @param sourceToRemove 要移除的源
   * @returns 清理后的配置
   */
  static removeSource<T>(
    config: T,
    sourceMap: Record<string, ConfigSource>,
    sourceToRemove: ConfigSource
  ): { config: T; sourceMap: Record<string, ConfigSource>; removedKeys: string[] } {
    const result = ConfigMergeManager.clone(config)
    const newSourceMap = { ...sourceMap }
    const removedKeys: string[] = []

    for (const [key, source] of Object.entries(sourceMap)) {
      if (source === sourceToRemove) {
        delete (result as any)[key]
        delete newSourceMap[key]
        removedKeys.push(key)
      }
    }

    return {
      config: result,
      sourceMap: newSourceMap,
      removedKeys
    }
  }

  /**
   * 工具方法：深拷贝
   */
  private static clone<T>(obj: T): T {
    if (obj === null || typeof obj !== 'object') return obj
    if (obj instanceof Date) return new Date(obj.getTime()) as unknown as T
    if (Array.isArray(obj)) return obj.map(item => ConfigMergeManager.clone(item)) as unknown as T

    if (typeof obj === 'object') {
      const cloned = {} as T
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          cloned[key] = ConfigMergeManager.clone(obj[key])
        }
      }
      return cloned
    }

    return obj
  }

  /**
   * 工具方法：判断是否为普通对象
   */
  private static isPlainObject(obj: any): boolean {
    return obj !== null && typeof obj === 'object' && obj.constructor === Object
  }

  /**
   * 🚀 生成配置缓存键
   */
  private static generateCacheKey<T>(configs: Partial<Record<ConfigSource, T>>, options: ConfigMergeOptions): string {
    // 创建配置内容的哈希
    const configHash = ConfigMergeManager.hashObject(configs)
    const optionsHash = ConfigMergeManager.hashObject(options)

    return `merge_${configHash}_${optionsHash}`
  }

  /**
   * 🚀 简单对象哈希函数
   */
  private static hashObject(obj: any): string {
    const str = JSON.stringify(obj, Object.keys(obj).sort())
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36)
  }

  /**
   * 工具方法：深度比较
   */
  private static isEqual(a: any, b: any): boolean {
    if (a === b) return true
    if (a === null || b === null) return false
    if (typeof a !== typeof b) return false

    if (typeof a === 'object') {
      if (Array.isArray(a) !== Array.isArray(b)) return false

      const keysA = Object.keys(a)
      const keysB = Object.keys(b)

      if (keysA.length !== keysB.length) return false

      for (const key of keysA) {
        if (!keysB.includes(key)) return false
        if (!ConfigMergeManager.isEqual(a[key], b[key])) return false
      }

      return true
    }

    return false
  }
}

/**
 * 🎯 配置合并工具函数（简化接口）
 */
export const ConfigMerge = {
  /**
   * 合并配置
   */
  merge: ConfigMergeManager.mergeConfigs,

  /**
   * 智能更新
   */
  smartUpdate: ConfigMergeManager.smartUpdate,

  /**
   * 移除源
   */
  removeSource: ConfigMergeManager.removeSource,

  /**
   * 创建默认配置结构
   */
  createDefaultConfigs: <T>(defaultConfig: T): Partial<Record<ConfigSource, T>> => ({
    default: defaultConfig
  })
}

if (process.env.NODE_ENV === 'development') {
  console.log('🎯 [ConfigMergeManager] 配置合并策略系统已初始化')
}
