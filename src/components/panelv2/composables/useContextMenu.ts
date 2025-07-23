// src/components/panelv2/composables/useContextMenu.ts

import { reactive } from 'vue'
import type { ContextMenuItem } from '../common/ContextMenu.vue'

export function useContextMenu() {
  const contextMenu = reactive({
    visible: false,
    x: 0,
    y: 0,
    items: [] as ContextMenuItem[]
  })

  const showContextMenu = (event: MouseEvent, items: ContextMenuItem[]) => {
    event.preventDefault()

    contextMenu.x = event.clientX
    contextMenu.y = event.clientY
    contextMenu.items = items
    contextMenu.visible = true
  }

  const hideContextMenu = () => {
    contextMenu.visible = false
  }

  const updateContextMenuVisibility = (visible: boolean) => {
    contextMenu.visible = visible
  }

  return {
    contextMenu,
    showContextMenu,
    hideContextMenu,
    updateContextMenuVisibility
  }
}
