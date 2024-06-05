<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted } from 'vue';
import { NConfigProvider, darkTheme } from 'naive-ui';
import { useFullscreen } from '@vueuse/core';
import json from 'highlight.js/lib/languages/json';
import hljs from 'highlight.js/lib/core';
import { useAppStore } from './store/modules/app';
import { useThemeStore } from './store/modules/theme';
import { naiveDateLocales, naiveLocales } from './locales/naive';
import Content from './components/content/index.vue';

hljs.registerLanguage('json', json);
defineOptions({
  name: 'App'
});
const appStore = useAppStore();
const themeStore = useThemeStore();
const { isFullscreen, toggle } = useFullscreen();
const naiveDarkTheme = computed(() => (themeStore.darkMode ? darkTheme : undefined));

const naiveLocale = computed(() => {
  return naiveLocales[appStore.locale];
});

const naiveDateLocale = computed(() => {
  return naiveDateLocales[appStore.locale];
});
const handleFullScreenChange = () => {
  if (!document.fullscreenElement) {
    if (isFullscreen) {
      toggle();
    }
  }
};

onMounted(() => {
  // 当组件挂载时，添加全屏变化事件的监听器
  document.addEventListener('fullscreenchange', handleFullScreenChange);
});

onBeforeUnmount(() => {
  // 当组件卸载前，移除全屏变化事件的监听器
  document.removeEventListener('fullscreenchange', handleFullScreenChange);
});
</script>

<template>
  <NMessageProvider>
    <Content />
  </NMessageProvider>
  <NConfigProvider
    :hljs="hljs"
    :theme="naiveDarkTheme"
    :theme-overrides="themeStore.naiveTheme"
    :locale="naiveLocale"
    :date-locale="naiveDateLocale"
    class="h-full"
  >
    <AppProvider>
      <RouterView class="bg-layout" />
    </AppProvider>
  </NConfigProvider>
</template>
