<template>
  <div class="p-4 border rounded flex flex-col items-center justify-center h-full">
    <div class="text-lg font-semibold mb-4">{{ $t('card.appDownload.title') }}</div>
    <div class="flex items-center justify-center space-x-4 mb-4">
      <img :src="download_app" alt="QR Code" class="w-24 h-24" />
      <div class="flex flex-col space-y-2">
        <!-- 你可能需要替换为实际的 App Store 图标 -->
        <img :src="app_store" alt="App Store" class="h-10 cursor-pointer" />
        <!-- 你可能需要替换为实际的 Google Play 图标 -->
        <img :src="google_pla" alt="Google Play" class="h-10 cursor-pointer" />
      </div>
    </div>
    <div>{{ $t('card.appDownload.scanOrClick') }}</div>
  </div>
</template>

<script setup lang="ts">
import { $t } from '@/locales'
import download_app from './download_app.png'
import app_store from './placeholder-app-store.png'
import google_pla from './placeholder-google-play.png'
// import { ref } from 'vue';
// import { getLatestTelemetryData } from '@/service/api';

defineOptions({
  name: 'AppDownloadCard'
})
</script>

<style scoped>
/* 在这里添加组件的样式 */
img {
  /* 防止图片被拉伸 */
  object-fit: contain;
}
</style>
