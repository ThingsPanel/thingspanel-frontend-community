<template>
  <div ref="containerRef" class="responsive-image">
    <img :src="imageUrl" alt="Random Image" />
    <div v-if="showDetails" class="image-details">
      <h4>Image Details</h4>
      <p>Source: Picsum Photos</p>
      <p>Size: {{ Math.round(width) }} x {{ Math.round(height) }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useElementSize } from '@vueuse/core'

const props = defineProps<{
  item: { i: string }
}>()

const containerRef = ref(null)
const { width, height } = useElementSize(containerRef)

// Use item id to get a consistent image per item
const imageId = computed(() => (parseInt(props.item.i.replace(/[^0-9]/g, '')) % 1000) || 1)
const imageUrl = computed(() => `https://picsum.photos/id/${imageId.value}/${Math.round(width.value) || 200}/${Math.round(height.value) || 200}`)

const showDetails = computed(() => {
  return width.value > 150 && height.value > 150
})
</script>

<style scoped>
.responsive-image {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
  background-color: #eee;
}
img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}
.responsive-image:hover img {
    transform: scale(1.05);
}
.image-details {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  padding: 10px;
  transition: opacity 0.3s ease;
  opacity: 0;
  pointer-events: none;
}
.responsive-image:hover .image-details {
  opacity: 1;
}
h4 {
  margin: 0 0 5px 0;
}
p {
  margin: 0;
  font-size: 12px;
}
</style>