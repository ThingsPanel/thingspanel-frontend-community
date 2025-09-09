<template>
  <div class="image-widget">
    <n-image
      v-if="src"
      :src="src"
      :alt="alt"
      :object-fit="objectFit"
      :style="imageStyle"
      :preview-disabled="true"
      @error="handleError"
    />
    <div v-else class="image-placeholder" :style="placeholderStyle">
      <n-icon size="24" :color="placeholderColor">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M5 21q-.825 0-1.413-.588T3 19V5q0-.825.588-1.413T5 3h14q.825 0 1.413.588T21 5v14q0 .825-.588 1.413T19 21H5zm1-4h12l-3.75-5l-3 4L9 13l-3 4z"
          />
        </svg>
      </n-icon>
      <span class="placeholder-text">{{ alt || $t('visualEditor.imagePlaceholderText') }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useThemeVars } from 'naive-ui'
import { $t } from '@/locales'
import type { ImageWidgetConfig } from '../types'

interface Props extends ImageWidgetConfig {
  src?: string
  alt?: string
  objectFit?: 'cover' | 'contain' | 'fill' | 'scale-down' | 'none'
}

const props = withDefaults(defineProps<Props>(), {
  src: '',
  alt: $t('visualEditor.imagePlaceholderText'),
  objectFit: 'cover'
})

const themeVars = useThemeVars()
const hasError = ref(false)

const imageStyle = computed(() => ({
  width: '100%',
  height: '100%',
  objectFit: props.objectFit
}))

const placeholderStyle = computed(() => ({
  width: '100%',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: themeVars.value.cardColor,
  border: `1px dashed ${themeVars.value.borderColor}`,
  borderRadius: '4px',
  color: themeVars.value.textColorDisabled
}))

const placeholderColor = computed(() => themeVars.value.textColorDisabled)

const handleError = () => {
  hasError.value = true
}
</script>

<style scoped>
.image-widget {
  width: 100%;
  height: 100%;
  overflow: hidden;
  border-radius: 4px;
}

.image-placeholder {
  gap: 8px;
  font-size: 12px;
  text-align: center;
  user-select: none;
}

.placeholder-text {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 确保NaiveUI图片组件样式正确 */
:deep(.n-image) {
  width: 100%;
  height: 100%;
}

:deep(.n-image img) {
  width: 100%;
  height: 100%;
}
</style>
