/**
 * 数据源配置验证器
 * 提供统一的数据源配置验证和错误处理机制
 */

import type {
  DataSourceConfig,
  StaticDataSourceConfig,
  ApiDataSourceConfig,
  WebSocketDataSourceConfig,
  ScriptDataSourceConfig,
  DeviceDataSourceConfig,
  DataMappingConfig,
  ValidationResult,
  IDataSourceValidator,
  DataSourceError,
  DataSourceErrorType
} from './data-source-types'
import { DataSourceType } from './data-source-types'

/**
 * 验证规则接口
 */
interface ValidationRule {
  /** 规则名称 */
  name: string
  /** 验证函数 */
  validator: (value: any, config?: any) => boolean | string
  /** 错误消息 */
  message: string
  /** 是否为必填验证 */
  required?: boolean
}

/**
 * URL验证工具
 */
class URLValidator {
  /**
   * 验证URL格式
   */
  static isValidURL(url: string): boolean {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  /**
   * 验证HTTP URL
   */
  static isValidHttpURL(url: string): boolean {
    try {
      const parsed = new URL(url)
      return ['http:', 'https:'].includes(parsed.protocol)
    } catch {
      return false
    }
  }

  /**
   * 验证WebSocket URL
   */
  static isValidWebSocketURL(url: string): boolean {
    try {
      const parsed = new URL(url)
      return ['ws:', 'wss:'].includes(parsed.protocol)
    } catch {
      return false
    }
  }
}

/**
 * JSON验证工具
 */
class JSONValidator {
  /**
   * 验证JSON字符串
   */
  static isValidJSON(str: string): boolean {
    try {
      JSON.parse(str)
      return true
    } catch {
      return false
    }
  }

  /**
   * 验证并解析JSON
   */
  static parseJSON(str: string): any {
    try {
      return JSON.parse(str)
    } catch (error) {
      throw new Error(`JSON解析失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }
}

/**
 * 脚本验证工具
 */
class ScriptValidator {
  /**
   * 验证JavaScript代码语法
   */
  static isValidJavaScript(code: string): boolean {
    try {
      // 简单的语法检查
      new Function(code)
      return true
    } catch {
      return false
    }
  }

  /**
   * 检查危险代码
   */
  static hasDangerousCode(code: string): boolean {
    const dangerousPatterns = [
      /eval\s*\(/,
      /Function\s*\(/,
      /setTimeout\s*\(/,
      /setInterval\s*\(/,
      /document\./,
      /window\./,
      /global\./,
      /process\./,
      /require\s*\(/,
      /import\s+/,
      /fetch\s*\(/,
      /XMLHttpRequest/
    ]

    return dangerousPatterns.some(pattern => pattern.test(code))
  }
}

/**
 * 数据源配置验证器实现
 */
export class DataSourceValidator implements IDataSourceValidator {
  private validationRules: Map<string, ValidationRule[]> = new Map()

  constructor() {
    this.initializeValidationRules()
  }

  /**
   * 初始化验证规则
   */
  private initializeValidationRules(): void {
    // 静态数据源验证规则
    this.validationRules.set(DataSourceType.STATIC, [
      {
        name: 'data_required',
        validator: (config: StaticDataSourceConfig) => config.data !== undefined && config.data !== null,
        message: '静态数据源必须提供数据内容',
        required: true
      },
      {
        name: 'data_format',
        validator: (config: StaticDataSourceConfig) => {
          if (config.format === 'json' && typeof config.data === 'string') {
            return JSONValidator.isValidJSON(config.data)
          }
          return true
        },
        message: '当格式为JSON时，数据必须是有效的JSON字符串'
      }
    ])

    // API数据源验证规则
    this.validationRules.set(DataSourceType.API, [
      {
        name: 'url_required',
        validator: (config: ApiDataSourceConfig) => !!config.url,
        message: 'API数据源必须提供URL地址',
        required: true
      },
      {
        name: 'url_format',
        validator: (config: ApiDataSourceConfig) => URLValidator.isValidHttpURL(config.url),
        message: 'API URL必须是有效的HTTP或HTTPS地址'
      },
      {
        name: 'method_valid',
        validator: (config: ApiDataSourceConfig) => {
          const validMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
          return validMethods.includes(config.method)
        },
        message: 'HTTP方法必须是GET、POST、PUT、DELETE或PATCH之一'
      },
      {
        name: 'headers_format',
        validator: (config: ApiDataSourceConfig) => {
          if (!config.headers) return true
          return typeof config.headers === 'object' && config.headers !== null
        },
        message: '请求头必须是有效的对象格式'
      },
      {
        name: 'body_format',
        validator: (config: ApiDataSourceConfig) => {
          if (!config.body || config.method === 'GET') return true
          if (typeof config.body === 'string') {
            return JSONValidator.isValidJSON(config.body)
          }
          return typeof config.body === 'object'
        },
        message: '请求体必须是有效的JSON字符串或对象'
      }
    ])

    // WebSocket数据源验证规则
    this.validationRules.set(DataSourceType.WEBSOCKET, [
      {
        name: 'url_required',
        validator: (config: WebSocketDataSourceConfig) => !!config.url,
        message: 'WebSocket数据源必须提供URL地址',
        required: true
      },
      {
        name: 'url_format',
        validator: (config: WebSocketDataSourceConfig) => URLValidator.isValidWebSocketURL(config.url),
        message: 'WebSocket URL必须是有效的WS或WSS地址'
      },
      {
        name: 'protocols_format',
        validator: (config: WebSocketDataSourceConfig) => {
          if (!config.protocols) return true
          return Array.isArray(config.protocols) && config.protocols.every(p => typeof p === 'string')
        },
        message: '协议列表必须是字符串数组'
      },
      {
        name: 'reconnect_interval',
        validator: (config: WebSocketDataSourceConfig) => {
          if (!config.reconnectInterval) return true
          return typeof config.reconnectInterval === 'number' && config.reconnectInterval > 0
        },
        message: '重连间隔必须是正数'
      }
    ])

    // 脚本数据源验证规则
    this.validationRules.set(DataSourceType.SCRIPT, [
      {
        name: 'script_required',
        validator: (config: ScriptDataSourceConfig) => !!config.script,
        message: '脚本数据源必须提供脚本代码',
        required: true
      },
      {
        name: 'script_syntax',
        validator: (config: ScriptDataSourceConfig) => ScriptValidator.isValidJavaScript(config.script),
        message: '脚本代码语法错误'
      },
      {
        name: 'script_safety',
        validator: (config: ScriptDataSourceConfig) => !ScriptValidator.hasDangerousCode(config.script),
        message: '脚本包含可能的危险代码，请检查'
      }
    ])

    // 设备数据源验证规则
    this.validationRules.set(DataSourceType.DEVICE, [
      {
        name: 'device_id_required',
        validator: (config: DeviceDataSourceConfig) => !!config.deviceId,
        message: '设备数据源必须提供设备ID',
        required: true
      },
      {
        name: 'api_type_required',
        validator: (config: DeviceDataSourceConfig) => !!config.apiType,
        message: '设备数据源必须指定API类型',
        required: true
      },
      {
        name: 'api_type_valid',
        validator: (config: DeviceDataSourceConfig) => {
          const validTypes = [
            'telemetryDataCurrentKeys',
            'getAttributeDataSet',
            'getAttributeDatasKey',
            'telemetryDataHistoryList'
          ]
          return validTypes.includes(config.apiType)
        },
        message: 'API类型必须是支持的类型之一'
      },
      {
        name: 'parameters_required',
        validator: (config: DeviceDataSourceConfig) => {
          return config.parameters && typeof config.parameters === 'object'
        },
        message: '设备数据源必须提供API参数'
      }
    ])

    console.log('✅ [DataSourceValidator] 验证规则初始化完成')
  }

  /**
   * 验证数据源配置
   */
  validateConfig(config: DataSourceConfig): ValidationResult {
    console.log('🔍 [DataSourceValidator] 验证数据源配置:', config.type)

    const errors: string[] = []
    const warnings: string[] = []

    try {
      // 基本配置验证
      if (!config.type) {
        errors.push('数据源类型不能为空')
        return { valid: false, errors, warnings }
      }

      if (!config.name) {
        warnings.push('建议为数据源设置名称')
      }

      // 获取对应类型的验证规则
      const rules = this.validationRules.get(config.type)
      if (!rules) {
        warnings.push(`未找到数据源类型 ${config.type} 的验证规则`)
        return { valid: errors.length === 0, errors, warnings }
      }

      // 执行验证规则
      for (const rule of rules) {
        try {
          const result = rule.validator(config as any)

          if (result === false) {
            if (rule.required) {
              errors.push(rule.message)
            } else {
              warnings.push(rule.message)
            }
          } else if (typeof result === 'string') {
            // 自定义错误消息
            if (rule.required) {
              errors.push(result)
            } else {
              warnings.push(result)
            }
          }
        } catch (error) {
          const errorMsg = `验证规则 ${rule.name} 执行失败: ${error instanceof Error ? error.message : '未知错误'}`
          errors.push(errorMsg)
        }
      }
    } catch (error) {
      const errorMsg = `配置验证过程中发生错误: ${error instanceof Error ? error.message : '未知错误'}`
      errors.push(errorMsg)
    }

    const result = {
      valid: errors.length === 0,
      errors,
      warnings
    }

    console.log('📊 [DataSourceValidator] 验证结果:', result)
    return result
  }

  /**
   * 验证数据映射配置
   */
  validateDataMapping(mapping: DataMappingConfig): ValidationResult {
    console.log('🔍 [DataSourceValidator] 验证数据映射配置')

    const errors: string[] = []
    const warnings: string[] = []

    if (!mapping.paths || !Array.isArray(mapping.paths)) {
      errors.push('数据映射路径列表不能为空')
      return { valid: false, errors, warnings }
    }

    // 验证每个映射路径
    mapping.paths.forEach((path, index) => {
      if (!path.key) {
        errors.push(`映射路径 ${index + 1} 的源路径不能为空`)
      }

      if (!path.target) {
        errors.push(`映射路径 ${index + 1} 的目标字段不能为空`)
      }

      // 检查数组模式配置
      if (path.arrayMode === 'index' && (path.arrayIndex === undefined || path.arrayIndex < 0)) {
        warnings.push(`映射路径 ${index + 1} 使用索引模式但未指定有效索引`)
      }

      // 检查转换函数
      if (path.transformer && typeof path.transformer !== 'function') {
        errors.push(`映射路径 ${index + 1} 的转换函数必须是函数类型`)
      }
    })

    // 检查目标字段重复
    const targets = mapping.paths.map(p => p.target)
    const duplicates = targets.filter((target, index) => targets.indexOf(target) !== index)
    if (duplicates.length > 0) {
      warnings.push(`存在重复的目标字段: ${duplicates.join(', ')}`)
    }

    const result = {
      valid: errors.length === 0,
      errors,
      warnings
    }

    console.log('📊 [DataSourceValidator] 数据映射验证结果:', result)
    return result
  }

  /**
   * 验证数据源连接
   */
  async validateConnection(config: DataSourceConfig): Promise<ValidationResult> {
    console.log('🔗 [DataSourceValidator] 验证数据源连接:', config.type)

    const errors: string[] = []
    const warnings: string[] = []

    try {
      switch (config.type) {
        case DataSourceType.API:
        case DataSourceType.HTTP:
          return await this.validateHttpConnection(config as ApiDataSourceConfig)

        case DataSourceType.WEBSOCKET:
          return await this.validateWebSocketConnection(config as WebSocketDataSourceConfig)

        case DataSourceType.STATIC:
          // 静态数据源无需连接验证
          return { valid: true, errors: [], warnings: [] }

        case DataSourceType.SCRIPT:
          return this.validateScriptExecution(config as ScriptDataSourceConfig)

        case DataSourceType.DEVICE:
          return this.validateDeviceConnection(config as DeviceDataSourceConfig)

        default:
          warnings.push(`暂不支持 ${config.type} 类型的连接验证`)
          return { valid: true, errors, warnings }
      }
    } catch (error) {
      const errorMsg = `连接验证失败: ${error instanceof Error ? error.message : '未知错误'}`
      errors.push(errorMsg)
      return { valid: false, errors, warnings }
    }
  }

  /**
   * 验证HTTP连接
   */
  private async validateHttpConnection(config: ApiDataSourceConfig): Promise<ValidationResult> {
    const errors: string[] = []
    const warnings: string[] = []

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000) // 5秒超时

      // 构建请求选项
      const options: RequestInit = {
        method: 'HEAD', // 使用HEAD方法减少数据传输
        signal: controller.signal,
        headers: config.headers || {}
      }

      const response = await fetch(config.url, options)
      clearTimeout(timeoutId)

      if (!response.ok) {
        if (response.status >= 400 && response.status < 500) {
          errors.push(`客户端错误: ${response.status} ${response.statusText}`)
        } else if (response.status >= 500) {
          errors.push(`服务器错误: ${response.status} ${response.statusText}`)
        } else {
          warnings.push(`非标准响应: ${response.status} ${response.statusText}`)
        }
      }

      // 检查响应头
      const contentType = response.headers.get('content-type')
      if (contentType && !contentType.includes('application/json')) {
        warnings.push(`响应类型为 ${contentType}，可能不是JSON格式`)
      }
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errors.push('连接超时，请检查网络或URL地址')
        } else if (error.name === 'TypeError') {
          errors.push('网络错误，请检查URL地址和网络连接')
        } else {
          errors.push(`连接失败: ${error.message}`)
        }
      } else {
        errors.push('连接失败: 未知错误')
      }
    }

    return { valid: errors.length === 0, errors, warnings }
  }

  /**
   * 验证WebSocket连接
   */
  private async validateWebSocketConnection(config: WebSocketDataSourceConfig): Promise<ValidationResult> {
    const errors: string[] = []
    const warnings: string[] = []

    return new Promise(resolve => {
      try {
        const ws = new WebSocket(config.url, config.protocols)
        let resolved = false

        const timeout = setTimeout(() => {
          if (!resolved) {
            resolved = true
            ws.close()
            errors.push('WebSocket连接超时')
            resolve({ valid: false, errors, warnings })
          }
        }, 5000)

        ws.onopen = () => {
          if (!resolved) {
            resolved = true
            clearTimeout(timeout)
            ws.close()
            resolve({ valid: true, errors, warnings })
          }
        }

        ws.onerror = () => {
          if (!resolved) {
            resolved = true
            clearTimeout(timeout)
            errors.push('WebSocket连接失败')
            resolve({ valid: false, errors, warnings })
          }
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : '未知错误'
        errors.push(`WebSocket连接异常: ${errorMsg}`)
        resolve({ valid: false, errors, warnings })
      }
    })
  }

  /**
   * 验证脚本执行
   */
  private validateScriptExecution(config: ScriptDataSourceConfig): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    try {
      // 创建安全的执行环境
      const safeContext = {
        console: {
          log: () => {},
          warn: () => {},
          error: () => {}
        },
        Math,
        Date,
        JSON
      }

      // 简单的脚本执行测试
      const func = new Function(
        'context',
        `
        const { console, Math, Date, JSON } = context;
        ${config.script}
      `
      )

      func(safeContext)
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '未知错误'
      errors.push(`脚本执行失败: ${errorMsg}`)
    }

    return { valid: errors.length === 0, errors, warnings }
  }

  /**
   * 验证设备连接
   */
  private validateDeviceConnection(config: DeviceDataSourceConfig): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    // 设备连接验证需要依赖实际的设备API
    // 这里进行基本的配置检查
    if (!config.parameters.device_id) {
      errors.push('设备API参数中必须包含device_id')
    }

    // 根据API类型检查必要参数
    switch (config.apiType) {
      case 'telemetryDataCurrentKeys':
        if (!config.parameters.keys) {
          errors.push('telemetryDataCurrentKeys API需要keys参数')
        }
        break

      case 'getAttributeDatasKey':
        if (!config.parameters.key) {
          errors.push('getAttributeDatasKey API需要key参数')
        }
        break

      case 'telemetryDataHistoryList':
        if (!config.parameters.key) {
          errors.push('telemetryDataHistoryList API需要key参数')
        }
        if (!config.parameters.time_range) {
          warnings.push('建议为历史数据API指定时间范围')
        }
        break
    }

    return { valid: errors.length === 0, errors, warnings }
  }

  /**
   * 创建数据源错误
   */
  static createError(
    type: DataSourceErrorType,
    message: string,
    code?: string,
    details?: any,
    retryable: boolean = false
  ): DataSourceError {
    const error = new Error(message) as DataSourceError
    error.type = type
    error.code = code
    error.details = details
    error.retryable = retryable
    return error
  }
}

// 导出单例实例
export const dataSourceValidator = new DataSourceValidator()

export default dataSourceValidator
