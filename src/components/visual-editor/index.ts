/**
 * Visual Editor - 对外API入口
 * 按照架构设计的黑盒模块，集成 Card 2.0 支持
 */

// 主组件导出
export { default as PanelEditor } from './PanelEditor.vue'

// Hook导出
export { useEditor, createEditor } from './hooks/useEditor'

// Card 2.0 集成
export { useCard2Integration } from './hooks/useCard2Integration'

// 类型导出
export type {
  EditorConfig,
  RendererType,
  KanbanConfig,
  DashboardConfig,
  GraphData,
  WidgetType,
  // Card 2.0 相关类型
  IComponentDefinition,
  IComponentInstance,
  IComponentMeta
} from './types'
