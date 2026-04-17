/**
 * 第一层：数据项获取器 (DataItemFetcher)
 * 职责：根据配置类型获取原始数据
 * 已集成 script-engine 安全脚本执行系统
 * 支持新的 HttpConfig 类型和正确的 HTTP 方法处理
 */

import { defaultScriptEngine } from '@/core/script-engine'
import type { HttpConfig, HttpParameter, PathParameter } from '@/core/data-architecture/types/http-config'
import { convertValue } from '@/core/data-architecture/types/http-config'
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

  /**
   * 设置当前执行上下文的组件ID
   * @param componentId 组件ID
   */
  setCurrentComponentId(componentId: string): void
}

/**
 * 数据项获取器实现类
 */
export class DataItemFetcher implements IDataItemFetcher {
  // 🔥 新增：请求去重缓存，防止重复HTTP请求
  private requestCache = new Map<string, Promise<any>>()
  // 请求缓存TTL：2秒内的相同请求会被去重
  private readonly REQUEST_CACHE_TTL = 2000

  // 🔥 新增：组件ID上下文，用于参数绑定
  private currentComponentId?: string

  /**
   * 设置当前执行上下文的组件ID
   * @param componentId 组件ID
   */
  setCurrentComponentId(componentId: string): void {
    this.currentComponentId = componentId
  }
  /**
   * 🔥 新增：运行时智能检测参数是否应该是动态参数
   * 防御性编程：在执行时检测并修正错误的isDynamic设置
   */
  private detectRuntimeIsDynamic(param: HttpParameter): boolean {
    // 检测明显的绑定特征
    const hasBindingFeatures =
      // 特征1：valueMode为component
      param.valueMode === 'component' ||
      // 特征2：selectedTemplate为组件属性绑定
      param.selectedTemplate === 'component-property-binding' ||
      // 特征3：value值看起来像绑定路径（包含.且格式正确）
      (typeof param.value === 'string' &&
        param.value.includes('.') &&
        param.value.split('.').length >= 3 &&
        param.value.length > 10 &&
        // 确保不是错误的短数字值
        !/^\d{1,4}$/.test(param.value)) ||
      // 特征4：有variableName且包含组件ID格式
      (param.variableName && param.variableName.includes('_') && param.variableName.length > 5)

    return hasBindingFeatures
  }

  /**
   * 从组件实例中获取属性值
   * @param bindingPath 绑定路径，格式：组件实例ID.属性路径
   * @returns 组件属性的实际值
   */
  private async getComponentPropertyValue(bindingPath: string): Promise<any> {
    try {
      if (!bindingPath || typeof bindingPath !== 'string' || !bindingPath.includes('.')) {
        return undefined
      }

      const parts = bindingPath.split('.')
      let componentId = parts[0]
      const propertyPath = parts.slice(1).join('.')
      // 🔥 关键修复：处理__CURRENT_COMPONENT__占位符
      if (componentId === '__CURRENT_COMPONENT__') {
        // 使用当前上下文中的组件ID替换占位符
        if (this.currentComponentId) {
          componentId = this.currentComponentId
        } else {
          return undefined
        }
      }

      // 优先从ConfigurationIntegrationBridge获取最新配置
      try {
        // 使用直接导入替代动态require，避免循环依赖问题
        const { configurationIntegrationBridge } = await import(
          '@/components/visual-editor/configuration/ConfigurationIntegrationBridge'
        )

        // 智能组件ID映射：如果原始组件ID无法找到配置，尝试使用当前上下文组件ID
        let targetComponentId = componentId
        let latestConfig = configurationIntegrationBridge.getConfiguration(componentId)

        if (!latestConfig && this.currentComponentId && this.currentComponentId !== componentId) {
          targetComponentId = this.currentComponentId
          latestConfig = configurationIntegrationBridge.getConfiguration(this.currentComponentId)
        }

        if (latestConfig) {
          // 支持多层级属性路径解析
          if (propertyPath.startsWith('customize.')) {
            // 处理 customize.deviceId 格式 - 映射到 component 层
            const customizePropertyPath = propertyPath.replace('customize.', '')
            const componentValue = this.getNestedProperty(latestConfig.component, customizePropertyPath)

            if (componentValue !== undefined) {
              return componentValue
            }

            // 回退到base层查找
            const baseValue = this.getNestedProperty(latestConfig.base, customizePropertyPath)
            if (baseValue !== undefined) {
              return baseValue
            }
          } else if (propertyPath.startsWith('base.')) {
            // 🔥 处理 base.deviceId 格式路径
            const actualPropertyPath = propertyPath.replace('base.', '')
            // 直接从 base 层获取属性（去掉base前缀）
            const baseValue = this.getNestedProperty(latestConfig.base, actualPropertyPath)
            if (baseValue !== undefined) {
              return baseValue
            }

            // 如果base层没有，也尝试component层
            const componentValue = this.getNestedProperty(latestConfig.component, actualPropertyPath)
            if (componentValue !== undefined) {
              return componentValue
            }
          } else if (propertyPath.startsWith('component.')) {
            // 🔥 处理 component.title 格式路径
            const actualPropertyPath = propertyPath.replace('component.', '')

            // 直接从 component 层获取属性（去掉component前缀）
            const componentValue = this.getNestedProperty(latestConfig.component, actualPropertyPath)
            if (componentValue !== undefined) {
              return componentValue
            }

            // 如果component层没有，也尝试base层
            const baseValue = this.getNestedProperty(latestConfig.base, actualPropertyPath)
            if (baseValue !== undefined) {
              return baseValue
            }
          } else {
            // 处理其他属性路径
            // 首先尝试从 base 层获取（优先级更高，因为交互通常修改 base 层）
            const baseValue = this.getNestedProperty(latestConfig.base, propertyPath)
            if (baseValue !== undefined) {
              return baseValue
            }

            // 然后从 component 层获取
            const componentValue = this.getNestedProperty(latestConfig.component, propertyPath)
            if (componentValue !== undefined) {
              return componentValue
            }
          }
        }
      } catch (configError) {
        // 配置获取失败，回退到编辑器存储
      }

      // 回退：从编辑器store获取属性值（兼容性处理）
      const editorStore = useEditorStore()

      // 改进的组件查找策略：支持模糊匹配
      let targetComponent = editorStore.nodes?.find(node => node.id === componentId)

      if (!targetComponent) {
        // 尝试模糊匹配：查找包含componentId的组件
        targetComponent = editorStore.nodes?.find(
          node => node.id.includes(componentId) || componentId.includes(node.id)
        )
      }

      if (!targetComponent && this.currentComponentId) {
        // 最终回退：使用当前组件ID
        targetComponent = editorStore.nodes?.find(node => node.id === this.currentComponentId)
      }

      if (!targetComponent) {
        return undefined
      }

      // 从组件properties中获取属性值
      const propertyValue = this.getNestedProperty(targetComponent.properties, propertyPath)
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
   * 🔥 新增：生成对象的简单哈希值，用于调试对象引用变化
   * @param obj 要哈希的对象
   * @returns 哈希字符串
   */
  private getObjectHash(obj: any): string {
    try {
      const str = JSON.stringify(obj, (key, value) => {
        if (typeof value === 'function') return '[Function]'
        if (value instanceof Date) return value.toISOString()
        return value
      })

      let hash = 0
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i)
        hash = (hash << 5) - hash + char
        hash = hash & hash // 转换为32位整数
      }

      return Math.abs(hash).toString(16)
    } catch {
      return 'hash-failed'
    }
  }

  /**
   * 🔥 新增：专门的HTTP参数调试追踪器
   * 用于详细记录HTTP请求中所有参数的生命周期
   */
  private logHttpParametersLifecycle(config: HttpDataItemConfig, stage: string): void {
    const allParams: Array<{ source: string; param: HttpParameter; index: number }> = []

    // 收集所有参数源
    if (config.pathParams) {
      config.pathParams.forEach((param, index) => {
        allParams.push({ source: 'pathParams', param, index })
      })
    }

    if (config.pathParameter) {
      allParams.push({ source: 'pathParameter', param: config.pathParameter as HttpParameter, index: 0 })
    }

    if (config.params) {
      config.params.forEach((param, index) => {
        allParams.push({ source: 'params', param, index })
      })
    }

    if (config.parameters) {
      config.parameters.forEach((param, index) => {
        allParams.push({ source: 'parameters', param, index })
      })
    }

    // 详细记录每个参数
    allParams.forEach(({ source, param, index }) => {
      // 🔥 特别关注疑似损坏的绑定路径
      if (param.value && typeof param.value === 'string') {
        const isSuspiciousPath = !param.value.includes('.') && param.value.length < 10 && param.variableName
        if (isSuspiciousPath) {
          console.error(`🚨 [${source}[${index}]] 发现疑似损坏的绑定路径:`, {
            参数key: param.key,
            疑似损坏路径: param.value,
            variableName: param.variableName,
            阶段: stage,
            时间戳: Date.now()
          })
        }
      }
    })
  }

  /**
   * 解析参数值，支持默认值回退机制和组件属性绑定
   * @param param HTTP参数
   * @returns 解析后的参数值
   */
  private async resolveParameterValue(param: HttpParameter): Promise<any> {
    let resolvedValue = param.value

    // 防御性检测：运行时智能修正isDynamic字段
    const shouldBeDynamic = this.detectRuntimeIsDynamic(param)
    if (shouldBeDynamic && !param.isDynamic) {
      // 临时修正，不修改原参数对象
      param = { ...param, isDynamic: true }
    }

    // 修复：优先使用isDynamic字段判断，支持属性绑定
    if (param.isDynamic || param.selectedTemplate === 'component-property-binding' || param.valueMode === 'component') {
      // 关键修复：使用深拷贝保护原始参数，防止数据被意外修改
      let bindingPath = param.value

      // 🔥 检测绑定路径损坏的情况
      const isBindingPathCorrupted =
        bindingPath &&
        typeof bindingPath === 'string' &&
        !bindingPath.includes('.') &&
        bindingPath.length < 10 && // 绑定路径通常很长
        param.variableName &&
        param.variableName.includes('_')

      if (isBindingPathCorrupted) {
        console.error(`🚨 [DataItemFetcher] 检测到绑定路径损坏！`, {
          参数key: param.key,
          损坏的绑定路径: bindingPath,
          损坏路径JSON: JSON.stringify(bindingPath),
          variableName: param.variableName,
          variableNameJSON: JSON.stringify(param.variableName),
          损坏特征: {
            不包含点号: !bindingPath.includes('.'),
            长度过短: bindingPath.length < 10,
            有变量名: !!param.variableName,
            是否为纯数字: /^\d+$/.test(bindingPath)
          },
          堆栈跟踪: new Error().stack
        })
        // 从variableName重建绑定路径
        if (param.variableName.includes('_')) {
          const lastUnderscoreIndex = param.variableName.lastIndexOf('_')
          if (lastUnderscoreIndex > 0) {
            const componentId = param.variableName.substring(0, lastUnderscoreIndex)
            const propertyName = param.variableName.substring(lastUnderscoreIndex + 1)
            const recoveredPath = `${componentId}.base.${propertyName}` // 🔥 修复：使用base层（因为deviceId在base层）

            bindingPath = recoveredPath

            // 🔥 验证恢复后的路径
          }
        }
      } else {
      }

      // 最终验证：如果修复后的绑定路径仍然不正确，使用默认值
      if (!bindingPath || typeof bindingPath !== 'string' || !bindingPath.includes('.')) {
        return param.defaultValue || null
      }

      if (bindingPath && typeof bindingPath === 'string') {
        const actualValue = await this.getComponentPropertyValue(bindingPath)

        if (actualValue !== undefined && actualValue !== null && actualValue !== '') {
          resolvedValue = actualValue
        } else {
          // 当组件属性值为空时，设置 resolvedValue 为 undefined，触发默认值机制
          resolvedValue = undefined
        }
      }
    } else {
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
      let result
      switch (item.type) {
        case 'json':
          result = await this.fetchJsonData(item.config)
          break
        case 'http':
          result = await this.fetchHttpData(item.config)
          break
        case 'websocket':
          result = await this.fetchWebSocketData(item.config)
          break
        case 'script':
          result = await this.fetchScriptData(item.config)
          break
        default:
          result = {}
      }

      return result
    } catch (error) {
      console.error(`❌ [DataItemFetcher] fetchData执行失败:`, {
        类型: item.type,
        错误: error instanceof Error ? error.message : error,
        堆栈: error instanceof Error ? error.stack : undefined
      })
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
    // 🔥 步骤1：生成请求唯一标识符，用于去重
    const requestKey = await this.generateRequestKey(config)

    // 🔥 步骤2：检查是否有进行中的相同请求
    const existingRequest = this.requestCache.get(requestKey)
    if (existingRequest) {
      return await existingRequest
    }

    // 🔥 步骤3：创建并缓存请求Promise
    const requestPromise = this.executeHttpRequest(config, requestKey)
    this.requestCache.set(requestKey, requestPromise)

    // 🔥 步骤4：设置缓存清理定时器
    setTimeout(() => {
      this.requestCache.delete(requestKey)
    }, this.REQUEST_CACHE_TTL)

    return await requestPromise
  }

  /**
   * 实际执行HTTP请求的方法（从fetchHttpData中提取）
   */
  private async executeHttpRequest(config: HttpDataItemConfig, requestKey: string): Promise<any> {
    try {
      // 🔥 第一步：记录HTTP请求开始前的参数状态
      this.logHttpParametersLifecycle(config, '请求开始前')

      // CRITICAL：验证参数绑定路径完整性
      this.validateParameterBindingPaths(config)

      // 🔥 第二步：验证后再次记录参数状态
      this.logHttpParametersLifecycle(config, '参数验证后')

      // 第一步：处理请求前脚本
      if (config.preRequestScript) {
        try {
          const scriptResult = await defaultScriptEngine.execute(config.preRequestScript, { config })
          if (scriptResult.success && scriptResult.data) {
            Object.assign(config, scriptResult.data)
          }
        } catch (error) {
          console.error(`⚠️ [DataItemFetcher] 请求前脚本执行失败:`, error)
        }
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

      // 🔥 第三步：开始处理参数前记录状态
      this.logHttpParametersLifecycle(config, '开始处理参数前')

      // 统一处理路径参数
      // 优先使用新格式 pathParams，如果不存在则回退到旧格式 pathParameter
      if (config.pathParams && config.pathParams.length > 0) {
        for (const p of config.pathParams.filter(p => p.enabled)) {
          const resolvedValue = await this.resolveParameterValue(p)

          if (resolvedValue !== null) {
            // 修复：路径参数key为空时，自动匹配URL中的第一个占位符
            let placeholder = p.key ? `{${p.key}}` : null

            if (!placeholder || placeholder === '{}') {
              // 自动检测URL中的占位符
              const placeholderMatch = finalUrl.match(/\{([^}]+)\}/)
              if (placeholderMatch) {
                placeholder = placeholderMatch[0] // 完整的 {id} 格式
              }
            }

            if (placeholder && finalUrl.includes(placeholder)) {
              const oldUrl = finalUrl
              finalUrl = finalUrl.replace(placeholder, String(resolvedValue))
            }
          }
        }
      } else if (config.pathParameter) {
        const resolvedValue = await this.resolveParameterValue(config.pathParameter as HttpParameter)

        if (resolvedValue !== null && resolvedValue && String(resolvedValue).trim() !== '') {
          const pathParam = config.pathParameter as HttpParameter

          // 修复：pathParameter的key为空时，自动匹配URL中的第一个占位符
          let placeholder = pathParam.key ? `{${pathParam.key}}` : null

          if (!placeholder || placeholder === '{}') {
            // 自动检测URL中的占位符
            const placeholderMatch = finalUrl.match(/\{([^}]+)\}/)
            if (placeholderMatch) {
              placeholder = placeholderMatch[0] // 完整的 {id} 格式
            }
          }

          if (placeholder && finalUrl.includes(placeholder)) {
            const oldUrl = finalUrl
            finalUrl = finalUrl.replace(placeholder, String(resolvedValue))
          }
        }
      }

      // 处理查询参数
      if (config.params && config.params.length > 0) {
        for (const p of config.params.filter(p => p.enabled && p.key)) {
          const resolvedValue = await this.resolveParameterValue(p)

          if (resolvedValue !== null) {
            queryParams[p.key] = resolvedValue
          }
        }
      }

      // 向后兼容：统一参数系统
      else if (config.parameters && config.parameters.length > 0) {
        for (const p of config.parameters.filter(p => p.enabled && p.key)) {
          const resolvedValue = await this.resolveParameterValue(p)
          if (resolvedValue !== null) {
            switch (p.paramType) {
              case 'path':
                // 修复：路径参数的拼接逻辑，避免直接字符串拼接
                if (resolvedValue && String(resolvedValue).trim() !== '') {
                  const separator = finalUrl.endsWith('/') ? '' : '/'
                  finalUrl = finalUrl + separator + String(resolvedValue)
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
        }
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

      // 🔥 第四步：HTTP请求发送前的最终状态记录
      this.logHttpParametersLifecycle(config, 'HTTP请求发送前')

      // 🔥 发起HTTP请求 - 关键调试

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
        } catch (error) {
          console.error(`⚠️ [DataItemFetcher] 响应后脚本执行失败:`, error)
        }
      }

      return finalResponse
    } catch (error) {
      console.error(`❌ [DataItemFetcher] fetchHttpData 执行失败:`, {
        url: config.url,
        method: config.method,
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined
      })
      return {}
    }
  }

  /**
   * 调试工具：验证参数绑定路径完整性
   * 帮助用户快速发现参数绑定路径损坏问题
   */
  private validateParameterBindingPaths(config: HttpDataItemConfig): void {
    const allParams: HttpParameter[] = []

    // 收集所有参数
    if (config.pathParams) allParams.push(...config.pathParams)
    if (config.pathParameter) allParams.push(config.pathParameter as HttpParameter)
    if (config.params) allParams.push(...config.params)
    if (config.parameters) allParams.push(...config.parameters)

    // 检查每个参数的绑定路径完整性
    allParams.forEach((param, index) => {
      if (param.selectedTemplate === 'component-property-binding' || param.valueMode === 'component') {
        let bindingPath = param.value

        // 关键修复：在验证阶段也应用智能修复逻辑
        if (!bindingPath || !bindingPath.includes('.')) {
          // 尝试从variableName重建绑定路径（与resolveParameterValue中的逻辑保持一致）
          if (param.variableName && param.variableName.includes('_')) {
            const lastUnderscoreIndex = param.variableName.lastIndexOf('_')
            if (lastUnderscoreIndex > 0) {
              const componentId = param.variableName.substring(0, lastUnderscoreIndex)
              const propertyName = param.variableName.substring(lastUnderscoreIndex + 1)
              const reconstructedPath = `${componentId}.base.${propertyName}`

              bindingPath = reconstructedPath

              // 重要：不直接修改参数对象，避免污染原始配置
              // 只在当前执行上下文中使用修复后的路径
            }
          }
        }

        const isValidPath = bindingPath && typeof bindingPath === 'string' && bindingPath.includes('.')

        if (!isValidPath) {
          console.error(`❌ [CRITICAL] 发现损坏的参数绑定路径！`, {
            参数索引: index,
            参数key: param.key,
            绑定路径值: bindingPath,
            完整参数: param
          })
        }
      }
    })
  }

  /**
   * 生成HTTP请求的唯一标识符，用于去重
   * 基于URL、方法、参数等关键信息生成唯一key
   */
  private async generateRequestKey(config: HttpDataItemConfig): Promise<string> {
    // 收集所有影响请求的关键参数
    const keyComponents = [config.method || 'GET', config.url || '']

    // 添加路径参数
    if (config.pathParams && config.pathParams.length > 0) {
      const pathParams = []
      for (const p of config.pathParams.filter(p => p.enabled && p.key)) {
        const resolvedValue = await this.resolveParameterValue(p)
        pathParams.push(`${p.key}=${resolvedValue}`)
      }
      pathParams.sort() // 排序确保一致性
      keyComponents.push(`path:${pathParams.join('&')}`)
    }

    // 添加旧路径参数格式
    if (config.pathParameter) {
      const resolvedValue = await this.resolveParameterValue(config.pathParameter as HttpParameter)
      keyComponents.push(`pathParam:${resolvedValue}`)
    }

    // 添加查询参数
    if (config.params && config.params.length > 0) {
      const queryParams = []
      for (const p of config.params.filter(p => p.enabled && p.key)) {
        const resolvedValue = await this.resolveParameterValue(p)
        queryParams.push(`${p.key}=${resolvedValue}`)
      }
      queryParams.sort() // 排序确保一致性
      keyComponents.push(`query:${queryParams.join('&')}`)
    }

    // 添加统一参数（向后兼容）
    if (config.parameters && config.parameters.length > 0) {
      const unifiedParams = []
      for (const p of config.parameters.filter(p => p.enabled && p.key)) {
        const resolvedValue = await this.resolveParameterValue(p)
        unifiedParams.push(`${p.key}=${resolvedValue}`)
      }
      unifiedParams.sort()
      keyComponents.push(`unified:${unifiedParams.join('&')}`)
    }

    // 添加请求体（对于POST/PUT等方法）
    if (config.body && typeof config.body === 'object') {
      keyComponents.push(`body:${JSON.stringify(config.body)}`)
    }

    // 生成最终的key（使用简单哈希避免过长）
    const fullKey = keyComponents.join('|')
    const finalKey = `http_${this.simpleHash(fullKey)}`

    return finalKey
  }

  /**
   * 简单哈希函数，避免requestKey过长
   */
  private simpleHash(str: string): string {
    let hash = 0
    if (str.length === 0) return hash.toString()

    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // 转换为32位整数
    }

    return Math.abs(hash).toString(36) // 转为36进制字符串
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
