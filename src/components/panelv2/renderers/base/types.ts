// 渲染器基础数据类型定义
// Base data types for renderers

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

/** 渲染模式 */
export type RenderMode = 'edit' | 'preview'

/** 基础项目数据结构 */
export interface BaseItem {
  /** 唯一标识符 */
  id: string
  /** 组件类型标识 */
  type: string
  /** 位置坐标 */
  position: Position
  /** 尺寸大小 */
  size: Size
  /** 组件配置数据 */
  config: Record<string, any>
  /** 显示标题 */
  title?: string
  /** 是否锁定 */
  locked?: boolean
  /** 是否隐藏 */
  hidden?: boolean
}

/** 选择状态 */
export interface SelectionState {
  /** 选中的项目ID列表 */
  selectedIds: string[]
  /** 多选模式 */
  multiSelect: boolean
}

/** 渲染器基础状态 */
export interface BaseRendererState {
  /** 项目列表 */
  items: BaseItem[]
  /** 渲染模式 */
  mode: RenderMode
  /** 选择状态 */
  selection: SelectionState
}

/** 项目更新数据 */
export interface ItemUpdateData {
  position?: Partial<Position>
  size?: Partial<Size>
  config?: Record<string, any>
  title?: string
  locked?: boolean
  hidden?: boolean
}

/** 拖拽状态 */
export interface DragState {
  /** 是否正在拖拽 */
  isDragging: boolean
  /** 拖拽的项目ID */
  dragItemId?: string
  /** 拖拽起始位置 */
  startPosition?: Position
  /** 当前拖拽位置 */
  currentPosition?: Position
}

/** 渲染器事件类型 */
export interface RendererEvents {
  /** 项目选择事件 */
  'item-select': (ids: string[]) => void
  /** 项目更新事件 */
  'item-update': (id: string, updates: ItemUpdateData) => void
  /** 项目删除事件 */
  'item-remove': (id: string) => void
  /** 项目添加事件 */
  'item-add': (item: BaseItem) => void
  /** 拖拽开始事件 */
  'drag-start': (id: string, position: Position) => void
  /** 拖拽结束事件 */
  'drag-end': (id: string, position: Position) => void
}