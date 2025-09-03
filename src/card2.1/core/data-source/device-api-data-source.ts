/**
 * 设备API数据源实现
 * 支持telemetryDataCurrentKeys等设备API的调用
 */

import { telemetryDataCurrentKeys } from '@/service/api/device'

export interface DeviceApiDataSourceConfig {
  id: string
  type: 'device-api'
  name?: string
  apiType: 'telemetryDataCurrentKeys' // 目前只支持这一个API
  parameters: {
    device_id: string
    keys: string
  }
  fieldMappings: {
    [componentField: string]: string // 数据路径，如 'data[0].value'
  }
}

export interface DeviceApiResponse {
  data: Array<{
    value: any
    name?: string
    unit?: string
    timestamp?: string
  }>
}

/**
 * 设备API数据源处理器
 */
export class DeviceApiDataSource {
  private config: DeviceApiDataSourceConfig
  private lastResponse: DeviceApiResponse | null = null
  private lastFetchTime: Date | null = null

  constructor(config: DeviceApiDataSourceConfig) {
    this.config = config
  }

  /**
   * 获取数据源ID
   */
  getId(): string {
    return this.config.id
  }

  /**
   * 获取数据源类型
   */
  getType(): string {
    return this.config.type
  }

  /**
   * 获取API类型
   */
  getApiType(): string {
    return this.config.apiType
  }

  /**
   * 获取API参数
   */
  getParameters(): any {
    return this.config.parameters
  }

  /**
   * 获取字段映射配置
   */
  getFieldMappings(): Record<string, string> {
    return this.config.fieldMappings
  }

  /**
   * 调用设备API获取数据
   */
  async fetchData(): Promise<DeviceApiResponse> {
    try {
      let response: any

      switch (this.config.apiType) {
        case 'telemetryDataCurrentKeys':
          response = await telemetryDataCurrentKeys({
            device_id: this.config.parameters.device_id,
            keys: this.config.parameters.keys
          })
          break
        default:
          throw new Error(`不支持的API类型: ${this.config.apiType}`)
      }

      this.lastResponse = response
      this.lastFetchTime = new Date()
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * 根据映射配置提取数据
   */
  async getValue(): Promise<Record<string, any>> {
    // 获取最新数据
    const response = await this.fetchData()
    const result: Record<string, any> = {}

    for (const [componentField, dataPath] of Object.entries(this.config.fieldMappings)) {
      try {
        const value = this.extractValueByPath(response, dataPath)
        result[componentField] = value
      } catch (error) {
        result[componentField] = undefined
      }
    }

    return result
  }

  /**
   * 根据路径提取值（支持数组索引）
   */
  private extractValueByPath(data: any, path: string): any {
    if (!path || path === '') {
      return data
    }

    // 解析路径，支持 'data[0].value' 格式
    const pathParts = this.parsePath(path)
    let current = data

    for (const part of pathParts) {
      if (current === null || current === undefined) {
        return undefined
      }

      if (typeof part === 'number') {
        // 数组索引
        if (Array.isArray(current)) {
          current = current[part]
        } else {
          return undefined
        }
      } else {
        // 对象属性
        if (typeof current === 'object' && part in current) {
          current = current[part]
        } else {
          return undefined
        }
      }
    }

    return current
  }

  /**
   * 解析路径字符串，支持数组索引
   */
  private parsePath(path: string): (string | number)[] {
    const parts: (string | number)[] = []
    let current = ''
    let inBrackets = false
    let bracketContent = ''

    for (let i = 0; i < path.length; i++) {
      const char = path[i]

      if (char === '[') {
        if (current) {
          parts.push(current)
          current = ''
        }
        inBrackets = true
        bracketContent = ''
      } else if (char === ']') {
        inBrackets = false
        const index = parseInt(bracketContent, 10)
        if (!isNaN(index)) {
          parts.push(index)
        }
        bracketContent = ''
      } else if (char === '.') {
        if (inBrackets) {
          bracketContent += char
        } else {
          if (current) {
            parts.push(current)
            current = ''
          }
        }
      } else {
        if (inBrackets) {
          bracketContent += char
        } else {
          current += char
        }
      }
    }

    if (current) {
      parts.push(current)
    }

    return parts
  }

  /**
   * 验证数据路径是否有效
   */
  async validatePath(path: string): Promise<boolean> {
    try {
      // 使用缓存的响应或获取新数据
      const response = this.lastResponse || (await this.fetchData())
      const value = this.extractValueByPath(response, path)
      return value !== undefined
    } catch {
      return false
    }
  }

  /**
   * 获取可用的数据路径
   */
  async getAvailablePaths(): Promise<Array<{ path: string; type: string; value: any }>> {
    try {
      // 使用缓存的响应或获取新数据
      const response = this.lastResponse || (await this.fetchData())
      const paths: Array<{ path: string; type: string; value: any }> = []

      this.collectPaths(response, '', paths)

      return paths
    } catch (error) {
      return []
    }
  }

  /**
   * 递归收集所有可用路径
   */
  private collectPaths(obj: any, currentPath: string, paths: Array<{ path: string; type: string; value: any }>) {
    if (obj === null || obj === undefined) {
      return
    }

    if (Array.isArray(obj)) {
      // 数组：只处理前几个元素避免路径过多
      const maxItems = Math.min(obj.length, 3)
      for (let i = 0; i < maxItems; i++) {
        const newPath = currentPath ? `${currentPath}[${i}]` : `[${i}]`
        const item = obj[i]

        paths.push({
          path: newPath,
          type: Array.isArray(item) ? 'array' : typeof item,
          value: item
        })

        // 如果数组元素是对象，继续递归
        if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
          this.collectPaths(item, newPath, paths)
        }
      }
    } else if (typeof obj === 'object') {
      // 对象
      for (const [key, value] of Object.entries(obj)) {
        const newPath = currentPath ? `${currentPath}.${key}` : key

        paths.push({
          path: newPath,
          type: Array.isArray(value) ? 'array' : typeof value,
          value: value
        })

        // 如果值是对象或数组，继续递归
        if (typeof value === 'object' && value !== null) {
          this.collectPaths(value, newPath, paths)
        }
      }
    }
  }

  /**
   * 预览字段映射结果
   */
  async previewMapping(fieldMappings: Record<string, string>): Promise<Record<string, any>> {
    try {
      const response = this.lastResponse || (await this.fetchData())
      const preview: Record<string, any> = {}

      for (const [componentField, dataPath] of Object.entries(fieldMappings)) {
        try {
          preview[componentField] = this.extractValueByPath(response, dataPath)
        } catch {
          preview[componentField] = undefined
        }
      }

      return preview
    } catch (error) {
      return {}
    }
  }

  /**
   * 更新配置
   */
  updateConfig(newConfig: Partial<DeviceApiDataSourceConfig>) {
    this.config = { ...this.config, ...newConfig }
    // 清除缓存，强制重新获取数据
    this.lastResponse = null
    this.lastFetchTime = null
  }

  /**
   * 获取最后获取数据的时间
   */
  getLastFetchTime(): Date | null {
    return this.lastFetchTime
  }

  /**
   * 导出配置
   */
  exportConfig(): DeviceApiDataSourceConfig {
    return { ...this.config }
  }
}

/**
 * 设备API数据源工厂
 */
export class DeviceApiDataSourceFactory {
  /**
   * 创建设备API数据源
   */
  static create(config: DeviceApiDataSourceConfig): DeviceApiDataSource {
    return new DeviceApiDataSource(config)
  }

  /**
   * 创建telemetryDataCurrentKeys数据源
   */
  static createTelemetryDataSource(
    id: string,
    deviceId: string,
    keys: string,
    fieldMappings: Record<string, string> = {}
  ): DeviceApiDataSource {
    return new DeviceApiDataSource({
      id,
      type: 'device-api',
      name: `设备${deviceId}遥测数据`,
      apiType: 'telemetryDataCurrentKeys',
      parameters: {
        device_id: deviceId,
        keys: keys
      },
      fieldMappings
    })
  }

  /**
   * 创建示例设备API数据源
   */
  static createSample(id: string): DeviceApiDataSource {
    return new DeviceApiDataSource({
      id,
      type: 'device-api',
      name: '示例设备API',
      apiType: 'telemetryDataCurrentKeys',
      parameters: {
        device_id: 'sample-device-001',
        keys: 'temperature,humidity'
      },
      fieldMappings: {
        value: 'data[0].value',
        title: 'data[0].name',
        unit: 'data[0].unit'
      }
    })
  }
}

export default DeviceApiDataSource
