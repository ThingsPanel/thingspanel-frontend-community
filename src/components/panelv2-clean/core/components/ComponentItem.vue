<!--
  @file ComponentItem.vue
  @description 单个组件项组件
  展示可拖拽的组件卡片
-->

<template>
  <div 
    class="component-item"
    :class="{ 
      'dragging': isDragging,
      'clickable': !isDraggable 
    }"
    :draggable="isDraggable"
    @dragstart="handleDragStart"
    @dragend="handleDragEnd"
    @click="handleClick"
  >
    <!-- 组件图标 -->
    <div class="component-icon">
      {{ component.meta.icon || '📦' }}
    </div>
    
    <!-- 组件信息 -->
    <div class="component-info">
      <div class="component-name">{{ component.name }}</div>
      <div class="component-description">{{ component.meta.description }}</div>
    </div>

    <!-- 拖拽提示 -->
    <div v-if="isDraggable" class="drag-hint">
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
}

const props = withDefaults(defineProps<Props>(), {
  isDraggable: true
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
  
  console.log('ComponentItem: 拖拽开始', props.component.type)
  emit('drag-start', props.component, event)
}

/**
 * 处理拖拽结束
 */
const handleDragEnd = () => {
  isDragging.value = false
  console.log('ComponentItem: 拖拽结束', props.component.type)
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
.component-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: white;
  border: 1px solid #e8e8e8;
  border-radius: 6px;
  cursor: grab;
  transition: all 0.2s;
  user-select: none;
  position: relative;
}

.component-item:hover {
  border-color: #1890ff;
  box-shadow: 0 2px 4px rgba(24, 144, 255, 0.1);
  transform: translateY(-1px);
}

.component-item.dragging {
  opacity: 0.8;
  transform: scale(0.98);
  cursor: grabbing;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.component-item.clickable {
  cursor: pointer;
}

/* 组件图标 */
.component-icon {
  font-size: 20px;
  line-height: 1;
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 组件信息 */
.component-info {
  flex: 1;
  min-width: 0;
}

.component-name {
  font-size: 13px;
  font-weight: 500;
  color: #333;
  margin-bottom: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.component-description {
  font-size: 11px;
  color: #999;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 拖拽提示 */
.drag-hint {
  flex-shrink: 0;
  opacity: 0.4;
  transition: opacity 0.2s;
}

.component-item:hover .drag-hint {
  opacity: 0.8;
}

.drag-icon {
  font-size: 12px;
  color: #bfbfbf;
  line-height: 1;
  transform: rotate(90deg);
  display: inline-block;
}

/* 拖拽状态特殊样式 */
.component-item.dragging .drag-hint {
  opacity: 1;
}

.component-item.dragging .component-name {
  color: #1890ff;
}

/* 禁用拖拽时的样式 */
.component-item:not([draggable="true"]) {
  cursor: pointer;
}

.component-item:not([draggable="true"]) .drag-hint {
  display: none;
}
</style>