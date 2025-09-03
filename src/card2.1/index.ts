/**
 * @file Card 2.1 系统入口
 * 使用自动注册系统，支持目录扫描和动态加载
 *
 * 📚 开发文档：
 * - README.md - 完整开发指南
 * - AI_MIGRATION_PROMPT.md - AI迁移提示词
 * - AI_PROMPT_TEMPLATE.md - 简化提示词模板
 * - MIGRATION_TODO.md - 迁移进度跟踪
 */

import { componentRegistry } from './core/registry'
import { AutoRegistry } from './core/auto-registry'
import { ComponentLoader } from './core/component-loader'
import { componentDataRequirementsRegistry } from '@/components/visual-editor/core/component-data-requirements'

// 创建自动注册系统
const autoRegistry = new AutoRegistry(componentRegistry)
const componentLoader = new ComponentLoader()

// 初始化状态
let isInitialized = false
let initializationPromise: Promise<void> | null = null

/**
 * 初始化 Card 2.1 系统
 * 自动扫描并注册所有组件
 */
export async function initializeCard2System() {
  if (isInitialized) {
    return
  }

  if (initializationPromise) {
    return initializationPromise
  }

  initializationPromise = (async () => {
    try {

      // 1. 加载组件模块
      const componentModules = await componentLoader.loadComponents()

      // 2. 获取组件统计信息
      const stats = componentLoader.getComponentStats(componentModules)
     
      // 3. 自动注册组件（包含权限过滤）
      const registeredComponents = await autoRegistry.autoRegister(componentModules)

      // 4. 注册预设的数据需求
      componentDataRequirementsRegistry.registerPresets()

      // 6. 获取组件树形结构
      const componentTree = autoRegistry.getComponentTree()

      isInitialized = true
    } catch (error) {
      throw error
    } finally {
      initializationPromise = null
    }
  })()

  return initializationPromise
}

/**
 * 获取组件注册表
 */
export function getComponentRegistry() {
  return componentRegistry
}

/**
 * 获取组件树形结构
 */
export function getComponentTree() {
  if (!isInitialized) {
    return { categories: [], components: [], totalCount: 0 }
  }
  return autoRegistry.getComponentTree()
}

/**
 * 按分类获取组件
 */
export function getComponentsByCategory(mainCategory?: string, subCategory?: string) {
  if (!isInitialized) {
    return []
  }
  return autoRegistry.getComponentsByCategory(mainCategory, subCategory)
}

/**
 * 获取所有分类
 */
export function getCategories() {
  if (!isInitialized) {
    return []
  }
  return autoRegistry.getCategories()
}

/**
 * 重新应用权限过滤
 * 当用户权限发生变化时调用此函数
 */
export function reapplyPermissionFilter() {
  if (!isInitialized) {
    return
  }
  autoRegistry.reapplyPermissionFilter()
}

/**
 * 获取所有组件（包括无权限的，用于调试）
 */
export function getAllComponents() {
  if (!isInitialized) {
    return []
  }
  return autoRegistry.getAllComponents()
}

// 导出核心模块
export { componentRegistry }
export { AutoRegistry, ComponentLoader }
export type { ComponentTree, ComponentCategory } from './core/auto-registry'

// 导出权限相关工具
export * from './core/permission-utils'
export type { ComponentPermission } from './core/types'

// 导出 Hooks
export * from './hooks'

// 默认导出注册表（保持向后兼容）
export default componentRegistry
