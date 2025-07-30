<template>
  <div 
    class="grid-item"
    :class="{
      'selected': isSelected,
      'dragging': isDragging,
      'resizing': isResizing,
      'locked': item.locked,
      'hidden': item.hidden
    }"
    :data-item-id="item.id"
    :data-item-type="item.type"
    :style="itemStyle"
    @mousedown="handleMouseDown"
    @click="handleClick"
  >
    <!-- 项目内容 -->
    <div class="item-content">
      <!-- 头部 -->
      <div class="item-header">
        <div class="item-title">{{ item.title || item.type }}</div>
        <div v-if="mode === 'edit' && !item.locked" class="item-actions">
          <button 
            class="action-btn"
            title="复制"
            @click.stop="$emit('duplicate', item.id)"
          >
            📋
          </button>
          <button 
            class="action-btn"
            title="删除"
            @click.stop="$emit('remove', item.id)"
          >
            🗑️
          </button>
        </div>
      </div>

      <!-- 主体内容 -->
      <div class="item-body">
        <div class="item-info">
          <div class="info-row">
            <span class="info-label">ID:</span>
            <span class="info-value">{{ item.id }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">类型:</span>
            <span class="info-value">{{ item.type }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">位置:</span>
            <span class="info-value">{{ Math.round(item.position.x) }}, {{ Math.round(item.position.y) }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">尺寸:</span>
            <span class="info-value">{{ Math.round(item.size.width) }} × {{ Math.round(item.size.height) }}</span>
          </div>
        </div>

        <!-- 自定义内容插槽 -->
        <div class="item-custom-content">
          <slot :item="item">
            <div class="default-content">
              <div class="content-placeholder">
                <div class="placeholder-icon">📊</div>
                <div class="placeholder-text">{{ item.type }} 组件</div>
              </div>
            </div>
          </slot>
        </div>
      </div>
    </div>

    <!-- 选中状态指示器 -->
    <div v-if="isSelected" class="selection-indicator">
      <div class="selection-corner tl"></div>
      <div class="selection-corner tr"></div>
      <div class="selection-corner bl"></div>
      <div class="selection-corner br"></div>
    </div>

    <!-- 调整大小句柄 -->
    <div 
      v-if="mode === 'edit' && !item.locked && showResizeHandles"
      class="resize-handles"
    >
      <div 
        class="resize-handle resize-se"
        title="调整大小"
        @mousedown.stop="handleResizeStart('se', $event)"
      ></div>
    </div>

    <!-- 锁定状态指示器 -->
    <div v-if="item.locked" class="lock-indicator" title="已锁定">
      🔒
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { BaseItem, RenderMode } from '../base/types'

// Props定义
interface Props {
  item: BaseItem
  mode: RenderMode
  isSelected: boolean
  isDragging?: boolean
  isResizing?: boolean
  showResizeHandles?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isDragging: false,
  isResizing: false,
  showResizeHandles: true
})

// 事件定义
interface Emits {
  'select': [id: string, event: MouseEvent]
  'drag-start': [id: string, event: MouseEvent]
  'resize-start': [id: string, direction: string, event: MouseEvent]
  'duplicate': [id: string]
  'remove': [id: string]
}

const emit = defineEmits<Emits>()

// 计算样式
const itemStyle = computed(() => {
  const { position, size } = props.item
  
  return {
    left: `${position.x}px`,
    top: `${position.y}px`,
    width: `${size.width}px`,
    height: `${size.height}px`,
    zIndex: props.isSelected ? 1000 : (props.item as any).zIndex || 1,
    opacity: props.item.hidden ? 0.3 : 1
  }
})

// 鼠标按下事件
const handleMouseDown = (event: MouseEvent) => {
  if (props.mode !== 'edit' || props.item.locked) return
  
  // 检查是否点击了调整大小句柄
  const target = event.target as HTMLElement
  if (target.classList.contains('resize-handle')) {
    return // 调整大小事件由句柄处理
  }
  
  emit('drag-start', props.item.id, event)
}

// 点击事件
const handleClick = (event: MouseEvent) => {
  emit('select', props.item.id, event)
}

// 调整大小开始
const handleResizeStart = (direction: string, event: MouseEvent) => {
  emit('resize-start', props.item.id, direction, event)
}
</script>

<style scoped>
.grid-item {
  position: absolute;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: move;
  user-select: none;
  overflow: hidden;
  transition: all 0.2s ease;
}

.grid-item:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.grid-item.selected {
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

.grid-item.dragging {
  opacity: 0.8;
  transform: rotate(2deg);
  z-index: 1001 !important;
}

.grid-item.resizing {
  opacity: 0.9;
}

.grid-item.locked {
  cursor: default;
  border-color: #faad14;
}

.grid-item.hidden {
  opacity: 0.3;
}

.item-content {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 8px;
}

.item-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
  padding-bottom: 6px;
  border-bottom: 1px solid #f0f0f0;
}

.item-title {
  font-weight: 600;
  font-size: 13px;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.item-actions {
  display: flex;
  gap: 4px;
}

.action-btn {
  background: none;
  border: none;
  padding: 2px 4px;
  border-radius: 3px;
  cursor: pointer;
  font-size: 12px;
  opacity: 0.6;
  transition: all 0.2s;
}

.action-btn:hover {
  opacity: 1;
  background: #f5f5f5;
}

.item-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.item-info {
  margin-bottom: 8px;
}

.info-row {
  display: flex;
  align-items: center;
  margin-bottom: 2px;
  font-size: 11px;
}

.info-label {
  color: #999;
  width: 35px;
  flex-shrink: 0;
}

.info-value {
  color: #666;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-custom-content {
  flex: 1;
  overflow: hidden;
}

.default-content {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.content-placeholder {
  text-align: center;
  color: #999;
}

.placeholder-icon {
  font-size: 24px;
  margin-bottom: 4px;
}

.placeholder-text {
  font-size: 12px;
}

/* 选中状态指示器 */
.selection-indicator {
  position: absolute;
  top: -3px;
  left: -3px;
  right: -3px;
  bottom: -3px;
  pointer-events: none;
}

.selection-corner {
  position: absolute;
  width: 6px;
  height: 6px;
  background: #1890ff;
  border: 1px solid #fff;
  border-radius: 1px;
}

.selection-corner.tl {
  top: 0;
  left: 0;
}

.selection-corner.tr {
  top: 0;
  right: 0;
}

.selection-corner.bl {
  bottom: 0;
  left: 0;
}

.selection-corner.br {
  bottom: 0;
  right: 0;
}

/* 调整大小句柄 */
.resize-handles {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
}

.resize-handle {
  position: absolute;
  background: #1890ff;
  border: 1px solid #fff;
  border-radius: 2px;
  pointer-events: auto;
}

.resize-handle.resize-se {
  width: 8px;
  height: 8px;
  right: -4px;
  bottom: -4px;
  cursor: se-resize;
}

.resize-handle:hover {
  background: #40a9ff;
}

/* 锁定指示器 */
.lock-indicator {
  position: absolute;
  top: 4px;
  right: 4px;
  font-size: 12px;
  opacity: 0.7;
  pointer-events: none;
}
</style>