/**
 * 编辑器桥梁 Composable
 * 连接 UI 操作与 noyau 引擎 API 的桥梁，确保单向数据流
 */

import { computed } from 'vue'
import { useIotCanvasStore } from '../../noyau'
import type { CreateNodeOptions, Position, Size, UpdateNodeOptions } from '../../noyau/types'
import { cardRegistry } from '../../cartes'

/**
 * 编辑器桥梁 Hook
 */
export function useEditorBridge() {
  const canvasStore = useIotCanvasStore()

  /**
   * 画布状态（只读）
   */
  const renderTree = computed(() => canvasStore.renderTree)
  const selectedNodes = computed(() => canvasStore.selectedNodes)
  const hasSelection = computed(() => canvasStore.hasSelection)
  const isMultiSelection = computed(() => canvasStore.isMultiSelection)
  const nodeCount = computed(() => canvasStore.nodeCount)
  const canUndo = computed(() => canvasStore.canUndo)
  const canRedo = computed(() => canvasStore.canRedo)
  const isDesignMode = computed(() => canvasStore.isDesignMode)
  const viewport = computed(() => canvasStore.viewport)

  /**
   * 添加卡片到画布
   */
  function addCard(type: string, position: Position) {
    const manifest = cardRegistry.get(type)

    if (!manifest) {
      console.error(`[EditorBridge] 未找到卡片类型: ${type}`)
      return
    }

    // 创建节点配置
    const options: CreateNodeOptions = {
      type,
      position,
      size: manifest.defaultLayout
        ? {
            width: manifest.defaultLayout.width,
            height: manifest.defaultLayout.height
          }
        : undefined,
      config: manifest.defaultConfig || {},
      data: {}
    }

    // 调用 store action
    canvasStore.addNode(options)
  }

  /**
   * 删除选中的节点
   */
  function deleteSelected() {
    if (!hasSelection.value) return

    const ids = canvasStore.selection.selectedIds
    canvasStore.removeNodes(ids)
  }

  /**
   * 更新节点
   */
  function updateNode(nodeId: string, updates: UpdateNodeOptions) {
    canvasStore.updateNode(nodeId, updates)
  }

  /**
   * 更新节点数据
   */
  function updateNodeData(nodeId: string, dataKey: string, value: any) {
    canvasStore.updateNodeData(nodeId, dataKey, value)
  }

  /**
   * 批量更新节点数据
   */
  function batchUpdateNodeData(nodeId: string, data: Record<string, any>) {
    canvasStore.batchUpdateNodeData(nodeId, data)
  }

  /**
   * 移动节点
   */
  function moveNode(nodeId: string, position: Position) {
    canvasStore.moveNode(nodeId, position)
  }

  /**
   * 调整节点大小
   */
  function resizeNode(nodeId: string, size: Size) {
    canvasStore.updateNode(nodeId, { size })
  }

  /**
   * 复制选中的节点
   */
  function duplicateSelected() {
    if (!hasSelection.value) return

    const ids = canvasStore.selection.selectedIds
    ids.forEach(id => {
      canvasStore.cloneNode(id)
    })
  }

  /**
   * 锁定/解锁节点
   */
  function toggleNodeLock(nodeId: string) {
    canvasStore.toggleNodeLock(nodeId)
  }

  /**
   * 显示/隐藏节点
   */
  function toggleNodeVisibility(nodeId: string) {
    canvasStore.toggleNodeVisibility(nodeId)
  }

  /**
   * 将节点移至最顶层
   */
  function bringToFront(nodeId: string) {
    canvasStore.bringNodeToFront(nodeId)
  }

  /**
   * 将节点移至最底层
   */
  function sendToBack(nodeId: string) {
    canvasStore.sendNodeToBack(nodeId)
  }

  /**
   * 选择操作
   */
  function selectNodes(ids: string[]) {
    canvasStore.selectNodes(ids)
  }

  function selectAll() {
    canvasStore.selectAll()
  }

  function clearSelection() {
    canvasStore.clearSelection()
  }

  /**
   * 视口操作
   */
  function panViewport(deltaX: number, deltaY: number) {
    canvasStore.panViewport(deltaX, deltaY)
  }

  function zoomViewport(scale: number, centerX?: number, centerY?: number) {
    canvasStore.zoomViewport(scale, centerX, centerY)
  }

  function resetViewport() {
    canvasStore.resetViewport()
  }

  /**
   * 历史记录操作
   */
  function undo() {
    canvasStore.undo()
  }

  function redo() {
    canvasStore.redo()
  }

  /**
   * 模式切换
   */
  function setMode(mode: 'design' | 'preview') {
    canvasStore.setMode(mode)
  }

  /**
   * 画布操作
   */
  function clearCanvas() {
    canvasStore.clearCanvas()
  }

  function loadCanvas(data: { nodes: any[]; config?: any }) {
    canvasStore.loadCanvas(data)
  }

  function exportCanvas() {
    return canvasStore.exportCanvas()
  }

  /**
   * 获取节点信息
   */
  function getNode(nodeId: string) {
    return canvasStore.nodes.find(n => n.id === nodeId)
  }

  return {
    // 状态
    renderTree,
    selectedNodes,
    hasSelection,
    isMultiSelection,
    nodeCount,
    canUndo,
    canRedo,
    isDesignMode,
    viewport,

    // 节点操作
    addCard,
    deleteSelected,
    updateNode,
    updateNodeData,
    batchUpdateNodeData,
    moveNode,
    resizeNode,
    duplicateSelected,
    toggleNodeLock,
    toggleNodeVisibility,
    bringToFront,
    sendToBack,

    // 选择操作
    selectNodes,
    selectAll,
    clearSelection,

    // 视口操作
    panViewport,
    zoomViewport,
    resetViewport,

    // 历史记录
    undo,
    redo,

    // 模式切换
    setMode,

    // 画布操作
    clearCanvas,
    loadCanvas,
    exportCanvas,

    // 查询
    getNode
  }
}
