// src/components/visual-editor/core/component-api-config.ts

/**
 * @file 组件与设备API的自动化配置系统
 * @description 根据组件类型，自动选择和配置最合适的数据源API。
 */

// 定义了组件支持的API配置
interface ComponentApiConfig {
  apiType: string // 主要API类型
  fallbackApiType?: string // 备用API类型
  dataSourceType: 'device' // 数据源类型
  requiresPolling: boolean // 是否需要轮询
  isControlComponent: boolean // 是否为控制类组件
  description: string // 功能描述
  supportedMetricsTypes: ('telemetry' | 'attributes' | 'command')[] // 支持的指标类型
  defaultParameters?: Record<string, any> // 默认API参数
}

// 存储所有组件的API配置
const componentApiRegistry: Record<string, ComponentApiConfig> = {
  'digit-indicator': {
    apiType: 'telemetryDataCurrentKeys',
    fallbackApiType: 'getAttributeDatasKey',
    dataSourceType: 'device',
    requiresPolling: true,
    isControlComponent: false,
    description: '数字指示器，显示设备的当前数值（遥测或属性）',
    supportedMetricsTypes: ['telemetry', 'attributes']
  },
  curve: {
    apiType: 'telemetryDataHistoryList',
    dataSourceType: 'device',
    requiresPolling: false,
    isControlComponent: false,
    description: '曲线图，展示设备的历史遥测数据',
    supportedMetricsTypes: ['telemetry'],
    defaultParameters: {
      time_range: 'last_1h',
      aggregate_function: 'avg',
      aggregate_window: '1m'
    }
  },
  'digit-setter': {
    apiType: 'telemetryDataPub',
    fallbackApiType: 'attributeDataPub',
    dataSourceType: 'device',
    requiresPolling: false,
    isControlComponent: true,
    description: '数字设置器，用于向设备发送遥测或属性数据',
    supportedMetricsTypes: ['telemetry', 'attributes']
  }
  // 在此可以添加更多组件的配置
}

/**
 * 根据组件类型获取其API配置
 * @param componentType 组件的唯一类型标识符
 * @returns 组件的API配置，如果未找到则返回null
 */
export function getComponentApiConfig(componentType: string): ComponentApiConfig | null {
  const config = componentApiRegistry[componentType]
  if (!config) {
    console.warn(`[ComponentApiConfig] 未找到组件类型 '${componentType}' 的API配置。`)
    return null
  }
  return config
}

/**
 * 根据组件类型和所需的指标类型，选择最合适的API
 * @param componentType 组件类型
 * @param metricsType 指标类型 ('telemetry', 'attributes', 'command')
 * @returns 合适的API类型字符串，如果不支持则返回null
 */
export function selectApiForComponent(
  componentType: string,
  metricsType: 'telemetry' | 'attributes' | 'command'
): string | null {
  const config = getComponentApiConfig(componentType)

  if (!config) {
    return null // 组件配置不存在
  }

  if (!config.supportedMetricsTypes.includes(metricsType)) {
    console.warn(`[ComponentApiConfig] 组件 '${componentType}' 不支持 '${metricsType}' 类型的指标。`)
    return null
  }

  // 核心选择逻辑
  switch (metricsType) {
    case 'telemetry':
      return config.apiType // 遥测通常是主要API
    case 'attributes':
      return config.fallbackApiType || config.apiType // 属性通常是备用或主要API
    case 'command':
      // 命令类API的逻辑可能更复杂，这里做简化处理
      if (config.isControlComponent) {
        return config.apiType
      }
      return null
    default:
      return null
  }
}
