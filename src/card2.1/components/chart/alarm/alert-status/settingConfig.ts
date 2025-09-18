/**
 * 告警状态组件配置 - 简化版，只保留基本的3个配置项
 */

import type { SettingConfig } from '@/card2.1/types/setting-config'

/**
 * 告警状态自定义配置接口 - 简化版
 */
export interface AlertStatusCustomize {
  title: string     // 标题
  amount: number    // 金额
  description: string // 简介
}

/**
 * 告警状态完整配置接口
 */
export interface AlertStatusConfig {
  type: 'alert-status'
  root: {
    transform: {
      rotate: number
      scale: number
    }
  }
  customize: AlertStatusCustomize
}

/**
 * 默认自定义配置
 */
export const customConfig: AlertStatusCustomize = {
  title: '告警状态',
  amount: 0,
  description: '系统运行正常'
}

/**
 * 告警状态设置配置 - 简化版
 */
export const alertStatusSettingConfig: SettingConfig<AlertStatusCustomize> = [
  {
    group: '基本配置',
    items: [
      {
        key: 'title',
        label: '标题',
        type: 'input',
        defaultValue: '告警状态',
        placeholder: '请输入标题'
      },
      {
        key: 'amount',
        label: '金额',
        type: 'number',
        defaultValue: 0,
        placeholder: '请输入金额'
      },
      {
        key: 'description',
        label: '简介',
        type: 'textarea',
        defaultValue: '系统运行正常',
        placeholder: '请输入简介信息'
      }
    ]
  }
]