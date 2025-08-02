/**
 * @file useEditor.ts
 * @description
 * 编辑器核心 Hook，提供状态管理、组件操作等核心功能。
 * 使用了统一的 WidgetRegistry 来管理所有组件。
 */

import { inject, provide } from 'vue'
import { StateManager } from '../core/state-manager'
import { widgetRegistry } from '../core/widget-registry'
import { registerAllWidgets } from '../widgets'
import { useCard2Integration } from './useCard2Integration'
import type { GraphData, WidgetType } from '../types'
import type { IComponentDefinition } from '@/card2.1/core'

// 重新导出类型
export type { StateManager } from '../core/state-manager'

// 拖拽数据接口
export interface WidgetDragData {
  type: string
  name: string
  icon?: string
}

// 在模块加载时执行一次组件注册
registerAllWidgets()

const EDITOR_KEY = Symbol('editor')

export interface EditorContext {
  stateManager: StateManager
  // --- Actions ---
  addWidget: (type: string, position?: { x: number; y: number }) => Promise<void>
  selectNode: (id: string) => void
  updateNode: (id: string, updates: Partial<GraphData>) => void
  removeNode: (id: string) => void
  addNode: (...nodes: GraphData[]) => void
  // --- Getters ---
  getNodeById: (id: string) => GraphData | undefined
  // --- Card 2.1 Integration ---
  card2Integration: ReturnType<typeof useCard2Integration>
  isCard2Component: (type: string) => boolean
  createCard2Widget: (type: string, position?: { x: number; y: number }) => Promise<void>
}

export function createEditor() {
  const stateManager = new StateManager()
  const card2Integration = useCard2Integration()

  const getNodeById = (id: string) => {
    return stateManager.canvasState.value.nodes.find(node => node.id === id)
  }

  const addWidget = async (
    type: string,
    position?: { x: number; y: number },
    source: 'card2' | 'legacy' = 'legacy'
  ) => {
    // 明确使用 source 来判断
    if (source === 'card2') {
      await createCard2Widget(type, position)
      return
    }

    // --- Legacy Widget Logic ---
    const widgetDef = widgetRegistry.getWidget(type)
    if (!widgetDef) {
      console.error(`[Editor] 组件类型 "${type}" 未注册。`)
      throw new Error(`组件类型 "${type}" 未注册。`)
    }

    const { w: newItemW, h: newItemH } = widgetDef.defaultLayout.gridstack
    const colNum = 12

    const { x, y } = findNextAvailablePosition(stateManager.canvasState.value.nodes, newItemW, newItemH, colNum)

    const finalPos = position || { x, y }

    const node: GraphData = {
      id: `${type}_${Date.now()}`,
      type: widgetDef.type,
      x: finalPos.x,
      y: finalPos.y,
      width: widgetDef.defaultLayout.canvas.width,
      height: widgetDef.defaultLayout.canvas.height,
      properties: { ...widgetDef.defaultProperties },
      renderer: ['canvas', 'gridstack'],
      layout: {
        canvas: { ...widgetDef.defaultLayout.canvas, ...finalPos },
        gridstack: { ...widgetDef.defaultLayout.gridstack, w: newItemW, h: newItemH, ...finalPos }
      },
      metadata: {
        createdAt: Date.now(),
        updatedAt: Date.now(),
        version: widgetDef.version,
        ...widgetDef.metadata
      }
    }
    stateManager.addNode(node)
  }

  const createCard2Widget = async (type: string, position?: { x: number; y: number }) => {
    const definition = card2Integration.getComponentDefinition(type)
    if (!definition) {
      throw new Error(`Card 2.1 组件 "${type}" 不存在。`)
    }

    const newItemW = 4,
      newItemH = 4
    const colNum = 12

    const { x: calculatedX, y: calculatedY } = findNextAvailablePosition(
      stateManager.canvasState.value.nodes,
      newItemW,
      newItemH,
      colNum
    )
    const finalPos = position || { x: calculatedX, y: calculatedY }

    const node: GraphData = {
      id: `${definition.id}_${Date.now()}`,
      type: definition.id as WidgetType,
      x: finalPos.x,
      y: finalPos.y,
      width: 300,
      height: 200,
      label: definition.meta.title || definition.id,
      showLabel: true,
      properties: { ...definition.properties },
      renderer: ['canvas', 'gridstack'],
      layout: {
        canvas: { width: 300, height: 200, ...finalPos },
        gridstack: { w: newItemW, h: newItemH, ...finalPos }
      },
      metadata: {
        isCard2Component: true,
        source: 'card2', // 明确 source
        card2ComponentId: definition.id,
        card2Definition: definition as IComponentDefinition,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        version: definition.meta.version || '1.0.0'
      }
    }
    stateManager.addNode(node)
  }

  const selectNode = (id: string) => stateManager.selectNodes([id])
  const updateNode = (id: string, updates: Partial<GraphData>) => stateManager.updateNode(id, updates)
  const removeNode = (id: string) => stateManager.removeNode(id)
  const addNode = (...nodes: GraphData[]) => stateManager.addNode(...nodes)

  const context: EditorContext = {
    stateManager,
    addWidget,
    selectNode,
    updateNode,
    removeNode,
    addNode,
    getNodeById,
    card2Integration,
    isCard2Component: card2Integration.isCard2Component,
    createCard2Widget
  }

  provide(EDITOR_KEY, context)
  return context
}

export function useEditor(): EditorContext {
  const context = inject<EditorContext>(EDITOR_KEY)
  if (!context) {
    throw new Error('useEditor 必须在 createEditor 上下文中使用')
  }
  return context
}

function findNextAvailablePosition(
  nodes: GraphData[],
  newItemW: number,
  newItemH: number,
  colNum: number
): { x: number; y: number } {
  const grid: boolean[][] = []
  const maxRows =
    nodes.length > 0
      ? Math.max(...nodes.map(n => (n.layout?.gridstack?.y ?? 0) + (n.layout?.gridstack?.h ?? 0))) + newItemH
      : newItemH

  for (let i = 0; i < maxRows; i++) {
    grid[i] = new Array(colNum).fill(false)
  }

  nodes.forEach(node => {
    const { x, y, w, h } = node.layout?.gridstack || { x: 0, y: 0, w: 0, h: 0 }
    for (let r = y; r < y + h; r++) {
      for (let c = x; c < x + w; c++) {
        if (r < maxRows && c < colNum) {
          grid[r][c] = true
        }
      }
    }
  })

  for (let r = 0; r < maxRows; r++) {
    for (let c = 0; c <= colNum - newItemW; c++) {
      let isVacant = true
      for (let i = 0; i < newItemH; i++) {
        for (let j = 0; j < newItemW; j++) {
          if (r + i >= maxRows || grid[r + i][c + j]) {
            isVacant = false
            break
          }
        }
        if (!isVacant) break
      }
      if (isVacant) {
        return { x: c, y: r }
      }
    }
  }

  const y =
    nodes.length > 0 ? Math.max(...nodes.map(n => (n.layout?.gridstack?.y ?? 0) + (n.layout?.gridstack?.h ?? 0))) : 0
  return { x: 0, y }
}
