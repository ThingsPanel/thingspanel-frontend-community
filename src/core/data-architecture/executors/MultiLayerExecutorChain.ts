/**
 * 多层级执行器链主协调类
 * 整合4层执行器，提供完整的数据处理管道
 */

import { DataItemFetcher, DataItem, IDataItemFetcher } from '@/core/data-architecture/executors/DataItemFetcher'
import {
  DataItemProcessor,
  ProcessingConfig,
  IDataItemProcessor
} from '@/core/data-architecture/executors/DataItemProcessor'
import { DataSourceMerger, MergeStrategy, IDataSourceMerger } from '@/core/data-architecture/executors/DataSourceMerger'
import {
  MultiSourceIntegrator,
  ComponentData,
  DataSourceResult,
  IMultiSourceIntegrator
} from '@/core/data-architecture/executors/MultiSourceIntegrator'

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

    // 🔥 设置DataItemFetcher的组件上下文
    this.dataItemFetcher.setCurrentComponentId(config.componentId)

    // 🔥 移除循环打印日志，避免200+组件场景下的性能问题

    try {
      const dataSourceResults: DataSourceResult[] = []
      let executionState: ExecutionState | undefined

      // 初始化调试状态
      if (debugMode) {
        executionState = this.initializeExecutionState(config.componentId)
      }

      // 处理每个数据源
      for (const dataSourceConfig of config.dataSources) {
        // 🔥 移除循环打印日志

        // 🔥 关键调试：如果dataItems不存在或为空，立即报告
        if (!dataSourceConfig.dataItems || dataSourceConfig.dataItems.length === 0) {
          console.error(`🚨 [MultiLayerExecutorChain] 数据源配置异常 - dataItems为空！`, {
            数据源ID: dataSourceConfig.sourceId,
            dataItems类型: typeof dataSourceConfig.dataItems,
            dataItems值: dataSourceConfig.dataItems,
            这意味着: 'DataItemFetcher.fetchData方法不会被调用',
            数据源完整配置: JSON.stringify(dataSourceConfig, null, 2)
          })
        }

        try {
          const sourceResult = await this.processDataSource(dataSourceConfig, executionState, config.componentId)

          // 🔥 移除循环打印日志

          dataSourceResults.push(sourceResult)
        } catch (error) {
          console.error(`❌ [MultiLayerExecutorChain] processDataSource调用失败:`, {
            数据源ID: dataSourceConfig.sourceId,
            错误类型: typeof error,
            错误消息: error instanceof Error ? error.message : error,
            错误堆栈: error instanceof Error ? error.stack : undefined,
            原始错误对象: error
          })

          dataSourceResults.push({
            sourceId: dataSourceConfig.sourceId,
            type: 'unknown',
            data: {},
            success: false,
            error: error instanceof Error ? error.message : '未知错误'
          })
        }
      }

      // 🔥 移除循环打印日志

      // 第四层：多源整合
      const componentData = await this.multiSourceIntegrator.integrateDataSources(dataSourceResults, config.componentId)

      // 🔥 移除循环打印日志

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

      // 🔥 修复：执行成功就是成功，无论数据是否为空
      return {
        success: true, // 只要没有异常就是成功
        componentData,
        executionTime,
        timestamp: Date.now(),
        executionState,
        // 添加辅助信息
        isEmpty: Object.keys(componentData).length === 0
      }
    } catch (error) {
      const executionTime = Date.now() - startTime

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
    executionState?: ExecutionState,
    componentId?: string
  ): Promise<DataSourceResult> {
    // 🔥 最简单的确认日志

    // 🔥 关键调试：记录processDataSource的入口参数

    try {
      const processedItems: any[] = []

      // 🔥 关键调试：检查dataItems数组

      if (dataSourceConfig.dataItems.length === 0) {
        console.warn(`⚠️ [MultiLayerExecutorChain] dataItems数组为空，无法执行任何数据获取！`, {
          数据源ID: dataSourceConfig.sourceId,
          这意味着: '不会调用DataItemFetcher.fetchData方法'
        })
      }

      // 处理每个数据项
      for (let i = 0; i < dataSourceConfig.dataItems.length; i++) {
        const { item, processing } = dataSourceConfig.dataItems[i]
        const itemId = `${dataSourceConfig.sourceId}_item_${i}`

        try {
          // 🔍 调试：检查传递给fetchData的item对象

          // 🔥 特别检查HTTP类型的配置
          if (item.type === 'http' && item.config) {
            // 🚨 检查HTTP参数中是否有损坏的绑定路径
            const allParams = [
              ...(item.config.params || []),
              ...(item.config.parameters || []),
              ...(item.config.pathParams || [])
            ]

            allParams.forEach((param, paramIndex) => {
              if (param.value && typeof param.value === 'string') {
                const isSuspiciousPath = !param.value.includes('.') && param.value.length < 10 && param.variableName

                if (isSuspiciousPath) {
                  console.error(`🚨 [MultiLayerExecutorChain] 在传递给fetchData前发现损坏的绑定路径!`, {
                    组件ID: componentId || 'unknown',
                    数据源ID: dataSourceConfig.sourceId,
                    参数索引: paramIndex,
                    参数key: param.key,
                    损坏的value: param.value,
                    variableName: param.variableName,
                    完整参数对象: JSON.stringify(param, null, 2)
                  })
                } else {
                }
              }
            })
          }

          // 🔥 第一层：数据项获取 - 即将调用DataItemFetcher.fetchData

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
          console.error(`🚨 [MultiLayerExecutorChain] 数据项处理失败 - 这是关键异常！`, {
            itemId: itemId,
            item类型: item.type,
            数据项索引: i,
            错误类型: typeof error,
            错误消息: error instanceof Error ? error.message : error,
            错误堆栈: error instanceof Error ? error.stack : undefined,
            原始错误对象: error,
            item配置: item.config,
            这就是为什么没有HTTP请求的原因: '异常被静默处理了'
          })
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

    // 允许数据项数组为空，这样可以返回 null 数据
    return config.dataSources.every(ds => ds.sourceId && Array.isArray(ds.dataItems) && ds.mergeStrategy)
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
