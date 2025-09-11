/**
 * 简化的数据源配置生成器
 * 学习自 visual-editor 和 card2.1 系统的核心价值，去除过度复杂性
 */

import type {
  ComponentDataRequirement,
  UserDataSourceInput,
  SimpleDataSourceConfig,
  DataSourceDefinition,
  TriggerConfig,
  ValidationResult,
  MappingPreviewResult
} from '../types/simple-types'

import { SIMPLE_DATA_SOURCE_CONSTANTS } from '@/core/data-architecture/types/simple-types'

/**
 * 简化的配置生成器
 * 职责：接收组件需求和用户输入，生成标准化配置
 */
export class SimpleConfigGenerator {
  /**
   * 生成数据源配置
   * 这是配置器的核心功能：将组件需求和用户输入转换为标准配置
   */
  generateConfig(requirement: ComponentDataRequirement, userInputs: UserDataSourceInput[]): SimpleDataSourceConfig {
    // 基础验证
    this.validateInputs(requirement, userInputs)

    // 生成数据源定义列表
    const dataSources = this.generateDataSources(requirement, userInputs)

    // 生成触发器配置（默认配置，简化处理）
    const triggers = this.generateDefaultTriggers(userInputs)

    // 构建完整配置
    const config: SimpleDataSourceConfig = {
      id: `config_${requirement.componentId}_${Date.now()}`,
      componentId: requirement.componentId,
      dataSources,
      triggers,
      enabled: true
    }
    return config
  }

  /**
   * 基础输入验证
   * 简化版本：只检查关键必填项，避免过度验证
   */
  private validateInputs(requirement: ComponentDataRequirement, userInputs: UserDataSourceInput[]): void {
    if (!requirement.componentId) {
      throw new Error('组件ID不能为空')
    }

    if (!Array.isArray(userInputs) || userInputs.length === 0) {
      throw new Error('用户输入不能为空')
    }

    // 检查必需的数据源是否都有对应的用户输入
    const requiredSources = requirement.dataSources.filter(ds => ds.required)
    const inputSourceIds = userInputs.map(input => input.dataSourceId)

    for (const requiredSource of requiredSources) {
      if (!inputSourceIds.includes(requiredSource.id)) {
        throw new Error(`缺少必需的数据源配置: ${requiredSource.name}`)
      }
    }
  }

  /**
   * 生成数据源定义列表
   * 将用户输入转换为标准的数据源定义
   */
  private generateDataSources(
    requirement: ComponentDataRequirement,
    userInputs: UserDataSourceInput[]
  ): DataSourceDefinition[] {
    const dataSources: DataSourceDefinition[] = []

    for (const userInput of userInputs) {
      // 查找对应的需求定义
      const sourceRequirement = requirement.dataSources.find(ds => ds.id === userInput.dataSourceId)

      if (!sourceRequirement) {
        continue
      }

      // 生成字段映射（简化版）
      const fieldMapping = this.generateFieldMapping(sourceRequirement, userInput)

      // 创建数据源定义
      const dataSourceDef: DataSourceDefinition = {
        id: userInput.dataSourceId,
        type: userInput.type,
        config: userInput.config,
        fieldMapping
      }

      dataSources.push(dataSourceDef)
    }

    return dataSources
  }

  /**
   * 生成字段映射
   * 学习自 visual-editor 的 JSON 路径映射机制，但简化实现
   */
  private generateFieldMapping(
    sourceRequirement: any,
    userInput: UserDataSourceInput
  ): { [targetField: string]: string } | undefined {
    // 如果是静态数据，尝试直接映射
    if (userInput.type === 'static') {
      const fieldMapping: { [key: string]: string } = {}

      // 为每个需求字段生成映射路径
      sourceRequirement.fields?.forEach((field: any) => {
        // 简单映射策略：假设数据结构和字段名匹配
        if (sourceRequirement.structureType === 'object') {
          fieldMapping[field.name] = field.name
        } else if (sourceRequirement.structureType === 'array') {
          fieldMapping[field.name] = `[*].${field.name}`
        }
      })

      return Object.keys(fieldMapping).length > 0 ? fieldMapping : undefined
    }

    // 对于其他数据源类型，暂时不生成映射，由执行器处理
    return undefined
  }

  /**
   * 生成默认触发器配置
   * 简化版本：根据数据源类型生成基础触发器
   */
  private generateDefaultTriggers(userInputs: UserDataSourceInput[]): TriggerConfig[] {
    const triggers: TriggerConfig[] = []

    // 检查是否包含需要轮询的数据源
    const hasApiSource = userInputs.some(input => input.type === 'api')
    const hasWebSocketSource = userInputs.some(input => input.type === 'websocket')

    // API数据源添加定时器触发器
    if (hasApiSource) {
      triggers.push({
        type: 'timer',
        config: {
          interval: SIMPLE_DATA_SOURCE_CONSTANTS.DEFAULT_TRIGGER_INTERVAL,
          immediate: true
        }
      })
    }

    // WebSocket数据源添加WebSocket触发器
    if (hasWebSocketSource) {
      const wsInput = userInputs.find(input => input.type === 'websocket')
      if (wsInput && 'url' in wsInput.config) {
        triggers.push({
          type: 'websocket',
          config: {
            url: (wsInput.config as any).url,
            protocols: (wsInput.config as any).protocols
          }
        })
      }
    }

    // 如果没有特殊触发器，添加手动触发器
    if (triggers.length === 0) {
      triggers.push({
        type: 'manual',
        config: {}
      })
    }

    return triggers
  }

  /**
   * 验证生成的配置
   * 简化版本：基础检查，避免过度验证
   */
  validateConfig(config: SimpleDataSourceConfig): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    // 基础检查
    if (!config.id) errors.push('配置ID不能为空')
    if (!config.componentId) errors.push('组件ID不能为空')
    if (!Array.isArray(config.dataSources) || config.dataSources.length === 0) {
      errors.push('至少需要一个数据源')
    }

    // 检查数据源配置
    config.dataSources.forEach((ds, index) => {
      if (!ds.id) errors.push(`数据源 ${index + 1} 缺少ID`)
      if (!ds.type) errors.push(`数据源 ${index + 1} 缺少类型`)
      if (!ds.config) warnings.push(`数据源 ${index + 1} 缺少配置`)
    })

    // 检查触发器配置
    if (!Array.isArray(config.triggers) || config.triggers.length === 0) {
      warnings.push('建议至少配置一个触发器')
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * 预览字段映射结果
   * 帮助用户理解映射效果
   */
  previewMapping(sourceData: any, fieldMapping: { [targetField: string]: string }): MappingPreviewResult[] {
    const results: MappingPreviewResult[] = []

    for (const [targetField, sourcePath] of Object.entries(fieldMapping)) {
      try {
        const mappedValue = this.extractValueByPath(sourceData, sourcePath)
        results.push({
          targetField,
          sourcePath,
          mappedValue,
          success: true
        })
      } catch (error) {
        results.push({
          targetField,
          sourcePath,
          mappedValue: null,
          success: false,
          error: error instanceof Error ? error.message : '映射失败'
        })
      }
    }

    return results
  }

  /**
   * 根据 JSON 路径提取值
   * 简化版本的路径解析器，学习自 visual-editor
   */
  private extractValueByPath(obj: any, path: string): any {
    if (!obj || !path) return undefined

    // 处理简单路径 (如 "name", "user.name")
    if (!path.includes('[') && !path.includes('(')) {
      return path.split('.').reduce((current, key) => {
        return current && typeof current === 'object' ? current[key] : undefined
      }, obj)
    }

    // 对于复杂路径，使用简单的正则解析
    try {
      // 这里可以扩展更复杂的路径解析逻辑
      // 现在先支持基本的点记法和数组索引
      return new Function('obj', `return obj.${path.replace(/\[(\d+)\]/g, '[$1]')}`)(obj)
    } catch {
      throw new Error(`无法解析路径: ${path}`)
    }
  }

  /**
   * 获取配置摘要信息
   * 用于调试和展示
   */
  getConfigSummary(config: SimpleDataSourceConfig): string {
    const dataSourceTypes = config.dataSources.map(ds => ds.type).join(', ')
    const triggerTypes = config.triggers.map(t => t.type).join(', ')

    return `组件: ${config.componentId} | 数据源: ${dataSourceTypes} | 触发器: ${triggerTypes}`
  }
}

/**
 * 导出单例实例，简化使用
 */
export const simpleConfigGenerator = new SimpleConfigGenerator()
