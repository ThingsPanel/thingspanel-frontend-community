/**
 * 组件API配置映射表
 * 定义每个组件类型对应的默认API配置，用户无需手动选择API类型
 */

export interface ComponentApiConfig {
  /** 主要API类型 */
  apiType: string
  /** 备选API类型（当主要API失败时使用） */
  fallbackApiType?: string
  /** 数据源类型 */
  dataSourceType: 'device' | 'system' | 'static'
  /** 是否需要轮询 */
  requiresPolling: boolean
  /** 是否为交互控制组件（发送数据到设备） */
  isControlComponent: boolean
  /** 默认参数模板 */
  defaultParameters?: Record<string, any>
  /** 组件描述 */
  description: string
  /** 支持的指标类型 */
  supportedMetricsTypes: ('telemetry' | 'attributes' | 'command' | 'event')[]
}

/**
 * 组件API配置映射表
 * 基于对 chart-card 组件的分析得出
 */
export const COMPONENT_API_CONFIG: Record<string, ComponentApiConfig> = {
  // 数字指示器 - 显示当前数值
  'digit-indicator': {
    apiType: 'telemetryDataCurrentKeys',
    fallbackApiType: 'getAttributeDatasKey',
    dataSourceType: 'device',
    requiresPolling: true,
    isControlComponent: false,
    description: '数字指示器，显示设备的当前数值（遥测或属性）',
    supportedMetricsTypes: ['telemetry', 'attributes'],
    defaultParameters: {
      // 自动根据指标类型选择keys或key参数
    }
  },

  // 曲线图 - 历史数据趋势
  curve: {
    apiType: 'telemetryDataHistoryList',
    dataSourceType: 'device',
    requiresPolling: false,
    isControlComponent: false,
    description: '曲线图，显示设备遥测数据的历史趋势',
    supportedMetricsTypes: ['telemetry'],
    defaultParameters: {
      time_range: 'last_1h',
      aggregate_function: 'avg',
      aggregate_window: '1m'
    }
  },

  // 柱状图 - 历史数据对比
  bar: {
    apiType: 'telemetryDataHistoryList',
    dataSourceType: 'device',
    requiresPolling: false,
    isControlComponent: false,
    description: '柱状图，显示设备遥测数据的历史对比',
    supportedMetricsTypes: ['telemetry'],
    defaultParameters: {
      time_range: 'last_24h',
      aggregate_function: 'avg',
      aggregate_window: '1h'
    }
  },

  // 仪表盘 - 当前数值显示
  'instrument-panel': {
    apiType: 'telemetryDataCurrentKeys',
    dataSourceType: 'device',
    requiresPolling: true,
    isControlComponent: false,
    description: '仪表盘，以仪表形式显示设备当前遥测数值',
    supportedMetricsTypes: ['telemetry'],
    defaultParameters: {}
  },

  // 文本信息 - 属性展示
  'text-info': {
    apiType: 'getAttributeDataSet',
    dataSourceType: 'device',
    requiresPolling: true,
    isControlComponent: false,
    description: '文本信息，显示设备属性信息',
    supportedMetricsTypes: ['attributes'],
    defaultParameters: {}
  },

  // 状态显示 - 属性状态
  'state-display': {
    apiType: 'getAttributeDataSet',
    dataSourceType: 'device',
    requiresPolling: true,
    isControlComponent: false,
    description: '状态显示，以状态形式展示设备属性',
    supportedMetricsTypes: ['attributes'],
    defaultParameters: {}
  },

  // 数字设置器 - 发送数值到设备
  'digit-setter': {
    apiType: 'telemetryDataPub',
    fallbackApiType: 'attributeDataPub',
    dataSourceType: 'device',
    requiresPolling: false,
    isControlComponent: true,
    description: '数字设置器，向设备发送数值（遥测或属性）',
    supportedMetricsTypes: ['telemetry', 'attributes'],
    defaultParameters: {}
  },

  // 枚举控制 - 发送枚举值到设备
  'enum-control': {
    apiType: 'attributeDataPub',
    fallbackApiType: 'commandDataPub',
    dataSourceType: 'device',
    requiresPolling: false,
    isControlComponent: true,
    description: '枚举控制，向设备发送枚举类型的控制命令',
    supportedMetricsTypes: ['attributes', 'command'],
    defaultParameters: {}
  },

  // 开关控制 - 发送开关命令
  switch: {
    apiType: 'commandDataPub',
    fallbackApiType: 'attributeDataPub',
    dataSourceType: 'device',
    requiresPolling: false,
    isControlComponent: true,
    description: '开关控制，向设备发送开关类型的控制命令',
    supportedMetricsTypes: ['command', 'attributes'],
    defaultParameters: {}
  },

  // 表格 - 多指标数据展示
  table: {
    apiType: 'getAttributeDataSet',
    fallbackApiType: 'telemetryDataCurrentKeys',
    dataSourceType: 'device',
    requiresPolling: true,
    isControlComponent: false,
    description: '表格，以表格形式展示设备的多个指标数据',
    supportedMetricsTypes: ['attributes', 'telemetry'],
    defaultParameters: {}
  },

  // 视频播放器 - 通常不需要设备API
  'video-player': {
    apiType: 'getAttributeDataSet', // 可能需要获取视频URL
    dataSourceType: 'device',
    requiresPolling: false,
    isControlComponent: false,
    description: '视频播放器，播放设备相关的视频流',
    supportedMetricsTypes: ['attributes'],
    defaultParameters: {}
  }
}

/**
 * 根据组件类型获取API配置
 */
export function getComponentApiConfig(componentType: string): ComponentApiConfig | null {
  return COMPONENT_API_CONFIG[componentType] || null
}

/**
 * 根据组件类型和指标类型自动选择合适的API
 */
export function selectApiForComponent(
  componentType: string,
  metricsType: 'telemetry' | 'attributes' | 'command' | 'event'
): string | null {
  const config = getComponentApiConfig(componentType)
  if (!config) return null

  // 检查组件是否支持该指标类型
  if (!config.supportedMetricsTypes.includes(metricsType)) {
    console.warn(`组件 ${componentType} 不支持指标类型 ${metricsType}`)
    return null
  }

  // 根据指标类型选择最合适的API
  if (metricsType === 'telemetry') {
    if (config.isControlComponent) {
      return 'telemetryDataPub'
    } else {
      return config.apiType.includes('telemetry') ? config.apiType : 'telemetryDataCurrentKeys'
    }
  } else if (metricsType === 'attributes') {
    if (config.isControlComponent) {
      return 'attributeDataPub'
    } else {
      return config.apiType.includes('Attribute') ? config.apiType : 'getAttributeDataSet'
    }
  } else if (metricsType === 'command') {
    return config.isControlComponent ? 'commandDataPub' : null
  }

  return config.apiType
}

/**
 * 获取API的复杂度类型（用于选择对应的表单组件）
 */
export function getApiComplexity(apiType: string): 'simple' | 'medium' | 'complex' | 'send' {
  const complexityMap: Record<string, 'simple' | 'medium' | 'complex' | 'send'> = {
    // 简单表单 (2个参数: device_id + key/keys)
    telemetryDataCurrentKeys: 'simple',
    getAttributeDatasKey: 'simple',

    // 中等表单 (1个参数: device_id)
    getAttributeDataSet: 'medium',

    // 复杂表单 (5个参数: 全量历史数据配置)
    telemetryDataHistoryList: 'complex',

    // 发送表单 (3个参数: device_id + key + value)
    telemetryDataPub: 'send',
    attributeDataPub: 'send',
    commandDataPub: 'send'
  }

  return complexityMap[apiType] || 'simple'
}
