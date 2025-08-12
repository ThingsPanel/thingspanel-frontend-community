<template>
  <div class="text-widget" :style="textStyle">
    {{ content }}
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  content?: string
  fontSize?: number
  color?: string
  textAlign?: 'left' | 'center' | 'right'
}

const props = withDefaults(defineProps<Props>(), {
  content: '文本内容',
  fontSize: 14,
  color: '#333333',
  textAlign: 'left'
})

const textStyle = computed(() => ({
  fontSize: props.fontSize + 'px',
  color: props.color,
  textAlign: props.textAlign,
  width: '100%',
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  padding: '4px',
  boxSizing: 'border-box' as const,
  wordBreak: 'break-word' as const,
  overflow: 'hidden'
}))
</script>

<style scoped>
.text-widget {
  user-select: none;
}
</style>
