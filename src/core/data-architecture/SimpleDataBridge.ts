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
    const startTime = Date.now()

    // 🎯 用户要求的打印这几个字 - 调试：SimpleDataBridge接收到的配置
    console.log(`🎯 用户要求的打印这几个字 - 调试：SimpleDataBridge接收到的配置`, {
      componentId: requirement.componentId,
      接收到的原始配置: requirement,
      数据源配置数量: requirement.dataSources?.length || 0,
      数据源配置列表: requirement.dataSources || [],
      调用栈: new Error().stack, // 🔥 添加调用栈，找出是谁调用的
      每个数据源详情: requirement.dataSources?.map(ds => ({
        数据源ID: ds.id,
        数据源类型: ds.type,
        配置内容: ds.config,
        是否有配置: !!ds.config,
        配置对象键: ds.config ? Object.keys(ds.config) : []
      })) || []
    })

    try {
      // 🆕 检查缓存数据，但需要验证配置是否已更新
      const cachedData = this.warehouse.getComponentData(requirement.componentId)

      
      if (cachedData) {
        // 🔥 修复：检查是否有数据项配置，如果没有则不使用缓存
        const hasDataItems = this.hasValidDataItems(requirement)


        if (hasDataItems) {
          // 🔥 修复：如果缓存数据被 'complete' 包装，需要解包
          let finalData = cachedData
          if (cachedData && typeof cachedData === 'object' && 'complete' in cachedData) {
            finalData = cachedData.complete
          }

          this.notifyDataUpdate(requirement.componentId, finalData)
          return {
            success: true,
            data: finalData,
            timestamp: Date.now()
          }
        } else {
          this.warehouse.clearComponentCache(requirement.componentId)
        }
      }

      // 🔥 检查数据格式：如果已经是 DataSourceConfiguration 格式，直接使用
      let dataSourceConfig: DataSourceConfiguration

      // 🎯 用户要求的打印这几个字 - 调试：检查格式判断过程
      const isDataSourceConfigFormat = this.isDataSourceConfiguration(requirement)
      console.log(`🎯 用户要求的打印这几个字 - 调试：格式检查结果`, {
        是否为DataSourceConfiguration格式: isDataSourceConfigFormat,
        检查的配置: requirement,
        第一个数据源: requirement.dataSources?.[0],
        第一个数据源的sourceId: requirement.dataSources?.[0]?.sourceId,
        第一个数据源的dataItems: requirement.dataSources?.[0]?.dataItems
      })

      if (isDataSourceConfigFormat) {
        console.log(`🎯 用户要求的打印这几个字 - 调试：使用现有DataSourceConfiguration格式`)
        dataSourceConfig = requirement as any
      } else {
        console.log(`🎯 用户要求的打印这几个字 - 调试：转换为DataSourceConfiguration格式`)

        // 🔥 修复：检查是否是双层嵌套结构
        if (requirement.dataSources?.[0]?.dataSources) {
          console.log(`🎯 用户要求的打印这几个字 - 调试：检测到双层嵌套，解包内层配置`)
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
      console.log(`🎯 用户要求的打印这几个字 - 调试：最终传给MultiLayerExecutorChain的配置`, {
        componentId: dataSourceConfig.componentId,
        数据源数量: dataSourceConfig.dataSources.length,
        完整配置对象: dataSourceConfig,
        数据源详情: dataSourceConfig.dataSources.map((ds, index) => {
          console.log(`数据源${index}原始对象:`, ds)
          console.log(`数据源${index}的sourceId:`, ds.sourceId)
          console.log(`数据源${index}的dataItems:`, ds.dataItems)
          return {
            数据源ID: ds.sourceId,
            原始sourceId字段: 'sourceId' in ds ? ds.sourceId : '字段不存在',
            数据项数量: ds.dataItems?.length || 0,
            原始dataItems: ds.dataItems,
            数据项详情: ds.dataItems?.map((item, itemIndex) => {
              console.log(`数据项${itemIndex}原始对象:`, item)
              console.log(`数据项${itemIndex}的item:`, item.item)
              return {
                类型: item.item?.type,
                配置: item.item?.config,
                item对象: item.item,
                处理配置: item.processing
              }
            }) || []
          }
        })
      })


      // 🔥 使用多层执行器链执行完整的数据处理管道
      const executionResult: ExecutionResult = await this.executorChain.executeDataProcessingChain(
        dataSourceConfig,
        true
      )


      if (executionResult.success && executionResult.componentData) {
        console.log(`🔥 [SimpleDataBridge] 执行成功，准备存储到DataWarehouse:`, {
          componentId: requirement.componentId,
          executionResult: executionResult,
          dataKeys: Object.keys(executionResult.componentData),
          dataStructure: Object.keys(executionResult.componentData).reduce((acc, key) => {
            const item = executionResult.componentData[key]
            acc[key] = {
              hasType: item && typeof item === 'object' && 'type' in item,
              hasData: item && typeof item === 'object' && 'data' in item,
              hasMetadata: item && typeof item === 'object' && 'metadata' in item
            }
            return acc
          }, {})
        })

        // 🎯 用户要求的打印这几个字 - 阶段1：SimpleDataBridge数据执行完成
        console.log(`🎯 用户要求的打印这几个字 - 阶段1：SimpleDataBridge数据执行完成`, {
          componentId: requirement.componentId,
          原始执行结果: executionResult.componentData,
          数据源数量: Object.keys(executionResult.componentData).length,
          各数据源内容: Object.entries(executionResult.componentData).map(([sourceId, sourceData]) => ({
            数据源ID: sourceId,
            数据类型: typeof sourceData,
            数据内容: sourceData,
            是否标准格式: sourceData && typeof sourceData === 'object' && 'data' in sourceData
          }))
        })
        
        // 🔥 修复：为每个数据源分别存储数据，并存储合并后的完整数据
        if (executionResult.componentData && typeof executionResult.componentData === 'object') {
          // 存储各个数据源的数据
          Object.entries(executionResult.componentData).forEach(([sourceId, sourceData]) => {
            this.warehouse.storeComponentData(
              requirement.componentId,
              sourceId,
              sourceData,
              'multi-source'
            )
            console.log(`✅ [SimpleDataBridge] 存储数据源 ${sourceId}:`, sourceData)
          })
          
          // 同时存储完整的合并数据作为备份
          this.warehouse.storeComponentData(
            requirement.componentId,
            'complete',
            executionResult.componentData,
            'multi-source'
          )
          console.log(`✅ [SimpleDataBridge] 存储完整数据到 'complete'`)
          
          // 🔥 新增：立即验证数据是否成功存储到DataWarehouse
          const warehouseStats = this.warehouse.getStorageStats()
          console.log(`🔥 [SimpleDataBridge] DataWarehouse存储验证:`, {
            totalComponents: warehouseStats.totalComponents,
            totalDataSources: warehouseStats.totalDataSources,
            memoryUsageMB: warehouseStats.memoryUsageMB,
            componentStats: warehouseStats.componentStats[requirement.componentId]
          })
          
          // 🔥 新增：立即验证数据是否可以从DataWarehouse中读取
          const retrievedData = this.warehouse.getComponentData(requirement.componentId)
          console.log(`🔥 [SimpleDataBridge] DataWarehouse读取验证:`, {
            hasData: !!retrievedData,
            dataKeys: retrievedData ? Object.keys(retrievedData) : [],
            dataStructure: retrievedData
          })
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
