/**
 * gauge-dashboard-v2 仪表盘组件设置配置
 * 重新设计的配置系统，确保类型安全
 */

import type { Setting, CustomConfig } from '@/card2.1/types/setting-config'
import { createSetting, createCustomConfig, SettingControlType } from '@/card2.1/types/setting-config'

/**
 * 仪表盘显示模式
 */
export type GaugeDisplayMode = 'arc' | 'semi-circle' | 'full-circle' | 'linear'

/**
 * 仪表盘类型
 */
export type GaugeType = 'normal' | 'speedometer' | 'temperature' | 'progress' | 'battery'

/**
 * 刻度配置
 */
export interface GaugeTickConfig {
  /** 是否显示刻度 */
  show: boolean
  /** 主刻度数量 */
  majorCount: number
  /** 次刻度数量 */
  minorCount: number
  /** 刻度颜色 */
  color: string
}

/**
 * 指针配置
 */
export interface GaugePointerConfig {
  /** 指针颜色 */
  color: string
  /** 指针宽度 */
  width: number
  /** 指针长度比例 (0-1) */
  lengthRatio: number
  /** 指针样式 */
  style: 'arrow' | 'line' | 'triangle'
}

/**
 * 仪表盘颜色区间
 */
export interface GaugeColorRange {
  /** 范围起始值 */
  from: number
  /** 范围结束值 */
  to: number
  /** 颜色值 */
  color: string
  /** 区间标签 */
  label?: string
}

/**
 * gauge-dashboard-v2 组件特有的 customize 类型
 */
export interface GaugeDashboardCustomize {
  /** 组件标题 */
  title: string
  /** 显示模式 */
  displayMode: GaugeDisplayMode
  /** 仪表盘类型 */
  gaugeType: GaugeType
  
  // 数值设置
  /** 最小值 */
  minValue: number
  /** 最大值 */
  maxValue: number
  /** 当前值 */
  currentValue: number
  /** 数值单位 */
  unit: string
  /** 小数位数 */
  decimal: number
  
  // 外观设置
  /** 仪表盘半径 */
  radius: number
  /** 起始角度 */
  startAngle: number
  /** 结束角度 */
  endAngle: number
  /** 背景颜色 */
  backgroundColor: string
  /** 边框颜色 */
  borderColor: string
  /** 边框宽度 */
  borderWidth: number
  
  // 刻度配置
  /** 刻度配置 */
  tickConfig: GaugeTickConfig
  
  // 指针配置
  /** 指针配置 */
  pointerConfig: GaugePointerConfig
  
  // 颜色区间
  /** 颜色区间配置 */
  colorRanges: GaugeColorRange[]
  
  // 文字显示
  /** 是否显示数值 */
  showValue: boolean
  /** 是否显示单位 */
  showUnit: boolean
  /** 是否显示标题 */
  showTitle: boolean
  /** 数值字体大小 */
  valueFontSize: number
  /** 标题字体大小 */
  titleFontSize: number
  
  // 动画设置
  /** 是否启用动画 */
  enableAnimation: boolean
  /** 动画持续时间(ms) */
  animationDuration: number
  /** 动画类型 */
  animationType: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'bounce'
  
  // 警告设置
  /** 警告阈值 */
  warningThreshold: number
  /** 危险阈值 */
  dangerThreshold: number
  /** 是否启用阈值警告 */
  enableThresholdAlert: boolean
  
  // 交互设置
  /** 是否可点击 */
  clickable: boolean
  /** 是否显示提示信息 */
  showTooltip: boolean
  /** 提示信息模板 */
  tooltipTemplate: string
}

/**
 * 组件设置配置
 */
export const gaugeDashboardV2SettingConfig: Setting[] = [
  // 基础设置
  createSetting(SettingControlType.INPUT, '组件标题', 'customize.title', {
    group: '基础设置',
    placeholder: '请输入仪表盘标题',
    defaultValue: '数据仪表盘'
  }),

  createSetting(SettingControlType.SELECT, '显示模式', 'customize.displayMode', {
    group: '基础设置',
    options: [
      { label: '弧形', value: 'arc' },
      { label: '半圆', value: 'semi-circle' },
      { label: '全圆', value: 'full-circle' },
      { label: '线性', value: 'linear' }
    ],
    defaultValue: 'arc'
  }),

  createSetting(SettingControlType.SELECT, '仪表盘类型', 'customize.gaugeType', {
    group: '基础设置',
    options: [
      { label: '普通', value: 'normal' },
      { label: '速度计', value: 'speedometer' },
      { label: '温度计', value: 'temperature' },
      { label: '进度条', value: 'progress' },
      { label: '电池', value: 'battery' }
    ],
    defaultValue: 'normal'
  }),

  // 数值设置
  createSetting(SettingControlType.INPUT_NUMBER, '最小值', 'customize.minValue', {
    group: '数值设置',
    defaultValue: 0
  }),

  createSetting(SettingControlType.INPUT_NUMBER, '最大值', 'customize.maxValue', {
    group: '数值设置',
    defaultValue: 100
  }),

  createSetting(SettingControlType.INPUT_NUMBER, '当前值', 'customize.currentValue', {
    group: '数值设置',
    defaultValue: 50
  }),

  createSetting(SettingControlType.INPUT, '数值单位', 'customize.unit', {
    group: '数值设置',
    placeholder: '如: ℃, %, km/h',
    defaultValue: ''
  }),

  createSetting(SettingControlType.INPUT_NUMBER, '小数位数', 'customize.decimal', {
    group: '数值设置',
    min: 0,
    max: 3,
    defaultValue: 1
  }),

  // 外观设置
  createSetting(SettingControlType.INPUT_NUMBER, '仪表盘半径', 'customize.radius', {
    group: '外观设置',
    min: 50,
    max: 300,
    step: 10,
    defaultValue: 120
  }),

  createSetting(SettingControlType.INPUT_NUMBER, '起始角度', 'customize.startAngle', {
    group: '外观设置',
    min: 0,
    max: 360,
    defaultValue: 225
  }),

  createSetting(SettingControlType.INPUT_NUMBER, '结束角度', 'customize.endAngle', {
    group: '外观设置',
    min: -360,
    max: 360,
    defaultValue: -45
  }),

  // 显示设置
  createSetting(SettingControlType.SWITCH, '显示数值', 'customize.showValue', {
    group: '显示设置',
    defaultValue: true
  }),

  createSetting(SettingControlType.SWITCH, '显示单位', 'customize.showUnit', {
    group: '显示设置',
    defaultValue: true
  }),

  createSetting(SettingControlType.SWITCH, '显示标题', 'customize.showTitle', {
    group: '显示设置',
    defaultValue: true
  }),

  createSetting(SettingControlType.INPUT_NUMBER, '数值字体大小', 'customize.valueFontSize', {
    group: '显示设置',
    min: 12,
    max: 48,
    defaultValue: 24
  }),

  createSetting(SettingControlType.INPUT_NUMBER, '标题字体大小', 'customize.titleFontSize', {
    group: '显示设置',
    min: 12,
    max: 32,
    defaultValue: 16
  }),

  // 动画设置
  createSetting(SettingControlType.SWITCH, '启用动画', 'customize.enableAnimation', {
    group: '动画设置',
    defaultValue: true
  }),

  createSetting(SettingControlType.INPUT_NUMBER, '动画持续时间', 'customize.animationDuration', {
    group: '动画设置',
    min: 100,
    max: 3000,
    step: 100,
    defaultValue: 1000
  }),

  createSetting(SettingControlType.SELECT, '动画类型', 'customize.animationType', {
    group: '动画设置',
    options: [
      { label: '线性', value: 'linear' },
      { label: '缓入', value: 'ease-in' },
      { label: '缓出', value: 'ease-out' },
      { label: '缓入缓出', value: 'ease-in-out' },
      { label: '弹跳', value: 'bounce' }
    ],
    defaultValue: 'ease-out'
  }),

  // 警告设置
  createSetting(SettingControlType.SWITCH, '启用阈值警告', 'customize.enableThresholdAlert', {
    group: '警告设置',
    defaultValue: false
  }),

  createSetting(SettingControlType.INPUT_NUMBER, '警告阈值', 'customize.warningThreshold', {
    group: '警告设置',
    defaultValue: 70
  }),

  createSetting(SettingControlType.INPUT_NUMBER, '危险阈值', 'customize.dangerThreshold', {
    group: '警告设置',
    defaultValue: 90
  }),

  // 交互设置
  createSetting(SettingControlType.SWITCH, '可点击', 'customize.clickable', {
    group: '交互设置',
    defaultValue: false
  }),

  createSetting(SettingControlType.SWITCH, '显示提示信息', 'customize.showTooltip', {
    group: '交互设置',
    defaultValue: true
  }),

  createSetting(SettingControlType.TEXTAREA, '提示信息模板', 'customize.tooltipTemplate', {
    group: '交互设置',
    placeholder: '支持变量: {value}, {unit}, {title}',
    defaultValue: '{title}: {value}{unit}'
  })
]

/**
 * 默认自定义配置
 */
export const customConfig = createCustomConfig<GaugeDashboardCustomize>('gauge-dashboard-v2', {
  title: '数据仪表盘',
  displayMode: 'arc',
  gaugeType: 'normal',
  
  // 数值设置
  minValue: 0,
  maxValue: 100,
  currentValue: 50,
  unit: '',
  decimal: 1,
  
  // 外观设置
  radius: 120,
  startAngle: 225,
  endAngle: -45,
  backgroundColor: '#f8f9fa',
  borderColor: '#e9ecef',
  borderWidth: 2,
  
  // 刻度配置
  tickConfig: {
    show: true,
    majorCount: 6,
    minorCount: 2,
    color: '#6c757d'
  },
  
  // 指针配置
  pointerConfig: {
    color: '#1890ff',
    width: 4,
    lengthRatio: 0.8,
    style: 'arrow'
  },
  
  // 颜色区间 - 默认绿-黄-红三段式
  colorRanges: [
    { from: 0, to: 60, color: '#52c41a', label: '正常' },
    { from: 60, to: 80, color: '#faad14', label: '警告' },
    { from: 80, to: 100, color: '#f5222d', label: '危险' }
  ],
  
  // 显示设置
  showValue: true,
  showUnit: true,
  showTitle: true,
  valueFontSize: 24,
  titleFontSize: 16,
  
  // 动画设置
  enableAnimation: true,
  animationDuration: 1000,
  animationType: 'ease-out',
  
  // 警告设置
  warningThreshold: 70,
  dangerThreshold: 90,
  enableThresholdAlert: false,
  
  // 交互设置
  clickable: false,
  showTooltip: true,
  tooltipTemplate: '{title}: {value}{unit}'
})

/**
 * 导出类型定义供外部使用
 */
export type GaugeDashboardV2Config = CustomConfig<GaugeDashboardCustomize>