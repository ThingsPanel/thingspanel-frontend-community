/**
 * 第一层：数据项获取器 (DataItemFetcher)
 * 职责：根据配置类型获取原始数据
 * 已集成 script-engine 安全脚本执行系统
 * 支持新的 HttpConfig 类型和正确的 HTTP 方法处理
 */

import { defaultScriptEngine } from '../../script-engine'
import type { HttpConfig, HttpParameter } from '../types/http-config'
import { convertValue } from '../types/http-config'
import { request } from '@/service/request'

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
   * 获取HTTP数据 - 使用项目封装的request库
   * 
   * 重要修复：
   * 1. 使用项目统一的request库，而不是原生fetch
   * 2. 支持项目的认证、拦截器、错误处理机制
   * 3. 区分GET/HEAD和POST/PUT/PATCH/DELETE方法的参数处理
   * 4. GET/HEAD请求：参数作为query参数，不设置body
   * 5. 其他方法：可以包含body数据
   * 6. 支持新的HttpConfig格式和旧格式的兼容
   * 7. 集成convertValue进行正确的类型转换
   * 
   * @param config HTTP配置，支持HttpDataItemConfig格式
   * @returns Promise<any> HTTP响应数据，失败时返回空对象
   */
  private async fetchHttpData(config: HttpDataItemConfig): Promise<any> {
    try {
      // 准备查询参数
      let queryParams: Record<string, any> = {}

      // 处理新格式的params数组
      if (config.params && Array.isArray(config.params)) {
        config.params
          .filter(param => param.enabled) // 只处理启用的参数
          .forEach(param => {
            // 使用convertValue进行类型转换，确保数据类型正确
            const convertedValue = convertValue(param.value, param.dataType)
            queryParams[param.key] = convertedValue
          })
      }

      // 处理旧格式的body作为参数（兼容性）
      if (config.method === 'GET' || config.method === 'HEAD') {
        if (config.body && typeof config.body === 'object') {
          queryParams = { ...queryParams, ...config.body }
        }
      }

      // 构建请求配置
      const requestOptions: any = {
        headers: {
          'Content-Type': 'application/json',
          ...config.headers
        }
      }

      // 设置超时
      if (config.timeout) {
        requestOptions.timeout = config.timeout
      }

      console.log(`🌐 [DataItemFetcher] ${config.method} ${config.url}`, {
        params: queryParams,
        body: config.method !== 'GET' && config.method !== 'HEAD' ? config.body : undefined
      })

      let response: any

      // 使用项目的request库根据HTTP方法发送请求
      switch (config.method) {
        case 'GET':
          response = await request.get(config.url, { 
            params: queryParams,
            ...requestOptions
          })
          break
        case 'POST':
          response = await request.post(config.url, config.body, {
            params: queryParams,
            ...requestOptions
          })
          break
        case 'PUT':
          response = await request.put(config.url, config.body, {
            params: queryParams,
            ...requestOptions
          })
          break
        case 'DELETE':
          response = await request.delete(config.url, {
            params: queryParams,
            data: config.body, // DELETE可能需要body
            ...requestOptions
          })
          break
        case 'PATCH':
          response = await request.patch(config.url, config.body, {
            params: queryParams,
            ...requestOptions
          })
          break
        default:
          throw new Error(`不支持的HTTP方法: ${config.method}`)
      }

      // 返回响应数据
      return response || {}
    } catch (error) {
      console.error('DataItemFetcher: HTTP请求失败', error)
      
      // 如果是后端返回的业务错误（如参数缺失、验证失败等），直接返回后端的响应
      if (error?.response?.data && typeof error.response.data === 'object') {
        // 直接返回后端的响应，让用户看到清晰的错误信息
        return error.response.data
      }
      
      // 如果是网络错误或其他异常，返回简化的错误信息
      return {
        error: true,
        message: error.message || '请求失败',
        type: 'network_error'
      }
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
