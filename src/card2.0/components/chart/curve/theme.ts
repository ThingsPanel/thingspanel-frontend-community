/**
 * 曲线图主题配置
 * 定义了颜色组、主题配置接口和相关工具函数
 */

// 颜色组1 - 基础渐变主题
export const colorGroups = [
  // 蓝色系
  [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'
  ],
  // 暖色系
  [
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
    'linear-gradient(135deg, #ff8a80 0%, #ffab91 100%)'
  ],
  // 冷色系
  [
    'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
    'linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)',
    'linear-gradient(135deg, #fdbb2d 0%, #22c1c3 100%)',
    'linear-gradient(135deg, #e0c3fc 0%, #9bb5ff 100%)'
  ],
  // 自然系
  [
    'linear-gradient(135deg, #d299c2 0%, #fef9d7 100%)',
    'linear-gradient(135deg, #89fffd 0%, #ef32d9 100%)',
    'linear-gradient(135deg, #ffeaa7 0%, #fab1a0 100%)',
    'linear-gradient(135deg, #74b9ff 0%, #0984e3 100%)'
  ]
]

// 颜色组2 - 高级渐变主题
export const colorGroups2 = [
  // 科技蓝
  [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    'linear-gradient(135deg, #30cfd0 0%, #91a7ff 100%)'
  ],
  // 商务风
  [
    'linear-gradient(135deg, #667db6 0%, #0082c8 100%)',
    'linear-gradient(135deg, #f85032 0%, #e73827 100%)',
    'linear-gradient(135deg, #fceabb 0%, #f8b500 100%)',
    'linear-gradient(135deg, #56ab2f 0%, #a8e6cf 100%)',
    'linear-gradient(135deg, #b06ab3 0%, #4568dc 100%)',
    'linear-gradient(135deg, #ff6b6b 0%, #ffa726 100%)'
  ],
  // 活力橙
  [
    'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
    'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
    'linear-gradient(135deg, #ff8a80 0%, #ffab91 100%)',
    'linear-gradient(135deg, #ffb347 0%, #ffcc33 100%)',
    'linear-gradient(135deg, #ff7e5f 0%, #feb47b 100%)'
  ],
  // 深邃紫
  [
    'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
    'linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)',
    'linear-gradient(135deg, #fdbb2d 0%, #22c1c3 100%)',
    'linear-gradient(135deg, #e0c3fc 0%, #9bb5ff 100%)',
    'linear-gradient(135deg, #c471f5 0%, #fa71cd 100%)',
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  ]
]

/**
 * 主题配置接口
 */
export interface ThemeConfig {
  /** 配色方案索引 */
  colorScheme: number
  /** 自定义颜色数组 */
  customColors?: string[]
  /** 是否自适应主题 */
  adaptiveTheme: boolean
  /** 背景色 */
  backgroundColor?: string
  /** 文字颜色 */
  textColor?: string
}

/**
 * 获取指定的颜色组
 * @param groupIndex 颜色组索引
 * @param useAdvanced 是否使用高级颜色组
 * @returns 颜色数组
 */
export function getColorGroup(groupIndex: number, useAdvanced = false): string[] {
  const groups = useAdvanced ? colorGroups2 : colorGroups
  const index = Math.max(0, Math.min(groupIndex, groups.length - 1))
  return groups[index] || groups[0]
}

/**
 * 根据主题配置获取颜色
 * @param config 主题配置
 * @returns 颜色数组
 */
export function getThemeColors(config: ThemeConfig): string[] {
  if (config.customColors && config.customColors.length > 0) {
    return config.customColors
  }

  return getColorGroup(config.colorScheme)
}

/**
 * 默认主题配置
 */
export const defaultThemeConfig: ThemeConfig = {
  colorScheme: 0,
  adaptiveTheme: true,
  backgroundColor: 'transparent',
  textColor: '#333333'
}

/**
 * 曲线图主题对象（兼容旧版本）
 */
export const CurveTheme = {
  colorGroups,
  colorGroups2,
  getColorGroup,
  getThemeColors,
  defaultThemeConfig
}

// 默认导出
export default {
  colorGroups,
  colorGroups2,
  getColorGroup,
  getThemeColors,
  defaultThemeConfig,
  CurveTheme
}
