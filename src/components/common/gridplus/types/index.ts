import type { Component, VNode } from 'vue'
import type { GridStackOptions, GridStackNode, GridItemHTMLElement } from 'gridstack'

// GridStack 网格项接口
export interface GridItem {
  /** 项目唯一标识符 */
  id: string
  /** X轴位置 (网格单位) */
  x: number
  /** Y轴位置 (网格单位) */
  y: number
  /** 宽度 (网格单位) */
  w: number
  /** 高度 (网格单位) */
  h: number

  // GridStack 原生属性
  autoPosition?: boolean
  minW?: number
  maxW?: number
  minH?: number
  maxH?: number
  locked?: boolean
  noResize?: boolean
  noMove?: boolean
  resizeHandles?: string
  static?: boolean

  // 业务数据
  title?: string
  component?: Component
  props?: Record<string, any>
  data?: Record<string, any>
  style?: Record<string, string | number>
  className?: string
  metadata?: Record<string, any>

  // 渲染配置
  render?: (item: GridItem) => VNode
  headerRender?: (item: GridItem) => VNode
  footerRender?: (item: GridItem) => VNode
}

// GridStack 配置接口
export interface GridConfig extends GridStackOptions {
  /** 是否显示网格线 */
  showGridLines?: boolean
  /** 是否显示标题栏 */
  showTitle?: boolean
  /** 是否显示项目信息 */
  showItemInfo?: boolean
  /** 主题 */
  theme?: 'light' | 'dark' | 'auto'
  /** 是否启用拖拽预览 */
  enableDragPreview?: boolean
  /** 是否启用调整大小预览 */
  enableResizePreview?: boolean
  /** 是否启用碰撞检测 */
  enableCollisionDetection?: boolean
  /** 是否启用紧凑布局 */
  enableCompactLayout?: boolean
}

// 组件Props
export interface GridProps {
  /** 布局数据 */
  items: GridItem[]
  /** 是否只读 */
  readonly?: boolean
  /** 是否显示网格线 */
  showGrid?: boolean
  /** 是否显示标题栏 */
  showTitle?: boolean
  /** 网格配置 */
  config?: Partial<GridConfig>
  /** 容器样式 */
  containerStyle?: Record<string, string | number>
  /** 容器类名 */
  containerClass?: string
  /** 主题 */
  theme?: 'light' | 'dark' | 'auto'
  /** 是否启用拖拽预览 */
  enableDragPreview?: boolean
  /** 是否启用调整大小预览 */
  enableResizePreview?: boolean
  /** 是否启用碰撞检测 */
  enableCollisionDetection?: boolean
  /** 是否启用紧凑布局 */
  enableCompactLayout?: boolean
}

// 组件事件
export interface GridEmits {
  (e: 'layout-created', items: GridItem[]): void
  (e: 'layout-before-mount', items: GridItem[]): void
  (e: 'layout-mounted', items: GridItem[]): void
  (e: 'layout-updated', items: GridItem[]): void
  (e: 'layout-ready', items: GridItem[]): void
  (e: 'layout-change', items: GridItem[]): void
  (e: 'update:items', items: GridItem[]): void
  (e: 'breakpoint-changed', breakpoint: string, items: GridItem[]): void
  (e: 'item-resize', itemId: string, newH: number, newW: number, newHPx: number, newWPx: number): void
  (e: 'item-resized', itemId: string, newH: number, newW: number, newHPx: number, newWPx: number): void
  (e: 'item-move', itemId: string, newX: number, newY: number): void
  (e: 'item-moved', itemId: string, newX: number, newY: number): void
  (e: 'item-add', item: GridItem): void
  (e: 'item-delete', itemId: string): void
  (e: 'item-update', itemId: string, updates: Partial<GridItem>): void
  (e: 'item-edit', item: GridItem): void
  (e: 'item-data-update', itemId: string, data: any): void
  (e: 'drag-start', itemId: string): void
  (e: 'drag-end', itemId: string): void
  (e: 'resize-start', itemId: string): void
  (e: 'resize-end', itemId: string): void
}

// 默认配置
export const DEFAULT_CONFIG: GridConfig = {
  column: 12,
  cellHeight: 100,
  margin: '10px',
  float: false,
  animate: true,
  alwaysShowResizeHandle: false,
  auto: true,
  disableDrag: false,
  disableResize: false,
  disableOneColumnMode: false,
  enable: true,
  minRow: 1,
  removable: false,
  removeTimeout: 2000,
  rtl: false,
  showGridLines: false,
  showTitle: true,
  showItemInfo: false,
  theme: 'auto',
  enableDragPreview: true,
  enableResizePreview: true,
  enableCollisionDetection: true,
  enableCompactLayout: true
}

// 主题配置
export interface GridTheme {
  backgroundColor: string
  gridLineColor: string
  itemBackgroundColor: string
  itemBorderColor: string
  itemShadow: string
  itemHoverShadow: string
  itemActiveShadow: string
  dragHintColor: string
  resizeHandleColor: string
  textColor: string
  secondaryTextColor: string
}

// 预设主题
export const LIGHT_THEME: GridTheme = {
  backgroundColor: '#f8f9fa',
  gridLineColor: 'rgba(0, 0, 0, 0.1)',
  itemBackgroundColor: '#ffffff',
  itemBorderColor: '#e1e5e9',
  itemShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
  itemHoverShadow: '0 4px 16px rgba(0, 0, 0, 0.15)',
  itemActiveShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
  dragHintColor: '#007bff',
  resizeHandleColor: '#007bff',
  textColor: '#495057',
  secondaryTextColor: '#6c757d'
}

export const DARK_THEME: GridTheme = {
  backgroundColor: '#1a1a1a',
  gridLineColor: 'rgba(255, 255, 255, 0.1)',
  itemBackgroundColor: '#2d2d2d',
  itemBorderColor: '#404040',
  itemShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
  itemHoverShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
  itemActiveShadow: '0 8px 32px rgba(0, 0, 0, 0.6)',
  dragHintColor: '#4dabf7',
  resizeHandleColor: '#4dabf7',
  textColor: '#ffffff',
  secondaryTextColor: '#b0b0b0'
}
