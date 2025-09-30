/**
 * Canvas引擎统一入口点
 *
 * 整合Fabric.js Canvas引擎、Config Engine集成、事件状态管理等功能，
 * 提供完整的Canvas编辑器解决方案。
 *
 * 主要功能：
 * 1. Canvas引擎核心功能（基于Fabric.js）
 * 2. 节点渲染和交互系统
 * 3. 与Config Engine的双向数据同步
 * 4. 统一的事件系统和状态管理
 * 5. 协作和冲突解决机制
 * 6. 性能监控和优化
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

// Canvas引擎核心组件
import { FabricCanvasEngine } from './fabric-canvas-engine'
import type { FabricCanvasConfig, InteractionMode } from './fabric-canvas-engine'

// 节点渲染系统
import { NodeRendererManager, BaseNodeRenderer } from './canvas-node-renderer'
import type { NodeRenderer, NodeRendererConfig } from './canvas-node-renderer'

// 交互控制器
import CanvasInteractionController from './canvas-interaction-controller'
import type { InteractionConfig, AlignmentType } from './canvas-interaction-controller'

// Config Engine集成
import { CanvasConfigIntegration } from './canvas-config-integration'
import type { CanvasConfigSyncOptions } from './canvas-config-integration'

// 事件状态管理
import { CanvasEventStateManager, CanvasEventType } from './canvas-event-state-manager'
import type {
  StateSyncOptions,
  CanvasStateSnapshot,
  PerformanceMetrics,
  CollaborationUser,
  StateConflict
} from './canvas-event-state-manager'

// 从Config Engine导入必要组件
import type { EnhancedConfigurationStateManager } from '../config-engine/enhanced-config-state-manager'

/**
 * Canvas引擎初始化配置
 */
export interface CanvasEngineConfig {
  // Canvas基础配置
  canvasConfig?: Partial<FabricCanvasConfig>

  // 节点渲染配置
  rendererConfig?: NodeRendererConfig

  // 交互配置
  interactionConfig?: InteractionConfig

  // Config Engine集成配置
  configSyncOptions?: CanvasConfigSyncOptions

  // 状态同步配置
  stateSyncOptions?: StateSyncOptions

  // 是否启用自动集成
  enableAutoIntegration?: boolean

  // 性能优化配置
  performanceOptions?: {
    enableVirtualization?: boolean
    maxRenderObjects?: number
    renderThrottleMs?: number
  }
}

/**
 * Canvas引擎状态信息
 */
export interface CanvasEngineState {
  isInitialized: boolean
  canvasId: string
  nodeCount: number
  selectedNodeIds: string[]
  currentMode: InteractionMode
  zoom: number
  pan: CanvasPosition
  performanceMetrics: PerformanceMetrics
  collaborationUsers: CollaborationUser[]
  pendingConflicts: StateConflict[]
}

/**
 * Canvas引擎操作结果
 */
export interface CanvasEngineResult<T = any> {
  success: boolean
  data?: T
  error?: string
  warnings?: string[]
}

/**
 * 完整的Canvas引擎系统
 *
 * 这是Canvas编辑器的主入口点，整合了所有子系统并提供统一的API接口。
 * 基于你实现的Config Engine基础，实现Canvas编辑器与配置系统的深度集成。
 */
export class CanvasEngine extends EventEmitter {
  private canvasEngine: FabricCanvasEngine | null = null
  private rendererManager: NodeRendererManager | null = null
  private interactionController: CanvasInteractionController | null = null
  private configIntegration: CanvasConfigIntegration | null = null
  private eventStateManager: CanvasEventStateManager | null = null
  private configManager: EnhancedConfigurationStateManager | null = null

  private canvasId: string
  private containerId: string
  private config: Required<CanvasEngineConfig>
  private isInitialized = false

  constructor(canvasId: string, containerId: string, config: CanvasEngineConfig = {}) {
    super()

    this.canvasId = canvasId
    this.containerId = containerId
    this.config = {
      canvasConfig: config.canvasConfig || {},
      rendererConfig: config.rendererConfig || {},
      interactionConfig: config.interactionConfig || {},
      configSyncOptions: config.configSyncOptions || {},
      stateSyncOptions: config.stateSyncOptions || {},
      enableAutoIntegration: config.enableAutoIntegration ?? true,
      performanceOptions: {
        enableVirtualization: config.performanceOptions?.enableVirtualization ?? true,
        maxRenderObjects: config.performanceOptions?.maxRenderObjects ?? 1000,
        renderThrottleMs: config.performanceOptions?.renderThrottleMs ?? 16
      }
    }

  }

  /**
   * 初始化Canvas引擎
   *
   * 按顺序初始化所有子系统并建立它们之间的连接
   */
  public async initialize(configManager?: EnhancedConfigurationStateManager): Promise<CanvasEngineResult<boolean>> {
    try {
      if (this.isInitialized) {
        return { success: true, data: true, warnings: ['Canvas引擎已经初始化'] }
      }


      // 保存Config Manager引用
      if (configManager) {
        this.configManager = configManager
      }

      // 1. 初始化事件状态管理器
      this.eventStateManager = new CanvasEventStateManager(this.canvasId, this.config.stateSyncOptions)

      // 2. 初始化Fabric Canvas引擎
      this.canvasEngine = new FabricCanvasEngine(this.canvasId, this.config.canvasConfig)
      await this.canvasEngine.initialize(this.containerId)

      // 3. 初始化节点渲染管理器
      this.rendererManager = new NodeRendererManager(this.config.rendererConfig)

      // 4. 初始化交互控制器
      this.interactionController = new CanvasInteractionController(this.canvasEngine, this.config.interactionConfig)

      // 5. 如果提供了Config Manager，初始化集成
      if (this.configManager && this.config.enableAutoIntegration) {
        this.configIntegration = new CanvasConfigIntegration(
          this.canvasEngine,
          this.configManager,
          this.config.configSyncOptions
        )
      }

      // 6. 建立组件间的事件连接
      this.setupInterComponentEvents()

      this.isInitialized = true
      this.emit('initialized', { canvasId: this.canvasId })


      return { success: true, data: true }
    } catch (error) {
      console.error(`[Canvas引擎] ❌ 初始化失败: ${this.canvasId}`, error)
      return { success: false, error: error.message }
    }
  }

  /**
   * 建立组件间事件连接
   *
   * 确保所有子系统之间的事件能够正确传递和处理
   */
  private setupInterComponentEvents(): void {
    if (!this.canvasEngine || !this.eventStateManager) return

    // Canvas引擎事件 -> 事件状态管理器
    this.canvasEngine.on('node:added', (data) => {
      this.eventStateManager!.emitEvent(CanvasEventType.NODE_CREATED, {
        canvasId: this.canvasId,
        source: 'canvas-engine',
        metadata: data
      })
    })

    this.canvasEngine.on('node:removed', (data) => {
      this.eventStateManager!.emitEvent(CanvasEventType.NODE_DELETED, {
        canvasId: this.canvasId,
        source: 'canvas-engine',
        metadata: data
      })
    })

    this.canvasEngine.on('node:updated', (data) => {
      this.eventStateManager!.emitEvent(CanvasEventType.NODE_UPDATED, {
        canvasId: this.canvasId,
        source: 'canvas-engine',
        metadata: data
      })
    })

    this.canvasEngine.on('selection:changed', (data) => {
      this.eventStateManager!.emitEvent(CanvasEventType.SELECTION_CHANGED, {
        canvasId: this.canvasId,
        source: 'canvas-engine',
        metadata: data
      })
    })

    // 交互控制器事件 -> 事件状态管理器
    if (this.interactionController) {
      this.interactionController.on('zoom:changed', (data) => {
        this.eventStateManager!.emitEvent(CanvasEventType.CANVAS_ZOOM_CHANGED, {
          canvasId: this.canvasId,
          source: 'interaction-controller',
          metadata: data
        })
      })

      this.interactionController.on('pan:changed', (data) => {
        this.eventStateManager!.emitEvent(CanvasEventType.CANVAS_PAN_CHANGED, {
          canvasId: this.canvasId,
          source: 'interaction-controller',
          metadata: data
        })
      })
    }

    // Config集成事件传递
    if (this.configIntegration) {
      this.configIntegration.on('sync:node:added', (event) => {
        this.emit('node:sync:completed', event)
      })

      this.configIntegration.on('sync:error', (error) => {
        this.emit('sync:error', error)
      })
    }

    // 事件状态管理器事件 -> 外部
    this.eventStateManager.on(CanvasEventType.STATE_SYNC_COMPLETED, (data) => {
      this.emit('state:sync:completed', data)
    })

    this.eventStateManager.on(CanvasEventType.STATE_CONFLICT_DETECTED, (data) => {
      this.emit('state:conflict:detected', data)
    })

    this.eventStateManager.on(CanvasEventType.PERFORMANCE_METRICS_UPDATED, (data) => {
      this.emit('performance:metrics:updated', data)
    })
  }

  /**
   * 创建新节点
   */
  public async createNode(nodeConfig: EditorNodeConfiguration): Promise<CanvasEngineResult<CanvasNode>> {
    try {
      if (!this.canvasEngine) {
        return { success: false, error: 'Canvas引擎未初始化' }
      }

      // 使用渲染管理器创建节点
      let node: CanvasNode
      if (this.rendererManager) {
        node = await this.rendererManager.renderNode(nodeConfig)
        // 将渲染好的节点添加到Canvas
        await this.canvasEngine.addExistingNode(node)
      } else {
        // 直接使用Canvas引擎创建
        node = await this.canvasEngine.createNode(nodeConfig)
      }

      return { success: true, data: node }
    } catch (error) {
      console.error('[Canvas引擎] 创建节点失败:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * 更新节点配置
   */
  public async updateNodeConfiguration(nodeId: string, configuration: Partial<WidgetConfiguration>): Promise<CanvasEngineResult<boolean>> {
    try {
      if (!this.canvasEngine) {
        return { success: false, error: 'Canvas引擎未初始化' }
      }

      await this.canvasEngine.updateNodeConfiguration(nodeId, configuration)
      return { success: true, data: true }
    } catch (error) {
      console.error('[Canvas引擎] 更新节点配置失败:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * 移除节点
   */
  public async removeNode(nodeId: string): Promise<CanvasEngineResult<boolean>> {
    try {
      if (!this.canvasEngine) {
        return { success: false, error: 'Canvas引擎未初始化' }
      }

      await this.canvasEngine.removeNode(nodeId)
      return { success: true, data: true }
    } catch (error) {
      console.error('[Canvas引擎] 移除节点失败:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * 获取节点信息
   */
  public getNode(nodeId: string): CanvasEngineResult<CanvasNode | null> {
    try {
      if (!this.canvasEngine) {
        return { success: false, error: 'Canvas引擎未初始化' }
      }

      const node = this.canvasEngine.getNode(nodeId)
      return { success: true, data: node }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  /**
   * 获取所有节点
   */
  public getAllNodes(): CanvasEngineResult<CanvasNode[]> {
    try {
      if (!this.canvasEngine) {
        return { success: false, error: 'Canvas引擎未初始化' }
      }

      const nodes = this.canvasEngine.getAllNodes()
      return { success: true, data: nodes }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  /**
   * 选择节点
   */
  public selectNode(nodeId: string): CanvasEngineResult<boolean> {
    try {
      if (!this.canvasEngine) {
        return { success: false, error: 'Canvas引擎未初始化' }
      }

      this.canvasEngine.selectNode(nodeId)
      return { success: true, data: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  /**
   * 多选节点
   */
  public selectNodes(nodeIds: string[]): CanvasEngineResult<boolean> {
    try {
      if (!this.canvasEngine) {
        return { success: false, error: 'Canvas引擎未初始化' }
      }

      this.canvasEngine.selectNodes(nodeIds)
      return { success: true, data: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  /**
   * 清空选择
   */
  public clearSelection(): CanvasEngineResult<boolean> {
    try {
      if (!this.canvasEngine) {
        return { success: false, error: 'Canvas引擎未初始化' }
      }

      this.canvasEngine.clearSelection()
      return { success: true, data: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  /**
   * 设置缩放级别
   */
  public setZoom(zoom: number, center?: CanvasPosition): CanvasEngineResult<boolean> {
    try {
      if (!this.canvasEngine) {
        return { success: false, error: 'Canvas引擎未初始化' }
      }

      this.canvasEngine.setZoom(zoom, center ? { x: center.x, y: center.y } : undefined)
      return { success: true, data: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  /**
   * 平移Canvas
   */
  public panTo(position: CanvasPosition): CanvasEngineResult<boolean> {
    try {
      if (!this.canvasEngine) {
        return { success: false, error: 'Canvas引擎未初始化' }
      }

      this.canvasEngine.panTo(position)
      return { success: true, data: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  /**
   * 适应Canvas内容
   */
  public fitToContent(): CanvasEngineResult<boolean> {
    try {
      if (!this.interactionController) {
        return { success: false, error: '交互控制器未初始化' }
      }

      this.interactionController.fitToCanvas()
      return { success: true, data: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  /**
   * 对齐选中的节点
   */
  public alignSelectedNodes(type: AlignmentType): CanvasEngineResult<boolean> {
    try {
      if (!this.interactionController) {
        return { success: false, error: '交互控制器未初始化' }
      }

      this.interactionController.alignObjects(type)
      return { success: true, data: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  /**
   * 撤销操作
   */
  public async undo(): Promise<CanvasEngineResult<boolean>> {
    try {
      if (!this.configIntegration) {
        return { success: false, error: 'Config集成未初始化' }
      }

      const result = await this.configIntegration.undo()
      return { success: true, data: result }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  /**
   * 重做操作
   */
  public async redo(): Promise<CanvasEngineResult<boolean>> {
    try {
      if (!this.configIntegration) {
        return { success: false, error: 'Config集成未初始化' }
      }

      const result = await this.configIntegration.redo()
      return { success: true, data: result }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  /**
   * 创建状态快照
   */
  public createSnapshot(): CanvasEngineResult<CanvasStateSnapshot | null> {
    try {
      if (!this.eventStateManager || !this.canvasEngine) {
        return { success: false, error: '必要组件未初始化' }
      }

      const canvasConfig = this.canvasEngine.getCanvasConfiguration()
      const nodes = new Map(this.canvasEngine.getAllNodes().map(node => [node.id, node]))
      const selectedNodeIds = new Set(this.canvasEngine.getSelectedNodeIds())
      const viewState = {
        zoom: this.canvasEngine.getZoom(),
        pan: this.canvasEngine.getPan(),
        mode: this.canvasEngine.getCurrentMode()
      }

      const snapshot = this.eventStateManager.createStateSnapshot(
        canvasConfig,
        nodes,
        selectedNodeIds,
        viewState
      )

      return { success: true, data: snapshot }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  /**
   * 应用状态快照
   */
  public applySnapshot(snapshot: CanvasStateSnapshot): CanvasEngineResult<boolean> {
    try {
      if (!this.eventStateManager) {
        return { success: false, error: '事件状态管理器未初始化' }
      }

      this.eventStateManager.applyStateSnapshot(snapshot)
      return { success: true, data: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  /**
   * 强制同步到Config Engine
   */
  public async forceSyncToConfig(): Promise<CanvasEngineResult<boolean>> {
    try {
      if (!this.configIntegration) {
        return { success: false, error: 'Config集成未初始化' }
      }

      await this.configIntegration.forceSyncCanvasToConfig()
      return { success: true, data: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  /**
   * 从Config Engine强制同步
   */
  public async forceSyncFromConfig(): Promise<CanvasEngineResult<boolean>> {
    try {
      if (!this.configIntegration) {
        return { success: false, error: 'Config集成未初始化' }
      }

      await this.configIntegration.forceSyncConfigToCanvas()
      return { success: true, data: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  /**
   * 获取引擎状态
   */
  public getState(): CanvasEngineState {
    return {
      isInitialized: this.isInitialized,
      canvasId: this.canvasId,
      nodeCount: this.canvasEngine?.getAllNodes().length || 0,
      selectedNodeIds: this.canvasEngine?.getSelectedNodeIds() || [],
      currentMode: this.canvasEngine?.getCurrentMode() || 'select',
      zoom: this.canvasEngine?.getZoom() || 1,
      pan: this.canvasEngine?.getPan() || { x: 0, y: 0 },
      performanceMetrics: this.eventStateManager?.getPerformanceMetrics() || {
        renderTime: 0,
        eventProcessingTime: 0,
        syncTime: 0,
        nodeCount: 0,
        eventQueueSize: 0
      },
      collaborationUsers: this.eventStateManager?.getCollaborationUsers() || [],
      pendingConflicts: this.eventStateManager?.getPendingConflicts() || []
    }
  }

  /**
   * 注册自定义节点渲染器
   */
  public registerNodeRenderer(type: string, renderer: NodeRenderer): CanvasEngineResult<boolean> {
    try {
      if (!this.rendererManager) {
        return { success: false, error: '节点渲染管理器未初始化' }
      }

      this.rendererManager.registerRenderer(type, renderer)
      return { success: true, data: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  /**
   * 设置交互模式
   */
  public setInteractionMode(mode: InteractionMode): CanvasEngineResult<boolean> {
    try {
      if (!this.canvasEngine) {
        return { success: false, error: 'Canvas引擎未初始化' }
      }

      this.canvasEngine.setMode(mode)
      return { success: true, data: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  /**
   * 获取Canvas DOM元素
   */
  public getCanvasElement(): HTMLCanvasElement | null {
    return this.canvasEngine?.getCanvas().getElement() || null
  }

  /**
   * 导出Canvas为图片
   */
  public exportAsImage(format: string = 'png', quality?: number): string | null {
    if (!this.canvasEngine) return null

    return this.canvasEngine.getCanvas().toDataURL({
      format: `image/${format}`,
      quality: quality || 1.0
    })
  }

  /**
   * 清理资源
   */
  public destroy(): void {

    // 清理各个子系统
    if (this.configIntegration) {
      this.configIntegration.destroy()
      this.configIntegration = null
    }

    if (this.eventStateManager) {
      this.eventStateManager.destroy()
      this.eventStateManager = null
    }

    if (this.interactionController) {
      this.interactionController.destroy()
      this.interactionController = null
    }

    if (this.rendererManager) {
      this.rendererManager.destroy()
      this.rendererManager = null
    }

    if (this.canvasEngine) {
      this.canvasEngine.destroy()
      this.canvasEngine = null
    }

    // 移除所有事件监听器
    this.removeAllListeners()

    this.isInitialized = false
  }
}

/**
 * Canvas引擎工厂函数
 * 提供便捷的引擎实例创建方式
 */
export function createCanvasEngine(
  canvasId: string,
  containerId: string,
  config?: CanvasEngineConfig
): CanvasEngine {
  return new CanvasEngine(canvasId, containerId, config)
}

// 导出所有相关类型和类
export type {
  CanvasEngineConfig,
  CanvasEngineState,
  CanvasEngineResult,
  FabricCanvasConfig,
  InteractionMode,
  NodeRendererConfig,
  InteractionConfig,
  CanvasConfigSyncOptions,
  StateSyncOptions,
  CanvasStateSnapshot,
  PerformanceMetrics,
  CollaborationUser,
  StateConflict,
  AlignmentType
}

export {
  FabricCanvasEngine,
  NodeRendererManager,
  CanvasInteractionController,
  CanvasConfigIntegration,
  CanvasEventStateManager,
  CanvasEventType
}

export default CanvasEngine