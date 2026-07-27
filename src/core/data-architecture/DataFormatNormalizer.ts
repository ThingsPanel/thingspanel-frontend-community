/**
 * 🔥 数据格式标准化器
 * 解决系统中数据源配置格式不统一的根本问题
 *
 * 目标：所有数据源配置都必须转换为统一的标准格式
 */

/**
 * 标准数据项格式 - 系统唯一认可的格式
 */
export interface StandardDataItem {
  /** 数据项配置 */
  item: {
    /** 数据源类型 */
    type: 'static' | 'http' | 'json' | 'websocket' | 'file' | 'data-source-bindings'
    /** 配置内容 */
    config: Record<string, any>
  }
  /** 处理配置 */
  processing: {
    /** 过滤路径 */
    filterPath: string
    /** 自定义脚本 */
    customScript?: string
    /** 默认值 */
    defaultValue?: any
  }
}

/**
 * 标准数据源配置格式
 */
export interface StandardDataSourceConfig {
  /** 组件ID */
  componentId: string
  /** 数据源列表 */
  dataSources: Array<{
    /** 数据源ID */
    sourceId: string
    /** 数据项列表 */
    dataItems: StandardDataItem[]
    /** 合并策略 */
    mergeStrategy: { type: 'object' | 'array' | 'replace' }
  }>
  /** 创建时间 */
  createdAt: number
  /** 更新时间 */
  updatedAt: number
}

/**
 * 数据格式标准化器类
 */
export class DataFormatNormalizer {
  /**
   * 🔥 核心方法：将任意格式转换为标准格式
   */
  static normalizeToStandard(data: any, componentId: string): StandardDataSourceConfig {
    // 1. 如果已经是标准格式，直接返回
    if (this.isStandardFormat(data)) {
      return data as StandardDataSourceConfig
    }

    // 2. 处理 SimpleConfigurationEditor 格式
    if (this.isSimpleConfigEditorFormat(data)) {
      return this.convertFromSimpleConfigEditor(data, componentId)
    }

    // 3. 处理导入导出格式（原始 DataItem[]）
    if (this.isImportExportFormat(data)) {
      return this.convertFromImportExport(data, componentId)
    }

    // 4. 处理 Card2.1 执行器格式
    if (this.isCard2ExecutorFormat(data)) {
      return this.convertFromCard2Executor(data, componentId)
    }

    // 5. 处理 EditorDataSourceManager 格式
    if (this.isEditorManagerFormat(data)) {
      return this.convertFromEditorManager(data, componentId)
    }

    // 6. 处理任意对象格式（兜底）
    return this.convertFromGenericObject(data, componentId)
  }

  /**
   * 🔥 反向转换：从标准格式转换为目标格式
   */
  static convertFromStandard(
    standardData: StandardDataSourceConfig,
    targetFormat: 'simpleConfigEditor' | 'importExport' | 'card2Executor'
  ): any {
    switch (targetFormat) {
      case 'simpleConfigEditor':
        return this.convertToSimpleConfigEditor(standardData)
      case 'importExport':
        return this.convertToImportExport(standardData)
      case 'card2Executor':
        return this.convertToCard2Executor(standardData)
      default:
        return standardData
    }
  }

  // =================== 格式检测方法 ===================

  private static isStandardFormat(data: any): boolean {
    return !!(
      data &&
      typeof data === 'object' &&
      'componentId' in data &&
      'dataSources' in data &&
      Array.isArray(data.dataSources) &&
      data.dataSources.every(
        (ds: any) =>
          ds &&
          'sourceId' in ds &&
          'dataItems' in ds &&
          Array.isArray(ds.dataItems) &&
          ds.dataItems.every((item: any) => item && 'item' in item && 'processing' in item)
      )
    )
  }

  private static isSimpleConfigEditorFormat(data: any): boolean {
    return !!(
      data &&
      typeof data === 'object' &&
      'dataSources' in data &&
      Array.isArray(data.dataSources) &&
      data.dataSources.some((ds: any) => ds && 'sourceId' in ds && 'dataItems' in ds)
    )
  }

  private static isImportExportFormat(data: any): boolean {
    return !!(
      data &&
      typeof data === 'object' &&
      'dataSourceConfig' in data &&
      data.dataSourceConfig?.dataItems &&
      Array.isArray(data.dataSourceConfig.dataItems) &&
      // 检查是否为原始格式（没有 item/processing 包装）
      data.dataSourceConfig.dataItems.some((item: any) => item && !('item' in item && 'processing' in item))
    )
  }

  private static isCard2ExecutorFormat(data: any): boolean {
    return !!(
      data &&
      typeof data === 'object' &&
      Object.keys(data).some(
        key =>
          data[key] &&
          typeof data[key] === 'object' &&
          'type' in data[key] &&
          'data' in data[key] &&
          'metadata' in data[key]
      )
    )
  }

  private static isEditorManagerFormat(data: any): boolean {
    return !!(
      data &&
      typeof data === 'object' &&
      'type' in data &&
      'config' in data &&
      !('item' in data && 'processing' in data)
    )
  }

  // =================== 转换方法 ===================

  private static convertFromSimpleConfigEditor(data: any, componentId: string): StandardDataSourceConfig {
    const dataSources = (data.dataSources || []).map((ds: any) => ({
      sourceId: ds.sourceId || 'default',
      dataItems: (ds.dataItems || []).map((item: any): StandardDataItem => {
        // 如果已经是标准格式
        if (item && 'item' in item && 'processing' in item) {
          return item as StandardDataItem
        }
        // 如果是原始格式，需要包装
        return {
          item: {
            type: item.type || 'static',
            config: item.config || item
          },
          processing: {
            filterPath: item.filterPath || '$',
            customScript: item.customScript,
            defaultValue: item.defaultValue
          }
        }
      }),
      mergeStrategy: ds.mergeStrategy || { type: 'object' }
    }))

    return {
      componentId,
      dataSources,
      createdAt: data.createdAt || Date.now(),
      updatedAt: Date.now()
    }
  }

  private static convertFromImportExport(data: any, componentId: string): StandardDataSourceConfig {
    const dataItems = (data.dataSourceConfig?.dataItems || []).map(
      (rawItem: any): StandardDataItem => ({
        item: {
          type: rawItem.type || 'static',
          config: rawItem.config || rawItem
        },
        processing: {
          filterPath: '$',
          customScript: undefined,
          defaultValue: undefined
        }
      })
    )

    return {
      componentId,
      dataSources: [
        {
          sourceId: 'main',
          dataItems,
          mergeStrategy: data.dataSourceConfig?.mergeStrategy || { type: 'object' }
        }
      ],
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
  }

  private static convertFromCard2Executor(data: any, componentId: string): StandardDataSourceConfig {
    const dataSources = Object.entries(data).map(([sourceId, sourceData]: [string, any]): any => ({
      sourceId,
      dataItems: [
        {
          item: {
            type: sourceData.type || 'static',
            config: sourceData.data || sourceData
          },
          processing: {
            filterPath: '$',
            customScript: undefined,
            defaultValue: undefined
          }
        }
      ],
      mergeStrategy: { type: 'object' }
    }))

    return {
      componentId,
      dataSources,
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
  }

  private static convertFromEditorManager(data: any, componentId: string): StandardDataSourceConfig {
    return {
      componentId,
      dataSources: [
        {
          sourceId: 'main',
          dataItems: [
            {
              item: {
                type: data.type || 'static',
                config: data.config || data
              },
              processing: {
                filterPath: data.filterPath || '$',
                customScript: data.processScript,
                defaultValue: undefined
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

  private static convertFromGenericObject(data: any, componentId: string): StandardDataSourceConfig {
    return {
      componentId,
      dataSources: [
        {
          sourceId: 'main',
          dataItems: [
            {
              item: {
                type: 'static',
                config: data
              },
              processing: {
                filterPath: '$',
                customScript: undefined,
                defaultValue: undefined
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

  // =================== 反向转换方法 ===================

  private static convertToSimpleConfigEditor(standardData: StandardDataSourceConfig): any {
    return {
      dataSources: standardData.dataSources.map(ds => ({
        sourceId: ds.sourceId,
        dataItems: ds.dataItems, // 保持标准格式
        mergeStrategy: ds.mergeStrategy
      })),
      createdAt: standardData.createdAt,
      updatedAt: standardData.updatedAt
    }
  }

  private static convertToImportExport(standardData: StandardDataSourceConfig): any {
    const dataItems = standardData.dataSources.flatMap(
      ds => ds.dataItems.map(item => item.item) // 提取原始 item，去掉 processing 包装
    )

    return {
      dataSourceConfig: {
        dataItems,
        mergeStrategy: standardData.dataSources[0]?.mergeStrategy || { type: 'object' }
      }
    }
  }

  private static convertToCard2Executor(standardData: StandardDataSourceConfig): any {
    const result: any = {}

    standardData.dataSources.forEach(ds => {
      ds.dataItems.forEach((item, index) => {
        const key = ds.dataItems.length === 1 ? ds.sourceId : `${ds.sourceId}_${index}`
        result[key] = {
          type: item.item.type,
          data: item.item.config,
          metadata: {
            sourceId: ds.sourceId,
            processing: item.processing
          }
        }
      })
    })

    return result
  }

  /**
   * 🔥 批量标准化方法
   */
  static normalizeMultiple(dataList: Array<{ data: any; componentId: string }>): StandardDataSourceConfig[] {
    return dataList.map(({ data, componentId }) => this.normalizeToStandard(data, componentId))
  }

  /**
   * 🔥 验证标准格式完整性
   */
  static validateStandardFormat(data: StandardDataSourceConfig): {
    valid: boolean
    errors: string[]
  } {
    const errors: string[] = []

    if (!data.componentId) {
      errors.push('缺少 componentId')
    }

    if (!Array.isArray(data.dataSources)) {
      errors.push('dataSources 必须是数组')
    } else {
      data.dataSources.forEach((ds, dsIndex) => {
        if (!ds.sourceId) {
          errors.push(`dataSources[${dsIndex}] 缺少 sourceId`)
        }

        if (!Array.isArray(ds.dataItems)) {
          errors.push(`dataSources[${dsIndex}] dataItems 必须是数组`)
        } else {
          ds.dataItems.forEach((item, itemIndex) => {
            if (!item.item || !item.processing) {
              errors.push(`dataSources[${dsIndex}].dataItems[${itemIndex}] 格式不正确`)
            }
          })
        }
      })
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }
}
