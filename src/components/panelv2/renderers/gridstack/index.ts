/**
 * Gridstack Renderer Module
 * 网格布局渲染器模块统一导出
 *
 * 自动注册约定：
 * - 导出 RendererClass: 渲染器类
 * - 导出 RendererInfo: 渲染器信息
 * - 可选导出 enabled: 是否启用
 */

import { GridstackRenderer } from './GridstackRendererFactory'
import type { RendererInfo } from '../../types/renderer'
import type { RendererModule } from '../../core/RendererAutoRegistry'

// 传统导出（保持向后兼容）
export {
  default as GridstackRenderer,
  createGridstackRenderer,
  getGridstackRendererComponent
} from './GridstackRendererFactory'
export { default as GridstackRendererComponent } from './GridstackRenderer.vue'
export { default as GridstackToolbar } from './GridstackToolbar.vue'

// 类型导出
export type { BaseRenderer, RendererConfig } from '../../types/renderer'
export type { BaseCanvasItem } from '../../types/core'

// 自动注册所需的导出
export const RendererClass = GridstackRenderer

export const GridstackRendererInfo: RendererInfo = {
  id: 'gridstack',
  name: 'Gridstack 网格布局',
  version: '1.0.0',
  description: '基于 gridstack.js 的响应式网格布局渲染器，支持拖拽和调整大小',
  icon: 'grid',
  author: 'ThingsPanel Team',
  capabilities: {
    supportsDrag: true,
    supportsResize: true,
    supportsRotate: false,
    supportsGrouping: false,
    supportsLayers: false,
    supportsSnapping: true,
    supportsPrecisePositioning: false,
    supportsCustomCoordinates: false,
    supportsZoom: false,
    supportsMultiSelect: false,
    supportsKeyboardShortcuts: true,
    supportsContextMenu: true,
    supportsUndo: false,
    supportsClipboard: false,
    supportsDataBinding: true,
    supportsThemes: false,
    supportsExport: false,
    supportsImport: false
  }
}

export const enabled = true

// 兼容导出
export const RendererInfo = GridstackRendererInfo

// 默认导出（符合 RendererModule 接口）
const rendererModule: RendererModule = {
  RendererClass,
  RendererInfo: GridstackRendererInfo,
  enabled
}

export default rendererModule
