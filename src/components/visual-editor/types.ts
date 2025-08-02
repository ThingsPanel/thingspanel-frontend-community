/**
 * Visual Editor Types
 * 编辑器专用类型定义，兼容 Card 2.1 和 PanelV2
 */

// 1. 定义我们自己的渲染器类型
export type RendererType = 'canvas' | 'gridstack' | 'vue' | 'react' | 'angular' | 'svelte' | 'webgl'

// 2. 重新导出 Card 2.1 的核心类型 (注意路径已更新为 card2.1)
export type { IComponentDefinition, IComponentInstance, IComponentMeta } from '@/card2.1/core/types'

// 支持的组件类型 - 现在主要由 Card 2.1 动态提供，这里可以留空或作为备用
export type WidgetType = string

// 节点数据结构
export interface GraphData {
  id: string
  type: WidgetType
  x: number
  y: number
  width: number
  height: number
  label: string // 组件标题
  showLabel: boolean // 是否显示标题
  properties: Record<string, any>
  interaction?: {
    // 交互配置
    onClick: {
      type: 'none' | 'link' | 'internal_route'
      payload: {
        url?: string
        route?: string
        newTab?: boolean
      }
    }
  }
  dataSource?: {
    // 数据源配置
    type: 'json' | 'device' | 'api'
    id?: string // 数据集ID
    data?: any // 用于静态JSON
    // ... 其他数据源相关配置
  }
  renderer: RendererType[]
  layout?: {
    canvas?: { width: number; height: number }
    gridstack?: { w: number; h: number; x?: number; y?: number }
  }
  metadata?: {
    // locked?: boolean // <--- 已移除
    isCard2Component?: boolean
    card2ComponentId?: string
    card2Definition?: any // IComponentDefinition
    createdAt?: number
    updatedAt?: number
    version?: string
    [key: string]: any
  }
  component?: any // 用于 Gridstack 渲染器
  label?: string // 用于 Gridstack 渲染器
}

// 3. 定义 VisualEditorWidget 类型，它就是 GraphData
export type VisualEditorWidget = GraphData

// 组件元信息 (大部分已合并到 Card 2.1 的 IComponentMeta)
// 这个可以保留用于传统组件或未来的扩展
export interface WidgetMeta {
  type: WidgetType
  name: string
  icon?: any // string or Vue component
  defaultSize: {
    width: number
    height: number
  }
  constraints: {
    minWidth: number
    minHeight: number
    maxWidth?: number
    maxHeight?: number
  }
  category?: string
  description?: string
  tags?: string[]
  version?: string
}
