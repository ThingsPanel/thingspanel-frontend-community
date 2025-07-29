<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import type { GridStackItem, GridStackConfig, GridStackRendererProps } from './types'
import type { BaseRendererProps, RendererEvents } from '../base/interfaces'

// Props definition
interface Props extends Omit<BaseRendererProps, 'items'> {
  /** GridStack项目列表 */
  items?: GridStackItem[]
  /** GridStack配置 */
  gridConfig?: Partial<GridStackConfig>
}

const props = withDefaults(defineProps<Props>(), {
  items: () => [],
  selectedIds: () => [],
  editable: true,
  showGrid: true,
  gridConfig: () => ({})
})

// Events
const emit = defineEmits<RendererEvents>()

// Default GridStack configuration
const defaultGridConfig: GridStackConfig = {
  columns: 12,
  rowHeight: 60,
  margin: 10,
  animate: true,
  float: false,
  draggable: {
    containment: true
  },
  resizable: {
    handles: 'all'
  }
}

// Reactive state
const gridContainer = ref<HTMLElement>()
const gridConfig = reactive<GridStackConfig>({ 
  ...defaultGridConfig, 
  ...props.gridConfig 
})

// Computed properties
const isEditMode = computed(() => props.mode === 'edit')
const gridItems = computed(() => props.items || [])

// Grid state
const gridState = reactive({
  initialized: false,
  gridInstance: null as any
})

// Methods
const initializeGrid = () => {
  console.log('GridStack renderer initializing...')
  console.log('Config:', gridConfig)
  console.log('Items:', gridItems.value)
  gridState.initialized = true
}

const destroyGrid = () => {
  console.log('GridStack renderer destroying...')
  gridState.initialized = false
  gridState.gridInstance = null
}

const handleItemSelect = (item: GridStackItem) => {
  emit('item-select', [item.id])
}

const handleItemUpdate = (item: GridStackItem) => {
  emit('item-update', item.id, {
    position: item.position,
    size: item.size
  })
}

const handleItemRemove = (item: GridStackItem) => {
  emit('item-remove', item.id)
}

// Lifecycle
onMounted(() => {
  initializeGrid()
})

onUnmounted(() => {
  destroyGrid()
})
</script>

<template>
  <div class="gridstack-renderer h-full w-full" ref="gridContainer">
    <!-- Header info -->
    <div class="renderer-header p-4 bg-blue-50 dark:bg-blue-900/20 border-b">
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-lg font-semibold text-blue-600 dark:text-blue-400">
            GridStack 渲染器
          </h3>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            网格布局系统 - {{ gridConfig.columns }}列 × {{ gridConfig.rowHeight }}px 行高
          </p>
        </div>
        <div class="text-sm text-gray-500">
          <span>模式: {{ mode }}</span>
          <span class="ml-4">项目: {{ gridItems.length }}</span>
          <span class="ml-4">选中: {{ selectedIds.length }}</span>
        </div>
      </div>
    </div>

    <!-- Grid container -->
    <div class="grid-content flex-1 p-4">
      <!-- Grid configuration display -->
      <div class="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">网格配置</h4>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
          <div>列数: {{ gridConfig.columns }}</div>
          <div>行高: {{ gridConfig.rowHeight }}px</div>
          <div>间距: {{ gridConfig.margin }}px</div>
          <div>动画: {{ gridConfig.animate ? '启用' : '禁用' }}</div>
        </div>
      </div>

      <!-- Items display -->
      <div class="space-y-2">
        <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300">
          网格项目 ({{ gridItems.length }})
        </h4>
        
        <div v-if="gridItems.length === 0" class="text-center py-8">
          <div class="text-gray-400 dark:text-gray-500">
            <SvgIcon icon="material-symbols:grid-view" class="w-12 h-12 mx-auto mb-2" />
            <p>暂无网格项目</p>
          </div>
        </div>

        <div v-else class="space-y-2">
          <div
            v-for="item in gridItems"
            :key="item.id"
            class="item-card p-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg transition-all"
            :class="{
              'ring-2 ring-blue-500': selectedIds.includes(item.id),
              'cursor-pointer hover:shadow-md': isEditMode
            }"
            @click="isEditMode ? handleItemSelect(item) : null"
          >
            <div class="flex items-center justify-between">
              <div>
                <div class="font-medium text-gray-900 dark:text-white">
                  {{ item.title || item.type }}
                </div>
                <div class="text-sm text-gray-500 dark:text-gray-400">
                  ID: {{ item.id }}
                </div>
              </div>
              <div class="text-xs text-gray-500 space-y-1">
                <div>网格: ({{ item.gridPosition?.x }}, {{ item.gridPosition?.y }})</div>
                <div>尺寸: {{ item.gridPosition?.w }} × {{ item.gridPosition?.h }}</div>
              </div>
            </div>
            
            <!-- Item actions -->
            <div v-if="isEditMode" class="mt-2 flex space-x-2">
              <button
                @click.stop="handleItemUpdate(item)"
                class="px-2 py-1 text-xs bg-blue-100 text-blue-600 rounded hover:bg-blue-200"
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
        <span>状态: {{ gridState.initialized ? '已初始化' : '未初始化' }}</span>
        <span>GridStack {{ gridState.gridInstance ? '已加载' : '未加载' }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.gridstack-renderer {
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
}

.grid-content {
  overflow-y: auto;
}

.item-card {
  transition: all 0.2s ease;
}

.item-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
</style>