/**
 * Event System Types
 * 事件系统类型定义，为组件间通信提供标准化接口
 */

import type { BaseCanvasItem, Position, Size, Viewport, CanvasConfig } from './core'

// 事件映射接口
export interface EventMap {
  // === 画布核心事件 ===
  // 项目操作事件
  'canvas:item-add': { item: BaseCanvasItem }
  'canvas:item-remove': { ids: string[] }
  'canvas:item-update': { id: string; updates: Partial<BaseCanvasItem> }
  'canvas:item-move': { id: string; position: Position }
  'canvas:item-resize': { id: string; size: Size }
  'canvas:items-batch-update': { updates: Array<{ id: string; updates: Partial<BaseCanvasItem> }> }

  // 选择事件
  'canvas:item-select': { ids: string[] }
  'canvas:item-deselect': { ids: string[] }
  'canvas:selection-change': { selectedIds: string[] }
  'canvas:selection-clear': {}
  'canvas:select-all': {}

  // 布局事件
  'canvas:layout-change': { items: BaseCanvasItem[] }
  'canvas:layout-reset': {}
  'canvas:layout-fit-content': {}
  'canvas:layout-center': {}

  // === 拖拽系统事件 ===
  'drag:start': {
    source: DragSource
    data: any
    position: Position
  }
  'drag:move': {
    source: DragSource
    data: any
    position: Position
    target?: DropTarget
  }
  'drag:over': {
    source: DragSource
    target: DropTarget
    position: Position
    canDrop: boolean
  }
  'drag:drop': {
    source: DragSource
    target: DropTarget
    data: any
    position: Position
  }
  'drag:end': {
    source: DragSource
    success: boolean
  }
  'drag:cancel': {
    source: DragSource
  }

  // === 视口事件 ===
  'viewport:change': { viewport: Viewport }
  'viewport:zoom': { zoom: number; center?: Position }
  'viewport:pan': { offsetX: number; offsetY: number }
  'viewport:reset': {}
  'viewport:fit-content': {}

  // === 面板系统事件 ===
  'panel:mode-change': { mode: 'edit' | 'preview' }
  'panel:theme-change': { theme: string }
  'panel:config-update': { config: Partial<CanvasConfig> }
  'panel:save': { data: any }
  'panel:load': { data: any }
  'panel:reset': {}
  'panel:export': { format: string }
  'panel:import': { data: any; format: string }

  // === 工具栏事件 ===
  'toolbar:tool-select': { toolId: string }
  'toolbar:action': { action: string; payload?: any }
  'toolbar:mode-toggle': { mode: 'edit' | 'preview' }
  'toolbar:renderer-switch': { rendererId: string }

  // === 组件库事件 ===
  'library:card-select': { cardId: string }
  'library:card-drag-start': { cardId: string; cardData: any }
  'library:category-change': { categoryId: string }
  'library:search': { query: string }

  // === 属性面板事件 ===
  'inspector:property-change': {
    itemId: string
    property: string
    value: any
    oldValue: any
  }
  'inspector:config-update': {
    itemId: string
    config: Record<string, any>
  }
  'inspector:validate': {
    itemId: string
    errors: ValidationError[]
  }

  // === 渲染器事件 ===
  'renderer:switch': {
    fromId: string
    toId: string
    config?: any
  }
  'renderer:ready': { rendererId: string }
  'renderer:error': { rendererId: string; error: Error }
  'renderer:config-update': { rendererId: string; config: any }

  // === 历史记录事件 ===
  'history:undo': {}
  'history:redo': {}
  'history:save-state': { description?: string }
  'history:clear': {}

  // === 剪贴板事件 ===
  'clipboard:copy': { items: BaseCanvasItem[] }
  'clipboard:cut': { items: BaseCanvasItem[] }
  'clipboard:paste': { position?: Position }
  'clipboard:clear': {}

  // === 键盘事件 ===
  'keyboard:shortcut': {
    key: string
    modifiers: KeyboardModifiers
    action: string
  }
  'keyboard:delete': { ids: string[] }
  'keyboard:escape': {}

  // === 错误和通知事件 ===
  'error:occurred': { error: Error; context?: string }
  'warning:occurred': { message: string; context?: string }
  'notification:show': {
    type: 'success' | 'error' | 'warning' | 'info'
    message: string
    duration?: number
  }

  // === 插件事件 ===
  'plugin:register': { plugin: any }
  'plugin:unregister': { id: string }
  'plugin:error': { id: string; error: Error }
  'plugin:load': { id: string }
  'plugin:unload': { id: string }

  // === 数据源事件 ===
  'datasource:connect': { sourceId: string }
  'datasource:disconnect': { sourceId: string }
  'datasource:data-update': { sourceId: string; data: any }
  'datasource:error': { sourceId: string; error: Error }

  // === UI状态事件 ===
  'ui:sidebar-toggle': { side: 'left' | 'right'; collapsed: boolean }
  'ui:modal-open': { modalId: string; data?: any }
  'ui:modal-close': { modalId: string }
  'ui:loading-start': { context?: string }
  'ui:loading-end': { context?: string }
}

// 事件处理器类型
export type EventHandler<K extends keyof EventMap> = (data: EventMap[K]) => void

// 事件处理器映射
export type EventHandlerMap = {
  [K in keyof EventMap]?: EventHandler<K>[]
}

// 拖拽源类型
export interface DragSource {
  type: 'library' | 'canvas' | 'external'
  id: string
  data: any
  element?: HTMLElement
}

// 放置目标类型
export interface DropTarget {
  type: 'canvas' | 'container' | 'slot'
  id: string
  element: HTMLElement
  accepts: string[]
}

// 键盘修饰键
export interface KeyboardModifiers {
  ctrl: boolean
  shift: boolean
  alt: boolean
  meta: boolean
}

// 验证错误类型
export interface ValidationError {
  field: string
  message: string
  code: string
}

// 事件总线接口
export interface EventBus {
  // 事件订阅
  on<K extends keyof EventMap>(event: K, handler: EventHandler<K>): void

  // 一次性事件订阅
  once<K extends keyof EventMap>(event: K, handler: EventHandler<K>): void

  // 取消订阅
  off<K extends keyof EventMap>(event: K, handler: EventHandler<K>): void

  // 发射事件
  emit<K extends keyof EventMap>(event: K, data: EventMap[K]): void

  // 清除所有监听器
  clear(): void

  // 获取监听器数量
  listenerCount<K extends keyof EventMap>(event: K): number

  // 获取所有事件名
  eventNames(): (keyof EventMap)[]
}

// 事件中间件接口
export interface EventMiddleware {
  // 事件处理前的中间件
  before?<K extends keyof EventMap>(event: K, data: EventMap[K], next: () => void): void

  // 事件处理后的中间件
  after?<K extends keyof EventMap>(event: K, data: EventMap[K]): void

  // 错误处理中间件
  error?(error: Error, event: keyof EventMap, data: any): void
}

// 事件日志接口
export interface EventLog {
  timestamp: number
  event: keyof EventMap
  data: any
  source?: string
}

// 事件统计接口
export interface EventStats {
  totalEvents: number
  eventCounts: Record<keyof EventMap, number>
  averageHandleTime: Record<keyof EventMap, number>
  errors: number
}

// 高级事件总线接口
export interface AdvancedEventBus extends EventBus {
  // 中间件支持
  use(middleware: EventMiddleware): void
  removeMiddleware(middleware: EventMiddleware): void

  // 命名空间支持
  namespace(name: string): EventBus

  // 通配符支持
  onAny(handler: (event: keyof EventMap, data: any) => void): void
  offAny(handler: (event: keyof EventMap, data: any) => void): void

  // 事件日志
  enableLogging(): void
  disableLogging(): void
  getLogs(): EventLog[]
  clearLogs(): void

  // 事件统计
  getStats(): EventStats
  resetStats(): void

  // 批量事件
  emitBatch<K extends keyof EventMap>(events: Array<{ event: K; data: EventMap[K] }>): void

  // 延迟事件
  emitDelay<K extends keyof EventMap>(event: K, data: EventMap[K], delay: number): void

  // 防抖事件
  emitDebounce<K extends keyof EventMap>(event: K, data: EventMap[K], delay: number): void

  // 节流事件
  emitThrottle<K extends keyof EventMap>(event: K, data: EventMap[K], interval: number): void
}
