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
      :config="extractComponentConfig"
      :raw-data-sources="safeDeepClone(getDataSourcesForComponent())"
      :component-id="props.nodeId"
      :show-interaction-indicator="true"
      :interaction-configs="props.interactionConfigs"
      :allow-external-control="props.allowExternalControl"
      :interaction-permissions="props.interactionPermissions"
      :preview-mode="props.previewMode"
      v-bind="getComponentSpecificProps()"
      @interaction-event="handleInteractionEvent"
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
import { configurationIntegrationBridge } from '@/components/visual-editor/configuration/ConfigurationIntegrationBridge'
// 🔥 导入通用数据源映射器
import { DataSourceMapper } from '@/card2.1/core/data-source-mapper'
import { smartDeepClone } from '@/utils/deep-clone'
import { visualEditorLogger } from '@/utils/logger'

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

// 强制更新键，用于触发组件重新渲染
const forceUpdateKey = ref(0)

// 🔥 组件实例引用，用于触发属性变化事件
const currentComponentRef = ref<any>(null)
// 🔥 容器引用
const containerRef = ref<HTMLElement | null>(null)

// 🔥 关键修复：响应式的配置覆盖，用于交互状态更新
const interactionConfigOverride = ref<Record<string, any>>({})

/**
 * 🔥 处理组件交互事件
 * 接收组件触发的交互事件并转发给interactionManager执行
 */
const handleInteractionEvent = (eventType: string, eventData?: any) => {
  try {
    // 确保有组件ID
    const componentId = props.nodeId
    if (!componentId) {
      console.warn('[Card2Wrapper] 缺少组件ID，无法处理交互事件')
      return
    }

    // 🔥 关键修复：直接调用interactionManager.triggerEvent
    const results = interactionManager.triggerEvent(componentId, eventType as any, eventData)

    // 记录执行结果（用于调试）
    if (results && results.length > 0) {
      visualEditorLogger.info(`[Card2Wrapper] 交互事件执行完成：${eventType}`, {
        componentId,
        results: results.map(r => ({
          success: r.success,
          action: r.action,
          error: r.error
        }))
      })
    }
  } catch (error) {
    console.error('[Card2Wrapper] 交互事件处理失败:', error)
    visualEditorLogger.error('[Card2Wrapper] 交互事件处理失败', { eventType, eventData, error })
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

// 默认配置常量，避免在计算属性中调用$t函数
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
  borderRadius: 8
}

/**
 * 提取组件配置数据
 * 将Visual Editor的配置格式转换为组件期望的格式
 * 🔥 关键修复：改为计算属性，响应interactionConfigOverride变化
 */
const extractComponentConfig = computed(() => {
  // 尝试多种路径提取配置
  let configData = null

  // 1. 直接使用config
  if (props.config && typeof props.config === 'object') {
    // 🔥 修复：检查配置是否包含任何非系统属性（更通用的判断）
    const configKeys = Object.keys(props.config)
    const validConfigKeys = configKeys.filter(
      key =>
        // 排除系统属性，包含任何可能的组件配置属性
        !['type', 'version', 'metadata', 'id'].includes(key) &&
        props.config[key] !== undefined &&
        props.config[key] !== null
    )
    const hasConfigurationData = validConfigKeys.length > 0

    if (hasConfigurationData) {
      configData = props.config
    }
    // 检查是否在properties中
    else if (props.config.properties && typeof props.config.properties === 'object') {
      const propsConfig = props.config.properties
      const hasPropsConfigurationData = Object.keys(propsConfig).some(
        key =>
          !['type', 'version', 'metadata', 'id'].includes(key) &&
          propsConfig[key] !== undefined &&
          propsConfig[key] !== null
      )

      if (hasPropsConfigurationData) {
        configData = propsConfig
      }
    }

    // 🔥 修复：优先检查新三文件架构的customize配置结构
    if (!configData && props.config.customize && typeof props.config.customize === 'object') {
      const customizeConfig = props.config.customize
      const hasCustomizeConfigData = Object.keys(customizeConfig).some(
        key => customizeConfig[key] !== undefined && customizeConfig[key] !== null
      )

      if (hasCustomizeConfigData) {
        // 🔥 重要修复：不能只返回customize，要合并整个config
        configData = {
          ...props.config,
          ...customizeConfig  // customize属性扁平化到根级别
        }
      }
    }

    // 🔥 修复：如果配置包含嵌套结构，扁平化customize部分
    if (configData && configData.customize && typeof configData.customize === 'object') {
      const customizeConfig = configData.customize
      const hasCustomizeConfigData = Object.keys(customizeConfig).some(
        key => customizeConfig[key] !== undefined && customizeConfig[key] !== null
      )

      if (hasCustomizeConfigData) {
        // 🔥 关键修复：保留所有配置，同时扁平化customize（customize优先级更高）
        configData = {
          ...configData,
          ...customizeConfig  // customize属性扁平化到根级别，覆盖同名属性
        }
      }
    }
  }

  // 2. 如果还没找到配置，返回默认配置
  if (!configData) {
    configData = { ...defaultConfig }
  }

  // 🔥 合并来自InteractionManager的状态更新
  const interactionState = interactionManager.getComponentState(props.nodeId || '')
  if (interactionState) {
    configData = { ...configData, ...interactionState }
  }

  // 🔥 关键修复：合并响应式的交互配置覆盖
  if (Object.keys(interactionConfigOverride.value).length > 0) {
    // 深度合并嵌套对象，特别是customize属性
    const mergeDeep = (target: any, source: any): any => {
      const result = { ...target }
      for (const key in source) {
        if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
          result[key] = mergeDeep(result[key] || {}, source[key])
        } else {
          result[key] = source[key]
        }
      }
      return result
    }
    
    configData = mergeDeep(configData, interactionConfigOverride.value)
    
    // 🔥 关键修复：交互配置合并后，再次扁平化customize属性
    if (configData.customize && typeof configData.customize === 'object') {
      configData = {
        ...configData,
        ...configData.customize  // 确保customize中的属性覆盖根级别同名属性
      }
      
      visualEditorLogger.info('[Card2Wrapper] 交互配置合并后扁平化', {
        componentId: props.nodeId,
        customizeProps: configData.customize,
        finalThemeColor: configData.themeColor
      })
    }
    
    visualEditorLogger.info('[Card2Wrapper] 配置合并完成', {
      componentId: props.nodeId,
      originalConfig: configData,
      override: interactionConfigOverride.value,
      finalConfig: configData
    })
  }

  // 🔥 修复：合并dataSourcesConfig中的dataSourceBindings
  if (props.dataSourcesConfig && props.dataSourcesConfig.dataSourceBindings) {
    configData = { ...configData, dataSourceBindings: props.dataSourcesConfig.dataSourceBindings }
  }
  return configData
})

const loadComponent = async () => {
  try {
    hasError.value = false
    errorMessage.value = ''

    // 🔥 修复：确保Card2集成已初始化
    if (!card2Integration.isInitialized.value) {
      await card2Integration.initialize()
    }

    // 🔥 修复：使用正确的Card2集成API
    const componentDefinition = card2Integration.getComponentDefinition(props.componentType)
    if (!componentDefinition) {
      throw new Error(`组件定义不存在: ${props.componentType}`)
    }

    const component = await card2Integration.getComponent(props.componentType)

    if (!component) {
      throw new Error(`组件 [${props.componentType}] 的组件实现不存在。`)
    }
    componentToRender.value = component
  } catch (error: any) {
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

  // 🔥 监听组件状态更新事件
  const handleStateUpdate = (event: CustomEvent) => {
    const { componentId, updates, fullState } = event.detail

    if (componentId === props.nodeId) {
      // 🔥 关键修复：将状态更新应用到组件配置中
      if (updates && Object.keys(updates).length > 0) {
        // 获取当前配置
        const currentConfig = extractComponentConfig.value || {}

        // 🔥 关键修复：将状态更新保存到响应式覆盖变量
        const newOverride = { ...interactionConfigOverride.value }
        
        for (const [key, value] of Object.entries(updates)) {
          if (key.includes('.')) {
            // 处理嵌套属性路径（如 customize.themeColor）
            const keys = key.split('.')
            let target = newOverride
            
            // 确保路径存在
            for (let i = 0; i < keys.length - 1; i++) {
              if (!target[keys[i]] || typeof target[keys[i]] !== 'object') {
                target[keys[i]] = {}
              }
              target = target[keys[i]]
            }
            
            // 设置最终值
            target[keys[keys.length - 1]] = value
            
            visualEditorLogger.info('[Card2Wrapper] 嵌套属性更新', {
              componentId: props.nodeId,
              propertyPath: key,
              newValue: value,
              updatedOverride: newOverride
            })
          } else {
            // 处理顶级属性
            newOverride[key] = value
          }
        }
        
        // 🔥 更新响应式覆盖配置，这将触发组件重新计算配置
        interactionConfigOverride.value = newOverride

        // 🔥 同时更新ConfigurationManager以确保持久化
        try {
          // 🔥 修复：使用深度合并，避免嵌套属性结构冲突
          const mergeDeep = (target: any, source: any): any => {
            const result = { ...target }
            for (const key in source) {
              if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                result[key] = mergeDeep(result[key] || {}, source[key])
              } else {
                result[key] = source[key]
              }
            }
            return result
          }
          
          const mergedConfig = mergeDeep(currentConfig, newOverride)
          configurationIntegrationBridge.updateConfiguration(props.nodeId, 'properties', mergedConfig)
          visualEditorLogger.info('[Card2Wrapper] 配置管理器更新成功', {
            componentId: props.nodeId,
            mergedConfig
          })
        } catch (error) {
          console.warn('[Card2Wrapper] 配置更新失败，继续使用强制重新渲染:', error)
        }
      }

      // 强制重新渲染以应用状态更新
      forceUpdateKey.value = Date.now()

      visualEditorLogger.info('[Card2Wrapper] 组件状态更新', {
        componentId: props.nodeId,
        updates,
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
