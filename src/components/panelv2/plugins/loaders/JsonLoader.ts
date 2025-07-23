// src/components/panelv2/plugins/loaders/JsonLoader.ts

import type { Plugin, PluginLoader } from '../types'
import { PluginError } from '../types'

/**
 * JSON配置加载器
 * 从JSON配置文件加载插件定义
 */
export class JsonLoader implements PluginLoader {
  private componentResolver?: (componentPath: string) => Promise<any>

  constructor(componentResolver?: (componentPath: string) => Promise<any>) {
    this.componentResolver = componentResolver
  }

  async load(source: string): Promise<Plugin> {
    if (!source.endsWith('.json')) {
      throw new PluginError('unknown', 'INVALID_SOURCE', 'JSON source must be a .json file')
    }

    try {
      // 加载JSON配置
      const response = await fetch(source)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const config = await response.json()

      // 验证配置格式
      if (!this.isValidConfig(config)) {
        throw new PluginError('unknown', 'INVALID_CONFIG', 'Invalid plugin configuration')
      }

      // 构建插件对象
      const plugin: Plugin = {
        meta: config.meta,
        onInstall: config.onInstall ? this.createHook(config.onInstall) : undefined,
        onUninstall: config.onUninstall ? this.createHook(config.onUninstall) : undefined,
        onActivate: config.onActivate ? this.createHook(config.onActivate) : undefined,
        onDeactivate: config.onDeactivate ? this.createHook(config.onDeactivate) : undefined,
        cards: {},
        inspectors: {},
        draggableItems: config.draggableItems || [],
        toolbarActions: config.toolbarActions || [],
        settings: config.settings || {}
      }

      // 加载组件
      if (config.cards && this.componentResolver) {
        for (const [key, path] of Object.entries(config.cards)) {
          plugin.cards![key] = await this.componentResolver(path as string)
        }
      }

      if (config.inspectors && this.componentResolver) {
        for (const [key, path] of Object.entries(config.inspectors)) {
          plugin.inspectors![key] = await this.componentResolver(path as string)
        }
      }

      return plugin
    } catch (error) {
      throw new PluginError('unknown', 'LOAD_FAILED', `Failed to load JSON config: ${error.message}`)
    }
  }

  private isValidConfig(config: any): boolean {
    return (
      config &&
      typeof config === 'object' &&
      config.meta &&
      typeof config.meta.name === 'string' &&
      typeof config.meta.version === 'string'
    )
  }

  private createHook(hookConfig: any): (context: any) => void {
    // 简单的钩子实现，实际应用中可能需要更复杂的逻辑
    return new Function('context', hookConfig.code || '') as (context: any) => void
  }
}
