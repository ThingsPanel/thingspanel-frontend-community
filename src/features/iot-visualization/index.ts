/**
 * IOT 可视化系统 v3.0 统一导出
 *
 * 架构层次（自下而上）：
 * 1. noyau    - 核心引擎（状态管理、数据源、交互）
 * 2. cartes   - 卡片框架（组件元数据、Card2.1 适配器）
 * 3. renderers - 渲染器层（Vue/Canvas/WebGL）
 * 4. editor   - 编辑器应用（UI界面）
 */

// 导出核心引擎
export * from './noyau'

// 导出卡片框架
export * from './cartes'

// 导出渲染器层
export * from './renderers'

// 导出编辑器应用
export * from './editor'

/**
 * IOT 可视化系统版本
 */
export const IOT_VISUALIZATION_VERSION = '3.0.0'

/**
 * 系统信息
 */
export const IOT_VISUALIZATION_INFO = {
  version: '3.0.0',
  name: 'IOT Visualization System',
  description: '面向未来的物联网可视化系统，极致解耦，支持多渲染器',
  features: {
    coreEngine: 'Noyau (框架无关)',
    cardFramework: 'Cartes (复用 Card2.1)',
    renderers: ['Vue', 'Canvas (未来)', 'WebGL (未来)'],
    editor: 'Full-featured Editor'
  }
} as const
