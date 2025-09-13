/**
 * 简单信息卡片组件配置
 */

import type { SettingConfig } from '@/card2.1/types/setting-config'

/**
 * 信息卡片自定义配置接口
 */
export interface InfoCardSimpleCustomize {
  // 显示控制
  showIcon: boolean
  showTitle: boolean
  showSubtext: boolean
  showUpdateTime: boolean
  
  // 内容配置
  title: string
  defaultValue: string
  subtext: string
  
  // 样式配置
  backgroundColor: string
  borderColor: string
  borderRadius: number
  
  // 图标配置
  iconSize: number
  iconColor: string
  
  // 数值样式
  valueSize: number
  valueColor: string
  valueBold: boolean
}

/**
 * 信息卡片完整配置接口
 */
export interface InfoCardSimpleConfig {
  type: 'info-card-simple'
  root: {
    transform: {
      rotate: number
      scale: number
    }
  }
  customize: InfoCardSimpleCustomize
}

/**
 * 默认自定义配置
 */
export const customConfig: InfoCardSimpleCustomize = {
  // 显示控制
  showIcon: true,
  showTitle: true,
  showSubtext: false,
  showUpdateTime: true,
  
  // 内容配置
  title: '信息标题',
  defaultValue: '暂无数据',
  subtext: '附加说明',
  
  // 样式配置
  backgroundColor: 'transparent',
  borderColor: 'var(--border-color)',
  borderRadius: 6,
  
  // 图标配置
  iconSize: 24,
  iconColor: 'var(--primary-color)',
  
  // 数值样式
  valueSize: 24,
  valueColor: 'var(--text-color-1)',
  valueBold: true
}

/**
 * 信息卡片设置配置
 */
export const infoCardSimpleSettingConfig: SettingConfig<InfoCardSimpleCustomize> = [
  {
    group: '显示设置',
    items: [
      {
        key: 'showIcon',
        label: '显示图标',
        type: 'switch',
        defaultValue: true
      },
      {
        key: 'showTitle',
        label: '显示标题',
        type: 'switch',
        defaultValue: true
      },
      {
        key: 'showSubtext',
        label: '显示副文本',
        type: 'switch',
        defaultValue: false
      },
      {
        key: 'showUpdateTime',
        label: '显示更新时间',
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
        defaultValue: '信息标题',
        placeholder: '请输入标题'
      },
      {
        key: 'defaultValue',
        label: '默认值',
        type: 'input',
        defaultValue: '暂无数据',
        placeholder: '无数据时显示的默认值'
      },
      {
        key: 'subtext',
        label: '副文本',
        type: 'input',
        defaultValue: '附加说明',
        placeholder: '请输入副文本说明'
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
        defaultValue: 6,
        min: 0,
        max: 20
      },
      {
        key: 'iconSize',
        label: '图标大小',
        type: 'number',
        defaultValue: 24,
        min: 16,
        max: 48
      },
      {
        key: 'iconColor',
        label: '图标颜色',
        type: 'color',
        defaultValue: 'var(--primary-color)'
      },
      {
        key: 'valueSize',
        label: '数值字体大小',
        type: 'number',
        defaultValue: 24,
        min: 12,
        max: 48
      },
      {
        key: 'valueColor',
        label: '数值颜色',
        type: 'color',
        defaultValue: 'var(--text-color-1)'
      },
      {
        key: 'valueBold',
        label: '数值加粗',
        type: 'switch',
        defaultValue: true
      }
    ]
  }
]