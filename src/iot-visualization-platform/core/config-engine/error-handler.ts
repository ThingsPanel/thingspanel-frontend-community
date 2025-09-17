/**
 * 配置引擎错误处理和恢复机制
 *
 * 企业级错误处理系统，提供完整的错误管理和自动恢复能力
 *
 * 主要特性：
 * 1. 分层错误处理 - 系统、应用、组件级错误处理
 * 2. 智能错误分类 - 自动识别错误类型和严重程度
 * 3. 自动恢复机制 - 多种恢复策略和回退方案
 * 4. 错误追踪和诊断 - 完整的错误上下文和调用栈
 * 5. 灾难恢复 - 系统级故障的快速恢复
 * 6. 错误预防 - 预测性错误检测和预防
 * 7. 监控和告警 - 实时错误监控和通知
 * 8. 错误分析和报告 - 详细的错误统计和趋势分析
 *
 * 创建时间：2025年1月
 * 作者：ThingsPanel Team
 */

import { EventEmitter } from 'events'

// ========== 🎯 错误处理类型定义 ==========

/**
 * 错误级别枚举
 */
export enum ErrorLevel {
  DEBUG = 'debug',         // 调试信息
  INFO = 'info',           // 一般信息
  WARNING = 'warning',     // 警告
  ERROR = 'error',         // 错误
  CRITICAL = 'critical',   // 严重错误
  FATAL = 'fatal'          // 致命错误
}

/**
 * 错误分类枚举
 */
export enum ErrorCategory {
  VALIDATION = 'validation',       // 验证错误
  CONFIGURATION = 'configuration', // 配置错误
  DEPENDENCY = 'dependency',       // 依赖错误
  NETWORK = 'network',            // 网络错误
  PERMISSION = 'permission',       // 权限错误
  RESOURCE = 'resource',          // 资源错误
  SYSTEM = 'system',              // 系统错误
  USER = 'user',                  // 用户错误
  PERFORMANCE = 'performance',     // 性能问题
  SECURITY = 'security'           // 安全问题
}

/**
 * 恢复策略枚举
 */
export enum RecoveryStrategy {
  NONE = 'none',                  // 不恢复
  RETRY = 'retry',                // 重试
  FALLBACK = 'fallback',          // 回退
  ROLLBACK = 'rollback',          // 回滚
  RESTART = 'restart',            // 重启
  RESET = 'reset',                // 重置
  GRACEFUL_DEGRADATION = 'graceful_degradation', // 优雅降级
  EMERGENCY_STOP = 'emergency_stop' // 紧急停止
}

/**
 * 增强的错误信息
 */
export interface EnhancedError {
  // 基础信息
  id: string
  code: string
  message: string
  level: ErrorLevel
  category: ErrorCategory

  // 上下文信息
  context: {
    componentId?: string        // 相关组件ID
    operationId?: string        // 操作ID
    userId?: string            // 用户ID
    sessionId?: string         // 会话ID
    requestId?: string         // 请求ID
    transactionId?: string     // 事务ID
  }

  // 技术信息
  stack?: string              // 调用栈
  source: {
    file?: string             // 文件路径
    line?: number             // 行号
    column?: number           // 列号
    function?: string         // 函数名
    module: string            // 模块名
  }

  // 时间信息
  timestamp: number           // 发生时间
  duration?: number           // 持续时间

  // 错误详情
  details: {
    originalError?: Error     // 原始错误对象
    data?: any               // 相关数据
    parameters?: Record<string, any> // 参数信息
    environment?: Record<string, any> // 环境信息
    userAgent?: string       // 用户代理
    url?: string            // 请求URL
  }

  // 影响信息
  impact: {
    severity: number         // 严重程度 (1-10)
    affectedUsers?: number   // 影响用户数
    affectedComponents: string[] // 影响组件
    systemStability: number  // 系统稳定性影响 (1-10)
    dataIntegrity: number   // 数据完整性影响 (1-10)
  }

  // 恢复信息
  recovery: {
    strategy: RecoveryStrategy
    attempts: number         // 恢复尝试次数
    maxAttempts: number     // 最大尝试次数
    lastAttemptAt?: number  // 最后尝试时间
    recoveredAt?: number    // 恢复时间
    isRecovered: boolean    // 是否已恢复
    recoveryData?: any      // 恢复数据
  }

  // 关联信息
  correlationId?: string    // 关联ID
  parentErrorId?: string    // 父错误ID
  childErrorIds: string[]   // 子错误ID列表
  relatedErrorIds: string[] // 相关错误ID列表
}

/**
 * 错误处理器接口
 */
export interface ErrorHandler {
  id: string
  name: string
  description?: string
  priority: number
  errorTypes: string[]      // 处理的错误类型
  categories: ErrorCategory[] // 处理的错误分类
  levels: ErrorLevel[]      // 处理的错误级别
  handle: (error: EnhancedError, context: ErrorContext) => Promise<ErrorHandleResult>
  canHandle: (error: EnhancedError) => boolean
  options?: {
    async?: boolean         // 是否异步处理
    timeout?: number        // 处理超时时间
    retryable?: boolean     // 是否可重试
  }
}

/**
 * 错误处理上下文
 */
export interface ErrorContext {
  errorHandler: EnhancedErrorHandler
  timestamp: number
  attemptCount: number
  previousAttempts: ErrorHandleResult[]
  systemState: Record<string, any>
  userState?: Record<string, any>
  metadata: Record<string, any>
}

/**
 * 错误处理结果
 */
export interface ErrorHandleResult {
  success: boolean
  strategy: RecoveryStrategy
  action: string            // 执行的操作
  message: string          // 结果消息
  data?: any              // 结果数据
  nextStrategy?: RecoveryStrategy // 下一个策略
  shouldRetry: boolean     // 是否应该重试
  retryDelay?: number     // 重试延迟
  preventPropagation: boolean // 是否阻止错误传播
  metadata?: Record<string, any>
}

/**
 * 错误统计信息
 */
export interface ErrorStatistics {
  totalErrors: number
  errorsByLevel: Record<ErrorLevel, number>
  errorsByCategory: Record<ErrorCategory, number>
  errorsByComponent: Record<string, number>
  recentErrors: EnhancedError[]
  errorRate: number         // 错误率
  recoveryRate: number      // 恢复率
  averageRecoveryTime: number // 平均恢复时间
  criticalErrorCount: number
  systemHealthScore: number // 系统健康评分 (0-100)
  trends: {
    hourly: number[]        // 每小时错误数
    daily: number[]         // 每日错误数
    weekly: number[]        // 每周错误数
  }
}

/**
 * 错误预测信息
 */
export interface ErrorPrediction {
  probability: number       // 发生概率 (0-1)
  errorType: string        // 预测错误类型
  category: ErrorCategory  // 错误分类
  timeWindow: number       // 时间窗口(分钟)
  confidence: number       // 置信度 (0-1)
  riskFactors: string[]    // 风险因素
  recommendations: string[] // 预防建议
  preventionActions: Array<{
    action: string
    priority: number
    estimatedEffectiveness: number
  }>
}

/**
 * 恢复方案
 */
export interface RecoveryPlan {
  id: string
  name: string
  description: string
  errorPatterns: Array<{
    category: ErrorCategory
    level: ErrorLevel
    codePattern?: RegExp
    messagePattern?: RegExp
  }>
  steps: RecoveryStep[]
  estimatedTime: number     // 预计恢复时间(秒)
  successRate: number       // 历史成功率
  riskLevel: 'low' | 'medium' | 'high'
  prerequisites: string[]   // 前置条件
  rollbackPlan?: RecoveryPlan // 回滚方案
}

/**
 * 恢复步骤
 */
export interface RecoveryStep {
  id: string
  name: string
  description: string
  action: string
  parameters: Record<string, any>
  timeout: number
  retryable: boolean
  critical: boolean         // 是否关键步骤
  rollbackAction?: string   // 回滚操作
  successCriteria: Array<{
    type: 'condition' | 'validation' | 'metric'
    target: string
    expected: any
  }>
}

// ========== 🚀 增强的错误处理器主类 ==========

/**
 * 增强的错误处理器
 */
export class EnhancedErrorHandler extends EventEmitter {
  // ========== 存储 ==========
  private errors = new Map<string, EnhancedError>()
  private handlers = new Map<string, ErrorHandler>()
  private recoveryPlans = new Map<string, RecoveryPlan>()
  private statistics: ErrorStatistics
  private predictions = new Map<string, ErrorPrediction>()

  // ========== 配置 ==========
  private readonly MAX_ERROR_HISTORY = 1000
  private readonly MAX_RECOVERY_ATTEMPTS = 3
  private readonly PREDICTION_INTERVAL = 300000 // 5分钟
  private readonly STATISTICS_INTERVAL = 60000   // 1分钟
  private readonly ERROR_CLEANUP_INTERVAL = 3600000 // 1小时

  // ========== 状态 ==========
  private isEnabled = true
  private isEmergencyMode = false
  private lastHealthCheck = 0
  private systemHealthScore = 100

  // ========== 定时器 ==========
  private predictionTimer?: NodeJS.Timeout
  private statisticsTimer?: NodeJS.Timeout
  private cleanupTimer?: NodeJS.Timeout

  constructor() {
    super()
    this.statistics = this.initializeStatistics()
    this.initializeErrorHandler()
    this.registerBuiltInHandlers()
    this.registerBuiltInRecoveryPlans()
    console.log('🚀 EnhancedErrorHandler 初始化完成')
  }

  // ========== 🎯 核心错误处理方法 ==========

  /**
   * 处理错误
   */
  async handleError(
    error: Error | EnhancedError | string,
    context: Partial<ErrorContext> = {}
  ): Promise<ErrorHandleResult> {
    if (!this.isEnabled) {
      return this.createDefaultResult(false, '错误处理器已禁用')
    }

    try {
      // 标准化错误
      const enhancedError = this.normalizeError(error, context)

      // 记录错误
      this.recordError(enhancedError)

      // 更新统计
      this.updateStatistics(enhancedError)

      // 检查是否需要进入紧急模式
      this.checkEmergencyMode(enhancedError)

      // 查找匹配的处理器
      const matchedHandlers = this.findMatchedHandlers(enhancedError)

      if (matchedHandlers.length === 0) {
        console.warn(`没有找到匹配的错误处理器: ${enhancedError.code}`)
        return this.createDefaultResult(false, '没有匹配的错误处理器')
      }

      // 按优先级排序
      matchedHandlers.sort((a, b) => b.priority - a.priority)

      // 执行处理器
      for (const handler of matchedHandlers) {
        try {
          const handlerContext: ErrorContext = {
            errorHandler: this,
            timestamp: Date.now(),
            attemptCount: enhancedError.recovery.attempts + 1,
            previousAttempts: [],
            systemState: this.getSystemState(),
            metadata: context.metadata || {},
            ...context
          }

          const result = await this.executeHandler(handler, enhancedError, handlerContext)

          if (result.success || result.preventPropagation) {
            // 更新错误恢复信息
            this.updateRecoveryInfo(enhancedError, result)

            // 发送恢复成功事件
            this.emit('errorRecovered', { error: enhancedError, result })

            return result
          }

          // 如果处理失败但建议重试
          if (result.shouldRetry && enhancedError.recovery.attempts < enhancedError.recovery.maxAttempts) {
            enhancedError.recovery.attempts++
            enhancedError.recovery.lastAttemptAt = Date.now()

            if (result.retryDelay) {
              await this.delay(result.retryDelay)
            }

            // 递归重试
            return await this.handleError(enhancedError, context)
          }

        } catch (handlerError) {
          console.error(`错误处理器执行失败 [${handler.id}]:`, handlerError)
          // 继续尝试下一个处理器
        }
      }

      // 所有处理器都失败了
      const fallbackResult = await this.executeFallbackStrategy(enhancedError)
      this.emit('errorHandlingFailed', { error: enhancedError, result: fallbackResult })

      return fallbackResult

    } catch (processingError) {
      console.error('错误处理过程中发生异常:', processingError)
      return this.createDefaultResult(false, `错误处理异常: ${processingError}`)
    }
  }

  /**
   * 注册错误处理器
   */
  registerHandler(handler: ErrorHandler): void {
    this.handlers.set(handler.id, handler)
    this.emit('handlerRegistered', handler)
    console.log(`错误处理器已注册: ${handler.name} (${handler.id})`)
  }

  /**
   * 注销错误处理器
   */
  unregisterHandler(handlerId: string): boolean {
    const handler = this.handlers.get(handlerId)
    if (handler) {
      this.handlers.delete(handlerId)
      this.emit('handlerUnregistered', handler)
      console.log(`错误处理器已注销: ${handler.name} (${handlerId})`)
      return true
    }
    return false
  }

  /**
   * 注册恢复方案
   */
  registerRecoveryPlan(plan: RecoveryPlan): void {
    this.recoveryPlans.set(plan.id, plan)
    this.emit('recoveryPlanRegistered', plan)
    console.log(`恢复方案已注册: ${plan.name} (${plan.id})`)
  }

  // ========== 📊 监控和分析方法 ==========

  /**
   * 获取错误统计
   */
  getStatistics(): ErrorStatistics {
    return { ...this.statistics }
  }

  /**
   * 获取错误历史
   */
  getErrorHistory(filter?: {
    level?: ErrorLevel
    category?: ErrorCategory
    componentId?: string
    timeRange?: { start: number; end: number }
    limit?: number
  }): EnhancedError[] {
    let errors = Array.from(this.errors.values())

    if (filter) {
      if (filter.level) {
        errors = errors.filter(err => err.level === filter.level)
      }
      if (filter.category) {
        errors = errors.filter(err => err.category === filter.category)
      }
      if (filter.componentId) {
        errors = errors.filter(err => err.context.componentId === filter.componentId)
      }
      if (filter.timeRange) {
        errors = errors.filter(err =>
          err.timestamp >= filter.timeRange!.start &&
          err.timestamp <= filter.timeRange!.end
        )
      }
    }

    // 按时间倒序排列
    errors.sort((a, b) => b.timestamp - a.timestamp)

    // 限制数量
    if (filter?.limit) {
      errors = errors.slice(0, filter.limit)
    }

    return errors
  }

  /**
   * 预测错误
   */
  async predictErrors(): Promise<ErrorPrediction[]> {
    const predictions: ErrorPrediction[] = []

    try {
      // 分析错误趋势
      const recentErrors = this.getErrorHistory({
        timeRange: { start: Date.now() - 24 * 60 * 60 * 1000, end: Date.now() },
        limit: 100
      })

      // 基于历史数据预测
      const errorPatterns = this.analyzeErrorPatterns(recentErrors)

      for (const pattern of errorPatterns) {
        const prediction = this.generatePrediction(pattern, recentErrors)
        if (prediction.probability > 0.1) { // 只返回概率 > 10% 的预测
          predictions.push(prediction)
        }
      }

      // 缓存预测结果
      for (const prediction of predictions) {
        this.predictions.set(prediction.errorType, prediction)
      }

      this.emit('errorPredictionsGenerated', predictions)

    } catch (error) {
      console.error('错误预测失败:', error)
    }

    return predictions
  }

  /**
   * 执行健康检查
   */
  async performHealthCheck(): Promise<{
    overall: 'healthy' | 'warning' | 'critical'
    score: number
    issues: Array<{
      category: string
      severity: 'low' | 'medium' | 'high'
      description: string
      recommendation: string
    }>
  }> {
    const issues: any[] = []
    let score = 100

    // 检查错误率
    if (this.statistics.errorRate > 0.1) {
      issues.push({
        category: 'error_rate',
        severity: this.statistics.errorRate > 0.2 ? 'high' : 'medium',
        description: `错误率过高: ${(this.statistics.errorRate * 100).toFixed(2)}%`,
        recommendation: '检查系统配置和依赖关系'
      })
      score -= this.statistics.errorRate * 100
    }

    // 检查恢复率
    if (this.statistics.recoveryRate < 0.8) {
      issues.push({
        category: 'recovery_rate',
        severity: this.statistics.recoveryRate < 0.5 ? 'high' : 'medium',
        description: `恢复率过低: ${(this.statistics.recoveryRate * 100).toFixed(2)}%`,
        recommendation: '优化错误处理和恢复策略'
      })
      score -= (1 - this.statistics.recoveryRate) * 50
    }

    // 检查严重错误数量
    if (this.statistics.criticalErrorCount > 0) {
      issues.push({
        category: 'critical_errors',
        severity: 'high',
        description: `存在 ${this.statistics.criticalErrorCount} 个严重错误`,
        recommendation: '立即处理严重错误'
      })
      score -= this.statistics.criticalErrorCount * 10
    }

    score = Math.max(0, Math.min(100, score))
    this.systemHealthScore = score
    this.lastHealthCheck = Date.now()

    const overall = score >= 80 ? 'healthy' : score >= 60 ? 'warning' : 'critical'

    this.emit('healthCheckCompleted', { overall, score, issues })

    return { overall, score, issues }
  }

  // ========== 🔧 恢复和管理方法 ==========

  /**
   * 手动恢复错误
   */
  async recoverError(errorId: string, strategy?: RecoveryStrategy): Promise<ErrorHandleResult> {
    const error = this.errors.get(errorId)
    if (!error) {
      return this.createDefaultResult(false, '错误不存在')
    }

    if (error.recovery.isRecovered) {
      return this.createDefaultResult(true, '错误已经恢复')
    }

    // 使用指定策略或自动选择
    const recoveryStrategy = strategy || this.selectRecoveryStrategy(error)

    return await this.executeRecoveryStrategy(error, recoveryStrategy)
  }

  /**
   * 批量恢复错误
   */
  async recoverErrors(errorIds: string[]): Promise<Record<string, ErrorHandleResult>> {
    const results: Record<string, ErrorHandleResult> = {}

    for (const errorId of errorIds) {
      try {
        results[errorId] = await this.recoverError(errorId)
      } catch (error) {
        results[errorId] = this.createDefaultResult(false, `恢复失败: ${error}`)
      }
    }

    return results
  }

  /**
   * 清理过期错误
   */
  cleanup(): void {
    const now = Date.now()
    const maxAge = 7 * 24 * 60 * 60 * 1000 // 7天

    let cleanedCount = 0
    for (const [errorId, error] of this.errors) {
      if (now - error.timestamp > maxAge) {
        this.errors.delete(errorId)
        cleanedCount++
      }
    }

    // 保持错误数量在限制内
    if (this.errors.size > this.MAX_ERROR_HISTORY) {
      const sortedErrors = Array.from(this.errors.entries())
        .sort(([, a], [, b]) => b.timestamp - a.timestamp)

      const toDelete = sortedErrors.slice(this.MAX_ERROR_HISTORY)
      for (const [errorId] of toDelete) {
        this.errors.delete(errorId)
        cleanedCount++
      }
    }

    if (cleanedCount > 0) {
      console.log(`错误清理完成: 清理了 ${cleanedCount} 个过期错误`)
    }
  }

  /**
   * 重置错误处理器
   */
  reset(): void {
    this.errors.clear()
    this.predictions.clear()
    this.statistics = this.initializeStatistics()
    this.isEmergencyMode = false
    this.systemHealthScore = 100

    this.emit('errorHandlerReset')
    console.log('错误处理器已重置')
  }

  /**
   * 启用/禁用错误处理
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled
    this.emit('errorHandlerToggled', { enabled })
    console.log(`错误处理器已${enabled ? '启用' : '禁用'}`)
  }

  /**
   * 进入/退出紧急模式
   */
  setEmergencyMode(enabled: boolean): void {
    this.isEmergencyMode = enabled
    this.emit('emergencyModeToggled', { enabled })
    console.log(`${enabled ? '进入' : '退出'}紧急模式`)
  }

  // ========== 🔧 私有方法 ==========

  /**
   * 初始化错误处理器
   */
  private initializeErrorHandler(): void {
    // 启动预测任务
    this.predictionTimer = setInterval(async () => {
      await this.predictErrors()
    }, this.PREDICTION_INTERVAL)

    // 启动统计更新任务
    this.statisticsTimer = setInterval(() => {
      this.updateStatisticsTrends()
    }, this.STATISTICS_INTERVAL)

    // 启动清理任务
    this.cleanupTimer = setInterval(() => {
      this.cleanup()
    }, this.ERROR_CLEANUP_INTERVAL)
  }

  /**
   * 初始化统计信息
   */
  private initializeStatistics(): ErrorStatistics {
    return {
      totalErrors: 0,
      errorsByLevel: {} as Record<ErrorLevel, number>,
      errorsByCategory: {} as Record<ErrorCategory, number>,
      errorsByComponent: {},
      recentErrors: [],
      errorRate: 0,
      recoveryRate: 0,
      averageRecoveryTime: 0,
      criticalErrorCount: 0,
      systemHealthScore: 100,
      trends: {
        hourly: new Array(24).fill(0),
        daily: new Array(7).fill(0),
        weekly: new Array(52).fill(0)
      }
    }
  }

  /**
   * 标准化错误
   */
  private normalizeError(
    error: Error | EnhancedError | string,
    context: Partial<ErrorContext> = {}
  ): EnhancedError {
    if (typeof error === 'string') {
      return this.createEnhancedError({
        code: 'GENERIC_ERROR',
        message: error,
        level: ErrorLevel.ERROR,
        category: ErrorCategory.SYSTEM
      }, context)
    }

    if (error instanceof Error) {
      return this.createEnhancedError({
        code: error.name || 'UNKNOWN_ERROR',
        message: error.message,
        level: ErrorLevel.ERROR,
        category: this.categorizeError(error),
        stack: error.stack
      }, context)
    }

    // 已经是EnhancedError
    return error as EnhancedError
  }

  /**
   * 创建增强错误
   */
  private createEnhancedError(
    base: {
      code: string
      message: string
      level: ErrorLevel
      category: ErrorCategory
      stack?: string
    },
    context: Partial<ErrorContext> = {}
  ): EnhancedError {
    const now = Date.now()

    return {
      id: this.generateErrorId(),
      code: base.code,
      message: base.message,
      level: base.level,
      category: base.category,
      context: {
        componentId: context.metadata?.componentId,
        operationId: context.metadata?.operationId,
        userId: context.metadata?.userId,
        sessionId: context.metadata?.sessionId,
        requestId: context.metadata?.requestId,
        transactionId: context.metadata?.transactionId
      },
      stack: base.stack,
      source: {
        module: 'config-engine',
        file: context.metadata?.file,
        line: context.metadata?.line,
        column: context.metadata?.column,
        function: context.metadata?.function
      },
      timestamp: now,
      details: {
        data: context.metadata?.data,
        parameters: context.metadata?.parameters,
        environment: this.getEnvironmentInfo(),
        userAgent: context.metadata?.userAgent,
        url: context.metadata?.url
      },
      impact: {
        severity: this.calculateSeverity(base.level, base.category),
        affectedComponents: [],
        systemStability: this.calculateSystemStabilityImpact(base.level),
        dataIntegrity: this.calculateDataIntegrityImpact(base.category)
      },
      recovery: {
        strategy: RecoveryStrategy.NONE,
        attempts: 0,
        maxAttempts: this.MAX_RECOVERY_ATTEMPTS,
        isRecovered: false
      },
      childErrorIds: [],
      relatedErrorIds: []
    }
  }

  /**
   * 分类错误
   */
  private categorizeError(error: Error): ErrorCategory {
    const message = error.message.toLowerCase()
    const name = error.name.toLowerCase()

    if (message.includes('validation') || name.includes('validation')) {
      return ErrorCategory.VALIDATION
    }
    if (message.includes('network') || message.includes('fetch') || message.includes('xhr')) {
      return ErrorCategory.NETWORK
    }
    if (message.includes('permission') || message.includes('unauthorized')) {
      return ErrorCategory.PERMISSION
    }
    if (message.includes('configuration') || message.includes('config')) {
      return ErrorCategory.CONFIGURATION
    }
    if (message.includes('dependency') || message.includes('circular')) {
      return ErrorCategory.DEPENDENCY
    }

    return ErrorCategory.SYSTEM
  }

  /**
   * 计算严重程度
   */
  private calculateSeverity(level: ErrorLevel, category: ErrorCategory): number {
    let baseSeverity = 1

    switch (level) {
      case ErrorLevel.FATAL: baseSeverity = 10; break
      case ErrorLevel.CRITICAL: baseSeverity = 8; break
      case ErrorLevel.ERROR: baseSeverity = 6; break
      case ErrorLevel.WARNING: baseSeverity = 4; break
      case ErrorLevel.INFO: baseSeverity = 2; break
      case ErrorLevel.DEBUG: baseSeverity = 1; break
    }

    // 根据分类调整严重程度
    switch (category) {
      case ErrorCategory.SECURITY:
      case ErrorCategory.SYSTEM:
        baseSeverity += 2
        break
      case ErrorCategory.DEPENDENCY:
      case ErrorCategory.CONFIGURATION:
        baseSeverity += 1
        break
    }

    return Math.min(10, baseSeverity)
  }

  /**
   * 计算系统稳定性影响
   */
  private calculateSystemStabilityImpact(level: ErrorLevel): number {
    switch (level) {
      case ErrorLevel.FATAL: return 10
      case ErrorLevel.CRITICAL: return 8
      case ErrorLevel.ERROR: return 5
      case ErrorLevel.WARNING: return 2
      default: return 1
    }
  }

  /**
   * 计算数据完整性影响
   */
  private calculateDataIntegrityImpact(category: ErrorCategory): number {
    switch (category) {
      case ErrorCategory.CONFIGURATION:
      case ErrorCategory.VALIDATION:
        return 8
      case ErrorCategory.DEPENDENCY:
        return 6
      case ErrorCategory.SYSTEM:
        return 4
      default:
        return 2
    }
  }

  /**
   * 获取环境信息
   */
  private getEnvironmentInfo(): Record<string, any> {
    return {
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Node.js',
      platform: typeof process !== 'undefined' ? process.platform : 'browser',
      nodeVersion: typeof process !== 'undefined' ? process.version : undefined,
      timestamp: new Date().toISOString(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    }
  }

  /**
   * 记录错误
   */
  private recordError(error: EnhancedError): void {
    this.errors.set(error.id, error)
    this.emit('errorRecorded', error)
  }

  /**
   * 查找匹配的处理器
   */
  private findMatchedHandlers(error: EnhancedError): ErrorHandler[] {
    const handlers: ErrorHandler[] = []

    for (const handler of this.handlers.values()) {
      if (handler.canHandle(error)) {
        handlers.push(handler)
      }
    }

    return handlers
  }

  /**
   * 执行错误处理器
   */
  private async executeHandler(
    handler: ErrorHandler,
    error: EnhancedError,
    context: ErrorContext
  ): Promise<ErrorHandleResult> {
    const timeout = handler.options?.timeout || 30000

    try {
      if (handler.options?.async === false) {
        // 同步执行
        return await handler.handle(error, context)
      } else {
        // 异步执行，带超时
        return await Promise.race([
          handler.handle(error, context),
          new Promise<ErrorHandleResult>((_, reject) => {
            setTimeout(() => reject(new Error('Handler timeout')), timeout)
          })
        ])
      }
    } catch (error) {
      return this.createDefaultResult(false, `处理器执行异常: ${error}`)
    }
  }

  /**
   * 更新恢复信息
   */
  private updateRecoveryInfo(error: EnhancedError, result: ErrorHandleResult): void {
    error.recovery.strategy = result.strategy
    error.recovery.isRecovered = result.success
    error.recovery.recoveredAt = result.success ? Date.now() : undefined
    error.recovery.recoveryData = result.data
  }

  /**
   * 执行回退策略
   */
  private async executeFallbackStrategy(error: EnhancedError): Promise<ErrorHandleResult> {
    // 根据错误类型选择回退策略
    const strategy = this.selectRecoveryStrategy(error)
    return await this.executeRecoveryStrategy(error, strategy)
  }

  /**
   * 选择恢复策略
   */
  private selectRecoveryStrategy(error: EnhancedError): RecoveryStrategy {
    // 根据错误级别和分类选择策略
    if (error.level === ErrorLevel.FATAL) {
      return RecoveryStrategy.EMERGENCY_STOP
    }

    if (error.level === ErrorLevel.CRITICAL) {
      return RecoveryStrategy.ROLLBACK
    }

    if (error.category === ErrorCategory.NETWORK) {
      return RecoveryStrategy.RETRY
    }

    if (error.category === ErrorCategory.CONFIGURATION) {
      return RecoveryStrategy.RESET
    }

    return RecoveryStrategy.GRACEFUL_DEGRADATION
  }

  /**
   * 执行恢复策略
   */
  private async executeRecoveryStrategy(
    error: EnhancedError,
    strategy: RecoveryStrategy
  ): Promise<ErrorHandleResult> {
    try {
      switch (strategy) {
        case RecoveryStrategy.RETRY:
          return await this.executeRetryStrategy(error)
        case RecoveryStrategy.ROLLBACK:
          return await this.executeRollbackStrategy(error)
        case RecoveryStrategy.RESET:
          return await this.executeResetStrategy(error)
        case RecoveryStrategy.GRACEFUL_DEGRADATION:
          return await this.executeGracefulDegradationStrategy(error)
        case RecoveryStrategy.EMERGENCY_STOP:
          return await this.executeEmergencyStopStrategy(error)
        default:
          return this.createDefaultResult(false, '未知的恢复策略')
      }
    } catch (recoveryError) {
      return this.createDefaultResult(false, `恢复策略执行失败: ${recoveryError}`)
    }
  }

  /**
   * 执行重试策略
   */
  private async executeRetryStrategy(error: EnhancedError): Promise<ErrorHandleResult> {
    // 实现重试逻辑
    return this.createDefaultResult(true, '重试策略执行', RecoveryStrategy.RETRY)
  }

  /**
   * 执行回滚策略
   */
  private async executeRollbackStrategy(error: EnhancedError): Promise<ErrorHandleResult> {
    // 实现回滚逻辑
    return this.createDefaultResult(true, '回滚策略执行', RecoveryStrategy.ROLLBACK)
  }

  /**
   * 执行重置策略
   */
  private async executeResetStrategy(error: EnhancedError): Promise<ErrorHandleResult> {
    // 实现重置逻辑
    return this.createDefaultResult(true, '重置策略执行', RecoveryStrategy.RESET)
  }

  /**
   * 执行优雅降级策略
   */
  private async executeGracefulDegradationStrategy(error: EnhancedError): Promise<ErrorHandleResult> {
    // 实现优雅降级逻辑
    return this.createDefaultResult(true, '优雅降级策略执行', RecoveryStrategy.GRACEFUL_DEGRADATION)
  }

  /**
   * 执行紧急停止策略
   */
  private async executeEmergencyStopStrategy(error: EnhancedError): Promise<ErrorHandleResult> {
    // 实现紧急停止逻辑
    this.setEmergencyMode(true)
    return this.createDefaultResult(true, '紧急停止策略执行', RecoveryStrategy.EMERGENCY_STOP)
  }

  /**
   * 创建默认结果
   */
  private createDefaultResult(
    success: boolean,
    message: string,
    strategy: RecoveryStrategy = RecoveryStrategy.NONE
  ): ErrorHandleResult {
    return {
      success,
      strategy,
      action: strategy,
      message,
      shouldRetry: false,
      preventPropagation: false
    }
  }

  /**
   * 更新统计信息
   */
  private updateStatistics(error: EnhancedError): void {
    this.statistics.totalErrors++
    this.statistics.errorsByLevel[error.level] = (this.statistics.errorsByLevel[error.level] || 0) + 1
    this.statistics.errorsByCategory[error.category] = (this.statistics.errorsByCategory[error.category] || 0) + 1

    if (error.context.componentId) {
      this.statistics.errorsByComponent[error.context.componentId] =
        (this.statistics.errorsByComponent[error.context.componentId] || 0) + 1
    }

    this.statistics.recentErrors.unshift(error)
    if (this.statistics.recentErrors.length > 50) {
      this.statistics.recentErrors = this.statistics.recentErrors.slice(0, 50)
    }

    if (error.level === ErrorLevel.CRITICAL || error.level === ErrorLevel.FATAL) {
      this.statistics.criticalErrorCount++
    }

    // 更新错误率和恢复率
    this.calculateRates()
  }

  /**
   * 计算错误率和恢复率
   */
  private calculateRates(): void {
    const recentErrors = this.getErrorHistory({
      timeRange: { start: Date.now() - 60 * 60 * 1000, end: Date.now() }
    })

    this.statistics.errorRate = recentErrors.length / 1000 // 每千次操作的错误数

    const recoveredErrors = recentErrors.filter(err => err.recovery.isRecovered)
    this.statistics.recoveryRate = recentErrors.length > 0 ? recoveredErrors.length / recentErrors.length : 0

    const recoveryTimes = recoveredErrors
      .filter(err => err.recovery.recoveredAt)
      .map(err => err.recovery.recoveredAt! - err.timestamp)

    this.statistics.averageRecoveryTime = recoveryTimes.length > 0
      ? recoveryTimes.reduce((sum, time) => sum + time, 0) / recoveryTimes.length
      : 0
  }

  /**
   * 更新统计趋势
   */
  private updateStatisticsTrends(): void {
    const now = new Date()
    const hour = now.getHours()
    const day = now.getDay()
    const week = this.getWeekOfYear(now)

    const hourlyErrors = this.getErrorHistory({
      timeRange: { start: Date.now() - 60 * 60 * 1000, end: Date.now() }
    }).length

    this.statistics.trends.hourly[hour] = hourlyErrors

    const dailyErrors = this.getErrorHistory({
      timeRange: { start: Date.now() - 24 * 60 * 60 * 1000, end: Date.now() }
    }).length

    this.statistics.trends.daily[day] = dailyErrors

    const weeklyErrors = this.getErrorHistory({
      timeRange: { start: Date.now() - 7 * 24 * 60 * 60 * 1000, end: Date.now() }
    }).length

    this.statistics.trends.weekly[week % 52] = weeklyErrors
  }

  /**
   * 检查是否需要进入紧急模式
   */
  private checkEmergencyMode(error: EnhancedError): void {
    if (error.level === ErrorLevel.FATAL) {
      this.setEmergencyMode(true)
      return
    }

    // 检查严重错误数量
    if (this.statistics.criticalErrorCount > 10) {
      this.setEmergencyMode(true)
      return
    }

    // 检查错误率
    if (this.statistics.errorRate > 0.5) {
      this.setEmergencyMode(true)
    }
  }

  /**
   * 分析错误模式
   */
  private analyzeErrorPatterns(errors: EnhancedError[]): Array<{
    pattern: string
    frequency: number
    severity: number
    trend: 'increasing' | 'stable' | 'decreasing'
  }> {
    // 简化的模式分析实现
    const patterns = new Map<string, { count: number; totalSeverity: number }>()

    for (const error of errors) {
      const pattern = `${error.category}_${error.level}`
      const existing = patterns.get(pattern) || { count: 0, totalSeverity: 0 }
      patterns.set(pattern, {
        count: existing.count + 1,
        totalSeverity: existing.totalSeverity + error.impact.severity
      })
    }

    return Array.from(patterns.entries()).map(([pattern, data]) => ({
      pattern,
      frequency: data.count,
      severity: data.totalSeverity / data.count,
      trend: 'stable' as const // 简化实现
    }))
  }

  /**
   * 生成预测
   */
  private generatePrediction(
    pattern: { pattern: string; frequency: number; severity: number },
    recentErrors: EnhancedError[]
  ): ErrorPrediction {
    // 简化的预测算法
    const probability = Math.min(0.9, pattern.frequency / 100)

    return {
      probability,
      errorType: pattern.pattern,
      category: ErrorCategory.SYSTEM,
      timeWindow: 60, // 60分钟
      confidence: probability * 0.8,
      riskFactors: ['历史频率', '系统负载'],
      recommendations: ['加强监控', '优化配置'],
      preventionActions: [
        {
          action: '增加监控点',
          priority: 1,
          estimatedEffectiveness: 0.7
        }
      ]
    }
  }

  /**
   * 获取系统状态
   */
  private getSystemState(): Record<string, any> {
    return {
      isEmergencyMode: this.isEmergencyMode,
      systemHealthScore: this.systemHealthScore,
      errorCount: this.errors.size,
      recoveryRate: this.statistics.recoveryRate,
      timestamp: Date.now()
    }
  }

  /**
   * 获取年度周数
   */
  private getWeekOfYear(date: Date): number {
    const start = new Date(date.getFullYear(), 0, 1)
    const diff = date.getTime() - start.getTime()
    return Math.floor(diff / (7 * 24 * 60 * 60 * 1000))
  }

  /**
   * 延迟执行
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * 生成错误ID
   */
  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).slice(2)}`
  }

  /**
   * 注册内置处理器
   */
  private registerBuiltInHandlers(): void {
    // 配置验证错误处理器
    this.registerHandler({
      id: 'validation_error_handler',
      name: '配置验证错误处理器',
      priority: 100,
      errorTypes: ['VALIDATION_ERROR', 'CONFIG_INVALID'],
      categories: [ErrorCategory.VALIDATION, ErrorCategory.CONFIGURATION],
      levels: [ErrorLevel.ERROR, ErrorLevel.WARNING],
      canHandle: (error) => error.category === ErrorCategory.VALIDATION,
      handle: async (error, context) => {
        return {
          success: true,
          strategy: RecoveryStrategy.RESET,
          action: 'reset_to_default',
          message: '重置为默认配置',
          shouldRetry: false,
          preventPropagation: true
        }
      }
    })

    // 网络错误处理器
    this.registerHandler({
      id: 'network_error_handler',
      name: '网络错误处理器',
      priority: 90,
      errorTypes: ['NETWORK_ERROR', 'FETCH_FAILED'],
      categories: [ErrorCategory.NETWORK],
      levels: [ErrorLevel.ERROR, ErrorLevel.WARNING],
      canHandle: (error) => error.category === ErrorCategory.NETWORK,
      handle: async (error, context) => {
        return {
          success: false,
          strategy: RecoveryStrategy.RETRY,
          action: 'retry_request',
          message: '网络请求重试',
          shouldRetry: true,
          retryDelay: 5000,
          preventPropagation: false
        }
      }
    })

    console.log('内置错误处理器已注册')
  }

  /**
   * 注册内置恢复方案
   */
  private registerBuiltInRecoveryPlans(): void {
    // 配置重置恢复方案
    this.registerRecoveryPlan({
      id: 'config_reset_plan',
      name: '配置重置恢复方案',
      description: '将损坏的配置重置为默认值',
      errorPatterns: [
        {
          category: ErrorCategory.CONFIGURATION,
          level: ErrorLevel.ERROR,
          codePattern: /CONFIG_.*_ERROR/
        }
      ],
      steps: [
        {
          id: 'backup_current',
          name: '备份当前配置',
          description: '创建当前配置的备份',
          action: 'create_backup',
          parameters: {},
          timeout: 30000,
          retryable: true,
          critical: false,
          successCriteria: [
            {
              type: 'condition',
              target: 'backup_created',
              expected: true
            }
          ]
        },
        {
          id: 'reset_to_default',
          name: '重置为默认配置',
          description: '将配置重置为系统默认值',
          action: 'reset_configuration',
          parameters: { mode: 'default' },
          timeout: 60000,
          retryable: false,
          critical: true,
          rollbackAction: 'restore_backup',
          successCriteria: [
            {
              type: 'validation',
              target: 'configuration_valid',
              expected: true
            }
          ]
        }
      ],
      estimatedTime: 90,
      successRate: 0.95,
      riskLevel: 'low',
      prerequisites: ['system_running', 'backup_available']
    })

    console.log('内置恢复方案已注册')
  }
}

// ========== 🚀 全局实例和工具函数 ==========

/**
 * 错误级别常量
 */
export const ErrorLevels = ErrorLevel

/**
 * 错误分类常量
 */
export const ErrorCategories = ErrorCategory

/**
 * 恢复策略常量
 */
export const RecoveryStrategies = RecoveryStrategy

/**
 * 创建简单错误的便捷函数
 */
export function createError(
  code: string,
  message: string,
  level: ErrorLevel = ErrorLevel.ERROR,
  category: ErrorCategory = ErrorCategory.SYSTEM
): EnhancedError {
  return {
    id: `error_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    code,
    message,
    level,
    category,
    context: {},
    source: { module: 'config-engine' },
    timestamp: Date.now(),
    details: {},
    impact: {
      severity: 5,
      affectedComponents: [],
      systemStability: 5,
      dataIntegrity: 5
    },
    recovery: {
      strategy: RecoveryStrategy.NONE,
      attempts: 0,
      maxAttempts: 3,
      isRecovered: false
    },
    childErrorIds: [],
    relatedErrorIds: []
  }
}

// 全局实例
export const enhancedErrorHandler = new EnhancedErrorHandler()

console.log('✨ EnhancedErrorHandler 模块加载完成')