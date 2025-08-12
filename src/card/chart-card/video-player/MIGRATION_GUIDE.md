# Video Player 组件迁移指南

## 📋 组件概述

**video-player** 是一个视频播放器组件，基于 Video.js 库实现，支持 M3U8 流媒体播放和常规视频文件播放。主要用于显示来自设备的视频流数据，如监控摄像头、直播流等。

## 🔍 技术架构分析

### 当前实现结构
```
video-player/
├── index.ts           # 组件定义
├── component.vue      # 核心播放逻辑（190 行）
├── poster.png         # 组件预览图
└── [无配置文件]       # 缺少配置界面
```

### 核心功能特性
1. **Video.js 集成**: 基于专业的 HTML5 视频播放器库
2. **多格式支持**: 支持 M3U8 流媒体和常规视频格式
3. **自动播放**: 默认启用自动播放（静音模式）
4. **响应式数据**: 支持设备数据源的视频URL获取
5. **WebSocket 更新**: 支持实时视频源切换
6. **错误处理**: 基础的播放错误日志记录

### 数据流程
```
设备数据源 → API 获取视频URL → Video.js 播放器 → 视频流播放
```

## ❗ 现有问题识别

### 1. 🚨 **配置界面缺失**
```typescript
// 组件定义中缺少 configForm
export default {
  id: 'chart-videoplayer',
  type: 'chart',
  component: defineAsyncComponent(() => import('./component.vue')),
  // ❌ 缺少 configForm: defineAsyncComponent(() => import('./card-config.vue')),
} as ICardDefine
```
**影响**: 用户无法配置任何播放选项，功能完全固化。

### 2. 🎨 **样式系统问题**
```css
/* 硬编码样式和位置 */
.video-container {
  width: 100%;
  height: 98%;         /* 硬编码百分比 */
  position: absolute;
  left: 0;
  top: 10px;          /* 固定像素值 */
}
```
**影响**: 无法适配不同主题和布局需求。

### 3. ⚡ **播放器配置固化**
```javascript
// 播放器选项硬编码
const options = {
  autoplay: true,        // 无法配置
  muted: true,           // 固定静音
  preload: 'auto',       // 无选择性
  controls: false        // 固定隐藏控制栏
}
```
**影响**: 无法根据使用场景调整播放体验。

### 4. 🔧 **功能局限性**
- 只支持单一视频源，无多源切换
- 缺少播放状态监控和统计
- 无全屏、画中画等高级功能
- 缺少音频控制和字幕支持

### 5. 🌐 **国际化和无障碍问题**
```html
<!-- 硬编码英文提示文本 -->
<p class="vjs-no-js">
  To view this video please enable JavaScript, and consider upgrading to a web browser that
  <a href="https://videojs.com/html5-video-support/" target="_blank" rel="noopener noreferrer">
    supports HTML5 video
  </a>
</p>
```
**影响**: 缺少多语言支持和无障碍访问优化。

### 6. 📱 **响应式设计不完善**
```css
/* 简单的绝对定位，缺少响应式适配 */
.video-container {
  position: absolute;  /* 可能在小屏幕上出现问题 */
  width: 100%;
  height: 98%;
}
```

### 7. 🔒 **安全和性能问题**
- 注释掉的测试URL可能造成安全隐患
- 缺少视频源验证和错误恢复
- 内存泄漏风险（播放器实例管理）

## 🎯 Card 2.1 迁移策略

### 组件重新设计

#### 1. 组件定义
```typescript
// src/card2.1/components/video-player/index.ts
import type { ComponentDefinition } from '@/card2.1/core/component-definition'

export const VideoPlayerDefinition: ComponentDefinition = {
  type: 'video-player',
  name: '视频播放器',
  category: '媒体展示',
  description: '专业的视频播放组件，支持多种视频格式和流媒体协议',
  
  // 数据需求声明
  dataRequirements: {
    videoSource: {
      type: 'string',
      description: '视频源URL',
      required: true
    },
    
    videoMetadata: {
      type: 'object',
      description: '视频元数据信息',
      structure: {
        title: { type: 'string', description: '视频标题' },
        duration: { type: 'number', description: '视频时长' },
        resolution: { type: 'string', description: '视频分辨率' },
        bitrate: { type: 'number', description: '码率' },
        format: { type: 'string', description: '视频格式' }
      }
    },
    
    deviceInfo: {
      type: 'object',
      description: '设备信息',
      structure: {
        deviceId: { type: 'string', description: '设备ID' },
        metricsId: { type: 'string', description: '指标ID' },
        metricsName: { type: 'string', description: '指标名称' },
        metricsType: { 
          type: 'string', 
          enum: ['telemetry', 'attributes'],
          description: '指标类型' 
        }
      }
    }
  },
  
  // 配置结构
  config: {
    // 播放器配置
    playerConfig: {
      type: 'object',
      label: '播放器配置',
      structure: {
        autoplay: {
          type: 'boolean',
          label: '自动播放',
          default: false,
          description: '页面加载时自动开始播放'
        },
        
        muted: {
          type: 'boolean',
          label: '静音启动',
          default: true,
          description: '以静音模式开始播放（利于自动播放）'
        },
        
        controls: {
          type: 'boolean',
          label: '显示控制栏',
          default: true,
          description: '显示播放控制按钮'
        },
        
        preload: {
          type: 'select',
          label: '预加载策略',
          options: [
            { label: '不预加载', value: 'none' },
            { label: '预加载元数据', value: 'metadata' },
            { label: '预加载全部', value: 'auto' }
          ],
          default: 'metadata',
          description: '视频预加载策略'
        },
        
        loop: {
          type: 'boolean',
          label: '循环播放',
          default: false,
          description: '视频结束后重新开始'
        },
        
        playbackRates: {
          type: 'array',
          label: '播放速度选项',
          itemType: 'number',
          default: [0.5, 1, 1.25, 1.5, 2],
          description: '可选的播放速度倍率'
        }
      }
    },
    
    // 显示配置
    displayConfig: {
      type: 'object',
      label: '显示配置',
      structure: {
        aspectRatio: {
          type: 'select',
          label: '画面比例',
          options: [
            { label: '自适应', value: 'auto' },
            { label: '16:9', value: '16:9' },
            { label: '4:3', value: '4:3' },
            { label: '1:1', value: '1:1' },
            { label: '自定义', value: 'custom' }
          ],
          default: 'auto'
        },
        
        customAspectRatio: {
          type: 'string',
          label: '自定义比例',
          placeholder: '16:9',
          condition: { field: 'displayConfig.aspectRatio', value: 'custom' },
          description: '格式: 宽:高'
        },
        
        fluid: {
          type: 'boolean',
          label: '流体布局',
          default: true,
          description: '视频播放器自适应容器大小'
        },
        
        responsive: {
          type: 'boolean',
          label: '响应式设计',
          default: true,
          description: '根据屏幕大小调整播放器'
        },
        
        showTitle: {
          type: 'boolean',
          label: '显示标题',
          default: false,
          description: '在播放器上方显示视频标题'
        },
        
        showMetadata: {
          type: 'boolean',
          label: '显示元数据',
          default: false,
          description: '显示视频时长、分辨率等信息'
        }
      }
    },
    
    // 功能配置
    featureConfig: {
      type: 'object',
      label: '功能配置',
      structure: {
        enableFullscreen: {
          type: 'boolean',
          label: '启用全屏',
          default: true,
          description: '允许全屏播放'
        },
        
        enablePictureInPicture: {
          type: 'boolean',
          label: '启用画中画',
          default: true,
          description: '支持画中画模式'
        },
        
        enableKeyboardShortcuts: {
          type: 'boolean',
          label: '启用快捷键',
          default: true,
          description: '支持键盘控制播放'
        },
        
        enableVolumeControl: {
          type: 'boolean',
          label: '音量控制',
          default: true,
          description: '显示音量调节控件'
        },
        
        enableProgressBar: {
          type: 'boolean',
          label: '进度条',
          default: true,
          description: '显示播放进度条'
        },
        
        enablePlaybackRateMenu: {
          type: 'boolean',
          label: '播放速度菜单',
          default: false,
          description: '显示播放速度选择菜单'
        }
      }
    },
    
    // 流媒体配置
    streamConfig: {
      type: 'object',
      label: '流媒体配置',
      structure: {
        enableHLS: {
          type: 'boolean',
          label: '启用HLS支持',
          default: true,
          description: '支持M3U8格式的直播流'
        },
        
        hlsConfig: {
          type: 'object',
          label: 'HLS配置',
          condition: { field: 'streamConfig.enableHLS', value: true },
          structure: {
            maxBufferLength: {
              type: 'number',
              label: '最大缓冲长度(秒)',
              default: 30,
              min: 5,
              max: 300,
              description: '视频缓冲的最大时长'
            },
            
            startLevel: {
              type: 'number',
              label: '起始质量等级',
              default: -1,
              min: -1,
              max: 10,
              description: '初始播放质量，-1为自动'
            },
            
            enableWorker: {
              type: 'boolean',
              label: '启用Web Worker',
              default: true,
              description: '使用Worker进程解码以提升性能'
            }
          }
        },
        
        reconnectAttempts: {
          type: 'number',
          label: '重连尝试次数',
          default: 5,
          min: 0,
          max: 20,
          description: '连接失败时的重试次数'
        },
        
        reconnectInterval: {
          type: 'number',
          label: '重连间隔(秒)',
          default: 3,
          min: 1,
          max: 30,
          description: '重连尝试的时间间隔'
        }
      }
    },
    
    // 高级配置
    advancedConfig: {
      type: 'object',
      label: '高级配置',
      structure: {
        enableLogging: {
          type: 'boolean',
          label: '启用日志',
          default: false,
          description: '记录播放器事件和错误日志'
        },
        
        errorRecovery: {
          type: 'boolean',
          label: '自动错误恢复',
          default: true,
          description: '播放出错时自动尝试恢复'
        },
        
        loadTimeout: {
          type: 'number',
          label: '加载超时(秒)',
          default: 15,
          min: 5,
          max: 120,
          description: '视频加载超时时间'
        },
        
        enableAnalytics: {
          type: 'boolean',
          label: '启用播放统计',
          default: false,
          description: '收集播放统计数据'
        },
        
        placeholder: {
          type: 'string',
          label: '占位图片URL',
          description: '视频加载前显示的占位图片'
        }
      }
    }
  },
  
  // 默认布局
  defaultLayout: {
    canvas: { width: 400, height: 225 },
    gridstack: { w: 4, h: 3, minW: 3, minH: 2 }
  }
}
```

#### 2. 核心组件实现
```vue
<!-- src/card2.1/components/video-player/VideoPlayer.vue -->
<script setup lang="ts">
/**
 * 专业视频播放器组件
 * 基于Video.js，支持多种视频格式和高级配置
 */
import { computed, ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { NCard, NIcon, NSpin, NButton, useMessage } from 'naive-ui'
import { PlayCircleOutline, StopCircleOutline, VolumeHighOutline } from '@vicons/ionicons5'
import { useI18n } from 'vue-i18n'
import { useThemeStore } from '@/store/modules/theme'
import videojs from 'video.js'
import type { VideoJsPlayer, VideoJsPlayerOptions } from 'video.js'
import 'video.js/dist/video-js.css'

interface VideoPlayerConfig {
  playerConfig?: {
    autoplay?: boolean
    muted?: boolean
    controls?: boolean
    preload?: 'none' | 'metadata' | 'auto'
    loop?: boolean
    playbackRates?: number[]
  }
  displayConfig?: {
    aspectRatio?: 'auto' | '16:9' | '4:3' | '1:1' | 'custom'
    customAspectRatio?: string
    fluid?: boolean
    responsive?: boolean
    showTitle?: boolean
    showMetadata?: boolean
  }
  featureConfig?: {
    enableFullscreen?: boolean
    enablePictureInPicture?: boolean
    enableKeyboardShortcuts?: boolean
    enableVolumeControl?: boolean
    enableProgressBar?: boolean
    enablePlaybackRateMenu?: boolean
  }
  streamConfig?: {
    enableHLS?: boolean
    hlsConfig?: {
      maxBufferLength?: number
      startLevel?: number
      enableWorker?: boolean
    }
    reconnectAttempts?: number
    reconnectInterval?: number
  }
  advancedConfig?: {
    enableLogging?: boolean
    errorRecovery?: boolean
    loadTimeout?: number
    enableAnalytics?: boolean
    placeholder?: string
  }
}

interface Props {
  config: VideoPlayerConfig
  data?: {
    videoSource?: string
    videoMetadata?: {
      title?: string
      duration?: number
      resolution?: string
      bitrate?: number
      format?: string
    }
    deviceInfo?: {
      deviceId: string
      metricsId: string
      metricsName: string
      metricsType: string
    }
  }
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
})

const { t } = useI18n()
const themeStore = useThemeStore()
const message = useMessage()

// 组件状态
const videoRef = ref<HTMLVideoElement>()
const containerRef = ref<HTMLElement>()
const player = ref<VideoJsPlayer>()
const isPlayerReady = ref(false)
const isLoading = ref(false)
const hasError = ref(false)
const errorMessage = ref('')
const reconnectCount = ref(0)

// 配置计算属性
const playerConfig = computed(() => ({
  autoplay: false,
  muted: true,
  controls: true,
  preload: 'metadata' as const,
  loop: false,
  playbackRates: [0.5, 1, 1.25, 1.5, 2],
  ...props.config.playerConfig
}))

const displayConfig = computed(() => ({
  aspectRatio: 'auto' as const,
  customAspectRatio: '16:9',
  fluid: true,
  responsive: true,
  showTitle: false,
  showMetadata: false,
  ...props.config.displayConfig
}))

const featureConfig = computed(() => ({
  enableFullscreen: true,
  enablePictureInPicture: true,
  enableKeyboardShortcuts: true,
  enableVolumeControl: true,
  enableProgressBar: true,
  enablePlaybackRateMenu: false,
  ...props.config.featureConfig
}))

const streamConfig = computed(() => ({
  enableHLS: true,
  hlsConfig: {
    maxBufferLength: 30,
    startLevel: -1,
    enableWorker: true
  },
  reconnectAttempts: 5,
  reconnectInterval: 3000,
  ...props.config.streamConfig
}))

const advancedConfig = computed(() => ({
  enableLogging: false,
  errorRecovery: true,
  loadTimeout: 15000,
  enableAnalytics: false,
  placeholder: '',
  ...props.config.advancedConfig
}))

// 视频源处理
const videoSource = computed(() => props.data?.videoSource || '')
const videoTitle = computed(() => props.data?.videoMetadata?.title || props.data?.deviceInfo?.metricsName || '')

// 检测视频格式
const isHLSStream = computed(() => 
  videoSource.value.includes('.m3u8') || videoSource.value.includes('application/x-mpegURL')
)

// 播放器选项
const getPlayerOptions = (): VideoJsPlayerOptions => {
  const options: VideoJsPlayerOptions = {
    autoplay: playerConfig.value.autoplay,
    muted: playerConfig.value.muted,
    controls: playerConfig.value.controls,
    preload: playerConfig.value.preload,
    loop: playerConfig.value.loop,
    fluid: displayConfig.value.fluid,
    responsive: displayConfig.value.responsive,
    playbackRates: playerConfig.value.playbackRates,
    
    // 源配置
    sources: [{
      src: videoSource.value,
      type: isHLSStream.value ? 'application/x-mpegURL' : 'video/mp4'
    }],
    
    // HLS 配置
    ...(isHLSStream.value && streamConfig.value.enableHLS ? {
      html5: {
        hls: {
          ...streamConfig.value.hlsConfig
        }
      }
    } : {}),
    
    // 高级配置
    ...(advancedConfig.value.loadTimeout ? {
      html5: {
        ...({html5: {}} as any).html5,
        nativeVideoTracks: false,
        loadTimeout: advancedConfig.value.loadTimeout
      }
    } : {})
  }
  
  return options
}

// 创建播放器
const createPlayer = async () => {
  if (!videoRef.value || !videoSource.value) return
  
  try {
    isLoading.value = true
    hasError.value = false
    
    // 清理现有播放器
    if (player.value) {
      player.value.dispose()
      player.value = undefined
    }
    
    const options = getPlayerOptions()
    
    // 创建新播放器
    player.value = videojs(videoRef.value, options, function(this: VideoJsPlayer) {
      console.log('Video.js player ready')
      isPlayerReady.value = true
      isLoading.value = false
      
      // 绑定事件
      this.on('loadstart', handleLoadStart)
      this.on('loadeddata', handleLoadedData)
      this.on('error', handleError)
      this.on('ended', handleEnded)
      this.on('play', handlePlay)
      this.on('pause', handlePause)
      
      if (advancedConfig.value.enableAnalytics) {
        bindAnalyticsEvents(this)
      }
    })
    
    reconnectCount.value = 0
    
  } catch (error) {
    console.error('Failed to create video player:', error)
    handleError()
  }
}

// 事件处理
const handleLoadStart = () => {
  isLoading.value = true
  hasError.value = false
}

const handleLoadedData = () => {
  isLoading.value = false
  message.success(t('videoPlayer.loadSuccess'))
}

const handleError = () => {
  isLoading.value = false
  hasError.value = true
  errorMessage.value = t('videoPlayer.loadError')
  
  if (advancedConfig.value.errorRecovery && reconnectCount.value < streamConfig.value.reconnectAttempts) {
    scheduleReconnect()
  } else {
    message.error(t('videoPlayer.playbackFailed'))
  }
}

const handleEnded = () => {
  if (advancedConfig.value.enableAnalytics) {
    // 记录播放完成统计
    console.log('Video playback completed')
  }
}

const handlePlay = () => {
  if (advancedConfig.value.enableAnalytics) {
    console.log('Video playback started')
  }
}

const handlePause = () => {
  if (advancedConfig.value.enableAnalytics) {
    console.log('Video playback paused')
  }
}

// 重连机制
const scheduleReconnect = () => {
  reconnectCount.value++
  
  setTimeout(() => {
    console.log(`Attempting reconnect ${reconnectCount.value}/${streamConfig.value.reconnectAttempts}`)
    createPlayer()
  }, streamConfig.value.reconnectInterval)
}

// 分析事件绑定
const bindAnalyticsEvents = (playerInstance: VideoJsPlayer) => {
  const events = ['play', 'pause', 'ended', 'error', 'timeupdate']
  
  events.forEach(event => {
    playerInstance.on(event, () => {
      // 发送分析数据
      console.log(`Video analytics: ${event}`, {
        currentTime: playerInstance.currentTime(),
        duration: playerInstance.duration(),
        videoSource: videoSource.value
      })
    })
  })
}

// 计算样式
const containerStyle = computed(() => {
  const style: Record<string, string> = {}
  
  // 宽高比处理
  if (displayConfig.value.aspectRatio !== 'auto') {
    let ratio = '16:9'
    
    if (displayConfig.value.aspectRatio === 'custom' && displayConfig.value.customAspectRatio) {
      ratio = displayConfig.value.customAspectRatio
    } else if (displayConfig.value.aspectRatio !== 'auto') {
      ratio = displayConfig.value.aspectRatio
    }
    
    const [width, height] = ratio.split(':').map(Number)
    if (width && height) {
      style.aspectRatio = `${width} / ${height}`
    }
  }
  
  return style
})

// 监听视频源变化
watch(videoSource, async (newSource) => {
  if (newSource && newSource !== player.value?.currentSrc()) {
    await nextTick()
    createPlayer()
  }
}, { immediate: true })

// 生命周期
onMounted(() => {
  if (videoSource.value) {
    createPlayer()
  }
})

onBeforeUnmount(() => {
  if (player.value) {
    player.value.dispose()
  }
})

// 暴露组件接口
defineExpose({
  getPlayer: () => player.value,
  play: () => player.value?.play(),
  pause: () => player.value?.pause(),
  getCurrentTime: () => player.value?.currentTime(),
  setCurrentTime: (time: number) => player.value?.currentTime(time),
  getDuration: () => player.value?.duration(),
  getVolume: () => player.value?.volume(),
  setVolume: (volume: number) => player.value?.volume(volume),
  isPlaying: () => !player.value?.paused(),
  reload: createPlayer
})
</script>

<template>
  <div class="video-player-wrapper" ref="containerRef">
    <NCard 
      :bordered="false" 
      class="video-card h-full"
      :class="{ 'has-error': hasError }"
    >
      <!-- 标题区域 -->
      <div v-if="displayConfig.showTitle && videoTitle" class="video-title">
        {{ videoTitle }}
      </div>
      
      <!-- 元数据信息 -->
      <div v-if="displayConfig.showMetadata && data?.videoMetadata" class="video-metadata">
        <span v-if="data.videoMetadata.resolution" class="metadata-item">
          {{ data.videoMetadata.resolution }}
        </span>
        <span v-if="data.videoMetadata.duration" class="metadata-item">
          {{ Math.floor(data.videoMetadata.duration / 60) }}:{{ String(data.videoMetadata.duration % 60).padStart(2, '0') }}
        </span>
        <span v-if="data.videoMetadata.bitrate" class="metadata-item">
          {{ Math.round(data.videoMetadata.bitrate / 1000) }}k
        </span>
      </div>
      
      <!-- 视频容器 -->
      <div 
        class="video-container" 
        :style="containerStyle"
        :class="{
          'aspect-auto': displayConfig.aspectRatio === 'auto',
          'fluid': displayConfig.fluid,
          'responsive': displayConfig.responsive
        }"
      >
        <!-- 加载状态 -->
        <div v-if="isLoading" class="loading-overlay">
          <NSpin size="large" />
          <div class="loading-text">{{ t('videoPlayer.loading') }}</div>
        </div>
        
        <!-- 错误状态 -->
        <div v-else-if="hasError" class="error-overlay">
          <NIcon size="48" class="error-icon">
            <StopCircleOutline />
          </NIcon>
          <div class="error-text">{{ errorMessage }}</div>
          <NButton 
            type="primary" 
            size="small" 
            @click="createPlayer"
            :loading="isLoading"
          >
            {{ t('common.retry') }}
          </NButton>
          <div v-if="reconnectCount > 0" class="reconnect-info">
            {{ t('videoPlayer.reconnectAttempt', { current: reconnectCount, max: streamConfig.reconnectAttempts }) }}
          </div>
        </div>
        
        <!-- 占位图片 -->
        <div v-else-if="!videoSource && advancedConfig.placeholder" class="placeholder-overlay">
          <img :src="advancedConfig.placeholder" alt="Video placeholder" class="placeholder-image" />
        </div>
        
        <!-- 无源提示 -->
        <div v-else-if="!videoSource" class="no-source-overlay">
          <NIcon size="48" class="no-source-icon">
            <PlayCircleOutline />
          </NIcon>
          <div class="no-source-text">{{ t('videoPlayer.noSource') }}</div>
        </div>
        
        <!-- Video.js 播放器 -->
        <video
          v-show="!isLoading && !hasError && videoSource"
          ref="videoRef"
          class="video-js vjs-default-skin"
          :class="{
            'vjs-big-play-centered': !playerConfig.controls,
            'vjs-fluid': displayConfig.fluid,
            'vjs-responsive': displayConfig.responsive
          }"
          preload="metadata"
          data-setup="{}"
        >
          <p class="vjs-no-js">
            {{ t('videoPlayer.noJavaScript') }}
            <a href="https://videojs.com/html5-video-support/" target="_blank">
              {{ t('videoPlayer.upgradeMessage') }}
            </a>
          </p>
        </video>
      </div>
    </NCard>
  </div>
</template>

<style scoped>
.video-player-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.video-card {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: var(--card-color);
  border-radius: var(--border-radius);
}

.video-card.has-error {
  border: 1px solid var(--error-color-suppl);
}

.video-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-color);
  text-align: center;
  padding: 8px 12px 4px;
  border-bottom: 1px solid var(--divider-color);
}

.video-metadata {
  display: flex;
  justify-content: center;
  gap: 12px;
  padding: 4px 12px 8px;
  font-size: 12px;
  color: var(--text-color-2);
  border-bottom: 1px solid var(--divider-color);
}

.metadata-item {
  padding: 2px 6px;
  background-color: var(--tag-color);
  border-radius: 4px;
}

.video-container {
  position: relative;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.video-container.aspect-auto {
  aspect-ratio: auto;
}

.video-container.fluid .video-js {
  width: 100%;
  height: 100%;
}

/* 覆盖层样式 */
.loading-overlay,
.error-overlay,
.placeholder-overlay,
.no-source-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  background-color: var(--card-color);
  z-index: 10;
}

.loading-text,
.error-text,
.no-source-text {
  color: var(--text-color-2);
  font-size: 14px;
  text-align: center;
}

.error-icon,
.no-source-icon {
  color: var(--text-color-3);
}

.error-icon {
  color: var(--error-color);
}

.reconnect-info {
  font-size: 12px;
  color: var(--text-color-3);
  text-align: center;
}

.placeholder-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

/* Video.js 样式覆盖 */
.video-js {
  width: 100%;
  height: 100%;
  background-color: transparent;
}

.video-js .vjs-poster {
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .video-title {
    font-size: 12px;
    padding: 6px 8px 3px;
  }
  
  .video-metadata {
    font-size: 11px;
    gap: 8px;
    padding: 3px 8px 6px;
  }
  
  .loading-text,
  .error-text,
  .no-source-text {
    font-size: 12px;
  }
}

/* 暗色主题适配 */
[data-theme="dark"] .video-card {
  background-color: var(--card-color-dark);
}

[data-theme="dark"] .video-title {
  color: var(--text-color-dark);
}

[data-theme="dark"] .video-metadata {
  color: var(--text-color-2-dark);
}

[data-theme="dark"] .metadata-item {
  background-color: var(--tag-color-dark);
}
</style>
```

## 💻 具体实现步骤

### Phase 1: 基础重构（第1-2周）

1. **创建组件结构**
```bash
src/card2.1/components/video-player/
├── index.ts                          # 组件定义
├── VideoPlayer.vue                   # 核心组件
├── ConfigPanel.vue                   # 配置面板
├── types.ts                          # 类型定义
├── hooks/
│   ├── useVideoPlayer.ts             # 播放器逻辑 hook
│   ├── useVideoAnalytics.ts          # 分析统计 hook
│   └── useVideoSource.ts             # 视频源管理 hook
└── utils/
    ├── video-format-detector.ts      # 格式检测工具
    ├── video-quality-manager.ts      # 质量管理
    └── video-error-handler.ts        # 错误处理工具
```

2. **实现核心功能**
- Video.js 集成和配置
- 多格式视频支持
- HLS 流媒体播放
- 基础控制功能

### Phase 2: 功能增强（第3周）

1. **高级播放功能**
- 自动重连机制
- 播放质量自适应
- 画中画和全屏支持
- 快捷键控制

2. **用户界面完善**
- 响应式设计优化
- 主题系统集成
- 多语言支持
- 无障碍访问

### Phase 3: 性能和监控（第4周）

1. **性能优化**
- 内存管理优化
- 加载性能提升
- 缓存策略实现

2. **监控和分析**
- 播放统计收集
- 错误日志记录
- 性能监控指标

### Phase 4: 测试和完善（第5周）

1. **功能测试**
- 各种视频格式测试
- 流媒体稳定性测试
- 跨浏览器兼容性

2. **用户体验优化**
- 加载体验改善
- 错误处理优化
- 可访问性提升

## ✅ 测试验证方案

### 功能测试
- [ ] MP4、WebM、M3U8 等格式正常播放
- [ ] 自动播放和静音模式工作正常
- [ ] 全屏、画中画功能
- [ ] 播放控制和进度调节
- [ ] 音量控制和播放速度调节

### 流媒体测试
- [ ] HLS 直播流稳定播放
- [ ] 网络中断后的自动重连
- [ ] 多质量档位自适应切换
- [ ] 缓冲策略和延迟控制

### 性能测试
- [ ] 长时间播放的内存使用
- [ ] 多实例并发播放
- [ ] 不同网络条件下的表现
- [ ] 移动设备兼容性

### 用户体验测试
- [ ] 响应式设计在各种屏幕尺寸
- [ ] 主题切换的视觉一致性
- [ ] 加载状态和错误提示
- [ ] 无障碍访问支持

## 📈 迁移收益

### 功能增强
- **播放控制**: 基础播放 → 完整的播放控制系统（全屏、画中画、快捷键等）
- **格式支持**: HLS + 基础视频 → 全格式支持和智能检测
- **用户体验**: 固化配置 → 丰富的可视化配置选项

### 性能提升
- **稳定性**: 基础错误处理 → 完善的错误恢复和重连机制
- **响应性**: 简单自适应 → 智能质量调节和缓存优化
- **资源管理**: 基础管理 → 完整的生命周期和内存管理

### 开发体验
- **配置灵活性**: 无配置 → 完整的配置面板和选项
- **可维护性**: 单文件实现 → 模块化架构和工具函数
- **可扩展性**: 功能固化 → 插件化架构支持自定义扩展

### 监控能力
- **播放统计**: 无 → 完整的播放数据收集和分析
- **错误追踪**: 基础日志 → 详细的错误分类和上报
- **性能监控**: 无 → 播放性能指标收集

---

**总结**: 视频播放器组件通过 Card 2.1 重构，将从基础的视频展示工具升级为专业的多媒体播放解决方案，显著提升视频内容的展示质量和用户交互体验。