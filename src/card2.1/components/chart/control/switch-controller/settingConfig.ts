/**
 * 开关控制器组件配置
 */

import type { SettingConfig } from '@/card2.1/types/setting-config'

/**
 * 开关控制器自定义配置接口
 */
export interface SwitchControllerCustomize {
  // 显示控制
  showStatus: boolean
  showDescription: boolean
  showLastUpdate: boolean
  showNotification: boolean
  
  // 内容配置
  title: string
  description: string
  onText: string
  offText: string
  
  // 控制配置
  disabled: boolean
  switchSize: 'small' | 'medium' | 'large'
  
  // 样式配置
  backgroundColor: string
  borderColor: string
  borderRadius: number
}

/**
 * 开关控制器完整配置接口
 */
export interface SwitchControllerConfig {
  type: 'switch-controller'
  root: {
    transform: {
      rotate: number
      scale: number
    }
  }
  customize: SwitchControllerCustomize
}

/**
 * 默认自定义配置
 */
export const customConfig: SwitchControllerCustomize = {
  // 显示控制
  showStatus: true,
  showDescription: true,
  showLastUpdate: true,
  showNotification: true,
  
  // 内容配置
  title: '设备开关',
  description: '控制设备的开关状态',
  onText: '已开启',
  offText: '已关闭',
  
  // 控制配置
  disabled: false,
  switchSize: 'medium',
  
  // 样式配置
  backgroundColor: 'transparent',
  borderColor: 'var(--border-color)',
  borderRadius: 8
}

/**
 * 开关控制器设置配置
 */
export const switchControllerSettingConfig: SettingConfig<SwitchControllerCustomize> = [
  {
    group: '显示设置',
    items: [
      {
        key: 'showStatus',
        label: '显示状态',
        type: 'switch',
        defaultValue: true
      },
      {
        key: 'showDescription',
        label: '显示描述',
        type: 'switch',
        defaultValue: true
      },
      {
        key: 'showLastUpdate',
        label: '显示最后更新',
        type: 'switch',
        defaultValue: true
      },
      {
        key: 'showNotification',
        label: '操作通知',
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
        defaultValue: '设备开关',
        placeholder: '请输入控制器标题'
      },
      {
        key: 'description',
        label: '描述',
        type: 'input',
        defaultValue: '控制设备的开关状态',
        placeholder: '请输入控制器描述'
      },
      {
        key: 'onText',
        label: '开启状态文字',
        type: 'input',
        defaultValue: '已开启',
        placeholder: '开启时显示的文字'
      },
      {
        key: 'offText',
        label: '关闭状态文字',
        type: 'input',
        defaultValue: '已关闭',
        placeholder: '关闭时显示的文字'
      }
    ]
  },
  {
    group: '控制配置',
    items: [
      {
        key: 'disabled',
        label: '禁用控制',
        type: 'switch',
        defaultValue: false
      },
      {
        key: 'switchSize',
        label: '开关大小',
        type: 'select',
        defaultValue: 'medium',
        options: [
          { label: '小', value: 'small' },
          { label: '中', value: 'medium' },
          { label: '大', value: 'large' }
        ]
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