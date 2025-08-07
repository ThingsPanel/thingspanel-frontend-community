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
      v-bind="config"
      :metadata="{ card2Data: data, dataSource: dataSource }"
      :dataSourceValue="dataSourceValue"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, shallowRef, onBeforeUnmount, type Component } from 'vue'
import { NAlert } from 'naive-ui'
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
    currentSubscriberId = dataSourceManager.subscribe(dataSource, value => {
      dataSourceValue.value = value
    })
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
