/**
 * 数据源配置统一接口
 * 提供设备数据源、系统数据源、时间范围、聚合等配置的统一管理
 */

import { reactive, ref, computed, watch, type Ref } from 'vue'
import type { DeviceSourceItem } from '../types/legacy'
import { createLogger } from '@/utils/logger'
import { $t } from '@/locales'

const logger = createLogger('DataSourceConfig')

// ====== 数据源类型定义 ======

export type DataOrigin = 'system' | 'device' | 'static' // 数据来源：系统/设备/静态

export type MetricsType = 'telemetry' | 'attributes' | 'event' | 'command' // 指标类型

export type DataType = 'number' | 'string' | 'boolean' | 'object' | 'array' // 数据类型

export type AggregateFunction = 'avg' | 'sum' | 'count' | 'min' | 'max' | 'first' | 'last' // 聚合函数

// 时间范围选项
export type TimeRange =
  | 'custom'
  | 'last_5m'
  | 'last_15m'
  | 'last_30m'
  | 'last_1h'
  | 'last_3h'
  | 'last_6h'
  | 'last_12h'
  | 'last_24h'
  | 'last_3d'
  | 'last_7d'
  | 'last_15d'
  | 'last_30d'
  | 'last_60d'
  | 'last_90d'
  | 'last_6m'
  | 'last_1y'

// 聚合时间范围
export type AggregateRange =
  | 'no_aggregate'
  | '30s'
  | '1m'
  | '2m'
  | '5m'
  | '10m'
  | '15m'
  | '30m'
  | '1h'
  | '2h'
  | '4h'
  | '8h'
  | '12h'
  | '24h'
  | '1d'
  | '7d'
  | '30d'

// 系统数据源项
export interface SystemSourceItem {
  type: number
  name: string
  description?: string
}

// 设备数据源项（扩展原有定义）
export interface EnhancedDeviceSourceItem extends DeviceSourceItem {
  // 扩展字段
  alias?: string // 数据别名
  unit?: string // 数据单位
  precision?: number // 数据精度
  format?: string // 数据格式化
  color?: string // 显示颜色
  visible?: boolean // 是否可见
  // 计算字段
  formula?: string // 计算公式
  dependencies?: string[] // 依赖的其他数据源
}

// 数据源配置接口
export interface DataSourceConfig {
  // 基础配置
  origin: DataOrigin
  sourceNum?: number // 数据源数量限制

  // 系统数据源
  systemSource?: SystemSourceItem[]

  // 设备数据源
  deviceSource?: EnhancedDeviceSourceItem[]
  deviceCount?: number

  // 静态数据源
  staticData?: any[]

  // 时间配置
  isSupportTimeRange: boolean
  dataTimeRange: TimeRange
  customTimeRange?: {
    start: Date | string
    end: Date | string
  }

  // 聚合配置
  isSupportAggregate: boolean
  dataAggregateRange: AggregateRange

  // 刷新配置
  refreshInterval?: number // 刷新间隔（毫秒）
  autoRefresh?: boolean // 是否自动刷新

  // 缓存配置
  enableCache?: boolean
  cacheTimeout?: number // 缓存超时时间
}

// ====== 配置选项定义 ======

// 时间范围选项
export const TIME_RANGE_OPTIONS = [
  { label: () => $t('common.last_5m'), value: 'last_5m' as TimeRange },
  { label: () => $t('common.last_15m'), value: 'last_15m' as TimeRange },
  { label: () => $t('common.last_30m'), value: 'last_30m' as TimeRange },
  { label: () => $t('common.lastHours1'), value: 'last_1h' as TimeRange },
  { label: () => $t('common.lastHours3'), value: 'last_3h' as TimeRange },
  { label: () => $t('common.lastHours6'), value: 'last_6h' as TimeRange },
  { label: () => $t('common.lastHours12'), value: 'last_12h' as TimeRange },
  { label: () => $t('common.lastHours24'), value: 'last_24h' as TimeRange },
  { label: () => $t('common.lastDays3'), value: 'last_3d' as TimeRange },
  { label: () => $t('common.lastDays7'), value: 'last_7d' as TimeRange },
  { label: () => $t('common.lastDays15'), value: 'last_15d' as TimeRange },
  { label: () => $t('common.lastDays30'), value: 'last_30d' as TimeRange },
  { label: () => $t('common.lastDays60'), value: 'last_60d' as TimeRange },
  { label: () => $t('common.lastDays90'), value: 'last_90d' as TimeRange }
]

// 聚合范围选项
export const AGGREGATE_RANGE_OPTIONS = [
  { label: () => $t('common.notAggre'), value: 'no_aggregate' as AggregateRange },
  { label: () => $t('common.seconds30'), value: '30s' as AggregateRange },
  { label: () => $t('common.minute1'), value: '1m' as AggregateRange },
  { label: () => $t('common.minute2'), value: '2m' as AggregateRange },
  { label: () => $t('common.minute5'), value: '5m' as AggregateRange },
  { label: () => $t('common.minute10'), value: '10m' as AggregateRange },
  { label: () => $t('common.minute30'), value: '30m' as AggregateRange },
  { label: () => $t('common.hour1'), value: '1h' as AggregateRange },
  { label: () => $t('common.hour12'), value: '12h' as AggregateRange },
  { label: () => $t('common.day1'), value: '1d' as AggregateRange }
]

// 聚合函数选项
export const AGGREGATE_FUNCTION_OPTIONS = [
  { label: () => $t('common.average'), value: 'avg' as AggregateFunction },
  { label: () => $t('common.sum'), value: 'sum' as AggregateFunction },
  { label: () => $t('common.count'), value: 'count' as AggregateFunction },
  { label: () => $t('common.minimum'), value: 'min' as AggregateFunction },
  { label: () => $t('common.maximum'), value: 'max' as AggregateFunction },
  { label: () => $t('common.first'), value: 'first' as AggregateFunction },
  { label: () => $t('common.last'), value: 'last' as AggregateFunction }
]

// 指标类型选项
export const METRICS_TYPE_OPTIONS = [
  { label: () => $t('common.telemetry'), value: 'telemetry' as MetricsType },
  { label: () => $t('common.attributes'), value: 'attributes' as MetricsType },
  { label: () => $t('common.event'), value: 'event' as MetricsType },
  { label: () => $t('common.command'), value: 'command' as MetricsType }
]

// ====== 数据源配置管理器 ======

export class DataSourceConfigManager {
  private config: Ref<DataSourceConfig>
  private validators: Map<string, (value: any) => boolean | string> = new Map()

  constructor(initialConfig?: Partial<DataSourceConfig>) {
    this.config = ref(this.createDefaultConfig(initialConfig))
    this.setupValidators()
    this.setupWatchers()
  }

  // ====== 配置管理 ======

  /**
   * 创建默认配置
   */
  private createDefaultConfig(initial?: Partial<DataSourceConfig>): DataSourceConfig {
    return {
      origin: 'device',
      sourceNum: 1,
      systemSource: [],
      deviceSource: [],
      deviceCount: 0,
      staticData: [],
      isSupportTimeRange: false,
      dataTimeRange: 'last_24h',
      isSupportAggregate: false,
      dataAggregateRange: 'no_aggregate',
      refreshInterval: 30000, // 30秒
      autoRefresh: false,
      enableCache: true,
      cacheTimeout: 60000, // 1分钟
      ...initial
    }
  }

  /**
   * 获取当前配置
   */
  getConfig(): DataSourceConfig {
    return { ...this.config.value }
  }

  /**
   * 更新配置
   */
  updateConfig(updates: Partial<DataSourceConfig>): boolean {
    try {
      // 验证更新
      for (const [key, value] of Object.entries(updates)) {
        const validator = this.validators.get(key)
        if (validator) {
          const result = validator(value)
          if (typeof result === 'string') {
            throw new Error(`${key} 验证失败: ${result}`)
          }
        }
      }

      // 应用更新
      Object.assign(this.config.value, updates)

      logger.info('数据源配置已更新:', updates)
      return true
    } catch (err: any) {
      logger.error('更新数据源配置失败:', err)
      return false
    }
  }

  /**
   * 重置配置
   */
  resetConfig(): void {
    this.config.value = this.createDefaultConfig()
  }

  // ====== 设备数据源管理 ======

  /**
   * 添加设备数据源
   */
  addDeviceSource(deviceSource: Partial<EnhancedDeviceSourceItem>): void {
    const newSource: EnhancedDeviceSourceItem = {
      cardId: '',
      deviceId: '',
      deviceMetrics: '',
      name: '',
      metricsId: '',
      metricsType: 'telemetry',
      metricsDataType: 'number',
      metricsName: '',
      metricsOptions: [],
      metricsShow: true,
      aggregate_function: 'avg',
      visible: true,
      ...deviceSource
    }

    if (!this.config.value.deviceSource) {
      this.config.value.deviceSource = []
    }

    this.config.value.deviceSource.push(newSource)
    logger.info('添加设备数据源:', newSource)
  }

  /**
   * 移除设备数据源
   */
  removeDeviceSource(index: number): void {
    if (this.config.value.deviceSource && index >= 0 && index < this.config.value.deviceSource.length) {
      const removed = this.config.value.deviceSource.splice(index, 1)
      logger.info('移除设备数据源:', removed[0])
    }
  }

  /**
   * 更新设备数据源
   */
  updateDeviceSource(index: number, updates: Partial<EnhancedDeviceSourceItem>): void {
    if (this.config.value.deviceSource && index >= 0 && index < this.config.value.deviceSource.length) {
      Object.assign(this.config.value.deviceSource[index], updates)
      logger.info('更新设备数据源:', updates)
    }
  }

  // ====== 系统数据源管理 ======

  /**
   * 添加系统数据源
   */
  addSystemSource(systemSource: SystemSourceItem): void {
    if (!this.config.value.systemSource) {
      this.config.value.systemSource = []
    }
    this.config.value.systemSource.push(systemSource)
    logger.info('添加系统数据源:', systemSource)
  }

  /**
   * 移除系统数据源
   */
  removeSystemSource(index: number): void {
    if (this.config.value.systemSource && index >= 0 && index < this.config.value.systemSource.length) {
      const removed = this.config.value.systemSource.splice(index, 1)
      logger.info('移除系统数据源:', removed[0])
    }
  }

  // ====== 验证器设置 ======

  private setupValidators(): void {
    this.validators.set('sourceNum', (value: number) => {
      if (typeof value !== 'number' || value < 0 || value > 20) {
        return '数据源数量必须在0-20之间'
      }
      return true
    })

    this.validators.set('refreshInterval', (value: number) => {
      if (typeof value !== 'number' || value < 1000) {
        return '刷新间隔不能小于1秒'
      }
      return true
    })

    this.validators.set('cacheTimeout', (value: number) => {
      if (typeof value !== 'number' || value < 0) {
        return '缓存超时时间不能为负数'
      }
      return true
    })
  }

  // ====== 监听器设置 ======

  private setupWatchers(): void {
    // 监听数据来源变化，自动调整相关配置
    watch(
      () => this.config.value.origin,
      newOrigin => {
        logger.info('数据来源变更为:', newOrigin)

        // 根据数据来源调整默认配置
        if (newOrigin === 'system') {
          this.config.value.deviceSource = []
          this.config.value.isSupportTimeRange = false
        } else if (newOrigin === 'device') {
          this.config.value.systemSource = []
        } else if (newOrigin === 'static') {
          this.config.value.deviceSource = []
          this.config.value.systemSource = []
          this.config.value.isSupportTimeRange = false
          this.config.value.isSupportAggregate = false
        }
      }
    )

    // 监听聚合配置变化
    watch(
      () => this.config.value.isSupportAggregate,
      supportAggregate => {
        if (!supportAggregate) {
          this.config.value.dataAggregateRange = 'no_aggregate'
        }
      }
    )
  }

  // ====== 计算属性 ======

  /**
   * 是否有效的配置
   */
  get isValidConfig() {
    return computed(() => {
      const config = this.config.value

      // 基础验证
      if (!config.origin) return false

      // 根据数据来源验证
      if (config.origin === 'device' && (!config.deviceSource || config.deviceSource.length === 0)) {
        return false
      }

      if (config.origin === 'system' && (!config.systemSource || config.systemSource.length === 0)) {
        return false
      }

      return true
    })
  }

  /**
   * 配置摘要信息
   */
  get configSummary() {
    return computed(() => {
      const config = this.config.value
      return {
        origin: config.origin,
        sourceCount: config.origin === 'device' ? config.deviceSource?.length || 0 : config.systemSource?.length || 0,
        timeRange: config.isSupportTimeRange ? config.dataTimeRange : 'none',
        aggregate: config.isSupportAggregate ? config.dataAggregateRange : 'none',
        autoRefresh: config.autoRefresh
      }
    })
  }

  // ====== 导入导出 ======

  /**
   * 导出配置为JSON
   */
  exportConfig(): string {
    return JSON.stringify(this.config.value, null, 2)
  }

  /**
   * 从JSON导入配置
   */
  importConfig(jsonString: string): boolean {
    try {
      const imported = JSON.parse(jsonString)
      this.updateConfig(imported)
      return true
    } catch (err) {
      logger.error('导入配置失败:', err)
      return false
    }
  }

  // ====== 清理资源 ======

  dispose(): void {
    this.validators.clear()
  }
}

// ====== 工具函数 ======

/**
 * 时间范围转换为毫秒
 */
export function timeRangeToMilliseconds(timeRange: TimeRange): number {
  const ranges: Record<TimeRange, number> = {
    custom: 0,
    last_5m: 5 * 60 * 1000,
    last_15m: 15 * 60 * 1000,
    last_30m: 30 * 60 * 1000,
    last_1h: 60 * 60 * 1000,
    last_3h: 3 * 60 * 60 * 1000,
    last_6h: 6 * 60 * 60 * 1000,
    last_12h: 12 * 60 * 60 * 1000,
    last_24h: 24 * 60 * 60 * 1000,
    last_3d: 3 * 24 * 60 * 60 * 1000,
    last_7d: 7 * 24 * 60 * 60 * 1000,
    last_15d: 15 * 24 * 60 * 60 * 1000,
    last_30d: 30 * 24 * 60 * 60 * 1000,
    last_60d: 60 * 24 * 60 * 60 * 1000,
    last_90d: 90 * 24 * 60 * 60 * 1000,
    last_6m: 180 * 24 * 60 * 60 * 1000,
    last_1y: 365 * 24 * 60 * 60 * 1000
  }

  return ranges[timeRange] || 0
}

/**
 * 聚合范围转换为毫秒
 */
export function aggregateRangeToMilliseconds(aggregateRange: AggregateRange): number {
  const ranges: Record<AggregateRange, number> = {
    no_aggregate: 0,
    '30s': 30 * 1000,
    '1m': 60 * 1000,
    '2m': 2 * 60 * 1000,
    '5m': 5 * 60 * 1000,
    '10m': 10 * 60 * 1000,
    '15m': 15 * 60 * 1000,
    '30m': 30 * 60 * 1000,
    '1h': 60 * 60 * 1000,
    '2h': 2 * 60 * 60 * 1000,
    '4h': 4 * 60 * 60 * 1000,
    '8h': 8 * 60 * 60 * 1000,
    '12h': 12 * 60 * 60 * 1000,
    '24h': 24 * 60 * 60 * 1000,
    '1d': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000
  }

  return ranges[aggregateRange] || 0
}

/**
 * 创建数据源配置管理器的组合式函数
 */
export function useDataSourceConfig(initialConfig?: Partial<DataSourceConfig>) {
  const manager = new DataSourceConfigManager(initialConfig)

  return {
    config: computed(() => manager.getConfig()),
    updateConfig: manager.updateConfig.bind(manager),
    resetConfig: manager.resetConfig.bind(manager),
    addDeviceSource: manager.addDeviceSource.bind(manager),
    removeDeviceSource: manager.removeDeviceSource.bind(manager),
    updateDeviceSource: manager.updateDeviceSource.bind(manager),
    addSystemSource: manager.addSystemSource.bind(manager),
    removeSystemSource: manager.removeSystemSource.bind(manager),
    isValidConfig: manager.isValidConfig,
    configSummary: manager.configSummary,
    exportConfig: manager.exportConfig.bind(manager),
    importConfig: manager.importConfig.bind(manager),
    dispose: manager.dispose.bind(manager)
  }
}

export default DataSourceConfigManager
