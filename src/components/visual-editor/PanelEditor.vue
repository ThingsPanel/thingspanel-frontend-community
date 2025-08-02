<script setup lang="ts">
import { nextTick, onMounted, reactive, ref } from 'vue'
import { useDialog, useMessage } from 'naive-ui'
import { useFullscreen } from '@vueuse/core'
import { useAppStore } from '@/store/modules/app'
import { $t } from '@/locales'
import { getBoard, PutBoard } from '@/service/api'
import EditorLayout from './components/Layout/EditorLayout.vue'
import WidgetLibrary from './components/WidgetLibrary/WidgetLibrary.vue'
import PropertyPanel from './components/PropertyPanel/PropertyPanel.vue'
import { CanvasRenderer, GridstackRenderer } from './renderers'
import { createEditor } from './hooks/useEditor'
import type { RendererType } from './types'

const dialog = useDialog()
const message = useMessage()
const appStore = useAppStore()

const props = defineProps<{ panelId: string }>()

// 状态管理
const panelData = ref<Panel.Board>()
const fullui = ref()
const isEditing = ref(false)
const isSaving = ref(false)
const dataFetched = ref(false)

// 编辑器状态
const editorConfig = ref<any>({})
const preEditorConfig = ref<any>({})
const currentRenderer = ref<RendererType>('canvas')

// 全屏功能
const { isFullscreen, toggle } = useFullscreen(fullui)

// 创建编辑器上下文
const { stateManager, addWidget, selectNode, updateNode } = createEditor()

// 状态管理辅助方法
const setState = (config: any) => {
  console.log('🔄 设置编辑器状态:', config)
  
  // 重置状态
  stateManager.reset()
  
  // 加载节点
  if (config.nodes && Array.isArray(config.nodes)) {
    config.nodes.forEach((node: any) => {
      stateManager.addNode(node)
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
      dataFetched.value = true
      message.success('面板数据加载成功')
    } else {
      console.warn('⚠️ 未获取到面板数据')
      message.warning('未获取到面板数据，使用默认配置')
      
      // 即使没有数据也要初始化默认配置
      editorConfig.value = getDefaultConfig()
      preEditorConfig.value = JSON.parse(JSON.stringify(editorConfig.value))
      setState(editorConfig.value)
      dataFetched.value = true
    }
  } catch (error) {
    console.error('获取面板数据失败:', error)
    message.warning('获取面板数据失败，使用默认配置')
    
    // 出错时也要初始化默认配置，让编辑器能正常工作
    editorConfig.value = getDefaultConfig()
    preEditorConfig.value = JSON.parse(JSON.stringify(editorConfig.value))
    setState(editorConfig.value)
    dataFetched.value = true
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
  } catch (error) {
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

// 进入编辑模式
const toEditMode = () => {
  isEditing.value = true
}

// 退出编辑模式
const quitEditMode = () => {
  const currentState = getState()
  if (JSON.stringify(currentState) !== JSON.stringify(preEditorConfig.value)) {
    dialog.warning({
      title: $t('card.quitWithoutSave'),
      positiveText: $t('device_template.confirm'),
      negativeText: $t('common.cancel'),
      onPositiveClick: () => {
        isEditing.value = false
        editorConfig.value = preEditorConfig.value
        setState(preEditorConfig.value)
      }
    })
  } else {
    isEditing.value = false
  }
}

// 添加组件
const handleAddWidget = (widgetType: string) => {
  addWidget(widgetType)
}

// 切换渲染器
const switchRenderer = (renderer: RendererType) => {
  console.log('🔄 切换渲染器:', renderer)
  
  // 添加安全检查
  if (!stateManager || !stateManager.canvasState) {
    console.error('❌ StateManager 或 canvasState 未初始化')
    currentRenderer.value = renderer
    return
  }
  
  const currentNodes = stateManager.canvasState.value.nodes
  console.log('📊 当前节点数量:', currentNodes?.length || 0)
  console.log('📋 节点详情:', currentNodes)
  
  currentRenderer.value = renderer
  
  // 确保所有现有节点都支持新的渲染器
  if (currentNodes && currentNodes.length > 0) {
    currentNodes.forEach((node: any) => {
      if (!node.renderer || !node.renderer.includes(renderer)) {
        console.log(`📝 更新节点 ${node.id} 支持渲染器 ${renderer}`)
        updateNode(node.id, {
          renderer: [...(node.renderer || []), renderer]
        })
      }
    })
  }
}

// 渲染器选项
const rendererOptions = [
  { label: 'Canvas 画布', value: 'canvas' as RendererType },
  { label: 'GridStack 网格', value: 'gridstack' as RendererType }
]

// 清空所有节点
const clearAllNodes = () => {
  console.log('🧹 清空所有节点')
  stateManager.reset()
  message.success('已清空所有节点')
}

// 渲染器事件处理
const handleRendererReady = () => {
  console.log('✅ 渲染器已准备就绪')
}

const handleRendererError = (error: Error) => {
  console.error('❌ 渲染器错误:', error)
  message.error('渲染器加载失败: ' + error.message)
}

const handleNodeSelect = (nodeId: string) => {
  console.log('🎯 节点被选中:', nodeId)
}

// 保存面板 - 学习 savePanel 的写法
const savePanel = async () => {
  isSaving.value = true
  try {
    const currentState = getState()
    
    // 解析现有配置
    let existingConfig: any = {}
    if (panelData.value?.config) {
      try {
        existingConfig = parseConfig(panelData.value.config)
      } catch (error) {
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
      message.success($t('page.dataForward.saveSuccess'))
    } else {
      message.error($t('page.dataForward.saveFailed') || '保存失败')
    }
  } catch (err) {
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
</script>

<template>
  <div class="w-full px-5 py-5">
    <!-- 工具栏 -->
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
        <NDivider vertical />
        
        <!-- 渲染器切换 -->
        <template v-if="isEditing">
          <span class="text-12px text-gray-500">渲染器:</span>
          <NSelect
            v-model:value="currentRenderer"
            :options="rendererOptions"
            size="small"
            style="width: 120px"
            @update:value="switchRenderer"
          />
          
          <!-- 清空按钮 -->
          <NPopconfirm
            positive-text="确认清空"
            negative-text="取消"
            @positive-click="clearAllNodes"
          >
            <template #trigger>
              <NButton size="small" type="error" secondary>
                🧹 清空
              </NButton>
            </template>
            <span>确定要清空所有节点吗？此操作不可撤销。</span>
          </NPopconfirm>
          
          <NDivider vertical />
        </template>
        
        <NButton v-if="!isEditing" @click="toEditMode">
          <SvgIcon icon="material-symbols:edit" class="mr-0.5 text-lg" />
          {{ $t('generate.edit') }}
        </NButton>
        <NButton v-if="isEditing" @click="quitEditMode">{{ $t('card.quitEdit') }}</NButton>
        <NButton v-show="isEditing" :loading="isSaving" @click="savePanel">{{ $t('common.save') }}</NButton>
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

      <div v-else class="panel-editor w-full h-full">
        <EditorLayout v-if="isEditing">
          <template #left>
            <WidgetLibrary @add-widget="handleAddWidget" />
          </template>
          <template #main>
            <!-- 动态渲染器切换 - 统一渲染器架构 -->
            <CanvasRenderer 
              v-if="currentRenderer === 'canvas'" 
              :readonly="!isEditing"
              @ready="handleRendererReady"
              @error="handleRendererError"
              @node-select="handleNodeSelect"
            />
            <GridstackRenderer 
              v-else-if="currentRenderer === 'gridstack'" 
              :readonly="!isEditing"
              @ready="handleRendererReady"
              @error="handleRendererError" 
              @node-select="handleNodeSelect"
            />
          </template>
          <template #right>
            <PropertyPanel />
          </template>
        </EditorLayout>
        
        <!-- 预览模式 -->
        <div v-else class="preview-mode w-full h-full">
          <div class="preview-content">
            <h3>预览模式</h3>
            <p>面板名称: {{ panelData?.name }}</p>
            <p>面板ID: {{ panelData?.id }}</p>
            <p>节点数量: {{ editorConfig.nodes?.length || 0 }}</p>
            <p>画布尺寸: {{ editorConfig.canvasConfig?.width || 0 }} x {{ editorConfig.canvasConfig?.height || 0 }}</p>
            <details>
              <summary>配置详情</summary>
              <pre>{{ JSON.stringify(editorConfig, null, 2) }}</pre>
            </details>
          </div>
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

.preview-mode {
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--n-body-color);
  padding: 20px;
}

.preview-content {
  background: var(--n-card-color);
  padding: 20px;
  border-radius: 8px;
  border: 1px solid var(--n-border-color);
  max-width: 600px;
  width: 100%;
}

.preview-content h3 {
  margin: 0 0 16px 0;
  color: var(--n-text-color);
}

.preview-content p {
  margin: 8px 0;
  color: var(--n-text-color-2);
}

.preview-content pre {
  background: var(--n-code-color);
  padding: 12px;
  border-radius: 4px;
  font-size: 12px;
  overflow: auto;
  max-height: 300px;
}
</style>