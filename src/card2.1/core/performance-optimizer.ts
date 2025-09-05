/**
 * 🚀 优化4：性能和用户体验优化系统
 * 提供属性系统性能监控、缓存和优化建议
 */

export interface PerformanceMetrics {
  /** 属性注册耗时（毫秒） */
  propertyRegistrationTime: number
  /** 属性解析耗时（毫秒） */
  propertyParsingTime: number
  /** 配置合并耗时（毫秒） */
  configMergeTime: number
  /** 组件渲染耗时（毫秒） */
  componentRenderTime: number
  /** 内存使用情况 */
  memoryUsage?: {
    propertyRegistrySize: number
    configCacheSize: number
    componentInstanceCount: number
  }
  /** 操作统计 */
  operationStats?: {
    propertyLookups: number
    configMerges: number
    pathParses: number
  }
}

export interface PerformanceAlert {
  /** 警告级别 */
  level: 'info' | 'warning' | 'error'
  /** 警告类型 */
  type: 'slowPropertyParsing' | 'excessiveConfigMerges' | 'memoryLeak' | 'pathParsingBottleneck'
  /** 警告消息 */
  message: string
  /** 相关数据 */
  data: any
  /** 建议的优化措施 */
  suggestions: string[]
  /** 时间戳 */
  timestamp: number
}

export interface CacheEntry<T = any> {
  /** 缓存的值 */
  value: T
  /** 创建时间 */
  createdAt: number
  /** 最后访问时间 */
  lastAccessed: number
  /** 访问次数 */
  accessCount: number
  /** 缓存键 */
  key: string
}

/**
 * 性能优化器
 * 监控和优化属性系统性能
 */
export class PerformanceOptimizer {
  private static instance: PerformanceOptimizer
  
  // 性能指标
  private metrics: PerformanceMetrics = {
    propertyRegistrationTime: 0,
    propertyParsingTime: 0,
    configMergeTime: 0,
    componentRenderTime: 0,
    memoryUsage: {
      propertyRegistrySize: 0,
      configCacheSize: 0,
      componentInstanceCount: 0
    },
    operationStats: {
      propertyLookups: 0,
      configMerges: 0,
      pathParses: 0
    }
  }

  // 性能警报
  private alerts: PerformanceAlert[] = []
  
  // 缓存系统
  private configCache = new Map<string, CacheEntry>()
  private propertyCache = new Map<string, CacheEntry>()
  private pathCache = new Map<string, CacheEntry>()
  
  // 性能阈值
  private readonly THRESHOLDS = {
    SLOW_PROPERTY_PARSING: 50, // 50ms
    EXCESSIVE_CONFIG_MERGES: 100, // 每分钟100次
    CACHE_SIZE_LIMIT: 1000, // 最大缓存条目数
    MEMORY_WARNING_SIZE: 10 * 1024 * 1024 // 10MB
  }

  // 统计计数器
  private counters = {
    configMergesPerMinute: 0,
    lastMinuteReset: Date.now()
  }

  private constructor() {
    // 定期清理过期缓存
    setInterval(() => this.cleanupExpiredCache(), 5 * 60 * 1000) // 5分钟
    // 定期重置计数器
    setInterval(() => this.resetCounters(), 60 * 1000) // 1分钟
  }

  /**
   * 获取单例实例
   */
  static getInstance(): PerformanceOptimizer {
    if (!this.instance) {
      this.instance = new PerformanceOptimizer()
    }
    return this.instance
  }

  /**
   * 🎯 记录性能指标
   */
  recordMetric(type: keyof PerformanceMetrics, value: number): void {
    if (typeof this.metrics[type] === 'number') {
      (this.metrics as any)[type] = value
    }
    
    // 检查性能警报
    this.checkPerformanceThresholds(type, value)
  }

  /**
   * 🎯 增加操作统计
   */
  incrementCounter(operation: keyof NonNullable<PerformanceMetrics['operationStats']>): void {
    if (this.metrics.operationStats) {
      this.metrics.operationStats[operation]++
    }

    // 特殊处理配置合并计数
    if (operation === 'configMerges') {
      this.counters.configMergesPerMinute++
    }
  }

  /**
   * 🎯 缓存配置合并结果
   */
  cacheConfigMergeResult(key: string, result: any): void {
    this.setCache(this.configCache, key, result)
  }

  /**
   * 🎯 获取缓存的配置合并结果
   */
  getCachedConfigMergeResult(key: string): any {
    return this.getCache(this.configCache, key)
  }

  /**
   * 🎯 缓存属性解析结果
   */
  cachePropertyParseResult(path: string, result: any): void {
    this.setCache(this.propertyCache, path, result)
  }

  /**
   * 🎯 获取缓存的属性解析结果
   */
  getCachedPropertyParseResult(path: string): any {
    return this.getCache(this.propertyCache, path)
  }

  /**
   * 🎯 缓存路径解析结果
   */
  cachePathParseResult(path: string, result: any): void {
    this.setCache(this.pathCache, path, result)
  }

  /**
   * 🎯 获取缓存的路径解析结果
   */
  getCachedPathParseResult(path: string): any {
    return this.getCache(this.pathCache, path)
  }

  /**
   * 🎯 获取当前性能报告
   */
  getPerformanceReport(): {
    metrics: PerformanceMetrics
    alerts: PerformanceAlert[]
    recommendations: string[]
    cacheStats: {
      configCache: number
      propertyCache: number
      pathCache: number
    }
  } {
    return {
      metrics: { ...this.metrics },
      alerts: [...this.alerts],
      recommendations: this.generateRecommendations(),
      cacheStats: {
        configCache: this.configCache.size,
        propertyCache: this.propertyCache.size,
        pathCache: this.pathCache.size
      }
    }
  }

  /**
   * 🎯 清理性能数据
   */
  clearPerformanceData(): void {
    this.alerts = []
    this.configCache.clear()
    this.propertyCache.clear()
    this.pathCache.clear()
    
    // 重置指标
    this.metrics = {
      propertyRegistrationTime: 0,
      propertyParsingTime: 0,
      configMergeTime: 0,
      componentRenderTime: 0,
      memoryUsage: {
        propertyRegistrySize: 0,
        configCacheSize: 0,
        componentInstanceCount: 0
      },
      operationStats: {
        propertyLookups: 0,
        configMerges: 0,
        pathParses: 0
      }
    }
  }

  /**
   * 通用缓存设置
   */
  private setCache<T>(cache: Map<string, CacheEntry<T>>, key: string, value: T): void {
    // 检查缓存大小限制
    if (cache.size >= this.THRESHOLDS.CACHE_SIZE_LIMIT) {
      this.evictLRUCache(cache)
    }

    cache.set(key, {
      value,
      createdAt: Date.now(),
      lastAccessed: Date.now(),
      accessCount: 1,
      key
    })
  }

  /**
   * 通用缓存获取
   */
  private getCache<T>(cache: Map<string, CacheEntry<T>>, key: string): T | undefined {
    const entry = cache.get(key)
    if (entry) {
      entry.lastAccessed = Date.now()
      entry.accessCount++
      return entry.value
    }
    return undefined
  }

  /**
   * LRU缓存淘汰策略
   */
  private evictLRUCache<T>(cache: Map<string, CacheEntry<T>>): void {
    let oldestEntry: { key: string; lastAccessed: number } | null = null
    
    for (const [key, entry] of cache.entries()) {
      if (!oldestEntry || entry.lastAccessed < oldestEntry.lastAccessed) {
        oldestEntry = { key, lastAccessed: entry.lastAccessed }
      }
    }

    if (oldestEntry) {
      cache.delete(oldestEntry.key)
    }
  }

  /**
   * 检查性能阈值
   */
  private checkPerformanceThresholds(type: keyof PerformanceMetrics, value: number): void {
    const now = Date.now()

    switch (type) {
      case 'propertyParsingTime':
        if (value > this.THRESHOLDS.SLOW_PROPERTY_PARSING) {
          this.addAlert({
            level: 'warning',
            type: 'slowPropertyParsing',
            message: `属性解析耗时过长: ${value}ms`,
            data: { parseTime: value },
            suggestions: [
              '考虑缓存属性解析结果',
              '优化属性路径格式',
              '减少嵌套层级'
            ],
            timestamp: now
          })
        }
        break

      case 'configMergeTime':
        if (this.counters.configMergesPerMinute > this.THRESHOLDS.EXCESSIVE_CONFIG_MERGES) {
          this.addAlert({
            level: 'warning',
            type: 'excessiveConfigMerges',
            message: `配置合并次数过多: ${this.counters.configMergesPerMinute}次/分钟`,
            data: { mergesPerMinute: this.counters.configMergesPerMinute },
            suggestions: [
              '启用配置缓存',
              '减少配置更新频率',
              '批量处理配置变更'
            ],
            timestamp: now
          })
        }
        break
    }
  }

  /**
   * 添加性能警报
   */
  private addAlert(alert: PerformanceAlert): void {
    this.alerts.push(alert)
    
    // 限制警报数量
    if (this.alerts.length > 50) {
      this.alerts = this.alerts.slice(-25) // 保留最新25条
    }

    console.warn(`🚨 [PerformanceOptimizer] ${alert.level.toUpperCase()}:`, alert.message, alert.data)
  }

  /**
   * 生成性能优化建议
   */
  private generateRecommendations(): string[] {
    const recommendations: string[] = []

    // 基于当前指标生成建议
    if (this.metrics.propertyParsingTime > this.THRESHOLDS.SLOW_PROPERTY_PARSING) {
      recommendations.push('启用属性解析缓存以提升性能')
    }

    if (this.configCache.size > this.THRESHOLDS.CACHE_SIZE_LIMIT * 0.8) {
      recommendations.push('考虑增加缓存清理频率或调整缓存大小限制')
    }

    if (this.counters.configMergesPerMinute > this.THRESHOLDS.EXCESSIVE_CONFIG_MERGES * 0.7) {
      recommendations.push('考虑批量处理配置变更以减少合并次数')
    }

    return recommendations
  }

  /**
   * 清理过期缓存
   */
  private cleanupExpiredCache(): void {
    const now = Date.now()
    const expireTime = 10 * 60 * 1000 // 10分钟过期

    this.cleanupCacheMap(this.configCache, now, expireTime)
    this.cleanupCacheMap(this.propertyCache, now, expireTime)
    this.cleanupCacheMap(this.pathCache, now, expireTime)
  }

  private cleanupCacheMap<T>(cache: Map<string, CacheEntry<T>>, now: number, expireTime: number): void {
    for (const [key, entry] of cache.entries()) {
      if (now - entry.lastAccessed > expireTime) {
        cache.delete(key)
      }
    }
  }

  /**
   * 重置计数器
   */
  private resetCounters(): void {
    this.counters.configMergesPerMinute = 0
    this.counters.lastMinuteReset = Date.now()
  }
}

/**
 * 🎯 性能监控装饰器
 */
export function measurePerformance(metricType: keyof PerformanceMetrics) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value

    descriptor.value = function (...args: any[]) {
      const startTime = performance.now()
      const result = originalMethod.apply(this, args)
      const endTime = performance.now()
      
      const optimizer = PerformanceOptimizer.getInstance()
      optimizer.recordMetric(metricType, endTime - startTime)
      
      return result
    }

    return descriptor
  }
}

/**
 * 全局性能优化器实例
 */
export const performanceOptimizer = PerformanceOptimizer.getInstance()

console.log('🚀 [PerformanceOptimizer] 性能优化系统已初始化')