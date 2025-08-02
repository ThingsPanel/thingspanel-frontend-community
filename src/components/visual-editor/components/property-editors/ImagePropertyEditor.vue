<template>
  <n-card title="图片属性" size="small" :bordered="false">
    <n-form size="small" label-placement="left" label-width="60">
      <!-- 图片链接 -->
      <n-form-item label="链接">
        <n-input 
          :value="config.src"
          placeholder="请输入图片URL"
          @update:value="updateConfig('src', $event)"
        />
      </n-form-item>
      
      <!-- 替代文本 -->
      <n-form-item label="Alt">
        <n-input 
          :value="config.alt"
          placeholder="图片描述文本"
          @update:value="updateConfig('alt', $event)"
        />
      </n-form-item>
      
      <!-- 适应方式 -->
      <n-form-item label="适应">
        <n-select 
          :value="config.objectFit"
          size="small"
          :options="objectFitOptions"
          @update:value="updateConfig('objectFit', $event)"
        />
      </n-form-item>
      
      <!-- 预设图片快速选择 -->
      <n-form-item label="预设">
        <n-grid :cols="3" :x-gap="4" :y-gap="4">
          <n-gi v-for="preset in presets" :key="preset.src">
            <div 
              class="preset-image"
              :class="{ active: config.src === preset.src }"
              @click="selectPreset(preset)"
            >
              <img :src="preset.src" :alt="preset.alt" />
              <div class="preset-overlay">
                <n-icon size="16" color="white">
                  <div class="i-mdi-check" />
                </n-icon>
              </div>
            </div>
          </n-gi>
        </n-grid>
      </n-form-item>
    </n-form>
  </n-card>
</template>

<script setup lang="ts">
import type { ImageWidgetConfig } from '../../types'

interface Props {
  config: ImageWidgetConfig
}

const props = defineProps<Props>()

const emit = defineEmits<{
  update: [config: Partial<ImageWidgetConfig>]
}>()

// 适应方式选项
const objectFitOptions = [
  { label: '覆盖', value: 'cover' },
  { label: '包含', value: 'contain' },
  { label: '填充', value: 'fill' },
  { label: '缩小', value: 'scale-down' },
  { label: '原始', value: 'none' }
]

// 预设图片
const presets = [
  {
    src: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&h=200&fit=crop',
    alt: '风景'
  },
  {
    src: 'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=300&h=200&fit=crop',
    alt: '科技'
  },
  {
    src: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=300&h=200&fit=crop',
    alt: '商务'
  },
  {
    src: 'https://images.unsplash.com/photo-1551963831-b3b1ca40c98e?w=300&h=200&fit=crop',
    alt: '数据'
  },
  {
    src: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=300&h=200&fit=crop',
    alt: '抽象'
  },
  {
    src: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=300&h=200&fit=crop',
    alt: '办公'
  }
]

// 更新配置
const updateConfig = (key: keyof ImageWidgetConfig, value: any) => {
  if (value === null || value === undefined) return
  emit('update', { [key]: value })
}

// 选择预设图片
const selectPreset = (preset: typeof presets[0]) => {
  emit('update', {
    src: preset.src,
    alt: preset.alt
  })
}
</script>

<style scoped>
.preset-image {
  position: relative;
  aspect-ratio: 3/2;
  border-radius: 4px;
  overflow: hidden;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.2s ease;
}

.preset-image:hover {
  border-color: var(--n-primary-color-hover);
  transform: scale(1.02);
}

.preset-image.active {
  border-color: var(--n-primary-color);
}

.preset-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.preset-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.preset-image.active .preset-overlay,
.preset-image:hover .preset-overlay {
  opacity: 1;
}
</style>