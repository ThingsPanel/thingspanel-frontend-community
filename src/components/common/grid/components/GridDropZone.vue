<!--
  Grid 拖拽区域组件
  处理外部元素拖拽到网格的逻辑
-->
<template>
  <div
    v-if="!readonly && showDropZone"
    class="drop-zone"
    :class="{ dragging: isDragging }"
    @dragenter="handleDragEnter"
    @dragover="handleDragOver"
    @dragleave="handleDragLeave"
    @drop="handleDrop"
  >
    <div class="drop-hint">
      <n-icon :size="24">
        <AddOutline />
      </n-icon>
      <span>{{ $t('grid.dropHint', '拖拽组件到此处添加') }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * Grid 拖拽区域组件
 * 专门处理拖拽操作和外部元素添加
 */

import { ref } from 'vue'
import { NIcon } from 'naive-ui'
import { AddOutline } from '@vicons/ionicons5'

interface Props {
  /** 是否只读模式 */
  readonly?: boolean
  /** 是否显示拖拽区域 */
  showDropZone?: boolean
}

interface Emits {
  /** 拖拽进入事件 */
  'drag-enter': [event: DragEvent]
  /** 拖拽悬停事件 */
  'drag-over': [event: DragEvent]
  /** 拖拽离开事件 */
  'drag-leave': [event: DragEvent]
  /** 拖拽释放事件 */
  drop: [event: DragEvent]
}

const props = withDefaults(defineProps<Props>(), {
  readonly: false,
  showDropZone: false
})

const emit = defineEmits<Emits>()

// 拖拽状态管理
const isDragging = ref(false)
const dragCounter = ref(0)

/**
 * 处理拖拽进入
 * 使用计数器防止子元素触发的虚假离开事件
 */
const handleDragEnter = (event: DragEvent) => {
  event.preventDefault()
  dragCounter.value++
  if (dragCounter.value === 1) {
    isDragging.value = true
  }
  emit('drag-enter', event)
}

/**
 * 处理拖拽悬停
 * 必须阻止默认行为以允许拖放
 */
const handleDragOver = (event: DragEvent) => {
  event.preventDefault()
  emit('drag-over', event)
}

/**
 * 处理拖拽离开
 * 使用计数器确保真正离开拖拽区域
 */
const handleDragLeave = (event: DragEvent) => {
  event.preventDefault()
  dragCounter.value--
  if (dragCounter.value === 0) {
    isDragging.value = false
  }
  emit('drag-leave', event)
}

/**
 * 处理拖拽释放
 * 重置状态并触发释放事件
 */
const handleDrop = (event: DragEvent) => {
  event.preventDefault()
  isDragging.value = false
  dragCounter.value = 0
  emit('drop', event)
}

// 暴露给父组件的方法
defineExpose({
  isDragging: isDragging.value
})
</script>

<style scoped>
.drop-zone {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(var(--primary-color-rgb), 0.1);
  border: 2px dashed var(--primary-color);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s ease;
  pointer-events: none;
  z-index: 1000;
}

.drop-zone.dragging {
  opacity: 1;
  pointer-events: all;
}

.drop-hint {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: var(--primary-color);
  font-size: 16px;
  font-weight: 500;
  text-align: center;
}

.drop-hint span {
  white-space: nowrap;
}

/* 响应主题变化 */
[data-theme='dark'] .drop-zone {
  background: rgba(var(--primary-color-rgb), 0.15);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .drop-hint {
    font-size: 14px;
  }

  .drop-hint span {
    font-size: 12px;
  }
}
</style>
