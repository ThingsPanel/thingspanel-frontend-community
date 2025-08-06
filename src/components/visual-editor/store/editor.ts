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
    addNode(widget: WidgetDefinition, position?: { x: number; y: number }) {
      const newNode: GraphData = {
        id: generateId(widget.type),
        type: widget.type,
        x: position?.x || 0,
        y: position?.y || 0,
        width: widget.defaultLayout.canvas.width,
        height: widget.defaultLayout.canvas.height,
        label: widget.name,
        showLabel: false,
        properties: { ...widget.defaultProperties },
        renderer: ['canvas', 'gridstack'],
        layout: {
          canvas: { ...widget.defaultLayout.canvas, ...(position || { x: 0, y: 0 }) },
          gridstack: { ...widget.defaultLayout.gridstack, ...(position || { x: 0, y: 0 }) }
        },
        metadata: {
          createdAt: Date.now(),
          updatedAt: Date.now(),
          version: widget.version,
          ...widget.metadata
        },
        dataSource: null
      }
      this.nodes.push(newNode)

      // 添加节点后，自动选中
      const widgetStore = useWidgetStore()
      widgetStore.selectNodes([newNode.id])
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
