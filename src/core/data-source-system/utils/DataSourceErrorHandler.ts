/**
 * 数据源专用错误处理器
 * 扩展系统错误管理器，专门处理数据源相关的错误场景
 */

import type {
  SystemError,
  SystemErrorType,
  ErrorHandlingResult,
  ErrorRecoveryStrategy,
  HttpConfiguration,
  WebSocketConfiguration
} from '../types'
import { SystemErrorManager, systemErrorManager } from './SystemErrorManager'

/**
 * 数据源错误类型扩展
 */
export enum DataSourceErrorType {
  // HTTP相关错误
  HTTP_CONFIG_INVALID = 'http_config_invalid',
  HTTP_REQUEST_FAILED = 'http_request_failed',
  HTTP_RESPONSE_INVALID = 'http_response_invalid',
  HTTP_TIMEOUT = 'http_timeout',

  // WebSocket相关错误
  WS_CONNECTION_FAILED = 'ws_connection_failed',
  WS_MESSAGE_INVALID = 'ws_message_invalid',
  WS_AUTH_FAILED = 'ws_auth_failed',

  // 数据处理错误
  DATA_TRANSFORM_FAILED = 'data_transform_failed',
  DATA_VALIDATION_FAILED = 'data_validation_failed',
  FIELD_MAPPING_FAILED = 'field_mapping_failed',

  // 执行器错误
  EXECUTOR_NOT_FOUND = 'executor_not_found',
  EXECUTOR_INIT_FAILED = 'executor_init_failed',
  EXECUTION_TIMEOUT = 'execution_timeout',

  // 脚本错误
  SCRIPT_SYNTAX_ERROR = 'script_syntax_error',
  SCRIPT_RUNTIME_ERROR = 'script_runtime_error',
  SCRIPT_SECURITY_ERROR = 'script_security_error'
}

/**
 * 数据源错误上下文
 */
export interface DataSourceErrorContext {
  /** 数据源ID */
  dataSourceId?: string
  /** 数据源类型 */
  dataSourceType?: string
  /** 组件ID */
  componentId?: string
  /** 执行器类型 */
  executorType?: string
  /** 配置信息（敏感信息已脱敏） */
  config?: any
  /** 请求信息 */
  request?: {
    url?: string
    method?: string
    headers?: Record<string, string>
  }
  /** 响应信息 */
  response?: {
    status?: number
    statusText?: string
    headers?: Record<string, string>
  }
}

/**
 * 数据源错误处理器
 */
export class DataSourceErrorHandler {
  private errorManager: SystemErrorManager

  constructor() {
    this.errorManager = systemErrorManager
  }

  /**
   * 处理HTTP配置错误
   */
  async handleHttpConfigError(
    config: Partial<HttpConfiguration>,
    validationErrors: string[],
    context: DataSourceErrorContext = {}
  ): Promise<ErrorHandlingResult> {
    const error = SystemErrorManager.createError(
      SystemErrorType.VALIDATION,
      DataSourceErrorType.HTTP_CONFIG_INVALID,
      `HTTP配置验证失败: ${validationErrors.join(', ')}`,
      {
        validationErrors,
        config: this.sanitizeHttpConfig(config)
      },
      {
        ...context,
        dataSourceType: 'http',
        validationErrors
      }
    )

    return this.errorManager.handleError(error, {
      type: 'fail' // 配置错误不可重试
    })
  }

  /**
   * 处理HTTP请求错误
   */
  async handleHttpRequestError(
    error: any,
    config: HttpConfiguration,
    context: DataSourceErrorContext = {}
  ): Promise<ErrorHandlingResult> {
    let systemErrorType = SystemErrorType.NETWORK
    let errorCode = DataSourceErrorType.HTTP_REQUEST_FAILED
    let errorMessage = 'HTTP请求失败'

    // 分析具体错误类型
    if (error.code === 'ECONNABORTED') {
      systemErrorType = SystemErrorType.TIMEOUT
      errorCode = DataSourceErrorType.HTTP_TIMEOUT
      errorMessage = `HTTP请求超时 (${config.timeout}ms)`
    } else if (error.response) {
      systemErrorType = SystemErrorType.NETWORK
      errorCode = DataSourceErrorType.HTTP_REQUEST_FAILED
      errorMessage = `HTTP请求失败: ${error.response.status} ${error.response.statusText}`
    } else if (error.request) {
      systemErrorType = SystemErrorType.CONNECTION_FAILED
      errorCode = DataSourceErrorType.HTTP_REQUEST_FAILED
      errorMessage = 'HTTP连接失败，无法发送请求'
    }

    const systemError = SystemErrorManager.createError(
      systemErrorType,
      errorCode,
      errorMessage,
      {
        originalError: error.message,
        config: this.sanitizeHttpConfig(config)
      },
      {
        ...context,
        dataSourceType: 'http',
        request: {
          url: config.url,
          method: config.method,
          headers: this.sanitizeHeaders(config.headers)
        },
        response: error.response
          ? {
              status: error.response.status,
              statusText: error.response.statusText,
              headers: error.response.headers
            }
          : undefined
      }
    )

    // 设置重试策略
    const recoveryStrategy: ErrorRecoveryStrategy = {
      type: systemError.retryable ? 'retry' : 'fail',
      maxRetries: 3,
      retryDelay: 1000
    }

    return this.errorManager.handleError(systemError, recoveryStrategy)
  }

  /**
   * 处理HTTP响应解析错误
   */
  async handleHttpResponseError(
    responseData: any,
    config: HttpConfiguration,
    parseError: Error,
    context: DataSourceErrorContext = {}
  ): Promise<ErrorHandlingResult> {
    const systemError = SystemErrorManager.createError(
      SystemErrorType.PARSE,
      DataSourceErrorType.HTTP_RESPONSE_INVALID,
      '响应数据解析失败',
      {
        parseError: parseError.message,
        responseData: typeof responseData === 'string' ? responseData.substring(0, 200) + '...' : responseData,
        config: this.sanitizeHttpConfig(config)
      },
      {
        ...context,
        dataSourceType: 'http'
      }
    )

    return this.errorManager.handleError(systemError, {
      type: 'fail' // 解析错误不可重试
    })
  }

  /**
   * 处理WebSocket连接错误
   */
  async handleWebSocketError(
    error: Event | Error,
    config: WebSocketConfiguration,
    context: DataSourceErrorContext = {}
  ): Promise<ErrorHandlingResult> {
    const systemError = SystemErrorManager.createError(
      SystemErrorType.CONNECTION_FAILED,
      DataSourceErrorType.WS_CONNECTION_FAILED,
      'WebSocket连接失败',
      {
        error: error instanceof Error ? error.message : 'Connection failed',
        config: this.sanitizeWebSocketConfig(config)
      },
      {
        ...context,
        dataSourceType: 'websocket'
      }
    )

    return this.errorManager.handleError(systemError, {
      type: 'retry',
      maxRetries: 5,
      retryDelay: 2000
    })
  }

  /**
   * 处理数据转换错误
   */
  async handleDataTransformError(
    transformScript: string,
    sourceData: any,
    error: Error,
    context: DataSourceErrorContext = {}
  ): Promise<ErrorHandlingResult> {
    const systemError = SystemErrorManager.createError(
      SystemErrorType.TRANSFORM,
      DataSourceErrorType.DATA_TRANSFORM_FAILED,
      '数据转换失败',
      {
        error: error.message,
        script: transformScript,
        sourceDataType: typeof sourceData,
        sourceDataSample: this.sanitizeData(sourceData)
      },
      context
    )

    return this.errorManager.handleError(systemError, {
      type: 'fail' // 转换错误不可重试
    })
  }

  /**
   * 处理脚本执行错误
   */
  async handleScriptError(
    scriptType: 'pre-request' | 'response' | 'transform',
    script: string,
    error: Error,
    context: DataSourceErrorContext = {}
  ): Promise<ErrorHandlingResult> {
    let errorCode: string

    if (error instanceof SyntaxError) {
      errorCode = DataSourceErrorType.SCRIPT_SYNTAX_ERROR
    } else if (error.message.includes('security') || error.message.includes('permission')) {
      errorCode = DataSourceErrorType.SCRIPT_SECURITY_ERROR
    } else {
      errorCode = DataSourceErrorType.SCRIPT_RUNTIME_ERROR
    }

    const systemError = SystemErrorManager.createError(
      SystemErrorType.SCRIPT,
      errorCode,
      `${scriptType}脚本执行失败: ${error.message}`,
      {
        scriptType,
        script: script.substring(0, 200) + (script.length > 200 ? '...' : ''),
        error: error.message,
        stack: error.stack
      },
      context
    )

    return this.errorManager.handleError(systemError, {
      type: 'fail' // 脚本错误不可重试
    })
  }

  /**
   * 处理字段映射错误
   */
  async handleFieldMappingError(
    fieldMapping: Record<string, string>,
    sourceData: any,
    error: Error,
    context: DataSourceErrorContext = {}
  ): Promise<ErrorHandlingResult> {
    const systemError = SystemErrorManager.createError(
      SystemErrorType.TRANSFORM,
      DataSourceErrorType.FIELD_MAPPING_FAILED,
      '字段映射失败',
      {
        fieldMapping,
        sourceData: this.sanitizeData(sourceData),
        error: error.message
      },
      context
    )

    return this.errorManager.handleError(systemError, {
      type: 'fail' // 映射错误不可重试
    })
  }

  // ========== 私有辅助方法 ==========

  /**
   * 脱敏HTTP配置中的敏感信息
   */
  private sanitizeHttpConfig(config: Partial<HttpConfiguration>): any {
    const sanitized = { ...config }

    if (sanitized.headers) {
      sanitized.headers = this.sanitizeHeaders(sanitized.headers)
    }

    // 脱敏请求体中的敏感信息
    if (sanitized.body && typeof sanitized.body === 'object') {
      sanitized.body = this.sanitizeData(sanitized.body)
    }

    return sanitized
  }

  /**
   * 脱敏WebSocket配置
   */
  private sanitizeWebSocketConfig(config: WebSocketConfiguration): any {
    const sanitized = { ...config }

    // 隐藏认证信息
    if (sanitized.auth) {
      sanitized.auth = {
        ...sanitized.auth,
        token: sanitized.auth.token ? '***' : undefined,
        password: sanitized.auth.password ? '***' : undefined
      }
    }

    return sanitized
  }

  /**
   * 脱敏请求头中的敏感信息
   */
  private sanitizeHeaders(headers: any[]): any[] {
    const sensitiveKeys = ['authorization', 'token', 'api-key', 'x-api-key', 'cookie']

    return headers.map(header => ({
      ...header,
      value: sensitiveKeys.some(key => header.key.toLowerCase().includes(key.toLowerCase())) ? '***' : header.value
    }))
  }

  /**
   * 脱敏数据对象
   */
  private sanitizeData(data: any): any {
    if (typeof data !== 'object' || data === null) {
      return data
    }

    if (Array.isArray(data)) {
      return data.length > 5 ? [...data.slice(0, 5), `... (${data.length - 5} more items)`] : data
    }

    const sanitized: any = {}
    const sensitiveKeys = ['password', 'token', 'key', 'secret', 'auth']

    for (const [key, value] of Object.entries(data)) {
      if (sensitiveKeys.some(sensitiveKey => key.toLowerCase().includes(sensitiveKey.toLowerCase()))) {
        sanitized[key] = '***'
      } else {
        sanitized[key] = value
      }
    }

    return sanitized
  }
}

// 导出单例实例
export const dataSourceErrorHandler = new DataSourceErrorHandler()
