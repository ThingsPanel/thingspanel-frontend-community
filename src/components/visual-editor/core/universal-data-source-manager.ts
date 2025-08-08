/**
 * 通用数据源管理器（增强版）
 * 支持多种数据源类型：静态、设备、HTTP、WebSocket
 * 集成配置验证、错误处理、性能监控等功能
 */

import type {
  DataSource,
  DataSourceValue,
  DataSourceUpdateCallback,
  StaticDataSource,
  DeviceDataSource,
  HttpDataSource,
  WebSocketDataSource,
  DataPathMapping
} from '@/components/visual-editor/types/data-source'
import { DataSourceType } from '@/components/visual-editor/types/data-source'
import { dataPathResolver } from '@/components/visual-editor/utils/data-path-resolver'
import { dataSourceValidator } from './data-source-validator'
import type {
  IDataSourceManager,
  DataSourceConfig,
  DataSourceStatus,
  DataSourceError,
  DataSourceErrorType,
  ValidationResult
} from './data-source-types'

// 设备数据API (从原有的data-source-manager导入)
import {
  telemetryDataCurrentKeys,
  telemetryDataHistoryList,
  getAttributeDataSet,
  getAttributeDatasKey
} from '@/service/api/device'
// 导入组件API配置系统
import { getComponentApiConfig, selectApiForComponent } from './component-api-config'

/**
 * 数据源性能指标
 */
interface DataSourceMetrics {
  totalRequests: number
  successfulRequests: number
  failedRequests: number
  averageResponseTime: number
  lastRequestTime: number
  errorRate: number
}

/**
 * 数据源实例状态
 */
interface DataSourceInstanceState {
  status: DataSourceStatus
  lastError?: DataSourceError
  metrics: DataSourceMetrics
  createdAt: number
  lastUpdated: number
}

export class DataSourceManager implements IDataSourceManager {
  private subscriptions = new Map<string, Set<DataSourceUpdateCallback>>()
  private values = new Map<string, DataSourceValue>()
  private intervals = new Map<string, NodeJS.Timeout>()

  // 增强功能：数据源实例管理
  private dataSourceInstances = new Map<string, DataSourceConfig>()
  private dataSourceStates = new Map<string, DataSourceInstanceState>()

  // 性能监控
  private globalMetrics = {
    totalDataSources: 0,
    activeSubscriptions: 0,
    totalRequests: 0,
    totalErrors: 0
  }

  // 生成订阅键
  private getSubscriptionKey(dataSource: DataSource): string {
    return `${dataSource.type}_${dataSource.name}_${JSON.stringify(dataSource.dataPaths || [])}`
  }

  /**
   * 创建数据源实例（IDataSourceManager接口实现）
   */
  createDataSource(id: string, config: DataSourceConfig): any {
    console.log('🏗️ [EnhancedDataSourceManager] 创建数据源实例:', id, config.type)

    // 验证配置
    const validation = dataSourceValidator.validateConfig(config)
    if (!validation.valid) {
      const error = this.createDataSourceError(
        'CONFIG_ERROR',
        `数据源配置验证失败: ${validation.errors.join(', ')}`,
        'CONFIG_VALIDATION_FAILED',
        { validation },
        false
      )
      throw error
    }

    // 记录警告
    if (validation.warnings.length > 0) {
      console.warn('⚠️ [EnhancedDataSourceManager] 配置验证警告:', validation.warnings)
    }

    // 存储配置和状态
    this.dataSourceInstances.set(id, config)
    this.dataSourceStates.set(id, {
      status: 'idle' as DataSourceStatus,
      metrics: {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        averageResponseTime: 0,
        lastRequestTime: 0,
        errorRate: 0
      },
      createdAt: Date.now(),
      lastUpdated: Date.now()
    })

    this.globalMetrics.totalDataSources++

    console.log('✅ [EnhancedDataSourceManager] 数据源实例创建成功:', id)

    // 返回模拟的数据源实例
    return {
      id,
      config,
      status: 'idle',
      lastUpdated: Date.now(),
      start: () => this.startDataSource(id),
      stop: () => this.stopDataSource(id),
      fetchData: () => this.fetchDataSourceData(id),
      validateConfig: () => validation.valid,
      testConnection: () => this.testDataSourceConfig(config)
    }
  }

  /**
   * 获取数据源实例
   */
  getDataSource(id: string): any {
    const config = this.dataSourceInstances.get(id)
    const state = this.dataSourceStates.get(id)

    if (!config || !state) {
      return null
    }

    return {
      id,
      config,
      status: state.status,
      lastUpdated: state.lastUpdated,
      error: state.lastError,
      metrics: state.metrics,
      start: () => this.startDataSource(id),
      stop: () => this.stopDataSource(id),
      fetchData: () => this.fetchDataSourceData(id),
      validateConfig: () => dataSourceValidator.validateConfig(config).valid,
      testConnection: () => this.testDataSourceConfig(config)
    }
  }

  /**
   * 移除数据源实例
   */
  removeDataSource(id: string): boolean {
    console.log('🗑️ [EnhancedDataSourceManager] 移除数据源实例:', id)

    // 停止数据源
    this.stopDataSource(id)

    // 清理实例和状态
    const removed = this.dataSourceInstances.delete(id) && this.dataSourceStates.delete(id)

    if (removed) {
      this.globalMetrics.totalDataSources--
      console.log('✅ [EnhancedDataSourceManager] 数据源实例已移除:', id)
    }

    return removed
  }

  /**
   * 测试数据源配置
   */
  async testDataSourceConfig(config: DataSourceConfig): Promise<boolean> {
    console.log('🧪 [EnhancedDataSourceManager] 测试数据源配置:', config.type)

    try {
      const validation = await dataSourceValidator.validateConnection(config)

      if (!validation.valid) {
        console.error('❌ [EnhancedDataSourceManager] 数据源连接测试失败:', validation.errors)
        return false
      }

      if (validation.warnings.length > 0) {
        console.warn('⚠️ [EnhancedDataSourceManager] 连接测试警告:', validation.warnings)
      }

      console.log('✅ [EnhancedDataSourceManager] 数据源连接测试成功')
      return true
    } catch (error) {
      console.error('❌ [EnhancedDataSourceManager] 数据源连接测试异常:', error)
      return false
    }
  }

  /**
   * 启动数据源
   */
  private async startDataSource(id: string): Promise<void> {
    const state = this.dataSourceStates.get(id)
    if (!state) {
      throw new Error(`数据源实例不存在: ${id}`)
    }

    console.log('▶️ [EnhancedDataSourceManager] 启动数据源:', id)

    state.status = 'connecting' as DataSourceStatus
    state.lastUpdated = Date.now()

    try {
      // 这里可以添加实际的启动逻辑
      await new Promise(resolve => setTimeout(resolve, 100)) // 模拟启动延迟

      state.status = 'connected' as DataSourceStatus
      state.lastUpdated = Date.now()

      console.log('✅ [EnhancedDataSourceManager] 数据源启动成功:', id)
    } catch (error) {
      state.status = 'error' as DataSourceStatus
      state.lastError = this.createDataSourceError(
        'CONNECTION_ERROR',
        `数据源启动失败: ${error instanceof Error ? error.message : '未知错误'}`,
        'START_FAILED',
        { error },
        true
      )
      state.lastUpdated = Date.now()

      console.error('❌ [EnhancedDataSourceManager] 数据源启动失败:', error)
      throw state.lastError
    }
  }

  /**
   * 停止数据源
   */
  private async stopDataSource(id: string): Promise<void> {
    const state = this.dataSourceStates.get(id)
    if (!state) return

    console.log('⏹️ [EnhancedDataSourceManager] 停止数据源:', id)

    state.status = 'disconnected' as DataSourceStatus
    state.lastUpdated = Date.now()

    // 清理相关的订阅和定时器
    // 这里可以添加清理逻辑

    console.log('✅ [EnhancedDataSourceManager] 数据源已停止:', id)
  }

  /**
   * 获取数据源数据
   */
  private async fetchDataSourceData(id: string): Promise<any> {
    const config = this.dataSourceInstances.get(id)
    const state = this.dataSourceStates.get(id)

    if (!config || !state) {
      throw new Error(`数据源实例不存在: ${id}`)
    }

    console.log('📡 [EnhancedDataSourceManager] 获取数据源数据:', id)

    const startTime = Date.now()
    state.metrics.totalRequests++
    this.globalMetrics.totalRequests++

    try {
      // 转换为旧格式并使用现有的获取逻辑
      const legacyDataSource = this.convertConfigToLegacyFormat(config)
      const data = await this.getValue(legacyDataSource)

      // 更新性能指标
      const responseTime = Date.now() - startTime
      state.metrics.successfulRequests++
      state.metrics.lastRequestTime = responseTime
      state.metrics.averageResponseTime =
        (state.metrics.averageResponseTime * (state.metrics.successfulRequests - 1) + responseTime) /
        state.metrics.successfulRequests
      state.metrics.errorRate = state.metrics.failedRequests / state.metrics.totalRequests
      state.lastUpdated = Date.now()

      console.log('✅ [EnhancedDataSourceManager] 数据获取成功:', id, `${responseTime}ms`)
      return data
    } catch (error) {
      // 更新错误指标
      state.metrics.failedRequests++
      state.metrics.errorRate = state.metrics.failedRequests / state.metrics.totalRequests
      state.lastError = this.createDataSourceError(
        'DATA_ERROR',
        `数据获取失败: ${error instanceof Error ? error.message : '未知错误'}`,
        'DATA_FETCH_FAILED',
        { error },
        true
      )
      state.lastUpdated = Date.now()
      this.globalMetrics.totalErrors++

      console.error('❌ [EnhancedDataSourceManager] 数据获取失败:', id, error)
      throw state.lastError
    }
  }

  /**
   * 转换新配置格式为旧格式（兼容性）
   */
  private convertConfigToLegacyFormat(config: DataSourceConfig): DataSource {
    // 基础转换逻辑
    const baseSource: any = {
      type: config.type,
      name: config.name,
      description: config.description,
      enabled: config.enabled ?? true
    }

    // 根据类型进行特定转换
    switch (config.type) {
      case 'static':
        return {
          ...baseSource,
          data: (config as any).data,
          format: (config as any).format
        }
      case 'api':
      case 'http':
        return {
          ...baseSource,
          url: (config as any).url,
          method: (config as any).method,
          headers: (config as any).headers
            ? Object.entries((config as any).headers).map(([key, value]) => ({ key, value: String(value) }))
            : [],
          body: (config as any).body
        }
      case 'websocket':
        return {
          ...baseSource,
          url: (config as any).url,
          protocols: (config as any).protocols
        }
      case 'device':
        return {
          ...baseSource,
          deviceId: (config as any).deviceId,
          apiType: (config as any).apiType,
          parameters: (config as any).parameters,
          metricsType: (config as any).metricsType,
          metricsId: (config as any).metricsId
        }
      default:
        return baseSource
    }
  }

  /**
   * 创建数据源错误
   */
  private createDataSourceError(
    type: DataSourceErrorType,
    message: string,
    code?: string,
    details?: any,
    retryable: boolean = false
  ): DataSourceError {
    const error = new Error(message) as DataSourceError
    error.type = type
    error.code = code
    error.details = details
    error.retryable = retryable
    return error
  }

  /**
   * 获取全局指标
   */
  getGlobalMetrics() {
    return {
      ...this.globalMetrics,
      activeSubscriptions: this.subscriptions.size,
      dataSourceInstances: this.dataSourceInstances.size
    }
  }

  /**
   * 获取数据源指标
   */
  getDataSourceMetrics(id: string) {
    const state = this.dataSourceStates.get(id)
    return state ? { ...state.metrics } : null
  }

  // 订阅数据源
  subscribe(dataSource: DataSource, callback: DataSourceUpdateCallback): () => void {
    const key = this.getSubscriptionKey(dataSource)

    console.log('🔧 [UniversalDataSourceManager] 订阅数据源:', {
      type: dataSource.type,
      name: dataSource.name,
      key,
      dataPaths: dataSource.dataPaths
    })

    if (!this.subscriptions.has(key)) {
      this.subscriptions.set(key, new Set())
    }

    this.subscriptions.get(key)!.add(callback)

    // 立即获取一次数据
    this.getValue(dataSource)
      .then(value => {
        callback(value)
      })
      .catch(error => {
        console.error('立即获取数据失败:', error)
        // 发送错误状态的数据
        callback({
          values: {},
          timestamp: Date.now(),
          quality: 'bad',
          error: error.message
        })
      })

    // 如果有刷新间隔，启动定时器
    if (dataSource.refreshInterval && dataSource.refreshInterval > 0) {
      this.startRefreshTimer(dataSource)
    }

    // 返回取消订阅函数
    return () => {
      this.unsubscribe(dataSource, callback)
    }
  }

  // 取消订阅
  unsubscribe(dataSource: DataSource, callback: DataSourceUpdateCallback): void {
    const key = this.getSubscriptionKey(dataSource)
    const callbacks = this.subscriptions.get(key)

    if (callbacks) {
      callbacks.delete(callback)

      // 如果没有订阅者了，清理资源
      if (callbacks.size === 0) {
        this.subscriptions.delete(key)
        this.stopRefreshTimer(dataSource)
      }
    }

    console.log('🔧 [UniversalDataSourceManager] 取消订阅数据源:', key)
  }

  // 获取数据源值
  async getValue(dataSource: DataSource): Promise<DataSourceValue> {
    const key = this.getSubscriptionKey(dataSource)

    console.log('🔧 [UniversalDataSourceManager] 获取数据源值:', {
      type: dataSource.type,
      key,
      dataPaths: dataSource.dataPaths
    })

    // 根据数据源类型获取数据
    let rawData: any

    try {
      switch (dataSource.type) {
        case DataSourceType.STATIC:
          rawData = await this.getStaticValue(dataSource as StaticDataSource)
          break
        case DataSourceType.DEVICE:
          rawData = await this.getDeviceValue(dataSource as DeviceDataSource)
          break
        case DataSourceType.HTTP:
          rawData = await this.getHttpValue(dataSource as HttpDataSource)
          break
        case DataSourceType.WEBSOCKET:
          rawData = await this.getWebSocketValue(dataSource as WebSocketDataSource)
          break
        default:
          throw new Error(`不支持的数据源类型: ${dataSource.type}`)
      }
    } catch (error) {
      console.error('🔧 [UniversalDataSourceManager] 获取原始数据失败:', error)
      throw error
    }

    // 处理多Key映射
    const values: Record<string, any> = {}

    // 获取数组处理配置
    const defaultArrayMode = dataSource.dataMapping?.defaultArrayMode ?? 'auto'
    const defaultArrayIndex = dataSource.dataMapping?.defaultArrayIndex ?? 0
    const enableAutoDetection = dataSource.dataMapping?.enableAutoDetection ?? true

    if (dataSource.dataPaths && dataSource.dataPaths.length > 0) {
      // 使用配置的数据路径映射
      dataSource.dataPaths.forEach(mapping => {
        // 使用映射中配置的数组处理模式，如果没有则使用默认值
        const arrayMode = mapping.arrayMode ?? defaultArrayMode
        const arrayIndex = mapping.arrayIndex ?? defaultArrayIndex

        const resolvedValue = dataPathResolver.resolve(rawData, mapping.key, {
          arrayMode,
          defaultArrayIndex: arrayIndex,
          enableAutoDetection
        })
        values[mapping.target] = resolvedValue

        console.log('🔧 [UniversalDataSourceManager] 映射数据:', {
          key: mapping.key,
          target: mapping.target,
          resolvedValue,
          isArray: mapping.isArray,
          arrayMode,
          arrayIndex,
          enableAutoDetection,
          rawData
        })
      })
    } else {
      // 兼容旧版本，使用单个值
      const resolvedValue = dataPathResolver.resolve(rawData, '', {
        arrayMode: defaultArrayMode,
        defaultArrayIndex,
        enableAutoDetection
      })
      values['value'] = resolvedValue
    }

    const dataSourceValue: DataSourceValue = {
      values,
      timestamp: Date.now(),
      quality: Object.values(values).some(v => v !== undefined && v !== null) ? 'good' : 'bad',
      metadata: {
        source: dataSource.type,
        dataPaths: dataSource.dataPaths,
        originalData: rawData
      },
      rawData
    }

    console.log('🔧 [UniversalDataSourceManager] 最终数据源值:', dataSourceValue)

    // 更新缓存
    this.values.set(key, dataSourceValue)

    return dataSourceValue
  }

  // 更新数据源值并通知订阅者
  updateValue(dataSource: DataSource, value: any): void {
    const key = this.getSubscriptionKey(dataSource)

    // 处理多Key映射
    const values: Record<string, any> = {}

    // 获取数组处理配置
    const defaultArrayMode = dataSource.dataMapping?.defaultArrayMode ?? 'auto'
    const defaultArrayIndex = dataSource.dataMapping?.defaultArrayIndex ?? 0
    const enableAutoDetection = dataSource.dataMapping?.enableAutoDetection ?? true

    if (dataSource.dataPaths && dataSource.dataPaths.length > 0) {
      // 使用配置的数据路径映射
      dataSource.dataPaths.forEach(mapping => {
        const arrayMode = mapping.arrayMode ?? defaultArrayMode
        const arrayIndex = mapping.arrayIndex ?? defaultArrayIndex
        const resolvedValue = dataPathResolver.resolve(value, mapping.key, {
          arrayMode,
          defaultArrayIndex: arrayIndex,
          enableAutoDetection
        })
        values[mapping.target] = resolvedValue
      })
    } else {
      // 兼容旧版本，使用单个值
      const resolvedValue = dataPathResolver.resolve(value, '', {
        arrayMode: defaultArrayMode,
        defaultArrayIndex,
        enableAutoDetection
      })
      values['value'] = resolvedValue
    }

    const dataSourceValue: DataSourceValue = {
      values,
      timestamp: Date.now(),
      quality: Object.values(values).some(v => v !== undefined) ? 'good' : 'bad',
      metadata: {
        source: dataSource.type,
        dataPaths: dataSource.dataPaths,
        originalData: value
      },
      rawData: value
    }

    // 更新缓存
    this.values.set(key, dataSourceValue)

    // 通知订阅者
    const callbacks = this.subscriptions.get(key)
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(dataSourceValue)
        } catch (error) {
          console.error('数据源回调执行错误:', error)
        }
      })
    }
  }

  // 获取静态数据源值
  private async getStaticValue(dataSource: StaticDataSource): Promise<any> {
    console.log('🔧 [UniversalDataSourceManager] 获取静态数据源:', dataSource.data)
    // 直接返回原始数据，让数据路径解析器处理
    return dataSource.data
  }

  // 获取设备数据源值
  private async getDeviceValue(dataSource: DeviceDataSource): Promise<any> {
    // 检查是否是新的API配置格式
    if ('apiType' in dataSource && dataSource.apiType && dataSource.parameters) {
      return this.getDeviceValueNew(dataSource as any)
    }

    // 兼容旧格式
    if (!dataSource.deviceId || !dataSource.metricsType || !dataSource.metricsId) {
      throw new Error('设备数据源配置不完整')
    }

    console.log('🔧 [UniversalDataSourceManager] 获取设备数据源 (旧格式):', {
      deviceId: dataSource.deviceId,
      metricsType: dataSource.metricsType,
      metricsId: dataSource.metricsId
    })

    try {
      switch (dataSource.metricsType) {
        case 'telemetry': {
          const response = await telemetryDataCurrentKeys({
            device_id: dataSource.deviceId,
            keys: dataSource.metricsId
          })
          return {
            value: response?.data?.[0]?.value,
            timestamp: new Date().toISOString(),
            quality: 'good',
            unit: response?.data?.[0]?.unit
          }
        }
        case 'attributes': {
          const attrResponse = await getAttributeDataSet({ device_id: dataSource.deviceId })
          const attributeData = attrResponse?.data?.find((item: any) => item.key === dataSource.metricsId)
          return {
            value: attributeData?.value,
            timestamp: new Date().toISOString(),
            quality: 'good',
            unit: attributeData?.unit
          }
        }

        default:
          throw new Error(`不支持的设备数据类型: ${dataSource.metricsType}`)
      }
    } catch (error) {
      console.error('获取设备数据失败:', error)
      throw error
    }
  }

  // 获取设备数据源值（新API配置格式）
  private async getDeviceValueNew(dataSource: DeviceDataSourceNew): Promise<any> {
    if (!dataSource.apiType || !dataSource.parameters) {
      throw new Error('新格式设备数据源配置不完整')
    }

    console.log('🔧 [UniversalDataSourceManager] 获取设备数据源 (新格式):', {
      apiType: dataSource.apiType,
      parameters: dataSource.parameters
    })

    try {
      switch (dataSource.apiType) {
        case 'telemetryDataCurrentKeys': {
          const telemetryResponse = await telemetryDataCurrentKeys({
            device_id: dataSource.parameters.device_id,
            keys: dataSource.parameters.keys
          })
          // 返回原始API响应，让DataPathResolver处理数组
          console.log('🔧 [UniversalDataSourceManager] telemetryDataCurrentKeys原始响应:', telemetryResponse)
          return telemetryResponse
        }

        case 'getAttributeDataSet': {
          const attrSetResponse = await getAttributeDataSet({
            device_id: dataSource.parameters.device_id
          })
          // 返回原始API响应，让DataPathResolver处理数组
          console.log('🔧 [UniversalDataSourceManager] getAttributeDataSet原始响应:', attrSetResponse)
          return attrSetResponse
        }

        case 'getAttributeDatasKey': {
          const attrKeyResponse = await getAttributeDatasKey({
            device_id: dataSource.parameters.device_id,
            key: dataSource.parameters.key
          })
          // 返回原始API响应，让DataPathResolver处理数组
          console.log('🔧 [UniversalDataSourceManager] getAttributeDatasKey原始响应:', attrKeyResponse)
          return attrKeyResponse
        }

        case 'telemetryDataHistoryList': {
          const historyResponse = await telemetryDataHistoryList({
            device_id: dataSource.parameters.device_id,
            key: dataSource.parameters.key,
            time_range: dataSource.parameters.time_range,
            aggregate_function: dataSource.parameters.aggregate_function,
            aggregate_window: dataSource.parameters.aggregate_window
          })
          // 返回原始API响应，让DataPathResolver处理数组
          console.log('🔧 [UniversalDataSourceManager] telemetryDataHistoryList原始响应:', historyResponse)
          return historyResponse
        }

        default:
          throw new Error(`不支持的API类型: ${dataSource.apiType}`)
      }
    } catch (error) {
      console.error('🔧 [UniversalDataSourceManager] 获取设备数据失败:', error)
      throw error
    }
  }

  // 获取HTTP数据源值
  private async getHttpValue(dataSource: HttpDataSource): Promise<any> {
    try {
      // 构建请求头
      const headers: Record<string, string> = {}
      dataSource.headers?.forEach(header => {
        if (header.key && header.value) {
          headers[header.key] = header.value
        }
      })

      // 构建请求选项
      const options: RequestInit = {
        method: dataSource.method,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        }
      }

      // 添加请求体
      if (dataSource.method !== 'GET' && dataSource.body) {
        options.body = dataSource.body
      }

      // 发起请求
      const response = await fetch(dataSource.url, options)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

      console.log('🔧 [UniversalDataSourceManager] HTTP 请求成功:', {
        url: dataSource.url,
        method: dataSource.method,
        status: response.status,
        data
      })

      return data
    } catch (error) {
      console.error('🔧 [UniversalDataSourceManager] HTTP 请求失败:', error)
      throw error
    }
  }

  // 获取WebSocket数据源值
  private async getWebSocketValue(dataSource: WebSocketDataSource): Promise<any> {
    // WebSocket 数据源暂时返回模拟数据
    console.log('🔧 [UniversalDataSourceManager] WebSocket 数据源暂未实现')
    return {
      message: 'WebSocket数据源暂未实现',
      timestamp: new Date().toISOString()
    }
  }

  // 启动刷新定时器
  private startRefreshTimer(dataSource: DataSource): void {
    const key = this.getSubscriptionKey(dataSource)

    // 清除现有定时器
    this.stopRefreshTimer(dataSource)

    if (dataSource.refreshInterval && dataSource.refreshInterval > 0) {
      const interval = setInterval(() => {
        this.getValue(dataSource)
          .then(value => {
            this.updateValue(dataSource, value.rawData)
          })
          .catch(error => {
            console.error('🔧 [UniversalDataSourceManager] 轮询请求失败:', error)
          })
      }, dataSource.refreshInterval * 1000) // 转换为毫秒

      this.intervals.set(key, interval)

      console.log(`🔧 [UniversalDataSourceManager] 启动轮询: ${key}, 间隔: ${dataSource.refreshInterval}秒`)
    }
  }

  // 停止刷新定时器
  private stopRefreshTimer(dataSource: DataSource): void {
    const key = this.getSubscriptionKey(dataSource)
    const interval = this.intervals.get(key)

    if (interval) {
      clearInterval(interval)
      this.intervals.delete(key)
      console.log(`🔧 [UniversalDataSourceManager] 停止轮询: ${key}`)
    }
  }

  // 清理所有资源
  destroy(): void {
    // 清理所有定时器
    this.intervals.forEach(interval => {
      clearInterval(interval)
    })
    this.intervals.clear()

    // 清理订阅
    this.subscriptions.clear()
    this.values.clear()

    console.log('🔧 [UniversalDataSourceManager] 资源已清理')
  }
}

// 实例化并导出
export const universalDataSourceManager = new DataSourceManager()
export { universalDataSourceManager as dataSourceManager }
export default universalDataSourceManager
