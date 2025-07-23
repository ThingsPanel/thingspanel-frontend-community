<template>
  <div class="image-input-inspector">
    <label v-if="label" class="input-label">{{ label }}</label>
    
    <div class="image-container">
      <!-- 图片预览 -->
      <div v-if="modelValue" class="image-preview">
        <img 
          :src="modelValue" 
          :alt="alt || '图片预览'"
          class="preview-image"
          @error="handleImageError"
        />
        <div class="image-actions">
          <button 
            type="button" 
            class="action-btn remove-btn"
            title="删除图片"
            @click="removeImage"
          >
            <i class="fa fa-trash"></i>
          </button>
        </div>
      </div>

      <!-- 上传区域 -->
      <div 
        v-else
        class="upload-area"
        :class="{ 'dragover': isDragOver }"
        @click="triggerFileInput"
        @drop="handleDrop"
        @dragover.prevent="isDragOver = true"
        @dragleave="isDragOver = false"
      >
        <i class="fa fa-cloud-upload-alt upload-icon"></i>
        <p class="upload-text">点击上传或拖拽图片到此处</p>
        <p class="upload-hint">支持 JPG, PNG, GIF 格式</p>
      </div>
    </div>

    <!-- URL输入 -->
    <div class="url-input-section">
      <input
        type="text"
        :value="modelValue"
        placeholder="或输入图片URL"
        class="url-input"
        @input="handleUrlInput"
      />
    </div>

    <!-- 隐藏的文件输入 -->
    <input
      ref="fileInput"
      type="file"
      accept="image/*"
      class="hidden-file-input"
      @change="handleFileSelect"
    />

    <div v-if="description" class="input-description">{{ description }}</div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const props = defineProps<{
  modelValue: string
  label?: string
  description?: string
  alt?: string
  maxSize?: number // 最大文件大小 (MB)
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const fileInput = ref<HTMLInputElement>()
const isDragOver = ref(false)

const triggerFileInput = () => {
  fileInput.value?.click()
}

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    handleFile(file)
  }
}

const handleDrop = (event: DragEvent) => {
  event.preventDefault()
  isDragOver.value = false
  
  const file = event.dataTransfer?.files[0]
  if (file && file.type.startsWith('image/')) {
    handleFile(file)
  }
}

const handleFile = async (file: File) => {
  // 检查文件大小
  const maxSize = (props.maxSize || 5) * 1024 * 1024 // 默认5MB
  if (file.size > maxSize) {
    alert(`文件大小不能超过 ${props.maxSize || 5}MB`)
    return
  }

  // 转换为 base64
  const reader = new FileReader()
  reader.onload = (e) => {
    const result = e.target?.result as string
    emit('update:modelValue', result)
  }
  reader.readAsDataURL(file)
}

const handleUrlInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', target.value)
}

const removeImage = () => {
  emit('update:modelValue', '')
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

const handleImageError = () => {
  console.error('图片加载失败')
}
</script>

<style scoped>
.image-input-inspector {
  margin-bottom: 16px;
}

.input-label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #262626;
}

.image-container {
  margin-bottom: 8px;
}

.image-preview {
  position: relative;
  border-radius: 4px;
  overflow: hidden;
  border: 1px solid #d9d9d9;
}

.preview-image {
  width: 100%;
  height: 120px;
  object-fit: cover;
  display: block;
}

.image-actions {
  position: absolute;
  top: 8px;
  right: 8px;
}

.action-btn {
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
}

.action-btn:hover {
  background: rgba(0, 0, 0, 0.8);
}

.upload-area {
  border: 2px dashed #d9d9d9;
  border-radius: 4px;
  padding: 24px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  background: #fafafa;
}

.upload-area:hover,
.upload-area.dragover {
  border-color: #40a9ff;
  background: #f0f8ff;
}

.upload-icon {
  font-size: 32px;
  color: #ccc;
  margin-bottom: 8px;
}

.upload-text {
  margin: 8px 0 4px 0;
  font-size: 14px;
  color: #666;
}

.upload-hint {
  margin: 0;
  font-size: 12px;
  color: #999;
}

.url-input-section {
  margin-top: 8px;
}

.url-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 14px;
  box-sizing: border-box;
  transition: border-color 0.2s;
}

.url-input:focus {
  outline: none;
  border-color: #40a9ff;
  box-shadow: 0 0 0 2px rgba(64, 169, 255, 0.2);
}

.hidden-file-input {
  display: none;
}

.input-description {
  margin-top: 8px;
  font-size: 12px;
  color: #8c8c8c;
  line-height: 1.4;
}
</style>