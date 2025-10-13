/**
 * 画布核心状态管理 (Pinia Store)
 * 管理渲染树的唯一真理源，遵循单向数据流
 */

import { defineStore } from 'pinia'
import type {
  CanvasState,
  ICanvasNode,
  CreateNodeOptions,
  UpdateNodeOptions,
  Position,
  Viewport,
  CanvasConfig,
  HistoryRecord
} from '../types'
import * as actions from './canvas.actions'
import * as selectors from './canvas.selectors'

/**
 * 画布初始状态
 */
const createInitialState = (): CanvasState => ({
  nodes: [],
  viewport: {
    x: 0,
    y: 0,
    zoom: 1
  },
  config: {
    width: 1920,
    height: 1080,
    backgroundColor: '#f5f5f5',
    showGrid: true,
    gridSize: 10,
    snapToGrid: true
  },
  selection: {
    selectedIds: [],
    hoveredId: null,
    multiSelect: false
  },
  history: {
    past: [],
    future: []
  },
  mode: 'design'
})

/**
 * IOT 可视化画布 Store
 */
export const useIotCanvasStore = defineStore('iot-visualization-canvas', {
  state: createInitialState,

  getters: {
    /**
     * 获取渲染树（用于渲染器消费）
     */
    renderTree: (state): ICanvasNode[] => state.nodes,

    /**
     * 获取选中的节点
     */
    selectedNodes: (state): ICanvasNode[] => {
      return selectors.selectNodesByIds(state.nodes, state.selection.selectedIds)
    },

    /**
     * 获取可见节点
     */
    visibleNodes: (state): ICanvasNode[] => {
      return selectors.selectVisibleNodes(state.nodes)
    },

    /**
     * 获取可编辑节点（可见且未锁定）
     */
    editableNodes: (state): ICanvasNode[] => {
      return selectors.selectEditableNodes(state.nodes)
    },

    /**
     * 获取选中节点的边界框
     */
    selectionBounds: (state) => {
      return selectors.selectSelectionBoundingBox(state.nodes, state.selection.selectedIds)
    },

    /**
     * 是否有选中的节点
     */
    hasSelection: (state): boolean => {
      return selectors.hasSelection(state.selection.selectedIds)
    },

    /**
     * 是否为多选
     */
    isMultiSelection: (state): boolean => {
      return selectors.isMultiSelection(state.selection.selectedIds)
    },

    /**
     * 获取节点总数
     */
    nodeCount: (state): number => {
      return selectors.selectNodeCount(state.nodes)
    },

    /**
     * 获取按类型分组的节点数量
     */
    nodeCountByType: (state): Record<string, number> => {
      return selectors.selectNodeCountByType(state.nodes)
    },

    /**
     * 是否可以撤销
     */
    canUndo: (state): boolean => {
      return state.history.past.length > 0
    },

    /**
     * 是否可以重做
     */
    canRedo: (state): boolean => {
      return state.history.future.length > 0
    },

    /**
     * 是否为设计模式
     */
    isDesignMode: (state): boolean => {
      return state.mode === 'design'
    },

    /**
     * 是否为预览模式
     */
    isPreviewMode: (state): boolean => {
      return state.mode === 'preview'
    }
  },

  actions: {
    // ==================== 节点操作 ====================

    /**
     * 添加节点
     */
    addNode(options: CreateNodeOptions) {
      const newNode = actions.createNode(options)
      this.nodes.push(newNode)
      this.selectNodes([newNode.id])

      // 记录历史
      this._recordHistory({
        type: 'add',
        timestamp: Date.now(),
        before: null,
        after: newNode
      })
    },

    /**
     * 批量添加节点
     */
    addNodes(nodeOptions: CreateNodeOptions[]) {
      const newNodes = nodeOptions.map(options => actions.createNode(options))
      this.nodes.push(...newNodes)
      this.selectNodes(newNodes.map(n => n.id))

      // 记录历史
      this._recordHistory({
        type: 'add',
        timestamp: Date.now(),
        before: null,
        after: newNodes
      })
    },

    /**
     * 删除节点
     */
    removeNode(id: string) {
      const node = actions.findNodeById(this.nodes, id)
      if (!node) return

      this.nodes = actions.removeNodeById(this.nodes, id)
      this._removeNodeFromSelection(id)

      // 记录历史
      this._recordHistory({
        type: 'remove',
        timestamp: Date.now(),
        before: node,
        after: null
      })
    },

    /**
     * 批量删除节点
     */
    removeNodes(ids: string[]) {
      const removedNodes = selectors.selectNodesByIds(this.nodes, ids)
      this.nodes = actions.removeNodesByIds(this.nodes, ids)
      ids.forEach(id => this._removeNodeFromSelection(id))

      // 记录历史
      this._recordHistory({
        type: 'remove',
        timestamp: Date.now(),
        before: removedNodes,
        after: null
      })
    },

    /**
     * 更新节点
     */
    updateNode(id: string, updates: UpdateNodeOptions) {
      const node = actions.findNodeById(this.nodes, id)
      if (!node) return

      const updatedNode = actions.updateNode(node, updates)
      this.nodes = actions.replaceNode(this.nodes, updatedNode)

      // 记录历史
      this._recordHistory({
        type: 'update',
        timestamp: Date.now(),
        before: node,
        after: updatedNode
      })
    },

    /**
     * 批量更新节点
     */
    updateNodes(updates: Array<{ id: string; updates: UpdateNodeOptions }>) {
      const beforeNodes: ICanvasNode[] = []
      const afterNodes: ICanvasNode[] = []

      updates.forEach(({ id, updates: nodeUpdates }) => {
        const node = actions.findNodeById(this.nodes, id)
        if (!node) return

        beforeNodes.push(node)
        const updatedNode = actions.updateNode(node, nodeUpdates)
        afterNodes.push(updatedNode)
        this.nodes = actions.replaceNode(this.nodes, updatedNode)
      })

      // 记录历史
      if (beforeNodes.length > 0) {
        this._recordHistory({
          type: 'update',
          timestamp: Date.now(),
          before: beforeNodes,
          after: afterNodes
        })
      }
    },

    /**
     * 移动节点
     */
    moveNode(id: string, position: Position) {
      const node = actions.findNodeById(this.nodes, id)
      if (!node) return

      const updatedNode = actions.moveNode(node, position)
      this.nodes = actions.replaceNode(this.nodes, updatedNode)
    },

    /**
     * 更新节点数据
     */
    updateNodeData(id: string, dataKey: string, value: any) {
      const node = actions.findNodeById(this.nodes, id)
      if (!node) return

      const updatedNode = actions.updateNodeData(node, dataKey, value)
      this.nodes = actions.replaceNode(this.nodes, updatedNode)
    },

    /**
     * 批量更新节点数据
     */
    batchUpdateNodeData(id: string, data: Record<string, any>) {
      const node = actions.findNodeById(this.nodes, id)
      if (!node) return

      const updatedNode = actions.batchUpdateNodeData(node, data)
      this.nodes = actions.replaceNode(this.nodes, updatedNode)
    },

    /**
     * 克隆节点
     */
    cloneNode(id: string, positionOffset?: Position) {
      const node = actions.findNodeById(this.nodes, id)
      if (!node) return

      const clonedNode = actions.cloneNode(node, positionOffset)
      this.nodes.push(clonedNode)
      this.selectNodes([clonedNode.id])

      // 记录历史
      this._recordHistory({
        type: 'add',
        timestamp: Date.now(),
        before: null,
        after: clonedNode
      })
    },

    /**
     * 锁定/解锁节点
     */
    toggleNodeLock(id: string) {
      const node = actions.findNodeById(this.nodes, id)
      if (!node) return

      const updatedNode = actions.toggleNodeLock(node)
      this.nodes = actions.replaceNode(this.nodes, updatedNode)
    },

    /**
     * 显示/隐藏节点
     */
    toggleNodeVisibility(id: string) {
      const node = actions.findNodeById(this.nodes, id)
      if (!node) return

      const updatedNode = actions.toggleNodeVisibility(node)
      this.nodes = actions.replaceNode(this.nodes, updatedNode)
    },

    /**
     * 将节点移至最顶层
     */
    bringNodeToFront(id: string) {
      this.nodes = actions.bringNodeToFront(this.nodes, id)
    },

    /**
     * 将节点移至最底层
     */
    sendNodeToBack(id: string) {
      this.nodes = actions.sendNodeToBack(this.nodes, id)
    },

    // ==================== 选择操作 ====================

    /**
     * 选中节点
     */
    selectNodes(ids: string[]) {
      this.selection.selectedIds = ids
    },

    /**
     * 添加到选中列表
     */
    addToSelection(ids: string[]) {
      const newIds = ids.filter(id => !this.selection.selectedIds.includes(id))
      this.selection.selectedIds.push(...newIds)
    },

    /**
     * 从选中列表移除
     */
    removeFromSelection(ids: string[]) {
      const idSet = new Set(ids)
      this.selection.selectedIds = this.selection.selectedIds.filter(id => !idSet.has(id))
    },

    /**
     * 清空选择
     */
    clearSelection() {
      this.selection.selectedIds = []
    },

    /**
     * 全选
     */
    selectAll() {
      this.selection.selectedIds = this.nodes.map(node => node.id)
    },

    /**
     * 设置悬停节点
     */
    setHoveredNode(id: string | null) {
      this.selection.hoveredId = id
    },

    // ==================== 视口操作 ====================

    /**
     * 平移视口
     */
    panViewport(deltaX: number, deltaY: number) {
      this.viewport = actions.panViewport(this.viewport, deltaX, deltaY)
    },

    /**
     * 缩放视口
     */
    zoomViewport(scale: number, centerX?: number, centerY?: number) {
      this.viewport = actions.zoomViewport(this.viewport, scale, centerX, centerY)
    },

    /**
     * 重置视口
     */
    resetViewport() {
      this.viewport = actions.resetViewport()
    },

    /**
     * 设置视口
     */
    setViewport(viewport: Viewport) {
      this.viewport = viewport
    },

    // ==================== 画布配置 ====================

    /**
     * 更新画布配置
     */
    updateConfig(config: Partial<CanvasConfig>) {
      this.config = { ...this.config, ...config }
    },

    // ==================== 模式切换 ====================

    /**
     * 设置编辑模式
     */
    setMode(mode: 'design' | 'preview') {
      this.mode = mode
      if (mode === 'preview') {
        this.clearSelection()
      }
    },

    // ==================== 历史记录 ====================

    /**
     * 撤销
     */
    undo() {
      if (!this.canUndo) return

      const record = this.history.past.pop()
      if (!record) return

      this.history.future.push(this._createReverseRecord(record))
      this._applyHistoryRecord(record, 'undo')
    },

    /**
     * 重做
     */
    redo() {
      if (!this.canRedo) return

      const record = this.history.future.pop()
      if (!record) return

      this.history.past.push(this._createReverseRecord(record))
      this._applyHistoryRecord(record, 'redo')
    },

    /**
     * 清空历史记录
     */
    clearHistory() {
      this.history.past = []
      this.history.future = []
    },

    // ==================== 整体操作 ====================

    /**
     * 加载画布数据
     */
    loadCanvas(data: { nodes: ICanvasNode[]; config?: Partial<CanvasConfig> }) {
      this.nodes = data.nodes
      if (data.config) {
        this.config = { ...this.config, ...data.config }
      }
      this.clearSelection()
      this.clearHistory()
    },

    /**
     * 导出画布数据
     */
    exportCanvas() {
      return {
        nodes: this.nodes,
        config: this.config,
        version: '1.0.0',
        exportTime: Date.now()
      }
    },

    /**
     * 清空画布
     */
    clearCanvas() {
      this.nodes = []
      this.clearSelection()
      this.clearHistory()
      this.resetViewport()
    },

    /**
     * 重置画布（恢复初始状态）
     */
    resetCanvas() {
      Object.assign(this, createInitialState())
    },

    // ==================== 私有方法 ====================

    /**
     * 记录历史
     */
    _recordHistory(record: HistoryRecord) {
      this.history.past.push(record)
      this.history.future = [] // 清空 redo 栈

      // 限制历史记录数量
      const MAX_HISTORY = 50
      if (this.history.past.length > MAX_HISTORY) {
        this.history.past.shift()
      }
    },

    /**
     * 应用历史记录
     */
    _applyHistoryRecord(record: HistoryRecord, direction: 'undo' | 'redo') {
      const target = direction === 'undo' ? record.before : record.after

      switch (record.type) {
        case 'add':
          if (direction === 'undo' && target) {
            const ids = Array.isArray(target) ? target.map(n => n.id) : [target.id]
            this.nodes = actions.removeNodesByIds(this.nodes, ids)
          } else if (direction === 'redo' && target) {
            const nodesToAdd = Array.isArray(target) ? target : [target]
            this.nodes.push(...nodesToAdd)
          }
          break

        case 'remove':
          if (direction === 'undo' && target) {
            const nodesToAdd = Array.isArray(target) ? target : [target]
            this.nodes.push(...nodesToAdd)
          } else if (direction === 'redo' && target) {
            const ids = Array.isArray(target) ? target.map(n => n.id) : [target.id]
            this.nodes = actions.removeNodesByIds(this.nodes, ids)
          }
          break

        case 'update':
        case 'move':
        case 'resize':
          if (target) {
            const nodesToUpdate = Array.isArray(target) ? target : [target]
            this.nodes = actions.replaceNodes(this.nodes, nodesToUpdate)
          }
          break
      }
    },

    /**
     * 创建反向历史记录
     */
    _createReverseRecord(record: HistoryRecord): HistoryRecord {
      return {
        ...record,
        before: record.after,
        after: record.before
      }
    },

    /**
     * 从选中列表移除节点
     */
    _removeNodeFromSelection(id: string) {
      this.selection.selectedIds = this.selection.selectedIds.filter(
        selectedId => selectedId !== id
      )
    }
  }
})
