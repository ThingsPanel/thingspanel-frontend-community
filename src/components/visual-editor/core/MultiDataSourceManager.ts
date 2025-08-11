/**
 * 多数据源管理器
 * 负责管理组件的多个数据源配置、验证和数据绑定
 */

import { ref, reactive, computed, watch } from 'vue'
import type { 
  IMultiDataSourceManager,
  ComponentDataRequirements,
  DataSourceRequirement,
  DataSourceConfig,
  MultiDataSourceConfig,
  DataSourceUpdateEvent,
  DataSourceValidationResult,
  DataSourceType,
  DataSourceStatus
} from './multi-data-source-types'

export class MultiDataSourceManager implements IMultiDataSourceManager {
  // 响应式状态
  private config = reactive<MultiDataSourceConfig>({
    dataSources: {},
    bindings: {},
    metadata: {
      createdAt: Date.now(),
      updatedAt: Date.now(),
      version: '1.0.0'
    }
  })

  private requirements = ref<ComponentDataRequirements>()
  private updateListeners = new Set<(event: DataSourceUpdateEvent) => void>()

  // 计算属性
  get dataSourceCount() {
    return Object.keys(this.config.dataSources).length
  }

  get configuredCount() {
    return Object.values(this.config.dataSources)
      .filter(ds => ds.status === 'configured').length
  }

  get isValid() {
    const validation = this.validateConfiguration()
    return validation.isValid
  }

  get hasRequiredDataSources() {
    if (!this.requirements.value) return false
    
    const requiredIds = this.requirements.value.dataSources
      .filter(req => req.required)
      .map(req => req.id)
    
    return requiredIds.every(id => {
      const ds = this.config.dataSources[id]
      return ds && ds.enabled && ds.status === 'configured'
    })
  }

  /**
   * 初始化数据源配置
   */
  async initialize(requirements: ComponentDataRequirements): Promise<void> {
    console.log('🔧 [MultiDataSourceManager] 初始化数据源配置:', requirements)
    
    this.requirements.value = requirements
    
    // 清空现有配置
    this.config.dataSources = {}
    this.config.bindings = {}
    
    // 根据需求创建默认数据源配置
    for (const requirement of requirements.dataSources) {
      await this.addDataSource(requirement)
    }
    
    this.updateMetadata()
  }

  /**
   * 添加数据源
   */
  async addDataSource(requirement: DataSourceRequirement): Promise<string> {
    const dataSourceConfig: DataSourceConfig = {
      id: requirement.id,
      type: requirement.type,
      enabled: true,
      status: 'pending',
      config: requirement.defaultConfig || {},
      lastUpdated: Date.now()
    }

    this.config.dataSources[requirement.id] = dataSourceConfig
    this.updateMetadata()
    
    this.emitUpdate({
      dataSourceId: requirement.id,
      type: 'config',
      value: dataSourceConfig,
      timestamp: Date.now()
    })

    console.log('➕ [MultiDataSourceManager] 添加数据源:', requirement.id)
    return requirement.id
  }

  /**
   * 移除数据源
   */
  async removeDataSource(id: string): Promise<void> {
    if (!this.config.dataSources[id]) {
      throw new Error(`数据源 ${id} 不存在`)
    }

    // 检查是否为必需数据源
    const requirement = this.requirements.value?.dataSources.find(req => req.id === id)
    if (requirement?.required) {
      throw new Error(`无法移除必需的数据源: ${requirement.label}`)
    }

    // 移除数据源和相关绑定
    delete this.config.dataSources[id]
    
    // 清理相关绑定
    Object.keys(this.config.bindings).forEach(prop => {
      if (this.config.bindings[prop] === id) {
        delete this.config.bindings[prop]
      }
    })

    this.updateMetadata()
    console.log('➖ [MultiDataSourceManager] 移除数据源:', id)
  }

  /**
   * 更新数据源配置
   */
  async updateDataSource(id: string, updates: Partial<DataSourceConfig>): Promise<void> {
    const existing = this.config.dataSources[id]
    if (!existing) {
      throw new Error(`数据源 ${id} 不存在`)
    }

    // 合并更新
    const updated = {
      ...existing,
      ...updates,
      lastUpdated: Date.now()
    }

    this.config.dataSources[id] = updated
    this.updateMetadata()

    this.emitUpdate({
      dataSourceId: id,
      type: 'config',
      value: updated,
      timestamp: Date.now()
    })

    console.log('🔄 [MultiDataSourceManager] 更新数据源配置:', id, updates)
  }

  /**
   * 更新数据源数据
   */
  async updateDataSourceData(id: string, data: any): Promise<void> {
    const existing = this.config.dataSources[id]
    if (!existing) {
      throw new Error(`数据源 ${id} 不存在`)
    }

    // 更新数据和状态
    existing.data = data
    existing.lastUpdated = Date.now()
    existing.status = 'configured'
    existing.error = undefined

    this.updateMetadata()

    this.emitUpdate({
      dataSourceId: id,
      type: 'data',
      value: data,
      timestamp: Date.now()
    })

    console.log('📊 [MultiDataSourceManager] 更新数据源数据:', id)
  }

  /**
   * 获取数据源配置
   */
  getDataSource(id: string): DataSourceConfig | undefined {
    return this.config.dataSources[id]
  }

  /**
   * 获取所有数据源
   */
  getAllDataSources(): Record<string, DataSourceConfig> {
    return { ...this.config.dataSources }
  }

  /**
   * 验证配置完整性
   */
  validateConfiguration(): DataSourceValidationResult {
    const errors: string[] = []
    const warnings: string[] = []
    const details: any[] = []

    // 检查必需数据源
    if (this.requirements.value) {
      const requiredDataSources = this.requirements.value.dataSources.filter(req => req.required)
      
      for (const requirement of requiredDataSources) {
        const dataSource = this.config.dataSources[requirement.id]
        
        if (!dataSource) {
          errors.push(`缺少必需的数据源: ${requirement.label}`)
          continue
        }

        if (!dataSource.enabled) {
          warnings.push(`必需的数据源已禁用: ${requirement.label}`)
        }

        if (dataSource.status !== 'configured') {
          errors.push(`必需的数据源未配置: ${requirement.label}`)
        }

        if (!dataSource.data) {
          errors.push(`必需的数据源无数据: ${requirement.label}`)
        }

        details.push({
          dataSourceId: requirement.id,
          fieldValidation: this.validateDataSourceFields(dataSource)
        })
      }

      // 检查数据源数量限制
      const currentCount = this.dataSourceCount
      if (currentCount > this.requirements.value.maxDataSources) {
        errors.push(`数据源数量超出限制: ${currentCount} > ${this.requirements.value.maxDataSources}`)
      }
      
      if (currentCount < this.requirements.value.minDataSources) {
        errors.push(`数据源数量不足: ${currentCount} < ${this.requirements.value.minDataSources}`)
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      details
    }
  }

  /**
   * 验证单个数据源字段
   */
  private validateDataSourceFields(dataSource: DataSourceConfig): Record<string, { isValid: boolean; error?: string }> {
    const validation: Record<string, { isValid: boolean; error?: string }> = {}

    if (dataSource.type === 'array' && dataSource.config?.arrayConfig) {
      const { xField, yField } = dataSource.config.arrayConfig
      const data = dataSource.data

      if (Array.isArray(data) && data.length > 0) {
        const firstItem = data[0]
        
        validation.xField = {
          isValid: firstItem.hasOwnProperty(xField),
          error: firstItem.hasOwnProperty(xField) ? undefined : `字段 ${xField} 在数据中不存在`
        }
        
        validation.yField = {
          isValid: firstItem.hasOwnProperty(yField),
          error: firstItem.hasOwnProperty(yField) ? undefined : `字段 ${yField} 在数据中不存在`
        }
      }
    }

    return validation
  }

  /**
   * 获取绑定到组件属性的数据
   */
  getBoundData(propertyName: string): any {
    const dataSourceId = this.config.bindings[propertyName]
    if (!dataSourceId) return undefined

    const dataSource = this.config.dataSources[dataSourceId]
    return dataSource?.data
  }

  /**
   * 设置数据源绑定
   */
  setBinding(propertyName: string, dataSourceId: string): void {
    if (!this.config.dataSources[dataSourceId]) {
      throw new Error(`数据源 ${dataSourceId} 不存在`)
    }

    this.config.bindings[propertyName] = dataSourceId
    this.updateMetadata()
    
    console.log('🔗 [MultiDataSourceManager] 设置属性绑定:', propertyName, '->', dataSourceId)
  }

  /**
   * 获取完整配置
   */
  getFullConfiguration(): MultiDataSourceConfig {
    return { ...this.config }
  }

  /**
   * 加载配置
   */
  loadConfiguration(config: MultiDataSourceConfig): void {
    Object.assign(this.config, config)
    console.log('📥 [MultiDataSourceManager] 加载配置:', config)
  }

  /**
   * 添加更新监听器
   */
  onUpdate(listener: (event: DataSourceUpdateEvent) => void): () => void {
    this.updateListeners.add(listener)
    return () => this.updateListeners.delete(listener)
  }

  /**
   * 触发更新事件
   */
  private emitUpdate(event: DataSourceUpdateEvent): void {
    this.updateListeners.forEach(listener => {
      try {
        listener(event)
      } catch (error) {
        console.error('数据源更新监听器错误:', error)
      }
    })
  }

  /**
   * 更新元信息
   */
  private updateMetadata(): void {
    this.config.metadata.updatedAt = Date.now()
  }

  /**
   * 清理资源
   */
  cleanup(): void {
    this.updateListeners.clear()
    this.config.dataSources = {}
    this.config.bindings = {}
    this.requirements.value = undefined
    console.log('🧹 [MultiDataSourceManager] 清理完成')
  }

  /**
   * 获取数据源统计信息
   */
  getStatistics() {
    const all = Object.values(this.config.dataSources)
    const byStatus = all.reduce((acc, ds) => {
      acc[ds.status] = (acc[ds.status] || 0) + 1
      return acc
    }, {} as Record<DataSourceStatus, number>)

    const byType = all.reduce((acc, ds) => {
      acc[ds.type] = (acc[ds.type] || 0) + 1
      return acc
    }, {} as Record<DataSourceType, number>)

    return {
      total: all.length,
      enabled: all.filter(ds => ds.enabled).length,
      configured: all.filter(ds => ds.status === 'configured').length,
      hasErrors: all.filter(ds => ds.error).length,
      byStatus,
      byType
    }
  }
}

/**
 * 创建多数据源管理器实例
 */
export function createMultiDataSourceManager(): MultiDataSourceManager {
  return new MultiDataSourceManager()
}