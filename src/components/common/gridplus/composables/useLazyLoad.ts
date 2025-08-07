/**
 * 懒加载 composable
 * 提供高性能的懒加载功能，支持骨架屏和优先级加载
 */

import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount, type Ref } from 'vue'
import type { GridPlusItem, GridPlusConfig } from '../types/gridplus-types'
import type {
  LazyLoadState,
  LazyLoadConfig,
  LazyLoadItemData,
  LazyLoadManager,
  LazyLoadStats,
  PreloadStrategy
} from '../types/lazy-load-types'
import { DEFAULT_LAZY_LOAD_CONFIG } from '../types/lazy-load-types'
import { createLazyLoadObserver, intersectionManager } from '../utils/intersection-observer-utils'
import { debounce, BatchProcessor } from '../utils/performance-utils'

/**
 * 懒加载 Hook 状态接口
 */
interface LazyLoadHookState {
  /** 懒加载项目数据映射 */
  lazyLoadItems: Ref<Map<string, LazyLoadItemData>>
  /** 是否启用懒加载 */
  enabled: Ref<boolean>
  /** 加载统计信息 */
  stats: Ref<LazyLoadStats>
  /** 容器引用 */
  containerRef: Ref<HTMLElement | null>
}

/**
 * 懒加载 Hook 方法接口
 */
interface LazyLoadHookMethods {
  /** 手动触发项目加载 */
  loadItem: (itemId: string) => Promise<void>
  /** 预加载项目 */
  preloadItem: (itemId: string) => Promise<void>
  /** 取消加载 */
  cancelLoad: (itemId: string) => void
  /** 重试加载 */
  retryLoad: (itemId: string) => Promise<void>
  /** 获取项目状态 */
  getItemState: (itemId: string) => LazyLoadState
  /** 设置项目状态 */
  setItemState: (itemId: string, state: LazyLoadState) => void
  /** 批量预加载 */
  batchPreload: (itemIds: string[]) => Promise<void>
  /** 清理资源 */
  cleanup: () => void
}

/**
 * 懒加载管理器实现
 */
class LazyLoadManagerImpl implements LazyLoadManager {
  private items = new Map<string, LazyLoadItemData>()
  private loadingQueue = new Set<string>()
  private observer: any = null
  private batchProcessor: BatchProcessor<string>
  private config: LazyLoadConfig
  private callbacks: Map<string, Function> = new Map()

  constructor(config: LazyLoadConfig) {
    this.config = { ...config }

    // 创建批处理器
    this.batchProcessor = new BatchProcessor(
      (itemIds: string[]) => this.processBatch(itemIds),
      5, // 批量大小
      100 // 延迟时间
    )
  }

  initialize(items: GridPlusItem[], config: LazyLoadConfig): void {
    this.config = { ...this.config, ...config }

    // 初始化项目数据
    for (const item of items) {
      this.items.set(item.i, {
        id: item.i,
        state: item.lazyLoadState || LazyLoadState.IDLE,
        priority: item.priority || 5,
        retryCount: 0,
        inViewport: false
      })
    }

    // 创建观察器
    if (this.config.enabled) {
      this.observer = createLazyLoadObserver(
        {
          threshold: this.config.threshold,
          rootMargin: this.config.rootMargin
        },
        (element: Element) => this.handleElementLoad(element)
      )
    }
  }

  destroy(): void {
    if (this.observer) {
      this.observer.destroy()
      this.observer = null
    }

    this.batchProcessor.clear()
    this.items.clear()
    this.loadingQueue.clear()
    this.callbacks.clear()
  }

  addItem(item: GridPlusItem): void {
    if (this.items.has(item.i)) return

    const itemData: LazyLoadItemData = {
      id: item.i,
      state: item.lazyLoadState || LazyLoadState.IDLE,
      priority: item.priority || 5,
      retryCount: 0,
      inViewport: false
    }

    this.items.set(item.i, itemData)

    // 如果观察器存在，开始观察元素
    if (this.observer) {
      const element = document.querySelector(`[data-item-id="${item.i}"]`)
      if (element) {
        this.observer.observe(element)
      }
    }
  }

  removeItem(itemId: string): void {
    const itemData = this.items.get(itemId)
    if (!itemData) return

    // 取消正在进行的加载
    this.cancelLoad(itemId)

    // 停止观察元素
    if (this.observer) {
      const element = document.querySelector(`[data-item-id="${itemId}"]`)
      if (element) {
        this.observer.unobserve(element)
      }
    }

    this.items.delete(itemId)
  }

  updateItemState(itemId: string, state: LazyLoadState): void {
    const itemData = this.items.get(itemId)
    if (!itemData) return

    const previousState = itemData.state
    itemData.state = state
    itemData.lastUpdateTime = Date.now()

    // 触发状态变化回调
    this.emitStateChange(itemId, state, previousState)
  }

  async loadItem(itemId: string): Promise<void> {
    const itemData = this.items.get(itemId)
    if (!itemData) return

    // 防止重复加载
    if (this.loadingQueue.has(itemId) || itemData.state === LazyLoadState.LOADED) {
      return
    }

    this.loadingQueue.add(itemId)
    this.updateItemState(itemId, LazyLoadState.LOADING)
    itemData.loadStartTime = Date.now()

    try {
      // 触发加载开始事件
      this.emitLoadStart(itemId)

      // 模拟加载过程（实际应用中这里会是真实的数据加载）
      await this.performLoad(itemId)

      // 加载成功
      itemData.loadEndTime = Date.now()
      this.updateItemState(itemId, LazyLoadState.LOADED)

      const loadTime = itemData.loadEndTime - (itemData.loadStartTime || 0)
      this.emitLoadSuccess(itemId, null, loadTime)
    } catch (error) {
      itemData.error = error instanceof Error ? error : new Error(String(error))
      this.updateItemState(itemId, LazyLoadState.ERROR)
      this.emitLoadError(itemId, itemData.error)

      console.error(`Lazy load failed for item ${itemId}:`, error)
    } finally {
      this.loadingQueue.delete(itemId)
    }
  }

  async preloadItem(itemId: string): Promise<void> {
    const itemData = this.items.get(itemId)
    if (!itemData || itemData.state === LazyLoadState.LOADED) return

    // 降低预加载项目的优先级
    itemData.priority = Math.max(1, itemData.priority - 1)

    return this.loadItem(itemId)
  }

  cancelLoad(itemId: string): void {
    const itemData = this.items.get(itemId)
    if (!itemData) return

    this.loadingQueue.delete(itemId)

    if (itemData.state === LazyLoadState.LOADING) {
      this.updateItemState(itemId, LazyLoadState.CANCELLED)
    }
  }

  async retryLoad(itemId: string): Promise<void> {
    const itemData = this.items.get(itemId)
    if (!itemData) return

    itemData.retryCount++
    itemData.error = undefined

    if (itemData.retryCount > this.config.retryConfig.maxRetries) {
      console.warn(`Max retries exceeded for item ${itemId}`)
      return
    }

    // 计算重试延迟
    const delay = this.calculateRetryDelay(itemData.retryCount)

    await new Promise(resolve => setTimeout(resolve, delay))

    return this.loadItem(itemId)
  }

  getItemState(itemId: string): LazyLoadState {
    const itemData = this.items.get(itemId)
    return itemData ? itemData.state : LazyLoadState.IDLE
  }

  getLoadingStats(): LazyLoadStats {
    let totalItems = 0
    let loadedItems = 0
    let loadingItems = 0
    let errorItems = 0
    let totalLoadTime = 0
    let loadTimeCount = 0

    for (const itemData of this.items.values()) {
      totalItems++

      switch (itemData.state) {
        case LazyLoadState.LOADED:
          loadedItems++
          if (itemData.loadStartTime && itemData.loadEndTime) {
            totalLoadTime += itemData.loadEndTime - itemData.loadStartTime
            loadTimeCount++
          }
          break
        case LazyLoadState.LOADING:
          loadingItems++
          break
        case LazyLoadState.ERROR:
          errorItems++
          break
      }
    }

    return {
      totalItems,
      loadedItems,
      loadingItems,
      errorItems,
      averageLoadTime: loadTimeCount > 0 ? totalLoadTime / loadTimeCount : 0,
      cacheHitRate: 0, // TODO: 实现缓存命中率计算
      memoryUsage: 0 // TODO: 实现内存使用计算
    }
  }

  /**
   * 处理元素加载
   */
  private async handleElementLoad(element: Element): Promise<void> {
    const itemId = element.getAttribute('data-item-id')
    if (!itemId) return

    const itemData = this.items.get(itemId)
    if (!itemData) return

    itemData.inViewport = true
    this.emitEnterViewport(itemId)

    // 根据预加载策略决定是否立即加载
    if (this.shouldLoadImmediately(itemData)) {
      if (this.config.enablePriorityLoading) {
        this.batchProcessor.add(itemId)
      } else {
        await this.loadItem(itemId)
      }
    }
  }

  /**
   * 批量处理加载
   */
  private async processBatch(itemIds: string[]): Promise<void> {
    // 按优先级排序
    const sortedItems = itemIds
      .map(id => ({ id, priority: this.items.get(id)?.priority || 5 }))
      .sort((a, b) => a.priority - b.priority)

    // 限制并发数量
    const concurrentLimit = this.config.concurrentLimit
    const chunks: string[][] = []

    for (let i = 0; i < sortedItems.length; i += concurrentLimit) {
      chunks.push(sortedItems.slice(i, i + concurrentLimit).map(item => item.id))
    }

    // 逐批次加载
    for (const chunk of chunks) {
      const promises = chunk.map(itemId => this.loadItem(itemId))
      await Promise.allSettled(promises)
    }
  }

  /**
   * 执行实际的加载操作
   */
  private async performLoad(itemId: string): Promise<any> {
    // 这里应该根据实际需求实现加载逻辑
    // 例如：加载图片、获取数据等

    return new Promise((resolve, reject) => {
      // 模拟异步加载
      setTimeout(
        () => {
          if (Math.random() > 0.1) {
            // 90% 成功率
            resolve({ data: `Data for ${itemId}` })
          } else {
            reject(new Error(`Failed to load ${itemId}`))
          }
        },
        Math.random() * 1000 + 500
      ) // 500-1500ms 加载时间
    })
  }

  /**
   * 判断是否应该立即加载
   */
  private shouldLoadImmediately(itemData: LazyLoadItemData): boolean {
    return itemData.state === LazyLoadState.IDLE && itemData.inViewport
  }

  /**
   * 计算重试延迟
   */
  private calculateRetryDelay(retryCount: number): number {
    const { retryDelay, backoffStrategy, maxRetryDelay } = this.config.retryConfig

    let delay = retryDelay

    if (backoffStrategy === 'exponential') {
      delay = retryDelay * Math.pow(2, retryCount - 1)
    } else if (backoffStrategy === 'linear') {
      delay = retryDelay * retryCount
    }

    return Math.min(delay, maxRetryDelay)
  }

  /**
   * 触发事件
   */
  private emitStateChange(itemId: string, state: LazyLoadState, previousState: LazyLoadState): void {
    const callback = this.callbacks.get('state-change')
    if (callback) callback(itemId, state, previousState)
  }

  private emitLoadStart(itemId: string): void {
    const callback = this.callbacks.get('load-start')
    if (callback) callback(itemId)
  }

  private emitLoadSuccess(itemId: string, data: any, loadTime: number): void {
    const callback = this.callbacks.get('load-success')
    if (callback) callback(itemId, data, loadTime)
  }

  private emitLoadError(itemId: string, error: Error): void {
    const callback = this.callbacks.get('load-error')
    if (callback) callback(itemId, error)
  }

  private emitEnterViewport(itemId: string): void {
    const callback = this.callbacks.get('enter-viewport')
    if (callback) callback(itemId)
  }

  /**
   * 注册事件回调
   */
  on(event: string, callback: Function): void {
    this.callbacks.set(event, callback)
  }
}

/**
 * 懒加载 composable
 */
export function useLazyLoad(
  items: Ref<GridPlusItem[]>,
  config: Ref<GridPlusConfig>,
  emit?: (event: any, ...args: any[]) => void
): LazyLoadHookState & LazyLoadHookMethods {
  // ============= 状态管理 =============

  /** 懒加载配置 */
  const lazyLoadConfig = computed<LazyLoadConfig>(() => ({
    ...DEFAULT_LAZY_LOAD_CONFIG,
    enabled: config.value.enableLazyLoad || false,
    threshold: config.value.lazyLoadThreshold || 100,
    rootMargin: config.value.lazyLoadRootMargin || '50px'
  }))

  /** 是否启用懒加载 */
  const enabled = computed(() => lazyLoadConfig.value.enabled)

  /** 容器引用 */
  const containerRef = ref<HTMLElement | null>(null)

  /** 懒加载管理器 */
  let manager: LazyLoadManagerImpl | null = null

  /** 懒加载项目数据映射 */
  const lazyLoadItems = ref<Map<string, LazyLoadItemData>>(new Map())

  /** 加载统计信息 */
  const stats = ref<LazyLoadStats>({
    totalItems: 0,
    loadedItems: 0,
    loadingItems: 0,
    errorItems: 0,
    averageLoadTime: 0,
    cacheHitRate: 0,
    memoryUsage: 0
  })

  // ============= 方法实现 =============

  /**
   * 手动触发项目加载
   */
  const loadItem = async (itemId: string): Promise<void> => {
    if (!manager) return
    await manager.loadItem(itemId)
    updateStats()
  }

  /**
   * 预加载项目
   */
  const preloadItem = async (itemId: string): Promise<void> => {
    if (!manager) return
    await manager.preloadItem(itemId)
    updateStats()
  }

  /**
   * 取消加载
   */
  const cancelLoad = (itemId: string): void => {
    if (!manager) return
    manager.cancelLoad(itemId)
    updateStats()
  }

  /**
   * 重试加载
   */
  const retryLoad = async (itemId: string): Promise<void> => {
    if (!manager) return
    await manager.retryLoad(itemId)
    updateStats()
  }

  /**
   * 获取项目状态
   */
  const getItemState = (itemId: string): LazyLoadState => {
    if (!manager) return LazyLoadState.IDLE
    return manager.getItemState(itemId)
  }

  /**
   * 设置项目状态
   */
  const setItemState = (itemId: string, state: LazyLoadState): void => {
    if (!manager) return
    manager.updateItemState(itemId, state)
    updateStats()
  }

  /**
   * 批量预加载
   */
  const batchPreload = async (itemIds: string[]): Promise<void> => {
    if (!manager) return

    const promises = itemIds.map(id => manager!.preloadItem(id))
    await Promise.allSettled(promises)
    updateStats()
  }

  /**
   * 更新统计信息
   */
  const updateStats = (): void => {
    if (!manager) return
    stats.value = manager.getLoadingStats()
  }

  /**
   * 定时更新统计信息
   */
  const debouncedUpdateStats = debounce(updateStats, 1000)

  /**
   * 清理资源
   */
  const cleanup = (): void => {
    if (manager) {
      manager.destroy()
      manager = null
    }

    lazyLoadItems.value.clear()
    stats.value = {
      totalItems: 0,
      loadedItems: 0,
      loadingItems: 0,
      errorItems: 0,
      averageLoadTime: 0,
      cacheHitRate: 0,
      memoryUsage: 0
    }
  }

  /**
   * 初始化懒加载
   */
  const initialize = (): void => {
    if (!enabled.value) return

    cleanup() // 先清理之前的实例

    // 创建新的管理器
    manager = new LazyLoadManagerImpl(lazyLoadConfig.value)

    // 注册事件回调
    manager.on('state-change', (itemId: string, state: LazyLoadState, previousState: LazyLoadState) => {
      if (emit) {
        emit('lazy-load-state-change', itemId, state)
      }

      // 更新本地状态
      const itemData = lazyLoadItems.value.get(itemId)
      if (itemData) {
        itemData.state = state
      }

      debouncedUpdateStats()
    })

    manager.on('enter-viewport', (itemId: string) => {
      if (emit) {
        emit('item-enter-viewport', itemId)
      }
    })

    manager.on('load-success', (itemId: string, data: any, loadTime: number) => {
      if (import.meta.env.DEV) {
        console.log(`✅ LazyLoad - 项目加载成功: ${itemId} (${loadTime}ms)`)
      }
    })

    manager.on('load-error', (itemId: string, error: Error) => {
      console.error(`❌ LazyLoad - 项目加载失败: ${itemId}`, error)
    })

    // 初始化项目
    manager.initialize(items.value, lazyLoadConfig.value)

    // 初始化统计信息
    updateStats()

    if (import.meta.env.DEV) {
      console.log('🔄 LazyLoad - 初始化完成:', {
        enabled: enabled.value,
        totalItems: items.value.length,
        config: lazyLoadConfig.value
      })
    }
  }

  // ============= 生命周期 =============

  /** 监听启用状态变化 */
  watch(enabled, newEnabled => {
    if (newEnabled) {
      initialize()
    } else {
      cleanup()
    }
  })

  /** 监听项目列表变化 */
  watch(
    items,
    newItems => {
      if (!enabled.value || !manager) return

      // 同步项目到管理器
      const existingIds = new Set(lazyLoadItems.value.keys())
      const newIds = new Set(newItems.map(item => item.i))

      // 移除不存在的项目
      for (const existingId of existingIds) {
        if (!newIds.has(existingId)) {
          manager.removeItem(existingId)
          lazyLoadItems.value.delete(existingId)
        }
      }

      // 添加新项目
      for (const item of newItems) {
        if (!existingIds.has(item.i)) {
          manager.addItem(item)
          lazyLoadItems.value.set(item.i, {
            id: item.i,
            state: item.lazyLoadState || LazyLoadState.IDLE,
            priority: item.priority || 5,
            retryCount: 0,
            inViewport: false
          })
        }
      }

      updateStats()
    },
    { deep: true }
  )

  /** 组件挂载 */
  onMounted(() => {
    if (enabled.value) {
      initialize()
    }
  })

  /** 组件卸载 */
  onBeforeUnmount(() => {
    cleanup()
  })

  // ============= 返回接口 =============

  return {
    // 状态
    lazyLoadItems,
    enabled,
    stats,
    containerRef,

    // 方法
    loadItem,
    preloadItem,
    cancelLoad,
    retryLoad,
    getItemState,
    setItemState,
    batchPreload,
    cleanup,

    // 内部方法（用于测试和调试）
    _internal: {
      lazyLoadConfig,
      manager: computed(() => manager),
      initialize,
      updateStats
    }
  }
}
