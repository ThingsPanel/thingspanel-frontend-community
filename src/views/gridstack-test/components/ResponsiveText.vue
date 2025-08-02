<template>
  <div ref="containerRef" class="responsive-text">
    <h3 :style="{ fontSize: titleFontSize }">Info Panel</h3>
    <p :style="{ fontSize: contentFontSize }">{{ displayedText }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useElementSize } from '@vueuse/core'

const containerRef = ref(null)
const { width, height } = useElementSize(containerRef)

const shortText = "Short text."
const mediumText = "This is a medium length text that appears when there is a bit more space."
const longText = "This is the full, long text that is displayed only when the component has a large amount of space available for it to render completely. It contains much more detail."

const displayedText = computed(() => {
  const area = width.value * height.value
  if (area > 30000) return longText
  if (area > 15000) return mediumText
  return shortText
})

const titleFontSize = computed(() => {
  return `${Math.max(12, Math.min(24, width.value / 15))}px`
})

const contentFontSize = computed(() => {
  return `${Math.max(10, Math.min(16, width.value / 25))}px`
})
</script>

<style scoped>
.responsive-text {
  width: 100%;
  height: 100%;
  padding: 15px;
  box-sizing: border-box;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
h3 {
  margin: 0 0 10px 0;
  transition: font-size 0.2s ease;
  color: #333;
}
p {
  margin: 0;
  transition: font-size 0.2s ease;
  flex-grow: 1;
  color: #555;
}
</style>