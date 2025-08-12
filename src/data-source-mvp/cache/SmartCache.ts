import type { CacheOptions, CacheEntry, AccessPattern, CacheStats, AccessPatternStats } from './types'

export class SmartCache {
  private cache: Map<string, CacheEntry> = new Map()
  private accessPatterns: Map<string, AccessPattern> = new Map()
  private maxSize: number = 200
  private cleanupInterval: number = 300000 // 5分钟清理一次

  constructor() {
    this.startCleanupTimer()
  }

  // 设置缓存
  set(key: string, data: any, options: CacheOptions = {}): void {
    const pattern = this.analyzeAccessPattern(key)
    const ttl = this.calculateOptimalTTL(pattern, options)

    // 如果缓存已满，清理最少使用的条目
    if (this.cache.size >= this.maxSize) {
      this.evictLeastUsed()
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
      accessCount: 0,
      lastAccess: Date.now(),
      accessPattern: pattern,
      metadata: options.metadata || {}
    })
  }

  // 获取缓存
  get(key: string): any | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    // 检查是否过期
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return null
    }

    // 更新访问信息
    entry.accessCount++
    entry.lastAccess = Date.now()

    // 更新访问模式
    this.updateAccessPattern(key, entry)

    return entry.data
  }

  // 智能预加载
  async preload(keys: string[], dataLoader: (key: string) => Promise<any>): Promise<void> {
    const loadPromises = keys.map(async key => {
      if (!this.cache.has(key)) {
        try {
          const data = await dataLoader(key)
          this.set(key, data, { preloaded: true })
        } catch (error) {
          console.warn(`预加载失败: ${key}`, error)
        }
      }
    })

    await Promise.all(loadPromises)
  }

  // 分析访问模式
  private analyzeAccessPattern(key: string): AccessPattern {
    const pattern = this.accessPatterns.get(key) || {
      frequency: 'low',
      timeOfDay: 'any',
      dayOfWeek: 'any',
      lastAccess: null
    }

    return pattern
  }

  // 计算最优TTL
  private calculateOptimalTTL(pattern: AccessPattern, options: CacheOptions): number {
    const baseTTL = options.ttl || 60000

    // 根据访问模式调整TTL
    switch (pattern.frequency) {
      case 'high':
        return baseTTL * 2 // 高频访问，延长缓存时间
      case 'medium':
        return baseTTL
      case 'low':
        return baseTTL * 0.5 // 低频访问，缩短缓存时间
      default:
        return baseTTL
    }
  }

  // 更新访问模式
  private updateAccessPattern(key: string, entry: CacheEntry): void {
    const now = new Date()
    const pattern = this.accessPatterns.get(key) || {
      frequency: 'low',
      timeOfDay: 'any',
      dayOfWeek: 'any',
      lastAccess: null,
      accessCount: 0
    }

    // 更新访问频率
    pattern.accessCount++
    if (pattern.accessCount > 100) pattern.frequency = 'high'
    else if (pattern.accessCount > 10) pattern.frequency = 'medium'
    else pattern.frequency = 'low'

    // 更新时间模式
    pattern.lastAccess = now
    pattern.timeOfDay = this.getTimeOfDay(now)
    pattern.dayOfWeek = this.getDayOfWeek(now)

    this.accessPatterns.set(key, pattern)
  }

  // 清理最少使用的缓存
  private evictLeastUsed(): void {
    const entries = Array.from(this.cache.entries())
    entries.sort((a, b) => {
      const scoreA = this.calculateEvictionScore(a[1])
      const scoreB = this.calculateEvictionScore(b[1])
      return scoreA - scoreB
    })

    // 删除20%的缓存条目
    const evictCount = Math.floor(this.maxSize * 0.2)
    for (let i = 0; i < evictCount; i++) {
      this.cache.delete(entries[i][0])
    }
  }

  // 计算驱逐分数
  private calculateEvictionScore(entry: CacheEntry): number {
    const age = Date.now() - entry.timestamp
    const accessFrequency = entry.accessCount / Math.max(age / 1000, 1)
    const pattern = entry.accessPattern

    let score = age * 0.1 // 年龄权重
    score -= accessFrequency * 1000 // 访问频率权重
    score -= entry.accessCount * 100 // 总访问次数权重

    // 根据访问模式调整分数
    if (pattern.frequency === 'high') score -= 1000
    else if (pattern.frequency === 'medium') score -= 500

    return score
  }

  // 启动清理定时器
  private startCleanupTimer(): void {
    setInterval(() => {
      this.cleanup()
    }, this.cleanupInterval)
  }

  // 清理过期缓存
  private cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key)
      }
    }
  }

  private getTimeOfDay(date: Date): string {
    const hour = date.getHours()
    if (hour < 6) return 'night'
    if (hour < 12) return 'morning'
    if (hour < 18) return 'afternoon'
    return 'evening'
  }

  private getDayOfWeek(date: Date): string {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    return days[date.getDay()]
  }

  // 获取缓存统计
  getStats(): CacheStats {
    const entries = Array.from(this.cache.values())
    const totalSize = entries.length
    const totalMemory = this.estimateMemoryUsage()

    return {
      size: totalSize,
      memoryUsage: totalMemory,
      hitRate: this.calculateHitRate(),
      averageAge: this.calculateAverageAge(entries),
      accessPatterns: this.getAccessPatternStats()
    }
  }

  private estimateMemoryUsage(): number {
    // 简单估算内存使用
    return this.cache.size * 1024 // 假设每个条目平均1KB
  }

  private calculateHitRate(): number {
    // 这里需要实现命中率计算
    return 0.8 // 示例值
  }

  private calculateAverageAge(entries: CacheEntry[]): number {
    if (entries.length === 0) return 0
    const totalAge = entries.reduce((sum, entry) => sum + (Date.now() - entry.timestamp), 0)
    return totalAge / entries.length
  }

  private getAccessPatternStats(): AccessPatternStats {
    const patterns = Array.from(this.accessPatterns.values())
    return {
      highFrequency: patterns.filter(p => p.frequency === 'high').length,
      mediumFrequency: patterns.filter(p => p.frequency === 'medium').length,
      lowFrequency: patterns.filter(p => p.frequency === 'low').length
    }
  }
}
