/**
 * Kanban Renderer Module
 * 看板渲染器模块统一导出
 *
 * 自动注册约定：
 * - 导出 RendererClass: 渲染器类
 * - 导出 RendererInfo: 渲染器信息
 * - 可选导出 enabled: 是否启用
 */

import { KanbanRenderer } from './KanbanRendererFactory'
import type { RendererInfo } from '../../types/renderer'
import type { RendererModule } from '../../core/RendererAutoRegistry'

// 传统导出（保持向后兼容）
export { default as KanbanRenderer, createKanbanRenderer, getKanbanRendererComponent } from './KanbanRendererFactory'
export { default as KanbanRendererComponent } from './KanbanRenderer.vue'
export { default as KanbanToolbar } from './KanbanToolbar.vue'

// 类型导出
export type { BaseRenderer, RendererConfig } from '../../types/renderer'
export type { BaseCanvasItem } from '../../types/core'
export type { KanbanToolbarConfig } from './KanbanToolbar.vue'

// 自动注册所需的导出
export const RendererClass = KanbanRenderer

const rendererInfo: RendererInfo = {
  id: 'kanban',
  name: '看板',
  version: '1.0.0',
  description: '看板式布局渲染器，支持拖拽排列和自由布局',
  icon: 'grid',
  author: 'ThingsPanel Team',
  capabilities: {
    supportsDrag: true,
    supportsResize: true,
    supportsZoom: true,
    supportsGrid: true,
    supportsLayers: false,
    supportsAnimation: false
  }
}

export const enabled = true

export { rendererInfo as RendererInfo }

// 默认导出（符合 RendererModule 接口）
const rendererModule: RendererModule = {
  RendererClass,
  RendererInfo: rendererInfo,
  enabled
}

export default rendererModule
