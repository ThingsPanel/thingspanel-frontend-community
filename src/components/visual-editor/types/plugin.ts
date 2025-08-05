/**
 * 插件类型定义
 */

// 插件接口
export interface IPlugin {
  name: string
  version: string
  install(_context: PluginContext): void
  uninstall?(): void
}

// 插件上下文
export interface PluginContext {
  hooks: PluginHooks
  registerAPI: (_name: string, _fn: (..._args: any[]) => any) => void
}

// 插件钩子
export interface PluginHooks {
  beforeRender: Hook
  afterRender: Hook
  onNodeSelect: Hook
  onNodeUpdate: Hook
  transformData: Hook
  registerComponent: Hook
}

// 钩子类型
export interface Hook {
  tap: (_name: string, _fn: (..._args: any[]) => any) => void
}

// 插件配置
export interface PluginConfig {
  enabled: boolean
  options: Record<string, any>
}
