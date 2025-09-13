/**
 * 简单数据图表组件定义
 */

import type { ComponentDefinition } from '@/card2.1/types'
import type { SimpleChartConfig } from './settingConfig'
import { customConfig, simpleChartSettingConfig } from './settingConfig'
import SimpleChart from './index.vue'
import SimpleChartSetting from './setting.vue'

/**
 * 简单数据图表组件定义
 */
export const simpleChartDefinition: ComponentDefinition<SimpleChartConfig> = {
  // 基础信息
  type: 'simple-chart',
  name: '📊数据图表',
  description: '简单的数据可视化图表，支持线图和柱图',
  icon: `<svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M3 3V21H21V19H5V3H3M7 17H9V10H7V17M11 17H13V7H11V17M15 17H17V13H15V17Z"/>
  </svg>`,
  version: '1.0.0',
  author: 'ThingsPanel',

  // 组件实现
  component: SimpleChart,
  configComponent: SimpleChartSetting,

  // 默认配置
  defaultConfig: customConfig,

  // 组件配置
  config: {
    type: 'simple-chart',
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
      width: 400,
      height: 280,
      x: 0,
      y: 0
    },
    gridstack: {
      w: 5,
      h: 4,
      x: 0,
      y: 0,
      minW: 4,
      minH: 3,
      maxW: 12,
      maxH: 8
    }
  },

  // 布局配置
  layout: {
    defaultSize: {
      width: 5,
      height: 4
    },
    minSize: {
      width: 4,
      height: 3
    },
    maxSize: {
      width: 12,
      height: 8
    },
    resizable: true
  },

  // 权限配置
  permission: '不限',

  // 标签
  tags: ['数据', '图表', '可视化', 'ECharts', '线图', '柱图'],

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
      key: 'chartData',
      name: '图表数据',
      description: '图表显示的数据源',
      supportedTypes: ['static', 'api', 'websocket'],
      example: {
        "title": "温度变化趋势",
        "series": [23, 25, 27, 24, 26, 28, 30, 29],
        "labels": ["8:00", "9:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00"]
      },
      fieldMappings: {
        'title': {
          targetField: 'title',
          type: 'value',
          required: false,
          defaultValue: '数据图表'
        },
        'series': {
          targetField: 'series',
          type: 'array',
          required: true,
          defaultValue: [],
          validator: {
            type: 'array',
            itemType: 'number'
          }
        },
        'labels': {
          targetField: 'labels',
          type: 'array',
          required: false,
          defaultValue: []
        }
      },
      required: true,
      updateInterval: 10000,
      errorHandling: {
        onError: 'showEmpty',
        retryCount: 3,
        retryInterval: 5000
      }
    }
  ],

  // 设置配置
  settingConfig: simpleChartSettingConfig
}

export default simpleChartDefinition