/**
 * 数据源管理器
 * 负责处理数据源的请求、轮询和数据更新
 */

import type { DeviceDataSource, DataSourceValue } from '../types/data-source'
import { telemetryDataCurrentKeys, telemetryDataHistoryList, getAttributeDataSet } from '@/service/api/device'

// 轮询方式枚举 (保留以备将来使用)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export enum PollingType {
  TIMER = 'timer',
  WEBSOCKET = 'websocket',
  MQTT = 'mqtt'
}

// 数据请求接口
export interface DataRequest {
  deviceId: string
  metricsType: 'telemetry' | 'attributes' | 'event' | 'command'
  metricsId: string
  dataMode: 'latest' | 'history'
  timeRange?: string
  aggregateFunction?: string
}

// 数据源订阅者
export interface DataSourceSubscriber {
  id: string
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  callback: (value: DataSourceValue) => void
  dataSource: DeviceDataSource
}

// 轮询管理器
class PollingManager {
  private timers = new Map<string, NodeJS.Timeout>()
  private websockets = new Map<string, WebSocket>()
  private mqttConnections = new Map<string, any>() // MQTT客户端
  private dataSourceManager: DataSourceManager

  constructor(dataSourceManager: DataSourceManager) {
    this.dataSourceManager = dataSourceManager
  }

  // 启动定时器轮询
  startTimerPolling(dataSource: DeviceDataSource, callback: (_data: any) => void): void {
    const key = this.getDataSourceKey(dataSource)

    // 清除现有定时器
    this.stopPolling(dataSource)

    const interval = dataSource.refreshInterval || 5000
    const timer = setInterval(async () => {
      try {
        const data = await this.dataSourceManager['fetchDeviceData'](dataSource)
        callback(data)
      } catch (error) {
        console.error('定时器轮询失败:', error)
      }
    }, interval)

    this.timers.set(key, timer)
  }

  // 启动WebSocket连接
  startWebSocketPolling(dataSource: DeviceDataSource, callback: (data: any) => void): void {
    const key = this.getDataSourceKey(dataSource)

    // 清除现有连接
    this.stopPolling(dataSource)

    if (!dataSource.websocketUrl) {
      throw new Error('WebSocket URL未配置')
    }

    const ws = new WebSocket(dataSource.websocketUrl)

    ws.onopen = () => {
      console.log('WebSocket连接已建立')
      // 发送订阅消息
      const subscribeMessage = {
        type: 'subscribe',
        deviceId: dataSource.deviceId,
        metricsType: dataSource.metricsType,
        metricsId: dataSource.metricsId
      }
      ws.send(JSON.stringify(subscribeMessage))
    }

    ws.onmessage = event => {
      try {
        const data = JSON.parse(event.data)
        callback(data)
      } catch (error) {
        console.error('WebSocket数据解析失败:', error)
      }
    }

    ws.onerror = error => {
      console.error('WebSocket连接错误:', error)
    }

    ws.onclose = () => {
      console.log('WebSocket连接已关闭')
    }

    this.websockets.set(key, ws)
  }

  // 启动MQTT连接
  startMqttPolling(dataSource: DeviceDataSource, callback: (data: any) => void): void {
    const key = this.getDataSourceKey(dataSource)

    // 清除现有连接
    this.stopPolling(dataSource)

    if (!dataSource.mqttConfig?.broker || !dataSource.mqttConfig?.topic) {
      throw new Error('MQTT配置不完整')
    }

    // 这里需要集成MQTT客户端库，如mqtt.js
    // 暂时使用模拟实现
    console.log('MQTT连接功能待实现')

    // 模拟MQTT连接
    const mockMqttConnection = {
      subscribe: (topic: string) => {
        console.log(`订阅MQTT主题: ${topic}`)
        // 模拟接收数据
        setInterval(() => {
          const mockData = {
            topic,
            payload: {
              deviceId: dataSource.deviceId,
              metricsType: dataSource.metricsType,
              metricsId: dataSource.metricsId,
              value: Math.random() * 100,
              timestamp: new Date().toISOString()
            }
          }
          callback(mockData.payload)
        }, dataSource.refreshInterval || 5000)
      },
      disconnect: () => {
        console.log('MQTT连接已断开')
      }
    }

    mockMqttConnection.subscribe(dataSource.mqttConfig.topic)
    this.mqttConnections.set(key, mockMqttConnection)
  }

  // 停止轮询
  stopPolling(dataSource: DeviceDataSource): void {
    const key = this.getDataSourceKey(dataSource)

    // 停止定时器
    const timer = this.timers.get(key)
    if (timer) {
      clearInterval(timer)
      this.timers.delete(key)
    }

    // 关闭WebSocket连接
    const ws = this.websockets.get(key)
    if (ws) {
      ws.close()
      this.websockets.delete(key)
    }

    // 断开MQTT连接
    const mqtt = this.mqttConnections.get(key)
    if (mqtt) {
      mqtt.disconnect()
      this.mqttConnections.delete(key)
    }
  }

  // 获取数据源唯一键
  private getDataSourceKey(dataSource: DeviceDataSource): string {
    return `${dataSource.deviceId}_${dataSource.metricsType}_${dataSource.metricsId}`
  }

  // 清理所有轮询
  dispose(): void {
    this.timers.forEach(timer => clearInterval(timer))
    this.timers.clear()

    this.websockets.forEach(ws => ws.close())
    this.websockets.clear()

    this.mqttConnections.forEach(mqtt => mqtt.disconnect())
    this.mqttConnections.clear()
  }
}

// 数据源管理器主类
export class DataSourceManager {
  private subscribers = new Map<string, DataSourceSubscriber>()
  private pollingManager: PollingManager

  constructor() {
    this.pollingManager = new PollingManager(this)
  }

  // 订阅数据源
  subscribe(dataSource: DeviceDataSource, callback: (value: DataSourceValue) => void): string {
    const subscriberId = this.generateSubscriberId()

    const subscriber: DataSourceSubscriber = {
      id: subscriberId,
      callback,
      dataSource
    }

    this.subscribers.set(subscriberId, subscriber)

    // 启动轮询
    this.startPolling(dataSource, data => {
      const dataSourceValue: DataSourceValue = {
        values: this.transformData(data, dataSource),
        timestamp: Date.now(),
        quality: 'good',
        rawData: data
      }
      callback(dataSourceValue)
    })

    return subscriberId
  }

  // 取消订阅
  unsubscribe(subscriberId: string): void {
    const subscriber = this.subscribers.get(subscriberId)
    if (subscriber) {
      this.pollingManager.stopPolling(subscriber.dataSource)
      this.subscribers.delete(subscriberId)
    }
  }

  // 获取数据源当前值
  async getValue(dataSource: DeviceDataSource): Promise<DataSourceValue> {
    try {
      const data = await this.fetchDeviceData(dataSource)
      return {
        values: this.transformData(data, dataSource),
        timestamp: Date.now(),
        quality: 'good',
        rawData: data
      }
    } catch (error) {
      console.error('获取数据源值失败:', error)
      return {
        values: {},
        timestamp: Date.now(),
        quality: 'bad',
        error: error instanceof Error ? error.message : '未知错误'
      }
    }
  }

  // 启动轮询
  private startPolling(dataSource: DeviceDataSource, callback: (data: any) => void): void {
    // 验证数据源配置
    if (!this.isDataSourceValid(dataSource)) {
      console.warn('数据源配置不完整，跳过轮询:', dataSource)
      return
    }

    const pollingType = dataSource.pollingType || 'timer'

    switch (pollingType) {
      case 'timer':
        this.pollingManager.startTimerPolling(dataSource, callback)
        break
      case 'websocket':
        this.pollingManager.startWebSocketPolling(dataSource, callback)
        break
      case 'mqtt':
        this.pollingManager.startMqttPolling(dataSource, callback)
        break
      default:
        console.warn(`不支持的轮询方式: ${pollingType}`)
    }
  }

  // 验证数据源配置
  private isDataSourceValid(dataSource: DeviceDataSource): boolean {
    if (!dataSource) return false

    // 检查必需字段
    if (!dataSource.deviceId || !dataSource.metricsType || !dataSource.metricsId) {
      console.warn('数据源缺少必需字段:', {
        deviceId: dataSource.deviceId,
        metricsType: dataSource.metricsType,
        metricsId: dataSource.metricsId
      })
      return false
    }

    // 检查轮询方式配置
    const pollingType = dataSource.pollingType || 'timer'

    switch (pollingType) {
      case 'timer':
        // 检查轮询间隔
        if (!dataSource.refreshInterval || dataSource.refreshInterval < 1000) {
          console.warn('定时器轮询间隔不能小于1秒')
          return false
        }
        break

      case 'websocket':
        // 检查WebSocket URL
        if (!dataSource.websocketUrl) {
          console.warn('WebSocket轮询需要配置URL')
          return false
        }
        break

      case 'mqtt':
        // 检查MQTT配置
        if (!dataSource.mqttConfig?.broker || !dataSource.mqttConfig?.topic) {
          console.warn('MQTT轮询需要配置broker和topic')
          return false
        }
        break

      default:
        console.warn(`不支持的轮询方式: ${pollingType}`)
        return false
    }

    // 检查历史数据模式限制
    if (dataSource.dataMode === 'history' && pollingType !== 'timer') {
      console.warn('历史数据模式只支持定时器轮询')
      return false
    }

    return true
  }

  // 获取设备数据
  private async fetchDeviceData(dataSource: DeviceDataSource): Promise<any> {
    const request: DataRequest = {
      deviceId: dataSource.deviceId!,
      metricsType: dataSource.metricsType!,
      metricsId: dataSource.metricsId!,
      dataMode: dataSource.dataMode || 'latest',
      timeRange: dataSource.timeRange,
      aggregateFunction: dataSource.aggregateFunction
    }

    return this.realFetchDeviceData(request)
  }

  // 真实获取设备数据
  private async realFetchDeviceData(request: DataRequest): Promise<any> {
    try {
      switch (request.metricsType) {
        case 'telemetry':
          if (request.dataMode === 'latest') {
            // 获取遥测数据当前值
            const response = await telemetryDataCurrentKeys({
              device_id: request.deviceId,
              keys: request.metricsId
            })
            return {
              value: response?.data?.[0]?.value,
              timestamp: new Date().toISOString(),
              quality: 'good',
              unit: response?.data?.[0]?.unit
            }
          } else if (request.dataMode === 'history') {
            // 获取遥测数据历史值
            const params = {
              device_id: request.deviceId,
              key: request.metricsId,
              time_range: request.timeRange,
              aggregate_function: request.aggregateFunction
            }
            const response = await telemetryDataHistoryList(params)
            return {
              values: response?.data || [],
              aggregate: response?.data?.[0]?.value,
              timestamp: new Date().toISOString(),
              quality: 'good'
            }
          }
          break

        case 'attributes': {
          // 获取属性数据
          const response = await getAttributeDataSet({ device_id: request.deviceId })
          const attributeData = response?.data?.find((item: any) => item.key === request.metricsId)
          return {
            value: attributeData?.value,
            timestamp: new Date().toISOString(),
            quality: 'good',
            unit: attributeData?.unit
          }
        }

        case 'event': {
          // 事件数据暂时使用模拟数据
          return {
            eventType: 'alarm',
            severity: 'high',
            message: '温度过高告警',
            timestamp: new Date().toISOString()
          }
        }

        case 'command': {
          // 命令数据暂时使用模拟数据
          return {
            commandId: 'cmd_001',
            status: 'pending',
            timestamp: new Date().toISOString()
          }
        }

        default:
          throw new Error('不支持的数据类型')
      }
    } catch (error) {
      console.error('获取设备数据失败:', error)
      throw error
    }
  }

  // 模拟获取设备数据（保留作为备用）
  private async mockFetchDeviceData(request: DataRequest): Promise<any> {
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200))

    const mockData = {
      telemetry: {
        latest: {
          value: 20 + Math.random() * 30,
          timestamp: new Date().toISOString(),
          quality: 'good'
        },
        history: {
          values: Array.from({ length: 10 }, (_, i) => ({
            timestamp: new Date(Date.now() - i * 60000).toISOString(),
            value: 20 + Math.random() * 30
          })),
          aggregate: 25.5
        }
      },
      attributes: {
        latest: {
          deviceName: '智能传感器001',
          deviceType: 'temperature_sensor',
          firmwareVersion: 'v1.2.3'
        }
      },
      event: {
        latest: {
          eventType: 'alarm',
          severity: 'high',
          message: '温度过高告警',
          timestamp: new Date().toISOString()
        }
      },
      command: {
        latest: {
          commandId: 'cmd_001',
          status: 'pending',
          timestamp: new Date().toISOString()
        }
      }
    }

    const dataType = request.metricsType as keyof typeof mockData
    const dataMode = request.dataMode as 'latest' | 'history'

    return mockData[dataType]?.[dataMode] || null
  }

  // 转换数据格式
  private transformData(data: any, dataSource: DeviceDataSource): Record<string, any> {
    // 根据数据路径映射转换数据
    const result: Record<string, any> = {}

    console.log('🔧 DataSourceManager - 开始转换数据:', {
      originalData: data,
      dataPaths: dataSource.dataPaths
    })

    if (dataSource.dataPaths && dataSource.dataPaths.length > 0) {
      dataSource.dataPaths.forEach(mapping => {
        const value = this.getNestedValue(data, mapping.key)
        result[mapping.target] = value

        console.log('🔧 DataSourceManager - 映射字段:', {
          key: mapping.key,
          target: mapping.target,
          value: value
        })
      })
    } else {
      // 如果没有映射配置，使用默认映射
      result.value = data.value || data
      result.timestamp = data.timestamp

      console.log('🔧 DataSourceManager - 使用默认映射:', result)
    }

    console.log('🔧 DataSourceManager - 转换结果:', result)
    return result
  }

  // 获取嵌套对象的值
  private getNestedValue(obj: any, path: string): any {
    const keys = path.split('.')
    let current = obj

    for (const key of keys) {
      if (current === null || current === undefined) {
        return undefined
      }

      // 处理数组索引
      if (key.includes('[') && key.includes(']')) {
        const arrayKey = key.substring(0, key.indexOf('['))
        const indexMatch = key.match(/\[(\d+)\]/)
        if (indexMatch) {
          const index = parseInt(indexMatch[1])
          current = current[arrayKey]?.[index]
        }
      } else {
        current = current[key]
      }
    }

    return current
  }

  // 生成订阅者ID
  private generateSubscriberId(): string {
    return `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // 清理资源
  dispose(): void {
    this.pollingManager.dispose()
    this.subscribers.clear()
  }
}

// 创建单例实例
export const dataSourceManager = new DataSourceManager()
