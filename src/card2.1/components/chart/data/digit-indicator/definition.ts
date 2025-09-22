import type { ComponentDefinition } from '@/card2.1/core/types';
import component from './component.vue';

/**
 * @description 数字指示器组件定义
 * @summary 显示单个数值指标，带图标、数值、单位和标题，支持实时数据更新
 */
export default {
  type: 'digit-indicator',
  name: 'widget-library.components.digitIndicator',
  description: '显示单个数值指标，支持设备遥测数据和属性数据，具备实时更新能力',
  icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>',
  component,
  version: '2.1.0',
  tags: ['数字', '指示器', '实时', '遥测', '数据'],
  dataDriven: true,
  supportedDataSources: ['api', 'websocket', 'device'],
  permission: '不限',

  // 数据源需求声明
  dataSources: [
    {
      key: 'primaryData',
      name: '主数据源',
      description: '设备遥测数据或属性数据',
      supportedTypes: ['api', 'websocket', 'device'],
      required: true,
      example: {
        value: 45.6,
        unit: '%',
        timestamp: '2024-01-01T12:00:00Z'
      }
    }
  ],

  // 静态参数配置
  staticParams: [
    {
      key: 'iconName',
      name: '图标名称',
      type: 'string',
      description: '显示的图标名称',
      defaultValue: 'Water',
      required: false,
      group: '显示设置'
    },
    {
      key: 'iconColor',
      name: '图标颜色',
      type: 'color',
      description: '图标的显示颜色',
      defaultValue: '#1890ff',
      required: false,
      group: '显示设置'
    },
    {
      key: 'unit',
      name: '单位覆盖',
      type: 'string',
      description: '覆盖数据源中的单位显示',
      defaultValue: '',
      required: false,
      group: '数据设置'
    },
    {
      key: 'title',
      name: '标题',
      type: 'string',
      description: '组件显示标题',
      defaultValue: '',
      required: false,
      group: '显示设置'
    },
    {
      key: 'decimalPlaces',
      name: '小数位数',
      type: 'number',
      description: '数值显示的小数位数',
      defaultValue: 1,
      required: false,
      group: '数据设置'
    },
    {
      key: 'showTitle',
      name: '显示标题',
      type: 'boolean',
      description: '是否显示组件标题',
      defaultValue: true,
      required: false,
      group: '显示设置'
    },
    {
      key: 'autoResize',
      name: '自动调整字体',
      type: 'boolean',
      description: '根据容器大小自动调整字体大小',
      defaultValue: true,
      required: false,
      group: '显示设置'
    }
  ],

  // 交互能力
  interactionCapabilities: {
    canTrigger: ['click', 'hover'],
    canReceive: ['data-update', 'config-change'],
    exposedProperties: ['value', 'unit', 'title']
  },

  // 属性白名单
  propertyWhitelist: {
    enabled: true,
    properties: {
      'value': {
        level: 'public',
        description: '当前数值',
        type: 'number',
        visibleInInteraction: true
      },
      'unit': {
        level: 'public',
        description: '单位',
        type: 'string',
        visibleInInteraction: true
      },
      'title': {
        level: 'public',
        description: '标题',
        type: 'string',
        visibleInInteraction: true
      },
      'iconColor': {
        level: 'protected',
        description: '图标颜色',
        type: 'string',
        visibleInDebug: true
      }
    }
  }
} as ComponentDefinition;