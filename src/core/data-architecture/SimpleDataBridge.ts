/**
 * 简化数据桥接器 (SimpleDataBridge)
 * 替代复杂的ComponentExecutorManager，提供轻量级的配置→数据转换
 *
 * 🔥 Task 2.1 修正：集成 MultiLayerExecutorChain，符合需求文档的三层架构
 *
 * 设计原则：
 * 1. 职责单一：只做配置格式转换和执行协调
 * 2. 无状态管理：不跟踪执行历史、统计信息
 * 3. 架构合规：使用符合需求文档的多层执行器链
 * 4. 事件驱动：通过回调函数与外部系统通信
 * 5. 执行器委托：使用MultiLayerExecutorChain进行完整的数据处理管道
 */

// 🔥 Task 2.1 修正: 导入多层执行器链（符合需求文档的三层架构）
import {
  MultiLayerExecutorChain,
  type DataSourceConfiguration,
  type ExecutionResult
} from './executors/MultiLayerExecutorChain'

// 🆕 SUBTASK-003: 导入增强数据仓库
import { dataWarehouse, type EnhancedDataWarehouse } from '@/core/data-architecture/DataWarehouse'

/**
 * 简化的数据源配置
 */
export interface SimpleDataSourceConfig {
  /** 数据源ID */
  id: string
  /** 数据源类型 */
  type: 'static' | 'http' | 'json' | 'websocket' | 'file' | 'data-source-bindings'
  /** 配置选项 */
  config: {
    // 静态数据
    data?: any
    // HTTP配置
    url?: string
    method?: 'GET' | 'POST'
    headers?: Record<string, string>
    timeout?: number
    [key: string]: any
  }
  /** 🔥 新增：过滤路径（JSONPath 语法） */
  filterPath?: string
  /** 🔥 新增：自定义处理脚本 */
  processScript?: string
}

/**
 * 数据执行结果
 */
export interface DataResult {
  /** 是否成功 */
  success: boolean
  /** 数据内容 */
  data?: any
  /** 错误信息 */
  error?: string
  /** 执行时间戳 */
  timestamp: number
}

/**
 * 组件数据需求
 */
export interface ComponentDataRequirement {
  /** 组件ID */
  componentId: string
  /** 数据源配置列表 */
  dataSources: SimpleDataSourceConfig[]
}

/**
 * 数据更新回调类型
 */
export type DataUpdateCallback = (componentId: string, data: Record<string, any>) => void

/**
 * 简化数据桥接器类
 * 只提供最基本的配置→数据转换功能
 */
export class SimpleDataBridge {
  /** ✅ 简化：移除复杂的调用计数和去重缓存 */
  /** 数据更新回调列表 */
  private callbacks = new Set<DataUpdateCallback>()

  /** 数据仓库实例 */
  private warehouse: EnhancedDataWarehouse = dataWarehouse

  /** 🔥 多层执行器链实例（符合需求文档架构） */
  private executorChain = new MultiLayerExecutorChain()

  /**
   * 执行组件数据获取
   * 🔥 重构: 使用 MultiLayerExecutorChain 替代分散的执行逻辑
   * @param requirement 组件数据需求
   * @returns 执行结果
   */
  async executeComponent(requirement: ComponentDataRequirement): Promise<DataResult> {
    // ✅ 简化：直接执行，移除复杂的去重和计数逻辑
    return await this.doExecuteComponent(requirement, Date.now(), 'direct-call')
  }

  /**
   * 实际的组件执行逻辑（从executeComponent中提取）
   */
  private async doExecuteComponent(
    requirement: ComponentDataRequirement,
    startTime: number,
    callerInfo: string
  ): Promise<DataResult> {
    const executionId = `${requirement.componentId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    try {
      // 🔥 关键修复：强制跳过缓存，确保每次都获取最新配置和数据
      // 配置修改后必须重新执行数据源，不能依赖旧缓存
      this.warehouse.clearComponentCache(requirement.componentId)

      // 🔥 关键修复：确保获取最新的配置快照
      const configSnapshot = await this.captureConfigurationSnapshot(requirement.componentId, executionId)
      if (configSnapshot) {
        // 使用最新配置重构数据需求
        requirement = this.reconstructRequirementFromSnapshot(requirement, configSnapshot)
      }

      // 🔥 检查数据格式：如果已经是 DataSourceConfiguration 格式，直接使用
      let dataSourceConfig: DataSourceConfiguration

      // 🎯 用户要求的打印这几个字 - 调试：检查格式判断过程
      const isDataSourceConfigFormat = this.isDataSourceConfiguration(requirement)

      if (isDataSourceConfigFormat) {
        dataSourceConfig = requirement as any
      } else {
        // 🔥 修复：检查是否是双层嵌套结构
        if (requirement.dataSources?.[0]?.dataSources) {
          // 双层嵌套：取内层的真正配置
          const innerConfig = requirement.dataSources[0] as any
          dataSourceConfig = {
            componentId: requirement.componentId,
            dataSources: innerConfig.dataSources,
            createdAt: innerConfig.createdAt || Date.now(),
            updatedAt: innerConfig.updatedAt || Date.now()
          }
        } else {
          dataSourceConfig = this.convertToDataSourceConfiguration(requirement)
        }
      }

      // 🎯 用户要求的打印这几个字 - 调试：最终传给MultiLayerExecutorChain的配置
      const enhancedDataSourceConfig = {
        ...dataSourceConfig,
        configHash: this.calculateConfigHash(dataSourceConfig)
      }

      // 🔥 使用多层执行器链执行完整的数据处理管道

      const executionResult: ExecutionResult = await this.executorChain.executeDataProcessingChain(
        enhancedDataSourceConfig,
        true
      )

      if (executionResult.success && executionResult.componentData) {
        // 🎯 用户要求的打印这几个字 - 阶段1：SimpleDataBridge数据执行完成

        // 🔥 修复：为每个数据源分别存储数据，并存储合并后的完整数据
        if (executionResult.componentData && typeof executionResult.componentData === 'object') {
          // 🔥 关键修复：带执行ID的原子性数据存储

          // 先清除旧数据，再存储新数据（原子性操作）
          this.warehouse.clearComponentCache(requirement.componentId)

          // 存储各个数据源的数据
          Object.entries(executionResult.componentData).forEach(([sourceId, sourceData]) => {
            this.warehouse.storeComponentData(requirement.componentId, sourceId, sourceData, 'multi-source')
          })

          // 同时存储完整的合并数据作为备份
          this.warehouse.storeComponentData(
            requirement.componentId,
            'complete',
            executionResult.componentData,
            'multi-source'
          )
        }

        // 通知数据更新
        this.notifyDataUpdate(requirement.componentId, executionResult.componentData)
        return {
          success: true,
          data: executionResult.componentData,
          timestamp: Date.now()
        }
      } else {
        return {
          success: false,
          error: executionResult.error || '执行失败',
          timestamp: Date.now()
        }
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error)
      return {
        success: false,
        error: errorMsg,
        timestamp: Date.now()
      }
    }
  }

  /**
   * 🔥 检查是否为 DataSourceConfiguration 格式
   * @param data 待检查的数据
   * @returns 是否为 DataSourceConfiguration 格式
   */
  private isDataSourceConfiguration(data: any): boolean {
    return (
      data &&
      typeof data === 'object' &&
      'componentId' in data &&
      'dataSources' in data &&
      Array.isArray(data.dataSources) &&
      data.dataSources.length > 0 &&
      'sourceId' in data.dataSources[0] &&
      'dataItems' in data.dataSources[0] &&
      'mergeStrategy' in data.dataSources[0]
    )
  }

  /**
   * 🔥 新增：转换为 DataSourceConfiguration 格式
   * 将 SimpleDataBridge 的配置格式转换为 MultiLayerExecutorChain 所需的格式
   * @param requirement 组件数据需求
   * @returns DataSourceConfiguration 格式的配置
   */
  private convertToDataSourceConfiguration(requirement: ComponentDataRequirement): DataSourceConfiguration {
    const dataSources = requirement.dataSources.map(dataSource => ({
      sourceId: dataSource.id,
      dataItems: [
        {
          item: {
            type: dataSource.type,
            config: dataSource.config
          },
          processing: {
            filterPath: dataSource.filterPath || '$',
            customScript: dataSource.processScript,
            defaultValue: {}
          }
        }
      ],
      mergeStrategy: 'object' as const // 默认使用对象合并策略
    }))

    return {
      componentId: requirement.componentId,
      dataSources,
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
  }

  // 🗑️ Task 2.1: 移除重复的执行器实现
  // executeStaticDataSource 和 executeHttpDataSource 已由 UnifiedDataExecutor 统一处理

  /**
   * 检查配置是否包含有效的数据项
   * @param requirement 数据需求配置
   * @returns 是否有有效数据项
   */
  private hasValidDataItems(requirement: ComponentDataRequirement): boolean {
    try {
      // 如果是 DataSourceConfiguration 格式
      if (this.isDataSourceConfiguration(requirement)) {
        const config = requirement as any as DataSourceConfiguration
        return config.dataSources?.some(dataSource => dataSource.dataItems && dataSource.dataItems.length > 0) || false
      }

      // 如果是其他格式，检查是否有数据源配置
      const hasDataSources =
        requirement.dataSources &&
        Object.values(requirement.dataSources).some(
          dataSource => dataSource && Array.isArray(dataSource.dataItems) && dataSource.dataItems.length > 0
        )

      return hasDataSources || false
    } catch (error) {
      return true // 发生错误时保守地返回 true，避免误删缓存
    }
  }

  /**
   * 通知数据更新
   * @param componentId 组件ID
   * @param data 数据
   */
  private notifyDataUpdate(componentId: string, data: Record<string, any>): void {
    this.callbacks.forEach(callback => {
      try {
        callback(componentId, data)
      } catch (error) {}
    })
  }

  /**
   * 注册数据更新回调
   * @param callback 回调函数
   * @returns 取消注册的函数
   */
  onDataUpdate(callback: DataUpdateCallback): () => void {
    this.callbacks.add(callback)

    return () => {
      this.callbacks.delete(callback)
    }
  }

  /**
   * 🆕 SUBTASK-003: 获取组件数据（缓存接口）
   * @param componentId 组件ID
   * @returns 组件数据或null
   */
  getComponentData(componentId: string): Record<string, any> | null {
    return this.warehouse.getComponentData(componentId)
  }

  /**
   * 🆕 SUBTASK-003: 清除组件缓存
   * @param componentId 组件ID
   */
  clearComponentCache(componentId: string): void {
    this.warehouse.clearComponentCache(componentId)
  }

  /**
   * 🆕 SUBTASK-003: 清除所有缓存
   */
  clearAllCache(): void {
    this.warehouse.clearAllCache()
  }

  /**
   * 🆕 SUBTASK-003: 设置缓存过期时间
   * @param milliseconds 过期时间（毫秒）
   */
  setCacheExpiry(milliseconds: number): void {
    this.warehouse.setCacheExpiry(milliseconds)
  }

  /**
   * 🆕 SUBTASK-003: 获取数据仓库性能指标
   */
  getWarehouseMetrics() {
    return this.warehouse.getPerformanceMetrics()
  }

  /**
   * 🆕 SUBTASK-003: 获取存储统计信息
   */
  getStorageStats() {
    return this.warehouse.getStorageStats()
  }

  /**
   * 获取简单统计信息
   * 🆕 SUBTASK-003: 增强统计信息，包含数据仓库数据
   */
  getStats() {
    const warehouseStats = this.warehouse.getStorageStats()
    return {
      activeCallbacks: this.callbacks.size,
      timestamp: Date.now(),
      warehouse: {
        totalComponents: warehouseStats.totalComponents,
        totalDataSources: warehouseStats.totalDataSources,
        memoryUsageMB: warehouseStats.memoryUsageMB
      }
    }
  }

  /**
   * 🔥 新增：在执行前验证配置完整性，特别检查HTTP参数绑定路径
   */
  private validateConfigBeforeExecution(config: DataSourceConfiguration): void {
    config.dataSources.forEach((dataSource, dsIndex) => {
      dataSource.dataItems.forEach((dataItem, itemIndex) => {
        const { item } = dataItem

        // 🚨 特别检查HTTP类型的参数
        if (item.type === 'http' && item.config) {
          const httpConfig = item.config

          // 检查所有参数源
          const allParams = [
            ...(httpConfig.params || []).map(p => ({ source: 'params', param: p })),
            ...(httpConfig.parameters || []).map(p => ({ source: 'parameters', param: p })),
            ...(httpConfig.pathParams || []).map(p => ({ source: 'pathParams', param: p }))
          ]

          allParams.forEach(({ source, param }, paramIndex) => {
            // 🚨 检测损坏的绑定路径
            if (param.value && typeof param.value === 'string') {
              const isSuspiciousPath = !param.value.includes('.') && param.value.length < 10 && param.variableName

              if (isSuspiciousPath) {
                console.error(`🚨 [SimpleDataBridge] 在传递给MultiLayerExecutorChain前发现损坏的绑定路径!`, {
                  数据源索引: dsIndex,
                  数据项索引: itemIndex,
                  参数源: source,
                  参数索引: paramIndex,
                  参数key: param.key,
                  损坏的value: param.value,
                  variableName: param.variableName,
                  检测时间戳: Date.now(),
                  堆栈跟踪: new Error().stack
                })
              } else {
              }
            }
          })
        }
      })
    })
  }

  /**
   * 🔥 新增：捕获配置快照，确保执行时使用一致的配置
   */
  private async captureConfigurationSnapshot(
    componentId: string,
    executionId: string
  ): Promise<{ config: any; timestamp: number } | null> {
    try {
      // 🔥 修复：使用动态导入替代require
      const { configurationIntegrationBridge } = await import(
        '@/components/visual-editor/configuration/ConfigurationIntegrationBridge'
      )
      const config = configurationIntegrationBridge.getConfiguration(componentId)

      if (config) {
        const snapshot = {
          config: JSON.parse(JSON.stringify(config)), // 深拷贝
          timestamp: Date.now()
        }
        return snapshot
      }
      return null
    } catch (error) {
      console.error(`❌ [SimpleDataBridge] [${executionId}] 配置快照捕获失败:`, error)
      return null
    }
  }

  /**
   * 🔥 新增：基于配置快照重构数据需求
   */
  private reconstructRequirementFromSnapshot(
    originalRequirement: ComponentDataRequirement,
    snapshot: { config: any; timestamp: number }
  ): ComponentDataRequirement {
    // 如果快照包含完整的数据源配置，使用快照重构
    if (snapshot.config.dataSource) {
      return {
        ...originalRequirement,
        dataSources: this.convertSnapshotToDataSources(snapshot.config)
      }
    }
    return originalRequirement
  }

  /**
   * 🔥 新增：将配置快照转换为数据源格式
   */
  private convertSnapshotToDataSources(config: any): any[] {
    // 根据配置结构转换为标准数据源格式
    if (config.dataSource && config.dataSource.dataSources) {
      return config.dataSource.dataSources
    }
    return []
  }

  /**
   * 🔥 新增：计算配置哈希值，用于检测配置变化
   */
  private calculateConfigHash(config: any): string {
    try {
      const configString = JSON.stringify(config)
      let hash = 0
      for (let i = 0; i < configString.length; i++) {
        const char = configString.charCodeAt(i)
        hash = (hash << 5) - hash + char
        hash = hash & hash // 转换为32位整数
      }
      return Math.abs(hash).toString(36)
    } catch (error) {
      return Date.now().toString(36)
    }
  }

  /**
   * 清理资源
   * 🆕 SUBTASK-003: 同时销毁数据仓库
   */
  destroy(): void {
    this.callbacks.clear()
    this.warehouse.destroy()
  }
}

/**
 * 导出全局单例实例
 */
export const simpleDataBridge = new SimpleDataBridge()

/**
 * 创建新的数据桥接器实例
 */
export function createSimpleDataBridge(): SimpleDataBridge {
  return new SimpleDataBridge()
}

/**
 * 开发环境自动验证
 * 在控制台输出 Phase 2 架构状态信息
 */
