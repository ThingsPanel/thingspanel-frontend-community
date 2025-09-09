/**
 * 设备参数生成器
 * 根据不同的选择模式生成对应的参数组
 */

import type {
  DeviceParameterSourceType,
  DeviceSelectionConfig,
  DeviceParameterGroup,
  DeviceSelectionResult,
  ParameterRole,
  DeviceInfo,
  DeviceMetric
} from '../types/device-parameter-group'
import type { EnhancedParameter } from '../types/parameter-editor'

/**
 * 生成唯一的参数组ID
 */
export function generateGroupId(sourceType: DeviceParameterSourceType): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  return `${sourceType}_${timestamp}_${random}`
}

/**
 * 生成唯一的参数ID
 */
export function generateParameterId(): string {
  return `param_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * 根据设备ID选择器生成参数
 */
export function generateDeviceIdParameters(device: DeviceInfo): DeviceSelectionResult {
  const groupId = generateGroupId('device-id')
  const now = Date.now()

  // 生成设备ID参数
  const parameters = [
    {
      key: 'deviceId',
      value: device.deviceId,
      dataType: 'string' as const,
      description: `设备ID - ${device.deviceName}`,
      role: 'primary' as ParameterRole
    }
  ]

  // 创建参数组信息
  const groupInfo: DeviceParameterGroup = {
    groupId,
    sourceType: 'device-id',
    sourceConfig: {
      sourceType: 'device-id',
      selectedDevice: device,
      timestamp: now
    },
    relatedParams: ['deviceId'],
    dependencies: {
      deviceId: {
        dependsOn: [],
        affects: [],
        role: 'primary'
      }
    },
    createdAt: now,
    updatedAt: now
  }

  return {
    parameters,
    groupInfo,
    selectionConfig: groupInfo.sourceConfig
  }
}

/**
 * 根据设备指标选择器生成参数
 */
export function generateDeviceMetricParameters(device: DeviceInfo, metric: DeviceMetric): DeviceSelectionResult {
  const groupId = generateGroupId('device-metric')
  const now = Date.now()

  // 生成设备ID + 指标参数
  const parameters = [
    {
      key: 'deviceId',
      value: device.deviceId,
      dataType: 'string' as const,
      description: `设备ID - ${device.deviceName}`,
      role: 'primary' as ParameterRole
    },
    {
      key: 'metric',
      value: metric.metricKey,
      dataType: metric.metricType,
      description: `指标 - ${metric.metricLabel}${metric.unit ? ` (${metric.unit})` : ''}`,
      role: 'secondary' as ParameterRole
    }
  ]

  // 创建参数组信息
  const groupInfo: DeviceParameterGroup = {
    groupId,
    sourceType: 'device-metric',
    sourceConfig: {
      sourceType: 'device-metric',
      selectedDevice: device,
      selectedMetric: metric,
      timestamp: now
    },
    relatedParams: ['deviceId', 'metric'],
    dependencies: {
      deviceId: {
        dependsOn: [],
        affects: ['metric'],
        role: 'primary'
      },
      metric: {
        dependsOn: ['deviceId'],
        affects: [],
        role: 'secondary'
      }
    },
    createdAt: now,
    updatedAt: now
  }

  return {
    parameters,
    groupInfo,
    selectionConfig: groupInfo.sourceConfig
  }
}

/**
 * 将生成的参数转换为EnhancedParameter格式
 */
export function convertToEnhancedParameters(result: DeviceSelectionResult): EnhancedParameter[] {
  return result.parameters.map(param => ({
    key: param.key,
    value: param.value,
    enabled: true,
    valueMode: 'manual' as const,
    selectedTemplate: 'device-selection',
    dataType: param.dataType as any,
    variableName: '',
    description: param.description,
    _id: generateParameterId(),

    // 设备参数组信息
    deviceContext: {
      sourceType: 'device-selection',
      selectionConfig: result.selectionConfig,
      timestamp: result.groupInfo.createdAt
    },

    // 参数组归属信息
    parameterGroup: {
      groupId: result.groupInfo.groupId,
      role: param.role,
      isDerived: false
    }
  }))
}

/**
 * 参数组管理器类
 */
export class DeviceParameterGroupManager {
  private groups: Map<string, DeviceParameterGroup> = new Map()

  /**
   * 添加参数组
   */
  addGroup(group: DeviceParameterGroup): void {
    this.groups.set(group.groupId, group)
  }

  /**
   * 获取参数组
   */
  getGroup(groupId: string): DeviceParameterGroup | undefined {
    return this.groups.get(groupId)
  }

  /**
   * 移除参数组
   */
  removeGroup(groupId: string): boolean {
    return this.groups.delete(groupId)
  }

  /**
   * 根据参数key查找所属的参数组
   */
  findGroupByParameterKey(paramKey: string): DeviceParameterGroup | undefined {
    for (const group of this.groups.values()) {
      if (group.relatedParams.includes(paramKey)) {
        return group
      }
    }
    return undefined
  }

  /**
   * 获取参数组的所有相关参数
   */
  getGroupParameters(groupId: string, allParams: EnhancedParameter[]): EnhancedParameter[] {
    const group = this.getGroup(groupId)
    if (!group) return []

    return allParams.filter(param => param.parameterGroup?.groupId === groupId)
  }

  /**
   * 更新参数组
   */
  updateGroup(groupId: string, updates: Partial<DeviceParameterGroup>): boolean {
    const group = this.groups.get(groupId)
    if (!group) return false

    Object.assign(group, updates, { updatedAt: Date.now() })
    return true
  }

  /**
   * 获取所有参数组
   */
  getAllGroups(): DeviceParameterGroup[] {
    return Array.from(this.groups.values())
  }

  /**
   * 清空所有参数组
   */
  clear(): void {
    this.groups.clear()
  }
}

// 全局参数组管理器实例
export const globalParameterGroupManager = new DeviceParameterGroupManager()
