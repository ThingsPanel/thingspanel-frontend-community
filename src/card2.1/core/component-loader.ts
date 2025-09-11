/**
 * Card 2.1 组件加载器
 * 支持动态导入和目录扫描
 */

import type { ComponentDefinition } from '@/card2.1/core/types'

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

      if (process.env.NODE_ENV === 'development') {
      }

      const componentModules: Record<string, ComponentModule> = {}

      for (const [path, module] of Object.entries(allModules)) {
        // 从路径中提取组件ID和分类信息
        const componentId = this.extractComponentId(path)
        const category = this.extractComponentCategory(path)

        if (process.env.NODE_ENV === 'development') {
        }

        if (componentId && category && this.shouldIncludeComponent(componentId, category)) {
          // 获取默认导出或整个模块
          const definition = module.default || module
          if (process.env.NODE_ENV === 'development') {
          }

          if (definition && definition.type) {
            componentModules[componentId] = { default: definition }
            if (process.env.NODE_ENV === 'development') {
            }
          } else {
            console.warn(`⚠️ [ComponentLoader] 组件定义格式不正确，跳过: ${path}`)
            console.warn(`⚠️ [ComponentLoader] 定义内容:`, definition)
          }
        } else {
          console.warn(`⚠️ [ComponentLoader] 组件被排除或ID无效，跳过: ${path} (ID: ${componentId}, 分类: ${category})`)
        }
      }

      if (process.env.NODE_ENV === 'development') {
      }
      return componentModules
    } catch (error) {
      return {}
    }
  }

  /**
   * 从路径中提取组件ID和分类信息
   */
  private extractComponentId(path: string): string | null {
    // 匹配分类文件夹结构: ../components/category/component-name/index.ts
    const match = path.match(/\.\.\/components\/([^/]+)\/([^/]+)\/index\.(ts|js)$/)
    const componentId = match ? match[2] : null
    return componentId
  }

  /**
   * 从路径中提取组件分类
   */
  private extractComponentCategory(path: string): string | null {
    // 提取分类文件夹名称
    const match = path.match(/\.\.\/components\/([^/]+)\/([^/]+)\/index\.(ts|js)$/)
    const category = match ? match[1] : null
    return category
  }

  /**
   * 判断是否应该包含该组件（包含环境过滤）
   */
  private shouldIncludeComponent(componentId: string, category: string): boolean {
    // 基础排除规则
    const isExcluded = this.exclude.some(pattern => componentId.includes(pattern) || pattern.includes(componentId))
    if (isExcluded) return false

    // 🔥 环境过滤：生产环境下排除测试组件
    const isProduction = process.env.NODE_ENV === 'production'
    const isTestComponent = category === 'test'

    if (isProduction && isTestComponent) {
      if (process.env.NODE_ENV === 'development') {
      }
      return false
    }

    return true
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
