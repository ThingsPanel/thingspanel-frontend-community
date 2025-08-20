/**
 * 多数据源执行器
 * 支持v2.0.0配置格式，能够并行处理多个数据源并合并结果
 */

import { ref, reactive, computed, type Ref } from 'vue'
import { createDataSourceExecutor } from './DataSourceExecutor'
import type {
  MultiDataSourceConfig,
  MultiDataSourceExecutionState,
  DataSourceConfig,
  ExecutionState,
  ErrorHandlingStrategy,
  IMultiDataSourceExecutor,
  IDataSourceExecutor
} from '../types/execution'

/**
 * 多数据源执行器实现
 */
export class MultiDataSourceExecutor implements IMultiDataSourceExecutor {
  // 配置和状态
  private config: Ref<MultiDataSourceConfig | null> = ref(null)
  private state: MultiDataSourceExecutionState = reactive({
    isExecuting: false,
    lastExecuteTime: null,
    lastError: null,
    executionCount: 0,
    dataSourceStates: {},
    finalResults: {},
    overallStats: {
      totalDataSources: 0,
      successfulDataSources: 0,
      failedDataSources: 0,
      averageDuration: 0,
      totalDuration: 0
    },
    parallelExecution: true,
    completedDataSources: [],
    failedDataSources: []
  })

  // 各数据源的执行器实例
  private executors: Map<string, IDataSourceExecutor> = new Map()

  // 错误处理策略
  private errorHandlingStrategy: Ref<ErrorHandlingStrategy> = ref({
    tolerant: true,
    retryPolicy: {
      enabled: false,
      maxRetries: 3,
      retryDelay: 1000,
      exponentialBackoff: true
    }
  })

  constructor() {
    console.log('🏗️ [MultiExecutor] 多数据源执行器初始化')
  }

  /**
   * 加载多数据源配置
   */
  loadConfig(config: MultiDataSourceConfig): void {
    console.log('📋 [MultiExecutor] 加载多数据源配置:', {
      version: config.version,
      dataSourceCount: Object.keys(config.dataSources).length,
      dataSourceKeys: Object.keys(config.dataSources)
    })

    this.config.value = config
    this.resetState()
    this.createExecutors()
  }

  /**
   * 获取当前配置
   */
  getConfig(): MultiDataSourceConfig | null {
    return this.config.value
  }

  /**
   * 创建各数据源的执行器实例
   */
  private createExecutors(): void {
    if (!this.config.value) return

    // 清理旧的执行器
    this.destroyExecutors()

    // 为每个数据源创建执行器
    Object.entries(this.config.value.dataSources).forEach(([dataSourceKey, dataSourceConfig]) => {
      const executor = createDataSourceExecutor()

      // 转换为单数据源配置格式
      const singleConfig: DataSourceConfig = {
        dataSourceKey,
        configuration: dataSourceConfig.configuration,
        version: this.config.value?.version,
        exportTime: this.config.value?.exportTime,
        currentData: dataSourceConfig.currentData
      }

      executor.loadConfig(singleConfig)
      executor.setErrorHandlingStrategy(this.errorHandlingStrategy.value)

      this.executors.set(dataSourceKey, executor)

      console.log(`🔧 [MultiExecutor] 为数据源 ${dataSourceKey} 创建执行器`)
    })
  }

  /**
   * 销毁所有执行器
   */
  private destroyExecutors(): void {
    this.executors.forEach((executor, key) => {
      executor.destroy()
      console.log(`🗑️ [MultiExecutor] 销毁数据源 ${key} 的执行器`)
    })
    this.executors.clear()
  }

  /**
   * 重置执行状态
   */
  private resetState(): void {
    this.state.dataSourceStates = {}
    this.state.finalResults = {}
    this.state.completedDataSources = []
    this.state.failedDataSources = []
    this.state.lastError = null
    this.state.overallStats = {
      totalDataSources: 0,
      successfulDataSources: 0,
      failedDataSources: 0,
      averageDuration: 0,
      totalDuration: 0
    }
  }

  /**
   * 执行所有数据源 - 主入口方法
   */
  async executeAll(): Promise<MultiDataSourceExecutionState> {
    if (!this.config.value) {
      throw new Error('未加载配置，无法执行')
    }

    console.log('🚀 [MultiExecutor] 开始执行所有数据源', {
      totalCount: Object.keys(this.config.value.dataSources).length,
      parallelExecution: this.state.parallelExecution
    })

    this.state.isExecuting = true
    this.state.lastError = null
    this.state.executionCount++
    this.state.completedDataSources = []
    this.state.failedDataSources = []

    const startTime = Date.now()

    try {
      const dataSourceKeys = Object.keys(this.config.value.dataSources)
      this.state.overallStats.totalDataSources = dataSourceKeys.length

      if (this.state.parallelExecution) {
        // 并行执行所有数据源
        await this.executeDataSourcesInParallel(dataSourceKeys)
      } else {
        // 串行执行所有数据源
        await this.executeDataSourcesInSequence(dataSourceKeys)
      }

      // 计算总体统计
      this.calculateOverallStats(Date.now() - startTime)

      this.state.lastExecuteTime = new Date().toISOString()
      console.log('✅ [MultiExecutor] 所有数据源执行完成', {
        successful: this.state.overallStats.successfulDataSources,
        failed: this.state.overallStats.failedDataSources,
        totalDuration: this.state.overallStats.totalDuration
      })

      console.log('🎯 [MultiExecutor] 最终合并结果:')
      Object.entries(this.state.finalResults).forEach(([key, value]) => {
        console.log(`  📦 ${key}: ${typeof value}`, value)
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      this.state.lastError = errorMessage
      console.error('❌ [MultiExecutor] 多数据源执行失败:', error)
      throw error
    } finally {
      this.state.isExecuting = false
    }

    return this.state
  }

  /**
   * 并行执行所有数据源
   */
  private async executeDataSourcesInParallel(dataSourceKeys: string[]): Promise<void> {
    console.log('⚡ [MultiExecutor] 并行执行数据源')

    const promises = dataSourceKeys.map(async dataSourceKey => {
      try {
        const result = await this.executeDataSource(dataSourceKey)
        this.state.completedDataSources.push(dataSourceKey)
        this.state.finalResults[dataSourceKey] = result
        console.log(`✅ [MultiExecutor] 数据源 ${dataSourceKey} 执行成功`)
      } catch (error) {
        this.state.failedDataSources.push(dataSourceKey)
        this.state.finalResults[dataSourceKey] = null

        const errorMessage = error instanceof Error ? error.message : String(error)
        console.error(`❌ [MultiExecutor] 数据源 ${dataSourceKey} 执行失败:`, errorMessage)

        // 根据错误容忍策略决定是否抛出错误
        if (!this.errorHandlingStrategy.value.tolerant) {
          throw error
        }
      }
    })

    await Promise.allSettled(promises)
  }

  /**
   * 串行执行所有数据源
   */
  private async executeDataSourcesInSequence(dataSourceKeys: string[]): Promise<void> {
    console.log('📈 [MultiExecutor] 串行执行数据源')

    for (const dataSourceKey of dataSourceKeys) {
      try {
        const result = await this.executeDataSource(dataSourceKey)
        this.state.completedDataSources.push(dataSourceKey)
        this.state.finalResults[dataSourceKey] = result
        console.log(`✅ [MultiExecutor] 数据源 ${dataSourceKey} 执行成功`)
      } catch (error) {
        this.state.failedDataSources.push(dataSourceKey)
        this.state.finalResults[dataSourceKey] = null

        const errorMessage = error instanceof Error ? error.message : String(error)
        console.error(`❌ [MultiExecutor] 数据源 ${dataSourceKey} 执行失败:`, errorMessage)

        // 根据错误容忍策略决定是否继续
        if (!this.errorHandlingStrategy.value.tolerant) {
          throw error
        }
      }
    }
  }

  /**
   * 执行单个数据源
   */
  async executeDataSource(dataSourceKey: string): Promise<any> {
    const executor = this.executors.get(dataSourceKey)
    if (!executor) {
      throw new Error(`数据源 ${dataSourceKey} 的执行器不存在`)
    }

    console.log(`🔄 [MultiExecutor] 执行数据源: ${dataSourceKey}`)

    const executionState = await executor.executeAll()
    this.state.dataSourceStates[dataSourceKey] = executionState

    // 返回该数据源的最终结果
    console.log(`📤 [MultiExecutor] 数据源 ${dataSourceKey} 最终结果类型: ${typeof executionState.finalResult}`)
    console.log(`📤 [MultiExecutor] 数据源 ${dataSourceKey} 最终结果内容:`, executionState.finalResult)
    return executionState.finalResult
  }

  /**
   * 计算总体统计信息
   */
  private calculateOverallStats(totalDuration: number): void {
    this.state.overallStats.successfulDataSources = this.state.completedDataSources.length
    this.state.overallStats.failedDataSources = this.state.failedDataSources.length
    this.state.overallStats.totalDuration = totalDuration

    // 计算平均执行时间
    const validStates = Object.values(this.state.dataSourceStates).filter(
      state => state.stats && state.stats.totalDuration > 0
    )

    if (validStates.length > 0) {
      const totalValidDuration = validStates.reduce((sum, state) => sum + (state.stats?.totalDuration || 0), 0)
      this.state.overallStats.averageDuration = totalValidDuration / validStates.length
    }
  }

  /**
   * 获取执行状态
   */
  getExecutionState(): MultiDataSourceExecutionState {
    return this.state
  }

  /**
   * 获取最终结果
   */
  getFinalResults(): Record<string, any> {
    return this.state.finalResults
  }

  /**
   * 获取指定数据源的执行状态
   */
  getDataSourceState(dataSourceKey: string): ExecutionState | null {
    return this.state.dataSourceStates[dataSourceKey] || null
  }

  /**
   * 设置并行执行模式
   */
  setParallelExecution(enabled: boolean): void {
    this.state.parallelExecution = enabled
    console.log(`⚙️ [MultiExecutor] 并行执行模式: ${enabled ? '启用' : '禁用'}`)
  }

  /**
   * 是否启用并行执行
   */
  isParallelExecution(): boolean {
    return this.state.parallelExecution
  }

  /**
   * 设置错误处理策略
   */
  setErrorHandlingStrategy(strategy: ErrorHandlingStrategy): void {
    this.errorHandlingStrategy.value = strategy

    // 更新所有执行器的错误处理策略
    this.executors.forEach(executor => {
      executor.setErrorHandlingStrategy(strategy)
    })

    console.log('⚙️ [MultiExecutor] 错误处理策略已更新:', strategy)
  }

  /**
   * 销毁执行器
   */
  destroy(): void {
    console.log('🗑️ [MultiExecutor] 销毁多数据源执行器')
    this.destroyExecutors()
    this.resetState()
    this.config.value = null
  }
}

/**
 * 创建多数据源执行器实例
 */
export function createMultiDataSourceExecutor(): MultiDataSourceExecutor {
  return new MultiDataSourceExecutor()
}

/**
 * 辅助函数：检测配置格式并返回适当的执行器
 */
export function createExecutorByConfig(config: any): IDataSourceExecutor | MultiDataSourceExecutor {
  if (config.version === '2.0.0' && config.dataSources) {
    // v2.0.0 多数据源格式
    const multiExecutor = createMultiDataSourceExecutor()
    multiExecutor.loadConfig(config as MultiDataSourceConfig)
    return multiExecutor
  } else if (config.dataSourceKey && config.configuration) {
    // 旧的单数据源格式
    const singleExecutor = createDataSourceExecutor()
    singleExecutor.loadConfig(config as DataSourceConfig)
    return singleExecutor
  } else {
    throw new Error('不支持的配置格式')
  }
}
