/**
 * Grid 响应式工具函数
 * 专门处理断点管理、布局转换等响应式功能
 */

import type { GridLayoutPlusItem, ResponsiveLayout, LayoutOperationResult } from '../gridLayoutPlusTypes'

/**
 * 创建响应式布局
 */
export function createResponsiveLayout(
  baseLayout: GridLayoutPlusItem[],
  breakpoints: Record<string, number>,
  cols: Record<string, number>
): ResponsiveLayout {
  try {
    const responsiveLayout: ResponsiveLayout = {}
    const sortedBreakpoints = Object.entries(breakpoints).sort(([, a], [, b]) => b - a) // 从大到小排序

    // 为每个断点生成布局
    for (const [breakpoint] of sortedBreakpoints) {
      const targetCols = cols[breakpoint] || 12
      const baseCols = cols.lg || 12

      responsiveLayout[breakpoint] = transformLayoutForBreakpoint(baseLayout, baseCols, targetCols, breakpoint)
    }

    return responsiveLayout
  } catch (error) {
    console.warn('Failed to create responsive layout:', error)
    return {}
  }
}

/**
 * 为特定断点转换布局
 */
export function transformLayoutForBreakpoint(
  sourceLayout: GridLayoutPlusItem[],
  sourceCols: number,
  targetCols: number,
  breakpoint: string
): GridLayoutPlusItem[] {
  try {
    if (sourceCols === targetCols) {
      return sourceLayout.map(item => ({ ...item }))
    }

    const ratio = targetCols / sourceCols

    return sourceLayout.map(item => {
      // 计算新的位置和尺寸
      const newX = Math.floor(item.x * ratio)
      const newW = Math.max(1, Math.floor(item.w * ratio))

      // 确保项目不会超出边界
      const adjustedX = Math.min(newX, targetCols - newW)

      return {
        ...item,
        x: Math.max(0, adjustedX),
        w: newW,
        // Y坐标和高度保持不变，让布局算法自动调整
        // 但可以根据断点特性进行调整
        h: getResponsiveHeight(item, breakpoint)
      }
    })
  } catch (error) {
    console.warn('Failed to transform layout for breakpoint:', error)
    return sourceLayout
  }
}

/**
 * 根据断点获取响应式高度
 */
function getResponsiveHeight(item: GridLayoutPlusItem, breakpoint: string): number {
  try {
    // 根据断点调整高度
    switch (breakpoint) {
      case 'xs':
      case 'xxs':
        // 小屏幕下可能需要更高的项目来容纳内容
        return Math.max(item.h, 2)

      case 'sm':
        return Math.max(item.h, 1)

      default:
        return item.h
    }
  } catch (error) {
    console.warn('Failed to get responsive height:', error)
    return item.h
  }
}

/**
 * 合并响应式布局
 */
export function mergeResponsiveLayouts(layout1: ResponsiveLayout, layout2: ResponsiveLayout): ResponsiveLayout {
  try {
    const merged: ResponsiveLayout = { ...layout1 }

    for (const [breakpoint, layout] of Object.entries(layout2)) {
      merged[breakpoint] = layout
    }

    return merged
  } catch (error) {
    console.warn('Failed to merge responsive layouts:', error)
    return layout1
  }
}

/**
 * 验证响应式布局
 */
export function validateResponsiveLayout(
  responsiveLayout: ResponsiveLayout,
  breakpoints: Record<string, number>,
  cols: Record<string, number>
): LayoutOperationResult<boolean> {
  try {
    for (const [breakpoint, layout] of Object.entries(responsiveLayout)) {
      // 检查断点是否存在
      if (!(breakpoint in breakpoints)) {
        return {
          success: false,
          error: new Error(`Unknown breakpoint: ${breakpoint}`),
          message: `未知的断点: ${breakpoint}`
        }
      }

      // 检查列数配置
      const breakpointCols = cols[breakpoint]
      if (!breakpointCols) {
        return {
          success: false,
          error: new Error(`Missing column config for breakpoint: ${breakpoint}`),
          message: `断点 ${breakpoint} 缺少列配置`
        }
      }

      // 验证布局中的每个项目
      for (const item of layout) {
        if (item.x + item.w > breakpointCols) {
          return {
            success: false,
            error: new Error(`Item ${item.i} exceeds column limit in breakpoint ${breakpoint}`),
            message: `项目 ${item.i} 在断点 ${breakpoint} 中超出列数限制`
          }
        }
      }
    }

    return { success: true, data: true }
  } catch (error) {
    return {
      success: false,
      error: error as Error,
      message: '响应式布局验证失败'
    }
  }
}

/**
 * 获取断点信息
 */
export function getBreakpointInfo(
  currentWidth: number,
  breakpoints: Record<string, number>
): {
  current: string
  next?: string
  previous?: string
  width: number
} {
  try {
    const sortedBreakpoints = Object.entries(breakpoints).sort(([, a], [, b]) => b - a) // 从大到小排序

    let current = sortedBreakpoints[sortedBreakpoints.length - 1][0] // 默认最小的断点
    let currentIndex = sortedBreakpoints.length - 1

    // 找到当前断点
    for (let i = 0; i < sortedBreakpoints.length; i++) {
      const [breakpoint, minWidth] = sortedBreakpoints[i]
      if (currentWidth >= minWidth) {
        current = breakpoint
        currentIndex = i
        break
      }
    }

    return {
      current,
      next: currentIndex > 0 ? sortedBreakpoints[currentIndex - 1][0] : undefined,
      previous: currentIndex < sortedBreakpoints.length - 1 ? sortedBreakpoints[currentIndex + 1][0] : undefined,
      width: currentWidth
    }
  } catch (error) {
    console.warn('Failed to get breakpoint info:', error)
    return {
      current: 'lg',
      width: currentWidth
    }
  }
}

/**
 * 计算断点过渡
 */
export function calculateBreakpointTransition(
  fromBreakpoint: string,
  toBreakpoint: string,
  breakpoints: Record<string, number>,
  cols: Record<string, number>
): {
  direction: 'up' | 'down'
  ratio: number
  significant: boolean
} {
  try {
    const fromWidth = breakpoints[fromBreakpoint] || 0
    const toWidth = breakpoints[toBreakpoint] || 0
    const fromCols = cols[fromBreakpoint] || 12
    const toCols = cols[toBreakpoint] || 12

    const direction = toWidth > fromWidth ? 'up' : 'down'
    const ratio = toCols / fromCols
    const significant = Math.abs(ratio - 1) > 0.2 // 超过20%的列数变化被认为是显著的

    return { direction, ratio, significant }
  } catch (error) {
    console.warn('Failed to calculate breakpoint transition:', error)
    return { direction: 'up', ratio: 1, significant: false }
  }
}

/**
 * 自适应调整项目尺寸
 */
export function adaptItemSizeForBreakpoint(
  item: GridLayoutPlusItem,
  breakpoint: string,
  cols: number,
  containerWidth: number
): GridLayoutPlusItem {
  try {
    const adapted = { ...item }

    // 根据断点调整项目属性
    switch (breakpoint) {
      case 'xxs':
      case 'xs':
        // 极小屏幕：项目占满宽度，增加高度
        adapted.x = 0
        adapted.w = cols
        adapted.h = Math.max(adapted.h, 3)
        break

      case 'sm':
        // 小屏幕：最大占用一半宽度
        adapted.w = Math.min(adapted.w, Math.floor(cols / 2))
        adapted.h = Math.max(adapted.h, 2)
        break

      case 'md':
        // 中等屏幕：限制最大宽度
        adapted.w = Math.min(adapted.w, Math.floor(cols * 0.75))
        break

      default:
        // 大屏幕保持原样
        break
    }

    // 确保项目不超出边界
    adapted.w = Math.max(1, adapted.w)
    adapted.x = Math.min(adapted.x, cols - adapted.w)

    return adapted
  } catch (error) {
    console.warn('Failed to adapt item size for breakpoint:', error)
    return item
  }
}

/**
 * 响应式媒体查询工具
 */
export class ResponsiveMediaQuery {
  private breakpoints: Record<string, number>
  private callbacks: Map<string, Set<(matches: boolean) => void>> = new Map()
  private mediaQueries: Map<string, MediaQueryList> = new Map()

  constructor(breakpoints: Record<string, number>) {
    this.breakpoints = breakpoints
    this.initMediaQueries()
  }

  /**
   * 初始化媒体查询
   */
  private initMediaQueries(): void {
    if (typeof window === 'undefined') return

    for (const [breakpoint, minWidth] of Object.entries(this.breakpoints)) {
      const mediaQuery = window.matchMedia(`(min-width: ${minWidth}px)`)
      this.mediaQueries.set(breakpoint, mediaQuery)

      // 监听变化
      mediaQuery.addListener(e => {
        const callbacks = this.callbacks.get(breakpoint)
        if (callbacks) {
          callbacks.forEach(callback => callback(e.matches))
        }
      })
    }
  }

  /**
   * 监听断点变化
   */
  onBreakpoint(breakpoint: string, callback: (matches: boolean) => void): () => void {
    if (!this.callbacks.has(breakpoint)) {
      this.callbacks.set(breakpoint, new Set())
    }

    const callbacks = this.callbacks.get(breakpoint)!
    callbacks.add(callback)

    // 立即调用一次
    const mediaQuery = this.mediaQueries.get(breakpoint)
    if (mediaQuery) {
      callback(mediaQuery.matches)
    }

    // 返回取消监听的函数
    return () => {
      callbacks.delete(callback)
    }
  }

  /**
   * 检查当前是否匹配断点
   */
  matches(breakpoint: string): boolean {
    const mediaQuery = this.mediaQueries.get(breakpoint)
    return mediaQuery ? mediaQuery.matches : false
  }

  /**
   * 获取当前匹配的断点
   */
  getCurrentBreakpoint(): string {
    const sortedBreakpoints = Object.entries(this.breakpoints).sort(([, a], [, b]) => b - a)

    for (const [breakpoint] of sortedBreakpoints) {
      if (this.matches(breakpoint)) {
        return breakpoint
      }
    }

    return sortedBreakpoints[sortedBreakpoints.length - 1][0] || 'xs'
  }

  /**
   * 销毁监听器
   */
  destroy(): void {
    this.callbacks.clear()
    this.mediaQueries.clear()
  }
}
