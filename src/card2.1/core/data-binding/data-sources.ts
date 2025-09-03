/**
 * 数据源实现
 * 支持多种数据源类型：静态数据、API、WebSocket、脚本、数据库等
 */

import type { DataSource } from './types'
import { defaultScriptEngine } from '@/core/script-engine'

// ========== 静态数据源 ==========

export interface StaticDataSourceConfig {
  data: any
  refreshInterval?: number
}

export class StaticDataSource implements DataSource {
  id: string
  type = 'static' as const
  name: string
  description?: string
  private config: StaticDataSourceConfig

  constructor(id: string, name: string, config: StaticDataSourceConfig, description?: string) {
    this.id = id
    this.name = name
    this.config = config
    this.description = description
  }

  async fetchData(): Promise<any> {
    // 模拟异步操作
    await new Promise(resolve => setTimeout(resolve, 10))

    // 如果数据是函数，执行它以获得动态数据
    if (typeof this.config.data === 'function') {
      try {
        const result = await this.config.data()
        return result
      } catch (error) {
        return null
      }
    }
    return this.config.data
  }

  validateConfig(): boolean {
    return this.config.data !== undefined
  }

  getConfig(): StaticDataSourceConfig {
    return { ...this.config }
  }

  updateConfig(config: Partial<StaticDataSourceConfig>): void {
    this.config = { ...this.config, ...config }
  }
}

// ========== API数据源 ==========

export interface ApiDataSourceConfig {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  headers?: Record<string, string>
  params?: Record<string, any>
  body?: any
  timeout?: number
  retryCount?: number
  retryDelay?: number
}

export class ApiDataSource implements DataSource {
  id: string
  type = 'api' as const
  name: string
  description?: string
  private config: ApiDataSourceConfig

  constructor(id: string, name: string, config: ApiDataSourceConfig, description?: string) {
    this.id = id
    this.name = name
    this.config = {
      method: 'GET',
      timeout: 10000,
      retryCount: 3,
      retryDelay: 1000,
      ...config
    }
    this.description = description
  }

  async fetchData(): Promise<any> {
    let lastError: Error | null = null

    for (let attempt = 0; attempt <= this.config.retryCount!; attempt++) {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout)

        const requestInit: RequestInit = {
          method: this.config.method,
          headers: {
            'Content-Type': 'application/json',
            ...this.config.headers
          },
          signal: controller.signal
        }

        // 处理请求参数
        let url = this.config.url
        if (this.config.params && this.config.method === 'GET') {
          const searchParams = new URLSearchParams(this.config.params)
          url += (url.includes('?') ? '&' : '?') + searchParams.toString()
        }

        // 处理请求体
        if (this.config.body && this.config.method !== 'GET') {
          requestInit.body = typeof this.config.body === 'string' ? this.config.body : JSON.stringify(this.config.body)
        }

        const response = await fetch(url, requestInit)
        clearTimeout(timeoutId)

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const contentType = response.headers.get('content-type')
        let data: any

        if (contentType && contentType.includes('application/json')) {
          data = await response.json()
        } else {
          data = await response.text()
        }
        return data
      } catch (error) {
        lastError = error as Error
        if (attempt < this.config.retryCount!) {
          await new Promise(resolve => setTimeout(resolve, this.config.retryDelay))
        }
      }
    }
    throw lastError || new Error('API调用失败')
  }

  validateConfig(): boolean {
    try {
      new URL(this.config.url)
      return true
    } catch {
      return false
    }
  }

  getConfig(): ApiDataSourceConfig {
    return { ...this.config }
  }

  updateConfig(config: Partial<ApiDataSourceConfig>): void {
    this.config = { ...this.config, ...config }
  }
}

// ========== WebSocket数据源 ==========

export interface WebSocketDataSourceConfig {
  url: string
  protocols?: string[]
  reconnectInterval?: number
  maxReconnectAttempts?: number
  heartbeatInterval?: number
  heartbeatMessage?: string
}

export class WebSocketDataSource implements DataSource {
  id: string
  type = 'websocket' as const
  name: string
  description?: string
  private config: WebSocketDataSourceConfig
  private ws: WebSocket | null = null
  private lastData: any = null
  private dataListeners: ((data: any) => void)[] = []
  private reconnectAttempts = 0

  constructor(id: string, name: string, config: WebSocketDataSourceConfig, description?: string) {
    this.id = id
    this.name = name
    this.config = {
      reconnectInterval: 5000,
      maxReconnectAttempts: 5,
      heartbeatInterval: 30000,
      ...config
    }
    this.description = description
  }

  async fetchData(): Promise<any> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      await this.connect()
    }

    return this.lastData
  }

  private async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.config.url, this.config.protocols)

        this.ws.onopen = () => {
          this.reconnectAttempts = 0
          this.startHeartbeat()
          resolve()
        }

        this.ws.onmessage = event => {
          try {
            const data = JSON.parse(event.data)
            this.lastData = data
            this.dataListeners.forEach(listener => listener(data))
          } catch (error) {}
        }

        this.ws.onerror = error => {
          reject(error)
        }

        this.ws.onclose = () => {
          this.stopHeartbeat()
          this.attemptReconnect()
        }
      } catch (error) {
        reject(error)
      }
    })
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.config.maxReconnectAttempts!) {
      this.reconnectAttempts++
      setTimeout(() => {
        this.connect().catch(error => {})
      }, this.config.reconnectInterval)
    } else {
    }
  }

  private heartbeatTimer: NodeJS.Timeout | null = null

  private startHeartbeat(): void {
    if (this.config.heartbeatInterval && this.config.heartbeatMessage) {
      this.heartbeatTimer = setInterval(() => {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(this.config.heartbeatMessage!)
        }
      }, this.config.heartbeatInterval)
    }
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
  }

  onData(listener: (data: any) => void): void {
    this.dataListeners.push(listener)
  }

  disconnect(): void {
    this.stopHeartbeat()
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }

  validateConfig(): boolean {
    try {
      new URL(this.config.url)
      return this.config.url.startsWith('ws://') || this.config.url.startsWith('wss://')
    } catch {
      return false
    }
  }

  getConfig(): WebSocketDataSourceConfig {
    return { ...this.config }
  }

  updateConfig(config: Partial<WebSocketDataSourceConfig>): void {
    this.config = { ...this.config, ...config }
  }
}

// ========== 脚本数据源 ==========

export interface ScriptDataSourceConfig {
  script: string
  context?: Record<string, any>
  timeout?: number
}

export class ScriptDataSource implements DataSource {
  id: string
  type = 'script' as const
  name: string
  description?: string
  private config: ScriptDataSourceConfig

  constructor(id: string, name: string, config: ScriptDataSourceConfig, description?: string) {
    this.id = id
    this.name = name
    this.config = {
      timeout: 5000,
      ...config
    }
    this.description = description
  }

  async fetchData(): Promise<any> {
    try {
      // 使用全局脚本引擎执行脚本
      const result = await defaultScriptEngine.execute(this.config.script, this.config.context)

      if (result.success) {
        return result.data
      } else {
        throw result.error || new Error('脚本执行失败')
      }
    } catch (error) {
      throw error
    }
  }

  validateConfig(): boolean {
    return typeof this.config.script === 'string' && this.config.script.trim() !== ''
  }

  getConfig(): ScriptDataSourceConfig {
    return { ...this.config }
  }

  updateConfig(config: Partial<ScriptDataSourceConfig>): void {
    this.config = { ...this.config, ...config }
  }
}

// ========== 数据源工厂 ==========

export class DataSourceFactory {
  /**
   * 创建静态数据源
   */
  static createStaticDataSource(id: string, name: string, data: any, description?: string): StaticDataSource {
    return new StaticDataSource(id, name, { data }, description)
  }

  /**
   * 创建API数据源
   */
  static createApiDataSource(
    id: string,
    name: string,
    config: ApiDataSourceConfig,
    description?: string
  ): ApiDataSource {
    return new ApiDataSource(id, name, config, description)
  }

  /**
   * 创建WebSocket数据源
   */
  static createWebSocketDataSource(
    id: string,
    name: string,
    config: WebSocketDataSourceConfig,
    description?: string
  ): WebSocketDataSource {
    return new WebSocketDataSource(id, name, config, description)
  }

  /**
   * 创建脚本数据源
   */
  static createScriptDataSource(
    id: string,
    name: string,
    script: string,
    context?: Record<string, any>,
    description?: string
  ): ScriptDataSource {
    return new ScriptDataSource(id, name, { script, context }, description)
  }

  /**
   * 根据配置创建数据源
   */
  static createFromConfig(config: any): DataSource {
    switch (config.type) {
      case 'static':
        return new StaticDataSource(config.id, config.name, config.config, config.description)

      case 'api':
        return new ApiDataSource(config.id, config.name, config.config, config.description)

      case 'websocket':
        return new WebSocketDataSource(config.id, config.name, config.config, config.description)

      case 'script':
        return new ScriptDataSource(config.id, config.name, config.config, config.description)

      default:
        throw new Error(`不支持的数据源类型: ${config.type}`)
    }
  }

  /**
   * 创建示例数据源
   */
  static createSampleDataSources(): DataSource[] {
    const sources: DataSource[] = []

    // 静态数据源示例
    sources.push(
      DataSourceFactory.createStaticDataSource(
        'sample-static-001',
        '温度传感器数据',
        {
          temperature: 25.6,
          humidity: 68.2,
          pressure: 1013.25,
          timestamp: new Date().toISOString(),
          sensor: {
            id: 'temp-001',
            name: '环境温度传感器',
            location: '机房A区'
          },
          readings: [
            { time: '14:00', value: 24.5 },
            { time: '14:30', value: 25.1 },
            { time: '15:00', value: 25.6 }
          ]
        },
        '模拟温度传感器的静态数据'
      )
    )

    // 脚本数据源示例
    sources.push(
      DataSourceFactory.createScriptDataSource(
        'sample-script-001',
        '动态模拟数据',
        `
        return {
          value: mockData.randomNumber(0, 100),
          title: '实时数据',
          unit: '%',
          timestamp: new Date().toISOString(),
          trend: mockData.randomBoolean() ? 'up' : 'down',
          history: Array.from({length: 10}, (_, i) => ({
            time: new Date(Date.now() - (9-i) * 60000).toISOString(),
            value: mockData.randomNumber(0, 100)
          }))
        };
        `,
        {},
        '生成动态模拟数据的脚本数据源'
      )
    )

    return sources
  }
}

export default DataSourceFactory
