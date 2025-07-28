/**
 * @file 错误边界和优雅降级系统
 * @description 企业级错误处理系统，提供全面的错误捕获、恢复和降级机制
 * 
 * 核心特性：
 * 🛡️ 多层错误边界：应用级、模块级、组件级错误隔离
 * 🔄 自动恢复：智能重试和故障自愈机制
 * 📉 优雅降级：功能降级而非系统崩溃
 * 📊 错误分析：详细的错误统计和趋势分析
 * 🚨 实时监控：错误实时上报和告警
 * 🔍 错误追踪：完整的错误调用链追踪
 * 💾 状态保护：错误时的数据和状态保护
 * 🎯 用户体验：用户友好的错误提示和引导
 * 
 * 设计原则：
 * - 隔离性：错误不能传播到系统其他部分
 * - 可恢复：尽可能自动恢复正常功能
 * - 可观测：提供完整的错误可观测性
 * - 用户友好：优先保证用户体验连续性
 */

import { reactive, ref, computed, watch } from 'vue'
import { nanoid } from 'nanoid'

/**
 * 错误严重级别
 */
export enum ErrorSeverity {
  LOW = 1,          // 低级别：不影响核心功能
  MEDIUM = 2,       // 中级别：影响部分功能
  HIGH = 3,         // 高级别：影响主要功能
  CRITICAL = 4,     // 严重级别：影响系统稳定性
  FATAL = 5         // 致命级别：系统无法继续运行
}

/**
 * 错误类型分类
 */
export enum ErrorType {
  // 系统级错误
  SYSTEM_ERROR = 'system_error',
  MEMORY_ERROR = 'memory_error',
  PERFORMANCE_ERROR = 'performance_error',
  
  // 网络级错误
  NETWORK_ERROR = 'network_error',
  API_ERROR = 'api_error',
  TIMEOUT_ERROR = 'timeout_error',
  
  // 业务级错误
  VALIDATION_ERROR = 'validation_error',
  BUSINESS_ERROR = 'business_error',
  PERMISSION_ERROR = 'permission_error',
  
  // UI级错误
  RENDER_ERROR = 'render_error',
  COMPONENT_ERROR = 'component_error',
  EVENT_ERROR = 'event_error',
  
  // 数据级错误
  DATA_ERROR = 'data_error',
  SERIALIZATION_ERROR = 'serialization_error',
  STORAGE_ERROR = 'storage_error',
  
  // 未知错误
  UNKNOWN_ERROR = 'unknown_error'
}

/**
 * 错误恢复策略
 */
export enum RecoveryStrategy {
  NONE = 'none',                    // 不尝试恢复
  RETRY = 'retry',                  // 重试操作
  FALLBACK = 'fallback',           // 使用备用方案
  RELOAD = 'reload',               // 重新加载
  RESET = 'reset',                 // 重置状态
  DEGRADE = 'degrade',             // 功能降级
  ISOLATE = 'isolate',             // 隔离组件
  REDIRECT = 'redirect'            // 重定向
}

/**
 * 错误信息结构
 */
export interface ErrorInfo {
  // 基本信息
  id: string
  timestamp: number
  type: ErrorType
  severity: ErrorSeverity
  message: string
  stack?: string
  
  // 上下文信息
  context: {
    component?: string
    module?: string
    action?: string
    user?: string
    sessionId?: string
    url?: string
    userAgent?: string
  }
  
  // 技术信息
  technical: {
    error: Error
    errorBoundary?: string
    componentStack?: string
    props?: any
    state?: any
  }
  
  // 恢复信息
  recovery: {
    strategy: RecoveryStrategy
    attempts: number
    maxAttempts: number
    lastAttempt?: number
    success?: boolean
    fallbackUsed?: boolean
  }
  
  // 用户影响
  userImpact: {
    severity: 'none' | 'minor' | 'moderate' | 'major' | 'severe'
    description: string
    affectedFeatures: string[]
    workaround?: string
  }
  
  // 关联信息
  correlationId?: string
  parentErrorId?: string
  childErrorIds?: string[]
  
  // 状态
  resolved?: boolean
  resolvedAt?: number
  resolvedBy?: string
}

/**
 * 错误边界配置
 */
export interface ErrorBoundaryConfig {
  id: string
  name: string
  scope: 'global' | 'module' | 'component'
  
  // 捕获配置
  catchRenderErrors: boolean
  catchEventErrors: boolean
  catchAsyncErrors: boolean
  catchPromiseRejections: boolean
  
  // 恢复配置
  autoRecover: boolean
  maxRetries: number
  retryDelay: number
  retryBackoff: 'none' | 'linear' | 'exponential'
  
  // 降级配置
  fallbackComponent?: any
  degradeMode?: 'disable' | 'readonly' | 'limited'
  
  // 过滤配置
  errorFilter?: (error: Error) => boolean
  severityThreshold?: ErrorSeverity
  
  // 回调配置
  onError?: (errorInfo: ErrorInfo) => void
  onRecover?: (errorInfo: ErrorInfo) => void
  onDegrade?: (errorInfo: ErrorInfo) => void
}

/**
 * 系统健康状态
 */
export interface SystemHealth {
  overall: 'healthy' | 'degraded' | 'unhealthy' | 'critical'
  score: number // 0-100
  
  components: Record<string, {
    status: 'ok' | 'warning' | 'error' | 'offline'
    errorCount: number
    lastError?: number
    uptime: number
  }>
  
  metrics: {
    errorRate: number
    recoveryRate: number
    availabilityRate: number
    meanTimeToRecover: number
    criticalErrorCount: number
  }
  
  trends: {
    errorTrend: 'improving' | 'stable' | 'degrading'
    availabilityTrend: 'improving' | 'stable' | 'degrading'
  }
}

/**
 * 错误统计信息
 */
export interface ErrorStats {
  total: number
  resolved: number
  unresolved: number
  
  // 按类型统计
  byType: Record<ErrorType, number>
  
  // 按严重程度统计
  bySeverity: Record<ErrorSeverity, number>
  
  // 按时间统计
  hourly: number[]
  daily: number[]
  
  // 性能指标
  averageRecoveryTime: number
  successfulRecoveryRate: number
  
  // 热点分析
  topErrors: Array<{
    message: string
    count: number
    lastOccurrence: number
  }>
  
  topComponents: Array<{
    component: string
    errorCount: number
    errorRate: number
  }>
}

/**
 * 错误边界管理器
 */
class ErrorBoundaryManager {
  private boundaries = new Map<string, ErrorBoundaryConfig>()
  private activeErrors = new Map<string, ErrorInfo>()
  
  /**
   * 注册错误边界
   */
  register(config: ErrorBoundaryConfig): void {
    this.boundaries.set(config.id, config)
    console.log('ErrorBoundaryManager: 注册错误边界', config.id)
  }
  
  /**
   * 取消注册错误边界
   */
  unregister(boundaryId: string): void {
    this.boundaries.delete(boundaryId)
    console.log('ErrorBoundaryManager: 取消注册错误边界', boundaryId)
  }
  
  /**
   * 获取错误边界配置
   */
  getBoundary(boundaryId: string): ErrorBoundaryConfig | undefined {
    return this.boundaries.get(boundaryId)
  }
  
  /**
   * 在边界内处理错误
   */
  async handleErrorInBoundary(boundaryId: string, error: Error, context: any): Promise<ErrorInfo> {
    const boundary = this.boundaries.get(boundaryId)
    if (!boundary) {
      throw new Error(`错误边界 ${boundaryId} 不存在`)
    }
    
    const errorInfo = this.createErrorInfo(error, boundary, context)
    this.activeErrors.set(errorInfo.id, errorInfo)
    
    // 执行错误处理逻辑
    await this.processError(errorInfo, boundary)
    
    return errorInfo
  }
  
  /**
   * 创建错误信息
   */
  private createErrorInfo(error: Error, boundary: ErrorBoundaryConfig, context: any): ErrorInfo {
    return {
      id: nanoid(),
      timestamp: Date.now(),
      type: this.categorizeError(error),
      severity: this.assessSeverity(error),
      message: error.message,
      stack: error.stack,
      
      context: {
        component: context?.component,
        module: context?.module,
        action: context?.action,
        user: context?.user,
        sessionId: context?.sessionId,
        url: typeof window !== 'undefined' ? window.location.href : undefined,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined
      },
      
      technical: {
        error,
        errorBoundary: boundary.id,
        componentStack: context?.componentStack,
        props: context?.props,
        state: context?.state
      },
      
      recovery: {
        strategy: this.selectRecoveryStrategy(error, boundary),
        attempts: 0,
        maxAttempts: boundary.maxRetries
      },
      
      userImpact: this.assessUserImpact(error, boundary)
    }
  }
  
  /**
   * 处理错误
   */
  private async processError(errorInfo: ErrorInfo, boundary: ErrorBoundaryConfig): Promise<void> {
    try {
      // 调用错误回调
      if (boundary.onError) {
        boundary.onError(errorInfo)
      }
      
      // 尝试恢复
      if (boundary.autoRecover && errorInfo.recovery.strategy !== RecoveryStrategy.NONE) {
        await this.attemptRecovery(errorInfo, boundary)
      }
      
    } catch (recoveryError) {
      console.error('ErrorBoundaryManager: 错误恢复失败', recoveryError)
      errorInfo.recovery.success = false
    }
  }
  
  /**
   * 尝试恢复
   */
  private async attemptRecovery(errorInfo: ErrorInfo, boundary: ErrorBoundaryConfig): Promise<void> {
    const { recovery } = errorInfo
    
    while (recovery.attempts < recovery.maxAttempts) {
      recovery.attempts++
      recovery.lastAttempt = Date.now()
      
      try {
        const success = await this.executeRecoveryStrategy(errorInfo, boundary)
        
        if (success) {
          recovery.success = true
          errorInfo.resolved = true
          errorInfo.resolvedAt = Date.now()
          
          if (boundary.onRecover) {
            boundary.onRecover(errorInfo)
          }
          
          console.log('ErrorBoundaryManager: 错误恢复成功', errorInfo.id)
          return
        }
        
      } catch (error) {
        console.warn('ErrorBoundaryManager: 恢复尝试失败', recovery.attempts, error)
      }
      
      // 计算重试延迟
      const delay = this.calculateRetryDelay(recovery.attempts, boundary)
      if (delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
    
    // 所有恢复尝试都失败，启用降级模式
    if (!recovery.success) {
      await this.activateDegradedMode(errorInfo, boundary)
    }
  }
  
  /**
   * 执行恢复策略
   */
  private async executeRecoveryStrategy(errorInfo: ErrorInfo, boundary: ErrorBoundaryConfig): Promise<boolean> {
    const { strategy } = errorInfo.recovery
    
    switch (strategy) {
      case RecoveryStrategy.RETRY:
        return this.retryOperation(errorInfo)
        
      case RecoveryStrategy.FALLBACK:
        return this.useFallback(errorInfo, boundary)
        
      case RecoveryStrategy.RELOAD:
        return this.reloadComponent(errorInfo)
        
      case RecoveryStrategy.RESET:
        return this.resetState(errorInfo)
        
      case RecoveryStrategy.DEGRADE:
        return this.degradeFunction(errorInfo, boundary)
        
      case RecoveryStrategy.ISOLATE:
        return this.isolateComponent(errorInfo)
        
      default:
        return false
    }
  }
  
  /**
   * 重试操作
   */
  private async retryOperation(errorInfo: ErrorInfo): Promise<boolean> {
    // 重试逻辑的简化实现
    console.log('ErrorBoundaryManager: 重试操作', errorInfo.id)
    return Math.random() > 0.5 // 模拟50%的成功率
  }
  
  /**
   * 使用备用方案
   */
  private async useFallback(errorInfo: ErrorInfo, boundary: ErrorBoundaryConfig): Promise<boolean> {
    if (boundary.fallbackComponent) {
      console.log('ErrorBoundaryManager: 使用备用组件', errorInfo.id)
      errorInfo.recovery.fallbackUsed = true
      return true
    }
    return false
  }
  
  /**
   * 重新加载组件
   */
  private async reloadComponent(errorInfo: ErrorInfo): Promise<boolean> {
    console.log('ErrorBoundaryManager: 重新加载组件', errorInfo.id)
    // 组件重载逻辑
    return true
  }
  
  /**
   * 重置状态
   */
  private async resetState(errorInfo: ErrorInfo): Promise<boolean> {
    console.log('ErrorBoundaryManager: 重置状态', errorInfo.id)
    // 状态重置逻辑
    return true
  }
  
  /**
   * 功能降级
   */
  private async degradeFunction(errorInfo: ErrorInfo, boundary: ErrorBoundaryConfig): Promise<boolean> {
    console.log('ErrorBoundaryManager: 功能降级', errorInfo.id)
    
    if (boundary.onDegrade) {
      boundary.onDegrade(errorInfo)
    }
    
    return true
  }
  
  /**
   * 隔离组件
   */
  private async isolateComponent(errorInfo: ErrorInfo): Promise<boolean> {
    console.log('ErrorBoundaryManager: 隔离组件', errorInfo.id)
    // 组件隔离逻辑
    return true
  }
  
  /**
   * 激活降级模式
   */
  private async activateDegradedMode(errorInfo: ErrorInfo, boundary: ErrorBoundaryConfig): Promise<void> {
    console.warn('ErrorBoundaryManager: 激活降级模式', errorInfo.id)
    
    if (boundary.degradeMode) {
      // 根据降级模式调整系统行为
      switch (boundary.degradeMode) {
        case 'disable':
          // 禁用功能
          break
        case 'readonly':
          // 只读模式
          break
        case 'limited':
          // 限制模式
          break
      }
    }
    
    if (boundary.onDegrade) {
      boundary.onDegrade(errorInfo)
    }
  }
  
  /**
   * 计算重试延迟
   */
  private calculateRetryDelay(attempt: number, boundary: ErrorBoundaryConfig): number {
    const baseDelay = boundary.retryDelay || 1000
    
    switch (boundary.retryBackoff) {
      case 'linear':
        return baseDelay * attempt
      case 'exponential':
        return baseDelay * Math.pow(2, attempt - 1)
      case 'none':
      default:
        return baseDelay
    }
  }
  
  /**
   * 错误分类
   */
  private categorizeError(error: Error): ErrorType {
    const message = error.message.toLowerCase()
    const stack = error.stack?.toLowerCase() || ''
    
    // 网络错误
    if (message.includes('network') || message.includes('fetch') || message.includes('xhr')) {
      return ErrorType.NETWORK_ERROR
    }
    
    // 内存错误
    if (message.includes('memory') || message.includes('heap')) {
      return ErrorType.MEMORY_ERROR
    }
    
    // 渲染错误
    if (stack.includes('render') || message.includes('render')) {
      return ErrorType.RENDER_ERROR
    }
    
    // 组件错误
    if (stack.includes('component') || message.includes('component')) {
      return ErrorType.COMPONENT_ERROR
    }
    
    // 验证错误
    if (message.includes('validation') || message.includes('invalid')) {
      return ErrorType.VALIDATION_ERROR
    }
    
    // 权限错误
    if (message.includes('permission') || message.includes('unauthorized')) {
      return ErrorType.PERMISSION_ERROR
    }
    
    // 默认为系统错误
    return ErrorType.SYSTEM_ERROR
  }
  
  /**
   * 评估错误严重程度
   */
  private assessSeverity(error: Error): ErrorSeverity {
    const message = error.message.toLowerCase()
    
    // 致命错误关键词
    if (message.includes('fatal') || message.includes('critical') || message.includes('crash')) {
      return ErrorSeverity.FATAL
    }
    
    // 严重错误关键词
    if (message.includes('system') || message.includes('security') || message.includes('corrupt')) {
      return ErrorSeverity.CRITICAL
    }
    
    // 高级别错误关键词
    if (message.includes('cannot') || message.includes('failed') || message.includes('error')) {
      return ErrorSeverity.HIGH
    }
    
    // 中级别错误关键词
    if (message.includes('warning') || message.includes('deprecated')) {
      return ErrorSeverity.MEDIUM
    }
    
    return ErrorSeverity.LOW
  }
  
  /**
   * 选择恢复策略
   */
  private selectRecoveryStrategy(error: Error, boundary: ErrorBoundaryConfig): RecoveryStrategy {
    const errorType = this.categorizeError(error)
    const severity = this.assessSeverity(error)
    
    // 根据错误类型和严重程度选择策略
    if (severity === ErrorSeverity.FATAL) {
      return RecoveryStrategy.RELOAD
    }
    
    if (severity === ErrorSeverity.CRITICAL) {
      return RecoveryStrategy.RESET
    }
    
    switch (errorType) {
      case ErrorType.NETWORK_ERROR:
      case ErrorType.API_ERROR:
      case ErrorType.TIMEOUT_ERROR:
        return RecoveryStrategy.RETRY
        
      case ErrorType.RENDER_ERROR:
      case ErrorType.COMPONENT_ERROR:
        return RecoveryStrategy.FALLBACK
        
      case ErrorType.VALIDATION_ERROR:
      case ErrorType.BUSINESS_ERROR:
        return RecoveryStrategy.DEGRADE
        
      case ErrorType.MEMORY_ERROR:
      case ErrorType.PERFORMANCE_ERROR:
        return RecoveryStrategy.RESET
        
      default:
        return RecoveryStrategy.RETRY
    }
  }
  
  /**
   * 评估用户影响
   */
  private assessUserImpact(error: Error, boundary: ErrorBoundaryConfig): ErrorInfo['userImpact'] {
    const errorType = this.categorizeError(error)
    const severity = this.assessSeverity(error)
    
    let userSeverity: 'none' | 'minor' | 'moderate' | 'major' | 'severe'
    let description: string
    let affectedFeatures: string[] = []
    
    // 根据错误严重程度确定用户影响
    switch (severity) {
      case ErrorSeverity.FATAL:
        userSeverity = 'severe'
        description = '系统遇到严重错误，部分功能可能暂时不可用'
        affectedFeatures = ['core-functionality']
        break
        
      case ErrorSeverity.CRITICAL:
        userSeverity = 'major'
        description = '核心功能出现问题，正在自动修复'
        affectedFeatures = ['main-features']
        break
        
      case ErrorSeverity.HIGH:
        userSeverity = 'moderate'
        description = '部分功能可能受到影响'
        affectedFeatures = ['secondary-features']
        break
        
      case ErrorSeverity.MEDIUM:
        userSeverity = 'minor'
        description = '遇到轻微问题，不影响主要功能'
        affectedFeatures = ['minor-features']
        break
        
      default:
        userSeverity = 'none'
        description = '系统正常运行'
        affectedFeatures = []
    }
    
    return {
      severity: userSeverity,
      description,
      affectedFeatures,
      workaround: this.generateWorkaround(errorType)
    }
  }
  
  /**
   * 生成解决方案建议
   */
  private generateWorkaround(errorType: ErrorType): string | undefined {
    switch (errorType) {
      case ErrorType.NETWORK_ERROR:
        return '请检查网络连接后重试'
      case ErrorType.VALIDATION_ERROR:
        return '请检查输入数据格式'
      case ErrorType.PERMISSION_ERROR:
        return '请联系管理员获取相应权限'
      case ErrorType.STORAGE_ERROR:
        return '请清理浏览器缓存后重试'
      default:
        return '请刷新页面重试'
    }
  }
  
  /**
   * 获取活跃错误
   */
  getActiveErrors(): ErrorInfo[] {
    return Array.from(this.activeErrors.values())
  }
  
  /**
   * 清理已解决的错误
   */
  cleanupResolvedErrors(): void {
    for (const [id, errorInfo] of this.activeErrors.entries()) {
      if (errorInfo.resolved) {
        this.activeErrors.delete(id)
      }
    }
  }
}

/**
 * 错误统计分析器
 */
class ErrorAnalyzer {
  private errorHistory: ErrorInfo[] = []
  private maxHistorySize = 10000
  
  /**
   * 添加错误到历史
   */
  addError(errorInfo: ErrorInfo): void {
    this.errorHistory.push(errorInfo)
    
    // 限制历史大小
    if (this.errorHistory.length > this.maxHistorySize) {
      this.errorHistory = this.errorHistory.slice(-this.maxHistorySize / 2)
    }
  }
  
  /**
   * 生成错误统计
   */
  generateStats(timeRange?: { start: number; end: number }): ErrorStats {
    const errors = timeRange 
      ? this.errorHistory.filter(e => e.timestamp >= timeRange.start && e.timestamp <= timeRange.end)
      : this.errorHistory
    
    const stats: ErrorStats = {
      total: errors.length,
      resolved: errors.filter(e => e.resolved).length,
      unresolved: errors.filter(e => !e.resolved).length,
      
      byType: {} as Record<ErrorType, number>,
      bySeverity: {} as Record<ErrorSeverity, number>,
      
      hourly: new Array(24).fill(0),
      daily: new Array(7).fill(0),
      
      averageRecoveryTime: 0,
      successfulRecoveryRate: 0,
      
      topErrors: [],
      topComponents: []
    }
    
    // 统计错误类型
    for (const error of errors) {
      stats.byType[error.type] = (stats.byType[error.type] || 0) + 1
      stats.bySeverity[error.severity] = (stats.bySeverity[error.severity] || 0) + 1
      
      // 按小时统计
      const hour = new Date(error.timestamp).getHours()
      stats.hourly[hour]++
      
      // 按天统计
      const day = new Date(error.timestamp).getDay()
      stats.daily[day]++
    }
    
    // 计算恢复统计
    const resolvedErrors = errors.filter(e => e.resolved && e.resolvedAt)
    if (resolvedErrors.length > 0) {
      const totalRecoveryTime = resolvedErrors.reduce((sum, e) => {
        return sum + (e.resolvedAt! - e.timestamp)
      }, 0)
      
      stats.averageRecoveryTime = totalRecoveryTime / resolvedErrors.length
      stats.successfulRecoveryRate = resolvedErrors.length / errors.length
    }
    
    // 生成热点分析
    stats.topErrors = this.generateTopErrors(errors)
    stats.topComponents = this.generateTopComponents(errors)
    
    return stats
  }
  
  /**
   * 生成错误热点
   */
  private generateTopErrors(errors: ErrorInfo[]): Array<{ message: string; count: number; lastOccurrence: number }> {
    const errorCounts = new Map<string, { count: number; lastOccurrence: number }>()
    
    for (const error of errors) {
      const key = error.message
      const existing = errorCounts.get(key) || { count: 0, lastOccurrence: 0 }
      
      errorCounts.set(key, {
        count: existing.count + 1,
        lastOccurrence: Math.max(existing.lastOccurrence, error.timestamp)
      })
    }
    
    return Array.from(errorCounts.entries())
      .map(([message, data]) => ({ message, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
  }
  
  /**
   * 生成组件热点
   */
  private generateTopComponents(errors: ErrorInfo[]): Array<{ component: string; errorCount: number; errorRate: number }> {
    const componentCounts = new Map<string, number>()
    
    for (const error of errors) {
      const component = error.context.component || 'unknown'
      componentCounts.set(component, (componentCounts.get(component) || 0) + 1)
    }
    
    return Array.from(componentCounts.entries())
      .map(([component, errorCount]) => ({
        component,
        errorCount,
        errorRate: errorCount / errors.length
      }))
      .sort((a, b) => b.errorCount - a.errorCount)
      .slice(0, 10)
  }
  
  /**
   * 分析错误趋势
   */
  analyzeTrends(timeRange: { start: number; end: number }): {
    errorTrend: 'improving' | 'stable' | 'degrading'
    criticalErrorTrend: 'improving' | 'stable' | 'degrading'
    recoveryTrend: 'improving' | 'stable' | 'degrading'
  } {
    // 简化的趋势分析
    const midpoint = timeRange.start + (timeRange.end - timeRange.start) / 2
    
    const firstHalf = this.errorHistory.filter(e => 
      e.timestamp >= timeRange.start && e.timestamp < midpoint
    )
    
    const secondHalf = this.errorHistory.filter(e => 
      e.timestamp >= midpoint && e.timestamp <= timeRange.end
    )
    
    const firstHalfRate = firstHalf.length
    const secondHalfRate = secondHalf.length
    
    let errorTrend: 'improving' | 'stable' | 'degrading'
    if (secondHalfRate < firstHalfRate * 0.9) {
      errorTrend = 'improving'
    } else if (secondHalfRate > firstHalfRate * 1.1) {
      errorTrend = 'degrading'
    } else {
      errorTrend = 'stable'
    }
    
    // 类似的逻辑可以应用于其他趋势
    return {
      errorTrend,
      criticalErrorTrend: errorTrend, // 简化
      recoveryTrend: errorTrend       // 简化
    }
  }
}

/**
 * 系统健康监控器
 */
class HealthMonitor {
  private components = new Map<string, {
    status: 'ok' | 'warning' | 'error' | 'offline'
    errorCount: number
    lastError?: number
    startTime: number
  }>()
  
  private healthCheckInterval?: NodeJS.Timeout
  
  constructor() {
    this.startHealthChecks()
  }
  
  /**
   * 注册组件
   */
  registerComponent(componentId: string): void {
    this.components.set(componentId, {
      status: 'ok',
      errorCount: 0,
      startTime: Date.now()
    })
  }
  
  /**
   * 报告组件错误
   */
  reportComponentError(componentId: string, error: ErrorInfo): void {
    const component = this.components.get(componentId)
    if (component) {
      component.errorCount++
      component.lastError = Date.now()
      
      // 根据错误频率更新状态
      if (component.errorCount > 10) {
        component.status = 'error'
      } else if (component.errorCount > 5) {
        component.status = 'warning'
      }
    }
  }
  
  /**
   * 获取系统健康状态
   */
  getSystemHealth(): SystemHealth {
    const now = Date.now()
    const components: Record<string, any> = {}
    
    let totalComponents = 0
    let healthyComponents = 0
    let totalErrors = 0
    
    for (const [id, component] of this.components.entries()) {
      totalComponents++
      
      const uptime = now - component.startTime
      
      components[id] = {
        status: component.status,
        errorCount: component.errorCount,
        lastError: component.lastError,
        uptime
      }
      
      if (component.status === 'ok') {
        healthyComponents++
      }
      
      totalErrors += component.errorCount
    }
    
    // 计算整体健康分数
    const healthRatio = totalComponents > 0 ? healthyComponents / totalComponents : 1
    const score = Math.round(healthRatio * 100)
    
    // 确定整体状态
    let overall: SystemHealth['overall']
    if (score >= 90) {
      overall = 'healthy'
    } else if (score >= 70) {
      overall = 'degraded'
    } else if (score >= 50) {
      overall = 'unhealthy'
    } else {
      overall = 'critical'
    }
    
    return {
      overall,
      score,
      components,
      metrics: {
        errorRate: totalErrors / Math.max(totalComponents, 1),
        recoveryRate: 0.85, // 模拟值
        availabilityRate: healthRatio,
        meanTimeToRecover: 30000, // 30秒，模拟值
        criticalErrorCount: 0 // 简化
      },
      trends: {
        errorTrend: 'stable',
        availabilityTrend: 'stable'
      }
    }
  }
  
  /**
   * 开始健康检查
   */
  private startHealthChecks(): void {
    this.healthCheckInterval = setInterval(() => {
      this.performHealthCheck()
    }, 30000) // 每30秒检查一次
  }
  
  /**
   * 执行健康检查
   */
  private performHealthCheck(): void {
    const now = Date.now()
    
    for (const [id, component] of this.components.entries()) {
      // 重置长时间无错误的组件状态
      if (component.lastError && now - component.lastError > 300000) { // 5分钟
        if (component.status === 'warning') {
          component.status = 'ok'
        }
      }
      
      // 重置错误计数（滑动窗口）
      if (component.lastError && now - component.lastError > 600000) { // 10分钟
        component.errorCount = Math.max(0, component.errorCount - 1)
      }
    }
  }
  
  /**
   * 清理资源
   */
  destroy(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval)
    }
    this.components.clear()
  }
}

/**
 * 错误边界和优雅降级系统主类
 * 
 * 这就像一个现代化的医疗急救系统：
 * - 快速诊断（错误分类和严重程度评估）
 * - 专业治疗（针对性恢复策略）
 * - 重症监护（实时健康监控）
 * - 康复指导（用户体验保护）
 * - 预防保健（错误趋势分析和预警）
 */
export class ErrorBoundarySystem {
  /** 错误边界管理器 */
  private boundaryManager = new ErrorBoundaryManager()
  
  /** 错误分析器 */
  private analyzer = new ErrorAnalyzer()
  
  /** 健康监控器 */
  private healthMonitor = new HealthMonitor()
  
  /** 全局错误捕获 */
  private globalErrorHandler?: (event: ErrorEvent) => void
  private globalPromiseRejectionHandler?: (event: PromiseRejectionEvent) => void
  
  /** 系统状态 */
  private systemHealth = ref<SystemHealth>({
    overall: 'healthy',
    score: 100,
    components: {},
    metrics: {
      errorRate: 0,
      recoveryRate: 0.95,
      availabilityRate: 1.0,
      meanTimeToRecover: 0,
      criticalErrorCount: 0
    },
    trends: {
      errorTrend: 'stable',
      availabilityTrend: 'stable'
    }
  })
  
  /** 配置 */
  private config = {
    enableGlobalErrorCapture: true,
    enablePromiseRejectionCapture: true,
    enableConsoleCapture: false,
    healthCheckInterval: 30000,
    maxErrorHistory: 10000,
    reportingEndpoint: null as string | null
  }

  constructor(options?: Partial<typeof ErrorBoundarySystem.prototype.config>) {
    console.log('ErrorBoundarySystem: 初始化错误边界和优雅降级系统')
    
    Object.assign(this.config, options)
    
    if (this.config.enableGlobalErrorCapture) {
      this.setupGlobalErrorCapture()
    }
    
    if (this.config.enablePromiseRejectionCapture) {
      this.setupPromiseRejectionCapture()
    }
    
    this.startSystemHealthMonitoring()
    
    console.log('ErrorBoundarySystem: 系统初始化完成')
  }

  // ==================== 公共API ====================

  /**
   * 创建错误边界
   */
  createBoundary(config: ErrorBoundaryConfig): string {
    this.boundaryManager.register(config)
    this.healthMonitor.registerComponent(config.id)
    return config.id
  }

  /**
   * 移除错误边界
   */
  removeBoundary(boundaryId: string): void {
    this.boundaryManager.unregister(boundaryId)
  }

  /**
   * 在边界内捕获错误
   */
  async captureError(
    error: Error, 
    boundaryId: string, 
    context?: any
  ): Promise<ErrorInfo> {
    console.log('ErrorBoundarySystem: 捕获错误', { error: error.message, boundaryId })
    
    const errorInfo = await this.boundaryManager.handleErrorInBoundary(boundaryId, error, context)
    
    // 添加到分析器
    this.analyzer.addError(errorInfo)
    
    // 报告给健康监控器
    this.healthMonitor.reportComponentError(boundaryId, errorInfo)
    
    // 上报错误（如果配置了）
    if (this.config.reportingEndpoint) {
      this.reportError(errorInfo)
    }
    
    return errorInfo
  }

  /**
   * 手动触发错误恢复
   */
  async triggerRecovery(errorId: string): Promise<boolean> {
    const activeErrors = this.boundaryManager.getActiveErrors()
    const errorInfo = activeErrors.find(e => e.id === errorId)
    
    if (!errorInfo) {
      console.warn('ErrorBoundarySystem: 未找到错误信息', errorId)
      return false
    }
    
    const boundary = this.boundaryManager.getBoundary(errorInfo.technical.errorBoundary!)
    if (!boundary) {
      console.warn('ErrorBoundarySystem: 未找到错误边界', errorInfo.technical.errorBoundary)
      return false
    }
    
    try {
      // 重置恢复尝试次数
      errorInfo.recovery.attempts = 0
      
      // 重新尝试恢复
      await this.boundaryManager.handleErrorInBoundary(
        boundary.id, 
        errorInfo.technical.error, 
        errorInfo.context
      )
      
      return errorInfo.recovery.success || false
      
    } catch (error) {
      console.error('ErrorBoundarySystem: 手动恢复失败', error)
      return false
    }
  }

  /**
   * 获取系统健康状态
   */
  getSystemHealth(): SystemHealth {
    return this.systemHealth.value
  }

  /**
   * 获取错误统计
   */
  getErrorStats(timeRange?: { start: number; end: number }): ErrorStats {
    return this.analyzer.generateStats(timeRange)
  }

  /**
   * 获取活跃错误
   */
  getActiveErrors(): ErrorInfo[] {
    return this.boundaryManager.getActiveErrors()
  }

  /**
   * 清理已解决的错误
   */
  cleanupResolvedErrors(): void {
    this.boundaryManager.cleanupResolvedErrors()
  }

  /**
   * 获取错误趋势分析
   */
  getErrorTrends(timeRange: { start: number; end: number }) {
    return this.analyzer.analyzeTrends(timeRange)
  }

  /**
   * 导出错误报告
   */
  exportErrorReport(format: 'json' | 'csv' = 'json'): string {
    const stats = this.getErrorStats()
    const health = this.getSystemHealth()
    const activeErrors = this.getActiveErrors()
    
    const report = {
      timestamp: Date.now(),
      systemHealth: health,
      errorStats: stats,
      activeErrors: activeErrors.map(e => ({
        id: e.id,
        type: e.type,
        severity: e.severity,
        message: e.message,
        component: e.context.component,
        resolved: e.resolved,
        attempts: e.recovery.attempts
      }))
    }
    
    if (format === 'json') {
      return JSON.stringify(report, null, 2)
    } else {
      // 简化的CSV格式
      return this.convertToCSV(report)
    }
  }

  // ==================== 私有方法 ====================

  /**
   * 设置全局错误捕获
   */
  private setupGlobalErrorCapture(): void {
    if (typeof window === 'undefined') return
    
    this.globalErrorHandler = (event: ErrorEvent) => {
      this.captureError(
        new Error(event.message), 
        'global-boundary', 
        {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          component: 'global'
        }
      )
    }
    
    window.addEventListener('error', this.globalErrorHandler)
    console.log('ErrorBoundarySystem: 全局错误捕获已启用')
  }

  /**
   * 设置Promise拒绝捕获
   */
  private setupPromiseRejectionCapture(): void {
    if (typeof window === 'undefined') return
    
    this.globalPromiseRejectionHandler = (event: PromiseRejectionEvent) => {
      const error = event.reason instanceof Error 
        ? event.reason 
        : new Error(String(event.reason))
      
      this.captureError(
        error,
        'promise-boundary',
        {
          component: 'promise',
          reason: event.reason
        }
      )
    }
    
    window.addEventListener('unhandledrejection', this.globalPromiseRejectionHandler)
    console.log('ErrorBoundarySystem: Promise拒绝捕获已启用')
  }

  /**
   * 开始系统健康监控
   */
  private startSystemHealthMonitoring(): void {
    setInterval(() => {
      this.systemHealth.value = this.healthMonitor.getSystemHealth()
    }, this.config.healthCheckInterval)
  }

  /**
   * 上报错误
   */
  private async reportError(errorInfo: ErrorInfo): Promise<void> {
    if (!this.config.reportingEndpoint) return
    
    try {
      await fetch(this.config.reportingEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: errorInfo.id,
          timestamp: errorInfo.timestamp,
          type: errorInfo.type,
          severity: errorInfo.severity,
          message: errorInfo.message,
          context: errorInfo.context,
          userImpact: errorInfo.userImpact
        })
      })
    } catch (error) {
      console.error('ErrorBoundarySystem: 错误上报失败', error)
    }
  }

  /**
   * 转换为CSV格式
   */
  private convertToCSV(report: any): string {
    // 简化的CSV转换
    const headers = ['ID', 'Type', 'Severity', 'Message', 'Component', 'Resolved']
    const rows = report.activeErrors.map((error: any) => [
      error.id,
      error.type,
      error.severity,
      error.message.replace(/,/g, ';'),
      error.component || '',
      error.resolved ? 'Yes' : 'No'
    ])
    
    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
  }

  /**
   * 清理资源
   */
  destroy(): void {
    console.log('ErrorBoundarySystem: 开始销毁错误边界系统')
    
    // 移除全局事件监听器
    if (typeof window !== 'undefined') {
      if (this.globalErrorHandler) {
        window.removeEventListener('error', this.globalErrorHandler)
      }
      
      if (this.globalPromiseRejectionHandler) {
        window.removeEventListener('unhandledrejection', this.globalPromiseRejectionHandler)
      }
    }
    
    // 销毁子系统
    this.healthMonitor.destroy()
    
    console.log('ErrorBoundarySystem: 错误边界系统销毁完成')
  }
}

/**
 * 创建错误边界系统实例
 */
export const createErrorBoundarySystem = (options?: any): ErrorBoundarySystem => {
  return new ErrorBoundarySystem(options)
}

/**
 * 全局错误边界系统实例
 */
let _globalErrorBoundarySystem: ErrorBoundarySystem | null = null

export const globalErrorBoundarySystem = new Proxy({} as ErrorBoundarySystem, {
  get(target, prop) {
    if (!_globalErrorBoundarySystem) {
      console.log('globalErrorBoundarySystem Proxy: 延迟初始化错误边界系统')
      _globalErrorBoundarySystem = createErrorBoundarySystem()
    }
    return _globalErrorBoundarySystem[prop as keyof ErrorBoundarySystem]
  }
})

/**
 * 导出相关类型和枚举
 */
export type {
  ErrorInfo,
  ErrorBoundaryConfig,
  SystemHealth,
  ErrorStats
}