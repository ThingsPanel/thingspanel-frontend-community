<!--
  @file ComponentCard.vue
  @description 单个组件卡片组件（简化版）
  展示可拖拽的组件卡片 - 适用于tab布局
-->

<template>
  <div 
    class="component-card"
    :class="{ 
      'dragging': isDragging,
      'clickable': !isDraggable,
      'compact': compact
    }"
    :draggable="isDraggable"
    @dragstart="handleDragStart"
    @dragend="handleDragEnd"
    @click="handleClick"
  >
    <!-- 组件图标 -->
    <div class="card-icon">
      {{ component.meta.icon || '📦' }}
    </div>
    
    <!-- 组件信息 -->
    <div class="card-info">
      <div class="card-name">{{ component.name }}</div>
      <div v-if="!compact" class="card-description">{{ component.meta.description }}</div>
    </div>

    <!-- 拖拽提示 -->
    <div v-if="isDraggable && !compact" class="drag-hint">
      <span class="drag-icon">⋮⋮</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { ComponentDefinition } from '../../types/core'

// Props定义
interface Props {
  component: ComponentDefinition
  isDraggable?: boolean
  compact?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isDraggable: true,
  compact: false
})

// 事件定义
const emit = defineEmits<{
  'drag-start': [component: ComponentDefinition, event: DragEvent]
  'click': [component: ComponentDefinition]
}>()

// 响应式数据
const isDragging = ref(false)

/**
 * 处理拖拽开始
 */
const handleDragStart = (event: DragEvent) => {
  if (!props.isDraggable) return
  
  isDragging.value = true
  
  // 设置拖拽数据
  const dragData = {
    type: 'component',
    componentType: props.component.type,
    componentDef: props.component
  }
  
  if (event.dataTransfer) {
    event.dataTransfer.setData('application/json', JSON.stringify(dragData))
    event.dataTransfer.effectAllowed = 'copy'
    
    // 设置拖拽时的视觉效果
    event.dataTransfer.setDragImage(event.currentTarget as Element, 0, 0)
  }
  
  console.log('ComponentCard: 拖拽开始', props.component.type)
  emit('drag-start', props.component, event)
}

/**
 * 处理拖拽结束
 */
const handleDragEnd = () => {
  isDragging.value = false
  console.log('ComponentCard: 拖拽结束', props.component.type)
}

/**
 * 处理点击事件
 */
const handleClick = () => {
  if (!isDragging.value) {
    emit('click', props.component)
  }
}
</script>

<style scoped>
.component-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: white;
  border: 1px solid #e8e8e8;
  border-radius: 6px;
  cursor: grab;
  transition: all 0.2s;
  user-select: none;
  position: relative;
  min-height: 80px;
  width: 100%;
}

.component-card:hover {
  border-color: #1890ff;
  box-shadow: 0 2px 8px rgba(24, 144, 255, 0.15);
  transform: translateY(-2px);
}

.component-card.dragging {
  opacity: 0.8;
  transform: scale(0.98);
  cursor: grabbing;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.component-card.clickable {
  cursor: pointer;
}

/* 紧凑模式 */
.component-card.compact {
  flex-direction: row;
  min-height: 48px;
  padding: 8px 12px;
  gap: 12px;
}

.component-card.compact .card-info {
  text-align: left;
}

/* 组件图标 */
.card-icon {
  font-size: 24px;
  line-height: 1;
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
  border-radius: 6px;
  transition: all 0.2s;
}

.component-card.compact .card-icon {
  font-size: 18px;
  width: 24px;
  height: 24px;
}

.component-card:hover .card-icon {
  background: #e6f7ff;
}

/* 组件信息 */
.card-info {
  flex: 1;
  min-width: 0;
  text-align: center;
}

.card-name {
  font-size: 12px;
  font-weight: 500;
  color: #333;
  margin-bottom: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.component-card.compact .card-name {
  font-size: 13px;
  margin-bottom: 0;
}

.card-description {
  font-size: 10px;
  color: #999;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  height: 24px;
}

/* 拖拽提示 */
.drag-hint {
  position: absolute;
  top: 4px;
  right: 4px;
  opacity: 0.3;
  transition: opacity 0.2s;
}

.component-card:hover .drag-hint {
  opacity: 0.8;
}

.drag-icon {
  font-size: 10px;
  color: #bfbfbf;
  line-height: 1;
  transform: rotate(90deg);
  display: inline-block;
}

/* 拖拽状态特殊样式 */
.component-card.dragging .drag-hint {
  opacity: 1;
}

.component-card.dragging .card-name {
  color: #1890ff;
}

/* 禁用拖拽时的样式 */
.component-card:not([draggable="true"]) {
  cursor: pointer;
}

.component-card:not([draggable="true"]) .drag-hint {
  display: none;
}

/* 网格布局适配 */
.component-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 8px;
  padding: 12px;
}

.component-grid.compact {
  grid-template-columns: 1fr;
  gap: 4px;
}

/* 响应式调整 */
@media (max-width: 280px) {
  .component-card {
    min-height: 60px;
    padding: 8px;
  }
  
  .card-icon {
    width: 20px;
    height: 20px;
    font-size: 16px;
  }
  
  .card-name {
    font-size: 11px;
  }
  
  .card-description {
    font-size: 9px;
    height: 18px;
    -webkit-line-clamp: 1;
  }
}
</style>