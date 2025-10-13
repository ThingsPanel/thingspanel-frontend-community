/**
 * 数据源适配器
 * 提供数据源格式转换和兼容性处理
 */

import type { ExecutorData } from '../types'

/**
 * 数据源适配器类
 */
export class DataSourceAdapter {
  /**
   * 标准化执行器数据格式
   */
  static normalizeExecutorData(data: any): ExecutorData {
    if (!data) {
      return {}
    }

    // 如果已经是标准格式，直接返回
    if (typeof data === 'object' && (data.main || data.primaryData)) {
      return data as ExecutorData
    }

    // 如果是简单对象，包装到 main 字段
    if (typeof data === 'object' && !Array.isArray(data)) {
      return {
        main: data
      }
    }

    // 如果是数组或其他类型，包装到 primaryData
    return {
      primaryData: data
    }
  }

  /**
   * 转换旧格式数据到新格式
   */
  static convertLegacyData(legacyData: any): ExecutorData {
    if (!legacyData) {
      return {}
    }

    // 旧格式通常是简单的键值对
    if (typeof legacyData === 'object' && !Array.isArray(legacyData)) {
      return {
        main: legacyData
      }
    }

    // 其他格式直接包装
    return {
      primaryData: legacyData
    }
  }

  /**
   * 提取主要数据
   */
  static extractPrimaryData(executorData: ExecutorData): any {
    if (!executorData) {
      return null
    }

    // 优先从 primaryData 提取
    if (executorData.primaryData !== undefined) {
      return executorData.primaryData
    }

    // 其次从 main 提取
    if (executorData.main && typeof executorData.main === 'object') {
      return executorData.main
    }

    // 最后返回整个数据
    return executorData
  }

  /**
   * 检查数据源格式
   */
  static detectDataSourceFormat(data: any): 'standard' | 'legacy' | 'unknown' {
    if (!data) {
      return 'unknown'
    }

    if (typeof data === 'object' && (data.main || data.primaryData)) {
      return 'standard'
    }

    if (typeof data === 'object' && !Array.isArray(data)) {
      return 'legacy'
    }

    return 'unknown'
  }

  /**
   * 合并多个数据源
   */
  static mergeDataSources(...dataSources: ExecutorData[]): ExecutorData {
    const result: ExecutorData = {}

    dataSources.forEach(data => {
      if (!data) return

      // 合并 main 字段
      if (data.main && typeof data.main === 'object') {
        if (!result.main) {
          result.main = {}
        }
        Object.assign(result.main, data.main)
      }

      // 合并 primaryData（最后一个有效）
      if (data.primaryData !== undefined) {
        result.primaryData = data.primaryData
      }

      // 合并其他字段
      Object.keys(data).forEach(key => {
        if (key !== 'main' && key !== 'primaryData') {
          result[key] = data[key]
        }
      })
    })

    return result
  }

  /**
   * 过滤无效数据
   */
  static filterInvalidData(executorData: ExecutorData): ExecutorData {
    const result: ExecutorData = {}

    if (executorData.main && typeof executorData.main === 'object') {
      const filteredMain: Record<string, any> = {}
      Object.entries(executorData.main).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          filteredMain[key] = value
        }
      })
      if (Object.keys(filteredMain).length > 0) {
        result.main = filteredMain
      }
    }

    if (executorData.primaryData !== null && executorData.primaryData !== undefined) {
      result.primaryData = executorData.primaryData
    }

    Object.keys(executorData).forEach(key => {
      if (key !== 'main' && key !== 'primaryData') {
        const value = executorData[key]
        if (value !== null && value !== undefined) {
          result[key] = value
        }
      }
    })

    return result
  }
}

/**
 * 默认导出
 */
export default DataSourceAdapter