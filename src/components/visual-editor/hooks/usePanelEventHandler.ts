/**
 * 面板编辑器事件处理组合式函数
 * 负责UI交互、拖拽、组件操作、导入导出等事件处理
 */

import { useMessage } from 'naive-ui'
import { $t } from '@/locales'
import type { RendererType } from '@/components/visual-editor/types'

/**
 * 事件处理相关函数集合
 */
export function usePanelEventHandler(
  props: { panelId: string },
  dependencies: {
    // 状态管理
    showLeftDrawer: any
    showRightDrawer: any
    isDragging: any
    draggedComponent: any
    currentRenderer: any
    showWidgetTitles: any
    hasChanges: any
    multiDataSourceStore: any
    multiDataSourceConfigStore: any
    selectedNodeId: any

    // 配置管理
    editorConfig: any
    panelData: any

    // 编辑器功能
    stateManager: any
    addWidget: any
    setState: any
    getState: any
    getDefaultConfig: any
    selectNode: any
    editorDataSourceManager: any
  }
) {
  const message = useMessage()

  // ===== 抽屉控制事件处理 =====

  /**
   * 切换左侧抽屉显示状态
   */
  const handleToggleLeftDrawer = () => {
    dependencies.showLeftDrawer.value = !dependencies.showLeftDrawer.value
    dependencies.hasChanges.value = true
  }

  /**
   * 切换右侧抽屉显示状态
   */
  const handleToggleRightDrawer = () => {
    dependencies.showRightDrawer.value = !dependencies.showRightDrawer.value
    dependencies.hasChanges.value = true
  }

  // ===== 拖拽事件处理 =====

  /**
   * 开始拖拽组件
   * @param componentType 组件类型
   */
  const handleDragStart = (componentType: string) => {
    dependencies.isDragging.value = true
    dependencies.draggedComponent.value = componentType
  }

  /**
   * 结束拖拽
   */
  const handleDragEnd = () => {
    dependencies.isDragging.value = false
    dependencies.draggedComponent.value = null
  }

  // ===== 渲染器和视图控制 =====

  /**
   * 处理渲染器变更
   * @param renderer 新的渲染器类型
   */
  const handleRendererChange = (renderer: RendererType) => {
    if (process.env.NODE_ENV === 'development') {
    }
    dependencies.currentRenderer.value = renderer
    dependencies.hasChanges.value = true
  }

  /**
   * 切换组件标题显示状态
   * @param value 是否显示标题
   */
  const handleToggleWidgetTitles = (value: boolean) => {
    dependencies.showWidgetTitles.value = value
    dependencies.hasChanges.value = true
  }

  // ===== 组件操作事件处理 =====

  /**
   * 添加组件到编辑器
   * @param widget 组件信息
   */
  const handleAddWidget = async (widget: { type: string }) => {
    try {
      const widgetType = widget.type

      await dependencies.addWidget(widgetType)
      dependencies.hasChanges.value = true
      message.success($t('visualEditor.addWidgetSuccess', { type: widgetType }))
    } catch (error: any) {
      const widgetType = widget.type
      console.error(`❌ 添加组件失败 [${widgetType}]:`, error)
      message.error($t('visualEditor.addWidgetFailed', { type: widgetType, error: error.message || '未知错误' }))
    }
  }

  /**
   * 清除所有组件
   */
  const handleClearAll = () => {
    dependencies.stateManager.reset()
    dependencies.hasChanges.value = true
    message.success($t('visualEditor.clearAllSuccess'))
  }

  // ===== 导入导出处理 =====

  /**
   * 导入配置
   * @param config 配置对象
   */
  const handleImportConfig = (config: Record<string, any>) => {
    try {
      if (process.env.NODE_ENV === 'development') {
      }

      // 验证配置格式
      if (config && typeof config === 'object') {
        // 如果是新格式配置
        if (config.visualEditor) {
          dependencies.editorConfig.value = config.visualEditor
          dependencies.setState(config.visualEditor)
        }
        // 如果是直接的编辑器配置
        else if (config.nodes || config.canvasConfig) {
          dependencies.editorConfig.value = config
          dependencies.setState(config)
        }
        // 否则当作旧格式处理
        else {
          const newConfig = dependencies.getDefaultConfig()
          dependencies.editorConfig.value = newConfig
          dependencies.setState(newConfig)
        }

        dependencies.hasChanges.value = true
        message.success($t('visualEditor.configImportSuccess'))
      } else {
        throw new Error('Invalid config format')
      }
    } catch (error: any) {
      console.error('导入配置失败:', error)
      message.error($t('visualEditor.configImportFailed', { error: error.message || '未知错误' }))
    }
  }

  /**
   * 导出配置
   */
  const handleExportConfig = () => {
    try {
      const currentState = dependencies.getState()
      const exportConfig = {
        visualEditor: {
          ...currentState,
          metadata: {
            version: '1.0.0',
            exportedAt: Date.now(),
            editorType: 'visual-editor',
            // 导出时的面板信息
            panelInfo: {
              id: props.panelId,
              name: dependencies.panelData.value?.name || '',
              homeFlag: dependencies.panelData.value?.home_flag || false,
              exportedAt: Date.now()
            },
            // 导出时的编辑器状态
            exportInfo: {
              totalNodes: currentState.nodes.length,
              rendererType: currentState.currentRenderer,
              hasGridConfig: !!currentState.gridConfig,
              hasCanvasConfig: !!currentState.canvasConfig,
              showWidgetTitles: currentState.showWidgetTitles
            }
          }
        }
      }

      // 创建下载链接
      const blob = new Blob([JSON.stringify(exportConfig, null, 2)], {
        type: 'application/json'
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `panel-config-${dependencies.panelData.value?.name || 'unnamed'}-${Date.now()}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      message.success($t('visualEditor.configExportSuccess'))
    } catch (error: any) {
      console.error('导出配置失败:', error)
      message.error($t('visualEditor.configExportFailed', { error: error.message || '未知错误' }))
    }
  }

  // ===== 配置变更处理 =====

  /**
   * 处理网格配置变更
   * @param newGridConfig 新的网格配置
   */
  const handleGridConfigChange = (newGridConfig: any) => {
    dependencies.editorConfig.value.gridConfig = { ...dependencies.editorConfig.value.gridConfig, ...newGridConfig }
    dependencies.hasChanges.value = true
  }

  /**
   * 处理Gridstack配置变更
   * @param newGridConfig 新的Gridstack配置
   */
  const handleGridstackConfigChange = (newGridConfig: any) => {
    dependencies.editorConfig.value.gridConfig = { ...dependencies.editorConfig.value.gridConfig, ...newGridConfig }
    dependencies.hasChanges.value = true
  }

  /**
   * 处理画布配置变更
   * @param newCanvasConfig 新的画布配置
   */
  const handleCanvasConfigChange = (newCanvasConfig: any) => {
    dependencies.editorConfig.value.canvasConfig = {
      ...dependencies.editorConfig.value.canvasConfig,
      ...newCanvasConfig
    }
    dependencies.hasChanges.value = true
  }

  // ===== 数据源处理 =====

  /**
   * 处理多数据源数据更新
   * @param widgetId 组件ID
   * @param dataSources 数据源数据
   */
  const handleMultiDataSourceUpdate = (widgetId: string, dataSources: Record<string, any>) => {
    // 存储数据源数据
    dependencies.multiDataSourceStore.value[widgetId] = dataSources

    // 标记有变化
    dependencies.hasChanges.value = true
  }

  /**
   * 处理多数据源配置更新
   * @param widgetId 组件ID
   * @param config 配置对象
   */
  const handleMultiDataSourceConfigUpdate = (widgetId: string, config: any) => {
    // 存储配置信息
    dependencies.multiDataSourceConfigStore.value[widgetId] = config

    // 标记有变化
    dependencies.hasChanges.value = true
  }

  // ===== 画布操作控制 =====

  /**
   * 放大视图
   */
  const handleZoomIn = () => {
    // TODO: 实现缩放功能
    if (process.env.NODE_ENV === 'development') {
    }
  }

  /**
   * 缩小视图
   */
  const handleZoomOut = () => {
    // TODO: 实现缩放功能
  }

  /**
   * 重置缩放
   */
  const handleResetZoom = () => {
    // TODO: 实现重置缩放功能
    if (process.env.NODE_ENV === 'development') {
    }
  }

  /**
   * 撤销操作
   */
  const handleUndo = () => {
    // TODO: 实现撤销功能
  }

  /**
   * 重做操作
   */
  const handleRedo = () => {
    // TODO: 实现重做功能
    if (process.env.NODE_ENV === 'development') {
    }
  }

  // ===== 渲染器事件处理 =====

  /**
   * 渲染器准备就绪
   */
  const handleRendererReady = () => {}

  /**
   * 渲染器错误处理
   * @param error 错误对象
   */
  const handleRendererError = (error: Error) => {
    console.error('❌ 渲染器错误:', error)
    message.error($t('visualEditor.rendererLoadFailed', { error: error.message }))
  }

  // ===== 节点选择和交互 =====

  /**
   * 处理节点选择
   * @param nodeId 节点ID
   */
  const handleNodeSelect = (nodeId: string) => {
    dependencies.selectedNodeId.value = nodeId
    dependencies.selectNode(nodeId)
    // 节点选择通常不触发保存，但可以标记为有变化
    // dependencies.hasChanges.value = true
  }

  /**
   * 请求设置面板
   * @param nodeId 节点ID
   */
  const handleRequestSettings = (nodeId: string) => {
    if (nodeId) {
      dependencies.selectedNodeId.value = nodeId
      dependencies.selectNode(nodeId)
      dependencies.showRightDrawer.value = true
    }
  }

  /**
   * 处理画布点击（取消选择）
   */
  const handleCanvasClick = () => {
    dependencies.selectedNodeId.value = ''
    dependencies.selectNode('')
    // 取消选中时可以选择性隐藏属性面板（或保持展开）
    // rightCollapsed.value = true
  }

  // ===== 组件生命周期事件 =====

  /**
   * 处理组件添加事件
   * @param node 节点数据
   */
  const handleComponentAdded = async (node: any) => {
    try {
      // 检查是否有数据源配置
      const config = dependencies.multiDataSourceConfigStore.value[node.id]
      if (config && Object.keys(config).length > 0) {
        // 注册到编辑器数据源管理器
        dependencies.editorDataSourceManager.registerComponentDataSource(
          node.id,
          node.type,
          config,
          { type: 'timer', interval: 30000 } // 默认30秒轮询
        )
      }
    } catch (error) {
      console.error(`❌ [PanelEditor] 处理组件添加失败: ${node.id}`, error)
    }
  }

  /**
   * 处理组件删除事件
   * @param componentId 组件ID
   */
  const handleComponentRemoved = async (componentId: string) => {
    try {
      // 从编辑器数据源管理器移除
      dependencies.editorDataSourceManager.removeComponentDataSource(componentId)

      // 清理本地配置存储
      delete dependencies.multiDataSourceConfigStore.value[componentId]
      delete dependencies.multiDataSourceStore.value[componentId]
    } catch (error) {
      console.error(`❌ [PanelEditor] 处理组件删除失败: ${componentId}`, error)
    }
  }

  /**
   * 处理组件配置变更事件
   * @param componentId 组件ID
   * @param config 新配置
   */
  const handleComponentConfigChanged = async (componentId: string, config: any) => {
    // 🔥 错误边界：确保数据源管理器已初始化
    if (!dependencies.editorDataSourceManager.isInitialized()) {
      console.error(`⚠️ [PanelEditor] 数据源管理器未初始化，跳过配置变更: ${componentId}`)
      return
    }

    try {
      // 如果组件已在数据源管理器中注册，更新配置
      const existingConfig = dependencies.editorDataSourceManager.getComponentConfig(componentId)
      if (existingConfig) {
        // 先移除旧配置
        dependencies.editorDataSourceManager.removeComponentDataSource(componentId)

        // 重新注册新配置
        const node = dependencies.stateManager.nodes.find(n => n.id === componentId)
        if (node) {
          dependencies.editorDataSourceManager.registerComponentDataSource(
            componentId,
            node.type,
            config,
            { type: 'timer', interval: 30000 } // 默认30秒轮询
          )
        }
      }
    } catch (error) {
      console.error(`❌ [PanelEditor] 处理组件配置变更失败: ${componentId}`, error)
    }
  }

  return {
    // 抽屉控制
    handleToggleLeftDrawer,
    handleToggleRightDrawer,

    // 拖拽处理
    handleDragStart,
    handleDragEnd,

    // 渲染器和视图控制
    handleRendererChange,
    handleToggleWidgetTitles,

    // 组件操作
    handleAddWidget,
    handleClearAll,

    // 导入导出
    handleImportConfig,
    handleExportConfig,

    // 配置变更
    handleGridConfigChange,
    handleGridstackConfigChange,
    handleCanvasConfigChange,

    // 数据源处理
    handleMultiDataSourceUpdate,
    handleMultiDataSourceConfigUpdate,

    // 画布操作控制
    handleZoomIn,
    handleZoomOut,
    handleResetZoom,
    handleUndo,
    handleRedo,

    // 渲染器事件处理
    handleRendererReady,
    handleRendererError,

    // 节点选择和交互
    handleNodeSelect,
    handleRequestSettings,
    handleCanvasClick,

    // 组件生命周期事件
    handleComponentAdded,
    handleComponentRemoved,
    handleComponentConfigChanged
  }
}
