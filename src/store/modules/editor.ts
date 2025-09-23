import { defineStore } from 'pinia'
import type { GraphData, CanvasState } from '@/components/visual-editor/types/base-types'

// 从旧的 StateManager 迁移过来的状态
interface EditorState {
  nodes: GraphData[]
  viewport: {
    zoom: number
    offsetX: number
    offsetY: number
  }
  mode: 'edit' | 'preview'
}

export const useEditorStore = defineStore('editor', {
  state: (): EditorState => ({
    nodes: [],
    viewport: {
      zoom: 1,
      offsetX: 0,
      offsetY: 0
    },
    mode: 'edit'
  }),
  actions: {
    // 节点操作
    addNode(node: GraphData) {
      const widgetStore = useWidgetStore()
      this.nodes.push(node)
      widgetStore.selectNodes([node.id])
    },
    removeNode(id: string) {
      const widgetStore = useWidgetStore()
      this.nodes = this.nodes.filter(node => node.id !== id)
      widgetStore.removeNodeFromSelection(id)
    },
    updateNode(id: string, updates: Partial<GraphData>) {
      const nodeIndex = this.nodes.findIndex(node => node.id === id)
      if (nodeIndex !== -1) {
        this.nodes[nodeIndex] = {
          ...this.nodes[nodeIndex],
          ...updates,
          metadata: {
            ...this.nodes[nodeIndex].metadata,
            updatedAt: Date.now()
          }
        }
      }
    },
