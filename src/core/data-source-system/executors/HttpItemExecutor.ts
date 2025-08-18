/**
 * HTTP数据项执行器
 * 处理HTTP请求，支持内外部路由、重试机制、超时控制等
 * 实现用户要求的路由逻辑：完整URL使用fetch，相对路径使用项目request服务
 */

import { DataItemExecutor } from './DataItemExecutor'
import { request } from '@sa/axios'
import type { HttpExecutorConfig, ExecutorConfig, DataItemType, ExecutorErrorType, EXECUTOR_CONSTANTS } from './types'

/**
 * HTTP请求统计信息
 */
interface HttpRequestStats {
  totalRequests: number
  successfulRequests: number
  failedRequests: number
  averageResponseTime: number
  lastRequestTime?: number
  lastResponseTime?: number
  lastStatusCode?: number
}

/**
 * HTTP响应信息
 */
interface HttpResponse {
  data: any
  status: number
  statusText: string
  headers: Record<string, string>
  url: string
  responseTime: number
  isFromCache?: boolean
}

/**
 * HTTP数据项执行器
 * 负责处理HTTP请求，支持复杂的请求配置和错误处理
 */
export class HttpItemExecutor extends DataItemExecutor {
  readonly type: DataItemType = 'http'

  /** HTTP执行器专用配置 */
  private httpConfig: HttpExecutorConfig

  /** 当前请求的AbortController */
  private currentController?: AbortController

  /** 请求统计信息 */
  private stats: HttpRequestStats = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    averageResponseTime: 0
  }

  /** 响应时间历史记录（最近10次） */
  private responseTimeHistory: number[] = []

  /** 最后一次成功的响应 */
  private lastSuccessfulResponse?: HttpResponse

  constructor(config: HttpExecutorConfig, callbacks?: any) {
    super(config, callbacks)
    this.httpConfig = config
  }

  // ========== 抽象方法实现 ==========

  /**
   * 验证HTTP执行器配置
   */
  protected validateConfig(config: ExecutorConfig): boolean {
    if (config.type !== 'http') {
      console.error(`❌ [HttpItemExecutor] 配置类型错误: ${config.type}, 期望: http`)
      return false
    }

    const httpConfig = config as HttpExecutorConfig

    // 检查必要字段
    if (!httpConfig.url || !httpConfig.url.trim()) {
      console.error(`❌ [HttpItemExecutor] 缺少URL配置`)
      return false
    }

    // 验证HTTP方法
    const validMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS']
    if (!validMethods.includes(httpConfig.method)) {
      console.error(`❌ [HttpItemExecutor] 无效的HTTP方法: ${httpConfig.method}`)
      return false
    }

    // 验证URL格式（简单检查）
    try {
      if (this.isFullUrl(httpConfig.url)) {
        new URL(httpConfig.url)
      }
    } catch (error) {
      console.error(`❌ [HttpItemExecutor] URL格式无效: ${httpConfig.url}`)
      return false
    }

    // 验证超时时间
    if (httpConfig.timeout && httpConfig.timeout <= 0) {
      console.error(`❌ [HttpItemExecutor] 超时时间必须大于0`)
      return false
    }

    // 验证重试配置
    if (httpConfig.retryCount && httpConfig.retryCount < 0) {
      console.error(`❌ [HttpItemExecutor] 重试次数不能为负数`)
      return false
    }

    return true
  }

  /**
   * 执行HTTP请求
   */
  protected async executeInternal(): Promise<any> {
    const startTime = Date.now()
    this.stats.totalRequests++
    this.stats.lastRequestTime = startTime

    console.log(
      `🌐 [HttpItemExecutor] 执行HTTP请求: ${this.getId()} - ${this.httpConfig.method} ${this.httpConfig.url}`
    )

    // 取消之前的请求
    this.cancelCurrentRequest()

    // 创建新的AbortController
    this.currentController = new AbortController()

    const maxRetries = this.httpConfig.retryCount || 0
    let lastError: Error | null = null

    // 重试循环
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await this.performHttpRequest(attempt)

        // 记录成功统计
        this.recordSuccessfulRequest(response)

        console.log(`✅ [HttpItemExecutor] HTTP请求成功: ${this.getId()} (${response.responseTime}ms)`)
        return response.data
      } catch (error) {
        lastError = error as Error

        // 如果是最后一次尝试，直接抛出错误
        if (attempt === maxRetries) {
          this.recordFailedRequest(lastError)
          console.error(`❌ [HttpItemExecutor] HTTP请求最终失败: ${this.getId()}`, lastError)
          throw lastError
        }

        // 等待重试间隔
        const retryInterval = this.httpConfig.retryInterval || EXECUTOR_CONSTANTS.DEFAULT_RETRY_INTERVAL
        console.warn(
          `⚠️ [HttpItemExecutor] HTTP请求失败，${retryInterval}ms后重试 (${attempt + 1}/${maxRetries}): ${this.getId()}`,
          lastError.message
        )

        await this.sleep(retryInterval)
      }
    }

    // 理论上不会到达这里，但为了类型安全
    throw lastError || new Error('HTTP请求失败')
  }

  // ========== HTTP特有方法 ==========

  /**
   * 执行单次HTTP请求
   */
  private async performHttpRequest(attempt: number): Promise<HttpResponse> {
    const startTime = Date.now()
    const timeout = this.httpConfig.timeout || EXECUTOR_CONSTANTS.DEFAULT_TIMEOUT

    try {
      let response: HttpResponse

      if (this.isFullUrl(this.httpConfig.url)) {
        // 外部URL - 使用fetch
        response = await this.executeExternalRequest(timeout)
      } else {
        // 内部路径 - 使用项目request服务
        response = await this.executeInternalRequest(timeout)
      }

      const responseTime = Date.now() - startTime
      response.responseTime = responseTime

      return response
    } catch (error) {
      const responseTime = Date.now() - startTime

      // 增强错误信息
      if (error instanceof Error) {
        error.message = `HTTP请求失败 (尝试 ${attempt + 1}): ${error.message}`
      }

      throw error
    }
  }

  /**
   * 执行外部HTTP请求（使用fetch）
   */
  private async executeExternalRequest(timeout: number): Promise<HttpResponse> {
    console.log(`🔗 [HttpItemExecutor] 使用fetch执行外部请求: ${this.httpConfig.url}`)

    const timeoutId = setTimeout(() => {
      this.currentController?.abort()
    }, timeout)

    try {
      const fetchOptions: RequestInit = {
        method: this.httpConfig.method,
        headers: this.buildHeaders(),
        signal: this.currentController?.signal
      }

      // 添加请求体（如果不是GET/HEAD方法）
      if (!['GET', 'HEAD'].includes(this.httpConfig.method) && this.httpConfig.body) {
        fetchOptions.body = this.prepareRequestBody()
      }

      const response = await fetch(this.httpConfig.url, fetchOptions)
      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      // 解析响应数据
      const data = await this.parseResponseData(response)

      // 构建响应对象
      const httpResponse: HttpResponse = {
        data,
        status: response.status,
        statusText: response.statusText,
        headers: this.extractHeaders(response.headers),
        url: response.url,
        responseTime: 0 // 将在上层设置
      }

      return httpResponse
    } catch (error) {
      clearTimeout(timeoutId)

      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`请求超时 (${timeout}ms)`)
      }

      throw error
    }
  }

  /**
   * 执行内部HTTP请求（使用项目request服务）
   */
  private async executeInternalRequest(timeout: number): Promise<HttpResponse> {
    console.log(`🏠 [HttpItemExecutor] 使用项目request服务执行内部请求: ${this.httpConfig.url}`)

    try {
      const headers = this.buildHeaders()
      const requestConfig = {
        headers,
        timeout: timeout,
        data: this.httpConfig.body
      }

      let response: any
      const method = this.httpConfig.method.toLowerCase()

      switch (method) {
        case 'get':
          response = await request.get(this.httpConfig.url, requestConfig)
          break
        case 'post':
          response = await request.post(this.httpConfig.url, requestConfig.data, {
            headers: requestConfig.headers,
            timeout: requestConfig.timeout
          })
          break
        case 'put':
          response = await request.put(this.httpConfig.url, requestConfig.data, {
            headers: requestConfig.headers,
            timeout: requestConfig.timeout
          })
          break
        case 'delete':
          response = await request.delete(this.httpConfig.url, {
            headers: requestConfig.headers,
            timeout: requestConfig.timeout
          })
          break
        case 'patch':
          response = await request.patch(this.httpConfig.url, requestConfig.data, {
            headers: requestConfig.headers,
            timeout: requestConfig.timeout
          })
          break
        case 'head':
          response = await request.head(this.httpConfig.url, {
            headers: requestConfig.headers,
            timeout: requestConfig.timeout
          })
          break
        case 'options':
          response = await request.options(this.httpConfig.url, {
            headers: requestConfig.headers,
            timeout: requestConfig.timeout
          })
          break
        default:
          throw new Error(`不支持的HTTP方法: ${this.httpConfig.method}`)
      }

      // 构建标准化的响应对象
      const httpResponse: HttpResponse = {
        data: response.data || response,
        status: response.status || 200,
        statusText: response.statusText || 'OK',
        headers: response.headers || {},
        url: this.httpConfig.url,
        responseTime: 0 // 将在上层设置
      }

      return httpResponse
    } catch (error: any) {
      // 处理axios风格的错误
      if (error.response) {
        throw new Error(`HTTP ${error.response.status}: ${error.response.statusText || error.message}`)
      } else if (error.request) {
        throw new Error(`网络错误: 无法连接到服务器`)
      } else {
        throw new Error(`请求配置错误: ${error.message}`)
      }
    }
  }

  /**
   * 判断是否为完整URL
   */
  private isFullUrl(url: string): boolean {
    return /^https?:\/\//.test(url.trim())
  }

  /**
   * 构建请求头
   */
  private buildHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...this.httpConfig.headers
    }

    // 清理空值
    Object.keys(headers).forEach(key => {
      if (!headers[key] || headers[key].trim() === '') {
        delete headers[key]
      }
    })

    return headers
  }

  /**
   * 准备请求体
   */
  private prepareRequestBody(): string {
    if (!this.httpConfig.body) {
      return ''
    }

    if (typeof this.httpConfig.body === 'string') {
      return this.httpConfig.body
    }

    return JSON.stringify(this.httpConfig.body)
  }

  /**
   * 解析响应数据
   */
  private async parseResponseData(response: Response): Promise<any> {
    const contentType = response.headers.get('content-type') || ''

    if (contentType.includes('application/json')) {
      return await response.json()
    } else if (contentType.includes('text/')) {
      return await response.text()
    } else {
      // 尝试解析为JSON，失败则返回文本
      const text = await response.text()
      try {
        return JSON.parse(text)
      } catch {
        return text
      }
    }
  }

  /**
   * 提取响应头
   */
  private extractHeaders(headers: Headers): Record<string, string> {
    const result: Record<string, string> = {}
    headers.forEach((value, key) => {
      result[key] = value
    })
    return result
  }

  /**
   * 记录成功请求统计
   */
  private recordSuccessfulRequest(response: HttpResponse): void {
    this.stats.successfulRequests++
    this.stats.lastResponseTime = Date.now()
    this.stats.lastStatusCode = response.status
    this.lastSuccessfulResponse = response

    // 更新响应时间统计
    this.updateResponseTimeStats(response.responseTime)
  }

  /**
   * 记录失败请求统计
   */
  private recordFailedRequest(error: Error): void {
    this.stats.failedRequests++
  }

  /**
   * 更新响应时间统计
   */
  private updateResponseTimeStats(responseTime: number): void {
    this.responseTimeHistory.unshift(responseTime)

    // 保留最近10次记录
    if (this.responseTimeHistory.length > 10) {
      this.responseTimeHistory = this.responseTimeHistory.slice(0, 10)
    }

    // 计算平均响应时间
    this.stats.averageResponseTime =
      this.responseTimeHistory.reduce((sum, time) => sum + time, 0) / this.responseTimeHistory.length
  }

  /**
   * 取消当前请求
   */
  private cancelCurrentRequest(): void {
    if (this.currentController) {
      this.currentController.abort()
      this.currentController = undefined
    }
  }

  /**
   * 休眠指定时间
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  // ========== 公共接口方法 ==========

  /**
   * 更新HTTP配置
   */
  updateHttpConfig(config: Partial<HttpExecutorConfig>): void {
    const updatedConfig = { ...this.httpConfig, ...config }

    if (!this.validateConfig(updatedConfig as ExecutorConfig)) {
      throw new Error('HTTP配置验证失败')
    }

    this.httpConfig = updatedConfig as HttpExecutorConfig
    this.updateConfig(updatedConfig)
  }

  /**
   * 获取HTTP配置
   */
  getHttpConfig(): Readonly<HttpExecutorConfig> {
    return { ...this.httpConfig }
  }

  /**
   * 获取请求统计信息
   */
  getRequestStats(): Readonly<HttpRequestStats> {
    return { ...this.stats }
  }

  /**
   * 获取最后一次成功的响应
   */
  getLastSuccessfulResponse(): Readonly<HttpResponse> | undefined {
    return this.lastSuccessfulResponse ? { ...this.lastSuccessfulResponse } : undefined
  }

  /**
   * 重置统计信息
   */
  resetStats(): void {
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0
    }
    this.responseTimeHistory = []
    this.lastSuccessfulResponse = undefined
  }

  /**
   * 测试HTTP连接
   */
  async testConnection(): Promise<{
    success: boolean
    responseTime?: number
    status?: number
    error?: string
  }> {
    const startTime = Date.now()

    try {
      await this.executeInternal()
      const responseTime = Date.now() - startTime

      return {
        success: true,
        responseTime,
        status: this.lastSuccessfulResponse?.status
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }

  // ========== 生命周期重写 ==========

  /**
   * HTTP执行器初始化
   */
  protected async performInitialization(): Promise<void> {
    console.log(`🌐 [HttpItemExecutor] 初始化HTTP执行器: ${this.getId()}`)

    // 可以在这里进行连接测试或预检
    // 但为了避免初始化阶段的网络请求，这里暂时跳过
  }

  /**
   * 停止时清理资源
   */
  stop(): void {
    this.cancelCurrentRequest()
    super.stop()
  }

  /**
   * 销毁时清理资源
   */
  dispose(): void {
    this.cancelCurrentRequest()
    super.dispose()
  }
}
