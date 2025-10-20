/**
 * Card 2.1 自动注册系统
 * 简化的组件自动注册和分类系统
 */

import type { ComponentDefinition, ComponentTree } from '../types'
import { ComponentRegistry } from './component-registry'
import { getCategoryFromComponentId } from './category-definition'
import { checkComponentPermission } from '../utils/permission'

/**
 * 自动注册系统类
 */
export class AutoRegistry {
  private registry: ComponentRegistry
  private categoryTree: any[] = []

  constructor(registry: ComponentRegistry) {
    this.registry = registry
  }

  /**
   * 从文件路径提取组件ID
   */
  private extractComponentIdFromPath(path: string): string | null {
    const match = path.match(/\/([^/]+)\/index\.ts$/)
    return match ? match[1] : null
  }

  /**
   * 验证组件定义是否有效
   */
  private isValidComponentDefinition(definition: any): definition is ComponentDefinition {
    const isComponentValid = definition.component &&
      (typeof definition.component === 'object' || typeof definition.component === 'function')

    return (
      definition &&
      typeof definition.type === 'string' &&
      typeof definition.name === 'string' &&
      isComponentValid
    )
  }

  /**
   * 检查组件是否应该注册
   */
  private shouldRegisterComponent(definition: ComponentDefinition): boolean {
    // 检查注册设置，默认为true（注册）
    return definition.isRegistered !== false // 只有明确设置为false才不注册
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
      mainCat = { id: mainName, name: mainName, children: [] }
      this.categoryTree.push(mainCat)
    }

    // 子分类
    if (subName) {
      let subCat = mainCat.children.find((cat: any) => cat.id === subName)
      if (!subCat) {
        subCat = { id: subName, name: subName }
        mainCat.children.push(subCat)
      }
    }
  }

  /**
   * 自动扫描并注册组件
   */
  async autoRegister(componentModules: Record<string, any>) {
    const registeredComponents: ComponentDefinition[] = []

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

          // 调试信息
          if (import.meta.env.DEV) {
            console.log('🔥 [AutoRegistry] 处理组件:', {
              componentPath,
              componentId,
              componentType: definition.type
            })
          }

          // 根据组件ID获取分类信息
          const categoryInfo = getCategoryFromComponentId(componentId)

          // 调试分类映射结果
          if (import.meta.env.DEV) {
            console.log('🔥 [AutoRegistry] 分类映射结果:', {
              componentId,
              mainCategory: categoryInfo.mainCategory,
              subCategory: categoryInfo.subCategory
            })
          }

          // 增强组件定义
          const enhancedDefinition = {
            ...definition,
            mainCategory: categoryInfo.mainCategory,
            subCategory: categoryInfo.subCategory,
            category: `${categoryInfo.mainCategory}/${categoryInfo.subCategory}`,
          }

          // 生成分类信息
          this.autoGenerateCategories(enhancedDefinition)

          // 检查权限
          const hasPermission = checkComponentPermission(enhancedDefinition)

          if (hasPermission && this.shouldRegisterComponent(enhancedDefinition)) {
            // 注册组件
            this.registry.register(enhancedDefinition)
            registeredComponents.push(enhancedDefinition)
          }
        }
      } catch (error) {
        console.error(`❌ [AutoRegistry] 组件注册失败: ${componentPath}`, error)
        // 忽略组件注册过程中的错误，继续处理其他组件
      }
    }

    // 调试总结
    if (import.meta.env.DEV) {
      console.log('✅ [AutoRegistry] 注册完成:', {
        registered: registeredComponents.length,
        categories: this.categoryTree.map(cat => cat.name)
      })
    }

    return registeredComponents
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
   * 获取所有组件
   */
  getAllComponents(): ComponentDefinition[] {
    return this.registry.getAll()
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
  getCategories(): any[] {
    return this.categoryTree
  }

  /**
   * 重新应用权限过滤（当用户权限发生变化时调用）
   */
  reapplyPermissionFilter(): void {
    // 清空注册表
    this.registry.clear()

    // 重新注册有权限的组件
    const allComponents = this.getAllComponents()
    for (const component of allComponents) {
      if (checkComponentPermission(component)) {
        this.registry.register(component)
      }
    }
  }
}

/**
 * 默认导出
 */
export default AutoRegistry