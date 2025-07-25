<template>
  <div class="image-card">
    <div class="image-container">
      <img
        v-if="config.content?.src"
        :src="config.content.src"
        :alt="config.content?.alt || '图片'"
        class="image"
      />
      <div v-else class="placeholder">
        <i class="fa fa-image placeholder-icon"></i>
        <p class="placeholder-text">暂无图片</p>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { PanelCard } from '../types';

defineProps<{ 
  config: PanelCard['config'];
}>();
</script>

<style scoped>
.image-card {
  height: 100%;
  padding: 16px;
  display: flex;
  flex-direction: column;
}

.image-container {
  flex: 1;
  position: relative;
  overflow: hidden;
  border-radius: 4px;
}

.image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.placeholder {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #fafafa;
  color: #ccc;
  border-radius: 4px;
}

.placeholder-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.placeholder-text {
  margin: 0;
  font-size: 14px;
}
</style>