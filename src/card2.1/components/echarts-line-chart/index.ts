/**
 * ECharts曲线图组件定义
 * 验证V6数据绑定系统的通用性
 */

import EChartsLineChartWidget from './EChartsLineChartWidget.vue'
import type { ComponentDefinition } from '../../core/types'

export const EChartsLineChart: ComponentDefinition = {
  type: 'echarts-line-chart',
  name: 'ECharts曲线图',
  description: '基于ECharts的曲线图组件，支持多系列数据展示和自定义配置',
  category: '图表组件',
  subCategory: '曲线图表',
  mainCategory: '可视化',
  icon: 'analytics-outline',
  component: EChartsLineChartWidget,
  version: '1.0.0',
  author: 'ThingsPanel Team',
  tags: ['图表', 'ECharts', '曲线图', 'V6验证'],

  // 默认配置
  config: {
    style: {
      width: 500,
      height: 300
    }
  },

  // ===== V6标准化定义 =====
  // 静态参数定义
  staticParams: [
    {
      key: 'title',
      label: '图表标题',
      type: 'text',
      defaultValue: 'ECharts曲线图',
      description: '图表顶部显示的标题',
      placeholder: '请输入图表标题'
    },
    {
      key: 'showLegend',
      label: '显示图例',
      type: 'switch',
      defaultValue: true,
      description: '是否显示图例'
    },
    {
      key: 'showGrid',
      label: '显示网格',
      type: 'switch',
      defaultValue: true,
      description: '是否显示背景网格'
    },
    {
      key: 'smoothCurve',
      label: '平滑曲线',
      type: 'switch',
      defaultValue: true,
      description: '是否使用平滑曲线'
    },
    {
      key: 'lineColor',
      label: '线条颜色',
      type: 'color',
      defaultValue: '#5470c6',
      description: '主要曲线的颜色'
    },
    {
      key: 'xAxisLabel',
      label: 'X轴标签',
      type: 'text',
      defaultValue: '时间',
      description: 'X轴的标签文字',
      placeholder: '如：时间、日期等'
    },
    {
      key: 'yAxisLabel',
      label: 'Y轴标签',
      type: 'text',
      defaultValue: '数值',
      description: 'Y轴的标签文字',
      placeholder: '如：温度、湿度、数量等'
    }
  ],

  // 数据源需求定义（V6标准）
  dataSources: [
    {
      key: 'chartData',
      label: '图表数据源',
      description: '提供曲线图展示的数据，支持单系列或多系列',
      fieldsToMap: [
        {
          key: 'dataPath',
          label: '数据路径',
          targetProperty: 'chartData',
          description: '指向图表数据的JSON路径，数据应为数组格式',
          placeholder: '如: $.data 或 $'
        },
        {
          key: 'xAxisPath',
          label: 'X轴数据路径',
          targetProperty: 'xAxisData',
          description: 'X轴标签数据的JSON路径',
          placeholder: '如: $.categories 或 $.xAxis',
          required: false
        },
        {
          key: 'seriesPath',
          label: '系列数据路径',
          targetProperty: 'seriesData',
          description: '多系列数据的JSON路径',
          placeholder: '如: $.series',
          required: false
        }
      ]
    }
  ],

  // 传统属性定义（向后兼容）
  properties: {
    title: {
      type: 'string',
      default: 'ECharts曲线图',
      label: '图表标题',
      description: '图表顶部显示的标题'
    },
    showLegend: {
      type: 'boolean',
      default: true,
      label: '显示图例',
      description: '是否显示图例'
    },
    showGrid: {
      type: 'boolean',
      default: true,
      label: '显示网格',
      description: '是否显示背景网格'
    },
    smoothCurve: {
      type: 'boolean',
      default: true,
      label: '平滑曲线',
      description: '是否使用平滑曲线'
    },
    lineColor: {
      type: 'string',
      default: '#5470c6',
      label: '线条颜色',
      description: '主要曲线的颜色'
    },
    xAxisLabel: {
      type: 'string',
      default: '时间',
      label: 'X轴标签',
      description: 'X轴的标签文字'
    },
    yAxisLabel: {
      type: 'string',
      default: '数值',
      label: 'Y轴标签',
      description: 'Y轴的标签文字'
    }
  },

  // 示例配置
  examples: [
    {
      name: '基础曲线图',
      description: '显示单条数据曲线',
      config: {
        title: '温度变化趋势',
        xAxisLabel: '时间',
        yAxisLabel: '温度(°C)',
        smoothCurve: true,
        showGrid: true
      }
    },
    {
      name: '多系列曲线图',
      description: '显示多条数据曲线对比',
      config: {
        title: '温湿度对比',
        showLegend: true,
        smoothCurve: false,
        showGrid: true
      }
    }
  ],

  // 文档信息
  documentation: {
    description:
      'ECharts曲线图组件用于展示数据的时间序列变化趋势，支持单系列和多系列数据展示。通过V6数据绑定系统，可以灵活配置数据源和映射关系。',
    usage: '该组件适用于展示传感器数据、业务指标变化、统计数据趋势等场景。支持自定义颜色、标签和图表样式。',
    dataFormat: {
      expected: '数组格式，支持多种数据结构',
      examples: [
        {
          name: '简单数据格式',
          data: [
            { x: '2024-01-01', y: 23.5 },
            { x: '2024-01-02', y: 25.2 },
            { x: '2024-01-03', y: 22.8 }
          ]
        },
        {
          name: '多系列数据格式',
          data: {
            categories: ['1月', '2月', '3月', '4月', '5月'],
            series: [
              { name: '温度', data: [20, 22, 25, 28, 30] },
              { name: '湿度', data: [65, 68, 70, 72, 75] }
            ]
          }
        }
      ]
    }
  }
}

// 默认导出组件定义
export default EChartsLineChart
