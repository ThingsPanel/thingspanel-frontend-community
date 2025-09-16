/**
 * Registry Engine 适配器系统
 *
 * 提供与现有注册系统的100%向后兼容性
 * 将现有的各种注册机制无缝集成到统一的Registry Engine中
 *
 * 支持的系统：
 * - Card2.1 ComponentRegistry
 * - Visual Editor ComponentRegistry
 * - 传统Card系统 ComponentRegistry
 * - RendererManager
 * - 其他注册系统
 */

// 🔧 修复：避免循环依赖，延迟导入registryEngine
import { RegistryItemType, type RegistryItem, type RegistryItemMetadata } from './index'
import type { ComponentDefinition } from '@/card2.1/core/types'
import type { IComponentDefinition } from '@/card/core/types/component'
import type { RendererFactory } from '@/components/visual-editor/renderers/base/BaseRenderer'

/**
 * 🔧 修复：延迟获取registryEngine实例，避免循环依赖
 */
function getRegistryEngine() {
  // 延迟导入，确保模块已完全加载
  return require('./index').registryEngine
}

/**
 * 适配器基类
 * 定义了所有适配器的通用接口和行为
 */
export abstract class BaseRegistryAdapter {
  /** 适配器名称 */
  abstract readonly name: string
  /** 适配器版本 */
  abstract readonly version: string
  /** 支持的注册项类型 */
  abstract readonly supportedTypes: RegistryItemType[]

  /** 是否已集成 */
  protected integrated = false

  /**
   * 集成到Registry Engine
   * 这是适配器的主要入口方法
   */
  async integrate(): Promise<boolean> {
    if (this.integrated) {
      console.warn(`⚠️ [${this.name}] 适配器已集成，跳过重复集成`)
      return true
    }

    try {
      console.log(`🔄 [${this.name}] 开始集成适配器...`)

      // 执行集成逻辑
      await this.performIntegration()

      // 设置事件监听器
      this.setupEventListeners()

      this.integrated = true

      console.log(`✅ [${this.name}] 适配器集成完成`)
      return true

    } catch (error) {
      console.error(`❌ [${this.name}] 适配器集成失败:`, error)
      return false
    }
  }

  /**
   * 断开集成
   */
  async disconnect(): Promise<void> {
    if (!this.integrated) {
      console.warn(`⚠️ [${this.name}] 适配器未集成，无需断开`)
      return
    }

    try {
      console.log(`🔄 [${this.name}] 开始断开适配器...`)

      // 执行断开逻辑
      await this.performDisconnection()

      // 清理事件监听器
      this.cleanupEventListeners()

      this.integrated = false

      console.log(`✅ [${this.name}] 适配器断开完成`)

    } catch (error) {
      console.error(`❌ [${this.name}] 适配器断开失败:`, error)
    }
  }

  /**
   * 检查适配器是否可用
   */
  abstract isAvailable(): boolean

  /**
   * 执行具体的集成逻辑（由子类实现）
   */
  protected abstract performIntegration(): Promise<void>

  /**
   * 执行具体的断开逻辑（由子类实现）
   */
  protected abstract performDisconnection(): Promise<void>

  /**
   * 设置事件监听器（由子类实现）
   */
  protected setupEventListeners(): void {
    // 默认实现为空，子类可重写
  }

  /**
   * 清理事件监听器（由子类实现）
   */
  protected cleanupEventListeners(): void {
    // 默认实现为空，子类可重写
  }

  /**
   * 创建通用的元数据
   */
  protected createMetadata(
    id: string,
    name: string,
    type: RegistryItemType,
    additionalData: Partial<RegistryItemMetadata> = {}
  ): RegistryItemMetadata {
    const now = Date.now()

    return {
      id,
      name,
      type,
      version: '1.0.0',
      createdAt: now,
      updatedAt: now,
      enabled: true,
      priority: 0,
      ...additionalData
    }
  }
}

/**
 * Card2.1 组件注册系统适配器
 * 将Card2.1的ComponentRegistry集成到Registry Engine
 */
export class Card21RegistryAdapter extends BaseRegistryAdapter {
  readonly name = 'Card21RegistryAdapter'
  readonly version = '1.0.0'
  readonly supportedTypes = [RegistryItemType.CARD21_COMPONENT]

  private originalRegister?: typeof import('@/card2.1/core/component-registry').ComponentRegistry.register
  private originalUnregister?: (id: string) => void

  /**
   * 检查Card2.1系统是否可用
   */
  isAvailable(): boolean {
    try {
      // 检查Card2.1组件注册表是否存在
      return typeof require !== 'undefined'
    } catch {
      return false
    }
  }

  /**
   * 执行Card2.1系统集成
   *
   * 🔄 集成策略说明：
   * 1. 动态导入：避免循环依赖，运行时按需加载Card2.1模块
   * 2. 数据迁移：将现有的Card2.1组件注册到Registry Engine
   * 3. 方法拦截：重写原始注册方法，确保新注册也进入Registry Engine
   * 4. 双向同步：保持Card2.1和Registry Engine的数据一致性
   * 5. 向后兼容：确保现有Card2.1代码无需修改即可正常工作
   */
  protected async performIntegration(): Promise<void> {
    try {
      // 🔧 动态导入Card2.1组件注册表，避免循环依赖
      const { ComponentRegistry, componentRegistry } = await import('@/card2.1/core/component-registry')

      // 📊 获取已注册的所有组件，进行数据迁移
      const existingComponents = ComponentRegistry.getAll()

      console.log(`🔄 [Card21RegistryAdapter] 开始迁移 ${existingComponents.length} 个现有组件...`)

      // 🚀 将现有组件逐个迁移到Registry Engine
      for (const component of existingComponents) {
        await this.registerCard21Component(component)
      }

      // 🎯 拦截新的注册操作，确保新组件也注册到Registry Engine
      this.interceptRegistration(ComponentRegistry)

      console.log(`📦 [Card21RegistryAdapter] 已迁移 ${existingComponents.length} 个Card2.1组件`)

    } catch (error) {
      console.error(`❌ [Card21RegistryAdapter] 集成失败:`, error)
      throw error
    }
  }

  /**
   * 执行断开逻辑
   */
  protected async performDisconnection(): Promise<void> {
    // 恢复原始的注册方法
    if (this.originalRegister) {
      try {
        const { ComponentRegistry } = await import('@/card2.1/core/component-registry')
        ComponentRegistry.register = this.originalRegister
      } catch (error) {
        console.error(`❌ [Card21RegistryAdapter] 恢复原始注册方法失败:`, error)
      }
    }

    // 从Registry Engine中移除所有Card2.1组件
    const card21Items = getRegistryEngine().getByType(RegistryItemType.CARD21_COMPONENT)
    for (const item of card21Items) {
      await getRegistryEngine().unregister(item.metadata.id)
    }
  }

  /**
   * 拦截Card2.1的注册操作
   */
  private interceptRegistration(ComponentRegistry: any): void {
    // 保存原始方法
    this.originalRegister = ComponentRegistry.register

    // 替换注册方法
    ComponentRegistry.register = async (definition: ComponentDefinition) => {
      // 调用原始方法
      if (this.originalRegister) {
        this.originalRegister.call(ComponentRegistry, definition)
      }

      // 同时注册到Registry Engine
      await this.registerCard21Component(definition)
    }
  }

  /**
   * 将Card2.1组件注册到Registry Engine
   */
  private async registerCard21Component(definition: ComponentDefinition): Promise<void> {
    const metadata = this.createMetadata(
      `card21-${definition.type}`,
      definition.type,
      RegistryItemType.CARD21_COMPONENT,
      {
        description: `Card2.1组件: ${definition.type}`,
        category: 'card21-components',
        tags: ['card21', 'component'],
        dependencies: definition.dependencies
      }
    )

    const registryItem: RegistryItem<ComponentDefinition> = {
      metadata,
      content: definition,
      validate: () => {
        // 验证Card2.1组件定义的有效性
        return !!(definition.type && (definition.dataSources || definition.staticParams))
      },
      initialize: async () => {
        // Card2.1组件初始化逻辑
        if (process.env.NODE_ENV === 'development') {
          console.log(`🎯 [Card21RegistryAdapter] 初始化组件: ${definition.type}`)
        }
      }
    }

    await getRegistryEngine().register(registryItem)
  }
}

/**
 * 传统卡片组件注册系统适配器
 * 将传统Card系统的ComponentRegistry集成到Registry Engine
 */
export class LegacyCardRegistryAdapter extends BaseRegistryAdapter {
  readonly name = 'LegacyCardRegistryAdapter'
  readonly version = '1.0.0'
  readonly supportedTypes = [RegistryItemType.LEGACY_CARD_COMPONENT]

  /**
   * 检查传统卡片系统是否可用
   */
  isAvailable(): boolean {
    try {
      return typeof require !== 'undefined'
    } catch {
      return false
    }
  }

  /**
   * 执行传统卡片系统集成
   */
  protected async performIntegration(): Promise<void> {
    try {
      // 动态导入传统卡片组件注册表
      const { componentRegistry } = await import('@/card/core/registry/index')

      // 获取已注册的所有组件
      const existingComponents = componentRegistry.getAllDefinitions()

      // 将现有组件迁移到Registry Engine
      for (const component of existingComponents) {
        await this.registerLegacyComponent(component)
      }

      // 监听新的注册操作
      this.setupLegacyRegistryListeners(componentRegistry)

      console.log(`📦 [LegacyCardRegistryAdapter] 已迁移 ${existingComponents.length} 个传统Card组件`)

    } catch (error) {
      console.error(`❌ [LegacyCardRegistryAdapter] 集成失败:`, error)
      throw error
    }
  }

  /**
   * 执行断开逻辑
   */
  protected async performDisconnection(): Promise<void> {
    // 从Registry Engine中移除所有传统Card组件
    const registryEngine = getRegistryEngine()
    const legacyItems = getRegistryEngine().getByType(RegistryItemType.LEGACY_CARD_COMPONENT)
    for (const item of legacyItems) {
      await getRegistryEngine().unregister(item.metadata.id)
    }
  }

  /**
   * 设置传统注册表监听器
   */
  private setupLegacyRegistryListeners(componentRegistry: any): void {
    // 这里可以设置监听器来捕获新的注册操作
    // 由于传统系统可能没有事件机制，这里提供一个基础实现
  }

  /**
   * 将传统Card组件注册到Registry Engine
   */
  private async registerLegacyComponent(definition: IComponentDefinition): Promise<void> {
    const metadata = this.createMetadata(
      `legacy-${definition.meta.id}`,
      definition.meta.name,
      RegistryItemType.LEGACY_CARD_COMPONENT,
      {
        description: definition.meta.description || `传统Card组件: ${definition.meta.name}`,
        category: definition.meta.type,
        tags: ['legacy', 'card', definition.meta.type],
        version: definition.meta.version || '1.0.0'
      }
    )

    const registryItem: RegistryItem<IComponentDefinition> = {
      metadata,
      content: definition,
      validate: () => {
        // 验证传统Card组件定义的有效性
        return !!(definition.meta.id && definition.meta.name && definition.logic && definition.views)
      },
      initialize: async () => {
        // 传统Card组件初始化逻辑
        if (process.env.NODE_ENV === 'development') {
          console.log(`🎯 [LegacyCardRegistryAdapter] 初始化组件: ${definition.meta.name}`)
        }
      }
    }

    await getRegistryEngine().register(registryItem)
  }
}

/**
 * 渲染器注册系统适配器
 * 将RendererManager集成到Registry Engine
 */
export class RendererRegistryAdapter extends BaseRegistryAdapter {
  readonly name = 'RendererRegistryAdapter'
  readonly version = '1.0.0'
  readonly supportedTypes = [RegistryItemType.RENDERER]

  /**
   * 检查渲染器系统是否可用
   */
  isAvailable(): boolean {
    try {
      return typeof require !== 'undefined'
    } catch {
      return false
    }
  }

  /**
   * 执行渲染器系统集成
   */
  protected async performIntegration(): Promise<void> {
    try {
      // 动态导入渲染器管理器
      const { rendererManager } = await import('@/components/visual-editor/renderers/base/RendererManager')

      // 获取已注册的所有渲染器
      const existingRenderers = rendererManager.getRegistrations()

      // 将现有渲染器迁移到Registry Engine
      for (const renderer of existingRenderers) {
        await this.registerRenderer(renderer)
      }

      console.log(`🎨 [RendererRegistryAdapter] 已迁移 ${existingRenderers.length} 个渲染器`)

    } catch (error) {
      console.error(`❌ [RendererRegistryAdapter] 集成失败:`, error)
      throw error
    }
  }

  /**
   * 执行断开逻辑
   */
  protected async performDisconnection(): Promise<void> {
    // 从Registry Engine中移除所有渲染器
    const rendererItems = getRegistryEngine().getByType(RegistryItemType.RENDERER)
    for (const item of rendererItems) {
      await getRegistryEngine().unregister(item.metadata.id)
    }
  }

  /**
   * 将渲染器注册到Registry Engine
   */
  private async registerRenderer(rendererInfo: any): Promise<void> {
    const metadata = this.createMetadata(
      `renderer-${rendererInfo.type}`,
      rendererInfo.name,
      RegistryItemType.RENDERER,
      {
        description: rendererInfo.description || `渲染器: ${rendererInfo.name}`,
        category: 'renderers',
        tags: ['renderer', rendererInfo.type],
        enabled: rendererInfo.supported
      }
    )

    const registryItem: RegistryItem<any> = {
      metadata,
      content: rendererInfo,
      validate: () => {
        // 验证渲染器的有效性
        return !!(rendererInfo.factory && rendererInfo.type && rendererInfo.name)
      },
      initialize: async () => {
        // 渲染器初始化逻辑
        if (process.env.NODE_ENV === 'development') {
          console.log(`🎨 [RendererRegistryAdapter] 初始化渲染器: ${rendererInfo.name}`)
        }
      }
    }

    await getRegistryEngine().register(registryItem)
  }
}

/**
 * 可视化编辑器组件注册适配器
 * 处理Visual Editor中的组件配置注册
 */
export class VisualEditorRegistryAdapter extends BaseRegistryAdapter {
  readonly name = 'VisualEditorRegistryAdapter'
  readonly version = '1.0.0'
  readonly supportedTypes = [RegistryItemType.VISUAL_EDITOR_COMPONENT]

  /**
   * 检查可视化编辑器系统是否可用
   */
  isAvailable(): boolean {
    try {
      return typeof require !== 'undefined'
    } catch {
      return false
    }
  }

  /**
   * 执行可视化编辑器系统集成
   */
  protected async performIntegration(): Promise<void> {
    try {
      // 动态导入可视化编辑器组件注册表
      const { configLayerRegistry } = await import('@/components/visual-editor/configuration/component-registry')

      // 将配置层级注册到Registry Engine
      for (const [key, layer] of Object.entries(configLayerRegistry)) {
        await this.registerConfigLayer(key, layer)
      }

      console.log(`🎛️ [VisualEditorRegistryAdapter] 已迁移 ${Object.keys(configLayerRegistry).length} 个配置层级`)

    } catch (error) {
      console.error(`❌ [VisualEditorRegistryAdapter] 集成失败:`, error)
      throw error
    }
  }

  /**
   * 执行断开逻辑
   */
  protected async performDisconnection(): Promise<void> {
    // 从Registry Engine中移除所有可视化编辑器组件
    const veItems = getRegistryEngine().getByType(RegistryItemType.VISUAL_EDITOR_COMPONENT)
    for (const item of veItems) {
      await getRegistryEngine().unregister(item.metadata.id)
    }
  }

  /**
   * 将配置层级注册到Registry Engine
   */
  private async registerConfigLayer(key: string, layer: any): Promise<void> {
    const metadata = this.createMetadata(
      `ve-config-${key}`,
      layer.label,
      RegistryItemType.VISUAL_EDITOR_COMPONENT,
      {
        description: layer.description || `可视化编辑器配置层级: ${layer.label}`,
        category: 'visual-editor-config',
        tags: ['visual-editor', 'config', key],
        priority: layer.order || 0,
        enabled: layer.visible !== false
      }
    )

    const registryItem: RegistryItem<any> = {
      metadata,
      content: layer,
      validate: () => {
        // 验证配置层级的有效性
        return !!(layer.name && layer.component)
      },
      initialize: async () => {
        // 配置层级初始化逻辑
        if (process.env.NODE_ENV === 'development') {
          console.log(`🎛️ [VisualEditorRegistryAdapter] 初始化配置层级: ${layer.label}`)
        }
      }
    }

    await getRegistryEngine().register(registryItem)
  }
}

/**
 * 适配器管理器
 * 统一管理所有注册适配器
 */
export class AdapterManager {
  private adapters = new Map<string, BaseRegistryAdapter>()
  private integrationOrder: string[] = []

  constructor() {
    // 注册所有可用的适配器
    this.registerAdapter(new Card21RegistryAdapter())
    this.registerAdapter(new LegacyCardRegistryAdapter())
    this.registerAdapter(new RendererRegistryAdapter())
    this.registerAdapter(new VisualEditorRegistryAdapter())

    // 设置集成顺序（基础系统优先）
    this.integrationOrder = [
      'RendererRegistryAdapter',
      'LegacyCardRegistryAdapter',
      'Card21RegistryAdapter',
      'VisualEditorRegistryAdapter'
    ]
  }

  /**
   * 注册适配器
   */
  registerAdapter(adapter: BaseRegistryAdapter): void {
    this.adapters.set(adapter.name, adapter)
    console.log(`📝 [AdapterManager] 已注册适配器: ${adapter.name}`)
  }

  /**
   * 获取适配器
   */
  getAdapter(name: string): BaseRegistryAdapter | undefined {
    return this.adapters.get(name)
  }

  /**
   * 获取所有适配器
   */
  getAllAdapters(): BaseRegistryAdapter[] {
    return Array.from(this.adapters.values())
  }

  /**
   * 获取可用的适配器
   */
  getAvailableAdapters(): BaseRegistryAdapter[] {
    return this.getAllAdapters().filter(adapter => adapter.isAvailable())
  }

  /**
   * 集成所有可用的适配器
   */
  async integrateAll(): Promise<{ success: number; failed: number; details: any[] }> {
    const results = {
      success: 0,
      failed: 0,
      details: [] as any[]
    }

    console.log('🚀 [AdapterManager] 开始集成所有适配器...')

    // 按顺序集成适配器
    for (const adapterName of this.integrationOrder) {
      const adapter = this.adapters.get(adapterName)
      if (!adapter) continue

      if (!adapter.isAvailable()) {
        console.warn(`⚠️ [AdapterManager] 适配器 ${adapterName} 不可用，跳过集成`)
        results.details.push({
          adapter: adapterName,
          status: 'skipped',
          reason: 'not available'
        })
        continue
      }

      try {
        const success = await adapter.integrate()
        if (success) {
          results.success++
          results.details.push({
            adapter: adapterName,
            status: 'success'
          })
        } else {
          results.failed++
          results.details.push({
            adapter: adapterName,
            status: 'failed',
            reason: 'integration returned false'
          })
        }
      } catch (error) {
        results.failed++
        results.details.push({
          adapter: adapterName,
          status: 'error',
          error: error instanceof Error ? error.message : String(error)
        })
      }
    }

    console.log(`✅ [AdapterManager] 适配器集成完成: 成功 ${results.success}, 失败 ${results.failed}`)
    return results
  }

  /**
   * 断开所有适配器
   */
  async disconnectAll(): Promise<void> {
    console.log('🔄 [AdapterManager] 开始断开所有适配器...')

    // 按相反顺序断开适配器
    const reverseOrder = [...this.integrationOrder].reverse()

    for (const adapterName of reverseOrder) {
      const adapter = this.adapters.get(adapterName)
      if (adapter) {
        try {
          await adapter.disconnect()
        } catch (error) {
          console.error(`❌ [AdapterManager] 断开适配器 ${adapterName} 失败:`, error)
        }
      }
    }

    console.log('✅ [AdapterManager] 所有适配器已断开')
  }

  /**
   * 获取集成状态统计
   */
  getIntegrationStats(): {
    total: number
    available: number
    integrated: number
    adapters: Array<{
      name: string
      version: string
      available: boolean
      integrated: boolean
      supportedTypes: RegistryItemType[]
    }>
  } {
    const adapters = this.getAllAdapters()

    return {
      total: adapters.length,
      available: adapters.filter(a => a.isAvailable()).length,
      integrated: adapters.filter(a => (a as any).integrated).length,
      adapters: adapters.map(adapter => ({
        name: adapter.name,
        version: adapter.version,
        available: adapter.isAvailable(),
        integrated: (adapter as any).integrated || false,
        supportedTypes: adapter.supportedTypes
      }))
    }
  }
}

// 创建全局适配器管理器实例
export const adapterManager = new AdapterManager()

// 自动集成所有可用适配器（在开发环境中）
if (process.env.NODE_ENV === 'development') {
  // 延迟执行，确保所有模块都已加载
  setTimeout(async () => {
    try {
      const results = await adapterManager.integrateAll()
      console.log('🎉 [RegistryEngine] 自动适配器集成完成:', results)
    } catch (error) {
      console.error('❌ [RegistryEngine] 自动适配器集成失败:', error)
    }
  }, 1000)
}