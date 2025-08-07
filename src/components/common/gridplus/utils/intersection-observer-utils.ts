/**
 * Intersection Observer 工具函数
 * 提供高性能的元素可见性检测功能
 */

/**
 * Intersection Observer 配置接口
 */
export interface IntersectionObserverConfig {
  /** 根元素，用于检查目标的可见性 */
  root?: Element | null
  /** 根的边距，用来扩展或缩小根的判定范围的边界框 */
  rootMargin?: string
  /** 阈值列表，决定了什么时候触发回调 */
  threshold?: number | number[]
}

/**
 * 观察项目数据
 */
export interface ObservedItem {
  /** 元素ID */
  id: string
  /** 目标元素 */
  element: Element
  /** 是否在视口中 */
  inViewport: boolean
  /** 可见比例 */
  intersectionRatio: number
  /** 上次更新时间 */
  lastUpdateTime: number
  /** 回调函数 */
  callback?: (entry: IntersectionObserverEntry) => void
}

/**
 * 高性能 Intersection Observer 管理器
 */
export class IntersectionManager {
  private observers: Map<string, IntersectionObserver> = new Map()
  private observedItems: Map<Element, ObservedItem> = new Map()
  private configs: Map<string, IntersectionObserverConfig> = new Map()

  /**
   * 创建或获取 Intersection Observer
   */
  private getObserver(
    configKey: string,
    config: IntersectionObserverConfig,
    callback: (entries: IntersectionObserverEntry[]) => void
  ): IntersectionObserver {
    let observer = this.observers.get(configKey)

    if (!observer) {
      observer = new IntersectionObserver(callback, {
        root: config.root || null,
        rootMargin: config.rootMargin || '0px',
        threshold: config.threshold || 0
      })

      this.observers.set(configKey, observer)
      this.configs.set(configKey, config)
    }

    return observer
  }

  /**
   * 观察元素
   */
  observe(
    element: Element,
    options: {
      id: string
      config?: IntersectionObserverConfig
      callback?: (entry: IntersectionObserverEntry) => void
    }
  ): void {
    const { id, config = {}, callback } = options

    // 如果元素已经被观察，先取消观察
    if (this.observedItems.has(element)) {
      this.unobserve(element)
    }

    // 生成配置键
    const configKey = this.generateConfigKey(config)

    // 获取或创建观察器
    const observer = this.getObserver(configKey, config, entries => {
      this.handleIntersections(entries)
    })

    // 创建观察项目数据
    const item: ObservedItem = {
      id,
      element,
      inViewport: false,
      intersectionRatio: 0,
      lastUpdateTime: Date.now(),
      callback
    }

    // 开始观察
    observer.observe(element)
    this.observedItems.set(element, item)
  }

  /**
   * 停止观察元素
   */
  unobserve(element: Element): void {
    const item = this.observedItems.get(element)
    if (!item) return

    // 找到对应的观察器并停止观察
    for (const [configKey, observer] of this.observers) {
      try {
        observer.unobserve(element)
      } catch (error) {
        // 元素可能已经被移除，忽略错误
      }
    }

    this.observedItems.delete(element)
  }

  /**
   * 停止观察所有元素
   */
  unobserveAll(): void {
    for (const element of this.observedItems.keys()) {
      this.unobserve(element)
    }
  }

  /**
   * 销毁所有观察器
   */
  destroy(): void {
    // 停止所有观察
    this.unobserveAll()

    // 断开所有观察器
    for (const observer of this.observers.values()) {
      observer.disconnect()
    }

    // 清空所有数据
    this.observers.clear()
    this.observedItems.clear()
    this.configs.clear()
  }

  /**
   * 处理交叉观察回调
   */
  private handleIntersections(entries: IntersectionObserverEntry[]): void {
    const now = Date.now()

    for (const entry of entries) {
      const item = this.observedItems.get(entry.target)
      if (!item) continue

      // 更新项目状态
      const wasInViewport = item.inViewport
      const isInViewport = entry.isIntersecting

      item.inViewport = isInViewport
      item.intersectionRatio = entry.intersectionRatio
      item.lastUpdateTime = now

      // 触发回调
      if (item.callback) {
        try {
          item.callback(entry)
        } catch (error) {
          console.error(`Intersection callback error for item ${item.id}:`, error)
        }
      }

      // 如果状态发生变化，触发全局事件
      if (wasInViewport !== isInViewport) {
        this.emitVisibilityChange(item, entry)
      }
    }
  }

  /**
   * 触发可见性变化事件
   */
  private emitVisibilityChange(item: ObservedItem, entry: IntersectionObserverEntry): void {
    const event = new CustomEvent('intersectionVisibilityChange', {
      detail: {
        id: item.id,
        element: item.element,
        inViewport: item.inViewport,
        intersectionRatio: item.intersectionRatio,
        entry
      }
    })

    document.dispatchEvent(event)
  }

  /**
   * 生成配置键
   */
  private generateConfigKey(config: IntersectionObserverConfig): string {
    const rootId = config.root ? (config.root as any).id || 'root' : 'viewport'
    const rootMargin = config.rootMargin || '0px'
    const threshold = Array.isArray(config.threshold) ? config.threshold.join(',') : (config.threshold || 0).toString()

    return `${rootId}-${rootMargin}-${threshold}`
  }

  /**
   * 获取观察项目的状态
   */
  getItemState(element: Element): ObservedItem | undefined {
    return this.observedItems.get(element)
  }

  /**
   * 获取在视口中的项目
   */
  getVisibleItems(): ObservedItem[] {
    return Array.from(this.observedItems.values()).filter(item => item.inViewport)
  }

  /**
   * 获取观察器统计信息
   */
  getStats(): {
    observerCount: number
    observedItemCount: number
    visibleItemCount: number
    configs: string[]
  } {
    return {
      observerCount: this.observers.size,
      observedItemCount: this.observedItems.size,
      visibleItemCount: this.getVisibleItems().length,
      configs: Array.from(this.configs.keys())
    }
  }
}

/**
 * 懒加载 Intersection Observer
 * 专门用于懒加载场景的优化版本
 */
export class LazyLoadObserver {
  private observer: IntersectionObserver
  private loadingItems: Set<Element> = new Set()
  private loadedItems: Set<Element> = new Set()
  private errorItems: Set<Element> = new Set()

  constructor(
    config: IntersectionObserverConfig = {},
    private loadCallback: (element: Element) => Promise<void>
  ) {
    this.observer = new IntersectionObserver(entries => this.handleIntersections(entries), {
      root: config.root || null,
      rootMargin: config.rootMargin || '50px',
      threshold: config.threshold || 0.1
    })
  }

  /**
   * 添加懒加载项目
   */
  observe(element: Element): void {
    if (this.loadedItems.has(element) || this.loadingItems.has(element)) {
      return
    }

    this.observer.observe(element)
  }

  /**
   * 移除懒加载项目
   */
  unobserve(element: Element): void {
    this.observer.unobserve(element)
    this.loadingItems.delete(element)
  }

  /**
   * 处理交叉观察
   */
  private async handleIntersections(entries: IntersectionObserverEntry[]): Promise<void> {
    for (const entry of entries) {
      if (entry.isIntersecting && !this.loadingItems.has(entry.target)) {
        await this.loadItem(entry.target)
      }
    }
  }

  /**
   * 加载项目
   */
  private async loadItem(element: Element): Promise<void> {
    if (this.loadingItems.has(element) || this.loadedItems.has(element)) {
      return
    }

    this.loadingItems.add(element)

    try {
      await this.loadCallback(element)

      this.loadedItems.add(element)
      this.errorItems.delete(element)
      this.observer.unobserve(element)

      // 触发加载成功事件
      this.emitLoadEvent(element, 'success')
    } catch (error) {
      this.errorItems.add(element)

      // 触发加载失败事件
      this.emitLoadEvent(element, 'error', error)

      console.error('Lazy load error:', error)
    } finally {
      this.loadingItems.delete(element)
    }
  }

  /**
   * 触发加载事件
   */
  private emitLoadEvent(element: Element, type: 'success' | 'error', error?: any): void {
    const event = new CustomEvent('lazyLoadEvent', {
      detail: {
        element,
        type,
        error
      }
    })

    document.dispatchEvent(event)
  }

  /**
   * 手动触发加载
   */
  async forceLoad(element: Element): Promise<void> {
    await this.loadItem(element)
  }

  /**
   * 预加载多个项目
   */
  async preloadItems(elements: Element[]): Promise<void> {
    const promises = elements.map(element => this.loadItem(element))
    await Promise.allSettled(promises)
  }

  /**
   * 获取加载统计
   */
  getStats(): {
    loading: number
    loaded: number
    error: number
    total: number
  } {
    const total = this.loadingItems.size + this.loadedItems.size + this.errorItems.size

    return {
      loading: this.loadingItems.size,
      loaded: this.loadedItems.size,
      error: this.errorItems.size,
      total
    }
  }

  /**
   * 重置错误项目
   */
  resetErrorItems(): void {
    for (const element of this.errorItems) {
      this.errorItems.delete(element)
      this.observe(element)
    }
  }

  /**
   * 销毁观察器
   */
  destroy(): void {
    this.observer.disconnect()
    this.loadingItems.clear()
    this.loadedItems.clear()
    this.errorItems.clear()
  }
}

/**
 * 虚拟滚动 Intersection Observer
 * 专门用于虚拟滚动的优化版本
 */
export class VirtualScrollObserver {
  private observer: IntersectionObserver
  private visibleItems: Map<Element, IntersectionObserverEntry> = new Map()
  private callbacks: Map<string, Function> = new Map()

  constructor(
    private container: Element,
    config: IntersectionObserverConfig = {}
  ) {
    this.observer = new IntersectionObserver(entries => this.handleIntersections(entries), {
      root: container,
      rootMargin: config.rootMargin || '100px',
      threshold: config.threshold || [0, 0.25, 0.5, 0.75, 1]
    })
  }

  /**
   * 观察元素
   */
  observe(element: Element, id?: string): void {
    this.observer.observe(element)

    if (id) {
      element.setAttribute('data-virtual-id', id)
    }
  }

  /**
   * 停止观察元素
   */
  unobserve(element: Element): void {
    this.observer.unobserve(element)
    this.visibleItems.delete(element)
  }

  /**
   * 处理交叉观察
   */
  private handleIntersections(entries: IntersectionObserverEntry[]): void {
    const visibleChanges: Element[] = []

    for (const entry of entries) {
      const wasVisible = this.visibleItems.has(entry.target)
      const isVisible = entry.isIntersecting

      if (isVisible) {
        this.visibleItems.set(entry.target, entry)
      } else {
        this.visibleItems.delete(entry.target)
      }

      if (wasVisible !== isVisible) {
        visibleChanges.push(entry.target)
      }
    }

    // 如果有可见性变化，触发回调
    if (visibleChanges.length > 0) {
      this.triggerVisibilityChange(visibleChanges)
    }
  }

  /**
   * 触发可见性变化回调
   */
  private triggerVisibilityChange(elements: Element[]): void {
    const callback = this.callbacks.get('visibilityChange')
    if (callback) {
      const visibleElements = Array.from(this.visibleItems.keys())
      callback(visibleElements, elements)
    }
  }

  /**
   * 获取当前可见的元素
   */
  getVisibleElements(): Element[] {
    return Array.from(this.visibleItems.keys())
  }

  /**
   * 获取可见元素的详细信息
   */
  getVisibleElementsWithInfo(): Array<{
    element: Element
    entry: IntersectionObserverEntry
    id?: string
  }> {
    return Array.from(this.visibleItems.entries()).map(([element, entry]) => ({
      element,
      entry,
      id: element.getAttribute('data-virtual-id') || undefined
    }))
  }

  /**
   * 注册回调
   */
  on(event: 'visibilityChange', callback: (visibleElements: Element[], changedElements: Element[]) => void): void {
    this.callbacks.set(event, callback)
  }

  /**
   * 销毁观察器
   */
  destroy(): void {
    this.observer.disconnect()
    this.visibleItems.clear()
    this.callbacks.clear()
  }
}

/**
 * 全局 Intersection Observer 管理器实例
 */
export const intersectionManager = new IntersectionManager()

/**
 * 创建懒加载观察器
 */
export function createLazyLoadObserver(
  config?: IntersectionObserverConfig,
  loadCallback?: (element: Element) => Promise<void>
): LazyLoadObserver {
  const defaultLoadCallback = async (element: Element) => {
    // 默认的加载逻辑：处理图片懒加载
    if (element instanceof HTMLImageElement) {
      const src = element.dataset.src
      if (src) {
        return new Promise((resolve, reject) => {
          element.onload = () => resolve()
          element.onerror = () => reject(new Error('Image load failed'))
          element.src = src
        })
      }
    }
  }

  return new LazyLoadObserver(config, loadCallback || defaultLoadCallback)
}

/**
 * 创建虚拟滚动观察器
 */
export function createVirtualScrollObserver(
  container: Element,
  config?: IntersectionObserverConfig
): VirtualScrollObserver {
  return new VirtualScrollObserver(container, config)
}

/**
 * 工具函数：检查元素是否在视口中
 */
export function isElementInViewport(element: Element, threshold: number = 0): boolean {
  const rect = element.getBoundingClientRect()
  const windowHeight = window.innerHeight || document.documentElement.clientHeight
  const windowWidth = window.innerWidth || document.documentElement.clientWidth

  const visibleHeight = Math.max(0, Math.min(rect.bottom, windowHeight) - Math.max(rect.top, 0))
  const visibleWidth = Math.max(0, Math.min(rect.right, windowWidth) - Math.max(rect.left, 0))

  const elementHeight = rect.height
  const elementWidth = rect.width

  const visibleArea = visibleHeight * visibleWidth
  const totalArea = elementHeight * elementWidth

  return totalArea > 0 && visibleArea / totalArea >= threshold
}

/**
 * 工具函数：获取元素的可见比例
 */
export function getVisibilityRatio(element: Element): number {
  const rect = element.getBoundingClientRect()
  const windowHeight = window.innerHeight || document.documentElement.clientHeight
  const windowWidth = window.innerWidth || document.documentElement.clientWidth

  if (rect.width === 0 || rect.height === 0) return 0

  const visibleHeight = Math.max(0, Math.min(rect.bottom, windowHeight) - Math.max(rect.top, 0))
  const visibleWidth = Math.max(0, Math.min(rect.right, windowWidth) - Math.max(rect.left, 0))

  const visibleArea = visibleHeight * visibleWidth
  const totalArea = rect.width * rect.height

  return totalArea > 0 ? visibleArea / totalArea : 0
}
