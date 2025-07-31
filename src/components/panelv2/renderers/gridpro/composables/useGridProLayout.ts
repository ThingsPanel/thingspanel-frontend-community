/**
 * GridPro 布局管理 Composable
 * 负责网格布局的核心逻辑和状态管理
 */

import { ref, computed, watch, nextTick, readonly } from 'vue'
import { useDraggable, useResizeObserver } from '@vueuse/core'
import type { GridProItem, GridProConfig, GridCalculation, Rectangle } from '../types/gridpro'
import { GridCalculator, CollisionDetector, LayoutCompactor, AutoLayoutEngine } from '../utils/gridAlgorithms'
import { createBatchUpdater, PerformanceMonitor } from '../utils/performanceHelpers'

export interface UseGridProLayoutOptions {
  config: GridProConfig
  onLayoutChange?: (items: GridProItem[]) => void
  onItemUpdate?: (itemId: string, updates: Partial<GridProItem>) => void
  onError?: (error: Error) => void
}

export function useGridProLayout(options: UseGridProLayoutOptions) {
  // 基础状态
  const containerRef = ref<HTMLElement>()
  const items = ref<GridProItem[]>([])
  const selectedItems = ref<string[]>([])
  const isInitialized = ref(false)
  
  // 配置状态
  const config = ref<GridProConfig>(options.config)
  
  // 性能监控
  const performanceMonitor = new PerformanceMonitor()
  const batchUpdater = createBatchUpdater()
  
  // 核心工具类
  const calculator = new GridCalculator(config.value)
  const collisionDetector = new CollisionDetector()
  const autoLayoutEngine = new AutoLayoutEngine(calculator)
  
  // 容器尺寸监听
  const containerSize = ref({ width: 0, height: 0 })
  
  useResizeObserver(containerRef, (entries) => {
    const entry = entries[0]
    const { width, height } = entry.contentRect
    
    containerSize.value = { width, height }
    calculator.setContainerSize(width, height)
    
    // 响应式更新布局
    if (config.value.batchUpdates) {
      batchUpdater.schedule(() => updateLayout())
    } else {
      updateLayout()
    }
  })
  
  // 计算网格信息
  const gridCalculation = computed<GridCalculation>(() => {
    return calculator.calculateGrid()
  })
  
  // 计算可见项目（虚拟化）
  const visibleItems = computed(() => {
    if (!config.value.virtualization) {
      return items.value
    }
    
    // 简单的虚拟化实现
    const viewport = {
      top: 0, // 这里应该从滚动位置获取
      bottom: containerSize.value.height
    }
    
    return items.value.filter(item => {
      const bounds = calculator.getItemBounds(item)
      return bounds.y < viewport.bottom && bounds.y + bounds.height > viewport.top
    })
  })
  
  // 布局状态
  const layoutState = computed(() => ({
    totalItems: items.value.length,
    visibleItems: visibleItems.value.length,
    gridInfo: gridCalculation.value,
    selectedCount: selectedItems.value.length,
    hasCollisions: checkCollisions().length > 0
  }))
  
  /**
   * 初始化布局
   */
  const initialize = async (container: HTMLElement): Promise<void> => {
    try {
      containerRef.value = container
      
      // 设置初始容器尺寸
      const rect = container.getBoundingClientRect()
      containerSize.value = { width: rect.width, height: rect.height }
      calculator.setContainerSize(rect.width, rect.height)
      
      // 启动性能监控
      if (config.value.performanceMode === 'quality') {
        performanceMonitor.startMonitoring()
      }
      
      // 构建空间索引
      collisionDetector.buildSpatialIndex(items.value, calculator)
      
      isInitialized.value = true
      
      await nextTick()
    } catch (error) {
      options.onError?.(error as Error)
      throw error
    }
  }
  
  /**
   * 销毁布局
   */
  const destroy = (): void => {
    performanceMonitor.stopMonitoring()
    batchUpdater.clear()
    isInitialized.value = false
  }
  
  /**
   * 设置布局数据
   */
  const setItems = (newItems: GridProItem[]): void => {
    items.value = [...newItems]
    collisionDetector.buildSpatialIndex(items.value, calculator)
    updateLayout()
  }
  
  /**
   * 添加项目
   */
  const addItem = (item: GridProItem): void => {
    // 检查位置冲突
    const collisions = calculator.getCollisions(item, items.value)
    
    if (collisions.length > 0 && config.value.preventCollision) {
      // 寻找空闲位置
      const freePosition = calculator.findFreePosition(
        item.w, 
        item.h, 
        items.value, 
        item.x, 
        item.y
      )
      item.x = freePosition.x
      item.y = freePosition.y
    }
    
    items.value.push(item)
    collisionDetector.buildSpatialIndex(items.value, calculator)
    
    options.onLayoutChange?.(items.value)
  }
  
  /**
   * 移除项目
   */
  const removeItem = (itemId: string): void => {
    const index = items.value.findIndex(item => item.id === itemId)
    if (index !== -1) {
      items.value.splice(index, 1)
      selectedItems.value = selectedItems.value.filter(id => id !== itemId)
      
      // 重新构建空间索引
      collisionDetector.buildSpatialIndex(items.value, calculator)
      
      // 如果启用了压缩模式，重新排列
      if (config.value.compactType) {
        compactLayout()
      }
      
      options.onLayoutChange?.(items.value)
    }
  }
  
  /**
   * 更新项目
   */
  const updateItem = (itemId: string, updates: Partial<GridProItem>): void => {
    const index = items.value.findIndex(item => item.id === itemId)
    if (index !== -1) {
      const oldItem = items.value[index]
      const newItem = { ...oldItem, ...updates }
      
      // 检查更新后是否有冲突
      if (config.value.preventCollision && (updates.x !== undefined || updates.y !== undefined || updates.w !== undefined || updates.h !== undefined)) {
        const collisions = calculator.getCollisions(newItem, items.value)
        
        if (collisions.length > 0) {
          // 寻找空闲位置
          const freePosition = calculator.findFreePosition(
            newItem.w, 
            newItem.h, 
            items.value.filter(item => item.id !== itemId),
            newItem.x, 
            newItem.y
          )
          newItem.x = freePosition.x
          newItem.y = freePosition.y
        }
      }
      
      items.value[index] = newItem
      collisionDetector.buildSpatialIndex(items.value, calculator)
      
      options.onItemUpdate?.(itemId, updates)
      options.onLayoutChange?.(items.value)
    }
  }
  
  /**
   * 更新配置
   */
  const updateConfig = (newConfig: Partial<GridProConfig>): void => {
    config.value = { ...config.value, ...newConfig }
    calculator.updateConfig(config.value)
    
    // 重新计算布局
    updateLayout()
  }
  
  /**
   * 更新布局
   */
  const updateLayout = (): void => {
    if (!isInitialized.value) return
    
    performanceMonitor.measureUpdate(() => {
      // 重新构建空间索引
      collisionDetector.buildSpatialIndex(items.value, calculator)
      
      // 更新性能指标
      performanceMonitor.updateItemCount(items.value.length, visibleItems.value.length)
      
      // 检查性能警告
      const warnings = performanceMonitor.checkPerformanceWarnings()
      if (warnings.length > 0) {
        console.warn('GridPro Performance Warnings:', warnings)
      }
    })
  }
  
  /**
   * 压缩布局
   */
  const compactLayout = (): void => {
    if (!config.value.compactType) return
    
    const compactedItems = config.value.compactType === 'vertical'
      ? LayoutCompactor.compactVertically(items.value)
      : LayoutCompactor.compactHorizontally(items.value, config.value.columns)
    
    items.value = compactedItems
    collisionDetector.buildSpatialIndex(items.value, calculator)
    
    options.onLayoutChange?.(items.value)
  }
  
  /**
   * 自动排列
   */
  const autoArrange = (mode: 'rows' | 'columns' | 'compact' = 'compact'): void => {
    const arrangedItems = autoLayoutEngine.autoArrange(items.value, mode)
    items.value = arrangedItems
    collisionDetector.buildSpatialIndex(items.value, calculator)
    
    options.onLayoutChange?.(items.value)
  }
  
  /**
   * 检查碰撞
   */
  const checkCollisions = (): string[] => {
    const collisions: string[] = []
    
    items.value.forEach(item => {
      const itemCollisions = calculator.getCollisions(item, items.value)
      collisions.push(...itemCollisions)
    })
    
    return [...new Set(collisions)]
  }
  
  /**
   * 选择项目
   */
  const selectItems = (itemIds: string[]): void => {
    selectedItems.value = [...itemIds]
  }
  
  /**
   * 清除选择
   */
  const clearSelection = (): void => {
    selectedItems.value = []
  }
  
  /**
   * 获取项目边界
   */
  const getItemBounds = (itemId: string): Rectangle | null => {
    const item = items.value.find(item => item.id === itemId)
    if (!item) return null
    
    return calculator.getItemBounds(item)
  }
  
  /**
   * 点击测试
   */
  const hitTest = (position: { x: number; y: number }): string | null => {
    for (const item of items.value) {
      const bounds = calculator.getItemBounds(item)
      if (
        position.x >= bounds.x &&
        position.x <= bounds.x + bounds.width &&
        position.y >= bounds.y &&
        position.y <= bounds.y + bounds.height
      ) {
        return item.id
      }
    }
    return null
  }
  
  /**
   * 适应内容
   */
  const fitToContent = (): void => {
    if (items.value.length === 0) return
    
    // 计算所有项目的边界
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
    
    items.value.forEach(item => {
      const bounds = calculator.getItemBounds(item)
      minX = Math.min(minX, bounds.x)
      minY = Math.min(minY, bounds.y)
      maxX = Math.max(maxX, bounds.x + bounds.width)
      maxY = Math.max(maxY, bounds.y + bounds.height)
    })
    
    // 这里可以触发容器缩放或滚动到内容区域
    // 具体实现取决于父组件的需求
  }
  
  /**
   * 获取性能指标
   */
  const getPerformanceMetrics = () => {
    return performanceMonitor.getMetrics()
  }
  
  // 监听配置变化
  watch(() => config.value, (newConfig) => {
    calculator.updateConfig(newConfig)
    updateLayout()
  }, { deep: true })
  
  // 监听项目变化
  watch(() => items.value, () => {
    if (config.value.batchUpdates) {
      batchUpdater.schedule(() => options.onLayoutChange?.(items.value))
    } else {
      options.onLayoutChange?.(items.value)
    }
  }, { deep: true })
  
  return {
    // 状态
    containerRef,
    items: readonly(items),
    selectedItems: readonly(selectedItems),
    config: readonly(config),
    isInitialized: readonly(isInitialized),
    containerSize: readonly(containerSize),
    
    // 计算属性
    gridCalculation,
    visibleItems,
    layoutState,
    
    // 方法
    initialize,
    destroy,
    setItems,
    addItem,
    removeItem,
    updateItem,
    updateConfig,
    updateLayout,
    compactLayout,
    autoArrange,
    checkCollisions,
    selectItems,
    clearSelection,
    getItemBounds,
    hitTest,
    fitToContent,
    getPerformanceMetrics,
    
    // 工具类实例
    calculator,
    collisionDetector,
    performanceMonitor
  }
}