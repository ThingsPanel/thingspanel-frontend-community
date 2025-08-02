// 柱状图主题配置

// 颜色组1 - 渐变色彩
export const colorGroups = [
  {
    name: '蓝色渐变',
    top: '#409EFF',
    bottom: '#79bbff'
  },
  {
    name: '绿色渐变',
    top: '#67C23A',
    bottom: '#95d475'
  },
  {
    name: '橙色渐变',
    top: '#E6A23C',
    bottom: '#eebe77'
  },
  {
    name: '红色渐变',
    top: '#F56C6C',
    bottom: '#f89898'
  },
  {
    name: '灰色渐变',
    top: '#909399',
    bottom: '#b1b3b8'
  },
  {
    name: '紫色渐变',
    top: '#8B5CF6',
    bottom: '#A78BFA'
  },
  {
    name: '青色渐变',
    top: '#06B6D4',
    bottom: '#67E8F9'
  },
  {
    name: '粉色渐变',
    top: '#EC4899',
    bottom: '#F9A8D4'
  }
]

// 颜色组2 - 深色主题
export const colorGroups2 = [
  {
    name: '深蓝渐变',
    top: '#1E40AF',
    bottom: '#3B82F6'
  },
  {
    name: '深绿渐变',
    top: '#059669',
    bottom: '#10B981'
  },
  {
    name: '深橙渐变',
    top: '#D97706',
    bottom: '#F59E0B'
  },
  {
    name: '深红渐变',
    top: '#DC2626',
    bottom: '#EF4444'
  },
  {
    name: '深灰渐变',
    top: '#4B5563',
    bottom: '#6B7280'
  },
  {
    name: '深紫渐变',
    top: '#7C3AED',
    bottom: '#8B5CF6'
  },
  {
    name: '深青渐变',
    top: '#0891B2',
    bottom: '#06B6D4'
  },
  {
    name: '深粉渐变',
    top: '#BE185D',
    bottom: '#EC4899'
  }
]

// 主题配置
export interface ThemeConfig {
  colorScheme: 'colorGroups' | 'colorGroups2'
  customColors: string[]
  adaptiveTheme: boolean
}

// 获取颜色组
export const getColorGroup = (scheme: 'colorGroups' | 'colorGroups2') => {
  return scheme === 'colorGroups' ? colorGroups : colorGroups2
}

// 获取主题颜色
export const getThemeColors = (config: ThemeConfig) => {
  if (config.customColors && config.customColors.length > 0) {
    return config.customColors.map(color => ({
      name: '自定义',
      top: color,
      bottom: color
    }))
  }

  return getColorGroup(config.colorScheme)
}

// 默认主题配置
export const defaultThemeConfig: ThemeConfig = {
  colorScheme: 'colorGroups',
  customColors: [],
  adaptiveTheme: true
}

// 曲线主题（兼容旧版本）
export const CurveTheme = {
  colorGroups,
  colorGroups2
}

export default {
  colorGroups,
  colorGroups2,
  getColorGroup,
  getThemeColors,
  defaultThemeConfig,
  CurveTheme
}
