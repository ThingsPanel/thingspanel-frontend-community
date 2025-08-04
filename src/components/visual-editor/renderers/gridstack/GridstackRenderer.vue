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
        v-if="stateManager.canvasState.value"
        :graph-data="stateManager.canvasState.value"
        :readonly="readonly || isPreviewMode"
        :show-widget-titles="showWidgetTitles"
        :static-grid="isPreviewMode"
        :grid-config="gridConfig"
        @node-select="onNodeSelect"
        @request-settings="onRequestSettings"
      />
    </div>
  </BaseRendererComponent>
</template>

<script setup lang="ts">
import { useEditor } from '../../hooks/useEditor'
import { globalPreviewMode } from '../../hooks/usePreviewMode'
import BaseRendererComponent from '../base/BaseRendererComponent.vue'
import GridLayoutPlusWrapper from './GridLayoutPlusWrapper.vue'

const props = defineProps<{
  readonly?: boolean
  showWidgetTitles?: boolean
  gridConfig?: any
}>()

const emit = defineEmits(['ready', 'error', 'node-select', 'canvas-click', 'request-settings'])

const { stateManager, selectNode } = useEditor()

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
