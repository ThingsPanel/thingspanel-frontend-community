<template>
  <div class="video-player-container" :style="containerStyle">
    <!-- 加载状态 -->
    <div v-if="loading" class="loading-state">
      <n-spin size="large">
        <template #description>
          正在加载视频...
        </template>
      </n-spin>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="error-state">
      <div class="error-content">
        <n-icon size="48" color="#ff4d4f">
          <VideoOffOutline />
        </n-icon>
        <p class="error-message">{{ errorMessage }}</p>
        <n-button 
          v-if="config.error?.retry?.enabled" 
          type="primary"
          size="small"
          :loading="retrying"
          @click="retryLoad"
        >
          重试
        </n-button>
      </div>
    </div>

    <!-- 视频播放器 -->
    <div v-else class="video-wrapper" :style="playerStyle">
      <!-- HLS视频 -->
      <video
        v-if="isHlsVideo"
        ref="videoElement"
        class="video-js vjs-default-skin vjs-big-play-centered"
        :autoplay="config.player?.autoplay"
        :muted="config.player?.muted"
        :controls="config.player?.controls"
        :loop="config.player?.loop"
        :preload="config.player?.preload"
        data-setup="{}"
      >
        <source :src="videoUrl" type="application/x-mpegURL" />
        <p class="vjs-no-js">
          要观看此视频，请启用JavaScript，并考虑升级到支持
          <a href="https://videojs.com/html5-video-support/" target="_blank" rel="noopener noreferrer">
            HTML5视频
          </a>
          的网络浏览器。
        </p>
      </video>

      <!-- 普通视频 -->
      <video
        v-else
        ref="videoElement"
        class="video-js vjs-default-skin vjs-big-play-centered"
        :src="videoUrl"
        :autoplay="config.player?.autoplay"
        :muted="config.player?.muted"
        :controls="config.player?.controls"
        :loop="config.player?.loop"
        :preload="config.player?.preload"
        data-setup="{}"
      ></video>

      <!-- 视频信息覆盖层 -->
      <div v-if="showVideoInfo" class="video-info-overlay">
        <div class="video-info">
          <p v-if="videoMetadata.duration">时长: {{ formatDuration(videoMetadata.duration) }}</p>
          <p v-if="videoMetadata.resolution">分辨率: {{ videoMetadata.resolution }}</p>
          <p v-if="videoMetadata.bitrate">码率: {{ videoMetadata.bitrate }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { VideoOffOutline } from '@vicons/ionicons5'
import type { VideoJsPlayer } from 'video.js'
import videojs from 'video.js'
import { getAttributeDatasKey, telemetryDataCurrentKeys } from '@/service/api/device'
import type { VideoPlayerConfig } from './index'
import { createLogger } from '@/utils/logger'
import 'video.js/dist/video-js.css'

const logger = createLogger('VideoPlayer')

// Props定义
interface Props {
  config: VideoPlayerConfig
  dataSource?: any
  width?: number
  height?: number
}

const props = withDefaults(defineProps<Props>(), {
  config: () => ({}),
  width: 400,
  height: 300
})

// Emits定义
const emit = defineEmits<{
  'data-change': [data: any]
  'error': [error: Error]
  'video-ready': [player: VideoJsPlayer]
  'video-play': []
  'video-pause': []
  'video-ended': []
}>()

// 响应式数据
const videoElement = ref<HTMLVideoElement>()
const loading = ref(false)
const error = ref(false)
const retrying = ref(false)
const videoUrl = ref('')
const errorMessage = ref('')
const retryCount = ref(0)
const showVideoInfo = ref(false)
const videoMetadata = ref({
  duration: 0,
  resolution: '',
  bitrate: ''
})

// Video.js播放器实例
let player: VideoJsPlayer | null = null

// 计算属性
const containerStyle = computed(() => {
  const style = props.config.style?.container
  return {
    backgroundColor: style?.backgroundColor || '#000000',
    border: style?.border?.show 
      ? `${style.border.width}px solid ${style.border.color}` 
      : 'none',
    borderRadius: style?.border?.radius ? `${style.border.radius}px` : '0',
    padding: style?.padding 
      ? `${style.padding.top}px ${style.padding.right}px ${style.padding.bottom}px ${style.padding.left}px`
      : '0',
    width: '100%',
    height: '100%',
    position: 'relative',
    overflow: 'hidden'
  }
})

const playerStyle = computed(() => {
  const style = props.config.style?.player
  return {
    width: style?.width || '100%',
    height: style?.height || '100%',
    objectFit: style?.objectFit || 'contain'
  }
})

const isHlsVideo = computed(() => {
  return videoUrl.value.includes('.m3u8') || videoUrl.value.includes('hls')
})

// 辅助函数
const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}

const isValidVideoUrl = (url: string): boolean => {
  if (!url) return false
  
  const supportedFormats = props.config.source?.supportedFormats || ['mp4', 'webm', 'ogg', 'm3u8']
  return supportedFormats.some(format => 
    url.toLowerCase().includes(`.${format}`) || 
    (format === 'm3u8' && url.toLowerCase().includes('hls'))
  )
}

// 数据获取函数
const fetchDeviceData = async (dataSource: any) => {
  if (!dataSource?.deviceSource?.[0]) {
    return null
  }

  const deviceInfo = dataSource.deviceSource[0]
  const queryDetail = {
    device_id: deviceInfo.deviceId || '',
    keys: deviceInfo.metricsId || ''
  }
  const metricsType = deviceInfo.metricsType || ''

  if (!queryDetail.device_id || !queryDetail.keys) {
    throw new Error('设备ID或指标ID不能为空')
  }

  try {
    let res
    if (metricsType === 'telemetry') {
      res = await telemetryDataCurrentKeys(queryDetail)
      if (res && Array.isArray(res.data) && res.data.length > 0) {
        return res.data[0].value || ''
      }
    } else if (metricsType === 'attributes') {
      res = await getAttributeDatasKey({
        device_id: queryDetail.device_id,
        key: queryDetail.keys
      })
      if (res && res.data) {
        return res.data.value || ''
      }
    }
    
    return null
  } catch (err) {
    logger.error('获取设备数据失败:', err)
    throw new Error('获取设备数据失败')
  }
}

// 创建播放器
const createPlayer = async () => {
  if (!videoElement.value || !videoUrl.value) {
    return
  }

  try {
    const options = {
      autoplay: props.config.player?.autoplay ?? true,
      muted: props.config.player?.muted ?? true,
      preload: props.config.player?.preload || 'auto',
      controls: props.config.player?.controls ?? true,
      loop: props.config.player?.loop ?? false,
      playbackRates: [0.5, 1, 1.25, 1.5, 2],
      responsive: true,
      fluid: true
    }

    player = videojs(videoElement.value, options, () => {
      logger.info('视频播放器已准备就绪')
      
      // 设置音量
      if (props.config.player?.volume !== undefined) {
        player!.volume(props.config.player.volume)
      }

      // 绑定事件
      player!.on('loadedmetadata', () => {
        videoMetadata.value = {
          duration: player!.duration() || 0,
          resolution: `${player!.videoWidth()}x${player!.videoHeight()}`,
          bitrate: ''
        }
      })

      player!.on('play', () => {
        emit('video-play')
      })

      player!.on('pause', () => {
        emit('video-pause')
      })

      player!.on('ended', () => {
        emit('video-ended')
      })

      player!.on('error', (e) => {
        const playerError = player!.error()
        logger.error('播放器错误:', playerError)
        handleVideoError(new Error(`播放器错误: ${playerError?.message || '未知错误'}`))
      })

      emit('video-ready', player!)
    })

  } catch (err) {
    logger.error('创建播放器失败:', err)
    handleVideoError(new Error('创建播放器失败'))
  }
}

// 销毁播放器
const destroyPlayer = () => {
  if (player) {
    try {
      player.dispose()
      player = null
      logger.info('播放器已销毁')
    } catch (err) {
      logger.error('销毁播放器失败:', err)
    }
  }
}

// 错误处理
const handleVideoError = (err: Error) => {
  error.value = true
  errorMessage.value = err.message || props.config.error?.display?.customMessage || '视频加载失败'
  emit('error', err)
  logger.error('视频错误:', err)
}

// 重试加载
const retryLoad = async () => {
  const maxRetries = props.config.error?.retry?.maxRetries || 3
  if (retryCount.value >= maxRetries) {
    errorMessage.value = '重试次数已达上限'
    return
  }

  retrying.value = true
  retryCount.value++
  
  try {
    // 等待重试间隔
    const retryInterval = props.config.error?.retry?.retryInterval || 2000
    await new Promise(resolve => setTimeout(resolve, retryInterval))
    
    // 重置状态
    error.value = false
    errorMessage.value = ''
    
    // 重新加载数据
    await loadVideoData()
  } catch (err) {
    handleVideoError(err as Error)
  } finally {
    retrying.value = false
  }
}

// 加载视频数据
const loadVideoData = async () => {
  loading.value = true
  error.value = false
  
  try {
    let url = ''
    
    if (props.dataSource) {
      // 从数据源获取视频URL
      url = await fetchDeviceData(props.dataSource) || ''
    }
    
    // 如果没有获取到URL，使用默认URL
    if (!url) {
      url = props.config.source?.defaultUrl || ''
    }
    
    if (!url) {
      throw new Error('未配置视频URL')
    }
    
    if (!isValidVideoUrl(url)) {
      throw new Error('不支持的视频格式')
    }
    
    videoUrl.value = url
    retryCount.value = 0
    
    // 等待DOM更新后创建播放器
    await nextTick()
    await createPlayer()
    
    emit('data-change', { url })
    
  } catch (err) {
    handleVideoError(err as Error)
  } finally {
    loading.value = false
  }
}

// 更新数据（供外部调用）
const updateData = async (deviceId?: string, metricsId?: string, data?: any) => {
  if (data && data.value) {
    videoUrl.value = data.value
    
    // 重新创建播放器
    destroyPlayer()
    await nextTick()
    await createPlayer()
    
    emit('data-change', data)
  } else if (props.dataSource) {
    await loadVideoData()
  }
}

// 刷新数据
const refreshData = async () => {
  await loadVideoData()
}

// 播放控制方法
const play = () => {
  if (player) {
    player.play()
  }
}

const pause = () => {
  if (player) {
    player.pause()
  }
}

const stop = () => {
  if (player) {
    player.pause()
    player.currentTime(0)
  }
}

const setVolume = (volume: number) => {
  if (player) {
    player.volume(Math.max(0, Math.min(1, volume)))
  }
}

const toggleFullscreen = () => {
  if (player) {
    if (player.isFullscreen()) {
      player.exitFullscreen()
    } else {
      player.requestFullscreen()
    }
  }
}

// 监听器
watch(
  () => props.dataSource,
  () => {
    loadVideoData()
  },
  { immediate: true, deep: true }
)

watch(
  () => props.config,
  () => {
    // 配置变化时重新创建播放器
    if (player && videoUrl.value) {
      destroyPlayer()
      nextTick(() => {
        createPlayer()
      })
    }
  },
  { deep: true }
)

// 生命周期
onMounted(() => {
  logger.info('视频播放器组件已挂载')
})

onBeforeUnmount(() => {
  destroyPlayer()
  logger.info('视频播放器组件已卸载')
})

// 暴露方法给父组件
defineExpose({
  updateData,
  refreshData,
  play,
  pause,
  stop,
  setVolume,
  toggleFullscreen,
  player: () => player
})
</script>

<style scoped>
.video-player-container {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  position: relative;
}

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.1);
}

.error-state {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.05);
}

.error-content {
  text-align: center;
  padding: 20px;
}

.error-message {
  margin: 16px 0;
  color: #666;
  font-size: 14px;
}

.video-wrapper {
  width: 100%;
  height: 100%;
  position: relative;
}

.video-js {
  width: 100% !important;
  height: 100% !important;
}

.video-info-overlay {
  position: absolute;
  top: 10px;
  right: 10px;
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 12px;
  pointer-events: none;
  z-index: 10;
}

.video-info p {
  margin: 2px 0;
}

/* Video.js 主题定制 */
:deep(.video-js) {
  font-family: inherit;
}

:deep(.video-js .vjs-big-play-button) {
  background-color: rgba(0, 0, 0, 0.7);
  border: none;
  border-radius: 50%;
  width: 80px;
  height: 80px;
  line-height: 80px;
  margin-top: -40px;
  margin-left: -40px;
}

:deep(.video-js .vjs-big-play-button:hover) {
  background-color: rgba(0, 0, 0, 0.9);
}

:deep(.video-js .vjs-control-bar) {
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
}

:deep(.video-js .vjs-progress-control .vjs-progress-holder) {
  height: 6px;
}

:deep(.video-js .vjs-play-progress) {
  background-color: #1890ff;
}

:deep(.video-js .vjs-volume-panel) {
  width: auto;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .video-info-overlay {
    font-size: 10px;
    padding: 6px 8px;
  }
  
  :deep(.video-js .vjs-big-play-button) {
    width: 60px;
    height: 60px;
    line-height: 60px;
    margin-top: -30px;
    margin-left: -30px;
  }
}
</style>