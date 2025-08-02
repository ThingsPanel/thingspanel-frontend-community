/**
 * 编辑器主Hook
 */

import { inject, provide } from 'vue'
import { StateManager } from '../core/state-manager'
import type { GraphData, RendererType } from '../types'

const EDITOR_KEY = Symbol('editor')

export interface EditorContext {
  stateManager: StateManager
  addWidget: (type: string) => void
  selectNode: (id: string) => void
  updateNode: (id: string, updates: Partial<GraphData>) => void
}

export function createEditor() {
  const stateManager = new StateManager()

  const addWidget = (type: string, position?: { x: number; y: number }) => {
    const node: GraphData = {
      id: `${type}_${Date.now()}`,
      type,
      x: position?.x || 100,
      y: position?.y || 100,
      width: 200, // Canvas默认像素宽度
      height: 100, // Canvas默认像素高度
      properties: getDefaultProperties(type),
      renderer: ['canvas', 'gridstack'],

      // 不同渲染器的布局数据
      layout: {
        canvas: {
          width: 200,
          height: 100
        },
        gridstack: {
          w: 2, // 网格宽度单位
          h: 2 // 网格高度单位
        }
      },

      metadata: {
        createdAt: Date.now(),
        updatedAt: Date.now(),
        version: '1.0.0'
      }
    }
    stateManager.addNode(node)
  }

  const selectNode = (id: string) => {
    stateManager.selectNodes([id])
  }

  const updateNode = (id: string, updates: Partial<GraphData>) => {
    stateManager.updateNode(id, updates)
  }

  const context: EditorContext = {
    stateManager,
    addWidget,
    selectNode,
    updateNode
  }

  provide(EDITOR_KEY, context)
  return context
}

export function useEditor(): EditorContext {
  const context = inject<EditorContext>(EDITOR_KEY)
  if (!context) {
    throw new Error('useEditor must be used within createEditor context')
  }
  return context
}

function getDefaultProperties(type: string) {
  switch (type) {
    case 'text':
      return {
        content: '文本内容',
        fontSize: 14,
        color: '#333333',
        textAlign: 'left'
      }
    case 'image':
      return {
        src: '',
        alt: '图片',
        objectFit: 'cover'
      }
    case 'bar-chart':
    case 'line-chart':
    case 'pie-chart':
      return {
        title: '图表标题',
        data: [
          { name: '数据1', value: 120 },
          { name: '数据2', value: 200 },
          { name: '数据3', value: 150 },
          { name: '数据4', value: 80 }
        ],
        color: '#18a058'
      }
    case 'digit-indicator':
      return {
        value: 888,
        label: '数据指示器',
        unit: '',
        color: '#18a058',
        backgroundColor: '#f0f0f0',
        fontSize: 24
      }
    case 'chart-digit-indicator':
      return {
        title: '数据指示器',
        deviceId: '',
        metricsId: '',
        metricsType: 'telemetry',
        icon: 'uil:analytics',
        color: '#18a058',
        backgroundColor: '#f0f0f0'
      }
    case 'chart-bar':
      return {
        title: '数据柱状图',
        deviceIds: [],
        metricsIds: [],
        colors: ['#18a058', '#2080f0', '#f0a020', '#d03050'],
        showLegend: true,
        showGrid: true
      }
    default:
      return {}
  }
}
