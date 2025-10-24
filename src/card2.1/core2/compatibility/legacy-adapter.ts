/**
 * 向后兼容适配器
 * 确保新 core2 系统与现有 core 系统兼容
 */

import { componentRegistry } from '../registry'
import { DataSourceMapper } from '../data-source'
import { PropertyExposureManager } from '../property'
import { FormGenerator } from '../form'
import { InteractionManager } from '../interaction'

/**
 * 向后兼容适配器类
 * 提供从旧 core 系统到新 core2 系统的平滑过渡
 */
export class LegacyAdapter {
  /**
   * 检查是否已迁移到 core2
   */
  static isMigrated(): boolean {
    try {
      const stats = componentRegistry.getStats()
      return stats.totalComponents > 0
    } catch {
      return false
    }
  }

  /**
   * 获取迁移状态
   */
  static getMigrationStatus(): {
    isMigrated: boolean
    componentCount: number
    dataSourceCount: number
    propertyManagerReady: boolean
    formGeneratorReady: boolean
    interactionManagerReady: boolean
  } {
    try {
      const stats = componentRegistry.getStats()

      return {
        isMigrated: stats.totalComponents > 0,
        componentCount: stats.totalComponents,
        dataSourceCount: stats.multiDataSourceComponents,
        propertyManagerReady: true,
        formGeneratorReady: true,
        interactionManagerReady: true
      }
    } catch {
      return {
        isMigrated: false,
        componentCount: 0,
        dataSourceCount: 0,
        propertyManagerReady: false,
        formGeneratorReady: false,
        interactionManagerReady: false
      }
    }
  }

  /**
   * 提供兼容性警告
   */
  static getCompatibilityWarnings(): string[] {
    const warnings: string[] = []

    // 检查是否使用了旧的核心系统
    if (typeof window !== 'undefined') {
      const oldCore = (window as any).__CARD2_CORE__
      if (oldCore) {
        warnings.push('检测到旧版 core 系统，建议迁移到 core2')
      }
    }

    return warnings
  }

  /**
   * 获取迁移建议
   */
  static getMigrationSuggestions(): {
    priority: 'high' | 'medium' | 'low'
    suggestion: string
    action?: string
  }[] {
    const suggestions: {
      priority: 'high' | 'medium' | 'low'
      suggestion: string
      action?: string
    }[] = []

    // 检查组件注册状态
    const stats = componentRegistry.getStats()
    if (stats.totalComponents === 0) {
      suggestions.push({
        priority: 'high',
        suggestion: '没有注册任何组件，需要重新注册组件',
        action: '调用组件注册函数注册组件'
      })
    }

    // 检查数据源映射
    if (stats.multiDataSourceComponents === 0) {
      suggestions.push({
        priority: 'medium',
        suggestion: '没有多数据源组件，可能需要配置数据源映射'
      })
    }

    return suggestions
  }

  /**
   * 执行迁移检查
   */
  static performMigrationCheck(): {
    status: 'ready' | 'needs-migration' | 'error'
    details: string
    suggestions: string[]
  } {
    const migrationStatus = this.getMigrationStatus()
    const warnings = this.getCompatibilityWarnings()
    const suggestions = this.getMigrationSuggestions()

    if (!migrationStatus.isMigrated) {
      return {
        status: 'needs-migration',
        details: '系统未迁移到 core2，需要执行组件注册',
        suggestions: suggestions.map(s => s.suggestion)
      }
    }

    if (warnings.length > 0 || suggestions.length > 0) {
      return {
        status: 'needs-migration',
        details: '系统已部分迁移，但需要进一步优化',
        suggestions: [...warnings, ...suggestions.map(s => s.suggestion)]
      }
    }

    return {
      status: 'ready',
      details: '系统已完全迁移到 core2',
      suggestions: []
    }
  }

  /**
   * 提供向后兼容的全局导出
   */
  static setupLegacyExports(): void {
    if (typeof window === 'undefined') return

    const win = window as any

    // 提供向后兼容的全局对象
    if (!win.__CARD2_CORE2__) {
      win.__CARD2_CORE2__ = {
        componentRegistry,
        DataSourceMapper,
        PropertyExposureManager,
        FormGenerator,
        InteractionManager,
        getMigrationStatus: this.getMigrationStatus.bind(this),
        getCompatibilityWarnings: this.getCompatibilityWarnings.bind(this),
        performMigrationCheck: this.performMigrationCheck.bind(this)
      }
    }

    // 如果旧系统存在，提供兼容性桥接
    if (win.__CARD2_CORE__) {
      console.warn('[LegacyAdapter] 检测到旧版 core 系统，建议迁移到 core2')

      // 提供兼容性桥接函数
      win.__CARD2_CORE2__.legacyBridge = {
        getComponent: (type: string) => componentRegistry.get(type),
        hasComponent: (type: string) => componentRegistry.has(type),
        getComponentTree: () => componentRegistry.getComponentTree()
      }
    }
  }

  /**
   * 初始化向后兼容性
   */
  static initialize(): void {
    this.setupLegacyExports()
  }
}

/**
 * 默认导出
 */
export default LegacyAdapter