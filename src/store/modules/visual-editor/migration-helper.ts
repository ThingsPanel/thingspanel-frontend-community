/**
 * 架构迁移助手
 * 帮助现有组件从旧的分散架构迁移到新的统一架构
 */

import { useVisualEditor } from './index'
import type { UnifiedVisualEditorSystem } from './index'

// 旧架构的数据结构定义（用于迁移识别）
interface LegacyEditorStore {
  nodes?: any[]
  selectedIds?: string[]
  configurations?: Record<string, any>
  widgets?: any[]
  [key: string]: any
}

interface LegacyConfigurationManager {
  getConfiguration?: (id: string) => any
  setConfiguration?: (id: string, config: any) => void
  [key: string]: any
}

/**
 * 迁移状态枚举
 */
export enum MigrationStatus {
  NOT_NEEDED = 'not_needed',
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

/**
 * 迁移结果
 */
export interface MigrationResult {
  status: MigrationStatus
  message: string
  details?: {
    migratedNodes?: number
    migratedConfigurations?: number
    migratedWidgets?: number
    errors?: string[]
    warnings?: string[]
  }
}

/**
 * 架构迁移助手类
 * 🔥 专门处理从旧架构到新架构的迁移
 */
export class ArchitectureMigrationHelper {
  private newSystem: UnifiedVisualEditorSystem
  private migrationStatus: MigrationStatus = MigrationStatus.NOT_NEEDED

  constructor() {
    this.newSystem = useVisualEditor()
    console.log('🔧 [Migration] 架构迁移助手初始化完成')
  }

  // ==================== 迁移检测 ====================

  /**
   * 检查是否需要迁移
   */
  checkMigrationNeeded(): boolean {
    console.log('🔍 [Migration] 检查是否需要迁移')

    // 检查localStorage中是否存在旧的数据
    const legacyKeys = [
      'visual_editor_nodes',
      'visual_editor_config',
      'panel_editor_data',
      'configuration_manager_data'
    ]

    const hasLegacyData = legacyKeys.some(key => {
      const data = localStorage.getItem(key)
      return data && data !== 'null' && data !== '[]' && data !== '{}'
    })

    if (hasLegacyData) {
      this.migrationStatus = MigrationStatus.PENDING
      console.log('⚠️ [Migration] 检测到旧版本数据，需要迁移')
      return true
    }

    // 检查全局变量中是否存在旧的store实例
    if (this.checkLegacyStoreInstances()) {
      this.migrationStatus = MigrationStatus.PENDING
      console.log('⚠️ [Migration] 检测到旧版本store实例，需要迁移')
      return true
    }

    console.log('✅ [Migration] 无需迁移')
    this.migrationStatus = MigrationStatus.NOT_NEEDED
    return false
  }

  /**
   * 检查旧的store实例
   */
  private checkLegacyStoreInstances(): boolean {
    // 检查window对象上是否有旧的store实例
    const windowAny = window as any

    return !!(windowAny.legacyVisualEditorStore || windowAny.legacyConfigurationManager || windowAny.oldPanelData)
  }

  // ==================== 数据迁移 ====================

  /**
   * 执行完整的架构迁移
   */
  async performMigration(): Promise<MigrationResult> {
    console.log('🚀 [Migration] 开始执行架构迁移')

    this.migrationStatus = MigrationStatus.IN_PROGRESS

    const result: MigrationResult = {
      status: MigrationStatus.IN_PROGRESS,
      message: '迁移进行中...',
      details: {
        migratedNodes: 0,
        migratedConfigurations: 0,
        migratedWidgets: 0,
        errors: [],
        warnings: []
      }
    }

    try {
      // 1. 初始化新系统
      await this.newSystem.initialize()
      console.log('✅ [Migration] 新系统初始化完成')

      // 2. 迁移节点数据
      const nodesMigrationResult = await this.migrateNodes()
      result.details!.migratedNodes = nodesMigrationResult.count
      result.details!.errors!.push(...nodesMigrationResult.errors)
      result.details!.warnings!.push(...nodesMigrationResult.warnings)

      // 3. 迁移配置数据
      const configMigrationResult = await this.migrateConfigurations()
      result.details!.migratedConfigurations = configMigrationResult.count
      result.details!.errors!.push(...configMigrationResult.errors)
      result.details!.warnings!.push(...configMigrationResult.warnings)

      // 4. 迁移组件定义
      const widgetsMigrationResult = await this.migrateWidgets()
      result.details!.migratedWidgets = widgetsMigrationResult.count
      result.details!.errors!.push(...widgetsMigrationResult.errors)
      result.details!.warnings!.push(...widgetsMigrationResult.warnings)

      // 5. 清理旧数据
      await this.cleanupLegacyData()

      // 6. 保存迁移结果
      await this.newSystem.saveAll()

      // 7. 验证迁移结果
      const validationResult = await this.validateMigration()
      if (!validationResult.success) {
        result.details!.errors!.push(...validationResult.errors)
        result.details!.warnings!.push(...validationResult.warnings)
      }

      // 确定最终状态
      if (result.details!.errors!.length > 0) {
        this.migrationStatus = MigrationStatus.FAILED
        result.status = MigrationStatus.FAILED
        result.message = `迁移完成但存在 ${result.details!.errors!.length} 个错误`
      } else {
        this.migrationStatus = MigrationStatus.COMPLETED
        result.status = MigrationStatus.COMPLETED
        result.message = '迁移成功完成'
      }

      console.log('🎉 [Migration] 架构迁移完成', result)
      return result
    } catch (error) {
      console.error('💥 [Migration] 架构迁移失败:', error)

      this.migrationStatus = MigrationStatus.FAILED
      result.status = MigrationStatus.FAILED
      result.message = `迁移失败: ${error instanceof Error ? error.message : '未知错误'}`
      result.details!.errors!.push(error instanceof Error ? error.message : '迁移过程中发生未知错误')

      return result
    }
  }

  /**
   * 迁移节点数据
   */
  private async migrateNodes(): Promise<{ count: number; errors: string[]; warnings: string[] }> {
    console.log('🔧 [Migration] 迁移节点数据')

    const errors: string[] = []
    const warnings: string[] = []
    let count = 0

    try {
      // 从localStorage读取旧的节点数据
      const legacyNodesData = localStorage.getItem('visual_editor_nodes')
      if (legacyNodesData) {
        const legacyNodes = JSON.parse(legacyNodesData)

        if (Array.isArray(legacyNodes)) {
          for (const legacyNode of legacyNodes) {
            try {
              // 转换旧节点格式到新格式
              const migratedNode = this.convertLegacyNode(legacyNode)
              await this.newSystem.addNode(migratedNode)
              count++
            } catch (error) {
              const errorMsg = `节点迁移失败 (${legacyNode.id}): ${error instanceof Error ? error.message : '未知错误'}`
              errors.push(errorMsg)
              console.error('❌ [Migration]', errorMsg)
            }
          }
        }
      }

      // 检查全局变量中的节点数据
      const windowAny = window as any
      if (windowAny.legacyVisualEditorStore?.nodes) {
        const globalLegacyNodes = windowAny.legacyVisualEditorStore.nodes

        for (const legacyNode of globalLegacyNodes) {
          try {
            const migratedNode = this.convertLegacyNode(legacyNode)
            await this.newSystem.addNode(migratedNode)
            count++
          } catch (error) {
            errors.push(`全局节点迁移失败 (${legacyNode.id}): ${error instanceof Error ? error.message : '未知错误'}`)
          }
        }
      }

      console.log(`✅ [Migration] 节点迁移完成: ${count} 个节点`)
      return { count, errors, warnings }
    } catch (error) {
      const errorMsg = `节点迁移过程失败: ${error instanceof Error ? error.message : '未知错误'}`
      errors.push(errorMsg)
      console.error('❌ [Migration]', errorMsg)
      return { count, errors, warnings }
    }
  }

  /**
   * 迁移配置数据
   */
  private async migrateConfigurations(): Promise<{ count: number; errors: string[]; warnings: string[] }> {
    console.log('🔧 [Migration] 迁移配置数据')

    const errors: string[] = []
    const warnings: string[] = []
    let count = 0

    try {
      // 迁移localStorage中的配置
      const legacyConfigData = localStorage.getItem('visual_editor_config')
      if (legacyConfigData) {
        const legacyConfigs = JSON.parse(legacyConfigData)

        for (const [widgetId, legacyConfig] of Object.entries(legacyConfigs)) {
          try {
            const migratedConfig = this.convertLegacyConfiguration(legacyConfig)
            this.newSystem.configService.setConfiguration(widgetId, migratedConfig)
            count++
          } catch (error) {
            errors.push(`配置迁移失败 (${widgetId}): ${error instanceof Error ? error.message : '未知错误'}`)
          }
        }
      }

      // 迁移ConfigurationManager数据
      const configManagerData = localStorage.getItem('configuration_manager_data')
      if (configManagerData) {
        const legacyConfigManager = JSON.parse(configManagerData)

        if (legacyConfigManager.configurations) {
          for (const [widgetId, config] of Object.entries(legacyConfigManager.configurations)) {
            try {
              const migratedConfig = this.convertLegacyConfiguration(config)
              this.newSystem.configService.setConfiguration(widgetId, migratedConfig)
              count++
            } catch (error) {
              errors.push(
                `ConfigurationManager配置迁移失败 (${widgetId}): ${error instanceof Error ? error.message : '未知错误'}`
              )
            }
          }
        }
      }

      console.log(`✅ [Migration] 配置迁移完成: ${count} 个配置`)
      return { count, errors, warnings }
    } catch (error) {
      const errorMsg = `配置迁移过程失败: ${error instanceof Error ? error.message : '未知错误'}`
      errors.push(errorMsg)
      console.error('❌ [Migration]', errorMsg)
      return { count, errors, warnings }
    }
  }

  /**
   * 迁移组件定义
   */
  private async migrateWidgets(): Promise<{ count: number; errors: string[]; warnings: string[] }> {
    console.log('🔧 [Migration] 迁移组件定义')

    const errors: string[] = []
    const warnings: string[] = []
    let count = 0

    try {
      // 检查全局注册的组件
      const windowAny = window as any
      if (windowAny.legacyWidgetRegistry) {
        for (const [widgetType, legacyWidget] of Object.entries(windowAny.legacyWidgetRegistry)) {
          try {
            const migratedWidget = this.convertLegacyWidget(legacyWidget)
            this.newSystem.store.registerWidget(migratedWidget)
            count++
          } catch (error) {
            errors.push(`组件迁移失败 (${widgetType}): ${error instanceof Error ? error.message : '未知错误'}`)
          }
        }
      }

      console.log(`✅ [Migration] 组件迁移完成: ${count} 个组件`)
      return { count, errors, warnings }
    } catch (error) {
      const errorMsg = `组件迁移过程失败: ${error instanceof Error ? error.message : '未知错误'}`
      errors.push(errorMsg)
      console.error('❌ [Migration]', errorMsg)
      return { count, errors, warnings }
    }
  }

  // ==================== 数据转换 ====================

  /**
   * 转换旧节点格式到新格式
   */
  private convertLegacyNode(legacyNode: any): any {
    // 基本的节点结构转换
    return {
      id: legacyNode.id || legacyNode.widgetId || `migrated_${Date.now()}`,
      type: legacyNode.type || legacyNode.componentType || 'UnknownWidget',
      position: {
        x: legacyNode.x || legacyNode.position?.x || 0,
        y: legacyNode.y || legacyNode.position?.y || 0
      },
      data: {
        ...legacyNode.data,
        migrated: true,
        originalData: legacyNode
      }
    }
  }

  /**
   * 转换旧配置格式到新格式
   */
  private convertLegacyConfiguration(legacyConfig: any): any {
    return {
      base: {
        title: legacyConfig.title || legacyConfig.name || '',
        opacity: legacyConfig.opacity || 1,
        visible: legacyConfig.visible !== false,
        locked: legacyConfig.locked || false,
        zIndex: legacyConfig.zIndex || 1
      },
      component: {
        properties: legacyConfig.properties || legacyConfig.props || {},
        style: legacyConfig.style || {},
        events: legacyConfig.events || {}
      },
      dataSource: legacyConfig.dataSource
        ? {
            type: legacyConfig.dataSource.type || 'static',
            config: legacyConfig.dataSource.config || {},
            bindings: legacyConfig.dataSource.bindings || {}
          }
        : null,
      interaction: {
        click: legacyConfig.onClick || null,
        hover: legacyConfig.onHover || null,
        focus: legacyConfig.onFocus || null,
        custom: legacyConfig.customEvents || {}
      },
      metadata: {
        migrated: true,
        originalVersion: legacyConfig.version || 'unknown',
        migratedAt: new Date().toISOString()
      }
    }
  }

  /**
   * 转换旧组件定义到新格式
   */
  private convertLegacyWidget(legacyWidget: any): any {
    return {
      type: legacyWidget.type || legacyWidget.name,
      name: legacyWidget.displayName || legacyWidget.name,
      description: legacyWidget.description || '',
      version: legacyWidget.version || '1.0.0',
      component: legacyWidget.component,
      category: legacyWidget.category || 'general',
      mainCategory: legacyWidget.mainCategory || '通用',
      subCategory: legacyWidget.subCategory || '基础',
      icon: legacyWidget.icon || 'WidgetOutline',
      author: legacyWidget.author || 'Unknown',
      permission: legacyWidget.permission || 'public',
      defaultLayout: legacyWidget.defaultLayout || {
        canvas: { width: 300, height: 200 },
        gridstack: { w: 2, h: 1 }
      },
      defaultProperties: legacyWidget.defaultProps || {},
      dataSources: legacyWidget.dataSources || [],
      metadata: {
        migrated: true,
        migratedAt: new Date().toISOString()
      }
    }
  }

  // ==================== 清理和验证 ====================

  /**
   * 清理旧数据
   */
  private async cleanupLegacyData(): Promise<void> {
    console.log('🧹 [Migration] 清理旧数据')

    // 清理localStorage
    const legacyKeys = [
      'visual_editor_nodes',
      'visual_editor_config',
      'panel_editor_data',
      'configuration_manager_data'
    ]

    for (const key of legacyKeys) {
      if (localStorage.getItem(key)) {
        // 先备份到迁移历史
        localStorage.setItem(`${key}_migration_backup`, localStorage.getItem(key)!)
        // 然后删除
        localStorage.removeItem(key)
        console.log(`🗑️ [Migration] 清理localStorage: ${key}`)
      }
    }

    // 清理全局变量
    const windowAny = window as any
    if (windowAny.legacyVisualEditorStore) {
      delete windowAny.legacyVisualEditorStore
    }
    if (windowAny.legacyConfigurationManager) {
      delete windowAny.legacyConfigurationManager
    }
    if (windowAny.oldPanelData) {
      delete windowAny.oldPanelData
    }

    console.log('✅ [Migration] 旧数据清理完成')
  }

  /**
   * 验证迁移结果
   */
  private async validateMigration(): Promise<{ success: boolean; errors: string[]; warnings: string[] }> {
    console.log('🔍 [Migration] 验证迁移结果')

    const errors: string[] = []
    const warnings: string[] = []

    try {
      // 验证系统状态
      const systemStatus = this.newSystem.getStatus()

      if (!systemStatus.initialized) {
        errors.push('新系统未正确初始化')
      }

      if (systemStatus.nodeCount === 0) {
        warnings.push('没有迁移任何节点，可能原本就没有节点数据')
      }

      // 验证配置完整性
      for (const node of this.newSystem.store.nodes) {
        const config = this.newSystem.configService.getConfiguration(node.id)

        if (!config.base) {
          errors.push(`节点 ${node.id} 缺少基础配置`)
        }

        if (!config.component) {
          warnings.push(`节点 ${node.id} 缺少组件配置`)
        }
      }

      const success = errors.length === 0

      console.log('🔍 [Migration] 验证完成:', { success, errors: errors.length, warnings: warnings.length })
      return { success, errors, warnings }
    } catch (error) {
      const errorMsg = `迁移验证失败: ${error instanceof Error ? error.message : '未知错误'}`
      errors.push(errorMsg)
      console.error('❌ [Migration]', errorMsg)
      return { success: false, errors, warnings }
    }
  }

  // ==================== 公共方法 ====================

  /**
   * 获取迁移状态
   */
  getMigrationStatus(): MigrationStatus {
    return this.migrationStatus
  }

  /**
   * 创建迁移备份
   */
  async createBackup(): Promise<void> {
    console.log('💾 [Migration] 创建迁移备份')

    const backupData = {
      timestamp: new Date().toISOString(),
      localStorage: {} as Record<string, string>,
      globalData: {} as Record<string, any>
    }

    // 备份localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (
        key &&
        (key.includes('visual_editor') || key.includes('panel_editor') || key.includes('configuration_manager'))
      ) {
        backupData.localStorage[key] = localStorage.getItem(key)!
      }
    }

    // 备份全局数据
    const windowAny = window as any
    if (windowAny.legacyVisualEditorStore) {
      backupData.globalData.legacyVisualEditorStore = windowAny.legacyVisualEditorStore
    }
    if (windowAny.legacyConfigurationManager) {
      backupData.globalData.legacyConfigurationManager = windowAny.legacyConfigurationManager
    }

    // 保存备份
    localStorage.setItem('architecture_migration_backup', JSON.stringify(backupData))

    console.log('✅ [Migration] 备份创建完成')
  }

  /**
   * 恢复从备份
   */
  async restoreFromBackup(): Promise<boolean> {
    console.log('🔄 [Migration] 从备份恢复')

    try {
      const backupData = localStorage.getItem('architecture_migration_backup')
      if (!backupData) {
        console.warn('⚠️ [Migration] 没有找到备份数据')
        return false
      }

      const backup = JSON.parse(backupData)

      // 恢复localStorage
      for (const [key, value] of Object.entries(backup.localStorage)) {
        localStorage.setItem(key, value as string)
      }

      // 恢复全局数据
      const windowAny = window as any
      for (const [key, value] of Object.entries(backup.globalData)) {
        windowAny[key] = value
      }

      console.log('✅ [Migration] 从备份恢复完成')
      return true
    } catch (error) {
      console.error('❌ [Migration] 备份恢复失败:', error)
      return false
    }
  }
}

// ==================== 导出便捷函数 ====================

let migrationHelperInstance: ArchitectureMigrationHelper | null = null

/**
 * 获取迁移助手实例（单例）
 */
export function useMigrationHelper(): ArchitectureMigrationHelper {
  if (!migrationHelperInstance) {
    migrationHelperInstance = new ArchitectureMigrationHelper()
    console.log('🔧 [Migration] 创建迁移助手实例')
  }

  return migrationHelperInstance
}

/**
 * 快速迁移检查和执行
 */
export async function performQuickMigration(): Promise<MigrationResult> {
  const helper = useMigrationHelper()

  if (helper.checkMigrationNeeded()) {
    console.log('🚀 [Migration] 开始快速迁移')
    await helper.createBackup()
    return await helper.performMigration()
  } else {
    return {
      status: MigrationStatus.NOT_NEEDED,
      message: '无需迁移'
    }
  }
}

/**
 * 重置迁移助手实例（测试用）
 */
export function resetMigrationHelper(): void {
  migrationHelperInstance = null
  console.log('🔧 [Migration] 重置迁移助手实例')
}
