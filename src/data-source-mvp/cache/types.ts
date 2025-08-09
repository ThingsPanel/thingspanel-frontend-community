// 缓存选项
export interface CacheOptions {
  ttl?: number
  preloaded?: boolean
  metadata?: Record<string, any>
}

// 访问模式
export interface AccessPattern {
  frequency: 'high' | 'medium' | 'low'
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night' | 'any'
  dayOfWeek: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday' | 'any'
  lastAccess: Date | null
  accessCount?: number
}

// 缓存条目
export interface CacheEntry {
  data: any
  timestamp: number
  ttl: number
  accessCount: number
  lastAccess: number
  accessPattern: AccessPattern
  metadata: Record<string, any>
}

// 缓存统计
export interface CacheStats {
  size: number
  memoryUsage: number
  hitRate: number
  averageAge: number
  accessPatterns: AccessPatternStats
}

// 访问模式统计
export interface AccessPatternStats {
  highFrequency: number
  mediumFrequency: number
  lowFrequency: number
}
