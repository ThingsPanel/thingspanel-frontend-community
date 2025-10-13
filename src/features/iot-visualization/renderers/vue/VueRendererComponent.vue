<script setup lang="ts">
/**
 * Vue 渲染器组件
 * 负责渲染所有画布节点
 */

import { ref, computed, watch, onMounted, onBeforeUnmount, defineExpose } from 'vue'
import { NMessageProvider } from 'naive-ui'
import type { RenderTree, ICanvasNode } from '../../noyau/types'
import type { RendererConfig, RendererEvents } from '../interface'
import type { VueComponentRegistry } from './registry'
import VueNodeWrapper from './VueNodeWrapper.vue'

/**
 * Props 定义
 */
interface Props {
  renderTree: RenderTree
  config?: RendererConfig
  events?: RendererEvents
  componentRegistry: VueComponentRegistry
}

const props = withDefaults(defineProps<Props>(), {
  config: () => ({}),
  events: () => ({})
})

/**
 * 响应式状态
 */
const localRenderTree = ref<RenderTree>([...props.renderTree])
const viewport = ref({
  x: 0,
  y: 0,
  zoom: props.config?.zoom || 1
})

/**
 * 画布样式
 */
const canvasStyle = computed(() => ({
  transform: `translate(${viewport.value.x}px, ${viewport.value.y}px) scale(${viewport.value.zoom})`,
  transformOrigin: '0 0'
}))

/**
 * 网格样式
 */
const showGrid = computed(() => props.config?.showGrid !== false)
const gridSize = computed(() => props.config?.gridSize || 10)

/**
 * 监听 renderTree 变化
 */
watch(
  () => props.renderTree,
  newTree => {
    localRenderTree.value = [...newTree]
  },
  { deep: true }
)

/**
 * 更新渲染树（供外部调用）
 */
function updateRenderTree(newTree: RenderTree) {
  localRenderTree.value = [...newTree]
}

/**
 * 更新单个节点（供外部调用）
 */
function updateNode(node: ICanvasNode) {
  const index = localRenderTree.value.findIndex(n => n.id === node.id)
  if (index !== -1) {
    localRenderTree.value[index] = node
  }
}

/**
 * 节点事件处理
 */
function handleNodeClick(nodeId: string, event: MouseEvent) {
  props.events?.onNodeClick?.(nodeId, event)
}

function handleNodeDoubleClick(nodeId: string, event: MouseEvent) {
  props.events?.onNodeDoubleClick?.(nodeId, event)
}

function handleNodeDrag(nodeId: string, position: { x: number; y: number }) {
  props.events?.onNodeDrag?.(nodeId, position)
}

function handleNodeDragEnd(nodeId: string, position: { x: number; y: number }) {
  props.events?.onNodeDragEnd?.(nodeId, position)
}

function handleNodeResize(nodeId: string, size: { width: number; height: number }) {
  props.events?.onNodeResize?.(nodeId, size)
}

function handleNodeResizeEnd(nodeId: string, size: { width: number; height: number }) {
  props.events?.onNodeResizeEnd?.(nodeId, size)
}

function handleNodeSelect(nodeIds: string[]) {
  props.events?.onNodeSelect?.(nodeIds)
}

/**
 * 画布点击事件
 */
function handleCanvasClick(event: MouseEvent) {
  // 如果点击的是画布本身（不是节点），清空选择
  if (event.target === event.currentTarget) {
    props.events?.onCanvasClick?.(event)
  }
}

/**
 * 暴露方法给父组件
 */
defineExpose({
  updateRenderTree,
  updateNode
})
</script>

<template>
  <NMessageProvider>
    <div class="vue-renderer" @click="handleCanvasClick">
      <!-- 网格背景 -->
      <div v-if="showGrid" class="grid-background" :style="{ backgroundSize: `${gridSize}px ${gridSize}px` }" />

      <!-- 画布容器 -->
      <div class="canvas-container" :style="canvasStyle">
        <!-- 渲染所有节点 -->
        <VueNodeWrapper
          v-for="node in localRenderTree"
          :key="node.id"
          :node="node"
          :component-registry="componentRegistry"
          @click="handleNodeClick(node.id, $event)"
          @dblclick="handleNodeDoubleClick(node.id, $event)"
          @drag="handleNodeDrag(node.id, $event)"
          @drag-end="handleNodeDragEnd(node.id, $event)"
          @resize="handleNodeResize(node.id, $event)"
          @resize-end="handleNodeResizeEnd(node.id, $event)"
          @select="handleNodeSelect"
        />
      </div>
    </div>
  </NMessageProvider>
</template>

<style scoped>
.vue-renderer {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background-color: var(--n-color, #f5f5f5);
}

.grid-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: linear-gradient(
      to right,
      rgba(0, 0, 0, 0.05) 1px,
      transparent 1px
    ),
    linear-gradient(to bottom, rgba(0, 0, 0, 0.05) 1px, transparent 1px);
  pointer-events: none;
  z-index: 0;
}

.canvas-container {
  position: relative;
  width: 100%;
  height: 100%;
  transition: transform 0.1s ease-out;
  z-index: 1;
}
</style>
