<template>
  <div class="sidebar">
    <div 
      v-for="item in items" 
      :key="item.type" 
      class="draggable-item"
      draggable="true"
      @dragstart="onDragStart($event, item)"
    >
      <i v-if="item.icon" :class="item.icon"></i>
      <span>{{ item.label }}</span>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { DraggableItem } from '../types';

defineProps<{ items?: DraggableItem[] }>();

const onDragStart = (event: DragEvent, item: DraggableItem) => {
  if (event.dataTransfer) {
    // 将整个 DraggableItem 序列化，以便 Canvas 端可以获取默认数据
    event.dataTransfer.setData('application/json', JSON.stringify(item));
    event.dataTransfer.effectAllowed = 'copy';
  }
};
</script>

<style scoped>
.sidebar {
  width: 200px;
  padding: 16px;
  background-color: #ffffff;
  border-right: 1px solid #e8e8e8;
  overflow-y: auto;
}

.draggable-item {
  padding: 12px;
  margin-bottom: 8px;
  border: 1px dashed #ccc;
  border-radius: 4px;
  cursor: grab;
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: #fafafa;
  transition: background-color 0.2s, border-color 0.2s;
}

.draggable-item:hover {
  background-color: #f0f0f0;
  border-color: #aaa;
}
</style>