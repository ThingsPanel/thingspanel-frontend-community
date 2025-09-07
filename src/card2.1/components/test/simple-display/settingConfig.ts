/**
 * simple-display 组件设置配置
 * 定义组件的设置项和默认配置
 */

import type { ComponentSettingConfig, CustomConfig } from '@/card2.1/types/setting-config'
import { createSetting, createCustomConfig, SettingControlType } from '@/card2.1/types/setting-config'

/**
 * simple-display 组件特有的 customize 类型
 */
export interface SimpleDisplayCustomize {
  /** 组件标题 */
  title: string
  /** 展示内容 */
  content: string
  /** 主题颜色 */
  themeColor: string
  /** 字体大小 */
  fontSize: number
  /** 是否显示图标 */
  showIcon: boolean
  /** 图标名称 */
  iconName: string
}

/**
 * simple-display 组件设置配置
 */
export const simpleDisplaySettingConfig: ComponentSettingConfig<SimpleDisplayCustomize> = {
  componentType: 'simple-display',

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
      defaultValue: '简单展示组件'
    }),

    createSetting(SettingControlType.TEXTAREA, '展示内容', 'customize.content', {
      group: '内容设置',
      placeholder: '请输入展示内容',
      defaultValue: '这是一个静态展示组件，不需要数据源'
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

    createSetting(SettingControlType.SWITCH, '显示图标', 'customize.showIcon', {
      group: '显示设置',
      defaultValue: true
    }),

    createSetting(SettingControlType.INPUT, '图标符号', 'customize.iconName', {
      group: '显示设置',
      placeholder: '输入emoji或图标符号',
      defaultValue: '📊'
    })
  ],

  // 默认自定义配置
  customConfig: createCustomConfig<SimpleDisplayCustomize>('simple-display', {
    title: '简单展示组件',
    content: '这是一个静态展示组件，不需要数据源',
    themeColor: '#2080f0',
    fontSize: 16,
    showIcon: true,
    iconName: '📊'
  })
}

/**
 * 导出类型定义供外部使用
 */
export type SimpleDisplayConfig = CustomConfig<SimpleDisplayCustomize>
