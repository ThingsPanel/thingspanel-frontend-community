/**
 * 设备参数组类型定义
 * 用于管理设备选择产生的相关参数
 */

/**
 * 设备参数组源类型
 */
export type DeviceParameterSourceType =
  | 'device-id' // 设备ID选择器：只产生deviceId参数
  | 'device-metric' // 指标选择器：产生deviceId + metric参数
  | 'telemetry' // 遥测选择器：灵活产生多个参数

/**
 * 设备信息
 */
export interface DeviceInfo {
  deviceId: string
  deviceName: string
  deviceType: string
  deviceModel?: string
}

/**
 * 设备指标信息
 */
export interface DeviceMetric {
  metricKey: string
  metricLabel: string
  metricType: 'string' | 'number' | 'boolean' | 'json'
  unit?: string
  description?: string
}

/**
 * 遥测配置（预留给未来复杂模式）
 */
export interface TelemetryConfig {
  deviceId: string
  metricTypes: string[] // 如：['realtime', 'history']
  selectedMetrics: string[] // 选择的指标keys
  timeParameters: string[] // 时间相关参数，如：['startTime', 'endTime']
  customParameters?: Record<string, any> // 自定义参数
}

/**
 * 设备选择配置（用于编辑时回显）
 */
export interface DeviceSelectionConfig {
  sourceType: DeviceParameterSourceType
  selectedDevice: DeviceInfo
  selectedMetric?: DeviceMetric // 指标模式时使用
  telemetryConfig?: TelemetryConfig // 遥测模式时使用
  timestamp: number // 选择时间戳
}

/**
 * 参数在组中的角色
 */
export type ParameterRole = 'primary' | 'secondary' | 'derived' | 'optional'

/**
 * 参数组信息
 */
export interface DeviceParameterGroup {
  /** 参数组唯一标识 */
  groupId: string

  /** 参数组来源类型 */
  sourceType: DeviceParameterSourceType

  /** 原始选择配置（用于编辑时回显） */
  sourceConfig: DeviceSelectionConfig

  /** 关联的参数key列表 */
  relatedParams: string[]

  /** 参数间的依赖关系 */
  dependencies: {
    [paramKey: string]: {
      dependsOn: string[] // 依赖哪些参数
      affects: string[] // 影响哪些参数
      role: ParameterRole // 参数角色
    }
  }

  /** 参数组创建时间 */
  createdAt: number

  /** 参数组最后更新时间 */
  updatedAt: number
}

/**
 * 增强的参数类型（扩展原有的EnhancedParameter）
 */
export interface DeviceParameterGroupInfo {
  /** 所属参数组ID */
  groupId: string

  /** 在组中的角色 */
  role: ParameterRole

  /** 是否为派生参数（由其他参数计算得出） */
  isDerived: boolean

  /** 参数组的源类型 */
  sourceType: DeviceParameterSourceType
}

/**
 * 设备选择器模式配置
 */
export interface DeviceSelectionMode {
  /** 模式类型 */
  mode: DeviceParameterSourceType

  /** 模式标题 */
  title: string

  /** 模式描述 */
  description: string

  /** 模式图标 */
  icon: string

  /** 是否启用 */
  enabled: boolean

  /** 预期产生的参数数量 */
  expectedParams: number
}

/**
 * 设备选择结果
 */
export interface DeviceSelectionResult {
  /** 生成的参数列表 */
  parameters: Array<{
    key: string
    value: any
    dataType: string
    description: string
    role: ParameterRole
  }>

  /** 参数组信息 */
  groupInfo: DeviceParameterGroup

  /** 选择配置 */
  selectionConfig: DeviceSelectionConfig
}
