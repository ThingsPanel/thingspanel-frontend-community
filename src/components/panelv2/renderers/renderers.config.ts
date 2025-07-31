/**
 * Renderers Configuration
 * 渲染器配置文件，定义所有可用的渲染器
 * 
 * 使用说明：
 * 1. 添加新渲染器时，只需在此文件中添加配置即可
 * 2. 移除渲染器时，只需删除或禁用对应配置
 * 3. 无需修改其他文件，系统会自动处理注册
 */

import type { RendererConfig } from '../core/RendererAutoRegistry'

/**
 * 渲染器配置列表
 * 每个配置项包含：
 * - id: 渲染器唯一标识
 * - module: 动态导入函数
 * - enabled: 是否启用（可选，默认true）
 */
export const renderersConfig: RendererConfig[] = [
  {
    id: 'kanban',
    module: () => import('./kanban'),
    enabled: true
  },
  {
    id: 'visualization',
    module: () => import('./visualization'),
    enabled: true
  },
  {
    id: 'gridstack',
    module: () => import('./gridstack'),
    enabled: true
  }
  // 添加新渲染器示例：
  // {
  //   id: 'chart',
  //   module: () => import('./chart'),
  //   enabled: true
  // },
  // {
  //   id: 'table',
  //   module: () => import('./table'),
  //   enabled: false // 禁用状态
  // }
]

/**
 * 获取启用的渲染器配置
 */
export function getEnabledRenderers(): RendererConfig[] {
  return renderersConfig.filter(config => config.enabled !== false)
}

/**
 * 获取渲染器配置
 */
export function getRendererConfig(id: string): RendererConfig | undefined {
  return renderersConfig.find(config => config.id === id)
}

/**
 * 检查渲染器是否启用
 */
export function isRendererEnabled(id: string): boolean {
  const config = getRendererConfig(id)
  return config ? config.enabled !== false : false
}

export default renderersConfig