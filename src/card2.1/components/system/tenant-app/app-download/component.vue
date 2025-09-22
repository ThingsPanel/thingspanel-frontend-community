<template>
  <!-- 简化版本，与原版保持1:1功能匹配 -->
  <div class="p-4 border rounded flex flex-col items-center justify-center h-full">
    <div class="text-lg font-semibold mb-4">{{ $t('card.appDownload.title') }}</div>
    <div class="flex items-center justify-center space-x-4 mb-4">
      <img :src="downloadAppImage" alt="QR Code" class="w-24 h-24" />
      <div class="flex flex-col space-y-2">
        <!-- 移除点击功能，保持与原版一致的静态展示 -->
        <img :src="appStoreImage" alt="App Store" class="h-10 cursor-pointer" />
        <img :src="googlePlayImage" alt="Google Play" class="h-10 cursor-pointer" />
      </div>
    </div>
    <div>{{ $t('card.appDownload.scanOrClick') }}</div>
  </div>
</template>

<script setup lang="ts">
/**
 * 应用下载组件，与原版保持1:1功能匹配
 * 仅提供静态展示，不包含点击下载功能
 */
import { $t } from '@/locales'

// 导入图片资源，与原版保持一致的命名
import downloadAppImage from './download_app.png'
import appStoreImage from './placeholder-app-store.png'
import googlePlayImage from './placeholder-google-play.png'

defineOptions({
  name: 'AppDownloadCard'
})
</script>

<style scoped>
/* 与原版保持一致的简洁样式 */
img {
  /* 防止图片被拉伸 */
  object-fit: contain;
}
</style>