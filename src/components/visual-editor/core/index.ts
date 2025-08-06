// 导出数据源管理器
export { DataSourceManager } from './universal-data-source-manager'
export { dataSourceManager } from './universal-data-source-manager'

// 导出配置发现器
export { ConfigDiscovery } from './ConfigDiscovery'

// 导出数据源注册表
export { dataSourceRegistry } from './data-source-registry'

// 导出组件注册表
import { useWidgetStore } from '../store/widget'

export const widgetRegistry = useWidgetStore()

// 导出状态管理器
import { useEditorStore } from '../store/editor'

export const stateManager = useEditorStore()
