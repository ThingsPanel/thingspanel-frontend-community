/**
 * 简单数据图表组件配置
 */

import type { SettingConfig } from '@/card2.1/types/setting-config'

/**
 * 简单数据图表自定义配置接口
 */
export interface SimpleChartCustomize {
  // 显示控制
  showTitle: boolean
  showLegend: boolean
  
  // 内容配置
  title: string
  seriesName: string
  
  // 图表配置
  chartType: 'line' | 'bar'
  chartHeight: number
  chartColor: string
  smoothLine: boolean
  fontSize: number
  
  // 样式配置
  backgroundColor: string
  borderColor: string
  borderRadius: number
}

/**
 * 简单数据图表完整配置接口
 */
export interface SimpleChartConfig {
  type: 'simple-chart'
  root: {
    transform: {
      rotate: number
      scale: number
    }
  }
  customize: SimpleChartCustomize
}

/**
 * 默认自定义配置
 */
export const customConfig: SimpleChartCustomize = {
  // 显示控制
  showTitle: true,
  showLegend: true,
  
  // 内容配置
  title: '数据图表',
  seriesName: '数据系列',
  
  // 图表配置
  chartType: 'line',
  chartHeight: 200,
  chartColor: 'var(--primary-color)',
  smoothLine: true,
  fontSize: 12,
  
  // 样式配置
  backgroundColor: 'transparent',
  borderColor: 'var(--border-color)',
  borderRadius: 8
}

/**
 * 简单数据图表设置配置
 */
export const simpleChartSettingConfig: SettingConfig<SimpleChartCustomize> = [
  {
    group: '显示设置',
    items: [
      {
        key: 'showTitle',
        label: '显示标题',
        type: 'switch',
        defaultValue: true
      },
      {
        key: 'showLegend',
        label: '显示图例',
        type: 'switch',
        defaultValue: true
      }
    ]
  },
  {
    group: '内容配置',
    items: [
      {
        key: 'title',
        label: '标题',
        type: 'input',
        defaultValue: '数据图表',
        placeholder: '请输入图表标题'
      },
      {
        key: 'seriesName',
        label: '系列名称',
        type: 'input',
        defaultValue: '数据系列',
        placeholder: '请输入数据系列名称'
      }
    ]
  },
  {
    group: '图表配置',
    items: [
      {
        key: 'chartType',
        label: '图表类型',
        type: 'select',
        defaultValue: 'line',
        options: [
          { label: '线图', value: 'line' },
          { label: '柱图', value: 'bar' }
        ]
      },
      {
        key: 'chartHeight',
        label: '图表高度',
        type: 'number',
        defaultValue: 200,
        min: 150,
        max: 400
      },
      {
        key: 'chartColor',
        label: '图表颜色',
        type: 'color',
        defaultValue: 'var(--primary-color)'
      },
      {
        key: 'smoothLine',
        label: '平滑线条',
        type: 'switch',
        defaultValue: true
      },
      {
        key: 'fontSize',
        label: '字体大小',
        type: 'number',
        defaultValue: 12,
        min: 10,
        max: 18
      }
    ]
  },
  {
    group: '样式配置',
    items: [
      {
        key: 'backgroundColor',
        label: '背景颜色',
        type: 'color',
        defaultValue: 'transparent'
      },
      {
        key: 'borderColor',
        label: '边框颜色',
        type: 'color',
        defaultValue: 'var(--border-color)'
      },
      {
        key: 'borderRadius',
        label: '圆角',
        type: 'number',
        defaultValue: 8,
        min: 0,
        max: 20
      }
    ]
  }
]