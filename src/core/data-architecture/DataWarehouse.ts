/**
 * 增强数据仓库系统 (Enhanced Data Warehouse)
 * SUBTASK-003: 数据仓库优化增强
 *
 * 核心功能:
 * 1. 多数据源数据隔离存储
 * 2. 性能优化和内存管理
 * 3. 动态参数存储管理（预留）
 * 4. 缓存策略和过期管理
 */

import type { ComponentDataRequirement } from '@/core/data-architecture/SimpleDataBridge'
import { dataSourceLogger } from '@/utils/logger'

/**
 * 数据存储项接口
 */
export interface DataStorageItem {
  /** 数据内容 */
  data: any
  /** 存储时间戳 */
  timestamp: number
  /** 过期时间戳 */
  expiresAt?: number
  /** 数据来源信息 */
  source: {
    /** 数据源ID */
    sourceId: string
    /** 数据源类型 */
    sourceType: string
    /** 组件ID */
    componentId: string
  }
  /** 数据大小（字节） */
  size: number
  /** 访问次数 */
  accessCount: number
  /** 最后访问时间 */
  lastAccessed: number
}

/**
 * 组件数据存储结构
 */
export interface ComponentDataStorage {
  /** 组件ID */
  componentId: string
  /** 数据源数据映射 */
  dataSources: Map<string, DataStorageItem>
  /** 合并后的数据（缓存） */
  mergedData?: DataStorageItem
  /** 组件创建时间 */
  createdAt: number
  /** 最后更新时间 */
  updatedAt: number
}

/**
 * 动态参数存储接口（预留Phase 2使用）
 */
export interface DynamicParameterStorage {
  /** 参数名称 */
  name: string
  /** 参数值 */
  value: any
  /** 参数类型 */
  type: 'string' | 'number' | 'boolean' | 'object' | 'array'
  /** 作用域 */
  scope: 'global' | 'component' | 'session'
  /** 过期时间 */
  expiresAt?: number
  /** 依赖关系 */
  dependencies?: string[]
}

/**
 * 仓库配置选项
 */
export interface DataWarehouseConfig {
  /** 默认缓存过期时间（毫秒） */
  defaultCacheExpiry: number
  /** 最大内存使用量（MB） */
  maxMemoryUsage: number
  /** 清理检查间隔（毫秒） */
  cleanupInterval: number
  /** 最大存储项数量 */
  maxStorageItems: number
  /** 启用性能监控 */
  enablePerformanceMonitoring: boolean
}

/**
 * 性能监控数据
 */
export interface PerformanceMetrics {
  /** 总内存使用（MB） */
  memoryUsage: number
  /** 存储项数量 */
  itemCount: number
  /** 组件数量 */
  componentCount: number
  /** 平均响应时间（ms） */
  averageResponseTime: number
  /** 缓存命中率 */
  cacheHitRate: number
  /** 最后清理时间 */
  lastCleanupTime: number
}

/**
 * 增强数据仓库类
 * 提供多数据源隔离存储和性能优化功能
 */
export class EnhancedDataWarehouse {
  /** 组件数据存储 */
  private componentStorage = new Map<string, ComponentDataStorage>()

  /** 动态参数存储（预留） */
  private parameterStorage = new Map<string, DynamicParameterStorage>()

  /** 仓库配置 */
  private config: DataWarehouseConfig

  /** 性能监控数据 */
  private metrics: PerformanceMetrics

  /** 清理定时器 */
  private cleanupTimer: NodeJS.Timeout | null = null

  /** 性能监控定时器 */
  private metricsTimer: NodeJS.Timeout | null = null

  constructor(config: Partial<DataWarehouseConfig> = {}) {
    // 初始化配置
    this.config = {
      defaultCacheExpiry: 5 * 60 * 1000, // 5分钟
      maxMemoryUsage: 100, // 100MB
      cleanupInterval: 60 * 1000, // 1分钟
      maxStorageItems: 1000,
      enablePerformanceMonitoring: true,
      ...config
    }

    // 初始化性能监控数据
    this.metrics = {
      memoryUsage: 0,
      itemCount: 0,
      componentCount: 0,
      averageResponseTime: 0,
      cacheHitRate: 0,
      lastCleanupTime: Date.now()
    }

    // 启动定期清理
    this.startCleanupTimer()

    // 启动性能监控
    if (this.config.enablePerformanceMonitoring) {
      this.startMetricsCollection()
    }
  }

  /**
   * 存储组件数据
   * @param componentId 组件ID
   * @param sourceId 数据源ID
   * @param data 数据内容
   * @param sourceType 数据源类型
   * @param customExpiry 自定义过期时间
   */
  storeComponentData(
    componentId: string,
    sourceId: string,
    data: any,
    sourceType: string = 'unknown',
    customExpiry?: number
  ): void {
    const now = Date.now()
    const startTime = now

    console.log(`🔍 [DataWarehouse] 开始存储组件数据: ${componentId}/${sourceId}`, data)

    // 计算数据大小（估算）
    const dataSize = this.calculateDataSize(data)

    // 检查内存限制
    if (this.shouldRejectStorage(dataSize)) {
      console.log(`❌ [DataWarehouse] 存储被拒绝，内存限制: ${dataSize} bytes`)
      return
    }

    // 获取或创建组件存储
    let componentStorage = this.componentStorage.get(componentId)
    if (!componentStorage) {
      console.log(`✅ [DataWarehouse] 创建新组件存储: ${componentId}`)
      componentStorage = {
        componentId,
        dataSources: new Map(),
        createdAt: now,
        updatedAt: now
      }
      this.componentStorage.set(componentId, componentStorage)
    }

    // 创建存储项
    const storageItem: DataStorageItem = {
      data,
      timestamp: now,
      expiresAt: customExpiry ? now + customExpiry : now + this.config.defaultCacheExpiry,
      source: {
        sourceId,
        sourceType,
        componentId
      },
      size: dataSize,
      accessCount: 0,
      lastAccessed: now
    }

    // 存储数据
    componentStorage.dataSources.set(sourceId, storageItem)
    componentStorage.updatedAt = now

    // 清除合并数据缓存（因为数据源发生变化）
    if (componentStorage.mergedData) {
      console.log(`🔄 [DataWarehouse] 清除合并数据缓存: ${componentId}`)
      componentStorage.mergedData = undefined
    }

    console.log(`✅ [DataWarehouse] 成功存储数据: ${componentId}/${sourceId}, 大小: ${dataSize} bytes`)

    // 🎯 用户要求的打印这几个字 - 阶段2：DataWarehouse存储完成
    console.log(`🎯 用户要求的打印这几个字 - 阶段2：DataWarehouse存储完成`, {
      componentId,
      sourceId,
      数据类型: typeof data,
      数据大小: dataSize,
      存储的数据内容: data,
      是否为对象: typeof data === 'object',
      对象键值: typeof data === 'object' && data !== null ? Object.keys(data) : '非对象类型'
    })

    // 更新性能监控
    const responseTime = Date.now() - startTime
    this.updateMetrics(responseTime, 'store')
  }

  /**
   * 获取组件数据
   * @param componentId 组件ID
   * @returns 组件完整数据或null
   */
  getComponentData(componentId: string): Record<string, any> | null {
    const startTime = Date.now()

    const componentStorage = this.componentStorage.get(componentId)
    if (!componentStorage) {
      console.log(`🔍 [DataWarehouse] 组件 ${componentId} 没有存储数据`)
      this.updateMetrics(Date.now() - startTime, 'get', false)
      return null
    }

    // 检查是否有缓存的合并数据
    if (componentStorage.mergedData && !this.isExpired(componentStorage.mergedData)) {
      componentStorage.mergedData.accessCount++
      componentStorage.mergedData.lastAccessed = Date.now()
      this.updateMetrics(Date.now() - startTime, 'get', true)
      console.log(`✅ [DataWarehouse] 从缓存获取组件 ${componentId} 数据，数据源数量: ${Object.keys(componentStorage.mergedData.data).length}`)
      return componentStorage.mergedData.data
    }

    // 构建组件数据对象
    const componentData: Record<string, any> = {}
    let hasValidData = false

    console.log(`🔍 [DataWarehouse] 组件 ${componentId} 数据源数量: ${componentStorage.dataSources.size}`)
    
    for (const [sourceId, item] of componentStorage.dataSources) {
      if (!this.isExpired(item)) {
        componentData[sourceId] = item.data
        item.accessCount++
        item.lastAccessed = Date.now()
        hasValidData = true
        console.log(`✅ [DataWarehouse] 包含有效数据源 ${sourceId}:`, item.data)
      } else {
        console.log(`❌ [DataWarehouse] 数据源 ${sourceId} 已过期，删除`)
        componentStorage.dataSources.delete(sourceId)
      }
    }

    if (!hasValidData) {
      console.log(`❌ [DataWarehouse] 组件 ${componentId} 没有有效数据`)
      this.updateMetrics(Date.now() - startTime, 'get', false)
      return null
    }

    // 缓存合并数据
    componentStorage.mergedData = {
      data: componentData,
      timestamp: Date.now(),
      expiresAt: Date.now() + this.config.defaultCacheExpiry,
      source: {
        sourceId: '*merged*',
        sourceType: 'merged',
        componentId
      },
      size: this.calculateDataSize(componentData),
      accessCount: 1,
      lastAccessed: Date.now()
    }

    console.log(`✅ [DataWarehouse] 成功获取组件 ${componentId} 数据，包含 ${Object.keys(componentData).length} 个数据源`)

    // 🎯 用户要求的打印这几个字 - 阶段2.5：DataWarehouse数据读取完成
    console.log(`🎯 用户要求的打印这几个字 - 阶段2.5：DataWarehouse数据读取完成`, {
      componentId,
      读取的数据源数量: Object.keys(componentData).length,
      数据源列表: Object.keys(componentData),
      完整数据内容: componentData,
      各数据源详情: Object.entries(componentData).map(([sourceId, sourceData]) => ({
        数据源ID: sourceId,
        数据类型: typeof sourceData,
        数据内容: sourceData
      }))
    })

    this.updateMetrics(Date.now() - startTime, 'get', true)
    return componentData
  }

  /**
   * 获取单个数据源数据
   * @param componentId 组件ID
   * @param sourceId 数据源ID
   * @returns 数据源数据或null
   */
  getDataSourceData(componentId: string, sourceId: string): any {
    const componentStorage = this.componentStorage.get(componentId)
    if (!componentStorage) {
      return null
    }

    const item = componentStorage.dataSources.get(sourceId)
    if (!item || this.isExpired(item)) {
      if (item) {
        componentStorage.dataSources.delete(sourceId)
      }
      return null
    }

    item.accessCount++
    item.lastAccessed = Date.now()
    return item.data
  }

  /**
   * 清除组件缓存
   * @param componentId 组件ID
   */
  clearComponentCache(componentId: string): void {
    const componentStorage = this.componentStorage.get(componentId)
    if (componentStorage) {
      const dataSourceCount = componentStorage.dataSources.size
      this.componentStorage.delete(componentId)
    }
  }

  /**
   * 清除数据源缓存
   * @param componentId 组件ID
   * @param sourceId 数据源ID
   */
  clearDataSourceCache(componentId: string, sourceId: string): void {
    const componentStorage = this.componentStorage.get(componentId)
    if (componentStorage) {
      const removed = componentStorage.dataSources.delete(sourceId)
      if (removed) {
        // 清除合并数据缓存
        componentStorage.mergedData = undefined
      }
    }
  }

  /**
   * 清除所有缓存
   */
  clearAllCache(): void {
    const componentCount = this.componentStorage.size
    this.componentStorage.clear()
    this.parameterStorage.clear()
  }

  /**
   * 设置缓存过期时间
   * @param milliseconds 过期时间（毫秒）
   */
  setCacheExpiry(milliseconds: number): void {
    this.config.defaultCacheExpiry = milliseconds
  }

  /**
   * 获取性能监控数据
   */
  getPerformanceMetrics(): PerformanceMetrics {
    this.updateCurrentMetrics()
    return { ...this.metrics }
  }

  /**
   * 获取存储统计信息
   */
  getStorageStats() {
    let totalItems = 0
    let totalSize = 0
    const componentStats: Record<string, any> = {}

    for (const [componentId, storage] of this.componentStorage) {
      const componentSize = Array.from(storage.dataSources.values()).reduce((sum, item) => sum + item.size, 0)

      componentStats[componentId] = {
        dataSourceCount: storage.dataSources.size,
        totalSize: componentSize,
        createdAt: storage.createdAt,
        updatedAt: storage.updatedAt
      }

      totalItems += storage.dataSources.size
      totalSize += componentSize
    }

    return {
      totalComponents: this.componentStorage.size,
      totalDataSources: totalItems,
      totalSize,
      memoryUsageMB: totalSize / (1024 * 1024),
      componentStats,
      config: this.config
    }
  }

  /**
   * 预留：存储动态参数（Phase 2使用）
   */
  storeDynamicParameter(name: string, parameter: DynamicParameterStorage): void {
    this.parameterStorage.set(name, parameter)
  }

  /**
   * 预留：获取动态参数（Phase 2使用）
   */
  getDynamicParameter(name: string): DynamicParameterStorage | null {
    const param = this.parameterStorage.get(name)
    if (param && param.expiresAt && Date.now() > param.expiresAt) {
      this.parameterStorage.delete(name)
      return null
    }
    return param || null
  }

  /**
   * 销毁数据仓库
   */
  destroy(): void {
    // 停止定时器
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
      this.cleanupTimer = null
    }

    if (this.metricsTimer) {
      clearInterval(this.metricsTimer)
      this.metricsTimer = null
    }

    // 清除所有数据
    this.clearAllCache()
  }

  // ==================== 私有方法 ====================

  /**
   * 检查数据项是否过期
   */
  private isExpired(item: DataStorageItem): boolean {
    return item.expiresAt !== undefined && Date.now() > item.expiresAt
  }

  /**
   * 计算数据大小（估算）
   */
  private calculateDataSize(data: any): number {
    try {
      return JSON.stringify(data).length * 2 // 粗略估算UTF-16字节数
    } catch {
      return 1024 // 默认1KB
    }
  }

  /**
   * 检查是否应该拒绝存储（内存限制）
   */
  private shouldRejectStorage(dataSize: number): boolean {
    const currentMemoryMB = this.getCurrentMemoryUsage()
    const newDataMB = dataSize / (1024 * 1024)

    return (
      currentMemoryMB + newDataMB > this.config.maxMemoryUsage ||
      this.getTotalItemCount() >= this.config.maxStorageItems
    )
  }

  /**
   * 获取当前内存使用量（MB）
   */
  private getCurrentMemoryUsage(): number {
    let totalSize = 0
    for (const storage of this.componentStorage.values()) {
      for (const item of storage.dataSources.values()) {
        totalSize += item.size
      }
      if (storage.mergedData) {
        totalSize += storage.mergedData.size
      }
    }
    return totalSize / (1024 * 1024)
  }

  /**
   * 获取总存储项数量
   */
  private getTotalItemCount(): number {
    let count = 0
    for (const storage of this.componentStorage.values()) {
      count += storage.dataSources.size
      if (storage.mergedData) count++
    }
    return count
  }

  /**
   * 启动清理定时器
   */
  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.performCleanup()
    }, this.config.cleanupInterval)
  }

  /**
   * 执行清理操作
   */
  private performCleanup(): void {
    const startTime = Date.now()
    let removedItems = 0
    let removedComponents = 0

    // 清理过期数据
    for (const [componentId, storage] of this.componentStorage) {
      let hasValidData = false

      // 清理数据源
      for (const [sourceId, item] of storage.dataSources) {
        if (this.isExpired(item)) {
          storage.dataSources.delete(sourceId)
          removedItems++
        } else {
          hasValidData = true
        }
      }

      // 清理合并数据缓存
      if (storage.mergedData && this.isExpired(storage.mergedData)) {
        storage.mergedData = undefined
        removedItems++
      }

      // 如果组件没有有效数据，移除整个组件
      if (!hasValidData && !storage.mergedData) {
        this.componentStorage.delete(componentId)
        removedComponents++
      }
    }

    // 内存压力清理：移除最少访问的数据
    if (this.getCurrentMemoryUsage() > this.config.maxMemoryUsage * 0.8) {
      const itemsToRemove = this.getLeastAccessedItems(10)
      itemsToRemove.forEach(({ componentId, sourceId }) => {
        this.clearDataSourceCache(componentId, sourceId)
        removedItems++
      })
    }

    this.metrics.lastCleanupTime = Date.now()
  }

  /**
   * 获取最少访问的数据项
   */
  private getLeastAccessedItems(count: number): Array<{ componentId: string; sourceId: string }> {
    const allItems: Array<{ componentId: string; sourceId: string; accessCount: number; lastAccessed: number }> = []

    for (const [componentId, storage] of this.componentStorage) {
      for (const [sourceId, item] of storage.dataSources) {
        allItems.push({
          componentId,
          sourceId,
          accessCount: item.accessCount,
          lastAccessed: item.lastAccessed
        })
      }
    }

    // 按访问次数和最后访问时间排序
    allItems.sort((a, b) => {
      if (a.accessCount !== b.accessCount) {
        return a.accessCount - b.accessCount
      }
      return a.lastAccessed - b.lastAccessed
    })

    return allItems.slice(0, count)
  }

  /**
   * 启动性能监控
   */
  private startMetricsCollection(): void {
    this.metricsTimer = setInterval(() => {
      this.updateCurrentMetrics()
    }, 30000) // 30秒更新一次
  }

  /**
   * 更新当前监控数据
   */
  private updateCurrentMetrics(): void {
    this.metrics.memoryUsage = this.getCurrentMemoryUsage()
    this.metrics.itemCount = this.getTotalItemCount()
    this.metrics.componentCount = this.componentStorage.size
  }

  /**
   * 更新性能监控指标
   */
  private updateMetrics(responseTime: number, operation: 'store' | 'get', cacheHit?: boolean): void {
    // 更新平均响应时间
    this.metrics.averageResponseTime = (this.metrics.averageResponseTime + responseTime) / 2

    // 更新缓存命中率
    if (operation === 'get' && cacheHit !== undefined) {
      this.metrics.cacheHitRate = (this.metrics.cacheHitRate + (cacheHit ? 1 : 0)) / 2
    }
  }
}

/**
 * 默认配置的数据仓库实例
 */
export const dataWarehouse = new EnhancedDataWarehouse()

/**
 * 创建自定义配置的数据仓库实例
 */
export function createDataWarehouse(config: Partial<DataWarehouseConfig> = {}): EnhancedDataWarehouse {
  return new EnhancedDataWarehouse(config)
}
