// 导出数据源管理器（增强版）
export { DataSourceManager } from './universal-data-source-manager'
export { dataSourceManager } from './universal-data-source-manager'

// 导出配置发现器
export { ConfigDiscovery } from './ConfigDiscovery'

// 导出数据源注册表
export { dataSourceRegistry } from './data-source-registry'

// 新增模块：数据源配置系统MVP
export * from './data-source-types'
export { dataSourceValidator } from './data-source-validator'
export { card2DataBindingAdapter, Card2DataBindingAdapter } from './card2-data-binding-adapter'

// 导出组件注册表
import { useWidgetStore } from '../store/widget'

export const widgetRegistry = useWidgetStore()

// 导出状态管理器
import { useEditorStore } from '../store/editor'

export const stateManager = useEditorStore()
