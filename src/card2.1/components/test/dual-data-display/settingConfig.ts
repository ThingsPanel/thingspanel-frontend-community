/**
 * dual-data-display 组件设置配置
 * 定义组件的设置项和默认配置
 */

import type { ComponentSettingConfig, CustomConfig } from '@/card2.1/types/setting-config'
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
  /** 数据显示格式 */
  numberFormat: string
  /** 单位显示 */
  unit: string
}

/**
 * dual-data-display 组件设置配置
 */
export const dualDataDisplaySettingConfig: ComponentSettingConfig<DualDataDisplayCustomize> = {
  componentType: 'dual-data-display',

  // 设置项定义
  settings: [
    // 🔥 设备字段配置 - 放在最前面
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

    createSetting(SettingControlType.INPUT, '组件标题', 'customize.title', {
      group: '内容设置',
      placeholder: '请输入组件标题',
      defaultValue: '双数据展示'
    }),

    createSetting(SettingControlType.INPUT, '数据源1标签', 'customize.dataSource1Label', {
      group: '内容设置',
      placeholder: '请输入数据源1标签',
      defaultValue: '数据源A'
    }),

    createSetting(SettingControlType.INPUT, '数据源2标签', 'customize.dataSource2Label', {
      group: '内容设置',
      placeholder: '请输入数据源2标签',
      defaultValue: '数据源B'
    }),

    createSetting(SettingControlType.INPUT, '单位', 'customize.unit', {
      group: '内容设置',
      placeholder: '请输入数据单位',
      defaultValue: ''
    }),

    createSetting(SettingControlType.SELECT, '数字格式', 'customize.numberFormat', {
      group: '内容设置',
      options: [
        { label: '原始数字', value: 'raw' },
        { label: '千分位', value: 'thousands' },
        { label: '保留2位小数', value: 'decimal2' },
        { label: '百分比', value: 'percentage' }
      ],
      defaultValue: 'raw'
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
    })
  ],

  // 默认自定义配置
  customConfig: createCustomConfig<DualDataDisplayCustomize>('dual-data-display', {
    title: '双数据展示',
    themeColor: '#2080f0',
    fontSize: 16,
    showBorder: true,
    dataSource1Label: '数据源A',
    dataSource2Label: '数据源B',
    numberFormat: 'raw',
    unit: ''
  })
}

/**
 * 导出类型定义供外部使用
 */
export type DualDataDisplayConfig = CustomConfig<DualDataDisplayCustomize>
