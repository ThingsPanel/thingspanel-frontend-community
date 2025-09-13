<template>
  <n-card class="video-player" :style="cardStyle" embedded>
    <div v-if="config.showTitle" class="player-header">
      {{ displayData.title || config.title }}
    </div>
    
    <div class="player-container">
      <div class="video-placeholder">
        <n-icon size="64" color="var(--text-color-3)">
          <Play />
        </n-icon>
        <div class="video-info">
          <div>{{ displayData.url ? '视频源已加载' : '暂无视频源' }}</div>
          <div class="video-url">{{ displayData.url || '未设置视频链接' }}</div>
        </div>
      </div>
    </div>
    
    <div v-if="config.showControls" class="player-controls">
      <n-button size="small" :disabled="!displayData.url" @click="playVideo">播放</n-button>
      <n-button size="small" @click="pauseVideo">暂停</n-button>
      <n-button size="small" @click="stopVideo">停止</n-button>
    </div>
  </n-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { NCard, NIcon, NButton, useMessage } from 'naive-ui'
import { Play } from '@vicons/ionicons5'
import { useCard2Props } from '@/card2.1/hooks'
import type { VideoPlayerConfig } from './settingConfig'

interface Props { config: VideoPlayerConfig; data?: Record<string, unknown> }
const props = withDefaults(defineProps<Props>(), { data: () => ({}) })
const { config, displayData } = useCard2Props(props)
const message = useMessage()

const cardStyle = computed(() => ({ backgroundColor: config.value.backgroundColor, border: `1px solid ${config.value.borderColor}`, borderRadius: `${config.value.borderRadius}px`, minHeight: '200px' }))
const playVideo = () => message.info('播放视频')
const pauseVideo = () => message.info('暂停视频')
const stopVideo = () => message.info('停止视频')
</script>

<style scoped>
.video-player { height: 100%; }
.player-header { padding: 12px 16px; font-weight: 500; border-bottom: 1px solid var(--divider-color); }
.player-container { flex: 1; display: flex; align-items: center; justify-content: center; padding: 20px; }
.video-placeholder { text-align: center; }
.video-info { margin-top: 12px; font-size: 12px; color: var(--text-color-2); }
.video-url { font-size: 10px; color: var(--text-color-3); margin-top: 4px; word-break: break-all; }
.player-controls { padding: 8px 16px; display: flex; gap: 8px; justify-content: center; border-top: 1px solid var(--divider-color); }
</style>