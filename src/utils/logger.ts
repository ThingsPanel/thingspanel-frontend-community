/**
 * 统一调试日志系统 - 增强版
 * 支持开发/生产环境切换，避免生产环境中的调试信息污染
 */

// 日志级别枚举
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

// 日志配置接口
interface LoggerConfig {
  enabled: boolean
  level: LogLevel
  prefix?: string
  timestamp?: boolean
}

// 默认配置：开发环境启用所有日志，生产环境只启用警告和错误
const DEFAULT_CONFIG: LoggerConfig = {
  enabled: import.meta.env.DEV,
  level: import.meta.env.DEV ? LogLevel.DEBUG : LogLevel.WARN,
  prefix: '[ThingsPanel]',
  timestamp: true
}

export default class Logger {
  private config: LoggerConfig
  moduleName: string = ''

  constructor(moduleName = '', config?: Partial<LoggerConfig>) {
    this.moduleName = moduleName
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  /**
   * 更新日志配置
   */
  updateConfig(config: Partial<LoggerConfig>) {
    this.config = { ...this.config, ...config }
  }

  /**
   * 检查日志级别是否启用
   */
  private isLevelEnabled(level: LogLevel): boolean {
    return this.config.enabled && level >= this.config.level
  }

  /**
   * 格式化日志前缀
   */
  private formatPrefix(level: string): string {
    const prefix = this.config.prefix || '[App]'
    const timestamp = this.config.timestamp ? new Date().toLocaleTimeString() + ' -' : ''
    const moduleInfo = this.moduleName ? `[${this.moduleName}]` : ''
    return `${prefix}${moduleInfo}[${level}] ${timestamp}`
  }

  /**
   * Debug级别日志 - 只在开发环境显示
   */
  debug(...args: any[]): void {
    if (this.isLevelEnabled(LogLevel.DEBUG)) {
      if (process.env.NODE_ENV === 'development') {
      }
    }
  }

  /**
   * Info级别日志
   */
  info(...args: any[]): void {
    if (this.isLevelEnabled(LogLevel.INFO)) {
      console.info(this.formatPrefix('INFO'), ...args)
    }
  }

  /**
   * Warning级别日志
   */
  warn(...args: any[]): void {
    if (this.isLevelEnabled(LogLevel.WARN)) {
      console.error(this.formatPrefix('WARN'), ...args)
    }
  }

  /**
   * Error级别日志
   */
  error(...args: any[]): void {
    if (this.isLevelEnabled(LogLevel.ERROR)) {
      console.error(this.formatPrefix('ERROR'), ...args)
    }
  }

  /**
   * 条件日志 - 只有当条件为true时才输出
   */
  debugIf(condition: boolean, ...args: any[]): void {
    if (condition) this.debug(...args)
  }

  /**
   * 性能计时开始
   */
  time(label: string): void {
    if (this.isLevelEnabled(LogLevel.DEBUG)) {
      console.time(`${this.formatPrefix('TIMER')} ${label}`)
    }
  }

  /**
   * 性能计时结束
   */
  timeEnd(label: string): void {
    if (this.isLevelEnabled(LogLevel.DEBUG)) {
      console.timeEnd(`${this.formatPrefix('TIMER')} ${label}`)
    }
  }
}

// 创建日志器工厂函数
export const createLogger = (moduleName: string, config?: Partial<LoggerConfig>) => new Logger(moduleName, config)

// 创建全局默认日志器
export const logger = new Logger()

// 为常用模块创建专用日志器
export const dataSourceLogger = createLogger('DataSource')
export const httpLogger = createLogger('HTTP')
export const componentLogger = createLogger('Component')
export const visualEditorLogger = createLogger('VisualEditor')
export const propertyBindingLogger = createLogger('PropertyBinding')

// 导出类型
export type { LoggerConfig }
