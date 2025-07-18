<template>
  <div class="toolbar">
    <button 
      v-for="action in actions" 
      :key="action.id" 
      class="toolbar-button" 
      :title="action.tooltip"
      @click="$emit('execute', action.action)"
    >
      <!-- 支持 emoji 图标和 CSS 类图标 -->
      <span v-if="action.icon && !action.icon.includes(' ')" class="icon-emoji">{{ action.icon }}</span>
      <i v-else :class="action.icon"></i>
    </button>
  </div>
</template>

<script lang="ts" setup>
import type { ToolbarAction } from '../types';

defineProps<{ actions?: ToolbarAction[] }>();
defineEmits(['execute']);
</script>

<style scoped>
.toolbar {
  display: flex;
  align-items: center;
  padding: 4px 8px;
  background-color: #ffffff;
  border-bottom: 1px solid #e8e8e8;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  z-index: 10;
}

.toolbar-button {
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  margin: 0 4px;
  font-size: 18px;
  color: #555;
  border-radius: 4px;
  transition: background-color 0.2s, color 0.2s;
}

.toolbar-button:hover {
  background-color: #f0f0f0;
  color: #000;
}

.icon-emoji {
  font-size: 16px;
  line-height: 1;
  display: inline-block;
}
</style>