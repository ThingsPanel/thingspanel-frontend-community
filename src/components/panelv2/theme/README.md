# 多主题系统使用指南

## 概述

本多主题系统为 PanelV2 组件提供了灵活的主题切换和自定义功能。系统支持：

- 🎨 **多个预定义主题**：浅色、深色、蓝色、绿色、紫色等
- 🛠️ **自定义主题创建**：用户可以创建和保存自己的主题
- 🔄 **动态主题切换**：运行时无缝切换主题
- 💾 **主题持久化**：自动保存用户的主题选择
- 🎯 **CSS 变量驱动**：基于 CSS 自定义属性的响应式设计

## 快速开始

### 1. 基本使用

```vue
<template>
  <div>
    <!-- 主题选择器 -->
    <ThemeSelector 
      :show-preview="true" 
      default-theme="light"
      @theme-change="handleThemeChange"
    />
    
    <!-- 你的组件内容 -->
    <div class="my-component" :style="themeVars">
      <h1>标题</h1>
      <p>内容</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import ThemeSelector from './theme/ThemeSelector.vue'
import { getThemeByName, getThemeCSSVars } from './theme/ThemeExtension'

// 当前主题的 CSS 变量
const themeVars = computed(() => {
  const theme = getThemeByName('light') // 或从状态管理获取当前主题
  return theme ? getThemeCSSVars(theme) : {}
})

// 处理主题变更
const handleThemeChange = (themeName: string, theme: any) => {
  console.log('主题已切换到:', themeName, theme)
}
</script>

<style scoped>
.my-component {
  background-color: var(--theme-surface);
  color: var(--theme-on-surface);
  border: 1px solid var(--theme-border);
}
</style>
```

### 2. 在工具栏组件中使用

```vue
<!-- MainToolbar.vue -->
<template>
  <div class="main-toolbar" :style="toolbarTheme">
    <!-- 工具栏内容 -->
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useThemeStore } from '@/store/modules/theme'
import { getThemeByName, getThemeCSSVars } from '../theme/ThemeExtension'

const themeStore = useThemeStore()

// 根据当前主题模式获取对应的主题
const toolbarTheme = computed(() => {
  const themeName = themeStore.isDark ? 'dark' : 'light'
  const theme = getThemeByName(themeName)
  return theme ? getThemeCSSVars(theme) : {}
})
</script>

<style scoped>
.main-toolbar {
  background-color: var(--toolbar-bg);
  border-bottom: 1px solid var(--toolbar-border);
  box-shadow: 0 2px 4px var(--toolbar-shadow);
}
</style>
```

## 创建自定义主题

### 1. 编程方式创建

```typescript
import { registerTheme, applyTheme } from './theme/ThemeExtension'

// 定义自定义主题
const myCustomTheme = {
  name: 'ocean',
  displayName: '海洋主题',
  colors: {
    primary: '#0ea5e9',
    secondary: '#06b6d4',
    accent: '#22d3ee',
    
    background: '#f0f9ff',
    surface: '#e0f2fe',
    toolbar: '#f0f9ff',
    panel: '#f0f9ff',
    
    onBackground: '#0c4a6e',
    onSurface: '#075985',
    onPrimary: '#ffffff',
    
    border: '#7dd3fc',
    divider: '#38bdf8',
    
    success: '#059669',
    warning: '#d97706',
    error: '#dc2626',
    info: '#0284c7'
  },
  shadows: {
    toolbar: 'rgba(14, 165, 233, 0.1)',
    panel: 'rgba(14, 165, 233, 0.1)',
    modal: 'rgba(14, 165, 233, 0.15)'
  }
}

// 注册主题
registerTheme(myCustomTheme)

// 应用主题
applyTheme('ocean')
```

### 2. 使用主题选择器创建

用户可以通过 `ThemeSelector` 组件的界面创建自定义主题：

1. 点击"自定义主题"按钮
2. 输入主题名称
3. 选择各种颜色
4. 点击"保存主题"

## 可用的 CSS 变量

主题系统提供以下 CSS 变量：

### 基础颜色
- `--theme-primary`: 主色调
- `--theme-secondary`: 次要色
- `--theme-accent`: 强调色

### 背景颜色
- `--theme-background`: 页面背景
- `--theme-surface`: 表面背景
- `--toolbar-bg`: 工具栏背景
- `--panel-bg`: 面板背景

### 文本颜色
- `--theme-on-background`: 背景上的文本
- `--theme-on-surface`: 表面上的文本
- `--theme-on-primary`: 主色上的文本

### 边框和分割线
- `--theme-border`: 边框颜色
- `--theme-divider`: 分割线颜色
- `--toolbar-border`: 工具栏边框
- `--panel-border`: 面板边框
- `--divider-color`: 分割线颜色

### 状态颜色
- `--theme-success`: 成功状态
- `--theme-warning`: 警告状态
- `--theme-error`: 错误状态
- `--theme-info`: 信息状态

### 阴影
- `--toolbar-shadow`: 工具栏阴影
- `--panel-shadow`: 面板阴影
- `--modal-shadow`: 模态框阴影

## 预定义主题

系统内置了以下主题：

### 1. 浅色主题 (light)
- 清爽的白色背景
- 适合日间使用
- 高对比度文本

### 2. 深色主题 (dark)
- 深灰色背景
- 适合夜间使用
- 护眼设计

### 3. 蓝色主题 (blue)
- 蓝色调设计
- 专业商务风格
- 冷色调配色

### 4. 绿色主题 (green)
- 绿色调设计
- 自然清新风格
- 护眼绿色

### 5. 紫色主题 (purple)
- 紫色调设计
- 优雅神秘风格
- 创意设计感

## 与现有主题系统集成

### 1. 与 useThemeStore 集成

```typescript
// 在 store/modules/theme/index.ts 中扩展
import { applyTheme, getThemeByName } from '@/components/panelv2/theme/ThemeExtension'

export const useThemeStore = defineStore(SetupStoreId.Theme, () => {
  // 现有代码...
  
  // 添加多主题支持
  const currentCustomTheme = ref('light')
  
  const setCustomTheme = (themeName: string) => {
    currentCustomTheme.value = themeName
    applyTheme(themeName)
  }
  
  return {
    // 现有返回值...
    currentCustomTheme,
    setCustomTheme
  }
})
```

### 2. 在组件中使用

```vue
<script setup lang="ts">
import { useThemeStore } from '@/store/modules/theme'
import { getThemeCSSVars, getThemeByName } from './theme/ThemeExtension'

const themeStore = useThemeStore()

// 结合现有的 darkMode 和新的多主题系统
const combinedTheme = computed(() => {
  // 如果用户选择了自定义主题，使用自定义主题
  if (themeStore.currentCustomTheme && themeStore.currentCustomTheme !== 'auto') {
    const customTheme = getThemeByName(themeStore.currentCustomTheme)
    if (customTheme) {
      return getThemeCSSVars(customTheme)
    }
  }
  
  // 否则使用原有的 dark/light 逻辑
  const themeName = themeStore.isDark ? 'dark' : 'light'
  const theme = getThemeByName(themeName)
  return theme ? getThemeCSSVars(theme) : {}
})
</script>
```

## 最佳实践

### 1. 组件设计
- 始终使用 CSS 变量而不是硬编码颜色
- 为所有颜色属性提供回退值
- 使用语义化的变量名

```css
/* 好的做法 */
.button {
  background-color: var(--theme-primary, #646cff);
  color: var(--theme-on-primary, #ffffff);
  border: 1px solid var(--theme-border, #e5e7eb);
}

/* 避免的做法 */
.button {
  background-color: #646cff;
  color: white;
  border: 1px solid #ccc;
}
```

### 2. 主题创建
- 确保颜色对比度符合无障碍标准
- 测试主题在不同组件中的效果
- 提供有意义的主题名称

### 3. 性能优化
- 避免频繁切换主题
- 使用 CSS 变量的原生性能优势
- 合理使用主题缓存

## 故障排除

### 1. 主题不生效
- 检查 CSS 变量是否正确定义
- 确认主题已正确注册
- 验证 CSS 选择器优先级

### 2. 颜色显示异常
- 检查颜色值格式是否正确
- 确认浏览器支持 CSS 变量
- 验证主题对象结构

### 3. 自定义主题丢失
- 检查本地存储是否被清除
- 确认主题序列化/反序列化正确
- 验证主题注册时机

## 扩展功能

### 1. 主题动画
```css
.theme-transition {
  transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease;
}
```

### 2. 主题预设
```typescript
// 可以创建主题预设集合
const themePresets = {
  business: ['light', 'dark', 'blue'],
  creative: ['purple', 'green', 'custom-rainbow'],
  minimal: ['light', 'dark']
}
```

### 3. 主题导入/导出
```typescript
// 导出主题配置
export function exportTheme(themeName: string): string {
  const theme = getThemeByName(themeName)
  return JSON.stringify(theme, null, 2)
}

// 导入主题配置
export function importTheme(themeJson: string): void {
  const theme = JSON.parse(themeJson)
  registerTheme(theme)
}
```

这个多主题系统为你的应用提供了强大而灵活的主题定制能力，让用户能够根据自己的喜好和需求创建独特的视觉体验。