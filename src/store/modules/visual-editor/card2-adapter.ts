/**
 * Card 2.1 Visual Editor 适配器
 * 统一Card2.1系统与Visual Editor的集成，解决集成复杂性问题
 */

import { useUnifiedEditorStore } from '@/store/modules/visual-editor/unified-editor'
import { useDataFlowManager } from '@/store/modules/visual-editor/data-flow-manager'
import type {
  WidgetDefinition,
  DataSourceConfiguration,
  ComponentConfiguration
} from '@/store/modules/visual-editor/unified-editor'

// Card 2.1 相关类型定义
export interface ComponentDefinition {
  type: string
  name: string
  description: string
  version: string
  component: any
  category: string
  mainCategory: string
  subCategory: string
  icon: string
  author: string
  permission: string
  tags?: string[]
  dataSources?: DataSourceDefinition[]
  config?: ComponentConfig
}

export interface DataSourceDefinition {
  key: string
  name: string
  description: string
  supportedTypes: string[]
  required: boolean
  fieldMappings?: Record<string, FieldMapping>
}

export interface FieldMapping {
  targetField: string
  type: string
  required: boolean
  description: string
  defaultValue?: any
}

export interface ComponentConfig {
  width?: number
  height?: number
  style?: Record<string, any>
  properties?: Record<string, any>
}

export interface ReactiveDataBinding {
  id: string
  componentId: string
  requirement: ComponentRequirement
  isActive: boolean
  lastUpdate: Date
}

export interface ComponentRequirement {
  [key: string]: any
}

/**
 * Card 2.1 适配器类
 * 🔥 统一Card2.1与Visual Editor的集成，消除复杂的转换逻辑
 */
export class Card2VisualEditorAdapter {
  private editorStore = useUnifiedEditorStore()
  private dataFlowManager = useDataFlowManager()
  private card2System: any = null // Card 2.1 系统实例

  constructor() {
    this.initializeCard2Integration()
  }

  // ==================== Card 2.1 系统集成 ====================

  /**
   * 初始化Card2.1集成
   */
  private async initializeCard2Integration(): Promise<void> {
    try {
      // 动态加载Card2.1系统（避免循环依赖）
      const { useComponentTree } = await import('@/card2.1/hooks')
      this.card2System = useComponentTree({ autoInit: false }) // 设置为false，手动控制初始化

      // 立即初始化
      await this.card2System.initialize()
    } catch (error) {}
  }

  /**
   * 注册Card2.1组件到Visual Editor
   */
  registerCard2Component(definition: ComponentDefinition): void {
    // 1. 转换为Visual Editor格式
    const widgetDefinition = this.adaptComponentDefinition(definition)

    // 2. 注册到统一存储
    this.editorStore.registerWidget(widgetDefinition)
    this.editorStore.registerCard2Component(definition)
  }

  /**
   * 批量注册Card2.1组件
   */
  registerCard2Components(definitions: ComponentDefinition[]): void {
    definitions.forEach(def => this.registerCard2Component(def))
  }

  // ==================== 组件定义转换 ====================

  /**
   * 转换Card2.1组件定义为Visual Editor格式
   * 🔥 统一的组件定义转换逻辑
   */
  private adaptComponentDefinition(card2Def: ComponentDefinition): WidgetDefinition {
    return {
      type: card2Def.type,
      name: card2Def.name,
      description: card2Def.description,
      version: card2Def.version,
      component: card2Def.component,

      // 分类信息
      category: card2Def.category,
      mainCategory: card2Def.mainCategory,
      subCategory: card2Def.subCategory,
      icon: card2Def.icon,

      // 作者和权限
      author: card2Def.author,
      permission: card2Def.permission,
      tags: card2Def.tags || [],

      // 标准化的默认布局
      defaultLayout: this.createStandardLayout(card2Def),

      // 标准化的属性配置
      defaultProperties: this.extractDefaultProperties(card2Def),

      // 数据源配置
      dataSources: this.adaptDataSources(card2Def.dataSources || []),

      // 适配器元数据
      metadata: {
        source: 'card2',
        adapter: 'Card2VisualEditorAdapter',
        adapterVersion: '1.0.0',
        originalDefinition: card2Def,
        isCard2Component: true,
        hasDataSources: (card2Def.dataSources?.length || 0) > 0,
        createdAt: new Date().toISOString()
      }
    }
  }

  /**
   * 创建标准化的默认布局
   */
  private createStandardLayout(card2Def: ComponentDefinition): Record<string, any> {
    const config = card2Def.config || {}
    const defaultWidth = config.width || 300
    const defaultHeight = config.height || 200

    return {
      canvas: {
        width: defaultWidth,
        height: defaultHeight,
        x: 0,
        y: 0
      },
      gridstack: {
        w: Math.ceil(defaultWidth / 150), // 转换为网格单位
        h: Math.ceil(defaultHeight / 150),
        x: 0,
        y: 0,
        minW: 1,
        minH: 1
      },
      gridLayoutPlus: {
        w: Math.ceil(defaultWidth / 100),
        h: Math.ceil(defaultHeight / 100),
        x: 0,
        y: 0
      }
    }
  }

  /**
   * 提取默认属性配置
   */
  private extractDefaultProperties(card2Def: ComponentDefinition): ComponentConfiguration {
    const config = card2Def.config || {}

    return {
      properties: config.properties || {},
      style: {
        width: config.width || 300,
        height: config.height || 200,
        ...config.style
      },
      events: {}
    }
  }

  /**
   * 适配数据源定义
   */
  private adaptDataSources(dataSources: DataSourceDefinition[]): DataSourceDefinition[] {
    return dataSources.map(ds => ({
      ...ds,
      // 确保数据源配置的完整性
      supportedTypes: ds.supportedTypes.length > 0 ? ds.supportedTypes : ['static'],
      fieldMappings: ds.fieldMappings || {}
    }))
  }

  // ==================== 数据绑定集成 ====================

  /**
   * 创建Card2.1数据绑定
   * 🔥 统一的数据绑定创建逻辑
   */
  async createDataBinding(
    widgetId: string,
    dataSourceConfig: DataSourceConfiguration
  ): Promise<ReactiveDataBinding | null> {
    if (!this.card2System) {
      return null
    }

    try {
      // 1. 获取组件定义
      const card2Definition = this.editorStore.card2Components.get(widgetId)
      if (!card2Definition) {
        return null
      }

      // 2. 创建组件需求
      const requirement = this.createComponentRequirement(card2Definition, dataSourceConfig)

      // 3. 注册到需求管理器（如果可用）
      // 注意：使用实际可用的API
      // 4. 创建数据绑定
      const binding: ReactiveDataBinding = {
        id: `${widgetId}_binding`,
        componentId: widgetId,
        requirement,
        isActive: true,
        lastUpdate: new Date()
      }

      // 5. 存储到统一状态
      this.editorStore.createDataBinding(widgetId, binding)
      return binding
    } catch (error) {
      return null
    }
  }

  /**
   * 更新Card2.1数据绑定
   */
  async updateDataBinding(widgetId: string, dataSourceConfig: DataSourceConfiguration): Promise<void> {
    // 删除旧的绑定
    this.destroyDataBinding(widgetId)

    // 创建新的绑定
    await this.createDataBinding(widgetId, dataSourceConfig)
  }

  /**
   * 销毁Card2.1数据绑定
   */
  destroyDataBinding(widgetId: string): void {
    // 从统一状态删除
    this.editorStore.dataBindings.delete(widgetId)
  }

  /**
   * 创建组件需求定义
   */
  private createComponentRequirement(
    card2Definition: ComponentDefinition,
    dataSourceConfig: DataSourceConfiguration
  ): ComponentRequirement {
    const requirement: ComponentRequirement = {}

    // 根据组件的数据源定义创建需求
    if (card2Definition.dataSources) {
      card2Definition.dataSources.forEach(ds => {
        // 检查是否有对应的数据源配置
        const configBinding = dataSourceConfig.bindings?.[ds.key]
        if (configBinding) {
          requirement[ds.key] = {
            type: 'object', // 简化类型处理
            required: ds.required,
            description: ds.description,
            mapping: ds.fieldMappings || {},
            defaultValue: this.extractDefaultValue(ds),
            config: configBinding
          }
        }
      })
    }

    return requirement
  }

  /**
   * 提取默认值
   */
  private extractDefaultValue(dataSource: DataSourceDefinition): any {
    if (dataSource.fieldMappings) {
      const firstMapping = Object.values(dataSource.fieldMappings)[0]
      return firstMapping?.defaultValue || null
    }
    return null
  }

  // ==================== 运行时数据处理 ====================

  /**
   * 处理Card2.1组件的运行时数据更新
   */
  handleRuntimeDataUpdate(widgetId: string, data: any): void {
    // 通过数据流管理器更新运行时数据
    this.dataFlowManager.handleUserAction({
      type: 'SET_RUNTIME_DATA',
      targetId: widgetId,
      data
    })
  }

  /**
   * 获取Card2.1组件的当前数据
   */
  getComponentCurrentData(widgetId: string): any {
    const runtimeData = this.editorStore.getRuntimeData(widgetId)

    return runtimeData
  }

  // ==================== 生命周期管理 ====================

  /**
   * 组件添加到画布时的处理
   */
  onComponentAdded(widgetId: string, componentType: string): void {
    // 检查是否是Card2.1组件
    const card2Definition = this.editorStore.card2Components.get(componentType)
    if (card2Definition) {
      // 初始化Card2.1组件的默认配置
      this.initializeCard2ComponentConfig(widgetId, card2Definition)
    }
  }

  /**
   * 组件从画布移除时的处理
   */
  onComponentRemoved(widgetId: string): void {
    // 清理Card2.1相关资源
    this.destroyDataBinding(widgetId)
  }

  /**
   * 初始化Card2.1组件配置
   */
  private initializeCard2ComponentConfig(widgetId: string, card2Definition: ComponentDefinition): void {
    // 设置默认的组件配置
    const defaultConfig = this.extractDefaultProperties(card2Definition)
    this.editorStore.setComponentConfiguration(widgetId, defaultConfig)

    // 如果有数据源定义，创建默认的数据源配置
    if (card2Definition.dataSources && card2Definition.dataSources.length > 0) {
      const defaultDataSourceConfig: DataSourceConfiguration = {
        type: 'static',
        config: {},
        bindings: this.createDefaultBindings(card2Definition.dataSources)
      }

      this.editorStore.setDataSourceConfiguration(widgetId, defaultDataSourceConfig)
    }
  }

  /**
   * 创建默认的数据绑定
   */
  private createDefaultBindings(dataSources: DataSourceDefinition[]): Record<string, any> {
    const bindings: Record<string, any> = {}

    dataSources.forEach(ds => {
      if (ds.fieldMappings) {
        const firstMapping = Object.values(ds.fieldMappings)[0]
        if (firstMapping?.defaultValue !== undefined) {
          bindings[ds.key] = {
            rawData: JSON.stringify(firstMapping.defaultValue)
          }
        }
      }
    })

    return bindings
  }

  // ==================== 工具方法 ====================

  /**
   * 检查组件是否为Card2.1组件
   */
  isCard2Component(widgetId: string): boolean {
    return this.editorStore.card2Components.has(widgetId)
  }

  /**
   * 获取所有已注册的Card2.1组件
   */
  getAllCard2Components(): ComponentDefinition[] {
    return Array.from(this.editorStore.card2Components.values())
  }

  /**
   * 获取Card2.1组件数量
   */
  getCard2ComponentCount(): number {
    return this.editorStore.card2ComponentCount
  }

  /**
   * 确保Card2.1系统已初始化
   */
  private async ensureInitialized(): Promise<void> {
    if (this.card2System) {
      return // 已经初始化
    }
    // 等待一段时间让异步初始化完成
    let retries = 0
    const maxRetries = 50 // 最多等待5秒

    while (!this.card2System && retries < maxRetries) {
      await new Promise(resolve => setTimeout(resolve, 100))
      retries++
    }

    if (!this.card2System) {
      // 尝试重新初始化
      await this.initializeCard2Integration()
    }
  }

  /**
   * 获取Card2.1组件实例
   * 🔥 委托给Card2.1系统的getComponent方法
   */
  async getComponent(componentType: string): Promise<any> {
    // 等待初始化完成
    await this.ensureInitialized()

    if (!this.card2System) {
      return null
    }

    try {
      return this.card2System.getComponent(componentType)
    } catch (error) {
      return null
    }
  }

  /**
   * 获取Card2.1组件定义
   * 🔥 委托给Card2.1系统的getComponentDefinition方法
   */
  getComponentDefinition(componentType: string): any {
    if (!this.card2System) {
      return null
    }

    try {
      return this.card2System.getComponentDefinition(componentType)
    } catch (error) {
      return null
    }
  }

  /**
   * 获取Card2.1系统实例
   */
  getCard2System(): any {
    return this.card2System
  }
}

// ==================== 单例模式 ====================

let card2AdapterInstance: Card2VisualEditorAdapter | null = null

/**
 * 获取Card2.1适配器实例（单例）
 */
export function useCard2Adapter(): Card2VisualEditorAdapter {
  if (!card2AdapterInstance) {
    card2AdapterInstance = new Card2VisualEditorAdapter()
  }

  return card2AdapterInstance
}

/**
 * 重置Card2.1适配器实例（测试用）
 */
export function resetCard2Adapter(): void {
  card2AdapterInstance = null
}
