<template>
  <div class="text-widget" :style="textStyle">
    {{ content }}
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { TextWidgetConfig } from '@/components/visual-editor/types'

interface Props extends TextWidgetConfig {
  content?: string
  fontSize?: number
  color?: string
  textAlign?: 'left' | 'center' | 'right'
  fontWeight?: 'normal' | 'bold'
}

const props = withDefaults(defineProps<Props>(), {
  content: '文本内容',
  fontSize: 14,
  color: 'var(--n-text-color)',
  textAlign: 'left',
  fontWeight: 'normal'
})

const textStyle = computed(() => ({
  fontSize: props.fontSize + 'px',
  color: props.color,
  textAlign: props.textAlign,
  fontWeight: props.fontWeight,
  // 确保文本填满容器
  width: '100%',
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  // 使用CSS变量确保主题兼容
  fontFamily: 'var(--n-font-family)',
  lineHeight: '1.5',
  wordBreak: 'break-word',
  padding: '4px',
  boxSizing: 'border-box'
}))
</script>

<style scoped>
.text-widget {
  user-select: none;
  overflow: hidden;
  /* 防止文本溢出 */
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 支持多行文本时的样式 */
.text-widget.multiline {
  white-space: pre-wrap;
  word-wrap: break-word;
}
</style>
