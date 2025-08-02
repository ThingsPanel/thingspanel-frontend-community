// 可视化编辑器工具栏组件入口文件

export { default as VisualEditorToolbar } from './VisualEditorToolbar.vue'
export { default as CommonToolbar } from './CommonToolbar.vue'

// 工具栏相关类型定义
export interface RendererOption {
  value: string
  label: string
  icon?: string
}

export interface ToolbarConfig {
  showModeSwitch?: boolean
  showRendererSelect?: boolean
  showViewControls?: boolean
  showPanelControls?: boolean
  readonly?: boolean
}

export interface ToolbarEmits {
  'mode-change': [mode: 'edit' | 'preview']
  'renderer-change': [rendererId: string]
  save: []
  undo: []
  redo: []
  reset: []
  'clear-all': []
  'zoom-in': []
  'zoom-out': []
  'reset-zoom': []
  'fit-content': []
  'center-view': []
  'toggle-left-panel': []
  'toggle-right-panel': []
}
