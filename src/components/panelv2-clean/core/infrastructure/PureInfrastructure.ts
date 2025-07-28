/**
 * @file 纯净基础设施层主实现
 * @description 第一层的核心实现 - 纯粹的"架子"，整合所有基础设施组件
 * 
 * 职责边界说明：
 * ✅ 负责：布局框架组装、数据管道连接、事件总线设置、生命周期管理
 * ❌ 不负责：具体工具逻辑、业务规则、UI样式、数据处理算法
 * 
 * 设计原则：
 * 1. 纯净性 - 不包含任何第二层业务逻辑
 * 2. 可配置 - 所有具体配置由外部提供
 * 3. 可扩展 - 通过插件机制支持功能扩展
 * 4. 标准化 - 提供统一的接口协议
 */

import { reactive, ref } from 'vue'
import { PureLayoutManager } from './PureLayoutManager'
import { PureDataPipeline } from './PureDataPipeline_New'
import { LifecycleManager } from './LifecycleManager'
import { EventBus } from './EventBus'
import { PureImportExportPorter } from './PureImportExportPorter'
import type {
  PureInfrastructure as IPureInfrastructure,
  LayoutManager,
  DataPipeline,
  ImportExportPorter,
  ExtensionPointManager,
  Renderer,
  ToolProvider,
  DataProcessor,
  LayoutConfig
} from './interfaces/PureInfrastructure'

/**
 * 扩展点管理器实现
 */
class PureExtensionPointManager implements ExtensionPointManager {
  /** 渲染引擎注册表 */
  private renderers = new Map<string, Renderer>()
  
  /** 工具提供者注册表 */
  private toolProviders = new Map<string, ToolProvider>()
  
  /** 数据处理器注册表 */
  private dataProcessors = new Map<string, DataProcessor>()

  /**
   * 注册渲染引擎
   */
  registerRenderer(type: string, renderer: Renderer): void {
    console.log('PureExtensionPointManager: 注册渲染引擎', type)
    this.renderers.set(type, renderer)
  }

  /**
   * 注册工具提供者
   */
  registerToolProvider(category: string, provider: ToolProvider): void {
    console.log('PureExtensionPointManager: 注册工具提供者', category)
    this.toolProviders.set(category, provider)
  }

  /**
   * 注册数据处理器
   */
  registerDataProcessor(type: string, processor: DataProcessor): void {
    console.log('PureExtensionPointManager: 注册数据处理器', type)
    this.dataProcessors.set(type, processor)
  }

  /**
   * 获取已注册的扩展
   */
  getExtensions(type: string): any[] {
    switch (type) {
      case 'renderer':
        return Array.from(this.renderers.values())
      case 'tool':
        return Array.from(this.toolProviders.values())
      case 'processor':
        return Array.from(this.dataProcessors.values())
      default:
        console.warn(`PureExtensionPointManager: 未知扩展类型 ${type}`)
        return []
    }
  }

  /**
   * 卸载扩展
   */
  unregisterExtension(type: string, id: string): void {
    switch (type) {
      case 'renderer':
        this.renderers.delete(id)
        break
      case 'tool':
        this.toolProviders.delete(id)
        break
      case 'processor':
        this.dataProcessors.delete(id)
        break
      default:
        console.warn(`PureExtensionPointManager: 未知扩展类型 ${type}`)
    }
    console.log(`PureExtensionPointManager: 已卸载扩展 ${type}:${id}`)
  }

  /**
   * 获取渲染引擎
   */
  getRenderer(type: string): Renderer | undefined {
    return this.renderers.get(type)
  }

  /**
   * 获取工具提供者
   */
  getToolProvider(category: string): ToolProvider | undefined {
    return this.toolProviders.get(category)
  }

  /**
   * 获取数据处理器
   */
  getDataProcessor(type: string): DataProcessor | undefined {
    return this.dataProcessors.get(type)
  }
}

/**
 * 纯净基础设施层主实现
 * 纯净原则：仅提供基础设施能力，不包含业务逻辑
 */
export class PureInfrastructure implements IPureInfrastructure {
  /** 布局管理器 */
  public readonly layout: LayoutManager
  
  /** 数据管道 */
  public readonly pipeline: DataPipeline
  
  /** 生命周期管理器 */
  public readonly lifecycle: LifecycleManager
  
  /** 导入导出门户 */
  public readonly porter: ImportExportPorter
  
  /** 事件总线 */
  public readonly eventBus: EventBus
  
  /** 扩展点管理器 */
  public readonly extensions: ExtensionPointManager
  
  /** 初始化状态 */
  private initialized = ref(false)
  
  /** 基础设施统计 */
  private stats = reactive({
    layoutRegions: 0,
    dataFlows: 0,
    registeredExtensions: 0,
    lastActivity: Date.now()
  })

  constructor() {
    console.log('PureInfrastructure: 开始初始化纯净基础设施层')
    
    // 初始化各个子系统 - 纯净模式，不传入具体配置
    this.layout = new PureLayoutManager()
    this.pipeline = new PureDataPipeline()
    this.lifecycle = new LifecycleManager()
    this.eventBus = new EventBus()
    this.porter = new PureImportExportPorter()
    this.extensions = new PureExtensionPointManager()
    
    // 建立子系统间的连接
    this.setupInterConnections()
    
    console.log('PureInfrastructure: 纯净基础设施层初始化完成')
  }

  /**
   * 初始化基础设施
   * 纯净模式：布局配置由外部提供，基础设施只负责组装
   */
  async initialize(container: HTMLElement, layoutConfig?: LayoutConfig): Promise<void> {
    try {
      console.log('PureInfrastructure: 开始初始化基础设施')
      
      // 1. 初始化布局系统 - 使用外部提供的配置或默认最小配置
      const config = layoutConfig || this.getDefaultLayoutConfig()
      this.layout.initialize(container, config)
      
      // 2. 设置基础数据流（不包含具体业务逻辑）
      this.setupCoreDataFlows()
      
      // 3. 设置基础事件监听（不包含具体处理逻辑）
      this.setupCoreEventListeners()
      
      // 4. 触发初始化完成生命周期
      await this.lifecycle.trigger('INFRASTRUCTURE_READY', {
        targetId: 'pure-infrastructure',
        operation: 'initialize',
        payload: { container, config }
      })
      
      this.initialized.value = true
      this.updateStats()
      
      console.log('PureInfrastructure: 基础设施初始化完成')
      
    } catch (error) {
      console.error('PureInfrastructure: 初始化失败', error)
      throw error
    }
  }

  /**
   * 获取区域容器（对外接口）
   */
  getRegion(region: 'toolbar' | 'sidebar' | 'canvas' | 'inspector'): HTMLElement {
    return this.layout.getRegion(region)
  }

  /**
   * 注册区域渲染器
   */
  registerRegionRenderer(region: string, renderer: Renderer): void {
    console.log('PureInfrastructure: 注册区域渲染器', region)
    
    try {
      // 获取区域容器
      const container = this.layout.getRegion(region as any)
      
      // 注册渲染器
      this.extensions.registerRenderer(`region-${region}`, renderer)
      
      // 初始化渲染器
      renderer.render(container, null)
      
      this.updateStats()
      
    } catch (error) {
      console.error(`PureInfrastructure: 注册区域渲染器 ${region} 失败`, error)
    }
  }

  /**
   * 设置区域数据源
   */
  setupRegionDataSource(region: string, dataSource: any): void {
    console.log('PureInfrastructure: 设置区域数据源', region)
    
    // 注册数据源到管道
    this.pipeline.registerSource(`region-${region}`, dataSource)
    
    // 建立数据流到对应渲染器
    const renderer = this.extensions.getRenderer(`region-${region}`)
    if (renderer) {
      this.pipeline.registerTarget(`renderer-${region}`, {
        setData: async (data: any) => {
          renderer.update(data)
        }
      })
      
      this.pipeline.createDataFlow(`region-${region}`, `renderer-${region}`)
    }
  }

  /**
   * 获取基础设施统计
   */
  getStats(): any {
    return {
      ...this.stats,
      layout: this.layout instanceof PureLayoutManager ? 'PureLayoutManager' : 'Unknown',
      pipeline: this.pipeline.getStats ? this.pipeline.getStats() : {},
      lifecycle: this.lifecycle.getStats ? this.lifecycle.getStats() : {},
      initialized: this.initialized.value
    }
  }

  /**
   * 销毁基础设施
   */
  destroy(): void {
    console.log('PureInfrastructure: 开始销毁基础设施')
    
    // 销毁各个子系统
    if (this.layout && typeof this.layout.destroy === 'function') {
      this.layout.destroy()
    }
    
    if (this.pipeline && typeof this.pipeline.destroy === 'function') {
      this.pipeline.destroy()
    }
    
    if (this.extensions && typeof this.extensions.unregisterExtension === 'function') {
      // 清理所有注册的扩展
      console.log('PureInfrastructure: 清理扩展点')
    }
    
    this.initialized.value = false
    
    console.log('PureInfrastructure: 基础设施已销毁')
  }

  // ==================== 私有方法 ====================

  /**
   * 获取默认布局配置
   * 纯净模式：提供最小可工作配置，不包含业务偏好
   */
  private getDefaultLayoutConfig(): LayoutConfig {
    return {
      responsive: true,
      defaultSizes: {
        toolbar: { height: '60px' },
        sidebar: { width: '250px' },
        canvas: { width: 'auto', height: 'auto' },
        inspector: { width: '300px' }
      },
      minSizes: {
        sidebar: { minWidth: 200 },
        inspector: { minWidth: 250 }
      },
      collapsible: ['sidebar', 'inspector']
    }
  }

  /**
   * 建立子系统间的连接
   * 纯净模式：只建立基础设施层面的连接，不包含业务逻辑
   */
  private setupInterConnections(): void {
    console.log('PureInfrastructure: 建立子系统间连接')
    
    // 将事件总线连接到数据管道 - 纯粹的数据流转发
    this.eventBus.on('data-change', (event) => {
      this.pipeline.pushChange(event)
    })
    
    // 建立基础设施层面的事件转发
    this.eventBus.on('infrastructure-event', (event) => {
      // 纯净转发，不处理具体业务
      console.log('PureInfrastructure: 基础设施事件', event)
    })
    
    console.log('PureInfrastructure: 子系统连接完成')
  }

  /**
   * 设置核心数据流
   * 纯净模式：只设置基础设施自身状态的数据流
   */
  private setupCoreDataFlows(): void {
    console.log('PureInfrastructure: 设置核心数据流')
    
    // 设置布局状态数据流
    this.pipeline.registerSource('layout-state', {
      getData: async () => {
        return this.layout.saveLayout()
      }
    })
    
    // 设置基础设施统计数据流
    this.pipeline.registerSource('infrastructure-stats', {
      getData: async () => {
        return this.getStats()
      }
    })
  }

  /**
   * 设置核心事件监听
   * 纯净模式：只监听基础设施层面的事件
   */
  private setupCoreEventListeners(): void {
    console.log('PureInfrastructure: 设置核心事件监听')
    
    // 监听数据变更以更新统计
    this.pipeline.onDataChange((event) => {
      this.stats.lastActivity = Date.now()
      this.updateStats()
    })
    
    // 监听生命周期事件（纯净记录）
    this.lifecycle.registerHook('*', (context) => {
      console.log('PureInfrastructure: 生命周期事件', context.phase, context.targetId)
    })
  }

  /**
   * 更新统计信息
   * 纯净模式：只统计基础设施自身的指标
   */
  private updateStats(): void {
    this.stats.layoutRegions = 4 // 固定的四区域布局
    this.stats.dataFlows = this.pipeline.getActiveDataFlows ? this.pipeline.getActiveDataFlows().length : 0
    this.stats.registeredExtensions = this.extensions.getExtensions('renderer').length + 
                                     this.extensions.getExtensions('tool').length + 
                                     this.extensions.getExtensions('processor').length
    this.stats.lastActivity = Date.now()
  }
}

/**
 * 创建纯净基础设施实例
 */
export const createPureInfrastructure = (): PureInfrastructure => {
  return new PureInfrastructure()
}

/**
 * 全局纯净基础设施实例（延迟初始化）
 */
let _globalPureInfrastructure: PureInfrastructure | null = null

export const globalPureInfrastructure = new Proxy({} as PureInfrastructure, {
  get(target, prop) {
    if (!_globalPureInfrastructure) {
      console.log('globalPureInfrastructure Proxy: 延迟初始化')
      _globalPureInfrastructure = createPureInfrastructure()
    }
    return _globalPureInfrastructure[prop as keyof PureInfrastructure]
  }
})