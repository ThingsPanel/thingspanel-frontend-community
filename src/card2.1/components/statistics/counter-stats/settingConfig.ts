import type { SettingConfig } from '@/card2.1/types/setting-config'

export interface CounterStatsCustomize {
  showChange: boolean
  title: string
  defaultValue: number
  iconSize: number
  iconColor: string
  valueSize: number
  valueColor: string
  valueBold: boolean
  backgroundColor: string
  borderColor: string
  borderRadius: number
}

export interface CounterStatsConfig {
  type: 'counter-stats'
  root: { transform: { rotate: number; scale: number } }
  customize: CounterStatsCustomize
}

export const customConfig: CounterStatsCustomize = {
  showChange: true,
  title: '统计数据',
  defaultValue: 0,
  iconSize: 32,
  iconColor: 'var(--primary-color)',
  valueSize: 28,
  valueColor: 'var(--text-color-1)',
  valueBold: true,
  backgroundColor: 'transparent',
  borderColor: 'var(--border-color)',
  borderRadius: 8
}

export const counterStatsSettingConfig: SettingConfig<CounterStatsCustomize> = [
  { group: '显示设置', items: [
    { key: 'showChange', label: '显示变化', type: 'switch', defaultValue: true }
  ]},
  { group: '内容配置', items: [
    { key: 'title', label: '标题', type: 'input', defaultValue: '统计数据' },
    { key: 'defaultValue', label: '默认值', type: 'number', defaultValue: 0 }
  ]}
]