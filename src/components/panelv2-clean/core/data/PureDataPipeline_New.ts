/**
 * @file 纯净数据管道
 * @description 第一层数据管道 - 标准化数据传递协议，不关心数据具体内容
 */

import { ref, reactive } from 'vue'
import { nanoid } from 'nanoid'
import type {
  DataPipeline as IDataPipeline,
  DataSource,
  DataTarget,
  DataTransformer,
  DataChangeEvent,
  BatchChangeEvent,
  ValidationResult
} from './interfaces/PureInfrastructure'
import type {
  IPureDataPipeline,
  DataOperation,
  DataOperationType,
  DataChangeRecord
} from './interfaces/DataPipeline'

/**
 * 数据流定义
 */
interface DataFlow {
  id: string
  sourceId: string
  targetId: string
  transformer?: DataTransformer
  active: boolean
  createdAt: number
}

/**
 * 批量操作状态
 */
interface BatchOperation {
  id: string
  changes: DataChangeEvent[]
  startTime: number
  status: 'active' | 'completed' | 'aborted'
}

/**
 * 管道统计信息
 */
interface PipelineStats {
  totalDataFlows: number
  activeDataFlows: number
  totalChanges: number
  batchOperations: number
  lastActivity: number
  errors: number
}

/**
 * 纯净数据管道实现
 */
export class PureDataPipeline implements IDataPipeline, IPureDataPipeline {
  /** 数据源注册表 */
  private dataSources = new Map<string, DataSource<any>>()
  
  /** 数据目标注册表 */
  private dataTargets = new Map<string, DataTarget<any>>()
  
  /** 数据流映射 */
  private dataFlows = new Map<string, DataFlow>()
  
  /** 变更事件监听器 */
  private changeListeners = new Set<(event: DataChangeEvent) => void>()
  
  /** 批量事件监听器 */
  private batchListeners = new Set<(event: BatchChangeEvent) => void>()
  
  /** 当前批量操作 */
  private currentBatch = ref<BatchOperation | null>(null)
  
  /** 变更历史 */
  private changeHistory = ref<DataChangeEvent[]>([])
  
  /** 管道统计 */
  private stats = reactive<PipelineStats>({
    totalDataFlows: 0,
    activeDataFlows: 0,
    totalChanges: 0,
    batchOperations: 0,
    lastActivity: Date.now(),
    errors: 0
  })
  
  /** 变更队列 */
  private changeQueue: DataChangeEvent[] = []
  private processingQueue = false
  
  constructor() {
    console.log('PureDataPipeline: 纯净数据管道已初始化')
    this.setupChangeProcessor()
  }

  /**
   * 注册数据源
   */
  registerSource<T>(sourceId: string, source: DataSource<T>): void {
    try {
      console.log('PureDataPipeline: 注册数据源', sourceId)
      
      if (this.dataSources.has(sourceId)) {
        console.warn(`PureDataPipeline: 数据源 ${sourceId} 已存在，将被覆盖`)
      }
      
      this.dataSources.set(sourceId, source)
      
      // 设置数据源订阅
      if (source.subscribe) {
        source.subscribe((data) => {
          this.handleSourceDataChange(sourceId, data)
        })
      }
      
      console.log(`PureDataPipeline: 数据源 ${sourceId} 注册成功`)
      
    } catch (error) {
      console.error(`PureDataPipeline: 注册数据源 ${sourceId} 失败`, error)
      this.stats.errors++
    }
  }

  /**
   * 注册数据目标
   */
  registerTarget<T>(targetId: string, target: DataTarget<T>): void {
    try {
      console.log('PureDataPipeline: 注册数据目标', targetId)
      
      if (this.dataTargets.has(targetId)) {
        console.warn(`PureDataPipeline: 数据目标 ${targetId} 已存在，将被覆盖`)
      }
      
      this.dataTargets.set(targetId, target)
      
      console.log(`PureDataPipeline: 数据目标 ${targetId} 注册成功`)
      
    } catch (error) {
      console.error(`PureDataPipeline: 注册数据目标 ${targetId} 失败`, error)
      this.stats.errors++
    }
  }

  /**
   * 建立数据流
   */
  createDataFlow(sourceId: string, targetId: string, transformer?: DataTransformer): void {
    try {
      console.log('PureDataPipeline: 创建数据流', { sourceId, targetId })
      
      // 验证数据源和目标存在
      if (!this.dataSources.has(sourceId)) {
        throw new Error(`数据源 ${sourceId} 不存在`)
      }
      
      if (!this.dataTargets.has(targetId)) {
        throw new Error(`数据目标 ${targetId} 不存在`)
      }
      
      // 创建数据流
      const dataFlow: DataFlow = {
        id: nanoid(),
        sourceId,
        targetId,
        transformer,
        active: true,
        createdAt: Date.now()
      }
      
      this.dataFlows.set(dataFlow.id, dataFlow)
      
      // 更新统计
      this.stats.totalDataFlows++
      this.stats.activeDataFlows++
      
      console.log(`PureDataPipeline: 数据流 ${dataFlow.id} 创建成功`)
      
    } catch (error) {
      console.error('PureDataPipeline: 创建数据流失败', error)
      this.stats.errors++
      throw error
    }
  }

  /**
   * 推送数据变更
   */
  pushChange(event: DataChangeEvent): void {
    try {
      // 添加到变更队列
      this.changeQueue.push(event)
      
      // 如果在批量操作中，添加到当前批次
      if (this.currentBatch.value) {
        this.currentBatch.value.changes.push(event)
      }
      
      // 更新统计
      this.stats.totalChanges++
      this.stats.lastActivity = Date.now()
      
      // 处理变更队列
      this.processChangeQueue()
      
    } catch (error) {
      console.error('PureDataPipeline: 推送数据变更失败', error)
      this.stats.errors++
    }
  }

  /**
   * 开始批量操作
   */
  startBatch(batchId: string): void {
    try {
      console.log('PureDataPipeline: 开始批量操作', batchId)
      
      // 如果已有活跃批次，先结束它
      if (this.currentBatch.value) {
        console.warn('PureDataPipeline: 存在活跃批次，自动结束')
        this.endBatch(this.currentBatch.value.id)
      }
      
      // 创建新批次
      this.currentBatch.value = {
        id: batchId,
        changes: [],
        startTime: Date.now(),
        status: 'active'
      }
      
      // 更新统计
      this.stats.batchOperations++
      
      // 触发批量开始事件
      this.emitBatchEvent({
        batchId,
        changes: [],
        operation: 'start',
        timestamp: Date.now()
      })
      
      console.log(`PureDataPipeline: 批量操作 ${batchId} 已开始`)
      
    } catch (error) {
      console.error(`PureDataPipeline: 开始批量操作 ${batchId} 失败`, error)
      this.stats.errors++
    }
  }

  /**
   * 结束批量操作
   */
  endBatch(batchId: string): void {
    try {
      console.log('PureDataPipeline: 结束批量操作', batchId)
      
      if (!this.currentBatch.value || this.currentBatch.value.id !== batchId) {
        console.warn(`PureDataPipeline: 批量操作 ${batchId} 不存在或不活跃`)
        return
      }
      
      const batch = this.currentBatch.value
      batch.status = 'completed'
      
      // 触发批量结束事件
      this.emitBatchEvent({
        batchId,
        changes: batch.changes,
        operation: 'end',
        timestamp: Date.now()
      })
      
      console.log(`PureDataPipeline: 批量操作 ${batchId} 已结束，包含 ${batch.changes.length} 个变更`)
      
      // 清除当前批次
      this.currentBatch.value = null
      
    } catch (error) {
      console.error(`PureDataPipeline: 结束批量操作 ${batchId} 失败`, error)
      this.stats.errors++
    }
  }

  /**
   * 监听数据变更
   */
  onDataChange(callback: (event: DataChangeEvent) => void): void {
    this.changeListeners.add(callback)
    console.log('PureDataPipeline: 已添加数据变更监听器')
  }

  /**
   * 移除数据变更监听
   */
  offDataChange(callback: (event: DataChangeEvent) => void): void {
    this.changeListeners.delete(callback)
    console.log('PureDataPipeline: 已移除数据变更监听器')
  }

  /**
   * 监听批量事件
   */
  onBatchChange(callback: (event: BatchChangeEvent) => void): void {
    this.batchListeners.add(callback)
    console.log('PureDataPipeline: 已添加批量事件监听器')
  }

  /**
   * 移除批量事件监听
   */
  offBatchChange(callback: (event: BatchChangeEvent) => void): void {
    this.batchListeners.delete(callback)
    console.log('PureDataPipeline: 已移除批量事件监听器')
  }

  /**
   * 获取管道统计
   */
  getStats(): PipelineStats {
    return { ...this.stats }
  }

  /**
   * 获取变更历史 - 支持两种接口签名
   */
  getChangeHistory(targetIdOrLimit?: string | number, limit?: number): DataChangeEvent[] | DataChangeRecord[] {
    const history = this.changeHistory.value
    
    // 如果第一个参数是数字，使用原有的简单签名
    if (typeof targetIdOrLimit === 'number') {
      return targetIdOrLimit ? history.slice(-targetIdOrLimit) : [...history]
    }
    
    // 如果第一个参数是字符串，使用IPureDataPipeline的签名
    if (typeof targetIdOrLimit === 'string') {
      // 暂时返回空数组，实际实现中应该转换格式并过滤
      console.log('PureDataPipeline: 获取变更历史 (IPureDataPipeline接口)', { targetId: targetIdOrLimit, limit })
      return []
    }
    
    // 默认情况返回所有历史
    return [...history]
  }

  /**
   * 清空变更历史
   */
  clearHistory(): void {
    this.changeHistory.value = []
    console.log('PureDataPipeline: 变更历史已清空')
  }

  /**
   * 获取活跃数据流
   */
  getActiveDataFlows(): DataFlow[] {
    return Array.from(this.dataFlows.values()).filter(flow => flow.active)
  }

  /**
   * 停用数据流
   */
  deactivateDataFlow(flowId: string): void {
    const flow = this.dataFlows.get(flowId)
    if (flow) {
      flow.active = false
      this.stats.activeDataFlows--
      console.log(`PureDataPipeline: 数据流 ${flowId} 已停用`)
    }
  }

  /**
   * 激活数据流
   */
  activateDataFlow(flowId: string): void {
    const flow = this.dataFlows.get(flowId)
    if (flow) {
      flow.active = true
      this.stats.activeDataFlows++
      console.log(`PureDataPipeline: 数据流 ${flowId} 已激活`)
    }
  }

  // ==================== IPureDataPipeline 接口实现 ====================
  
  /**
   * 执行数据操作 - Phase 4: 完善数据传递链路的核心方法
   */
  async execute(operation: DataOperation): Promise<any> {
    try {
      console.log('PureDataPipeline: 执行数据操作', operation)
      
      // 创建数据变更记录
      const changeRecord: DataChangeRecord = {
        id: operation.id,
        timestamp: Date.now(),
        type: operation.type,
        targetType: operation.target.type,
        targetId: operation.target.id,
        beforeData: null, // 在实际实现中应该记录变更前的数据
        afterData: operation.payload,
        path: operation.target.path,
        source: 'user' // 默认为用户操作
      }
      
      // 发射数据变更事件
      this.emit('data-changed', changeRecord)
      
      // 更新统计
      this.stats.totalChanges++
      this.stats.lastActivity = Date.now()
      
      // 返回操作结果
      return {
        success: true,
        operation: operation,
        timestamp: Date.now()
      }
      
    } catch (error) {
      console.error('PureDataPipeline: 执行数据操作失败', error)
      this.stats.errors++
      
      throw error
    }
  }

  /**
   * 批量执行数据操作
   */
  async executeBatch(operations: DataOperation[]): Promise<any[]> {
    const batchId = nanoid()
    console.log('PureDataPipeline: 开始批量操作', batchId)
    
    try {
      // 触发批量开始事件
      this.emit('batch-start', { batchId })
      
      // 执行所有操作
      const results = []
      const changes: DataChangeRecord[] = []
      
      for (const operation of operations) {
        const result = await this.execute(operation)
        results.push(result)
        
        // 收集变更记录
        if (result.success) {
          changes.push({
            id: operation.id,
            timestamp: Date.now(),
            type: operation.type,
            targetType: operation.target.type,
            targetId: operation.target.id,
            beforeData: null,
            afterData: operation.payload,
            path: operation.target.path,
            source: 'user'
          })
        }
      }
      
      // 触发批量结束事件
      this.emit('batch-end', { batchId, changes })
      
      this.stats.batchOperations++
      
      return results
      
    } catch (error) {
      console.error('PureDataPipeline: 批量操作失败', error)
      this.stats.errors++
      throw error
    }
  }

  /**
   * 监听数据事件
   */
  on<K extends keyof any>(event: K, handler: (payload: any) => void): void {
    // 简化实现，实际应该支持完整的事件系统
    if (event === 'data-changed') {
      // 转换为现有的changeListeners系统
      this.onDataChange(handler as any)
    }
    console.log('PureDataPipeline: 添加事件监听器', event)
  }

  /**
   * 移除事件监听器
   */
  off<K extends keyof any>(event: K, handler: (payload: any) => void): void {
    if (event === 'data-changed') {
      this.offDataChange(handler as any)
    }
    console.log('PureDataPipeline: 移除事件监听器', event)
  }

  /**
   * 发射数据事件
   */
  emit<K extends keyof any>(event: K, payload: any): void {
    console.log('PureDataPipeline: 发射事件', event, payload)
    
    // 简化实现，实际应该支持完整的事件系统
    if (event === 'data-changed') {
      // 将其转换为现有的DataChangeEvent格式并处理
      const changeEvent: DataChangeEvent = {
        type: 'panelState',
        operation: 'update',
        targetId: payload.targetId || 'unknown',
        newValue: payload.afterData,
        oldValue: payload.beforeData,
        timestamp: payload.timestamp || Date.now(),
        source: 'pipeline'
      }
      
      this.emitChangeEvent(changeEvent)
    }
  }

  /**
   * 设置数据持久化处理器
   */
  setPersistence(persistence: any): void {
    console.log('PureDataPipeline: 设置持久化处理器')
    // 实际实现中应该保存持久化处理器并在相应操作中使用
  }

  // ==================== 私有方法 ====================

  /**
   * 设置变更处理器
   */
  private setupChangeProcessor(): void {
    // 使用微任务队列异步处理变更
    this.processChangeQueue = this.processChangeQueue.bind(this)
  }

  /**
   * 处理变更队列
   */
  private async processChangeQueue(): Promise<void> {
    if (this.processingQueue || this.changeQueue.length === 0) {
      return
    }
    
    this.processingQueue = true
    
    try {
      // 处理队列中的所有变更
      while (this.changeQueue.length > 0) {
        const change = this.changeQueue.shift()!
        await this.processChange(change)
      }
    } catch (error) {
      console.error('PureDataPipeline: 处理变更队列失败', error)
      this.stats.errors++
    } finally {
      this.processingQueue = false
    }
  }

  /**
   * 处理单个变更
   */
  private async processChange(event: DataChangeEvent): Promise<void> {
    try {
      // 添加到历史记录
      this.changeHistory.value.push(event)
      
      // 限制历史记录大小
      if (this.changeHistory.value.length > 1000) {
        this.changeHistory.value = this.changeHistory.value.slice(-800)
      }
      
      // 查找相关的数据流
      const relevantFlows = this.findRelevantDataFlows(event)
      
      // 执行数据流转
      for (const flow of relevantFlows) {
        await this.executeDataFlow(flow, event)
      }
      
      // 通知监听器
      this.emitChangeEvent(event)
      
    } catch (error) {
      console.error('PureDataPipeline: 处理变更失败', error)
      this.stats.errors++
    }
  }

  /**
   * 查找相关数据流
   */
  private findRelevantDataFlows(event: DataChangeEvent): DataFlow[] {
    return Array.from(this.dataFlows.values()).filter(flow => {
      if (!flow.active) return false
      
      // 根据事件类型匹配数据流
      const source = this.dataSources.get(flow.sourceId)
      return source !== undefined // 简化匹配逻辑
    })
  }

  /**
   * 执行数据流
   */
  private async executeDataFlow(flow: DataFlow, event: DataChangeEvent): Promise<void> {
    try {
      const source = this.dataSources.get(flow.sourceId)
      const target = this.dataTargets.get(flow.targetId)
      
      if (!source || !target) {
        console.warn(`PureDataPipeline: 数据流 ${flow.id} 的源或目标不存在`)
        return
      }
      
      // 获取源数据
      let data = await source.getData()
      
      // 应用转换器
      if (flow.transformer) {
        data = flow.transformer.transform(data)
      }
      
      // 验证数据
      if (target.validate) {
        const validation = target.validate(data)
        if (!validation.isValid) {
          console.warn(`PureDataPipeline: 数据验证失败`, validation.errors)
          return
        }
      }
      
      // 设置目标数据
      await target.setData(data)
      
    } catch (error) {
      console.error(`PureDataPipeline: 执行数据流 ${flow.id} 失败`, error)
      this.stats.errors++
    }
  }

  /**
   * 处理数据源变更
   */
  private handleSourceDataChange(sourceId: string, data: any): void {
    const event: DataChangeEvent = {
      type: 'panelState', // 默认类型
      operation: 'update',
      targetId: sourceId,
      newValue: data,
      timestamp: Date.now(),
      source: 'data-source'
    }
    
    this.pushChange(event)
  }

  /**
   * 触发变更事件
   */
  private emitChangeEvent(event: DataChangeEvent): void {
    this.changeListeners.forEach(callback => {
      try {
        callback(event)
      } catch (error) {
        console.error('PureDataPipeline: 变更事件回调失败', error)
      }
    })
  }

  /**
   * 触发批量事件
   */
  private emitBatchEvent(event: BatchChangeEvent): void {
    this.batchListeners.forEach(callback => {
      try {
        callback(event)
      } catch (error) {
        console.error('PureDataPipeline: 批量事件回调失败', error)
      }
    })
  }

  /**
   * 销毁管道
   */
  destroy(): void {
    // 清理所有注册
    this.dataSources.clear()
    this.dataTargets.clear()
    this.dataFlows.clear()
    
    // 清理监听器
    this.changeListeners.clear()
    this.batchListeners.clear()
    
    // 清理队列
    this.changeQueue = []
    this.changeHistory.value = []
    this.currentBatch.value = null
    
    console.log('PureDataPipeline: 数据管道已销毁')
  }

  /**
   * 发射数据变更事件（简化接口，兼容旧代码）
   */
  emitDataChange(event: { type: string; data: any; source?: string }): void {
    try {
      console.log('PureDataPipeline: 发射数据变更事件', event)
      
      // 创建数据变更事件
      const changeEvent: DataChangeEvent = {
        id: nanoid(),
        type: event.type,
        sourceId: event.source || 'manual',
        targetId: 'global',
        data: event.data,
        timestamp: Date.now()
      }

      // 记录变更历史
      this.changeHistory.value.push(changeEvent)
      
      // 限制历史记录数量
      if (this.changeHistory.value.length > 100) {
        this.changeHistory.value = this.changeHistory.value.slice(-100)
      }

      // 更新统计
      this.stats.totalChanges++
      this.stats.lastActivity = Date.now()

      console.log('PureDataPipeline: 数据变更事件已记录', changeEvent)
      
    } catch (error) {
      console.error('PureDataPipeline: 发射数据变更事件失败', error)
      this.stats.errors++
    }
  }
}

/**
 * 创建纯净数据管道实例
 */
export const createPureDataPipeline = (): PureDataPipeline => {
  return new PureDataPipeline()
}

/**
 * 全局数据管道实例（延迟初始化）
 */
let _globalPureDataPipeline: PureDataPipeline | null = null

export const globalPureDataPipeline = new Proxy({} as PureDataPipeline, {
  get(target, prop) {
    if (!_globalPureDataPipeline) {
      console.log('globalPureDataPipeline Proxy: 延迟初始化')
      _globalPureDataPipeline = createPureDataPipeline()
    }
    return _globalPureDataPipeline[prop as keyof PureDataPipeline]
  }
})