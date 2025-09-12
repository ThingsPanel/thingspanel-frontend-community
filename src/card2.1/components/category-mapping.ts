/**
 * Card 2.1 组件分类映射配置
 * 维护文件夹名称与显示分类的对应关系
 */

/**
 * 分类显示配置接口
 */
export interface CategoryConfig {
  /** 显示名称 */
  displayName: string
  /** 显示顺序 */
  order: number
  /** 是否仅在开发环境显示 */
  devOnly?: boolean
  /** 是否启用（用于特殊逻辑控制） */
  enabled?: boolean
  /** 图标（可选） */
  icon?: string
  /** 描述（可选） */
  description?: string
}

/**
 * 文件夹到分类的映射关系
 * 🚨 CRITICAL: 这是分类的唯一真实来源，不要在组件定义中重复设置分类
 */
export const FOLDER_CATEGORY_MAPPING: Record<string, CategoryConfig> = {
  // 📊 仪表盘类
  dashboard: {
    displayName: '仪表盘',
    order: 1,
    enabled: true,
    icon: 'dashboard',
    description: '仪表盘和综合展示组件'
  },

  // ℹ️ 信息展示类
  information: {
    displayName: '信息',
    order: 2,
    enabled: true,
    icon: 'info-circle',
    description: '信息展示和通知组件'
  },

  // 🎮 控制类
  control: {
    displayName: '控制',
    order: 3,
    enabled: true,
    icon: 'control',
    description: '控制面板和操作组件'
  },

  // 🔧 设备类 (特殊处理 - 不走文件夹逻辑)
  device: {
    displayName: '设备',
    order: 4,
    enabled: false, // 🚨 设备类有其他逻辑实现，不走文件夹逻辑
    icon: 'device',
    description: '设备管理和监控组件 (特殊逻辑)'
  },

  // 📈 数据展示类
  data: {
    displayName: '数据',
    order: 5,
    enabled: true,
    icon: 'chart-bar',
    description: '数据可视化和图表组件'
  },

  // 📊 统计类
  statistics: {
    displayName: '统计',
    order: 6,
    enabled: true,
    icon: 'statistics',
    description: '统计分析和数据汇总组件'
  },

  // 📍 位置类
  location: {
    displayName: '位置',
    order: 7,
    enabled: true,
    icon: 'location',
    description: '地图和位置相关组件'
  },

  // 🎵 音视频类
  media: {
    displayName: '音视频',
    order: 8,
    enabled: true,
    icon: 'play-circle',
    description: '音频视频播放和处理组件'
  },

  // ⚠️ 告警类
  alarm: {
    displayName: '告警',
    order: 9,
    enabled: true,
    icon: 'warning',
    description: '告警通知和监控组件'
  },

  // 🧪 测试类 (仅开发环境)
  test: {
    displayName: '测试',
    order: 999, // 排在最后
    enabled: true,
    devOnly: false, // 🚨 仅在开发环境显示
    icon: 'experiment',
    description: '测试和调试专用组件'
  }
}

/**
 * 根据文件夹路径获取分类信息
 * @param folderPath 组件文件夹路径，如 "./statistics/access-num/index.ts"
 * @returns 分类配置或 undefined
 */
export function getCategoryByFolderPath(folderPath: string): CategoryConfig | undefined {
  // 从路径中提取第一级文件夹名
  const pathMatch = folderPath.match(/^\.\/([^/]+)/)
  if (!pathMatch) return undefined

  const folderName = pathMatch[1]
  return FOLDER_CATEGORY_MAPPING[folderName]
}

/**
 * 获取所有有效的分类列表
 * @param includeDevOnly 是否包含开发专用分类
 * @returns 排序后的分类配置数组
 */
export function getValidCategories(includeDevOnly = false): Array<{ folder: string; config: CategoryConfig }> {
  return Object.entries(FOLDER_CATEGORY_MAPPING)
    .filter(([_, config]) => {
      // 过滤未启用的分类
      if (!config.enabled) return false

      // 过滤开发专用分类（在生产环境）
      if (config.devOnly && !includeDevOnly) return false

      return true
    })
    .map(([folder, config]) => ({ folder, config }))
    .sort((a, b) => a.config.order - b.config.order)
}

/**
 * 获取分类显示名称
 * @param folderName 文件夹名称
 * @returns 显示名称或原文件夹名称
 */
export function getCategoryDisplayName(folderName: string): string {
  return FOLDER_CATEGORY_MAPPING[folderName]?.displayName || folderName
}

/**
 * 检查分类是否应该显示
 * @param folderName 文件夹名称
 * @param isDevelopment 是否为开发环境
 * @returns 是否应该显示
 */
export function shouldShowCategory(folderName: string, isDevelopment = false): boolean {
  const config = FOLDER_CATEGORY_MAPPING[folderName]
  if (!config) return false

  // 检查是否启用
  if (!config.enabled) return false

  // 检查开发环境限制
  if (config.devOnly && !isDevelopment) return false

  return true
}

/**
 * 验证分类映射配置的一致性
 */
export function validateCategoryMapping(): {
  valid: boolean
  issues: string[]
} {
  const issues: string[] = []

  // 检查显示顺序是否有重复
  const orders = Object.values(FOLDER_CATEGORY_MAPPING).map(c => c.order)
  const duplicateOrders = orders.filter((order, index) => orders.indexOf(order) !== index)
  if (duplicateOrders.length > 0) {
    issues.push(`重复的显示顺序: ${duplicateOrders.join(', ')}`)
  }

  // 检查显示名称是否有重复
  const displayNames = Object.values(FOLDER_CATEGORY_MAPPING).map(c => c.displayName)
  const duplicateNames = displayNames.filter((name, index) => displayNames.indexOf(name) !== index)
  if (duplicateNames.length > 0) {
    issues.push(`重复的显示名称: ${duplicateNames.join(', ')}`)
  }

  return {
    valid: issues.length === 0,
    issues
  }
}

// 开发环境下自动验证配置
if (import.meta.env.DEV) {
  const validation = validateCategoryMapping()
  if (!validation.valid) {
    console.error('🚨 [CategoryMapping] 分类映射配置存在问题:', validation.issues)
  } else {
    if (process.env.NODE_ENV === 'development') {
    }
  }
}
