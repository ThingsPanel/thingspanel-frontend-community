/**
 * Visual Editor 集成示例
 *
 * 功能概述：
 * 1. 提供完整的集成示例和使用指南
 * 2. 展示Config Engine与Visual Editor的集成方式
 * 3. 演示Vue 3组合式API的最佳实践
 * 4. 提供Naive UI集成的参考实现
 * 5. 包含错误处理和性能优化示例
 *
 * 设计目标：
 * - 提供开箱即用的集成示例
 * - 展示完整的数据流和事件处理
 * - 演示最佳实践和常见模式
 * - 帮助开发者快速上手集成
 *
 * @author Claude
 * @version 1.0.0
 * @date 2024-12-17
 */

import { ref, reactive, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import type { Ref } from 'vue'
import { useMessage, useNotification, useDialog } from 'naive-ui'
import type { WidgetConfiguration } from './types'
import type {
  EditorNodeConfiguration,
  EditorCanvasConfiguration,
  ConfigurationPropagationOptions
} from './visual-editor-integration-bridge'
import {
  useVisualEditorBridge,
  useReactiveCanvas,
  useReactiveNode,
  useThemeIntegration,
  useI18nIntegration
} from './vue-integration-adapters'
import {
  NaiveUIConfigurationFormGenerator,
  NaiveUIConfigurationEditorAdapter
} from './naive-ui-integration'

/**
 * 示例1：基础Visual Editor集成
 *
 * 展示如何在Vue组件中集成Visual Editor
 */
export function useBasicVisualEditorIntegration() {
  // 初始化Visual Editor桥接器
  const {
    bridge,
    isInitialized,
    initError,
    initialize,
    cleanup
  } = useVisualEditorBridge({ autoInitialize: true })

  const message = useMessage()
  const canvasId = ref<string>('')
  const isLoading = ref(false)

  // 创建新画布
  const createNewCanvas = async (title = '新建画布') => {
    if (!bridge.value) {
      message.error('Visual Editor未初始化')
      return
    }

    try {
      isLoading.value = true
      canvasId.value = await bridge.value.createCanvas({
        title,
        description: '通过集成示例创建的画布',
        author: 'system',
        canvas: {
          width: 1920,
          height: 1080,
          zoom: 1,
          grid: {
            enabled: true,
            size: 20,
            snap: true
          },
          background: {
            type: 'color',
            value: '#f5f5f5'
          }
        },
        theme: {
          name: 'default',
          variables: {}
        }
      })

      message.success(`画布创建成功: ${canvasId.value}`)
    } catch (error) {
      message.error(`创建画布失败: ${error}`)
      console.error('创建画布失败:', error)
    } finally {
      isLoading.value = false
    }
  }

  // 创建示例节点
  const createExampleNode = async (nodeType = 'chart') => {
    if (!bridge.value || !canvasId.value) {
      message.error('请先创建画布')
      return
    }

    try {
      const nodeId = await bridge.value.createNode(canvasId.value, {
        type: nodeType,
        position: { x: 100, y: 100 },
        size: { width: 300, height: 200 },
        metadata: {
          title: `示例${nodeType}组件`,
          description: '通过集成示例创建的节点',
          category: 'example',
          visible: true,
          locked: false,
          author: 'system',
          version: '1.0.0'
        },
        configuration: {
          title: '示例图表',
          type: nodeType,
          data: {
            source: 'api',
            url: '/api/chart-data',
            refreshInterval: 5000
          },
          style: {
            backgroundColor: '#ffffff',
            borderColor: '#e0e0e0',
            borderWidth: 1
          }
        },
        styling: {
          theme: 'default',
          customStyles: {}
        }
      })

      message.success(`节点创建成功: ${nodeId}`)
      return nodeId
    } catch (error) {
      message.error(`创建节点失败: ${error}`)
      console.error('创建节点失败:', error)
    }
  }

  return {
    bridge,
    isInitialized,
    initError,
    canvasId,
    isLoading,
    createNewCanvas,
    createExampleNode,
    initialize,
    cleanup
  }
}

/**
 * 示例2：响应式画布管理
 *
 * 展示如何使用响应式API管理画布状态
 */
export function useReactiveCanvasExample(canvasId: string) {
  const message = useMessage()
  const notification = useNotification()

  // 初始化响应式画布
  const {
    configuration,
    editorState,
    nodes,
    selectedNodes,
    canUndo,
    canRedo,
    isValid,
    isDirty,
    isLoading,
    loadCanvas,
    saveCanvas,
    createNode,
    updateNode,
    deleteNode,
    selectNode,
    clearSelection,
    undo,
    redo
  } = useReactiveCanvas(canvasId, {
    autoLoad: true,
    watchChanges: true
  })

  // 批量创建示例节点
  const createExampleNodes = async () => {
    try {
      const nodeTypes = ['chart', 'table', 'gauge', 'map']
      const positions = [
        { x: 50, y: 50 },
        { x: 400, y: 50 },
        { x: 50, y: 300 },
        { x: 400, y: 300 }
      ]

      for (let i = 0; i < nodeTypes.length; i++) {
        await createNode({
          type: nodeTypes[i],
          position: positions[i],
          size: { width: 300, height: 200 },
          metadata: {
            title: `示例${nodeTypes[i]}`,
            description: `第${i + 1}个示例节点`,
            category: 'example',
            visible: true,
            locked: false,
            author: 'system',
            version: '1.0.0'
          },
          configuration: {
            title: `示例${nodeTypes[i]}`,
            type: nodeTypes[i],
            data: {
              source: 'mock',
              mockData: generateMockData(nodeTypes[i])
            }
          }
        })
      }

      message.success(`成功创建${nodeTypes.length}个示例节点`)
    } catch (error) {
      message.error(`批量创建节点失败: ${error}`)
    }
  }

  // 批量选择节点
  const selectAllNodes = () => {
    const nodeIds = Object.keys(nodes.value)
    nodeIds.forEach(nodeId => selectNode(nodeId, true))
    message.info(`已选择${nodeIds.length}个节点`)
  }

  // 批量更新选中节点
  const updateSelectedNodes = async (updates: Partial<EditorNodeConfiguration>) => {
    try {
      const promises = selectedNodes.value.map(nodeId => updateNode(nodeId, updates))
      await Promise.all(promises)
      message.success(`成功更新${selectedNodes.value.length}个节点`)
    } catch (error) {
      message.error(`批量更新失败: ${error}`)
    }
  }

  // 自动保存
  const autoSave = ref(true)
  watch(
    isDirty,
    async (dirty) => {
      if (dirty && autoSave.value) {
        try {
          await saveCanvas()
          notification.success({
            title: '自动保存',
            content: '画布已自动保存',
            duration: 2000
          })
        } catch (error) {
          notification.error({
            title: '自动保存失败',
            content: String(error),
            duration: 5000
          })
        }
      }
    },
    { debounce: 3000 }
  )

  // 状态统计
  const statistics = computed(() => ({
    totalNodes: Object.keys(nodes.value).length,
    selectedCount: selectedNodes.value.length,
    validNodes: Object.values(nodes.value).filter(node => node.validation.value.isValid).length,
    invalidNodes: Object.values(nodes.value).filter(node => !node.validation.value.isValid).length
  }))

  return {
    // 状态
    configuration,
    editorState,
    nodes,
    selectedNodes,
    canUndo,
    canRedo,
    isValid,
    isDirty,
    isLoading,
    statistics,
    autoSave,

    // 方法
    loadCanvas,
    saveCanvas,
    createNode,
    updateNode,
    deleteNode,
    selectNode,
    clearSelection,
    undo,
    redo,
    createExampleNodes,
    selectAllNodes,
    updateSelectedNodes
  }
}

/**
 * 示例3：节点配置编辑器
 *
 * 展示如何创建配置编辑界面
 */
export function useNodeConfigurationEditor(nodeId: string) {
  const message = useMessage()
  const dialog = useDialog()

  // 初始化响应式节点
  const {
    nodeState,
    updateConfiguration,
    validateConfiguration,
    getConfigurationHistory,
    restoreFromHistory
  } = useReactiveNode(nodeId, {
    autoLoad: true,
    autoSave: false,
    debounceMs: 1000
  })

  // 创建配置表单生成器
  const formGenerator = new NaiveUIConfigurationFormGenerator()
  const editorAdapter = new NaiveUIConfigurationEditorAdapter()

  // 表单数据和状态
  const formData = ref<WidgetConfiguration>({})
  const isEditing = ref(false)
  const validationResult = ref<any>(null)

  // 开始编辑
  const startEdit = () => {
    if (nodeState.value) {
      formData.value = { ...nodeState.value.configuration.value }
      isEditing.value = true
    }
  }

  // 保存配置
  const saveConfiguration = async () => {
    try {
      // 验证配置
      const validation = await validateConfiguration()
      if (!validation.isValid) {
        message.error('配置验证失败，请检查输入')
        validationResult.value = validation
        return
      }

      // 更新配置
      await updateConfiguration(formData.value, {
        createSnapshot: true,
        cascade: true,
        notifyDependents: true
      })

      isEditing.value = false
      message.success('配置保存成功')
    } catch (error) {
      message.error(`保存配置失败: ${error}`)
    }
  }

  // 取消编辑
  const cancelEdit = () => {
    dialog.warning({
      title: '确认取消',
      content: '当前有未保存的更改，确定要取消吗？',
      positiveText: '确定',
      negativeText: '继续编辑',
      onPositiveClick: () => {
        isEditing.value = false
        formData.value = {}
      }
    })
  }

  // 重置配置
  const resetConfiguration = () => {
    if (nodeState.value) {
      formData.value = { ...nodeState.value.configuration.value }
      message.info('配置已重置')
    }
  }

  // 显示历史记录
  const showHistory = async () => {
    try {
      const history = await getConfigurationHistory(20)

      // 这里可以显示历史记录对话框

      dialog.info({
        title: '配置历史',
        content: `共有${history.length}条历史记录`,
        positiveText: '确定'
      })
    } catch (error) {
      message.error(`获取历史记录失败: ${error}`)
    }
  }

  // 创建配置编辑器
  const createEditor = () => {
    if (!nodeState.value) {
      return null
    }

    return editorAdapter.createConfigurationEditor(
      {
        id: nodeId,
        configuration: formData.value,
        metadata: nodeState.value.metadata.value,
        type: nodeState.value.metadata.value.category || 'widget',
        position: nodeState.value.position.value,
        size: nodeState.value.size.value,
        validation: nodeState.value.validation.value,
        bindings: nodeState.value.bindings.value,
        styling: nodeState.value.styling.value
      },
      {
        layout: {
          labelWidth: 120,
          labelPlacement: 'left',
          size: 'medium',
          columns: 2,
          responsive: true
        },
        onSave: saveConfiguration,
        onCancel: cancelEdit,
        onValidate: (result) => {
          validationResult.value = result
        }
      }
    )
  }

  return {
    // 状态
    nodeState,
    formData,
    isEditing,
    validationResult,

    // 方法
    startEdit,
    saveConfiguration,
    cancelEdit,
    resetConfiguration,
    showHistory,
    createEditor,

    // 节点操作
    updateConfiguration,
    validateConfiguration,
    getConfigurationHistory,
    restoreFromHistory
  }
}

/**
 * 示例4：主题和国际化集成
 *
 * 展示如何集成主题系统和国际化
 */
export function useThemeAndI18nExample() {
  // 初始化主题集成
  const {
    themeVariables,
    customVariables,
    setCustomVariable,
    isDarkMode,
    primaryColor
  } = useThemeIntegration({
    autoApplyTheme: true,
    watchThemeChanges: true,
    customThemeVariables: {
      '--editor-grid-color': '#e0e0e0',
      '--editor-selection-color': '#1890ff',
      '--editor-hover-color': '#f0f0f0'
    }
  })

  // 初始化国际化集成
  const {
    t,
    locale,
    translateConfiguration,
    addTranslationKey,
    getTranslatedText
  } = useI18nIntegration({
    autoTranslate: true,
    fallbackLocale: 'zh-cn'
  })

  // 主题预设
  const themePresets = ref([
    {
      name: '默认主题',
      variables: {
        '--primary-color': '#1890ff',
        '--success-color': '#52c41a',
        '--warning-color': '#faad14',
        '--error-color': '#ff4d4f'
      }
    },
    {
      name: '深色主题',
      variables: {
        '--primary-color': '#177ddc',
        '--background-color': '#1a1a1a',
        '--text-color': '#ffffff',
        '--card-color': '#2a2a2a'
      }
    },
    {
      name: '护眼主题',
      variables: {
        '--primary-color': '#52c41a',
        '--background-color': '#f6f8fa',
        '--text-color': '#24292e',
        '--card-color': '#ffffff'
      }
    }
  ])

  // 应用主题预设
  const applyThemePreset = (preset: typeof themePresets.value[0]) => {
    Object.entries(preset.variables).forEach(([key, value]) => {
      setCustomVariable(key, value)
    })
  }

  // 翻译键映射
  const translationKeys = ref([
    { key: 'editor.canvas.title', zhCn: '画布标题', enUs: 'Canvas Title' },
    { key: 'editor.node.configuration', zhCn: '节点配置', enUs: 'Node Configuration' },
    { key: 'editor.toolbar.save', zhCn: '保存', enUs: 'Save' },
    { key: 'editor.toolbar.cancel', zhCn: '取消', enUs: 'Cancel' },
    { key: 'editor.validation.required', zhCn: '此字段为必填项', enUs: 'This field is required' }
  ])

  // 创建多语言配置示例
  const createI18nConfiguration = (): WidgetConfiguration => {
    return {
      title: addTranslationKey('editor.canvas.title', '画布标题'),
      description: addTranslationKey('editor.canvas.description', '画布描述'),
      buttons: {
        save: addTranslationKey('editor.toolbar.save', '保存'),
        cancel: addTranslationKey('editor.toolbar.cancel', '取消'),
        reset: addTranslationKey('editor.toolbar.reset', '重置')
      },
      validation: {
        required: addTranslationKey('editor.validation.required', '此字段为必填项'),
        invalid: addTranslationKey('editor.validation.invalid', '输入格式无效')
      }
    }
  }

  return {
    // 主题相关
    themeVariables,
    customVariables,
    isDarkMode,
    primaryColor,
    themePresets,
    applyThemePreset,
    setCustomVariable,

    // 国际化相关
    t,
    locale,
    translationKeys,
    translateConfiguration,
    addTranslationKey,
    getTranslatedText,
    createI18nConfiguration
  }
}

/**
 * 示例5：完整的集成工作流
 *
 * 展示完整的Visual Editor集成工作流程
 */
export function useCompleteIntegrationWorkflow() {
  const message = useMessage()
  const notification = useNotification()

  // 工作流状态
  const workflow = reactive({
    step: 1,
    canvasId: '',
    selectedNodeId: '',
    isProcessing: false,
    error: null as string | null
  })

  // 初始化所有集成模块
  const bridge = useVisualEditorBridge({ autoInitialize: true })
  const theme = useThemeAndI18nExample()

  // 步骤1：创建画布
  const step1_CreateCanvas = async () => {
    try {
      workflow.isProcessing = true
      workflow.error = null

      if (!bridge.bridge.value) {
        throw new Error('Visual Editor未初始化')
      }

      workflow.canvasId = await bridge.bridge.value.createCanvas({
        title: '完整集成示例画布',
        description: '展示完整集成工作流的示例画布',
        author: 'example-system',
        canvas: {
          width: 1920,
          height: 1080,
          zoom: 1,
          grid: { enabled: true, size: 20, snap: true },
          background: { type: 'color', value: theme.isDarkMode.value ? '#1a1a1a' : '#f5f5f5' }
        },
        theme: {
          name: theme.isDarkMode.value ? 'dark' : 'light',
          variables: theme.themeVariables.value
        }
      })

      workflow.step = 2
      notification.success({
        title: '步骤1完成',
        content: `画布创建成功: ${workflow.canvasId}`,
        duration: 3000
      })

    } catch (error) {
      workflow.error = String(error)
      message.error(`步骤1失败: ${error}`)
    } finally {
      workflow.isProcessing = false
    }
  }

  // 步骤2：创建和配置节点
  const step2_CreateNodes = async () => {
    try {
      workflow.isProcessing = true
      workflow.error = null

      if (!bridge.bridge.value || !workflow.canvasId) {
        throw new Error('前置步骤未完成')
      }

      // 创建多个示例节点
      const nodeConfigs = [
        {
          type: 'chart',
          position: { x: 100, y: 100 },
          title: '数据图表',
          config: { chartType: 'line', dataSource: 'api' }
        },
        {
          type: 'table',
          position: { x: 450, y: 100 },
          title: '数据表格',
          config: { pagination: true, sortable: true }
        },
        {
          type: 'gauge',
          position: { x: 100, y: 350 },
          title: '仪表盘',
          config: { min: 0, max: 100, unit: '%' }
        },
        {
          type: 'map',
          position: { x: 450, y: 350 },
          title: '地图组件',
          config: { provider: 'amap', zoom: 10 }
        }
      ]

      for (const nodeConfig of nodeConfigs) {
        const nodeId = await bridge.bridge.value.createNode(workflow.canvasId, {
          type: nodeConfig.type,
          position: nodeConfig.position,
          size: { width: 300, height: 200 },
          metadata: {
            title: nodeConfig.title,
            description: `示例${nodeConfig.type}组件`,
            category: 'example',
            visible: true,
            locked: false,
            author: 'example-system',
            version: '1.0.0'
          },
          configuration: {
            ...nodeConfig.config,
            title: nodeConfig.title,
            type: nodeConfig.type
          }
        })

        if (!workflow.selectedNodeId) {
          workflow.selectedNodeId = nodeId
        }
      }

      workflow.step = 3
      notification.success({
        title: '步骤2完成',
        content: `成功创建${nodeConfigs.length}个节点`,
        duration: 3000
      })

    } catch (error) {
      workflow.error = String(error)
      message.error(`步骤2失败: ${error}`)
    } finally {
      workflow.isProcessing = false
    }
  }

  // 步骤3：配置节点连接
  const step3_ConnectNodes = async () => {
    try {
      workflow.isProcessing = true
      workflow.error = null

      if (!bridge.bridge.value || !workflow.canvasId) {
        throw new Error('前置步骤未完成')
      }

      const canvas = bridge.bridge.value.getCanvasConfiguration(workflow.canvasId)
      if (!canvas) {
        throw new Error('无法获取画布配置')
      }

      const nodeIds = Object.keys(canvas.nodes)

      // 创建节点间的连接
      if (nodeIds.length >= 2) {
        for (let i = 0; i < nodeIds.length - 1; i++) {
          await bridge.bridge.value.connectNodes(nodeIds[i], nodeIds[i + 1], 'data')
        }
      }

      workflow.step = 4
      notification.success({
        title: '步骤3完成',
        content: `成功创建${nodeIds.length - 1}个连接`,
        duration: 3000
      })

    } catch (error) {
      workflow.error = String(error)
      message.error(`步骤3失败: ${error}`)
    } finally {
      workflow.isProcessing = false
    }
  }

  // 步骤4：保存和验证
  const step4_SaveAndValidate = async () => {
    try {
      workflow.isProcessing = true
      workflow.error = null

      if (!bridge.bridge.value || !workflow.canvasId) {
        throw new Error('前置步骤未完成')
      }

      // 验证画布
      const validation = await bridge.bridge.value.validateCanvas(workflow.canvasId)
      if (!validation.isValid) {
        throw new Error(`画布验证失败: ${validation.errors.join(', ')}`)
      }

      // 保存画布
      await bridge.bridge.value.saveCanvas(workflow.canvasId)

      workflow.step = 5
      notification.success({
        title: '集成工作流完成',
        content: '所有步骤已成功完成！',
        duration: 5000
      })

    } catch (error) {
      workflow.error = String(error)
      message.error(`步骤4失败: ${error}`)
    } finally {
      workflow.isProcessing = false
    }
  }

  // 重置工作流
  const resetWorkflow = () => {
    workflow.step = 1
    workflow.canvasId = ''
    workflow.selectedNodeId = ''
    workflow.isProcessing = false
    workflow.error = null
  }

  // 执行下一步
  const executeNextStep = async () => {
    switch (workflow.step) {
      case 1:
        await step1_CreateCanvas()
        break
      case 2:
        await step2_CreateNodes()
        break
      case 3:
        await step3_ConnectNodes()
        break
      case 4:
        await step4_SaveAndValidate()
        break
      default:
        message.info('工作流已完成')
    }
  }

  return {
    workflow,
    bridge,
    theme,
    executeNextStep,
    resetWorkflow,
    step1_CreateCanvas,
    step2_CreateNodes,
    step3_ConnectNodes,
    step4_SaveAndValidate
  }
}

// ==================== 辅助函数 ====================

/**
 * 生成模拟数据
 *
 * @param type 数据类型
 * @returns 模拟数据
 */
function generateMockData(type: string): any {
  switch (type) {
    case 'chart':
      return {
        categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
        series: [
          { name: 'Series 1', data: [10, 20, 15, 25, 30] },
          { name: 'Series 2', data: [15, 25, 20, 30, 35] }
        ]
      }

    case 'table':
      return {
        columns: [
          { key: 'id', title: 'ID' },
          { key: 'name', title: '名称' },
          { key: 'value', title: '数值' },
          { key: 'status', title: '状态' }
        ],
        rows: [
          { id: 1, name: '项目A', value: 100, status: '正常' },
          { id: 2, name: '项目B', value: 200, status: '警告' },
          { id: 3, name: '项目C', value: 150, status: '正常' }
        ]
      }

    case 'gauge':
      return {
        current: 75,
        target: 100,
        unit: '%',
        ranges: [
          { min: 0, max: 60, color: '#ff4d4f' },
          { min: 60, max: 80, color: '#faad14' },
          { min: 80, max: 100, color: '#52c41a' }
        ]
      }

    case 'map':
      return {
        center: [116.397428, 39.90923],
        zoom: 10,
        markers: [
          { lng: 116.397428, lat: 39.90923, title: '北京' },
          { lng: 121.473701, lat: 31.230416, title: '上海' },
          { lng: 113.264385, lat: 23.129163, title: '广州' }
        ]
      }

    default:
      return {
        type,
        data: 'mock data',
        timestamp: new Date().toISOString()
      }
  }
}

// 导出所有示例函数
export {
  useBasicVisualEditorIntegration,
  useReactiveCanvasExample,
  useNodeConfigurationEditor,
  useThemeAndI18nExample,
  useCompleteIntegrationWorkflow,
  generateMockData
}