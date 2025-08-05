/**
 * 网格布局Hook - 管理栅格布局逻辑
 */

import { computed, reactive, ref, watch, type Ref } from 'vue'
import type {
  GridConfig,
  GridItem,
  GridCalculation,
  UseGridLayoutReturn,
  GridPosition,
  GridSize,
  PixelPosition,
  PixelSize
} from '../types'
import { DEFAULT_GRID_CONFIG } from '../types'
import {
  calculateColWidth,
  calculateTotalRows,
  calculateContainerHeight,
  getGridArea,
  validateGridPosition,
  getItemPixelPosition,
  getItemPixelSize,
  gridToPixel,
  pixelToGrid,
  generateGridBackgroundStyle
} from '../utils'

/**
 * 网格布局Hook
 * @param items 网格项响应式引用
 * @param config 网格配置
 * @param containerElement 容器元素引用
 * @returns 布局相关的计算函数和响应式数据
 */
export function useGridLayout(
  items: Ref<GridItem[]>,
  config: Partial<GridConfig> = {},
  containerElement?: Ref<HTMLElement | undefined>
): UseGridLayoutReturn {
  // 合并默认配置，监听配置变化
  const gridConfig = reactive<GridConfig>({
    ...DEFAULT_GRID_CONFIG,
    ...config
  })

  // 监听外部配置变化
  watch(
    () => config,
    newConfig => {
      Object.assign(gridConfig, { ...DEFAULT_GRID_CONFIG, ...newConfig })
    },
    { deep: true, immediate: true }
  )

  // 容器宽度
  const containerWidth = ref(1200)

  // 监听容器尺寸变化
  if (containerElement) {
    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        containerWidth.value = entry.contentRect.width
      }
    })

    watch(
      containerElement,
      (newEl, oldEl) => {
        if (oldEl) {
          resizeObserver.unobserve(oldEl)
        }
        if (newEl) {
          resizeObserver.observe(newEl)
          containerWidth.value = newEl.offsetWidth || 1200
        }
      },
      { immediate: true }
    )
  }

  // 计算列宽
  const colWidth = computed(() => calculateColWidth(gridConfig, containerWidth.value))

  // 计算总行数
  const totalRows = computed(() => calculateTotalRows(items.value, gridConfig.minRows))

  // 计算容器高度
  const containerHeight = computed(() =>
    Math.max(calculateContainerHeight(totalRows.value, gridConfig.rowHeight, gridConfig.gap), gridConfig.minHeight || 0)
  )

  // 网格样式计算
  const gridCalculation = computed<GridCalculation>(() => {
    const gridTemplateColumns = `repeat(${gridConfig.columns}, ${colWidth.value}px)`
    const gridTemplateRows = `repeat(${totalRows.value}, ${gridConfig.rowHeight}px)`

    const gridStyle: Record<string, any> = {
      display: 'grid',
      gridTemplateColumns,
      gridTemplateRows,
      gap: `${gridConfig.gap}px`,
      width: '100%',
      height: `${containerHeight.value}px`,
      minHeight: `${gridConfig.minHeight || 0}px`,
      position: 'relative'
    }

    // 添加网格背景
    if (gridConfig.showGrid) {
      Object.assign(gridStyle, generateGridBackgroundStyle(gridConfig, containerWidth.value))
    }

    const itemStyle: Record<string, any> = {
      position: 'relative',
      overflow: 'hidden'
    }

    return {
      gridStyle,
      itemStyle,
      totalRows: totalRows.value,
      containerHeight: containerHeight.value
    }
  })

  // 栅格坐标转像素
  const gridToPixelFunc = (gridPos: number, isCol: boolean = true): number => {
    const cellSize = isCol ? colWidth.value : gridConfig.rowHeight
    return gridToPixel(gridPos, cellSize, gridConfig.gap)
  }

  // 像素转栅格坐标
  const pixelToGridFunc = (pixel: number, isCol: boolean = true): number => {
    const cellSize = isCol ? colWidth.value : gridConfig.rowHeight
    return pixelToGrid(pixel, cellSize, gridConfig.gap)
  }

  // 获取网格区域CSS
  const getGridAreaFunc = (item: GridItem): string => {
    return getGridArea(item)
  }

  // 验证位置有效性
  const validatePositionFunc = (position: GridPosition, size: GridSize): boolean => {
    return validateGridPosition(position, size, gridConfig)
  }

  // 计算项目像素位置
  const getItemPixelPositionFunc = (item: GridItem): PixelPosition => {
    return getItemPixelPosition(item, gridConfig, containerWidth.value)
  }

  // 计算项目像素尺寸
  const getItemPixelSizeFunc = (item: GridItem): PixelSize => {
    return getItemPixelSize(item, gridConfig, containerWidth.value)
  }

  return {
    gridConfig: readonly(gridConfig),
    gridCalculation: readonly(gridCalculation),
    gridToPixel: gridToPixelFunc,
    pixelToGrid: pixelToGridFunc,
    getGridArea: getGridAreaFunc,
    validatePosition: validatePositionFunc,
    getItemPixelPosition: getItemPixelPositionFunc,
    getItemPixelSize: getItemPixelSizeFunc
  }
}

/**
 * 创建只读的响应式对象
 */
function readonly<T>(obj: T): Readonly<T> {
  return obj as Readonly<T>
}
