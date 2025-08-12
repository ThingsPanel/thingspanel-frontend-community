// 导出配置发现器
export { ConfigDiscovery } from './ConfigDiscovery'

// 导出组件数据需求系统（保留）
export * from './component-data-requirements'

// 导出组件注册表
import { useWidgetStore } from '../store/widget'

export const widgetRegistry = useWidgetStore()

// 导出状态管理器
import { useEditorStore } from '../store/editor'

export const stateManager = useEditorStore()
