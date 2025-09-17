/**
 * Canvas事件系统和状态同步管理器
 *
 * 负责Canvas生态系统的整体事件协调和状态同步，提供：
 * 1. 统一的事件总线和消息传递机制
 * 2. 跨组件状态同步和数据流管理
 * 3. 事件订阅和发布模式的完整实现
 * 4. 状态持久化和恢复机制
 * 5. 实时协作和冲突解决机制
 *
 * @author Claude
 * @version 1.0.0
 */

import { EventEmitter } from 'events'
import type {
  EditorCanvasConfiguration,
  EditorNodeConfiguration,
  WidgetConfiguration,
  CanvasNode,
  CanvasPosition,
  CanvasSize
} from '../config-engine/types'

/**
 * Canvas事件类型定义
 */
export enum CanvasEventType {
  // 节点相关事件
  NODE_CREATED = 'node:created',
  NODE_DELETED = 'node:deleted',
  NODE_UPDATED = 'node:updated',
  NODE_SELECTED = 'node:selected',
  NODE_DESELECTED = 'node:deselected',
  NODE_MOVED = 'node:moved',
  NODE_RESIZED = 'node:resized',
  NODE_ROTATED = 'node:rotated',
  NODE_LOCKED = 'node:locked',
  NODE_UNLOCKED = 'node:unlocked',
  NODE_VISIBILITY_CHANGED = 'node:visibility:changed',
  NODE_Z_INDEX_CHANGED = 'node:z-index:changed',

  // Canvas相关事件
  CANVAS_CREATED = 'canvas:created',
  CANVAS_DELETED = 'canvas:deleted',
  CANVAS_UPDATED = 'canvas:updated',
  CANVAS_RESIZED = 'canvas:resized',
  CANVAS_ZOOM_CHANGED = 'canvas:zoom:changed',
  CANVAS_PAN_CHANGED = 'canvas:pan:changed',
  CANVAS_MODE_CHANGED = 'canvas:mode:changed',

  // 选择相关事件
  SELECTION_CHANGED = 'selection:changed',
  SELECTION_CLEARED = 'selection:cleared',
  MULTI_SELECTION_STARTED = 'multi:selection:started',
  MULTI_SELECTION_ENDED = 'multi:selection:ended',

  // 交互相关事件
  DRAG_STARTED = 'drag:started',
  DRAG_MOVED = 'drag:moved',
  DRAG_ENDED = 'drag:ended',
  RESIZE_STARTED = 'resize:started',
  RESIZE_MOVED = 'resize:moved',
  RESIZE_ENDED = 'resize:ended',
  ROTATE_STARTED = 'rotate:started',
  ROTATE_MOVED = 'rotate:moved',
  ROTATE_ENDED = 'rotate:ended',

  // 历史相关事件
  HISTORY_CHANGED = 'history:changed',
  UNDO_EXECUTED = 'undo:executed',
  REDO_EXECUTED = 'redo:executed',

  // 状态同步事件
  STATE_SYNC_STARTED = 'state:sync:started',
  STATE_SYNC_COMPLETED = 'state:sync:completed',
  STATE_SYNC_FAILED = 'state:sync:failed',
  STATE_CONFLICT_DETECTED = 'state:conflict:detected',
  STATE_CONFLICT_RESOLVED = 'state:conflict:resolved',

  // 协作相关事件
  COLLABORATION_USER_JOINED = 'collaboration:user:joined',
  COLLABORATION_USER_LEFT = 'collaboration:user:left',
  COLLABORATION_CURSOR_MOVED = 'collaboration:cursor:moved',
  COLLABORATION_LOCK_ACQUIRED = 'collaboration:lock:acquired',
  COLLABORATION_LOCK_RELEASED = 'collaboration:lock:released',

  // 错误和警告事件
  ERROR_OCCURRED = 'error:occurred',
  WARNING_ISSUED = 'warning:issued',
  VALIDATION_FAILED = 'validation:failed',

  // 性能相关事件
  PERFORMANCE_METRICS_UPDATED = 'performance:metrics:updated',
  RENDER_PERFORMANCE_WARNING = 'render:performance:warning'
}

/**
 * Canvas事件数据接口
 */
export interface CanvasEventData {
  eventId?: string
  timestamp: number
  source: string
  canvasId: string
  userId?: string
  sessionId?: string
  metadata?: Record<string, any>
}

/**
 * 节点事件数据
 */
export interface NodeEventData extends CanvasEventData {
  nodeId: string
  nodeType: string
  previousState?: any
  currentState?: any
  changes?: Record<string, any>
}

/**
 * Canvas状态快照
 */
export interface CanvasStateSnapshot {
  id: string
  canvasId: string
  timestamp: number
  version: number
  canvasConfiguration: EditorCanvasConfiguration
  nodes: Map<string, CanvasNode>
  selectedNodeIds: Set<string>
  viewState: {
    zoom: number
    pan: CanvasPosition
    mode: string
  }
  metadata: Record<string, any>
}

/**
 * 状态同步选项
 */
export interface StateSyncOptions {
  // 启用实时同步
  enableRealTimeSync?: boolean
  // 同步间隔（毫秒）
  syncInterval?: number
  // 启用冲突检测
  enableConflictDetection?: boolean
  // 启用状态持久化
  enablePersistence?: boolean
  // 持久化存储键前缀
  persistencePrefix?: string
  // 启用协作功能
  enableCollaboration?: boolean
  // 最大状态历史保存数量
  maxStateHistory?: number
  // 启用性能监控
  enablePerformanceMonitoring?: boolean
}

/**
 * 协作用户信息
 */
export interface CollaborationUser {
  id: string
  name: string
  avatar?: string
  color: string
  cursor?: CanvasPosition
  selection?: string[]
  isActive: boolean
  lastActivity: number
}

/**
 * 状态冲突信息
 */
export interface StateConflict {
  id: string
  timestamp: number
  conflictType: 'node:update' | 'node:delete' | 'canvas:update'
  affectedNodeId?: string
  localState: any
  remoteState: any
  resolution?: 'local' | 'remote' | 'merge' | 'manual'
}

/**
 * 性能指标
 */
export interface PerformanceMetrics {
  renderTime: number
  eventProcessingTime: number
  syncTime: number
  nodeCount: number
  eventQueueSize: number
  memoryUsage?: number
  cpuUsage?: number
}

/**
 * Canvas事件系统和状态同步管理器
 */
export class CanvasEventStateManager extends EventEmitter {
  private canvasId: string
  private currentState: CanvasStateSnapshot | null = null
  private stateHistory: CanvasStateSnapshot[] = []
  private eventQueue: Array<{ type: CanvasEventType, data: CanvasEventData }> = []
  private isProcessingEvents = false
  private syncTimer: NodeJS.Timeout | null = null
  private performanceTimer: NodeJS.Timeout | null = null

  // 协作相关
  private collaborationUsers: Map<string, CollaborationUser> = new Map()
  private activeLocks: Map<string, { userId: string, timestamp: number }> = new Map()
  private pendingConflicts: Map<string, StateConflict> = new Map()

  // 配置选项
  private options: Required<StateSyncOptions>

  // 性能监控
  private performanceMetrics: PerformanceMetrics = {
    renderTime: 0,
    eventProcessingTime: 0,
    syncTime: 0,
    nodeCount: 0,
    eventQueueSize: 0
  }

  constructor(canvasId: string, options: StateSyncOptions = {}) {
    super()

    this.canvasId = canvasId
    this.options = {
      enableRealTimeSync: options.enableRealTimeSync ?? true,
      syncInterval: options.syncInterval ?? 1000,
      enableConflictDetection: options.enableConflictDetection ?? true,
      enablePersistence: options.enablePersistence ?? true,
      persistencePrefix: options.persistencePrefix ?? 'canvas-state',
      enableCollaboration: options.enableCollaboration ?? false,
      maxStateHistory: options.maxStateHistory ?? 50,
      enablePerformanceMonitoring: options.enablePerformanceMonitoring ?? true
    }

    this.initializeEventProcessing()
    this.initializeStateSync()
    this.initializePerformanceMonitoring()
  }

  /**
   * 初始化事件处理机制
   */
  private initializeEventProcessing(): void {
    // 设置事件处理循环
    setInterval(() => {
      this.processEventQueue()
    }, 16) // 60fps

    console.log(`[Canvas事件管理] 事件处理机制已初始化: ${this.canvasId}`)
  }

  /**
   * 初始化状态同步
   */
  private initializeStateSync(): void {
    if (this.options.enableRealTimeSync) {
      this.syncTimer = setInterval(() => {
        this.synchronizeState()
      }, this.options.syncInterval)
    }

    // 尝试恢复持久化状态
    if (this.options.enablePersistence) {
      this.restorePersistedState()
    }

    console.log(`[Canvas状态同步] 状态同步已初始化: ${this.canvasId}`)
  }

  /**
   * 初始化性能监控
   */
  private initializePerformanceMonitoring(): void {
    if (!this.options.enablePerformanceMonitoring) return

    this.performanceTimer = setInterval(() => {
      this.updatePerformanceMetrics()
      this.emitEvent(CanvasEventType.PERFORMANCE_METRICS_UPDATED, {
        canvasId: this.canvasId,
        timestamp: Date.now(),
        source: 'performance-monitor',
        metadata: { metrics: this.performanceMetrics }
      })
    }, 5000) // 每5秒更新一次性能指标

    console.log(`[Canvas性能监控] 性能监控已启动: ${this.canvasId}`)
  }

  /**
   * 发布事件到事件总线
   */
  public emitEvent(type: CanvasEventType, data: Partial<CanvasEventData>): void {
    const eventData: CanvasEventData = {
      eventId: this.generateEventId(),
      timestamp: Date.now(),
      canvasId: this.canvasId,
      source: data.source || 'unknown',
      ...data
    }

    // 添加到事件队列
    this.eventQueue.push({ type, data: eventData })

    // 立即发布到本地监听器
    this.emit(type, eventData)

    // 如果启用协作，广播事件
    if (this.options.enableCollaboration) {
      this.broadcastEvent(type, eventData)
    }
  }

  /**
   * 处理事件队列
   */
  private processEventQueue(): void {
    if (this.isProcessingEvents || this.eventQueue.length === 0) return

    this.isProcessingEvents = true
    const startTime = performance.now()

    try {
      const eventsToProcess = [...this.eventQueue]
      this.eventQueue = []

      for (const { type, data } of eventsToProcess) {
        this.processEvent(type, data)
      }

      this.performanceMetrics.eventProcessingTime = performance.now() - startTime
    } catch (error) {
      console.error('[Canvas事件管理] 事件处理失败:', error)
      this.emitEvent(CanvasEventType.ERROR_OCCURRED, {
        canvasId: this.canvasId,
        source: 'event-processor',
        metadata: { error: error.message }
      })
    } finally {
      this.isProcessingEvents = false
    }
  }

  /**
   * 处理单个事件
   */
  private processEvent(type: CanvasEventType, data: CanvasEventData): void {
    switch (type) {
      case CanvasEventType.NODE_CREATED:
      case CanvasEventType.NODE_UPDATED:
      case CanvasEventType.NODE_DELETED:
        this.handleNodeEvent(type, data as NodeEventData)
        break

      case CanvasEventType.CANVAS_UPDATED:
        this.handleCanvasEvent(type, data)
        break

      case CanvasEventType.SELECTION_CHANGED:
        this.handleSelectionEvent(type, data)
        break

      case CanvasEventType.COLLABORATION_USER_JOINED:
      case CanvasEventType.COLLABORATION_USER_LEFT:
        this.handleCollaborationEvent(type, data)
        break

      case CanvasEventType.STATE_CONFLICT_DETECTED:
        this.handleStateConflict(data)
        break

      default:
        // 处理其他事件类型
        this.handleGenericEvent(type, data)
        break
    }
  }

  /**
   * 处理节点相关事件
   */
  private handleNodeEvent(type: CanvasEventType, data: NodeEventData): void {
    // 更新当前状态
    if (this.currentState) {
      switch (type) {
        case CanvasEventType.NODE_CREATED:
          if (data.currentState) {
            this.currentState.nodes.set(data.nodeId, data.currentState)
          }
          break

        case CanvasEventType.NODE_UPDATED:
          if (data.currentState && this.currentState.nodes.has(data.nodeId)) {
            this.currentState.nodes.set(data.nodeId, data.currentState)
          }
          break

        case CanvasEventType.NODE_DELETED:
          this.currentState.nodes.delete(data.nodeId)
          this.currentState.selectedNodeIds.delete(data.nodeId)
          break
      }

      // 更新版本和时间戳
      this.currentState.version++
      this.currentState.timestamp = data.timestamp
    }

    // 检测冲突
    if (this.options.enableConflictDetection) {
      this.detectStateConflict(type, data)
    }
  }

  /**
   * 处理Canvas相关事件
   */
  private handleCanvasEvent(type: CanvasEventType, data: CanvasEventData): void {
    if (this.currentState && data.metadata) {
      // 更新Canvas配置
      Object.assign(this.currentState.canvasConfiguration, data.metadata.changes || {})
      this.currentState.version++
      this.currentState.timestamp = data.timestamp
    }
  }

  /**
   * 处理选择事件
   */
  private handleSelectionEvent(type: CanvasEventType, data: CanvasEventData): void {
    if (this.currentState && data.metadata) {
      const { selectedNodeIds } = data.metadata
      this.currentState.selectedNodeIds = new Set(selectedNodeIds || [])
      this.currentState.timestamp = data.timestamp
    }
  }

  /**
   * 处理协作事件
   */
  private handleCollaborationEvent(type: CanvasEventType, data: CanvasEventData): void {
    if (!this.options.enableCollaboration) return

    const { userId, metadata } = data

    switch (type) {
      case CanvasEventType.COLLABORATION_USER_JOINED:
        if (userId && metadata?.userInfo) {
          this.collaborationUsers.set(userId, {
            ...metadata.userInfo,
            isActive: true,
            lastActivity: data.timestamp
          })
        }
        break

      case CanvasEventType.COLLABORATION_USER_LEFT:
        if (userId) {
          this.collaborationUsers.delete(userId)
          // 释放该用户的所有锁
          for (const [lockKey, lock] of this.activeLocks) {
            if (lock.userId === userId) {
              this.activeLocks.delete(lockKey)
              this.emitEvent(CanvasEventType.COLLABORATION_LOCK_RELEASED, {
                canvasId: this.canvasId,
                source: 'collaboration-manager',
                userId,
                metadata: { lockKey }
              })
            }
          }
        }
        break
    }
  }

  /**
   * 处理状态冲突
   */
  private handleStateConflict(data: CanvasEventData): void {
    if (!data.metadata?.conflict) return

    const conflict: StateConflict = data.metadata.conflict
    this.pendingConflicts.set(conflict.id, conflict)

    console.warn(`[Canvas状态冲突] 检测到状态冲突: ${conflict.id}`, conflict)

    // 尝试自动解决冲突
    this.attemptConflictResolution(conflict)
  }

  /**
   * 处理通用事件
   */
  private handleGenericEvent(type: CanvasEventType, data: CanvasEventData): void {
    // 对于其他事件类型的通用处理
    console.log(`[Canvas事件] 处理事件: ${type}`, data)
  }

  /**
   * 创建状态快照
   */
  public createStateSnapshot(
    canvasConfig: EditorCanvasConfiguration,
    nodes: Map<string, CanvasNode>,
    selectedNodeIds: Set<string>,
    viewState: { zoom: number, pan: CanvasPosition, mode: string }
  ): CanvasStateSnapshot {
    const snapshot: CanvasStateSnapshot = {
      id: this.generateSnapshotId(),
      canvasId: this.canvasId,
      timestamp: Date.now(),
      version: (this.currentState?.version || 0) + 1,
      canvasConfiguration: { ...canvasConfig },
      nodes: new Map(nodes),
      selectedNodeIds: new Set(selectedNodeIds),
      viewState: { ...viewState },
      metadata: {}
    }

    return snapshot
  }

  /**
   * 应用状态快照
   */
  public applyStateSnapshot(snapshot: CanvasStateSnapshot): void {
    this.currentState = {
      ...snapshot,
      nodes: new Map(snapshot.nodes),
      selectedNodeIds: new Set(snapshot.selectedNodeIds)
    }

    // 添加到历史记录
    this.addToStateHistory(snapshot)

    // 发布状态同步事件
    this.emitEvent(CanvasEventType.STATE_SYNC_COMPLETED, {
      canvasId: this.canvasId,
      source: 'state-manager',
      metadata: { snapshot: snapshot.id, version: snapshot.version }
    })
  }

  /**
   * 添加到状态历史
   */
  private addToStateHistory(snapshot: CanvasStateSnapshot): void {
    this.stateHistory.push(snapshot)

    // 限制历史记录数量
    if (this.stateHistory.length > this.options.maxStateHistory) {
      this.stateHistory.shift()
    }
  }

  /**
   * 同步状态
   */
  private async synchronizeState(): Promise<void> {
    if (!this.currentState) return

    const startTime = performance.now()

    try {
      // 持久化状态
      if (this.options.enablePersistence) {
        await this.persistState(this.currentState)
      }

      // 如果启用协作，同步远程状态
      if (this.options.enableCollaboration) {
        await this.syncWithRemote(this.currentState)
      }

      this.performanceMetrics.syncTime = performance.now() - startTime

      this.emitEvent(CanvasEventType.STATE_SYNC_COMPLETED, {
        canvasId: this.canvasId,
        source: 'state-synchronizer',
        metadata: { version: this.currentState.version }
      })
    } catch (error) {
      console.error('[Canvas状态同步] 同步失败:', error)
      this.emitEvent(CanvasEventType.STATE_SYNC_FAILED, {
        canvasId: this.canvasId,
        source: 'state-synchronizer',
        metadata: { error: error.message }
      })
    }
  }

  /**
   * 持久化状态到本地存储
   */
  private async persistState(snapshot: CanvasStateSnapshot): Promise<void> {
    try {
      const key = `${this.options.persistencePrefix}:${this.canvasId}`
      const serializedState = this.serializeStateSnapshot(snapshot)
      localStorage.setItem(key, serializedState)
    } catch (error) {
      console.error('[Canvas状态持久化] 持久化失败:', error)
      throw error
    }
  }

  /**
   * 恢复持久化状态
   */
  private restorePersistedState(): void {
    try {
      const key = `${this.options.persistencePrefix}:${this.canvasId}`
      const serializedState = localStorage.getItem(key)

      if (serializedState) {
        const snapshot = this.deserializeStateSnapshot(serializedState)
        this.currentState = snapshot
        this.addToStateHistory(snapshot)

        console.log(`[Canvas状态恢复] 成功恢复状态: ${snapshot.id}`)
        this.emitEvent(CanvasEventType.STATE_SYNC_COMPLETED, {
          canvasId: this.canvasId,
          source: 'state-restorer',
          metadata: { restored: true, version: snapshot.version }
        })
      }
    } catch (error) {
      console.error('[Canvas状态恢复] 恢复失败:', error)
    }
  }

  /**
   * 序列化状态快照
   */
  private serializeStateSnapshot(snapshot: CanvasStateSnapshot): string {
    const serializable = {
      ...snapshot,
      nodes: Array.from(snapshot.nodes.entries()),
      selectedNodeIds: Array.from(snapshot.selectedNodeIds)
    }
    return JSON.stringify(serializable)
  }

  /**
   * 反序列化状态快照
   */
  private deserializeStateSnapshot(serialized: string): CanvasStateSnapshot {
    const data = JSON.parse(serialized)
    return {
      ...data,
      nodes: new Map(data.nodes),
      selectedNodeIds: new Set(data.selectedNodeIds)
    }
  }

  /**
   * 与远程同步状态（协作功能）
   */
  private async syncWithRemote(snapshot: CanvasStateSnapshot): Promise<void> {
    // 实际项目中这里会连接到WebSocket服务器或其他协作服务
    // 现在只是模拟实现
    console.log(`[Canvas远程同步] 同步状态到远程: ${snapshot.id}`)
  }

  /**
   * 广播事件到其他协作用户
   */
  private broadcastEvent(type: CanvasEventType, data: CanvasEventData): void {
    // 实际项目中这里会广播到其他协作用户
    console.log(`[Canvas事件广播] 广播事件: ${type}`, data)
  }

  /**
   * 检测状态冲突
   */
  private detectStateConflict(type: CanvasEventType, data: NodeEventData): void {
    // 简化的冲突检测逻辑
    // 实际项目中需要更复杂的冲突检测算法
    const hasConflict = false // 这里应该有实际的冲突检测逻辑

    if (hasConflict) {
      const conflict: StateConflict = {
        id: this.generateConflictId(),
        timestamp: Date.now(),
        conflictType: 'node:update',
        affectedNodeId: data.nodeId,
        localState: data.previousState,
        remoteState: data.currentState
      }

      this.emitEvent(CanvasEventType.STATE_CONFLICT_DETECTED, {
        canvasId: this.canvasId,
        source: 'conflict-detector',
        metadata: { conflict }
      })
    }
  }

  /**
   * 尝试自动解决冲突
   */
  private attemptConflictResolution(conflict: StateConflict): void {
    // 简化的自动冲突解决策略
    let resolution: StateConflict['resolution'] = 'local'

    // 基于时间戳的冲突解决策略（最后写入获胜）
    if (conflict.localState?.timestamp && conflict.remoteState?.timestamp) {
      resolution = conflict.remoteState.timestamp > conflict.localState.timestamp ? 'remote' : 'local'
    }

    // 应用解决方案
    conflict.resolution = resolution
    this.pendingConflicts.delete(conflict.id)

    this.emitEvent(CanvasEventType.STATE_CONFLICT_RESOLVED, {
      canvasId: this.canvasId,
      source: 'conflict-resolver',
      metadata: { conflict, resolution }
    })

    console.log(`[Canvas冲突解决] 自动解决冲突: ${conflict.id}, 策略: ${resolution}`)
  }

  /**
   * 更新性能指标
   */
  private updatePerformanceMetrics(): void {
    this.performanceMetrics.eventQueueSize = this.eventQueue.length
    this.performanceMetrics.nodeCount = this.currentState?.nodes.size || 0

    // 检查性能警告
    if (this.performanceMetrics.eventQueueSize > 100) {
      this.emitEvent(CanvasEventType.RENDER_PERFORMANCE_WARNING, {
        canvasId: this.canvasId,
        source: 'performance-monitor',
        metadata: { reason: 'large-event-queue', size: this.performanceMetrics.eventQueueSize }
      })
    }
  }

  /**
   * 获取协作用户列表
   */
  public getCollaborationUsers(): CollaborationUser[] {
    return Array.from(this.collaborationUsers.values())
  }

  /**
   * 获取当前状态快照
   */
  public getCurrentState(): CanvasStateSnapshot | null {
    return this.currentState
  }

  /**
   * 获取状态历史
   */
  public getStateHistory(): CanvasStateSnapshot[] {
    return [...this.stateHistory]
  }

  /**
   * 获取性能指标
   */
  public getPerformanceMetrics(): PerformanceMetrics {
    return { ...this.performanceMetrics }
  }

  /**
   * 获取待处理冲突
   */
  public getPendingConflicts(): StateConflict[] {
    return Array.from(this.pendingConflicts.values())
  }

  /**
   * 手动解决冲突
   */
  public resolveConflict(conflictId: string, resolution: StateConflict['resolution']): void {
    const conflict = this.pendingConflicts.get(conflictId)
    if (!conflict) return

    conflict.resolution = resolution
    this.pendingConflicts.delete(conflictId)

    this.emitEvent(CanvasEventType.STATE_CONFLICT_RESOLVED, {
      canvasId: this.canvasId,
      source: 'manual-resolver',
      metadata: { conflict, resolution }
    })

    console.log(`[Canvas冲突解决] 手动解决冲突: ${conflictId}, 策略: ${resolution}`)
  }

  /**
   * 清理资源
   */
  public destroy(): void {
    // 清理定时器
    if (this.syncTimer) {
      clearInterval(this.syncTimer)
      this.syncTimer = null
    }

    if (this.performanceTimer) {
      clearInterval(this.performanceTimer)
      this.performanceTimer = null
    }

    // 清理数据
    this.eventQueue = []
    this.stateHistory = []
    this.collaborationUsers.clear()
    this.activeLocks.clear()
    this.pendingConflicts.clear()

    // 移除所有监听器
    this.removeAllListeners()

    console.log(`[Canvas事件状态管理] 资源清理完成: ${this.canvasId}`)
  }

  /**
   * 生成事件ID
   */
  private generateEventId(): string {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 生成快照ID
   */
  private generateSnapshotId(): string {
    return `snapshot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 生成冲突ID
   */
  private generateConflictId(): string {
    return `conflict_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}

/**
 * Canvas事件状态管理器工厂函数
 */
export function createCanvasEventStateManager(
  canvasId: string,
  options?: StateSyncOptions
): CanvasEventStateManager {
  return new CanvasEventStateManager(canvasId, options)
}

export default CanvasEventStateManager