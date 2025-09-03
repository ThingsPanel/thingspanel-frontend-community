<template>
  <BaseRendererComponent
    :readonly="readonly"
    @ready="onRendererReady"
    @error="onRendererError"
    @node-select="onNodeSelect"
    @canvas-click="onCanvasClick"
  >
    <div class="gridstack-renderer" @click="onCanvasClick">
      <GridLayoutPlusWrapper
        v-if="stateManager.nodes"
        :graph-data="stateManager"
        :readonly="readonly || isPreviewMode"
        :show-widget-titles="showWidgetTitles"
        :static-grid="isPreviewMode"
        :grid-config="gridConfig"
        :multi-data-source-store="multiDataSourceStore"
        :multi-data-source-config-store="multiDataSourceConfigStore"
        @node-select="onNodeSelect"
        @request-settings="onRequestSettings"
      />
    </div>
  </BaseRendererComponent>
</template>

<script setup lang="ts">
/**
 * Gridstack 渲染器组件
 * 🔥 已迁移到新的统一架构
 */

import { computed } from 'vue'
import { useEditorStore } from '@/store/modules/editor'
import { useWidgetStore } from '@/store/modules/widget'
import { globalPreviewMode } from '../../hooks/usePreviewMode'
import BaseRendererComponent from '../base/BaseRendererComponent.vue'
import GridLayoutPlusWrapper from './GridLayoutPlusWrapper.vue'

const props = defineProps<{
  readonly?: boolean
  showWidgetTitles?: boolean
  gridConfig?: any
  multiDataSourceStore?: Record<string, Record<string, any>>
  multiDataSourceConfigStore?: Record<string, any>
}>()

const emit = defineEmits(['ready', 'error', 'node-select', 'canvas-click', 'request-settings'])

// 使用原始的 store
const editorStore = useEditorStore()
const widgetStore = useWidgetStore()

// 为兼容旧组件接口，创建stateManager适配
const stateManager = computed(() => ({
  nodes: editorStore.nodes || [],
  selectedIds: widgetStore.selectedNodeIds || [],
  viewport: editorStore.viewport || { zoom: 1, offsetX: 0, offsetY: 0 }
}))

// 选择节点方法适配
const selectNode = (nodeId: string) => {
  if (nodeId) {
    widgetStore.selectNodes([nodeId])
  } else {
    widgetStore.selectNodes([])
  }
}

// 全局预览模式
const { isPreviewMode } = globalPreviewMode

// --- Event Handlers to emit upwards to PanelEditor ---

const onRendererReady = () => {
  emit('ready')
}

const onRendererError = (error: Error) => {
  emit('error', error)
}

const onNodeSelect = (nodeId: string) => {
  emit('node-select', nodeId)
}

const onRequestSettings = (nodeId: string) => {
  emit('request-settings', nodeId)
}

const onCanvasClick = () => {
  selectNode('') // use the hook's method to clear selection
  emit('canvas-click')
}
</script>

<style scoped>
.gridstack-renderer {
  width: 100%;
  height: 100%;
  position: relative;
  min-height: 600px;
}
</style>
