/**
 * HTTP数据执行器
 * 负责执行HTTP请求并返回结果
 */

import type { HttpConfiguration, HttpExecutionResult, ApiType } from '../types'
import type { DataExecutor, ExecutionConfig, ExecutionResult, HttpExecutionConfig } from './DataExecutorFactory'
import type { SimpleParamContext } from '../utils/SimpleParamReplacer'
import { SimpleParamReplacer } from '../utils/SimpleParamReplacer'
import { request } from '@/service/request'
import type { CustomAxiosRequestConfig } from '@sa/axios'
import { ErrorHandler, ErrorType } from './utils/ErrorHandler'
import { ScriptSandbox } from './utils/ScriptSandbox'
import { dataSourceErrorHandler } from '../utils/DataSourceErrorHandler'
import axios from 'axios'

/**
 * HTTP数据执行器实现
 */
export class HttpDataExecutor implements DataExecutor {
  readonly type = 'http' as const

  /**
   * 执行HTTP请求
   * @param config 执行配置
   * @param context 参数上下文（可选）
   * @returns 执行结果
   */
  async execute(config: ExecutionConfig, context?: SimpleParamContext): Promise<ExecutionResult> {
    // 类型检查
    if (config.type !== 'http') {
      throw new Error(`HTTP执行器只能处理http类型配置，当前类型: ${config.type}`)
    }

    const httpConfig = config as HttpExecutionConfig
    const startTime = Date.now()

    try {
      console.log('🌐 [HttpDataExecutor] 开始执行HTTP请求:', httpConfig.config)

      // 1. 简单参数替换
      let processedConfig = httpConfig.config
      if (context) {
        console.log('🔄 [HttpDataExecutor] 开始替换参数')
        processedConfig = this.replaceParams(httpConfig.config, context)
        console.log('✅ [HttpDataExecutor] 参数替换完成:', processedConfig)
      }

      // 2. 验证配置
      const validation = this.validateConfig(processedConfig)
      if (!validation.valid) {
        const errorResult = ErrorHandler.createValidationError(validation.errors, Date.now() - startTime)
        ErrorHandler.logError(errorResult, 'Config Validation')
        return {
          success: false,
          error: errorResult.error,
          executionTime: errorResult.executionTime,
          timestamp: Date.now(),
          type: 'http'
        }
      }

      // 3. 执行HTTP请求
      const result = await this.performHttpRequest(processedConfig)

      const executionTime = Date.now() - startTime

      return {
        success: true,
        data: result.data,
        executionTime,
        timestamp: Date.now(),
        type: 'http'
      }
    } catch (error: any) {
      const executionTime = Date.now() - startTime

      console.error('❌ [HttpDataExecutor] 执行失败:', error)

      return {
        success: false,
        error: error.message || '未知错误',
        executionTime,
        timestamp: Date.now(),
        type: 'http'
      }
    }
  }

  /**
   * 简单参数替换
   * @param config 原始HTTP配置
   * @param context 参数上下文
   * @returns 替换后的HTTP配置
   */
  private replaceParams(config: HttpConfiguration, context: SimpleParamContext): HttpConfiguration {
    console.log('🎯 [HttpDataExecutor] 替换参数:', { config, context })

    // 直接使用SimpleParamReplacer替换整个配置对象
    const replacedConfig = SimpleParamReplacer.replaceObject(config, context)

    console.log('✨ [HttpDataExecutor] 参数替换结果:', replacedConfig)
    return replacedConfig
  }

  /**
   * 检测API类型
   * @param config HTTP配置
   * @returns API类型
   */
  private detectApiType(config: HttpConfiguration): ApiType {
    // 如果配置中已明确指定类型，直接使用
    if (config.apiType) {
      return config.apiType
    }

    // 自动检测：以http://或https://开头的是外部API
    const isExternalUrl = config.url.startsWith('http://') || config.url.startsWith('https://')
    return isExternalUrl ? 'external' : 'internal'
  }

  /**
   * 智能处理响应数据
   * @param responseData 原始响应数据
   * @param apiType API类型
   * @returns 处理后的数据和状态信息
   */
  private processResponseData(responseData: any, apiType: ApiType) {
    if (apiType === 'external') {
      // 外部API：直接使用响应数据
      return {
        data: responseData,
        isSuccess: true,
        status: 200,
        statusText: 'OK',
        message: '外部API请求成功'
      }
    } else {
      // 内部API：检查ThingsPanel标准格式
      if (responseData && typeof responseData === 'object' && responseData.code !== undefined) {
        const isSuccess = responseData.code === 200
        return {
          data: isSuccess ? responseData.data : responseData,
          isSuccess,
          status: responseData.code,
          statusText: responseData.message || (isSuccess ? 'OK' : 'Error'),
          message: responseData.message || (isSuccess ? '内部API请求成功' : '内部API请求失败')
        }
      } else {
        // 不是标准格式，直接使用原始数据
        return {
          data: responseData,
          isSuccess: true,
          status: 200,
          statusText: 'OK',
          message: '请求成功'
        }
      }
    }
  }

  /**
   * 执行HTTP请求的核心逻辑
   * @param config HTTP配置
   * @returns HTTP执行结果
   */
  private async performHttpRequest(config: HttpConfiguration): Promise<HttpExecutionResult> {
    // 检测API类型
    const apiType = this.detectApiType(config)
    console.log(`🔍 [HttpDataExecutor] API类型检测: ${config.url} -> ${apiType}`)

    // 执行请求拦截器脚本（如果存在）
    let processedConfig = { ...config }
    if (config.preRequestScript) {
      try {
        processedConfig = await this.executePreRequestScript(processedConfig, config.preRequestScript)
        console.log('📤 [HttpDataExecutor] 请求拦截器执行成功')
      } catch (error: any) {
        const errorResult = ErrorHandler.createScriptError(error.message)
        ErrorHandler.logError(errorResult, 'Pre-Request Script')
        return errorResult
      }
    }

    // 构建axios配置
    const axiosConfig = this.buildAxiosConfig(processedConfig)

    try {
      console.log(`🚀 [HttpDataExecutor] 发送请求: ${processedConfig.method.toUpperCase()} ${axiosConfig.url}`)

      let responseData: any
      let requestError: any = null

      if (apiType === 'external') {
        // 外部API：使用原生axios绕过内部请求服务的限制
        try {
          console.log('🌍 [HttpDataExecutor] 使用原生axios请求外部API')
          const axiosResponse = await axios(axiosConfig)
          responseData = axiosResponse.data
          console.log('📡 [HttpDataExecutor] 外部API响应:', {
            status: axiosResponse.status,
            statusText: axiosResponse.statusText,
            dataType: typeof responseData,
            dataPreview: JSON.stringify(responseData).substring(0, 200)
          })
        } catch (error: any) {
          requestError = error
        }
      } else {
        // 内部API：使用项目的request服务
        console.log('🏠 [HttpDataExecutor] 使用内部request服务')
        const { data, error } = await request(axiosConfig)
        responseData = data
        requestError = error
      }

      // 如果请求失败
      if (requestError) {
        const errorResult = ErrorHandler.analyzeAxiosError(requestError)
        ErrorHandler.logError(errorResult, 'HTTP Request')
        return errorResult
      }

      // 使用智能数据处理
      const processedResponse = this.processResponseData(responseData, apiType)
      console.log(`📊 [HttpDataExecutor] 数据处理结果:`, {
        apiType,
        isSuccess: processedResponse.isSuccess,
        status: processedResponse.status,
        dataType: typeof processedResponse.data,
        message: processedResponse.message
      })

      let finalResponseData = processedResponse.data

      // 执行响应拦截器脚本（如果存在）
      if (config.responseScript) {
        try {
          const responseForScript = {
            success: processedResponse.isSuccess,
            status: processedResponse.status,
            statusText: processedResponse.statusText,
            headers: this.extractResponseHeaders(responseData, apiType),
            json: processedResponse.data,
            url: axiosConfig.url,
            apiType, // 传递API类型给脚本
            originalResponse: responseData // 提供原始响应数据
          }
          finalResponseData = await this.executeResponseScript(responseForScript, config.responseScript)
          console.log('📥 [HttpDataExecutor] 响应拦截器执行成功')
        } catch (error: any) {
          console.warn('⚠️ [HttpDataExecutor] 响应拦截器执行失败，使用原始数据:', error)
          // 响应拦截器失败不影响整体结果，只是数据不被处理
        }
      }

      // 构建结果 - 使用智能处理后的状态
      const result: HttpExecutionResult = {
        success: processedResponse.isSuccess,
        data: finalResponseData,
        status: processedResponse.status,
        statusText: processedResponse.statusText,
        headers: this.extractResponseHeaders(responseData, apiType),
        url: axiosConfig.url,
        executionTime: 0, // 由调用者计算
        timestamp: Date.now()
      }

      // 如果API返回了错误，添加错误信息
      if (!processedResponse.isSuccess) {
        result.error = processedResponse.message
        result.errorType = ErrorHandler.isAuthError(result) ? 'script' : 'network'
      }

      return result
    } catch (error: any) {
      const errorResult = ErrorHandler.createGenericError(error.message || '请求执行异常', ErrorType.UNKNOWN)
      ErrorHandler.logError(errorResult, 'Request Execution')
      return errorResult
    }
  }

  /**
   * 安全的HTTP方法映射
   */
  private mapHttpMethod(method: string): CustomAxiosRequestConfig['method'] {
    const methodMap = {
      GET: 'get',
      POST: 'post',
      PUT: 'put',
      DELETE: 'delete',
      PATCH: 'patch',
      HEAD: 'head',
      OPTIONS: 'options'
    } as const

    const upperMethod = method.toUpperCase()
    if (upperMethod in methodMap) {
      return methodMap[upperMethod as keyof typeof methodMap]
    }

    throw new Error(`不支持的HTTP方法: ${method}`)
  }

  /**
   * 安全的headers构建
   */
  private buildSafeHeaders(headers: Record<string, string>): Record<string, string> {
    const safeHeaders: Record<string, string> = {}

    // 浏览器不允许设置的不安全请求头
    const unsafeHeaders = new Set([
      'user-agent',
      'host',
      'origin',
      'referer',
      'cookie',
      'set-cookie',
      'connection',
      'proxy-authorization',
      'proxy-authenticate',
      'www-authenticate',
      'authorization' // 某些情况下也可能被限制
    ])

    // 过滤和验证headers
    Object.entries(headers).forEach(([key, value]) => {
      if (typeof key === 'string' && typeof value === 'string' && key.trim() && value.trim()) {
        const normalizedKey = key.toLowerCase().trim()

        // 跳过不安全的请求头
        if (unsafeHeaders.has(normalizedKey)) {
          console.warn(`⚠️ [HttpDataExecutor] 跳过不安全的请求头: ${key}`)
          return
        }

        safeHeaders[key.trim()] = value.trim()
      }
    })

    return safeHeaders
  }

  /**
   * 检查是否已设置Content-Type头
   */
  private hasContentTypeHeader(headers: Record<string, string> | undefined): boolean {
    if (!headers) return false

    const headerKeys = Object.keys(headers).map(key => key.toLowerCase())
    return headerKeys.includes('content-type')
  }

  /**
   * 从响应数据中提取响应头信息
   */
  private extractResponseHeaders(responseData: any, apiType: ApiType): Record<string, string> {
    const headers: Record<string, string> = {}

    if (apiType === 'external') {
      // 外部API：设置默认响应头
      headers['content-type'] = 'application/json'
    } else {
      // 内部API：尝试从响应中提取头信息
      if (responseData && typeof responseData === 'object') {
        // ThingsPanel API通常不在响应体中包含头信息
        headers['content-type'] = 'application/json'
        headers['x-api-type'] = 'internal'

        // 如果有时间戳，添加到头中
        if (responseData.timestamp) {
          headers['x-response-time'] = responseData.timestamp.toString()
        }
      }
    }

    // 添加执行器标识
    headers['x-executor'] = 'HttpDataExecutor'
    headers['x-processed-at'] = new Date().toISOString()

    return headers
  }

  /**
   * 构建axios配置
   * @param config HTTP配置
   * @returns axios配置
   */
  private buildAxiosConfig(config: HttpConfiguration): CustomAxiosRequestConfig {
    const axiosConfig: CustomAxiosRequestConfig = {
      url: config.url,
      method: this.mapHttpMethod(config.method),
      headers: this.buildSafeHeaders(config.headers),
      params: { ...config.params },
      timeout: config.timeout || 10000
    }

    // 处理请求体
    if (['POST', 'PUT', 'PATCH'].includes(config.method) && config.body) {
      if (config.bodyType === 'json') {
        axiosConfig.data = config.body
        // 安全地设置Content-Type
        if (!this.hasContentTypeHeader(axiosConfig.headers)) {
          axiosConfig.headers = axiosConfig.headers || {}
          axiosConfig.headers['Content-Type'] = 'application/json'
        }
      } else if (config.bodyType === 'form') {
        // 处理表单数据
        if (config.formData && Array.isArray(config.formData)) {
          const formData = new FormData()
          config.formData.forEach(item => {
            if (item && typeof item === 'object' && item.key && item.value) {
              formData.append(item.key, item.value)
            }
          })
          axiosConfig.data = formData
        } else {
          axiosConfig.data = config.body
          if (!this.hasContentTypeHeader(axiosConfig.headers)) {
            axiosConfig.headers = axiosConfig.headers || {}
            axiosConfig.headers['Content-Type'] = 'application/x-www-form-urlencoded'
          }
        }
      } else {
        // raw文本
        axiosConfig.data = config.body
      }
    }

    return axiosConfig
  }

  /**
   * 验证URL格式
   */
  private validateUrl(url: string): { valid: boolean; error?: string } {
    if (!url || !url.trim()) {
      return { valid: false, error: '请求URL不能为空' }
    }

    const trimmedUrl = url.trim()

    // 外部URL验证
    if (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://')) {
      try {
        new URL(trimmedUrl)
        return { valid: true }
      } catch {
        return { valid: false, error: '外部URL格式无效' }
      }
    }

    // 内部URL验证（相对路径）
    if (trimmedUrl.startsWith('/')) {
      if (trimmedUrl.length > 1) {
        return { valid: true }
      } else {
        return { valid: false, error: '内部URL路径不能为空' }
      }
    }

    return { valid: false, error: 'URL必须是完整的HTTP(S)地址或以/开头的相对路径' }
  }

  /**
   * 验证数值配置
   */
  private validateNumericConfig(config: HttpConfiguration): string[] {
    const errors: string[] = []

    // 验证超时时间
    if (config.timeout !== undefined) {
      const timeout = typeof config.timeout === 'string' ? parseInt(config.timeout) : config.timeout
      if (isNaN(timeout) || timeout <= 0) {
        errors.push('超时时间必须是大于0的数字')
      } else if (timeout > 300000) {
        errors.push('超时时间不能超过5分钟(300000ms)')
      }
    }

    // 验证重试配置
    if (config.retryCount !== undefined) {
      if (typeof config.retryCount !== 'number' || config.retryCount < 0) {
        errors.push('重试次数必须是非负整数')
      } else if (config.retryCount > 10) {
        errors.push('重试次数不能超过10次')
      }
    }

    if (config.retryInterval !== undefined) {
      if (typeof config.retryInterval !== 'number' || config.retryInterval < 0) {
        errors.push('重试间隔必须是非负数')
      } else if (config.retryInterval > 60000) {
        errors.push('重试间隔不能超过60秒(60000ms)')
      }
    }

    return errors
  }

  /**
   * 验证headers和params
   */
  private validateKeyValuePairs(config: HttpConfiguration): string[] {
    const errors: string[] = []

    // 验证headers
    if (config.headers) {
      Object.entries(config.headers).forEach(([key, value]) => {
        if (typeof key !== 'string' || typeof value !== 'string') {
          errors.push('请求头的键值必须都是字符串')
        } else if (key.trim() === '') {
          errors.push('请求头的键不能为空')
        }
      })
    }

    // 验证params
    if (config.params) {
      Object.entries(config.params).forEach(([key, value]) => {
        if (typeof key !== 'string' || typeof value !== 'string') {
          errors.push('请求参数的键值必须都是字符串')
        } else if (key.trim() === '') {
          errors.push('请求参数的键不能为空')
        }
      })
    }

    // 验证表单数据
    if (config.formData && Array.isArray(config.formData)) {
      config.formData.forEach((item, index) => {
        if (!item || typeof item !== 'object') {
          errors.push(`表单数据项${index + 1}格式错误`)
        } else if (!item.key || !item.value) {
          errors.push(`表单数据项${index + 1}的键值不能为空`)
        }
      })
    }

    return errors
  }

  /**
   * 验证依赖关系
   */
  private validateDependencies(config: HttpConfiguration): string[] {
    const errors: string[] = []

    // 验证请求体相关配置
    if (['POST', 'PUT', 'PATCH'].includes(config.method)) {
      if (config.bodyType === 'form' && config.formData && config.body) {
        errors.push('表单模式下不应同时设置formData和body')
      }
    }

    // 验证重试配置依赖
    if (config.retryCount && config.retryCount > 0 && !config.retryInterval) {
      // 可以设置默认值，这里只是警告
      console.warn('设置了重试次数但未设置重试间隔，将使用默认间隔1000ms')
    }

    return errors
  }

  /**
   * 增强的配置验证
   * @param config HTTP配置
   * @returns 验证结果
   */
  private validateConfig(config: HttpConfiguration): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    // URL验证
    const urlValidation = this.validateUrl(config.url)
    if (!urlValidation.valid) {
      errors.push(urlValidation.error!)
    }

    // HTTP方法验证
    const validMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS']
    if (!validMethods.includes(config.method)) {
      errors.push(`无效的HTTP方法: ${config.method}`)
    }

    // 数值配置验证
    errors.push(...this.validateNumericConfig(config))

    // 键值对验证
    errors.push(...this.validateKeyValuePairs(config))

    // 依赖关系验证
    errors.push(...this.validateDependencies(config))

    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * 执行请求拦截器脚本
   * @param config HTTP配置
   * @param script 拦截器脚本代码
   * @returns 处理后的配置
   */
  private async executePreRequestScript(config: HttpConfiguration, script: string): Promise<HttpConfiguration> {
    // 验证脚本安全性
    const validation = ScriptSandbox.validateScript(script)
    if (!validation.safe) {
      console.warn('⚠️ [HttpDataExecutor] 请求拦截器脚本安全警告:', validation.warnings)
    }

    // 创建可修改的配置副本
    const modifiableConfig = JSON.parse(JSON.stringify(config))

    // 执行脚本
    const result = await ScriptSandbox.executePreRequestScript(modifiableConfig, script, {
      timeout: 5000,
      enableConsole: true,
      customGlobals: {
        // 可以添加自定义的工具函数
      }
    })

    if (!result.success) {
      throw new Error(result.error || '请求拦截器脚本执行失败')
    }

    console.log(`📤 [HttpDataExecutor] 请求拦截器执行完成 (${result.executionTime}ms)`)
    return result.result
  }

  /**
   * 执行响应拦截器脚本
   * @param response 响应对象
   * @param script 拦截器脚本代码
   * @returns 处理后的响应数据
   */
  private async executeResponseScript(response: any, script: string): Promise<any> {
    // 验证脚本安全性
    const validation = ScriptSandbox.validateScript(script)
    if (!validation.safe) {
      console.warn('⚠️ [HttpDataExecutor] 响应拦截器脚本安全警告:', validation.warnings)
    }

    // 执行脚本
    const result = await ScriptSandbox.executeResponseScript(response, script, {
      timeout: 5000,
      enableConsole: true,
      customGlobals: {
        // 可以添加自定义的工具函数
      }
    })

    if (!result.success) {
      throw new Error(result.error || '响应拦截器脚本执行失败')
    }

    console.log(`📥 [HttpDataExecutor] 响应拦截器执行完成 (${result.executionTime}ms)`)
    return result.result
  }

  /**
   * 清理资源
   */
  dispose(): void {
    this.paramManager.dispose()
    console.log('🧹 [HttpDataExecutor] 已清理资源')
  }
}
