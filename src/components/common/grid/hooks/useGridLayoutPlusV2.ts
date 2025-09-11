/**
 * Grid Layout Plus Hook V2 - 重构版本
 * 采用模块化架构，集成所有网格功能
 */

import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import type {
  GridLayoutPlusItem,
  GridLayoutPlusConfig,
  PerformanceConfig,
  ResponsiveLayout
} from '../gridLayoutPlusTypes'
import { useGridCore, type UseGridCoreOptions } from './useGridCore'
import { useGridHistory, type UseGridHistoryOptions } from './useGridHistory'
import { useGridPerformance, type UseGridPerformanceOptions } from './useGridPerformance'
import { useGridResponsive, type UseGridResponsiveOptions } from './useGridResponsive'

export interface UseGridLayoutPlusV2Options {
  /** 初始布局 */
  initialLayout?: GridLayoutPlusItem[]
  /** 网格配置 */
  config?: Partial<GridLayoutPlusConfig>
  /** 核心配置 */
  core?: UseGridCoreOptions
  /** 历史记录配置 */
  history?: UseGridHistoryOptions
  /** 性能配置 */
  performance?: UseGridPerformanceOptions
  /** 响应式配置 */
  responsive?: UseGridResponsiveOptions
  /** 是否启用自动保存 */
  autoSave?: boolean
  /** 自动保存延迟 */
  autoSaveDelay?: number
  /** 保存回调 */
  onSave?: (layout: GridLayoutPlusItem[]) => void
  /** 布局变化回调 */
  onLayoutChange?: (layout: GridLayoutPlusItem[]) => void
}

/**
 * Grid Layout Plus V2 Hook
 * 集成所有网格功能的主Hook
 */
export function useGridLayoutPlusV2(options: UseGridLayoutPlusV2Options = {}) {
  // 初始化子模块
  const gridCore = useGridCore({
    initialLayout: options.initialLayout,
    config: options.config,
    enableValidation: true,
    ...options.core
  })

  const gridHistory = useGridHistory({
    enabled: true,
    maxLength: 50,
    autoSaveInterval: options.autoSave ? options.autoSaveDelay || 3000 : 0,
    ...options.history
  })

  const gridPerformance = useGridPerformance({
    enableMonitoring: true,
    autoOptimize: true,
    ...options.performance
  })

  const gridResponsive = useGridResponsive({
    responsive: options.config?.responsive || false,
    breakpoints: options.config?.breakpoints,
    cols: options.config?.cols,
    onBreakpointChange: (breakpoint, layout) => {
      console.debug(`[GridLayoutPlusV2] Breakpoint changed: ${breakpoint}`)
      gridCore.updateLayout(layout)
    },
    ...options.responsive
  })

  // 自动保存定时器
  let autoSaveTimer: NodeJS.Timeout | null = null

  // 综合计算属性
  const layoutInfo = computed(() => ({
    items: gridCore.layout.value,
    stats: gridCore.layoutStats.value,
    bounds: gridCore.layoutBounds.value,
    selectedCount: gridCore.selectedItems.value.length,
    isValid: gridCore.isValidLayout.value,
    breakpoint: gridResponsive.currentBreakpoint.value,
    cols: gridResponsive.currentCols.value
  }))

  const systemStatus = computed(() => ({
    performance: {
      score: gridPerformance.performanceScore.value,
      metrics: gridPerformance.metrics.value,
      needsVirtualization: gridPerformance.needsVirtualization.value
    },
    history: {
      canUndo: gridHistory.canUndo.value,
      canRedo: gridHistory.canRedo.value,
      length: gridHistory.historyLength.value
    },
    responsive: {
      isResponsive: gridResponsive.isResponsive.value,
      breakpoint: gridResponsive.currentBreakpoint.value,
      containerWidth: gridResponsive.containerWidth.value
    }
  }))

  // 布局操作（集成历史记录）
  const updateLayoutWithHistory = (newLayout: GridLayoutPlusItem[]) => {
    const result = gridCore.updateLayout(newLayout)
    if (result.success) {
      gridHistory.saveToHistory(newLayout)

      // 估算性能影响
      gridPerformance.estimateMemoryUsage(newLayout)

      // 触发回调
      if (options.onLayoutChange) {
        options.onLayoutChange(newLayout)
      }
    }
    return result
  }

  const addItemWithHistory = (item: GridLayoutPlusItem) => {
    const result = gridCore.addItem(item)
    if (result.success) {
      gridHistory.saveToHistory(gridCore.layout.value)
      gridPerformance.estimateMemoryUsage(gridCore.layout.value)
    }
    return result
  }

  const removeItemWithHistory = (itemId: string) => {
    const result = gridCore.removeItem(itemId)
    if (result.success) {
      gridHistory.saveToHistory(gridCore.layout.value)
      gridPerformance.estimateMemoryUsage(gridCore.layout.value)
    }
    return result
  }

  const updateItemWithHistory = (itemId: string, updates: Partial<GridLayoutPlusItem>) => {
    const result = gridCore.updateItem(itemId, updates)
    if (result.success) {
      gridHistory.saveToHistory(gridCore.layout.value)
    }
    return result
  }

  // 历史操作（集成性能监控）
  const undoWithPerformanceMonitoring = async () => {
    const previousLayout = gridHistory.undo()
    if (previousLayout) {
      await gridPerformance.measureRenderTime(async () => {
        gridCore.updateLayout(previousLayout)
      })
      return previousLayout
    }
    return null
  }

  const redoWithPerformanceMonitoring = async () => {
    const nextLayout = gridHistory.redo()
    if (nextLayout) {
      await gridPerformance.measureRenderTime(async () => {
        gridCore.updateLayout(nextLayout)
      })
      return nextLayout
    }
    return null
  }

  // 响应式操作
  const handleContainerResize = (element: HTMLElement) => {
    gridResponsive.observeContainer(element)
  }

  const switchBreakpoint = (breakpoint: string) => {
    const newLayout = gridResponsive.handleBreakpointChange(breakpoint, gridCore.layout.value)
    if (newLayout) {
      updateLayoutWithHistory(newLayout)
    }
    return newLayout
  }

  // 性能优化操作
  const optimizePerformance = () => {
    const wasOptimized = gridPerformance.applyAutoOptimizations()
    if (wasOptimized) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[GridLayoutPlusV2] Performance optimizations applied')
      }
    }
    return wasOptimized
  }

  const measureLayoutPerformance = async (operation: () => Promise<void> | void) => {
    return await gridPerformance.measureRenderTime(operation)
  }

  // 批量操作（优化性能）
  const batchUpdate = async (operations: (() => void)[]) => {
    // 暂停历史记录和性能监控
    gridHistory.pauseRecording()
    gridPerformance.stopMonitoring()

    try {
      // 执行所有操作
      for (const operation of operations) {
        operation()
      }

      // 统一保存到历史记录
      gridHistory.resumeRecording()
      gridHistory.saveToHistory(gridCore.layout.value)

      // 重新开始性能监控
      gridPerformance.startMonitoring()
      gridPerformance.estimateMemoryUsage(gridCore.layout.value)
    } catch (error) {
      console.error('[GridLayoutPlusV2] Batch update failed:', error)

      // 恢复监控
      gridHistory.resumeRecording()
      gridPerformance.startMonitoring()
    }
  }

  // 自动保存功能
  const startAutoSave = () => {
    if (!options.autoSave || autoSaveTimer) return

    const delay = options.autoSaveDelay || 3000
    autoSaveTimer = setInterval(() => {
      if (options.onSave && gridCore.layout.value.length > 0) {
        options.onSave(gridCore.layout.value)
      }
    }, delay)

    console.debug(`[GridLayoutPlusV2] Auto save started with ${delay}ms interval`)
  }

  const stopAutoSave = () => {
    if (autoSaveTimer) {
      clearInterval(autoSaveTimer)
      autoSaveTimer = null
      console.debug('[GridLayoutPlusV2] Auto save stopped')
    }
  }

  // 完整的重置功能
  const resetAll = () => {
    gridCore.clearLayout()
    gridHistory.clearHistory()
    gridPerformance.metrics.value = {
      renderTime: 0,
      layoutTime: 0,
      itemCount: 0,
      memoryUsage: 0,
      fps: 60,
      lastUpdated: Date.now()
    }
    if (process.env.NODE_ENV === 'development') {
      console.log('[GridLayoutPlusV2] System reset completed')
    }
  }

  // 监听布局变化以更新性能指标
  watch(
    () => gridCore.layout.value,
    newLayout => {
      gridPerformance.metrics.value.itemCount = newLayout.length
      gridPerformance.metrics.value.lastUpdated = Date.now()
    },
    { immediate: true }
  )

  // 初始化
  onMounted(() => {
    // 初始化历史记录
    if (gridCore.layout.value.length > 0) {
      gridHistory.initHistory(gridCore.layout.value)
    }

    // 启动自动保存
    if (options.autoSave) {
      startAutoSave()
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('[GridLayoutPlusV2] Initialized successfully')
    }
  })

  // 清理
  onUnmounted(() => {
    stopAutoSave()
    gridPerformance.stopMonitoring()
    gridResponsive.unobserveContainer()
    if (process.env.NODE_ENV === 'development') {
      console.log('[GridLayoutPlusV2] Cleanup completed')
    }
  })

  return {
    // 子模块引用
    core: gridCore,
    history: gridHistory,
    performance: gridPerformance,
    responsive: gridResponsive,

    // 综合状态
    layoutInfo,
    systemStatus,

    // 主要操作方法
    updateLayout: updateLayoutWithHistory,
    addItem: addItemWithHistory,
    removeItem: removeItemWithHistory,
    updateItem: updateItemWithHistory,

    // 历史操作
    undo: undoWithPerformanceMonitoring,
    redo: redoWithPerformanceMonitoring,

    // 响应式操作
    handleContainerResize,
    switchBreakpoint,

    // 性能操作
    optimizePerformance,
    measureLayoutPerformance,

    // 批量操作
    batchUpdate,

    // 系统控制
    startAutoSave,
    stopAutoSave,
    resetAll,

    // 便捷访问（向后兼容）
    layout: gridCore.layout,
    selectedItems: gridCore.selectedItems,
    config: gridCore.config,
    isLoading: gridCore.isLoading,
    error: gridCore.error
  }
}
