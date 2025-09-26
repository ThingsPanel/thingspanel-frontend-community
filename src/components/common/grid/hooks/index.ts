/**
 * Grid Hooks 导出 - V2 模块化版本
 * 包含原有Hook和新的模块化Hook系统
 */

// ==================== 原有Hook导出 ====================
export { useGridLayout } from './useGridLayout'
export { useGridLayoutPlus } from './useGridLayoutPlus' // 保持向后兼容

// ==================== 新模块化Hook导出 ====================
export { useGridCore } from './useGridCore'
export { useGridHistory } from './useGridHistory'
export { useGridPerformance } from './useGridPerformance'
export { useGridResponsive } from './useGridResponsive'
export { useGridLayoutPlusV2 } from './useGridLayoutPlusV2'

// ==================== 类型导出 ====================
export type { UseGridLayoutReturn } from '../types'
export type { UseGridCoreOptions } from './useGridCore'
export type { UseGridHistoryOptions } from './useGridHistory'
export type { UseGridPerformanceOptions, PerformanceMetrics } from './useGridPerformance'
export type { UseGridResponsiveOptions } from './useGridResponsive'
export type { UseGridLayoutPlusV2Options } from './useGridLayoutPlusV2'

// ==================== Hook版本信息 ====================
export const GRID_HOOKS_VERSION = '2.0.0'
export const GRID_HOOKS_INFO = {
  version: GRID_HOOKS_VERSION,
  description: '模块化网格Hook系统',
  hooks: {
    legacy: ['useGridLayout', 'useGridLayoutPlus'],
    v2: ['useGridCore', 'useGridHistory', 'useGridPerformance', 'useGridResponsive'],
    integrated: ['useGridLayoutPlusV2']
  },
  migration: {
    from: 'useGridLayoutPlus',
    to: 'useGridLayoutPlusV2',
    breaking_changes: false,
    benefits: [
      '模块化架构提升可维护性',
      '独立的性能监控系统',
      '完整的历史记录管理',
      '响应式布局支持',
      '更好的错误处理和类型安全'
    ]
  }
}
