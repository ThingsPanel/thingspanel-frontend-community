/**
 * 数据源系统接口定义（契约）
 * 定义了数据源提供者必须实现的接口
 */

import type {
  DataSourceType,
  DataSourceConfig,
  IDataSourceInstance,
  IDataSourceProvider,
  ValidationResult,
  DataChangeCallback,
  DataSourceStatus
} from '../types'

/**
 * 抽象数据源实例基类
 * 提供通用的数据源实例实现
 */
export abstract class BaseDataSourceInstance implements IDataSourceInstance {
  public id: string
  public config: DataSourceConfig
  public value: any = null
  public status: DataSourceStatus = 'idle'
  public error: string | null = null
  public lastUpdated: number | null = null

  private listeners: Set<DataChangeCallback> = new Set()
  private pollTimer: number | null = null

  constructor(id: string, config: DataSourceConfig) {
    this.id = id
    this.config = config
  }

  /**
   * 开始执行数据源
   */
  async start(): Promise<void> {
    if (!this.config.enabled) return

    try {
      await this.fetch()

      // 如果配置了轮询，启动轮询
      if (this.config.pollInterval > 0) {
        this.startPolling()
      }
    } catch (error) {
      this.handleError(error)
    }
  }

  /**
   * 停止执行数据源
   */
  async stop(): Promise<void> {
    this.stopPolling()
    await this.cleanup()
  }

  /**
   * 手动刷新数据
   */
  async refresh(): Promise<void> {
    await this.fetch()
  }

  /**
   * 订阅数据变化
   */
  subscribe(callback: DataChangeCallback): () => void {
    this.listeners.add(callback)

    // 返回取消订阅函数
    return () => {
      this.listeners.delete(callback)
    }
  }

  /**
   * 抽象方法：获取数据（由子类实现）
   */
  protected abstract fetchData(): Promise<any>

  /**
   * 抽象方法：清理资源（由子类实现）
   */
  protected abstract cleanup(): Promise<void>

  /**
   * 执行数据获取
   */
  private async fetch(): Promise<void> {
    this.status = 'loading'
    this.error = null

    try {
      const rawData = await this.fetchData()
      const transformedData = this.transform(rawData)

      const prevValue = this.value
      this.value = transformedData
      this.lastUpdated = Date.now()
      this.status = 'success'

      // 通知所有订阅者
      this.notifyListeners(prevValue)
    } catch (error) {
      this.handleError(error)
    }
  }

  /**
   * 数据转换
   */
  private transform(rawData: any): any {
    if (!this.config.transformScript) {
      return rawData
    }

    try {
      // 执行转换脚本
      const transformer = new Function('data', this.config.transformScript)
      return transformer(rawData)
    } catch (error) {
      console.warn(`[DataSource] 数据转换失败:`, error)
      return rawData
    }
  }

  /**
   * 通知所有订阅者
   */
  private notifyListeners(prevValue: any): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.value, prevValue)
      } catch (error) {
        console.error('[DataSource] 订阅回调执行失败:', error)
      }
    })
  }

  /**
   * 处理错误
   */
  private handleError(error: unknown): void {
    this.status = 'error'
    this.error = error instanceof Error ? error.message : String(error)
    console.error(`[DataSource] ${this.config.name} 执行失败:`, error)
  }

  /**
   * 启动轮询
   */
  private startPolling(): void {
    this.stopPolling()

    this.pollTimer = window.setInterval(() => {
      this.fetch()
    }, this.config.pollInterval)
  }

  /**
   * 停止轮询
   */
  private stopPolling(): void {
    if (this.pollTimer !== null) {
      clearInterval(this.pollTimer)
      this.pollTimer = null
    }
  }
}

/**
 * 抽象数据源提供者基类
 * 提供通用的提供者实现
 */
export abstract class BaseDataSourceProvider<T extends DataSourceConfig = DataSourceConfig>
  implements IDataSourceProvider<T>
{
  abstract readonly type: DataSourceType

  /**
   * 创建数据源实例
   */
  abstract create(config: T): IDataSourceInstance

  /**
   * 销毁数据源实例
   */
  async destroy(instance: IDataSourceInstance): Promise<void> {
    await instance.stop()
  }

  /**
   * 验证配置
   */
  validate(config: T): ValidationResult {
    const errors: string[] = []

    // 基础验证
    if (!config.name) {
      errors.push('数据源名称不能为空')
    }

    if (config.pollInterval < 0) {
      errors.push('轮询间隔不能为负数')
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }
}
