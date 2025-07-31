<!--
  PanelV2 Main Component - New Architecture
  新版面板系统主组件，集成多渲染器架构与PanelLayout布局系统
-->
<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick, provide } from 'vue'
import PanelLayout from './layout/PanelLayout.vue'
import KanbanRenderer from './renderers/kanban/KanbanRenderer.vue'
import VisualizationRenderer from './renderers/visualization/VisualizationRenderer.vue'
import GridProRenderer from './renderers/gridpro/GridProRenderer.vue'
import { MainToolbar, type KanbanToolbarConfig, type VisualizationToolbarConfig } from './toolbar'
import ComponentPanel from './components/ComponentPanel.vue'
import { useCanvasStore } from './store/canvasStore'
import { RendererManager } from './core/RendererManager'
import { RendererFactory } from './core/RendererFactory'
import { KanbanRenderer as KanbanRendererClass } from './renderers/kanban/KanbanRendererFactory'
import { GridProRendererImpl } from './renderers/gridpro/GridProRendererFactory'  
import { LegacyPanelAdapter } from './adapters/LegacyAdapter'
import eventBus from './core/EventBus'
import { GridOutline, DesktopOutline, WarningOutline, HelpOutline, AppsOutline } from '@vicons/ionicons5'
import type { BaseCanvasItem, PanelConfig } from './types/core'
import type { LegacyCardView } from './types/adapters'
import type { RendererInfo } from './types/renderer'

// Props
interface Props {
  // 面板数据
  panelData?: any
  // 初始模式
  mode?: 'edit' | 'preview'
  // 渲染器类型
  rendererType?: string
  // 面板配置
  config?: Partial<PanelConfig>
  // 只读模式
  readonly?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'edit',
  rendererType: 'kanban',
  readonly: false
})

// Emits
interface Emits {
  (e: 'data-change', data: BaseCanvasItem[]): void
  (e: 'mode-change', mode: 'edit' | 'preview'): void
  (e: 'renderer-change', rendererId: string): void
  (e: 'save', config: PanelConfig): void
  (e: 'error', error: Error): void
}

const emit = defineEmits<Emits>()

// Store
const canvasStore = useCanvasStore()

// 响应式状态
const currentMode = ref<'edit' | 'preview'>(props.mode)
const currentRenderer = ref(props.rendererType)
const leftCollapsed = ref(false)
const rightCollapsed = ref(false)
const loading = ref(false)
const error = ref<Error | null>(null)

// 工具栏配置状态
const kanbanConfig = ref<Partial<KanbanToolbarConfig>>({
  columns: 12,
  rowHeight: 60,
  margin: [10, 10],
  showGrid: true,
  enableSnap: true,
  compactType: 'vertical'
})

const visualizationConfig = ref<Partial<VisualizationToolbarConfig>>({
  zoom: 100,
  gridSize: 20,
  showRuler: true,
  showGuides: true,
  snapToGrid: true
})

const gridProConfig = ref({
  columns: 12,
  rowHeight: 60,
  gap: 12,
  margin: [16, 16] as [number, number],
  layoutMode: 'relaxed' as const,
  enableDrag: true,
  enableResize: true,
  enableTransitions: true,
  animationSpeed: 'normal' as const,
  virtualization: false,
  preventCollision: true,
  showGrid: false,
  debug: false
})

// 渲染器管理
const rendererFactory = new RendererFactory()
const rendererManager = new RendererManager(eventBus, rendererFactory)
const rendererContainer = ref<HTMLElement>()

// 数据适配器
const legacyAdapter = new LegacyPanelAdapter()

// 注册内置渲染器
rendererFactory.register('kanban', KanbanRendererClass)
rendererFactory.register('gridpro', GridProRendererImpl)
// rendererFactory.register('canvas', CanvasRendererClass) // 需要创建CanvasRendererClass

// 可用渲染器列表
const availableRenderers = computed(() => [
  { value: 'kanban', label: '看板', icon: 'grid' },
  { value: 'gridpro', label: 'GridPro', icon: 'apps' },
  { value: 'visualization', label: '可视化大屏', icon: 'desktop' }
])

// 当前渲染器信息
const currentRendererInfo = computed(() => 
  availableRenderers.value.find(r => r.value === currentRenderer.value)
)


// 渲染器切换
const switchRenderer = async (rendererId: string) => {
  if (rendererId === currentRenderer.value) return
  
  try {
    loading.value = true
    
    // 检查渲染器是否已注册
    if (rendererId === 'visualization') {
      // 可视化大屏暂未实现，只切换UI状态
      currentRenderer.value = rendererId
      emit('renderer-change', rendererId)
      console.log('Switched to visualization renderer (placeholder mode)')
    } else if (rendererId === 'kanban' || rendererId === 'gridpro') {
      // 对于已注册的渲染器，正常切换
      await rendererManager.switchRenderer(rendererId)
      currentRenderer.value = rendererId
      emit('renderer-change', rendererId)
      
      // 发射全局事件（仅对已注册的渲染器）
      eventBus.emit('toolbar:renderer-switch', { rendererId })
    } else {
      // 其他渲染器的默认处理
      currentRenderer.value = rendererId
      emit('renderer-change', rendererId)
      console.log(`Switched to ${rendererId} renderer`)
    }
  } catch (err) {
    error.value = err as Error
    emit('error', err as Error)
    console.error('Failed to switch renderer:', err)
  } finally {
    loading.value = false
  }
}

// 数据处理
const processLegacyData = (data: any): BaseCanvasItem[] => {
  if (!data) return []
  
  try {
    // 如果是现有的面板数据格式
    if (data.config && typeof data.config === 'string') {
      const conversionResult = legacyAdapter.convertBatch(
        legacyAdapter.parsePanelData(data)
      )
      
      if (conversionResult.success) {
        return conversionResult.data
      } else {
        console.warn('Legacy data conversion failed:', conversionResult.errors)
        return []
      }
    }
    
    // 如果直接是BaseCanvasItem数组
    if (Array.isArray(data)) {
      return data as BaseCanvasItem[]
    }
    
    return []
  } catch (err) {
    console.error('Error processing panel data:', err)
    return []
  }
}

// 保存面板配置
const savePanelConfig = () => {
  const config: PanelConfig = {
    panelId: props.config?.panelId || 'default',
    title: props.config?.title || 'New Panel',
    theme: props.config?.theme || 'default',
    canvasState: canvasStore.canvasState,
    rendererType: currentRenderer.value,
    version: '2.0.0',
    metadata: {
      createdAt: props.config?.metadata?.createdAt || Date.now(),
      updatedAt: Date.now(),
      author: props.config?.metadata?.author
    }
  }
  
  emit('save', config)
  eventBus.emit('panel:save', { data: config })
}

// 重置面板
const resetPanel = () => {
  canvasStore.reset()
  eventBus.emit('panel:reset', {})
}

// 工具栏事件处理
const handleModeChange = (mode: 'edit' | 'preview') => {
  currentMode.value = mode
  emit('mode-change', mode)
  eventBus.emit('panel:mode-change', { mode })
}

const handleSave = () => {
  savePanelConfig()
}

const handleUndo = () => {
  canvasStore.undo()
}

const handleRedo = () => {
  canvasStore.redo()
}

const handleReset = () => {
  resetPanel()
}

// 看板配置变更处理
const handleKanbanConfigChange = (config: Partial<KanbanToolbarConfig>) => {
  console.log('PanelV2: Kanban config change received:', config)
  kanbanConfig.value = { ...kanbanConfig.value, ...config }
  console.log('PanelV2: Updated kanbanConfig:', kanbanConfig.value)
  // 将配置应用到看板渲染器
  eventBus.emit('kanban:config-change', config)
  console.log('PanelV2: Emitted kanban:config-change event')
}

// 可视化配置变更处理
const handleVisualizationConfigChange = (config: Partial<VisualizationToolbarConfig>) => {
  visualizationConfig.value = { ...visualizationConfig.value, ...config }
  // 将配置应用到可视化渲染器
  eventBus.emit('visualization:config-change', config)
}

// 可视化工具栏操作
const handleZoomIn = () => {
  canvasStore.zoomIn()
  visualizationConfig.value.zoom = canvasStore.viewport.zoom * 100
}

const handleZoomOut = () => {
  canvasStore.zoomOut()
  visualizationConfig.value.zoom = canvasStore.viewport.zoom * 100
}

const handleResetZoom = () => {
  canvasStore.resetZoom()
  visualizationConfig.value.zoom = 100
}

const handleFitContent = () => {
  eventBus.emit('viewport:fit-content', {})
}

const handleCenterView = () => {
  eventBus.emit('viewport:center', {})
}


// 监听数据变化
watch(() => props.panelData, (newData) => {
  if (newData) {
    const processedData = processLegacyData(newData)
    canvasStore.setItems(processedData)
  }
}, { immediate: true, deep: true })

// 监听store数据变化，向外发射
watch(() => canvasStore.items, (newItems) => {
  emit('data-change', newItems)
}, { deep: true })

// 生命周期
onMounted(async () => {
  try {
    if (rendererContainer.value) {
      await rendererManager.initialize(rendererContainer.value)
      await switchRenderer(currentRenderer.value)
    }
  } catch (err) {
    error.value = err as Error
    emit('error', err as Error)
  }
})

onUnmounted(() => {
  rendererManager.destroy()
})

// 提供给子组件的依赖
provide('canvasStore', canvasStore)
provide('eventBus', eventBus)
provide('rendererManager', rendererManager)
</script>

<template>
  <div class="panelv2-container h-full w-full">
    <PanelLayout
      :mode="currentMode"
      :left-collapsed="leftCollapsed"
      :right-collapsed="rightCollapsed"
      @update:left-collapsed="leftCollapsed = $event"
      @update:right-collapsed="rightCollapsed = $event"
    >
      <!-- 新的分层工具栏 -->
      <template #toolbar="{ isEditMode }">
        <MainToolbar
          :mode="currentMode"
          :current-renderer="currentRenderer"
          :available-renderers="availableRenderers"
          :kanban-config="kanbanConfig"
          :visualization-config="visualizationConfig"
          :readonly="readonly"
          @mode-change="handleModeChange"
          @renderer-change="switchRenderer"
          @save="handleSave"
          @undo="handleUndo"
          @redo="handleRedo"
          @reset="handleReset"
          @kanban-config-change="handleKanbanConfigChange"
          @visualization-config-change="handleVisualizationConfigChange"
          @zoom-in="handleZoomIn"
          @zoom-out="handleZoomOut"
          @reset-zoom="handleResetZoom"
          @fit-content="handleFitContent"
          @center-view="handleCenterView"
        />
      </template>

      <!-- 左侧组件库插槽 -->
      <template #left="{ isEditMode }">
        <ComponentPanel
          v-if="isEditMode"
          :current-renderer="currentRenderer"
        />
        <div v-else class="flex items-center justify-center h-full text-gray-500">
          预览模式下不显示组件库
        </div>
      </template>

      <!-- 主画布区域插槽 -->
      <template #main="{ isEditMode }">
        <div class="canvas-container h-full w-full relative">
          <!-- 加载状态 -->
          <div
            v-if="loading"
            class="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50"
          >
            <div class="text-center">
              <div class="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
              <div class="text-sm text-gray-600">切换渲染器中...</div>
            </div>
          </div>

          <!-- 错误状态 -->
          <div
            v-else-if="error"
            class="absolute inset-0 bg-red-50 flex items-center justify-center"
          >
            <div class="text-center p-6">
              <NIcon class="text-4xl text-red-500 mb-2">
                <WarningOutline />
              </NIcon>
              <div class="text-lg font-medium text-red-700 mb-2">渲染器错误</div>
              <div class="text-sm text-red-600">{{ error.message }}</div>
              <NButton
                type="primary"
                size="small"
                class="mt-4"
                @click="error = null"
              >
                重试
              </NButton>
            </div>
          </div>

          <!-- 渲染器容器 -->
          <div
            v-else
            ref="rendererContainer"
            class="renderer-container h-full w-full"
          >
            <!-- 根据当前渲染器类型显示不同的渲染器组件 -->
            <KanbanRenderer
              v-if="currentRenderer === 'kanban'"
              :items="canvasStore.items"
              :config="canvasStore.config"
              :readonly="readonly || currentMode === 'preview'"
            />

            <!-- GridPro 渲染器 -->
            <GridProRenderer
              v-else-if="currentRenderer === 'gridpro'"
              :items="canvasStore.items"
              :config="gridProConfig"
              :readonly="readonly || currentMode === 'preview'"
              @update:items="canvasStore.setItems"
              @update:config="gridProConfig = $event"
              @item-added="canvasStore.addItem"
              @item-updated="canvasStore.updateItem"
              @item-removed="canvasStore.removeItem"
            />
            
            <!-- 可视化大屏渲染器（敬请期待） -->
            <div v-else-if="currentRenderer === 'visualization'" class="flex items-center justify-center h-full bg-gradient-to-br from-blue-50 to-indigo-100">
              <div class="text-center p-8">
                <div class="text-6xl mb-4">🚧</div>
                <div class="text-2xl font-bold text-gray-700 mb-2">敬请期待</div>
                <div class="text-gray-500 mb-4">可视化大屏渲染器正在开发中...</div>
                <div class="text-sm text-gray-400">
                  请使用看板模式体验拖拽功能
                </div>
              </div>
            </div>

            <!-- 默认渲染器或未知渲染器 -->
            <div v-else class="flex items-center justify-center h-full">
              <div class="text-center">
                <NIcon class="text-4xl text-gray-400 mb-2">
                  <HelpOutline />
                </NIcon>
                <div class="text-lg text-gray-500">未知的渲染器类型: {{ currentRenderer }}</div>
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- 右侧属性面板插槽 -->
      <template #right="{ isEditMode }">
        <div class="property-panel h-full flex flex-col">
          <div class="p-4 border-b border-gray-200">
            <h3 class="text-lg font-semibold text-gray-800">属性面板</h3>
            <p class="text-sm text-gray-600 mt-1">配置选中组件的属性</p>
          </div>
          
          <div class="flex-1 p-4">
            <!-- 选中项目信息 -->
            <div v-if="canvasStore.hasSelection" class="space-y-4">
              <div class="text-sm font-medium text-gray-700">
                已选中 {{ canvasStore.selectedItems.length }} 个组件
              </div>
              
              <!-- 这里可以放置属性配置表单 -->
              <div class="space-y-3">
                <div
                  v-for="item in canvasStore.selectedItems"
                  :key="item.id"
                  class="p-3 bg-gray-50 rounded"
                >
                  <div class="font-medium text-sm">{{ item.cardData.title || item.id }}</div>
                  <div class="text-xs text-gray-500 mt-1">
                    位置: {{ Math.round(item.position.x) }}, {{ Math.round(item.position.y) }}
                  </div>
                  <div class="text-xs text-gray-500">
                    尺寸: {{ item.size.width }} × {{ item.size.height }}
                  </div>
                </div>
              </div>
            </div>
            
            <!-- 未选中状态 -->
            <div v-else class="text-center text-gray-500">
              <NIcon class="text-2xl mb-2">
                <AppsOutline />
              </NIcon>
              <div>请选择一个或多个组件</div>
            </div>
          </div>
        </div>
      </template>
    </PanelLayout>
  </div>
</template>

<style scoped>
.panelv2-container {
  --canvas-bg-color: #f5f5f5;
}

.renderer-container {
  background-color: var(--canvas-bg-color);
}

.component-item {
  transition: all 0.2s ease;
}

.component-item:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* 工具栏样式优化 */
:deep(.n-button--small) {
  height: 28px;
  min-height: 28px;
}

:deep(.n-select) {
  min-width: 120px;
}

/* 响应式适配 */
@media (max-width: 768px) {
  .toolbar-controls {
    flex-wrap: wrap;
    gap: 8px;
  }
}
</style>