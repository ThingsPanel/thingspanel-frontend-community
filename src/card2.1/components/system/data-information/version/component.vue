<template>
  <div class="h-full flex flex-col justify-center items-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-800 dark:to-slate-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-300">
    <!-- 标题栏 -->
    <div class="w-full flex items-center justify-between mb-6">
      <div class="flex items-center">
        <div class="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg mr-3">
          <Icon icon="mdi:information-outline" class="text-xl text-blue-600 dark:text-blue-400" />
        </div>
        <span class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ $t('card.versionInfo.title') }}</span>
      </div>

      <!-- GitHub 链接 -->
      <a
        href="https://github.com/ThingsPanel/thingspanel-frontend-community"
        target="_blank"
        rel="noopener noreferrer"
        class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
        :title="$t('card.versionInfo.visitGithub')"
      >
        <Icon icon="mdi:github" class="w-5 h-5 text-gray-600 dark:text-gray-400" />
      </a>
    </div>

    <!-- 版本信息展示区域 -->
    <div class="flex-1 flex flex-col items-center justify-center text-center space-y-4">
      <!-- 当前版本标签 -->
      <div class="text-sm text-gray-600 dark:text-gray-400">
        {{ $t('card.versionInfo.currentVersion') }}
      </div>

      <!-- 版本号 -->
      <div class="text-4xl font-bold text-gray-900 dark:text-white tracking-wider">
        {{ currentVersion }}
      </div>

      <!-- 版本描述 -->
      <div class="text-sm text-gray-600 dark:text-gray-400 text-center max-w-xs">
        {{ $t('card.versionInfo.description') }}
      </div>

      <!-- 版本状态标签 -->
      <div class="mt-4">
        <n-tag
          type="info"
          size="medium"
          round
          class="px-4 py-2 font-medium"
        >
          <template #icon>
            <Icon icon="mdi:tag-outline" class="text-base" />
          </template>
          {{ $t('card.versionInfo.stableVersion') }}
        </n-tag>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 版本信息组件 - 系统交互组件
 * 纯静态展示组件，显示当前系统版本信息，不需要API数据源
 */
import { computed } from 'vue'
import { Icon } from '@iconify/vue'
import { NTag } from 'naive-ui'
import { $t } from '@/locales'

// 静态版本配置（应该从配置文件或环境变量获取）
const currentVersion = computed(() => {
  // 可以从 package.json 或环境变量获取版本号
  return import.meta.env.VITE_APP_VERSION || 'v2.1.0'
})

defineOptions({
  name: 'VersionCard21'
})
</script>

<style scoped>
/* 脉冲动画效果 */
.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}
</style>