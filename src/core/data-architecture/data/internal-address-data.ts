/**
 * 内部地址数据生成器
 * 基于实际API接口维护的内部地址选项数据
 */

import type { InternalAddressOptions, InternalApiItem } from '@/core/data-architecture/types/internal-api'

/**
 * 遥测数据模块API接口
 */
const telemetryApis: InternalApiItem[] = [
  {
    label: '设备遥测当前值查询',
    value: '/telemetry/datas/current/{id}',
    url: '/telemetry/datas/current/{id}',
    method: 'GET',
    description: '设备当前值查询，获取设备每个key的最新一条数据',
    hasPathParams: true,
    pathParamNames: ['id'],
    commonParams: [
      {
        name: 'id',
        type: 'string',
        required: true,
        description: '设备ID（路径参数）',
        example: '5fd9b168-9e2a-d91c-a7c3-9c1f4d4b5137'
      }
    ],
    module: 'telemetry',
    functionName: 'telemetryDataCurrent'
  },
  {
    label: '根据key查询指标当前值',
    value: '/telemetry/datas/current/keys',
    url: '/telemetry/datas/current/keys',
    method: 'GET',
    description: '设备当前值查询，获取设备每个key的最新一条数据',
    hasPathParams: false,
    commonParams: [
      {
        name: 'device_id',
        type: 'string',
        required: true,
        description: '设备ID',
        example: '5fd9b168-9e2a-d91c-a7c3-9c1f4d4b5137'
      },
      { name: 'keys', type: 'object', required: true, description: '指标key数组', example: ['temperature', 'humidity'] }
    ],
    module: 'telemetry',
    functionName: 'telemetryDataCurrentKeys'
  },
  {
    label: '指标历史数值查询',
    value: '/telemetry/datas/history/pagination',
    url: '/telemetry/datas/history/pagination',
    method: 'GET',
    description: '设备历史数值查询，时间最多限一个月。不送分页支持全部返回，该接口不反回消息总数，只能上一页下一页操作',
    hasPathParams: false,
    commonParams: [
      {
        name: 'device_id',
        type: 'string',
        required: true,
        description: '设备ID',
        example: '5fd9b168-9e2a-d91c-a7c3-9c1f4d4b5137'
      },
      { name: 'key', type: 'string', required: true, description: '指标key', example: 'temperature' },
      {
        name: 'start_time',
        type: 'number',
        required: true,
        description: '起始时间（毫秒时间戳）',
        example: 1742780418369
      },
      {
        name: 'end_time',
        type: 'number',
        required: true,
        description: '结束时间（毫秒时间戳）',
        example: 1711656000000
      },
      { name: 'page', type: 'string', required: false, description: '页码', example: '1' },
      { name: 'page_size', type: 'string', required: false, description: '每页数量', example: '100' },
      {
        name: 'export_excel',
        type: 'string',
        required: false,
        description: '导出到excel标志(true/false)',
        example: 'false'
      }
    ],
    module: 'telemetry',
    functionName: 'telemetryDataHistoryPagination'
  },
  {
    label: '遥测聚合数据查询',
    value: '/telemetry/datas/statistic',
    url: '/telemetry/datas/statistic',
    method: 'GET',
    description: '查询遥测数据的聚合统计信息，支持多种时间范围和聚合方式',
    hasPathParams: false,
    commonParams: [
      {
        name: 'device_id',
        type: 'string',
        required: true,
        description: '设备ID',
        example: 'f3625aae-1283-1afc-259e-f43a58ba7070'
      },
      { name: 'key', type: 'string', required: true, description: '指标key', example: 'temperature' },
      {
        name: 'time_range',
        type: 'string',
        required: true,
        description: '时间范围 (TODO: 后续用表单实现选择器)',
        example: 'last_1h'
        // 可选值: custom, last_5m, last_15m, last_30m, last_1h, last_3h, last_6h, last_12h, last_24h, last_3d, last_7d, last_15d, last_30d, last_60d, last_90d, last_6m, last_1y
      },
      {
        name: 'aggregate_window',
        type: 'string',
        required: true,
        description: '聚合间隔 (TODO: 后续用表单实现与time_range的联动逻辑)',
        example: 'no_aggregate'
        // 可选值: no_aggregate, 30s, 1m, 2m, 5m, 10m, 30m, 1h, 3h, 6h, 1d, 7d, 1mo
      },
      {
        name: 'aggregate_function',
        type: 'string',
        required: false,
        description: '聚合方法 (TODO: 当aggregate_window不为no_aggregate时必填)',
        example: 'avg'
        // 可选值: avg(平均数), max(最大值), min(最小值), sum(求和), diff(最大最小的差值)
      },
      {
        name: 'start_time',
        type: 'number',
        required: false,
        description: '开始时间（毫秒时间戳，time_range为custom时必填）',
        example: 1711864177268
      },
      {
        name: 'end_time',
        type: 'number',
        required: false,
        description: '结束时间（毫秒时间戳，time_range为custom时必填）',
        example: 1711864177268
      },
      { name: 'is_export', type: 'boolean', required: false, description: '是否导出', example: false }
    ],
    module: 'telemetry',
    functionName: 'telemetryDataStatistic'
  },
  {
    label: '批量查询多个设备的遥测统计数据',
    value: '/telemetry/datas/statistic/batch',
    url: '/telemetry/datas/statistic/batch',
    method: 'GET',
    description: '批量查询多个设备的遥测统计数据，只有diff支持数字型字符串',
    hasPathParams: false,
    commonParams: [
      {
        name: 'device_ids',
        type: 'object',
        required: true,
        description: '设备ID数组',
        example: ['device-001', 'device-002']
      },
      {
        name: 'keys',
        type: 'object',
        required: true,
        description: '遥测key数组',
        example: ['temperature', 'humidity']
      },
      {
        name: 'time_type',
        type: 'string',
        required: true,
        description: '时间类型 (hour/day/week/month/year)',
        example: 'hour'
      },
      {
        name: 'aggregate_method',
        type: 'string',
        required: true,
        description: '聚合方式 (avg/sum/max/min/count/diff-聚合区间内最新和最旧数据的差)',
        example: 'avg'
      },
      { name: 'limit', type: 'number', required: false, description: '数据数量限制（1-1000）', example: 100 }
    ],
    module: 'telemetry',
    functionName: 'telemetryDataStatisticBatch'
  }
]

/**
 * 设备数据模块API接口
 */
const deviceApis: InternalApiItem[] = [
  {
    label: '设备简单信息查询（带遥测数据）',
    value: '/device/map/telemetry/{id}',
    url: '/device/map/telemetry/{id}',
    method: 'GET',
    description: '地图上遥测接口，返回设备基本信息和遥测数据，如label不返回则显示key',
    hasPathParams: true,
    pathParamNames: ['id'],
    commonParams: [
      {
        name: 'id',
        type: 'string',
        required: true,
        description: '设备ID（路径参数）',
        example: 'ca33926c-5ee5-3e9f-147e-94e188fde65b'
      }
    ],
    module: 'device',
    functionName: 'deviceMapTelemetry'
  },
  {
    label: '设备单指标图表数据查询',
    value: '/device/metrics/chart',
    url: '/device/metrics/chart',
    method: 'GET',
    description: '查询设备最新数据和历史数据',
    hasPathParams: false,
    commonParams: [
      {
        name: 'device_id',
        type: 'string',
        required: true,
        description: '设备ID',
        example: 'af13ac2c-3a9e-5ab9-cd31-0cf01f984b3c'
      },
      {
        name: 'data_type',
        type: 'string',
        required: true,
        description: '设备数据类型 (TODO: 后续用表单实现选择器)',
        example: 'telemetry'
        // 可选值: telemetry(遥测), attribute(属性), command(命令), event(事件)
      },
      {
        name: 'data_mode',
        type: 'string',
        required: true,
        description: '数据模式 (TODO: 后续用表单实现选择器)',
        example: 'latest'
        // 可选值: latest(最新值), history(历史数据-需要data_type是telemetry并且key的值是数字)
      },
      {
        name: 'key',
        type: 'string',
        required: true,
        description: '数据标识符（根据data_type不同代表不同含义：遥测指标名称、属性键名、命令标识符或事件标识符）',
        example: 'temperature'
      },
      {
        name: 'time_range',
        type: 'string',
        required: false,
        description: '时间范围，默认last_5m (TODO: 后续用表单实现选择器)',
        example: 'last_5m'
        // 可选值: last_5m, last_15m, last_30m, last_1h, last_3h, last_6h, last_12h, last_24h, last_3d, last_7d, last_15d, last_30d, last_60d, last_90d, last_6m, last_1y
      },
      {
        name: 'aggregate_window',
        type: 'string',
        required: false,
        description: '聚合间隔，默认no_aggregate (TODO: 后续用表单实现与time_range的联动逻辑)',
        example: 'no_aggregate'
        // 可选值: no_aggregate, 30s, 1m, 2m, 5m, 10m, 30m, 1h, 3h, 6h, 1d, 7d, 1mo
      },
      {
        name: 'aggregate_function',
        type: 'string',
        required: false,
        description: '聚合方法，默认avg (TODO: 当aggregate_window不为no_aggregate时使用)',
        example: 'avg'
        // 可选值: avg(平均数), max(最大值), min(最小值), sum(求和), diff(最大最小的差值)
      }
    ],
    module: 'device',
    functionName: 'deviceMetricsChart'
  },
  {
    label: '【租户/用户】设备汇总',
    value: '/board/tenant/device/info',
    url: '/board/tenant/device/info',
    method: 'GET',
    description: '租户下设备总数、在线数和激活数统计',
    hasPathParams: false,
    commonParams: [
      // 此接口无需查询参数，仅需token认证
    ],
    module: 'device',
    functionName: 'boardTenantDeviceInfo'
  }
]

/**
 * 属性数据模块API接口
 */
const attributeApis: InternalApiItem[] = [
  {
    label: '根据KEY查询属性信息',
    value: '/attribute/datas/key',
    url: '/attribute/datas/key',
    method: 'GET',
    description: '根据指定的key查询属性信息',
    hasPathParams: false,
    commonParams: [],
    module: 'attribute',
    functionName: 'attributeDataByKey'
  },
  {
    label: '设备属性列表查询',
    value: '/attribute/datas/{id}',
    url: '/attribute/datas/{id}',
    method: 'GET',
    description: '查询指定设备的属性列表',
    hasPathParams: true,
    pathParamNames: ['id'],
    commonParams: [
      {
        name: 'id',
        type: 'string',
        required: true,
        description: '设备ID（路径参数）',
        example: 'ca33926c-5ee5-3e9f-147e-94e188fde65b'
      }
    ],
    module: 'attribute',
    functionName: 'attributeDataList'
  }
]

/**
 * 事件数据模块API接口
 */
const eventApis: InternalApiItem[] = [
  {
    label: '事件数据分页查询',
    value: '/event/datas',
    url: '/event/datas',
    method: 'GET',
    description: '事件数据查询（分页）',
    hasPathParams: false,
    commonParams: [
      {
        name: 'device_id',
        type: 'string',
        required: true,
        description: '设备ID',
        example: 'ca33926c-5ee5-3e9f-147e-94e188fde65b'
      },
      { name: 'page', type: 'number', required: true, description: '页码', example: 1 },
      { name: 'page_size', type: 'number', required: true, description: '每页数量', example: 10 },
      { name: 'identify', type: 'string', required: false, description: '事件标识符', example: 'event_001' }
    ],
    module: 'event',
    functionName: 'eventDataPagination'
  }
]

/**
 * 告警数据模块API接口
 */
const alarmApis: InternalApiItem[] = [
  {
    label: '【租户】当前告警状态的设备数量',
    value: '/alarm/device/counts',
    url: '/alarm/device/counts',
    method: 'GET',
    description: '查询租户下当前告警状态的设备数量统计',
    hasPathParams: false,
    commonParams: [
      // 此接口无需查询参数，仅需token认证
    ],
    module: 'alarm',
    functionName: 'alarmDeviceCounts'
  },
  {
    label: '获取设备告警状态',
    value: '/alarm/info/history/device',
    url: '/alarm/info/history/device',
    method: 'GET',
    description: '获取指定设备的告警状态',
    hasPathParams: false,
    commonParams: [
      {
        name: 'device_id',
        type: 'string',
        required: true,
        description: '设备ID',
        example: '41b44d60-305f-f559-1d8d-61c040b63b1e'
      }
    ],
    module: 'alarm',
    functionName: 'alarmInfoHistoryDevice'
  },
  {
    label: '获取告警历史列表',
    value: '/alarm/info/history',
    url: '/alarm/info/history',
    method: 'GET',
    description: '获取告警历史记录列表（分页）',
    hasPathParams: false,
    commonParams: [
      { name: 'page', type: 'number', required: true, description: '页码', example: 1 },
      { name: 'page_size', type: 'number', required: true, description: '每页数量', example: 10 },
      {
        name: 'device_id',
        type: 'string',
        required: false,
        description: '设备ID（筛选条件）',
        example: '41b44d60-305f-f559-1d8d-61c040b63b1e'
      },
      { name: 'alarm_status', type: 'string', required: false, description: '告警状态（筛选条件）', example: '' },
      { name: 'start_time', type: 'string', required: false, description: '开始时间（筛选条件）', example: '' },
      { name: 'end_time', type: 'string', required: false, description: '结束时间（筛选条件）', example: '' }
    ],
    module: 'alarm',
    functionName: 'alarmInfoHistory'
  }
]

/**
 * 内部地址选项数据
 * 按模块分组的API接口列表
 */
export const internalAddressOptions: InternalAddressOptions = [
  {
    type: 'group',
    label: '遥测数据',
    key: 'telemetry',
    children: telemetryApis
  },
  {
    type: 'group',
    label: '设备数据',
    key: 'device',
    children: deviceApis
  },
  {
    type: 'group',
    label: '属性数据',
    key: 'attribute',
    children: attributeApis
  },
  {
    type: 'group',
    label: '事件数据',
    key: 'event',
    children: eventApis
  },
  {
    type: 'group',
    label: '告警数据',
    key: 'alarm',
    children: alarmApis
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
