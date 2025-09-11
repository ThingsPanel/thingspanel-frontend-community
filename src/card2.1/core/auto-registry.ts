/**
 * Card 2.1 自动注册系统
 * 支持目录扫描、自动分类和树形结构生成
 */

import type { ComponentDefinition, IComponentRegistry } from '@/card2.1/core/types'
import { filterComponentsByPermission, getUserAuthorityFromStorage } from '@/card2.1/core/permission-utils'

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

    // 导入分类映射函数
    const { getCategoryDisplayName } = await import('@/card2.1/components/category-mapping')

    for (const [componentId, module] of Object.entries(componentModules)) {
      try {
        // 🔥 调试：检查模块导出的内容
        if (process.env.NODE_ENV === 'development') {
          console.log(`🔍 [AutoRegistry] 模块内容详细检查: ${componentId}`, {
            moduleKeys: Object.keys(module),
            hasDefault: 'default' in module,
            defaultValue: module.default,
            defaultType: typeof module.default,
            fullModule: module
          })
        }

        // 获取默认导出（组件定义）
        const definition = module.default || module

        if (process.env.NODE_ENV === 'development') {
          console.log(`🔍 [AutoRegistry] 组件定义检查: ${componentId}`, {
            definition,
            definitionType: typeof definition,
            definitionKeys: definition ? Object.keys(definition) : [],
            hasType: definition?.type,
            hasName: definition?.name,
            hasComponent: definition?.component,
            hasConfig: definition?.config
          })
        }

        if (this.isValidComponentDefinition(definition)) {
          // 🚨 CRITICAL: 从路径提取分类信息并覆盖组件定义中的分类
          const folderPath = this.extractFolderFromComponentId(componentId)
          const categoryName = getCategoryDisplayName(folderPath)

          // 🔥 强制覆盖组件定义的分类字段
          const enhancedDefinition = {
            ...definition,
            category: categoryName, // 使用文件夹路径确定的分类名称
            mainCategory: categoryName,
            folderPath: folderPath // 保留原始路径信息用于调试
          }

          if (process.env.NODE_ENV === 'development') {
            console.log(`🔧 [AutoRegistry] 组件分类映射: ${componentId}`, {
              folderPath,
              categoryName,
              originalCategory: definition.category,
              newCategory: categoryName
            })
          }

          // 检查权限
          const hasPermission = this.checkComponentPermission(enhancedDefinition, userAuthority)

          if (hasPermission) {
            // 检查是否应该注册
            if (this.shouldRegisterComponent(enhancedDefinition)) {
              // 自动生成分类信息（使用增强后的定义）
              this.autoGenerateCategories(enhancedDefinition)

              // 注册增强后的组件定义
              this.registry.register(enhancedDefinition)
              registeredComponents.push(enhancedDefinition)
              this.allComponents.push(enhancedDefinition)

              if (process.env.NODE_ENV === 'development') {
                console.log(`✅ [AutoRegistry] 组件注册成功: ${componentId}`, {
                  originalDefinition: definition,
                  enhancedDefinition,
                  folderPath,
                  categoryName,
                  registeredComponentsCount: registeredComponents.length
                })
              }
          } else {
            // 记录被权限过滤的组件
            this.allComponents.push(enhancedDefinition)
          }
        }
      } catch (error) {
        console.warn(`[AutoRegistry] 组件注册失败: ${componentId}`, error)
        // 忽略组件注册过程中的错误，继续处理其他组件
      }
    }
    return registeredComponents
  }

  /**
   * 从组件ID提取文件夹路径
   * @param componentId 组件ID，如 "alarm-count"
   * @returns 文件夹名，如 "alarm"
   */
  private extractFolderFromComponentId(componentId: string): string {
    // alarm-count -> alarm
    // access-num -> statistics
    // simple-display -> test

    // 根据组件ID推断文件夹路径的映射关系
    const componentFolderMap: Record<string, string> = {
      'alarm-count': 'alarm',
      'alarm-info': 'alarm',
      'access-num': 'statistics',
      'app-download': 'statistics',
      'simple-display': 'test',
      'dual-data-display': 'test',
      'triple-data-display': 'test',
      'gauge-dashboard-v2': 'dashboard'  // 🔥 修复：添加仪表盘组件映射
    }

    // 首先尝试直接映射
    if (componentFolderMap[componentId]) {
      return componentFolderMap[componentId]
    }

    // 如果没有直接映射，尝试从组件ID推断（取第一个单词）
    const parts = componentId.split('-')
    const firstPart = parts[0]

    // 常见的文件夹映射
    const folderMap: Record<string, string> = {
      alarm: 'alarm',
      access: 'statistics',
      app: 'statistics',
      simple: 'test',
      dual: 'test',
      triple: 'test',
      data: 'data',
      chart: 'data',
      control: 'control',
      info: 'information',
      device: 'device',
      location: 'location',
      media: 'media',
      dashboard: 'dashboard'
    }

    return folderMap[firstPart] || 'test' // 默认归到test分类
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
        this.registry.register(component)
      }
    }
  }
}
