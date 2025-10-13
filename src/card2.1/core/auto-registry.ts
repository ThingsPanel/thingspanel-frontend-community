/**
 * Card 2.1 自动注册系统
 * 支持目录扫描、自动分类和树形结构生成
 */

import type { ComponentDefinition, IComponentRegistry } from '@/card2.1/core/types'
import { filterComponentsByPermission, getUserAuthorityFromStorage } from '@/card2.1/core/permission-utils'
import { ComponentType } from '@/card2.1/enum'
import { TOP_LEVEL_CATEGORIES, SUB_CATEGORIES, COMPONENT_TO_CATEGORY_MAP } from '@/card2.1/core/category-definition'

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
   * 从文件路径提取组件ID
   * 例如：./system/device-status/access/index.ts → access
   */
  private extractComponentIdFromPath(path: string): string | null {
    const match = path.match(/\/([^/]+)\/index\.ts$/)
    return match ? match[1] : null
  }

  /**
   * 简化的分类映射：根据组件ID查找对应的分类
   */
  private getCategoryFromComponentId(componentId: string): { mainCategory: string; subCategory: string } {
    // 从映射表中查找组件对应的子分类ID
    const subCategoryId = COMPONENT_TO_CATEGORY_MAP[componentId]

    if (subCategoryId) {
      // 根据子分类ID确定主分类
      const subCategoryConfig = SUB_CATEGORIES[subCategoryId]
      if (subCategoryConfig) {
        const mainCategory = subCategoryConfig.parentId === 'system'
          ? 'categories.system'
          : 'categories.chart'

        return {
          mainCategory,
          subCategory: subCategoryConfig.displayName
        }
      }
    }

    // 默认分类
    return {
      mainCategory: 'categories.chart',
      subCategory: 'subCategories.other'
    }
  }

  /**
   * 自动扫描并注册组件
   * @param componentModules 组件模块映射
   */
  async autoRegister(componentModules: Record<string, any>) {
    const registeredComponents: ComponentDefinition[] = []
    const userAuthority = getUserAuthorityFromStorage()

    for (const [componentPath, module] of Object.entries(componentModules)) {
      try {
        // 获取默认导出（组件定义）
        const definition = module.default || module

        if (this.isValidComponentDefinition(definition)) {
          // 从路径提取组件ID
          const componentId = this.extractComponentIdFromPath(componentPath)

          if (!componentId) {
            console.warn(`⚠️ [AutoRegistry] 无法从路径提取组件ID: ${componentPath}`)
            continue
          }

          // 🔥 调试：打印组件信息（开发模式）
          if (import.meta.env.DEV) {
            console.log('🔥 [AutoRegistry] 处理组件:', {
              componentPath,
              componentId,
              componentType: definition.type
            })
          }

          // 简化的分类映射：根据组件ID查找分类
          const categoryInfo = this.getCategoryFromComponentId(componentId)

          // 🔥 调试：打印分类映射结果
          if (import.meta.env.DEV) {
            console.log('🔥 [AutoRegistry] 分类映射结果:', {
              componentId,
              mainCategory: categoryInfo.mainCategory,
              subCategory: categoryInfo.subCategory
            })
          }

          const enhancedDefinition = {
            ...definition,
            mainCategory: categoryInfo.mainCategory,
            subCategory: categoryInfo.subCategory,
            category: `${categoryInfo.mainCategory}/${categoryInfo.subCategory}`,
          }

          // 生成分类信息
          this.autoGenerateCategories(enhancedDefinition)

          // 检查权限
          const hasPermission = this.checkComponentPermission(enhancedDefinition, userAuthority)

          if (hasPermission) {
            // 检查是否应该注册
            if (this.shouldRegisterComponent(enhancedDefinition)) {
              // 注册增强后的组件定义
              this.registry.register(enhancedDefinition)
              registeredComponents.push(enhancedDefinition)
              this.allComponents.push(enhancedDefinition)
            }
          } else {
            // 记录被权限过滤的组件
            this.allComponents.push(enhancedDefinition)
          }
        }
      } catch (error) {
        console.error(`❌ [AutoRegistry] Component registration failed: ${componentPath}`, error)
        // 忽略组件注册过程中的错误，继续处理其他组件
      }
    }

    // 🔥 调试：打印注册总结（开发模式）
    if (import.meta.env.DEV) {
      console.log('✅ [AutoRegistry] 注册完成:', {
        registered: registeredComponents.length,
        total: this.allComponents.length,
        categories: this.categoryTree.map(cat => cat.name)
      })
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
    // 修复：组件实例可以是对象（标准组件）或函数（函数式组件）
    const isComponentValid = definition.component && (typeof definition.component === 'object' || typeof definition.component === 'function');
    return (
      definition &&
      typeof definition.type === 'string' &&
      typeof definition.name === 'string' &&
      isComponentValid
    )
  }

  /**
   * 自动生成分类树
   */
  private autoGenerateCategories(definition: ComponentDefinition) {
    const mainName = definition.mainCategory || 'categories.chart'
    const subName = definition.subCategory

    // 顶层分类
    let mainCat = this.categoryTree.find(cat => cat.id === mainName)
    if (!mainCat) {
      mainCat = { id: mainName, name: mainName }
      this.categoryTree.push(mainCat)
    }

    // 🔥 修复：所有分类都创建子分类，不区分系统/图表
    if (subName) {
      if (!mainCat.children) mainCat.children = []
      let subCat = mainCat.children.find(cat => cat.id === subName)
      if (!subCat) {
        subCat = { id: subName, name: subName }
        mainCat.children.push(subCat)
      }
    }
  }

  /**
   * 获取分类显示名称
   */
  // 旧的显示/描述映射已移除，直接使用分类名称

  /**
   * 获取组件树形结构（权限过滤后）
   */
  getComponentTree(): ComponentTree {
    const components = this.registry.getAll()

    const sortedCategories = [...this.categoryTree].sort((a, b) => {
      const getComponentCount = (categoryName: string) => {
        return components.filter(comp => comp.mainCategory === categoryName).length
      }

      const systemCategoryKey = TOP_LEVEL_CATEGORIES.system.displayName
      const aIsSystem = a.name === systemCategoryKey
      const bIsSystem = b.name === systemCategoryKey
      const systemComponentCount = getComponentCount(systemCategoryKey)

      if (aIsSystem && systemComponentCount > 0) return -1
      if (bIsSystem && systemComponentCount > 0) return 1
      if (aIsSystem && systemComponentCount === 0) return 1
      if (bIsSystem && systemComponentCount === 0) return -1

      if (a.name < b.name) return -1
      if (a.name > b.name) return 1
      return 0
    });

    return {
      categories: sortedCategories,
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
        this.registry.register(component)
      }
    }
  }
}
