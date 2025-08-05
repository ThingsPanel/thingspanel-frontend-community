/**
 * Data Adapter Types
 * 数据适配器接口定义，用于外部数据格式转换
 */

import type { BaseCanvasItem, ValidationResult } from './core'

// 数据适配器基础接口
export interface DataAdapter<TExternal, TInternal = BaseCanvasItem[]> {
  // 外部数据转内部格式
  fromExternal(data: TExternal): TInternal

  // 内部格式转外部数据
  toExternal(data: TInternal): TExternal

  // 数据验证
  validate(data: TExternal): ValidationResult

  // 版本迁移
  migrate(data: any, fromVersion: string, toVersion: string): TExternal

  // 获取适配器信息
  getInfo(): AdapterInfo
}

// 适配器信息
export interface AdapterInfo {
  id: string // 适配器ID
  name: string // 适配器名称
  version: string // 版本号
  supportedVersions: string[] // 支持的数据版本
  description: string // 描述
}

// 现有面板数据格式 (兼容ICardView)
export interface LegacyCardView {
  x: number // 网格X坐标
  y: number // 网格Y坐标
  w: number // 网格宽度
  h: number // 网格高度
  i: number // 唯一标识符
  minW?: number // 最小宽度
  minH?: number // 最小高度
  data?: LegacyCardData // 卡片数据
}

// 现有卡片数据格式 (兼容ICardData)
export interface LegacyCardData {
  type?: 'builtin' | 'device' | 'plugin' | 'chart'
  cardId?: string
  config?: Record<string, any>
  title?: string
  basicSettings?: {
    showTitle?: boolean
    title?: string
  }
  layout?: {
    w?: number
    h?: number
    minW?: number
    minH?: number
  }
  dataSource?: {
    origin: 'system' | 'device'
    deviceSource?: Array<{
      device_id: string
      metricsType: string
      aggregateWindow: string
      [key: string]: any
    }>
    isSupportTimeRange: boolean
    dataTimeRange: string
    [key: string]: any
  }
}

// 网格布局专用数据格式
export interface GridLayoutItem {
  x: number
  y: number
  w: number
  h: number
  i: string
  minW?: number
  minH?: number
  maxW?: number
  maxH?: number
  static?: boolean
  isDraggable?: boolean
  isResizable?: boolean
}

// Canvas渲染器专用数据格式
export interface CanvasLayoutItem {
  id: string
  x: number // 精确像素X坐标
  y: number // 精确像素Y坐标
  width: number // 精确像素宽度
  height: number // 精确像素高度
  rotation?: number // 旋转角度
  scaleX?: number // X轴缩放
  scaleY?: number // Y轴缩放
  opacity?: number // 透明度
}

// 批量转换结果
export interface ConversionResult<T> {
  success: boolean // 转换是否成功
  data: T // 转换后的数据
  errors: string[] // 错误信息
  warnings: string[] // 警告信息
  statistics: {
    total: number // 总数
    converted: number // 成功转换数
    failed: number // 失败数
    skipped: number // 跳过数
  }
}

// 数据迁移配置
export interface MigrationConfig {
  fromVersion: string // 源版本
  toVersion: string // 目标版本
  preserveMetadata: boolean // 保留元数据
  generateIds: boolean // 生成新ID
  validateOutput: boolean // 验证输出
  backupOriginal: boolean // 备份原始数据
}

// 迁移规则
export interface MigrationRule {
  fromVersion: string // 源版本
  toVersion: string // 目标版本
  transform: (data: any) => any // 转换函数
  validate?: (data: any) => boolean // 验证函数
  description: string // 规则描述
}
