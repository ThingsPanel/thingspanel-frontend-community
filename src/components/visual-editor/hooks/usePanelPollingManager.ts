/**
 * 面板编辑器轮询管理组合式函数
 * 负责轮询任务的初始化、管理和控制
 */

import { computed } from 'vue'

/**
 * 轮询管理相关函数集合
 */
export function usePanelPollingManager(dependencies: {
  pollingManager: any
  stateManager: any
  configurationManager: any
  editorDataSourceManager?: any // 🔥 修复：设为可选参数，兼容新架构
}) {
  // 全局轮询开关状态
  const globalPollingEnabled = computed(() => dependencies.pollingManager.isGlobalPollingEnabled())
  const pollingStats = computed(() => dependencies.pollingManager.getStatistics())

  /**
   * 初始化轮询任务并启用全局轮询
   * 扫描所有组件，为启用轮询的组件创建轮询任务
   */
  const initializePollingTasksAndEnable = () => {
    try {
      // 🔥 修复重复定时器漏洞：先清除所有现有任务
      dependencies.pollingManager.clearAllTasks()

      // 获取所有组件的轮询配置
      const allComponents = dependencies.stateManager.nodes
      if (process.env.NODE_ENV === 'development') {
        console.log(`🔥 [PanelPollingManager] 扫描 ${allComponents.length} 个组件的轮询配置`)
      }

      allComponents.forEach(component => {
        const componentId = component.id
        // 从 ConfigurationManager 读取组件级别的轮询配置
        const config = dependencies.configurationManager.getConfiguration(componentId)

        if (process.env.NODE_ENV === 'development') {
          console.log(`🔥 [PanelPollingManager] 组件 ${componentId} 配置:`, {
            hasConfig: !!config,
            hasComponent: !!config?.component,
            hasPolling: !!config?.component?.polling,
            pollingConfig: config?.component?.polling,
            hasDataSource: !!config?.dataSource
          })
        }

        let pollingConfig = config?.component?.polling

        // 🔥 关键修复：预览模式下自动启用轮询（如果组件有数据源）
        if (!pollingConfig && config?.dataSource) {
          if (process.env.NODE_ENV === 'development') {
            console.log(`🔥 [PanelPollingManager] 组件 ${componentId} 没有轮询配置，但有数据源，自动启用轮询`)
          }
          pollingConfig = {
            enabled: true,
            interval: 30000,
            immediate: true
          }

          // 保存轮询配置到组件配置中
          dependencies.configurationManager.updateConfiguration(componentId, 'component.polling', pollingConfig)
        }

        if (pollingConfig && pollingConfig.enabled) {
          if (process.env.NODE_ENV === 'development') {
            console.log(`✅ [PanelPollingManager] 组件 ${componentId} 轮询已启用，间隔: ${pollingConfig.interval}ms`)
          }

          const interval = pollingConfig.interval || 30000

          // 创建轮询任务（但不自动启动）
          const taskId = dependencies.pollingManager.addTask({
            componentId: componentId,
            componentName: `组件-${component.type}`,
            interval: interval,
            callback: async () => {
              try {
                // 🔥 直接调用组件执行器，这个应该是正确的方式
                // 🔥 直接使用 VisualEditorBridge 调用，这个是确定有效的方法
                try {
                  // 导入 VisualEditorBridge 并调用
                  const { getVisualEditorBridge } = await import('@/core/data-architecture/VisualEditorBridge')
                  const visualEditorBridge = getVisualEditorBridge()

                  // 获取组件配置
                  const config = dependencies.configurationManager.getConfiguration(componentId)
                  if (!config || !config.dataSource) {
                    console.error(`⚠️ [PanelPollingManager] 组件数据源配置不存在: ${componentId}`)
                    return
                  }

                  if (process.env.NODE_ENV === 'development') {
                    console.log(`🔥 [PanelPollingManager] 执行轮询: ${componentId}`)
                  }

                  // 获取组件类型
                  const component = dependencies.stateManager.nodes.find(n => n.id === componentId)
                  const componentType = component?.type || 'unknown'

                  // 🔥 关键修复：轮询执行前先清除组件缓存，强制重新获取数据
                  const { simpleDataBridge } = await import('@/core/data-architecture/SimpleDataBridge')
                  simpleDataBridge.clearComponentCache(componentId)

                  const result = await visualEditorBridge.updateComponentExecutor(
                    componentId,
                    componentType,
                    config.dataSource
                  )
                  if (process.env.NODE_ENV === 'development') {
                    console.log(`✅ [PanelPollingManager] 轮询完成: ${componentId}`, result?.success)
                  }
                } catch (bridgeError) {
                  console.error(`❌ [PanelPollingManager] VisualEditorBridge 调用失败: ${componentId}`, bridgeError)
                  console.error(`⚠️ [PanelPollingManager] 轮询执行失败: ${componentId}`)
                }
              } catch (error) {
                console.error(`❌ [PanelPollingManager] 轮询执行错误: ${componentId}`, error)
              }
            },
            autoStart: false // 统一不自动启动，由全局开关控制
          })

          if (process.env.NODE_ENV === 'development') {
            console.log(`✅ [PanelPollingManager] 轮询任务已创建: ${taskId}`)
          }

          // 启动这个任务
          dependencies.pollingManager.startTask(taskId)
        } else {
          if (process.env.NODE_ENV === 'development') {
            console.log(`⚠️ [PanelPollingManager] 组件 ${componentId} 轮询未启用或无数据源`)
          }
        }
      })

      // 最终轮询任务统计
      const finalStats = dependencies.pollingManager.getStatistics()
      if (process.env.NODE_ENV === 'development') {
        console.log(`🔥 [PanelPollingManager] 轮询初始化完成:`, finalStats)
      }

      // 🔛 启用全局轮询开关
      dependencies.pollingManager.enableGlobalPolling()
    } catch (error) {
      console.error('❌ [PanelPollingManager] 初始化轮询任务失败:', error)
    }
  }

  /**
   * 处理轮询控制器切换事件
   * 当轮询开关状态改变时触发
   */
  const handlePollingToggle = (enabled: boolean) => {
    if (process.env.NODE_ENV === 'development') {
    }

    if (enabled) {
      // 启用时需要先初始化轮询任务
      initializePollingTasksAndEnable()
    }
    // 关闭时 PollingController 组件内部已经处理了
  }

  /**
   * 轮询启用事件处理
   * 当轮询成功启用时触发
   */
  const handlePollingEnabled = () => {
    if (process.env.NODE_ENV === 'development') {
    }
  }

  /**
   * 轮询禁用事件处理
   * 当轮询被禁用时触发
   */
  const handlePollingDisabled = () => {
  }

  return {
    // 状态变量
    globalPollingEnabled,
    pollingStats,

    // 轮询管理函数
    initializePollingTasksAndEnable,
    handlePollingToggle,
    handlePollingEnabled,
    handlePollingDisabled
  }
}
