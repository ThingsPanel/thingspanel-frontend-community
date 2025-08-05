/**
 * Visualization Renderer Module
 * 可视化大屏渲染器模块统一导出
 *
 * 自动注册约定：
 * - 导出 RendererClass: 渲染器类
 * - 导出 RendererInfo: 渲染器信息
 * - 可选导出 enabled: 是否启用
 */

import { VisualizationRenderer } from './VisualizationRendererFactory'
import type { RendererInfo } from '../../types/renderer'
import type { RendererModule } from '../../core/RendererAutoRegistry'

// 传统导出（保持向后兼容）
export { default as VisualizationRendererComponent } from './VisualizationRenderer.vue'
export {
  default as VisualizationRenderer,
  createVisualizationRenderer,
  getVisualizationRendererComponent
} from './VisualizationRendererFactory'

// 类型导出
export type { BaseRenderer, RendererConfig } from '../../types/renderer'
export type { BaseCanvasItem } from '../../types/core'

// 自动注册所需的导出
export const RendererClass = VisualizationRenderer

const rendererInfo: RendererInfo = {
  id: 'visualization',
  name: '可视化大屏',
  version: '1.0.0',
  description: '可视化大屏渲染器，支持复杂的数据可视化和交互效果',
  icon: 'desktop',
  author: 'ThingsPanel Team',
  capabilities: {
    supportsDrag: true,
    supportsResize: true,
    supportsRotate: true,
    supportsGrouping: true,
    supportsLayers: true,
    supportsSnapping: true,
    supportsPrecisePositioning: true,
    supportsCustomCoordinates: true,
    supportsZoom: true,
    supportsMultiSelect: true,
    supportsKeyboardShortcuts: true,
    supportsContextMenu: true,
    supportsUndo: true,
    supportsClipboard: true,
    supportsDataBinding: true,
    supportsThemes: true,
    supportsExport: true,
    supportsImport: true
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
