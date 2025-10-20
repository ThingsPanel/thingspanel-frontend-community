/**
 * Card2.1 Core2 核心功能导出
 * 简化架构，专注于5个核心功能
 */

// ============ 类型导出 ============
export * from './types'

// ============ 注册系统导出 ============
export * from './registry'

// ============ 数据源系统导出 ============
export * from './data-source'

// ============ 属性系统导出 ============
export * from './property'

// ============ 表单系统导出 ============
export * from './form'

// ============ 交互系统导出 ============
export * from './interaction'

// ============ 工具函数导出 ============
export * from './utils'

// ============ 向后兼容系统导出 ============
export * from './compatibility'

// ============ 系统状态和验证 ============

import { componentRegistry } from './registry'

/**
 * 获取系统状态
 */
export function getCard2CoreStatus(): {
  isInitialized: boolean
  componentCount: number
  registeredComponents: string[]
} {
  const stats = componentRegistry.getStats()

  return {
    isInitialized: stats.totalComponents > 0,
    componentCount: stats.totalComponents,
    registeredComponents: stats.componentTypes
  }
}

/**
 * 验证系统完整性
 */
export function validateCard2Core(): {
  isValid: boolean
  errors: string[]
  warnings: string[]
} {
  const errors: string[] = []
  const warnings: string[] = []

  // 检查组件注册情况
  const stats = componentRegistry.getStats()
  if (stats.totalComponents === 0) {
    errors.push('没有注册任何组件')
  }

  // 检查必要组件
  const requiredComponents = ['dual-data-display', 'triple-data-display']
  requiredComponents.forEach(componentType => {
    if (!componentRegistry.has(componentType)) {
      errors.push(`缺少必要组件: ${componentType}`)
    }
  })

  // 检查多数据源组件
  if (stats.multiDataSourceComponents === 0) {
    warnings.push('没有多数据源组件')
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

// ============ 调试接口（仅在开发环境中启用） ============

import { LegacyAdapter } from './compatibility'

if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  window.__CARD2_DEBUG__ = {
    ComponentRegistry: componentRegistry,
    getCard2CoreStatus,
    validateCard2Core,
    triggerDataUpdate: () => {
      // 这里可以添加实际的数据更新逻辑
    }
  }

  // 全局导出主要函数
  window.card2System = {
    getComponentTree: () => componentRegistry.getComponentTree(),
    getComponentRegistry: () => componentRegistry,
    isInitialized: () => componentRegistry.getStats().totalComponents > 0
  }

  // 初始化向后兼容性
  LegacyAdapter.initialize()
}