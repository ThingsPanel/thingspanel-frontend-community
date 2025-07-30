// 渲染器模块统一导出
// Unified exports for renderer modules

// Base layer exports
export * from './base/types'
export * from './base/interfaces'
export * from './base/BaseRenderer'
export * from './base/BaseTool'
export * from './base/BaseToolManager'
export * from './base/RendererManager'

// Renderer implementations
export { default as GridLayoutRenderer } from './grid/GridLayoutRenderer.vue'
export { gridFactory } from './grid/GridFactory'
export * from './grid/types'

// Adapters
export { GridAdapter } from './adapters/GridAdapter'
export type { ExternalPanelData } from './adapters/GridAdapter'

// Components
export { default as BaseToolbar } from './base/BaseToolbar.vue'
export { default as BaseToolbarV2 } from './base/BaseToolbarV2.vue'
export { default as GridConfigForm } from './grid/GridConfigForm.vue'
export { default as GridItem } from './grid/GridItem.vue'

// Utilities
import { RendererManager } from './base/RendererManager'
import { gridFactory } from './grid/GridFactory'
import { defaultToolManager } from './base/BaseToolManager'

/** 创建配置好的渲染器管理器 */
export function createConfiguredRendererManager(container: HTMLElement) {
  const manager = new RendererManager({
    defaultRenderer: 'grid',
    enableSwitching: true,
    container
  })

  // 注册渲染器工厂
  manager.register('grid', gridFactory)

  return manager
}

/** 全局默认工具管理器 */
export { defaultToolManager }

/** 渲染器类型 */
export type RendererType = 'grid' | 'canvas'

/** 渲染器配置 */
export interface RendererConfig {
  type: RendererType
  container: HTMLElement
  config?: any
}

/** 创建渲染器实例 */
export function createRenderer(config: RendererConfig) {
  const manager = createConfiguredRendererManager(config.container)
  return manager.switchToRenderer(config.type, {
    config: config.config,
    preserveData: false
  })
}
