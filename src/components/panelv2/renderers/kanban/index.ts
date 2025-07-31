/**
 * Kanban Renderer Module
 * 看板渲染器模块统一导出
 */

export { default as KanbanRenderer, createKanbanRenderer, getKanbanRendererComponent } from './KanbanRendererFactory'
export { default as KanbanRendererComponent } from './KanbanRenderer.vue'

// 类型导出
export type { BaseRenderer, RendererConfig } from '../../types/renderer'
export type { BaseCanvasItem } from '../../types/core'