/**
 * 类型定义统一导出
 */

// 基础类型
export type { GraphData, Position, Size, CanvasState, TransformOperation } from './base-types'

// 编辑器类型
export type { EditorConfig, KanbanConfig, DashboardConfig } from './editor'

// 渲染器类型
export type { RendererType, IRenderer, RendererConfig } from './renderer'

// 组件类型
export type { WidgetType, WidgetConfig } from './widget'

// 插件类型
export type { IPlugin, PluginConfig } from './plugin'
