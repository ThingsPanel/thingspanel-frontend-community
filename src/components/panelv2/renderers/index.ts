/**
 * Renderers Module
 * 渲染器模块统一导出入口
 *
 * 新架构说明：
 * - 使用自动注册系统，无需手动导入每个渲染器
 * - 渲染器配置在 renderers.config.ts 中管理
 * - 添加新渲染器只需在配置文件中添加即可
 */

// 自动注册系统
export * from '../core/RendererAutoRegistry'
export { default as renderersConfig } from './renderers.config'

// 传统导出（保持向后兼容）
export * from './kanban'
export * from './visualization'

// 注册中心
export * from './registry/RendererRegistry'

// 类型定义
export type { BaseRenderer, RendererConfig, RendererInfo } from '../types/renderer'
export type { BaseCanvasItem } from '../types/core'
export type { RendererModule, RendererConfig as AutoRendererConfig } from '../core/RendererAutoRegistry'
