/**
 * 画布核心类型定义
 * 定义渲染树节点的纯数据结构，框架无关
 */

/**
 * 位置信息
 */
export interface Position {
  x: number
  y: number
}

/**
 * 尺寸信息
 */
export interface Size {
  width: number
  height: number
}

/**
 * 变换信息
 */
export interface Transform {
  /** 旋转角度 */
  rotate: number
  /** 缩放比例 */
  scale: number
  /** X轴翻转 */
  flipX?: boolean
  /** Y轴翻转 */
  flipY?: boolean
}

/**
 * 样式信息
 */
export interface NodeStyle {
  /** 背景颜色 */
  backgroundColor?: string
  /** 边框颜色 */
  borderColor?: string
  /** 边框宽度 */
  borderWidth?: number
  /** 边框样式 */
  borderStyle?: 'solid' | 'dashed' | 'dotted'
  /** 圆角半径 */
  borderRadius?: number
  /** 透明度 */
  opacity?: number
  /** 阴影 */
  boxShadow?: string
  /** 层级 */
  zIndex?: number
}

/**
 * 画布节点（渲染树节点）
 * 这是核心引擎产出的纯数据结构，描述"渲染什么"而非"如何渲染"
 */
export interface ICanvasNode {
  /** 唯一标识 */
  id: string

  /** 组件类型（对应 cartes 中的卡片类型） */
  type: string

  /** 位置信息 */
  position: Position

  /** 尺寸信息 */
  size: Size

  /** 变换信息 */
  transform: Transform

  /** 样式信息 */
  style: NodeStyle

  /** 组件数据（由数据源引擎填充） */
  data: Record<string, any>

  /** 组件配置（静态配置） */
  config: Record<string, any>

  /** 交互配置 */
  interactions?: INodeInteraction[]

  /** 元数据 */
  metadata: {
    /** 创建时间 */
    createdAt: number
    /** 更新时间 */
    updatedAt: number
    /** 是否锁定 */
    locked: boolean
    /** 是否可见 */
    visible: boolean
    /** 图层名称 */
    layerName?: string
  }

  /** 子节点（用于容器组件） */
  children?: ICanvasNode[]
}

/**
 * 节点交互配置
 */
export interface INodeInteraction {
  /** 交互唯一标识 */
  id: string

  /** 交互名称 */
  name: string

  /** 是否启用 */
  enabled: boolean

  /** 触发事件 */
  event: InteractionEvent

  /** 响应动作列表 */
  responses: IInteractionResponse[]

  /** 监听的属性（用于数据变化触发） */
  watchedProperty?: string
}

/**
 * 交互事件类型
 */
export type InteractionEvent =
  | 'click'
  | 'dblclick'
  | 'hover'
  | 'focus'
  | 'blur'
  | 'dataChange'
  | 'mount'
  | 'unmount'

/**
 * 交互响应动作
 */
export interface IInteractionResponse {
  /** 动作类型 */
  action: InteractionAction

  /** 动作名称 */
  name: string

  /** 是否启用 */
  enabled: boolean

  /** 延迟执行（毫秒） */
  delay: number

  /** 动作参数 */
  params?: Record<string, any>
}

/**
 * 交互动作类型
 */
export type InteractionAction =
  | 'navigateToUrl'
  | 'updateComponentData'
  | 'changeVisibility'
  | 'changeBackgroundColor'
  | 'changeBorderColor'
  | 'triggerAnimation'
  | 'showNotification'
  | 'emitEvent'
  | 'flashColor'
  | 'pulseEffect'
  | 'openModal'
  | 'closeModal'

/**
 * 渲染树（Render Tree）
 * 核心引擎的主要产出，是一个描述画布所有节点的纯数据数组
 */
export type RenderTree = ICanvasNode[]

/**
 * 视口信息
 */
export interface Viewport {
  /** X轴偏移 */
  x: number
  /** Y轴偏移 */
  y: number
  /** 缩放比例 */
  zoom: number
}

/**
 * 画布配置
 */
export interface CanvasConfig {
  /** 画布宽度 */
  width: number
  /** 画布高度 */
  height: number
  /** 背景颜色 */
  backgroundColor: string
  /** 网格显示 */
  showGrid: boolean
  /** 网格大小 */
  gridSize: number
  /** 吸附网格 */
  snapToGrid: boolean
}

/**
 * 选择状态
 */
export interface SelectionState {
  /** 选中的节点ID列表 */
  selectedIds: string[]
  /** 悬停的节点ID */
  hoveredId: string | null
  /** 多选模式 */
  multiSelect: boolean
}

/**
 * 历史记录项
 */
export interface HistoryRecord {
  /** 操作类型 */
  type: 'add' | 'remove' | 'update' | 'move' | 'resize'
  /** 操作时间 */
  timestamp: number
  /** 操作前的节点快照 */
  before: ICanvasNode | ICanvasNode[] | null
  /** 操作后的节点快照 */
  after: ICanvasNode | ICanvasNode[] | null
}

/**
 * 画布状态（Pinia Store State）
 */
export interface CanvasState {
  /** 渲染树 */
  nodes: RenderTree
  /** 视口信息 */
  viewport: Viewport
  /** 画布配置 */
  config: CanvasConfig
  /** 选择状态 */
  selection: SelectionState
  /** 历史记录栈 */
  history: {
    past: HistoryRecord[]
    future: HistoryRecord[]
  }
  /** 编辑模式 */
  mode: 'design' | 'preview'
}

/**
 * 节点创建选项
 */
export interface CreateNodeOptions {
  /** 组件类型 */
  type: string
  /** 初始位置 */
  position: Position
  /** 初始尺寸 */
  size?: Partial<Size>
  /** 初始配置 */
  config?: Record<string, any>
  /** 初始数据 */
  data?: Record<string, any>
}

/**
 * 节点更新选项
 */
export type UpdateNodeOptions = Partial<
  Omit<ICanvasNode, 'id' | 'type' | 'metadata'>
>
