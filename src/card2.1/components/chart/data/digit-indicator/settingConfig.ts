/**
 * 数字指示器组件配置定义
 * 基于原始 card-config.vue 的配置需求
 */

import type { SettingConfig } from '@/card2.1/types/setting-config'

/**
 * 数字指示器自定义配置接口
 */
export interface DigitIndicatorCustomize {
  /** 自定义单位 */
  unit: string
  /** 图标颜色 */
  color: string
  /** 图标名称 */
  iconName: string
  /** 组件标题 */
  title?: string
  /** 是否显示调试信息 */
  showDebug?: boolean
}

/**
 * 数字指示器完整配置接口
 */
export interface DigitIndicatorConfig {
  type: 'digit-indicator'
  root: {
    transform: {
      rotate: number
      scale: number
    }
  }
  customize: DigitIndicatorCustomize
}

/**
 * 默认自定义配置
 */
export const customConfig: DigitIndicatorCustomize = {
  unit: '%',
  color: '#1890ff',
  iconName: 'Water',
  title: '',
  showDebug: false
}

/**
 * 数字指示器设置配置
 */
export const digitIndicatorSettingConfig: SettingConfig<DigitIndicatorCustomize> = [
  {
    group: '基本配置',
    items: [
      {
        key: 'title',
        label: '标题',
        type: 'input',
        defaultValue: '',
        placeholder: '请输入组件标题'
      },
      {
        key: 'unit',
        label: '单位',
        type: 'input',
        defaultValue: '%',
        placeholder: '请输入单位',
        help: '例如：%、℃、kW/h等，留空则使用数据源中的单位'
      }
    ]
  },
  {
    group: '样式配置',
    items: [
      {
        key: 'iconName',
        label: '图标',
        type: 'input',
        defaultValue: 'Water',
        placeholder: '输入图标名称（如：Water、Fire等）',
        help: '图标名称来自图标库，可在组件设置面板中选择'
      },
      {
        key: 'color',
        label: '图标颜色',
        type: 'color',
        defaultValue: '#1890ff',
        help: '设置图标的颜色'
      }
    ]
  },
  {
    group: '调试配置',
    items: [
      {
        key: 'showDebug',
        label: '显示调试信息',
        type: 'switch',
        defaultValue: false,
        help: '开启后将显示组件的调试信息面板'
      }
    ]
  }
]