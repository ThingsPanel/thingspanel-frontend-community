<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'
import { embedNavigateBack, isStandaloneEmbedPage } from '@/utils/app-webview-bridge'

withDefaults(
  defineProps<{
    title: string
    showBack?: boolean
    rotatable?: boolean
  }>(),
  {
    showBack: true,
    rotatable: false
  }
)

const showEmbedNav = !isStandaloneEmbedPage()
const isLandscape = ref(false)
const statusBarHeight = Math.min(
  60,
  Math.max(0, Number(new URLSearchParams(window.location.search).get('statusBarHeight')) || 0)
)
const navStyle = {
  '--app-status-bar-height': `${statusBarHeight}px`
}

type PlusScreen = {
  lockOrientation: (orientation: 'landscape-primary' | 'portrait-primary') => void
}

function getPlusScreen(): PlusScreen | undefined {
  return (window as Window & { plus?: { screen?: PlusScreen } }).plus?.screen
}

async function lockOrientation(landscape: boolean) {
  const orientation = landscape ? 'landscape-primary' : 'portrait-primary'
  const plusScreen = getPlusScreen()
  if (plusScreen) {
    plusScreen.lockOrientation(orientation)
    return
  }

  const screenOrientation = screen.orientation as ScreenOrientation & {
    lock?: (value: 'landscape-primary' | 'portrait-primary') => Promise<void>
  }
  await screenOrientation.lock?.(orientation)
}

async function toggleOrientation() {
  isLandscape.value = !isLandscape.value
  try {
    await lockOrientation(isLandscape.value)
  } catch {
    isLandscape.value = !isLandscape.value
  }
}

function goBack() {
  embedNavigateBack(() => {
    if (window.history.length > 1) {
      window.history.back()
      return
    }
    window.location.href = `${window.location.origin}/visualization-app${window.location.search.replace(/[&?]standalone=1/, '')}`
  })
}

onBeforeUnmount(() => {
  if (isLandscape.value) {
    void lockOrientation(false)
  }
})
</script>

<template>
  <header v-if="showEmbedNav" class="visualization-app__embed-nav" :style="navStyle">
    <button
      v-if="showBack"
      type="button"
      class="visualization-app__embed-nav-back"
      aria-label="返回"
      @click="goBack"
    >
      <icon-mdi:chevron-left />
    </button>
    <span v-else class="visualization-app__embed-nav-spacer" aria-hidden="true" />
    <span class="visualization-app__embed-nav-title">{{ title }}</span>
    <button
      v-if="rotatable"
      type="button"
      class="visualization-app__embed-nav-rotate"
      aria-label="旋转屏幕"
      @click="toggleOrientation"
    >
      <icon-mdi:screen-rotation />
    </button>
  </header>
</template>

<style scoped src="@/views/visualization-app/styles.css"></style>
