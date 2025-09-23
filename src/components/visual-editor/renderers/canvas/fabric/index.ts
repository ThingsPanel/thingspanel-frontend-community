/**
 * Fabric.js 渲染器模块导出
 * 基于 Fabric.js 6.7.1 的高级画布渲染系统
 */

// 核心渲染器类
export { default as FabricRenderer } from './FabricRenderer'
export type { FabricRendererConfig, FabricNode } from './FabricRenderer'

// Vue 组件
export { default as FabricCanvasComponent } from './FabricCanvasComponent.vue'

// 工具函数和类型
export * from './types'
export * from './utils'