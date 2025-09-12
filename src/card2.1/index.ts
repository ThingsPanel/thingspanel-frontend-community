/**
 * @file Card 2.1 系统入口（优化版）
 * 使用优化的初始化管理器，支持智能缓存和避免重复工作
 *
 * 📚 开发文档：
 * - README.md - 完整开发指南
 * - AI_MIGRATION_PROMPT.md - AI迁移提示词
 * - AI_PROMPT_TEMPLATE.md - 简化提示词模板
 * - MIGRATION_TODO.md - 迁移进度跟踪
 */

import { componentRegistry } from '@/card2.1/core/component-registry'
import { AutoRegistry } from '@/card2.1/core/auto-registry'
import { ComponentLoader } from '@/card2.1/core/component-loader'
import { componentDataRequirementsRegistry } from '@/components/visual-editor/core/component-data-requirements'
// 🔥 已移除过度工程化的OptimizedInitializationManager

// ========== 优化版本的初始化系统 ==========

// 创建传统自动注册系统（向后兼容）
const autoRegistry = new AutoRegistry(componentRegistry)
const componentLoader = new ComponentLoader()

// 传统初始化状态（向后兼容）
let isInitialized = false
let initializationPromise: Promise<void> | null = null

/**
 * 初始化 Card 2.1 系统（简化版本）
 * 直接使用传统注册系统，避免过度复杂化
 */
export async function initializeCard2System() {
  if (isInitialized) return

  if (initializationPromise) {
    return initializationPromise
  }

  initializationPromise = (async () => {
    try {
      // 1. 加载组件模块
      const componentModules = await componentLoader.loadComponents()

      // 2. 自动注册组件（包含权限过滤）
      const registeredComponents = await autoRegistry.autoRegister(componentModules)

      // 3. 注册预设的数据需求
      componentDataRequirementsRegistry.registerPresets()

      isInitialized = true
      
      if (process.env.NODE_ENV === 'development') {
        console.log('🚀 Card2.1 System Init Complete', {
          componentCount: registeredComponents.length,
          categoryCount: autoRegistry.getComponentTree().categories.length
        })
      }
    } finally {
      initializationPromise = null
    }
  })()

  return initializationPromise
}

/**
 * 传统初始化方法（向后兼容，已弃用）
 * @deprecated 建议使用 initializeCard2System() 或直接使用 initializeCard2SystemOptimized()
 */
export async function initializeCard2SystemLegacy() {
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
 * 获取组件树形结构（简化版本）
 */
export function getComponentTree() {
  if (!isInitialized) {
    return { components: [], categories: [], totalCount: 0 }
  }
  return autoRegistry.getComponentTree()
}

/**
 * 按分类获取组件（简化版本）
 */
export function getComponentsByCategory(mainCategory?: string, subCategory?: string) {
  if (!isInitialized) {
    return []
  }
  return autoRegistry.getComponentsByCategory(mainCategory, subCategory)
}

/**
 * 获取所有分类（简化版本）
 */
export function getCategories() {
  if (!isInitialized) {
    return []
  }
  return autoRegistry.getAllCategories()
}

/**
 * 重新应用权限过滤（简化版本）
 * 当用户权限发生变化时调用此函数
 */
export async function reapplyPermissionFilter() {
  // 简化实现：直接重新初始化
  isInitialized = false
  await initializeCard2System()
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

// ========== 核心模块导出 ==========

// 🔥 已移除过度复杂的OptimizedInitializationManager
// 如需高级缓存功能，建议在应用层实现，而非组件系统内部

// 传统模块导出（向后兼容）
export { componentRegistry }
export { AutoRegistry, ComponentLoader }
export type { ComponentTree, ComponentCategory } from '@/card2.1/core/auto-registry'

// 导出权限相关工具
export * from '@/card2.1/core/permission-utils'
export type { ComponentPermission } from '@/card2.1/types'

// 导出 Hooks
export * from '@/card2.1/hooks'

// ========== 简化的工具方法导出 ==========

/**
 * 获取系统初始化状态
 */
export function getInitializationState() {
  return {
    isInitialized,
    componentCount: isInitialized ? autoRegistry.getAllComponents().length : 0,
    categories: isInitialized ? autoRegistry.getAllCategories() : []
  }
}

/**
 * 清除缓存（强制重新初始化）
 */
export function clearInitializationCache() {
  isInitialized = false
  initializationPromise = null
}

/**
 * 检查组件更新（简化版）
 */
export async function checkForComponentUpdates() {
  // 简化实现：总是返回true，让调用方决定是否重新初始化
  return !isInitialized
}

// 默认导出注册表（保持向后兼容）
export default componentRegistry
