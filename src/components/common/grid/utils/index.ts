/**
 * Grid 工具函数统一导出
 * 模块化重构后的工具函数集合
 */

// ==================== 验证相关工具 ====================
export {
  validateGridItem,
  validateLayout,
  validateGridPosition,
  checkItemsOverlap,
  validateNoOverlaps,
  validateResponsiveConfig,
  // 🔥 新增：扩展网格验证工具
  validateExtendedGridConfig,
  validateLargeGridPerformance,
  optimizeItemForLargeGrid
} from './validation'

// ==================== 布局算法相关工具 ====================
export {
  findAvailablePosition,
  findOptimalPosition,
  isPositionAvailable,
  compactLayout,
  sortLayout,
  getLayoutBounds,
  getOverlapArea,
  moveItemWithCollisionHandling
} from './layout-algorithm'

// ==================== 性能相关工具 ====================
export {
  debounce,
  throttle,
  optimizeLayoutPerformance,
  PerformanceMonitor,
  performanceMonitor,
  getMemoryUsage,
  CacheManager,
  AsyncQueue
} from './performance'

// ==================== 响应式相关工具 ====================
export {
  createResponsiveLayout,
  transformLayoutForBreakpoint,
  mergeResponsiveLayouts,
  validateResponsiveLayout,
  getBreakpointInfo,
  calculateBreakpointTransition,
  adaptItemSizeForBreakpoint,
  ResponsiveMediaQuery
} from './responsive'

// ==================== 通用工具 ====================
export {
  generateId,
  cloneLayout,
  cloneGridItem,
  getLayoutStats,
  filterLayout,
  searchLayout,
  itemToGridArea,
  calculateGridUtilization,
  calculateTotalRows,
  getGridStatistics,
  uniqueArray,
  parseNumber,
  clamp,
  formatFileSize,
  formatDuration
} from './common'

// ==================== 工具函数版本信息 ====================
export const GRID_UTILS_VERSION = '2.1.0' // 🔥 升级版本：支持0-99网格
export const GRID_UTILS_INFO = {
  version: GRID_UTILS_VERSION,
  description: '模块化网格工具函数库',
  modules: {
    validation: '网格验证相关工具',
    'layout-algorithm': '布局算法和位置计算',
    performance: '性能监控和优化工具',
    responsive: '响应式布局处理',
    common: '通用辅助工具'
  },
  migration: {
    from: 'gridLayoutPlusUtils.ts',
    to: 'utils/* 模块',
    breaking_changes: false,
    benefits: [
      '更好的代码组织和可维护性',
      '按功能模块化，便于独立使用',
      '更完善的错误处理和类型安全',
      '增强的性能监控能力',
      '新增的缓存和异步处理工具'
    ]
  },
  usage_examples: {
    validation: "import { validateGridItem, validateLayout } from './utils'",
    algorithm: "import { findAvailablePosition, compactLayout } from './utils'",
    performance: "import { debounce, PerformanceMonitor } from './utils'",
    responsive: "import { createResponsiveLayout, ResponsiveMediaQuery } from './utils'",
    common: "import { generateId, getLayoutStats } from './utils'"
  }
}

// ==================== 向后兼容性导出 ====================
// 为了保持向后兼容，重新导出原有函数名
export { validateGridItem as validateItem } from './validation'
export { findAvailablePosition as findPosition } from './layout-algorithm'
export { getLayoutStats as getStats } from './common'
