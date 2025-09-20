<template>
  <div class="excalidraw-toolbar-container">
    <!-- 主工具栏 - 浮动式设计 -->
    <div class="floating-toolbar" :class="{ 'is-dragging': isDragging }">
      <!-- 基础绘图工具组 -->
      <div class="tool-group">
        <n-tooltip trigger="hover" placement="bottom">
          <template #trigger>
            <button
              class="tool-button"
              :class="{ active: currentTool === 'select' }"
              @click="setTool('select')"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="m3 3 7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/>
              </svg>
            </button>
          </template>
          选择工具
        </n-tooltip>

        <n-tooltip trigger="hover" placement="bottom">
          <template #trigger>
            <button
              class="tool-button"
              :class="{ active: currentTool === 'hand' }"
              @click="setTool('hand')"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 11V6a2 2 0 0 0-4 0v5"/>
                <path d="M14 10V4a2 2 0 0 0-4 0v2"/>
                <path d="M10 10.5V6a2 2 0 0 0-4 0v11a2 2 0 0 0 2 2h2"/>
                <path d="m7 15-1.76-1.76a2 2 0 0 0-2.83 2.83l3.6 3.6a7.5 7.5 0 0 0 10.6 0L19 18"/>
              </svg>
            </button>
          </template>
          手型工具（平移）
        </n-tooltip>
      </div>

      <div class="tool-separator"></div>

      <!-- 形状工具组 -->
      <div class="tool-group">
        <n-tooltip trigger="hover" placement="bottom">
          <template #trigger>
            <button
              class="tool-button"
              :class="{ active: currentTool === 'rectangle' }"
              @click="setTool('rectangle')"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              </svg>
            </button>
          </template>
          矩形
        </n-tooltip>

        <n-tooltip trigger="hover" placement="bottom">
          <template #trigger>
            <button
              class="tool-button"
              :class="{ active: currentTool === 'diamond' }"
              @click="setTool('diamond')"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="12,2 22,12 12,22 2,12"/>
              </svg>
            </button>
          </template>
          菱形
        </n-tooltip>

        <n-tooltip trigger="hover" placement="bottom">
          <template #trigger>
            <button
              class="tool-button"
              :class="{ active: currentTool === 'ellipse' }"
              @click="setTool('ellipse')"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
              </svg>
            </button>
          </template>
          椭圆
        </n-tooltip>
      </div>

      <div class="tool-separator"></div>

      <!-- 线条工具组 -->
      <div class="tool-group">
        <n-tooltip trigger="hover" placement="bottom">
          <template #trigger>
            <button
              class="tool-button"
              :class="{ active: currentTool === 'arrow' }"
              @click="setTool('arrow')"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="5" y1="12" x2="19" y2="12"/>
                <polyline points="12,5 19,12 12,19"/>
              </svg>
            </button>
          </template>
          箭头
        </n-tooltip>

        <n-tooltip trigger="hover" placement="bottom">
          <template #trigger>
            <button
              class="tool-button"
              :class="{ active: currentTool === 'line' }"
              @click="setTool('line')"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            </button>
          </template>
          直线
        </n-tooltip>
      </div>

      <div class="tool-separator"></div>

      <!-- 绘制工具组 -->
      <div class="tool-group">
        <n-tooltip trigger="hover" placement="bottom">
          <template #trigger>
            <button
              class="tool-button"
              :class="{ active: currentTool === 'pencil' }"
              @click="setTool('pencil')"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="m18 2 4 4-14 14H4v-4L18 2z"/>
                <path d="m13.5 6.5 4 4"/>
              </svg>
            </button>
          </template>
          画笔
        </n-tooltip>

        <n-tooltip trigger="hover" placement="bottom">
          <template #trigger>
            <button
              class="tool-button"
              :class="{ active: currentTool === 'text' }"
              @click="setTool('text')"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="4,7 4,4 20,4 20,7"/>
                <line x1="9" y1="20" x2="15" y2="20"/>
                <line x1="12" y1="4" x2="12" y2="20"/>
              </svg>
            </button>
          </template>
          文本
        </n-tooltip>
      </div>

      <div class="tool-separator"></div>

      <!-- 其他工具组 -->
      <div class="tool-group">
        <n-tooltip trigger="hover" placement="bottom">
          <template #trigger>
            <button
              class="tool-button"
              :class="{ active: currentTool === 'image' }"
              @click="setTool('image')"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <circle cx="9" cy="9" r="2"/>
                <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
              </svg>
            </button>
          </template>
          图片
        </n-tooltip>

        <n-tooltip trigger="hover" placement="bottom">
          <template #trigger>
            <button
              class="tool-button"
              :class="{ active: currentTool === 'eraser' }"
              @click="setTool('eraser')"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21"/>
                <path d="M22 21H7"/>
                <path d="m5 11 9 9"/>
              </svg>
            </button>
          </template>
          橡皮擦
        </n-tooltip>
      </div>
    </div>

    <!-- 属性工具栏 - 浮动在主工具栏下方 -->
    <div class="property-toolbar" v-if="showPropertyToolbar">
      <!-- 笔画样式 -->
      <div class="property-group">
        <span class="property-label">描边</span>
        <div class="stroke-style-buttons">
          <button
            class="property-button"
            :class="{ active: strokeStyle === 'solid' }"
            @click="setStrokeStyle('solid')"
          >
            <svg width="20" height="4" viewBox="0 0 20 4">
              <line x1="0" y1="2" x2="20" y2="2" stroke="currentColor" stroke-width="2"/>
            </svg>
          </button>
          <button
            class="property-button"
            :class="{ active: strokeStyle === 'dashed' }"
            @click="setStrokeStyle('dashed')"
          >
            <svg width="20" height="4" viewBox="0 0 20 4">
              <line x1="0" y1="2" x2="20" y2="2" stroke="currentColor" stroke-width="2" stroke-dasharray="4,2"/>
            </svg>
          </button>
          <button
            class="property-button"
            :class="{ active: strokeStyle === 'dotted' }"
            @click="setStrokeStyle('dotted')"
          >
            <svg width="20" height="4" viewBox="0 0 20 4">
              <line x1="0" y1="2" x2="20" y2="2" stroke="currentColor" stroke-width="2" stroke-dasharray="1,2"/>
            </svg>
          </button>
        </div>
      </div>

      <div class="property-separator"></div>

      <!-- 填充样式 -->
      <div class="property-group">
        <span class="property-label">填充</span>
        <div class="fill-style-buttons">
          <button
            class="property-button fill-none"
            :class="{ active: fillStyle === 'none' }"
            @click="setFillStyle('none')"
          >
            <svg width="16" height="16" viewBox="0 0 16 16">
              <rect x="2" y="2" width="12" height="12" fill="none" stroke="currentColor" stroke-width="1"/>
            </svg>
          </button>
          <button
            class="property-button fill-solid"
            :class="{ active: fillStyle === 'solid' }"
            @click="setFillStyle('solid')"
          >
            <svg width="16" height="16" viewBox="0 0 16 16">
              <rect x="2" y="2" width="12" height="12" fill="currentColor"/>
            </svg>
          </button>
          <button
            class="property-button fill-hachure"
            :class="{ active: fillStyle === 'hachure' }"
            @click="setFillStyle('hachure')"
          >
            <svg width="16" height="16" viewBox="0 0 16 16">
              <rect x="2" y="2" width="12" height="12" fill="none" stroke="currentColor" stroke-width="1"/>
              <g stroke="currentColor" stroke-width="0.5">
                <line x1="3" y1="3" x2="13" y2="13"/>
                <line x1="3" y1="6" x2="13" y2="16"/>
                <line x1="3" y1="9" x2="10" y2="16"/>
                <line x1="6" y1="3" x2="13" y2="10"/>
                <line x1="9" y1="3" x2="13" y2="7"/>
              </g>
            </svg>
          </button>
        </div>
      </div>

      <div class="property-separator"></div>

      <!-- 线条粗细 -->
      <div class="property-group">
        <span class="property-label">粗细</span>
        <div class="stroke-width-buttons">
          <button
            class="property-button"
            :class="{ active: strokeWidth === 'thin' }"
            @click="setStrokeWidth('thin')"
          >
            <svg width="20" height="4" viewBox="0 0 20 4">
              <line x1="0" y1="2" x2="20" y2="2" stroke="currentColor" stroke-width="1"/>
            </svg>
          </button>
          <button
            class="property-button"
            :class="{ active: strokeWidth === 'bold' }"
            @click="setStrokeWidth('bold')"
          >
            <svg width="20" height="4" viewBox="0 0 20 4">
              <line x1="0" y1="2" x2="20" y2="2" stroke="currentColor" stroke-width="2"/>
            </svg>
          </button>
          <button
            class="property-button"
            :class="{ active: strokeWidth === 'extra-bold' }"
            @click="setStrokeWidth('extra-bold')"
          >
            <svg width="20" height="4" viewBox="0 0 20 4">
              <line x1="0" y1="2" x2="20" y2="2" stroke="currentColor" stroke-width="3"/>
            </svg>
          </button>
        </div>
      </div>

      <div class="property-separator"></div>

      <!-- 透明度 -->
      <div class="property-group">
        <span class="property-label">透明度</span>
        <n-slider
          v-model:value="opacity"
          :min="0"
          :max="100"
          :step="10"
          style="width: 80px;"
          size="small"
          @update:value="setOpacity"
        />
        <span class="opacity-value">{{ opacity }}%</span>
      </div>
    </div>

    <!-- 操作工具栏 - 右侧浮动 -->
    <div class="action-toolbar">
      <n-tooltip trigger="hover" placement="left">
        <template #trigger>
          <button class="action-button" @click="undo" :disabled="!canUndo">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 7v6h6"/>
              <path d="m21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/>
            </svg>
          </button>
        </template>
        撤销
      </n-tooltip>

      <n-tooltip trigger="hover" placement="left">
        <template #trigger>
          <button class="action-button" @click="redo" :disabled="!canRedo">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="m21 7-6-6v6h-6a9 9 0 0 0 0 18h3"/>
            </svg>
          </button>
        </template>
        重做
      </n-tooltip>

      <div class="action-separator"></div>

      <n-tooltip trigger="hover" placement="left">
        <template #trigger>
          <button class="action-button" @click="zoomIn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
              <line x1="11" y1="8" x2="11" y2="14"/>
              <line x1="8" y1="11" x2="14" y2="11"/>
            </svg>
          </button>
        </template>
        放大
      </n-tooltip>

      <n-tooltip trigger="hover" placement="left">
        <template #trigger>
          <button class="action-button" @click="zoomOut">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
              <line x1="8" y1="11" x2="14" y2="11"/>
            </svg>
          </button>
        </template>
        缩小
      </n-tooltip>

      <n-tooltip trigger="hover" placement="left">
        <template #trigger>
          <button class="action-button" @click="resetZoom">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
              <rect x="8" y="8" width="6" height="6" rx="1"/>
            </svg>
          </button>
        </template>
        重置缩放
      </n-tooltip>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * Excalidraw 风格的浮动工具栏
 *
 * 特点：
 * - 极简设计，浮动在Canvas上方
 * - 无边框按钮，圆角设计
 * - 分组布局，清晰的视觉层次
 * - 实时属性调整
 * - 手绘风格图标
 */

import { ref, computed, watch } from 'vue'

// 工具状态
const currentTool = ref('select')
const strokeStyle = ref('solid')
const fillStyle = ref('none')
const strokeWidth = ref('bold')
const opacity = ref(100)
const isDragging = ref(false)

// 编辑状态
const canUndo = ref(false)
const canRedo = ref(false)

// 显示状态
const showPropertyToolbar = computed(() => {
  return ['rectangle', 'diamond', 'ellipse', 'arrow', 'line', 'pencil'].includes(currentTool.value)
})

// 事件定义
const emit = defineEmits<{
  'tool-change': [tool: string]
  'stroke-style-change': [style: string]
  'fill-style-change': [style: string]
  'stroke-width-change': [width: string]
  'opacity-change': [opacity: number]
  'undo': []
  'redo': []
  'zoom-in': []
  'zoom-out': []
  'reset-zoom': []
}>()

/**
 * 设置当前工具
 */
function setTool(tool: string) {
  currentTool.value = tool
  emit('tool-change', tool)
}

/**
 * 设置描边样式
 */
function setStrokeStyle(style: string) {
  strokeStyle.value = style
  emit('stroke-style-change', style)
}

/**
 * 设置填充样式
 */
function setFillStyle(style: string) {
  fillStyle.value = style
  emit('fill-style-change', style)
}

/**
 * 设置线条粗细
 */
function setStrokeWidth(width: string) {
  strokeWidth.value = width
  emit('stroke-width-change', width)
}

/**
 * 设置透明度
 */
function setOpacity(value: number) {
  opacity.value = value
  emit('opacity-change', value)
}

/**
 * 撤销操作
 */
function undo() {
  emit('undo')
}

/**
 * 重做操作
 */
function redo() {
  emit('redo')
}

/**
 * 放大
 */
function zoomIn() {
  emit('zoom-in')
}

/**
 * 缩小
 */
function zoomOut() {
  emit('zoom-out')
}

/**
 * 重置缩放
 */
function resetZoom() {
  emit('reset-zoom')
}

// 监听工具变化，自动调整属性面板显示
watch(currentTool, (newTool) => {
  // 不同工具可能有不同的默认属性
  if (newTool === 'text') {
    fillStyle.value = 'none'
    strokeStyle.value = 'solid'
  }
})
</script>

<style scoped>
.excalidraw-toolbar-container {
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  pointer-events: none;
}

/* 主工具栏 */
.floating-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 8px;
  box-shadow:
    0 2px 8px rgba(0, 0, 0, 0.1),
    0 0 0 1px rgba(0, 0, 0, 0.05);
  pointer-events: auto;
  transition: all 0.2s ease;
}

.floating-toolbar:hover {
  background: rgba(255, 255, 255, 0.98);
  box-shadow:
    0 4px 16px rgba(0, 0, 0, 0.15),
    0 0 0 1px rgba(0, 0, 0, 0.08);
}

.floating-toolbar.is-dragging {
  cursor: grabbing;
}

/* 工具组 */
.tool-group {
  display: flex;
  align-items: center;
  gap: 4px;
}

/* 工具按钮 */
.tool-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  border-radius: 6px;
  color: #495057;
  cursor: pointer;
  transition: all 0.15s ease;
  position: relative;
}

.tool-button:hover {
  background: rgba(0, 0, 0, 0.05);
  color: #212529;
}

.tool-button.active {
  background: #5f6368;
  color: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.tool-button.active:hover {
  background: #4a4f53;
}

/* 工具分隔符 */
.tool-separator {
  width: 1px;
  height: 24px;
  background: rgba(0, 0, 0, 0.1);
  margin: 0 4px;
}

/* 属性工具栏 */
.property-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 8px;
  box-shadow:
    0 2px 8px rgba(0, 0, 0, 0.1),
    0 0 0 1px rgba(0, 0, 0, 0.05);
  pointer-events: auto;
  font-size: 13px;
}

/* 属性组 */
.property-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.property-label {
  color: #6c757d;
  font-size: 12px;
  font-weight: 500;
  min-width: 40px;
}

/* 属性按钮 */
.property-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  border-radius: 4px;
  color: #495057;
  cursor: pointer;
  transition: all 0.15s ease;
}

.property-button:hover {
  background: rgba(0, 0, 0, 0.05);
}

.property-button.active {
  background: #e9ecef;
  color: #212529;
}

/* 样式按钮组 */
.stroke-style-buttons,
.fill-style-buttons,
.stroke-width-buttons {
  display: flex;
  gap: 2px;
}

/* 属性分隔符 */
.property-separator {
  width: 1px;
  height: 20px;
  background: rgba(0, 0, 0, 0.1);
}

/* 透明度显示 */
.opacity-value {
  font-size: 11px;
  color: #6c757d;
  min-width: 30px;
  text-align: center;
}

/* 操作工具栏 */
.action-toolbar {
  position: absolute;
  top: 20px;
  right: 20px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 8px;
  box-shadow:
    0 2px 8px rgba(0, 0, 0, 0.1),
    0 0 0 1px rgba(0, 0, 0, 0.05);
  pointer-events: auto;
}

/* 操作按钮 */
.action-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  border-radius: 6px;
  color: #495057;
  cursor: pointer;
  transition: all 0.15s ease;
}

.action-button:hover:not(:disabled) {
  background: rgba(0, 0, 0, 0.05);
  color: #212529;
}

.action-button:disabled {
  color: #adb5bd;
  cursor: not-allowed;
}

/* 操作分隔符 */
.action-separator {
  height: 1px;
  background: rgba(0, 0, 0, 0.1);
  margin: 4px 0;
}

/* 暗色主题适配 */
.dark .floating-toolbar,
.dark .property-toolbar,
.dark .action-toolbar {
  background: rgba(33, 37, 41, 0.95);
  box-shadow:
    0 2px 8px rgba(0, 0, 0, 0.3),
    0 0 0 1px rgba(255, 255, 255, 0.1);
}

.dark .tool-button,
.dark .property-button,
.dark .action-button {
  color: #adb5bd;
}

.dark .tool-button:hover,
.dark .property-button:hover,
.dark .action-button:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.1);
  color: #f8f9fa;
}

.dark .tool-button.active {
  background: #6c757d;
  color: white;
}

.dark .property-button.active {
  background: #495057;
  color: #f8f9fa;
}

.dark .tool-separator,
.dark .property-separator,
.dark .action-separator {
  background: rgba(255, 255, 255, 0.2);
}

.dark .property-label,
.dark .opacity-value {
  color: #adb5bd;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .excalidraw-toolbar-container {
    top: 10px;
    left: 10px;
    right: 10px;
    transform: none;
  }

  .floating-toolbar {
    flex-wrap: wrap;
    justify-content: center;
  }

  .property-toolbar {
    flex-wrap: wrap;
    justify-content: center;
    gap: 8px;
  }

  .action-toolbar {
    position: relative;
    top: auto;
    right: auto;
    flex-direction: row;
    align-self: stretch;
  }
}

/* 动画效果 */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.floating-toolbar,
.property-toolbar {
  animation: fadeInUp 0.3s ease;
}
</style>