/**
 * 虚拟滚动 composable
 * 提供高性能的虚拟滚动功能，只渲染可见区域的项目
 */

import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount, type Ref } from 'vue'
import type { GridPlusItem, GridPlusConfig } from '../types/gridplus-types'
import type {
  VirtualScrollConfig,
  VirtualScrollState,
  VirtualScrollItemData,
  VirtualScrollViewport
} from '../types/virtual-scroll-types'
import { DEFAULT_VIRTUAL_SCROLL_CONFIG } from '../types/virtual-scroll-types'
import { debounce, throttle, rafThrottle } from '../utils/performance-utils'
import { createVirtualScrollObserver } from '../utils/intersection-observer-utils'

/**
 * 虚拟滚动状态接口
 */
interface VirtualScrollHookState {
  /** 虚拟滚动状态 */
  virtualState: Ref<VirtualScrollState>
  /** 可见的项目 */
  visibleItems: Ref<GridPlusItem[]>
  /** 渲染的项目（包含缓冲区） */
  renderItems: Ref<GridPlusItem[]>
  /** 容器引用 */
  containerRef: Ref<HTMLElement | null>
  /** 是否启用 */
  enabled: Ref<boolean>
}

/**
 * 虚拟滚动方法接口
 */
interface VirtualScrollHookMethods {
  /** 滚动到指定索引 */
  scrollToIndex: (index: number, behavior?: ScrollBehavior) => void
  /** 滚动到指定项目 */
  scrollToItem: (itemId: string, behavior?: ScrollBehavior) => void
  /** 更新项目高度 */
  updateItemHeight: (index: number, height: number) => void
  /** 刷新虚拟滚动 */
  refresh: () => void
  /** 获取项目位置信息 */
  getItemRect: (index: number) => DOMRect | null
  /** 预加载指定范围的项目 */
  preloadRange: (startIndex: number, endIndex: number) => Promise<void>
}

/**
 * 虚拟滚动 composable
 */
export function useVirtualScroll(
  items: Ref<GridPlusItem[]>,
  config: Ref<GridPlusConfig>,
  emit?: (event: any, ...args: any[]) => void
): VirtualScrollHookState & VirtualScrollHookMethods {
  // ============= 状态管理 =============

  /** 虚拟滚动配置 */
  const virtualConfig = computed<VirtualScrollConfig>(() => ({
    ...DEFAULT_VIRTUAL_SCROLL_CONFIG,
    enabled: config.value.enableVirtualScroll || false,
    containerHeight: 400,
    defaultItemHeight: config.value.estimatedItemHeight || 200,
    bufferSize: config.value.virtualScrollBuffer || 3
  }))

  /** 是否启用虚拟滚动 */
  const enabled = computed(() => virtualConfig.value.enabled && items.value.length > 10)

  /** 容器引用 */
  const containerRef = ref<HTMLElement | null>(null)

  /** 虚拟滚动状态 */
  const virtualState = ref<VirtualScrollState>({
    initialized: false,
    scrollTop: 0,
    lastScrollTop: 0,
    containerHeight: 0,
    totalHeight: 0,
    startIndex: 0,
    endIndex: 0,
    renderStartIndex: 0,
    renderEndIndex: 0,
    renderCount: 0,
    scrollDirection: 'none',
    isScrolling: false,
    scrollVelocity: 0
  })

  /** 项目高度缓存 */
  const itemHeightCache = ref<Map<number, number>>(new Map())

  /** 项目位置缓存 */
  const itemPositionCache = ref<Map<number, number>>(new Map())

  /** 滚动观察器 */
  let scrollObserver: any = null

  /** 最后滚动时间 */
  let lastScrollTime = 0

  // ============= 计算属性 =============

  /** 虚拟滚动项目数据 */
  const virtualItemsData = computed<VirtualScrollItemData[]>(() => {
    if (!enabled.value) return []

    const itemsData: VirtualScrollItemData[] = []
    let currentTop = 0

    for (let i = 0; i < items.value.length; i++) {
      const item = items.value[i]
      const height = getItemHeight(i)

      itemsData.push({
        index: i,
        height,
        top: currentTop,
        bottom: currentTop + height,
        inViewport: isIndexInViewport(i),
        inBuffer: isIndexInBuffer(i),
        rendered: isIndexRendered(i),
        data: item
      })

      currentTop += height
    }

    // 更新总高度
    virtualState.value.totalHeight = currentTop

    return itemsData
  })

  /** 当前视口信息 */
  const viewport = computed<VirtualScrollViewport>(() => {
    const { scrollTop, containerHeight } = virtualState.value

    return {
      top: scrollTop,
      bottom: scrollTop + containerHeight,
      height: containerHeight,
      visibleRange: {
        start: virtualState.value.startIndex,
        end: virtualState.value.endIndex
      },
      renderRange: {
        start: virtualState.value.renderStartIndex,
        end: virtualState.value.renderEndIndex
      }
    }
  })

  /** 可见的项目 */
  const visibleItems = computed(() => {
    if (!enabled.value) return items.value

    const { startIndex, endIndex } = virtualState.value
    return items.value.slice(startIndex, endIndex + 1)
  })

  /** 渲染的项目（包含缓冲区） */
  const renderItems = computed(() => {
    if (!enabled.value) return items.value

    const { renderStartIndex, renderEndIndex } = virtualState.value
    return items.value.slice(renderStartIndex, renderEndIndex + 1)
  })

  // ============= 核心方法 =============

  /**
   * 获取项目高度
   */
  const getItemHeight = (index: number): number => {
    // 优先使用缓存的高度
    const cachedHeight = itemHeightCache.value.get(index)
    if (cachedHeight !== undefined) {
      return cachedHeight
    }

    // 尝试从项目数据获取
    const item = items.value[index]
    if (item?.cachedHeight) {
      itemHeightCache.value.set(index, item.cachedHeight)
      return item.cachedHeight
    }

    // 使用估算高度
    return virtualConfig.value.defaultItemHeight
  }

  /**
   * 更新项目高度
   */
  const updateItemHeight = (index: number, height: number): void => {
    if (height <= 0) return

    const oldHeight = getItemHeight(index)
    if (Math.abs(oldHeight - height) < 1) return // 高度差异小于1px时忽略

    itemHeightCache.value.set(index, height)

    // 更新项目数据中的缓存高度
    const item = items.value[index]
    if (item) {
      item.cachedHeight = height
    }

    // 如果高度发生显著变化，重新计算布局
    if (Math.abs(oldHeight - height) > 10) {
      nextTick(() => {
        recalculateLayout()
      })
    }
  }

  /**
   * 计算可见范围
   */
  const calculateVisibleRange = (): void => {
    if (!enabled.value || virtualItemsData.value.length === 0) return

    const { scrollTop, containerHeight } = virtualState.value
    const viewportTop = scrollTop
    const viewportBottom = scrollTop + containerHeight

    let startIndex = 0
    let endIndex = virtualItemsData.value.length - 1

    // 二分查找起始索引
    let low = 0
    let high = virtualItemsData.value.length - 1

    while (low <= high) {
      const mid = Math.floor((low + high) / 2)
      const itemData = virtualItemsData.value[mid]

      if (itemData.bottom <= viewportTop) {
        low = mid + 1
      } else if (itemData.top >= viewportTop) {
        high = mid - 1
      } else {
        startIndex = mid
        break
      }
    }

    // 查找结束索引
    for (let i = startIndex; i < virtualItemsData.value.length; i++) {
      const itemData = virtualItemsData.value[i]
      if (itemData.top >= viewportBottom) {
        endIndex = i - 1
        break
      }
      endIndex = i
    }

    // 添加缓冲区
    const bufferSize = virtualConfig.value.bufferSize
    const renderStartIndex = Math.max(0, startIndex - bufferSize)
    const renderEndIndex = Math.min(virtualItemsData.value.length - 1, endIndex + bufferSize)

    // 更新状态
    virtualState.value.startIndex = startIndex
    virtualState.value.endIndex = endIndex
    virtualState.value.renderStartIndex = renderStartIndex
    virtualState.value.renderEndIndex = renderEndIndex
    virtualState.value.renderCount = renderEndIndex - renderStartIndex + 1

    // 触发可见范围变化事件
    if (emit) {
      emit('virtual-scroll-change', {
        startIndex,
        endIndex,
        visibleCount: endIndex - startIndex + 1,
        totalCount: items.value.length
      })
    }
  }

  /**
   * 重新计算布局
   */
  const recalculateLayout = (): void => {
    // 清空位置缓存
    itemPositionCache.value.clear()

    // 重新计算项目位置
    let currentTop = 0
    for (let i = 0; i < items.value.length; i++) {
      itemPositionCache.value.set(i, currentTop)
      currentTop += getItemHeight(i)
    }

    // 更新总高度
    virtualState.value.totalHeight = currentTop

    // 重新计算可见范围
    calculateVisibleRange()
  }

  /**
   * 处理滚动事件
   */
  const handleScroll = (event: Event): void => {
    if (!enabled.value || !containerRef.value) return

    const target = event.target as HTMLElement
    const scrollTop = target.scrollTop
    const now = Date.now()

    // 计算滚动方向和速度
    const scrollDelta = scrollTop - virtualState.value.lastScrollTop
    const timeDelta = now - lastScrollTime

    virtualState.value.scrollDirection = scrollDelta > 0 ? 'down' : scrollDelta < 0 ? 'up' : 'none'
    virtualState.value.scrollVelocity = timeDelta > 0 ? Math.abs(scrollDelta) / timeDelta : 0
    virtualState.value.isScrolling = true
    virtualState.value.lastScrollTop = virtualState.value.scrollTop
    virtualState.value.scrollTop = scrollTop

    lastScrollTime = now

    // 重新计算可见范围
    calculateVisibleRange()

    // 触发滚动事件
    if (emit) {
      emit('virtual-scroll-state-change', { ...virtualState.value })
    }

    // 停止滚动检测
    debouncedScrollEnd()
  }

  /**
   * 滚动结束处理
   */
  const handleScrollEnd = (): void => {
    virtualState.value.isScrolling = false
    virtualState.value.scrollVelocity = 0
  }

  /**
   * 防抖的滚动结束处理
   */
  const debouncedScrollEnd = debounce(handleScrollEnd, 150)

  /**
   * 节流的滚动处理
   */
  const throttledHandleScroll = rafThrottle(handleScroll)

  /**
   * 滚动到指定索引
   */
  const scrollToIndex = (index: number, behavior: ScrollBehavior = 'smooth'): void => {
    if (!enabled.value || !containerRef.value) return

    const targetIndex = Math.max(0, Math.min(index, items.value.length - 1))

    // 计算目标位置
    let targetTop = 0
    for (let i = 0; i < targetIndex; i++) {
      targetTop += getItemHeight(i)
    }

    // 滚动到目标位置
    containerRef.value.scrollTo({
      top: targetTop,
      behavior
    })
  }

  /**
   * 滚动到指定项目
   */
  const scrollToItem = (itemId: string, behavior: ScrollBehavior = 'smooth'): void => {
    const index = items.value.findIndex(item => item.i === itemId)
    if (index !== -1) {
      scrollToIndex(index, behavior)
    }
  }

  /**
   * 获取项目位置信息
   */
  const getItemRect = (index: number): DOMRect | null => {
    if (!enabled.value || !containerRef.value) return null

    const itemElement = containerRef.value.querySelector(`[data-virtual-index="${index}"]`)
    return itemElement ? itemElement.getBoundingClientRect() : null
  }

  /**
   * 预加载指定范围的项目
   */
  const preloadRange = async (startIndex: number, endIndex: number): Promise<void> => {
    if (!enabled.value) return

    const start = Math.max(0, startIndex)
    const end = Math.min(items.value.length - 1, endIndex)

    const preloadPromises: Promise<void>[] = []

    for (let i = start; i <= end; i++) {
      const item = items.value[i]
      if (item?.preloadData) {
        preloadPromises.push(
          item.preloadData().catch(error => {
            console.warn(`Preload failed for item ${item.i}:`, error)
          })
        )
      }
    }

    await Promise.allSettled(preloadPromises)
  }

  /**
   * 刷新虚拟滚动
   */
  const refresh = (): void => {
    if (!enabled.value) return

    // 清空缓存
    itemHeightCache.value.clear()
    itemPositionCache.value.clear()

    // 重新计算布局
    nextTick(() => {
      recalculateLayout()
    })
  }

  /**
   * 检查索引是否在视口中
   */
  const isIndexInViewport = (index: number): boolean => {
    return index >= virtualState.value.startIndex && index <= virtualState.value.endIndex
  }

  /**
   * 检查索引是否在缓冲区中
   */
  const isIndexInBuffer = (index: number): boolean => {
    return index >= virtualState.value.renderStartIndex && index <= virtualState.value.renderEndIndex
  }

  /**
   * 检查索引是否被渲染
   */
  const isIndexRendered = (index: number): boolean => {
    return isIndexInBuffer(index)
  }

  /**
   * 初始化虚拟滚动
   */
  const initialize = (): void => {
    if (!enabled.value || !containerRef.value) return

    // 获取容器尺寸
    const containerRect = containerRef.value.getBoundingClientRect()
    virtualState.value.containerHeight = containerRect.height

    // 初始化滚动观察器
    if (virtualConfig.value.useIntersectionObserver) {
      scrollObserver = createVirtualScrollObserver(containerRef.value)
      scrollObserver.on('visibilityChange', (visibleElements: Element[]) => {
        // 处理可见性变化
        if (emit) {
          emit('virtual-visibility-change', visibleElements)
        }
      })
    }

    // 绑定滚动事件
    containerRef.value.addEventListener('scroll', throttledHandleScroll, { passive: true })

    // 初始计算
    recalculateLayout()

    virtualState.value.initialized = true

    if (import.meta.env.DEV) {
      console.log('🔄 VirtualScroll - 初始化完成:', {
        totalItems: items.value.length,
        containerHeight: virtualState.value.containerHeight,
        bufferSize: virtualConfig.value.bufferSize
      })
    }
  }

  /**
   * 销毁虚拟滚动
   */
  const destroy = (): void => {
    if (containerRef.value) {
      containerRef.value.removeEventListener('scroll', throttledHandleScroll)
    }

    if (scrollObserver) {
      scrollObserver.destroy()
      scrollObserver = null
    }

    // 清空缓存
    itemHeightCache.value.clear()
    itemPositionCache.value.clear()

    virtualState.value.initialized = false

    if (import.meta.env.DEV) {
      console.log('💥 VirtualScroll - 组件销毁')
    }
  }

  // ============= 生命周期 =============

  /** 监听容器引用变化 */
  watch(containerRef, newContainer => {
    if (newContainer && enabled.value) {
      nextTick(() => {
        initialize()
      })
    } else {
      destroy()
    }
  })

  /** 监听启用状态变化 */
  watch(enabled, newEnabled => {
    if (newEnabled && containerRef.value) {
      nextTick(() => {
        initialize()
      })
    } else {
      destroy()
    }
  })

  /** 监听项目列表变化 */
  watch(
    items,
    () => {
      if (enabled.value) {
        // 延迟刷新以确保DOM更新完成
        nextTick(() => {
          refresh()
        })
      }
    },
    { deep: true }
  )

  /** 组件挂载 */
  onMounted(() => {
    if (enabled.value && containerRef.value) {
      initialize()
    }
  })

  /** 组件卸载 */
  onBeforeUnmount(() => {
    destroy()
  })

  // ============= 返回接口 =============

  return {
    // 状态
    virtualState,
    visibleItems,
    renderItems,
    containerRef,
    enabled,

    // 方法
    scrollToIndex,
    scrollToItem,
    updateItemHeight,
    refresh,
    getItemRect,
    preloadRange,

    // 内部方法（用于测试和调试）
    _internal: {
      virtualConfig,
      virtualItemsData,
      viewport,
      itemHeightCache,
      itemPositionCache,
      getItemHeight,
      calculateVisibleRange,
      recalculateLayout,
      isIndexInViewport,
      isIndexInBuffer,
      isIndexRendered,
      initialize,
      destroy
    }
  }
}
