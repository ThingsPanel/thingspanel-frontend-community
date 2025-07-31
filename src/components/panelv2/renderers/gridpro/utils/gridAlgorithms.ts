/**
 * GridPro 网格布局算法核心
 * 高性能的网格计算和布局优化算法
 */

import type { GridProItem, GridProConfig, Rectangle, CollisionResult, GridCalculation } from '../types/gridpro'

/**
 * 网格计算工具类
 */
export class GridCalculator {
  private config: GridProConfig
  private containerWidth = 0
  private containerHeight = 0

  constructor(config: GridProConfig) {
    this.config = config
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<GridProConfig>): void {
    this.config = { ...this.config, ...config }
  }

  /**
   * 设置容器尺寸
   */
  setContainerSize(width: number, height: number): void {
    this.containerWidth = width
    this.containerHeight = height
  }

  /**
   * 计算网格基础信息
   */
  calculateGrid(): GridCalculation {
    const cellWidth = (this.containerWidth - this.config.margin[0] * 2) / this.config.columns
    const cellHeight = this.config.rowHeight + this.config.margin[1]
    const totalRows = Math.max(this.config.maxRows, Math.ceil(this.containerHeight / cellHeight))

    return {
      containerWidth: this.containerWidth,
      containerHeight: this.containerHeight,
      cellWidth,
      cellHeight,
      totalRows,
      usedCells: new Set()
    }
  }

  /**
   * 将像素坐标转换为网格坐标
   */
  pixelToGrid(x: number, y: number): { x: number; y: number } {
    const grid = this.calculateGrid()
    const gridX = Math.round((x - this.config.margin[0]) / grid.cellWidth)
    const gridY = Math.round((y - this.config.margin[1]) / grid.cellHeight)

    return {
      x: Math.max(0, Math.min(gridX, this.config.columns - 1)),
      y: Math.max(0, gridY)
    }
  }

  /**
   * 将网格坐标转换为像素坐标
   */
  gridToPixel(gridX: number, gridY: number): { x: number; y: number } {
    const grid = this.calculateGrid()
    return {
      x: gridX * grid.cellWidth + this.config.margin[0],
      y: gridY * grid.cellHeight + this.config.margin[1]
    }
  }

  /**
   * 计算项目的像素边界
   */
  getItemBounds(item: GridProItem): Rectangle {
    const { x, y } = this.gridToPixel(item.x, item.y)
    const grid = this.calculateGrid()
    
    return {
      x,
      y,
      width: item.w * grid.cellWidth - this.config.gap,
      height: item.h * grid.cellHeight - this.config.gap
    }
  }

  /**
   * 检查两个网格项目是否重叠
   */
  isOverlapping(item1: GridProItem, item2: GridProItem): boolean {
    return !(
      item1.x >= item2.x + item2.w ||
      item1.x + item1.w <= item2.x ||
      item1.y >= item2.y + item2.h ||
      item1.y + item1.h <= item2.y
    )
  }

  /**
   * 获取指定位置的所有碰撞项目
   */
  getCollisions(testItem: GridProItem, allItems: GridProItem[]): string[] {
    return allItems
      .filter(item => item.id !== testItem.id && this.isOverlapping(testItem, item))
      .map(item => item.id)
  }

  /**
   * 找到可用的网格位置
   */
  findFreePosition(
    itemWidth: number, 
    itemHeight: number, 
    existingItems: GridProItem[],
    preferredX = 0,
    preferredY = 0
  ): { x: number; y: number } {
    // 首先尝试首选位置
    const testItem: GridProItem = {
      id: 'test',
      x: preferredX,
      y: preferredY,
      w: itemWidth,
      h: itemHeight
    }

    if (this.getCollisions(testItem, existingItems).length === 0) {
      return { x: preferredX, y: preferredY }
    }

    // 从首选位置开始搜索
    for (let y = preferredY; y < this.config.maxRows; y++) {
      for (let x = 0; x <= this.config.columns - itemWidth; x++) {
        testItem.x = x
        testItem.y = y

        if (this.getCollisions(testItem, existingItems).length === 0) {
          return { x, y }
        }
      }
    }

    // 如果找不到位置，放在最底部
    const maxY = Math.max(0, ...existingItems.map(item => item.y + item.h))
    return { x: 0, y: maxY }
  }
}

/**
 * 碰撞检测工具类
 */
export class CollisionDetector {
  private spatialIndex: Map<string, Set<string>> = new Map()
  private cellSize = 100

  /**
   * 构建空间索引
   */
  buildSpatialIndex(items: GridProItem[], calculator: GridCalculator): void {
    this.spatialIndex.clear()

    items.forEach(item => {
      const bounds = calculator.getItemBounds(item)
      const cells = this.getCells(bounds)
      
      cells.forEach(cell => {
        if (!this.spatialIndex.has(cell)) {
          this.spatialIndex.set(cell, new Set())
        }
        this.spatialIndex.get(cell)!.add(item.id)
      })
    })
  }

  /**
   * 获取矩形覆盖的网格单元
   */
  private getCells(bounds: Rectangle): string[] {
    const cells: string[] = []
    const startX = Math.floor(bounds.x / this.cellSize)
    const endX = Math.floor((bounds.x + bounds.width) / this.cellSize)
    const startY = Math.floor(bounds.y / this.cellSize)
    const endY = Math.floor((bounds.y + bounds.height) / this.cellSize)

    for (let x = startX; x <= endX; x++) {
      for (let y = startY; y <= endY; y++) {
        cells.push(`${x},${y}`)
      }
    }

    return cells
  }

  /**
   * 快速碰撞检测
   */
  detectCollisions(bounds: Rectangle, excludeId?: string): string[] {
    const cells = this.getCells(bounds)
    const candidates = new Set<string>()

    cells.forEach(cell => {
      const items = this.spatialIndex.get(cell)
      if (items) {
        items.forEach(itemId => {
          if (itemId !== excludeId) {
            candidates.add(itemId)
          }
        })
      }
    })

    return Array.from(candidates)
  }
}

/**
 * 布局压缩算法
 */
export class LayoutCompactor {
  /**
   * 垂直压缩布局
   */
  static compactVertically(items: GridProItem[]): GridProItem[] {
    const sortedItems = [...items].sort((a, b) => a.y - b.y || a.x - b.x)
    const compactedItems: GridProItem[] = []

    sortedItems.forEach(item => {
      const compactedItem = { ...item }
      
      // 找到最高可放置位置
      let targetY = 0
      let collision = true

      while (collision) {
        compactedItem.y = targetY
        collision = compactedItems.some(existingItem => 
          this.isItemOverlapping(compactedItem, existingItem)
        )
        
        if (collision) {
          targetY++
        }
      }

      compactedItems.push(compactedItem)
    })

    return compactedItems
  }

  /**
   * 水平压缩布局
   */
  static compactHorizontally(items: GridProItem[], columns: number): GridProItem[] {
    const sortedItems = [...items].sort((a, b) => a.x - b.x || a.y - b.y)
    const compactedItems: GridProItem[] = []

    sortedItems.forEach(item => {
      const compactedItem = { ...item }
      
      // 找到最左可放置位置
      let targetX = 0
      let collision = true

      while (collision && targetX + item.w <= columns) {
        compactedItem.x = targetX
        collision = compactedItems.some(existingItem => 
          this.isItemOverlapping(compactedItem, existingItem)
        )
        
        if (collision) {
          targetX++
        }
      }

      compactedItems.push(compactedItem)
    })

    return compactedItems
  }

  /**
   * 检查两个项目是否重叠
   */
  private static isItemOverlapping(item1: GridProItem, item2: GridProItem): boolean {
    return !(
      item1.x >= item2.x + item2.w ||
      item1.x + item1.w <= item2.x ||
      item1.y >= item2.y + item2.h ||
      item1.y + item1.h <= item2.y
    )
  }
}

/**
 * 自动布局算法
 */
export class AutoLayoutEngine {
  private calculator: GridCalculator
  private compactor: LayoutCompactor

  constructor(calculator: GridCalculator) {
    this.calculator = calculator
    this.compactor = new LayoutCompactor()
  }

  /**
   * 自动排列项目
   */
  autoArrange(items: GridProItem[], mode: 'rows' | 'columns' | 'compact' = 'compact'): GridProItem[] {
    switch (mode) {
      case 'rows':
        return this.arrangeInRows(items)
      case 'columns':
        return this.arrangeInColumns(items)
      case 'compact':
        return LayoutCompactor.compactVertically(items)
      default:
        return items
    }
  }

  /**
   * 按行排列
   */
  private arrangeInRows(items: GridProItem[]): GridProItem[] {
    const arranged: GridProItem[] = []
    let currentX = 0
    let currentY = 0
    let maxHeightInRow = 0

    items.forEach(item => {
      const arrangedItem = { ...item }

      // 检查是否需要换行
      if (currentX + item.w > this.calculator.config.columns) {
        currentX = 0
        currentY += maxHeightInRow
        maxHeightInRow = 0
      }

      arrangedItem.x = currentX
      arrangedItem.y = currentY
      maxHeightInRow = Math.max(maxHeightInRow, item.h)
      currentX += item.w

      arranged.push(arrangedItem)
    })

    return arranged
  }

  /**
   * 按列排列
   */
  private arrangeInColumns(items: GridProItem[]): GridProItem[] {
    const arranged: GridProItem[] = []
    const columnHeights: number[] = new Array(this.calculator.config.columns).fill(0)

    items.forEach(item => {
      const arrangedItem = { ...item }

      // 找到最低的列
      let minHeight = Math.min(...columnHeights)
      let targetColumn = columnHeights.indexOf(minHeight)

      // 确保项目能放入该列
      if (targetColumn + item.w > this.calculator.config.columns) {
        targetColumn = this.calculator.config.columns - item.w
      }

      arrangedItem.x = targetColumn
      arrangedItem.y = columnHeights[targetColumn]

      // 更新列高度
      for (let i = targetColumn; i < targetColumn + item.w; i++) {
        columnHeights[i] = arrangedItem.y + item.h
      }

      arranged.push(arrangedItem)
    })

    return arranged
  }

  /**
   * 优化布局性能
   */
  optimizeLayout(items: GridProItem[]): GridProItem[] {
    // 移除空白行
    const nonEmptyRows = new Set(items.map(item => 
      Array.from({ length: item.h }, (_, i) => item.y + i)
    ).flat())

    const sortedNonEmptyRows = Array.from(nonEmptyRows).sort((a, b) => a - b)
    const rowMapping = new Map(sortedNonEmptyRows.map((row, index) => [row, index]))

    return items.map(item => ({
      ...item,
      y: rowMapping.get(item.y) || item.y
    }))
  }
}