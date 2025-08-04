import { ApiType, FormConfig, FormParameter } from '../types/api-types'

// API表单配置映射
export const API_FORM_CONFIGS: Record<ApiType, FormConfig> = {
  // 遥测数据 - 当前值
  [ApiType.TELEMETRY_CURRENT]: {
    title: '遥测数据 - 当前值',
    description: '获取设备指定指标的当前值',
    parameters: [
      {
        name: 'keys',
        label: '指标键',
        type: 'string',
        required: true,
        placeholder: '输入指标键，多个用逗号分隔',
        description: '要获取的遥测数据指标键'
      }
    ],
    supportsPolling: true,
    supportsWebSocket: true
  },

  // 遥测数据 - 历史值
  [ApiType.TELEMETRY_HISTORY]: {
    title: '遥测数据 - 历史值',
    description: '获取设备指定指标的历史数据',
    parameters: [
      {
        name: 'key',
        label: '指标键',
        type: 'string',
        required: true,
        placeholder: '输入指标键',
        description: '要获取历史数据的指标键'
      },
      {
        name: 'time_range',
        label: '时间范围',
        type: 'select',
        required: true,
        defaultValue: '1h',
        options: [
          { label: '最近5分钟', value: '5m' },
          { label: '最近15分钟', value: '15m' },
          { label: '最近30分钟', value: '30m' },
          { label: '最近1小时', value: '1h' },
          { label: '最近3小时', value: '3h' },
          { label: '最近6小时', value: '6h' },
          { label: '最近12小时', value: '12h' },
          { label: '最近24小时', value: '24h' },
          { label: '最近3天', value: '3d' },
          { label: '最近7天', value: '7d' },
          { label: '最近30天', value: '30d' }
        ],
        description: '查询历史数据的时间范围'
      },
      {
        name: 'aggregate_function',
        label: '聚合函数',
        type: 'select',
        required: true,
        defaultValue: 'avg',
        options: [
          { label: '平均值', value: 'avg' },
          { label: '最大值', value: 'max' },
          { label: '最小值', value: 'min' },
          { label: '求和', value: 'sum' },
          { label: '计数', value: 'count' }
        ],
        description: '数据聚合方式'
      }
    ],
    supportsPolling: true,
    supportsWebSocket: false
  },

  // 遥测数据 - 发布
  [ApiType.TELEMETRY_PUB]: {
    title: '遥测数据 - 发布',
    description: '向设备发布遥测数据',
    parameters: [
      {
        name: 'key',
        label: '指标键',
        type: 'string',
        required: true,
        placeholder: '输入指标键',
        description: '要发布的遥测数据指标键'
      },
      {
        name: 'value',
        label: '数据值',
        type: 'string',
        required: true,
        placeholder: '输入数据值',
        description: '要发布的遥测数据值'
      }
    ],
    supportsPolling: false,
    supportsWebSocket: false
  },

  // 遥测数据 - 日志
  [ApiType.TELEMETRY_LOGS]: {
    title: '遥测数据 - 日志',
    description: '获取遥测数据操作日志',
    parameters: [
      {
        name: 'key',
        label: '指标键',
        type: 'string',
        required: false,
        placeholder: '输入指标键（可选）',
        description: '要查询日志的指标键，留空查询所有'
      }
    ],
    supportsPolling: true,
    supportsWebSocket: false
  },

  // 属性数据 - 数据集
  [ApiType.ATTRIBUTES_DATASET]: {
    title: '属性数据 - 数据集',
    description: '获取设备所有属性数据',
    parameters: [],
    supportsPolling: true,
    supportsWebSocket: true
  },

  // 属性数据 - 指定键值
  [ApiType.ATTRIBUTES_KEY]: {
    title: '属性数据 - 指定键值',
    description: '获取设备指定属性的值',
    parameters: [
      {
        name: 'key',
        label: '属性键',
        type: 'string',
        required: true,
        placeholder: '输入属性键',
        description: '要获取的属性键'
      }
    ],
    supportsPolling: true,
    supportsWebSocket: true
  },

  // 属性数据 - 发布
  [ApiType.ATTRIBUTES_PUB]: {
    title: '属性数据 - 发布',
    description: '向设备发布属性数据',
    parameters: [
      {
        name: 'key',
        label: '属性键',
        type: 'string',
        required: true,
        placeholder: '输入属性键',
        description: '要发布的属性键'
      },
      {
        name: 'value',
        label: '属性值',
        type: 'string',
        required: true,
        placeholder: '输入属性值',
        description: '要发布的属性值'
      }
    ],
    supportsPolling: false,
    supportsWebSocket: false
  },

  // 属性数据 - 日志
  [ApiType.ATTRIBUTES_LOGS]: {
    title: '属性数据 - 日志',
    description: '获取属性数据操作日志',
    parameters: [],
    supportsPolling: true,
    supportsWebSocket: false
  },

  // 事件数据 - 数据集
  [ApiType.EVENT_DATASET]: {
    title: '事件数据 - 数据集',
    description: '获取设备事件数据',
    parameters: [],
    supportsPolling: true,
    supportsWebSocket: false
  },

  // 命令数据 - 发布
  [ApiType.COMMAND_PUB]: {
    title: '命令数据 - 发布',
    description: '向设备发布命令',
    parameters: [
      {
        name: 'key',
        label: '命令键',
        type: 'string',
        required: true,
        placeholder: '输入命令键',
        description: '要发布的命令键'
      },
      {
        name: 'value',
        label: '命令值',
        type: 'string',
        required: true,
        placeholder: '输入命令值',
        description: '要发布的命令值'
      }
    ],
    supportsPolling: false,
    supportsWebSocket: false
  },

  // 命令数据 - 日志
  [ApiType.COMMAND_LOGS]: {
    title: '命令数据 - 日志',
    description: '获取命令操作日志',
    parameters: [],
    supportsPolling: true,
    supportsWebSocket: false
  },

  // 命令数据 - 自定义命令
  [ApiType.COMMAND_CUSTOM]: {
    title: '命令数据 - 自定义命令',
    description: '获取设备可用的自定义命令列表',
    parameters: [],
    supportsPolling: true,
    supportsWebSocket: false
  },

  // 设备信息 - 详情
  [ApiType.DEVICE_DETAIL]: {
    title: '设备信息 - 详情',
    description: '获取设备详细信息',
    parameters: [],
    supportsPolling: true,
    supportsWebSocket: false
  },

  // 设备信息 - 连接信息
  [ApiType.DEVICE_CONNECT]: {
    title: '设备信息 - 连接信息',
    description: '获取设备连接状态信息',
    parameters: [],
    supportsPolling: true,
    supportsWebSocket: false
  },

  // 设备信息 - 告警状态
  [ApiType.DEVICE_ALARM_STATUS]: {
    title: '设备信息 - 告警状态',
    description: '获取设备当前告警状态',
    parameters: [],
    supportsPolling: true,
    supportsWebSocket: false
  },

  // 设备信息 - 告警历史
  [ApiType.DEVICE_ALARM_HISTORY]: {
    title: '设备信息 - 告警历史',
    description: '获取设备告警历史记录',
    parameters: [],
    supportsPolling: true,
    supportsWebSocket: false
  },

  // 模拟数据 - 获取
  [ApiType.SIMULATION_GET]: {
    title: '模拟数据 - 获取',
    description: '获取设备模拟数据命令',
    parameters: [],
    supportsPolling: true,
    supportsWebSocket: false
  },

  // 模拟数据 - 发送
  [ApiType.SIMULATION_SEND]: {
    title: '模拟数据 - 发送',
    description: '向设备发送模拟数据',
    parameters: [
      {
        name: 'key',
        label: '数据键',
        type: 'string',
        required: true,
        placeholder: '输入数据键',
        description: '要发送的模拟数据键'
      },
      {
        name: 'value',
        label: '数据值',
        type: 'string',
        required: true,
        placeholder: '输入数据值',
        description: '要发送的模拟数据值'
      }
    ],
    supportsPolling: false,
    supportsWebSocket: false
  }
}

// 获取API表单配置
export function getApiFormConfig(apiType: ApiType): FormConfig {
  return API_FORM_CONFIGS[apiType]
}

// 验证参数
export function validateParameters(apiType: ApiType, parameters: Record<string, any>): string | null {
  const config = getApiFormConfig(apiType)
  
  for (const param of config.parameters) {
    if (param.required && (!parameters[param.name] || parameters[param.name] === '')) {
      return `${param.label}是必需的`
    }
    
    if (param.validation && parameters[param.name]) {
      const error = param.validation(parameters[param.name])
      if (error) return error
    }
  }
  
  return null
}

// 格式化API响应
export function formatApiResponse(data: any, apiType: ApiType): any {
  const timestamp = new Date().toISOString()
  
  switch (apiType) {
    case ApiType.TELEMETRY_CURRENT:
      return {
        value: data?.data?.[0]?.value,
        unit: data?.data?.[0]?.unit,
        timestamp,
        quality: 'good'
      }
      
    case ApiType.TELEMETRY_HISTORY:
      return {
        values: data?.data || [],
        aggregate: data?.data?.[0]?.value,
        timestamp,
        quality: 'good'
      }
      
    case ApiType.TELEMETRY_PUB:
    case ApiType.ATTRIBUTES_PUB:
    case ApiType.COMMAND_PUB:
    case ApiType.SIMULATION_SEND:
      return {
        success: true,
        message: '操作成功',
        data: data,
        timestamp
      }
      
    case ApiType.ATTRIBUTES_DATASET:
      return {
        attributes: data?.data || [],
        timestamp
      }
      
    case ApiType.ATTRIBUTES_KEY:
      return {
        value: data?.data?.value,
        timestamp,
        quality: 'good'
      }
      
    case ApiType.EVENT_DATASET:
      return {
        events: data?.data || [],
        timestamp
      }
      
    case ApiType.COMMAND_CUSTOM:
      return {
        commands: data?.data || [],
        timestamp
      }
      
    case ApiType.DEVICE_DETAIL:
      return {
        device: data?.data,
        timestamp
      }
      
    case ApiType.DEVICE_CONNECT:
      return {
        connectInfo: data?.data,
        timestamp
      }
      
    case ApiType.DEVICE_ALARM_STATUS:
      return {
        alarmStatus: data?.data,
        timestamp
      }
      
    case ApiType.DEVICE_ALARM_HISTORY:
      return {
        alarmHistory: data?.data,
        timestamp
      }
      
    case ApiType.SIMULATION_GET:
      return {
        simulation: data?.data,
        timestamp
      }
      
    default:
      return {
        data: data,
        timestamp
      }
  }
}

// 获取API类型标签
export function getApiTypeLabel(apiType: ApiType): string {
  return getApiFormConfig(apiType).title
}

// 获取API类型描述
export function getApiTypeDescription(apiType: ApiType): string {
  return getApiFormConfig(apiType).description
} 