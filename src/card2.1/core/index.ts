/**
 * Card2.1 核心功能导出
 */

export * from '@/card2.1/core/types'
export * from '@/card2.1/core/registry'
export * from '@/card2.1/core/interaction-types'
export * from '@/card2.1/core/interaction-manager'

// 🔥 新增：组件注册表和数据源映射器
export * from '@/card2.1/core/component-registry'
export * from '@/card2.1/core/data-source-mapper'

// 数据源中心相关导出
export * from '@/card2.1/core/data-source-center'
export * from '@/card2.1/core/data-sources'

// 初始化数据源系统
import { initializeDataSources } from '@/card2.1/core/data-sources'
// 🔥 新增：导入组件注册表初始化
import { ComponentRegistry } from '@/card2.1/core/component-registry'
// 导入数据源映射器用于调试
import { DataSourceMapper } from '@/card2.1/core/data-source-mapper'

// 自动初始化数据源
initializeDataSources()

// 🔥 新增：初始化组件注册表

// 🔥 新增：调试接口（仅在开发环境中启用）
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  window.__CARD2_DEBUG__ = {
    ComponentRegistry,
    DataSourceMapper,
    getCard2CoreStatus,
    validateCard2Core,
    triggerDataUpdate: () => {
      // 这里可以添加实际的数据更新逻辑
    }
  }
}

/**
 * 获取系统状态
 */
export function getCard2CoreStatus(): {
  isInitialized: boolean
  componentCount: number
  registeredComponents: string[]
} {
  const stats = ComponentRegistry.getStats()

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
  const stats = ComponentRegistry.getStats()
  if (stats.totalComponents === 0) {
    errors.push('没有注册任何组件')
  }

  // 检查必要组件
  const requiredComponents = ['dual-data-display', 'triple-data-display']
  requiredComponents.forEach(componentType => {
    if (!ComponentRegistry.has(componentType)) {
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
