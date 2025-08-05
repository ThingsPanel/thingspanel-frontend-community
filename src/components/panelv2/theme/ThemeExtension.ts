/**
 * 主题扩展系统
 * 支持添加自定义主题和颜色方案
 */

// 定义主题类型
export interface CustomTheme {
  name: string
  displayName: string
  colors: {
    // 基础颜色
    primary: string
    secondary: string
    accent: string

    // 背景颜色
    background: string
    surface: string
    toolbar: string
    panel: string

    // 文本颜色
    onBackground: string
    onSurface: string
    onPrimary: string

    // 边框和分割线
    border: string
    divider: string

    // 状态颜色
    success: string
    warning: string
    error: string
    info: string
  }
  shadows: {
    toolbar: string
    panel: string
    modal: string
  }
}

// 预定义主题
export const themes: Record<string, CustomTheme> = {
  // 默认浅色主题
  light: {
    name: 'light',
    displayName: '浅色主题',
    colors: {
      primary: '#646cff',
      secondary: '#2080f0',
      accent: '#52c41a',

      background: '#f8fafc',
      surface: '#ffffff',
      toolbar: '#f8fafc',
      panel: '#f8fafc',

      onBackground: '#1f2937',
      onSurface: '#374151',
      onPrimary: '#ffffff',

      border: '#e5e7eb',
      divider: '#d1d5db',

      success: '#52c41a',
      warning: '#faad14',
      error: '#f5222d',
      info: '#2080f0'
    },
    shadows: {
      toolbar: 'rgba(0, 0, 0, 0.1)',
      panel: 'rgba(0, 0, 0, 0.1)',
      modal: 'rgba(0, 0, 0, 0.15)'
    }
  },

  // 默认深色主题
  dark: {
    name: 'dark',
    displayName: '深色主题',
    colors: {
      primary: '#646cff',
      secondary: '#2080f0',
      accent: '#52c41a',

      background: '#1f2937',
      surface: '#374151',
      toolbar: '#1f2937',
      panel: '#1f1f1f',

      onBackground: '#f9fafb',
      onSurface: '#e5e7eb',
      onPrimary: '#ffffff',

      border: '#4b5563',
      divider: '#6b7280',

      success: '#52c41a',
      warning: '#faad14',
      error: '#f5222d',
      info: '#2080f0'
    },
    shadows: {
      toolbar: 'rgba(0, 0, 0, 0.3)',
      panel: 'rgba(0, 0, 0, 0.3)',
      modal: 'rgba(0, 0, 0, 0.5)'
    }
  },

  // 蓝色主题
  blue: {
    name: 'blue',
    displayName: '蓝色主题',
    colors: {
      primary: '#1e40af',
      secondary: '#3b82f6',
      accent: '#06b6d4',

      background: '#eff6ff',
      surface: '#dbeafe',
      toolbar: '#eff6ff',
      panel: '#f0f9ff',

      onBackground: '#1e3a8a',
      onSurface: '#1e40af',
      onPrimary: '#ffffff',

      border: '#93c5fd',
      divider: '#60a5fa',

      success: '#059669',
      warning: '#d97706',
      error: '#dc2626',
      info: '#0284c7'
    },
    shadows: {
      toolbar: 'rgba(30, 64, 175, 0.1)',
      panel: 'rgba(30, 64, 175, 0.1)',
      modal: 'rgba(30, 64, 175, 0.15)'
    }
  },

  // 绿色主题
  green: {
    name: 'green',
    displayName: '绿色主题',
    colors: {
      primary: '#059669',
      secondary: '#10b981',
      accent: '#34d399',

      background: '#ecfdf5',
      surface: '#d1fae5',
      toolbar: '#ecfdf5',
      panel: '#f0fdf4',

      onBackground: '#064e3b',
      onSurface: '#065f46',
      onPrimary: '#ffffff',

      border: '#86efac',
      divider: '#4ade80',

      success: '#059669',
      warning: '#d97706',
      error: '#dc2626',
      info: '#0284c7'
    },
    shadows: {
      toolbar: 'rgba(5, 150, 105, 0.1)',
      panel: 'rgba(5, 150, 105, 0.1)',
      modal: 'rgba(5, 150, 105, 0.15)'
    }
  },

  // 紫色主题
  purple: {
    name: 'purple',
    displayName: '紫色主题',
    colors: {
      primary: '#7c3aed',
      secondary: '#8b5cf6',
      accent: '#a78bfa',

      background: '#faf5ff',
      surface: '#ede9fe',
      toolbar: '#faf5ff',
      panel: '#f3f4f6',

      onBackground: '#581c87',
      onSurface: '#6b21a8',
      onPrimary: '#ffffff',

      border: '#c4b5fd',
      divider: '#a78bfa',

      success: '#059669',
      warning: '#d97706',
      error: '#dc2626',
      info: '#0284c7'
    },
    shadows: {
      toolbar: 'rgba(124, 58, 237, 0.1)',
      panel: 'rgba(124, 58, 237, 0.1)',
      modal: 'rgba(124, 58, 237, 0.15)'
    }
  }
}

/**
 * 获取主题的 CSS 变量
 * @param theme 主题对象
 * @returns CSS 变量对象
 */
export function getThemeCSSVars(theme: CustomTheme): Record<string, string> {
  return {
    // 基础颜色
    '--theme-primary': theme.colors.primary,
    '--theme-secondary': theme.colors.secondary,
    '--theme-accent': theme.colors.accent,

    // 背景颜色
    '--theme-background': theme.colors.background,
    '--theme-surface': theme.colors.surface,
    '--toolbar-bg': theme.colors.toolbar,
    '--panel-bg': theme.colors.panel,

    // 文本颜色
    '--theme-on-background': theme.colors.onBackground,
    '--theme-on-surface': theme.colors.onSurface,
    '--theme-on-primary': theme.colors.onPrimary,

    // 边框和分割线
    '--theme-border': theme.colors.border,
    '--theme-divider': theme.colors.divider,
    '--toolbar-border': theme.colors.border,
    '--panel-border': theme.colors.border,
    '--divider-color': theme.colors.divider,

    // 状态颜色
    '--theme-success': theme.colors.success,
    '--theme-warning': theme.colors.warning,
    '--theme-error': theme.colors.error,
    '--theme-info': theme.colors.info,

    // 阴影
    '--toolbar-shadow': theme.shadows.toolbar,
    '--panel-shadow': theme.shadows.panel,
    '--modal-shadow': theme.shadows.modal
  }
}

/**
 * 注册新主题
 * @param theme 主题对象
 */
export function registerTheme(theme: CustomTheme): void {
  themes[theme.name] = theme
}

/**
 * 获取所有可用主题
 * @returns 主题列表
 */
export function getAvailableThemes(): CustomTheme[] {
  return Object.values(themes)
}

/**
 * 根据名称获取主题
 * @param name 主题名称
 * @returns 主题对象或 undefined
 */
export function getThemeByName(name: string): CustomTheme | undefined {
  return themes[name]
}

/**
 * 应用主题到 HTML 元素
 * @param themeName 主题名称
 * @param element 目标元素，默认为 document.documentElement
 */
export function applyTheme(themeName: string, element: HTMLElement = document.documentElement): void {
  const theme = getThemeByName(themeName)
  if (!theme) {
    console.warn(`主题 "${themeName}" 不存在`)
    return
  }

  const cssVars = getThemeCSSVars(theme)
  Object.entries(cssVars).forEach(([key, value]) => {
    element.style.setProperty(key, value)
  })
}

// 使用示例：
//
// // 1. 注册自定义主题
// registerTheme({
//   name: 'custom',
//   displayName: '自定义主题',
//   colors: {
//     primary: '#ff6b6b',
//     secondary: '#4ecdc4',
//     // ... 其他颜色配置
//   },
//   shadows: {
//     // ... 阴影配置
//   }
// })
//
// // 2. 应用主题
// applyTheme('blue')
//
// // 3. 在组件中使用
// const currentTheme = getThemeByName('green')
// const cssVars = getThemeCSSVars(currentTheme)
