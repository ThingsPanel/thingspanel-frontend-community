/**
 * 设备总数统计组件
 * 迁移自 builtin-card/access，保持历史数据兼容性
 */

import AccessNumCard from './AccessNumCard.vue'
import type { ComponentDefinition } from '../../../core/types'

const accessNumDefinition: ComponentDefinition = {
  // 基本信息 - 保持与历史数据的兼容性
  type: 'access-num', // 🚨 保持原有组件ID不变
  name: '设备总数', // 显示名称
  description: '展示系统设备总数统计信息', // 组件说明
  version: '2.1.0', // Card2.1版本
  component: AccessNumCard, // Vue 组件引用

  // 分类信息
  category: 'statistics', // 统计类组件
  mainCategory: '系统监控', // 中文主分类 - 修复：与其他统计组件保持一致
  subCategory: '设备统计', // 子分类
  icon: 'device-hub', // 图标名称
  author: 'ThingsPanel Team', // 作者
  permission: '不限', // 🚨 通用权限设置
  tags: ['设备', '统计', '总数', '数值展示'], // 标签

  // 组件配置
  config: {
    style: {
      width: 300, // 默认宽度
      height: 200, // 默认高度
      minWidth: 200, // 最小宽度
      minHeight: 150 // 最小高度
    },
    properties: {
      title: {
        type: 'string',
        default: '设备总数',
        label: '标题',
        description: '组件显示标题'
      },
      showIcon: {
        type: 'boolean',
        default: true,
        label: '显示图标',
        description: '是否显示设备图标'
      },
      gradientColors: {
        type: 'array',
        default: ['#ec4786', '#b955a4'],
        label: '渐变色',
        description: '背景渐变颜色配置'
      },
      refreshInterval: {
        type: 'number',
        default: 30000,
        label: '刷新间隔(ms)',
        description: '数据自动刷新间隔时间'
      }
    }
  }
}

// 🚨 必须：默认导出
export default accessNumDefinition

// 🔥 关键修复：手动注册到组件中心（与 alarm-count 保持一致）
import { ComponentRegistry } from '../../../core/component-registry'
ComponentRegistry.register(accessNumDefinition)
