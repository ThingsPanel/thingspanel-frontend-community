<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import Player from 'xgplayer'
import 'xgplayer/dist/index.min.css'
import { $t } from '@/locales'

const domRef = ref<HTMLElement>()
const player = ref<Player>()

function renderXgPlayer() {
  if (!domRef.value) return
  const url = 'https://lf9-cdn-tos.bytecdntp.com/cdn/expire-1-M/byted-player-videos/1.0.0/xgplayer-demo.mp4'
  player.value = new Player({
    el: domRef.value,
    url,
    playbackRate: [0.5, 0.75, 1, 1.5, 2],
    fluid: true
  })
}

function destroyXgPlayer() {
  player.value?.destroy()
}

onMounted(() => {
  renderXgPlayer()
})

onUnmounted(() => {
  destroyXgPlayer()
})
</script>

<template>
  <div class="h-full">
    <NCard :title="$t('generate.videoPlayerPlugin')" :bordered="false" class="h-full rounded-8px shadow-sm">
      <div ref="domRef" class=""></div>
    </NCard>
  </div>
</template>

<style scoped></style>
