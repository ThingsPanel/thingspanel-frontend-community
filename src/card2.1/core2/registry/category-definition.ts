/**
 * Card 2.1 - 全局分类定义
 * @description
 * 该文件定义了组件的全局分类体系，包括顶级分类（系统、图表）及其所有子分类。
 * 它是"约定优于配置"的核心，自动化注册系统将依据此文件来补充和修正组件的分类信息。
 */

import type { CategoryConfig } from '../types'

/**
 * 顶级分类定义
 */
export const TOP_LEVEL_CATEGORIES: Record<'system' | 'chart', CategoryConfig> = {
  system: {
    id: 'system',
    displayName: 'categories.system', // 对应中文：系统
    order: 1,
    icon: 'settings',
    description: '系统级组件，用于监控和管理平台状态',
    enabled: true,
  },
  chart: {
    id: 'chart',
    displayName: 'categories.chart', // 对应中文：图表
    order: 2,
    icon: 'chart',
    description: '图表级组件，用于数据可视化和交互',
    enabled: true,
  },
};

/**
 * 子分类定义：系统
 */
export const SYSTEM_SUB_CATEGORIES: Record<string, CategoryConfig> = {
  'system-monitoring': {
    id: 'system-monitoring',
    displayName: 'subCategories.systemMonitoring', // 对应中文：系统监控
    order: 10,
    icon: 'dashboard',
    description: '展示系统级别的硬件资源使用情况',
    enabled: true,
    parentId: 'system',
  },
  'device-status': {
    id: 'device-status',
    displayName: 'subCategories.deviceStatus', // 对应中文：设备状态
    order: 20,
    icon: 'laptop',
    description: '监控和展示设备的在线状态',
    enabled: true,
    parentId: 'system',
  },
  'alarm-management': {
    id: 'alarm-management',
    displayName: 'subCategories.alarmManagement', // 对应中文：告警管理
    order: 30,
    icon: 'alert',
    description: '展示与告警相关的信息',
    enabled: true,
    parentId: 'system',
  },
  'tenant-app': {
    id: 'tenant-app',
    displayName: 'subCategories.tenantApp', // 对应中文：租户与应用
    order: 40,
    icon: 'appstore',
    description: '提供与租户和应用相关的数据和功能',
    enabled: true,
    parentId: 'system',
  },
  'data-information': {
    id: 'data-information',
    displayName: 'subCategories.dataInformation', // 对应中文：数据与信息
    order: 50,
    icon: 'info-circle',
    description: '用于展示通用数据和信息',
    enabled: true,
    parentId: 'system',
  },
  'user-behavior': {
    id: 'user-behavior',
    displayName: 'subCategories.userBehavior', // 对应中文：用户行为
    order: 60,
    icon: 'user',
    description: '追踪和展示用户的活动',
    enabled: true,
    parentId: 'system',
  },
  'operation-guide': {
    id: 'operation-guide',
    displayName: 'subCategories.operationGuide', // 对应中文：操作指引
    order: 70,
    icon: 'book',
    description: '为用户提供操作上的引导',
    enabled: true,
    parentId: 'system',
  },
};

/**
 * 子分类定义：图表
 */
export const CHART_SUB_CATEGORIES: Record<string, CategoryConfig> = {
  dashboard: {
    id: 'dashboard',
    displayName: 'subCategories.dashboard', // 对应中文：仪表盘
    order: 10,
    icon: 'dashboard',
    enabled: true,
    parentId: 'chart',
  },
  information: {
    id: 'information',
    displayName: 'subCategories.information', // 对应中文：信息
    order: 20,
    icon: 'info-circle',
    enabled: true,
    parentId: 'chart',
  },
  control: {
    id: 'control',
    displayName: 'subCategories.control', // 对应中文：控制
    order: 30,
    icon: 'control',
    enabled: true,
    parentId: 'chart',
  },
  device: {
    id: 'device',
    displayName: 'subCategories.device', // 对应中文：设备
    order: 40,
    icon: 'device',
    enabled: true,
    parentId: 'chart',
  },
  data: {
    id: 'data',
    displayName: 'subCategories.data', // 对应中文：数据
    order: 50,
    icon: 'chart-bar',
    enabled: true,
    parentId: 'chart',
  },
  statistics: {
    id: 'statistics',
    displayName: 'subCategories.statistics', // 对应中文：统计
    order: 60,
    icon: 'statistics',
    enabled: true,
    parentId: 'chart',
  },
  location: {
    id: 'location',
    displayName: 'subCategories.location', // 对应中文：位置
    order: 70,
    icon: 'location',
    enabled: true,
    parentId: 'chart',
  },
  media: {
    id: 'media',
    displayName: 'subCategories.media', // 对应中文：音视频
    order: 80,
    icon: 'play-circle',
    enabled: true,
    parentId: 'chart',
  },
  alarm: {
    id: 'alarm',
    displayName: 'subCategories.alarm', // 对应中文：告警
    order: 90,
    icon: 'warning',
    enabled: true,
    parentId: 'chart',
  },
};

/**
 * 合并所有子分类
 */
export const SUB_CATEGORIES: Record<string, CategoryConfig> = {
  ...SYSTEM_SUB_CATEGORIES,
  ...CHART_SUB_CATEGORIES,
};

/**
 * 组件到子分类的映射表
 * key: 组件ID (通常是组件目录名)
 * value: 子分类的ID
 */
export const COMPONENT_TO_CATEGORY_MAP: Record<string, string> = {
  // --- 系统组件 ---
  'cpu-usage': 'system-monitoring',
  'disk-usage': 'system-monitoring',
  'memory-usage': 'system-monitoring',
  'system-metrics-history': 'system-monitoring',
  'on-line': 'device-status',
  'off-line': 'device-status',
  'online-trend': 'device-status',
  'alarm-count': 'alarm-management',
  'alarm-info': 'alarm-management',
  'tenant-count': 'tenant-app',
  'tenant-chart': 'tenant-app',
  'app-download': 'tenant-app',
  'reported-data': 'data-information',
  'news': 'data-information',
  'version': 'data-information',
  'access': 'device-status', // 修正：设备总数应该属于设备状态分类
  'recently-visited': 'user-behavior',
  'operation-guide-card': 'operation-guide',

  // --- 图表组件 (可以根据组件名推断，也可以在这里显式指定) ---
  'alert-status': 'alarm',
  'alert-status-v2': 'alarm',
  'switch-controller': 'control',
  'digit-indicator': 'data',
  'gauge-chart': 'data', // 仪表盘图表组件
  'line-chart': 'data', // 折线图组件
  'bar-chart': 'data', // 柱状图组件
  'pie-chart': 'data', // 饼图组件
};

/**
 * 获取组件分类信息
 */
export function getCategoryFromComponentId(componentId: string): { mainCategory: string; subCategory: string } {
  // 从映射表中查找组件对应的子分类ID
  const subCategoryId = COMPONENT_TO_CATEGORY_MAP[componentId]

  if (subCategoryId) {
    // 根据子分类ID确定主分类
    const subCategoryConfig = SUB_CATEGORIES[subCategoryId]
    if (subCategoryConfig) {
      const mainCategory = subCategoryConfig.parentId === 'system'
        ? 'categories.system'
        : 'categories.chart'

      return {
        mainCategory,
        subCategory: subCategoryConfig.displayName
      }
    }
  }

  // 默认分类
  return {
    mainCategory: 'categories.chart',
    subCategory: 'subCategories.other'
  }
}