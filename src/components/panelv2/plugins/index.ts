// src/components/panelv2/plugins/index.ts

// 导出类型
export * from './types'

// 导出核心类
export { PluginManager } from './PluginManager'
export { EventBus, globalEventBus, createNamespacedEventBus } from './EventBus'

// 导出加载器
export { ModuleLoader } from './loaders/ModuleLoader'
export { JsonLoader } from './loaders/JsonLoader'

// 导出组合式 API
export { providePluginManager, injectPluginManager, usePluginManager, usePluginContext } from './composables/usePlugin'

// 导出组件
export { default as PluginConfig } from './PluginConfig.vue'

// 导出示例插件
export { ChartPlugin } from './examples/ChartPlugin'
