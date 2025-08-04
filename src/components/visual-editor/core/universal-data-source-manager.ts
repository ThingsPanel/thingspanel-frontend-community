/**
 * 通用数据源管理器
 * 支持多种数据源类型：静态、设备、HTTP、WebSocket
 */

import type {
  DataSource,
  DataSourceValue,
  DataSourceUpdateCallback,
  StaticDataSource,
  DeviceDataSource,
  HttpDataSource,
  WebSocketDataSource,
  DataPathMapping
} from '../types/data-source'
import { DataSourceType } from '../types/data-source'
import { dataPathResolver } from '../utils/data-path-resolver'

// 设备数据API (从原有的data-source-manager导入)
import { telemetryDataCurrentKeys, telemetryDataHistoryList, getAttributeDataSet } from '@/service/api/device'

class UniversalDataSourceManagerImpl {
  private subscriptions = new Map<string, Set<DataSourceUpdateCallback>>()
  private values = new Map<string, DataSourceValue>()
  private intervals = new Map<string, NodeJS.Timeout>()

  // 生成订阅键
  private getSubscriptionKey(dataSource: DataSource): string {
    return `${dataSource.type}_${dataSource.name}_${JSON.stringify(dataSource.dataPaths || [])}`
  }

  // 订阅数据源
  subscribe(dataSource: DataSource, callback: DataSourceUpdateCallback): () => void {
    const key = this.getSubscriptionKey(dataSource)

    console.log('🔧 [UniversalDataSourceManager] 订阅数据源:', {
      type: dataSource.type,
      name: dataSource.name,
      key,
      dataPaths: dataSource.dataPaths
    })

    if (!this.subscriptions.has(key)) {
      this.subscriptions.set(key, new Set())
    }

    this.subscriptions.get(key)!.add(callback)

    // 立即获取一次数据
    this.getValue(dataSource).then(value => {
      callback(value)
    }).catch(error => {
      console.error('立即获取数据失败:', error)
      // 发送错误状态的数据
      callback({
        values: {},
        timestamp: Date.now(),
        quality: 'bad',
        error: error.message
      })
    })

    // 如果有刷新间隔，启动定时器
    if (dataSource.refreshInterval && dataSource.refreshInterval > 0) {
      this.startRefreshTimer(dataSource)
    }

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

    console.log('🔧 [UniversalDataSourceManager] 取消订阅数据源:', key)
  }

  // 获取数据源值
  async getValue(dataSource: DataSource): Promise<DataSourceValue> {
    const key = this.getSubscriptionKey(dataSource)
    
    console.log('🔧 [UniversalDataSourceManager] 获取数据源值:', {
      type: dataSource.type,
      key,
      dataPaths: dataSource.dataPaths
    })

    // 根据数据源类型获取数据
    let rawData: any

    try {
      switch (dataSource.type) {
        case DataSourceType.STATIC:
          rawData = await this.getStaticValue(dataSource as StaticDataSource)
          break
        case DataSourceType.DEVICE:
          rawData = await this.getDeviceValue(dataSource as DeviceDataSource)
          break
        case DataSourceType.HTTP:
          rawData = await this.getHttpValue(dataSource as HttpDataSource)
          break
        case DataSourceType.WEBSOCKET:
          rawData = await this.getWebSocketValue(dataSource as WebSocketDataSource)
          break
        default:
          throw new Error(`不支持的数据源类型: ${dataSource.type}`)
      }
    } catch (error) {
      console.error('🔧 [UniversalDataSourceManager] 获取原始数据失败:', error)
      throw error
    }

    // 处理多Key映射
    const values: Record<string, any> = {}
    
    if (dataSource.dataPaths && dataSource.dataPaths.length > 0) {
      // 使用配置的数据路径映射
      dataSource.dataPaths.forEach(mapping => {
        const resolvedValue = dataPathResolver.resolve(rawData, mapping.key)
        values[mapping.target] = resolvedValue
        
        console.log('🔧 [UniversalDataSourceManager] 映射数据:', {
          key: mapping.key,
          target: mapping.target,
          resolvedValue,
          rawData
        })
      })
    } else {
      // 兼容旧版本，使用单个值
      const resolvedValue = dataPathResolver.resolve(rawData, '')
      values['value'] = resolvedValue
    }

    const dataSourceValue: DataSourceValue = {
      values,
      timestamp: Date.now(),
      quality: Object.values(values).some(v => v !== undefined && v !== null) ? 'good' : 'bad',
      metadata: {
        source: dataSource.type,
        dataPaths: dataSource.dataPaths,
        originalData: rawData
      },
      rawData
    }
    
    console.log('🔧 [UniversalDataSourceManager] 最终数据源值:', dataSourceValue)
    
    // 更新缓存
    this.values.set(key, dataSourceValue)
    
    return dataSourceValue
  }

  // 更新数据源值并通知订阅者
  updateValue(dataSource: DataSource, value: any): void {
    const key = this.getSubscriptionKey(dataSource)
    
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
      quality: Object.values(values).some(v => v !== undefined) ? 'good' : 'bad',
      metadata: {
        source: dataSource.type,
        dataPaths: dataSource.dataPaths,
        originalData: value
      },
      rawData: value
    }
    
    // 更新缓存
    this.values.set(key, dataSourceValue)
    
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
    console.log('🔧 [UniversalDataSourceManager] 获取静态数据源:', dataSource.data)
    // 直接返回原始数据，让数据路径解析器处理
    return dataSource.data
  }

  // 获取设备数据源值
  private async getDeviceValue(dataSource: DeviceDataSource): Promise<any> {
    if (!dataSource.deviceId || !dataSource.metricsType || !dataSource.metricsId) {
      throw new Error('设备数据源配置不完整')
    }

    console.log('🔧 [UniversalDataSourceManager] 获取设备数据源:', {
      deviceId: dataSource.deviceId,
      metricsType: dataSource.metricsType,
      metricsId: dataSource.metricsId
    })

    try {
      switch (dataSource.metricsType) {
        case 'telemetry':
          const response = await telemetryDataCurrentKeys({
            device_id: dataSource.deviceId,
            keys: dataSource.metricsId
          })
          return {
            value: response?.data?.[0]?.value,
            timestamp: new Date().toISOString(),
            quality: 'good',
            unit: response?.data?.[0]?.unit
          }
          
        case 'attributes':
          const attrResponse = await getAttributeDataSet({ device_id: dataSource.deviceId })
          const attributeData = attrResponse?.data?.find((item: any) => item.key === dataSource.metricsId)
          return {
            value: attributeData?.value,
            timestamp: new Date().toISOString(),
            quality: 'good',
            unit: attributeData?.unit
          }
          
        default:
          throw new Error(`不支持的设备数据类型: ${dataSource.metricsType}`)
      }
    } catch (error) {
      console.error('获取设备数据失败:', error)
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
        options.body = dataSource.body
      }

      // 发起请求
      const response = await fetch(dataSource.url, options)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

      console.log('🔧 [UniversalDataSourceManager] HTTP 请求成功:', {
        url: dataSource.url,
        method: dataSource.method,
        status: response.status,
        data
      })

      return data
    } catch (error) {
      console.error('🔧 [UniversalDataSourceManager] HTTP 请求失败:', error)
      throw error
    }
  }

  // 获取WebSocket数据源值
  private async getWebSocketValue(dataSource: WebSocketDataSource): Promise<any> {
    // WebSocket 数据源暂时返回模拟数据
    console.log('🔧 [UniversalDataSourceManager] WebSocket 数据源暂未实现')
    return {
      message: 'WebSocket数据源暂未实现',
      timestamp: new Date().toISOString()
    }
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
            console.error('🔧 [UniversalDataSourceManager] 轮询请求失败:', error)
          })
      }, dataSource.refreshInterval * 1000) // 转换为毫秒

      this.intervals.set(key, interval)

      console.log(`🔧 [UniversalDataSourceManager] 启动轮询: ${key}, 间隔: ${dataSource.refreshInterval}秒`)
    }
  }

  // 停止刷新定时器
  private stopRefreshTimer(dataSource: DataSource): void {
    const key = this.getSubscriptionKey(dataSource)
    const interval = this.intervals.get(key)

    if (interval) {
      clearInterval(interval)
      this.intervals.delete(key)
      console.log(`🔧 [UniversalDataSourceManager] 停止轮询: ${key}`)
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
    this.values.clear()

    console.log('🔧 [UniversalDataSourceManager] 资源已清理')
  }
}

// 创建单例实例
export const universalDataSourceManager = new UniversalDataSourceManagerImpl()
export default universalDataSourceManager