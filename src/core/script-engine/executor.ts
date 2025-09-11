/**
 * 脚本执行器实现
 * 负责实际的脚本执行、结果处理和统计收集
 */

import type {
  IScriptExecutor,
  ScriptConfig,
  ScriptExecutionContext,
  ScriptExecutionResult,
  ExecutionStats,
  ScriptLog
} from './types'
import { ScriptSandbox, defaultSandboxConfig } from '@/core/script-engine/sandbox'

/**
 * 脚本执行器实现类
 */
export class ScriptExecutor implements IScriptExecutor {
  private sandbox: ScriptSandbox
  private stats: ExecutionStats
  private executionCount = 0
  private executionTimes: number[] = []
  private currentExecutions = 0

  constructor() {
    this.sandbox = new ScriptSandbox(defaultSandboxConfig)
    this.stats = {
      totalExecutions: 0,
      successfulExecutions: 0,
      failedExecutions: 0,
      averageExecutionTime: 0,
      maxExecutionTime: 0,
      minExecutionTime: 0,
      currentConcurrentExecutions: 0
    }
  }

  /**
   * 执行脚本
   */
  async execute<T = any>(config: ScriptConfig, context?: ScriptExecutionContext): Promise<ScriptExecutionResult<T>> {
    const startTime = Date.now()
    const logs: ScriptLog[] = []

    // 增加并发计数
    this.currentExecutions++
    this.stats.currentConcurrentExecutions = this.currentExecutions

    try {
      // 验证脚本语法
      const syntaxCheck = this.validateSyntax(config.code)
      if (!syntaxCheck.valid) {
        throw new Error(`脚本语法错误: ${syntaxCheck.error}`)
      }

      // 创建执行环境
      const sandboxEnv = this.sandbox.createSandbox(defaultSandboxConfig)

      // 添加上下文变量
      if (context) {
        Object.assign(sandboxEnv, context.variables)
        Object.assign(sandboxEnv, context.functions)
      }

      // 添加自定义全局变量
      if (config.globals) {
        Object.assign(sandboxEnv, config.globals)
      }

      // 添加日志收集器
      sandboxEnv.console = this.createLoggingConsole(logs)

      // 执行脚本
      const timeout = config.timeout || 5000
      const result = await this.sandbox.executeInSandbox(config.code, sandboxEnv, timeout)

      // 计算执行时间
      const executionTime = Date.now() - startTime
      this.updateStats(executionTime, true)

      // 销毁沙箱
      this.sandbox.destroySandbox(sandboxEnv)

      return {
        success: true,
        data: result,
        executionTime,
        contextSnapshot: context ? { ...context.variables } : undefined,
        logs
      }
    } catch (error) {
      const executionTime = Date.now() - startTime
      this.updateStats(executionTime, false)

      return {
        success: false,
        error: error as Error,
        executionTime,
        contextSnapshot: context ? { ...context.variables } : undefined,
        logs
      }
    } finally {
      // 减少并发计数
      this.currentExecutions--
      this.stats.currentConcurrentExecutions = this.currentExecutions
    }
  }

  /**
   * 验证脚本语法
   */
  validateSyntax(code: string): { valid: boolean; error?: string } {
    try {
      // 使用Function构造器验证语法
      new Function(code)
      return { valid: true }
    } catch (error) {
      return {
        valid: false,
        error: (error as Error).message
      }
    }
  }

  /**
   * 获取执行统计
   */
  getExecutionStats(): ExecutionStats {
    return { ...this.stats }
  }

  /**
   * 创建日志收集器
   */
  private createLoggingConsole(logs: ScriptLog[]) {
    const createLogMethod =
      (level: ScriptLog['level']) =>
      (...args: any[]) => {
        const log: ScriptLog = {
          level,
          message: args.map(arg => (typeof arg === 'object' ? JSON.stringify(arg) : String(arg))).join(' '),
          timestamp: Date.now(),
          args
        }
        logs.push(log)

        // 同时输出到真实console（带前缀）
        const realConsole = console as any
        if (realConsole[level]) {
          realConsole[level](`[ScriptEngine:${level.toUpperCase()}]`, ...args)
        }
      }

    return {
      log: createLogMethod('log'),
      warn: createLogMethod('warn'),
      error: createLogMethod('error'),
      info: createLogMethod('info'),
      debug: createLogMethod('debug')
    }
  }

  /**
   * 更新执行统计
   */
  private updateStats(executionTime: number, success: boolean): void {
    this.stats.totalExecutions++

    if (success) {
      this.stats.successfulExecutions++
    } else {
      this.stats.failedExecutions++
    }

    // 更新执行时间统计
    this.executionTimes.push(executionTime)

    // 保持最近1000次执行的记录
    if (this.executionTimes.length > 1000) {
      this.executionTimes = this.executionTimes.slice(-1000)
    }

    // 更新时间统计
    this.stats.maxExecutionTime = Math.max(this.stats.maxExecutionTime, executionTime)
    this.stats.minExecutionTime =
      this.stats.minExecutionTime === 0 ? executionTime : Math.min(this.stats.minExecutionTime, executionTime)

    this.stats.averageExecutionTime =
      this.executionTimes.reduce((sum, time) => sum + time, 0) / this.executionTimes.length
  }

  /**
   * 重置统计信息
   */
  resetStats(): void {
    this.stats = {
      totalExecutions: 0,
      successfulExecutions: 0,
      failedExecutions: 0,
      averageExecutionTime: 0,
      maxExecutionTime: 0,
      minExecutionTime: 0,
      currentConcurrentExecutions: this.currentExecutions
    }
    this.executionTimes = []
  }
}

/**
 * 默认脚本配置
 */
export const defaultScriptConfig: ScriptConfig = {
  code: '',
  timeout: 5000,
  strictMode: true,
  asyncSupport: true,
  maxMemory: 50 * 1024 * 1024, // 50MB
  allowNetworkAccess: false,
  allowFileSystemAccess: false
}
