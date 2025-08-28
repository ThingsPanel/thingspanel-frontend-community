<template>
  <div ref="containerRef" class="card2-wrapper" :data-component-id="props.nodeId">
    <!-- 错误状态 -->
    <div v-if="hasError" class="error-overlay">
      <n-alert type="error" :title="$t('visualEditor.renderFailed')" size="small">
        {{ errorMessage }}
      </n-alert>
    </div>

    <!-- 动态组件渲染 -->
    <component
      :is="componentToRender"
      v-else-if="componentToRender"
      ref="currentComponentRef"
      :key="`${props.nodeId}-${forceUpdateKey}`"
      :config="extractComponentConfig()"
      :raw-data-sources="JSON.parse(JSON.stringify(getDataSourcesForComponent()))"
      :component-id="props.nodeId"
      :show-interaction-indicator="true"
      :interaction-configs="props.interactionConfigs"
      :allow-external-control="props.allowExternalControl"
      :interaction-permissions="props.interactionPermissions"
      :preview-mode="props.previewMode"
      v-bind="getComponentSpecificProps()"
    />
  </div>
</template>

<script setup lang="ts">
/**
 * Card2.1 组件包装器
 * 🔥 已迁移到新的统一架构
 */

import { ref, onMounted, watch, shallowRef, onBeforeUnmount, computed, inject, type Component } from 'vue'
import { interactionManager } from '@/card2.1/core/interaction-manager'
import { NAlert } from 'naive-ui'
import { $t } from '@/locales'
import { useVisualEditorIntegration as useCard2Integration } from '@/card2.1/hooks/useVisualEditorIntegration'
import type { DataSourceValue } from '../../types/data-source'
// 🔥 新增：导入新架构的数据桥接器和配置管理器
import { visualEditorBridge } from '@/core/data-architecture/VisualEditorBridge'
import { configurationManager } from '@/components/visual-editor/configuration/ConfigurationManager'
// 🔥 导入通用数据源映射器
import { DataSourceMapper } from '@/card2.1/core/data-source-mapper'

interface Props {
  componentType: string
  config?: any
  data?: any // data prop暂时保留，但目前未使用
  metadata?: any // 完整的metadata对象，包含dataConfig等配置
  dataSource?: any // 数据源配置
  dataSources?: Record<string, any> // 多数据源数据
  dataSourcesConfig?: any // 多数据源配置（包含路径映射等）
  nodeId: string

  // 🔥 交互系统相关props
  interactionConfigs?: any[]
  allowExternalControl?: boolean
  interactionPermissions?: any
  previewMode?: boolean
}

const props = defineProps<Props>()

// 🔥 使用Card2集成
const card2Integration = useCard2Integration({ autoInit: true })

// State
const hasError = ref(false)
const errorMessage = ref('')
const componentToRender = shallowRef<Component | null>(null)
const dataSourceValue = ref<DataSourceValue | null>(null)
let currentSubscriberId: (() => void) | null = null

// 🔥 新增：从VisualEditorBridge获取的执行数据
const executorData = ref<Record<string, any>>({})
let executorDataCleanup: (() => void) | null = null

// 强制更新键，用于触发组件重新渲染
const forceUpdateKey = ref(0)

// 🔥 组件实例引用，用于触发属性变化事件
const currentComponentRef = ref<any>(null)
// 🔥 容器引用
const containerRef = ref<HTMLElement | null>(null)

/**
 * 🔥 触发属性变化事件
 * 当配置面板属性修改时，通知组件触发相应的交互事件
 */
const triggerPropertyChangeEvents = (newConfig: any, oldConfig: any) => {
  console.log('[INTERACTION-DEBUG] 触发属性变化事件:', {
    nodeId: props.nodeId,
    newConfig,
    oldConfig
  })

  // 从配置中提取实际属性值
  const extractProperties = (config: any) => {
    if (!config) return {}

    // 尝试多种路径提取配置
    if (config.properties) {
      return config.properties
    }
    if (config.component && config.component.properties) {
      return config.component.properties
    }
    return config
  }

  const newProps = extractProperties(newConfig)
  const oldProps = extractProperties(oldConfig)

  // 比较属性变化
  const changedProperties: Array<{ property: string; oldValue: any; newValue: any }> = []

  // 检查所有新属性
  for (const [key, newValue] of Object.entries(newProps)) {
    const oldValue = oldProps[key]
    if (JSON.stringify(newValue) !== JSON.stringify(oldValue)) {
      changedProperties.push({
        property: key,
        oldValue,
        newValue
      })
    }
  }

  // 为每个变化的属性触发 dataChange 事件
  changedProperties.forEach(({ property, oldValue, newValue }) => {
    console.log(`[INTERACTION-DEBUG] 属性 ${property} 从 ${oldValue} 变为 ${newValue}`)

    // 使用 interactionManager 直接触发事件
    if (currentComponentRef.value && typeof currentComponentRef.value.triggerInteractionEvent === 'function') {
      try {
        currentComponentRef.value.triggerInteractionEvent('dataChange', {
          property,
          oldValue,
          newValue,
          source: 'configuration-panel'
        })
        console.log(`[INTERACTION-DEBUG] 成功触发 ${property} 的 dataChange 事件`)
      } catch (error) {
        console.error(`[INTERACTION-DEBUG] 触发 ${property} dataChange 事件失败:`, error)
      }
    } else {
      console.warn('[INTERACTION-DEBUG] 组件实例或 triggerInteractionEvent 方法不可用')
    }
  })
}

// 处理数据源订阅
const handleDataSource = (dataSource: any) => {
  // 取消之前的订阅
  if (currentSubscriberId) {
    currentSubscriberId() // 调用取消订阅函数
    currentSubscriberId = null
  }

  // 重置数据源值
  dataSourceValue.value = null

  // 如果有新的数据源且配置完整，订阅它
  if (dataSource && isDataSourceValid(dataSource)) {
    // TODO: 实现数据源管理器订阅
    // currentSubscriberId = dataSourceManager.subscribe(dataSource, value => {
    //   dataSourceValue.value = value
    // })
    console.log('[INTERACTION-DEBUG] 数据源管理器尚未实现，跳过订阅', dataSource)
  }
}

// 检查数据源配置是否有效
const isDataSourceValid = (dataSource: any): boolean => {
  if (!dataSource) return false

  // 检查基本配置
  if (!dataSource.type || !dataSource.enabled) {
    return false
  }

  // 根据数据源类型进行不同的验证
  switch (dataSource.type) {
    case 'static':
      // 静态数据源只需要有数据即可
      return dataSource.data !== undefined

    case 'device':
      // 设备数据源需要更详细的配置
      if (!dataSource.deviceId || !dataSource.metricsType || !dataSource.metricsId) {
        return false
      }
      return true

    case 'http':
      // HTTP数据源需要URL
      return !!dataSource.url

    case 'websocket':
      // WebSocket数据源需要URL
      return !!dataSource.url

    default:
      return false
  }
}

// 监听数据源变化
watch(
  () => props.dataSource,
  newDataSource => {
    handleDataSource(newDataSource)
  },
  { immediate: true, deep: true }
)

// 🔥 修复：添加VisualEditorBridge数据更新监听，解决刷新后无数据问题
// 设置VisualEditorBridge数据监听
if (!executorDataCleanup) {
  executorDataCleanup = visualEditorBridge.onDataUpdate((componentId: string, data: any) => {
    if (componentId === props.nodeId) {
      console.log(`🔄 [Card2Wrapper] 接收到VisualEditorBridge数据更新: ${componentId}`, data)
      executorData.value = data || {}
      // 触发组件强制更新，确保新数据生效
      forceUpdateKey.value++
    }
  })
  console.log(`✅ [Card2Wrapper] VisualEditorBridge数据监听已建立: ${props.nodeId}`)
}

// 组件卸载时清理
onBeforeUnmount(() => {
  if (currentSubscriberId) {
    currentSubscriberId() // 调用取消订阅函数
    currentSubscriberId = null
  }

  // 🔥 新增：清理执行器数据监听器
  if (executorDataCleanup) {
    executorDataCleanup()
    executorDataCleanup = null
  }

  // 🔥 架构修复：清理执行器注册
  const componentExecutorRegistry = inject<Map<string, () => Promise<void>>>('componentExecutorRegistry')
  if (componentExecutorRegistry) {
    componentExecutorRegistry.delete(props.nodeId)
    console.log(`🗑️ [Card2Wrapper] 已清理执行器注册: ${props.nodeId}`)
  }
})

/**
 * 提取组件配置数据
 * 将Visual Editor的配置格式转换为组件期望的格式
 */
const extractComponentConfig = () => {
  console.log('[INTERACTION-DEBUG] 提取组件配置:', {
    nodeId: props.nodeId,
    componentType: props.componentType,
    originalConfig: props.config
  })

  // 尝试多种路径提取配置
  let configData = null

  // 1. 直接使用config
  if (props.config && typeof props.config === 'object') {
    // 检查是否直接包含配置属性
    if (props.config.title || props.config.content || props.config.backgroundColor || props.config.showTitle) {
      configData = props.config
      console.log('[INTERACTION-DEBUG] 使用直接配置:', configData)
    }
    // 检查是否在properties中
    else if (props.config.properties && typeof props.config.properties === 'object') {
      const propsConfig = props.config.properties
      if (propsConfig.title || propsConfig.content || propsConfig.backgroundColor || propsConfig.showTitle) {
        configData = propsConfig
        console.log('[INTERACTION-DEBUG] 使用properties配置:', configData)
      }
    }
  }

  // 2. 如果还没找到配置，返回默认配置
  if (!configData) {
    console.log('[INTERACTION-DEBUG] 使用默认配置')
    configData = {
      title: $t('visualEditor.testTitle'),
      showTitle: true,
      content: $t('visualEditor.testContent'),
      backgroundColor: '#f0f8ff',
      textColor: '#333333',
      showButton: true,
      buttonText: $t('visualEditor.buttonText'),
      buttonType: 'primary',
      fontSize: 14,
      padding: 16,
      borderRadius: 8
    }
  }

  // 🔥 合并来自InteractionManager的状态更新
  const interactionState = interactionManager.getComponentState(props.nodeId || '')
  if (interactionState) {
    console.log('[INTERACTION-DEBUG] 应用交互状态更新:', interactionState)
    configData = { ...configData, ...interactionState }
  }

  // 🔥 修复：合并dataSourcesConfig中的dataSourceBindings
  if (props.dataSourcesConfig && props.dataSourcesConfig.dataSourceBindings) {
    console.log('[INTERACTION-DEBUG] 合并数据源绑定配置:', props.dataSourcesConfig.dataSourceBindings)
    configData = { ...configData, dataSourceBindings: props.dataSourcesConfig.dataSourceBindings }
  }

  console.log('[INTERACTION-DEBUG] 最终配置:', configData)
  return configData
}

const loadComponent = async () => {
  try {
    hasError.value = false
    errorMessage.value = ''
    console.log(`[Card2Wrapper] [${props.nodeId}] 开始加载组件: ${props.componentType}`)

    // 🔥 修复：确保Card2集成已初始化
    if (!card2Integration.isInitialized.value) {
      console.log(`[Card2Wrapper] [${props.nodeId}] 等待Card2集成初始化...`)
      await card2Integration.initialize()
    }

    // 🔥 修复：使用正确的Card2集成API
    const componentDefinition = card2Integration.getComponentDefinition(props.componentType)
    if (!componentDefinition) {
      throw new Error(`组件定义不存在: ${props.componentType}`)
    }

    const component = await card2Integration.getComponent(props.componentType)

    if (!component) {
      console.error(`[Card2Wrapper] [${props.nodeId}] 错误：组件 [${props.componentType}] 的实现不存在。`)
      throw new Error(`组件 [${props.componentType}] 的组件实现不存在。`)
    }

    console.log(`[Card2Wrapper] [${props.nodeId}] 准备渲染组件...`, component)
    componentToRender.value = component
    console.log(`[Card2Wrapper] [${props.nodeId}] ✅ 组件加载成功: ${props.componentType}`)
  } catch (error: any) {
    console.error(`[Card2Wrapper] [${props.nodeId}] ❌ Card 2.1 组件加载失败 [${props.componentType}]:`, error)
    hasError.value = true
    errorMessage.value = error.message || $t('visualEditor.unknownError')
    componentToRender.value = null
  }
}

// 监听组件类型变化，例如在编辑器中切换组件类型
watch(() => props.componentType, loadComponent, { immediate: true })

// 监听config变化，确保配置更新时组件重新渲染
watch(
  () => props.config,
  (newConfig, oldConfig) => {
    console.log('[Card2Wrapper] 配置变化:', {
      nodeId: props.nodeId,
      newConfig,
      oldConfig
    })

    // 🔥 触发属性变化事件给组件
    if (newConfig && oldConfig && currentComponentRef.value) {
      triggerPropertyChangeEvents(newConfig, oldConfig)
    }

    // 配置变化时强制重新渲染
    if (componentToRender.value) {
      // 通过key变化强制重新渲染组件
      componentToRender.value = { ...componentToRender.value }
    }
  },
  { deep: true }
)

// 监听data变化，用于调试
watch(
  () => props.data,
  newData => {
    console.log('🔧 [Card2Wrapper] 接收到新的data prop:', newData)
  },
  { deep: true, immediate: true }
)

// 监听dataSources变化，用于调试
watch(
  () => props.dataSources,
  newDataSources => {
    console.log('🔧 [Card2Wrapper] 接收到新的dataSources prop:', newDataSources)
  },
  { deep: true, immediate: true }
)

// 监听dataSourcesConfig变化，用于调试
watch(
  () => props.dataSourcesConfig,
  newDataSourcesConfig => {
    console.log('🔧 [Card2Wrapper] 接收到新的dataSourcesConfig prop:', newDataSourcesConfig)
  },
  { deep: true, immediate: true }
)

// 🔧 Card2Wrapper数据源传递 - 恢复原有分流架构
const getDataSourcesForComponent = () => {
  const dataSourcesConfigHasData =
    props.dataSourcesConfig?.dataSourceBindings && Object.keys(props.dataSourcesConfig.dataSourceBindings).length > 0

  const dataSourcesHasData =
    props.dataSources?.dataSourceBindings && Object.keys(props.dataSources.dataSourceBindings).length > 0

  // 🔥 修复：优先检查VisualEditorBridge的执行数据
  const executorDataHasData = executorData.value && Object.keys(executorData.value).length > 0

  if (executorDataHasData) {
    console.log('🔥 [Card2Wrapper] 传递 VisualEditorBridge 执行数据到组件', {
      executorData: executorData.value,
      componentId: props.nodeId
    })
    // 返回executorData，格式化为组件期望的格式
    return {
      dataSourceBindings: {
        dataSource1: executorData.value
      }
    }
  } else if (dataSourcesConfigHasData) {
    console.log('🔧 [Card2Wrapper] 传递 dataSourcesConfig 到组件', {
      bindingKeys: Object.keys(props.dataSourcesConfig.dataSourceBindings),
      fullConfig: props.dataSourcesConfig
    })
    return props.dataSourcesConfig
  } else if (dataSourcesHasData) {
    console.log('🔧 [Card2Wrapper] 传递 dataSources 到组件', {
      bindingKeys: Object.keys(props.dataSources.dataSourceBindings),
      fullData: props.dataSources
    })
    return props.dataSources
  }

  console.log('🔧 [Card2Wrapper] 无有效数据源配置')
  return null
}

// 🔥 新增：获取组件特定的props（使用通用映射器）
const getComponentSpecificProps = () => {
  console.log('🔥 [Card2Wrapper] 开始通用数据源映射，组件类型:', props.componentType)
  console.log('🔥 [Card2Wrapper] 执行器数据:', executorData.value)

  // 🔥 使用通用数据源映射器
  const specificProps = DataSourceMapper.mapDataSources(props.componentType, executorData.value)

  // 🔥 验证映射结果
  const validation = DataSourceMapper.validateMapping(props.componentType, specificProps)
  if (!validation.isValid) {
    console.warn('⚠️ [Card2Wrapper] 数据源映射验证失败:', validation)
  }

  // 🔥 获取映射统计信息
  const stats = DataSourceMapper.getMappingStats(props.componentType, executorData.value)
  console.log('📊 [Card2Wrapper] 映射统计:', stats)

  console.log('✅ [Card2Wrapper] 通用映射结果:', specificProps)
  return specificProps
}

// 架构简化：直接使用config，不做复杂合并

// 监听metadata变化，用于调试
watch(
  () => props.metadata,
  newMetadata => {
    console.log('🔧 [Card2Wrapper] 接收到新的metadata prop:', newMetadata)
    if (newMetadata?.dataConfig) {
      console.log('🎯 [Card2Wrapper] 检测到dataConfig配置:', newMetadata.dataConfig)
    }
  },
  { deep: true, immediate: true }
)

onMounted(async () => {
  console.log('🔧 [Card2Wrapper] 组件挂载，当前props:', props)
  const dataSourcesForComponent = getDataSourcesForComponent()
  console.log('🔧 [Card2Wrapper] 传递给组件的数据源:', dataSourcesForComponent)
  console.log('🔧 [Card2Wrapper] 组件类型:', props.componentType)
  console.log('🔧 [Card2Wrapper] 组件实例:', componentToRender.value)

  // 🔥 架构修复：注册组件执行器到EditorDataSourceManager
  const componentExecutorRegistry = inject<Map<string, () => Promise<void>>>('componentExecutorRegistry')
  if (componentExecutorRegistry) {
    // 创建统一的执行器函数
    const unifiedExecutor = async () => {
      console.log(`🚀 [Card2Wrapper] 统一执行器被调用: ${props.nodeId}`)

      // 获取最新配置
      const config = configurationManager.getConfiguration(props.nodeId)
      if (config?.dataSource) {
        const dataSourceConfig = config.dataSource.config || config.dataSource
        const result = await visualEditorBridge.updateComponentExecutor(
          props.nodeId,
          props.componentType,
          dataSourceConfig
        )
        console.log(`✅ [Card2Wrapper] 统一执行器完成: ${props.nodeId}`, result)
      } else {
        console.log(`ℹ️ [Card2Wrapper] 无数据源配置，跳过执行: ${props.nodeId}`)
      }
    }

    componentExecutorRegistry.set(props.nodeId, unifiedExecutor)
    console.log(`📝 [Card2Wrapper] 执行器已注册到EditorDataSourceManager: ${props.nodeId}`)
  } else {
    console.warn('❌ [Card2Wrapper] 未找到componentExecutorRegistry，无法注册执行器')
  }

  if (!componentToRender.value) {
    loadComponent()
  }

  // 🔥 修复：等待配置恢复完成后再尝试获取配置
  // 这解决了页面刷新后ConfigurationManager内存状态丢失的问题
  const waitForConfigurationRestore = async () => {
    let retryCount = 0
    const maxRetries = 10 // 最多重试10次
    const retryDelay = 100 // 每次重试间隔100ms

    while (retryCount < maxRetries) {
      const savedConfig = configurationManager.getConfiguration(props.nodeId)
      console.log(`🔍 [Card2Wrapper] 尝试获取配置 (${retryCount + 1}/${maxRetries}):`, props.nodeId, savedConfig)

      if (savedConfig?.dataSource) {
        console.log('✅ [Card2Wrapper] 成功获取到保存的配置:', savedConfig)
        console.log('🔍 [Card2Wrapper] dataSource 配置详情:', savedConfig.dataSource)
        return savedConfig
      }

      retryCount++
      if (retryCount < maxRetries) {
        console.log(`⏳ [Card2Wrapper] 配置未就绪，${retryDelay}ms后重试...`)
        await new Promise(resolve => setTimeout(resolve, retryDelay))
      }
    }

    console.log('⚠️ [Card2Wrapper] 达到最大重试次数，未找到配置')
    return null
  }

  const savedConfig = await waitForConfigurationRestore()
  console.log('🔍 [Card2Wrapper] 最终获取的配置:', props.nodeId, savedConfig)

  // 🔥 修复时序问题：先注册回调，再执行更新
  // 监听VisualEditorBridge的数据更新
  executorDataCleanup = visualEditorBridge.onDataUpdate((componentId, data) => {
    if (componentId === props.nodeId) {
      console.log('🔥 [Card2Wrapper] 接收到执行器数据更新:', componentId, data)
      console.log('🔥 [Card2Wrapper] 接收到的data完整结构:', JSON.stringify(data, null, 2))

      // 🔥 修复：安全地检查接收到的数据详情
      if (data && data.dataSource1) {
        console.log('🔥 [Card2Wrapper] 接收到的dataSource1:', JSON.stringify(data.dataSource1, null, 2))
        console.log('🔥 [Card2Wrapper] 接收到的dataSource1.age:', data.dataSource1.age)
      } else {
        console.log('🔥 [Card2Wrapper] 接收到空数据或无dataSource1:', data)
      }

      // 🔥 调试：更新前的executorData状态
      console.log('🔥 [Card2Wrapper] 更新前executorData.value:', JSON.stringify(executorData.value, null, 2))

      executorData.value = { ...data }

      // 🔥 调试：更新后的executorData状态
      console.log('🔥 [Card2Wrapper] 更新后executorData.value:', JSON.stringify(executorData.value, null, 2))
      if (executorData.value.dataSource1) {
        console.log('🔥 [Card2Wrapper] 更新后dataSource1.age:', executorData.value.dataSource1.age)
      }

      // 强制重新渲染组件以应用新数据
      forceUpdateKey.value = Date.now()
      console.log('🔥 [Card2Wrapper] 强制重新渲染，forceUpdateKey:', forceUpdateKey.value)
    }
  })

  if (savedConfig?.dataSource) {
    console.log('🔥 [Card2Wrapper] 发现保存的数据源配置:', savedConfig.dataSource)
    console.log('🔍 [Card2Wrapper] 配置详细信息:', JSON.stringify(savedConfig.dataSource, null, 2))

    try {
      // 🔥 修复：使用整个dataSource配置而不是dataSource.config
      const dataSourceConfig = savedConfig.dataSource.config || savedConfig.dataSource
      const result = await visualEditorBridge.updateComponentExecutor(
        props.nodeId,
        props.componentType,
        dataSourceConfig
      )
      console.log('✅ [Card2Wrapper] 执行器恢复成功，结果:', props.nodeId, result)
    } catch (error) {
      console.error('❌ [Card2Wrapper] 执行器恢复失败:', props.nodeId, error)
    }
  } else {
    console.log('ℹ️ [Card2Wrapper] 无保存配置，完整配置:', savedConfig)
    console.log('ℹ️ [Card2Wrapper] 数据源配置:', savedConfig?.dataSource)

    // 🔥 架构修复：完全移除直接配置监听
    // EditorDataSourceManager 现在通过componentExecutorRegistry调用我们注册的统一执行器
    console.log(`📋 [Card2Wrapper] 组件 ${props.nodeId} 完全依赖EditorDataSourceManager统一调度`)
  }

  // 🔥 监听组件状态更新事件
  const handleStateUpdate = (event: CustomEvent) => {
    const { componentId, updates } = event.detail
    console.log('[INTERACTION-DEBUG] 接收到状态更新事件:', {
      componentId,
      updates,
      currentNodeId: props.nodeId
    })

    if (componentId === props.nodeId) {
      console.log('[INTERACTION-DEBUG] 状态更新匹配，强制重新渲染组件')
      // 强制重新渲染以应用状态更新
      forceUpdateKey.value = Date.now()
    }
  }

  // 监听DOM事件
  const containerEl = containerRef.value
  if (containerEl) {
    containerEl.addEventListener('componentStateUpdate', handleStateUpdate as EventListener)
  }

  // 清理函数
  onBeforeUnmount(() => {
    if (containerEl) {
      containerEl.removeEventListener('componentStateUpdate', handleStateUpdate as EventListener)
    }
  })
})
</script>

<style scoped>
.card2-wrapper {
  width: 100%;
  height: 100%;
  overflow: hidden;
  position: relative;
}

.error-overlay {
  padding: 8px;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
