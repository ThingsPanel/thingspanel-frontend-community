/**
 * @file ConfigurationImportExport.ts
 * @description 配置导入导出工具类，处理组件 ID 映射和依赖管理
 */

import type { DataSourceConfiguration } from '../index'
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
        dependencies: dependencies.external,
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
    const existingConfig = configurationManager.getConfiguration(targetComponentId)

    return {
      dataSource: !!(existingConfig?.dataSource && config.data.dataSourceConfiguration),
      component: !!(existingConfig?.component && config.data.componentConfiguration),
      interaction: !!(existingConfig?.interaction && config.data.interactionConfiguration)
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
 * 导出单例实例
 */
export const configurationExporter = new ConfigurationExporter()
export const configurationImporter = new ConfigurationImporter()
