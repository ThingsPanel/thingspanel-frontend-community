/**
 * dual-data-display 组件设置配置
 * 定义组件的设置项和默认配置
 */

import type { Setting, CustomConfig } from '@/card2.1/types/setting-config'
import { createSetting, createCustomConfig, SettingControlType } from '@/card2.1/types/setting-config'

/**
 * dual-data-display 组件特有的 customize 类型
 */
export interface DualDataDisplayCustomize {
  /** 组件标题 */
  title: string
  /** 主题颜色 */
  themeColor: string
  /** 字体大小 */
  fontSize: number
  /** 是否显示边框 */
  showBorder: boolean
  /** 数据源1标签 */
  dataSource1Label: string
  /** 数据源2标签 */
  dataSource2Label: string
  /** 数字格式化类型 */
  numberFormat: 'raw' | 'integer' | 'decimal1' | 'decimal2' | 'percentage' | 'thousands'
  /** 数据单位 */
  unit: string
  /** 布局方式 */
  layout: 'horizontal' | 'vertical'
}

/**
 * 双数据展示组件完整配置接口
 */
export interface DualDataDisplayConfig extends CustomConfig<DualDataDisplayCustomize> {
  customize: DualDataDisplayCustomize
}

/**
 * 双数据展示组件设置配置
 */
export const dualDataDisplaySettingConfig: Setting[] = [
  // 通用设备字段
  createSetting(SettingControlType.INPUT, '设备ID', 'deviceId', {
    group: '设备配置',
    placeholder: '请输入设备ID',
    defaultValue: ''
  }),

  createSetting(SettingControlType.DYNAMIC_TAGS, '指标列表', 'metricsList', {
    group: '设备配置',
    placeholder: '请输入指标名称',
    defaultValue: []
  }),

  // 组件特定设置
  createSetting(SettingControlType.INPUT, '组件标题', 'customize.title', {
    group: '内容设置',
    placeholder: '请输入组件标题',
    defaultValue: '双数据展示组件'
  }),

  createSetting(SettingControlType.COLOR_PICKER, '主题颜色', 'customize.themeColor', {
    group: '样式设置',
    defaultValue: '#2080f0'
  }),

  createSetting(SettingControlType.INPUT_NUMBER, '字体大小', 'customize.fontSize', {
    group: '样式设置',
    min: 12,
    max: 24,
    step: 1,
    defaultValue: 16
  }),

  createSetting(SettingControlType.SWITCH, '显示边框', 'customize.showBorder', {
    group: '样式设置',
    defaultValue: true
  }),

  // 数据源设置
  createSetting(SettingControlType.INPUT, '数据源1标签', 'customize.dataSource1Label', {
    group: '数据设置',
    placeholder: '请输入数据源1标签',
    defaultValue: '数据源1'
  }),

  createSetting(SettingControlType.INPUT, '数据源2标签', 'customize.dataSource2Label', {
    group: '数据设置',
    placeholder: '请输入数据源2标签',
    defaultValue: '数据源2'
  }),

  // 数据格式设置
  createSetting(SettingControlType.SELECT, '数字格式', 'customize.numberFormat', {
    group: '数据设置',
    options: [
      { label: '原始数据', value: 'raw' },
      { label: '整数', value: 'integer' },
      { label: '一位小数', value: 'decimal1' },
      { label: '两位小数', value: 'decimal2' },
      { label: '百分比', value: 'percentage' },
      { label: '千分位', value: 'thousands' }
    ],
    defaultValue: 'decimal2'
  }),

  createSetting(SettingControlType.INPUT, '数据单位', 'customize.unit', {
    group: '数据设置',
    placeholder: '请输入数据单位（如：℃、%、kW等）',
    defaultValue: ''
  }),

  // 布局设置
  createSetting(SettingControlType.RADIO_GROUP, '布局方式', 'customize.layout', {
    group: '布局设置',
    options: [
      { label: '水平布局', value: 'horizontal' },
      { label: '垂直布局', value: 'vertical' }
    ],
    defaultValue: 'horizontal'
  })
]

/**
 * 默认自定义配置
 */
export const customConfig = createCustomConfig<DualDataDisplayCustomize>({
  title: '双数据展示',
  themeColor: '#2080f0',
  fontSize: 16,
  showBorder: true,
  dataSource1Label: '数据源1',
  dataSource2Label: '数据源2',
  numberFormat: 'decimal2',
  unit: '',
  layout: 'horizontal'
})

// 导出类型
export type {
  DualDataDisplayConfig,
  DualDataDisplayCustomize
}
