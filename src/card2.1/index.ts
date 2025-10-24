/**
 * @file Card 2.1 系统入口（切换到 Core2 版本）
 * 使用新的 Core2 系统，保持向后兼容性
 */

import { core2Bridge, initializeCore2System } from '@/card2.1/core2-adapter'

// 向后兼容：保留旧系统的导入（不删除原有 core 系统）
import { componentRegistry } from '@/card2.1/core2/registry'
import { AutoRegistry } from '@/card2.1/core2/registry'
import { setupStorageListener } from '@/card2.1/core2/utils'

// ========== 切换到 Core2 系统的初始化 ==========

// 初始化状态
let isInitialized = false
let initializationPromise: Promise<void> | null = null

/**
 * 初始化 Card 2.1 系统（切换到 Core2 版本）
 * 使用新的 Core2 系统，保持向后兼容性
 */
export async function initializeCard2System() {
  if (isInitialized) return

  if (initializationPromise) {
    return initializationPromise
  }

  initializationPromise = (async () => {
    try {
      await initializeCore2System()

      isInitialized = true
    } catch (err) {
      throw err
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
  return core2Bridge.getComponentRegistry()
}

/**
 * 获取组件树形结构（使用 Core2 系统）
 */
export function getComponentTree() {
  if (!isInitialized) {
    return { components: [], categories: [], totalCount: 0 }
  }
  return core2Bridge.getComponentTree()
}

/**
 * 按分类获取组件（使用 Core2 系统）
 */
export async function getComponentsByCategory(mainCategory?: string, subCategory?: string) {
  if (!isInitialized) {
    return []
  }
  return core2Bridge.getComponentsByCategory(mainCategory, subCategory)
}

/**
 * 获取所有分类（使用 Core2 系统）
 */
export function getCategories() {
  if (!isInitialized) {
    return []
  }
  return core2Bridge.getCategories()
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
  return core2Bridge.getComponentRegistry().getAll()
}

// ========== 核心模块导出 ==========

// 传统模块导出（向后兼容）
export { componentRegistry }
export { AutoRegistry }
export type { ComponentTree, ComponentCategory } from '@/card2.1/core2/registry'

// 导出权限相关工具
export * from '@/card2.1/core2/utils'
export type { ComponentPermission } from '@/card2.1/types'

// 导出 Hooks
export * from '@/card2.1/hooks'

// ========== 简化的工具方法导出 ==========

/**
 * 获取系统初始化状态
 */
export function getInitializationState() {
  if (!isInitialized) {
    return {
      isInitialized,
      componentCount: 0,
      categories: []
    }
  }
  return core2Bridge.getInitializationState()
}

/**
 * 清除缓存（强制重新初始化）
 */
export function clearInitializationCache() {
  isInitialized = false
  initializationPromise = null
  core2Bridge.clearCache()
}

/**
 * 检查组件更新（简化版）
 */
export async function checkForComponentUpdates() {
  // 简化实现：总是返回true，让调用方决定是否重新初始化
  return !isInitialized
}

// 默认导出注册表（保持向后兼容）
export default core2Bridge.getComponentRegistry()
