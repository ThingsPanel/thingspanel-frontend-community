/**
 * 动态参数管理器
 * 负责动态参数的解析、缓存和模板替换
 */

import type {
  DynamicParam,
  ParamContext,
  ParamResolutionResult,
  TemplateResolutionResult,
  BatchParamRequest,
  BatchParamResult,
  DynamicParamManagerConfig,
  ParamCacheItem,
  ApiParamConfig,
  ComputedParamConfig
} from '../types/dynamic-params'
import { DYNAMIC_PARAM_CONSTANTS } from '../types/dynamic-params'
import { request } from '@/service/request'
import type { CustomAxiosRequestConfig } from '@sa/axios'

/**
 * 动态参数管理器类
 */
export class DynamicParamManager {
  private config: Required<DynamicParamManagerConfig>
  private cache: Map<string, ParamCacheItem> = new Map()
  private pendingRequests: Map<string, Promise<any>> = new Map()

  constructor(config: DynamicParamManagerConfig = {}) {
    this.config = {
      defaultCacheTime: config.defaultCacheTime ?? DYNAMIC_PARAM_CONSTANTS.DEFAULT_CACHE_TIME,
      maxConcurrentRequests: config.maxConcurrentRequests ?? DYNAMIC_PARAM_CONSTANTS.MAX_CONCURRENT_REQUESTS,
      apiTimeout: config.apiTimeout ?? 10000,
      computeTimeout: config.computeTimeout ?? DYNAMIC_PARAM_CONSTANTS.MAX_COMPUTE_TIMEOUT,
      enableDebugLog: config.enableDebugLog ?? false
    }

    this.log('DynamicParamManager initialized with config:', this.config)
  }

  /**
   * 批量解析动态参数
   * @param params 参数定义列表
   * @param context 参数上下文
   * @returns 解析结果
   */
  async resolveParams(params: DynamicParam[], context: ParamContext): Promise<ParamResolutionResult> {
    const startTime = Date.now()
    const errors: Array<{ paramName: string; error: string }> = []
    const warnings: Array<{ paramName: string; warning: string }> = []
    const resolvedParams: Record<string, any> = {}

    this.log(
      '开始解析动态参数:',
      params.map(p => p.name)
    )

    // 并行解析所有参数
    const resolvePromises = params.map(async param => {
      try {
        const value = await this.resolveParam(param, context)
        resolvedParams[param.name] = value
        this.log(`参数 ${param.name} 解析成功:`, value)
      } catch (error: any) {
        errors.push({ paramName: param.name, error: error.message })

        // 尝试使用默认值
        if (param.defaultValue !== undefined) {
          resolvedParams[param.name] = param.defaultValue
          warnings.push({
            paramName: param.name,
            warning: `使用默认值: ${JSON.stringify(param.defaultValue)}`
          })
          this.log(`参数 ${param.name} 使用默认值:`, param.defaultValue)
        } else if (param.required) {
          this.log(`必需参数 ${param.name} 解析失败:`, error.message)
        }
      }
    })

    await Promise.all(resolvePromises)

    const result: ParamResolutionResult = {
      success: errors.length === 0 || !params.some(p => p.required && !resolvedParams.hasOwnProperty(p.name)),
      resolvedParams,
      errors,
      warnings,
      executionTime: Date.now() - startTime
    }

    this.log('参数解析完成:', result)
    return result
  }

  /**
   * 解析单个动态参数
   * @param param 参数定义
   * @param context 参数上下文
   * @returns 参数值
   */
  private async resolveParam(param: DynamicParam, context: ParamContext): Promise<any> {
    const cacheKey = this.generateCacheKey(param, context)

    // 检查缓存
    if (this.isCacheValid(cacheKey)) {
      const cached = this.cache.get(cacheKey)!
      this.log(`参数 ${param.name} 使用缓存值:`, cached.value)
      return cached.value
    }

    let value: any

    switch (param.source) {
      case 'context':
        value = this.getValueFromContext(param.name, context)
        break

      case 'static':
        value = param.staticValue
        break

      case 'api':
        value = await this.resolveApiParam(param, context)
        break

      case 'computed':
        value = await this.resolveComputedParam(param, context)
        break

      default:
        throw new Error(`不支持的参数源类型: ${param.source}`)
    }

    // 验证参数值
    if (param.validation) {
      this.validateParamValue(param.name, value, param.validation)
    }

    // 缓存结果（除了computed类型可能不需要缓存）
    if (param.source !== 'computed' || param.computedConfig?.async) {
      this.cacheParam(cacheKey, value, param)
    }

    return value
  }

  /**
   * 从上下文中获取参数值
   * @param paramName 参数名（支持嵌套路径）
   * @param context 参数上下文
   * @returns 参数值
   */
  private getValueFromContext(paramName: string, context: ParamContext): any {
    return this.getValueByPath(context, paramName)
  }

  /**
   * 解析API参数
   * @param param 参数定义
   * @param context 参数上下文
   * @returns API响应值
   */
  private async resolveApiParam(param: DynamicParam, context: ParamContext): Promise<any> {
    if (!param.apiConfig) {
      throw new Error(`API参数 ${param.name} 缺少apiConfig配置`)
    }

    const { url, method = 'GET', params: apiParams, dataPath } = param.apiConfig
    const requestKey = `api:${url}:${method}:${JSON.stringify(apiParams)}`

    // 防止相同请求并发
    if (this.pendingRequests.has(requestKey)) {
      this.log(`等待相同API请求: ${url}`)
      return await this.pendingRequests.get(requestKey)
    }

    const apiPromise = this.performApiRequest(url, method, apiParams)
    this.pendingRequests.set(requestKey, apiPromise)

    try {
      const response = await apiPromise
      let data = response

      // 根据dataPath提取数据
      if (dataPath) {
        data = this.getValueByPath(response, dataPath)
      }

      return data
    } finally {
      this.pendingRequests.delete(requestKey)
    }
  }

  /**
   * 执行API请求
   * @param url 请求URL
   * @param method HTTP方法
   * @param params 请求参数
   * @returns 响应数据
   */
  private async performApiRequest(url: string, method: string, params?: Record<string, any>): Promise<any> {
    this.log(`执行API请求: ${method} ${url}`, params)

    const config: CustomAxiosRequestConfig = {
      url,
      method: method.toLowerCase() as any,
      timeout: this.config.apiTimeout
    }

    if (method.toUpperCase() === 'GET') {
      config.params = params
    } else {
      config.data = params
    }

    const { data, error } = await request(config)

    if (error) {
      throw new Error(`API请求失败: ${error}`)
    }

    return data
  }

  /**
   * 解析计算参数
   * @param param 参数定义
   * @param context 参数上下文
   * @returns 计算结果
   */
  private async resolveComputedParam(param: DynamicParam, context: ParamContext): Promise<any> {
    if (!param.computedConfig) {
      throw new Error(`计算参数 ${param.name} 缺少computedConfig配置`)
    }

    const { computeScript, dependencies = [], async: isAsync = false } = param.computedConfig

    // 准备计算函数的执行上下文
    const computeContext = { ...context }

    // 如果有依赖参数，确保它们已经解析
    if (dependencies.length > 0) {
      for (const dep of dependencies) {
        if (!this.hasValueInContext(dep, context)) {
          throw new Error(`计算参数 ${param.name} 依赖的参数 ${dep} 不存在`)
        }
      }
    }

    return this.executeComputeScript(computeScript, computeContext, isAsync)
  }

  /**
   * 执行计算脚本
   * @param script 计算脚本
   * @param context 执行上下文
   * @param isAsync 是否异步执行
   * @returns 计算结果
   */
  private async executeComputeScript(script: string, context: ParamContext, isAsync: boolean): Promise<any> {
    const safeContext = this.createSafeExecutionContext(context)

    try {
      if (isAsync) {
        // 异步执行
        const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor
        const computeFunction = new AsyncFunction(
          'context',
          `
          const { ${Object.keys(safeContext).join(', ')} } = context;
          ${script}
        `
        )

        return await Promise.race([
          computeFunction(safeContext),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('计算脚本执行超时')), this.config.computeTimeout)
          )
        ])
      } else {
        // 同步执行
        const computeFunction = new Function(
          'context',
          `
          const { ${Object.keys(safeContext).join(', ')} } = context;
          return (${script})
        `
        )

        return computeFunction(safeContext)
      }
    } catch (error: any) {
      throw new Error(`计算脚本执行失败: ${error.message}`)
    }
  }

  /**
   * 创建安全的执行上下文
   * @param context 原始上下文
   * @returns 安全上下文
   */
  private createSafeExecutionContext(context: ParamContext): Record<string, any> {
    // 过滤掉危险的属性和方法
    const safeContext: Record<string, any> = {}

    const traverse = (obj: any, path: string = '') => {
      if (obj === null || typeof obj !== 'object') {
        return obj
      }

      if (Array.isArray(obj)) {
        return obj.map((item, index) => traverse(item, `${path}[${index}]`))
      }

      const safeObj: Record<string, any> = {}
      for (const [key, value] of Object.entries(obj)) {
        // 排除危险的属性
        if (key.startsWith('_') || key === 'constructor' || key === 'prototype') {
          continue
        }

        if (typeof value === 'function') {
          continue // 排除函数
        }

        safeObj[key] = traverse(value, `${path}.${key}`)
      }

      return safeObj
    }

    // 添加常用的工具函数
    safeContext.Math = Math
    safeContext.Date = Date
    safeContext.JSON = JSON
    safeContext.parseInt = parseInt
    safeContext.parseFloat = parseFloat
    safeContext.isNaN = isNaN
    safeContext.isFinite = isFinite

    // 添加用户上下文
    Object.assign(safeContext, traverse(context))

    return safeContext
  }

  /**
   * 解析模板字符串
   * @param template 模板字符串（支持 ${paramName} 语法）
   * @param resolvedParams 已解析的参数值
   * @returns 解析结果
   */
  resolveTemplate(template: string, resolvedParams: Record<string, any>): TemplateResolutionResult {
    const usedParams: string[] = []
    const missingParams: string[] = []

    try {
      const result = template.replace(DYNAMIC_PARAM_CONSTANTS.TEMPLATE_PARAM_REGEX, (match, paramName) => {
        usedParams.push(paramName)

        if (resolvedParams.hasOwnProperty(paramName)) {
          const value = resolvedParams[paramName]
          return String(value ?? '')
        } else {
          missingParams.push(paramName)
          return match // 保持原样
        }
      })

      return {
        success: missingParams.length === 0,
        result,
        usedParams: [...new Set(usedParams)],
        missingParams: [...new Set(missingParams)]
      }
    } catch (error: any) {
      return {
        success: false,
        result: template,
        usedParams,
        missingParams,
        error: error.message
      }
    }
  }

  /**
   * 批量处理参数请求
   * @param request 批量请求
   * @returns 批量结果
   */
  async processBatch(request: BatchParamRequest): Promise<BatchParamResult> {
    const startTime = Date.now()
    const { params, context, requestId } = request

    const resolution = await this.resolveParams(params, context)

    const results: Record<string, { success: boolean; value?: any; error?: string }> = {}

    for (const param of params) {
      const hasValue = resolution.resolvedParams.hasOwnProperty(param.name)
      const error = resolution.errors.find(e => e.paramName === param.name)

      results[param.name] = {
        success: hasValue && !error,
        value: hasValue ? resolution.resolvedParams[param.name] : undefined,
        error: error?.error
      }
    }

    return {
      requestId,
      success: resolution.success,
      results,
      totalTime: Date.now() - startTime
    }
  }

  /**
   * 验证参数值
   * @param paramName 参数名
   * @param value 参数值
   * @param validation 验证规则
   */
  private validateParamValue(paramName: string, value: any, validation: DynamicParam['validation']): void {
    if (!validation) return

    const { min, max, pattern, enum: enumValues } = validation

    // 数值范围验证
    if (typeof value === 'number') {
      if (min !== undefined && value < min) {
        throw new Error(`参数 ${paramName} 的值 ${value} 小于最小值 ${min}`)
      }
      if (max !== undefined && value > max) {
        throw new Error(`参数 ${paramName} 的值 ${value} 大于最大值 ${max}`)
      }
    }

    // 字符串长度验证
    if (typeof value === 'string') {
      if (min !== undefined && value.length < min) {
        throw new Error(`参数 ${paramName} 的长度 ${value.length} 小于最小长度 ${min}`)
      }
      if (max !== undefined && value.length > max) {
        throw new Error(`参数 ${paramName} 的长度 ${value.length} 大于最大长度 ${max}`)
      }
    }

    // 正则表达式验证
    if (pattern && typeof value === 'string') {
      const regex = new RegExp(pattern)
      if (!regex.test(value)) {
        throw new Error(`参数 ${paramName} 的值不匹配正则表达式 ${pattern}`)
      }
    }

    // 枚举值验证
    if (enumValues && !enumValues.includes(value)) {
      throw new Error(`参数 ${paramName} 的值不在允许的枚举值中: ${enumValues.join(', ')}`)
    }
  }

  /**
   * 生成缓存键
   * @param param 参数定义
   * @param context 参数上下文
   * @returns 缓存键
   */
  private generateCacheKey(param: DynamicParam, context: ParamContext): string {
    const configHash = this.computeConfigHash(param)
    const contextHash = this.computeHash(JSON.stringify(context))
    return `${param.name}:${configHash}:${contextHash}`
  }

  /**
   * 检查缓存是否有效
   * @param cacheKey 缓存键
   * @returns 是否有效
   */
  private isCacheValid(cacheKey: string): boolean {
    const cached = this.cache.get(cacheKey)
    if (!cached) return false

    return Date.now() < cached.expireTime
  }

  /**
   * 缓存参数值
   * @param cacheKey 缓存键
   * @param value 参数值
   * @param param 参数定义
   */
  private cacheParam(cacheKey: string, value: any, param: DynamicParam): void {
    const cacheTime = param.apiConfig?.cacheTime ?? this.config.defaultCacheTime
    const now = Date.now()

    this.cache.set(cacheKey, {
      value,
      timestamp: now,
      expireTime: now + cacheTime,
      configHash: this.computeConfigHash(param)
    })

    // 清理过期缓存
    this.cleanExpiredCache()
  }

  /**
   * 清理过期缓存
   */
  private cleanExpiredCache(): void {
    const now = Date.now()
    for (const [key, item] of this.cache.entries()) {
      if (now >= item.expireTime) {
        this.cache.delete(key)
      }
    }
  }

  /**
   * 计算配置哈希
   * @param param 参数配置
   * @returns 哈希值
   */
  private computeConfigHash(param: DynamicParam): string {
    return this.computeHash(
      JSON.stringify({
        name: param.name,
        source: param.source,
        apiConfig: param.apiConfig,
        computedConfig: param.computedConfig,
        staticValue: param.staticValue
      })
    )
  }

  /**
   * 计算字符串哈希
   * @param str 输入字符串
   * @returns 哈希值
   */
  private computeHash(str: string): string {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // 转换为32位整数
    }
    return Math.abs(hash).toString(16)
  }

  /**
   * 根据路径获取嵌套对象的值
   * @param obj 对象
   * @param path 路径（如 'user.profile.name'）
   * @returns 值
   */
  private getValueByPath(obj: any, path: string): any {
    if (!obj || typeof obj !== 'object') return undefined

    const keys = path.split('.')
    let current = obj

    for (const key of keys) {
      if (current === null || current === undefined) return undefined
      current = current[key]
    }

    return current
  }

  /**
   * 检查上下文中是否存在指定路径的值
   * @param path 路径
   * @param context 上下文
   * @returns 是否存在
   */
  private hasValueInContext(path: string, context: ParamContext): boolean {
    return this.getValueByPath(context, path) !== undefined
  }

  /**
   * 调试日志
   * @param message 消息
   * @param data 数据
   */
  private log(message: string, data?: any): void {
    if (this.config.enableDebugLog) {
      console.log(`[DynamicParamManager] ${message}`, data ?? '')
    }
  }

  /**
   * 清空所有缓存
   */
  clearCache(): void {
    this.cache.clear()
    this.log('缓存已清空')
  }

  /**
   * 获取缓存统计信息
   * @returns 缓存统计
   */
  getCacheStats(): { total: number; expired: number; valid: number } {
    const now = Date.now()
    let expired = 0
    let valid = 0

    for (const item of this.cache.values()) {
      if (now >= item.expireTime) {
        expired++
      } else {
        valid++
      }
    }

    return { total: this.cache.size, expired, valid }
  }

  /**
   * 销毁管理器
   */
  dispose(): void {
    this.cache.clear()
    this.pendingRequests.clear()
    this.log('DynamicParamManager 已销毁')
  }
}
