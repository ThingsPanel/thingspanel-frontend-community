import { ErrorType, ErrorCode, ErrorContext, ErrorStrategy, ErrorResolution } from './types'

export class EnhancedErrorHandler {
  private errorStrategies: Map<ErrorType, ErrorStrategy> = new Map()
  private retryConfig = {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 30000,
    backoffMultiplier: 2
  }

  constructor() {
    this.initializeErrorStrategies()
  }

  // 上下文感知的错误处理
  async handleErrorWithContext(error: Error, context: ErrorContext): Promise<ErrorResolution> {
    const strategy = this.getContextualStrategy(error, context)
    return await strategy.resolve(error, context)
  }

  // 自动重试机制
  async retryWithBackoff<T>(operation: () => Promise<T>, config?: Partial<typeof this.retryConfig>): Promise<T> {
    const retryConfig = { ...this.retryConfig, ...config }
    let lastError: Error

    for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
      try {
        return await operation()
      } catch (error) {
        lastError = error as Error

        if (attempt === retryConfig.maxRetries) {
          throw lastError
        }

        // 计算延迟时间（指数退避）
        const delay = Math.min(
          retryConfig.baseDelay * Math.pow(retryConfig.backoffMultiplier, attempt),
          retryConfig.maxDelay
        )

        console.warn(`操作失败，${delay}ms后重试 (${attempt + 1}/${retryConfig.maxRetries}):`, error)
        await this.sleep(delay)
      }
    }

    throw lastError!
  }

  // 获取错误建议
  getErrorSuggestions(error: Error): string[] {
    const errorCode = this.classifyError(error).code
    const suggestions: string[] = []

    switch (errorCode) {
      case ErrorCode.CONNECTION_TIMEOUT:
        suggestions.push('检查网络连接是否正常')
        suggestions.push('尝试增加超时时间设置')
        suggestions.push('检查目标服务器是否可访问')
        break
      case ErrorCode.AUTHENTICATION_FAILED:
        suggestions.push('检查认证凭据是否正确')
        suggestions.push('确认API密钥是否有效')
        suggestions.push('检查权限设置')
        break
      case ErrorCode.RATE_LIMIT_EXCEEDED:
        suggestions.push('减少请求频率')
        suggestions.push('检查API配额限制')
        suggestions.push('考虑使用缓存减少请求')
        break
      default:
        suggestions.push('检查配置是否正确')
        suggestions.push('查看详细错误日志')
        suggestions.push('联系技术支持')
    }

    return suggestions
  }

  // 错误分类
  private classifyError(error: Error): { type: ErrorType; code: ErrorCode } {
    if (error.message.includes('timeout')) {
      return { type: ErrorType.NETWORK_ERROR, code: ErrorCode.CONNECTION_TIMEOUT }
    }
    if (error.message.includes('authentication')) {
      return { type: ErrorType.AUTHENTICATION_ERROR, code: ErrorCode.AUTHENTICATION_FAILED }
    }
    if (error.message.includes('rate limit')) {
      return { type: ErrorType.RATE_LIMIT_ERROR, code: ErrorCode.RATE_LIMIT_EXCEEDED }
    }
    return { type: ErrorType.SYSTEM_ERROR, code: ErrorCode.UNKNOWN_ERROR }
  }

  // 获取上下文相关的错误处理策略
  private getContextualStrategy(error: Error, context: ErrorContext): ErrorStrategy {
    // 在开发环境中提供更详细的错误信息
    if (context.environment === 'development') {
      return new DevelopmentErrorStrategy()
    }

    // 在生产环境中提供用户友好的错误信息
    if (context.environment === 'production') {
      return new ProductionErrorStrategy()
    }

    return this.errorStrategies.get(this.classifyError(error).type) || this.defaultStrategy
  }

  // 初始化错误策略
  private initializeErrorStrategies(): void {
    this.errorStrategies.set(ErrorType.NETWORK_ERROR, new NetworkErrorStrategy())
    this.errorStrategies.set(ErrorType.AUTHENTICATION_ERROR, new AuthenticationErrorStrategy())
    this.errorStrategies.set(ErrorType.RATE_LIMIT_ERROR, new RateLimitErrorStrategy())
    this.errorStrategies.set(ErrorType.DATA_ERROR, new DataErrorStrategy())
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  private defaultStrategy: ErrorStrategy = {
    resolve: async (error: Error) => ({
      resolved: false,
      action: 'require_user_action',
      message: `系统错误: ${error.message}`
    })
  }
}

// 开发环境错误策略
class DevelopmentErrorStrategy implements ErrorStrategy {
  async resolve(error: Error, context: ErrorContext): Promise<ErrorResolution> {
    return {
      resolved: false,
      action: 'require_user_action',
      message: `开发环境错误: ${error.message}\n代码: ${error.name}\n堆栈: ${error.stack}`,
      metadata: {
        detailedError: error,
        context: context
      }
    }
  }
}

// 生产环境错误策略
class ProductionErrorStrategy implements ErrorStrategy {
  async resolve(error: Error, context: ErrorContext): Promise<ErrorResolution> {
    // 根据用户角色提供不同的错误信息
    const message =
      context.userRole === 'admin'
        ? `系统错误: ${error.message} (错误代码: ${error.name})`
        : '系统暂时不可用，请稍后重试'

    return {
      resolved: false,
      action: 'require_user_action',
      message: message,
      metadata: {
        errorCode: error.name,
        timestamp: context.timestamp
      }
    }
  }
}

// 网络错误策略
class NetworkErrorStrategy implements ErrorStrategy {
  async resolve(error: Error): Promise<ErrorResolution> {
    return {
      resolved: false,
      action: 'retry',
      delay: 5000,
      message: '网络连接错误，将在5秒后重试'
    }
  }
}

// 认证错误策略
class AuthenticationErrorStrategy implements ErrorStrategy {
  async resolve(error: Error): Promise<ErrorResolution> {
    return {
      resolved: false,
      action: 'require_user_action',
      message: '认证失败，请检查凭据配置'
    }
  }
}

// 限流错误策略
class RateLimitErrorStrategy implements ErrorStrategy {
  async resolve(error: Error): Promise<ErrorResolution> {
    return {
      resolved: false,
      action: 'retry',
      delay: 30000,
      message: '请求频率超限，将在30秒后重试'
    }
  }
}

// 数据错误策略
class DataErrorStrategy implements ErrorStrategy {
  async resolve(error: Error): Promise<ErrorResolution> {
    return {
      resolved: false,
      action: 'require_user_action',
      message: '数据格式错误，请检查数据源配置'
    }
  }
}
