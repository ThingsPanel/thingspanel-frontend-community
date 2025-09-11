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
import { globalPreviewMode } from '@/components/visual-editor/hooks/usePreviewMode'
import BaseRendererComponent from '@/components/visual-editor/renderers/base/BaseRendererComponent.vue'
import GridLayoutPlusWrapper from '@/components/visual-editor/renderers/gridstack/GridLayoutPlusWrapper.vue'
// 🔥 添加配置事件监听
import { configEventBus, type ConfigChangeEvent } from '@/core/data-architecture/ConfigEventBus'
// 🔥 添加数据源直接获取
import { simpleDataBridge } from '@/core/data-architecture/SimpleDataBridge'
// 🔥 添加配置管理器，用于数据源配置更新
import { configurationIntegrationBridge } from '@/components/visual-editor/configuration/ConfigurationIntegrationBridge'

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

      // 🔥 关键修复：基础配置变更时，自动更新数据源配置中的属性绑定
      if (event.section === 'base' && event.newConfig) {
        await updateDataSourceConfigForBaseConfigChange(event.componentId, event.newConfig, event.oldConfig)
      }

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

/**
 * 🔥 关键修复：基础配置变更时更新数据源配置中的属性绑定
 * 当deviceId等基础配置变更时，自动更新数据源配置中依赖这些字段的绑定值
 */
const updateDataSourceConfigForBaseConfigChange = async (
  componentId: string,
  newBaseConfig: any,
  oldBaseConfig: any
) => {
  try {
    console.log(`🔄 [GridstackRenderer] 处理基础配置变更，更新数据源配置`, {
      componentId,
      newBaseConfig,
      oldBaseConfig
    })

    // 获取当前组件的完整配置
    const fullConfig = configurationIntegrationBridge.getConfiguration(componentId)
    if (!fullConfig || !fullConfig.dataSource) {
      console.log(`⚠️ 组件 ${componentId} 没有数据源配置，跳过更新`)
      return
    }

    // 检查是否需要更新数据源配置
    let needsUpdate = false
    const updatedDataSourceConfig = JSON.parse(JSON.stringify(fullConfig.dataSource)) // 深克隆

    // 检查基础配置中的关键字段变化
    const baseConfigFields = ['deviceId', 'metricsList']
    const changes: Array<{ field: string; oldValue: any; newValue: any }> = []

    baseConfigFields.forEach(fieldName => {
      const newValue = newBaseConfig[fieldName]
      const oldValue = oldBaseConfig?.[fieldName]

      if (newValue !== oldValue) {
        changes.push({ field: fieldName, oldValue, newValue })
        console.log(`🔄 [GridstackRenderer] 检测到 ${fieldName} 变化: ${oldValue} → ${newValue}`)
      }
    })

    if (changes.length === 0) {
      console.log(`⚠️ 基础配置无关键字段变化，跳过数据源更新`)
      return
    }

    // 🔥 修复：递归更新数据源配置中的属性绑定引用，支持多种绑定格式
    const updateBindingReferences = (obj: any, path: string = '') => {
      if (!obj || typeof obj !== 'object') return

      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          const value = obj[key]
          const currentPath = path ? `${path}.${key}` : key

          if (typeof value === 'string') {
            // 1. 检查字符串中是否包含直接的属性绑定引用
            changes.forEach(({ field, newValue }) => {
              const bindingPattern = `${componentId}.base.${field}`
              if (value.includes(bindingPattern)) {
                console.log(`🎯 [GridstackRenderer] 更新直接绑定引用`, {
                  path: currentPath,
                  oldValue: value,
                  bindingPattern,
                  newValue
                })
                obj[key] = newValue
                needsUpdate = true
              }
            })
          } else if (Array.isArray(value)) {
            // 2. 处理数组（如pathParams）
            value.forEach((item, index) => {
              if (item && typeof item === 'object') {
                updateBindingReferences(item, `${currentPath}[${index}]`)
              }
            })
          } else if (typeof value === 'object') {
            // 3. 检查HTTP参数对象是否使用组件属性绑定
            if (value.selectedTemplate === 'component-property-binding' && value.valueMode === 'component') {
              changes.forEach(({ field, newValue }) => {
                // 检查是否绑定到基础配置字段
                // 这里需要更智能的检测逻辑
                const isBaseConfigBinding = path.includes('pathParam') || path.includes('Param')
                if (isBaseConfigBinding && field === 'deviceId') {
                  console.log(`🎯 [GridstackRenderer] 发现HTTP参数组件属性绑定，更新绑定值`, {
                    path: currentPath,
                    paramConfig: value,
                    field,
                    newValue
                  })
                  // 更新绑定值为新的deviceId
                  value.value = newValue
                  value.defaultValue = newValue
                  needsUpdate = true
                }
              })
            }
            // 继续递归处理子对象
            updateBindingReferences(value, currentPath)
          }
        }
      }
    }

    updateBindingReferences(updatedDataSourceConfig)

    // 如果有更新，触发数据源配置变更
    if (needsUpdate) {
      console.log(`✅ [GridstackRenderer] 更新数据源配置并触发重新执行`, {
        componentId,
        changes,
        updatedConfig: updatedDataSourceConfig
      })

      // 通过ConfigurationIntegrationBridge更新数据源配置，这会触发ConfigEventBus事件
      configurationIntegrationBridge.updateConfiguration(componentId, 'dataSource', updatedDataSourceConfig)
    } else {
      console.log(`⚠️ 数据源配置中未发现属性绑定引用，无需更新`)
    }
  } catch (error) {
    console.error(`❌ [GridstackRenderer] 基础配置变更处理失败`, {
      componentId,
      error: error instanceof Error ? error.message : error
    })
  }
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
