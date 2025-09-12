/**
 * Grid 响应式布局管理 Hook
 * 处理断点变化和响应式布局转换
 */

import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import type { GridLayoutPlusItem, ResponsiveLayout, GridLayoutPlusConfig } from '../gridLayoutPlusTypes'
import { createResponsiveLayout, transformLayoutForBreakpoint } from '../gridLayoutPlusUtils'

export interface UseGridResponsiveOptions {
  /** 是否启用响应式 */
  responsive?: boolean
  /** 断点配置 */
  breakpoints?: Record<string, number>
  /** 列数配置 */
  cols?: Record<string, number>
  /** 初始响应式布局 */
  initialResponsiveLayouts?: ResponsiveLayout
  /** 断点变化回调 */
  onBreakpointChange?: (breakpoint: string, layout: GridLayoutPlusItem[]) => void
}

/**
 * 响应式网格布局管理Hook
 * 提供断点监听和响应式布局转换功能
 */
export function useGridResponsive(options: UseGridResponsiveOptions = {}) {
  const {
    responsive = false,
    breakpoints = { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 },
    cols = { lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 },
    initialResponsiveLayouts = {},
    onBreakpointChange
  } = options

  // 响应式状态
  const currentBreakpoint = ref<string>('lg')
  const containerWidth = ref(0)
  const responsiveLayouts = ref<ResponsiveLayout>(initialResponsiveLayouts)
  const isResponsive = ref(responsive)

  // 断点监听
  let resizeObserver: ResizeObserver | null = null
  let containerElement: HTMLElement | null = null

  // 计算属性
  const currentCols = computed(() => {
    return cols[currentBreakpoint.value] || cols.lg || 12
  })

  const sortedBreakpoints = computed(() => {
    return Object.entries(breakpoints).sort(([, a], [, b]) => b - a) // 从大到小排序
  })

  const breakpointInfo = computed(() => {
    const bp = currentBreakpoint.value
    return {
      name: bp,
      width: breakpoints[bp] || 0,
      cols: cols[bp] || 12,
      isXs: bp === 'xxs' || bp === 'xs',
      isSm: bp === 'sm',
      isMd: bp === 'md',
      isLg: bp === 'lg',
      isXl: bp === 'xl'
    }
  })

  // 断点计算
  const calculateBreakpoint = (width: number): string => {
    for (const [bp, minWidth] of sortedBreakpoints.value) {
      if (width >= minWidth) {
        return bp
      }
    }
    return sortedBreakpoints.value[sortedBreakpoints.value.length - 1][0] || 'xs'
  }

  // 布局转换
  const transformLayoutForCurrentBreakpoint = (
    sourceLayout: GridLayoutPlusItem[],
    fromBreakpoint: string = 'lg'
  ): GridLayoutPlusItem[] => {
    if (!isResponsive.value) return sourceLayout

    try {
      const targetCols = currentCols.value
      const sourceCols = cols[fromBreakpoint] || 12

      return transformLayoutForBreakpoint(sourceLayout, sourceCols, targetCols, currentBreakpoint.value)
    } catch (error) {
      console.error('[GridResponsive] Failed to transform layout:', error)
      return sourceLayout
    }
  }

  // 响应式布局管理
  const setResponsiveLayout = (breakpoint: string, layout: GridLayoutPlusItem[]) => {
    if (!isResponsive.value) return

    try {
      responsiveLayouts.value[breakpoint] = [...layout]
      console.debug(`[GridResponsive] Set layout for breakpoint: ${breakpoint}`)
    } catch (error) {
      console.error('[GridResponsive] Failed to set responsive layout:', error)
    }
  }

  const getResponsiveLayout = (breakpoint: string): GridLayoutPlusItem[] | null => {
    return responsiveLayouts.value[breakpoint] || null
  }

  const getCurrentResponsiveLayout = (): GridLayoutPlusItem[] | null => {
    return getResponsiveLayout(currentBreakpoint.value)
  }

  const hasResponsiveLayout = (breakpoint: string): boolean => {
    return !!responsiveLayouts.value[breakpoint]
  }

  // 创建完整的响应式布局配置
  const createFullResponsiveLayout = (baseLayout: GridLayoutPlusItem[]): ResponsiveLayout => {
    if (!isResponsive.value) return {}

    try {
      return createResponsiveLayout(baseLayout, breakpoints, cols)
    } catch (error) {
      console.error('[GridResponsive] Failed to create responsive layout:', error)
      return {}
    }
  }

  // 断点切换处理
  const handleBreakpointChange = (newBreakpoint: string, currentLayout: GridLayoutPlusItem[]) => {
    const previousBreakpoint = currentBreakpoint.value

    console.debug(`[GridResponsive] Breakpoint changed: ${previousBreakpoint} -> ${newBreakpoint}`)

    // 保存当前布局到之前的断点
    if (currentLayout.length > 0) {
      setResponsiveLayout(previousBreakpoint, currentLayout)
    }

    // 更新当前断点
    currentBreakpoint.value = newBreakpoint

    // 获取新断点的布局
    let newLayout = getResponsiveLayout(newBreakpoint)

    if (!newLayout) {
      // 如果没有对应断点的布局，从当前布局转换
      newLayout = transformLayoutForCurrentBreakpoint(currentLayout, previousBreakpoint)
      setResponsiveLayout(newBreakpoint, newLayout)
    }

    // 触发回调
    if (onBreakpointChange) {
      onBreakpointChange(newBreakpoint, newLayout)
    }

    return newLayout
  }

  // 监听容器尺寸变化
  const observeContainer = (element: HTMLElement) => {
    containerElement = element

    if (!isResponsive.value) return

    // 初始尺寸
    const rect = element.getBoundingClientRect()
    containerWidth.value = rect.width

    // 创建ResizeObserver
    if (window.ResizeObserver) {
      resizeObserver = new ResizeObserver(entries => {
        for (const entry of entries) {
          const newWidth = entry.contentRect.width
          if (Math.abs(newWidth - containerWidth.value) > 10) {
            // 避免频繁触发
            containerWidth.value = newWidth
          }
        }
      })

      resizeObserver.observe(element)
    } else {
      // 回退到window resize事件
      const handleResize = () => {
        const rect = element.getBoundingClientRect()
        containerWidth.value = rect.width
      }

      window.addEventListener('resize', handleResize)

      // 清理函数
      return () => window.removeEventListener('resize', handleResize)
    }
  }

  const unobserveContainer = () => {
    if (resizeObserver) {
      resizeObserver.disconnect()
      resizeObserver = null
    }
    containerElement = null
  }

  // 监听容器宽度变化，计算断点
  watch(containerWidth, newWidth => {
    if (!isResponsive.value || newWidth <= 0) return

    const newBreakpoint = calculateBreakpoint(newWidth)
    if (newBreakpoint !== currentBreakpoint.value) {
      // 断点变化需要外部布局数据，这里只更新断点状态
      // 实际的布局转换由外部调用 handleBreakpointChange 处理
      console.debug(`[GridResponsive] Container width changed: ${newWidth}px, new breakpoint: ${newBreakpoint}`)
    }
  })

  // 工具方法
  const getBreakpointConfig = () => ({
    breakpoints,
    cols,
    current: currentBreakpoint.value,
    containerWidth: containerWidth.value
  })

  const isBreakpoint = (bp: string) => currentBreakpoint.value === bp

  const isBreakpointOrSmaller = (bp: string) => {
    const currentIndex = sortedBreakpoints.value.findIndex(([name]) => name === currentBreakpoint.value)
    const targetIndex = sortedBreakpoints.value.findIndex(([name]) => name === bp)
    return currentIndex >= targetIndex
  }

  const isBreakpointOrLarger = (bp: string) => {
    const currentIndex = sortedBreakpoints.value.findIndex(([name]) => name === currentBreakpoint.value)
    const targetIndex = sortedBreakpoints.value.findIndex(([name]) => name === bp)
    return currentIndex <= targetIndex
  }

  // 生命周期清理
  onUnmounted(() => {
    unobserveContainer()
  })

  return {
    // 状态
    currentBreakpoint,
    containerWidth,
    responsiveLayouts,
    isResponsive,

    // 计算属性
    currentCols,
    breakpointInfo,
    sortedBreakpoints,

    // 方法
    observeContainer,
    unobserveContainer,
    handleBreakpointChange,
    transformLayoutForCurrentBreakpoint,

    // 布局管理
    setResponsiveLayout,
    getResponsiveLayout,
    getCurrentResponsiveLayout,
    hasResponsiveLayout,
    createFullResponsiveLayout,

    // 工具方法
    getBreakpointConfig,
    isBreakpoint,
    isBreakpointOrSmaller,
    isBreakpointOrLarger,
    calculateBreakpoint
  }
}
