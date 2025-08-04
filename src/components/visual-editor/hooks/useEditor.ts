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
import { configRegistry } from '../settings/ConfigRegistry'
import '../settings/data-sources' // 注册数据源
import type { GraphData, WidgetType } from '../types'
import type { ComponentDefinition } from '@/card2.1/core/types'

// 重新导出类型
export type { StateManager } from '../core/state-manager'

// 拖拽数据接口
export interface WidgetDragData {
  type: string
  name: string
  icon?: string
}

// 编辑器上下文接口
export interface EditorContext {
  stateManager: StateManager
  addWidget: (type: string, position?: { x: number; y: number }) => Promise<void>
  selectNode: (id: string) => void
  updateNode: (id: string, updates: Partial<GraphData>) => void
  removeNode: (id: string) => void
  addNode: (...nodes: GraphData[]) => void
  getNodeById: (id: string) => GraphData | undefined
  card2Integration: ReturnType<typeof useCard2Integration>
  isCard2Component: (type: string) => boolean
}

// 不自动注册基础组件，只注册Card2.1组件
// registerAllWidgets()

/**
 * 将 Card2.1 组件定义转换为 WidgetDefinition 格式
 */
function convertCard2ToWidgetDefinition(card2Definition: ComponentDefinition): WidgetDefinition {
  // 获取默认尺寸
  const defaultSize = { width: 4, height: 3 }
  const canvasWidth = defaultSize.width * 120 // 每个网格单元约120px
  const canvasHeight = defaultSize.height * 80 // 每个网格单元约80px

  // 从 properties 中提取默认属性值
  const defaultProperties: Record<string, any> = {}
  if (card2Definition.properties) {
    for (const [key, prop] of Object.entries(card2Definition.properties)) {
      if (typeof prop === 'object' && prop !== null && 'default' in prop) {
        defaultProperties[key] = (prop as any).default
      } else {
        defaultProperties[key] = prop
      }
    }
  }

  return {
    type: card2Definition.type,
    name: card2Definition.name,
    description: card2Definition.description || '',
    icon: card2Definition.icon || 'mdi:cube-outline',
    category: card2Definition.category || 'other',
    version: '2.1.0',
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

  let stopWatch: (() => void) | null = null

  stopWatch = watchEffect(() => {
    if (!card2Integration.isLoading.value && card2Integration.availableComponents.value.length > 0) {
      // 清理注册表，只保留Card2.1组件
      const allWidgets = widgetRegistry.getAllWidgets()
      allWidgets.forEach(widget => {
        if (!widget.metadata?.isCard2Component) {
          // 移除非Card2.1组件
          widgetRegistry.unregister(widget.type)
        }
      })

      console.log('🔍 useEditor - 开始注册 Card 2.1 组件到 Widget Registry')
      card2Integration.availableComponents.value.forEach(componentDef => {
        console.log(`🔍 useEditor - 处理组件: ${componentDef.type}`)
        console.log(`🔍 useEditor - 组件详情:`, componentDef)

        if (!widgetRegistry.getWidget(componentDef.type)) {
          console.log(`🔍 useEditor - 注册组件到 Widget Registry: ${componentDef.type}`)

          // 从 properties 中提取默认属性值
          const defaultProperties: Record<string, any> = {}
          if (componentDef.definition.properties) {
            for (const [key, prop] of Object.entries(componentDef.definition.properties)) {
              if (typeof prop === 'object' && prop !== null && 'default' in prop) {
                defaultProperties[key] = (prop as any).default
              } else {
                defaultProperties[key] = prop
              }
            }
          }

          const widgetDef = {
            type: componentDef.type,
            name: componentDef.name,
            description: componentDef.description,
            version: componentDef.version,
            icon: componentDef.icon,
            category: componentDef.category,
            source: 'card2',
            defaultLayout: {
              canvas: { width: 300, height: 200 },
              gridstack: { w: 4, h: 4 }
            },
            defaultProperties,
            metadata: {
              isCard2Component: true,
              card2ComponentId: componentDef.type,
              card2Definition: componentDef.definition
            }
          }

          console.log(`🔍 useEditor - Widget 定义:`, widgetDef)
          widgetRegistry.register(widgetDef)
          console.log(`✅ useEditor - 组件注册成功: ${componentDef.type}`)

          // 注册配置组件到 configRegistry
          if (componentDef.definition.configComponent) {
            console.log(`🔍 useEditor - 检查配置组件是否已注册: ${componentDef.type}`)
            if (!configRegistry.has(componentDef.type)) {
              console.log(`🔍 useEditor - 注册配置组件: ${componentDef.type}`)
              configRegistry.register(componentDef.type, componentDef.definition.configComponent)
              console.log(`✅ useEditor - 配置组件注册成功: ${componentDef.type}`)
            } else {
              console.log(`🔍 useEditor - 配置组件已存在，跳过注册: ${componentDef.type}`)
            }
          } else {
            console.log(`🔍 useEditor - 组件 ${componentDef.type} 没有配置组件`)
          }
        } else {
          console.log(`🔍 useEditor - 组件已存在，跳过注册: ${componentDef.type}`)
        }
      })
      resolveInitialization()
      if (stopWatch) {
        stopWatch()
      }
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

    // 修复：正确提取属性值而不是属性定义
    const defaultProperties: Record<string, any> = {}
    if (widgetDef.defaultProperties) {
      for (const [key, prop] of Object.entries(widgetDef.defaultProperties)) {
        if (typeof prop === 'object' && prop !== null && 'default' in prop) {
          // 如果是属性定义对象，提取 default 值
          defaultProperties[key] = (prop as any).default
        } else {
          // 如果已经是值，直接使用
          defaultProperties[key] = prop
        }
      }
    }

    const node: GraphData = {
      id: `${type}_${Date.now()}`,
      type: widgetDef.type,
      x: finalPos.x,
      y: finalPos.y,
      width: widgetDef.defaultLayout.canvas.width,
      height: widgetDef.defaultLayout.canvas.height,
      label: widgetDef.name,
      showLabel: true,
      properties: defaultProperties, // 使用修复后的属性值
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
      },
      dataSource: null // 初始化数据源为空
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
