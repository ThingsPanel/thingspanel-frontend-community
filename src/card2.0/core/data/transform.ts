/**
 * 数据转换器实现
 * 将不同来源的数据转换为统一的数据节点格式
 */

import type { IDataNode, IDataTransform } from '../types/index'

/**
 * 数据转换器实现
 */
export class DataTransform implements IDataTransform {
  /**
   * 转换设备数据
   */
  transformDeviceData(rawData: any): IDataNode {
    try {
      // 处理设备数据格式
      if (Array.isArray(rawData)) {
        // 时序数据
        return {
          id: `device_${Date.now()}`,
          type: 'device',
          timestamp: Date.now(),
          value: rawData,
          metadata: {
            source: 'device',
            dataType: 'timeseries',
            count: rawData.length
          },
          quality: this.validateDeviceData(rawData) ? 'good' : 'bad'
        }
      } else if (typeof rawData === 'object' && rawData !== null) {
        // 单个数据点
        return {
          id: `device_${rawData.deviceId || Date.now()}`,
          type: 'device',
          timestamp: rawData.timestamp || Date.now(),
          value: rawData.value !== undefined ? rawData.value : rawData,
          metadata: {
            source: 'device',
            deviceId: rawData.deviceId,
            attributeKey: rawData.attributeKey,
            unit: rawData.unit,
            dataType: typeof rawData.value
          },
          quality: rawData.quality || 'good'
        }
      } else {
        // 简单值
        return {
          id: `device_${Date.now()}`,
          type: 'device',
          timestamp: Date.now(),
          value: rawData,
          metadata: {
            source: 'device',
            dataType: typeof rawData
          },
          quality: 'good'
        }
      }
    } catch (error) {
      return this.createErrorNode('device', error as Error, rawData)
    }
  }

  /**
   * 转换系统数据
   */
  transformSystemData(rawData: any): IDataNode {
    try {
      return {
        id: `system_${Date.now()}`,
        type: 'system',
        timestamp: Date.now(),
        value: rawData,
        metadata: {
          source: 'system',
          dataType: Array.isArray(rawData) ? 'array' : typeof rawData,
          size: Array.isArray(rawData) ? rawData.length : 1
        },
        quality: 'good'
      }
    } catch (error) {
      return this.createErrorNode('system', error as Error, rawData)
    }
  }

  /**
   * 转换API数据
   */
  transformApiData(rawData: any): IDataNode {
    try {
      // 处理API响应格式
      let processedData = rawData

      // 如果是标准API响应格式
      if (rawData && typeof rawData === 'object') {
        if (rawData.data !== undefined) {
          processedData = rawData.data
        } else if (rawData.result !== undefined) {
          processedData = rawData.result
        }
      }

      return {
        id: `api_${Date.now()}`,
        type: 'api',
        timestamp: Date.now(),
        value: processedData,
        metadata: {
          source: 'api',
          originalResponse: rawData,
          dataType: Array.isArray(processedData) ? 'array' : typeof processedData,
          status: rawData?.status || 'success'
        },
        quality: rawData?.status === 'error' ? 'bad' : 'good'
      }
    } catch (error) {
      return this.createErrorNode('api', error as Error, rawData)
    }
  }

  /**
   * 转换模拟数据
   */
  transformMockData(rawData: any): IDataNode {
    try {
      return {
        id: `mock_${Date.now()}`,
        type: 'mock',
        timestamp: Date.now(),
        value: rawData,
        metadata: {
          source: 'mock',
          dataType: Array.isArray(rawData) ? 'array' : typeof rawData,
          generated: true
        },
        quality: 'good'
      }
    } catch (error) {
      return this.createErrorNode('mock', error as Error, rawData)
    }
  }

  /**
   * 转换通用数据
   */
  transformGenericData(rawData: any, sourceType: string = 'generic'): IDataNode {
    try {
      return {
        id: `${sourceType}_${Date.now()}`,
        type: sourceType as any,
        timestamp: Date.now(),
        value: rawData,
        metadata: {
          source: sourceType,
          dataType: Array.isArray(rawData) ? 'array' : typeof rawData
        },
        quality: 'good'
      }
    } catch (error) {
      return this.createErrorNode(sourceType as any, error as Error, rawData)
    }
  }

  /**
   * 验证设备数据
   */
  private validateDeviceData(data: any): boolean {
    if (Array.isArray(data)) {
      return data.every(
        item => item && typeof item === 'object' && (item.timestamp !== undefined || item.value !== undefined)
      )
    }
    return data !== null && data !== undefined
  }

  /**
   * 创建错误节点
   */
  private createErrorNode(type: string, error: Error, originalData: any): IDataNode {
    return {
      id: `error_${type}_${Date.now()}`,
      type: type as any,
      timestamp: Date.now(),
      value: null,
      metadata: {
        source: type,
        error: {
          message: error.message,
          stack: error.stack,
          originalData
        },
        dataType: 'error'
      },
      quality: 'bad'
    }
  }

  /**
   * 批量转换数据
   */
  transformBatch(dataList: Array<{ data: any; type: string }>): IDataNode[] {
    return dataList.map(({ data, type }) => {
      switch (type) {
        case 'device':
          return this.transformDeviceData(data)
        case 'system':
          return this.transformSystemData(data)
        case 'api':
          return this.transformApiData(data)
        case 'mock':
          return this.transformMockData(data)
        default:
          return this.transformGenericData(data, type)
      }
    })
  }

  /**
   * 验证数据节点
   */
  validateDataNode(node: IDataNode): boolean {
    return !!(node.id && node.type && node.timestamp && node.quality)
  }

  /**
   * 清理数据节点
   */
  cleanDataNode(node: IDataNode): IDataNode {
    return {
      id: node.id,
      type: node.type,
      timestamp: node.timestamp,
      value: node.value,
      metadata: node.metadata || {},
      quality: node.quality || 'unknown'
    }
  }
}

/**
 * 数据聚合器
 * 对数据节点进行聚合处理
 */
export class DataAggregator {
  /**
   * 聚合数据节点
   */
  aggregate(nodes: IDataNode[], method: 'sum' | 'avg' | 'max' | 'min' | 'count'): IDataNode {
    if (nodes.length === 0) {
      throw new Error('无法聚合空数据集')
    }

    const values = nodes
      .filter(node => node.quality === 'good' && typeof node.value === 'number')
      .map(node => node.value as number)

    if (values.length === 0) {
      throw new Error('没有有效的数值数据可聚合')
    }

    let aggregatedValue: number

    switch (method) {
      case 'sum':
        aggregatedValue = values.reduce((sum, val) => sum + val, 0)
        break
      case 'avg':
        aggregatedValue = values.reduce((sum, val) => sum + val, 0) / values.length
        break
      case 'max':
        aggregatedValue = Math.max(...values)
        break
      case 'min':
        aggregatedValue = Math.min(...values)
        break
      case 'count':
        aggregatedValue = values.length
        break
      default:
        throw new Error(`不支持的聚合方法: ${method}`)
    }

    return {
      id: `aggregated_${method}_${Date.now()}`,
      type: 'aggregated',
      timestamp: Date.now(),
      value: aggregatedValue,
      metadata: {
        source: 'aggregator',
        method,
        originalCount: nodes.length,
        validCount: values.length,
        dataType: 'number'
      },
      quality: 'good'
    }
  }

  /**
   * 按时间窗口聚合
   */
  aggregateByTimeWindow(
    nodes: IDataNode[],
    windowSize: number, // 毫秒
    method: 'sum' | 'avg' | 'max' | 'min' | 'count'
  ): IDataNode[] {
    if (nodes.length === 0) {
      return []
    }

    // 按时间排序
    const sortedNodes = [...nodes].sort((a, b) => a.timestamp - b.timestamp)

    // 分组
    const groups: IDataNode[][] = []
    let currentGroup: IDataNode[] = []
    let windowStart = sortedNodes[0].timestamp

    for (const node of sortedNodes) {
      if (node.timestamp - windowStart >= windowSize) {
        if (currentGroup.length > 0) {
          groups.push(currentGroup)
        }
        currentGroup = [node]
        windowStart = node.timestamp
      } else {
        currentGroup.push(node)
      }
    }

    if (currentGroup.length > 0) {
      groups.push(currentGroup)
    }

    // 聚合每个组
    return groups.map(group => {
      try {
        return this.aggregate(group, method)
      } catch (error) {
        return {
          id: `aggregated_error_${Date.now()}`,
          type: 'aggregated',
          timestamp: group[0].timestamp,
          value: null,
          metadata: {
            source: 'aggregator',
            method,
            error: (error as Error).message,
            originalCount: group.length
          },
          quality: 'bad'
        }
      }
    })
  }

  /**
   * 计算统计信息
   */
  calculateStats(nodes: IDataNode[]): {
    count: number
    validCount: number
    sum: number
    avg: number
    max: number
    min: number
    median: number
    std: number
  } {
    const values = nodes
      .filter(node => node.quality === 'good' && typeof node.value === 'number')
      .map(node => node.value as number)
      .sort((a, b) => a - b)

    if (values.length === 0) {
      return {
        count: nodes.length,
        validCount: 0,
        sum: 0,
        avg: 0,
        max: 0,
        min: 0,
        median: 0,
        std: 0
      }
    }

    const sum = values.reduce((s, v) => s + v, 0)
    const avg = sum / values.length
    const median =
      values.length % 2 === 0
        ? (values[values.length / 2 - 1] + values[values.length / 2]) / 2
        : values[Math.floor(values.length / 2)]

    const variance = values.reduce((v, val) => v + Math.pow(val - avg, 2), 0) / values.length
    const std = Math.sqrt(variance)

    return {
      count: nodes.length,
      validCount: values.length,
      sum,
      avg,
      max: Math.max(...values),
      min: Math.min(...values),
      median,
      std
    }
  }
}

// 导出单例实例
export const dataTransform = new DataTransform()
export const dataAggregator = new DataAggregator()
