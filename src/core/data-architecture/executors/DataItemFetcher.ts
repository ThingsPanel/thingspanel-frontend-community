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
   * 从组件实例中获取属性值
   * @param bindingPath 绑定路径，格式：组件实例ID.属性路径
   * @returns 组件属性的实际值
   */
  private getComponentPropertyValue(bindingPath: string): any {
    try {
      console.log('🔍 [组件属性获取] 解析绑定路径:', bindingPath)
      
      if (!bindingPath || typeof bindingPath !== 'string' || !bindingPath.includes('.')) {
        console.warn('⚠️ [组件属性获取] 无效的绑定路径格式:', bindingPath)
        return undefined
      }

      const parts = bindingPath.split('.')
      const componentId = parts[0]
      const propertyPath = parts.slice(1).join('.')
      
      console.log('🔍 [组件属性获取] 解析结果:', { componentId, propertyPath })

      // 1. 获取编辑器store实例
      const editorStore = useEditorStore()
      
      console.log('🔍 [组件属性获取] 编辑器状态:', {
        nodesCount: editorStore.nodes?.length || 0,
        nodes: editorStore.nodes?.map(n => ({ id: n.id, type: n.type }))
      })

      // 2. 查找目标组件实例
      const targetComponent = editorStore.nodes?.find(node => node.id === componentId)
      if (!targetComponent) {
        console.warn('⚠️ [组件属性获取] 未找到组件实例:', componentId)
        return undefined
      }

      console.log('✅ [组件属性获取] 找到目标组件:', {
        id: targetComponent.id,
        type: targetComponent.type,
        properties: Object.keys(targetComponent.properties || {})
      })

      // 3. 从组件properties中获取属性值
      const propertyValue = this.getNestedProperty(targetComponent.properties, propertyPath)
      
      console.log('🔍 [组件属性获取] 属性值获取结果:', {
        propertyPath,
        propertyValue,
        properties: targetComponent.properties
      })

      return propertyValue
    } catch (error) {
      console.error('❌ [组件属性获取] 获取组件属性值时出错:', error)
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
        console.log('🔍 [嵌套属性获取] 属性路径不存在:', { currentKeys: Object.keys(current || {}), missingKey: key })
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
    console.log('🔍 [参数解析] 开始解析参数:', {
      key: param.key,
      value: param.value,
      defaultValue: param.defaultValue,
      valueMode: param.valueMode,
      variableName: param.variableName,
      selectedTemplate: param.selectedTemplate
    })

    let resolvedValue = param.value

    // 🔥 新增：如果是组件属性绑定，需要从组件实例中获取实际值
    if (param.selectedTemplate === 'component-property-binding' && typeof param.value === 'string') {
      console.log('🔗 [参数解析] 检测到组件属性绑定，尝试获取实际值:', param.value)
      
      const actualValue = this.getComponentPropertyValue(param.value)
      if (actualValue !== undefined && actualValue !== null && actualValue !== '') {
        resolvedValue = actualValue
        console.log('✅ [参数解析] 成功获取组件属性值:', { bindingPath: param.value, actualValue })
      } else {
        // 🔥 修复：当组件属性值为空时，设置 resolvedValue 为 undefined，触发默认值机制
        resolvedValue = undefined
        console.log('⚠️ [参数解析] 组件属性值为空或未找到，将使用默认值:', { bindingPath: param.value })
      }
    }

    // 检查值是否为"空"（需要使用默认值的情况）
    const isEmpty = resolvedValue === null || 
                   resolvedValue === undefined || 
                   resolvedValue === '' ||
                   (typeof resolvedValue === 'string' && resolvedValue.trim() === '')

    if (isEmpty) {
      console.log('🔄 [参数解析] 检测到空值，尝试使用默认值:', {
        originalValue: param.value,
        hasDefaultValue: param.defaultValue !== undefined && param.defaultValue !== null,
        defaultValue: param.defaultValue
      })

      // 如果有默认值，使用默认值
      if (param.defaultValue !== undefined && param.defaultValue !== null) {
        resolvedValue = param.defaultValue
        console.log('✅ [参数解析] 使用默认值:', resolvedValue)
      } else {
        console.log('⚠️ [参数解析] 无默认值可用，将跳过此参数')
        return null // 返回null表示跳过此参数
      }
    }

    // 转换数据类型
    const convertedValue = convertValue(resolvedValue, param.dataType)
    
    console.log('🔧 [参数解析] 参数值解析完成:', {
      key: param.key,
      originalValue: param.value,
      resolvedValue,
      convertedValue,
      wasEmpty: isEmpty,
      usedDefaultValue: isEmpty && param.defaultValue !== undefined
    })

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
          description: pathParam.description,
          defaultValue: pathParam.defaultValue
        })

        // 使用resolveParameterValue处理路径参数，支持默认值回退
        const resolvedValue = this.resolveParameterValue(pathParam as HttpParameter)
        
        if (resolvedValue !== null) {
          finalUrl = finalUrl + resolvedValue
          console.log('✅ [HTTP请求器] 路径参数拼接成功:', {
            原始URL: config.url,
            最终URL: finalUrl,
            拼接的值: resolvedValue
          })
        } else {
          console.log('⚠️ [HTTP请求器] 路径参数无有效值（包括默认值），跳过拼接')
        }
      } else {
        console.log('ℹ️ [HTTP请求器] 无路径参数配置')
      }

      // 2. 处理查询参数（支持默认值回退）
      if (config.params && config.params.length > 0) {
        config.params
          .filter(p => p.enabled && p.key) // 只检查enabled和key，允许空值进入处理
          .forEach(p => {
            const resolvedValue = this.resolveParameterValue(p)
            if (resolvedValue !== null) { // 只有resolveParameterValue返回null时才跳过
              queryParams[p.key] = resolvedValue
            }
          })
      }

      // 3. 向后兼容：统一参数系统（支持默认值回退）
      else if (config.parameters && config.parameters.length > 0) {
        config.parameters
          .filter(p => p.enabled && p.key) // 只检查enabled和key，允许空值进入处理
          .forEach(p => {
            const resolvedValue = this.resolveParameterValue(p)
            if (resolvedValue !== null) { // 只有resolveParameterValue返回null时才跳过

              switch (p.paramType) {
                case 'path':
                  // 统一参数中的路径参数：拼接到URL后面
                  finalUrl = finalUrl + resolvedValue
                  console.log('🔍 [HTTP请求器] 统一参数路径拼接:', finalUrl)
                  break
                case 'query':
                  // 查询参数：添加到params对象
                  queryParams[p.key] = resolvedValue
                  break
                case 'header':
                  // 请求头参数：添加到headers对象
                  requestConfig.headers = requestConfig.headers || {}
                  requestConfig.headers[p.key] = String(resolvedValue)
                  break
              }
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
