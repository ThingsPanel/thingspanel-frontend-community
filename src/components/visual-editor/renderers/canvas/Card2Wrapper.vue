<template>
  <div ref="containerRef" class="card2-wrapper" :class="{ 'has-error': hasError }">
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
      :properties="config"
      :metadata="{ card2Data: data, dataSource: dataSource }"
      :dataSourceValue="dataSourceValue"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, shallowRef, onBeforeUnmount, type Component } from 'vue'
import { useEditor } from '../../hooks'
import { dataSourceManager } from '../../core'
import { useWidgetStore } from '../../store/widget'
import type { DataSourceValue } from '../../types/data-source'

interface Props {
  componentType: string
  config?: any
  data?: any // data prop暂时保留，但目前未使用
  dataSource?: any // 数据源配置
  nodeId: string
}

const props = defineProps<Props>()

const editor = useEditor()
const card2Integration = editor.card2Integration
const widgetStore = useWidgetStore()

// console.log('🔍 Card2Wrapper - useEditor 结果:', editor)
// console.log('🔍 Card2Wrapper - card2Integration:', card2Integration)

// State
const hasError = ref(false)
const errorMessage = ref('')
const componentToRender = shallowRef<Component | null>(null)
const dataSourceValue = ref<DataSourceValue | null>(null)
let currentSubscriberId: (() => void) | null = null

// 处理数据源订阅
const handleDataSource = (dataSource: any) => {
  // console.log('🔍 Card2Wrapper - 处理数据源变化:', {
  //   newDataSource: dataSource,
  //   currentSubscriberId
  // })

  // 取消之前的订阅
  if (currentSubscriberId) {
    currentSubscriberId() // 调用取消订阅函数
    currentSubscriberId = null
    // console.log('🔍 Card2Wrapper - 已取消之前的数据源订阅')
  }

  // 重置数据源值
  dataSourceValue.value = null

  // 如果有新的数据源且配置完整，订阅它
  if (dataSource && isDataSourceValid(dataSource)) {
    // console.log('🔍 Card2Wrapper - 开始订阅数据源:', {
    //   type: dataSource.type,
    //   name: dataSource.name,
    //   dataPaths: dataSource.dataPaths
    // })

    currentSubscriberId = dataSourceManager.subscribe(dataSource, value => {
      // console.log('🔍 Card2Wrapper - 收到数据源更新:', {
      //   values: value.values,
      //   rawData: value.rawData,
      //   dataPaths: value.metadata?.dataPaths
      // })
      dataSourceValue.value = value
    })

    // console.log('🔍 Card2Wrapper - 数据源订阅成功')
  } else {
    // console.log('🔍 Card2Wrapper - 数据源配置无效或未启用，跳过订阅')
  }
}

// 检查数据源配置是否有效
const isDataSourceValid = (dataSource: any): boolean => {
  if (!dataSource) return false

  // console.log('🔍 Card2Wrapper - 验证数据源配置:', {
  //   type: dataSource.type,
  //   enabled: dataSource.enabled,
  //   name: dataSource.name,
  //   dataPaths: dataSource.dataPaths
  // })

  // 检查基本配置
  if (!dataSource.type || !dataSource.enabled) {
    // console.log('🔍 Card2Wrapper - 数据源未启用或缺少类型，跳过订阅:', dataSource)
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
        // console.log('🔍 Card2Wrapper - 设备数据源配置不完整:', {
        //   deviceId: dataSource.deviceId,
        //   metricsType: dataSource.metricsType,
        //   metricsId: dataSource.metricsId
        // })
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
      // console.log('🔍 Card2Wrapper - 未知的数据源类型:', dataSource.type)
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
    console.log(`[Card2Wrapper] [${props.nodeId}] 1. 开始加载组件: ${props.componentType}`)

    const widgetDef = widgetStore.getWidget(props.componentType)
    console.log(`[Card2Wrapper] [${props.nodeId}] 2. 从 widgetStore 获取 widgetDef:`, widgetDef)

    let definition = null
    if (widgetDef && widgetDef.metadata && widgetDef.metadata.card2Definition) {
      definition = widgetDef.metadata.card2Definition
      console.log(`[Card2Wrapper] [${props.nodeId}] 3a. 从 widgetDef.metadata.card2Definition 获取:`, definition)
    } else if (widgetDef && widgetDef.metadata && widgetDef.metadata.isCard2Component) {
      console.log(`[Card2Wrapper] [${props.nodeId}] 3b. 发现 Card2.1 组件标记，从 card2Integration 获取...`)
      definition = card2Integration.getComponentDefinition(props.componentType)
    }

    if (!definition) {
      console.log(`[Card2Wrapper] [${props.nodeId}] 4. 从 card2Integration 获取组件定义...`)
      definition = card2Integration.getComponentDefinition(props.componentType)
    }

    if (!definition && props.componentType.startsWith('card21-')) {
      const cleanType = props.componentType.replace('card21-', '')
      console.log(`[Card2Wrapper] [${props.nodeId}] 5. 尝试无前缀类型 '${cleanType}'...`)
      definition = card2Integration.getComponentDefinition(cleanType)
    }

    console.log(`[Card2Wrapper] [${props.nodeId}] 6. 最终解析的组件定义:`, definition)

    if (!definition || !definition.component) {
      console.error(`[Card2Wrapper] [${props.nodeId}] 7. 错误：组件 [${props.componentType}] 的定义或实现不存在。`, {
        definition
      })
      throw new Error(`组件 [${props.componentType}] 的定义或组件实现不存在。`)
    }

    console.log(`[Card2Wrapper] [${props.nodeId}] 8. 准备渲染组件...`, definition.component)
    componentToRender.value = definition.component
    console.log(`[Card2Wrapper] [${props.nodeId}] 9. ✅ 组件加载成功: ${props.componentType}`)
  } catch (error: any) {
    console.error(`[Card2Wrapper] [${props.nodeId}] ❌ Card 2.1 组件加载失败 [${props.componentType}]:`, error)
    hasError.value = true
    errorMessage.value = error.message || '未知错误'
    componentToRender.value = null
  }
}

// 监听组件类型变化，例如在编辑器中切换组件类型
watch(() => props.componentType, loadComponent, { immediate: true })

onMounted(() => {
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
