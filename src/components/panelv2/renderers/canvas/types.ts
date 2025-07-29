// Canvas渲染器特有数据类型
// Canvas renderer specific data types

import type { BaseItem, Position, Size, BaseRendererProps } from '../base/types'

/** 精确位置坐标(支持小数) */
export interface CanvasPosition extends Position {
  /** X坐标(像素) */
  x: number
  /** Y坐标(像素) */
  y: number
  /** 旋转角度(度) */
  rotation?: number
}

/** Canvas项目数据结构 */
export interface CanvasItem extends BaseItem {
  /** 精确位置信息 */
  position: CanvasPosition
  /** 层级顺序 */
  zIndex: number
  /** 透明度 */
  opacity?: number
  /** 是否锁定位置 */
  locked?: boolean
  /** 是否可见 */
  visible?: boolean
  /** 最小尺寸限制(像素) */
  minSize?: Size
  /** 最大尺寸限制(像素) */
  maxSize?: Size
  /** 约束区域 */
  constraints?: {
    /** 最小X坐标 */
    minX?: number
    /** 最小Y坐标 */
    minY?: number
    /** 最大X坐标 */
    maxX?: number
    /** 最大Y坐标 */
    maxY?: number
  }
}

/** 网格配置 */
export interface GridConfig {
  /** 是否启用网格 */
  enabled: boolean
  /** 网格大小(像素) */
  size: number
  /** 是否启用网格吸附 */
  snap: boolean
  /** 网格线颜色 */
  color?: string
  /** 网格线透明度 */
  opacity?: number
  /** 是否显示网格 */
  visible?: boolean
}

/** Canvas配置选项 */
export interface CanvasConfig {
  /** 画布宽度(像素) */
  width: number
  /** 画布高度(像素) */
  height: number
  /** 缩放级别 */
  zoom: number
  /** 最小缩放级别 */
  minZoom?: number
  /** 最大缩放级别 */
  maxZoom?: number
  /** 背景颜色 */
  backgroundColor?: string
  /** 背景图片 */
  backgroundImage?: string
  /** 网格配置 */
  grid: GridConfig
  /** 是否启用选择框 */
  selectionBox: boolean
  /** 是否启用多选 */
  multiSelect: boolean
  /** 拖拽配置 */
  drag: {
    /** 是否启用拖拽 */
    enabled: boolean
    /** 拖拽阈值(像素) */
    threshold: number
    /** 是否限制在画布内 */
    containment: boolean
  }
  /** 调整大小配置 */
  resize: {
    /** 是否启用调整大小 */
    enabled: boolean
    /** 调整手柄大小(像素) */
    handleSize: number
    /** 是否保持纵横比 */
    aspectRatio: boolean
  }
}

/** Canvas渲染器属性 */
export interface CanvasRendererProps extends BaseRendererProps {
  /** Canvas配置 */
  canvasConfig: CanvasConfig
  /** 画布项目列表 */
  items: CanvasItem[]
}

/** Canvas渲染器状态 */
export interface CanvasRendererState {
  /** 当前画布配置 */
  config: CanvasConfig
  /** 画布项目列表 */
  items: CanvasItem[]
  /** 视口位置 */
  viewport: {
    x: number
    y: number
    zoom: number
  }
  /** 拖拽状态 */
  dragState: {
    isDragging: boolean
    dragItemId?: string
    startPosition?: Position
    currentPosition?: Position
    offset?: Position
  }
  /** 选择状态 */
  selectionState: {
    selectedIds: string[]
    selectionBox?: {
      start: Position
      end: Position
    }
    isSelecting: boolean
  }
}

/** Canvas事件数据 */
export interface CanvasEventData {
  /** 画布点击事件 */
  'canvas-click': (position: Position, event: MouseEvent) => void
  /** 画布双击事件 */
  'canvas-dblclick': (position: Position, event: MouseEvent) => void
  /** 视口变更事件 */
  'viewport-change': (viewport: { x: number, y: number, zoom: number }) => void
  /** 缩放变更事件 */
  'zoom-change': (zoom: number) => void
  /** 选择框变更事件 */
  'selection-box-change': (box: { start: Position, end: Position } | null) => void
}

/** Canvas工具函数类型 */
export interface CanvasUtils {
  /** 屏幕坐标转画布坐标 */
  screenToCanvas: (screenPoint: Position, viewport: { x: number, y: number, zoom: number }) => Position
  /** 画布坐标转屏幕坐标 */
  canvasToScreen: (canvasPoint: Position, viewport: { x: number, y: number, zoom: number }) => Position
  /** 网格吸附 */
  snapToGrid: (position: Position, gridSize: number) => Position
  /** 约束位置到边界 */
  constrainPosition: (position: Position, size: Size, bounds: { width: number, height: number }) => Position
  /** 碰撞检测 */
  checkCollision: (item1: CanvasItem, item2: CanvasItem) => boolean
  /** 计算选择框内的项目 */
  getItemsInSelection: (items: CanvasItem[], selectionBox: { start: Position, end: Position }) => CanvasItem[]
  /** 生成唯一层级 */
  generateZIndex: (items: CanvasItem[]) => number
}

/** 变换矩阵 */
export interface TransformMatrix {
  /** 缩放X */
  scaleX: number
  /** 缩放Y */
  scaleY: number
  /** 旋转角度 */
  rotation: number
  /** 平移X */
  translateX: number
  /** 平移Y */
  translateY: number
}

/** 画布导出选项 */
export interface ExportOptions {
  /** 导出格式 */
  format: 'png' | 'jpg' | 'svg' | 'pdf'
  /** 导出质量(0-1) */
  quality?: number
  /** 导出尺寸 */
  size?: Size
  /** 是否包含背景 */
  includeBackground?: boolean
  /** 导出区域 */
  area?: {
    x: number
    y: number
    width: number
    height: number
  }
}