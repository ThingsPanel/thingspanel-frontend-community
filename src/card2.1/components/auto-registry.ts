/**
 * Card 2.1 组件自动注册系统
 * 自动扫描并注册所有符合规范的组件，按文件夹严格分类
 */

import type { ComponentDefinition } from '../core/types'
import { 
  getCategoryByFolderPath, 
  getCategoryDisplayName, 
  shouldShowCategory, 
  getValidCategories 
} from './category-mapping'

/**
 * 组件注册表接口
 */
interface ComponentRegistry {
  components: Record<string, ComponentDefinition>
  categories: Record<string, ComponentDefinition[]>
  types: string[]
}

/**
 * 自动组件注册器
 */
class AutoComponentRegistry {
  private registry: ComponentRegistry = {
    components: {},
    categories: {},
    types: []
  }

  private initialized = false

  /**
   * 初始化组件注册表
   * 自动扫描所有组件并注册
   */
  async initialize(): Promise<void> {
    if (this.initialized) return

    try {
      // 获取所有组件定义
      const componentDefinitions = await this.scanComponents()
      
      // 注册所有组件（传递文件夹路径用于分类）
      componentDefinitions.forEach(({ definition, folderPath }) => {
        this.registerComponent(definition, folderPath)
      })

      this.initialized = true
      console.log(`[Card2.1] 自动注册了 ${componentDefinitions.length} 个组件`)
    } catch (error) {
      console.error('[Card2.1] 组件自动注册失败:', error)
    }
  }

  /**
   * 扫描所有组件定义
   * 使用 Vite 的 import.meta.glob 动态导入，保留文件夹路径信息
   */
  private async scanComponents(): Promise<Array<{ definition: ComponentDefinition; folderPath: string }>> {
    const componentDefinitions: Array<{ definition: ComponentDefinition; folderPath: string }> = []

    try {
      // 扫描所有组件目录下的 index.ts 文件，包括更深层的嵌套
      const componentModules = import.meta.glob('./*/index.ts', { eager: false })
      const subComponentModules = import.meta.glob('./*/*/index.ts', { eager: false })
      const deepComponentModules = import.meta.glob('./*/*/*/index.ts', { eager: false })
      
      // 合并所有模块路径，排除当前文件和auto-registry
      const allModules = { ...componentModules, ...subComponentModules, ...deepComponentModules }
      const filteredModules = Object.fromEntries(
        Object.entries(allModules).filter(([path]) => 
          !path.includes('auto-registry') && !path.includes('./index.ts')
        )
      )

      console.log('[Card2.1] 扫描到的组件模块:', Object.keys(filteredModules))
      console.log('[Card2.1] 详细模块路径:', Object.keys(filteredModules).map(path => ({ path, exists: true })))

      // 动态导入所有组件定义
      for (const [path, importFn] of Object.entries(filteredModules)) {
        console.log(`🔧 [Card2.1] 开始导入组件: ${path}`)
        try {
          const module = await importFn() as any
          console.log(`🔧 [Card2.1] 模块导入成功: ${path}`, Object.keys(module))
          
          // 查找组件定义（支持多种导出方式）
          const definition = module.default || module.definition || module.componentDefinition
          console.log(`🔧 [Card2.1] 组件定义: ${path}`, definition ? definition.type : 'undefined')
          
          if (definition && this.isValidComponentDefinition(definition)) {
            componentDefinitions.push({ definition, folderPath: path })
            console.log(`✅ [Card2.1] 成功加载组件: ${definition.name} (${definition.type}) 来源: ${path}`)
          } else {
            console.warn(`❌ [Card2.1] 跳过无效组件定义: ${path}`, { 
              hasDefault: !!module.default,
              hasDefinition: !!module.definition,
              hasComponentDefinition: !!module.componentDefinition,
              moduleKeys: Object.keys(module),
              definition: definition
            })
          }
        } catch (error) {
          console.error(`💥 [Card2.1] 导入组件定义失败: ${path}`, error)
        }
      }
    } catch (error) {
      console.error('[Card2.1] 扫描组件过程中发生错误:', error)
    }

    return componentDefinitions
  }

  /**
   * 验证组件定义是否有效
   */
  private isValidComponentDefinition(definition: any): definition is ComponentDefinition {
    return (
      definition &&
      typeof definition === 'object' &&
      typeof definition.type === 'string' &&
      typeof definition.name === 'string' &&
      definition.component
    )
  }

  /**
   * 注册单个组件（按文件夹路径分类）
   */
  private registerComponent(definition: ComponentDefinition, folderPath?: string): void {
    if (!definition || !definition.type) {
      console.error(`❌ [AutoRegistry] 尝试注册无效组件:`, definition)
      return
    }

    const { type } = definition

    // 🚨 CRITICAL: 从文件夹路径确定分类，忽略组件定义中的分类字段
    const categoryConfig = folderPath ? getCategoryByFolderPath(folderPath) : undefined
    const categoryName = categoryConfig?.displayName || '其他'

    // 检查是否应该显示该分类（开发环境检查）
    const isDev = import.meta.env.DEV
    const folderName = folderPath?.match(/^\.\/([^/]+)/)?.[1] || ''
    
    if (folderName && !shouldShowCategory(folderName, isDev)) {
      console.log(`🔧 [AutoRegistry] 跳过组件 ${type}: 分类 ${categoryName} 在当前环境不显示`)
      return
    }

    console.log(`🔧 [AutoRegistry] 注册组件: ${type} -> ${categoryName} (来源: ${folderPath || '未知'})`)

    // 注册到组件映射表
    this.registry.components[type] = definition

    // 注册到分类表
    if (!this.registry.categories[categoryName]) {
      this.registry.categories[categoryName] = []
    }
    this.registry.categories[categoryName].push(definition)

    // 更新类型列表
    if (!this.registry.types.includes(type)) {
      this.registry.types.push(type)
    }
  }


  /**
   * 获取组件定义
   */
  getComponentDefinition(type: string): ComponentDefinition | undefined {
    return this.registry.components[type]
  }

  /**
   * 获取指定分类的组件
   */
  getComponentsByCategory(category: string): ComponentDefinition[] {
    return this.registry.categories[category] || []
  }

  /**
   * 获取所有组件定义
   */
  getAllComponents(): ComponentDefinition[] {
    const components = Object.values(this.registry.components)
    // 过滤掉 undefined 或无效的组件
    const validComponents = components.filter(comp => 
      comp && 
      comp.type && 
      comp.name && 
      comp.component
    )
    console.log(`🔧 [AutoRegistry] 总组件数: ${components.length}, 有效组件数: ${validComponents.length}`)
    if (components.length !== validComponents.length) {
      console.warn(`❌ [AutoRegistry] 发现无效组件:`, components.filter(comp => !comp || !comp.type))
    }
    return validComponents
  }

  /**
   * 获取所有组件类型
   */
  getAllComponentTypes(): string[] {
    // 从有效组件中提取类型，确保没有 undefined
    const validComponents = this.getAllComponents()
    const types = validComponents.map(comp => comp.type).filter(type => type)
    console.log(`🔧 [AutoRegistry] 组件类型列表:`, types)
    return types
  }

  /**
   * 获取所有分类（按文件夹分类系统）
   */
  getAllCategories(): string[] {
    // 获取实际有组件的分类
    const actualCategories = Object.keys(this.registry.categories)
    
    // 过滤掉空分类，按配置文件顺序排序
    const isDev = import.meta.env.DEV
    const validCategories = getValidCategories(isDev)
      .filter(({ config }) => actualCategories.includes(config.displayName))
      .map(({ config }) => config.displayName)
    
    // 添加其他未在配置中定义的分类
    const otherCategories = actualCategories.filter(cat => !validCategories.includes(cat))
    
    return [...validCategories, ...otherCategories]
  }

  /**
   * 根据标签筛选组件
   */
  getComponentsByTags(tags: string[]): ComponentDefinition[] {
    return this.getAllComponents().filter(component => 
      component.tags && tags.some(tag => component.tags!.includes(tag))
    )
  }

  /**
   * 检查组件是否支持特定数据源类型
   */
  isDataSourceSupported(componentType: string, dataSourceType: string): boolean {
    const definition = this.getComponentDefinition(componentType)
    return definition?.supportedDataSources?.includes(dataSourceType) || false
  }

  /**
   * 获取组件统计信息
   */
  getStats() {
    const categories = this.getAllCategories()
    return {
      total: this.registry.types.length,
      categories,
      byCategory: Object.fromEntries(
        categories.map(category => [category, this.getComponentsByCategory(category).length])
      ),
      supportedDataSources: Array.from(
        new Set(this.getAllComponents().flatMap(c => c.supportedDataSources || []))
      ),
      versions: Array.from(
        new Set(
          this.getAllComponents()
            .map(c => c.version)
            .filter(Boolean)
        )
      )
    }
  }

  /**
   * 重新加载组件注册表
   * 用于热重载或动态添加组件时刷新
   */
  async reload(): Promise<void> {
    this.registry = {
      components: {},
      categories: {},
      types: []
    }
    this.initialized = false
    await this.initialize()
  }
}

// 创建全局单例
export const autoRegistry = new AutoComponentRegistry()

// 自动初始化（在开发环境中）
if (import.meta.env.DEV) {
  autoRegistry.initialize().catch(console.error)
}

export default autoRegistry