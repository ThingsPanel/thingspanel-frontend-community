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
    this.basePath = options.basePath || '../components'
    this.pattern = options.pattern || '**/index.ts'
    this.exclude = options.exclude || ['node_modules', '.git', 'dist']
  }

  /**
   * 动态导入组件模块
   * 使用 Vite 的 import.meta.glob 进行动态导入
   */
  async loadComponents(): Promise<Record<string, ComponentModule>> {
    try {
      // 使用 Vite 的动态导入功能 - 支持多种扫描模式
      // 使用 Vite 的动态导入功能 - 支持递归扫描
      const allModules = import.meta.glob('../components/**/index.{ts,js}', { eager: true })

      console.log('🔧 [ComponentLoader] Glob扫描结果:', Object.keys(allModules))

      const componentModules: Record<string, ComponentModule> = {}

      for (const [path, module] of Object.entries(allModules)) {
        // 从路径中提取组件ID
        const componentId = this.extractComponentId(path)

        console.log(`🔧 [ComponentLoader] 处理路径: ${path} -> 组件ID: ${componentId}`)

        if (componentId && this.shouldIncludeComponent(componentId)) {
          // 获取默认导出或整个模块
          const definition = module.default || module
          console.log(`🔧 [ComponentLoader] 组件定义:`, {
            componentId,
            hasDefault: !!module.default,
            definitionType: definition?.type,
            hasComponent: !!definition?.component
          })

          if (definition && definition.type) {
            componentModules[componentId] = { default: definition }
            console.log(`✅ [ComponentLoader] 成功加载组件: ${componentId} (${definition.type})`)
          } else {
            console.warn(`⚠️ [ComponentLoader] 组件定义格式不正确，跳过: ${path}`)
            console.warn(`⚠️ [ComponentLoader] 定义内容:`, definition)
          }
        } else {
          console.warn(`⚠️ [ComponentLoader] 组件被排除或ID无效，跳过: ${path} (ID: ${componentId})`)
        }
      }

      console.log('🔧 [ComponentLoader] 最终加载的组件:', Object.keys(componentModules))
      return componentModules
    } catch (error) {
      return {}
    }
  }

  /**
   * 从路径中提取组件ID
   */
  private extractComponentId(path: string): string | null {
    // 匹配更灵活的路径格式，支持连字符和下划线
    // 优先匹配: ../components/universal-data-viz/index.ts
    const match = path.match(/\.\.\/components\/(?:.*\/)?([^/]+)\/index\.(ts|js)$/)
    const componentId = match ? match[1] : null
    return componentId
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
        // 缺少必要字段，验证失败
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
      }
    }

    return {
      ...stats,
      categories: Array.from(stats.categories),
      subCategories: Array.from(stats.subCategories)
    }
  }
}
