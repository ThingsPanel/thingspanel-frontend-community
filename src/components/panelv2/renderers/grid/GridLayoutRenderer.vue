<template>
  <div class="grid-layout-renderer" :class="{ 'edit-mode': mode === 'edit', 'preview-mode': mode === 'preview' }">
    <!-- 错误状态显示 -->
    <div v-if="rendererError" class="error-panel">
      <div class="error-content">
        <h3>渲染器错误</h3>
        <p>{{ rendererError }}</p>
        <button @click="retryInitialize" class="retry-btn">重试</button>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-spinner"></div>
      <div class="loading-text">初始化网格布局...</div>
    </div>

    <!-- Vue Grid Layout 组件 -->
    <GridLayout
      v-if="!rendererError && !isLoading"
      v-model:layout="layoutItems"
      :col-num="gridConfig.columns"
      :row-height="gridConfig.rowHeight"
      :is-draggable="mode === 'edit'"
      :is-resizable="mode === 'edit'"
      :is-mirrored="false"
      :vertical-compact="true"
      :margin="[gridConfig.gap, gridConfig.gap]"
      :use-css-transforms="true"
      :responsive="false"
      @layout-updated="handleLayoutUpdate"
      @layout-ready="handleLayoutReady"
    >
      <GridItem
        v-for="item in layoutItems"
        :key="item.i"
        :x="item.x"
        :y="item.y"
        :w="item.w"
        :h="item.h"
        :i="item.i"
        :is-draggable="mode === 'edit'"
        :is-resizable="mode === 'edit'"
        :min-w="item.minW || 1"
        :min-h="item.minH || 1"
        :max-w="item.maxW"
        :max-h="item.maxH"
        @resize="handleItemResize"
        @move="handleItemMove"
      >
        <div 
          class="grid-item-content"
          :class="{ 
            'selected': selectedIds.includes(item.i),
            'edit-mode': mode === 'edit'
          }"
          @click="handleItemClick(item.i, $event)"
        >
          <!-- 项目标题栏 -->
          <div class="item-header">
            <span class="item-title">{{ item.data?.title || item.data?.cardId || `项目 ${item.i}` }}</span>
            <div v-if="mode === 'edit'" class="item-actions">
              <button @click.stop="removeItem(item.i)" class="remove-btn">×</button>
            </div>
          </div>
          
          <!-- 项目内容区域 -->
          <div class="item-body">
            <div class="item-type">{{ item.data?.type || 'unknown' }}</div>
            <div class="item-id">ID: {{ item.i }}</div>
            <div v-if="item.data?.cardId" class="item-card-id">Card: {{ item.data.cardId }}</div>
          </div>
        </div>
      </GridItem>
    </GridLayout>

    <!-- 底部状态栏 -->
    <div v-if="!rendererError" class="status-bar">
      <div class="status-item">
        <span class="status-label">状态:</span>
        <span class="status-value" :class="{ 'loading': isLoading, 'ready': !isLoading }">
          {{ isLoading ? '加载中' : '就绪' }}
        </span>
      </div>
      <div class="status-item">
        <span class="status-label">模式:</span>
        <span class="status-value">{{ mode === 'edit' ? '编辑' : '预览' }}</span>
      </div>
      <div class="status-item">
        <span class="status-label">项目:</span>
        <span class="status-value">{{ layoutItems.length }}</span>
      </div>
      <div class="status-item">
        <span class="status-label">选中:</span>
        <span class="status-value">{{ selectedIds.length }}</span>
      </div>
      <div class="status-item">
        <span class="status-label">网格:</span>
        <span class="status-value">{{ gridConfig.columns }}列 × {{ gridConfig.rowHeight }}px</span>
      </div>
      <div class="status-item">
        <span class="status-label">版本:</span>
        <span class="status-value">GridLayout v2.0.0</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { GridLayout, GridItem } from 'vue-grid-layout'
import type { BaseItem, RenderMode } from '../base/types'
import type { GridConfig } from './types'
import { GridAdapter, type ExternalPanelData } from '../adapters/GridAdapter'

// Props定义
interface Props {
  items: BaseItem[]
  mode: RenderMode
  selectedIds: string[]
  config?: Partial<GridConfig>
  externalData?: ExternalPanelData | null
}

const props = withDefaults(defineProps<Props>(), {
  items: () => [],
  mode: 'edit',
  selectedIds: () => [],
  config: () => ({}),
  externalData: null
})

// 事件定义
interface Emits {
  'item-select': [itemId: string, selected: boolean]
  'item-update': [id: string, updates: any]
  'item-add': [item: BaseItem]
  'item-remove': [id: string]
  'config-change': [config: GridConfig]
}

const emit = defineEmits<Emits>()

// 默认网格配置
const defaultGridConfig: GridConfig = {
  columns: 12,
  rowHeight: 60,
  gap: 8,
  showGrid: true,
  enableSnap: true,
  snapThreshold: 10,
  minItemWidth: 100,
  minItemHeight: 60,
  padding: 16
}

// 响应式状态
const isLoading = ref(false)
const rendererError = ref<string | null>(null)
const layoutItems = ref<any[]>([])

// 计算属性
const gridConfig = computed(() => ({
  ...defaultGridConfig,
  ...props.config
}))

// 数据转换和合并
const processItems = () => {
  try {
    // 优先使用外部数据，如果没有再使用props.items
    if (props.externalData) {
      // 直接使用新的转换方法
      layoutItems.value = GridAdapter.convertPanelToVueGridLayout(props.externalData)
      console.log('GridLayoutRenderer: 从外部数据转换了', layoutItems.value.length, '个项目')
    } else if (props.items && props.items.length > 0) {
      // 转换props.items为vue-grid-layout格式
      layoutItems.value = props.items.map(item => {
        // 如果是GridItem，使用gridPosition
        if ('gridPosition' in item) {
          const gridItem = item as any
          return {
            i: item.id,
            x: gridItem.gridPosition.col,
            y: gridItem.gridPosition.row,
            w: gridItem.gridPosition.colSpan,
            h: gridItem.gridPosition.rowSpan,
            minW: gridItem.constraints?.minWidth || 1,
            minH: gridItem.constraints?.minHeight || 1,
            maxW: gridItem.constraints?.maxWidth,
            maxH: gridItem.constraints?.maxHeight,
            data: item.data || {},
            static: item.locked || false
          }
        } else {
          // 普通BaseItem，转换像素位置为网格位置
          const col = Math.round(item.position.x / (gridConfig.value.rowHeight + gridConfig.value.gap))
          const row = Math.round(item.position.y / (gridConfig.value.rowHeight + gridConfig.value.gap))
          const colSpan = Math.max(1, Math.round(item.size.width / (gridConfig.value.rowHeight + gridConfig.value.gap)))
          const rowSpan = Math.max(1, Math.round(item.size.height / (gridConfig.value.rowHeight + gridConfig.value.gap)))
          
          return {
            i: item.id,
            x: Math.max(0, Math.min(col, gridConfig.value.columns - colSpan)),
            y: Math.max(0, row),
            w: Math.min(colSpan, gridConfig.value.columns - col),
            h: rowSpan,
            minW: 1,
            minH: 1,
            data: item.data || {},
            static: item.locked || false
          }
        }
      })
    } else {
      layoutItems.value = []
    }
  } catch (error) {
    console.error('Error processing items:', error)
    rendererError.value = error instanceof Error ? error.message : '数据处理失败'
  }
}

// 初始化
const initializeRenderer = async () => {
  try {
    isLoading.value = true
    rendererError.value = null
    
    await nextTick()
    processItems()
    
    console.log('GridLayoutRenderer initialized with', layoutItems.value.length, 'items')
  } catch (error) {
    console.error('Failed to initialize grid layout renderer:', error)
    rendererError.value = error instanceof Error ? error.message : '初始化失败'
  } finally {
    isLoading.value = false
  }
}

// 重试初始化
const retryInitialize = () => {
  rendererError.value = null
  initializeRenderer()
}

// 事件处理
const handleLayoutUpdate = (newLayout: any[]) => {
  console.log('Layout updated:', newLayout)
  
  // 更新内部状态
  layoutItems.value = newLayout
  
  // 将变化通知给父组件
  newLayout.forEach(item => {
    emit('item-update', item.i, {
      position: {
        x: item.x * (gridConfig.value.rowHeight + gridConfig.value.gap),
        y: item.y * (gridConfig.value.rowHeight + gridConfig.value.gap)
      },
      size: {
        width: item.w * (gridConfig.value.rowHeight + gridConfig.value.gap),
        height: item.h * (gridConfig.value.rowHeight + gridConfig.value.gap)
      }
    })
  })
}

const handleLayoutReady = () => {
  console.log('Grid layout ready')
}

const handleItemResize = (i: string, h: number, w: number, hPx: number, wPx: number) => {
  console.log('Item resized:', i, { h, w, hPx, wPx })
}

const handleItemMove = (i: string, x: number, y: number) => {
  console.log('Item moved:', i, { x, y })
}

const handleItemClick = (itemId: string, event: MouseEvent) => {
  if (event.ctrlKey || event.metaKey) {
    // 多选 - 切换项目选择状态
    const isSelected = props.selectedIds.includes(itemId)
    emit('item-select', itemId, !isSelected)
  } else {
    // 单选 - 如果未选中则选中，如果已选中则取消选中
    const isSelected = props.selectedIds.includes(itemId)
    if (!isSelected) {
      // 清空之前的选择，只选中当前项目
      props.selectedIds.forEach(id => {
        if (id !== itemId) {
          emit('item-select', id, false)
        }
      })
      emit('item-select', itemId, true)
    }
  }
}

const removeItem = (itemId: string) => {
  emit('item-remove', itemId)
}

// 监听器
watch(() => props.items, () => {
  processItems()
}, { deep: true })

watch(() => props.externalData, () => {
  initializeRenderer()
}, { deep: true })

watch(() => props.config, () => {
  processItems()
}, { deep: true })

// 生命周期
onMounted(() => {
  initializeRenderer()
})
</script>

<style scoped>
.grid-layout-renderer {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
  position: relative;
}

.grid-layout-renderer.edit-mode {
  border: 2px dashed #1890ff;
}

.grid-layout-renderer.preview-mode {
  border: 1px solid #d9d9d9;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #1890ff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 12px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-text {
  color: #666;
  font-size: 14px;
}

.error-panel {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff2f0;
  border: 1px solid #ffccc7;
}

.error-content {
  text-align: center;
  padding: 24px;
}

.error-content h3 {
  color: #ff4d4f;
  margin: 0 0 12px 0;
  font-size: 16px;
}

.error-content p {
  color: #666;
  margin: 0 0 16px 0;
  font-size: 14px;
}

.retry-btn {
  background: #1890ff;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.retry-btn:hover {
  background: #40a9ff;
}

/* Grid Item 样式 */
.grid-item-content {
  width: 100%;
  height: 100%;
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 4px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  cursor: pointer;
  transition: all 0.2s ease;
}

.grid-item-content:hover {
  border-color: #1890ff;
  box-shadow: 0 2px 8px rgba(24, 144, 255, 0.15);
}

.grid-item-content.selected {
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

.grid-item-content.edit-mode {
  cursor: move;
}

.item-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: #fafafa;
  border-bottom: 1px solid #eee;
  font-size: 12px;
}

.item-title {
  font-weight: bold;
  color: #333;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-actions {
  display: flex;
  gap: 4px;
}

.remove-btn {
  width: 16px;
  height: 16px;
  border: none;
  background: #ff4d4f;
  color: white;
  border-radius: 2px;
  cursor: pointer;
  font-size: 12px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.remove-btn:hover {
  background: #ff7875;
}

.item-body {
  flex: 1;
  padding: 12px;
  font-size: 12px;
  color: #666;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.item-type {
  font-weight: 500;
  color: #333;
}

.item-id, .item-card-id {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 11px;
  color: #999;
}

.status-bar {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 8px 16px;
  background: #fafafa;
  border-top: 1px solid #d9d9d9;
  font-size: 12px;
  flex-wrap: wrap;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.status-label {
  color: #666;
  font-weight: 500;
}

.status-value {
  color: #333;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
}

.status-value.loading {
  color: #1890ff;
}

.status-value.ready {
  color: #52c41a;
}

/* Vue Grid Layout 覆盖样式 */
:deep(.vue-grid-layout) {
  background: #fff;
  min-height: 400px;
}

:deep(.vue-grid-item) {
  touch-action: none;
}

:deep(.vue-grid-item.no-touch) {
  touch-action: none;
}

:deep(.vue-grid-item.cssTransforms) {
  transition-property: transform;
  transition-duration: 200ms;
}

:deep(.vue-grid-item.resizing) {
  opacity: 0.6;
}

:deep(.vue-grid-item.vue-draggable-dragging) {
  transition: none;
  z-index: 3;
  opacity: 0.8;
}

:deep(.vue-grid-item > .vue-resizable-handle) {
  position: absolute;
  width: 20px;
  height: 20px;
  bottom: 0;
  right: 0;
  background: url('data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBzdGFuZGFsb25lPSJubyI/Pg08IS0tIEdlbmVyYXRvcjogQWRvYmUgRmlyZXdvcmtzIENTNiwgRXhwb3J0IFNWRyBFeHRlbnNpb24gYnkgQWFyb24gQmVhbGwgKGh0dHA6Ly9maXJld29ya3MuYWJlYWxsLmNvbSkgLiBWZXJzaW9uOiAwLjYuMSAgLS0+DTwhRE9DVFlQRSBzdmcgUFVCTElDICItLy9XM0MvL0RURCBTVkcgMS4xLy9FTiIgImh0dHA6Ly93d3cudzMub3JnL0dyYXBoaWNzL1NWRy8xLjEvRFREL3N2ZzExLmR0ZCI+DTxzdmcgaWQ9IlVudGl0bGVkLVBhZ2UlMjAxIiB2aWV3Qm94PSIwIDAgNiA2IiBzdHlsZT0iYmFja2dyb3VuZC1jb2xvcjojZmZmZmZmMDAiIHZlcnNpb249IjEuMSINCXhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHhtbDpzcGFjZT0icHJlc2VydmUiDQl4PSIwcHgiIHk9IjBweCIgd2lkdGg9IjZweCIgaGVpZ2h0PSI2cHgiDT4NCTxnIG9wYWNpdHk9IjAuMzAyIj4NCQk8cGF0aCBkPSJNIDYsNiBMIDAsNiBMIDAsNC4yIEwgNCw0LjIgTCA0LDQuOCBMIDAsNC44IEwgMCwzLjYgTCAzLjIsNCAMCwyIEwgMCwwIEwgNiwwIEwgNiw2IEwgNiw2IFoiIGZpbGw9IiMwMDAwMDAiLz4NCQk8L2c+DTwvc3ZnPg==');
  background-position: bottom right;
  padding: 0 3px 3px 0;
  background-repeat: no-repeat;
  background-origin: content-box;
  box-sizing: border-box;
  cursor: se-resize;
}
</style>