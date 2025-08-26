/**
 * 双数据源显示组件定义
 * 专门用于测试新数据源架构，支持两个独立的数据源
 */

import type { ComponentDefinition } from '@/card2.1/core/types'
import DualDataDisplay from './DualDataDisplay.vue'
import DualDataDisplayConfig from './DualDataDisplayConfig.vue'

const dualDataDisplayDefinition: ComponentDefinition = {
  // 基础信息
  type: 'dual-data-display',
  name: '双数据源显示',
  description: '用于测试新数据源架构的双数据源显示组件，可以同时显示两个数据源的数据',
  category: '数据源测试',
  version: '2.0.0',
  author: 'ThingsPanel',

  // 组件实现
  component: DualDataDisplay,

  // 配置组件
  configComponent: DualDataDisplayConfig,

  // 默认配置
  defaultConfig: {
    title: '双数据源测试',
    dataSources: {
      dataSource1: {
        type: 'static',
        enabled: true,
        config: {
          data: {
            sensor: 'temperature',
            value: 24.5,
            unit: '°C',
            status: 'normal',
            timestamp: new Date().toISOString()
          }
        }
      },
      dataSource2: {
        type: 'static',
        enabled: true,
        config: {
          data: {
            device: 'humidity_sensor',
            reading: 65,
            unit: '%',
            location: 'Room A',
            lastCheck: new Date().toISOString()
          }
        }
      }
    }
  },

  // 默认布局
  defaultLayout: {
    canvas: {
      width: 500,
      height: 350,
      x: 0,
      y: 0
    },
    gridstack: {
      w: 4,
      h: 4,
      x: 0,
      y: 0,
      minW: 3,
      minH: 3,
      maxW: 8,
      maxH: 6
    }
  },

  // 支持的数据源类型
  supportedDataSources: ['static', 'api', 'websocket'],

  // 🔥 数据源需求声明 - 与新数据架构兼容的格式
  dataSources: {
    dataSource1: {
      type: 'object',
      title: '数据源1',
      description: '第一个数据源 - 支持温度、传感器等设备数据',
      required: false,

      // 数据源配置选项
      config: {
        supportedTypes: ['static', 'api', 'websocket', 'script'],
        defaultType: 'static',
        exampleData: {
          sensor: 'temperature',
          value: 25.8,
          unit: '°C',
          status: 'normal',
          location: '机房A-01',
          timestamp: new Date().toISOString()
        }
      }
    },

    dataSource2: {
      type: 'object',
      title: '数据源2',
      description: '第二个数据源 - 支持湿度、系统监控等数据',
      required: false,

      // 数据源配置选项
      config: {
        supportedTypes: ['static', 'api', 'websocket', 'script'],
        defaultType: 'static',
        exampleData: {
          device: 'humidity_sensor',
          reading: 62,
          unit: '%',
          status: 'active',
          location: '机房A-02',
          lastCheck: new Date().toISOString()
        }
      }
    }
  },

  // 🔥 静态参数配置 - 组件基本属性
  staticParams: {
    componentId: {
      type: 'string',
      title: '组件ID',
      description: '组件的唯一标识符',
      defaultValue: '',
      required: false
    },
    title: {
      type: 'string',
      title: '组件标题',
      description: '显示在组件顶部的标题',
      defaultValue: '双数据源测试',
      required: false
    }
  },

  // 数据需求声明 - 向后兼容的格式
  dataRequirements: {
    componentType: 'dual-data-display',
    displayName: '双数据源显示组件',
    description: '需要两个独立的数据源进行显示',

    // 主要数据字段（用于向后兼容）
    primaryData: {
      name: 'dataSource1',
      type: 'object',
      required: false,
      description: '第一个数据源'
    },

    // 声明需要的数据源列表
    dataFields: [
      {
        name: 'dataSource1',
        type: 'object',
        required: false,
        description: '第一个数据源 - 温度传感器数据'
      },
      {
        name: 'dataSource2',
        type: 'object',
        required: false,
        description: '第二个数据源 - 湿度传感器数据'
      }
    ]
  },

  // 标签
  tags: ['dual-datasource', 'test', 'display', 'new-architecture'],

  // 示例数据
  sampleData: {
    dataSource1: {
      temperature: 25.8,
      humidity: 62,
      location: 'Server Room',
      lastUpdate: new Date().toISOString()
    },
    dataSource2: {
      cpuUsage: 45.2,
      memoryUsage: 67.8,
      diskSpace: 85.1,
      networkStatus: 'active'
    }
  },

  // 特性标记
  features: {
    realtime: true,
    dataBinding: true,
    themeable: true,
    responsive: true,
    dualDataSource: true,
    configurable: true,
    interactive: true
  },

  // 交互系统配置
  interaction: {
    capability: {
      supportedEvents: ['click', 'hover', 'dataChange'],
      supportedActions: ['jump', 'modify'],
      defaultPermissions: {
        allowExternalControl: true,
        requirePermissionCheck: false
      },
      listenableProperties: ['dataSource1', 'dataSource2', 'config']
    },

    examples: [
      {
        name: '点击跳转到外部URL',
        description: '点击组件时跳转到外部网站',
        scenario: 'click-jump',
        config: {
          event: 'click',
          responses: [
            {
              action: 'jump',
              jumpConfig: {
                jumpType: 'external',
                url: 'https://example.com',
                target: '_blank'
              }
            }
          ],
          enabled: true,
          priority: 1,
          name: '点击跳转示例'
        }
      },
      {
        name: '悬停时修改其他组件',
        description: '悬停时修改目标组件的属性',
        scenario: 'hover-modify',
        config: {
          event: 'hover',
          responses: [
            {
              action: 'modify',
              modifyConfig: {
                targetComponentId: 'target-component-id',
                targetProperty: 'config.title',
                updateValue: '悬停时修改的标题',
                updateMode: 'replace'
              }
            }
          ],
          enabled: false,
          priority: 2,
          name: '悬停修改示例'
        }
      },
      {
        name: '数据变化时跳转',
        description: '当数据源1的值大于阈值时跳转到详情页',
        scenario: 'data-change-action',
        config: {
          event: 'dataChange',
          watchedProperty: 'dataSource1',
          condition: {
            type: 'comparison',
            operator: 'greaterThan',
            value: 100
          },
          responses: [
            {
              action: 'jump',
              jumpConfig: {
                jumpType: 'external',
                url: '/details',
                target: '_self'
              }
            }
          ],
          enabled: false,
          priority: 3,
          name: '数据变化跳转示例'
        }
      }
    ],

    propertyExposure: {
      componentType: 'dual-data-display',
      componentName: '双数据源显示组件',
      listenableProperties: [
        {
          name: 'dataSource1',
          label: '数据源1',
          type: 'object',
          description: '第一个数据源的数据',
          group: '数据',
          defaultValue: null
        },
        {
          name: 'dataSource2',
          label: '数据源2',
          type: 'object',
          description: '第二个数据源的数据',
          group: '数据',
          defaultValue: null
        },
        {
          name: 'config.title',
          label: '组件标题',
          type: 'string',
          description: '组件显示的标题',
          group: '配置',
          defaultValue: '双数据源测试'
        },
        {
          name: 'config.themeColor',
          label: '主题颜色',
          type: 'string',
          description: '组件的主题颜色',
          group: '样式',
          defaultValue: '#18a058'
        }
      ]
    }
  }
}

export default dualDataDisplayDefinition
