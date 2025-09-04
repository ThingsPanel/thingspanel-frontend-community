/**
 * HTTP配置类型定义（完善版）
 * 基于SUBTASK-008完善版文档设计
 */

/**
 * HTTP参数统一接口
 * 支持路径参数、查询参数、请求头参数的统一管理
 */
export interface HttpParameter {
  /** 参数键名 */
  key: string

  /** 参数值 - 示例值，类型与dataType匹配 */
  value: string | number | boolean

  /** 默认值 - 当value为空时使用的回退值 */
  defaultValue?: string | number | boolean

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

  /** 参数类型：路径参数直接拼接到URL后，查询参数作为query，请求头参数作为header */
  paramType: 'path' | 'query' | 'header'

  /** 参数值模式：手动输入、下拉选择、属性绑定等 */
  valueMode?: string

  /** 选中的模板ID */
  selectedTemplate?: string
}

/**
 * HTTP请求头配置 - 为了向后兼容保留
 * @deprecated 建议使用统一的HttpParameter with paramType: 'header'
 */
export interface HttpHeader extends HttpParameter {}

/**
 * HTTP查询参数配置 - 为了向后兼容保留
 * @deprecated 建议使用统一的HttpParameter with paramType: 'query'
 */
export interface HttpParam extends HttpParameter {}

/**
 * HTTP路径参数配置 - 为了向后兼容保留
 * @deprecated 建议使用统一的HttpParameter with paramType: 'path'
 */
export interface HttpPathParam extends HttpParameter {
  /** 路径参数名（不带大括号），如 'device_id' */
  key: string
  /** 在URL中的占位符格式，如 '{device_id}' */
  placeholder: string
}

/**
 * 路径参数简化配置
 * 只支持单个路径参数，直接拼接到URL后
 */
export interface PathParameter {
  /** 参数值 - 示例值，类型与dataType匹配 */
  value: string | number | boolean

  /** 默认值 - 当value为空时使用的回退值 */
  defaultValue?: string | number | boolean

  /** 是否为动态参数 */
  isDynamic: boolean

  /** 数据类型，用于类型转换和验证 */
  dataType: 'string' | 'number' | 'boolean' | 'json'

  /** 动态时自动生成：var_path_param */
  variableName: string

  /** 参数说明 */
  description: string

  /** 参数值模式：手动输入、下拉选择、属性绑定等 */
  valueMode?: string

  /** 选中的模板ID */
  selectedTemplate?: string
}

// 导入EnhancedParameter类型
import type { EnhancedParameter } from './parameter-editor'

/**
 * HTTP配置接口（简化路径参数版本）
 */
export interface HttpConfig {
  /** 基础请求URL（路径参数会拼接到此URL后） */
  url: string

  /** HTTP方法 */
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'

  /** 超时时间（毫秒） */
  timeout: number

  /** 地址类型：内部地址还是外部地址 */
  addressType?: 'internal' | 'external'

  /** 选中的内部地址值（当addressType为internal时使用） */
  selectedInternalAddress?: string

  /** 是否启用传参（用于内部地址的路径参数配置） */
  enableParams?: boolean

  /** 路径参数配置数组（新格式，支持多个参数） */
  pathParams?: EnhancedParameter[]

  /** 路径参数（可选，单个参数直接拼接到URL后） */
  pathParameter?: PathParameter

  /** 查询参数配置 */
  params: HttpParam[]

  /** 请求头配置 */
  headers: HttpHeader[]

  /** 请求体（可选） */
  body?: string

  /** 请求前处理脚本（可选） */
  preRequestScript?: string

  /** 响应后处理脚本（可选） */
  postResponseScript?: string

  // 向后兼容字段（已弃用）
  /** @deprecated 使用简化的 pathParameter 字段替代 */
  pathParams?: HttpPathParam[]
  /** @deprecated 使用新的统一 parameters 字段替代 */
  parameters?: HttpParameter[]
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
 * 创建默认路径参数
 */
export function createDefaultPathParameter(): PathParameter {
  return {
    value: '',
    isDynamic: false, // 默认为静态
    dataType: 'string',
    variableName: 'var_path_param',
    description: '路径参数'
  }
}

/**
 * 创建默认HTTP参数 (向后兼容)
 * @deprecated 建议使用具体的创建函数
 */
export function createDefaultHttpParameter(paramType: 'path' | 'query' | 'header' = 'query'): HttpParameter {
  return {
    key: '',
    value: '',
    enabled: true,
    isDynamic: paramType === 'path', // 路径参数默认为动态
    dataType: 'string',
    variableName: '',
    description: '',
    paramType
  }
}

/**
 * 创建默认HttpHeader - 向后兼容
 * @deprecated 使用 createDefaultHttpParameter('header') 替代
 */
export function createDefaultHttpHeader(): HttpHeader {
  return createDefaultHttpParameter('header') as HttpHeader
}

/**
 * 创建默认HttpParam - 向后兼容
 * @deprecated 使用 createDefaultHttpParameter('query') 替代
 */
export function createDefaultHttpParam(): HttpParam {
  return createDefaultHttpParameter('query') as HttpParam
}

/**
 * 创建默认HttpPathParam - 向后兼容
 * @deprecated 使用 createDefaultHttpParameter('path') 替代
 */
export function createDefaultHttpPathParam(): HttpPathParam {
  const baseParam = createDefaultHttpParameter('path')
  return {
    ...baseParam,
    placeholder: `{${baseParam.key}}`
  } as HttpPathParam
}

/**
 * 从URL自动提取路径参数
 * @param url - 包含路径参数的URL，如 '/api/device/{device_id}/data/{metric_id}'
 * @returns 路径参数配置数组
 */
export function extractPathParamsFromUrl(url: string): HttpPathParam[] {
  const pathParamRegex = /\{([^}]+)\}/g
  const params: HttpPathParam[] = []
  let match

  while ((match = pathParamRegex.exec(url)) !== null) {
    const key = match[1]
    const placeholder = match[0] // 完整的 {parameter}

    params.push({
      key,
      placeholder,
      value: `example_${key}`,
      enabled: true,
      isDynamic: true,
      dataType: 'string',
      variableName: generateVariableName(key),
      description: `路径参数：${key}`
    })
  }

  return params
}

/**
 * 替换URL中的路径参数
 * @param url - 原始URL
 * @param pathParams - 路径参数配置
 * @returns 替换后的URL
 */
export function replaceUrlPathParams(url: string, pathParams: HttpPathParam[]): string {
  let resultUrl = url

  for (const param of pathParams) {
    if (param.enabled && param.value) {
      resultUrl = resultUrl.replace(param.placeholder, String(param.value))
    }
  }

  return resultUrl
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
      .replace(/^_|_$/, '') // 去掉首尾下划线
  }`
}
