/**
 * Toolbar Components
 * 工具栏组件统一导出
 */

export { default as MainToolbar } from './MainToolbar.vue'
export { default as CommonToolbar } from './CommonToolbar.vue'
export { default as VisualizationToolbar } from './VisualizationToolbar.vue'

// 重新导出看板工具栏
export { KanbanToolbar, type KanbanToolbarConfig } from '../renderers/kanban'

export interface VisualizationToolbarConfig {
  zoom: number
  gridSize: number
  showRuler: boolean
  showGuides: boolean
  snapToGrid: boolean
}

// 工具栏事件类型
export interface ToolbarEvents {
  'mode-change': (mode: 'edit' | 'preview') => void
  'renderer-change': (rendererId: string) => void
  save: () => void
  undo: () => void
  redo: () => void
  reset: () => void
  'kanban-config-change': (config: Partial<KanbanToolbarConfig>) => void
  'visualization-config-change': (config: Partial<VisualizationToolbarConfig>) => void
  'zoom-in': () => void
  'zoom-out': () => void
  'reset-zoom': () => void
  'fit-content': () => void
  'center-view': () => void
}
