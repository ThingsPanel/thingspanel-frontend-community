/**
 * 数据源管理器
 */

import type {
  DataSource,
  DataSourceValue,
  DataSourceUpdateCallback,
  DataSourceManager,
  StaticDataSource,
  DeviceDataSource,
  HttpDataSource
} from '../types/data-source'
import { DataSourceType } from '../types/data-source'
import { dataPathResolver } from '../utils/data-path-resolver'

class DataSourceManagerImpl implements DataSourceManager {
  private subscriptions = new Map<string, Set<DataSourceUpdateCallback>>()
  private values = new Map<string, DataSourceValue>()
  private intervals = new Map<string, NodeJS.Timeout>()

  // 生成订阅键
  private getSubscriptionKey(dataSource: DataSource): string {
    return `${dataSource.type}_${dataSource.name}`
  }

  // 订阅数据源
  subscribe(dataSource: DataSource, callback: DataSourceUpdateCallback): () => void {
    const key = this.getSubscriptionKey(dataSource)

    if (!this.subscriptions.has(key)) {
      this.subscriptions.set(key, new Set())
    }

    this.subscriptions.get(key)!.add(callback)

    // 立即获取一次数据
    this.getValue(dataSource).then(value => {
      callback(value)
    })

    // 如果有刷新间隔，启动定时器
    if (dataSource.refreshInterval && dataSource.refreshInterval > 0) {
      this.startRefreshTimer(dataSource)
    }

    console.log(`🔧 [DataSourceManager] 订阅数据源: ${key}`)

    // 返回取消订阅函数
    return () => {
      this.unsubscribe(dataSource, callback)
    }
  }

  // 取消订阅
  unsubscribe(dataSource: DataSource, callback: DataSourceUpdateCallback): void {
    const key = this.getSubscriptionKey(dataSource)
    const callbacks = this.subscriptions.get(key)

    if (callbacks) {
      callbacks.delete(callback)

      // 如果没有订阅者了，清理资源
      if (callbacks.size === 0) {
        this.subscriptions.delete(key)
        this.stopRefreshTimer(dataSource)
      }
    }

    console.log(`🔧 [DataSourceManager] 取消订阅数据源: ${key}`)
  }

  // 获取数据源值
  async getValue(dataSource: DataSource): Promise<DataSourceValue> {
    const key = this.getSubscriptionKey(dataSource)

    // 根据数据源类型获取数据
    let rawData: any
    let unit: string | undefined

    switch (dataSource.type) {
      case DataSourceType.STATIC:
        rawData = await this.getStaticValue(dataSource as StaticDataSource)
        break
      case DataSourceType.DEVICE: {
        const deviceResult = await this.getDeviceValue(dataSource as DeviceDataSource)
        rawData = deviceResult
        unit = deviceResult?.unit
        break
      }
      case DataSourceType.HTTP:
        rawData = await this.getHttpValue(dataSource as HttpDataSource)
        break
      case DataSourceType.WEBSOCKET:
        rawData = await this.getWebSocketValue(dataSource)
        break
      default:
        rawData = null
    }

    // 处理多Key映射
    const values: Record<string, any> = {}

    if (dataSource.dataPaths && dataSource.dataPaths.length > 0) {
      // 使用配置的数据路径映射
      dataSource.dataPaths.forEach(mapping => {
        const resolvedValue = dataPathResolver.resolve(rawData, mapping.key)
        values[mapping.target] = resolvedValue
      })
    } else {
      // 兼容旧版本，使用单个值
      const resolvedValue = dataPathResolver.resolve(rawData, '')
      values['value'] = resolvedValue
    }

    const value: DataSourceValue = {
      values,
      timestamp: Date.now(),
      quality: Object.values(values).some(v => v !== undefined) ? 'good' : 'bad',
      metadata: {
        source: dataSource.type,
        dataPaths: dataSource.dataPaths,
        originalData: rawData
      },
      rawData
    }

    // 缓存值（使用包含数据路径的键）
    const cacheKey = `${key}_${JSON.stringify(dataSource.dataPaths || [])}`
    this.values.set(cacheKey, value)

    return value
  }

  // 更新数据源值
  updateValue(dataSource: DataSource, value: any): void {
    const key = this.getSubscriptionKey(dataSource)
    const cacheKey = `${key}_${JSON.stringify(dataSource.dataPaths || [])}`

    // 处理多Key映射
    const values: Record<string, any> = {}

    if (dataSource.dataPaths && dataSource.dataPaths.length > 0) {
      // 使用配置的数据路径映射
      dataSource.dataPaths.forEach(mapping => {
        const resolvedValue = dataPathResolver.resolve(value, mapping.key)
        values[mapping.target] = resolvedValue
      })
    } else {
      // 兼容旧版本，使用单个值
      const resolvedValue = dataPathResolver.resolve(value, '')
      values['value'] = resolvedValue
    }

    const dataSourceValue: DataSourceValue = {
      values,
      timestamp: Date.now(),
      quality: 'good',
      metadata: {
        source: dataSource.type,
        dataPaths: dataSource.dataPaths,
        originalData: value
      },
      rawData: value
    }

    // 更新缓存
    this.values.set(cacheKey, dataSourceValue)

    // 通知订阅者
    const callbacks = this.subscriptions.get(key)
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(dataSourceValue)
        } catch (error) {
          console.error('数据源回调执行错误:', error)
        }
      })
    }
  }

  // 获取静态数据源值
  private async getStaticValue(dataSource: StaticDataSource): Promise<any> {
    // 直接返回原始数据，让数据路径解析器处理
    return dataSource.data
  }

  // 获取设备数据源值
  private async getDeviceValue(dataSource: DeviceDataSource): Promise<any> {
    try {
      if (!dataSource.deviceId || !dataSource.metricsId) {
        throw new Error('设备ID和指标ID不能为空')
      }

      // 这里应该调用实际的设备数据API
      // 根据 dataSource 的配置构建请求参数
      const params = {
        deviceId: dataSource.deviceId,
        metricsId: dataSource.metricsId,
        metricsType: dataSource.metricsType || 'telemetry',
        aggregateFunction: dataSource.aggregateFunction || 'avg',
        timeRange: dataSource.timeRange || 'last_1h'
      }

      console.log('🔧 [DataSourceManager] 请求设备数据:', params)

      // 暂时返回模拟数据，实际应该调用API
      // const response = await fetch(`/api/device/data`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(params)
      // })
      // const data = await response.json()

      // 模拟设备数据
      const mockData = {
        value: Math.random() * 100,
        timestamp: Date.now(),
        unit: '%',
        deviceId: dataSource.deviceId,
        metricsId: dataSource.metricsId,
        metricsName: dataSource.metricsName,
        metricsType: dataSource.metricsType,
        aggregateFunction: dataSource.aggregateFunction,
        timeRange: dataSource.timeRange
      }

      console.log('🔧 [DataSourceManager] 设备数据获取成功:', mockData)

      return mockData
    } catch (error) {
      console.error('🔧 [DataSourceManager] 设备数据获取失败:', error)
      throw error
    }
  }

  // 获取HTTP数据源值
  private async getHttpValue(dataSource: HttpDataSource): Promise<any> {
    try {
      // 构建请求头
      const headers: Record<string, string> = {}
      dataSource.headers?.forEach(header => {
        if (header.key && header.value) {
          headers[header.key] = header.value
        }
      })

      // 构建请求选项
      const options: RequestInit = {
        method: dataSource.method,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        }
      }

      // 添加请求体
      if (dataSource.method !== 'GET' && dataSource.body) {
        try {
          options.body = dataSource.body
        } catch (error) {
          console.error('HTTP 请求体解析失败:', error)
          throw new Error('请求体格式错误')
        }
      }

      // 发起请求
      const response = await fetch(dataSource.url, options)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

      console.log('🔧 [DataSourceManager] HTTP 请求成功:', {
        url: dataSource.url,
        method: dataSource.method,
        status: response.status,
        data
      })

      return data
    } catch (error) {
      console.error('🔧 [DataSourceManager] HTTP 请求失败:', error)
      throw error
    }
  }

  // 获取WebSocket数据源值
  private async getWebSocketValue(dataSource: any): Promise<any> {
    // 这里应该处理WebSocket连接
    return null
  }

  // 启动刷新定时器
  private startRefreshTimer(dataSource: DataSource): void {
    const key = this.getSubscriptionKey(dataSource)

    // 清除现有定时器
    this.stopRefreshTimer(dataSource)

    if (dataSource.refreshInterval && dataSource.refreshInterval > 0) {
      const interval = setInterval(() => {
        this.getValue(dataSource)
          .then(value => {
            this.updateValue(dataSource, value.rawData)
          })
          .catch(error => {
            console.error('🔧 [DataSourceManager] 轮询请求失败:', error)
          })
      }, dataSource.refreshInterval * 1000) // 转换为毫秒

      this.intervals.set(key, interval)

      console.log(`🔧 [DataSourceManager] 启动轮询: ${key}, 间隔: ${dataSource.refreshInterval}秒`)
    }
  }

  // 停止刷新定时器
  private stopRefreshTimer(dataSource: DataSource): void {
    const key = this.getSubscriptionKey(dataSource)
    const interval = this.intervals.get(key)

    if (interval) {
      clearInterval(interval)
      this.intervals.delete(key)
    }
  }

  // 清理所有资源
  destroy(): void {
    // 清理所有定时器
    this.intervals.forEach(interval => {
      clearInterval(interval)
    })
    this.intervals.clear()

    // 清理订阅
    this.subscriptions.clear()

    // 清理缓存
    this.values.clear()
  }
}

// 导出单例
export const dataSourceManager = new DataSourceManagerImpl()
export default dataSourceManager
