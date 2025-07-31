/**
 * Base Canvas Kanban Adapter
 * BaseCanvasItem与vue3-grid-layout格式之间的数据适配器（看板布局）
 */

import type { BaseCanvasItem } from '../../../types/core'
import type { GridLayoutItem } from '../../../types/adapters'

export class BaseCanvasKanbanAdapter {
  private readonly GRID_UNIT_SIZE = 100  // 像素到网格单位的转换比例
  private readonly GRID_COLS = 12        // 网格列数
  
  /**
   * 将BaseCanvasItem转换为GridLayoutItem格式
   */
  toGridFormat(items: BaseCanvasItem[]): GridLayoutItem[] {
    return items.map((item, index) => this.convertToGridItem(item, index))
  }

  /**
   * 将GridLayoutItem转换为BaseCanvasItem格式
   */
  fromGridFormat(gridItems: GridLayoutItem[], originalItems: BaseCanvasItem[] = []): BaseCanvasItem[] {
    return gridItems.map((gridItem, index) => {
      // 尝试找到对应的原始项目
      const originalItem = originalItems.find(item => item.id === gridItem.i)
      return this.convertFromGridItem(gridItem, originalItem, index)
    })
  }

  /**
   * 更新BaseCanvasItem中的grid相关数据
   */
  updateItemWithGridData(item: BaseCanvasItem, gridItem: GridLayoutItem): BaseCanvasItem {
    const position = {
      x: gridItem.x * this.GRID_UNIT_SIZE,
      y: gridItem.y * this.GRID_UNIT_SIZE
    }

    const size = {
      width: gridItem.w * this.GRID_UNIT_SIZE,
      height: gridItem.h * this.GRID_UNIT_SIZE
    }

    const constraints = {
      ...item.constraints,
      minWidth: gridItem.minW ? gridItem.minW * this.GRID_UNIT_SIZE : item.constraints.minWidth,
      minHeight: gridItem.minH ? gridItem.minH * this.GRID_UNIT_SIZE : item.constraints.minHeight,
      maxWidth: gridItem.maxW ? gridItem.maxW * this.GRID_UNIT_SIZE : item.constraints.maxWidth,
      maxHeight: gridItem.maxH ? gridItem.maxH * this.GRID_UNIT_SIZE : item.constraints.maxHeight
    }

    return {
      ...item,
      position,
      size,
      constraints,
      locked: gridItem.static || false,
      rendererData: {
        ...item.rendererData,
        grid: {
          x: gridItem.x,
          y: gridItem.y,
          w: gridItem.w,
          h: gridItem.h,
          static: gridItem.static,
          isDraggable: gridItem.isDraggable,
          isResizable: gridItem.isResizable
        }
      },
      metadata: {
        ...item.metadata,
        updatedAt: Date.now()
      }
    }
  }

  /**
   * 计算新项目在网格中的位置
   */
  calculateNewItemPosition(existingItems: GridLayoutItem[], newItemSize: { w: number, h: number }): { x: number, y: number } {
    const { w, h } = newItemSize
    
    // 按行扫描寻找空位
    for (let y = 0; y < 100; y++) {
      for (let x = 0; x <= this.GRID_COLS - w; x++) {
        if (this.isPositionAvailable(existingItems, { x, y, w, h })) {
          return { x, y }
        }
      }
    }
    
    // 如果没有找到合适位置，放在最后
    const maxY = Math.max(0, ...existingItems.map(item => item.y + item.h))
    return { x: 0, y: maxY }
  }

  /**
   * 检查指定位置是否可用
   */
  isPositionAvailable(existingItems: GridLayoutItem[], testItem: { x: number, y: number, w: number, h: number }): boolean {
    return !existingItems.some(item => this.itemsOverlap(item, testItem))
  }

  /**
   * 检查两个网格项目是否重叠
   */
  itemsOverlap(item1: { x: number, y: number, w: number, h: number }, item2: { x: number, y: number, w: number, h: number }): boolean {
    return !(
      item1.x + item1.w <= item2.x ||
      item2.x + item2.w <= item1.x ||
      item1.y + item1.h <= item2.y ||
      item2.y + item2.h <= item1.y
    )
  }

  /**
   * 优化网格布局，消除空白空间
   */
  compactLayout(gridItems: GridLayoutItem[]): GridLayoutItem[] {
    const sortedItems = [...gridItems].sort((a, b) => {
      if (a.y !== b.y) return a.y - b.y
      return a.x - b.x
    })

    const compacted: GridLayoutItem[] = []
    
    sortedItems.forEach(item => {
      if (item.static) {
        compacted.push({ ...item })
        return
      }

      // 为非静态项目寻找最高位置
      let targetY = 0
      let validPosition = false

      while (!validPosition && targetY < 100) {
        const testItem = { ...item, y: targetY }
        if (this.isPositionAvailable(compacted, testItem)) {
          compacted.push(testItem)
          validPosition = true
        } else {
          targetY++
        }
      }

      if (!validPosition) {
        // 如果找不到位置，保持原位
        compacted.push({ ...item })
      }
    })

    return compacted
  }

  /**
   * 从像素尺寸转换为网格尺寸
   */
  pixelToGrid(pixel: number): number {
    return Math.round(pixel / this.GRID_UNIT_SIZE)
  }

  /**
   * 从网格尺寸转换为像素尺寸
   */
  gridToPixel(grid: number): number {
    return grid * this.GRID_UNIT_SIZE
  }

  /**
   * 单个项目转换：BaseCanvasItem -> GridLayoutItem
   */
  private convertToGridItem(item: BaseCanvasItem, index: number): GridLayoutItem {
    // 从渲染器数据中获取网格信息，如果没有则计算
    const gridData = item.rendererData?.grid
    
    const gridItem: GridLayoutItem = {
      i: item.id,
      x: gridData?.x ?? this.pixelToGrid(item.position.x),
      y: gridData?.y ?? this.pixelToGrid(item.position.y),
      w: gridData?.w ?? Math.max(1, this.pixelToGrid(item.size.width)),
      h: gridData?.h ?? Math.max(1, this.pixelToGrid(item.size.height)),
      static: item.locked,
      isDraggable: !item.locked,
      isResizable: !item.locked
    }

    // 添加约束条件
    if (item.constraints.minWidth) {
      gridItem.minW = Math.max(1, this.pixelToGrid(item.constraints.minWidth))
    }
    if (item.constraints.minHeight) {
      gridItem.minH = Math.max(1, this.pixelToGrid(item.constraints.minHeight))
    }
    if (item.constraints.maxWidth) {
      gridItem.maxW = this.pixelToGrid(item.constraints.maxWidth)
    }
    if (item.constraints.maxHeight) {
      gridItem.maxH = this.pixelToGrid(item.constraints.maxHeight)
    }

    return gridItem
  }

  /**
   * 单个项目转换：GridLayoutItem -> BaseCanvasItem
   */
  private convertFromGridItem(gridItem: GridLayoutItem, originalItem?: BaseCanvasItem, index: number = 0): BaseCanvasItem {
    const now = Date.now()
    
    // 如果有原始项目，基于它创建，否则创建新的
    const baseItem: BaseCanvasItem = originalItem || {
      id: gridItem.i,
      type: 'component',
      position: { x: 0, y: 0 },
      size: { width: 100, height: 100 },
      constraints: {},
      zIndex: 0,
      visible: true,
      locked: false,
      cardData: {
        cardId: '',
        config: {}
      },
      rendererData: {},
      metadata: {
        createdAt: now,
        updatedAt: now,
        version: '2.0.0'
      }
    }

    // 更新位置和尺寸
    const position = {
      x: this.gridToPixel(gridItem.x),
      y: this.gridToPixel(gridItem.y)
    }

    const size = {
      width: this.gridToPixel(gridItem.w),
      height: this.gridToPixel(gridItem.h)
    }

    // 更新约束条件
    const constraints = {
      ...baseItem.constraints,
      minWidth: gridItem.minW ? this.gridToPixel(gridItem.minW) : baseItem.constraints.minWidth,
      minHeight: gridItem.minH ? this.gridToPixel(gridItem.minH) : baseItem.constraints.minHeight,
      maxWidth: gridItem.maxW ? this.gridToPixel(gridItem.maxW) : baseItem.constraints.maxWidth,
      maxHeight: gridItem.maxH ? this.gridToPixel(gridItem.maxH) : baseItem.constraints.maxHeight
    }

    return {
      ...baseItem,
      id: gridItem.i,
      position,
      size,
      constraints,
      locked: gridItem.static || false,
      rendererData: {
        ...baseItem.rendererData,
        grid: {
          x: gridItem.x,
          y: gridItem.y,
          w: gridItem.w,
          h: gridItem.h,
          static: gridItem.static,
          isDraggable: gridItem.isDraggable,
          isResizable: gridItem.isResizable
        }
      },
      metadata: {
        ...baseItem.metadata,
        updatedAt: now
      }
    }
  }
}

export default BaseCanvasKanbanAdapter