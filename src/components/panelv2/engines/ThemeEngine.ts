// 第二层：专业引擎层 - 主题引擎
// 职责：响应外部主题系统，不创建独立主题

import { ref, reactive, watch, computed, type Ref } from 'vue'

/**
 * 外部主题接口（如naive-ui主题）
 */
export interface ExternalTheme {
  name: string
  type: 'light' | 'dark' | 'auto'
  colors: {
    primary: string
    success: string
    warning: string
    error: string
    info: string
    // 背景色系
    bodyColor: string
    cardColor: string
    modalColor: string
    popoverColor: string
    // 文字色系
    textColorBase: string
    textColor1: string
    textColor2: string
    textColor3: string
    // 边框色系
    borderColor: string
    dividerColor: string
    // 其他常用色彩
    hoverColor?: string
    pressedColor?: string
    focusColor?: string
  }
  // 字体配置
  fonts?: {
    fontFamily?: string
    fontSize?: string
    fontWeight?: string
  }
  // 间距配置
  spacing?: {
    small?: string
    medium?: string
    large?: string
  }
  // 圆角配置
  borderRadius?: {
    small?: string
    medium?: string
    large?: string
  }
  // 阴影配置
  boxShadow?: {
    small?: string
    medium?: string
    large?: string
  }
}

/**
 * CSS变量映射
 */
export interface CSSVariables {
  // 面板背景色系
  '--panel-bg-color': string
  '--panel-card-color': string
  '--panel-modal-color': string

  // 面板文字色系
  '--panel-text-color': string
  '--panel-text-color-secondary': string
  '--panel-text-color-disabled': string

  // 面板边框色系
  '--panel-border-color': string
  '--panel-divider-color': string

  // 面板主题色系
  '--panel-primary-color': string
  '--panel-success-color': string
  '--panel-warning-color': string
  '--panel-error-color': string
  '--panel-info-color': string

  // 面板交互色系
  '--panel-hover-color': string
  '--panel-pressed-color': string
  '--panel-focus-color': string

  // 面板字体配置
  '--panel-font-family': string
  '--panel-font-size': string
  '--panel-font-weight': string

  // 面板间距配置
  '--panel-spacing-small': string
  '--panel-spacing-medium': string
  '--panel-spacing-large': string

  // 面板圆角配置
  '--panel-border-radius-small': string
  '--panel-border-radius-medium': string
  '--panel-border-radius-large': string

  // 面板阴影配置
  '--panel-box-shadow-small': string
  '--panel-box-shadow-medium': string
  '--panel-box-shadow-large': string

  // 更多面板特定变量...
  [key: string]: string
}

/**
 * 样式作用域
 */
export interface StyleScope {
  id: string
  element: HTMLElement
  variables: CSSVariables

  // 应用变量到作用域
  applyVariables(variables: CSSVariables): void

  // 清理作用域
  destroy(): void
}

/**
 * 主题变化处理器
 */
export type ThemeChangeHandler = (theme: ExternalTheme) => void

/**
 * 主题引擎接口
 */
export interface ThemeEngine {
  // 主题适配器（响应外部主题而非创建主题）
  adapter: {
    // 监听外部主题变更（如naive-ui主题切换）
    listenToExternalTheme(callback: (theme: ExternalTheme) => void): void
    // 获取当前外部主题
    getCurrentTheme(): ExternalTheme
    // 订阅主题变更事件
    subscribe(event: 'theme-change', handler: ThemeChangeHandler): void
    unsubscribe(event: 'theme-change', handler: ThemeChangeHandler): void
  }

  // 主题变量映射（将外部主题转换为内部CSS变量）
  mapping: {
    // 主题变量映射表
    variableMap: Record<string, string>
    // 动态映射函数
    mapThemeVariables(externalTheme: ExternalTheme): CSSVariables
    // 应用主题变量到DOM
    applyThemeVariables(variables: CSSVariables, scope?: string): void
  }

  // 组件样式隔离
  isolation: {
    // 为PanelV2创建隔离的样式作用域
    createStyleScope(scopeId: string): StyleScope
    // 在作用域内应用主题
    applyToScope(scope: StyleScope, variables: CSSVariables): void
    // 清理作用域
    destroyScope(scopeId: string): void
  }
}

/**
 * 主题引擎实现
 */
export class PanelThemeEngine implements ThemeEngine {
  // 当前主题状态
  private currentTheme = ref<ExternalTheme | null>(null)

  // 主题变更监听器
  private themeChangeHandlers = new Set<ThemeChangeHandler>()

  // 样式作用域管理
  private styleScopes = new Map<string, StyleScope>()

  // 主题变量映射配置
  private variableMapping: Record<string, string>

  constructor(customMapping?: Record<string, string>) {
    // 默认主题映射配置
    this.variableMapping = {
      '--panel-bg-color': 'bodyColor',
      '--panel-card-color': 'cardColor',
      '--panel-modal-color': 'modalColor',
      '--panel-text-color': 'textColorBase',
      '--panel-text-color-secondary': 'textColor2',
      '--panel-text-color-disabled': 'textColor3',
      '--panel-border-color': 'borderColor',
      '--panel-divider-color': 'dividerColor',
      '--panel-primary-color': 'primary',
      '--panel-success-color': 'success',
      '--panel-warning-color': 'warning',
      '--panel-error-color': 'error',
      '--panel-info-color': 'info',
      '--panel-hover-color': 'hoverColor',
      '--panel-pressed-color': 'pressedColor',
      '--panel-focus-color': 'focusColor',
      ...customMapping
    }

    this.initializeThemeDetection()
  }

  /**
   * 初始化主题检测
   */
  private initializeThemeDetection() {
    // 尝试从DOM中检测当前主题
    this.detectCurrentTheme()

    // 监听系统主题变化
    if (window.matchMedia) {
      const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)')
      darkModeQuery.addListener(() => {
        this.detectCurrentTheme()
      })
    }

    // 监听外部主题变化（通过CSS变量变化检测）
    this.observeCSSVariableChanges()
  }

  /**
   * 检测当前主题
   */
  private detectCurrentTheme() {
    const computedStyle = getComputedStyle(document.documentElement)

    // 构建主题对象
    const theme: ExternalTheme = {
      name: computedStyle.getPropertyValue('--theme-name')?.trim() || 'auto',
      type: this.detectThemeType(),
      colors: {
        primary: this.getCSSVariable(computedStyle, '--primary-color', '#1890ff'),
        success: this.getCSSVariable(computedStyle, '--success-color', '#52c41a'),
        warning: this.getCSSVariable(computedStyle, '--warning-color', '#faad14'),
        error: this.getCSSVariable(computedStyle, '--error-color', '#ff4d4f'),
        info: this.getCSSVariable(computedStyle, '--info-color', '#1890ff'),
        bodyColor: this.getCSSVariable(computedStyle, '--body-color', '#ffffff'),
        cardColor: this.getCSSVariable(computedStyle, '--card-color', '#ffffff'),
        modalColor: this.getCSSVariable(computedStyle, '--modal-color', '#ffffff'),
        popoverColor: this.getCSSVariable(computedStyle, '--popover-color', '#ffffff'),
        textColorBase: this.getCSSVariable(computedStyle, '--text-color-base', '#000000'),
        textColor1: this.getCSSVariable(computedStyle, '--text-color-1', '#333333'),
        textColor2: this.getCSSVariable(computedStyle, '--text-color-2', '#666666'),
        textColor3: this.getCSSVariable(computedStyle, '--text-color-3', '#999999'),
        borderColor: this.getCSSVariable(computedStyle, '--border-color', '#e8e8e8'),
        dividerColor: this.getCSSVariable(computedStyle, '--divider-color', '#e8e8e8'),
        hoverColor: this.getCSSVariable(computedStyle, '--hover-color', '#f5f5f5'),
        pressedColor: this.getCSSVariable(computedStyle, '--pressed-color', '#e6e6e6'),
        focusColor: this.getCSSVariable(computedStyle, '--focus-color', '#1890ff')
      },
      fonts: {
        fontFamily: this.getCSSVariable(
          computedStyle,
          '--font-family',
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        ),
        fontSize: this.getCSSVariable(computedStyle, '--font-size', '14px'),
        fontWeight: this.getCSSVariable(computedStyle, '--font-weight', '400')
      },
      spacing: {
        small: this.getCSSVariable(computedStyle, '--spacing-small', '8px'),
        medium: this.getCSSVariable(computedStyle, '--spacing-medium', '16px'),
        large: this.getCSSVariable(computedStyle, '--spacing-large', '24px')
      },
      borderRadius: {
        small: this.getCSSVariable(computedStyle, '--border-radius-small', '2px'),
        medium: this.getCSSVariable(computedStyle, '--border-radius-medium', '4px'),
        large: this.getCSSVariable(computedStyle, '--border-radius-large', '8px')
      },
      boxShadow: {
        small: this.getCSSVariable(computedStyle, '--box-shadow-small', '0 1px 3px rgba(0, 0, 0, 0.1)'),
        medium: this.getCSSVariable(computedStyle, '--box-shadow-medium', '0 2px 8px rgba(0, 0, 0, 0.15)'),
        large: this.getCSSVariable(computedStyle, '--box-shadow-large', '0 4px 16px rgba(0, 0, 0, 0.2)')
      }
    }

    this.updateCurrentTheme(theme)
  }

  /**
   * 检测主题类型
   */
  private detectThemeType(): 'light' | 'dark' | 'auto' {
    const computedStyle = getComputedStyle(document.documentElement)
    const bodyColor = this.getCSSVariable(computedStyle, '--body-color', '#ffffff')

    // 简单的亮暗判断：根据背景色亮度
    const rgb = this.hexToRgb(bodyColor)
    if (rgb) {
      const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000
      return brightness > 128 ? 'light' : 'dark'
    }

    return 'auto'
  }

  /**
   * 获取CSS变量值
   */
  private getCSSVariable(computedStyle: CSSStyleDeclaration, varName: string, defaultValue: string): string {
    const value = computedStyle.getPropertyValue(varName)?.trim()
    return value || defaultValue
  }

  /**
   * 颜色转换辅助函数
   */
  private hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16)
        }
      : null
  }

  /**
   * 观察CSS变量变化
   */
  private observeCSSVariableChanges() {
    // 使用MutationObserver监听style属性变化
    const observer = new MutationObserver(mutations => {
      let shouldUpdate = false
      mutations.forEach(mutation => {
        if (
          mutation.type === 'attributes' &&
          (mutation.attributeName === 'style' || mutation.attributeName === 'class')
        ) {
          shouldUpdate = true
        }
      })

      if (shouldUpdate) {
        setTimeout(() => this.detectCurrentTheme(), 50) // 延迟检测，确保样式已应用
      }
    })

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['style', 'class']
    })
  }

  /**
   * 更新当前主题
   */
  private updateCurrentTheme(theme: ExternalTheme) {
    const previousTheme = this.currentTheme.value
    this.currentTheme.value = theme

    // 通知主题变更监听器
    this.themeChangeHandlers.forEach(handler => {
      try {
        handler(theme)
      } catch (error) {
        console.error('主题变更处理器执行失败:', error)
      }
    })

    // 自动更新所有作用域
    this.updateAllScopes(theme)

    console.debug('主题已更新:', {
      from: previousTheme?.name,
      to: theme.name,
      type: theme.type
    })
  }

  /**
   * 更新所有样式作用域
   */
  private updateAllScopes(theme: ExternalTheme) {
    const variables = this.mapping.mapThemeVariables(theme)
    this.styleScopes.forEach(scope => {
      this.isolation.applyToScope(scope, variables)
    })
  }

  /**
   * 主题适配器实现
   */
  public adapter = {
    listenToExternalTheme: (callback: (theme: ExternalTheme) => void) => {
      this.themeChangeHandlers.add(callback)

      // 立即调用一次，传递当前主题
      if (this.currentTheme.value) {
        callback(this.currentTheme.value)
      }
    },

    getCurrentTheme: (): ExternalTheme => {
      return this.currentTheme.value || this.getDefaultTheme()
    },

    subscribe: (event: 'theme-change', handler: ThemeChangeHandler) => {
      if (event === 'theme-change') {
        this.themeChangeHandlers.add(handler)
      }
    },

    unsubscribe: (event: 'theme-change', handler: ThemeChangeHandler) => {
      if (event === 'theme-change') {
        this.themeChangeHandlers.delete(handler)
      }
    }
  }

  /**
   * 主题变量映射实现
   */
  public mapping = {
    variableMap: this.variableMapping,

    mapThemeVariables: (externalTheme: ExternalTheme): CSSVariables => {
      const variables: CSSVariables = {} as CSSVariables

      // 映射颜色变量
      Object.entries(this.variableMapping).forEach(([cssVar, themeKey]) => {
        const value = this.getNestedProperty(externalTheme, themeKey)
        if (value) {
          variables[cssVar as keyof CSSVariables] = value
        }
      })

      // 映射字体变量
      if (externalTheme.fonts) {
        if (externalTheme.fonts.fontFamily) {
          variables['--panel-font-family'] = externalTheme.fonts.fontFamily
        }
        if (externalTheme.fonts.fontSize) {
          variables['--panel-font-size'] = externalTheme.fonts.fontSize
        }
        if (externalTheme.fonts.fontWeight) {
          variables['--panel-font-weight'] = externalTheme.fonts.fontWeight
        }
      }

      // 映射间距变量
      if (externalTheme.spacing) {
        if (externalTheme.spacing.small) {
          variables['--panel-spacing-small'] = externalTheme.spacing.small
        }
        if (externalTheme.spacing.medium) {
          variables['--panel-spacing-medium'] = externalTheme.spacing.medium
        }
        if (externalTheme.spacing.large) {
          variables['--panel-spacing-large'] = externalTheme.spacing.large
        }
      }

      // 映射圆角变量
      if (externalTheme.borderRadius) {
        if (externalTheme.borderRadius.small) {
          variables['--panel-border-radius-small'] = externalTheme.borderRadius.small
        }
        if (externalTheme.borderRadius.medium) {
          variables['--panel-border-radius-medium'] = externalTheme.borderRadius.medium
        }
        if (externalTheme.borderRadius.large) {
          variables['--panel-border-radius-large'] = externalTheme.borderRadius.large
        }
      }

      // 映射阴影变量
      if (externalTheme.boxShadow) {
        if (externalTheme.boxShadow.small) {
          variables['--panel-box-shadow-small'] = externalTheme.boxShadow.small
        }
        if (externalTheme.boxShadow.medium) {
          variables['--panel-box-shadow-medium'] = externalTheme.boxShadow.medium
        }
        if (externalTheme.boxShadow.large) {
          variables['--panel-box-shadow-large'] = externalTheme.boxShadow.large
        }
      }

      return variables
    },

    applyThemeVariables: (variables: CSSVariables, scope?: string) => {
      const targetElement = scope ? (document.querySelector(scope) as HTMLElement) : document.documentElement

      if (targetElement) {
        Object.entries(variables).forEach(([key, value]) => {
          targetElement.style.setProperty(key, value)
        })
      }
    }
  }

  /**
   * 样式隔离实现
   */
  public isolation = {
    createStyleScope: (scopeId: string): StyleScope => {
      // 查找或创建作用域元素
      let element = document.getElementById(scopeId)
      if (!element) {
        element = document.createElement('div')
        element.id = scopeId
        element.className = 'panel-v2-theme-scope'
      }

      const scope: StyleScope = {
        id: scopeId,
        element,
        variables: {} as CSSVariables,

        applyVariables: (variables: CSSVariables) => {
          Object.entries(variables).forEach(([key, value]) => {
            element!.style.setProperty(key, value)
          })
          scope.variables = { ...variables }
        },

        destroy: () => {
          if (element && element.parentNode) {
            element.parentNode.removeChild(element)
          }
          this.styleScopes.delete(scopeId)
        }
      }

      this.styleScopes.set(scopeId, scope)

      // 立即应用当前主题
      if (this.currentTheme.value) {
        const variables = this.mapping.mapThemeVariables(this.currentTheme.value)
        scope.applyVariables(variables)
      }

      return scope
    },

    applyToScope: (scope: StyleScope, variables: CSSVariables) => {
      scope.applyVariables(variables)
    },

    destroyScope: (scopeId: string) => {
      const scope = this.styleScopes.get(scopeId)
      if (scope) {
        scope.destroy()
      }
    }
  }

  /**
   * 获取嵌套属性值
   */
  private getNestedProperty(obj: any, path: string): string | undefined {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined
    }, obj)
  }

  /**
   * 获取默认主题
   */
  private getDefaultTheme(): ExternalTheme {
    return {
      name: 'default',
      type: 'light',
      colors: {
        primary: '#1890ff',
        success: '#52c41a',
        warning: '#faad14',
        error: '#ff4d4f',
        info: '#1890ff',
        bodyColor: '#ffffff',
        cardColor: '#ffffff',
        modalColor: '#ffffff',
        popoverColor: '#ffffff',
        textColorBase: '#000000',
        textColor1: '#333333',
        textColor2: '#666666',
        textColor3: '#999999',
        borderColor: '#e8e8e8',
        dividerColor: '#e8e8e8',
        hoverColor: '#f5f5f5',
        pressedColor: '#e6e6e6',
        focusColor: '#1890ff'
      }
    }
  }

  /**
   * 销毁主题引擎
   */
  public destroy() {
    this.themeChangeHandlers.clear()
    this.styleScopes.forEach(scope => scope.destroy())
    this.styleScopes.clear()
  }
}

/**
 * 创建主题引擎实例
 */
export function createThemeEngine(customMapping?: Record<string, string>): PanelThemeEngine {
  return new PanelThemeEngine(customMapping)
}
