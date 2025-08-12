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
      console.log('🔍 [ComponentLoader] 开始扫描组件...')

      // 使用 Vite 的动态导入功能 - 支持递归扫描
      const allModules = import.meta.glob('../components/**/index.{ts,js}', { eager: true })

      console.log(`🔍 [ComponentLoader] 总共找到 ${Object.keys(allModules).length} 个模块`)

      const componentModules: Record<string, ComponentModule> = {}

      for (const [path, module] of Object.entries(allModules)) {
        console.log(`[ComponentLoader] Processing path: ${path}`)
        // 从路径中提取组件ID
        const componentId = this.extractComponentId(path)
        console.log(`[ComponentLoader] Extracted componentId: ${componentId}`)

        if (componentId && this.shouldIncludeComponent(componentId)) {
          console.log(`[ComponentLoader] Including component: ${componentId}`)
          // 获取默认导出或整个模块
          const definition = module.default || module
          if (definition && definition.type) {
            console.log(`[ComponentLoader] Valid definition found for ${componentId}:`, definition)
            componentModules[componentId] = { default: definition }
          } else {
            console.warn(`[ComponentLoader] Invalid or missing definition for ${componentId} in path: ${path}`, module)
          }
        } else {
          console.log(`[ComponentLoader] Skipping component: ${componentId} (path: ${path})`)
        }
      }

      console.log(`📦 [ComponentLoader] 最终加载了 ${Object.keys(componentModules).length} 个组件模块`)
      console.log('🔍 [ComponentLoader] 所有找到的模块路径:', Object.keys(allModules))
      console.log('📋 [ComponentLoader] 组件模块详情:', componentModules)
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
    console.log(`[ComponentLoader] 正在提取组件ID，路径: ${path}`)

    // 匹配更灵活的路径格式，支持连字符和下划线
    // 优先匹配: ../components/universal-data-viz/index.ts
    const match = path.match(/\.\.\/components\/(?:.*\/)?([^/]+)\/index\.(ts|js)$/)
    const componentId = match ? match[1] : null

    console.log(`[ComponentLoader] 路径 "${path}" 提取的组件ID: "${componentId}"`)

    // 特别检查 universal-data-viz
    if (path.includes('universal-data-viz')) {
      console.log(`🎯 [ComponentLoader] 检测到 universal-data-viz 组件路径: ${path}`)
      console.log(`🎯 [ComponentLoader] 提取的组件ID: ${componentId}`)
    }

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
