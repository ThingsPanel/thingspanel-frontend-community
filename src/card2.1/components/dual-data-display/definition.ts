/**
 * 双数据源显示组件定义
 * 专门用于测试新数据源架构，支持两个独立的数据源
 */

import type { ComponentDefinition } from '@/card2.1/core/types'
import DualDataDisplay from './DualDataDisplay.vue'

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

  // 🔥 数据源需求声明 - 与ComponentExecutorManager兼容的格式
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
    dualDataSource: true
  }
}

export default dualDataDisplayDefinition
