/**
 * GridPro 数据适配器
 * 负责 BaseCanvasItem 与 GridProItem 之间的数据转换
 */

import type { BaseCanvasItem } from '../../../types/core'
import type { GridProItem, GridProConfig } from '../types/gridpro'
import { GridCalculator } from '../utils/gridAlgorithms'

export interface ConversionResult<T> {
  success: boolean
  data: T
  errors: string[]
  warnings: string[]
}

export interface BatchConversionResult<T> {
  success: boolean
  data: T[]
  errors: string[]
  warnings: string[]
  successCount: number
  failureCount: number
}

/**
 * GridPro 数据适配器类
 */
export class GridProAdapter {
  private calculator: GridCalculator
  private config: GridProConfig

  constructor(config: GridProConfig) {
    this.config = config
    this.calculator = new GridCalculator(config)
  }

  /**
   * 更新配置
   */
  updateConfig(config: GridProConfig): void {
    this.config = config
    this.calculator.updateConfig(config)
  }

  /**
   * 将 BaseCanvasItem 转换为 GridProItem
   */
  toGridProItem(canvasItem: BaseCanvasItem): ConversionResult<GridProItem> {
    const errors: string[] = []
    const warnings: string[] = []

    try {
      // 验证必要字段
      if (!canvasItem.id) {
        errors.push('Missing required field: id')
      }

      if (!canvasItem.position) {
        errors.push('Missing required field: position')
      }

      if (!canvasItem.size) {
        errors.push('Missing required field: size')
      }

      if (errors.length > 0) {
        return {
          success: false,
          data: {} as GridProItem,
          errors,
          warnings
        }
      }

      // 从渲染器数据中获取网格信息，如果没有则计算
      let gridPosition = { x: 0, y: 0 }
      let gridSize = { w: 1, h: 1 }

      if (canvasItem.rendererData?.grid) {
        gridPosition = {
          x: canvasItem.rendererData.grid.x || 0,
          y: canvasItem.rendererData.grid.y || 0
        }
        gridSize = {
          w: canvasItem.rendererData.grid.w || 1,
          h: canvasItem.rendererData.grid.h || 1
        }
      } else {
        // 从像素位置转换为网格位置
        gridPosition = this.calculator.pixelToGrid(
          canvasItem.position.x,
          canvasItem.position.y
        )

        // 从像素大小转换为网格大小
        const gridInfo = this.calculator.calculateGrid()
        gridSize = {
          w: Math.max(1, Math.round(canvasItem.size.width / gridInfo.cellWidth)),
          h: Math.max(1, Math.round(canvasItem.size.height / gridInfo.cellHeight))
        }

        warnings.push('Grid data not found in rendererData, calculated from pixel values')
      }

      // 处理约束条件
      const constraints = canvasItem.constraints || {}
      const gridInfo = this.calculator.calculateGrid()

      const minW = constraints.minWidth ? Math.max(1, Math.round(constraints.minWidth / gridInfo.cellWidth)) : 1
      const minH = constraints.minHeight ? Math.max(1, Math.round(constraints.minHeight / gridInfo.cellHeight)) : 1
      const maxW = constraints.maxWidth ? Math.round(constraints.maxWidth / gridInfo.cellWidth) : undefined
      const maxH = constraints.maxHeight ? Math.round(constraints.maxHeight / gridInfo.cellHeight) : undefined

      // 创建 GridProItem
      const gridProItem: GridProItem = {
        id: canvasItem.id,
        x: Math.max(0, gridPosition.x),
        y: Math.max(0, gridPosition.y),
        w: Math.max(minW, gridSize.w),
        h: Math.max(minH, gridSize.h),
        minW,
        minH,
        maxW,
        maxH,
        static: canvasItem.locked || false,
        isDraggable: !canvasItem.locked,
        isResizable: !canvasItem.locked,
        data: canvasItem
      }

      // 验证网格约束
      if (gridProItem.x + gridProItem.w > this.config.columns) {
        warnings.push(`Item width exceeds grid columns, adjusting from ${gridProItem.w} to ${this.config.columns - gridProItem.x}`)
        gridProItem.w = Math.max(1, this.config.columns - gridProItem.x)
      }

      if (gridProItem.y >= this.config.maxRows) {
        warnings.push(`Item Y position exceeds max rows, adjusting from ${gridProItem.y} to ${this.config.maxRows - 1}`)
        gridProItem.y = Math.max(0, this.config.maxRows - 1)
      }

      return {
        success: true,
        data: gridProItem,
        errors,
        warnings
      }
    } catch (error) {
      errors.push(`Conversion error: ${error.message}`)
      return {
        success: false,
        data: {} as GridProItem,
        errors,
        warnings
      }
    }
  }

  /**
   * 将 GridProItem 转换为 BaseCanvasItem
   */
  toBaseCanvasItem(gridProItem: GridProItem): ConversionResult<BaseCanvasItem> {
    const errors: string[] = []
    const warnings: string[] = []

    try {
      // 验证必要字段
      if (!gridProItem.id) {
        errors.push('Missing required field: id')
      }

      if (typeof gridProItem.x !== 'number' || typeof gridProItem.y !== 'number') {
        errors.push('Invalid grid position')
      }

      if (typeof gridProItem.w !== 'number' || typeof gridProItem.h !== 'number') {
        errors.push('Invalid grid size')
      }

      if (errors.length > 0) {
        return {
          success: false,
          data: {} as BaseCanvasItem,
          errors,
          warnings
        }
      }

      // 如果有原始数据，使用它作为基础
      let baseItem: BaseCanvasItem
      
      if (gridProItem.data && typeof gridProItem.data === 'object' && 'id' in gridProItem.data) {
        baseItem = { ...(gridProItem.data as BaseCanvasItem) }
      } else {
        // 创建默认的 BaseCanvasItem
        baseItem = {
          id: gridProItem.id,
          type: 'component',
          cardData: {
            cardId: 'default',
            title: `Item ${gridProItem.id}`,
            config: {},
            dataConfig: {},
            styleConfig: {}
          },
          position: { x: 0, y: 0 },
          size: { width: 100, height: 100 },
          constraints: {},
          zIndex: 1,
          locked: false,
          visible: true,
          metadata: {
            createdAt: Date.now(),
            updatedAt: Date.now(),
            version: '1.0.0'
          }
        }
        warnings.push('Created default BaseCanvasItem structure')
      }

      // 计算像素位置和大小
      const pixelPosition = this.calculator.gridToPixel(gridProItem.x, gridProItem.y)
      const gridInfo = this.calculator.calculateGrid()
      const pixelSize = {
        width: gridProItem.w * gridInfo.cellWidth - this.config.gap,
        height: gridProItem.h * gridInfo.cellHeight - this.config.gap
      }

      // 更新位置和大小
      baseItem.position = pixelPosition
      baseItem.size = pixelSize

      // 更新约束条件
      if (gridProItem.minW || gridProItem.minH || gridProItem.maxW || gridProItem.maxH) {
        baseItem.constraints = {
          minWidth: gridProItem.minW ? gridProItem.minW * gridInfo.cellWidth : undefined,
          minHeight: gridProItem.minH ? gridProItem.minH * gridInfo.cellHeight : undefined,
          maxWidth: gridProItem.maxW ? gridProItem.maxW * gridInfo.cellWidth : undefined,
          maxHeight: gridProItem.maxH ? gridProItem.maxH * gridInfo.cellHeight : undefined
        }
      }

      // 更新锁定状态
      baseItem.locked = gridProItem.static || false

      // 保存网格数据到渲染器数据中
      baseItem.rendererData = {
        ...baseItem.rendererData,
        grid: {
          x: gridProItem.x,
          y: gridProItem.y,
          w: gridProItem.w,
          h: gridProItem.h
        }
      }

      // 更新元数据
      if (baseItem.metadata) {
        baseItem.metadata.updatedAt = Date.now()
      }

      return {
        success: true,
        data: baseItem,
        errors,
        warnings
      }
    } catch (error) {
      errors.push(`Conversion error: ${error.message}`)
      return {
        success: false,
        data: {} as BaseCanvasItem,
        errors,
        warnings
      }
    }
  }

  /**
   * 批量转换 BaseCanvasItem 到 GridProItem
   */
  batchToGridPro(canvasItems: BaseCanvasItem[]): BatchConversionResult<GridProItem> {
    const results: GridProItem[] = []
    const allErrors: string[] = []
    const allWarnings: string[] = []
    let successCount = 0
    let failureCount = 0

    canvasItems.forEach((item, index) => {
      const result = this.toGridProItem(item)
      
      if (result.success) {
        results.push(result.data)
        successCount++
      } else {
        failureCount++
      }

      // 添加索引信息到错误和警告
      result.errors.forEach(error => {
        allErrors.push(`Item ${index} (${item.id}): ${error}`)
      })
      
      result.warnings.forEach(warning => {
        allWarnings.push(`Item ${index} (${item.id}): ${warning}`)
      })
    })

    return {
      success: failureCount === 0,
      data: results,
      errors: allErrors,
      warnings: allWarnings,
      successCount,
      failureCount
    }
  }

  /**
   * 批量转换 GridProItem 到 BaseCanvasItem
   */
  batchToBaseCanvas(gridProItems: GridProItem[]): BatchConversionResult<BaseCanvasItem> {
    const results: BaseCanvasItem[] = []
    const allErrors: string[] = []
    const allWarnings: string[] = []
    let successCount = 0
    let failureCount = 0

    gridProItems.forEach((item, index) => {
      const result = this.toBaseCanvasItem(item)
      
      if (result.success) {
        results.push(result.data)
        successCount++
      } else {
        failureCount++
      }

      // 添加索引信息到错误和警告
      result.errors.forEach(error => {
        allErrors.push(`Item ${index} (${item.id}): ${error}`)
      })
      
      result.warnings.forEach(warning => {
        allWarnings.push(`Item ${index} (${item.id}): ${warning}`)
      })
    })

    return {
      success: failureCount === 0,
      data: results,
      errors: allErrors,
      warnings: allWarnings,
      successCount,
      failureCount
    }
  }

  /**
   * 验证 GridProItem 的有效性
   */
  validateGridProItem(item: GridProItem): ConversionResult<boolean> {
    const errors: string[] = []
    const warnings: string[] = []

    // 必要字段检查
    if (!item.id) errors.push('Missing id')
    if (typeof item.x !== 'number' || item.x < 0) errors.push('Invalid x position')
    if (typeof item.y !== 'number' || item.y < 0) errors.push('Invalid y position')
    if (typeof item.w !== 'number' || item.w < 1) errors.push('Invalid width')
    if (typeof item.h !== 'number' || item.h < 1) errors.push('Invalid height')

    // 边界检查
    if (item.x + item.w > this.config.columns) {
      errors.push(`Item exceeds grid width: ${item.x + item.w} > ${this.config.columns}`)
    }

    if (item.y + item.h > this.config.maxRows) {
      warnings.push(`Item exceeds max rows: ${item.y + item.h} > ${this.config.maxRows}`)
    }

    // 约束检查
    if (item.minW && item.w < item.minW) {
      errors.push(`Width ${item.w} is less than minimum ${item.minW}`)
    }

    if (item.minH && item.h < item.minH) {
      errors.push(`Height ${item.h} is less than minimum ${item.minH}`)
    }

    if (item.maxW && item.w > item.maxW) {
      errors.push(`Width ${item.w} exceeds maximum ${item.maxW}`)
    }

    if (item.maxH && item.h > item.maxH) {
      errors.push(`Height ${item.h} exceeds maximum ${item.maxH}`)
    }

    return {
      success: errors.length === 0,
      data: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * 修复无效的 GridProItem
   */
  fixGridProItem(item: GridProItem): ConversionResult<GridProItem> {
    const errors: string[] = []
    const warnings: string[] = []
    const fixedItem = { ...item }

    try {
      // 修复位置
      if (fixedItem.x < 0) {
        warnings.push(`Fixed negative x position: ${fixedItem.x} -> 0`)
        fixedItem.x = 0
      }

      if (fixedItem.y < 0) {
        warnings.push(`Fixed negative y position: ${fixedItem.y} -> 0`)
        fixedItem.y = 0
      }

      // 修复大小
      if (fixedItem.w < 1) {
        warnings.push(`Fixed invalid width: ${fixedItem.w} -> 1`)
        fixedItem.w = 1
      }

      if (fixedItem.h < 1) {
        warnings.push(`Fixed invalid height: ${fixedItem.h} -> 1`)
        fixedItem.h = 1
      }

      // 修复边界溢出
      if (fixedItem.x + fixedItem.w > this.config.columns) {
        const newWidth = this.config.columns - fixedItem.x
        warnings.push(`Fixed width overflow: ${fixedItem.w} -> ${newWidth}`)
        fixedItem.w = Math.max(1, newWidth)
      }

      // 应用约束
      if (fixedItem.minW && fixedItem.w < fixedItem.minW) {
        warnings.push(`Applied minimum width constraint: ${fixedItem.w} -> ${fixedItem.minW}`)
        fixedItem.w = fixedItem.minW
      }

      if (fixedItem.minH && fixedItem.h < fixedItem.minH) {
        warnings.push(`Applied minimum height constraint: ${fixedItem.h} -> ${fixedItem.minH}`)
        fixedItem.h = fixedItem.minH
      }

      if (fixedItem.maxW && fixedItem.w > fixedItem.maxW) {
        warnings.push(`Applied maximum width constraint: ${fixedItem.w} -> ${fixedItem.maxW}`)
        fixedItem.w = fixedItem.maxW
      }

      if (fixedItem.maxH && fixedItem.h > fixedItem.maxH) {
        warnings.push(`Applied maximum height constraint: ${fixedItem.h} -> ${fixedItem.maxH}`)
        fixedItem.h = fixedItem.maxH
      }

      return {
        success: true,
        data: fixedItem,
        errors,
        warnings
      }
    } catch (error) {
      errors.push(`Fix error: ${error.message}`)
      return {
        success: false,
        data: item,
        errors,
        warnings
      }
    }
  }

  /**
   * 获取适配器统计信息
   */
  getStats() {
    return {
      config: this.config,
      gridInfo: this.calculator.calculateGrid()
    }
  }
}