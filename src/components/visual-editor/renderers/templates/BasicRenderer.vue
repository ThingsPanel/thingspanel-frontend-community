<!--
  基础渲染器模板
  适用于简单的自定义布局需求
  复制此文件并根据需要修改
-->
<template>
  <BaseRendererComponent
    :readonly="readonly"
    @ready="onRendererReady"
    @error="onRendererError"
    @node-select="onNodeSelect"
    @canvas-click="onCanvasClick"
  >
    <div
      class="basic-renderer grid-background-base"
      :class="{
        'show-grid': config.showGrid && !readonly,
        'preview-mode': isPreviewMode.value,
        readonly: readonly
      }"
      @click="handleCanvasClick"
    >
      <!-- 渲染所有节点 -->
      <div
        v-for="node in nodes"
        :key="node.id"
        class="renderer-node"
        :class="{
          selected: selectedIds.includes(node.id) && !isPreviewMode.value,
          readonly: readonly || isPreviewMode.value
        }"
        :style="getNodeStyle(node)"
        @click.stop="handleNodeClick(node.id)"
      >
        <!-- 节点标题 -->
        <div v-if="showWidgetTitles && !readonly" class="node-title">
          {{ node.label || node.type }}
        </div>

        <!-- 节点内容 -->
        <div class="node-content">
          <Card2Wrapper
            v-if="isCard2Component(node.type)"
            :component-type="node.type"
            :config="node.properties"
            :data="node.metadata?.card2Data"
            :node-id="node.id"
            @error="handleComponentError"
          />
          <component :is="getWidgetComponent(node.type)" v-else v-bind="node.properties" />
        </div>
      </div>
    </div>
  </BaseRendererComponent>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useEditor } from '../../hooks/useEditor'
import { globalPreviewMode } from '../../hooks/usePreviewMode'
import BaseRendererComponent from '../base/BaseRendererComponent.vue'
import Card2Wrapper from '../canvas/Card2Wrapper.vue'

// 组件 Props
interface Props {
  readonly?: boolean
  config?: {
    showGrid?: boolean
    backgroundColor?: string
    // 在这里添加您的配置选项
  }
  showWidgetTitles?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  readonly: false,
  config: () => ({
    showGrid: true,
    backgroundColor: '#f5f5f5'
  }),
  showWidgetTitles: false
})

// 组件 Emits
interface Emits {
  (e: 'ready'): void
  (e: 'error', error: Error): void
  (e: 'node-select', nodeId: string): void
  (e: 'canvas-click', event?: MouseEvent): void
}

const emit = defineEmits<Emits>()

// 使用编辑器钩子
const { stateManager, selectNode, isCard2Component } = useEditor()
const { isPreviewMode } = globalPreviewMode

// 计算属性
const nodes = computed(() => stateManager.canvasState.value.nodes)
const selectedIds = computed(() => stateManager.canvasState.value.selectedIds)

// 事件处理器
const onRendererReady = () => {
  console.log('[BasicRenderer] Renderer is ready')
  emit('ready')
}

const onRendererError = (error: Error) => {
  console.error('[BasicRenderer] Renderer error:', error)
  emit('error', error)
}

const onNodeSelect = (nodeId: string) => {
  emit('node-select', nodeId)
}

const onCanvasClick = (event?: MouseEvent) => {
  emit('canvas-click', event)
}

const handleCanvasClick = () => {
  if (!isPreviewMode.value) {
    // 清除选择
    stateManager.clearSelection()
  }
}

const handleNodeClick = (nodeId: string) => {
  if (!isPreviewMode.value && !props.readonly) {
    selectNode(nodeId)
    emit('node-select', nodeId)
  }
}

const handleComponentError = (error: Error) => {
  console.error('[BasicRenderer] Component error:', error)
  emit('error', error)
}

// 样式计算
const getNodeStyle = (node: any) => {
  // 基础的绝对定位布局
  return {
    position: 'absolute' as const,
    left: `${node.x}px`,
    top: `${node.y}px`,
    width: `${node.width}px`,
    height: `${node.height}px`,
    zIndex: selectedIds.value.includes(node.id) ? 10 : 1
  }
}

// 组件获取 - 根据需要扩展
const getWidgetComponent = (type: string) => {
  // 在这里添加您的自定义组件映射
  const components: Record<string, any> = {
    // 'text': TextWidget,
    // 'image': ImageWidget,
    // 添加更多组件
  }
  return components[type]
}
</script>

<style scoped>
.basic-renderer {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 600px;
  user-select: none;
  overflow: hidden;
}

.renderer-node {
  border: 2px solid transparent;
  border-radius: 4px;
  transition: all 0.2s ease;
  cursor: pointer;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.renderer-node:hover:not(.readonly) {
  border-color: rgba(24, 160, 88, 0.3);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.renderer-node.selected {
  border-color: var(--n-primary-color);
  box-shadow: 0 4px 12px rgba(24, 160, 88, 0.2);
}

.renderer-node.readonly {
  cursor: default;
}

.renderer-node.readonly:hover {
  border-color: transparent;
  box-shadow: none;
}

.node-title {
  background: var(--n-color-embedded);
  padding: 4px 8px;
  font-size: 12px;
  font-weight: 500;
  border-bottom: 1px solid var(--n-border-color);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex-shrink: 0;
}

.node-content {
  flex: 1;
  position: relative;
  overflow: hidden;
}

/* 预览模式样式 */
.basic-renderer.preview-mode .renderer-node {
  cursor: default;
}

.basic-renderer.preview-mode .renderer-node:hover {
  border-color: transparent;
  box-shadow: none;
}

/* 响应式适配 */
@media (max-width: 768px) {
  .basic-renderer {
    min-height: 400px;
  }

  .node-title {
    font-size: 11px;
    padding: 2px 6px;
  }
}
</style>
