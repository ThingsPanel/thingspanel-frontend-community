/**
 * HTTP配置类型定义（完善版）
 * 基于SUBTASK-008完善版文档设计
 */

/**
 * HTTP参数基础接口
 * 统一HttpHeader和HttpParam的共同属性
 */
export interface HttpParameter {
  /** 参数键名 */
  key: string

  /** 参数值 - 示例值，类型与dataType匹配 */
  value: string | number | boolean

  /** 是否启用此参数 */
  enabled: boolean

  /** 是否为动态参数 */
  isDynamic: boolean

  /** 数据类型，用于类型转换和验证 */
  dataType: 'string' | 'number' | 'boolean' | 'json'

  /** 动态时自动生成：var_ + key的snake_case */
  variableName: string

  /** 参数说明，必填 */
  description: string
}

/**
 * HTTP请求头配置
 */
export interface HttpHeader extends HttpParameter {}

/**
 * HTTP查询参数配置
 */
export interface HttpParam extends HttpParameter {}

/**
 * HTTP配置接口
 */
export interface HttpConfig {
  /** 请求URL */
  url: string

  /** HTTP方法 */
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'

  /** 超时时间（毫秒） */
  timeout: number

  /** 请求头配置 */
  headers: HttpHeader[]

  /** 查询参数配置 */
  params: HttpParam[]

  /** 请求体（可选） */
  body?: string

  /** 请求前处理脚本（可选） */
  preRequestScript?: string

  /** 响应后处理脚本（可选） */
  postResponseScript?: string
}

/**
 * 变量名生成器 - 将key转换为snake_case格式的变量名
 */
export function generateVariableName(key: string): string {
  return `var_${
    key
      .replace(/([a-z])([A-Z])/g, '$1_$2') // 驼峰转下划线（只在小写字母后跟大写字母时）
      .toLowerCase() // 转小写
      .replace(/[^a-z0-9_]/g, '_') // 非法字符转下划线
      .replace(/_+/g, '_') // 多个下划线合并
      .replace(/^_|_$/g, '') // 去掉首尾下划线
  }`
}

/**
 * 类型转换器 - 将值转换为指定数据类型
 */
export function convertValue(value: any, dataType: string): any {
  if (value === null || value === undefined) return value

  switch (dataType) {
    case 'string':
      return String(value)
    case 'number':
      const num = Number(value)
      return isNaN(num) ? 0 : num
    case 'boolean':
      if (typeof value === 'boolean') return value
      if (typeof value === 'string') return value.toLowerCase() === 'true'
      return Boolean(value)
    case 'json':
      if (typeof value === 'object') return value
      if (typeof value === 'string') {
        try {
          return JSON.parse(value)
        } catch {
          return {}
        }
      }
      return value
    default:
      return value
  }
}

/**
 * 创建默认HttpHeader
 */
export function createDefaultHttpHeader(): HttpHeader {
  return {
    key: '',
    value: '',
    enabled: true,
    isDynamic: false,
    dataType: 'string',
    variableName: '',
    description: ''
  }
}

/**
 * 创建默认HttpParam
 */
export function createDefaultHttpParam(): HttpParam {
  return {
    key: '',
    value: '',
    enabled: true,
    isDynamic: false,
    dataType: 'string',
    variableName: '',
    description: ''
  }
}

/**
 * HTTP配置模板
 */
export const HTTP_CONFIG_TEMPLATES: Array<{
  name: string
  config: HttpConfig
}> = [
  {
    name: 'GET接口',
    config: {
      url: 'https://api.example.com/data',
      method: 'GET',
      timeout: 5000,
      headers: [
        {
          key: 'Accept',
          value: 'application/json',
          enabled: true,
          isDynamic: false,
          dataType: 'string',
          variableName: '',
          description: 'HTTP Accept头'
        }
      ],
      params: [],
      body: '',
      preRequestScript: '',
      postResponseScript: 'return response.data || response'
    }
  },
  {
    name: 'POST接口',
    config: {
      url: 'https://api.example.com/submit',
      method: 'POST',
      timeout: 10000,
      headers: [
        {
          key: 'Content-Type',
          value: 'application/json',
          enabled: true,
          isDynamic: false,
          dataType: 'string',
          variableName: '',
          description: '内容类型'
        },
        {
          key: 'Authorization',
          value: 'Bearer demo-token-12345',
          enabled: true,
          isDynamic: true,
          dataType: 'string',
          variableName: 'var_authorization',
          description: '认证令牌'
        }
      ],
      params: [],
      body: '{"data": "value"}',
      preRequestScript:
        'config.headers = config.headers || {}\nconfig.headers["X-Timestamp"] = Date.now()\nreturn config',
      postResponseScript: 'return response.data || response'
    }
  },
  {
    name: '设备遥测数据',
    config: {
      url: '/telemetry/datas/statistic',
      method: 'GET',
      timeout: 15000,
      headers: [
        {
          key: 'Accept',
          value: 'application/json',
          enabled: true,
          isDynamic: false,
          dataType: 'string',
          variableName: '',
          description: 'HTTP Accept头'
        }
      ],
      params: [
        {
          key: 'device_id',
          value: 'device_001',
          enabled: true,
          isDynamic: true,
          dataType: 'string',
          variableName: 'var_device_id',
          description: '设备ID'
        },
        {
          key: 'key',
          value: 'temperature',
          enabled: true,
          isDynamic: true,
          dataType: 'string',
          variableName: 'var_key',
          description: '指标键名'
        },
        {
          key: 'start_time',
          value: Date.now() - 3600000,
          enabled: true,
          isDynamic: true,
          dataType: 'number',
          variableName: 'var_start_time',
          description: '开始时间戳'
        },
        {
          key: 'end_time',
          value: Date.now(),
          enabled: true,
          isDynamic: true,
          dataType: 'number',
          variableName: 'var_end_time',
          description: '结束时间戳'
        },
        {
          key: 'aggregate_window',
          value: 'no_aggregate',
          enabled: true,
          isDynamic: false,
          dataType: 'string',
          variableName: '',
          description: '聚合窗口'
        },
        {
          key: 'time_range',
          value: 'custom',
          enabled: true,
          isDynamic: false,
          dataType: 'string',
          variableName: '',
          description: '时间范围类型'
        },
        {
          key: 'TimeRange',
          value: 'custom',
          enabled: true,
          isDynamic: false,
          dataType: 'string',
          variableName: '',
          description: '时间范围类型(大写版本)'
        }
      ],
      preRequestScript: `// 请求前处理 - 确保参数完整性
// 注意：所有参数值在此时已经确定，无需检查dynamicValues
// 可以对参数进行验证、转换或添加额外的请求配置

// 示例：添加请求时间戳到headers
config.headers = config.headers || {}
config.headers['X-Request-Time'] = Date.now().toString()

// 示例：验证必要参数是否存在
const requiredParams = ['device_id', 'key']
const missingParams = []
if (config.params) {
  for (const required of requiredParams) {
    const param = config.params.find(p => p.key === required)
    if (!param || !param.value) {
      missingParams.push(required)
    }
  }
}
if (missingParams.length > 0) {
  console.warn('缺少必要参数:', missingParams)
}

return config`,
      postResponseScript: `// 转换为图表数据格式 - 兼容多种响应格式
console.log('🔍 [响应脚本] 原始响应:', response)

// 尝试多种可能的数据路径
let data = null
if (response && typeof response === 'object') {
  // 尝试 response.data
  if (Array.isArray(response.data)) {
    data = response.data
  }
  // 尝试 response.result  
  else if (Array.isArray(response.result)) {
    data = response.result
  }
  // 尝试 response 本身就是数组
  else if (Array.isArray(response)) {
    data = response
  }
  // 尝试其他可能的字段
  else if (response.list && Array.isArray(response.list)) {
    data = response.list
  }
}

console.log('🔍 [响应脚本] 提取的数据:', data)

if (data && Array.isArray(data)) {
  const result = data.map(item => [item.x || item.timestamp || item.time, item.y || item.value || item.val])
  console.log('🔍 [响应脚本] 转换后数据:', result)
  return result
}

console.log('🔍 [响应脚本] 无法转换，返回原始响应')
return response`
    }
  }
]
