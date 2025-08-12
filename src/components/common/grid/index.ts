/**
 * 通用栅格组件导出
 *
 * @description
 * 该文件作为栅格组件模块的统一出口。
 * 目前，项目已全面转向基于 `grid-layout-plus` 的 `GridLayoutPlus` 组件，
 * 此前的 `DraggableResizableGrid` 实现已被移除。
 *
 * `gridLayoutPlusIndex.ts` 文件中包含了所有与 `GridLayoutPlus` 相关的导出，
 * 包括组件、类型、Hooks 和工具函数。
 */

// ==================== Grid Layout Plus (推荐) ====================
// 基于 grid-layout-plus 的现代化解决方案
export * from './gridLayoutPlusIndex'

// ==================== 组件信息 ====================

// 版本信息
export const GRID_VERSION = '3.0.0' // 版本升级，因为旧组件已被移除
export const GRID_BUILD_DATE = new Date().toISOString()

/**
 * 获取组件信息
 */
export function getGridInfo() {
  return {
    version: GRID_VERSION,
    buildDate: GRID_BUILD_DATE,
    currentComponent: 'GridLayoutPlus',
    description: '项目已全面采用基于 grid-layout-plus 的现代化网格布局组件。',
    features: [
      '基于 Grid Layout Plus 库',
      '响应式布局',
      '拖拽和调整大小',
      '主题支持',
      '完整的 TypeScript 支持',
      '性能优化',
      '丰富的 API 和事件系统',
      '历史记录（撤销/重做）',
      '布局导入/导出'
    ],
    migration_notes:
      '所有旧的 DraggableResizableGrid 相关组件和 API 已被移除，请确保所有引用都已更新至 GridLayoutPlus。'
  }
}
