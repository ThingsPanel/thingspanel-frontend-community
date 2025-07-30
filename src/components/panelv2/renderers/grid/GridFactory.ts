// 网格渲染器工厂
// Grid renderer factory

import type { RendererFactory } from '../base/interfaces'
import type { BaseRenderer } from '../base/interfaces'
import { GridRenderer } from './GridRenderer'
import type { GridConfig } from './types'

/** 网格渲染器工厂配置 */
export interface GridFactoryConfig {
  /** 容器元素 */
  container?: HTMLElement
  /** 网格配置 */
  gridConfig?: Partial<GridConfig>
}

/** 网格渲染器工厂 */
export class GridFactory implements RendererFactory {
  private static instance: GridFactory | null = null

  // 单例模式
  static getInstance(): GridFactory {
    if (!GridFactory.instance) {
      GridFactory.instance = new GridFactory()
    }
    return GridFactory.instance
  }

  private constructor() {}

  // 创建渲染器实例
  create(config: GridFactoryConfig = {}): BaseRenderer {
    const { container, gridConfig } = config

    const renderer = new GridRenderer(container, gridConfig)

    console.log('Created GridRenderer instance with config:', config)

    return renderer
  }

  // 获取渲染器类型
  getType(): string {
    return 'grid'
  }

  // 获取默认配置
  getDefaultConfig(): GridFactoryConfig {
    return {
      gridConfig: {
        columns: 12,
        rowHeight: 60,
        gap: 8,
        showGrid: true,
        enableSnap: true,
        snapThreshold: 10,
        minItemWidth: 100,
        minItemHeight: 60,
        padding: 16
      }
    }
  }

  // 获取渲染器信息
  getInfo() {
    return {
      name: 'Grid Renderer',
      version: '1.0.0',
      description: 'Lightweight grid-based layout renderer with drag & drop support',
      type: this.getType(),
      features: ['Drag & Drop', 'Resize', 'Grid Snap', 'Multi-selection', 'Undo/Redo', 'Lightweight'],
      advantages: [
        'No external dependencies',
        'Better performance',
        'Smaller bundle size',
        'Native Vue integration',
        'Customizable grid system'
      ]
    }
  }

  // 验证配置
  validateConfig(config: GridFactoryConfig): boolean {
    try {
      if (config.gridConfig) {
        const { columns, rowHeight, gap, minItemWidth, minItemHeight } = config.gridConfig

        if (columns !== undefined && (columns < 1 || columns > 24)) {
          console.warn('Grid columns should be between 1 and 24')
          return false
        }

        if (rowHeight !== undefined && rowHeight < 20) {
          console.warn('Row height should be at least 20px')
          return false
        }

        if (gap !== undefined && gap < 0) {
          console.warn('Gap should be non-negative')
          return false
        }

        if (minItemWidth !== undefined && minItemWidth < 50) {
          console.warn('Minimum item width should be at least 50px')
          return false
        }

        if (minItemHeight !== undefined && minItemHeight < 30) {
          console.warn('Minimum item height should be at least 30px')
          return false
        }
      }

      return true
    } catch (error) {
      console.error('Config validation failed:', error)
      return false
    }
  }

  // 创建带验证的渲染器
  createWithValidation(config: GridFactoryConfig = {}): BaseRenderer | null {
    if (!this.validateConfig(config)) {
      console.error('Invalid configuration provided to GridFactory')
      return null
    }

    return this.create(config)
  }
}

// 导出单例实例
export const gridFactory = GridFactory.getInstance()
