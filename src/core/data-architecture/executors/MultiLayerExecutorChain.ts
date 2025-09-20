/**
 * 多层级执行器链主协调类
 * 整合4层执行器，提供完整的数据处理管道
 */

import { DataItemFetcher, DataItem, IDataItemFetcher } from '@/core/data-architecture/executors/DataItemFetcher'
import { DataItemProcessor, ProcessingConfig, IDataItemProcessor } from '@/core/data-architecture/executors/DataItemProcessor'
import { DataSourceMerger, MergeStrategy, IDataSourceMerger } from '@/core/data-architecture/executors/DataSourceMerger'
import { MultiSourceIntegrator, ComponentData, DataSourceResult, IMultiSourceIntegrator } from '@/core/data-architecture/executors/MultiSourceIntegrator'

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

    // 🎯 用户要求的打印这几个字 - 调试：MultiLayerExecutorChain开始执行
    console.log(`🎯 用户要求的打印这几个字 - 调试：MultiLayerExecutorChain开始执行`, {
      componentId: config.componentId,
      数据源数量: config.dataSources.length,
      调试模式: debugMode,
      配置详情: config.dataSources.map(ds => ({
        数据源ID: ds.sourceId,
        数据项数量: ds.dataItems.length,
        合并策略: ds.mergeStrategy,
        数据项详情: ds.dataItems.map(item => ({
          类型: item.item.type,
          配置: item.item.config,
          处理配置: item.processing
        }))
      }))
    })

    try {
      const dataSourceResults: DataSourceResult[] = []
      let executionState: ExecutionState | undefined

      // 初始化调试状态
      if (debugMode) {
        executionState = this.initializeExecutionState(config.componentId)
      }

      // 处理每个数据源
      for (const dataSourceConfig of config.dataSources) {
        // 🎯 用户要求的打印这几个字 - 调试：开始处理数据源
        console.log(`🎯 用户要求的打印这几个字 - 调试：开始处理数据源`, {
          数据源ID: dataSourceConfig.sourceId,
          数据项数量: dataSourceConfig.dataItems ? dataSourceConfig.dataItems.length : 'undefined',
          数据项存在: !!dataSourceConfig.dataItems,
          合并策略: dataSourceConfig.mergeStrategy,
          数据源配置完整性: {
            sourceId存在: !!dataSourceConfig.sourceId,
            dataItems存在: !!dataSourceConfig.dataItems,
            mergeStrategy存在: !!dataSourceConfig.mergeStrategy
          }
        })

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
          console.log(`🔍 [MultiLayerExecutorChain] ============ 即将调用 processDataSource ============`)
          console.log(`🚨 [MultiLayerExecutorChain] 161行测试 - 这行应该能看到`)
          console.log(`🔍 [MultiLayerExecutorChain] processDataSource调用参数:`, {
            数据源ID: dataSourceConfig.sourceId,
            dataSourceConfig完整: dataSourceConfig,
            executionState存在: !!executionState,
            processDataSource方法存在: typeof this.processDataSource === 'function'
          })

          const sourceResult = await this.processDataSource(dataSourceConfig, executionState, config.componentId)

          console.log(`🔍 [MultiLayerExecutorChain] processDataSource调用完成:`, {
            数据源ID: dataSourceConfig.sourceId,
            返回结果: sourceResult
          })

          // 🎯 用户要求的打印这几个字 - 调试：数据源处理完成
          console.log(`🎯 用户要求的打印这几个字 - 调试：数据源处理完成`, {
            数据源ID: dataSourceConfig.sourceId,
            处理结果: sourceResult,
            是否成功: sourceResult.success,
            数据内容: sourceResult.data,
            错误信息: sourceResult.error
          })

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

      // 🎯 用户要求的打印这几个字 - 调试：开始最终整合
      console.log(`🎯 用户要求的打印这几个字 - 调试：开始最终整合`, {
        数据源结果数量: dataSourceResults.length,
        各数据源结果: dataSourceResults.map(result => ({
          数据源ID: result.sourceId,
          是否成功: result.success,
          数据类型: result.type,
          数据内容: result.data,
          错误: result.error
        }))
      })

      // 第四层：多源整合
      const componentData = await this.multiSourceIntegrator.integrateDataSources(dataSourceResults, config.componentId)

      // 🎯 用户要求的打印这几个字 - 调试：最终整合完成
      console.log(`🎯 用户要求的打印这几个字 - 调试：最终整合完成`, {
        组件ID: config.componentId,
        最终组件数据: componentData,
        数据键数量: Object.keys(componentData).length,
        数据键列表: Object.keys(componentData),
        是否为空: Object.keys(componentData).length === 0
      })

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
    console.log(`🚨 [processDataSource] 方法入口已到达!`)

    // 🔥 关键调试：记录processDataSource的入口参数
    console.log(`🔍 [MultiLayerExecutorChain] =============== processDataSource开始 ===============`)
    console.log(`🔍 [MultiLayerExecutorChain] 数据源配置完整信息:`, {
      数据源ID: dataSourceConfig.sourceId,
      dataItems数组长度: dataSourceConfig.dataItems ? dataSourceConfig.dataItems.length : 'undefined',
      dataItems是否存在: !!dataSourceConfig.dataItems,
      mergeStrategy: dataSourceConfig.mergeStrategy,
      executionState存在: !!executionState,
      完整配置JSON: JSON.stringify(dataSourceConfig, null, 2)
    })

    console.log(`🚨 [processDataSource] 进入try块`)

    try {
      const processedItems: any[] = []
      console.log(`🚨 [processDataSource] processedItems初始化完成`)

      // 🔥 关键调试：检查dataItems数组
      console.log(`🚨 [processDataSource] 即将检查dataItems数组`)
      console.log(`🔍 [MultiLayerExecutorChain] 开始处理dataItems:`, {
        数据源ID: dataSourceConfig.sourceId,
        dataItems长度: dataSourceConfig.dataItems.length,
        dataItems是否为空: dataSourceConfig.dataItems.length === 0,
        dataItems详情: dataSourceConfig.dataItems.map((item, index) => ({
          索引: index,
          类型: item.item.type,
          配置有效性: !!item.item.config,
          processing有效性: !!item.processing
        }))
      })

      if (dataSourceConfig.dataItems.length === 0) {
        console.warn(`⚠️ [MultiLayerExecutorChain] dataItems数组为空，无法执行任何数据获取！`, {
          数据源ID: dataSourceConfig.sourceId,
          这意味着: '不会调用DataItemFetcher.fetchData方法'
        })
      }

      console.log(`🚨 [processDataSource] 即将开始for循环处理dataItems`)
      console.log(`🚨 [processDataSource] dataItems.length = ${dataSourceConfig.dataItems.length}`)

      // 处理每个数据项
      for (let i = 0; i < dataSourceConfig.dataItems.length; i++) {
        console.log(`🚨 [processDataSource] 进入for循环，i = ${i}`)

        const { item, processing } = dataSourceConfig.dataItems[i]
        const itemId = `${dataSourceConfig.sourceId}_item_${i}`

        console.log(`🚨 [processDataSource] 数据项解构完成，itemId = ${itemId}`)
        console.log(`🚨 [processDataSource] 326行测试 - 这行应该能看到`)
        console.log(`🔍 [MultiLayerExecutorChain] 即将处理第${i}个数据项:`, {
          数据项索引: i,
          数据项ID: itemId,
          item类型: item.type,
          item配置存在: !!item.config,
          processing配置存在: !!processing
        })

        try {
          // 🔍 调试：检查传递给fetchData的item对象
          console.log(`🔍 [MultiLayerExecutorChain] 传递给fetchData的item对象详情:`, {
            组件ID: componentId || 'unknown',
            数据源ID: dataSourceConfig.sourceId,
            数据项索引: i,
            数据项ID: itemId,
            item类型: item.type,
            item完整配置: JSON.stringify(item, null, 2),
            传递时间戳: Date.now()
          })

          // 🔥 特别检查HTTP类型的配置
          if (item.type === 'http' && item.config) {
            console.log(`🔍 [MultiLayerExecutorChain] HTTP配置详细检查:`, {
              url: item.config.url,
              method: item.config.method,
              params数量: item.config.params ? item.config.params.length : 0,
              parameters数量: item.config.parameters ? item.config.parameters.length : 0,
              pathParams数量: item.config.pathParams ? item.config.pathParams.length : 0
            })

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
                  console.log(`✅ [MultiLayerExecutorChain] 参数绑定路径检查通过:`, {
                    参数key: param.key,
                    绑定路径: param.value,
                    路径长度: param.value.length
                  })
                }
              }
            })
          }

          // 🔥 第一层：数据项获取 - 即将调用DataItemFetcher.fetchData
          console.log(`🚀 [MultiLayerExecutorChain] ============ 即将调用 DataItemFetcher.fetchData ============`)
          console.log(`🚀 [MultiLayerExecutorChain] 调用参数:`, {
            itemId: itemId,
            item类型: item.type,
            item配置: item.config,
            fetchData方法存在: typeof this.dataItemFetcher.fetchData === 'function',
            dataItemFetcher实例存在: !!this.dataItemFetcher,
            调用时间戳: Date.now()
          })

          const rawData = await this.dataItemFetcher.fetchData(item)

          console.log(`✅ [MultiLayerExecutorChain] DataItemFetcher.fetchData调用完成:`, {
            itemId: itemId,
            rawData类型: typeof rawData,
            rawData是否为空: rawData === null || rawData === undefined,
            rawData键数量: typeof rawData === 'object' && rawData ? Object.keys(rawData).length : 'N/A',
            rawData完整内容: rawData
          })

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
