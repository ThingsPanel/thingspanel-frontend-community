import type { ComponentDefinition } from '@/card2.1/types'
import { customConfig, alertStatusSettingConfig } from './settingConfig'
import AlertStatus from './index.vue'
import AlertStatusSetting from './setting.vue'
import { createPropertyWhitelist } from '@/card2.1/core2/property'
export const alertStatusDefinition: ComponentDefinition = { type: 'alert-status', name: '⚠️告警状态', description: '显示系统告警和状态信息', icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M13,13H11V7H13M12,17.3A1.3,1.3 0 0,1 10.7,16A1.3,1.3 0 0,1 12,14.7A1.3,1.3 0 0,1 13.3,16A1.3,1.3 0 0,1 12,17.3M15.73,3H8.27L3,8.27V15.73L8.27,21H15.73L21,15.73V8.27L15.73,3Z" /></svg>', version: '1.0.0', author: 'ThingsPanel', component: AlertStatus, configComponent: AlertStatusSetting, defaultConfig: { type: 'alert-status', root: { transform: { rotate: 0, scale: 1 } }, customize: customConfig }, config: { type: 'alert-status', root: { transform: { rotate: 0, scale: 1 } }, customize: customConfig }, defaultLayout: { gridstack: { w: 3, h: 2, x: 0, y: 0, minW: 2, minH: 2, maxW: 6, maxH: 4 } }, layout: { defaultSize: { width: 3, height: 2 }, minSize: { width: 2, height: 2 }, maxSize: { width: 6, height: 4 }, resizable: true }, permission: '不限', tags: ['告警', '状态', '监控'], features: { realtime: true, dataBinding: true, configurable: true }, dataSources: [
    { key: 'title', name: '标题', description: '告警标题', supportedTypes: ['static', 'api', 'websocket'], example: "高温告警", required: false },
    { key: 'amount', name: '金额', description: '相关金额数据', supportedTypes: ['static', 'api', 'websocket'], example: 1000, required: false },
    { key: 'description', name: '描述', description: '告警描述信息', supportedTypes: ['static', 'api', 'websocket'], example: "系统运行正常", required: false }
  ], settingConfig: alertStatusSettingConfig,

  // 🎯 交互能力声明
  interactionCapabilities: {
    // 支持的交互事件类型
    supportedEvents: ['click', 'hover', 'focus', 'blur', 'dataChange'],
    
    // 可触发的交互动作类型
    availableActions: [
      'navigateToUrl', 'updateComponentData', 'changeVisibility', 
      'changeBackgroundColor', 'changeBorderColor', 'triggerAnimation',
      'showNotification', 'emitEvent', 'flashColor', 'pulseEffect'
    ],
    
    // 可被其他组件监听的属性列表
    watchableProperties: {
      'title': {
        type: 'string',
        description: '告警标题',
        defaultValue: '高温告警'
      },
      'amount': {
        type: 'number',
        description: '相关金额数据',
        defaultValue: 1000
      },
      'description': {
        type: 'string',
        description: '告警描述信息',
        defaultValue: '系统运行正常'
      },
      'alertLevel': {
        type: 'string',
        description: '告警级别',
        defaultValue: 'normal'
      }
    },

    // 默认交互配置
    defaultInteractions: [
      {
        event: 'dataChange',
        responses: [
          {
            action: 'flashColor',
            delay: 0,
            name: '告警闪烁效果',
            enabled: true
          },
          {
            action: 'showNotification',
            delay: 500,
            name: '告警通知',
            enabled: true
          }
        ],
        enabled: true,
        name: '告警状态变化',
        watchedProperty: 'alertLevel'
      },
      {
        event: 'click',
        responses: [
          {
            action: 'navigateToUrl',
            delay: 0,
            name: '跳转告警详情',
            enabled: true
          }
        ],
        enabled: true,
        name: '查看告警详情'
      }
    ]
  },

  // 🔒 属性暴露白名单配置
  propertyWhitelist: createPropertyWhitelist({
    // 🔒 核心业务属性 - 可在交互中使用
    title: {
      level: 'public',
      type: 'string',
      description: '告警标题',
      defaultValue: '高温告警',
      visibleInInteraction: true,
      visibleInDebug: true
    },
    amount: {
      level: 'public',
      type: 'number',
      description: '相关金额数据',
      defaultValue: 1000,
      visibleInInteraction: true,
      visibleInDebug: true
    },
    description: {
      level: 'public',
      type: 'string',
      description: '告警描述信息',
      defaultValue: '系统运行正常',
      visibleInInteraction: true,
      visibleInDebug: true
    },

    // 🔒 计算属性 - 只读，供交互系统使用
    alertLevel: {
      level: 'public',
      type: 'string',
      description: '告警级别',
      defaultValue: 'normal',
      readonly: true,
      visibleInInteraction: true,
      visibleInDebug: true
    },

    // 🔒 状态属性 - 只读
    lastUpdated: {
      level: 'public',
      type: 'string',
      description: '最后更新时间',
      readonly: true,
      visibleInInteraction: false,
      visibleInDebug: true
    },

    // 🔒 基础UI属性 - 受保护级别
    visible: {
      level: 'protected',
      type: 'boolean',
      description: '组件可见性',
      defaultValue: true,
      visibleInInteraction: true,
      visibleInDebug: true
    }
  }, {
    enabled: true,
    defaultLevel: 'public',
    audit: {
      logAccess: process.env.NODE_ENV === 'development',
      logModification: true
    }
  }) }
export default alertStatusDefinition