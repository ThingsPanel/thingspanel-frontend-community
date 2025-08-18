<template>
  <div ref="containerRef" class="card2-wrapper">
    <!-- 错误状态 -->
    <div v-if="hasError" class="error-overlay">
      <n-alert type="error" :title="'渲染失败'" size="small">
        {{ errorMessage }}
      </n-alert>
    </div>

    <!-- 动态组件渲染 -->
    <component
      :is="componentToRender"
      v-else-if="componentToRender"
      :config="extractComponentConfig()"
      :raw-data-sources="JSON.parse(JSON.stringify(getDataSourcesForComponent()))"
      :component-id="props.nodeId"
      :show-interaction-indicator="true"
    />
  </div>
</template>

<script setup lang="ts">
/**
 * Card2.1 组件包装器
 * 🔥 已迁移到新的统一架构
 */

import { ref, onMounted, watch, shallowRef, onBeforeUnmount, computed, type Component } from 'vue'
import { NAlert } from 'naive-ui'
import { useVisualEditorIntegration as useCard2Integration } from '@/card2.1/hooks/useVisualEditorIntegration'
import type { DataSourceValue } from '../../types/data-source'

interface Props {
  componentType: string
  config?: any
  data?: any // data prop暂时保留，但目前未使用
  metadata?: any // 完整的metadata对象，包含dataConfig等配置
  dataSource?: any // 数据源配置
  dataSources?: Record<string, any> // 多数据源数据
  dataSourcesConfig?: any // 多数据源配置（包含路径映射等）
  nodeId: string
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
    console.log('[Card2Wrapper] 数据源管理器尚未实现，跳过订阅', dataSource)
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

// 组件卸载时清理
onBeforeUnmount(() => {
  if (currentSubscriberId) {
    currentSubscriberId() // 调用取消订阅函数
    currentSubscriberId = null
  }
})

/**
 * 提取组件配置数据
 * 将Visual Editor的配置格式转换为组件期望的格式
 */
const extractComponentConfig = () => {
  console.log('[Card2Wrapper] 提取组件配置:', {
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
      console.log('[Card2Wrapper] 使用直接配置:', configData)
    }
    // 检查是否在properties中
    else if (props.config.properties && typeof props.config.properties === 'object') {
      const propsConfig = props.config.properties
      if (propsConfig.title || propsConfig.content || propsConfig.backgroundColor || propsConfig.showTitle) {
        configData = propsConfig
        console.log('[Card2Wrapper] 使用properties配置:', configData)
      }
    }
  }

  // 2. 如果还没找到配置，返回默认配置
  if (!configData) {
    console.log('[Card2Wrapper] 使用默认配置')
    configData = {
      title: '测试标题',
      showTitle: true,
      content: '这是测试内容',
      backgroundColor: '#f0f8ff',
      textColor: '#333333',
      showButton: true,
      buttonText: '按钮',
      buttonType: 'primary',
      fontSize: 14,
      padding: 16,
      borderRadius: 8
    }
  }

  console.log('[Card2Wrapper] 最终配置:', configData)
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
    errorMessage.value = error.message || '未知错误'
    componentToRender.value = null
  }
}

// 监听组件类型变化，例如在编辑器中切换组件类型
watch(() => props.componentType, loadComponent, { immediate: true })

// 监听config变化，确保配置更新时组件重新渲染
watch(
  () => props.config,
  newConfig => {
    console.log('[Card2Wrapper] 配置变化:', {
      nodeId: props.nodeId,
      newConfig
    })
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

  if (dataSourcesConfigHasData) {
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

// 辅助函数：设置嵌套属性
function setNestedProperty(obj: any, path: string, value: any) {
  const keys = path.split('.')
  let current = obj

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i]
    if (!(key in current)) {
      current[key] = {}
    }
    current = current[key]
  }

  current[keys[keys.length - 1]] = value
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

onMounted(() => {
  console.log('🔧 [Card2Wrapper] 组件挂载，当前props:', props)
  const dataSourcesForComponent = getDataSourcesForComponent()
  console.log('🔧 [Card2Wrapper] 传递给组件的数据源:', dataSourcesForComponent)
  console.log('🔧 [Card2Wrapper] 组件类型:', props.componentType)
  console.log('🔧 [Card2Wrapper] 组件实例:', componentToRender.value)

  if (!componentToRender.value) {
    loadComponent()
  }
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
