<template>
  <div class="h-full bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden">
    <!-- 卡片标题栏 -->
    <div class="flex items-center p-4 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-green-50 to-teal-50 dark:from-gray-700 dark:to-gray-800">
      <div class="flex items-center space-x-3">
        <div class="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
          <Icon icon="mdi:download" class="text-lg text-green-600 dark:text-green-400" />
        </div>
        <h3 class="text-base font-semibold text-gray-800 dark:text-gray-100">
          {{ $t('card.appDownload.title') }}
        </h3>
      </div>
    </div>

    <!-- 下载内容区域 -->
    <div class="flex-1 p-6 flex flex-col items-center justify-center text-center space-y-6">
      <!-- 二维码和下载按钮区域 -->
      <div class="flex items-center justify-center space-x-6">
        <!-- 二维码 -->
        <div class="flex flex-col items-center space-y-2">
          <div class="p-3 bg-gray-100 dark:bg-gray-700 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600">
            <img
              :src="downloadAppImage"
              alt="Download QR Code"
              class="w-20 h-20 object-contain"
            />
          </div>
          <div class="text-xs text-gray-500 dark:text-gray-400">
            {{ $t('card.appDownload.scanQR', '扫码下载') }}
          </div>
        </div>

        <!-- 分隔线 -->
        <div class="h-24 w-px bg-gray-200 dark:bg-gray-600"></div>

        <!-- 应用商店下载按钮 -->
        <div class="flex flex-col space-y-3">
          <!-- App Store -->
          <div
            class="group cursor-pointer transform hover:scale-105 transition-transform duration-200"
            @click="downloadFromAppStore"
          >
            <img
              :src="appStoreImage"
              alt="Download from App Store"
              class="h-10 object-contain hover:opacity-80 transition-opacity"
            />
          </div>

          <!-- Google Play -->
          <div
            class="group cursor-pointer transform hover:scale-105 transition-transform duration-200"
            @click="downloadFromGooglePlay"
          >
            <img
              :src="googlePlayImage"
              alt="Download from Google Play"
              class="h-10 object-contain hover:opacity-80 transition-opacity"
            />
          </div>
        </div>
      </div>

      <!-- 提示文字 -->
      <div class="text-sm text-gray-600 dark:text-gray-400">
        {{ $t('card.appDownload.scanOrClick') }}
      </div>

      <!-- 功能说明 -->
      <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 w-full max-w-sm">
        <div class="flex items-center space-x-2 mb-2">
          <Icon icon="mdi:information-outline" class="text-blue-600 dark:text-blue-400 text-sm" />
          <span class="text-sm font-medium text-blue-900 dark:text-blue-100">
            {{ $t('card.appDownload.features', '应用功能') }}
          </span>
        </div>
        <ul class="text-xs text-blue-800 dark:text-blue-200 space-y-1">
          <li class="flex items-center space-x-1">
            <Icon icon="mdi:check-circle-outline" class="text-xs flex-shrink-0" />
            <span>{{ $t('card.appDownload.feature1', '实时设备监控') }}</span>
          </li>
          <li class="flex items-center space-x-1">
            <Icon icon="mdi:check-circle-outline" class="text-xs flex-shrink-0" />
            <span>{{ $t('card.appDownload.feature2', '告警消息推送') }}</span>
          </li>
          <li class="flex items-center space-x-1">
            <Icon icon="mdi:check-circle-outline" class="text-xs flex-shrink-0" />
            <span>{{ $t('card.appDownload.feature3', '数据可视化') }}</span>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 应用下载组件
 * 提供移动应用的下载入口，包含二维码和应用商店链接
 */
import { Icon } from '@iconify/vue'
import { $t } from '@/locales'
import { useMessage } from 'naive-ui'

// 导入图片资源
import downloadAppImage from './download_app.png'
import appStoreImage from './placeholder-app-store.png'
import googlePlayImage from './placeholder-google-play.png'

// 使用消息 API
const message = useMessage()

/**
 * 从 App Store 下载
 */
const downloadFromAppStore = () => {
  // 这里应该是实际的 App Store 链接
  const appStoreUrl = 'https://apps.apple.com/app/thingspanel'

  try {
    window.open(appStoreUrl, '_blank')
  } catch (error) {
    console.error('打开App Store失败:', error)
    message.info($t('card.appDownload.linkNotAvailable', '下载链接暂未配置'))
  }
}

/**
 * 从 Google Play 下载
 */
const downloadFromGooglePlay = () => {
  // 这里应该是实际的 Google Play 链接
  const googlePlayUrl = 'https://play.google.com/store/apps/details?id=com.thingspanel'

  try {
    window.open(googlePlayUrl, '_blank')
  } catch (error) {
    console.error('打开Google Play失败:', error)
    message.info($t('card.appDownload.linkNotAvailable', '下载链接暂未配置'))
  }
}

defineOptions({
  name: 'AppDownloadCard21'
})
</script>

<style scoped>
/* 图片优化 */
img {
  object-fit: contain;
  user-select: none;
}

/* hover 效果增强 */
.group:hover img {
  filter: brightness(1.1);
}

/* 响应式调整 */
@media (max-width: 640px) {
  .space-x-6 {
    flex-direction: column;
    space-x: 0;
    gap: 1.5rem;
  }

  .h-24 {
    height: 1px;
    width: 60px;
    transform: rotate(90deg);
  }
}
</style>