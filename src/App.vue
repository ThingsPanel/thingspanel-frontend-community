<script setup lang="ts">
import { computed } from 'vue'
import { NConfigProvider, darkTheme } from 'naive-ui'
import { useFullscreen } from '@vueuse/core'
import json from 'highlight.js/lib/languages/json'
import hljs from 'highlight.js/lib/core'
import { useAppStore } from './store/modules/app'
import { useThemeStore } from './store/modules/theme'
import { naiveDateLocales, naiveLocales } from './locales/naive'
import Content from './components/content/index.vue'

hljs.registerLanguage('json', json)

defineOptions({
  name: 'App'
})

const appStore = useAppStore()
const themeStore = useThemeStore()
useFullscreen()
const naiveDarkTheme = computed(() => (themeStore.darkMode ? darkTheme : undefined))

const naiveLocale = computed(() => {
  return naiveLocales[appStore.locale]
})

const naiveDateLocale = computed(() => {
  return naiveDateLocales[appStore.locale]
})

/**
 * 🔥 修复：禁用全局全屏监听器
 *
 * 原逻辑问题：当退出子元素全屏时，会误触发整个页面全屏
 * 现在：注释掉这个监听器，让各个组件自己管理全屏状态
 *
 * 原代码：
 * const handleFullScreenChange = () => {
 *   if (!document.fullscreenElement) {
 *     if (isFullscreen) {
 *       toggle()  // ❌ 会导致退出编辑器全屏后，立即进入页面全屏
 *     }
 *   }
 * }
 */

// 注释掉全局全屏监听器
// onMounted(() => {
//   document.addEventListener('fullscreenchange', handleFullScreenChange)
// })

// onBeforeUnmount(() => {
//   document.removeEventListener('fullscreenchange', handleFullScreenChange)
// })
</script>

<template>
  <NConfigProvider
    :hljs="hljs"
    :theme="naiveDarkTheme"
    :theme-overrides="themeStore.naiveTheme"
    :locale="naiveLocale"
    :date-locale="naiveDateLocale"
    class="h-full"
  >
    <NMessageProvider>
      <Content />
      <AppProvider>
        <RouterView class="bg-layout" />
      </AppProvider>
    </NMessageProvider>
  </NConfigProvider>
</template>
