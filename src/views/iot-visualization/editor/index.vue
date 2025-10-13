<script setup lang="ts">
/**
 * IOT 可视化编辑器路由页面
 * 路径：/iot-visualization/editor
 *
 * 完全复用现有 visual-editor 系统架构
 */

import { ref, onMounted } from 'vue'
import PanelEditorV2 from '@/components/visual-editor/PanelEditorV2.vue'
import type { RendererType } from '@/components/visual-editor/types'

/**
 * 面板ID - 用于数据持久化
 */
const panelId = ref('iot-visualization-test-panel')

/**
 * 默认渲染器 - 使用 gridstack
 */
const defaultRenderer = ref<RendererType>('gridstack')

/**
 * 编辑器就绪回调
 */
function handleEditorReady(editor: any) {
  console.log('[IOT Visualization Editor] 编辑器已就绪:', editor)
}

/**
 * 组件添加回调
 */
function handleWidgetAdded(widget: any) {
  console.log('[IOT Visualization Editor] 组件已添加:', widget)
}

/**
 * 节点选择回调
 */
function handleNodeSelect(nodeId: string) {
  console.log('[IOT Visualization Editor] 节点已选择:', nodeId)
}

/**
 * 状态管理器就绪回调
 */
function handleStateManagerReady(stateManager: any) {
  console.log('[IOT Visualization Editor] 状态管理器就绪:', stateManager)
}
</script>

<template>
  <div class="iot-visualization-editor-page">
    <!-- 完全复用现有 PanelEditorV2 组件 -->
    <PanelEditorV2
      :panel-id="panelId"
      :default-renderer="defaultRenderer"
      :show-toolbar="true"
      :show-page-header="true"
      :enable-header-area="true"
      :enable-toolbar-area="true"
      :enable-footer-area="false"
      @editor-ready="handleEditorReady"
      @widget-added="handleWidgetAdded"
      @node-select="handleNodeSelect"
      @state-manager-ready="handleStateManagerReady"
    />
  </div>
</template>

<style scoped>
.iot-visualization-editor-page {
  width: 100%;
  height: 100vh;
  overflow: hidden;
}
</style>
