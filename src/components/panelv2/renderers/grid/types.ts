// 轻量级网格渲染器类型定义
// Lightweight grid renderer type definitions

import type { BaseItem, Position, Size } from '../base/types'

/** 网格配置 */
export interface GridConfig {
  /** 网格列数 */
  columns: number
  /** 网格行高 */
  rowHeight: number
  /** 网格间距 */
  gap: number
  /** 是否显示网格线 */
  showGrid: boolean
  /** 是否启用磁吸 */
  enableSnap: boolean
  /** 磁吸阈值 */
  snapThreshold: number
  /** 最小项目宽度 */
  minItemWidth: number
  /** 最小项目高度 */
  minItemHeight: number
  /** 容器内边距 */
  padding: number
}

/** 网格项目 */
export interface GridItem extends BaseItem {
  /** 网格位置 */
  gridPosition: {
    /** 网格列起始位置 */
    col: number
    /** 网格行起始位置 */
    row: number
    /** 占用列数 */
    colSpan: number
    /** 占用行数 */
    rowSpan: number
  }
  /** 层级 */
  zIndex?: number
}

/** 拖拽状态 */
export interface DragState {
  /** 是否正在拖拽 */
  isDragging: boolean
  /** 拖拽项目ID */
  dragItemId?: string
  /** 拖拽起始位置 */
  startPosition?: Position
  /** 当前拖拽位置 */
  currentPosition?: Position
  /** 拖拽偏移 */
  offset?: Position
  /** 预览位置 */
  previewPosition?: {
    col: number
    row: number
    colSpan: number
    rowSpan: number
  }
}

/** 调整大小状态 */
export interface ResizeState {
  /** 是否正在调整大小 */
  isResizing: boolean
  /** 调整大小的项目ID */
  resizeItemId?: string
  /** 调整方向 */
  direction?: 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw'
  /** 起始尺寸 */
  startSize?: Size
  /** 起始位置 */
  startPosition?: Position
  /** 当前尺寸 */
  currentSize?: Size
}

/** 网格渲染器状态 */
export interface GridRendererState {
  /** 网格配置 */
  config: GridConfig
  /** 拖拽状态 */
  dragState: DragState
  /** 调整大小状态 */
  resizeState: ResizeState
  /** 是否显示网格 */
  showGrid: boolean
  /** 缩放比例 */
  scale: number
}

/** 网格工具 */
export interface GridTool {
  /** 工具ID */
  id: string
  /** 工具名称 */
  name: string
  /** 工具图标 */
  icon: string
  /** 工具描述 */
  description: string
  /** 是否启用 */
  enabled: boolean
  /** 工具操作 */
  action: () => void
}

/** 网格事件 */
export interface GridEvents {
  /** 网格配置变化 */
  'config-change': (config: GridConfig) => void
  /** 拖拽开始 */
  'drag-start': (item: GridItem) => void
  /** 拖拽中 */
  'drag-move': (item: GridItem, position: Position) => void
  /** 拖拽结束 */
  'drag-end': (item: GridItem, newPosition: Position) => void
  /** 调整大小开始 */
  'resize-start': (item: GridItem) => void
  /** 调整大小中 */
  'resize-move': (item: GridItem, size: Size) => void
  /** 调整大小结束 */
  'resize-end': (item: GridItem, newSize: Size) => void
}
