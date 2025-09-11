/**
 * Visual Editor - 对外API入口
 * 新统一架构入口
 */

// 主组件导出
export { default as PanelEditor } from '@/components/visual-editor/PanelEditor.vue'

// 新架构Hook导出 - 替代旧的useEditor和createEditor
export { useVisualEditor } from '@/store/modules/visual-editor'

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
