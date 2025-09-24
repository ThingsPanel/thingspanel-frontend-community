/**
 * Canvas 渲染器模块导出
 * 支持简单平铺渲染和高级 Fabric.js 渲染
 */

// 核心 Canvas 渲染器组件
export { default as CanvasRenderer } from '@/components/visual-editor/renderers/canvas/CanvasRenderer.vue'
export { default as FabricCanvasRenderer } from '@/components/visual-editor/renderers/canvas/FabricCanvasRenderer.vue'
export { default as FabricCanvasWrapper } from '@/components/visual-editor/renderers/canvas/FabricCanvasWrapper.vue'

// Fabric.js 高级渲染器
export * from '@/components/visual-editor/renderers/canvas/fabric'
