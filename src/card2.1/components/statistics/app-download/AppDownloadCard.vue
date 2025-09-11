<!--
  应用下载组件 (App Download Card)
  迁移自 builtin-card/app-download，保持功能一致性
  展示移动应用下载二维码和应用商店链接
-->
<template>
  <div class="app-download-card">
    <!-- 标题区域 -->
    <div class="app-download-title">
      {{ $t('card.appDownload.title') }}
    </div>

    <!-- 内容展示区域 -->
    <div class="app-download-content">
      <!-- 二维码区域 -->
      <div class="qr-code-section">
        <img :src="downloadAppImage" alt="App Download QR Code" class="qr-code-image" />
      </div>

      <!-- 应用商店链接区域 -->
      <div class="app-store-section">
        <!-- App Store 下载链接 -->
        <img :src="appStoreImage" alt="Download on App Store" class="store-badge" @click="handleAppStoreClick" />

        <!-- Google Play 下载链接 -->
        <img :src="googlePlayImage" alt="Get it on Google Play" class="store-badge" @click="handleGooglePlayClick" />
      </div>
    </div>

    <!-- 说明文字 -->
    <div class="app-download-description">
      {{ $t('card.appDownload.scanOrClick') }}
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 应用下载组件
 * 纯展示型组件，按照原组件写死接口逻辑（无数据源需求）
 */

import { useI18n } from 'vue-i18n'
import { useThemeStore } from '@/store/modules/theme'

// 🚨 严格遵循项目规范：导入图片资源
import downloadAppImage from '@/card2.1/components/statistics/app-download/download_app.png'
import appStoreImage from '@/card2.1/components/statistics/app-download/placeholder-app-store.png'
import googlePlayImage from '@/card2.1/components/statistics/app-download/placeholder-google-play.png'

// 组件基本设置
defineOptions({
  name: 'AppDownloadCard'
})

// 🚨 强制集成国际化系统
const { t } = useI18n()

// 🚨 强制集成主题系统
const themeStore = useThemeStore()

/**
 * 处理 App Store 点击事件
 * 按照原组件逻辑：目前为占位符功能
 */
const handleAppStoreClick = () => {
  // 🔄 保持与原组件一致：暂无实际跳转逻辑
  console.log('App Store clicked - 待配置实际下载链接')
}

/**
 * 处理 Google Play 点击事件
 * 按照原组件逻辑：目前为占位符功能
 */
const handleGooglePlayClick = () => {
  // 🔄 保持与原组件一致：暂无实际跳转逻辑
  console.log('Google Play clicked - 待配置实际下载链接')
}
</script>

<style scoped>
/* 
  应用下载组件样式
  🚨 严格遵循项目规范：使用主题变量，支持明暗主题切换
*/

.app-download-card {
  /* 容器基础样式 */
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 16px;

  /* 🚨 主题系统集成 - 使用 CSS 变量 */
  background-color: var(--card-color);
  color: var(--text-color);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);

  /* 防止内容溢出 */
  box-sizing: border-box;
  overflow: hidden;
}

.app-download-title {
  /* 标题样式 */
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 16px;
  text-align: center;

  /* 主题适配 */
  color: var(--text-color);
}

.app-download-content {
  /* 主内容区域 */
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.qr-code-section {
  /* 二维码区域 */
  display: flex;
  align-items: center;
  justify-content: center;
}

.qr-code-image {
  /* 二维码图片样式 */
  width: 96px;
  height: 96px;
  object-fit: contain;

  /* 主题适配 - 二维码在暗色模式下的处理 */
  filter: var(--image-filter, none);
}

.app-store-section {
  /* 应用商店链接区域 */
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
}

.store-badge {
  /* 应用商店徽章样式 */
  height: 40px;
  cursor: pointer;
  object-fit: contain;
  transition:
    transform 0.2s ease,
    opacity 0.2s ease;

  /* 主题适配 */
  filter: var(--image-filter, none);
}

.store-badge:hover {
  /* 悬停效果 */
  transform: scale(1.05);
  opacity: 0.8;
}

.store-badge:active {
  /* 点击效果 */
  transform: scale(0.98);
}

.app-download-description {
  /* 说明文字样式 */
  font-size: 14px;
  text-align: center;
  line-height: 1.4;

  /* 主题适配 */
  color: var(--text-color-2);
}

/* 响应式设计 - 小尺寸适配 */
@container (max-width: 250px) {
  .app-download-content {
    flex-direction: column;
    gap: 12px;
  }

  .qr-code-image {
    width: 80px;
    height: 80px;
  }

  .store-badge {
    height: 36px;
  }

  .app-download-title {
    font-size: 16px;
    margin-bottom: 12px;
  }
}

/* 暗色主题特定样式 */
[data-theme='dark'] .app-download-card {
  /* 暗色模式下的边框和阴影 */
  border-color: var(--border-color);
  box-shadow: var(--box-shadow-dark);
}

[data-theme='dark'] .qr-code-image,
[data-theme='dark'] .store-badge {
  /* 暗色模式下图片的亮度调整 */
  filter: brightness(0.9);
}
</style>
