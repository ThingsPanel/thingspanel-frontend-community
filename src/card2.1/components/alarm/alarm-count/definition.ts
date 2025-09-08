/**
 * alarm-count 告警计数组件定义
 * 展示系统告警设备总数的统计信息
 */

import type { ComponentDefinition } from '@/card2.1/core/types'
import AlarmCountComponent from './index.vue'
import { alarmCountSettingConfig } from './settingConfig'
import { componentRegistry } from '@/card2.1/core/component-registry'

/**
 * alarm-count 组件定义
 */
const alarmCountDefinition: ComponentDefinition = {
  // 基础信息
  type: 'alarm-count',
  name: '告警数量统计',
  description: '展示系统当前的告警设备总数，支持自定义渐变背景和动画效果',
  category: '统计类',
  mainCategory: '系统监控',
  subCategory: '告警统计',
  icon: `<svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2L2 7v10c0 5.55 3.84 9.74 9 11 5.16-1.26 9-5.45 9-11V7l-10-5z"/>
    <path d="M10 17l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/>
  </svg>`,
  version: '2.1.0',
  author: 'ThingsPanel',

  // 组件实现
  component: AlarmCountComponent,

  // 默认配置
  config: alarmCountSettingConfig.customConfig,

  // 标签
  tags: ['告警', '统计', '监控', '数值展示'],

  // 权限控制 - 设置为全部权限
  permission: '不限',


  // 注意：此组件不需要数据源配置，数据通过组件内部API获取

  // 交互能力配置
  interactionCapability: {
    // 支持的事件
    events: [
      {
        key: 'click',
        name: '点击事件',
        description: '用户点击告警卡片时触发'
      },
      {
        key: 'hover',
        name: '悬停事件',
        description: '鼠标悬停在卡片上时触发'
      },
      {
        key: 'dataChange',
        name: '数据变化事件',
        description: '告警数量发生变化时触发'
      }
    ],

    // 支持的动作
    actions: [
      {
        key: 'refreshData',
        name: '刷新数据',
        description: '手动刷新告警数据'
      },
      {
        key: 'showDetails',
        name: '显示详情',
        description: '显示告警详细信息'
      }
    ],

    // 可暴露的属性
    listenableProperties: [
      {
        name: 'customize.title',
        label: '组件标题',
        type: 'string',
        description: '告警卡片显示的标题文字',
        group: '内容设置'
      },
      {
        name: 'customize.startColor',
        label: '渐变开始颜色',
        type: 'color',
        description: '背景渐变的起始颜色',
        group: '样式设置'
      },
      {
        name: 'customize.endColor',
        label: '渐变结束颜色',
        type: 'color',
        description: '背景渐变的结束颜色',
        group: '样式设置'
      },
      {
        name: 'alarmCount',
        label: '告警数量',
        type: 'number',
        description: '当前系统告警设备的总数',
        group: '数据',
        isCore: true
      }
    ]
  },

  // 布局配置
  layout: {
    // 默认尺寸 (格)
    defaultSize: {
      width: 3,
      height: 2
    },
    // 最小尺寸
    minSize: {
      width: 2,
      height: 2
    },
    // 最大尺寸
    maxSize: {
      width: 6,
      height: 4
    },
    // 是否可调整大小
    resizable: true
  },

  // 示例配置
  example: {
    customize: {
      title: '告警数量统计',
      unit: '个',
      startColor: '#f97316',
      endColor: '#ef4444',
      icon: '🚨',
      animationDuration: 1500,
      showIcon: true,
      prefix: '',
      suffix: '',
      enableAnimation: true
    }
  }
}

// 注册组件到组件注册中心
componentRegistry.registerComponent(alarmCountDefinition, alarmCountSettingConfig)
export default alarmCountDefinition
