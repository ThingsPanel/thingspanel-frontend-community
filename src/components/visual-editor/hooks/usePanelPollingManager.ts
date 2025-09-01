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
  editorDataSourceManager: any
}) {
  // 全局轮询开关状态
  const globalPollingEnabled = computed(() => dependencies.pollingManager.isGlobalPollingEnabled())
  const pollingStats = computed(() => dependencies.pollingManager.getStatistics())

  /**
   * 初始化轮询任务并启用全局轮询
   * 扫描所有组件，为启用轮询的组件创建轮询任务
   */
  const initializePollingTasksAndEnable = () => {
    console.log('🚀 [PanelEditor] 启动预览模式轮询')

    try {
      // 🔥 修复重复定时器漏洞：先清除所有现有任务
      console.log('🧹 [PanelEditor] 清除所有现有轮询任务，避免重复定时器')
      dependencies.pollingManager.clearAllTasks()

      // 获取所有组件的轮询配置
      const allComponents = dependencies.stateManager.nodes
      console.log(`🔍 [PanelEditor] 扫描 ${allComponents.length} 个组件的轮询配置`)
      console.log(
        `🔍 [PanelEditor] 所有组件:`,
        allComponents.map(c => ({ id: c.id, type: c.type }))
      )

      allComponents.forEach(component => {
        const componentId = component.id
        console.log(`🔍 [PanelEditor] 开始检查组件: ${componentId} (${component.type})`)

        // 从 ConfigurationManager 读取组件级别的轮询配置
        const config = dependencies.configurationManager.getConfiguration(componentId)
        console.log(`🔍 [PanelEditor] 组件 ${componentId} 完整配置:`, config)

        // 检查配置结构
        console.log(`🔍 [PanelEditor] 组件 ${componentId} 配置结构检查:`, {
          hasConfig: !!config,
          hasComponent: !!config?.component,
          componentKeys: config?.component ? Object.keys(config.component) : [],
          fullConfig: config
        })

        const pollingConfig = config?.component?.polling
        console.log(`🔍 [PanelEditor] 组件 ${componentId} 轮询配置:`, pollingConfig)
        console.log(`🔍 [PanelEditor] 组件 ${componentId} 轮询判断:`, {
          hasPollingConfig: !!pollingConfig,
          isEnabled: pollingConfig?.enabled,
          willCreateTask: !!(pollingConfig && pollingConfig.enabled)
        })

        if (pollingConfig && pollingConfig.enabled) {
          console.log(`✅ [PanelEditor] 组件 ${componentId} 启用轮询:`, pollingConfig)

          const interval = pollingConfig.interval || 30000

          console.log(`▶️ [PanelEditor] 启动组件轮询: ${componentId}, 间隔: ${interval}ms`)

          // 创建轮询任务（但不自动启动）
          const taskId = dependencies.pollingManager.addTask({
            componentId: componentId,
            componentName: `组件-${component.type}`,
            interval: interval,
            callback: async () => {
              console.log(`🔄 [PanelEditor] 轮询触发组件执行: ${componentId}`)
              console.log(`🔄 [PanelEditor] 执行时间: ${new Date().toLocaleTimeString()}`)
              try {
                console.log(`🔍 [PanelEditor] 开始调用执行器: ${componentId}`)
                console.log(`🔍 [PanelEditor] EditorDataSourceManager 状态:`, {
                  isInitialized: dependencies.editorDataSourceManager.isInitialized(),
                  hasManager: !!dependencies.editorDataSourceManager
                })

                // 🔥 直接调用组件执行器，这个应该是正确的方式
                console.log(`🔍 [PanelEditor] 尝试直接触发组件执行器`)

                // 🔥 直接使用 VisualEditorBridge 调用，这个是确定有效的方法
                console.log(`🔍 [PanelEditor] 使用 VisualEditorBridge 直接调用组件执行器`)

                try {
                  // 导入 VisualEditorBridge 并调用
                  const { visualEditorBridge } = await import('@/core/data-architecture/VisualEditorBridge')

                  // 获取组件配置
                  const config = dependencies.configurationManager.getConfiguration(componentId)
                  if (!config || !config.dataSource) {
                    console.warn(`⚠️ [PanelEditor] 组件数据源配置不存在: ${componentId}`)
                    return
                  }

                  console.log(`🔍 [PanelEditor] 找到组件配置，开始执行`)

                  // 获取组件类型
                  const component = dependencies.stateManager.nodes.find(n => n.id === componentId)
                  const componentType = component?.type || 'unknown'

                  console.log(`🔍 [PanelEditor] 调用参数:`, {
                    componentId,
                    componentType,
                    hasDataSourceConfig: !!config.dataSource,
                    dataSourceConfig: config.dataSource
                  })

                  console.log(`🔍 [PanelEditor] 轮询调用前清除缓存: ${componentId}`)

                  // 🔥 关键修复：轮询执行前先清除组件缓存，强制重新获取数据
                  const { simpleDataBridge } = await import('@/core/data-architecture/SimpleDataBridge')
                  simpleDataBridge.clearComponentCache(componentId)

                  const result = await visualEditorBridge.updateComponentExecutor(
                    componentId,
                    componentType,
                    config.dataSource
                  )
                  console.log(`✅ [PanelEditor] VisualEditorBridge 调用成功，执行结果:`, result)
                  console.log(`✅ [PanelEditor] 轮询执行完成: ${componentId}`)
                } catch (bridgeError) {
                  console.error(`❌ [PanelEditor] VisualEditorBridge 调用失败: ${componentId}`, bridgeError)
                  console.warn(`⚠️ [PanelEditor] 轮询执行失败: ${componentId}`)
                }
              } catch (error) {
                console.error(`❌ [PanelEditor] 轮询执行错误: ${componentId}`, error)
              }
            },
            autoStart: false // 统一不自动启动，由全局开关控制
          })

          console.log(`✅ [PanelEditor] 轮询任务已创建: ${componentId} -> ${taskId}`)

          // 启动这个任务
          dependencies.pollingManager.startTask(taskId)
        }
      })

      // 最终轮询任务统计
      const finalStats = dependencies.pollingManager.getStatistics()
      console.log(`📊 [PanelEditor] 轮询任务创建完成，统计信息:`, finalStats)

      // 🔛 启用全局轮询开关
      console.log('🔛 [PanelEditor] 启用全局轮询开关')
      dependencies.pollingManager.enableGlobalPolling()
    } catch (error) {
      console.error('❌ [PanelEditor] 初始化轮询任务失败:', error)
    }
  }

  /**
   * 处理轮询控制器切换事件
   * 当轮询开关状态改变时触发
   */
  const handlePollingToggle = (enabled: boolean) => {
    console.log(`🔄 [PanelEditor] 轮询状态切换: ${enabled ? '启用' : '关闭'}`)

    if (enabled) {
      // 启用时需要先初始化轮询任务
      console.log(`🔄 [PanelEditor] 启用全局轮询前先初始化任务`)
      initializePollingTasksAndEnable()
    }
    // 关闭时 PollingController 组件内部已经处理了
  }

  /**
   * 轮询启用事件处理
   * 当轮询成功启用时触发
   */
  const handlePollingEnabled = () => {
    console.log(`✅ [PanelEditor] 全局轮询已启用`)
  }

  /**
   * 轮询禁用事件处理
   * 当轮询被禁用时触发
   */
  const handlePollingDisabled = () => {
    console.log(`⏸️ [PanelEditor] 全局轮询已暂停`)
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
