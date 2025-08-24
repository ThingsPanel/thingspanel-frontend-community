/**
 * 三数据源显示组件定义
 * 支持三个独立数据源的综合展示组件
 */

import type { ComponentDefinition } from '@/card2.1/core/types'
import TripleDataDisplay from './TripleDataDisplay.vue'
import TripleDataDisplayConfig from './TripleDataDisplayConfig.vue'

const tripleDataDisplayDefinition: ComponentDefinition = {
  // 基础信息
  type: 'triple-data-display',
  name: '三数据源显示',
  description: '支持三个独立数据源的综合展示组件，可以同时显示三个数据源的数据',
  category: '数据源测试',
  version: '3.0.0',
  author: 'ThingsPanel',

  // 组件实现
  component: TripleDataDisplay,

  // 配置组件
  configComponent: TripleDataDisplayConfig,

  // 默认配置
  defaultConfig: {
    title: '三数据源综合显示',
    dataSources: {
      dataSource1: {
        type: 'static',
        enabled: true,
        config: {
          data: {
            sensor: 'temperature',
            value: 24.5,
            unit: '°C',
            location: 'Server Room A',
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
            location: 'Server Room B',
            lastCheck: new Date().toISOString()
          }
        }
      },
      dataSource3: {
        type: 'static',
        enabled: true,
        config: {
          data: {
            system: 'monitoring',
            status: 'online',
            uptime: '99.9%',
            alerts: 0,
            checkedAt: new Date().toISOString()
          }
        }
      }
    }
  },

  // 默认布局
  defaultLayout: {
    canvas: {
      width: 600,
      height: 400,
      x: 0,
      y: 0
    },
    gridstack: {
      w: 6,
      h: 5,
      x: 0,
      y: 0,
      minW: 4,
      minH: 4,
      maxW: 12,
      maxH: 8
    }
  },

  // 支持的数据源类型
  supportedDataSources: ['static', 'api', 'websocket', 'script'],

  // 🔥 三数据源需求声明 - 与ComponentExecutorManager兼容的格式
  dataSources: {
    dataSource1: {
      type: 'object',
      title: '数据源1',
      description: '第一个数据源 - 传感器数据',
      required: false,

      config: {
        supportedTypes: ['static', 'api', 'websocket', 'script'],
        defaultType: 'static',
        exampleData: {
          sensor: 'temperature',
          value: 25.8,
          unit: '°C',
          status: 'normal',
          location: 'Server Room A',
          timestamp: new Date().toISOString()
        }
      }
    },

    dataSource2: {
      type: 'object',
      title: '数据源2',
      description: '第二个数据源 - 设备监控数据',
      required: false,

      config: {
        supportedTypes: ['static', 'api', 'websocket', 'script'],
        defaultType: 'static',
        exampleData: {
          device: 'humidity_sensor',
          reading: 62,
          unit: '%',
          status: 'active',
          location: 'Server Room B',
          lastCheck: new Date().toISOString()
        }
      }
    },

    dataSource3: {
      type: 'object',
      title: '数据源3',
      description: '第三个数据源 - 系统状态数据',
      required: false,

      config: {
        supportedTypes: ['static', 'api', 'websocket', 'script'],
        defaultType: 'static',
        exampleData: {
          system: 'monitoring',
          status: 'online',
          uptime: '99.9%',
          alerts: 0,
          checkedAt: new Date().toISOString()
        }
      }
    }
  },

  // 🔥 静态参数配置
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
      defaultValue: '三数据源综合显示',
      required: false
    }
  },

  // 数据需求声明 - 向后兼容的格式
  dataRequirements: {
    componentType: 'triple-data-display',
    displayName: '三数据源显示组件',
    description: '需要三个独立的数据源进行综合显示',

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
        description: '第一个数据源 - 传感器数据',
        example: {
          sensor: 'temperature',
          value: 25.8,
          unit: '°C',
          status: 'normal'
        }
      },
      {
        name: 'dataSource2',
        type: 'object',
        required: false,
        description: '第二个数据源 - 设备监控数据',
        example: {
          device: 'humidity_sensor',
          reading: 62,
          unit: '%',
          status: 'active'
        }
      },
      {
        name: 'dataSource3',
        type: 'object',
        required: false,
        description: '第三个数据源 - 系统状态数据',
        example: {
          system: 'monitoring',
          status: 'online',
          uptime: '99.9%',
          alerts: 0
        }
      }
    ]
  },

  // 标签
  tags: ['triple-datasource', 'comprehensive', 'display', 'monitoring', 'multi-source'],

  // 示例数据
  sampleData: {
    dataSource1: {
      sensor: 'temperature',
      value: 25.8,
      unit: '°C',
      location: 'Server Room A',
      lastUpdate: new Date().toISOString()
    },
    dataSource2: {
      device: 'humidity_sensor',
      reading: 62,
      unit: '%',
      location: 'Server Room B',
      lastCheck: new Date().toISOString()
    },
    dataSource3: {
      system: 'monitoring',
      status: 'online',
      uptime: '99.9%',
      alerts: 0,
      checkedAt: new Date().toISOString()
    }
  },

  // 特性标记
  features: {
    realtime: true,
    dataBinding: true,
    themeable: true,
    responsive: true,
    dualDataSource: false, // 不是双数据源
    tripleDataSource: true, // 是三数据源
    configurable: true,
    interactive: true,
    multiSource: true // 多数据源标识
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
      listenableProperties: ['dataSource1', 'dataSource2', 'dataSource3', 'config']
    },

    examples: [
      {
        name: '点击跳转到数据详情',
        description: '点击组件时跳转到数据详情页面',
        scenario: 'click-jump',
        config: {
          event: 'click',
          responses: [
            {
              action: 'jump',
              jumpConfig: {
                jumpType: 'external',
                url: '/data-dashboard',
                target: '_blank'
              }
            }
          ],
          enabled: false,
          priority: 1,
          name: '点击跳转示例'
        }
      },
      {
        name: '数据变化时修改其他组件',
        description: '当任一数据源变化时修改目标组件',
        scenario: 'data-change-modify',
        config: {
          event: 'dataChange',
          watchedProperty: 'dataSource1',
          responses: [
            {
              action: 'modify',
              modifyConfig: {
                targetComponentId: 'target-component-id',
                targetProperty: 'config.title',
                updateValue: '数据已更新',
                updateMode: 'replace'
              }
            }
          ],
          enabled: false,
          priority: 2,
          name: '数据变化修改示例'
        }
      }
    ],

    propertyExposure: {
      componentType: 'triple-data-display',
      componentName: '三数据源显示组件',
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
          name: 'dataSource3',
          label: '数据源3',
          type: 'object',
          description: '第三个数据源的数据',
          group: '数据',
          defaultValue: null
        },
        {
          name: 'config.title',
          label: '组件标题',
          type: 'string',
          description: '组件显示的标题',
          group: '配置',
          defaultValue: '三数据源综合显示'
        },
        {
          name: 'config.layout',
          label: '布局模式',
          type: 'string',
          description: '组件的布局模式',
          group: '配置',
          defaultValue: 'grid'
        }
      ]
    }
  }
}

export default tripleDataDisplayDefinition
