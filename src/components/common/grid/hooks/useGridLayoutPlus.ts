/**
 * Grid Layout Plus Hook
 * 提供网格布局的状态管理和工具方法
 */

import { ref, computed, watch, nextTick, type Ref } from 'vue'
import type {
  GridLayoutPlusItem,
  GridLayoutPlusConfig,
  ResponsiveLayout,
  LayoutOperationResult,
  PerformanceConfig
} from '../gridLayoutPlusTypes'
import {
  validateLayout,
  validateGridItem,
  findAvailablePosition,
  generateId,
  cloneLayout,
  getLayoutBounds,
  compactLayout,
  sortLayout,
  filterLayout,
  searchLayout,
  getLayoutStats,
  createResponsiveLayout,
  transformLayoutForBreakpoint,
  optimizeLayoutPerformance,
  debounce,
  throttle
} from '../gridLayoutPlusUtils'
import { DEFAULT_GRID_LAYOUT_PLUS_CONFIG } from '../gridLayoutPlusTypes'

export interface UseGridLayoutPlusOptions {
  /** 初始布局 */
  initialLayout?: GridLayoutPlusItem[]
  /** 网格配置 */
  config?: Partial<GridLayoutPlusConfig>
  /** 性能配置 */
  performance?: Partial<PerformanceConfig>
  /** 是否启用自动保存 */
  autoSave?: boolean
  /** 自动保存延迟 */
  autoSaveDelay?: number
  /** 保存回调 */
  onSave?: (layout: GridLayoutPlusItem[]) => void
  /** 是否启用历史记录 */
  enableHistory?: boolean
  /** 历史记录最大长度 */
  maxHistoryLength?: number
}

export function useGridLayoutPlus(options: UseGridLayoutPlusOptions = {}) {
  // 配置
  const config = ref<GridLayoutPlusConfig>({
    ...DEFAULT_GRID_LAYOUT_PLUS_CONFIG,
    ...options.config
  })

  const performanceConfig = ref<PerformanceConfig>({
    enableVirtualization: false,
    virtualizationThreshold: 100,
    debounceDelay: 100,
    throttleDelay: 16,
    enableLazyLoading: false,
    lazyLoadingBuffer: 5,
    ...options.performance
  })

  // 状态
  const layout = ref<GridLayoutPlusItem[]>(options.initialLayout || [])
  const isLoading = ref(false)
  const error = ref<Error | null>(null)
  const selectedItems = ref<string[]>([])
  const currentBreakpoint = ref<string>('lg')

  // 历史记录
  const history = ref<GridLayoutPlusItem[][]>([])
  const historyIndex = ref(-1)
  const maxHistoryLength = options.maxHistoryLength || 50

  // 响应式布局
  const responsiveLayouts = ref<ResponsiveLayout>({})

  // 计算属性
  const layoutStats = computed(() => getLayoutStats(layout.value, config.value.colNum))

  const layoutBounds = computed(() => getLayoutBounds(layout.value))

  const hasSelectedItems = computed(() => selectedItems.value.length > 0)

  const canUndo = computed(() => historyIndex.value > 0)

  const canRedo = computed(() => historyIndex.value < history.value.length - 1)

  const isValidLayout = computed(() => {
    const validation = validateLayout(layout.value)
    return validation.success
  })

  const optimizedLayout = computed(() => {
    return optimizeLayoutPerformance(layout.value, performanceConfig.value)
  })

  // 历史记录管理
  const saveToHistory = () => {
    if (!options.enableHistory) return

    const currentLayout = cloneLayout(layout.value)

    // 如果当前不在历史记录末尾，删除后面的记录
    if (historyIndex.value < history.value.length - 1) {
      history.value = history.value.slice(0, historyIndex.value + 1)
    }

    history.value.push(currentLayout)
    historyIndex.value = history.value.length - 1

    // 限制历史记录长度
    if (history.value.length > maxHistoryLength) {
      history.value = history.value.slice(-maxHistoryLength)
      historyIndex.value = history.value.length - 1
    }
  }

  // 自动保存
  const autoSave = debounce(() => {
    if (options.autoSave && options.onSave) {
      options.onSave(cloneLayout(layout.value))
    }
  }, options.autoSaveDelay || 1000)

  // 布局操作
  const addItem = (
    type: string,
    itemOptions?: Partial<GridLayoutPlusItem>
  ): LayoutOperationResult<GridLayoutPlusItem> => {
    try {
      const w = itemOptions?.w || 2
      const h = itemOptions?.h || 2
      const position = findAvailablePosition(w, h, layout.value, config.value.colNum)

      const newItem: GridLayoutPlusItem = {
        i: generateId(),
        x: position.x,
        y: position.y,
        w,
        h,
        type,
        ...itemOptions
      }

      const validation = validateGridItem(newItem)
      if (!validation.success) {
        return validation
      }

      saveToHistory()
      layout.value.push(newItem)
      autoSave()

      return {
        success: true,
        data: newItem,
        message: '项目添加成功'
      }
    } catch (error) {
      return {
        success: false,
        error: error as Error,
        message: '项目添加失败'
      }
    }
  }

  const removeItem = (itemId: string): LayoutOperationResult<GridLayoutPlusItem> => {
    try {
      const index = layout.value.findIndex(item => item.i === itemId)
      if (index === -1) {
        return {
          success: false,
          error: new Error('Item not found'),
          message: '项目不存在'
        }
      }

      saveToHistory()
      const removedItem = layout.value.splice(index, 1)[0]

      // 从选中项目中移除
      selectedItems.value = selectedItems.value.filter(id => id !== itemId)

      autoSave()

      return {
        success: true,
        data: removedItem,
        message: '项目删除成功'
      }
    } catch (error) {
      return {
        success: false,
        error: error as Error,
        message: '项目删除失败'
      }
    }
  }

  const updateItem = (
    itemId: string,
    updates: Partial<GridLayoutPlusItem>
  ): LayoutOperationResult<GridLayoutPlusItem> => {
    try {
      const item = layout.value.find(i => i.i === itemId)
      if (!item) {
        return {
          success: false,
          error: new Error('Item not found'),
          message: '项目不存在'
        }
      }

      saveToHistory()
      Object.assign(item, updates)

      const validation = validateGridItem(item)
      if (!validation.success) {
        return validation
      }

      autoSave()

      return {
        success: true,
        data: item,
        message: '项目更新成功'
      }
    } catch (error) {
      return {
        success: false,
        error: error as Error,
        message: '项目更新失败'
      }
    }
  }

  const duplicateItem = (itemId: string): LayoutOperationResult<GridLayoutPlusItem> => {
    try {
      const sourceItem = layout.value.find(item => item.i === itemId)
      if (!sourceItem) {
        return {
          success: false,
          error: new Error('Source item not found'),
          message: '源项目不存在'
        }
      }

      const position = findAvailablePosition(sourceItem.w, sourceItem.h, layout.value, config.value.colNum)

      const duplicatedItem: GridLayoutPlusItem = {
        ...sourceItem,
        i: generateId(),
        x: position.x,
        y: position.y
      }

      saveToHistory()
      layout.value.push(duplicatedItem)
      autoSave()

      return {
        success: true,
        data: duplicatedItem,
        message: '项目复制成功'
      }
    } catch (error) {
      return {
        success: false,
        error: error as Error,
        message: '项目复制失败'
      }
    }
  }

  const clearLayout = (): LayoutOperationResult<boolean> => {
    try {
      saveToHistory()
      layout.value = []
      selectedItems.value = []
      autoSave()

      return {
        success: true,
        data: true,
        message: '布局清空成功'
      }
    } catch (error) {
      return {
        success: false,
        error: error as Error,
        message: '布局清空失败'
      }
    }
  }

  // 选择操作
  const selectItem = (itemId: string) => {
    if (!selectedItems.value.includes(itemId)) {
      selectedItems.value.push(itemId)
    }
  }

  const deselectItem = (itemId: string) => {
    selectedItems.value = selectedItems.value.filter(id => id !== itemId)
  }

  const selectMultipleItems = (itemIds: string[]) => {
    selectedItems.value = [...new Set([...selectedItems.value, ...itemIds])]
  }

  const selectAllItems = () => {
    selectedItems.value = layout.value.map(item => item.i)
  }

  const clearSelection = () => {
    selectedItems.value = []
  }

  const toggleItemSelection = (itemId: string) => {
    if (selectedItems.value.includes(itemId)) {
      deselectItem(itemId)
    } else {
      selectItem(itemId)
    }
  }

  // 批量操作
  const deleteSelectedItems = (): LayoutOperationResult<string[]> => {
    try {
      if (selectedItems.value.length === 0) {
        return {
          success: false,
          error: new Error('No items selected'),
          message: '没有选中的项目'
        }
      }

      saveToHistory()
      const deletedIds = [...selectedItems.value]

      layout.value = layout.value.filter(item => !selectedItems.value.includes(item.i))
      selectedItems.value = []

      autoSave()

      return {
        success: true,
        data: deletedIds,
        message: `删除了 ${deletedIds.length} 个项目`
      }
    } catch (error) {
      return {
        success: false,
        error: error as Error,
        message: '批量删除失败'
      }
    }
  }

  const duplicateSelectedItems = (): LayoutOperationResult<GridLayoutPlusItem[]> => {
    try {
      if (selectedItems.value.length === 0) {
        return {
          success: false,
          error: new Error('No items selected'),
          message: '没有选中的项目'
        }
      }

      saveToHistory()
      const duplicatedItems: GridLayoutPlusItem[] = []

      for (const itemId of selectedItems.value) {
        const result = duplicateItem(itemId)
        if (result.success && result.data) {
          duplicatedItems.push(result.data)
        }
      }

      return {
        success: true,
        data: duplicatedItems,
        message: `复制了 ${duplicatedItems.length} 个项目`
      }
    } catch (error) {
      return {
        success: false,
        error: error as Error,
        message: '批量复制失败'
      }
    }
  }

  // 布局工具
  const compactCurrentLayout = () => {
    saveToHistory()
    layout.value = compactLayout(layout.value)
    autoSave()
  }

  const sortCurrentLayout = (sortBy: 'position' | 'size' | 'id' = 'position') => {
    saveToHistory()
    layout.value = sortLayout(layout.value, sortBy)
    autoSave()
  }

  const searchItems = (query: string) => {
    return searchLayout(layout.value, query)
  }

  const filterItems = (predicate: (item: GridLayoutPlusItem) => boolean) => {
    return filterLayout(layout.value, predicate)
  }

  // 历史记录操作
  const undo = (): LayoutOperationResult<boolean> => {
    if (!canUndo.value) {
      return {
        success: false,
        error: new Error('Nothing to undo'),
        message: '没有可撤销的操作'
      }
    }

    historyIndex.value--
    layout.value = cloneLayout(history.value[historyIndex.value])

    return {
      success: true,
      data: true,
      message: '撤销成功'
    }
  }

  const redo = (): LayoutOperationResult<boolean> => {
    if (!canRedo.value) {
      return {
        success: false,
        error: new Error('Nothing to redo'),
        message: '没有可重做的操作'
      }
    }

    historyIndex.value++
    layout.value = cloneLayout(history.value[historyIndex.value])

    return {
      success: true,
      data: true,
      message: '重做成功'
    }
  }

  // 响应式布局
  const setBreakpoint = (breakpoint: string) => {
    currentBreakpoint.value = breakpoint
  }

  const createResponsiveLayoutForAll = () => {
    responsiveLayouts.value = createResponsiveLayout(layout.value, config.value.breakpoints, config.value.cols)
  }

  const getLayoutForBreakpoint = (breakpoint: string): GridLayoutPlusItem[] => {
    const breakpointLayout = responsiveLayouts.value[breakpoint as keyof ResponsiveLayout]
    return breakpointLayout || layout.value
  }

  // 导入导出
  const exportCurrentLayout = (format: 'json' | 'csv' = 'json'): string => {
    return JSON.stringify(layout.value, null, 2) // 简化实现
  }

  const importLayout = (data: string): LayoutOperationResult<boolean> => {
    try {
      const importedLayout = JSON.parse(data) as GridLayoutPlusItem[]
      const validation = validateLayout(importedLayout)

      if (!validation.success) {
        return validation
      }

      saveToHistory()
      layout.value = importedLayout
      selectedItems.value = []
      autoSave()

      return {
        success: true,
        data: true,
        message: '布局导入成功'
      }
    } catch (error) {
      return {
        success: false,
        error: error as Error,
        message: '布局导入失败'
      }
    }
  }

  // 工具方法
  const getItem = (itemId: string): GridLayoutPlusItem | undefined => {
    return layout.value.find(item => item.i === itemId)
  }

  const hasItem = (itemId: string): boolean => {
    return layout.value.some(item => item.i === itemId)
  }

  const getSelectedItems = (): GridLayoutPlusItem[] => {
    return layout.value.filter(item => selectedItems.value.includes(item.i))
  }

  // 节流的布局更新函数
  const throttledLayoutUpdate = throttle((newLayout: GridLayoutPlusItem[]) => {
    layout.value = newLayout
    autoSave()
  }, performanceConfig.value.throttleDelay)

  // 监听器
  watch(
    () => config.value,
    () => {
      // 配置变化时重新验证布局
      const validation = validateLayout(layout.value)
      if (!validation.success) {
        error.value = validation.error || null
      } else {
        error.value = null
      }
    },
    { deep: true }
  )

  // 初始化历史记录
  if (options.enableHistory && layout.value.length > 0) {
    saveToHistory()
  }

  return {
    // 状态
    layout,
    config,
    performanceConfig,
    isLoading,
    error,
    selectedItems,
    currentBreakpoint,
    responsiveLayouts,

    // 计算属性
    layoutStats,
    layoutBounds,
    hasSelectedItems,
    canUndo,
    canRedo,
    isValidLayout,
    optimizedLayout,

    // 布局操作
    addItem,
    removeItem,
    updateItem,
    duplicateItem,
    clearLayout,

    // 选择操作
    selectItem,
    deselectItem,
    selectMultipleItems,
    selectAllItems,
    clearSelection,
    toggleItemSelection,

    // 批量操作
    deleteSelectedItems,
    duplicateSelectedItems,

    // 布局工具
    compactCurrentLayout,
    sortCurrentLayout,
    searchItems,
    filterItems,

    // 历史记录
    undo,
    redo,
    saveToHistory,

    // 响应式布局
    setBreakpoint,
    createResponsiveLayoutForAll,
    getLayoutForBreakpoint,

    // 导入导出
    exportCurrentLayout,
    importLayout,

    // 工具方法
    getItem,
    hasItem,
    getSelectedItems,
    throttledLayoutUpdate
  }
}
