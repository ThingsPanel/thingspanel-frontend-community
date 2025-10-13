/**
 * 数据源执行器
 * 负责调度和执行所有数据源请求的引擎
 *
 * ✅ 已集成现有的 @/core/data-architecture/SimpleDataBridge 系统
 */

import type {
  DataSourceType,
  DataSourceConfig,
  IDataSourceProvider,
  IDataSourceInstance,
  DataUpdateEvent,
  DataSourceExecutorConfig
} from '../types'
import { StaticDataSourceProvider } from './providers/static.provider'
import { HttpDataSourceProvider } from './providers/http.provider'
import { WebSocketDataSourceProvider } from './providers/websocket.provider'
import { ScriptDataSourceProvider } from './providers/script.provider'
import { createDataSourceAdapter, type DataSourceAdapter } from '../adapters/DataSourceAdapter'

/**
 * 数据源执行器类
 */
export class DataSourceExecutor {
  /** 数据源提供者注册表 */
  private providers: Map<DataSourceType, IDataSourceProvider> = new Map()

  /** 活动的数据源实例 */
  private instances: Map<string, IDataSourceInstance> = new Map()

  /** 节点数据绑定映射: nodeId -> dataKey -> instanceId */
  private bindings: Map<string, Map<string, string>> = new Map()

  /** 数据更新监听器 */
  private updateListeners: Set<(event: DataUpdateEvent) => void> = new Set()

  /** 执行器配置 */
  private config: DataSourceExecutorConfig

  /** ✅ 数据源适配器（桥接现有系统） */
  private adapter: DataSourceAdapter

  constructor(config?: Partial<DataSourceExecutorConfig>) {
    this.config = {
      globalTimeout: 30000,
      maxConcurrent: 10,
      enableCache: true,
      cacheExpiration: 60000,
      ...config
    }

    // 创建数据源适配器
    this.adapter = createDataSourceAdapter({
      enableCache: this.config.enableCache,
      cacheExpiration: this.config.cacheExpiration,
      globalTimeout: this.config.globalTimeout
    })

    // 订阅适配器的数据更新事件
    this.adapter.onDataUpdate(event => {
      this.handleDataUpdate(event.nodeId, event.dataKey, event.value, event.prevValue, event.sourceType)
    })

    // 注册内置提供者
    this.registerDefaultProviders()
  }

  /**
   * 注册默认的数据源提供者
   */
  private registerDefaultProviders(): void {
    this.registerProvider(new StaticDataSourceProvider())
    this.registerProvider(new HttpDataSourceProvider())
    this.registerProvider(new WebSocketDataSourceProvider())
    this.registerProvider(new ScriptDataSourceProvider())
  }

  /**
   * 注册数据源提供者
   */
  registerProvider(provider: IDataSourceProvider): void {
    this.providers.set(provider.type, provider)
  }

  /**
   * 为节点绑定数据源
   * ✅ 优先使用适配器执行（对接现有系统）
   */
  async bindDataSource(
    nodeId: string,
    dataKey: string,
    config: DataSourceConfig
  ): Promise<void> {
    // ✅ 使用适配器执行数据源
    const result = await this.adapter.executeDataSource(nodeId, dataKey, config)

    if (result.success) {
      console.log(`[DataSourceExecutor] 数据源绑定成功 (nodeId=${nodeId}, dataKey=${dataKey}, source=${result.source}, duration=${result.duration}ms)`)
    } else {
      throw new Error(`数据源绑定失败: ${result.error}`)
    }

    // 保存绑定关系（用于后续刷新和解绑）
    if (!this.bindings.has(nodeId)) {
      this.bindings.set(nodeId, new Map())
    }
    // 将配置存储为 instanceId（简化版）
    this.bindings.get(nodeId)!.set(dataKey, `${nodeId}-${dataKey}`)
  }

  /**
   * 为节点批量绑定数据源
   */
  async bindDataSources(
    nodeId: string,
    dataSources: Record<string, DataSourceConfig>
  ): Promise<void> {
    const promises = Object.entries(dataSources).map(([dataKey, config]) =>
      this.bindDataSource(nodeId, dataKey, config)
    )

    await Promise.all(promises)
  }

  /**
   * 解绑节点的数据源
   */
  async unbindDataSource(nodeId: string, dataKey: string): Promise<void> {
    const nodeBindings = this.bindings.get(nodeId)
    if (!nodeBindings) return

    const instanceId = nodeBindings.get(dataKey)
    if (!instanceId) return

    // 移除绑定关系
    nodeBindings.delete(dataKey)

    // 如果该实例没有其他绑定，销毁它
    if (!this.isInstanceInUse(instanceId)) {
      await this.destroyInstance(instanceId)
    }
  }

  /**
   * 解绑节点的所有数据源
   */
  async unbindAllDataSources(nodeId: string): Promise<void> {
    const nodeBindings = this.bindings.get(nodeId)
    if (!nodeBindings) return

    const dataKeys = Array.from(nodeBindings.keys())
    await Promise.all(dataKeys.map(dataKey => this.unbindDataSource(nodeId, dataKey)))

    this.bindings.delete(nodeId)
  }

  /**
   * 刷新节点的数据源
   */
  async refreshDataSource(nodeId: string, dataKey: string): Promise<void> {
    const instance = this.getInstanceByBinding(nodeId, dataKey)
    if (instance) {
      await instance.refresh()
    }
  }

  /**
   * 刷新节点的所有数据源
   */
  async refreshAllDataSources(nodeId: string): Promise<void> {
    const nodeBindings = this.bindings.get(nodeId)
    if (!nodeBindings) return

    const promises = Array.from(nodeBindings.keys()).map(dataKey =>
      this.refreshDataSource(nodeId, dataKey)
    )

    await Promise.all(promises)
  }

  /**
   * 获取节点数据源的当前值
   */
  getDataSourceValue(nodeId: string, dataKey: string): any {
    const instance = this.getInstanceByBinding(nodeId, dataKey)
    return instance?.value
  }

  /**
   * 获取节点所有数据源的当前值
   */
  getAllDataSourceValues(nodeId: string): Record<string, any> {
    const nodeBindings = this.bindings.get(nodeId)
    if (!nodeBindings) return {}

    const values: Record<string, any> = {}
    nodeBindings.forEach((instanceId, dataKey) => {
      const instance = this.instances.get(instanceId)
      if (instance) {
        values[dataKey] = instance.value
      }
    })

    return values
  }

  /**
   * 订阅数据更新事件
   */
  onDataUpdate(listener: (event: DataUpdateEvent) => void): () => void {
    this.updateListeners.add(listener)
    return () => {
      this.updateListeners.delete(listener)
    }
  }

  /**
   * 获取统计信息
   */
  getStats() {
    const typeStats: Record<string, number> = {}
    const statusStats: Record<string, number> = {}

    this.instances.forEach(instance => {
      const type = instance.config.type
      const status = instance.status

      typeStats[type] = (typeStats[type] || 0) + 1
      statusStats[status] = (statusStats[status] || 0) + 1
    })

    return {
      totalInstances: this.instances.size,
      totalBindings: Array.from(this.bindings.values()).reduce(
        (sum, bindings) => sum + bindings.size,
        0
      ),
      typeStats,
      statusStats
    }
  }

  /**
   * 销毁执行器
   */
  async destroy(): Promise<void> {
    // ✅ 销毁适配器
    this.adapter.destroy()

    // 停止所有数据源实例
    const promises = Array.from(this.instances.values()).map(instance => instance.stop())
    await Promise.all(promises)

    // 清空所有数据
    this.instances.clear()
    this.bindings.clear()
    this.updateListeners.clear()
  }

  // ==================== 私有方法 ====================

  /**
   * 根据绑定关系获取数据源实例
   */
  private getInstanceByBinding(nodeId: string, dataKey: string): IDataSourceInstance | undefined {
    const nodeBindings = this.bindings.get(nodeId)
    if (!nodeBindings) return undefined

    const instanceId = nodeBindings.get(dataKey)
    if (!instanceId) return undefined

    return this.instances.get(instanceId)
  }

  /**
   * 检查数据源实例是否还在使用中
   */
  private isInstanceInUse(instanceId: string): boolean {
    for (const nodeBindings of this.bindings.values()) {
      for (const id of nodeBindings.values()) {
        if (id === instanceId) {
          return true
        }
      }
    }
    return false
  }

  /**
   * 销毁数据源实例
   */
  private async destroyInstance(instanceId: string): Promise<void> {
    const instance = this.instances.get(instanceId)
    if (!instance) return

    await instance.stop()
    this.instances.delete(instanceId)
  }

  /**
   * 处理数据更新
   */
  private handleDataUpdate(
    nodeId: string,
    dataKey: string,
    value: any,
    prevValue: any,
    sourceType: DataSourceType
  ): void {
    const event: DataUpdateEvent = {
      nodeId,
      dataKey,
      value,
      prevValue,
      timestamp: Date.now(),
      sourceType
    }

    // 通知所有监听器
    this.updateListeners.forEach(listener => {
      try {
        listener(event)
      } catch (error) {
        console.error('[DataSourceExecutor] 数据更新监听器执行失败:', error)
      }
    })
  }
}

/**
 * 创建默认的数据源执行器实例
 */
export function createDataSourceExecutor(
  config?: Partial<DataSourceExecutorConfig>
): DataSourceExecutor {
  return new DataSourceExecutor(config)
}
