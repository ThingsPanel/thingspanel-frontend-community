/**
 * 内部地址数据生成器
 * 基于实际API文件生成的内部地址选项数据
 */

import type { InternalAddressOptions, InternalApiItem } from '../types/internal-api'

/**
 * 设备数据查询模块API接口（仅包含数据查询类接口）
 */
const deviceDataApis: InternalApiItem[] = [
  {
    label: '获取设备分组',
    value: '/device/group',
    url: '/device/group',
    method: 'GET',
    description: '获取设备分组列表',
    hasPathParams: false,
    commonParams: [
      { name: 'page', type: 'number', required: false, description: '页码', example: 1 },
      { name: 'page_size', type: 'number', required: false, description: '每页数量', example: 10 }
    ],
    module: 'device',
    functionName: 'getDeviceGroup'
  },
  {
    label: '获取设备分组树',
    value: '/device/group/tree',
    url: '/device/group/tree',
    method: 'GET',
    description: '获取设备分组树形结构',
    hasPathParams: false,
    commonParams: [{ name: 'tenant_id', type: 'string', required: false, description: '租户ID', example: 'tenant123' }],
    module: 'device',
    functionName: 'deviceGroupTree'
  },
  {
    label: '获取设备分组详情',
    value: '/device/group/detail/{id}',
    url: '/device/group/detail/{id}',
    method: 'GET',
    description: '获取指定设备分组的详细信息',
    hasPathParams: true,
    pathParamNames: ['id'],
    commonParams: [{ name: 'id', type: 'string', required: true, description: '设备分组ID', example: 'group123' }],
    module: 'device',
    functionName: 'deviceGroupDetail'
  },
  {
    label: '获取设备列表',
    value: '/device',
    url: '/device',
    method: 'GET',
    description: '获取设备列表',
    hasPathParams: false,
    commonParams: [
      { name: 'page', type: 'number', required: false, description: '页码', example: 1 },
      { name: 'page_size', type: 'number', required: false, description: '每页大小', example: 10 },
      { name: 'device_name', type: 'string', required: false, description: '设备名称筛选' }
    ],
    module: 'device',
    functionName: 'deviceList'
  },
  {
    label: '获取设备详情',
    value: '/device/detail/{id}',
    url: '/device/detail/{id}',
    method: 'GET',
    description: '获取指定设备的详细信息',
    hasPathParams: true,
    pathParamNames: ['id'],
    commonParams: [{ name: 'id', type: 'string', required: true, description: '设备ID', example: 'device123' }],
    module: 'device',
    functionName: 'deviceDetail'
  },
  {
    label: '获取设备当前遥测数据',
    value: '/telemetry/datas/current/{id}',
    url: '/telemetry/datas/current/{id}',
    method: 'GET',
    description: '获取指定设备的当前遥测数据',
    hasPathParams: true,
    pathParamNames: ['id'],
    commonParams: [{ name: 'id', type: 'string', required: true, description: '设备ID', example: 'device123' }],
    module: 'device',
    functionName: 'telemetryDataCurrent'
  },
  {
    label: '获取设备历史遥测数据',
    value: '/telemetry/datas/statistic',
    url: '/telemetry/datas/statistic',
    method: 'GET',
    description: '获取设备的历史遥测数据统计',
    hasPathParams: false,
    commonParams: [
      { name: 'device_id', type: 'string', required: true, description: '设备ID' },
      { name: 'key', type: 'string', required: true, description: '遥测键名' },
      { name: 'start_time', type: 'string', required: true, description: '开始时间' },
      { name: 'end_time', type: 'string', required: true, description: '结束时间' },
      { name: 'aggregate_window', type: 'string', required: false, description: '聚合窗口' },
      { name: 'aggregate_function', type: 'string', required: false, description: '聚合函数' }
    ],
    module: 'device',
    functionName: 'telemetryDataHistoryList'
  },
  {
    label: '获取面板设备列表',
    value: '/device/tenant/list',
    url: '/device/tenant/list',
    method: 'GET',
    description: '获取租户设备列表',
    hasPathParams: false,
    commonParams: [
      { name: 'page', type: 'number', required: false, description: '页码', example: 1 },
      { name: 'page_size', type: 'number', required: false, description: '每页大小', example: 10 }
    ],
    module: 'device',
    functionName: 'deviceListForPanel'
  },
  {
    label: '获取设备指标列表',
    value: '/device/metrics/{id}',
    url: '/device/metrics/{id}',
    method: 'GET',
    description: '获取指定设备的指标列表',
    hasPathParams: true,
    pathParamNames: ['id'],
    commonParams: [{ name: 'id', type: 'string', required: true, description: '设备ID', example: 'device123' }],
    module: 'device',
    functionName: 'deviceMetricsList'
  }
]

/**
 * 面板数据查询模块API接口（仅包含数据查询类接口）
 */
const panelDataApis: InternalApiItem[] = [
  {
    label: '获取面板列表',
    value: '/board',
    url: '/board',
    method: 'GET',
    description: '获取面板列表',
    hasPathParams: false,
    commonParams: [
      { name: 'page', type: 'number', required: false, description: '页码', example: 1 },
      { name: 'page_size', type: 'number', required: false, description: '每页大小', example: 10 }
    ],
    module: 'panel',
    functionName: 'getBoardList'
  },
  {
    label: '获取面板详情',
    value: '/board/{id}',
    url: '/board/{id}',
    method: 'GET',
    description: '获取指定面板的详细信息',
    hasPathParams: true,
    pathParamNames: ['id'],
    commonParams: [{ name: 'id', type: 'string', required: true, description: '面板ID', example: 'board123' }],
    module: 'panel',
    functionName: 'getBoard'
  }
]

/**
 * 系统数据模块API接口
 */
const systemDataApis: InternalApiItem[] = [
  {
    label: '获取设备总数统计',
    value: '/board/device',
    url: '/board/device',
    method: 'GET',
    description: '获取设备总数和激活数统计',
    hasPathParams: false,
    module: 'system-data',
    functionName: 'totalNumber'
  },
  {
    label: '获取租户设备统计',
    value: '/board/tenant/device/info',
    url: '/board/tenant/device/info',
    method: 'GET',
    description: '获取租户设备总数统计',
    hasPathParams: false,
    module: 'system-data',
    functionName: 'sumData'
  },
  {
    label: '获取租户消息统计',
    value: '/telemetry/datas/msg/count',
    url: '/telemetry/datas/msg/count',
    method: 'GET',
    description: '获取租户消息总数统计',
    hasPathParams: false,
    module: 'system-data',
    functionName: 'tenantNum'
  },
  {
    label: '获取租户统计数据',
    value: '/board/tenant',
    url: '/board/tenant',
    method: 'GET',
    description: '获取租户总数、昨日新增、本月新增以及月历史数据',
    hasPathParams: false,
    module: 'system-data',
    functionName: 'tenant'
  },
  {
    label: '获取遥测数据',
    value: '/device/model/telemetry',
    url: '/device/model/telemetry',
    method: 'GET',
    description: '获取设备模型遥测数据',
    hasPathParams: false,
    commonParams: [
      { name: 'device_id', type: 'string', required: false, description: '设备ID' },
      { name: 'model_id', type: 'string', required: false, description: '模型ID' }
    ],
    module: 'system-data',
    functionName: 'telemetryApi'
  },
  {
    label: '获取最新遥测数据',
    value: '/telemetry/datas/current/{id}',
    url: '/telemetry/datas/current/{id}',
    method: 'GET',
    description: '获取指定设备的最新遥测数据',
    hasPathParams: true,
    pathParamNames: ['id'],
    commonParams: [{ name: 'id', type: 'string', required: true, description: '设备ID', example: 'device123' }],
    module: 'system-data',
    functionName: 'telemetryLatestApi'
  },
  {
    label: '获取最新遥测数据(简化版)',
    value: '/device/telemetry/latest',
    url: '/device/telemetry/latest',
    method: 'GET',
    description: '获取最新的遥测数据(简化实现)',
    hasPathParams: false,
    module: 'system-data',
    functionName: 'getLatestTelemetryData'
  },
  {
    label: '获取设备在线趋势',
    value: '/board/trend',
    url: '/board/trend',
    method: 'GET',
    description: '获取设备在线状态趋势数据',
    hasPathParams: false,
    module: 'system-data',
    functionName: 'getOnlineDeviceTrend'
  },
  {
    label: '获取告警数量',
    value: '/alarm/device/counts',
    url: '/alarm/device/counts',
    method: 'GET',
    description: '获取设备告警数量统计',
    hasPathParams: false,
    module: 'system-data',
    functionName: 'getAlarmCount'
  },
  {
    label: '获取当前系统指标',
    value: '/system/metrics/current',
    url: '/system/metrics/current',
    method: 'GET',
    description: '获取当前系统运行指标',
    hasPathParams: false,
    commonParams: [{ name: 'metrics', type: 'string', required: false, description: '指标类型' }],
    module: 'system-data',
    functionName: 'getSystemMetricsCurrent'
  },
  {
    label: '获取系统版本',
    value: '/sys_version',
    url: '/sys_version',
    method: 'GET',
    description: '获取系统版本信息',
    hasPathParams: false,
    module: 'system-data',
    functionName: 'getSysVersion'
  },
  {
    label: '获取系统指标历史数据',
    value: '/system/metrics/history',
    url: '/system/metrics/history',
    method: 'GET',
    description: '获取系统指标历史数据',
    hasPathParams: false,
    commonParams: [
      { name: 'start_time', type: 'string', required: false, description: '开始时间' },
      { name: 'end_time', type: 'string', required: false, description: '结束时间' },
      { name: 'metrics', type: 'string', required: false, description: '指标类型' }
    ],
    module: 'system-data',
    functionName: 'getSystemMetricsHistory'
  }
]

/**
 * 内部地址选项数据
 * 按模块分组的API接口列表（仅包含数据查询类接口）
 */
export const internalAddressOptions: InternalAddressOptions = [
  {
    type: 'group',
    label: '设备数据',
    key: 'device-data',
    children: deviceDataApis
  },
  {
    type: 'group',
    label: '面板数据',
    key: 'panel-data',
    children: panelDataApis
  },
  {
    type: 'group',
    label: '系统数据',
    key: 'system-data',
    children: systemDataApis
  }
]

/**
 * 根据模块获取API列表
 */
export function getApisByModule(module: string): InternalApiItem[] {
  const moduleGroup = internalAddressOptions.find(group => group.key === module)
  return moduleGroup ? moduleGroup.children : []
}

/**
 * 根据API值获取API详情
 */
export function getApiByValue(value: string): InternalApiItem | undefined {
  for (const group of internalAddressOptions) {
    const api = group.children.find(item => item.value === value)
    if (api) return api
  }
  return undefined
}

/**
 * 获取所有API接口的扁平列表
 */
export function getAllApis(): InternalApiItem[] {
  return internalAddressOptions.reduce((acc, group) => {
    return acc.concat(group.children)
  }, [] as InternalApiItem[])
}

/**
 * 搜索API接口
 */
export function searchApis(keyword: string): InternalApiItem[] {
  const allApis = getAllApis()
  const lowerKeyword = keyword.toLowerCase()

  return allApis.filter(
    api =>
      api.label.toLowerCase().includes(lowerKeyword) ||
      api.url.toLowerCase().includes(lowerKeyword) ||
      (api.description && api.description.toLowerCase().includes(lowerKeyword)) ||
      (api.functionName && api.functionName.toLowerCase().includes(lowerKeyword))
  )
}
