/**
 * 安全脚本执行沙箱
 * 提供安全、受限的JavaScript脚本执行环境
 */

/**
 * 脚本执行选项
 */
export interface ScriptExecutionOptions {
  /** 执行超时时间（毫秒） */
  timeout?: number
  /** 是否启用console */
  enableConsole?: boolean
  /** 自定义全局对象 */
  customGlobals?: Record<string, any>
}

/**
 * 脚本执行结果
 */
export interface ScriptExecutionResult<T = any> {
  success: boolean
  result?: T
  error?: string
  executionTime: number
}

/**
 * 安全脚本沙箱 - 简化版本
 */
export class ScriptSandbox {
  private static readonly DEFAULT_TIMEOUT = 5000 // 5秒默认超时
  private static readonly MAX_TIMEOUT = 30000 // 最大30秒超时

  /**
   * 创建安全的console对象
   */
  private static createSafeConsole(): Console {
    // 创建受限的console对象，只保留安全的方法
    return {
      log: console.log.bind(console),
      info: console.info.bind(console),
      warn: console.warn.bind(console),
      error: console.error.bind(console),
      debug: console.debug.bind(console),
      // 其他方法都设为空函数
      assert: () => {},
      clear: () => {},
      count: () => {},
      countReset: () => {},
      dir: () => {},
      dirxml: () => {},
      group: () => {},
      groupCollapsed: () => {},
      groupEnd: () => {},
      profile: () => {},
      profileEnd: () => {},
      table: () => {},
      time: () => {},
      timeEnd: () => {},
      timeLog: () => {},
      timeStamp: () => {},
      trace: () => {}
    } as Console
  }

  /**
   * 创建安全的全局环境
   */
  private static createSafeGlobals(customGlobals: Record<string, any> = {}, enableConsole = true): Record<string, any> {
    const safeGlobals: Record<string, any> = {
      // 基本JavaScript对象
      JSON: JSON,
      Math: Math,
      Date: Date,
      Array: Array,
      Object: Object,
      String: String,
      Number: Number,
      Boolean: Boolean,
      RegExp: RegExp,

      // 工具函数
      parseInt: parseInt,
      parseFloat: parseFloat,
      isNaN: isNaN,
      isFinite: isFinite,
      encodeURIComponent: encodeURIComponent,
      decodeURIComponent: decodeURIComponent,
      encodeURI: encodeURI,
      decodeURI: decodeURI,

      // 自定义全局对象
      ...customGlobals
    }

    // 可选的console
    if (enableConsole) {
      safeGlobals.console = this.createSafeConsole()
    }

    return safeGlobals
  }

  /**
   * 执行脚本（Promise版本，支持超时）
   */
  private static executeWithTimeout<T>(scriptFunction: Function, args: any[], timeout: number): Promise<T> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`脚本执行超时 (${timeout}ms)`))
      }, timeout)

      try {
        // 同步执行脚本
        const result = scriptFunction(...args)
        clearTimeout(timer)

        // 如果结果是Promise，等待其完成
        if (result && typeof result.then === 'function') {
          result.then(resolve).catch(reject)
        } else {
          resolve(result)
        }
      } catch (error) {
        clearTimeout(timer)
        reject(error)
      }
    })
  }

  /**
   * 安全执行请求拦截器脚本 - 简化版本
   */
  static async executePreRequestScript(
    config: any,
    script: string,
    options: ScriptExecutionOptions = {}
  ): Promise<ScriptExecutionResult<any>> {
    const startTime = Date.now()
    const timeout = Math.min(options.timeout || this.DEFAULT_TIMEOUT, this.MAX_TIMEOUT)

    try {
      // 验证脚本内容
      if (!script || typeof script !== 'string') {
        throw new Error('脚本内容无效')
      }

      // 创建安全环境
      const safeGlobals = this.createSafeGlobals(options.customGlobals, options.enableConsole)

      // 创建参数名数组和值数组
      const paramNames = ['config', ...Object.keys(safeGlobals)]
      const paramValues = [config, ...Object.values(safeGlobals)]

      // 构建简化的脚本函数
      const scriptFunction = new Function(...paramNames, script)

      // 执行脚本（带超时）
      const result = await this.executeWithTimeout(scriptFunction, paramValues, timeout)

      return {
        success: true,
        result: result || config, // 如果没有返回值，返回原始config
        executionTime: Date.now() - startTime
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || '脚本执行失败',
        executionTime: Date.now() - startTime
      }
    }
  }

  /**
   * 安全执行响应拦截器脚本 - 简化版本
   */
  static async executeResponseScript(
    response: any,
    script: string,
    options: ScriptExecutionOptions = {}
  ): Promise<ScriptExecutionResult<any>> {
    const startTime = Date.now()
    const timeout = Math.min(options.timeout || this.DEFAULT_TIMEOUT, this.MAX_TIMEOUT)

    try {
      // 验证脚本内容
      if (!script || typeof script !== 'string') {
        throw new Error('脚本内容无效')
      }

      // 创建安全环境
      const safeGlobals = this.createSafeGlobals(options.customGlobals, options.enableConsole)

      // 创建参数名数组和值数组
      const paramNames = ['response', ...Object.keys(safeGlobals)]
      const paramValues = [response, ...Object.values(safeGlobals)]

      // 构建简化的脚本函数
      const scriptFunction = new Function(...paramNames, script)

      // 执行脚本（带超时）
      const result = await this.executeWithTimeout(scriptFunction, paramValues, timeout)

      return {
        success: true,
        result: result !== undefined ? result : response,
        executionTime: Date.now() - startTime
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || '脚本执行失败',
        executionTime: Date.now() - startTime
      }
    }
  }

  /**
   * 验证脚本安全性（基础检查）
   */
  static validateScript(script: string): { safe: boolean; warnings: string[] } {
    const warnings: string[] = []

    // 检查危险关键词
    const dangerousPatterns = [
      /\beval\s*\(/gi,
      /\bFunction\s*\(/gi,
      /\bsetTimeout\s*\(/gi,
      /\bsetInterval\s*\(/gi,
      /\bprocess\s*\./gi,
      /\brequire\s*\(/gi,
      /\bimport\s+/gi,
      /\bexport\s+/gi,
      /\b__proto__\b/gi,
      /\bconstructor\b.*\bprototype\b/gi
    ]

    dangerousPatterns.forEach((pattern, index) => {
      if (pattern.test(script)) {
        const warningMessages = [
          '检测到eval()调用，可能存在代码注入风险',
          '检测到Function()构造器，可能存在安全风险',
          '检测到setTimeout()调用，可能影响性能',
          '检测到setInterval()调用，可能影响性能',
          '检测到process对象访问，已被阻止',
          '检测到require()调用，已被阻止',
          '检测到import语句，已被阻止',
          '检测到export语句，已被阻止',
          '检测到__proto__访问，可能存在安全风险',
          '检测到原型链操作，可能存在安全风险'
        ]
        warnings.push(warningMessages[index])
      }
    })

    return {
      safe: warnings.length === 0,
      warnings
    }
  }
}
