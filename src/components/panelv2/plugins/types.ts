// src/components/panelv2/plugins/types.ts

import type { Component } from 'vue'
import type { PanelCard, ConfigItem, DraggableItem, ToolbarAction } from '../types'

/**
 * 插件元信息
 */
export interface PluginMeta {
  name: string // 插件名称
  version: string // 插件版本
  description?: string // 插件描述
  author?: string // 插件作者
  dependencies?: string[] // 依赖的其他插件
}

/**
 * 插件生命周期钩子
 */
export interface PluginLifecycle {
  onInstall?: (context: PluginContext) => void | Promise<void>
  onUninstall?: (context: PluginContext) => void | Promise<void>
  onActivate?: (context: PluginContext) => void | Promise<void>
  onDeactivate?: (context: PluginContext) => void | Promise<void>
}

/**
 * 插件上下文 - 提供给插件的API
 */
export interface PluginContext {
  // 注册卡片组件
  registerCard: (type: string, component: Component, defaultConfig?: Partial<PanelCard>) => void
  // 注册配置器组件
  registerInspector: (type: string, component: Component) => void
  // 注册可拖拽项
  registerDraggableItem: (item: DraggableItem) => void
  // 注册工具栏动作
  registerToolbarAction: (action: ToolbarAction) => void
  // 获取状态管理器
  getStore: () => any
  // 插件间通信
  emit: (event: string, data?: any) => void
  on: (event: string, handler: (...args: any[]) => void) => void
  off: (event: string, handler: (...args: any[]) => void) => void
}

/**
 * 插件定义
 */
export interface Plugin extends PluginLifecycle {
  meta: PluginMeta
  // 插件提供的卡片组件
  cards?: Record<string, Component>
  // 插件提供的配置器组件
  inspectors?: Record<string, Component>
  // 插件提供的可拖拽项
  draggableItems?: DraggableItem[]
  // 插件提供的工具栏动作
  toolbarActions?: ToolbarAction[]
  // 插件自定义设置
  settings?: Record<string, ConfigItem<any>>
}

/**
 * 插件状态
 */
export interface PluginState {
  installed: boolean
  activated: boolean
  meta: PluginMeta
  error?: string
}

/**
 * 插件管理器配置
 */
export interface PluginManagerOptions {
  autoActivate?: boolean // 安装后自动激活
  allowDuplicates?: boolean // 允许重复安装
  logLevel?: 'debug' | 'info' | 'warn' | 'error' // 日志级别
}

/**
 * 插件加载器接口
 */
export interface PluginLoader {
  load(source: string | Plugin): Promise<Plugin>
}

/**
 * 插件事件
 */
export enum PluginEvent {
  BEFORE_INSTALL = 'plugin:before-install',
  AFTER_INSTALL = 'plugin:after-install',
  BEFORE_UNINSTALL = 'plugin:before-uninstall',
  AFTER_UNINSTALL = 'plugin:after-uninstall',
  BEFORE_ACTIVATE = 'plugin:before-activate',
  AFTER_ACTIVATE = 'plugin:after-activate',
  BEFORE_DEACTIVATE = 'plugin:before-deactivate',
  AFTER_DEACTIVATE = 'plugin:after-deactivate',
  ERROR = 'plugin:error'
}

/**
 * 插件错误
 */
export class PluginError extends Error {
  constructor(
    public pluginName: string,
    public code: string,
    message: string
  ) {
    super(message)
    this.name = 'PluginError'
  }
}
