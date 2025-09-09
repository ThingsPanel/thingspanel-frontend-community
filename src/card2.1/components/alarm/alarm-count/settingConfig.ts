/**
 * alarm-count 告警计数组件设置配置
 * 展示系统告警设备总数的统计信息
 */

import type { ComponentSettingConfig, CustomConfig } from '@/card2.1/types/setting-config'
import { createSetting, createCustomConfig, SettingControlType } from '@/card2.1/types/setting-config'

/**
 * alarm-count 组件特有的 customize 类型
 */
export interface AlarmCountCustomize {
  /** 组件标题 */
  title: string
  /** 显示单位 */
  unit: string
  /** 渐变开始颜色 */
  startColor: string
  /** 渐变结束颜色 */
  endColor: string
  /** 图标类型 */
  icon: string
  /** 动画持续时间（毫秒） */
  animationDuration: number
  /** 是否显示图标 */
  showIcon: boolean
  /** 数值前缀 */
  prefix: string
  /** 数值后缀 */
  suffix: string
  /** 是否启用数字动画 */
  enableAnimation: boolean
}

/**
 * alarm-count 组件设置配置
 */
export const alarmCountSettingConfig: ComponentSettingConfig<AlarmCountCustomize> = {
  componentType: 'alarm-count',

  // 设置项定义
  settings: [
    createSetting(SettingControlType.INPUT, '组件标题', 'customize.title', {
      group: '内容设置',
      placeholder: '请输入组件标题',
      defaultValue: '告警数量统计'
    }),

    createSetting(SettingControlType.INPUT, '数值单位', 'customize.unit', {
      group: '内容设置',
      placeholder: '请输入单位',
      defaultValue: '个'
    }),

    createSetting(SettingControlType.INPUT, '数值前缀', 'customize.prefix', {
      group: '内容设置',
      placeholder: '数值前显示的文字',
      defaultValue: ''
    }),

    createSetting(SettingControlType.INPUT, '数值后缀', 'customize.suffix', {
      group: '内容设置',
      placeholder: '数值后显示的文字',
      defaultValue: ''
    }),

    createSetting(SettingControlType.COLOR_PICKER, '渐变开始颜色', 'customize.startColor', {
      group: '样式设置',
      defaultValue: '#f97316'
    }),

    createSetting(SettingControlType.COLOR_PICKER, '渐变结束颜色', 'customize.endColor', {
      group: '样式设置',
      defaultValue: '#ef4444'
    }),

    createSetting(SettingControlType.INPUT, '图标', 'customize.icon', {
      group: '显示设置',
      placeholder: '输入图标名称或emoji',
      defaultValue: '🚨'
    }),

    createSetting(SettingControlType.SWITCH, '显示图标', 'customize.showIcon', {
      group: '显示设置',
      defaultValue: true
    }),

    createSetting(SettingControlType.SWITCH, '启用数字动画', 'customize.enableAnimation', {
      group: '动画设置',
      defaultValue: true
    }),

    createSetting(SettingControlType.INPUT_NUMBER, '动画持续时间', 'customize.animationDuration', {
      group: '动画设置',
      min: 500,
      max: 5000,
      step: 100,
      defaultValue: 1500,
      suffix: 'ms',
      placeholder: '动画持续时间（毫秒）'
    })
  ],

  // 默认自定义配置
  customConfig: createCustomConfig<AlarmCountCustomize>('alarm-count', {
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
  })
}

/**
 * 导出类型定义供外部使用
 */
export type AlarmCountConfig = CustomConfig<AlarmCountCustomize>
