// src/components/panelv2/plugins/PluginManager.ts

import type { Component } from 'vue'
import type { Plugin, PluginContext, PluginState, PluginManagerOptions, PluginLoader } from './types'
import { PluginEvent, PluginError } from './types'
import type { DraggableItem, ToolbarAction } from '../types'
import { usePanelStore } from '../state/panelStore'

/**
 * 插件管理器
 * 负责插件的加载、注册、生命周期管理等
 */
export class PluginManager {
  // 已安装的插件
  private plugins: Map<string, Plugin> = new Map()
  // 插件状态
  private pluginStates: Map<string, PluginState> = new Map()
  // 卡片组件注册表
  private cardRegistry: Map<string, Component> = new Map()
  // 配置器组件注册表
  private inspectorRegistry: Map<string, Component> = new Map()
  // 可拖拽项列表
  private draggableItems: DraggableItem[] = []
  // 工具栏动作列表
  private toolbarActions: ToolbarAction[] = []
  // 事件监听器
  private eventListeners: Map<string, Set<(...args: any[]) => void>> = new Map()
  // 配置选项
  private options: PluginManagerOptions
  // 插件加载器
  private loaders: PluginLoader[] = []

  constructor(options: PluginManagerOptions = {}) {
    this.options = {
      autoActivate: true,
      allowDuplicates: false,
      logLevel: 'info',
      ...options
    }
  }

  /**
   * 安装插件
   */
  async install(plugin: Plugin): Promise<void> {
    const { name } = plugin.meta

    // 检查是否已安装
    if (!this.options.allowDuplicates && this.plugins.has(name)) {
      throw new PluginError(name, 'ALREADY_INSTALLED', `Plugin ${name} is already installed`)
    }

    // 检查依赖
    if (plugin.meta.dependencies) {
      for (const dep of plugin.meta.dependencies) {
        if (!this.plugins.has(dep)) {
          throw new PluginError(name, 'MISSING_DEPENDENCY', `Missing dependency: ${dep}`)
        }
      }
    }

    this.emit(PluginEvent.BEFORE_INSTALL, { plugin })

    try {
      // 创建插件上下文
      const context = this.createPluginContext(name)

      // 调用插件的安装钩子
      if (plugin.onInstall) {
        await plugin.onInstall(context)
      }

      // 注册插件提供的组件
      this.registerPluginComponents(plugin)

      // 保存插件
      this.plugins.set(name, plugin)
      this.pluginStates.set(name, {
        installed: true,
        activated: false,
        meta: plugin.meta
      })

      this.emit(PluginEvent.AFTER_INSTALL, { plugin })

      // 自动激活
      if (this.options.autoActivate) {
        await this.activate(name)
      }

      this.log('info', `Plugin ${name} installed successfully`)
    } catch (error) {
      this.emit(PluginEvent.ERROR, { plugin, error })
      throw new PluginError(name, 'INSTALL_FAILED', `Failed to install plugin: ${error.message}`)
    }
  }

  /**
   * 卸载插件
   */
  async uninstall(name: string): Promise<void> {
    const plugin = this.plugins.get(name)
    if (!plugin) {
      throw new PluginError(name, 'NOT_FOUND', `Plugin ${name} not found`)
    }

    this.emit(PluginEvent.BEFORE_UNINSTALL, { plugin })

    try {
      // 先停用插件
      if (this.isActivated(name)) {
        await this.deactivate(name)
      }

      // 创建插件上下文
      const context = this.createPluginContext(name)

      // 调用插件的卸载钩子
      if (plugin.onUninstall) {
        await plugin.onUninstall(context)
      }

      // 注销插件提供的组件
      this.unregisterPluginComponents(plugin)

      // 删除插件
      this.plugins.delete(name)
      this.pluginStates.delete(name)

      this.emit(PluginEvent.AFTER_UNINSTALL, { plugin })
      this.log('info', `Plugin ${name} uninstalled successfully`)
    } catch (error) {
      this.emit(PluginEvent.ERROR, { plugin, error })
      throw new PluginError(name, 'UNINSTALL_FAILED', `Failed to uninstall plugin: ${error.message}`)
    }
  }

  /**
   * 激活插件
   */
  async activate(name: string): Promise<void> {
    const plugin = this.plugins.get(name)
    const state = this.pluginStates.get(name)

    if (!plugin || !state) {
      throw new PluginError(name, 'NOT_FOUND', `Plugin ${name} not found`)
    }

    if (state.activated) {
      return
    }

    this.emit(PluginEvent.BEFORE_ACTIVATE, { plugin })

    try {
      const context = this.createPluginContext(name)

      if (plugin.onActivate) {
        await plugin.onActivate(context)
      }

      state.activated = true
      this.emit(PluginEvent.AFTER_ACTIVATE, { plugin })
      this.log('info', `Plugin ${name} activated`)
    } catch (error) {
      this.emit(PluginEvent.ERROR, { plugin, error })
      throw new PluginError(name, 'ACTIVATE_FAILED', `Failed to activate plugin: ${error.message}`)
    }
  }

  /**
   * 停用插件
   */
  async deactivate(name: string): Promise<void> {
    const plugin = this.plugins.get(name)
    const state = this.pluginStates.get(name)

    if (!plugin || !state) {
      throw new PluginError(name, 'NOT_FOUND', `Plugin ${name} not found`)
    }

    if (!state.activated) {
      return
    }

    this.emit(PluginEvent.BEFORE_DEACTIVATE, { plugin })

    try {
      const context = this.createPluginContext(name)

      if (plugin.onDeactivate) {
        await plugin.onDeactivate(context)
      }

      state.activated = false
      this.emit(PluginEvent.AFTER_DEACTIVATE, { plugin })
      this.log('info', `Plugin ${name} deactivated`)
    } catch (error) {
      this.emit(PluginEvent.ERROR, { plugin, error })
      throw new PluginError(name, 'DEACTIVATE_FAILED', `Failed to deactivate plugin: ${error.message}`)
    }
  }

  /**
   * 创建插件上下文
   */
  private createPluginContext(pluginName: string): PluginContext {
    return {
      registerCard: (type: string, component: Component, defaultConfig?: any) => {
        this.cardRegistry.set(`${pluginName}:${type}`, component)
        this.log('debug', `Registered card ${type} from plugin ${pluginName}`)
      },

      registerInspector: (type: string, component: Component) => {
        this.inspectorRegistry.set(`${pluginName}:${type}`, component)
        this.log('debug', `Registered inspector ${type} from plugin ${pluginName}`)
      },

      registerDraggableItem: (item: DraggableItem) => {
        this.draggableItems.push({
          ...item,
          type: `${pluginName}:${item.type}`
        })
        this.log('debug', `Registered draggable item ${item.type} from plugin ${pluginName}`)
      },

      registerToolbarAction: (action: ToolbarAction) => {
        this.toolbarActions.push({
          ...action,
          id: `${pluginName}:${action.id}`
        })
        this.log('debug', `Registered toolbar action ${action.id} from plugin ${pluginName}`)
      },

      getStore: () => usePanelStore(),

      emit: (event: string, data?: any) => {
        this.emit(`${pluginName}:${event}`, data)
      },

      on: (event: string, handler: (...args: any[]) => void) => {
        this.on(`${pluginName}:${event}`, handler)
      },

      off: (event: string, handler: (...args: any[]) => void) => {
        this.off(`${pluginName}:${event}`, handler)
      }
    }
  }

  /**
   * 注册插件提供的组件
   */
  private registerPluginComponents(plugin: Plugin): void {
    const { name } = plugin.meta

    // 注册卡片组件
    if (plugin.cards) {
      Object.entries(plugin.cards).forEach(([type, component]) => {
        this.cardRegistry.set(`${name}:${type}`, component)
      })
    }

    // 注册配置器组件
    if (plugin.inspectors) {
      Object.entries(plugin.inspectors).forEach(([type, component]) => {
        this.inspectorRegistry.set(`${name}:${type}`, component)
      })
    }

    // 注册可拖拽项
    if (plugin.draggableItems) {
      plugin.draggableItems.forEach(item => {
        this.draggableItems.push({
          ...item,
          type: `${name}:${item.type}`
        })
      })
    }

    // 注册工具栏动作
    if (plugin.toolbarActions) {
      plugin.toolbarActions.forEach(action => {
        this.toolbarActions.push({
          ...action,
          id: `${name}:${action.id}`
        })
      })
    }
  }

  /**
   * 注销插件提供的组件
   */
  private unregisterPluginComponents(plugin: Plugin): void {
    const { name } = plugin.meta
    const prefix = `${name}:`

    // 注销卡片组件
    Array.from(this.cardRegistry.keys())
      .filter(key => key.startsWith(prefix))
      .forEach(key => this.cardRegistry.delete(key))

    // 注销配置器组件
    Array.from(this.inspectorRegistry.keys())
      .filter(key => key.startsWith(prefix))
      .forEach(key => this.inspectorRegistry.delete(key))

    // 注销可拖拽项
    this.draggableItems = this.draggableItems.filter(item => !item.type.startsWith(prefix))

    // 注销工具栏动作
    this.toolbarActions = this.toolbarActions.filter(action => !action.id.startsWith(prefix))
  }

  /**
   * 获取所有已安装的插件
   */
  getInstalledPlugins(): PluginState[] {
    return Array.from(this.pluginStates.values())
  }

  /**
   * 检查插件是否已安装
   */
  isInstalled(name: string): boolean {
    return this.plugins.has(name)
  }

  /**
   * 检查插件是否已激活
   */
  isActivated(name: string): boolean {
    const state = this.pluginStates.get(name)
    return state?.activated || false
  }

  /**
   * 获取卡片组件注册表
   */
  getCardRegistry(): Record<string, Component> {
    return Object.fromEntries(this.cardRegistry)
  }

  /**
   * 获取配置器组件注册表
   */
  getInspectorRegistry(): Record<string, Component> {
    return Object.fromEntries(this.inspectorRegistry)
  }

  /**
   * 获取可拖拽项列表
   */
  getDraggableItems(): DraggableItem[] {
    return [...this.draggableItems]
  }

  /**
   * 获取工具栏动作列表
   */
  getToolbarActions(): ToolbarAction[] {
    return [...this.toolbarActions]
  }

  /**
   * 添加插件加载器
   */
  addLoader(loader: PluginLoader): void {
    this.loaders.push(loader)
  }

  /**
   * 从源加载插件
   */
  async loadPlugin(source: string | Plugin): Promise<void> {
    let plugin: Plugin

    if (typeof source === 'string') {
      // 使用加载器加载插件
      for (const loader of this.loaders) {
        try {
          plugin = await loader.load(source)
          break
        } catch (error) {
          // 继续尝试下一个加载器
        }
      }

      if (!plugin) {
        throw new PluginError('unknown', 'LOAD_FAILED', `Failed to load plugin from ${source}`)
      }
    } else {
      plugin = source
    }

    await this.install(plugin)
  }

  /**
   * 事件发射
   */
  private emit(event: string, data?: any): void {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      listeners.forEach(listener => listener(data))
    }
  }

  /**
   * 事件监听
   */
  on(event: string, handler: (...args: any[]) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set())
    }
    this.eventListeners.get(event)!.add(handler)
  }

  /**
   * 取消事件监听
   */
  off(event: string, handler: (...args: any[]) => void): void {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      listeners.delete(handler)
    }
  }

  /**
   * 日志输出
   */
  private log(level: string, message: string): void {
    const levels = ['debug', 'info', 'warn', 'error']
    const currentLevel = levels.indexOf(this.options.logLevel || 'info')
    const messageLevel = levels.indexOf(level)

    if (messageLevel >= currentLevel) {
      console[level](`[PluginManager] ${message}`)
    }
  }
}
