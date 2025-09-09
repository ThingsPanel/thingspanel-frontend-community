# 应用下载组件 (App Download Card)

## 简介

应用下载组件用于展示移动应用的下载信息，包括二维码和应用商店下载链接。这是一个纯展示型组件，无需配置数据源。

## 特性

- 📱 **移动应用下载**: 展示 App 下载二维码
- 🏪 **应用商店链接**: 支持 App Store 和 Google Play
- 🎨 **主题适配**: 支持明暗主题自动切换
- 🌍 **国际化**: 支持多语言文本显示
- 📏 **响应式**: 自适应不同容器尺寸
- ⚡ **零配置**: 无数据源依赖，开箱即用

## 快速使用

```vue
<script setup lang="ts">
import AppDownloadCard from '@/card2.1/components/statistics/app-download/AppDownloadCard.vue'
</script>

<template>
  <AppDownloadCard />
</template>
```

## 组件信息

- **类型**: `app-download`
- **分类**: 统计类组件
- **权限**: 不限
- **配置**: 无需数据源和组件配置
- **尺寸**: 默认 300x250px，最小 200x200px

## 迁移状态

✅ 已从 `builtin-card/app-download` 成功迁移至 Card2.1 系统  
✅ 保持完全向后兼容性  
✅ 支持历史数据访问