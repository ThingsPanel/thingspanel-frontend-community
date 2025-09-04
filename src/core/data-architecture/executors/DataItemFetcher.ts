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
// 导入Visual Editor store以获取组件实例
import { useEditorStore } from '@/components/visual-editor/store/editor'

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

  // 🔥 新增：地址类型支持
  addressType?: 'internal' | 'external'
  selectedInternalAddress?: string
  enableParams?: boolean

  // 路径参数支持
  pathParameter?: PathParameter
  pathParams?: HttpParameter[]

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
   * 从组件实例中获取属性值
   * @param bindingPath 绑定路径，格式：组件实例ID.属性路径
   * @returns 组件属性的实际值
   */
  private getComponentPropertyValue(bindingPath: string): any {
    try {
      if (!bindingPath || typeof bindingPath !== 'string' || !bindingPath.includes('.')) {
        return undefined
      }

      const parts = bindingPath.split('.')
      const componentId = parts[0]
      const propertyPath = parts.slice(1).join('.')

      // 获取编辑器store实例
      const editorStore = useEditorStore()

      // 查找目标组件实例
      const targetComponent = editorStore.nodes?.find(node => node.id === componentId)
      if (!targetComponent) {
        console.warn('[DataItemFetcher] 组件属性绑定失败: 未找到组件', componentId)
        return undefined
      }

      // 从组件properties中获取属性值
      const propertyValue = this.getNestedProperty(targetComponent.properties, propertyPath)

      if (propertyValue !== undefined) {
        console.log('[DataItemFetcher] 组件属性绑定成功:', `${componentId}.${propertyPath} = ${propertyValue}`)
      }

      return propertyValue
    } catch (error) {
      console.error('[DataItemFetcher] 组件属性绑定错误:', error)
      return undefined
    }
  }

  /**
   * 获取嵌套对象属性
   * @param obj 目标对象
   * @param path 属性路径，如 'customize.title'
   * @returns 属性值
   */
  private getNestedProperty(obj: any, path: string): any {
    if (!obj || !path) return undefined

    const keys = path.split('.')
    let current = obj

    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key]
      } else {
        return undefined
      }
    }

    return current
  }

  /**
   * 解析参数值，支持默认值回退机制和组件属性绑定
   * @param param HTTP参数
   * @returns 解析后的参数值
   */
  private resolveParameterValue(param: HttpParameter): any {
    let resolvedValue = param.value

    // 如果是组件属性绑定，需要从组件实例中获取实际值
    if (param.selectedTemplate === 'component-property-binding' && typeof param.value === 'string') {
      const actualValue = this.getComponentPropertyValue(param.value)

      if (actualValue !== undefined && actualValue !== null && actualValue !== '') {
        resolvedValue = actualValue
      } else {
        // 当组件属性值为空时，设置 resolvedValue 为 undefined，触发默认值机制
        resolvedValue = undefined
      }
    }

    // 检查值是否为"空"（需要使用默认值的情况）
    const isEmpty =
      resolvedValue === null ||
      resolvedValue === undefined ||
      resolvedValue === '' ||
      (typeof resolvedValue === 'string' && resolvedValue.trim() === '')

    if (isEmpty) {
      // 如果有默认值，使用默认值
      if (param.defaultValue !== undefined && param.defaultValue !== null) {
        resolvedValue = param.defaultValue
      } else {
        return null // 返回null表示跳过此参数
      }
    }

    // 转换数据类型
    const convertedValue = convertValue(resolvedValue, param.dataType)

    return convertedValue
  }

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
          return {}
      }
    } catch (error) {
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
      // 第一步：处理请求前脚本
      if (config.preRequestScript) {
        try {
          const scriptResult = await defaultScriptEngine.execute(config.preRequestScript, { config })
          if (scriptResult.success && scriptResult.data) {
            Object.assign(config, scriptResult.data)
          }
        } catch (error) {}
      }

      // 构建请求参数
      const requestConfig: any = {
        timeout: config.timeout || 10000
      }

      // 添加headers
      if (config.headers && Object.keys(config.headers).length > 0) {
        requestConfig.headers = config.headers
      }

      // 处理参数
      let finalUrl = config.url
      const queryParams: Record<string, any> = {}

      // 统一处理路径参数
      // 优先使用新格式 pathParams，如果不存在则回退到旧格式 pathParameter
      if (config.pathParams && config.pathParams.length > 0) {
        config.pathParams
          .filter(p => p.enabled && p.key)
          .forEach(p => {
            const resolvedValue = this.resolveParameterValue(p)
            if (resolvedValue !== null) {
              // 对于路径参数，优先替换URL中的占位符
              const placeholder = `{${p.key}}`
              if (finalUrl.includes(placeholder)) {
                finalUrl = finalUrl.replace(placeholder, String(resolvedValue))
              } else {
                console.warn(`[DataItemFetcher] 路径参数占位符未找到: {${p.key}} in ${finalUrl}`)
              }
            }
          })
      } else if (config.pathParameter) {
        const resolvedValue = this.resolveParameterValue(config.pathParameter as HttpParameter)
        if (resolvedValue !== null && resolvedValue && String(resolvedValue).trim() !== '') {
          const pathParam = config.pathParameter as HttpParameter
          const placeholder = pathParam.key ? `{${pathParam.key}}` : '{id}'

          if (finalUrl.includes(placeholder)) {
            finalUrl = finalUrl.replace(placeholder, String(resolvedValue))
          } else {
            console.warn(`[DataItemFetcher] 路径参数占位符未找到: ${placeholder} in ${finalUrl}`)
          }
        }
      }

      // 处理查询参数
      if (config.params && config.params.length > 0) {
        config.params
          .filter(p => p.enabled && p.key)
          .forEach(p => {
            const resolvedValue = this.resolveParameterValue(p)
            if (resolvedValue !== null) {
              queryParams[p.key] = resolvedValue
            }
          })
      }

      // 向后兼容：统一参数系统
      else if (config.parameters && config.parameters.length > 0) {
        config.parameters
          .filter(p => p.enabled && p.key)
          .forEach(p => {
            const resolvedValue = this.resolveParameterValue(p)
            if (resolvedValue !== null) {
              switch (p.paramType) {
                case 'path':
                  // 🔥 修复：路径参数的拼接逻辑，避免直接字符串拼接
                  if (resolvedValue && String(resolvedValue).trim() !== '') {
                    const separator = finalUrl.endsWith('/') ? '' : '/'
                    finalUrl = finalUrl + separator + String(resolvedValue)
                    console.log(`🔗 [统一参数] 拼接路径参数: ${separator}${resolvedValue}`)
                  }
                  break
                case 'query':
                  queryParams[p.key] = resolvedValue
                  break
                case 'header':
                  requestConfig.headers = requestConfig.headers || {}
                  requestConfig.headers[p.key] = String(resolvedValue)
                  break
              }
            }
          })
      }

      if (Object.keys(queryParams).length > 0) {
        requestConfig.params = queryParams
      }

      // 处理请求体
      let requestBody = undefined
      if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(config.method) && config.body) {
        try {
          requestBody = typeof config.body === 'string' ? JSON.parse(config.body) : config.body
        } catch {
          requestBody = config.body
        }
      }

      // 发起HTTP请求
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

      // 第三步：处理响应后脚本
      let finalResponse = response
      if (config.postResponseScript) {
        try {
          const scriptResult = await defaultScriptEngine.execute(config.postResponseScript, { response })
          if (scriptResult.success) {
            finalResponse = scriptResult.data !== undefined ? scriptResult.data : response
          }
        } catch (error) {}
      }

      return finalResponse
    } catch (error) {
      return {}
    }
  }

  /**
   * 获取WebSocket数据 (暂时实现为占位符)
   */
  private async fetchWebSocketData(_config: WebSocketDataItemConfig): Promise<any> {
    return {}
  }

  /**
   * 执行脚本获取数据 (使用 script-engine 安全执行)
   */
  private async fetchScriptData(config: ScriptDataItemConfig): Promise<any> {
    try {
      // 使用 script-engine 安全执行脚本
      const result = await defaultScriptEngine.execute(config.script, config.context || {})

      if (result.success) {
        return result.data || {}
      } else {
        return {}
      }
    } catch (error) {
      return {}
    }
  }
}
