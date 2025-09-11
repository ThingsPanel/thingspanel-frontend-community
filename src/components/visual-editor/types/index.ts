/**
 * 类型定义统一导出
 */

// 基础类型
export type { GraphData, Position, Size, CanvasState, TransformOperation } from '@/components/visual-editor/types/base-types'

// 编辑器类型
export type { EditorConfig, KanbanConfig, DashboardConfig } from '@/components/visual-editor/types/editor'

// 渲染器类型
export type { RendererType, IRenderer, RendererConfig } from '@/components/visual-editor/types/renderer'

// 组件类型
export type { WidgetType, WidgetConfig } from '@/components/visual-editor/types/widget'

// 插件类型
export type { IPlugin, PluginConfig } from '@/components/visual-editor/types/plugin'
