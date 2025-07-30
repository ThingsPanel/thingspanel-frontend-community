// Canvas core type definitions
// 画布核心类型定义

/** 位置坐标 */
export interface Position {
  x: number
  y: number
}

/** 尺寸大小 */
export interface Size {
  width: number
  height: number
}

/** 画布项目基础数据结构 */
export interface CanvasItem {
  /** 唯一标识符 */
  id: string
  /** 组件类型 */
  type: string
  /** 位置坐标 */
  position: Position
  /** 尺寸大小 */
  size: Size
  /** 组件配置数据 */
  config: Record<string, any>
  /** 显示标题 */
  title?: string
  /** 最小尺寸限制 */
  minSize?: Size
  /** 最大尺寸限制 */
  maxSize?: Size
  /** 是否锁定位置 */
  locked?: boolean
  /** 是否隐藏 */
  hidden?: boolean
  /** 层级顺序 */
  zIndex?: number
}

/** 组件库项目定义 */
export interface ComponentLibraryItem {
  /** 组件ID */
  id: string
  /** 显示名称 */
  name: string
  /** 组件类型分类 */
  type: 'chart' | 'data' | 'display' | 'media' | 'control' | 'custom'
  /** 图标标识 */
  icon: string
  /** 主题颜色 */
  color: string
  /** 描述信息 */
  description?: string
  /** 默认尺寸 */
  defaultSize: Size
  /** 最小尺寸 */
  minSize: Size
  /** 最大尺寸 */
  maxSize?: Size
  /** 预设配置 */
  defaultConfig?: Record<string, any>
}

/** 画布状态 */
export interface CanvasState {
  /** 画布项目列表 */
  items: CanvasItem[]
  /** 选中的项目ID列表 */
  selectedIds: string[]
  /** 画布模式 */
  mode: 'edit' | 'preview'
  /** 网格配置 */
  grid: {
    enabled: boolean
    size: number
    snap: boolean
  }
  /** 画布尺寸 */
  canvasSize: Size
  /** 缩放级别 */
  zoom: number
}

/** 拖拽状态 */
export interface DragState {
  /** 是否正在拖拽 */
  isDragging: boolean
  /** 拖拽的数据 */
  dragData: any
  /** 拖拽类型 */
  dragType: 'component' | 'canvas-item' | 'resize'
  /** 拖拽起始位置 */
  startPosition?: Position
  /** 当前拖拽位置 */
  currentPosition?: Position
}

/** 选择状态 */
export interface SelectionState {
  /** 选中的项目ID列表 */
  selectedIds: string[]
  /** 选择框区域 */
  selectionBox?: {
    start: Position
    end: Position
  }
}

/** 历史记录状态 */
export interface HistoryState {
  /** 历史记录栈 */
  history: CanvasItem[][]
  /** 当前历史位置 */
  currentIndex: number
  /** 最大历史记录数 */
  maxHistory: number
}

/** 剪贴板数据 */
export interface ClipboardData {
  /** 剪贴板项目 */
  items: CanvasItem[]
  /** 操作类型 */
  operation: 'copy' | 'cut'
  /** 时间戳 */
  timestamp: number
}
