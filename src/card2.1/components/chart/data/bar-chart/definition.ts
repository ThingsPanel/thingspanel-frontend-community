/**
 * 柱状图组件定义
 */
import type { ComponentDefinition } from '@/card2.1/core2'
import type { BarChartCustomize } from './settingConfig'

export const barChartDefinition: ComponentDefinition = {
  id: 'bar-chart',
  name: '柱状图',
  description: 'ECharts柱状图，用于展示分类数据的比较',
  category: 'chart',
  subCategory: 'data',
  version: '1.0.0',
  author: 'ThingsPanel',

  // 组件配置接口
  component: {} as BarChartCustomize,

  // 默认配置
  defaultConfig: {
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
  },

  // 数据源定义 - 支持分类数据
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
    canTrigger: false,
    canReceive: false,
    exposedProperties: []
  },

  // 组件标签
  tags: ['图表', '柱状图', 'ECharts', '对比'],

  // 预览配置
  preview: {
    width: 400,
    height: 300
  }
}
