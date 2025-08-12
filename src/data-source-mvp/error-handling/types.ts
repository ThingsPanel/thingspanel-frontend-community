// 错误类型枚举
export enum ErrorType {
  CONFIG_ERROR = 'config_error',
  NETWORK_ERROR = 'network_error',
  DATA_ERROR = 'data_error',
  SYSTEM_ERROR = 'system_error',
  AUTHENTICATION_ERROR = 'authentication_error',
  RATE_LIMIT_ERROR = 'rate_limit_error'
}

// 错误代码枚举
export enum ErrorCode {
  // 配置错误
  INVALID_JSON = 'INVALID_JSON',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  INVALID_URL = 'INVALID_URL',
  INVALID_CONFIG_FORMAT = 'INVALID_CONFIG_FORMAT',

  // 网络错误
  CONNECTION_TIMEOUT = 'CONNECTION_TIMEOUT',
  CONNECTION_REFUSED = 'CONNECTION_REFUSED',
  HTTP_ERROR = 'HTTP_ERROR',
  CORS_ERROR = 'CORS_ERROR',
  DNS_RESOLUTION_ERROR = 'DNS_RESOLUTION_ERROR',

  // 数据错误
  DATA_PATH_NOT_FOUND = 'DATA_PATH_NOT_FOUND',
  DATA_TYPE_MISMATCH = 'DATA_TYPE_MISMATCH',
  DATA_TRANSFORM_ERROR = 'DATA_TRANSFORM_ERROR',
  DATA_VALIDATION_ERROR = 'DATA_VALIDATION_ERROR',

  // 认证错误
  AUTHENTICATION_FAILED = 'AUTHENTICATION_FAILED',
  AUTHORIZATION_FAILED = 'AUTHORIZATION_FAILED',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',

  // 限流错误
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',

  // 系统错误
  MEMORY_ERROR = 'MEMORY_ERROR',
  COMPONENT_LOAD_ERROR = 'COMPONENT_LOAD_ERROR',
  BINDING_CONFLICT = 'BINDING_CONFLICT',
  CACHE_ERROR = 'CACHE_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

// 错误上下文接口
export interface ErrorContext {
  environment: 'development' | 'production' | 'testing'
  userRole: 'admin' | 'user' | 'developer'
  operation: string
  timestamp: number
  metadata?: Record<string, any>
}

// 错误策略接口
export interface ErrorStrategy {
  resolve(error: Error, context: ErrorContext): Promise<ErrorResolution>
}

// 错误解决结果
export interface ErrorResolution {
  resolved: boolean
  action: 'retry' | 'require_user_action' | 'fallback' | 'abort'
  delay?: number
  message: string
  metadata?: Record<string, any>
}

// 错误信息接口
export interface ErrorInfo {
  type: ErrorType
  code: ErrorCode
  message: string
  context: string
  timestamp: number
  suggestions: string[]
}

// 恢复动作接口
export interface RecoveryAction {
  action: string
  description: string
  execute: () => Promise<void>
}
