// src/components/panelv2/plugins/loaders/ModuleLoader.ts

import type { Plugin, PluginLoader } from '../types'
import { PluginError } from '../types'

/**
 * ES模块加载器
 * 支持从URL动态加载插件模块
 */
export class ModuleLoader implements PluginLoader {
  async load(source: string): Promise<Plugin> {
    if (!source.endsWith('.js') && !source.endsWith('.ts')) {
      throw new PluginError('unknown', 'INVALID_SOURCE', 'Module source must be a .js or .ts file')
    }

    try {
      // 动态导入模块
      const module = await import(/* @vite-ignore */ source)

      // 验证插件格式
      const plugin = module.default || module

      if (!this.isValidPlugin(plugin)) {
        throw new PluginError('unknown', 'INVALID_PLUGIN', 'Module does not export a valid plugin')
      }

      return plugin as Plugin
    } catch (error) {
      throw new PluginError('unknown', 'LOAD_FAILED', `Failed to load module: ${error.message}`)
    }
  }

  private isValidPlugin(obj: any): boolean {
    return (
      obj &&
      typeof obj === 'object' &&
      obj.meta &&
      typeof obj.meta.name === 'string' &&
      typeof obj.meta.version === 'string'
    )
  }
}
