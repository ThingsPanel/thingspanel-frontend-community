<template>
  <div class="h-full flex flex-col justify-center items-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-800 dark:to-slate-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-300">
    <!-- 标题栏 -->
    <div class="w-full flex items-center justify-between mb-6">
      <div class="flex items-center">
        <div class="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg mr-3">
          <Icon icon="carbon:information-square-filled" class="text-xl text-blue-600 dark:text-blue-400" />
        </div>
        <span class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ $t('card.versionInfo.title') }}</span>
      </div>

      <!-- GitHub 链接 -->
      <a
        href="https://github.com/ThingsPanel/thingspanel-frontend-community"
        target="_blank"
        rel="noopener noreferrer"
        class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
      >
        <svg width="20" height="20" xmlns="http://www.w3.org/2000/svg" class="text-gray-600 dark:text-gray-400">
          <path
            fill-rule="evenodd"
            clip-rule="evenodd"
            d="M10.054 0C4.95 0 0 4.98 0 11.14c0 4.92 3.16 9.09 7.55 10.57.55.11.75-.24.75-.53 0-.26-.02-1.14-.02-2.06-3.07.66-3.71-1.33-3.71-1.33-.49-1.29-1.23-1.62-1.23-1.62-1.01-.68.07-.68.07-.68 1.12.07 1.7 1.14 1.7 1.14.99 1.7 2.58 1.22 3.22.92.09-.72.38-1.22.69-1.49-2.45-.26-5.03-1.22-5.03-5.49 0-1.22.44-2.21 1.13-2.99-.11-.28-.49-1.42.11-2.95 0 0 .93-.3 3.04 1.14.88-.25 1.83-.37 2.77-.37.93 0 1.88.13 2.76.37 2.1-1.44 3.04-1.14 3.04-1.14.6 1.53.22 2.67.11 2.95.71.78 1.13 1.77 1.13 2.99 0 4.28-2.58 5.22-5.05 5.49.4.35.75 1.01.75 2.06 0 1.49-.02 2.69-.02 3.06 0 .29.2.65.75.53 4.39-1.48 7.55-5.64 7.55-10.56C22.11 4.98 17.14 0 11.054 0z"
            fill="currentColor"
          />
        </svg>
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
        {{ version || '--' }}
      </div>

      <!-- 版本状态标签 -->
      <div class="mt-4">
        <n-tag
          :type="isLatestVersion ? 'success' : 'warning'"
          size="medium"
          round
          class="px-4 py-2 font-medium"
          :class="{ 'animate-pulse': isLatestVersion }"
        >
          <template #icon>
            <Icon
              :icon="isLatestVersion ? 'carbon:checkmark-outline' : 'carbon:warning'"
              class="text-base"
            />
          </template>
          {{
            isLatestVersion
              ? $t('card.versionInfo.latest')
              : `${$t('card.versionInfo.latestVersion')} ${latestVersion || '--'}`
          }}
        </n-tag>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 版本信息组件
 * 显示系统当前版本和最新版本信息，支持版本比较
 */
import { ref, onMounted } from 'vue'
import { Icon } from '@iconify/vue'
import { NTag } from 'naive-ui'
import { $t } from '@/locales'
import { getSysVersion } from '@/service/api/system-data'
import axios from 'axios'

// 响应式数据
const version = ref('')
const latestVersion = ref('')
const isLatestVersion = ref(false)

/**
 * 获取版本信息
 */
const fetchVersionInfo = async () => {
  try {
    // 获取最新版本信息
    try {
      const res = await axios.get('https://api.github.com/repos/ThingsPanel/thingspanel-backend-community/tags')
      if (res?.data?.[0]?.name) {
        latestVersion.value = res.data[0].name
      }
    } catch (error) {
      console.error('获取最新版本信息失败:', error)
      latestVersion.value = '--'
    }

    // 获取当前系统版本
    const ver = await getSysVersion()
    if (ver?.data?.version) {
      version.value = ver.data.version
    } else {
      version.value = '--'
    }

    // 比较版本信息
    if (latestVersion.value && version.value && latestVersion.value === version.value) {
      isLatestVersion.value = true
    }
  } catch (error) {
    console.error('获取版本信息失败:', error)
  }
}

onMounted(() => {
  fetchVersionInfo()
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