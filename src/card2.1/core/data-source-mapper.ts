/**
 * Card2.1 数据源映射器
 * 提供通用的数据源映射和转换服务，消除硬编码依赖
 */

import { ComponentRegistry } from './component-registry'
import type { ComponentDefinition } from './types'

/**
 * 执行器数据格式
 */
export interface ExecutorData {
  [key: string]: any
  main?: {
    [dataSourceKey: string]: any
  }
}

/**
 * 数据源映射结果
 */
export interface DataSourceMappingResult {
  [propName: string]: any
}

/**
 * 数据源映射器类
 * 负责将执行器数据转换为组件所需的 props
 */
export class DataSourceMapper {
  /**
   * 映射组件数据源
   * @param componentType 组件类型
   * @param executorData 执行器数据
   * @returns 映射后的组件 props
   */
  static mapDataSources(componentType: string, executorData: ExecutorData | null | undefined): DataSourceMappingResult {
    // 获取组件定义
    const definition = ComponentRegistry.get(componentType)
    if (!definition) {
      return {}
    }

    // 获取组件的数据源配置
    const dataSourceKeys = ComponentRegistry.getDataSourceKeys(componentType)
    if (dataSourceKeys.length === 0) {
      return {}
    }

    // 如果没有执行器数据，返回空值映射
    if (!executorData) {
      return this.createNullMapping(dataSourceKeys)
    }

    // 执行数据源映射
    const mappingResult = this.performMapping(dataSourceKeys, executorData)
    return mappingResult
  }

  /**
   * 创建空值映射
   * @param dataSourceKeys 数据源键列表
   * @returns 空值映射对象
   */
  private static createNullMapping(dataSourceKeys: string[]): DataSourceMappingResult {
    const nullMapping: DataSourceMappingResult = {}

    dataSourceKeys.forEach(key => {
      nullMapping[key] = null
    })
    return nullMapping
  }

  /**
   * 执行数据源映射
   * @param dataSourceKeys 数据源键列表
   * @param executorData 执行器数据
   * @returns 映射结果
   */
  private static performMapping(dataSourceKeys: string[], executorData: ExecutorData): DataSourceMappingResult {
    const result: DataSourceMappingResult = {}

    // 策略1: 优先从 main 字段中提取数据
    if (executorData.main && typeof executorData.main === 'object') {
      dataSourceKeys.forEach(key => {
        if (key in executorData.main!) {
          result[key] = executorData.main![key]
        } else {
          result[key] = null
        }
      })

      return result
    }

    // 🔥 策略2: 处理标准数据源格式 (primaryData.data)
    if (executorData.primaryData && typeof executorData.primaryData === 'object') {
      dataSourceKeys.forEach(key => {
        if (key === 'primaryData' && executorData.primaryData) {
          // 对于primaryData，提取.data字段的内容
          const primaryDataObj = executorData.primaryData as any
          result[key] = primaryDataObj.data || primaryDataObj
        } else if (executorData.primaryData[key]) {
          result[key] = executorData.primaryData[key]
        } else {
          result[key] = null
        }
      })

      // 🔥 特殊处理：如果组件期望的是单一数据源但使用了primaryData
      if (dataSourceKeys.length === 1 && dataSourceKeys[0] === 'primaryData') {
        const primaryDataObj = executorData.primaryData as any
        // 直接返回data字段的内容，而不是整个primaryData
        result[dataSourceKeys[0]] = primaryDataObj.data || primaryDataObj
      }

      return result
    }

    // 策略3: 直接从 executorData 根级别提取数据
    dataSourceKeys.forEach(key => {
      if (key in executorData) {
        result[key] = executorData[key]
      } else {
        result[key] = null
      }
    })

    return result
  }

  /**
   * 映射静态参数
   * @param componentType 组件类型
   * @param staticParams 静态参数对象
   * @returns 映射后的静态参数
   */
  static mapStaticParams(
    componentType: string,
    staticParams: Record<string, any> | null | undefined
  ): Record<string, any> {
    // 获取组件定义
    const definition = ComponentRegistry.get(componentType)
    if (!definition) {
      return {}
    }

    // 获取组件的静态参数配置
    const staticParamKeys = ComponentRegistry.getStaticParamKeys(componentType)
    if (staticParamKeys.length === 0) {
      return {}
    }

    // 如果没有静态参数，返回默认值
    if (!staticParams) {
      return this.getDefaultStaticParams(definition, staticParamKeys)
    }

    // 过滤和映射静态参数
    const result: Record<string, any> = {}
    staticParamKeys.forEach(key => {
      if (key in staticParams) {
        result[key] = staticParams[key]
      } else {
        // 使用默认值
        const defaultValue = this.getDefaultStaticParamValue(definition, key)
        result[key] = defaultValue
      }
    })
    return result
  }

  /**
   * 获取默认静态参数
   * @param definition 组件定义
   * @param staticParamKeys 静态参数键列表
   * @returns 默认静态参数对象
   */
  private static getDefaultStaticParams(
    definition: ComponentDefinition,
    staticParamKeys: string[]
  ): Record<string, any> {
    const defaults: Record<string, any> = {}

    staticParamKeys.forEach(key => {
      defaults[key] = this.getDefaultStaticParamValue(definition, key)
    })

    return defaults
  }

  /**
   * 获取默认静态参数值
   * @param definition 组件定义
   * @param key 参数键
   * @returns 默认值
   */
  private static getDefaultStaticParamValue(definition: ComponentDefinition, key: string): any {
    // 从组件定义的默认配置中获取
    if (definition?.defaultConfig?.staticParams?.[key] !== undefined) {
      return definition.defaultConfig.staticParams[key]
    }

    // 从静态参数定义中获取默认值
    if (definition.staticParams?.[key]?.default !== undefined) {
      return definition.staticParams[key].default
    }

    // 根据类型返回合适的默认值
    const paramType = definition.staticParams?.[key]?.type
    switch (paramType) {
      case 'string':
        return ''
      case 'number':
        return 0
      case 'boolean':
        return false
      case 'array':
        return []
      case 'object':
        return {}
      default:
        return null
    }
  }

  /**
   * 验证数据源映射结果
   * @param componentType 组件类型
   * @param mappingResult 映射结果
   * @returns 验证结果
   */
  static validateMapping(
    componentType: string,
    mappingResult: DataSourceMappingResult
  ): {
    isValid: boolean
    missingKeys: string[]
    extraKeys: string[]
  } {
    const expectedKeys = ComponentRegistry.getDataSourceKeys(componentType)
    const actualKeys = Object.keys(mappingResult)

    const missingKeys = expectedKeys.filter(key => !(key in mappingResult))
    const extraKeys = actualKeys.filter(key => !expectedKeys.includes(key))

    const isValid = missingKeys.length === 0
    return { isValid, missingKeys, extraKeys }
  }

  /**
   * 获取映射统计信息
   * @param componentType 组件类型
   * @param executorData 执行器数据
   * @returns 统计信息
   */
  static getMappingStats(
    componentType: string,
    executorData: ExecutorData | null | undefined
  ): {
    componentType: string
    isRegistered: boolean
    dataSourceCount: number
    staticParamCount: number
    hasExecutorData: boolean
    executorDataKeys: string[]
  } {
    const isRegistered = ComponentRegistry.has(componentType)
    const dataSourceCount = ComponentRegistry.getDataSourceKeys(componentType).length
    const staticParamCount = ComponentRegistry.getStaticParamKeys(componentType).length
    const hasExecutorData = !!executorData
    const executorDataKeys = executorData ? Object.keys(executorData) : []

    return {
      componentType,
      isRegistered,
      dataSourceCount,
      staticParamCount,
      hasExecutorData,
      executorDataKeys
    }
  }
}

/**
 * 数据源映射器接口（用于依赖注入等场景）
 */
export interface IDataSourceMapper {
  mapDataSources(componentType: string, executorData: ExecutorData | null | undefined): DataSourceMappingResult
  mapStaticParams(componentType: string, staticParams: Record<string, any> | null | undefined): Record<string, any>
  validateMapping(
    componentType: string,
    mappingResult: DataSourceMappingResult
  ): {
    isValid: boolean
    missingKeys: string[]
    extraKeys: string[]
  }
}

/**
 * 默认数据源映射器实例
 */
export const dataSourceMapper: IDataSourceMapper = DataSourceMapper

// 导出类型
export type { ExecutorData, DataSourceMappingResult }
