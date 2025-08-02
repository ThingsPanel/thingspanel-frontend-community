/**
 * Canvas State Management
 * 基于Pinia的画布状态管理，作为所有渲染器的数据中心
 */

import { defineStore } from 'pinia'
import { ref, computed, reactive, readonly } from 'vue'
import { DEFAULT_CANVAS_CONFIG, DEFAULT_VIEWPORT } from '../types/core'
import type {
  CanvasState,
  BaseCanvasItem,
  Position,
  Size,
  Viewport,
  CanvasConfig,
  DragState,
  ClipboardData,
  HistoryState
} from '../types/core'

export const useCanvasStore = defineStore('panelv2-canvas', () => {
  // 基础状态
  const items = ref<BaseCanvasItem[]>([])
  const selectedIds = ref<string[]>([])
  const mode = ref<'edit' | 'preview'>('edit')

  // 视口状态
  const viewport = ref<Viewport>({ ...DEFAULT_VIEWPORT })

  // 画布配置
  const config = ref<CanvasConfig>({ ...DEFAULT_CANVAS_CONFIG })

  // 交互状态
  const dragState = ref<DragState | null>(null)
  const clipboard = ref<ClipboardData | null>(null)

  // 历史记录
  const history = reactive<HistoryState>({
    past: [],
    future: [],
    maxSize: 50
  })

  // UI状态
  const sidebarCollapsed = reactive({
    left: false,
    right: false
  })

  // 计算属性
  const selectedItems = computed(() => items.value.filter(item => selectedIds.value.includes(item.id)))

  const hasSelection = computed(() => selectedIds.value.length > 0)

  const canUndo = computed(() => history.past.length > 0)

  const canRedo = computed(() => history.future.length > 0)

  const isEditMode = computed(() => mode.value === 'edit')

  const canvasState = computed<CanvasState>(() => ({
    items: items.value,
    selectedIds: selectedIds.value,
    viewport: viewport.value,
    config: config.value,
    mode: mode.value,
    dragState: dragState.value,
    clipboard: clipboard.value,
    history: { ...history },
    sidebarCollapsed: { ...sidebarCollapsed }
  }))

  // 操作历史记录
  const saveToHistory = () => {
    history.past.push([...items.value])

    // 限制历史记录大小
    if (history.past.length > history.maxSize) {
      history.past.shift()
    }

    // 清空重做历史
    history.future.length = 0
  }

  // 项目管理操作
  const addItem = (item: BaseCanvasItem) => {
    saveToHistory()
    items.value.push(item)
    selectItems([item.id])
  }

  const addItems = (newItems: BaseCanvasItem[]) => {
    saveToHistory()
    items.value.push(...newItems)
    selectItems(newItems.map(item => item.id))
  }

  const removeItem = (id: string) => {
    saveToHistory()
    items.value = items.value.filter(item => item.id !== id)
    selectedIds.value = selectedIds.value.filter(selectedId => selectedId !== id)
  }

  const removeItems = (ids: string[]) => {
    saveToHistory()
    items.value = items.value.filter(item => !ids.includes(item.id))
    selectedIds.value = selectedIds.value.filter(selectedId => !ids.includes(selectedId))
  }

  const updateItem = (id: string, updates: Partial<BaseCanvasItem>) => {
    const itemIndex = items.value.findIndex(item => item.id === id)
    if (itemIndex !== -1) {
      saveToHistory()
      items.value[itemIndex] = {
        ...items.value[itemIndex],
        ...updates,
        metadata: {
          ...items.value[itemIndex].metadata,
          updatedAt: Date.now()
        }
      }
    }
  }

  const updateItems = (updates: Array<{ id: string; updates: Partial<BaseCanvasItem> }>) => {
    saveToHistory()
    updates.forEach(({ id, updates: itemUpdates }) => {
      const itemIndex = items.value.findIndex(item => item.id === id)
      if (itemIndex !== -1) {
        items.value[itemIndex] = {
          ...items.value[itemIndex],
          ...itemUpdates,
          metadata: {
            ...items.value[itemIndex].metadata,
            updatedAt: Date.now()
          }
        }
      }
    })
  }

  const moveItem = (id: string, position: Position) => {
    updateItem(id, { position })
  }

  const resizeItem = (id: string, size: Size) => {
    updateItem(id, { size })
  }

  const setItemZIndex = (id: string, zIndex: number) => {
    updateItem(id, { zIndex })
  }

  // 选择操作
  const selectItems = (ids: string[]) => {
    selectedIds.value = [...ids]
  }

  const selectAll = () => {
    selectedIds.value = items.value.map(item => item.id)
  }

  const clearSelection = () => {
    selectedIds.value = []
  }

  const toggleSelection = (id: string) => {
    if (selectedIds.value.includes(id)) {
      selectedIds.value = selectedIds.value.filter(selectedId => selectedId !== id)
    } else {
      selectedIds.value.push(id)
    }
  }

  // 剪贴板操作
  const copyItems = (ids?: string[]) => {
    const targetIds = ids || selectedIds.value
    const itemsToCopy = items.value.filter(item => targetIds.includes(item.id))
    clipboard.value = {
      items: itemsToCopy.map(item => ({
        ...item,
        id: `${item.id}_copy_${Date.now()}` // 生成新ID
      })),
      operation: 'copy',
      timestamp: Date.now()
    }
  }

  const cutItems = (ids?: string[]) => {
    const targetIds = ids || selectedIds.value
    const itemsToCut = items.value.filter(item => targetIds.includes(item.id))
    clipboard.value = {
      items: itemsToCut,
      operation: 'cut',
      timestamp: Date.now()
    }
    if (ids) {
      removeItems(ids)
    } else {
      removeItems(selectedIds.value)
    }
  }

  const pasteItems = (position?: Position) => {
    if (!clipboard.value) return

    const basePosition = position || { x: 0, y: 0 }
    const itemsToAdd = clipboard.value.items.map((item, index) => ({
      ...item,
      id: `${item.id}_${Date.now()}_${index}`,
      position: {
        x: basePosition.x + index * 20,
        y: basePosition.y + index * 20
      },
      metadata: {
        ...item.metadata,
        createdAt: Date.now(),
        updatedAt: Date.now()
      }
    }))

    addItems(itemsToAdd)
  }

  // 撤销重做操作
  const undo = () => {
    if (history.past.length === 0) return

    const current = [...items.value]
    const previous = history.past.pop()!

    history.future.push(current)
    items.value = previous
    clearSelection()
  }

  const redo = () => {
    if (history.future.length === 0) return

    const current = [...items.value]
    const next = history.future.pop()!

    history.past.push(current)
    items.value = next
    clearSelection()
  }

  // 视口操作
  const setViewport = (newViewport: Partial<Viewport>) => {
    viewport.value = { ...viewport.value, ...newViewport }
  }

  const zoomIn = () => {
    const newZoom = Math.min(viewport.value.zoom * 1.2, 5)
    setViewport({ zoom: newZoom })
  }

  const zoomOut = () => {
    const newZoom = Math.max(viewport.value.zoom / 1.2, 0.1)
    setViewport({ zoom: newZoom })
  }

  const resetZoom = () => {
    setViewport({ zoom: 1, offsetX: 0, offsetY: 0 })
  }

  // 配置操作
  const updateConfig = (newConfig: Partial<CanvasConfig>) => {
    config.value = { ...config.value, ...newConfig }
  }

  // 模式切换
  const setMode = (newMode: 'edit' | 'preview') => {
    mode.value = newMode
    if (newMode === 'preview') {
      clearSelection()
    }
  }

  // 拖拽状态管理
  const setDragState = (newDragState: DragState | null) => {
    dragState.value = newDragState
  }

  // 侧边栏状态
  const toggleLeftSidebar = () => {
    sidebarCollapsed.left = !sidebarCollapsed.left
  }

  const toggleRightSidebar = () => {
    sidebarCollapsed.right = !sidebarCollapsed.right
  }

  // 数据重置和加载
  const setItems = (newItems: BaseCanvasItem[]) => {
    items.value = [...newItems]
    clearSelection()
    // 重置历史记录
    history.past.length = 0
    history.future.length = 0
  }

  const setState = (newState: Partial<CanvasState>) => {
    if (newState.items) setItems(newState.items)
    if (newState.selectedIds) selectedIds.value = [...newState.selectedIds]
    if (newState.viewport) viewport.value = { ...newState.viewport }
    if (newState.config) config.value = { ...newState.config }
    if (newState.mode) mode.value = newState.mode
    if (newState.dragState !== undefined) dragState.value = newState.dragState
    if (newState.clipboard !== undefined) clipboard.value = newState.clipboard
    if (newState.sidebarCollapsed) {
      sidebarCollapsed.left = newState.sidebarCollapsed.left
      sidebarCollapsed.right = newState.sidebarCollapsed.right
    }
  }

  const reset = () => {
    items.value = []
    selectedIds.value = []
    mode.value = 'edit'
    viewport.value = { ...DEFAULT_VIEWPORT }
    config.value = { ...DEFAULT_CANVAS_CONFIG }
    dragState.value = null
    clipboard.value = null
    history.past.length = 0
    history.future.length = 0
    sidebarCollapsed.left = false
    sidebarCollapsed.right = false
  }

  // 工具函数
  const getItem = (id: string) => items.value.find(item => item.id === id)

  const getItemIndex = (id: string) => items.value.findIndex(item => item.id === id)

  const hasItem = (id: string) => items.value.some(item => item.id === id)

  return {
    // 状态
    items: readonly(items),
    selectedIds: readonly(selectedIds),
    mode: readonly(mode),
    viewport: readonly(viewport),
    config: readonly(config),
    dragState: readonly(dragState),
    clipboard: readonly(clipboard),
    sidebarCollapsed: readonly(sidebarCollapsed),

    // 计算属性
    selectedItems,
    hasSelection,
    canUndo,
    canRedo,
    isEditMode,
    canvasState,

    // 操作方法
    addItem,
    addItems,
    removeItem,
    removeItems,
    updateItem,
    updateItems,
    moveItem,
    resizeItem,
    setItemZIndex,

    selectItems,
    selectAll,
    clearSelection,
    toggleSelection,

    copyItems,
    cutItems,
    pasteItems,

    undo,
    redo,

    setViewport,
    zoomIn,
    zoomOut,
    resetZoom,

    updateConfig,
    setMode,
    setDragState,

    toggleLeftSidebar,
    toggleRightSidebar,

    setItems,
    setState,
    reset,

    getItem,
    getItemIndex,
    hasItem
  }
})
