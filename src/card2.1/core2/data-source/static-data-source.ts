/**
 * 静态数据源实现
 * 支持JSON数据的解析和字段映射
 */

import { smartDeepClone } from '@/utils/deep-clone'

export interface StaticDataSourceConfig {
  id: string
  type: 'static'
  name?: string
  data: any
  fieldMappings: {
    [componentField: string]: string // 数据路径，如 'temperature' 或 'sensor.value'
  }
}

export interface DataSourceValue {
  [fieldName: string]: any
}

/**
 * 静态数据源处理器
 */
export class StaticDataSource {
  private config: StaticDataSourceConfig

  constructor(config: StaticDataSourceConfig) {
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
   * 获取原始数据
   */
  getRawData(): any {
    return this.config.data
  }

  /**
   * 获取字段映射配置
   */
  getFieldMappings(): Record<string, string> {
    return this.config.fieldMappings
  }

  /**
   * 根据映射配置提取数据
   */
  async getValue(): Promise<DataSourceValue> {
    const result: DataSourceValue = {}

    for (const [componentField, dataPath] of Object.entries(this.config.fieldMappings)) {
      try {
        const value = this.extractValueByPath(this.config.data, dataPath)
        result[componentField] = value
      } catch (error) {
        result[componentField] = undefined
      }
    }

    return result
  }

  /**
   * 根据路径提取值（支持嵌套对象）
   */
  private extractValueByPath(data: any, path: string): any {
    if (!path || path === '') {
      return data
    }

    // 简单的路径解析：支持 'field' 和 'field.subfield' 格式
    const pathParts = path.split('.')
    let current = data

    for (const part of pathParts) {
      if (current === null || current === undefined) {
        return undefined
      }

      if (typeof current === 'object' && part in current) {
        current = current[part]
      } else {
        return undefined
      }
    }

    return current
  }

  /**
   * 更新数据源配置
   */
  updateConfig(newConfig: Partial<StaticDataSourceConfig>) {
    this.config = { ...this.config, ...newConfig }
  }

  /**
   * 验证数据路径是否有效
   */
  validatePath(path: string): boolean {
    try {
      const value = this.extractValueByPath(this.config.data, path)
      return value !== undefined
    } catch {
      return false
    }
  }

  /**
   * 获取可用的数据路径
   */
  getAvailablePaths(): Array<{ path: string; type: string; value: any }> {
    const paths: Array<{ path: string; type: string; value: any }> = []

    this.collectPaths(this.config.data, '', paths)

    return paths
  }

  /**
   * 递归收集所有可用路径
   */
  private collectPaths(obj: any, currentPath: string, paths: Array<{ path: string; type: string; value: any }>) {
    if (obj === null || obj === undefined) {
      return
    }

    if (typeof obj === 'object' && !Array.isArray(obj)) {
      for (const [key, value] of Object.entries(obj)) {
        const newPath = currentPath ? `${currentPath}.${key}` : key

        // 添加当前路径
        paths.push({
          path: newPath,
          type: Array.isArray(value) ? 'array' : typeof value,
          value: value
        })

        // 如果是对象，继续递归（限制深度避免无限递归）
        if (typeof value === 'object' && value !== null && !Array.isArray(value) && currentPath.split('.').length < 5) {
          this.collectPaths(value, newPath, paths)
        }
      }
    }
  }

  /**
   * 预览字段映射结果
   */
  previewMapping(fieldMappings: Record<string, string>): Record<string, any> {
    const preview: Record<string, any> = {}

    for (const [componentField, dataPath] of Object.entries(fieldMappings)) {
      try {
        preview[componentField] = this.extractValueByPath(this.config.data, dataPath)
      } catch {
        preview[componentField] = undefined
      }
    }

    return preview
  }

  /**
   * 克隆数据源
   */
  clone(): StaticDataSource {
    return new StaticDataSource({
      ...this.config,
      data: smartDeepClone(this.config.data) // 使用智能深拷贝
    })
  }

  /**
   * 导出配置
   */
  exportConfig(): StaticDataSourceConfig {
    return { ...this.config }
  }
}

/**
 * 静态数据源工厂
 */
export class StaticDataSourceFactory {
  /**
   * 创建静态数据源
   */
  static create(config: StaticDataSourceConfig): StaticDataSource {
    return new StaticDataSource(config)
  }

  /**
   * 从JSON字符串创建数据源
   */
  static createFromJson(id: string, jsonString: string, fieldMappings: Record<string, string> = {}): StaticDataSource {
    try {
      const data = JSON.parse(jsonString)
      return new StaticDataSource({
        id,
        type: 'static',
        data,
        fieldMappings
      })
    } catch (error) {
      throw new Error(`无效的JSON数据: ${error instanceof Error ? error.message : '解析错误'}`)
    }
  }

  /**
   * 创建示例数据源
   */
  static createSample(id: string): StaticDataSource {
    return new StaticDataSource({
      id,
      type: 'static',
      name: '示例数据源',
      data: {
        temperature: 25.6,
        humidity: 68.2,
        title: '温度传感器',
        unit: '°C',
        status: 'normal',
        sensor: {
          name: '传感器001',
          location: '机房A',
          value: 42.5
        }
      },
      fieldMappings: {
        value: 'temperature',
        title: 'title',
        unit: 'unit'
      }
    })
  }
}

export default StaticDataSource
