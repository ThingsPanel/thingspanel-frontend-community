# 数据源系统类型系统指南

## 概述

数据源系统 2.0 采用了完全统一的 TypeScript 类型系统，确保类型安全、代码可维护性和开发体验的一致性。本指南详细介绍了整个类型系统的设计、使用方法和最佳实践。

## 🏗️ 类型系统架构

### 类型组织结构

```
src/core/data-source-system/types/
├── index.ts                    # 统一类型导出入口
├── simple-types.ts            # Card2.1兼容类型
├── http-config.ts             # HTTP配置类型（已合并）
├── websocket-config.ts        # WebSocket配置类型（已合并）
├── dynamic-params.ts          # 动态参数类型
└── execution.ts               # 执行结果类型
```

## 🔗 核心类型定义

### 1. 组件数据源配置 (ComponentDataSourceConfig)

所有数据源配置的基础类型：

```typescript
interface ComponentDataSourceConfig {
  /** 配置唯一标识 */
  id: string
  
  /** 配置名称 */
  name: string
  
  /** 配置描述 */
  description?: string
  
  /** 数据源类型 */
  type: DataSourceType
  
  /** 组件ID（可选，用于关联特定组件） */
  componentId?: string
  
  /** 是否启用 */
  enabled: boolean
  
  /** 数据源特定配置 */
  sourceConfig: DataSourceConfig
  
  /** 触发器配置 */
  triggers?: TriggerConfiguration[]
  
  /** 数据处理器 */
  processors?: DataProcessor[]
  
  /** 字段映射配置 */
  fieldMapping?: FieldMappingConfig
  
  /** 元数据 */
  metadata?: ComponentMetadata
}
```

### 2. HTTP 配置类型 (HttpConfiguration)

**统一的HTTP配置标准**，替代了之前分散的 `HttpConfig` 和 `HttpConfigData`：

```typescript
interface HttpConfiguration {
  /** HTTP方法 */
  method: HttpMethod
  
  /** 请求URL */
  url: string
  
  /** 请求头 */
  headers: HttpHeader[]
  
  /** URL参数 */
  params: HttpParam[]
  
  /** 请求体 */
  body?: HttpBody
  
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
  
  /** 是否验证SSL证书 */
  sslVerify: boolean
  
  /** 预请求脚本 */
  preRequestScript?: string
  
  /** 响应处理脚本 */
  responseScript?: string
  
  /** 动态参数配置 */
  dynamicParams?: DynamicParam[]
}

// HTTP方法枚举
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS'

// 请求头类型
interface HttpHeader {
  key: string
  value: string
  isDynamic: boolean
  description?: string
}

// URL参数类型
interface HttpParam {
  key: string
  value: string
  isDynamic: boolean
  description?: string
}

// 请求体类型
type HttpBodyType = 'none' | 'json' | 'form' | 'text' | 'raw' | 'binary'
type HttpBody = string | Record<string, any> | FormData | ArrayBuffer
```

### 3. WebSocket 配置类型 (WebSocketConfiguration)

```typescript
interface WebSocketConfiguration {
  /** WebSocket连接URL */
  url: string
  
  /** 子协议 */
  protocols?: string[]
  
  /** 认证配置 */
  auth?: WebSocketAuthConfig
  
  /** 重连配置 */
  reconnect: WebSocketReconnectConfig
  
  /** 心跳配置 */
  heartbeat?: WebSocketHeartbeatConfig
  
  /** 消息过滤器 */
  messageFilter?: WebSocketMessageFilter
  
  /** 缓冲区配置 */
  buffer?: WebSocketBufferConfig
  
  /** 连接超时（毫秒） */
  connectionTimeout: number
  
  /** 消息超时（毫秒） */
  messageTimeout: number
}

// WebSocket重连配置
interface WebSocketReconnectConfig {
  enabled: boolean
  maxAttempts: number
  delay: number
  backoff: 'linear' | 'exponential'
  maxDelay: number
}

// WebSocket认证配置
interface WebSocketAuthConfig {
  type: 'none' | 'basic' | 'bearer' | 'custom'
  token?: string
  username?: string
  password?: string
  headers?: Record<string, string>
}
```

### 4. 动态参数系统

```typescript
interface DynamicParam {
  /** 参数名称 */
  name: string
  
  /** 参数类型 */
  type: DynamicParamType
  
  /** 参数值或表达式 */
  value: string
  
  /** 参数描述 */
  description?: string
  
  /** 是否必需 */
  required: boolean
  
  /** 默认值 */
  defaultValue?: any
  
  /** 验证规则 */
  validation?: DynamicParamValidation
}

type DynamicParamType = 
  | 'string'      // 字符串
  | 'number'      // 数字
  | 'boolean'     // 布尔值
  | 'datetime'    // 日期时间
  | 'uuid'        // UUID
  | 'expression'  // 表达式
  | 'function'    // 函数调用

interface DynamicParamValidation {
  pattern?: string
  min?: number
  max?: number
  options?: string[]
}
```

### 5. 触发器配置

```typescript
interface TriggerConfiguration {
  /** 触发器唯一标识 */
  id: string
  
  /** 触发器类型 */
  type: TriggerType
  
  /** 触发器名称 */
  name: string
  
  /** 是否启用 */
  enabled: boolean
  
  /** 触发器特定配置 */
  config: TriggerConfig
  
  /** 触发条件 */
  conditions?: TriggerCondition[]
}

type TriggerType = 'timer' | 'websocket' | 'event' | 'manual' | 'webhook'

// 定时器触发器配置
interface TimerTriggerConfig extends BaseTriggerConfig {
  /** 触发间隔（毫秒） */
  interval: number
  
  /** 是否立即执行 */
  immediate: boolean
  
  /** 最大执行次数（0为无限制） */
  maxExecutions?: number
  
  /** cron表达式（可选，优先级高于interval） */
  cronExpression?: string
}
```

### 6. 数据处理器

```typescript
interface DataProcessor {
  /** 处理器唯一标识 */
  id: string
  
  /** 处理器类型 */
  type: ProcessorType
  
  /** 处理器名称 */
  name: string
  
  /** 是否启用 */
  enabled: boolean
  
  /** 执行顺序 */
  order: number
  
  /** 处理器配置 */
  config: ProcessorConfig
}

type ProcessorType = 
  | 'script'      // 脚本处理
  | 'transform'   // 数据转换
  | 'filter'      // 数据过滤
  | 'validate'    // 数据验证
  | 'format'      // 格式化
  | 'aggregate'   // 数据聚合

// 脚本处理器配置
interface ScriptProcessorConfig extends BaseProcessorConfig {
  /** JavaScript脚本代码 */
  script: string
  
  /** 脚本执行环境 */
  environment?: 'sandbox' | 'node' | 'browser'
  
  /** 超时时间（毫秒） */
  timeout: number
  
  /** 上下文变量 */
  context?: Record<string, any>
}
```

## 🔄 错误处理类型系统

### 系统错误类型

```typescript
enum SystemErrorType {
  // 配置相关
  VALIDATION = 'validation',
  MISSING_CONFIG = 'missing_config',
  INVALID_CONFIG = 'invalid_config',
  
  // 网络相关  
  NETWORK = 'network',
  TIMEOUT = 'timeout',
  ABORT = 'abort',
  CONNECTION_FAILED = 'connection_failed',
  
  // 认证相关
  AUTH = 'auth',
  PERMISSION = 'permission',
  
  // 数据处理相关
  PARSE = 'parse',
  TRANSFORM = 'transform',
  SCRIPT = 'script',
  
  // 系统相关
  SYSTEM = 'system',
  UNKNOWN = 'unknown'
}

interface SystemError {
  type: SystemErrorType
  code: string
  message: string
  details?: any
  context?: Record<string, any>
  timestamp: number
  retryable?: boolean
  userMessage?: string
}

interface ErrorHandlingResult<T = any> {
  success: boolean
  data?: T
  error?: SystemError
  executionTime: number
  retryCount?: number
}
```

## 📖 类型使用指南

### 1. 创建HTTP数据源配置

```typescript
import type { ComponentDataSourceConfig, HttpConfiguration } from '@/core/data-source-system/types'

// 创建HTTP配置
const httpConfig: HttpConfiguration = {
  method: 'POST',
  url: 'https://api.example.com/devices',
  headers: [
    {
      key: 'Authorization',
      value: 'Bearer {{API_TOKEN}}',
      isDynamic: true,
      description: '认证令牌'
    },
    {
      key: 'Content-Type', 
      value: 'application/json',
      isDynamic: false
    }
  ],
  params: [
    {
      key: 'limit',
      value: '50',
      isDynamic: false
    }
  ],
  body: {
    query: 'active_devices',
    filters: {
      location: 'building_a'
    }
  },
  bodyType: 'json',
  timeout: 10000,
  retryCount: 3,
  retryDelay: 1000,
  followRedirect: true,
  sslVerify: true,
  dynamicParams: [
    {
      name: 'API_TOKEN',
      type: 'string',
      value: '{{user.token}}',
      required: true
    }
  ]
}

// 创建完整的数据源配置
const dataSourceConfig: ComponentDataSourceConfig = {
  id: 'device-list-api',
  name: '设备列表API',
  description: '获取活跃设备列表',
  type: 'http',
  enabled: true,
  sourceConfig: httpConfig,
  triggers: [
    {
      id: 'auto-refresh',
      type: 'timer',
      name: '自动刷新',
      enabled: true,
      config: {
        interval: 30000,
        immediate: true
      }
    }
  ],
  processors: [
    {
      id: 'device-normalizer',
      type: 'script',
      name: '设备数据标准化',
      enabled: true,
      order: 1,
      config: {
        script: `
          return data.devices.map(device => ({
            id: device.device_id,
            name: device.device_name || '未知设备',
            status: device.is_online ? 'online' : 'offline',
            lastSeen: new Date(device.last_seen)
          }))
        `,
        timeout: 5000
      }
    }
  ],
  metadata: {
    createdAt: Date.now(),
    updatedAt: Date.now(),
    version: '1.0.0',
    tags: ['生产环境', '设备管理']
  }
}
```

### 2. WebSocket 数据源配置

```typescript
import type { WebSocketConfiguration } from '@/core/data-source-system/types'

const wsConfig: WebSocketConfiguration = {
  url: 'wss://api.example.com/realtime',
  protocols: ['thingspanel-v1'],
  auth: {
    type: 'bearer',
    token: '{{WS_TOKEN}}'
  },
  reconnect: {
    enabled: true,
    maxAttempts: 5,
    delay: 2000,
    backoff: 'exponential',
    maxDelay: 30000
  },
  heartbeat: {
    enabled: true,
    interval: 30000,
    message: '{"type": "ping"}',
    timeout: 5000
  },
  messageFilter: {
    messageType: ['device_update', 'sensor_data'],
    jsonPath: '$.data[?(@.type in ["temperature", "humidity"])]'
  },
  connectionTimeout: 10000,
  messageTimeout: 5000
}
```

### 3. 错误处理实践

```typescript
import type { ErrorHandlingResult, SystemError } from '@/core/data-source-system/types'

// 定义函数返回类型
async function fetchDeviceData(): Promise<ErrorHandlingResult<DeviceData[]>> {
  try {
    const result = await httpExecutor.execute(config, context)
    
    if (result.success) {
      return {
        success: true,
        data: result.data,
        executionTime: result.executionTime
      }
    } else {
      return {
        success: false,
        error: result.error,
        executionTime: result.executionTime
      }
    }
  } catch (error) {
    const systemError: SystemError = {
      type: SystemErrorType.SYSTEM,
      code: 'FETCH_DEVICE_DATA_ERROR',
      message: '获取设备数据失败',
      details: error,
      timestamp: Date.now(),
      retryable: false
    }
    
    return {
      success: false,
      error: systemError,
      executionTime: 0
    }
  }
}

// 使用类型安全的方式处理结果
const result = await fetchDeviceData()

if (result.success) {
  // TypeScript 知道 result.data 存在且类型为 DeviceData[]
  console.log('获取到设备数据:', result.data.length)
  result.data.forEach(device => {
    console.log(`设备 ${device.name}: ${device.status}`)
  })
} else {
  // TypeScript 知道 result.error 存在且类型为 SystemError
  console.error('获取失败:', result.error.userMessage)
  
  // 根据错误类型进行不同处理
  switch (result.error.type) {
    case SystemErrorType.NETWORK:
      showNetworkErrorNotification()
      break
    case SystemErrorType.AUTH:
      redirectToLogin()
      break
    default:
      showGenericErrorMessage(result.error)
  }
}
```

## 🔧 类型系统工具和实用程序

### 1. 类型守卫 (Type Guards)

```typescript
// HTTP配置类型守卫
export function isHttpConfiguration(config: any): config is HttpConfiguration {
  return config && 
         typeof config.method === 'string' &&
         typeof config.url === 'string' &&
         Array.isArray(config.headers) &&
         typeof config.timeout === 'number'
}

// WebSocket配置类型守卫
export function isWebSocketConfiguration(config: any): config is WebSocketConfiguration {
  return config &&
         typeof config.url === 'string' &&
         config.url.startsWith('ws') &&
         typeof config.connectionTimeout === 'number'
}

// 系统错误类型守卫
export function isSystemError(obj: any): obj is SystemError {
  return obj &&
         typeof obj.type === 'string' &&
         typeof obj.code === 'string' &&
         typeof obj.message === 'string' &&
         typeof obj.timestamp === 'number'
}

// 使用示例
function processConfig(config: unknown) {
  if (isHttpConfiguration(config)) {
    // TypeScript 现在知道 config 是 HttpConfiguration 类型
    console.log(`HTTP请求: ${config.method} ${config.url}`)
    console.log(`超时时间: ${config.timeout}ms`)
  } else if (isWebSocketConfiguration(config)) {
    // TypeScript 现在知道 config 是 WebSocketConfiguration 类型
    console.log(`WebSocket连接: ${config.url}`)
    console.log(`连接超时: ${config.connectionTimeout}ms`)
  } else {
    console.error('未知的配置类型')
  }
}
```

### 2. 类型工具函数

```typescript
// 提取配置中的动态参数
export function extractDynamicParams<T extends { dynamicParams?: DynamicParam[] }>(
  config: T
): string[] {
  return config.dynamicParams?.map(param => param.name) || []
}

// 验证配置完整性
export function validateConfigCompleteness<T extends ComponentDataSourceConfig>(
  config: T
): config is T & Required<Pick<T, 'name' | 'type' | 'sourceConfig'>> {
  return !!(config.name && config.type && config.sourceConfig)
}

// 创建默认配置
export function createDefaultHttpConfig(): HttpConfiguration {
  return {
    method: 'GET',
    url: '',
    headers: [],
    params: [],
    bodyType: 'none',
    timeout: 10000,
    retryCount: 0,
    retryDelay: 1000,
    followRedirect: true,
    sslVerify: true
  }
}

// 深度部分类型
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

// 配置更新类型
export type ConfigUpdate<T> = DeepPartial<Omit<T, 'id' | 'metadata'>>
```

### 3. 泛型工具类型

```typescript
// 提取数据源配置类型
export type ExtractSourceConfig<T extends ComponentDataSourceConfig> = T['sourceConfig']

// 提取触发器配置类型
export type ExtractTriggerConfig<T extends TriggerConfiguration> = T['config']

// 创建类型安全的执行结果
export type ExecutionResult<T> = Promise<ErrorHandlingResult<T>>

// 配置验证函数类型
export type ConfigValidator<T> = (config: T) => ErrorHandlingResult<boolean>

// 数据处理函数类型
export type DataProcessor<TInput = any, TOutput = any> = 
  (input: TInput, context?: any) => ExecutionResult<TOutput>

// 使用示例
async function createTypedExecutor<TConfig, TResult>(
  validator: ConfigValidator<TConfig>,
  processor: DataProcessor<TConfig, TResult>
) {
  return async (config: TConfig, context?: any): ExecutionResult<TResult> => {
    // 验证配置
    const validation = validator(config)
    if (!validation.success) {
      return validation as ErrorHandlingResult<TResult>
    }
    
    // 处理数据
    return processor(config, context)
  }
}
```

## 🎯 最佳实践

### 1. 类型命名规范

```typescript
// ✅ 好的类型命名
interface HttpConfiguration { }      // 配置类型用 Configuration 后缀
interface DeviceData { }            // 数据类型用 Data 后缀
interface ApiResponse<T> { }        // 响应类型用 Response 后缀
type HttpMethod = 'GET' | 'POST'    // 联合类型用描述性名称
enum SystemErrorType { }           // 枚举用 Type 或 Kind 后缀

// ❌ 避免的类型命名
interface HttpConfig { }           // 已弃用，使用 HttpConfiguration
interface IDevice { }              // 避免 I 前缀
type Type1 = string               // 避免无意义的名称
```

### 2. 类型定义组织

```typescript
// ✅ 推荐的组织方式
export interface ComponentDataSourceConfig {
  // 基础字段
  id: string
  name: string
  
  // 可选字段分组
  description?: string
  enabled?: boolean
  
  // 复杂类型字段
  sourceConfig: DataSourceConfig
  triggers?: TriggerConfiguration[]
  
  // 元数据放最后
  metadata?: ComponentMetadata
}

// ❌ 避免的组织方式
export interface BadConfig {
  metadata?: ComponentMetadata  // 元数据不应放在开头
  id: string                   // 基础字段散乱分布
  sourceConfig: any            // 使用 any 类型
  description?: string
  name: string
}
```

### 3. 泛型使用

```typescript
// ✅ 良好的泛型设计
export interface ExecutionResult<TData = any> {
  success: boolean
  data?: TData
  error?: SystemError
  executionTime: number
}

export interface DataExecutor<TConfig = any, TResult = any> {
  readonly type: string
  execute(config: TConfig, context?: any): Promise<ExecutionResult<TResult>>
}

// ❌ 过度复杂的泛型
export interface ComplexExecutor<
  TConfig extends Record<string, any>,
  TResult extends object,
  TContext extends { [K in keyof TConfig]: any },
  TMeta extends { created: number }
> {
  // 过于复杂，难以理解和使用
}
```

### 4. 类型导入导出

```typescript
// ✅ 清晰的导入导出
// types/index.ts
export type { ComponentDataSourceConfig } from './config-types'
export type { HttpConfiguration } from './http-types'
export type { SystemError, ErrorHandlingResult } from './error-types'

// 使用时
import type { 
  ComponentDataSourceConfig,
  HttpConfiguration,
  SystemError 
} from '@/core/data-source-system/types'

// ❌ 混乱的导入
import { ComponentDataSourceConfig } from './types'  // 运行时导入类型
import * as Types from './types'                     // 导入所有类型到命名空间
```

## 🔍 类型系统调试

### 1. 类型检查工具

```bash
# 运行类型检查
pnpm typecheck

# 查看详细类型信息
npx tsc --noEmit --pretty

# 使用 TypeScript 编译器 API 进行类型分析
npx tsc --listFiles --showConfig
```

### 2. IDE 支持

在 VS Code 中，可以使用以下快捷键进行类型调试：

- `Ctrl/Cmd + 点击`: 跳转到类型定义
- `F12`: 转到定义
- `Shift + F12`: 查找所有引用
- `Ctrl/Cmd + Shift + Space`: 显示参数提示
- `Ctrl/Cmd + K, Ctrl/Cmd + I`: 显示悬停信息

### 3. 类型断言和调试

```typescript
// 使用类型断言进行调试
const config = someUnknownConfig as HttpConfiguration
console.log('配置方法:', config.method)  // TypeScript 现在知道这是 HttpConfiguration

// 使用类型守卫进行安全检查
if (isHttpConfiguration(someConfig)) {
  // 在这个代码块中，someConfig 被推断为 HttpConfiguration
  console.log('HTTP URL:', someConfig.url)
  console.log('超时设置:', someConfig.timeout)
}

// 使用 satisfies 操作符进行类型验证（TypeScript 4.9+）
const myConfig = {
  method: 'GET',
  url: 'https://api.example.com',
  headers: [],
  params: [],
  timeout: 10000
} satisfies Partial<HttpConfiguration>

// 编译时类型检查辅助函数
function assertType<T>(value: T): asserts value is T {
  // 这个函数在运行时什么都不做，但在编译时提供类型断言
}

// 使用示例
function processConfig(config: unknown) {
  assertType<HttpConfiguration>(config)
  // 现在 TypeScript 知道 config 是 HttpConfiguration 类型
  console.log(config.method, config.url)
}
```

## 📚 进阶类型技术

### 1. 条件类型

```typescript
// 根据数据源类型推断配置类型
type ConfigForType<T extends DataSourceType> = 
  T extends 'http' ? HttpConfiguration :
  T extends 'websocket' ? WebSocketConfiguration :
  T extends 'static' ? StaticDataConfiguration :
  never

// 使用示例
function createExecutor<T extends DataSourceType>(
  type: T,
  config: ConfigForType<T>
) {
  // TypeScript 会自动推断正确的配置类型
}

// 调用时会有类型检查
createExecutor('http', {
  method: 'GET',  // ✅ 正确：HttpConfiguration 需要的字段
  url: 'https://api.example.com'
})

createExecutor('http', {
  url: 'wss://api.example.com'  // ❌ 错误：缺少 method 字段
})
```

### 2. 映射类型

```typescript
// 创建所有字段都可选的类型
type PartialConfig<T> = {
  [P in keyof T]?: T[P]
}

// 创建所有字段都必需的类型
type RequiredConfig<T> = {
  [P in keyof T]-?: T[P]
}

// 创建只读配置类型
type ReadonlyConfig<T> = {
  readonly [P in keyof T]: T[P]
}

// 提取特定前缀的字段
type ExtractFields<T, Prefix extends string> = {
  [P in keyof T as P extends `${Prefix}${string}` ? P : never]: T[P]
}

// 使用示例
type HttpMethods = ExtractFields<HttpConfiguration, 'method'>
// 结果: { method: HttpMethod }
```

### 3. 模板字面量类型

```typescript
// 动态参数名称类型
type DynamicParamName = `{{${string}}}`

// 验证动态参数格式
function isDynamicParam(value: string): value is DynamicParamName {
  return value.startsWith('{{') && value.endsWith('}}')
}

// API 路径类型
type ApiPath<TBase extends string> = `/${TBase}${string}`

// 错误代码类型
type ErrorCode<TModule extends string> = `${TModule}_${Uppercase<string>}_ERROR`

// 使用示例
const httpError: ErrorCode<'HTTP'> = 'HTTP_REQUEST_ERROR'  // ✅ 正确
const badError: ErrorCode<'HTTP'> = 'network_error'       // ❌ 错误：格式不匹配
```

## 🚨 常见类型错误和解决方案

### 1. 类型不兼容错误

```typescript
// ❌ 常见错误
const config: HttpConfiguration = {
  method: 'get',  // 错误：应该是大写 'GET'
  url: 'https://api.example.com',
  headers: ['Authorization: Bearer token'],  // 错误：应该是对象数组
  timeout: '10000'  // 错误：应该是数字
}

// ✅ 正确写法
const config: HttpConfiguration = {
  method: 'GET',
  url: 'https://api.example.com',
  headers: [
    {
      key: 'Authorization',
      value: 'Bearer token',
      isDynamic: false
    }
  ],
  params: [],
  bodyType: 'none',
  timeout: 10000,
  retryCount: 0,
  retryDelay: 1000,
  followRedirect: true,
  sslVerify: true
}
```

### 2. 可选属性处理

```typescript
// ❌ 不安全的可选属性访问
function processConfig(config: ComponentDataSourceConfig) {
  console.log(config.description.length)  // 错误：description 可能为 undefined
  
  config.triggers.forEach(trigger => {   // 错误：triggers 可能为 undefined
    console.log(trigger.name)
  })
}

// ✅ 安全的可选属性访问
function processConfig(config: ComponentDataSourceConfig) {
  // 使用可选链操作符
  console.log(config.description?.length ?? 0)
  
  // 使用逻辑判断
  if (config.description) {
    console.log(config.description.length)
  }
  
  // 使用默认值
  const triggers = config.triggers ?? []
  triggers.forEach(trigger => {
    console.log(trigger.name)
  })
}
```

### 3. 联合类型处理

```typescript
// ❌ 不正确的联合类型处理
function handleConfig(config: HttpConfiguration | WebSocketConfiguration) {
  console.log(config.method)  // 错误：WebSocketConfiguration 没有 method 属性
}

// ✅ 正确的联合类型处理
function handleConfig(config: HttpConfiguration | WebSocketConfiguration) {
  if ('method' in config) {
    // TypeScript 推断这里 config 是 HttpConfiguration
    console.log(`HTTP ${config.method} ${config.url}`)
  } else {
    // TypeScript 推断这里 config 是 WebSocketConfiguration
    console.log(`WebSocket ${config.url}`)
  }
}

// 或者使用类型守卫
function handleConfig(config: HttpConfiguration | WebSocketConfiguration) {
  if (isHttpConfiguration(config)) {
    console.log(`HTTP ${config.method} ${config.url}`)
  } else {
    console.log(`WebSocket ${config.url}`)
  }
}
```

## 📋 类型系统检查清单

在开发过程中，请确保遵循以下最佳实践：

### ✅ 必须遵循

- [ ] 使用统一的类型导入：`import type { ... } from '@/core/data-source-system/types'`
- [ ] 所有公共 API 必须有明确的类型注解
- [ ] 避免使用 `any` 类型，使用 `unknown` 代替
- [ ] 使用类型守卫确保运行时类型安全
- [ ] 为复杂类型提供类型工具函数

### ✅ 建议遵循

- [ ] 使用描述性的类型名称
- [ ] 为泛型参数提供默认值
- [ ] 使用只读类型确保不可变性
- [ ] 提供类型示例和使用文档

### ❌ 避免事项

- [ ] 不要修改核心类型定义（使用扩展代替）
- [ ] 不要在类型定义中使用 `any`
- [ ] 不要忽略 TypeScript 编译器警告
- [ ] 不要在运行时进行类型检查（使用类型守卫代替）

---

这个类型系统为数据源系统 2.0 提供了坚实的基础，确保了代码的类型安全和可维护性。通过遵循本指南中的最佳实践，开发者可以充分利用 TypeScript 的强大功能，构建更可靠的数据管理解决方案。