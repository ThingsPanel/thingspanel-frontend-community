/**
 * 虚拟化网格Hook - 优化大量网格项的渲染性能
 */

import { computed, ref, watch, type Ref } from 'vue'
import type { GridItem, GridConfig, VirtualizationConfig, GridCalculation } from '../types'

/**
 * 虚拟化网格Hook
 */
export function useVirtualGrid(
  items: Ref<GridItem[]>,
  config: Ref<Partial<GridConfig>>,
  containerElement?: Ref<HTMLElement | undefined>
) {
  // 虚拟化配置
  const virtualizationConfig = computed<VirtualizationConfig>(() => ({
    enabled: config.value.virtualization || false,
    buffer: config.value.virtualBuffer || 5,
    itemHeight: config.value.rowHeight || 100,
    overscan: 3
  }))

  // 滚动位置
  const scrollTop = ref(0)
  const scrollLeft = ref(0)
  const containerHeight = ref(400)
  const containerWidth = ref(1200)

  // 可视区域计算
  const visibleArea = computed(() => {
    if (!virtualizationConfig.value.enabled) {
      return {
        startRow: 1,
        endRow: Math.max(...items.value.map(item => item.gridRow + item.gridRowSpan - 1)),
        startCol: 1,
        endCol: config.value.columns || 12
      }
    }

    const rowHeight = config.value.rowHeight || 100
    const gap = config.value.gap || 10
    const rowSizeWithGap = rowHeight + gap

    const startRow = Math.max(1, Math.floor(scrollTop.value / rowSizeWithGap) - virtualizationConfig.value.buffer)
    const visibleRows = Math.ceil(containerHeight.value / rowSizeWithGap)
    const endRow = startRow + visibleRows + virtualizationConfig.value.buffer * 2

    return {
      startRow,
      endRow,
      startCol: 1,
      endCol: config.value.columns || 12
    }
  })

  // 可见的网格项
  const visibleItems = computed(() => {
    if (!virtualizationConfig.value.enabled) {
      return items.value
    }

    const { startRow, endRow } = visibleArea.value

    return items.value.filter(item => {
      const itemEndRow = item.gridRow + item.gridRowSpan - 1
      // 检查项目是否与可视区域重叠
      return !(item.gridRow > endRow || itemEndRow < startRow)
    })
  })

  // 虚拟偏移
  const virtualOffset = computed(() => {
    if (!virtualizationConfig.value.enabled) {
      return { x: 0, y: 0 }
    }

    const rowHeight = config.value.rowHeight || 100
    const gap = config.value.gap || 10
    const rowSizeWithGap = rowHeight + gap

    return {
      x: 0,
      y: (visibleArea.value.startRow - 1) * rowSizeWithGap
    }
  })

  // 总内容高度
  const totalHeight = computed(() => {
    if (items.value.length === 0) return config.value.minHeight || 400

    const maxRow = Math.max(...items.value.map(item => item.gridRow + item.gridRowSpan - 1))
    const rowHeight = config.value.rowHeight || 100
    const gap = config.value.gap || 10

    return maxRow * rowHeight + (maxRow - 1) * gap
  })

  // 设置滚动监听
  const setupScrollListener = () => {
    if (!containerElement?.value) return

    const handleScroll = (event: Event) => {
      const target = event.target as HTMLElement
      scrollTop.value = target.scrollTop
      scrollLeft.value = target.scrollLeft
    }

    containerElement.value.addEventListener('scroll', handleScroll, { passive: true })

    // 监听容器大小变化
    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        containerHeight.value = entry.contentRect.height
        containerWidth.value = entry.contentRect.width
      }
    })

    resizeObserver.observe(containerElement.value)

    // 返回清理函数
    return () => {
      containerElement.value?.removeEventListener('scroll', handleScroll)
      resizeObserver.disconnect()
    }
  }

  // 监听容器元素变化
  watch(
    containerElement,
    (newEl, oldEl) => {
      if (oldEl) {
        // 清理旧的监听器
      }
      if (newEl) {
        setupScrollListener()
      }
    },
    { immediate: true }
  )

  // 滚动到指定项目
  const scrollToItem = (itemId: string) => {
    const item = items.value.find(i => i.id === itemId)
    if (!item || !containerElement?.value) return

    const rowHeight = config.value.rowHeight || 100
    const gap = config.value.gap || 10
    const targetY = (item.gridRow - 1) * (rowHeight + gap)

    containerElement.value.scrollTo({
      top: targetY,
      behavior: 'smooth'
    })
  }

  // 滚动到顶部
  const scrollToTop = () => {
    if (!containerElement?.value) return
    containerElement.value.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // 滚动到底部
  const scrollToBottom = () => {
    if (!containerElement?.value) return
    containerElement.value.scrollTo({
      top: totalHeight.value,
      behavior: 'smooth'
    })
  }

  // 获取性能统计
  const getPerformanceStats = () => {
    return {
      totalItems: items.value.length,
      visibleItems: visibleItems.value.length,
      renderRatio: items.value.length > 0 ? visibleItems.value.length / items.value.length : 0,
      virtualizationEnabled: virtualizationConfig.value.enabled,
      visibleArea: visibleArea.value,
      scrollPosition: { top: scrollTop.value, left: scrollLeft.value }
    }
  }

  return {
    // 响应式数据
    visibleItems,
    visibleArea,
    virtualOffset,
    totalHeight,
    scrollTop,
    scrollLeft,
    containerHeight,
    containerWidth,

    // 方法
    scrollToItem,
    scrollToTop,
    scrollToBottom,
    getPerformanceStats,
    setupScrollListener,

    // 配置
    virtualizationConfig
  }
}

/**
 * 虚拟化项目计算
 */
export function calculateVirtualItems(
  items: GridItem[],
  visibleArea: { startRow: number; endRow: number; startCol: number; endCol: number },
  enabled: boolean = true
): GridItem[] {
  if (!enabled) return items

  return items.filter(item => {
    const itemEndRow = item.gridRow + item.gridRowSpan - 1
    const itemEndCol = item.gridCol + item.gridColSpan - 1

    // 检查项目是否与可视区域重叠
    return !(
      item.gridRow > visibleArea.endRow ||
      itemEndRow < visibleArea.startRow ||
      item.gridCol > visibleArea.endCol ||
      itemEndCol < visibleArea.startCol
    )
  })
}

/**
 * 优化的渲染批次计算
 */
export function calculateRenderBatches(items: GridItem[], batchSize: number = 50): GridItem[][] {
  const batches: GridItem[][] = []

  // 按位置排序项目
  const sortedItems = [...items].sort((a, b) => {
    if (a.gridRow !== b.gridRow) {
      return a.gridRow - b.gridRow
    }
    return a.gridCol - b.gridCol
  })

  for (let i = 0; i < sortedItems.length; i += batchSize) {
    batches.push(sortedItems.slice(i, i + batchSize))
  }

  return batches
}
