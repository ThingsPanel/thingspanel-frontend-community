/**
 * 编辑器相关类型定义
 */

import type { RendererType } from './renderer'

// 编辑器配置
export interface EditorConfig {
  width: number
  height: number
  rendererType: RendererType
  showGrid: boolean
  snapToGrid: boolean
  gridSize: number
}

// 看板配置
export interface KanbanConfig extends EditorConfig {
  rendererType: 'kanban'
  columns: KanbanColumn[]
}

export interface KanbanColumn {
  id: string
  title: string
  cards: KanbanCard[]
}

export interface KanbanCard {
  id: string
  title: string
  content: string
}

// 大屏配置
export interface DashboardConfig extends EditorConfig {
  rendererType: 'dashboard'
  backgroundColor: string
  backgroundImage?: string
}
