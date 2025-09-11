/**
 * 面板编辑器生命周期管理组合式函数
 * 负责组件初始化、监听器设置、清理和销毁等生命周期管理
 */

import { onMounted, onUnmounted, watch } from 'vue'
import { useAppStore } from '@/store/modules/app'

/**
 * 生命周期管理相关函数集合
 */
export function usePanelLifecycleManager(dependencies: {
  // 状态管理
  isEditing: any
  isUnmounted: any
  dataFetched: any
  multiDataSourceConfigStore: any
  selectedWidgetTimer: any

  // 编辑器功能
  stateManager: any
  setPreviewMode: any
  initializePanelData: any
  editorDataSourceManager: any
  handleComponentAdded: any
  handleComponentRemoved: any
  handleComponentConfigChanged: any

  // 事件监听器引用
  dataUpdateListener: any
  statusChangeListener: any
  pollingStatusListener: any

  // 组件通信
  emit: any
}) {
  const appStore = useAppStore()

  /**
   * 设置组件生命周期监听器
   * 监听组件节点变化和配置变化，自动处理组件的添加、删除和配置更新
   */
  const setupComponentLifecycleListeners = () => {
    // 监听组件节点变化
    watch(
      () => dependencies.stateManager.nodes,
      async (newNodes, oldNodes) => {
        if (!newNodes || !oldNodes) return

        // 检测新增的组件
        const oldNodeIds = new Set(oldNodes.map(node => node.id))
        const newNodeIds = new Set(newNodes.map(node => node.id))

        // 处理新增组件
        for (const node of newNodes) {
          if (!oldNodeIds.has(node.id)) {
            await dependencies.handleComponentAdded(node)
          }
        }

        // 处理删除的组件
        for (const oldNode of oldNodes) {
          if (!newNodeIds.has(oldNode.id)) {
            await dependencies.handleComponentRemoved(oldNode.id)
          }
        }
      },
      { deep: true }
    )

    // 监听组件配置变化
    watch(
      () => dependencies.multiDataSourceConfigStore.value,
      (newConfigs, oldConfigs) => {
        if (!newConfigs || !oldConfigs) return

        // 🔥 性能优化：只检测配置变化的组件，避免深度对比
        for (const [componentId, config] of Object.entries(newConfigs)) {
          const oldConfig = oldConfigs[componentId]

          // 简单检查：如果配置对象引用不同，说明可能有变化
          if (!oldConfig || oldConfig !== config) {
            try {
              // 只有在引用不同时才进行深度对比
              const configChanged = !oldConfig || JSON.stringify(config) !== JSON.stringify(oldConfig)
              if (configChanged) {
                dependencies.handleComponentConfigChanged(componentId, config)
              }
            } catch (error) {}
          }
        }

        // 检测删除的配置
        for (const componentId of Object.keys(oldConfigs)) {
          if (!newConfigs[componentId]) {
            // 可以在这里处理配置删除的逻辑
          }
        }
      },
      { deep: true }
    )
  }

  /**
   * V6: 恢复多数据源配置（已弃用）
   * 🔥 修复说明：配置恢复现在已集成到 setState 方法中
   * 这个函数保留用于调试和状态检查
   */
  const restoreMultiDataSourceConfigs = () => {
    if (!dependencies.stateManager?.nodes || dependencies.stateManager.nodes.length === 0) {
      return
    }

    // 🔥 配置恢复现在在 setState 中完成，这里只做状态报告
    return

    const restored: Record<string, any> = {}
    let restoredCount = 0
    let skippedCount = 0

    // 遍历所有节点，从ConfigurationManager恢复配置
    dependencies.stateManager.nodes.forEach(node => {
      const widgetId = node.id

      try {
        // 这里的逻辑已经移到 setState 方法中
        // 保留函数框架用于未来可能的调试需求
      } catch (error) {
        console.error(`❌ [restoreMultiDataSourceConfigs] 恢复配置失败: ${widgetId}`, error)
        skippedCount++
      }
    })

    if (process.env.NODE_ENV === 'development') {
      console.log(`📊 [restoreMultiDataSourceConfigs] 配置恢复完成: ${restoredCount} 成功, ${skippedCount} 跳过`)
    }
    return { restored, restoredCount, skippedCount }
  }

  /**
   * 组件挂载时的初始化逻辑
   */
  const initializeComponent = async () => {
    // 初始化时同步预览模式状态
    dependencies.setPreviewMode(!dependencies.isEditing.value)

    // 执行初始化
    await dependencies.initializePanelData()

    // 发出状态管理器就绪事件，供上层组件使用
    dependencies.emit('state-manager-ready', dependencies.stateManager)
  }

  /**
   * 设置页签刷新监听器
   * 监听应用程序的刷新标志，在页签刷新时重新初始化数据
   */
  const setupPageRefreshWatcher = () => {
    // 🔥 关键修复：监听页签刷新标志，确保页签刷新时重新加载配置
    watch(
      () => appStore.reloadFlag,
      async (newFlag, oldFlag) => {
        // 当 reloadFlag 从 false 变为 true 时，说明页签刷新完成，需要重新初始化
        if (newFlag && !oldFlag && dependencies.dataFetched.value) {
          if (process.env.NODE_ENV === 'development') {
            console.log('🔄 [PanelEditor] 检测到页签刷新，重新初始化面板数据')
          }
          try {
            // 重新初始化面板数据和配置
            await dependencies.initializePanelData()
          } catch (error) {
            console.error('❌ [PanelEditor] 页签刷新后重新初始化失败:', error)
          }
        }
      },
      { immediate: false }
    )
  }

  /**
   * 组件卸载时的清理逻辑
   */
  const cleanupComponent = () => {
    dependencies.isUnmounted.value = true

    // 清理定时器
    if (dependencies.selectedWidgetTimer.value) {
      clearTimeout(dependencies.selectedWidgetTimer.value)
    }

    // 清理事件监听器
    try {
      if (dependencies.dataUpdateListener.value) {
        dependencies.editorDataSourceManager.off('data-updated', dependencies.dataUpdateListener.value)
      }
      if (dependencies.statusChangeListener.value) {
        dependencies.editorDataSourceManager.off('component-status-changed', dependencies.statusChangeListener.value)
      }
      if (dependencies.pollingStatusListener.value) {
        dependencies.editorDataSourceManager.off('polling-status-changed', dependencies.pollingStatusListener.value)
      }
    } catch (error) {
      console.error('❌ [PanelEditor] 数据源事件监听器清理失败:', error)
    }

    // 清理编辑器数据源管理器
    try {
      dependencies.editorDataSourceManager.destroy()
    } catch (error) {
      console.error('❌ [PanelEditor] 编辑器数据源管理器清理失败:', error)
    }
  }

  /**
   * 注册 Vue 生命周期钩子
   */
  const registerLifecycleHooks = () => {
    // 组件挂载
    onMounted(async () => {
      await initializeComponent()
    })

    // 组件卸载
    onUnmounted(() => {
      cleanupComponent()
    })
  }

  /**
   * 初始化所有生命周期管理功能
   */
  const initializeLifecycleManagement = () => {
    // 注册 Vue 生命周期钩子
    registerLifecycleHooks()

    // 设置组件生命周期监听器
    setupComponentLifecycleListeners()

    // 设置页签刷新监听器
    setupPageRefreshWatcher()
  }

  return {
    // 核心初始化函数
    initializeLifecycleManagement,

    // 独立的生命周期管理函数
    setupComponentLifecycleListeners,
    restoreMultiDataSourceConfigs,
    initializeComponent,
    setupPageRefreshWatcher,
    cleanupComponent,
    registerLifecycleHooks
  }
}
