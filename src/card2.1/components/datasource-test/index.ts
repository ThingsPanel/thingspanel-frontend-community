/**
 * 数据源测试组件定义
 * Card 2.1 系统 - 正确的数据消费者架构
 */

import type { ComponentDefinition } from '../../core/types'
import type { ComponentDataSourceDefinition } from '../../../components/visual-editor/types/data-source'
import DataSourceTestCard from './DataSourceTestCard.vue'
import icon from './icon'

/**
 * 组件数据源定义 - Visual Editor设置面板使用
 * 声明组件需要的3个key数据源
 */
const dataSourceDefinitions: ComponentDataSourceDefinition[] = [
  {
    name: 'data',
    type: 'object',
    required: false,
    description: '包含3个key的数据对象，支持从复杂JSON通过路径映射获取数据',
    defaultValue: { key1: null, key2: null, key3: null },
    mappingKeys: ['key1', 'key2', 'key3']
  }
]

/**
 * 数据源测试组件定义
 * 作为数据消费者，专注于展示和处理来自数据源的数据
 */
const DataSourceTestDefinition: ComponentDefinition = {
  type: 'datasource-test',
  name: '数据源测试',
  description:
    '用于测试数据源系统的组件，展示从数据源接收的3个key数据。请在右侧数据源面板配置复杂JSON数据源和路径映射。',
  category: 'test',
  version: '2.0.0',
  author: 'ThingsPanel Team',

  // Vue组件
  component: DataSourceTestCard,

  // 图标
  icon,

  // 数据源定义 - 关键！声明组件需要的数据源结构
  dataSourceDefinitions,

  // 默认配置
  config: {
    style: {
      width: 400,
      height: 500
    },
    data: {
      title: '数据源测试组件',
      showDebugInfo: true
    }
  },

  // 属性配置
  properties: {
    title: {
      type: 'string',
      label: '标题',
      default: '数据源测试组件',
      description: '组件标题'
    },
    showDebugInfo: {
      type: 'boolean',
      label: '显示调试信息',
      default: true,
      description: '是否显示数据调试信息'
    },
    refreshInterval: {
      type: 'number',
      label: '刷新间隔(ms)',
      default: 5000,
      description: '数据刷新间隔，毫秒'
    }
  },

  // 支持的数据源类型
  supportedDataSources: ['static', 'api', 'websocket', 'script', 'database'],

  // 组件标签
  tags: ['测试', '数据源', '调试', '实时数据'],

  // 使用示例 - 复杂JSON数据源和路径映射示例
  examples: [
    {
      name: '传感器数据映射',
      description: '使用复杂JSON数据源并配置路径映射到3个key',
      sourceData: {
        sensors: {
          temperature: {
            current: 25.5,
            unit: '°C',
            status: 'normal'
          },
          humidity: {
            current: 60,
            unit: '%',
            status: 'normal'
          },
          pressure: {
            current: 1013.25,
            unit: 'hPa',
            status: 'normal'
          }
        },
        device: {
          id: 'sensor_001',
          name: '环境监测传感器',
          status: 'online',
          lastUpdate: '2024-01-01T12:00:00Z',
          location: {
            building: 'A',
            floor: 2,
            room: '201'
          }
        },
        statistics: {
          uptime: 86400,
          dataPoints: 1440,
          errors: 0,
          warnings: 2
        }
      },
      mapping: {
        key1: 'sensors.temperature.current',
        key2: 'device.status',
        key3: 'statistics.dataPoints'
      },
      expectedOutput: {
        key1: 25.5,
        key2: 'online',
        key3: 1440
      }
    },
    {
      name: '系统监控数据映射',
      description: '系统性能监控数据的路径映射',
      sourceData: {
        system: {
          metrics: {
            performance: {
              cpu: {
                usage: 45.2,
                temperature: 65
              },
              memory: {
                used: 8192,
                total: 16384
              }
            }
          },
          alerts: {
            critical: 0,
            warning: 3,
            info: 12
          }
        }
      },
      mapping: {
        key1: 'system.metrics.performance.cpu.usage',
        key2: 'system.metrics.performance.memory.used',
        key3: 'system.alerts.warning'
      },
      expectedOutput: {
        key1: 45.2,
        key2: 8192,
        key3: 3
      }
    }
  ],

  // 组件文档
  documentation: {
    overview: '数据源测试组件是专门用于测试和验证数据源系统的工具组件',
    features: [
      '实时显示来自数据源的数据',
      '支持多种数据类型（对象、数组、基本类型）',
      '提供详细的数据调试信息',
      '美观的数据可视化展示',
      '支持所有类型的数据源'
    ],
    usage: {
      basic: '1. 添加组件到画布\n2. 在右侧数据源面板配置数据源\n3. 观察组件实时显示数据',
      advanced: '可配置调试信息显示、刷新间隔等选项'
    },
    dataFlow: {
      step1: 'Visual Editor 数据源面板配置数据源',
      step2: 'Card 2.1 数据绑定系统获取和处理数据',
      step3: '组件通过 props.data 接收处理后的数据',
      step4: '组件展示和可视化数据',
      step5: '支持实时数据更新和刷新'
    }
  }
}

export default DataSourceTestDefinition
