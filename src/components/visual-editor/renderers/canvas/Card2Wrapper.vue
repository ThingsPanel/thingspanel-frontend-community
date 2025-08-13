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
      v-bind="mergedProps"
      :data="data"
      :metadata="metadata || { card2Data: data, dataSource: dataSource }"
      :dataSourceValue="dataSourceValue"
      :dataSources="dataSources"
      :dataSourcesConfig="dataSourcesConfig"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, shallowRef, onBeforeUnmount, computed, type Component } from 'vue'
import { NAlert } from 'naive-ui'
import { useEditor } from '../../hooks'
// import { dataSourceManager } from '../../core' // 临时注释，dataSourceManager 不存在
import { useWidgetStore } from '../../store/widget'
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

const editor = useEditor()
const card2Integration = editor.card2Integration
const widgetStore = useWidgetStore()

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

const loadComponent = async () => {
  try {
    hasError.value = false
    errorMessage.value = ''
    console.log(`[Card2Wrapper] [${props.nodeId}] 开始加载组件: ${props.componentType}`)

    const component = card2Integration.getComponent(props.componentType)

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

// V6: 计算映射后的数据源props - 基于targetProperty的通用解决方案
const mappedDataSourceProps = computed(() => {
  if (!props.dataSourcesConfig) {
    return {}
  }

  const config = props.dataSourcesConfig
  console.log('🎯 [Card2Wrapper] 为组件生成数据源props:', props.componentType, config)

  const result: Record<string, any> = {}

  if (config.dataSourceBindings) {
    // V6标准：根据组件定义的targetProperty生成props
    const componentDefinition = props.metadata?.card2Definition

    if (componentDefinition?.dataSources) {
      // 遍历组件定义的数据源
      componentDefinition.dataSources.forEach((dataSourceDef: any) => {
        const dataSourceKey = dataSourceDef.key
        const binding = config.dataSourceBindings[dataSourceKey]

        if (binding?.rawData) {
          try {
            const parsedData = JSON.parse(binding.rawData)
            console.log(`📊 [Card2Wrapper] 解析数据源 ${dataSourceKey}:`, parsedData)

            // 处理字段映射 vs 直接数据传递
            if (dataSourceDef.fieldsToMap && binding.fieldMappings) {
              let hasDirectDataMapping = false

              dataSourceDef.fieldsToMap.forEach((field: any) => {
                const targetProperty = field.targetProperty
                const mappingValue = binding.fieldMappings[field.key]

                if (targetProperty && mappingValue) {
                  // 检查targetProperty是否就是dataSourceKey（直接数据映射）
                  if (targetProperty === dataSourceKey) {
                    // 直接数据映射：将解析的数据设置到targetProperty
                    result[targetProperty] = parsedData
                    hasDirectDataMapping = true
                    console.log(`🎯 [Card2Wrapper] 直接数据映射 ${dataSourceKey} -> ${targetProperty}:`, parsedData)
                  } else {
                    // 字段路径映射：将映射路径设置到targetProperty
                    setNestedProperty(result, targetProperty, mappingValue)
                    console.log(`🎯 [Card2Wrapper] 路径映射 ${field.key} -> ${targetProperty}:`, mappingValue)
                  }
                }
              })

              // 如果没有直接数据映射，则设置数据源本身
              if (!hasDirectDataMapping && !result[dataSourceKey]) {
                result[dataSourceKey] = parsedData
                console.log(`📊 [Card2Wrapper] 补充设置数据源 ${dataSourceKey}:`, parsedData)
              }
            } else {
              // 无字段映射时直接设置数据源
              result[dataSourceKey] = parsedData
              console.log(`📊 [Card2Wrapper] 无映射直接设置数据源 ${dataSourceKey}:`, parsedData)
            }
          } catch (error) {
            console.warn(`⚠️ [Card2Wrapper] 数据源 ${dataSourceKey} JSON解析失败:`, error)
            result[dataSourceKey] = binding.rawData
          }
        }
      })
    } else {
      // 无组件定义时的回退逻辑
      Object.entries(config.dataSourceBindings).forEach(([key, binding]: [string, any]) => {
        if (binding.rawData) {
          try {
            const parsedData = JSON.parse(binding.rawData)
            result[key] = parsedData
          } catch (error) {
            result[key] = binding.rawData
          }
        }
      })
    }
  }

  // 兼容旧格式
  if (props.componentType === 'data-mapping-test') {
    Object.assign(result, {
      arrayDataSource: config.arrayDataSource || result.arrayDataSource || [],
      objectDataSource: config.objectDataSource || result.objectDataSource || {},
      arrayMappings: config.arrayMappings || result.arrayMappings || {},
      objectMappings: config.objectMappings || result.objectMappings || {}
    })
  }

  console.log('🎯 [Card2Wrapper] 最终生成的props:', result)
  return result
})

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

// 合并所有props
const mergedProps = computed(() => {
  return {
    ...props.config,
    ...mappedDataSourceProps.value
  }
})

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
  console.log('🔧 [Card2Wrapper] 映射后的数据源props:', mappedDataSourceProps.value)
  console.log('🔧 [Card2Wrapper] 合并后的props:', mergedProps.value)
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
