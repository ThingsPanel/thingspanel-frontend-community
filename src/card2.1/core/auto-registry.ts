/**
 * Card 2.1 自动注册系统
 * 支持目录扫描、自动分类和树形结构生成
 */

import type { ComponentDefinition, IComponentRegistry } from './types'

export interface ComponentCategory {
  id: string
  name: string
  description?: string
  icon?: string
  children?: ComponentCategory[]
}

export interface ComponentTree {
  categories: ComponentCategory[]
  components: ComponentDefinition[]
  totalCount: number
}

export class AutoRegistry {
  private registry: IComponentRegistry
  private componentModules: Map<string, any> = new Map()
  private categoryTree: ComponentCategory[] = []

  constructor(registry: IComponentRegistry) {
    this.registry = registry
  }

  /**
   * 自动扫描并注册组件
   * @param componentModules 组件模块映射
   */
  async autoRegister(componentModules: Record<string, any>) {
    console.log('🔄 [AutoRegistry] 开始自动注册组件...')

    const registeredComponents: ComponentDefinition[] = []

    for (const [componentId, module] of Object.entries(componentModules)) {
      try {
        // 获取默认导出（组件定义）
        const definition = module.default || module

        if (this.isValidComponentDefinition(definition)) {
          // 自动生成分类信息
          this.autoGenerateCategories(definition)

          // 注册组件
          this.registry.register(componentId, definition)
          registeredComponents.push(definition)

          console.log(`✅ [AutoRegistry] 注册组件: ${componentId} (${definition.name})`)
        } else {
          console.warn(`⚠️ [AutoRegistry] 跳过无效组件: ${componentId}`)
        }
      } catch (error) {
        console.error(`❌ [AutoRegistry] 注册组件失败: ${componentId}`, error)
      }
    }

    console.log(`🎉 [AutoRegistry] 自动注册完成，共注册 ${registeredComponents.length} 个组件`)
    return registeredComponents
  }

  /**
   * 验证组件定义是否有效
   */
  private isValidComponentDefinition(definition: any): definition is ComponentDefinition {
    return (
      definition &&
      typeof definition.type === 'string' &&
      typeof definition.name === 'string' &&
      typeof definition.component === 'object'
    )
  }

  /**
   * 自动生成分类树
   */
  private autoGenerateCategories(definition: ComponentDefinition) {
    const { mainCategory = '其他', subCategory = '未分类' } = definition

    // 查找或创建主分类
    let mainCat = this.categoryTree.find(cat => cat.id === mainCategory)
    if (!mainCat) {
      mainCat = {
        id: mainCategory,
        name: this.getCategoryDisplayName(mainCategory),
        description: this.getCategoryDescription(mainCategory)
      }
      this.categoryTree.push(mainCat)
    }

    // 查找或创建子分类
    if (!mainCat.children) {
      mainCat.children = []
    }

    let subCat = mainCat.children.find(cat => cat.id === subCategory)
    if (!subCat) {
      subCat = {
        id: subCategory,
        name: this.getCategoryDisplayName(subCategory),
        description: this.getCategoryDescription(subCategory)
      }
      mainCat.children.push(subCat)
    }
  }

  /**
   * 获取分类显示名称
   */
  private getCategoryDisplayName(categoryId: string): string {
    const displayNames: Record<string, string> = {
      系统: '系统组件',
      曲线: '图表组件',
      其他: '其他组件',
      未分类: '未分类组件'
    }
    return displayNames[categoryId] || categoryId
  }

  /**
   * 获取分类描述
   */
  private getCategoryDescription(categoryId: string): string {
    const descriptions: Record<string, string> = {
      系统: '系统监控和状态显示组件',
      曲线: '数据可视化和图表组件',
      其他: '其他功能组件',
      未分类: '待分类的组件'
    }
    return descriptions[categoryId] || ''
  }

  /**
   * 获取组件树形结构
   */
  getComponentTree(): ComponentTree {
    const components = this.registry.getAll()

    return {
      categories: this.categoryTree,
      components,
      totalCount: components.length
    }
  }

  /**
   * 按分类获取组件
   */
  getComponentsByCategory(mainCategory?: string, subCategory?: string): ComponentDefinition[] {
    const components = this.registry.getAll()

    if (!mainCategory) {
      return components
    }

    let filtered = components.filter(comp => comp.mainCategory === mainCategory)

    if (subCategory) {
      filtered = filtered.filter(comp => comp.subCategory === subCategory)
    }

    return filtered
  }

  /**
   * 获取所有分类
   */
  getCategories(): ComponentCategory[] {
    return this.categoryTree
  }
}
