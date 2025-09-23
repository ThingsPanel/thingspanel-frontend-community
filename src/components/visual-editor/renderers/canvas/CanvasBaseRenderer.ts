/**
 * Canvas 基础渲染器
 * 继承 BaseRenderer，实现基于 Fabric.js 的画布渲染器
 */

import { BaseRenderer, RendererState, type RendererContext, type RendererConfig, type NodeData } from '@/components/visual-editor/renderers/base/BaseRenderer'
import { FabricRenderer, type FabricRendererConfig } from './fabric/FabricRenderer'
import { checkFabricAvailability } from './fabric/utils'

// Canvas 渲染器配置接口
export interface CanvasRendererConfig extends RendererConfig {
  // Canvas 特定配置
  canvasWidth?: number
  canvasHeight?: number
  backgroundColor?: string
  showGrid?: boolean
  gridSize?: number
  enableSnap?: boolean
  snapThreshold?: number

  // Fabric.js 配置
  fabric?: FabricRendererConfig
}

// Canvas 渲染器错误类型
export class CanvasRendererError extends Error {
  constructor(message: string, public code?: string) {
    super(message)
    this.name = 'CanvasRendererError'
  }
}

/**
 * Canvas 基础渲染器类
 * 负责管理 Canvas 渲染器的生命周期和 Fabric.js 集成
 */
export class CanvasBaseRenderer extends BaseRenderer {
  private fabricRenderer: FabricRenderer | null = null
  private container: HTMLElement | null = null
  private canvasConfig: CanvasRendererConfig
  private isInitialized = false
  private fabricAvailable = false

  constructor(context: RendererContext, config: CanvasRendererConfig = {}) {
    // 合并默认配置
    const defaultConfig: CanvasRendererConfig = {
      readonly: false,
      theme: 'light',
      canvasWidth: 1200,
      canvasHeight: 800,
      backgroundColor: '#f8f9fa',
      showGrid: true,
      gridSize: 20,
      enableSnap: true,
      snapThreshold: 10,
      fabric: {
        width: 1200,
        height: 800,
        backgroundColor: '#f8f9fa',
        selection: true,
        preserveObjectStacking: true,
        renderOnAddRemove: true,
        interactive: true
      }
    }

    super(context, { ...defaultConfig, ...config })
    this.canvasConfig = { ...defaultConfig, ...config }
  }

  /**
   * 初始化渲染器
   */
  protected async onInit(): Promise<void> {
    try {
      console.log('🎯 [CanvasBaseRenderer] 开始初始化 Canvas 渲染器')

      // 检查 Fabric.js 可用性
      this.fabricAvailable = await checkFabricAvailability()
      if (!this.fabricAvailable) {
        throw new CanvasRendererError(
          'Fabric.js 依赖不可用，请运行 pnpm add fabric 安装依赖',
          'FABRIC_NOT_AVAILABLE'
        )
      }

      console.log('✅ [CanvasBaseRenderer] Fabric.js 依赖检查通过')

      // 更新配置中的只读模式
      if (this.canvasConfig.fabric) {
        this.canvasConfig.fabric.selection = !this.canvasConfig.readonly
        this.canvasConfig.fabric.interactive = !this.canvasConfig.readonly
      }

      this.isInitialized = true
      console.log('✅ [CanvasBaseRenderer] Canvas 渲染器初始化完成')

    } catch (error) {
      console.error('❌ [CanvasBaseRenderer] 初始化失败:', error)
      throw error
    }
  }

  /**
   * 渲染方法
   */
  protected async onRender(): Promise<void> {
    try {
      console.log('🎨 [CanvasBaseRenderer] 开始渲染 Canvas')

      if (!this.isInitialized) {
        throw new CanvasRendererError('渲染器未初始化', 'NOT_INITIALIZED')
      }

      if (!this.container) {
        console.warn('⚠️ [CanvasBaseRenderer] 容器未设置，跳过渲染')
        return
      }

      // 初始化 Fabric 渲染器
      if (!this.fabricRenderer) {
        await this.initializeFabricRenderer()
      }

      // 渲染所有节点
      await this.renderNodes()

      console.log('✅ [CanvasBaseRenderer] Canvas 渲染完成')

    } catch (error) {
      console.error('❌ [CanvasBaseRenderer] 渲染失败:', error)
      throw error
    }
  }

  /**
   * 更新配置
   */
  protected async onUpdate(changes: Partial<CanvasRendererConfig>): Promise<void> {
    try {
      console.log('🔄 [CanvasBaseRenderer] 更新配置:', changes)

      // 更新内部配置
      this.canvasConfig = { ...this.canvasConfig, ...changes }

      // 如果 Fabric 渲染器已初始化，更新其配置
      if (this.fabricRenderer) {
        // 更新 Fabric 配置
        if (changes.fabric) {
          // TODO: 实现 Fabric 渲染器配置更新
        }

        // 如果只读模式变化，更新交互性
        if ('readonly' in changes) {
          // TODO: 更新 Fabric 画布的交互模式
        }

        // 重新渲染
        await this.renderNodes()
      }

      console.log('✅ [CanvasBaseRenderer] 配置更新完成')

    } catch (error) {
      console.error('❌ [CanvasBaseRenderer] 配置更新失败:', error)
      throw error
    }
  }

  /**
   * 销毁渲染器
   */
  protected async onDestroy(): Promise<void> {
    try {
      console.log('🗑️ [CanvasBaseRenderer] 开始销毁 Canvas 渲染器')

      // 销毁 Fabric 渲染器
      if (this.fabricRenderer) {
        this.fabricRenderer.destroy()
        this.fabricRenderer = null
      }

      // 清理容器引用
      this.container = null
      this.isInitialized = false

      console.log('✅ [CanvasBaseRenderer] Canvas 渲染器销毁完成')

    } catch (error) {
      console.error('❌ [CanvasBaseRenderer] 销毁失败:', error)
      throw error
    }
  }

  /**
   * 节点选择处理
   */
  protected onNodeSelect(nodeId: string): void {
    console.log('🎯 [CanvasBaseRenderer] 节点选择:', nodeId)

    if (this.fabricRenderer) {
      // TODO: 在 Fabric 画布中选择对应的对象
    }
  }

  /**
   * 节点更新处理
   */
  protected onNodeUpdate(nodeId: string, updates: Partial<NodeData>): void {
    console.log('🔄 [CanvasBaseRenderer] 节点更新:', nodeId, updates)

    if (this.fabricRenderer) {
      // TODO: 更新 Fabric 画布中的对象
    }
  }

  /**
   * 画布点击处理
   */
  protected onCanvasClick(event?: MouseEvent): void {
    console.log('🖱️ [CanvasBaseRenderer] 画布点击')

    // 清空选择
    this.selectNode('')
  }

  /**
   * 设置容器
   */
  setContainer(container: HTMLElement): void {
    this.container = container
    console.log('📦 [CanvasBaseRenderer] 设置容器:', container)
  }

  /**
   * 获取 Canvas 配置
   */
  getCanvasConfig(): CanvasRendererConfig {
    return { ...this.canvasConfig }
  }

  /**
   * 检查是否支持
   */
  isSupported(): boolean {
    return this.fabricAvailable
  }

  /**
   * 初始化 Fabric 渲染器
   */
  private async initializeFabricRenderer(): Promise<void> {
    if (!this.container) {
      throw new CanvasRendererError('容器未设置', 'CONTAINER_NOT_SET')
    }

    try {
      // 创建 Fabric 渲染器
      this.fabricRenderer = new FabricRenderer(this.canvasConfig.fabric || {})

      // 绑定事件处理
      this.fabricRenderer.onNodeSelect = (nodeId: string) => {
        this.selectNode(nodeId)
      }

      this.fabricRenderer.onNodeMove = (nodeId: string, x: number, y: number) => {
        this.updateNode(nodeId, { x, y })
      }

      this.fabricRenderer.onCanvasClick = (event: MouseEvent) => {
        this.handleCanvasClick(event)
      }

      this.fabricRenderer.onNodeContextMenu = (nodeId: string, event: MouseEvent) => {
        // TODO: 处理右键菜单
        console.log('🖱️ [CanvasBaseRenderer] 右键菜单:', nodeId)
      }

      // 初始化 Fabric 画布
      await this.fabricRenderer.init(this.container)

      console.log('✅ [CanvasBaseRenderer] Fabric 渲染器初始化完成')

    } catch (error) {
      console.error('❌ [CanvasBaseRenderer] Fabric 渲染器初始化失败:', error)
      throw new CanvasRendererError(`Fabric 渲染器初始化失败: ${error}`, 'FABRIC_INIT_FAILED')
    }
  }

  /**
   * 渲染所有节点
   */
  private async renderNodes(): Promise<void> {
    if (!this.fabricRenderer) {
      return
    }

    try {
      const nodes = this.context.nodes.value
      console.log(`🎨 [CanvasBaseRenderer] 开始渲染 ${nodes.length} 个节点`)

      // 清空现有对象
      this.fabricRenderer.clear()

      // 添加所有节点
      for (const node of nodes) {
        console.log('📝 [CanvasBaseRenderer] 渲染节点:', node.id, node.type)
        await this.fabricRenderer.addNode(node)
      }

      console.log('✅ [CanvasBaseRenderer] 所有节点渲染完成')

    } catch (error) {
      console.error('❌ [CanvasBaseRenderer] 节点渲染失败:', error)
      throw error
    }
  }
}

export default CanvasBaseRenderer