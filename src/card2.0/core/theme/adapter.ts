/**
 * Card 2.0 主题适配器
 * 将 Card 2.0 主题系统与项目现有主题系统集成
 */

import { computed, ref, watch } from 'vue'
import type { GlobalThemeOverrides } from 'naive-ui'
import { useThemeStore } from '@/store/modules/theme'
import { themeVars } from '@/theme/vars'

/**
 * Card 2.0 主题配置接口
 */
export interface ICard2ThemeConfig {
  /** 是否为深色主题 */
  isDark: boolean
  /** 主色调 */
  primaryColor: string
  /** Naive UI 主题覆盖 */
  naiveTheme: GlobalThemeOverrides
  /** CSS 变量 */
  cssVars: Record<string, string>
  /** 主题变量 */
  themeVars: typeof themeVars
}

/**
 * Card 2.0 主题适配器类
 */
export class Card2ThemeAdapter {
  private themeStore = useThemeStore()
  private _config = ref<ICard2ThemeConfig>(this.createThemeConfig())

  /**
   * 获取当前主题配置
   */
  get config() {
    return this._config.value
  }

  /**
   * 响应式主题配置
   */
  get reactiveConfig() {
    return computed(() => this._config.value)
  }

  /**
   * 初始化主题适配器
   */
  init() {
    // 监听主题变化
    watch(
      () => [this.themeStore.themeScheme, this.themeStore.themeColor, this.themeStore.naiveTheme],
      () => {
        this._config.value = this.createThemeConfig()
      },
      { immediate: true, deep: true }
    )

    console.log('[Card2ThemeAdapter] 主题适配器初始化完成')
  }

  /**
   * 创建主题配置
   */
  private createThemeConfig(): ICard2ThemeConfig {
    const isDark = this.themeStore.themeScheme === 'dark'
    const primaryColor = this.themeStore.themeColor
    const naiveTheme = this.themeStore.naiveTheme

    // 创建 CSS 变量映射
    const cssVars = this.createCssVars(isDark, primaryColor)

    return {
      isDark,
      primaryColor,
      naiveTheme,
      cssVars,
      themeVars
    }
  }

  /**
   * 创建 CSS 变量
   */
  private createCssVars(isDark: boolean, primaryColor: string): Record<string, string> {
    const baseVars = {
      // 主色调
      '--card2-primary-color': primaryColor,
      '--card2-primary-color-hover': this.adjustColor(primaryColor, isDark ? 0.1 : -0.1),
      '--card2-primary-color-pressed': this.adjustColor(primaryColor, isDark ? -0.1 : 0.1),

      // 背景色
      '--card2-bg-color': isDark ? '#18181c' : '#ffffff',
      '--card2-bg-color-secondary': isDark ? '#1f1f23' : '#fafafa',
      '--card2-bg-color-tertiary': isDark ? '#262629' : '#f5f5f5',

      // 文字颜色
      '--card2-text-color': isDark ? '#ffffffd1' : '#18181c',
      '--card2-text-color-secondary': isDark ? '#ffffff8a' : '#666666',
      '--card2-text-color-tertiary': isDark ? '#ffffff5c' : '#999999',

      // 边框颜色
      '--card2-border-color': isDark ? '#ffffff1a' : '#e0e0e6',
      '--card2-border-color-hover': isDark ? '#ffffff2e' : '#d0d0d6',

      // 阴影
      '--card2-box-shadow': isDark ? '0 2px 8px 0 rgba(0, 0, 0, 0.4)' : '0 2px 8px 0 rgba(0, 0, 0, 0.1)',
      '--card2-box-shadow-hover': isDark ? '0 4px 16px 0 rgba(0, 0, 0, 0.5)' : '0 4px 16px 0 rgba(0, 0, 0, 0.15)',

      // 状态颜色
      '--card2-success-color': '#52c41a',
      '--card2-warning-color': '#faad14',
      '--card2-error-color': '#f5222d',
      '--card2-info-color': '#2080f0',

      // 图表颜色
      '--card2-chart-color-1': '#5470c6',
      '--card2-chart-color-2': '#91cc75',
      '--card2-chart-color-3': '#fac858',
      '--card2-chart-color-4': '#ee6666',
      '--card2-chart-color-5': '#73c0de',
      '--card2-chart-color-6': '#3ba272',
      '--card2-chart-color-7': '#fc8452',
      '--card2-chart-color-8': '#9a60b4'
    }

    // 如果有现有的主题变量，进行映射
    if (themeVars.colors) {
      Object.assign(baseVars, {
        '--card2-layout-bg': themeVars.colors.layout,
        '--card2-container-bg': themeVars.colors.container,
        '--card2-base-text': themeVars.colors.base_text
      })
    }

    return baseVars
  }

  /**
   * 调整颜色亮度
   */
  private adjustColor(color: string, amount: number): string {
    // 简单的颜色调整实现
    // 在实际项目中，可以使用更复杂的颜色处理库
    const hex = color.replace('#', '')
    const num = parseInt(hex, 16)
    const r = Math.max(0, Math.min(255, (num >> 16) + Math.round(255 * amount)))
    const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00ff) + Math.round(255 * amount)))
    const b = Math.max(0, Math.min(255, (num & 0x0000ff) + Math.round(255 * amount)))
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
  }

  /**
   * 应用主题到 DOM
   */
  applyTheme(element?: HTMLElement) {
    const target = element || document.documentElement
    const vars = this.config.cssVars

    Object.entries(vars).forEach(([key, value]) => {
      target.style.setProperty(key, value)
    })
  }

  /**
   * 获取图表主题配置
   */
  getChartTheme() {
    const { isDark, cssVars } = this.config

    return {
      backgroundColor: 'transparent',
      textStyle: {
        color: cssVars['--card2-text-color']
      },
      title: {
        textStyle: {
          color: cssVars['--card2-text-color']
        }
      },
      legend: {
        textStyle: {
          color: cssVars['--card2-text-color-secondary']
        }
      },
      tooltip: {
        backgroundColor: cssVars['--card2-bg-color'],
        borderColor: cssVars['--card2-border-color'],
        textStyle: {
          color: cssVars['--card2-text-color']
        }
      },
      grid: {
        borderColor: cssVars['--card2-border-color']
      },
      categoryAxis: {
        axisLine: {
          lineStyle: {
            color: cssVars['--card2-border-color']
          }
        },
        axisTick: {
          lineStyle: {
            color: cssVars['--card2-border-color']
          }
        },
        axisLabel: {
          color: cssVars['--card2-text-color-secondary']
        },
        splitLine: {
          lineStyle: {
            color: cssVars['--card2-border-color']
          }
        }
      },
      valueAxis: {
        axisLine: {
          lineStyle: {
            color: cssVars['--card2-border-color']
          }
        },
        axisTick: {
          lineStyle: {
            color: cssVars['--card2-border-color']
          }
        },
        axisLabel: {
          color: cssVars['--card2-text-color-secondary']
        },
        splitLine: {
          lineStyle: {
            color: cssVars['--card2-border-color']
          }
        }
      },
      color: [
        cssVars['--card2-chart-color-1'],
        cssVars['--card2-chart-color-2'],
        cssVars['--card2-chart-color-3'],
        cssVars['--card2-chart-color-4'],
        cssVars['--card2-chart-color-5'],
        cssVars['--card2-chart-color-6'],
        cssVars['--card2-chart-color-7'],
        cssVars['--card2-chart-color-8']
      ]
    }
  }

  /**
   * 销毁适配器
   */
  destroy() {
    // 清理资源
    console.log('[Card2ThemeAdapter] 主题适配器已销毁')
  }
}

/**
 * 全局主题适配器实例
 */
export const card2ThemeAdapter = new Card2ThemeAdapter()

/**
 * 主题适配器 Hook
 */
export function useCard2Theme() {
  return {
    config: card2ThemeAdapter.reactiveConfig,
    applyTheme: card2ThemeAdapter.applyTheme.bind(card2ThemeAdapter),
    getChartTheme: card2ThemeAdapter.getChartTheme.bind(card2ThemeAdapter)
  }
}

/**
 * 初始化 Card 2.0 主题系统
 */
export function initCard2Theme() {
  card2ThemeAdapter.init()
  card2ThemeAdapter.applyTheme()
  return card2ThemeAdapter
}
