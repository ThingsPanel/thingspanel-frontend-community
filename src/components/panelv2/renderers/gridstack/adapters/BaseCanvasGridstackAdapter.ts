/**
 * Base Canvas Gridstack Adapter
 * 基础画布与 Gridstack 数据格式适配器
 * 负责在 BaseCanvasItem 和 Gridstack 格式之间进行转换
 */

import type { BaseCanvasItem } from '../../../types/core'

/**
 * Gridstack 网格项接口
 */
export interface GridstackItem {
  id: string
  x: number
  y: number
  w: number
  h: number
  minW?: number
  minH?: number
  maxW?: number
  maxH?: number
  noResize?: boolean
  noMove?: boolean
  locked?: boolean
  content?: string
  [key: string]: any
}

/**
 * Gridstack 配置选项
 */
export interface GridstackConfig {
  column?: number
  cellHeight?: number | string
  margin?: number
  animate?: boolean
  float?: boolean
  disableDrag?: boolean
  disableResize?: boolean
  acceptWidgets?: boolean
  removable?: boolean
  [key: string]: any
}

/**
 * 基础画布 Gridstack 适配器类
 */
export class BaseCanvasGridstackAdapter {
  /**
   * 将 BaseCanvasItem 数组转换为 Gridstack 格式
   * @param items BaseCanvasItem 数组
   * @returns GridstackItem 数组
   */
  toGridstackFormat(items: BaseCanvasItem[]): GridstackItem[] {
    return items.map(item => this.itemToGridstack(item))
  }

  /**
   * 将 Gridstack 格式转换为 BaseCanvasItem 数组
   * @param gridItems GridstackItem 数组
   * @param originalItems 原始 BaseCanvasItem 数组（用于保留额外数据）
   * @returns BaseCanvasItem 数组
   */
  fromGridstackFormat(gridItems: GridstackItem[], originalItems: BaseCanvasItem[] = []): BaseCanvasItem[] {
    return gridItems.map(gridItem => {
      const originalItem = originalItems.find(item => item.id === gridItem.id)
      return this.gridstackToItem(gridItem, originalItem)
    })
  }

  /**
   * 将单个 BaseCanvasItem 转换为 GridstackItem
   * @param item BaseCanvasItem
   * @returns GridstackItem
   */
  private itemToGridstack(item: BaseCanvasItem): GridstackItem {
    // 从 rendererData 中获取网格信息，如果没有则使用默认值
    const gridData = item.rendererData?.gridstack || {}

    // 计算网格位置和尺寸
    const gridItem: GridstackItem = {
      id: item.id,
      x: gridData.x ?? this.positionToGrid(item.position?.x ?? 0),
      y: gridData.y ?? this.positionToGrid(item.position?.y ?? 0),
      w: gridData.w ?? this.sizeToGrid(item.size?.width ?? 200),
      h: gridData.h ?? this.sizeToGrid(item.size?.height ?? 150),
      content: this.generateItemContent(item)
    }

    // 设置约束条件
    if (item.constraints) {
      if (item.constraints.minWidth) {
        gridItem.minW = this.sizeToGrid(item.constraints.minWidth)
      }
      if (item.constraints.minHeight) {
        gridItem.minH = this.sizeToGrid(item.constraints.minHeight)
      }
      if (item.constraints.maxWidth) {
        gridItem.maxW = this.sizeToGrid(item.constraints.maxWidth)
      }
      if (item.constraints.maxHeight) {
        gridItem.maxH = this.sizeToGrid(item.constraints.maxHeight)
      }
    }

    // 设置锁定状态
    if (item.locked) {
      gridItem.noMove = true
      gridItem.noResize = true
      gridItem.locked = true
    }

    return gridItem
  }

  /**
   * 将 GridstackItem 转换为 BaseCanvasItem
   * @param gridItem GridstackItem
   * @param originalItem 原始 BaseCanvasItem（可选）
   * @returns BaseCanvasItem
   */
  private gridstackToItem(gridItem: GridstackItem, originalItem?: BaseCanvasItem): BaseCanvasItem {
    const baseItem: BaseCanvasItem = {
      id: gridItem.id,
      type: originalItem?.type || 'widget',
      position: {
        x: this.gridToPosition(gridItem.x),
        y: this.gridToPosition(gridItem.y)
      },
      size: {
        width: this.gridToSize(gridItem.w),
        height: this.gridToSize(gridItem.h)
      },
      zIndex: originalItem?.zIndex || 1,
      locked: gridItem.locked || false,
      visible: originalItem?.visible ?? true,

      // 保留原始数据
      data: originalItem?.data || {},
      cardData: originalItem?.cardData,

      // 更新渲染器数据
      rendererData: {
        ...originalItem?.rendererData,
        gridstack: {
          x: gridItem.x,
          y: gridItem.y,
          w: gridItem.w,
          h: gridItem.h,
          minW: gridItem.minW,
          minH: gridItem.minH,
          maxW: gridItem.maxW,
          maxH: gridItem.maxH,
          noMove: gridItem.noMove,
          noResize: gridItem.noResize
        }
      },

      // 保留元数据
      metadata: {
        ...originalItem?.metadata,
        updatedAt: Date.now()
      }
    }

    // 设置约束条件
    if (gridItem.minW || gridItem.minH || gridItem.maxW || gridItem.maxH) {
      baseItem.constraints = {
        minWidth: gridItem.minW ? this.gridToSize(gridItem.minW) : undefined,
        minHeight: gridItem.minH ? this.gridToSize(gridItem.minH) : undefined,
        maxWidth: gridItem.maxW ? this.gridToSize(gridItem.maxW) : undefined,
        maxHeight: gridItem.maxH ? this.gridToSize(gridItem.maxH) : undefined
      }
    }

    return baseItem
  }

  /**
   * 生成网格项的 HTML 内容
   * @param item BaseCanvasItem
   * @returns HTML 字符串
   */
  private generateItemContent(item: BaseCanvasItem): string {
    const title = item.data?.title || item.cardData?.title || item.type || 'Grid Item'
    const content = item.data?.content || item.cardData?.config?.content || `Item ${item.id}`

    return `
      <div class="gridstack-item-wrapper">
        <div class="gridstack-item-header">
          <span class="gridstack-item-title">${this.escapeHtml(title)}</span>
          <div class="gridstack-item-actions">
            <button class="gridstack-btn-edit" title="编辑">
              <i class="icon-edit"></i>
            </button>
            <button class="gridstack-btn-delete" title="删除">
              <i class="icon-delete"></i>
            </button>
          </div>
        </div>
        <div class="gridstack-item-body">
          <div class="gridstack-item-content">${this.escapeHtml(content)}</div>
        </div>
      </div>
    `
  }

  /**
   * 转义 HTML 字符
   * @param text 原始文本
   * @returns 转义后的文本
   */
  private escapeHtml(text: string): string {
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  }

  /**
   * 像素位置转换为网格位置
   * @param position 像素位置
   * @returns 网格位置
   */
  private positionToGrid(position: number): number {
    // 假设每个网格单元为 60px，可以根据实际配置调整
    const cellSize = 60
    return Math.floor(position / cellSize)
  }

  /**
   * 网格位置转换为像素位置
   * @param gridPosition 网格位置
   * @returns 像素位置
   */
  private gridToPosition(gridPosition: number): number {
    const cellSize = 60
    return gridPosition * cellSize
  }

  /**
   * 像素尺寸转换为网格尺寸
   * @param size 像素尺寸
   * @returns 网格尺寸
   */
  private sizeToGrid(size: number): number {
    const cellSize = 60
    return Math.max(1, Math.ceil(size / cellSize))
  }

  /**
   * 网格尺寸转换为像素尺寸
   * @param gridSize 网格尺寸
   * @returns 像素尺寸
   */
  private gridToSize(gridSize: number): number {
    const cellSize = 60
    return gridSize * cellSize
  }

  /**
   * 验证网格项数据
   * @param gridItem GridstackItem
   * @returns 是否有效
   */
  validateGridItem(gridItem: GridstackItem): boolean {
    return (
      typeof gridItem.id === 'string' &&
      typeof gridItem.x === 'number' &&
      typeof gridItem.y === 'number' &&
      typeof gridItem.w === 'number' &&
      typeof gridItem.h === 'number' &&
      gridItem.x >= 0 &&
      gridItem.y >= 0 &&
      gridItem.w > 0 &&
      gridItem.h > 0
    )
  }

  /**
   * 验证画布项数据
   * @param item BaseCanvasItem
   * @returns 是否有效
   */
  validateCanvasItem(item: BaseCanvasItem): boolean {
    return (
      typeof item.id === 'string' &&
      item.id.length > 0 &&
      typeof item.type === 'string' &&
      item.position &&
      typeof item.position.x === 'number' &&
      typeof item.position.y === 'number' &&
      item.size &&
      typeof item.size.width === 'number' &&
      typeof item.size.height === 'number' &&
      item.size.width > 0 &&
      item.size.height > 0
    )
  }

  /**
   * 创建默认的网格项
   * @param id 项目 ID
   * @param x 网格 X 位置
   * @param y 网格 Y 位置
   * @param w 网格宽度
   * @param h 网格高度
   * @returns GridstackItem
   */
  createDefaultGridItem(id: string, x: number = 0, y: number = 0, w: number = 2, h: number = 2): GridstackItem {
    return {
      id,
      x,
      y,
      w,
      h,
      content: this.generateItemContent({
        id,
        type: 'widget',
        position: { x: this.gridToPosition(x), y: this.gridToPosition(y) },
        size: { width: this.gridToSize(w), height: this.gridToSize(h) },
        zIndex: 1,
        locked: false,
        visible: true,
        data: { title: '新组件', content: '这是一个新的网格组件' }
      })
    }
  }

  /**
   * 创建默认的画布项
   * @param id 项目 ID
   * @param type 项目类型
   * @returns BaseCanvasItem
   */
  createDefaultCanvasItem(id: string, type: string = 'widget'): BaseCanvasItem {
    return {
      id,
      type,
      position: { x: 0, y: 0 },
      size: { width: 200, height: 150 },
      zIndex: 1,
      locked: false,
      visible: true,
      data: {
        title: '新组件',
        content: '这是一个新的画布组件'
      },
      metadata: {
        createdAt: Date.now(),
        updatedAt: Date.now(),
        version: '1.0.0'
      }
    }
  }

  /**
   * 获取网格项的边界框
   * @param gridItem GridstackItem
   * @returns 边界框信息
   */
  getGridItemBounds(gridItem: GridstackItem) {
    return {
      left: gridItem.x,
      top: gridItem.y,
      right: gridItem.x + gridItem.w,
      bottom: gridItem.y + gridItem.h,
      width: gridItem.w,
      height: gridItem.h
    }
  }

  /**
   * 检查两个网格项是否重叠
   * @param item1 第一个网格项
   * @param item2 第二个网格项
   * @returns 是否重叠
   */
  isGridItemsOverlapping(item1: GridstackItem, item2: GridstackItem): boolean {
    const bounds1 = this.getGridItemBounds(item1)
    const bounds2 = this.getGridItemBounds(item2)

    return !(
      bounds1.right <= bounds2.left ||
      bounds1.left >= bounds2.right ||
      bounds1.bottom <= bounds2.top ||
      bounds1.top >= bounds2.bottom
    )
  }

  /**
   * 查找可用的网格位置
   * @param existingItems 现有网格项
   * @param width 所需宽度
   * @param height 所需高度
   * @param maxColumns 最大列数
   * @returns 可用位置 { x, y }
   */
  findAvailablePosition(
    existingItems: GridstackItem[],
    width: number = 2,
    height: number = 2,
    maxColumns: number = 12
  ): { x: number; y: number } {
    // 从第一行开始查找
    for (let y = 0; y < 100; y++) {
      // 最多查找100行
      for (let x = 0; x <= maxColumns - width; x++) {
        const testItem: GridstackItem = {
          id: 'test',
          x,
          y,
          w: width,
          h: height
        }

        // 检查是否与现有项重叠
        const hasOverlap = existingItems.some(item => this.isGridItemsOverlapping(testItem, item))

        if (!hasOverlap) {
          return { x, y }
        }
      }
    }

    // 如果找不到位置，返回最底部
    const maxY = Math.max(0, ...existingItems.map(item => item.y + item.h))
    return { x: 0, y: maxY }
  }
}

// 导出默认实例
export default new BaseCanvasGridstackAdapter()
