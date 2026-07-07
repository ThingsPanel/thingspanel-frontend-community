<script setup lang="ts">
import { embedNavigateBack, isStandaloneEmbedPage } from '@/utils/app-webview-bridge'

defineProps<{
  title: string
}>()

const showEmbedNav = !isStandaloneEmbedPage()

function goBack() {
  embedNavigateBack(() => {
    if (window.history.length > 1) {
      window.history.back()
      return
    }
    window.location.href = `${window.location.origin}/visualization-app${window.location.search.replace(/[&?]standalone=1/, '')}`
  })
}
</script>

<template>
  <header v-if="showEmbedNav" class="visualization-app__embed-nav">
    <button type="button" class="visualization-app__embed-nav-back" aria-label="返回" @click="goBack">
      <icon-mdi:chevron-left />
    </button>
    <span class="visualization-app__embed-nav-title">{{ title }}</span>
  </header>
</template>

<style scoped src="@/views/visualization-app/styles.css"></style>
