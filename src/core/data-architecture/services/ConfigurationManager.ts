/**
 * ConfigurationManager - 简易配置管理服务
 * 提供配置验证、模板管理、存储功能
 */

import type { DataSourceConfiguration, ValidationResult } from '../types'
import { smartDeepClone } from '@/utils/deep-clone'

export interface ConfigurationTemplate {
  id: string
  name: string
  description: string
  configuration: DataSourceConfiguration
  category: 'basic' | 'advanced' | 'example'
  tags: string[]
}

/**
 * 配置管理器类
 */
export class ConfigurationManager {
  private templates: ConfigurationTemplate[] = []

  constructor() {
    this.initializeBuiltinTemplates()
  }

  /**
   * 初始化内置模板
   */
  private initializeBuiltinTemplates() {
    this.templates = [
      {
        id: 'json-basic',
        name: 'JSON基础示例',
        description: '简单的JSON数据配置示例',
        category: 'basic',
        tags: ['json', 'static', 'basic'],
        configuration: {
          componentId: 'example-component',
          dataSources: [
            {
              sourceId: 'basic_json',
              dataItems: [
                {
                  item: {
                    type: 'json',
                    config: {
                      jsonString: JSON.stringify(
                        {
                          temperature: 25,
                          humidity: 60,
                          status: 'normal',
                          timestamp: new Date().toISOString()
                        },
                        null,
                        2
                      )
                    }
                  },
                  processing: {
                    filterPath: '$',
                    defaultValue: {}
                  }
                }
              ],
              mergeStrategy: { type: 'object' }
            }
          ],
          createdAt: Date.now(),
          updatedAt: Date.now()
        }
      },
      {
        id: 'http-api',
        name: 'HTTP API示例',
        description: 'RESTful API数据获取配置',
        category: 'basic',
        tags: ['http', 'api', 'dynamic'],
        configuration: {
          componentId: 'api-component',
          dataSources: [
            {
              sourceId: 'api_data',
              dataItems: [
                {
                  item: {
                    type: 'http',
                    config: {
                      url: '/api/sensors/current',
                      method: 'GET'
                    }
                  },
                  processing: {
                    filterPath: '$.data',
                    defaultValue: []
                  }
                }
              ],
              mergeStrategy: { type: 'object' }
            }
          ],
          createdAt: Date.now(),
          updatedAt: Date.now()
        }
      },
      {
        id: 'script-generated',
        name: '脚本生成示例',
        description: '通过JavaScript动态生成数据',
        category: 'advanced',
        tags: ['script', 'dynamic', 'computed'],
        configuration: {
          componentId: 'script-component',
          dataSources: [
            {
              sourceId: 'script_gen',
              dataItems: [
                {
                  item: {
                    type: 'script',
                    config: {
                      script: `
// 生成模拟传感器数据
const sensorData = {
  timestamp: Date.now(),
  temperature: Math.round(20 + Math.random() * 20),
  humidity: Math.round(40 + Math.random() * 40),
  pressure: Math.round(1000 + Math.random() * 50),
  status: Math.random() > 0.8 ? 'warning' : 'normal'
}
return sensorData
                  `.trim()
                    }
                  },
                  processing: {
                    filterPath: '$',
                    defaultValue: {}
                  }
                }
              ],
              mergeStrategy: { type: 'object' }
            }
          ],
          createdAt: Date.now(),
          updatedAt: Date.now()
        }
      },
      {
        id: 'multi-source',
        name: '多源整合示例',
        description: '多个数据源合并处理的完整示例',
        category: 'example',
        tags: ['multi-source', 'merge', 'complex'],
        configuration: {
          componentId: 'multi-source-component',
          dataSources: [
            {
              sourceId: 'sensor_data',
              dataItems: [
                {
                  item: {
                    type: 'json',
                    config: {
                      jsonString: JSON.stringify(
                        {
                          sensors: [
                            { id: 1, type: 'temperature', value: 25 },
                            { id: 2, type: 'humidity', value: 60 }
                          ]
                        },
                        null,
                        2
                      )
                    }
                  },
                  processing: {
                    filterPath: '$.sensors',
                    defaultValue: []
                  }
                }
              ],
              mergeStrategy: { type: 'array' }
            },
            {
              sourceId: 'metadata',
              dataItems: [
                {
                  item: {
                    type: 'script',
                    config: {
                      script: `
return {
  timestamp: Date.now(),
  location: "测试区域",
  deviceId: "DEVICE_" + Math.random().toString(36).substring(7),
  version: "1.0.0"
}
                    `.trim()
                    }
                  },
                  processing: {
                    filterPath: '$',
                    defaultValue: {}
                  }
                }
              ],
              mergeStrategy: { type: 'object' }
            }
          ],
          createdAt: Date.now(),
          updatedAt: Date.now()
        }
      }
    ]
  }

  /**
   * 获取所有内置模板
   */
  getBuiltinTemplates(): ConfigurationTemplate[] {
    return this.templates
  }

  /**
   * 根据ID获取模板
   */
  getTemplate(id: string): ConfigurationTemplate | undefined {
    return this.templates.find(t => t.id === id)
  }

  /**
   * 根据分类获取模板
   */
  getTemplatesByCategory(category: string): ConfigurationTemplate[] {
    return this.templates.filter(t => t.category === category)
  }

  /**
   * 验证配置
   */
  validateConfiguration(config: DataSourceConfiguration): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    // 基础结构验证
    if (!config.componentId) {
      errors.push('组件ID不能为空')
    }

    if (!config.dataSources || config.dataSources.length === 0) {
      errors.push('至少需要配置一个数据源')
    }

    // 数据源验证
    config.dataSources?.forEach((dataSource, dsIndex) => {
      if (!dataSource.sourceId) {
        errors.push(`数据源 ${dsIndex + 1}: sourceId不能为空`)
      }

      if (!dataSource.dataItems || dataSource.dataItems.length === 0) {
        errors.push(`数据源 ${dsIndex + 1}: 至少需要一个数据项`)
      }

      // 数据项验证
      dataSource.dataItems?.forEach((dataItem, diIndex) => {
        if (!dataItem.item.type) {
          errors.push(`数据源 ${dsIndex + 1}, 数据项 ${diIndex + 1}: 数据类型不能为空`)
        }

        // 类型特定验证
        switch (dataItem.item.type) {
          case 'json':
            if (!dataItem.item.config.jsonString) {
              errors.push(`数据源 ${dsIndex + 1}, 数据项 ${diIndex + 1}: JSON内容不能为空`)
            } else {
              try {
                JSON.parse(dataItem.item.config.jsonString)
              } catch (e) {
                errors.push(`数据源 ${dsIndex + 1}, 数据项 ${diIndex + 1}: JSON格式错误`)
              }
            }
            break
          case 'http':
            if (!dataItem.item.config.url) {
              errors.push(`数据源 ${dsIndex + 1}, 数据项 ${diIndex + 1}: HTTP URL不能为空`)
            }
            if (!dataItem.item.config.method) {
              warnings.push(`数据源 ${dsIndex + 1}, 数据项 ${diIndex + 1}: 建议指定HTTP方法`)
            }
            break
          case 'script':
            if (!dataItem.item.config.script) {
              errors.push(`数据源 ${dsIndex + 1}, 数据项 ${diIndex + 1}: 脚本内容不能为空`)
            }
            break
        }

        // 处理配置验证
        if (!dataItem.processing.filterPath) {
          warnings.push(`数据源 ${dsIndex + 1}, 数据项 ${diIndex + 1}: 建议设置过滤路径`)
        }
      })

      // 合并策略验证
      if (!dataSource.mergeStrategy.type) {
        warnings.push(`数据源 ${dsIndex + 1}: 建议指定合并策略`)
      }
    })

    return {
      valid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * 导出配置为JSON字符串
   */
  exportConfiguration(config: DataSourceConfiguration): string {
    return JSON.stringify(config, null, 2)
  }

  /**
   * 从JSON字符串导入配置
   */
  importConfiguration(jsonString: string): DataSourceConfiguration {
    try {
      const config = JSON.parse(jsonString) as DataSourceConfiguration

      // 基础验证
      if (!config.dataSources || !Array.isArray(config.dataSources)) {
        throw new Error('配置格式错误: dataSources必须是数组')
      }

      // 添加时间戳
      config.updatedAt = Date.now()
      if (!config.createdAt) {
        config.createdAt = Date.now()
      }

      return config
    } catch (error) {
      throw new Error('配置导入失败: ' + (error.message || '格式错误'))
    }
  }

  /**
   * 导出配置为文件
   */
  exportConfigurationAsFile(config: DataSourceConfiguration, filename?: string) {
    const dataStr = this.exportConfiguration(config)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)

    const link = document.createElement('a')
    link.href = url
    link.download = filename || `${config.componentId}-config-${Date.now()}.json`
    link.click()

    URL.revokeObjectURL(url)
  }

  /**
   * 从文件导入配置
   */
  async importConfigurationFromFile(file: File): Promise<DataSourceConfiguration> {
    const text = await file.text()
    return this.importConfiguration(text)
  }

  /**
   * 生成示例配置
   */
  generateExampleConfiguration(componentId: string): DataSourceConfiguration {
    const template = this.getTemplate('json-basic')
    if (template) {
      return {
        ...template.configuration,
        componentId,
        createdAt: Date.now(),
        updatedAt: Date.now()
      }
    }

    // 回退到简单示例
    return {
      componentId,
      dataSources: [
        {
          sourceId: 'example_data',
          dataItems: [
            {
              item: {
                type: 'json',
                config: {
                  jsonString: '{"message": "Hello World", "timestamp": "' + new Date().toISOString() + '"}'
                }
              },
              processing: { filterPath: '$', defaultValue: {} }
            }
          ],
          mergeStrategy: { type: 'object' }
        }
      ],
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
  }

  /**
   * 克隆配置
   */
  cloneConfiguration(config: DataSourceConfiguration, newComponentId?: string): DataSourceConfiguration {
    const cloned = smartDeepClone(config) as DataSourceConfiguration

    if (newComponentId) {
      cloned.componentId = newComponentId
    }

    cloned.createdAt = Date.now()
    cloned.updatedAt = Date.now()

    return cloned
  }

  /**
   * 合并配置
   */
  mergeConfigurations(
    baseConfig: DataSourceConfiguration,
    ...otherConfigs: DataSourceConfiguration[]
  ): DataSourceConfiguration {
    const merged = this.cloneConfiguration(baseConfig)

    otherConfigs.forEach(config => {
      // 合并数据源
      merged.dataSources.push(...config.dataSources)
    })

    merged.updatedAt = Date.now()
    return merged
  }
}

// 创建单例实例
export const configurationManager = new ConfigurationManager()

// 默认导出
export default configurationManager
