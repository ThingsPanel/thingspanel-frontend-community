/**
 * 脚本引擎类型定义
 */

// 脚本执行结果
export interface ScriptExecutionResult<T = any> {
  /** 执行是否成功 */
  success: boolean
  /** 执行结果数据 */
  data?: T
  /** 错误信息 */
  error?: Error
  /** 执行时间（毫秒） */
  executionTime: number
  /** 执行上下文快照 */
  contextSnapshot?: Record<string, any>
  /** 日志输出 */
  logs: ScriptLog[]
}

// 脚本日志
export interface ScriptLog {
  level: 'log' | 'warn' | 'error' | 'info' | 'debug'
  message: string
  timestamp: number
  args?: any[]
}

// 脚本配置
export interface ScriptConfig {
  /** 脚本代码 */
  code: string
  /** 执行超时时间（毫秒） */
  timeout?: number
  /** 是否启用严格模式 */
  strictMode?: boolean
  /** 是否启用异步支持 */
  asyncSupport?: boolean
  /** 最大内存使用量（字节） */
  maxMemory?: number
  /** 自定义全局变量 */
  globals?: Record<string, any>
  /** 是否允许网络请求 */
  allowNetworkAccess?: boolean
  /** 是否允许文件系统访问 */
  allowFileSystemAccess?: boolean
}

// 脚本执行上下文
export interface ScriptExecutionContext {
  /** 上下文ID */
  id: string
  /** 上下文名称 */
  name: string
  /** 上下文变量 */
  variables: Record<string, any>
  /** 内置函数 */
  functions: Record<string, Function>
  /** 上下文创建时间 */
  createdAt: number
  /** 上下文最后更新时间 */
  updatedAt: number
}

// 脚本模板
export interface ScriptTemplate {
  /** 模板ID */
  id: string
  /** 模板名称 */
  name: string
  /** 模板描述 */
  description?: string
  /** 模板分类 */
  category: string
  /** 模板代码 */
  code: string
  /** 模板参数 */
  parameters: ScriptTemplateParameter[]
  /** 示例用法 */
  example?: string
  /** 是否为系统模板 */
  isSystem?: boolean
  /** 创建时间 */
  createdAt: number
  /** 更新时间 */
  updatedAt: number
}

// 脚本模板参数
export interface ScriptTemplateParameter {
  /** 参数名称 */
  name: string
  /** 参数类型 */
  type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'function'
  /** 参数描述 */
  description?: string
  /** 是否必需 */
  required: boolean
  /** 默认值 */
  defaultValue?: any
  /** 参数验证规则 */
  validation?: {
    min?: number
    max?: number
    pattern?: string
    enum?: any[]
  }
}

// 沙箱配置
export interface SandboxConfig {
  /** 是否启用沙箱 */
  enabled: boolean
  /** 允许的全局对象 */
  allowedGlobals: string[]
  /** 禁止的全局对象 */
  blockedGlobals: string[]
  /** 是否允许eval */
  allowEval: boolean
  /** 是否允许Function构造器 */
  allowFunction: boolean
  /** 是否允许原型污染 */
  allowPrototypePollution: boolean
  /** 自定义安全策略 */
  customSecurityPolicy?: (code: string) => boolean
}

// 脚本引擎配置
export interface ScriptEngineConfig {
  /** 默认脚本配置 */
  defaultScriptConfig: ScriptConfig
  /** 沙箱配置 */
  sandboxConfig: SandboxConfig
  /** 是否启用缓存 */
  enableCache: boolean
  /** 缓存TTL（毫秒） */
  cacheTTL: number
  /** 最大并发执行数 */
  maxConcurrentExecutions: number
  /** 是否启用性能监控 */
  enablePerformanceMonitoring: boolean
}

// 脚本执行器接口
export interface IScriptExecutor {
  /** 执行脚本 */
  execute<T = any>(config: ScriptConfig, context?: ScriptExecutionContext): Promise<ScriptExecutionResult<T>>
  /** 验证脚本语法 */
  validateSyntax(code: string): { valid: boolean; error?: string }
  /** 获取执行统计 */
  getExecutionStats(): ExecutionStats
}

// 脚本沙箱接口
export interface IScriptSandbox {
  /** 创建沙箱环境 */
  createSandbox(config: SandboxConfig): any
  /** 执行沙箱代码 */
  executeInSandbox(code: string, sandbox: any, timeout?: number): Promise<any>
  /** 销毁沙箱 */
  destroySandbox(sandbox: any): void
  /** 检查代码安全性 */
  checkCodeSecurity(code: string): { safe: boolean; issues: string[] }
}

// 脚本模板管理器接口
export interface IScriptTemplateManager {
  /** 获取所有模板 */
  getAllTemplates(): ScriptTemplate[]
  /** 根据分类获取模板 */
  getTemplatesByCategory(category: string): ScriptTemplate[]
  /** 获取指定模板 */
  getTemplate(id: string): ScriptTemplate | null
  /** 创建模板 */
  createTemplate(template: Omit<ScriptTemplate, 'id' | 'createdAt' | 'updatedAt'>): ScriptTemplate
  /** 更新模板 */
  updateTemplate(id: string, updates: Partial<ScriptTemplate>): boolean
  /** 删除模板 */
  deleteTemplate(id: string): boolean
  /** 根据模板生成代码 */
  generateCode(templateId: string, parameters: Record<string, any>): string
}

// 上下文管理器接口
export interface IScriptContextManager {
  /** 创建执行上下文 */
  createContext(name: string, variables?: Record<string, any>): ScriptExecutionContext
  /** 获取上下文 */
  getContext(id: string): ScriptExecutionContext | null
  /** 更新上下文 */
  updateContext(id: string, updates: Partial<ScriptExecutionContext>): boolean
  /** 删除上下文 */
  deleteContext(id: string): boolean
  /** 克隆上下文 */
  cloneContext(id: string, newName: string): ScriptExecutionContext | null
  /** 合并上下文 */
  mergeContexts(sourceId: string, targetId: string): boolean
}

// 脚本引擎主接口
export interface IScriptEngine {
  /** 脚本执行器 */
  executor: IScriptExecutor
  /** 脚本沙箱 */
  sandbox: IScriptSandbox
  /** 模板管理器 */
  templateManager: IScriptTemplateManager
  /** 上下文管理器 */
  contextManager: IScriptContextManager

  /** 快速执行脚本 */
  execute<T = any>(code: string, context?: Record<string, any>): Promise<ScriptExecutionResult<T>>
  /** 使用模板执行 */
  executeTemplate<T = any>(templateId: string, parameters: Record<string, any>): Promise<ScriptExecutionResult<T>>
  /** 获取引擎配置 */
  getConfig(): ScriptEngineConfig
  /** 更新引擎配置 */
  updateConfig(config: Partial<ScriptEngineConfig>): void
}

// 执行统计
export interface ExecutionStats {
  /** 总执行次数 */
  totalExecutions: number
  /** 成功执行次数 */
  successfulExecutions: number
  /** 失败执行次数 */
  failedExecutions: number
  /** 平均执行时间（毫秒） */
  averageExecutionTime: number
  /** 最长执行时间（毫秒） */
  maxExecutionTime: number
  /** 最短执行时间（毫秒） */
  minExecutionTime: number
  /** 当前并发执行数 */
  currentConcurrentExecutions: number
}

// 内置工具函数类型
export interface BuiltinUtilities {
  /** 数据生成工具 */
  mockData: {
    randomNumber: (min?: number, max?: number) => number
    randomString: (length?: number) => string
    randomBoolean: () => boolean
    randomDate: (start?: Date, end?: Date) => Date
    randomArray: <T>(items: T[], count?: number) => T[]
    randomObject: (template: Record<string, any>) => any
  }

  /** 数据处理工具 */
  dataUtils: {
    deepClone: <T>(obj: T) => T
    merge: (...objects: any[]) => any
    pick: <T extends Record<string, any>>(obj: T, keys: (keyof T)[]) => Partial<T>
    omit: <T extends Record<string, any>>(obj: T, keys: (keyof T)[]) => Partial<T>
    groupBy: <T>(array: T[], key: keyof T | ((item: T) => any)) => Record<string, T[]>
    sortBy: <T>(array: T[], key: keyof T | ((item: T) => any)) => T[]
  }

  /** 时间工具 */
  timeUtils: {
    now: () => number
    format: (date: Date | number, format: string) => string
    addDays: (date: Date, days: number) => Date
    diffDays: (date1: Date, date2: Date) => number
    startOfDay: (date: Date) => Date
    endOfDay: (date: Date) => Date
  }

  /** 网络工具 */
  networkUtils: {
    httpGet: (url: string, options?: RequestInit) => Promise<any>
    httpPost: (url: string, data: any, options?: RequestInit) => Promise<any>
    httpPut: (url: string, data: any, options?: RequestInit) => Promise<any>
    httpDelete: (url: string, options?: RequestInit) => Promise<any>
  }

  /** 日志工具 */
  logger: {
    log: (...args: any[]) => void
    warn: (...args: any[]) => void
    error: (...args: any[]) => void
    info: (...args: any[]) => void
    debug: (...args: any[]) => void
  }
}

// 预定义模板分类
export enum TemplateCategory {
  DATA_GENERATION = 'data-generation',
  DATA_PROCESSING = 'data-processing',
  API_INTEGRATION = 'api-integration',
  TIME_SERIES = 'time-series',
  MATHEMATICAL = 'mathematical',
  VALIDATION = 'validation',
  TRANSFORMATION = 'transformation',
  UTILITY = 'utility',
  CUSTOM = 'custom'
}
