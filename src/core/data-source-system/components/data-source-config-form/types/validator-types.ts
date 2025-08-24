/**
 * 验证器类型定义
 * 基于DataSourceConfigForm copy.vue中的数据验证功能分析
 */

// 验证规则类型
export type ValidationRuleType =
  | 'required' // 必填验证
  | 'type' // 类型验证
  | 'format' // 格式验证
  | 'range' // 范围验证
  | 'pattern' // 正则验证
  | 'custom' // 自定义验证

// 验证级别
export type ValidationLevel = 'error' | 'warning' | 'info'

// 验证规则接口
export interface ValidationRule {
  /** 规则类型 */
  type: ValidationRuleType
  /** 验证级别 */
  level: ValidationLevel
  /** 错误消息 */
  message: string
  /** 验证参数 */
  params?: any
  /** 自定义验证函数 */
  validator?: (value: any, context?: any) => boolean | Promise<boolean>
}

// 验证结果
export interface ValidationResult {
  /** 是否有效 */
  valid: boolean
  /** 错误列表 */
  errors: Array<{
    field: string
    rule: ValidationRuleType
    message: string
    level: ValidationLevel
    value?: any
  }>
  /** 警告列表 */
  warnings: Array<{
    field: string
    message: string
    suggestion?: string
  }>
}

// JSON数据验证器
export interface JsonValidator {
  /** 验证JSON格式 */
  validateFormat: (jsonString: string) => ValidationResult
  /** 验证JSON模式 */
  validateSchema: (data: any, schema: any) => ValidationResult
  /** 格式化JSON */
  format: (jsonString: string, indent?: number) => { success: boolean; data?: string; error?: string }
}

// HTTP配置验证器
export interface HttpConfigValidator {
  /** 验证URL格式 */
  validateUrl: (url: string) => ValidationResult
  /** 验证请求头 */
  validateHeaders: (headers: Record<string, string>) => ValidationResult
  /** 验证请求参数 */
  validateParams: (params: Record<string, any>) => ValidationResult
  /** 验证请求体 */
  validateBody: (body: any, contentType: string) => ValidationResult
}

// JavaScript脚本验证器
export interface ScriptValidator {
  /** 验证脚本语法 */
  validateSyntax: (script: string) => ValidationResult
  /** 验证脚本安全性 */
  validateSecurity: (script: string) => ValidationResult
  /** 格式化脚本 */
  format: (script: string) => { success: boolean; data?: string; error?: string }
  /** 获取脚本依赖 */
  getDependencies: (script: string) => string[]
}

// 数据源配置验证器
export interface DataSourceConfigValidator {
  /** 验证数据源配置 */
  validateDataSource: (config: any) => ValidationResult
  /** 验证数据源链接 */
  validateConnection: (config: any) => Promise<ValidationResult>
  /** 验证数据源权限 */
  validatePermissions: (config: any) => Promise<ValidationResult>
}

// 统一验证器接口
export interface UnifiedValidator {
  /** JSON验证器 */
  json: JsonValidator
  /** HTTP配置验证器 */
  http: HttpConfigValidator
  /** 脚本验证器 */
  script: ScriptValidator
  /** 数据源配置验证器 */
  dataSource: DataSourceConfigValidator

  /** 批量验证 */
  validateBatch: (items: Array<{ type: string; data: any }>) => Promise<ValidationResult[]>
  /** 异步验证 */
  validateAsync: (type: string, data: any) => Promise<ValidationResult>
}
