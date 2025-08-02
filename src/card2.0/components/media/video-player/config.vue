<template>
  <div class="video-player-config">
    <n-form
      ref="formRef"
      :model="localConfig"
      label-placement="left"
      label-width="120px"
      size="small"
    >
      <!-- 基础设置 -->
      <n-card title="基础设置" size="small" class="config-section">
        <n-form-item label="组件标题">
          <n-input
            v-model:value="localConfig.basic.title"
            placeholder="请输入组件标题"
            clearable
          />
        </n-form-item>
      </n-card>

      <!-- 播放器设置 -->
      <n-card title="播放器设置" size="small" class="config-section">
        <n-form-item label="自动播放">
          <n-switch v-model:value="localConfig.player.autoplay" />
        </n-form-item>
        
        <n-form-item label="静音">
          <n-switch v-model:value="localConfig.player.muted" />
          <template #feedback>
            <n-text depth="3" style="font-size: 12px;">
              启用静音可确保自动播放正常工作
            </n-text>
          </template>
        </n-form-item>
        
        <n-form-item label="显示控制条">
          <n-switch v-model:value="localConfig.player.controls" />
        </n-form-item>
        
        <n-form-item label="预加载策略">
          <n-select
            v-model:value="localConfig.player.preload"
            :options="preloadOptions"
            placeholder="选择预加载策略"
          />
        </n-form-item>
        
        <n-form-item label="循环播放">
          <n-switch v-model:value="localConfig.player.loop" />
        </n-form-item>
        
        <n-form-item label="播放速度">
          <n-slider
            v-model:value="localConfig.player.playbackRate"
            :min="0.25"
            :max="2"
            :step="0.25"
            :marks="playbackRateMarks"
          />
        </n-form-item>
        
        <n-form-item label="音量">
          <n-slider
            v-model:value="localConfig.player.volume"
            :min="0"
            :max="1"
            :step="0.1"
            :format-tooltip="(value) => `${Math.round(value * 100)}%`"
          />
        </n-form-item>
        
        <n-form-item label="全屏支持">
          <n-switch v-model:value="localConfig.player.fullscreen" />
        </n-form-item>
      </n-card>

      <!-- 视频源设置 -->
      <n-card title="视频源设置" size="small" class="config-section">
        <n-form-item label="默认视频URL">
          <n-input
            v-model:value="localConfig.source.defaultUrl"
            placeholder="请输入默认视频URL"
            clearable
          />
          <template #feedback>
            <n-text depth="3" style="font-size: 12px;">
              当数据源无法获取视频URL时使用此默认值
            </n-text>
          </template>
        </n-form-item>
        
        <n-form-item label="支持的格式">
          <n-dynamic-tags
            v-model:value="localConfig.source.supportedFormats"
            :max="10"
          />
          <template #feedback>
            <n-text depth="3" style="font-size: 12px;">
              支持的视频格式，如：mp4, webm, ogg, m3u8
            </n-text>
          </template>
        </n-form-item>
        
        <!-- HLS配置 -->
        <n-divider title-placement="left">
          <n-text style="font-size: 14px; font-weight: 500;">HLS配置</n-text>
        </n-divider>
        
        <n-form-item label="启用HLS">
          <n-switch v-model:value="localConfig.source.hls.enabled" />
        </n-form-item>
        
        <n-form-item v-if="localConfig.source.hls.enabled" label="最大重试次数">
          <n-input-number
            v-model:value="localConfig.source.hls.maxRetries"
            :min="0"
            :max="10"
            placeholder="重试次数"
          />
        </n-form-item>
        
        <n-form-item v-if="localConfig.source.hls.enabled" label="重试间隔(ms)">
          <n-input-number
            v-model:value="localConfig.source.hls.retryDelay"
            :min="100"
            :max="10000"
            :step="100"
            placeholder="重试间隔"
          />
        </n-form-item>
      </n-card>

      <!-- 样式设置 -->
      <n-card title="样式设置" size="small" class="config-section">
        <!-- 容器样式 -->
        <n-divider title-placement="left">
          <n-text style="font-size: 14px; font-weight: 500;">容器样式</n-text>
        </n-divider>
        
        <n-form-item label="背景色">
          <n-color-picker
            v-model:value="localConfig.style.container.backgroundColor"
            :show-alpha="false"
          />
        </n-form-item>
        
        <n-form-item label="显示边框">
          <n-switch v-model:value="localConfig.style.container.border.show" />
        </n-form-item>
        
        <template v-if="localConfig.style.container.border.show">
          <n-form-item label="边框宽度">
            <n-input-number
              v-model:value="localConfig.style.container.border.width"
              :min="1"
              :max="10"
              suffix="px"
            />
          </n-form-item>
          
          <n-form-item label="边框颜色">
            <n-color-picker
              v-model:value="localConfig.style.container.border.color"
              :show-alpha="false"
            />
          </n-form-item>
          
          <n-form-item label="边框圆角">
            <n-input-number
              v-model:value="localConfig.style.container.border.radius"
              :min="0"
              :max="50"
              suffix="px"
            />
          </n-form-item>
        </template>
        
        <n-form-item label="内边距">
          <n-space vertical>
            <n-space>
              <n-input-number
                v-model:value="localConfig.style.container.padding.top"
                :min="0"
                :max="100"
                placeholder="上"
                style="width: 80px;"
              />
              <n-input-number
                v-model:value="localConfig.style.container.padding.right"
                :min="0"
                :max="100"
                placeholder="右"
                style="width: 80px;"
              />
            </n-space>
            <n-space>
              <n-input-number
                v-model:value="localConfig.style.container.padding.bottom"
                :min="0"
                :max="100"
                placeholder="下"
                style="width: 80px;"
              />
              <n-input-number
                v-model:value="localConfig.style.container.padding.left"
                :min="0"
                :max="100"
                placeholder="左"
                style="width: 80px;"
              />
            </n-space>
          </n-space>
        </n-form-item>
        
        <!-- 播放器样式 -->
        <n-divider title-placement="left">
          <n-text style="font-size: 14px; font-weight: 500;">播放器样式</n-text>
        </n-divider>
        
        <n-form-item label="宽度">
          <n-input
            v-model:value="localConfig.style.player.width"
            placeholder="如：100%, 400px"
          />
        </n-form-item>
        
        <n-form-item label="高度">
          <n-input
            v-model:value="localConfig.style.player.height"
            placeholder="如：100%, 300px"
          />
        </n-form-item>
        
        <n-form-item label="对象适应">
          <n-select
            v-model:value="localConfig.style.player.objectFit"
            :options="objectFitOptions"
            placeholder="选择对象适应方式"
          />
        </n-form-item>
      </n-card>

      <!-- 错误处理 -->
      <n-card title="错误处理" size="small" class="config-section">
        <n-form-item label="启用重试">
          <n-switch v-model:value="localConfig.error.retry.enabled" />
        </n-form-item>
        
        <template v-if="localConfig.error.retry.enabled">
          <n-form-item label="最大重试次数">
            <n-input-number
              v-model:value="localConfig.error.retry.maxRetries"
              :min="1"
              :max="10"
              placeholder="重试次数"
            />
          </n-form-item>
          
          <n-form-item label="重试间隔(ms)">
            <n-input-number
              v-model:value="localConfig.error.retry.retryInterval"
              :min="1000"
              :max="30000"
              :step="1000"
              placeholder="重试间隔"
            />
          </n-form-item>
        </template>
        
        <n-form-item label="显示错误信息">
          <n-switch v-model:value="localConfig.error.display.showMessage" />
        </n-form-item>
        
        <n-form-item v-if="localConfig.error.display.showMessage" label="自定义错误信息">
          <n-input
            v-model:value="localConfig.error.display.customMessage"
            placeholder="请输入自定义错误信息"
            clearable
          />
        </n-form-item>
      </n-card>

      <!-- 性能优化 -->
      <n-card title="性能优化" size="small" class="config-section">
        <n-form-item label="懒加载">
          <n-switch v-model:value="localConfig.performance.lazyLoad" />
          <template #feedback>
            <n-text depth="3" style="font-size: 12px;">
              启用懒加载可提高页面性能
            </n-text>
          </template>
        </n-form-item>
        
        <n-form-item v-if="localConfig.performance.lazyLoad" label="预加载阈值">
          <n-slider
            v-model:value="localConfig.performance.preloadThreshold"
            :min="0"
            :max="1"
            :step="0.1"
            :format-tooltip="(value) => `${Math.round(value * 100)}%`"
          />
        </n-form-item>
        
        <n-form-item label="缓冲大小(KB)">
          <n-input-number
            v-model:value="localConfig.performance.bufferSize"
            :min="256"
            :max="8192"
            :step="256"
            placeholder="缓冲大小"
          />
        </n-form-item>
      </n-card>

      <!-- 操作按钮 -->
      <n-card size="small" class="config-section">
        <n-space justify="end">
          <n-button size="small" @click="resetToDefault">
            重置为默认值
          </n-button>
          <n-button type="primary" size="small" @click="previewConfig">
            预览配置
          </n-button>
        </n-space>
      </n-card>
    </n-form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed } from 'vue'
import type { VideoPlayerConfig } from './index'
import { videoPlayerDefinition } from './index'
import { useMessage } from 'naive-ui'

const message = useMessage()

// Props定义
interface Props {
  config: VideoPlayerConfig
}

const props = withDefaults(defineProps<Props>(), {
  config: () => ({})
})

// Emits定义
const emit = defineEmits<{
  'update:config': [config: VideoPlayerConfig]
  'preview': [config: VideoPlayerConfig]
}>()

// 表单引用
const formRef = ref()

// 本地配置
const localConfig = reactive<VideoPlayerConfig>({
  basic: {
    title: ''
  },
  player: {
    autoplay: true,
    muted: true,
    controls: true,
    preload: 'auto',
    loop: false,
    playbackRate: 1,
    volume: 0.8,
    fullscreen: true
  },
  source: {
    defaultUrl: '',
    supportedFormats: ['mp4', 'webm', 'ogg', 'm3u8'],
    hls: {
      enabled: true,
      maxRetries: 3,
      retryDelay: 1000
    }
  },
  style: {
    container: {
      backgroundColor: '#000000',
      border: {
        show: false,
        width: 1,
        color: '#d9d9d9',
        radius: 4
      },
      padding: {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0
      }
    },
    player: {
      width: '100%',
      height: '100%',
      objectFit: 'contain'
    }
  },
  error: {
    retry: {
      enabled: true,
      maxRetries: 3,
      retryInterval: 2000
    },
    display: {
      showMessage: true,
      customMessage: '视频加载失败，请检查网络连接'
    }
  },
  performance: {
    lazyLoad: false,
    preloadThreshold: 0.5,
    bufferSize: 1024
  }
})

// 选项数据
const preloadOptions = [
  { label: '不预加载', value: 'none' },
  { label: '预加载元数据', value: 'metadata' },
  { label: '自动预加载', value: 'auto' }
]

const objectFitOptions = [
  { label: '填充', value: 'fill' },
  { label: '包含', value: 'contain' },
  { label: '覆盖', value: 'cover' },
  { label: '无', value: 'none' },
  { label: '缩小', value: 'scale-down' }
]

const playbackRateMarks = {
  0.25: '0.25x',
  0.5: '0.5x',
  1: '1x',
  1.5: '1.5x',
  2: '2x'
}

// 初始化配置
const initConfig = () => {
  const defaultConfig = videoPlayerDefinition.defaultConfig
  Object.assign(localConfig, {
    ...defaultConfig,
    ...props.config
  })
}

// 重置为默认值
const resetToDefault = () => {
  const defaultConfig = videoPlayerDefinition.defaultConfig
  Object.assign(localConfig, defaultConfig)
  message.success('已重置为默认配置')
}

// 预览配置
const previewConfig = () => {
  emit('preview', { ...localConfig })
  message.info('配置预览已更新')
}

// 监听配置变化
watch(
  () => props.config,
  () => {
    initConfig()
  },
  { immediate: true, deep: true }
)

watch(
  localConfig,
  () => {
    emit('update:config', { ...localConfig })
  },
  { deep: true }
)

// 初始化
initConfig()
</script>

<style scoped>
.video-player-config {
  padding: 16px;
  max-height: 70vh;
  overflow-y: auto;
}

.config-section {
  margin-bottom: 16px;
}

.config-section:last-child {
  margin-bottom: 0;
}

:deep(.n-card-header) {
  padding: 12px 16px;
  font-weight: 500;
}

:deep(.n-card__content) {
  padding: 16px;
}

:deep(.n-form-item) {
  margin-bottom: 16px;
}

:deep(.n-form-item:last-child) {
  margin-bottom: 0;
}

:deep(.n-divider) {
  margin: 12px 0;
}

/* 滚动条样式 */
.video-player-config::-webkit-scrollbar {
  width: 6px;
}

.video-player-config::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.video-player-config::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.video-player-config::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>