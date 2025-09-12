/**
 * Grid 核心状态管理 Hook
 * 专注于网格布局的基础状态管理
 */

import { ref, computed, watch } from 'vue'
import type { GridLayoutPlusItem, GridLayoutPlusConfig, LayoutOperationResult } from '../gridLayoutPlusTypes'
import { validateLayout, validateGridItem, cloneLayout, getLayoutBounds, getLayoutStats } from '../gridLayoutPlusUtils'
import { DEFAULT_GRID_LAYOUT_PLUS_CONFIG } from '../gridLayoutPlusTypes'

export interface UseGridCoreOptions {
  /** 初始布局数据 */
  initialLayout?: GridLayoutPlusItem[]
  /** 网格配置 */
  config?: Partial<GridLayoutPlusConfig>
  /** 是否启用深度验证 */
  enableValidation?: boolean
}

/**
 * 核心网格状态管理Hook
 * 提供基础的布局数据管理和验证功能
 */
export function useGridCore(options: UseGridCoreOptions = {}) {
  // 基础状态
  const layout = ref<GridLayoutPlusItem[]>(options.initialLayout || [])
  const selectedItems = ref<string[]>([])
  const isLoading = ref(false)
  const error = ref<Error | null>(null)

  // 配置状态
  const config = ref<GridLayoutPlusConfig>({
    ...DEFAULT_GRID_LAYOUT_PLUS_CONFIG,
    ...options.config
  })

  // 计算属性
  const layoutStats = computed(() => {
    try {
      return getLayoutStats(layout.value, config.value.colNum)
    } catch (err) {
      console.error('Failed to calculate layout stats:', err)
      return {
        totalItems: layout.value.length,
        totalRows: 0,
        utilization: 0,
        density: 0
      }
    }
  })

  const layoutBounds = computed(() => {
    try {
      return getLayoutBounds(layout.value)
    } catch (err) {
      console.error('Failed to calculate layout bounds:', err)
      return { minX: 0, maxX: 0, minY: 0, maxY: 0, width: 0, height: 0 }
    }
  })

  const isValidLayout = computed(() => {
    if (!options.enableValidation) return true

    try {
      const validation = validateLayout(layout.value)
      return validation.success
    } catch (err) {
      error.value = err as Error
      return false
    }
  })

  const hasSelectedItems = computed(() => selectedItems.value.length > 0)

  // 布局操作方法
  const updateLayout = (newLayout: GridLayoutPlusItem[]): LayoutOperationResult<void> => {
    try {
      // 验证新布局
      if (options.enableValidation) {
        const validation = validateLayout(newLayout)
        if (!validation.success) {
          return {
            success: false,
            error: validation.error,
            message: validation.message
          }
        }
      }

      layout.value = cloneLayout(newLayout)
      error.value = null

      return { success: true }
    } catch (err) {
      const errorObj = err as Error
      error.value = errorObj
      return {
        success: false,
        error: errorObj,
        message: `Failed to update layout: ${errorObj.message}`
      }
    }
  }

  const addItem = (item: GridLayoutPlusItem): LayoutOperationResult<GridLayoutPlusItem> => {
    try {
      // 验证新项目
      if (options.enableValidation) {
        const validation = validateGridItem(item)
        if (!validation.success) {
          return {
            success: false,
            error: validation.error,
            message: validation.message
          }
        }
      }

      // 检查ID是否已存在
      if (layout.value.some(existingItem => existingItem.i === item.i)) {
        return {
          success: false,
          error: new Error('Item ID already exists'),
          message: `项目ID '${item.i}' 已存在`
        }
      }

      layout.value.push({ ...item })
      return { success: true, data: item }
    } catch (err) {
      const errorObj = err as Error
      error.value = errorObj
      return {
        success: false,
        error: errorObj,
        message: `Failed to add item: ${errorObj.message}`
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
          message: `项目 '${itemId}' 不存在`
        }
      }

      const removedItem = layout.value.splice(index, 1)[0]

      // 同时从选中列表中移除
      const selectedIndex = selectedItems.value.indexOf(itemId)
      if (selectedIndex > -1) {
        selectedItems.value.splice(selectedIndex, 1)
      }

      return { success: true, data: removedItem }
    } catch (err) {
      const errorObj = err as Error
      error.value = errorObj
      return {
        success: false,
        error: errorObj,
        message: `Failed to remove item: ${errorObj.message}`
      }
    }
  }

  const updateItem = (
    itemId: string,
    updates: Partial<GridLayoutPlusItem>
  ): LayoutOperationResult<GridLayoutPlusItem> => {
    try {
      const item = layout.value.find(item => item.i === itemId)
      if (!item) {
        return {
          success: false,
          error: new Error('Item not found'),
          message: `项目 '${itemId}' 不存在`
        }
      }

      // 创建更新后的项目进行验证
      const updatedItem = { ...item, ...updates }
      if (options.enableValidation) {
        const validation = validateGridItem(updatedItem)
        if (!validation.success) {
          return {
            success: false,
            error: validation.error,
            message: validation.message
          }
        }
      }

      // 应用更新
      Object.assign(item, updates)
      return { success: true, data: item }
    } catch (err) {
      const errorObj = err as Error
      error.value = errorObj
      return {
        success: false,
        error: errorObj,
        message: `Failed to update item: ${errorObj.message}`
      }
    }
  }

  const clearLayout = () => {
    layout.value = []
    selectedItems.value = []
    error.value = null
  }

  // 选择管理
  const selectItem = (itemId: string) => {
    if (!selectedItems.value.includes(itemId)) {
      selectedItems.value.push(itemId)
    }
  }

  const deselectItem = (itemId: string) => {
    const index = selectedItems.value.indexOf(itemId)
    if (index > -1) {
      selectedItems.value.splice(index, 1)
    }
  }

  const toggleItemSelection = (itemId: string) => {
    const index = selectedItems.value.indexOf(itemId)
    if (index > -1) {
      selectedItems.value.splice(index, 1)
    } else {
      selectedItems.value.push(itemId)
    }
  }

  const selectAll = () => {
    selectedItems.value = layout.value.map(item => item.i)
  }

  const deselectAll = () => {
    selectedItems.value = []
  }

  // 查询方法
  const getItem = (itemId: string) => {
    return layout.value.find(item => item.i === itemId) || null
  }

  const getSelectedItems = () => {
    return layout.value.filter(item => selectedItems.value.includes(item.i))
  }

  return {
    // 状态
    layout,
    selectedItems,
    isLoading,
    error,
    config,

    // 计算属性
    layoutStats,
    layoutBounds,
    isValidLayout,
    hasSelectedItems,

    // 布局操作
    updateLayout,
    addItem,
    removeItem,
    updateItem,
    clearLayout,

    // 选择管理
    selectItem,
    deselectItem,
    toggleItemSelection,
    selectAll,
    deselectAll,

    // 查询方法
    getItem,
    getSelectedItems
  }
}
