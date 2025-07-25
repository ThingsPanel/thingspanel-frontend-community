// PanelV2 第一层：纯净编辑器底座
// 统一导出接口，供第二层引擎使用

export { LayoutManager, createLayoutManager, type PureLayoutManager } from './PureLayoutManager'
export {
  DataPipeline,
  createDataPipeline,
  type PureDataPipeline,
  type PanelV2Data,
  type NodeData,
  type PanelConfig,
  type NodeBaseConfig,
  type NodeInteractionConfig,
  type NodeContentConfig,
  type NodeStyleConfig
} from './PureDataPipeline'
export {
  PureLifecycleManager,
  createLifecycleManager,
  LIFECYCLE_PHASES,
  type LifecycleManager,
  type LifecycleHook,
  type LifecycleContext
} from './LifecycleManager'
export { default as PureEditorShell } from './PureEditorShell.vue'

/**
 * 创建完整的编辑器底座实例
 * 这是第一层的主要工厂函数
 */
export function createPureEditorInfrastructure(config?: {
  initialData?: any
  layoutConfig?: any
  responsiveConfig?: any
  persistenceHandlers?: any
}) {
  const layoutManager = createLayoutManager()
  const dataPipeline = createDataPipeline(config?.initialData)
  const lifecycleManager = createLifecycleManager()

  // 应用配置
  if (config?.layoutConfig) {
    const { toolbarHeight, sidebarWidth, inspectorWidth, canvasPadding } = config.layoutConfig
    if (toolbarHeight) layoutManager.regions.toolbar.height = toolbarHeight
    if (sidebarWidth) layoutManager.regions.sidebar.width = sidebarWidth
    if (inspectorWidth) layoutManager.regions.inspector.width = inspectorWidth
    if (canvasPadding) layoutManager.regions.canvas.padding = canvasPadding
  }

  if (config?.responsiveConfig) {
    Object.assign(layoutManager.responsive, config.responsiveConfig)
  }

  if (config?.persistenceHandlers) {
    dataPipeline.setPersistenceHandlers(config.persistenceHandlers)
  }

  return {
    layoutManager,
    dataPipeline,
    lifecycleManager,

    // 便捷方法
    destroy() {
      dataPipeline.destroy()
      lifecycleManager.clearAll()
    },

    // 调试方法
    getDebugInfo() {
      return {
        layout: layoutManager.getLayoutState(),
        data: dataPipeline.state.value,
        lifecycle: lifecycleManager.getDebugInfo()
      }
    }
  }
}

/**
 * 第一层架构版本信息
 */
export const PURE_INFRASTRUCTURE_VERSION = '2.0.0'

/**
 * 架构层级标识
 */
export const ARCHITECTURE_LAYER = 'PURE_INFRASTRUCTURE' as const
