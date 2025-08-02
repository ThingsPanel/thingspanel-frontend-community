/**
 * DraggableResizableGrid 栅格计算工具函数
 */

import type {
  GridItem,
  GridConfig,
  GridPosition,
  GridSize,
  GridArea,
  PixelPosition,
  PixelSize,
  CollisionResult
} from './types'

/**
 * 栅格坐标转像素位置
 * @param gridPos 栅格位置 (1-based)
 * @param cellSize 单元格大小 (px)
 * @param gap 间距 (px)
 * @returns 像素位置
 */
export function gridToPixel(gridPos: number, cellSize: number, gap: number): number {
  return (gridPos - 1) * (cellSize + gap)
}

/**
 * 像素位置转栅格坐标
 * @param pixel 像素位置
 * @param cellSize 单元格大小 (px)
 * @param gap 间距 (px)
 * @returns 栅格坐标 (1-based)
 */
export function pixelToGrid(pixel: number, cellSize: number, gap: number): number {
  return Math.max(1, Math.round(pixel / (cellSize + gap)) + 1)
}

/**
 * 计算列宽
 * @param config 网格配置
 * @param containerWidth 容器宽度
 * @returns 列宽 (px)
 */
export function calculateColWidth(config: GridConfig, containerWidth: number): number {
  const totalGap = (config.columns - 1) * config.gap
  return (containerWidth - totalGap) / config.columns
}

/**
 * 生成CSS grid-area值
 * @param item 网格项
 * @returns CSS grid-area字符串
 */
export function getGridArea(item: GridItem): string {
  const rowStart = item.gridRow
  const colStart = item.gridCol
  const rowEnd = item.gridRow + item.gridRowSpan
  const colEnd = item.gridCol + item.gridColSpan

  return `${rowStart} / ${colStart} / ${rowEnd} / ${colEnd}`
}

/**
 * 解析grid-area为网格区域对象
 * @param gridArea CSS grid-area字符串
 * @returns 网格区域对象
 */
export function parseGridArea(gridArea: string): GridArea {
  const parts = gridArea.split(' / ').map(part => parseInt(part.trim()))
  return {
    rowStart: parts[0],
    colStart: parts[1],
    rowEnd: parts[2],
    colEnd: parts[3]
  }
}

/**
 * 网格项转网格区域
 * @param item 网格项
 * @returns 网格区域
 */
export function itemToGridArea(item: GridItem): GridArea {
  return {
    rowStart: item.gridRow,
    colStart: item.gridCol,
    rowEnd: item.gridRow + item.gridRowSpan,
    colEnd: item.gridCol + item.gridColSpan
  }
}

/**
 * 网格区域转网格项位置和尺寸
 * @param area 网格区域
 * @returns 位置和尺寸
 */
export function gridAreaToItem(area: GridArea): { position: GridPosition; size: GridSize } {
  return {
    position: {
      col: area.colStart,
      row: area.rowStart
    },
    size: {
      colSpan: area.colEnd - area.colStart,
      rowSpan: area.rowEnd - area.rowStart
    }
  }
}

/**
 * 验证网格位置是否有效
 * @param position 位置
 * @param size 尺寸
 * @param config 网格配置
 * @returns 是否有效
 */
export function validateGridPosition(position: GridPosition, size: GridSize, config: GridConfig): boolean {
  // 检查是否超出边界
  if (position.col < 1 || position.row < 1) {
    return false
  }

  if (position.col + size.colSpan - 1 > config.columns) {
    return false
  }

  if (config.maxRows && position.row + size.rowSpan - 1 > config.maxRows) {
    return false
  }

  return true
}

/**
 * 检查两个网格项是否重叠
 * @param item1 网格项1
 * @param item2 网格项2
 * @returns 是否重叠
 */
export function isItemsOverlapping(item1: GridItem, item2: GridItem): boolean {
  const area1 = itemToGridArea(item1)
  const area2 = itemToGridArea(item2)

  return !(
    area1.colEnd <= area2.colStart ||
    area1.colStart >= area2.colEnd ||
    area1.rowEnd <= area2.rowStart ||
    area1.rowStart >= area2.rowEnd
  )
}

/**
 * 检查网格项与其他项的碰撞
 * @param item 要检查的网格项
 * @param allItems 所有网格项
 * @returns 碰撞检测结果
 */
export function checkCollisions(item: GridItem, allItems: GridItem[]): CollisionResult {
  const collisions = allItems.filter(otherItem => otherItem.id !== item.id && isItemsOverlapping(item, otherItem))

  return {
    hasCollision: collisions.length > 0,
    collisions
  }
}

/**
 * 寻找网格项的有效位置
 * @param item 网格项
 * @param allItems 所有网格项
 * @param config 网格配置
 * @returns 有效位置，如果没有找到返回null
 */
export function findValidPosition(item: GridItem, allItems: GridItem[], config: GridConfig): GridPosition | null {
  const size: GridSize = {
    colSpan: item.gridColSpan,
    rowSpan: item.gridRowSpan
  }

  // 搜索范围
  const maxRows = config.maxRows || 20

  for (let row = 1; row <= maxRows; row++) {
    for (let col = 1; col <= config.columns; col++) {
      const position: GridPosition = { col, row }

      // 检查位置是否有效
      if (!validateGridPosition(position, size, config)) {
        continue
      }

      // 创建临时项目进行碰撞检测
      const tempItem: GridItem = {
        ...item,
        gridCol: col,
        gridRow: row
      }

      const collision = checkCollisions(tempItem, allItems)
      if (!collision.hasCollision) {
        return position
      }
    }
  }

  return null
}

/**
 * 计算网格项的像素位置
 * @param item 网格项
 * @param config 网格配置
 * @param containerWidth 容器宽度
 * @returns 像素位置
 */
export function getItemPixelPosition(item: GridItem, config: GridConfig, containerWidth: number): PixelPosition {
  const colWidth = calculateColWidth(config, containerWidth)

  return {
    x: gridToPixel(item.gridCol, colWidth, config.gap),
    y: gridToPixel(item.gridRow, config.rowHeight, config.gap)
  }
}

/**
 * 计算网格项的像素尺寸
 * @param item 网格项
 * @param config 网格配置
 * @param containerWidth 容器宽度
 * @returns 像素尺寸
 */
export function getItemPixelSize(item: GridItem, config: GridConfig, containerWidth: number): PixelSize {
  const colWidth = calculateColWidth(config, containerWidth)

  return {
    width: item.gridColSpan * colWidth + (item.gridColSpan - 1) * config.gap,
    height: item.gridRowSpan * config.rowHeight + (item.gridRowSpan - 1) * config.gap
  }
}

/**
 * 计算总行数
 * @param items 网格项数组
 * @param minRows 最小行数
 * @returns 总行数
 */
export function calculateTotalRows(items: GridItem[], minRows: number = 3): number {
  if (items.length === 0) {
    return minRows
  }

  const maxRow = Math.max(...items.map(item => item.gridRow + item.gridRowSpan - 1))
  return Math.max(maxRow, minRows)
}

/**
 * 计算容器高度
 * @param totalRows 总行数
 * @param rowHeight 行高
 * @param gap 间距
 * @returns 容器高度 (px)
 */
export function calculateContainerHeight(totalRows: number, rowHeight: number, gap: number): number {
  return totalRows * rowHeight + (totalRows - 1) * gap
}

/**
 * 限制网格项在边界内
 * @param item 网格项
 * @param config 网格配置
 * @returns 调整后的网格项
 */
export function constrainItemToBounds(item: GridItem, config: GridConfig): GridItem {
  const constrainedItem = { ...item }

  // 限制列位置
  constrainedItem.gridCol = Math.max(
    1,
    Math.min(constrainedItem.gridCol, config.columns - constrainedItem.gridColSpan + 1)
  )

  // 限制行位置
  constrainedItem.gridRow = Math.max(1, constrainedItem.gridRow)

  // 限制列跨度
  constrainedItem.gridColSpan = Math.min(constrainedItem.gridColSpan, config.columns - constrainedItem.gridCol + 1)

  return constrainedItem
}

/**
 * 吸附到网格
 * @param pixel 像素位置
 * @param cellSize 单元格大小
 * @param gap 间距
 * @returns 吸附后的像素位置
 */
export function snapToGrid(pixel: number, cellSize: number, gap: number): number {
  const gridPos = pixelToGrid(pixel, cellSize, gap)
  return gridToPixel(gridPos, cellSize, gap)
}

/**
 * 生成网格背景样式
 * @param config 网格配置
 * @param containerWidth 容器宽度
 * @returns CSS样式对象
 */
export function generateGridBackgroundStyle(config: GridConfig, containerWidth: number): Record<string, any> {
  const colWidth = calculateColWidth(config, containerWidth)
  const cellSizeWithGap = colWidth + config.gap
  const rowSizeWithGap = config.rowHeight + config.gap

  return {
    backgroundImage: `
      linear-gradient(to right, #ddd 1px, transparent 1px),
      linear-gradient(to bottom, #ddd 1px, transparent 1px)
    `,
    backgroundSize: `${cellSizeWithGap}px ${rowSizeWithGap}px`,
    backgroundPosition: `-1px -1px`
  }
}

/**
 * 深度克隆网格项
 * @param item 网格项
 * @returns 克隆的网格项
 */
export function cloneGridItem(item: GridItem): GridItem {
  return {
    ...item,
    props: item.props ? { ...item.props } : undefined,
    style: item.style ? { ...item.style } : undefined
  }
}

/**
 * 生成唯一ID
 * @param prefix 前缀
 * @returns 唯一ID
 */
export function generateId(prefix: string = 'grid-item'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}
