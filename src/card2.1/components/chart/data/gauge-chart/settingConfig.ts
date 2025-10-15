/**
 * 仪表盘图表配置定义
 * 用于定义仪表盘组件的可配置属性
 */

import type { TSConfig } from '@/card2.1/types/setting-config'

/**
 * 仪表盘组件自定义配置接口
 */
export interface GaugeChartCustomize {
  // 数据配置
  value?: number          // 当前值
  min?: number           // 最小值
  max?: number           // 最大值
  unit?: string          // 单位

  // 样式配置
  title?: string         // 标题
  titleColor?: string    // 标题颜色
  valueColor?: string    // 数值颜色

  // 仪表盘颜色配置
  gaugeColor?: string[]  // 仪表盘颜色渐变数组

  // 尺寸配置
  radius?: string        // 仪表盘半径
  thickness?: number     // 仪表盘厚度

  // 动画配置
  animationDuration?: number  // 动画持续时间（毫秒）
}

/**
 * 默认配置
 */
export const customConfig: GaugeChartCustomize = {
  value: 75,
  min: 0,
  max: 100,
  unit: '%',
  title: '数据指标',
  titleColor: '#333333',
  valueColor: '#1890ff',
  gaugeColor: ['#5470c6', '#91cc75', '#fac858', '#ee6666'],
  radius: '75%',
  thickness: 10,
  animationDuration: 1000
}

/**
 * 仪表盘配置表单定义
 */
export const gaugeChartSettingConfig: TSConfig = {
  groups: [
    {
      id: 'data',
      name: '数据配置',
      icon: 'i-carbon-data-1',
      fields: [
        {
          id: 'value',
          name: '当前值',
          type: 'number',
          defaultValue: 75,
          required: false,
          description: '仪表盘显示的当前数值'
        },
        {
          id: 'min',
          name: '最小值',
          type: 'number',
          defaultValue: 0,
          required: false,
          description: '仪表盘的最小刻度值'
        },
        {
          id: 'max',
          name: '最大值',
          type: 'number',
          defaultValue: 100,
          required: false,
          description: '仪表盘的最大刻度值'
        },
        {
          id: 'unit',
          name: '单位',
          type: 'string',
          defaultValue: '%',
          required: false,
          description: '数值单位'
        }
      ]
    },
    {
      id: 'style',
      name: '样式配置',
      icon: 'i-carbon-paint-brush',
      fields: [
        {
          id: 'title',
          name: '标题',
          type: 'string',
          defaultValue: '数据指标',
          required: false,
          description: '仪表盘标题'
        },
        {
          id: 'titleColor',
          name: '标题颜色',
          type: 'color',
          defaultValue: '#333333',
          required: false,
          description: '标题文字颜色'
        },
        {
          id: 'valueColor',
          name: '数值颜色',
          type: 'color',
          defaultValue: '#1890ff',
          required: false,
          description: '中心数值颜色'
        },
        {
          id: 'radius',
          name: '仪表盘大小',
          type: 'string',
          defaultValue: '75%',
          required: false,
          description: '仪表盘半径大小（支持百分比）'
        },
        {
          id: 'thickness',
          name: '仪表盘厚度',
          type: 'number',
          defaultValue: 10,
          required: false,
          description: '仪表盘指针厚度'
        }
      ]
    },
    {
      id: 'animation',
      name: '动画配置',
      icon: 'i-carbon-play',
      fields: [
        {
          id: 'animationDuration',
          name: '动画时长',
          type: 'number',
          defaultValue: 1000,
          required: false,
          description: '数值变化动画持续时间（毫秒）'
        }
      ]
    }
  ]
}
