<template>
  <div class="text-card">
    <h5 class="title">{{ config.content?.title || '默认标题' }}</h5>
    <p class="content">{{ config.content?.content || '默认内容' }}</p>
  </div>
</template>

<script lang="ts" setup>
import type { PanelCard } from '../types';

defineProps<{ 
  config: PanelCard['config'];
}>();
</script>

<style scoped>
.text-card {
  padding: 16px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.title {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: bold;
  color: #333;
}

.content {
  margin: 0;
  font-size: 14px;
  color: #666;
  flex-grow: 1;
}
</style>