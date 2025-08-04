/**
 * Legacy Panel 系统类型兼容层
 * 提供原始 Panel 系统与 Card 2.1 系统之间的类型映射和转换
 */

import type { IComponentDefinition } from './index'

// ====== 原始 Panel 系统类型定义 ======

export type DeviceSourceItem = {
  cardId?: string
  deviceId?: string
  deviceMetrics?: string
  name?: string
  metricsId?: string
  metricsType?: string // telemetry | attributes | event | command
  metricsDataType?: string // number | string | boolean
  metricsName?: string
  metricsOptions?: any[]
  metricsShow: boolean
  aggregate_function: string
}

export interface ICardData {
  type?: ICardDefine['type']
  cardId?: string
  // 组件自定义配置
  config?: Record<string, any>
  title?: string
  // 基础配置
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
  // 数据源
  dataSource?: {
    // 系统 或 设备
    origin: 'system' | 'device'
    sourceNum?: number // 不填写即为 1-任意多个，最多9个，如需固定数量，填写整数
    systemSource?: { type?: number; name?: string }[]
    deviceCount?: number
    isSupportTimeRange: boolean // 是否支持指定时间范围
    dataTimeRange: string // 时间范围，custom，last_5m，last_15m，last_30m，last_1h，last_3h，last_6h，last_12h，last_24h，last_3d，last_7d，last_15d，last_30d，last_60d，last_90d，last_6m，last_1y
    isSupportAggregate: boolean // 是否支持聚合
    dataAggregateRange: string // 聚合时间范围
    deviceSource?: DeviceSourceItem[]
  }
}

export interface ICardView {
  x: number
  y: number
  w: number
  h: number
  i: number
  minW?: number
  minH?: number
  data?: ICardData
}

export interface ICardDefine {
  component: any // 卡片组件，一般就是 ./component.vue
  remoteId?: string
  id: string // 卡片唯一标识，按照card_type_cardName命名不会错
  title: string // 卡片标题，英文，后期作为国际化key
  poster: string // 示例图 尺寸193*120
  type: 'builtin' | 'device' | 'plugin' | 'chart' // 卡片类型
  // 不存在就是all
  scene?: 'mobile' | 'pc' | 'all'
  configForm?: any // 卡片配置文件，一般就是 card-config.vue
  // 初始化设置参数（可选）
  preset?: {
    config?: object
    dataSource?: ICardData['dataSource']
    basicSettings?: ICardData['basicSettings']
    iCardViewDefault?: {
      w?: number // 卡片初始占几行，尽量配一下
      h?: number // 卡片初始大几列，尽量配一下
      minW?: number // 卡片最小占几行
      minH?: number // 卡片最小大几列
    }
  }
}

export interface IConfigCtx {
  config: Record<string, any>
  view?: boolean // 预览模式
}

// ====== 类型映射和转换工具 ======

/**
 * 将 Card 1.0 类型映射到 Card 2.1 类别
 */
export function mapLegacyTypeToCategory(legacyType: ICardDefine['type']): string {
  const typeMapping: Record<string, string> = {
    builtin: 'display',
    device: 'control',
    plugin: 'media',
    chart: 'chart'
  }
  return typeMapping[legacyType] || 'other'
}

/**
 * 将 Card 1.0 定义转换为 Card 2.1 定义
 */
export function convertLegacyCardToCard21(legacyCard: ICardDefine): IComponentDefinition {
  const category = mapLegacyTypeToCategory(legacyCard.type)

  return {
    id: legacyCard.id,
    component: legacyCard.component,
    meta: {
      name: legacyCard.id,
      title: legacyCard.title,
      description: `从 ${legacyCard.type} 卡片迁移`,
      category,
      icon: 'mdi:card',
      version: '1.0.0',
      poster: legacyCard.poster,
      scene: legacyCard.scene || 'all'
    },
    properties: {
      title: {
        type: 'string',
        label: '标题',
        default: legacyCard.title
      },
      // 从 preset.config 提取属性定义
      ...(legacyCard.preset?.config ? extractPropertiesFromConfig(legacyCard.preset.config) : {})
    },
    configComponent: legacyCard.configForm
      ? {
          component: legacyCard.configForm,
          replaceDefault: false
        }
      : undefined,
    defaultSize: {
      width: legacyCard.preset?.iCardViewDefault?.w || 4,
      height: legacyCard.preset?.iCardViewDefault?.h || 3
    },
    minSize: {
      width: legacyCard.preset?.iCardViewDefault?.minW || 2,
      height: legacyCard.preset?.iCardViewDefault?.minH || 2
    },
    // 保留原始配置用于兼容
    legacy: {
      originalDefine: legacyCard,
      dataSource: legacyCard.preset?.dataSource,
      basicSettings: legacyCard.preset?.basicSettings
    }
  }
}

/**
 * 从配置对象中提取属性定义
 */
function extractPropertiesFromConfig(config: Record<string, any>): Record<string, any> {
  const properties: Record<string, any> = {}

  Object.entries(config).forEach(([key, value]) => {
    let type = 'string'
    if (typeof value === 'number') type = 'number'
    if (typeof value === 'boolean') type = 'boolean'
    if (Array.isArray(value)) type = 'array'
    if (value && typeof value === 'object') type = 'object'

    properties[key] = {
      type,
      label: key,
      default: value
    }
  })

  return properties
}

/**
 * 将 Card 2.1 定义转换回 Card 1.0 格式（用于向后兼容）
 */
export function convertCard21ToLegacy(card21: IComponentDefinition): ICardDefine {
  const legacyType = mapCategoryToLegacyType(card21.meta?.category || 'other')

  return {
    id: card21.id,
    component: card21.component,
    title: card21.meta?.title || card21.meta?.name || card21.id,
    poster: card21.meta?.poster || '',
    type: legacyType,
    scene: card21.meta?.scene,
    configForm: card21.configComponent?.component,
    preset: {
      config: extractConfigFromProperties(card21.properties || {}),
      iCardViewDefault: {
        w: card21.defaultSize?.width || 4,
        h: card21.defaultSize?.height || 3,
        minW: card21.minSize?.width || 2,
        minH: card21.minSize?.height || 2
      },
      // 从 legacy 字段恢复原始配置
      dataSource: (card21 as any).legacy?.dataSource,
      basicSettings: (card21 as any).legacy?.basicSettings
    }
  }
}

/**
 * 将 Card 2.1 类别映射回 Card 1.0 类型
 */
function mapCategoryToLegacyType(category: string): ICardDefine['type'] {
  const categoryMapping: Record<string, ICardDefine['type']> = {
    display: 'builtin',
    control: 'device',
    media: 'plugin',
    chart: 'chart'
  }
  return categoryMapping[category] || 'chart'
}

/**
 * 从 Card 2.1 属性定义提取配置对象
 */
function extractConfigFromProperties(properties: Record<string, any>): Record<string, any> {
  const config: Record<string, any> = {}

  Object.entries(properties).forEach(([key, prop]) => {
    if (prop && typeof prop === 'object' && 'default' in prop) {
      config[key] = prop.default
    }
  })

  return config
}

// ====== 数据转换工具 ======

/**
 * 转换 Panel 布局数据到 Visual Editor 格式
 */
export function convertPanelLayoutToEditor(layout: ICardView[]): any[] {
  return layout.map(item => ({
    id: String(item.i),
    type: item.data?.cardId || 'unknown',
    position: {
      x: item.x,
      y: item.y
    },
    size: {
      width: item.w,
      height: item.h
    },
    minSize: {
      width: item.minW || 2,
      height: item.minH || 2
    },
    config: item.data?.config || {},
    dataSource: item.data?.dataSource,
    basicSettings: item.data?.basicSettings
  }))
}

/**
 * 转换 Visual Editor 数据到 Panel 布局格式
 */
export function convertEditorLayoutToPanel(editorLayout: any[]): ICardView[] {
  return editorLayout.map((item, index) => ({
    i: parseInt(item.id) || index,
    x: item.position?.x || 0,
    y: item.position?.y || 0,
    w: item.size?.width || 4,
    h: item.size?.height || 3,
    minW: item.minSize?.width || 2,
    minH: item.minSize?.height || 2,
    data: {
      cardId: item.type,
      config: item.config || {},
      dataSource: item.dataSource,
      basicSettings: item.basicSettings
    }
  }))
}

// ====== 配置上下文兼容层 ======

/**
 * 创建兼容的配置上下文，供原有配置组件使用
 */
export function createLegacyConfigContext(config: Record<string, any>, view: boolean = false): IConfigCtx {
  return {
    config,
    view
  }
}

/**
 * 从 Card 2.1 组件定义创建配置上下文
 */
export function createConfigContextFromDefinition(
  definition: IComponentDefinition,
  currentConfig: Record<string, any> = {}
): IConfigCtx {
  // 合并默认配置和当前配置
  const defaultConfig = extractConfigFromProperties(definition.properties || {})
  const mergedConfig = { ...defaultConfig, ...currentConfig }

  return createLegacyConfigContext(mergedConfig)
}
