/**
 * Card 2.1 分类映射（两级：系统/图表）
 * 目录结构：
 * - ./system/<component>/index.ts         → 顶层：系统（无子类）
 * - ./chart/<sub-category>/<component>/index.ts → 顶层：图表（子类：告警/控制/统计/...）
 */

import { $t } from '@/locales'

/** 分类显示配置接口 */
export interface CategoryConfig {
  displayName: string
  displayNameKey?: string // 国际化键值
  order: number
  devOnly?: boolean
  enabled?: boolean
  icon?: string
  description?: string
}

// 顶层分类（系统 / 图表）
export const TOP_LEVEL_MAPPING: Record<'system' | 'chart', CategoryConfig> = {
  system: {
    displayName: '系统',
    displayNameKey: 'categories.system',
    order: 1,
    enabled: true,
    icon: 'settings',
    description: '系统级组件（无子分类）'
  },
  chart: {
    displayName: '图表',
    displayNameKey: 'categories.chart',
    order: 2,
    enabled: true,
    icon: 'chart',
    description: '图表级组件（含子分类）'
  }
}

// 系统级别的子分类映射（基于实际目录结构）
export const SYSTEM_CATEGORY_MAPPING: Record<string, CategoryConfig> = {
  'alarm-management': {
    displayName: '告警管理',
    displayNameKey: 'subCategories.alarmManagement',
    order: 10,
    enabled: true,
    icon: 'warning',
    description: '告警通知和监控组件'
  },
  'data-information': {
    displayName: '数据信息',
    displayNameKey: 'subCategories.dataInformation',
    order: 20,
    enabled: true,
    icon: 'info-circle',
    description: '数据信息展示组件'
  },
  'device-status': {
    displayName: '设备状态',
    displayNameKey: 'subCategories.deviceStatus',
    order: 30,
    enabled: true,
    icon: 'device',
    description: '设备状态监控组件'
  },
  'operation-guide': {
    displayName: '操作指引',
    displayNameKey: 'subCategories.operationGuide',
    order: 40,
    enabled: true,
    icon: 'compass-outline',
    description: '操作指引和帮助组件'
  },
  'system-monitoring': {
    displayName: '系统监控',
    displayNameKey: 'subCategories.systemMonitoring',
    order: 50,
    enabled: true,
    icon: 'monitor',
    description: '系统性能监控组件'
  },
  'tenant-app': {
    displayName: '租户应用',
    displayNameKey: 'subCategories.tenantApp',
    order: 60,
    enabled: true,
    icon: 'app',
    description: '租户相关应用组件'
  },
  'tenant-management': {
    displayName: '租户管理',
    displayNameKey: 'subCategories.tenantManagement',
    order: 70,
    enabled: true,
    icon: 'users',
    description: '租户管理组件'
  },
  'user-behavior': {
    displayName: '用户行为',
    displayNameKey: 'subCategories.userBehavior',
    order: 80,
    enabled: true,
    icon: 'user',
    description: '用户行为分析组件'
  }
}

// 图表级别的子分类映射
export const CHART_CATEGORY_MAPPING: Record<string, CategoryConfig> = {
  alarm: {
    displayName: '告警',
    order: 10,
    enabled: true,
    icon: 'warning',
    description: '告警通知和监控组件'
  },
  control: {
    displayName: '控制',
    order: 20,
    enabled: true,
    icon: 'control',
    description: '控制面板和操作组件'
  },
  information: {
    displayName: '信息',
    order: 30,
    enabled: true,
    icon: 'info-circle',
    description: '信息展示和通知组件'
  },
  statistics: {
    displayName: '统计',
    order: 40,
    enabled: true,
    icon: 'statistics',
    description: '统计分析和数据汇总组件'
  },
  data: {
    displayName: '数据',
    order: 50,
    enabled: true,
    icon: 'chart-bar',
    description: '数据可视化和图表组件'
  },
  location: {
    displayName: '位置',
    order: 60,
    enabled: true,
    icon: 'location',
    description: '地图和位置相关组件'
  },
  media: {
    displayName: '音视频',
    order: 70,
    enabled: true,
    icon: 'play-circle',
    description: '音频视频播放和处理组件'
  },
  device: {
    displayName: '设备',
    order: 80,
    enabled: false, // 保持原有特殊逻辑：默认不展示
    icon: 'device',
    description: '设备管理和监控组件（特殊逻辑）'
  },
  test: {
    displayName: '测试',
    order: 999,
    enabled: true,
    devOnly: false, // 开发可见
    icon: 'experiment',
    description: '测试和调试专用组件'
  }
}

/**
 * 获取国际化的分类显示名称
 */
export function getCategoryDisplayNameI18n(folderName: string): string {
  if ((['system', 'chart'] as const).includes(folderName as any)) {
    const config = TOP_LEVEL_MAPPING[folderName as 'system' | 'chart']
    return config?.displayNameKey ? $t(config.displayNameKey) : config?.displayName || folderName
  }

  const systemConfig = SYSTEM_CATEGORY_MAPPING[folderName]
  if (systemConfig) {
    return systemConfig.displayNameKey ? $t(systemConfig.displayNameKey) : systemConfig.displayName
  }

  const chartConfig = CHART_CATEGORY_MAPPING[folderName]
  if (chartConfig) {
    return chartConfig.displayNameKey ? $t(chartConfig.displayNameKey) : chartConfig.displayName
  }

  return folderName
}

/**
 * 兼容导出：根据旧的"文件夹名称"返回显示名
 * - 识别顶层：'system' | 'chart'
 * - 识别图表子类：alarm/control/information/statistics/...
 * - 其他返回原值
 */
export function getCategoryDisplayName(folderName: string): string {
  if ((['system', 'chart'] as const).includes(folderName as any)) {
    return TOP_LEVEL_MAPPING[folderName as 'system' | 'chart']?.displayName || folderName
  }
  return (
    SYSTEM_CATEGORY_MAPPING[folderName]?.displayName ||
    CHART_CATEGORY_MAPPING[folderName]?.displayName ||
    folderName
  )
}

/**
 * 兼容导出：根据（相对）路径返回分类配置（旧签名）
 * - ./system/<comp>/index.ts → 顶层系统配置
 * - ./chart/<sub>/<comp>/index.ts → 子类配置
 * - ./<sub>/<comp>/index.ts → 按子类配置
 */
export function getCategoryByFolderPath(folderPath: string): CategoryConfig | undefined {
  let m = folderPath.match(/^\.\/system\//)
  if (m) return TOP_LEVEL_MAPPING.system

  m = folderPath.match(/^\.\/chart\/([^/]+)\//)
  if (m) return CHART_CATEGORY_MAPPING[m[1]]

  m = folderPath.match(/^\.\/([^/]+)\//)
  if (m) return CHART_CATEGORY_MAPPING[m[1]]

  return undefined
}

/**
 * 兼容导出：获取有效分类（默认返回图表子类）
 */
export function getValidCategories(includeDevOnly = false): Array<{ folder: string; config: CategoryConfig }> {
  return getChartCategories(includeDevOnly)
}

/** 获取顶层分类（排序、过滤） */
export function getTopLevels(includeDevOnly = false): Array<{ id: 'system' | 'chart'; config: CategoryConfig }> {
  return (Object.entries(TOP_LEVEL_MAPPING) as Array<['system' | 'chart', CategoryConfig]>)
    .filter(([_, cfg]) => cfg.enabled && (includeDevOnly || !cfg.devOnly))
    .map(([id, config]) => ({ id, config }))
    .sort((a, b) => a.config.order - b.config.order)
}

/** 获取图表子分类（排序、过滤） */
export function getChartCategories(includeDevOnly = false): Array<{ folder: string; config: CategoryConfig }> {
  return Object.entries(CHART_CATEGORY_MAPPING)
    .filter(([_, cfg]) => cfg.enabled && (includeDevOnly || !cfg.devOnly))
    .map(([folder, config]) => ({ folder, config }))
    .sort((a, b) => a.config.order - b.config.order)
}

/**
 * 从组件相对路径解析分类（相对于 components 目录，以 ./ 开头）
 * 支持：
 * - ./system/<sub>/<comp>/index.ts → { main: 系统, sub: <子类显示名> }
 * - ./chart/<sub>/<comp>/index.ts → { main: 图表, sub: <子类显示名> }
 */
export function parseCategoryFromPath(relPath: string): {
  topLevelId: 'system' | 'chart' | 'other'
  topLevelName: string
  subCategoryId?: string
  subCategoryName?: string
} {
  // 系统级：./system/<sub>/<comp>/index.ts
  let m = relPath.match(/^\.\/system\/([^/]+)\/([^/]+)\/index\.ts$/)
  if (m) {
    const subFolder = m[1]
    const top = TOP_LEVEL_MAPPING.system
    const sub = SYSTEM_CATEGORY_MAPPING[subFolder]
    return {
      topLevelId: 'system',
      topLevelName: top.displayNameKey ? $t(top.displayNameKey) : top.displayName,
      subCategoryId: subFolder,
      subCategoryName: sub?.displayNameKey ? $t(sub.displayNameKey) : (sub?.displayName || subFolder)
    }
  }

  // 图表级：./chart/<sub>/<comp>/index.ts
  m = relPath.match(/^\.\/chart\/([^/]+)\/([^/]+)\/index\.ts$/)
  if (m) {
    const subFolder = m[1]
    const top = TOP_LEVEL_MAPPING.chart
    const sub = CHART_CATEGORY_MAPPING[subFolder]
    return {
      topLevelId: 'chart',
      topLevelName: top.displayNameKey ? $t(top.displayNameKey) : top.displayName,
      subCategoryId: subFolder,
      subCategoryName: sub?.displayNameKey ? $t(sub.displayNameKey) : (sub?.displayName || subFolder)
    }
  }

  // 未匹配（向后兼容旧结构：./<category>/<comp>/index.ts）
  const legacy = relPath.match(/^\.\/([^/]+)\/([^/]+)\/index\.ts$/)
  if (legacy) {
    const folder = legacy[1]
    // 先尝试系统分类映射
    const systemSub = SYSTEM_CATEGORY_MAPPING[folder]
    if (systemSub) {
      const top = TOP_LEVEL_MAPPING.system
      return {
        topLevelId: 'system',
        topLevelName: top.displayNameKey ? $t(top.displayNameKey) : top.displayName,
        subCategoryId: folder,
        subCategoryName: systemSub.displayNameKey ? $t(systemSub.displayNameKey) : systemSub.displayName
      }
    }

    // 再尝试图表分类映射
    const chartSub = CHART_CATEGORY_MAPPING[folder]
    if (chartSub) {
      const top = TOP_LEVEL_MAPPING.chart
      return {
        topLevelId: 'chart',
        topLevelName: top.displayNameKey ? $t(top.displayNameKey) : top.displayName,
        subCategoryId: folder,
        subCategoryName: chartSub.displayNameKey ? $t(chartSub.displayNameKey) : chartSub.displayName
      }
    }

    // 默认归入系统分类
    const top = TOP_LEVEL_MAPPING.system
    return {
      topLevelId: 'system',
      topLevelName: top.displayNameKey ? $t(top.displayNameKey) : top.displayName,
      subCategoryId: folder,
      subCategoryName: folder
    }
  }

  return { topLevelId: 'other', topLevelName: $t('common.other', '其他') }
}

/** 简单的显示控制（顶层/子类） */
export function shouldShowTopLevel(id: 'system' | 'chart', isDev = false): boolean {
  const cfg = TOP_LEVEL_MAPPING[id]
  if (!cfg) return false
  if (!cfg.enabled) return false
  if (cfg.devOnly && !isDev) return false
  return true
}

export function shouldShowChartSubCategory(folder: string, isDev = false): boolean {
  const cfg = CHART_CATEGORY_MAPPING[folder]
  if (!cfg) return false
  if (!cfg.enabled) return false
  if (cfg.devOnly && !isDev) return false
  return true
}

/** 配置一致性校验（可选） */
export function validateCategoryMapping(): { valid: boolean; issues: string[] } {
  const issues: string[] = []

  const topOrders = Object.values(TOP_LEVEL_MAPPING).map(c => c.order)
  const dupTop = topOrders.filter((v, i) => topOrders.indexOf(v) !== i)
  if (dupTop.length) issues.push(`顶层顺序重复: ${dupTop.join(', ')}`)

  const subOrders = Object.values(CHART_CATEGORY_MAPPING).map(c => c.order)
  const dupSub = subOrders.filter((v, i) => subOrders.indexOf(v) !== i)
  if (dupSub.length) issues.push(`子类顺序重复: ${dupSub.join(', ')}`)

  return { valid: issues.length === 0, issues }
}

if (import.meta.env.DEV) {
  const v = validateCategoryMapping()
  if (!v.valid) {
    console.error('🚨 [CategoryMapping] 映射配置存在问题:', v.issues)
  }
}
