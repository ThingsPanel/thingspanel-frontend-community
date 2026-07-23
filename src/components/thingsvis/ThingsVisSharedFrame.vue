<template>
  <div class="h-full w-full overflow-hidden">
    <iframe
      :src="frameUrl"
      class="h-full w-full border-0"
      scrolling="no"
      allow="fullscreen; autoplay"
      allowfullscreen
      referrerpolicy="no-referrer"
    ></iframe>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { buildThingsVisSharedFrameUrl } from '@/utils/thingsvis/share-url'

const props = defineProps<{
  id: string
  shareToken: string
}>()

const studioBase = (import.meta.env.VITE_THINGSVIS_STUDIO_URL as string) || 'http://localhost:3000/main'
const frameUrl = computed(() =>
  buildThingsVisSharedFrameUrl({
    studioBase,
    dashboardId: props.id,
    shareToken: props.shareToken
  })
)
</script>
