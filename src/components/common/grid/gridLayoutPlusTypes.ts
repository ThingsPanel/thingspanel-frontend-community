/**
 * Grid Layout Plus 类型定义
 * 基于 grid-layout-plus 库的 TypeScript 类型扩展
 */

import type { Component } from 'vue'

// 基础网格项接口
export interface GridLayoutPlusItem {
  /** 项目唯一标识符 */
  i: string
  /** X轴位置 (网格单位) */
  x: number
  /** Y轴位置 (网格单位) */
  y: number
  /** 宽度 (网格单位) */
  w: number
  /** 高度 (网格单位) */
  h: number

  // 约束配置
  /** 最小宽度 */
  minW?: number
  /** 最小高度 */
  minH?: number
  /** 最大宽度 */
  maxW?: number
  /** 最大高度 */
  maxH?: number

  // 行为配置
  /** 是否可拖拽 */
  isDraggable?: boolean
  /** 是否可调整大小 */
  isResizable?: boolean
  /** 是否为静态项目 */
  static?: boolean

  // 拖拽配置
  /** 拖拽忽略的选择器 */
  dragIgnoreFrom?: string
  /** 拖拽允许的选择器 */
  dragAllowFrom?: string
  /** 调整大小忽略的选择器 */
  resizeIgnoreFrom?: string
  /** 是否保持宽高比 */
  preserveAspectRatio?: boolean

  // 拖拽和调整大小选项
  /** 拖拽选项 */
  dragOption?: DragOption
  /** 调整大小选项 */
  resizeOption?: ResizeOption

  // 业务数据
  /** 组件类型 */
  type?: string
  /** 组件标题 */
  title?: string
  /** 渲染的组件 */
  component?: Component
  /** 组件属性 */
  props?: Record<string, any>
  /** 组件数据 */
  data?: Record<string, any>
  /** 自定义样式 */
  style?: Record<string, string | number>
  /** 自定义类名 */
  className?: string
  /** 项目元数据 */
  metadata?: Record<string, any>
}

// 拖拽选项
export interface DragOption {
  /** 拖拽手柄 */
  handle?: string
  /** 取消拖拽 */
  cancel?: string
  /** 是否启用滚动 */
  scroll?: boolean
  /** 滚动敏感度 */
  scrollSensitivity?: number
  /** 滚动速度 */
  scrollSpeed?: number
  /** 拖拽透明度 */
  opacity?: number
  /** 拖拽时的z-index */
  zIndex?: number
  /** 是否克隆拖拽 */
  helper?: 'original' | 'clone' | ((event: Event) => HTMLElement)
  /** 拖拽开始回调 */
  start?: (event: Event, ui: any) => void
  /** 拖拽中回调 */
  drag?: (event: Event, ui: any) => void
  /** 拖拽结束回调 */
  stop?: (event: Event, ui: any) => void
}

// 调整大小选项
export interface ResizeOption {
  /** 调整大小手柄 */
  handles?: string
  /** 最小宽度 */
  minWidth?: number
  /** 最小高度 */
  minHeight?: number
  /** 最大宽度 */
  maxWidth?: number
  /** 最大高度 */
  maxHeight?: number
  /** 是否保持宽高比 */
  aspectRatio?: boolean
  /** 网格吸附 */
  grid?: [number, number]
  /** 调整大小开始回调 */
  start?: (event: Event, ui: any) => void
  /** 调整大小中回调 */
  resize?: (event: Event, ui: any) => void
  /** 调整大小结束回调 */
  stop?: (event: Event, ui: any) => void
}

// 网格布局配置
export interface GridLayoutPlusConfig {
  /** 列数 */
  colNum: number
  /** 行高 */
  rowHeight: number
  /** 是否可拖拽 */
  isDraggable: boolean
  /** 是否可调整大小 */
  isResizable: boolean
  /** 是否镜像 */
  isMirrored: boolean
  /** 是否自动调整大小 */
  autoSize: boolean
  /** 是否垂直紧凑 */
  verticalCompact: boolean
  /** 边距 [x, y] */
  margin: [number, number]
  /** 是否使用CSS变换 */
  useCssTransforms: boolean
  /** 是否响应式 */
  responsive: boolean
  /** 响应式断点 */
  breakpoints: Record<string, number>
  /** 不同断点的列数 */
  cols: Record<string, number>
  /** 是否防止碰撞 */
  preventCollision: boolean
  /** 是否使用样式光标 */
  useStyleCursor: boolean
  /** 拖拽时是否恢复 */
  restoreOnDrag: boolean
}

// 默认配置
export const DEFAULT_GRID_LAYOUT_PLUS_CONFIG: GridLayoutPlusConfig = {
  colNum: 12,
  rowHeight: 100,
  isDraggable: true,
  isResizable: true,
  isMirrored: false,
  autoSize: true,
  verticalCompact: true,
  margin: [10, 10],
  useCssTransforms: true,
  responsive: false,
  breakpoints: { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 },
  cols: { lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 },
  preventCollision: false,
  useStyleCursor: true,
  restoreOnDrag: false
}

// 组件Props
export interface GridLayoutPlusProps {
  /** 布局数据 */
  layout: GridLayoutPlusItem[]
  /** 是否只读 */
  readonly?: boolean
  /** 是否显示网格线 */
  showGrid?: boolean
  /** 是否显示拖拽区域 */
  showDropZone?: boolean
  /** 是否显示标题栏 */
  showTitle?: boolean
  /** 网格配置 */
  config?: Partial<GridLayoutPlusConfig>
  /** 容器样式 */
  containerStyle?: Record<string, string | number>
  /** 容器类名 */
  containerClass?: string
}

// 组件Emits
export interface GridLayoutPlusEmits {
  /** 布局创建 */
  (e: 'layout-created', layout: GridLayoutPlusItem[]): void
  /** 布局挂载前 */
  (e: 'layout-before-mount', layout: GridLayoutPlusItem[]): void
  /** 布局已挂载 */
  (e: 'layout-mounted', layout: GridLayoutPlusItem[]): void
  /** 布局更新 */
  (e: 'layout-updated', layout: GridLayoutPlusItem[]): void
  /** 布局就绪 */
  (e: 'layout-ready', layout: GridLayoutPlusItem[]): void
  /** 布局变化 */
  (e: 'layout-change', layout: GridLayoutPlusItem[]): void
  /** 更新布局 */
  (e: 'update:layout', layout: GridLayoutPlusItem[]): void
  /** 断点变化 */
  (e: 'breakpoint-changed', breakpoint: string, layout: GridLayoutPlusItem[]): void
  /** 容器大小变化 */
  (e: 'container-resized', i: string, newH: number, newW: number, newHPx: number, newWPx: number): void
  /** 项目调整大小中 */
  (e: 'item-resize', i: string, newH: number, newW: number, newHPx: number, newWPx: number): void
  /** 项目调整大小完成 */
  (e: 'item-resized', i: string, newH: number, newW: number, newHPx: number, newWPx: number): void
  /** 项目移动中 */
  (e: 'item-move', i: string, newX: number, newY: number): void
  /** 项目移动完成 */
  (e: 'item-moved', i: string, newX: number, newY: number): void
  /** 项目容器大小变化 */
  (e: 'item-container-resized', i: string, newH: number, newW: number, newHPx: number, newWPx: number): void

  // 业务事件
  /** 项目添加 */
  (e: 'item-add', item: GridLayoutPlusItem): void
  /** 项目删除 */
  (e: 'item-delete', itemId: string): void
  /** 项目更新 */
  (e: 'item-update', itemId: string, updates: Partial<GridLayoutPlusItem>): void
  /** 项目编辑 */
  (e: 'item-edit', item: GridLayoutPlusItem): void
  /** 项目数据更新 */
  (e: 'item-data-update', itemId: string, data: any): void
}

// 响应式布局配置
export interface ResponsiveLayout {
  lg?: GridLayoutPlusItem[]
  md?: GridLayoutPlusItem[]
  sm?: GridLayoutPlusItem[]
  xs?: GridLayoutPlusItem[]
  xxs?: GridLayoutPlusItem[]
}

// 布局操作结果
export interface LayoutOperationResult<T = any> {
  success: boolean
  data?: T
  error?: Error
  message?: string
}

// 工具函数类型
export type LayoutValidator = (layout: GridLayoutPlusItem[]) => LayoutOperationResult<boolean>
export type ItemValidator = (item: GridLayoutPlusItem) => LayoutOperationResult<boolean>
export type PositionFinder = (w: number, h: number, layout: GridLayoutPlusItem[]) => { x: number; y: number }

// 主题配置
export interface GridTheme {
  /** 主背景色 */
  backgroundColor: string
  /** 网格线颜色 */
  gridLineColor: string
  /** 项目背景色 */
  itemBackgroundColor: string
  /** 项目边框色 */
  itemBorderColor: string
  /** 项目阴影 */
  itemShadow: string
  /** 项目悬停阴影 */
  itemHoverShadow: string
  /** 拖拽提示颜色 */
  dragHintColor: string
  /** 文本颜色 */
  textColor: string
  /** 次要文本颜色 */
  secondaryTextColor: string
}

// 预定义主题
export const LIGHT_THEME: GridTheme = {
  backgroundColor: '#f8f9fa',
  gridLineColor: '#ddd',
  itemBackgroundColor: '#ffffff',
  itemBorderColor: '#e1e5e9',
  itemShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
  itemHoverShadow: '0 4px 16px rgba(0, 0, 0, 0.15)',
  dragHintColor: '#007bff',
  textColor: '#495057',
  secondaryTextColor: '#6c757d'
}

export const DARK_THEME: GridTheme = {
  backgroundColor: '#1a1a1a',
  gridLineColor: '#333',
  itemBackgroundColor: '#2d2d2d',
  itemBorderColor: '#404040',
  itemShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
  itemHoverShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
  dragHintColor: '#4dabf7',
  textColor: '#ffffff',
  secondaryTextColor: '#b0b0b0'
}

// 性能配置
export interface PerformanceConfig {
  /** 是否启用虚拟化 */
  enableVirtualization: boolean
  /** 虚拟化阈值 */
  virtualizationThreshold: number
  /** 防抖延迟 */
  debounceDelay: number
  /** 节流延迟 */
  throttleDelay: number
  /** 是否启用懒加载 */
  enableLazyLoading: boolean
  /** 懒加载缓冲区 */
  lazyLoadingBuffer: number
}

// 导出所有类型
export type {
  GridLayoutPlusItem as GridItem,
  GridLayoutPlusConfig as GridConfig,
  GridLayoutPlusProps as GridProps,
  GridLayoutPlusEmits as GridEmits
}
