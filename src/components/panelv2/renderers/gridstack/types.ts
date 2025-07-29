// GridStack渲染器特有数据类型
// GridStack renderer specific data types

import type { BaseItem, Position, Size, BaseRendererProps } from '../base/types'

/** 网格位置坐标 */
export interface GridPosition {
  /** 网格列位置 (从0开始) */
  x: number
  /** 网格行位置 (从0开始) */
  y: number
  /** 占用列数 */
  w: number
  /** 占用行数 */
  h: number
}

/** GridStack项目数据结构 */
export interface GridStackItem extends BaseItem {
  /** 网格位置信息 */
  gridPosition: GridPosition
  /** 最小尺寸限制(网格单位) */
  minGridSize?: {
    w: number
    h: number
  }
  /** 最大尺寸限制(网格单位) */
  maxGridSize?: {
    w: number
    h: number
  }
  /** 是否可调整大小 */
  resizable?: boolean
  /** 是否可拖拽 */
  draggable?: boolean
  /** 是否为静态项目(不可移动和调整) */
  static?: boolean
}

/** GridStack配置选项 */
export interface GridStackConfig {
  /** 网格列数 */
  columns: number
  /** 行高度(像素) */
  rowHeight: number
  /** 项目间距(像素) */
  margin: number
  /** 是否启用动画 */
  animate: boolean
  /** 是否自动适应容器高度 */
  float: boolean
  /** 最小行数 */
  minRow?: number
  /** 最大行数 */
  maxRow?: number
  /** 是否允许拖拽 */
  draggable: {
    /** 拖拽手柄选择器 */
    handle?: string
    /** 是否限制在网格内 */
    containment?: boolean
  }
  /** 是否允许调整大小 */
  resizable: {
    /** 调整大小手柄 */
    handles?: string
    /** 是否保持纵横比 */
    aspectRatio?: boolean
  }
  /** 响应式断点配置 */
  responsive?: {
    /** 断点宽度 */
    breakpoint: number
    /** 对应的列数 */
    columns: number
  }[]
}

/** GridStack渲染器属性 */
export interface GridStackRendererProps extends BaseRendererProps {
  /** GridStack配置 */
  gridConfig: GridStackConfig
  /** 网格项目列表 */
  items: GridStackItem[]
}

/** GridStack渲染器状态 */
export interface GridStackRendererState {
  /** 当前网格配置 */
  config: GridStackConfig
  /** 网格项目列表 */
  items: GridStackItem[]
  /** 是否正在初始化 */
  initializing: boolean
  /** GridStack实例引用 */
  gridInstance?: any
}

/** GridStack事件数据 */
export interface GridStackEventData {
  /** 网格变更事件 */
  'grid-change': (items: GridStackItem[]) => void
  /** 项目添加事件 */
  'grid-added': (item: GridStackItem) => void
  /** 项目删除事件 */
  'grid-removed': (item: GridStackItem) => void
  /** 项目调整大小事件 */
  'grid-resized': (item: GridStackItem) => void
  /** 拖拽开始事件 */
  'grid-drag-start': (item: GridStackItem) => void
  /** 拖拽结束事件 */
  'grid-drag-stop': (item: GridStackItem) => void
}

/** 网格项目创建选项 */
export interface GridItemOptions {
  /** 组件类型 */
  type: string
  /** 初始网格位置 */
  gridPosition: Partial<GridPosition>
  /** 组件配置 */
  config?: Record<string, any>
  /** 项目标题 */
  title?: string
  /** 是否可调整大小 */
  resizable?: boolean
  /** 是否可拖拽 */
  draggable?: boolean
}

/** GridStack工具函数类型 */
export interface GridStackUtils {
  /** 像素坐标转网格坐标 */
  pixelToGrid: (pixel: Position, cellSize: Size) => GridPosition
  /** 网格坐标转像素坐标 */
  gridToPixel: (grid: GridPosition, cellSize: Size) => Position
  /** 计算网格单元格尺寸 */
  calculateCellSize: (containerSize: Size, config: GridStackConfig) => Size
  /** 验证网格位置是否有效 */
  validateGridPosition: (position: GridPosition, config: GridStackConfig) => boolean
  /** 查找空闲网格位置 */
  findEmptyPosition: (items: GridStackItem[], size: { w: number, h: number }, config: GridStackConfig) => GridPosition | null
}