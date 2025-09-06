<!--
  Grid Layout Plus 包装组件
  基于 grid-layout-plus 的企业级网格布局组件
  重构版本：模块化架构，提升可维护性和性能
-->
<template>
  <div
    class="grid-layout-plus-wrapper grid-background-base"
    :class="{
      readonly: readonly,
      'dark-theme': isDarkTheme,
      'show-grid': showGrid && !readonly
    }"
  >
    <!-- 网格核心组件 -->
    <GridCore
      ref="gridCoreRef"
      :layout="layout"
      :config="config"
      :readonly="readonly"
      :show-title="showTitle"
      @layout-created="handleLayoutCreated"
      @layout-before-mount="handleLayoutBeforeMount"
      @layout-mounted="handleLayoutMounted"
      @layout-updated="handleLayoutUpdated"
      @layout-ready="handleLayoutReady"
      @layout-change="handleLayoutChange"
      @breakpoint-changed="handleBreakpointChanged"
      @container-resized="handleContainerResized"
      @item-resize="handleItemResize"
      @item-resized="handleItemResized"
      @item-move="handleItemMove"
      @item-moved="handleItemMoved"
      @item-container-resized="handleItemContainerResized"
    >
      <template #default="{ item }">
        <slot :item="item">
          <!-- 默认内容会由 GridItemContent 处理 -->
        </slot>
      </template>
    </GridCore>

    <!-- 拖拽区域组件 -->
    <GridDropZone
      :readonly="readonly"
      :show-drop-zone="showDropZone"
      @drag-enter="handleDragEnter"
      @drag-over="handleDragOver"
      @drag-leave="handleDragLeave"
      @drop="handleDrop"
    />
  </div>
</template>

<script setup lang="ts">
/**
 * Grid Layout Plus 主组件 - 重构版本
 * 采用模块化架构，提升可维护性和性能
 */

import { ref, computed } from 'vue'
import { useThemeStore } from '@/store/modules/theme'
import { GridCore, GridDropZone } from './components'
import type {
  GridLayoutPlusConfig,
  GridLayoutPlusItem,
  GridLayoutPlusEmits,
  GridLayoutPlusProps
} from './gridLayoutPlusTypes'
import { EXTENDED_GRID_LAYOUT_CONFIG, GridSizePresets, DEFAULT_GRID_LAYOUT_PLUS_CONFIG } from './gridLayoutPlusTypes'
import { validateExtendedGridConfig, validateLargeGridPerformance, optimizeItemForLargeGrid } from './utils/validation'

// Props
interface Props extends GridLayoutPlusProps {
  /** 网格尺寸预设 */
  gridSize?: 'mini' | 'standard' | 'large' | 'mega' | 'extended' | 'custom'
  /** 自定义列数（当 gridSize 为 'custom' 时使用） */
  customColumns?: number
}

const props = withDefaults(defineProps<Props>(), {
  layout: () => [],
  readonly: false,
  showGrid: true,
  showDropZone: false,
  showTitle: false, // 默认不显示标题
  config: () => ({}),
  gridSize: 'standard', // 默认使用标准网格 (24列)
  customColumns: 50
})

// Emits
interface Emits extends GridLayoutPlusEmits {}

const emit = defineEmits<Emits>()

// Store
const themeStore = useThemeStore()

// 组件引用
const gridCoreRef = ref<InstanceType<typeof GridCore> | null>(null)

// Computed
const isDarkTheme = computed(() => themeStore.darkMode)

const config = computed<GridLayoutPlusConfig>(() => {
  // 根据 gridSize 选择基础配置
  let baseConfig: GridLayoutPlusConfig

  switch (props.gridSize) {
    case 'mini':
      baseConfig = {
        ...DEFAULT_GRID_LAYOUT_PLUS_CONFIG,
        ...GridSizePresets.MINI
      }
      break
    case 'standard':
      baseConfig = {
        ...DEFAULT_GRID_LAYOUT_PLUS_CONFIG,
        ...GridSizePresets.STANDARD
      }
      break
    case 'large':
      baseConfig = {
        ...DEFAULT_GRID_LAYOUT_PLUS_CONFIG,
        ...GridSizePresets.LARGE
      }
      break
    case 'mega':
      baseConfig = {
        ...EXTENDED_GRID_LAYOUT_CONFIG,
        ...GridSizePresets.MEGA
      }
      break
    case 'extended':
      baseConfig = { ...EXTENDED_GRID_LAYOUT_CONFIG }
      break
    case 'custom':
      baseConfig = {
        ...EXTENDED_GRID_LAYOUT_CONFIG,
        ...GridSizePresets.CUSTOM(props.customColumns || 50)
      }
      break
    default:
      baseConfig = { ...DEFAULT_GRID_LAYOUT_PLUS_CONFIG }
  }

  // 合并用户自定义配置
  return {
    ...baseConfig,
    ...props.config
  }
})

// 网格验证和性能监控
const gridValidation = computed(() => {
  const colNum = config.value.colNum

  // 验证扩展网格配置
  const configValidation = validateExtendedGridConfig(colNum)
  if (!configValidation.success) {
    console.warn('Grid configuration validation failed:', configValidation.message)
  }

  // 大网格性能验证
  const performanceCheck = validateLargeGridPerformance(props.layout, colNum)
  if (performanceCheck.success && (performanceCheck.data?.warning || performanceCheck.data?.recommendation)) {
    console.warn('Grid performance warning:', performanceCheck.data.warning)
    console.info('Grid performance recommendation:', performanceCheck.data.recommendation)
  }

  return {
    isValid: configValidation.success,
    colNum,
    performance: performanceCheck.data
  }
})

// 业务方法
const handleItemEdit = (item: GridLayoutPlusItem) => {
  emit('item-edit', item)
}

const handleItemDelete = (item: GridLayoutPlusItem) => {
  // 通过 GridCore 组件处理删除逻辑
  const coreLayout = gridCoreRef.value?.internalLayout
  if (coreLayout) {
    const index = coreLayout.findIndex(i => i.i === item.i)
    if (index > -1) {
      coreLayout.splice(index, 1)
      emit('item-delete', item.i)
    }
  }
}

const handleItemDataUpdate = (itemId: string, data: any) => {
  // 通过 GridCore 组件处理数据更新
  const coreLayout = gridCoreRef.value?.internalLayout
  if (coreLayout) {
    const item = coreLayout.find(i => i.i === itemId)
    if (item) {
      item.data = { ...item.data, ...data }
      emit('item-data-update', itemId, data)
    }
  }
}

// Grid Layout Plus 事件处理
const handleLayoutCreated = (newLayout: GridLayoutPlusItem[]) => {
  emit('layout-created', newLayout)
}

const handleLayoutBeforeMount = (newLayout: GridLayoutPlusItem[]) => {
  emit('layout-before-mount', newLayout)
}

const handleLayoutMounted = (newLayout: GridLayoutPlusItem[]) => {
  emit('layout-mounted', newLayout)
}

const handleLayoutUpdated = (newLayout: GridLayoutPlusItem[]) => {
  emit('layout-updated', newLayout)
}

const handleLayoutReady = (newLayout: GridLayoutPlusItem[]) => {
  emit('layout-ready', newLayout)
}

const handleLayoutChange = (newLayout: GridLayoutPlusItem[]) => {
  // 由 GridCore 组件处理布局变化，主组件只负责转发事件
  emit('layout-change', newLayout)
  emit('update:layout', newLayout)
}

const handleBreakpointChanged = (newBreakpoint: string, newLayout: GridLayoutPlusItem[]) => {
  emit('breakpoint-changed', newBreakpoint, newLayout)
}

const handleContainerResized = (width: number, height: number, cols: number) => {
  emit('container-resized', width, height, cols)
}

const handleItemResize = (i: string, newH: number, newW: number, newHPx: number, newWPx: number) => {
  emit('item-resize', i, newH, newW, newHPx, newWPx)
}

const handleItemResized = (i: string, newH: number, newW: number, newHPx: number, newWPx: number) => {
  emit('item-resized', i, newH, newW, newHPx, newWPx)
}

const handleItemMove = (i: string, newX: number, newY: number) => {
  emit('item-move', i, newX, newY)
}

const handleItemMoved = (i: string, newX: number, newY: number) => {
  emit('item-moved', i, newX, newY)
}

const handleItemContainerResized = (i: string, newH: number, newW: number, newHPx: number, newWPx: number) => {
  emit('item-container-resized', i, newH, newW, newHPx, newWPx)
}

// 拖拽事件处理 - 委托给 GridDropZone 组件
const handleDragEnter = (e: DragEvent) => {
  emit('drag-enter', e)
}

const handleDragOver = (e: DragEvent) => {
  emit('drag-over', e)
}

const handleDragLeave = (e: DragEvent) => {
  emit('drag-leave', e)
}

const handleDrop = (e: DragEvent) => {
  const componentType = e.dataTransfer?.getData('text/plain')
  if (componentType) {
    addItem(componentType)
  }
  emit('drop', e)
}

// API 方法 - 通过 GridCore 组件实现
const addItem = (type: string, options?: Partial<GridLayoutPlusItem>) => {
  const coreLayout = gridCoreRef.value?.internalLayout
  if (!coreLayout) return null

  const newItem: GridLayoutPlusItem = {
    i: generateId(),
    x: 0,
    y: 0,
    w: 2,
    h: 2,
    type,
    ...options
  }

  // 寻找合适的位置
  const position = findAvailablePosition(newItem.w, newItem.h)
  newItem.x = position.x
  newItem.y = position.y

  coreLayout.push(newItem)
  emit('item-add', newItem)
  return newItem
}

const removeItem = (itemId: string) => {
  const coreLayout = gridCoreRef.value?.internalLayout
  if (!coreLayout) return null

  const index = coreLayout.findIndex(item => item.i === itemId)
  if (index > -1) {
    const removedItem = coreLayout.splice(index, 1)[0]
    emit('item-delete', itemId)
    return removedItem
  }
  return null
}

const updateItem = (itemId: string, updates: Partial<GridLayoutPlusItem>) => {
  const coreLayout = gridCoreRef.value?.internalLayout
  if (!coreLayout) return null

  const item = coreLayout.find(i => i.i === itemId)
  if (item) {
    Object.assign(item, updates)
    emit('item-update', itemId, updates)
    return item
  }
  return null
}

const clearLayout = () => {
  const coreLayout = gridCoreRef.value?.internalLayout
  if (coreLayout) {
    coreLayout.splice(0)
    emit('layout-change', [])
    emit('update:layout', [])
  }
}

const getItem = (itemId: string) => {
  return gridCoreRef.value?.internalLayout?.find(item => item.i === itemId) || null
}

const getAllItems = () => {
  return gridCoreRef.value?.internalLayout ? [...gridCoreRef.value.internalLayout] : []
}

// 工具函数
const generateId = (): string => {
  return `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

const findAvailablePosition = (w: number, h: number): { x: number; y: number } => {
  const colNum = config.value.colNum
  const layout = gridCoreRef.value?.internalLayout || []

  // 简化的位置查找算法
  for (let y = 0; y < 100; y++) {
    for (let x = 0; x <= colNum - w; x++) {
      const proposed = { x, y, w, h }

      // 检查是否与现有项目冲突
      const hasCollision = layout.some(item => {
        return !(
          proposed.x + proposed.w <= item.x ||
          proposed.x >= item.x + item.w ||
          proposed.y + proposed.h <= item.y ||
          proposed.y >= item.y + item.h
        )
      })

      if (!hasCollision) {
        return { x, y }
      }
    }
  }

  return { x: 0, y: 0 }
}

// 🔥 新增：网格优化方法
const optimizeLayoutForGridSize = (targetCols?: number, sourceCols?: number) => {
  const coreLayout = gridCoreRef.value?.internalLayout
  if (!coreLayout) return

  const targetColumns = targetCols || config.value.colNum
  const sourceColumns = sourceCols || 12 // 默认从12列优化

  // 优化每个网格项
  coreLayout.forEach(item => {
    const optimized = optimizeItemForLargeGrid(item, targetColumns, sourceColumns)
    Object.assign(item, optimized)
  })

  emit('layout-change', [...coreLayout])
  emit('update:layout', [...coreLayout])
}

// 布局数据监听已移至 GridCore 组件处理

// 暴露 API 方法给父组件
defineExpose({
  addItem,
  removeItem,
  updateItem,
  clearLayout,
  getItem,
  getAllItems,
  getLayout: () => gridCoreRef.value?.internalLayout || [],
  // 🔥 新增：网格扩展相关API
  getGridInfo: () => ({
    colNum: config.value.colNum,
    gridSize: props.gridSize,
    validation: gridValidation.value
  }),
  optimizeLayoutForGridSize,
  getGridValidation: () => gridValidation.value,
  // 暴露子组件引用以便高级操作
  gridCore: gridCoreRef
})
</script>

<style scoped>
.grid-layout-plus-wrapper {
  position: relative;
  width: 100%;
  /* 移除 height: 100% 以允许内容撑开高度 */
}

/* 网格项内容 */
.grid-item-content {
  height: 100%;
  /* 🔧 移除默认样式，避免与NodeWrapper base配置冲突 */
  background: transparent;
  border: none;
  border-radius: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  /* 🔧 移除默认阴影和过渡，由内部组件控制 */
  transition: none;
}

.dark-theme .grid-item-content {
  /* 🔧 移除暗主题默认样式，避免与NodeWrapper配置冲突 */
  background: transparent;
  border-color: transparent;
  color: inherit;
}

.grid-item-content:hover {
  /* 🔧 移除hover效果，避免与NodeWrapper配置冲突 */
  /* box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15); */
  /* transform: translateY(-1px); */
}

/* 项目头部 */
.grid-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #f8f9fa;
  border-bottom: 1px solid #e1e5e9;
  font-size: 14px;
  font-weight: 500;
}

.dark-theme .grid-item-header {
  background: #3a3a3a;
  border-bottom-color: #404040;
}

.grid-item-title {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.grid-item-actions {
  display: flex;
  gap: 4px;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: #6c757d;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-btn:hover {
  background: #e9ecef;
  color: #495057;
}

.dark-theme .action-btn:hover {
  background: #4a4a4a;
  color: white;
}

.delete-btn:hover {
  background: #dc3545;
  color: white;
}

/* 项目内容 */
.grid-item-body {
  flex: 1;
  padding: 0; /* 🔧 移除默认内边距，由内部组件控制 */
  overflow: visible; /* 移除 overflow: auto，让内容自然溢出 */
  /* 🔧 移除默认背景，避免与NodeWrapper配置冲突 */
  background: transparent;
  /* 🔧 确保内部组件样式能够正常显示 */
  border: none;
  border-radius: inherit;
}

.default-item-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #6c757d;
  text-align: center;
}

.item-type {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 4px;
}

.item-id {
  font-size: 12px;
  opacity: 0.7;
}

/* 拖拽区域 */
.drop-zone {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border: 2px dashed #ddd;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.9);
  opacity: 0;
  pointer-events: none;
  transition: all 0.3s ease;
  z-index: 1000;
}

.drop-zone.dragging {
  opacity: 1;
  pointer-events: auto;
  border-color: #007bff;
  background: rgba(0, 123, 255, 0.1);
}

.drop-hint {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: #007bff;
  font-size: 16px;
  font-weight: 500;
}

.dark-theme .drop-zone {
  background: rgba(26, 26, 26, 0.9);
  border-color: #404040;
}

.dark-theme .drop-zone.dragging {
  border-color: #4dabf7;
  background: rgba(77, 171, 247, 0.1);
}

.dark-theme .drop-hint {
  color: #4dabf7;
}

/* 只读模式 */
.readonly .grid-item-header {
  display: none;
}

.readonly .grid-item-body {
  padding: 0;
}

/* 响应式 */
@media (max-width: 768px) {
  .grid-item-header {
    padding: 6px 8px;
    font-size: 12px;
  }

  .grid-item-body {
    padding: 8px;
  }

  .action-btn {
    width: 20px;
    height: 20px;
  }
}
</style>
