import { defineStore } from 'pinia'
import type { GraphData, WidgetType } from '@/components/visual-editor/types'
import { useEditorStore } from '@/components/visual-editor/store/editor'

export interface WidgetDefinition {
  type: WidgetType
  name: string
  description: string
  version: string
  icon: string
  category: 'basic' | 'chart' | 'data' | 'control' | 'other' | string
  defaultLayout: {
    canvas: { width: number; height: number }
    gridstack: { w: number; h: number }
  }
  defaultProperties: Record<string, any>
  metadata?: Record<string, any>
}

interface WidgetState {
  selectedIds: string[]
  widgetRegistry: Map<WidgetType, WidgetDefinition>
}

export const useWidgetStore = defineStore('widget', {
  state: (): WidgetState => ({
    selectedIds: [],
    widgetRegistry: new Map()
  }),
  getters: {
    selectedNodes(state) {
      const editorStore = useEditorStore()
      return editorStore.nodes.filter(node => state.selectedIds.includes(node.id))
    },
    getWidget: state => (type: WidgetType) => {
      return state.widgetRegistry.get(type)
    },
    getAllWidgets: state => () => {
      return Array.from(state.widgetRegistry.values())
    }
  },
  actions: {
    register(widget: WidgetDefinition) {
      if (this.widgetRegistry.has(widget.type)) {
      }
      this.widgetRegistry.set(widget.type, widget)
    },
    unregister(widgetType: WidgetType) {
      this.widgetRegistry.delete(widgetType)
    },
    selectNodes(ids: string[]) {
      this.selectedIds = ids
    },
    clearSelection() {
      this.selectedIds = []
    },
    removeNodeFromSelection(id: string) {
      const index = this.selectedIds.indexOf(id)
      if (index > -1) {
        this.selectedIds.splice(index, 1)
      }
    },
    reset() {
      this.selectedIds = []
    }
  }
})
