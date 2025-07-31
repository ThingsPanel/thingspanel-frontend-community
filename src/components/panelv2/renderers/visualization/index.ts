/**
 * Visualization Renderer Module
 * 可视化大屏渲染器模块统一导出
 */

export { default as VisualizationRendererComponent } from './VisualizationRenderer.vue'

// 暂时敬请期待，未来会添加：
// export { default as VisualizationRenderer, createVisualizationRenderer } from './VisualizationRendererFactory'

// 类型导出
export type { BaseRenderer, RendererConfig } from '../../types/renderer'
export type { BaseCanvasItem } from '../../types/core'