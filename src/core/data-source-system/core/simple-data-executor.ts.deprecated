/**
 * 简化的数据源执行器
 * 学习自 card2.1 数据绑定系统，复用触发器机制，简化执行逻辑
 */

import type {
  SimpleDataSourceConfig,
  ComponentData,
  ExecutionResult,
  DataSourceDefinition
} from '../types/simple-types'

// 注意：移除了对 card2.1 的依赖，直接实现静态数据处理

/**
 * 简化的数据执行器
 * 职责：接收配置，执行数据源，返回组件需要的数据格式
 */
export class SimpleDataExecutor {
  private activePollingMap = new Map<string, number>() // 活跃轮询任务
  private activeWebSocketMap = new Map<string, WebSocket>() // 活跃WebSocket连接

  /**
   * 执行数据源配置，返回组件数据
   * 这是执行器的核心功能：将配置转换为组件可用的数据
   */
  async execute(config: SimpleDataSourceConfig): Promise<ExecutionResult> {
    const startTime = Date.now()

    try {
      console.log('🚀 [DataExecutor] 开始执行配置:', config.id)

      // 执行所有数据源
      const componentData: ComponentData = {}

      for (const dataSource of config.dataSources) {
        try {
          const data = await this.executeDataSource(dataSource)
          componentData[dataSource.id] = {
            type: dataSource.type,
            data,
            lastUpdated: Date.now(),
            metadata: {
              sourceConfig: dataSource
            }
          }
        } catch (error) {
          console.error(`❌ [DataExecutor] 数据源执行失败: ${dataSource.id}`, error)
          // 失败时提供空数据，让组件能正常渲染
          componentData[dataSource.id] = {
            type: dataSource.type,
            data: null,
            lastUpdated: Date.now(),
            metadata: {
              error: error instanceof Error ? error.message : '执行失败'
            }
          }
        }
      }

      const executionTime = Date.now() - startTime
      console.log('✅ [DataExecutor] 执行完成，耗时:', executionTime, 'ms')

      return {
        success: true,
        data: componentData,
        executionTime,
        timestamp: Date.now()
      }
    } catch (error) {
      const executionTime = Date.now() - startTime
      console.error('❌ [DataExecutor] 执行失败:', error)

      return {
        success: false,
        error: error instanceof Error ? error.message : '执行失败',
        executionTime,
        timestamp: Date.now()
      }
    }
  }

  /**
   * 启动轮询数据绑定
   * 学习自 card2.1 的响应式绑定机制
   */
  startPolling(config: SimpleDataSourceConfig, onDataChange: (data: ComponentData) => void): string {
    const pollingId = `polling_${config.id}_${Date.now()}`

    console.log('🔄 [DataExecutor] 启动轮询:', pollingId)

    // 立即执行一次
    this.execute(config).then(result => {
      if (result.success && result.data) {
        onDataChange(result.data)
      }
    })

    // 根据触发器配置设置轮询
    const timerTrigger = config.triggers.find(t => t.type === 'timer')
    if (timerTrigger) {
      const interval = timerTrigger.config.interval || 30000 // 默认30秒

      const timerId = window.setInterval(async () => {
        try {
          const result = await this.execute(config)
          if (result.success && result.data) {
            onDataChange(result.data)
          }
        } catch (error) {
          console.error('❌ [DataExecutor] 轮询执行失败:', error)
        }
      }, interval)

      this.activePollingMap.set(pollingId, timerId)
    }

    // 处理 WebSocket 触发器
    const wsTrigger = config.triggers.find(t => t.type === 'websocket')
    if (wsTrigger && wsTrigger.config.url) {
      this.setupWebSocketTrigger(pollingId, wsTrigger.config.url, config, onDataChange)
    }

    return pollingId
  }

  /**
   * 停止轮询数据绑定
   */
  stopPolling(pollingId: string): void {
    console.log('⏹️ [DataExecutor] 停止轮询:', pollingId)

    // 清理定时器
    const timerId = this.activePollingMap.get(pollingId)
    if (timerId) {
      window.clearInterval(timerId)
      this.activePollingMap.delete(pollingId)
    }

    // 清理 WebSocket 连接
    const ws = this.activeWebSocketMap.get(pollingId)
    if (ws) {
      ws.close()
      this.activeWebSocketMap.delete(pollingId)
    }
  }

  /**
   * 执行单个数据源
   */
  private async executeDataSource(dataSource: DataSourceDefinition): Promise<any> {
    switch (dataSource.type) {
      case 'static':
        return this.executeStaticDataSource(dataSource)

      case 'api':
        return this.executeApiDataSource(dataSource)

      case 'websocket':
        return this.executeWebSocketDataSource(dataSource)

      case 'script':
        return this.executeScriptDataSource(dataSource)

      default:
        throw new Error(`不支持的数据源类型: ${dataSource.type}`)
    }
  }

  /**
   * 执行静态数据源
   * 直接处理静态数据，简化实现
   */
  private async executeStaticDataSource(dataSource: DataSourceDefinition): Promise<any> {
    let data = dataSource.config.data

    // 如果是字符串，尝试解析为 JSON
    if (typeof data === 'string') {
      try {
        data = JSON.parse(data)
      } catch {
        // 解析失败，保持原字符串
      }
    }

    // 应用字段映射
    if (dataSource.fieldMapping) {
      data = this.applyFieldMapping(data, dataSource.fieldMapping)
    }

    return data
  }

  /**
   * 执行 API 数据源
   */
  private async executeApiDataSource(dataSource: DataSourceDefinition): Promise<any> {
    const config = dataSource.config
    const url = config.url
    const method = config.method || 'GET'
    const headers = config.headers || {}
    const timeout = config.timeout || 10000

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: method !== 'GET' ? JSON.stringify(config.body) : undefined,
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      let data = await response.json()

      // 应用字段映射
      if (dataSource.fieldMapping) {
        data = this.applyFieldMapping(data, dataSource.fieldMapping)
      }

      return data
    } catch (error) {
      clearTimeout(timeoutId)
      throw error
    }
  }

  /**
   * 执行 WebSocket 数据源
   * 注意：WebSocket 是持续连接，这里返回连接状态
   */
  private async executeWebSocketDataSource(dataSource: DataSourceDefinition): Promise<any> {
    // WebSocket 数据源通过触发器处理，这里返回连接状态
    return {
      type: 'websocket',
      url: dataSource.config.url,
      status: 'ready',
      message: 'WebSocket将通过触发器获取数据'
    }
  }

  /**
   * 执行脚本数据源
   */
  private async executeScriptDataSource(dataSource: DataSourceDefinition): Promise<any> {
    const script = dataSource.config.script
    const context = dataSource.config.context || {}

    try {
      // 简单的脚本执行环境
      const scriptFunction = new Function(
        'context',
        `
        const { console, JSON, Date, Math } = window;
        ${script}
        `
      )

      let data = scriptFunction(context)

      // 应用字段映射
      if (dataSource.fieldMapping) {
        data = this.applyFieldMapping(data, dataSource.fieldMapping)
      }

      return data
    } catch (error) {
      throw new Error(`脚本执行失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  /**
   * 应用字段映射
   * 学习自 visual-editor 的映射机制，简化实现
   */
  private applyFieldMapping(sourceData: any, fieldMapping: { [targetField: string]: string }): any {
    if (!sourceData || !fieldMapping) return sourceData

    const mappedData: any = {}

    for (const [targetField, sourcePath] of Object.entries(fieldMapping)) {
      try {
        const value = this.extractValueByPath(sourceData, sourcePath)
        if (value !== undefined) {
          mappedData[targetField] = value
        }
      } catch (error) {
        console.warn(`❌ 字段映射失败: ${targetField} <- ${sourcePath}`, error)
      }
    }

    return mappedData
  }

  /**
   * 根据路径提取值
   * 简化的路径解析器
   */
  private extractValueByPath(obj: any, path: string): any {
    if (!obj || !path) return undefined

    // 处理数组通配符 [*]
    if (path.includes('[*]')) {
      const [arrayPath, itemPath] = path.split('[*].')
      const arrayData = this.getNestedValue(obj, arrayPath)

      if (Array.isArray(arrayData)) {
        return arrayData.map(item => (itemPath ? this.getNestedValue(item, itemPath) : item))
      }
      return undefined
    }

    // 处理普通路径
    return this.getNestedValue(obj, path)
  }

  /**
   * 获取嵌套对象的值
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      if (current && typeof current === 'object') {
        // 处理数组索引
        const match = key.match(/^(.+)\[(\d+)\]$/)
        if (match) {
          const [, arrayKey, index] = match
          const array = current[arrayKey]
          return Array.isArray(array) ? array[parseInt(index)] : undefined
        }
        return current[key]
      }
      return undefined
    }, obj)
  }

  /**
   * 设置 WebSocket 触发器
   */
  private setupWebSocketTrigger(
    pollingId: string,
    url: string,
    config: SimpleDataSourceConfig,
    onDataChange: (data: ComponentData) => void
  ): void {
    try {
      const ws = new WebSocket(url)

      ws.onopen = () => {
        console.log('🔗 [DataExecutor] WebSocket 连接已建立:', url)
      }

      ws.onmessage = async event => {
        try {
          // WebSocket 消息触发重新执行
          const result = await this.execute(config)
          if (result.success && result.data) {
            onDataChange(result.data)
          }
        } catch (error) {
          console.error('❌ [DataExecutor] WebSocket 触发执行失败:', error)
        }
      }

      ws.onerror = error => {
        console.error('❌ [DataExecutor] WebSocket 错误:', error)
      }

      ws.onclose = () => {
        console.log('🔌 [DataExecutor] WebSocket 连接已关闭:', url)
        this.activeWebSocketMap.delete(pollingId)
      }

      this.activeWebSocketMap.set(pollingId, ws)
    } catch (error) {
      console.error('❌ [DataExecutor] WebSocket 连接失败:', error)
    }
  }

  /**
   * 获取执行状态
   */
  getExecutionStatus(): {
    activePolling: number
    activeWebSockets: number
  } {
    return {
      activePolling: this.activePollingMap.size,
      activeWebSockets: this.activeWebSocketMap.size
    }
  }

  /**
   * 清理所有活跃连接
   */
  cleanup(): void {
    console.log('🧹 [DataExecutor] 清理所有活跃连接')

    // 清理所有轮询
    for (const [pollingId] of this.activePollingMap) {
      this.stopPolling(pollingId)
    }

    // 清理所有 WebSocket
    for (const [pollingId] of this.activeWebSocketMap) {
      this.stopPolling(pollingId)
    }
  }
}

/**
 * 导出单例实例，简化使用
 */
export const simpleDataExecutor = new SimpleDataExecutor()
