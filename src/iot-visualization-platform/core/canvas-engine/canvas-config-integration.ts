/**
 * Canvas配置集成管理器
 *
 * 负责Canvas引擎与Config Engine之间的双向数据同步，确保：
 * 1. Canvas节点变更自动更新配置系统
 * 2. 配置系统变更自动同步到Canvas渲染
 * 3. 实时状态同步和事件传递
 * 4. 配置验证和错误处理
 *
 * @author Claude
 * @version 1.0.0
 */

import { EventEmitter } from 'events'
import type {
  EditorCanvasConfiguration,
  EditorNodeConfiguration,
  WidgetConfiguration,
  ConfigurationValidationResult,
  CanvasNode,
  CanvasPosition,
  CanvasSize
} from '../config-engine/types'
import type { FabricCanvasEngine } from './fabric-canvas-engine'
import type { EnhancedConfigurationStateManager } from '../config-engine/enhanced-config-state-manager'

/**
 * Canvas配置同步选项
 */
export interface CanvasConfigSyncOptions {
  // 是否启用实时同步
  realTimeSync?: boolean
  // 同步延迟（毫秒）
  syncDelay?: number
  // 是否启用配置验证
  enableValidation?: boolean
  // 是否启用批量更新优化
  enableBatchUpdate?: boolean
  // 批量更新间隔（毫秒）
  batchInterval?: number
  // 是否启用撤销/重做支持
  enableUndoRedo?: boolean
  // 撤销历史最大条目数
  maxUndoSteps?: number
}

/**
 * Canvas节点状态更新数据
 */
export interface CanvasNodeStateUpdate {
  nodeId: string
  position?: CanvasPosition
  size?: CanvasSize
  rotation?: number
  opacity?: number
  visible?: boolean
  locked?: boolean
  zIndex?: number
  configuration?: Partial<WidgetConfiguration>
}

/**
 * Canvas状态同步事件
 */
export interface CanvasStateSyncEvent {
  type: 'node:added' | 'node:removed' | 'node:updated' | 'canvas:updated'
  nodeId?: string
  canvasId: string
  data?: any
  timestamp: number
}

/**
 * 批量更新操作
 */
export interface BatchUpdateOperation {
  type: 'add' | 'remove' | 'update'
  nodeId: string
  data?: CanvasNodeStateUpdate
  timestamp: number
}

/**
 * Canvas配置集成管理器
 *
 * 提供Canvas引擎与Config Engine之间的完整集成功能
 */
export class CanvasConfigIntegration extends EventEmitter {
  private canvasEngine: FabricCanvasEngine
  private configManager: EnhancedConfigurationStateManager
  private options: Required<CanvasConfigSyncOptions>
  private syncTimer: NodeJS.Timeout | null = null
  private batchOperations: BatchUpdateOperation[] = []
  private batchTimer: NodeJS.Timeout | null = null
  private undoStack: CanvasStateSyncEvent[] = []
  private redoStack: CanvasStateSyncEvent[] = []
  private isProcessingUpdate = false

  constructor(
    canvasEngine: FabricCanvasEngine,
    configManager: EnhancedConfigurationStateManager,
    options: CanvasConfigSyncOptions = {}
  ) {
    super()

    this.canvasEngine = canvasEngine
    this.configManager = configManager
    this.options = {
      realTimeSync: options.realTimeSync ?? true,
      syncDelay: options.syncDelay ?? 300,
      enableValidation: options.enableValidation ?? true,
      enableBatchUpdate: options.enableBatchUpdate ?? true,
      batchInterval: options.batchInterval ?? 100,
      enableUndoRedo: options.enableUndoRedo ?? true,
      maxUndoSteps: options.maxUndoSteps ?? 50
    }

    this.initializeEventListeners()
    this.startBatchProcessor()
  }

  /**
   * 初始化事件监听器
   * 建立Canvas引擎与Config Engine之间的事件传递机制
   */
  private initializeEventListeners(): void {
    // Canvas引擎事件监听
    this.canvasEngine.on('node:added', this.handleCanvasNodeAdded.bind(this))
    this.canvasEngine.on('node:removed', this.handleCanvasNodeRemoved.bind(this))
    this.canvasEngine.on('node:updated', this.handleCanvasNodeUpdated.bind(this))
    this.canvasEngine.on('node:moved', this.handleCanvasNodeMoved.bind(this))
    this.canvasEngine.on('node:resized', this.handleCanvasNodeResized.bind(this))
    this.canvasEngine.on('node:rotated', this.handleCanvasNodeRotated.bind(this))
    this.canvasEngine.on('canvas:updated', this.handleCanvasUpdated.bind(this))

    // Config Engine事件监听
    this.configManager.on('configuration:updated', this.handleConfigurationUpdated.bind(this))
    this.configManager.on('configuration:added', this.handleConfigurationAdded.bind(this))
    this.configManager.on('configuration:removed', this.handleConfigurationRemoved.bind(this))
    this.configManager.on('validation:failed', this.handleValidationFailed.bind(this))
  }

  /**
   * 启动批量处理器
   * 优化频繁更新操作的性能
   */
  private startBatchProcessor(): void {
    if (!this.options.enableBatchUpdate) return

    this.batchTimer = setInterval(() => {
      this.processBatchOperations()
    }, this.options.batchInterval)
  }

  /**
   * 处理Canvas节点添加事件
   */
  private async handleCanvasNodeAdded(data: { node: CanvasNode }): Promise<void> {
    if (this.isProcessingUpdate) return

    const { node } = data
    const event: CanvasStateSyncEvent = {
      type: 'node:added',
      nodeId: node.id,
      canvasId: node.canvasId,
      data: node,
      timestamp: Date.now()
    }

    try {
      // 将Canvas节点配置同步到Config Engine
      await this.configManager.setConfiguration(node.id, node.configuration, {
        source: 'canvas-integration',
        skipValidation: !this.options.enableValidation
      })

      // 添加到撤销堆栈
      if (this.options.enableUndoRedo) {
        this.addToUndoStack(event)
      }

      this.emit('sync:node:added', event)
      console.log(`[Canvas集成] 节点已添加并同步到配置系统: ${node.id}`)
    } catch (error) {
      console.error('[Canvas集成] 节点添加同步失败:', error)
      this.emit('sync:error', { event, error })
    }
  }

  /**
   * 处理Canvas节点移除事件
   */
  private async handleCanvasNodeRemoved(data: { nodeId: string, canvasId: string }): Promise<void> {
    if (this.isProcessingUpdate) return

    const { nodeId, canvasId } = data
    const event: CanvasStateSyncEvent = {
      type: 'node:removed',
      nodeId,
      canvasId,
      timestamp: Date.now()
    }

    try {
      // 从Config Engine移除节点配置
      await this.configManager.removeConfiguration(nodeId, {
        source: 'canvas-integration'
      })

      // 添加到撤销堆栈
      if (this.options.enableUndoRedo) {
        this.addToUndoStack(event)
      }

      this.emit('sync:node:removed', event)
      console.log(`[Canvas集成] 节点已从配置系统移除: ${nodeId}`)
    } catch (error) {
      console.error('[Canvas集成] 节点移除同步失败:', error)
      this.emit('sync:error', { event, error })
    }
  }

  /**
   * 处理Canvas节点更新事件
   */
  private handleCanvasNodeUpdated(data: { nodeId: string, changes: any }): void {
    if (this.isProcessingUpdate) return

    const update: BatchUpdateOperation = {
      type: 'update',
      nodeId: data.nodeId,
      data: {
        nodeId: data.nodeId,
        ...data.changes
      },
      timestamp: Date.now()
    }

    if (this.options.enableBatchUpdate) {
      this.addToBatch(update)
    } else {
      this.processNodeUpdate(update)
    }
  }

  /**
   * 处理Canvas节点移动事件
   */
  private handleCanvasNodeMoved(data: { nodeId: string, position: CanvasPosition }): void {
    this.handleCanvasNodeUpdated({
      nodeId: data.nodeId,
      changes: { position: data.position }
    })
  }

  /**
   * 处理Canvas节点缩放事件
   */
  private handleCanvasNodeResized(data: { nodeId: string, size: CanvasSize }): void {
    this.handleCanvasNodeUpdated({
      nodeId: data.nodeId,
      changes: { size: data.size }
    })
  }

  /**
   * 处理Canvas节点旋转事件
   */
  private handleCanvasNodeRotated(data: { nodeId: string, rotation: number }): void {
    this.handleCanvasNodeUpdated({
      nodeId: data.nodeId,
      changes: { rotation: data.rotation }
    })
  }

  /**
   * 处理Canvas更新事件
   */
  private async handleCanvasUpdated(data: { canvasId: string, changes: any }): Promise<void> {
    if (this.isProcessingUpdate) return

    const event: CanvasStateSyncEvent = {
      type: 'canvas:updated',
      canvasId: data.canvasId,
      data: data.changes,
      timestamp: Date.now()
    }

    try {
      // 更新Canvas配置到Config Engine
      await this.configManager.updateCanvasConfiguration(data.canvasId, data.changes, {
        source: 'canvas-integration'
      })

      this.emit('sync:canvas:updated', event)
      console.log(`[Canvas集成] Canvas配置已更新: ${data.canvasId}`)
    } catch (error) {
      console.error('[Canvas集成] Canvas更新同步失败:', error)
      this.emit('sync:error', { event, error })
    }
  }

  /**
   * 处理配置更新事件（从Config Engine到Canvas）
   */
  private async handleConfigurationUpdated(data: {
    componentId: string,
    configuration: WidgetConfiguration,
    changes: any
  }): Promise<void> {
    if (this.isProcessingUpdate) return

    const { componentId, configuration, changes } = data

    try {
      this.isProcessingUpdate = true

      // 检查该组件是否存在于Canvas中
      const node = this.canvasEngine.getNode(componentId)
      if (node) {
        // 将配置变更同步到Canvas节点
        await this.canvasEngine.updateNodeConfiguration(componentId, configuration)

        // 如果有视觉属性变更，更新Canvas渲染
        if (this.hasVisualChanges(changes)) {
          await this.canvasEngine.updateNodeVisualProperties(componentId, changes)
        }

        console.log(`[Canvas集成] 配置变更已同步到Canvas节点: ${componentId}`)
      }
    } catch (error) {
      console.error('[Canvas集成] 配置到Canvas同步失败:', error)
      this.emit('sync:error', { componentId, error })
    } finally {
      this.isProcessingUpdate = false
    }
  }

  /**
   * 处理配置添加事件
   */
  private async handleConfigurationAdded(data: {
    componentId: string,
    configuration: WidgetConfiguration
  }): Promise<void> {
    if (this.isProcessingUpdate) return

    const { componentId, configuration } = data

    try {
      this.isProcessingUpdate = true

      // 如果Canvas中不存在该节点，创建新节点
      const existingNode = this.canvasEngine.getNode(componentId)
      if (!existingNode) {
        const nodeConfig: EditorNodeConfiguration = {
          id: componentId,
          type: configuration.type || 'unknown',
          canvasId: this.canvasEngine.getCanvasId(),
          position: { x: 100, y: 100 },
          size: { width: 200, height: 150 },
          configuration
        }

        await this.canvasEngine.createNode(nodeConfig)
        console.log(`[Canvas集成] 基于配置创建新Canvas节点: ${componentId}`)
      }
    } catch (error) {
      console.error('[Canvas集成] 配置添加到Canvas同步失败:', error)
      this.emit('sync:error', { componentId, error })
    } finally {
      this.isProcessingUpdate = false
    }
  }

  /**
   * 处理配置移除事件
   */
  private async handleConfigurationRemoved(data: { componentId: string }): Promise<void> {
    if (this.isProcessingUpdate) return

    const { componentId } = data

    try {
      this.isProcessingUpdate = true

      // 从Canvas中移除对应节点
      const node = this.canvasEngine.getNode(componentId)
      if (node) {
        await this.canvasEngine.removeNode(componentId)
        console.log(`[Canvas集成] 基于配置移除Canvas节点: ${componentId}`)
      }
    } catch (error) {
      console.error('[Canvas集成] 配置移除到Canvas同步失败:', error)
      this.emit('sync:error', { componentId, error })
    } finally {
      this.isProcessingUpdate = false
    }
  }

  /**
   * 处理配置验证失败事件
   */
  private handleValidationFailed(data: {
    componentId: string,
    result: ConfigurationValidationResult
  }): void {
    const { componentId, result } = data

    // 在Canvas中标记节点为错误状态
    this.canvasEngine.setNodeErrorState(componentId, {
      hasError: true,
      errorMessage: result.errors.map(e => e.message).join('; '),
      validationResult: result
    })

    console.warn(`[Canvas集成] 节点配置验证失败: ${componentId}`, result.errors)
    this.emit('validation:failed', { componentId, result })
  }

  /**
   * 添加操作到批量处理队列
   */
  private addToBatch(operation: BatchUpdateOperation): void {
    // 检查是否有相同节点的待处理操作，如果有则合并
    const existingIndex = this.batchOperations.findIndex(op =>
      op.nodeId === operation.nodeId && op.type === operation.type
    )

    if (existingIndex >= 0) {
      // 合并操作数据
      this.batchOperations[existingIndex] = {
        ...this.batchOperations[existingIndex],
        data: { ...this.batchOperations[existingIndex].data, ...operation.data },
        timestamp: operation.timestamp
      }
    } else {
      this.batchOperations.push(operation)
    }
  }

  /**
   * 处理批量操作
   */
  private async processBatchOperations(): Promise<void> {
    if (this.batchOperations.length === 0) return

    const operations = [...this.batchOperations]
    this.batchOperations = []

    // 按照时间戳排序
    operations.sort((a, b) => a.timestamp - b.timestamp)

    for (const operation of operations) {
      try {
        await this.processNodeUpdate(operation)
      } catch (error) {
        console.error('[Canvas集成] 批量操作处理失败:', error)
        this.emit('batch:error', { operation, error })
      }
    }
  }

  /**
   * 处理单个节点更新操作
   */
  private async processNodeUpdate(operation: BatchUpdateOperation): Promise<void> {
    const { nodeId, data } = operation

    if (!data) return

    try {
      // 获取当前节点配置
      const currentConfig = await this.configManager.getConfiguration(nodeId)
      if (!currentConfig) return

      // 合并配置变更
      const updatedConfig = this.mergeNodeStateToConfig(currentConfig, data)

      // 验证配置（如果启用）
      if (this.options.enableValidation) {
        const validationResult = await this.configManager.validateConfiguration(updatedConfig)
        if (!validationResult.isValid) {
          console.warn(`[Canvas集成] 节点配置验证失败: ${nodeId}`, validationResult.errors)
          this.emit('validation:failed', { componentId: nodeId, result: validationResult })
          return
        }
      }

      // 更新配置
      await this.configManager.setConfiguration(nodeId, updatedConfig, {
        source: 'canvas-integration',
        skipValidation: !this.options.enableValidation
      })

      // 创建同步事件
      const event: CanvasStateSyncEvent = {
        type: 'node:updated',
        nodeId,
        canvasId: this.canvasEngine.getCanvasId(),
        data: data,
        timestamp: operation.timestamp
      }

      // 添加到撤销堆栈
      if (this.options.enableUndoRedo) {
        this.addToUndoStack(event)
      }

      this.emit('sync:node:updated', event)
    } catch (error) {
      console.error(`[Canvas集成] 节点更新同步失败: ${nodeId}`, error)
      this.emit('sync:error', { nodeId, error })
    }
  }

  /**
   * 将Canvas节点状态合并到配置对象
   */
  private mergeNodeStateToConfig(
    currentConfig: WidgetConfiguration,
    stateUpdate: CanvasNodeStateUpdate
  ): WidgetConfiguration {
    const merged = { ...currentConfig }

    // 合并位置信息
    if (stateUpdate.position) {
      merged.layout = {
        ...merged.layout,
        position: stateUpdate.position
      }
    }

    // 合并尺寸信息
    if (stateUpdate.size) {
      merged.layout = {
        ...merged.layout,
        size: stateUpdate.size
      }
    }

    // 合并其他视觉属性
    if (stateUpdate.rotation !== undefined) {
      merged.layout = {
        ...merged.layout,
        rotation: stateUpdate.rotation
      }
    }

    if (stateUpdate.opacity !== undefined) {
      merged.style = {
        ...merged.style,
        opacity: stateUpdate.opacity
      }
    }

    if (stateUpdate.visible !== undefined) {
      merged.layout = {
        ...merged.layout,
        visible: stateUpdate.visible
      }
    }

    if (stateUpdate.locked !== undefined) {
      merged.layout = {
        ...merged.layout,
        locked: stateUpdate.locked
      }
    }

    if (stateUpdate.zIndex !== undefined) {
      merged.layout = {
        ...merged.layout,
        zIndex: stateUpdate.zIndex
      }
    }

    // 合并配置变更
    if (stateUpdate.configuration) {
      Object.assign(merged, stateUpdate.configuration)
    }

    return merged
  }

  /**
   * 检查变更是否包含视觉属性
   */
  private hasVisualChanges(changes: any): boolean {
    const visualProperties = ['position', 'size', 'rotation', 'opacity', 'visible', 'locked', 'zIndex']
    return visualProperties.some(prop => changes.hasOwnProperty(prop))
  }

  /**
   * 添加事件到撤销堆栈
   */
  private addToUndoStack(event: CanvasStateSyncEvent): void {
    this.undoStack.push(event)

    // 限制撤销堆栈大小
    if (this.undoStack.length > this.options.maxUndoSteps) {
      this.undoStack.shift()
    }

    // 清空重做堆栈
    this.redoStack = []
  }

  /**
   * 执行撤销操作
   */
  public async undo(): Promise<boolean> {
    if (!this.options.enableUndoRedo || this.undoStack.length === 0) {
      return false
    }

    const event = this.undoStack.pop()!
    this.redoStack.push(event)

    try {
      await this.revertEvent(event)
      this.emit('undo:completed', event)
      return true
    } catch (error) {
      console.error('[Canvas集成] 撤销操作失败:', error)
      this.emit('undo:error', { event, error })
      return false
    }
  }

  /**
   * 执行重做操作
   */
  public async redo(): Promise<boolean> {
    if (!this.options.enableUndoRedo || this.redoStack.length === 0) {
      return false
    }

    const event = this.redoStack.pop()!
    this.undoStack.push(event)

    try {
      await this.applyEvent(event)
      this.emit('redo:completed', event)
      return true
    } catch (error) {
      console.error('[Canvas集成] 重做操作失败:', error)
      this.emit('redo:error', { event, error })
      return false
    }
  }

  /**
   * 恢复事件（撤销操作的实现）
   */
  private async revertEvent(event: CanvasStateSyncEvent): Promise<void> {
    this.isProcessingUpdate = true

    try {
      switch (event.type) {
        case 'node:added':
          // 撤销添加 = 移除节点
          if (event.nodeId) {
            await this.canvasEngine.removeNode(event.nodeId)
            await this.configManager.removeConfiguration(event.nodeId)
          }
          break

        case 'node:removed':
          // 撤销移除 = 重新添加节点
          if (event.nodeId && event.data) {
            await this.canvasEngine.createNode(event.data)
            await this.configManager.setConfiguration(event.nodeId, event.data.configuration)
          }
          break

        case 'node:updated':
          // 撤销更新 = 恢复之前的状态
          if (event.nodeId && event.data?.previousState) {
            await this.canvasEngine.updateNodeConfiguration(event.nodeId, event.data.previousState)
            await this.configManager.setConfiguration(event.nodeId, event.data.previousState)
          }
          break
      }
    } finally {
      this.isProcessingUpdate = false
    }
  }

  /**
   * 应用事件（重做操作的实现）
   */
  private async applyEvent(event: CanvasStateSyncEvent): Promise<void> {
    this.isProcessingUpdate = true

    try {
      switch (event.type) {
        case 'node:added':
          // 重做添加
          if (event.nodeId && event.data) {
            await this.canvasEngine.createNode(event.data)
            await this.configManager.setConfiguration(event.nodeId, event.data.configuration)
          }
          break

        case 'node:removed':
          // 重做移除
          if (event.nodeId) {
            await this.canvasEngine.removeNode(event.nodeId)
            await this.configManager.removeConfiguration(event.nodeId)
          }
          break

        case 'node:updated':
          // 重做更新
          if (event.nodeId && event.data?.newState) {
            await this.canvasEngine.updateNodeConfiguration(event.nodeId, event.data.newState)
            await this.configManager.setConfiguration(event.nodeId, event.data.newState)
          }
          break
      }
    } finally {
      this.isProcessingUpdate = false
    }
  }

  /**
   * 强制同步Canvas到Config Engine
   * 用于修复不一致状态
   */
  public async forceSyncCanvasToConfig(): Promise<void> {
    try {
      const nodes = this.canvasEngine.getAllNodes()

      for (const node of nodes) {
        await this.configManager.setConfiguration(node.id, node.configuration, {
          source: 'canvas-integration-force-sync',
          skipValidation: false
        })
      }

      console.log(`[Canvas集成] 强制同步完成，同步了 ${nodes.length} 个节点`)
      this.emit('force:sync:completed', { nodeCount: nodes.length })
    } catch (error) {
      console.error('[Canvas集成] 强制同步失败:', error)
      this.emit('force:sync:error', error)
    }
  }

  /**
   * 强制同步Config Engine到Canvas
   */
  public async forceSyncConfigToCanvas(): Promise<void> {
    try {
      const configurations = await this.configManager.getAllConfigurations()
      let syncedCount = 0

      for (const [componentId, config] of configurations) {
        const existingNode = this.canvasEngine.getNode(componentId)

        if (existingNode) {
          // 更新现有节点
          await this.canvasEngine.updateNodeConfiguration(componentId, config)
        } else {
          // 创建新节点
          const nodeConfig: EditorNodeConfiguration = {
            id: componentId,
            type: config.type || 'unknown',
            canvasId: this.canvasEngine.getCanvasId(),
            position: config.layout?.position || { x: 100, y: 100 },
            size: config.layout?.size || { width: 200, height: 150 },
            configuration: config
          }
          await this.canvasEngine.createNode(nodeConfig)
        }

        syncedCount++
      }

      console.log(`[Canvas集成] 配置到Canvas强制同步完成，同步了 ${syncedCount} 个配置`)
      this.emit('force:config:sync:completed', { configCount: syncedCount })
    } catch (error) {
      console.error('[Canvas集成] 配置到Canvas强制同步失败:', error)
      this.emit('force:config:sync:error', error)
    }
  }

  /**
   * 获取同步状态统计
   */
  public getSyncStats(): {
    batchQueueSize: number
    undoStackSize: number
    redoStackSize: number
    isProcessingUpdate: boolean
    options: Required<CanvasConfigSyncOptions>
  } {
    return {
      batchQueueSize: this.batchOperations.length,
      undoStackSize: this.undoStack.length,
      redoStackSize: this.redoStack.length,
      isProcessingUpdate: this.isProcessingUpdate,
      options: this.options
    }
  }

  /**
   * 清理资源
   */
  public destroy(): void {
    // 清理定时器
    if (this.syncTimer) {
      clearTimeout(this.syncTimer)
      this.syncTimer = null
    }

    if (this.batchTimer) {
      clearInterval(this.batchTimer)
      this.batchTimer = null
    }

    // 清理事件监听器
    this.canvasEngine.removeAllListeners()
    this.configManager.removeAllListeners()
    this.removeAllListeners()

    // 清理数据
    this.batchOperations = []
    this.undoStack = []
    this.redoStack = []

    console.log('[Canvas集成] 资源清理完成')
  }
}

/**
 * Canvas配置集成工厂函数
 * 提供便捷的集成实例创建方式
 */
export function createCanvasConfigIntegration(
  canvasEngine: FabricCanvasEngine,
  configManager: EnhancedConfigurationStateManager,
  options?: CanvasConfigSyncOptions
): CanvasConfigIntegration {
  return new CanvasConfigIntegration(canvasEngine, configManager, options)
}

export default CanvasConfigIntegration