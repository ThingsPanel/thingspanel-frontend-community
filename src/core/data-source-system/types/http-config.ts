/**
 * HTTP配置相关的类型定义
 * 统一HTTP配置结构，确保表单组件和执行器使用相同的数据格式
 */

import type { DynamicParam } from './dynamic-params'

/**
 * HTTP请求方法类型
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS'

/**
 * HTTP请求体类型
 */
export type HttpBodyType = 'json' | 'form' | 'raw' | 'none'

/**
 * 键值对结构（用于headers、params等）
 */
export interface KeyValuePair {
  key: string
  value: string
}

/**
 * 表单数据项结构
 */
export interface FormDataItem {
  key: string
  value: string
  type?: 'text' | 'file'
}

/**
 * API类型枚举
 */
export type ApiType = 'internal' | 'external'

/**
 * HTTP配置接口 - 完整版本
 * 包含表单组件需要的所有字段
 */
export interface HttpConfig {
  /** 请求URL */
  url: string

  /** HTTP方法 */
  method: HttpMethod

  /** API类型标记 - 可选，会自动检测 */
  apiType?: ApiType

  /** 请求头 - 对象格式，便于执行器使用 */
  headers: Record<string, string>

  /** 查询参数 - 对象格式，便于执行器使用 */
  params: Record<string, string>

  /** 请求体内容 */
  body?: string

  /** 请求体类型 */
  bodyType?: HttpBodyType

  /** 表单数据（当bodyType为form时使用） */
  formData?: FormDataItem[]

  /** 请求超时时间（毫秒） */
  timeout?: number

  /** 重试次数 */
  retryCount?: number

  /** 重试间隔（毫秒） */
  retryInterval?: number

  /** 是否跟随重定向 */
  followRedirects?: boolean

  /** 是否验证SSL证书 */
  validateSSL?: boolean

  /** 是否启用Cookie管理 */
  enableCookies?: boolean

  /** 前置脚本配置 */
  preRequestScript?: string

  /** 响应后处理脚本配置 */
  responseScript?: string

  /** 动态参数配置 */
  dynamicParams?: DynamicParam[]

  /** 代理配置 */
  proxy?: {
    enabled: boolean
    host: string
    port: number
    username?: string
    password?: string
  }
}

/**
 * HTTP配置表单数据结构
 * 用于表单组件内部编辑，包含键值对数组格式的headers和params
 */
export interface HttpConfigFormData {
  /** 请求URL */
  url: string

  /** HTTP方法 */
  method: HttpMethod

  /** 请求头 - 数组格式，便于表单编辑 */
  headers: KeyValuePair[]

  /** 查询参数 - 数组格式，便于表单编辑 */
  params: KeyValuePair[]

  /** 请求体内容 */
  body?: string

  /** 请求体类型 */
  bodyType?: HttpBodyType

  /** 表单数据 */
  formData?: FormDataItem[]

  /** 请求超时时间（毫秒） */
  timeout?: number

  /** 重试次数 */
  retries?: number

  /** 是否跟随重定向 */
  followRedirects?: boolean

  /** 是否验证SSL证书 */
  validateSSL?: boolean

  /** 是否启用Cookie管理 */
  enableCookies?: boolean

  /** 前置脚本 */
  preRequestScript?: string

  /** 是否启用前置脚本 */
  enablePreScript?: boolean

  /** 响应处理脚本 */
  responseScript?: string

  /** 是否启用响应脚本 */
  enableResponseScript?: boolean

  /** 动态参数配置 */
  dynamicParams?: DynamicParam[]

  /** 是否启用动态参数 */
  enableDynamicParams?: boolean

  /** 是否使用代理 */
  useProxy?: boolean

  /** 代理主机 */
  proxyHost?: string

  /** 代理端口 */
  proxyPort?: number

  /** 代理用户名 */
  proxyUsername?: string

  /** 代理密码 */
  proxyPassword?: string
}

/**
 * HTTP执行结果
 */
export interface HttpExecutionResult {
  /** 是否成功 */
  success: boolean

  /** 响应数据 */
  data?: any

  /** HTTP状态码 */
  status?: number

  /** HTTP状态文本 */
  statusText?: string

  /** 响应头 */
  headers?: Record<string, string>

  /** 最终请求URL（可能包含重定向） */
  url?: string

  /** 执行时间（毫秒） */
  executionTime: number

  /** 错误信息 */
  error?: string

  /** 错误类型 */
  errorType?: 'network' | 'timeout' | 'abort' | 'parse' | 'validation' | 'script' | 'unknown'

  /** 时间戳 */
  timestamp: number
}

/**
 * HTTP配置转换工具类
 */
export class HttpConfigConverter {
  /**
   * 将表单数据转换为执行配置
   * @param formData 表单数据
   * @returns 执行配置
   */
  static formDataToConfig(formData: HttpConfigFormData): HttpConfig {
    // 转换headers数组为对象
    const headers: Record<string, string> = {}
    formData.headers?.forEach(header => {
      if (header.key && header.value) {
        headers[header.key] = header.value
      }
    })

    // 转换params数组为对象
    const params: Record<string, string> = {}
    formData.params?.forEach(param => {
      if (param.key && param.value) {
        params[param.key] = param.value
      }
    })

    // 构建执行配置
    const config: HttpConfig = {
      url: formData.url,
      method: formData.method,
      headers,
      params,
      body: formData.body,
      bodyType: formData.bodyType,
      formData: formData.formData,
      timeout: formData.timeout,
      retryCount: formData.retries || 0,
      followRedirects: formData.followRedirects,
      validateSSL: formData.validateSSL,
      enableCookies: formData.enableCookies
    }

    // 处理前置脚本
    if (formData.enablePreScript && formData.preRequestScript) {
      config.preRequestScript = formData.preRequestScript
    }

    // 处理响应脚本
    if (formData.enableResponseScript && formData.responseScript) {
      config.responseScript = formData.responseScript
    }

    // 处理动态参数
    if (formData.enableDynamicParams && formData.dynamicParams) {
      config.dynamicParams = formData.dynamicParams
    }

    // 处理代理配置
    if (formData.useProxy && formData.proxyHost) {
      config.proxy = {
        enabled: true,
        host: formData.proxyHost,
        port: formData.proxyPort || 8080,
        username: formData.proxyUsername,
        password: formData.proxyPassword
      }
    }

    return config
  }

  /**
   * 将执行配置转换为表单数据
   * @param config 执行配置
   * @returns 表单数据
   */
  static configToFormData(config: HttpConfig): HttpConfigFormData {
    // 转换headers对象为数组
    const headers: KeyValuePair[] = Object.entries(config.headers || {}).map(([key, value]) => ({ key, value }))

    // 转换params对象为数组
    const params: KeyValuePair[] = Object.entries(config.params || {}).map(([key, value]) => ({ key, value }))

    // 构建表单数据
    const formData: HttpConfigFormData = {
      url: config.url,
      method: config.method,
      headers,
      params,
      body: config.body,
      bodyType: config.bodyType,
      formData: config.formData,
      timeout: config.timeout,
      retries: config.retryCount,
      followRedirects: config.followRedirects,
      validateSSL: config.validateSSL,
      enableCookies: config.enableCookies,
      preRequestScript: config.preRequestScript,
      enablePreScript: !!config.preRequestScript,
      responseScript: config.responseScript,
      enableResponseScript: !!config.responseScript,
      dynamicParams: config.dynamicParams,
      enableDynamicParams: !!(config.dynamicParams && config.dynamicParams.length > 0),
      useProxy: config.proxy?.enabled,
      proxyHost: config.proxy?.host,
      proxyPort: config.proxy?.port,
      proxyUsername: config.proxy?.username,
      proxyPassword: config.proxy?.password
    }

    return formData
  }

  /**
   * 创建默认的HTTP配置
   * @returns 默认HTTP配置
   */
  static createDefaultConfig(): HttpConfig {
    return {
      url: '',
      method: 'GET',
      headers: {},
      params: {},
      bodyType: 'json',
      timeout: 10000,
      retryCount: 0,
      followRedirects: true,
      validateSSL: true,
      enableCookies: false
    }
  }

  /**
   * 创建默认的表单数据
   * @returns 默认表单数据
   */
  static createDefaultFormData(): HttpConfigFormData {
    return {
      url: '',
      method: 'GET',
      headers: [],
      params: [],
      bodyType: 'json',
      timeout: 10000,
      retries: 0,
      followRedirects: true,
      validateSSL: true,
      enableCookies: false,
      useProxy: false,
      proxyPort: 8080,
      enablePreScript: false,
      enableResponseScript: false
    }
  }

  /**
   * 验证HTTP配置
   * @param config HTTP配置
   * @returns 验证结果
   */
  static validateConfig(config: HttpConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    // 验证URL
    if (!config.url || !config.url.trim()) {
      errors.push('请求URL不能为空')
    } else {
      try {
        // 如果是完整URL，验证格式
        if (config.url.startsWith('http://') || config.url.startsWith('https://')) {
          new URL(config.url)
        }
      } catch {
        errors.push('请求URL格式无效')
      }
    }

    // 验证HTTP方法
    const validMethods: HttpMethod[] = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS']
    if (!validMethods.includes(config.method)) {
      errors.push('HTTP方法无效')
    }

    // 验证超时时间
    if (config.timeout <= 0) {
      errors.push('超时时间必须大于0')
    }

    // 验证重试次数
    if (config.retryCount !== undefined && config.retryCount < 0) {
      errors.push('重试次数不能为负数')
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }
}

/**
 * HTTP配置常量
 */
export const HTTP_CONFIG_CONSTANTS = {
  /** 默认超时时间 */
  DEFAULT_TIMEOUT: 10000,

  /** 默认重试次数 */
  DEFAULT_RETRY_COUNT: 0,

  /** 默认重试间隔 */
  DEFAULT_RETRY_INTERVAL: 1000,

  /** 默认代理端口 */
  DEFAULT_PROXY_PORT: 8080,

  /** 支持的HTTP方法 */
  SUPPORTED_METHODS: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'] as HttpMethod[],

  /** 支持的请求体类型 */
  SUPPORTED_BODY_TYPES: ['json', 'form', 'raw', 'none'] as HttpBodyType[],

  /** 常用请求头 */
  COMMON_HEADERS: {
    'Content-Type': [
      'application/json',
      'application/x-www-form-urlencoded',
      'text/plain',
      'text/html',
      'application/xml'
    ],
    Accept: ['application/json', 'text/plain', 'text/html', 'application/xml', '*/*'],
    Authorization: ['Bearer <token>', 'Basic <credentials>']
  }
} as const
