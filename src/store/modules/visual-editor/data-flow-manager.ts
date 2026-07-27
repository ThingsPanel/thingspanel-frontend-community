/**
 * 数据流管理器
 * 统一处理用户操作 → 状态更新 → 视图刷新的完整数据流
 */

import { useUnifiedEditorStore } from '@/store/modules/visual-editor/unified-editor'
import { useConfigurationService } from '@/store/modules/visual-editor/configuration-service'
import type { GraphData, WidgetConfiguration } from '@/store/modules/visual-editor/unified-editor'

/**
 * 用户操作类型定义
 */
export interface UserAction {
  type: ActionType
  targetId?: string
  data?: any
  metadata?: Record<string, any>
}

export type ActionType =
  | 'ADD_NODE'
  | 'UPDATE_NODE'
  | 'REMOVE_NODE'
  | 'SELECT_NODES'
  | 'UPDATE_CONFIGURATION'
  | 'SET_RUNTIME_DATA'
  | 'BATCH_UPDATE'

/**
 * 操作验证结果
 */
export interface ActionValidationResult {
  valid: boolean
  error?: string
  warnings?: string[]
}

/**
 * 副作用处理器接口
 */
export interface SideEffectHandler {
  name: string
  condition: (action: UserAction, context?: DataFlowContext) => boolean
  execute: (action: UserAction, context: DataFlowContext) => Promise<void> | void
}

/**
 * 数据流上下文
 */
export interface DataFlowContext {
  store: ReturnType<typeof useUnifiedEditorStore>
  configService: ReturnType<typeof useConfigurationService>
  action: UserAction
  timestamp: Date
}

/**
 * 数据流管理器
 * 🔥 统一的数据流控制中心，解决数据流混乱问题
 */
export class DataFlowManager {
  private store = useUnifiedEditorStore()
  private configService = useConfigurationService()
  private eventBus = new EventTarget()
  private sideEffectHandlers: SideEffectHandler[] = []
  private isProcessing = false

  constructor() {
    this.registerDefaultSideEffects()
  }

  // ==================== 核心数据流处理 ====================

  /**
   * 处理用户操作
   * 🔥 所有用户操作的统一入口
   */
  async handleUserAction(action: UserAction): Promise<void> {
    if (this.isProcessing) {
      return
    }

    this.isProcessing = true

    try {
      // 1. 验证操作
      const validationResult = this.validateAction(action)
      if (!validationResult.valid) {
        throw new Error(validationResult.error)
      }

      // 2. 更新状态
      await this.updateState(action)

      // 3. 触发副作用
      await this.triggerSideEffects(action)

      // 4. 通知视图更新
      this.notifyViewUpdate(action)
    } catch (error) {
      // 触发错误恢复
      await this.handleError(action, error as Error)

      throw error
    } finally {
      this.isProcessing = false
    }
  }

  /**
   * 批量处理用户操作
   */
  async handleBatchActions(actions: UserAction[]): Promise<void> {
    // 批量操作使用事务模式
    this.store.setLoading(true)

    try {
      for (const action of actions) {
        await this.handleUserAction(action)
      }
    } catch (error) {
      throw error
    } finally {
      this.store.setLoading(false)
    }
  }

  // ==================== 状态更新逻辑 ====================

  /**
   * 根据操作类型更新状态
   */
  private async updateState(action: UserAction): Promise<void> {
    switch (action.type) {
      case 'ADD_NODE':
        this.handleAddNode(action)
        break

      case 'UPDATE_NODE':
        await this.handleUpdateNode(action)
        break

      case 'REMOVE_NODE':
        this.handleRemoveNode(action)
        break

      case 'SELECT_NODES':
        this.handleSelectNodes(action)
        break

      case 'UPDATE_CONFIGURATION':
        await this.handleUpdateConfiguration(action)
        break

      case 'SET_RUNTIME_DATA':
        this.handleSetRuntimeData(action)
        break

      case 'BATCH_UPDATE':
        await this.handleBatchUpdate(action)
        break

      default:
    }
  }

  /**
   * 处理添加节点操作
   */
  private handleAddNode(action: UserAction): void {
    const node = action.data as GraphData
    this.store.addNode(node)
  }

  /**
   * 处理更新节点操作
   * 🔥 关键修复：同时更新节点状态和配置系统
   */
  private async handleUpdateNode(action: UserAction): Promise<void> {
    if (!action.targetId) {
      throw new Error('更新节点操作需要targetId')
    }

    if (process.env.NODE_ENV === 'development') {
    }

    // 1. 更新store中的节点状态
    this.store.updateNode(action.targetId, action.data)

    // 🔥 关键修复：如果更新包含properties，同时更新配置系统
    if (action.data && action.data.properties) {
      if (process.env.NODE_ENV === 'development') {
      }

      try {
        // 获取更新后的完整节点数据
        const updatedNode = this.store.nodes.find(n => n.id === action.targetId)
        if (updatedNode) {
          // 将节点的properties同步到配置系统的component配置中
          await this.syncNodePropertiesToConfiguration(action.targetId, updatedNode.properties)
        }
      } catch (error) {
        console.error(`❌ [DataFlowManager] 配置系统同步失败`, {
          componentId: action.targetId,
          error: error instanceof Error ? error.message : error
        })
        // 不抛出错误，避免阻断节点更新
      }
    }
  }

  /**
   * 处理删除节点操作
   */
  private handleRemoveNode(action: UserAction): void {
    if (!action.targetId) {
      throw new Error('删除节点操作需要targetId')
    }

    this.store.removeNode(action.targetId)
  }

  /**
   * 处理选择节点操作
   */
  private handleSelectNodes(action: UserAction): void {
    const nodeIds = action.data as string[]
    this.store.selectNodes(nodeIds)
  }

  /**
   * 处理更新配置操作
   */
  private async handleUpdateConfiguration(action: UserAction): Promise<void> {
    if (!action.targetId) {
      throw new Error('更新配置操作需要targetId')
    }

    const { section, config } = action.data as {
      section: keyof WidgetConfiguration
      config: any
    }

    // 使用配置服务更新配置
    this.configService.updateConfigurationSection(action.targetId, section, config)
  }

  /**
   * 处理设置运行时数据操作
   */
  private handleSetRuntimeData(action: UserAction): void {
    if (!action.targetId) {
      throw new Error('设置运行时数据操作需要targetId')
    }

    this.configService.setRuntimeData(action.targetId, action.data)
  }

  /**
   * 处理批量更新操作
   */
  private async handleBatchUpdate(action: UserAction): Promise<void> {
    const updates = action.data as Array<{
      widgetId: string
      section: keyof WidgetConfiguration
      data: any
    }>

    this.configService.batchUpdateConfiguration(updates)
  }

  /**
   * 🔥 新增：将节点属性同步到配置系统
   * 这是修复属性绑定链路的关键方法
   * @param componentId 组件ID
   * @param properties 节点属性对象
   */
  private async syncNodePropertiesToConfiguration(componentId: string, properties: Record<string, any>): Promise<void> {
    if (process.env.NODE_ENV === 'development') {
    }

    try {
      // 获取当前配置
      const currentConfig = this.configService.getConfiguration(componentId)
      if (process.env.NODE_ENV === 'development') {
      }

      if (!currentConfig) {
        // 如果没有配置，创建默认配置
        if (process.env.NODE_ENV === 'development') {
        }
        this.configService.initializeConfiguration(componentId)
      }

      // 🔥 关键：将properties更新到component配置节中
      // 这样配置变更事件就会被触发
      if (process.env.NODE_ENV === 'development') {
      }

      // 使用updateConfigurationSection触发配置变更事件
      this.configService.updateConfigurationSection(componentId, 'component', {
        ...properties // 将所有properties作为component配置
      })

      if (process.env.NODE_ENV === 'development') {
      }
    } catch (error) {
      console.error(`❌ [DataFlowManager] syncNodePropertiesToConfiguration 失败`, {
        componentId,
        error: error instanceof Error ? error.message : error
      })
      throw error
    }
  }

  // ==================== 操作验证 ====================

  /**
   * 验证用户操作
   */
  private validateAction(action: UserAction): ActionValidationResult {
    // 基础验证
    if (!action.type) {
      return { valid: false, error: '操作类型不能为空' }
    }

    // 类型特定验证
    switch (action.type) {
      case 'ADD_NODE':
        return this.validateAddNodeAction(action)

      case 'UPDATE_NODE':
      case 'REMOVE_NODE':
        return this.validateNodeTargetAction(action)

      case 'UPDATE_CONFIGURATION':
        return this.validateConfigurationAction(action)

      case 'SET_RUNTIME_DATA':
        return this.validateRuntimeDataAction(action)

      default:
        return { valid: true }
    }
  }

  /**
   * 验证添加节点操作
   */
  private validateAddNodeAction(action: UserAction): ActionValidationResult {
    if (!action.data) {
      return { valid: false, error: '添加节点操作需要节点数据' }
    }

    const node = action.data as GraphData
    if (!node.id) {
      return { valid: false, error: '节点必须有ID' }
    }

    // 检查ID是否已存在
    const existingNode = this.store.nodes.find(n => n.id === node.id)
    if (existingNode) {
      return { valid: false, error: `节点ID已存在: ${node.id}` }
    }

    return { valid: true }
  }

  /**
   * 验证需要目标ID的节点操作
   */
  private validateNodeTargetAction(action: UserAction): ActionValidationResult {
    if (!action.targetId) {
      return { valid: false, error: '操作需要targetId' }
    }

    // 检查节点是否存在
    const node = this.store.nodes.find(n => n.id === action.targetId)
    if (!node) {
      return { valid: false, error: `节点不存在: ${action.targetId}` }
    }

    return { valid: true }
  }

  /**
   * 验证配置操作
   */
  private validateConfigurationAction(action: UserAction): ActionValidationResult {
    if (!action.targetId) {
      return { valid: false, error: '配置操作需要targetId' }
    }

    if (!action.data || !action.data.section) {
      return { valid: false, error: '配置操作需要section参数' }
    }

    const validSections = ['base', 'component', 'dataSource', 'interaction']
    if (!validSections.includes(action.data.section)) {
      return { valid: false, error: `无效的配置section: ${action.data.section}` }
    }

    return { valid: true }
  }

  /**
   * 验证运行时数据操作
   */
  private validateRuntimeDataAction(action: UserAction): ActionValidationResult {
    if (!action.targetId) {
      return { valid: false, error: '运行时数据操作需要targetId' }
    }

    return { valid: true }
  }

  // ==================== 副作用处理 ====================

  /**
   * 触发副作用处理
   */
  private async triggerSideEffects(action: UserAction): Promise<void> {
    const context: DataFlowContext = {
      store: this.store,
      configService: this.configService,
      action,
      timestamp: new Date()
    }

    // 并行执行所有匹配的副作用处理器
    const matchingHandlers = this.sideEffectHandlers.filter(handler => handler.condition(action, context))

    await Promise.all(
      matchingHandlers.map(async handler => {
        try {
          await handler.execute(action, context)
        } catch (error) {}
      })
    )
  }

  /**
   * 注册副作用处理器
   */
  registerSideEffect(handler: SideEffectHandler): void {
    this.sideEffectHandlers.push(handler)
  }

  /**
   * 注册默认的副作用处理器
   */
  private registerDefaultSideEffects(): void {
    // 配置自动保存
    this.registerSideEffect({
      name: 'AutoSaveConfiguration',
      condition: action => action.type === 'UPDATE_CONFIGURATION',
      execute: async (action, context) => {
        if (action.targetId) {
          await context.configService.saveConfiguration(action.targetId)
        }
      }
    })

    // 数据源变更处理
    this.registerSideEffect({
      name: 'DataSourceChangeHandler',
      condition: action => action.type === 'UPDATE_CONFIGURATION' && action.data?.section === 'dataSource',
      execute: async (action, context) => {
        // 清理旧的运行时数据
        if (action.targetId) {
          context.configService.setRuntimeData(action.targetId, null)
        }

        // 触发数据重新获取
        // TODO: 集成实际的数据获取逻辑
      }
    })

    // Card2.1组件特殊处理
    this.registerSideEffect({
      name: 'Card2ComponentHandler',
      condition: (action, context) => {
        if (!action.targetId || !context?.store) return false
        return context.store.card2Components.has(action.targetId)
      },
      execute: async (action, context) => {
        // Card2.1特殊的数据绑定处理
        if (action.type === 'UPDATE_CONFIGURATION' && action.data?.section === 'dataSource') {
          context.store.updateDataBinding(action.targetId!)
        }
      }
    })
  }

  // ==================== 视图更新通知 ====================

  /**
   * 通知视图更新
   */
  private notifyViewUpdate(action: UserAction): void {
    const event = new CustomEvent('data-flow-update', {
      detail: {
        action,
        timestamp: new Date()
      }
    })

    this.eventBus.dispatchEvent(event)
  }

  /**
   * 监听数据流更新事件
   */
  onDataFlowUpdate(callback: (action: UserAction) => void): () => void {
    const handler = (event: CustomEvent) => {
      callback(event.detail.action)
    }

    this.eventBus.addEventListener('data-flow-update', handler as EventListener)

    return () => {
      this.eventBus.removeEventListener('data-flow-update', handler as EventListener)
    }
  }

  // ==================== 错误处理 ====================

  /**
   * 处理错误和恢复
   */
  private async handleError(action: UserAction, error: Error): Promise<void> {
    // 触发错误事件
    const errorEvent = new CustomEvent('data-flow-error', {
      detail: {
        action,
        error,
        timestamp: new Date()
      }
    })

    this.eventBus.dispatchEvent(errorEvent)

    // TODO: 实现错误恢复逻辑
    // 例如：回滚状态变更、显示用户友好的错误提示等
  }

  /**
   * 监听错误事件
   */
  onError(callback: (action: UserAction, error: Error) => void): () => void {
    const handler = (event: CustomEvent) => {
      callback(event.detail.action, event.detail.error)
    }

    this.eventBus.addEventListener('data-flow-error', handler as EventListener)

    return () => {
      this.eventBus.removeEventListener('data-flow-error', handler as EventListener)
    }
  }
}

// ==================== 单例模式 ====================

let dataFlowManagerInstance: DataFlowManager | null = null

/**
 * 获取数据流管理器实例（单例）
 */
export function useDataFlowManager(): DataFlowManager {
  if (!dataFlowManagerInstance) {
    dataFlowManagerInstance = new DataFlowManager()
  }

  return dataFlowManagerInstance
}

/**
 * 重置数据流管理器实例（测试用）
 */
export function resetDataFlowManager(): void {
  dataFlowManagerInstance = null
}

// ==================== 便捷操作函数 ====================

/**
 * 创建添加节点操作
 */
export function createAddNodeAction(node: GraphData): UserAction {
  return {
    type: 'ADD_NODE',
    data: node
  }
}

/**
 * 创建更新配置操作
 */
export function createUpdateConfigAction(
  widgetId: string,
  section: keyof WidgetConfiguration,
  config: any
): UserAction {
  return {
    type: 'UPDATE_CONFIGURATION',
    targetId: widgetId,
    data: { section, config }
  }
}

/**
 * 创建设置运行时数据操作
 */
export function createSetRuntimeDataAction(widgetId: string, data: any): UserAction {
  return {
    type: 'SET_RUNTIME_DATA',
    targetId: widgetId,
    data
  }
}
