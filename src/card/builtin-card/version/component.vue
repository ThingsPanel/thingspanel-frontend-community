<template>
  <div
    class="p-4 border rounded h-full flex flex-col justify-center items-center text-center"
  >
    <div
      class="p-6 rounded-lg border border-gray-300 dark:border-gray-700 shadow-md backdrop-blur-sm hover:shadow-lg transition-shadow duration-300 w-full bg-gradient-to-tr from-purple-100 via-blue-100 to-green-100 dark:from-gray-800 dark:to-slate-900"
    >
      <div class="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-3">
        <Icon icon="carbon:information-square-filled" class="mr-2 text-lg text-blue-600 dark:text-blue-400" />
        <span>{{ $t('card.versionInfo.title') }}</span>
      </div>
      <div class="flex flex-col items-center mt-4">
        <span class="text-gray-700 dark:text-gray-300 mb-1">{{ $t('card.versionInfo.currentVersion') }}</span>
        <span class="text-3xl font-bold text-gray-900 dark:text-white mb-3 tracking-wider">1.1.7</span>
        <n-tag type="success" size="medium" round class="animate-pulse">
          <template #icon>
            <Icon icon="carbon:checkmark-outline" class="text-lg"/>
          </template>
          {{ $t('card.versionInfo.latest') }}
        </n-tag>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { $t } from '@/locales';
import { Icon } from '@iconify/vue';
import { NTag } from 'naive-ui';

defineOptions({
  name: 'VersionCard'
});

</script>

<style scoped>
/* 微调动画效果 */
.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  50% {
    opacity: .7;
  }
}
</style>
