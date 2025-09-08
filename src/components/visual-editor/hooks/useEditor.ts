/**
 * @file useEditor.ts
 * @description
 * 编辑器核心 Hook，提供状态管理、组件操作等核心功能。
 * 使用了统一的 WidgetRegistry 来管理所有组件。
 */

import { inject, provide, watchEffect } from 'vue'
import { useEditorStore } from '../store/editor'
import { useWidgetStore, type WidgetDefinition } from '../store/widget'
import { useVisualEditorIntegration as useCard2Integration } from '@/card2.1/hooks/useVisualEditorIntegration'
import { configRegistry } from '@/core/interaction-system'
// 数据源注册已移除
import type { GraphData, WidgetType } from '../types'
import type { ComponentDefinition } from '@/card2.1/core/types'

// 拖拽数据接口
export interface WidgetDragData {
  type: string
  name: string
  icon?: string
}

// 编辑器上下文接口
export interface EditorContext {
  editorStore: ReturnType<typeof useEditorStore>
  widgetStore: ReturnType<typeof useWidgetStore>
  stateManager: ReturnType<typeof useEditorStore> // stateManager 别名，指向 editorStore
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
  const editorStore = useEditorStore()
  const widgetStore = useWidgetStore()
  const card2Integration = useCard2Integration({ autoInit: true })

  // ... (initialization Promise and watchEffect logic remains the same)
  let resolveInitialization: () => void
  const initialization = new Promise<void>(resolve => {
    resolveInitialization = resolve
  })

  let stopWatch: (() => void) | null = null

  stopWatch = watchEffect(() => {
    // 修改条件：只要不在加载中就可以继续
    if (!card2Integration.isLoading.value) {
      // 清理注册表，只保留Card2.1组件
      const allWidgets = widgetStore.getAllWidgets()

      allWidgets.forEach(widget => {
        if (!widget.metadata?.isCard2Component) {
          // 移除非Card2.1组件
          widgetStore.unregister(widget.type)
        }
      })
      // 安全检查：确保 availableComponents 存在且有 value 属性
      const availableComponents = card2Integration.availableComponents?.value || []
      availableComponents.forEach(componentDef => {
        if (!widgetStore.getWidget(componentDef.type)) {
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

          widgetStore.register(widgetDef)
          console.log(`[useEditor] Successfully registered widget: ${widgetDef.type}`, widgetDef)
          // 注册配置组件到 configRegistry
          if (componentDef.definition.configComponent) {
            if (!configRegistry.has(componentDef.type)) {
              configRegistry.register(componentDef.type, componentDef.definition.configComponent)
            }
          }
        }
      })
      resolveInitialization()
      if (stopWatch) {
        stopWatch()
      }
    }
  })

  const getNodeById = (id: string) => {
    return editorStore.nodes.find(node => node.id === id)
  }

  const addWidget = async (type: string, position?: { x: number; y: number }) => {
    // 强制触发 availableWidgets 计算
    // 如果初始化 Promise 还没有被解析，手动触发
    if (card2Integration.isLoading.value) {
      await card2Integration.initialize()
    }

    await initialization
    // 首先尝试从 widgetStore 获取传统组件定义
    let widgetDef = widgetStore.getWidget(type)
    let isCard2Component = false

    // 如果在传统注册表中没有找到，检查是否是 Card2.1 组件
    if (!widgetDef) {
      // 检查是否是 card21- 前缀的类型
      let card2Type = type
      if (type.startsWith('card21-')) {
        card2Type = type.replace('card21-', '')
      }

      console.log(`🔧 [useEditor] 尝试获取Card2组件: ${card2Type}`)
      console.log(`🔧 [useEditor] Card2系统初始化状态: ${card2Integration.isInitialized.value}`)
      console.log(`🔧 [useEditor] 可用组件数量: ${card2Integration.availableWidgets.value.length}`)
      
      const card2Definition = card2Integration.getComponentDefinition(card2Type)
      console.log(`🔧 [useEditor] 获取Card2定义结果:`, card2Definition)
      
      if (card2Definition) {
        isCard2Component = true
        // ✅ 修复：getComponentDefinition 现在已经返回转换后的 WidgetDefinition
        widgetDef = card2Definition as WidgetDefinition
        console.log(`✅ [useEditor] 成功获取Card2组件定义: ${card2Type}`)
      } else {
        console.error(`❌ [useEditor] Card2组件未找到: ${card2Type}`)
        console.log(`❌ [useEditor] 所有可用组件:`, card2Integration.availableWidgets.value.map(w => w.type))
      }
    }

    if (!widgetDef) {
      console.error(`❌ [Editor] 组件类型 "${type}" 未注册。`)
      throw new Error(`组件类型 "${type}" 未注册。`)
    }

    const { w: newItemW, h: newItemH } = widgetDef.defaultLayout.gridstack
    const colNum = 12

    const { x, y } = findNextAvailablePosition(editorStore.nodes, newItemW, newItemH, colNum)
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
      showLabel: false,
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

    editorStore.addNode(node)
  }

  const selectNode = (id: string) => widgetStore.selectNodes([id])
  const updateNode = (id: string, updates: Partial<GraphData>) => editorStore.updateNode(id, updates)
  const removeNode = (id: string) => editorStore.removeNode(id)
  const addNode = (...nodes: GraphData[]) => editorStore.addNode(...nodes)

  editorInstance = {
    editorStore,
    widgetStore,
    stateManager: editorStore, // 添加 stateManager 别名，指向 editorStore
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
