/**
 * EditorLayout 组件相关类型定义
 */

/** 抽屉位置 */
export type DrawerPlacement = 'left' | 'right' | 'top' | 'bottom'

/** 抽屉状态 */
export interface DrawerState {
  /** 是否可见 */
  visible: boolean
  /** 抽屉宽度 */
  width: number | string
  /** 抽屉标题 */
  title: string
  /** 是否可关闭 */
  closable: boolean
}

/** 编辑器布局配置 */
export interface EditorLayoutConfig {
  /** 左侧抽屉配置 */
  left: DrawerState
  /** 右侧抽屉配置 */
  right: DrawerState
  /** 是否显示工具栏 */
  showToolbar: boolean
  /** 是否显示遮罩 */
  showMask: boolean
  /** 点击遮罩是否关闭 */
  maskClosable: boolean
  /** ESC键是否关闭 */
  closeOnEsc: boolean
}

/** 布局主题变量 */
export interface LayoutThemeVars {
  /** 编辑器背景色 */
  '--editor-bg-color': string
  /** 工具栏背景色 */
  '--toolbar-bg-color': string
  /** 工具栏边框色 */
  '--toolbar-border-color': string
  /** 工具栏阴影 */
  '--toolbar-shadow': string
}

/** 抽屉状态变化事件 */
export interface DrawerChangeEvent {
  /** 抽屉位置 */
  placement: DrawerPlacement
  /** 当前状态 */
  visible: boolean
  /** 时间戳 */
  timestamp: number
}

/** 编辑器布局实例方法 */
export interface EditorLayoutInstance {
  /** 左侧抽屉显示状态 */
  leftDrawerVisible: boolean
  /** 右侧抽屉显示状态 */
  rightDrawerVisible: boolean
  /** 打开左侧抽屉 */
  openLeftDrawer: () => void
  /** 关闭左侧抽屉 */
  closeLeftDrawer: () => void
  /** 切换左侧抽屉 */
  toggleLeftDrawer: () => void
  /** 打开右侧抽屉 */
  openRightDrawer: () => void
  /** 关闭右侧抽屉 */
  closeRightDrawer: () => void
  /** 切换右侧抽屉 */
  toggleRightDrawer: () => void
}

/** 工具栏按钮配置 */
export interface ToolbarButtonConfig {
  /** 按钮标识 */
  key: string
  /** 按钮标题 */
  title: string
  /** 图标 */
  icon?: string
  /** 是否激活状态 */
  active?: boolean
  /** 是否禁用 */
  disabled?: boolean
  /** 点击事件 */
  onClick?: () => void
}

/** 布局响应式断点 */
export const LAYOUT_BREAKPOINTS = {
  xs: 0,
  sm: 576,
  md: 768,
  lg: 992,
  xl: 1200,
  xxl: 1600
} as const

export type LayoutBreakpoint = keyof typeof LAYOUT_BREAKPOINTS

/** 响应式配置 */
export interface ResponsiveConfig {
  /** 断点 */
  breakpoint: LayoutBreakpoint
  /** 左侧抽屉配置 */
  leftDrawer?: Partial<DrawerState>
  /** 右侧抽屉配置 */
  rightDrawer?: Partial<DrawerState>
  /** 是否显示工具栏 */
  showToolbar?: boolean
}
