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
}

// 配置状态项
export interface ConfigurationState {
  componentId: string
  configuration: WidgetConfiguration
  version: ConfigurationVersion
  lastModified: number
  isDirty: boolean
  isLocked: boolean // 防止循环更新的锁
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
  
  // 🆕 持久化存储
  private readonly STORAGE_KEY = 'visual-editor-config-state-v2'
  
  constructor() {
    console.log('🚀 [ConfigStateManager] 配置状态管理器已初始化')
    this.loadFromStorage()
  }
  
  /**
   * 从 localStorage 加载配置
   */
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      if (stored) {
        const data = JSON.parse(stored)
        console.log(`📥 [ConfigStateManager] 从存储恢复 ${Object.keys(data.states || {}).length} 个配置`)
        
        // 恢复配置状态
        if (data.states) {
          Object.entries(data.states).forEach(([componentId, state]) => {
            this.configStates.set(componentId, state as ConfigurationState)
          })
        }
        
        // 恢复版本计数器
        if (data.versionCounter) {
          this.versionCounter.value = data.versionCounter
        }
      }
    } catch (error) {
      console.error('❌ [ConfigStateManager] 配置恢复失败:', error)
    }
  }
  
  /**
   * 保存配置到 localStorage
   */
  private saveToStorage(): void {
    try {
      const states: Record<string, ConfigurationState> = {}
      this.configStates.forEach((state, componentId) => {
        states[componentId] = state
      })
      
      const data = {
        states,
        versionCounter: this.versionCounter.value,
        timestamp: Date.now()
      }
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data))
    } catch (error) {
      console.error('❌ [ConfigStateManager] 配置保存失败:', error)
    }
  }
  
  /**
   * 获取组件配置
   */
  getConfiguration(componentId: string): WidgetConfiguration | null {
    const state = this.configStates.get(componentId)
    if (!state) {
      console.warn(`[ConfigStateManager] 配置不存在: ${componentId}`)
      return null
    }
    
    console.log(`🔍 [ConfigStateManager] 读取配置: ${componentId} v${state.version.version} (${state.version.contentHash})`)
    
    // 返回配置的深拷贝，避免外部修改
    return this.deepClone(state.configuration)
  }
  
  /**
   * 设置完整配置
   */
  setConfiguration(componentId: string, configuration: WidgetConfiguration, source: ConfigurationVersion['source'] = 'user'): boolean {
    const contentHash = this.calculateContentHash(configuration)
    const currentState = this.configStates.get(componentId)
    
    // 🔥 内容去重检查：如果内容哈希相同，直接返回不处理
    if (currentState && currentState.version.contentHash === contentHash) {
      console.log(`⏭️ [ConfigStateManager] 配置内容未变化，跳过更新: ${componentId} (${contentHash})`)
      return false
    }
    
    // 🔒 循环检测：如果组件正在更新中，直接返回避免循环
    if (this.UPDATE_LOCKS.has(componentId)) {
      console.warn(`🔒 [ConfigStateManager] 检测到循环更新，跳过: ${componentId}`)
      return false
    }
    
    const newVersion: ConfigurationVersion = {
      version: ++this.versionCounter.value,
      contentHash,
      timestamp: Date.now(),
      source,
      description: `Complete config update from ${source}`
    }
    
    const newState: ConfigurationState = {
      componentId,
      configuration: this.deepClone(configuration),
      version: newVersion,
      lastModified: Date.now(),
      isDirty: false,
      isLocked: false
    }
    
    const oldVersion = currentState?.version
    this.configStates.set(componentId, newState)
    
    console.log(`📝 [ConfigStateManager] 配置已更新: ${componentId} v${newVersion.version} (${contentHash})`)
    
    // 🆕 持久化到 localStorage
    this.saveToStorage()
    
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
    source: ConfigurationVersion['source'] = 'user'
  ): boolean {
    // 🔒 循环检测：防止同组件同时更新
    if (this.UPDATE_LOCKS.has(componentId)) {
      console.warn(`🔒 [ConfigStateManager] 循环更新检测，跳过: ${componentId}.${section}`)
      return false
    }
    
    let currentState = this.configStates.get(componentId)
    
    // 如果配置不存在，创建默认配置
    if (!currentState) {
      console.log(`🆕 [ConfigStateManager] 创建默认配置: ${componentId}`)
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
    
    // 🔥 内容哈希去重检查
    const newContentHash = this.calculateContentHash(updatedConfiguration)
    if (currentState.version.contentHash === newContentHash) {
      console.log(`⏭️ [ConfigStateManager] 配置部分内容未变化，跳过: ${componentId}.${section} (${newContentHash})`)
      return false
    }
    
    // 🔒 设置更新锁
    this.UPDATE_LOCKS.add(componentId)
    
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
    
    console.log(`🔄 [ConfigStateManager] 配置部分已更新: ${componentId}.${section} v${newVersion.version} (${newContentHash})`)
    
    // 🆕 持久化到 localStorage
    this.saveToStorage()
    
    // 异步触发事件和解锁
    this.scheduleEventEmission(componentId, section, currentState.version, newVersion, { [section]: sectionConfig })
      .finally(() => {
        // 🔓 释放更新锁
        this.UPDATE_LOCKS.delete(componentId)
      })
    
    return true
  }
  
  /**
   * 初始化组件配置
   */
  initializeConfiguration(componentId: string): void {
    if (this.configStates.has(componentId)) {
      console.warn(`[ConfigStateManager] 配置已存在，跳过初始化: ${componentId}`)
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
    
    // 🆕 持久化到 localStorage
    this.saveToStorage()
    
    console.log(`🆕 [ConfigStateManager] 配置已初始化: ${componentId} v${version.version} (${contentHash})`)
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
      
      console.log(`🗑️ [ConfigStateManager] 配置已清理: ${componentId}`)
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
      hash = ((hash << 5) - hash) + char
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
    
    return new Promise((resolve) => {
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
    console.log(`📡 [ConfigStateManager] 发射配置更新事件: ${event.componentId}.${event.section} v${event.newVersion.version}`)
    
    const listeners = this.eventListeners.get(event.componentId)
    if (!listeners || listeners.size === 0) {
      console.log(`📡 [ConfigStateManager] 无监听器: ${event.componentId}`)
      return
    }
    
    // 并行执行所有监听器
    const promises = Array.from(listeners).map(async (listener) => {
      try {
        await listener(event)
      } catch (error) {
        console.error(`❌ [ConfigStateManager] 监听器执行失败:`, error)
      }
    })
    
    await Promise.allSettled(promises)
    console.log(`✅ [ConfigStateManager] 事件处理完成: ${event.componentId}.${event.section}`)
  }
}

// 全局单例
export const configurationStateManager = new ConfigurationStateManager()

// Vue Composable
export function useConfigurationState() {
  return {
    manager: configurationStateManager,
    
    getConfig: (componentId: string) => configurationStateManager.getConfiguration(componentId),
    setConfig: (componentId: string, config: WidgetConfiguration, source?: ConfigurationVersion['source']) => 
      configurationStateManager.setConfiguration(componentId, config, source),
    updateSection: <K extends keyof WidgetConfiguration>(
      componentId: string,
      section: K,
      sectionConfig: WidgetConfiguration[K],
      source?: ConfigurationVersion['source']
    ) => configurationStateManager.updateConfigurationSection(componentId, section, sectionConfig, source),
    
    getVersion: (componentId: string) => configurationStateManager.getConfigurationVersion(componentId),
    isUpToDate: (componentId: string, expectedHash?: string) => 
      configurationStateManager.isConfigurationUpToDate(componentId, expectedHash),
    
    subscribe: (componentId: string, listener: (event: ConfigurationUpdateEvent) => void) =>
      configurationStateManager.onConfigurationUpdate(componentId, listener)
  }
}

console.log('🚀 [ConfigStateManager] 全新配置状态管理器已加载')