/**
 * 主题系统集成
 * 集成原始面板系统的主题功能到 Visual Editor 中，提供统一的主题管理
 */

import { ref, reactive, computed, watch, nextTick } from 'vue'
import { useThemeStore } from '@/store/modules/theme'
import { createLogger } from '@/utils/logger'
import type { LayoutContainer, LayoutItem } from '../types/layout'

const logger = createLogger('ThemeIntegration')

// ====== 主题类型定义 ======

export interface ThemeColors {
  primary: string
  secondary: string
  accent: string
  background: string
  surface: string
  text: string
  textSecondary: string
  border: string
  shadow: string
  success: string
  warning: string
  error: string
  info: string
}

export interface ThemeGradients {
  primary: string
  secondary: string
  accent: string
  card: string
  background: string
}

export interface ThemeTypography {
  fontFamily: string
  fontSize: {
    xs: string
    sm: string
    base: string
    lg: string
    xl: string
    '2xl': string
    '3xl': string
    '4xl': string
  }
  fontWeight: {
    light: number
    normal: number
    medium: number
    semibold: number
    bold: number
  }
  lineHeight: {
    tight: number
    snug: number
    normal: number
    relaxed: number
    loose: number
  }
}

export interface ThemeSpacing {
  xs: string
  sm: string
  md: string
  lg: string
  xl: string
  '2xl': string
  '3xl': string
  '4xl': string
}

export interface ThemeBorderRadius {
  none: string
  sm: string
  md: string
  lg: string
  xl: string
  '2xl': string
  full: string
}

export interface ThemeShadows {
  sm: string
  md: string
  lg: string
  xl: string
  '2xl': string
  inner: string
  none: string
}

export interface PanelTheme {
  id: string
  name: string
  displayName: string
  description?: string
  category: 'light' | 'dark' | 'auto'
  isBuiltIn: boolean

  // 颜色系统
  colors: ThemeColors
  gradients: ThemeGradients

  // 排版系统
  typography: ThemeTypography

  // 空间系统
  spacing: ThemeSpacing

  // 圆角系统
  borderRadius: ThemeBorderRadius

  // 阴影系统
  shadows: ThemeShadows

  // 组件特定样式
  components?: {
    card?: Record<string, any>
    button?: Record<string, any>
    input?: Record<string, any>
    chart?: Record<string, any>
    [key: string]: Record<string, any> | undefined
  }

  // 自定义 CSS 变量
  customVars?: Record<string, string>

  // 元数据
  meta?: {
    version: string
    author?: string
    createdAt?: string
    updatedAt?: string
  }
}

// ====== 内置主题定义 ======

const BUILT_IN_THEMES: PanelTheme[] = [
  {
    id: 'default',
    name: 'default',
    displayName: '默认主题',
    description: '系统默认的浅色主题',
    category: 'light',
    isBuiltIn: true,
    colors: {
      primary: '#1890ff',
      secondary: '#722ed1',
      accent: '#13c2c2',
      background: '#ffffff',
      surface: '#fafafa',
      text: '#262626',
      textSecondary: '#8c8c8c',
      border: '#d9d9d9',
      shadow: 'rgba(0, 0, 0, 0.1)',
      success: '#52c41a',
      warning: '#faad14',
      error: '#ff4d4f',
      info: '#1890ff'
    },
    gradients: {
      primary: 'linear-gradient(135deg, #1890ff 0%, #40a9ff 100%)',
      secondary: 'linear-gradient(135deg, #722ed1 0%, #9254de 100%)',
      accent: 'linear-gradient(135deg, #13c2c2 0%, #36cfc9 100%)',
      card: 'linear-gradient(135deg, #ffffff 0%, #fafafa 100%)',
      background: 'linear-gradient(180deg, #fafafa 0%, #ffffff 100%)'
    },
    typography: {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      fontSize: {
        xs: '12px',
        sm: '14px',
        base: '16px',
        lg: '18px',
        xl: '20px',
        '2xl': '24px',
        '3xl': '30px',
        '4xl': '36px'
      },
      fontWeight: {
        light: 300,
        normal: 400,
        medium: 500,
        semibold: 600,
        bold: 700
      },
      lineHeight: {
        tight: 1.25,
        snug: 1.375,
        normal: 1.5,
        relaxed: 1.625,
        loose: 2
      }
    },
    spacing: {
      xs: '4px',
      sm: '8px',
      md: '16px',
      lg: '24px',
      xl: '32px',
      '2xl': '48px',
      '3xl': '64px',
      '4xl': '96px'
    },
    borderRadius: {
      none: '0',
      sm: '2px',
      md: '6px',
      lg: '8px',
      xl: '12px',
      '2xl': '16px',
      full: '9999px'
    },
    shadows: {
      sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
      none: 'none'
    }
  },
  {
    id: 'dark',
    name: 'dark',
    displayName: '深色主题',
    description: '深色模式主题',
    category: 'dark',
    isBuiltIn: true,
    colors: {
      primary: '#1890ff',
      secondary: '#722ed1',
      accent: '#13c2c2',
      background: '#141414',
      surface: '#1f1f1f',
      text: '#ffffff',
      textSecondary: '#a6a6a6',
      border: '#434343',
      shadow: 'rgba(0, 0, 0, 0.3)',
      success: '#52c41a',
      warning: '#faad14',
      error: '#ff4d4f',
      info: '#1890ff'
    },
    gradients: {
      primary: 'linear-gradient(135deg, #1890ff 0%, #40a9ff 100%)',
      secondary: 'linear-gradient(135deg, #722ed1 0%, #9254de 100%)',
      accent: 'linear-gradient(135deg, #13c2c2 0%, #36cfc9 100%)',
      card: 'linear-gradient(135deg, #1f1f1f 0%, #262626 100%)',
      background: 'linear-gradient(180deg, #141414 0%, #1f1f1f 100%)'
    },
    typography: {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      fontSize: {
        xs: '12px',
        sm: '14px',
        base: '16px',
        lg: '18px',
        xl: '20px',
        '2xl': '24px',
        '3xl': '30px',
        '4xl': '36px'
      },
      fontWeight: {
        light: 300,
        normal: 400,
        medium: 500,
        semibold: 600,
        bold: 700
      },
      lineHeight: {
        tight: 1.25,
        snug: 1.375,
        normal: 1.5,
        relaxed: 1.625,
        loose: 2
      }
    },
    spacing: {
      xs: '4px',
      sm: '8px',
      md: '16px',
      lg: '24px',
      xl: '32px',
      '2xl': '48px',
      '3xl': '64px',
      '4xl': '96px'
    },
    borderRadius: {
      none: '0',
      sm: '2px',
      md: '6px',
      lg: '8px',
      xl: '12px',
      '2xl': '16px',
      full: '9999px'
    },
    shadows: {
      sm: '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
      md: '0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -1px rgba(0, 0, 0, 0.3)',
      lg: '0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.3)',
      xl: '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
      '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
      inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.3)',
      none: 'none'
    }
  }
]

// ====== 主题管理器 ======

export class ThemeIntegrationManager {
  private themes = new Map<string, PanelTheme>()
  private currentTheme = ref<PanelTheme | null>(null)
  private customThemes = reactive<Record<string, PanelTheme>>({})
  private themeStore = useThemeStore()

  constructor() {
    this.initializeBuiltInThemes()
    this.syncWithThemeStore()
    this.setupCSSVariables()
  }

  // ====== 初始化 ======

  /**
   * 初始化内置主题
   */
  private initializeBuiltInThemes(): void {
    BUILT_IN_THEMES.forEach(theme => {
      this.themes.set(theme.id, theme)
    })

    // 设置默认主题
    this.currentTheme.value = this.themes.get('default') || null

    logger.info(`初始化 ${BUILT_IN_THEMES.length} 个内置主题`)
  }

  /**
   * 与全局主题存储同步
   */
  private syncWithThemeStore(): void {
    // 监听全局主题变化
    watch(
      () => this.themeStore.themeScheme,
      newScheme => {
        this.switchToScheme(newScheme)
      },
      { immediate: true }
    )
  }

  /**
   * 设置 CSS 变量
   */
  private setupCSSVariables(): void {
    watch(
      () => this.currentTheme.value,
      newTheme => {
        if (newTheme) {
          this.applyCSSVariables(newTheme)
        }
      },
      { immediate: true }
    )
  }

  // ====== 主题管理 ======

  /**
   * 切换到指定主题
   */
  switchToTheme(themeId: string): boolean {
    const theme = this.themes.get(themeId)
    if (!theme) {
      logger.warn(`主题不存在: ${themeId}`)
      return false
    }

    this.currentTheme.value = theme
    logger.info(`切换到主题: ${theme.displayName}`)
    return true
  }

  /**
   * 切换到指定主题方案
   */
  switchToScheme(scheme: 'light' | 'dark' | 'auto'): void {
    let targetTheme: PanelTheme | undefined

    if (scheme === 'auto') {
      // 根据系统偏好选择主题
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      targetTheme = this.getThemesByCategory(prefersDark ? 'dark' : 'light')[0]
    } else {
      targetTheme = this.getThemesByCategory(scheme)[0]
    }

    if (targetTheme) {
      this.switchToTheme(targetTheme.id)
    }
  }

  /**
   * 获取当前主题
   */
  getCurrentTheme(): PanelTheme | null {
    return this.currentTheme.value
  }

  /**
   * 获取所有主题
   */
  getAllThemes(): PanelTheme[] {
    return Array.from(this.themes.values())
  }

  /**
   * 根据类别获取主题
   */
  getThemesByCategory(category: 'light' | 'dark' | 'auto'): PanelTheme[] {
    return Array.from(this.themes.values()).filter(theme => theme.category === category)
  }

  /**
   * 获取主题
   */
  getTheme(themeId: string): PanelTheme | undefined {
    return this.themes.get(themeId)
  }

  // ====== 自定义主题 ======

  /**
   * 创建自定义主题
   */
  createCustomTheme(baseThemeId: string, customizations: Partial<PanelTheme>): PanelTheme | null {
    const baseTheme = this.themes.get(baseThemeId)
    if (!baseTheme) {
      logger.error(`基础主题不存在: ${baseThemeId}`)
      return null
    }

    const customTheme: PanelTheme = {
      ...baseTheme,
      ...customizations,
      id: customizations.id || `custom-${Date.now()}`,
      isBuiltIn: false,
      meta: {
        version: '1.0.0',
        createdAt: new Date().toISOString(),
        ...customizations.meta
      }
    }

    this.themes.set(customTheme.id, customTheme)
    this.customThemes[customTheme.id] = customTheme

    logger.info(`创建自定义主题: ${customTheme.displayName}`)
    return customTheme
  }

  /**
   * 更新自定义主题
   */
  updateCustomTheme(themeId: string, updates: Partial<PanelTheme>): boolean {
    const theme = this.themes.get(themeId)
    if (!theme || theme.isBuiltIn) {
      logger.warn(`无法更新主题: ${themeId}`)
      return false
    }

    const updatedTheme = {
      ...theme,
      ...updates,
      meta: {
        ...theme.meta,
        updatedAt: new Date().toISOString()
      }
    }

    this.themes.set(themeId, updatedTheme)
    this.customThemes[themeId] = updatedTheme

    // 如果是当前主题，立即应用更新
    if (this.currentTheme.value?.id === themeId) {
      this.currentTheme.value = updatedTheme
    }

    logger.info(`更新自定义主题: ${themeId}`)
    return true
  }

  /**
   * 删除自定义主题
   */
  deleteCustomTheme(themeId: string): boolean {
    const theme = this.themes.get(themeId)
    if (!theme || theme.isBuiltIn) {
      logger.warn(`无法删除主题: ${themeId}`)
      return false
    }

    this.themes.delete(themeId)
    delete this.customThemes[themeId]

    // 如果删除的是当前主题，切换到默认主题
    if (this.currentTheme.value?.id === themeId) {
      this.switchToTheme('default')
    }

    logger.info(`删除自定义主题: ${themeId}`)
    return true
  }

  // ====== CSS 变量应用 ======

  /**
   * 应用主题 CSS 变量
   */
  private applyCSSVariables(theme: PanelTheme): void {
    const root = document.documentElement

    // 应用颜色变量
    Object.entries(theme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--theme-color-${key}`, value)
    })

    // 应用渐变变量
    Object.entries(theme.gradients).forEach(([key, value]) => {
      root.style.setProperty(`--theme-gradient-${key}`, value)
    })

    // 应用字体变量
    root.style.setProperty('--theme-font-family', theme.typography.fontFamily)
    Object.entries(theme.typography.fontSize).forEach(([key, value]) => {
      root.style.setProperty(`--theme-font-size-${key}`, value)
    })
    Object.entries(theme.typography.fontWeight).forEach(([key, value]) => {
      root.style.setProperty(`--theme-font-weight-${key}`, String(value))
    })
    Object.entries(theme.typography.lineHeight).forEach(([key, value]) => {
      root.style.setProperty(`--theme-line-height-${key}`, String(value))
    })

    // 应用空间变量
    Object.entries(theme.spacing).forEach(([key, value]) => {
      root.style.setProperty(`--theme-spacing-${key}`, value)
    })

    // 应用圆角变量
    Object.entries(theme.borderRadius).forEach(([key, value]) => {
      root.style.setProperty(`--theme-border-radius-${key}`, value)
    })

    // 应用阴影变量
    Object.entries(theme.shadows).forEach(([key, value]) => {
      root.style.setProperty(`--theme-shadow-${key}`, value)
    })

    // 应用自定义变量
    if (theme.customVars) {
      Object.entries(theme.customVars).forEach(([key, value]) => {
        root.style.setProperty(`--theme-${key}`, value)
      })
    }

    logger.debug(`应用主题 CSS 变量: ${theme.displayName}`)
  }

  // ====== 主题应用到布局 ======

  /**
   * 将主题应用到布局容器
   */
  applyThemeToContainer(container: LayoutContainer): void {
    if (!this.currentTheme.value) return

    const theme = this.currentTheme.value

    // 更新容器主题配置
    container.theme = theme.id
    container.customTheme = {
      colors: theme.colors,
      gradients: theme.gradients,
      typography: theme.typography,
      spacing: theme.spacing,
      borderRadius: theme.borderRadius,
      shadows: theme.shadows
    }

    // 如果容器有背景配置，应用主题颜色
    if (container.background) {
      if (!container.background.color) {
        container.background.color = theme.colors.background
      }
    } else {
      container.background = {
        color: theme.colors.background
      }
    }

    logger.debug(`应用主题到容器: ${container.name}`)
  }

  /**
   * 将主题应用到布局项
   */
  applyThemeToItems(items: LayoutItem[]): void {
    if (!this.currentTheme.value) return

    const theme = this.currentTheme.value

    items.forEach(item => {
      // 应用主题样式
      if (!item.style) {
        item.style = {}
      }

      // 应用默认样式（如果没有自定义样式）
      if (!item.style.backgroundColor) {
        item.style.backgroundColor = theme.colors.surface
      }
      if (!item.style.borderColor) {
        item.style.borderColor = theme.colors.border
      }
      if (!item.style.borderRadius) {
        item.style.borderRadius = parseInt(theme.borderRadius.md)
      }

      // 组件特定样式
      if (theme.components && item.type) {
        const componentStyles = theme.components[item.type]
        if (componentStyles) {
          Object.assign(item.style, componentStyles)
        }
      }
    })

    logger.debug(`应用主题到 ${items.length} 个布局项`)
  }

  // ====== 主题导入导出 ======

  /**
   * 导出主题
   */
  exportTheme(themeId: string): string | null {
    const theme = this.themes.get(themeId)
    if (!theme) {
      logger.error(`主题不存在: ${themeId}`)
      return null
    }

    try {
      return JSON.stringify(theme, null, 2)
    } catch (error) {
      logger.error('导出主题失败:', error)
      return null
    }
  }

  /**
   * 导入主题
   */
  importTheme(themeData: string): PanelTheme | null {
    try {
      const theme: PanelTheme = JSON.parse(themeData)

      // 验证主题数据
      if (!this.validateTheme(theme)) {
        logger.error('主题数据无效')
        return null
      }

      // 确保是自定义主题
      theme.isBuiltIn = false
      theme.id = theme.id || `imported-${Date.now()}`

      this.themes.set(theme.id, theme)
      this.customThemes[theme.id] = theme

      logger.info(`导入主题: ${theme.displayName}`)
      return theme
    } catch (error) {
      logger.error('导入主题失败:', error)
      return null
    }
  }

  /**
   * 验证主题数据
   */
  private validateTheme(theme: any): theme is PanelTheme {
    return (
      theme &&
      typeof theme === 'object' &&
      typeof theme.id === 'string' &&
      typeof theme.name === 'string' &&
      typeof theme.displayName === 'string' &&
      theme.colors &&
      typeof theme.colors === 'object' &&
      theme.gradients &&
      typeof theme.gradients === 'object'
    )
  }

  // ====== 响应式数据 ======

  /**
   * 当前主题的响应式引用
   */
  get currentThemeRef() {
    return computed(() => this.currentTheme.value)
  }

  /**
   * 所有主题的响应式引用
   */
  get allThemesRef() {
    return computed(() => Array.from(this.themes.values()))
  }

  /**
   * 自定义主题的响应式引用
   */
  get customThemesRef() {
    return computed(() => Object.values(this.customThemes))
  }

  // ====== 清理资源 ======

  /**
   * 清理资源
   */
  dispose(): void {
    this.themes.clear()
    Object.keys(this.customThemes).forEach(key => {
      delete this.customThemes[key]
    })
    this.currentTheme.value = null
  }
}

// ====== 组合式函数 ======

let themeManager: ThemeIntegrationManager | null = null

/**
 * 使用主题集成
 */
export function useThemeIntegration() {
  if (!themeManager) {
    themeManager = new ThemeIntegrationManager()
  }

  return {
    // 状态
    currentTheme: themeManager.currentThemeRef,
    allThemes: themeManager.allThemesRef,
    customThemes: themeManager.customThemesRef,

    // 方法
    switchToTheme: themeManager.switchToTheme.bind(themeManager),
    switchToScheme: themeManager.switchToScheme.bind(themeManager),
    getCurrentTheme: themeManager.getCurrentTheme.bind(themeManager),
    getAllThemes: themeManager.getAllThemes.bind(themeManager),
    getThemesByCategory: themeManager.getThemesByCategory.bind(themeManager),
    getTheme: themeManager.getTheme.bind(themeManager),

    // 自定义主题
    createCustomTheme: themeManager.createCustomTheme.bind(themeManager),
    updateCustomTheme: themeManager.updateCustomTheme.bind(themeManager),
    deleteCustomTheme: themeManager.deleteCustomTheme.bind(themeManager),

    // 应用主题
    applyThemeToContainer: themeManager.applyThemeToContainer.bind(themeManager),
    applyThemeToItems: themeManager.applyThemeToItems.bind(themeManager),

    // 导入导出
    exportTheme: themeManager.exportTheme.bind(themeManager),
    importTheme: themeManager.importTheme.bind(themeManager),

    // 清理
    dispose: themeManager.dispose.bind(themeManager)
  }
}

/**
 * 重置主题管理器
 */
export function resetThemeIntegration(): void {
  if (themeManager) {
    themeManager.dispose()
    themeManager = null
  }
}

export default ThemeIntegrationManager
