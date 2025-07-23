<template>
  <div class="image-card" :style="cardStyle">
    <div v-if="config.showTitle?.value" class="image-card-header">
      <h3 class="image-title">{{ config.title?.value || '图片' }}</h3>
      <p v-if="config.description?.value" class="image-description">
        {{ config.description.value }}
      </p>
    </div>
    
    <div class="image-container" :class="{ 'with-header': config.showTitle?.value }">
      <img
        v-if="config.imageUrl?.value"
        :src="config.imageUrl.value"
        :alt="config.alt?.value || config.title?.value || '图片'"
        class="image"
        :style="imageStyle"
        @error="handleImageError"
        @load="handleImageLoad"
      />
      <div v-else class="placeholder">
        <i class="fa fa-image placeholder-icon"></i>
        <p class="placeholder-text">暂无图片</p>
      </div>
    </div>

    <div v-if="config.showActions?.value" class="image-actions">
      <button
        v-if="config.allowFullscreen?.value"
        class="action-btn"
        title="全屏查看"
        @click="openFullscreen"
      >
        <i class="fa fa-expand"></i>
      </button>
      <button
        v-if="config.allowDownload?.value"
        class="action-btn"
        title="下载图片"
        @click="downloadImage"
      >
        <i class="fa fa-download"></i>
      </button>
    </div>

    <!-- 全屏模态框 -->
    <div v-if="showFullscreen" class="fullscreen-modal" @click="closeFullscreen">
      <div class="fullscreen-content" @click.stop>
        <img
          :src="config.imageUrl?.value"
          :alt="config.alt?.value || config.title?.value"
          class="fullscreen-image"
        />
        <button class="close-btn" @click="closeFullscreen">
          <i class="fa fa-times"></i>
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';

const props = defineProps<{
  config: {
    title?: { value: string }
    description?: { value: string }
    imageUrl?: { value: string }
    alt?: { value: string }
    showTitle?: { value: boolean }
    showActions?: { value: boolean }
    allowFullscreen?: { value: boolean }
    allowDownload?: { value: boolean }
    objectFit?: { value: 'cover' | 'contain' | 'fill' | 'scale-down' | 'none' }
    borderRadius?: { value: number }
    backgroundColor?: { value: string }
    border?: { value: string }
  }
}>()

const showFullscreen = ref(false)

const cardStyle = computed(() => ({
  backgroundColor: props.config.backgroundColor?.value || '#ffffff',
  border: props.config.border?.value || '1px solid #e8e8e8',
  borderRadius: `${props.config.borderRadius?.value || 8}px`
}))

const imageStyle = computed(() => ({
  objectFit: props.config.objectFit?.value || 'cover'
}))

const openFullscreen = () => {
  showFullscreen.value = true
  document.body.style.overflow = 'hidden'
}

const closeFullscreen = () => {
  showFullscreen.value = false
  document.body.style.overflow = ''
}

const downloadImage = async () => {
  const imageUrl = props.config.imageUrl?.value
  if (!imageUrl) return

  try {
    const response = await fetch(imageUrl, { mode: 'cors' })
    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = props.config.title?.value || 'image'
    link.style.display = 'none'
    
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Download failed:', error)
    // 回退方案：直接打开图片
    window.open(imageUrl, '_blank')
  }
}

const handleImageError = (event: Event) => {
  console.error('Image load error:', event)
}

const handleImageLoad = (event: Event) => {
  console.log('Image loaded successfully:', event)
}
</script>

<style scoped>
.image-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
}

.image-card-header {
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.image-title {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 500;
  color: #262626;
}

.image-description {
  margin: 0;
  font-size: 14px;
  color: #666;
  line-height: 1.4;
}

.image-container {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.image-container.with-header {
  flex: 1;
}

.image {
  width: 100%;
  height: 100%;
  display: block;
  transition: transform 0.3s ease;
}

.image:hover {
  transform: scale(1.02);
}

.placeholder {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #fafafa;
  color: #ccc;
}

.placeholder-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.placeholder-text {
  margin: 0;
  font-size: 14px;
}

.image-actions {
  position: absolute;
  top: 8px;
  right: 8px;
  display: flex;
  gap: 8px;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.image-card:hover .image-actions {
  opacity: 1;
}

.action-btn {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.3s ease;
}

.action-btn:hover {
  background: rgba(0, 0, 0, 0.8);
}

/* 全屏模态框 */
.fullscreen-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.fullscreen-content {
  position: relative;
  max-width: 90%;
  max-height: 90%;
}

.fullscreen-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.close-btn {
  position: absolute;
  top: -40px;
  right: 0;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.9);
  color: #333;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
}

.close-btn:hover {
  background: white;
}
</style>