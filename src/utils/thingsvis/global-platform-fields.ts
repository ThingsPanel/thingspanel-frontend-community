import type { PlatformField } from './types'

export type PlatformFieldScope = 'tenant' | 'super-admin'

const SYS_ADMIN_ROLE = 'SYS_ADMIN'

const SHARED_GLOBAL_PLATFORM_FIELDS: PlatformField[] = [
  {
    id: 'device_total',
    name: '设备总数',
    type: 'number',
    dataType: 'telemetry',
    description: '全局设备总数'
  },
  {
    id: 'device_online',
    name: '在线设备数',
    type: 'number',
    dataType: 'telemetry',
    description: '全局在线设备数'
  },
  {
    id: 'device_offline',
    name: '离线设备数',
    type: 'number',
    dataType: 'telemetry',
    description: '全局离线设备数'
  },
  {
    id: 'device_activity',
    name: '激活设备数',
    type: 'number',
    dataType: 'telemetry',
    description: '全局激活设备数'
  },
  {
    id: 'alarm_device_total',
    name: '告警设备数',
    type: 'number',
    dataType: 'telemetry',
    description: '当前处于告警状态的设备数'
  },
  {
    id: 'device_online__history',
    name: '在线设备趋势',
    type: 'json',
    dataType: 'telemetry',
    description: '在线设备历史趋势'
  },
  {
    id: 'device_offline__history',
    name: '离线设备趋势',
    type: 'json',
    dataType: 'telemetry',
    description: '离线设备历史趋势'
  }
]

const SUPER_ADMIN_GLOBAL_PLATFORM_FIELDS: PlatformField[] = [
  {
    id: 'tenant_added_yesterday',
    name: '昨日新增租户',
    type: 'number',
    dataType: 'telemetry',
    description: '昨日新增租户数'
  },
  {
    id: 'tenant_added_month',
    name: '本月新增租户',
    type: 'number',
    dataType: 'telemetry',
    description: '本月新增租户数'
  },
  {
    id: 'tenant_total',
    name: '租户总数',
    type: 'number',
    dataType: 'telemetry',
    description: '当前租户总数'
  },
  {
    id: 'tenant_growth__history',
    name: '租户增长趋势',
    type: 'json',
    dataType: 'telemetry',
    description: '租户增长历史趋势'
  },
  {
    id: 'cpu_usage',
    name: 'CPU 使用率',
    type: 'number',
    dataType: 'telemetry',
    unit: '%',
    description: '系统 CPU 使用率'
  },
  {
    id: 'memory_usage',
    name: '内存使用率',
    type: 'number',
    dataType: 'telemetry',
    unit: '%',
    description: '系统内存使用率'
  },
  {
    id: 'disk_usage',
    name: '磁盘使用率',
    type: 'number',
    dataType: 'telemetry',
    unit: '%',
    description: '系统磁盘使用率'
  },
  {
    id: 'cpu_usage__history',
    name: 'CPU 趋势',
    type: 'json',
    dataType: 'telemetry',
    description: 'CPU 使用率历史趋势'
  },
  {
    id: 'memory_usage__history',
    name: '内存趋势',
    type: 'json',
    dataType: 'telemetry',
    description: '内存使用率历史趋势'
  },
  {
    id: 'disk_usage__history',
    name: '磁盘趋势',
    type: 'json',
    dataType: 'telemetry',
    description: '磁盘使用率历史趋势'
  }
]

export function resolveGlobalPlatformFieldScope(userInfo?: {
  authority?: string
  roles?: string[]
} | null): PlatformFieldScope {
  return userInfo?.authority === SYS_ADMIN_ROLE || userInfo?.roles?.includes(SYS_ADMIN_ROLE)
    ? 'super-admin'
    : 'tenant'
}

export function getGlobalPlatformFields(scope: PlatformFieldScope): PlatformField[] {
  return scope === 'super-admin'
    ? [...SHARED_GLOBAL_PLATFORM_FIELDS, ...SUPER_ADMIN_GLOBAL_PLATFORM_FIELDS]
    : [...SHARED_GLOBAL_PLATFORM_FIELDS]
}
