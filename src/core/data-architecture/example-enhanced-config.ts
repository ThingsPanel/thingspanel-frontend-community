/**
 * 增强版配置类型示例数据
 * 展示完整的v2.0配置结构和使用方式
 */

import type {
  EnhancedDataSourceConfiguration,
  DataItemConfig,
  EnhancedJsonDataItemConfig,
  EnhancedHttpDataItemConfig,
  DynamicParam
} from './types/enhanced-types'

import { DEFAULT_ENHANCED_FEATURES } from '@/core/data-architecture/types/enhanced-types'

// ==================== JSON数据项示例 ====================

/**
 * JSON数据项配置示例
 */
export const jsonDataItemExample: DataItemConfig<EnhancedJsonDataItemConfig> = {
  type: 'json',
  id: 'sensor_data_json_001',
  config: {
    jsonData: JSON.stringify(
      {
        temperature: 25.6,
        humidity: 68.3,
        pressure: 1013.25,
        location: {
          building: 'A座',
          floor: 3,
          room: '301'
        },
        sensors: [
          { id: 'temp_001', status: 'online', lastUpdate: '2024-01-15T10:30:00Z' },
          { id: 'humi_001', status: 'online', lastUpdate: '2024-01-15T10:30:00Z' }
        ]
      },
      null,
      2
    ),
    validation: {
      enableFormat: true,
      enableStructure: true,
      schema: {
        type: 'object',
        required: ['temperature', 'humidity'],
        properties: {
          temperature: { type: 'number', minimum: -50, maximum: 100 },
          humidity: { type: 'number', minimum: 0, maximum: 100 }
        }
      }
    },
    preprocessing: {
      removeComments: true,
      formatOutput: false
    }
  },
  processing: {
    filterPath: '$.temperature',
    defaultValue: 0,
    transform: 'number'
  },
  metadata: {
    displayName: '传感器数据源',
    description: '办公楼A座3楼温湿度传感器数据',
    createdAt: 1705312200000,
    lastUpdated: 1705312200000,
    enabled: true,
    tags: ['温度', '湿度', '传感器', 'A座']
  }
}

// ==================== HTTP数据项示例 ====================

/**
 * HTTP数据项配置示例
 */
export const httpDataItemExample: DataItemConfig<EnhancedHttpDataItemConfig> = {
  type: 'http',
  id: 'weather_api_http_001',
  config: {
    url: 'https://api.weather.com/v1/current?location={{location}}&units={{units}}',
    method: 'GET',
    headers: [
      {
        key: 'Authorization',
        value: 'Bearer {{apiToken}}',
        enabled: true,
        isDynamic: true,
        dynamicName: 'apiToken',
        exampleValue: 'Bearer your-api-token-here'
      },
      {
        key: 'Content-Type',
        value: 'application/json',
        enabled: true,
        isDynamic: false
      },
      {
        key: 'User-Agent',
        value: 'ThingsPanel/1.0',
        enabled: true,
        isDynamic: false
      },
      {
        key: 'X-Debug-Mode',
        value: 'true',
        enabled: false,
        isDynamic: false
      }
    ],
    params: [
      {
        key: 'location',
        value: 'Beijing',
        enabled: true,
        isDynamic: true,
        dynamicName: 'location',
        exampleValue: 'Shanghai'
      },
      {
        key: 'units',
        value: 'metric',
        enabled: true,
        isDynamic: true,
        dynamicName: 'units',
        exampleValue: 'imperial'
      },
      {
        key: 'lang',
        value: 'zh-CN',
        enabled: true,
        isDynamic: false
      }
    ],
    body: {
      type: 'json',
      content: {
        requestId: '{{requestId}}',
        timestamp: '{{timestamp}}',
        client: 'thingspanel-frontend'
      },
      contentType: 'application/json'
    },
    timeout: 10000,
    preRequestScript: `
      // 预请求脚本示例
      const timestamp = Date.now();
      const requestId = 'req_' + timestamp + '_' + Math.random().toString(36).substr(2, 9);
      
      // 设置动态参数
      setDynamicParam('timestamp', timestamp);
      setDynamicParam('requestId', requestId);
    `,
    responseScript: `
      // 响应后脚本示例
      if (response.status === 200) {
        const data = response.data;
        console.log('API调用成功', data);
        
        // 提取关键数据
        const weather = {
          temperature: data.current?.temperature,
          condition: data.current?.condition,
          humidity: data.current?.humidity
        };
        
        return weather;
      } else {
        console.error('API调用失败', response.status, response.statusText);
        return null;
      }
    `,
    retry: {
      maxRetries: 3,
      retryDelay: 2000
    }
  },
  processing: {
    filterPath: '$.current',
    defaultValue: {},
    transform: 'object'
  },
  metadata: {
    displayName: '天气API数据源',
    description: '获取实时天气数据的HTTP接口',
    createdAt: 1705312200000,
    lastUpdated: 1705312800000,
    enabled: true,
    tags: ['天气', 'API', 'HTTP', '实时数据']
  }
}

// ==================== 动态参数示例 ====================

/**
 * 动态参数配置示例
 */
export const dynamicParamsExample: DynamicParam[] = [
  {
    name: 'apiToken',
    type: 'string',
    currentValue: 'your-api-token-here',
    exampleValue: 'sk-1234567890abcdef',
    description: '天气API访问令牌',
    required: true,
    validation: {
      pattern: '^[a-zA-Z0-9\\-_]+$',
      min: 10,
      max: 100
    }
  },
  {
    name: 'location',
    type: 'string',
    currentValue: 'Beijing',
    exampleValue: 'Shanghai',
    description: '查询天气的城市名称',
    required: true,
    validation: {
      enum: ['Beijing', 'Shanghai', 'Guangzhou', 'Shenzhen', 'Hangzhou']
    }
  },
  {
    name: 'units',
    type: 'string',
    currentValue: 'metric',
    exampleValue: 'imperial',
    description: '温度单位（摄氏度/华氏度）',
    required: false,
    validation: {
      enum: ['metric', 'imperial', 'kelvin']
    }
  },
  {
    name: 'refreshInterval',
    type: 'number',
    currentValue: 300000,
    exampleValue: 600000,
    description: '数据刷新间隔（毫秒）',
    required: false,
    validation: {
      min: 60000, // 最小1分钟
      max: 3600000 // 最大1小时
    }
  },
  {
    name: 'enableCache',
    type: 'boolean',
    currentValue: true,
    exampleValue: false,
    description: '是否启用数据缓存',
    required: false
  }
]

// ==================== 完整配置示例 ====================

/**
 * 完整的增强版数据源配置示例
 */
export const completeEnhancedConfigExample: EnhancedDataSourceConfiguration = {
  // 基础配置
  componentId: 'dashboard_weather_panel_001',
  version: '2.0.0',

  // 数据源配置
  dataSources: [
    {
      sourceId: 'local_sensor_data',
      dataItems: [
        {
          item: jsonDataItemExample,
          processing: {
            filterPath: '$.temperature',
            defaultValue: 0,
            transform: 'number'
          }
        }
      ],
      mergeStrategy: {
        type: 'object'
      }
    },
    {
      sourceId: 'external_weather_api',
      dataItems: [
        {
          item: httpDataItemExample,
          processing: {
            filterPath: '$.current.temperature',
            defaultValue: null,
            transform: 'number'
          }
        }
      ],
      mergeStrategy: {
        type: 'object'
      }
    }
  ],

  // 动态参数配置
  dynamicParams: dynamicParamsExample,

  // 增强功能开关
  enhancedFeatures: {
    ...DEFAULT_ENHANCED_FEATURES,
    dynamicParameterSupport: true,
    performanceMonitoring: true
  },

  // 配置元数据
  metadata: {
    name: '天气监控面板配置',
    description: '结合本地传感器和外部天气API的综合监控面板',
    author: 'system-admin',
    versionHistory: [
      {
        version: '1.0.0',
        timestamp: 1705225800000,
        changelog: '初始配置创建',
        author: 'system-admin'
      },
      {
        version: '2.0.0',
        timestamp: 1705312200000,
        changelog: '升级到增强版配置格式，添加动态参数支持',
        author: 'ConfigurationAdapter'
      }
    ],
    tags: ['天气', '传感器', '监控面板', '实时数据']
  },

  // 时间戳
  createdAt: 1705225800000,
  updatedAt: 1705312200000
}

// ==================== 使用示例 ====================

/**
 * 展示如何使用配置适配器
 */
export function demonstrateConfigUsage() {
  console.log('=== 增强版配置系统示例 ===')

  // 1. 基础配置信息
  console.log('配置ID:', completeEnhancedConfigExample.componentId)
  console.log('配置版本:', completeEnhancedConfigExample.version)
  console.log('数据源数量:', completeEnhancedConfigExample.dataSources.length)
  console.log('动态参数数量:', completeEnhancedConfigExample.dynamicParams?.length)

  // 2. JSON数据项信息
  const jsonItem = completeEnhancedConfigExample.dataSources[0].dataItems[0].item
  console.log('\nJSON数据项:')
  console.log('- ID:', jsonItem.id)
  console.log('- 类型:', jsonItem.type)
  console.log('- 显示名称:', jsonItem.metadata?.displayName)
  console.log('- 启用JSON验证:', (jsonItem.config as EnhancedJsonDataItemConfig).validation?.enableFormat)

  // 3. HTTP数据项信息
  const httpItem = completeEnhancedConfigExample.dataSources[1].dataItems[0].item
  console.log('\nHTTP数据项:')
  console.log('- ID:', httpItem.id)
  console.log('- 类型:', httpItem.type)
  console.log('- 请求URL:', (httpItem.config as EnhancedHttpDataItemConfig).url)
  console.log('- 请求方法:', (httpItem.config as EnhancedHttpDataItemConfig).method)
  console.log('- 请求头数量:', (httpItem.config as EnhancedHttpDataItemConfig).headers.length)
  console.log('- 请求参数数量:', (httpItem.config as EnhancedHttpDataItemConfig).params.length)

  // 4. 动态参数信息
  console.log('\n动态参数:')
  completeEnhancedConfigExample.dynamicParams?.forEach(param => {
    console.log(`- ${param.name} (${param.type}): ${param.currentValue}`)
  })

  // 5. 增强功能信息
  console.log('\n增强功能状态:')
  const features = completeEnhancedConfigExample.enhancedFeatures
  if (features) {
    console.log('- HTTP数组格式:', features.httpArrayFormat)
    console.log('- 动态参数支持:', features.dynamicParameterSupport)
    console.log('- 安全脚本执行:', features.secureScriptExecution)
    console.log('- 配置验证:', features.configurationValidation)
    console.log('- 性能监控:', features.performanceMonitoring)
  }
}

export default {
  jsonDataItemExample,
  httpDataItemExample,
  dynamicParamsExample,
  completeEnhancedConfigExample,
  demonstrateConfigUsage
}
