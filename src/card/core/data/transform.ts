/**
 * 数据转换器
 * 实现统一数据节点协议的转换逻辑
 */

import type { IDataNode, IDataTransform } from '../types/index'

/**
 * 数据转换器实现类
 */
export class DataTransform implements IDataTransform {
  /**
   * 将原始数据转换为统一数据节点
   * @param rawData 原始数据
   * @param sourceType 数据源类型
   * @returns 统一数据节点
   */
  transform(rawData: any, sourceType: string): IDataNode {
    const timestamp = Date.now()

    try {
      switch (sourceType) {
        case 'device':
          return this.transformDeviceData(rawData, timestamp)
        case 'system':
          return this.transformSystemData(rawData, timestamp)
        case 'api':
          return this.transformApiData(rawData, timestamp)
        case 'mock':
          return this.transformMockData(rawData, timestamp)
        default:
          return this.transformGenericData(rawData, timestamp, sourceType)
      }
    } catch (error) {
      console.error(`[DataTransform] 数据转换失败 (${sourceType}):`, error)
      return this.createErrorNode(error as Error, timestamp)
    }
  }

  /**
   * 批量转换数据
   * @param dataList 原始数据列表
   * @param sourceType 数据源类型
   * @returns 统一数据节点数组
   */
  transformBatch(dataList: any[], sourceType: string): IDataNode[] {
    return dataList.map(data => this.transform(data, sourceType))
  }

  /**
   * 验证数据节点
   * @param node 数据节点
   * @returns 是否有效
   */
  validate(node: IDataNode): boolean {
    try {
      // 检查必需字段
      if (!node.id || !node.type || node.timestamp === undefined) {
        return false
      }

      // 检查时间戳有效性
      if (typeof node.timestamp !== 'number' || node.timestamp <= 0) {
        return false
      }

      // 检查元数据
      if (!node.metadata || typeof node.metadata !== 'object') {
        return false
      }

      return true
    } catch (error) {
      console.error('[DataTransform] 数据节点验证失败:', error)
      return false
    }
  }

  /**
   * 转换设备数据
   * @param rawData 原始设备数据
   * @param timestamp 时间戳
   * @returns 数据节点
   */
  private transformDeviceData(rawData: any, timestamp: number): IDataNode {
    // 处理设备遥测数据
    if (rawData.telemetry) {
      return {
        id: `device_${rawData.device_id || rawData.deviceId}_${timestamp}`,
        type: 'telemetry',
        value: rawData.telemetry,
        timestamp: rawData.timestamp || timestamp,
        metadata: {
          deviceId: rawData.device_id || rawData.deviceId,
          deviceName: rawData.device_name || rawData.deviceName,
          source: 'device',
          dataType: this.inferDataType(rawData.telemetry),
          unit: rawData.unit,
          quality: rawData.quality || 'good'
        }
      }
    }

    // 处理设备属性数据
    if (rawData.attributes) {
      return {
        id: `device_attr_${rawData.device_id || rawData.deviceId}_${timestamp}`,
        type: 'attribute',
        value: rawData.attributes,
        timestamp: rawData.timestamp || timestamp,
        metadata: {
          deviceId: rawData.device_id || rawData.deviceId,
          deviceName: rawData.device_name || rawData.deviceName,
          source: 'device',
          dataType: 'object',
          attributeKeys: Object.keys(rawData.attributes)
        }
      }
    }

    // 处理通用设备数据
    return {
      id: `device_${rawData.device_id || rawData.id}_${timestamp}`,
      type: 'device',
      value: rawData.value !== undefined ? rawData.value : rawData,
      timestamp: rawData.timestamp || timestamp,
      metadata: {
        deviceId: rawData.device_id || rawData.id,
        deviceName: rawData.device_name || rawData.name,
        source: 'device',
        dataType: this.inferDataType(rawData.value || rawData),
        raw: rawData
      }
    }
  }

  /**
   * 转换系统数据
   * @param rawData 原始系统数据
   * @param timestamp 时间戳
   * @returns 数据节点
   */
  private transformSystemData(rawData: any, timestamp: number): IDataNode {
    return {
      id: `system_${rawData.metric || 'data'}_${timestamp}`,
      type: 'system',
      value: rawData.value !== undefined ? rawData.value : rawData,
      timestamp: rawData.timestamp || timestamp,
      metadata: {
        metric: rawData.metric,
        source: 'system',
        dataType: this.inferDataType(rawData.value || rawData),
        category: rawData.category || 'general',
        tags: rawData.tags || {},
        raw: rawData
      }
    }
  }

  /**
   * 转换API数据
   * @param rawData 原始API数据
   * @param timestamp 时间戳
   * @returns 数据节点
   */
  private transformApiData(rawData: any, timestamp: number): IDataNode {
    return {
      id: `api_${rawData.id || timestamp}`,
      type: 'api',
      value: rawData.data || rawData.value || rawData,
      timestamp: rawData.timestamp || timestamp,
      metadata: {
        source: 'api',
        dataType: this.inferDataType(rawData.data || rawData.value || rawData),
        endpoint: rawData.endpoint,
        method: rawData.method,
        status: rawData.status,
        raw: rawData
      }
    }
  }

  /**
   * 转换模拟数据
   * @param rawData 原始模拟数据
   * @param timestamp 时间戳
   * @returns 数据节点
   */
  private transformMockData(rawData: any, timestamp: number): IDataNode {
    return {
      id: `mock_${timestamp}`,
      type: 'mock',
      value: rawData,
      timestamp,
      metadata: {
        source: 'mock',
        dataType: this.inferDataType(rawData),
        generated: true
      }
    }
  }

  /**
   * 转换通用数据
   * @param rawData 原始数据
   * @param timestamp 时间戳
   * @param sourceType 数据源类型
   * @returns 数据节点
   */
  private transformGenericData(rawData: any, timestamp: number, sourceType: string): IDataNode {
    return {
      id: `${sourceType}_${timestamp}`,
      type: 'generic',
      value: rawData,
      timestamp,
      metadata: {
        source: sourceType,
        dataType: this.inferDataType(rawData),
        raw: rawData
      }
    }
  }

  /**
   * 创建错误节点
   * @param error 错误对象
   * @param timestamp 时间戳
   * @returns 错误数据节点
   */
  private createErrorNode(error: Error, timestamp: number): IDataNode {
    return {
      id: `error_${timestamp}`,
      type: 'error',
      value: null,
      timestamp,
      metadata: {
        source: 'error',
        dataType: 'error',
        error: {
          message: error.message,
          name: error.name,
          stack: error.stack
        }
      }
    }
  }

  /**
   * 推断数据类型
   * @param value 数据值
   * @returns 数据类型
   */
  private inferDataType(value: any): string {
    if (value === null) return 'null'
    if (value === undefined) return 'undefined'

    const type = typeof value

    if (type === 'object') {
      if (Array.isArray(value)) return 'array'
      if (value instanceof Date) return 'date'
      return 'object'
    }

    return type
  }
}

/**
 * 数据聚合器
 * 实现数据的聚合和统计功能
 */
export class DataAggregator {
  /**
   * 聚合数据节点
   * @param nodes 数据节点数组
   * @param aggregationType 聚合类型
   * @returns 聚合结果
   */
  aggregate(nodes: IDataNode[], aggregationType: 'sum' | 'avg' | 'max' | 'min' | 'count'): number {
    if (nodes.length === 0) return 0

    const numericValues = nodes
      .map(node => this.extractNumericValue(node.value))
      .filter(val => val !== null) as number[]

    if (numericValues.length === 0) return 0

    switch (aggregationType) {
      case 'sum':
        return numericValues.reduce((sum, val) => sum + val, 0)
      case 'avg':
        return numericValues.reduce((sum, val) => sum + val, 0) / numericValues.length
      case 'max':
        return Math.max(...numericValues)
      case 'min':
        return Math.min(...numericValues)
      case 'count':
        return numericValues.length
      default:
        return 0
    }
  }

  /**
   * 按时间窗口聚合
   * @param nodes 数据节点数组
   * @param windowMs 时间窗口（毫秒）
   * @param aggregationType 聚合类型
   * @returns 时间窗口聚合结果
   */
  aggregateByTimeWindow(
    nodes: IDataNode[],
    windowMs: number,
    aggregationType: 'sum' | 'avg' | 'max' | 'min' | 'count'
  ): Array<{ timestamp: number; value: number; count: number }> {
    if (nodes.length === 0) return []

    // 按时间窗口分组
    const windows = new Map<number, IDataNode[]>()

    nodes.forEach(node => {
      const windowStart = Math.floor(node.timestamp / windowMs) * windowMs
      if (!windows.has(windowStart)) {
        windows.set(windowStart, [])
      }
      windows.get(windowStart)!.push(node)
    })

    // 对每个窗口进行聚合
    return Array.from(windows.entries())
      .map(([timestamp, windowNodes]) => ({
        timestamp,
        value: this.aggregate(windowNodes, aggregationType),
        count: windowNodes.length
      }))
      .sort((a, b) => a.timestamp - b.timestamp)
  }

  /**
   * 提取数值
   * @param value 原始值
   * @returns 数值或null
   */
  private extractNumericValue(value: any): number | null {
    if (typeof value === 'number') return value
    if (typeof value === 'string') {
      const parsed = parseFloat(value)
      return isNaN(parsed) ? null : parsed
    }
    if (typeof value === 'boolean') return value ? 1 : 0
    return null
  }
}

// 创建全局实例
export const dataTransform = new DataTransform()
export const dataAggregator = new DataAggregator()

// 导出类型
export type { IDataTransform }
