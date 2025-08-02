<!--
  Visualization Toolbar Component
  可视化渲染器工具栏组件
-->
<template>
  <div class="visualization-toolbar">
    <div class="toolbar-section">
      <button 
        class="toolbar-btn"
        :disabled="readonly"
        @click="$emit('add-item')"
      >
        <i class="icon-plus" />
        添加组件
      </button>
      
      <button 
        class="toolbar-btn"
        :disabled="readonly"
        @click="$emit('clear-all')"
      >
        <i class="icon-trash" />
        清空
      </button>
    </div>
    
    <div class="toolbar-section">
      <button 
        class="toolbar-btn"
        @click="$emit('save-layout')"
      >
        <i class="icon-save" />
        保存布局
      </button>
      
      <button 
        class="toolbar-btn"
        @click="$emit('load-layout')"
      >
        <i class="icon-upload" />
        加载布局
      </button>
    </div>
    
    <div class="toolbar-section">
      <button 
        class="toolbar-btn"
        @click="$emit('toggle-grid')"
      >
        <i class="icon-grid" />
        网格
      </button>
      
      <button 
        class="toolbar-btn"
        @click="$emit('fit-content')"
      >
        <i class="icon-fit" />
        适应内容
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
// Props
interface Props {
  readonly?: boolean
}

withDefaults(defineProps<Props>(), {
  readonly: false
})

// Emits
interface Emits {
  (e: 'add-item'): void
  (e: 'clear-all'): void
  (e: 'save-layout'): void
  (e: 'load-layout'): void
  (e: 'toggle-grid'): void
  (e: 'fit-content'): void
}

defineEmits<Emits>()

// 工具栏配置接口
export interface VisualizationToolbarConfig {
  showAddButton?: boolean
  showClearButton?: boolean
  showSaveButton?: boolean
  showLoadButton?: boolean
  showGridButton?: boolean
  showFitButton?: boolean
}
</script>

<style scoped>
.visualization-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: var(--bg-color-secondary);
  border-bottom: 1px solid var(--border-color);
  gap: 12px;
}

.toolbar-section {
  display: flex;
  align-items: center;
  gap: 8px;
}

.toolbar-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  background: var(--bg-color);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  color: var(--text-color);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.toolbar-btn:hover:not(:disabled) {
  background: var(--bg-color-hover);
  border-color: var(--primary-color);
}

.toolbar-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.toolbar-btn i {
  font-size: 14px;
}
</style>