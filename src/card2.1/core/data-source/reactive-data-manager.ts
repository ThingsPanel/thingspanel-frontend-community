/**
 * 响应式数据管理器
 * 支持轮询更新、实时订阅等响应式数据获取
 */

import type { StaticDataSource } from './static-data-source'
import type { DeviceApiDataSource } from './device-api-data-source'
import { dataBindingManager } from './data-binding-manager'

type DataSource = StaticDataSource | DeviceApiDataSource

export interface ReactiveDataSourceConfig {
  dataSourceId: string
  updateStrategy: 'static' | 'polling' | 'realtime'
  updateInterval?: number // 轮询间隔，单位：毫秒
  autoStart?: boolean
}

export interface ReactiveSubscription {
  id: string
  dataSourceId: string
  callback: (data: any) => void
  config: ReactiveDataSourceConfig
  isActive: boolean
  lastUpdate?: Date
  errorCount: number
}

/**
 * 响应式数据管理器
 */
export class ReactiveDataManager {
  private subscriptions = new Map<string, ReactiveSubscription>()
  private pollingTimers = new Map<string, NodeJS.Timeout>()
  private dataSources = new Map<string, DataSource>()

  /**
   * 注册数据源
   */
  registerDataSource(dataSource: DataSource) {
    this.dataSources.set(dataSource.getId(), dataSource)
    console.log(`📡 [ReactiveDataManager] 注册数据源: ${dataSource.getId()}`)
  }

  /**
   * 移除数据源
   */
  removeDataSource(dataSourceId: string) {
    // 停止相关订阅
    const subscriptionsToRemove: string[] = []
    for (const [subId, subscription] of this.subscriptions.entries()) {
      if (subscription.dataSourceId === dataSourceId) {
        subscriptionsToRemove.push(subId)
      }
    }

    subscriptionsToRemove.forEach(subId => {
      this.unsubscribe(subId)
    })

    this.dataSources.delete(dataSourceId)
    console.log(`🗑️ [ReactiveDataManager] 移除数据源: ${dataSourceId}`)
  }

  /**
   * 创建响应式订阅
   */
  subscribe(
    dataSourceId: string,
    callback: (data: any) => void,
    config: Omit<ReactiveDataSourceConfig, 'dataSourceId'>
  ): string {
    const subscriptionId = `${dataSourceId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    const subscription: ReactiveSubscription = {
      id: subscriptionId,
      dataSourceId,
      callback,
      config: { ...config, dataSourceId },
      isActive: false,
      errorCount: 0
    }

    this.subscriptions.set(subscriptionId, subscription)

    console.log(`📺 [ReactiveDataManager] 创建订阅: ${subscriptionId}`, config)

    // 如果配置为自动启动，立即开始
    if (config.autoStart !== false) {
      this.startSubscription(subscriptionId)
    }

    return subscriptionId
  }

  /**
   * 取消订阅
   */
  unsubscribe(subscriptionId: string) {
    const subscription = this.subscriptions.get(subscriptionId)
    if (!subscription) return

    this.stopSubscription(subscriptionId)
    this.subscriptions.delete(subscriptionId)

    console.log(`🚫 [ReactiveDataManager] 取消订阅: ${subscriptionId}`)
  }

  /**
   * 启动订阅
   */
  startSubscription(subscriptionId: string) {
    const subscription = this.subscriptions.get(subscriptionId)
    if (!subscription || subscription.isActive) return

    const dataSource = this.dataSources.get(subscription.dataSourceId)
    if (!dataSource) {
      console.warn(`⚠️ [ReactiveDataManager] 数据源不存在: ${subscription.dataSourceId}`)
      return
    }

    subscription.isActive = true
    console.log(`▶️ [ReactiveDataManager] 启动订阅: ${subscriptionId}`)

    switch (subscription.config.updateStrategy) {
      case 'static':
        // 静态数据：只获取一次
        this.fetchDataOnce(subscriptionId)
        break

      case 'polling':
        // 轮询更新：按间隔定期获取
        this.startPolling(subscriptionId)
        break

      case 'realtime':
        // 实时更新：WebSocket等（暂未实现）
        console.warn(`⚠️ [ReactiveDataManager] 实时更新暂未实现: ${subscriptionId}`)
        this.fetchDataOnce(subscriptionId)
        break

      default:
        console.warn(`⚠️ [ReactiveDataManager] 不支持的更新策略: ${subscription.config.updateStrategy}`)
    }
  }

  /**
   * 停止订阅
   */
  stopSubscription(subscriptionId: string) {
    const subscription = this.subscriptions.get(subscriptionId)
    if (!subscription || !subscription.isActive) return

    subscription.isActive = false

    // 清除轮询定时器
    const timer = this.pollingTimers.get(subscriptionId)
    if (timer) {
      clearInterval(timer)
      this.pollingTimers.delete(subscriptionId)
    }

    console.log(`⏸️ [ReactiveDataManager] 停止订阅: ${subscriptionId}`)
  }

  /**
   * 获取单次数据
   */
  private async fetchDataOnce(subscriptionId: string) {
    const subscription = this.subscriptions.get(subscriptionId)
    if (!subscription) return

    const dataSource = this.dataSources.get(subscription.dataSourceId)
    if (!dataSource) return

    try {
      console.log(`🔄 [ReactiveDataManager] 获取数据: ${subscriptionId}`)

      const data = await dataSource.getValue()
      subscription.lastUpdate = new Date()
      subscription.errorCount = 0

      // 触发回调
      subscription.callback(data)

      console.log(`✅ [ReactiveDataManager] 数据获取成功: ${subscriptionId}`, data)
    } catch (error) {
      subscription.errorCount++
      console.error(`❌ [ReactiveDataManager] 数据获取失败: ${subscriptionId}`, error)

      // 如果错误次数过多，暂停订阅
      if (subscription.errorCount >= 3) {
        console.warn(`⚠️ [ReactiveDataManager] 错误次数过多，暂停订阅: ${subscriptionId}`)
        this.stopSubscription(subscriptionId)
      }

      // 触发回调，传递错误信息
      subscription.callback({ error: error instanceof Error ? error.message : '数据获取失败' })
    }
  }

  /**
   * 开始轮询
   */
  private startPolling(subscriptionId: string) {
    const subscription = this.subscriptions.get(subscriptionId)
    if (!subscription) return

    const interval = subscription.config.updateInterval || 5000 // 默认5秒

    // 立即获取一次数据
    this.fetchDataOnce(subscriptionId)

    // 设置定时器
    const timer = setInterval(() => {
      if (subscription.isActive) {
        this.fetchDataOnce(subscriptionId)
      }
    }, interval)

    this.pollingTimers.set(subscriptionId, timer)

    console.log(`🔄 [ReactiveDataManager] 开始轮询: ${subscriptionId}, 间隔: ${interval}ms`)
  }

  /**
   * 更新订阅配置
   */
  updateSubscriptionConfig(subscriptionId: string, newConfig: Partial<ReactiveDataSourceConfig>) {
    const subscription = this.subscriptions.get(subscriptionId)
    if (!subscription) return

    const wasActive = subscription.isActive

    // 停止当前订阅
    if (wasActive) {
      this.stopSubscription(subscriptionId)
    }

    // 更新配置
    subscription.config = { ...subscription.config, ...newConfig }

    // 如果之前是活跃的，重新启动
    if (wasActive) {
      this.startSubscription(subscriptionId)
    }

    console.log(`🔄 [ReactiveDataManager] 更新订阅配置: ${subscriptionId}`, newConfig)
  }

  /**
   * 手动刷新订阅数据
   */
  async refreshSubscription(subscriptionId: string) {
    const subscription = this.subscriptions.get(subscriptionId)
    if (!subscription) return

    await this.fetchDataOnce(subscriptionId)
  }

  /**
   * 获取订阅状态
   */
  getSubscriptionStatus(subscriptionId: string): ReactiveSubscription | undefined {
    return this.subscriptions.get(subscriptionId)
  }

  /**
   * 获取所有订阅
   */
  getAllSubscriptions(): ReactiveSubscription[] {
    return Array.from(this.subscriptions.values())
  }

  /**
   * 暂停所有订阅
   */
  pauseAll() {
    for (const subscriptionId of this.subscriptions.keys()) {
      this.stopSubscription(subscriptionId)
    }
    console.log(`⏸️ [ReactiveDataManager] 暂停所有订阅`)
  }

  /**
   * 恢复所有订阅
   */
  resumeAll() {
    for (const subscriptionId of this.subscriptions.keys()) {
      this.startSubscription(subscriptionId)
    }
    console.log(`▶️ [ReactiveDataManager] 恢复所有订阅`)
  }

  /**
   * 清理资源
   */
  dispose() {
    // 停止所有订阅
    for (const subscriptionId of this.subscriptions.keys()) {
      this.unsubscribe(subscriptionId)
    }

    // 清理数据源
    this.dataSources.clear()

    console.log(`🧹 [ReactiveDataManager] 清理完成`)
  }
}

// 导出单例
export const reactiveDataManager = new ReactiveDataManager()
export default reactiveDataManager
