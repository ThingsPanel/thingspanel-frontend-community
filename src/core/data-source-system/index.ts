/**
 * 简化数据源系统 - 统一导出入口
 * 两个核心组件：配置器 + 执行器，简单且强大
 */

// 🎯 首先导入单例实例（避免引用错误）
import { simpleConfigGenerator } from './core/simple-config-generator'
import { simpleDataExecutor } from './core/simple-data-executor'
import { componentDataAdapter } from './adapters/component-data-adapter'
import { dataSourceIntegration, dataSourceAPI } from './adapters/integration-service'

// 🎯 核心组件导出（简化的两个核心组件）
export { SimpleConfigGenerator, simpleConfigGenerator } from './core/simple-config-generator'

export { SimpleDataExecutor, simpleDataExecutor } from './core/simple-data-executor'

// 🏗️ 简化类型定义导出
export type * from './types/simple-types'

// 🔄 注意：移除了对 card2.1 的直接依赖，通过适配器实现集成

// 🎨 配置表单组件导出
export { default as DataSourceConfigForm } from './components/DataSourceConfigForm.vue'

// 🔌 组件集成适配器导出
export {
  VisualEditorAdapter,
  Card21Adapter,
  StandardComponentAdapter,
  UnifiedComponentDataAdapter,
  componentDataAdapter,
  visualEditorAdapter,
  card21Adapter,
  standardComponentAdapter
} from './adapters/component-data-adapter'

// 🌐 集成服务导出
export { DataSourceIntegrationService, dataSourceIntegration, dataSourceAPI } from './adapters/integration-service'

// 📋 便捷使用的默认实例（现在可以安全引用）
export const dataSourceSystem = {
  // 核心组件
  configGenerator: simpleConfigGenerator,
  dataExecutor: simpleDataExecutor,

  // 适配器
  adapter: componentDataAdapter,

  // 集成服务
  integration: dataSourceIntegration,

  // 便捷API
  api: dataSourceAPI
}
