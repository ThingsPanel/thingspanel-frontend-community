import type { ComponentDefinition } from '@/card2.1/types'
import { alertStatusV2SettingConfig, customConfig } from './settingConfig'
import AlertStatusV2 from './index.vue'
import AlertStatusV2Setting from './setting.vue'

export const alertStatusV2Definition: ComponentDefinition = {
  type: 'alert-status-v2',
  name: '⚠️告警状态V2',
  description: '标准4属性告警状态组件，演示正确的单属性绑定机制',
  icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M13,13H11V7H13M12,17.3A1.3,1.3 0 0,1 10.7,16A1.3,1.3 0 0,1 12,14.7A1.3,1.3 0 0,1 13.3,16A1.3,1.3 0 0,1 12,17.3M15.73,3H8.27L3,8.27V15.73L8.27,21H15.73L21,15.73V8.27L15.73,3Z" /></svg>',
  version: '2.0.0',
  author: 'ThingsPanel',
  component: AlertStatusV2,
  configComponent: AlertStatusV2Setting,

  defaultConfig: {
    type: 'alert-status-v2',
    root: { transform: { rotate: 0, scale: 1 } },
    customize: customConfig
  },

  config: {
    type: 'alert-status-v2',
    root: { transform: { rotate: 0, scale: 1 } },
    customize: customConfig
  },

  defaultLayout: {
    gridstack: { w: 4, h: 3, x: 0, y: 0, minW: 3, minH: 2, maxW: 8, maxH: 6 }
  },

  layout: {
    defaultSize: { width: 4, height: 3 },
    minSize: { width: 3, height: 2 },
    maxSize: { width: 8, height: 6 },
    resizable: true
  },

  permission: '不限',
  tags: ['告警', '状态', '监控', '4属性', '演示'],

  features: {
    realtime: true,
    dataBinding: true,
    configurable: true
  },

  // 数据源配置
  dataSources: [
    {
      key: 'title',
      name: '标题',
      description: '告警标题',
      supportedTypes: ['static', 'api', 'websocket'],
      example: "告警状态",
      required: false
    },
    {
      key: 'amount',
      name: '金额',
      description: '相关金额数据',
      supportedTypes: ['static', 'api', 'websocket'],
      example: 0,
      required: false
    },
    {
      key: 'status',
      name: '状态',
      description: '当前状态',
      supportedTypes: ['static', 'api', 'websocket'],
      example: "正常",
      required: false
    },
    {
      key: 'description',
      name: '描述',
      description: '详细描述信息',
      supportedTypes: ['static', 'api', 'websocket'],
      example: "系统运行正常",
      required: false
    }
  ],

  settingConfig: alertStatusV2SettingConfig,

  // 🔥 关键：交互能力声明 - 标准4属性配置
  interactionCapabilities: {
    // 支持的交互事件类型
    supportedEvents: ['click', 'hover', 'dataChange'],

    // 可触发的交互动作类型
    availableActions: [
      'jump', 'modify', 'navigateToUrl', 'updateComponentData',
      'changeVisibility', 'changeBackgroundColor', 'triggerAnimation'
    ],

    // 🔥 可被监听的属性（4个标准属性）
    watchableProperties: {
      'title': {
        label: '标题',
        type: 'string',
        description: '组件标题，可以监听变化',
        defaultValue: '告警状态'
      },
      'amount': {
        label: '金额',
        type: 'number',
        description: '金额数值，可以监听变化',
        defaultValue: 0
      },
      'status': {
        label: '状态',
        type: 'string',
        description: '组件状态，可以监听变化',
        defaultValue: '正常'
      },
      'description': {
        label: '描述',
        type: 'string',
        description: '组件描述，可以监听变化',
        defaultValue: '系统运行正常'
      }
    },

    // 🔥 可被修改的属性（4个标准属性）
    modifiableProperties: {
      'title': {
        label: '标题',
        type: 'string',
        description: '可以通过交互修改标题'
      },
      'amount': {
        label: '金额',
        type: 'number',
        description: '可以通过交互修改金额'
      },
      'status': {
        label: '状态',
        type: 'string',
        description: '可以通过交互修改状态'
      },
      'description': {
        label: '描述',
        type: 'string',
        description: '可以通过交互修改描述'
      }
    }
  }
}

export default alertStatusV2Definition