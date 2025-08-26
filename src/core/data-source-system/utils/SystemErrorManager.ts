/**
 * 数据源系统统一错误管理器
 * 提供完整的错误处理、恢复和监控机制
 */

import type { SystemError, SystemErrorType, ErrorHandlingResult, ErrorRecoveryStrategy, ErrorListener } from '../types'

/**
 * 系统错误管理器
 */
export class SystemErrorManager {
  private static instance: SystemErrorManager | null = null

  /** 错误监听器集合 */
  private listeners: Map<string, ErrorListener> = new Map()

  /** 错误统计计数器 */
  private errorCounts: Map<SystemErrorType, number> = new Map()

  /** 是否启用详细日志 */
  private verboseLogging = false

  /**
   * 获取单例实例
   */
  static getInstance(): SystemErrorManager {
    if (!SystemErrorManager.instance) {
      SystemErrorManager.instance = new SystemErrorManager()
    }
    return SystemErrorManager.instance
  }

  /**
   * 创建系统错误
   */
  static createError(
    type: SystemErrorType,
    code: string,
    message: string,
    details?: any,
    context?: Record<string, any>
  ): SystemError {
    const userMessage = SystemErrorManager.generateUserFriendlyMessage(type, message, details)

    return {
      type,
      code,
      message,
      details,
      context,
      timestamp: Date.now(),
      retryable: SystemErrorManager.isRetryable(type),
      userMessage
    }
  }

  /**
   * 处理错误并返回结果
   */
  async handleError<T = any>(
    error: SystemError | Error | any,
    strategy?: ErrorRecoveryStrategy
  ): Promise<ErrorHandlingResult<T>> {
    const startTime = Date.now()
    let systemError: SystemError

    // 标准化错误对象
    if (error instanceof Error) {
      systemError = this.convertJavaScriptError(error)
    } else if (this.isSystemError(error)) {
      systemError = error
    } else {
      systemError = SystemErrorManager.createError(SystemErrorType.UNKNOWN, 'UNKNOWN_ERROR', '发生未知错误', error)
    }

    // 更新错误统计
    this.updateErrorStats(systemError.type)

    // 记录错误日志
    this.logError(systemError)

    // 通知监听器
    await this.notifyListeners(systemError)

    // 执行恢复策略
    const result = await this.executeRecoveryStrategy(systemError, strategy)

    return {
      success: false,
      error: systemError,
      executionTime: Date.now() - startTime,
      ...result
    }
  }

  /**
   * 添加错误监听器
   */
  addListener(listener: ErrorListener): void {
    this.listeners.set(listener.id, listener)
    console.log(`📡 [SystemErrorManager] 添加错误监听器: ${listener.id}`)
  }

  /**
   * 移除错误监听器
   */
  removeListener(listenerId: string): boolean {
    const removed = this.listeners.delete(listenerId)
    if (removed) {
      console.log(`📡 [SystemErrorManager] 移除错误监听器: ${listenerId}`)
    }
    return removed
  }

  /**
   * 获取错误统计信息
   */
  getErrorStats(): Record<SystemErrorType, number> {
    const stats: Record<string, number> = {}
    for (const [type, count] of this.errorCounts) {
      stats[type] = count
    }
    return stats as Record<SystemErrorType, number>
  }

  /**
   * 清除错误统计
   */
  clearErrorStats(): void {
    this.errorCounts.clear()
    console.log('📊 [SystemErrorManager] 错误统计已清除')
  }

  /**
   * 设置详细日志模式
   */
  setVerboseLogging(enabled: boolean): void {
    this.verboseLogging = enabled
    console.log(`📝 [SystemErrorManager] 详细日志模式: ${enabled ? '开启' : '关闭'}`)
  }

  // ========== 私有方法 ==========

  /**
   * 将JavaScript Error转换为SystemError
   */
  private convertJavaScriptError(error: Error): SystemError {
    let type = SystemErrorType.UNKNOWN
    let code = 'JS_ERROR'

    // 根据错误类型和消息判断类型
    if (error.name === 'TypeError') {
      type = SystemErrorType.SYSTEM
      code = 'TYPE_ERROR'
    } else if (error.name === 'ReferenceError') {
      type = SystemErrorType.SYSTEM
      code = 'REFERENCE_ERROR'
    } else if (error.name === 'SyntaxError') {
      type = SystemErrorType.SCRIPT
      code = 'SYNTAX_ERROR'
    } else if (error.message.includes('network') || error.message.includes('fetch')) {
      type = SystemErrorType.NETWORK
      code = 'NETWORK_ERROR'
    } else if (error.message.includes('timeout')) {
      type = SystemErrorType.TIMEOUT
      code = 'TIMEOUT_ERROR'
    }

    return SystemErrorManager.createError(type, code, error.message, {
      name: error.name,
      stack: error.stack
    })
  }

  /**
   * 检查对象是否为SystemError
   */
  private isSystemError(obj: any): obj is SystemError {
    return obj && typeof obj === 'object' && 'type' in obj && 'code' in obj && 'message' in obj && 'timestamp' in obj
  }

  /**
   * 更新错误统计
   */
  private updateErrorStats(type: SystemErrorType): void {
    const current = this.errorCounts.get(type) || 0
    this.errorCounts.set(type, current + 1)
  }

  /**
   * 记录错误日志
   */
  private logError(error: SystemError): void {
    const logPrefix = '🚨 [SystemErrorManager]'

    if (this.verboseLogging) {
      console.error(`${logPrefix} 详细错误信息:`, {
        type: error.type,
        code: error.code,
        message: error.message,
        userMessage: error.userMessage,
        details: error.details,
        context: error.context,
        timestamp: new Date(error.timestamp).toISOString(),
        retryable: error.retryable
      })
    } else {
      console.error(`${logPrefix} ${error.type}[${error.code}]: ${error.userMessage || error.message}`)
    }
  }

  /**
   * 通知所有监听器
   */
  private async notifyListeners(error: SystemError): Promise<void> {
    const notificationPromises: Promise<void>[] = []

    for (const listener of this.listeners.values()) {
      // 检查错误类型过滤器
      if (listener.errorTypes && !listener.errorTypes.includes(error.type)) {
        continue
      }

      // 异步执行监听器回调
      const promise = Promise.resolve(listener.callback(error)).catch(callbackError => {
        console.error(`📡 [SystemErrorManager] 监听器回调执行失败:`, callbackError)
      })

      notificationPromises.push(promise)
    }

    await Promise.all(notificationPromises)
  }

  /**
   * 执行错误恢复策略
   */
  private async executeRecoveryStrategy<T>(
    error: SystemError,
    strategy?: ErrorRecoveryStrategy
  ): Promise<Partial<ErrorHandlingResult<T>>> {
    if (!strategy) {
      return {}
    }

    switch (strategy.type) {
      case 'retry':
        return await this.executeRetryStrategy(error, strategy)

      case 'fallback':
        return {
          success: true,
          data: strategy.fallbackData
        }

      case 'ignore':
        return {
          success: true,
          data: undefined
        }

      case 'fail':
      default:
        return {}
    }
  }

  /**
   * 执行重试策略
   */
  private async executeRetryStrategy<T>(
    error: SystemError,
    strategy: ErrorRecoveryStrategy
  ): Promise<Partial<ErrorHandlingResult<T>>> {
    if (!error.retryable || !strategy.maxRetries) {
      return {}
    }

    console.log(`🔄 [SystemErrorManager] 准备重试，最大次数: ${strategy.maxRetries}`)

    // 这里只返回重试意向，实际重试逻辑应该由调用方实现
    return {
      retryCount: 0 // 初始重试计数
    }
  }

  // ========== 静态辅助方法 ==========

  /**
   * 生成用户友好的错误消息
   */
  private static generateUserFriendlyMessage(type: SystemErrorType, message: string, details?: any): string {
    switch (type) {
      case SystemErrorType.VALIDATION:
        return '配置参数验证失败，请检查输入内容'

      case SystemErrorType.MISSING_CONFIG:
        return '缺少必要的配置信息'

      case SystemErrorType.INVALID_CONFIG:
        return '配置格式不正确'

      case SystemErrorType.NETWORK:
        return '网络连接出现问题，请检查网络状态'

      case SystemErrorType.TIMEOUT:
        return '操作超时，请稍后重试或检查网络连接'

      case SystemErrorType.CONNECTION_FAILED:
        return '连接失败，请检查服务地址和网络状态'

      case SystemErrorType.AUTH:
        return '身份验证失败，请检查认证信息'

      case SystemErrorType.PERMISSION:
        return '权限不足，无法执行此操作'

      case SystemErrorType.PARSE:
        return '数据解析失败，请检查数据格式'

      case SystemErrorType.TRANSFORM:
        return '数据转换失败，请检查转换规则'

      case SystemErrorType.SCRIPT:
        return '脚本执行出错，请检查脚本语法'

      case SystemErrorType.SYSTEM:
        return '系统错误，请联系技术支持'

      default:
        return message || '发生未知错误'
    }
  }

  /**
   * 判断错误类型是否可重试
   */
  private static isRetryable(type: SystemErrorType): boolean {
    switch (type) {
      case SystemErrorType.NETWORK:
      case SystemErrorType.TIMEOUT:
      case SystemErrorType.CONNECTION_FAILED:
        return true

      case SystemErrorType.VALIDATION:
      case SystemErrorType.MISSING_CONFIG:
      case SystemErrorType.INVALID_CONFIG:
      case SystemErrorType.AUTH:
      case SystemErrorType.PERMISSION:
      case SystemErrorType.PARSE:
      case SystemErrorType.SCRIPT:
        return false

      default:
        return false
    }
  }
}

// 导出单例实例
export const systemErrorManager = SystemErrorManager.getInstance()

// 便捷方法导出
export const createSystemError = SystemErrorManager.createError
