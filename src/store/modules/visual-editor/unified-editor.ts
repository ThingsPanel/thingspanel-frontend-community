/**
 * 统一的 Visual Editor 状态管理
 * 解决双重状态存储问题，提供唯一数据源
 */

import { defineStore } from 'pinia'
import type {
  GraphData,
  EditorMode,
  WidgetDefinition,
  WidgetConfiguration,
  ComponentDefinition,
  ReactiveDataBinding
} from '@/components/visual-editor/types'

export interface UnifiedEditorState {
  // 编辑器核心状态
  nodes: GraphData[]
  viewport: {
    x: number
    y: number
    zoom: number
  }
  mode: EditorMode
  selectedIds: string[]

  // 组件注册状态
  widgets: Map<string, WidgetDefinition>

  // 配置管理状态 - 分层存储
  baseConfigs: Map<string, BaseConfiguration>
  componentConfigs: Map<string, ComponentConfiguration>
  dataSourceConfigs: Map<string, DataSourceConfiguration>
  interactionConfigs: Map<string, InteractionConfiguration>

  // Card 2.1 集成状态
  card2Components: Map<string, ComponentDefinition>
  dataBindings: Map<string, ReactiveDataBinding>

  // 运行时数据
  runtimeData: Map<string, any>

  // 系统状态
  isLoading: boolean
  isDirty: boolean
  lastSaved: Date | null
}

// 基础配置接口
export interface BaseConfiguration {
  title?: string
  opacity?: number
  visible?: boolean
  locked?: boolean
  zIndex?: number
}

// 组件配置接口
export interface ComponentConfiguration {
  properties: Record<string, any>
  style?: Record<string, any>
  events?: Record<string, any>
}

// 数据源配置接口
export interface DataSourceConfiguration {
  type: 'static' | 'api' | 'websocket' | 'device' | 'script'
  config: Record<string, any>
  bindings: Record<string, any>
  metadata?: Record<string, any>
}

// 交互配置接口
export interface InteractionConfiguration {
  click?: any
  hover?: any
  focus?: any
  custom?: Record<string, any>
}

/**
 * 统一的 Visual Editor Store
 * 🔥 这是唯一的状态管理中心，替代所有分散的状态存储
 */
export const useUnifiedEditorStore = defineStore('unified-visual-editor', {
  state: (): UnifiedEditorState => ({
    // 编辑器状态
    nodes: [],
    viewport: { x: 0, y: 0, zoom: 1 },
    mode: 'design',
    selectedIds: [],

    // 组件状态
    widgets: new Map(),

    // 配置状态 - 分层管理
    baseConfigs: new Map(),
    componentConfigs: new Map(),
    dataSourceConfigs: new Map(),
    interactionConfigs: new Map(),

    // Card 2.1 状态
    card2Components: new Map(),
    dataBindings: new Map(),

    // 运行时状态
    runtimeData: new Map(),

    // 系统状态
    isLoading: false,
    isDirty: false,
    lastSaved: null
  }),

  getters: {
    /**
     * 获取选中的节点
     */
    selectedNodes(state): GraphData[] {
      return state.nodes.filter(node => state.selectedIds.includes(node.id))
    },

    /**
     * 获取完整的组件配置
     * 🔥 关键：统一的配置访问点
     */
    getFullConfiguration:
      state =>
      (widgetId: string): WidgetConfiguration => {
        return {
          base: state.baseConfigs.get(widgetId) || createDefaultBaseConfig(),
          component: state.componentConfigs.get(widgetId) || createDefaultComponentConfig(),
          dataSource: state.dataSourceConfigs.get(widgetId) || null,
          interaction: state.interactionConfigs.get(widgetId) || createDefaultInteractionConfig(),
          metadata: generateConfigurationMetadata(widgetId, state)
        }
      },

    /**
     * 获取组件的运行时数据
     */
    getRuntimeData: state => (widgetId: string) => {
      return state.runtimeData.get(widgetId)
    },

    /**
     * 检查组件是否有未保存的更改
     */
    hasUnsavedChanges(state): boolean {
      return state.isDirty
    },

    /**
     * 获取所有已注册的组件
     */
    allWidgets(state): WidgetDefinition[] {
      return Array.from(state.widgets.values())
    },

    /**
     * 获取Card2.1组件数量
     */
    card2ComponentCount(state): number {
      return state.card2Components.size
    }
  },

  actions: {
    // ==================== 节点操作 ====================

    /**
     * 添加节点到画布
     */
    addNode(node: GraphData): void {

      this.nodes.push(node)
      this.markDirty()

      // 初始化节点的基础配置
      if (!this.baseConfigs.has(node.id)) {
        this.baseConfigs.set(node.id, createDefaultBaseConfig())
      }
    },

    /**
     * 更新节点信息
     */
    updateNode(id: string, updates: Partial<GraphData>): void {
      const nodeIndex = this.nodes.findIndex(node => node.id === id)
      if (nodeIndex !== -1) {
        this.nodes[nodeIndex] = { ...this.nodes[nodeIndex], ...updates }
        this.markDirty()

      }
    },

    /**
     * 删除节点及其所有配置
     */
    removeNode(id: string): void {

      // 移除节点
      this.nodes = this.nodes.filter(node => node.id !== id)

      // 清理所有相关配置
      this.baseConfigs.delete(id)
      this.componentConfigs.delete(id)
      this.dataSourceConfigs.delete(id)
      this.interactionConfigs.delete(id)
      this.runtimeData.delete(id)

      // 清理选中状态
      this.selectedIds = this.selectedIds.filter(selectedId => selectedId !== id)

      this.markDirty()
    },

    /**
     * 选中节点
     */
    selectNodes(ids: string[]): void {
      this.selectedIds = [...ids]
    },

    // ==================== 配置操作 ====================

    /**
     * 设置基础配置
     */
    setBaseConfiguration(widgetId: string, config: BaseConfiguration): void {
      this.baseConfigs.set(widgetId, { ...config })
      this.markDirty()

    },

    /**
     * 设置组件配置
     */
    setComponentConfiguration(widgetId: string, config: ComponentConfiguration): void {
      this.componentConfigs.set(widgetId, { ...config })
      this.markDirty()
    },

    /**
     * 设置数据源配置
     * 🔥 关键：统一的数据源配置管理
     */
    setDataSourceConfiguration(widgetId: string, config: DataSourceConfiguration): void {
      this.dataSourceConfigs.set(widgetId, { ...config })
      this.markDirty()

      // 触发数据绑定更新
      this.updateDataBinding(widgetId)
    },

    /**
     * 设置交互配置
     */
    setInteractionConfiguration(widgetId: string, config: InteractionConfiguration): void {
      this.interactionConfigs.set(widgetId, { ...config })
      this.markDirty()
    },

    /**
     * 更新运行时数据
     */
    setRuntimeData(widgetId: string, data: any): void {
      this.runtimeData.set(widgetId, data)
    },

    // ==================== 组件注册 ====================

    /**
     * 注册组件定义
     */
    registerWidget(definition: WidgetDefinition): void {
      this.widgets.set(definition.type, definition)
    },

    /**
     * 批量注册组件
     */
    registerWidgets(definitions: WidgetDefinition[]): void {
      definitions.forEach(def => this.registerWidget(def))
    },

    // ==================== Card 2.1 集成 ====================

    /**
     * 注册Card2.1组件
     */
    registerCard2Component(definition: ComponentDefinition): void {
      this.card2Components.set(definition.type, definition)
    },

    /**
     * 创建数据绑定
     */
    createDataBinding(widgetId: string, binding: ReactiveDataBinding): void {
      this.dataBindings.set(widgetId, binding)
    },

    /**
     * 更新数据绑定
     */
    updateDataBinding(widgetId: string): void {
      const dataSourceConfig = this.dataSourceConfigs.get(widgetId)
      if (!dataSourceConfig) return
      // TODO: 集成Card2.1数据绑定系统
      // 这里将与Card2.1的数据绑定系统集成
    },

    // ==================== 系统操作 ====================

    /**
     * 标记为脏状态
     */
    markDirty(): void {
      this.isDirty = true
    },

    /**
     * 标记为已保存
     */
    markSaved(): void {
      this.isDirty = false
      this.lastSaved = new Date()
    },

    /**
     * 设置加载状态
     */
    setLoading(loading: boolean): void {
      this.isLoading = loading
    },

    // ==================== 视图操作 ====================

    /**
     * 更新视图端口
     */
    updateViewport(viewport: { x?: number; y?: number; zoom?: number }): void {
      this.viewport = { ...this.viewport, ...viewport }
    },

    /**
     * 设置编辑器模式
     */
    setMode(mode: EditorMode): void {
      this.mode = mode
    },

    /**
     * 重置视图端口
     */
    resetViewport(): void {
      this.viewport = { x: 0, y: 0, zoom: 1 }
    },

    /**
     * 清理所有状态
     */
    clearAll(): void {

      this.nodes = []
      this.selectedIds = []
      this.viewport = { x: 0, y: 0, zoom: 1 }
      this.mode = 'design'
      this.widgets.clear()
      this.baseConfigs.clear()
      this.componentConfigs.clear()
      this.dataSourceConfigs.clear()
      this.interactionConfigs.clear()
      this.card2Components.clear()
      this.dataBindings.clear()
      this.runtimeData.clear()
      this.isDirty = false
      this.lastSaved = null
    }
  }
})

// ==================== 辅助函数 ====================

/**
 * 创建默认基础配置
 */
function createDefaultBaseConfig(): BaseConfiguration {
  return {
    title: '',
    opacity: 1,
    visible: true,
    locked: false,
    zIndex: 1
  }
}

/**
 * 创建默认组件配置
 */
function createDefaultComponentConfig(): ComponentConfiguration {
  return {
    properties: {},
    style: {},
    events: {}
  }
}

/**
 * 创建默认交互配置
 */
function createDefaultInteractionConfig(): InteractionConfiguration {
  return {
    click: null,
    hover: null,
    focus: null,
    custom: {}
  }
}

/**
 * 生成配置元数据
 */
function generateConfigurationMetadata(widgetId: string, state: UnifiedEditorState): Record<string, any> {
  return {
    id: widgetId,
    createdAt: new Date().toISOString(),
    lastModified: new Date().toISOString(),
    version: '1.0.0',
    hasDataBinding: state.dataBindings.has(widgetId),
    hasRuntimeData: state.runtimeData.has(widgetId),
    configurationSections: {
      base: state.baseConfigs.has(widgetId),
      component: state.componentConfigs.has(widgetId),
      dataSource: state.dataSourceConfigs.has(widgetId),
      interaction: state.interactionConfigs.has(widgetId)
    }
  }
}
