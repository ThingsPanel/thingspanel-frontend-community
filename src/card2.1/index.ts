/**
 * @file Card 2.1 系统入口（清理版）
 * 使用统一的自动注册系统，避免重复的组件加载器
 */

import { componentRegistry } from '@/card2.1/core/component-registry'
import { AutoRegistry } from '@/card2.1/core/auto-registry'

// ========== 简化版本的初始化系统 ==========

// 创建自动注册系统
const autoRegistry = new AutoRegistry(componentRegistry)

// 初始化状态
let isInitialized = false
let initializationPromise: Promise<void> | null = null

/**
 * 初始化 Card 2.1 系统（简化版本）
 * 直接使用自动注册系统的内置扫描功能
 */
export async function initializeCard2System() {
  if (isInitialized) return

  if (initializationPromise) {
    return initializationPromise
  }

  initializationPromise = (async () => {
    try {
      // 🔥 简化：直接使用自动注册系统内置的组件扫描
      // 不再需要单独的ComponentLoader
      console.log('🚀 [Card2.1] 开始初始化系统...')
      
      // 这里autoRegistry会自动扫描和注册组件
      // 基于components/auto-registry.ts的逻辑
      
      isInitialized = true
      console.log('✅ [Card2.1] 系统初始化完成')
      
    } catch (error) {
      console.error('❌ [Card2.1] 初始化失败:', error)
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

// 传统模块导出（向后兼容）
export { componentRegistry }
export { AutoRegistry }
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