/**
 * 全新的配置状态管理器
 * 基于配置版本控制和内容哈希去重机制，彻底解决无限循环问题
 *
 * 核心设计原理：
 * 1. 配置版本控制 - 每个配置都有唯一的版本号和内容哈希
 * 2. 内容去重机制 - 相同内容不会触发更新，即使对象引用不同
 * 3. 单向数据流 - 严格的数据流向，避免双向绑定混乱
 * 4. 批量更新机制 - 防抖处理，避免频繁更新
 * 5. 事件去重过滤 - 同一配置变更只触发一次执行
 */

import { ref, reactive, computed, nextTick } from 'vue'
import type {
  WidgetConfiguration,
  ValidationResult,
  BaseConfiguration,
  ComponentConfiguration,
  DataSourceConfiguration,
  InteractionConfiguration
} from './types'

// 配置版本信息
export interface ConfigurationVersion {
  version: number
  contentHash: string
  timestamp: number
  source: 'user' | 'system' | 'import' | 'restore'
  description?: string
  author?: string // 版本作者
  changeType?: 'major' | 'minor' | 'patch' | 'hotfix' // 变更类型
  tags?: string[] // 版本标签
}

// 配置状态项
export interface ConfigurationState {
  componentId: string
  configuration: WidgetConfiguration
  version: ConfigurationVersion
  lastModified: number
  isDirty: boolean
  isLocked: boolean // 防止循环更新的锁
  versionHistory?: ConfigurationVersion[] // 版本历史记录
  maxHistorySize?: number // 最大历史记录数量，默认50
}

// 配置更新事件
export interface ConfigurationUpdateEvent {
  componentId: string
  section: keyof WidgetConfiguration
  oldVersion: ConfigurationVersion
  newVersion: ConfigurationVersion
  changes: Record<string, any>
  shouldExecute: boolean
}

// 🆕 配置验证相关接口
export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
  performance?: {
    validationTime: number
    schemaValidationTime: number
    customRulesTime: number
  }
}

export interface ValidationError {
  code: string
  message: string
  path: string
  severity: 'error' | 'warning'
  data?: any
}

export interface ValidationWarning extends ValidationError {
  severity: 'warning'
  suggestion?: string
}

export interface ValidationRule {
  name: string
  description: string
  priority: number
  validate: (config: WidgetConfiguration, context?: any) => ValidationError[]
}

export interface ValidationContext {
  componentType?: string
  environment?: 'development' | 'production' | 'test'
  strictMode?: boolean
  customRules?: ValidationRule[]
}

// 🆕 配置模板相关接口
export interface ConfigurationTemplate {
  id: string
  name: string
  description: string
  category: string
  componentType: string
  configuration: WidgetConfiguration
  parameters?: TemplateParameter[]
  metadata: {
    version: string
    author: string
    createdAt: number
    updatedAt: number
    tags: string[]
    isBuiltIn: boolean
    downloadCount?: number
    rating?: number
  }
}

export interface TemplateParameter {
  name: string
  type: 'string' | 'number' | 'boolean' | 'object' | 'array'
  description: string
  defaultValue?: any
  required: boolean
  path: string // 在配置中的路径，如 'dataSource.url'
  validation?: {
    min?: number
    max?: number
    pattern?: string
    options?: any[]
  }
}

export interface TemplateApplication {
  templateId: string
  componentId: string
  parameters: Record<string, any>
  appliedAt: number
  appliedBy: string
}

/**
 * 配置状态管理器
 * 使用版本控制和内容哈希彻底解决循环依赖问题
 */
export class ConfigurationStateManager {
  // 配置状态存储
  private configStates = reactive<Map<string, ConfigurationState>>(new Map())

  // 版本计数器
  private versionCounter = ref(0)

  // 更新队列和防抖处理
  private updateQueue = new Map<string, NodeJS.Timeout>()
  private readonly DEBOUNCE_DELAY = 50 // 50ms防抖

  // 循环检测
  private readonly UPDATE_LOCKS = new Set<string>()

  // 事件监听器
  private eventListeners = new Map<string, Set<(event: ConfigurationUpdateEvent) => void>>()

  // 🆕 版本历史管理
  private readonly DEFAULT_MAX_HISTORY = 50 // 默认最大历史记录数
  private configurationSnapshots = new Map<string, Map<string, WidgetConfiguration>>() // componentId -> version -> config

  // 🆕 配置验证系统
  private validationRules = new Map<string, ValidationRule>() // 自定义验证规则
  private validationCache = new Map<string, { result: ValidationResult; timestamp: number }>() // 验证结果缓存
  private readonly VALIDATION_CACHE_TTL = 5000 // 验证缓存5秒有效期
  private enableValidation = true // 启用验证开关

  // 🆕 配置模板系统
  private configurationTemplates = new Map<string, ConfigurationTemplate>() // 模板存储
  private templateApplications = new Map<string, TemplateApplication[]>() // 组件应用模板记录
  private builtInTemplatesLoaded = false // 内置模板是否已加载

  constructor() {
    // 🔥 配置完全依赖统一配置中心，无需localStorage
  }

  /**
   * 获取组件配置
   */
  getConfiguration(componentId: string): WidgetConfiguration | null {
    const state = this.configStates.get(componentId)
    if (!state) {
      return null
    }
    // 返回配置的深拷贝，避免外部修改
    return this.deepClone(state.configuration)
  }

  /**
   * 设置完整配置
   */
  setConfiguration(
    componentId: string,
    configuration: WidgetConfiguration,
    source: ConfigurationVersion['source'] = 'user',
    author?: string,
    changeType?: 'major' | 'minor' | 'patch' | 'hotfix',
    skipValidation = false
  ): boolean {
    // 🆕 配置验证（可选）
    if (this.enableValidation && !skipValidation) {
      const validationResult = this.validateConfiguration(configuration)
      if (!validationResult.isValid) {
        console.error(`配置验证失败 [${componentId}]:`, validationResult.errors)
        // 在严格模式下阻止无效配置
        if (validationResult.errors.some(e => e.severity === 'error')) {
          return false
        }
      }
    }

    const contentHash = this.calculateContentHash(configuration)
    const currentState = this.configStates.get(componentId)

    // 🔥 内容去重检查：如果内容哈希相同，直接返回不处理
    if (currentState && currentState.version.contentHash === contentHash) {
      return false
    }

    // 🔒 循环检测：如果组件正在更新中，直接返回避免循环
    if (this.UPDATE_LOCKS.has(componentId)) {
      return false
    }

    const newVersion: ConfigurationVersion = {
      version: ++this.versionCounter.value,
      contentHash,
      timestamp: Date.now(),
      source,
      description: `Complete config update from ${source}`,
      author,
      changeType
    }

    // 🆕 保存当前版本配置到快照存储
    if (currentState) {
      this.saveConfigurationSnapshot(componentId, currentState.version, currentState.configuration)
    }

    const newState: ConfigurationState = {
      componentId,
      configuration: this.deepClone(configuration),
      version: newVersion,
      lastModified: Date.now(),
      isDirty: false,
      isLocked: false,
      versionHistory: this.updateVersionHistory(currentState?.versionHistory || [], newVersion),
      maxHistorySize: this.DEFAULT_MAX_HISTORY
    }

    const oldVersion = currentState?.version
    this.configStates.set(componentId, newState)
    // 🔥 配置保存完成，无需localStorage持久化

    // 异步触发事件，避免阻塞
    this.scheduleEventEmission(componentId, 'complete', oldVersion, newVersion, configuration)

    return true
  }

  /**
   * 更新配置的某个部分 - 核心修复方法
   */
  updateConfigurationSection<K extends keyof WidgetConfiguration>(
    componentId: string,
    section: K,
    sectionConfig: WidgetConfiguration[K],
    source: ConfigurationVersion['source'] = 'user',
    forceUpdate = false  // 🔥 新增：强制更新标志，用于跨组件交互
  ): boolean {
    const lockKey = `${componentId}_${section}`

    // 🔒 修复：使用组件+节区的复合锁，避免不同节区互相阻塞
    if (this.UPDATE_LOCKS.has(lockKey)) {
      console.log(`🎯 用户要求的打印这几个字 - 阶段E3：ConfigurationStateManager检测到更新锁，跳过更新`, {
        组件ID: componentId,
        配置节: section,
        锁状态: true,
        当前锁数量: this.UPDATE_LOCKS.size,
        锁键: lockKey
      })
      return false
    }

    let currentState = this.configStates.get(componentId)

    // 如果配置不存在，创建默认配置
    if (!currentState) {
      this.initializeConfiguration(componentId)
      currentState = this.configStates.get(componentId)!
    }

    // 构建更新后的配置
    const updatedConfiguration = {
      ...currentState.configuration,
      [section]: this.deepClone(sectionConfig),
      metadata: {
        ...currentState.configuration.metadata,
        updatedAt: Date.now()
      }
    }

    // 🔥 内容哈希去重检查 - 但跨组件交互时强制触发
    const newContentHash = this.calculateContentHash(updatedConfiguration)
    if (currentState.version.contentHash === newContentHash && !forceUpdate) {
      console.log(`🔥 [ConfigurationStateManager] 配置内容相同，跳过更新`, {
        componentId,
        section,
        forceUpdate,
        哈希值: newContentHash
      })
      return false
    }

    // 🔥 强制更新时的特殊处理
    if (forceUpdate && currentState.version.contentHash === newContentHash) {
      console.log(`🔥 [ConfigurationStateManager] 强制更新模式，即使内容相同也触发事件`, {
        componentId,
        section,
        原因: '跨组件交互需要触发属性变化事件'
      })
      // 为强制更新添加时间戳，确保哈希不同
      updatedConfiguration.metadata = {
        ...updatedConfiguration.metadata,
        forceUpdateTimestamp: Date.now()
      }
    }

    // 🔒 设置更新锁（使用复合键）
    this.UPDATE_LOCKS.add(lockKey)

    const newVersion: ConfigurationVersion = {
      version: ++this.versionCounter.value,
      contentHash: newContentHash,
      timestamp: Date.now(),
      source,
      description: `Section ${section} update from ${source}`
    }

    const newState: ConfigurationState = {
      ...currentState,
      configuration: updatedConfiguration,
      version: newVersion,
      lastModified: Date.now(),
      isDirty: true
    }

    this.configStates.set(componentId, newState)
    // 🆕 持久化到 localStorage
    // this.saveToStorage() - 禁用localStorage

    // 异步触发事件和解锁
    this.scheduleEventEmission(componentId, section, currentState.version, newVersion, {
      [section]: sectionConfig
    }).finally(() => {
      // 🔓 释放更新锁（使用复合键）
      this.UPDATE_LOCKS.delete(lockKey)
    })

    return true
  }

  /**
   * 初始化组件配置
   */
  initializeConfiguration(componentId: string): void {
    if (this.configStates.has(componentId)) {
      return
    }

    const defaultConfiguration: WidgetConfiguration = {
      base: {},
      component: {},
      dataSource: {},
      interaction: {},
      metadata: {
        version: '1.0.0',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        description: 'Auto-generated configuration'
      }
    }

    const contentHash = this.calculateContentHash(defaultConfiguration)
    const version: ConfigurationVersion = {
      version: ++this.versionCounter.value,
      contentHash,
      timestamp: Date.now(),
      source: 'system',
      description: 'Initial configuration'
    }

    const state: ConfigurationState = {
      componentId,
      configuration: defaultConfiguration,
      version,
      lastModified: Date.now(),
      isDirty: false,
      isLocked: false
    }

    this.configStates.set(componentId, state)

    // 🔥 配置保存完成，无需localStorage持久化
  }

  /**
   * 获取配置版本信息
   */
  getConfigurationVersion(componentId: string): ConfigurationVersion | null {
    const state = this.configStates.get(componentId)
    return state ? { ...state.version } : null
  }

  /**
   * 检查配置是否存在且为最新版本
   */
  isConfigurationUpToDate(componentId: string, expectedHash?: string): boolean {
    const state = this.configStates.get(componentId)
    if (!state) return false

    if (expectedHash) {
      return state.version.contentHash === expectedHash
    }

    return !state.isDirty
  }

  /**
   * 获取所有配置状态
   */
  getAllConfigurationStates(): Map<string, ConfigurationState> {
    return new Map(this.configStates)
  }

  /**
   * 清理指定组件配置
   */
  removeConfiguration(componentId: string): boolean {
    const exists = this.configStates.has(componentId)
    if (exists) {
      this.configStates.delete(componentId)
      this.eventListeners.delete(componentId)
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

  // ========== 🆕 版本历史管理方法 ==========

  /**
   * 获取组件版本历史列表
   */
  getVersionHistory(componentId: string): ConfigurationVersion[] {
    const state = this.configStates.get(componentId)
    return state?.versionHistory ? [...state.versionHistory] : []
  }

  /**
   * 根据版本号恢复配置
   */
  async restoreToVersion(componentId: string, targetVersion: number): Promise<boolean> {
    const state = this.configStates.get(componentId)
    if (!state) {
      console.error(`组件 ${componentId} 不存在`)
      return false
    }

    // 查找目标版本的配置快照
    const snapshots = this.configurationSnapshots.get(componentId)
    if (!snapshots) {
      console.error(`组件 ${componentId} 没有配置快照`)
      return false
    }

    const targetVersionStr = targetVersion.toString()
    const targetConfig = snapshots.get(targetVersionStr)
    if (!targetConfig) {
      console.error(`版本 ${targetVersion} 的配置快照不存在`)
      return false
    }

    // 创建恢复版本
    const restoreVersion: ConfigurationVersion = {
      version: ++this.versionCounter.value,
      contentHash: this.calculateContentHash(targetConfig),
      timestamp: Date.now(),
      source: 'restore',
      description: `恢复到版本 ${targetVersion}`,
      changeType: 'patch'
    }

    // 更新配置状态
    const newState: ConfigurationState = {
      ...state,
      configuration: this.deepClone(targetConfig),
      version: restoreVersion,
      lastModified: Date.now(),
      isDirty: true,
      versionHistory: this.updateVersionHistory(state.versionHistory || [], restoreVersion)
    }

    this.configStates.set(componentId, newState)

    // 触发配置更新事件
    await this.scheduleEventEmission(componentId, 'complete', state.version, restoreVersion, targetConfig)

    return true
  }

  /**
   * 比较两个版本的配置差异
   */
  compareVersions(componentId: string, version1: number, version2: number): Record<string, any> | null {
    const snapshots = this.configurationSnapshots.get(componentId)
    if (!snapshots) return null

    const config1 = snapshots.get(version1.toString())
    const config2 = snapshots.get(version2.toString())

    if (!config1 || !config2) return null

    return this.calculateConfigurationDiff(config1, config2)
  }

  /**
   * 清理历史版本（保留最近N个版本）
   */
  cleanupVersionHistory(componentId: string, keepCount: number = this.DEFAULT_MAX_HISTORY): number {
    const state = this.configStates.get(componentId)
    if (!state || !state.versionHistory) return 0

    const historyLength = state.versionHistory.length
    if (historyLength <= keepCount) return 0

    // 排序版本历史（最新的在前）
    const sortedHistory = [...state.versionHistory].sort((a, b) => b.timestamp - a.timestamp)
    const toKeep = sortedHistory.slice(0, keepCount)
    const toRemove = sortedHistory.slice(keepCount)

    // 更新版本历史
    state.versionHistory = toKeep

    // 清理配置快照
    const snapshots = this.configurationSnapshots.get(componentId)
    if (snapshots) {
      toRemove.forEach(version => {
        snapshots.delete(version.version.toString())
      })
    }

    return toRemove.length
  }

  // ========== 🆕 配置验证管理方法 ==========

  /**
   * 验证配置
   */
  validateConfiguration(configuration: WidgetConfiguration, context?: ValidationContext): ValidationResult {
    const startTime = performance.now()

    // 检查缓存
    const cacheKey = this.generateValidationCacheKey(configuration, context)
    const cached = this.validationCache.get(cacheKey)
    if (cached && (Date.now() - cached.timestamp) < this.VALIDATION_CACHE_TTL) {
      return cached.result
    }

    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []

    // 基础结构验证
    const structureStart = performance.now()
    this.validateBasicStructure(configuration, errors)
    const structureTime = performance.now() - structureStart

    // 自定义规则验证
    const customRulesStart = performance.now()
    this.validateWithCustomRules(configuration, context, errors, warnings)
    const customRulesTime = performance.now() - customRulesStart

    const totalTime = performance.now() - startTime

    const result: ValidationResult = {
      isValid: errors.filter(e => e.severity === 'error').length === 0,
      errors,
      warnings,
      performance: {
        validationTime: totalTime,
        schemaValidationTime: structureTime,
        customRulesTime
      }
    }

    // 缓存结果
    this.validationCache.set(cacheKey, {
      result,
      timestamp: Date.now()
    })

    return result
  }

  /**
   * 注册自定义验证规则
   */
  registerValidationRule(rule: ValidationRule): void {
    this.validationRules.set(rule.name, rule)
  }

  /**
   * 移除验证规则
   */
  removeValidationRule(ruleName: string): boolean {
    return this.validationRules.delete(ruleName)
  }

  /**
   * 获取所有验证规则
   */
  getValidationRules(): ValidationRule[] {
    return Array.from(this.validationRules.values()).sort((a, b) => b.priority - a.priority)
  }

  /**
   * 启用/禁用验证
   */
  setValidationEnabled(enabled: boolean): void {
    this.enableValidation = enabled
    if (!enabled) {
      this.validationCache.clear()
    }
  }

  /**
   * 清除验证缓存
   */
  clearValidationCache(): void {
    this.validationCache.clear()
  }

  // ========== 🆕 配置模板管理方法 ==========

  /**
   * 注册配置模板
   */
  registerTemplate(template: ConfigurationTemplate): boolean {
    try {
      // 验证模板配置
      const validationResult = this.validateConfiguration(template.configuration)
      if (!validationResult.isValid) {
        console.error(`模板配置验证失败 [${template.id}]:`, validationResult.errors)
        return false
      }

      this.configurationTemplates.set(template.id, template)
      console.log(`配置模板已注册: ${template.name} (${template.id})`)
      return true
    } catch (error) {
      console.error(`注册模板失败 [${template.id}]:`, error)
      return false
    }
  }

  /**
   * 获取配置模板
   */
  getTemplate(templateId: string): ConfigurationTemplate | null {
    return this.configurationTemplates.get(templateId) || null
  }

  /**
   * 获取所有模板（支持筛选）
   */
  getTemplates(filter?: {
    category?: string
    componentType?: string
    tags?: string[]
    isBuiltIn?: boolean
  }): ConfigurationTemplate[] {
    this.ensureBuiltInTemplatesLoaded()

    let templates = Array.from(this.configurationTemplates.values())

    if (filter) {
      if (filter.category) {
        templates = templates.filter(t => t.category === filter.category)
      }
      if (filter.componentType) {
        templates = templates.filter(t => t.componentType === filter.componentType)
      }
      if (filter.tags) {
        templates = templates.filter(t =>
          filter.tags!.some(tag => t.metadata.tags.includes(tag))
        )
      }
      if (filter.isBuiltIn !== undefined) {
        templates = templates.filter(t => t.metadata.isBuiltIn === filter.isBuiltIn)
      }
    }

    return templates.sort((a, b) => b.metadata.updatedAt - a.metadata.updatedAt)
  }

  /**
   * 应用配置模板到组件
   */
  async applyTemplate(
    templateId: string,
    componentId: string,
    parameters: Record<string, any> = {},
    author = 'system'
  ): Promise<boolean> {
    const template = this.getTemplate(templateId)
    if (!template) {
      console.error(`模板不存在: ${templateId}`)
      return false
    }

    try {
      // 生成应用了参数的配置
      const appliedConfig = this.applyTemplateParameters(template, parameters)

      // 记录模板应用
      const application: TemplateApplication = {
        templateId,
        componentId,
        parameters,
        appliedAt: Date.now(),
        appliedBy: author
      }

      if (!this.templateApplications.has(componentId)) {
        this.templateApplications.set(componentId, [])
      }
      this.templateApplications.get(componentId)!.push(application)

      // 应用配置到组件
      const success = this.setConfiguration(
        componentId,
        appliedConfig,
        'user',
        author,
        'minor',
        false // 不跳过验证
      )

      if (success) {
        console.log(`模板已应用到组件: ${template.name} -> ${componentId}`)
      }

      return success
    } catch (error) {
      console.error(`应用模板失败 [${templateId} -> ${componentId}]:`, error)
      return false
    }
  }

  /**
   * 创建模板（从现有配置）
   */
  createTemplateFromConfiguration(
    componentId: string,
    templateInfo: {
      name: string
      description: string
      category: string
      componentType: string
      author: string
      tags?: string[]
    }
  ): ConfigurationTemplate | null {
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

    if (this.registerTemplate(template)) {
      return template
    }

    return null
  }

  /**
   * 删除模板
   */
  removeTemplate(templateId: string): boolean {
    const template = this.getTemplate(templateId)
    if (!template) {
      return false
    }

    if (template.metadata.isBuiltIn) {
      console.warn(`不能删除内置模板: ${templateId}`)
      return false
    }

    return this.configurationTemplates.delete(templateId)
  }

  /**
   * 获取组件的模板应用历史
   */
  getTemplateApplicationHistory(componentId: string): TemplateApplication[] {
    return this.templateApplications.get(componentId) || []
  }

  // ========== 私有方法 ==========

  /**
   * 计算配置内容哈希
   */
  private calculateContentHash(configuration: WidgetConfiguration): string {
    const normalizedConfig = this.normalizeConfiguration(configuration)
    const configString = JSON.stringify(normalizedConfig)
    return this.simpleHash(configString)
  }

  /**
   * 规范化配置对象，确保哈希计算的一致性
   */
  private normalizeConfiguration(config: WidgetConfiguration): any {
    const normalized = { ...config }

    // 忽略时间戳字段，避免无意义的哈希变化
    if (normalized.metadata) {
      const { updatedAt, createdAt, ...metadataWithoutTimestamp } = normalized.metadata
      normalized.metadata = metadataWithoutTimestamp
    }

    // 递归排序对象键，确保哈希一致性
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
      hash = hash & hash // 转换为32位整数
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
   * 调度事件发射（防抖处理）
   */
  private async scheduleEventEmission(
    componentId: string,
    section: keyof WidgetConfiguration | 'complete',
    oldVersion: ConfigurationVersion | undefined,
    newVersion: ConfigurationVersion,
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
          shouldExecute: section === 'dataSource' // 只有数据源变更才需要执行
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

    // 并行执行所有监听器
    const promises = Array.from(listeners).map(async listener => {
      try {
        await listener(event)
      } catch (error) {}
    })

    await Promise.allSettled(promises)
  }

  /**
   * 保存配置快照到内存存储
   */
  private saveConfigurationSnapshot(componentId: string, version: ConfigurationVersion, configuration: WidgetConfiguration): void {
    if (!this.configurationSnapshots.has(componentId)) {
      this.configurationSnapshots.set(componentId, new Map())
    }

    const snapshots = this.configurationSnapshots.get(componentId)!
    snapshots.set(version.version.toString(), this.deepClone(configuration))

    // 限制快照数量，防止内存溢出
    if (snapshots.size > this.DEFAULT_MAX_HISTORY * 2) {
      const versions = Array.from(snapshots.keys()).map(Number).sort((a, b) => a - b)
      const toDelete = versions.slice(0, versions.length - this.DEFAULT_MAX_HISTORY)
      toDelete.forEach(v => snapshots.delete(v.toString()))
    }
  }

  /**
   * 更新版本历史记录
   */
  private updateVersionHistory(currentHistory: ConfigurationVersion[], newVersion: ConfigurationVersion): ConfigurationVersion[] {
    const updatedHistory = [...currentHistory, newVersion]

    // 按时间戳排序（最新的在前）
    updatedHistory.sort((a, b) => b.timestamp - a.timestamp)

    // 限制历史记录数量
    return updatedHistory.slice(0, this.DEFAULT_MAX_HISTORY)
  }

  /**
   * 计算两个配置之间的差异
   */
  private calculateConfigurationDiff(config1: WidgetConfiguration, config2: WidgetConfiguration): Record<string, any> {
    const diff: Record<string, any> = {}

    // 比较每个配置节
    const sections: (keyof WidgetConfiguration)[] = ['base', 'component', 'dataSource', 'interaction', 'metadata']

    sections.forEach(section => {
      const diff1 = config1[section] || {}
      const diff2 = config2[section] || {}

      const sectionDiff = this.deepObjectDiff(diff1, diff2)
      if (Object.keys(sectionDiff).length > 0) {
        diff[section] = sectionDiff
      }
    })

    return diff
  }

  /**
   * 深度对象差异比较
   */
  private deepObjectDiff(obj1: any, obj2: any): Record<string, any> {
    const diff: Record<string, any> = {}

    // 获取所有键
    const keys = new Set([...Object.keys(obj1 || {}), ...Object.keys(obj2 || {})])

    keys.forEach(key => {
      const val1 = obj1?.[key]
      const val2 = obj2?.[key]

      if (val1 !== val2) {
        if (typeof val1 === 'object' && typeof val2 === 'object' && val1 !== null && val2 !== null) {
          const nestedDiff = this.deepObjectDiff(val1, val2)
          if (Object.keys(nestedDiff).length > 0) {
            diff[key] = nestedDiff
          }
        } else {
          diff[key] = { from: val1, to: val2 }
        }
      }
    })

    return diff
  }

  /**
   * 生成验证缓存键
   */
  private generateValidationCacheKey(configuration: WidgetConfiguration, context?: ValidationContext): string {
    const configHash = this.calculateContentHash(configuration)
    const contextHash = context ? this.simpleHash(JSON.stringify(context)) : 'default'
    return `${configHash}_${contextHash}`
  }

  /**
   * 基础结构验证
   */
  private validateBasicStructure(configuration: WidgetConfiguration, errors: ValidationError[]): void {
    // 验证必需的配置节
    const requiredSections: (keyof WidgetConfiguration)[] = ['base', 'component', 'dataSource', 'interaction']

    requiredSections.forEach(section => {
      if (!configuration[section]) {
        errors.push({
          code: 'MISSING_SECTION',
          message: `缺少必需的配置节: ${section}`,
          path: section,
          severity: 'error'
        })
      }
    })

    // 验证metadata结构
    if (configuration.metadata) {
      if (!configuration.metadata.version) {
        errors.push({
          code: 'MISSING_VERSION',
          message: '配置元数据缺少版本信息',
          path: 'metadata.version',
          severity: 'warning'
        })
      }
    }

    // 验证数据源配置
    if (configuration.dataSource) {
      this.validateDataSourceStructure(configuration.dataSource as any, errors)
    }
  }

  /**
   * 数据源结构验证
   */
  private validateDataSourceStructure(dataSource: any, errors: ValidationError[]): void {
    if (dataSource.type && !['static', 'api', 'websocket', 'device'].includes(dataSource.type)) {
      errors.push({
        code: 'INVALID_DATASOURCE_TYPE',
        message: `不支持的数据源类型: ${dataSource.type}`,
        path: 'dataSource.type',
        severity: 'error'
      })
    }

    if (dataSource.type === 'api' && !dataSource.url) {
      errors.push({
        code: 'MISSING_API_URL',
        message: 'API数据源缺少URL配置',
        path: 'dataSource.url',
        severity: 'error'
      })
    }
  }

  /**
   * 自定义规则验证
   */
  private validateWithCustomRules(
    configuration: WidgetConfiguration,
    context: ValidationContext | undefined,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    const rules = this.getValidationRules()

    // 合并上下文中的自定义规则
    if (context?.customRules) {
      rules.push(...context.customRules)
      rules.sort((a, b) => b.priority - a.priority)
    }

    rules.forEach(rule => {
      try {
        const ruleErrors = rule.validate(configuration, context)
        ruleErrors.forEach(error => {
          if (error.severity === 'warning') {
            warnings.push(error as ValidationWarning)
          } else {
            errors.push(error)
          }
        })
      } catch (validationError) {
        errors.push({
          code: 'VALIDATION_RULE_ERROR',
          message: `验证规则"${rule.name}"执行失败: ${validationError}`,
          path: 'validation',
          severity: 'error',
          data: { ruleName: rule.name, error: validationError }
        })
      }
    })
  }

  /**
   * 确保内置模板已加载
   */
  private ensureBuiltInTemplatesLoaded(): void {
    if (this.builtInTemplatesLoaded) return

    // 加载内置模板
    this.loadBuiltInTemplates()
    this.builtInTemplatesLoaded = true
  }

  /**
   * 加载内置模板
   */
  private loadBuiltInTemplates(): void {
    const builtInTemplates: ConfigurationTemplate[] = [
      // 基础数字显示模板
      {
        id: 'builtin_digit_display_basic',
        name: '基础数字显示',
        description: '简单的数字显示组件模板',
        category: 'statistics',
        componentType: 'digit-indicator',
        configuration: {
          base: { width: 200, height: 100, x: 0, y: 0 },
          component: {
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
      },
      // 基础图表模板
      {
        id: 'builtin_line_chart_basic',
        name: '基础折线图',
        description: '简单的折线图组件模板',
        category: 'chart',
        componentType: 'line-chart',
        configuration: {
          base: { width: 400, height: 300, x: 0, y: 0 },
          component: {
            title: '数据趋势',
            xAxisLabel: '时间',
            yAxisLabel: '数值'
          },
          dataSource: {
            type: 'api',
            url: '/api/chart-data',
            method: 'GET'
          },
          interaction: {},
          metadata: {
            version: '1.0.0',
            createdAt: Date.now(),
            updatedAt: Date.now(),
            description: '内置基础折线图模板'
          }
        },
        parameters: [
          {
            name: 'title',
            type: 'string',
            description: '图表标题',
            defaultValue: '数据趋势',
            required: true,
            path: 'component.title'
          },
          {
            name: 'apiUrl',
            type: 'string',
            description: 'API接口地址',
            defaultValue: '/api/chart-data',
            required: true,
            path: 'dataSource.url'
          }
        ],
        metadata: {
          version: '1.0.0',
          author: 'ThingsPanel',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          tags: ['图表', '折线图', '基础'],
          isBuiltIn: true
        }
      }
    ]

    builtInTemplates.forEach(template => {
      this.configurationTemplates.set(template.id, template)
    })

    console.log(`已加载 ${builtInTemplates.length} 个内置模板`)
  }

  /**
   * 应用模板参数到配置
   */
  private applyTemplateParameters(template: ConfigurationTemplate, parameters: Record<string, any>): WidgetConfiguration {
    const config = this.deepClone(template.configuration)

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
}

// 全局单例
export const configurationStateManager = new ConfigurationStateManager()

// Vue Composable
export function useConfigurationState() {
  return {
    manager: configurationStateManager,

    // 基础配置操作
    getConfig: (componentId: string) => configurationStateManager.getConfiguration(componentId),
    setConfig: (
      componentId: string,
      config: WidgetConfiguration,
      source?: ConfigurationVersion['source'],
      author?: string,
      changeType?: 'major' | 'minor' | 'patch' | 'hotfix',
      skipValidation?: boolean
    ) => configurationStateManager.setConfiguration(componentId, config, source, author, changeType, skipValidation),
    updateSection: <K extends keyof WidgetConfiguration>(
      componentId: string,
      section: K,
      sectionConfig: WidgetConfiguration[K],
      source?: ConfigurationVersion['source'],
      forceUpdate?: boolean  // 🔥 新增：强制更新参数
    ) => configurationStateManager.updateConfigurationSection(componentId, section, sectionConfig, source, forceUpdate),

    // 版本信息
    getVersion: (componentId: string) => configurationStateManager.getConfigurationVersion(componentId),
    isUpToDate: (componentId: string, expectedHash?: string) =>
      configurationStateManager.isConfigurationUpToDate(componentId, expectedHash),

    // 🆕 版本历史管理
    getVersionHistory: (componentId: string) => configurationStateManager.getVersionHistory(componentId),
    restoreToVersion: (componentId: string, targetVersion: number) =>
      configurationStateManager.restoreToVersion(componentId, targetVersion),
    compareVersions: (componentId: string, version1: number, version2: number) =>
      configurationStateManager.compareVersions(componentId, version1, version2),
    cleanupHistory: (componentId: string, keepCount?: number) =>
      configurationStateManager.cleanupVersionHistory(componentId, keepCount),

    // 🆕 配置验证
    validateConfig: (config: WidgetConfiguration, context?: ValidationContext) =>
      configurationStateManager.validateConfiguration(config, context),
    registerValidationRule: (rule: ValidationRule) =>
      configurationStateManager.registerValidationRule(rule),
    removeValidationRule: (ruleName: string) =>
      configurationStateManager.removeValidationRule(ruleName),
    getValidationRules: () => configurationStateManager.getValidationRules(),
    setValidationEnabled: (enabled: boolean) =>
      configurationStateManager.setValidationEnabled(enabled),
    clearValidationCache: () => configurationStateManager.clearValidationCache(),

    // 🆕 配置模板管理
    registerTemplate: (template: ConfigurationTemplate) =>
      configurationStateManager.registerTemplate(template),
    getTemplate: (templateId: string) => configurationStateManager.getTemplate(templateId),
    getTemplates: (filter?: {
      category?: string
      componentType?: string
      tags?: string[]
      isBuiltIn?: boolean
    }) => configurationStateManager.getTemplates(filter),
    applyTemplate: (templateId: string, componentId: string, parameters?: Record<string, any>, author?: string) =>
      configurationStateManager.applyTemplate(templateId, componentId, parameters, author),
    createTemplateFromConfig: (componentId: string, templateInfo: {
      name: string
      description: string
      category: string
      componentType: string
      author: string
      tags?: string[]
    }) => configurationStateManager.createTemplateFromConfiguration(componentId, templateInfo),
    removeTemplate: (templateId: string) => configurationStateManager.removeTemplate(templateId),
    getTemplateApplicationHistory: (componentId: string) =>
      configurationStateManager.getTemplateApplicationHistory(componentId),

    // 事件系统
    subscribe: (componentId: string, listener: (event: ConfigurationUpdateEvent) => void) =>
      configurationStateManager.onConfigurationUpdate(componentId, listener)
  }
}
