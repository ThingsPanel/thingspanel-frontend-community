import { defineStore } from 'pinia'
import type { GraphData, Viewport, EditorMode, WidgetType } from '@/components/visual-editor/types'
import { useWidgetStore } from '@/components/visual-editor/store/widget'
import type { WidgetDefinition } from '@/components/visual-editor/store/widget'

interface EditorState {
  nodes: GraphData[]
  viewport: Viewport
  mode: EditorMode
}

// 生成唯一ID的辅助函数
const generateId = (type: WidgetType) => `${type}_${Date.now()}`

export const useEditorStore = defineStore('editor', {
  state: (): EditorState => ({
    nodes: [],
    viewport: { x: 0, y: 0, zoom: 1 },
    mode: 'design'
  }),
  actions: {
    addNode(...nodes: GraphData[]) {
      this.nodes.push(...nodes)

      // 添加节点后，自动选中最后一个节点
      if (nodes.length > 0) {
        const widgetStore = useWidgetStore()
        widgetStore.selectNodes([nodes[nodes.length - 1].id])
      }
    },
    removeNode(id: string) {
      this.nodes = this.nodes.filter(node => node.id !== id)
      // 移除节点后，从选中项中也移除
      const widgetStore = useWidgetStore()
      widgetStore.removeNodeFromSelection(id)
    },
    updateNode(id: string, updates: Partial<GraphData>) {
      const node = this.nodes.find(n => n.id === id)
      if (node) {
        Object.assign(node, updates)
        node.metadata.updatedAt = Date.now()
      }
    },
    setMode(mode: EditorMode) {
      this.mode = mode
    },
    updateViewport(viewport: Partial<Viewport>) {
      this.viewport = { ...this.viewport, ...viewport }
    },
    reset() {
      this.nodes = []
      this.viewport = { x: 0, y: 0, zoom: 1 }
      this.mode = 'design'
    },
    setNodes(nodes: GraphData[]) {
      this.nodes = nodes
    }
  }
})
