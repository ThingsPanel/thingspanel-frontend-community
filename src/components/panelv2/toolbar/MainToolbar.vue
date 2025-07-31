<!--
  主工具栏组件
  组合公共工具栏和渲染器特有工具栏
-->
<script setup lang="ts">
import { computed } from 'vue'
import CommonToolbar from './CommonToolbar.vue'
import KanbanToolbar from './KanbanToolbar.vue'
import VisualizationToolbar from './VisualizationToolbar.vue'

interface Props {
  mode: 'edit' | 'preview'
  currentRenderer: string
  availableRenderers: Array<{ value: string; label: string; icon: string }>
  kanbanConfig?: Record<string, any>
  visualizationConfig?: Record<string, any>
  readonly?: boolean
}

interface Emits {
  (e: 'mode-change', mode: 'edit' | 'preview'): void
  (e: 'renderer-change', rendererId: string): void
  (e: 'save'): void
  (e: 'undo'): void
  (e: 'redo'): void
  (e: 'reset'): void
  (e: 'kanban-config-change', config: Record<string, any>): void
  (e: 'visualization-config-change', config: Record<string, any>): void
  // 可视化工具栏事件
  (e: 'zoom-in'): void
  (e: 'zoom-out'): void
  (e: 'reset-zoom'): void
  (e: 'fit-content'): void
  (e: 'center-view'): void
}

const props = withDefaults(defineProps<Props>(), {
  readonly: false,
  kanbanConfig: () => ({}),
  visualizationConfig: () => ({})
})

const emit = defineEmits<Emits>()

// 判断是否显示编辑模式
const isEditMode = computed(() => props.mode === 'edit')

// 判断当前渲染器类型
const isKanbanRenderer = computed(() => props.currentRenderer === 'kanban')
const isVisualizationRenderer = computed(() => props.currentRenderer === 'visualization')

// 事件转发
const handleModeChange = (mode: 'edit' | 'preview') => emit('mode-change', mode)
const handleRendererChange = (rendererId: string) => emit('renderer-change', rendererId)
const handleSave = () => emit('save')
const handleUndo = () => emit('undo')
const handleRedo = () => emit('redo')
const handleReset = () => emit('reset')

// 看板配置变更
const handleKanbanConfigChange = (config: Record<string, any>) => {
  emit('kanban-config-change', config)
}

// 可视化配置变更
const handleVisualizationConfigChange = (config: Record<string, any>) => {
  emit('visualization-config-change', config)
}

// 可视化工具栏事件
const handleZoomIn = () => emit('zoom-in')
const handleZoomOut = () => emit('zoom-out')
const handleResetZoom = () => emit('reset-zoom')
const handleFitContent = () => emit('fit-content')
const handleCenterView = () => emit('center-view')
</script>

<template>
  <div class="main-toolbar h-12 bg-white border-b border-gray-200 flex items-center">
    <!-- 公共工具栏 -->
    <CommonToolbar
      :mode="mode"
      :current-renderer="currentRenderer"
      :available-renderers="availableRenderers"
      :readonly="readonly"
      @mode-change="handleModeChange"
      @renderer-change="handleRendererChange"
      @save="handleSave"
      @undo="handleUndo"
      @redo="handleRedo"
      @reset="handleReset"
    />

    <!-- 渲染器特有工具栏 -->
    <div v-if="isEditMode" class="flex-1">
      <!-- 看板工具栏 -->
      <KanbanToolbar
        v-if="isKanbanRenderer"
        :config="kanbanConfig"
        :readonly="readonly"
        @config-change="handleKanbanConfigChange"
      />

      <!-- 可视化工具栏 -->
      <VisualizationToolbar
        v-else-if="isVisualizationRenderer"
        :config="visualizationConfig"
        :readonly="readonly"
        @zoom-in="handleZoomIn"
        @zoom-out="handleZoomOut"
        @reset-zoom="handleResetZoom"
        @fit-content="handleFitContent"
        @center-view="handleCenterView"
        @config-change="handleVisualizationConfigChange"
      />
    </div>
  </div>
</template>

<style scoped>
.main-toolbar {
  width: 100%;
  min-height: 48px;
  display: flex;
  align-items: center;
  background: white;
  border-bottom: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}
</style>