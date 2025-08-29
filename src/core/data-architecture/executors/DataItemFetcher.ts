/**
 * 第一层：数据项获取器 (DataItemFetcher)
 * 职责：根据配置类型获取原始数据
 * 已集成 script-engine 安全脚本执行系统
 * 支持新的 HttpConfig 类型和正确的 HTTP 方法处理
 */

import { defaultScriptEngine } from '../../script-engine'
import type { HttpConfig, HttpParameter } from '../types/http-config'
import { convertValue } from '../types/http-config'

// 类型安全的数据项配置
export type DataItem =
  | {
      type: 'json'
      config: JsonDataItemConfig
    }
  | {
      type: 'http'
      config: HttpDataItemConfig
    }
  | {
      type: 'websocket'
      config: WebSocketDataItemConfig
    }
  | {
      type: 'script'
      config: ScriptDataItemConfig
    }

export interface JsonDataItemConfig {
  jsonString: string
}

// 兼容原有接口，同时支持新的 HttpConfig
export interface HttpDataItemConfig {
  url: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  headers?: Record<string, string>
  body?: any
  timeout?: number
  // 扩展支持新的 HttpConfig 格式
  params?: HttpParameter[]
}

// 或者直接使用 HttpConfig 类型
export type HttpDataItemConfigV2 = HttpConfig

export interface WebSocketDataItemConfig {
  url: string
  protocols?: string[]
  reconnectInterval?: number
}

export interface ScriptDataItemConfig {
  script: string
  context?: Record<string, any>
}

/**
 * 数据项获取器接口
 */
export interface IDataItemFetcher {
  /**
   * 根据数据项配置获取原始数据
   * @param item 数据项配置
   * @returns 原始数据，出错时返回 {}
   */
  fetchData(item: DataItem): Promise<any>
}

/**
 * 数据项获取器实现类
 */
export class DataItemFetcher implements IDataItemFetcher {
  /**
   * 根据类型分支处理数据获取
   */
  async fetchData(item: DataItem): Promise<any> {
    try {
      switch (item.type) {
        case 'json':
          return await this.fetchJsonData(item.config)
        case 'http':
          return await this.fetchHttpData(item.config)
        case 'websocket':
          return await this.fetchWebSocketData(item.config)
        case 'script':
          return await this.fetchScriptData(item.config)
        default:
          console.warn('DataItemFetcher: 未支持的数据源类型', (item as any).type)
          return {}
      }
    } catch (error) {
      console.error('DataItemFetcher: 数据获取失败', error)
      return {} // 统一错误处理：返回空对象
    }
  }

  /**
   * 获取JSON数据
   */
  private async fetchJsonData(config: JsonDataItemConfig): Promise<any> {
    try {
      const data = JSON.parse(config.jsonString)
      return data
    } catch (error) {
      console.error('DataItemFetcher: JSON解析失败', error)
      return {}
    }
  }

  /**
   * 获取HTTP数据 - 修复版本，支持正确的HTTP方法处理
   * 修复问题：GET/HEAD方法不能包含body，参数应转为URL query string
   */
  private async fetchHttpData(config: HttpDataItemConfig): Promise<any> {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), config.timeout || 10000)

      // 构建基础请求配置
      const requestConfig: RequestInit = {
        method: config.method,
        headers: {
          'Content-Type': 'application/json',
          ...config.headers
        },
        signal: controller.signal
      }

      // 修复核心逻辑：区分不同HTTP方法的参数处理
      let finalUrl = config.url

      // GET/HEAD方法：不能包含body，参数转为URL查询字符串
      if (config.method === 'GET' || config.method === 'HEAD') {
        // 1. 处理 params 数组（新格式）
        if (config.params && Array.isArray(config.params)) {
          const urlParams = new URLSearchParams()
          config.params
            .filter(param => param.enabled) // 只处理启用的参数
            .forEach(param => {
              const convertedValue = convertValue(param.value, param.dataType)
              urlParams.append(param.key, String(convertedValue))
            })

          if (urlParams.toString()) {
            finalUrl += (finalUrl.includes('?') ? '&' : '?') + urlParams.toString()
          }
        }

        // 2. 处理 body 作为查询参数（兼容旧格式）
        if (config.body && typeof config.body === 'object') {
          const urlParams = new URLSearchParams()
          Object.entries(config.body).forEach(([key, value]) => {
            urlParams.append(key, String(value))
          })

          if (urlParams.toString()) {
            finalUrl += (finalUrl.includes('?') ? '&' : '?') + urlParams.toString()
          }
        }

        // GET/HEAD请求不设置body
        // requestConfig.body 保持 undefined
      }
      // POST/PUT/PATCH/DELETE方法：可以包含body
      else {
        if (config.body) {
          requestConfig.body = typeof config.body === 'string' ? config.body : JSON.stringify(config.body)
        }
      }

      console.log(`🌐 [DataItemFetcher] ${config.method} ${finalUrl}`)

      const response = await fetch(finalUrl, requestConfig)
      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('DataItemFetcher: HTTP请求失败', error)
      return {}
    }
  }

  /**
   * 获取WebSocket数据 (暂时实现为占位符)
   */
  private async fetchWebSocketData(config: WebSocketDataItemConfig): Promise<any> {
    console.warn('DataItemFetcher: WebSocket数据源暂未实现')
    return {}
  }

  /**
   * 执行脚本获取数据 (使用 script-engine 安全执行)
   */
  private async fetchScriptData(config: ScriptDataItemConfig): Promise<any> {
    try {
      console.log('🔧 [DataItemFetcher] 使用 script-engine 执行脚本')

      // 使用 script-engine 安全执行脚本
      const result = await defaultScriptEngine.execute(config.script, config.context || {})

      if (result.success) {
        console.log('✅ [DataItemFetcher] 脚本执行成功:', result.executionTime + 'ms')
        return result.data || {}
      } else {
        console.error('❌ [DataItemFetcher] 脚本执行失败:', result.error?.message)
        return {}
      }
    } catch (error) {
      console.error('DataItemFetcher: 脚本执行异常', error)
      return {}
    }
  }
}
