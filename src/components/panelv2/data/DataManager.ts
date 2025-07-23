// src/components/panelv2/data/DataManager.ts

import { ref, reactive, computed } from 'vue'

export interface DataSource {
  id: string
  name: string
  type: 'api' | 'websocket' | 'mqtt' | 'static' | 'computed'
  config: Record<string, any>
  schema?: DataSchema
  lastUpdate?: number
  status: 'connected' | 'disconnected' | 'error' | 'loading'
  error?: string
}

export interface DataSchema {
  type: 'object' | 'array' | 'string' | 'number' | 'boolean'
  properties?: Record<string, DataSchema>
  items?: DataSchema
}

export interface DataBinding {
  cardId: string
  configKey: string
  sourceId: string
  path: string
  transform?: (value: any) => any
  defaultValue?: any
}

export class DataManager {
  private sources = reactive<Map<string, DataSource>>(new Map())
  private bindings = reactive<Map<string, DataBinding>>(new Map())
  private data = reactive<Map<string, any>>(new Map())
  private intervals = new Map<string, number>()
  private websockets = new Map<string, WebSocket>()

  // 注册数据源
  registerSource(source: DataSource) {
    this.sources.set(source.id, source)
    this.connectSource(source.id)
  }

  // 移除数据源
  removeSource(sourceId: string) {
    this.disconnectSource(sourceId)
    this.sources.delete(sourceId)
    this.data.delete(sourceId)
  }

  // 连接数据源
  private async connectSource(sourceId: string) {
    const source = this.sources.get(sourceId)
    if (!source) return

    source.status = 'loading'

    try {
      switch (source.type) {
        case 'api':
          await this.connectApiSource(source)
          break
        case 'websocket':
          await this.connectWebSocketSource(source)
          break
        case 'mqtt':
          await this.connectMqttSource(source)
          break
        case 'static':
          this.connectStaticSource(source)
          break
        case 'computed':
          this.connectComputedSource(source)
          break
      }
      source.status = 'connected'
    } catch (error) {
      source.status = 'error'
      source.error = error instanceof Error ? error.message : String(error)
      console.error(`Failed to connect data source ${sourceId}:`, error)
    }
  }

  // API数据源
  private async connectApiSource(source: DataSource) {
    const { url, method = 'GET', headers = {}, interval = 30000 } = source.config

    const fetchData = async () => {
      try {
        const response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
            ...headers
          }
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const data = await response.json()
        this.updateSourceData(source.id, data)
        source.lastUpdate = Date.now()
        source.status = 'connected'
        source.error = undefined
      } catch (error) {
        source.status = 'error'
        source.error = error instanceof Error ? error.message : String(error)
        console.error(`API source ${source.id} error:`, error)
      }
    }

    // 立即获取数据
    await fetchData()

    // 设置定时获取
    if (interval > 0) {
      const intervalId = setInterval(fetchData, interval)
      this.intervals.set(source.id, intervalId)
    }
  }

  // WebSocket数据源
  private connectWebSocketSource(source: DataSource) {
    const { url, protocols } = source.config

    return new Promise<void>((resolve, reject) => {
      const ws = new WebSocket(url, protocols)

      ws.onopen = () => {
        source.status = 'connected'
        source.error = undefined
        this.websockets.set(source.id, ws)
        resolve()
      }

      ws.onmessage = event => {
        try {
          const data = JSON.parse(event.data)
          this.updateSourceData(source.id, data)
          source.lastUpdate = Date.now()
        } catch (error) {
          console.error(`WebSocket source ${source.id} parse error:`, error)
        }
      }

      ws.onerror = error => {
        source.status = 'error'
        source.error = 'WebSocket connection error'
        reject(error)
      }

      ws.onclose = () => {
        source.status = 'disconnected'
        this.websockets.delete(source.id)
      }
    })
  }

  // MQTT数据源
  private async connectMqttSource(source: DataSource) {
    // 这里需要实现MQTT连接逻辑
    // 可以使用 mqtt.js 或其他MQTT库
    console.log('MQTT source connection not implemented yet')
  }

  // 静态数据源
  private connectStaticSource(source: DataSource) {
    const { data = {} } = source.config
    this.updateSourceData(source.id, data)
    source.lastUpdate = Date.now()
  }

  // 计算数据源
  private connectComputedSource(source: DataSource) {
    const { dependencies = [], expression } = source.config

    const compute = () => {
      try {
        const depData = dependencies.reduce((acc: any, depId: string) => {
          acc[depId] = this.data.get(depId)
          return acc
        }, {})

        // 简单的表达式计算（生产环境建议使用更安全的方式）
        const result = new Function('data', `return ${expression}`)(depData)
        this.updateSourceData(source.id, result)
        source.lastUpdate = Date.now()
      } catch (error) {
        source.status = 'error'
        source.error = error instanceof Error ? error.message : String(error)
      }
    }

    // 监听依赖数据变化
    dependencies.forEach((depId: string) => {
      // 这里需要实现依赖监听逻辑
    })

    compute()
  }

  // 断开数据源连接
  private disconnectSource(sourceId: string) {
    const source = this.sources.get(sourceId)
    if (!source) return

    // 清理定时器
    const intervalId = this.intervals.get(sourceId)
    if (intervalId) {
      clearInterval(intervalId)
      this.intervals.delete(sourceId)
    }

    // 关闭WebSocket
    const ws = this.websockets.get(sourceId)
    if (ws) {
      ws.close()
      this.websockets.delete(sourceId)
    }

    source.status = 'disconnected'
  }

  // 更新数据源数据
  private updateSourceData(sourceId: string, data: any) {
    this.data.set(sourceId, data)
    this.notifyBindings(sourceId)
  }

  // 通知绑定更新
  private notifyBindings(sourceId: string) {
    this.bindings.forEach(binding => {
      if (binding.sourceId === sourceId) {
        // 这里可以触发绑定更新事件
      }
    })
  }

  // 创建数据绑定
  createBinding(binding: DataBinding) {
    const bindingId = `${binding.cardId}-${binding.configKey}`
    this.bindings.set(bindingId, binding)
  }

  // 移除数据绑定
  removeBinding(cardId: string, configKey: string) {
    const bindingId = `${cardId}-${configKey}`
    this.bindings.delete(bindingId)
  }

  // 获取绑定数据
  getBoundData(cardId: string, configKey: string): any {
    const bindingId = `${cardId}-${configKey}`
    const binding = this.bindings.get(bindingId)

    if (!binding) return undefined

    const sourceData = this.data.get(binding.sourceId)
    if (!sourceData) return binding.defaultValue

    let value = this.getValueByPath(sourceData, binding.path)

    if (value === undefined) {
      value = binding.defaultValue
    }

    if (binding.transform) {
      try {
        value = binding.transform(value)
      } catch (error) {
        console.error(`Transform error for binding ${bindingId}:`, error)
        value = binding.defaultValue
      }
    }

    return value
  }

  // 根据路径获取值
  private getValueByPath(obj: any, path: string): any {
    if (!path) return obj

    const keys = path.split('.')
    let current = obj

    for (const key of keys) {
      if (current === null || current === undefined) {
        return undefined
      }

      if (Array.isArray(current) && /^\d+$/.test(key)) {
        current = current[parseInt(key)]
      } else {
        current = current[key]
      }
    }

    return current
  }

  // 获取所有数据源
  getAllSources(): DataSource[] {
    return Array.from(this.sources.values())
  }

  // 获取数据源
  getSource(sourceId: string): DataSource | undefined {
    return this.sources.get(sourceId)
  }

  // 获取数据源数据
  getSourceData(sourceId: string): any {
    return this.data.get(sourceId)
  }

  // 获取所有绑定
  getAllBindings(): DataBinding[] {
    return Array.from(this.bindings.values())
  }

  // 测试数据源连接
  async testConnection(sourceId: string): Promise<boolean> {
    const source = this.sources.get(sourceId)
    if (!source) return false

    try {
      await this.connectSource(sourceId)
      return source.status === 'connected'
    } catch {
      return false
    }
  }

  // 刷新数据源
  async refreshSource(sourceId: string) {
    this.disconnectSource(sourceId)
    await this.connectSource(sourceId)
  }

  // 清理资源
  destroy() {
    this.intervals.forEach(intervalId => clearInterval(intervalId))
    this.websockets.forEach(ws => ws.close())
    this.sources.clear()
    this.bindings.clear()
    this.data.clear()
    this.intervals.clear()
    this.websockets.clear()
  }
}
