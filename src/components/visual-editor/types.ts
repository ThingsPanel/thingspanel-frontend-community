/**
 * @file types.ts
 * @description Visual Editor 类型定义
 */

import type { GraphData } from '@antv/x6'
import type { DataSource } from './types/data-source'

// 1. 定义我们自己的渲染器类型
export type RendererType = 'canvas' | 'gridstack' | 'vue' | 'react' | 'angular' | 'svelte' | 'webgl'

// 2. 定义组件类型
export type WidgetType = string

// 3. 定义 VisualEditorWidget 类型，扩展 GraphData
export interface VisualEditorWidget extends Omit<GraphData, 'dataSource'> {
  dataSource?: DataSource | null // 添加数据源支持
}

// 组件元信息
export interface WidgetMeta {
  type: WidgetType
  name: string
  description: string
  icon: string
  category: string
  version: string
  source: 'builtin' | 'card2' | 'plugin'
}

// 组件定义
export interface WidgetDefinition extends WidgetMeta {
  defaultLayout: {
    canvas: {
      width: number
      height: number
    }
    gridstack: {
      w: number
      h: number
    }
  }
  defaultProperties: Record<string, any>
  metadata?: {
    isCard2Component?: boolean
    card2ComponentId?: string
    card2Definition?: any
  }
}
