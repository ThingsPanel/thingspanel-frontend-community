/**
 * 网格计算工具函数
 * 提供高性能的网格布局计算功能
 */

import type { GridPlusItem, GridPlusConfig, Position, Size, Rect } from '../types/gridplus-types'

/**
 * 网格计算器类
 * 负责处理所有网格相关的数学计算
 */
export class GridCalculator {
  private config: GridPlusConfig
  private containerWidth: number = 0
  private containerHeight: number = 0

  constructor(config: GridPlusConfig) {
    this.config = { ...config }
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<GridPlusConfig>): void {
    this.config = { ...this.config, ...config }
  }

  /**
   * 更新容器尺寸
   */
  updateContainerSize(width: number, height: number): void {
    this.containerWidth = width
    this.containerHeight = height
  }

  /**
   * 计算单个网格单元的像素宽度
   */
  getColWidth(): number {
    const { colNum, margin } = this.config
    const marginX = margin[0]
    const availableWidth = this.containerWidth - marginX * (colNum + 1)
    return availableWidth / colNum
  }

  /**
   * 计算网格项的像素位置和尺寸
   */
  calcItemPixelPosition(item: GridPlusItem): Rect {
    const colWidth = this.getColWidth()
    const { rowHeight, margin } = this.config
    const [marginX, marginY] = margin

    const x = Math.round(marginX + item.x * (colWidth + marginX))
    const y = Math.round(marginY + item.y * (rowHeight + marginY))
    const width = Math.round(item.w * colWidth + (item.w - 1) * marginX)
    const height = Math.round(item.h * rowHeight + (item.h - 1) * marginY)

    return { x, y, width, height }
  }

  /**
   * 将像素位置转换为网格位置
   */
  calcGridPosition(pixelX: number, pixelY: number): Position {
    const colWidth = this.getColWidth()
    const { rowHeight, margin } = this.config
    const [marginX, marginY] = margin

    const x = Math.round((pixelX - marginX) / (colWidth + marginX))
    const y = Math.round((pixelY - marginY) / (rowHeight + marginY))

    return {
      x: Math.max(0, Math.min(x, this.config.colNum - 1)),
      y: Math.max(0, y)
    }
  }

  /**
   * 计算网格的总高度
   */
  calcGridHeight(items: GridPlusItem[]): number {
    if (items.length === 0) return 0

    const maxY = Math.max(...items.map(item => item.y + item.h))
    const { rowHeight, margin } = this.config
    const marginY = margin[1]

    return maxY * rowHeight + (maxY + 1) * marginY
  }

  /**
   * 检查两个网格项是否重叠
   */
  isColliding(item1: GridPlusItem, item2: GridPlusItem): boolean {
    return !(
      item1.x + item1.w <= item2.x ||
      item1.x >= item2.x + item2.w ||
      item1.y + item1.h <= item2.y ||
      item1.y >= item2.y + item2.h
    )
  }

  /**
   * 查找可用的网格位置
   */
  findAvailablePosition(
    width: number,
    height: number,
    existingItems: GridPlusItem[],
    preferredPosition?: Position
  ): Position {
    const { colNum } = this.config

    // 如果有首选位置且位置可用，直接使用
    if (
      preferredPosition &&
      this.isPositionAvailable(preferredPosition.x, preferredPosition.y, width, height, existingItems)
    ) {
      return preferredPosition
    }

    // 搜索最佳位置
    for (let y = 0; y < 1000; y++) {
      for (let x = 0; x <= colNum - width; x++) {
        if (this.isPositionAvailable(x, y, width, height, existingItems)) {
          return { x, y }
        }
      }
    }

    // 如果找不到位置，返回默认位置
    return { x: 0, y: 0 }
  }

  /**
   * 检查指定位置是否可用
   */
  private isPositionAvailable(
    x: number,
    y: number,
    width: number,
    height: number,
    existingItems: GridPlusItem[]
  ): boolean {
    const testItem: GridPlusItem = {
      i: 'test',
      x,
      y,
      w: width,
      h: height
    }

    return !existingItems.some(item => this.isColliding(testItem, item))
  }

  /**
   * 压缩布局，移除空白区域
   */
  compactLayout(items: GridPlusItem[]): GridPlusItem[] {
    if (!this.config.verticalCompact) return items

    const sorted = [...items].sort((a, b) => a.y - b.y)
    const compacted: GridPlusItem[] = []

    for (const item of sorted) {
      const compactedItem = { ...item }

      // 尝试向上移动到最高可能位置
      let testY = 0
      while (testY <= compactedItem.y) {
        const testItem = { ...compactedItem, y: testY }
        if (!compacted.some(existing => this.isColliding(testItem, existing))) {
          compactedItem.y = testY
          break
        }
        testY++
      }

      compacted.push(compactedItem)
    }

    return compacted
  }

  /**
   * 自动调整布局以适应容器大小变化
   */
  autoAdjustLayout(items: GridPlusItem[], newColNum?: number): GridPlusItem[] {
    if (!newColNum || newColNum === this.config.colNum) return items

    const ratio = newColNum / this.config.colNum

    return items.map(item => ({
      ...item,
      x: Math.round(item.x * ratio),
      w: Math.max(1, Math.round(item.w * ratio))
    }))
  }

  /**
   * 计算两点之间的距离
   */
  calcDistance(point1: Position, point2: Position): number {
    const dx = point2.x - point1.x
    const dy = point2.y - point1.y
    return Math.sqrt(dx * dx + dy * dy)
  }

  /**
   * 计算项目的中心点
   */
  calcItemCenter(item: GridPlusItem): Position {
    return {
      x: item.x + item.w / 2,
      y: item.y + item.h / 2
    }
  }

  /**
   * 检查网格项是否在指定区域内
   */
  isItemInRegion(item: GridPlusItem, region: Rect): boolean {
    const itemRect = this.calcItemPixelPosition(item)

    return !(
      itemRect.x + itemRect.width < region.x ||
      itemRect.x > region.x + region.width ||
      itemRect.y + itemRect.height < region.y ||
      itemRect.y > region.y + region.height
    )
  }

  /**
   * 获取指定区域内的网格项
   */
  getItemsInRegion(items: GridPlusItem[], region: Rect): GridPlusItem[] {
    return items.filter(item => this.isItemInRegion(item, region))
  }

  /**
   * 计算最优的网格配置
   */
  calculateOptimalConfig(
    items: GridPlusItem[],
    containerSize: Size,
    constraints?: {
      minColWidth?: number
      maxColWidth?: number
      minRowHeight?: number
      maxRowHeight?: number
    }
  ): Partial<GridPlusConfig> {
    const { width: containerWidth, height: containerHeight } = containerSize
    const itemCount = items.length

    if (itemCount === 0) {
      return {}
    }

    // 计算理想的列数
    const avgItemWidth = items.reduce((sum, item) => sum + item.w, 0) / itemCount
    const estimatedColNum = Math.max(1, Math.round(12 / avgItemWidth))

    // 计算理想的行高
    const avgItemHeight = items.reduce((sum, item) => sum + item.h, 0) / itemCount
    const estimatedRowHeight = Math.max(50, containerHeight / (avgItemHeight * 5))

    const config: Partial<GridPlusConfig> = {
      colNum: Math.min(24, Math.max(1, estimatedColNum)),
      rowHeight: Math.round(estimatedRowHeight)
    }

    // 应用约束
    if (constraints) {
      const colWidth = containerWidth / config.colNum!
      if (constraints.minColWidth && colWidth < constraints.minColWidth) {
        config.colNum = Math.floor(containerWidth / constraints.minColWidth)
      }
      if (constraints.maxColWidth && colWidth > constraints.maxColWidth) {
        config.colNum = Math.ceil(containerWidth / constraints.maxColWidth)
      }

      if (constraints.minRowHeight && config.rowHeight! < constraints.minRowHeight) {
        config.rowHeight = constraints.minRowHeight
      }
      if (constraints.maxRowHeight && config.rowHeight! > constraints.maxRowHeight) {
        config.rowHeight = constraints.maxRowHeight
      }
    }

    return config
  }

  /**
   * 验证网格布局的完整性
   */
  validateLayout(items: GridPlusItem[]): {
    isValid: boolean
    errors: string[]
  } {
    const errors: string[] = []

    for (const item of items) {
      // 检查基本属性
      if (item.x < 0) errors.push(`Item ${item.i} has negative x position`)
      if (item.y < 0) errors.push(`Item ${item.i} has negative y position`)
      if (item.w <= 0) errors.push(`Item ${item.i} has invalid width`)
      if (item.h <= 0) errors.push(`Item ${item.i} has invalid height`)

      // 检查是否超出边界
      if (item.x + item.w > this.config.colNum) {
        errors.push(`Item ${item.i} exceeds grid width`)
      }

      // 检查约束
      if (item.minW && item.w < item.minW) {
        errors.push(`Item ${item.i} width is below minimum`)
      }
      if (item.maxW && item.w > item.maxW) {
        errors.push(`Item ${item.i} width exceeds maximum`)
      }
    }

    // 检查重叠
    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        if (this.isColliding(items[i], items[j])) {
          errors.push(`Items ${items[i].i} and ${items[j].i} are overlapping`)
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }
}

/**
 * 创建网格计算器实例
 */
export function createGridCalculator(config: GridPlusConfig): GridCalculator {
  return new GridCalculator(config)
}

/**
 * 快速计算工具函数集合
 */
export const GridUtils = {
  /**
   * 快速计算网格项像素位置
   */
  calcPixelPosition(item: GridPlusItem, colWidth: number, rowHeight: number, margin: [number, number]): Rect {
    const [marginX, marginY] = margin

    return {
      x: Math.round(marginX + item.x * (colWidth + marginX)),
      y: Math.round(marginY + item.y * (rowHeight + marginY)),
      width: Math.round(item.w * colWidth + (item.w - 1) * marginX),
      height: Math.round(item.h * rowHeight + (item.h - 1) * marginY)
    }
  },

  /**
   * 快速检查碰撞
   */
  checkCollision(item1: GridPlusItem, item2: GridPlusItem): boolean {
    return !(
      item1.x + item1.w <= item2.x ||
      item1.x >= item2.x + item2.w ||
      item1.y + item1.h <= item2.y ||
      item1.y >= item2.y + item2.h
    )
  },

  /**
   * 快速计算总高度
   */
  calcTotalHeight(items: GridPlusItem[], rowHeight: number, marginY: number): number {
    if (items.length === 0) return 0

    const maxBottom = Math.max(...items.map(item => item.y + item.h))
    return maxBottom * rowHeight + (maxBottom + 1) * marginY
  }
}
