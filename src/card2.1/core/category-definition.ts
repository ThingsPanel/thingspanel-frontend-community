/**
 * @file Card 2.1 - 全局分类定义
 * @description
 * 该文件定义了组件的全局分类体系，包括顶级分类（系统、图表）及其所有子分类。
 * 它是“约定优于配置”的核心，自动化注册系统将依据此文件来补充和修正组件的分类信息。
 *
 * @designPrinciples
 * 1. 中心化管理：所有分类信息集中于此，便于维护和扩展。
 * 2. 结构清晰：采用层级结构，清晰反映分类关系。
 * 3. 易于消费：导出的数据结构可以直接被注册系统使用。
 */

/**
 * 分类配置接口
 * 定义了每个分类节点的元数据
 */
export interface CategoryConfig {
  id: string; // 唯一标识符，通常是英文
  displayName: string; // 显示名称，用于 UI
  order: number; // 排序权重
  icon?: string; // 图标
  description?: string; // 描述
  enabled?: boolean; // 是否启用
  devOnly?: boolean; // 是否仅开发模式可见
  parentId?: 'system' | 'chart'; // 新增：父分类ID
}

/**
 * 顶级分类定义
 */
export const TOP_LEVEL_CATEGORIES: Record<'system' | 'chart', CategoryConfig> = {
  system: {
    id: 'system',
    displayName: '系统',
    order: 1,
    icon: 'settings',
    description: '系统级组件，用于监控和管理平台状态',
    enabled: true,
  },
  chart: {
    id: 'chart',
    displayName: '图表',
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
    displayName: '系统监控',
    order: 10,
    icon: 'dashboard',
    description: '展示系统级别的硬件资源使用情况',
    enabled: true,
    parentId: 'system',
  },
  'device-status': {
    id: 'device-status',
    displayName: '设备状态',
    order: 20,
    icon: 'laptop',
    description: '监控和展示设备的在线状态',
    enabled: true,
    parentId: 'system',
  },
  'alarm-management': {
    id: 'alarm-management',
    displayName: '告警管理',
    order: 30,
    icon: 'alert',
    description: '展示与告警相关的信息',
    enabled: true,
    parentId: 'system',
  },
  'tenant-app': {
    id: 'tenant-app',
    displayName: '租户与应用',
    order: 40,
    icon: 'appstore',
    description: '提供与租户和应用相关的数据和功能',
    enabled: true,
    parentId: 'system',
  },
  'data-information': {
    id: 'data-information',
    displayName: '数据与信息',
    order: 50,
    icon: 'info-circle',
    description: '用于展示通用数据和信息',
    enabled: true,
    parentId: 'system',
  },
  'user-behavior': {
    id: 'user-behavior',
    displayName: '用户行为',
    order: 60,
    icon: 'user',
    description: '追踪和展示用户的活动',
    enabled: true,
    parentId: 'system',
  },
  'operation-guide': {
    id: 'operation-guide',
    displayName: '操作指引',
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
    displayName: '仪表盘',
    order: 10,
    icon: 'dashboard',
    enabled: true,
    parentId: 'chart',
  },
  information: {
    id: 'information',
    displayName: '信息',
    order: 20,
    icon: 'info-circle',
    enabled: true,
    parentId: 'chart',
  },
  control: {
    id: 'control',
    displayName: '控制',
    order: 30,
    icon: 'control',
    enabled: true,
    parentId: 'chart',
  },
  device: {
    id: 'device',
    displayName: '设备',
    order: 40,
    icon: 'device',
    enabled: true,
    parentId: 'chart',
  },
  data: {
    id: 'data',
    displayName: '数据',
    order: 50,
    icon: 'chart-bar',
    enabled: true,
    parentId: 'chart',
  },
  statistics: {
    id: 'statistics',
    displayName: '统计',
    order: 60,
    icon: 'statistics',
    enabled: true,
    parentId: 'chart',
  },
  location: {
    id: 'location',
    displayName: '位置',
    order: 70,
    icon: 'location',
    enabled: true,
    parentId: 'chart',
  },
  media: {
    id: 'media',
    displayName: '音视频',
    order: 80,
    icon: 'play-circle',
    enabled: true,
    parentId: 'chart',
  },
  alarm: {
    id: 'alarm',
    displayName: '告警',
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
  'off-line': 'device-status',
  'on-line': 'device-status',
  'online-trend': 'device-status',
  'alarm-count': 'alarm-management',
  'alarm-info': 'alarm-management',
  'tenant-count': 'tenant-app',
  'tenant-chart': 'tenant-app',
  'app-download': 'tenant-app',
  'reported-data': 'data-information',
  'news': 'data-information',
  'information': 'data-information',
  'version': 'data-information',
  'access': 'user-behavior',
  'recently-visited': 'user-behavior',
  'operation-guide-card': 'operation-guide',

  // --- 图表组件 (可以根据组件名推断，也可以在这里显式指定) ---
  'alert-status': 'alarm',
  'alert-status-v2': 'alarm',
  'switch-controller': 'control',
};