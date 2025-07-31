<!--
  PanelV2 Main Component - New Architecture
  新版面板系统主组件，集成多渲染器架构与PanelLayout布局系统
-->
<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick, provide } from 'vue'
import { useMessage } from 'naive-ui'
import { useI18n } from 'vue-i18n'
import { useThemeStore } from '@/store/modules/theme'
import PanelLayout from './layout/PanelLayout.vue'
import KanbanRenderer from './renderers/kanban/KanbanRenderer.vue'
import VisualizationRenderer from './renderers/visualization/VisualizationRenderer.vue'
import GridstackRenderer from './renderers/gridstack/GridstackRenderer.vue'
import { MainToolbar, type KanbanToolbarConfig, type VisualizationToolbarConfig } from './toolbar'
import ComponentPanel from './components/ComponentPanel.vue'
import { useCanvasStore } from './store/canvasStore'
import { RendererManager } from './core/RendererManager'
import { RendererFactory } from './core/RendererFactory'
import { LegacyPanelAdapter } from './adapters/LegacyAdapter'
import eventBus from './core/EventBus'
import { PostBoard, PutBoard } from '@/service/api/panel'
import { GridOutline, DesktopOutline, WarningOutline, HelpOutline, AppsOutline } from '@vicons/ionicons5'
import type { BaseCanvasItem, PanelConfig } from './types/core'
import type { LegacyCardView } from './types/adapters'
import type { RendererInfo } from './types/renderer'

// Props
interface Props {
  // 面板ID
  panelId?: string
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
  // 面板名称
  panelName?: string
  // 是否为首页面板
  homeFlag?: string
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
const themeStore = useThemeStore()

// 工具函数
const message = useMessage()
const { t } = useI18n()

// 保存状态
const isSaving = ref(false)

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
  compactType: 'vertical',
  preventCollision: false,
  enableDrag: true,
  enableResize: true
})

const visualizationConfig = ref<Partial<VisualizationToolbarConfig>>({
  zoom: 100,
  gridSize: 20,
  showRuler: true,
  showGuides: true,
  snapToGrid: true
})

// 移除了 gridProConfig 相关代码

// 渲染器管理（使用自动注册系统）
const rendererFactory = new RendererFactory()
const rendererManager = new RendererManager(eventBus, rendererFactory, true) // 启用自动注册
const rendererContainer = ref<HTMLElement>()



// 数据适配器
const legacyAdapter = new LegacyPanelAdapter()

// 渲染器注册状态
const renderersReady = ref(false)

// 可用渲染器列表（从渲染器管理器动态获取）
const availableRenderers = computed(() => {
  console.log('PanelV2: Computing availableRenderers, renderersReady:', renderersReady.value)
  
  // 只有在渲染器注册完成后才获取列表
  if (!renderersReady.value) {
    console.log('PanelV2: Renderers not ready yet, returning empty list')
    return []
  }
  
  const rendererInfos = rendererManager.getAvailableRenderers()
  console.log('PanelV2: Available renderer infos from manager:', rendererInfos)
  console.log('PanelV2: Renderer factory count:', rendererFactory.getCount())
  console.log('PanelV2: Renderer factory registered IDs:', rendererFactory.getRegisteredIds())
  
  const mapped = rendererInfos.map(info => ({
    value: info.id,
    label: info.name,
    icon: info.icon || 'apps'
  }))
  console.log('PanelV2: Mapped available renderers:', mapped)
  return mapped
})

// 当前渲染器信息
const currentRendererInfo = computed(() => 
  availableRenderers.value.find(r => r.value === currentRenderer.value)
)

// 主题颜色计算属性
const themeColors = computed(() => {
  const isDark = themeStore.darkMode
  return {
    '--canvas-bg-color': isDark ? '#1a1a1a' : '#f5f5f5',
    '--primary-text': isDark ? '#ffffff' : '#333333',
    '--secondary-text': isDark ? '#cccccc' : '#666666',
    '--border-color': isDark ? '#404040' : '#e0e0e0',
    '--hover-bg': isDark ? '#2a2a2a' : '#f0f0f0',
    '--section-bg': isDark ? '#2a2a2a' : '#f8f9fa'
  }
})


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
    } else if (rendererId === 'kanban') {
      // 对于已注册的渲染器，正常切换
      await rendererManager.switchRenderer(rendererId)
      currentRenderer.value = rendererId
      emit('renderer-change', rendererId)
      
      // 发射全局事件（仅对已注册的渲染器）
      eventBus.emit('toolbar:renderer-switch', { rendererId })
    } else if (rendererId === 'gridstack') {
      // Gridstack渲染器处理
      currentRenderer.value = rendererId
      emit('renderer-change', rendererId)
      console.log('Switched to gridstack renderer')
      
      // 发射全局事件
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
const savePanelConfig = async () => {
  if (isSaving.value) return
  
  isSaving.value = true
  try {
    const config: PanelConfig = {
      panelId: props.panelId || props.config?.panelId || 'default',
      title: props.panelName || props.config?.title || 'New Panel',
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
    
    // 序列化配置数据
    const configStr = JSON.stringify({
      canvasState: canvasStore.canvasState,
      rendererType: currentRenderer.value,
      kanbanConfig: kanbanConfig.value,
      visualizationConfig: visualizationConfig.value,
  
    })
    
    // 准备API参数
    const apiParams = {
      name: props.panelName || config.title,
      config: configStr,
      home_flag: props.homeFlag || 'N'
    }
    
    // 根据是否有ID决定新增还是修改
    let result
    if (props.panelId) {
      // 修改
      result = await PutBoard({
        id: props.panelId,
        ...apiParams
      })
    } else {
      // 新增
      result = await PostBoard(apiParams)
    }
    
    if (!result.error) {
      message.success(t('page.dataForward.saveSuccess') || '保存成功')
      emit('save', config)
      eventBus.emit('panel:save', { data: config })
    } else {
      message.error(t('page.dataForward.saveFailed') || '保存失败')
      console.error('Failed to save panel:', result.error)
    }
  } catch (err) {
    message.error(t('page.dataForward.saveFailed') || '保存失败')
    console.error('Error saving panel:', err)
  } finally {
    isSaving.value = false
  }
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
    console.log('PanelV2: onMounted - Starting initialization')
    
    // 监听渲染器注册完成事件
    eventBus.on('renderer-manager:auto-register-complete', (result) => {
      console.log('PanelV2: Renderer auto-register complete:', result)
      renderersReady.value = true
      console.log('PanelV2: Renderers ready, available renderers:', availableRenderers.value)
    })
    
    if (rendererContainer.value) {
      console.log('PanelV2: Initializing renderer manager')
      console.log('PanelV2: Initial factory count:', rendererFactory.getCount())
      console.log('PanelV2: Initial factory registered IDs:', rendererFactory.getRegisteredIds())
      
      await rendererManager.initialize(rendererContainer.value)
      console.log('PanelV2: Renderer manager initialized')
      console.log('PanelV2: After init factory count:', rendererFactory.getCount())
      console.log('PanelV2: After init factory registered IDs:', rendererFactory.getRegisteredIds())
      
      // 等待一段时间确保渲染器注册完成
      await new Promise(resolve => setTimeout(resolve, 200))
      
      // 如果渲染器还没有准备好，手动设置为true
      if (!renderersReady.value) {
        console.log('PanelV2: Manually setting renderers ready')
        console.log('PanelV2: Before manual ready - factory count:', rendererFactory.getCount())
        renderersReady.value = true
      }
      
      console.log('PanelV2: Available renderers after ready:', availableRenderers.value)
      await switchRenderer(currentRenderer.value)
      console.log('PanelV2: Switched to renderer:', currentRenderer.value)
    }
  } catch (err) {
    console.error('PanelV2: Initialization error:', err)
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
  <div class="panelv2-container h-full w-full" :style="themeColors">
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
          :is-saving="isSaving"
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
        <div v-else class="flex items-center justify-center h-full" style="color: var(--secondary-text);">
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
              <div class="text-sm" style="color: var(--secondary-text);">切换渲染器中...</div>
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

            <!-- Gridstack渲染器 -->
            <GridstackRenderer
              v-else-if="currentRenderer === 'gridstack'"
              :items="canvasStore.items"
              :config="canvasStore.config"
              :readonly="readonly || currentMode === 'preview'"
            />

            <!-- 可视化大屏渲染器（敬请期待） -->
            <div v-else-if="currentRenderer === 'visualization'" class="flex items-center justify-center h-full bg-gradient-to-br from-blue-50 to-indigo-100">
              <div class="text-center p-8">
                <div class="text-6xl mb-4">🚧</div>
                <div class="text-2xl font-bold mb-2" style="color: var(--primary-text);">敬请期待</div>
                <div class="mb-4" style="color: var(--secondary-text);">可视化大屏渲染器正在开发中...</div>
                <div class="text-sm" style="color: var(--secondary-text);">
                  请使用看板模式体验拖拽功能
                </div>
              </div>
            </div>

            <!-- 默认渲染器或未知渲染器 -->
            <div v-else class="flex items-center justify-center h-full">
              <div class="text-center">
                <NIcon class="text-4xl mb-2" style="color: var(--secondary-text);">
                  <HelpOutline />
                </NIcon>
                <div class="text-lg" style="color: var(--secondary-text);">未知的渲染器类型: {{ currentRenderer }}</div>
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- 右侧属性面板插槽 -->
      <template #right="{ isEditMode }">
        <div class="property-panel h-full flex flex-col">
          <div class="p-4 border-b" style="border-color: var(--border-color);">
            <h3 class="text-lg font-semibold" style="color: var(--primary-text);">属性面板</h3>
            <p class="text-sm mt-1" style="color: var(--secondary-text);">配置选中组件的属性</p>
          </div>
          
          <div class="flex-1 p-4">
            <!-- 选中项目信息 -->
            <div v-if="canvasStore.hasSelection" class="space-y-4">
              <div class="text-sm font-medium" style="color: var(--primary-text);">
                已选中 {{ canvasStore.selectedItems.length }} 个组件
              </div>
              
              <!-- 这里可以放置属性配置表单 -->
              <div class="space-y-3">
                <div
                  v-for="item in canvasStore.selectedItems"
                  :key="item.id"
                  class="p-3 rounded" style="background-color: var(--section-bg);"
                >
                  <div class="font-medium text-sm">{{ item.cardData.title || item.id }}</div>
                  <div class="text-xs mt-1" style="color: var(--secondary-text);">
                    位置: {{ Math.round(item.position.x) }}, {{ Math.round(item.position.y) }}
                  </div>
                  <div class="text-xs" style="color: var(--secondary-text);">
                    尺寸: {{ item.size.width }} × {{ item.size.height }}
                  </div>
                </div>
              </div>
            </div>
            
            <!-- 未选中状态 -->
            <div v-else class="text-center" style="color: var(--secondary-text);">
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
.renderer-container {
  background-color: var(--canvas-bg-color);
  transition: background-color 0.3s ease;
}

.component-item {
  transition: all 0.2s ease;
}

.component-item:hover {
  transform: translateY(-1px);
  background-color: var(--hover-bg);
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