/**
 * Grid 验证工具函数
 * 专门处理网格项和布局的验证逻辑
 */

import type { GridLayoutPlusItem, LayoutOperationResult } from '../gridLayoutPlusTypes'

/**
 * 验证网格项基础属性
 * 🔥 扩展版本：支持0-99列范围
 */
export function validateGridItem(item: GridLayoutPlusItem, maxCols = 99): LayoutOperationResult<boolean> {
  try {
    // 检查必要字段
    if (!item.i || typeof item.i !== 'string') {
      return {
        success: false,
        error: new Error('Grid item must have a valid string id'),
        message: '网格项必须有有效的字符串ID'
      }
    }

    // 🔥 扩展：检查位置和尺寸 - 支持更大范围
    if (item.x < 0 || item.x >= maxCols) {
      return {
        success: false,
        error: new Error(`Grid X position must be between 0 and ${maxCols - 1}`),
        message: `网格X位置必须在0到${maxCols - 1}之间`
      }
    }

    if (item.y < 0) {
      return {
        success: false,
        error: new Error('Grid Y position must be >= 0'),
        message: '网格Y位置必须大于等于0'
      }
    }

    if (item.w <= 0 || item.w > maxCols) {
      return {
        success: false,
        error: new Error(`Grid width must be between 1 and ${maxCols}`),
        message: `网格宽度必须在1到${maxCols}之间`
      }
    }

    if (item.h <= 0) {
      return {
        success: false,
        error: new Error('Grid height must be > 0'),
        message: '网格高度必须大于0'
      }
    }

    // 🔥 新增：检查是否超出边界
    if (item.x + item.w > maxCols) {
      return {
        success: false,
        error: new Error(`Grid item extends beyond boundary (x:${item.x} + w:${item.w} > maxCols:${maxCols})`),
        message: `网格项超出边界（x:${item.x} + w:${item.w} > 最大列数:${maxCols}）`
      }
    }

    // 检查约束条件
    if (item.minW && item.w < item.minW) {
      return {
        success: false,
        error: new Error('Width is less than minimum'),
        message: '宽度小于最小值'
      }
    }

    if (item.maxW && item.w > item.maxW) {
      return {
        success: false,
        error: new Error('Width exceeds maximum'),
        message: '宽度超过最大值'
      }
    }

    if (item.minH && item.h < item.minH) {
      return {
        success: false,
        error: new Error('Height is less than minimum'),
        message: '高度小于最小值'
      }
    }

    if (item.maxH && item.h > item.maxH) {
      return {
        success: false,
        error: new Error('Height exceeds maximum'),
        message: '高度超过最大值'
      }
    }

    return { success: true, data: true }
  } catch (error) {
    return {
      success: false,
      error: error as Error,
      message: '网格项验证失败'
    }
  }
}

/**
 * 验证布局完整性
 */
export function validateLayout(layout: GridLayoutPlusItem[]): LayoutOperationResult<boolean> {
  try {
    // 检查是否为空布局
    if (!Array.isArray(layout)) {
      return {
        success: false,
        error: new Error('Layout must be an array'),
        message: '布局必须是数组类型'
      }
    }

    if (layout.length === 0) {
      return { success: true, data: true } // 空布局是有效的
    }

    // 检查ID唯一性
    const ids = layout.map(item => item.i)
    const uniqueIds = new Set(ids)
    if (ids.length !== uniqueIds.size) {
      const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index)
      return {
        success: false,
        error: new Error(`Duplicate item IDs found: ${duplicates.join(', ')}`),
        message: `发现重复ID: ${duplicates.join(', ')}`
      }
    }

    // 逐个验证网格项
    for (let i = 0; i < layout.length; i++) {
      const itemValidation = validateGridItem(layout[i])
      if (!itemValidation.success) {
        return {
          success: false,
          error: itemValidation.error,
          message: `第 ${i + 1} 个网格项验证失败: ${itemValidation.message}`
        }
      }
    }

    return { success: true, data: true }
  } catch (error) {
    return {
      success: false,
      error: error as Error,
      message: '布局验证失败'
    }
  }
}

/**
 * 验证网格位置是否有效
 */
export function validateGridPosition(
  x: number,
  y: number,
  w: number,
  h: number,
  cols: number
): LayoutOperationResult<boolean> {
  try {
    // 检查基本范围
    if (x < 0 || y < 0 || w <= 0 || h <= 0) {
      return {
        success: false,
        error: new Error('Invalid position or size'),
        message: '无效的位置或尺寸'
      }
    }

    // 检查是否超出列数
    if (x + w > cols) {
      return {
        success: false,
        error: new Error(`Item width exceeds column limit: ${x + w} > ${cols}`),
        message: `项目宽度超出列数限制: ${x + w} > ${cols}`
      }
    }

    return { success: true, data: true }
  } catch (error) {
    return {
      success: false,
      error: error as Error,
      message: '网格位置验证失败'
    }
  }
}

/**
 * 检查两个网格项是否重叠
 */
export function checkItemsOverlap(item1: GridLayoutPlusItem, item2: GridLayoutPlusItem): boolean {
  try {
    return !(
      item1.x + item1.w <= item2.x ||
      item1.x >= item2.x + item2.w ||
      item1.y + item1.h <= item2.y ||
      item1.y >= item2.y + item2.h
    )
  } catch (error) {
    console.warn('Failed to check items overlap:', error)
    return false
  }
}

/**
 * 检查布局中是否有重叠的项目
 */
export function validateNoOverlaps(layout: GridLayoutPlusItem[]): LayoutOperationResult<boolean> {
  try {
    for (let i = 0; i < layout.length; i++) {
      for (let j = i + 1; j < layout.length; j++) {
        if (checkItemsOverlap(layout[i], layout[j])) {
          return {
            success: false,
            error: new Error(`Items overlap: ${layout[i].i} and ${layout[j].i}`),
            message: `项目重叠: ${layout[i].i} 和 ${layout[j].i}`
          }
        }
      }
    }

    return { success: true, data: true }
  } catch (error) {
    return {
      success: false,
      error: error as Error,
      message: '重叠检查失败'
    }
  }
}

/**
 * 验证响应式配置
 */
export function validateResponsiveConfig(
  breakpoints: Record<string, number>,
  cols: Record<string, number>
): LayoutOperationResult<boolean> {
  try {
    const breakpointNames = Object.keys(breakpoints)
    const colNames = Object.keys(cols)

    // 检查断点和列配置是否匹配
    for (const bp of breakpointNames) {
      if (!(bp in cols)) {
        return {
          success: false,
          error: new Error(`Missing column config for breakpoint: ${bp}`),
          message: `断点 ${bp} 缺少列配置`
        }
      }
    }

    // 检查断点值是否有效
    for (const [bp, width] of Object.entries(breakpoints)) {
      if (width < 0) {
        return {
          success: false,
          error: new Error(`Invalid breakpoint width: ${bp} = ${width}`),
          message: `无效的断点宽度: ${bp} = ${width}`
        }
      }
    }

    // 检查列数是否有效
    for (const [bp, colCount] of Object.entries(cols)) {
      if (colCount <= 0) {
        return {
          success: false,
          error: new Error(`Invalid column count: ${bp} = ${colCount}`),
          message: `无效的列数: ${bp} = ${colCount}`
        }
      }
    }

    return { success: true, data: true }
  } catch (error) {
    return {
      success: false,
      error: error as Error,
      message: '响应式配置验证失败'
    }
  }
}

// 🔥 新增：扩展网格工具函数

/**
 * 验证扩展网格配置（支持0-99列）
 */
export function validateExtendedGridConfig(colNum: number): LayoutOperationResult<boolean> {
  try {
    if (colNum < 1 || colNum > 99) {
      return {
        success: false,
        error: new Error(`Column count must be between 1 and 99, got ${colNum}`),
        message: `列数必须在1到99之间，当前为${colNum}`
      }
    }

    return { success: true, data: true }
  } catch (error) {
    return {
      success: false,
      error: error as Error,
      message: '扩展网格配置验证失败'
    }
  }
}

/**
 * 验证大网格布局性能
 */
export function validateLargeGridPerformance(
  layout: GridLayoutPlusItem[],
  colNum: number
): LayoutOperationResult<{ warning?: string; recommendation?: string }> {
  try {
    const itemCount = layout.length
    const gridSize = colNum * Math.max(...layout.map(item => item.y + item.h), 10) // 估算行数

    // 性能警告阈值
    const warnings = []
    const recommendations = []

    if (colNum > 50 && itemCount > 50) {
      warnings.push('大网格（>50列）配合大量组件（>50个）可能影响性能')
      recommendations.push('考虑使用虚拟滚动或分页加载')
    }

    if (gridSize > 5000) {
      warnings.push('网格总单元格数量过大，可能导致渲染缓慢')
      recommendations.push('优化网格密度或减少组件数量')
    }

    if (colNum > 80) {
      warnings.push('超过80列的网格在小屏幕上可能难以操作')
      recommendations.push('启用响应式配置，在小屏幕上减少列数')
    }

    return {
      success: true,
      data: {
        warning: warnings.length > 0 ? warnings.join('; ') : undefined,
        recommendation: recommendations.length > 0 ? recommendations.join('; ') : undefined
      }
    }
  } catch (error) {
    return {
      success: false,
      error: error as Error,
      message: '大网格性能验证失败'
    }
  }
}

/**
 * 自动优化网格项尺寸（适配大网格）
 */
export function optimizeItemForLargeGrid(
  item: GridLayoutPlusItem,
  targetCols: number,
  sourceCols = 12
): GridLayoutPlusItem {
  try {
    if (targetCols === sourceCols) return { ...item }

    const ratio = targetCols / sourceCols

    // 按比例调整位置和尺寸
    const optimized = {
      ...item,
      x: Math.floor(item.x * ratio),
      w: Math.max(1, Math.floor(item.w * ratio))
    }

    // 确保不超出边界
    if (optimized.x + optimized.w > targetCols) {
      optimized.x = Math.max(0, targetCols - optimized.w)
    }

    return optimized
  } catch (error) {
    console.warn('Failed to optimize item for large grid:', error)
    return { ...item }
  }
}
