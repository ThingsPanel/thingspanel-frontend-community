/**
 * @file useEditor.ts
 * @description
 * 编辑器核心 Hook，提供状态管理、组件操作等核心功能。
 * 使用了统一的 WidgetRegistry 来管理所有组件。
 */

import { inject, provide, watchEffect } from 'vue'
import { StateManager } from '../core/state-manager'
import { widgetRegistry, type WidgetDefinition } from '../core/widget-registry'
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

/**
 * 将 Card2.1 组件定义转换为 WidgetDefinition 格式
 */
function convertCard2ToWidgetDefinition(card2Definition: IComponentDefinition): WidgetDefinition {
  const meta = card2Definition.meta || {}

  // 获取默认尺寸
  const defaultSize = card2Definition.defaultSize || { width: 4, height: 3 }
  const canvasWidth = defaultSize.width * 120 // 每个网格单元约120px
  const canvasHeight = defaultSize.height * 80 // 每个网格单元约80px

  // 从 properties 中提取默认属性
  const defaultProperties: Record<string, any> = {}
  if (card2Definition.properties) {
    for (const [key, prop] of Object.entries(card2Definition.properties)) {
      if (typeof prop === 'object' && prop !== null && 'default' in prop) {
        defaultProperties[key] = prop.default
      }
    }
  }

  return {
    type: card2Definition.id,
    name: meta.title || meta.name || card2Definition.id,
    description: meta.description || '',
    icon: meta.icon || 'mdi:cube-outline',
    category: meta.category || 'other',
    version: meta.version || '1.0.0',
    defaultProperties,
    defaultLayout: {
      canvas: {
        width: canvasWidth,
        height: canvasHeight
      },
      gridstack: {
        w: defaultSize.width,
        h: defaultSize.height
      }
    },
    metadata: {
      isCard2Component: true,
      originalDefinition: card2Definition
    }
  }
}

// --- Editor Singleton ---
let editorInstance: EditorContext | null = null

export function createEditor() {
  const stateManager = new StateManager()
  const card2Integration = useCard2Integration()

  // ... (initialization Promise and watchEffect logic remains the same)
  let resolveInitialization: () => void
  const initialization = new Promise<void>(resolve => {
    resolveInitialization = resolve
  })

  const stopWatch = watchEffect(() => {
    if (!card2Integration.isLoading.value && card2Integration.availableComponents.value.length > 0) {
      card2Integration.availableComponents.value.forEach(componentDef => {
        if (!widgetRegistry.getWidget(componentDef.id)) {
          widgetRegistry.register({
            type: componentDef.id,
            name: componentDef.meta?.title || componentDef.id,
            description: componentDef.meta?.description || '',
            version: componentDef.meta?.version || '1.0.0',
            icon: componentDef.meta?.icon,
            source: 'card2',
            defaultLayout: {
              canvas: { width: 300, height: 200 },
              gridstack: { w: 4, h: 4 }
            },
            defaultProperties: componentDef.properties || {},
            metadata: {
              isCard2Component: true,
              card2ComponentId: componentDef.id,
              card2Definition: componentDef as IComponentDefinition
            }
          })
        }
      })
      resolveInitialization()
      stopWatch()
    }
  })

  const getNodeById = (id: string) => {
    return stateManager.canvasState.value.nodes.find(node => node.id === id)
  }

  const addWidget = async (type: string, position?: { x: number; y: number }) => {
    await initialization

    // 首先尝试从 widgetRegistry 获取传统组件定义
    let widgetDef = widgetRegistry.getWidget(type)
    let isCard2Component = false

    // 如果在传统注册表中没有找到，检查是否是 Card2.1 组件
    if (!widgetDef) {
      // 检查是否是 card21- 前缀的类型
      let card2Type = type
      if (type.startsWith('card21-')) {
        card2Type = type.replace('card21-', '')
      }

      const card2Definition = card2Integration.getComponentDefinition(card2Type)
      if (card2Definition) {
        isCard2Component = true
        // 将 Card2.1 组件定义转换为 WidgetDefinition 格式
        widgetDef = convertCard2ToWidgetDefinition(card2Definition)
      }
    }

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
      label: widgetDef.name,
      showLabel: true,
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
        isCard2Component, // 标记是否为 Card2.1 组件
        ...widgetDef.metadata
      }
    }
    stateManager.addNode(node)
  }

  const selectNode = (id: string) => stateManager.selectNodes([id])
  const updateNode = (id: string, updates: Partial<GraphData>) => stateManager.updateNode(id, updates)
  const removeNode = (id: string) => stateManager.removeNode(id)
  const addNode = (...nodes: GraphData[]) => stateManager.addNode(...nodes)

  editorInstance = {
    stateManager,
    addWidget,
    selectNode,
    updateNode,
    removeNode,
    addNode,
    getNodeById,
    card2Integration,
    isCard2Component: card2Integration.isCard2Component
  }

  return editorInstance
}

export function useEditor(): EditorContext {
  if (!editorInstance) {
    throw new Error('useEditor 必须在 createEditor 调用之后使用')
  }
  return editorInstance
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
