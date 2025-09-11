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
import {
  optimizedInitializationManager,
  initializeCard2SystemOptimized,
  getOptimizedComponentTree,
  getOptimizedComponentsByCategory,
  getOptimizedCategories
} from './core/OptimizedInitializationManager'

// ========== 优化版本的初始化系统 ==========

// 创建传统自动注册系统（向后兼容）
const autoRegistry = new AutoRegistry(componentRegistry)
const componentLoader = new ComponentLoader()

// 传统初始化状态（向后兼容）
let isInitialized = false
let initializationPromise: Promise<void> | null = null

/**
 * 初始化 Card 2.1 系统（优化版本）
 * 使用智能缓存避免重复工作，自动扫描并注册所有组件
 */
export async function initializeCard2System() {
  // 🔥 优化：使用新的优化初始化管理器
  await initializeCard2SystemOptimized()

  // 🔥 向后兼容：同步传统状态
  isInitialized = true

  // 返回兼容性信息
  const stats = optimizedInitializationManager.getCacheStats()
  if (process.env.NODE_ENV === 'development') {
    console.log('✅ [Card2.1] 系统初始化完成（优化版）:', {
      componentCount: stats.componentCount,
      cacheAge: stats.cacheAge,
      userAuthority: stats.userAuthority
    })
  }
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
 * 获取组件树形结构（优化版本）
 */
export function getComponentTree() {
  // 🔥 优化：优先使用缓存的组件树
  return getOptimizedComponentTree()
}

/**
 * 按分类获取组件（优化版本）
 */
export function getComponentsByCategory(mainCategory?: string, subCategory?: string) {
  // 🔥 优化：使用缓存的分类组件
  return getOptimizedComponentsByCategory(mainCategory, subCategory)
}

/**
 * 获取所有分类（优化版本）
 */
export function getCategories() {
  // 🔥 优化：使用缓存的分类信息
  return getOptimizedCategories()
}

/**
 * 重新应用权限过滤（优化版本）
 * 当用户权限发生变化时调用此函数
 */
export async function reapplyPermissionFilter() {
  // 🔥 优化：使用智能权限过滤重新应用
  await optimizedInitializationManager.reapplyPermissionFilter()
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

// 优化的初始化管理器导出
export {
  optimizedInitializationManager,
  initializeCard2SystemOptimized,
  getOptimizedComponentTree,
  getOptimizedComponentsByCategory,
  getOptimizedCategories
} from './core/OptimizedInitializationManager'

// 传统模块导出（向后兼容）
export { componentRegistry }
export { AutoRegistry, ComponentLoader }
export type { ComponentTree, ComponentCategory } from '@/card2.1/core/auto-registry'

// 导出权限相关工具
export * from '@/card2.1/core/permission-utils'
export type { ComponentPermission } from '@/card2.1/types'

// 导出 Hooks
export * from '@/card2.1/hooks'

// ========== 工具方法导出 ==========

/**
 * 获取系统初始化状态
 */
export function getInitializationState() {
  return optimizedInitializationManager.getInitializationState()
}

/**
 * 获取缓存统计信息
 */
export function getCacheStats() {
  return optimizedInitializationManager.getCacheStats()
}

/**
 * 清除缓存（强制重新初始化）
 */
export function clearInitializationCache() {
  optimizedInitializationManager.clearCache()
}

/**
 * 预热缓存（在应用启动时调用）
 */
export async function warmupInitializationCache() {
  await optimizedInitializationManager.warmupCache()
}

/**
 * 检查组件更新
 */
export async function checkForComponentUpdates() {
  return await optimizedInitializationManager.checkForUpdates()
}

/**
 * 执行增量更新
 */
export async function performIncrementalUpdate() {
  await optimizedInitializationManager.incrementalUpdate()
}

// 默认导出注册表（保持向后兼容）
export default componentRegistry
