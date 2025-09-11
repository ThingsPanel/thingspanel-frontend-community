/**
 * 应用下载组件
 * 迁移自 builtin-card/app-download，保持历史数据兼容性
 * 纯展示型组件，无数据源和组件配置需求
 */

import AppDownloadCard from '@/card2.1/components/statistics/app-download/AppDownloadCard.vue'
import type { ComponentDefinition } from '@/card2.1/types'

const appDownloadDefinition: ComponentDefinition = {
  // 基本信息 - 保持与历史数据的兼容性
  type: 'app-download', // 🚨 保持原有组件ID不变
  name: '应用下载', // 显示名称
  description: '展示移动应用下载二维码和应用商店链接', // 组件说明
  version: '2.1.0', // Card2.1版本
  component: AppDownloadCard, // Vue 组件引用

  // 分类信息
  category: 'statistics', // 统计类组件
  mainCategory: '系统工具', // 中文主分类
  subCategory: '应用下载', // 子分类
  icon: 'download', // 图标名称
  author: 'ThingsPanel Team', // 作者
  permission: '不限', // 🚨 通用权限设置
  tags: ['下载', '应用', 'APP', '二维码'], // 标签

  // 组件配置
  config: {
    style: {
      width: 300, // 默认宽度
      height: 250, // 默认高度
      minWidth: 200, // 最小宽度
      minHeight: 200 // 最小高度
    },
    // 🚨 按用户要求：无组件配置属性
    properties: {}
  }
}

// 🚨 必须：默认导出
export default appDownloadDefinition

// 🔥 关键修复：手动注册到组件中心（与其他组件保持一致）
import { ComponentRegistry } from '@/card2.1/core/component-registry'
ComponentRegistry.register(appDownloadDefinition)
