// src/components/panelv2/themes/ThemeManager.ts

import { reactive, ref, computed } from 'vue'

export interface ThemeColors {
  primary: string
  secondary: string
  accent: string
  background: string
  surface: string
  text: {
    primary: string
    secondary: string
    disabled: string
  }
  border: string
  shadow: string
  success: string
  warning: string
  error: string
  info: string
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
    normal: number
    relaxed: number
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
}

export interface ThemeBorderRadius {
  none: string
  sm: string
  md: string
  lg: string
  xl: string
  full: string
}

export interface Theme {
  id: string
  name: string
  description?: string
  type: 'light' | 'dark' | 'auto'
  colors: ThemeColors
  typography: ThemeTypography
  spacing: ThemeSpacing
  borderRadius: ThemeBorderRadius
  custom?: Record<string, any>
}

export class ThemeManager {
  private themes = reactive<Map<string, Theme>>(new Map())
  private currentThemeId = ref<string>('default-light')
  private systemPreference = ref<'light' | 'dark'>('light')

  constructor() {
    this.initializeDefaultThemes()
    this.detectSystemPreference()
  }

  // 当前主题
  get currentTheme(): Theme | undefined {
    return this.themes.get(this.currentThemeId.value)
  }

  // 注册主题
  registerTheme(theme: Theme) {
    this.themes.set(theme.id, theme)
  }

  // 批量注册主题
  registerThemes(themes: Theme[]) {
    themes.forEach(theme => this.registerTheme(theme))
  }

  // 移除主题
  removeTheme(themeId: string) {
    if (themeId === this.currentThemeId.value) {
      this.setTheme('default-light')
    }
    this.themes.delete(themeId)
  }

  // 设置主题
  setTheme(themeId: string) {
    const theme = this.themes.get(themeId)
    if (!theme) {
      console.warn(`Theme ${themeId} not found`)
      return false
    }

    this.currentThemeId.value = themeId
    this.applyTheme(theme)
    this.saveThemePreference(themeId)
    return true
  }

  // 获取所有主题
  getAllThemes(): Theme[] {
    return Array.from(this.themes.values())
  }

  // 获取主题
  getTheme(themeId: string): Theme | undefined {
    return this.themes.get(themeId)
  }

  // 应用主题到DOM
  private applyTheme(theme: Theme) {
    const root = document.documentElement

    // 应用颜色变量
    Object.entries(theme.colors).forEach(([key, value]) => {
      if (typeof value === 'object') {
        Object.entries(value).forEach(([subKey, subValue]) => {
          root.style.setProperty(`--color-${key}-${subKey}`, subValue)
        })
      } else {
        root.style.setProperty(`--color-${key}`, value)
      }
    })

    // 应用字体变量
    root.style.setProperty('--font-family', theme.typography.fontFamily)
    Object.entries(theme.typography.fontSize).forEach(([key, value]) => {
      root.style.setProperty(`--font-size-${key}`, value)
    })
    Object.entries(theme.typography.fontWeight).forEach(([key, value]) => {
      root.style.setProperty(`--font-weight-${key}`, value.toString())
    })
    Object.entries(theme.typography.lineHeight).forEach(([key, value]) => {
      root.style.setProperty(`--line-height-${key}`, value.toString())
    })

    // 应用间距变量
    Object.entries(theme.spacing).forEach(([key, value]) => {
      root.style.setProperty(`--spacing-${key}`, value)
    })

    // 应用圆角变量
    Object.entries(theme.borderRadius).forEach(([key, value]) => {
      root.style.setProperty(`--border-radius-${key}`, value)
    })

    // 应用自定义变量
    if (theme.custom) {
      Object.entries(theme.custom).forEach(([key, value]) => {
        root.style.setProperty(`--${key}`, value)
      })
    }

    // 设置主题类名
    root.className = root.className.replace(/theme-\w+/g, '')
    root.classList.add(`theme-${theme.id}`)
  }

  // 检测系统偏好
  private detectSystemPreference() {
    if (typeof window === 'undefined') return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    this.systemPreference.value = mediaQuery.matches ? 'dark' : 'light'

    mediaQuery.addEventListener('change', e => {
      this.systemPreference.value = e.matches ? 'dark' : 'light'

      // 如果当前主题是auto，则自动切换
      const currentTheme = this.currentTheme
      if (currentTheme?.type === 'auto') {
        this.applyAutoTheme()
      }
    })
  }

  // 应用自动主题
  private applyAutoTheme() {
    const autoThemeId = this.systemPreference.value === 'dark' ? 'default-dark' : 'default-light'
    const theme = this.themes.get(autoThemeId)
    if (theme) {
      this.applyTheme(theme)
    }
  }

  // 保存主题偏好
  private saveThemePreference(themeId: string) {
    try {
      localStorage.setItem('panelv2-theme', themeId)
    } catch (error) {
      console.warn('Failed to save theme preference:', error)
    }
  }

  // 加载主题偏好
  loadThemePreference(): string | null {
    try {
      return localStorage.getItem('panelv2-theme')
    } catch (error) {
      console.warn('Failed to load theme preference:', error)
      return null
    }
  }

  // 初始化默认主题
  private initializeDefaultThemes() {
    // 默认浅色主题
    this.registerTheme({
      id: 'default-light',
      name: '默认浅色',
      description: '清爽的浅色主题',
      type: 'light',
      colors: {
        primary: '#1890ff',
        secondary: '#722ed1',
        accent: '#13c2c2',
        background: '#ffffff',
        surface: '#fafafa',
        text: {
          primary: '#262626',
          secondary: '#595959',
          disabled: '#bfbfbf'
        },
        border: '#d9d9d9',
        shadow: 'rgba(0, 0, 0, 0.1)',
        success: '#52c41a',
        warning: '#faad14',
        error: '#ff4d4f',
        info: '#1890ff'
      },
      typography: {
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        fontSize: {
          xs: '0.75rem',
          sm: '0.875rem',
          base: '1rem',
          lg: '1.125rem',
          xl: '1.25rem',
          '2xl': '1.5rem',
          '3xl': '1.875rem'
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
          normal: 1.5,
          relaxed: 1.75
        }
      },
      spacing: {
        xs: '0.25rem',
        sm: '0.5rem',
        md: '1rem',
        lg: '1.5rem',
        xl: '2rem',
        '2xl': '3rem',
        '3xl': '4rem'
      },
      borderRadius: {
        none: '0',
        sm: '0.25rem',
        md: '0.375rem',
        lg: '0.5rem',
        xl: '0.75rem',
        full: '9999px'
      }
    })

    // 默认深色主题
    this.registerTheme({
      id: 'default-dark',
      name: '默认深色',
      description: '优雅的深色主题',
      type: 'dark',
      colors: {
        primary: '#1890ff',
        secondary: '#722ed1',
        accent: '#13c2c2',
        background: '#141414',
        surface: '#1f1f1f',
        text: {
          primary: '#ffffff',
          secondary: '#d9d9d9',
          disabled: '#595959'
        },
        border: '#434343',
        shadow: 'rgba(0, 0, 0, 0.3)',
        success: '#52c41a',
        warning: '#faad14',
        error: '#ff4d4f',
        info: '#1890ff'
      },
      typography: {
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        fontSize: {
          xs: '0.75rem',
          sm: '0.875rem',
          base: '1rem',
          lg: '1.125rem',
          xl: '1.25rem',
          '2xl': '1.5rem',
          '3xl': '1.875rem'
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
          normal: 1.5,
          relaxed: 1.75
        }
      },
      spacing: {
        xs: '0.25rem',
        sm: '0.5rem',
        md: '1rem',
        lg: '1.5rem',
        xl: '2rem',
        '2xl': '3rem',
        '3xl': '4rem'
      },
      borderRadius: {
        none: '0',
        sm: '0.25rem',
        md: '0.375rem',
        lg: '0.5rem',
        xl: '0.75rem',
        full: '9999px'
      }
    })

    // 蓝色主题
    this.registerTheme({
      id: 'blue-theme',
      name: '海洋蓝',
      description: '深邃的海洋蓝主题',
      type: 'light',
      colors: {
        primary: '#0066cc',
        secondary: '#004499',
        accent: '#00aaff',
        background: '#f0f8ff',
        surface: '#e6f3ff',
        text: {
          primary: '#003366',
          secondary: '#0066cc',
          disabled: '#99ccff'
        },
        border: '#b3d9ff',
        shadow: 'rgba(0, 102, 204, 0.2)',
        success: '#00cc66',
        warning: '#ff9900',
        error: '#ff3366',
        info: '#0066cc'
      },
      typography: {
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        fontSize: {
          xs: '0.75rem',
          sm: '0.875rem',
          base: '1rem',
          lg: '1.125rem',
          xl: '1.25rem',
          '2xl': '1.5rem',
          '3xl': '1.875rem'
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
          normal: 1.5,
          relaxed: 1.75
        }
      },
      spacing: {
        xs: '0.25rem',
        sm: '0.5rem',
        md: '1rem',
        lg: '1.5rem',
        xl: '2rem',
        '2xl': '3rem',
        '3xl': '4rem'
      },
      borderRadius: {
        none: '0',
        sm: '0.25rem',
        md: '0.375rem',
        lg: '0.5rem',
        xl: '0.75rem',
        full: '9999px'
      }
    })
  }

  // 从主题创建CSS变量
  getThemeCSS(themeId: string): string {
    const theme = this.themes.get(themeId)
    if (!theme) return ''

    const css = []

    // 颜色变量
    Object.entries(theme.colors).forEach(([key, value]) => {
      if (typeof value === 'object') {
        Object.entries(value).forEach(([subKey, subValue]) => {
          css.push(`  --color-${key}-${subKey}: ${subValue};`)
        })
      } else {
        css.push(`  --color-${key}: ${value};`)
      }
    })

    // 字体变量
    css.push(`  --font-family: ${theme.typography.fontFamily};`)
    Object.entries(theme.typography.fontSize).forEach(([key, value]) => {
      css.push(`  --font-size-${key}: ${value};`)
    })

    return `.theme-${themeId} {\n${css.join('\n')}\n}`
  }

  // 初始化
  initialize() {
    const savedTheme = this.loadThemePreference()
    if (savedTheme && this.themes.has(savedTheme)) {
      this.setTheme(savedTheme)
    } else {
      this.setTheme('default-light')
    }
  }

  // 清理资源
  destroy() {
    this.themes.clear()
  }
}
