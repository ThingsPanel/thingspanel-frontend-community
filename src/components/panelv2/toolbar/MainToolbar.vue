<!--
  主工具栏组件
  组合公共工具栏和渲染器特有工具栏
-->
<script setup lang="ts">
import { computed, ref } from 'vue'
import { NModal, useThemeVars } from 'naive-ui'
import CommonToolbar from './CommonToolbar.vue'
import { KanbanToolbar } from '../renderers/kanban'

import VisualizationToolbar from './VisualizationToolbar.vue'

interface Props {
  mode: 'edit' | 'preview'
  currentRenderer: string
  availableRenderers: Array<{ value: string; label: string; icon: string }>
  kanbanConfig?: Record<string, any>

  visualizationConfig?: Record<string, any>
  readonly?: boolean
  isSaving?: boolean
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

  visualizationConfig: () => ({}),
  isSaving: false
})

const emit = defineEmits<Emits>()

// 配置面板显示状态
const showConfigPanel = ref(false)

// 主题支持 - 使用Naive UI主题系统
const themeVars = useThemeVars()
const toolbarColors = computed(() => ({
  '--toolbar-bg': themeVars.value.bodyColor,
  '--toolbar-border': themeVars.value.dividerColor,
  '--toolbar-shadow': themeVars.value.boxShadow2,
  '--modal-bg': themeVars.value.modalColor,
  '--modal-header-bg': themeVars.value.cardColor,
  '--modal-content-bg': themeVars.value.bodyColor,
  '--modal-border': themeVars.value.borderColor,
  '--modal-header-border': themeVars.value.dividerColor
}))

// 注意：isEditMode在模板中通过CommonToolbar间接使用

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

// 切换配置面板显示状态
const handleToggleRendererConfig = () => {
  showConfigPanel.value = !showConfigPanel.value
}

// 获取配置面板标题
const getConfigTitle = () => {
  if (isKanbanRenderer.value) {
    return '看板配置'
  } else if (isVisualizationRenderer.value) {
    return '可视化配置'
  }
  return '渲染器配置'
}
</script>

<template>
  <div
    class="main-toolbar h-12 flex items-center relative"
    :style="toolbarColors"
  >
    <!-- 公共工具栏 -->
    <CommonToolbar
      :mode="mode"
      :current-renderer="currentRenderer"
      :available-renderers="availableRenderers"
      :readonly="readonly"
      :is-saving="isSaving"
      :show-renderer-config="showConfigPanel"
      @mode-change="handleModeChange"
      @renderer-change="handleRendererChange"
      @save="handleSave"
      @undo="handleUndo"
      @redo="handleRedo"
      @reset="handleReset"
      @toggle-renderer-config="handleToggleRendererConfig"
    />

    <!-- 渲染器配置面板 - 模态弹窗 -->
    <NModal
      v-model:show="showConfigPanel"
      :mask-closable="true"
      :close-on-esc="true"
      preset="card"
      class="renderer-config-modal"
      :style="{ width: '800px', maxWidth: '90vw' }"
      :title="getConfigTitle()"
      :bordered="false"
      size="huge"
      role="dialog"
      aria-labelledby="config-modal-title"
      :auto-focus="false"
    >
      <div class="config-content">
        <!-- 看板配置面板 -->
        <KanbanToolbar
          v-if="isKanbanRenderer"
          :config="kanbanConfig"
          :readonly="readonly"
          @config-change="handleKanbanConfigChange"
        />



        <!-- 可视化配置面板 -->
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
    </NModal>
  </div>
</template>

<style scoped>
.main-toolbar {
  width: 100%;
  min-height: 48px;
  display: flex;
  align-items: center;
  background-color: var(--toolbar-bg);
  border-bottom: 1px solid var(--toolbar-border);
  box-shadow: 0 1px 3px var(--toolbar-shadow);
  position: relative;
  z-index: 10;
  transition: background-color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
}

/* 模态弹窗样式 - 增强半透明效果 */
.renderer-config-modal {
  --n-border-radius: 12px;
}

/* 弹窗遮罩半透明效果 */
.renderer-config-modal :deep(.n-modal-mask) {
  background-color: rgba(0, 0, 0, 0.4) !important;
  backdrop-filter: blur(6px) !important;
  -webkit-backdrop-filter: blur(6px) !important;
}

/* 弹窗容器半透明效果 */
.renderer-config-modal :deep(.n-modal-container) {
  backdrop-filter: blur(8px) !important;
  -webkit-backdrop-filter: blur(8px) !important;
}

/* 弹窗内容半透明效果 - 亮色主题 */
.renderer-config-modal :deep(.n-card) {
  background-color: var(--modal-bg) !important;
  backdrop-filter: blur(16px) !important;
  -webkit-backdrop-filter: blur(16px) !important;
  box-shadow: 0 8px 32px var(--toolbar-shadow) !important;
  border: 1px solid var(--modal-border) !important;
}

/* 弹窗标题栏半透明 - 亮色主题 */
.renderer-config-modal :deep(.n-card-header) {
  background-color: var(--modal-header-bg) !important;
  backdrop-filter: blur(12px) !important;
  -webkit-backdrop-filter: blur(12px) !important;
  border-bottom: 1px solid var(--modal-header-border) !important;
}

/* 弹窗主体内容半透明 - 亮色主题 */
.renderer-config-modal :deep(.n-card-content) {
  background-color: var(--modal-content-bg) !important;
  backdrop-filter: blur(8px) !important;
  -webkit-backdrop-filter: blur(8px) !important;
}

/* Naive UI 自动处理深色主题，移除手动样式覆盖 */

.config-content {
  padding: 0;
  max-height: 70vh;
  overflow-y: auto;
  background-color: transparent;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .renderer-config-modal {
    margin: 16px;
  }

  .config-content {
    max-height: 60vh;
  }
}
</style>
