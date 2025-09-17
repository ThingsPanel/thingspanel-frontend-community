/**
 * Vue 3 集成适配器
 *
 * 功能概述：
 * 1. 提供Vue 3组合式API的集成接口
 * 2. 实现响应式的配置管理和状态同步
 * 3. 提供Visual Editor的Vue组件适配
 * 4. 集成Naive UI主题系统和国际化
 * 5. 支持组件的生命周期管理
 *
 * 设计原则：
 * - 基于Vue 3 Composition API设计
 * - 完全响应式的状态管理
 * - 与Naive UI主题系统深度集成
 * - 支持TypeScript严格类型检查
 * - 遵循Vue 3最佳实践
 *
 * @author Claude
 * @version 1.0.0
 * @date 2024-12-17
 */

import { ref, reactive, computed, watch, onMounted, onUnmounted, provide, inject, toRefs } from 'vue'
import type { Ref, ComputedRef, InjectionKey } from 'vue'
import { useThemeStore } from '@/store/modules/theme'
import { useI18n } from 'vue-i18n'
import type {
  WidgetConfiguration,
  ConfigurationValidationResult,
  ConfigurationSnapshot
} from './types'
import type {
  EditorNodeConfiguration,
  EditorCanvasConfiguration,
  EditorState,
  ConfigurationPropagationOptions
} from './visual-editor-integration-bridge'
import { VisualEditorIntegrationBridge } from './visual-editor-integration-bridge'

/**
 * Vue响应式节点状态接口
 */
export interface ReactiveNodeState {
  configuration: Ref<WidgetConfiguration>
  metadata: Ref<EditorNodeConfiguration['metadata']>
  position: Ref<EditorNodeConfiguration['position']>
  size: Ref<EditorNodeConfiguration['size']>
  validation: Ref<EditorNodeConfiguration['validation']>
  bindings: Ref<EditorNodeConfiguration['bindings']>
  styling: Ref<EditorNodeConfiguration['styling']>
  isSelected: Ref<boolean>
  isLoading: Ref<boolean>
  isDirty: Ref<boolean>
}

/**
 * Vue响应式画布状态接口
 */
export interface ReactiveCanvasState {
  configuration: Ref<EditorCanvasConfiguration>
  editorState: Ref<EditorState>
  nodes: Ref<Record<string, ReactiveNodeState>>
  selectedNodes: Ref<string[]>
  clipboard: Ref<any[]>
  canUndo: ComputedRef<boolean>
  canRedo: ComputedRef<boolean>
  isValid: ComputedRef<boolean>
  isDirty: ComputedRef<boolean>
  isLoading: Ref<boolean>
}

/**
 * 配置更新选项接口
 */
export interface ConfigurationUpdateOptions extends ConfigurationPropagationOptions {
  immediate?: boolean              // 是否立即应用
  debounce?: number               // 防抖延迟（毫秒）
  updateHistory?: boolean         // 是否更新历史记录
  validateBeforeUpdate?: boolean  // 更新前是否验证
}

/**
 * 主题集成选项接口
 */
export interface ThemeIntegrationOptions {
  autoApplyTheme?: boolean        // 是否自动应用主题
  watchThemeChanges?: boolean     // 是否监听主题变更
  customThemeVariables?: Record<string, string>  // 自定义主题变量
}

/**
 * 国际化集成选项接口
 */
export interface I18nIntegrationOptions {
  autoTranslate?: boolean         // 是否自动翻译
  fallbackLocale?: string         // 后备语言
  translateKeys?: string[]        // 需要翻译的键
}

// Vue依赖注入键
export const VISUAL_EDITOR_BRIDGE_KEY: InjectionKey<VisualEditorIntegrationBridge> = Symbol('visualEditorBridge')
export const REACTIVE_CANVAS_STATE_KEY: InjectionKey<ReactiveCanvasState> = Symbol('reactiveCanvasState')
export const THEME_INTEGRATION_KEY: InjectionKey<ThemeIntegrationOptions> = Symbol('themeIntegration')

/**
 * 使用Visual Editor集成桥接器的组合式API
 *
 * @param options 初始化选项
 * @returns 集成桥接器实例和相关方法
 */
export function useVisualEditorBridge(options: {
  autoInitialize?: boolean
} = {}) {
  const bridge = ref<VisualEditorIntegrationBridge | null>(null)
  const isInitialized = ref(false)
  const initError = ref<Error | null>(null)

  // 初始化桥接器
  const initialize = async (): Promise<void> => {
    try {
      if (!bridge.value) {
        bridge.value = new VisualEditorIntegrationBridge()
      }

      await bridge.value.initialize()
      isInitialized.value = true
      initError.value = null
    } catch (error) {
      initError.value = error as Error
      console.error('初始化Visual Editor桥接器失败:', error)
      throw error
    }
  }

  // 清理资源
  const cleanup = async (): Promise<void> => {
    if (bridge.value) {
      await bridge.value.cleanup()
      bridge.value = null
      isInitialized.value = false
    }
  }

  // 自动初始化
  if (options.autoInitialize !== false) {
    onMounted(async () => {
      try {
        await initialize()
      } catch (error) {
        console.error('自动初始化失败:', error)
      }
    })
  }

  // 清理资源
  onUnmounted(async () => {
    await cleanup()
  })

  // 提供桥接器给子组件
  provide(VISUAL_EDITOR_BRIDGE_KEY, bridge)

  return {
    bridge: bridge as Ref<VisualEditorIntegrationBridge | null>,
    isInitialized,
    initError,
    initialize,
    cleanup
  }
}

/**
 * 注入Visual Editor集成桥接器的组合式API
 *
 * @returns 集成桥接器实例
 */
export function useInjectedVisualEditorBridge(): VisualEditorIntegrationBridge {
  const bridge = inject(VISUAL_EDITOR_BRIDGE_KEY)
  if (!bridge || !bridge.value) {
    throw new Error('Visual Editor桥接器未初始化，请确保在提供者组件中使用useVisualEditorBridge')
  }
  return bridge.value
}

/**
 * 使用响应式画布状态的组合式API
 *
 * @param canvasId 画布ID
 * @param options 选项
 * @returns 响应式画布状态和相关方法
 */
export function useReactiveCanvas(
  canvasId: string,
  options: {
    autoLoad?: boolean
    watchChanges?: boolean
  } = {}
): ReactiveCanvasState & {
  loadCanvas: () => Promise<void>
  saveCanvas: () => Promise<void>
  createNode: (nodeConfig: Partial<EditorNodeConfiguration>) => Promise<string>
  updateNode: (nodeId: string, updates: Partial<EditorNodeConfiguration>) => Promise<void>
  deleteNode: (nodeId: string) => Promise<void>
  selectNode: (nodeId: string, multiSelect?: boolean) => void
  clearSelection: () => void
  undo: () => Promise<void>
  redo: () => Promise<void>
} {
  const bridge = useInjectedVisualEditorBridge()

  // 响应式状态
  const configuration = ref<EditorCanvasConfiguration>()
  const editorState = ref<EditorState>()
  const nodes = ref<Record<string, ReactiveNodeState>>({})
  const selectedNodes = ref<string[]>([])
  const clipboard = ref<any[]>([])
  const isLoading = ref(false)

  // 计算属性
  const canUndo = computed(() => editorState.value?.history.canUndo || false)
  const canRedo = computed(() => editorState.value?.history.canRedo || false)
  const isValid = computed(() => editorState.value?.validation.isValid || false)
  const isDirty = computed(() => editorState.value?.dirty || false)

  // 加载画布
  const loadCanvas = async (): Promise<void> => {
    try {
      isLoading.value = true

      const canvasConfig = bridge.getCanvasConfiguration(canvasId)
      const canvasState = bridge.getEditorState(canvasId)

      if (canvasConfig) {
        configuration.value = canvasConfig
        editorState.value = canvasState || {
          mode: 'edit',
          selection: [],
          clipboard: [],
          history: { canUndo: false, canRedo: false, position: 0, stack: [] },
          validation: { isValid: true, errorCount: 0, warningCount: 0 },
          dirty: false,
          loading: false
        }

        // 创建响应式节点状态
        const reactiveNodes: Record<string, ReactiveNodeState> = {}
        for (const [nodeId, nodeConfig] of Object.entries(canvasConfig.nodes)) {
          reactiveNodes[nodeId] = createReactiveNodeState(nodeId, nodeConfig)
        }
        nodes.value = reactiveNodes

        selectedNodes.value = editorState.value.selection
        clipboard.value = editorState.value.clipboard
      }
    } catch (error) {
      console.error('加载画布失败:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  // 保存画布
  const saveCanvas = async (): Promise<void> => {
    try {
      isLoading.value = true
      await bridge.saveCanvas(canvasId)
    } catch (error) {
      console.error('保存画布失败:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  // 创建节点
  const createNode = async (nodeConfig: Partial<EditorNodeConfiguration>): Promise<string> => {
    try {
      const nodeId = await bridge.createNode(canvasId, nodeConfig)

      // 更新响应式状态
      await loadCanvas()

      return nodeId
    } catch (error) {
      console.error('创建节点失败:', error)
      throw error
    }
  }

  // 更新节点
  const updateNode = async (nodeId: string, updates: Partial<EditorNodeConfiguration>): Promise<void> => {
    try {
      const node = nodes.value[nodeId]
      if (!node) {
        throw new Error(`节点不存在: ${nodeId}`)
      }

      // 更新配置
      if (updates.configuration) {
        await bridge.updateNodeConfiguration(nodeId, updates.configuration)
        node.configuration.value = { ...node.configuration.value, ...updates.configuration }
      }

      // 更新位置
      if (updates.position) {
        await bridge.moveNode(nodeId, updates.position)
        node.position.value = updates.position
      }

      // 更新尺寸
      if (updates.size) {
        await bridge.resizeNode(nodeId, updates.size)
        node.size.value = updates.size
      }

      // 更新元数据
      if (updates.metadata) {
        node.metadata.value = { ...node.metadata.value, ...updates.metadata }
      }

      // 更新其他属性
      if (updates.bindings) {
        node.bindings.value = updates.bindings
      }
      if (updates.styling) {
        node.styling.value = updates.styling
      }

      node.isDirty.value = true

    } catch (error) {
      console.error('更新节点失败:', error)
      throw error
    }
  }

  // 删除节点
  const deleteNode = async (nodeId: string): Promise<void> => {
    try {
      await bridge.deleteNode(nodeId)

      // 从响应式状态中移除
      delete nodes.value[nodeId]
      selectedNodes.value = selectedNodes.value.filter(id => id !== nodeId)

    } catch (error) {
      console.error('删除节点失败:', error)
      throw error
    }
  }

  // 选择节点
  const selectNode = (nodeId: string, multiSelect = false): void => {
    if (!nodes.value[nodeId]) {
      return
    }

    if (multiSelect) {
      if (selectedNodes.value.includes(nodeId)) {
        selectedNodes.value = selectedNodes.value.filter(id => id !== nodeId)
        nodes.value[nodeId].isSelected.value = false
      } else {
        selectedNodes.value.push(nodeId)
        nodes.value[nodeId].isSelected.value = true
      }
    } else {
      // 清除之前的选择
      selectedNodes.value.forEach(id => {
        if (nodes.value[id]) {
          nodes.value[id].isSelected.value = false
        }
      })

      selectedNodes.value = [nodeId]
      nodes.value[nodeId].isSelected.value = true
    }

    // 更新编辑器状态
    if (editorState.value) {
      editorState.value.selection = [...selectedNodes.value]
    }
  }

  // 清除选择
  const clearSelection = (): void => {
    selectedNodes.value.forEach(nodeId => {
      if (nodes.value[nodeId]) {
        nodes.value[nodeId].isSelected.value = false
      }
    })
    selectedNodes.value = []

    if (editorState.value) {
      editorState.value.selection = []
    }
  }

  // 撤销
  const undo = async (): Promise<void> => {
    try {
      await bridge.undo(canvasId)
      await loadCanvas()
    } catch (error) {
      console.error('撤销失败:', error)
      throw error
    }
  }

  // 重做
  const redo = async (): Promise<void> => {
    try {
      await bridge.redo(canvasId)
      await loadCanvas()
    } catch (error) {
      console.error('重做失败:', error)
      throw error
    }
  }

  // 监听变更（如果启用）
  if (options.watchChanges !== false) {
    // 监听桥接器事件
    bridge.on('nodeCreated', ({ canvasId: eventCanvasId }) => {
      if (eventCanvasId === canvasId) {
        loadCanvas()
      }
    })

    bridge.on('nodeConfigured', ({ nodeId }) => {
      if (nodes.value[nodeId]) {
        const nodeConfig = bridge.getNodeConfiguration(nodeId)
        if (nodeConfig) {
          updateReactiveNodeState(nodes.value[nodeId], nodeConfig)
        }
      }
    })

    bridge.on('nodeDeleted', ({ canvasId: eventCanvasId, nodeId }) => {
      if (eventCanvasId === canvasId && nodes.value[nodeId]) {
        delete nodes.value[nodeId]
        selectedNodes.value = selectedNodes.value.filter(id => id !== nodeId)
      }
    })
  }

  // 自动加载
  if (options.autoLoad !== false) {
    onMounted(async () => {
      try {
        await loadCanvas()
      } catch (error) {
        console.error('自动加载画布失败:', error)
      }
    })
  }

  // 提供状态给子组件
  const reactiveState: ReactiveCanvasState = {
    configuration,
    editorState,
    nodes,
    selectedNodes,
    clipboard,
    canUndo,
    canRedo,
    isValid,
    isDirty,
    isLoading
  }

  provide(REACTIVE_CANVAS_STATE_KEY, reactiveState)

  return {
    ...reactiveState,
    loadCanvas,
    saveCanvas,
    createNode,
    updateNode,
    deleteNode,
    selectNode,
    clearSelection,
    undo,
    redo
  }
}

/**
 * 注入响应式画布状态的组合式API
 *
 * @returns 响应式画布状态
 */
export function useInjectedReactiveCanvas(): ReactiveCanvasState {
  const state = inject(REACTIVE_CANVAS_STATE_KEY)
  if (!state) {
    throw new Error('响应式画布状态未初始化，请确保在提供者组件中使用useReactiveCanvas')
  }
  return state
}

/**
 * 使用响应式节点状态的组合式API
 *
 * @param nodeId 节点ID
 * @param options 选项
 * @returns 响应式节点状态和相关方法
 */
export function useReactiveNode(
  nodeId: string,
  options: {
    autoLoad?: boolean
    autoSave?: boolean
    debounceMs?: number
  } = {}
) {
  const bridge = useInjectedVisualEditorBridge()
  const canvasState = useInjectedReactiveCanvas()

  // 获取节点状态
  const nodeState = computed(() => canvasState.nodes.value[nodeId])

  // 更新配置
  const updateConfiguration = async (
    configuration: Partial<WidgetConfiguration>,
    updateOptions: Partial<ConfigurationUpdateOptions> = {}
  ): Promise<void> => {
    try {
      if (!nodeState.value) {
        throw new Error(`节点不存在: ${nodeId}`)
      }

      nodeState.value.isLoading.value = true

      await bridge.updateNodeConfiguration(nodeId, configuration, updateOptions)

      // 更新响应式状态
      nodeState.value.configuration.value = {
        ...nodeState.value.configuration.value,
        ...configuration
      }
      nodeState.value.isDirty.value = true

    } catch (error) {
      console.error('更新节点配置失败:', error)
      throw error
    } finally {
      if (nodeState.value) {
        nodeState.value.isLoading.value = false
      }
    }
  }

  // 移动节点
  const moveNode = async (position: EditorNodeConfiguration['position']): Promise<void> => {
    try {
      if (!nodeState.value) {
        throw new Error(`节点不存在: ${nodeId}`)
      }

      await bridge.moveNode(nodeId, position)
      nodeState.value.position.value = position

    } catch (error) {
      console.error('移动节点失败:', error)
      throw error
    }
  }

  // 调整尺寸
  const resizeNode = async (size: EditorNodeConfiguration['size']): Promise<void> => {
    try {
      if (!nodeState.value) {
        throw new Error(`节点不存在: ${nodeId}`)
      }

      await bridge.resizeNode(nodeId, size)
      nodeState.value.size.value = size

    } catch (error) {
      console.error('调整节点尺寸失败:', error)
      throw error
    }
  }

  // 验证配置
  const validateConfiguration = async (): Promise<ConfigurationValidationResult> => {
    try {
      if (!nodeState.value) {
        throw new Error(`节点不存在: ${nodeId}`)
      }

      const nodeConfig = bridge.getNodeConfiguration(nodeId)
      if (!nodeConfig) {
        throw new Error(`无法获取节点配置: ${nodeId}`)
      }

      return await bridge.validateCanvas(nodeConfig.id)

    } catch (error) {
      console.error('验证节点配置失败:', error)
      return {
        isValid: false,
        errors: [`验证失败: ${error}`],
        warnings: []
      }
    }
  }

  // 获取配置历史
  const getConfigurationHistory = async (limit = 10): Promise<ConfigurationSnapshot[]> => {
    try {
      return await bridge.getConfigurationHistory(nodeId, limit)
    } catch (error) {
      console.error('获取配置历史失败:', error)
      return []
    }
  }

  // 恢复历史配置
  const restoreFromHistory = async (snapshotId: string): Promise<void> => {
    try {
      await bridge.restoreFromHistory(nodeId, snapshotId)

      // 重新加载节点状态
      const nodeConfig = bridge.getNodeConfiguration(nodeId)
      if (nodeConfig && nodeState.value) {
        updateReactiveNodeState(nodeState.value, nodeConfig)
      }

    } catch (error) {
      console.error('恢复历史配置失败:', error)
      throw error
    }
  }

  // 自动保存（如果启用）
  if (options.autoSave) {
    const debounceMs = options.debounceMs || 1000
    let saveTimer: number | null = null

    watch(
      () => nodeState.value?.configuration.value,
      async (newConfig) => {
        if (newConfig && nodeState.value?.isDirty.value) {
          if (saveTimer) {
            clearTimeout(saveTimer)
          }

          saveTimer = window.setTimeout(async () => {
            try {
              await updateConfiguration(newConfig, { immediate: true })
              if (nodeState.value) {
                nodeState.value.isDirty.value = false
              }
            } catch (error) {
              console.error('自动保存失败:', error)
            }
            saveTimer = null
          }, debounceMs)
        }
      },
      { deep: true }
    )

    onUnmounted(() => {
      if (saveTimer) {
        clearTimeout(saveTimer)
      }
    })
  }

  return {
    nodeState,
    updateConfiguration,
    moveNode,
    resizeNode,
    validateConfiguration,
    getConfigurationHistory,
    restoreFromHistory
  }
}

/**
 * 使用主题集成的组合式API
 *
 * @param options 主题集成选项
 * @returns 主题相关的状态和方法
 */
export function useThemeIntegration(options: ThemeIntegrationOptions = {}) {
  const themeStore = useThemeStore()
  const themeVariables = ref<Record<string, string>>({})
  const customVariables = ref<Record<string, string>>(options.customThemeVariables || {})

  // 更新主题变量
  const updateThemeVariables = (): void => {
    // 基于主题存储生成CSS变量
    const variables: Record<string, string> = {
      '--primary-color': themeStore.themeColor,
      '--text-color': themeStore.darkMode ? '#ffffff' : '#000000',
      '--background-color': themeStore.darkMode ? '#1a1a1a' : '#ffffff',
      '--card-color': themeStore.darkMode ? '#2a2a2a' : '#f5f5f5',
      '--border-color': themeStore.darkMode ? '#404040' : '#e0e0e0',
      ...customVariables.value
    }

    themeVariables.value = variables

    // 应用到DOM（如果启用）
    if (options.autoApplyTheme !== false) {
      applyThemeVariablesToDOM(variables)
    }
  }

  // 应用CSS变量到DOM
  const applyThemeVariablesToDOM = (variables: Record<string, string>): void => {
    const root = document.documentElement
    for (const [key, value] of Object.entries(variables)) {
      root.style.setProperty(key, value)
    }
  }

  // 设置自定义变量
  const setCustomVariable = (key: string, value: string): void => {
    customVariables.value[key] = value
    updateThemeVariables()
  }

  // 监听主题变更（如果启用）
  if (options.watchThemeChanges !== false) {
    watch(
      () => [themeStore.themeColor, themeStore.darkMode],
      () => {
        updateThemeVariables()
      },
      { immediate: true }
    )
  }

  // 初始化
  onMounted(() => {
    updateThemeVariables()
  })

  // 提供主题集成给子组件
  provide(THEME_INTEGRATION_KEY, options)

  return {
    themeVariables: computed(() => themeVariables.value),
    customVariables,
    updateThemeVariables,
    applyThemeVariablesToDOM,
    setCustomVariable,
    isDarkMode: computed(() => themeStore.darkMode),
    primaryColor: computed(() => themeStore.themeColor)
  }
}

/**
 * 使用国际化集成的组合式API
 *
 * @param options 国际化集成选项
 * @returns 国际化相关的状态和方法
 */
export function useI18nIntegration(options: I18nIntegrationOptions = {}) {
  const { t, locale } = useI18n()

  // 翻译配置文本
  const translateConfiguration = (config: WidgetConfiguration): WidgetConfiguration => {
    if (!options.autoTranslate) {
      return config
    }

    const translated = { ...config }

    // 递归翻译配置中的文本
    const translateObject = (obj: any): any => {
      if (typeof obj === 'string') {
        // 检查是否是翻译键
        if (obj.startsWith('$t:')) {
          return t(obj.substring(3))
        }
        return obj
      } else if (Array.isArray(obj)) {
        return obj.map(translateObject)
      } else if (obj && typeof obj === 'object') {
        const result: any = {}
        for (const [key, value] of Object.entries(obj)) {
          result[key] = translateObject(value)
        }
        return result
      }
      return obj
    }

    return translateObject(translated)
  }

  // 添加翻译键
  const addTranslationKey = (key: string, text: string): string => {
    return `$t:${key}`
  }

  // 检查是否是翻译键
  const isTranslationKey = (text: string): boolean => {
    return typeof text === 'string' && text.startsWith('$t:')
  }

  // 获取翻译文本
  const getTranslatedText = (text: string): string => {
    if (isTranslationKey(text)) {
      return t(text.substring(3))
    }
    return text
  }

  return {
    t,
    locale,
    translateConfiguration,
    addTranslationKey,
    isTranslationKey,
    getTranslatedText
  }
}

// ==================== 私有辅助函数 ====================

/**
 * 创建响应式节点状态
 *
 * @param nodeId 节点ID
 * @param nodeConfig 节点配置
 * @returns 响应式节点状态
 */
function createReactiveNodeState(nodeId: string, nodeConfig: EditorNodeConfiguration): ReactiveNodeState {
  return {
    configuration: ref({ ...nodeConfig.configuration }),
    metadata: ref({ ...nodeConfig.metadata }),
    position: ref({ ...nodeConfig.position }),
    size: ref({ ...nodeConfig.size }),
    validation: ref({ ...nodeConfig.validation }),
    bindings: ref({ ...nodeConfig.bindings }),
    styling: ref({ ...nodeConfig.styling }),
    isSelected: ref(false),
    isLoading: ref(false),
    isDirty: ref(false)
  }
}

/**
 * 更新响应式节点状态
 *
 * @param reactiveState 响应式状态
 * @param nodeConfig 新的节点配置
 */
function updateReactiveNodeState(reactiveState: ReactiveNodeState, nodeConfig: EditorNodeConfiguration): void {
  reactiveState.configuration.value = { ...nodeConfig.configuration }
  reactiveState.metadata.value = { ...nodeConfig.metadata }
  reactiveState.position.value = { ...nodeConfig.position }
  reactiveState.size.value = { ...nodeConfig.size }
  reactiveState.validation.value = { ...nodeConfig.validation }
  reactiveState.bindings.value = { ...nodeConfig.bindings }
  reactiveState.styling.value = { ...nodeConfig.styling }
  reactiveState.isDirty.value = false
}

// 导出所有接口和函数
export type {
  ReactiveNodeState,
  ReactiveCanvasState,
  ConfigurationUpdateOptions,
  ThemeIntegrationOptions,
  I18nIntegrationOptions
}