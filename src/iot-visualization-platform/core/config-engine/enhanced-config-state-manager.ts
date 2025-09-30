/**
 * 增强的配置状态管理器
 *
 * 这是Config Engine的核心管理器，集成了版本管理、验证、模板等所有功能
 * 提供统一的配置管理接口，可以独立使用或集成到Visual Editor中
 *
 * 主要特性：
 * 1. 版本控制和历史管理 - Git风格的版本控制
 * 2. 实时验证和错误处理 - JSON Schema + 自定义规则
 * 3. 配置模板和预设 - 内置模板库，支持参数化
 * 4. 导入导出功能 - 多格式支持
 * 5. 依赖管理和循环检测 - 组件间依赖关系管理
 * 6. 事件驱动架构 - 响应式配置变更通知
 * 7. 性能优化 - 缓存、防抖、内存管理
 */

import { reactive, ref, computed, nextTick } from 'vue'
import { ConfigEngine, ConfigurationType, ConfigurationItem } from './index'
import { ConfigurationValidator } from './config-validator'
import { ConfigurationAPIManager } from './config-api-manager'
import { ConfigurationVersionManager } from './config-version-manager'
import { ConfigurationTemplateManager } from './config-template-manager'
import type {
  ConfigurationOperationResult,
  ConfigurationTemplate,
  ConfigurationVersion,
  ConfigurationValidationResult,
  ValidationRule,
  TemplateParameter,
  ConfigurationImportOptions,
  ConfigurationExportOptions,
  ImportResult,
  ExportResult
} from './types'

// ========== 🆕 增强的配置状态管理相关类型定义 ==========

/**
 * Widget配置结构 - 在config-engine边界内重新定义
 */
export interface WidgetConfiguration {
  base: {
    width?: number
    height?: number
    x?: number
    y?: number
    zIndex?: number
    visible?: boolean
    rotation?: number
    opacity?: number
    [key: string]: any
  }
  component: {
    type?: string
    props?: Record<string, any>
    style?: Record<string, any>
    theme?: string
    [key: string]: any
  }
  dataSource: {
    type?: 'static' | 'api' | 'websocket' | 'device' | 'script'
    url?: string
    method?: string
    headers?: Record<string, string>
    params?: Record<string, any>
    data?: any
    polling?: {
      enabled: boolean
      interval: number
    }
    [key: string]: any
  }
  interaction: {
    events?: Array<{
      trigger: string
      action: string
      target?: string
      params?: Record<string, any>
    }>
    bindings?: Record<string, any>
    [key: string]: any
  }
  metadata: {
    version: string
    createdAt: number
    updatedAt: number
    description?: string
    author?: string
    tags?: string[]
    [key: string]: any
  }
}

/**
 * 增强的配置版本信息
 */
export interface EnhancedConfigurationVersion {
  version: number
  contentHash: string
  timestamp: number
  source: 'user' | 'system' | 'import' | 'restore' | 'template'
  description?: string
  author?: string
  changeType?: 'major' | 'minor' | 'patch' | 'hotfix'
  tags?: string[]
  parentVersion?: number
  diff?: Record<string, any>
}

/**
 * 增强的配置状态项
 */
export interface EnhancedConfigurationState {
  componentId: string
  configuration: WidgetConfiguration
  version: EnhancedConfigurationVersion
  lastModified: number
  isDirty: boolean
  isLocked: boolean
  versionHistory: EnhancedConfigurationVersion[]
  maxHistorySize: number
  dependencies: string[] // 依赖的其他组件ID
  dependents: string[] // 依赖此组件的其他组件ID
  validationResult?: ConfigurationValidationResult
  templateApplications: TemplateApplicationRecord[]
}

/**
 * 配置更新事件
 */
export interface ConfigurationUpdateEvent {
  componentId: string
  section: keyof WidgetConfiguration | 'complete'
  oldVersion: EnhancedConfigurationVersion
  newVersion: EnhancedConfigurationVersion
  changes: Record<string, any>
  shouldExecute: boolean
  timestamp: number
  source: string
}

/**
 * 模板应用记录
 */
export interface TemplateApplicationRecord {
  templateId: string
  appliedAt: number
  appliedBy: string
  parameters: Record<string, any>
  versionAfterApplication: number
}

/**
 * 依赖关系定义
 */
export interface ConfigurationDependency {
  sourceId: string
  targetId: string
  type: 'data' | 'event' | 'layout' | 'theme'
  description?: string
  isOptional: boolean
  createdAt: number
}

/**
 * 验证上下文
 */
export interface ValidationContext {
  componentType?: string
  environment?: 'development' | 'production' | 'test'
  strictMode?: boolean
  customRules?: ValidationRule[]
  dependencies?: ConfigurationDependency[]
}

// ========== 🆕 增强的配置状态管理器主类 ==========

/**
 * 增强的配置状态管理器
 *
 * 集成Config Engine的所有功能，提供统一的配置管理接口
 */
export class EnhancedConfigurationStateManager {
  // ========== 核心引擎组件 ==========
  private configEngine: ConfigEngine
  private validator: ConfigurationValidator
  private apiManager: ConfigurationAPIManager
  private versionManager: ConfigurationVersionManager
  private templateManager: ConfigurationTemplateManager

  // ========== 状态存储 ==========
  private configStates = reactive<Map<string, EnhancedConfigurationState>>(new Map())
  private dependencies = reactive<Map<string, ConfigurationDependency[]>>(new Map())

  // ========== 计数器和缓存 ==========
  private versionCounter = ref(0)
  private updateQueue = new Map<string, NodeJS.Timeout>()
  private validationCache = new Map<string, { result: ConfigurationValidationResult; timestamp: number }>()

  // ========== 配置常量 ==========
  private readonly DEBOUNCE_DELAY = 50 // 50ms防抖
  private readonly VALIDATION_CACHE_TTL = 5000 // 验证缓存5秒
  private readonly DEFAULT_MAX_HISTORY = 50 // 默认最大历史记录数
  private readonly MAX_DEPENDENCY_DEPTH = 10 // 最大依赖深度，防止循环

  // ========== 锁和开关 ==========
  private readonly UPDATE_LOCKS = new Set<string>()
  private enableValidation = true
  private enableDependencyTracking = true

  // ========== 事件监听器 ==========
  private eventListeners = new Map<string, Set<(event: ConfigurationUpdateEvent) => void>>()

  constructor() {
    // 初始化所有引擎组件
    this.configEngine = new ConfigEngine()
    this.validator = new ConfigurationValidator()
    this.apiManager = new ConfigurationAPIManager()
    this.versionManager = new ConfigurationVersionManager()
    this.templateManager = new ConfigurationTemplateManager()

    // 注册内置验证规则
    this.registerBuiltInValidationRules()

    // 加载内置模板
    this.loadBuiltInTemplates()

  }

  // ========== 🎯 核心配置管理方法 ==========

  /**
   * 获取组件配置
   */
  getConfiguration(componentId: string): WidgetConfiguration | null {
    const state = this.configStates.get(componentId)
    if (!state) {
      return null
    }
    return this.deepClone(state.configuration)
  }

  /**
   * 设置完整配置
   */
  async setConfiguration(
    componentId: string,
    configuration: WidgetConfiguration,
    options: {
      source?: EnhancedConfigurationVersion['source']
      author?: string
      changeType?: 'major' | 'minor' | 'patch' | 'hotfix'
      skipValidation?: boolean
      skipDependencyCheck?: boolean
      description?: string
    } = {}
  ): Promise<boolean> {
    const {
      source = 'user',
      author = 'system',
      changeType = 'minor',
      skipValidation = false,
      skipDependencyCheck = false,
      description
    } = options

    try {
      // 🆕 配置验证
      if (this.enableValidation && !skipValidation) {
        const validationResult = await this.validateConfiguration(configuration, { componentType: configuration.component.type })
        if (!validationResult.isValid) {
          console.error(`配置验证失败 [${componentId}]:`, validationResult.errors)
          // 严格模式下阻止无效配置
          if (validationResult.errors.some(e => e.severity === 'error')) {
            return false
          }
        }
      }

      // 🆕 依赖关系检查
      if (this.enableDependencyTracking && !skipDependencyCheck) {
        const dependencyResult = this.checkDependencies(componentId, configuration)
        if (!dependencyResult.isValid) {
          console.error(`依赖检查失败 [${componentId}]:`, dependencyResult.errors)
          return false
        }
      }

      const contentHash = this.calculateContentHash(configuration)
      const currentState = this.configStates.get(componentId)

      // 🔥 内容去重检查
      if (currentState && currentState.version.contentHash === contentHash) {
        return false
      }

      // 🔒 循环检测
      if (this.UPDATE_LOCKS.has(componentId)) {
        return false
      }

      // 🔒 设置更新锁
      this.UPDATE_LOCKS.add(componentId)

      try {
        const newVersion: EnhancedConfigurationVersion = {
          version: ++this.versionCounter.value,
          contentHash,
          timestamp: Date.now(),
          source,
          author,
          changeType,
          description: description || `Complete config update from ${source}`,
          parentVersion: currentState?.version.version
        }

        // 🆕 保存当前版本到快照（如果存在）
        if (currentState) {
          await this.saveConfigurationSnapshot(componentId, currentState.version, currentState.configuration)
        }

        const newState: EnhancedConfigurationState = {
          componentId,
          configuration: this.deepClone(configuration),
          version: newVersion,
          lastModified: Date.now(),
          isDirty: false,
          isLocked: false,
          versionHistory: this.updateVersionHistory(currentState?.versionHistory || [], newVersion),
          maxHistorySize: this.DEFAULT_MAX_HISTORY,
          dependencies: currentState?.dependencies || [],
          dependents: currentState?.dependents || [],
          templateApplications: currentState?.templateApplications || []
        }

        this.configStates.set(componentId, newState)

        // 🆕 异步触发事件
        await this.scheduleEventEmission(componentId, 'complete', currentState?.version, newVersion, configuration)

        return true

      } finally {
        // 🔓 释放更新锁
        this.UPDATE_LOCKS.delete(componentId)
      }

    } catch (error) {
      console.error(`设置配置失败 [${componentId}]:`, error)
      return false
    }
  }

  /**
   * 更新配置的某个部分
   */
  async updateConfigurationSection<K extends keyof WidgetConfiguration>(
    componentId: string,
    section: K,
    sectionConfig: WidgetConfiguration[K],
    options: {
      source?: EnhancedConfigurationVersion['source']
      author?: string
      skipValidation?: boolean
    } = {}
  ): Promise<boolean> {
    const { source = 'user', author = 'system', skipValidation = false } = options

    // 🔒 循环检测
    if (this.UPDATE_LOCKS.has(componentId)) {
      return false
    }

    let currentState = this.configStates.get(componentId)

    // 如果配置不存在，创建默认配置
    if (!currentState) {
      this.initializeConfiguration(componentId)
      currentState = this.configStates.get(componentId)!
    }

    // 构建更新后的配置
    const updatedConfiguration: WidgetConfiguration = {
      ...currentState.configuration,
      [section]: this.deepClone(sectionConfig),
      metadata: {
        ...currentState.configuration.metadata,
        updatedAt: Date.now()
      }
    }

    // 🔥 内容哈希去重检查
    const newContentHash = this.calculateContentHash(updatedConfiguration)
    if (currentState.version.contentHash === newContentHash) {
      return false
    }

    // 🔒 设置更新锁
    this.UPDATE_LOCKS.add(componentId)

    try {
      const newVersion: EnhancedConfigurationVersion = {
        version: ++this.versionCounter.value,
        contentHash: newContentHash,
        timestamp: Date.now(),
        source,
        author,
        description: `Section ${section} update from ${source}`,
        changeType: 'patch',
        parentVersion: currentState.version.version
      }

      const newState: EnhancedConfigurationState = {
        ...currentState,
        configuration: updatedConfiguration,
        version: newVersion,
        lastModified: Date.now(),
        isDirty: true,
        versionHistory: this.updateVersionHistory(currentState.versionHistory, newVersion)
      }

      this.configStates.set(componentId, newState)

      // 🆕 异步触发事件
      await this.scheduleEventEmission(componentId, section, currentState.version, newVersion, {
        [section]: sectionConfig
      })

      return true

    } finally {
      // 🔓 释放更新锁
      this.UPDATE_LOCKS.delete(componentId)
    }
  }

  /**
   * 初始化组件配置
   */
  initializeConfiguration(componentId: string): void {
    if (this.configStates.has(componentId)) {
      return
    }

    const defaultConfiguration: WidgetConfiguration = {
      base: { width: 200, height: 100, x: 0, y: 0, visible: true },
      component: { type: 'default' },
      dataSource: { type: 'static', data: {} },
      interaction: {},
      metadata: {
        version: '1.0.0',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        description: 'Auto-generated configuration'
      }
    }

    const contentHash = this.calculateContentHash(defaultConfiguration)
    const version: EnhancedConfigurationVersion = {
      version: ++this.versionCounter.value,
      contentHash,
      timestamp: Date.now(),
      source: 'system',
      description: 'Initial configuration'
    }

    const state: EnhancedConfigurationState = {
      componentId,
      configuration: defaultConfiguration,
      version,
      lastModified: Date.now(),
      isDirty: false,
      isLocked: false,
      versionHistory: [version],
      maxHistorySize: this.DEFAULT_MAX_HISTORY,
      dependencies: [],
      dependents: [],
      templateApplications: []
    }

    this.configStates.set(componentId, state)
  }

  // ========== 🔄 版本管理方法 ==========

  /**
   * 获取版本历史
   */
  getVersionHistory(componentId: string): EnhancedConfigurationVersion[] {
    const state = this.configStates.get(componentId)
    return state?.versionHistory ? [...state.versionHistory] : []
  }

  /**
   * 恢复到指定版本
   */
  async restoreToVersion(componentId: string, targetVersion: number): Promise<boolean> {
    try {
      const snapshot = await this.versionManager.getConfigurationSnapshot(componentId, targetVersion.toString())
      if (!snapshot) {
        console.error(`版本快照不存在 [${componentId}]: v${targetVersion}`)
        return false
      }

      return await this.setConfiguration(componentId, snapshot as WidgetConfiguration, {
        source: 'restore',
        description: `恢复到版本 ${targetVersion}`,
        changeType: 'patch'
      })
    } catch (error) {
      console.error(`恢复版本失败 [${componentId}]:`, error)
      return false
    }
  }

  /**
   * 比较两个版本的差异
   */
  async compareVersions(componentId: string, version1: number, version2: number): Promise<Record<string, any> | null> {
    try {
      const result = await this.versionManager.compareVersions(componentId, version1.toString(), version2.toString())
      return result.success ? result.data || null : null
    } catch (error) {
      console.error(`版本比较失败 [${componentId}]:`, error)
      return null
    }
  }

  // ========== 🔍 验证管理方法 ==========

  /**
   * 验证配置
   */
  async validateConfiguration(configuration: WidgetConfiguration, context?: ValidationContext): Promise<ConfigurationValidationResult> {
    const configItem: ConfigurationItem = {
      id: 'temp_validation',
      name: 'Validation Item',
      type: ConfigurationType.COMPONENT,
      data: configuration,
      status: 'active',
      priority: 'medium',
      tags: [],
      target: [],
      version: '1.0.0',
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date()
    }

    return await this.validator.validateConfiguration(configItem, context)
  }

  /**
   * 注册验证规则
   */
  registerValidationRule(rule: ValidationRule): void {
    this.validator.registerValidationRule(rule)
  }

  // ========== 🎨 模板管理方法 ==========

  /**
   * 应用模板到组件
   */
  async applyTemplate(
    templateId: string,
    componentId: string,
    parameters: Record<string, any> = {},
    author = 'system'
  ): Promise<boolean> {
    try {
      const template = await this.templateManager.getTemplate(templateId)
      if (!template.success || !template.data) {
        console.error(`模板不存在: ${templateId}`)
        return false
      }

      const appliedConfig = this.applyTemplateParameters(template.data, parameters)

      // 记录模板应用
      const application: TemplateApplicationRecord = {
        templateId,
        appliedAt: Date.now(),
        appliedBy: author,
        parameters,
        versionAfterApplication: this.versionCounter.value + 1
      }

      const currentState = this.configStates.get(componentId)
      if (currentState) {
        currentState.templateApplications.push(application)
      }

      const success = await this.setConfiguration(componentId, appliedConfig, {
        source: 'template',
        author,
        changeType: 'minor',
        description: `应用模板: ${template.data.name}`
      })

      if (success) {
      }

      return success
    } catch (error) {
      console.error(`应用模板失败 [${templateId}]:`, error)
      return false
    }
  }

  /**
   * 创建模板（从现有配置）
   */
  async createTemplateFromConfiguration(
    componentId: string,
    templateInfo: {
      name: string
      description: string
      category: string
      componentType: string
      author: string
      tags?: string[]
    }
  ): Promise<ConfigurationTemplate | null> {
    const configuration = this.getConfiguration(componentId)
    if (!configuration) {
      console.error(`组件配置不存在: ${componentId}`)
      return null
    }

    const template: ConfigurationTemplate = {
      id: `template_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      name: templateInfo.name,
      description: templateInfo.description,
      category: templateInfo.category,
      componentType: templateInfo.componentType,
      configuration: this.deepClone(configuration),
      metadata: {
        version: '1.0.0',
        author: templateInfo.author,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        tags: templateInfo.tags || [],
        isBuiltIn: false
      }
    }

    const result = await this.templateManager.createTemplate(template)
    return result.success ? template : null
  }

  // ========== 🔗 依赖管理方法 ==========

  /**
   * 添加依赖关系
   */
  addDependency(dependency: ConfigurationDependency): boolean {
    // 检查循环依赖
    if (this.wouldCreateCircularDependency(dependency.sourceId, dependency.targetId)) {
      console.error(`检测到循环依赖: ${dependency.sourceId} -> ${dependency.targetId}`)
      return false
    }

    const sourceId = dependency.sourceId
    if (!this.dependencies.has(sourceId)) {
      this.dependencies.set(sourceId, [])
    }

    this.dependencies.get(sourceId)!.push(dependency)

    // 更新依赖状态
    this.updateDependencyStates(dependency)

    return true
  }

  /**
   * 移除依赖关系
   */
  removeDependency(sourceId: string, targetId: string, type?: string): boolean {
    const deps = this.dependencies.get(sourceId)
    if (!deps) return false

    const index = deps.findIndex(dep =>
      dep.targetId === targetId && (!type || dep.type === type)
    )

    if (index !== -1) {
      const removed = deps.splice(index, 1)[0]
      this.updateDependencyStates(removed, true)
      return true
    }

    return false
  }

  /**
   * 获取组件依赖
   */
  getDependencies(componentId: string): ConfigurationDependency[] {
    return this.dependencies.get(componentId) || []
  }

  // ========== 🚀 导入导出方法 ==========

  /**
   * 导出配置
   */
  async exportConfigurations(
    componentIds: string[],
    options: ConfigurationExportOptions = {}
  ): Promise<ExportResult> {
    const configurations: Record<string, any> = {}

    for (const componentId of componentIds) {
      const state = this.configStates.get(componentId)
      if (state) {
        configurations[componentId] = {
          configuration: state.configuration,
          version: state.version,
          dependencies: this.getDependencies(componentId),
          templateApplications: state.templateApplications
        }
      }
    }

    return await this.templateManager.exportConfigurations(configurations, options)
  }

  /**
   * 导入配置
   */
  async importConfigurations(
    data: string | Buffer | any,
    options: ConfigurationImportOptions = {}
  ): Promise<ImportResult> {
    try {
      const result = await this.templateManager.importConfigurations(data, options)

      if (result.success && result.data) {
        // 应用导入的配置
        for (const [componentId, configData] of Object.entries(result.data)) {
          if (configData && typeof configData === 'object' && 'configuration' in configData) {
            await this.setConfiguration(componentId, configData.configuration as WidgetConfiguration, {
              source: 'import',
              description: '从导入文件加载',
              changeType: 'major'
            })
          }
        }
      }

      return result
    } catch (error) {
      console.error('导入配置失败:', error)
      return {
        success: false,
        errors: [`导入失败: ${error}`]
      }
    }
  }

  // ========== 🎯 事件系统方法 ==========

  /**
   * 订阅配置更新事件
   */
  onConfigurationUpdate(componentId: string, listener: (event: ConfigurationUpdateEvent) => void): () => void {
    if (!this.eventListeners.has(componentId)) {
      this.eventListeners.set(componentId, new Set())
    }

    this.eventListeners.get(componentId)!.add(listener)

    // 返回取消订阅函数
    return () => {
      const listeners = this.eventListeners.get(componentId)
      if (listeners) {
        listeners.delete(listener)
        if (listeners.size === 0) {
          this.eventListeners.delete(componentId)
        }
      }
    }
  }

  /**
   * 清理组件配置
   */
  removeConfiguration(componentId: string): boolean {
    const exists = this.configStates.has(componentId)
    if (exists) {
      this.configStates.delete(componentId)
      this.eventListeners.delete(componentId)
      this.dependencies.delete(componentId)
      this.UPDATE_LOCKS.delete(componentId)

      // 清理更新队列
      const timeout = this.updateQueue.get(componentId)
      if (timeout) {
        clearTimeout(timeout)
        this.updateQueue.delete(componentId)
      }

    }
    return exists
  }

  /**
   * 获取所有配置状态
   */
  getAllConfigurationStates(): Map<string, EnhancedConfigurationState> {
    return new Map(this.configStates)
  }

  // ========== 🔧 私有辅助方法 ==========

  /**
   * 计算配置内容哈希
   */
  private calculateContentHash(configuration: WidgetConfiguration): string {
    const normalizedConfig = this.normalizeConfiguration(configuration)
    const configString = JSON.stringify(normalizedConfig)
    return this.simpleHash(configString)
  }

  /**
   * 规范化配置对象
   */
  private normalizeConfiguration(config: WidgetConfiguration): any {
    const normalized = { ...config }

    // 忽略时间戳字段，避免无意义的哈希变化
    if (normalized.metadata) {
      const { updatedAt, createdAt, ...metadataWithoutTimestamp } = normalized.metadata
      normalized.metadata = metadataWithoutTimestamp
    }

    return this.sortObjectKeys(normalized)
  }

  /**
   * 递归排序对象键
   */
  private sortObjectKeys(obj: any): any {
    if (obj === null || typeof obj !== 'object') {
      return obj
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.sortObjectKeys(item))
    }

    const sortedKeys = Object.keys(obj).sort()
    const sortedObj: any = {}
    for (const key of sortedKeys) {
      sortedObj[key] = this.sortObjectKeys(obj[key])
    }

    return sortedObj
  }

  /**
   * 简单哈希函数
   */
  private simpleHash(str: string): string {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash
    }
    return Math.abs(hash).toString(36)
  }

  /**
   * 深克隆对象
   */
  private deepClone<T>(obj: T): T {
    if (obj === null || typeof obj !== 'object') return obj
    if (obj instanceof Date) return new Date(obj.getTime()) as T
    if (Array.isArray(obj)) return obj.map(item => this.deepClone(item)) as T

    const cloned = {} as T
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        cloned[key] = this.deepClone(obj[key])
      }
    }
    return cloned
  }

  /**
   * 更新版本历史记录
   */
  private updateVersionHistory(
    currentHistory: EnhancedConfigurationVersion[],
    newVersion: EnhancedConfigurationVersion
  ): EnhancedConfigurationVersion[] {
    const updatedHistory = [...currentHistory, newVersion]
    updatedHistory.sort((a, b) => b.timestamp - a.timestamp)
    return updatedHistory.slice(0, this.DEFAULT_MAX_HISTORY)
  }

  /**
   * 保存配置快照
   */
  private async saveConfigurationSnapshot(
    componentId: string,
    version: EnhancedConfigurationVersion,
    configuration: WidgetConfiguration
  ): Promise<void> {
    try {
      await this.versionManager.createVersion(
        {
          id: componentId,
          name: `Component ${componentId}`,
          type: ConfigurationType.COMPONENT,
          data: configuration,
          status: 'active',
          priority: 'medium',
          tags: [],
          target: [],
          version: version.version.toString(),
          metadata: {},
          createdAt: new Date(),
          updatedAt: new Date()
        },
        version.description || 'Snapshot',
        version.changeType || 'patch',
        version.author || 'system'
      )
    } catch (error) {
      console.error(`保存配置快照失败 [${componentId}]:`, error)
    }
  }

  /**
   * 调度事件发射（防抖处理）
   */
  private async scheduleEventEmission(
    componentId: string,
    section: keyof WidgetConfiguration | 'complete',
    oldVersion: EnhancedConfigurationVersion | undefined,
    newVersion: EnhancedConfigurationVersion,
    changes: Record<string, any>
  ): Promise<void> {
    // 清除之前的调度
    const existingTimeout = this.updateQueue.get(componentId)
    if (existingTimeout) {
      clearTimeout(existingTimeout)
    }

    return new Promise(resolve => {
      const timeout = setTimeout(async () => {
        this.updateQueue.delete(componentId)

        const event: ConfigurationUpdateEvent = {
          componentId,
          section: section as keyof WidgetConfiguration,
          oldVersion: oldVersion || newVersion,
          newVersion,
          changes,
          shouldExecute: section === 'dataSource',
          timestamp: Date.now(),
          source: newVersion.source
        }

        await this.emitConfigurationUpdate(event)
        resolve()
      }, this.DEBOUNCE_DELAY)

      this.updateQueue.set(componentId, timeout)
    })
  }

  /**
   * 发射配置更新事件
   */
  private async emitConfigurationUpdate(event: ConfigurationUpdateEvent): Promise<void> {
    const listeners = this.eventListeners.get(event.componentId)
    if (!listeners || listeners.size === 0) {
      return
    }

    const promises = Array.from(listeners).map(async listener => {
      try {
        await listener(event)
      } catch (error) {
        console.error(`事件监听器执行失败 [${event.componentId}]:`, error)
      }
    })

    await Promise.allSettled(promises)
  }

  /**
   * 检查依赖关系
   */
  private checkDependencies(componentId: string, configuration: WidgetConfiguration): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    // 检查数据源依赖
    if (configuration.dataSource?.type === 'device') {
      // 这里可以添加设备依赖检查逻辑
    }

    // 检查交互依赖
    if (configuration.interaction?.events) {
      for (const event of configuration.interaction.events) {
        if (event.target && !this.configStates.has(event.target)) {
          errors.push(`交互目标组件不存在: ${event.target}`)
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * 检查是否会创建循环依赖
   */
  private wouldCreateCircularDependency(sourceId: string, targetId: string, visited = new Set<string>(), depth = 0): boolean {
    if (depth > this.MAX_DEPENDENCY_DEPTH) {
      return true // 超过最大深度，认为是循环
    }

    if (visited.has(targetId)) {
      return targetId === sourceId // 如果回到源节点，则是循环
    }

    visited.add(targetId)

    const dependencies = this.dependencies.get(targetId) || []
    for (const dep of dependencies) {
      if (this.wouldCreateCircularDependency(sourceId, dep.targetId, new Set(visited), depth + 1)) {
        return true
      }
    }

    return false
  }

  /**
   * 更新依赖状态
   */
  private updateDependencyStates(dependency: ConfigurationDependency, isRemoval = false): void {
    const sourceState = this.configStates.get(dependency.sourceId)
    const targetState = this.configStates.get(dependency.targetId)

    if (sourceState) {
      if (isRemoval) {
        sourceState.dependencies = sourceState.dependencies.filter(id => id !== dependency.targetId)
      } else {
        if (!sourceState.dependencies.includes(dependency.targetId)) {
          sourceState.dependencies.push(dependency.targetId)
        }
      }
    }

    if (targetState) {
      if (isRemoval) {
        targetState.dependents = targetState.dependents.filter(id => id !== dependency.sourceId)
      } else {
        if (!targetState.dependents.includes(dependency.sourceId)) {
          targetState.dependents.push(dependency.sourceId)
        }
      }
    }
  }

  /**
   * 应用模板参数到配置
   */
  private applyTemplateParameters(template: ConfigurationTemplate, parameters: Record<string, any>): WidgetConfiguration {
    const config = this.deepClone(template.configuration) as WidgetConfiguration

    if (!template.parameters) {
      return config
    }

    template.parameters.forEach(param => {
      const value = parameters[param.name] !== undefined ? parameters[param.name] : param.defaultValue
      if (value !== undefined) {
        this.setValueByPath(config, param.path, value)
      }
    })

    return config
  }

  /**
   * 根据路径设置配置值
   */
  private setValueByPath(obj: any, path: string, value: any): void {
    const parts = path.split('.')
    let current = obj

    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i]
      if (!current[part] || typeof current[part] !== 'object') {
        current[part] = {}
      }
      current = current[part]
    }

    current[parts[parts.length - 1]] = value
  }

  /**
   * 注册内置验证规则
   */
  private registerBuiltInValidationRules(): void {
    // 基础尺寸验证规则
    this.registerValidationRule({
      name: 'widget-size-validation',
      description: '组件尺寸验证',
      priority: 100,
      validate: (config) => {
        const errors: any[] = []
        const widgetConfig = config.data as WidgetConfiguration

        if (widgetConfig.base?.width && widgetConfig.base.width < 0) {
          errors.push({
            code: 'INVALID_WIDTH',
            message: '组件宽度不能为负数',
            path: 'base.width',
            severity: 'error'
          })
        }

        if (widgetConfig.base?.height && widgetConfig.base.height < 0) {
          errors.push({
            code: 'INVALID_HEIGHT',
            message: '组件高度不能为负数',
            path: 'base.height',
            severity: 'error'
          })
        }

        return errors
      }
    })

    // 数据源验证规则
    this.registerValidationRule({
      name: 'datasource-validation',
      description: '数据源配置验证',
      priority: 90,
      validate: (config) => {
        const errors: any[] = []
        const widgetConfig = config.data as WidgetConfiguration

        if (widgetConfig.dataSource?.type === 'api' && !widgetConfig.dataSource.url) {
          errors.push({
            code: 'MISSING_API_URL',
            message: 'API数据源必须指定URL',
            path: 'dataSource.url',
            severity: 'error'
          })
        }

        return errors
      }
    })

  }

  /**
   * 加载内置模板
   */
  private async loadBuiltInTemplates(): Promise<void> {
    const builtInTemplates: ConfigurationTemplate[] = [
      {
        id: 'builtin_digit_display_basic',
        name: '基础数字显示',
        description: '简单的数字显示组件模板',
        category: 'statistics',
        componentType: 'digit-indicator',
        configuration: {
          base: { width: 200, height: 100, x: 0, y: 0, visible: true },
          component: {
            type: 'digit-indicator',
            title: '数值显示',
            unit: '',
            fontSize: 24,
            color: '#1890ff'
          },
          dataSource: {
            type: 'static',
            data: { value: 100 }
          },
          interaction: {},
          metadata: {
            version: '1.0.0',
            createdAt: Date.now(),
            updatedAt: Date.now(),
            description: '内置基础数字显示模板'
          }
        },
        parameters: [
          {
            name: 'title',
            type: 'string',
            description: '显示标题',
            defaultValue: '数值显示',
            required: true,
            path: 'component.title'
          },
          {
            name: 'unit',
            type: 'string',
            description: '数值单位',
            defaultValue: '',
            required: false,
            path: 'component.unit'
          }
        ],
        metadata: {
          version: '1.0.0',
          author: 'ThingsPanel',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          tags: ['数字', '统计', '基础'],
          isBuiltIn: true
        }
      }
    ]

    try {
      for (const template of builtInTemplates) {
        await this.templateManager.createTemplate(template)
      }
    } catch (error) {
      console.error('加载内置模板失败:', error)
    }
  }
}

// ========== 🚀 Vue Composable 接口 ==========

/**
 * Vue 3 Composable 接口
 * 提供响应式的配置状态管理功能
 */
export function useEnhancedConfigurationState() {
  // 创建全局单例
  let manager: EnhancedConfigurationStateManager

  if (!(globalThis as any).__enhancedConfigManager) {
    (globalThis as any).__enhancedConfigManager = new EnhancedConfigurationStateManager()
  }
  manager = (globalThis as any).__enhancedConfigManager

  return {
    // 核心管理器实例
    manager,

    // 基础配置操作
    getConfig: (componentId: string) => manager.getConfiguration(componentId),
    setConfig: (componentId: string, config: WidgetConfiguration, options?: any) =>
      manager.setConfiguration(componentId, config, options),
    updateSection: <K extends keyof WidgetConfiguration>(
      componentId: string,
      section: K,
      sectionConfig: WidgetConfiguration[K],
      options?: any
    ) => manager.updateConfigurationSection(componentId, section, sectionConfig, options),

    // 版本管理
    getVersionHistory: (componentId: string) => manager.getVersionHistory(componentId),
    restoreToVersion: (componentId: string, targetVersion: number) =>
      manager.restoreToVersion(componentId, targetVersion),
    compareVersions: (componentId: string, version1: number, version2: number) =>
      manager.compareVersions(componentId, version1, version2),

    // 验证功能
    validateConfig: (config: WidgetConfiguration, context?: ValidationContext) =>
      manager.validateConfiguration(config, context),
    registerValidationRule: (rule: ValidationRule) => manager.registerValidationRule(rule),

    // 模板管理
    applyTemplate: (templateId: string, componentId: string, parameters?: Record<string, any>, author?: string) =>
      manager.applyTemplate(templateId, componentId, parameters, author),
    createTemplateFromConfig: (componentId: string, templateInfo: any) =>
      manager.createTemplateFromConfiguration(componentId, templateInfo),

    // 依赖管理
    addDependency: (dependency: ConfigurationDependency) => manager.addDependency(dependency),
    removeDependency: (sourceId: string, targetId: string, type?: string) =>
      manager.removeDependency(sourceId, targetId, type),
    getDependencies: (componentId: string) => manager.getDependencies(componentId),

    // 导入导出
    exportConfigurations: (componentIds: string[], options?: ConfigurationExportOptions) =>
      manager.exportConfigurations(componentIds, options),
    importConfigurations: (data: string | Buffer | any, options?: ConfigurationImportOptions) =>
      manager.importConfigurations(data, options),

    // 事件系统
    subscribe: (componentId: string, listener: (event: ConfigurationUpdateEvent) => void) =>
      manager.onConfigurationUpdate(componentId, listener),

    // 工具方法
    initializeConfig: (componentId: string) => manager.initializeConfiguration(componentId),
    removeConfig: (componentId: string) => manager.removeConfiguration(componentId),
    getAllStates: () => manager.getAllConfigurationStates()
  }
}

// 全局导出
export const enhancedConfigurationStateManager = new EnhancedConfigurationStateManager()

