/**
 * 优化的配置管理器
 * 提供智能缓存机制和性能优化功能
 */

import type { WidgetConfiguration } from '@/components/visual-editor/configuration/types'
import { configurationStateManager } from '@/components/visual-editor/configuration/ConfigurationStateManager'

/**
 * 缓存项接口
 */
interface CacheItem<T = any> {
  /** 缓存数据 */
  data: T
  /** 创建时间戳 */
  timestamp: number
  /** 访问次数 */
  accessCount: number
  /** 最后访问时间 */
  lastAccess: number
}

/**
 * 缓存配置
 */
interface CacheConfig {
  /** 缓存存活时间（毫秒），默认5秒 */
  ttl: number
  /** 最大缓存条目数，默认100 */
  maxSize: number
  /** 清理间隔（毫秒），默认30秒 */
  cleanupInterval: number
}

/**
 * 优化的配置管理器类
 * 在现有ConfigurationIntegrationBridge基础上添加智能缓存层
 */
export class OptimizedConfigurationManager {
  /** 配置缓存 */
  private configCache = new Map<string, CacheItem<WidgetConfiguration>>()

  /** 计算属性缓存 */
  private computedCache = new Map<string, CacheItem<any>>()

  /** 缓存配置 */
  private cacheConfig: CacheConfig

  /** 清理定时器 */
  private cleanupTimer: NodeJS.Timeout | null = null

  /** 缓存统计 */
  private stats = {
    hits: 0,
    misses: 0,
    evictions: 0
  }

  constructor(config?: Partial<CacheConfig>) {
    this.cacheConfig = {
      ttl: 5000, // 5秒缓存
      maxSize: 100, // 最多100个条目
      cleanupInterval: 30000, // 30秒清理一次
      ...config
    }

    this.startCleanupTimer()
  }

  /**
   * 获取配置（带缓存）
   * @param widgetId 组件ID
   * @param configType 配置类型
   * @returns 配置数据或null
   */
  getConfigurationOptimized<T = WidgetConfiguration>(widgetId: string, configType?: string): T | null {
    const cacheKey = this.buildCacheKey(widgetId, configType)
    const cached = this.configCache.get(cacheKey)

    if (this.isCacheValid(cached)) {
      // 缓存命中
      this.stats.hits++
      this.updateAccessInfo(cached!)
      return cached!.data as T
    }

    // 缓存未命中，从状态管理器获取
    this.stats.misses++
    const config = configurationStateManager.getConfiguration(widgetId)

    if (config) {
      // 存储到缓存
      this.setCache(cacheKey, config)
    }

    return config as T | null
  }

  /**
   * 设置配置（同时更新缓存）
   * @param widgetId 组件ID
   * @param config 配置数据
   * @param componentType 组件类型（可选）
   */
  setConfigurationOptimized(widgetId: string, config: WidgetConfiguration, componentType?: string): void {
    // 更新到状态管理器
    configurationStateManager.setConfiguration(widgetId, config, 'user')

    // 更新缓存
    const cacheKey = this.buildCacheKey(widgetId)
    this.setCache(cacheKey, config)

    // 清理相关的计算缓存
    this.invalidateComputedCache(widgetId)
  }

  /**
   * 获取计算属性（带缓存）
   * @param key 计算键
   * @param computeFn 计算函数
   * @returns 计算结果
   */
  getComputedValue<T>(key: string, computeFn: () => T): T {
    const cached = this.computedCache.get(key)

    if (this.isCacheValid(cached)) {
      this.updateAccessInfo(cached!)
      return cached!.data as T
    }

    // 执行计算
    const result = computeFn()

    // 存储到缓存
    this.setComputedCache(key, result)

    return result
  }

  /**
   * 手动清除指定组件的缓存
   * @param widgetId 组件ID
   */
  clearComponentCache(widgetId: string): void {
    // 清除配置缓存
    const configKeys = Array.from(this.configCache.keys()).filter(key => key.startsWith(`${widgetId}:`))
    configKeys.forEach(key => this.configCache.delete(key))

    // 清除相关计算缓存
    this.invalidateComputedCache(widgetId)
  }

  /**
   * 清除所有缓存
   */
  clearAllCache(): void {
    this.configCache.clear()
    this.computedCache.clear()
  }

  /**
   * 获取缓存统计信息
   */
  getCacheStats() {
    const hitRate =
      this.stats.hits + this.stats.misses > 0
        ? ((this.stats.hits / (this.stats.hits + this.stats.misses)) * 100).toFixed(2)
        : '0'

    return {
      ...this.stats,
      hitRate: `${hitRate}%`,
      configCacheSize: this.configCache.size,
      computedCacheSize: this.computedCache.size,
      totalCacheSize: this.configCache.size + this.computedCache.size
    }
  }

  /**
   * 构建缓存键
   */
  private buildCacheKey(widgetId: string, configType?: string): string {
    return configType ? `${widgetId}:${configType}` : `${widgetId}:default`
  }

  /**
   * 检查缓存是否有效
   */
  private isCacheValid(item?: CacheItem): boolean {
    if (!item) return false

    const now = Date.now()
    return now - item.timestamp < this.cacheConfig.ttl
  }

  /**
   * 更新访问信息
   */
  private updateAccessInfo(item: CacheItem): void {
    item.accessCount++
    item.lastAccess = Date.now()
  }

  /**
   * 设置配置缓存
   */
  private setCache(key: string, data: any): void {
    // 检查是否需要清理
    if (this.configCache.size >= this.cacheConfig.maxSize) {
      this.evictLeastUsed()
    }

    const now = Date.now()
    this.configCache.set(key, {
      data,
      timestamp: now,
      accessCount: 1,
      lastAccess: now
    })
  }

  /**
   * 设置计算缓存
   */
  private setComputedCache(key: string, data: any): void {
    if (this.computedCache.size >= this.cacheConfig.maxSize) {
      this.evictLeastUsedComputed()
    }

    const now = Date.now()
    this.computedCache.set(key, {
      data,
      timestamp: now,
      accessCount: 1,
      lastAccess: now
    })
  }

  /**
   * 清理相关计算缓存
   */
  private invalidateComputedCache(widgetId: string): void {
    const keysToDelete = Array.from(this.computedCache.keys()).filter(key => key.includes(widgetId))
    keysToDelete.forEach(key => this.computedCache.delete(key))
  }

  /**
   * 驱逐最少使用的配置缓存项
   */
  private evictLeastUsed(): void {
    let leastUsedKey = ''
    let leastAccess = Infinity

    for (const [key, item] of this.configCache.entries()) {
      if (item.accessCount < leastAccess) {
        leastAccess = item.accessCount
        leastUsedKey = key
      }
    }

    if (leastUsedKey) {
      this.configCache.delete(leastUsedKey)
      this.stats.evictions++
    }
  }

  /**
   * 驱逐最少使用的计算缓存项
   */
  private evictLeastUsedComputed(): void {
    let leastUsedKey = ''
    let leastAccess = Infinity

    for (const [key, item] of this.computedCache.entries()) {
      if (item.accessCount < leastAccess) {
        leastAccess = item.accessCount
        leastUsedKey = key
      }
    }

    if (leastUsedKey) {
      this.computedCache.delete(leastUsedKey)
    }
  }

  /**
   * 启动清理定时器
   */
  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanupExpiredEntries()
    }, this.cacheConfig.cleanupInterval)
  }

  /**
   * 清理过期条目
   */
  private cleanupExpiredEntries(): void {
    const now = Date.now()

    // 清理配置缓存
    for (const [key, item] of this.configCache.entries()) {
      if (now - item.timestamp >= this.cacheConfig.ttl) {
        this.configCache.delete(key)
      }
    }

    // 清理计算缓存
    for (const [key, item] of this.computedCache.entries()) {
      if (now - item.timestamp >= this.cacheConfig.ttl) {
        this.computedCache.delete(key)
      }
    }
  }

  /**
   * 销毁管理器，清理定时器
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
      this.cleanupTimer = null
    }

    this.clearAllCache()
  }
}

/**
 * 创建优化的配置管理器实例
 */
export const optimizedConfigurationManager = new OptimizedConfigurationManager({
  ttl: 5000, // 5秒缓存
  maxSize: 50, // 适中的缓存大小
  cleanupInterval: 30000 // 30秒清理间隔
})

/**
 * 导出缓存配置类型以便使用
 */
export type { CacheConfig, CacheItem }
