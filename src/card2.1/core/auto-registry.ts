/**
 * Card 2.1 自动注册系统
 * 支持目录扫描、自动分类和树形结构生成
 */

import type { ComponentDefinition, IComponentRegistry } from './types'
import { filterComponentsByPermission, getUserAuthorityFromStorage } from './permission-utils'

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
  private allComponents: ComponentDefinition[] = [] // 存储所有组件（包括无权限的）

  constructor(registry: IComponentRegistry) {
    this.registry = registry
  }

  /**
   * 自动扫描并注册组件
   * @param componentModules 组件模块映射
   */
  async autoRegister(componentModules: Record<string, any>) {
    const registeredComponents: ComponentDefinition[] = []
    const userAuthority = getUserAuthorityFromStorage()
    for (const [componentId, module] of Object.entries(componentModules)) {
      try {
        // 获取默认导出（组件定义）
        const definition = module.default || module

        if (this.isValidComponentDefinition(definition)) {
          // 检查权限
          const hasPermission = this.checkComponentPermission(definition, userAuthority)

          if (hasPermission) {
            // 检查是否应该注册
            if (this.shouldRegisterComponent(definition)) {
              // 自动生成分类信息
              this.autoGenerateCategories(definition)

              // 注册组件
              this.registry.register(componentId, definition)
              registeredComponents.push(definition)
              this.allComponents.push(definition)
            }
          } else {
            // 记录被权限过滤的组件
            this.allComponents.push(definition)
          }
        }
      } catch (error) {}
    }
    return registeredComponents
  }

  /**
   * 检查组件权限
   */
  private checkComponentPermission(definition: ComponentDefinition, userAuthority: string): boolean {
    const permission = definition.permission || '不限'

    // 如果组件权限是"不限"，则所有用户都可以访问
    if (permission === '不限') {
      return true
    }

    // 如果用户权限是"不限"，则不能访问任何有权限限制的组件
    if (userAuthority === '不限') {
      return false
    }

    // 权限等级检查
    const permissionLevels = {
      SYS_ADMIN: 4,
      TENANT_ADMIN: 3,
      TENANT_USER: 2,
      不限: 1
    }

    const componentLevel = permissionLevels[permission]
    const userLevel = permissionLevels[userAuthority as keyof typeof permissionLevels] || 0
    const hasPermission = userLevel >= componentLevel
    return hasPermission
  }

  /**
   * 检查组件是否应该注册
   */
  private shouldRegisterComponent(definition: ComponentDefinition): boolean {
    // 检查注册设置，默认为true（注册）
    const isRegistered = definition.isRegistered !== false // 只有明确设置为false才不注册

    // 特别记录 universal-data-viz 的注册检查
    if (!isRegistered) {
      return false
    }
    return true
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
   * 获取组件树形结构（权限过滤后）
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
   * 获取所有组件（包括无权限的，用于调试）
   */
  getAllComponents(): ComponentDefinition[] {
    return this.allComponents
  }

  /**
   * 按分类获取组件（权限过滤后）
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

  /**
   * 重新应用权限过滤（当用户权限发生变化时调用）
   */
  reapplyPermissionFilter(): void {
    const userAuthority = getUserAuthorityFromStorage()
    // 清空注册表
    this.registry = new (this.registry.constructor as any)()

    // 重新注册有权限的组件
    for (const component of this.allComponents) {
      if (this.checkComponentPermission(component, userAuthority)) {
        this.registry.register(component.type, component)
      }
    }
  }
}
