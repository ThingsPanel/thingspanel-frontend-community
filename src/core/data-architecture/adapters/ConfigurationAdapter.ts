/**
 * 配置版本适配器实现
 * 负责新旧配置格式的自动转换和兼容性处理
 *
 * 核心功能：
 * 1. 自动检测配置版本
 * 2. 无损升级 v1 -> v2
 * 3. 兼容降级 v2 -> v1
 * 4. 数据项格式转换
 */

import type {
  // 现有类型
  DataSourceConfiguration as LegacyDataSourceConfiguration,
  ExecutionResult
} from '../executors/MultiLayerExecutorChain'

import type {
  DataItem as LegacyDataItem,
  JsonDataItemConfig as LegacyJsonDataItemConfig,
  HttpDataItemConfig as LegacyHttpDataItemConfig
} from '../executors/DataItemFetcher'

import type {
  // 增强类型
  EnhancedDataSourceConfiguration,
  DataItemConfig,
  EnhancedJsonDataItemConfig,
  EnhancedHttpDataItemConfig,
  HttpHeader,
  HttpParam,
  ConfigurationAdapter as IConfigurationAdapter
} from '../types/enhanced-types'

import { DEFAULT_ENHANCED_FEATURES } from '../types/enhanced-types'

/**
 * 配置转换结果
 */
export interface ConversionResult<T = any> {
  /** 转换是否成功 */
  success: boolean

  /** 转换后的数据 */
  data?: T

  /** 转换过程中的警告 */
  warnings: string[]

  /** 转换过程中的错误 */
  errors: string[]

  /** 转换元信息 */
  metadata: {
    /** 源版本 */
    sourceVersion: string
    /** 目标版本 */
    targetVersion: string
    /** 转换时间 */
    convertedAt: number
  }
}

/**
 * 配置版本适配器实现类
 */
export class ConfigurationAdapter implements IConfigurationAdapter {
  /**
   * 检测配置版本
   */
  detectVersion(config: any): 'v1.0' | 'v2.0' {
    // 检查版本字段
    if (config && typeof config.version === 'string') {
      return config.version.startsWith('2.') ? 'v2.0' : 'v1.0'
    }

    // 检查增强特性字段
    if (config && (config.dynamicParams || config.enhancedFeatures)) {
      return 'v2.0'
    }

    // 检查数据项格式特征
    if (config && config.dataSources && Array.isArray(config.dataSources)) {
      const firstDataSource = config.dataSources[0]
      if (firstDataSource && firstDataSource.dataItems && Array.isArray(firstDataSource.dataItems)) {
        const firstDataItem = firstDataSource.dataItems[0]
        if (firstDataItem && firstDataItem.id) {
          return 'v2.0' // 有id字段，是v2格式
        }
      }
    }

    // 默认为v1格式
    return 'v1.0'
  }

  /**
   * 适配配置到指定版本
   */
  adaptToVersion(config: any, targetVersion: 'v1.0' | 'v2.0'): ConversionResult {
    const sourceVersion = this.detectVersion(config)

    try {
      if (sourceVersion === targetVersion) {
        return {
          success: true,
          data: config,
          warnings: [],
          errors: [],
          metadata: {
            sourceVersion,
            targetVersion,
            convertedAt: Date.now()
          }
        }
      }

      const convertedData = targetVersion === 'v2.0' ? this.upgradeV1ToV2(config) : this.downgradeV2ToV1(config)

      return {
        success: true,
        data: convertedData,
        warnings: [],
        errors: [],
        metadata: {
          sourceVersion,
          targetVersion,
          convertedAt: Date.now()
        }
      }
    } catch (error) {
      return {
        success: false,
        warnings: [],
        errors: [error instanceof Error ? error.message : String(error)],
        metadata: {
          sourceVersion,
          targetVersion,
          convertedAt: Date.now()
        }
      }
    }
  }

  /**
   * v1升级到v2（无损升级）
   */
  upgradeV1ToV2(v1Config: LegacyDataSourceConfiguration): EnhancedDataSourceConfiguration {
    const enhancedConfig: EnhancedDataSourceConfiguration = {
      // 保留所有原有字段
      ...v1Config,

      // 添加版本标识
      version: '2.0.0',

      // 默认动态参数配置
      dynamicParams: [],

      // 默认增强功能开关
      enhancedFeatures: {
        ...DEFAULT_ENHANCED_FEATURES
      },

      // 添加配置元数据
      metadata: {
        name: `配置_${v1Config.componentId}`,
        description: `从v1.0升级的配置`,
        author: 'system',
        versionHistory: [
          {
            version: '2.0.0',
            timestamp: Date.now(),
            changelog: '从v1.0自动升级到v2.0',
            author: 'ConfigurationAdapter'
          }
        ],
        tags: ['upgraded', 'v2']
      },

      // 升级数据源配置
      dataSources: v1Config.dataSources.map(dataSource => ({
        ...dataSource,
        dataItems: dataSource.dataItems.map((dataItemWrapper, index) => ({
          ...dataItemWrapper,
          item: this.upgradeDataItemToV2(dataItemWrapper.item, `${dataSource.sourceId}_item_${index}`)
        }))
      }))
    }

    return enhancedConfig
  }

  /**
   * v2降级到v1（兼容降级）
   */
  downgradeV2ToV1(v2Config: EnhancedDataSourceConfiguration): LegacyDataSourceConfiguration {
    const legacyConfig: LegacyDataSourceConfiguration = {
      componentId: v2Config.componentId,
      dataSources: v2Config.dataSources.map(dataSource => ({
        sourceId: dataSource.sourceId,
        dataItems: dataSource.dataItems.map(dataItemWrapper => ({
          item: this.downgradeDataItemToV1(dataItemWrapper.item),
          processing: dataItemWrapper.processing
        })),
        mergeStrategy: dataSource.mergeStrategy
      })),
      createdAt: v2Config.createdAt,
      updatedAt: Date.now() // 更新时间戳
    }

    return legacyConfig
  }

  /**
   * 数据项升级到v2格式
   */
  private upgradeDataItemToV2(v1Item: LegacyDataItem, itemId: string): DataItemConfig {
    const baseItem: DataItemConfig = {
      type: v1Item.type,
      id: itemId,
      config: v1Item.config,
      metadata: {
        displayName: `${v1Item.type}数据项`,
        description: `从v1.0升级的${v1Item.type}数据项`,
        createdAt: Date.now(),
        lastUpdated: Date.now(),
        enabled: true,
        tags: ['upgraded']
      }
    }

    // 特殊处理不同类型的配置
    switch (v1Item.type) {
      case 'json':
        const legacyJsonConfig = v1Item.config as LegacyJsonDataItemConfig
        const enhancedJsonConfig: EnhancedJsonDataItemConfig = {
          jsonData: legacyJsonConfig.jsonString, // 字段重命名
          validation: {
            enableFormat: true,
            enableStructure: false
          },
          preprocessing: {
            removeComments: false,
            formatOutput: false
          }
        }
        return { ...baseItem, config: enhancedJsonConfig }

      case 'http':
        const legacyHttpConfig = v1Item.config as LegacyHttpDataItemConfig
        const enhancedHttpConfig: EnhancedHttpDataItemConfig = {
          url: legacyHttpConfig.url,
          method: legacyHttpConfig.method,
          headers: this.convertHeadersRecordToArray(legacyHttpConfig.headers || {}),
          params: [], // v1中没有params，默认为空数组
          body: legacyHttpConfig.body
            ? {
                type: 'json',
                content: legacyHttpConfig.body
              }
            : undefined,
          timeout: legacyHttpConfig.timeout,
          retry: {
            maxRetries: 3,
            retryDelay: 1000
          }
        }
        return { ...baseItem, config: enhancedHttpConfig }

      default:
        // 其他类型保持原样
        return baseItem
    }
  }

  /**
   * 数据项降级到v1格式
   */
  private downgradeDataItemToV1(v2Item: DataItemConfig): LegacyDataItem {
    switch (v2Item.type) {
      case 'json':
        const enhancedJsonConfig = v2Item.config as EnhancedJsonDataItemConfig
        return {
          type: 'json',
          config: {
            jsonString: enhancedJsonConfig.jsonData // 字段重命名回去
          }
        }

      case 'http':
        const enhancedHttpConfig = v2Item.config as EnhancedHttpDataItemConfig
        return {
          type: 'http',
          config: {
            url: enhancedHttpConfig.url,
            method: enhancedHttpConfig.method,
            headers: this.convertHeadersArrayToRecord(enhancedHttpConfig.headers),
            body: enhancedHttpConfig.body?.content,
            timeout: enhancedHttpConfig.timeout
          }
        }

      case 'websocket':
        return {
          type: 'websocket',
          config: v2Item.config // WebSocket配置保持不变
        }

      case 'script':
        return {
          type: 'script',
          config: v2Item.config // Script配置保持不变
        }

      default:
        // 未知类型，尝试保持原格式
        return {
          type: v2Item.type as any,
          config: v2Item.config
        }
    }
  }

  /**
   * 将Record格式的headers转换为Array格式
   */
  private convertHeadersRecordToArray(headers: Record<string, string>): HttpHeader[] {
    return Object.entries(headers).map(([key, value]) => ({
      key,
      value,
      enabled: true,
      isDynamic: false
    }))
  }

  /**
   * 将Array格式的headers转换为Record格式
   */
  private convertHeadersArrayToRecord(headers: HttpHeader[]): Record<string, string> {
    return headers
      .filter(header => header.enabled)
      .reduce(
        (acc, header) => {
          acc[header.key] = header.value
          return acc
        },
        {} as Record<string, string>
      )
  }

  /**
   * 批量转换配置
   */
  public batchConvert(configs: any[], targetVersion: 'v1.0' | 'v2.0'): ConversionResult[] {
    return configs.map(config => this.adaptToVersion(config, targetVersion))
  }

  /**
   * 验证配置转换的一致性
   */
  public validateConversion(original: any, converted: any): { valid: boolean; issues: string[] } {
    const issues: string[] = []

    // 检查基本字段
    if (original.componentId !== converted.componentId) {
      issues.push('componentId不匹配')
    }

    if (original.dataSources.length !== converted.dataSources.length) {
      issues.push('dataSources数量不匹配')
    }

    // 检查数据源
    for (let i = 0; i < original.dataSources.length; i++) {
      const origDs = original.dataSources[i]
      const convDs = converted.dataSources[i]

      if (origDs.sourceId !== convDs.sourceId) {
        issues.push(`数据源${i}的sourceId不匹配`)
      }

      if (origDs.dataItems.length !== convDs.dataItems.length) {
        issues.push(`数据源${i}的dataItems数量不匹配`)
      }
    }

    return {
      valid: issues.length === 0,
      issues
    }
  }
}

// ==================== 工厂函数 ====================

/**
 * 创建配置适配器实例
 */
export function createConfigurationAdapter(): ConfigurationAdapter {
  return new ConfigurationAdapter()
}

// ==================== 便捷函数 ====================

/**
 * 快速检测配置版本
 */
export function detectConfigVersion(config: any): 'v1.0' | 'v2.0' {
  return createConfigurationAdapter().detectVersion(config)
}

/**
 * 快速升级配置到v2
 */
export function upgradeToV2(v1Config: LegacyDataSourceConfiguration): EnhancedDataSourceConfiguration {
  return createConfigurationAdapter().upgradeV1ToV2(v1Config)
}

/**
 * 快速降级配置到v1
 */
export function downgradeToV1(v2Config: EnhancedDataSourceConfiguration): LegacyDataSourceConfiguration {
  return createConfigurationAdapter().downgradeV2ToV1(v2Config)
}

// ==================== 导出 ====================
export type { ConversionResult }
