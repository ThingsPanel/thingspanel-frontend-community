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
import { ref, reactive, type Ref } from 'vue'

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
  /** 🔥 新增：数据版本号 */
  dataVersion?: string
  /** 🔥 新增：执行ID */
  executionId?: string
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

  /** 🔥 组件级响应式通知器：避免全局响应式导致的性能问题 */
  private componentChangeNotifiers = new Map<string, any>()

  /** 🔥 移除全局通知器，避免所有组件响应任何组件的数据变化 */
  // private dataChangeNotifier = ref(0) // 已移除，使用组件级通知器替代

  /** 🔥 新增：组件最新数据版本追踪 */
  private componentLatestVersions = new Map<string, string>()

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

    // 🔥 关键修复：添加数据值检查和执行序号追踪
    const dataValue = this.extractDataValue(data)
    const executionId = `${componentId}-${now}-${Math.random().toString(36).substr(2, 9)}`

    // 🔥 新增：版本控制机制，防止过期数据覆盖新数据
    const dataVersion = this.generateDataVersion(componentId, data)
    if (!this.shouldAcceptData(componentId, dataVersion)) {
      return
    }

    // 🔥 临时调试：详细记录存储过程，包含执行追踪
    ;(window as any).debugLastStorage = {
      componentId,
      sourceId,
      data,
      dataValue,
      sourceType,
      timestamp: now,
      executionId,
      step: 'start'
    }

    // 计算数据大小（估算）
    const dataSize = this.calculateDataSize(data)

    // 检查内存限制
    if (this.shouldRejectStorage(dataSize)) {
      ;(window as any).debugLastStorage.step = 'rejected'
      return
    }

    // 获取或创建组件存储
    let componentStorage = this.componentStorage.get(componentId)
    if (!componentStorage) {
      componentStorage = {
        componentId,
        dataSources: new Map(),
        createdAt: now,
        updatedAt: now
      }
      this.componentStorage.set(componentId, componentStorage)
      ;(window as any).debugLastStorage.step = 'created_storage'
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
      lastAccessed: now,
      // 🔥 新增：数据版本控制字段
      dataVersion,
      executionId
    }

    // 存储数据
    componentStorage.dataSources.set(sourceId, storageItem)
    componentStorage.updatedAt = now

    // 清除合并数据缓存（因为数据源发生变化）
    if (componentStorage.mergedData) {
      componentStorage.mergedData = undefined
    }

    // 更新组件的最新数据版本
    this.updateLatestDataVersion(componentId, dataVersion)

    // 🔥 临时调试：验证存储结果，包含数据值追踪
    const verification = this.componentStorage.get(componentId)
    const storedData = verification?.dataSources.get(sourceId)?.data
    const storedValue = this.extractDataValue(storedData)
    ;(window as any).debugLastStorage.step = 'stored'
    ;(window as any).debugLastStorage.verification = verification

    // 🔥 关键修复：只触发该组件的响应式更新，避免全局重计算
    let componentNotifier = this.componentChangeNotifiers.get(componentId)
    if (!componentNotifier) {
      componentNotifier = ref(0)
      this.componentChangeNotifiers.set(componentId, componentNotifier)
    }
    const oldValue = componentNotifier.value
    componentNotifier.value++

    // 🚨 强制调试：响应式更新触发

    // 🔥 完全移除全局通知器，避免触发所有组件的无效重计算
    // this.dataChangeNotifier.value++ // 已移除，避免"好几千次"的重复打印问题

    // 🔥 移除循环打印日志，避免200+组件场景下的性能问题
    // DataWarehouse 存储操作应该是静默的，避免大量组件时的日志爆炸

    // 更新性能监控
    const responseTime = Date.now() - startTime
    this.updateMetrics(responseTime, 'store')

    // 🔥 临时调试：最终状态检查
    const finalStats = this.getStorageStats()
    ;(window as any).debugLastStorage.finalStats = finalStats
  }

  /**
   * 获取组件数据
   * @param componentId 组件ID
   * @returns 组件完整数据或null
   */
  getComponentData(componentId: string): Record<string, any> | null {
    const startTime = Date.now()

    // 🔥 关键修复：使用组件级响应式，只有该组件的数据更新时才重新计算
    let componentNotifier = this.componentChangeNotifiers.get(componentId)
    if (!componentNotifier) {
      componentNotifier = ref(0)
      this.componentChangeNotifiers.set(componentId, componentNotifier)
    }
    // 🔥 关键修复：访问组件级通知器，建立精确的响应式依赖
    // 这确保只有该组件的数据更新时才会重新计算，而不是所有组件
    const changeNotifier = componentNotifier.value

    // 🚨 强制调试：响应式依赖访问

    const componentStorage = this.componentStorage.get(componentId)
    if (!componentStorage) {
      // 🔥 性能优化：减少无意义的日志输出，避免在200+组件场景下的日志爆炸
      // 组件没有数据是正常状态，不需要每次都打印
      this.updateMetrics(Date.now() - startTime, 'get', false)
      return null
    }

    // 检查是否有缓存的合并数据
    if (componentStorage.mergedData && !this.isExpired(componentStorage.mergedData)) {
      const cachedValue = this.extractDataValue(componentStorage.mergedData.data)
      componentStorage.mergedData.accessCount++
      componentStorage.mergedData.lastAccessed = Date.now()
      this.updateMetrics(Date.now() - startTime, 'get', true)
      // 🔥 性能优化：减少重复日志，避免68个组件每次都打印缓存获取日志
      return componentStorage.mergedData.data
    }

    // 构建组件数据对象
    const componentData: Record<string, any> = {}
    let hasValidData = false

    for (const [sourceId, item] of componentStorage.dataSources) {
      if (!this.isExpired(item)) {
        componentData[sourceId] = item.data
        item.accessCount++
        item.lastAccessed = Date.now()
        hasValidData = true
        const itemValue = this.extractDataValue(item.data)
      } else {
        componentStorage.dataSources.delete(sourceId)
      }
    }

    if (!hasValidData) {
      // 🔥 性能优化：组件没有数据是正常状态，不需要每次都打印错误日志
      this.updateMetrics(Date.now() - startTime, 'get', false)
      return null
    }

    this.updateMetrics(Date.now() - startTime, 'get', true)

    // 🔥 修复：如果有 complete 数据源，解包其中的实际数据
    const sourceIds = Object.keys(componentData)

    // 🔥 关键修复：处理数据解包，得到最终要返回的数据
    let finalData = componentData

    // 如果有 complete 数据源，解包其中的数据源数据
    if ('complete' in componentData && componentData.complete) {
      const completeData = componentData.complete

      // 检查 complete 是否包含 deviceData
      if (completeData.deviceData && completeData.deviceData.data) {
        finalData = completeData.deviceData.data
      } else {
        // 如果不是标准结构，返回 complete 的直接内容
        finalData = completeData
      }
    }

    // 🔥 关键修复：缓存最终解包后的数据，而不是原始包装数据
    componentStorage.mergedData = {
      data: finalData, // 缓存解包后的最终数据
      timestamp: Date.now(),
      expiresAt: Date.now() + this.config.defaultCacheExpiry,
      source: {
        sourceId: '*merged*',
        sourceType: 'merged',
        componentId
      },
      size: this.calculateDataSize(finalData),
      accessCount: 1,
      lastAccessed: Date.now()
    }

    const finalValue = this.extractDataValue(finalData)
    return finalData
  }

  // ==================== 新增工具方法 ====================

  /**
   * 🔥 新增：生成数据版本号
   */
  private generateDataVersion(componentId: string, data: any): string {
    const dataHash = this.calculateDataHash(data)
    const timestamp = Date.now()
    return `${componentId}-${timestamp}-${dataHash}`
  }

  /**
   * 🔥 新增：检查是否应该接受数据（版本控制）
   */
  private shouldAcceptData(componentId: string, dataVersion: string): boolean {
    const latestVersion = this.componentLatestVersions.get(componentId)
    if (!latestVersion) {
      return true // 首次存储，直接接受
    }

    // 提取时间戳进行比较
    const currentTimestamp = this.extractTimestampFromVersion(dataVersion)
    const latestTimestamp = this.extractTimestampFromVersion(latestVersion)

    return currentTimestamp >= latestTimestamp
  }

  /**
   * 🔥 新增：更新最新数据版本
   */
  private updateLatestDataVersion(componentId: string, dataVersion: string): void {
    this.componentLatestVersions.set(componentId, dataVersion)
  }

  /**
   * 🔥 新增：从版本号中提取时间戳
   */
  private extractTimestampFromVersion(version: string): number {
    const parts = version.split('-')
    if (parts.length >= 2) {
      return parseInt(parts[1]) || 0
    }
    return 0
  }

  /**
   * 🔥 新增：计算数据哈希值
   */
  private calculateDataHash(data: any): string {
    try {
      const dataString = JSON.stringify(data)
      let hash = 0
      for (let i = 0; i < dataString.length; i++) {
        const char = dataString.charCodeAt(i)
        hash = (hash << 5) - hash + char
        hash = hash & hash // 转换为32位整数
      }
      return Math.abs(hash).toString(36)
    } catch (error) {
      return Math.random().toString(36).substr(2, 9)
    }
  }

  /**
   * 🔥 新增：提取数据中的关键数值（用于调试追踪）
   * 智能提取各种数据结构中的核心数值
   */
  private extractDataValue(data: any): any {
    if (!data) return undefined

    // 尝试多种可能的数值字段
    const possibleFields = ['value', 'val', 'data', 'result', 'number', 'count']

    // 直接数值
    if (typeof data === 'number') return data

    // 对象中的数值字段
    if (typeof data === 'object' && data !== null) {
      for (const field of possibleFields) {
        if (data[field] !== undefined) {
          return data[field]
        }
      }

      // 检查嵌套结构
      if (data.deviceData?.data?.value !== undefined) {
        return data.deviceData.data.value
      }

      // 如果是数组，尝试提取第一个元素的值
      if (Array.isArray(data) && data.length > 0) {
        return this.extractDataValue(data[0])
      }
    }

    return data
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
      this.componentStorage.delete(componentId)
      // 🔥 关键修复：同时清理组件级响应式通知器，避免内存泄漏
      this.componentChangeNotifiers.delete(componentId)
    }
  }

  /**
   * 🔥 强制清除组件的合并数据缓存，保持响应式依赖
   * @param componentId 组件ID
   */
  clearComponentMergedCache(componentId: string): void {
    const componentStorage = this.componentStorage.get(componentId)
    if (componentStorage) {
      // 🔥 关键修复：无条件清除合并缓存，解决并发时序问题
      const hadCache = !!componentStorage.mergedData
      componentStorage.mergedData = undefined

      // 🔥 关键：无论是否有缓存都触发响应式更新，确保组件重新获取数据
      let componentNotifier = this.componentChangeNotifiers.get(componentId)
      if (!componentNotifier) {
        componentNotifier = ref(0)
        this.componentChangeNotifiers.set(componentId, componentNotifier)
      }
      componentNotifier.value++
    } else {
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
        // 🔥 关键修复：只触发该组件的响应式更新
        const componentNotifier = this.componentChangeNotifiers.get(componentId)
        if (componentNotifier) {
          componentNotifier.value++
        }
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
    // 🔥 关键修复：同时清理所有组件级响应式通知器，避免内存泄漏
    this.componentChangeNotifiers.clear()
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

    // 清除所有数据（已包含组件级响应式通知器清理）
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

// 🔥 临时调试：暴露到全局
if (typeof window !== 'undefined') {
  ;(window as any).debugDataWarehouse = dataWarehouse
}

/**
 * 创建自定义配置的数据仓库实例
 */
export function createDataWarehouse(config: Partial<DataWarehouseConfig> = {}): EnhancedDataWarehouse {
  return new EnhancedDataWarehouse(config)
}
