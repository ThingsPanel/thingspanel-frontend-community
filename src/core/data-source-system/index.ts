/**
 * 简化数据源系统 - 统一导出入口
 * 两个核心组件：配置器 + 执行器，简单且强大
 */

// 🎯 首先导入单例实例（避免引用错误）
import { simpleConfigGenerator } from './core/simple-config-generator'
import { simpleDataExecutor } from './core/simple-data-executor'
import { componentDataAdapter } from './adapters/component-data-adapter'
import { dataSourceIntegration, dataSourceAPI } from './adapters/integration-service'
import {
  card2CompatibilityManager,
  staticParamCompatibility,
  dataSourceCompatibility,
  componentRequirementCompatibility
} from './utils/card2-compatibility'
import { configMigrationManager, migrationUtils } from './utils/config-migration'

// 🎯 核心组件导出（简化的两个核心组件）
export { SimpleConfigGenerator, simpleConfigGenerator } from './core/simple-config-generator'

export { SimpleDataExecutor, simpleDataExecutor } from './core/simple-data-executor'

// 🏗️ 简化类型定义导出
export type * from './types/simple-types'

// 🔄 注意：移除了对 card2.1 的直接依赖，通过适配器实现集成

// 🎨 配置表单组件导出
export { default as DataSourceConfigForm } from './components/DataSourceConfigForm.vue'

// 🤝 Card2.1兼容性工具导出
export {
  Card2CompatibilityManager,
  card2CompatibilityManager,
  staticParamCompatibility,
  dataSourceCompatibility,
  componentRequirementCompatibility
} from './utils/card2-compatibility'

// 🔄 配置迁移工具导出
export { ConfigMigrationManager, configMigrationManager, migrationUtils } from './utils/config-migration'

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
  api: dataSourceAPI,

  // === Card2.1兼容性增强 ===

  // Card2.1兼容性管理器
  card2Compatibility: card2CompatibilityManager,

  // 配置迁移管理器
  migrationManager: configMigrationManager,

  // 便捷工具
  utils: {
    migration: migrationUtils,
    compatibility: {
      staticParam: staticParamCompatibility,
      dataSource: dataSourceCompatibility,
      componentRequirement: componentRequirementCompatibility
    }
  }
}

// 🚀 Card2.1组件集成快速入口
export const card2Integration = {
  /**
   * 从Card2.1组件定义提取数据需求
   */
  extractRequirement: (componentDef: any) => {
    return card2CompatibilityManager.convertCard2ToDataSource(componentDef)
  },

  /**
   * 为Card2.1组件适配数据
   */
  adaptData: (componentData: any, componentId: string) => {
    return componentDataAdapter.autoAdapt(componentData, componentId)
  },

  /**
   * 迁移Card2.1组件配置
   */
  migrateConfig: (componentDef: any) => {
    return configMigrationManager.migrateCard2ComponentToDataSourceConfig(componentDef)
  },

  /**
   * 验证Card2.1兼容性
   */
  validateCompatibility: (componentDef: any) => {
    return card2CompatibilityManager.isCard2Component(componentDef)
  }
}
