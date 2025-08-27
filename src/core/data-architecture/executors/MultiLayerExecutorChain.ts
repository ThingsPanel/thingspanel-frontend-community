/**
 * 多层级执行器链主协调类
 * 整合4层执行器，提供完整的数据处理管道
 */

import { DataItemFetcher, DataItem, IDataItemFetcher } from './DataItemFetcher'
import { DataItemProcessor, ProcessingConfig, IDataItemProcessor } from './DataItemProcessor'
import { DataSourceMerger, MergeStrategy, IDataSourceMerger } from './DataSourceMerger'
import { MultiSourceIntegrator, ComponentData, DataSourceResult, IMultiSourceIntegrator } from './MultiSourceIntegrator'

/**
 * 数据源配置结构
 */
export interface DataSourceConfiguration {
  componentId: string
  dataSources: Array<{
    sourceId: string
    dataItems: Array<{
      item: DataItem
      processing: ProcessingConfig
    }>
    mergeStrategy: MergeStrategy
  }>
  createdAt: number
  updatedAt: number
}

/**
 * 执行状态跟踪 (用于调试监控)
 */
export interface ExecutionState {
  componentId: string
  dataSourceId: string
  stages: {
    /** 第一层: 原始数据获取结果 */
    rawData: Map<string, { data: any; timestamp: number; success: boolean }>
    /** 第二层: 数据处理结果 */
    processedData: Map<string, { data: any; timestamp: number; success: boolean }>
    /** 第三层: 数据源合并结果 */
    mergedData: { data: any; timestamp: number; success: boolean } | null
    /** 第四层: 最终组件数据 */
    finalData: { data: any; timestamp: number; success: boolean } | null
  }
  debugMode: boolean
  lastExecuted: number
}

/**
 * 执行结果
 */
export interface ExecutionResult {
  /** 是否成功 */
  success: boolean
  /** 组件数据 */
  componentData?: ComponentData
  /** 错误信息 */
  error?: string
  /** 执行时间（毫秒） */
  executionTime: number
  /** 时间戳 */
  timestamp: number
  /** 调试状态 */
  executionState?: ExecutionState
}

/**
 * 多层级执行器链接口
 */
export interface IMultiLayerExecutorChain {
  /**
   * 执行完整的数据处理管道
   * @param config 数据源配置
   * @param debugMode 是否开启调试模式
   * @returns 执行结果
   */
  executeDataProcessingChain(config: DataSourceConfiguration, debugMode?: boolean): Promise<ExecutionResult>
}

/**
 * 多层级执行器链实现类
 */
export class MultiLayerExecutorChain implements IMultiLayerExecutorChain {
  private dataItemFetcher: IDataItemFetcher
  private dataItemProcessor: IDataItemProcessor
  private dataSourceMerger: IDataSourceMerger
  private multiSourceIntegrator: IMultiSourceIntegrator

  constructor() {
    this.dataItemFetcher = new DataItemFetcher()
    this.dataItemProcessor = new DataItemProcessor()
    this.dataSourceMerger = new DataSourceMerger()
    this.multiSourceIntegrator = new MultiSourceIntegrator()
  }

  /**
   * 执行完整的数据处理管道
   */
  async executeDataProcessingChain(
    config: DataSourceConfiguration,
    debugMode: boolean = false
  ): Promise<ExecutionResult> {
    const startTime = Date.now()

    try {
      const dataSourceResults: DataSourceResult[] = []
      let executionState: ExecutionState | undefined

      // 初始化调试状态
      if (debugMode) {
        executionState = this.initializeExecutionState(config.componentId)
      }

      // 处理每个数据源
      for (const dataSourceConfig of config.dataSources) {
        try {
          const sourceResult = await this.processDataSource(dataSourceConfig, executionState)
          dataSourceResults.push(sourceResult)
        } catch (error) {
          console.error('MultiLayerExecutorChain: 数据源处理失败', error)
          dataSourceResults.push({
            sourceId: dataSourceConfig.sourceId,
            type: 'unknown',
            data: {},
            success: false,
            error: error instanceof Error ? error.message : '未知错误'
          })
        }
      }

      // 第四层：多源整合
      const componentData = await this.multiSourceIntegrator.integrateDataSources(dataSourceResults, config.componentId)

      // 更新调试状态
      if (executionState) {
        executionState.stages.finalData = {
          data: componentData,
          timestamp: Date.now(),
          success: Object.keys(componentData).length > 0
        }
        executionState.lastExecuted = Date.now()
      }

      const executionTime = Date.now() - startTime

      return {
        success: Object.keys(componentData).length > 0,
        componentData,
        executionTime,
        timestamp: Date.now(),
        executionState
      }
    } catch (error) {
      const executionTime = Date.now() - startTime
      console.error('MultiLayerExecutorChain: 执行器链失败', error)

      return {
        success: false,
        error: error instanceof Error ? error.message : '执行器链执行失败',
        executionTime,
        timestamp: Date.now()
      }
    }
  }

  /**
   * 处理单个数据源
   */
  private async processDataSource(
    dataSourceConfig: {
      sourceId: string
      dataItems: Array<{ item: DataItem; processing: ProcessingConfig }>
      mergeStrategy: MergeStrategy
    },
    executionState?: ExecutionState
  ): Promise<DataSourceResult> {
    try {
      const processedItems: any[] = []

      // 处理每个数据项
      for (let i = 0; i < dataSourceConfig.dataItems.length; i++) {
        const { item, processing } = dataSourceConfig.dataItems[i]
        const itemId = `${dataSourceConfig.sourceId}_item_${i}`

        try {
          // 第一层：数据项获取
          const rawData = await this.dataItemFetcher.fetchData(item)

          // 更新调试状态
          if (executionState) {
            executionState.stages.rawData.set(itemId, {
              data: rawData,
              timestamp: Date.now(),
              success: Object.keys(rawData || {}).length > 0
            })
          }

          // 第二层：数据项处理
          const processedData = await this.dataItemProcessor.processData(rawData, processing)

          // 更新调试状态
          if (executionState) {
            executionState.stages.processedData.set(itemId, {
              data: processedData,
              timestamp: Date.now(),
              success: Object.keys(processedData || {}).length > 0
            })
          }

          processedItems.push(processedData)
        } catch (error) {
          console.error(`数据项处理失败 ${itemId}:`, error)
          processedItems.push({}) // 失败时添加空对象
        }
      }

      // 第三层：数据源合并
      const mergedData = await this.dataSourceMerger.mergeDataItems(processedItems, dataSourceConfig.mergeStrategy)

      // 更新调试状态
      if (executionState) {
        executionState.stages.mergedData = {
          data: mergedData,
          timestamp: Date.now(),
          success: Object.keys(mergedData || {}).length > 0
        }
      }

      return {
        sourceId: dataSourceConfig.sourceId,
        type: dataSourceConfig.dataItems[0]?.item.type || 'unknown',
        data: mergedData,
        success: true
      }
    } catch (error) {
      console.error('数据源处理失败:', error)
      return {
        sourceId: dataSourceConfig.sourceId,
        type: 'unknown',
        data: {},
        success: false,
        error: error instanceof Error ? error.message : '数据源处理失败'
      }
    }
  }

  /**
   * 初始化执行状态
   */
  private initializeExecutionState(componentId: string): ExecutionState {
    return {
      componentId,
      dataSourceId: '',
      stages: {
        rawData: new Map(),
        processedData: new Map(),
        mergedData: null,
        finalData: null
      },
      debugMode: true,
      lastExecuted: 0
    }
  }

  /**
   * 验证数据源配置
   */
  validateConfiguration(config: DataSourceConfiguration): boolean {
    if (!config.componentId || !config.dataSources) {
      return false
    }

    return config.dataSources.every(ds => ds.sourceId && ds.dataItems && ds.dataItems.length > 0 && ds.mergeStrategy)
  }

  /**
   * 获取执行器链统计信息
   */
  getChainStatistics(): {
    version: string
    supportedDataTypes: string[]
    supportedMergeStrategies: string[]
    features: string[]
  } {
    return {
      version: '1.0.0',
      supportedDataTypes: ['json', 'http', 'websocket', 'script'],
      supportedMergeStrategies: ['object', 'array', 'script'],
      features: [
        'JSONPath数据过滤',
        '自定义脚本处理',
        '多种合并策略',
        '调试监控机制',
        'Visual Editor兼容',
        'Card2.1兼容'
      ]
    }
  }
}
