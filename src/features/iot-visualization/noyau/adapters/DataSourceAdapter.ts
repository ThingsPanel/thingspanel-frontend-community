/**
 * 数据源适配器
 * 桥接 noyau 数据源系统和现有的 @/core/data-architecture/SimpleDataBridge
 *
 * 职责：
 * 1. 将 noyau 的 DataSourceConfig 转换为 SimpleDataBridge 的格式
 * 2. 提供统一的数据执行接口
 * 3. 集成现有的数据缓存、转换、轮询机制
 */

import type { DataSourceConfig, DataUpdateEvent } from '../types'
import { SimpleDataBridge } from '@/core/data-architecture/SimpleDataBridge'
import { dataWarehouse } from '@/core/data-architecture/DataWarehouse'

/**
 * 数据源适配器配置
 */
export interface DataSourceAdapterConfig {
  /** 是否启用缓存 */
  enableCache?: boolean
  /** 缓存过期时间（毫秒） */
  cacheExpiration?: number
  /** 全局超时时间（毫秒） */
  globalTimeout?: number
}

/**
 * 数据源执行结果
 */
export interface DataSourceExecutionResult {
  /** 是否成功 */
  success: boolean
  /** 数据内容 */
  data?: any
  /** 错误信息 */
  error?: string
  /** 执行耗时（毫秒） */
  duration?: number
  /** 数据来源（cache/api/static） */
  source?: string
}

/**
 * 数据源适配器类
 */
export class DataSourceAdapter {
  /** SimpleDataBridge 实例 */
  private dataBridge: SimpleDataBridge

  /** 适配器配置 */
  private config: Required<DataSourceAdapterConfig>

  /** 数据更新监听器 */
  private updateListeners: Set<(event: DataUpdateEvent) => void> = new Set()

  constructor(config?: DataSourceAdapterConfig) {
    this.config = {
      enableCache: config?.enableCache ?? true,
      cacheExpiration: config?.cacheExpiration ?? 60000,
      globalTimeout: config?.globalTimeout ?? 30000
    }

    // 创建 SimpleDataBridge 实例
    this.dataBridge = new SimpleDataBridge()
  }

  /**
   * 执行节点的数据源
   * @param nodeId 节点ID
   * @param dataKey 数据键（用于多数据源场景）
   * @param config 数据源配置
   * @returns 执行结果
   */
  async executeDataSource(
    nodeId: string,
    dataKey: string,
    config: DataSourceConfig
  ): Promise<DataSourceExecutionResult> {
    const startTime = Date.now()

    try {
      // 根据数据源类型执行
      switch (config.type) {
        case 'http':
          return await this.executeHttpDataSource(nodeId, dataKey, config)

        case 'static':
          return await this.executeStaticDataSource(nodeId, dataKey, config)

        case 'websocket':
          return await this.executeWebSocketDataSource(nodeId, dataKey, config)

        case 'script':
          return await this.executeScriptDataSource(nodeId, dataKey, config)

        default:
          throw new Error(`不支持的数据源类型: ${config.type}`)
      }
    } catch (error) {
      console.error(`[DataSourceAdapter] 数据源执行失败 (nodeId=${nodeId}, dataKey=${dataKey}):`, error)

      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime
      }
    }
  }

  /**
   * 执行节点的所有数据源（批量）
   * @param nodeId 节点ID
   * @param dataSources 数据源配置映射 { dataKey: DataSourceConfig }
   * @returns 执行结果映射 { dataKey: result }
   */
  async executeAllDataSources(
    nodeId: string,
    dataSources: Record<string, DataSourceConfig>
  ): Promise<Record<string, DataSourceExecutionResult>> {
    const results: Record<string, DataSourceExecutionResult> = {}

    // 并行执行所有数据源
    await Promise.all(
      Object.entries(dataSources).map(async ([dataKey, config]) => {
        results[dataKey] = await this.executeDataSource(nodeId, dataKey, config)
      })
    )

    return results
  }

  /**
   * 清理节点缓存
   * @param nodeId 节点ID
   */
  clearNodeCache(nodeId: string): void {
    this.dataBridge.clearComponentCache(nodeId)
    dataWarehouse.clearComponentCache(nodeId)
  }

  /**
   * 订阅数据更新事件
   * @param listener 监听器
   * @returns 取消订阅函数
   */
  onDataUpdate(listener: (event: DataUpdateEvent) => void): () => void {
    this.updateListeners.add(listener)
    return () => {
      this.updateListeners.delete(listener)
    }
  }

  /**
   * 销毁适配器
   */
  destroy(): void {
    this.updateListeners.clear()
  }

  // ==================== 私有方法：各类型数据源执行 ====================

  /**
   * 执行 HTTP 数据源
   */
  private async executeHttpDataSource(
    nodeId: string,
    dataKey: string,
    config: DataSourceConfig
  ): Promise<DataSourceExecutionResult> {
    const startTime = Date.now()

    // 构建 SimpleDataBridge 需要的数据需求格式
    const dataRequirement = {
      componentId: nodeId,
      dataSourceBindings: {
        dataSources: [
          {
            id: `${nodeId}-${dataKey}`,
            type: config.type,
            config: config.config
          }
        ]
      }
    }

    // 如果启用缓存，先检查缓存
    if (this.config.enableCache) {
      const cached = dataWarehouse.getData(nodeId)
      if (cached) {
        return {
          success: true,
          data: cached,
          duration: Date.now() - startTime,
          source: 'cache'
        }
      }
    }

    // 执行数据获取
    const result = await this.dataBridge.executeComponent(dataRequirement)

    if (result.success) {
      // 触发数据更新事件
      this.notifyDataUpdate({
        nodeId,
        dataKey,
        value: result.data,
        prevValue: null,
        timestamp: Date.now(),
        sourceType: config.type
      })

      return {
        success: true,
        data: result.data,
        duration: Date.now() - startTime,
        source: 'api'
      }
    } else {
      throw new Error(result.error || '数据获取失败')
    }
  }

  /**
   * 执行静态数据源
   */
  private async executeStaticDataSource(
    nodeId: string,
    dataKey: string,
    config: DataSourceConfig
  ): Promise<DataSourceExecutionResult> {
    const startTime = Date.now()

    // 静态数据直接返回
    const data = config.config?.value

    // 触发数据更新事件
    this.notifyDataUpdate({
      nodeId,
      dataKey,
      value: data,
      prevValue: null,
      timestamp: Date.now(),
      sourceType: 'static'
    })

    return {
      success: true,
      data,
      duration: Date.now() - startTime,
      source: 'static'
    }
  }

  /**
   * 执行 WebSocket 数据源
   */
  private async executeWebSocketDataSource(
    nodeId: string,
    dataKey: string,
    config: DataSourceConfig
  ): Promise<DataSourceExecutionResult> {
    const startTime = Date.now()

    // WebSocket 数据源需要特殊处理（订阅模式）
    // TODO: 实现 WebSocket 订阅逻辑
    console.warn('[DataSourceAdapter] WebSocket 数据源暂未实现')

    return {
      success: false,
      error: 'WebSocket 数据源暂未实现',
      duration: Date.now() - startTime
    }
  }

  /**
   * 执行脚本数据源
   */
  private async executeScriptDataSource(
    nodeId: string,
    dataKey: string,
    config: DataSourceConfig
  ): Promise<DataSourceExecutionResult> {
    const startTime = Date.now()

    try {
      // 执行脚本代码
      const script = config.config?.script
      if (!script) {
        throw new Error('脚本内容为空')
      }

      // 创建脚本执行上下文
      const context = {
        nodeId,
        dataKey,
        // 可以传入其他上下文数据
      }

      // 使用 Function 构造函数执行脚本
      const fn = new Function('context', script)
      const data = await fn(context)

      // 触发数据更新事件
      this.notifyDataUpdate({
        nodeId,
        dataKey,
        value: data,
        prevValue: null,
        timestamp: Date.now(),
        sourceType: 'script'
      })

      return {
        success: true,
        data,
        duration: Date.now() - startTime,
        source: 'script'
      }
    } catch (error) {
      throw new Error(`脚本执行失败: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * 通知数据更新
   */
  private notifyDataUpdate(event: DataUpdateEvent): void {
    this.updateListeners.forEach(listener => {
      try {
        listener(event)
      } catch (error) {
        console.error('[DataSourceAdapter] 数据更新监听器执行失败:', error)
      }
    })
  }
}

/**
 * 创建数据源适配器实例
 */
export function createDataSourceAdapter(config?: DataSourceAdapterConfig): DataSourceAdapter {
  return new DataSourceAdapter(config)
}
