# 主题系统详解 - 主题适配与样式定制

本章详细介绍Card 2.1组件的主题系统，包括明暗主题支持、自定义主题创建和样式适配。

## 🎨 主题系统概述

Card 2.1主题系统基于CSS变量和Vue响应式系统，支持：
- **明暗主题切换** - 自动适配系统主题
- **自定义主题** - 支持品牌色定制
- **组件主题** - 组件级别的主题覆盖
- **响应式主题** - 根据设备特性自动调整

## 🌈 核心主题变量

### CSS变量定义
```css
/* 主题颜色变量 */
:root {
  /* 主色系 */
  --primary-color: #2080f0;
  --primary-color-hover: #4098fc;
  --primary-color-pressed: #1060c9;
  --primary-color-suppl: #4098fc;
  
  /* 信息色系 */
  --info-color: #2080f0;
  --success-color: #18a058;
  --warning-color: #f0a020;
  --error-color: #d03050;
  
  /* 文本色系 */
  --text-color-base: #000000d1;
  --text-color: #333639;
  --text-color-1: #333639;
  --text-color-2: #666a73;
  --text-color-3: #999ca6;
  --text-color-disabled: #bbbbbb;
  
  /* 背景色系 */
  --body-color: #ffffff;
  --card-color: #ffffff;
  --modal-color: #ffffff;
  --popover-color: #ffffff;
  --tag-color: #f5f5f5;
  
  /* 边框色系 */
  --border-color: #e0e0e6;
  --divider-color: #e0e0e6;
  --scrollbar-color: #e0e0e6;
  
  /* 阴影 */
  --box-shadow: 0 2px 8px 0px rgba(0, 0, 0, 0.12);
  --box-shadow-1: 0 1px 2px -2px rgba(0, 0, 0, 0.08);
  --box-shadow-2: 0 3px 6px -4px rgba(0, 0, 0, 0.12);
  --box-shadow-3: 0 6px 16px -8px rgba(0, 0, 0, 0.20);
  
  /* 布局 */
  --border-radius: 6px;
  --border-radius-small: 3px;
  --font-size: 14px;
  --font-size-small: 12px;
  --font-size-large: 16px;
}

/* 暗色主题 */
[data-theme="dark"] {
  /* 文本色系（暗色主题） */
  --text-color-base: #ffffffd1;
  --text-color: #ffffff;
  --text-color-1: #ffffff;
  --text-color-2: #ffffffb3;
  --text-color-3: #ffffff73;
  --text-color-disabled: #ffffff4d;
  
  /* 背景色系（暗色主题） */
  --body-color: #101014;
  --card-color: #18181c;
  --modal-color: #18181c;
  --popover-color: #1f1f23;
  --tag-color: #2a2a2e;
  
  /* 边框色系（暗色主题） */
  --border-color: #333333;
  --divider-color: #333333;
  --scrollbar-color: #333333;
  
  /* 阴影（暗色主题） */
  --box-shadow: 0 2px 8px 0px rgba(0, 0, 0, 0.24);
  --box-shadow-1: 0 1px 2px -2px rgba(0, 0, 0, 0.16);
  --box-shadow-2: 0 3px 6px -4px rgba(0, 0, 0, 0.24);
  --box-shadow-3: 0 6px 16px -8px rgba(0, 0, 0, 0.40);
}
```

## 🎛️ 主题状态管理

### 主题Store定义
```typescript
/**
 * 主题状态管理Store
 */
export const useThemeStore = defineStore('theme', () => {
  // 主题模式
  const mode = ref<'light' | 'dark' | 'auto'>('auto')
  const isDark = ref(false)
  
  // 主题色配置
  const primaryColor = ref('#2080f0')
  const customColors = ref<Record<string, string>>({})
  
  // 系统主题检测
  const mediaQuery = ref<MediaQueryList>()
  
  /**
   * 初始化主题系统
   */
  const initialize = () => {
    // 检测系统主题偏好
    if (typeof window !== 'undefined') {
      mediaQuery.value = window.matchMedia('(prefers-color-scheme: dark)')
      
      // 监听系统主题变化
      mediaQuery.value.addEventListener('change', handleSystemThemeChange)
      
      // 从本地存储恢复主题设置
      const savedMode = localStorage.getItem('theme-mode') as typeof mode.value
      if (savedMode) {
        mode.value = savedMode
      }
      
      const savedPrimaryColor = localStorage.getItem('theme-primary-color')
      if (savedPrimaryColor) {
        primaryColor.value = savedPrimaryColor
      }
      
      // 应用初始主题
      applyTheme()
    }
  }
  
  /**
   * 处理系统主题变化
   */
  const handleSystemThemeChange = (e: MediaQueryListEvent) => {
    if (mode.value === 'auto') {
      isDark.value = e.matches
      updateDocumentTheme()
    }
  }
  
  /**
   * 设置主题模式
   */
  const setThemeMode = (newMode: typeof mode.value) => {
    mode.value = newMode
    localStorage.setItem('theme-mode', newMode)
    applyTheme()
  }
  
  /**
   * 设置主色
   */
  const setPrimaryColor = (color: string) => {
    primaryColor.value = color
    localStorage.setItem('theme-primary-color', color)
    updateCSSVariables()
  }
  
  /**
   * 设置自定义颜色
   */
  const setCustomColor = (key: string, color: string) => {
    customColors.value[key] = color
    localStorage.setItem('theme-custom-colors', JSON.stringify(customColors.value))
    updateCSSVariables()
  }
  
  /**
   * 应用主题
   */
  const applyTheme = () => {
    switch (mode.value) {
      case 'light':
        isDark.value = false
        break
      case 'dark':
        isDark.value = true
        break
      case 'auto':
        isDark.value = mediaQuery.value?.matches || false
        break
    }
    
    updateDocumentTheme()
    updateCSSVariables()
  }
  
  /**
   * 更新文档主题属性
   */
  const updateDocumentTheme = () => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute(
        'data-theme',
        isDark.value ? 'dark' : 'light'
      )
    }
  }
  
  /**
   * 更新CSS变量
   */
  const updateCSSVariables = () => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement
      
      // 更新主色
      root.style.setProperty('--primary-color', primaryColor.value)
      root.style.setProperty('--primary-color-hover', lighten(primaryColor.value, 0.1))
      root.style.setProperty('--primary-color-pressed', darken(primaryColor.value, 0.1))
      
      // 更新自定义颜色
      Object.entries(customColors.value).forEach(([key, color]) => {
        root.style.setProperty(`--custom-${key}`, color)
      })
    }
  }
  
  /**
   * 获取Naive UI主题配置
   */
  const naiveTheme = computed(() => {
    const baseTheme = isDark.value ? darkTheme : lightTheme
    
    return {
      ...baseTheme,
      common: {
        ...baseTheme.common,
        primaryColor: primaryColor.value,
        primaryColorHover: lighten(primaryColor.value, 0.1),
        primaryColorPressed: darken(primaryColor.value, 0.1),
        ...customColors.value
      }
    }
  })
  
  return {
    // 状态
    mode: readonly(mode),
    isDark: readonly(isDark),
    primaryColor: readonly(primaryColor),
    customColors: readonly(customColors),
    naiveTheme,
    
    // 方法
    initialize,
    setThemeMode,
    setPrimaryColor,
    setCustomColor,
    applyTheme
  }
})
```

### 主题Hook
```typescript
/**
 * 组件主题Hook
 */
export function useComponentTheme(
  componentType?: string,
  customTheme?: Partial<ThemeConfig>
) {
  const themeStore = useThemeStore()
  
  // 组件主题配置
  const componentTheme = computed(() => {
    const baseTheme = {
      isDark: themeStore.isDark,
      primaryColor: themeStore.primaryColor,
      colors: {
        primary: themeStore.primaryColor,
        text: `var(--text-color)`,
        background: `var(--card-color)`,
        border: `var(--border-color)`
      }
    }
    
    // 合并自定义主题
    if (customTheme) {
      return mergeTheme(baseTheme, customTheme)
    }
    
    return baseTheme
  })
  
  // 主题样式计算
  const themeStyles = computed(() => ({
    '--component-primary-color': componentTheme.value.primaryColor,
    '--component-text-color': componentTheme.value.colors.text,
    '--component-bg-color': componentTheme.value.colors.background,
    '--component-border-color': componentTheme.value.colors.border
  }))
  
  // 主题类名
  const themeClasses = computed(() => ({
    'theme-light': !themeStore.isDark,
    'theme-dark': themeStore.isDark,
    [`theme-${componentType}`]: !!componentType
  }))
  
  return {
    theme: componentTheme,
    styles: themeStyles,
    classes: themeClasses,
    isDark: themeStore.isDark
  }
}
```

## 🎨 组件主题适配

### 基础组件主题适配
```vue
<template>
  <div 
    class="themed-component"
    :class="themeClasses"
    :style="themeStyles"
  >
    <div class="component-header">
      <h3 class="component-title">{{ title }}</h3>
      <div class="component-controls">
        <n-button 
          :type="isDark ? 'default' : 'primary'"
          @click="handleAction"
        >
          操作
        </n-button>
      </div>
    </div>
    
    <div class="component-content">
      <div class="data-display" :style="dataStyles">
        {{ formattedValue }}
      </div>
    </div>
    
    <div class="component-footer">
      <span class="status-indicator" :class="statusClass">
        {{ statusText }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useComponentTheme } from '@/card2.1/hooks/useComponentTheme'

interface Props {
  title?: string
  value?: number
  status?: 'normal' | 'warning' | 'error'
  primaryColor?: string
}

const props = withDefaults(defineProps<Props>(), {
  title: '主题组件',
  value: 0,
  status: 'normal'
})

// 自定义主题配置
const customTheme = computed(() => ({
  primaryColor: props.primaryColor,
  colors: {
    warning: '#f0a020',
    error: '#d03050',
    success: '#18a058'
  }
}))

// 使用主题Hook
const { theme, styles, classes, isDark } = useComponentTheme('data-display', customTheme.value)

// 主题相关计算属性
const themeClasses = computed(() => ({
  ...classes.value,
  'component-warning': props.status === 'warning',
  'component-error': props.status === 'error'
}))

const themeStyles = computed(() => ({
  ...styles.value,
  '--status-color': getStatusColor(props.status)
}))

const dataStyles = computed(() => ({
  color: theme.value.primaryColor,
  fontSize: isDark.value ? '18px' : '16px',
  fontWeight: isDark.value ? 'normal' : 'bold'
}))

const statusClass = computed(() => ({
  [`status-${props.status}`]: true,
  'status-dark': isDark.value
}))

const statusText = computed(() => {
  const statusMap = {
    normal: '正常',
    warning: '警告', 
    error: '错误'
  }
  return statusMap[props.status]
})

const formattedValue = computed(() => {
  return props.value.toLocaleString()
})

// 获取状态颜色
const getStatusColor = (status: string) => {
  const colorMap = {
    normal: theme.value.primaryColor,
    warning: theme.value.colors.warning || '#f0a020',
    error: theme.value.colors.error || '#d03050'
  }
  return colorMap[status] || theme.value.primaryColor
}

const handleAction = () => {
  // 处理操作
}
</script>

<style scoped>
.themed-component {
  background: var(--component-bg-color);
  border: 1px solid var(--component-border-color);
  border-radius: var(--border-radius);
  padding: 16px;
  transition: all 0.3s ease;
}

.component-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.component-title {
  margin: 0;
  color: var(--component-text-color);
  font-size: var(--font-size-large);
  font-weight: 600;
}

.component-content {
  margin: 16px 0;
  padding: 12px;
  background: var(--tag-color);
  border-radius: var(--border-radius-small);
}

.data-display {
  font-size: 24px;
  font-weight: bold;
  text-align: center;
  transition: color 0.3s ease;
}

.component-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}

.status-indicator {
  padding: 4px 8px;
  border-radius: var(--border-radius-small);
  font-size: var(--font-size-small);
  font-weight: 500;
  color: var(--status-color);
  background: color-mix(in srgb, var(--status-color) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--status-color) 30%, transparent);
}

/* 主题适配样式 */
.theme-dark .component-title {
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

.theme-dark .data-display {
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}

.theme-light .themed-component:hover {
  box-shadow: var(--box-shadow-2);
}

.theme-dark .themed-component:hover {
  box-shadow: var(--box-shadow-3);
}

/* 状态样式 */
.component-warning {
  border-color: color-mix(in srgb, #f0a020 30%, var(--border-color));
}

.component-error {
  border-color: color-mix(in srgb, #d03050 30%, var(--border-color));
}

/* 响应式适配 */
@media (max-width: 768px) {
  .themed-component {
    padding: 12px;
  }
  
  .data-display {
    font-size: 20px;
  }
}

/* 主题过渡动画 */
.themed-component * {
  transition: color 0.3s ease, background-color 0.3s ease, border-color 0.3s ease;
}
</style>
```

## 🎭 主题切换组件

### 主题切换器
```vue
<template>
  <div class="theme-switcher">
    <!-- 主题模式切换 -->
    <div class="theme-mode-section">
      <n-space align="center">
        <n-icon size="18">
          <PaletteOutline />
        </n-icon>
        <span>主题模式</span>
      </n-space>
      
      <n-radio-group 
        :value="themeStore.mode" 
        @update:value="themeStore.setThemeMode"
        size="small"
      >
        <n-radio value="light">
          <template #icon>
            <n-icon><SunnyOutline /></n-icon>
          </template>
          浅色
        </n-radio>
        <n-radio value="dark">
          <template #icon>
            <n-icon><MoonOutline /></n-icon>
          </template>
          深色
        </n-radio>
        <n-radio value="auto">
          <template #icon>
            <n-icon><ContrastOutline /></n-icon>
          </template>
          跟随系统
        </n-radio>
      </n-radio-group>
    </div>
    
    <!-- 主色选择 -->
    <div class="primary-color-section">
      <n-space align="center">
        <n-icon size="18">
          <ColorPaletteOutline />
        </n-icon>
        <span>主色</span>
      </n-space>
      
      <div class="color-preset-grid">
        <div
          v-for="color in presetColors"
          :key="color.value"
          class="color-preset-item"
          :class="{ active: themeStore.primaryColor === color.value }"
          :style="{ backgroundColor: color.value }"
          @click="themeStore.setPrimaryColor(color.value)"
        >
          <n-icon v-if="themeStore.primaryColor === color.value" color="white">
            <CheckmarkOutline />
          </n-icon>
        </div>
        
        <!-- 自定义颜色选择器 -->
        <div class="color-preset-item custom-color">
          <n-color-picker
            :value="themeStore.primaryColor"
            @update:value="themeStore.setPrimaryColor"
            :show-alpha="false"
            size="small"
          >
            <template #label>
              <n-icon><OptionsOutline /></n-icon>
            </template>
          </n-color-picker>
        </div>
      </div>
    </div>
    
    <!-- 主题预览 */
    <div class="theme-preview-section">
      <n-space align="center">
        <n-icon size="18">
          <EyeOutline />
        </n-icon>
        <span>预览</span>
      </n-space>
      
      <div class="preview-card" :class="{ dark: themeStore.isDark }">
        <div class="preview-header">
          <div class="preview-title">组件预览</div>
          <n-button size="tiny" :type="themeStore.isDark ? 'default' : 'primary'">
            按钮
          </n-button>
        </div>
        <div class="preview-content">
          <div class="preview-data" :style="{ color: themeStore.primaryColor }">
            42
          </div>
          <div class="preview-text">示例数据</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { 
  PaletteOutline, 
  SunnyOutline, 
  MoonOutline, 
  ContrastOutline,
  ColorPaletteOutline,
  CheckmarkOutline,
  OptionsOutline,
  EyeOutline 
} from '@vicons/ionicons5'
import { useThemeStore } from '@/store/modules/theme'

const themeStore = useThemeStore()

// 预设颜色
const presetColors = [
  { name: '默认蓝', value: '#2080f0' },
  { name: '成功绿', value: '#18a058' },
  { name: '警告橙', value: '#f0a020' },
  { name: '错误红', value: '#d03050' },
  { name: '紫色', value: '#722ed1' },
  { name: '青色', value: '#13c2c2' },
  { name: '粉色', value: '#eb2f96' },
  { name: '黄色', value: '#faad14' }
]
</script>

<style scoped>
.theme-switcher {
  padding: 16px;
  background: var(--card-color);
  border-radius: var(--border-radius);
  border: 1px solid var(--border-color);
}

.theme-mode-section,
.primary-color-section,
.theme-preview-section {
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--divider-color);
}

.theme-preview-section {
  border-bottom: none;
  margin-bottom: 0;
}

.color-preset-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin-top: 8px;
}

.color-preset-item {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid transparent;
  transition: all 0.3s ease;
}

.color-preset-item:hover {
  transform: scale(1.1);
}

.color-preset-item.active {
  border-color: var(--text-color-2);
  box-shadow: 0 0 0 2px var(--card-color);
}

.custom-color {
  background: var(--tag-color);
  border: 1px dashed var(--border-color);
}

.preview-card {
  margin-top: 8px;
  padding: 12px;
  background: var(--body-color);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  transition: all 0.3s ease;
}

.preview-card.dark {
  background: var(--modal-color);
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.preview-title {
  font-weight: 600;
  color: var(--text-color);
}

.preview-content {
  text-align: center;
  padding: 8px 0;
}

.preview-data {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 4px;
}

.preview-text {
  font-size: 12px;
  color: var(--text-color-2);
}
</style>
```

## 🎨 自定义主题创建

### 主题配置文件
```typescript
/**
 * 自定义主题配置
 */
export interface CustomThemeConfig {
  name: string
  description: string
  colors: {
    primary: string
    success: string
    warning: string
    error: string
    info: string
  }
  typography: {
    fontFamily: string
    fontSize: {
      small: string
      normal: string
      large: string
    }
  }
  spacing: {
    small: string
    normal: string
    large: string
  }
  borderRadius: {
    small: string
    normal: string
    large: string
  }
  shadows: {
    small: string
    normal: string
    large: string
  }
}

// 预定义主题
export const PRESET_THEMES: Record<string, CustomThemeConfig> = {
  default: {
    name: '默认主题',
    description: '系统默认的蓝色主题',
    colors: {
      primary: '#2080f0',
      success: '#18a058',
      warning: '#f0a020',
      error: '#d03050',
      info: '#2080f0'
    },
    typography: {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto',
      fontSize: {
        small: '12px',
        normal: '14px',
        large: '16px'
      }
    },
    spacing: {
      small: '8px',
      normal: '16px',
      large: '24px'
    },
    borderRadius: {
      small: '3px',
      normal: '6px',
      large: '12px'
    },
    shadows: {
      small: '0 1px 2px rgba(0, 0, 0, 0.05)',
      normal: '0 2px 8px rgba(0, 0, 0, 0.12)',
      large: '0 6px 16px rgba(0, 0, 0, 0.20)'
    }
  },
  
  green: {
    name: '自然绿',
    description: '清新的绿色主题',
    colors: {
      primary: '#52c41a',
      success: '#52c41a',
      warning: '#faad14',
      error: '#ff4d4f',
      info: '#1890ff'
    },
    // ... 其他配置
  },
  
  purple: {
    name: '优雅紫',
    description: '优雅的紫色主题',
    colors: {
      primary: '#722ed1',
      success: '#52c41a',
      warning: '#faad14',
      error: '#ff4d4f',
      info: '#1890ff'
    },
    // ... 其他配置
  }
}
```

### 主题生成器
```typescript
/**
 * 主题生成器
 */
export class ThemeGenerator {
  /**
   * 生成主题CSS
   */
  static generateThemeCSS(
    config: CustomThemeConfig,
    isDark: boolean = false
  ): string {
    const { colors, typography, spacing, borderRadius, shadows } = config
    
    const cssVars = [
      // 颜色变量
      `--primary-color: ${colors.primary};`,
      `--success-color: ${colors.success};`,
      `--warning-color: ${colors.warning};`,
      `--error-color: ${colors.error};`,
      `--info-color: ${colors.info};`,
      
      // 字体变量
      `--font-family: ${typography.fontFamily};`,
      `--font-size-small: ${typography.fontSize.small};`,
      `--font-size: ${typography.fontSize.normal};`,
      `--font-size-large: ${typography.fontSize.large};`,
      
      // 间距变量
      `--spacing-small: ${spacing.small};`,
      `--spacing-normal: ${spacing.normal};`,
      `--spacing-large: ${spacing.large};`,
      
      // 圆角变量
      `--border-radius-small: ${borderRadius.small};`,
      `--border-radius: ${borderRadius.normal};`,
      `--border-radius-large: ${borderRadius.large};`,
      
      // 阴影变量
      `--box-shadow-small: ${shadows.small};`,
      `--box-shadow: ${shadows.normal};`,
      `--box-shadow-large: ${shadows.large};`
    ]
    
    // 根据明暗主题调整色值
    if (isDark) {
      cssVars.push(
        `--text-color: #ffffff;`,
        `--card-color: #18181c;`,
        `--border-color: #333333;`
      )
    } else {
      cssVars.push(
        `--text-color: #333639;`,
        `--card-color: #ffffff;`,
        `--border-color: #e0e0e6;`
      )
    }
    
    return `
      [data-theme="${isDark ? 'dark' : 'light'}"][data-custom-theme="${config.name}"] {
        ${cssVars.join('\n        ')}
      }
    `
  }
  
  /**
   * 应用自定义主题
   */
  static applyCustomTheme(
    config: CustomThemeConfig,
    isDark: boolean = false
  ): void {
    const css = this.generateThemeCSS(config, isDark)
    
    // 创建或更新样式标签
    let styleElement = document.getElementById('custom-theme-style')
    if (!styleElement) {
      styleElement = document.createElement('style')
      styleElement.id = 'custom-theme-style'
      document.head.appendChild(styleElement)
    }
    
    styleElement.textContent = css
    
    // 设置文档属性
    document.documentElement.setAttribute('data-custom-theme', config.name)
  }
  
  /**
   * 从颜色生成主题
   */
  static generateThemeFromColor(
    primaryColor: string,
    themeName: string = 'custom'
  ): CustomThemeConfig {
    // 基于主色生成色彩方案
    const colors = this.generateColorScheme(primaryColor)
    
    return {
      name: themeName,
      description: `基于 ${primaryColor} 生成的自定义主题`,
      colors,
      typography: PRESET_THEMES.default.typography,
      spacing: PRESET_THEMES.default.spacing,
      borderRadius: PRESET_THEMES.default.borderRadius,
      shadows: PRESET_THEMES.default.shadows
    }
  }
  
  /**
   * 生成色彩方案
   */
  private static generateColorScheme(primaryColor: string) {
    // 使用色彩理论生成协调的配色方案
    return {
      primary: primaryColor,
      success: this.adjustColorHue(primaryColor, 120), // 绿色方向
      warning: this.adjustColorHue(primaryColor, 45),  // 橙色方向
      error: this.adjustColorHue(primaryColor, -30),   // 红色方向
      info: primaryColor
    }
  }
  
  /**
   * 调整颜色色相
   */
  private static adjustColorHue(color: string, hueDelta: number): string {
    // 颜色处理逻辑
    // 这里简化处理，实际应该使用专业的颜色处理库
    return color
  }
}
```

## ✅ 主题系统最佳实践

### 1. CSS变量使用规范
- 使用语义化的变量名
- 避免硬编码颜色值
- 提供明暗主题的完整变量集

### 2. 组件主题适配
- 所有组件必须支持主题切换
- 使用相对色值而非绝对色值
- 测试各种主题下的显示效果

### 3. 自定义主题开发
- 提供完整的色彩方案
- 考虑可访问性要求
- 保持品牌一致性

### 4. 性能优化
- 使用CSS变量避免重复计算
- 合理使用过渡动画
- 避免频繁的主题切换

## 🔗 相关文档

- [组件配置](./05-component-configuration.md) - 主题相关配置
- [最佳实践](./17-best-practices.md) - 主题开发规范
- [性能优化](./14-performance.md) - 主题性能优化

---

**统一的主题系统让界面更加协调美观！** 🎨