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
import { dataWarehouse, type EnhancedDataWarehouse } from './DataWarehouse'

// 🧪 Task 2.1: 测试文件导入已移除，避免自动调用外部接口
// 如需测试，请手动在控制台调用: await import('./UnifiedDataExecutor.test')
// if (process.env.NODE_ENV === 'development') {
//   import('./UnifiedDataExecutor.test').catch(() => {
//     // 忽略导入错误，测试文件是可选的
//   })
// }

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

    try {
      console.log(`🚀 [SimpleDataBridge] 开始执行组件数据获取: ${requirement.componentId}`)

      // 🆕 检查缓存数据，但需要验证配置是否已更新
      const cachedData = this.warehouse.getComponentData(requirement.componentId)
      if (cachedData) {
        // 🔥 修复：检查是否有数据项配置，如果没有则不使用缓存
        const hasDataItems = this.hasValidDataItems(requirement)
        console.log(`🔍 [SimpleDataBridge] 缓存检查: ${requirement.componentId}, hasDataItems: ${hasDataItems}`)
        console.log(`🔍 [SimpleDataBridge] 传入的requirement结构:`, JSON.stringify(requirement, null, 2))

        if (hasDataItems) {
          console.log(`🎯 [SimpleDataBridge] 使用缓存数据: ${requirement.componentId}`)

          // 🔥 修复：如果缓存数据被 'complete' 包装，需要解包
          let finalData = cachedData
          if (cachedData && typeof cachedData === 'object' && 'complete' in cachedData) {
            console.log(`🔧 [SimpleDataBridge] 检测到嵌套格式，解包 'complete' 数据`)
            finalData = cachedData.complete
          }

          this.notifyDataUpdate(requirement.componentId, finalData)
          return {
            success: true,
            data: finalData,
            timestamp: Date.now()
          }
        } else {
          console.log(`🧹 [SimpleDataBridge] 配置已清空，清除缓存重新执行: ${requirement.componentId}`)
          this.warehouse.clearComponentCache(requirement.componentId)
        }
      }

      // 🔥 检查数据格式：如果已经是 DataSourceConfiguration 格式，直接使用
      let dataSourceConfig: DataSourceConfiguration

      if (this.isDataSourceConfiguration(requirement)) {
        console.log(`🔄 [SimpleDataBridge] 直接使用 DataSourceConfiguration 格式`)
        dataSourceConfig = requirement as any
      } else {
        console.log(`🔄 [SimpleDataBridge] 转换为 DataSourceConfiguration 格式`)
        dataSourceConfig = this.convertToDataSourceConfiguration(requirement)
      }

      console.log(`🔄 [SimpleDataBridge] 委托给多层执行器链执行:`, dataSourceConfig)

      // 🔥 使用多层执行器链执行完整的数据处理管道
      const executionResult: ExecutionResult = await this.executorChain.executeDataProcessingChain(
        dataSourceConfig,
        true
      )

      if (executionResult.success && executionResult.componentData) {
        console.log(`✅ [SimpleDataBridge] 多层执行器链执行成功:`, executionResult.componentData)

        // 🆕 存储到数据仓库
        this.warehouse.storeComponentData(
          requirement.componentId,
          'complete',
          executionResult.componentData,
          'multi-source'
        )

        // 通知数据更新
        this.notifyDataUpdate(requirement.componentId, executionResult.componentData)

        return {
          success: true,
          data: executionResult.componentData,
          timestamp: Date.now()
        }
      } else {
        console.error(`❌ [SimpleDataBridge] 多层执行器链执行失败:`, executionResult.error)
        return {
          success: false,
          error: executionResult.error || '执行失败',
          timestamp: Date.now()
        }
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error)
      console.error(`❌ [SimpleDataBridge] 组件执行失败: ${requirement.componentId} - ${errorMsg}`)

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
    console.log(`🔄 [SimpleDataBridge] 转换配置格式到 DataSourceConfiguration:`, requirement)

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
      console.warn(`⚠️ [SimpleDataBridge] 检查数据项失败:`, error)
      return true // 发生错误时保守地返回 true，避免误删缓存
    }
  }

  /**
   * 通知数据更新
   * @param componentId 组件ID
   * @param data 数据
   */
  private notifyDataUpdate(componentId: string, data: Record<string, any>): void {
    console.log(`📡 [SimpleDataBridge] 通知数据更新: ${componentId}`)

    this.callbacks.forEach(callback => {
      try {
        callback(componentId, data)
      } catch (error) {
        console.error(`❌ [SimpleDataBridge] 数据更新回调执行失败:`, error)
      }
    })
  }

  /**
   * 注册数据更新回调
   * @param callback 回调函数
   * @returns 取消注册的函数
   */
  onDataUpdate(callback: DataUpdateCallback): () => void {
    this.callbacks.add(callback)
    console.log(`📝 [SimpleDataBridge] 注册数据更新回调，当前回调数量: ${this.callbacks.size}`)

    return () => {
      this.callbacks.delete(callback)
      console.log(`🗑️ [SimpleDataBridge] 移除数据更新回调，当前回调数量: ${this.callbacks.size}`)
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
    console.log('🧹 [SimpleDataBridge] 数据桥接器已销毁')
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
if (import.meta.env.DEV) {
  setTimeout(() => {
    console.log('🚀 [Phase2] SimpleDataBridge 已加载')
    console.log('📊 [Phase2] 架构统计:', simpleDataBridge.getStats())
    console.log('💡 [Phase2] 验证方法: 访问菜单 → 测试 → 编辑器集成测试')
  }, 2000)
}
