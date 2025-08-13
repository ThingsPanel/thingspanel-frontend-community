/**
 * 静态数据源服务实现
 * 提供静态数据的数据源服务
 */

import type { DataSourceInfo } from '../types'
import type { DataSourceService, DataSourceSubscription } from '../data-source-center'

export interface StaticDataSourceConfig {
  name: string
  description?: string
  data: any
}

/**
 * 静态数据源服务
 * 提供静态数据，支持手动更新
 */
export class StaticDataSourceService implements DataSourceService {
  private id: string
  private config: StaticDataSourceConfig
  private subscribers = new Map<string, (data: any) => void>()
  private subscriptionCounter = 0

  constructor(id: string, config: StaticDataSourceConfig) {
    this.id = id
    this.config = config
    console.log(`📊 [StaticDataSourceService] 创建静态数据源: ${id}`)
  }

  getInfo(): DataSourceInfo {
    return {
      id: this.id,
      name: this.config.name,
      type: 'static',
      description: this.config.description,
      status: 'active',
      schema: this.config.data,
      config: this.config,
      lastUpdated: new Date()
    }
  }

  async getCurrentData(): Promise<any> {
    return Promise.resolve(this.config.data)
  }

  subscribe(callback: (data: any) => void): DataSourceSubscription {
    const subscriptionId = `static_${this.id}_${++this.subscriptionCounter}`
    this.subscribers.set(subscriptionId, callback)

    console.log(`📺 [StaticDataSourceService] 新增订阅: ${subscriptionId}`)

    // 立即发送当前数据
    setTimeout(() => {
      callback(this.config.data)
    }, 0)

    return {
      id: subscriptionId,
      unsubscribe: () => {
        this.subscribers.delete(subscriptionId)
        console.log(`🔌 [StaticDataSourceService] 取消订阅: ${subscriptionId}`)
      }
    }
  }

  validateConfig(config: any): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!config) {
      errors.push('配置不能为空')
    } else {
      if (!config.name || typeof config.name !== 'string') {
        errors.push('name 字段必须是非空字符串')
      }
      if (config.data === undefined) {
        errors.push('data 字段是必需的')
      }
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  updateConfig(config: StaticDataSourceConfig): void {
    const oldData = this.config.data
    this.config = config

    console.log(`🔄 [StaticDataSourceService] 更新配置: ${this.id}`)

    // 如果数据发生变化，通知所有订阅者
    if (JSON.stringify(oldData) !== JSON.stringify(config.data)) {
      this.notifySubscribers(config.data)
    }
  }

  /**
   * 手动更新数据
   * @param newData 新数据
   */
  updateData(newData: any): void {
    this.config.data = newData
    this.notifySubscribers(newData)
    console.log(`📊 [StaticDataSourceService] 手动更新数据: ${this.id}`)
  }

  destroy(): void {
    console.log(`🗑️ [StaticDataSourceService] 销毁数据源: ${this.id}`)
    this.subscribers.clear()
  }

  private notifySubscribers(data: any): void {
    const subscriberCount = this.subscribers.size
    if (subscriberCount > 0) {
      console.log(`📢 [StaticDataSourceService] 通知 ${subscriberCount} 个订阅者`)
      for (const [id, callback] of this.subscribers.entries()) {
        try {
          callback(data)
        } catch (error) {
          console.error(`❌ [StaticDataSourceService] 回调执行失败 ${id}:`, error)
        }
      }
    }
  }
}
