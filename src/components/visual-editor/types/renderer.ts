/**
 * 渲染器类型定义
 */

// 渲染器类型
export type RendererType = 'canvas' | 'gridstack' | 'kanban' | 'dashboard' | 'report' | 'three-d'

// 渲染器接口
export interface IRenderer {
  init(): void
  render(): void
  destroy(): void
  sleep?(): void
  wakeup?(): void
}

// 渲染器配置
export interface RendererConfig {
  type: RendererType
  name: string
  description: string
  supportedComponents: string[]
}
