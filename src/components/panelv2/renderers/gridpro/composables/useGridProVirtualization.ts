/**
 * GridPro 虚拟化 Composable
 * 基于 Intersection Observer API 实现高性能虚拟化
 */

import { ref, computed, watch, onMounted, onUnmounted, nextTick, readonly } from 'vue'
import type { GridProItem, GridProConfig, VirtualizationConfig, Rectangle } from '../types/gridpro'
import { GridCalculator } from '../utils/gridAlgorithms'
import { VirtualizationHelper, createThrottledUpdater } from '../utils/performanceHelpers'

export interface UseGridProVirtualizationOptions {
  config: GridProConfig
  calculator: GridCalculator
  containerElement: HTMLElement | null
  items: GridProItem[]
  onVisibilityChange?: (visibleItems: GridProItem[], hiddenItems: GridProItem[]) => void
  onError?: (error: Error) => void
}

export function useGridProVirtualization(options: UseGridProVirtualizationOptions) {
  // 虚拟化状态
  const isEnabled = ref(options.config.virtualization)
  const viewportBounds = ref<Rectangle>({ x: 0, y: 0, width: 0, height: 0 })
  const scrollPosition = ref({ x: 0, y: 0 })
  
  // 可见性管理
  const visibleItemIds = ref<Set<string>>(new Set())
  const intersectionObserver = ref<IntersectionObserver | null>(null)
  const itemElements = ref<Map<string, HTMLElement>>(new Map())
  
  // 虚拟化配置
  const virtualizationConfig = ref<VirtualizationConfig>({
    enabled: options.config.virtualization,
    viewportBuffer: 200, // 视口缓冲区大小（像素）
    itemHeight: options.config.rowHeight + options.config.margin[1],
    estimatedItemHeight: options.config.rowHeight + options.config.margin[1],
    overscan: 3 // 额外渲染的项目数量
  })

  // 性能优化
  const throttledScrollHandler = createThrottledUpdater(() => {
    updateViewport()
  }, 16) // 60fps

  const throttledVisibilityUpdate = createThrottledUpdater(() => {
    updateVisibleItems()
  }, 50)

  /**
   * 初始化虚拟化
   */
  const initializeVirtualization = (): void => {
    if (!isEnabled.value || !options.containerElement) return

    try {
      // 设置视口边界
      updateViewportBounds()
      
      // 创建 Intersection Observer
      createIntersectionObserver()
      
      // 设置滚动监听
      setupScrollListener()
      
      // 初始化可见项目
      updateVisibleItems()
    } catch (error) {
      options.onError?.(error as Error)
    }
  }

  /**
   * 销毁虚拟化
   */
  const destroyVirtualization = (): void => {
    if (intersectionObserver.value) {
      intersectionObserver.value.disconnect()
      intersectionObserver.value = null
    }
    
    if (options.containerElement) {
      options.containerElement.removeEventListener('scroll', throttledScrollHandler)
    }
    
    visibleItemIds.value.clear()
    itemElements.value.clear()
  }

  /**
   * 创建 Intersection Observer
   */
  const createIntersectionObserver = (): void => {
    if (!options.containerElement) return

    const config = {
      root: options.containerElement,
      rootMargin: `${virtualizationConfig.value.viewportBuffer}px`,
      threshold: [0, 0.1, 0.5, 1.0]
    }

    intersectionObserver.value = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const itemId = entry.target.getAttribute('data-item-id')
        if (!itemId) return

        if (entry.isIntersecting) {
          visibleItemIds.value.add(itemId)
        } else {
          visibleItemIds.value.delete(itemId)
        }
      })

      throttledVisibilityUpdate()
    }, config)
  }

  /**
   * 设置滚动监听
   */
  const setupScrollListener = (): void => {
    if (!options.containerElement) return

    const handleScroll = (event: Event) => {
      const target = event.target as HTMLElement
      scrollPosition.value = {
        x: target.scrollLeft,
        y: target.scrollTop
      }
      
      throttledScrollHandler()
    }

    options.containerElement.addEventListener('scroll', handleScroll, { passive: true })
  }

  /**
   * 更新视口边界
   */
  const updateViewportBounds = (): void => {
    if (!options.containerElement) return

    const rect = options.containerElement.getBoundingClientRect()
    viewportBounds.value = {
      x: rect.left,
      y: rect.top,
      width: rect.width,
      height: rect.height
    }
  }

  /**
   * 更新视口信息
   */
  const updateViewport = (): void => {
    updateViewportBounds()
    
    if (isEnabled.value) {
      calculateVisibleRange()
    }
  }

  /**
   * 计算可见范围
   */
  const calculateVisibleRange = (): void => {
    if (!options.containerElement) return

    const container = options.containerElement
    const scrollTop = container.scrollTop
    const scrollLeft = container.scrollLeft
    const containerHeight = container.clientHeight
    const containerWidth = container.clientWidth

    // 计算可见的网格范围
    const gridInfo = options.calculator.calculateGrid()
    const buffer = virtualizationConfig.value.viewportBuffer

    const startRow = Math.max(0, Math.floor((scrollTop - buffer) / gridInfo.cellHeight))
    const endRow = Math.ceil((scrollTop + containerHeight + buffer) / gridInfo.cellHeight)
    
    const startCol = Math.max(0, Math.floor((scrollLeft - buffer) / gridInfo.cellWidth))
    const endCol = Math.min(options.config.columns, Math.ceil((scrollLeft + containerWidth + buffer) / gridInfo.cellWidth))

    // 更新可见项目
    updateVisibleItemsInRange(startRow, endRow, startCol, endCol)
  }

  /**
   * 更新指定范围内的可见项目
   */
  const updateVisibleItemsInRange = (
    startRow: number,
    endRow: number,
    startCol: number,
    endCol: number
  ): void => {
    const newVisibleIds = new Set<string>()

    options.items.forEach(item => {
      const itemEndRow = item.y + item.h
      const itemEndCol = item.x + item.w

      const isInRowRange = item.y < endRow && itemEndRow > startRow
      const isInColRange = item.x < endCol && itemEndCol > startCol

      if (isInRowRange && isInColRange) {
        newVisibleIds.add(item.id)
      }
    })

    // 比较变化
    const oldVisibleIds = new Set(visibleItemIds.value)
    const hasChanges = newVisibleIds.size !== oldVisibleIds.size || 
      ![...newVisibleIds].every(id => oldVisibleIds.has(id))

    if (hasChanges) {
      visibleItemIds.value = newVisibleIds
      updateVisibleItems()
    }
  }

  /**
   * 更新可见项目
   */
  const updateVisibleItems = (): void => {
    const visibleItems = options.items.filter(item => visibleItemIds.value.has(item.id))
    const hiddenItems = options.items.filter(item => !visibleItemIds.value.has(item.id))

    options.onVisibilityChange?.(visibleItems, hiddenItems)
  }

  /**
   * 注册项目元素
   */
  const registerItemElement = (itemId: string, element: HTMLElement): void => {
    itemElements.value.set(itemId, element)
    
    // 添加必要的属性
    element.setAttribute('data-item-id', itemId)
    
    // 如果启用虚拟化，观察该元素
    if (isEnabled.value && intersectionObserver.value) {
      intersectionObserver.value.observe(element)
    }
  }

  /**
   * 注销项目元素
   */
  const unregisterItemElement = (itemId: string): void => {
    const element = itemElements.value.get(itemId)
    if (element && intersectionObserver.value) {
      intersectionObserver.value.unobserve(element)
    }
    
    itemElements.value.delete(itemId)
    visibleItemIds.value.delete(itemId)
  }

  /**
   * 强制更新可见性
   */
  const forceUpdateVisibility = (): void => {
    if (!isEnabled.value) {
      // 如果禁用虚拟化，所有项目都可见
      visibleItemIds.value = new Set(options.items.map(item => item.id))
    } else {
      calculateVisibleRange()
    }
    updateVisibleItems()
  }

  /**
   * 滚动到指定项目
   */
  const scrollToItem = (itemId: string, behavior: ScrollBehavior = 'smooth'): void => {
    const item = options.items.find(item => item.id === itemId)
    const element = itemElements.value.get(itemId)
    
    if (!item || !options.containerElement) return

    if (element) {
      // 如果元素存在，直接滚动到元素
      element.scrollIntoView({ behavior, block: 'nearest', inline: 'nearest' })
    } else {
      // 如果元素不存在（被虚拟化隐藏），计算位置并滚动
      const bounds = options.calculator.getItemBounds(item)
      
      options.containerElement.scrollTo({
        left: bounds.x,
        top: bounds.y,
        behavior
      })
    }
  }

  /**
   * 确保项目可见
   */
  const ensureItemVisible = (itemId: string): Promise<void> => {
    return new Promise((resolve) => {
      const item = options.items.find(item => item.id === itemId)
      if (!item) {
        resolve()
        return
      }

      // 如果已经可见，直接返回
      if (visibleItemIds.value.has(itemId)) {
        resolve()
        return
      }

      // 滚动到项目位置
      scrollToItem(itemId, 'auto')

      // 等待下一帧后检查可见性
      nextTick(() => {
        setTimeout(() => {
          forceUpdateVisibility()
          resolve()
        }, 100)
      })
    })
  }

  /**
   * 获取虚拟化统计信息
   */
  const getVirtualizationStats = () => {
    return {
      enabled: isEnabled.value,
      totalItems: options.items.length,
      visibleItems: visibleItemIds.value.size,
      hiddenItems: options.items.length - visibleItemIds.value.size,
      memoryRatio: visibleItemIds.value.size / Math.max(1, options.items.length),
      viewportBounds: viewportBounds.value,
      scrollPosition: scrollPosition.value
    }
  }

  /**
   * 切换虚拟化状态
   */
  const toggleVirtualization = (enabled: boolean): void => {
    if (enabled === isEnabled.value) return

    isEnabled.value = enabled

    if (enabled) {
      initializeVirtualization()
    } else {
      destroyVirtualization()
      // 禁用时，所有项目都可见
      visibleItemIds.value = new Set(options.items.map(item => item.id))
      updateVisibleItems()
    }
  }

  /**
   * 更新虚拟化配置
   */
  const updateVirtualizationConfig = (newConfig: Partial<VirtualizationConfig>): void => {
    virtualizationConfig.value = { ...virtualizationConfig.value, ...newConfig }
    
    if (isEnabled.value) {
      // 重新创建 observer
      destroyVirtualization()
      initializeVirtualization()
    }
  }

  // 计算属性
  const visibleItems = computed(() => {
    return options.items.filter(item => visibleItemIds.value.has(item.id))
  })

  const hiddenItems = computed(() => {
    return options.items.filter(item => !visibleItemIds.value.has(item.id))
  })

  const virtualizationStats = computed(() => getVirtualizationStats())

  const isItemVisible = computed(() => {
    return (itemId: string) => visibleItemIds.value.has(itemId)
  })

  // 监听配置变化
  watch(() => options.config.virtualization, (enabled) => {
    toggleVirtualization(enabled)
  })

  watch(() => options.items, () => {
    forceUpdateVisibility()
  }, { deep: true })

  // 自动初始化
  onMounted(() => {
    if (isEnabled.value) {
      nextTick(() => {
        initializeVirtualization()
      })
    }
  })

  onUnmounted(() => {
    destroyVirtualization()
  })

  return {
    // 状态
    isEnabled: readonly(isEnabled),
    viewportBounds: readonly(viewportBounds),
    scrollPosition: readonly(scrollPosition),
    visibleItemIds: readonly(visibleItemIds),
    virtualizationConfig: readonly(virtualizationConfig),
    
    // 计算属性
    visibleItems,
    hiddenItems,
    virtualizationStats,
    isItemVisible,
    
    // 方法
    initializeVirtualization,
    destroyVirtualization,
    registerItemElement,
    unregisterItemElement,
    forceUpdateVisibility,
    scrollToItem,
    ensureItemVisible,
    toggleVirtualization,
    updateVirtualizationConfig,
    getVirtualizationStats
  }
}