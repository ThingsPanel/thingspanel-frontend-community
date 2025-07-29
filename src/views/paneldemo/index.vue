<script setup lang="ts">
import { ref, reactive } from 'vue'
import PanelLayout from '@/components/panelv2/layout/PanelLayout.vue'
import { NButton, NCard, NSpace, NDivider } from 'naive-ui'

// 状态管理
const isEditing = ref(true)
const leftCollapsed = ref(false)
const rightCollapsed = ref(false)
const selectedItem = ref<any>(null)
const layoutRef = ref()

// 组件库列表
const componentLibrary = reactive([
  { id: 'chart-bar', name: '柱状图', type: 'chart', icon: 'i-material-symbols:bar-chart', color: '#3b82f6' },
  { id: 'chart-line', name: '折线图', type: 'chart', icon: 'i-material-symbols:show-chart', color: '#10b981' },
  { id: 'chart-pie', name: '饼图', type: 'chart', icon: 'i-material-symbols:pie-chart', color: '#f59e0b' },
  { id: 'data-table', name: '数据表格', type: 'data', icon: 'i-material-symbols:table', color: '#8b5cf6' },
  { id: 'text-display', name: '文本显示', type: 'display', icon: 'i-material-symbols:text-fields', color: '#ef4444' },
  { id: 'image-card', name: '图片卡片', type: 'media', icon: 'i-material-symbols:image', color: '#06b6d4' }
])

// 看板内容列表
const canvasItems = reactive<any[]>([])

// 拖拽相关
const draggedItem = ref<any>(null)
const isDragging = ref(false)

// 拖拽开始
const handleDragStart = (event: DragEvent, item: any) => {
  draggedItem.value = item
  isDragging.value = true
  event.dataTransfer!.effectAllowed = 'copy'
  event.dataTransfer!.setData('text/plain', JSON.stringify(item))
  
  // 添加拖拽样式
  const dragElement = event.target as HTMLElement
  dragElement.style.opacity = '0.6'
}

// 拖拽结束
const handleDragEnd = (event: DragEvent) => {
  isDragging.value = false
  draggedItem.value = null
  
  // 恢复样式
  const dragElement = event.target as HTMLElement
  dragElement.style.opacity = '1'
}

// 拖拽进入画布
const handleDragOver = (event: DragEvent) => {
  event.preventDefault()
  event.dataTransfer!.dropEffect = 'copy'
}

// 放置到画布
const handleDrop = (event: DragEvent) => {
  event.preventDefault()
  
  try {
    const itemData = JSON.parse(event.dataTransfer!.getData('text/plain'))
    
    // 创建新的画布项目
    const newItem = {
      ...itemData,
      canvasId: `canvas_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      x: Math.floor(Math.random() * 400),
      y: Math.floor(Math.random() * 300),
      width: 200,
      height: 120
    }
    
    canvasItems.push(newItem)
    console.log('添加到画布:', newItem)
  } catch (error) {
    console.error('拖拽数据解析失败:', error)
  }
}

// 删除画布项目
const removeCanvasItem = (index: number) => {
  canvasItems.splice(index, 1)
}

// 选择画布项目
const selectCanvasItem = (item: any) => {
  selectedItem.value = item
}

// 切换模式
const toggleMode = () => {
  isEditing.value = !isEditing.value
  if (!isEditing.value) {
    selectedItem.value = null
  }
}

// 清空画布
const clearCanvas = () => {
  canvasItems.length = 0
  selectedItem.value = null
}

// 收起控制
const toggleLeftSidebar = () => {
  layoutRef.value?.toggleLeft()
}

const toggleRightSidebar = () => {
  layoutRef.value?.toggleRight()
}
</script>

<template>
  <div class="h-full w-full">
    <PanelLayout
      ref="layoutRef"
      :mode="isEditing ? 'edit' : 'preview'"
      v-model:left-collapsed="leftCollapsed"
      v-model:right-collapsed="rightCollapsed"
    >
      <!-- 工具栏 -->
      <template #toolbar>
        <div class="flex items-center justify-between w-full">
          <div class="flex items-center space-x-4">
            <h3 class="text-lg font-medium text-gray-900 dark:text-white">
              PanelV2 拖拽测试
            </h3>
            <NDivider vertical />
            <span class="text-sm text-gray-500 dark:text-gray-400">
              画布项目: {{ canvasItems.length }} 个
            </span>
          </div>
          
          <NSpace>
            <NButton @click="toggleLeftSidebar" :disabled="!isEditing">
              <template #icon>
                <SvgIcon :icon="leftCollapsed ? 'material-symbols:panel-left' : 'material-symbols:left-panel-close'" />
              </template>
              {{ leftCollapsed ? '显示' : '隐藏' }}组件库
            </NButton>
            <NButton @click="toggleRightSidebar" :disabled="!isEditing">
              <template #icon>
                <SvgIcon :icon="rightCollapsed ? 'material-symbols:panel-right' : 'material-symbols:right-panel-close'" />
              </template>
              {{ rightCollapsed ? '显示' : '隐藏' }}配置
            </NButton>
            <NDivider vertical />
            <NButton @click="clearCanvas" :disabled="canvasItems.length === 0">
              <template #icon>
                <SvgIcon icon="material-symbols:clear-all" />
              </template>
              清空画布
            </NButton>
            <NButton type="primary" @click="toggleMode">
              <template #icon>
                <SvgIcon :icon="isEditing ? 'material-symbols:visibility' : 'material-symbols:edit'" />
              </template>
              {{ isEditing ? '预览模式' : '编辑模式' }}
            </NButton>
          </NSpace>
        </div>
      </template>

      <!-- 左侧组件列表 -->
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

      <!-- 中央画布区域 -->
      <template #main="{ mode, isEditMode }">
        <div 
          class="h-full w-full relative bg-white dark:bg-gray-900 overflow-auto"
          :class="{ 'drag-over': isDragging }"
          @dragover="handleDragOver"
          @drop="handleDrop"
        >
          <!-- 预览模式返回按钮 -->
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
          <!-- 空状态提示 -->
          <div 
            v-if="canvasItems.length === 0"
            class="h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-500"
          >
            <SvgIcon 
              :icon="isEditMode ? 'material-symbols:drag-pan' : 'material-symbols:empty-dashboard'" 
              class="w-16 h-16 mb-4" 
            />
            <p class="text-lg font-medium mb-2">
              {{ isEditMode ? '拖拽组件到这里' : '画布为空' }}
            </p>
            <p class="text-sm">
              {{ isEditMode ? '从左侧组件库拖拽组件到画布开始设计' : '切换到编辑模式开始设计面板' }}
            </p>
          </div>

          <!-- 画布项目 -->
          <div
            v-for="(item, index) in canvasItems"
            :key="item.canvasId"
            class="canvas-item absolute bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-sm transition-all duration-200"
            :class="{ 
              'ring-2 ring-blue-500': selectedItem?.canvasId === item.canvasId && isEditMode,
              'cursor-pointer hover:shadow-md': isEditMode
            }"
            :style="{ 
              left: item.x + 'px', 
              top: item.y + 'px', 
              width: item.width + 'px', 
              height: item.height + 'px',
              borderLeftColor: item.color,
              borderLeftWidth: '4px'
            }"
            @click="isEditMode ? selectCanvasItem(item) : null"
          >
            <!-- 删除按钮 - 仅编辑模式显示 -->
            <button
              v-if="isEditMode"
              class="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs transition-colors"
              @click.stop="removeCanvasItem(index)"
            >
              ×
            </button>
            
            <!-- 内容区域 -->
            <div class="p-3 h-full flex flex-col">
              <div class="flex items-center space-x-2 mb-2">
                <div 
                  class="w-6 h-6 rounded flex items-center justify-center text-white text-xs"
                  :style="{ backgroundColor: item.color }"
                >
                  <SvgIcon :icon="item.icon" class="w-3 h-3" />
                </div>
                <span class="text-sm font-medium text-gray-900 dark:text-white">
                  {{ item.name }}
                </span>
              </div>
              <div class="flex-1 bg-gray-50 dark:bg-gray-700 rounded border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center">
                <span class="text-xs text-gray-500 dark:text-gray-400">
                  {{ item.type }} 内容区域
                </span>
              </div>
            </div>
          </div>

          <!-- 拖拽提示遮罩 -->
          <div 
            v-if="isDragging"
            class="absolute inset-0 bg-blue-50 dark:bg-blue-900 bg-opacity-50 border-2 border-dashed border-blue-400 flex items-center justify-center pointer-events-none"
          >
            <div class="text-blue-600 dark:text-blue-400 text-lg font-medium">
              松开鼠标放置组件
            </div>
          </div>
        </div>
      </template>

      <!-- 右侧配置面板 -->
      <template #right>
        <div class="p-4">
          <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-3">
            属性配置
          </h4>
          
          <div v-if="selectedItem" class="space-y-4">
            <NCard size="small">
              <template #header>
                <div class="flex items-center space-x-2">
                  <SvgIcon :icon="selectedItem.icon" class="w-4 h-4" />
                  <span>{{ selectedItem.name }}</span>
                </div>
              </template>
              
              <div class="space-y-3 text-sm">
                <div>
                  <span class="text-gray-600 dark:text-gray-400">ID:</span>
                  <span class="ml-2 font-mono text-xs">{{ selectedItem.canvasId }}</span>
                </div>
                <div>
                  <span class="text-gray-600 dark:text-gray-400">类型:</span>
                  <span class="ml-2">{{ selectedItem.type }}</span>
                </div>
                <div>
                  <span class="text-gray-600 dark:text-gray-400">位置:</span>
                  <span class="ml-2">x: {{ selectedItem.x }}, y: {{ selectedItem.y }}</span>
                </div>
                <div>
                  <span class="text-gray-600 dark:text-gray-400">尺寸:</span>
                  <span class="ml-2">{{ selectedItem.width }} × {{ selectedItem.height }}</span>
                </div>
              </div>
            </NCard>
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
.component-item:hover {
  transform: translateY(-1px);
}

.canvas-item {
  user-select: none;
}

.drag-over {
  background-color: rgba(59, 130, 246, 0.05);
}

/* 拖拽时的样式 */
.component-item:active {
  transform: rotate(5deg) scale(0.95);
}
</style>

