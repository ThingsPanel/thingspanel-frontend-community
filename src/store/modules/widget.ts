import { defineStore } from 'pinia'
import { useEditorStore } from './editor'

// 从旧的 StateManager 迁移过来的状态
interface WidgetState {
  selectedIds: string[]
}

export const useWidgetStore = defineStore('widget', {
  state: (): WidgetState => ({
    selectedIds: []
  }),
  getters: {
    selectedNodes: state => {
      const editorStore = useEditorStore()
      return editorStore.nodes.filter(node => state.selectedIds.includes(node.id))
    }
  },
  actions: {
    // 选择操作
    selectNodes(ids: string[]) {
      this.selectedIds = [...ids]
    },
    clearSelection() {
      this.selectedIds = []
    },
    // 当节点被删除时，也需要更新选中状态
    removeNodeFromSelection(id: string) {
      this.selectedIds = this.selectedIds.filter(selectedId => selectedId !== id)
    },
    reset() {
      this.selectedIds = []
    }
  }
})
