/**
 * Visual Editor 布局系统类型定义
 * 集成原始 Panel 系统的布局逻辑，提供统一的布局管理接口
 */

import type { ICardView, ICardData } from '@/card2.1/core2/legacy'
import type { IComponentDefinition } from '@/card2.1/core2'

// ====== 基础布局类型 ======

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
 * 边界信息
 */
export interface Bounds {
  left: number
  top: number
  right: number
  bottom: number
}

/**
 * 网格配置
 */
export interface GridConfig {
  cols: number // 列数
  rowHeight: number // 行高
  margin: [number, number] // 间距 [x, y]
  containerPadding: [number, number] // 容器内边距 [x, y]
  breakpoints?: Record<string, number> // 断点配置
  layouts?: Record<string, LayoutItem[]> // 响应式布局
}

/**
 * 布局约束
 */
export interface LayoutConstraints {
  minSize: Size
  maxSize?: Size
  aspectRatio?: number // 宽高比
  snapToGrid?: boolean // 是否对齐网格
  resizable?: boolean // 是否可调整大小
  draggable?: boolean // 是否可拖拽
}

// ====== 布局项定义 ======

/**
 * Visual Editor 布局项
 */
export interface LayoutItem {
  // 基础标识
  id: string
  type: string // 组件类型

  // 位置和尺寸
  position: Position
  size: Size

  // 约束信息
  constraints: LayoutConstraints

  // 层级和状态
  zIndex?: number
  visible?: boolean
  locked?: boolean
  selected?: boolean

  // 组件配置
  config?: Record<string, any>
  properties?: Record<string, any>

  // 数据源配置
  dataSource?: any

  // 样式配置
  style?: {
    backgroundColor?: string
    borderColor?: string
    borderWidth?: number
    borderRadius?: number
    opacity?: number
    transform?: string
  }

  // 元数据
  meta?: {
    name?: string
    description?: string
    category?: string
    icon?: string
    tags?: string[]
    createdAt?: Date
    updatedAt?: Date
  }

  // 兼容性字段（用于 Panel 系统兼容）
  legacy?: {
    cardView?: ICardView
    cardData?: ICardData
    componentDefinition?: IComponentDefinition
  }
}

/**
 * 布局容器
 */
export interface LayoutContainer {
  id: string
  name: string
  items: LayoutItem[]
  gridConfig: GridConfig

  // 容器属性
  size: Size
  background?: {
    color?: string
    image?: string
    repeat?: 'repeat' | 'no-repeat' | 'repeat-x' | 'repeat-y'
    position?: string
    size?: string
  }

  // 主题配置
  theme?: string
  customTheme?: Record<string, any>

  // 交互配置
  interaction?: {
    allowDrop?: boolean
    allowResize?: boolean
    allowDrag?: boolean
    showGrid?: boolean
    snapToGrid?: boolean
  }

  // 元数据
  meta?: {
    version?: string
    description?: string
    tags?: string[]
    createdAt?: Date
    updatedAt?: Date
  }
}

// ====== 布局操作类型 ======

/**
 * 布局操作类型
 */
export type LayoutOperation =
  | 'add'
  | 'remove'
  | 'move'
  | 'resize'
  | 'select'
  | 'deselect'
  | 'lock'
  | 'unlock'
  | 'show'
  | 'hide'
  | 'copy'
  | 'paste'
  | 'group'
  | 'ungroup'
  | 'align'
  | 'distribute'

/**
 * 布局变更事件
 */
export interface LayoutChangeEvent {
  type: LayoutOperation
  itemId: string | string[]
  oldValue?: any
  newValue?: any
  timestamp: number
}

/**
 * 布局历史记录
 */
export interface LayoutHistory {
  id: string
  operation: LayoutOperation
  itemIds: string[]
  beforeState: any
  afterState: any
  timestamp: number
  description?: string
}

// ====== 布局管理器接口 ======

/**
 * 布局管理器接口
 */
export interface ILayoutManager {
  // 容器管理
  getContainer(): LayoutContainer
  updateContainer(updates: Partial<LayoutContainer>): void

  // 项目管理
  getItems(): LayoutItem[]
  getItem(id: string): LayoutItem | undefined
  addItem(item: LayoutItem): void
  removeItem(id: string): void
  updateItem(id: string, updates: Partial<LayoutItem>): void

  // 选择管理
  getSelectedItems(): LayoutItem[]
  selectItem(id: string, multiple?: boolean): void
  deselectItem(id: string): void
  selectAll(): void
  deselectAll(): void

  // 布局操作
  moveItem(id: string, position: Position): void
  resizeItem(id: string, size: Size): void
  lockItem(id: string): void
  unlockItem(id: string): void

  // 层级管理
  bringToFront(id: string): void
  sendToBack(id: string): void
  bringForward(id: string): void
  sendBackward(id: string): void

  // 对齐和分布
  alignItems(ids: string[], alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom'): void
  distributeItems(ids: string[], distribution: 'horizontal' | 'vertical'): void

  // 复制和粘贴
  copyItems(ids: string[]): void
  pasteItems(position?: Position): void

  // 撤销和重做
  undo(): void
  redo(): void
  canUndo(): boolean
  canRedo(): boolean

  // 历史记录
  getHistory(): LayoutHistory[]
  clearHistory(): void

  // 事件处理
  on(event: string, handler: (event: LayoutChangeEvent) => void): void
  off(event: string, handler: (event: LayoutChangeEvent) => void): void
  emit(event: string, data: LayoutChangeEvent): void
}

// ====== 网格系统类型 ======

/**
 * 网格单元
 */
export interface GridCell {
  col: number
  row: number
  width: number
  height: number
  occupied?: boolean
  item?: LayoutItem
}

/**
 * 网格布局引擎接口
 */
export interface IGridLayoutEngine {
  // 网格配置
  getGridConfig(): GridConfig
  updateGridConfig(config: Partial<GridConfig>): void

  // 位置计算
  pixelToGrid(pixel: Position): { col: number; row: number }
  gridToPixel(grid: { col: number; row: number }): Position

  // 碰撞检测
  checkCollision(item: LayoutItem, position: Position, size: Size): boolean
  findAvailablePosition(size: Size): Position | null

  // 自动布局
  autoLayout(items: LayoutItem[]): LayoutItem[]
  compactLayout(items: LayoutItem[]): LayoutItem[]

  // 网格管理
  getOccupiedCells(): GridCell[]
  getAvailableCells(): GridCell[]
  markCellsOccupied(position: Position, size: Size, item: LayoutItem): void
  markCellsAvailable(position: Position, size: Size): void
}

// ====== 响应式布局类型 ======

/**
 * 断点定义
 */
export interface Breakpoint {
  name: string
  minWidth: number
  maxWidth?: number
  cols: number
  margin?: [number, number]
  containerPadding?: [number, number]
}

/**
 * 响应式布局配置
 */
export interface ResponsiveLayoutConfig {
  breakpoints: Breakpoint[]
  defaultBreakpoint: string
  autoResize?: boolean
  maintainAspectRatio?: boolean
}

/**
 * 响应式布局管理器接口
 */
export interface IResponsiveLayoutManager extends ILayoutManager {
  // 断点管理
  getBreakpoints(): Breakpoint[]
  getCurrentBreakpoint(): Breakpoint
  switchBreakpoint(breakpointName: string): void

  // 响应式操作
  getLayoutForBreakpoint(breakpointName: string): LayoutItem[]
  setLayoutForBreakpoint(breakpointName: string, items: LayoutItem[]): void
  syncLayoutAcrossBreakpoints(sourceBreakpoint: string): void

  // 自适应
  autoAdjustForBreakpoint(breakpointName: string): void
  previewBreakpoint(breakpointName: string): void
  resetBreakpointPreview(): void
}

// ====== 布局工具函数类型 ======

/**
 * 布局工具函数集合
 */
export interface LayoutUtils {
  // 几何计算
  calculateBounds(items: LayoutItem[]): Bounds
  isPointInside(point: Position, item: LayoutItem): boolean
  getIntersection(item1: LayoutItem, item2: LayoutItem): Bounds | null

  // 排序和查找
  sortItemsByZIndex(items: LayoutItem[]): LayoutItem[]
  findItemsInArea(area: Bounds, items: LayoutItem[]): LayoutItem[]
  findItemAt(position: Position, items: LayoutItem[]): LayoutItem | null

  // 对齐计算
  calculateAlignmentOffset(items: LayoutItem[], alignment: string): Position[]
  calculateDistributionOffset(items: LayoutItem[], distribution: string): Position[]

  // 尺寸计算
  calculateOptimalSize(content: any, constraints: LayoutConstraints): Size
  maintainAspectRatio(currentSize: Size, newSize: Partial<Size>, aspectRatio: number): Size

  // 网格计算
  snapToGrid(position: Position, gridSize: Size): Position
  calculateGridPosition(pixelPosition: Position, gridConfig: GridConfig): { col: number; row: number }

  // 转换工具
  convertPanelLayoutToEditor(panelLayout: ICardView[]): LayoutItem[]
  convertEditorLayoutToPanel(editorLayout: LayoutItem[]): ICardView[]
}

// ====== 导出类型定义 ======

/**
 * 布局序列化格式
 */
export interface SerializedLayout {
  version: string
  container: LayoutContainer
  items: LayoutItem[]
  metadata?: {
    exportedAt: string
    exportedBy?: string
    source: 'visual-editor' | 'panel-system'
    compatibility: string[]
  }
}

/**
 * 布局导入导出接口
 */
export interface ILayoutSerializer {
  // 序列化
  serialize(container: LayoutContainer): SerializedLayout
  deserialize(data: SerializedLayout): LayoutContainer

  // 格式转换
  convertFromPanelFormat(panelConfig: string): SerializedLayout
  convertToPanelFormat(layout: SerializedLayout): string

  // 验证
  validate(data: SerializedLayout): { valid: boolean; errors: string[] }

  // 版本处理
  migrate(data: SerializedLayout, targetVersion: string): SerializedLayout
  getCompatibleVersions(): string[]
}

// ====== 预设布局类型 ======

/**
 * 布局模板
 */
export interface LayoutTemplate {
  id: string
  name: string
  description: string
  category: string
  thumbnail?: string
  layout: LayoutItem[]
  gridConfig: GridConfig
  tags?: string[]
  isBuiltIn?: boolean
  createdAt?: Date
}

/**
 * 布局模板管理器接口
 */
export interface ILayoutTemplateManager {
  // 模板管理
  getTemplates(): LayoutTemplate[]
  getTemplate(id: string): LayoutTemplate | undefined
  saveTemplate(template: Omit<LayoutTemplate, 'id' | 'createdAt'>): LayoutTemplate
  deleteTemplate(id: string): boolean

  // 模板应用
  applyTemplate(templateId: string, container: LayoutContainer): boolean
  createTemplateFromLayout(name: string, description: string, layout: LayoutItem[]): LayoutTemplate

  // 分类和搜索
  getTemplatesByCategory(category: string): LayoutTemplate[]
  searchTemplates(query: string): LayoutTemplate[]

  // 导入导出
  exportTemplate(templateId: string): string
  importTemplate(templateData: string): LayoutTemplate | null
}
