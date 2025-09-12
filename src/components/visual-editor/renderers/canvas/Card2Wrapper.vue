<template>
  <div
    ref="containerRef"
    class="card2-wrapper"
    :data-component-id="props.nodeId"
    @click="handleWrapperClick"
    @mouseenter="handleWrapperMouseEnter"
    @mouseleave="handleWrapperMouseLeave"
  >
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
      :custom-config="extractCustomConfig"
      :config="extractComponentConfig"
      :raw-data-sources="safeDeepClone(getDataSourcesForComponent())"
      :component-id="props.nodeId"
      :show-interaction-indicator="true"
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
import { useComponentTree as useCard2Integration } from '@/card2.1/hooks/useComponentTree'
import type { DataSourceValue } from '@/components/visual-editor/types/data-source'
// 🔥 新增：导入新架构的数据桥接器和配置管理器
import { getVisualEditorBridge } from '@/core/data-architecture/VisualEditorBridge'
import { configurationIntegrationBridge } from '@/components/visual-editor/configuration/ConfigurationIntegrationBridge'
// 🔥 导入通用数据源映射器
import { DataSourceMapper } from '@/card2.1/core/data-source-mapper'
import { smartDeepClone } from '@/utils/deep-clone'
import { visualEditorLogger } from '@/utils/logger'
// 🚀 导入配置合并管理器
import { ConfigMerge, ConfigMergeManager, type ConfigSource } from '@/card2.1/core/config-merge-manager'

// 🔥 使用统一的智能深拷贝工具，自动处理Vue响应式对象
const safeDeepClone = smartDeepClone

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

// 🔥 修复：获取当前端口的VisualEditorBridge实例，避免跨端口数据干扰
const visualEditorBridge = getVisualEditorBridge()

// 🔥 关键修复：注入 editor context 用于真正的配置同步
const editorContext = inject('editorContext', null) as any

// 强制更新键，用于触发组件重新渲染
const forceUpdateKey = ref(0)

// 🔥 组件实例引用，用于触发属性变化事件
const currentComponentRef = ref<any>(null)
// 🔥 容器引用
const containerRef = ref<HTMLElement | null>(null)

// 🚀 使用统一的配置管理系统
const configSources = ref<Partial<Record<ConfigSource, any>>>({})
const configSourceMap = ref<Record<string, ConfigSource>>({})
const lastConfigMergeTime = ref(0)

/**
 * 🔥 统一的交互事件处理 - 在Wrapper层拦截和处理所有交互
 * 子组件无需了解交互系统，只需要发送标准DOM事件
 */
const handleWrapperClick = (event: MouseEvent) => {
  // 只在预览模式下处理交互
  if (!props.previewMode) return

  try {
    const componentId = props.nodeId
    if (!componentId) {
      console.error('[Card2Wrapper] 缺少组件ID，无法处理点击交互')
      return
    }

    // 构建事件数据
    const eventData = {
      componentId,
      timestamp: new Date().toISOString(),
      mouseEvent: {
        x: event.clientX,
        y: event.clientY,
        button: event.button
      }
    }

    // 直接调用interactionManager处理点击事件
    const results = interactionManager.triggerEvent(componentId, 'click', eventData)

    // 记录执行结果
    if (results && results.length > 0) {
      visualEditorLogger.info(`[Card2Wrapper] 点击交互执行完成`, {
        componentId,
        results: results.map(r => ({
          success: r.success,
          action: r.action,
          error: r.error
        }))
      })
    }
  } catch (error) {
    console.error('[Card2Wrapper] 点击交互处理失败:', error)
    visualEditorLogger.error('[Card2Wrapper] 点击交互处理失败', { error })
  }
}

/**
 * 🔥 处理鼠标进入事件
 */
const handleWrapperMouseEnter = (event: MouseEvent) => {
  if (!props.previewMode) return

  try {
    const componentId = props.nodeId
    if (!componentId) return

    const eventData = {
      componentId,
      timestamp: new Date().toISOString(),
      hoverType: 'enter' as const
    }

    const results = interactionManager.triggerEvent(componentId, 'hover', eventData)

    if (results && results.length > 0) {
      visualEditorLogger.info(`[Card2Wrapper] 悬停进入交互执行完成`, {
        componentId,
        resultsCount: results.length
      })
    }
  } catch (error) {
    console.error('[Card2Wrapper] 悬停进入交互处理失败:', error)
  }
}

/**
 * 🔥 处理鼠标离开事件
 */
const handleWrapperMouseLeave = (event: MouseEvent) => {
  if (!props.previewMode) return

  try {
    const componentId = props.nodeId
    if (!componentId) return

    const eventData = {
      componentId,
      timestamp: new Date().toISOString(),
      hoverType: 'leave' as const
    }

    const results = interactionManager.triggerEvent(componentId, 'hover', eventData)

    if (results && results.length > 0) {
      visualEditorLogger.info(`[Card2Wrapper] 悬停离开交互执行完成`, {
        componentId,
        resultsCount: results.length
      })
    }
  } catch (error) {
    console.error('[Card2Wrapper] 悬停离开交互处理失败:', error)
  }
}

/**
 * 🔥 触发属性变化事件
 * 当配置面板属性修改时，通知组件触发相应的交互事件
 */
const triggerPropertyChangeEvents = (newConfig: any, oldConfig: any) => {
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
    // 使用 interactionManager 直接触发事件
    if (currentComponentRef.value && typeof currentComponentRef.value.triggerInteractionEvent === 'function') {
      try {
        currentComponentRef.value.triggerInteractionEvent('dataChange', {
          property,
          oldValue,
          newValue,
          source: 'configuration-panel'
        })
      } catch (error) {}
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
      executorData.value = data || {}
      // 触发组件强制更新，确保新数据生效
      forceUpdateKey.value++
    }
  })
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

  // 🔥 新增：清理HTTP数据源映射
  interactionManager.unregisterHttpDataSource(props.nodeId)

  // 🔥 关键修复：清理交互配置注册
  try {
    const configs = props.interactionConfigs || []
    interactionManager.unregisterComponent(props.nodeId, configs)
    visualEditorLogger.info('[Card2Wrapper] 交互配置清理成功', {
      componentId: props.nodeId
    })
  } catch (error) {
    console.error('[Card2Wrapper] 交互配置清理失败:', error)
  }

  // 🔥 架构修复：清理执行器注册
  const componentExecutorRegistry = inject<Map<string, () => Promise<void>>>('componentExecutorRegistry')
  if (componentExecutorRegistry) {
    componentExecutorRegistry.delete(props.nodeId)
  }
})

// 🔥 临时简化修复：使用基础默认配置避免复杂性
const defaultConfig = {
  title: '测试标题',
  showTitle: true,
  content: '测试内容',
  backgroundColor: '#f0f8ff',
  textColor: '#333333',
  showButton: true,
  buttonText: '按钮文本',
  buttonType: 'primary',
  fontSize: 14,
  padding: 16,
  borderRadius: 8,
  // 🔥 手动添加常见的数据源属性，确保交互系统能正常工作
  dataSource1Label: '数据源1',
  dataSource2Label: '数据源2',
  dataSource3Label: '数据源3'
}

/**
 * 🚀 优化3：使用统一配置合并策略系统
 * 智能合并多个配置源，处理优先级冲突
 */
/**
 * 🔥 修复：智能处理Card2.1配置格式
 * 优先使用已有的结构化config，回退到从扁平化config构建
 */
const extractCustomConfig = computed(() => {
  const rawConfig = extractComponentConfig.value

  if (process.env.NODE_ENV === 'development') {
  }

  // 🚀 关键修复：如果rawConfig已经是结构化的Card2.1格式，直接使用
  if (rawConfig && typeof rawConfig === 'object' && rawConfig.customize) {
    if (process.env.NODE_ENV === 'development') {
    }
    return rawConfig
  }

  // 回退：从扁平化config构建结构化config
  const customConfig = {
    type: props.componentType,
    root: {
      transform: {
        rotate: rawConfig?.rotate || 0,
        scale: rawConfig?.scale || 1
      }
    },
    customize: { ...rawConfig }
  }

  // 从customize中移除root层级的属性
  if (customConfig.customize) {
    delete customConfig.customize.rotate
    delete customConfig.customize.scale
  }

  if (process.env.NODE_ENV === 'development') {
  }

  return customConfig
})

const extractComponentConfig = computed(() => {
  // 🚀 准备各种配置源
  const configSources: Partial<Record<ConfigSource, any>> = {}

  // 🔥 关键修复：优先从metadata中获取Card2.1组件的真实配置
  let componentDefaultConfig = { ...defaultConfig }
  if (props.metadata?.card2Definition?.config) {
    if (process.env.NODE_ENV === 'development') {
    }
    componentDefaultConfig = props.metadata.card2Definition.config
  }

  // 1. 默认配置（现在是真实的组件配置）
  configSources.default = { ...componentDefaultConfig }

  // 2. 用户配置（来自Visual Editor）
  if (props.config && typeof props.config === 'object') {
    let userConfig = null

    // 处理不同的配置结构
    const configKeys = Object.keys(props.config)
    const validConfigKeys = configKeys.filter(
      key =>
        !['type', 'version', 'metadata', 'id'].includes(key) &&
        props.config[key] !== undefined &&
        props.config[key] !== null
    )

    if (validConfigKeys.length > 0) {
      userConfig = props.config
    }
    // 检查properties中的配置
    else if (props.config.properties) {
      userConfig = props.config.properties
    }

    if (userConfig) {
      // 处理customize结构的扁平化
      if (userConfig.customize && typeof userConfig.customize === 'object') {
        userConfig = {
          ...userConfig,
          ...userConfig.customize // 扁平化customize属性
        }
      }
      configSources.user = userConfig
    }
  }

  // 3. 数据源绑定配置
  if (props.dataSourcesConfig?.dataSourceBindings) {
    configSources.dataSource = {
      dataSourceBindings: props.dataSourcesConfig.dataSourceBindings
    }
  }

  // 4. 交互覆盖配置 - 添加响应式依赖
  const interactionState = interactionManager.getComponentState(props.nodeId || '')

  // 🔥 强制响应式依赖：确保在交互状态变化时重新计算
  const _ = forceUpdateKey.value // 添加响应式依赖

  // 🔥 详细调试交互状态获取
  if (process.env.NODE_ENV === 'development') {
  }

  if (interactionState && Object.keys(interactionState).length > 0) {
    // 🔥 彻底修复：直接将所有交互属性扁平化处理，统一与用户配置的处理方式
    const processedInteractionState: any = {}

    for (const [key, value] of Object.entries(interactionState)) {
      if (key.startsWith('customize.')) {
        // customize.xxx -> xxx (直接扁平化，不创建嵌套结构)
        const propertyName = key.substring('customize.'.length)
        processedInteractionState[propertyName] = value
      } else {
        // 根级别属性直接赋值
        processedInteractionState[key] = value
      }
    }

    configSources.interaction = processedInteractionState

    if (process.env.NODE_ENV === 'development') {
    }
  }

  // 5. 运行时配置（来自其他动态来源）
  // 预留接口，目前暂无

  // 🚀 使用统一的配置合并管理器 - 修复交互配置优先级
  const mergeResult = ConfigMerge.merge(configSources, {
    priorityOrder: ['default', 'user', 'dataSource', 'runtime', 'interaction'], // 交互配置最高优先级
    enableDeepMerge: true,
    preserveSource: true,
    enableChangeTracking: true
  })

  // 更新全局配置状态
  configSourceMap.value = mergeResult.sourceMap || {}
  lastConfigMergeTime.value = Date.now()

  // 📊 输出合并统计信息
  if (process.env.NODE_ENV === 'development') {
  }

  return mergeResult.merged
})

const loadComponent = async () => {
  try {
    hasError.value = false
    errorMessage.value = ''

    if (process.env.NODE_ENV === 'development') {
    }

    // 🔥 修复：使用 useComponentTree 的正确API
    // 检查是否还在加载中
    if (card2Integration.isLoading.value) {
      if (process.env.NODE_ENV === 'development') {
      }
      await card2Integration.initialize()
    }


    // 获取组件实例
    const component = await card2Integration.getComponent(props.componentType)

    if (process.env.NODE_ENV === 'development') {
    }

    if (!component) {
      throw new Error(`组件 [${props.componentType}] 的组件实现不存在。`)
    }

    componentToRender.value = component
    if (process.env.NODE_ENV === 'development') {
    }
  } catch (error: any) {
    console.error(`❌ [Card2Wrapper] 组件加载失败:`, error)
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
    // 🔥 关键修复：配置更新时，清理对应的交互覆盖
    if (newConfig && oldConfig) {
      // 检测哪些属性发生了变化
      const changedProperties: string[] = []

      // 检查customize中的变化
      if (newConfig.customize && oldConfig.customize) {
        for (const key in newConfig.customize) {
          if (newConfig.customize[key] !== oldConfig.customize[key]) {
            changedProperties.push(key)
          }
        }
      }

      // 检查根级别属性的变化
      for (const key in newConfig) {
        if (key !== 'customize' && newConfig[key] !== oldConfig[key]) {
          changedProperties.push(key)
        }
      }

      // 🚀 智能清理对应的交互覆盖（使用新配置合并系统）
      if (changedProperties.length > 0) {
        // 清理交互配置源中的对应属性
        if (configSources.value.interaction) {
          let needUpdate = false
          const currentInteractionConfig = { ...configSources.value.interaction }

          for (const prop of changedProperties) {
            // 清理根级别和嵌套结构中的属性
            if (currentInteractionConfig[prop] !== undefined) {
              delete currentInteractionConfig[prop]
              needUpdate = true
            }
            if (currentInteractionConfig.customize?.[prop] !== undefined) {
              delete currentInteractionConfig.customize[prop]
              needUpdate = true
            }

            // 清理源映射
            Object.keys(configSourceMap.value).forEach(key => {
              if (key === prop || key.includes(`${prop}.`)) {
                delete configSourceMap.value[key]
              }
            })
          }

          if (needUpdate) {
            configSources.value.interaction = currentInteractionConfig
            visualEditorLogger.info('[Card2Wrapper] 配置更新，智能清理交互覆盖', {
              componentId: props.nodeId,
              changedProperties,
              updatedInteractionConfig: currentInteractionConfig
            })
          }
        }
      }
    }

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
  newData => {},
  { deep: true, immediate: true }
)

// 监听dataSources变化，用于调试
watch(
  () => props.dataSources,
  newDataSources => {},
  { deep: true, immediate: true }
)

// 监听dataSourcesConfig变化，用于调试
watch(
  () => props.dataSourcesConfig,
  newDataSourcesConfig => {},
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
    // 返回executorData，格式化为组件期望的格式
    return {
      dataSourceBindings: {
        dataSource1: executorData.value
      }
    }
  } else if (dataSourcesConfigHasData) {
    return props.dataSourcesConfig
  } else if (dataSourcesHasData) {
    return props.dataSources
  }
  return null
}

// 🔥 新增：获取组件特定的props（使用通用映射器）
const getComponentSpecificProps = () => {
  // 🔥 使用通用数据源映射器
  const specificProps = DataSourceMapper.mapDataSources(props.componentType, executorData.value)

  // 🔥 验证映射结果
  const validation = DataSourceMapper.validateMapping(props.componentType, specificProps)
  // 🔥 获取映射统计信息
  const stats = DataSourceMapper.getMappingStats(props.componentType, executorData.value)

  // 🔍 调试信息 - 仅针对gauge-dashboard-v2组件
  if (props.componentType === 'gauge-dashboard-v2') {
    if (process.env.NODE_ENV === 'development') {
    }
  }

  return specificProps
}

// 架构简化：直接使用config，不做复杂合并

// 监听metadata变化，用于调试
watch(
  () => props.metadata,
  newMetadata => {},
  { deep: true, immediate: true }
)

onMounted(async () => {
  const dataSourcesForComponent = getDataSourcesForComponent()

  // 🔥 架构修复：注册组件执行器到EditorDataSourceManager
  const componentExecutorRegistry = inject<Map<string, () => Promise<void>>>('componentExecutorRegistry')
  if (componentExecutorRegistry) {
    // 创建统一的执行器函数
    const unifiedExecutor = async () => {
      // 获取最新配置
      const config = configurationIntegrationBridge.getConfiguration(props.nodeId)

      if (config?.dataSource) {
        // 🔥 修复：直接使用dataSource配置，无需再访问config属性
        const dataSourceConfig = config.dataSource
        const result = await visualEditorBridge.updateComponentExecutor(
          props.nodeId,
          props.componentType,
          dataSourceConfig
        )

        // 🔥 新增：注册HTTP数据源映射，用于属性变化时的响应式更新
        interactionManager.registerHttpDataSource(props.nodeId, props.componentType, dataSourceConfig)
      }
    }

    componentExecutorRegistry.set(props.nodeId, unifiedExecutor)
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
      const savedConfig = configurationIntegrationBridge.getConfiguration(props.nodeId)

      if (savedConfig?.dataSource) {
        return savedConfig
      }

      retryCount++
      if (retryCount < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, retryDelay))
      }
    }
    return null
  }

  const savedConfig = await waitForConfigurationRestore()

  // 🔥 修复时序问题：先注册回调，再执行更新
  // 监听VisualEditorBridge的数据更新
  executorDataCleanup = visualEditorBridge.onDataUpdate((componentId, data) => {
    if (componentId === props.nodeId) {
      // 🔥 修复：安全地检查接收到的数据详情

      // 🔥 调试：更新前的executorData状态

      executorData.value = { ...data }

      // 🔥 调试：更新后的executorData状态

      // 强制重新渲染组件以应用新数据
      forceUpdateKey.value = Date.now()
    }
  })

  if (savedConfig?.dataSource) {
    try {
      // 🔥 修复：直接使用整个dataSource配置
      const dataSourceConfig = savedConfig.dataSource

      const result = await visualEditorBridge.updateComponentExecutor(
        props.nodeId,
        props.componentType,
        dataSourceConfig
      )

      // 🔥 新增：注册HTTP数据源映射，用于属性变化时的响应式更新
      interactionManager.registerHttpDataSource(props.nodeId, props.componentType, dataSourceConfig)
    } catch (error) {}
  } else {
    // 🔥 架构修复：完全移除直接配置监听
    // EditorDataSourceManager 现在通过componentExecutorRegistry调用我们注册的统一执行器
  }

  // 🔥 关键修复：注册组件的交互配置
  const registerInteractionConfigs = () => {
    // 🔥 更强健的注册逻辑：即使没有配置也注册组件，支持后续动态添加配置
    const configs = props.interactionConfigs || []

    try {
      interactionManager.registerComponent(props.nodeId, configs)
      visualEditorLogger.info('[Card2Wrapper] 交互配置注册成功', {
        componentId: props.nodeId,
        configCount: configs.length,
        hasConfigs: configs.length > 0
      })
    } catch (error) {
      console.error('[Card2Wrapper] 交互配置注册失败:', error)
      visualEditorLogger.error('[Card2Wrapper] 交互配置注册失败', {
        componentId: props.nodeId,
        error,
        configs
      })
    }
  }

  registerInteractionConfigs()

  // 🔥 新增：监听交互配置变化并重新注册
  watch(
    () => props.interactionConfigs,
    newConfigs => {
      if (newConfigs) {
        try {
          interactionManager.updateComponentConfigs(props.nodeId, newConfigs)
          visualEditorLogger.info('[Card2Wrapper] 交互配置更新', {
            componentId: props.nodeId,
            configCount: newConfigs.length
          })
        } catch (error) {
          console.error('[Card2Wrapper] 交互配置更新失败:', error)
        }
      }
    },
    { deep: true, immediate: false }
  )

  // 🚀 智能处理组件状态更新事件（使用新配置合并系统）
  const handleStateUpdate = (event: CustomEvent) => {
    const { componentId, updates, fullState } = event.detail

    // 🔥 跨组件交互调试日志
    if (process.env.NODE_ENV === 'development') {
    }

    if (componentId === props.nodeId) {
      // 🚀 使用统一的配置合并系统处理状态更新
      if (updates && Object.keys(updates).length > 0) {
        // 🚀 使用智能更新处理交互覆盖
        const updateResult = ConfigMerge.smartUpdate(
          configSources.value.interaction || {},
          updates,
          'interaction',
          configSourceMap.value
        )

        if (updateResult.merged && Object.keys(updateResult.merged).length > 0) {
          // 更新交互配置源
          configSources.value.interaction = updateResult.merged

          // 更新源映射
          if (updateResult.sourceMap) {
            Object.assign(configSourceMap.value, updateResult.sourceMap)
          }

          // 📊 输出更新统计
          if (process.env.NODE_ENV === 'development') {
          }

          // 🔥 关键修复：触发 dataChange 事件，支持链式交互
          if (process.env.NODE_ENV === 'development') {
          }

          // 为每个变化的属性触发 dataChange 事件
          Object.entries(updates).forEach(([property, newValue]) => {
            // 🔥 修复：获取正确的旧值 - 应该从原始用户配置获取，而不是已经合并的配置
            let oldValue = extractComponentConfig.value[property]

            // 如果是customize.xxx属性，需要从扁平化的字段获取
            if (property.startsWith('customize.')) {
              const flattenedProperty = property.substring('customize.'.length)
              oldValue =
                configSources.value.user?.[flattenedProperty] || extractComponentConfig.value[flattenedProperty]
            }

            if (process.env.NODE_ENV === 'development') {
            }

            if (currentComponentRef.value && typeof currentComponentRef.value.triggerInteractionEvent === 'function') {
              try {
                if (process.env.NODE_ENV === 'development') {
                }

                currentComponentRef.value.triggerInteractionEvent('dataChange', {
                  property,
                  oldValue,
                  newValue,
                  source: 'cross-component-interaction'
                })

                if (process.env.NODE_ENV === 'development') {
                }
              } catch (error) {
                console.error(`❌ [Card2Wrapper] 触发dataChange事件失败:`, error)
              }
            } else {
              console.error(`⚠️ [Card2Wrapper] 无法触发dataChange事件`, {
                componentId: props.nodeId,
                property,
                hasComponentRef: !!currentComponentRef.value,
                triggerMethodType: currentComponentRef.value
                  ? typeof currentComponentRef.value.triggerInteractionEvent
                  : 'undefined'
              })
            }
          })

          // 🔥 关键修复：真正同步到 editorStore.nodes 中的配置
          try {
            const fullConfig = extractComponentConfig.value

            // 🔥 第一步：更新 ConfigurationManager（旧的配置系统）
            configurationIntegrationBridge.updateConfiguration(
              props.nodeId,
              'component',
              { properties: fullConfig },
              props.componentType
            )

            if (updates && Object.keys(updates).length > 0) {
              configurationIntegrationBridge.updateConfiguration(
                props.nodeId,
                'interaction',
                updates,
                props.componentType
              )
            }

            // 🔥 第二步：关键修复！同步到 editorStore.nodes[].properties
            // 这是配置面板真正读取的地方
            if (editorContext && editorContext.updateNode) {
              if (process.env.NODE_ENV === 'development') {
              }

              // 更新 editorStore 中的节点配置
              editorContext.updateNode(props.nodeId, {
                properties: fullConfig,
                metadata: {
                  ...editorContext.getNodeById(props.nodeId)?.metadata,
                  updatedAt: Date.now(),
                  lastInteractionUpdate: updates
                }
              })

              if (process.env.NODE_ENV === 'development') {
              }
            } else {
              console.error(`⚠️ [Card2Wrapper] 无法访问 editorContext，配置不会持久化`, {
                componentId: props.nodeId,
                hasEditorContext: !!editorContext,
                hasUpdateNode: editorContext?.updateNode
              })
            }

            visualEditorLogger.info('[Card2Wrapper] 完整配置同步成功', {
              componentId: props.nodeId,
              fullConfig,
              interactionUpdates: updateResult.merged,
              updatesApplied: updates,
              editorStoreSynced: !!editorContext
            })
          } catch (error) {
            console.error('[Card2Wrapper] 配置同步失败，继续使用强制重新渲染:', error)
          }
        }
      }

      // 强制重新渲染以应用状态更新
      forceUpdateKey.value = Date.now()

      visualEditorLogger.info('[Card2Wrapper] 组件状态更新完成', {
        componentId: props.nodeId,
        updates,
        configSources: Object.keys(configSources.value),
        forceUpdateKey: forceUpdateKey.value
      })
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
