/**
 * 开关控制器组件定义
 */

import type { ComponentDefinition } from '@/card2.1/types'
import type { SwitchControllerConfig } from './settingConfig'
import { customConfig, switchControllerSettingConfig } from './settingConfig'
import SwitchController from './index.vue'
import SwitchControllerSetting from './setting.vue'

/**
 * 开关控制器组件定义
 */
export const switchControllerDefinition: ComponentDefinition<SwitchControllerConfig> = {
  // 基础信息
  type: 'switch-controller',
  name: '🎮开关控制',
  description: '用于控制设备开关状态的控制组件',
  icon: `<svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M14,2A8,8 0 0,1 22,10A8,8 0 0,1 14,18H10V16H14A6,6 0 0,0 20,10A6,6 0 0,0 14,4H10A6,6 0 0,0 4,10A6,6 0 0,0 10,16H12V18H10A8,8 0 0,1 2,10A8,8 0 0,1 10,2H14M7.5,9A1.5,1.5 0 0,1 9,10.5A1.5,1.5 0 0,1 7.5,12A1.5,1.5 0 0,1 6,10.5A1.5,1.5 0 0,1 7.5,9Z"/>
  </svg>`,
  version: '1.0.0',
  author: 'ThingsPanel',

  // 组件实现
  component: SwitchController,
  configComponent: SwitchControllerSetting,

  // 默认配置
  defaultConfig: customConfig,

  // 组件配置
  config: {
    type: 'switch-controller',
    root: {
      transform: {
        rotate: 0,
        scale: 1
      }
    },
    customize: customConfig
  },

  // 默认布局
  defaultLayout: {
    canvas: {
      width: 200,
      height: 180,
      x: 0,
      y: 0
    },
    gridstack: {
      w: 2,
      h: 3,
      x: 0,
      y: 0,
      minW: 2,
      minH: 2,
      maxW: 4,
      maxH: 4
    }
  },

  // 布局配置
  layout: {
    defaultSize: {
      width: 2,
      height: 3
    },
    minSize: {
      width: 2,
      height: 2
    },
    maxSize: {
      width: 4,
      height: 4
    },
    resizable: true
  },

  // 权限配置
  permission: '不限',

  // 标签
  tags: ['控制', '开关', '设备控制', '交互', 'IoT'],

  // 特性标记
  features: {
    realtime: true,
    dataBinding: true,
    themeable: true,
    responsive: true,
    configurable: true
  },

  // 数据源需求定义
  dataSources: [
    {
      key: 'controlData',
      name: '控制数据',
      description: '设备开关状态数据源',
      supportedTypes: ['static', 'api', 'websocket'],
      example: {
        "title": "LED灯控制",
        "value": false,
        "description": "控制LED灯的开关",
        "timestamp": 1694567890123
      },
      fieldMappings: {
        'title': {
          targetField: 'title',
          type: 'value',
          required: false,
          defaultValue: '设备开关'
        },
        'value': {
          targetField: 'value',
          type: 'value',
          required: true,
          defaultValue: false,
          validator: {
            type: 'boolean'
          }
        },
        'description': {
          targetField: 'description',
          type: 'value',
          required: false,
          defaultValue: ''
        },
        'timestamp': {
          targetField: 'timestamp',
          type: 'value',
          required: false,
          defaultValue: null
        }
      },
      required: true,
      updateInterval: 3000,
      errorHandling: {
        onError: 'showLastValue',
        retryCount: 3,
        retryInterval: 5000
      }
    }
  ],

  // 设置配置
  settingConfig: switchControllerSettingConfig,

  // 交互配置
  interactions: [
    {
      event: 'control',
      name: '控制事件',
      description: '当用户操作开关时触发',
      parameters: {
        action: 'toggle',
        value: 'boolean'
      }
    },
    {
      event: 'dataChange',
      name: '数据变化',
      description: '当开关状态改变时触发数据更新',
      parameters: {
        value: 'boolean',
        timestamp: 'number'
      }
    }
  ]
}

export default switchControllerDefinition