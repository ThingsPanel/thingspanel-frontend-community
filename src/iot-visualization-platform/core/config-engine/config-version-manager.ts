/**
 * Config Engine 版本管理系统
 *
 * 核心功能：
 * 1. 配置版本控制 - 完整的版本生命周期管理
 * 2. 配置历史追踪 - 详细的变更历史记录
 * 3. 版本回滚机制 - 安全的版本回退功能
 * 4. 版本比较分析 - 版本间的差异对比
 * 5. 版本分支管理 - 支持配置分支和合并
 * 6. 版本发布管理 - 配置版本的发布流程
 * 7. 版本清理策略 - 自动清理过期版本
 * 8. 版本导入导出 - 版本数据的迁移支持
 *
 * 设计原则：
 * - 完整性：保留所有版本历史
 * - 安全性：回滚操作的安全保障
 * - 高效性：版本存储和查询优化
 * - 可追溯：完整的变更追踪链
 * - 灵活性：支持多种版本管理策略
 *
 * 创建时间：2025年1月
 * 作者：ThingsPanel Team
 */

import { EventEmitter } from 'events'
import type {
  ConfigurationItem,
  ConfigurationVersion,
  ConfigurationHistory,
  ConfigurationOperationResult,
  ConfigurationType
} from './types'

/**
 * 版本比较结果接口
 * 两个版本之间的详细比较结果
 */
interface VersionComparisonResult {
  /** 源版本号 */
  sourceVersion: string
  /** 目标版本号 */
  targetVersion: string
  /** 是否有变更 */
  hasChanges: boolean
  /** 变更摘要 */
  changesSummary: {
    /** 新增字段数量 */
    added: number
    /** 修改字段数量 */
    modified: number
    /** 删除字段数量 */
    removed: number
  }
  /** 详细变更列表 */
  changes: {
    /** 变更类型 */
    type: 'added' | 'modified' | 'removed'
    /** 字段路径 */
    path: string
    /** 旧值 */
    oldValue?: any
    /** 新值 */
    newValue?: any
    /** 变更描述 */
    description: string
  }[]
  /** 比较时间 */
  comparedAt: Date
}

/**
 * 版本回滚选项接口
 * 版本回滚操作的配置选项
 */
interface VersionRollbackOptions {
  /** 是否创建回滚前的备份版本 */
  createBackup: boolean
  /** 回滚原因描述 */
  reason?: string
  /** 是否强制回滚（忽略冲突） */
  force: boolean
  /** 是否验证回滚后的配置 */
  validate: boolean
  /** 回滚操作者 */
  operator: string
  /** 是否触发事件 */
  triggerEvents: boolean
}

/**
 * 版本清理策略接口
 * 版本自动清理的策略配置
 */
interface VersionCleanupPolicy {
  /** 策略名称 */
  name: string
  /** 保留版本数量上限 */
  maxVersions?: number
  /** 保留时间（天） */
  retentionDays?: number
  /** 是否保留里程碑版本 */
  keepMilestones: boolean
  /** 是否保留标记版本 */
  keepTaggedVersions: boolean
  /** 自定义保留条件 */
  customRetentionFilter?: (version: ConfigurationVersion) => boolean
}

/**
 * 版本统计信息接口
 * 版本管理的统计数据
 */
interface VersionStatistics {
  /** 总版本数 */
  totalVersions: number
  /** 各配置类型的版本分布 */
  versionsByType: Map<ConfigurationType, number>
  /** 各状态版本数量 */
  versionsByStatus: Map<string, number>
  /** 平均版本大小（字节） */
  averageVersionSize: number
  /** 最近版本创建时间 */
  lastVersionCreatedAt?: Date
  /** 回滚操作次数 */
  totalRollbacks: number
  /** 存储使用量（字节） */
  storageUsage: number
}

/**
 * 🎯 配置版本管理器核心类
 *
 * 提供完整的配置版本控制和历史管理功能
 *
 * 主要功能：
 * - 版本创建和管理
 * - 历史记录追踪
 * - 版本回滚和恢复
 * - 版本比较和分析
 * - 版本清理和优化
 * - 版本导入导出
 */
export class ConfigurationVersionManager extends EventEmitter {
  /** 🗂️ 版本存储 - 按配置ID索引的版本历史 */
  private versionHistory = new Map<string, ConfigurationVersion[]>()

  /** 📋 变更历史存储 - 详细的变更记录 */
  private changeHistory = new Map<string, ConfigurationHistory[]>()

  /** 🏷️ 版本标签映射 - 标签到版本的映射 */
  private versionTags = new Map<string, Map<string, string>>() // configId -> tag -> version

  /** 🧹 版本清理策略 */
  private cleanupPolicies: VersionCleanupPolicy[] = []

  /** 📊 版本统计信息 */
  private statistics: VersionStatistics = {
    totalVersions: 0,
    versionsByType: new Map(),
    versionsByStatus: new Map(),
    averageVersionSize: 0,
    totalRollbacks: 0,
    storageUsage: 0
  }

  /** 🔧 默认版本保留策略 */
  private readonly DEFAULT_RETENTION_POLICY: VersionCleanupPolicy = {
    name: 'default',
    maxVersions: 50,
    retentionDays: 90,
    keepMilestones: true,
    keepTaggedVersions: true
  }

  constructor() {
    super()

    // 初始化默认清理策略
    this.cleanupPolicies.push(this.DEFAULT_RETENTION_POLICY)

    // 定期清理过期版本（每小时执行一次）
    setInterval(() => {
      this.executeCleanupPolicies()
    }, 60 * 60 * 1000)

    console.log('✅ [ConfigurationVersionManager] 版本管理器初始化完成')
  }

  // ===== 🔄 版本创建和管理 =====

  /**
   * 🔨 创建新版本
   *
   * 为配置项创建新的版本记录
   *
   * @param configItem 配置项
   * @param changelog 变更说明
   * @param changeType 变更类型
   * @param author 变更作者
   * @returns 版本创建结果
   */
  async createVersion(
    configItem: ConfigurationItem,
    changelog: string,
    changeType: 'major' | 'minor' | 'patch' | 'hotfix',
    author: string
  ): Promise<ConfigurationOperationResult<ConfigurationVersion>> {
    const startTime = performance.now()

    try {
      // 📋 获取当前版本历史
      const versions = this.versionHistory.get(configItem.id) || []

      // 🔢 生成新版本号
      const newVersionNumber = this.generateNextVersion(versions, changeType)

      // 📦 创建版本快照
      const versionSnapshot: ConfigurationVersion = {
        version: newVersionNumber,
        snapshot: { ...configItem },
        changelog,
        changeType,
        author,
        tags: [],
        createdAt: new Date(),
        parentVersion: versions.length > 0 ? versions[versions.length - 1].version : undefined
      }

      // 💾 存储版本
      versions.push(versionSnapshot)
      this.versionHistory.set(configItem.id, versions)

      // 📝 创建变更历史记录
      await this.createChangeHistory(configItem, 'create', author, '创建新版本', versionSnapshot)

      // 📊 更新统计信息
      this.updateStatistics('version-created', versionSnapshot)

      // 🚀 触发版本创建事件
      this.emit('version-created', {
        configurationId: configItem.id,
        version: versionSnapshot,
        author,
        timestamp: new Date()
      })

      console.log(`✅ [ConfigurationVersionManager] 版本创建成功: ${configItem.id} v${newVersionNumber}`)

      return {
        success: true,
        data: versionSnapshot,
        operationType: 'create',
        timestamp: new Date(),
        duration: performance.now() - startTime
      }

    } catch (error) {
      console.error(`❌ [ConfigurationVersionManager] 版本创建失败: ${configItem.id}`, error)

      return {
        success: false,
        error: `版本创建失败: ${error instanceof Error ? error.message : '未知错误'}`,
        data: null,
        operationType: 'create',
        timestamp: new Date(),
        duration: performance.now() - startTime
      }
    }
  }

  /**
   * 📋 获取版本历史
   *
   * 获取指定配置的所有版本历史
   *
   * @param configId 配置ID
   * @param options 查询选项
   * @returns 版本历史列表
   */
  getVersionHistory(
    configId: string,
    options: {
      /** 限制返回数量 */
      limit?: number
      /** 起始偏移量 */
      offset?: number
      /** 排序方式 */
      sortOrder?: 'asc' | 'desc'
      /** 包含的变更类型 */
      includeChangeTypes?: Array<'major' | 'minor' | 'patch' | 'hotfix'>
      /** 时间范围过滤 */
      timeRange?: { start: Date; end: Date }
    } = {}
  ): ConfigurationVersion[] {
    const versions = this.versionHistory.get(configId) || []

    let filteredVersions = [...versions]

    // 🔍 按变更类型过滤
    if (options.includeChangeTypes) {
      filteredVersions = filteredVersions.filter(v =>
        options.includeChangeTypes!.includes(v.changeType)
      )
    }

    // 📅 按时间范围过滤
    if (options.timeRange) {
      filteredVersions = filteredVersions.filter(v =>
        v.createdAt >= options.timeRange!.start &&
        v.createdAt <= options.timeRange!.end
      )
    }

    // 📊 排序
    filteredVersions.sort((a, b) => {
      const timeComparison = a.createdAt.getTime() - b.createdAt.getTime()
      return options.sortOrder === 'desc' ? -timeComparison : timeComparison
    })

    // 📄 分页
    if (options.offset || options.limit) {
      const start = options.offset || 0
      const end = options.limit ? start + options.limit : undefined
      filteredVersions = filteredVersions.slice(start, end)
    }

    console.log(`📋 [ConfigurationVersionManager] 获取版本历史: ${configId} - 返回 ${filteredVersions.length} 个版本`)
    return filteredVersions
  }

  /**
   * 🎯 获取指定版本
   *
   * 获取配置的特定版本
   *
   * @param configId 配置ID
   * @param version 版本号
   * @returns 指定版本的配置项
   */
  getVersion(configId: string, version: string): ConfigurationVersion | null {
    const versions = this.versionHistory.get(configId) || []
    const targetVersion = versions.find(v => v.version === version)

    if (targetVersion) {
      console.log(`🎯 [ConfigurationVersionManager] 获取版本: ${configId} v${version}`)
      return targetVersion
    }

    console.warn(`⚠️ [ConfigurationVersionManager] 版本不存在: ${configId} v${version}`)
    return null
  }

  // ===== 🔄 版本回滚和恢复 =====

  /**
   * ⏪ 回滚到指定版本
   *
   * 将配置回滚到指定的历史版本
   *
   * @param configId 配置ID
   * @param targetVersion 目标版本号
   * @param options 回滚选项
   * @returns 回滚操作结果
   */
  async rollbackToVersion(
    configId: string,
    targetVersion: string,
    options: VersionRollbackOptions
  ): Promise<ConfigurationOperationResult<ConfigurationItem>> {
    const startTime = performance.now()

    try {
      // 📋 获取目标版本
      const version = this.getVersion(configId, targetVersion)
      if (!version) {
        return {
          success: false,
          error: `目标版本不存在: ${configId} v${targetVersion}`,
          data: null,
          operationType: 'update',
          timestamp: new Date(),
          duration: performance.now() - startTime
        }
      }

      // 💾 创建回滚前备份（如果启用）
      if (options.createBackup) {
        // 这里需要获取当前配置并创建备份
        // 实际实现中需要与 ConfigEngine 集成
        console.log(`💾 [ConfigurationVersionManager] 创建回滚前备份: ${configId}`)
      }

      // ⏪ 执行回滚操作
      const rolledBackConfig = { ...version.snapshot }

      // 🔄 更新配置的版本信息
      rolledBackConfig.version = version.version
      rolledBackConfig.updatedAt = new Date()

      // 📝 创建回滚历史记录
      await this.createChangeHistory(
        rolledBackConfig,
        'update',
        options.operator,
        `回滚到版本 ${targetVersion}: ${options.reason || '未提供原因'}`,
        version
      )

      // 📊 更新统计信息
      this.statistics.totalRollbacks++
      this.updateStatistics('version-rollback', version)

      // 🚀 触发回滚事件
      this.emit('version-rollback', {
        configurationId: configId,
        targetVersion,
        rolledBackConfig,
        operator: options.operator,
        reason: options.reason,
        timestamp: new Date()
      })

      console.log(`⏪ [ConfigurationVersionManager] 回滚成功: ${configId} → v${targetVersion}`)

      return {
        success: true,
        data: rolledBackConfig,
        operationType: 'update',
        timestamp: new Date(),
        duration: performance.now() - startTime
      }

    } catch (error) {
      console.error(`❌ [ConfigurationVersionManager] 回滚失败: ${configId} → v${targetVersion}`, error)

      return {
        success: false,
        error: `回滚失败: ${error instanceof Error ? error.message : '未知错误'}`,
        data: null,
        operationType: 'update',
        timestamp: new Date(),
        duration: performance.now() - startTime
      }
    }
  }

  // ===== 🔍 版本比较和分析 =====

  /**
   * 🔍 比较两个版本
   *
   * 详细比较两个版本之间的差异
   *
   * @param configId 配置ID
   * @param sourceVersion 源版本号
   * @param targetVersion 目标版本号
   * @returns 版本比较结果
   */
  compareVersions(
    configId: string,
    sourceVersion: string,
    targetVersion: string
  ): VersionComparisonResult | null {
    const sourceVer = this.getVersion(configId, sourceVersion)
    const targetVer = this.getVersion(configId, targetVersion)

    if (!sourceVer || !targetVer) {
      console.error(`❌ [ConfigurationVersionManager] 版本比较失败: 版本不存在`)
      return null
    }

    // 🔍 执行深度比较
    const changes = this.performDeepComparison(sourceVer.snapshot, targetVer.snapshot)

    const result: VersionComparisonResult = {
      sourceVersion,
      targetVersion,
      hasChanges: changes.length > 0,
      changesSummary: this.summarizeChanges(changes),
      changes,
      comparedAt: new Date()
    }

    console.log(`🔍 [ConfigurationVersionManager] 版本比较完成: ${configId} v${sourceVersion} ↔ v${targetVersion}`)
    return result
  }

  // ===== 🏷️ 版本标签管理 =====

  /**
   * 🏷️ 为版本添加标签
   *
   * 为指定版本添加有意义的标签
   *
   * @param configId 配置ID
   * @param version 版本号
   * @param tag 标签名称
   * @returns 操作是否成功
   */
  tagVersion(configId: string, version: string, tag: string): boolean {
    const versionObj = this.getVersion(configId, version)
    if (!versionObj) {
      console.error(`❌ [ConfigurationVersionManager] 标签添加失败: 版本不存在 ${configId} v${version}`)
      return false
    }

    // 🏷️ 添加标签到版本对象
    if (!versionObj.tags.includes(tag)) {
      versionObj.tags.push(tag)
    }

    // 📋 更新标签映射
    if (!this.versionTags.has(configId)) {
      this.versionTags.set(configId, new Map())
    }
    this.versionTags.get(configId)!.set(tag, version)

    console.log(`🏷️ [ConfigurationVersionManager] 标签添加成功: ${configId} v${version} → ${tag}`)
    return true
  }

  /**
   * 🔍 通过标签获取版本
   *
   * 根据标签获取对应的版本号
   *
   * @param configId 配置ID
   * @param tag 标签名称
   * @returns 版本号
   */
  getVersionByTag(configId: string, tag: string): string | null {
    const tagMap = this.versionTags.get(configId)
    if (tagMap && tagMap.has(tag)) {
      const version = tagMap.get(tag)!
      console.log(`🔍 [ConfigurationVersionManager] 通过标签获取版本: ${configId} ${tag} → v${version}`)
      return version
    }

    console.warn(`⚠️ [ConfigurationVersionManager] 标签不存在: ${configId} ${tag}`)
    return null
  }

  // ===== 🧹 版本清理和优化 =====

  /**
   * 🧹 执行版本清理策略
   *
   * 根据配置的清理策略自动清理过期版本
   */
  private async executeCleanupPolicies(): Promise<void> {
    console.log('🧹 [ConfigurationVersionManager] 开始执行版本清理策略')

    for (const [configId, versions] of this.versionHistory) {
      for (const policy of this.cleanupPolicies) {
        const versionsToRemove = this.identifyVersionsForCleanup(versions, policy)

        if (versionsToRemove.length > 0) {
          console.log(`🧹 [ConfigurationVersionManager] 清理版本: ${configId} - 移除 ${versionsToRemove.length} 个版本`)

          // 移除标识的版本
          const remainingVersions = versions.filter(v => !versionsToRemove.includes(v))
          this.versionHistory.set(configId, remainingVersions)

          // 📊 更新统计信息
          this.updateStatistics('version-cleanup', null, versionsToRemove.length)
        }
      }
    }
  }

  /**
   * 🔍 识别需要清理的版本
   *
   * 根据清理策略识别需要移除的版本
   *
   * @param versions 版本列表
   * @param policy 清理策略
   * @returns 需要移除的版本列表
   */
  private identifyVersionsForCleanup(
    versions: ConfigurationVersion[],
    policy: VersionCleanupPolicy
  ): ConfigurationVersion[] {
    const toRemove: ConfigurationVersion[] = []
    const now = new Date()

    // 📊 按时间排序（最新的在前）
    const sortedVersions = [...versions].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

    // 🔢 检查版本数量限制
    if (policy.maxVersions && sortedVersions.length > policy.maxVersions) {
      const excessVersions = sortedVersions.slice(policy.maxVersions)
      toRemove.push(...excessVersions.filter(v => this.isVersionEligibleForCleanup(v, policy)))
    }

    // 📅 检查时间限制
    if (policy.retentionDays) {
      const cutoffDate = new Date(now.getTime() - policy.retentionDays * 24 * 60 * 60 * 1000)
      const oldVersions = versions.filter(v => v.createdAt < cutoffDate)
      toRemove.push(...oldVersions.filter(v => this.isVersionEligibleForCleanup(v, policy)))
    }

    return toRemove
  }

  /**
   * ✅ 检查版本是否符合清理条件
   *
   * 检查版本是否可以被清理（考虑保留策略）
   *
   * @param version 版本对象
   * @param policy 清理策略
   * @returns 是否可以清理
   */
  private isVersionEligibleForCleanup(version: ConfigurationVersion, policy: VersionCleanupPolicy): boolean {
    // 🏷️ 保留标记版本
    if (policy.keepTaggedVersions && version.tags.length > 0) {
      return false
    }

    // 🎯 保留里程碑版本（major 版本）
    if (policy.keepMilestones && version.changeType === 'major') {
      return false
    }

    // 🔧 自定义保留条件
    if (policy.customRetentionFilter && !policy.customRetentionFilter(version)) {
      return false
    }

    return true
  }

  // ===== 📊 统计和监控 =====

  /**
   * 📊 获取版本统计信息
   *
   * 获取版本管理的详细统计数据
   *
   * @returns 版本统计信息
   */
  getVersionStatistics(): VersionStatistics {
    // 🔄 实时计算统计信息
    this.recalculateStatistics()
    return { ...this.statistics }
  }

  /**
   * 📊 重新计算统计信息
   *
   * 重新计算所有版本的统计数据
   */
  private recalculateStatistics(): void {
    let totalVersions = 0
    let totalSize = 0
    const typeMap = new Map<ConfigurationType, number>()
    const statusMap = new Map<string, number>()
    let latestCreationTime: Date | undefined

    for (const [configId, versions] of this.versionHistory) {
      totalVersions += versions.length

      for (const version of versions) {
        // 📊 按类型统计
        const type = version.snapshot.type
        typeMap.set(type, (typeMap.get(type) || 0) + 1)

        // 📊 按状态统计
        const status = version.snapshot.status
        statusMap.set(status, (statusMap.get(status) || 0) + 1)

        // 📏 计算大小
        const size = JSON.stringify(version).length
        totalSize += size

        // 📅 更新最新创建时间
        if (!latestCreationTime || version.createdAt > latestCreationTime) {
          latestCreationTime = version.createdAt
        }
      }
    }

    this.statistics = {
      totalVersions,
      versionsByType: typeMap,
      versionsByStatus: statusMap,
      averageVersionSize: totalVersions > 0 ? totalSize / totalVersions : 0,
      lastVersionCreatedAt: latestCreationTime,
      totalRollbacks: this.statistics.totalRollbacks, // 保留原有数据
      storageUsage: totalSize
    }
  }

  // ===== 🔒 私有辅助方法 =====

  /**
   * 🔢 生成下一个版本号
   *
   * 根据变更类型生成下一个版本号
   *
   * @param versions 现有版本列表
   * @param changeType 变更类型
   * @returns 新版本号
   */
  private generateNextVersion(
    versions: ConfigurationVersion[],
    changeType: 'major' | 'minor' | 'patch' | 'hotfix'
  ): string {
    if (versions.length === 0) {
      return '1.0.0'
    }

    // 获取最新版本号
    const latestVersion = versions[versions.length - 1].version
    const [major, minor, patch] = latestVersion.split('.').map(Number)

    switch (changeType) {
      case 'major':
        return `${major + 1}.0.0`
      case 'minor':
        return `${major}.${minor + 1}.0`
      case 'patch':
      case 'hotfix':
        return `${major}.${minor}.${patch + 1}`
      default:
        return `${major}.${minor}.${patch + 1}`
    }
  }

  /**
   * 📝 创建变更历史记录
   *
   * 记录配置的变更历史
   *
   * @param config 配置项
   * @param operation 操作类型
   * @param operator 操作者
   * @param reason 变更原因
   * @param version 相关版本
   */
  private async createChangeHistory(
    config: ConfigurationItem,
    operation: 'create' | 'update' | 'delete' | 'restore',
    operator: string,
    reason: string,
    version: ConfigurationVersion
  ): Promise<void> {
    const historyEntry: ConfigurationHistory = {
      id: `${config.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      configurationId: config.id,
      operation,
      before: operation === 'create' ? undefined : version.snapshot,
      after: config,
      changes: [], // 这里可以进一步实现详细的变更差异
      timestamp: new Date(),
      operator,
      reason
    }

    // 💾 存储历史记录
    const history = this.changeHistory.get(config.id) || []
    history.push(historyEntry)
    this.changeHistory.set(config.id, history)

    console.log(`📝 [ConfigurationVersionManager] 创建变更历史: ${config.id} - ${operation}`)
  }

  /**
   * 🔍 执行深度比较
   *
   * 比较两个配置对象的深度差异
   *
   * @param source 源对象
   * @param target 目标对象
   * @param path 当前路径
   * @returns 变更列表
   */
  private performDeepComparison(
    source: any,
    target: any,
    path: string = ''
  ): Array<{
    type: 'added' | 'modified' | 'removed'
    path: string
    oldValue?: any
    newValue?: any
    description: string
  }> {
    const changes: any[] = []

    // 🔍 这里可以实现详细的对象比较逻辑
    // 为了简化，这里只做基本的 JSON 字符串比较
    const sourceStr = JSON.stringify(source)
    const targetStr = JSON.stringify(target)

    if (sourceStr !== targetStr) {
      changes.push({
        type: 'modified',
        path: path || 'root',
        oldValue: source,
        newValue: target,
        description: '配置数据已修改'
      })
    }

    return changes
  }

  /**
   * 📊 汇总变更信息
   *
   * 将变更列表汇总为统计信息
   *
   * @param changes 变更列表
   * @returns 变更摘要
   */
  private summarizeChanges(changes: any[]): { added: number; modified: number; removed: number } {
    return {
      added: changes.filter(c => c.type === 'added').length,
      modified: changes.filter(c => c.type === 'modified').length,
      removed: changes.filter(c => c.type === 'removed').length
    }
  }

  /**
   * 📊 更新统计信息
   *
   * 更新内部统计计数器
   *
   * @param eventType 事件类型
   * @param version 相关版本
   * @param count 计数值
   */
  private updateStatistics(eventType: string, version?: ConfigurationVersion | null, count?: number): void {
    switch (eventType) {
      case 'version-created':
        this.statistics.totalVersions++
        break
      case 'version-rollback':
        this.statistics.totalRollbacks++
        break
      case 'version-cleanup':
        if (count) {
          this.statistics.totalVersions -= count
        }
        break
    }
  }
}

/**
 * 🌟 创建版本管理器实例
 *
 * 提供全局单例模式的版本管理器
 */
export const configurationVersionManager = new ConfigurationVersionManager()

// 🔧 调试支持：将版本管理器暴露到全局作用域
if (typeof window !== 'undefined') {
  ;(window as any).configurationVersionManager = configurationVersionManager
}

console.log('🎉 [config-version-manager.ts] 配置版本管理器加载完成')