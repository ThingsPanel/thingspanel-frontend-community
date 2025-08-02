<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useDialog, useMessage, NDrawer, NDrawerContent } from 'naive-ui'
import { useFullscreen } from '@vueuse/core'
import { useAppStore } from '@/store/modules/app'
import FullScreen from '@/components/common/full-screen.vue'
import { $t } from '@/locales'
import { getBoard, PutBoard } from '@/service/api'
import EditorLayout from './components/Layout/EditorLayout.vue'
import { VisualEditorToolbar } from './components/toolbar'
import WidgetLibrary from './components/WidgetLibrary/WidgetLibrary.vue'
import { initializeSettings, SettingsPanel } from './settings'
import { CanvasRenderer, GridstackRenderer } from './renderers'
import { createEditor, useCard2Integration } from './hooks'
import type { RendererType, VisualEditorWidget, GraphData } from './types'

// 初始化 Card 2.1 集成
useCard2Integration({
  autoInit: true,
  devMode: import.meta.env.DEV, // 开发模式下开启 devMode
})


// 初始化设置面板
initializeSettings()

const dialog = useDialog()
const message = useMessage()
const appStore = useAppStore()

const props = defineProps<{ panelId: string }>()

// 状态管理
const panelData = ref<Panel.Board>()
const fullui = ref()
const isEditing = ref(false) // 默认预览模式
const isSaving = ref(false)
const dataFetched = ref(false)
const hasChanges = ref(false)
const isUnmounted = ref(false)

// 编辑器状态
const editorConfig = ref<any>({})
const preEditorConfig = ref<any>({})
const currentRenderer = ref<RendererType>('gridstack')

// 抽屉状态 - 初始状态：预览模式，抽屉关闭
const showLeftDrawer = ref(false)  // 左侧组件库抽屉
const showRightDrawer = ref(false)  // 右侧属性面板抽屉

// 拖拽状态管理
const isDragging = ref(false)
const draggedComponent = ref<string | null>(null)
const selectedNodeId = ref<string>('')
const showWidgetTitles = ref(true) // 总开关，默认显示标题

// 全屏功能
const { isFullscreen, toggle } = useFullscreen(fullui)

// 创建编辑器上下文
const { stateManager, addWidget, selectNode, updateNode } = createEditor()

const selectedWidget = computed<VisualEditorWidget | null>(() => {
  if (!selectedNodeId.value) return null
  // Correctly find the node from the state manager's nodes array
  return stateManager.canvasState.value.nodes.find(node => node.id === selectedNodeId.value) || null
})


// 状态管理辅助方法
const setState = (config: any) => {
  console.log('🔄 设置编辑器状态:', config)
  
  // 重置状态
  stateManager.reset()
  
  // 加载节点
  if (config.nodes && Array.isArray(config.nodes)) {
    config.nodes.forEach((node: any) => {
      stateManager.addNode(node as GraphData)
    })
  }
  
  // 加载视口设置
  if (config.viewport) {
    stateManager.updateViewport(config.viewport)
  }
}

const getState = () => {
  const canvasState = stateManager.canvasState.value
  return {
    nodes: canvasState.nodes,
    canvasConfig: editorConfig.value.canvasConfig || {},
    viewport: canvasState.viewport,
    mode: canvasState.mode
  }
}

// 获取面板数据 - 学习 fetchBroad 的写法
const fetchBoard = async () => {
  try {
    const { data } = await getBoard(props.panelId)
    // 检查组件是否已经卸载
    if (isUnmounted.value) {
      console.log('组件已卸载，取消数据处理')
      return
    }
    if (data) {
      panelData.value = data
      console.log('📊 获取面板数据成功:', data)
      
      if (data.config) {
        console.log('📝 解析现有配置:', data.config)
        const config = parseConfig(data.config)
        editorConfig.value = config.visualEditor || getDefaultConfig()
        preEditorConfig.value = JSON.parse(JSON.stringify(editorConfig.value))
        
        // 加载到编辑器
        setState(editorConfig.value)
        console.log('🎯 加载编辑器配置:', editorConfig.value)
      } else {
        console.log('📝 配置为空，使用默认配置')
        editorConfig.value = getDefaultConfig()
        preEditorConfig.value = JSON.parse(JSON.stringify(editorConfig.value))
        setState(editorConfig.value)
      }
      if (!isUnmounted.value) {
        dataFetched.value = true
        message.success('面板数据加载成功')
      }
    } else {
      console.warn('⚠️ 未获取到面板数据')
      if (!isUnmounted.value) {
        message.warning('未获取到面板数据，使用默认配置')
      }
      
      // 即使没有数据也要初始化默认配置
      editorConfig.value = getDefaultConfig()
      preEditorConfig.value = JSON.parse(JSON.stringify(editorConfig.value))
      setState(editorConfig.value)
      if (!isUnmounted.value) {
        dataFetched.value = true
      }
    }
  } catch (error: any) {
    console.error('获取面板数据失败:', error)
    if (!isUnmounted.value) {
      message.warning('获取面板数据失败，使用默认配置')
    }
    
    // 出错时也要初始化默认配置，让编辑器能正常工作
    editorConfig.value = getDefaultConfig()
    preEditorConfig.value = JSON.parse(JSON.stringify(editorConfig.value))
    setState(editorConfig.value)
    if (!isUnmounted.value) {
      dataFetched.value = true
    }
  }
}

// 解析配置
const parseConfig = (configString: string) => {
  try {
    const config = JSON.parse(configString)
    
    // 检查是否为新格式
    if (typeof config === 'object' && config.visualEditor) {
      return config
    }
    
    // 兼容旧格式
    return {
      legacyComponents: Array.isArray(config) ? config : [],
      visualEditor: getDefaultConfig()
    }
  } catch (error: any) {
    console.warn('配置解析失败:', error)
    return {
      legacyComponents: [],
      visualEditor: getDefaultConfig()
    }
  }
}

// 默认配置
const getDefaultConfig = () => ({
  nodes: [],
  canvasConfig: {
    width: 1200,
    height: 800,
    showGrid: true,
    backgroundColor: '#f5f5f5'
  },
  viewport: {}
})

// 渲染器选项
const rendererOptions = [
  { label: '大屏', value: 'canvas' as RendererType },
  { label: '看板', value: 'gridstack' as RendererType }
]

// 工具栏事件处理
const handleModeChange = (mode: 'edit' | 'preview') => {
  if (mode === 'edit') {
    isEditing.value = true
    // 进入编辑模式时自动打开组件库抽屉
    showLeftDrawer.value = true
    // 如果有选中的节点，打开属性面板抽屉
    if (selectedNodeId.value) {
      showRightDrawer.value = true
    }
  } else {
    const currentState = getState()
    if (JSON.stringify(currentState) !== JSON.stringify(preEditorConfig.value)) {
      dialog.warning({
        title: $t('card.quitWithoutSave'),
        positiveText: $t('device_template.confirm'),
        negativeText: $t('common.cancel'),
        onPositiveClick: () => {
          isEditing.value = false
          // 退出编辑模式时关闭所有抽屉
          showLeftDrawer.value = false
          showRightDrawer.value = false
          // 清空选中状态
          selectedNodeId.value = ''
          editorConfig.value = preEditorConfig.value
          setState(preEditorConfig.value)
        }
      })
    } else {
      isEditing.value = false
      // 退出编辑模式时关闭所有抽屉
      showLeftDrawer.value = false
      showRightDrawer.value = false
      // 清空选中状态
      selectedNodeId.value = ''
    }
  }
}

// 抽屉控制事件处理
const handleToggleLeftDrawer = () => {
  showLeftDrawer.value = !showLeftDrawer.value
}

const handleToggleRightDrawer = () => {
  showRightDrawer.value = !showRightDrawer.value
}

// 拖拽事件处理
const handleDragStart = (componentType: string) => {
  console.log('🎯 开始拖拽组件:', componentType)
  isDragging.value = true
  draggedComponent.value = componentType
}

const handleDragEnd = () => {
  console.log('🎯 结束拖拽')
  isDragging.value = false
  draggedComponent.value = null
}

const handleRendererChange = (renderer: RendererType) => {
  currentRenderer.value = renderer
  hasChanges.value = true
}

const handleAddWidget = async (widgetType: string) => {
  try {
    await addWidget(widgetType)
    hasChanges.value = true
    message.success(`成功添加 ${widgetType} 组件`)
  } catch (error: any) {
    console.error(`❌ 添加组件失败 [${widgetType}]:`, error)
    message.error(`添加 ${widgetType} 组件失败: ${error.message || '未知错误'}`)
  }
}

const handleClearAll = () => {
  stateManager.reset()
  hasChanges.value = true
  message.success('已清空所有节点')
}

// 导入导出处理
const handleImportConfig = (config: Record<string, any>) => {
  try {
    console.log('导入配置:', config)
    
    // 验证配置格式
    if (config && typeof config === 'object') {
      // 如果是新格式配置
      if (config.visualEditor) {
        editorConfig.value = config.visualEditor
        setState(config.visualEditor)
      } 
      // 如果是直接的编辑器配置
      else if (config.nodes || config.canvasConfig) {
        editorConfig.value = config
        setState(config)
      }
      // 否则当作旧格式处理
      else {
        const newConfig = getDefaultConfig()
        editorConfig.value = newConfig
        setState(newConfig)
      }
      
      hasChanges.value = true
      message.success('配置导入成功')
    } else {
      throw new Error('无效的配置格式')
    }
  } catch (error: any) {
    console.error('导入配置失败:', error)
    message.error('导入配置失败: ' + (error.message || '未知错误'))
  }
}

const handleExportConfig = () => {
  try {
    const currentState = getState()
    const exportConfig = {
      visualEditor: {
        ...currentState,
        metadata: {
          version: '1.0.0',
          exportedAt: Date.now(),
          editorType: 'visual-editor'
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
    a.download = `panel-config-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    message.success('配置导出成功')
  } catch (error: any) {
    console.error('导出配置失败:', error)
    message.error('导出配置失败: ' + (error.message || '未知错误'))
  }
}

// 视图控制事件
const handleToggleWidgetTitles = (value: boolean) => {
  showWidgetTitles.value = value
}

const handleZoomIn = () => {
  // TODO: 实现缩放功能
  console.log('放大视图')
}

const handleZoomOut = () => {
  // TODO: 实现缩放功能
  console.log('缩小视图')
}

const handleResetZoom = () => {
  // TODO: 实现重置缩放功能
  console.log('重置缩放')
}

const handleUndo = () => {
  // TODO: 实现撤销功能
  console.log('撤销操作')
}

const handleRedo = () => {
  // TODO: 实现重做功能
  console.log('重做操作')
}

// 注意：面板控制现在由编辑模式自动管理，不再需要手动切换

// 渲染器事件处理
const handleRendererReady = () => {
  console.log('✅ 渲染器已准备就绪')
}

const handleRendererError = (error: Error) => {
  console.error('❌ 渲染器错误:', error)
  message.error('渲染器加载失败: ' + error.message)
}

const handleNodeSelect = (nodeId: string) => {
  selectedNodeId.value = nodeId
  selectNode(nodeId)
  // 选中节点时，如果在编辑模式，自动打开属性抽屉
  if (isEditing.value && nodeId) {
    showRightDrawer.value = true
  }
}

const handleCanvasClick = () => {
  selectedNodeId.value = ''
  selectNode('')
  // 取消选中时可以选择性隐藏属性面板（或保持展开）
  // rightCollapsed.value = true
}

// 保存面板
const handleSave = async () => {
  isSaving.value = true
  try {
    const currentState = getState()
    
    // 解析现有配置
    let existingConfig: any = {}
    if (panelData.value?.config) {
      try {
        existingConfig = parseConfig(panelData.value.config)
      } catch (error: any) {
        console.warn('解析现有配置失败:', error)
      }
    }

    // 构建新配置
    const newConfig = {
      legacyComponents: existingConfig.legacyComponents || [],
      visualEditor: {
        ...currentState,
        metadata: {
          version: '1.0.0',
          updatedAt: Date.now(),
          editorType: 'visual-editor'
        }
      }
    }

    const { error } = await PutBoard({
      id: props.panelId,
      config: JSON.stringify(newConfig),
      name: panelData.value?.name,
      home_flag: panelData.value?.home_flag
    })

    if (!error) {
      preEditorConfig.value = JSON.parse(JSON.stringify(currentState))
      hasChanges.value = false
      message.success($t('page.dataForward.saveSuccess'))
    } else {
      message.error($t('page.dataForward.saveFailed') || '保存失败')
    }
  } catch (err: any) {
    message.error($t('page.dataForward.saveFailed') || '保存失败')
    console.error('保存失败:', err)
  } finally {
    isSaving.value = false
  }
}

// 学习 PanelManage 的 onMounted 写法
onMounted(() => {
  fetchBoard()
})

// 组件卸载时的清理工作
onUnmounted(() => {
  isUnmounted.value = true
  console.log('PanelEditor 组件已卸载')
})
</script>

<template>
  <div class="w-full px-5 py-5">
    <!-- 页面标题栏 -->
    <div
      v-show="!appStore.fullContent"
      class="flex items-center justify-between border-b border-gray-200 px-10px pb-3 dark:border-gray-200/10"
    >
      <div>
        <NSpace align="center">
          <span class="text-14px font-medium line-height-normal">
            {{ $t('card.dashboard') }}：{{ panelData?.name }}
          </span>
        </NSpace>
      </div>
      <NSpace align="center">
        <FullScreen
          :full="isFullscreen"
          @click="toggle"
        />
      </NSpace>
    </div>

    <!-- 编辑器区域 -->
    <div ref="fullui" class="h-edit-area flex bg-white">
      <div v-if="!dataFetched" class="h-full flex items-center justify-center w-full">
        <n-spin size="large">
          <template #description>
            正在加载编辑器...
          </template>
        </n-spin>
      </div>

      <div v-else class="panel-editor w-full h-full flex flex-col">
        <!-- 工具栏 -->
        <div class="toolbar-container flex-shrink-0">
          <VisualEditorToolbar
            v-if="dataFetched && !isUnmounted"
            :key="`toolbar-${currentRenderer}-${isEditing ? 'edit' : 'preview'}`"
            :mode="isEditing ? 'edit' : 'preview'"
            :current-renderer="currentRenderer"
            :available-renderers="rendererOptions"
            :is-saving="isSaving"
            :has-changes="hasChanges"
            :show-left-drawer="showLeftDrawer"
            :show-right-drawer="showRightDrawer"
            @mode-change="handleModeChange"
            @renderer-change="handleRendererChange"
            @save="handleSave"
            @import="handleImportConfig"
            @export="handleExportConfig"
            @import-config="handleImportConfig"
            @export-config="handleExportConfig"
            @undo="handleUndo"
            @redo="handleRedo"
            @clear-all="handleClearAll"
            @zoom-in="handleZoomIn"
            @zoom-out="handleZoomOut"
            @reset-zoom="handleResetZoom"
            @toggle-left-drawer="handleToggleLeftDrawer"
            @toggle-right-drawer="handleToggleRightDrawer"
          />
        </div>

        <!-- 主内容区域 -->
        <div class="main-container flex-1 relative overflow-hidden" :class="{ dragging: isDragging }">
          <!-- 中央画布 -->
          <div class="canvas-container h-full w-full" @click="handleCanvasClick">
            <!-- 动态渲染器 -->
            <CanvasRenderer 
              v-if="currentRenderer === 'canvas' && dataFetched && !isUnmounted" 
              key="canvas-renderer"
              :readonly="!isEditing"
              :show-widget-titles="showWidgetTitles"
              class="renderer-container"
              @ready="handleRendererReady"
              @error="handleRendererError"
              @node-select="handleNodeSelect"
              @canvas-click="handleCanvasClick"
            />
            <GridstackRenderer 
              v-else-if="currentRenderer === 'gridstack' && dataFetched && !isUnmounted" 
              key="gridstack-renderer"
              :readonly="!isEditing"
              :show-widget-titles="showWidgetTitles"
              class="renderer-container"
              @ready="handleRendererReady" 
              @error="handleRendererError"
              @node-select="handleNodeSelect"
              @canvas-click="handleCanvasClick"
            />
          </div>

          <!-- 左侧组件库抽屉 -->
          <NDrawer
            v-model:show="showLeftDrawer"
            :width="320"
            placement="left"
            :show-mask="true"
            :mask-closable="true"
            :closable="true"
            :auto-focus="false"
            :z-index="1000"
            :trap-focus="false"
          >
            <NDrawerContent title="组件库" :native-scrollbar="false">
              <WidgetLibrary 
                @add-widget="handleAddWidget"
                @drag-start="handleDragStart"
                @drag-end="handleDragEnd"
              />
            </NDrawerContent>
          </NDrawer>

          <!-- 右侧属性面板抽屉 -->
          <NDrawer
            v-model:show="showRightDrawer"
            :width="360"
            placement="right"
            :show-mask="true"
            :mask-closable="true"
            :closable="true"
            :auto-focus="false"
            :z-index="1000"
            :trap-focus="false"
          >
            <NDrawerContent title="属性设置" :native-scrollbar="false">
              <SettingsPanel 
                :selected-widget="selectedWidget"
                :show-widget-titles="showWidgetTitles"
                @toggle-widget-titles="handleToggleWidgetTitles"
              />
            </NDrawerContent>
          </NDrawer>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.panel-editor {
  min-height: 600px;
}

.h-edit-area {
  height: calc(100% - 30px);
}

/* 画布容器 */
.canvas-container {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background-color: var(--n-body-color);
}

.renderer-container {
  width: 100%;
  height: 100%;
}

/* 拖拽状态样式 */
.main-container.dragging .n-drawer {
  opacity: 0.3;
  transition: opacity 0.2s ease;
}

.main-container.dragging .n-drawer-mask {
  pointer-events: none;
}

/* 确保拖拽元素在最顶层 */
.dragging-element {
  position: fixed;
  z-index: 9999 !important;
  pointer-events: none;
}

/* 抽屉内容优化 */
:deep(.n-drawer-content) {
  height: 100%;
}

:deep(.n-drawer-content .n-drawer-content__content) {
  padding: 0;
  height: 100%;
}

/* 工具栏容器 */
.toolbar-container {
  border-bottom: 1px solid #e0e0e0;
  background-color: #fff;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .panel-editor {
    min-height: 400px;
  }
}
</style>
