/**
 * Grid Layout Plus 工具函数
 */

import type {
  GridLayoutPlusItem,
  GridLayoutPlusConfig,
  LayoutOperationResult,
  ResponsiveLayout,
  PerformanceConfig
} from './gridLayoutPlusTypes'

/**
 * 验证网格项
 */
export function validateGridItem(item: GridLayoutPlusItem): LayoutOperationResult<boolean> {
  try {
    // 检查必要字段
    if (!item.i || typeof item.i !== 'string') {
      return {
        success: false,
        error: new Error('Grid item must have a valid string id'),
        message: '网格项必须有有效的字符串ID'
      }
    }

    // 检查位置和尺寸
    if (item.x < 0 || item.y < 0) {
      return {
        success: false,
        error: new Error('Grid position must be >= 0'),
        message: '网格位置必须大于等于0'
      }
    }

    if (item.w <= 0 || item.h <= 0) {
      return {
        success: false,
        error: new Error('Grid size must be > 0'),
        message: '网格尺寸必须大于0'
      }
    }

    // 检查约束条件
    if (item.minW && item.w < item.minW) {
      return {
        success: false,
        error: new Error('Width is less than minimum'),
        message: '宽度小于最小值'
      }
    }

    if (item.maxW && item.w > item.maxW) {
      return {
        success: false,
        error: new Error('Width exceeds maximum'),
        message: '宽度超过最大值'
      }
    }

    if (item.minH && item.h < item.minH) {
      return {
        success: false,
        error: new Error('Height is less than minimum'),
        message: '高度小于最小值'
      }
    }

    if (item.maxH && item.h > item.maxH) {
      return {
        success: false,
        error: new Error('Height exceeds maximum'),
        message: '高度超过最大值'
      }
    }

    return { success: true, data: true }
  } catch (error) {
    return {
      success: false,
      error: error as Error,
      message: '网格项验证失败'
    }
  }
}

/**
 * 验证布局
 */
export function validateLayout(layout: GridLayoutPlusItem[]): LayoutOperationResult<boolean> {
  try {
    // 检查ID唯一性
    const ids = layout.map(item => item.i)
    const uniqueIds = new Set(ids)
    if (ids.length !== uniqueIds.size) {
      return {
        success: false,
        error: new Error('Duplicate item IDs found'),
        message: '发现重复ID'
      }
    }

    // 检查每个项目
    for (const item of layout) {
      const itemValidation = validateGridItem(item)
      if (!itemValidation.success) {
        return itemValidation
      }
    }

    return { success: true, data: true }
  } catch (error) {
    return {
      success: false,
      error: error as Error,
      message: '布局验证失败'
    }
  }
}

/**
 * 检查两个项目是否重叠
 */
export function isItemsOverlapping(item1: GridLayoutPlusItem, item2: GridLayoutPlusItem): boolean {
  return !(
    item1.x + item1.w <= item2.x ||
    item1.x >= item2.x + item2.w ||
    item1.y + item1.h <= item2.y ||
    item1.y >= item2.y + item2.h
  )
}

/**
 * 寻找可用位置
 */
export function findAvailablePosition(
  w: number,
  h: number,
  layout: GridLayoutPlusItem[],
  colNum: number = 12
): { x: number; y: number } {
  // 简单的位置查找算法
  for (let y = 0; y < 100; y++) {
    for (let x = 0; x <= colNum - w; x++) {
      const proposed = { x, y, w, h, i: 'temp' }

      // 检查是否与现有项目冲突
      const hasCollision = layout.some(item => isItemsOverlapping(proposed, item))

      if (!hasCollision) {
        return { x, y }
      }
    }
  }

  return { x: 0, y: 0 }
}

/**
 * 生成唯一ID
 */
export function generateId(prefix: string = 'item'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * 深度克隆网格项
 */
export function cloneGridItem(item: GridLayoutPlusItem): GridLayoutPlusItem {
  return {
    ...item,
    props: item.props ? JSON.parse(JSON.stringify(item.props)) : undefined,
    data: item.data ? JSON.parse(JSON.stringify(item.data)) : undefined,
    style: item.style ? { ...item.style } : undefined,
    metadata: item.metadata ? JSON.parse(JSON.stringify(item.metadata)) : undefined
  }
}

/**
 * 批量克隆网格项
 */
export function cloneLayout(layout: GridLayoutPlusItem[]): GridLayoutPlusItem[] {
  return layout.map(cloneGridItem)
}

/**
 * 计算布局边界
 */
export function getLayoutBounds(layout: GridLayoutPlusItem[]): {
  minX: number
  minY: number
  maxX: number
  maxY: number
  width: number
  height: number
} {
  if (layout.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 }
  }

  const minX = Math.min(...layout.map(item => item.x))
  const minY = Math.min(...layout.map(item => item.y))
  const maxX = Math.max(...layout.map(item => item.x + item.w))
  const maxY = Math.max(...layout.map(item => item.y + item.h))

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY
  }
}

/**
 * 紧凑布局
 */
export function compactLayout(layout: GridLayoutPlusItem[]): GridLayoutPlusItem[] {
  const sortedLayout = [...layout].sort((a, b) => {
    if (a.y !== b.y) return a.y - b.y
    return a.x - b.x
  })

  const compacted: GridLayoutPlusItem[] = []

  for (const item of sortedLayout) {
    let newY = 0

    // 寻找最高可放置位置
    while (newY <= item.y) {
      const tempItem = { ...item, y: newY }
      const hasCollision = compacted.some(placedItem => isItemsOverlapping(tempItem, placedItem))

      if (!hasCollision) {
        break
      }

      newY++
    }

    compacted.push({ ...item, y: newY })
  }

  return compacted
}

/**
 * 布局排序
 */
export function sortLayout(
  layout: GridLayoutPlusItem[],
  sortBy: 'position' | 'size' | 'id' = 'position'
): GridLayoutPlusItem[] {
  return [...layout].sort((a, b) => {
    switch (sortBy) {
      case 'position':
        if (a.y !== b.y) return a.y - b.y
        return a.x - b.x
      case 'size': {
        const sizeA = a.w * a.h
        const sizeB = b.w * b.h
        return sizeB - sizeA // 大的在前
      }
      case 'id':
        return a.i.localeCompare(b.i)
      default:
        return 0
    }
  })
}

/**
 * 过滤布局
 */
export function filterLayout(
  layout: GridLayoutPlusItem[],
  predicate: (item: GridLayoutPlusItem) => boolean
): GridLayoutPlusItem[] {
  return layout.filter(predicate)
}

/**
 * 搜索布局项
 */
export function searchLayout(
  layout: GridLayoutPlusItem[],
  query: string,
  searchFields: (keyof GridLayoutPlusItem)[] = ['i', 'type', 'title']
): GridLayoutPlusItem[] {
  const lowercaseQuery = query.toLowerCase()

  return layout.filter(item => {
    return searchFields.some(field => {
      const value = item[field]
      if (typeof value === 'string') {
        return value.toLowerCase().includes(lowercaseQuery)
      }
      return false
    })
  })
}

/**
 * 布局统计信息
 */
export function getLayoutStats(layout: GridLayoutPlusItem[], colNum: number = 12) {
  const bounds = getLayoutBounds(layout)
  const totalCells = bounds.width * bounds.height
  const usedCells = layout.reduce((sum, item) => sum + item.w * item.h, 0)

  return {
    totalItems: layout.length,
    totalRows: bounds.height,
    totalCells,
    usedCells,
    utilization: totalCells > 0 ? (usedCells / totalCells) * 100 : 0,
    bounds,
    largestItem: layout.reduce(
      (largest, item) => {
        const size = item.w * item.h
        const largestSize = largest ? largest.w * largest.h : 0
        return size > largestSize ? item : largest
      },
      null as GridLayoutPlusItem | null
    ),
    smallestItem: layout.reduce(
      (smallest, item) => {
        const size = item.w * item.h
        const smallestSize = smallest ? smallest.w * smallest.h : Infinity
        return size < smallestSize ? item : smallest
      },
      null as GridLayoutPlusItem | null
    ),
    averageSize: layout.length > 0 ? layout.reduce((sum, item) => sum + item.w * item.h, 0) / layout.length : 0
  }
}

/**
 * 响应式布局转换
 */
export function transformLayoutForBreakpoint(
  layout: GridLayoutPlusItem[],
  fromCols: number,
  toCols: number
): GridLayoutPlusItem[] {
  if (fromCols === toCols) return cloneLayout(layout)

  const scale = toCols / fromCols

  return layout.map(item => ({
    ...item,
    x: Math.round(item.x * scale),
    w: Math.max(1, Math.round(item.w * scale))
    // y和h保持不变，只缩放水平方向
  }))
}

/**
 * 创建响应式布局
 */
export function createResponsiveLayout(
  baseLayout: GridLayoutPlusItem[],
  breakpoints: Record<string, number>,
  cols: Record<string, number>
): ResponsiveLayout {
  const responsive: ResponsiveLayout = {}
  const baseCols = cols.lg || 12

  Object.keys(breakpoints).forEach(breakpoint => {
    const targetCols = cols[breakpoint] || baseCols
    responsive[breakpoint as keyof ResponsiveLayout] = transformLayoutForBreakpoint(baseLayout, baseCols, targetCols)
  })

  return responsive
}

/**
 * 优化布局性能
 */
export function optimizeLayoutPerformance(
  layout: GridLayoutPlusItem[],
  config: PerformanceConfig
): GridLayoutPlusItem[] {
  let optimizedLayout = [...layout]

  // 如果启用懒加载，标记非可见项目
  if (config.enableLazyLoading) {
    // 这里可以根据可视区域标记项目
    // 实际实现需要结合滚动位置和容器大小
  }

  // 如果项目数量超过虚拟化阈值，启用虚拟化优化
  if (config.enableVirtualization && layout.length > config.virtualizationThreshold) {
    // 虚拟化逻辑
    console.log('启用虚拟化优化，项目数量:', layout.length)
  }

  return optimizedLayout
}

/**
 * 防抖函数
 */
export function debounce<T extends (...args: any[]) => any>(func: T, delay: number): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func.apply(this, args), delay)
  }
}

/**
 * 节流函数
 */
export function throttle<T extends (...args: any[]) => any>(func: T, delay: number): (...args: Parameters<T>) => void {
  let lastCall = 0
  return (...args: Parameters<T>) => {
    const now = Date.now()
    if (now - lastCall >= delay) {
      lastCall = now
      func.apply(this, args)
    }
  }
}

/**
 * 布局导出
 */
export function exportLayout(layout: GridLayoutPlusItem[], format: 'json' | 'csv' = 'json'): string {
  switch (format) {
    case 'json':
      return JSON.stringify(layout, null, 2)
    case 'csv': {
      const headers = ['i', 'x', 'y', 'w', 'h', 'type', 'title']
      const csvRows = [
        headers.join(','),
        ...layout.map(item => headers.map(header => item[header as keyof GridLayoutPlusItem] || '').join(','))
      ]
      return csvRows.join('\n')
    }
    default:
      return JSON.stringify(layout)
  }
}

/**
 * 布局导入
 */
export function importLayout(data: string, format: 'json' | 'csv' = 'json'): GridLayoutPlusItem[] {
  try {
    switch (format) {
      case 'json':
        return JSON.parse(data)
      case 'csv': {
        const lines = data.split('\n')
        const headers = lines[0].split(',')
        return lines.slice(1).map(line => {
          const values = line.split(',')
          const item: any = {}
          headers.forEach((header, index) => {
            const value = values[index]
            if (['x', 'y', 'w', 'h'].includes(header)) {
              item[header] = parseInt(value) || 0
            } else {
              item[header] = value
            }
          })
          return item as GridLayoutPlusItem
        })
      }
      default:
        return JSON.parse(data)
    }
  } catch (error) {
    console.error('布局导入失败:', error)
    return []
  }
}

/**
 * 获取项目在指定断点的配置
 */
export function getItemAtBreakpoint(
  item: GridLayoutPlusItem,
  breakpoint: string,
  responsiveLayout?: ResponsiveLayout
): GridLayoutPlusItem {
  if (responsiveLayout && responsiveLayout[breakpoint as keyof ResponsiveLayout]) {
    const breakpointLayout = responsiveLayout[breakpoint as keyof ResponsiveLayout]!
    const found = breakpointLayout.find(i => i.i === item.i)
    if (found) return found
  }
  return item
}
