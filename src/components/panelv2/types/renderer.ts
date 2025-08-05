/**
 * Renderer System Types
 * 渲染器系统接口定义，为多渲染器架构提供统一标准
 */

import type { BaseCanvasItem, Position, Size, Viewport } from './core'

// 渲染器能力声明
export interface RendererCapabilities {
  supportsDrag: boolean // 支持拖拽
  supportsResize: boolean // 支持调整大小
  supportsRotate: boolean // 支持旋转
  supportsGrouping: boolean // 支持分组
  supportsLayers: boolean // 支持图层管理
  supportsSnapping: boolean // 支持对齐辅助
  supportsPrecisePositioning: boolean // 支持精确定位
  supportsCustomCoordinates: boolean // 支持自定义坐标系
  supportsZoom: boolean // 支持缩放
  supportsMultiSelect: boolean // 支持多选
  supportsKeyboardShortcuts: boolean // 支持键盘快捷键
  supportsContextMenu: boolean // 支持右键菜单
  supportsUndo: boolean // 支持撤销
  supportsClipboard: boolean // 支持剪贴板操作
  supportsDataBinding: boolean // 支持数据绑定
  supportsThemes: boolean // 支持主题
  supportsExport: boolean // 支持导出
  supportsImport: boolean // 支持导入
}

// 渲染器事件接口
export interface RendererEvents {
  // 项目操作事件
  'item:add': (item: BaseCanvasItem) => void
  'item:remove': (ids: string[]) => void
  'item:update': (id: string, updates: Partial<BaseCanvasItem>) => void
  'item:move': (id: string, position: Position) => void
  'item:resize': (id: string, size: Size) => void
  'item:select': (ids: string[]) => void
  'item:deselect': (ids: string[]) => void
  'item:click': (id: string, event: MouseEvent) => void
  'item:doubleclick': (id: string, event: MouseEvent) => void
  'item:contextmenu': (id: string, event: MouseEvent) => void

  // 布局变化事件
  'layout:change': (items: BaseCanvasItem[]) => void
  'layout:update': (items: BaseCanvasItem[]) => void

  // 视口操作事件
  'viewport:change': (viewport: Viewport) => void
  'viewport:zoom': (zoom: number) => void
  'viewport:pan': (offset: { x: number; y: number }) => void

  // 拖拽事件
  'drag:start': (sourceIds: string[], position: Position) => void
  'drag:move': (sourceIds: string[], position: Position) => void
  'drag:end': (sourceIds: string[], position: Position) => void
  'drag:cancel': (sourceIds: string[]) => void

  // 选择事件
  'selection:change': (selectedIds: string[]) => void
  'selection:clear': () => void

  // 通用事件
  ready: () => void
  error: (error: Error) => void
  warning: (message: string) => void
}

// 渲染器配置接口
export interface RendererConfig {
  // 基础配置
  width?: number // 渲染器宽度
  height?: number // 渲染器高度
  readonly?: boolean // 只读模式

  // 交互配置
  enableDrag?: boolean // 启用拖拽
  enableResize?: boolean // 启用调整大小
  enableSelect?: boolean // 启用选择
  enableMultiSelect?: boolean // 启用多选

  // 视觉配置
  showGrid?: boolean // 显示网格
  gridSize?: number // 网格大小
  snapToGrid?: boolean // 对齐网格
  backgroundColor?: string // 背景色

  // 渲染器特定配置
  [key: string]: any
}

// 渲染器信息
export interface RendererInfo {
  id: string // 渲染器ID
  name: string // 渲染器名称
  version: string // 版本号
  description: string // 描述
  icon?: string // 图标
  author: string // 作者
  capabilities: RendererCapabilities // 能力声明
}

// 渲染器状态
export interface RendererState {
  initialized: boolean // 是否已初始化
  readonly: boolean // 只读状态
  selectedIds: string[] // 选中项目ID
  viewport: Viewport // 视口状态
  draggedIds: string[] // 拖拽中的项目ID
  loading: boolean // 加载状态
  error: Error | null // 错误状态
}

// 渲染器基础接口
export interface BaseRenderer {
  // 基础属性
  readonly id: string // 渲染器唯一标识
  readonly name: string // 渲染器名称
  readonly version: string // 版本号
  readonly capabilities: RendererCapabilities // 能力声明

  // 状态属性
  readonly state: RendererState // 当前状态
  readonly config: RendererConfig // 当前配置

  // 生命周期方法
  initialize(container: HTMLElement, config: RendererConfig): Promise<void>
  destroy(): Promise<void>
  resize(width: number, height: number): void

  // 数据管理
  setData(items: BaseCanvasItem[]): void
  getData(): BaseCanvasItem[]
  addItem(item: BaseCanvasItem): void
  removeItem(id: string): void
  updateItem(id: string, updates: Partial<BaseCanvasItem>): void

  // 渲染控制
  render(): void
  refresh(): void
  clear(): void

  // 视图操作
  setViewport(viewport: Viewport): void
  getViewport(): Viewport
  fitToContent(): void
  centerView(): void

  // 交互控制
  enableEdit(): void
  disableEdit(): void
  setReadonly(readonly: boolean): void

  // 选择操作
  selectItems(ids: string[]): void
  clearSelection(): void
  getSelection(): string[]

  // 事件系统
  on<K extends keyof RendererEvents>(event: K, handler: RendererEvents[K]): void
  off<K extends keyof RendererEvents>(event: K, handler: RendererEvents[K]): void
  emit<K extends keyof RendererEvents>(event: K, ...args: Parameters<RendererEvents[K]>): void

  // 配置更新
  updateConfig(config: Partial<RendererConfig>): void
  getConfig(): RendererConfig

  // 工具方法
  hitTest(position: Position): string | null
  getBounds(id: string): { position: Position; size: Size } | null
  isVisible(id: string): boolean
}

// 渲染器工厂接口
export interface RendererFactory {
  register(id: string, RendererClass: new () => BaseRenderer): void
  unregister(id: string): void
  create(id: string, config?: RendererConfig): BaseRenderer
  getAvailable(): RendererInfo[]
  hasRenderer(id: string): boolean
}

// 渲染器管理器接口
export interface RendererManager {
  // 渲染器管理
  getCurrentRenderer(): BaseRenderer | null
  setCurrentRenderer(renderer: BaseRenderer): void
  switchRenderer(id: string, config?: RendererConfig): Promise<void>

  // 工厂管理
  getFactory(): RendererFactory
  getAvailableRenderers(): RendererInfo[]

  // 事件代理
  on<K extends keyof RendererEvents>(event: K, handler: RendererEvents[K]): void
  off<K extends keyof RendererEvents>(event: K, handler: RendererEvents[K]): void

  // 生命周期
  initialize(container: HTMLElement): Promise<void>
  destroy(): Promise<void>
}

// 渲染器构造函数类型
export type RendererConstructor = new () => BaseRenderer

// 渲染器注册表类型
export type RendererRegistry = Map<string, RendererConstructor>

// 渲染器事件处理器类型
export type RendererEventHandler<K extends keyof RendererEvents> = RendererEvents[K]

// 渲染器插件接口
export interface RendererPlugin {
  id: string // 插件ID
  name: string // 插件名称
  version: string // 版本号
  rendererIds: string[] // 支持的渲染器ID

  // 插件生命周期
  install(renderer: BaseRenderer): void
  uninstall(renderer: BaseRenderer): void

  // 插件配置
  getConfig?(): Record<string, any>
  updateConfig?(config: Record<string, any>): void
}

// 渲染器扩展接口
export interface RendererExtension {
  id: string // 扩展ID
  name: string // 扩展名称
  extend(renderer: BaseRenderer): void // 扩展方法
}
