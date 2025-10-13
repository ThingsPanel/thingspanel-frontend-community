<script setup lang="ts">
/**
 * Vue 节点包装组件
 * 包装每个卡片组件，处理位置、大小、变换、交互等
 */

import { ref, computed, defineAsyncComponent } from 'vue'
import type { ICanvasNode } from '../../noyau/types'
import type { VueComponentRegistry } from './registry'

/**
 * Props 定义
 */
interface Props {
  node: ICanvasNode
  componentRegistry: VueComponentRegistry
}

const props = defineProps<Props>()

/**
 * Emits 定义
 */
const emit = defineEmits<{
  click: [event: MouseEvent]
  dblclick: [event: MouseEvent]
  drag: [position: { x: number; y: number }]
  dragEnd: [position: { x: number; y: number }]
  resize: [size: { width: number; height: number }]
  resizeEnd: [size: { width: number; height: number }]
  select: [nodeIds: string[]]
}>()

/**
 * 动态获取组件
 */
const CardComponent = computed(() => {
  const component = props.componentRegistry.get(props.node.type)

  if (!component) {
    console.warn(`[VueNodeWrapper] 未找到组件: ${props.node.type}`)
    return null
  }

  return component
})

/**
 * 节点容器样式
 */
const nodeStyle = computed(() => ({
  position: 'absolute' as const,
  left: `${props.node.position.x}px`,
  top: `${props.node.position.y}px`,
  width: `${props.node.size.width}px`,
  height: `${props.node.size.height}px`,
  transform: `rotate(${props.node.transform.rotate}deg) scale(${props.node.transform.scale})`,
  transformOrigin: 'center center',
  opacity: props.node.style.opacity || 1,
  zIndex: props.node.style.zIndex || 1,
  visibility: props.node.metadata.visible ? 'visible' : 'hidden',
  pointerEvents: props.node.metadata.locked ? 'none' : 'auto',

  // 样式属性
  backgroundColor: props.node.style.backgroundColor,
  borderColor: props.node.style.borderColor,
  borderWidth: props.node.style.borderWidth ? `${props.node.style.borderWidth}px` : undefined,
  borderStyle: props.node.style.borderStyle,
  borderRadius: props.node.style.borderRadius ? `${props.node.style.borderRadius}px` : undefined,
  boxShadow: props.node.style.boxShadow
}))

/**
 * 节点点击事件
 */
function handleClick(event: MouseEvent) {
  emit('click', event)
}

/**
 * 节点双击事件
 */
function handleDoubleClick(event: MouseEvent) {
  emit('dblclick', event)
}
</script>

<template>
  <div class="vue-node-wrapper" :style="nodeStyle" @click="handleClick" @dblclick.stop="handleDoubleClick">
    <!-- 锁定指示器 -->
    <div v-if="node.metadata.locked" class="lock-indicator">
      <i class="i-carbon-locked" />
    </div>

    <!-- 渲染实际的卡片组件 -->
    <component
      :is="CardComponent"
      v-if="CardComponent"
      v-bind="node.config"
      :data="node.data"
      class="card-component"
    />

    <!-- 未找到组件时的占位符 -->
    <div v-else class="component-placeholder">
      <i class="i-carbon-warning text-4xl" />
      <p class="text-sm mt-2">未找到组件</p>
      <p class="text-xs text-gray-500">{{ node.type }}</p>
    </div>
  </div>
</template>

<style scoped>
.vue-node-wrapper {
  box-sizing: border-box;
  transition: opacity 0.2s ease-out;
  cursor: pointer;
  user-select: none;
}

.vue-node-wrapper:hover {
  outline: 2px solid rgba(24, 160, 88, 0.5);
  outline-offset: -2px;
}

.lock-indicator {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.6);
  color: white;
  border-radius: 4px;
  font-size: 12px;
  z-index: 10;
}

.card-component {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.component-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: #fff;
  border: 2px dashed #d9d9d9;
  border-radius: 4px;
  color: #999;
}
</style>
