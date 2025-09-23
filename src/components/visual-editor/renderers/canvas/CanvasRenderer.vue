<template>
  <BaseRendererComponent
    :readonly="readonly"
    @ready="onRendererReady"
    @error="onRendererError"
    @node-select="onNodeSelect"
    @canvas-click="onCanvasClick"
  >
    <div class="canvas-renderer" @click="onCanvasClick">
      <FabricCanvasWrapper
        v-if="stateManager.nodes"
        :graph-data="stateManager"
        :readonly="readonly || isPreviewMode"
        :show-widget-titles="showWidgetTitles"
        :canvas-config="canvasConfig"
        :multi-data-source-store="multiDataSourceStore"
        :multi-data-source-config-store="multiDataSourceConfigStore"
        @node-select="onNodeSelect"
        @request-settings="onRequestSettings"
      />
    </div>
  </BaseRendererComponent>
</template>

<script setup lang="ts">
/**
 * Canvas 渲染器组件
 * 已迁移到新的统一架构 - 数据管理层
 */

import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useEditorStore } from '@/store/modules/editor'
import { useWidgetStore } from '@/store/modules/widget'
import { globalPreviewMode } from '@/components/visual-editor/hooks/usePreviewMode'
import BaseRendererComponent from '@/components/visual-editor/renderers/base/BaseRendererComponent.vue'
import FabricCanvasWrapper from '@/components/visual-editor/renderers/canvas/FabricCanvasWrapper.vue'
// 添加配置事件监听
import { configEventBus, type ConfigChangeEvent } from '@/core/data-architecture/ConfigEventBus'
// 添加数据源直接获取
import { simpleDataBridge } from '@/core/data-architecture/SimpleDataBridge'
// 添加配置管理器，用于数据源配置更新
import { configurationIntegrationBridge } from '@/components/visual-editor/configuration/ConfigurationIntegrationBridge'

interface CanvasConfig {
  showGrid?: boolean
  backgroundColor?: string
  width?: number
  height?: number
  snapToGrid?: boolean
  gridSize?: number
  enableSelection?: boolean
  enableGroupSelection?: boolean
  preserveObjectStacking?: boolean
}

const props = defineProps<{
  readonly?: boolean
  showWidgetTitles?: boolean
  canvasConfig?: CanvasConfig
}>()

const emit = defineEmits(['ready', 'error', 'node-select', 'canvas-click', 'request-settings'])

// 使用原始的 store
const editorStore = useEditorStore()
const widgetStore = useWidgetStore()

// 为兼容旧组件接口，创建stateManager适配
const stateManager = computed(() => ({
  nodes: editorStore.nodes || [],
  selectedIds: widgetStore.selectedNodeIds || [],
  viewport: editorStore.viewport || { zoom: 1, offsetX: 0, offsetY: 0 }
}))

// 选择节点方法适配
const selectNode = (nodeId: string) => {
  if (nodeId) {
    widgetStore.selectNodes([nodeId])
  } else {
    widgetStore.selectNodes([])
  }
}

// 全局预览模式
const { isPreviewMode } = globalPreviewMode

// Canvas 配置
const canvasConfig = computed(() => ({
  showGrid: true,
  backgroundColor: '#f5f5f5',
  width: 1200,
  height: 800,
  snapToGrid: true,
  gridSize: 10,
  enableSelection: !props.readonly,
  enableGroupSelection: !props.readonly,
  preserveObjectStacking: true,
  ...props.canvasConfig
}))

// 数据源管理 - 直接从 data-architecture 获取
const multiDataSourceStore = ref<Record<string, Record<string, any>>>({})
const multiDataSourceConfigStore = ref<Record<string, any>>({})

// 配置事件监听 - 让渲染器直接响应配置变更
let unsubscribeConfigChange: (() => void) | null = null

onMounted(() => {
  // 监听配置变更事件，自动更新组件
  const configChangeListener = async (event: ConfigChangeEvent) => {
    // 根据配置变更类型进行相应处理
    if (event.section === 'base' || event.section === 'component') {
      // 基础配置或组件配置变更，需要更新组件状态

      // 关键修复：基础配置变更时，自动更新数据源配置中的属性绑定
      if (event.section === 'base' && event.newConfig) {
        await updateDataSourceConfigForBaseConfigChange(event.componentId, event.newConfig, event.oldConfig)
      }

      // 关键修复：确保组件配置变更能触发组件重新渲染
      // 通过更新组件的properties来触发响应式更新
      const node = stateManager.value.nodes.find(n => n.id === event.componentId)
      if (node && event.newConfig) {
        // 更新组件的properties，触发重新渲染
        if (event.section === 'component' && event.newConfig.properties) {
          Object.assign(node.properties || {}, event.newConfig.properties)
        }
        // 强制触发响应式更新
        editorStore.updateNode(event.componentId, { ...node })
      }
    } else if (event.section === 'dataSource') {
      // 数据源配置变更，直接通过 data-architecture 处理

      try {
        // 构建数据需求
        const requirement = {
          componentId: event.componentId,
          dataSources: event.newConfig ? [event.newConfig] : []
        }

        // 直接通过 simpleDataBridge 执行数据获取
        const result = await simpleDataBridge.executeComponent(requirement)

        if (result.success && result.data) {
          // 更新数据源存储
          multiDataSourceStore.value[event.componentId] = result.data
          multiDataSourceConfigStore.value[event.componentId] = event.newConfig
        } else {
          console.error(`⚠️ 组件 ${event.componentId} 数据获取失败:`, result.error)
        }
      } catch (error) {
        console.error(`❌ 组件 ${event.componentId} 数据处理异常:`, error)
      }
    }
  }

  // 注册配置变更监听器，保存取消注册的函数
  unsubscribeConfigChange = configEventBus.onConfigChange('config-changed', configChangeListener)

  // 为现有节点初始化数据源
  initializeExistingNodesData()

  emit('ready')
})

onUnmounted(() => {
  // 移除配置变更监听器
  if (unsubscribeConfigChange) {
    unsubscribeConfigChange()
    unsubscribeConfigChange = null
  }
})

// 基础配置变更时，更新数据源配置中的属性绑定
const updateDataSourceConfigForBaseConfigChange = async (componentId: string, newConfig: any, oldConfig: any) => {
  // 实现基础配置变更的数据源配置更新逻辑
  // 这里可以根据具体需求来实现
  console.log(`[CanvasRenderer] 基础配置变更: ${componentId}`, { newConfig, oldConfig })
}

// 初始化现有节点的数据源
const initializeExistingNodesData = async () => {
  const nodes = stateManager.value.nodes
  for (const node of nodes) {
    // 尝试从缓存或配置中获取数据源配置
    const cachedConfig = multiDataSourceConfigStore.value[node.id]
    if (cachedConfig) {
      // 如果有缓存的配置，尝试获取数据
      try {
        const requirement = {
          componentId: node.id,
          dataSources: [cachedConfig]
        }

        const result = await simpleDataBridge.executeComponent(requirement)
        if (result.success && result.data) {
          multiDataSourceStore.value[node.id] = result.data
        }
      } catch (error) {
        console.warn(`[CanvasRenderer] 节点 ${node.id} 数据初始化失败:`, error)
      }
    }
  }
}

// 事件处理器
const onRendererReady = () => {
  emit('ready')
}

const onRendererError = (error: Error) => {
  emit('error', error)
}

const onNodeSelect = (nodeId: string) => {
  selectNode(nodeId)
  emit('node-select', nodeId)
}

const onCanvasClick = (event?: MouseEvent) => {
  emit('canvas-click', event)
}

const onRequestSettings = (nodeId: string) => {
  emit('request-settings', nodeId)
}
</script>

<style scoped>
.canvas-renderer {
  width: 100%;
  height: 100%;
  min-height: 600px;
}
</style>