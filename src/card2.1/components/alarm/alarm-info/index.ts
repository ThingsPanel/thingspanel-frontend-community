/**
 * 告警信息统计组件
 * 迁移自 builtin-card/alarm-info，保持历史数据兼容性
 */

import AlarmInfoCard from './AlarmInfoCard.vue'
import type { ComponentDefinition } from '../../../core/types'

const alarmInfoDefinition: ComponentDefinition = {
  // 基本信息 - 保持与历史数据的兼容性
  type: 'alarm-info', // 🚨 保持原有组件ID不变
  name: '告警信息', // 显示名称
  description: '展示系统最新告警信息列表', // 组件说明
  version: '2.1.0', // Card2.1版本
  component: AlarmInfoCard, // Vue 组件引用

  // 分类信息
  category: 'statistics', // 统计类组件
  mainCategory: '系统监控', // 中文主分类 - 修复：与 alarm-count 保持一致
  subCategory: '告警统计', // 子分类
  icon: 'warning', // 图标名称
  author: 'ThingsPanel Team', // 作者
  permission: '不限', // 🚨 通用权限设置
  tags: ['告警', '统计', '信息', '列表展示'], // 标签

  // 组件配置
  config: {
    style: {
      width: 400, // 默认宽度
      height: 300, // 默认高度
      minWidth: 300, // 最小宽度
      minHeight: 200 // 最小高度
    },
    properties: {
      title: {
        type: 'string',
        default: '告警信息',
        label: '标题',
        description: '组件显示标题'
      },
      pageSize: {
        type: 'number',
        default: 10,
        label: '显示条数',
        description: '每页显示的告警条数',
        min: 5,
        max: 20
      },
      refreshInterval: {
        type: 'number',
        default: 60000,
        label: '刷新间隔(ms)',
        description: '数据自动刷新间隔时间（毫秒）'
      },
      showViewAllButton: {
        type: 'boolean',
        default: true,
        label: '显示查看全部按钮',
        description: '是否显示跳转到告警管理页面的按钮'
      },
      enableAutoRefresh: {
        type: 'boolean',
        default: true,
        label: '启用自动刷新',
        description: '是否启用定时自动刷新功能'
      }
    }
  }
}

// 🚨 必须：默认导出
export default alarmInfoDefinition

// 🔥 关键修复：手动注册到组件中心（与 alarm-count 保持一致）
import { ComponentRegistry } from '../../../core/component-registry'
ComponentRegistry.register(alarmInfoDefinition)