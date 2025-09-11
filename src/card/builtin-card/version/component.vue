<template>
  <div class="p-4 border rounded h-full flex flex-col justify-center items-center text-center">
    <div
      class="p-6 backdrop-blur-sm hover:shadow-lg transition-shadow duration-300 w-full dark:from-gray-800 dark:to-slate-900"
    >
      <div class="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-3">
        <div class="flex">
          <Icon icon="carbon:information-square-filled" class="mr-2 text-lg text-blue-600 dark:text-blue-400" />
          <span>{{ $t('card.versionInfo.title') }}</span>
        </div>

        <div>
          <a
            href="https://github.com/ThingsPanel/thingspanel-frontend-community"
            target="_blank"
            rel="noopener noreferrer"
          >
            <svg width="22" height="22" xmlns="http://www.w3.org/2000/svg">
              <path
                fill-rule="evenodd"
                clip-rule="evenodd"
                d="M11.054 0C4.95 0 0 4.98 0 11.14c0 4.92 3.16 9.09 7.55 10.57.55.11.75-.24.75-.53 0-.26-.02-1.14-.02-2.06-3.07.66-3.71-1.33-3.71-1.33-.49-1.29-1.23-1.62-1.23-1.62-1.01-.68.07-.68.07-.68 1.12.07 1.7 1.14 1.7 1.14.99 1.7 2.58 1.22 3.22.92.09-.72.38-1.22.69-1.49-2.45-.26-5.03-1.22-5.03-5.49 0-1.22.44-2.21 1.13-2.99-.11-.28-.49-1.42.11-2.95 0 0 .93-.3 3.04 1.14.88-.25 1.83-.37 2.77-.37.93 0 1.88.13 2.76.37 2.1-1.44 3.04-1.14 3.04-1.14.6 1.53.22 2.67.11 2.95.71.78 1.13 1.77 1.13 2.99 0 4.28-2.58 5.22-5.05 5.49.4.35.75 1.01.75 2.06 0 1.49-.02 2.69-.02 3.06 0 .29.2.65.75.53 4.39-1.48 7.55-5.64 7.55-10.56C22.11 4.98 17.14 0 11.054 0z"
                fill="#24292f"
              />
            </svg>
          </a>
        </div>
      </div>
      <div class="flex flex-col items-center mt-4">
        <span class="text-gray-700 dark:text-gray-300 mb-1">{{ $t('card.versionInfo.currentVersion') }}</span>
        <span class="text-3xl font-bold text-gray-900 dark:text-white mb-3 tracking-wider">{{ version }}</span>
        <n-tag type="success" size="medium" round class="animate-pulse">
          <template v-if="isLatestVersion" #icon>
            <Icon icon="carbon:checkmark-outline" class="text-lg" />
          </template>
          {{
            isLatestVersion
              ? $t('card.versionInfo.latest')
              : $t('card.versionInfo.latestVersion') + (latestVersion || '--')
          }}
        </n-tag>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { $t } from '@/locales'
import { Icon } from '@iconify/vue'
import { NTag } from 'naive-ui'
import { ref, onMounted } from 'vue'
import { getSysVersion } from '@/service/api/system-data'
import axios from 'axios'
const version = ref('')
const latestVersion = ref('')
const isLatestVersion = ref(false)
onMounted(async () => {
  // 尝试获取最新版本信息，失败时不影响后续逻辑
  try {
    const res = await axios.get('https://api.github.com/repos/ThingsPanel/thingspanel-backend-community/tags')
    if (res?.data?.[0]?.name) {
      latestVersion.value = res.data[0].name || '--'
    }
  } catch (error) {
    console.warn('获取最新版本信息失败:', error)
    latestVersion.value = '--'
  }

  // 获取当前系统版本
  const ver = await getSysVersion()
  if (ver) {
    version.value = ver?.data?.version || '--'
  }

  // 比较版本信息
  if (latestVersion.value && version.value && latestVersion.value === version.value) {
    if (process.env.NODE_ENV === 'development') {
    }
    isLatestVersion.value = true
  }
})
defineOptions({
  name: 'VersionCard'
})
</script>

<style scoped>
/* 微调动画效果 */
.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  50% {
    opacity: 0.7;
  }
}
</style>
