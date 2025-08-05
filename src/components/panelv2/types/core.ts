/**
 * PanelV2 Core Data Types
 * 统一的核心数据结构定义，作为所有渲染器的基础
 */

// 位置信息
export interface Position {
  x: number // X坐标（像素或网格单位）
  y: number // Y坐标（像素或网格单位）
}

// 尺寸信息
export interface Size {
  width: number // 宽度
  height: number // 高度
}

// 约束条件
export interface Constraints {
  minWidth?: number // 最小宽度
  minHeight?: number // 最小高度
  maxWidth?: number // 最大宽度
  maxHeight?: number // 最大高度
  aspectRatio?: number // 宽高比锁定
}

// 视口状态
export interface Viewport {
  zoom: number // 缩放比例
  offsetX: number // X偏移
  offsetY: number // Y偏移
}

// 数据源配置 (兼容现有格式)
export interface DataSourceConfig {
  origin: 'system' | 'device'
  deviceSource?: DeviceSourceItem[]
  isSupportTimeRange: boolean
  dataTimeRange: string
  [key: string]: any
}

export interface DeviceSourceItem {
  device_id: string
  metricsType: string
  aggregateWindow: string
  [key: string]: any
}

// 基础设置 (兼容现有格式)
export interface BasicSettings {
  showTitle?: boolean
  title?: string
  [key: string]: any
}

// 卡片数据结构 (兼容现有ICardData)
export interface CardData {
  cardId: string // 卡片类型标识
  title?: string // 卡片标题
  config: Record<string, any> // 组件配置
  dataSource?: DataSourceConfig // 数据源配置
  basicSettings?: BasicSettings // 基础设置
  type?: 'builtin' | 'device' | 'plugin' | 'chart' // 卡片类型
}

// 统一的基础画布项目接口
export interface BaseCanvasItem {
  id: string // 全局唯一标识
  type: 'component' | 'group' // 项目类型

  // 通用位置和尺寸（标准化坐标系）
  position: Position // 位置信息
  size: Size // 尺寸信息

  // 约束条件
  constraints: Constraints // 尺寸约束

  // 层级和可见性
  zIndex: number // 层级
  visible: boolean // 可见性
  locked: boolean // 是否锁定

  // 业务数据（兼容现有ICardData）
  cardData: CardData // 卡片业务数据

  // 渲染器特定数据存储
  rendererData: Record<string, any> // 各渲染器的专有数据

  // 元数据
  metadata: {
    createdAt: number // 创建时间
    updatedAt: number // 更新时间
    version: string // 数据版本
  }
}

// 画布配置
export interface CanvasConfig {
  width: number // 画布宽度
  height: number // 画布高度
  backgroundColor: string // 背景色
  showGrid: boolean // 显示网格
  snapToGrid: boolean // 对齐网格
  gridSize: number // 网格大小
  readonly?: boolean // 只读模式
}

// 历史记录状态
export interface HistoryState {
  past: BaseCanvasItem[][] // 历史状态栈
  future: BaseCanvasItem[][] // 重做状态栈
  maxSize: number // 最大历史记录数量
}

// 画布状态（核心状态接口）
export interface CanvasState {
  items: BaseCanvasItem[] // 所有项目
  selectedIds: string[] // 选中项目ID列表

  // 视口状态
  viewport: Viewport // 视口信息

  // 画布配置
  config: CanvasConfig // 画布配置

  // 交互状态
  mode: 'edit' | 'preview' // 当前模式
  dragState: DragState | null // 拖拽状态
  clipboard: ClipboardData | null // 剪贴板数据

  // 历史记录
  history: HistoryState // 撤销重做历史

  // UI状态
  sidebarCollapsed: {
    left: boolean // 左侧栏收起状态
    right: boolean // 右侧栏收起状态
  }
}

// 拖拽状态
export interface DragState {
  isDragging: boolean // 是否正在拖拽
  dragType: 'move' | 'resize' | 'create' // 拖拽类型
  sourceIds: string[] // 拖拽源项目ID
  startPosition: Position // 开始位置
  currentPosition: Position // 当前位置
  preview?: BaseCanvasItem // 预览项目
}

// 剪贴板数据
export interface ClipboardData {
  items: BaseCanvasItem[] // 剪贴板中的项目
  operation: 'copy' | 'cut' // 操作类型
  timestamp: number // 剪贴时间
}

// 面板配置
export interface PanelConfig {
  panelId: string // 面板ID
  title: string // 面板标题
  description?: string // 面板描述
  theme: string // 主题
  canvasState: CanvasState // 画布状态
  rendererType: string // 当前渲染器类型
  version: string // 面板版本
  metadata: {
    createdAt: number
    updatedAt: number
    author?: string
    tags?: string[]
  }
}

// 验证结果
export interface ValidationResult {
  valid: boolean // 是否有效
  errors: ValidationError[] // 错误列表
  warnings: ValidationWarning[] // 警告列表
}

export interface ValidationError {
  path: string // 错误路径
  message: string // 错误消息
  code: string // 错误代码
}

export interface ValidationWarning {
  path: string // 警告路径
  message: string // 警告消息
  code: string // 警告代码
}

// 导出默认值常量
export const DEFAULT_CANVAS_CONFIG: CanvasConfig = {
  width: 1200,
  height: 800,
  backgroundColor: '#f5f5f5',
  showGrid: true,
  snapToGrid: true,
  gridSize: 10,
  readonly: false
}

export const DEFAULT_VIEWPORT: Viewport = {
  zoom: 1,
  offsetX: 0,
  offsetY: 0
}

export const DEFAULT_CONSTRAINTS: Constraints = {
  minWidth: 100,
  minHeight: 100
}
