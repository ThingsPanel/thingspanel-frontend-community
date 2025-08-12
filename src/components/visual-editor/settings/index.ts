// src/components/visual-editor/settings/index.ts
import { registerSettingPanel } from './core/registry'

// 导入所有设置表单组件
import BaseSettingsForm from './components/BaseSettingsForm.vue'
import InteractionSettingsForm from './components/InteractionSettingsForm.vue'
import TextWidgetSettings from './components/TextWidgetSettings.vue'
// import DataSourceSelector from './data/DataSourceSelector.vue' // 临时注释，文件不存在

/**
 * 初始化并注册所有组件的设置面板
 */
export function initializeSettings() {
  // 注册文本组件的设置
  registerSettingPanel({
    type: 'text', // 假设我们的文本组件类型是 'text'
    props: TextWidgetSettings,
    base: BaseSettingsForm,
    interaction: InteractionSettingsForm,
    // dataSource: DataSourceSelector // 临时注释，组件不存在
  })

  // 在这里可以注册更多其他组件的设置...
  // registerSettingPanel({ type: 'image', ... });
}

// 导出 SettingsPanel 组件，使其可以在编辑器中使用
export { default as SettingsPanel } from './SettingsPanel.vue'
