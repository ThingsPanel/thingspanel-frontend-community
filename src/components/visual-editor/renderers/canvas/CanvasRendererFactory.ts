/**
 * Canvas 渲染器工厂
 * 实现 RendererFactory 接口，负责创建和管理 Canvas 渲染器实例
 */

import { BaseRendererFactory, type BaseRenderer, type RendererContext, type RendererConfig } from '@/components/visual-editor/renderers/base/BaseRenderer'
import { CanvasBaseRenderer, type CanvasRendererConfig } from './CanvasBaseRenderer'
import { checkFabricAvailability } from './fabric/utils'

/**
 * Canvas 渲染器工厂类
 * 负责创建 Canvas 渲染器实例并检查环境支持
 */
export class CanvasRendererFactory extends BaseRendererFactory {
  private static instance: CanvasRendererFactory
  private fabricSupported: boolean | null = null

  private constructor() {
    super()
  }

  /**
   * 获取单例实例
   */
  static getInstance(): CanvasRendererFactory {
    if (!CanvasRendererFactory.instance) {
      CanvasRendererFactory.instance = new CanvasRendererFactory()
    }
    return CanvasRendererFactory.instance
  }

  /**
   * 创建 Canvas 渲染器实例
   */
  create(context: RendererContext, config: RendererConfig = {}): BaseRenderer {
    console.log('🏭 [CanvasRendererFactory] 创建 Canvas 渲染器实例')

    // 类型安全的配置转换
    const canvasConfig: CanvasRendererConfig = {
      readonly: false,
      theme: 'light',
      ...config
    }

    try {
      const renderer = new CanvasBaseRenderer(context, canvasConfig)
      console.log('✅ [CanvasRendererFactory] Canvas 渲染器实例创建成功')
      return renderer
    } catch (error) {
      console.error('❌ [CanvasRendererFactory] Canvas 渲染器实例创建失败:', error)
      throw new Error(`Canvas 渲染器创建失败: ${error}`)
    }
  }

  /**
   * 获取渲染器类型标识
   */
  getType(): string {
    return 'canvas'
  }

  /**
   * 检查当前环境是否支持 Canvas 渲染器
   */
  isSupported(): boolean {
    // 如果已经检查过，直接返回缓存结果
    if (this.fabricSupported !== null) {
      return this.fabricSupported
    }

    // 执行异步检查（注意：这里只能返回同步结果）
    // 实际的异步检查会在后台进行
    this.checkFabricSupportAsync()

    // 默认返回 true，具体的依赖检查在渲染器初始化时进行
    return true
  }

  /**
   * 异步检查 Fabric.js 支持情况
   */
  private async checkFabricSupportAsync(): Promise<void> {
    try {
      this.fabricSupported = await checkFabricAvailability()
      console.log('🔍 [CanvasRendererFactory] Fabric.js 支持检查结果:', this.fabricSupported)
    } catch (error) {
      console.warn('⚠️ [CanvasRendererFactory] Fabric.js 支持检查失败:', error)
      this.fabricSupported = false
    }
  }

  /**
   * 预检查环境支持（用于提前验证）
   */
  async preCheckSupport(): Promise<boolean> {
    if (this.fabricSupported === null) {
      await this.checkFabricSupportAsync()
    }
    return this.fabricSupported || false
  }

  /**
   * 获取渲染器支持的功能特性
   */
  getSupportedFeatures(): string[] {
    return [
      'drag-drop',      // 拖拽支持
      'resize',         // 缩放支持
      'rotation',       // 旋转支持
      'multi-select',   // 多选支持
      'context-menu',   // 右键菜单
      'alignment',      // 对齐工具
      'layering',       // 图层管理
      'export',         // 导出功能
      'undo-redo',      // 撤销重做
      'grid-snap',      // 网格对齐
      'zoom',           // 缩放功能
      'data-binding'    // 数据绑定
    ]
  }

  /**
   * 获取渲染器配置模式
   */
  getConfigSchema(): Record<string, any> {
    return {
      type: 'object',
      properties: {
        canvasWidth: {
          type: 'number',
          title: '画布宽度',
          default: 1200,
          minimum: 100,
          maximum: 5000
        },
        canvasHeight: {
          type: 'number',
          title: '画布高度',
          default: 800,
          minimum: 100,
          maximum: 5000
        },
        backgroundColor: {
          type: 'string',
          title: '背景颜色',
          default: '#f8f9fa',
          format: 'color'
        },
        showGrid: {
          type: 'boolean',
          title: '显示网格',
          default: true
        },
        gridSize: {
          type: 'number',
          title: '网格大小',
          default: 20,
          minimum: 5,
          maximum: 100
        },
        enableSnap: {
          type: 'boolean',
          title: '启用吸附',
          default: true
        },
        snapThreshold: {
          type: 'number',
          title: '吸附阈值',
          default: 10,
          minimum: 1,
          maximum: 50
        }
      }
    }
  }

  /**
   * 获取依赖信息
   */
  getDependencies(): Array<{
    name: string
    version?: string
    required: boolean
    description: string
  }> {
    return [
      {
        name: 'fabric',
        version: '^6.7.1',
        required: true,
        description: 'Fabric.js 画布渲染库'
      }
    ]
  }

  /**
   * 检查特定依赖是否满足
   */
  async checkDependency(name: string): Promise<boolean> {
    switch (name) {
      case 'fabric':
        return await checkFabricAvailability()
      default:
        return false
    }
  }

  /**
   * 获取渲染器性能信息
   */
  getPerformanceInfo(): {
    maxNodes: number
    optimalNodes: number
    memoryUsage: 'low' | 'medium' | 'high'
    cpuIntensive: boolean
  } {
    return {
      maxNodes: 1000,         // 最大节点数
      optimalNodes: 200,      // 最佳性能节点数
      memoryUsage: 'medium',  // 内存使用情况
      cpuIntensive: false     // 是否CPU密集
    }
  }

  /**
   * 重置工厂状态（用于测试或重新初始化）
   */
  reset(): void {
    this.fabricSupported = null
    console.log('🔄 [CanvasRendererFactory] 工厂状态已重置')
  }
}

// 导出单例实例
export const canvasRendererFactory = CanvasRendererFactory.getInstance()

// 导出便捷方法
export const createCanvasRenderer = (context: RendererContext, config?: CanvasRendererConfig) => {
  return canvasRendererFactory.create(context, config)
}

export const isCanvasSupported = () => {
  return canvasRendererFactory.isSupported()
}

export const checkCanvasSupport = () => {
  return canvasRendererFactory.preCheckSupport()
}

export default CanvasRendererFactory