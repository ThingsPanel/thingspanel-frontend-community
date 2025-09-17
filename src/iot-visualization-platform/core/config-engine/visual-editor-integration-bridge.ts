/**
 * Visual Editor 集成桥接器
 *
 * 功能概述：
 * 1. 实现Config Engine与Visual Editor的完整集成接口
 * 2. 提供编辑器节点配置传递机制
 * 3. 支持组件配置的双向绑定和实时同步
 * 4. 集成配置验证、版本管理和事件通知
 * 5. 提供编辑器特定的配置操作和状态管理
 *
 * 架构设计：
 * - 遵循用户强调的"组件配置通过编辑器节点传递"原则
 * - 在iot-visualization-platform边界内独立实现
 * - 支持编辑器的配置层次结构和数据流
 * - 提供完整的配置生命周期管理
 *
 * @author Claude
 * @version 1.0.0
 * @date 2024-12-17
 */

import { EventEmitter } from 'events'
import type {
  WidgetConfiguration,
  ConfigurationValidationResult,
  ValidationContext,
  ConfigurationTemplate,
  ConfigurationSnapshot,
  ConfigurationDependency,
  ConfigurationExportOptions,
  ConfigurationImportOptions
} from './types'
import { EnhancedConfigurationStateManager } from './enhanced-config-state-manager'
import { EnhancedEventSystem } from './enhanced-event-system'
import { ConfigurationDependencyManager } from './dependency-manager'
import { EnhancedErrorHandler } from './error-handler'

/**
 * 编辑器节点配置接口
 * 定义编辑器中每个节点的配置结构
 */
export interface EditorNodeConfiguration {
  id: string                           // 节点唯一标识
  type: string                         // 节点类型
  parentId?: string                    // 父节点ID
  children?: string[]                  // 子节点ID列表
  position: {                          // 节点位置信息
    x: number
    y: number
    z?: number
  }
  size: {                              // 节点尺寸信息
    width: number
    height: number
  }
  configuration: WidgetConfiguration   // 组件配置
  metadata: {                          // 节点元数据
    title: string
    description?: string
    category?: string
    tags?: string[]
    visible: boolean
    locked: boolean
    collapsed?: boolean
    created: string
    modified: string
    author: string
    version: string
  }
  bindings: {                          // 数据绑定信息
    input?: Record<string, any>
    output?: Record<string, any>
    events?: Record<string, any>
  }
  styling: {                           // 样式配置
    theme?: string
    customStyles?: Record<string, any>
    animation?: Record<string, any>
  }
  validation: {                        // 验证状态
    isValid: boolean
    errors: string[]
    warnings: string[]
  }
}

/**
 * 编辑器画布配置接口
 * 定义整个编辑器画布的配置结构
 */
export interface EditorCanvasConfiguration {
  id: string                           // 画布唯一标识
  title: string                        // 画布标题
  description?: string                 // 画布描述
  version: string                      // 版本号
  created: string                      // 创建时间
  modified: string                     // 修改时间
  author: string                       // 作者
  canvas: {                           // 画布设置
    width: number
    height: number
    zoom: number
    grid: {
      enabled: boolean
      size: number
      snap: boolean
    }
    background: {
      type: 'color' | 'image' | 'gradient'
      value: string
    }
  }
  nodes: Record<string, EditorNodeConfiguration>  // 节点配置映射
  connections: Array<{                // 节点连接关系
    id: string
    source: string
    target: string
    type: string
    metadata?: Record<string, any>
  }>
  layout: {                           // 布局配置
    type: 'grid' | 'flow' | 'canvas'
    options: Record<string, any>
  }
  theme: {                            // 主题配置
    name: string
    variables: Record<string, any>
  }
  permissions: {                      // 权限配置
    canEdit: boolean
    canView: boolean
    canExport: boolean
    canShare: boolean
  }
  metadata: Record<string, any>       // 额外元数据
}

/**
 * 编辑器操作接口
 * 定义编辑器支持的所有操作
 */
export interface EditorOperation {
  type: 'create' | 'update' | 'delete' | 'move' | 'resize' | 'configure' | 'connect' | 'disconnect'
  target: string                       // 操作目标ID
  data?: any                          // 操作数据
  metadata?: {                        // 操作元数据
    timestamp: string
    author: string
    description?: string
  }
}

/**
 * 编辑器状态接口
 * 定义编辑器的当前状态
 */
export interface EditorState {
  mode: 'edit' | 'preview' | 'readonly'  // 编辑器模式
  selection: string[]                     // 当前选中的节点
  clipboard: any[]                        // 剪贴板内容
  history: {                             // 历史记录
    canUndo: boolean
    canRedo: boolean
    position: number
    stack: EditorOperation[]
  }
  validation: {                          // 验证状态
    isValid: boolean
    errorCount: number
    warningCount: number
  }
  dirty: boolean                         // 是否有未保存的更改
  loading: boolean                       // 是否正在加载
}

/**
 * 配置传播选项接口
 * 定义配置如何在编辑器节点之间传播
 */
export interface ConfigurationPropagationOptions {
  cascade: boolean                       // 是否级联传播
  skipValidation: boolean               // 是否跳过验证
  preserveLocal: boolean                // 是否保留本地配置
  mergeStrategy: 'replace' | 'merge' | 'deep-merge'  // 合并策略
  notifyDependents: boolean             // 是否通知依赖节点
  createSnapshot: boolean               // 是否创建快照
}

/**
 * Visual Editor 集成桥接器类
 *
 * 核心功能：
 * 1. 管理编辑器画布和节点配置
 * 2. 实现配置的层次传递和双向绑定
 * 3. 提供编辑器操作的配置管理支持
 * 4. 集成配置验证、依赖管理和错误处理
 */
export class VisualEditorIntegrationBridge extends EventEmitter {
  private configManager: EnhancedConfigurationStateManager
  private eventSystem: EnhancedEventSystem
  private dependencyManager: ConfigurationDependencyManager
  private errorHandler: EnhancedErrorHandler

  private canvasConfigurations: Map<string, EditorCanvasConfiguration> = new Map()
  private nodeConfigurations: Map<string, EditorNodeConfiguration> = new Map()
  private editorStates: Map<string, EditorState> = new Map()
  private operationHistory: Map<string, EditorOperation[]> = new Map()

  private initialized = false
  private defaultOptions: ConfigurationPropagationOptions = {
    cascade: true,
    skipValidation: false,
    preserveLocal: false,
    mergeStrategy: 'deep-merge',
    notifyDependents: true,
    createSnapshot: true
  }

  constructor() {
    super()
    this.configManager = new EnhancedConfigurationStateManager()
    this.eventSystem = new EnhancedEventSystem()
    this.dependencyManager = new ConfigurationDependencyManager()
    this.errorHandler = new EnhancedErrorHandler()

    this.setupEventListeners()
  }

  /**
   * 初始化集成桥接器
   * 设置必要的事件监听和状态管理
   */
  async initialize(): Promise<void> {
    try {
      // 初始化各个管理器
      await this.configManager.initialize()
      await this.eventSystem.initialize()
      await this.dependencyManager.initialize()
      await this.errorHandler.initialize()

      // 设置跨管理器的事件转发
      this.setupCrossManagerEventForwarding()

      this.initialized = true
      this.emit('initialized')

    } catch (error) {
      const handled = await this.errorHandler.handleError(error, {
        operation: 'initialize',
        component: 'VisualEditorIntegrationBridge'
      })

      if (!handled.recovered) {
        throw new Error(`初始化Visual Editor集成桥接器失败: ${handled.message}`)
      }
    }
  }

  /**
   * 创建新的编辑器画布
   *
   * @param canvasConfig 画布配置
   * @returns 画布ID
   */
  async createCanvas(canvasConfig: Partial<EditorCanvasConfiguration>): Promise<string> {
    try {
      const canvasId = canvasConfig.id || `canvas_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      const fullConfig: EditorCanvasConfiguration = {
        id: canvasId,
        title: canvasConfig.title || '新建画布',
        description: canvasConfig.description,
        version: '1.0.0',
        created: new Date().toISOString(),
        modified: new Date().toISOString(),
        author: canvasConfig.author || 'system',
        canvas: {
          width: 1920,
          height: 1080,
          zoom: 1,
          grid: {
            enabled: true,
            size: 20,
            snap: true
          },
          background: {
            type: 'color',
            value: '#f5f5f5'
          },
          ...canvasConfig.canvas
        },
        nodes: {},
        connections: [],
        layout: {
          type: 'canvas',
          options: {},
          ...canvasConfig.layout
        },
        theme: {
          name: 'default',
          variables: {},
          ...canvasConfig.theme
        },
        permissions: {
          canEdit: true,
          canView: true,
          canExport: true,
          canShare: true,
          ...canvasConfig.permissions
        },
        metadata: canvasConfig.metadata || {}
      }

      // 存储画布配置
      this.canvasConfigurations.set(canvasId, fullConfig)

      // 初始化编辑器状态
      this.editorStates.set(canvasId, {
        mode: 'edit',
        selection: [],
        clipboard: [],
        history: {
          canUndo: false,
          canRedo: false,
          position: 0,
          stack: []
        },
        validation: {
          isValid: true,
          errorCount: 0,
          warningCount: 0
        },
        dirty: false,
        loading: false
      })

      // 初始化操作历史
      this.operationHistory.set(canvasId, [])

      // 触发事件
      await this.eventSystem.publish('canvas:created', {
        canvasId,
        configuration: fullConfig
      })

      this.emit('canvasCreated', { canvasId, configuration: fullConfig })

      return canvasId

    } catch (error) {
      const handled = await this.errorHandler.handleError(error, {
        operation: 'createCanvas',
        canvasConfig
      })

      if (!handled.recovered) {
        throw new Error(`创建画布失败: ${handled.message}`)
      }

      return handled.result?.canvasId || ''
    }
  }

  /**
   * 在画布中创建新节点
   *
   * @param canvasId 画布ID
   * @param nodeConfig 节点配置
   * @returns 节点ID
   */
  async createNode(canvasId: string, nodeConfig: Partial<EditorNodeConfiguration>): Promise<string> {
    try {
      const canvas = this.canvasConfigurations.get(canvasId)
      if (!canvas) {
        throw new Error(`画布不存在: ${canvasId}`)
      }

      const nodeId = nodeConfig.id || `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      const fullNodeConfig: EditorNodeConfiguration = {
        id: nodeId,
        type: nodeConfig.type || 'widget',
        parentId: nodeConfig.parentId,
        children: nodeConfig.children || [],
        position: nodeConfig.position || { x: 0, y: 0 },
        size: nodeConfig.size || { width: 200, height: 150 },
        configuration: nodeConfig.configuration || {},
        metadata: {
          title: nodeConfig.metadata?.title || '新建组件',
          description: nodeConfig.metadata?.description,
          category: nodeConfig.metadata?.category || 'general',
          tags: nodeConfig.metadata?.tags || [],
          visible: nodeConfig.metadata?.visible !== false,
          locked: nodeConfig.metadata?.locked || false,
          collapsed: nodeConfig.metadata?.collapsed || false,
          created: new Date().toISOString(),
          modified: new Date().toISOString(),
          author: nodeConfig.metadata?.author || canvas.author,
          version: '1.0.0'
        },
        bindings: nodeConfig.bindings || {},
        styling: nodeConfig.styling || {},
        validation: {
          isValid: true,
          errors: [],
          warnings: []
        }
      }

      // 验证节点配置
      const validationResult = await this.validateNodeConfiguration(fullNodeConfig)
      fullNodeConfig.validation = {
        isValid: validationResult.isValid,
        errors: validationResult.errors.map(e => e.message),
        warnings: validationResult.warnings.map(w => w.message)
      }

      // 将节点配置添加到Config Manager
      if (fullNodeConfig.configuration && Object.keys(fullNodeConfig.configuration).length > 0) {
        await this.configManager.setConfiguration(nodeId, fullNodeConfig.configuration)
      }

      // 存储节点配置
      this.nodeConfigurations.set(nodeId, fullNodeConfig)
      canvas.nodes[nodeId] = fullNodeConfig

      // 处理父子关系
      if (fullNodeConfig.parentId && canvas.nodes[fullNodeConfig.parentId]) {
        const parent = canvas.nodes[fullNodeConfig.parentId]
        if (!parent.children) parent.children = []
        if (!parent.children.includes(nodeId)) {
          parent.children.push(nodeId)
        }
      }

      // 添加依赖关系
      if (fullNodeConfig.parentId) {
        this.dependencyManager.addDependency({
          source: fullNodeConfig.parentId,
          target: nodeId,
          type: 'parent-child',
          strength: 'strong'
        })
      }

      // 记录操作
      await this.recordOperation(canvasId, {
        type: 'create',
        target: nodeId,
        data: fullNodeConfig,
        metadata: {
          timestamp: new Date().toISOString(),
          author: fullNodeConfig.metadata.author,
          description: `创建节点: ${fullNodeConfig.metadata.title}`
        }
      })

      // 更新画布状态
      await this.updateCanvasState(canvasId, { dirty: true })

      // 触发事件
      await this.eventSystem.publish('node:created', {
        canvasId,
        nodeId,
        configuration: fullNodeConfig
      })

      this.emit('nodeCreated', { canvasId, nodeId, configuration: fullNodeConfig })

      return nodeId

    } catch (error) {
      const handled = await this.errorHandler.handleError(error, {
        operation: 'createNode',
        canvasId,
        nodeConfig
      })

      if (!handled.recovered) {
        throw new Error(`创建节点失败: ${handled.message}`)
      }

      return handled.result?.nodeId || ''
    }
  }

  /**
   * 更新节点配置
   * 实现配置的级联传播机制
   *
   * @param nodeId 节点ID
   * @param configuration 新的配置
   * @param options 传播选项
   */
  async updateNodeConfiguration(
    nodeId: string,
    configuration: Partial<WidgetConfiguration>,
    options: Partial<ConfigurationPropagationOptions> = {}
  ): Promise<void> {
    try {
      const node = this.nodeConfigurations.get(nodeId)
      if (!node) {
        throw new Error(`节点不存在: ${nodeId}`)
      }

      const finalOptions = { ...this.defaultOptions, ...options }

      // 创建快照（如果需要）
      if (finalOptions.createSnapshot) {
        await this.configManager.createSnapshot(nodeId, `更新前快照_${Date.now()}`)
      }

      // 合并配置
      let newConfiguration: WidgetConfiguration
      switch (finalOptions.mergeStrategy) {
        case 'replace':
          newConfiguration = configuration as WidgetConfiguration
          break
        case 'merge':
          newConfiguration = { ...node.configuration, ...configuration }
          break
        case 'deep-merge':
        default:
          newConfiguration = this.deepMergeConfigurations(node.configuration, configuration)
          break
      }

      // 验证配置（如果需要）
      if (!finalOptions.skipValidation) {
        const validationResult = await this.configManager.validateConfiguration(newConfiguration)
        if (!validationResult.isValid) {
          throw new Error(`配置验证失败: ${validationResult.errors.map(e => e.message).join(', ')}`)
        }

        // 更新验证状态
        node.validation = {
          isValid: validationResult.isValid,
          errors: validationResult.errors.map(e => e.message),
          warnings: validationResult.warnings.map(w => w.message)
        }
      }

      // 更新配置
      await this.configManager.setConfiguration(nodeId, newConfiguration)
      node.configuration = newConfiguration
      node.metadata.modified = new Date().toISOString()

      // 级联传播（如果需要）
      if (finalOptions.cascade && node.children && node.children.length > 0) {
        await this.propagateConfigurationToChildren(node, configuration, finalOptions)
      }

      // 通知依赖节点（如果需要）
      if (finalOptions.notifyDependents) {
        await this.notifyDependentNodes(nodeId, configuration)
      }

      // 找到所属画布并记录操作
      const canvasId = this.findCanvasForNode(nodeId)
      if (canvasId) {
        await this.recordOperation(canvasId, {
          type: 'configure',
          target: nodeId,
          data: { configuration, options: finalOptions },
          metadata: {
            timestamp: new Date().toISOString(),
            author: node.metadata.author,
            description: `更新节点配置: ${node.metadata.title}`
          }
        })

        await this.updateCanvasState(canvasId, { dirty: true })
      }

      // 触发事件
      await this.eventSystem.publish('node:configured', {
        nodeId,
        configuration: newConfiguration,
        options: finalOptions
      })

      this.emit('nodeConfigured', {
        nodeId,
        configuration: newConfiguration,
        options: finalOptions
      })

    } catch (error) {
      const handled = await this.errorHandler.handleError(error, {
        operation: 'updateNodeConfiguration',
        nodeId,
        configuration,
        options
      })

      if (!handled.recovered) {
        throw new Error(`更新节点配置失败: ${handled.message}`)
      }
    }
  }

  /**
   * 获取节点配置
   *
   * @param nodeId 节点ID
   * @returns 节点配置
   */
  getNodeConfiguration(nodeId: string): EditorNodeConfiguration | undefined {
    return this.nodeConfigurations.get(nodeId)
  }

  /**
   * 获取画布配置
   *
   * @param canvasId 画布ID
   * @returns 画布配置
   */
  getCanvasConfiguration(canvasId: string): EditorCanvasConfiguration | undefined {
    return this.canvasConfigurations.get(canvasId)
  }

  /**
   * 获取编辑器状态
   *
   * @param canvasId 画布ID
   * @returns 编辑器状态
   */
  getEditorState(canvasId: string): EditorState | undefined {
    return this.editorStates.get(canvasId)
  }

  /**
   * 删除节点
   *
   * @param nodeId 节点ID
   */
  async deleteNode(nodeId: string): Promise<void> {
    try {
      const node = this.nodeConfigurations.get(nodeId)
      if (!node) {
        throw new Error(`节点不存在: ${nodeId}`)
      }

      const canvasId = this.findCanvasForNode(nodeId)
      if (!canvasId) {
        throw new Error(`找不到节点所属的画布: ${nodeId}`)
      }

      const canvas = this.canvasConfigurations.get(canvasId)!

      // 递归删除子节点
      if (node.children && node.children.length > 0) {
        for (const childId of [...node.children]) {
          await this.deleteNode(childId)
        }
      }

      // 从父节点中移除
      if (node.parentId && canvas.nodes[node.parentId]) {
        const parent = canvas.nodes[node.parentId]
        if (parent.children) {
          parent.children = parent.children.filter(id => id !== nodeId)
        }
      }

      // 删除连接
      canvas.connections = canvas.connections.filter(
        conn => conn.source !== nodeId && conn.target !== nodeId
      )

      // 删除依赖关系
      await this.dependencyManager.removeDependenciesByComponent(nodeId)

      // 删除配置
      await this.configManager.deleteConfiguration(nodeId)

      // 从存储中移除
      this.nodeConfigurations.delete(nodeId)
      delete canvas.nodes[nodeId]

      // 记录操作
      await this.recordOperation(canvasId, {
        type: 'delete',
        target: nodeId,
        data: { nodeMetadata: node.metadata },
        metadata: {
          timestamp: new Date().toISOString(),
          author: node.metadata.author,
          description: `删除节点: ${node.metadata.title}`
        }
      })

      // 更新画布状态
      await this.updateCanvasState(canvasId, { dirty: true })

      // 触发事件
      await this.eventSystem.publish('node:deleted', {
        canvasId,
        nodeId,
        nodeMetadata: node.metadata
      })

      this.emit('nodeDeleted', { canvasId, nodeId, nodeMetadata: node.metadata })

    } catch (error) {
      const handled = await this.errorHandler.handleError(error, {
        operation: 'deleteNode',
        nodeId
      })

      if (!handled.recovered) {
        throw new Error(`删除节点失败: ${handled.message}`)
      }
    }
  }

  /**
   * 移动节点位置
   *
   * @param nodeId 节点ID
   * @param position 新位置
   */
  async moveNode(nodeId: string, position: { x: number; y: number; z?: number }): Promise<void> {
    try {
      const node = this.nodeConfigurations.get(nodeId)
      if (!node) {
        throw new Error(`节点不存在: ${nodeId}`)
      }

      const oldPosition = { ...node.position }
      node.position = { ...node.position, ...position }
      node.metadata.modified = new Date().toISOString()

      const canvasId = this.findCanvasForNode(nodeId)
      if (canvasId) {
        await this.recordOperation(canvasId, {
          type: 'move',
          target: nodeId,
          data: { oldPosition, newPosition: node.position },
          metadata: {
            timestamp: new Date().toISOString(),
            author: node.metadata.author,
            description: `移动节点: ${node.metadata.title}`
          }
        })

        await this.updateCanvasState(canvasId, { dirty: true })
      }

      // 触发事件
      await this.eventSystem.publish('node:moved', {
        nodeId,
        oldPosition,
        newPosition: node.position
      })

      this.emit('nodeMoved', { nodeId, oldPosition, newPosition: node.position })

    } catch (error) {
      const handled = await this.errorHandler.handleError(error, {
        operation: 'moveNode',
        nodeId,
        position
      })

      if (!handled.recovered) {
        throw new Error(`移动节点失败: ${handled.message}`)
      }
    }
  }

  /**
   * 调整节点尺寸
   *
   * @param nodeId 节点ID
   * @param size 新尺寸
   */
  async resizeNode(nodeId: string, size: { width: number; height: number }): Promise<void> {
    try {
      const node = this.nodeConfigurations.get(nodeId)
      if (!node) {
        throw new Error(`节点不存在: ${nodeId}`)
      }

      const oldSize = { ...node.size }
      node.size = { ...size }
      node.metadata.modified = new Date().toISOString()

      const canvasId = this.findCanvasForNode(nodeId)
      if (canvasId) {
        await this.recordOperation(canvasId, {
          type: 'resize',
          target: nodeId,
          data: { oldSize, newSize: node.size },
          metadata: {
            timestamp: new Date().toISOString(),
            author: node.metadata.author,
            description: `调整节点尺寸: ${node.metadata.title}`
          }
        })

        await this.updateCanvasState(canvasId, { dirty: true })
      }

      // 触发事件
      await this.eventSystem.publish('node:resized', {
        nodeId,
        oldSize,
        newSize: node.size
      })

      this.emit('nodeResized', { nodeId, oldSize, newSize: node.size })

    } catch (error) {
      const handled = await this.errorHandler.handleError(error, {
        operation: 'resizeNode',
        nodeId,
        size
      })

      if (!handled.recovered) {
        throw new Error(`调整节点尺寸失败: ${handled.message}`)
      }
    }
  }

  /**
   * 连接两个节点
   *
   * @param sourceId 源节点ID
   * @param targetId 目标节点ID
   * @param connectionType 连接类型
   */
  async connectNodes(sourceId: string, targetId: string, connectionType = 'data'): Promise<string> {
    try {
      const sourceNode = this.nodeConfigurations.get(sourceId)
      const targetNode = this.nodeConfigurations.get(targetId)

      if (!sourceNode || !targetNode) {
        throw new Error(`节点不存在: ${!sourceNode ? sourceId : targetId}`)
      }

      const canvasId = this.findCanvasForNode(sourceId)
      if (!canvasId || this.findCanvasForNode(targetId) !== canvasId) {
        throw new Error('只能连接同一画布中的节点')
      }

      const canvas = this.canvasConfigurations.get(canvasId)!

      // 检查是否已存在连接
      const existingConnection = canvas.connections.find(
        conn => conn.source === sourceId && conn.target === targetId && conn.type === connectionType
      )

      if (existingConnection) {
        throw new Error('连接已存在')
      }

      // 创建连接
      const connectionId = `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const connection = {
        id: connectionId,
        source: sourceId,
        target: targetId,
        type: connectionType,
        metadata: {
          created: new Date().toISOString(),
          author: sourceNode.metadata.author
        }
      }

      canvas.connections.push(connection)

      // 添加依赖关系
      await this.dependencyManager.addDependency({
        source: sourceId,
        target: targetId,
        type: connectionType,
        strength: 'medium'
      })

      // 记录操作
      await this.recordOperation(canvasId, {
        type: 'connect',
        target: connectionId,
        data: connection,
        metadata: {
          timestamp: new Date().toISOString(),
          author: sourceNode.metadata.author,
          description: `连接节点: ${sourceNode.metadata.title} -> ${targetNode.metadata.title}`
        }
      })

      // 更新画布状态
      await this.updateCanvasState(canvasId, { dirty: true })

      // 触发事件
      await this.eventSystem.publish('nodes:connected', {
        canvasId,
        connectionId,
        sourceId,
        targetId,
        connectionType
      })

      this.emit('nodesConnected', {
        canvasId,
        connectionId,
        sourceId,
        targetId,
        connectionType
      })

      return connectionId

    } catch (error) {
      const handled = await this.errorHandler.handleError(error, {
        operation: 'connectNodes',
        sourceId,
        targetId,
        connectionType
      })

      if (!handled.recovered) {
        throw new Error(`连接节点失败: ${handled.message}`)
      }

      return handled.result?.connectionId || ''
    }
  }

  /**
   * 断开节点连接
   *
   * @param connectionId 连接ID
   */
  async disconnectNodes(connectionId: string): Promise<void> {
    try {
      // 查找连接所在的画布
      let targetCanvas: EditorCanvasConfiguration | undefined
      let connection: any

      for (const canvas of this.canvasConfigurations.values()) {
        connection = canvas.connections.find(conn => conn.id === connectionId)
        if (connection) {
          targetCanvas = canvas
          break
        }
      }

      if (!targetCanvas || !connection) {
        throw new Error(`连接不存在: ${connectionId}`)
      }

      // 移除连接
      targetCanvas.connections = targetCanvas.connections.filter(conn => conn.id !== connectionId)

      // 移除依赖关系
      await this.dependencyManager.removeDependency(connection.source, connection.target, connection.type)

      // 记录操作
      await this.recordOperation(targetCanvas.id, {
        type: 'disconnect',
        target: connectionId,
        data: connection,
        metadata: {
          timestamp: new Date().toISOString(),
          author: connection.metadata?.author || 'system',
          description: `断开连接: ${connectionId}`
        }
      })

      // 更新画布状态
      await this.updateCanvasState(targetCanvas.id, { dirty: true })

      // 触发事件
      await this.eventSystem.publish('nodes:disconnected', {
        canvasId: targetCanvas.id,
        connectionId,
        sourceId: connection.source,
        targetId: connection.target
      })

      this.emit('nodesDisconnected', {
        canvasId: targetCanvas.id,
        connectionId,
        sourceId: connection.source,
        targetId: connection.target
      })

    } catch (error) {
      const handled = await this.errorHandler.handleError(error, {
        operation: 'disconnectNodes',
        connectionId
      })

      if (!handled.recovered) {
        throw new Error(`断开连接失败: ${handled.message}`)
      }
    }
  }

  /**
   * 保存画布配置
   *
   * @param canvasId 画布ID
   */
  async saveCanvas(canvasId: string): Promise<void> {
    try {
      const canvas = this.canvasConfigurations.get(canvasId)
      if (!canvas) {
        throw new Error(`画布不存在: ${canvasId}`)
      }

      // 验证画布配置
      const validationResults = await this.validateCanvas(canvasId)
      if (!validationResults.isValid) {
        throw new Error(`画布验证失败: ${validationResults.errors.join(', ')}`)
      }

      // 更新修改时间
      canvas.modified = new Date().toISOString()

      // 创建配置快照
      await this.configManager.createSnapshot(canvasId, `画布保存_${Date.now()}`, {
        canvas,
        nodes: Object.fromEntries(
          Object.entries(canvas.nodes).map(([id, node]) => [id, node.configuration])
        )
      })

      // 更新画布状态
      await this.updateCanvasState(canvasId, { dirty: false })

      // 触发事件
      await this.eventSystem.publish('canvas:saved', {
        canvasId,
        configuration: canvas
      })

      this.emit('canvasSaved', { canvasId, configuration: canvas })

    } catch (error) {
      const handled = await this.errorHandler.handleError(error, {
        operation: 'saveCanvas',
        canvasId
      })

      if (!handled.recovered) {
        throw new Error(`保存画布失败: ${handled.message}`)
      }
    }
  }

  /**
   * 导出画布配置
   *
   * @param canvasId 画布ID
   * @param options 导出选项
   */
  async exportCanvas(canvasId: string, options: ConfigurationExportOptions = {}): Promise<any> {
    try {
      const canvas = this.canvasConfigurations.get(canvasId)
      if (!canvas) {
        throw new Error(`画布不存在: ${canvasId}`)
      }

      // 收集所有节点配置
      const nodeConfigurations: Record<string, WidgetConfiguration> = {}
      for (const [nodeId, node] of Object.entries(canvas.nodes)) {
        nodeConfigurations[nodeId] = node.configuration
      }

      // 使用Config Manager的导出功能
      const exportResult = await this.configManager.exportConfigurations(nodeConfigurations, {
        format: options.format || 'json',
        includeMetadata: options.includeMetadata !== false,
        compress: options.compress || false,
        ...options
      })

      // 添加画布特定信息
      const canvasExport = {
        version: '1.0.0',
        type: 'visual-editor-canvas',
        canvas: {
          metadata: {
            id: canvas.id,
            title: canvas.title,
            description: canvas.description,
            version: canvas.version,
            created: canvas.created,
            modified: canvas.modified,
            author: canvas.author
          },
          configuration: {
            canvas: canvas.canvas,
            layout: canvas.layout,
            theme: canvas.theme,
            permissions: canvas.permissions
          },
          nodes: canvas.nodes,
          connections: canvas.connections
        },
        configurations: exportResult.data
      }

      // 触发事件
      await this.eventSystem.publish('canvas:exported', {
        canvasId,
        format: options.format || 'json',
        size: JSON.stringify(canvasExport).length
      })

      this.emit('canvasExported', { canvasId, data: canvasExport })

      return canvasExport

    } catch (error) {
      const handled = await this.errorHandler.handleError(error, {
        operation: 'exportCanvas',
        canvasId,
        options
      })

      if (!handled.recovered) {
        throw new Error(`导出画布失败: ${handled.message}`)
      }

      return handled.result?.data
    }
  }

  /**
   * 导入画布配置
   *
   * @param canvasData 画布数据
   * @param options 导入选项
   */
  async importCanvas(canvasData: any, options: ConfigurationImportOptions = {}): Promise<string> {
    try {
      // 验证导入数据结构
      if (!canvasData.canvas || !canvasData.configurations) {
        throw new Error('无效的画布导入数据结构')
      }

      const canvasConfig = canvasData.canvas
      const configurations = canvasData.configurations

      // 创建新画布
      const canvasId = await this.createCanvas({
        ...canvasConfig.metadata,
        canvas: canvasConfig.configuration.canvas,
        layout: canvasConfig.configuration.layout,
        theme: canvasConfig.configuration.theme,
        permissions: canvasConfig.configuration.permissions
      })

      // 导入节点配置
      const nodeIdMapping: Record<string, string> = {}

      for (const [originalNodeId, nodeConfig] of Object.entries(canvasConfig.nodes)) {
        const node = nodeConfig as EditorNodeConfiguration

        // 创建新节点ID
        const newNodeId = `imported_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        nodeIdMapping[originalNodeId] = newNodeId

        // 导入节点配置
        await this.createNode(canvasId, {
          id: newNodeId,
          type: node.type,
          position: node.position,
          size: node.size,
          configuration: configurations[originalNodeId] || node.configuration,
          metadata: {
            ...node.metadata,
            created: new Date().toISOString(),
            modified: new Date().toISOString()
          },
          bindings: node.bindings,
          styling: node.styling
        })
      }

      // 重建连接关系（使用新的节点ID）
      const canvas = this.canvasConfigurations.get(canvasId)!
      canvas.connections = []

      for (const connection of canvasConfig.connections) {
        const newSourceId = nodeIdMapping[connection.source]
        const newTargetId = nodeIdMapping[connection.target]

        if (newSourceId && newTargetId) {
          await this.connectNodes(newSourceId, newTargetId, connection.type)
        }
      }

      // 重建父子关系
      for (const [originalNodeId, nodeConfig] of Object.entries(canvasConfig.nodes)) {
        const node = nodeConfig as EditorNodeConfiguration
        const newNodeId = nodeIdMapping[originalNodeId]

        if (node.parentId && nodeIdMapping[node.parentId] && newNodeId) {
          const newNode = canvas.nodes[newNodeId]
          const newParentId = nodeIdMapping[node.parentId]

          newNode.parentId = newParentId

          const parent = canvas.nodes[newParentId]
          if (!parent.children) parent.children = []
          if (!parent.children.includes(newNodeId)) {
            parent.children.push(newNodeId)
          }
        }
      }

      // 触发事件
      await this.eventSystem.publish('canvas:imported', {
        canvasId,
        originalData: canvasData,
        nodeIdMapping
      })

      this.emit('canvasImported', { canvasId, originalData: canvasData, nodeIdMapping })

      return canvasId

    } catch (error) {
      const handled = await this.errorHandler.handleError(error, {
        operation: 'importCanvas',
        canvasData,
        options
      })

      if (!handled.recovered) {
        throw new Error(`导入画布失败: ${handled.message}`)
      }

      return handled.result?.canvasId || ''
    }
  }

  /**
   * 撤销操作
   *
   * @param canvasId 画布ID
   */
  async undo(canvasId: string): Promise<void> {
    try {
      const state = this.editorStates.get(canvasId)
      if (!state || !state.history.canUndo) {
        throw new Error('没有可撤销的操作')
      }

      const history = this.operationHistory.get(canvasId)!
      const operation = history[state.history.position - 1]

      // 执行撤销操作
      await this.revertOperation(canvasId, operation)

      // 更新历史状态
      state.history.position--
      state.history.canUndo = state.history.position > 0
      state.history.canRedo = true
      state.dirty = true

      // 触发事件
      await this.eventSystem.publish('canvas:undo', {
        canvasId,
        operation
      })

      this.emit('canvasUndo', { canvasId, operation })

    } catch (error) {
      const handled = await this.errorHandler.handleError(error, {
        operation: 'undo',
        canvasId
      })

      if (!handled.recovered) {
        throw new Error(`撤销操作失败: ${handled.message}`)
      }
    }
  }

  /**
   * 重做操作
   *
   * @param canvasId 画布ID
   */
  async redo(canvasId: string): Promise<void> {
    try {
      const state = this.editorStates.get(canvasId)
      if (!state || !state.history.canRedo) {
        throw new Error('没有可重做的操作')
      }

      const history = this.operationHistory.get(canvasId)!
      const operation = history[state.history.position]

      // 执行重做操作
      await this.executeOperation(canvasId, operation)

      // 更新历史状态
      state.history.position++
      state.history.canRedo = state.history.position < history.length
      state.history.canUndo = true
      state.dirty = true

      // 触发事件
      await this.eventSystem.publish('canvas:redo', {
        canvasId,
        operation
      })

      this.emit('canvasRedo', { canvasId, operation })

    } catch (error) {
      const handled = await this.errorHandler.handleError(error, {
        operation: 'redo',
        canvasId
      })

      if (!handled.recovered) {
        throw new Error(`重做操作失败: ${handled.message}`)
      }
    }
  }

  /**
   * 验证画布配置
   *
   * @param canvasId 画布ID
   */
  async validateCanvas(canvasId: string): Promise<{ isValid: boolean; errors: string[]; warnings: string[] }> {
    try {
      const canvas = this.canvasConfigurations.get(canvasId)
      if (!canvas) {
        return {
          isValid: false,
          errors: [`画布不存在: ${canvasId}`],
          warnings: []
        }
      }

      const errors: string[] = []
      const warnings: string[] = []

      // 验证画布基本配置
      if (!canvas.title || canvas.title.trim() === '') {
        errors.push('画布标题不能为空')
      }

      if (canvas.canvas.width <= 0 || canvas.canvas.height <= 0) {
        errors.push('画布尺寸必须大于0')
      }

      // 验证节点配置
      for (const [nodeId, node] of Object.entries(canvas.nodes)) {
        const nodeValidation = await this.validateNodeConfiguration(node)
        if (!nodeValidation.isValid) {
          errors.push(...nodeValidation.errors.map(e => `节点 ${nodeId}: ${e.message}`))
          warnings.push(...nodeValidation.warnings.map(w => `节点 ${nodeId}: ${w.message}`))
        }
      }

      // 验证连接
      for (const connection of canvas.connections) {
        if (!canvas.nodes[connection.source]) {
          errors.push(`连接源节点不存在: ${connection.source}`)
        }
        if (!canvas.nodes[connection.target]) {
          errors.push(`连接目标节点不存在: ${connection.target}`)
        }
      }

      // 检查循环依赖
      const cycles = this.dependencyManager.detectCycles()
      if (cycles.length > 0) {
        warnings.push(`检测到循环依赖: ${cycles.length} 个`)
      }

      const isValid = errors.length === 0

      // 更新编辑器状态
      const state = this.editorStates.get(canvasId)
      if (state) {
        state.validation = {
          isValid,
          errorCount: errors.length,
          warningCount: warnings.length
        }
      }

      return { isValid, errors, warnings }

    } catch (error) {
      const handled = await this.errorHandler.handleError(error, {
        operation: 'validateCanvas',
        canvasId
      })

      return {
        isValid: false,
        errors: [`验证过程中发生错误: ${handled.message}`],
        warnings: []
      }
    }
  }

  /**
   * 获取配置历史
   *
   * @param nodeId 节点ID
   * @param limit 限制数量
   */
  async getConfigurationHistory(nodeId: string, limit = 10): Promise<ConfigurationSnapshot[]> {
    try {
      return await this.configManager.getSnapshots(nodeId, limit)
    } catch (error) {
      const handled = await this.errorHandler.handleError(error, {
        operation: 'getConfigurationHistory',
        nodeId,
        limit
      })

      if (!handled.recovered) {
        throw new Error(`获取配置历史失败: ${handled.message}`)
      }

      return handled.result?.snapshots || []
    }
  }

  /**
   * 恢复到历史配置
   *
   * @param nodeId 节点ID
   * @param snapshotId 快照ID
   */
  async restoreFromHistory(nodeId: string, snapshotId: string): Promise<void> {
    try {
      const result = await this.configManager.restoreFromSnapshot(nodeId, snapshotId)
      if (result) {
        const node = this.nodeConfigurations.get(nodeId)
        if (node) {
          node.configuration = result
          node.metadata.modified = new Date().toISOString()

          // 触发事件
          await this.eventSystem.publish('node:restored', {
            nodeId,
            snapshotId,
            configuration: result
          })

          this.emit('nodeRestored', { nodeId, snapshotId, configuration: result })
        }
      }
    } catch (error) {
      const handled = await this.errorHandler.handleError(error, {
        operation: 'restoreFromHistory',
        nodeId,
        snapshotId
      })

      if (!handled.recovered) {
        throw new Error(`恢复历史配置失败: ${handled.message}`)
      }
    }
  }

  /**
   * 获取统计信息
   */
  getStatistics(): Record<string, any> {
    return {
      canvases: this.canvasConfigurations.size,
      nodes: this.nodeConfigurations.size,
      configurations: this.configManager.getStatistics(),
      dependencies: this.dependencyManager.getStatistics(),
      errors: this.errorHandler.getStatistics(),
      events: this.eventSystem.getStatistics()
    }
  }

  /**
   * 清理资源
   */
  async cleanup(): Promise<void> {
    try {
      // 停止所有事件监听
      this.removeAllListeners()

      // 清理各个管理器
      await this.configManager.cleanup()
      await this.eventSystem.cleanup()
      await this.dependencyManager.cleanup()
      await this.errorHandler.cleanup()

      // 清理本地缓存
      this.canvasConfigurations.clear()
      this.nodeConfigurations.clear()
      this.editorStates.clear()
      this.operationHistory.clear()

      this.initialized = false

    } catch (error) {
      await this.errorHandler.handleError(error, {
        operation: 'cleanup'
      })
    }
  }

  // ==================== 私有辅助方法 ====================

  /**
   * 设置事件监听器
   */
  private setupEventListeners(): void {
    // 监听配置变更事件
    this.configManager.on('configurationChanged', async (data) => {
      const node = this.nodeConfigurations.get(data.componentId)
      if (node) {
        node.configuration = data.configuration
        node.metadata.modified = new Date().toISOString()

        // 重新验证
        const validationResult = await this.validateNodeConfiguration(node)
        node.validation = {
          isValid: validationResult.isValid,
          errors: validationResult.errors.map(e => e.message),
          warnings: validationResult.warnings.map(w => w.message)
        }
      }
    })

    // 监听错误事件
    this.errorHandler.on('errorHandled', (data) => {
      this.emit('error', {
        level: data.level,
        message: data.message,
        context: data.context
      })
    })
  }

  /**
   * 设置跨管理器事件转发
   */
  private setupCrossManagerEventForwarding(): void {
    // 配置管理器事件转发到事件系统
    this.configManager.on('configurationChanged', async (data) => {
      await this.eventSystem.publish('config:changed', data)
    })

    // 依赖管理器事件转发到事件系统
    this.dependencyManager.on('dependencyAdded', async (data) => {
      await this.eventSystem.publish('dependency:added', data)
    })

    this.dependencyManager.on('circularDependencyDetected', async (data) => {
      await this.eventSystem.publish('dependency:circular', data)
    })
  }

  /**
   * 验证节点配置
   *
   * @param node 节点配置
   */
  private async validateNodeConfiguration(node: EditorNodeConfiguration): Promise<ConfigurationValidationResult> {
    try {
      const result = await this.configManager.validateConfiguration(node.configuration)

      // 添加节点特定的验证
      const additionalErrors: any[] = []
      const additionalWarnings: any[] = []

      // 验证节点基本信息
      if (!node.metadata.title || node.metadata.title.trim() === '') {
        additionalErrors.push({ message: '节点标题不能为空', path: 'metadata.title' })
      }

      if (node.size.width <= 0 || node.size.height <= 0) {
        additionalErrors.push({ message: '节点尺寸必须大于0', path: 'size' })
      }

      // 验证父子关系
      if (node.parentId && !this.nodeConfigurations.has(node.parentId)) {
        additionalErrors.push({ message: `父节点不存在: ${node.parentId}`, path: 'parentId' })
      }

      if (node.children) {
        for (const childId of node.children) {
          if (!this.nodeConfigurations.has(childId)) {
            additionalWarnings.push({ message: `子节点不存在: ${childId}`, path: 'children' })
          }
        }
      }

      return {
        isValid: result.isValid && additionalErrors.length === 0,
        errors: [...result.errors, ...additionalErrors],
        warnings: [...result.warnings, ...additionalWarnings]
      }

    } catch (error) {
      return {
        isValid: false,
        errors: [{ message: `验证过程中发生错误: ${error}`, path: 'root' }],
        warnings: []
      }
    }
  }

  /**
   * 深度合并配置
   *
   * @param target 目标配置
   * @param source 源配置
   */
  private deepMergeConfigurations(target: any, source: any): any {
    const result = { ...target }

    for (const key in source) {
      if (source.hasOwnProperty(key)) {
        if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
          result[key] = this.deepMergeConfigurations(result[key] || {}, source[key])
        } else {
          result[key] = source[key]
        }
      }
    }

    return result
  }

  /**
   * 配置传播到子节点
   *
   * @param parentNode 父节点
   * @param configuration 配置
   * @param options 选项
   */
  private async propagateConfigurationToChildren(
    parentNode: EditorNodeConfiguration,
    configuration: Partial<WidgetConfiguration>,
    options: ConfigurationPropagationOptions
  ): Promise<void> {
    if (!parentNode.children || parentNode.children.length === 0) {
      return
    }

    for (const childId of parentNode.children) {
      const childNode = this.nodeConfigurations.get(childId)
      if (childNode) {
        try {
          // 递归传播配置（但不再级联到更深层次）
          await this.updateNodeConfiguration(childId, configuration, {
            ...options,
            cascade: false  // 防止无限递归
          })
        } catch (error) {
          // 记录错误但继续处理其他子节点
          await this.errorHandler.handleError(error, {
            operation: 'propagateConfigurationToChildren',
            parentNodeId: parentNode.id,
            childNodeId: childId
          })
        }
      }
    }
  }

  /**
   * 通知依赖节点
   *
   * @param nodeId 节点ID
   * @param configuration 配置
   */
  private async notifyDependentNodes(nodeId: string, configuration: Partial<WidgetConfiguration>): Promise<void> {
    try {
      const dependents = this.dependencyManager.getDependents(nodeId)

      for (const dependent of dependents) {
        // 触发依赖节点更新事件
        await this.eventSystem.publish('node:dependencyUpdated', {
          nodeId: dependent.target,
          sourceNodeId: nodeId,
          dependencyType: dependent.type,
          updatedConfiguration: configuration
        })
      }
    } catch (error) {
      await this.errorHandler.handleError(error, {
        operation: 'notifyDependentNodes',
        nodeId,
        configuration
      })
    }
  }

  /**
   * 查找节点所属的画布
   *
   * @param nodeId 节点ID
   */
  private findCanvasForNode(nodeId: string): string | undefined {
    for (const [canvasId, canvas] of this.canvasConfigurations) {
      if (canvas.nodes[nodeId]) {
        return canvasId
      }
    }
    return undefined
  }

  /**
   * 记录操作到历史
   *
   * @param canvasId 画布ID
   * @param operation 操作
   */
  private async recordOperation(canvasId: string, operation: EditorOperation): Promise<void> {
    const history = this.operationHistory.get(canvasId)
    const state = this.editorStates.get(canvasId)

    if (history && state) {
      // 如果当前位置不在历史末尾，删除之后的历史
      if (state.history.position < history.length) {
        history.splice(state.history.position)
      }

      // 添加新操作
      history.push(operation)
      state.history.position = history.length
      state.history.canUndo = true
      state.history.canRedo = false

      // 限制历史长度
      const maxHistoryLength = 100
      if (history.length > maxHistoryLength) {
        history.splice(0, history.length - maxHistoryLength)
        state.history.position = history.length
      }
    }
  }

  /**
   * 执行操作
   *
   * @param canvasId 画布ID
   * @param operation 操作
   */
  private async executeOperation(canvasId: string, operation: EditorOperation): Promise<void> {
    // 这里应该根据操作类型执行相应的操作
    // 由于这是重做操作，实际的执行逻辑会根据具体情况而定
    // 现在只是一个占位符实现

    switch (operation.type) {
      case 'create':
        // 重新创建节点
        break
      case 'update':
        // 重新更新配置
        break
      case 'delete':
        // 重新删除节点
        break
      case 'move':
        // 重新移动节点
        break
      case 'resize':
        // 重新调整尺寸
        break
      default:
        // 其他操作
        break
    }
  }

  /**
   * 撤销操作
   *
   * @param canvasId 画布ID
   * @param operation 操作
   */
  private async revertOperation(canvasId: string, operation: EditorOperation): Promise<void> {
    // 这里应该根据操作类型撤销相应的操作
    // 现在只是一个占位符实现

    switch (operation.type) {
      case 'create':
        // 删除创建的节点
        break
      case 'update':
        // 恢复到更新前的配置
        break
      case 'delete':
        // 恢复删除的节点
        break
      case 'move':
        // 恢复到移动前的位置
        break
      case 'resize':
        // 恢复到调整前的尺寸
        break
      default:
        // 其他操作的撤销
        break
    }
  }

  /**
   * 更新画布状态
   *
   * @param canvasId 画布ID
   * @param updates 状态更新
   */
  private async updateCanvasState(canvasId: string, updates: Partial<EditorState>): Promise<void> {
    const state = this.editorStates.get(canvasId)
    if (state) {
      Object.assign(state, updates)

      // 触发状态更新事件
      await this.eventSystem.publish('canvas:stateChanged', {
        canvasId,
        state: { ...state },
        updates
      })

      this.emit('canvasStateChanged', { canvasId, state: { ...state }, updates })
    }
  }
}

// 导出类型和类
export type {
  EditorNodeConfiguration,
  EditorCanvasConfiguration,
  EditorOperation,
  EditorState,
  ConfigurationPropagationOptions
}

export { VisualEditorIntegrationBridge }