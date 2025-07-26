/**
 * @file 纯净数据传递管道实现
 * @description 第一层编辑器底座的数据传递管道实现
 * 只负责数据传递和通知，不处理具体的业务逻辑
 */

import { ref, reactive } from 'vue'
import { nanoid } from 'nanoid'
import type {
  IPureDataPipeline,
  DataOperation,
  DataChangeRecord,
  DataOperationType,
  DataPipelineEvents,
  DataPersistence,
  DataPipelineOptions,
  DataValidator,
  DataTransformer
} from './interfaces/DataPipeline'
import { EventBus, createEventBus } from './EventBus'

/**
 * 纯净数据传递管道实现类
 */
export class PureDataPipeline implements IPureDataPipeline {
  /** 内部事件总线 */
  private eventBus: EventBus

  /** 变更历史记录 */
  private changeHistory: DataChangeRecord[] = []

  /** 最大历史记录数量 */
  private maxHistorySize: number

  /** 数据持久化处理器 */
  private persistence?: DataPersistence

  /** 数据验证器映射 */
  private validators = new Map<string, DataValidator>()

  /** 数据转换器映射 */
  private transformers = new Map<string, DataTransformer>()

  /** 是否启用历史记录 */
  private enableHistory: boolean

  /** 是否启用数据验证 */
  private enableValidation: boolean

  /** 批量操作状态 */
  private batchState = {
    inProgress: false,
    batchId: '',
    operations: [] as DataOperation[],
    changes: [] as DataChangeRecord[]
  }

  constructor(options: DataPipelineOptions = {}) {
    this.eventBus = createEventBus({
      debugMode: process.env.NODE_ENV === 'development',
      maxListeners: 200
    })

    this.maxHistorySize = options.maxHistorySize || 100
    this.enableHistory = options.enableHistory !== false
    this.enableValidation = options.enableValidation !== false
    this.persistence = options.persistence

    // 初始化日志
    console.log('PureDataPipeline: 数据管道已初始化', {
      enableHistory: this.enableHistory,
      enableValidation: this.enableValidation,
      maxHistorySize: this.maxHistorySize
    })
  }

  /**
   * 执行数据操作
   */
  async execute(operation: DataOperation): Promise<any> {
    try {
      // 验证操作数据
      if (this.enableValidation) {
        const validationResult = this.validateOperation(operation)
        if (!validationResult.valid) {
          throw new Error(`数据验证失败: ${validationResult.errors.join(', ')}`)
        }
      }

      // 记录变更前状态
      const beforeData = this.captureBeforeState(operation)

      // 执行操作（这里只是模拟，实际操作由外部处理）
      const result = await this.executeOperation(operation, beforeData)

      // 记录变更
      if (this.enableHistory) {
        const changeRecord = this.createChangeRecord(operation, beforeData, result)
        this.recordChange(changeRecord)
      }

      // 发射数据变更事件
      this.emitDataChange(operation, beforeData, result)

      return result
    } catch (error) {
      console.error('PureDataPipeline: 操作执行失败', { operation, error })
      throw error
    }
  }

  /**
   * 批量执行数据操作
   */
  async executeBatch(operations: DataOperation[]): Promise<any[]> {
    if (operations.length === 0) return []

    const batchId = nanoid()

    try {
      // 开始批量操作
      this.startBatch(batchId)

      const results: any[] = []

      // 执行所有操作
      for (const operation of operations) {
        const result = await this.execute(operation)
        results.push(result)
      }

      // 结束批量操作
      this.endBatch(batchId)

      return results
    } catch (error) {
      // 批量操作失败时清理状态
      this.batchState.inProgress = false
      this.batchState.operations = []
      this.batchState.changes = []

      console.error('PureDataPipeline: 批量操作失败', { batchId, operations, error })
      throw error
    }
  }

  /**
   * 获取数据变更历史
   */
  getChangeHistory(targetId?: string, limit?: number): DataChangeRecord[] {
    let history = this.changeHistory

    // 按目标ID过滤
    if (targetId) {
      history = history.filter(record => record.targetId === targetId)
    }

    // 限制返回数量
    if (limit && limit > 0) {
      history = history.slice(-limit)
    }

    return [...history]
  }

  /**
   * 清空变更历史
   */
  clearHistory(): void {
    this.changeHistory = []
    console.log('PureDataPipeline: 变更历史已清空')
  }

  /**
   * 监听数据事件
   */
  on<K extends keyof DataPipelineEvents>(event: K, handler: (payload: DataPipelineEvents[K]) => void): void {
    this.eventBus.on(event, handler)
  }

  /**
   * 移除事件监听器
   */
  off<K extends keyof DataPipelineEvents>(event: K, handler: (payload: DataPipelineEvents[K]) => void): void {
    this.eventBus.off(event, handler)
  }

  /**
   * 发射数据事件
   */
  emit<K extends keyof DataPipelineEvents>(event: K, payload: DataPipelineEvents[K]): void {
    this.eventBus.emit(event, payload)
  }

  /**
   * 设置数据持久化处理器
   */
  setPersistence(persistence: DataPersistence): void {
    this.persistence = persistence
    console.log('PureDataPipeline: 持久化处理器已设置', {
      autosave: persistence.autosave,
      autosaveInterval: persistence.autosaveInterval
    })
  }

  /**
   * 销毁数据管道
   */
  destroy(): void {
    this.eventBus.clear()
    this.changeHistory = []
    this.validators.clear()
    this.transformers.clear()
    console.log('PureDataPipeline: 数据管道已销毁')
  }

  // ==================== 私有方法 ====================

  /**
   * 验证操作数据
   */
  private validateOperation(operation: DataOperation): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    // 基础验证
    if (!operation.id) {
      errors.push('操作ID不能为空')
    }

    if (!operation.type) {
      errors.push('操作类型不能为空')
    }

    if (!operation.target?.type || !operation.target?.id) {
      errors.push('操作目标不能为空')
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * 捕获操作前状态
   */
  private captureBeforeState(operation: DataOperation): any {
    // 这里只是示例，实际应该从外部状态获取
    return {
      timestamp: Date.now(),
      operation: operation.type,
      target: operation.target
    }
  }

  /**
   * 执行具体操作
   */
  private async executeOperation(operation: DataOperation, beforeData: any): Promise<any> {
    // 这里只是数据传递，具体操作由外部处理
    // 返回操作结果的模拟数据
    return {
      success: true,
      operationId: operation.id,
      timestamp: Date.now(),
      beforeData,
      afterData: operation.payload
    }
  }

  /**
   * 创建变更记录
   */
  private createChangeRecord(operation: DataOperation, beforeData: any, result: any): DataChangeRecord {
    return {
      id: nanoid(),
      timestamp: Date.now(),
      type: operation.type,
      targetType: operation.target.type as 'panel' | 'node' | 'config',
      targetId: operation.target.id,
      beforeData,
      afterData: result.afterData,
      path: operation.target.path,
      source: 'user' // 默认为用户操作
    }
  }

  /**
   * 记录变更
   */
  private recordChange(changeRecord: DataChangeRecord): void {
    if (this.batchState.inProgress) {
      // 批量操作中，暂存变更记录
      this.batchState.changes.push(changeRecord)
    } else {
      // 直接记录变更
      this.addToHistory(changeRecord)
    }
  }

  /**
   * 添加到历史记录
   */
  private addToHistory(changeRecord: DataChangeRecord): void {
    this.changeHistory.push(changeRecord)

    // 限制历史记录数量
    if (this.changeHistory.length > this.maxHistorySize) {
      this.changeHistory = this.changeHistory.slice(-this.maxHistorySize)
    }
  }

  /**
   * 发射数据变更事件
   */
  private emitDataChange(operation: DataOperation, beforeData: any, result: any): void {
    const changeRecord = this.createChangeRecord(operation, beforeData, result)

    if (!this.batchState.inProgress) {
      this.emit('data-changed', changeRecord)
    }
  }

  /**
   * 开始批量操作
   */
  private startBatch(batchId: string): void {
    this.batchState.inProgress = true
    this.batchState.batchId = batchId
    this.batchState.operations = []
    this.batchState.changes = []

    this.emit('batch-start', { batchId })
  }

  /**
   * 结束批量操作
   */
  private endBatch(batchId: string): void {
    if (!this.batchState.inProgress || this.batchState.batchId !== batchId) {
      return
    }

    const changes = [...this.batchState.changes]

    // 将批量变更添加到历史记录
    changes.forEach(change => this.addToHistory(change))

    // 发射批量结束事件
    this.emit('batch-end', { batchId, changes })

    // 重置批量状态
    this.batchState.inProgress = false
    this.batchState.batchId = ''
    this.batchState.operations = []
    this.batchState.changes = []
  }

  // ==================== 公共工具方法 ====================

  /**
   * 注册数据验证器
   */
  registerValidator(name: string, validator: DataValidator): void {
    this.validators.set(name, validator)
    console.log(`PureDataPipeline: 验证器 "${name}" 已注册`)
  }

  /**
   * 注册数据转换器
   */
  registerTransformer(name: string, transformer: DataTransformer): void {
    this.transformers.set(name, transformer)
    console.log(`PureDataPipeline: 转换器 "${name}" 已注册`)
  }

  /**
   * 获取统计信息
   */
  getStats(): {
    historySize: number
    validatorCount: number
    transformerCount: number
    batchInProgress: boolean
  } {
    return {
      historySize: this.changeHistory.length,
      validatorCount: this.validators.size,
      transformerCount: this.transformers.size,
      batchInProgress: this.batchState.inProgress
    }
  }
}

/**
 * 创建纯净数据管道实例
 */
export const createPureDataPipeline = (options?: DataPipelineOptions): PureDataPipeline => {
  return new PureDataPipeline(options)
}

/**
 * 默认全局数据管道实例
 */
export const globalDataPipeline = createPureDataPipeline({
  enableHistory: true,
  enableValidation: true,
  maxHistorySize: 200
})
