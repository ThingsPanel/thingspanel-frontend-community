/**
 * HTTP数据源配置相关类型定义
 * 基于DataSourceConfigForm copy.vue中的HTTP配置功能分析
 */

// HTTP请求方法类型
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS'

// 请求体类型
export type HttpBodyType = 'none' | 'json' | 'form' | 'text' | 'raw'

// 键值对接口（用于头部、参数、表单数据）
export interface KeyValuePair {
  key: string
  value: string
  enabled?: boolean // 是否启用此项
  description?: string // 描述信息
}

// HTTP头部配置
export interface HttpHeadersConfig {
  /** 动态头部列表 */
  headers: KeyValuePair[]
  /** JSON格式的头部（备选输入方式） */
  jsonHeaders?: string
  /** 是否使用JSON格式输入 */
  useJsonFormat?: boolean
}

// HTTP参数配置
export interface HttpParamsConfig {
  /** URL查询参数 */
  urlParams: KeyValuePair[]
  /** 请求体类型 */
  bodyType: HttpBodyType
  /** JSON请求体内容 */
  jsonBody?: string
  /** 表单数据 */
  formData?: KeyValuePair[]
  /** 原始文本请求体 */
  rawBody?: string
}

// HTTP脚本配置
export interface HttpScriptConfig {
  /** 请求前脚本 */
  preRequestScript?: string
  /** 响应后脚本 */
  postResponseScript?: string
  /** 脚本模板类型 */
  scriptTemplateType?: 'custom' | 'auth-token' | 'data-transform' | 'error-handle'
}

// HTTP高级配置
export interface HttpAdvancedConfig {
  /** 请求超时时间（毫秒） */
  timeout?: number
  /** 重试次数 */
  retryCount?: number
  /** 重试间隔（毫秒） */
  retryInterval?: number
  /** 是否跟随重定向 */
  followRedirects?: boolean
  /** 代理配置 */
  proxy?: {
    enabled: boolean
    host?: string
    port?: number
    auth?: {
      username: string
      password: string
    }
  }
  /** SSL/TLS配置 */
  ssl?: {
    verifyCertificate: boolean
    clientCertificate?: {
      cert: string
      key: string
    }
  }
}

// HTTP测试结果
export interface HttpTestResult {
  /** 是否成功 */
  success: boolean
  /** 响应状态码 */
  status?: number
  /** 响应时间（毫秒） */
  duration?: number
  /** 响应数据 */
  data?: any
  /** 错误信息 */
  error?: string
  /** 响应头 */
  headers?: Record<string, string>
  /** 请求详情 */
  requestDetails?: {
    url: string
    method: HttpMethod
    headers: Record<string, string>
    body?: any
  }
}

// HTTP测试状态
export interface HttpTestStatus {
  /** 是否正在测试 */
  testing: boolean
  /** 最后测试时间 */
  lastTestTime?: number
  /** 测试结果 */
  result?: HttpTestResult
}

// 完整的HTTP配置接口
export interface HttpDataSourceConfig {
  /** 基础配置 */
  method: HttpMethod
  url: string

  /** 请求头配置 */
  headers: HttpHeadersConfig

  /** 请求参数配置 */
  params: HttpParamsConfig

  /** 脚本配置 */
  scripts: HttpScriptConfig

  /** 高级配置 */
  advanced: HttpAdvancedConfig

  /** 测试状态 */
  testStatus: HttpTestStatus
}

// 系统预制API接口
export interface SystemApiDefinition {
  /** API唯一标识 */
  id: string
  /** API名称 */
  name: string
  /** API描述 */
  description?: string
  /** API分类 */
  category: 'device' | 'user' | 'system' | 'custom'
  /** HTTP配置模板 */
  template: {
    method: HttpMethod
    url: string
    headers?: KeyValuePair[]
    params?: KeyValuePair[]
  }
  /** 示例响应数据 */
  exampleResponse?: any
  /** 是否需要认证 */
  requiresAuth?: boolean
}

// API列表弹窗相关类型
export interface ApiListModalState {
  /** 是否显示弹窗 */
  visible: boolean
  /** API列表数据 */
  apiList: SystemApiDefinition[]
  /** 搜索关键词 */
  searchKeyword: string
  /** 选中的分类 */
  selectedCategory?: string
  /** 加载状态 */
  loading: boolean
}

// HTTP配置验证结果
export interface HttpConfigValidationResult {
  /** 是否有效 */
  valid: boolean
  /** 错误列表 */
  errors: Array<{
    field: string
    message: string
    type: 'required' | 'format' | 'invalid'
  }>
  /** 警告列表 */
  warnings?: Array<{
    field: string
    message: string
  }>
}

// HttpDataInput组件配置接口
export interface HttpConfigData {
  /** HTTP方法 */
  method: HttpMethod
  /** 请求URL */
  url: string
  /** 请求头 */
  headers: KeyValuePair[]
  /** URL参数 */
  params: KeyValuePair[]
  /** 请求体数据 */
  body: {
    json: string
    form: KeyValuePair[]
    text: string
    raw: string
  }
  /** 请求体类型 */
  bodyType: HttpBodyType
  /** 超时时间（毫秒） */
  timeout: number
  /** 重试次数 */
  retryCount: number
  /** 重试延迟（毫秒） */
  retryDelay: number
  /** 是否跟随重定向 */
  followRedirect: boolean
  /** 是否验证SSL */
  sslVerify: boolean
}

// 系统API项接口
export interface SystemApiItem {
  /** API唯一标识 */
  id: string
  /** API名称 */
  name: string
  /** API描述 */
  description: string
  /** HTTP方法 */
  method: HttpMethod
  /** API URL */
  url: string
  /** 默认请求头 */
  defaultHeaders?: KeyValuePair[]
  /** 默认参数 */
  defaultParams?: KeyValuePair[]
  /** API分类 */
  category?: string
}

// 测试连接响应接口
export interface TestConnectionResponse {
  /** 是否成功 */
  success: boolean
  /** 响应状态码 */
  status: number
  /** 响应状态文本 */
  statusText: string
  /** 响应头 */
  headers: Record<string, string>
  /** 响应数据 */
  data: any
  /** 响应时间（毫秒） */
  responseTime: number
  /** 错误信息 */
  error?: string
}

// 验证结果接口
export interface ValidationResult {
  /** 验证类型 */
  type: 'default' | 'success' | 'info' | 'warning' | 'error'
  /** 验证文本 */
  text: string
  /** 详细信息 */
  detail: string
}

// HTTP工具方法相关类型
export interface HttpUtilities {
  /** 格式化JSON */
  formatJson: (jsonStr: string) => { success: boolean; data?: string; error?: string }
  /** 验证JSON */
  validateJson: (jsonStr: string) => { valid: boolean; error?: string }
  /** 验证URL */
  validateUrl: (url: string) => { valid: boolean; error?: string }
  /** 生成cURL命令 */
  generateCurl: (config: HttpDataSourceConfig) => string
}
