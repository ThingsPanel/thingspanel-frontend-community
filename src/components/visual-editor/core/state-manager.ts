/**
 * 状态管理器 - 核心状态管理
 */

import { reactive, computed } from 'vue'
import type { GraphData, CanvasState } from '../types/base-types'

export class StateManager {
  private state = reactive<CanvasState>({
    nodes: [],
    selectedIds: [],
    viewport: {
      zoom: 1,
      offsetX: 0,
      offsetY: 0
    },
    mode: 'edit'
  })

  // 计算属性
  get nodes() {
    return computed(() => this.state.nodes)
  }

  get selectedNodes() {
    return computed(() => this.state.nodes.filter(node => this.state.selectedIds.includes(node.id)))
  }

  get canvasState() {
    return computed(() => this.state)
  }

  // 节点操作
  addNode(node: GraphData) {
    // console.log('🎯 [StateManager] addNode 被调用:', {
    //   id: node.id,
    //   type: node.type,
    //   currentNodesCount: this.state.nodes.length
    // })

    this.state.nodes.push(node)
    // console.log('✅ [StateManager] 节点已添加到状态:', {
    //   newNodesCount: this.state.nodes.length,
    //   allNodes: this.state.nodes.map(n => ({ id: n.id, type: n.type }))
    // })

    this.selectNodes([node.id])
    // console.log('✅ [StateManager] 节点已选中')
  }

  removeNode(id: string) {
    this.state.nodes = this.state.nodes.filter(node => node.id !== id)
    this.state.selectedIds = this.state.selectedIds.filter(selectedId => selectedId !== id)
  }

  updateNode(id: string, updates: Partial<GraphData>) {
    const nodeIndex = this.state.nodes.findIndex(node => node.id === id)
    if (nodeIndex !== -1) {
      this.state.nodes[nodeIndex] = {
        ...this.state.nodes[nodeIndex],
        ...updates,
        metadata: {
          ...this.state.nodes[nodeIndex].metadata,
          updatedAt: Date.now()
        }
      }
    }
  }

  // 选择操作
  selectNodes(ids: string[]) {
    this.state.selectedIds = [...ids]
  }

  clearSelection() {
    this.state.selectedIds = []
  }

  // 视口操作
  updateViewport(updates: Partial<typeof this.state.viewport>) {
    Object.assign(this.state.viewport, updates)
  }

  // 模式切换
  setMode(mode: 'edit' | 'preview') {
    this.state.mode = mode
  }

  // 重置状态
  reset() {
    this.state.nodes = []
    this.state.selectedIds = []
    this.state.viewport = { zoom: 1, offsetX: 0, offsetY: 0 }
    this.state.mode = 'edit'
  }
}

export const stateManager = new StateManager()
