<template>
  <div class="image-widget">
    <n-image 
      v-if="src"
      :src="src"
      :alt="alt"
      :object-fit="objectFit"
      :style="{ width: '100%', height: '100%' }"
      :preview-disabled="true"
    />
    <div 
      v-else 
      class="image-placeholder"
    >
      <n-icon size="24">
        <div class="i-mdi-image" />
      </n-icon>
      <span>{{ alt || '图片' }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  src?: string
  alt?: string
  objectFit?: 'cover' | 'contain' | 'fill'
}

const props = withDefaults(defineProps<Props>(), {
  src: '',
  alt: '图片',
  objectFit: 'cover'
})
</script>

<style scoped>
.image-widget {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.image-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: var(--n-card-color);
  border: 1px dashed var(--n-border-color);
  color: var(--n-text-color-disabled);
  font-size: 12px;
  gap: 4px;
}
</style>