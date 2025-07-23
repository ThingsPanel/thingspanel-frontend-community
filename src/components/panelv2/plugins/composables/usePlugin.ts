// src/components/panelv2/plugins/composables/usePlugin.ts

import { inject, provide, computed, ref, onMounted, onUnmounted } from 'vue'
import type { PluginManager } from '../PluginManager'
import type { Plugin, PluginContext } from '../types'

const PLUGIN_MANAGER_KEY = Symbol('pluginManager')

/**
 * 提供插件管理器
 */
export function providePluginManager(manager: PluginManager) {
  provide(PLUGIN_MANAGER_KEY, manager)
}

/**
 * 注入插件管理器
 */
export function injectPluginManager(): PluginManager | undefined {
  return inject<PluginManager>(PLUGIN_MANAGER_KEY)
}

/**
 * 使用插件管理器的组合式API
 */
export function usePluginManager() {
  const manager = injectPluginManager()

  if (!manager) {
    throw new Error('PluginManager not provided. Make sure to call providePluginManager in a parent component.')
  }

  // 响应式状态
  const installedPlugins = ref(manager.getInstalledPlugins())
  const cardRegistry = ref(manager.getCardRegistry())
  const inspectorRegistry = ref(manager.getInspectorRegistry())
  const draggableItems = ref(manager.getDraggableItems())
  const toolbarActions = ref(manager.getToolbarActions())

  // 更新状态
  const updateState = () => {
    installedPlugins.value = manager.getInstalledPlugins()
    cardRegistry.value = manager.getCardRegistry()
    inspectorRegistry.value = manager.getInspectorRegistry()
    draggableItems.value = manager.getDraggableItems()
    toolbarActions.value = manager.getToolbarActions()
  }

  // 监听插件事件
  const handlers = {
    afterInstall: updateState,
    afterUninstall: updateState,
    afterActivate: updateState,
    afterDeactivate: updateState
  }

  onMounted(() => {
    Object.entries(handlers).forEach(([event, handler]) => {
      manager.on(`plugin:${event}`, handler)
    })
  })

  onUnmounted(() => {
    Object.entries(handlers).forEach(([event, handler]) => {
      manager.off(`plugin:${event}`, handler)
    })
  })

  return {
    // 状态
    installedPlugins: computed(() => installedPlugins.value),
    cardRegistry: computed(() => cardRegistry.value),
    inspectorRegistry: computed(() => inspectorRegistry.value),
    draggableItems: computed(() => draggableItems.value),
    toolbarActions: computed(() => toolbarActions.value),

    // 方法
    installPlugin: (plugin: Plugin) => manager.install(plugin),
    uninstallPlugin: (name: string) => manager.uninstall(name),
    activatePlugin: (name: string) => manager.activate(name),
    deactivatePlugin: (name: string) => manager.deactivate(name),
    loadPlugin: (source: string | Plugin) => manager.loadPlugin(source),
    isInstalled: (name: string) => manager.isInstalled(name),
    isActivated: (name: string) => manager.isActivated(name),

    // 原始管理器实例
    manager
  }
}

/**
 * 插件开发者使用的组合式API
 */
export function usePluginContext(): PluginContext {
  const manager = injectPluginManager()

  if (!manager) {
    throw new Error('PluginManager not provided')
  }

  // 创建一个临时的插件上下文
  // 实际应用中，这应该从当前执行的插件获取
  const context: PluginContext = {
    registerCard: () => {
      console.warn('registerCard called outside of plugin lifecycle')
    },
    registerInspector: () => {
      console.warn('registerInspector called outside of plugin lifecycle')
    },
    registerDraggableItem: () => {
      console.warn('registerDraggableItem called outside of plugin lifecycle')
    },
    registerToolbarAction: () => {
      console.warn('registerToolbarAction called outside of plugin lifecycle')
    },
    getStore: () => {
      console.warn('getStore called outside of plugin lifecycle')
      return null
    },
    emit: () => {
      console.warn('emit called outside of plugin lifecycle')
    },
    on: () => {
      console.warn('on called outside of plugin lifecycle')
    },
    off: () => {
      console.warn('off called outside of plugin lifecycle')
    }
  }

  return context
}
