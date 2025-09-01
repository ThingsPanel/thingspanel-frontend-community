/**
 * 第一层：数据项获取器 (DataItemFetcher)
 * 职责：根据配置类型获取原始数据
 * 已集成 script-engine 安全脚本执行系统
 * 支持新的 HttpConfig 类型和正确的 HTTP 方法处理
 */

import { defaultScriptEngine } from '../../script-engine'
import type { HttpConfig, HttpParameter, PathParameter } from '../types/http-config'
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
  // 简化的路径参数
  pathParameter?: PathParameter
  // 扩展支持新的 HttpConfig 格式
  params?: HttpParameter[]
  // 向后兼容：统一参数系统
  parameters?: HttpParameter[]
  // 🔥 新增：脚本支持
  preRequestScript?: string
  postResponseScript?: string
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
   * 获取HTTP数据 - 使用项目封装的request库，支持脚本处理
   *
   * 重要修复：
   * 1. 使用项目统一的request库，而不是原生fetch
   * 2. 支持项目的认证、拦截器、错误处理机制
   * 3. 区分GET/HEAD和POST/PUT/PATCH/DELETE方法的参数处理
   * 4. GET/HEAD请求：参数作为query参数，不设置body
   * 5. 其他方法：可以包含body数据
   * 6. 支持新的HttpConfig格式和旧格式的兼容
   * 7. 集成convertValue进行正确的类型转换
   * 8. 🔥 新增：支持请求前脚本和响应后脚本处理
   *
   * @param config HTTP配置，支持HttpDataItemConfig格式
   * @returns Promise<any> HTTP响应数据，失败时返回空对象
   */
  private async fetchHttpData(config: HttpDataItemConfig): Promise<any> {
    try {
      // 打印传给HTTP请求器的配置
      console.log('🔍 [HTTP请求器] 接收到的配置:', JSON.stringify(config, null, 2))
      console.log('🔧 [HTTP请求器] 请求前脚本:', !!config.preRequestScript)
      console.log('🔧 [HTTP请求器] 响应后脚本:', !!config.postResponseScript)

      // 第一步：处理请求前脚本
      if (config.preRequestScript) {
        console.log('🔧 [HTTP请求器] 执行请求前脚本')
        try {
          const scriptResult = await defaultScriptEngine.execute(config.preRequestScript, { config })
          if (scriptResult.success && scriptResult.data) {
            // 更新配置
            Object.assign(config, scriptResult.data)
            console.log('✅ [HTTP请求器] 请求前脚本执行成功，更新后配置:', JSON.stringify(config, null, 2))
          }
        } catch (error) {
          console.error('❌ [HTTP请求器] 请求前脚本执行失败:', error)
        }
      }

      // 第二步：发起HTTP请求（使用配置中的完整参数）
      console.log('📡 [HTTP请求器] 准备发起请求:', {
        url: config.url,
        method: config.method,
        headers: config.headers,
        paramsCount: config.params?.length || 0
      })

      // 构建请求参数
      const requestConfig: any = {
        timeout: config.timeout || 10000
      }

      // 添加headers
      if (config.headers && Object.keys(config.headers).length > 0) {
        requestConfig.headers = config.headers
      }

      // 简化的参数处理逻辑
      let finalUrl = config.url
      const queryParams: Record<string, any> = {}

      // 1. 处理简化的路径参数
      console.log('🔧 [HTTP请求器] 检查路径参数:', {
        hasPathParameter: !!config.pathParameter,
        pathParameter: config.pathParameter
      })

      if (config.pathParameter) {
        const pathParam = config.pathParameter
        console.log('🔧 [HTTP请求器] 路径参数详情:', {
          value: pathParam.value,
          valueType: typeof pathParam.value,
          isDynamic: pathParam.isDynamic,
          dataType: pathParam.dataType,
          variableName: pathParam.variableName,
          description: pathParam.description
        })

        if (pathParam.value !== undefined && pathParam.value !== null && pathParam.value !== '') {
          const convertedValue = convertValue(pathParam.value, pathParam.dataType)
          console.log('🔄 [HTTP请求器] 值转换:', {
            原始值: pathParam.value,
            转换后: convertedValue,
            转换类型: typeof convertedValue
          })

          finalUrl = finalUrl + convertedValue
          console.log('✅ [HTTP请求器] 路径参数拼接成功:', {
            原始URL: config.url,
            最终URL: finalUrl,
            拼接的值: convertedValue
          })
        } else {
          console.log('⚠️ [HTTP请求器] 路径参数值为空，跳过拼接:', {
            value: pathParam.value,
            原因:
              pathParam.value === undefined
                ? '未定义'
                : pathParam.value === null
                  ? '为null'
                  : pathParam.value === ''
                    ? '为空字符串'
                    : '未知'
          })
        }
      } else {
        console.log('ℹ️ [HTTP请求器] 无路径参数配置')
      }

      // 2. 处理查询参数
      if (config.params && config.params.length > 0) {
        config.params
          .filter(p => p.enabled && p.key && p.value !== undefined && p.value !== null && p.value !== '')
          .forEach(p => {
            queryParams[p.key] = convertValue(p.value, p.dataType)
          })
      }

      // 3. 向后兼容：统一参数系统
      else if (config.parameters && config.parameters.length > 0) {
        config.parameters
          .filter(p => p.enabled && p.key && p.value !== undefined && p.value !== null && p.value !== '')
          .forEach(p => {
            const convertedValue = convertValue(p.value, p.dataType)

            switch (p.paramType) {
              case 'path':
                // 统一参数中的路径参数：拼接到URL后面
                finalUrl = finalUrl + convertedValue
                console.log('🔍 [HTTP请求器] 统一参数路径拼接:', finalUrl)
                break
              case 'query':
                // 查询参数：添加到params对象
                queryParams[p.key] = convertedValue
                break
              case 'header':
                // 请求头参数：添加到headers对象
                requestConfig.headers = requestConfig.headers || {}
                requestConfig.headers[p.key] = String(convertedValue)
                break
            }
          })
      }

      if (Object.keys(queryParams).length > 0) {
        requestConfig.params = queryParams
        console.log('🔍 [HTTP请求器] 查询参数:', queryParams)
      }

      // 处理请求体（POST/PUT/PATCH等方法）
      let requestBody = undefined
      if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(config.method) && config.body) {
        try {
          requestBody = typeof config.body === 'string' ? JSON.parse(config.body) : config.body
          console.log('📝 [HTTP请求器] 请求体:', requestBody)
        } catch (error) {
          console.warn('⚠️ [HTTP请求器] 请求体解析失败，使用原始字符串:', config.body)
          requestBody = config.body
        }
      }

      // 根据方法发起请求（使用拼接后的finalUrl）
      let response
      switch (config.method.toUpperCase()) {
        case 'GET':
          response = await request.get(finalUrl, requestConfig)
          break
        case 'POST':
          response = await request.post(finalUrl, requestBody, requestConfig)
          break
        case 'PUT':
          response = await request.put(finalUrl, requestBody, requestConfig)
          break
        case 'PATCH':
          response = await request.patch(finalUrl, requestBody, requestConfig)
          break
        case 'DELETE':
          response = await request.delete(finalUrl, requestConfig)
          break
        default:
          throw new Error(`不支持的HTTP方法: ${config.method}`)
      }

      console.log('📨 [HTTP请求器] 原始响应状态: 成功')
      console.log('📨 [HTTP请求器] 原始响应数据:', JSON.stringify(response).substring(0, 200) + '...')

      // 第三步：处理响应后脚本
      let finalResponse = response
      if (config.postResponseScript) {
        console.log('🔧 [HTTP请求器] 执行响应后脚本')
        try {
          const scriptResult = await defaultScriptEngine.execute(config.postResponseScript, { response })
          if (scriptResult.success) {
            finalResponse = scriptResult.data !== undefined ? scriptResult.data : response
            console.log('✅ [HTTP请求器] 响应后脚本执行成功')
            console.log('🔍 [HTTP请求器] 脚本处理后数据:', JSON.stringify(finalResponse).substring(0, 200) + '...')
          }
        } catch (error) {
          console.error('❌ [HTTP请求器] 响应后脚本执行失败:', error)
        }
      }

      return finalResponse
    } catch (error) {
      console.error('DataItemFetcher: HTTP数据获取失败', error)
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
