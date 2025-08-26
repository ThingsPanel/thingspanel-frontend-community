/**
 * HTTP执行器错误处理工具
 * 统一错误分类、消息格式和处理逻辑
 */

import type { HttpExecutionResult } from '../../types'

/**
 * 错误类型枚举
 */
export enum ErrorType {
  SCRIPT = 'script', // 脚本执行错误
  NETWORK = 'network', // 网络错误
  TIMEOUT = 'timeout', // 超时错误
  ABORT = 'abort', // 请求中止
  VALIDATION = 'validation', // 配置验证错误
  PARSE = 'parse', // 数据解析错误
  UNKNOWN = 'unknown' // 未知错误
}

/**
 * 错误处理结果
 */
export interface ErrorResult {
  success: false
  error: string
  errorType: ErrorType
  status?: number
  statusText?: string
  headers?: Record<string, string>
  executionTime: number
  timestamp: number
}

/**
 * 错误处理器类
 */
export class ErrorHandler {
  /**
   * 创建脚本执行错误
   */
  static createScriptError(message: string, executionTime = 0): ErrorResult {
    return {
      success: false,
      error: `脚本执行失败: ${message}`,
      errorType: ErrorType.SCRIPT,
      executionTime,
      timestamp: Date.now()
    }
  }

  /**
   * 创建配置验证错误
   */
  static createValidationError(errors: string[], executionTime = 0): ErrorResult {
    return {
      success: false,
      error: `配置验证失败: ${errors.join(', ')}`,
      errorType: ErrorType.VALIDATION,
      executionTime,
      timestamp: Date.now()
    }
  }

  /**
   * 分析axios错误并创建错误结果
   */
  static analyzeAxiosError(error: any, executionTime = 0): ErrorResult {
    let errorType = ErrorType.UNKNOWN
    let errorMessage = error.message || '请求失败'
    let status: number | undefined
    let statusText: string | undefined
    let headers: Record<string, string> = {}

    // 分析错误类型
    if (error.code === 'ECONNABORTED') {
      errorType = ErrorType.TIMEOUT
      errorMessage = '请求超时'
    } else if (error.response) {
      errorType = ErrorType.NETWORK
      status = error.response.status
      statusText = error.response.statusText
      headers = error.response.headers || {}
      errorMessage = `HTTP ${error.response.status}: ${error.response.statusText || error.message}`
    } else if (error.code === 'NETWORK_ERROR') {
      errorType = ErrorType.NETWORK
      errorMessage = '网络连接错误'
    } else if (error.name === 'AbortError') {
      errorType = ErrorType.ABORT
      errorMessage = '请求已取消'
    }

    return {
      success: false,
      error: errorMessage,
      errorType,
      status,
      statusText,
      headers,
      executionTime,
      timestamp: Date.now()
    }
  }

  /**
   * 创建通用错误
   */
  static createGenericError(message: string, type: ErrorType = ErrorType.UNKNOWN, executionTime = 0): ErrorResult {
    return {
      success: false,
      error: message,
      errorType: type,
      executionTime,
      timestamp: Date.now()
    }
  }

  /**
   * 判断错误是否为认证相关错误
   */
  static isAuthError(error: ErrorResult | HttpExecutionResult): boolean {
    return error.status === 401 || error.status === 403
  }

  /**
   * 判断错误是否为网络相关错误
   */
  static isNetworkError(error: ErrorResult | HttpExecutionResult): boolean {
    return (
      error.errorType === ErrorType.NETWORK ||
      error.errorType === ErrorType.TIMEOUT ||
      error.errorType === ErrorType.ABORT
    )
  }

  /**
   * 获取用户友好的错误消息
   */
  static getUserFriendlyMessage(error: ErrorResult | HttpExecutionResult): string {
    switch (error.errorType) {
      case ErrorType.SCRIPT:
        return '脚本执行出现问题，请检查脚本代码'
      case ErrorType.NETWORK:
        if (error.status === 404) return '请求的资源未找到'
        if (error.status === 500) return '服务器内部错误'
        if (error.status === 401) return '认证失败，请检查权限'
        if (error.status === 403) return '访问被拒绝'
        return '网络请求失败'
      case ErrorType.TIMEOUT:
        return '请求超时，请检查网络连接或增加超时时间'
      case ErrorType.ABORT:
        return '请求已取消'
      case ErrorType.VALIDATION:
        return '配置参数有误，请检查配置'
      case ErrorType.PARSE:
        return '数据解析失败，请检查响应格式'
      default:
        return error.error || '发生未知错误'
    }
  }

  /**
   * 记录错误日志
   */
  static logError(error: ErrorResult | HttpExecutionResult, context?: string): void {
    const logContext = context ? `[${context}]` : '[HttpDataExecutor]'
    const userMessage = this.getUserFriendlyMessage(error)

    console.error(`${logContext} 错误详情:`, {
      type: error.errorType,
      message: error.error,
      userMessage,
      status: error.status,
      timestamp: new Date(error.timestamp).toISOString(),
      executionTime: error.executionTime
    })
  }
}
