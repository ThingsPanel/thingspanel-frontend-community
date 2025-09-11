/**
 * 统一数据执行器 (UnifiedDataExecutor)
 * Task 2.1: 合并多个分散的执行器，提供统一的数据获取接口
 *
 * 设计原则：
 * 1. 职责单一：只做数据获取和基础转换
 * 2. 类型统一：支持所有常见数据源类型
 * 3. 轻量高效：移除企业级冗余功能
 * 4. 插件扩展：支持新数据源类型扩展
 * 5. 事件集成：与配置事件总线协同工作
 */

import { request } from '@/service/request'
import type { HttpParam, HttpHeader } from '@/core/data-architecture/types/enhanced-types'

/**
 * 统一数据源配置
 * 支持多种数据源类型的统一配置接口
 */
export interface UnifiedDataConfig {
  /** 数据源唯一标识 */
  id: string
  /** 数据源类型 */
  type: 'static' | 'http' | 'websocket' | 'json' | 'file' | 'data-source-bindings'
  /** 数据源名称 */
  name?: string
  /** 是否启用 */
  enabled?: boolean
  /** 配置选项 */
  config: {
    // === 静态数据配置 ===
    data?: any

    // === HTTP配置 ===
    /** 请求URL (必填) */
    url?: string
    /** HTTP请求方法 (必填) */
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
    /** 请求超时时间 */
    timeout?: number
    /** HTTP请求头配置 */
    headers?: HttpHeader[]
    /** HTTP请求参数配置 */
    params?: HttpParam[]

    // === WebSocket配置 ===
    wsUrl?: string
    protocols?: string[]
    reconnect?: boolean
    heartbeat?: boolean

    // === JSON数据配置 ===
    jsonContent?: string
    jsonPath?: string

    // === 文件配置 ===
    filePath?: string
    fileType?: 'json' | 'csv' | 'xml'
    encoding?: string

    // === 数据转换配置 ===
    transform?: {
      /** JSONPath表达式 */
      path?: string
      /** 数据映射规则 */
      mapping?: Record<string, string>
      /** 数据过滤条件 */
      filter?: any
      /** 自定义转换函数 */
      script?: string
    }

    // === 扩展配置 ===
    [key: string]: any
  }
}

/**
 * 统一执行结果
 */
export interface UnifiedDataResult {
  /** 执行是否成功 */
  success: boolean
  /** 数据内容 */
  data?: any
  /** 错误信息 */
  error?: string
  /** 错误代码 */
  errorCode?: string
  /** 执行时间戳 */
  timestamp: number
  /** 数据源ID */
  sourceId: string
  /** 额外元数据 */
  metadata?: {
    /** 响应时间(ms) */
    responseTime?: number
    /** 数据大小 */
    dataSize?: number
    /** 原始响应(调试用) */
    rawResponse?: any
  }
}

/**
 * 数据源执行器接口
 * 支持插件化扩展不同类型的数据源
 */
export interface DataSourceExecutor {
  /** 执行器类型 */
  type: string
  /** 执行数据获取 */
  execute(config: UnifiedDataConfig): Promise<UnifiedDataResult>
  /** 验证配置 */
  validate?(config: UnifiedDataConfig): boolean
  /** 清理资源 */
  cleanup?(): void
}

/**
 * HTTP数据源执行器
 */
class HttpExecutor implements DataSourceExecutor {
  type = 'http'

  async execute(config: UnifiedDataConfig): Promise<UnifiedDataResult> {
    const startTime = Date.now()

    try {
      const { url, method = 'GET', headers, params, body, timeout = 5000 } = config.config

      if (!url) {
        return this.createErrorResult(config.id, 'HTTP_NO_URL', 'URL未配置', startTime)
      }
      const response = await request({
        url,
        method: method.toLowerCase() as any,
        headers,
        params,
        data: body,
        timeout
      })

      const responseTime = Date.now() - startTime

      // 应用数据转换
      const transformedData = this.applyTransform(response.data, config.config.transform)

      return {
        success: true,
        data: transformedData,
        timestamp: Date.now(),
        sourceId: config.id,
        metadata: {
          responseTime,
          dataSize: JSON.stringify(response.data).length,
          rawResponse: response
        }
      }
    } catch (error: any) {
      const responseTime = Date.now() - startTime
      return this.createErrorResult(config.id, 'HTTP_REQUEST_FAILED', error.message || '请求失败', startTime, {
        responseTime
      })
    }
  }

  private createErrorResult(
    sourceId: string,
    errorCode: string,
    error: string,
    startTime: number,
    metadata?: any
  ): UnifiedDataResult {
    return {
      success: false,
      error,
      errorCode,
      timestamp: Date.now(),
      sourceId,
      metadata: {
        responseTime: Date.now() - startTime,
        ...metadata
      }
    }
  }

  private applyTransform(data: any, transform?: any): any {
    if (!transform) return data

    let result = data

    // JSONPath处理
    if (transform.path) {
      result = this.extractByPath(result, transform.path)
    }

    // 字段映射
    if (transform.mapping) {
      result = this.applyMapping(result, transform.mapping)
    }

    // 数据过滤
    if (transform.filter) {
      result = this.applyFilter(result, transform.filter)
    }

    return result
  }

  private extractByPath(data: any, path: string): any {
    // 简单的JSONPath实现，支持基本的点语法
    const keys = path.split('.')
    let result = data

    for (const key of keys) {
      if (result && typeof result === 'object' && key in result) {
        result = result[key]
      } else {
        return null
      }
    }

    return result
  }

  private applyMapping(data: any, mapping: Record<string, string>): any {
    if (!data || typeof data !== 'object') return data

    const result: any = {}
    for (const [targetKey, sourceKey] of Object.entries(mapping)) {
      result[targetKey] = this.extractByPath(data, sourceKey)
    }

    return result
  }

  private applyFilter(data: any, filter: any): any {
    // 简单过滤实现，支持数组过滤
    if (Array.isArray(data)) {
      return data.filter(item => {
        for (const [key, value] of Object.entries(filter)) {
          if (item[key] !== value) return false
        }
        return true
      })
    }

    return data
  }
}

/**
 * 静态数据源执行器
 */
class StaticExecutor implements DataSourceExecutor {
  type = 'static'

  async execute(config: UnifiedDataConfig): Promise<UnifiedDataResult> {
    const startTime = Date.now()

    try {
      const { data } = config.config
      // 应用数据转换
      const transformedData = this.applyTransform(data, config.config.transform)

      return {
        success: true,
        data: transformedData,
        timestamp: Date.now(),
        sourceId: config.id,
        metadata: {
          responseTime: Date.now() - startTime,
          dataSize: JSON.stringify(data).length
        }
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || '静态数据处理失败',
        errorCode: 'STATIC_DATA_ERROR',
        timestamp: Date.now(),
        sourceId: config.id,
        metadata: {
          responseTime: Date.now() - startTime
        }
      }
    }
  }

  private applyTransform(data: any, transform?: any): any {
    // 复用HTTP执行器的转换逻辑
    if (!transform) return data
    // 实现基础转换功能
    return data
  }
}

/**
 * JSON数据源执行器
 */
class JsonExecutor implements DataSourceExecutor {
  type = 'json'

  async execute(config: UnifiedDataConfig): Promise<UnifiedDataResult> {
    const startTime = Date.now()

    try {
      const { jsonContent } = config.config

      if (!jsonContent) {
        return {
          success: false,
          error: 'JSON内容未配置',
          errorCode: 'JSON_NO_CONTENT',
          timestamp: Date.now(),
          sourceId: config.id,
          metadata: {
            responseTime: Date.now() - startTime
          }
        }
      }

      // 解析JSON
      const parsedData = JSON.parse(jsonContent)

      // 应用数据转换
      const transformedData = this.applyTransform(parsedData, config.config.transform)

      return {
        success: true,
        data: transformedData,
        timestamp: Date.now(),
        sourceId: config.id,
        metadata: {
          responseTime: Date.now() - startTime,
          dataSize: jsonContent.length
        }
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'JSON解析失败',
        errorCode: 'JSON_PARSE_ERROR',
        timestamp: Date.now(),
        sourceId: config.id,
        metadata: {
          responseTime: Date.now() - startTime
        }
      }
    }
  }

  private applyTransform(data: any, transform?: any): any {
    // 复用转换逻辑
    return data
  }
}

/**
 * WebSocket数据源执行器 (基础实现)
 */
class WebSocketExecutor implements DataSourceExecutor {
  type = 'websocket'
  private connections = new Map<string, WebSocket>()

  async execute(config: UnifiedDataConfig): Promise<UnifiedDataResult> {
    const startTime = Date.now()

    try {
      const { wsUrl } = config.config

      if (!wsUrl) {
        return {
          success: false,
          error: 'WebSocket URL未配置',
          errorCode: 'WS_NO_URL',
          timestamp: Date.now(),
          sourceId: config.id,
          metadata: {
            responseTime: Date.now() - startTime
          }
        }
      }

      // 简单实现：WebSocket需要异步处理，这里返回连接状态
      return {
        success: true,
        data: { status: 'connecting', url: wsUrl },
        timestamp: Date.now(),
        sourceId: config.id,
        metadata: {
          responseTime: Date.now() - startTime
        }
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'WebSocket连接失败',
        errorCode: 'WS_CONNECTION_ERROR',
        timestamp: Date.now(),
        sourceId: config.id,
        metadata: {
          responseTime: Date.now() - startTime
        }
      }
    }
  }

  cleanup() {
    // 清理所有WebSocket连接
    this.connections.forEach(ws => ws.close())
    this.connections.clear()
  }
}

/**
 * 统一数据执行器类
 * 核心功能：管理不同类型的数据源执行器，提供统一接口
 */
export class UnifiedDataExecutor {
  private executors = new Map<string, DataSourceExecutor>()

  constructor() {
    // 注册内置执行器
    this.registerExecutor(new HttpExecutor())
    this.registerExecutor(new StaticExecutor())
    this.registerExecutor(new JsonExecutor())
    this.registerExecutor(new WebSocketExecutor())
    this.registerExecutor(new DataSourceBindingsExecutor()) // 🆕 支持data-source-bindings类型
  }

  /**
   * 注册数据源执行器 (支持插件扩展)
   */
  registerExecutor(executor: DataSourceExecutor): void {
    this.executors.set(executor.type, executor)
  }

  /**
   * 执行数据源配置
   * 统一的数据获取入口
   */
  async execute(config: UnifiedDataConfig): Promise<UnifiedDataResult> {
    const { type, enabled = true } = config

    // 检查是否启用
    if (!enabled) {
      return {
        success: false,
        error: '数据源未启用',
        errorCode: 'DATA_SOURCE_DISABLED',
        timestamp: Date.now(),
        sourceId: config.id
      }
    }

    // 获取对应执行器
    const executor = this.executors.get(type)
    if (!executor) {
      return {
        success: false,
        error: `不支持的数据源类型: ${type}`,
        errorCode: 'UNSUPPORTED_DATA_SOURCE',
        timestamp: Date.now(),
        sourceId: config.id
      }
    }

    try {
      const result = await executor.execute(config)

      return result
    } catch (error: any) {
      return {
        success: false,
        error: error.message || '执行器异常',
        errorCode: 'EXECUTOR_EXCEPTION',
        timestamp: Date.now(),
        sourceId: config.id
      }
    }
  }

  /**
   * 批量执行多个数据源
   */
  async executeMultiple(configs: UnifiedDataConfig[]): Promise<UnifiedDataResult[]> {
    const results = await Promise.allSettled(configs.map(config => this.execute(config)))

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value
      } else {
        return {
          success: false,
          error: result.reason?.message || '批量执行失败',
          errorCode: 'BATCH_EXECUTION_ERROR',
          timestamp: Date.now(),
          sourceId: configs[index]?.id || 'unknown'
        }
      }
    })
  }

  /**
   * 获取支持的数据源类型
   */
  getSupportedTypes(): string[] {
    return Array.from(this.executors.keys())
  }

  /**
   * 验证数据源配置
   */
  validateConfig(config: UnifiedDataConfig): boolean {
    const executor = this.executors.get(config.type)
    if (!executor) return false

    // 如果执行器提供验证方法，使用它
    if (executor.validate) {
      return executor.validate(config)
    }

    // 基础验证：检查必需字段
    return !!(config.id && config.type)
  }

  /**
   * 清理资源
   */
  cleanup(): void {
    this.executors.forEach(executor => {
      if (executor.cleanup) {
        executor.cleanup()
      }
    })
  }
}

/**
 * 🆕 数据源绑定执行器 - 处理data-source-bindings类型
 * 用于处理复杂的数据源绑定配置
 */
class DataSourceBindingsExecutor implements DataSourceExecutor {
  type = 'data-source-bindings'

  async execute(config: UnifiedDataConfig): Promise<UnifiedDataResult> {
    const startTime = Date.now()

    try {
      // 从config中提取dataSourceBindings配置
      const bindings = config.config?.dataSourceBindings || config.config

      if (!bindings || typeof bindings !== 'object') {
        return {
          success: false,
          error: 'dataSourceBindings配置缺失或格式错误',
          errorCode: 'BINDINGS_CONFIG_ERROR',
          timestamp: Date.now(),
          sourceId: config.id,
          metadata: {
            responseTime: Date.now() - startTime
          }
        }
      }

      // 🔥 关键：处理各种可能的数据格式
      let resultData: any = null

      // 情况1：如果bindings包含rawData字段（来自FinalDataProcessing）
      const bindingKeys = Object.keys(bindings)
      if (bindingKeys.length > 0) {
        const firstBinding = bindings[bindingKeys[0]]

        if (firstBinding?.rawData) {
          // 尝试解析rawData（可能是JSON字符串）
          try {
            resultData =
              typeof firstBinding.rawData === 'string' ? JSON.parse(firstBinding.rawData) : firstBinding.rawData
          } catch (error) {
            // 如果解析失败，直接使用原始数据
            resultData = firstBinding.rawData
          }
        } else if (firstBinding?.finalResult) {
          // 使用finalResult
          resultData = firstBinding.finalResult
        } else {
          // 直接使用整个binding作为数据
          resultData = firstBinding
        }
      } else {
        // 情况2：直接使用config中的数据
        resultData = bindings
      }

      return {
        success: true,
        data: resultData,
        timestamp: Date.now(),
        sourceId: config.id,
        metadata: {
          responseTime: Date.now() - startTime,
          bindingKeys: bindingKeys,
          dataType: typeof resultData
        }
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || '数据源绑定处理失败',
        errorCode: 'BINDINGS_EXECUTION_ERROR',
        timestamp: Date.now(),
        sourceId: config.id,
        metadata: {
          responseTime: Date.now() - startTime
        }
      }
    }
  }
}

// 创建全局统一执行器实例
export const unifiedDataExecutor = new UnifiedDataExecutor()

// 开发环境下暴露到全局作用域，便于调试
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  ;(window as any).unifiedDataExecutor = unifiedDataExecutor
}
