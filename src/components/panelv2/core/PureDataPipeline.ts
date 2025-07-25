// 第一层：纯净编辑器底座 - 数据传递管道
// 职责：数据总线和事件总线，不涉及业务逻辑处理

import { ref, reactive, watch, type Ref } from 'vue'

/**
 * PanelV2数据结构 - 符合架构文档定义
 */
export interface PanelV2Data {
  // 看板元信息
  meta: {
    id: string
    name: string
    version: '2.0'
    createdAt: string
    updatedAt: string
    description?: string
    tags?: string[]
    // 当前使用的渲染引擎
    renderEngine: 'gridstack' | string // 预留扩展
    // V1兼容标识
    migratedFromV1?: boolean
  }

  // 看板级配置（全局设置）
  config: PanelConfig

  // 节点数据集合
  nodes: NodeData[]

  // 运行时状态（不持久化，仅内存）
  runtime: {
    selectedNodeIds: string[]
    viewMode: 'edit' | 'preview' | 'fullscreen'
    viewport: {
      zoom: number
      offsetX: number
      offsetY: number
    }
    clipboard?: NodeData[]
    isDirty: boolean // 是否有未保存的修改
    lastSaveTime?: number
  }

  // 扩展数据（插件使用）
  extensions?: Record<string, any>
}

/**
 * 节点数据结构
 */
export interface NodeData {
  // 基础标识
  id: string
  type: string // 对应ComponentDefinition的type
  name: string

  // 布局信息（由渲染引擎管理）
  layout: {
    x: number
    y: number
    w: number
    h: number
    minW?: number
    minH?: number
    maxW?: number
    maxH?: number
    locked?: boolean // 是否锁定位置
  }

  // 节点配置（分层设计）
  config: {
    // 基础配置（位置、可见性等）
    base: NodeBaseConfig
    // 交互配置（点击、悬停等）
    interaction: NodeInteractionConfig
    // 内容配置（组件特定的业务配置）
    content: NodeContentConfig
  }

  // 样式配置（响应主题）
  style: NodeStyleConfig

  // 数据绑定（可选）
  dataBind?: {
    source: string // 数据源标识
    fields: string[] // 绑定字段
    transform?: string // 数据变换函数
  }

  // 元数据
  meta: {
    createTime: number
    updateTime: number
    version: string
    tags?: string[]
  }
}

// 配置接口定义（从现有types引入）
export interface PanelConfig {
  layout: {
    gridColumns: number
    cellHeight: number | 'auto'
    margin: number
    padding: number
  }
  appearance: {
    backgroundColor: string
    backgroundImage?: string
    theme?: string
  }
  data: {
    globalDataSource: string
    sharedVariables: string
    apiConfig?: {
      baseUrl?: string
      headers?: Record<string, string>
      timeout?: number
    }
  }
  interaction: {
    allowDrag: boolean
    allowResize: boolean
    allowEdit: boolean
    allowDelete: boolean
  }
  meta: {
    title: string
    description?: string
    version: string
    createTime?: string
    updateTime?: string
  }
}

export interface NodeBaseConfig {
  layout: any
  state: {
    locked: boolean
    hidden: boolean
    disabled: boolean
    zIndex?: number
  }
  appearance: {
    className?: string
    border?: any
    shadow?: any
    opacity?: number
  }
}

export interface NodeInteractionConfig {
  onClick?: any
  onDoubleClick?: any
  onHover?: any
  animation?: any
  dataLink?: any
}

export interface NodeContentConfig {
  [key: string]: any
}

export interface NodeStyleConfig {
  [key: string]: any
}

/**
 * 纯净数据传递管道接口
 */
export interface PureDataPipeline {
  // 唯一数据源
  state: Ref<PanelV2Data>

  // 纯净事件总线（不涉及业务逻辑）
  events: {
    emit(event: string, payload: any): void
    on(event: string, handler: (payload: any) => void): void
    off(event: string, handler: (...args: any[]) => void): void
    once(event: string, handler: (payload: any) => void): void
  }

  // 基础数据操作（只传递，不处理）
  operations: {
    // 看板级操作
    updatePanel(update: Partial<PanelV2Data>): void
    // 节点级操作
    addNode(node: NodeData): void
    updateNode(id: string, update: Partial<NodeData>): void
    removeNode(id: string): void
    // 选择操作
    selectNodes(ids: string[]): void
    clearSelection(): void
  }

  // 数据变更监听（纯通知，不处理）
  watchers: {
    onPanelChange: (newPanel: PanelV2Data, oldPanel: PanelV2Data) => void
    onNodeChange: (nodeId: string, newNode: NodeData, oldNode: NodeData) => void
    onSelectionChange: (selectedIds: string[]) => void
  }

  // 数据持久化接口（委托给外部）
  persistence: {
    save?: (data: PanelV2Data) => Promise<void>
    load?: (id: string) => Promise<PanelV2Data>
    autosave?: boolean
  }
}

/**
 * 数据管道实现
 */
export class DataPipeline implements PureDataPipeline {
  // 核心数据状态
  public state: Ref<PanelV2Data>

  // 事件监听器映射
  private eventListeners = new Map<string, Set<(...args: any[]) => void>>()

  // 数据变更回调
  private panelChangeCallbacks = new Set<(newPanel: PanelV2Data, oldPanel: PanelV2Data) => void>()
  private nodeChangeCallbacks = new Set<(nodeId: string, newNode: NodeData, oldNode: NodeData) => void>()
  private selectionChangeCallbacks = new Set<(selectedIds: string[]) => void>()

  // 持久化配置
  public persistence: {
    save?: (data: PanelV2Data) => Promise<void>
    load?: (id: string) => Promise<PanelV2Data>
    autosave: boolean
  } = {
    autosave: false
  }

  constructor(initialData?: Partial<PanelV2Data>) {
    // 初始化默认数据
    const defaultData: PanelV2Data = {
      meta: {
        id: `panel_${Date.now()}`,
        name: '新建看板',
        version: '2.0',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        renderEngine: 'gridstack'
      },
      config: {
        layout: {
          gridColumns: 12,
          cellHeight: 'auto',
          margin: 8,
          padding: 16
        },
        appearance: {
          backgroundColor: '#f5f5f5',
          theme: 'default'
        },
        data: {
          globalDataSource: '{}',
          sharedVariables: '{}'
        },
        interaction: {
          allowDrag: true,
          allowResize: true,
          allowEdit: true,
          allowDelete: true
        },
        meta: {
          title: '新建看板',
          version: '2.0'
        }
      },
      nodes: [],
      runtime: {
        selectedNodeIds: [],
        viewMode: 'edit',
        viewport: {
          zoom: 1,
          offsetX: 0,
          offsetY: 0
        },
        isDirty: false
      }
    }

    this.state = ref({ ...defaultData, ...initialData })
    this.initializeWatchers()
  }

  /**
   * 初始化数据监听器
   */
  private initializeWatchers() {
    // 监听整体面板变化
    let oldPanel = { ...this.state.value }
    watch(
      this.state,
      newPanel => {
        // 通知面板变化监听器
        this.panelChangeCallbacks.forEach(callback => {
          callback(newPanel, oldPanel)
        })

        // 标记为脏数据
        if (newPanel.runtime.isDirty !== true) {
          newPanel.runtime.isDirty = true
          newPanel.meta.updatedAt = new Date().toISOString()
        }

        // 触发自动保存
        if (this.persistence.autosave && this.persistence.save) {
          this.persistence.save(newPanel).catch(console.error)
        }

        oldPanel = { ...newPanel }
      },
      { deep: true }
    )

    // 监听选择变化
    watch(
      () => this.state.value.runtime.selectedNodeIds,
      selectedIds => {
        this.selectionChangeCallbacks.forEach(callback => {
          callback([...selectedIds])
        })
        this.events.emit('selection-changed', selectedIds)
      }
    )
  }

  /**
   * 事件总线实现
   */
  public events = {
    emit: (event: string, payload: any) => {
      const listeners = this.eventListeners.get(event)
      if (listeners) {
        listeners.forEach(listener => {
          try {
            listener(payload)
          } catch (error) {
            console.error(`Error in event listener for ${event}:`, error)
          }
        })
      }
    },

    on: (event: string, handler: (payload: any) => void) => {
      if (!this.eventListeners.has(event)) {
        this.eventListeners.set(event, new Set())
      }
      this.eventListeners.get(event)!.add(handler)
    },

    off: (event: string, handler: (...args: any[]) => void) => {
      const listeners = this.eventListeners.get(event)
      if (listeners) {
        listeners.delete(handler)
      }
    },

    once: (event: string, handler: (payload: any) => void) => {
      const wrappedHandler = (payload: any) => {
        handler(payload)
        this.events.off(event, wrappedHandler)
      }
      this.events.on(event, wrappedHandler)
    }
  }

  /**
   * 基础数据操作
   */
  public operations = {
    // 更新面板
    updatePanel: (update: Partial<PanelV2Data>) => {
      Object.assign(this.state.value, update)
      this.events.emit('panel-updated', update)
    },

    // 添加节点
    addNode: (node: NodeData) => {
      const newNode = {
        ...node,
        meta: {
          ...node.meta,
          createTime: Date.now(),
          updateTime: Date.now()
        }
      }
      this.state.value.nodes.push(newNode)
      this.events.emit('node-added', newNode)
    },

    // 更新节点
    updateNode: (id: string, update: Partial<NodeData>) => {
      const nodeIndex = this.state.value.nodes.findIndex(n => n.id === id)
      if (nodeIndex !== -1) {
        const oldNode = { ...this.state.value.nodes[nodeIndex] }
        const updatedNode = {
          ...oldNode,
          ...update,
          meta: {
            ...oldNode.meta,
            updateTime: Date.now()
          }
        }
        this.state.value.nodes[nodeIndex] = updatedNode

        // 通知节点变化监听器
        this.nodeChangeCallbacks.forEach(callback => {
          callback(id, updatedNode, oldNode)
        })
        this.events.emit('node-updated', { id, node: updatedNode, oldNode })
      }
    },

    // 移除节点
    removeNode: (id: string) => {
      const nodeIndex = this.state.value.nodes.findIndex(n => n.id === id)
      if (nodeIndex !== -1) {
        const removedNode = this.state.value.nodes[nodeIndex]
        this.state.value.nodes.splice(nodeIndex, 1)

        // 如果被删除的节点被选中，清除选择
        const selectedIndex = this.state.value.runtime.selectedNodeIds.indexOf(id)
        if (selectedIndex !== -1) {
          this.state.value.runtime.selectedNodeIds.splice(selectedIndex, 1)
        }

        this.events.emit('node-removed', { id, node: removedNode })
      }
    },

    // 选择节点
    selectNodes: (ids: string[]) => {
      this.state.value.runtime.selectedNodeIds = [...ids]
    },

    // 清除选择
    clearSelection: () => {
      this.state.value.runtime.selectedNodeIds = []
    }
  }

  /**
   * 数据变更监听器
   */
  public watchers = {
    onPanelChange: (callback: (newPanel: PanelV2Data, oldPanel: PanelV2Data) => void) => {
      this.panelChangeCallbacks.add(callback)
      return () => this.panelChangeCallbacks.delete(callback)
    },

    onNodeChange: (callback: (nodeId: string, newNode: NodeData, oldNode: NodeData) => void) => {
      this.nodeChangeCallbacks.add(callback)
      return () => this.nodeChangeCallbacks.delete(callback)
    },

    onSelectionChange: (callback: (selectedIds: string[]) => void) => {
      this.selectionChangeCallbacks.add(callback)
      return () => this.selectionChangeCallbacks.delete(callback)
    }
  }

  /**
   * 获取节点
   */
  public getNode(id: string): NodeData | undefined {
    return this.state.value.nodes.find(n => n.id === id)
  }

  /**
   * 获取选中的节点
   */
  public getSelectedNodes(): NodeData[] {
    return this.state.value.runtime.selectedNodeIds.map(id => this.getNode(id)).filter(Boolean) as NodeData[]
  }

  /**
   * 设置持久化处理器
   */
  public setPersistenceHandlers(handlers: {
    save?: (data: PanelV2Data) => Promise<void>
    load?: (id: string) => Promise<PanelV2Data>
    autosave?: boolean
  }) {
    Object.assign(this.persistence, handlers)
  }

  /**
   * 手动保存
   */
  public async save(): Promise<void> {
    if (this.persistence.save) {
      await this.persistence.save(this.state.value)
      this.state.value.runtime.isDirty = false
      this.state.value.runtime.lastSaveTime = Date.now()
      this.events.emit('panel-saved', this.state.value)
    }
  }

  /**
   * 加载数据
   */
  public async load(id: string): Promise<void> {
    if (this.persistence.load) {
      const data = await this.persistence.load(id)
      this.state.value = data
      this.events.emit('panel-loaded', data)
    }
  }

  /**
   * 清理资源
   */
  public destroy() {
    this.eventListeners.clear()
    this.panelChangeCallbacks.clear()
    this.nodeChangeCallbacks.clear()
    this.selectionChangeCallbacks.clear()
  }
}

/**
 * 创建数据管道实例
 */
export function createDataPipeline(initialData?: Partial<PanelV2Data>): DataPipeline {
  return new DataPipeline(initialData)
}
