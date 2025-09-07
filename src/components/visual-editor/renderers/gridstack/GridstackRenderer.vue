<template>
  <BaseRendererComponent
    :readonly="readonly"
    @ready="onRendererReady"
    @error="onRendererError"
    @node-select="onNodeSelect"
    @canvas-click="onCanvasClick"
  >
    <div class="gridstack-renderer" @click="onCanvasClick">
      <GridLayoutPlusWrapper
        v-if="stateManager.nodes"
        :graph-data="stateManager"
        :readonly="readonly || isPreviewMode"
        :show-widget-titles="showWidgetTitles"
        :static-grid="isPreviewMode"
        :grid-config="gridConfig"
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
 * Gridstack 渲染器组件
 * 🔥 已迁移到新的统一架构
 */

import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useEditorStore } from '@/store/modules/editor'
import { useWidgetStore } from '@/store/modules/widget'
import { globalPreviewMode } from '../../hooks/usePreviewMode'
import BaseRendererComponent from '../base/BaseRendererComponent.vue'
import GridLayoutPlusWrapper from './GridLayoutPlusWrapper.vue'
// 🔥 添加配置事件监听
import { configEventBus, type ConfigChangeEvent } from '@/core/data-architecture/ConfigEventBus'
// 🔥 添加数据源直接获取
import { simpleDataBridge } from '@/core/data-architecture/SimpleDataBridge'

const props = defineProps<{
  readonly?: boolean
  showWidgetTitles?: boolean
  gridConfig?: any
  // 🔥 移除 multiDataSource props - 现在由渲染器直接管理
  // multiDataSourceStore?: Record<string, Record<string, any>>
  // multiDataSourceConfigStore?: Record<string, any>
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

// 🔥 数据源管理 - 直接从 data-architecture 获取
const multiDataSourceStore = ref<Record<string, Record<string, any>>>({})
const multiDataSourceConfigStore = ref<Record<string, any>>({})

// 🔥 配置事件监听 - 让渲染器直接响应配置变更
let configChangeListener: ((event: ConfigChangeEvent) => void) | null = null

onMounted(() => {
  // 监听配置变更事件，自动更新组件
  configChangeListener = async (event: ConfigChangeEvent) => {
    console.log('🔄 GridstackRenderer 收到配置变更:', event)
    
    // 根据配置变更类型进行相应处理
    if (event.section === 'base' || event.section === 'component') {
      // 🔥 基础配置或组件配置变更，需要更新组件状态
      console.log(`组件 ${event.componentId} 的 ${event.section} 配置已更新`)
      
      // 🔥 关键修复：确保组件配置变更能触发组件重新渲染
      // 通过更新组件的properties来触发响应式更新
      const node = stateManager.nodes.find(n => n.id === event.componentId)
      if (node && event.newConfig) {
        // 更新组件的properties，触发重新渲染
        if (event.section === 'component' && event.newConfig.properties) {
          Object.assign(node.properties || {}, event.newConfig.properties)
        }
        // 强制触发响应式更新
        editorStore.updateNode(event.componentId, { ...node })
      }
    } else if (event.section === 'dataSource') {
      // 🔥 数据源配置变更，直接通过 data-architecture 处理
      console.log(`组件 ${event.componentId} 的数据源配置已更新，触发数据重新获取`)
      
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
          
          console.log(`✅ 组件 ${event.componentId} 数据更新成功:`, result.data)
        } else {
          console.warn(`⚠️ 组件 ${event.componentId} 数据获取失败:`, result.error)
        }
      } catch (error) {
        console.error(`❌ 组件 ${event.componentId} 数据处理异常:`, error)
      }
    }
  }
  
  // 🔥 修复：使用正确的API注册监听器
  if (configEventBus && typeof configEventBus.onConfigChange === 'function') {
    const unsubscribe = configEventBus.onConfigChange('config-changed', configChangeListener)
    // 存储取消订阅函数以便清理
    ;(configChangeListener as any).__unsubscribe = unsubscribe
  }

  // 🔥 初始化数据源数据 - 检查现有组件的数据
  initializeDataSources()
})

/**
 * 初始化数据源数据
 * 为现有组件从 simpleDataBridge 获取缓存数据
 */
const initializeDataSources = () => {
  const nodes = stateManager.nodes
  if (!nodes || !Array.isArray(nodes)) return
  
  nodes.forEach(node => {
    // 尝试从 simpleDataBridge 获取缓存数据
    const cachedData = simpleDataBridge.getComponentData(node.id)
    if (cachedData) {
      multiDataSourceStore.value[node.id] = cachedData
      console.log(`🔄 初始化组件 ${node.id} 的缓存数据:`, cachedData)
    }
  })
}

onUnmounted(() => {
  // 🔥 修复：使用正确的API清理事件监听器
  if (configChangeListener && (configChangeListener as any).__unsubscribe) {
    ;(configChangeListener as any).__unsubscribe()
  }
})

// --- Event Handlers to emit upwards to PanelEditor ---

const onRendererReady = () => {
  emit('ready')
}

const onRendererError = (error: Error) => {
  emit('error', error)
}

const onNodeSelect = (nodeId: string) => {
  emit('node-select', nodeId)
}

const onRequestSettings = (nodeId: string) => {
  emit('request-settings', nodeId)
}

const onCanvasClick = () => {
  selectNode('') // use the hook's method to clear selection
  emit('canvas-click')
}
</script>

<style scoped>
.gridstack-renderer {
  width: 100%;
  position: relative;
}
</style>
