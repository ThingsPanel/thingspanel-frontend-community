<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import PanelLayout from './layout/PanelLayout.vue'
import Canvas from './components/canvas/Canvas.vue'
import { NButton, NSpace, NDivider } from 'naive-ui'
import type { CanvasItem, ComponentLibraryItem, CanvasState } from './types'
import { 
  mockCanvasState, 
  mockComponentLibrary, 
  generateRandomCanvasItem,
  generateTestCanvasItems 
} from './mock/mockData'

// Props definition
interface Props {
  /** 面板ID */
  panelId: string
  /** 初始模式 */
  mode?: 'edit' | 'preview'
  /** 只读模式 */
  readonly?: boolean
  /** 初始数据 */
  initialData?: Partial<CanvasState>
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'edit',
  readonly: false
})

// Events definition
const emit = defineEmits<{
  'mode-change': [mode: 'edit' | 'preview']
  'save': [data: CanvasState]
  'loaded': [data: CanvasState]
  'error': [error: Error]
}>()

// Refs
const layoutRef = ref()

// State management
const panelState = reactive<CanvasState>({
  ...mockCanvasState,
  mode: props.mode,
  ...props.initialData
})

const leftCollapsed = ref(false)
const rightCollapsed = ref(false)
const selectedItem = ref<CanvasItem | null>(null)

// Computed properties
const isEditMode = computed(() => panelState.mode === 'edit')
const canvasItemsCount = computed(() => panelState.items.length)
const selectedItemsCount = computed(() => panelState.selectedIds.length)

// Component library management
const componentLibrary = ref<ComponentLibraryItem[]>([...mockComponentLibrary])

// Drag and drop state
const dragState = reactive({
  isDragging: false,
  dragData: null as any,
  dragType: 'component' as 'component' | 'canvas-item' | 'resize'
})

// Panel mode management
const toggleMode = () => {
  const newMode = panelState.mode === 'edit' ? 'preview' : 'edit'
  panelState.mode = newMode
  
  // Clear selection when switching to preview mode
  if (newMode === 'preview') {
    clearSelection()
  }
  
  emit('mode-change', newMode)
}

// Canvas operations
const addCanvasItem = (componentId: string, position?: { x: number, y: number }) => {
  try {
    const newItem = generateRandomCanvasItem(componentId)
    
    // Use provided position or generate random
    if (position) {
      newItem.position = position
    }
    
    panelState.items.push(newItem)
    
    // Auto-select the new item
    selectItems([newItem.id])
    
    console.log('Added canvas item:', newItem)
  } catch (error) {
    console.error('Failed to add canvas item:', error)
    emit('error', error as Error)
  }
}

const removeCanvasItem = (itemId: string) => {
  const index = panelState.items.findIndex(item => item.id === itemId)
  if (index > -1) {
    panelState.items.splice(index, 1)
    
    // Remove from selection if selected
    const selectionIndex = panelState.selectedIds.indexOf(itemId)
    if (selectionIndex > -1) {
      panelState.selectedIds.splice(selectionIndex, 1)
    }
    
    // Update selected item if it was the removed item
    if (selectedItem.value?.id === itemId) {
      selectedItem.value = null
    }
  }
}

const clearCanvas = () => {
  panelState.items.length = 0
  clearSelection()
}

// Selection management
const selectItems = (itemIds: string[]) => {
  panelState.selectedIds = [...itemIds]
  
  // Update selected item for inspector
  if (itemIds.length === 1) {
    selectedItem.value = panelState.items.find(item => item.id === itemIds[0]) || null
  } else {
    selectedItem.value = null
  }
}

const clearSelection = () => {
  panelState.selectedIds = []
  selectedItem.value = null
}

const selectCanvasItem = (item: CanvasItem) => {
  selectItems([item.id])
}

// Layout control
const toggleLeftSidebar = () => {
  layoutRef.value?.toggleLeft()
}

const toggleRightSidebar = () => {
  layoutRef.value?.toggleRight()
}

// Drag and drop handling
const handleDragStart = (event: DragEvent, item: ComponentLibraryItem) => {
  dragState.isDragging = true
  dragState.dragData = item
  dragState.dragType = 'component'
  
  event.dataTransfer!.effectAllowed = 'copy'
  event.dataTransfer!.setData('text/plain', JSON.stringify(item))
  
  // Visual feedback
  const dragElement = event.target as HTMLElement
  dragElement.style.opacity = '0.6'
}

const handleDragEnd = (event: DragEvent) => {
  dragState.isDragging = false
  dragState.dragData = null
  
  // Restore visual state
  const dragElement = event.target as HTMLElement
  dragElement.style.opacity = '1'
}

const handleDragOver = (event: DragEvent) => {
  if (!isEditMode.value) return
  
  event.preventDefault()
  event.dataTransfer!.dropEffect = 'copy'
}

const handleDrop = (event: DragEvent) => {
  if (!isEditMode.value) return
  
  event.preventDefault()
  
  try {
    const itemData = JSON.parse(event.dataTransfer!.getData('text/plain'))
    
    // Calculate drop position relative to canvas
    const canvasRect = (event.currentTarget as Element).getBoundingClientRect()
    const dropPosition = {
      x: event.clientX - canvasRect.left,
      y: event.clientY - canvasRect.top
    }
    
    addCanvasItem(itemData.id, dropPosition)
  } catch (error) {
    console.error('Drop failed:', error)
    emit('error', new Error('Failed to add component to canvas'))
  }
}

// Canvas event handlers
const handleItemUpdate = (id: string, updates: Partial<CanvasItem>) => {
  const itemIndex = panelState.items.findIndex(item => item.id === id)
  if (itemIndex > -1) {
    Object.assign(panelState.items[itemIndex], updates)
  }
}

const handleItemAdd = (item: CanvasItem) => {
  panelState.items.push(item)
  selectItems([item.id])
}

// Test data generation
const addTestItems = () => {
  const testItems = generateTestCanvasItems(3)
  panelState.items.push(...testItems)
}

// Data persistence
const savePanel = () => {
  try {
    const saveData = { ...panelState }
    emit('save', saveData)
    console.log('Panel saved:', saveData)
  } catch (error) {
    console.error('Save failed:', error)
    emit('error', error as Error)
  }
}

const loadPanel = () => {
  try {
    // Load initial data if provided
    if (props.initialData) {
      Object.assign(panelState, props.initialData)
    }
    
    emit('loaded', panelState)
    console.log('Panel loaded:', panelState)
  } catch (error) {
    console.error('Load failed:', error)
    emit('error', error as Error)
  }
}

// Lifecycle
onMounted(() => {
  loadPanel()
})

// Expose methods for parent components
defineExpose({
  savePanel,
  loadPanel,
  toggleMode,
  addCanvasItem,
  removeCanvasItem,
  clearCanvas,
  selectItems,
  clearSelection
})
</script>

<template>
  <div class="panel-v2 h-full w-full">
    <PanelLayout
      ref="layoutRef"
      :mode="panelState.mode"
      v-model:left-collapsed="leftCollapsed"
      v-model:right-collapsed="rightCollapsed"
    >
      <!-- Toolbar slot -->
      <template #toolbar>
        <div class="flex items-center justify-between w-full">
          <div class="flex items-center space-x-4">
            <h3 class="text-lg font-medium text-gray-900 dark:text-white">
              PanelV2 - {{ panelState.mode === 'edit' ? '编辑模式' : '预览模式' }}
            </h3>
            <NDivider vertical />
            <span class="text-sm text-gray-500 dark:text-gray-400">
              面板ID: {{ panelId }}
            </span>
            <NDivider vertical />
            <span class="text-sm text-gray-500 dark:text-gray-400">
              组件: {{ canvasItemsCount }} 个
            </span>
            <span 
              v-if="selectedItemsCount > 0"
              class="text-sm text-blue-500 dark:text-blue-400"
            >
              已选: {{ selectedItemsCount }} 个
            </span>
          </div>
          
          <NSpace>
            <!-- Sidebar controls -->
            <NButton 
              @click="toggleLeftSidebar" 
              :disabled="!isEditMode"
              size="small"
            >
              <template #icon>
                <SvgIcon :icon="leftCollapsed ? 'material-symbols:panel-left' : 'material-symbols:left-panel-close'" />
              </template>
              {{ leftCollapsed ? '显示' : '隐藏' }}组件库
            </NButton>
            
            <NButton 
              @click="toggleRightSidebar" 
              :disabled="!isEditMode"
              size="small"
            >
              <template #icon>
                <SvgIcon :icon="rightCollapsed ? 'material-symbols:panel-right' : 'material-symbols:right-panel-close'" />
              </template>
              {{ rightCollapsed ? '显示' : '隐藏' }}配置
            </NButton>
            
            <NDivider vertical />
            
            <!-- Canvas controls -->
            <NButton 
              @click="addTestItems" 
              :disabled="!isEditMode"
              size="small"
            >
              <template #icon>
                <SvgIcon icon="material-symbols:add-box" />
              </template>
              添加测试
            </NButton>
            
            <NButton 
              @click="clearCanvas" 
              :disabled="canvasItemsCount === 0 || !isEditMode"
              size="small"
            >
              <template #icon>
                <SvgIcon icon="material-symbols:clear-all" />
              </template>
              清空画布
            </NButton>
            
            <NDivider vertical />
            
            <!-- Mode and save controls -->
            <NButton 
              @click="savePanel"
              :disabled="readonly"
              type="primary"
              size="small"
            >
              <template #icon>
                <SvgIcon icon="material-symbols:save" />
              </template>
              保存
            </NButton>
            
            <NButton 
              type="primary" 
              @click="toggleMode"
              :disabled="readonly"
              size="small"
            >
              <template #icon>
                <SvgIcon :icon="isEditMode ? 'material-symbols:visibility' : 'material-symbols:edit'" />
              </template>
              {{ isEditMode ? '预览模式' : '编辑模式' }}
            </NButton>
          </NSpace>
        </div>
      </template>

      <!-- Left sidebar - Component library -->
      <template #left>
        <div class="p-4">
          <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-3">
            组件库
          </h4>
          <div class="space-y-2">
            <div
              v-for="item in componentLibrary"
              :key="item.id"
              class="component-item p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 cursor-grab active:cursor-grabbing hover:shadow-md transition-all duration-200"
              :style="{ borderLeftColor: item.color, borderLeftWidth: '4px' }"
              draggable="true"
              @dragstart="handleDragStart($event, item)"
              @dragend="handleDragEnd"
            >
              <div class="flex items-center space-x-3">
                <div 
                  class="w-8 h-8 rounded flex items-center justify-center text-white text-sm"
                  :style="{ backgroundColor: item.color }"
                >
                  <SvgIcon :icon="item.icon" class="w-4 h-4" />
                </div>
                <div>
                  <div class="text-sm font-medium text-gray-900 dark:text-white">
                    {{ item.name }}
                  </div>
                  <div class="text-xs text-gray-500 dark:text-gray-400">
                    {{ item.type }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- Main canvas area -->
      <template #main="{ mode, isEditMode }">
        <div class="canvas-wrapper h-full w-full relative">
          <!-- Preview mode return button -->
          <div
            v-if="!isEditMode"
            class="absolute top-4 left-4 z-50"
          >
            <NButton type="primary" @click="toggleMode">
              <template #icon>
                <SvgIcon icon="material-symbols:edit" />
              </template>
              返回编辑
            </NButton>
          </div>
          
          <!-- Canvas component -->
          <Canvas
            :items="panelState.items"
            :selected-ids="panelState.selectedIds"
            :is-edit-mode="isEditMode"
            :canvas-size="panelState.canvasSize"
            :grid="panelState.grid"
            :is-dragging="dragState.isDragging"
            @item-select="selectItems"
            @item-update="handleItemUpdate"
            @item-remove="removeCanvasItem"
            @item-add="handleItemAdd"
            @drag-over="handleDragOver"
            @drop="handleDrop"
          />
        </div>
      </template>

      <!-- Right sidebar - Inspector -->
      <template #right>
        <div class="p-4">
          <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-3">
            属性配置
          </h4>
          
          <div v-if="selectedItem" class="space-y-4">
            <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
              <div class="text-sm font-medium text-gray-900 dark:text-white mb-2">
                {{ selectedItem.title || selectedItem.type }}
              </div>
              
              <div class="space-y-2 text-xs text-gray-600 dark:text-gray-400">
                <div>
                  <span>ID:</span>
                  <span class="ml-2 font-mono">{{ selectedItem.id }}</span>
                </div>
                <div>
                  <span>类型:</span>
                  <span class="ml-2">{{ selectedItem.type }}</span>
                </div>
                <div>
                  <span>位置:</span>
                  <span class="ml-2">x: {{ selectedItem.position.x }}, y: {{ selectedItem.position.y }}</span>
                </div>
                <div>
                  <span>尺寸:</span>
                  <span class="ml-2">{{ selectedItem.size.width }} × {{ selectedItem.size.height }}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div v-else class="text-center text-gray-500 dark:text-gray-400 mt-8">
            <SvgIcon icon="material-symbols:settings" class="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p class="text-sm">选择一个组件查看配置</p>
          </div>
        </div>
      </template>
    </PanelLayout>
  </div>
</template>

<style scoped>
.panel-v2 {
  font-family: var(--font-family);
}

.component-item:hover {
  transform: translateY(-1px);
}

.component-item:active {
  transform: rotate(5deg) scale(0.95);
}

.canvas-wrapper {
  height: 100%;
  width: 100%;
}
</style>