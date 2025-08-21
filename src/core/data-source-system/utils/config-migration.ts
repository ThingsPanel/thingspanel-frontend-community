/**
 * 配置迁移工具
 * 在Card2.1组件配置和数据源系统配置之间进行双向迁移
 */

import type {
  ComponentDataRequirement,
  DataSourceRequirement,
  SimpleDataSourceConfig,
  WidgetConfiguration,
  DataSourceDefinition,
  TriggerConfig
} from '../types/simple-types'

import type { DataSourceSystemConfig, ExecutionResult } from '../executor/types'

import { card2CompatibilityManager } from './card2-compatibility'

/**
 * Card2.1 WidgetConfiguration 格式
 */
interface Card2WidgetConfiguration {
  staticParams: Record<string, any>
  dataSourceBindings: Record<
    string,
    {
      dataSourceId: string
      fieldMappings: Record<string, string>
    }
  >
  metadata?: {
    version: string
    createdAt: Date
    updatedAt: Date
  }
}

/**
 * 配置迁移管理器
 */
export class ConfigMigrationManager {
  /**
   * 将Card2.1 WidgetConfiguration迁移到数据源系统SimpleDataSourceConfig
   */
  migrateFromCard2Widget(componentId: string, card2Config: Card2WidgetConfiguration): SimpleDataSourceConfig {
    console.log(`🔄 [Migration] Card2.1 → DataSource: ${componentId}`)

    // 转换数据源定义
    const dataSources = this.convertCard2DataSourceBindings(card2Config.dataSourceBindings)

    // 转换触发器配置（默认使用手动触发）
    const triggers: TriggerConfig[] = [
      {
        type: 'manual',
        config: {}
      }
    ]

    return {
      id: `migrated-${componentId}-${Date.now()}`,
      componentId,
      dataSources,
      triggers,
      enabled: true
    }
  }

  /**
   * 将数据源系统配置迁移到Card2.1 WidgetConfiguration
   */
  migrateToCard2Widget(config: SimpleDataSourceConfig): Card2WidgetConfiguration {
    console.log(`🔄 [Migration] DataSource → Card2.1: ${config.componentId}`)

    const staticParams: Record<string, any> = {}
    const dataSourceBindings: Record<string, any> = {}

    // 转换数据源定义为Card2.1绑定格式
    config.dataSources.forEach(ds => {
      dataSourceBindings[ds.id] = {
        dataSourceId: ds.id,
        fieldMappings: ds.fieldMapping || {}
      }
    })

    return {
      staticParams,
      dataSourceBindings,
      metadata: {
        version: '2.1.0',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    }
  }

  /**
   * 将Card2.1组件定义迁移为数据源系统配置
   */
  migrateCard2ComponentToDataSourceConfig(componentDef: any): DataSourceSystemConfig | null {
    console.log(`🔄 [Migration] Card2.1组件 → DataSource配置: ${componentDef.type}`)

    try {
      // 提取组件数据需求
      const requirement = card2CompatibilityManager.convertCard2ToDataSource(componentDef)

      if (!requirement || !requirement.dataSources?.length) {
        console.warn(`⚠️  组件 ${componentDef.type} 没有数据源需求`)
        return null
      }

      // 转换为数据源系统配置格式
      const config: DataSourceSystemConfig = {
        id: `component-${componentDef.type}-${Date.now()}`,
        name: `${componentDef.name || componentDef.type} 数据源配置`,
        description: `从Card2.1组件 ${componentDef.type} 迁移的配置`,
        type: this.inferPrimaryDataSourceType(requirement.dataSources),
        sourceConfig: this.buildSourceConfig(requirement.dataSources[0]),
        triggers: this.convertTriggersToDataSource(componentDef),
        processors: [],
        mapping: this.buildMappingConfig(requirement.dataSources[0]),
        metadata: {
          createdAt: Date.now(),
          updatedAt: Date.now(),
          version: '2.0.0',
          tags: ['migrated', 'card2.1', componentDef.category].filter(Boolean),
          originalComponent: {
            type: componentDef.type,
            name: componentDef.name,
            version: componentDef.version
          }
        }
      }

      return config
    } catch (error) {
      console.error(`❌ [Migration] 迁移失败:`, error)
      return null
    }
  }

  /**
   * 将数据源系统配置迁移为Card2.1组件兼容格式
   */
  migrateDataSourceConfigToCard2Component(config: DataSourceSystemConfig): {
    staticParams?: any[]
    dataSources?: any[]
    supportedDataSources?: string[]
  } {
    console.log(`🔄 [Migration] DataSource配置 → Card2.1: ${config.name}`)

    try {
      // 构建临时组件数据需求
      const requirement: ComponentDataRequirement = {
        componentId: config.id,
        componentName: config.name,
        dataSources: [
          {
            key: 'main',
            name: config.name,
            description: config.description || '',
            supportedTypes: [config.type as any],
            fieldMappings: this.convertMappingToCard2Format(config.mapping),
            required: true
          }
        ]
      }

      // 使用兼容性管理器转换
      const result = card2CompatibilityManager.convertDataSourceToCard2(requirement)

      return {
        ...result,
        supportedDataSources: [config.type]
      }
    } catch (error) {
      console.error(`❌ [Migration] 配置迁移失败:`, error)
      return {}
    }
  }

  /**
   * 批量迁移Card2.1组件配置
   */
  batchMigrateCard2Components(components: any[]): {
    success: DataSourceSystemConfig[]
    failed: { component: any; error: string }[]
  } {
    const success: DataSourceSystemConfig[] = []
    const failed: { component: any; error: string }[] = []

    components.forEach(component => {
      try {
        const config = this.migrateCard2ComponentToDataSourceConfig(component)
        if (config) {
          success.push(config)
        } else {
          failed.push({ component, error: '迁移返回null' })
        }
      } catch (error) {
        failed.push({
          component,
          error: error instanceof Error ? error.message : String(error)
        })
      }
    })

    console.log(`📊 [BatchMigration] 成功: ${success.length}, 失败: ${failed.length}`)
    return { success, failed }
  }

  /**
   * 验证迁移结果的正确性
   */
  validateMigration(
    original: any,
    migrated: DataSourceSystemConfig
  ): {
    valid: boolean
    score: number
    issues: string[]
    recommendations: string[]
  } {
    const issues: string[] = []
    const recommendations: string[] = []
    let score = 1.0

    // 检查基本信息是否保留
    if (!migrated.name || migrated.name.includes('undefined')) {
      issues.push('组件名称丢失或不正确')
      score -= 0.2
    }

    if (!migrated.description && original.description) {
      issues.push('组件描述信息丢失')
      score -= 0.1
    }

    // 检查数据源类型是否合理
    if (!['static', 'api', 'websocket', 'mqtt', 'database'].includes(migrated.type)) {
      issues.push(`不支持的数据源类型: ${migrated.type}`)
      score -= 0.3
    }

    // 检查触发器配置
    if (!migrated.triggers?.length) {
      recommendations.push('建议添加触发器配置以启用自动数据更新')
      score -= 0.1
    }

    // 检查字段映射
    if (!migrated.mapping?.rules?.length && original.dataSources?.length > 0) {
      recommendations.push('建议配置字段映射以保证数据结构一致性')
      score -= 0.1
    }

    return {
      valid: issues.length === 0,
      score: Math.max(0, score),
      issues,
      recommendations
    }
  }

  // ===== 私有辅助方法 =====

  private convertCard2DataSourceBindings(bindings: Record<string, any>): DataSourceDefinition[] {
    return Object.entries(bindings).map(([id, binding]) => ({
      id,
      type: 'static', // 默认为静态类型，实际使用时需要根据具体情况判断
      config: {
        data: binding.rawData ? JSON.parse(binding.rawData) : {}
      },
      fieldMapping: binding.fieldMappings
    }))
  }

  private inferPrimaryDataSourceType(dataSources: DataSourceRequirement[]): any {
    // 简单推断：取第一个支持的类型，优先级：api > websocket > static
    for (const ds of dataSources) {
      if (ds.supportedTypes?.includes('api')) return 'api'
      if (ds.supportedTypes?.includes('websocket')) return 'websocket'
    }
    return 'static'
  }

  private buildSourceConfig(dataSource: DataSourceRequirement): any {
    // 根据数据源类型构建配置
    return {
      // 基础配置，实际使用时需要根据具体数据源类型配置
    }
  }

  private convertTriggersToDataSource(componentDef: any): any[] {
    // 默认返回手动触发器，实际可以根据组件定义中的配置转换
    return [
      {
        type: 'manual',
        config: {},
        enabled: true,
        name: '手动触发'
      }
    ]
  }

  private buildMappingConfig(dataSource: DataSourceRequirement): any {
    if (!dataSource.fieldMappings || Object.keys(dataSource.fieldMappings).length === 0) {
      return undefined
    }

    const rules = Object.entries(dataSource.fieldMappings).map(([sourceField, mapping]) => ({
      sourcePath: sourceField,
      targetField: mapping.targetField,
      type: 'direct',
      defaultValue: mapping.defaultValue
    }))

    return {
      rules,
      strategy: 'merge'
    }
  }

  private convertMappingToCard2Format(mapping: any): Record<string, any> {
    if (!mapping?.rules) {
      return {}
    }

    const result: Record<string, any> = {}
    mapping.rules.forEach((rule: any) => {
      result[rule.sourcePath] = {
        targetField: rule.targetField,
        type: 'value',
        required: false,
        defaultValue: rule.defaultValue
      }
    })

    return result
  }

  /**
   * 获取迁移统计信息
   */
  getMigrationStats(): {
    supportedMigrations: string[]
    limitations: string[]
    bestPractices: string[]
  } {
    return {
      supportedMigrations: [
        'Card2.1 WidgetConfiguration → SimpleDataSourceConfig',
        'Card2.1 ComponentDefinition → DataSourceSystemConfig',
        'DataSourceSystemConfig → Card2.1兼容格式',
        '批量组件迁移',
        '迁移结果验证'
      ],
      limitations: [
        '复杂的JavaScript转换函数可能需要手动调整',
        '特殊的触发器配置可能需要重新配置',
        '自定义数据处理器需要单独迁移',
        'UI配置信息可能丢失'
      ],
      bestPractices: [
        '迁移前先备份原始配置',
        '迁移后验证数据流是否正常',
        '逐步迁移，不要一次性迁移所有组件',
        '保留原始配置作为参考'
      ]
    }
  }
}

// 导出单例实例
export const configMigrationManager = new ConfigMigrationManager()

// 导出便捷工具函数
export const migrationUtils = {
  /**
   * 快速从Card2.1组件提取数据源配置
   */
  quickExtractFromCard2(componentDef: any): DataSourceSystemConfig | null {
    return configMigrationManager.migrateCard2ComponentToDataSourceConfig(componentDef)
  },

  /**
   * 快速转换为Card2.1兼容格式
   */
  quickAdaptToCard2(config: DataSourceSystemConfig): any {
    return configMigrationManager.migrateDataSourceConfigToCard2Component(config)
  },

  /**
   * 验证迁移质量
   */
  checkMigrationQuality(original: any, migrated: DataSourceSystemConfig): number {
    return configMigrationManager.validateMigration(original, migrated).score
  }
}
