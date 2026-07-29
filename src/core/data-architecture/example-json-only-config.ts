/**
 * 纯JSON数据源配置示例
 * 暂时忽略HTTP类型，专注于JSON数据项的完整功能展示
 */

import type {
  EnhancedDataSourceConfiguration,
  DataItemConfig,
  EnhancedJsonDataItemConfig
} from './types/enhanced-types'

import { DEFAULT_ENHANCED_FEATURES } from '@/core/data-architecture/types/enhanced-types'

// ==================== JSON数据项示例集合 ====================

/**
 * 设备状态JSON数据项
 */
export const deviceStatusJsonItem: DataItemConfig<EnhancedJsonDataItemConfig> = {
  type: 'json',
  id: 'device_status_001',
  config: {
    jsonData: JSON.stringify(
      {
        deviceId: 'DEV_001',
        deviceName: '温湿度传感器01',
        status: 'online',
        location: {
          building: 'A座',
          floor: 3,
          room: '301',
          coordinates: { x: 120.5, y: 80.3 }
        },
        metrics: {
          temperature: 25.6,
          humidity: 68.3,
          batteryLevel: 85,
          signalStrength: -45
        },
        lastUpdate: '2024-01-15T10:30:00Z',
        alarms: []
      },
      null,
      2
    ),
    validation: {
      enableFormat: true,
      enableStructure: true,
      schema: {
        type: 'object',
        required: ['deviceId', 'status', 'metrics'],
        properties: {
          deviceId: { type: 'string' },
          status: { type: 'string', enum: ['online', 'offline', 'error'] },
          metrics: {
            type: 'object',
            properties: {
              temperature: { type: 'number', minimum: -50, maximum: 100 },
              humidity: { type: 'number', minimum: 0, maximum: 100 },
              batteryLevel: { type: 'number', minimum: 0, maximum: 100 }
            }
          }
        }
      }
    },
    preprocessing: {
      removeComments: true,
      formatOutput: false
    }
  },
  processing: {
    filterPath: '$.metrics.temperature',
    defaultValue: 0,
    transform: 'number'
  },
  metadata: {
    displayName: '设备状态数据',
    description: '温湿度传感器实时状态信息',
    enabled: true,
    tags: ['设备', '传感器', '温度', '湿度']
  }
}

/**
 * 统计数据JSON数据项
 */
export const statisticsJsonItem: DataItemConfig<EnhancedJsonDataItemConfig> = {
  type: 'json',
  id: 'statistics_data_002',
  config: {
    jsonData: JSON.stringify(
      {
        reportDate: '2024-01-15',
        totalDevices: 156,
        onlineDevices: 142,
        offlineDevices: 14,
        deviceTypes: {
          temperature: 45,
          humidity: 38,
          pressure: 32,
          motion: 41
        },
        dailyStats: [
          { hour: 0, online: 138, offline: 18 },
          { hour: 1, online: 135, offline: 21 },
          { hour: 2, online: 140, offline: 16 },
          { hour: 3, online: 142, offline: 14 }
        ],
        alerts: {
          critical: 2,
          warning: 7,
          info: 23
        }
      },
      null,
      2
    ),
    validation: {
      enableFormat: true,
      enableStructure: true,
      schema: {
        type: 'object',
        required: ['reportDate', 'totalDevices'],
        properties: {
          totalDevices: { type: 'number', minimum: 0 },
          onlineDevices: { type: 'number', minimum: 0 },
          offlineDevices: { type: 'number', minimum: 0 }
        }
      }
    },
    preprocessing: {
      removeComments: true,
      formatOutput: true
    }
  },
  processing: {
    filterPath: '$',
    defaultValue: {},
    transform: 'object'
  },
  metadata: {
    displayName: '设备统计数据',
    description: '设备在线状态和类型统计信息',
    enabled: true,
    tags: ['统计', '报表', '设备管理']
  }
}

/**
 * 历史数据JSON数据项
 */
export const historyDataJsonItem: DataItemConfig<EnhancedJsonDataItemConfig> = {
  type: 'json',
  id: 'history_data_003',
  config: {
    jsonData: JSON.stringify(
      {
        dataRange: {
          startTime: '2024-01-15T00:00:00Z',
          endTime: '2024-01-15T23:59:59Z'
        },
        measurements: [
          { timestamp: '2024-01-15T10:00:00Z', temperature: 25.1, humidity: 67.8 },
          { timestamp: '2024-01-15T10:30:00Z', temperature: 25.6, humidity: 68.3 },
          { timestamp: '2024-01-15T11:00:00Z', temperature: 26.2, humidity: 69.1 },
          { timestamp: '2024-01-15T11:30:00Z', temperature: 26.8, humidity: 70.2 },
          { timestamp: '2024-01-15T12:00:00Z', temperature: 27.3, humidity: 71.5 }
        ],
        summary: {
          avgTemperature: 26.2,
          maxTemperature: 27.3,
          minTemperature: 25.1,
          avgHumidity: 69.38,
          dataPoints: 5
        }
      },
      null,
      2
    ),
    validation: {
      enableFormat: true,
      enableStructure: true,
      schema: {
        type: 'object',
        required: ['measurements', 'summary'],
        properties: {
          measurements: {
            type: 'array',
            items: {
              type: 'object',
              required: ['timestamp', 'temperature', 'humidity'],
              properties: {
                timestamp: { type: 'string' },
                temperature: { type: 'number' },
                humidity: { type: 'number' }
              }
            }
          }
        }
      }
    },
    preprocessing: {
      removeComments: false,
      formatOutput: true
    }
  },
  processing: {
    filterPath: '$.measurements',
    defaultValue: [],
    transform: 'array'
  },
  metadata: {
    displayName: '历史数据记录',
    description: '温湿度传感器历史测量数据',
    enabled: true,
    tags: ['历史数据', '时间序列', '测量记录']
  }
}

/**
 * 配置信息JSON数据项
 */
export const configInfoJsonItem: DataItemConfig<EnhancedJsonDataItemConfig> = {
  type: 'json',
  id: 'config_info_004',
  config: {
    jsonData: JSON.stringify(
      {
        systemConfig: {
          version: '1.2.5',
          environment: 'production',
          debugMode: false,
          logLevel: 'info'
        },
        dashboardConfig: {
          refreshInterval: 30000,
          autoRefresh: true,
          theme: 'light',
          language: 'zh-CN',
          timezone: 'Asia/Shanghai'
        },
        alertConfig: {
          enableEmail: true,
          enableSMS: false,
          enablePush: true,
          thresholds: {
            temperature: { min: 15, max: 35, unit: 'celsius' },
            humidity: { min: 30, max: 80, unit: 'percent' },
            battery: { critical: 20, warning: 30, unit: 'percent' }
          }
        },
        displayConfig: {
          chartsEnabled: true,
          tablesEnabled: true,
          mapsEnabled: false,
          maxDataPoints: 1000
        }
      },
      null,
      2
    ),
    validation: {
      enableFormat: true,
      enableStructure: false
    },
    preprocessing: {
      removeComments: true,
      formatOutput: false
    }
  },
  processing: {
    filterPath: '$',
    defaultValue: {},
    transform: 'object'
  },
  metadata: {
    displayName: '系统配置信息',
    description: '仪表板和告警系统的配置参数',
    enabled: true,
    tags: ['系统配置', '仪表板', '告警']
  }
}

// ==================== 完整的纯JSON配置示例 ====================

/**
 * 完整的纯JSON数据源配置
 */
export const pureJsonConfigExample: EnhancedDataSourceConfiguration = {
  // 基础配置
  componentId: 'dashboard_sensors_panel_001',
  version: '2.0.0',

  // 数据源配置 - 全部使用JSON类型
  dataSources: [
    {
      sourceId: 'device_status_source',
      dataItems: [
        {
          item: deviceStatusJsonItem,
          processing: {
            filterPath: '$.metrics.temperature',
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
      sourceId: 'statistics_source',
      dataItems: [
        {
          item: statisticsJsonItem,
          processing: {
            filterPath: '$.totalDevices',
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
      sourceId: 'history_source',
      dataItems: [
        {
          item: historyDataJsonItem,
          processing: {
            filterPath: '$.measurements',
            defaultValue: [],
            transform: 'array'
          }
        }
      ],
      mergeStrategy: {
        type: 'array'
      }
    },
    {
      sourceId: 'config_source',
      dataItems: [
        {
          item: configInfoJsonItem,
          processing: {
            filterPath: '$.dashboardConfig',
            defaultValue: {},
            transform: 'object'
          }
        }
      ],
      mergeStrategy: {
        type: 'object'
      }
    }
  ],

  // 动态参数配置（JSON类型暂不需要动态参数，留空数组）
  dynamicParams: [],

  // 增强功能开关（关闭HTTP相关功能）
  enhancedFeatures: {
    ...DEFAULT_ENHANCED_FEATURES,
    httpArrayFormat: false, // 关闭HTTP功能
    dynamicParameterSupport: false, // JSON暂不需要动态参数
    secureScriptExecution: false, // JSON暂不需要脚本执行
    configurationValidation: true, // 保持配置验证
    performanceMonitoring: true // 保持性能监控
  },

  // 配置元数据
  metadata: {
    name: '传感器监控面板配置',
    description: '基于纯JSON数据源的传感器监控仪表板',
    author: 'system-admin',
    versionHistory: [
      {
        version: '1.0.0',
        timestamp: 1705225800000,
        changelog: '初始JSON配置创建',
        author: 'system-admin'
      },
      {
        version: '2.0.0',
        timestamp: 1705312200000,
        changelog: '升级到v2.0增强版配置格式',
        author: 'ConfigurationAdapter'
      }
    ],
    tags: ['传感器', 'JSON数据', '监控面板', '设备管理']
  },

  // 时间戳
  createdAt: 1705225800000,
  updatedAt: 1705312200000
}

// ==================== 使用示例 ====================

/**
 * 展示纯JSON配置的使用
 */
export function demonstratePureJsonConfig() {
  // 1. 基础配置信息

  // 2. 数据源详情
  pureJsonConfigExample.dataSources.forEach((source, index) => {
    source.dataItems.forEach((dataItem, itemIndex) => {
      const item = dataItem.item

      // 解析JSON数据预览
      const jsonConfig = item.config as EnhancedJsonDataItemConfig
      try {
        const parsedData = JSON.parse(jsonConfig.jsonData)
        const keys = Object.keys(parsedData).slice(0, 3) // 只显示前3个键
        if (process.env.NODE_ENV === 'development') {
        }
      } catch (e) {}
    })
  })

  // 3. 增强功能状态
  if (process.env.NODE_ENV === 'development') {
  }
  const features = pureJsonConfigExample.enhancedFeatures
}

export default {
  deviceStatusJsonItem,
  statisticsJsonItem,
  historyDataJsonItem,
  configInfoJsonItem,
  pureJsonConfigExample,
  demonstratePureJsonConfig
}
