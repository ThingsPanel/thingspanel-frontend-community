/**
 * @file ConfigurationImportExport.ts
 * @description 配置导入导出工具类，处理组件 ID 映射和依赖管理
 */

import type { DataSourceConfiguration } from '@/core/data-architecture/index'
import type { configurationIntegrationBridge } from '@/components/visual-editor/configuration/ConfigurationIntegrationBridge'
import { smartDeepClone } from '@/utils/deep-clone'

/**
 * 导出配置的标准格式
 */
export interface ExportedConfiguration {
  /** 导出格式版本 */
  version: string
  /** 导出时间戳 */
  exportTime: number
  /** 组件类型（可选） */
  componentType?: string
  /** 元数据信息 */
  metadata: {
    /** 原始组件 ID */
    originalComponentId: string
    /** 导出来源 */
    exportSource: string
    /** 依赖的外部组件 ID 列表 */
    dependencies: string[]
    /** 配置项统计 */
    statistics: {
      dataSourceCount: number
      interactionCount: number
      httpConfigCount: number
    }
  }
  /** 实际配置数据 */
  data: {
    /** 数据源配置 */
    dataSourceConfiguration?: any
    /** 组件配置 */
    componentConfiguration?: any
    /** 交互配置 */
    interactionConfiguration?: any[]
  }
  /** ID 映射信息 */
  mapping: {
    /** 占位符映射表 */
    placeholders: {
      [placeholder: string]: 'current_component' | 'external_component'
    }
    /** 组件依赖关系 */
    dependencies: {
      [externalComponentId: string]: {
        usage: string[] // 使用位置描述
        required: boolean // 是否必需
      }
    }
  }
}

/**
 * 导入结果接口
 */
export interface ImportResult {
  /** 是否成功 */
  success: boolean
  /** 错误信息 */
  errors: string[]
  /** 警告信息 */
  warnings: string[]
  /** 导入的配置数据 */
  importedData?: any
  /** 依赖验证结果 */
  dependencyValidation?: {
    missing: string[]
    found: string[]
  }
}

/**
 * 导入预览结果
 */
export interface ImportPreview {
  /** 基本信息 */
  basicInfo: {
    version: string
    exportTime: number
    componentType: string
    exportSource: string
  }
  /** 配置统计 */
  statistics: {
    dataSourceCount: number
    interactionCount: number
    httpConfigCount: number
  }
  /** 外部依赖组件ID列表 */
  dependencies: string[]
  /** 冲突描述列表 */
  conflicts: string[]
}

/**
 * 单数据源导出配置的标准格式
 */
export interface SingleDataSourceExport {
  /** 导出格式版本 */
  version: string
  /** 导出类型标识 */
  exportType: 'single-datasource'
  /** 导出时间戳 */
  exportTime: number
  /** 数据源元数据 */
  sourceMetadata: {
    /** 原始数据源ID */
    originalSourceId: string
    /** 在原组件中的索引位置 */
    sourceIndex: number
    /** 原始组件ID */
    originalComponentId: string
    /** 导出来源 */
    exportSource: string
    /** 组件类型（可选） */
    componentType?: string
  }
  /** 数据源配置内容 */
  dataSourceConfig: {
    /** 数据项配置 */
    dataItems: any[]
    /** 合并策略 */
    mergeStrategy: any
    /** 数据处理配置 */
    processing?: any
  }
  /** 相关配置 */
  relatedConfig: {
    /** 相关的交互配置 */
    interactions: any[]
    /** 相关的HTTP绑定 */
    httpBindings: any[]
  }
  /** 组件ID映射信息 */
  mapping: {
    /** 占位符映射 */
    placeholders: Record<string, string>
    /** 外部依赖 */
    dependencies: string[]
  }
}

/**
 * 单数据源导入预览结果
 */
export interface SingleDataSourceImportPreview {
  /** 基本信息 */
  basicInfo: {
    version: string
    exportType: string
    exportTime: number
    originalSourceId: string
    sourceIndex: number
    exportSource: string
  }
  /** 数据源配置摘要 */
  configSummary: {
    dataItemCount: number
    mergeStrategy: string
    hasProcessing: boolean
  }
  /** 相关配置统计 */
  relatedConfig: {
    interactionCount: number
    httpBindingCount: number
  }
  /** 外部依赖 */
  dependencies: string[]
  /** 冲突检测 */
  conflicts: string[]
  /** 可用的目标槽位 */
  availableSlots: Array<{
    slotId: string
    slotIndex: number
    isEmpty: boolean
    currentConfig?: any
  }>
}

/**
 * 配置导出器类
 */
export class ConfigurationExporter {
  private readonly CURRENT_COMPONENT_PLACEHOLDER = '__CURRENT_COMPONENT__'
  private readonly EXPORT_VERSION = '1.0.0'

  /**
   * 导出组件配置为 JSON
   * @param componentId 要导出的组件 ID
   * @param configurationManager 配置管理器实例
   * @returns 导出的配置对象
   */
  async exportConfiguration(
    componentId: string,
    configurationManager: any,
    componentType?: string
  ): Promise<ExportedConfiguration> {
    console.log(`🔄 [ConfigurationExporter] 开始导出组件配置: ${componentId}`)

    // 获取完整配置
    const fullConfig = configurationManager.getConfiguration(componentId)
    if (!fullConfig) {
      throw new Error(`组件 ${componentId} 的配置不存在`)
    }

    // 分析和处理组件 ID
    const { processedConfig, dependencies, statistics } = this.processConfigurationForExport(fullConfig, componentId)

    // 构建导出格式
    const exportedConfig: ExportedConfiguration = {
      version: this.EXPORT_VERSION,
      exportTime: Date.now(),
      componentType,
      metadata: {
        originalComponentId: componentId,
        exportSource: 'SimpleConfigurationEditor',
        dependencies,
        statistics
      },
      data: {
        dataSourceConfiguration: processedConfig.dataSource,
        componentConfiguration: processedConfig.component,
        interactionConfiguration: processedConfig.interaction
      },
      mapping: {
        placeholders: {
          [this.CURRENT_COMPONENT_PLACEHOLDER]: 'current_component'
        },
        dependencies: this.buildDependencyMapping(dependencies, processedConfig)
      }
    }

    console.log(`✅ [ConfigurationExporter] 导出完成，依赖组件: ${dependencies.length} 个`)
    return exportedConfig
  }

  /**
   * 处理配置中的组件 ID 引用
   */
  private processConfigurationForExport(
    config: any,
    currentComponentId: string
  ): {
    processedConfig: any
    dependencies: string[]
    statistics: any
  } {
    const dependencies = new Set<string>()
    let httpConfigCount = 0
    let interactionCount = 0

    const processValue = (obj: any, path: string = ''): any => {
      if (obj === null || obj === undefined) {
        return obj
      }

      // 处理字符串类型的 ID 引用
      if (typeof obj === 'string') {
        return this.processStringValue(obj, currentComponentId, dependencies, path)
      }

      // 处理数组
      if (Array.isArray(obj)) {
        return obj.map((item, index) => processValue(item, `${path}[${index}]`))
      }

      // 处理对象
      if (typeof obj === 'object') {
        const processed: any = {}

        for (const [key, value] of Object.entries(obj)) {
          const currentPath = path ? `${path}.${key}` : key

          // 统计配置项数量
          if (key === 'responses' && Array.isArray(value)) {
            interactionCount += (value as any[]).length
          }
          if (key === 'httpConfigData' || (key === 'type' && value === 'http')) {
            httpConfigCount++
          }

          // 特殊处理组件 ID 字段
          if (this.isComponentIdField(key) && typeof value === 'string') {
            processed[key] = this.processComponentId(value, currentComponentId, dependencies, currentPath)
          } else {
            processed[key] = processValue(value, currentPath)
          }
        }

        return processed
      }

      return obj
    }

    const processedConfig = processValue(smartDeepClone(config))

    return {
      processedConfig,
      dependencies: Array.from(dependencies),
      statistics: {
        dataSourceCount: config.dataSource?.dataSources?.length || 0,
        interactionCount,
        httpConfigCount
      }
    }
  }

  /**
   * 处理字符串值中的组件 ID 引用
   */
  private processStringValue(
    value: string,
    currentComponentId: string,
    dependencies: Set<string>,
    path: string
  ): string {
    // 处理变量名中的组件 ID（如：device_id_comp_123）
    if (value.includes(currentComponentId)) {
      console.log(`🔄 [ConfigurationExporter] 替换变量名中的组件ID: ${value} (路径: ${path})`)
      return value.replace(new RegExp(currentComponentId, 'g'), this.CURRENT_COMPONENT_PLACEHOLDER)
    }

    // 检测其他组件 ID 引用
    const componentIdPattern = /comp_[a-zA-Z0-9_-]+/g
    const matches = value.match(componentIdPattern)
    if (matches) {
      matches.forEach(match => {
        if (match !== currentComponentId) {
          dependencies.add(match)
          console.log(`🔍 [ConfigurationExporter] 发现外部组件依赖: ${match} (路径: ${path})`)
        }
      })
    }

    return value
  }

  /**
   * 处理组件 ID 字段
   */
  private processComponentId(
    componentId: string,
    currentComponentId: string,
    dependencies: Set<string>,
    path: string
  ): string {
    if (componentId === currentComponentId) {
      console.log(
        `🔄 [ConfigurationExporter] 替换组件ID字段: ${componentId} → ${this.CURRENT_COMPONENT_PLACEHOLDER} (路径: ${path})`
      )
      return this.CURRENT_COMPONENT_PLACEHOLDER
    } else {
      dependencies.add(componentId)
      console.log(`🔍 [ConfigurationExporter] 保留外部组件ID: ${componentId} (路径: ${path})`)
      return componentId
    }
  }

  /**
   * 判断是否为组件 ID 字段
   */
  private isComponentIdField(key: string): boolean {
    const componentIdFields = ['componentId', 'targetComponentId', 'sourceComponentId']
    return componentIdFields.includes(key)
  }

  /**
   * 构建依赖映射信息
   */
  private buildDependencyMapping(dependencies: string[], processedConfig: any): any {
    const mapping: any = {}

    dependencies.forEach(depId => {
      mapping[depId] = {
        usage: this.findComponentUsage(depId, processedConfig),
        required: true
      }
    })

    return mapping
  }

  /**
   * 查找组件的使用位置
   */
  private findComponentUsage(componentId: string, config: any): string[] {
    const usage: string[] = []

    // 递归查找使用位置
    const findUsage = (obj: any, path: string = ''): void => {
      if (typeof obj === 'string' && obj.includes(componentId)) {
        usage.push(path || 'root')
      } else if (typeof obj === 'object' && obj !== null) {
        for (const [key, value] of Object.entries(obj)) {
          const currentPath = path ? `${path}.${key}` : key
          findUsage(value, currentPath)
        }
      } else if (Array.isArray(obj)) {
        obj.forEach((item, index) => {
          findUsage(item, `${path}[${index}]`)
        })
      }
    }

    findUsage(config)
    return usage
  }

  /**
   * 下载配置为 JSON 文件
   */
  downloadConfigurationAsJson(config: ExportedConfiguration, filename?: string): void {
    const jsonStr = JSON.stringify(config, null, 2)
    const blob = new Blob([jsonStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = filename || `component-config-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    console.log(`📁 [ConfigurationExporter] 配置已下载为: ${a.download}`)
  }
}

/**
 * 配置导入器类
 */
export class ConfigurationImporter {
  private readonly CURRENT_COMPONENT_PLACEHOLDER = '__CURRENT_COMPONENT__'

  /**
   * 生成导入预览，不实际应用
   * @param configJson 导入的 JSON 配置
   * @param targetComponentId 目标组件 ID
   * @param configurationManager 配置管理器实例
   * @returns 导入预览结果
   */
  generateImportPreview(
    configJson: string | ExportedConfiguration,
    targetComponentId: string,
    configurationManager: any,
    availableComponents?: any[]
  ): ImportPreview {
    console.log(`🔍 [ConfigurationImporter] 开始预览导入到组件: ${targetComponentId}`)

    try {
      const config = typeof configJson === 'string' ? JSON.parse(configJson) : configJson

      if (!this.validateConfigurationFormat(config)) {
        throw new Error('配置格式无效')
      }

      // 检查依赖组件
      const dependencies = this.checkDependencies(config, availableComponents)

      // 检查配置冲突
      const conflicts = this.checkConfigurationConflicts(config, targetComponentId, configurationManager)

      const canImport = dependencies.missing.length === 0 && !conflicts.dataSource && !conflicts.component

      // 格式化为模板期望的结构
      const conflictList: string[] = []
      if (conflicts.dataSource) conflictList.push('数据源配置冲突')
      if (conflicts.component) conflictList.push('组件配置冲突')
      if (conflicts.interaction) conflictList.push('交互配置冲突')

      const preview: ImportPreview = {
        basicInfo: {
          version: config.version,
          exportTime: config.exportTime,
          componentType: config.metadata?.componentType || '',
          exportSource: config.metadata?.exportSource || 'ThingsPanel'
        },
        statistics: {
          dataSourceCount: config.metadata?.statistics?.dataSourceCount || 0,
          interactionCount: config.metadata?.statistics?.interactionCount || 0,
          httpConfigCount: config.metadata?.statistics?.httpConfigCount || 0
        },
        dependencies: dependencies.found,
        conflicts: conflictList
      }

      console.log(`✅ [ConfigurationImporter] 预览完成，可导入: ${canImport}`)
      return preview
    } catch (error) {
      console.error(`❌ [ConfigurationImporter] 预览失败:`, error)
      throw new Error(`导入预览失败: ${error.message}`)
    }
  }

  /**
   * 执行配置导入
   * @param configJson 导入的 JSON 配置
   * @param targetComponentId 目标组件 ID
   * @param configurationManager 配置管理器实例
   * @param options 导入选项
   * @returns 导入结果
   */
  async importConfiguration(
    configJson: string | ExportedConfiguration,
    targetComponentId: string,
    configurationManager: any,
    options: {
      overwriteExisting?: boolean
      skipMissingDependencies?: boolean
    } = {}
  ): Promise<ImportResult> {
    console.log(`📥 [ConfigurationImporter] 开始导入配置到组件: ${targetComponentId}`)

    try {
      const config = typeof configJson === 'string' ? JSON.parse(configJson) : configJson

      if (!this.validateConfigurationFormat(config)) {
        throw new Error('配置格式无效')
      }

      const errors: string[] = []
      const warnings: string[] = []

      // 处理组件 ID 映射
      const { processedConfig, missingDependencies } = this.processConfigurationForImport(config, targetComponentId)

      // 检查缺失依赖
      if (missingDependencies.length > 0 && !options.skipMissingDependencies) {
        errors.push(`缺失依赖组件: ${missingDependencies.join(', ')}`)
        return {
          success: false,
          errors,
          warnings
        }
      }

      if (missingDependencies.length > 0) {
        warnings.push(`跳过缺失的依赖组件: ${missingDependencies.join(', ')}`)
      }

      // 应用配置
      await this.applyConfiguration(processedConfig, targetComponentId, configurationManager, options)

      console.log(`✅ [ConfigurationImporter] 配置导入成功`)
      return {
        success: true,
        errors,
        warnings,
        importedData: processedConfig,
        dependencyValidation: {
          missing: missingDependencies,
          found: Object.keys(config.mapping.dependencies || {}).filter(dep => !missingDependencies.includes(dep))
        }
      }
    } catch (error) {
      console.error(`❌ [ConfigurationImporter] 导入失败:`, error)
      return {
        success: false,
        errors: [error.message],
        warnings: []
      }
    }
  }

  /**
   * 验证配置格式
   */
  private validateConfigurationFormat(config: any): boolean {
    return !!(config && config.version && config.exportTime && config.metadata && config.data)
  }

  /**
   * 检查依赖组件
   */
  private checkDependencies(
    config: ExportedConfiguration,
    availableComponents?: any[]
  ): {
    found: string[]
    missing: string[]
    conflicts: string[]
  } {
    const dependencies = config.metadata.dependencies || []
    const availableIds = availableComponents?.map(comp => comp.id) || []

    const found = dependencies.filter(dep => availableIds.includes(dep))
    const missing = dependencies.filter(dep => !availableIds.includes(dep))
    const conflicts: string[] = [] // TODO: 实现冲突检测逻辑

    return { found, missing, conflicts }
  }

  /**
   * 检查配置冲突
   */
  private checkConfigurationConflicts(
    config: ExportedConfiguration,
    targetComponentId: string,
    configurationManager: any
  ): { dataSource: boolean; component: boolean; interaction: boolean } {
    try {
      const existingConfig = configurationManager?.getConfiguration?.(targetComponentId)

      // 如果没有现有配置或配置管理器无效，则没有冲突
      if (!existingConfig || !configurationManager) {
        return {
          dataSource: false,
          component: false,
          interaction: false
        }
      }

      // 检查是否存在会被覆盖的重要配置
      // 只有在现有配置非空且导入配置也非空时才认为是冲突
      return {
        dataSource: !!(
          existingConfig?.dataSource?.dataSources?.length && config.data.dataSourceConfiguration?.dataSources?.length
        ),
        component: !!(
          existingConfig?.component?.properties &&
          Object.keys(existingConfig.component.properties).length &&
          config.data.componentConfiguration?.properties &&
          Object.keys(config.data.componentConfiguration.properties).length
        ),
        interaction: !!(
          existingConfig?.interaction &&
          Object.keys(existingConfig.interaction).length &&
          config.data.interactionConfiguration &&
          Object.keys(config.data.interactionConfiguration).length
        )
      }
    } catch (error) {
      console.warn('❌ [ConfigurationImporter] 冲突检测失败:', error)
      // 检测失败时认为没有冲突，允许导入
      return {
        dataSource: false,
        component: false,
        interaction: false
      }
    }
  }

  /**
   * 处理导入配置中的组件 ID 映射
   */
  private processConfigurationForImport(
    config: ExportedConfiguration,
    targetComponentId: string
  ): {
    processedConfig: any
    missingDependencies: string[]
  } {
    const missingDependencies: string[] = []

    const processValue = (obj: any): any => {
      if (obj === null || obj === undefined) {
        return obj
      }

      // 处理字符串中的占位符
      if (typeof obj === 'string') {
        if (obj === this.CURRENT_COMPONENT_PLACEHOLDER) {
          console.log(`🔄 [ConfigurationImporter] 恢复组件ID: ${obj} → ${targetComponentId}`)
          return targetComponentId
        }

        // 处理变量名中的占位符
        if (obj.includes(this.CURRENT_COMPONENT_PLACEHOLDER)) {
          const restored = obj.replace(new RegExp(this.CURRENT_COMPONENT_PLACEHOLDER, 'g'), targetComponentId)
          console.log(`🔄 [ConfigurationImporter] 恢复变量名: ${obj} → ${restored}`)
          return restored
        }

        return obj
      }

      // 处理数组
      if (Array.isArray(obj)) {
        return obj.map(item => processValue(item))
      }

      // 处理对象
      if (typeof obj === 'object') {
        const processed: any = {}
        for (const [key, value] of Object.entries(obj)) {
          processed[key] = processValue(value)
        }
        return processed
      }

      return obj
    }

    const processedConfig = {
      dataSource: config.data.dataSourceConfiguration ? processValue(config.data.dataSourceConfiguration) : undefined,
      component: config.data.componentConfiguration ? processValue(config.data.componentConfiguration) : undefined,
      interaction: config.data.interactionConfiguration ? processValue(config.data.interactionConfiguration) : undefined
    }

    return {
      processedConfig,
      missingDependencies
    }
  }

  /**
   * 应用配置到目标组件
   */
  private async applyConfiguration(
    processedConfig: any,
    targetComponentId: string,
    configurationManager: any,
    options: any
  ): Promise<void> {
    // 检查配置管理器是否有效
    if (!configurationManager || typeof configurationManager.updateConfiguration !== 'function') {
      const error = '配置管理器无效或未提供，无法应用配置'
      console.error(`❌ [ConfigurationImporter] ${error}`)
      throw new Error(error)
    }

    // 应用数据源配置
    if (processedConfig.dataSource) {
      console.log(`📊 [ConfigurationImporter] 应用数据源配置`)
      configurationManager.updateConfiguration(targetComponentId, 'dataSource', processedConfig.dataSource)
    }

    // 应用组件配置
    if (processedConfig.component) {
      console.log(`⚙️ [ConfigurationImporter] 应用组件配置`)
      configurationManager.updateConfiguration(targetComponentId, 'component', processedConfig.component)
    }

    // 应用交互配置
    if (processedConfig.interaction) {
      console.log(`🎯 [ConfigurationImporter] 应用交互配置`)
      configurationManager.updateConfiguration(targetComponentId, 'interaction', processedConfig.interaction)
    }
  }
}

/**
 * 单数据源配置导出器类
 * 专门用于导出单个数据源配置，实现跨组件的灵活配置迁移
 */
export class SingleDataSourceExporter {
  private readonly CURRENT_COMPONENT_PLACEHOLDER = '__CURRENT_COMPONENT__'
  private readonly EXPORT_VERSION = '1.0.0'

  /**
   * 导出指定数据源的配置
   * @param componentId 组件ID
   * @param sourceId 数据源ID
   * @param configurationManager 配置管理器实例
   * @param componentType 组件类型（可选）
   * @returns 单数据源导出配置
   */
  async exportSingleDataSource(
    componentId: string,
    sourceId: string,
    configurationManager: any,
    componentType?: string
  ): Promise<SingleDataSourceExport> {
    console.log(`📤 [SingleDataSourceExporter] 开始导出数据源: ${sourceId} from ${componentId}`)

    if (!configurationManager) {
      throw new Error('配置管理器未提供')
    }

    try {
      // 获取组件的完整配置
      const fullConfig = configurationManager.getConfiguration(componentId)

      // 从完整配置中提取数据源配置
      const dataSourceConfig = fullConfig?.dataSource
      if (!dataSourceConfig || !dataSourceConfig.dataSources) {
        throw new Error('未找到数据源配置')
      }

      // 查找指定的数据源
      const targetSourceIndex = dataSourceConfig.dataSources.findIndex((source: any) => source.sourceId === sourceId)
      if (targetSourceIndex === -1) {
        throw new Error(`未找到数据源: ${sourceId}`)
      }

      const targetSource = dataSourceConfig.dataSources[targetSourceIndex]
      const dependencies = new Set<string>()

      // 处理数据源配置中的组件ID占位符
      const processedDataSourceConfig = this.processDataSourceForExport(
        smartDeepClone(targetSource),
        componentId,
        dependencies
      )

      // 获取相关的交互和HTTP绑定配置
      const relatedConfig = this.extractRelatedConfigurations(componentId, sourceId, configurationManager, dependencies)

      const exportData: SingleDataSourceExport = {
        version: this.EXPORT_VERSION,
        exportType: 'single-datasource',
        exportTime: Date.now(),
        sourceMetadata: {
          originalSourceId: sourceId,
          sourceIndex: targetSourceIndex,
          originalComponentId: componentId,
          exportSource: 'SingleDataSourceExporter',
          componentType
        },
        dataSourceConfig: {
          dataItems: processedDataSourceConfig.dataItems || [],
          mergeStrategy: processedDataSourceConfig.mergeStrategy || { type: 'object' },
          processing: processedDataSourceConfig.processing
        },
        relatedConfig,
        mapping: {
          placeholders: {
            [this.CURRENT_COMPONENT_PLACEHOLDER]: 'current_component'
          },
          dependencies: Array.from(dependencies)
        }
      }

      console.log(`✅ [SingleDataSourceExporter] 单数据源导出成功`, {
        sourceId,
        dataItemCount: processedDataSourceConfig.dataItems?.length || 0,
        dependencies: Array.from(dependencies)
      })

      return exportData
    } catch (error) {
      console.error(`❌ [SingleDataSourceExporter] 导出失败:`, error)
      throw new Error(`单数据源导出失败: ${error.message}`)
    }
  }

  /**
   * 处理数据源配置中的组件ID映射
   */
  private processDataSourceForExport(sourceConfig: any, currentComponentId: string, dependencies: Set<string>): any {
    const processValue = (obj: any): any => {
      if (obj === null || obj === undefined) {
        return obj
      }

      if (typeof obj === 'string') {
        return this.processStringValue(obj, currentComponentId, dependencies)
      }

      if (Array.isArray(obj)) {
        return obj.map(item => processValue(item))
      }

      if (typeof obj === 'object') {
        const result: any = {}
        for (const [key, value] of Object.entries(obj)) {
          result[key] = processValue(value)
        }
        return result
      }

      return obj
    }

    return processValue(sourceConfig)
  }

  /**
   * 处理字符串中的组件ID引用
   */
  private processStringValue(value: string, currentComponentId: string, dependencies: Set<string>): string {
    // 如果字符串包含当前组件ID，替换为占位符
    if (value.includes(currentComponentId)) {
      return value.replace(new RegExp(currentComponentId, 'g'), this.CURRENT_COMPONENT_PLACEHOLDER)
    }

    // 检查是否为其他组件ID（简单匹配规则，可根据实际情况调整）
    const componentIdPattern = /^[a-zA-Z][a-zA-Z0-9_-]*_\d+$/
    if (componentIdPattern.test(value) && value !== currentComponentId) {
      dependencies.add(value)
    }

    return value
  }

  /**
   * 提取与指定数据源相关的其他配置
   */
  private extractRelatedConfigurations(
    componentId: string,
    sourceId: string,
    configurationManager: any,
    dependencies: Set<string>
  ): { interactions: any[]; httpBindings: any[] } {
    const relatedConfig = {
      interactions: [],
      httpBindings: []
    }

    try {
      // 获取交互配置
      const interactionConfig = configurationManager.getConfiguration(componentId, 'interaction')
      if (interactionConfig) {
        // 查找与此数据源相关的交互配置
        const relatedInteractions = this.findRelatedInteractions(interactionConfig, sourceId)
        relatedConfig.interactions = relatedInteractions.map(interaction =>
          this.processDataSourceForExport(interaction, componentId, dependencies)
        )
      }

      // 获取HTTP绑定配置（如果存在）
      const componentConfig = configurationManager.getConfiguration(componentId, 'component')
      if (componentConfig?.httpBindings) {
        const relatedHttpBindings = componentConfig.httpBindings.filter((binding: any) => binding.sourceId === sourceId)
        relatedConfig.httpBindings = relatedHttpBindings.map(binding =>
          this.processDataSourceForExport(binding, componentId, dependencies)
        )
      }
    } catch (error) {
      console.warn(`⚠️ [SingleDataSourceExporter] 提取相关配置失败:`, error)
      // 相关配置失败不影响主要导出
    }

    return relatedConfig
  }

  /**
   * 查找与指定数据源相关的交互配置
   */
  private findRelatedInteractions(interactionConfig: any, sourceId: string): any[] {
    const relatedInteractions: any[] = []

    if (!interactionConfig || typeof interactionConfig !== 'object') {
      return relatedInteractions
    }

    // 递归搜索包含sourceId的交互配置
    const searchInteractions = (obj: any) => {
      if (Array.isArray(obj)) {
        obj.forEach(item => searchInteractions(item))
      } else if (typeof obj === 'object' && obj !== null) {
        // 检查当前对象是否与sourceId相关
        const objStr = JSON.stringify(obj)
        if (objStr.includes(sourceId)) {
          relatedInteractions.push(obj)
        } else {
          // 继续递归搜索
          Object.values(obj).forEach(value => searchInteractions(value))
        }
      }
    }

    searchInteractions(interactionConfig)
    return relatedInteractions
  }

  /**
   * 获取组件中的所有数据源列表
   */
  getAvailableDataSources(
    componentId: string,
    configurationManager: any
  ): Array<{
    sourceId: string
    sourceIndex: number
    hasData: boolean
    dataItemCount: number
  }> {
    try {
      // 获取组件的完整配置并提取数据源配置
      const fullConfig = configurationManager.getConfiguration(componentId)
      const dataSourceConfig = fullConfig?.dataSource
      if (!dataSourceConfig || !dataSourceConfig.dataSources) {
        return []
      }

      return dataSourceConfig.dataSources.map((source: any, index: number) => ({
        sourceId: source.sourceId,
        sourceIndex: index,
        hasData: !!(source.dataItems && source.dataItems.length > 0),
        dataItemCount: source.dataItems?.length || 0
      }))
    } catch (error) {
      console.warn(`⚠️ [SingleDataSourceExporter] 获取数据源列表失败:`, error)
      return []
    }
  }
}

/**
 * 单数据源配置导入器类
 */
export class SingleDataSourceImporter {
  private readonly CURRENT_COMPONENT_PLACEHOLDER = '__CURRENT_COMPONENT__'

  /**
   * 生成单数据源导入预览
   */
  generateImportPreview(
    importData: SingleDataSourceExport,
    targetComponentId: string,
    configurationManager: any
  ): SingleDataSourceImportPreview {
    try {
      // 获取目标组件的数据源槽位信息
      const availableSlots = this.getAvailableDataSourceSlots(targetComponentId, configurationManager)

      // 检查冲突和依赖
      const dependencies = importData.mapping.dependencies || []
      const conflicts = this.checkImportConflicts(importData, targetComponentId, configurationManager)

      return {
        basicInfo: {
          version: importData.version,
          exportType: importData.exportType,
          exportTime: importData.exportTime,
          originalSourceId: importData.sourceMetadata.originalSourceId,
          sourceIndex: importData.sourceMetadata.sourceIndex,
          exportSource: importData.sourceMetadata.exportSource
        },
        configSummary: {
          dataItemCount: importData.dataSourceConfig.dataItems.length,
          mergeStrategy: importData.dataSourceConfig.mergeStrategy.type || 'object',
          hasProcessing: !!importData.dataSourceConfig.processing
        },
        relatedConfig: {
          interactionCount: importData.relatedConfig.interactions.length,
          httpBindingCount: importData.relatedConfig.httpBindings.length
        },
        dependencies,
        conflicts,
        availableSlots
      }
    } catch (error) {
      console.error(`❌ [SingleDataSourceImporter] 生成导入预览失败:`, error)
      throw new Error(`生成导入预览失败: ${error.message}`)
    }
  }

  /**
   * 获取可用的数据源槽位
   */
  private getAvailableDataSourceSlots(componentId: string, configurationManager: any) {
    const slots: Array<{
      slotId: string
      slotIndex: number
      isEmpty: boolean
      currentConfig?: any
    }> = []

    try {
      // 获取组件的完整配置并提取数据源配置
      const fullConfig = configurationManager?.getConfiguration?.(componentId)
      const dataSourceConfig = fullConfig?.dataSource

      if (!dataSourceConfig || !dataSourceConfig.dataSources) {
        // 如果没有数据源配置，提供默认的3个槽位
        for (let i = 0; i < 3; i++) {
          slots.push({
            slotId: `dataSource${i + 1}`,
            slotIndex: i,
            isEmpty: true
          })
        }
      } else {
        // 根据现有配置生成槽位信息
        dataSourceConfig.dataSources.forEach((source: any, index: number) => {
          slots.push({
            slotId: source.sourceId,
            slotIndex: index,
            isEmpty: !source.dataItems || source.dataItems.length === 0,
            currentConfig:
              source.dataItems?.length > 0
                ? {
                    dataItemCount: source.dataItems.length,
                    mergeStrategy: source.mergeStrategy?.type || 'object'
                  }
                : undefined
          })
        })
      }
    } catch (error) {
      console.warn(`⚠️ [SingleDataSourceImporter] 获取数据源槽位失败:`, error)
    }

    return slots
  }

  /**
   * 检查导入冲突
   */
  private checkImportConflicts(
    importData: SingleDataSourceExport,
    targetComponentId: string,
    configurationManager: any
  ): string[] {
    const conflicts: string[] = []

    try {
      // 检查依赖是否满足
      const dependencies = importData.mapping.dependencies || []
      // TODO: 实现依赖检查逻辑

      // 检查组件类型兼容性
      // TODO: 根据实际需要实现组件类型检查
    } catch (error) {
      console.warn(`⚠️ [SingleDataSourceImporter] 冲突检测失败:`, error)
    }

    return conflicts
  }

  /**
   * 执行单数据源导入
   */
  async importSingleDataSource(
    importData: SingleDataSourceExport,
    targetComponentId: string,
    targetSlotId: string,
    configurationManager: any,
    options: {
      overwriteExisting?: boolean
    } = {}
  ): Promise<void> {
    if (!configurationManager || typeof configurationManager.updateConfiguration !== 'function') {
      throw new Error('配置管理器无效或未提供')
    }

    try {
      console.log(`📥 [SingleDataSourceImporter] 开始导入单数据源到槽位: ${targetSlotId}`)

      // 处理组件ID映射
      const processedConfig = this.processConfigurationForImport(importData, targetComponentId)

      // 获取或创建目标数据源配置
      const fullConfig = configurationManager.getConfiguration(targetComponentId)
      const existingConfig = fullConfig?.dataSource || {
        componentId: targetComponentId,
        dataSources: [],
        createdAt: Date.now(),
        updatedAt: Date.now()
      }

      // 🔧 确保 dataSources 数组存在
      if (!existingConfig.dataSources || !Array.isArray(existingConfig.dataSources)) {
        existingConfig.dataSources = []
        console.warn(`⚠️ [SingleDataSourceImporter] dataSources 数组不存在或不是数组，已重置为空数组`)
      }

      // 找到或创建目标槽位
      let targetSlotIndex = existingConfig.dataSources.findIndex((source: any) => source.sourceId === targetSlotId)

      if (targetSlotIndex === -1) {
        // 创建新的数据源槽位
        existingConfig.dataSources.push({
          sourceId: targetSlotId,
          dataItems: [],
          mergeStrategy: { type: 'object' }
        })
        targetSlotIndex = existingConfig.dataSources.length - 1
      }

      // 更新目标槽位的配置
      existingConfig.dataSources[targetSlotIndex] = {
        sourceId: targetSlotId,
        dataItems: processedConfig.dataSourceConfig?.dataItems || [],
        mergeStrategy: processedConfig.dataSourceConfig?.mergeStrategy || { type: 'object' },
        ...(processedConfig.dataSourceConfig?.processing && {
          processing: processedConfig.dataSourceConfig.processing
        })
      }

      existingConfig.updatedAt = Date.now()

      // 应用数据源配置
      configurationManager.updateConfiguration(targetComponentId, 'dataSource', existingConfig)

      // TODO: 应用相关的交互配置和HTTP绑定
      if (processedConfig.relatedConfig?.interactions?.length > 0) {
        console.log(
          `🎯 [SingleDataSourceImporter] 应用相关交互配置: ${processedConfig.relatedConfig.interactions.length}个`
        )
      }

      if (processedConfig.relatedConfig?.httpBindings?.length > 0) {
        console.log(
          `🔗 [SingleDataSourceImporter] 应用相关HTTP绑定: ${processedConfig.relatedConfig.httpBindings.length}个`
        )
      }

      console.log(`✅ [SingleDataSourceImporter] 单数据源导入成功`)
    } catch (error) {
      console.error(`❌ [SingleDataSourceImporter] 导入失败:`, error)
      throw new Error(`单数据源导入失败: ${error.message}`)
    }
  }

  /**
   * 处理导入配置中的组件ID映射
   */
  private processConfigurationForImport(
    importData: SingleDataSourceExport,
    targetComponentId: string
  ): SingleDataSourceExport {
    const processedData = smartDeepClone(importData)

    const processValue = (obj: any): any => {
      if (obj === null || obj === undefined) {
        return obj
      }

      if (typeof obj === 'string') {
        // 将占位符替换为目标组件ID
        return obj.replace(new RegExp(this.CURRENT_COMPONENT_PLACEHOLDER, 'g'), targetComponentId)
      }

      if (Array.isArray(obj)) {
        return obj.map(item => processValue(item))
      }

      if (typeof obj === 'object') {
        const result: any = {}
        for (const [key, value] of Object.entries(obj)) {
          result[key] = processValue(value)
        }
        return result
      }

      return obj
    }

    // 处理数据源配置
    processedData.dataSourceConfig = processValue(processedData.dataSourceConfig)

    // 处理相关配置
    processedData.relatedConfig.interactions = processValue(processedData.relatedConfig.interactions)
    processedData.relatedConfig.httpBindings = processValue(processedData.relatedConfig.httpBindings)

    return processedData
  }
}

/**
 * 导出单例实例
 */
export const configurationExporter = new ConfigurationExporter()
export const configurationImporter = new ConfigurationImporter()
export const singleDataSourceExporter = new SingleDataSourceExporter()
export const singleDataSourceImporter = new SingleDataSourceImporter()
