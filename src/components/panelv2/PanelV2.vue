<!--
  PanelV2 Main Component - New Architecture
  新版面板系统主组件，集成多渲染器架构与PanelLayout布局系统
-->
<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick, provide } from 'vue'
import { NButton, NSelect, NSpace, NSwitch, NIcon, NTooltip } from 'naive-ui'
import PanelLayout from './layout/PanelLayout.vue'
import GridRenderer from './renderers/GridRenderer.vue'
import CanvasRenderer from './renderers/CanvasRenderer.vue'
import { useCanvasStore } from './store/canvasStore'
import { RendererManager } from './core/RendererManager'
import { RendererFactory } from './core/RendererFactory'
import { GridRenderer as GridRendererClass } from './renderers/GridRendererFactory'  
import { LegacyPanelAdapter } from './adapters/LegacyAdapter'
import eventBus from './core/EventBus'
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
  rendererType: 'grid',
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

// 渲染器管理
const rendererFactory = new RendererFactory()
const rendererManager = new RendererManager(eventBus, rendererFactory)
const rendererContainer = ref<HTMLElement>()

// 数据适配器
const legacyAdapter = new LegacyPanelAdapter()

// 注册内置渲染器
rendererFactory.register('grid', GridRendererClass)
// rendererFactory.register('canvas', CanvasRendererClass) // 需要创建CanvasRendererClass

// 可用渲染器列表
const availableRenderers = computed(() => [
  { value: 'grid', label: '网格布局', icon: 'i-carbon-grid' },
  { value: 'canvas', label: '自由画布', icon: 'i-carbon-canvas' }
])

// 当前渲染器信息
const currentRendererInfo = computed(() => 
  availableRenderers.value.find(r => r.value === currentRenderer.value)
)

// 模式切换
const toggleMode = () => {
  currentMode.value = currentMode.value === 'edit' ? 'preview' : 'edit'
  emit('mode-change', currentMode.value)
  eventBus.emit('panel:mode-change', { mode: currentMode.value })
}

// 渲染器切换
const switchRenderer = async (rendererId: string) => {
  if (rendererId === currentRenderer.value) return
  
  try {
    loading.value = true
    await rendererManager.switchRenderer(rendererId)
    currentRenderer.value = rendererId
    emit('renderer-change', rendererId)
    
    // 发射全局事件
    eventBus.emit('toolbar:renderer-switch', { rendererId })
  } catch (err) {
    error.value = err as Error
    emit('error', err as Error)
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

// 工具栏操作
const handleToolbarAction = (action: string) => {
  switch (action) {
    case 'save':
      savePanelConfig()
      break
    case 'reset':
      resetPanel()
      break
    case 'undo':
      canvasStore.undo()
      break
    case 'redo':
      canvasStore.redo()
      break
    case 'fitContent':
      eventBus.emit('viewport:fit-content', {})
      break
    case 'zoomIn':
      canvasStore.zoomIn()
      break
    case 'zoomOut':
      canvasStore.zoomOut()
      break
    case 'resetZoom':
      canvasStore.resetZoom()
      break
    default:
      eventBus.emit('toolbar:action', { action })
  }
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
      <!-- 工具栏插槽 -->
      <template #toolbar="{ isEditMode }">
        <div class="flex items-center gap-3">
          <!-- 左侧工具 -->
          <div class="flex items-center gap-2">
            <!-- 模式切换 -->
            <NTooltip>
              <template #trigger>
                <NSwitch
                  v-model:value="currentMode"
                  :disabled="readonly"
                  true-value="edit"
                  false-value="preview"
                  @update:value="toggleMode"
                >
                  <template #checked>编辑</template>
                  <template #unchecked>预览</template>
                </NSwitch>
              </template>
              切换编辑/预览模式
            </NTooltip>

            <!-- 渲染器选择 -->
            <NSelect
              v-model:value="currentRenderer"
              :options="availableRenderers"
              :disabled="readonly || !isEditMode"
              style="width: 120px"
              @update:value="switchRenderer"
            />
          </div>

          <!-- 中间工具 -->
          <div class="flex items-center gap-1">
            <NTooltip>
              <template #trigger>
                <NButton
                  size="small"
                  :disabled="!canvasStore.canUndo || readonly"
                  @click="handleToolbarAction('undo')"
                >
                  <NIcon name="i-carbon-undo" />
                </NButton>
              </template>
              撤销 (Ctrl+Z)
            </NTooltip>

            <NTooltip>
              <template #trigger>
                <NButton
                  size="small"
                  :disabled="!canvasStore.canRedo || readonly"
                  @click="handleToolbarAction('redo')"
                >
                  <NIcon name="i-carbon-redo" />
                </NButton>
              </template>
              重做 (Ctrl+Y)
            </NTooltip>

            <div class="w-px h-4 bg-gray-300 mx-1"></div>

            <NTooltip>
              <template #trigger>
                <NButton
                  size="small"
                  @click="handleToolbarAction('fitContent')"
                >
                  <NIcon name="i-carbon-fit-to-screen" />
                </NButton>
              </template>
              适应内容
            </NTooltip>

            <NTooltip>
              <template #trigger>
                <NButton
                  size="small"
                  @click="handleToolbarAction('zoomIn')"
                >
                  <NIcon name="i-carbon-zoom-in" />
                </NButton>
              </template>
              放大 (Ctrl++)
            </NTooltip>

            <NTooltip>
              <template #trigger>
                <NButton
                  size="small"
                  @click="handleToolbarAction('zoomOut')"
                >
                  <NIcon name="i-carbon-zoom-out" />
                </NButton>
              </template>
              缩小 (Ctrl+-)
            </NTooltip>

            <NTooltip>
              <template #trigger>
                <NButton
                  size="small"
                  @click="handleToolbarAction('resetZoom')"
                >
                  <NIcon name="i-carbon-zoom-reset" />
                </NButton>
              </template>
              重置缩放 (Ctrl+0)
            </NTooltip>
          </div>

          <!-- 右侧工具 -->
          <div class="flex items-center gap-2 ml-auto">
            <NButton
              size="small"
              :disabled="readonly"
              @click="handleToolbarAction('save')"
            >
              <NIcon name="i-carbon-save" class="mr-1" />
              保存
            </NButton>

            <NButton
              size="small"
              :disabled="readonly"
              @click="handleToolbarAction('reset')"
            >
              <NIcon name="i-carbon-reset" class="mr-1" />
              重置
            </NButton>

            <!-- 侧边栏切换 -->
            <NTooltip>
              <template #trigger>
                <NButton
                  size="small"
                  :type="leftCollapsed ? 'default' : 'primary'"
                  @click="leftCollapsed = !leftCollapsed"
                >
                  <NIcon name="i-carbon-side-panel-open" />
                </NButton>
              </template>
              {{ leftCollapsed ? '显示' : '隐藏' }}组件库
            </NTooltip>

            <NTooltip>
              <template #trigger>
                <NButton
                  size="small"
                  :type="rightCollapsed ? 'default' : 'primary'"
                  @click="rightCollapsed = !rightCollapsed"
                >
                  <NIcon name="i-carbon-side-panel-close" />
                </NButton>
              </template>
              {{ rightCollapsed ? '显示' : '隐藏' }}属性面板
            </NTooltip>
          </div>
        </div>
      </template>

      <!-- 左侧组件库插槽 -->
      <template #left="{ isEditMode }">
        <div class="component-library h-full flex flex-col">
          <div class="p-4 border-b border-gray-200">
            <h3 class="text-lg font-semibold text-gray-800">组件库</h3>
            <p class="text-sm text-gray-600 mt-1">拖拽组件到画布中</p>
          </div>
          
          <div class="flex-1 p-4 space-y-4">
            <!-- 这里可以放置组件库内容 -->
            <div class="grid grid-cols-2 gap-2">
              <div class="component-item p-3 bg-blue-50 border border-blue-200 rounded cursor-pointer hover:bg-blue-100">
                <div class="text-sm font-medium">图表卡片</div>
              </div>
              <div class="component-item p-3 bg-green-50 border border-green-200 rounded cursor-pointer hover:bg-green-100">
                <div class="text-sm font-medium">数据卡片</div>
              </div>
              <div class="component-item p-3 bg-purple-50 border border-purple-200 rounded cursor-pointer hover:bg-purple-100">
                <div class="text-sm font-medium">表格卡片</div>
              </div>
              <div class="component-item p-3 bg-orange-50 border border-orange-200 rounded cursor-pointer hover:bg-orange-100">
                <div class="text-sm font-medium">文本卡片</div>
              </div>
            </div>
          </div>
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
              <NIcon name="i-carbon-warning" class="text-4xl text-red-500 mb-2" />
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
            <GridRenderer
              v-if="currentRenderer === 'grid'"
              :items="canvasStore.items"
              :config="canvasStore.config"
              :readonly="readonly || currentMode === 'preview'"
            />
            
            <CanvasRenderer
              v-else-if="currentRenderer === 'canvas'" 
              :items="canvasStore.items"
              :config="canvasStore.config"
              :readonly="readonly || currentMode === 'preview'"
            />

            <!-- 默认渲染器或未知渲染器 -->
            <div v-else class="flex items-center justify-center h-full">
              <div class="text-center">
                <NIcon name="i-carbon-unknown" class="text-4xl text-gray-400 mb-2" />
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
              <NIcon name="i-carbon-select-window" class="text-2xl mb-2" />
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