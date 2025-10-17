/**
 * 柱状图组件定义
 */
import BarChart from './index.vue'
import BarChartSetting from './setting.vue'
import type { ComponentDefinition } from '@/card2.1/core2'
import type { BarChartCustomize } from './settingConfig'

const barChartDefinition: ComponentDefinition = {
  type: 'bar-chart',
  name: '柱状图',
  description: 'ECharts柱状图，用于展示分类数据的比较',
  icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M22,21H2V3H4V19H6V10H10V19H12V6H16V19H18V14H22V21Z"/></svg>',
  version: '1.0.0',
  author: 'ThingsPanel',
  component: BarChart,
  configComponent: BarChartSetting,

  // 默认配置
  defaultConfig: {
    type: 'bar-chart',
    root: {
      transform: { rotate: 0, scale: 1 }
    },
    customize: {
      title: '数据对比',
      showLegend: true,
      barWidth: '60%',
      showLabel: false,
      xAxisLabel: '类别',
      yAxisLabel: '数值',
      showGrid: true,
      barColor: '#5470c6',
      barGradient: true,
      barGradientColor: '#91cc75',
      animationDuration: 1000,
      animationDelay: 50
    }
  },

  config: {
    type: 'bar-chart',
    root: {
      transform: { rotate: 0, scale: 1 }
    },
    customize: {
      title: '数据对比',
      showLegend: true,
      barWidth: '60%',
      showLabel: false,
      xAxisLabel: '类别',
      yAxisLabel: '数值',
      showGrid: true,
      barColor: '#5470c6',
      barGradient: true,
      barGradientColor: '#91cc75',
      animationDuration: 1000,
      animationDelay: 50
    }
  },

  // 布局配置
  defaultLayout: {
    gridstack: {
      w: 4,
      h: 3,
      x: 0,
      y: 0,
      minW: 3,
      minH: 2,
      maxW: 8,
      maxH: 6
    }
  },

  layout: {
    defaultSize: { width: 4, height: 3 },
    minSize: { width: 3, height: 2 },
    maxSize: { width: 8, height: 6 },
    resizable: true
  },

  // 权限控制
  permission: '不限',

  // 分类信息
  tags: ['图表', '柱状图', 'ECharts', '对比'],

  // 功能特性
  features: {
    realtime: true,
    dataBinding: true,
    configurable: true
  },

  // 数据源定义
  dataSources: [
    {
      key: 'main',
      name: '数据源',
      description: '柱状图的分类数据',
      supportedTypes: ['static', 'api', 'websocket'],
      required: false,
      example: {
        xData: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
        yData: [120, 200, 150, 80, 70, 110, 130],
        timestamp: '2025-10-15T10:30:00.000Z'
      }
    }
  ],

  // 交互能力
  interactionCapabilities: {
    supportedEvents: ['click', 'dataChange'],
    availableActions: ['navigateToUrl', 'updateComponentData', 'showNotification'],
    watchableProperties: {},
    defaultInteractions: []
  }
}

export default barChartDefinition
