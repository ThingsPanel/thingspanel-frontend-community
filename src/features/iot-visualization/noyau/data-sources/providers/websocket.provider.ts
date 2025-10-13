/**
 * WebSocket 数据源提供者
 * 用于从 WebSocket 实时获取数据
 */

import type { WebSocketDataSourceConfig, IDataSourceInstance, ValidationResult } from '../../types'
import { BaseDataSourceInstance, BaseDataSourceProvider } from '../interface'
import _ from 'lodash-es'

/**
 * WebSocket 数据源实例
 */
class WebSocketDataSourceInstance extends BaseDataSourceInstance {
  private ws: WebSocket | null = null
  private reconnectAttempts = 0
  private reconnectTimer: number | null = null

  constructor(id: string, config: WebSocketDataSourceConfig) {
    super(id, config)
  }

  protected async fetchData(): Promise<any> {
    // WebSocket 是推送模式，不需要主动 fetch
    // 这里建立连接
    await this.connect()
    return this.value
  }

  protected async cleanup(): Promise<void> {
    this.disconnect()
  }

  /**
   * 建立 WebSocket 连接
   */
  private async connect(): Promise<void> {
    const config = this.config as WebSocketDataSourceConfig

    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(config.url, config.protocols)

        this.ws.onopen = () => {
          this.reconnectAttempts = 0

          // 发送订阅消息
          if (config.subscribeMessage) {
            this.send(config.subscribeMessage)
          }

          resolve()
        }

        this.ws.onmessage = (event) => {
          this.handleMessage(event.data)
        }

        this.ws.onerror = (error) => {
          console.error('[WebSocket] 连接错误:', error)
          reject(error)
        }

        this.ws.onclose = () => {
          this.handleClose()
        }
      } catch (error) {
        reject(error)
      }
    })
  }

  /**
   * 断开 WebSocket 连接
   */
  private disconnect(): void {
    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }

    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }

  /**
   * 发送消息
   */
  private send(data: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const message = typeof data === 'string' ? data : JSON.stringify(data)
      this.ws.send(message)
    }
  }

  /**
   * 处理接收到的消息
   */
  private handleMessage(rawData: string): void {
    const config = this.config as WebSocketDataSourceConfig

    try {
      // 解析 JSON
      let data: any
      try {
        data = JSON.parse(rawData)
      } catch {
        data = rawData
      }

      // 应用消息过滤器
      if (config.messageFilter) {
        const filter = new Function('message', `return ${config.messageFilter}`)
        if (!filter(data)) {
          return
        }
      }

      // 提取数据路径
      if (config.dataPath) {
        data = _.get(data, config.dataPath)
      }

      // 应用数据转换
      const prevValue = this.value
      this.value = this.transform(data)
      this.lastUpdated = Date.now()
      this.status = 'success'

      // 通知订阅者
      this.notifyListeners(prevValue)
    } catch (error) {
      console.error('[WebSocket] 消息处理失败:', error)
    }
  }

  /**
   * 处理连接关闭
   */
  private handleClose(): void {
    const config = this.config as WebSocketDataSourceConfig
    const maxAttempts = config.maxReconnectAttempts || 5
    const interval = config.reconnectInterval || 3000

    if (this.reconnectAttempts < maxAttempts) {
      this.reconnectAttempts++
      console.log(`[WebSocket] 尝试重连 (${this.reconnectAttempts}/${maxAttempts})`)

      this.reconnectTimer = window.setTimeout(() => {
        this.connect().catch(error => {
          console.error('[WebSocket] 重连失败:', error)
        })
      }, interval)
    } else {
      this.status = 'error'
      this.error = '达到最大重连次数'
    }
  }

  /**
   * 数据转换（重写父类方法）
   */
  private transform(rawData: any): any {
    if (!this.config.transformScript) {
      return rawData
    }

    try {
      const transformer = new Function('data', this.config.transformScript)
      return transformer(rawData)
    } catch (error) {
      console.warn(`[WebSocket] 数据转换失败:`, error)
      return rawData
    }
  }

  /**
   * 通知订阅者（重写父类方法）
   */
  private notifyListeners(prevValue: any): void {
    // 访问父类的 listeners（通过反射）
    const listeners = (this as any).listeners as Set<(value: any, prevValue: any) => void>
    listeners.forEach(listener => {
      try {
        listener(this.value, prevValue)
      } catch (error) {
        console.error('[WebSocket] 订阅回调执行失败:', error)
      }
    })
  }
}

/**
 * WebSocket 数据源提供者
 */
export class WebSocketDataSourceProvider extends BaseDataSourceProvider<WebSocketDataSourceConfig> {
  readonly type = 'websocket' as const

  create(config: WebSocketDataSourceConfig): IDataSourceInstance {
    const id = `websocket-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
    return new WebSocketDataSourceInstance(id, config)
  }

  validate(config: WebSocketDataSourceConfig): ValidationResult {
    const baseResult = super.validate(config)

    // 验证 WebSocket URL
    if (!config.url) {
      baseResult.errors.push('WebSocket 数据源必须提供 URL')
      baseResult.valid = false
    } else if (!config.url.startsWith('ws://') && !config.url.startsWith('wss://')) {
      baseResult.errors.push('WebSocket URL 必须以 ws:// 或 wss:// 开头')
      baseResult.valid = false
    }

    // 验证重连参数
    if (config.maxReconnectAttempts !== undefined && config.maxReconnectAttempts < 0) {
      baseResult.errors.push('最大重连次数不能为负数')
      baseResult.valid = false
    }

    if (config.reconnectInterval !== undefined && config.reconnectInterval < 0) {
      baseResult.errors.push('重连间隔不能为负数')
      baseResult.valid = false
    }

    return baseResult
  }
}
