/**
 * EditorLayout 组件模块统一导出
 */

import EditorLayout from './EditorLayout.vue'

export { EditorLayout }
export default EditorLayout

// 导出类型定义
export type {
  DrawerPlacement,
  DrawerState,
  EditorLayoutConfig,
  LayoutThemeVars,
  DrawerChangeEvent,
  EditorLayoutInstance,
  ToolbarButtonConfig,
  LayoutBreakpoint,
  ResponsiveConfig
} from './types'

// 导出常量
export { LAYOUT_BREAKPOINTS } from './types'
