/**
 * 第四层：多源整合器 (MultiSourceIntegrator)
 * 职责：将多个数据源按key合成组件最终数据
 */

export interface ComponentData {
  [dataSourceKey: string]: {
    /** 数据源类型 */
    type: string
    /** 解析后的数据 */
    data: any
    /** 最后更新时间 */
    lastUpdated: number
    /** 元数据 */
    metadata?: any
  }
}

export interface DataSourceResult {
  /** 数据源ID */
  sourceId: string
  /** 数据源类型 */
  type: string
  /** 合并后的数据 */
  data: any
  /** 是否成功 */
  success: boolean
  /** 错误信息 */
  error?: string
}

/**
 * 多源整合器接口
 */
export interface IMultiSourceIntegrator {
  /**
   * 按key整合多数据源
   * @param sources 数据源结果列表
   * @param componentId 组件ID
   * @returns 组件最终数据，出错时返回空ComponentData
   */
  integrateDataSources(sources: DataSourceResult[], componentId: string): Promise<ComponentData>
}

/**
 * 多源整合器实现类
 */
export class MultiSourceIntegrator implements IMultiSourceIntegrator {
  /**
   * 多数据源整合主方法
   */
  async integrateDataSources(sources: DataSourceResult[], componentId: string): Promise<ComponentData> {
    try {
      const result: ComponentData = {}
      const timestamp = Date.now()

      // 处理每个数据源结果
      for (const source of sources) {
        if (!source.sourceId) {
          console.warn('MultiSourceIntegrator: 数据源ID不能为空，跳过该数据源')
          continue
        }

        // 按key合成大对象
        result[source.sourceId] = {
          type: source.type || 'unknown',
          data: source.success ? source.data : {},
          lastUpdated: timestamp,
          metadata: {
            componentId,
            success: source.success,
            error: source.error,
            processedAt: new Date().toISOString()
          }
        }
      }

      // 如果没有任何有效数据源，返回空的ComponentData
      if (Object.keys(result).length === 0) {
        console.warn('MultiSourceIntegrator: 没有有效的数据源，返回空数据')
        return {}
      }

      return result
    } catch (error) {
      console.error('MultiSourceIntegrator: 多源整合失败', error)
      return {} // 统一错误处理：返回空ComponentData
    }
  }

  /**
   * 验证数据源结果的有效性
   */
  validateDataSourceResult(source: DataSourceResult): boolean {
    return !!(source && source.sourceId && source.type !== undefined)
  }

  /**
   * 获取组件数据统计信息
   */
  getDataStatistics(componentData: ComponentData): {
    totalSources: number
    successfulSources: number
    failedSources: number
    lastUpdated: number
  } {
    const sources = Object.entries(componentData)
    const successful = sources.filter(([_, data]) => data.metadata?.success !== false)
    const failed = sources.filter(([_, data]) => data.metadata?.success === false)
    const lastUpdated = Math.max(...sources.map(([_, data]) => data.lastUpdated), 0)

    return {
      totalSources: sources.length,
      successfulSources: successful.length,
      failedSources: failed.length,
      lastUpdated
    }
  }

  /**
   * 检查组件数据是否有效
   */
  isValidComponentData(componentData: ComponentData): boolean {
    if (!componentData || typeof componentData !== 'object') {
      return false
    }

    // 至少要有一个数据源
    const sourceKeys = Object.keys(componentData)
    if (sourceKeys.length === 0) {
      return false
    }

    // 检查每个数据源的结构
    return sourceKeys.every(key => {
      const source = componentData[key]
      return (
        source && typeof source.type === 'string' && typeof source.lastUpdated === 'number' && source.data !== undefined
      )
    })
  }

  /**
   * 合并多个ComponentData (用于组件数据的增量更新)
   */
  mergeComponentData(existing: ComponentData, updates: ComponentData): ComponentData {
    const result = { ...existing }

    for (const [sourceId, sourceData] of Object.entries(updates)) {
      // 使用时间戳判断是否需要更新
      const existingData = result[sourceId]
      if (!existingData || existingData.lastUpdated < sourceData.lastUpdated) {
        result[sourceId] = sourceData
      }
    }

    return result
  }

  /**
   * 清理过期的数据源数据
   */
  cleanupExpiredData(componentData: ComponentData, maxAge: number = 5 * 60 * 1000): ComponentData {
    const now = Date.now()
    const result: ComponentData = {}

    for (const [sourceId, sourceData] of Object.entries(componentData)) {
      // 保留未过期的数据
      if (now - sourceData.lastUpdated <= maxAge) {
        result[sourceId] = sourceData
      }
    }

    return result
  }

  /**
   * 转换为Visual Editor兼容格式
   */
  toVisualEditorFormat(componentData: ComponentData): any {
    const result: Record<string, any> = {}

    for (const [sourceId, sourceData] of Object.entries(componentData)) {
      result[sourceId] = sourceData.data
    }

    return result
  }

  /**
   * 转换为Card2.1兼容格式
   */
  toCard21Format(componentData: ComponentData): any {
    return {
      rawDataSources: {
        dataSourceBindings: Object.fromEntries(
          Object.entries(componentData).map(([sourceId, sourceData]) => [
            sourceId,
            {
              rawData: JSON.stringify(sourceData.data)
            }
          ])
        )
      }
    }
  }
}
