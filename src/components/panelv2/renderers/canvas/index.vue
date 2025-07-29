<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import type { CanvasItem, CanvasConfig, CanvasRendererProps } from './types'
import type { BaseRendererProps, RendererEvents } from '../base/interfaces'

// Props definition
interface Props extends Omit<BaseRendererProps, 'items'> {
  /** Canvas项目列表 */
  items?: CanvasItem[]
  /** Canvas配置 */
  canvasConfig?: Partial<CanvasConfig>
}

const props = withDefaults(defineProps<Props>(), {
  items: () => [],
  selectedIds: () => [],
  editable: true,
  showGrid: true,
  canvasConfig: () => ({})
})

// Events
const emit = defineEmits<RendererEvents>()

// Default Canvas configuration
const defaultCanvasConfig: CanvasConfig = {
  width: 1200,
  height: 800,
  zoom: 1,
  minZoom: 0.1,
  maxZoom: 5,
  backgroundColor: '#ffffff',
  grid: {
    enabled: true,
    size: 20,
    snap: true,
    color: '#e5e7eb',
    opacity: 0.5,
    visible: true
  },
  selectionBox: true,
  multiSelect: true,
  drag: {
    enabled: true,
    threshold: 5,
    containment: true
  },
  resize: {
    enabled: true,
    handleSize: 8,
    aspectRatio: false
  }
}

// Reactive state
const canvasContainer = ref<HTMLElement>()
const canvasConfig = reactive<CanvasConfig>({ 
  ...defaultCanvasConfig, 
  ...props.canvasConfig 
})

// Computed properties
const isEditMode = computed(() => props.mode === 'edit')
const canvasItems = computed(() => props.items || [])

// Canvas state
const canvasState = reactive({
  initialized: false,
  viewport: {
    x: 0,
    y: 0,
    zoom: canvasConfig.zoom
  }
})

// Methods
const initializeCanvas = () => {
  console.log('Canvas renderer initializing...')
  console.log('Config:', canvasConfig)
  console.log('Items:', canvasItems.value)
  canvasState.initialized = true
}

const destroyCanvas = () => {
  console.log('Canvas renderer destroying...')
  canvasState.initialized = false
}

const handleItemSelect = (item: CanvasItem) => {
  emit('item-select', [item.id])
}

const handleItemUpdate = (item: CanvasItem) => {
  emit('item-update', item.id, {
    position: item.position,
    size: item.size
  })
}

const handleItemRemove = (item: CanvasItem) => {
  emit('item-remove', item.id)
}

const handleZoomChange = (delta: number) => {
  const newZoom = Math.max(
    canvasConfig.minZoom || 0.1,
    Math.min(canvasConfig.maxZoom || 5, canvasState.viewport.zoom + delta)
  )
  canvasState.viewport.zoom = newZoom
}

// Lifecycle
onMounted(() => {
  initializeCanvas()
})

onUnmounted(() => {
  destroyCanvas()
})
</script>

<template>
  <div class="canvas-renderer h-full w-full" ref="canvasContainer">
    <!-- Header info -->
    <div class="renderer-header p-4 bg-green-50 dark:bg-green-900/20 border-b">
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-lg font-semibold text-green-600 dark:text-green-400">
            Canvas 渲染器
          </h3>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            自由画布系统 - {{ canvasConfig.width }} × {{ canvasConfig.height }}px
          </p>
        </div>
        <div class="text-sm text-gray-500">
          <span>模式: {{ mode }}</span>
          <span class="ml-4">项目: {{ canvasItems.length }}</span>
          <span class="ml-4">选中: {{ selectedIds.length }}</span>
          <span class="ml-4">缩放: {{ Math.round(canvasState.viewport.zoom * 100) }}%</span>
        </div>
      </div>
    </div>

    <!-- Canvas controls -->
    <div class="canvas-controls p-2 bg-gray-50 dark:bg-gray-800 border-b flex items-center space-x-4">
      <div class="flex items-center space-x-2">
        <button
          @click="handleZoomChange(-0.1)"
          class="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
          title="缩小"
        >
          <SvgIcon icon="material-symbols:zoom-out" class="w-3 h-3" />
        </button>
        <span class="text-xs text-gray-600 min-w-12 text-center">
          {{ Math.round(canvasState.viewport.zoom * 100) }}%
        </span>
        <button
          @click="handleZoomChange(0.1)"
          class="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
          title="放大"
        >
          <SvgIcon icon="material-symbols:zoom-in" class="w-3 h-3" />
        </button>
      </div>
      
      <div class="h-4 w-px bg-gray-300"></div>
      
      <div class="flex items-center space-x-2">
        <label class="flex items-center text-xs">
          <input
            v-model="canvasConfig.grid.visible"
            type="checkbox"
            class="mr-1"
          />
          显示网格
        </label>
        <label class="flex items-center text-xs">
          <input
            v-model="canvasConfig.grid.snap"
            type="checkbox"
            class="mr-1"
          />
          网格吸附
        </label>
      </div>
    </div>

    <!-- Canvas content -->
    <div class="canvas-content flex-1 p-4">
      <!-- Canvas configuration display -->
      <div class="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">画布配置</h4>
        <div class="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
          <div>尺寸: {{ canvasConfig.width }} × {{ canvasConfig.height }}</div>
          <div>网格: {{ canvasConfig.grid.size }}px</div>
          <div>缩放: {{ canvasState.viewport.zoom.toFixed(2) }}x</div>
          <div>吸附: {{ canvasConfig.grid.snap ? '启用' : '禁用' }}</div>
          <div>多选: {{ canvasConfig.multiSelect ? '启用' : '禁用' }}</div>
        </div>
      </div>

      <!-- Items display -->
      <div class="space-y-2">
        <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300">
          画布项目 ({{ canvasItems.length }})
        </h4>
        
        <div v-if="canvasItems.length === 0" class="text-center py-8">
          <div class="text-gray-400 dark:text-gray-500">
            <SvgIcon icon="material-symbols:artboard" class="w-12 h-12 mx-auto mb-2" />
            <p>暂无画布项目</p>
          </div>
        </div>

        <div v-else class="space-y-2">
          <div
            v-for="item in canvasItems"
            :key="item.id"
            class="item-card p-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg transition-all"
            :class="{
              'ring-2 ring-green-500': selectedIds.includes(item.id),
              'cursor-pointer hover:shadow-md': isEditMode,
              'opacity-50': !item.visible
            }"
            @click="isEditMode ? handleItemSelect(item) : null"
          >
            <div class="flex items-center justify-between">
              <div>
                <div class="font-medium text-gray-900 dark:text-white flex items-center space-x-2">
                  <span>{{ item.title || item.type }}</span>
                  <span v-if="item.locked" class="text-xs text-orange-500">🔒</span>
                  <span v-if="!item.visible" class="text-xs text-gray-400">👁️‍🗨️</span>
                </div>
                <div class="text-sm text-gray-500 dark:text-gray-400">
                  ID: {{ item.id }}
                </div>
              </div>
              <div class="text-xs text-gray-500 space-y-1">
                <div>位置: ({{ Math.round(item.position.x) }}, {{ Math.round(item.position.y) }})</div>
                <div>尺寸: {{ item.size.width }} × {{ item.size.height }}</div>
                <div>层级: {{ item.zIndex }}</div>
                <div v-if="item.position.rotation">旋转: {{ item.position.rotation }}°</div>
              </div>
            </div>
            
            <!-- Item actions -->
            <div v-if="isEditMode" class="mt-2 flex space-x-2">
              <button
                @click.stop="handleItemUpdate(item)"
                class="px-2 py-1 text-xs bg-green-100 text-green-600 rounded hover:bg-green-200"
              >
                更新
              </button>
              <button
                @click.stop="handleItemRemove(item)"
                class="px-2 py-1 text-xs bg-red-100 text-red-600 rounded hover:bg-red-200"
              >
                删除
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Status footer -->
    <div class="renderer-footer p-2 bg-gray-50 dark:bg-gray-800 border-t text-xs text-gray-500">
      <div class="flex justify-between">
        <span>状态: {{ canvasState.initialized ? '已初始化' : '未初始化' }}</span>
        <span>视口: {{ canvasState.viewport.x }}, {{ canvasState.viewport.y }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.canvas-renderer {
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
}

.canvas-content {
  overflow-y: auto;
}

.item-card {
  transition: all 0.2s ease;
}

.item-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.canvas-controls button {
  transition: all 0.15s ease;
}

.canvas-controls button:hover {
  transform: scale(1.05);
}
</style>