/**
 * Card 2.1 组件加载器
 * 支持动态导入和目录扫描
 */

import type { ComponentDefinition } from './types'

export interface ComponentModule {
  default: ComponentDefinition
  [key: string]: any
}

export interface ComponentLoaderOptions {
  basePath?: string
  pattern?: string
  exclude?: string[]
}

export class ComponentLoader {
  private basePath: string
  private pattern: string
  private exclude: string[]

  constructor(options: ComponentLoaderOptions = {}) {
    this.basePath = options.basePath || './components'
    this.pattern = options.pattern || '**/index.ts'
    this.exclude = options.exclude || ['node_modules', '.git', 'dist']
  }

  /**
   * 动态导入组件模块
   * 使用 Vite 的 import.meta.glob 进行动态导入
   */
  async loadComponents(): Promise<Record<string, ComponentModule>> {
    try {
      // 使用 Vite 的动态导入功能
      const modules = import.meta.glob('./components/*/index.ts', {
        eager: true,
        import: 'default'
      })

      const componentModules: Record<string, ComponentModule> = {}

      for (const [path, module] of Object.entries(modules)) {
        // 从路径中提取组件ID
        const componentId = this.extractComponentId(path)

        if (componentId && this.shouldIncludeComponent(componentId)) {
          componentModules[componentId] = module as ComponentModule
        }
      }

      console.log(`📦 [ComponentLoader] 加载了 ${Object.keys(componentModules).length} 个组件模块`)
      return componentModules
    } catch (error) {
      console.error('❌ [ComponentLoader] 加载组件失败:', error)
      return {}
    }
  }

  /**
   * 从路径中提取组件ID
   */
  private extractComponentId(path: string): string | null {
    // 匹配 ./components/component-name/index.ts 格式
    const match = path.match(/\.\/components\/([^/]+)\/index\.ts$/)
    return match ? match[1] : null
  }

  /**
   * 判断是否应该包含该组件
   */
  private shouldIncludeComponent(componentId: string): boolean {
    return !this.exclude.some(pattern => componentId.includes(pattern) || pattern.includes(componentId))
  }

  /**
   * 验证组件定义
   */
  validateComponentDefinition(definition: any): definition is ComponentDefinition {
    const requiredFields = ['type', 'name', 'component']

    return requiredFields.every(field => {
      const hasField = definition && definition[field] !== undefined
      if (!hasField) {
        console.warn(`⚠️ [ComponentLoader] 组件缺少必需字段: ${field}`)
      }
      return hasField
    })
  }

  /**
   * 获取组件统计信息
   */
  getComponentStats(modules: Record<string, ComponentModule>) {
    const stats = {
      total: Object.keys(modules).length,
      valid: 0,
      invalid: 0,
      categories: new Set<string>(),
      subCategories: new Set<string>()
    }

    for (const [id, module] of Object.entries(modules)) {
      const definition = module.default || module

      if (this.validateComponentDefinition(definition)) {
        stats.valid++
        if (definition.mainCategory) {
          stats.categories.add(definition.mainCategory)
        }
        if (definition.subCategory) {
          stats.subCategories.add(definition.subCategory)
        }
      } else {
        stats.invalid++
        console.warn(`⚠️ [ComponentLoader] 无效组件: ${id}`)
      }
    }

    return {
      ...stats,
      categories: Array.from(stats.categories),
      subCategories: Array.from(stats.subCategories)
    }
  }
}
