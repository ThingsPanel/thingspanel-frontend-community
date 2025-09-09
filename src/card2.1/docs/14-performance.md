# 性能优化 - Card 2.1 高性能指南

本章详细介绍 Card 2.1 组件系统的性能优化策略、监控工具和最佳实践，确保系统在大规模场景下高效运行。

## 🚀 性能优化概览

### 性能优化层级
```
┌─────────────────────────────────────────────────────────┐
│                   Application Level                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │   Bundle    │  │    Code     │  │   Resource  │     │
│  │ Optimization│  │  Splitting  │  │   Loading   │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
└─────────────────┬───────────────────────────────────────┘
                  │
┌─────────────────┴───────────────────────────────────────┐
│                   Component Level                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │ Virtual     │  │  Lazy       │  │ Memoization │     │
│  │ Scrolling   │  │ Loading     │  │ & Caching   │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
└─────────────────┬───────────────────────────────────────┘
                  │
┌─────────────────┴───────────────────────────────────────┐
│                    Data Level                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │ Data        │  │  Request    │  │ WebSocket   │     │
│  │ Caching     │  │ Batching    │  │ Optimization│     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
└─────────────────────────────────────────────────────────┘
```

## 📊 性能监控系统

### 1. 性能指标收集器
```typescript
// src/card2.1/core/performance/performance-monitor.ts
/**
 * Card 2.1 性能监控器
 * 收集和分析系统性能数据
 */

export interface PerformanceMetrics {
  componentLoadTime: number      // 组件加载时间
  dataBindingTime: number       // 数据绑定耗时
  renderTime: number           // 渲染耗时
  memoryUsage: number          // 内存使用量
  updateFrequency: number      // 更新频率
  cacheHitRate: number        // 缓存命中率
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private metrics: Map<string, PerformanceMetrics> = new Map()
  private observers: PerformanceObserver[] = []
  
  static getInstance(): PerformanceMonitor {
    if (!this.instance) {
      this.instance = new PerformanceMonitor()
    }
    return this.instance
  }
  
  /**
   * 初始化性能监控
   */
  initialize() {
    // 监控组件加载性能
    this.observeComponentLoading()
    
    // 监控内存使用
    this.observeMemoryUsage()
    
    // 监控渲染性能  
    this.observeRenderPerformance()
    
    // 启动定期报告
    this.startPeriodicReporting()
  }
  
  /**
   * 记录组件性能指标
   */
  recordComponentMetrics(componentId: string, metrics: Partial<PerformanceMetrics>) {
    const existing = this.metrics.get(componentId) || {} as PerformanceMetrics
    this.metrics.set(componentId, { ...existing, ...metrics })
  }
  
  /**
   * 测量函数执行时间
   */
  async measureAsync<T>(
    name: string, 
    fn: () => Promise<T>
  ): Promise<T> {
    const startTime = performance.now()
    try {
      const result = await fn()
      const endTime = performance.now()
      this.recordTiming(name, endTime - startTime)
      return result
    } catch (error) {
      this.recordError(name, error as Error)
      throw error
    }
  }
  
  /**
   * 测量同步函数执行时间
   */
  measure<T>(name: string, fn: () => T): T {
    const startTime = performance.now()
    try {
      const result = fn()
      const endTime = performance.now()
      this.recordTiming(name, endTime - startTime)
      return result
    } catch (error) {
      this.recordError(name, error as Error)
      throw error
    }
  }
  
  /**
   * 获取性能报告
   */
  getPerformanceReport(): {
    overview: PerformanceOverview
    components: ComponentPerformanceReport[]
    recommendations: string[]
  } {
    const components = Array.from(this.metrics.entries())
      .map(([id, metrics]) => ({ componentId: id, ...metrics }))
    
    const overview = this.calculateOverview(components)
    const recommendations = this.generateRecommendations(overview, components)
    
    return { overview, components, recommendations }
  }
  
  private observeComponentLoading() {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name.startsWith('card2-component-load:')) {
          const componentId = entry.name.replace('card2-component-load:', '')
          this.recordComponentMetrics(componentId, {
            componentLoadTime: entry.duration
          })
        }
      }
    })
    
    observer.observe({ entryTypes: ['measure'] })
    this.observers.push(observer)
  }
  
  private observeMemoryUsage() {
    if ('memory' in performance) {
      setInterval(() => {
        const memInfo = (performance as any).memory
        this.recordGlobalMetric('memoryUsage', memInfo.usedJSHeapSize)
      }, 5000)
    }
  }
  
  private observeRenderPerformance() {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'navigation') {
          this.recordGlobalMetric('pageLoadTime', entry.duration)
        }
      }
    })
    
    observer.observe({ entryTypes: ['navigation'] })
    this.observers.push(observer)
  }
}

// 导出单例实例
export const performanceMonitor = PerformanceMonitor.getInstance()
```

### 2. 组件性能装饰器
```typescript
// src/card2.1/core/performance/performance-decorator.ts
/**
 * 组件性能监控装饰器
 */

export function withPerformanceMonitoring<T extends Vue.ComponentOptions>(
  component: T,
  componentId: string
): T {
  const originalBeforeMount = component.beforeMount
  const originalMounted = component.mounted
  const originalUpdated = component.updated
  const originalBeforeUnmount = component.beforeUnmount
  
  return {
    ...component,
    
    beforeMount() {
      // 记录组件开始挂载时间
      performance.mark(`card2-mount-start:${componentId}`)
      originalBeforeMount?.call(this)
    },
    
    mounted() {
      // 记录组件挂载完成时间
      performance.mark(`card2-mount-end:${componentId}`)
      performance.measure(
        `card2-component-load:${componentId}`,
        `card2-mount-start:${componentId}`,
        `card2-mount-end:${componentId}`
      )
      
      originalMounted?.call(this)
    },
    
    updated() {
      // 记录组件更新性能
      performanceMonitor.recordComponentMetrics(componentId, {
        updateFrequency: Date.now()
      })
      
      originalUpdated?.call(this)
    },
    
    beforeUnmount() {
      // 清理性能监控
      this.clearPerformanceMarks(componentId)
      originalBeforeUnmount?.call(this)
    },
    
    methods: {
      ...component.methods,
      
      clearPerformanceMarks(id: string) {
        performance.clearMarks(`card2-mount-start:${id}`)
        performance.clearMarks(`card2-mount-end:${id}`)
        performance.clearMeasures(`card2-component-load:${id}`)
      }
    }
  }
}
```

## 🧩 组件级优化

### 1. 组件懒加载优化
```typescript
// src/card2.1/core/optimization/lazy-loading.ts
/**
 * 组件懒加载管理器
 * 实现智能的组件加载策略
 */

export class ComponentLazyLoader {
  private loadedComponents: Set<string> = new Set()
  private loadingPromises: Map<string, Promise<any>> = new Map()
  private intersectionObserver?: IntersectionObserver
  private priorityQueue: PriorityQueue<string> = new PriorityQueue()
  
  constructor() {
    this.setupIntersectionObserver()
  }
  
  /**
   * 注册需要懒加载的组件
   */
  registerComponent(
    componentType: string,
    loader: () => Promise<any>,
    priority: number = 0
  ) {
    this.priorityQueue.enqueue(componentType, priority)
    this.componentLoaders.set(componentType, loader)
  }
  
  /**
   * 预加载高优先级组件
   */
  async preloadCriticalComponents(): Promise<void> {
    const criticalComponents = this.priorityQueue.getHighPriorityItems(3)
    
    await Promise.allSettled(
      criticalComponents.map(type => this.loadComponent(type))
    )
  }
  
  /**
   * 智能加载组件
   */
  async loadComponent(componentType: string): Promise<any> {
    // 如果已经加载，直接返回
    if (this.loadedComponents.has(componentType)) {
      return this.getLoadedComponent(componentType)
    }
    
    // 如果正在加载，返回加载Promise
    if (this.loadingPromises.has(componentType)) {
      return this.loadingPromises.get(componentType)
    }
    
    // 开始加载
    const loadingPromise = this.performLoad(componentType)
    this.loadingPromises.set(componentType, loadingPromise)
    
    try {
      const component = await loadingPromise
      this.loadedComponents.add(componentType)
      this.loadingPromises.delete(componentType)
      return component
    } catch (error) {
      this.loadingPromises.delete(componentType)
      throw error
    }
  }
  
  /**
   * 观察元素进入视窗时触发加载
   */
  observeElement(element: Element, componentType: string) {
    if (this.intersectionObserver) {
      element.setAttribute('data-component-type', componentType)
      this.intersectionObserver.observe(element)
    }
  }
  
  private setupIntersectionObserver() {
    if (typeof IntersectionObserver === 'undefined') return
    
    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const componentType = entry.target.getAttribute('data-component-type')
            if (componentType) {
              this.loadComponent(componentType)
              this.intersectionObserver?.unobserve(entry.target)
            }
          }
        })
      },
      {
        rootMargin: '100px', // 提前100px开始加载
        threshold: 0.1
      }
    )
  }
  
  private async performLoad(componentType: string): Promise<any> {
    const loader = this.componentLoaders.get(componentType)
    if (!loader) {
      throw new Error(`No loader registered for component: ${componentType}`)
    }
    
    return performanceMonitor.measureAsync(
      `component-load:${componentType}`,
      loader
    )
  }
}

// 导出单例
export const componentLazyLoader = new ComponentLazyLoader()
```

### 2. 虚拟滚动优化
```vue
<!-- src/card2.1/components/common/VirtualComponentList.vue -->
<script setup lang="ts">
/**
 * 虚拟滚动组件列表
 * 用于大量组件的高性能渲染
 */

import { useVirtualList } from '@vueuse/core'

interface ComponentItem {
  id: string
  type: string
  config: any
  height?: number
}

interface Props {
  components: ComponentItem[]
  itemHeight?: number
  containerHeight?: number
  overscan?: number
}

const props = withDefaults(defineProps<Props>(), {
  itemHeight: 200,
  containerHeight: 600,
  overscan: 5
})

// 虚拟滚动实现
const containerRef = ref<HTMLElement>()

const { list, containerProps, wrapperProps } = useVirtualList(
  props.components,
  {
    itemHeight: (index) => {
      // 支持动态高度计算
      const item = props.components[index]
      return item.height || props.itemHeight
    },
    overscan: props.overscan
  }
)

// 性能监控
const renderingMetrics = ref({
  visibleItems: 0,
  totalItems: 0,
  renderTime: 0
})

watch(() => list.value, (newList) => {
  renderingMetrics.value.visibleItems = newList.length
  renderingMetrics.value.totalItems = props.components.length
}, { immediate: true })

// 组件加载状态管理
const loadingComponents = ref(new Set<string>())

const loadComponent = async (item: ComponentItem) => {
  if (loadingComponents.value.has(item.id)) return
  
  loadingComponents.value.add(item.id)
  
  try {
    await componentLazyLoader.loadComponent(item.type)
  } finally {
    loadingComponents.value.delete(item.id)
  }
}

// 预加载可见区域附近的组件
watchEffect(() => {
  const visibleItems = list.value.slice(0, props.overscan * 2)
  visibleItems.forEach(item => {
    nextTick(() => loadComponent(item.data))
  })
})
</script>

<template>
  <div 
    ref="containerRef" 
    class="virtual-component-list"
    :style="{ height: `${containerHeight}px` }"
  >
    <div v-bind="containerProps" class="virtual-container">
      <div v-bind="wrapperProps" class="virtual-wrapper">
        <div
          v-for="{ data, index } in list"
          :key="data.id"
          class="virtual-item"
          :data-index="index"
        >
          <!-- 组件加载状态 -->
          <n-spin v-if="loadingComponents.has(data.id)" size="large">
            <div class="component-placeholder">
              <n-skeleton height="160px" />
            </div>
          </n-spin>
          
          <!-- 实际组件 -->
          <component
            v-else
            :is="getComponentByType(data.type)"
            v-bind="data.config"
            :component-id="data.id"
            @performance-metric="handlePerformanceMetric"
          />
        </div>
      </div>
    </div>
    
    <!-- 性能指标显示（开发环境） -->
    <div v-if="isDev" class="performance-info">
      <n-card size="small" title="虚拟滚动性能">
        <n-statistic
          label="可见项目"
          :value="renderingMetrics.visibleItems"
          :precision="0"
        />
        <n-statistic
          label="总项目数"
          :value="renderingMetrics.totalItems"
          :precision="0"
        />
        <n-statistic
          label="渲染时间"
          :value="renderingMetrics.renderTime"
          suffix="ms"
          :precision="2"
        />
      </n-card>
    </div>
  </div>
</template>

<style scoped>
.virtual-component-list {
  overflow: auto;
}

.virtual-container {
  position: relative;
}

.virtual-wrapper {
  position: relative;
}

.virtual-item {
  margin-bottom: 8px;
}

.component-placeholder {
  padding: 16px;
}

.performance-info {
  position: fixed;
  top: 10px;
  right: 10px;
  z-index: 1000;
}
</style>
```

## 💾 数据层优化

### 1. 智能缓存系统
```typescript
// src/card2.1/core/optimization/cache-manager.ts
/**
 * Card 2.1 缓存管理器
 * 实现多层缓存策略
 */

export interface CacheEntry<T = any> {
  data: T
  timestamp: number
  ttl: number
  accessCount: number
  lastAccessed: number
}

export class CacheManager {
  private memoryCache: Map<string, CacheEntry> = new Map()
  private persistentCache: Map<string, CacheEntry> = new Map()
  private cacheStats: {
    hits: number
    misses: number
    evictions: number
  } = { hits: 0, misses: 0, evictions: 0 }
  
  // 缓存配置
  private readonly config = {
    maxMemoryEntries: 1000,
    maxPersistentEntries: 5000,
    defaultTTL: 300000, // 5分钟
    cleanupInterval: 60000 // 1分钟清理一次
  }
  
  constructor() {
    this.startCleanupTimer()
    this.loadPersistentCache()
  }
  
  /**
   * 获取缓存数据
   */
  get<T>(key: string): T | null {
    // 首先检查内存缓存
    let entry = this.memoryCache.get(key)
    
    if (entry && this.isValidEntry(entry)) {
      entry.accessCount++
      entry.lastAccessed = Date.now()
      this.cacheStats.hits++
      return entry.data as T
    }
    
    // 检查持久化缓存
    entry = this.persistentCache.get(key)
    
    if (entry && this.isValidEntry(entry)) {
      // 提升到内存缓存
      this.memoryCache.set(key, {
        ...entry,
        accessCount: entry.accessCount + 1,
        lastAccessed: Date.now()
      })
      
      this.cacheStats.hits++
      return entry.data as T
    }
    
    this.cacheStats.misses++
    return null
  }
  
  /**
   * 设置缓存数据
   */
  set<T>(
    key: string, 
    data: T, 
    options: { 
      ttl?: number
      persistent?: boolean 
    } = {}
  ): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: options.ttl || this.config.defaultTTL,
      accessCount: 0,
      lastAccessed: Date.now()
    }
    
    // 设置到内存缓存
    this.memoryCache.set(key, entry)
    
    // 如果需要持久化
    if (options.persistent) {
      this.persistentCache.set(key, entry)
      this.savePersistentCache()
    }
    
    // 检查缓存大小限制
    this.enforceMemoryLimit()
    this.enforcePersistentLimit()
  }
  
  /**
   * 删除缓存项
   */
  delete(key: string): boolean {
    const memoryDeleted = this.memoryCache.delete(key)
    const persistentDeleted = this.persistentCache.delete(key)
    
    if (persistentDeleted) {
      this.savePersistentCache()
    }
    
    return memoryDeleted || persistentDeleted
  }
  
  /**
   * 清空所有缓存
   */
  clear(): void {
    this.memoryCache.clear()
    this.persistentCache.clear()
    this.savePersistentCache()
  }
  
  /**
   * 获取缓存统计信息
   */
  getStats() {
    const hitRate = this.cacheStats.hits / (this.cacheStats.hits + this.cacheStats.misses)
    
    return {
      ...this.cacheStats,
      hitRate: isNaN(hitRate) ? 0 : hitRate,
      memoryEntries: this.memoryCache.size,
      persistentEntries: this.persistentCache.size,
      memoryUsage: this.calculateMemoryUsage()
    }
  }
  
  /**
   * 预热缓存
   */
  async warmup(keys: string[], dataLoader: (key: string) => Promise<any>): Promise<void> {
    const promises = keys.map(async (key) => {
      if (!this.get(key)) {
        try {
          const data = await dataLoader(key)
          this.set(key, data, { persistent: true })
        } catch (error) {
          console.warn(`Failed to warmup cache for key: ${key}`, error)
        }
      }
    })
    
    await Promise.allSettled(promises)
  }
  
  private isValidEntry(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp < entry.ttl
  }
  
  private enforceMemoryLimit(): void {
    while (this.memoryCache.size > this.config.maxMemoryEntries) {
      // LRU 淘汰策略
      const oldestKey = this.findLeastRecentlyUsed(this.memoryCache)
      if (oldestKey) {
        this.memoryCache.delete(oldestKey)
        this.cacheStats.evictions++
      } else {
        break
      }
    }
  }
  
  private enforcePersistentLimit(): void {
    while (this.persistentCache.size > this.config.maxPersistentEntries) {
      const oldestKey = this.findLeastRecentlyUsed(this.persistentCache)
      if (oldestKey) {
        this.persistentCache.delete(oldestKey)
        this.cacheStats.evictions++
      } else {
        break
      }
    }
  }
  
  private findLeastRecentlyUsed(cache: Map<string, CacheEntry>): string | null {
    let oldestKey: string | null = null
    let oldestTime = Date.now()
    
    for (const [key, entry] of cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed
        oldestKey = key
      }
    }
    
    return oldestKey
  }
  
  private startCleanupTimer(): void {
    setInterval(() => {
      this.cleanup()
    }, this.config.cleanupInterval)
  }
  
  private cleanup(): void {
    const now = Date.now()
    
    // 清理内存缓存中的过期项
    for (const [key, entry] of this.memoryCache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.memoryCache.delete(key)
      }
    }
    
    // 清理持久化缓存中的过期项
    for (const [key, entry] of this.persistentCache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.persistentCache.delete(key)
      }
    }
    
    this.savePersistentCache()
  }
  
  private loadPersistentCache(): void {
    try {
      const stored = localStorage.getItem('card2-cache')
      if (stored) {
        const data = JSON.parse(stored)
        this.persistentCache = new Map(data)
      }
    } catch (error) {
      console.warn('Failed to load persistent cache:', error)
    }
  }
  
  private savePersistentCache(): void {
    try {
      const data = Array.from(this.persistentCache.entries())
      localStorage.setItem('card2-cache', JSON.stringify(data))
    } catch (error) {
      console.warn('Failed to save persistent cache:', error)
    }
  }
  
  private calculateMemoryUsage(): number {
    // 估算缓存占用的内存大小（字节）
    let size = 0
    
    for (const entry of this.memoryCache.values()) {
      size += this.estimateObjectSize(entry)
    }
    
    return size
  }
  
  private estimateObjectSize(obj: any): number {
    // 简单的对象大小估算
    return JSON.stringify(obj).length * 2 // 粗略估算 UTF-16 编码
  }
}

// 导出单例
export const cacheManager = new CacheManager()
```

### 2. 请求批处理优化
```typescript
// src/card2.1/core/optimization/request-batcher.ts
/**
 * 请求批处理器
 * 将多个相似请求合并为单个批量请求
 */

interface BatchRequest<T = any> {
  id: string
  params: any
  resolve: (value: T) => void
  reject: (error: Error) => void
  timestamp: number
}

export class RequestBatcher<T = any> {
  private pendingRequests: Map<string, BatchRequest<T>[]> = new Map()
  private batchTimeouts: Map<string, NodeJS.Timeout> = new Map()
  
  constructor(
    private batchHandler: (requests: any[]) => Promise<T[]>,
    private options: {
      maxBatchSize: number
      batchDelay: number
      maxWaitTime: number
    } = {
      maxBatchSize: 10,
      batchDelay: 50,
      maxWaitTime: 1000
    }
  ) {}
  
  /**
   * 添加请求到批处理队列
   */
  addRequest(key: string, params: any): Promise<T> {
    return new Promise((resolve, reject) => {
      const request: BatchRequest<T> = {
        id: this.generateId(),
        params,
        resolve,
        reject,
        timestamp: Date.now()
      }
      
      // 添加到对应批次
      if (!this.pendingRequests.has(key)) {
        this.pendingRequests.set(key, [])
      }
      
      const batch = this.pendingRequests.get(key)!
      batch.push(request)
      
      // 检查是否需要立即执行
      if (batch.length >= this.options.maxBatchSize) {
        this.executeBatch(key)
      } else {
        this.scheduleBatchExecution(key)
      }
    })
  }
  
  /**
   * 立即执行指定批次
   */
  async executeBatch(key: string): Promise<void> {
    const batch = this.pendingRequests.get(key)
    if (!batch || batch.length === 0) return
    
    // 清除定时器
    const timeout = this.batchTimeouts.get(key)
    if (timeout) {
      clearTimeout(timeout)
      this.batchTimeouts.delete(key)
    }
    
    // 移除批次
    this.pendingRequests.delete(key)
    
    try {
      // 执行批量请求
      const params = batch.map(req => req.params)
      const results = await this.batchHandler(params)
      
      // 分发结果
      batch.forEach((request, index) => {
        if (results[index] !== undefined) {
          request.resolve(results[index])
        } else {
          request.reject(new Error('No result for request'))
        }
      })
    } catch (error) {
      // 批量请求失败，全部拒绝
      batch.forEach(request => {
        request.reject(error as Error)
      })
    }
  }
  
  private scheduleBatchExecution(key: string): void {
    // 如果已经有定时器，检查是否需要更新
    const existingTimeout = this.batchTimeouts.get(key)
    const batch = this.pendingRequests.get(key)
    
    if (batch && batch.length > 0) {
      const oldestRequest = Math.min(...batch.map(r => r.timestamp))
      const waitTime = Date.now() - oldestRequest
      
      // 如果等待时间超过最大等待时间，立即执行
      if (waitTime >= this.options.maxWaitTime) {
        if (existingTimeout) clearTimeout(existingTimeout)
        this.executeBatch(key)
        return
      }
    }
    
    // 如果没有现有定时器，创建新的
    if (!existingTimeout) {
      const timeout = setTimeout(() => {
        this.executeBatch(key)
      }, this.options.batchDelay)
      
      this.batchTimeouts.set(key, timeout)
    }
  }
  
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
  
  /**
   * 获取批处理统计信息
   */
  getStats() {
    const totalPending = Array.from(this.pendingRequests.values())
      .reduce((sum, batch) => sum + batch.length, 0)
    
    return {
      totalPendingRequests: totalPending,
      activeBatches: this.pendingRequests.size,
      scheduledBatches: this.batchTimeouts.size
    }
  }
}

// 创建数据源请求批处理器
export const dataSourceBatcher = new RequestBatcher(
  async (requests) => {
    // 实现批量数据获取逻辑
    const response = await fetch('/api/data-sources/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requests })
    })
    
    if (!response.ok) {
      throw new Error('Batch request failed')
    }
    
    return response.json()
  },
  {
    maxBatchSize: 20,
    batchDelay: 100,
    maxWaitTime: 2000
  }
)
```

## 🎯 最佳实践指南

### 1. 组件性能优化清单
```markdown
## 组件开发性能清单

### ✅ 必须执行的优化
- [ ] 使用 `defineComponent` 或组合式 API
- [ ] 合理使用 `computed` 而不是 `watch`
- [ ] 避免在模板中使用复杂表达式
- [ ] 使用 `v-show` 而非 `v-if` 用于频繁切换
- [ ] 为长列表使用 `key` 属性
- [ ] 大型列表使用虚拟滚动
- [ ] 组件支持懒加载

### ✅ 推荐的优化
- [ ] 使用 `shallowRef` 处理大型不可变对象
- [ ] 使用 `markRaw` 标记不需要响应式的对象
- [ ] 合理使用 `v-memo` 缓存子树
- [ ] 避免不必要的响应式转换
- [ ] 使用 `readonly` 保护只读数据

### ✅ 高级优化
- [ ] 实现组件级缓存
- [ ] 使用 Web Workers 处理计算密集任务
- [ ] 实现智能预加载策略
- [ ] 优化数据结构和算法
```

### 2. 数据获取优化模式
```typescript
// 优化的数据获取 Hook
export function useOptimizedDataSource<T>(
  config: DataSourceConfig,
  options: {
    enableCache?: boolean
    batchRequests?: boolean
    enablePreload?: boolean
  } = {}
) {
  const { enableCache = true, batchRequests = true, enablePreload = false } = options
  
  const data = ref<T | null>(null)
  const loading = ref(false)
  const error = ref<Error | null>(null)
  
  // 缓存键生成
  const cacheKey = computed(() => {
    return `datasource:${JSON.stringify(config)}`
  })
  
  // 数据获取函数
  const fetchData = async (): Promise<T> => {
    // 检查缓存
    if (enableCache) {
      const cached = cacheManager.get<T>(cacheKey.value)
      if (cached) return cached
    }
    
    let result: T
    
    if (batchRequests) {
      // 使用批处理
      result = await dataSourceBatcher.addRequest(
        config.type, 
        config.params
      )
    } else {
      // 直接请求
      result = await performanceMonitor.measureAsync(
        'data-fetch',
        () => executeDataSource<T>(config)
      )
    }
    
    // 缓存结果
    if (enableCache) {
      cacheManager.set(cacheKey.value, result, {
        ttl: config.cacheTTL || 300000,
        persistent: true
      })
    }
    
    return result
  }
  
  // 预加载数据
  if (enablePreload) {
    onMounted(() => {
      fetchData().catch(console.error)
    })
  }
  
  // 响应式获取数据
  const load = async () => {
    if (loading.value) return
    
    loading.value = true
    error.value = null
    
    try {
      data.value = await fetchData()
    } catch (err) {
      error.value = err as Error
    } finally {
      loading.value = false
    }
  }
  
  return {
    data: readonly(data),
    loading: readonly(loading),
    error: readonly(error),
    load,
    refresh: load
  }
}
```

## 📈 性能监控面板

### 1. 性能监控组件
```vue
<!-- src/card2.1/components/debug/PerformancePanel.vue -->
<script setup lang="ts">
/**
 * Card 2.1 性能监控面板
 * 实时显示系统性能指标
 */

import { performanceMonitor } from '@/card2.1/core/performance/performance-monitor'
import { cacheManager } from '@/card2.1/core/optimization/cache-manager'

const performanceData = ref({
  overview: {
    averageLoadTime: 0,
    totalComponents: 0,
    memoryUsage: 0
  },
  components: [],
  cache: {
    hitRate: 0,
    totalEntries: 0,
    memoryUsage: 0
  },
  recommendations: []
})

const refreshInterval = ref(5000)
const isAutoRefresh = ref(true)

// 刷新性能数据
const refreshData = async () => {
  const report = performanceMonitor.getPerformanceReport()
  const cacheStats = cacheManager.getStats()
  
  performanceData.value = {
    overview: report.overview,
    components: report.components,
    cache: cacheStats,
    recommendations: report.recommendations
  }
}

// 自动刷新
let intervalId: number | null = null

watchEffect(() => {
  if (isAutoRefresh.value) {
    intervalId = setInterval(refreshData, refreshInterval.value)
  } else if (intervalId) {
    clearInterval(intervalId)
    intervalId = null
  }
})

onMounted(refreshData)
onUnmounted(() => {
  if (intervalId) clearInterval(intervalId)
})

// 清空性能数据
const clearData = () => {
  performanceMonitor.clearMetrics()
  cacheManager.clear()
  refreshData()
}

// 导出性能报告
const exportReport = () => {
  const data = JSON.stringify(performanceData.value, null, 2)
  const blob = new Blob([data], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  
  const link = document.createElement('a')
  link.href = url
  link.download = `performance-report-${Date.now()}.json`
  link.click()
  
  URL.revokeObjectURL(url)
}
</script>

<template>
  <div class="performance-panel">
    <n-card title="Card 2.1 性能监控">
      <template #header-extra>
        <n-space>
          <n-switch 
            v-model:value="isAutoRefresh" 
            :checked-text="$t('common.auto')"
            :unchecked-text="$t('common.manual')"
          />
          
          <n-select
            v-model:value="refreshInterval"
            :options="[
              { label: '1秒', value: 1000 },
              { label: '5秒', value: 5000 },
              { label: '10秒', value: 10000 },
              { label: '30秒', value: 30000 }
            ]"
            style="width: 80px"
          />
          
          <n-button @click="refreshData">刷新</n-button>
          <n-button @click="exportReport">导出</n-button>
          <n-button type="warning" @click="clearData">清空</n-button>
        </n-space>
      </template>
      
      <n-tabs>
        <!-- 性能概览 -->
        <n-tab-pane name="overview" tab="性能概览">
          <n-row :gutter="16">
            <n-col :span="8">
              <n-statistic
                label="平均加载时间"
                :value="performanceData.overview.averageLoadTime"
                :precision="2"
                suffix="ms"
              />
            </n-col>
            <n-col :span="8">
              <n-statistic
                label="组件总数"
                :value="performanceData.overview.totalComponents"
                :precision="0"
              />
            </n-col>
            <n-col :span="8">
              <n-statistic
                label="内存使用"
                :value="performanceData.overview.memoryUsage / 1024 / 1024"
                :precision="2"
                suffix="MB"
              />
            </n-col>
          </n-row>
        </n-tab-pane>
        
        <!-- 缓存统计 -->
        <n-tab-pane name="cache" tab="缓存统计">
          <n-row :gutter="16">
            <n-col :span="8">
              <n-statistic
                label="缓存命中率"
                :value="performanceData.cache.hitRate * 100"
                :precision="2"
                suffix="%"
              />
            </n-col>
            <n-col :span="8">
              <n-statistic
                label="缓存条目数"
                :value="performanceData.cache.totalEntries"
                :precision="0"
              />
            </n-col>
            <n-col :span="8">
              <n-statistic
                label="缓存占用"
                :value="performanceData.cache.memoryUsage / 1024"
                :precision="2"
                suffix="KB"
              />
            </n-col>
          </n-row>
        </n-tab-pane>
        
        <!-- 组件性能 -->
        <n-tab-pane name="components" tab="组件性能">
          <n-data-table
            :columns="[
              { key: 'componentId', title: '组件ID' },
              { key: 'componentLoadTime', title: '加载时间(ms)', render: (row) => row.componentLoadTime?.toFixed(2) },
              { key: 'renderTime', title: '渲染时间(ms)', render: (row) => row.renderTime?.toFixed(2) },
              { key: 'updateFrequency', title: '更新频率' },
              { key: 'memoryUsage', title: '内存使用(KB)', render: (row) => (row.memoryUsage / 1024)?.toFixed(2) }
            ]"
            :data="performanceData.components"
            :pagination="{ pageSize: 10 }"
          />
        </n-tab-pane>
        
        <!-- 优化建议 -->
        <n-tab-pane name="recommendations" tab="优化建议">
          <n-list>
            <n-list-item
              v-for="(recommendation, index) in performanceData.recommendations"
              :key="index"
            >
              <n-thing>
                <template #avatar>
                  <n-icon :component="LightbulbOutline" />
                </template>
                <template #header>建议 {{ index + 1 }}</template>
                {{ recommendation }}
              </n-thing>
            </n-list-item>
          </n-list>
        </n-tab-pane>
      </n-tabs>
    </n-card>
  </div>
</template>

<style scoped>
.performance-panel {
  height: 100%;
}
</style>
```

## 🔗 相关文档

- [组件架构](./03-component-architecture.md) - 架构级性能考虑
- [数据源系统](./06-data-sources.md) - 数据获取优化
- [调试工具](./15-debugging-tools.md) - 性能调试方法
- [最佳实践](./17-best-practices.md) - 开发最佳实践

---

**高性能是用户体验的基础！** 🚀